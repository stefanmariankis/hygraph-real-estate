/**
 * Creates the three Asset fields through the Hygraph Management API.
 *
 *   HYGRAPH_MGMT_TOKEN=<management token> node scripts/create-fields.mjs
 *
 * This is a DIFFERENT endpoint and a DIFFERENT token from the Content API.
 * Studio's API Playground cannot reach it, which is why `viewer` and
 * `createRelationalField` come back as unknown fields there.
 *
 * The token is created in Project settings -> API Access -> Permanent Auth
 * Tokens, and needs Management API permissions for reading models and
 * creating fields. A token is already scoped to one project, so no project id
 * is needed here.
 */

const MGMT = "https://management-eu-west-2.hygraph.com/graphql";
const TOKEN = process.env.HYGRAPH_MGMT_TOKEN;
const ENVIRONMENT = process.env.HYGRAPH_ENVIRONMENT ?? "master";

if (!TOKEN) {
  console.error("Set HYGRAPH_MGMT_TOKEN (a Management API token, not the content one).");
  process.exit(1);
}

async function gql(query, variables = {}) {
  const res = await fetch(MGMT, {
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

const data = await gql(
  `query GetModelIds($env: String!) {
     viewer {
       project {
         id
         name
         environment(name: $env) {
           id
           contentModel {
             models(includeSystemModels: true) { id apiId }
           }
         }
       }
     }
   }`,
  { env: ENVIRONMENT },
);

const project = data.viewer.project;
if (!project) {
  console.error("The token resolved no project. Check that it is a Management API token.");
  process.exit(1);
}

const models = Object.fromEntries(
  project.environment.contentModel.models.map((m) => [m.apiId, m.id]),
);

console.log(`Project: ${project.name} (env: ${ENVIRONMENT})`);
for (const apiId of ["Property", "Agent", "Agency", "Asset"]) {
  if (!models[apiId]) {
    console.error(`Model ${apiId} not found. Available: ${Object.keys(models).join(", ")}`);
    process.exit(1);
  }
  console.log(`  ${apiId.padEnd(9)} ${models[apiId]}`);
}

const FIELDS = [
  { on: "Property", apiId: "images", displayName: "Images", isList: true,
    reverse: { apiId: "property", displayName: "Property" } },
  { on: "Agent", apiId: "photo", displayName: "Photo", isList: false,
    reverse: { apiId: "agentPhoto", displayName: "Agent photo" } },
  { on: "Agency", apiId: "logo", displayName: "Logo", isList: false,
    reverse: { apiId: "agencyLogo", displayName: "Agency logo" } },
];

console.log("\nCreating fields…");
for (const field of FIELDS) {
  try {
    await gql(
      `mutation CreateField($data: CreateRelationalFieldInput!) {
         createRelationalField(data: $data) { id apiId }
       }`,
      {
        data: {
          parentId: models[field.on],
          apiId: field.apiId,
          displayName: field.displayName,
          type: "ASSET",
          isList: field.isList,
          reverseSide: {
            modelId: models.Asset,
            field: { ...field.reverse, isList: true },
          },
        },
      },
    );
    console.log(`  ✓ ${field.on}.${field.apiId}`);
  } catch (error) {
    const message = String(error.message);
    if (/already|taken|unique|exists/i.test(message)) {
      console.log(`  – ${field.on}.${field.apiId} already exists, skipping`);
    } else {
      console.error(`  ✗ ${field.on}.${field.apiId}: ${message}`);
      process.exitCode = 1;
    }
  }
}

console.log("\nDone. Verify with scripts/run-mutations.mjs, which checks the fields exist before uploading.");
