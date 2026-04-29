# 05 — Tierra: Voice & Tone

Tierra's verbal identity is the same calm, dignified voice across product, marketing, SMS, email, and certificates. EN and ES are equal first-class languages — neither is a translation of the other; both are written natively and reviewed by speakers of the variety used in California's Central Valley (predominantly Mexican Spanish).

## Voice principles, in order

1. **Clear before clever.** No metaphor that obscures. No play on words that requires a beat.
2. **Specific before general.** Concrete numbers, places, hours, dollars. "$19.50/hr in Fresno County, today" beats "Great pay near you, today!".
3. **Bilingual at the same time.** Don't ship an English string before an ES string. If only one is ready, hold both.
4. **Short before long.** A 12-word sentence beats an 18-word one.
5. **Calm before urgent.** Tierra never manufactures urgency. If something is genuinely time-sensitive, state the time. ("Closes Friday" not "Closing soon!").
6. **Respectful before friendly.** "Friendly" copy often condescends. Tierra prefers to address users as adults with jobs.

## Tone matrix

Tone shifts by surface but never abandons the voice principles.

| surface        | tone                           | example EN                                                                          | example ES                                                                                        |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Marketing hero | warm, declarative              | _Find work that pays, today._                                                       | _Encuentra trabajo que paga, hoy._                                                                |
| Product header | neutral, factual               | Find work                                                                           | Encontrar trabajo                                                                                 |
| Form helper    | helpful, plain                 | We text a 6-digit code to verify your number.                                       | Te enviamos un código de 6 dígitos para verificar tu número.                                      |
| Empty state    | reassuring, action-forward     | No saved jobs yet. Browse to start a list.                                          | Aún no tienes trabajos guardados. Explora para empezar tu lista.                                  |
| Error          | precise, never blaming         | We couldn't read that file. Try a PDF or DOCX.                                      | No pudimos leer ese archivo. Prueba con PDF o DOCX.                                               |
| Success        | small, specific                | Hired by Bonita Farms · Apr 29                                                      | Contratado por Bonita Farms · 29 abr.                                                             |
| SMS            | plain, complete in one message | AgConn: Tu código es 482 619. Válido 10 min.                                        | AgConn: Your code is 482 619. Valid 10 min.                                                       |
| Certificate    | formal, archival               | This certifies that **María R.** completed Heat Illness Prevention on Apr 29, 2026. | Se certifica que **María R.** completó Prevención de Enfermedad por Calor el 29 de abril de 2026. |

## Don'ts

- **No exclamation marks** anywhere except in user-generated content. The brand never raises its voice.
- **No emoji** in product UI or marketing copy. Workers and employers can use them; Tierra doesn't.
- **No "we" overload.** First-person is fine for the brand voice but use it deliberately, not in every sentence.
- **No "your" excess.** Tierra avoids the SaaS habit of putting "your" before every noun. ("Profile" is fine; "Your profile" is fine; "Manage your profile to ensure your information is up to date for your employers" is not.)
- **No marketing verbs:** _unlock, supercharge, level up, transform, revolutionize, reimagine._ Pick a plain verb instead.
- **No urgency theater:** _don't miss out, last chance, only X left, hurry._ If something is finite, state it neutrally.
- **No motivational filler:** _amazing, incredible, awesome, fantastic._ Use a number or a fact.
- **No "Hey there!" greetings** in SMS or email. Use the user's first name if known, or no greeting.

## Bilingual rules

- **Both languages live in code.** EN and ES live next to each other in the i18n catalog. See [`../00-foundation/04-i18n/`](../00-foundation/04-i18n/) for the namespacing rules.
- **ES is reviewed by a native speaker of Mexican Spanish.** Not a translator-of-record. Variety matters: _labor, trabajo, chamba_ differ in formality and region.
- **Don't directly translate idioms.** "Nail it" → not "clávalo." Pick the idea, write the ES sentence native.
- **Avoid pronoun-traps.** ES often elides subject pronouns; EN doesn't. Don't write a literal pair where the EN says "You're hired" and the ES says "Tú estás contratado/a." Better ES: "Contratado/a — felicidades."
- **Inclusive forms.** Use `-o/-a` for adjectives where the user's gender is unknown ("contratado/a"), or rewrite to avoid gender ("¡Felicitaciones por tu contratación!"). Avoid `-x` and `-e` neutral forms in user-facing copy unless we have evidence the audience uses them; the Central Valley audience generally does not.

## Punctuation and casing

