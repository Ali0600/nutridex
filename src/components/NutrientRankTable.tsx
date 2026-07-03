import Link from 'next/link';
import type { NutrientRankRow } from '@/lib/nutrients';
import type { NutrientDef } from '@/lib/nutrients-config';
import { CATEGORY_EMOJI } from '@/lib/labels';

export function NutrientRankTable({ def, rows }: { def: NutrientDef; rows: NutrientRankRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-500">
        No nutrient data yet for this vitamin. Run <code>npm run usda:import</code> once foods
        with USDA data are catalogued.
      </p>
    );
  }
  const max = rows[0].amount || 1;
  return (
    <ol className="space-y-2">
      {rows.map((row, i) => (
        <li key={row.item.slug}>
          <Link
            href={`/items/${row.item.slug}`}
            className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 hover:border-leaf-300"
          >
            <span className="w-6 text-right text-sm font-semibold text-neutral-400">{i + 1}</span>
            <span aria-hidden>{CATEGORY_EMOJI[row.item.category]}</span>
            <span className="flex-1 font-medium text-neutral-800">{row.item.name}</span>
            <span className="hidden h-2 w-32 overflow-hidden rounded-full bg-neutral-100 sm:block">
              <span
                className="block h-full rounded-full bg-leaf-400"
                style={{ width: `${Math.max(4, (row.amount / max) * 100)}%` }}
              />
            </span>
            <span className="w-24 text-right text-sm tabular-nums text-neutral-700">
              {row.amount} {def.unit}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
