/**
 * Seeds the City, Neighborhood and Testimonial models, and links the existing
 * properties to their city and neighbourhood.
 *
 * Safe to run more than once — every write is an upsert keyed on `slug`.
 *
 *   HYGRAPH_ENDPOINT=https://api-eu-west-2.hygraph.com/v2/<project-id>/master \
 *   HYGRAPH_TOKEN=<permanent auth token> \
 *   node scripts/seed-models.mjs
 *
 * The token needs Create + Update + Publish on City, Neighborhood,
 * Testimonial and Property.
 */

const ENDPOINT = process.env.HYGRAPH_ENDPOINT;
const TOKEN = process.env.HYGRAPH_TOKEN;

if (!ENDPOINT || !TOKEN) {
  console.error("Set HYGRAPH_ENDPOINT (the api-* write URL) and HYGRAPH_TOKEN.");
  process.exit(1);
}
if (ENDPOINT.includes(".cdn.")) {
  console.error("HYGRAPH_ENDPOINT points at the read-only CDN. Use the api-* URL.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const CITIES = [
  { slug: "cluj-napoca", name: "Cluj-Napoca", county: "Cluj",
    description: "Romania's second-largest urban economy and its most expensive housing market outside the capital, driven by a dense IT and university population." },
  { slug: "bucharest", name: "Bucharest", county: "Bucuresti",
    description: "The capital and by far the largest market, spanning six sectors with very different price levels and building stock." },
  { slug: "bistrita", name: "Bistrita", county: "Bistrita-Nasaud",
    description: "A small Transylvanian county seat with a compact historic centre and a slower, more affordable market." },
  { slug: "oradea", name: "Oradea", county: "Bihor",
    description: "Known for its restored Art Nouveau centre and steady municipal investment, close to the Hungarian border." },
  { slug: "timisoara", name: "Timisoara", county: "Timis",
    description: "The largest city in western Romania, with a strong manufacturing and services base and heavy suburban expansion." },
];

const NEIGHBORHOODS = [
  { slug: "gheorgheni",  name: "Gheorgheni",  city: "cluj-napoca" },
  { slug: "marasti",     name: "Marasti",     city: "cluj-napoca" },
  { slug: "buna-ziua",   name: "Buna Ziua",   city: "cluj-napoca" },
  { slug: "aviatiei",    name: "Aviatiei",    city: "bucharest" },
  { slug: "militari",    name: "Militari",    city: "bucharest" },
  { slug: "dumbravita",  name: "Dumbravita",  city: "timisoara" },
];

/** Taken from the `city` enum before it was replaced by the relation. */
const PROPERTY_LOCATION = {
  "apartament-2-camere-gheorgheni": { city: "cluj-napoca", neighborhood: "gheorgheni" },
  "garsoniera-moderna-marasti":     { city: "cluj-napoca", neighborhood: "marasti" },
  "apartament-4-camere-buna-ziua":  { city: "cluj-napoca", neighborhood: "buna-ziua" },
  "apartament-3-camere-aviatiei":   { city: "bucharest",   neighborhood: "aviatiei" },
  "apartament-2-camere-militari":   { city: "bucharest",   neighborhood: "militari" },
  "casa-cu-curte-dumbravita":       { city: "timisoara",   neighborhood: "dumbravita" },
};

/**
 * A testimonial is about an agent, or about an agency as a whole. Both
 * relations are optional; set one or the other.
 */
const TESTIMONIALS = [
  // About individual agents
  { slug: "t-andrei-1", authorName: "Cristina Ilies", rating: 5, agent: "andrei-popescu",
    quote: "Andrei knew every block on the street and told us which ones had already replaced the plumbing. We saw four apartments and bought the third." },
  { slug: "t-andrei-2", authorName: "Bogdan Neamtu", rating: 4, agent: "andrei-popescu",
    quote: "Straightforward about what the apartment was worth, even when that was lower than we hoped. The sale closed in five weeks." },
  { slug: "t-ioana-1", authorName: "Raluca Toma", rating: 5, agent: "ioana-muresan",
    quote: "I was renting from another city and Ioana did the first two viewings on video. Nothing was different when I arrived in person." },
  { slug: "t-mihai-1", authorName: "Andreea Voicu", rating: 5, agent: "mihai-dobre",
    quote: "Mihai pushed back when the seller changed the terms late in the process. We paid what we had agreed." },
  { slug: "t-elena-1", authorName: "Sorin Dumitrescu", rating: 4, agent: "elena-stanciu",
    quote: "Clear paperwork and no surprises at the notary. Elena answered on weekends when the bank was slow." },
  { slug: "t-radu-1", authorName: "Alina Farcas", rating: 5, agent: "radu-ardelean",
    quote: "Radu talked us out of the first house we liked because of a drainage problem we had not noticed. That saved us a lot." },

  // About the agencies themselves
  { slug: "t-transilvania-1", authorName: "Vlad Chiriac", rating: 5, agency: "transilvania-imobiliare",
    quote: "We worked with two of their agents over three years, for a rental and then a purchase. The handover between them was seamless." },
  { slug: "t-urban-1", authorName: "Diana Preda", rating: 4, agency: "urban-estate",
    quote: "Good coverage across the northern sectors. Their listings matched what we actually found on site, which was not true everywhere." },
  { slug: "t-west-1", authorName: "Ionut Barbu", rating: 5, agency: "west-home",
    quote: "A small office, but they know the suburbs around Timisoara better than the big agencies do." },
];

// ---------------------------------------------------------------------------

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join("; "));
  }
  return body.data;
}

