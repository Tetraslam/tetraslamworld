import type { ReactNode } from "react";

/**
 * Standard page header: `~/path` eyebrow, title, subtitle, optional count
 * and action slot. Every content page shares this so the site reads as one
 * system instead of ten hand-rolled headers.
 */
export function PageHeader({
  path,
  title,
  subtitle,
  count,
  countLabel = "entries",
  action,
}: {
  path: string;
  title: string;
  subtitle: string;
  count?: number;
  countLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs text-muted-foreground/70 tracking-wider select-none">
          ~{path}
        </p>
        <h1 className="text-3xl font-bold mt-1">{title}</h1>
        <p className="text-muted-foreground mt-1">
          {subtitle}
          {typeof count === "number" && (
            <span className="text-muted-foreground/60">
              {" "}
              · {count} {countLabel}
            </span>
          )}
        </p>
      </div>
      {action && <div className="shrink-0 mt-5">{action}</div>}
    </header>
  );
}
