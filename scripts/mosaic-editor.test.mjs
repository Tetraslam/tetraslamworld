import assert from "node:assert/strict";
import test from "node:test";
import { createPlacementGate, moveCell } from "../src/lib/mosaic-editor.ts";

test("arrow navigation never wraps or leaves the board", () => {
  assert.deepEqual(moveCell({ x: 0, y: 0 }, "ArrowLeft"), { x: 0, y: 0 });
  assert.deepEqual(moveCell({ x: 31, y: 31 }, "ArrowDown"), { x: 31, y: 31 });
  let cell = { x: 0, y: 0 };
  for (let i = 0; i < 100; i++) cell = moveCell(cell, "ArrowRight");
  assert.deepEqual(cell, { x: 31, y: 0 });
  assert.deepEqual(moveCell(cell, "Home"), { x: 0, y: 0 });
  assert.deepEqual(moveCell({ x: 4, y: 7 }, "End"), { x: 31, y: 7 });
});

test("double submission makes one write and snapshots the submitted draft", async () => {
  const gate = createPlacementGate();
  const draft = { x: 4, y: 7, color: "#B96F53" };
  const writes = [];
  let finish;
  const write = (value) => {
    writes.push(value);
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  const first = gate.place(draft, write);
  assert.equal(gate.pending, true);
  draft.color = "#363C35";
  assert.equal(await gate.place(draft, write), false);
  assert.deepEqual(writes, [{ x: 4, y: 7, color: "#B96F53" }]);
  finish();
  assert.equal(await first, true);
  assert.equal(gate.pending, false);
});

test("rejected write unlocks the editor and leaves the draft available for retry", async () => {
  const gate = createPlacementGate();
  const draft = { x: 31, y: 0, color: "#699BA6" };
  await assert.rejects(
    gate.place(draft, async () => {
      throw new Error("offline");
    }),
    /offline/,
  );
  assert.equal(gate.pending, false);
  assert.deepEqual(draft, { x: 31, y: 0, color: "#699BA6" });
  let actual;
  assert.equal(
    await gate.place(draft, async (value) => {
      actual = value;
    }),
    true,
  );
  assert.deepEqual(actual, draft);
});

test("invalid drafts never reach the mutation", async () => {
  let calls = 0;
  for (const draft of [
    { x: -1, y: 0, color: "#363C35" },
    { x: 32, y: 0, color: "#363C35" },
    { x: 0.5, y: 0, color: "#363C35" },
    { x: 0, y: 0, color: "red" },
  ]) {
    await assert.rejects(
      createPlacementGate().place(draft, async () => {
        calls++;
      }),
    );
  }
  assert.equal(calls, 0);
});
