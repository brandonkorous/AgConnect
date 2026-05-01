/* Employer subpages: Jobs · Candidates · Crews · Payroll · Compliance · Messages · Reports */

/* ──────────────────────────────────────────────────────── */
/* JOBS                                                      */
/* ──────────────────────────────────────────────────────── */

const JobsPage = () => {
  const jobs = [
    { crop: 'grape', title: 'Grape Harvest', loc: 'Block 7-North · Madera', wage: '$22.50/hr + $0.18/lb', filled: 14, total: 14, applicants: 38, status: 'Filled', urgency: 'success', start: 'Aug 4 · 6 AM', length: '~3 days' },
    { crop: 'grape', title: 'Vineyard Setup Crew', loc: 'Block 4-East · Madera', wage: '$20.00/hr', filled: 6, total: 8, applicants: 14, status: '2 spots open', urgency: 'warning', start: 'Aug 5 · 6 AM', length: '5 days' },
    { crop: 'almond', title: 'Almond Pre-shake Crew', loc: 'East orchard · Madera', wage: '$21.00/hr', filled: 3, total: 12, applicants: 19, status: '9 spots open', urgency: 'danger', start: 'Aug 8 · 5:30 AM', length: '8 days' },
    { crop: 'grape', title: 'Sort Line — Day shift', loc: 'Packing house', wage: '$19.50/hr', filled: 8, total: 8, applicants: 22, status: 'Filled', urgency: 'success', start: 'Aug 4 · 7 AM', length: 'Ongoing' },
    { crop: 'grape', title: 'Forklift Operators', loc: 'Yard', wage: '$24.00/hr', filled: 2, total: 3, applicants: 7, status: '1 spot open', urgency: 'warning', start: 'Aug 4 · 6 AM', length: 'Ongoing' },
    { crop: 'almond', title: 'Almond Sweep Crew', loc: 'East orchard', wage: '$20.50/hr', filled: 0, total: 6, applicants: 4, status: '6 spots open', urgency: 'danger', start: 'Aug 18 · 5:30 AM', length: '6 days' },
  ];
  const tones = {
    success: { bg: '#DCFCE7', fg: '#166534' },
    warning: { bg: '#FEF3C7', fg: '#92400E' },
    danger:  { bg: '#FEE2E2', fg: '#991B1B' },
  };
  const filters = [
    { l: 'All postings', n: 8, active: true },
    { l: 'Open', n: 4 },
    { l: 'Urgent', n: 2 },
    { l: 'Filled', n: 4 },
    { l: 'Drafts', n: 1 },
    { l: 'Closed', n: 12 },
  ];
  return (
    <EmployerPage active="jobs">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
        <div>
          <span className="section-num">Postings</span>
          <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--f-display)', fontSize: 44, letterSpacing: '-0.025em', fontWeight: 400, lineHeight: 1.05 }}>
            Job <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>postings</em>
          </h1>
          <div style={{ fontSize: 13.5, color: 'var(--c-ink-2)', marginTop: 4 }}>4 open · 11 spots remaining · 47 applicants this week</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <Icon name="copy" size={14}/> Duplicate posting
          </button>
          <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
            <Icon name="plus" size={14}/> New job posting
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', borderBottom: '1px solid var(--c-line)', paddingBottom: 14 }}>
        {filters.map((f, i) => (
          <button key={i} style={{
            background: f.active ? 'var(--c-ink)' : 'white',
            color: f.active ? 'var(--c-bg)' : 'var(--c-ink-2)',
            border: '1px solid', borderColor: f.active ? 'var(--c-ink)' : 'var(--c-line)',
            borderRadius: 999, padding: '7px 13px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          }}>
            {f.l} <span style={{ marginLeft: 6, opacity: 0.7, fontFamily: 'var(--f-mono)' }}>{f.n}</span>
          </button>
        ))}
        <div style={{ flex: 1 }}/>
        <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '7px 13px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="filter" size={12}/> All crops
        </button>
        <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '7px 13px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Sort: Most urgent</button>
      </div>

      {/* Job cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {jobs.map((j, i) => {
          const t = tones[j.urgency];
          const pct = (j.filled / j.total) * 100;
          return (
            <div key={i} style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 20, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <CropGlyph crop={j.crop} size={28}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{j.title}</h3>
                    <span style={{ fontSize: 9.5, fontFamily: 'var(--f-mono)', fontWeight: 700, padding: '3px 7px', borderRadius: 999, background: t.bg, color: t.fg, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{j.status}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--c-ink-3)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="pin" size={11}/> {j.loc}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="cash" size={11}/> {j.wage}</span>
                  </div>
                </div>
                <button style={{ background: 'transparent', border: 0, padding: 4, cursor: 'pointer', color: 'var(--c-ink-3)' }}>⋯</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px 0', borderTop: '1px dashed var(--c-line)', borderBottom: '1px dashed var(--c-line)' }}>
                <div>
                  <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>Starts</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{j.start}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)' }}>{j.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>Crew</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{j.filled}/{j.total} confirmed</div>
                  <div style={{ height: 5, background: 'var(--c-bg-warm)', borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--c-primary)' : pct > 50 ? 'var(--c-accent)' : '#C73E2A' }}/>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--c-ink-2)' }}>
                  <strong style={{ color: 'var(--c-primary)', fontFamily: 'var(--f-mono)' }}>{j.applicants}</strong> applicants · <span style={{ color: 'var(--c-accent-deep)' }}>{Math.floor(j.applicants * 0.3)} new</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ background: 'transparent', border: '1px solid var(--c-line)', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  <button style={{ background: 'var(--c-ink)', color: 'var(--c-bg)', border: 0, borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Review {j.applicants} →</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick template */}
      <div style={{ marginTop: 32, padding: 24, background: 'var(--c-bg-warm)', border: '1px dashed var(--c-line-2)', borderRadius: 14, display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', fontWeight: 400 }}>Save 6 minutes — repost from a template</div>
          <div style={{ fontSize: 13, color: 'var(--c-ink-2)', marginTop: 4 }}>3 saved templates: Grape harvest crew · Almond sweep crew · Sort line. Edit dates and post.</div>
        </div>
        <button style={{ background: 'var(--c-ink)', color: 'var(--c-bg)', border: 0, borderRadius: 999, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="copy" size={13}/> Browse templates
        </button>
      </div>
    </EmployerPage>
  );
};
window.JobsPage = JobsPage;

/* ──────────────────────────────────────────────────────── */
/* CANDIDATES                                                */
/* ──────────────────────────────────────────────────────── */

const CandidatesPage = () => {
  const cands = [
    { n: 'Pedro Estrella', loc: 'Madera, CA · 8 mi', exp: '5 yr · Almond, grape', match: 96, applied: 'Almond Pre-shake', badges: ['Forklift', 'Bilingual', 'Refs ✓'], when: '2 hrs ago', stage: 'Interview', stageColor: '#FEF3C7', stageFg: '#92400E', init: 'PE' },
    { n: 'Soledad Saavedra', loc: 'Madera, CA · 4 mi', exp: '3 yr · Sort line, packing', match: 94, applied: 'Sort Line', badges: ['Forklift', 'WPS', 'Bilingual'], when: '4 hrs ago', stage: 'New', stageColor: 'var(--c-bg-warm)', stageFg: 'var(--c-ink-2)', init: 'SS' },
    { n: 'Joaquín Núñez', loc: 'Chowchilla, CA · 12 mi', exp: '8 yr · Almond harvest', match: 92, applied: 'Almond Pre-shake', badges: ['CDL-A', 'Refs ✓'], when: '5 hrs ago', stage: 'Reviewed', stageColor: 'var(--c-primary-soft)', stageFg: 'var(--c-primary-deep)', init: 'JN' },
    { n: 'Rosa Aguilar', loc: 'Madera, CA · 3 mi', exp: '4 yr · Vineyard, citrus', match: 88, applied: 'Vineyard Setup', badges: ['Bilingual', 'Refs ✓'], when: 'Yesterday', stage: 'Reviewed', stageColor: 'var(--c-primary-soft)', stageFg: 'var(--c-primary-deep)', init: 'RA' },
    { n: 'Beto Villalobos', loc: 'Madera, CA · 6 mi', exp: '6 yr · Sort line', match: 89, applied: 'Sort Line', badges: ['Forklift', 'WPS'], when: 'Yesterday', stage: 'New', stageColor: 'var(--c-bg-warm)', stageFg: 'var(--c-ink-2)', init: 'BV' },
    { n: 'Lupita Pérez', loc: 'Madera, CA · 5 mi', exp: '2 yr · Almond, citrus', match: 86, applied: 'Almond Pre-shake', badges: ['WPS', 'Bilingual'], when: 'Yesterday', stage: 'New', stageColor: 'var(--c-bg-warm)', stageFg: 'var(--c-ink-2)', init: 'LP' },
    { n: 'Ana Castillo', loc: 'Madera, CA · 7 mi', exp: '5 yr · Vineyard', match: 91, applied: 'Vineyard Setup', badges: ['Forklift', 'Bilingual', 'Refs ✓'], when: '2 days ago', stage: 'Interview', stageColor: '#FEF3C7', stageFg: '#92400E', init: 'AC' },
  ];
  return (
    <EmployerPage active="cand">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <span className="section-num">Pipeline</span>
          <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--f-display)', fontSize: 44, letterSpacing: '-0.025em', fontWeight: 400, lineHeight: 1.05 }}>
            Candidates <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>· 47 active</em>
          </h1>
          <div style={{ fontSize: 13.5, color: 'var(--c-ink-2)', marginTop: 4 }}>18 new · 12 reviewed · 4 in interview · 13 hired this season</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <Icon name="filter" size={14}/> Filters
          </button>
          <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
            <Icon name="chat" size={14}/> Bulk message
          </button>
        </div>
      </div>

      {/* Stage tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, padding: 4, background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, width: 'fit-content' }}>
        {[
          { l: 'All', n: 47, active: true },
          { l: 'New', n: 18 },
          { l: 'Reviewed', n: 12 },
          { l: 'Interview', n: 4 },
          { l: 'Offer', n: 0 },
          { l: 'Hired', n: 13 },
          { l: 'Archived', n: 8 },
        ].map((t, i) => (
          <button key={i} style={{
            background: t.active ? 'var(--c-ink)' : 'transparent',
            color: t.active ? 'var(--c-bg)' : 'var(--c-ink-2)',
            border: 0, borderRadius: 999, padding: '7px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          }}>{t.l} <span style={{ opacity: 0.6, marginLeft: 4, fontFamily: 'var(--f-mono)' }}>{t.n}</span></button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '24px 2fr 1.4fr 0.8fr 1.4fr 0.9fr 0.8fr 90px', gap: 14, padding: '12px 18px', background: 'var(--c-bg-warm)', borderBottom: '1px solid var(--c-line)', fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-ink-3)', fontWeight: 700 }}>
          <input type="checkbox" style={{ accentColor: 'var(--c-primary)' }}/>
          <span>Candidate</span><span>Applied for</span><span>Match</span><span>Skills</span><span>Stage</span><span>Applied</span><span style={{ textAlign: 'right' }}>Actions</span>
        </div>
        {cands.map((c, i, arr) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 2fr 1.4fr 0.8fr 1.4fr 0.9fr 0.8fr 90px', gap: 14, padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--c-line)' : '0', alignItems: 'center', fontSize: 13 }}>
            <input type="checkbox" style={{ accentColor: 'var(--c-primary)' }}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--c-ink)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--f-mono)', flexShrink: 0 }}>{c.init}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{c.n}</div>
                <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 1 }}>{c.loc}</div>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>{c.applied}</div>
              <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 1 }}>{c.exp}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `conic-gradient(var(--c-primary) ${c.match * 3.6}deg, var(--c-bg-warm) 0)`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-primary-deep)' }}>{c.match}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {c.badges.map((b, j) => (
                <span key={j} style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 4, background: 'var(--c-bg-warm)', color: 'var(--c-ink-2)', fontWeight: 600 }}>{b}</span>
              ))}
            </div>
            <div>
              <span style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 999, background: c.stageColor, color: c.stageFg, fontWeight: 700, fontFamily: 'var(--f-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{c.stage}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)' }}>{c.when}</div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              <button title="Message" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--c-line)', background: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="chat" size={12}/></button>
              <button title="Hire" style={{ width: 28, height: 28, borderRadius: 6, border: 0, background: 'var(--c-primary)', color: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="check" size={12}/></button>
            </div>
          </div>
        ))}
      </div>
    </EmployerPage>
  );
};
window.CandidatesPage = CandidatesPage;

/* ──────────────────────────────────────────────────────── */
/* CREWS & SHIFTS                                           */
/* ──────────────────────────────────────────────────────── */

const CrewsPage = () => {
  const crews = [
    { name: 'Crew A · Grape harvest', foreman: 'Manuel Vargas', size: 14, today: '6 AM Block 7-N', tomorrow: '6 AM Block 7-N', avg: 4.2, rating: 4.8 },
    { name: 'Crew B · Sort line', foreman: 'Lucia Mendez', size: 8, today: '7 AM Pack house', tomorrow: '7 AM Pack house', avg: 3.8, rating: 4.7 },
    { name: 'Crew C · Vineyard setup', foreman: 'Tomás Ríos', size: 6, today: 'Off', tomorrow: '6 AM Block 4-E', avg: 5.1, rating: 4.6 },
    { name: 'Crew D · Almond pre-shake', foreman: '— hiring —', size: 3, today: '— forming —', tomorrow: '5:30 AM East', avg: '—', rating: '—' },
  ];

  // 5-day schedule
  const days = ['Mon Aug 4', 'Tue Aug 5', 'Wed Aug 6', 'Thu Aug 7', 'Fri Aug 8'];
  const sched = [
    [
      { c: 'A', l: '6 AM · Block 7-N', size: 14, type: 'work' },
      { c: 'B', l: '7 AM · Pack house', size: 8, type: 'work' },
      { c: 'D', l: '5:30 AM Forming', size: 3, type: 'pending' },
    ],
    [
      { c: 'A', l: '6 AM · Block 7-N', size: 14, type: 'work' },
      { c: 'B', l: '7 AM · Pack house', size: 8, type: 'work' },
      { c: 'C', l: '6 AM · Block 4-E', size: 6, type: 'work' },
      { c: 'D', l: '5:30 AM East', size: 6, type: 'pending' },
    ],
    [
      { c: 'A', l: '6 AM · Block 7-N', size: 14, type: 'work' },
      { c: 'B', l: '7 AM · Pack house', size: 8, type: 'work' },
      { c: 'C', l: '6 AM · Block 4-E', size: 8, type: 'work' },
      { c: 'D', l: '5:30 AM East', size: 12, type: 'pending' },
    ],
    [
      { c: 'A', l: '6 AM · Block 7-N', size: 14, type: 'work' },
      { c: 'B', l: '7 AM · Pack house', size: 8, type: 'work' },
      { c: 'C', l: '6 AM · Block 4-E', size: 8, type: 'work' },
      { c: 'D', l: '5:30 AM East', size: 12, type: 'work' },
    ],
    [
      { c: 'B', l: '7 AM · Pack house', size: 8, type: 'work' },
      { c: 'D', l: '5:30 AM East', size: 12, type: 'work' },
      { c: '+', l: 'Payroll Fri', size: 26, type: 'note' },
    ],
  ];
  const tones = {
    work: { bg: 'var(--c-primary-soft)', fg: 'var(--c-primary-deep)', bar: 'var(--c-primary)' },
    pending: { bg: '#FEF3C7', fg: '#92400E', bar: 'var(--c-accent)' },
    note: { bg: 'var(--c-bg-warm)', fg: 'var(--c-ink-2)', bar: 'var(--c-ink-3)' },
  };
  return (
    <EmployerPage active="crews">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <span className="section-num">Operations · Week of Aug 4</span>
          <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--f-display)', fontSize: 44, letterSpacing: '-0.025em', fontWeight: 400, lineHeight: 1.05 }}>
            Crews <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>& shifts</em>
          </h1>
          <div style={{ fontSize: 13.5, color: 'var(--c-ink-2)', marginTop: 4 }}>4 crews · 31 confirmed · 9 still being filled · 1,187 hours scheduled</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="download" size={14}/> Export schedule
          </button>
          <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
            <Icon name="plus" size={14}/> New shift
          </button>
        </div>
      </div>

      {/* Schedule grid */}
      <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(5, 1fr)', borderBottom: '1px solid var(--c-line)' }}>
          <div style={{ padding: '14px 18px', borderRight: '1px solid var(--c-line)', background: 'var(--c-bg-warm)', fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-ink-3)', fontWeight: 700 }}>Crews / Day</div>
          {days.map((d, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < days.length - 1 ? '1px solid var(--c-line)' : '0', background: i === 0 ? 'var(--c-primary-soft)' : 'var(--c-bg-warm)' }}>
              <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-ink-3)', fontWeight: 700 }}>{d.split(' ')[0]}</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', marginTop: 2 }}>{d.split(' ').slice(1).join(' ')}</div>
            </div>
          ))}
        </div>

        {crews.map((cr, ci) => (
          <div key={ci} style={{ display: 'grid', gridTemplateColumns: '180px repeat(5, 1fr)', borderBottom: ci < crews.length - 1 ? '1px solid var(--c-line)' : '0', minHeight: 110 }}>
            <div style={{ padding: 16, borderRight: '1px solid var(--c-line)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{cr.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 3 }}>{cr.foreman} · {cr.size} crew</div>
              <div style={{ fontSize: 11, color: 'var(--c-primary-deep)', marginTop: 4, fontFamily: 'var(--f-mono)', fontWeight: 700 }}>★ {cr.rating} · {cr.avg}/hr avg</div>
            </div>
            {sched.map((day, di) => {
              const slot = day.find(s => s.c === cr.name.split(' ')[1] || (cr.name.startsWith(`Crew ${s.c}`) && s.c.length === 1));
              return (
                <div key={di} style={{ padding: 10, borderRight: di < 4 ? '1px solid var(--c-line)' : '0', background: di === 0 ? 'rgba(15,110,86,0.03)' : 'transparent' }}>
                  {slot ? (
                    <div style={{ padding: '8px 10px', borderRadius: 8, background: tones[slot.type].bg, color: tones[slot.type].fg, borderLeft: `3px solid ${tones[slot.type].bar}` }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700 }}>{slot.l.split('·')[0]}</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>{slot.l.split('·')[1]}</div>
                      <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', marginTop: 4, opacity: 0.85 }}>👥 {slot.size}{slot.type === 'pending' ? ' filling' : ''}</div>
                    </div>
                  ) : (
                    <div style={{ height: '100%', minHeight: 60, border: '1px dashed var(--c-line)', borderRadius: 8, display: 'grid', placeItems: 'center', color: 'var(--c-ink-3)', fontSize: 11 }}>Off</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Crew roster cards */}
      <div style={{ marginBottom: 14, fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', fontWeight: 400 }}>Crew leaders</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {crews.map((cr, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--c-primary)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12, fontFamily: 'var(--f-mono)' }}>{cr.foreman.split(' ').map(p => p[0]).slice(0,2).join('')}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{cr.foreman}</div>
                <div style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>{cr.name.split('·')[0].trim()}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--c-line)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 11.5 }}>
              <div><div style={{ color: 'var(--c-ink-3)' }}>Size</div><div style={{ fontWeight: 700, fontFamily: 'var(--f-mono)' }}>{cr.size}</div></div>
              <div><div style={{ color: 'var(--c-ink-3)' }}>Rating</div><div style={{ fontWeight: 700, fontFamily: 'var(--f-mono)' }}>★ {cr.rating}</div></div>
            </div>
            <button style={{ marginTop: 12, width: '100%', background: 'var(--c-bg-warm)', border: '1px solid var(--c-line)', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Message {cr.foreman.split(' ')[0]}</button>
          </div>
        ))}
      </div>
    </EmployerPage>
  );
};
window.CrewsPage = CrewsPage;

/* ──────────────────────────────────────────────────────── */
/* PAYROLL                                                  */
/* ──────────────────────────────────────────────────────── */

const PayrollPage = () => {
  const rows = [
    { n: 'Miguel Reyes', role: 'Crew A · Lead', hrs: 52, ot: 12, gross: 1325.50, bonus: 180, net: 1184.20, init: 'MR' },
    { n: 'Carmen Rojas', role: 'Crew A · Picker', hrs: 48, ot: 8, gross: 1116.00, bonus: 92, net: 994.30, init: 'CR' },
    { n: 'Soledad Saavedra', role: 'Crew B · Sort', hrs: 45, ot: 5, gross: 945.50, bonus: 0, net: 838.20, init: 'SS' },
    { n: 'Beto Villalobos', role: 'Crew B · Sort', hrs: 45, ot: 5, gross: 945.50, bonus: 0, net: 838.20, init: 'BV' },
    { n: 'Tomás Ríos', role: 'Crew C · Foreman', hrs: 48, ot: 8, gross: 1296.00, bonus: 220, net: 1162.40, init: 'TR' },
    { n: 'Rosa Aguilar', role: 'Crew C · Setup', hrs: 40, ot: 0, gross: 800.00, bonus: 40, net: 712.50, init: 'RA' },
  ];
  const totals = { gross: 33210.40, bonus: 1840, taxes: 4717.60, net: 28492.40, hours: 1187, workers: 26 };
  return (
    <EmployerPage active="pay">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <span className="section-num">Pay period · Jul 28 – Aug 3</span>
          <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--f-display)', fontSize: 44, letterSpacing: '-0.025em', fontWeight: 400, lineHeight: 1.05 }}>
            Payroll <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>· runs Friday</em>
          </h1>
          <div style={{ fontSize: 13.5, color: 'var(--c-ink-2)', marginTop: 4 }}>26 workers · 1,187 hours · 124 piece-rate bonuses approved</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="download" size={14}/> Export 941 / DE-9
          </button>
          <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
            <Icon name="check" size={14}/> Approve & run payroll
          </button>
        </div>
      </div>

      {/* Hero summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 22 }}>
        <div style={{ borderRadius: 18, background: 'var(--c-ink)', color: 'var(--c-bg)', padding: 28, position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 100% 0%, rgba(245,158,11,0.25), transparent 60%)' }}/>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-accent)' }}>Net payout · this period</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 64, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 12, fontWeight: 400 }}>${totals.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.18)' }}>
              {[
                { l: 'Gross', v: `$${totals.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                { l: 'Bonuses', v: `$${totals.bonus.toLocaleString()}` },
                { l: 'Taxes', v: `−$${totals.taxes.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                { l: 'Hours', v: totals.hours.toLocaleString() },
              ].map((c, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.6)', fontWeight: 600 }}>{c.l}</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', marginTop: 4 }}>{c.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>Season-to-date</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 36, letterSpacing: '-0.025em', marginTop: 8, color: 'var(--c-primary)' }}>$284,108</div>
            <div style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>Across 14 pay periods · 41 unique workers</div>
            <div style={{ marginTop: 14, display: 'flex', gap: 3, height: 32 }}>
              {[42, 56, 48, 64, 72, 58, 66, 74, 82, 78, 86, 92, 88, 100].map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${v}%`, background: i === 13 ? 'var(--c-accent)' : 'var(--c-primary)', borderRadius: 1, opacity: i === 13 ? 1 : 0.3 + i * 0.05 }}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--c-accent)', color: 'var(--c-ink)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>H-2A Compliance</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', marginTop: 8, lineHeight: 1.1 }}>AEWR + transport reimbursed automatically</div>
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.85 }}>3-fourths guarantee tracked · Adverse Effect Wage $19.97/hr applied</div>
          </div>
        </div>
      </div>

      {/* Roster table */}
      <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, letterSpacing: '-0.02em', fontWeight: 400 }}>Worker timesheets · ready to approve</div>
          <div style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>Showing 6 of 26 · <a style={{ color: 'var(--c-primary)', textDecoration: 'none', fontWeight: 600 }}>view all →</a></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 0.8fr 0.7fr 1fr 0.9fr 1fr 100px', gap: 14, padding: '12px 20px', background: 'var(--c-bg-warm)', borderBottom: '1px solid var(--c-line)', fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-ink-3)', fontWeight: 700 }}>
          <span>Worker</span><span>Role</span><span>Hours</span><span>OT</span><span>Gross</span><span>Bonus</span><span>Net pay</span><span style={{ textAlign: 'right' }}>Actions</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 0.8fr 0.7fr 1fr 0.9fr 1fr 100px', gap: 14, padding: '14px 20px', borderBottom: i < rows.length - 1 ? '1px solid var(--c-line)' : '0', alignItems: 'center', fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--c-primary)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'var(--f-mono)' }}>{r.init}</div>
              <span style={{ fontWeight: 600 }}>{r.n}</span>
            </div>
            <span style={{ color: 'var(--c-ink-2)' }}>{r.role}</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 600 }}>{r.hrs}h</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 600, color: r.ot > 0 ? 'var(--c-accent-deep)' : 'var(--c-ink-3)' }}>{r.ot}h</span>
            <span style={{ fontFamily: 'var(--f-mono)' }}>${r.gross.toFixed(2)}</span>
            <span style={{ fontFamily: 'var(--f-mono)', color: r.bonus > 0 ? 'var(--c-primary)' : 'var(--c-ink-3)', fontWeight: r.bonus > 0 ? 700 : 400 }}>{r.bonus > 0 ? `+$${r.bonus}` : '—'}</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700 }}>${r.net.toFixed(2)}</span>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
              <button style={{ background: 'transparent', border: '1px solid var(--c-line)', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Edit</button>
              <button style={{ background: 'var(--c-primary)', color: 'white', border: 0, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>✓</button>
            </div>
          </div>
        ))}
      </div>
    </EmployerPage>
  );
};
window.PayrollPage = PayrollPage;

