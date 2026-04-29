import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#EFE6D2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#1F1B14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 11,
              height: 14,
              background: '#C8A24A',
              borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%',
              transform: 'translateY(-1px)',
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
