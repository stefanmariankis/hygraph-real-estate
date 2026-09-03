import { Suspense } from "react";
import PropertyList from "@/components/PropertyList";
import { PropertyGrid } from "@/components/PropertyGrid";
import { formatPropertyCount } from "@/lib/domain";
import { getFilterOptions, getProperties } from "@/lib/queries";

export default async function HomePage() {
  const [properties, cities] = await Promise.all([
    getProperties(),
    getFilterOptions(),
  ]);

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

      {/* The filter bar reads the URL, so this boundary is what gets written
          into the exported HTML. Rendering the real, unfiltered grid here —
          rather than a skeleton — means crawlers and the first paint both get
          the full catalogue, and filtering takes over after hydration. */}
      <Suspense
        fallback={
          <>
            <div className="h-[184px] rounded-2xl border border-slate-200 bg-white shadow-sm" />
            <div className="mt-8">
              <p className="mb-4 text-sm font-medium text-slate-500">
                {formatPropertyCount(properties.length)}
              </p>
              <PropertyGrid properties={properties} />
            </div>
          </>
        }
      >
        <PropertyList properties={properties} cities={cities} />
      </Suspense>
    </div>
  );
}