/** Fails early with a readable list rather than a wall of GraphQL errors. */
async function preflight() {
  const data = await gql(`{
    City: __type(name: "City") { kind fields { name } }
    Neighborhood: __type(name: "Neighborhood") { kind fields { name } }
    Testimonial: __type(name: "Testimonial") { kind fields { name } }
    Property: __type(name: "Property") { fields { name } }
  }`);

  const problems = [];
  for (const model of ["City", "Neighborhood", "Testimonial"]) {
    const t = data[model];
    if (!t) problems.push(`model ${model} does not exist`);
    else if (t.kind === "ENUM") problems.push(`${model} is still an ENUM, not a model`);
  }

  const propertyFields = new Set(data.Property.fields.map((f) => f.name));
  for (const field of ["city", "neighborhood"]) {
    if (!propertyFields.has(field)) problems.push(`Property.${field} is missing`);
  }

  if (problems.length) {
    console.error("Schema is not ready:\n" + problems.map((p) => `  - ${p}`).join("\n"));
    console.error("\nCreate the models and fields first, then re-run.");
    process.exit(1);
  }
  console.log("Preflight ok — all models and fields present.\n");
}

async function upsert(model, plural, slug, fields) {
  await gql(
    `mutation Up($slug: String!, $data: ${model}CreateInput!, $update: ${model}UpdateInput!) {
       upsert${model}(where: { slug: $slug }, upsert: { create: $data, update: $update }) { id }
     }`,
    { slug, data: { slug, ...fields }, update: fields },
  );
  await gql(
    `mutation Pub($slug: String!) {
       publish${model}(where: { slug: $slug }, to: PUBLISHED) { id }
     }`,
    { slug },
  );
  console.log(`  ✓ ${plural}: ${slug}`);
}

async function main() {
  await preflight();

  console.log("Cities…");
  for (const { slug, name, county, description } of CITIES) {
    // description is RichText; if the field was created as plain text this
    // still works, so try the AST first and fall back to a bare string.
    try {
      await upsert("City", "city", slug, {
        name,
        county,
        description: { children: [{ type: "paragraph", children: [{ text: description }] }] },
      });
    } catch {
      await upsert("City", "city", slug, { name, county });
      console.log(`     (description skipped for ${slug} — check the field type)`);
    }
  }

  console.log("Neighborhoods…");
  for (const { slug, name, city } of NEIGHBORHOODS) {
    await upsert("Neighborhood", "neighborhood", slug, {
      name,
      city: { connect: { slug: city } },
    });
  }

  console.log("Linking properties…");
  for (const [slug, { city, neighborhood }] of Object.entries(PROPERTY_LOCATION)) {
    await gql(
      `mutation Link($slug: String!) {
         updateProperty(where: { slug: $slug }, data: {
           city: { connect: { slug: "${city}" } }
           neighborhood: { connect: { slug: "${neighborhood}" } }
         }) { id }
       }`,
      { slug },
    );
    await gql(
      `mutation Pub($slug: String!) {
         publishProperty(where: { slug: $slug }, to: PUBLISHED) { id }
       }`,
      { slug },
    );
    console.log(`  ✓ ${slug} → ${city} / ${neighborhood}`);
  }

  console.log("Testimonials…");
  for (const { slug, authorName, quote, rating, agent, agency } of TESTIMONIALS) {
    await upsert("Testimonial", "testimonial", slug, {
      authorName,
      quote,
      rating,
      ...(agent ? { agent: { connect: { slug: agent } } } : {}),
      ...(agency ? { agency: { connect: { slug: agency } } } : {}),
    });
  }

  console.log("\nDone.");
}

await main();
