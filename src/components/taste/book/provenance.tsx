import { TETRASTACK_URL, type Tetrastack } from "../../../../shared/tetrastack";

function day(ms: number) {
  return new Date(ms)
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })
    .toLowerCase();
}

/** Which version of tetrastack this page shows, and how old it is. */
export function Provenance({
  stack,
  path,
}: {
  stack: Pick<Tetrastack, "sha" | "updatedAt" | "origin">;
  path?: string;
}) {
  const commit = /^[0-9a-f]{7,}$/.test(stack.sha) ? stack.sha : null;
  const file = path ? `${TETRASTACK_URL}/blob/main/${path}` : TETRASTACK_URL;
  return (
    <p className="book-provenance">
      {stack.origin === "local" ? (
        "from a local copy of tetrastack"
      ) : (
        <>
          from{" "}
          <a href={file} target="_blank" rel="noreferrer">
            tetrastack
          </a>
          {commit && (
            <>
              {" "}
              at{" "}
              <a
                href={`${TETRASTACK_URL}/commit/${commit}`}
                target="_blank"
                rel="noreferrer"
              >
                <code>{commit.slice(0, 7)}</code>
              </a>
            </>
          )}
          , {day(stack.updatedAt)}
          {stack.origin === "snapshot" &&
            " (a saved copy: github couldn’t be reached)"}
        </>
      )}
      {path && (
        <>
          {" · "}
          <a
            href={`${TETRASTACK_URL}/edit/main/${path}`}
            target="_blank"
            rel="noreferrer"
          >
            edit
          </a>
        </>
      )}
    </p>
  );
}
