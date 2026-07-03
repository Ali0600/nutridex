import type { MDXComponents } from 'mdx/types';

/**
 * Global MDX styling (Tailwind v4 ships no typography plugin, so we style elements here).
 * The `wrapper` constrains blog/article width. Required by @next/mdx in the App Router.
 */
const components: MDXComponents = {
  wrapper: ({ children }) => <article className="mx-auto max-w-2xl py-6">{children}</article>,
  h1: (p) => <h1 className="text-3xl font-bold text-neutral-900" {...p} />,
  h2: (p) => <h2 className="mt-8 text-2xl font-bold text-neutral-900" {...p} />,
  h3: (p) => <h3 className="mt-6 text-lg font-semibold text-neutral-900" {...p} />,
  p: (p) => <p className="mt-4 leading-relaxed text-neutral-700" {...p} />,
  ul: (p) => <ul className="mt-4 list-disc space-y-1 pl-6 text-neutral-700" {...p} />,
  ol: (p) => <ol className="mt-4 list-decimal space-y-1 pl-6 text-neutral-700" {...p} />,
  a: (p) => (
    <a className="text-leaf-700 underline decoration-leaf-300 underline-offset-2" {...p} />
  ),
  blockquote: (p) => (
    <blockquote className="mt-4 border-l-4 border-leaf-200 pl-4 text-neutral-600 italic" {...p} />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
