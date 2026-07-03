/**
 * Persistence for the last quiz result so it survives closing the modal or navigating away.
 * Stored client-side only (localStorage). The snapshot getter returns the raw JSON string —
 * stable by value — so it's safe to read with `useSyncExternalStore` without re-render loops.
 */
export const QUIZ_RESULT_KEY = 'nutridex.lastQuiz';
const QUIZ_EVENT = 'nutridex:quiz';

export interface SavedQuiz {
  conditionIds: string[];
  itemSlugs: string[];
  at: string; // ISO timestamp
}

export function saveQuizResult(result: SavedQuiz): void {
  try {
    localStorage.setItem(QUIZ_RESULT_KEY, JSON.stringify(result));
    window.dispatchEvent(new Event(QUIZ_EVENT));
  } catch {
    /* localStorage unavailable — results just won't persist */
  }
}

export function clearQuizResult(): void {
  try {
    localStorage.removeItem(QUIZ_RESULT_KEY);
    window.dispatchEvent(new Event(QUIZ_EVENT));
  } catch {
    /* ignore */
  }
}

export function subscribeQuizResult(onChange: () => void): () => void {
  window.addEventListener(QUIZ_EVENT, onChange);
  window.addEventListener('storage', onChange); // cross-tab updates
  return () => {
    window.removeEventListener(QUIZ_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Raw JSON string (or null) — stable identity for useSyncExternalStore. */
export function getQuizResultSnapshot(): string | null {
  try {
    return localStorage.getItem(QUIZ_RESULT_KEY);
  } catch {
    return null;
  }
}