- **Sentence case** for English headlines: `Find work today`.
- **Sentence case** for Spanish headlines, RAE-conformant: `Encuentra trabajo hoy`.
- **Title case** is reserved for proper nouns and the brand's own product names.
- **Periods** end sentences, not labels. Form labels do not get periods. Toast bodies and SMS bodies do.
- **The middot** (`·`, U+00B7) is the Tierra delimiter for inline metadata. Two thin spaces around it: `·`. Do not use bullets, dashes, or pipes.
- **Em dashes**: `—`, no spaces, RAE-style. EN can take spaces or no-spaces; pick no-spaces and stay consistent.
- **Quotes**: typographic curly quotes (`"…"`, `'…'`) in copy. Never straight quotes outside of code blocks.
- **Spanish punctuation**: opening `¿` and `¡` are mandatory: `¿Listo?` not `Listo?`.

## Glossary

A short, opinionated glossary. Update as questions come up.

| EN                    | ES (Mexican)                         | notes                                                                                |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| worker                | trabajador / trabajadora             | use both forms or rewrite to neutral noun phrase                                     |
| crew                  | cuadrilla                            | preferred over _equipo_ in this context                                              |
| job                   | trabajo                              | for posting; _empleo_ for the broader concept of employment                          |
| hire                  | contratar                            | "We hired Maria" → "Contratamos a María"; "Get hired" → "Sé contratado/a" or rewrite |
| county                | condado                              | always `Condado de Fresno`, never `Fresno County` in ES copy                         |
| Farm Labor Contractor | Contratista de Mano de Obra Agrícola | abbreviated `FLC` in EN; spell out in ES on first reference, then `FLC`              |
| training              | capacitación                         | preferred over _entrenamiento_ in workforce contexts                                 |
| certificate           | certificado                          | not _certificación_ (the act); the artifact is _certificado_                         |
| skill                 | habilidad                            | not _destreza_ (too formal)                                                          |
| profile               | perfil                               |                                                                                      |
| availability          | disponibilidad                       |                                                                                      |
| pay rate              | tarifa                               | "$19.50/hr" → "$19.50/h" or "$19.50/hora"                                            |
| sign in               | iniciar sesión                       | not _entrar_, not _acceder_                                                          |
| sign out              | cerrar sesión                        |                                                                                      |
| save (a job)          | guardar                              |                                                                                      |
| share                 | compartir                            |                                                                                      |

## SMS

SMS is the primary product channel for many workers. Bilingual, 160-character-aware, never marketing.

- **First word of every SMS is `AgConn:`** so the recipient instantly knows the source. Spam complaints drop when the brand name leads.
- **Stay under 160 characters when possible.** GSM-7 only — no emoji, no curly quotes in SMS. Use straight quotes here as the exception.
- **Provide STOP/AYUDA paths** in onboarding messages to comply with carrier requirements: `Reply STOP to opt out` / `Responde AYUDA para ayuda`.
- **No URLs unless essential.** When a URL is necessary, prefer a short branded subdomain (`go.agconn.app/...`).

Examples:

```
AgConn: Tu código es 482 619. Válido 10 min. No lo compartas.
AgConn: Bonita Farms te contrató para Pisca de Uva el 29 abr. Detalles: go.agconn.app/j/3F2
AgConn: Recordatorio — Capacitación Heat Illness mañana 7am, Selma. Ver: go.agconn.app/t/HI4
```

## Email

Email is for richer content (welcome messages, certificates, weekly digests). The voice is the same; the format is more spacious.

- Plain-text-equivalent every HTML email. Many recipients read on slow connections or text-only clients.
- Subject lines: 6 words or fewer, sentence case, no emoji. `Your AgConn certificate is ready` / `Tu certificado AgConn está listo`.
- One primary CTA per email. If you need a second, you have two emails.

## Certificates and reports

The most formal Tierra surface. Voice tightens; no first-person.

- Certificates use `This certifies that …` / `Se certifica que …` — Roman serif Fraunces, full names, ISO date in the sealed footer.
- Reports addressed to funders/agencies use neutral, evidence-forward sentences. Never "we crushed our targets"; instead "84% of placements retained at 90 days."

## Empty states

Empty states are a brand opportunity, not a failure. Three lines max:

1. What's missing (state of fact).
2. Why it's missing (one short reason if not obvious).
3. The next action (a verb).

Example (saved jobs, EN):

> No saved jobs yet.
> Save a job from search to start a list.
> [ Browse jobs ]

Same (ES):

> Aún no tienes trabajos guardados.
> Guarda uno desde la búsqueda para empezar tu lista.
> [ Explorar trabajos ]
