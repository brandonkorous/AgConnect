import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { Resume } from '@agconn/schemas';

// Post-LLM cleanup. Run *after* schema validation so we know shapes are sane,
// but *before* persistence so workers don't see "415-555-1212" in one cert
// upload and "+14155551212" in the next. Conservative — when in doubt we keep
// the LLM's output rather than reshape into something it didn't intend.

export function normalize(resume: Resume): Resume {
    return {
        ...resume,
        contact: resume.contact
            ? {
                  ...resume.contact,
                  firstName: titleCase(resume.contact.firstName),
                  lastName: titleCase(resume.contact.lastName),
                  phone: normalizePhone(resume.contact.phone),
              }
            : resume.contact,
        skills: dedupeStrings(resume.skills),
        languages: resume.languages,
    };
}

export function normalizePhone(raw: string | undefined): string | undefined {
    if (!raw) return raw;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    // Default to US — the audience is California Central Valley. If the
    // number already starts with `+`, libphonenumber respects that.
    const parsed = parsePhoneNumberFromString(trimmed, 'US');
    if (parsed && parsed.isValid()) return parsed.number;
    // Couldn't parse — keep the original so a human can fix in the editor
    // rather than dropping the data on the floor.
    return trimmed;
}

function titleCase(s: string | undefined): string | undefined {
    if (!s) return s;
    // Don't mangle names that are already mixed-case (e.g. "DeSilva", "O'Connor")
    // or that contain apostrophes/hyphens with intentional case. Only touch
    // names that are ALL CAPS or all lowercase.
    if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s;
    return s
        .toLowerCase()
        .split(/(\s+|-)/)
        .map((part) => {
            if (part.length === 0) return part;
            const first = part[0]!;
            return first.toUpperCase() + part.slice(1);
        })
        .join('');
}

function dedupeStrings(items: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const it of items) {
        const key = it.trim().toLowerCase();
        if (!key) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(it.trim());
    }
    return out;
}
