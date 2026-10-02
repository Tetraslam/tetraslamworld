import { expect, test, vi } from "vitest";
import { defaultPost } from "../shared/writing";
import { DraftAutosave, SaveFailure } from "../src/lib/writing/autosave";
import type { SaveRequest } from "../src/lib/writing/local";

const initial = () => ({
  ...defaultPost("draft-12345678"),
  title: "My draft",
  body: "First paragraph.",
});
test("editing during a save preserves newer text and advances the next expected revision", async () => {
  let finish: (value: {
    revision: string;
    currentRevision: string;
    replayed: boolean;
  }) => void = () => {};
  const send = vi
    .fn<
      (input: SaveRequest) => Promise<{
        revision: string;
        currentRevision: string;
        replayed: boolean;
      }>
    >()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue({
      revision: "r3",
      currentRevision: "r3",
      replayed: false,
    });
  const model = new DraftAutosave(initial(), "r1", {
    send,
    persist: async () => {},
    status: () => {},
  });
  model.change({ ...initial(), body: "Second paragraph." });
  const saving = model.flush();
  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  model.change({ ...initial(), body: "Third paragraph." });
  finish({ revision: "r2", currentRevision: "r2", replayed: false });
  await saving;
  expect(model.value.body).toBe("Third paragraph.");
  expect(model.dirty).toBe(true);
  await model.flush();
  expect(send.mock.calls[1][0].expectedRevision).toBe("r2");
  expect(send.mock.calls[1][0].post.body).toBe("Third paragraph.");
  expect(model.dirty).toBe(false);
});
test("a lost acknowledgement retries the same operation before sending newer edits", async () => {
  const send = vi
    .fn()
    .mockRejectedValueOnce(new Error("connection lost"))
    .mockResolvedValueOnce({
      revision: "r2",
      currentRevision: "r2",
      replayed: true,
    })
    .mockResolvedValue({
      revision: "r3",
      currentRevision: "r3",
      replayed: false,
    });
  const model = new DraftAutosave(initial(), "r1", {
    send,
    persist: async () => {},
    status: () => {},
  });
  model.change({ ...initial(), body: "Saved, but acknowledgement lost." });
  await expect(model.flush()).rejects.toThrow();
  model.change({ ...initial(), body: "Still typing offline." });
  await model.flush();
  expect(send.mock.calls[1][0]).toEqual(send.mock.calls[0][0]);
  expect(model.dirty).toBe(true);
  await model.flush();
  expect(send.mock.calls[2][0].operationId).not.toBe(
    send.mock.calls[1][0].operationId,
  );
  expect(model.dirty).toBe(false);
});
test("validation errors do not trap corrected edits behind an invalid pending request", async () => {
  const send = vi
    .fn()
    .mockRejectedValueOnce(new SaveFailure("INVALID_INPUT", "address is empty"))
    .mockResolvedValue({
      revision: "r2",
      currentRevision: "r2",
      replayed: false,
    });
  const model = new DraftAutosave(initial(), "r1", {
    send,
    persist: async () => {},
    status: () => {},
  });
  model.change({ ...initial(), slug: "" });
  await expect(model.flush()).rejects.toThrow();
  model.change({ ...initial(), slug: "my-new-address" });
  await model.flush();
  expect(send.mock.calls[1][0].post.slug).toBe("my-new-address");
});
test("a conflict continues protecting local edits until explicitly resolved", async () => {
  const send = vi
      .fn()
      .mockRejectedValueOnce(
        new SaveFailure("CONFLICT", "another editor saved"),
      )
      .mockResolvedValue({
        revision: "r3",
        currentRevision: "r3",
        replayed: false,
      }),
    status = vi.fn();
  const model = new DraftAutosave(initial(), "r1", {
    send,
    persist: async () => {},
    status,
  });
  model.change({ ...initial(), body: "Mine." });
  await expect(model.flush()).rejects.toThrow();
  model.change({ ...initial(), body: "Still mine." });
  expect(status).toHaveBeenLastCalledWith("conflict");
  await expect(model.flush()).rejects.toThrow();
  expect(send).toHaveBeenCalledTimes(1);
  model.adoptRevision("r2", true, { ...initial(), body: "Theirs." });
  await model.flush();
  expect(send.mock.calls[1][0].expectedRevision).toBe("r2");
  expect(send.mock.calls[1][0].post.body).toBe("Still mine.");
});
