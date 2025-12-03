"use client";

import { useAction, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

export default function AdminPage() {
	const work = useQuery(api.work.list, {});
	const friends = useQuery(api.friends.list, {});
	const media = useQuery(api.media.list, {});
	const links = useQuery(api.links.list, {});
	const travel = useQuery(api.travel.list, {});
	const gallery = useQuery(api.gallery.list, {});
	const externalImages = useQuery(api.imageMigration.getExternalImages, {});
	const migrateImage = useAction(api.imageMigration.migrateImage);

	const [migrating, setMigrating] = useState(false);
	const [migrationLog, setMigrationLog] = useState<string[]>([]);

	const stats = [
		{ label: "work items", count: work?.length ?? 0, href: "/admin/work" },
		{ label: "friends", count: friends?.length ?? 0, href: "/admin/friends" },
		{ label: "media", count: media?.length ?? 0, href: "/admin/media" },
		{ label: "links", count: links?.length ?? 0, href: "/admin/links" },
		{
			label: "travel locations",
			count: travel?.length ?? 0,
			href: "/admin/travel",
		},
		{
			label: "gallery images",
			count: gallery?.length ?? 0,
			href: "/admin/gallery",
		},
	];

	const handleMigrateAll = async () => {
		if (!externalImages || externalImages.length === 0) return;
		
		setMigrating(true);
		setMigrationLog([]);
		
		for (const img of externalImages) {
			setMigrationLog((log) => [...log, `migrating ${img.table}/${img.field}...`]);
			
			try {
				const result = await migrateImage({
					table: img.table,
					id: img.id,
					field: img.field,
					externalUrl: img.url,
				});
				
				if (result.success) {
					setMigrationLog((log) => [...log, `  success`]);
				} else {
					setMigrationLog((log) => [...log, `  failed: ${result.error}`]);
				}
			} catch (err) {
				setMigrationLog((log) => [...log, `  error: ${err}`]);
			}
		}
		
		setMigrationLog((log) => [...log, "migration complete"]);
		setMigrating(false);
	};

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold">dashboard</h1>
				<p className="text-muted-foreground mt-1">manage your site content</p>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
				{stats.map((stat) => (
					<Link
						key={stat.label}
						href={stat.href}
						className="p-4 bg-surface border border-border rounded hover:border-rose/50 transition-colors"
					>
						<p className="text-3xl font-bold text-rose">{stat.count}</p>
						<p className="text-sm text-muted-foreground">{stat.label}</p>
					</Link>
				))}
			</div>

			<div className="p-4 bg-surface border border-border rounded">
				<h2 className="font-semibold mb-2">quick actions</h2>
				<div className="flex flex-wrap gap-2">
					<Link
						href="/admin/work?new=true"
						className="px-3 py-1.5 text-sm bg-rose/10 text-rose rounded hover:bg-rose/20 transition-colors"
					>
						+ add work
					</Link>
					<Link
						href="/admin/friends?new=true"
						className="px-3 py-1.5 text-sm bg-rose/10 text-rose rounded hover:bg-rose/20 transition-colors"
					>
						+ add friend
					</Link>
					<Link
						href="/admin/media?new=true"
						className="px-3 py-1.5 text-sm bg-rose/10 text-rose rounded hover:bg-rose/20 transition-colors"
					>
						+ add media
					</Link>
					<Link
						href="/admin/links?new=true"
						className="px-3 py-1.5 text-sm bg-rose/10 text-rose rounded hover:bg-rose/20 transition-colors"
					>
						+ add link
					</Link>
					<Link
						href="/admin/travel?new=true"
						className="px-3 py-1.5 text-sm bg-rose/10 text-rose rounded hover:bg-rose/20 transition-colors"
					>
						+ add location
					</Link>
					<Link
						href="/admin/gallery?new=true"
						className="px-3 py-1.5 text-sm bg-rose/10 text-rose rounded hover:bg-rose/20 transition-colors"
					>
						+ add gallery image
					</Link>
				</div>
			</div>

			{/* Image Migration Tool */}
			<div className="p-4 bg-surface border border-border rounded">
				<h2 className="font-semibold mb-2">image storage</h2>
				<p className="text-sm text-muted-foreground mb-4">
					migrate external image URLs to Convex storage for reliability
				</p>
				
				{externalImages === undefined ? (
					<p className="text-sm text-muted-foreground">checking...</p>
				) : externalImages.length === 0 ? (
					<p className="text-sm text-green-500">all images are stored on Convex</p>
				) : (
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							<p className="text-sm">
								<span className="text-rose font-medium">{externalImages.length}</span> external image{externalImages.length !== 1 ? "s" : ""} found
							</p>
							<button
								type="button"
								onClick={handleMigrateAll}
								disabled={migrating}
								className="px-4 py-2 bg-rose text-background rounded hover:bg-rose-deep transition-colors text-sm disabled:opacity-50"
							>
								{migrating ? "migrating..." : "migrate all to convex"}
							</button>
						</div>
						
						{/* External images list */}
						<details className="text-xs">
							<summary className="cursor-pointer text-muted-foreground hover:text-foreground">
								view external images
							</summary>
							<div className="mt-2 max-h-40 overflow-auto bg-background rounded p-2 space-y-1">
								{externalImages.map((img, i) => (
									<div key={i} className="font-mono truncate">
										{img.table}/{img.field}: {img.url.slice(0, 50)}...
									</div>
								))}
							</div>
						</details>

						{/* Migration log */}
						{migrationLog.length > 0 && (
							<div className="text-xs font-mono bg-background rounded p-2 max-h-40 overflow-auto">
								{migrationLog.map((line, i) => (
									<div key={i} className={line.includes("success") ? "text-green-500" : line.includes("failed") || line.includes("error") ? "text-red-400" : ""}>
										{line}
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
