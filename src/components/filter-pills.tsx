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
  const sizing = size === "md" ? "py-1 text-base" : "py-1 text-sm";

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
      {label && (
        <span className="text-xs text-muted-foreground select-none">
          {label}
        </span>
      )}
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`${sizing} border-b transition-colors ${
            value === option.value
              ? "border-rose-deep text-rose-deep"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
