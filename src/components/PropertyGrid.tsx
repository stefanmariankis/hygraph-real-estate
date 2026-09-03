import PropertyCard from "./PropertyCard";
import type { PropertySummary } from "@/lib/queries";

export function PropertyGrid({
  properties,
}: {
  properties: PropertySummary[];
}) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property, index) => (
        <li key={property.id} className="min-w-0">
          {/* One row's worth above the fold, so the first paint has images. */}
          <PropertyCard property={property} priority={index < 3} />
        </li>
      ))}
    </ul>
  );
}

/** Shown while a filter change is in flight. */
export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading properties"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="aspect-[4/3] bg-slate-100" />
          <div className="flex flex-col gap-3 p-5">
            <div className="h-4 w-4/5 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
            <div className="mt-3 h-6 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
