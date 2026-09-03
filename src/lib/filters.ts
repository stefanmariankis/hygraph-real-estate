import {
  LISTING_TYPES,
  PROPERTY_TYPES,
  type ListingType,
  type PropertyType,
} from "./domain";

/**
 * Filters live in the URL so a filtered result is shareable and survives a
 * reload. Anything unrecognised is dropped.
 *
 * City and neighbourhood are matched on slug, because both are models now
 * rather than enums — the set of valid values is whatever the CMS holds, so it
 * is passed in rather than hard-coded.
 */

export type Filters = {
  city?: string;
  neighborhood?: string;
  propertyType?: PropertyType;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.length > 0 ? v : undefined;
}

function oneOf<T extends string>(
  allowed: readonly T[],
  value: string | undefined,
): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function positiveInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export function parseFilters(params: RawSearchParams): Filters {
  return {
    city: first(params.city),
    neighborhood: first(params.neighborhood),
    propertyType: oneOf(PROPERTY_TYPES, first(params.propertyType)),
    listingType: oneOf(LISTING_TYPES, first(params.listingType)),
    minPrice: positiveInt(first(params.minPrice)),
    maxPrice: positiveInt(first(params.maxPrice)),
  };
}

/**
 * The listing page is statically exported, so the full set of published
 * properties ships with the page and filtering happens in the browser.
 */
export function matchesFilters(
  property: {
    price: number;
    propertyType: string;
    listingType: string;
    city: { slug: string } | null;
    neighborhood: { slug: string } | null;
  },
  filters: Filters,
): boolean {
  if (filters.city && property.city?.slug !== filters.city) return false;
  if (filters.neighborhood && property.neighborhood?.slug !== filters.neighborhood)
    return false;
  if (filters.propertyType && property.propertyType !== filters.propertyType)
    return false;
  if (filters.listingType && property.listingType !== filters.listingType)
    return false;
  if (filters.minPrice !== undefined && property.price < filters.minPrice)
    return false;
  if (filters.maxPrice !== undefined && property.price > filters.maxPrice)
    return false;
  return true;
}

export function activeFilterCount(filters: Filters): number {
  return Object.values(filters).filter((v) => v !== undefined).length;
}
