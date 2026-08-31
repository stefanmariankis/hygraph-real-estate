/**
 * Display labels and formatting for the Hygraph enums.
 *
 * Values below are the ones the API actually returns (camelCase), verified by
 * introspection — not the SCREAMING_SNAKE spelling.
 */

export const CITIES = [
  "clujNapoca",
  "bucharest",
  "bistrita",
  "oradea",
  "timisoara",
] as const;
export type City = (typeof CITIES)[number];

export const PROPERTY_TYPES = ["apartment", "house"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_TYPES = ["rent", "sale"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LAYOUTS = [
  "detached",
  "semiDetached",
  "nonDetached",
  "circular",
] as const;
export type Layout = (typeof LAYOUTS)[number];

export const LISTING_STATUSES = [
  "available",
  "reserved",
  "sold",
  "rented",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const CITY_LABELS: Record<City, string> = {
  clujNapoca: "Cluj-Napoca",
  bucharest: "Bucharest",
  bistrita: "Bistrita",
  oradea: "Oradea",
  timisoara: "Timisoara",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  house: "House",
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  rent: "For rent",
  sale: "For sale",
};

export const LAYOUT_LABELS: Record<Layout, string> = {
  detached: "Detached",
  semiDetached: "Semi-detached",
  nonDetached: "Non-detached",
  circular: "Circular",
};

/** What each room layout means, shown on the detail page. */
export const LAYOUT_DESCRIPTIONS: Record<Layout, string> = {
  detached: "Every room opens directly off the hallway.",
  semiDetached:
    "Some rooms open off the hallway, the rest connect to one another.",
  nonDetached: "Rooms open into each other, with no distribution hallway.",
  circular: "Rooms are arranged in a loop, each connecting to the next.",
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  rented: "Rented",
};

/** Reads an enum label without trusting the API to stay inside the union. */
export function label<T extends string>(
  labels: Record<T, string>,
  value: T | string | null | undefined,
): string {
  if (!value) return "—";
  return (labels as Record<string, string>)[value] ?? value;
}

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/**
 * Prices are euro amounts. Rentals are monthly, sales are absolute, and the
 * two must never be mistaken for one another.
 */
export function formatPrice(
  price: number | null | undefined,
  listingType: ListingType | string | null | undefined,
): string {
  if (price == null) return "Price on request";
  const amount = `€${numberFormat.format(price)}`;
  return listingType === "rent" ? `${amount} / month` : amount;
}

export function formatSurface(surface: number | null | undefined): string {
  return surface == null ? "—" : `${numberFormat.format(surface)} m²`;
}

export function formatRooms(rooms: number | null | undefined): string {
  if (rooms == null) return "—";
  return rooms === 1 ? "1 room" : `${rooms} rooms`;
}

export function formatBathrooms(bathrooms: number | null | undefined): string {
  if (bathrooms == null) return "—";
  return bathrooms === 1 ? "1 bathroom" : `${bathrooms} bathrooms`;
}

export function formatFloor(floor: number | null | undefined): string {
  if (floor == null) return "—";
  if (floor === 0) return "Ground floor";
  if (floor < 0) return "Basement";
  return `Floor ${floor}`;
}

/** For stat tiles whose label already reads "Floor". */
export function formatFloorShort(floor: number | null | undefined): string {
  if (floor == null) return "—";
  if (floor === 0) return "Ground";
  if (floor < 0) return "Basement";
  return String(floor);
}

export function formatListingCount(count: number): string {
  return count === 1 ? "1 listing" : `${numberFormat.format(count)} listings`;
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}
