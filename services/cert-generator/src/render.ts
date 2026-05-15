// Bilingual certificate HTML renderer. Emits a single self-contained HTML
// document with the AGCONN Tierra palette. Production should switch to
// React-PDF for crisper print output, but HTML is a reasonable starting point
// — it renders identically in browser preview and "Save as PDF".

type Args = {
    workerFirstName: string;
    workerLastName: string;
    programTitleEn: string;
    programTitleEs: string;
    funder: string;
    orgName: string;
    completedAt: Date;
    certificateId: string;
};

export function renderCertHtml(a: Args): string {
    const completed = a.completedAt.toISOString().slice(0, 10);
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(a.programTitleEn)} — AGCONN Certificate</title>
<style>
  :root {
    --ink: oklch(28% 0.04 70);
    --primary: oklch(50% 0.09 120);
    --accent: oklch(83% 0.13 88);
    --bg: oklch(98% 0.01 70);
    --paper: #ffffff;
    --line: oklch(90% 0.02 70);
  }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: 'Inter', system-ui, sans-serif;
    padding: 40px;
  }
  .cert {
    max-width: 800px;
    margin: 0 auto;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 24px;
    padding: 64px 72px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.06);
    position: relative;
    overflow: hidden;
  }
  .cert::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 80% at 100% 0%, rgba(245,158,11,0.12), transparent 60%);
    pointer-events: none;
  }
  .eyebrow {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--primary);
    font-weight: 700;
  }
  h1 {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 44px;
    line-height: 1.1;
    letter-spacing: -0.025em;
    margin: 12px 0 4px;
    font-weight: 400;
  }
  h2 {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 28px;
    line-height: 1.15;
    margin: 32px 0 0;
    font-weight: 400;
  }
  .name {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 36px;
    color: var(--primary);
    margin: 24px 0 8px;
    font-weight: 400;
  }
  .meta {
    color: oklch(45% 0.02 70);
    font-size: 14px;
  }
  .footer {
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    font-size: 13px;
  }
  .label {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: oklch(60% 0.02 70);
    font-weight: 600;
  }
  .value {
    font-weight: 600;
    margin-top: 4px;
  }
  .es {
    margin-top: 32px;
    padding-top: 32px;
    border-top: 1px solid var(--line);
  }
</style>
</head>
<body>
  <main class="cert">
    <div class="eyebrow">AGCONN · Certificate of Completion</div>
    <h1>${escapeHtml(a.programTitleEn)}</h1>
    <div class="meta">Funded by ${escapeHtml(a.funder)} · Issued by ${escapeHtml(a.orgName)}</div>

    <div class="name">${escapeHtml(a.workerFirstName)} ${escapeHtml(a.workerLastName)}</div>
    <div class="meta">has successfully completed the program above.</div>

    <div class="es">
      <div class="eyebrow">Certificado de Finalización</div>
      <h2>${escapeHtml(a.programTitleEs)}</h2>
      <div class="meta" style="margin-top: 8px;">ha completado exitosamente este programa.</div>
    </div>

    <div class="footer">
      <div>
        <div class="label">Issued · Emitido</div>
        <div class="value">${escapeHtml(completed)}</div>
      </div>
      <div>
        <div class="label">Cert ID</div>
        <div class="value" style="font-family: 'JetBrains Mono', monospace;">${escapeHtml(a.certificateId)}</div>
      </div>
    </div>
  </main>
</body>
</html>`;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
