// Tierra design tokens used by the email primitives.
// Email clients have weak CSS support (no variables, no @theme, partial flex,
// no rems in some clients), so the tokens are concrete pixel + hex values
// rather than references to the web app's CSS custom properties.

export const colors = {
  bone: '#EFE6D2',
  sage: '#D9CFB6',
  moss: '#2D4030',
  honey: '#C8A24A',
  ink: '#1F1B14',
  soil: '#5C4326',
  borderHairline: '#1F1B1422',
  borderStrong: '#1F1B143D',
} as const;

export const fonts = {
  serif: "'Fraunces', Georgia, 'Times New Roman', serif",
  sans: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
} as const;

export const sizes = {
  containerWidth: 560,
  pagePadding: 32,
  sectionGap: 24,
} as const;

export const labelStyle = {
  fontFamily: fonts.sans,
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '1.98px',
  color: colors.soil,
  lineHeight: 1.3,
};
