import ReactMarkdown from "react-markdown";
import { IntentLink } from "./intent-link";

export function HomeCopy({
  body,
  preview = false,
}: {
  body: string;
  preview?: boolean;
}) {
  return (
    <div className="home-bio">
      <ReactMarkdown
        components={{
          a: ({ href, children }) =>
            !preview && href?.startsWith("/") && !href.startsWith("//") ? (
              <IntentLink href={href}>{children}</IntentLink>
            ) : (
              <a
                href={href}
                rel="noreferrer"
                target={preview ? "_blank" : undefined}
              >
                {children}
              </a>
            ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
