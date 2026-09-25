import assert from "node:assert/strict";
import test from "node:test";
import {
  createCatRoutine,
  sampleCat,
  wakeCat,
} from "../src/app/terrace/cat-motion.ts";

test("a thirty-minute day stays bounded and includes every behaviour", () => {
  const routine = createCatRoutine();
  const phases = new Set();
  let previousOffset = 0;
  for (let frame = 0; frame <= 1800 * 24; frame++) {
    const pose = sampleCat(routine, frame / 24);
    phases.add(pose.phase);
    assert.ok(pose.row >= 0 && pose.row < 16);
    assert.ok(pose.mix >= 0 && pose.mix <= 1);
    assert.ok(pose.offset >= 0 && pose.offset <= 4);
    assert.ok(
      Math.abs(pose.offset - previousOffset) < 0.06,
      "the cat must not teleport when a routine rolls over",
    );
    previousOffset = pose.offset;
  }
  assert.deepEqual([...phases].sort(), [
    "rising",
    "settling",
    "sleeping",
    "stretching",
    "watching",
  ]);
  assert.ok(routine.cycles > 10);
});

test("saying hello wakes a resting cat without interrupting an active routine", () => {
  const routine = createCatRoutine();
  wakeCat(routine, 2);
  assert.equal(routine.wakeAt, 2);
  const before = sampleCat(routine, 5);
  wakeCat(routine, 5);
  assert.deepEqual(sampleCat(routine, 5), before);
  sampleCat(routine, 20);
  assert.equal(sampleCat(routine, 21).phase, "sleeping");
  wakeCat(routine, 21);
  assert.equal(sampleCat(routine, 22).phase, "watching");
});

test("sampling the same active time preserves the exact pose", () => {
  const routine = createCatRoutine();
  const frozen = sampleCat(routine, 18.2);
  for (let i = 0; i < 1000; i++) {
    assert.deepEqual(sampleCat(routine, 18.2), frozen);
  }
});

test("sparse and frame-by-frame sampling agree after thirty minutes", () => {
  const continuous = createCatRoutine();
  for (let frame = 0; frame <= 1800 * 24; frame++)
    sampleCat(continuous, frame / 24);
  const sparse = createCatRoutine();
  assert.deepEqual(sampleCat(sparse, 1800), sampleCat(continuous, 1800));
  assert.deepEqual(sparse, continuous);
});
