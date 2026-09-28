export function ShortcutLabel({
  label,
  shortcut,
}: {
  label: string;
  shortcut?: string;
}) {
  const index = shortcut
    ? label.toLowerCase().indexOf(shortcut.toLowerCase())
    : -1;
  if (index < 0) return <>{label}</>;
  return (
    <>
      {label.slice(0, index)}
      <span className="shortcut-letter">{label[index]}</span>
      {label.slice(index + 1)}
    </>
  );
}
