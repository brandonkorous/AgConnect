/* Pages 4–8: Pay, Training, Documents, Messages */

/* ═══════════════════════════════════════════════════════════════
   4) PAY & TIMESHEETS
═══════════════════════════════════════════════════════════════ */
const PayPage = () => {
  const weeks = [
    { w: 'Jul 28 – Aug 3', hours: 49.5, gross: 1124.50, net: 982.16, status: 'Pending', employer: 'Sunridge Vineyards' },
    { w: 'Jul 21 – 27',    hours: 52.0, gross: 1248.00, net: 1086.40, status: 'Paid',    employer: 'Westside Orchards' },
    { w: 'Jul 14 – 20',    hours: 47.5, gross: 1140.00, net: 996.84,  status: 'Paid',    employer: 'Westside Orchards' },
    { w: 'Jul 7 – 13',     hours: 51.0, gross: 1147.50, net: 1003.41, status: 'Paid',    employer: 'Río Verde Farms' },
    { w: 'Jun 30 – Jul 6', hours: 44.0, gross: 990.00,  net: 866.25,  status: 'Paid',    employer: 'Río Verde Farms' },
  ];

  // 12 month bar chart
  const months = [
    ['Sep', 2.1], ['Oct', 2.8], ['Nov', 1.4], ['Dec', 0.9], ['Jan', 1.2], ['Feb', 1.6],
    ['Mar', 2.4], ['Apr', 3.1], ['May', 3.8], ['Jun', 4.2], ['Jul', 4.6], ['Aug', 1.1],
  ];
  const max = Math.max(...months.map(m => m[1]));

  return (
    <WorkerPage active="pay">
      <PageHeader
        eyebrow="YTD · 2026"
        title={<>Pay & <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>timesheets</em>.</>}
        sub="Every hour, every shift, every paystub. Download timesheets for tax filing or the EDD."
        right={
          <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
            <Icon name="download" size={14}/> Export 2026 W-2 packet
          </button>
        }
      />

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatTile label="YTD earnings" value="$28,420" sub="across 4 employers" accent="var(--c-primary)"/>
        <StatTile label="Hours worked" value="1,284" sub="32 weeks logged"/>
        <StatTile label="Avg hourly" value="$22.14" sub="incl. piece-rate bonus"/>
        <StatTile label="Next deposit" value="$982.16" sub="Friday Aug 8" accent="var(--c-accent-deep)"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 22, marginBottom: 22 }}>
        {/* Earnings chart */}
        <Card style={{ padding: 22 }}>
          <SectionHeading sub="Gross pay by month, in thousands USD"
            right={<div style={{ display: 'flex', gap: 6 }}>{['12 mo', '6 mo', 'YTD'].map((t, i) => <span key={t} style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 999, background: i === 0 ? 'var(--c-ink)' : 'var(--c-bg-warm)', color: i === 0 ? 'var(--c-bg)' : 'var(--c-ink-2)', fontWeight: 600, cursor: 'pointer' }}>{t}</span>)}</div>}>
            Earnings trend
          </SectionHeading>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 200, marginTop: 16, paddingBottom: 6, borderBottom: '1px solid var(--c-line)' }}>
            {months.map(([m, v], i) => (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)', fontWeight: 600 }}>${v.toFixed(1)}k</div>
                <div style={{ width: '100%', height: `${(v / max) * 160}px`, background: i === months.length - 1 ? 'var(--c-accent)' : 'var(--c-primary)', borderRadius: '6px 6px 2px 2px', opacity: i === months.length - 1 ? 1 : (0.5 + (i / months.length) * 0.5) }}/>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {months.map(([m]) => <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'var(--c-ink-3)', fontWeight: 600 }}>{m}</div>)}
          </div>
        </Card>

        {/* Next deposit hero */}
        <Card style={{ padding: 22, background: 'var(--c-primary)', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(245,158,11,0.28), transparent 60%)' }}/>
          <div style={{ position: 'relative' }}>
            <Eyebrow style={{ color: 'rgba(255,255,255,0.75)' }}>Next deposit · Friday Aug 8</Eyebrow>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 56, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 12 }}>$982<span style={{ opacity: 0.6, fontSize: 28 }}>.16</span></div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.18)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 12.5 }}>
              <div><div style={{ opacity: 0.7 }}>Gross</div><div style={{ fontWeight: 700, fontFamily: 'var(--f-mono)', marginTop: 2 }}>$1,124.50</div></div>
              <div><div style={{ opacity: 0.7 }}>Hours</div><div style={{ fontWeight: 700, fontFamily: 'var(--f-mono)', marginTop: 2 }}>49.5h</div></div>
              <div><div style={{ opacity: 0.7 }}>FIT + FICA</div><div style={{ fontWeight: 700, fontFamily: 'var(--f-mono)', marginTop: 2 }}>−$142.34</div></div>
              <div><div style={{ opacity: 0.7 }}>Method</div><div style={{ fontWeight: 700, fontFamily: 'var(--f-mono)', marginTop: 2 }}>Direct ••3471</div></div>
            </div>
            <button style={{ marginTop: 16, width: '100%', background: 'rgba(255,255,255,0.14)', color: 'white', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999, padding: '10px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
              <Icon name="download" size={13}/> Download paystub
            </button>
          </div>
        </Card>
      </div>

      {/* Pay history table */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionHeading sub="32 weeks · last 12 months">Weekly paystubs</SectionHeading>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>All employers ▾</button>
            <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Icon name="download" size={12}/> Export CSV
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 0.7fr 0.9fr 0.9fr 0.8fr 0.5fr', gap: 16, padding: '12px 20px', borderBottom: '1px solid var(--c-line)', fontSize: 10.5, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', color: 'var(--c-ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Pay period</span><span>Employer</span><span>Hours</span><span>Gross</span><span>Net</span><span>Status</span><span/>
        </div>
        {weeks.map((w, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 0.7fr 0.9fr 0.9fr 0.8fr 0.5fr', gap: 16, padding: '14px 20px', borderBottom: i < weeks.length - 1 ? '1px solid var(--c-line)' : '0', alignItems: 'center', fontSize: 13 }}>
            <div style={{ fontWeight: 600 }}>{w.w}</div>
            <div style={{ color: 'var(--c-ink-2)' }}>{w.employer}</div>
            <div style={{ fontFamily: 'var(--f-mono)' }}>{w.hours.toFixed(1)}</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, letterSpacing: '-0.02em' }}>${w.gross.toFixed(2)}</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, letterSpacing: '-0.02em', color: 'var(--c-primary)' }}>${w.net.toFixed(2)}</div>
            <div><Pill tone={w.status === 'Paid' ? 'success' : 'warning'}>{w.status}</Pill></div>
            <div style={{ textAlign: 'right' }}>
              <a href="#" style={{ fontSize: 12, color: 'var(--c-primary)', textDecoration: 'none', fontWeight: 600 }}>PDF →</a>
            </div>
          </div>
        ))}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 22 }}>
        <Card style={{ padding: 18 }}>
          <Eyebrow>Direct deposit</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-mono)', fontSize: 11, fontWeight: 700 }}>BOA</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Checking ••3471</div>
              <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)' }}>Bank of America · Verified</div>
            </div>
          </div>
          <button style={{ marginTop: 12, fontSize: 12, color: 'var(--c-primary)', background: 'transparent', border: 0, fontWeight: 700, cursor: 'pointer' }}>Manage payout method →</button>
        </Card>
        <Card style={{ padding: 18 }}>
          <Eyebrow>Tax documents</Eyebrow>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {['W-2 · Westside Orchards', 'W-2 · Río Verde Farms', '1099-MISC · Sunridge'].map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--c-line)' : '0' }}>
                <div style={{ fontSize: 12.5 }}>{d}</div>
                <Icon name="download" size={14} color="var(--c-ink-3)"/>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ padding: 18 }}>
          <Eyebrow>Wage transparency</Eyebrow>
          <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.5, color: 'var(--c-ink-2)' }}>
            Your average <strong style={{ color: 'var(--c-ink)' }}>$22.14/hr</strong> ranks in the top 18% of pickers in Madera County for 2026.
          </div>
          <button style={{ marginTop: 12, fontSize: 12, color: 'var(--c-primary)', background: 'transparent', border: 0, fontWeight: 700, cursor: 'pointer' }}>See county wage data →</button>
        </Card>
      </div>
    </WorkerPage>
  );
};

