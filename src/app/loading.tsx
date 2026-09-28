"use client";

import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/page-header";

const pages: Record<string, { title: string; width: string }> = {
  work: { title: "work", width: "max-w-4xl" },
  blog: { title: "writing", width: "max-w-4xl" },
  friends: { title: "friends", width: "max-w-4xl" },
  media: { title: "media", width: "max-w-5xl" },
  links: { title: "links", width: "max-w-4xl" },
  taste: { title: "taste", width: "max-w-6xl" },
  travel: { title: "travel", width: "max-w-5xl" },
  gallery: { title: "gallery", width: "max-w-6xl" },
  pixels: { title: "pixels", width: "max-w-4xl" },
};
const slots = ["one", "two", "three", "four", "five", "six"];

function Bar({
  width = "70%",
  height = 12,
}: {
  width?: string;
  height?: number;
}) {
  return <span className="skeleton-bar" style={{ width, height }} />;
}
function Lines() {
  return (
    <div className="skeleton-lines">
      <Bar width="92%" />
      <Bar width="85%" />
      <Bar width="62%" />
    </div>
  );
}
function Search({ selects = 0 }: { selects?: number }) {
  const field = (
    <div className="collection-search skeleton-search">
      <Bar width="140px" height={14} />
    </div>
  );
  return selects ? (
    <div className="collection-tools">
      {field}
      {slots.slice(0, selects).map((key) => (
        <span className="skeleton-select" key={key}>
          <Bar width="80px" />
        </span>
      ))}
    </div>
  ) : (
    field
  );
}
function Content({ section }: { section: string }) {
  switch (section) {
    case "work":
      return (
        <section className="experience-list">
          {slots.slice(0, 3).map((key) => (
            <article key={key}>
              <div className="skeleton-experience">
                <Bar width="58%" height={31} />
                <Bar width="90%" height={25} />
              </div>
              <p className="entry-date">
                <Bar width="130px" height={21} />
              </p>
            </article>
          ))}
        </section>
      );
    case "blog":
      return (
        <>
          <Search />
          <section className="writing-year">
            <Bar width="40px" height={22} />
            <div>
              {slots.slice(0, 3).map((key) => (
                <article key={key}>
                  <Bar width="80%" height={32} />
                  <div className="skeleton-summary">
                    <Bar width="95%" height={24} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      );
    case "links":
      return (
        <>
          <Search selects={2} />
          <div className="bookmark-list">
            {slots.slice(0, 3).map((key) => (
              <article key={key}>
                <Bar width="75%" height={31} />
                <div className="entry-domain">
                  <Bar width="120px" height={20} />
                </div>
              </article>
            ))}
          </div>
        </>
      );
    case "taste":
      return (
        <>
          <Search selects={1} />
          <div className="taste-collection">
            {slots.map((key) => (
              <div key={key}>
                <div className="skeleton-picture skeleton-reference" />
                <div className="skeleton-caption">
                  <Bar height={28} />
                </div>
              </div>
            ))}
          </div>
        </>
      );
    case "media":
      return (
        <>
          <div className="skeleton-filters">
            <Bar width="300px" height={16} />
          </div>
          <div className="media-shelves">
            <section>
              <div className="section-title skeleton-section-title">
                <Bar width="90px" height={24} />
              </div>
              <div className="media-shelf">
                {slots.slice(0, 4).map((key) => (
                  <div key={key} className="media-cover">
                    <span className="cover-image" />
                    <Bar height={23} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      );
    case "gallery":
      return (
        <div className="gallery-grid">
          {slots.slice(0, 3).map((key) => (
            <div key={key}>
              <span className="gallery-thumb" />
              <div className="gallery-caption pt-2">
                <Bar height={23} />
              </div>
            </div>
          ))}
        </div>
      );
    case "friends":
      return (
        <div className="friends-grid">
          {slots.slice(0, 4).map((key) => (
            <div key={key} className="p-5 tcard">
              <div className="skeleton-friend">
                <span className="skeleton-avatar" />
                <div>
                  <Bar height={29} />
                  <Lines />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    case "travel":
      return (
        <>
          <div>
            <div className="travel-map skeleton-picture" />
          </div>
          <div className="travel-index">
            <aside>
              <Search />
              <Lines />
            </aside>
            <div>
              <Bar width="160px" height={36} />
              <Lines />
            </div>
          </div>
        </>
      );
    case "pixels":
      return (
        <div className="mosaic-editor">
          <div className="mosaic-help">
            <Bar width="90%" height={25} />
          </div>
          <div className="skeleton-filters">
            <Bar width="85%" height={32} />
          </div>
          <div className="skeleton-picture skeleton-mosaic" />
        </div>
      );
    default:
      return <Lines />;
  }
}

export default function Loading() {
  const pathname = usePathname();
  const section = pathname.split("/")[1];
  const page = pages[section];
  if (!page) return null;
  const article =
    (section === "blog" || section === "taste") &&
    pathname.split("/").length > 2;
  return (
    <div
      className={`${article ? "max-w-3xl" : page.width} mx-auto px-4 py-12 loading-shell`}
      aria-busy="true"
    >
      <output className="sr-only">loading {page.title}…</output>
      {article ? (
        <div aria-hidden="true">
          <Bar width="85px" height={20} />
          <div className="skeleton-article-title">
            <Bar height={44} />
          </div>
          <Lines />
          {section === "taste" && (
            <div className="skeleton-picture skeleton-reference mt-8" />
          )}
        </div>
      ) : (
        <>
          <PageHeader path={pathname} title={page.title} subtitle="" />
          <div aria-hidden="true">
            <Content section={section} />
          </div>
        </>
      )}
    </div>
  );
}
