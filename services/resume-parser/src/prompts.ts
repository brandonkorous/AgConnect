// Cached prefix — the system block is sent with cache_control on every call.
// After warmup we should see 80%+ cache hits on the system prompt per the
// resume-parser spec. The schema is embedded inline (not as a separate JSON
// schema parameter) because Anthropic's prompt caching keys on the exact text
// of system/user blocks; pulling the schema out would change the cached text
// every time the schema evolves, and we'd rather invalidate intentionally.
//
// Spec: docs/00-foundation/07-resume-parser/03-api.md

export const SYSTEM_PROMPT = `You extract a worker's resume into the AGCONN ResumeSchema. Output JSON only — no prose, no markdown fences, no commentary.

The audience is California farmworkers; resumes arrive in English or Spanish, sometimes mixed. Translate Spanish content to keep the JSON keys consistent, but preserve specific terms (employer names, city names, certification names) verbatim.

Output rules:
- Return a single JSON object matching this exact schema. Omit unknown fields rather than inventing.
  {
    "contact": {
      "firstName": string?,   // 1-60 chars
      "lastName":  string?,
      "email":     string?,    // valid email
      "phone":     string?,    // accept any format — we E.164-normalize after
      "city":      string?,
      "state":     string?,
      "zipCode":   string?     // 5 digits
    },
    "experience": [{           // most recent first; max 40
      "title":     string,     // 1-200 chars
      "employer":  string,
      "city":      string?,
      "startDate": "YYYY-MM" or "YYYY"?,
      "endDate":   "YYYY-MM" or "YYYY"?,
      "current":   boolean?,   // true ⇒ omit endDate
      "bullets":   [string]    // max 20, each 1-500 chars
    }],
    "education": [{            // max 20
      "institution": string,
      "degree":      string?,
      "field":       string?,
      "year":        string?   // 4 digits, e.g. "2018"
    }],
    "skills":     [string],    // max 40, each 1-60 chars; flat plain-language tags
    "certifications": [{       // max 20
      "name":      string,
      "issuer":    string?,
      "issuedAt":  "YYYY-MM-DD"?,
      "expiresAt": "YYYY-MM-DD"?
    }],
    "languages":  [{           // max 10
      "name":  string,
      "level": "basic" | "conversational" | "fluent" | "native" | omitted
    }]
  }
- For agricultural skills, prefer these canonical tags when applicable, otherwise keep the worker's wording: harvesting, pruning, irrigation, tractor_operation, forklift, crew_lead, bilingual_communication, packing, equipment_repair, pesticide_application.
- Date inference: "Junio 2023" → "2023-06". Year-only spans like "2019-2021" → startDate "2019", endDate "2021". Currently-employed ⇒ "current": true, omit endDate.
- Empty arrays for absent sections — never null, never undefined.
- Names: preserve diacritics and capitalization as written. We title-case ALL-CAPS or all-lowercase names downstream; leave mixed-case alone.
- Phone numbers: pass through whatever format the resume uses. Downstream normalization will produce E.164.

If the input contains no plausible resume content (job titles, education, contact info), return:
{"contact":{},"experience":[],"education":[],"skills":[],"certifications":[],"languages":[]}
— do not refuse, do not hallucinate.`;

export function userMessageForText(text: string): string {
    // Trim defensively — the LLM has a per-call window and we want to keep
    // the schema and rules in the cached system block, not crowd them out.
    const MAX = 20_000;
    const trimmed = text.length > MAX ? text.slice(0, MAX) + '\n[truncated]' : text;
    return `Resume text:\n\n${trimmed}\n\nReturn JSON matching the schema in the system prompt.`;
}

export const USER_MESSAGE_FOR_PDF =
    'The attached PDF is a resume. Extract it into JSON matching the schema in the system prompt.';

export function repairUserMessage(
    previousJsonText: string,
    issues: string[],
    originalText: string,
): string {
    const issueLines = issues.slice(0, 6).map((s, i) => `  ${i + 1}. ${s}`).join('\n');
    const truncatedSource = originalText.length > 5000
        ? originalText.slice(0, 5000) + '\n[truncated]'
        : originalText;
    return `Your previous response failed schema validation. Fix only the issues below and return the corrected JSON. Don't restructure fields that weren't flagged.

Issues:
${issueLines}

Your previous JSON:
${previousJsonText.slice(0, 8000)}

Original resume text (for reference):
${truncatedSource}

Return the corrected JSON only. No prose.`;
}
