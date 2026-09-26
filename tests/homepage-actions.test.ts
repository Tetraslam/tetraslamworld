import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { revalidatePath, updateTag } from "next/cache";
import { beforeEach, expect, test, vi } from "vitest";
import { loadHomepage, saveHomepage } from "../src/app/admin/homepage/actions";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("convex/nextjs", () => ({
  fetchMutation: vi.fn(),
  fetchQuery: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("@/lib/home-content", () => ({ HOME_CONTENT_TAG: "home-content" }));
vi.mock("@/lib/admin", () => ({
  isAdminUser: (id: string | null) => id === "admin-test",
}));
beforeEach(() => vi.resetAllMocks());
const draft = { heading: "hello", body: "my bio", expectedRevision: 0 };

function session(userId: string | null, token: string | null = "convex-jwt") {
  const getToken = vi.fn().mockResolvedValue(token);
  vi.mocked(auth).mockResolvedValue({ userId, getToken } as unknown as Awaited<
    ReturnType<typeof auth>
  >);
  return getToken;
}

test("server actions deny anonymous and non-admin calls before touching Convex", async () => {
  for (const user of [null, "reader-test"]) {
    session(user);
    expect((await saveHomepage(draft)).ok).toBe(false);
    expect((await loadHomepage()).ok).toBe(false);
  }
  expect(fetchMutation).not.toHaveBeenCalled();
  expect(fetchQuery).not.toHaveBeenCalled();
});

test("an admin without a Convex JWT cannot send a mutation", async () => {
  session("admin-test", null);
  expect((await saveHomepage(draft)).ok).toBe(false);
  expect(fetchMutation).not.toHaveBeenCalled();
  expect(updateTag).not.toHaveBeenCalled();
});

test("successful saves forward identity and invalidate the public copy cache", async () => {
  const getToken = session("admin-test");
  const content = {
    heading: "hello",
    body: "my bio",
    revision: 1,
    updatedAt: 100,
  };
  vi.mocked(fetchMutation).mockResolvedValue(content);
  expect(await saveHomepage(draft)).toEqual({ ok: true, content });
  expect(getToken).toHaveBeenCalledWith({ template: "convex" });
  expect(fetchMutation).toHaveBeenCalledWith(expect.anything(), draft, {
    token: "convex-jwt",
  });
  expect(updateTag).toHaveBeenCalledWith("home-content");
  expect(revalidatePath).toHaveBeenCalledWith("/");
});

test("stale writes surface the conflict and do not invalidate a successful version", async () => {
  session("admin-test");
  vi.mocked(fetchMutation).mockRejectedValue(
    new ConvexError({ code: "CONFLICT", message: "review latest" }),
  );
  expect(await saveHomepage(draft)).toEqual({
    ok: false,
    code: "CONFLICT",
    message: "review latest",
  });
  expect(updateTag).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
});
