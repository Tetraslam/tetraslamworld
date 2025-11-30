"use client";

import { usePathname } from "next/navigation";
import { AmbientParticles } from "./ambient-particles";
import { ConwayBackground } from "./conway-background";
import { ConwayStatic } from "./conway-static";

export function PageBackground() {
	const pathname = usePathname();

	// Admin pages get no background
	if (pathname.startsWith("/admin")) {
		return null;
	}

	// Travel page manages its own background (map)
	if (pathname === "/travel") {
		return (
			<>
				<ConwayStatic />
				<FrostedOverlay />
				<AmbientParticles />
			</>
		);
	}

	// Home page gets animated Conway + particles
	if (pathname === "/") {
		return (
			<>
				<ConwayBackground />
				<FrostedOverlay opacity={0.3} />
				<AmbientParticles />
			</>
		);
	}

	// All other pages get static Conway + frosted overlay + particles
	return (
		<>
			<ConwayStatic />
			<FrostedOverlay />
			<AmbientParticles />
		</>
	);
}

function FrostedOverlay({ opacity = 0.5 }: { opacity?: number }) {
	return (
		<div
			className="fixed inset-0 pointer-events-none -z-5"
			style={{
				background: `rgba(34, 31, 34, ${opacity})`,
				backdropFilter: "blur(1px)",
			}}
			aria-hidden="true"
		/>
	);
}
