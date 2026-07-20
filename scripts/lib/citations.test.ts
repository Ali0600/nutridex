/**
 * Regression tests for the citation-integrity gate.
 *
 * Every case here is a REAL defect or a REAL false positive found while auditing the 147
 * citations in this repo (2026-07-20), so each one guards a mistake that actually happened
 * rather than a hypothetical.
 */
import { describe, expect, it } from 'vitest';
import {
  TITLE_MATCH_THRESHOLD,
  type CiteRef,
  type VerifiedRecord,
  bylineOf,
  checkCitation,
  startsWithName,
  stemOf,
  titleOverlap,
} from './citations';

const rec = (over: Partial<VerifiedRecord> = {}): VerifiedRecord => ({
  title: 'Effect of garlic on blood pressure: a meta-analysis',
  firstAuthor: 'Wang HP',
  groupAuthor: false,
  journal: 'J Clin Hypertens (Greenwich)',
  year: 2015,
  retracted: false,
  errata: [],
  checkedAt: '2026-07-20',
  ...over,
});

const ref = (over: Partial<CiteRef> = {}): CiteRef => ({
  pmid: '25557383',
  title: 'Effect of garlic on blood pressure: a meta-analysis (Wang et al., J Clin Hypertens 2015)',
  year: 2015,
  where: 'items/vegetables/garlic.json',
  context: 'benefit',
  ...over,
});

describe('checkCitation', () => {
  it('passes a correct citation', () => {
    expect(checkCitation(ref(), rec())).toEqual([]);
  });

  // The real bug: kiwi cited PMID 20476733 for a protein-digestion claim, but that ID is an
  // art-conservation paper about FTIR spectroscopy.
  it('catches a PMID that resolves to an unrelated paper', () => {
    const problems = checkCitation(
      ref({
        pmid: '20476733',
        title: 'Actinidin enhances gastric protein digestion (Kaur et al., J Agric Food Chem 2010)',
        year: 2010,
      }),
      rec({
        title:
          'New advances in the application of FTIR microscopy and spectroscopy for the characterization of artistic materials',
        firstAuthor: 'Prati S',
        journal: 'Acc Chem Res',
        year: 2010,
      }),
    );
    expect(problems.join(' ')).toMatch(/title does not match/);
  });

  // The real bug: broccoli stored year 2015; the paper (Conzatti, Nutr Hosp) is 2014.
  it('catches a year that disagrees with the record', () => {
    const problems = checkCitation(
      ref({ year: 2015, title: 'Effect of garlic on blood pressure: a meta-analysis (Wang et al., J Clin Hypertens 2015)' }),
      rec({ year: 2014 }),
    );
    expect(problems.join(' ')).toMatch(/year 2015 but the record says 2014/);
  });

  // The real bug: 16 of 147 citations carried an invented author on a correct paper.
  it('catches an invented author byline', () => {
    const problems = checkCitation(
      ref({ title: 'Effect of garlic on blood pressure: a meta-analysis (Rohner et al., Am J Hypertens 2015)' }),
      rec(),
    );
    expect(problems.join(' ')).toMatch(/byline names "Rohner" but the first author is "Wang"/);
  });

  it('catches a retracted publication', () => {
    expect(checkCitation(ref(), rec({ retracted: true })).join(' ')).toMatch(/RETRACTED/);
  });

  // Fail closed: an unknown PMID must never pass just because it isn't in the cache.
  it('fails closed when the PMID is absent from the cache', () => {
    expect(checkCitation(ref(), undefined).join(' ')).toMatch(/not in data\/citations\.verified\.json/);
  });
});

