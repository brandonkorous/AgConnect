/* All 7 sidebar destination pages — share WorkerPage shell */

/* ─────────────────────── Shared atoms ─────────────────────── */
const Card = ({ children, style, ...rest }) => (
  <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, ...style }} {...rest}>
    {children}
  </div>
);

const Eyebrow = ({ children, style }) => (
  <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.12em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600, ...style }}>{children}</div>
);

const Pill = ({ children, tone = 'ghost', style }) => {
  const tones = {
    ghost:    { bg: 'var(--c-bg-warm)', fg: 'var(--c-ink-2)' },
    primary:  { bg: 'var(--c-primary-soft)', fg: 'var(--c-primary-deep)' },
    ink:      { bg: 'var(--c-ink)', fg: 'var(--c-bg)' },
    accent:   { bg: 'var(--c-accent)', fg: 'var(--c-ink)' },
    success:  { bg: '#DCFCE7', fg: '#166534' },
    warning:  { bg: '#FEF3C7', fg: '#92400E' },
    danger:   { bg: '#FEE2E2', fg: '#991B1B' },
    outline:  { bg: 'white', fg: 'var(--c-ink-2)', border: '1px solid var(--c-line)' },
  };
  const s = tones[tone] || tones.ghost;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontFamily: 'var(--f-mono)', fontWeight: 700, padding: '4px 9px', borderRadius: 999, background: s.bg, color: s.fg, border: s.border, letterSpacing: '0.06em', textTransform: 'uppercase', ...style }}>{children}</span>;
};

const StatTile = ({ label, value, sub, accent }) => (
  <Card style={{ padding: 18, flex: 1, minWidth: 0 }}>
    <Eyebrow>{label}</Eyebrow>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 8 }}>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 32, lineHeight: 1, letterSpacing: '-0.025em', color: accent || 'var(--c-ink)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', paddingBottom: 4 }}>{sub}</div>}
    </div>
  </Card>
);

const SectionHeading = ({ children, sub, right }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
    <div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', fontWeight: 400 }}>{children}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--c-ink-3)', marginTop: 2 }}>{sub}</div>}
    </div>
    {right}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   1) BROWSE JOBS
