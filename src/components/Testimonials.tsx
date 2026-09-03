import type { Testimonial } from "@/lib/queries";

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="flex gap-0.5"
      role="img"
      aria-label={`${rating} out of 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`size-4 ${i < rating ? "text-amber-400" : "text-slate-200"}`}
          fill="currentColor"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export default function Testimonials({
  testimonials,
  heading = "What clients say",
}: {
  testimonials: Testimonial[];
  heading?: string;
}) {
  if (testimonials.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{heading}</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {testimonials.map((testimonial) => (
          <li
            key={testimonial.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            {testimonial.rating != null && <Stars rating={testimonial.rating} />}
            <blockquote className="mt-3 text-sm leading-relaxed text-slate-600">
              “{testimonial.quote}”
            </blockquote>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {testimonial.authorName}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
