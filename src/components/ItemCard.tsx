import Link from 'next/link';
import type { Item } from '@/lib/schema';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/labels';

export function ItemCard({ item, note }: { item: Item; note?: string }) {
  return (
    <Link
      href={`/items/${item.slug}`}
      className="group flex flex-col rounded-xl border border-neutral-200 p-5 transition hover:border-leaf-300 hover:shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          {CATEGORY_EMOJI[item.category]}
        </span>
        <h3 className="font-semibold text-neutral-900 group-hover:text-leaf-700">{item.name}</h3>
        {item.superfood && (
          <span className="ml-auto rounded-full bg-leaf-100 px-2 py-0.5 text-xs font-medium text-leaf-800">
            Super
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{item.summary}</p>
      <p className="mt-3 text-xs text-neutral-400">
        {note ?? `${CATEGORY_LABELS[item.category]} · ${item.benefits.length} benefit${item.benefits.length > 1 ? 's' : ''}`}
      </p>
    </Link>
  );
}
