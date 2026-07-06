'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Search box that drives the `/items?q=` page (the target of the homepage SearchAction).
 * Debounced live navigation as you type, plus submit — no client-side data, the page renders
 * the ranked results server-side so results are shareable and crawlable.
 */
export function ItemSearchBox({
  defaultValue = '',
  autoFocus = false,
  placeholder = 'Search foods, benefits, nutrients…',
  compact = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  placeholder?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function go(next: string) {
    router.push(next.trim() ? `/items?q=${encodeURIComponent(next.trim())}` : '/items');
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => go(next), 250);
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        go(value);
      }}
      className={compact ? 'w-full max-w-xs' : 'w-full max-w-xl'}
    >
      <input
        type="search"
        name="q"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search foods"
        className={`w-full rounded-full border border-neutral-300 bg-white px-4 text-neutral-900 placeholder:text-neutral-400 focus:border-leaf-500 focus:ring-2 focus:ring-leaf-200 focus:outline-none ${
          compact ? 'py-1.5 text-sm' : 'py-2.5'
        }`}
      />
    </form>
  );
}
