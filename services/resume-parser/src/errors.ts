// Typed error codes for the resume parser. The values are stored in
// `resume_parse_jobs.error_code` and surfaced to the onboarding status
// endpoint, which maps them to bilingual fallback copy in the UI.
//
// Spec: docs/00-foundation/07-resume-parser/07-acceptance.md

export const PARSER_ERROR_CODES = [
    'no_provider',
    'fetch_failed',
    'unsupported_format',
    'too_little_text',
    'ocr_failed',
    'llm_failed',
    'invalid_json',
    'schema_mismatch',
] as const;

export type ParserErrorCode = (typeof PARSER_ERROR_CODES)[number];

export class ParserError extends Error {
    code: ParserErrorCode;
    override cause?: unknown;
    constructor(code: ParserErrorCode, message?: string, cause?: unknown) {
        super(message ?? code);
        this.name = 'ParserError';
        this.code = code;
        this.cause = cause;
    }
}
