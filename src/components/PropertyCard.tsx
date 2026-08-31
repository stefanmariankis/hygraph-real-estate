import Link from "next/link";
import PropertyThumb from "./PropertyThumb";
import { ListingTypeBadge, StatusBadge } from "./Badges";
import {
  CITY_LABELS,
  PROPERTY_TYPE_LABELS,
  formatFloor,
  formatPrice,
  formatRooms,
  formatSurface,
  label,
} from "@/lib/domain";
import type { PropertySummary } from "@/lib/queries";

export default function PropertyCard({
  property,
}: {
  property: PropertySummary;
}) {
  return (
    <article className="group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <PropertyThumb
          propertyType={property.propertyType}
          className="aspect-[16/10] w-full"
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <ListingTypeBadge listingType={property.listingType} />
          {property.propertyStatus !== "available" && (
            <StatusBadge status={property.propertyStatus} />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-slate-900">
          <Link
            href={`/property/${property.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {property.title}
          </Link>
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {label(CITY_LABELS, property.city)} ·{" "}
          {label(PROPERTY_TYPE_LABELS, property.propertyType)}
        </p>

        <p className="mt-3 text-sm text-slate-600">
          {formatRooms(property.rooms)}
          <span className="mx-1.5 text-slate-300">·</span>
          {formatSurface(property.surface)}
          <span className="mx-1.5 text-slate-300">·</span>
          {formatFloor(property.floor)}
        </p>

        <p className="mt-5 border-t border-slate-100 pt-4 text-xl font-bold tracking-tight text-slate-900">
          {formatPrice(property.price, property.listingType)}
        </p>
      </div>
    </article>
  );
}
