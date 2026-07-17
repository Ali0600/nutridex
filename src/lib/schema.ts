import { z } from 'zod';

/**
 * The content schema is the contract for the whole database. Every JSON file under
 * `content/` is validated against it in CI (`npm run content:validate`), so a claim
 * without a citation, a tag that doesn't exist, or a superfood without a reason fails
 * the build rather than shipping. Tag referential integrity (organs/conditions must be
 * real ids) is checked in `validate-content.ts`, which has the full id sets in hand.
 */

export const CATEGORIES = [
  'tea',
  'fruits',
  'vegetables',
  'meats',
  'nuts',
  'seeds',
  'legumes',
  'grains',
  'herbs-spices',
  'oils',
] as const;
export const categorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof categorySchema>;

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case (a-z, 0-9, single hyphens)');

export const citationSchema = z.object({
  title: z.string().min(1),
  source: z.enum(['PubMed', 'PMC', 'DOI', 'other']),
  url: z.url(),
  pmid: z.string().regex(/^\d+$/).optional(),
  year: z.number().int().gte(1800).lte(2100).optional(),
});
export type Citation = z.infer<typeof citationSchema>;

export const benefitSchema = z.object({
  claim: z.string().min(1),
  /** The actual science — the "why" (e.g. nitrates → nitric oxide → vasodilation). */
  mechanism: z.string().min(1),
  organs: z.array(slug).min(1),
  conditions: z.array(slug).default([]),
  strength: z.enum(['preliminary', 'moderate', 'strong']),
  citations: z.array(citationSchema).min(1, 'every benefit needs at least one study'),
});
export type Benefit = z.infer<typeof benefitSchema>;

export const factSchema = z.object({
  text: z.string().min(1),
  citation: citationSchema.optional(),
});

export const affiliateSlotSchema = z
  .object({
    label: z.string().min(1),
    /** Explicit outbound URL (legacy/manual links). */
    url: z.url().optional(),
    /** Amazon search term — the URL (with our tag) is built at render time. */
    amazonSearch: z.string().min(1).optional(),
    /** Specific Amazon product id — takes precedence over amazonSearch. */
    asin: z.string().min(1).optional(),
    sponsor: z.string().optional(),
    disclosure: z.enum(['affiliate', 'sponsored']),
  })
  .refine((v) => Boolean(v.url || v.amazonSearch || v.asin), {
    error: 'an affiliate slot needs a url, amazonSearch, or asin',
    path: ['url'],
  });
export type AffiliateSlot = z.infer<typeof affiliateSlotSchema>;

export const itemSchema = z
  .object({
    slug,
    name: z.string().min(1),
    category: categorySchema,
    aliases: z.array(z.string()).default([]),
    summary: z.string().min(1),
    superfood: z.boolean().default(false),
    superfoodReason: z.string().optional(),
    fdcId: z.number().int().positive().optional(),
    benefits: z.array(benefitSchema).min(1),
    surprisingFacts: z.array(factSchema).default([]),
    /** Ids from `content/compounds.json` — bioactives this food actually contains. */
    compounds: z.array(slug).default([]),
    affiliateSlots: z.array(affiliateSlotSchema).default([]),
    updatedAt: z.iso.date(),
  })
  .refine((v) => !v.superfood || (v.superfoodReason && v.superfoodReason.length > 0), {
    error: 'superfood items must include a superfoodReason',
    path: ['superfoodReason'],
  });
export type Item = z.infer<typeof itemSchema>;

export const organSchema = z.object({
  id: slug,
  label: z.string().min(1),
  synonyms: z.array(z.string()).default([]),
  blurb: z.string().optional(),
});
export type Organ = z.infer<typeof organSchema>;

export const COMPOUND_KINDS = [
  'polyphenol',
  'carotenoid',
  'enzyme',
  'fatty-acid',
  'organosulfur',
  'alkaloid',
  'pigment',
  'amino-acid',
  'other',
] as const;

/**
 * How rare the compound is **in the human diet** — an authored real-world claim, which is
 * why `citations` is required. Not to be confused with how many of our own items carry it:
 * that count is derived from the database and must never be rendered as world-rarity.
 */
export const RARITIES = ['signature', 'rare', 'uncommon', 'common'] as const;
export const raritySchema = z.enum(RARITIES);
export type Rarity = z.infer<typeof raritySchema>;

export const compoundSchema = z.object({
  id: slug,
  name: z.string().min(1),
  kind: z.enum(COMPOUND_KINDS),
  rarity: raritySchema,
  /** One honest sentence on where it occurs in the diet — what `citations` must support. */
  distribution: z.string().min(1),
  blurb: z.string().min(1),
  citations: z.array(citationSchema).min(1, 'a rarity claim needs at least one study'),
});
export type Compound = z.infer<typeof compoundSchema>;

const quizAnswerSchema = z.object({
  label: z.string().min(1),
  weight: z.number().gte(0),
});

const quizQuestionSchema = z.object({
  id: slug,
  text: z.string().min(1),
  answers: z.array(quizAnswerSchema).min(2),
});

export const conditionSchema = z.object({
  id: slug,
  label: z.string().min(1),
  kind: z.enum(['condition', 'goal', 'deficiency']),
  organs: z.array(slug).default([]),
  intro: z.string().min(1),
  /** Present when this condition surfaces in the onboarding quiz. */
  quiz: z
    .object({
      triggerLabel: z.string().min(1),
      /** Answer weights at/above this sum mark the condition as relevant. */
      threshold: z.number().gt(0),
      questions: z.array(quizQuestionSchema).min(1),
    })
    .optional(),
  recommends: z
    .object({
      boostSuperfoods: z.boolean().default(true),
    })
    .default({ boostSuperfoods: true }),
});
export type Condition = z.infer<typeof conditionSchema>;

export const organsFileSchema = z.array(organSchema).min(1);
export const conditionsFileSchema = z.array(conditionSchema).min(1);
export const compoundsFileSchema = z.array(compoundSchema).min(1);

/** Distilled USDA output (`data/usda/nutrients.generated.json`). */
export const nutrientsFileSchema = z.record(
  z.string(),
  z.object({
    fdcId: z.number().int().positive(),
    description: z.string(),
    dataset: z.string(),
    per100g: z.record(z.string(), z.number()),
  }),
);
export type NutrientsFile = z.infer<typeof nutrientsFileSchema>;

/** `data/usda/fdc-map.json` — slug → FDC id + dataset. */
export const fdcMapFileSchema = z.record(
  z.string(),
  z.object({
    fdcId: z.number().int().positive(),
    dataset: z.enum(['foundation', 'sr_legacy', 'survey_fndds']),
  }),
);
export type FdcMapFile = z.infer<typeof fdcMapFileSchema>;
