'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/labels';
import type { Category } from '@/lib/schema';

export interface CompareFood {
  slug: string;
  name: string;
  category: Category;
  superfood: boolean;
  summary: string;
  claims: string[];
  nutrients: { key: string; label: string; unit: string; amount: number }[];
}

const MAX = 3;

/**
 * Side-by-side food comparison (up to 3). Selection is reflected in `?items=a,b,c` so a
 * comparison is shareable. All data is passed from the server (nutrient panels are computed
 * there); this component only handles selection + layout.
 */
export function CompareTool({ foods, initial }: { foods: CompareFood[]; initial: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const bySlug = useMemo(() => new Map(foods.map((f) => [f.slug, f])), [foods]);
  const [selected, setSelected] = useState<string[]>(
    initial.filter((s) => bySlug.has(s)).slice(0, MAX),
  );

  function sync(next: string[]) {
    setSelected(next);
    router.replace(next.length ? `${pathname}?items=${next.join(',')}` : pathname, { scroll: false });
  }

  const chosen = selected.map((s) => bySlug.get(s)!).filter(Boolean);
  const remaining = foods.filter((f) => !selected.includes(f.slug));

  // Union of nutrient keys across the chosen foods, ordered by the first food's order.
  const nutrientRows = useMemo(() => {
    const map = new Map<string, { label: string; unit: string }>();
    for (const f of chosen) for (const n of f.nutrients) if (!map.has(n.key)) map.set(n.key, { label: n.label, unit: n.unit });
    return [...map.entries()].map(([key, meta]) => ({ key, ...meta }));
  }, [chosen]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {chosen.map((f) => (
          <span key={f.slug} className="flex items-center gap-1 rounded-full bg-leaf-50 py-1 pr-1 pl-3 text-sm text-leaf-800">
            {CATEGORY_EMOJI[f.category]} {f.name}
            <button
              type="button"
              onClick={() => sync(selected.filter((s) => s !== f.slug))}
              aria-label={`Remove ${f.name}`}
              className="ml-1 rounded-full px-1.5 text-leaf-600 hover:bg-leaf-100"
            >
              ✕
            </button>
          </span>
        ))}
        {selected.length < MAX && (
          <select
            value=""
            onChange={(e) => e.target.value && sync([...selected, e.target.value])}
            aria-label="Add a food to compare"
            className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-700"
          >
            <option value="">+ Add a food…</option>
            {remaining.map((f) => (
              <option key={f.slug} value={f.slug}>
                {f.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {chosen.length < 2 ? (
        <p className="mt-8 text-neutral-500">Pick at least two foods to compare them side by side.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-40 p-2 text-left font-medium text-neutral-400"></th>
                {chosen.map((f) => (
                  <th key={f.slug} className="p-2 text-left align-bottom">
                    <Link href={`/items/${f.slug}`} className="text-base font-semibold text-leaf-700 hover:underline">
                      {CATEGORY_EMOJI[f.category]} {f.name}
                    </Link>
                    <div className="text-xs font-normal text-neutral-400">
                      {CATEGORY_LABELS[f.category]}
                      {f.superfood ? ' · 🌟 Super' : ''}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-neutral-200">
                <td className="p-2 align-top text-neutral-500">Summary</td>
                {chosen.map((f) => (
                  <td key={f.slug} className="p-2 align-top text-neutral-700">{f.summary}</td>
                ))}
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="p-2 align-top text-neutral-500">Key benefits</td>
                {chosen.map((f) => (
                  <td key={f.slug} className="p-2 align-top text-neutral-700">
                    <ul className="list-disc space-y-1 pl-4">
                      {f.claims.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              {nutrientRows.length > 0 && (
                <tr className="border-t border-neutral-200">
                  <td colSpan={chosen.length + 1} className="p-2 pt-4 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                    Nutrients (per 100g · USDA)
                  </td>
                </tr>
              )}
              {nutrientRows.map((row) => {
                const amounts = chosen.map((f) => f.nutrients.find((n) => n.key === row.key)?.amount);
                const max = Math.max(...amounts.map((a) => a ?? -1));
                return (
                  <tr key={row.key} className="border-t border-neutral-100">
                    <td className="p-2 text-neutral-500">
                      <Link href={`/nutrients/${row.key}`} className="hover:text-leaf-700">
                        {row.label}
                      </Link>
                    </td>
                    {amounts.map((a, i) => (
                      <td
                        key={i}
                        className={`p-2 tabular-nums ${a !== undefined && a === max && max > 0 ? 'font-semibold text-leaf-700' : 'text-neutral-700'}`}
                      >
                        {a === undefined ? '—' : `${a} ${row.unit}`}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
