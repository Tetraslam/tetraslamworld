import { getBlogPosts } from '@/lib/rss';
import Link from 'next/link';
import { Metadata } from 'next';
import { format } from 'date-fns';
import { NewsletterForm } from '@/components/ui/newsletter-form';

export const metadata: Metadata = {
  title: 'Blog – Shresht Bhowmick',
  description: 'Writing on tech, robotics, world-building & random musings.',
};

export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Blog</h1>
          <p className="text-muted-foreground">Posts are written on Prose.sh and synced here via RSS.</p>
        </header>

        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.guid} className="bg-card/30 border border-border p-6 rounded-sm transition-transform duration-300 hover:scale-[1.02] hover:border-primary/60 group">
              <Link href={`/blog/${post.slug}`} className="block">
                <h2 className="text-2xl font-semibold mb-1 text-primary group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {post.isoDate ? format(new Date(post.isoDate), 'PPP') : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-20">
          <NewsletterForm />
        </div>
      </div>
    </main>
  );
} 