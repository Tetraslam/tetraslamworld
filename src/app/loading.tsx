"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  work: "work",
  blog: "writing",
  friends: "friends",
  media: "media",
  links: "links",
  taste: "taste",
  travel: "travel",
  gallery: "gallery",
  pixels: "pixels",
};
export default function Loading() {
  const pathname = usePathname();
  const section = pathname.split("/")[1];
  const article = section === "blog" && pathname.split("/").length > 2;
  const gallery = ["media", "gallery", "taste"].includes(section);
  return (
    <div
      className={`page-arrival arrival-${section} ${["media", "taste", "travel"].includes(section) ? "arrival-wide" : ""} ${article ? "arrival-article" : ""}`}
      aria-busy="true"
    >
      <output className="sr-only">loading {titles[section] ?? "page"}…</output>
      {article ? (
        <div className="arrival-title" aria-hidden="true" />
      ) : (
        <header className="page-heading">
          <h1>{titles[section] ?? ""}</h1>
        </header>
      )}
      <div
        aria-hidden="true"
        className={gallery ? "arrival-grid" : "arrival-rows"}
      >
        {["first", "second", "third"].map((key) => (
          <div key={key} className="arrival-item">
            {gallery && <div className="arrival-picture" />}
            <div className="arrival-line" />
            <div className="arrival-line short" />
          </div>
        ))}
      </div>
    </div>
  );
}
