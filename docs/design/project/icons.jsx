/* AgConnect — Icons & shared primitives
   Custom-drawn iconography for crops + UI. Avoids generic emoji.
*/

const Icon = ({ name, size = 20, stroke = 1.6, color = 'currentColor', ...rest }) => {
  const s = { width: size, height: size, ...rest.style };
  const common = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: stroke,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    ...rest,
    style: s
  };
  switch (name) {
    case 'arrow':
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case 'arrow-up-right':
      return <svg {...common}><path d="M7 17 17 7M9 7h8v8" /></svg>;
    case 'check':
      return <svg {...common}><path d="M4 12.5 9.5 18 20 7" /></svg>;
    case 'plus':
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case 'minus':
      return <svg {...common}><path d="M5 12h14" /></svg>;
    case 'pin':
      return <svg {...common}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" /><circle cx="12" cy="9" r="2.5" /></svg>;
    case 'phone':
      return <svg {...common}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>;
    case 'chat':
      return <svg {...common}><path d="M4 5h16v11H8l-4 4V5Z" /></svg>;
    case 'shield':
      return <svg {...common}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
    case 'cash':
      return <svg {...common}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9v6M18 9v6" /></svg>;
    case 'calendar':
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
    case 'graduate':
      return <svg {...common}><path d="m2 9 10-5 10 5-10 5L2 9Z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></svg>;
    case 'badge':
      return <svg {...common}><circle cx="12" cy="10" r="6" /><path d="m9 14-2 7 5-3 5 3-2-7" /></svg>;
    case 'globe':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
    case 'spark':
      return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>;
    case 'menu':
      return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case 'close':
      return <svg {...common}><path d="M5 5l14 14M19 5 5 19" /></svg>;
    case 'play':
      return <svg {...common}><path d="M8 5v14l11-7L8 5Z" fill={color} /></svg>;
    case 'download':
      return <svg {...common}><path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14" /></svg>;
    case 'sun':
      return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></svg>;
    case 'leaf':
      return <svg {...common}><path d="M5 19c0-9 7-14 16-14-1 9-5 16-14 16-1 0-2-1-2-2Z" /><path d="M5 19c4-4 8-7 14-10" /></svg>;
    case 'truck':
      return <svg {...common}><path d="M3 7h11v9H3zM14 11h4l3 3v2h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
    case 'users':
      return <svg {...common}><circle cx="9" cy="9" r="3.5" /><path d="M3 19c0-3 3-5 6-5s6 2 6 5" /><circle cx="17" cy="8" r="2.5" /><path d="M16 14c2.5 0 5 1.5 5 4" /></svg>;
    case 'kanban':
      return <svg {...common}><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="10" rx="1" /><rect x="17" y="4" width="4" height="14" rx="1" /></svg>;
    case 'qr':
      return <svg {...common}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3M21 17v4h-4M14 21h3" /></svg>;
    case 'filter':
      return <svg {...common}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z" /></svg>;
    case 'copy':
      return <svg {...common}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
    case 'bell':
      return <svg {...common}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
    default:
      return null;
  }
};

/* Crop glyphs — tiny filled icons used on job cards */
const CropGlyph = ({ crop, size = 28 }) => {
  const map = {
    grape: { color: 'var(--crop-grape)',
      paths: <g><circle cx="9" cy="14" r="3" /><circle cx="15" cy="14" r="3" /><circle cx="12" cy="18" r="3" /><circle cx="12" cy="11" r="3" /><path d="M12 8c0-2 1-4 3-4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" /></g> },
    almond: { color: 'var(--crop-almond)',
      paths: <g><path d="M12 4c4 4 4 12 0 16-4-4-4-12 0-16Z" /><path d="M12 8v8" stroke="white" strokeWidth="1.2" fill="none" /></g> },
    citrus: { color: 'var(--crop-citrus)',
      paths: <g><circle cx="12" cy="12" r="8" /><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7" stroke="white" strokeWidth="1" fill="none" /></g> },
    tomato: { color: 'var(--crop-tomato)',
      paths: <g><circle cx="12" cy="14" r="7" /><path d="M9 7c1 1 2 1 3 1s2 0 3-1M12 8V6" stroke="var(--crop-lettuce)" strokeWidth="1.6" fill="none" strokeLinecap="round" /></g> },
    lettuce: { color: 'var(--crop-lettuce)',
      paths: <g><path d="M12 4c-3 0-6 2-7 5 2-1 4-1 5 0-2 1-4 3-4 6 2-1 4-1 5 0-1 1-1 3 1 5 2-2 2-4 1-5 1-1 3-1 5 0 0-3-2-5-4-6 1-1 3-1 5 0-1-3-4-5-7-5Z" /></g> },
    strawberry: { color: 'var(--crop-strawberry)',
      paths: <g><path d="M12 8c-4 0-7 3-7 7 0 3 3 5 7 5s7-2 7-5c0-4-3-7-7-7Z" /><path d="M9 6c1-1 2-2 3-2s2 1 3 2" stroke="var(--crop-lettuce)" strokeWidth="1.6" fill="none" /><circle cx="10" cy="13" r=".7" fill="white" /><circle cx="14" cy="13" r=".7" fill="white" /><circle cx="12" cy="16" r=".7" fill="white" /></g> }
  };
  const item = map[crop] || map.almond;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color: item.color, flexShrink: 0 }} fill="currentColor">
      {item.paths}
    </svg>);

};

/* Wordmark */
const Logo = ({ size = 22, mono = false }) => {
  const tealColor = mono ? 'currentColor' : 'var(--c-primary)';
  const accentColor = mono ? 'currentColor' : 'var(--c-accent)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--f-display)', fontSize: size, fontWeight: 400, letterSpacing: '-0.02em', color: 'inherit' }}>
      <svg width={size + 6} height={size + 6} viewBox="0 0 32 32" fill="none">
        {/* Stylized sun + furrow mark */}
        <circle cx="16" cy="13" r="6" fill={accentColor} />
        <path d="M2 24c4-3 8-3 14-3s10 0 14 3" stroke={tealColor} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M2 28c4-3 8-3 14-3s10 0 14 3" stroke={tealColor} strokeWidth="2.4" strokeLinecap="round" opacity="0.4" />
      </svg>
      <span>Ag<em style={{ fontStyle: 'italic', fontWeight: 300, color: tealColor }}>Conn</em></span>
    </span>);

};

Object.assign(window, { Icon, CropGlyph, Logo });