import type { Citation } from '@/lib/schema';

export function CitationList({ citations }: { citations: Citation[] }) {
  return (
    <ul className="mt-2 space-y-1 text-sm">
      {citations.map((c) => (
        <li key={c.url} className="text-neutral-600">
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-leaf-700 underline decoration-leaf-300 underline-offset-2 hover:decoration-leaf-600"
          >
            {c.title}
          </a>
          {c.pmid && <span className="text-neutral-400"> · PMID {c.pmid}</span>}
        </li>
      ))}
    </ul>
  );
}
