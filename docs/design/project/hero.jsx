/* Nav + Hero with animated job-card stack */

const Nav = () => {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'rgba(250,250,248,0.85)' : 'transparent',
      backdropFilter: scrolled ? 'saturate(140%) blur(14px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'saturate(140%) blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--c-line)' : '1px solid transparent',
      transition: 'background .25s, border-color .25s'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        <a href="#" style={{ textDecoration: 'none' }}><Logo size={22} /></a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {['For Workers', 'For Employers', 'Training', 'Impact', 'About'].map((l) =>
          <a key={l} href={'#' + l.toLowerCase().replace(/ /g, '-')}
          style={{ fontSize: 14.5, color: 'var(--c-ink-2)', textDecoration: 'none', fontWeight: 450 }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--c-ink)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--c-ink-2)'}>
              {l}
            </a>
          )}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LangToggle />
          <a href="#cta" className="btn btn-primary" style={{ padding: '10px 16px', fontSize: 14 }}>
            Get the app
            <Icon name="arrow" size={14} />
          </a>
        </div>
      </div>
    </header>);

};

const LangToggle = () => {
  const [lang, setLang] = React.useState('EN');
  return (
    <div style={{
      display: 'inline-flex', padding: 3, borderRadius: 999,
      background: 'rgba(28,28,26,0.06)', fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.08em'
    }}>
      {['EN', 'ES'].map((l) =>
      <button key={l} onClick={() => setLang(l)} style={{
        border: 0, background: lang === l ? 'var(--c-ink)' : 'transparent',
        color: lang === l ? 'var(--c-bg)' : 'var(--c-ink-2)',
        padding: '6px 12px', borderRadius: 999, fontFamily: 'inherit', fontSize: 'inherit',
        letterSpacing: 'inherit', fontWeight: 600, transition: 'all .15s'
      }}>{l}</button>
      )}
    </div>);

};

/* Job-card stack — the focal hero visual */
const JOBS = [
{ id: 1, crop: 'grape', title: 'Grape Harvest', employer: 'Sunridge Vineyards', county: 'Madera County', pay: '$22.50/hr', payNote: '+ piece rate', start: 'Aug 12', spots: 14, badge: 'Verified', housing: true },
{ id: 2, crop: 'almond', title: 'Almond Shaking Crew', employer: 'Westside Orchards Co-op', county: 'Stanislaus County', pay: '$24.00/hr', payNote: 'guaranteed 50hr/wk', start: 'Aug 5', spots: 6, badge: 'Top employer', housing: false },
{ id: 3, crop: 'tomato', title: 'Cannery Tomato Pick', employer: 'Río Verde Farms', county: 'Yolo County', pay: '$20.75/hr', payNote: '+ overtime', start: 'Aug 18', spots: 22, badge: 'Verified', housing: true },
{ id: 4, crop: 'citrus', title: 'Navel Orange Pruning', employer: 'Tulare Valley Citrus', county: 'Tulare County', pay: '$21.50/hr', payNote: 'weekly pay', start: 'Sep 2', spots: 9, badge: 'Hiring fast', housing: false },
{ id: 5, crop: 'strawberry', title: 'Strawberry Pack House', employer: 'Coastal Berry LLC', county: 'Monterey County', pay: '$23.00/hr', payNote: 'shift bonus', start: 'Aug 9', spots: 18, badge: 'Verified', housing: true }];


