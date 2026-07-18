import type { Metadata } from 'next';
import Link from 'next/link';
import { Disclaimer } from '@/components/Disclaimer';
import { JsonLd } from '@/components/JsonLd';
import { STRENGTH_LABELS } from '@/lib/labels';
import { SITE_NAME, SITE_URL } from '@/lib/site';

const title = 'About & editorial policy';
const description =
  'How NutriDex works: every benefit is backed by a linked study, nutrient data comes from USDA FoodData Central, and affiliate links are disclosed. Not medical advice.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/about' },
  openGraph: { title, description, type: 'website' },
};

const STRENGTHS: { key: keyof typeof STRENGTH_LABELS; blurb: string }[] = [
  { key: 'strong', blurb: 'Backed by meta-analyses or large randomized trials — the highest-confidence evidence.' },
  { key: 'moderate', blurb: 'Backed by smaller trials or consistent observational studies; promising but not settled.' },
  { key: 'preliminary', blurb: 'Early, limited, or mechanistic evidence — interesting, but treat with caution.' },
];

export default function AboutPage() {
  return (
    <div className="prose-neutral max-w-2xl">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: `About ${SITE_NAME}`,
          url: `${SITE_URL}/about`,
          description,
          publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        }}
      />

      <h1 className="text-3xl font-bold text-neutral-900">About NutriDex</h1>
      <p className="mt-3 text-lg text-neutral-600">
        NutriDex is an independent project that explains what foods actually do for your body — every
        benefit paired with the mechanism behind it (the &ldquo;why&rdquo;) and a link to the study
        that supports it. No uncited claims, no miracle cures.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-neutral-900">How we cite</h2>
        <p className="mt-2 text-neutral-700">
          Every benefit on the site links to at least one published study, and the whole database is
          checked in continuous integration — a claim without a citation fails the build rather than
          shipping. Each benefit also carries an evidence-strength label so you know how settled the
          science is:
        </p>
        <ul className="mt-4 space-y-2">
          {STRENGTHS.map(({ key, blurb }) => (
            <li key={key} className="flex items-start gap-3">
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STRENGTH_LABELS[key].className}`}
              >
                {STRENGTH_LABELS[key].label}
              </span>
              <span className="text-sm text-neutral-700">{blurb}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-neutral-900">Where the data comes from</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
          <li>
            <strong>Studies:</strong> found via{' '}
            <a
              href="https://europepmc.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-leaf-700 underline"
            >
              Europe PMC
            </a>{' '}
            (PubMed, PMC, and preprints) and read before citing.
          </li>
          <li>
            <strong>Nutrient values:</strong> the per-100g numbers and vitamin rankings come from the
            USDA{' '}
            <a
              href="https://fdc.nal.usda.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-leaf-700 underline"
            >
              FoodData Central
            </a>{' '}
            database.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-neutral-900">How we handle safety information</h2>
        <p className="mt-2 text-neutral-700">
          Food pages carry an <strong>&ldquo;If you overdo it&rdquo;</strong> section describing what
          you&apos;d actually notice from eating a lot of something. Any claim of harm carries a
          citation, exactly like a benefit does — and where a food has no documented ceiling, we say
          so plainly rather than leaving the section out, because a missing warning is ambiguous.
        </p>
        <p className="mt-2 text-neutral-700">
          Where we mention a daily <em>upper limit</em>, that figure comes from the NIH Office of
          Dietary Supplements and is a <strong>whole-day total from everything you eat</strong>, not
          an allowance for that one food. Limits apply to healthy adults; needs differ in pregnancy,
          childhood, and with medication or a health condition.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-neutral-900">Affiliate disclosure</h2>
        <p className="mt-2 text-neutral-700">
          Some pages include affiliate links (for example to the Amazon Associates program). If you
          buy through one of them, NutriDex may earn a small commission <strong>at no extra cost to
          you</strong>. These links are always labelled. Affiliate relationships{' '}
          <strong>never</strong> influence which foods we cover, which studies we cite, or how we
          grade the evidence — the science comes first, and the links come after.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-neutral-900">Not medical advice</h2>
        <div className="mt-2 rounded-lg bg-leaf-50 p-4 text-neutral-700">
          <Disclaimer />
        </div>
      </section>

      <p className="mt-8 text-sm text-neutral-500">
        Browse the{' '}
        <Link href="/items" className="text-leaf-700 underline">
          full food database
        </Link>{' '}
        or take the{' '}
        <Link href="/quiz" className="text-leaf-700 underline">
          symptom quiz
        </Link>
        .
      </p>
    </div>
  );
}
