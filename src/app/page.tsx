import { HomeIntroduction } from "@/components/home-introduction";
import { ThemeArtwork } from "@/components/theme-artwork";
import { getHomeContent } from "@/lib/home-content";

export const metadata = {
  alternates: { canonical: "/", types: { "text/markdown": "/home.md" } },
};

export default async function HomePage() {
  const content = await getHomeContent();
  return (
    <div className="home-page">
      <ThemeArtwork />
      <HomeIntroduction initialContent={content} />
    </div>
  );
}
