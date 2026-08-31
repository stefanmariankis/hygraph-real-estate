import {
  CITIES,
  LISTING_TYPES,
  PROPERTY_TYPES,
  type City,
  type ListingType,
  type PropertyType,
} from "./domain";
import type { PropertyWhere } from "./queries";

/**
 * Filters live in the URL so a filtered result is shareable and survives a
 * reload. Anything unrecognised is dropped rather than passed to the API.
 */

export type Filters = {
  city?: City;
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
    city: oneOf(CITIES, first(params.city)),
    propertyType: oneOf(PROPERTY_TYPES, first(params.propertyType)),
    listingType: oneOf(LISTING_TYPES, first(params.listingType)),
    minPrice: positiveInt(first(params.minPrice)),
    maxPrice: positiveInt(first(params.maxPrice)),
  };
}

/** Maps the parsed filters onto Hygraph's `where` argument. */
export function toWhere(filters: Filters): PropertyWhere {
  const where: PropertyWhere = {};
  if (filters.city) where.city = filters.city;
  if (filters.propertyType) where.propertyType = filters.propertyType;
  if (filters.listingType) where.listingType = filters.listingType;
  if (filters.minPrice !== undefined) where.price_gte = filters.minPrice;
  if (filters.maxPrice !== undefined) where.price_lte = filters.maxPrice;
  return where;
}

export function activeFilterCount(filters: Filters): number {
  return Object.values(filters).filter((v) => v !== undefined).length;
}

export function filtersToSearchParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params;
}
