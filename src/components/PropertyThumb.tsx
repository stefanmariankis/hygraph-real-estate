import type { PropertySummary } from "@/lib/queries";

/**
 * The Property model in this Hygraph project has no image or asset field, so
 * there is nothing to show a photo from. Listings fall back to a neutral
 * placeholder until an `images` field is added to the model.
 */
export default function PropertyThumb({
  propertyType,
  className,
}: {
  propertyType: PropertySummary["propertyType"];
  className?: string;
}) {
  return (
    <div
      className={`grid place-items-center bg-slate-100 ${className ?? ""}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-10 text-slate-300"
      >
        {propertyType === "house" ? (
          <>
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
            <path d="M10 21v-6h4v6" />
          </>
        ) : (
          <>
            <path d="M4 21V4.5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 16 4.5V21" />
            <path d="M16 10h2.5A1.5 1.5 0 0 1 20 11.5V21" />
            <path d="M2 21h20" />
            <path d="M7.5 7h1M11.5 7h1M7.5 11h1M11.5 11h1M7.5 15h1M11.5 15h1" />
          </>
        )}
      </svg>
    </div>
  );
}
