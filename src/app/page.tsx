import { Suspense } from "react";
import Filters from "@/components/Filters";
import EmptyState from "@/components/EmptyState";
import { PropertyGrid, PropertyGridSkeleton } from "@/components/PropertyGrid";
import { formatListingCount } from "@/lib/domain";
import {
  parseFilters,
  toWhere,
  type Filters as FilterValues,
} from "@/lib/filters";
import { getProperties } from "@/lib/queries";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const filters = parseFilters(params);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Properties
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Apartments and houses for sale or rent. Filters stay in the page
          address, so you can share exactly what you found.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="h-[184px] rounded-2xl border border-slate-200 bg-white shadow-sm" />
        }
      >
        <Filters />
      </Suspense>

      <Suspense
        key={JSON.stringify(filters)}
        fallback={
          <div className="mt-8">
            <div className="mb-4 h-4 w-24 animate-pulse rounded bg-slate-200" />
            <PropertyGridSkeleton />
          </div>
        }
      >
        <Results filters={filters} />
      </Suspense>
    </div>
  );
}

async function Results({ filters }: { filters: FilterValues }) {
  const { properties, count } = await getProperties(toWhere(filters));

  if (properties.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          title="No listings match these filters"
          body="Try a wider price range, or pick a different city."
          actionHref="/"
          actionLabel="Clear filters"
        />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <p className="mb-4 text-sm font-medium text-slate-500" aria-live="polite">
        {formatListingCount(count)}
      </p>
      <PropertyGrid properties={properties} />
    </div>
  );
}
