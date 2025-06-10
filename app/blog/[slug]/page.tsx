import { getBlogPost } from '@/lib/rss';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { format } from 'date-fns';
import parse from 'html-react-parser';
import { NewsletterForm } from '@/components/ui/newsletter-form';

interface BlogParams { slug: string }

export const revalidate = 60; // Revalidate every 60 seconds

// Function to rewrite image URLs to use the correct domain
function rewriteImageUrls(html: string): string {
  // Replace relative image paths with absolute paths to blog.tetraslam.world
  return html.replace(
    /src="\/([^"]+\.(jpg|jpeg|png|gif|webp|svg))"/gi,
    'src="https://blog.tetraslam.world/$1"'
  );
}

export async function generateMetadata({ params }: { params: Promise<any> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} – Blog`,
    description: post.title,
    openGraph: {
      title: post.title,
      description: post.title,
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<any> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  // Rewrite image URLs in the content
  const contentWithFixedImages = rewriteImageUrls(post.content);

  return (
    <main className="min-h-screen p-8">
      <article className="prose prose-invert mx-auto bg-card/20 border border-border p-8 rounded-sm">
        <h1>{post.title}</h1>
        {post.isoDate && <p className="text-sm text-muted-foreground">{format(new Date(post.isoDate), 'PPP')}</p>}
        
        {/* Newsletter CTA - Between title and content */}
        <div className="not-prose my-6">
          <NewsletterForm className="text-sm" />
        </div>
        
        <hr />
        <div className="prose-invert [&_a]:text-primary hover:[&_a]:text-accent [&_a]:underline">{parse(contentWithFixedImages)}</div>
      </article>

      {/* Newsletter CTA - Bottom, same width as article */}
      <div className="prose mx-auto mt-16">
        <NewsletterForm />
      </div>
    </main>
  );
} 