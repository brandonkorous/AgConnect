/* AgConnect — body sections: how-it-works, stats, app preview, features, training, testimonials, trust, partners, FAQ, CTA, footer */

/* ─────────────────────────── HOW IT WORKS ─────────────────────────── */
const HowItWorks = () => {
  const steps = [
    { n: '01', title: 'Tell us what you do', body: 'Pick crops, regions, and weeks you can work. Spanish or English — voice or tap.', icon: 'leaf' },
    { n: '02', title: 'Get matched by SMS', body: 'Verified jobs land in your inbox. No app required, no résumé needed.', icon: 'chat' },
    { n: '03', title: 'Apply with one reply', body: 'Reply YES. Employer sees your skills, references, and availability.', icon: 'check' },
    { n: '04', title: 'Show up. Get paid.', body: 'Wage transparency, on-time pay tracking, and dispute help if anything goes sideways.', icon: 'cash' },
  ];
  return (
    <section id="how-it-works" className="section" style={{ background: 'var(--c-bg-warm)', borderTop: '1px solid var(--c-line)', borderBottom: '1px solid var(--c-line)' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, marginBottom: 64, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 620 }}>
            <span className="section-num">§ 01 — How it works</span>
            <h2 className="h-section" style={{ marginTop: 16 }}>From signup to first <em>shift</em> in under a week.</h2>
          </div>
          <p className="lede" style={{ maxWidth: 380 }}>
            Designed around how the field actually communicates — text messages, group chats, word of mouth.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid var(--c-line-2)' }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{
              padding: '32px 28px 36px',
              borderRight: i < steps.length - 1 ? '1px solid var(--c-line-2)' : '0',
              position: 'relative',
              minHeight: 260,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--c-ink-3)', letterSpacing: '0.1em' }}>{s.n}</span>
                <Icon name={s.icon} size={22} color="var(--c-primary)"/>
              </div>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{s.title}</h3>
                <p style={{ margin: '12px 0 0', fontSize: 14.5, color: 'var(--c-ink-2)', lineHeight: 1.5 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────── STATS ─────────────────────────── */
const Stats = () => {
  const stats = [
    { v: '14,200+', l: 'Workers placed in the past 12 months', sub: 'across 9 Central Valley counties' },
    { v: '$38.4M', l: 'Wages routed through verified employers', sub: 'with same-week pay tracking' },
    { v: '94%', l: 'Worker trust score, vs. word-of-mouth hiring', sub: 'independent CDFA survey, 2025' },
    { v: '2.1 days', l: 'Median time from signup to first shift', sub: 'down from 11 days in 2023' },
  ];
  return (
    <section id="impact" className="section" style={{ background: 'var(--c-ink)', color: 'var(--c-bg)', position: 'relative', overflow: 'hidden' }}>
      <div className="grain" style={{ position: 'absolute', inset: 0 }}/>
      <div className="container" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, marginBottom: 64, flexWrap: 'wrap' }}>
          <div>
            <span className="section-num" style={{ color: 'rgba(250,250,248,0.5)' }}>§ 02 — Impact, year one</span>
            <h2 className="h-section" style={{ marginTop: 16, color: 'var(--c-bg)' }}>
              Real <em style={{ color: 'var(--c-accent)' }}>numbers</em>, not pilots.
            </h2>
          </div>
          <a href="#" style={{ color: 'var(--c-accent)', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            Read the 2025 impact report
            <Icon name="arrow-up-right" size={14}/>
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              padding: '28px 24px 0',
              borderLeft: '1px solid rgba(250,250,248,0.12)',
              borderRight: i === stats.length - 1 ? '1px solid rgba(250,250,248,0.12)' : '0',
            }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(48px, 5vw, 76px)', lineHeight: 1, letterSpacing: '-0.04em', color: 'var(--c-accent)' }}>{s.v}</div>
              <div style={{ marginTop: 20, fontSize: 14.5, fontWeight: 500, color: 'var(--c-bg)', maxWidth: 220, lineHeight: 1.35, minHeight: 60 }}>{s.l}</div>
              <div style={{ marginTop: 10, fontSize: 12.5, color: 'rgba(250,250,248,0.6)', lineHeight: 1.4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────── APP PREVIEW (live job feed) ─────────────────────────── */
const PhoneFrame = ({ children, lang = 'EN' }) => (
  <div style={{
    width: 300, borderRadius: 44, background: '#0A0A09',
    padding: 10, boxShadow: 'var(--shadow-hi)',
    border: '1px solid #2a2a26',
  }}>
    <div style={{
      borderRadius: 36, background: 'var(--c-bg)', overflow: 'hidden', position: 'relative',
      height: 580,
    }}>
      <div style={{
        height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 22px', fontSize: 11, fontWeight: 600, fontFamily: 'var(--f-mono)',
      }}>
        <span>9:41</span>
        <span style={{ width: 80, height: 22, background: '#0A0A09', borderRadius: 999, position: 'absolute', left: '50%', top: 6, transform: 'translateX(-50%)' }}/>
        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10 }}>5G</span>
          <span style={{ width: 18, height: 8, border: '1px solid currentColor', borderRadius: 2, padding: 1 }}>
            <span style={{ display: 'block', height: '100%', width: '70%', background: 'currentColor' }}/>
          </span>
        </span>
      </div>
      {children}
    </div>
  </div>
);

const AppPreview = () => {
  return (
    <section className="section" style={{ position: 'relative' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <PhoneFrame>
              <AppMockHome/>
            </PhoneFrame>
            <div style={{
              position: 'absolute', top: 40, right: 0,
              background: 'white', border: '1px solid var(--c-line)', borderRadius: 14,
              padding: '12px 14px', boxShadow: 'var(--shadow-pop)', fontSize: 12,
              maxWidth: 200, transform: 'rotate(3deg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div className="live-dot"/>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--c-ink-3)' }}>LIVE FEED</span>
              </div>
              <strong>87 new jobs</strong> posted in the last 24h
            </div>
            <div style={{
              position: 'absolute', bottom: 40, left: -10,
              background: 'var(--c-primary)', color: 'white', borderRadius: 14,
              padding: '12px 14px', boxShadow: 'var(--shadow-pop)', fontSize: 12,
              maxWidth: 220, transform: 'rotate(-3deg)',
            }}>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.08em', opacity: 0.7, marginBottom: 4 }}>WHATSAPP</div>
              "Tu turno empieza mañana 6 AM. Confirmar?"
            </div>
          </div>
          <div>
            <span className="section-num">§ 03 — The worker app</span>
            <h2 className="h-section" style={{ marginTop: 16 }}>
              A job <em>feed</em> that respects your time and your phone plan.
            </h2>
            <p className="lede" style={{ marginTop: 24 }}>
              Works offline. Loads on a 2009 Android. Bilingual from the first tap. Big buttons, real wages, no recruiter spam.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '32px 0 0', display: 'grid', gap: 14 }}>
              {[
                ['Honest pay shown up front', 'Hourly + piece rate, with overtime rules'],
                ['Map pin before you commit', 'Distance, housing, transport help'],
                ['One-tap apply by SMS or WhatsApp', 'No résumé. No email. No login wall.'],
                ['Work history travels with you', 'Verified by every employer you finish with'],
              ].map(([t, d]) => (
                <li key={t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--c-primary-soft)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Icon name="check" size={12} color="var(--c-primary)" stroke={2.4}/>
                  </span>
                  <span><strong style={{ fontWeight: 600 }}>{t}.</strong> <span style={{ color: 'var(--c-ink-2)' }}>{d}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const AppMockHome = () => (
  <div style={{ padding: '14px 18px 0', height: 'calc(100% - 32px)', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <Logo size={16}/>
      <div style={{ display: 'inline-flex', padding: 2, borderRadius: 999, background: 'rgba(28,28,26,0.07)', fontFamily: 'var(--f-mono)', fontSize: 9 }}>
        <span style={{ padding: '4px 8px', borderRadius: 999, background: 'var(--c-ink)', color: 'var(--c-bg)', fontWeight: 700 }}>EN</span>
        <span style={{ padding: '4px 8px', color: 'var(--c-ink-2)', fontWeight: 700 }}>ES</span>
      </div>
    </div>
    <div style={{ fontSize: 11, color: 'var(--c-ink-3)', fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Hola, Miguel</div>
    <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.02em' }}>14 jobs near you<br/>this week</div>
    <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {['All', 'Grapes', 'Almonds', 'Pack'].map((t,i) => (
        <span key={t} style={{
          fontSize: 10, padding: '5px 9px', borderRadius: 999,
          background: i === 0 ? 'var(--c-ink)' : 'transparent',
          color: i === 0 ? 'var(--c-bg)' : 'var(--c-ink-2)',
          border: i === 0 ? '0' : '1px solid var(--c-line)', fontWeight: 600,
        }}>{t}</span>
      ))}
    </div>
    <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
      {JOBS.slice(0,3).map(j => (
        <div key={j.id} style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center' }}>
              <CropGlyph crop={j.crop} size={20}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>{j.title}</div>
              <div style={{ fontSize: 10.5, color: 'var(--c-ink-3)' }}>{j.county} · {j.start}</div>
            </div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, letterSpacing: '-0.02em' }}>{j.pay.replace('/hr','')}</div>
          </div>
        </div>
      ))}
    </div>
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'white', borderTop: '1px solid var(--c-line)',
      display: 'flex', justifyContent: 'space-around', padding: '10px 0 18px',
    }}>
      {[['briefcase','Jobs',true],['graduate','Train',false],['users','Me',false],['chat','Alerts',false]].map(([i, l, a]) => (
        <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: a ? 'var(--c-primary)' : 'var(--c-ink-3)' }}>
          <Icon name={i === 'briefcase' ? 'kanban' : i} size={18}/>
          <span style={{ fontSize: 9.5, fontWeight: 600 }}>{l}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ─────────────────────────── FOR EMPLOYERS ─────────────────────────── */
const ForEmployers = () => {
  return (
    <section id="for-employers" className="section" style={{ background: 'var(--c-bg-warm)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 80, alignItems: 'center' }}>
          <div>
            <span className="section-num">§ 04 — For employers & growers</span>
            <h2 className="h-section" style={{ marginTop: 16 }}>
              Hire a <em>verified crew</em> before the weather turns.
            </h2>
            <p className="lede" style={{ marginTop: 24 }}>
              Post a job in three minutes. Filter by skill, equipment, and prior employer references. Manage your pipeline like the rest of your business — not on a clipboard.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              <a href="#cta" className="btn btn-accent">Post a job free<Icon name="arrow" size={14}/></a>
              <a href="#" className="btn btn-ghost">Book a demo</a>
            </div>
          </div>
          <DashboardMock/>
        </div>
      </div>
    </section>
  );
};

const DashboardMock = () => (
  <div style={{
    background: 'white', borderRadius: 20, border: '1px solid var(--c-line)',
    boxShadow: 'var(--shadow-hi)', overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--c-line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }}/>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }}/>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }}/>
      </div>
      <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--c-ink-3)' }}>app.agconnect.com/dashboard</div>
      <div style={{ width: 40 }}/>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', minHeight: 400 }}>
      <aside style={{ borderRight: '1px solid var(--c-line)', padding: '14px 12px', background: '#FBFAF5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--c-primary-soft)', marginBottom: 4 }}>
          <Icon name="kanban" size={14} color="var(--c-primary)"/>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-primary-deep)' }}>Pipeline</span>
        </div>
        {['Job postings', 'Crews', 'Payroll', 'Compliance', 'Reports'].map(l => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, fontSize: 12, color: 'var(--c-ink-2)' }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--c-line)' }}/>
            {l}
          </div>
        ))}
        <div style={{ marginTop: 24, padding: 10, borderRadius: 10, background: 'var(--c-bg-warm)', fontSize: 11, color: 'var(--c-ink-2)' }}>
          <strong style={{ display: 'block', fontSize: 11.5, color: 'var(--c-ink)' }}>Sunridge Vineyards</strong>
          Madera County
        </div>
      </aside>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--c-ink-3)', fontFamily: 'var(--f-mono)', letterSpacing: '0.08em' }}>JOB / GRP-0042</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>Grape Harvest Crew · 14 spots</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="chip" style={{ fontSize: 11, padding: '4px 10px' }}>Open</span>
            <span style={{ background: 'var(--c-ink)', color: 'var(--c-bg)', fontSize: 11, padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>+ Add stage</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { name: 'Applied', count: 28, color: 'var(--c-ink-3)' },
            { name: 'Reviewed', count: 12, color: '#B45309' },
            { name: 'Accepted', count: 9, color: 'var(--c-primary)' },
            { name: 'Declined', count: 4, color: 'var(--c-line-2)' },
          ].map(col => (
            <div key={col.name} style={{ background: '#FBFAF5', borderRadius: 10, padding: 8, minHeight: 240 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 8px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: col.color }}>{col.name}</span>
                <span style={{ fontSize: 10, color: 'var(--c-ink-3)', fontFamily: 'var(--f-mono)' }}>{col.count}</span>
              </div>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 8, padding: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: ['#E6F1ED','#FEF3C7','#FFE4C4','#F3EFE6'][i % 4], display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, color: 'var(--c-ink)' }}>{['M','J','A','R'][i % 4]}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600 }}>{['M. Reyes','J. Soto','A. Pérez','R. Lima'][i % 4]}</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--c-ink-3)', marginTop: 4 }}>4 yrs · grapes, almonds</div>
                  <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                    {['Forklift','Pruning'].map(t => (
                      <span key={t} style={{ fontSize: 8.5, padding: '2px 5px', borderRadius: 999, background: 'var(--c-bg-warm)', color: 'var(--c-ink-2)', fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────── TRAINING ─────────────────────────── */
const Training = () => {
  const programs = [
    { title: 'Forklift & Pallet Jack Cert', provider: 'Reedley College', skills: ['Forklift','OSHA-10','EN/ES'], dur: '2 weeks', cost: 'Free', funder: 'CDFA' },
    { title: 'Pesticide Handler License', provider: 'F3 Innovate', skills: ['QAL','Bilingual instructor'], dur: '3 days', cost: 'Free', funder: 'F3' },
    { title: 'Irrigation Tech Bootcamp', provider: 'West Hills Community', skills: ['Drip systems','Pumps'], dur: '4 weeks', cost: 'Free', funder: 'CDFA' },
    { title: 'Heat Illness & First Aid', provider: 'UFW Foundation', skills: ['Cal/OSHA','EN/ES'], dur: '1 day', cost: 'Free', funder: 'F3' },
  ];
  return (
    <section id="training" className="section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, marginBottom: 56, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 620 }}>
            <span className="section-num">§ 05 — Training & upskilling</span>
            <h2 className="h-section" style={{ marginTop: 16 }}>
              Free programs that <em>actually pay off</em> next season.
            </h2>
          </div>
          <p className="lede" style={{ maxWidth: 380 }}>
            Curated from CDFA, F3, and community colleges — every program is bilingual, paid for, and tied to real job listings on AgConnect.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {programs.map(p => (
            <div key={p.title} style={{
              background: 'white', border: '1px solid var(--c-line)', borderRadius: 'var(--r-md)',
              padding: 22, display: 'flex', flexDirection: 'column', minHeight: 280,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center' }}>
                  <Icon name="graduate" size={20} color="var(--c-primary)"/>
                </div>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 999, background: p.funder === 'CDFA' ? '#FEF3C7' : 'var(--c-primary-soft)', color: p.funder === 'CDFA' ? '#92400E' : 'var(--c-primary-deep)', fontWeight: 700 }}>
                  {p.funder}-FUNDED
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1, margin: '20px 0 6px' }}>{p.title}</h3>
              <div style={{ fontSize: 12.5, color: 'var(--c-ink-3)', marginBottom: 14 }}>{p.provider}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 'auto' }}>
                {p.skills.map(s => (
                  <span key={s} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'var(--c-bg-warm)', color: 'var(--c-ink-2)', fontWeight: 500 }}>{s}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, paddingTop: 14, borderTop: '1px solid var(--c-line)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>{p.dur}</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, color: 'var(--c-primary)', letterSpacing: '-0.02em' }}>{p.cost}</div>
                </div>
                <button style={{ background: 'var(--c-primary)', color: 'white', border: 0, borderRadius: 999, padding: '9px 14px', fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Enroll <Icon name="arrow" size={11}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────── TESTIMONIALS ─────────────────────────── */
const Testimonials = () => {
  const quotes = [
    { quote: 'I used to call five contratistas every morning. Now my week books itself by Sunday night.', name: 'Miguel R.', role: 'Pruning crew lead', loc: 'Madera County', avatar: '#E6F1ED', kind: 'worker' },
    { quote: 'We filled a 22-person tomato crew in 36 hours. Last year that took us three weeks and two recruiters.', name: 'Karen Vasquez', role: 'Operations Manager', loc: 'Río Verde Farms', avatar: '#FEF3C7', kind: 'employer' },
    { quote: 'Our forklift cert grads are getting hired the same week they finish. The placement loop just works.', name: 'Dr. Elena Cho', role: 'Workforce Director', loc: 'Reedley College', avatar: '#FFE4C4', kind: 'provider' },
  ];
  return (
    <section className="section" style={{ background: 'var(--c-primary)', color: 'white', position: 'relative' }}>
      <div className="container">
        <div style={{ marginBottom: 56 }}>
          <span className="section-num" style={{ color: 'rgba(255,255,255,0.6)' }}>§ 06 — Voices from the field</span>
          <h2 className="h-section" style={{ marginTop: 16, color: 'white', maxWidth: 820 }}>
            Built <em style={{ color: 'var(--c-accent)' }}>with</em> the people who already do this work.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {quotes.map((q, i) => (
            <figure key={i} style={{
              margin: 0, padding: 28, borderRadius: 'var(--r-lg)',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              display: 'flex', flexDirection: 'column', minHeight: 280,
            }}>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--c-accent)', textTransform: 'uppercase', marginBottom: 14 }}>
                {q.kind === 'worker' ? 'Worker' : q.kind === 'employer' ? 'Employer' : 'Training Partner'}
              </div>
              <blockquote style={{ margin: 0, fontFamily: 'var(--f-display)', fontSize: 22, lineHeight: 1.25, letterSpacing: '-0.015em', fontWeight: 400, color: 'white', flex: 1 }}>
                "{q.quote}"
              </blockquote>
              <figcaption style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: q.avatar, display: 'grid', placeItems: 'center', color: 'var(--c-ink)', fontWeight: 700, fontSize: 14 }}>
                  {q.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{q.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{q.role} · {q.loc}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────── TRUST & SAFETY ─────────────────────────── */
const Trust = () => {
  const items = [
    { icon: 'shield', title: 'Every employer is verified', body: 'Tax ID, contractor license, and field-visit confirmation before the first job posts.' },
    { icon: 'cash', title: 'Wages shown up front', body: 'Hourly + piece rate displayed before you apply. No surprise deductions, ever.' },
    { icon: 'badge', title: 'Your work history is yours', body: 'Verified shift records you can take to any employer, even off platform.' },
    { icon: 'phone', title: 'Live dispute support', body: 'Bilingual case workers reachable by SMS within 4 hours. Not a chatbot.' },
  ];
  return (
    <section className="section" style={{ borderTop: '1px solid var(--c-line)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'flex-start' }}>
          <div style={{ position: 'sticky', top: 100 }}>
            <span className="section-num">§ 07 — Trust & safety</span>
            <h2 className="h-section" style={{ marginTop: 16 }}>The boring parts <em>matter most</em>.</h2>
            <p className="lede" style={{ marginTop: 20, fontSize: 17 }}>
              We built AgConnect with worker advocates and grower associations — because trust is what keeps this thing alive.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid var(--c-line)', borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'white' }}>
            {items.map((it, i) => (
              <div key={it.title} style={{
                padding: 28,
                borderRight: i % 2 === 0 ? '1px solid var(--c-line)' : '0',
                borderBottom: i < 2 ? '1px solid var(--c-line)' : '0',
              }}>
                <Icon name={it.icon} size={26} color="var(--c-primary)"/>
                <h3 style={{ margin: '20px 0 8px', fontFamily: 'var(--f-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{it.title}</h3>
                <p style={{ margin: 0, fontSize: 14.5, color: 'var(--c-ink-2)', lineHeight: 1.5 }}>{it.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────── PARTNERS ─────────────────────────── */
const Partners = () => {
  const logos = ['CDFA', 'F3 Innovate', 'UFW Foundation', 'Reedley College', 'West Hills', 'Stanislaus County', 'Tulare AG', 'Río Verde'];
  return (
    <section style={{ padding: '60px 0', borderTop: '1px solid var(--c-line)', borderBottom: '1px solid var(--c-line)', background: 'var(--c-bg-warm)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span className="section-num">Partnered with the institutions that fund California agriculture</span>
        </div>
        <div style={{ overflow: 'hidden', position: 'relative' }}>
          <div style={{ display: 'flex', gap: 56, animation: 'marquee 30s linear infinite', width: 'max-content' }}>
            {[...logos, ...logos].map((l, i) => (
              <div key={i} style={{
                fontFamily: 'var(--f-display)', fontSize: 28, color: 'var(--c-ink-3)',
                fontStyle: 'italic', fontWeight: 300, letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────── FAQ ─────────────────────────── */
const FAQ = () => {
  const faqs = [
    { q: 'Does AgConnect cost workers anything?', a: "No. Workers never pay to find a job, get matched, take training, or use the app. Employer subscriptions and CDFA workforce grants cover the platform." },
    { q: "What if I don't have a smartphone?", a: 'Everything works over plain SMS. You can search jobs, apply, and confirm shifts without ever opening the app — and you can save the page on any browser as a PWA.' },
    { q: 'How do you verify employers?', a: 'Tax ID + contractor license, on-site visit by a partner organization, and a 90-day probation where worker reviews are weighted more heavily. Bad actors are removed.' },
    { q: 'Is my data shared with ICE or any federal agency?', a: "No. We don't collect immigration status. Worker records are encrypted and only released with the worker's explicit consent — not by subpoena, not by request." },
    { q: 'Which counties are covered today?', a: 'Madera, Fresno, Tulare, Kings, Stanislaus, Merced, San Joaquin, Yolo, and Monterey. Kern and Sutter coming summer 2026.' },
    { q: 'Can my training program list courses on AgConnect?', a: 'Yes — if your program is CDFA-eligible or F3-affiliated, you can apply to be listed in the training directory at no cost.' },
  ];
  const [open, setOpen] = React.useState(0);
  return (
    <section className="section">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 80, alignItems: 'flex-start' }}>
          <div>
            <span className="section-num">§ 08 — Common questions</span>
            <h2 className="h-section" style={{ marginTop: 16 }}>Things people <em>actually ask</em>.</h2>
            <p className="lede" style={{ marginTop: 20 }}>Don't see yours? Text us at <strong style={{ color: 'var(--c-ink)' }}>(559) 555-AGCO</strong> — bilingual reply within an hour.</p>
          </div>
          <div style={{ borderTop: '1px solid var(--c-line)' }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--c-line)' }}>
                <button onClick={() => setOpen(open === i ? -1 : i)} style={{
                  width: '100%', background: 'transparent', border: 0,
                  padding: '24px 0', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', textAlign: 'left', gap: 24,
                  fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--c-ink)',
                }}>
                  {f.q}
                  <span style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--c-line-2)', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'transform .2s', transform: open === i ? 'rotate(45deg)' : 'rotate(0)' }}>
                    <Icon name="plus" size={14}/>
                  </span>
                </button>
                <div style={{
                  maxHeight: open === i ? 200 : 0, overflow: 'hidden',
                  transition: 'max-height .3s ease, padding .3s ease',
                  paddingBottom: open === i ? 24 : 0,
                }}>
                  <p style={{ margin: 0, fontSize: 16, color: 'var(--c-ink-2)', maxWidth: 640, lineHeight: 1.55 }}>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────── CTA / install ─────────────────────────── */
const CTA = () => {
  const [phone, setPhone] = React.useState('');
  return (
    <section id="cta" className="section" style={{ background: 'var(--c-ink)', color: 'var(--c-bg)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(245,158,11,0.18), transparent 60%)' }}/>
      <div className="container" style={{ position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <span className="section-num" style={{ color: 'rgba(250,250,248,0.5)' }}>§ 09 — Get started</span>
            <h2 className="h-section" style={{ marginTop: 16, color: 'var(--c-bg)' }}>
              Text <em style={{ color: 'var(--c-accent)' }}>WORK</em> to (559) 555-AGCO.<br/>That's it.
            </h2>
            <p className="lede" style={{ marginTop: 24, color: 'rgba(250,250,248,0.75)', fontSize: 19 }}>
              We'll text back in English or Spanish, ask three questions, and start matching jobs the same day. Or install the PWA — it works offline and weighs less than 2 MB.
            </p>
            <form onSubmit={e => e.preventDefault()} style={{ marginTop: 32, display: 'flex', gap: 8, maxWidth: 520, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 10px 0 16px', color: 'rgba(250,250,248,0.6)', fontSize: 14 }}>
                <Icon name="phone" size={16}/> +1
              </span>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(559) 555 0123" style={{
                flex: 1, background: 'transparent', border: 0, color: 'var(--c-bg)', fontSize: 16,
                fontFamily: 'inherit', outline: 'none', padding: '12px 0',
              }}/>
              <button type="submit" style={{ background: 'var(--c-accent)', color: 'var(--c-ink)', border: 0, borderRadius: 999, padding: '12px 22px', fontSize: 14.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Send me jobs <Icon name="arrow" size={14}/>
              </button>
            </form>
            <div style={{ marginTop: 18, fontSize: 12.5, color: 'rgba(250,250,248,0.5)' }}>
              Free. We'll never sell your number. Reply STOP anytime.
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <InstallCard/>
          </div>
        </div>
      </div>
    </section>
  );
};

const InstallCard = () => (
  <div style={{
    background: 'var(--c-bg)', color: 'var(--c-ink)', borderRadius: 'var(--r-xl)',
    padding: 28, width: 360, boxShadow: 'var(--shadow-hi)', position: 'relative',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--c-primary)', display: 'grid', placeItems: 'center' }}>
        <Logo size={14} mono/>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>AgConnect</div>
        <div style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>agconnect.com · PWA</div>
      </div>
      <button style={{ marginLeft: 'auto', background: 'var(--c-ink)', color: 'var(--c-bg)', border: 0, borderRadius: 999, padding: '8px 14px', fontSize: 12.5, fontWeight: 600 }}>
        Install
      </button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div style={{ padding: 14, borderRadius: 12, background: 'var(--c-bg-warm)' }}>
        <Icon name="qr" size={20} color="var(--c-ink)"/>
        <div style={{ fontSize: 11, color: 'var(--c-ink-3)', marginTop: 6 }}>Scan to install</div>
      </div>
      <div style={{ padding: 14, borderRadius: 12, background: 'var(--c-primary-soft)' }}>
        <Icon name="download" size={20} color="var(--c-primary)"/>
        <div style={{ fontSize: 11, color: 'var(--c-primary-deep)', marginTop: 6, fontWeight: 600 }}>1.7 MB · works offline</div>
      </div>
    </div>
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--c-line)', display: 'flex', gap: 10 }}>
      <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: '#E6F1ED', color: 'var(--c-primary-deep)', fontWeight: 600 }}>Android 5+</span>
      <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>iOS 14+</span>
      <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: 'var(--c-bg-warm)', color: 'var(--c-ink-2)', fontWeight: 600 }}>SMS fallback</span>
    </div>
  </div>
);

/* ─────────────────────────── FOOTER ─────────────────────────── */
const Footer = () => {
  const cols = [
    { h: 'For Workers · Para Trabajadores', l: ['Find a job · Buscar trabajo', 'Training programs', 'Get paid faster', 'Worker rights', 'Help via SMS'] },
    { h: 'For Employers', l: ['Post a job', 'Pricing', 'Compliance & I-9', 'Payroll integrations', 'Book a demo'] },
    { h: 'Programs', l: ['CDFA workforce grants', 'F3 Innovate', 'County partners', 'List your training', 'Research & data'] },
    { h: 'Company', l: ['About AgConnect', 'Impact report', 'Press', 'Careers', 'Contact'] },
  ];
  return (
    <footer style={{ background: 'var(--c-bg-warm)', borderTop: '1px solid var(--c-line)', padding: '80px 0 40px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 40, marginBottom: 64 }}>
          <div>
            <Logo size={24}/>
            <p style={{ fontSize: 14, color: 'var(--c-ink-2)', marginTop: 16, maxWidth: 280, lineHeight: 1.55 }}>
              Bilingual workforce infrastructure for California agriculture. A public-benefit company headquartered in Fresno, CA.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <LangToggle/>
            </div>
          </div>
          {cols.map(c => (
            <div key={c.h}>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--c-ink-3)', textTransform: 'uppercase', marginBottom: 14 }}>{c.h}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                {c.l.map(item => (
                  <li key={item}><a href="#" style={{ fontSize: 14, color: 'var(--c-ink-2)', textDecoration: 'none' }}>{item}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid var(--c-line)', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 12.5, color: 'var(--c-ink-3)' }}>
            © 2026 AgConnect PBC · Fresno, CA · Made with the United Farm Workers Foundation
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 12.5, color: 'var(--c-ink-3)' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Accessibility</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>SMS terms</a>
          </div>
        </div>
        {/* Big wordmark */}
        <div style={{ marginTop: 60, fontFamily: 'var(--f-display)', fontSize: 'clamp(80px, 16vw, 220px)', lineHeight: 0.9, letterSpacing: '-0.04em', color: 'var(--c-primary)', opacity: 0.18, textAlign: 'center' }}>
          AgConnect
        </div>
      </div>
    </footer>
  );
};

Object.assign(window, { HowItWorks, Stats, AppPreview, ForEmployers, Training, Testimonials, Trust, Partners, FAQ, CTA, Footer });
