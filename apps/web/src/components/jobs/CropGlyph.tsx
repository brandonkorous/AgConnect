type CropName = 'grape' | 'almond' | 'citrus' | 'tomato' | 'lettuce' | 'strawberry';

const COLORS: Record<CropName, string> = {
  grape: '#6B2B5E',
  almond: '#C58A5A',
  citrus: '#E07A1F',
  tomato: '#C73E2A',
  lettuce: '#4A8C3A',
  strawberry: '#D43855',
};

type Props = { crop: string; size?: number };

export function CropGlyph({ crop, size = 28 }: Props) {
  const key = (Object.keys(COLORS).includes(crop) ? crop : 'almond') as CropName;
  const color = COLORS[key];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color, flexShrink: 0 }}
      fill="currentColor"
      aria-hidden
    >
      {key === 'grape' && (
        <g>
          <circle cx="9" cy="14" r="3" />
          <circle cx="15" cy="14" r="3" />
          <circle cx="12" cy="18" r="3" />
          <circle cx="12" cy="11" r="3" />
          <path d="M12 8c0-2 1-4 3-4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      )}
      {key === 'almond' && (
        <g>
          <path d="M12 4c4 4 4 12 0 16-4-4-4-12 0-16Z" />
          <path d="M12 8v8" stroke="white" strokeWidth="1.2" fill="none" />
        </g>
      )}
      {key === 'citrus' && (
        <g>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7" stroke="white" strokeWidth="1" fill="none" />
        </g>
      )}
      {key === 'tomato' && (
        <g>
          <circle cx="12" cy="14" r="7" />
          <path d="M9 7c1 1 2 1 3 1s2 0 3-1M12 8V6" stroke="#4A8C3A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      )}
      {key === 'lettuce' && (
        <g>
          <path d="M12 4c-3 0-6 2-7 5 2-1 4-1 5 0-2 1-4 3-4 6 2-1 4-1 5 0-1 1-1 3 1 5 2-2 2-4 1-5 1-1 3-1 5 0 0-3-2-5-4-6 1-1 3-1 5 0-1-3-4-5-7-5Z" />
        </g>
      )}
      {key === 'strawberry' && (
        <g>
          <path d="M12 8c-4 0-7 3-7 7 0 3 3 5 7 5s7-2 7-5c0-4-3-7-7-7Z" />
          <path d="M9 6c1-1 2-2 3-2s2 1 3 2" stroke="#4A8C3A" strokeWidth="1.6" fill="none" />
          <circle cx="10" cy="13" r=".7" fill="white" />
          <circle cx="14" cy="13" r=".7" fill="white" />
          <circle cx="12" cy="16" r=".7" fill="white" />
        </g>
      )}
    </svg>
  );
}
