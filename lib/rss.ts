import Parser from 'rss-parser';

export interface BlogPost {
  title: string;
  link: string;
  content: string;
  isoDate: string;
  guid: string;
  slug: string;
}

const RSS_URL = 'https://blog.tetraslam.world/rss';
const parser = new Parser();

export async function getBlogPosts(): Promise<BlogPost[]> {
  const feed = await parser.parseURL(RSS_URL);
  return (feed.items || []).map((item) => ({
    title: item.title || '',
    link: item.link || '',
    content: item['content:encoded'] || item.content || '',
    isoDate: item.isoDate || '',
    guid: item.guid || item.link || '',
    slug: deriveSlug(item),
  }));
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug) || null;
}

function deriveSlug(item: any): string {
  // Use link last path segment as slug
  const link: string = item.link || '';
  const parts = link.split('/').filter(Boolean);
  return parts[parts.length - 1]?.replace(/\.html$/, '') || item.guid || '';
} 