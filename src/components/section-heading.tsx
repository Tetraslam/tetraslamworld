/**
 * Standard section heading: pulsing dot, label, hairline rule, count.
 * The dot was already the site's signature on /work; now every page gets it.
 */
export function SectionHeading({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <h2 className="text-xl font-semibold text-rose mb-4 flex items-center gap-3">
      <span className="flex items-center gap-2 shrink-0">
        <span className="w-2 h-2 rounded-full bg-rose animate-pulse-subtle" />
        {title}
      </span>
      <span className="flex-1 border-t border-border/50" aria-hidden="true" />
      {typeof count === "number" && (
        <span className="text-xs font-normal text-muted-foreground/60 select-none">
          {String(count).padStart(2, "0")}
        </span>
      )}
    </h2>
  );
}
