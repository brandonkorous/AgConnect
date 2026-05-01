/* Employer Dashboard — Sunridge Vineyards (hiring side) */

const EKPI = ({ label, value, sub, accent, delta }) => (
  <div style={{ flex: 1, padding: 20, borderRadius: 14, background: 'white', border: '1px solid var(--c-line)' }}>
    <div style={{ fontSize: 11.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 10 }}>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 38, lineHeight: 1, letterSpacing: '-0.03em', color: accent || 'var(--c-ink)' }}>{value}</div>
      {delta && <div style={{ fontSize: 11.5, color: delta.startsWith('+') ? 'var(--c-primary)' : '#B45309', paddingBottom: 6, fontFamily: 'var(--f-mono)', fontWeight: 700 }}>{delta}</div>}
    </div>
    {sub && <div style={{ fontSize: 12, color: 'var(--c-ink-3)', marginTop: 6 }}>{sub}</div>}
  </div>
);

/* ── Hero: tomorrow's crew ── */
const TomorrowCrew = () => (
  <div style={{ borderRadius: 18, padding: 24, background: 'var(--c-ink)', color: 'var(--c-bg)', position: 'relative', overflow: 'hidden' }}>
    <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 100% at 100% 0%, rgba(245,158,11,0.28), transparent 60%)' }}/>
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-accent)' }}>Tomorrow · 6:00 AM · Block 7-North</div>
        <h2 style={{ margin: '8px 0 0', fontFamily: 'var(--f-display)', fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 400 }}>
          Grape Harvest crew of 14 — <em style={{ fontStyle: 'italic', color: 'var(--c-accent)', fontWeight: 300 }}>13 confirmed</em>
        </h2>
        <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 13.5, color: 'rgba(250,250,248,0.75)', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="users" size={14}/> 14 spots filled / 14</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="cash" size={14}/> $22.50/hr + piece rate</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="truck" size={14}/> Pickup 5:30 AM Hwy 99</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="badge" size={14}/> Foreman: M. Vargas</span>
        </div>
        <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: i < 13 ? 'var(--c-primary)' : 'rgba(255,255,255,0.1)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'var(--f-mono)', border: i < 13 ? '0' : '1px dashed rgba(255,255,255,0.3)' }}>
              {i < 13 ? ['MR','CR','SS','BV','LP','JN','RA','PE','AC','MM','TG','HV','DR'][i] : '?'}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button style={{ background: 'var(--c-accent)', color: 'var(--c-ink)', border: 0, borderRadius: 999, padding: '11px 18px', fontSize: 13.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            Fill last spot <Icon name="plus" size={13}/>
          </button>
          <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'var(--c-bg)', borderRadius: 999, padding: '11px 18px', fontSize: 13.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <Icon name="chat" size={13}/> Message crew
          </button>
        </div>
      </div>
      {/* Block map */}
      <div style={{ width: 220, height: 200, borderRadius: 14, background: 'linear-gradient(135deg, #2a3d2f, #1a2620)', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
        <svg viewBox="0 0 220 200" style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
          {Array.from({ length: 8 }).map((_, i) => <line key={i} x1="0" y1={25 + i * 22} x2="220" y2={25 + i * 22} stroke="rgba(245,158,11,0.25)" strokeWidth="1"/>)}
        </svg>
        <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em' }}>BLOCK 7-NORTH · 12.4 ACRES</div>
        <div style={{ position: 'absolute', bottom: 14, left: 14, color: 'var(--c-accent)' }}>
          <Icon name="pin" size={20}/>
        </div>
        <div style={{ position: 'absolute', bottom: 14, right: 14, fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'rgba(255,255,255,0.6)' }}>~3 days</div>
      </div>
    </div>
  </div>
);

/* ── Active jobs board ── */
const ActiveJobsBoard = () => {
  const jobs = [
    { crop: 'grape', title: 'Grape Harvest', filled: 14, total: 14, applied: 38, days: '2 days posted', status: 'Filled', urgency: 'success' },
    { crop: 'grape', title: 'Vineyard Setup Crew', filled: 6, total: 8, applied: 14, days: 'Posted today', status: '2 spots open', urgency: 'warning' },
    { crop: 'almond', title: 'Almond Pre-shake', filled: 3, total: 12, applied: 19, days: '4 days posted', status: '9 spots open', urgency: 'danger' },
    { crop: 'grape', title: 'Sort Line — Day shift', filled: 8, total: 8, applied: 22, days: '1 week posted', status: 'Filled', urgency: 'success' },
  ];
  const tones = {
    success: { bg: '#DCFCE7', fg: '#166534' },
    warning: { bg: '#FEF3C7', fg: '#92400E' },
    danger:  { bg: '#FEE2E2', fg: '#991B1B' },
  };
  return (
    <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', fontWeight: 400 }}>Active job postings</div>
          <div style={{ fontSize: 12, color: 'var(--c-ink-3)', marginTop: 2 }}>4 open · 47 applicants this week</div>
        </div>
        <a href="AgConnect Employer Jobs.html" style={{ fontSize: 13, color: 'var(--c-primary)', textDecoration: 'none', fontWeight: 600 }}>Manage all →</a>
      </div>
      {jobs.map((j, i) => {
        const t = tones[j.urgency];
        const pct = (j.filled / j.total) * 100;
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.9fr 0.8fr 0.6fr', gap: 16, padding: '16px 20px', borderBottom: i < jobs.length - 1 ? '1px solid var(--c-line)' : '0', alignItems: 'center', fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center' }}>
                <CropGlyph crop={j.crop} size={22}/>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{j.title}</div>
                <div style={{ fontSize: 11, color: 'var(--c-ink-3)', marginTop: 2 }}>{j.days} · {j.applied} applicants</div>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{j.filled}/{j.total} filled</div>
              <div style={{ height: 6, background: 'var(--c-bg-warm)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--c-primary)' : pct > 50 ? 'var(--c-accent)' : '#C73E2A' }}/>
              </div>
            </div>
            <div>
              <span style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', fontWeight: 700, padding: '4px 9px', borderRadius: 999, background: t.bg, color: t.fg, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{j.status}</span>
            </div>
            <div>
              <button style={{ background: 'transparent', border: '1px solid var(--c-line)', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Review {j.applied}</button>
            </div>
            <div style={{ textAlign: 'right' }}><Icon name="arrow" size={16} color="var(--c-ink-3)"/></div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Pipeline (Kanban) ── */
const HiringPipeline = () => {
  const cols = [
    { l: 'New applicants', n: 18, color: 'var(--c-bg-warm)', cards: [
      { name: 'Soledad Saavedra', role: 'Almond Pre-shake', match: 94, init: 'SS' },
      { name: 'Beto Villalobos', role: 'Sort Line', match: 89, init: 'BV' },
      { name: 'Lupita Pérez', role: 'Almond Pre-shake', match: 86, init: 'LP' },
    ]},
    { l: 'Reviewed', n: 12, color: 'var(--c-primary-soft)', cards: [
      { name: 'Joaquín Núñez', role: 'Almond Pre-shake', match: 92, init: 'JN' },
      { name: 'Rosa Aguilar', role: 'Vineyard Setup', match: 88, init: 'RA' },
    ]},
    { l: 'Interview', n: 4, color: '#FEF3C7', cards: [
      { name: 'Pedro Estrella', role: 'Almond Pre-shake', match: 96, init: 'PE', when: 'Thu 9 AM' },
      { name: 'Ana Castillo', role: 'Vineyard Setup', match: 91, init: 'AC', when: 'Fri 10 AM' },
    ]},
    { l: 'Offer / Hired', n: 13, color: '#DCFCE7', cards: [
      { name: 'Miguel Reyes', role: 'Grape Harvest', match: 98, init: 'MR', accepted: true },
      { name: 'Carmen Rojas', role: 'Grape Harvest', match: 95, init: 'CR', accepted: true },
    ]},
  ];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', fontWeight: 400 }}>Hiring pipeline</div>
          <div style={{ fontSize: 12.5, color: 'var(--c-ink-3)', marginTop: 2 }}>Drag candidates between stages · 47 active</div>
        </div>
        <a href="AgConnect Employer Candidates.html" style={{ fontSize: 13, color: 'var(--c-primary)', textDecoration: 'none', fontWeight: 600 }}>Open full pipeline →</a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {cols.map((c, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 12, padding: 12, minHeight: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 12px', borderBottom: '1px solid var(--c-line)', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }}/>
                <span style={{ fontSize: 11.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--c-ink-2)' }}>{c.l}</span>
              </div>
              <span style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-ink-3)' }}>{c.n}</span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {c.cards.map((card, j) => (
                <div key={j} style={{ padding: 10, borderRadius: 8, background: 'var(--c-bg-warm)', border: '1px solid var(--c-line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: card.accepted ? 'var(--c-primary)' : 'var(--c-ink)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'var(--f-mono)', flexShrink: 0 }}>{card.init}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{card.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--c-ink-3)', marginTop: 1 }}>{card.role}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: 'var(--c-primary)', fontWeight: 700 }}>{card.match}% match</span>
                    {card.when && <span style={{ fontSize: 10, color: 'var(--c-accent-deep)', fontWeight: 700 }}>{card.when}</span>}
                    {card.accepted && <span style={{ fontSize: 10, color: 'var(--c-primary-deep)', fontWeight: 700 }}>✓ Accepted</span>}
                  </div>
                </div>
              ))}
              {c.n > c.cards.length && (
                <div style={{ padding: '8px 10px', fontSize: 11.5, color: 'var(--c-ink-3)', textAlign: 'center', fontFamily: 'var(--f-mono)' }}>+ {c.n - c.cards.length} more</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Right rail ── */
const PayrollSnapshot = () => (
  <div style={{ background: 'var(--c-primary)', color: 'white', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
    <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(245,158,11,0.3), transparent 60%)' }}/>
    <div style={{ position: 'relative' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.75, fontWeight: 600 }}>Payroll runs Friday Aug 8</div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 36, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 10 }}>$28,492<span style={{ opacity: 0.6, fontSize: 18 }}>.40</span></div>
      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>26 workers · 1,187 hours · this week</div>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.18)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 11.5 }}>
        <div><div style={{ opacity: 0.7 }}>Gross</div><div style={{ fontWeight: 700, fontFamily: 'var(--f-mono)' }}>$33,210</div></div>
        <div><div style={{ opacity: 0.7 }}>Taxes</div><div style={{ fontWeight: 700, fontFamily: 'var(--f-mono)' }}>−$4,718</div></div>
        <div><div style={{ opacity: 0.7 }}>Status</div><div style={{ fontWeight: 700, fontFamily: 'var(--f-mono)' }}>Approved</div></div>
      </div>
      <button style={{ marginTop: 14, width: '100%', background: 'rgba(255,255,255,0.14)', color: 'white', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999, padding: '9px', fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
        <Icon name="check" size={13}/> Run payroll
      </button>
    </div>
  </div>
);

const ComplianceCard = () => (
  <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>Compliance</div>
      <span style={{ fontSize: 10, fontFamily: 'var(--f-mono)', fontWeight: 700, padding: '3px 7px', borderRadius: 999, background: '#FEF3C7', color: '#92400E', letterSpacing: '0.06em' }}>2 ACTIONS</span>
    </div>
    <div style={{ fontFamily: 'var(--f-display)', fontSize: 32, letterSpacing: '-0.02em', marginTop: 10, color: 'var(--c-primary)' }}>96<span style={{ fontSize: 18, opacity: 0.5 }}>%</span></div>
    <div style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>Documentation completeness</div>
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--c-line)', display: 'grid', gap: 8 }}>
      {[
        { l: 'WPS training current for all crew', ok: true },
        { l: 'Heat illness plan posted', ok: true },
        { l: '2 I-9s expiring within 30 days', ok: false },
        { l: 'Pesticide records up to date', ok: true },
      ].map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: c.ok ? 'var(--c-primary-soft)' : '#FEE2E2', color: c.ok ? 'var(--c-primary)' : '#991B1B', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name={c.ok ? 'check' : 'minus'} size={10}/>
          </div>
          <span style={{ color: c.ok ? 'var(--c-ink-2)' : 'var(--c-ink)' }}>{c.l}</span>
        </div>
      ))}
    </div>
  </div>
);

const TopApplicantsCard = () => (
  <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14 }}>
    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, letterSpacing: '-0.02em', fontWeight: 400 }}>Top new applicants</div>
      <span style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, background: 'var(--c-accent)', color: 'var(--c-ink)', fontWeight: 700, fontFamily: 'var(--f-mono)' }}>18 NEW</span>
    </div>
    {[
      { n: 'Pedro Estrella', r: 'Almond Pre-shake · 5 yr exp', m: 96, init: 'PE' },
      { n: 'Soledad Saavedra', r: 'Sort Line · forklift cert', m: 94, init: 'SS' },
      { n: 'Joaquín Núñez', r: 'Almond Pre-shake · 8 yr exp', m: 92, init: 'JN' },
      { n: 'Rosa Aguilar', r: 'Vineyard Setup · ref. checked', m: 88, init: 'RA' },
    ].map((a, i, arr) => (
      <div key={i} style={{ padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--c-line)' : '0', display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--c-bg-warm)', color: 'var(--c-ink-2)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, fontFamily: 'var(--f-mono)' }}>{a.init}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{a.n}</div>
          <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 1 }}>{a.r}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-primary)', fontFamily: 'var(--f-mono)' }}>{a.m}%</div>
          <div style={{ fontSize: 10, color: 'var(--c-ink-3)' }}>match</div>
        </div>
      </div>
    ))}
  </div>
);

