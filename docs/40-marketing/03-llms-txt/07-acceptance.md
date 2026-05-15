# 03 — llms.txt: Acceptance Criteria

## Functional

- [ ] `GET /llms.txt` returns 200 with `Content-Type: text/plain; charset=utf-8`.
- [ ] Body length ≤ 4 KB (compressed and uncompressed).
- [ ] Body parses as valid Markdown (run through `marked` or `remark` — should produce a clean AST).
- [ ] All linked URLs in the body are reachable (200 or expected redirect) on production.
- [ ] `robots.txt` lists `/llms.txt` as allowed for `*` and explicit AI crawlers.
- [ ] Landing footer-legal row contains an `llms.txt` link pointing to `/llms.txt`.
- [ ] File renders bilingual content: at least one EN sentence and one ES sentence in the summary block.

## Performance

- [ ] First-byte time < 100ms on production CDN.
- [ ] Cache headers: `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800`.

## Content quality

- [ ] Summary describes AGCONN's mission in one sentence in EN and one in ES.
- [ ] Includes platform scope (5 counties, 4 audiences, bilingual default).
- [ ] Lists at least 5 surface URLs (landing EN/ES, FAQ EN/ES, jobs, trainings, impact).
- [ ] Includes pricing summary in plain language (Free / Pro / Enterprise rates).
- [ ] Includes contact emails (support, partnerships).
- [ ] No marketing copy that doesn't match the site's actual functionality (verified during quarterly content reviews).

## Test scenarios

### Unit

1. `GET /llms.txt` returns body with `# AGCONN` as the first header.
2. Body interpolates `process.env.NEXT_PUBLIC_SITE_URL` correctly when set.
3. Default URL fallback (`https://agconn.com`) used when env var is unset.

### Integration

1. Cache headers match spec on a production-mode build.
2. `robots.txt` and `llms.txt` are both listed in `sitemap.xml` references (or at least mutually link).

### Manual

1. Fetch `/llms.txt` from a fresh browser → see plain-text rendering, all links clickable on browsers that linkify text.
2. Fetch `/llms.txt` with `curl -H 'Accept: text/plain'` → see same body.
3. Pass body through [llmstxt.org](https://llmstxt.org/) validation (when one becomes available) → no warnings.
4. Submit URL to Perplexity / ChatGPT 30 days post-launch → confirm the file is recognized as a source.

## Definition of done

- All functional + performance + content criteria pass.
- File live at production with proper cache headers.
- Footer link added.
- robots.txt updated.
- Listed at [llmstxt.org/directory](https://llmstxt.org/directory) (aspirational — submit when listing process opens).
