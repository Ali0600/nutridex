/**
 * Blog index. Posts are MDX route pages at `src/app/blog/<slug>/page.mdx` (first-class
 * @next/mdx — no runtime MDX loader needed). This typed registry is the single source for
 * the /blog listing and the sitemap; keep an entry here in sync with each post file.
 */
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  author: string;
  tags: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'why-beetroot-lowers-blood-pressure',
    title: 'Why beetroot lowers blood pressure — the nitrate-to-nitric-oxide pathway',
    description:
      'The science behind beetroot’s best-studied benefit: how dietary nitrate becomes nitric oxide and relaxes your arteries — with the randomized trials that measured it.',
    date: '2026-07-03',
    author: 'NutriDex',
    tags: ['heart', 'high-blood-pressure', 'beetroot'],
  },
];

export function getBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