const JobCard = ({ job, dim = false }) =>
<div style={{
  background: 'var(--c-card)',
  borderRadius: 'var(--r-lg)',
  border: '1px solid var(--c-line)',
  boxShadow: 'var(--shadow-card)',
  padding: 18,
  width: '100%',
  opacity: dim ? 0.85 : 1
}}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: 'var(--c-bg-warm)',
      display: 'grid', placeItems: 'center', flexShrink: 0
    }}>
        <CropGlyph crop={job.crop} size={26} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h4 style={{ margin: 0, fontSize: 16.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{job.title}</h4>
          <span style={{
          fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.08em',
          color: job.badge === 'Hiring fast' ? '#B45309' : 'var(--c-primary)',
          background: job.badge === 'Hiring fast' ? '#FEF3C7' : 'var(--c-primary-soft)',
          padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', fontWeight: 600,
          whiteSpace: 'nowrap'
        }}>
            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: 'currentColor', marginRight: 5, verticalAlign: 'middle' }} />
            {job.badge}
          </span>
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--c-ink-2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          {job.employer}
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--c-line-2)' }} />
          <Icon name="pin" size={12} color="var(--c-ink-3)" />
          {job.county}
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16, gap: 12 }}>
      <div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--c-ink)' }}>{job.pay}</div>
        <div style={{ fontSize: 11.5, color: 'var(--c-ink-3)', marginTop: 4 }}>{job.payNote}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>Starts</div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 13, fontWeight: 600 }}>{job.start}</div>
      </div>
      <button style={{
      background: 'var(--c-ink)', color: 'var(--c-bg)', border: 0,
      borderRadius: 999, padding: '10px 16px', fontSize: 13.5, fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 6
    }}>
        Apply
        <Icon name="arrow" size={12} />
      </button>
    </div>
    <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, color: 'var(--c-ink-3)', background: 'var(--c-bg)', padding: '3px 8px', borderRadius: 999, border: '1px solid var(--c-line)' }}>
        {job.spots} spots
      </span>
      {job.housing && <span style={{ fontSize: 11, color: 'var(--c-ink-3)', background: 'var(--c-bg)', padding: '3px 8px', borderRadius: 999, border: '1px solid var(--c-line)' }}>Housing</span>}
      <span style={{ fontSize: 11, color: 'var(--c-ink-3)', background: 'var(--c-bg)', padding: '3px 8px', borderRadius: 999, border: '1px solid var(--c-line)' }}>SMS apply</span>
    </div>
  </div>;


/* Stacked deck: top card cycles every few seconds */
const HeroJobStack = () => {
  const [topIdx, setTopIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setTopIdx((i) => (i + 1) % JOBS.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Show the top card and 3 cards behind, rotating order
  const ordered = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 4; i++) {
      arr.push(JOBS[(topIdx + i) % JOBS.length]);
    }
    return arr;
  }, [topIdx]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 420, height: 380, margin: '0 auto' }}>
      {/* SMS bubble floats top-left */}
      <SMSBubble />
      {/* WhatsApp ping floats bottom-right */}
      <WhatsAppPing />

      {ordered.slice().reverse().map((job, idxFromBottom) => {
        const layer = ordered.length - 1 - idxFromBottom; // 0 = top
        const offset = layer * 14;
        const scale = 1 - layer * 0.04;
        const rotate = (layer % 2 === 0 ? -1 : 1) * layer * 0.8;
        return (
          <div key={job.id + '-' + topIdx + '-' + layer}
          style={{
            position: 'absolute',
            top: offset,
            left: 0, right: 0,
            transform: `translateY(${offset}px) scale(${scale}) rotate(${rotate}deg)`,
            transformOrigin: 'top center',
            transition: 'transform .6s cubic-bezier(.2,.8,.2,1), opacity .6s',
            opacity: layer === 0 ? 1 : 0.5 + (4 - layer) * 0.12,
            zIndex: 10 - layer,
            filter: layer === 0 ? 'none' : `blur(${layer * 0.3}px)`,
            animation: layer === 0 ? 'cardEnter .6s cubic-bezier(.2,.8,.2,1)' : 'none'
          }}>
            <JobCard job={job} dim={layer > 0} />
          </div>);

      })}
    </div>);

};

