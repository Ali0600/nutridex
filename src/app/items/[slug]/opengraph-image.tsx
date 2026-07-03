import { ImageResponse } from 'next/og';
import { getItem, getItems } from '@/lib/content';
import { CATEGORY_LABELS } from '@/lib/labels';

export const alt = 'NutriDex food entry';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return getItems().map((i) => ({ slug: i.slug }));
}

export default async function ItemOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getItem(slug);
  const name = item?.name ?? 'NutriDex';
  const summary = item?.summary ?? 'Science-backed food benefits';
  const brand = item ? `NutriDex · ${CATEGORY_LABELS[item.category]}` : 'NutriDex';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#f3faf3',
          padding: '80px',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: '#45a251' }}>{brand}</div>
        <div style={{ marginTop: 12, fontSize: 76, fontWeight: 800, color: '#224527' }}>{name}</div>
        <div
          style={{
            marginTop: 20,
            fontSize: 34,
            color: '#3f3f46',
            lineHeight: 1.3,
            display: 'flex',
          }}
        >
          {summary.length > 120 ? summary.slice(0, 117) + '…' : summary}
        </div>
        {item?.superfood && (
          <div style={{ marginTop: 28, fontSize: 26, color: '#34843f' }}>🌟 Super Food</div>
        )}
      </div>
    ),
    size,
  );
}
