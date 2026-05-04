/* Employer Edit Shift page — for adding new or editing existing shifts in a crew */

const EditShiftPage = () => {
  const [shiftType, setShiftType] = React.useState('work');
  const [crew, setCrew] = React.useState('A');
  const [block, setBlock] = React.useState('Block 7-North');
  const [start, setStart] = React.useState('06:00');
  const [end, setEnd] = React.useState('14:30');
  const [pickup, setPickup] = React.useState(true);
  const [heat, setHeat] = React.useState(true);
  const [days, setDays] = React.useState({ Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false });

  const crews = [
    { k: 'A', l: 'Crew A · Grape Harvest', size: 14, foreman: 'M. Vargas', color: '#6B2B5E' },
    { k: 'B', l: 'Crew B · Sort Line', size: 8, foreman: 'L. Mendez', color: 'var(--c-primary)' },
    { k: 'C', l: 'Crew C · Vineyard Setup', size: 6, foreman: 'T. Ríos', color: 'var(--c-accent-deep)' },
    { k: 'D', l: 'Crew D · Almond Pre-shake', size: 3, foreman: '— hiring —', color: '#C58A5A' },
  ];
  const activeCrew = crews.find(c => c.k === crew);
  const types = [
    { k: 'work', l: 'Work shift', d: 'Standard work day for crew', i: 'badge' },
    { k: 'training', l: 'Training', d: 'WPS, heat illness, equipment', i: 'graduate' },
    { k: 'off', l: 'Day off', d: 'Block date for entire crew', i: 'minus' },
    { k: 'holiday', l: 'Holiday / paid', d: 'Federal or company holiday', i: 'spark' },
  ];

  /* Hours computed */
  const hoursPerDay = (() => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  })();
  const dayCount = Object.values(days).filter(Boolean).length;
  const totalHours = (hoursPerDay * dayCount * activeCrew.size).toFixed(0);

  const Field = ({ label, sub, children, span = 1 }) => (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-ink-3)', fontWeight: 700, marginBottom: 6 }}>{label}</label>
      {children}
      {sub && <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: 14, fontFamily: 'inherit',
    border: '1px solid var(--c-line)', borderRadius: 10, background: 'white', outline: 'none',
  };
  const Section = ({ id, title, sub, children }) => (
    <section id={id} style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 16, padding: 26, marginBottom: 18, scrollMarginTop: 90 }}>
      <header style={{ marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--c-line)' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--f-display)', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 400 }}>{title}</h2>
        {sub && <div style={{ fontSize: 13, color: 'var(--c-ink-3)', marginTop: 4 }}>{sub}</div>}
      </header>
      {children}
    </section>
  );

  return (
    <EmployerPage active="crews" topBarCta={
      <div style={{ display: 'flex', gap: 8 }}>
        <a href="AgConnect Employer Crews.html" style={{ background: 'transparent', border: '1px solid var(--c-line)', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none', color: 'var(--c-ink-2)' }}>Cancel</a>
        <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>
          <Icon name="check" size={14}/> Save shift
        </button>
      </div>
    }>
      {/* Breadcrumbs + title */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--c-ink-3)', marginBottom: 8 }}>
          <a href="AgConnect Employer Crews.html" style={{ color: 'inherit', textDecoration: 'none' }}>Crews & shifts</a>
          <Icon name="arrow" size={10}/>
          <span>{activeCrew.l.split('·')[0].trim()}</span>
          <Icon name="arrow" size={10}/>
          <span style={{ color: 'var(--c-ink-2)', fontWeight: 600 }}>Edit shift · Tue Aug 5</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <span className="section-num">Shift editor · existing shift</span>
            <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--f-display)', fontSize: 44, letterSpacing: '-0.025em', fontWeight: 400, lineHeight: 1.05 }}>
              Edit <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>shift</em>
            </h1>
            <div style={{ fontSize: 13.5, color: 'var(--c-ink-2)', marginTop: 4 }}>{activeCrew.l} · 14 confirmed · 1 spot open · changes notify crew via SMS</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="copy" size={14}/> Duplicate
            </button>
            <button style={{ background: 'white', border: '1px solid #FECACA', color: '#991B1B', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="close" size={14}/> Cancel shift
            </button>
          </div>
        </div>
      </div>

      <div className="editor-grid">
        {/* Section nav */}
        <nav className="editor-nav" style={{ position: 'sticky', top: 88, background: 'transparent', padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { id: 'type', l: 'Shift type' },
            { id: 'crew', l: 'Crew' },
            { id: 'date', l: 'Date & time' },
            { id: 'loc', l: 'Location' },
            { id: 'logistics', l: 'Logistics' },
            { id: 'safety', l: 'Safety rules' },
            { id: 'notify', l: 'Notifications' },
          ].map((s, i) => (
            <a key={s.id} href={`#${s.id}`} style={{
              padding: '7px 10px', fontSize: 12.5, color: i === 0 ? 'var(--c-primary)' : 'var(--c-ink-2)',
              fontWeight: i === 0 ? 700 : 500, textDecoration: 'none', borderRadius: 6,
              borderLeft: i === 0 ? '2px solid var(--c-primary)' : '2px solid transparent',
              background: i === 0 ? 'var(--c-primary-soft)' : 'transparent',
            }}>{s.l}</a>
          ))}
        </nav>

        {/* Main form */}
        <div>
          {/* TYPE */}
          <Section id="type" title="Shift type" sub="Used to color-code the schedule grid and route notifications.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {types.map(t => {
                const sel = shiftType === t.k;
                return (
                  <button key={t.k} onClick={() => setShiftType(t.k)} style={{
                    padding: 14, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    border: sel ? '2px solid var(--c-primary)' : '1px solid var(--c-line)',
                    background: sel ? 'var(--c-primary-soft)' : 'white',
                  }}>
                    <Icon name={t.i} size={18} color={sel ? 'var(--c-primary)' : 'var(--c-ink-3)'}/>
                    <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 8 }}>{t.l}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 2 }}>{t.d}</div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* CREW */}
          <Section id="crew" title="Assign crew" sub="Pick the crew you're scheduling. Foreman + roster are pre-loaded.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {crews.map(c => {
                const sel = c.k === crew;
                return (
                  <button key={c.k} onClick={() => setCrew(c.k)} style={{
                    padding: 14, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    border: sel ? '2px solid var(--c-primary)' : '1px solid var(--c-line)',
                    background: sel ? 'var(--c-primary-soft)' : 'white',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: c.color, color: 'white', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 400, flexShrink: 0 }}>{c.k}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.l}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 2 }}>{c.foreman} · {c.size} workers</div>
                    </div>
                    {sel && <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--c-primary)', color: 'white', display: 'grid', placeItems: 'center' }}><Icon name="check" size={12}/></div>}
                  </button>
                );
              })}
            </div>
            <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 12.5, color: 'var(--c-primary)', fontWeight: 600, textDecoration: 'none' }}>
              <Icon name="plus" size={12}/> Create new crew instead
            </a>
          </Section>

          {/* DATE */}
          <Section id="date" title="Date & time" sub="Recurring shifts roll out automatically. Heat advisory rules adjust break schedule.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              <Field label="Start date">
                <input type="date" defaultValue="2026-05-05" style={inputStyle}/>
              </Field>
              <Field label="End date">
                <input type="date" defaultValue="2026-05-09" style={inputStyle}/>
              </Field>
              <Field label="Start time">
                <input type="time" value={start} onChange={e => setStart(e.target.value)} style={inputStyle}/>
              </Field>
              <Field label="End time">
                <input type="time" value={end} onChange={e => setEnd(e.target.value)} style={inputStyle}/>
              </Field>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-ink-3)', fontWeight: 700, marginBottom: 8 }}>Repeat days</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.keys(days).map(d => {
                  const on = days[d];
                  return (
                    <button key={d} onClick={() => setDays({ ...days, [d]: !on })} style={{
                      flex: 1, padding: '12px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      border: on ? '0' : '1px solid var(--c-line)',
                      background: on ? 'var(--c-ink)' : 'white',
                      color: on ? 'var(--c-bg)' : 'var(--c-ink-2)', cursor: 'pointer',
                    }}>{d}</button>
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14, padding: 14, background: 'var(--c-bg-warm)', borderRadius: 10 }}>
                <div><div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Hours / day</div><div style={{ fontFamily: 'var(--f-mono)', fontSize: 18, fontWeight: 700, marginTop: 4 }}>{hoursPerDay.toFixed(1)} h</div></div>
                <div><div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Active days</div><div style={{ fontFamily: 'var(--f-mono)', fontSize: 18, fontWeight: 700, marginTop: 4 }}>{dayCount}</div></div>
                <div><div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Total crew hours</div><div style={{ fontFamily: 'var(--f-mono)', fontSize: 18, fontWeight: 700, marginTop: 4, color: 'var(--c-primary)' }}>{totalHours} h</div></div>
              </div>
            </div>
          </Section>

          {/* LOCATION */}
          <Section id="loc" title="Location" sub="Workers see this in their shift card. Map sent via SMS.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Block / parcel">
                <input value={block} onChange={e => setBlock(e.target.value)} style={inputStyle}/>
              </Field>
              <Field label="GPS / address">
                <input defaultValue="36.952°N 120.118°W · Madera, CA" style={inputStyle}/>
              </Field>
            </div>
            {/* Mini map */}
            <div style={{ marginTop: 14, height: 180, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--c-line)', position: 'relative', background: 'linear-gradient(135deg, #E8E4D5 0%, #DDD7BE 100%)' }}>
              <svg viewBox="0 0 600 200" style={{ width: '100%', height: '100%' }}>
                {/* Field grid */}
                {[0, 1, 2, 3, 4, 5].map(c => (
                  [0, 1, 2].map(r => (
                    <rect key={`${c}-${r}`} x={c * 100 + 4} y={r * 65 + 4} width="92" height="58" fill={r === 0 && c === 1 ? 'var(--c-primary)' : 'rgba(15,110,86,0.18)'} stroke="rgba(15,110,86,0.4)" strokeWidth="1" rx="3"/>
                  ))
                ))}
                {/* Roads */}
                <path d="M0 134 L600 134" stroke="#FAFAF8" strokeWidth="6"/>
                <path d="M104 0 L104 200" stroke="#FAFAF8" strokeWidth="4"/>
                {/* Pickup marker */}
                <g transform="translate(60, 134)">
                  <circle r="14" fill="var(--c-accent)"/>
                  <text textAnchor="middle" y="4" fill="var(--c-ink)" fontSize="11" fontWeight="700">P</text>
                </g>
                {/* Block marker */}
                <g transform="translate(150, 35)">
                  <circle r="14" fill="var(--c-ink)"/>
                  <text textAnchor="middle" y="4" fill="var(--c-bg)" fontSize="10" fontWeight="700">7N</text>
                </g>
              </svg>
              <div style={{ position: 'absolute', bottom: 10, right: 10, padding: '4px 10px', background: 'rgba(255,255,255,0.92)', borderRadius: 999, fontSize: 11, fontFamily: 'var(--f-mono)', fontWeight: 700 }}>0.4 mi · 2 min drive</div>
            </div>
          </Section>

          {/* LOGISTICS */}
          <Section id="logistics" title="Pickup & logistics" sub="Crew transport, equipment, foreman briefing.">
            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ padding: 14, border: '1px solid var(--c-line)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={pickup} onChange={e => setPickup(e.target.checked)} style={{ accentColor: 'var(--c-primary)', width: 18, height: 18 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>Pickup point provided</div>
                  <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)' }}>Hwy 99 turnout · 5:30 AM · 10 minutes before shift start</div>
                </div>
                <button style={{ padding: '6px 10px', fontSize: 11, borderRadius: 6, border: '1px solid var(--c-line)', background: 'white', cursor: 'pointer' }}>Edit point</button>
              </label>
              <label style={{ padding: 14, border: '1px solid var(--c-line)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--c-primary)', width: 18, height: 18 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>Equipment provided</div>
                  <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)' }}>Picking buckets, crates, gloves — workers bring boots & hat</div>
                </div>
              </label>
              <label style={{ padding: 14, border: '1px solid var(--c-line)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--c-primary)', width: 18, height: 18 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>Lunch + snacks provided</div>
                  <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)' }}>Cold tortas + agua de jamaica · 11:30 AM lunch</div>
                </div>
              </label>
            </div>
          </Section>

          {/* SAFETY */}
          <Section id="safety" title="Safety rules" sub="Cal/OSHA heat illness prevention is automatic when forecast exceeds 95°F.">
            <div style={{ padding: 16, background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', borderRadius: 12, marginBottom: 14, display: 'flex', gap: 14, alignItems: 'center' }}>
              <Icon name="sun" size={26} color="#92400E"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#7C2D12' }}>Heat advisory expected — 102°F forecast for Tue Aug 5</div>
                <div style={{ fontSize: 12, color: '#92400E', marginTop: 3 }}>Auto-applied: 11:30 AM lunch · 10-min shade breaks at 9 AM and 1 PM · earlier 2 PM stop if temps spike</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                <input type="checkbox" checked={heat} onChange={e => setHeat(e.target.checked)} style={{ accentColor: 'var(--c-accent-deep)' }}/>
                Auto-apply
              </label>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { l: 'WPS pesticide pre-entry interval check', s: 'Last application: Block 7-N · Jul 28 · cleared', ok: true },
                { l: 'Required PPE briefing', s: 'Hat, sunscreen, water bottle confirmed in pre-shift huddle', ok: true },
                { l: 'Emergency contacts loaded', s: 'Foreman M. Vargas + 911 + clinic at 8.4 mi', ok: true },
                { l: 'Restroom access', s: 'Mobile unit at pickup · within 5 min walk', ok: true },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--c-bg)', borderRadius: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--c-primary-soft)', color: 'var(--c-primary)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="check" size={10}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{r.l}</div>
                    <div style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>{r.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* NOTIFICATIONS */}
          <Section id="notify" title="Notifications" sub="Pick how the crew is reminded — auto-translates to Spanish.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { l: 'SMS · evening before', d: '6 PM day before shift', i: 'phone', on: true },
                { l: 'WhatsApp · morning of', d: '4 AM with map link', i: 'chat', on: true },
                { l: 'Foreman roll call', d: 'Push to foreman to confirm head count', i: 'badge', on: true },
              ].map((n, i) => (
                <div key={i} style={{ padding: 14, border: n.on ? '1px solid var(--c-primary)' : '1px solid var(--c-line)', background: n.on ? 'var(--c-primary-soft)' : 'white', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Icon name={n.i} size={16} color={n.on ? 'var(--c-primary)' : 'var(--c-ink-3)'}/>
                    <div style={{ width: 30, height: 18, borderRadius: 999, background: n.on ? 'var(--c-primary)' : 'var(--c-line)', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 2, left: n.on ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: 'white' }}/>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{n.l}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-ink-3)', marginTop: 2 }}>{n.d}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 14, background: 'var(--c-bg-warm)', borderRadius: 10, fontSize: 12, color: 'var(--c-ink-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="globe" size={14} color="var(--c-primary)"/>
              <span>Auto-translate <strong style={{ color: 'var(--c-ink)' }}>EN ⇄ ES</strong> — 12 of 14 crew members prefer Spanish</span>
            </div>
          </Section>
        </div>

        {/* Sticky preview rail */}
        <aside className="editor-rail" style={{ position: 'sticky', top: 88 }}>
          <div style={{ background: 'var(--c-ink)', borderRadius: 16, padding: 16, color: 'var(--c-bg)' }}>
            <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-accent)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Worker preview · SMS card</div>
            <div style={{ background: 'var(--c-bg)', color: 'var(--c-ink)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: 'var(--c-primary)', color: 'white', fontWeight: 700, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em' }}>SHIFT</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)' }}>Tue Aug 5</span>
              </div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, letterSpacing: '-0.01em', lineHeight: 1.15, fontWeight: 400 }}>Grape Harvest · Block 7-North</div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--c-line)', display: 'grid', gap: 6, fontSize: 11.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--c-ink-3)' }}>Time</span><strong>{start} – {end}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--c-ink-3)' }}>Pickup</span><strong>5:30 AM · Hwy 99</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--c-ink-3)' }}>Pay</span><strong>$22.50/hr + bonus</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--c-ink-3)' }}>Bring</span><strong>Boots, hat</strong></div>
              </div>
              <div style={{ marginTop: 12, padding: '8px 10px', background: '#FEF3C7', borderRadius: 6, fontSize: 11, color: '#7C2D12', fontWeight: 600 }}>
                ⚠ 102°F forecast — extra shade breaks at 9 AM + 1 PM
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                <button style={{ flex: 1, padding: '8px', background: 'var(--c-primary)', color: 'white', border: 0, borderRadius: 6, fontSize: 11, fontWeight: 700 }}>✓ Confirm</button>
                <button style={{ flex: 1, padding: '8px', background: 'white', border: '1px solid var(--c-line)', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Can't make it</button>
              </div>
            </div>

            <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(250,250,248,0.7)', lineHeight: 1.5 }}>
              Sent <strong style={{ color: 'var(--c-bg)' }}>14 minutes</strong> before shift confirmation deadline. Includes auto-translated Spanish version.
            </div>
          </div>

          <div style={{ marginTop: 14, padding: 14, background: 'white', border: '1px solid var(--c-line)', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Confirmations</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 8, background: 'var(--c-bg-warm)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '93%', background: 'linear-gradient(90deg, var(--c-primary), var(--c-accent))' }}/>
              </div>
              <span style={{ fontSize: 12, fontFamily: 'var(--f-mono)', fontWeight: 700 }}>13/14</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)' }}>1 spot open · auto-fill from waitlist enabled</div>
          </div>
        </aside>
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'sticky', bottom: 0, marginTop: 24, padding: '16px 0', background: 'rgba(250,250,248,0.92)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>Last edited 2 min ago · auto-saved</span>
        <div style={{ flex: 1 }}/>
        <a href="AgConnect Employer Crews.html" style={{ background: 'transparent', border: '1px solid var(--c-line)', borderRadius: 999, padding: '10px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none', color: 'var(--c-ink-2)' }}>Cancel</a>
        <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save & don't notify</button>
        <button style={{ background: 'var(--c-ink)', color: 'var(--c-bg)', border: 0, borderRadius: 999, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="check" size={14}/> Save & notify crew
        </button>
      </div>
    </EmployerPage>
  );
};
window.EditShiftPage = EditShiftPage;
