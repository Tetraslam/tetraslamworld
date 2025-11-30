"use client";

import { getCalApi } from "@calcom/embed-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const roles = [
	"builder",
	"roboticist",
	"worldbuilder",
	"engineer",
	"writer",
  "scuba diver",
	"angel investor",
];

export default function Home() {
	const [currentRole, setCurrentRole] = useState(0);
	const [isVisible, setIsVisible] = useState(true);

	// Initialize Cal.com embed
	useEffect(() => {
		(async () => {
			const cal = await getCalApi({ namespace: "30min" });
			cal("ui", {
				theme: "dark",
				cssVarsPerTheme: {
					light: { "cal-brand": "#2B262B" },
					dark: { "cal-brand": "#E8A6A6" },
				},
				hideEventTypeDetails: false,
				layout: "month_view",
			});
		})();
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			setIsVisible(false);
			setTimeout(() => {
				setCurrentRole((prev) => (prev + 1) % roles.length);
				setIsVisible(true);
			}, 200);
		}, 3000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center p-8">
			<div className="max-w-2xl text-center space-y-8 animate-fade-in">
				{/* Profile coin */}
				<div className="flex flex-col items-center">
					<Image
						src="/shresht-coin.png"
						alt="Shresht Bhowmick"
						width={160}
						height={160}
						className="animate-bob rounded-full"
						priority
					/>
					{/* Shadow underneath */}
					<div className="w-28 h-4 bg-rose-deep/60 rounded-full blur-lg mt-1 animate-bob-shadow" />
				</div>

				<div className="space-y-3">
					<h1 className="text-5xl font-bold tracking-tight">
						tetraslam's world
					</h1>
					<p className="text-lg text-muted-foreground">
						shresht bhowmick /{" "}
						<span
							className={`text-rose transition-opacity duration-200 inline-block min-w-[100px] ${
								isVisible ? "opacity-100" : "opacity-0"
							}`}
						>
							{roles[currentRole]}
						</span>
					</p>
				</div>

				<div className="text-sm text-muted-foreground space-y-1">
					<p>
						currently: founding engineer @{" "}
						<a
							href="https://natural.co"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground hover:text-rose"
						>
							natural.co
						</a>
					</p>
					<p>
						prev:{" "}
						<a
							href="https://media.mit.edu"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground/80 hover:text-rose"
						>
							mit media lab
						</a>
						,{" "}
						<a
							href="https://mosaic.so"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground/80 hover:text-rose"
						>
							mosaic
						</a>
						, etc
					</p>
				</div>

				<div className="flex flex-wrap gap-3 justify-center text-sm">
					<SocialLink href="https://x.com/tetraslam" label="twitter" />
					<SocialLink href="https://github.com/tetraslam" label="github" />
					<SocialLink href="https://tetraslam.world/blog" label="blog" />
					<SocialLink href="mailto:bhowmickshresht@gmail.com" label="email" />
					<button
						type="button"
						data-cal-namespace="30min"
						data-cal-link="tetraslam/30min"
						data-cal-config='{"layout":"month_view","theme":"dark"}'
						className="px-4 py-2 border border-rose/50 bg-rose/10 rounded-lg hover:border-rose hover:bg-rose/20 hover:-translate-y-0.5 transition-all text-rose"
					>
						book a call
					</button>
				</div>

				<p className="text-xs text-muted-foreground/60">
					press{" "}
					<kbd className="px-1.5 py-0.5 bg-surface rounded border border-border text-rose text-xs">
						ctrl+k
					</kbd>{" "}
					to navigate
				</p>
			</div>
		</div>
	);
}

function SocialLink({ href, label }: { href: string; label: string }) {
	return (
		<a
			href={href}
			target={href.startsWith("mailto") ? undefined : "_blank"}
			rel={href.startsWith("mailto") ? undefined : "noopener noreferrer"}
			className="px-4 py-2 border border-border rounded-lg hover:border-rose/50 hover:bg-rose/5 hover:-translate-y-0.5 transition-all text-muted-foreground hover:text-foreground"
		>
			{label}
		</a>
	);
}
