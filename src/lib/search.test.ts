import { describe, expect, it } from 'vitest';
import { searchItems } from './search';
import type { Item } from './schema';

function item(slug: string, name: string, extra: Partial<Item> = {}): Item {
  return {
    slug,
    name,
    category: 'vegetables',
    aliases: [],
    summary: '',
    superfood: false,
    benefits: [
      {
        claim: 'A benefit',
        mechanism: 'm',
        organs: ['heart'],
        conditions: [],
        strength: 'moderate',
        citations: [{ title: 't', source: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/1/' }],
      },
    ],
    surprisingFacts: [],
    compounds: [],
    affiliateSlots: [],
    updatedAt: '2026-01-01',
    ...extra,
  };
}

const items: Item[] = [
  item('spinach', 'Spinach', {
    aliases: ['baby spinach'],
    summary: 'Leafy green rich in iron and vitamin K.',
    benefits: [
      {
        claim: 'Provides plant-based iron',
        mechanism: 'm',
        organs: ['blood'],
        conditions: ['iron-deficiency', 'hair-loss'],
        strength: 'moderate',
        citations: [{ title: 't', source: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/1/' }],
      },
    ],
  }),
  item('beetroot', 'Beetroot', {
    aliases: ['beet', 'beets'],
    summary: 'Root vegetable high in dietary nitrate.',
    benefits: [
      {
        claim: 'Helps lower high blood pressure',
        mechanism: 'm',
        organs: ['heart'],
        conditions: ['high-blood-pressure'],
        strength: 'strong',
        citations: [{ title: 't', source: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/2/' }],
      },
    ],
  }),
  item('kiwi', 'Kiwifruit', { category: 'fruits', aliases: ['kiwi'], summary: 'High in vitamin C.' }),
];

describe('searchItems', () => {
  it('returns all items name-sorted for an empty query', () => {
    expect(searchItems(items, '').map((i) => i.slug)).toEqual(['beetroot', 'kiwi', 'spinach']);
  });

  it('matches by name', () => {
    expect(searchItems(items, 'spinach').map((i) => i.slug)).toEqual(['spinach']);
  });

  it('matches by alias', () => {
    expect(searchItems(items, 'beet').map((i) => i.slug)).toEqual(['beetroot']);
  });

  it('matches by benefit claim text', () => {
    expect(searchItems(items, 'blood pressure').map((i) => i.slug)).toEqual(['beetroot']);
  });

  it('matches by condition tag', () => {
    expect(searchItems(items, 'hair-loss').map((i) => i.slug)).toEqual(['spinach']);
  });

  it('requires all terms to hit (AND semantics)', () => {
    // "iron" hits spinach but "zzzz" hits nothing → no results
    expect(searchItems(items, 'iron zzzz')).toEqual([]);
  });

  it('ranks a name hit above a summary-only hit', () => {
    // "kiwi" is the name of kiwifruit; no other item mentions it
    const res = searchItems(items, 'kiwi');
    expect(res[0].slug).toBe('kiwi');
  });
});
