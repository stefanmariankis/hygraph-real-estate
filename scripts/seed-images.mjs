/**
 * Bulk-loads images into Hygraph from remote URLs.
 *
 * Hygraph can fetch a URL itself — `createAsset(data: { uploadUrl })` — so
 * nothing has to be downloaded locally. For each entry this script:
 *   1. creates one asset per URL,
 *   2. publishes the assets,
 *   3. connects them to the entry,
 *   4. publishes the entry.
 *
 * Requires a mutation token, and the WRITE endpoint (not the CDN one):
 *
 *   HYGRAPH_ENDPOINT=https://api-eu-west-2.hygraph.com/v2/<project-id>/master \
 *   HYGRAPH_TOKEN=<permanent auth token> \
 *   node scripts/seed-images.mjs
 *
 * The token needs Create + Update + Publish on Asset, Property, Agent and
 * Agency. Create it in Project settings -> API Access -> Permanent Auth Tokens.
 */

const ENDPOINT = process.env.HYGRAPH_ENDPOINT;
const TOKEN = process.env.HYGRAPH_TOKEN;

if (!ENDPOINT || !TOKEN) {
  console.error(
    "Set HYGRAPH_ENDPOINT (the api-* write URL, not the cdn one) and HYGRAPH_TOKEN.",
  );
  process.exit(1);
}
if (ENDPOINT.includes(".cdn.")) {
  console.error("HYGRAPH_ENDPOINT points at the read-only CDN. Use the api-* URL.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Fill these in. Keys are the slugs already in the CMS.
// ---------------------------------------------------------------------------

/** 3–6 photos each; the first one becomes the large image in the gallery. */
const PROPERTY_IMAGES = {
  "apartament-2-camere-gheorgheni": [],
  "garsoniera-moderna-marasti": [],
  "apartament-3-camere-aviatiei": [],
  "casa-cu-curte-dumbravita": [],
  "apartament-2-camere-militari": [],
  "apartament-4-camere-buna-ziua": [],
};

/** One portrait each. */
const AGENT_PHOTOS = {
  "andrei-popescu": "",
  "ioana-muresan": "",
  "mihai-dobre": "",
  "elena-stanciu": "",
  "radu-ardelean": "",
};

/** One logo each. */
const AGENCY_LOGOS = {
  "transilvania-imobiliare": "",
  "urban-estate": "",
  "west-home": "",
};

// ---------------------------------------------------------------------------

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join("; "));
  }
  return body.data;
}

/** Uploads one remote URL and returns the published asset id. */
async function uploadAsset(url, fileName) {
  const { createAsset } = await gql(
    `mutation Upload($url: String!, $fileName: String!) {
       createAsset(data: { uploadUrl: $url, fileName: $fileName }) { id }
     }`,
    { url, fileName },
  );

  // Hygraph fetches the file in the background; publishing can 404 briefly.
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      await gql(
        `mutation Publish($id: ID!) {
           publishAsset(where: { id: $id }, to: PUBLISHED) { id }
         }`,
        { id: createAsset.id },
      );
      return createAsset.id;
    } catch (error) {
      if (attempt === 6) throw error;
      await new Promise((r) => setTimeout(r, attempt * 1500));
    }
  }
}

async function seedProperties() {
  for (const [slug, urls] of Object.entries(PROPERTY_IMAGES)) {
    if (urls.length === 0) continue;

    const ids = [];
    for (const [index, url] of urls.entries()) {
      ids.push(await uploadAsset(url, `${slug}-${index + 1}.jpg`));
      console.log(`  uploaded ${slug} ${index + 1}/${urls.length}`);
    }

    await gql(
      `mutation Connect($slug: String!, $ids: [AssetWhereUniqueInput!]!) {
         updateProperty(where: { slug: $slug }, data: { images: { connect: $ids } }) { id }
       }`,
      { slug, ids: ids.map((id) => ({ where: { id } })) },
    );
    await gql(
      `mutation PublishOne($slug: String!) {
         publishProperty(where: { slug: $slug }, to: PUBLISHED) { id }
       }`,
      { slug },
    );
    console.log(`✓ ${slug} — ${ids.length} images`);
  }
}

async function seedSingle(map, model, field) {
  for (const [slug, url] of Object.entries(map)) {
    if (!url) continue;
    const id = await uploadAsset(url, `${slug}.jpg`);
    await gql(
      `mutation Connect($slug: String!, $id: ID!) {
         update${model}(where: { slug: $slug }, data: { ${field}: { connect: { id: $id } } }) { id }
       }`,
      { slug, id },
    );
    await gql(
      `mutation PublishOne($slug: String!) {
         publish${model}(where: { slug: $slug }, to: PUBLISHED) { id }
       }`,
      { slug },
    );
    console.log(`✓ ${slug} — ${field}`);
  }
}

console.log("Properties…");
await seedProperties();
console.log("Agents…");
await seedSingle(AGENT_PHOTOS, "Agent", "photo");
console.log("Agencies…");
await seedSingle(AGENCY_LOGOS, "Agency", "logo");
console.log("Done.");
