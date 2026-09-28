import assert from "node:assert/strict";
import test from "node:test";
import { fetchBlogPost } from "../src/lib/blog-post.ts";

const feed = `<feed><entry><id>https://blog.tetraslam.world/a_post</id><title>Life &amp; work</title><published>2026-01-01</published><link href="https://blog.tetraslam.world/a_post"/><content>&lt;p&gt;Hello &amp; welcome&lt;/p&gt;&lt;img src="/photo.png" /&gt;&lt;a href='/notes'&gt;notes&lt;/a&gt;</content></entry></feed>`;

test("server reader preserves comment identity, decoded text and absolute media URLs", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://blog.tetraslam.world/rss");
      assert.equal(options.next.revalidate, 300);
      return new Response(feed);
    };
    const post = await fetchBlogPost("a_post");
    assert.equal(post.id, "https://blog.tetraslam.world/a_post");
    assert.equal(post.title, "Life & work");
    assert.ok(
      post.content.includes('src="https://blog.tetraslam.world/photo.png"'),
    );
    assert.ok(
      post.content.includes("href='https://blog.tetraslam.world/notes'"),
    );
    assert.equal(await fetchBlogPost("missing"), null);
  } finally {
    globalThis.fetch = original;
  }
});

test("a failed feed throws instead of rendering a missing article", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("unavailable", { status: 503 });
    await assert.rejects(fetchBlogPost("a_post"), /Failed to fetch RSS/);
  } finally {
    globalThis.fetch = original;
  }
});
