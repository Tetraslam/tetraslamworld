import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = "https://tetraslam.world";

	// Static routes
	const routes = [
		"",
		"/work",
		"/blog",
		"/friends",
		"/media",
		"/links",
		"/travel",
		"/pixels",
	];

	const staticPages: MetadataRoute.Sitemap = routes.map((route) => ({
		url: `${baseUrl}${route}`,
		lastModified: new Date(),
		changeFrequency: route === "" ? "weekly" : "monthly",
		priority: route === "" ? 1 : 0.8,
	}));

	// Fetch blog posts for dynamic routes
	try {
		const res = await fetch("https://blog.tetraslam.world/rss", {
			next: { revalidate: 3600 },
		});
		
		if (res.ok) {
			const xml = await res.text();
			const blogUrls = extractBlogUrls(xml);
			
			const blogPages: MetadataRoute.Sitemap = blogUrls.map((id) => ({
				url: `${baseUrl}/blog/${encodeURIComponent(id)}`,
				lastModified: new Date(),
				changeFrequency: "monthly",
				priority: 0.6,
			}));

			return [...staticPages, ...blogPages];
		}
	} catch (e) {
		console.error("Failed to fetch blog posts for sitemap:", e);
	}

	return staticPages;
}

function extractBlogUrls(xml: string): string[] {
	const urls: string[] = [];
	const idRegex = /<id>([^<]+)<\/id>/g;
	let match;

	while ((match = idRegex.exec(xml)) !== null) {
		const id = match[1].trim();
		// Skip the feed-level id (the base URL without a path)
		if (id.includes("/") && id !== "https://blog.tetraslam.world") {
			urls.push(id);
		}
	}

	return urls;
}
