/* Worker Dashboard — desktop web app (signed-in worker view) */
/* Sidebar / topbar live in worker-shell.jsx */

/* ── KPI tiles ── */
const KPI = ({ label, value, sub, accent }) => (
  <div style={{ flex: 1, padding: 20, borderRadius: 14, background: 'white', border: '1px solid var(--c-line)' }}>
    <div style={{ fontSize: 11.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 10 }}>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 38, lineHeight: 1, letterSpacing: '-0.03em', color: accent || 'var(--c-ink)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--c-ink-3)', paddingBottom: 6 }}>{sub}</div>}
    </div>
  </div>
);

/* ── Earnings sparkline ── */
const Spark = () => {
  const points = [40, 52, 38, 70, 60, 88, 72, 95, 80, 110, 96, 124];
  const max = Math.max(...points);
  const w = 260, h = 60;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (points.length - 1)) * w} ${h - (p / max) * h * 0.9 - 4}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <path d={path} stroke="var(--c-primary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="var(--c-primary)" opacity="0.08"/>
      {points.map((p, i) => i === points.length - 1 && (
        <circle key={i} cx={(i / (points.length - 1)) * w} cy={h - (p / max) * h * 0.9 - 4} r="4" fill="white" stroke="var(--c-primary)" strokeWidth="2"/>
      ))}
    </svg>
  );
};

