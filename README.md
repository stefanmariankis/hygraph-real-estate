# Hygraph Real Estate

A read-only real estate site built on top of a [Hygraph](https://hygraph.com) Content API. It renders published properties with filtering, individual property pages, and agency pages — no database, no authentication, no backend of its own.

The site is a **static export**: `next build` emits a plain folder of HTML, CSS and JS that can be served straight from S3 + CloudFront with no Node runtime.

## Stack

- **Next.js 16** (App Router, React Server Components, `output: "export"`)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Plain `fetch`** for GraphQL — no Apollo, no `graphql-request`, no client-side data library

## Pages

| Route | What it does |
| --- | --- |
| `/` | Property grid with filters for city, neighbourhood, property type, listing type, and min/max price. Every filter is a URL search param, so a filtered view is shareable and survives a reload. |
| `/property/[slug]` | Photo gallery, key stats, details, description, features, a note about the city, agent contact cards, and client testimonials. |
| `/agency/[slug]` | Agency profile with logo, its agents, testimonials about the agency and its agents, and the de-duplicated union of all properties those agents handle. |

Rent prices render as `€550 / month`, sale prices as `€245,000`.

### How filtering works

Because the site is statically exported, the listing page cannot read search params on the server. Instead the whole published catalogue is baked into the page at build time and filtered in the browser, which also makes filtering instant.

The Suspense boundary around the filter bar renders the real, unfiltered grid as its fallback rather than a skeleton, so the exported HTML contains every property — crawlers and the first paint both get real content.

This is the right trade at this catalogue size. If it grows into the thousands, move filtering back to the API with a `where` argument and drop `output: "export"`.

## Running locally

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # then paste your own Content API URL
npm run dev
```

The dev server runs at [http://localhost:3000](http://localhost:3000), picking the next free port if 3000 is taken.

To preview the production output — note that `npm start` does **not** work for a static export:

```bash
npm run build
npx serve out
```

## Environment setup

```
NEXT_PUBLIC_HYGRAPH_ENDPOINT=https://eu-west-2.cdn.hygraph.com/content/<project-id>/master
```

Find it in Hygraph under **Project settings → API Access → Content API**, and copy the **High Performance Content API** URL.

It is a `NEXT_PUBLIC_` variable because the endpoint is a read-only CDN URL that only serves published content — there is no token and nothing to keep secret. `.env.local` is gitignored; `.env.example` is committed as the template.

## Deployment

`buildspec.yml` is an AWS CodeBuild spec that installs, builds, syncs the output to S3 and invalidates CloudFront.

- `BUILD_DIR` is `out`, which is what `next build` produces with `output: "export"`.
- `trailingSlash: true` is set in `next.config.ts` so each route becomes its own directory containing `index.html`. Without it the export writes `property/<slug>.html`, which S3 will not serve at `/property/<slug>`.

The site is fully static, so **content edited in Hygraph does not appear until the next build**. Wire a Hygraph webhook to the build if that matters.

## Content model

Seven models: `Property`, `Agent`, `Agency`, `Feature`, `City`, `Neighborhood`, `Testimonial`.

```
Property ──► City            many-to-one   a property is in one city
Property ──► Neighborhood    many-to-one   a property is in one neighbourhood
Property ──► Agent           many-to-many  a property can be listed by several agents
Property ──► Feature         many-to-many
Property ──► Asset           images, many
Neighborhood ──► City        many-to-one
Agent ──► Agency             the field is called `agencyName`
Testimonial ──► Agent        optional — a testimonial is about an agent…
Testimonial ──► Agency       …or about the agency as a whole
```

### API names that differ from the obvious guess

The queries were written against the live schema after an introspection pass, and follow the API rather than the assumption:

- **Enum values are camelCase**, not `SCREAMING_SNAKE` — `apartment`, `house`, `rent`, `sale`, `available`.
- **`Agent.agencyName`** is the relation to `Agency` (not `agency`).
- **`Agency.agentName`** is the populated relation to `Agent` (not `agents`). An `agent` field also exists on `Agency` but is empty.
- **`Agent.testimonial`** and **`Agency.testimonial`** are the reverse relations, singular in name, returning lists.
- **`Property.feature`** and **`Property.agent`** are singular names despite being many-to-many.
- **`Layout`** is stored in English (`detached`, `semiDetached`, `nonDetached`, `circular`) and describes how rooms connect to one another.

`City` used to be an enum and is now a model, so the list of cities comes from the API rather than from a constant in the code.

## Scripts

Helpers used to populate the CMS. All of them need a **mutation** token and the write endpoint (`api-*`, not `cdn`), which is different from the read-only URL the site uses.

| Script | What it does |
| --- | --- |
| `scripts/mutations-images.graphql` | Paste into the Hygraph API Playground: uploads 38 images from remote URLs and attaches them to properties, agents and agencies. |
| `scripts/mutations-models.graphql` | Same, for cities, neighbourhoods, testimonials, and linking properties to their city and neighbourhood. |
| `scripts/run-mutations.mjs` | Runs the image file end to end, with a preflight check and retries around publishing. |
| `scripts/seed-images.mjs` | Alternative image loader driven by a JS config rather than a GraphQL document. |
| `scripts/seed-models.mjs` | Alternative model seeder, idempotent via upserts. |
| `scripts/create-fields.mjs` | Creates the three Asset fields through the **Management API**, which is a different endpoint and token. Usually faster to click in the Schema UI. |

Two things worth knowing about the Hygraph API:

- Everything written through the API lands in **DRAFT**. It has to be published before the CDN endpoint returns it.
- Assets created from a `uploadUrl` are fetched in the background, so publishing one immediately can fail. The scripts wait and retry.

## Notes

Property titles come from the CMS and are written in Romanian. That is content, not interface copy, so it is edited in Hygraph rather than in this repo. The interface itself is entirely in English.
