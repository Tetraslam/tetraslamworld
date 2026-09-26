"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  type Cell,
  createPlacementGate,
  MOSAIC_SIZE,
  moveCell,
} from "@/lib/mosaic-editor";
import { api } from "../../../convex/_generated/api";

const pigments = [
  ["ink", "#363C35"],
  ["stone", "#A5A393"],
  ["paper", "#F4F1E8"],
  ["terracotta", "#B96F53"],
  ["rose", "#D9A498"],
  ["ochre", "#CEAA61"],
  ["leaf", "#64795B"],
  ["sage", "#A8B799"],
  ["water", "#699BA6"],
  ["sky", "#B9D0DC"],
];
const coordinates = Array.from(
  { length: MOSAIC_SIZE },
  (_, coordinate) => coordinate,
);
export default function PixelsPage() {
  const { user } = useUser();
  const pixels = useQuery(api.pixelBoard.getAll, {});
  const place = useMutation(api.pixelBoard.place);
  const [color, setColor] = useState(pigments[3][1]);
  const [selected, setSelected] = useState<Cell | null>(null);
  const [focus, setFocus] = useState<Cell>({ x: 0, y: 0 });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const gate = useRef(createPlacementGate());
  const cells = useRef(new Map<string, HTMLButtonElement>());
  const map = new Map(
    pixels?.map((pixel) => [
      `${pixel.x},${pixel.y}`,
      { ...pixel, username: "username" in pixel ? pixel.username : undefined },
    ]),
  );
  const current = selected ? map.get(`${selected.x},${selected.y}`) : undefined;
  function select(cell: Cell) {
    if (gate.current.pending) return;
    setSelected(cell);
    setFocus(cell);
    setMessage("");
  }
  async function submit() {
    if (!selected || gate.current.pending || !pixels) return;
    setPending(true);
    setMessage("");
    try {
      const written = await gate.current.place(
        { ...selected, color },
        (draft) =>
          place({
            ...draft,
            clerkId: user?.id,
            username: user?.username || user?.firstName || undefined,
          }),
      );
      if (written) {
        setSelected(null);
        setMessage("placed.");
      }
    } catch {
      setMessage(
        "couldn’t place this colour. your preview is still here; try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageHeader path="/pixels" title="pixels" subtitle="" />
      <div className="mosaic-editor">
        <p id="mosaic-help" className="mosaic-help">
          choose a colour and a square, then place it. arrow keys move between
          squares.
        </p>
        <fieldset className="pigments" aria-label="Paint colours">
          {pigments.map(([name, value]) => (
            <button
              key={value}
              type="button"
              aria-label={name}
              title={name}
              aria-pressed={color === value}
              disabled={pending}
              onClick={() => {
                setColor(value);
                setMessage("");
              }}
            >
              <span style={{ backgroundColor: value }} />
            </button>
          ))}
        </fieldset>
        {!pixels ? (
          <output>loading the mosaic…</output>
        ) : (
          <table
            className="mosaic-grid"
            aria-label="Shared mosaic"
            aria-describedby="mosaic-help"
            aria-rowcount={MOSAIC_SIZE}
            aria-colcount={MOSAIC_SIZE}
          >
            <tbody>
              {coordinates.map((y) => (
                <tr key={`row-${y}`} className="mosaic-row">
                  {Array.from({ length: MOSAIC_SIZE }, (_, x) => {
                    const key = `${x},${y}`,
                      pixel = map.get(key),
                      active = selected?.x === x && selected.y === y;
                    return (
                      <td key={key}>
                        <button
                          type="button"
                          aria-pressed={active}
                          ref={(element) => {
                            if (element) cells.current.set(key, element);
                            else cells.current.delete(key);
                          }}
                          tabIndex={focus.x === x && focus.y === y ? 0 : -1}
                          disabled={pending}
                          aria-label={`row ${y + 1}, column ${x + 1}${pixel ? `, ${pixel.color}, by ${pixel.username || "anonymous"}` : ", empty"}`}
                          onFocus={() => setFocus({ x, y })}
                          onClick={() => select({ x, y })}
                          onKeyDown={(event) => {
                            if (gate.current.pending) return;
                            if (event.key === "Escape") {
                              event.preventDefault();
                              setSelected(null);
                              setMessage("");
                              return;
                            }
                            if (
                              [
                                "ArrowLeft",
                                "ArrowRight",
                                "ArrowUp",
                                "ArrowDown",
                                "Home",
                                "End",
                              ].includes(event.key)
                            ) {
                              event.preventDefault();
                              const next = moveCell({ x, y }, event.key);
                              select(next);
                              cells.current.get(`${next.x},${next.y}`)?.focus();
                            }
                          }}
                          style={{
                            backgroundColor: active
                              ? color
                              : pixel?.color || "#FAF8F1",
                          }}
                          className={
                            active ? "mosaic-cell selected" : "mosaic-cell"
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mosaic-actions">
          {selected ? (
            <>
              <span>
                row {selected.y + 1}, column {selected.x + 1}
                {current
                  ? ` · ${current.username || "anonymous"}’s square`
                  : ""}
              </span>
              <button
                type="button"
                className="text-action"
                onClick={submit}
                disabled={pending}
              >
                {pending ? "placing…" : "place colour"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setMessage("");
                }}
                disabled={pending}
              >
                cancel
              </button>
            </>
          ) : (
            <span>select a square to preview your colour.</span>
          )}
        </div>
        <output className="mosaic-message">{message}</output>
      </div>
    </div>
  );
}
