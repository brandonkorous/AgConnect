/* Shared sidebar + topbar shell for all signed-in worker pages */

const WSidebar = ({ active = 'home' }) => {
  const items = [
    { k: 'home', i: 'kanban', l: 'Dashboard', href: 'AgConnect Worker Dashboard.html' },
    { k: 'jobs', i: 'leaf', l: 'Browse jobs', count: 142, href: 'AgConnect Browse Jobs.html' },
    { k: 'apps', i: 'check', l: 'My applications', count: 5, href: 'AgConnect Applications.html' },
    { k: 'shifts', i: 'calendar', l: 'My shifts', href: 'AgConnect Shifts.html' },
    { k: 'pay', i: 'cash', l: 'Pay & timesheets', href: 'AgConnect Pay.html' },
    { k: 'train', i: 'graduate', l: 'Training', href: 'AgConnect Training.html' },
    { k: 'docs', i: 'badge', l: 'Documents', href: 'AgConnect Documents.html' },
    { k: 'msg', i: 'chat', l: 'Messages', count: 3, dot: true, href: 'AgConnect Messages.html' },
  ];
  return (
    <aside style={{
      width: 248, flexShrink: 0, background: 'white',
      borderRight: '1px solid var(--c-line)', padding: '20px 14px 24px',
      display: 'flex', flexDirection: 'column', gap: 4, minHeight: '100vh',
      position: 'sticky', top: 0, alignSelf: 'flex-start',
    }}>
      <div style={{ padding: '4px 8px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="AgConnect Landing.html" style={{ textDecoration: 'none' }}><Logo size={20}/></a>
        <div style={{ display: 'inline-flex', padding: 2, borderRadius: 999, background: 'rgba(28,28,26,0.06)', fontFamily: 'var(--f-mono)', fontSize: 9.5 }}>
          <span style={{ padding: '4px 8px', borderRadius: 999, background: 'var(--c-ink)', color: 'var(--c-bg)', fontWeight: 700 }}>EN</span>
          <span style={{ padding: '4px 8px', color: 'var(--c-ink-2)', fontWeight: 700 }}>ES</span>
        </div>
      </div>
      {items.map(it => {
        const isActive = it.k === active;
        return (
          <a key={it.k} href={it.href} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10, textDecoration: 'none',
            background: isActive ? 'var(--c-primary-soft)' : 'transparent',
            color: isActive ? 'var(--c-primary-deep)' : 'var(--c-ink-2)',
            fontWeight: isActive ? 600 : 500, fontSize: 13.5,
          }}>
            <Icon name={it.i} size={16}/>
            <span style={{ flex: 1 }}>{it.l}</span>
            {it.count !== undefined && (
              <span style={{
                fontSize: 10.5, fontFamily: 'var(--f-mono)', fontWeight: 700,
                padding: '2px 7px', borderRadius: 999,
                background: it.dot ? 'var(--c-accent)' : (isActive ? 'white' : 'var(--c-bg-warm)'),
                color: it.dot ? 'var(--c-ink)' : (isActive ? 'var(--c-primary)' : 'var(--c-ink-3)'),
              }}>{it.count}</span>
            )}
          </a>
        );
      })}
      <div style={{ marginTop: 'auto', paddingTop: 24 }}>
        <div style={{ padding: 14, borderRadius: 12, background: 'var(--c-bg-warm)', border: '1px solid var(--c-line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--c-primary)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>MR</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Miguel Reyes</div>
              <div style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>Madera, CA</div>
            </div>
            <Icon name="arrow" size={14} color="var(--c-ink-3)"/>
          </div>
        </div>
      </div>
    </aside>
  );
};

const WTopBar = ({ searchPlaceholder = 'Search jobs, employers, training…', cta }) => (
  <div style={{
    height: 64, padding: '0 32px', borderBottom: '1px solid var(--c-line)',
    display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(250,250,248,0.85)',
    backdropFilter: 'saturate(140%) blur(14px)', WebkitBackdropFilter: 'saturate(140%) blur(14px)',
    position: 'sticky', top: 0, zIndex: 20,
  }}>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, width: 360, color: 'var(--c-ink-3)' }}>
        <Icon name="spark" size={14}/>
        <span style={{ fontSize: 13 }}>{searchPlaceholder}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--f-mono)', fontSize: 10.5, padding: '2px 6px', borderRadius: 4, background: 'var(--c-bg-warm)', color: 'var(--c-ink-3)' }}>⌘K</span>
      </div>
    </div>
    <a href="#" style={{ fontSize: 13, color: 'var(--c-ink-2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Icon name="phone" size={14}/> SMS apply: ON
    </a>
    <button style={{ background: 'transparent', border: '1px solid var(--c-line-2)', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <Icon name="chat" size={14}/> Help
    </button>
    {cta || (
      <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>
        <Icon name="plus" size={14}/> Set availability
      </button>
    )}
  </div>
);

/* Page header — used at the top of each non-dashboard page */
const PageHeader = ({ eyebrow, title, sub, right }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
    <div>
      <span className="section-num">{eyebrow}</span>
      <h1 style={{ margin: '8px 0 0', fontFamily: 'var(--f-display)', fontSize: 'clamp(32px, 3vw, 44px)', letterSpacing: '-0.025em', fontWeight: 400, lineHeight: 1.05 }}>
        {title}
      </h1>
      {sub && <div style={{ fontSize: 14.5, color: 'var(--c-ink-2)', marginTop: 6, maxWidth: 640 }}>{sub}</div>}
    </div>
    {right}
  </div>
);

/* Page wrapper — sidebar + topbar + content */
const WorkerPage = ({ active, children, topBarCta, searchPlaceholder }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', minHeight: '100vh' }}>
    <WSidebar active={active}/>
    <main style={{ flex: 1, minWidth: 0 }}>
      <WTopBar cta={topBarCta} searchPlaceholder={searchPlaceholder}/>
      <div style={{ padding: '32px 32px 64px' }}>
        {children}
      </div>
    </main>
  </div>
);

Object.assign(window, { WSidebar, WTopBar, PageHeader, WorkerPage });
