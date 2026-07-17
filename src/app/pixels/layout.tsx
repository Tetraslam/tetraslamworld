import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "pixels",
	description: "collaborative pixel art board — leave your mark.",
	alternates: { canonical: "/pixels" },
};

export default function PixelsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
