import Link from "next/link";
import type { AgentSummary } from "@/lib/queries";

/** Initials stand in when an agent has no portrait in the CMS. */
function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AgentCard({
  agent,
  showAgency = true,
}: {
  agent: AgentSummary;
  showAgency?: boolean;
}) {
  const agency = agent.agencyName;

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {agent.photo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={agent.photo.url}
            alt=""
            className="size-11 shrink-0 rounded-full bg-slate-100 object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700"
          >
            {initials(agent.fullName)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{agent.fullName}</p>
          {showAgency && agency && (
            <p className="truncate text-sm text-slate-500">
              {agency.slug ? (
                <Link
                  href={`/agency/${agency.slug}`}
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {agency.name}
                </Link>
              ) : (
                agency.name
              )}
            </p>
          )}
        </div>
      </div>

      <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-slate-400">Phone</dt>
          <dd className="min-w-0 truncate">
            <a
              href={`tel:${agent.phone.replace(/\s+/g, "")}`}
              className="font-medium text-slate-700 hover:text-blue-600"
            >
              {agent.phone}
            </a>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-slate-400">Email</dt>
          <dd className="min-w-0 truncate">
            <a
              href={`mailto:${agent.email}`}
              className="font-medium text-slate-700 hover:text-blue-600"
            >
              {agent.email}
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
