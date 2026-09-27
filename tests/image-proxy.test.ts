import { NextRequest } from "next/server";
import { afterEach, expect, test, vi } from "vitest";
import { GET } from "../src/app/api/proxy-image/route";

afterEach(() => vi.unstubAllGlobals());

test("proxied SVGs retain their graphics but cannot execute as same-origin documents", async () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/><script>parent.document.body.remove()</script></svg>';
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(svg, { headers: { "Content-Type": "image/svg+xml" } }),
      ),
  );
  const result = await GET(
    new NextRequest(
      "https://tetraslam.world/api/proxy-image?url=https://example.com/image.svg",
    ),
  );
  expect(result.status).toBe(200);
  expect(result.headers.get("Content-Security-Policy")).toBe(
    "sandbox; script-src 'none'",
  );
  expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(result.headers.get("Content-Type")).toBe("image/svg+xml");
  expect(await result.text()).toBe(svg);
});
