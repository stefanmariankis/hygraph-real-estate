"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-xl font-bold tracking-tight text-slate-900">
        Could not load the data
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        The request to Hygraph failed. Check{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
          NEXT_PUBLIC_HYGRAPH_ENDPOINT
        </code>{" "}
        in <code className="font-mono text-xs">.env.local</code> and try again.
      </p>
      {error.message && (
        <p className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left font-mono text-xs break-words text-slate-500">
          {error.message}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
