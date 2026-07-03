import Link from 'next/link';
import type { Benefit } from '@/lib/schema';
import { STRENGTH_LABELS } from '@/lib/labels';
import { getConditions, getOrgans } from '@/lib/content';
import { CitationList } from './CitationList';

export function BenefitList({ benefits }: { benefits: Benefit[] }) {
  const organLabels = new Map(getOrgans().map((o) => [o.id, o.label]));
  const conditionLabels = new Map(getConditions().map((c) => [c.id, c.label]));

  return (
    <div className="space-y-6">
      {benefits.map((b, i) => {
        const strength = STRENGTH_LABELS[b.strength];
        return (
          <article key={i} className="rounded-xl border border-neutral-200 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-neutral-900">{b.claim}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${strength.className}`}>
                {strength.label}
              </span>
            </div>
            <p className="mt-2 text-neutral-700">
              <span className="font-medium text-neutral-900">Why: </span>
              {b.mechanism}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {b.organs.map((o) => (
                <Link
                  key={o}
                  href={`/organs/${o}`}
                  className="rounded-full bg-leaf-50 px-2.5 py-1 text-xs text-leaf-700 hover:bg-leaf-100"
                >
                  {organLabels.get(o) ?? o}
                </Link>
              ))}
              {b.conditions.map((c) => (
                <Link
                  key={c}
                  href={`/goals/${c}`}
                  className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-200"
                >
                  {conditionLabels.get(c) ?? c}
                </Link>
              ))}
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-leaf-700">
                {b.citations.length} study{b.citations.length > 1 ? ' sources' : ' source'}
              </summary>
              <CitationList citations={b.citations} />
            </details>
          </article>
        );
      })}
    </div>
  );
}
