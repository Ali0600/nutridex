import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Deep dives into the science of everyday foods — mechanisms, studies, and takeaways.',
  alternates: { canonical: '/blog' },
};

export default function BlogIndexPage() {
  const posts = getBlogPosts();
  return (
    <section className="py-6">
      <h1 className="text-3xl font-bold text-neutral-900">Blog</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        Long-form explainers on how specific foods actually work — every claim traced to a study.
      </p>
      <ul className="mt-8 space-y-6">
        {posts.map((post) => (
          <li key={post.slug} className="border-b border-neutral-100 pb-6">
            <p className="text-xs text-neutral-400">
              {new Date(post.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-900">
              <Link href={`/blog/${post.slug}`} className="hover:text-leaf-700">
                {post.title}
              </Link>
            </h2>
            <p className="mt-1 text-neutral-600">{post.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
