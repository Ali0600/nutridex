import { jsonResponse } from '@/lib/api';
import { getItem, getItems } from '@/lib/content';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return getItems().map((i) => ({ slug: i.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) return jsonResponse({ error: 'not found', slug });
  return jsonResponse(item);
}
