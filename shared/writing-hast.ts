type Element = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: Element[];
};
// Sanitization prefixes IDs to prevent DOM clobbering. Keep footnote and local
// heading links aligned with those safe IDs rather than disabling the protection.
export function alignWritingAnchors() {
  return (root: unknown) => {
    const ids = new Set<string>(),
      nodes: Element[] = [];
    const visit = (node: Element) => {
      nodes.push(node);
      if (typeof node.properties?.id === "string") ids.add(node.properties.id);
      node.children?.forEach(visit);
    };
    visit(root as Element);
    const target = (value: string) =>
      ids.has(value)
        ? value
        : ids.has(`user-content-${value}`)
          ? `user-content-${value}`
          : value;
    for (const node of nodes) {
      const props = node.properties;
      if (!props) continue;
      if (typeof props.href === "string" && props.href.startsWith("#"))
        props.href = `#${target(props.href.slice(1))}`;
      for (const key of ["ariaDescribedBy", "ariaLabelledBy"]) {
        const value = props[key];
        if (Array.isArray(value))
          props[key] = value.map((item) =>
            typeof item === "string" ? target(item) : item,
          );
        else if (typeof value === "string")
          props[key] = value.split(" ").map(target).join(" ");
      }
    }
  };
}
