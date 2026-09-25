// Authored poses have a shared paw baseline. Times are active scene seconds,
// never wall-clock time: leaving the tab must not advance an inhabitant's day.
const poses = [
  [0, 0],
  [0.4, 1],
  [0.9, 2],
  [3, 3],
  [5.8, 2],
  [6.4, 4],
  [7, 5],
  [7.8, 6],
  [8.5, 7],
  [9.2, 8],
  [11.8, 7],
  [12.3, 6],
  [13, 9],
  [13.6, 10],
  [15, 11],
  [16, 0],
] as const;

export const CAT_ROUTINE_SECONDS = 17;

export type CatRoutine = { wakeAt: number; cycles: number };
export const createCatRoutine = (): CatRoutine => ({ wakeAt: 8, cycles: 0 });

export function wakeCat(routine: CatRoutine, time: number) {
  if (time < routine.wakeAt) routine.wakeAt = time;
}

export function sampleCat(routine: CatRoutine, time: number) {
  while (time >= routine.wakeAt + CAT_ROUTINE_SECONDS) {
    routine.cycles += 1;
    // Different quiet intervals prevent a conspicuous metronomic loop.
    routine.wakeAt += CAT_ROUTINE_SECONDS + 65 + ((routine.cycles * 37) % 71);
  }
  const local = time - routine.wakeAt;
  const oldOffset = routine.cycles % 2 === 0 ? 0 : 4;
  const nextOffset = 4 - oldOffset;
  const settling = Math.max(0, Math.min(1, (local - 13) / 3));
  const offset = oldOffset + (nextOffset - oldOffset) * settling;
  if (local < 0)
    return {
      row: 0,
      from: 0,
      to: 0,
      mix: 0,
      offset: oldOffset,
      phase: "sleeping",
    };
  let index = 0;
  while (index + 1 < poses.length && poses[index + 1][0] <= local) index++;
  const previous = poses[Math.max(0, index - 1)];
  const current = poses[index];
  const progress = Math.min(1, Math.max(0, (local - current[0]) / 0.24));
  const mix = progress * progress * (3 - 2 * progress);
  return {
    row: index,
    from: previous[1],
    to: current[1],
    mix,
    offset,
    phase:
      local < 6.4
        ? "watching"
        : local < 8.5
          ? "rising"
          : local < 13
            ? "stretching"
            : "settling",
  };
}

export function drawCat(
  context: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  scratch: CanvasRenderingContext2D,
  pose: ReturnType<typeof sampleCat>,
  time: number,
) {
  scratch.clearRect(0, 0, 384, 384);
  // Prepared motion-compensated in-betweens preserve the silhouette better
  // than dissolving between two stationary poses at runtime.
  scratch.drawImage(
    atlas,
    Math.round(pose.mix * 8) * 192,
    pose.row * 192,
    192,
    192,
    0,
    0,
    384,
    384,
  );

  context.save();
  context.translate(234 + pose.offset, 758 + pose.offset * 0.17);
  // The parapet slopes into the foreground. Feet and contact shadow share it.
  context.transform(1, 0.17, 0, 1, 0, 0);
  const shadow = context.createRadialGradient(84, 0, 3, 84, 0, 83);
  shadow.addColorStop(0, "rgba(71, 59, 43, .23)");
  shadow.addColorStop(1, "rgba(71, 59, 43, 0)");
  context.save();
  context.scale(1, 0.13);
  context.fillStyle = shadow;
  context.fillRect(0, -85, 170, 170);
  context.restore();

  const scale = 0.44;
  for (let x = 0; x < 384; x += 4) {
    // Only the ribcage expands. The contact baseline, paws, and face stay still.
    const weight = Math.exp(-(((x - 155) / 70) ** 2));
    const breath =
      pose.phase === "sleeping" ? Math.sin(time * 1.65) * 0.008 * weight : 0;
    const height = 384 * scale * (1 + breath);
    context.drawImage(
      scratch.canvas,
      x,
      0,
      4,
      384,
      x * scale,
      -326 * scale * (1 + breath),
      4 * scale,
      height,
    );
  }
  context.restore();
}
