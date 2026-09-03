"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LISTING_TYPES,
  LISTING_TYPE_LABELS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
} from "@/lib/domain";
import type { CityRef, NeighborhoodRef } from "@/lib/queries";

/**
 * Every filter is a URL search param, so a filtered view is shareable and
 * survives reload. Selects apply immediately; the price fields are debounced
 * so typing an amount does not fire a navigation per keystroke.
 */

const PRICE_DEBOUNCE_MS = 450;

const CONTROL =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400";

export type CityOption = CityRef & { neighborhood: NeighborhoodRef[] };

export default function Filters({ cities }: { cities: CityOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const city = searchParams.get("city") ?? "";
  const neighborhood = searchParams.get("neighborhood") ?? "";
  const propertyType = searchParams.get("propertyType") ?? "";
  const listingType = searchParams.get("listingType") ?? "";
  const urlMinPrice = searchParams.get("minPrice") ?? "";
  const urlMaxPrice = searchParams.get("maxPrice") ?? "";

  const [minPrice, setMinPrice] = useState(urlMinPrice);
  const [maxPrice, setMaxPrice] = useState(urlMaxPrice);
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);

  const hasFilters = Boolean(
    city || neighborhood || propertyType || listingType || urlMinPrice || urlMaxPrice,
  );

  // Once a city is picked, only its neighbourhoods make sense.
  const selectedCity = cities.find((c) => c.slug === city);
  const neighborhoods = selectedCity
    ? selectedCity.neighborhood
    : cities.flatMap((c) => c.neighborhood);

  function apply(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  useEffect(() => {
    if (document.activeElement !== minRef.current) setMinPrice(urlMinPrice);
  }, [urlMinPrice]);

  useEffect(() => {
    if (document.activeElement !== maxRef.current) setMaxPrice(urlMaxPrice);
  }, [urlMaxPrice]);

  useEffect(() => {
    if (minPrice === urlMinPrice && maxPrice === urlMaxPrice) return;
    const timer = setTimeout(() => {
      apply({ minPrice: minPrice || undefined, maxPrice: maxPrice || undefined });
    }, PRICE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice]);

  return (
    <section
      aria-label="Filters"
      data-pending={isPending ? "" : undefined}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-opacity data-pending:opacity-60"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Select
          id="filter-city"
          labelText="City"
          value={city}
          placeholder="All cities"
          options={cities.map((c) => [c.slug, c.name])}
          // A neighbourhood from another city would filter everything away.
          onChange={(v) => apply({ city: v, neighborhood: undefined })}
        />
        <Select
          id="filter-neighborhood"
          labelText="Neighborhood"
          value={neighborhood}
          placeholder="All neighborhoods"
          options={neighborhoods.map((n) => [n.slug, n.name])}
          onChange={(v) => apply({ neighborhood: v })}
        />
        <Select
          id="filter-property-type"
          labelText="Property type"
          value={propertyType}
          placeholder="All types"
          options={PROPERTY_TYPES.map((t) => [t, PROPERTY_TYPE_LABELS[t]])}
          onChange={(v) => apply({ propertyType: v })}
        />
        <Select
          id="filter-listing-type"
          labelText="Listing type"
          value={listingType}
          placeholder="Sale and rent"
          options={LISTING_TYPES.map((t) => [t, LISTING_TYPE_LABELS[t]])}
          onChange={(v) => apply({ listingType: v })}
        />

        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-sm font-medium text-slate-700">
            Price (€)
          </legend>
          <div className="flex items-center gap-2">
            <input
              ref={minRef}
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              className={CONTROL}
              placeholder="Min"
              aria-label="Minimum price in euro"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span aria-hidden="true" className="text-slate-400">–</span>
            <input
              ref={maxRef}
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              className={CONTROL}
              placeholder="Max"
              aria-label="Maximum price in euro"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </fieldset>
      </div>

      {hasFilters && (
        <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              setMinPrice("");
              setMaxPrice("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}

function Select({
  id,
  labelText,
  value,
  placeholder,
  options,
  onChange,
}: {
  id: string;
  labelText: string;
  value: string;
  placeholder: string;
  options: [string, string][];
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {labelText}
      </label>
      <div className="relative">
        <select
          id={id}
          className={`${CONTROL} appearance-none pr-9`}
          value={value}
          disabled={options.length === 0}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">{placeholder}</option>
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400"
        >
          <path
            d="M4 6.5 8 10.5 12 6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
