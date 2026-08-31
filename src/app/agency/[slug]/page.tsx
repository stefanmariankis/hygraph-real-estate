import { notFound } from "next/navigation";
import AgentCard from "@/components/AgentCard";
import BackLink from "@/components/BackLink";
import EmptyState from "@/components/EmptyState";
import StatCard from "@/components/StatCard";
import { PropertyGrid } from "@/components/PropertyGrid";
import { getAgencyBySlug, getAgencySlugs } from "@/lib/queries";
import type { PropertySummary } from "@/lib/queries";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAgencySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/agency/[slug]">) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) return { title: "Agency not found" };

  return {
    title: agency.name,
    description: `${agency.name} — team and listings.`,
  };
}

export default async function AgencyPage({
  params,
}: PageProps<"/agency/[slug]">) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);

  if (!agency) notFound();

  const agents = agency.agentName ?? [];

  // The same listing can be handled by two agents of the agency, so the union
  // of their portfolios has to be de-duplicated before it is counted.
  const properties = Array.from(
    agents
      .flatMap((agent) => agent.property ?? [])
      .reduce(
        (unique, property) => unique.set(property.id, property),
        new Map<string, PropertySummary>(),
      )
      .values(),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <BackLink />

      <header className="mt-5">
        <p className="text-sm font-medium text-blue-600">Agency</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {agency.name}
        </h1>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Founded"
          value={agency.foundedYear ? String(agency.foundedYear) : "—"}
        />
        <StatCard
          label={agents.length === 1 ? "Agent" : "Agents"}
          value={String(agents.length)}
        />
        <StatCard label="Listings" value={String(properties.length)} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Team</h2>
        {agents.length === 0 ? (
          <EmptyState
            title="No agents yet"
            body="This agency has no agents associated in the CMS."
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <li key={agent.id}>
                <AgentCard agent={agent} showAgency={false} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Listings</h2>
        {properties.length === 0 ? (
          <EmptyState
            title="No active listings"
            body="Agents at this agency have no published listings right now."
            actionHref="/"
            actionLabel="Browse all listings"
          />
        ) : (
          <PropertyGrid properties={properties} />
        )}
      </section>
    </div>
  );
}
