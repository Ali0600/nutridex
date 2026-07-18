import { CAUTION_LABELS } from '@/lib/labels';
import type { Caution } from '@/lib/schema';
import type { UlPortion } from '@/lib/limits';

/**
 * "If you overdo it" — what a reader would actually notice, plus any portion at which
 * this food alone would meet an adult's daily upper limit for a nutrient.
 *
 * Deliberately calm: a food database shouldn't read like a warning label, and the
 * `none` case is a reassurance rather than an absent section.
 */
export function CautionPanel({
  itemName,
  cautions,
  ulPortions,
}: {
  itemName: string;
  cautions: Caution[];
  ulPortions: UlPortion[];
}) {
  if (cautions.length === 0 && ulPortions.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-neutral-900">If you overdo it</h2>
      <p className="mt-1 text-sm text-neutral-500">
        What you&apos;d notice from eating a lot of {itemName.toLowerCase()} — not medical advice.
      </p>

      <div className="mt-3 space-y-3">
        {cautions.map((c, i) => {
          const meta = CAUTION_LABELS[c.severity];
          return (
            <div key={i} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
                  {meta.label}
                </span>
                {c.affects && (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                    {c.affects}
                  </span>
                )}
              </div>
              <p className="mt-2 text-neutral-700">{c.effect}</p>
              {c.threshold && (
                <p className="mt-1 text-sm text-neutral-500">
                  <span className="font-medium text-neutral-600">Roughly when: </span>
                  {c.threshold}
                </p>
              )}
              {c.citations.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {c.citations.map((cit) => (
                    <li key={cit.url} className="text-sm">
                      <a
                        href={cit.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-leaf-700 underline underline-offset-2"
                      >
                        {cit.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {ulPortions.length > 0 && (
        <div className="mt-3 rounded-lg bg-neutral-50 p-4">
          <h3 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
            Where the safe upper limit lands
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-neutral-700">
            {ulPortions.map(({ def, grams }) => (
              <li key={def.key}>
                About <span className="font-semibold">{grams} g</span>{' '}
                reaches an adult&apos;s daily upper limit for{' '}
                <span className="font-medium">{def.label.replace(/ \(.*\)$/, '')}</span> ({def.ul}{' '}
                {def.unit}).
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-neutral-500">
            That limit is a <strong>whole-day total from everything you eat</strong>, not an
            allowance for this food alone. Upper limits are from the NIH Office of Dietary
            Supplements and apply to healthy adults.
          </p>
        </div>
      )}
    </section>
  );
}
