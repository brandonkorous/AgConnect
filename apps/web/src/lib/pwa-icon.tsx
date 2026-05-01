import { ImageResponse } from 'next/og';

// Tierra-themed temp PWA icon. Mirrors apps/web/src/app/icon.tsx (favicon)
// at scale: linen field, dark circle, golden seed-shape inside. Replace the
// route file outputs with real designed icons when the brand mark is locked.
//
// Maskable variant adds 10% safe-zone padding so the inner content survives
// platform mask shapes (squircle, circle, teardrop, rounded-square).

type RenderArgs = {
  size: number;
  maskable: boolean;
};

export const renderPwaIcon = ({ size, maskable }: RenderArgs) => {
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const inner = size - padding * 2;
  const mark = Math.round(inner * 0.75);
  const seedW = Math.round(mark * 0.42);
  const seedH = Math.round(mark * 0.54);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: '#EFE6D2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: inner,
            height: inner,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: mark,
              height: mark,
              borderRadius: '50%',
              background: '#1F1B14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: seedW,
                height: seedH,
                background: '#C8A24A',
                borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%',
                transform: `translateY(-${Math.max(1, Math.round(seedH * 0.05))}px)`,
              }}
            />
          </div>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
};

export const pwaIconCacheHeaders = {
  'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
};
