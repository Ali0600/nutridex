/**
 * Renders a schema.org JSON-LD block. Kept as a tiny server component so any page can add
 * structured data for rich search results. The payload is trusted (built from our own
 * content), so we stringify it directly.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
