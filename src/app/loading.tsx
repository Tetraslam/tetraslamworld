export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center">
      <pre
        aria-hidden="true"
        className="text-rose/60 text-xs leading-tight animate-pulse-subtle select-none"
      >{`   /\\
  /  \\
 / ·· \\
/______\\`}</pre>
      <p className="text-muted-foreground text-sm mt-4 animate-pulse-subtle">
        loading...
      </p>
    </div>
  );
}
