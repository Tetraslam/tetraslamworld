"use client";

import { useQuery } from "convex/react";
import { useRef } from "react";
import { api } from "../../convex/_generated/api";
import { formatNowDate, type HomeContent } from "../../shared/home-content";
import { BookCallLink } from "./book-call-link";
import { HomeCopy } from "./home-copy";

export function HomeIntroduction({
  initialContent,
}: {
  initialContent: HomeContent;
}) {
  const live = useQuery(api.homepage.get, {});
  // Public revisions only increase. Keep the newest observed copy through an
  // auth reconnect, and never let an older client cache replace server data.
  const latest = useRef(initialContent);
  if (initialContent.revision > latest.current.revision)
    latest.current = initialContent;
  if (live && live.revision > latest.current.revision) latest.current = live;
  const content = latest.current;
  return (
    <section className="home-intro">
      <h1>{content.heading}</h1>
      <HomeCopy body={content.body} />
      {content.now && (
        <aside className="home-now" aria-labelledby="home-now-label">
          <p id="home-now-label" className="home-now-label">
            now
            {content.nowUpdatedAt > 0 && (
              <>
                {" · updated "}
                <time dateTime={new Date(content.nowUpdatedAt).toISOString()}>
                  {formatNowDate(content.nowUpdatedAt)}
                </time>
              </>
            )}
          </p>
          <HomeCopy body={content.now} />
        </aside>
      )}
      <nav aria-label="Contact" className="home-contact">
        <a href="https://x.com/tetraslam">twitter</a>
        <a href="https://github.com/tetraslam">github</a>
        <a href="mailto:bhowmickshresht@gmail.com">email</a>
        <BookCallLink />
      </nav>
    </section>
  );
}
