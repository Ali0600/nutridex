import { getBlogPost } from '@/lib/blog';
import { SITE_URL } from '@/lib/site';
import { JsonLd } from './JsonLd';

/** BlogPosting JSON-LD + a small dateline, driven by the post's registry entry. */
export function BlogSchema({ slug }: { slug: string }) {
  const post = getBlogPost(slug);
  if (!post) return null;
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          author: { '@type': 'Organization', name: post.author },
          url: `${SITE_URL}/blog/${post.slug}`,
          keywords: post.tags.join(', '),
        }}
      />
      <p className="text-xs text-neutral-400">
        {new Date(post.date).toLocaleDateString('en-US', { dateStyle: 'medium' })} · {post.author}
      </p>
    </>
  );
}