/* ── Page ── */
const EmployerDashboardPage = () => (
  <EmployerPage active="home">
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
      <div>
        <span className="section-num">Sunday, August 3 · Madera, CA · Sunridge Vineyards</span>
        <h1 style={{ margin: '8px 0 0', fontFamily: 'var(--f-display)', fontSize: 'clamp(36px, 3.4vw, 52px)', letterSpacing: '-0.025em', fontWeight: 400, lineHeight: 1.05 }}>
          Good evening, <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>Elena</em>.
        </h1>
        <div style={{ fontSize: 14.5, color: 'var(--c-ink-2)', marginTop: 6 }}>4 jobs open · 18 new applicants today · 1 spot left to fill for tomorrow's crew.</div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <Icon name="download" size={14}/> Weekly report
        </button>
        <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
          <Icon name="plus" size={14}/> Post new job
        </button>
      </div>
    </div>

    {/* KPIs */}
    <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
      <EKPI label="Open positions" value="4" sub="across 8 active postings"/>
      <EKPI label="Spots remaining" value="11" sub="of 42 needed this week" accent="var(--c-accent-deep)" delta="-7"/>
      <EKPI label="Applicants · 7 days" value="47" sub="from 92 reach-outs" accent="var(--c-primary)" delta="+12"/>
      <EKPI label="Time-to-fill" value="2.4d" sub="county avg: 6.1 days" accent="var(--c-primary)" delta="-1.1d"/>
    </div>

    <div style={{ marginBottom: 28 }}><TomorrowCrew/></div>

    <div style={{ marginBottom: 28 }}><HiringPipeline/></div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 22 }}>
      <div style={{ display: 'grid', gap: 22 }}>
        <ActiveJobsBoard/>
      </div>
      <div style={{ display: 'grid', gap: 14 }}>
        <PayrollSnapshot/>
        <ComplianceCard/>
        <TopApplicantsCard/>
      </div>
    </div>
  </EmployerPage>
);

window.EmployerDashboardPage = EmployerDashboardPage;
