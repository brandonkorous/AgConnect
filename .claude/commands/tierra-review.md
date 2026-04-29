---
description: Audit a target (file, folder, diff, branch, or PR) against the Tierra brand system in docs/brand/ and report violations.
argument-hint: [path | --diff | --branch <name> | <PR#>]
---

# /tierra-review

Run a Tierra brand audit on the target specified by `$ARGUMENTS`. Default (no argument): the unstaged + staged working diff.

## Procedure

### 1. Resolve the target

- If `$ARGUMENTS` is empty: audit `git diff HEAD` (everything since last commit).
- If `$ARGUMENTS` is a path: audit that file or recursively that folder.
- If `$ARGUMENTS` starts with `--diff`: audit `git diff main...HEAD`.
- If `$ARGUMENTS` starts with `--branch <name>`: audit `git diff main...<name>`.
- If `$ARGUMENTS` is a number (e.g., `123`): audit `gh pr diff 123`.
- Print the resolved target before proceeding so the user can confirm scope.

### 2. Skip non-brand surfaces

If the target contains no user-facing surface — pure backend handlers, database migrations, infra YAML, type definitions, tests-of-non-UI — report `No brand surface to audit` and stop. Don't invent findings.

User-facing surfaces include: `*.tsx`, `*.jsx`, `*.css`, `*.scss`, Tailwind config, daisyUI theme, i18n catalogs, marketing MDX, email/SMS templates, certificate templates, public-site HTML.

### 3. Load the relevant brand docs

From [docs/brand/](../../docs/brand/) load only what's relevant to the target. Always include `02-color.md` and `08-accessibility.md`. Add the rest based on what the target touches:

| if target includes | also load |
|---|---|
| any text/copy/CSS font | `03-typography.md` |
| any layout/CSS spacing | `04-spacing-layout.md` |
| any user-facing strings | `05-voice-tone.md` |
| any component definition | `06-components.md` |
| any image/icon/chart/map | `07-imagery.md` |

### 4. Run the audit dimensions

For each dimension below, mark **PASS** / **FAIL** / **N/A**. For every FAIL, give:

- The exact file and line.
- A one-sentence description of the violation.
- The concrete fix.
- The doc reference: `docs/brand/<file>#<section>`.

**Color**
- All colors come from the named palette or daisyUI tokens (no off-palette hex).
- Honey appears at most once per screen / section.
- State never communicated by color alone (icon + text accompany).
- Contrast meets WCAG AA at the rendered size.

**Typography**
- Fonts limited to Fraunces / Inter / DM Mono.
- No text below 14px (16px on inputs).
- Eyebrow labels: 11px, UPPERCASE, 0.18em, weight 600.
- Italic — not bold — used for in-paragraph emphasis.
- `font-variant-numeric: tabular-nums` on numeric columns.

**Layout**
- `border-radius: 0` on buttons, cards, badges, inputs (toggles/radios/avatars excepted).
- Spacing values come from the documented 4px-base scale.
- Hairline borders, not shadows, for separation.
- Section vertical rhythm follows bone / sage / dark cadence; no two dark bands consecutive.

**Components**
- At most one primary button visible per viewport.
- Cards: bone or sage background, hairline border, no shadow.
- Inputs: bottom-bordered, ≥16px text, real `<label>`.
- Every interactive element has default + hover + focus-visible + active + disabled + loading states.

**Voice & copy**
- Sentence case headlines in EN and ES.
- No exclamation marks in brand voice.
- No emoji in product UI or marketing.
- Middot (`·`) delimiter for inline metadata, not bullets/dashes/pipes.
- EN and ES strings present together (or i18n keys wired to both catalogs).
- Glossary terms used correctly (worker/trabajador, crew/cuadrilla, FLC/Contratista, training/capacitación).
- ES uses `¿` and `¡` opening punctuation where required.

**Imagery**
- Photography matches documented direction (real Central Valley workers, golden hour, naturalistic).
- Icons from Lucide only, single-color, `currentColor`, 1.5px stroke.
- Charts use documented categorical color order; honey only for a one-of-one highlight.
- No mascots, no AI-sparkle iconography, no isometric or gradient icons.

**Accessibility**
- Touch targets ≥44×44.
- `:focus-visible` defined on every interactive element.
- Form inputs associated with `<label>` or `aria-label`.
- `lang` set on `<html>` and on inline mixed-language passages.
- `prefers-reduced-motion` honored.
- Status messages use `role="status"` (polite) or `role="alert"` (assertive).
- Required fields marked with both asterisk and the word "(required)" / "(obligatorio)".

### 5. Report format

```
# Tierra Review — <resolved target>

## Summary
X passes · Y fails · Z warnings · audited <N files / N lines>

## Findings

### FAIL — <dimension> — <one-line description>
File: <path:line>
Issue: <what's wrong>
Fix: <concrete change>
Reference: docs/brand/<file>#<section>

### WARN — <dimension> — <one-line description>
...

(omit dimensions with no findings; do NOT list every PASS)
```

End with a one-line verdict:

- `Verdict: ✓ ship` if zero FAILs and zero WARNs.
- `Verdict: ⚠ ship with notes` if zero FAILs and ≥1 WARN.
- `Verdict: ✗ revise` if ≥1 FAIL.

### 6. Discipline

- **Do NOT auto-fix** unless the user explicitly says so. Present findings; the user decides what to act on.
- **Inferred decisions** in the brand docs (anything inside a `> **Inferred:**` callout) are not violations by themselves. If a finding hinges on an inferred value, mark it `WARN` and note `Depends on inferred decision in docs/brand/<file>`.
- **Don't audit the brand docs themselves.** Files inside `docs/brand/` are the source of truth, not subject to their own rules.
- **Don't audit third-party files.** Skip `node_modules`, generated files, vendor directories.
- **Be specific.** "Color is off-palette" is a bad finding; "Line 42 uses `#3a5a40` (close to moss but not exact); replace with `#2D4030` or use `text-primary`" is a good finding.