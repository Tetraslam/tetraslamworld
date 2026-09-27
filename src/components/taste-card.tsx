"use client";

import { entranceStyle } from "@/lib/motion";
import {
  type TasteFilter,
  type TasteRecord,
  tasteCover,
  tasteHref,
} from "../../shared/taste";
import { IntentLink } from "./intent-link";
import { TastePreview } from "./taste/preview";

export function TasteCard({
  item,
  delay = 0,
  filter,
}: {
  item: TasteRecord;
  delay?: number;
  filter?: TasteFilter;
}) {
  const href = tasteHref(item, filter);
  return (
    <article
      className={`taste-card enter-item ${item.prominent ? "taste-card-prominent" : ""}`}
      data-motion-key={item._id}
      style={entranceStyle(delay)}
    >
      <TastePreview
        asset={tasteCover(item)}
        title={item.title}
        href={href}
        previewKey={item._id}
      />
      <h2>
        <IntentLink href={href}>{item.title}</IntentLink>
      </h2>
      {item.observation && (
        <p className="taste-observation">{item.observation}</p>
      )}
      {item.url && (
        <a
          className="taste-source-small"
          href={item.url}
          target="_blank"
          rel="noreferrer"
        >
          source ↗
        </a>
      )}
    </article>
  );
}
