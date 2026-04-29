type Props = {
  size?: number;
  stroke?: string;
  width?: number;
};

export function CheckCircle({ size = 20, stroke = 'currentColor', width = 1.5 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      aria-hidden
    >
      <circle cx="10" cy="10" r="9" stroke={stroke} strokeWidth={width} fill="none" />
      <path
        d="M6 10 L9 13 L14 7"
        stroke={stroke}
        strokeWidth={width}
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  );
}
