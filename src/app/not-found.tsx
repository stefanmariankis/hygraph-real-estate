import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-medium text-blue-600">404</p>
      <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        The listing or agency you are looking for was removed or never
        published.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Back to listings
      </Link>
    </div>
  );
}