/* ── Up-next shift hero ── */
const UpNextShift = () => (
  <div style={{ borderRadius: 18, padding: 24, background: 'var(--c-ink)', color: 'var(--c-bg)', position: 'relative', overflow: 'hidden' }}>
    <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 100% at 100% 0%, rgba(245,158,11,0.28), transparent 60%)' }}/>
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-accent)' }}>Tomorrow · 6:00 AM</div>
        <h2 style={{ margin: '8px 0 0', fontFamily: 'var(--f-display)', fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 400 }}>
          Grape Harvest at Sunridge Vineyards
        </h2>
        <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 13.5, color: 'rgba(250,250,248,0.75)', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={14}/> Madera County</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="cash" size={14}/> $22.50/hr + piece rate</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="truck" size={14}/> Pickup at Hwy 99 / Cleveland</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="users" size={14}/> Crew of 14</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button style={{ background: 'var(--c-accent)', color: 'var(--c-ink)', border: 0, borderRadius: 999, padding: '11px 18px', fontSize: 13.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Confirm shift <Icon name="check" size={13}/>
          </button>
          <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'var(--c-bg)', borderRadius: 999, padding: '11px 18px', fontSize: 13.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="pin" size={13}/> Directions
          </button>
          <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'var(--c-bg)', borderRadius: 999, padding: '11px 18px', fontSize: 13.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="phone" size={13}/> Call foreman
          </button>
        </div>
      </div>
      {/* Mini map / pin */}
      <div style={{ width: 220, height: 160, borderRadius: 14, background: 'linear-gradient(135deg, #2a3d2f, #1a2620)', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
        <svg viewBox="0 0 220 160" style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
          <path d="M0 80 Q 60 60, 110 80 T 220 80" stroke="rgba(245,158,11,0.4)" fill="none" strokeWidth="1.5"/>
          <path d="M0 110 Q 60 90, 110 110 T 220 110" stroke="rgba(245,158,11,0.25)" fill="none" strokeWidth="1.5"/>
          <path d="M0 50 Q 60 40, 110 60 T 220 50" stroke="rgba(245,158,11,0.2)" fill="none" strokeWidth="1.5"/>
          <line x1="40" y1="0" x2="40" y2="160" stroke="rgba(255,255,255,0.06)"/>
          <line x1="120" y1="0" x2="120" y2="160" stroke="rgba(255,255,255,0.06)"/>
          <line x1="180" y1="0" x2="180" y2="160" stroke="rgba(255,255,255,0.06)"/>
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '58%', transform: 'translate(-50%, -100%)', color: 'var(--c-accent)' }}>
          <Icon name="pin" size={24}/>
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: 12, fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em' }}>
          12 min · 8.4 mi
        </div>
      </div>
    </div>
  </div>
);

/* ── Applications pipeline (mini) ── */
const ApplicationsPanel = () => {
  const apps = [
    { stage: 'Accepted', crop: 'grape', title: 'Grape Harvest', employer: 'Sunridge Vineyards', date: 'Aug 12', pay: '$22.50' },
    { stage: 'Interview', crop: 'almond', title: 'Almond Shaking', employer: 'Westside Orchards', date: 'Aug 5', pay: '$24.00' },
    { stage: 'Reviewed', crop: 'tomato', title: 'Tomato Pick', employer: 'Río Verde Farms', date: 'Aug 18', pay: '$20.75' },
    { stage: 'Applied', crop: 'citrus', title: 'Orange Pruning', employer: 'Tulare Valley Citrus', date: 'Sep 2', pay: '$21.50' },
    { stage: 'Applied', crop: 'strawberry', title: 'Berry Pack', employer: 'Coastal Berry', date: 'Aug 9', pay: '$23.00' },
  ];
  const stageStyle = {
    Accepted:   { bg: '#DCFCE7', fg: '#166534' },
    Interview:  { bg: '#FEF3C7', fg: '#92400E' },
    Reviewed:   { bg: 'var(--c-primary-soft)', fg: 'var(--c-primary-deep)' },
    Applied:    { bg: 'var(--c-bg-warm)', fg: 'var(--c-ink-2)' },
  };
  return (
    <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', fontWeight: 400 }}>My applications</div>
          <div style={{ fontSize: 12, color: 'var(--c-ink-3)', marginTop: 2 }}>5 active · last sync 2m ago</div>
        </div>
        <a href="#" style={{ fontSize: 13, color: 'var(--c-primary)', textDecoration: 'none', fontWeight: 600 }}>View all →</a>
      </div>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.7fr 0.7fr 0.9fr 0.5fr', gap: 16, padding: '12px 20px', borderBottom: '1px solid var(--c-line)', fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Job</span><span>Employer</span><span>Start</span><span>Rate</span><span>Status</span><span/>
        </div>
        {apps.map((a, i) => {
          const s = stageStyle[a.stage];
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.7fr 0.7fr 0.9fr 0.5fr', gap: 16, padding: '14px 20px', borderBottom: i < apps.length - 1 ? '1px solid var(--c-line)' : '0', alignItems: 'center', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <CropGlyph crop={a.crop} size={20}/>
                </div>
                <div style={{ fontWeight: 600 }}>{a.title}</div>
              </div>
              <div style={{ color: 'var(--c-ink-2)' }}>{a.employer}</div>
              <div style={{ fontFamily: 'var(--f-mono)', fontWeight: 600 }}>{a.date}</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, letterSpacing: '-0.02em' }}>{a.pay}</div>
              <div>
                <span style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', fontWeight: 700, padding: '4px 9px', borderRadius: 999, background: s.bg, color: s.fg, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{a.stage}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Icon name="arrow" size={16} color="var(--c-ink-3)"/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Recommended jobs ── */
const RecommendedJobs = () => (
  <div>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', fontWeight: 400 }}>Matched for you</div>
        <div style={{ fontSize: 12.5, color: 'var(--c-ink-3)', marginTop: 2 }}>Based on your skills, location, and availability</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['All', 'Within 25 mi', 'This week', 'Pays >$22'].map((t,i) => (
          <span key={t} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 999, background: i === 0 ? 'var(--c-ink)' : 'white', color: i === 0 ? 'var(--c-bg)' : 'var(--c-ink-2)', border: i === 0 ? '0' : '1px solid var(--c-line)', fontWeight: 600, cursor: 'pointer' }}>{t}</span>
        ))}
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {JOBS.slice(1, 5).map(j => <JobCard key={j.id} job={j}/>)}
    </div>
  </div>
);

/* ── Right rail: availability + paycheck + training ── */
const AvailabilityCard = () => {
  const days = [
    ['M', 'Aug 4', 1], ['T', 'Aug 5', 1], ['W', 'Aug 6', 1],
    ['T', 'Aug 7', 1], ['F', 'Aug 8', 1], ['S', 'Aug 9', 0], ['S', 'Aug 10', 0],
  ];
  return (
    <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>This week</div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, letterSpacing: '-0.02em', fontWeight: 400, marginTop: 2 }}>Availability</div>
        </div>
        <button style={{ fontSize: 11.5, color: 'var(--c-primary)', background: 'transparent', border: 0, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 14 }}>
        {days.map(([d, dt, on], i) => (
          <div key={i} style={{
            paddingTop: 8, paddingBottom: 10, borderRadius: 8, textAlign: 'center',
            background: on ? 'var(--c-primary)' : 'var(--c-bg-warm)',
            color: on ? 'white' : 'var(--c-ink-3)',
          }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.06em', fontWeight: 700 }}>{d}</div>
            <div style={{ fontSize: 9.5, opacity: 0.8, marginTop: 2 }}>{on ? 'OPEN' : 'OFF'}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--c-ink-3)' }}>
        5 days open · 1 conflict on <strong style={{ color: 'var(--c-ink)' }}>Aug 7</strong> (training)
      </div>
    </div>
  );
};

const PaycheckCard = () => (
  <div style={{ background: 'var(--c-primary)', color: 'white', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
    <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(245,158,11,0.3), transparent 60%)' }}/>
    <div style={{ position: 'relative' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.75, fontWeight: 600 }}>Next paycheck</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 36, lineHeight: 1, letterSpacing: '-0.03em' }}>$1,124<span style={{ opacity: 0.6, fontSize: 18 }}>.50</span></div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>Friday</div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 13, fontWeight: 700 }}>Aug 8</div>
        </div>
      </div>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.18)', display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
        <div>
          <div style={{ opacity: 0.7 }}>Hours logged</div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--f-mono)' }}>49.5h</div>
        </div>
        <div>
          <div style={{ opacity: 0.7 }}>Piece rate bonus</div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--f-mono)' }}>+$112</div>
        </div>
        <div>
          <div style={{ opacity: 0.7 }}>Method</div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--f-mono)' }}>Direct</div>
        </div>
      </div>
      <button style={{ marginTop: 14, width: '100%', background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '9px', fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon name="download" size={13}/> View timesheet
      </button>
    </div>
  </div>
);

const TrainingNudge = () => (
  <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <Icon name="graduate" size={18} color="var(--c-primary)"/>
      <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>Boost your earnings</div>
    </div>
    <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, letterSpacing: '-0.02em', lineHeight: 1.2, fontWeight: 400 }}>
      Free Forklift cert opens <strong style={{ color: 'var(--c-primary)' }}>+$2.50/hr</strong> in your area
    </div>
    <div style={{ fontSize: 12.5, color: 'var(--c-ink-3)', marginTop: 8 }}>2 weeks · Reedley College · CDFA-funded</div>
    <button style={{ marginTop: 14, background: 'var(--c-ink)', color: 'var(--c-bg)', border: 0, borderRadius: 999, padding: '9px 14px', fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      Enroll free <Icon name="arrow" size={13}/>
    </button>
  </div>
);

const MessagesCard = () => {
  const msgs = [
    { from: 'Sunridge Vineyards', body: 'See you tomorrow at 6 AM. Bring water — it will be hot.', time: '2h', channel: 'WhatsApp' },
    { from: 'AGCONN', body: 'Your Forklift cert seat opens next Mon. Reply YES to claim.', time: '5h', channel: 'SMS' },
    { from: 'Westside Orchards', body: 'Interview scheduled for Thu 9 AM at the Modesto office.', time: '1d', channel: 'In-app' },
  ];
  return (
    <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14 }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, letterSpacing: '-0.02em', fontWeight: 400 }}>Messages</div>
        </div>
        <span style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, background: 'var(--c-accent)', color: 'var(--c-ink)', fontWeight: 700, fontFamily: 'var(--f-mono)' }}>3 NEW</span>
      </div>
      {msgs.map((m, i) => (
        <div key={i} style={{ padding: '12px 18px', borderBottom: i < msgs.length - 1 ? '1px solid var(--c-line)' : '0', display: 'flex', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--c-ink-2)' }}>
            {m.from[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{m.from}</div>
              <div style={{ fontSize: 10.5, color: 'var(--c-ink-3)', fontFamily: 'var(--f-mono)' }}>{m.channel} · {m.time}</div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--c-ink-2)', marginTop: 2, lineHeight: 1.4 }}>{m.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── Main page ── */
const WorkerDashboardPage = () => (
  <WorkerPage active="home">
    {/* Greeting */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <span className="section-num">Sunday, August 3 · Madera, CA</span>
            <h1 style={{ margin: '8px 0 0', fontFamily: 'var(--f-display)', fontSize: 'clamp(36px, 3.4vw, 52px)', letterSpacing: '-0.025em', fontWeight: 400, lineHeight: 1.05 }}>
              Buenas tardes, <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>Miguel</em>.
            </h1>
            <div style={{ fontSize: 14.5, color: 'var(--c-ink-2)', marginTop: 6 }}>You've got 1 shift tomorrow and 8 new matches in your area.</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>Earnings · 12 wk</div>
              <Spark/>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
          <KPI label="This week earned" value="$1,124" sub="+12% vs last week" accent="var(--c-primary)"/>
          <KPI label="Hours logged" value="49.5" sub="of 60 max"/>
          <KPI label="Active applications" value="5" sub="2 awaiting reply"/>
          <KPI label="Avg pay rate" value="$22.74" sub="ranks top 18% in county" accent="var(--c-accent-deep)"/>
        </div>

        {/* Up next */}
        <div style={{ marginBottom: 28 }}><UpNextShift/></div>

        {/* Two-column body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 22 }}>
          <div style={{ display: 'grid', gap: 22 }}>
            <RecommendedJobs/>
            <ApplicationsPanel/>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            <PaycheckCard/>
            <AvailabilityCard/>
            <TrainingNudge/>
            <MessagesCard/>
          </div>
        </div>
  </WorkerPage>
);

window.WorkerDashboardPage = WorkerDashboardPage;
