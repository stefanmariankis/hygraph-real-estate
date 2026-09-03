import { hygraph } from "./hygraph";
import type {
  Layout,
  ListingStatus,
  ListingType,
  PropertyType,
} from "./domain";

/**
 * Types are hand-written from an introspection of the live schema. Where the
 * API names differ from the usual guess, the difference is called out:
 *
 *   Agent.agencyName    — the relation to Agency (not `agency`)
 *   Agency.agentName    — the populated relation to Agent (not `agents`)
 *   Agent.testimonial   — reverse relation, singular name, returns a list
 *   Agency.testimonial  — same
 *   Property.feature    — singular, though it is many-to-many
 */

export type ImageRef = { url: string };

export type FeatureRef = { id: string; name: string };

export type CityRef = { id: string; name: string; slug: string };

export type NeighborhoodRef = { id: string; name: string; slug: string };

export type Testimonial = {
  id: string;
  slug: string;
  authorName: string;
  quote: string;
  rating: number | null;
};

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
  photo: ImageRef | null;
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
  propertyStatus: ListingStatus;
  city: CityRef | null;
  neighborhood: NeighborhoodRef | null;
  images: ImageRef[];
};

export type PropertyDetail = PropertySummary & {
  description: { html: string } | null;
  agent: (AgentSummary & { testimonial: Testimonial[] })[];
  feature: FeatureRef[];
  city: (CityRef & { county: string | null; description: { html: string } | null }) | null;
};

export type Agency = {
  id: string;
  name: string;
  slug: string | null;
  foundedYear: number | null;
  logo: ImageRef | null;
  testimonial: Testimonial[];
  agentName: (AgentSummary & {
    property: PropertySummary[];
    testimonial: Testimonial[];
  })[];
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
    propertyStatus
    city {
      id
      name
      slug
    }
    neighborhood {
      id
      name
      slug
    }
    images {
      url
    }
  }
`;

const AGENT_SUMMARY = /* GraphQL */ `
  fragment AgentSummary on Agent {
    id
    fullName
    slug
    email
    phone
    photo {
      url
    }
    agencyName {
      id
      name
      slug
    }
  }
`;

const TESTIMONIAL = /* GraphQL */ `
  fragment TestimonialFields on Testimonial {
    id
    slug
    authorName
    quote
    rating
  }
`;

/**
 * The listing page is statically exported and filters in the browser, so it
 * asks for the whole published catalogue in one go.
 */
export async function getProperties() {
  const data = await hygraph<{ properties: PropertySummary[] }>(
    /* GraphQL */ `
      query Properties {
        properties(orderBy: createdAt_DESC, first: 200) {
          ...PropertySummary
        }
      }
      ${PROPERTY_SUMMARY}
    `,
  );
  return data.properties;
}

/** Cities and neighbourhoods that actually have properties, for the filters. */
export async function getFilterOptions() {
  const data = await hygraph<{
    cities: (CityRef & { neighborhood: NeighborhoodRef[] })[];
  }>(
    /* GraphQL */ `
      query FilterOptions {
        cities(orderBy: name_ASC, first: 100) {
          id
          name
          slug
          neighborhood(orderBy: name_ASC, first: 100) {
            id
            name
            slug
          }
        }
      }
    `,
  );
  return data.cities;
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
          city {
            county
            description {
              html
            }
          }
          agent {
            ...AgentSummary
            testimonial(first: 10) {
              ...TestimonialFields
            }
          }
          feature {
            id
            name
          }
        }
      }
      ${PROPERTY_SUMMARY}
      ${AGENT_SUMMARY}
      ${TESTIMONIAL}
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
          logo {
            url
          }
          testimonial(first: 20) {
            ...TestimonialFields
          }
          agentName {
            ...AgentSummary
            testimonial(first: 10) {
              ...TestimonialFields
            }
            property(orderBy: createdAt_DESC, first: 100) {
              ...PropertySummary
            }
          }
        }
      }
      ${PROPERTY_SUMMARY}
      ${AGENT_SUMMARY}
      ${TESTIMONIAL}
    `,
    { slug },
  );
  return data.agency;
}

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
