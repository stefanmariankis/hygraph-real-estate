# Hygraph Real Estate

A read-only real estate listing UI built on top of a [Hygraph](https://hygraph.com) Content API. It renders published property listings with filtering, individual property pages, and agency pages — no database, no authentication, no backend of its own.

## Stack

- **Next.js 16** (App Router, React Server Components)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Plain `fetch`** for GraphQL — no Apollo, no `graphql-request`, no client-side data library

Data is fetched on the server in async Server Components and revalidated every 60 seconds. Property and agency pages are prerendered at build time via `generateStaticParams`.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Listing grid with filters for city, property type, listing type, and min/max price. Every filter is a URL search param, so a filtered view is shareable and survives a reload. Filters map onto Hygraph's `where` argument (`city`, `propertyType`, `listingType`, `price_gte`, `price_lte`). |
| `/property/[slug]` | Full property detail: gallery, key stats, details table, description, features, and agent contact cards. |
| `/agency/[slug]` | Agency profile, its agents, and the de-duplicated union of all listings those agents handle — fetched in a single nested query. |

Rent prices render as `€550 / month`, sale prices as `€245,000`.

## Running locally

Requires Node.js 20 or newer.

```bash
# 1. Install dependencies
npm install

# 2. Set up the environment
cp .env.example .env.local
# then edit .env.local and paste your own Content API URL

# 3. Start the dev server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000) (Next picks the next free port if 3000 is taken).

Other scripts:

```bash
npm run build   # production build
npm start       # serve the production build
npm run lint    # eslint
```

## Environment setup

One variable is required:

```
NEXT_PUBLIC_HYGRAPH_ENDPOINT=https://eu-west-2.cdn.hygraph.com/content/<project-id>/master
```

Find it in Hygraph under **Project settings → API Access → Content API**, and copy the **High Performance Content API** URL for the environment you want to read.

It is a `NEXT_PUBLIC_` variable because the endpoint is a read-only CDN URL that only serves published content — there is no token and nothing to keep secret. `.env.local` is gitignored; `.env.example` is committed as the template.

If you lock the endpoint down and it starts requiring a token, move the value to a server-only variable (for example `HYGRAPH_TOKEN`) and send it as an `Authorization` header from `src/lib/hygraph.ts` — every query already runs on the server, so nothing else has to change.

## Project structure

```
src/
  app/
    page.tsx                  listing page + filters
    property/[slug]/page.tsx  property detail
    agency/[slug]/page.tsx    agency profile
    error.tsx, not-found.tsx  error and 404 states
  components/                 presentational components
  lib/
    hygraph.ts                fetch-based GraphQL client
    queries.ts                typed queries and result types
    domain.ts                 enum labels and formatting
    filters.ts                URL search params <-> GraphQL `where`
```

## Notes on the schema

The queries were written against the live schema after an introspection pass. A few things differ from what you might expect, and the code follows the API rather than the assumption:

- **Enum values are camelCase**, not `SCREAMING_SNAKE` — `apartment`, `house`, `rent`, `sale`, `available`, `clujNapoca`, and so on.
- **`Property` has no image or asset field.** There is no gallery data to query, so listings fall back to a neutral placeholder. `PropertyGallery` already accepts an `images` array — add `images { url }` to the detail query in `src/lib/queries.ts` and pass it through, and photographs take over with no other changes.
- **`Agent.agencyName`** is the relation to `Agency` (not `agency`).
- **`Agency.agentName`** is the populated relation to `Agent` (not `agents`). An `agent` field also exists on `Agency` but is empty.
- **`Property.feature`** and **`Property.agent`** are singular names despite being many-to-many.
- **`Layout`** is stored in English (`detached`, `semiDetached`, `nonDetached`, `circular`) and describes how rooms connect to one another.
- **`description`** (RichText) exists but is `null` on every published entry, so the description section only renders when content is present.

The interface is entirely in English. Listing **titles come from the CMS** and are currently written in Romanian — that is content, not UI copy, so it is edited in Hygraph rather than in this repo.