/* ═══════════════════════════════════════════════════════════════
   5) TRAINING
═══════════════════════════════════════════════════════════════ */
const TrainingPage = () => {
  const inProgress = { title: 'Forklift Operator Certification', provider: 'Reedley College', funder: 'CDFA-funded', progress: 38, sessions: '4 of 12 sessions complete', next: 'Tue Aug 7 · 9 AM' };
  const recommended = [
    { title: 'Pesticide Handler (WPS)', hours: 12, fund: 'CDFA', payBoost: '+$1.75/hr', icon: 'shield', color: 'var(--c-primary)' },
    { title: 'Tractor & Equipment Operator', hours: 24, fund: 'F3', payBoost: '+$3.00/hr', icon: 'truck', color: 'var(--c-accent-deep)' },
    { title: 'Heat Illness Prevention Lead', hours: 6, fund: 'CDFA', payBoost: 'Crew lead path', icon: 'sun', color: 'var(--c-primary)' },
    { title: 'Irrigation & Pump Tech', hours: 18, fund: 'F3', payBoost: '+$2.25/hr', icon: 'leaf', color: 'var(--c-primary)' },
  ];
  const completed = [
    { title: 'Heat Illness Prevention (entry)', date: 'Mar 2026', hours: 4, cert: 'AC-HIP-2402' },
    { title: 'Food Safety Modernization Act', date: 'Jan 2026', hours: 8, cert: 'AC-FSMA-2401' },
    { title: 'Sexual Harassment Prevention (AB 1825)', date: 'Nov 2025', hours: 2, cert: 'AC-SHP-2511' },
  ];

  return (
    <WorkerPage active="train">
      <PageHeader
        eyebrow="14 free programs in your area"
        title={<>Earn more, <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>learn more</em>.</>}
        sub="Free certifications funded by California Department of Food & Agriculture and the F3 initiative. Most pay a stipend during training."
        right={
          <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
            <Icon name="graduate" size={14}/> Browse all programs
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatTile label="In progress" value="1" sub="Forklift cert"/>
        <StatTile label="Hours completed" value="14" sub="of 32 in current cert"/>
        <StatTile label="Total certs" value="4" sub="lifetime" accent="var(--c-primary)"/>
        <StatTile label="Avg pay boost" value="+$2.50" sub="per hour, post-cert" accent="var(--c-accent-deep)"/>
      </div>

      {/* In-progress hero */}
      <Card style={{ padding: 24, marginBottom: 22, position: 'relative', overflow: 'hidden', background: 'var(--c-ink)', color: 'var(--c-bg)' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 100% at 100% 0%, rgba(245,158,11,0.22), transparent 60%)' }}/>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
          <div>
            <Eyebrow style={{ color: 'var(--c-accent)' }}>In progress · {inProgress.funder}</Eyebrow>
            <h2 style={{ margin: '8px 0 0', fontFamily: 'var(--f-display)', fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 400 }}>{inProgress.title}</h2>
            <div style={{ fontSize: 13.5, color: 'rgba(250,250,248,0.75)', marginTop: 4 }}>{inProgress.provider} · {inProgress.sessions}</div>

            <div style={{ marginTop: 18, height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${inProgress.progress}%`, background: 'var(--c-accent)' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, fontFamily: 'var(--f-mono)', color: 'rgba(255,255,255,0.7)' }}>
              <span>{inProgress.progress}% complete</span>
              <span>Next session: {inProgress.next}</span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button style={{ background: 'var(--c-accent)', color: 'var(--c-ink)', border: 0, borderRadius: 999, padding: '11px 18px', fontSize: 13.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                Continue lesson <Icon name="arrow" size={13}/>
              </button>
              <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: 'var(--c-bg)', borderRadius: 999, padding: '11px 18px', fontSize: 13.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Icon name="calendar" size={13}/> View schedule
              </button>
            </div>
          </div>
          <div style={{ width: 180, height: 180, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', position: 'relative' }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="64" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none"/>
              <circle cx="80" cy="80" r="64" stroke="var(--c-accent)" strokeWidth="10" fill="none" strokeDasharray={`${(inProgress.progress / 100) * 402} 402`} strokeLinecap="round" transform="rotate(-90 80 80)"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 36, lineHeight: 1, letterSpacing: '-0.025em' }}>{inProgress.progress}<span style={{ opacity: 0.5, fontSize: 18 }}>%</span></div>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', marginTop: 4 }}>COMPLETE</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recommended for you */}
      <SectionHeading sub="Funded by CDFA & F3 · Stipend during training">Recommended for you</SectionHeading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 24 }}>
        {recommended.map((p, i) => (
          <Card key={i} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center', flexShrink: 0, color: p.color }}>
                <Icon name={p.icon} size={24}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400 }}>{p.title}</div>
                  <Pill tone={p.fund === 'CDFA' ? 'warning' : 'primary'}>{p.fund}-funded</Pill>
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: 'var(--c-ink-3)', fontFamily: 'var(--f-mono)' }}>
                  <span>{p.hours} hrs</span>
                  <span>·</span>
                  <span style={{ color: 'var(--c-primary-deep)', fontWeight: 700 }}>{p.payBoost}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="btn btn-primary" style={{ fontSize: 12, padding: '7px 14px' }}>Enroll free</button>
                  <button style={{ background: 'transparent', border: '1px solid var(--c-line)', borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Learn more</button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Completed */}
      <SectionHeading sub="Show these to employers to qualify for higher-pay roles">Your certifications</SectionHeading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {completed.map((c, i) => (
          <Card key={i} style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Icon name="badge" size={24} color="var(--c-primary)"/>
              <Pill tone="success">Verified</Pill>
            </div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, lineHeight: 1.25, letterSpacing: '-0.015em', marginTop: 14 }}>{c.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 8, fontFamily: 'var(--f-mono)' }}>{c.cert} · {c.hours} hrs · Issued {c.date}</div>
            <button style={{ marginTop: 14, fontSize: 12, color: 'var(--c-primary)', background: 'transparent', border: 0, fontWeight: 700, cursor: 'pointer' }}>Download certificate →</button>
          </Card>
        ))}
      </div>
    </WorkerPage>
  );
};

/* ═══════════════════════════════════════════════════════════════
   6) DOCUMENTS
═══════════════════════════════════════════════════════════════ */
const DocumentsPage = () => {
  const groups = [
    { title: 'Identification', items: [
      { name: 'CA Driver License', meta: 'D1234567 · Exp Mar 2028', status: 'Verified', icon: 'badge' },
      { name: 'Social Security Card', meta: 'On file · Encrypted', status: 'Verified', icon: 'shield' },
      { name: 'I-9 Employment Eligibility', meta: 'Form completed Apr 2025', status: 'Verified', icon: 'check' },
    ]},
    { title: 'Work documents', items: [
      { name: 'Résumé', meta: 'Updated Jul 14, 2026', status: 'Current', icon: 'leaf' },
      { name: 'References (3)', meta: 'M. Vargas · J. Núñez · R. Aguilar', status: 'Current', icon: 'users' },
      { name: 'Direct deposit voided check', meta: 'BOA ••3471', status: 'Current', icon: 'cash' },
    ]},
    { title: 'Certifications', items: [
      { name: 'Heat Illness Prevention', meta: 'AC-HIP-2402 · Mar 2026', status: 'Verified', icon: 'sun' },
      { name: 'FSMA Produce Safety', meta: 'AC-FSMA-2401 · Jan 2026', status: 'Verified', icon: 'shield' },
      { name: 'AB 1825 Harassment Prev.', meta: 'AC-SHP-2511 · Nov 2025', status: 'Expiring soon', icon: 'badge' },
    ]},
  ];
  const tones = { Verified: 'success', Current: 'primary', 'Expiring soon': 'warning', Missing: 'danger' };

  return (
    <WorkerPage active="docs">
      <PageHeader
        eyebrow="Last verified Aug 1, 2026"
        title={<>Your <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>documents</em>.</>}
        sub="Stored securely and encrypted at rest. Share specific docs with employers without handing over your file."
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Icon name="download" size={14}/> Download all
            </button>
            <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
              <Icon name="plus" size={14}/> Upload document
            </button>
          </div>
        }
      />

      {/* Profile completeness */}
      <Card style={{ padding: 22, marginBottom: 22, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'center' }}>
        <div>
          <Eyebrow>Profile completeness</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 48, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--c-primary)' }}>92<span style={{ fontSize: 24, opacity: 0.5 }}>%</span></div>
            <div style={{ fontSize: 13.5, color: 'var(--c-ink-2)', maxWidth: 360 }}>You're <strong>top 14%</strong> of workers on AgConnect. A complete profile gets <strong style={{ color: 'var(--c-primary)' }}>3.4× more</strong> employer responses.</div>
          </div>
          <div style={{ marginTop: 18, height: 8, borderRadius: 999, background: 'var(--c-bg-warm)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '92%', background: 'var(--c-primary)' }}/>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            { l: 'Identity verified', done: true },
            { l: 'Banking on file', done: true },
            { l: 'References uploaded', done: true },
            { l: 'Profile photo', done: false },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: s.done ? 'var(--c-primary-soft)' : 'var(--c-bg-warm)' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: s.done ? 'var(--c-primary)' : 'transparent', border: s.done ? '0' : '1.5px dashed var(--c-line-2)', display: 'grid', placeItems: 'center', color: 'white', flexShrink: 0 }}>
                {s.done && <Icon name="check" size={11}/>}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, flex: 1, color: s.done ? 'var(--c-primary-deep)' : 'var(--c-ink-2)' }}>{s.l}</div>
              {!s.done && <a href="#" style={{ fontSize: 11.5, color: 'var(--c-primary)', fontWeight: 700, textDecoration: 'none' }}>Add →</a>}
            </div>
          ))}
        </div>
      </Card>

      {/* Document groups */}
      {groups.map((g, gi) => (
        <div key={g.title} style={{ marginBottom: 22 }}>
          <SectionHeading sub={`${g.items.length} on file`}>{g.title}</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {g.items.map((it, i) => (
              <Card key={i} style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--c-primary)' }}>
                    <Icon name={it.icon} size={18}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{it.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 3 }}>{it.meta}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--c-line)' }}>
                  <Pill tone={tones[it.status]}>{it.status}</Pill>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--c-ink-3)' }}>
                    <a href="#" style={{ color: 'var(--c-ink-2)', textDecoration: 'none' }}>View</a>
                    <a href="#" style={{ color: 'var(--c-ink-2)', textDecoration: 'none' }}>Share</a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Recent shares */}
      <SectionHeading sub="Audit trail of who saw which document">Recent document shares</SectionHeading>
      <Card style={{ overflow: 'hidden' }}>
        {[
          { who: 'Sunridge Vineyards', what: 'I-9, References', when: 'Jul 28, 2026 · 2:14 PM', status: 'Active' },
          { who: 'Westside Orchards', what: 'I-9, FSMA cert', when: 'Jul 24, 2026 · 9:02 AM', status: 'Active' },
          { who: 'Río Verde Farms', what: 'Direct deposit', when: 'Jul 11, 2026 · 11:30 AM', status: 'Revoked' },
        ].map((s, i, a) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 0.6fr 0.4fr', gap: 16, padding: '14px 20px', borderBottom: i < a.length - 1 ? '1px solid var(--c-line)' : '0', alignItems: 'center', fontSize: 13 }}>
            <div style={{ fontWeight: 600 }}>{s.who}</div>
            <div style={{ color: 'var(--c-ink-2)' }}>{s.what}</div>
            <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', fontFamily: 'var(--f-mono)' }}>{s.when}</div>
            <div><Pill tone={s.status === 'Active' ? 'success' : 'ghost'}>{s.status}</Pill></div>
            <div style={{ textAlign: 'right' }}><a href="#" style={{ fontSize: 12, color: 'var(--c-primary)', textDecoration: 'none', fontWeight: 600 }}>{s.status === 'Active' ? 'Revoke' : 'View'}</a></div>
          </div>
        ))}
      </Card>
    </WorkerPage>
  );
};

/* ═══════════════════════════════════════════════════════════════
   7) MESSAGES — inbox + thread
═══════════════════════════════════════════════════════════════ */
const MessagesPage = () => {
  const folders = [
    { k: 'all', l: 'All messages', n: 18 },
    { k: 'employers', l: 'Employers', n: 12 },
    { k: 'foremen', l: 'Foremen', n: 4 },
    { k: 'agconnect', l: 'AgConnect', n: 2 },
  ];
  const threads = [
    { from: 'Sunridge Vineyards', who: 'Marisol Vargas, Foreman', last: 'See you tomorrow at 6 AM. Bring water — it will be hot. Pickup at the Hwy 99 / Cleveland lot.', when: '2h', channel: 'WhatsApp', unread: true, active: true, init: 'SV' },
    { from: 'Westside Orchards', who: 'Hiring · Jorge Núñez', last: 'Interview confirmed for Thu 9 AM at 2110 Kansas Ave, Modesto. Park in the side lot.', when: '5h', channel: 'In-app', unread: true, init: 'WO' },
    { from: 'AgConnect', who: 'Training notification', last: 'Your Forklift cert seat opens next Mon. Reply YES to claim.', when: '5h', channel: 'SMS', unread: true, init: 'AC' },
    { from: 'Río Verde Farms', who: 'Hiring desk', last: 'Thanks for applying. Your application is under review — we\'ll respond within 48 hours.', when: '1d', channel: 'In-app', unread: false, init: 'RV' },
    { from: 'Coastal Berry LLC', who: 'Auto-reply', last: 'We received your application for Strawberry Pack House. Position fills fast — keep your phone on.', when: '2d', channel: 'SMS', unread: false, init: 'CB' },
    { from: 'AgConnect', who: 'Wage update', last: 'Median pay for grape harvest in Madera County is up 6% this season.', when: '3d', channel: 'In-app', unread: false, init: 'AC' },
    { from: 'Tulare Valley Citrus', who: 'Hiring · A. Aguilar', last: 'Application received. We\'ll be in touch when pruning season opens September 2.', when: '5d', channel: 'SMS', unread: false, init: 'TC' },
  ];
  const messages = [
    { from: 'them', body: '¡Hola Miguel! Welcome to the crew. Tomorrow we start at 6 AM sharp at the Hwy 99 lot.', time: 'Yesterday 4:32 PM' },
    { from: 'them', body: 'Bring sun protection, water (we will refill), gloves, and your boots. The forecast is 98°F.', time: 'Yesterday 4:33 PM' },
    { from: 'me', body: '¡Hola Marisol! Got it — I\'ll be there 5:45. Pickup at the same lot as last time?', time: 'Yesterday 6:18 PM' },
    { from: 'them', body: 'Yes, same lot. Look for the white Sunridge van. The other pickers are Carlos, Soledad, and Beto.', time: 'Yesterday 6:42 PM' },
    { from: 'them', body: 'See you tomorrow at 6 AM. Bring water — it will be hot. Pickup at the Hwy 99 / Cleveland lot.', time: '2h ago', latest: true },
  ];

  return (
    <WorkerPage active="msg">
      <PageHeader
        eyebrow="3 unread · 18 active conversations"
        title={<>Your <em style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}>messages</em>.</>}
        sub="One inbox for SMS, WhatsApp, and in-app messages from employers, foremen, and AgConnect."
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Icon name="check" size={14}/> Mark all read
            </button>
            <button className="btn btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
              <Icon name="plus" size={14}/> New message
            </button>
          </div>
        }
      />

      <Card style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1.4fr', minHeight: 640, overflow: 'hidden' }}>
        {/* Folders */}
        <div style={{ borderRight: '1px solid var(--c-line)', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {folders.map((f, i) => (
            <a key={f.k} href="#" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 8, textDecoration: 'none',
              background: i === 0 ? 'var(--c-bg-warm)' : 'transparent',
              color: i === 0 ? 'var(--c-ink)' : 'var(--c-ink-2)',
              fontSize: 12.5, fontWeight: i === 0 ? 600 : 500,
            }}>
              <span>{f.l}</span>
              <span style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--c-ink-3)' }}>{f.n}</span>
            </a>
          ))}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--c-line)', padding: '16px 10px 0' }}>
            <Eyebrow style={{ fontSize: 9.5, marginBottom: 8 }}>Channels</Eyebrow>
            {[
              { l: 'SMS', dot: 'var(--c-primary)' },
              { l: 'WhatsApp', dot: '#22c55e' },
              { l: 'In-app', dot: 'var(--c-accent)' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12, color: 'var(--c-ink-2)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }}/>
                {c.l}
              </div>
            ))}
          </div>
        </div>

        {/* Thread list */}
        <div style={{ borderRight: '1px solid var(--c-line)', overflow: 'auto' }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--c-line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--c-bg-warm)', borderRadius: 999, color: 'var(--c-ink-3)' }}>
              <Icon name="spark" size={13}/>
              <span style={{ fontSize: 12 }}>Search messages…</span>
            </div>
          </div>
          {threads.map((t, i) => (
            <div key={i} style={{
              padding: '14px 16px', borderBottom: i < threads.length - 1 ? '1px solid var(--c-line)' : '0',
              background: t.active ? 'var(--c-bg-warm)' : 'transparent', cursor: 'pointer',
              borderLeft: t.active ? '3px solid var(--c-primary)' : '3px solid transparent',
            }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.from === 'AgConnect' ? 'var(--c-ink)' : 'var(--c-primary)', color: 'white', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--f-mono)' }}>{t.init}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: t.unread ? 700 : 500, color: t.unread ? 'var(--c-ink)' : 'var(--c-ink-2)' }}>{t.from}</div>
                    <div style={{ fontSize: 10.5, color: t.unread ? 'var(--c-primary)' : 'var(--c-ink-3)', fontFamily: 'var(--f-mono)', fontWeight: 700, flexShrink: 0 }}>{t.when}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--c-ink-3)', marginTop: 1, fontStyle: 'italic' }}>{t.who}</div>
                  <div style={{ fontSize: 12, color: t.unread ? 'var(--c-ink-2)' : 'var(--c-ink-3)', marginTop: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.last}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <span style={{ fontSize: 9.5, fontFamily: 'var(--f-mono)', padding: '2px 6px', borderRadius: 4, background: 'white', color: 'var(--c-ink-3)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', border: '1px solid var(--c-line)' }}>{t.channel}</span>
                    {t.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-accent)' }}/>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Thread view */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Thread header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--c-primary)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'var(--f-mono)' }}>SV</div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>Sunridge Vineyards</div>
                <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)' }}>Marisol Vargas · Foreman · WhatsApp</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Icon name="phone" size={12}/> Call
              </button>
              <button style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Icon name="leaf" size={12}/> View job
              </button>
            </div>
          </div>

          {/* Pinned context card */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--c-line)', background: 'var(--c-bg-warm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'white', borderRadius: 10, border: '1px solid var(--c-line)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--c-bg-warm)', display: 'grid', placeItems: 'center' }}>
                <CropGlyph crop="grape" size={22}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Grape Harvest · Tomorrow 6 AM</div>
                <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)' }}>Hwy 99 / Cleveland Ave pickup · $22.50/hr</div>
              </div>
              <Pill tone="success">Confirmed</Pill>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', background: 'rgba(243, 239, 230, 0.3)' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '78%' }}>
                  <div style={{
                    background: m.from === 'me' ? 'var(--c-primary)' : 'white',
                    color: m.from === 'me' ? 'white' : 'var(--c-ink)',
                    padding: '10px 14px',
                    borderRadius: m.from === 'me' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    border: m.from === 'me' ? '0' : '1px solid var(--c-line)',
                    fontSize: 13.5, lineHeight: 1.5,
                    boxShadow: m.from === 'me' ? '0 2px 8px rgba(91, 110, 46, 0.18)' : '0 1px 2px rgba(0,0,0,0.04)',
                  }}>
                    {m.body}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--c-ink-3)', marginTop: 4, textAlign: m.from === 'me' ? 'right' : 'left', fontFamily: 'var(--f-mono)' }}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div style={{ padding: 16, borderTop: '1px solid var(--c-line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px 4px 14px', background: 'white', border: '1px solid var(--c-line)', borderRadius: 999 }}>
              <input placeholder="Reply to Marisol…" style={{ flex: 1, border: 0, outline: 0, fontSize: 13.5, background: 'transparent', fontFamily: 'inherit' }}/>
              <button style={{ background: 'transparent', border: 0, padding: 6, cursor: 'pointer', color: 'var(--c-ink-3)' }}><Icon name="badge" size={16}/></button>
              <button style={{ background: 'var(--c-primary)', color: 'white', border: 0, borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Send <Icon name="arrow" size={12}/>
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {['👍 Got it', '⏰ On my way', '📍 Need address', '❓ Question'].map((q, i) => (
                <button key={i} style={{ background: 'white', border: '1px solid var(--c-line)', borderRadius: 999, padding: '6px 12px', fontSize: 11.5, color: 'var(--c-ink-2)', fontWeight: 500, cursor: 'pointer' }}>{q}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </WorkerPage>
  );
};

Object.assign(window, { PayPage, TrainingPage, DocumentsPage, MessagesPage });
