# 04 — i18n: Data Model

## Storage rules

User-facing content stored in the database uses paired `_en` / `_es` columns. Never a single translated blob. Never JSONB locale maps for the EN/ES set (JSONB only when locale set might grow — not the case for MVP).

### Examples

```prisma
// job_postings
titleEn         String   @map("title_en")
titleEs         String   @map("title_es")
descriptionEn   String   @map("description_en")
descriptionEs   String   @map("description_es")

// training_programs
titleEn         String   @map("title_en")
titleEs         String   @map("title_es")
summaryEn       String?  @map("summary_en")
summaryEs       String?  @map("summary_es")
```

## CHECK constraints

Both columns are required at the schema level when the field is required:

```sql
ALTER TABLE job_postings
  ADD CONSTRAINT title_en_not_empty CHECK (length(trim(title_en)) > 0),
  ADD CONSTRAINT title_es_not_empty CHECK (length(trim(title_es)) > 0);
```

For optional bilingual fields (`summary`), enforce all-or-nothing:

```sql
ALTER TABLE training_programs
  ADD CONSTRAINT summary_pair CHECK (
    (summary_en IS NULL AND summary_es IS NULL) OR
    (summary_en IS NOT NULL AND summary_es IS NOT NULL)
  );
```

## users.preferred_lang

Defined in [02-auth/02-data-model.md](../02-auth/02-data-model.md):

```prisma
preferredLang Lang @default(es) @map("preferred_lang")
enum Lang { en es }
```

Source of truth for which locale to use for SMS, email, and default landing.

## i18n source files

```
packages/i18n/
  src/
    en.json       # canonical key set
    es.json       # mirror of en.json with translations
    types.ts      # generated TS type from en.json keys
  package.json
```

JSON structure follows feature namespacing:

```json
{
  "worker": {
    "onboarding": {
      "welcome": { "tagline": "..." },
      "phone": { "label": "..." }
    },
    "jobs": { ... }
  },
  "employer": { ... },
  "admin": { ... },
  "common": {
    "errors": { "generic": "...", "network": "..." },
    "validation": { "required": "...", "tooLong": "..." }
  }
}
```

The TS type is generated at build time so every `t()` call gets autocompletion:

```ts
// packages/i18n/src/types.ts (generated)
export type Locale = 'en' | 'es';
export type TranslationKey =
  | 'worker.onboarding.welcome.tagline'
  | 'worker.onboarding.phone.label'
  | ...;
```

## Zod i18n adapter

Validation messages use stable keys, not literal strings:

```ts
// packages/shared-types/src/zod-i18n.ts
import { z } from 'zod';
export const requiredString = (key: string) =>
  z.string({ message: key }).min(1, { message: 'common.validation.required' });
```

The API layer translates keys to messages using the request's locale before returning the response:

```ts
// apps/api/src/middleware/zod-error.ts
export const zodErrorHandler = (err: ZodError, locale: Locale) => ({
  errors: err.issues.map((i) => ({
    path: i.path.join('.'),
    message: t(locale, i.message),     // i.message is a key like 'common.validation.required'
  })),
});
```

## Indexes

Bilingual columns don't typically need indexes — search uses Postgres FTS on a generated tsvector that combines both languages. Example:

```sql
ALTER TABLE job_postings
  ADD COLUMN search tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title_en, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(title_es, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description_en, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(description_es, '')), 'B')
  ) STORED;

CREATE INDEX job_postings_search_idx ON job_postings USING gin(search);
```

This lets a single full-text query match in either language. See [10-worker/03-job-discovery](../../10-worker/03-job-discovery/).
