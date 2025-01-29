interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
  slug: string;
}

interface BlogPostResponse {
  id: string;
  title: string;
  content_html: string;
  date_published: string;
  url: string;
}

export async function getBlogPosts(count: number = 5): Promise<BlogPost[]> {
  try {
    // Fetch from blog.tetraslam.world (hosted on prose.sh)
    const response = await fetch('https://blog.tetraslam.world/feed.json');
    const data = await response.json();
    
    const posts: BlogPost[] = data.items
      .slice(0, count)
      .map((post: BlogPostResponse) => ({
        id: post.id,
        title: post.title,
        content: post.content_html,
        date: post.date_published,
        slug: post.url.split('/').pop() || ''
      }));
    
    return posts;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
} 