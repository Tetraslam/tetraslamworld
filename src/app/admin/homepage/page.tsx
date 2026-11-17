"use client";

import { useEffect, useRef, useState } from "react";
import { HomeCopy } from "@/components/home-copy";
import {
  DEFAULT_HOME,
  HOME_LIMITS,
  type HomeContent,
} from "../../../../shared/home-content";
import { loadHomepage, saveHomepage } from "./actions";

export default function HomepageEditor() {
  const [base, setBase] = useState<HomeContent | null>(null);
  const [heading, setHeading] = useState(DEFAULT_HOME.heading);
  const [body, setBody] = useState(DEFAULT_HOME.body);
  const [now, setNow] = useState(DEFAULT_HOME.now);
  const [status, setStatus] = useState("loading saved copy…");
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [latest, setLatest] = useState<HomeContent | null>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    void loadHomepage()
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setBase(result.content);
          setHeading(result.content.heading);
          setBody(result.content.body);
          setNow(result.content.now ?? "");
          setStatus("");
        } else setStatus(result.message);
      })
      .catch(() => {
        if (!cancelled)
          setStatus("Couldn’t load the editor. Reload this page to try again.");
      });
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, []);
  const dirty =
    !!base &&
    (heading !== base.heading ||
      body !== base.body ||
      now !== (base.now ?? ""));
  async function save() {
    if (!base || pending.current) return;
    pending.current = true;
    setSaving(true);
    setStatus("");
    try {
      const result = await saveHomepage({
        heading,
        body,
        now,
        expectedRevision: base.revision,
      });
      if (!mounted.current) return;
      if (result.ok) {
        setBase(result.content);
        setHeading(result.content.heading);
        setBody(result.content.body);
        setNow(result.content.now ?? "");
        setStatus("saved.");
        setConflict(false);
        setLatest(null);
      } else {
        setStatus(result.message);
        setConflict(result.code === "CONFLICT");
      }
    } catch {
      if (mounted.current)
        setStatus("Couldn’t save. Your draft is still here; please try again.");
    } finally {
      pending.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  return (
    <div className="bio-editor">
      <div className="bio-editor-header">
        <h1>homepage</h1>
        <button
          type="button"
          className="text-action"
          onClick={save}
          disabled={!base || !dirty || saving || conflict}
        >
          {saving ? "saving…" : "save changes"}
        </button>
      </div>
      <div className="bio-editor-grid">
        <fieldset disabled={!base || saving}>
          <label htmlFor="home-heading">heading</label>
          <input
            id="home-heading"
            value={heading}
            onChange={(event) => {
              setHeading(event.target.value);
              setStatus("");
            }}
            maxLength={HOME_LIMITS.heading}
          />
          <label htmlFor="home-body">bio · markdown</label>
          <textarea
            id="home-body"
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              setStatus("");
            }}
            maxLength={HOME_LIMITS.body}
            rows={14}
          />
          <label htmlFor="home-now">now · markdown, optional</label>
          <textarea
            id="home-now"
            value={now}
            onChange={(event) => {
              setNow(event.target.value);
              setStatus("");
            }}
            maxLength={HOME_LIMITS.now}
            rows={4}
            placeholder="what you're up to lately. the date updates when this changes."
          />
        </fieldset>
        <section className="bio-preview" aria-label="Homepage preview">
          <h2>{heading}</h2>
          <HomeCopy body={body} preview />
          {now.trim() && (
            <aside className="home-now">
              <p className="home-now-label">now · updated today</p>
              <HomeCopy body={now} preview />
            </aside>
          )}
        </section>
      </div>
      <output className="bio-status">
        {status || (dirty ? "unsaved changes" : "")}
      </output>
      {conflict && (
        <div className="bio-conflict">
          <p>
            your draft is preserved. review the latest saved version before
            deciding what to keep.
          </p>
          <button
            type="button"
            className="text-action"
            onClick={async () => {
              try {
                const result = await loadHomepage();
                if (result.ok) setLatest(result.content);
                else setStatus(result.message);
              } catch {
                setStatus("Couldn’t load the latest version. Try again.");
              }
            }}
          >
            review latest
          </button>
          {latest && (
            <>
              <h2 className="mt-5 text-xl">latest saved version</h2>
              <h3>{latest.heading}</h3>
              <HomeCopy body={latest.body} preview />
              <div className="editorial-links">
                <button
                  type="button"
                  className="text-action"
                  onClick={() => {
                    setBase(latest);
                    setHeading(latest.heading);
                    setBody(latest.body);
                    setNow(latest.now ?? "");
                    setConflict(false);
                    setLatest(null);
                    setStatus("");
                  }}
                >
                  use latest copy
                </button>
                <button
                  type="button"
                  className="text-action"
                  onClick={() => {
                    setBase(latest);
                    setConflict(false);
                    setLatest(null);
                    setStatus(
                      "draft kept. save changes to publish it over the version you reviewed.",
                    );
                  }}
                >
                  keep my draft
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <a href="/" target="_blank" rel="noreferrer" className="text-action">
        view homepage ↗
      </a>
    </div>
  );
}
