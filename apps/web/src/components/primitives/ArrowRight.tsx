type Props = {
  size?: number;
  stroke?: string;
  width?: number;
};

export function ArrowRight({ size = 16, stroke = 'currentColor', width = 1.5 }: Props) {
  const h = size * 0.875;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 16 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      aria-hidden
    >
      <path
        d="M1 7 H14 M9 2 L14 7 L9 12"
        stroke={stroke}
        strokeWidth={width}
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  );
}
