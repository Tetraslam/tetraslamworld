"use client";

import { useQuery } from "convex/react";
import { useRef } from "react";
import { api } from "../../convex/_generated/api";
import type { HomeContent } from "../../shared/home-content";
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
      <nav aria-label="Contact" className="home-contact">
        <a href="https://x.com/tetraslam">twitter</a>
        <a href="https://github.com/tetraslam">github</a>
        <a href="mailto:bhowmickshresht@gmail.com">email</a>
      </nav>
    </section>
  );
}
