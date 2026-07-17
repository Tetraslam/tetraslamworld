"use client";

/**
 * Standard filter pill row. One style everywhere: the work-page treatment
 * (best hit target), with an optional inline label prefix.
 */
export function FilterPills<T extends string | null>({
  label,
  options,
  value,
  onChange,
  size = "md",
}: {
  label?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: "md" | "sm";
}) {
  const sizing = size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <span className="text-xs text-muted-foreground select-none">
          {label}
        </span>
      )}
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          className={`${sizing} rounded-lg border transition-all ${
            value === option.value
              ? "border-rose bg-rose/10 text-rose"
              : "border-border text-muted-foreground hover:border-rose/50 hover:bg-surface"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