const SMSBubble = () =>
<div style={{
  position: 'absolute',
  top: -38, left: -56,
  background: '#0F6E56',
  color: 'white',
  padding: '10px 14px',
  borderRadius: '18px 18px 18px 4px',
  fontSize: 13,
  fontWeight: 500,
  boxShadow: 'var(--shadow-pop)',
  zIndex: 20,
  transform: 'rotate(-4deg)',
  maxWidth: 220,
  fontFamily: 'var(--f-sans)'
}}>
    <div style={{ fontSize: 10, opacity: 0.7, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', marginBottom: 4 }}>SMS · NEW JOB</div>
    Grape harvest in Madera — $22.50/hr. Reply YES to apply.
  </div>;


const WhatsAppPing = () =>
<div style={{
  position: 'absolute',
  bottom: -32, right: -40,
  background: 'white',
  border: '1px solid var(--c-line)',
  padding: '10px 14px',
  borderRadius: '18px 18px 4px 18px',
  fontSize: 13,
  fontWeight: 500,
  boxShadow: 'var(--shadow-pop)',
  zIndex: 20,
  transform: 'rotate(3deg)',
  display: 'flex', alignItems: 'center', gap: 10
}}>
    <div className="live-dot" />
    <span style={{ color: 'var(--c-ink)' }}>3 new matches via WhatsApp</span>
  </div>;


const Hero = () => {
  return (
    <section style={{ paddingTop: 40, paddingBottom: 'var(--section-y)', position: 'relative', overflow: 'hidden' }}>
      <BackgroundField />
      <div className="container" style={{ position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <span className="eyebrow">Central Valley · Built for the field</span>
            <h1 className="h-display" style={{ marginTop: 24, fontFamily: "\"Inter Tight\"", fontWeight: "600" }}>
              Where the <em style={{ fontFamily: "\"Inter Tight\"", fontWeight: "600" }}>harvest</em><br />finds its hands.
            </h1>
            <p className="lede" style={{ marginTop: 28, fontSize: 21 }}>
              AgConnect is the bilingual workforce platform for California agriculture — connecting farmworkers, growers, and training providers in one place. By SMS, WhatsApp, or app.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
              <a href="#workers" className="btn btn-primary">
                I'm looking for work
                <Icon name="arrow" size={14} />
              </a>
              <a href="#employers" className="btn btn-ghost">
                I'm hiring a crew
                <Icon name="arrow" size={14} />
              </a>
            </div>
            <div style={{ display: 'flex', gap: 28, marginTop: 44, alignItems: 'center', flexWrap: 'wrap' }}>
              <TrustItem icon="shield" label="CDFA & F3 partner program" />
              <TrustItem icon="globe" label="Español + English, día uno" />
              <TrustItem icon="phone" label="Works on any phone" />
            </div>
          </div>
          <div style={{ position: 'relative', minHeight: 460, display: 'flex', alignItems: 'center' }}>
            <HeroJobStack />
          </div>
        </div>
      </div>
    </section>);

};

const TrustItem = ({ icon, label }) =>
<div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--c-ink-2)' }}>
    <Icon name={icon} size={16} color="var(--c-primary)" />
    {label}
  </div>;


const BackgroundField = () =>
<div aria-hidden style={{
  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
  backgroundImage: `
      radial-gradient(ellipse 70% 50% at 85% 0%, rgba(245,158,11,0.08), transparent 60%),
      radial-gradient(ellipse 50% 60% at 0% 100%, rgba(15,110,86,0.08), transparent 60%)
    `
}}>
    {/* Furrow lines */}
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.35 }} preserveAspectRatio="none">
      <defs>
        <pattern id="furrow" width="100%" height="48" patternUnits="userSpaceOnUse">
          <path d="M0 24 Q 200 12, 400 24 T 800 24 T 1200 24 T 1600 24 T 2000 24" stroke="rgba(15,110,86,0.06)" strokeWidth="1" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#furrow)" />
    </svg>
  </div>;


Object.assign(window, { Nav, Hero });