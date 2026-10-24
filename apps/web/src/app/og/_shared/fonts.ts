import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

type FontFamily = 'Inter Tight' | 'Inter' | 'DM Mono';
type FontWeight = 400 | 500 | 600 | 700;
type FontStyle = 'normal' | 'italic';

type FontSpec = {
    name: FontFamily;
    file: string;
    weight: FontWeight;
    style: FontStyle;
};

const SPECS = {
    interTightBold: { name: 'Inter Tight', file: 'InterTight-Bold.ttf', weight: 700, style: 'normal' },
    interTightSemi: { name: 'Inter Tight', file: 'InterTight-SemiBold.ttf', weight: 600, style: 'normal' },
    interTightItalic: { name: 'Inter Tight', file: 'InterTight-SemiBoldItalic.ttf', weight: 600, style: 'italic' },
    interSemi: { name: 'Inter', file: 'Inter-SemiBold.ttf', weight: 600, style: 'normal' },
    interMed: { name: 'Inter', file: 'Inter-Medium.ttf', weight: 500, style: 'normal' },
    dmMonoBold: { name: 'DM Mono', file: 'DMMono-Medium.ttf', weight: 500, style: 'normal' },
} as const satisfies Record<string, FontSpec>;

export type FontKey = keyof typeof SPECS;

// Bundled TTFs (Satori cannot read WOFF2); next.config traces them into the standalone build.
const FONT_DIR = join(process.cwd(), 'src/app/og/_shared/fonts');

// One in-flight read per file, so parallel requests share it; a failed read is retried next time.
const cache = new Map<string, Promise<ArrayBuffer>>();

function loadOne(file: string): Promise<ArrayBuffer> {
    const cached = cache.get(file);
    if (cached) return cached;
    const read = readFile(join(FONT_DIR, file)).then(
        (buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
    );
    read.catch(() => cache.delete(file));
    cache.set(file, read);
    return read;
}

export type OgFont = {
    name: FontFamily;
    data: ArrayBuffer;
    weight: FontWeight;
    style: FontStyle;
};

export async function loadFonts(keys: FontKey[]): Promise<OgFont[]> {
    return Promise.all(
        keys.map(async (k) => {
            const spec = SPECS[k];
            const data = await loadOne(spec.file);
            return { name: spec.name, data, weight: spec.weight, style: spec.style };
        }),
    );
}
