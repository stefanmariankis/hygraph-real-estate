import {
  LISTING_STATUS_LABELS,
  LISTING_TYPE_LABELS,
  label,
  type ListingStatus,
  type ListingType,
} from "@/lib/domain";

const BASE =
  "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium";

export function ListingTypeBadge({
  listingType,
}: {
  listingType: ListingType | string;
}) {
  const tone =
    listingType === "rent"
      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 ring-inset"
      : "bg-blue-600 text-white";
  return (
    <span className={`${BASE} ${tone}`}>
      {label(LISTING_TYPE_LABELS, listingType)}
    </span>
  );
}

const STATUS_TONES: Record<ListingStatus, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 ring-inset",
  reserved: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 ring-inset",
  sold: "bg-slate-100 text-slate-600 ring-1 ring-slate-200 ring-inset",
  rented: "bg-slate-100 text-slate-600 ring-1 ring-slate-200 ring-inset",
};

export function StatusBadge({ status }: { status: ListingStatus | string }) {
  const tone =
    STATUS_TONES[status as ListingStatus] ??
    "bg-slate-100 text-slate-600 ring-1 ring-slate-200 ring-inset";
  return (
    <span className={`${BASE} ${tone}`}>
      {label(LISTING_STATUS_LABELS, status)}
    </span>
  );
}
