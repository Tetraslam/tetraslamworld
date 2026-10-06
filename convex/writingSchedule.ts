"use node";
import { internalAction } from "./_generated/server";
export const tick = internalAction({
  args: {},
  handler: async () => {
    const endpoint = process.env.WRITING_PUBLICATION_ENDPOINT,
      secret = process.env.WRITING_SCHEDULER_SECRET;
    if (!endpoint || !secret) return;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(240_000),
    });
    if (!response.ok)
      throw new Error(
        `Writing publication/backup worker returned ${response.status}.`,
      );
    return { ok: true };
  },
});
