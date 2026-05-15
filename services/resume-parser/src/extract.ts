import { ParserError } from './errors.js';

export type ExtractKind = 'pdf_text' | 'pdf_ocr' | 'docx' | 'plaintext' | 'html';

// Result variants:
//   pdf_text  — we pulled enough text via pdfjs's text layer; LLM call sends text
//   pdf_ocr   — text layer was too sparse (image PDF); LLM call sends the raw
//               PDF as a document block and Claude does OCR + extraction natively
//   docx, plaintext, html — text-only paths
export type ExtractResult =
    | { kind: 'pdf_text' | 'docx' | 'plaintext' | 'html'; text: string }
    | { kind: 'pdf_ocr'; text: ''; pdf: Buffer };

const PDF_TEXT_MIN = 50;

export async function downloadBlob(url: string): Promise<{ buffer: Buffer; contentType: string }> {
    let res: Response;
    try {
        res = await fetch(url);
    } catch (e) {
        throw new ParserError('fetch_failed', `fetch threw for ${url}`, e);
    }
    if (!res.ok) {
        throw new ParserError('fetch_failed', `fetch ${url} → ${res.status}`);
    }
    const contentType = res.headers.get('content-type') ?? '';
    const arrayBuf = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuf), contentType };
}

export function inferFormat(
    url: string,
    contentType: string,
): 'pdf' | 'docx' | 'plaintext' | 'html' {
    const lower = url.toLowerCase();
    if (lower.endsWith('.pdf') || contentType.includes('application/pdf')) return 'pdf';
    if (
        lower.endsWith('.docx') ||
        contentType.includes(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
    ) {
        return 'docx';
    }
    if (contentType.includes('text/html') || lower.endsWith('.html') || lower.endsWith('.htm')) {
        return 'html';
    }
    return 'plaintext';
}

export async function extract(args: { url: string }): Promise<ExtractResult> {
    const { buffer, contentType } = await downloadBlob(args.url);
    const fmt = inferFormat(args.url, contentType);
    if (fmt === 'pdf') return extractPdf(buffer);
    if (fmt === 'docx') return extractDocx(buffer);
    if (fmt === 'html') return extractHtml(buffer);
    return extractPlaintext(buffer);
}

async function extractPdf(buffer: Buffer): Promise<ExtractResult> {
    const text = await extractPdfTextLayer(buffer);
    if (text.trim().length >= PDF_TEXT_MIN) {
        return { kind: 'pdf_text', text };
    }
    // Image-only PDF — defer OCR to Claude's native PDF support. The
    // orchestrator sees `kind: 'pdf_ocr'` and switches to a document-input
    // LLM call instead of a text-input call. This avoids local rasterization
    // and a heavyweight `@napi-rs/canvas` dep.
    return { kind: 'pdf_ocr', text: '', pdf: buffer };
}

async function extractPdfTextLayer(buffer: Buffer): Promise<string> {
    // Late import — pdfjs ships a hefty bundle and we only want to pay the
    // load cost on the parsing path. `legacy` is the Node-compatible build.
    const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as {
        getDocument: (params: {
            data: Uint8Array;
            useSystemFonts?: boolean;
            disableWorker?: boolean;
        }) => { promise: Promise<PdfDocument> };
    };
    const doc = await pdfjs
        .getDocument({
            data: new Uint8Array(buffer),
            useSystemFonts: true,
            disableWorker: true,
        })
        .promise;

    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
            .map((it) => it.str ?? '')
            .filter((s) => s.length > 0)
            .join(' ');
        pages.push(pageText);
        page.cleanup();
    }
    await doc.cleanup();
    return pages.join('\n\n').trim();
}

type PdfDocument = {
    numPages: number;
    getPage: (n: number) => Promise<PdfPage>;
    cleanup: () => Promise<void>;
};
type PdfPage = {
    getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
    cleanup: () => void;
};

async function extractDocx(buffer: Buffer): Promise<ExtractResult> {
    const mammoth = (await import('mammoth')) as unknown as {
        extractRawText: (input: { buffer: Buffer }) => Promise<{ value: string }>;
    };
    try {
        const out = await mammoth.extractRawText({ buffer });
        return { kind: 'docx', text: out.value.trim() };
    } catch (e) {
        throw new ParserError('fetch_failed', 'mammoth failed', e);
    }
}

function extractHtml(buffer: Buffer): ExtractResult {
    const raw = buffer.toString('utf8');
    // Cheap HTML→text: strip tags + collapse whitespace. Good enough for the
    // handful of cases where workers paste a resume into a form upload.
    const text = raw
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return { kind: 'html', text };
}

function extractPlaintext(buffer: Buffer): ExtractResult {
    return { kind: 'plaintext', text: buffer.toString('utf8').trim() };
}