/* ──────────────────────────────────────────────────────── */
/* COMPLIANCE                                               */
/* ──────────────────────────────────────────────────────── */

const CompliancePage = () => {
  const cats = [
    { l: 'Worker documentation', score: 94, items: [
      { t: 'I-9 forms on file', s: '24 of 26', ok: true },
      { t: '2 I-9s expiring within 30 days', s: 'Pedro E., Tomás R.', ok: false },
      { t: 'W-4s collected', s: 'All workers', ok: true },
    ]},
    { l: 'Worker safety (Cal/OSHA)', score: 100, items: [
      { t: 'Heat illness prevention plan', s: 'Posted · trained 26/26', ok: true },
      { t: 'Pesticide handler training (WPS)', s: 'Current · expires Mar 2026', ok: true },
      { t: 'COVID-19 prevention plan', s: 'Updated July 12', ok: true },
    ]},
    { l: 'Wage & hour', score: 96, items: [
      { t: 'Piece-rate paid breaks tracked', s: 'AB 1513 compliant', ok: true },
      { t: 'Overtime calculations', s: 'Phase-in 2025: 8h/40h', ok: true },
      { t: 'Itemized wage statements', s: 'Auto-generated', ok: true },
    ]},
    { l: 'Pesticide records', score: 100, items: [
      { t: 'Application records (PUR)', s: 'Filed monthly', ok: true },
      { t: 'Notice of Intent (NOI)', s: 'CDPR submitted', ok: true },
    ]},
    { l: 'H-2A program', score: 88, items: [
      { t: 'AEWR rate compliance', s: '$19.97/hr applied', ok: true },
      { t: 'Housing inspection', s: 'Due Aug 22', ok: 'warn' },
      { t: '3/4 guarantee tracking', s: 'Auto-tracked', ok: true },
    ]},
  ];
  return (
    <EmployerPage active="comp">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <span className="section-num">Compliance</span>
          <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--f-display)', fontSize: 44, letterSpacing: '-0.025em', fontWeight: 400, lineHeight: 1.05 }}>
            <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>96%</em> compliant
          </h1>
          <div style={{ fontSize: 13.5, color: 'var(--c-ink-2)', marginTop: 4 }}>2 actions due · audit-ready · last DOL inspection: passed Jun 14, 2025</div>
        </div>
        <button style={{ background: 'var(--c-ink)', color: 'var(--c-bg)', border: 0, borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="download" size={14}/> Audit binder PDF
        </button>
      </div>

      {/* Overall ring */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 18, marginBottom: 24 }}>
        <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 18, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 150, height: 150, borderRadius: '50%', background: `conic-gradient(var(--c-primary) ${96 * 3.6}deg, var(--c-bg-warm) 0)`, display: 'grid', placeItems: 'center', position: 'relative' }}>
            <div style={{ width: 124, height: 124, borderRadius: '50%', background: 'white', display: 'grid', placeItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 48, letterSpacing: '-0.03em', color: 'var(--c-primary)', lineHeight: 1, fontWeight: 400 }}>96<span style={{ fontSize: 18, opacity: 0.5 }}>%</span></div>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Overall</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--c-ink-2)' }}>+4 pts vs. last quarter</div>
        </div>
        {/* Action items */}
        <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Icon name="bell" size={16} color="var(--c-accent-deep)"/>
            <span style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', fontWeight: 400 }}>2 actions need your attention</span>
          </div>
          {[
            { sev: 'urgent', t: 'Two I-9s expiring within 30 days', d: 'Pedro Estrella (Aug 24) · Tomás Ríos (Sep 1) — re-verify with current ID.', cta: 'Re-verify' },
            { sev: 'soon', t: 'H-2A housing inspection due Aug 22', d: 'Annual housing inspection per 20 CFR 655.122 — schedule with CDPH 14 days in advance.', cta: 'Schedule' },
          ].map((a, i) => (
            <div key={i} style={{ padding: 14, background: a.sev === 'urgent' ? '#FEF2F2' : '#FFFBEB', border: '1px solid', borderColor: a.sev === 'urgent' ? '#FECACA' : '#FDE68A', borderRadius: 10, marginBottom: 10, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 999, background: a.sev === 'urgent' ? '#991B1B' : '#92400E', color: 'white', fontWeight: 700, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{a.sev}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{a.t}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-ink-2)' }}>{a.d}</div>
              </div>
              <button style={{ background: 'var(--c-ink)', color: 'var(--c-bg)', border: 0, borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.cta}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {cats.map((c, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.l}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, height: 5, background: 'var(--c-bg-warm)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.score}%`, background: c.score >= 95 ? 'var(--c-primary)' : c.score >= 85 ? 'var(--c-accent)' : '#C73E2A' }}/>
                </div>
                <span style={{ fontSize: 12, fontFamily: 'var(--f-mono)', fontWeight: 700, color: c.score >= 95 ? 'var(--c-primary)' : 'var(--c-accent-deep)' }}>{c.score}%</span>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {c.items.map((it, j) => {
                const ok = it.ok === true, warn = it.ok === 'warn';
                return (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--c-bg)', borderRadius: 8 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: ok ? 'var(--c-primary-soft)' : warn ? '#FEF3C7' : '#FEE2E2', color: ok ? 'var(--c-primary)' : warn ? '#92400E' : '#991B1B', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name={ok ? 'check' : warn ? 'bell' : 'minus'} size={10}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{it.t}</div>
                      <div style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>{it.s}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </EmployerPage>
  );
};
window.CompliancePage = CompliancePage;

/* ──────────────────────────────────────────────────────── */
/* MESSAGES (employer)                                       */
/* ──────────────────────────────────────────────────────── */

const EmployerMessagesPage = () => {
  const folders = [
    { l: 'All conversations', n: 47, active: true, i: 'chat' },
    { l: 'Candidates', n: 18, i: 'users' },
    { l: 'Active crew', n: 26, dot: true, i: 'badge' },
    { l: 'Foremen', n: 4, i: 'shield' },
    { l: 'Broadcasts', n: 0, i: 'spark' },
  ];
  const threads = [
    { n: 'Crew A — Grape Harvest', sub: 'M. Vargas: Pickup at 5:30 AM, Hwy 99…', when: '8m', unread: 2, init: 'A', group: true, channel: 'app' },
    { n: 'Pedro Estrella', sub: 'You: Can you do Thu 9 AM interview?', when: '32m', unread: 0, init: 'PE', channel: 'sms' },
    { n: 'Soledad Saavedra', sub: 'Soledad: Yes, I have forklift cert…', when: '2h', unread: 1, init: 'SS', channel: 'sms' },
    { n: 'Manuel Vargas (Foreman A)', sub: 'Manuel: Need 1 more for tomorrow', when: '3h', unread: 0, init: 'MV', channel: 'whatsapp' },
    { n: 'Almond Pre-shake applicants', sub: 'You: Job is still open — pay $21/hr…', when: '5h', unread: 0, init: '🌱', group: true, channel: 'broadcast' },
    { n: 'Joaquín Núñez', sub: 'Joaquín: Available Mon-Sat', when: 'Yest', unread: 0, init: 'JN', channel: 'sms' },
    { n: 'Rosa Aguilar', sub: 'You: Welcome to the crew!', when: 'Yest', unread: 0, init: 'RA', channel: 'app' },
  ];
  const msgs = [
    { who: 'them', t: 'Buenos días Elena. Listo para mañana. Tengo 13 confirmados y uno me dijo que no puede.', when: '7:42 AM' },
    { who: 'me', t: 'Got it Manuel. Posting the 1 spot publicly now — should fill within an hour given how many applicants we have.', when: '7:44 AM' },
    { who: 'them', t: 'Perfect. Pickup en Hwy 99 a las 5:30 AM, regresamos al campo Block 7-Norte. Llevo agua + carpa de sombra.', when: '7:46 AM' },
    { who: 'me', t: 'Heat advisory says 102°F by 1 PM tomorrow. Push lunch to 11:30 and add a 10-min shade break at 9 AM and 1 PM.', when: '7:48 AM' },
    { who: 'them', t: '✓ Voy a avisar al equipo por WhatsApp. ¿Pago piezas hoy o se junta con el viernes?', when: '7:51 AM' },
    { who: 'me', t: 'Friday with payroll. Bonus rate is $0.18/lb — already loaded. See you at 5:30 ⛅', when: '7:53 AM' },
  ];
  const channelChip = { sms: { l: 'SMS', bg: '#FEF3C7', fg: '#92400E' }, whatsapp: { l: 'WA', bg: '#DCFCE7', fg: '#166534' }, app: { l: 'APP', bg: 'var(--c-primary-soft)', fg: 'var(--c-primary-deep)' }, broadcast: { l: 'BROADCAST', bg: 'var(--c-accent)', fg: 'var(--c-ink)' } };

  return (
    <EmployerPage active="msg">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
        <div>
          <span className="section-num">Inbox</span>
          <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--f-display)', fontSize: 44, letterSpacing: '-0.025em', fontWeight: 400, lineHeight: 1.05 }}>
            Messages <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>· 6 unread</em>
          </h1>
          <div style={{ fontSize: 13.5, color: 'var(--c-ink-2)', marginTop: 4 }}>SMS, WhatsApp & in-app · automatic translation EN ⇄ ES</div>
        </div>
        <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
          <Icon name="spark" size={14}/> New broadcast
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 340px 1fr', gap: 14, height: 720, background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, overflow: 'hidden' }}>
        {/* Folders */}
        <div style={{ borderRight: '1px solid var(--c-line)', padding: 14, background: 'var(--c-bg-warm)' }}>
          {folders.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, marginBottom: 4,
              background: f.active ? 'white' : 'transparent', cursor: 'pointer',
              border: f.active ? '1px solid var(--c-line)' : '1px solid transparent', fontWeight: f.active ? 600 : 500,
            }}>
              <Icon name={f.i} size={14} color={f.active ? 'var(--c-primary)' : 'var(--c-ink-2)'}/>
              <span style={{ flex: 1, fontSize: 12.5 }}>{f.l}</span>
              {f.n > 0 && <span style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: f.dot ? 'var(--c-accent)' : 'var(--c-bg-warm)', color: 'var(--c-ink-2)' }}>{f.n}</span>}
            </div>
          ))}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--c-line)' }}>
            <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Templates</div>
            {['Interview invite', 'Hiring offer', 'Shift reminder', 'Heat advisory'].map((t, i) => (
              <div key={i} style={{ padding: '6px 10px', fontSize: 12, color: 'var(--c-ink-2)', cursor: 'pointer', borderRadius: 6 }}>· {t}</div>
            ))}
          </div>
        </div>

        {/* Thread list */}
        <div style={{ borderRight: '1px solid var(--c-line)', overflow: 'auto' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--c-line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'var(--c-bg-warm)', borderRadius: 999, color: 'var(--c-ink-3)', fontSize: 12 }}>
              <Icon name="spark" size={12}/> Search messages…
            </div>
          </div>
          {threads.map((t, i) => {
            const isActive = i === 0;
            const ch = channelChip[t.channel];
            return (
              <div key={i} style={{ padding: '12px 14px', borderBottom: '1px solid var(--c-line)', display: 'flex', gap: 10, alignItems: 'flex-start', background: isActive ? 'var(--c-primary-soft)' : 'white', cursor: 'pointer' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.group ? 'var(--c-accent)' : 'var(--c-ink)', color: t.group ? 'var(--c-ink)' : 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--f-mono)', flexShrink: 0 }}>{t.init}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: t.unread ? 700 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.n}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--c-ink-3)', fontFamily: 'var(--f-mono)', flexShrink: 0 }}>{t.when}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.sub}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: ch.bg, color: ch.fg, fontWeight: 700, fontFamily: 'var(--f-mono)', letterSpacing: '0.06em' }}>{ch.l}</span>
                    {t.unread > 0 && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: 'var(--c-primary)', color: 'white', fontWeight: 700, fontFamily: 'var(--f-mono)' }}>{t.unread}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Conversation */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--c-accent)', color: 'var(--c-ink)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--f-mono)' }}>A</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Crew A — Grape Harvest</div>
              <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)' }}>14 members · Manuel Vargas (Foreman) · auto-translate ON</div>
            </div>
            <button style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid var(--c-line)', background: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icon name="phone" size={12}/> Call foreman
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 22, background: 'var(--c-bg-warm)' }}>
            {/* Pinned shift card */}
            <div style={{ background: 'var(--c-ink)', color: 'var(--c-bg)', borderRadius: 12, padding: 14, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-accent)', textTransform: 'uppercase', fontWeight: 700 }}>📌 Pinned · Tomorrow's shift</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: 'rgba(255,255,255,0.6)' }}>13/14 confirmed</span>
              </div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, letterSpacing: '-0.01em', marginBottom: 6 }}>Block 7-North · 6:00 AM · Pickup at Hwy 99</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Heat plan: 11:30 lunch · 10-min shade breaks 9 AM + 1 PM · 102°F forecast</div>
            </div>

            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.who === 'me' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                <div style={{ maxWidth: '70%' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 14,
                    background: m.who === 'me' ? 'var(--c-primary)' : 'white',
                    color: m.who === 'me' ? 'white' : 'var(--c-ink)',
                    border: m.who === 'me' ? '0' : '1px solid var(--c-line)',
                    fontSize: 13.5, lineHeight: 1.5,
                  }}>{m.t}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--c-ink-3)', marginTop: 4, fontFamily: 'var(--f-mono)', textAlign: m.who === 'me' ? 'right' : 'left' }}>{m.when}{m.who === 'me' ? ' · sent' : ''}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div style={{ padding: 14, borderTop: '1px solid var(--c-line)', background: 'white' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid var(--c-primary)', background: 'var(--c-primary-soft)', color: 'var(--c-primary-deep)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>App</button>
              <button style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid var(--c-line)', background: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>SMS · all 14</button>
              <button style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid var(--c-line)', background: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>WhatsApp · foreman only</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid var(--c-line)', borderRadius: 12 }}>
              <input placeholder="Type a message — auto-translates to Spanish" style={{ flex: 1, border: 0, outline: 0, fontSize: 13, fontFamily: 'inherit', background: 'transparent' }}/>
              <button style={{ background: 'var(--c-ink)', color: 'var(--c-bg)', border: 0, borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Send <Icon name="arrow" size={12}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </EmployerPage>
  );
};
window.EmployerMessagesPage = EmployerMessagesPage;

