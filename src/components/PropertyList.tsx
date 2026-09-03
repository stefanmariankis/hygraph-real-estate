"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Filters, { type CityOption } from "./Filters";
import EmptyState from "./EmptyState";
import { PropertyGrid } from "./PropertyGrid";
import { formatPropertyCount } from "@/lib/domain";
import { matchesFilters, parseFilters } from "@/lib/filters";
import type { PropertySummary } from "@/lib/queries";

/**
 * The listing page is statically exported, so it cannot read search params on
 * the server. Every published property is baked into the page at build time
 * and filtered here in the browser — which also makes filtering instant.
 */
export default function PropertyList({
  properties,
  cities,
}: {
  properties: PropertySummary[];
  cities: CityOption[];
}) {
  const searchParams = useSearchParams();

  const visible = useMemo(() => {
    const filters = parseFilters(Object.fromEntries(searchParams.entries()));
    return properties.filter((property) => matchesFilters(property, filters));
  }, [properties, searchParams]);

  return (
    <>
      <Filters cities={cities} />

      <div className="mt-8">
        {visible.length === 0 ? (
          <EmptyState
            title="No properties match these filters"
            body="Try a wider price range, or pick a different city."
            actionHref="/"
            actionLabel="Clear filters"
          />
        ) : (
          <>
            <p className="mb-4 text-sm font-medium text-slate-500" aria-live="polite">
              {formatPropertyCount(visible.length)}
            </p>
            <PropertyGrid properties={visible} />
          </>
        )}
      </div>
    </>
  );
}
