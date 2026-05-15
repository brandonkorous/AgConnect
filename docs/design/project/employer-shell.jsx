/* Shared sidebar + topbar shell for the EMPLOYER (hiring side) */

const ESidebar = ({ active = 'home' }) => {
  const items = [
    { k: 'home', i: 'kanban', l: 'Dashboard', href: 'AGCONN Employer Dashboard.html' },
    { k: 'jobs', i: 'leaf', l: 'Job postings', count: 8, href: 'AGCONN Employer Jobs.html' },
    { k: 'cand', i: 'users', l: 'Candidates', count: 47, dot: true, href: 'AGCONN Employer Candidates.html' },
    { k: 'crews', i: 'calendar', l: 'Crews & shifts', href: 'AGCONN Employer Crews.html' },
    { k: 'pay', i: 'cash', l: 'Payroll', href: 'AGCONN Employer Payroll.html' },
    { k: 'comp', i: 'shield', l: 'Compliance', count: 2, href: 'AGCONN Employer Compliance.html' },
    { k: 'msg', i: 'chat', l: 'Messages', count: 6, href: 'AGCONN Employer Messages.html' },
    { k: 'rep', i: 'spark', l: 'Reports', href: 'AGCONN Employer Reports.html' },
  ];
  return (
    <aside style={{
      width: 248, flexShrink: 0, background: 'white',
      borderRight: '1px solid var(--c-line)', padding: '20px 14px 24px',
      display: 'flex', flexDirection: 'column', gap: 4, minHeight: '100vh',
      position: 'sticky', top: 0, alignSelf: 'flex-start',
    }}>
      <div style={{ padding: '4px 8px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="AGCONN Landing.html" style={{ textDecoration: 'none' }}><Logo size={20}/></a>
        <span style={{ fontSize: 9.5, fontFamily: 'var(--f-mono)', fontWeight: 700, padding: '3px 7px', borderRadius: 4, background: 'var(--c-ink)', color: 'var(--c-bg)', letterSpacing: '0.08em' }}>HIRE</span>
      </div>
      <div style={{ padding: '10px 8px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--c-bg-warm)', borderRadius: 8, border: '1px solid var(--c-line)' }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--c-primary)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, fontFamily: 'var(--f-mono)' }}>SV</div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600 }}>Sunridge Vineyards</div>
          <Icon name="arrow" size={11} color="var(--c-ink-3)"/>
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
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--c-ink)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>EW</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Elena Whitman</div>
              <div style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>Hiring lead</div>
            </div>
            <Icon name="arrow" size={14} color="var(--c-ink-3)"/>
          </div>
        </div>
      </div>
    </aside>
  );
};

const ETopBar = ({ cta }) => (
  <div style={{
    height: 64, padding: '0 32px', borderBottom: '1px solid var(--c-line)',
    display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(250,250,248,0.85)',
    backdropFilter: 'saturate(140%) blur(14px)', WebkitBackdropFilter: 'saturate(140%) blur(14px)',
    position: 'sticky', top: 0, zIndex: 20,
  }}>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, width: 360, color: 'var(--c-ink-3)' }}>
        <Icon name="spark" size={14}/>
        <span style={{ fontSize: 13 }}>Search candidates, jobs, crews…</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--f-mono)', fontSize: 10.5, padding: '2px 6px', borderRadius: 4, background: 'var(--c-bg-warm)', color: 'var(--c-ink-3)' }}>⌘K</span>
      </div>
    </div>
    <a href="#" style={{ fontSize: 13, color: 'var(--c-ink-2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Icon name="phone" size={14}/> SMS hire: ON
    </a>
    <button style={{ background: 'transparent', border: '1px solid var(--c-line-2)', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <Icon name="chat" size={14}/> Help
    </button>
    {cta || (
      <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>
        <Icon name="plus" size={14}/> Post a job
      </button>
    )}
  </div>
);

const EmployerPage = ({ active, children, topBarCta }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', minHeight: '100vh' }}>
    <ESidebar active={active}/>
    <main style={{ flex: 1, minWidth: 0 }}>
      <ETopBar cta={topBarCta}/>
      <div style={{ padding: '32px 32px 64px' }}>{children}</div>
    </main>
  </div>
);

Object.assign(window, { ESidebar, ETopBar, EmployerPage });