describe('checkCitation — false positives that must NOT fire', () => {
  // AREDS2 is the standard acronym for "Age-Related Eye Disease Study 2 Research Group".
  it('exempts corporate/group authors cited by acronym', () => {
    const problems = checkCitation(
      ref({
        pmid: '23644932',
        title: 'Lutein + zeaxanthin and omega-3 fatty acids for age-related macular degeneration (AREDS2 Research Group, JAMA 2013)',
        year: 2013,
      }),
      rec({
        title: 'Lutein + zeaxanthin and omega-3 fatty acids for age-related macular degeneration',
        firstAuthor: 'Age-Related Eye Disease Study 2 Research Group.',
        groupAuthor: true,
        journal: 'JAMA',
        year: 2013,
      }),
    );
    expect(problems).toEqual([]);
  });

  // StatPearls entries are books: no journal, and they are cited by the book name.
  it('exempts books, which have no journal and are not cited by first author', () => {
    const problems = checkCitation(
      ref({ pmid: '30725697', title: 'Carotenemia (StatPearls, 2026)', year: 2026 }),
      rec({ title: 'Carotenemia', firstAuthor: 'Sauder HM', journal: null, year: 2026 }),
    );
    expect(problems).toEqual([]);
  });

  // Europe PMC renders "M. del C." as "Mdel C", which no initial-stripper handles. This one
  // false-positived the gate on its very first run.
  it('accepts a surname followed by a compound initial', () => {
    const problems = checkCitation(
      ref({
        pmid: '16890967',
        title: 'Biosynthesis of curcuminoids and gingerols (Ramirez-Ahumada et al., Phytochemistry 2006)',
        year: 2006,
      }),
      rec({
        title: 'Biosynthesis of curcuminoids and gingerols',
        firstAuthor: 'Ramirez-Ahumada Mdel C',
        journal: 'Phytochemistry',
        year: 2006,
      }),
    );
    expect(problems).toEqual([]);
  });

  it('accepts a multi-word surname', () => {
    expect(startsWithName('Nikkhah Bodagh M', 'Nikkhah Bodagh')).toBe(true);
  });

  it('accepts the two-author "X & Y" byline form', () => {
    const problems = checkCitation(
      ref({ pmid: '2413754', title: 'Serotonin content of foods (Feldman & Lee, Am J Clin Nutr 1985)', year: 1985 }),
      rec({ title: 'Serotonin content of foods', firstAuthor: 'Feldman JM', journal: 'Am J Clin Nutr', year: 1985 }),
    );
    expect(problems).toEqual([]);
  });

  // A trial name between the author and the journal must not be read as the author.
  it('accepts a trial name inside the byline', () => {
    const problems = checkCitation(
      ref({
        pmid: '29897866',
        title: 'Primary prevention of cardiovascular disease with a Mediterranean diet (Estruch et al., PREDIMED, N Engl J Med 2018)',
        year: 2018,
      }),
      rec({
        title: 'Primary prevention of cardiovascular disease with a Mediterranean diet',
        firstAuthor: 'Estruch R',
        journal: 'N Engl J Med',
        year: 2018,
      }),
    );
    expect(problems).toEqual([]);
  });
});

describe('startsWithName', () => {
  it('matches on a word boundary, not a bare prefix', () => {
    expect(startsWithName('Wang HP', 'Wang')).toBe(true);
    expect(startsWithName('Wanganui X', 'Wang')).toBe(false);
  });
});

describe('title comparison', () => {
  it('separates the one wrong citation from correct ones by a wide margin', () => {
    // Measured on the real corpus: the wrong citation scored 0.08, the lowest correct one 0.93.
    const wrong = titleOverlap(
      'Actinidin enhances gastric protein digestion as assessed using an in vitro gastric digestion model',
      'New advances in the application of FTIR microscopy and spectroscopy for the characterization of artistic materials',
    );
    const right = titleOverlap(
      'Effect of garlic on blood pressure: a systematic review and meta-analysis',
      'Effect of garlic on blood pressure: a meta-analysis',
    );
    expect(wrong).toBeLessThan(TITLE_MATCH_THRESHOLD);
    expect(right).toBeGreaterThan(TITLE_MATCH_THRESHOLD);
  });

  it('strips a byline whose journal abbreviation itself contains parentheses', () => {
    const t = 'Some paper (Grajecki et al., Clin Liver Dis (Hoboken) 2022)';
    expect(stemOf(t)).toBe('Some paper');
    expect(bylineOf(t)).toBe('Grajecki et al., Clin Liver Dis (Hoboken) 2022');
  });
});
