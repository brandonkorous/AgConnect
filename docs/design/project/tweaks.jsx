/* AGCONN Tweaks panel — color/layout/font/density toggles */

const AgTweaks = () => {
  const [tweaks, setTweak] = useTweaks(window.TWEAK_DEFAULTS);

  // Apply tweaks live to <html>
  React.useEffect(() => {
    const r = document.documentElement;
    // Primary color
    if (tweaks.primary === 'teal') {
      r.style.setProperty('--c-primary', '#0F6E56');
      r.style.setProperty('--c-primary-deep', '#0A4D3C');
      r.style.setProperty('--c-primary-soft', '#E6F1ED');
    } else if (tweaks.primary === 'olive') {
      r.style.setProperty('--c-primary', '#5B6E2E');
      r.style.setProperty('--c-primary-deep', '#3F4E1F');
      r.style.setProperty('--c-primary-soft', '#EDEFDE');
    } else if (tweaks.primary === 'clay') {
      r.style.setProperty('--c-primary', '#9C3F1E');
      r.style.setProperty('--c-primary-deep', '#6E2A12');
      r.style.setProperty('--c-primary-soft', '#F5E2D8');
    } else if (tweaks.primary === 'indigo') {
      r.style.setProperty('--c-primary', '#2E4A7B');
      r.style.setProperty('--c-primary-deep', '#1F3357');
      r.style.setProperty('--c-primary-soft', '#E1E8F2');
    }
    // Accent
    if (tweaks.accent === 'amber') r.style.setProperty('--c-accent', '#F59E0B');
    else if (tweaks.accent === 'tomato') r.style.setProperty('--c-accent', '#E04A2A');
    else if (tweaks.accent === 'gold') r.style.setProperty('--c-accent', '#D9B441');
    else if (tweaks.accent === 'lime') r.style.setProperty('--c-accent', '#A8C84A');

    r.dataset.font = tweaks.font;
    r.dataset.density = tweaks.density;
    r.dataset.heroLayout = tweaks.heroLayout;
  }, [tweaks]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Primary color">
        <TweakRadio value={tweaks.primary} onChange={v => setTweak('primary', v)}
          options={[
            { value: 'teal', label: 'Teal' },
            { value: 'olive', label: 'Olive' },
            { value: 'clay', label: 'Clay' },
            { value: 'indigo', label: 'Indigo' },
          ]}/>
      </TweakSection>
      <TweakSection title="Accent">
        <TweakRadio value={tweaks.accent} onChange={v => setTweak('accent', v)}
          options={[
            { value: 'amber', label: 'Amber' },
            { value: 'tomato', label: 'Tomato' },
            { value: 'gold', label: 'Gold' },
            { value: 'lime', label: 'Lime' },
          ]}/>
      </TweakSection>
      <TweakSection title="Hero layout">
        <TweakRadio value={tweaks.heroLayout} onChange={v => setTweak('heroLayout', v)}
          options={[
            { value: 'split', label: 'Split' },
            { value: 'centered', label: 'Centered' },
          ]}/>
      </TweakSection>
      <TweakSection title="Font pairing">
        <TweakSelect value={tweaks.font} onChange={v => setTweak('font', v)}
          options={[
            { value: 'serif-display', label: 'Fraunces + Inter Tight' },
            { value: 'grotesk', label: 'Space Grotesk + Inter Tight' },
            { value: 'humanist', label: 'Instrument Serif + Inter Tight' },
            { value: 'inter', label: 'Inter (all weights)' },
          ]}/>
      </TweakSection>
      <TweakSection title="Density">
        <TweakRadio value={tweaks.density} onChange={v => setTweak('density', v)}
          options={[
            { value: 'spacious', label: 'Spacious' },
            { value: 'compact', label: 'Compact' },
          ]}/>
      </TweakSection>
    </TweaksPanel>
  );
};

window.AgTweaks = AgTweaks;