═══════════════════════════════════════════════════════════════ */
const BrowseJobsPage = () => {
  const filters = ['Within 25 mi', 'This week', 'Pays >$22', 'Has housing', 'Pickup provided', 'No experience'];
  const crops = [
    { c: 'grape', l: 'Grapes', n: 38 }, { c: 'almond', l: 'Almonds', n: 24 },
    { c: 'tomato', l: 'Tomatoes', n: 19 }, { c: 'citrus', l: 'Citrus', n: 31 },
    { c: 'strawberry', l: 'Berries', n: 12 }, { c: 'lettuce', l: 'Lettuce', n: 18 },
  ];
  return (
    <WorkerPage active="jobs">
      <PageHeader
        eyebrow="142 open jobs · within 50 mi of Madera, CA"
        title={<>Find your next <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>shift</em>.</>}
        sub="We surface jobs that fit your skills, distance, and weekly availability first. Verified employers only."
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Icon name="pin" size={14}/> Map view
            </button>
            <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
              <Icon name="spark" size={14}/> Save this search
            </button>
          </div>
        }
      />

      {/* Filter bar */}
      <Card style={{ padding: '12px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--c-ink-3)', fontFamily: 'var(--f-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, paddingRight: 6 }}>Filters</span>
        {filters.map((f, i) => (
          <span key={f} style={{ fontSize: 12.5, padding: '6px 12px', borderRadius: 999, background: i < 2 ? 'var(--c-ink)' : 'var(--c-bg-warm)', color: i < 2 ? 'var(--c-bg)' : 'var(--c-ink-2)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {i < 2 && <Icon name="check" size={12}/>}
            {f}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--c-ink-3)' }}>Sort: <strong style={{ color: 'var(--c-ink)' }}>Best match</strong> ▾</span>
      </Card>

      {/* Crop chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, overflowX: 'auto', paddingBottom: 4 }}>
        {crops.map(({ c, l, n }) => (
          <Card key={c} style={{ padding: '12px 16px', minWidth: 140, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <CropGlyph crop={c} size={22}/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 11, color: 'var(--c-ink-3)', fontFamily: 'var(--f-mono)' }}>{n} open</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Jobs grid + side panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22 }}>
        <div>
          <SectionHeading sub="Updated 4 minutes ago"
            right={<span style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>Showing 1–8 of <strong style={{ color: 'var(--c-ink)' }}>142</strong></span>}>
            Top matches
          </SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {JOBS.map(j => <JobCard key={j.id} job={j}/>)}
            {JOBS.slice(0, 3).map(j => <JobCard key={`x${j.id}`} job={{ ...j, id: `x${j.id}` }}/>)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button style={{ background: 'white', border: '1px solid var(--c-line-2)', borderRadius: 999, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Load 16 more →</button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14, alignContent: 'flex-start' }}>
          <Card style={{ padding: 18, background: 'var(--c-ink)', color: 'var(--c-bg)', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 100% at 100% 0%, rgba(245,158,11,0.22), transparent 60%)' }}/>
            <div style={{ position: 'relative' }}>
              <Eyebrow style={{ color: 'var(--c-accent)' }}>SMS apply</Eyebrow>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1.2 }}>Text <strong style={{ color: 'var(--c-accent)' }}>JOB</strong> to <strong style={{ fontFamily: 'var(--f-mono)' }}>(559) 555-0142</strong></div>
              <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 8 }}>You'll get the 3 best matches for your area sent right to your phone — no app, no signup.</div>
            </div>
          </Card>

          <Card style={{ padding: 18 }}>
            <Eyebrow>Map preview</Eyebrow>
            <div style={{ marginTop: 12, height: 220, borderRadius: 10, background: 'linear-gradient(135deg, #f0ead8, #e5dec5)', border: '1px solid var(--c-line)', position: 'relative', overflow: 'hidden' }}>
              <svg viewBox="0 0 300 220" style={{ position: 'absolute', inset: 0 }}>
                <path d="M0 100 Q 80 70, 150 90 T 300 80" stroke="var(--c-primary)" strokeWidth="1" fill="none" opacity="0.3"/>
                <path d="M0 140 Q 80 110, 150 130 T 300 120" stroke="var(--c-primary)" strokeWidth="1" fill="none" opacity="0.2"/>
                <path d="M30 0 L 30 220 M 110 0 L 110 220 M 200 0 L 200 220" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5"/>
              </svg>
              {[
                { x: 32, y: 38, n: 4 }, { x: 60, y: 70, n: 12 }, { x: 48, y: 130, n: 7 },
                { x: 78, y: 165, n: 3 }, { x: 56, y: 100, n: 24, big: true },
              ].map((p, i) => (
                <div key={i} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)', background: p.big ? 'var(--c-ink)' : 'var(--c-primary)', color: p.big ? 'var(--c-accent)' : 'white', padding: p.big ? '6px 10px' : '4px 8px', borderRadius: 999, fontFamily: 'var(--f-mono)', fontSize: p.big ? 13 : 11, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{p.n}</div>
              ))}
              <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)' }}>Madera Co.</div>
            </div>
            <button style={{ marginTop: 12, width: '100%', background: 'transparent', border: '1px solid var(--c-line-2)', borderRadius: 999, padding: '9px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Open full map →</button>
          </Card>

          <Card style={{ padding: 18 }}>
            <Eyebrow>Saved searches</Eyebrow>
            {[
              { name: 'Grape harvest · Madera', hits: 12 },
              { name: 'Pays >$22 · Within 25 mi', hits: 28 },
              { name: 'Has housing · Statewide', hits: 47 },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--c-line)' : '0' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-ink-3)', fontFamily: 'var(--f-mono)' }}>{s.hits} new this week</div>
                </div>
                <Icon name="arrow" size={14} color="var(--c-ink-3)"/>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </WorkerPage>
  );
};

/* ═══════════════════════════════════════════════════════════════
   2) MY APPLICATIONS — full pipeline
═══════════════════════════════════════════════════════════════ */
const ApplicationsPage = () => {
  const stages = [
    { k: 'applied',   l: 'Applied',   n: 2, color: 'var(--c-bg-warm)' },
    { k: 'reviewed',  l: 'Reviewed',  n: 1, color: 'var(--c-primary-soft)' },
    { k: 'interview', l: 'Interview', n: 1, color: '#FEF3C7' },
    { k: 'accepted',  l: 'Accepted',  n: 1, color: '#DCFCE7' },
  ];
  const apps = [
    { stage: 'accepted',  crop: 'grape',      title: 'Grape Harvest',         employer: 'Sunridge Vineyards',     date: 'Aug 12', pay: '$22.50', appliedOn: 'Jul 28', spots: 14, action: 'Confirm shift' },
    { stage: 'interview', crop: 'almond',     title: 'Almond Shaking Crew',   employer: 'Westside Orchards',      date: 'Aug 5',  pay: '$24.00', appliedOn: 'Jul 26', spots: 6,  action: 'Join interview' },
    { stage: 'reviewed',  crop: 'tomato',     title: 'Cannery Tomato Pick',   employer: 'Río Verde Farms',        date: 'Aug 18', pay: '$20.75', appliedOn: 'Jul 30', spots: 22, action: 'Send a note' },
    { stage: 'applied',   crop: 'citrus',     title: 'Navel Orange Pruning',  employer: 'Tulare Valley Citrus',   date: 'Sep 2',  pay: '$21.50', appliedOn: 'Aug 1',  spots: 9,  action: 'Withdraw' },
    { stage: 'applied',   crop: 'strawberry', title: 'Strawberry Pack House', employer: 'Coastal Berry LLC',      date: 'Aug 9',  pay: '$23.00', appliedOn: 'Jul 31', spots: 18, action: 'Withdraw' },
  ];
  const stageMeta = {
    applied:   { tone: 'ghost',   label: 'Applied' },
    reviewed:  { tone: 'primary', label: 'Reviewed' },
    interview: { tone: 'warning', label: 'Interview' },
    accepted:  { tone: 'success', label: 'Accepted' },
  };
  const archive = [
    { crop: 'tomato', title: 'Tomato Sort Line', employer: 'Río Verde Farms', date: 'Jul 14', result: 'Hired & completed', earned: '$642.00' },
    { crop: 'almond', title: 'Almond Pickup', employer: 'Westside Orchards', date: 'Jul 02', result: 'Hired & completed', earned: '$1,108.50' },
    { crop: 'grape', title: 'Vineyard Setup', employer: 'Estrella Wines', date: 'Jun 22', result: 'Not selected', earned: null },
  ];

  return (
    <WorkerPage active="apps">
      <PageHeader
        eyebrow="5 active · 2 awaiting reply · last sync 2m ago"
        title={<>My <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>applications</em>.</>}
        sub="Track every job you've applied for. We'll text you when an employer responds — usually within 24 hours."
        right={
          <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
            <Icon name="plus" size={14}/> Find more jobs
          </button>
        }
      />

      {/* Pipeline counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {stages.map(s => (
          <Card key={s.k} style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.color }}/>
            <Eyebrow>{s.l}</Eyebrow>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 40, lineHeight: 1, letterSpacing: '-0.025em', marginTop: 8 }}>{s.n}</div>
            <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 6 }}>{s.k === 'accepted' ? 'Confirm by Aug 11' : s.k === 'interview' ? 'Thu 9 AM Modesto' : `In ${s.l.toLowerCase()} stage`}</div>
          </Card>
        ))}
      </div>

      {/* Active applications list */}
      <Card style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionHeading sub="Sorted by stage urgency">Active applications</SectionHeading>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'Action needed', 'In review', 'Withdrawn'].map((t, i) => (
              <span key={t} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, background: i === 0 ? 'var(--c-ink)' : 'var(--c-bg-warm)', color: i === 0 ? 'var(--c-bg)' : 'var(--c-ink-2)', fontWeight: 600, cursor: 'pointer' }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 0.8fr 0.7fr 0.9fr 0.9fr 0.6fr', gap: 16, padding: '12px 20px', borderBottom: '1px solid var(--c-line)', fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Job</span><span>Employer</span><span>Applied</span><span>Rate</span><span>Stage</span><span>Next step</span><span/>
        </div>
        {apps.map((a, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 0.8fr 0.7fr 0.9fr 0.9fr 0.6fr', gap: 16, padding: '16px 20px', borderBottom: i < apps.length - 1 ? '1px solid var(--c-line)' : '0', alignItems: 'center', fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <CropGlyph crop={a.crop} size={22}/>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 11, color: 'var(--c-ink-3)', marginTop: 2 }}>Starts {a.date} · {a.spots} spots</div>
              </div>
            </div>
            <div style={{ color: 'var(--c-ink-2)' }}>{a.employer}</div>
            <div style={{ fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)', fontSize: 12 }}>{a.appliedOn}</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, letterSpacing: '-0.02em' }}>{a.pay}</div>
            <div><Pill tone={stageMeta[a.stage].tone}>{stageMeta[a.stage].label}</Pill></div>
            <div>
              <button style={{ background: a.stage === 'accepted' ? 'var(--c-primary)' : a.stage === 'interview' ? 'var(--c-accent)' : 'transparent', color: a.stage === 'accepted' ? 'white' : a.stage === 'interview' ? 'var(--c-ink)' : 'var(--c-ink-2)', border: a.stage === 'applied' ? '1px solid var(--c-line)' : a.stage === 'reviewed' ? '1px solid var(--c-line)' : '0', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{a.action}</button>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Icon name="arrow" size={16} color="var(--c-ink-3)"/>
            </div>
          </div>
        ))}
      </Card>

      {/* Archive */}
      <SectionHeading sub="Past 90 days · 12 completed · 2 not selected">Past applications</SectionHeading>
      <Card style={{ overflow: 'hidden' }}>
        {archive.map((a, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 0.8fr 1fr 1fr 0.6fr', gap: 16, padding: '16px 20px', borderBottom: i < archive.length - 1 ? '1px solid var(--c-line)' : '0', alignItems: 'center', fontSize: 13, opacity: 0.85 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center' }}>
                <CropGlyph crop={a.crop} size={20}/>
              </div>
              <div style={{ fontWeight: 600 }}>{a.title}</div>
            </div>
            <div style={{ color: 'var(--c-ink-2)' }}>{a.employer}</div>
            <div style={{ fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)', fontSize: 12 }}>{a.date}</div>
            <div><Pill tone={a.earned ? 'success' : 'ghost'}>{a.result}</Pill></div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, letterSpacing: '-0.02em', color: a.earned ? 'var(--c-ink)' : 'var(--c-ink-3)' }}>{a.earned || '—'}</div>
            <div style={{ textAlign: 'right' }}>
              <a href="#" style={{ fontSize: 12, color: 'var(--c-primary)', textDecoration: 'none', fontWeight: 600 }}>View →</a>
            </div>
          </div>
        ))}
      </Card>
    </WorkerPage>
  );
};

/* ═══════════════════════════════════════════════════════════════
   3) MY SHIFTS — calendar + agenda
═══════════════════════════════════════════════════════════════ */
const ShiftsPage = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // 5-week grid; each cell may have shifts
  const monthStart = -2; // 2 leading-month days
  const cells = Array.from({ length: 35 }, (_, i) => {
    const day = i + monthStart + 1;
    const inMonth = day >= 1 && day <= 31;
    return { day, inMonth };
  });
  // shifts keyed by day-of-month
  const shiftsByDay = {
    4:  [{ tone: 'primary', label: 'Sunridge · Grape', time: '6 AM' }],
    5:  [{ tone: 'primary', label: 'Westside · Almond', time: '5:30 AM' }],
    6:  [{ tone: 'primary', label: 'Westside · Almond', time: '5:30 AM' }],
    7:  [{ tone: 'accent', label: 'Forklift training', time: '9 AM' }],
    8:  [{ tone: 'primary', label: 'Westside · Almond', time: '5:30 AM' }],
    12: [{ tone: 'ink', label: 'Sunridge · Harvest', time: '6 AM' }, { tone: 'ghost', label: '+1', time: '' }],
    13: [{ tone: 'ink', label: 'Sunridge · Harvest', time: '6 AM' }],
    14: [{ tone: 'ink', label: 'Sunridge · Harvest', time: '6 AM' }],
    18: [{ tone: 'primary', label: 'Río Verde · Tomato', time: '7 AM' }],
    19: [{ tone: 'primary', label: 'Río Verde · Tomato', time: '7 AM' }],
    25: [{ tone: 'accent', label: 'WPS refresh', time: '10 AM' }],
  };
  const dayTone = {
    primary: { bg: 'var(--c-primary-soft)', fg: 'var(--c-primary-deep)' },
    ink:     { bg: 'var(--c-ink)', fg: 'var(--c-bg)' },
    accent:  { bg: '#FEF3C7', fg: '#92400E' },
    ghost:   { bg: 'var(--c-bg-warm)', fg: 'var(--c-ink-3)' },
  };

  const upcoming = [
    { date: 'Mon · Aug 4', title: 'Grape Harvest', employer: 'Sunridge Vineyards', start: '6:00 AM', end: '2:30 PM', pay: '$22.50/hr', loc: 'Madera, CA', status: 'Confirmed' },
    { date: 'Tue · Aug 5', title: 'Almond Shaking', employer: 'Westside Orchards', start: '5:30 AM', end: '1:30 PM', pay: '$24.00/hr', loc: 'Modesto, CA', status: 'Awaiting confirm' },
    { date: 'Thu · Aug 7', title: 'Forklift Training', employer: 'Reedley College', start: '9:00 AM', end: '4:00 PM', pay: 'Stipend $80', loc: 'Reedley, CA', status: 'Enrolled', training: true },
    { date: 'Mon · Aug 18', title: 'Cannery Tomato Pick', employer: 'Río Verde Farms', start: '7:00 AM', end: '4:00 PM', pay: '$20.75/hr', loc: 'Yolo Co.', status: 'Pending' },
  ];

  return (
    <WorkerPage active="shifts">
      <PageHeader
        eyebrow="August 2026 · Madera, CA"
        title={<>My <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>shifts</em>.</>}
        sub="Confirmed work, training sessions, and pending shifts in one calendar. Tap any day for details."
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Icon name="download" size={14}/> Sync to phone
            </button>
            <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
              <Icon name="plus" size={14}/> Set availability
            </button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 22 }}>
        {/* Calendar */}
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--c-bg-warm)', border: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>‹</button>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em' }}>August 2026</div>
              <button style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--c-bg-warm)', border: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>›</button>
            </div>
            <div style={{ display: 'inline-flex', padding: 2, borderRadius: 999, background: 'var(--c-bg-warm)', fontSize: 11.5, fontFamily: 'var(--f-mono)' }}>
              <span style={{ padding: '5px 12px', borderRadius: 999, background: 'var(--c-ink)', color: 'var(--c-bg)', fontWeight: 700 }}>Month</span>
              <span style={{ padding: '5px 12px', color: 'var(--c-ink-3)', fontWeight: 600 }}>Week</span>
              <span style={{ padding: '5px 12px', color: 'var(--c-ink-3)', fontWeight: 600 }}>Agenda</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--c-line)' }}>
            {days.map(d => <div key={d} style={{ padding: '10px 12px', fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-ink-3)', fontWeight: 700 }}>{d.toUpperCase()}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((c, i) => {
              const shifts = shiftsByDay[c.day] || [];
              const isToday = c.day === 3;
              return (
                <div key={i} style={{
                  minHeight: 92, padding: 8, borderRight: (i+1) % 7 !== 0 ? '1px solid var(--c-line)' : '0',
                  borderBottom: i < 28 ? '1px solid var(--c-line)' : '0',
                  background: !c.inMonth ? 'rgba(0,0,0,0.015)' : isToday ? 'var(--c-bg-warm)' : 'white',
                  opacity: !c.inMonth ? 0.4 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11.5, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--c-primary)' : 'var(--c-ink-2)' }}>
                      {c.inMonth ? c.day : (c.day < 1 ? 30 + c.day : c.day - 31)}
                    </div>
                    {isToday && <span style={{ fontSize: 9, fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-primary)', letterSpacing: '0.1em' }}>TODAY</span>}
                  </div>
                  {shifts.map((sh, j) => {
                    const t = dayTone[sh.tone];
                    return (
                      <div key={j} style={{ background: t.bg, color: t.fg, padding: '4px 7px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, marginBottom: 3, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sh.time && <span style={{ fontFamily: 'var(--f-mono)', opacity: 0.75, marginRight: 4 }}>{sh.time}</span>}
                        {sh.label}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Side panel */}
        <div style={{ display: 'grid', gap: 14, alignContent: 'flex-start' }}>
          <Card style={{ padding: 18 }}>
            <Eyebrow>This month</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, lineHeight: 1, letterSpacing: '-0.025em' }}>14</div>
                <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 4 }}>Shifts scheduled</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, lineHeight: 1, letterSpacing: '-0.025em' }}>112h</div>
                <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 4 }}>Estimated hours</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--c-primary)' }}>$2.6k</div>
                <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 4 }}>Projected pay</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, lineHeight: 1, letterSpacing: '-0.025em' }}>3</div>
                <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 4 }}>Employers</div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: 18 }}>
            <SectionHeading sub="Tap to confirm or reschedule">Up next</SectionHeading>
            <div style={{ display: 'grid', gap: 10 }}>
              {upcoming.map((s, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 10, background: i === 0 ? 'var(--c-bg-warm)' : 'transparent', border: i === 0 ? '1px solid var(--c-line)' : '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)', letterSpacing: '0.06em', fontWeight: 700, textTransform: 'uppercase' }}>{s.date}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {s.training && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-accent)' }}/>}
                        {s.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 2 }}>{s.employer} · {s.loc}</div>
                    </div>
                    <Pill tone={s.status === 'Confirmed' ? 'success' : s.status === 'Awaiting confirm' ? 'warning' : s.status === 'Enrolled' ? 'accent' : 'ghost'}>{s.status}</Pill>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11.5, color: 'var(--c-ink-2)', fontFamily: 'var(--f-mono)' }}>
                    <span>{s.start}–{s.end}</span>
                    <span>·</span>
                    <span>{s.pay}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </WorkerPage>
  );
};

Object.assign(window, { BrowseJobsPage, ApplicationsPage, ShiftsPage });
