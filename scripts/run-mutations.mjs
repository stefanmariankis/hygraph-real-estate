/**
 * Runs the operations in scripts/mutations-images.graphql, in order.
 *
 *   HYGRAPH_ENDPOINT=https://api-eu-west-2.hygraph.com/v2/<project-id>/master \
 *   HYGRAPH_TOKEN=<permanent auth token> \
 *   node scripts/run-mutations.mjs
 *
 * The whole file is sent as one document and each operation is selected by
 * name, so nothing has to be parsed or split. Between the uploads and the
 * publish it waits, because Hygraph downloads each file in the background and
 * publishing an asset it has not finished fetching fails.
 */

import { readFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

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

const document = await readFile(
  new URL("./mutations-images.graphql", import.meta.url),
  "utf8",
);

async function run(operationName) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query: document, operationName }),
  });
  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(`${operationName}: ${body.errors.map((e) => e.message).join("; ")}`);
  }
  return body.data;
}

/** Confirms the three asset fields exist before writing anything. */
async function preflight() {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({
      query: `{
        Property: __type(name: "Property") { fields { name } }
        Agent: __type(name: "Agent") { fields { name } }
        Agency: __type(name: "Agency") { fields { name } }
      }`,
    }),
  });
  const { data } = await res.json();
  const missing = [
    ["Property", "images"],
    ["Agent", "photo"],
    ["Agency", "logo"],
  ].filter(([model, field]) => !data[model].fields.some((f) => f.name === field));

  if (missing.length) {
    console.error("These Asset fields do not exist yet:");
    for (const [model, field] of missing) console.error(`  - ${model}.${field}`);
    console.error("\nCreate them in Schema -> <model> -> Add field -> Asset picker, then re-run.");
    process.exit(1);
  }
  console.log("Preflight ok — Property.images, Agent.photo and Agency.logo all exist.\n");
}

await preflight();

console.log("1/5  Uploading property images (30 assets)…");
await run("AddPropertyImages");

console.log("2/5  Uploading agent photos (5 assets)…");
await run("AddAgentPhotos");

console.log("3/5  Uploading agency images (3 assets)…");
await run("AddAgencyLogos");

console.log("     Waiting 15s for Hygraph to finish downloading the files…");
await sleep(15000);

console.log("4/5  Publishing…");
for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    const data = await run("PublishEverything");
    console.log(
      `     assets:${data.assets.edges.length} properties:${data.properties.edges.length} ` +
      `agents:${data.agents.edges.length} agencies:${data.agencies.edges.length}`,
    );
    break;
  } catch (error) {
    if (attempt === 5) throw error;
    console.log(`     not ready yet, retrying (${attempt}/4)…`);
    await sleep(attempt * 5000);
  }
}

console.log("5/5  Verifying…");
const check = await run("VerifyImages");
const withImages = check.properties.filter((p) => p.images.length > 0).length;
const withPhoto = check.agents.filter((a) => a.photo).length;
const withLogo = check.agencies.filter((a) => a.logo).length;

console.log(`\n  properties with images: ${withImages}/${check.properties.length}`);
console.log(`  agents with a photo:    ${withPhoto}/${check.agents.length}`);
console.log(`  agencies with an image: ${withLogo}/${check.agencies.length}`);
console.log(`\n  sample: ${check.properties[0]?.images[0]?.url ?? "(none)"}`);
