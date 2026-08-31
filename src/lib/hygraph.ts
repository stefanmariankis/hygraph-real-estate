/**
 * Minimal GraphQL client over `fetch`.
 *
 * The Hygraph endpoint is a read-only CDN URL serving published content only,
 * so there is nothing to authenticate and no cache to invalidate on write —
 * a timed revalidate is enough.
 */

const endpoint = process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT;

export class HygraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HygraphError";
  }
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export async function hygraph<T>(
  query: string,
  variables: Record<string, unknown> = {},
  { revalidate = 60 }: { revalidate?: number } = {},
): Promise<T> {
  if (!endpoint) {
    throw new HygraphError(
      "NEXT_PUBLIC_HYGRAPH_ENDPOINT is not set. Copy .env.example to .env.local and fill it in.",
    );
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });

  if (!response.ok) {
    throw new HygraphError(
      `Hygraph responded ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as GraphQLResponse<T>;

  if (body.errors?.length) {
    throw new HygraphError(body.errors.map((e) => e.message).join("; "));
  }

  if (!body.data) {
    throw new HygraphError("Hygraph returned no data.");
  }

  return body.data;
}
