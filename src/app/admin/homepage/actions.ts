"use server";

import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { revalidatePath, updateTag } from "next/cache";
import { isAdminUser } from "@/lib/admin";
import { HOME_CONTENT_TAG } from "@/lib/home-content";
import { api } from "../../../../convex/_generated/api";
import type { HomeContent } from "../../../../shared/home-content";

type Result =
  | { ok: true; content: HomeContent }
  | { ok: false; message: string; code?: string };

export async function loadHomepage(): Promise<Result> {
  const session = await auth();
  if (!isAdminUser(session.userId))
    return { ok: false, message: "Sign in with the administrator account." };
  try {
    return { ok: true, content: await fetchQuery(api.homepage.get, {}) };
  } catch {
    return {
      ok: false,
      message:
        "The homepage editor backend is unavailable. Your existing homepage is still being served.",
    };
  }
}

export async function saveHomepage(args: {
  heading: string;
  body: string;
  expectedRevision: number;
}): Promise<Result> {
  const session = await auth();
  if (!isAdminUser(session.userId))
    return { ok: false, message: "Sign in with the administrator account." };
  let token: string | null;
  try {
    token = await session.getToken({ template: "convex" });
  } catch {
    return {
      ok: false,
      message:
        "Couldn’t authenticate with the content backend. Check the Clerk Convex token configuration.",
    };
  }
  if (!token)
    return {
      ok: false,
      message:
        "Couldn’t authenticate with the content backend. Please sign in again.",
    };
  try {
    const content = await fetchMutation(api.homepage.save, args, { token });
    updateTag(HOME_CONTENT_TAG);
    revalidatePath("/");
    return { ok: true, content };
  } catch (error) {
    if (
      error instanceof ConvexError &&
      typeof error.data === "object" &&
      error.data !== null &&
      "message" in error.data
    ) {
      return {
        ok: false,
        message: String(error.data.message),
        code: "code" in error.data ? String(error.data.code) : undefined,
      };
    }
    return {
      ok: false,
      message: "Couldn’t save. Your draft is still here; please try again.",
    };
  }
}
