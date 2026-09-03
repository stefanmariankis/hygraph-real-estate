import { notFound } from "next/navigation";
import AgentCard from "@/components/AgentCard";
import BackLink from "@/components/BackLink";
import PropertyGallery from "@/components/PropertyGallery";
import StatCard from "@/components/StatCard";
import Testimonials from "@/components/Testimonials";
import { ListingTypeBadge, StatusBadge } from "@/components/Badges";
import {
  LAYOUT_DESCRIPTIONS,
  LAYOUT_LABELS,
  LISTING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  formatFloorShort,
  formatNumber,
  formatPrice,
  formatRooms,
  formatSurface,
  label,
  type Layout,
} from "@/lib/domain";
import { getPropertyBySlug, getPropertySlugs } from "@/lib/queries";
import type { Testimonial } from "@/lib/queries";

export async function generateStaticParams() {
  const slugs = await getPropertySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/property/[slug]">) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Property not found" };

  const place = [property.neighborhood?.name, property.city?.name]
    .filter(Boolean)
    .join(", ");

  return {
    title: property.title,
    description: `${label(PROPERTY_TYPE_LABELS, property.propertyType)} in ${
      place || "Romania"
    } · ${formatRooms(property.rooms)} · ${formatSurface(property.surface)} · ${formatPrice(
      property.price,
      property.listingType,
    )}`,
  };
}

export default async function PropertyPage({ params }: PageProps<"/property/[slug]">) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) notFound();

  const agents = property.agent ?? [];
  const features = property.feature ?? [];
  const pricePerSqm =
    property.listingType === "sale" && property.surface > 0
      ? Math.round(property.price / property.surface)
      : null;

  // One property can be handled by two agents who share a client, so the
  // testimonials have to be de-duplicated before they are shown.
  const testimonials = Array.from(
    agents
      .flatMap((agent) => agent.testimonial ?? [])
      .reduce((unique, t) => unique.set(t.id, t), new Map<string, Testimonial>())
      .values(),
  );

  const place = [property.neighborhood?.name, property.city?.name]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <BackLink />

      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <ListingTypeBadge listingType={property.listingType} />
          <StatusBadge status={property.propertyStatus} />
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {property.title}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {place || "—"}
          <span className="mx-1.5 text-slate-300">·</span>
          {label(PROPERTY_TYPE_LABELS, property.propertyType)}
          <span className="mx-1.5 text-slate-300">·</span>
          {label(LAYOUT_LABELS, property.layout)}
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <PropertyGallery property={property} images={property.images} />

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Rooms" value={String(property.rooms)} />
            <StatCard label="Surface" value={formatSurface(property.surface)} />
            <StatCard label="Bathrooms" value={String(property.bathrooms)} />
            <StatCard label="Floor" value={formatFloorShort(property.floor)} />
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Details</h2>
            <dl className="mt-4 divide-y divide-slate-100">
              <Row
                term="Property type"
                value={label(PROPERTY_TYPE_LABELS, property.propertyType)}
              />
              <Row
                term="Listing type"
                value={label(LISTING_TYPE_LABELS, property.listingType)}
              />
              <Row term="City" value={property.city?.name ?? "—"} />
              <Row term="Neighborhood" value={property.neighborhood?.name ?? "—"} />
              {property.city?.county && (
                <Row term="County" value={property.city.county} />
              )}
              <Row
                term="Room layout"
                value={label(LAYOUT_LABELS, property.layout)}
                hint={LAYOUT_DESCRIPTIONS[property.layout as Layout]}
              />
              {pricePerSqm !== null && (
                <Row term="Price per m²" value={`€${formatNumber(pricePerSqm)}`} />
              )}
            </dl>
          </section>

          {property.description?.html && (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Description</h2>
              <div
                className="richtext mt-3"
                dangerouslySetInnerHTML={{ __html: property.description.html }}
              />
            </section>
          )}

          {features.length > 0 && (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Features</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {features.map((feature) => (
                  <li
                    key={feature.id}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
                  >
                    {feature.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {property.city?.description?.html && (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                About {property.city.name}
              </h2>
              <div
                className="richtext mt-3"
                dangerouslySetInnerHTML={{ __html: property.city.description.html }}
              />
            </section>
          )}

          {testimonials.length > 0 && (
            <div className="mt-10">
              <Testimonials
                testimonials={testimonials}
                heading={agents.length === 1 ? "What clients say about this agent" : "What clients say"}
              />
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              {property.listingType === "rent" ? "Monthly rent" : "Price"}
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {formatPrice(property.price, property.listingType)}
            </p>
            {pricePerSqm !== null && (
              <p className="mt-1 text-sm text-slate-400">
                €{formatNumber(pricePerSqm)} per m²
              </p>
            )}
            {agents[0] && (
              <a
                href={`mailto:${agents[0].email}?subject=${encodeURIComponent(
                  `Enquiry: ${property.title}`,
                )}`}
                className="mt-5 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Contact agent
              </a>
            )}
          </div>

          {agents.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">
                {agents.length === 1 ? "Agent" : "Agents"}
              </h2>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ term, value, hint }: { term: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-slate-500">{term}</dt>
      <dd className="text-right">
        <span className="text-sm font-medium text-slate-900">{value}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>}
      </dd>
    </div>
  );
}
