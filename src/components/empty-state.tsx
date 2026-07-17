/**
 * Standard empty state: a small ascii tetrahedron and one line of copy.
 */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      <pre
        aria-hidden="true"
        className="inline-block text-rose/40 text-xs leading-tight mb-4 select-none"
      >{`   /\\
  /  \\
 / ·· \\
/______\\`}</pre>
      <p>{message}</p>
    </div>
  );
}
