import { ImageResponse } from 'next/og';

export const alt = 'NutriDex — science-backed food benefits';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#f3faf3',
          padding: '80px',
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 800, color: '#2c6935' }}>NutriDex 🥝</div>
        <div style={{ marginTop: 16, fontSize: 40, color: '#3f3f46' }}>
          Every food, explained — with the science.
        </div>
        <div style={{ marginTop: 24, fontSize: 28, color: '#71717a' }}>
          Teas · Fruits · Vegetables · Meats · Nuts
        </div>
      </div>
    ),
    size,
  );
}
