import { hygraph } from "./hygraph";
import type {
  City,
  Layout,
  ListingStatus,
  ListingType,
  PropertyType,
} from "./domain";

/**
 * Types are hand-written from an introspection of the live schema. Where the
 * API names differ from the usual guess, the difference is called out:
 *
 *   Agent.agencyName   — the relation to Agency (not `agency`)
 *   Agency.agentName   — the populated relation to Agent (not `agents`);
 *                        an `agent` field also exists but is empty
 *   Property.feature   — singular, though it is many-to-many
 *   Property           — has NO image/asset field at all
 */

export type FeatureRef = { id: string; name: string };

export type AgencyRef = {
  id: string;
  name: string;
  slug: string | null;
};

export type AgentSummary = {
  id: string;
  fullName: string;
  slug: string | null;
  email: string;
  phone: string;
  agencyName: AgencyRef | null;
};

export type PropertySummary = {
  id: string;
  title: string;
  slug: string | null;
  price: number;
  surface: number;
  rooms: number;
  bathrooms: number;
  floor: number;
  propertyType: PropertyType;
  listingType: ListingType;
  layout: Layout;
  city: City;
  propertyStatus: ListingStatus;
};

export type PropertyDetail = PropertySummary & {
  description: { html: string } | null;
  agent: AgentSummary[];
  feature: FeatureRef[];
};

export type Agency = {
  id: string;
  name: string;
  slug: string | null;
  foundedYear: number | null;
  agentName: (AgentSummary & { property: PropertySummary[] })[];
};

const PROPERTY_SUMMARY = /* GraphQL */ `
  fragment PropertySummary on Property {
    id
    title
    slug
    price
    surface
    rooms
    bathrooms
    floor
    propertyType
    listingType
    layout
    city
    propertyStatus
  }
`;

const AGENT_SUMMARY = /* GraphQL */ `
  fragment AgentSummary on Agent {
    id
    fullName
    slug
    email
    phone
    agencyName {
      id
      name
      slug
    }
  }
`;

/** Mirrors Hygraph's PropertyWhereInput for the filters this UI exposes. */
export type PropertyWhere = {
  city?: City;
  propertyType?: PropertyType;
  listingType?: ListingType;
  price_gte?: number;
  price_lte?: number;
};

export async function getProperties(where: PropertyWhere) {
  const data = await hygraph<{
    properties: PropertySummary[];
    propertiesConnection: { aggregate: { count: number } };
  }>(
    /* GraphQL */ `
      query Properties($where: PropertyWhereInput!) {
        properties(where: $where, orderBy: createdAt_DESC, first: 60) {
          ...PropertySummary
        }
        propertiesConnection(where: $where) {
          aggregate {
            count
          }
        }
      }
      ${PROPERTY_SUMMARY}
    `,
    { where },
  );

  return {
    properties: data.properties,
    count: data.propertiesConnection.aggregate.count,
  };
}

export async function getPropertyBySlug(slug: string) {
  const data = await hygraph<{ property: PropertyDetail | null }>(
    /* GraphQL */ `
      query Property($slug: String!) {
        property(where: { slug: $slug }) {
          ...PropertySummary
          description {
            html
          }
          agent {
            ...AgentSummary
          }
          feature {
            id
            name
          }
        }
      }
      ${PROPERTY_SUMMARY}
      ${AGENT_SUMMARY}
    `,
    { slug },
  );

  return data.property;
}

export async function getAgencyBySlug(slug: string) {
  const data = await hygraph<{ agency: Agency | null }>(
    /* GraphQL */ `
      query Agency($slug: String!) {
        agency(where: { slug: $slug }) {
          id
          name
          slug
          foundedYear
          agentName {
            ...AgentSummary
            property(orderBy: createdAt_DESC) {
              ...PropertySummary
            }
          }
        }
      }
      ${PROPERTY_SUMMARY}
      ${AGENT_SUMMARY}
    `,
    { slug },
  );

  return data.agency;
}

/** Slugs for generateStaticParams / sitemap-style prerendering. */
export async function getPropertySlugs() {
  const data = await hygraph<{ properties: { slug: string | null }[] }>(
    /* GraphQL */ `
      query PropertySlugs {
        properties(first: 500) {
          slug
        }
      }
    `,
  );
  return data.properties.map((p) => p.slug).filter((s): s is string => !!s);
}

export async function getAgencySlugs() {
  const data = await hygraph<{ agencies: { slug: string | null }[] }>(
    /* GraphQL */ `
      query AgencySlugs {
        agencies(first: 500) {
          slug
        }
      }
    `,
  );
  return data.agencies.map((a) => a.slug).filter((s): s is string => !!s);
}
