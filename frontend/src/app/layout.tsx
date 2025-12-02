import type { Metadata } from "next";
import "@fontsource/iosevka/400.css";
import "@fontsource/iosevka/500.css";
import "@fontsource/iosevka/600.css";
import "@fontsource/iosevka/700.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Analytics } from "@vercel/analytics/next";
import { CommandMenu } from "@/components/command-menu";
import { PageBackground } from "@/components/page-background";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
	title: "tetraslam's world",
	description: "shresht bhowmick's personal site",
	icons: {
		icon: "/favicon.svg",
		apple: "/logo.svg",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body className="font-mono antialiased">
				<ClerkProvider
					appearance={{
						baseTheme: dark,
						variables: {
							colorPrimary: "#E8A6A6",
							colorBackground: "#221F22",
							colorInputBackground: "#2B262B",
							colorInputText: "#F7F4F1",
							colorText: "#F7F4F1",
							colorTextSecondary: "#9A8F94",
							borderRadius: "0.5rem",
						},
						elements: {
							card: "bg-surface border border-border",
							headerTitle: "text-rose",
							headerSubtitle: "text-muted-foreground",
							socialButtonsBlockButton:
								"bg-surface border border-border hover:border-rose/50",
							formButtonPrimary: "bg-rose hover:bg-rose-deep text-background",
							footerActionLink: "text-rose-deep hover:text-rose",
						},
					}}
				>
					<ConvexClientProvider>
						<PageBackground />
						<SiteHeader />
						<main className="pt-12 min-h-screen">{children}</main>
						<CommandMenu />
					</ConvexClientProvider>
				</ClerkProvider>
				<Analytics />
			</body>
		</html>
	);
}
