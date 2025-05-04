import { getBlogPost } from '@/lib/rss';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { format } from 'date-fns';
import parse from 'html-react-parser';
import { NewsletterForm } from '@/components/ui/newsletter-form';

interface Params { slug: string }

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await getBlogPost(params.slug);
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

// Explicitly define the props type inline
interface BlogPostPageProps {
  params: Params;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPost(params.slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen p-8">
      <article className="prose prose-invert mx-auto bg-card/20 border border-border p-8 rounded-sm">
        <h1>{post.title}</h1>
        {post.isoDate && <p className="text-sm text-muted-foreground">{format(new Date(post.isoDate), 'PPP')}</p>}
        <hr />
        <div className="prose-invert [&_a]:text-primary hover:[&_a]:text-accent [&_a]:underline">{parse(post.content)}</div>
      </article>

      {/* Newsletter CTA */}
      <div className="mt-16">
        <NewsletterForm />
      </div>
    </main>
  );
} 