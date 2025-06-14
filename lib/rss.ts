import Parser from 'rss-parser';
import matter from 'gray-matter';

export interface BlogPost {
  title: string;
  link: string;
  content: string;
  isoDate: string;
  guid: string;
  slug: string;
  draft?: boolean;
}

const RSS_URL = 'https://blog.tetraslam.world/rss';
const parser = new Parser();

export async function getBlogPosts(): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter((post) => !post.draft); // Filter out draft posts
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const feed = await parser.parseURL(RSS_URL);
  return (feed.items || [])
    .map((item) => {
      const rawContent = item['content:encoded'] || item.content || '';
      
      // Parse frontmatter from content
      let parsedContent = rawContent;
      let frontmatter: any = {};
      
      try {
        // Check if content starts with frontmatter (---)
        if (rawContent.trim().startsWith('---')) {
          const parsed = matter(rawContent);
          parsedContent = parsed.content;
          frontmatter = parsed.data;
        }
      } catch (error) {
        // If parsing fails, use original content
        console.warn('Failed to parse frontmatter for post:', item.title);
      }

      return {
        title: item.title || '',
        link: item.link || '',
        content: parsedContent,
        isoDate: item.isoDate || '',
        guid: item.guid || item.link || '',
        slug: deriveSlug(item),
        draft: frontmatter.draft || false,
      };
    });
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const allPosts = await getAllBlogPosts();
  return allPosts.find((p) => p.slug === slug) || null;
}

function deriveSlug(item: any): string {
  // Use link last path segment as slug
  const link: string = item.link || '';
  const parts = link.split('/').filter(Boolean);
  return parts[parts.length - 1]?.replace(/\.html$/, '') || item.guid || '';
} 