/* ──────────────────────────────────────────────────────── */
/* REPORTS                                                   */
/* ──────────────────────────────────────────────────────── */

const ReportsPage = () => {
  return (
    <EmployerPage active="rep">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <span className="section-num">Analytics · Season 2025</span>
          <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--f-display)', fontSize: 44, letterSpacing: '-0.025em', fontWeight: 400, lineHeight: 1.05 }}>
            Hiring <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>reports</em>
          </h1>
          <div style={{ fontSize: 13.5, color: 'var(--c-ink-2)', marginTop: 4 }}>Operational pulse · season vs. last year · DOL/EDD-ready exports</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>This season</button>
          <button style={{ background: 'var(--c-ink)', color: 'var(--c-bg)', border: 0, borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="download" size={14}/> Export CSV
          </button>
        </div>
      </div>

      {/* Top row KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { l: 'Hires this season', v: '83', d: '+18 YoY', sub: '14 active crews' },
          { l: 'Avg time-to-fill', v: '2.4 days', d: '−1.7 d YoY', sub: 'County avg 6.1 d' },
          { l: 'Cost per hire', v: '$42', d: '−$28 YoY', sub: 'incl. SMS, broadcast' },
          { l: 'Retention · 30d', v: '88%', d: '+12 pts YoY', sub: '5 of 41 left early' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>{k.l}</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 38, letterSpacing: '-0.03em', marginTop: 8, color: 'var(--c-primary)', lineHeight: 1, fontWeight: 400 }}>{k.v}</div>
            <div style={{ fontSize: 11.5, color: 'var(--c-primary-deep)', fontFamily: 'var(--f-mono)', fontWeight: 700, marginTop: 6 }}>{k.d}</div>
            <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Big chart: applicants over season */}
      <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 24, marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-0.02em', fontWeight: 400 }}>Applicant flow vs. spots filled · weekly</div>
            <div style={{ fontSize: 12.5, color: 'var(--c-ink-3)', marginTop: 2 }}>March – August 2025 · across 8 job types</div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--c-primary)' }}/>Applicants</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--c-accent)' }}/>Hired</div>
          </div>
        </div>
        <svg viewBox="0 0 1100 240" style={{ width: '100%', height: 240 }}>
          {[0, 60, 120, 180, 240].map((y, i) => (
            <line key={i} x1="0" y1={y} x2="1100" y2={y} stroke="var(--c-line)" strokeWidth="1"/>
          ))}
          {[40, 56, 78, 92, 110, 128, 142, 156, 168, 152, 138, 120, 102, 88, 72, 84, 110, 138, 168, 184, 172, 158].map((v, i, a) => {
            const x = (i / (a.length - 1)) * 1080 + 10;
            const y = 240 - (v / 200) * 240;
            const next = a[i + 1];
            if (!next) return null;
            const x2 = ((i + 1) / (a.length - 1)) * 1080 + 10;
            const y2 = 240 - (next / 200) * 240;
            return <line key={i} x1={x} y1={y} x2={x2} y2={y2} stroke="var(--c-primary)" strokeWidth="2.5" strokeLinecap="round"/>;
          })}
          {[40, 56, 78, 92, 110, 128, 142, 156, 168, 152, 138, 120, 102, 88, 72, 84, 110, 138, 168, 184, 172, 158].map((v, i, a) => {
            const x = (i / (a.length - 1)) * 1080 + 10;
            const y = 240 - (v / 200) * 240;
            return <circle key={i} cx={x} cy={y} r="3" fill="var(--c-primary)"/>;
          })}
          {[18, 22, 28, 32, 40, 48, 56, 62, 70, 64, 58, 52, 46, 40, 32, 38, 48, 60, 76, 84, 80, 72].map((v, i, a) => {
            const x = (i / (a.length - 1)) * 1080 + 10;
            const w = 1080 / a.length - 4;
            const h = (v / 200) * 240;
            return <rect key={i} x={x - w/2} y={240 - h} width={w} height={h} fill="var(--c-accent)" opacity="0.65" rx="2"/>;
          })}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)' }}>
          <span>Mar 1</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug 8</span>
        </div>
      </div>

      {/* Bottom split: by job type + worker leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, letterSpacing: '-0.02em', fontWeight: 400, marginBottom: 16 }}>By job type · season</div>
          {[
            { c: 'grape', l: 'Grape Harvest', applied: 142, hired: 38, fill: 100 },
            { c: 'almond', l: 'Almond Pre-shake', applied: 86, hired: 21, fill: 87 },
            { c: 'grape', l: 'Vineyard Setup', applied: 64, hired: 14, fill: 92 },
            { c: 'grape', l: 'Sort Line', applied: 58, hired: 16, fill: 100 },
            { c: 'almond', l: 'Almond Sweep', applied: 28, hired: 0, fill: 0 },
          ].map((j, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px', gap: 14, padding: '10px 0', borderBottom: i < 4 ? '1px dashed var(--c-line)' : '0', alignItems: 'center', fontSize: 12.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CropGlyph crop={j.c} size={18}/>
                <span style={{ fontWeight: 600 }}>{j.l}</span>
              </div>
              <div>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)', display: 'flex', justifyContent: 'space-between' }}><span>{j.applied} applied · {j.hired} hired</span><span>{j.fill}% filled</span></div>
                <div style={{ height: 6, background: 'var(--c-bg-warm)', borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
                  <div style={{ height: '100%', width: `${j.fill}%`, background: j.fill === 100 ? 'var(--c-primary)' : j.fill > 50 ? 'var(--c-accent)' : '#C73E2A' }}/>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 16, fontWeight: 700, color: 'var(--c-primary)', textAlign: 'right' }}>{j.hired}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 14, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, letterSpacing: '-0.02em', fontWeight: 400 }}>Top performers · this season</div>
            <span style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>by piece-rate yield</span>
          </div>
          {[
            { n: 'Miguel Reyes', r: 'Crew A · Lead', m: '4,820 lb/day', dx: '+18%', init: 'MR' },
            { n: 'Carmen Rojas', r: 'Crew A · Picker', m: '4,210 lb/day', dx: '+12%', init: 'CR' },
            { n: 'Tomás Ríos', r: 'Crew C · Foreman', m: '3,980 lb/day', dx: '+9%', init: 'TR' },
            { n: 'Ana Castillo', r: 'Crew C · Setup', m: '3,640 lb/day', dx: '+7%', init: 'AC' },
            { n: 'Joaquín Núñez', r: 'Crew B · Sort', m: '3,520 lb/day', dx: '+5%', init: 'JN' },
          ].map((p, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px dashed var(--c-line)' : '0' }}>
              <div style={{ width: 22, fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--c-ink-3)', fontWeight: 700 }}>{i + 1}</div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? 'var(--c-accent)' : 'var(--c-ink)', color: i === 0 ? 'var(--c-ink)' : 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--f-mono)' }}>{p.init}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.n}</div>
                <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)' }}>{p.r}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12.5, fontFamily: 'var(--f-mono)', fontWeight: 700 }}>{p.m}</div>
                <div style={{ fontSize: 11, color: 'var(--c-primary)', fontWeight: 700 }}>{p.dx}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmployerPage>
  );
};
window.ReportsPage = ReportsPage;
