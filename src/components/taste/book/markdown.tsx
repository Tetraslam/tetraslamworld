import type { ComponentProps } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { IntentLink } from "@/components/intent-link";
import { resolveHref } from "../../../../shared/tetrastack";

/** Markdown from a tetrastack file, with its links pointed at the right place. */
function components(from: string, inline: boolean): Components {
  return {
    a: ({ href, children }) => {
      const target = href ? resolveHref(href, from) : "#";
      return target.startsWith("/") ? (
        <IntentLink href={target}>{children}</IntentLink>
      ) : (
        <a href={target} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    },
    ...(inline ? { p: ({ children }) => <>{children}</> } : {}),
  };
}

export function Markdown({
  children,
  from = "taste.md",
  inline = false,
  className,
}: {
  children: string;
  from?: string;
  inline?: boolean;
  className?: string;
}) {
  const props: ComponentProps<typeof ReactMarkdown> = {
    remarkPlugins: [remarkGfm],
    components: components(from, inline),
    // Raw HTML in the source stays text.
    skipHtml: true,
    children,
  };
  if (inline) return <ReactMarkdown {...props} />;
  return (
    <div className={className}>
      <ReactMarkdown {...props} />
    </div>
  );
}
