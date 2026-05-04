/* Employer Edit Crew page — for adding new or editing existing crews */

const EditCrewPage = () => {
  const [foreman, setForeman] = React.useState('manuel');
  const [color, setColor] = React.useState('grape');
  const [skill, setSkill] = React.useState({ forklift: true, cdl: false, wps: true, bilingual: true, lead: false, irrigation: false });

  const foremen = [
    { k: 'manuel', n: 'Manuel Vargas', sub: '12 yrs · Crew A current · ★ 4.8', init: 'MV' },
    { k: 'lucia', n: 'Lucia Mendez', sub: '8 yrs · Crew B current · ★ 4.7', init: 'LM' },
    { k: 'tomas', n: 'Tomás Ríos', sub: '15 yrs · Crew C current · ★ 4.6', init: 'TR' },
    { k: 'new', n: 'Hire a foreman', sub: 'Open posting · 6 candidates available', init: '+' },
  ];
  const colors = [
    { k: 'grape', l: 'Grape', v: '#6B2B5E' },
    { k: 'almond', l: 'Almond', v: '#C58A5A' },
    { k: 'citrus', l: 'Citrus', v: '#E07A1F' },
    { k: 'tomato', l: 'Tomato', v: '#C73E2A' },
    { k: 'lettuce', l: 'Lettuce', v: '#4A8C3A' },
    { k: 'olive', l: 'Olive', v: 'var(--c-primary)' },
  ];
  const roster = [
    { n: 'Manuel Vargas', r: 'Foreman', exp: '12 yr', rate: 4.8, init: 'MV', lock: true },
    { n: 'Carmen Rojas', r: 'Picker', exp: '5 yr', rate: 4.6, init: 'CR' },
    { n: 'Pedro Estrella', r: 'Picker', exp: '8 yr', rate: 4.7, init: 'PE' },
    { n: 'Rosa Aguilar', r: 'Picker', exp: '4 yr', rate: 4.5, init: 'RA' },
    { n: 'Joaquín Núñez', r: 'Driver', exp: '8 yr', rate: 4.9, init: 'JN' },
    { n: 'Soledad Saavedra', r: 'Sort', exp: '3 yr', rate: 4.4, init: 'SS' },
    { n: 'Beto Villalobos', r: 'Sort', exp: '6 yr', rate: 4.7, init: 'BV' },
    { n: 'Lupita Pérez', r: 'Picker', exp: '2 yr', rate: 4.3, init: 'LP' },
    { n: 'Ana Castillo', r: 'Picker', exp: '5 yr', rate: 4.6, init: 'AC' },
    { n: 'Diego Morales', r: 'Picker', exp: '4 yr', rate: 4.5, init: 'DM' },
    { n: 'Marisol Vega', r: 'Picker', exp: '3 yr', rate: 4.4, init: 'MV' },
    { n: 'Hector Cruz', r: 'Picker', exp: '6 yr', rate: 4.6, init: 'HC' },
    { n: 'Yolanda Reyes', r: 'Picker', exp: '5 yr', rate: 4.5, init: 'YR' },
    { n: 'Fernando Acosta', r: 'Picker', exp: '4 yr', rate: 4.4, init: 'FA' },
  ];

  const Section = ({ id, title, sub, children }) => (
    <section id={id} style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 16, padding: 26, marginBottom: 18, scrollMarginTop: 90 }}>
      <header style={{ marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--c-line)' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--f-display)', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 400 }}>{title}</h2>
        {sub && <div style={{ fontSize: 13, color: 'var(--c-ink-3)', marginTop: 4 }}>{sub}</div>}
      </header>
      {children}
    </section>
  );
  const inputStyle = { width: '100%', padding: '11px 14px', fontSize: 14, fontFamily: 'inherit', border: '1px solid var(--c-line)', borderRadius: 10, background: 'white', outline: 'none' };
  const Field = ({ label, sub, children, span = 1 }) => (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-ink-3)', fontWeight: 700, marginBottom: 6 }}>{label}</label>
      {children}
      {sub && <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
  const activeColor = colors.find(c => c.k === color);

  return (
    <EmployerPage active="crews" topBarCta={
      <div style={{ display: 'flex', gap: 8 }}>
        <a href="AgConnect Employer Crews.html" style={{ background: 'transparent', border: '1px solid var(--c-line)', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none', color: 'var(--c-ink-2)' }}>Cancel</a>
        <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>
          <Icon name="check" size={14}/> Save crew
        </button>
      </div>
    }>
      {/* Breadcrumbs + title */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--c-ink-3)', marginBottom: 8 }}>
          <a href="AgConnect Employer Crews.html" style={{ color: 'inherit', textDecoration: 'none' }}>Crews & shifts</a>
          <Icon name="arrow" size={10}/>
          <span style={{ color: 'var(--c-ink-2)', fontWeight: 600 }}>Crew A · edit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <span className="section-num">Crew editor · 14 members</span>
            <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--f-display)', fontSize: 44, letterSpacing: '-0.025em', fontWeight: 400, lineHeight: 1.05 }}>
              Crew A · <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>Grape Harvest</em>
            </h1>
            <div style={{ fontSize: 13.5, color: 'var(--c-ink-2)', marginTop: 4 }}>Foreman M. Vargas · 4.8 ★ avg · 4.2 lb/min · 1,187 hrs season-to-date</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="copy" size={14}/> Duplicate crew
            </button>
            <button style={{ background: 'white', border: '1px solid #FECACA', color: '#991B1B', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="close" size={14}/> Disband
            </button>
          </div>
        </div>
      </div>

      <div className="editor-grid">
        {/* Section nav */}
        <nav className="editor-nav" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { id: 'basics', l: 'Basics' },
            { id: 'foreman', l: 'Foreman' },
            { id: 'roster', l: 'Roster · 14' },
            { id: 'skills', l: 'Required skills' },
            { id: 'pay', l: 'Pay defaults' },
            { id: 'comms', l: 'Communication' },
          ].map((s, i) => (
            <a key={s.id} href={`#${s.id}`} style={{
              padding: '7px 10px', fontSize: 12.5, color: i === 0 ? 'var(--c-primary)' : 'var(--c-ink-2)',
              fontWeight: i === 0 ? 700 : 500, textDecoration: 'none', borderRadius: 6,
              borderLeft: i === 0 ? '2px solid var(--c-primary)' : '2px solid transparent',
              background: i === 0 ? 'var(--c-primary-soft)' : 'transparent',
            }}>{s.l}</a>
          ))}
        </nav>

        {/* Main */}
        <div>
          {/* BASICS */}
          <Section id="basics" title="Basics" sub="Crew identity used across schedule, payroll, and worker app.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Crew name" sub="Workers see this in their app">
                <input defaultValue="Crew A · Grape Harvest" style={inputStyle}/>
              </Field>
              <Field label="Short code" sub="Used on schedule grid, max 4 chars">
                <input defaultValue="A" style={{ ...inputStyle, fontFamily: 'var(--f-mono)', fontWeight: 700 }}/>
              </Field>
              <Field label="Crew type">
                <select defaultValue="harvest" style={inputStyle}>
                  <option value="harvest">Harvest crew</option>
                  <option value="setup">Vineyard setup</option>
                  <option value="sort">Sort line / packing</option>
                  <option value="irrigation">Irrigation</option>
                  <option value="pruning">Pruning</option>
                  <option value="general">General labor</option>
                </select>
              </Field>
              <Field label="Primary crop">
                <select defaultValue="grape" style={inputStyle}>
                  <option value="grape">Grape</option>
                  <option value="almond">Almond</option>
                  <option value="citrus">Citrus</option>
                  <option value="tomato">Tomato</option>
                  <option value="lettuce">Leafy greens</option>
                  <option value="strawberry">Strawberry</option>
                </select>
              </Field>
            </div>
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-ink-3)', fontWeight: 700, marginBottom: 8 }}>Schedule color</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {colors.map(c => (
                  <button key={c.k} onClick={() => setColor(c.k)} title={c.l} style={{
                    width: 36, height: 36, borderRadius: 10, border: color === c.k ? '3px solid var(--c-ink)' : '1px solid var(--c-line)',
                    background: c.v, cursor: 'pointer', padding: 0,
                  }}/>
                ))}
              </div>
            </div>
          </Section>

          {/* FOREMAN */}
          <Section id="foreman" title="Foreman" sub="The foreman manages the roster, runs the daily huddle, and confirms head count.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {foremen.map(f => {
                const sel = foreman === f.k;
                const isNew = f.k === 'new';
                return (
                  <button key={f.k} onClick={() => setForeman(f.k)} style={{
                    padding: 14, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    border: sel ? '2px solid var(--c-primary)' : '1px solid var(--c-line)',
                    background: sel ? 'var(--c-primary-soft)' : (isNew ? 'var(--c-bg-warm)' : 'white'),
                    borderStyle: isNew && !sel ? 'dashed' : 'solid',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: isNew ? 'var(--c-line)' : 'var(--c-ink)', color: isNew ? 'var(--c-ink-2)' : 'white', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-mono)', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{f.init}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{f.n}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 2 }}>{f.sub}</div>
                    </div>
                    {sel && !isNew && <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--c-primary)', color: 'white', display: 'grid', placeItems: 'center' }}><Icon name="check" size={12}/></div>}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ROSTER */}
          <Section id="roster" title="Roster · 14 members" sub="Drag to reorder · click ✕ to remove · last edit by Manuel V.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px', background: 'var(--c-bg-warm)', borderRadius: 10 }}>
              <Icon name="spark" size={14} color="var(--c-ink-3)"/>
              <input placeholder="Add worker by name, phone, or scan QR…" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 13, fontFamily: 'inherit' }}/>
              <button style={{ padding: '6px 12px', borderRadius: 999, background: 'var(--c-ink)', color: 'var(--c-bg)', border: 0, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="plus" size={11}/> Add
              </button>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {roster.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 32px 1.6fr 1fr 0.8fr 0.8fr 60px', gap: 12, padding: '10px 14px', alignItems: 'center', background: i === 0 ? 'var(--c-primary-soft)' : 'white', border: '1px solid var(--c-line)', borderRadius: 10 }}>
                  <div style={{ color: 'var(--c-ink-3)', fontSize: 14, cursor: 'grab', textAlign: 'center' }}>⋮⋮</div>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: p.lock ? 'var(--c-accent)' : 'var(--c-ink)', color: p.lock ? 'var(--c-ink)' : 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'var(--f-mono)' }}>{p.init}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p.n}
                      {p.lock && <span style={{ fontSize: 9, fontFamily: 'var(--f-mono)', padding: '1px 5px', borderRadius: 3, background: 'var(--c-accent)', color: 'var(--c-ink)', fontWeight: 700, letterSpacing: '0.06em' }}>FOREMAN</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>{p.r} · {p.exp}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(i % 3 === 0) && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'var(--c-bg-warm)', fontWeight: 600 }}>Forklift</span>}
                    {(i % 4 === 0) && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'var(--c-bg-warm)', fontWeight: 600 }}>Bilingual</span>}
                    {(i % 5 === 0) && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'var(--c-bg-warm)', fontWeight: 600 }}>WPS</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 700, color: 'var(--c-primary)' }}>★ {p.rate}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>{i < 13 ? 'Confirmed' : 'Wait-list'}</div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button title="Message" style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--c-line)', background: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="chat" size={11}/></button>
                    {!p.lock && <button title="Remove" style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #FECACA', background: 'white', color: '#991B1B', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="close" size={11}/></button>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: 14, border: '1px dashed var(--c-line-2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--c-bg)' }}>
              <Icon name="users" size={16} color="var(--c-primary)"/>
              <span style={{ fontSize: 12.5, color: 'var(--c-ink-2)', flex: 1 }}><strong>3 returning workers</strong> from last season available — Lola Reyes, Tito Mendoza, Estefania Cano</span>
              <button style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600, borderRadius: 999, background: 'var(--c-primary)', color: 'white', border: 0, cursor: 'pointer' }}>Invite all</button>
            </div>
          </Section>

          {/* SKILLS */}
          <Section id="skills" title="Required skills" sub="Workers without these can't be added — auto-checked from their profile.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { k: 'forklift', l: 'Forklift certified', d: '14/14 have it' },
                { k: 'cdl', l: 'CDL-A license', d: '2/14 have it' },
                { k: 'wps', l: 'WPS pesticide training', d: '14/14 current' },
                { k: 'bilingual', l: 'Bilingual EN/ES', d: '12/14 prefer ES' },
                { k: 'lead', l: 'Crew lead trained', d: '3/14 have it' },
                { k: 'irrigation', l: 'Drip irrigation cert', d: '4/14 have it' },
              ].map(s => {
                const on = skill[s.k];
                return (
                  <label key={s.k} style={{ padding: 14, borderRadius: 10, border: on ? '1px solid var(--c-primary)' : '1px solid var(--c-line)', background: on ? 'var(--c-primary-soft)' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={on} onChange={() => setSkill({ ...skill, [s.k]: !on })} style={{ accentColor: 'var(--c-primary)', width: 16, height: 16 }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s.l}</div>
                      <div style={{ fontSize: 11, color: 'var(--c-ink-3)', marginTop: 2 }}>{s.d}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </Section>

          {/* PAY */}
          <Section id="pay" title="Pay defaults" sub="Override per-shift. Used in the take-home estimator and payroll.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <Field label="Base wage">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-ink-3)' }}>$</span>
                  <input defaultValue="22.50" style={{ ...inputStyle, paddingLeft: 26 }}/>
                </div>
              </Field>
              <Field label="Piece rate (per lb)">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-ink-3)' }}>$</span>
                  <input defaultValue="0.18" style={{ ...inputStyle, paddingLeft: 26 }}/>
                </div>
              </Field>
              <Field label="Foreman premium">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-ink-3)' }}>+$</span>
                  <input defaultValue="3.00/hr" style={{ ...inputStyle, paddingLeft: 32 }}/>
                </div>
              </Field>
            </div>
          </Section>

          {/* COMMS */}
          <Section id="comms" title="Communication" sub="How notifications reach this crew. Auto-translates EN ⇄ ES.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { t: 'Group chat', d: 'Crew + foreman in one thread', i: 'chat', on: true },
                { t: 'Daily SMS digest', d: 'Tomorrow\'s shift sent at 6 PM', i: 'phone', on: true },
                { t: 'WhatsApp foreman channel', d: 'Foreman manages outside app', i: 'globe', on: true },
                { t: 'Voice call broadcast', d: 'Recorded msg for emergencies', i: 'phone', on: false },
              ].map((c, i) => (
                <label key={i} style={{ padding: 14, borderRadius: 10, border: c.on ? '1px solid var(--c-primary)' : '1px solid var(--c-line)', background: c.on ? 'var(--c-primary-soft)' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon name={c.i} size={16} color={c.on ? 'var(--c-primary)' : 'var(--c-ink-3)'}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.t}</div>
                    <div style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>{c.d}</div>
                  </div>
                  <div style={{ width: 30, height: 18, borderRadius: 999, background: c.on ? 'var(--c-primary)' : 'var(--c-line)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 2, left: c.on ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: 'white' }}/>
                  </div>
                </label>
              ))}
            </div>
          </Section>
        </div>

        {/* Right rail */}
        <aside className="editor-rail" style={{ position: 'sticky', top: 88, display: 'grid', gap: 14 }}>
          {/* Crew identity card */}
          <div style={{ background: activeColor.v, borderRadius: 16, padding: 20, color: 'white', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.15), transparent 60%)' }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 64, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.04em' }}>A</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>Grape Harvest</div>
              <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 2 }}>14 confirmed · Foreman M. Vargas</div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><div style={{ fontSize: 10, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>Avg rate</div><div style={{ fontFamily: 'var(--f-mono)', fontSize: 16, fontWeight: 700, marginTop: 2 }}>★ 4.8</div></div>
                <div><div style={{ fontSize: 10, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>Yield</div><div style={{ fontFamily: 'var(--f-mono)', fontSize: 16, fontWeight: 700, marginTop: 2 }}>4.2 lb/min</div></div>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Last 14 days yield</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
              {[58, 64, 72, 68, 80, 76, 84, 82, 88, 92, 86, 94, 90, 96].map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${v}%`, background: i === 13 ? 'var(--c-accent)' : 'var(--c-primary)', opacity: i === 13 ? 1 : 0.45 + i * 0.04, borderRadius: 1 }}/>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--c-ink-2)' }}>
              <strong style={{ color: 'var(--c-primary)' }}>+18%</strong> vs season avg · top 10% county-wide
            </div>
          </div>

          {/* Activity log */}
          <div style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Activity</div>
            <div style={{ display: 'grid', gap: 10, fontSize: 11.5 }}>
              {[
                { t: 'Pedro E. joined crew', w: '2 hrs ago' },
                { t: 'Manuel V. confirmed shift Aug 5', w: 'Yesterday' },
                { t: 'Crew avg rating ↑ 4.7 → 4.8', w: '3 days ago' },
                { t: 'Carmen R. promoted to lead picker', w: 'Last week' },
              ].map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-primary)', marginTop: 6, flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--c-ink-2)' }}>{a.t}</div>
                    <div style={{ color: 'var(--c-ink-3)', fontSize: 10.5, fontFamily: 'var(--f-mono)' }}>{a.w}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'sticky', bottom: 0, marginTop: 24, padding: '16px 0', background: 'rgba(250,250,248,0.92)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>Last edited 8 min ago · auto-saved</span>
        <div style={{ flex: 1 }}/>
        <a href="AgConnect Employer Crews.html" style={{ background: 'transparent', border: '1px solid var(--c-line)', borderRadius: 999, padding: '10px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none', color: 'var(--c-ink-2)' }}>Cancel</a>
        <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save draft</button>
        <button style={{ background: 'var(--c-ink)', color: 'var(--c-bg)', border: 0, borderRadius: 999, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="check" size={14}/> Save crew
        </button>
      </div>
    </EmployerPage>
  );
};
window.EditCrewPage = EditCrewPage;
