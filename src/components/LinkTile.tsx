import Link from 'next/link';

/**
 * A small presentational tile linking to a page — used by the collection index routes
 * (/categories, /organs, /goals, /nutrients) and the homepage "Explore" section so they
 * don't duplicate markup. `ItemCard` stays the card for foods.
 */
export function LinkTile({
  href,
  title,
  subtitle,
  emoji,
}: {
  href: string;
  title: string;
  subtitle?: string;
  emoji?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-neutral-200 p-4 transition hover:border-leaf-300 hover:bg-leaf-50"
    >
      {emoji && (
        <span className="text-2xl" aria-hidden>
          {emoji}
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-semibold text-neutral-900 group-hover:text-leaf-700">
          {title}
        </span>
        {subtitle && <span className="block text-sm text-neutral-500">{subtitle}</span>}
      </span>
    </Link>
  );
}
