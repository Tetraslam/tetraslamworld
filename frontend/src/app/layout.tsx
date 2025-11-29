import type { Metadata } from "next";
import "@fontsource/iosevka/400.css";
import "@fontsource/iosevka/500.css";
import "@fontsource/iosevka/600.css";
import "@fontsource/iosevka/700.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { CommandMenu } from "@/components/command-menu";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
	title: "tetraslam's world",
	description: "shresht bhowmick's personal site",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="font-mono antialiased">
				<ClerkProvider>
					<ConvexClientProvider>
						<SiteHeader />
						<main className="pt-12 min-h-screen">{children}</main>
						<CommandMenu />
					</ConvexClientProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
