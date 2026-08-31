"use client";

import { useState } from "react";
import PropertyThumb from "./PropertyThumb";
import type { PropertySummary } from "@/lib/queries";

type Image = { url: string };

/**
 * First image large, the rest as thumbnails.
 *
 * The Property model in this project has no asset field, so `images` is always
 * empty today and the placeholder stands in. Add `images { url }` to the detail
 * query and pass it here — nothing else has to change.
 */
export default function PropertyGallery({
  property,
  images = [],
}: {
  property: PropertySummary;
  images?: Image[];
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <figure>
        <PropertyThumb
          propertyType={property.propertyType}
          className="h-64 w-full rounded-2xl border border-slate-200 sm:h-80"
        />
        <figcaption className="mt-2 text-sm text-slate-400">
          No photos available for this listing.
        </figcaption>
      </figure>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.url}
        alt={property.title}
        className="aspect-[16/10] w-full rounded-2xl border border-slate-200 bg-slate-100 object-cover"
      />
      {images.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Photo ${index + 1}`}
                aria-current={index === active}
                className={`block overflow-hidden rounded-lg border-2 transition-colors ${
                  index === active
                    ? "border-blue-600"
                    : "border-transparent hover:border-slate-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-16 w-20 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
