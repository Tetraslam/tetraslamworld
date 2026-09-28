import type { ReactNode } from "react";

export function PageHeader({
  title,
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
    <header className="page-heading">
      <h1>{title === "blog" ? "writing" : title}</h1>
      {action && <div>{action}</div>}
    </header>
  );
}
