import { describe, expect, it } from 'vitest';
import { recommendItems, scoreConditions, type QuizAnswers } from './quiz';
import type { Condition, Item } from './schema';

const conditions: Condition[] = [
  {
    id: 'iron-deficiency',
    label: 'Low iron',
    kind: 'deficiency',
    organs: ['blood'],
    intro: 'x',
    quiz: {
      triggerLabel: 'Iron',
      threshold: 2,
      questions: [
        { id: 'q-dizzy', text: 'dizzy?', answers: [{ label: 'y', weight: 2 }, { label: 'n', weight: 0 }] },
        { id: 'q-tired', text: 'tired?', answers: [{ label: 'y', weight: 2 }, { label: 'n', weight: 0 }] },
      ],
    },
    recommends: { boostSuperfoods: true },
  },
  {
    id: 'high-blood-pressure',
    label: 'High BP',
    kind: 'condition',
    organs: ['heart'],
    intro: 'x',
    quiz: {
      triggerLabel: 'BP',
      threshold: 3,
      questions: [
        { id: 'q-bp', text: 'high bp?', answers: [{ label: 'y', weight: 3 }, { label: 'n', weight: 0 }] },
      ],
    },
    recommends: { boostSuperfoods: true },
  },
];

function item(slug: string, superfood: boolean, conds: string[]): Item {
  return {
    slug,
    name: slug,
    category: 'vegetables',
    aliases: [],
    summary: 'x',
    superfood,
    superfoodReason: superfood ? 'r' : undefined,
    benefits: [
      {
        claim: 'c',
        mechanism: 'm',
        organs: ['blood'],
        conditions: conds,
        strength: 'moderate',
        citations: [{ title: 't', source: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/1/' }],
      },
    ],
    surprisingFacts: [],
    compounds: [],
    affiliateSlots: [],
    updatedAt: '2026-01-01',
  };
}

describe('scoreConditions', () => {
  it('includes a condition only when answered weight meets its threshold', () => {
    const answers: QuizAnswers = { 'q-dizzy': 2, 'q-tired': 2 }; // 4 >= 2
    const scores = scoreConditions(conditions, answers);
    expect(scores.map((s) => s.condition.id)).toEqual(['iron-deficiency']);
    expect(scores[0].over).toBe(2); // 4 - 2
  });

  it('excludes a condition below threshold', () => {
    const answers: QuizAnswers = { 'q-bp': 0 }; // 0 < 3
    expect(scoreConditions(conditions, answers)).toHaveLength(0);
  });

  it('ranks the more strongly triggered condition first', () => {
    const answers: QuizAnswers = { 'q-dizzy': 2, 'q-tired': 2, 'q-bp': 3 };
    const scores = scoreConditions(conditions, answers);
    // iron over = 2, bp over = 0 → iron first
    expect(scores[0].condition.id).toBe('iron-deficiency');
    expect(scores.map((s) => s.condition.id).sort()).toEqual(['high-blood-pressure', 'iron-deficiency']);
  });

  it('ignores unanswered conditions entirely', () => {
    expect(scoreConditions(conditions, {})).toHaveLength(0);
  });
});

describe('recommendItems', () => {
  it('only recommends items whose benefits address a relevant condition', () => {
    const scores = scoreConditions(conditions, { 'q-dizzy': 2, 'q-tired': 2 });
    const items = [
      item('spinach', false, ['iron-deficiency']),
      item('beetroot', true, ['high-blood-pressure']), // not relevant here
    ];
    const recs = recommendItems(scores, items);
    expect(recs.map((r) => r.item.slug)).toEqual(['spinach']);
  });

  it('gives a superfood a boost over an equal non-superfood', () => {
    const scores = scoreConditions(conditions, { 'q-dizzy': 2, 'q-tired': 2 });
    const items = [
      item('plain', false, ['iron-deficiency']),
      item('super', true, ['iron-deficiency']),
    ];
    const recs = recommendItems(scores, items);
    expect(recs[0].item.slug).toBe('super');
    expect(recs[0].score).toBeGreaterThan(recs[1].score);
  });

  it('ranks an item matching two relevant conditions above one matching a single', () => {
    const scores = scoreConditions(conditions, { 'q-dizzy': 2, 'q-tired': 2, 'q-bp': 3 });
    const items = [
      item('single', false, ['high-blood-pressure']),
      item('double', false, ['iron-deficiency', 'high-blood-pressure']),
    ];
    const recs = recommendItems(scores, items);
    expect(recs[0].item.slug).toBe('double');
  });
});
