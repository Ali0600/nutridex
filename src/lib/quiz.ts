import type { Condition, Item } from './schema';

/**
 * Pure, backend-free quiz scoring. The onboarding quiz collects an answer for some quiz
 * questions; each answer carries a weight. A condition is "relevant" when the summed
 * weight of its answered questions meets its threshold. Relevant conditions are ranked by
 * how far over threshold they scored, then resolved to foods via the condition→items
 * index. Deterministic and unit-tested — no network, no persistence beyond a localStorage
 * "seen" flag in the UI.
 */

/** Map of questionId -> chosen answer weight (absent = unanswered / weight 0). */
export type QuizAnswers = Record<string, number>;

export interface ConditionScore {
  condition: Condition;
  score: number;
  over: number; // score - threshold (how strongly it triggered)
}

export function scoreConditions(
  conditions: Condition[],
  answers: QuizAnswers,
): ConditionScore[] {
  const scored: ConditionScore[] = [];
  for (const condition of conditions) {
    if (!condition.quiz) continue;
    let score = 0;
    let answered = false;
    for (const q of condition.quiz.questions) {
      const w = answers[q.id];
      if (typeof w === 'number') {
        score += w;
        answered = true;
      }
    }
    if (answered && score >= condition.quiz.threshold) {
      scored.push({ condition, score, over: score - condition.quiz.threshold });
    }
  }
  scored.sort((a, b) => b.over - a.over || b.score - a.score);
  return scored;
}

/**
 * Rank items for a set of relevant conditions. An item scores by how many of the relevant
 * conditions its benefits address (weighted by each condition's trigger strength), with a
 * small superfood boost when a matched condition asks for it. Returns items best-first.
 */
export function recommendItems(
  scores: ConditionScore[],
  items: Item[],
  limit = 12,
): { item: Item; matchedConditions: string[]; score: number }[] {
  const relevant = new Map(scores.map((s) => [s.condition.id, s]));
  const ranked: { item: Item; matchedConditions: string[]; score: number }[] = [];

  for (const item of items) {
    const matched = new Set<string>();
    let score = 0;
    for (const benefit of item.benefits) {
      for (const cid of benefit.conditions) {
        const cs = relevant.get(cid);
        if (!cs) continue;
        if (!matched.has(cid)) {
          // weight: base 1 + how strongly the condition triggered
          score += 1 + cs.over * 0.5;
          if (cs.condition.recommends.boostSuperfoods && item.superfood) score += 0.5;
        }
        matched.add(cid);
      }
    }
    if (matched.size > 0) {
      ranked.push({ item, matchedConditions: [...matched], score });
    }
  }

  ranked.sort(
    (a, b) =>
      b.score - a.score ||
      b.matchedConditions.length - a.matchedConditions.length ||
      a.item.name.localeCompare(b.item.name),
  );
  return ranked.slice(0, limit);
}
