type FontFamily = 'Inter Tight' | 'Inter' | 'DM Mono';
type FontWeight = 400 | 500 | 600 | 700;
type FontStyle = 'normal' | 'italic';

type FontSpec = {
    name: FontFamily;
    googleFamily: string;
    weight: FontWeight;
    style: FontStyle;
};

const SPECS = {
    interTightBold: { name: 'Inter Tight', googleFamily: 'Inter+Tight', weight: 700, style: 'normal' },
    interTightSemi: { name: 'Inter Tight', googleFamily: 'Inter+Tight', weight: 600, style: 'normal' },
    interTightItalic: { name: 'Inter Tight', googleFamily: 'Inter+Tight', weight: 600, style: 'italic' },
    interSemi: { name: 'Inter', googleFamily: 'Inter', weight: 600, style: 'normal' },
    interMed: { name: 'Inter', googleFamily: 'Inter', weight: 500, style: 'normal' },
    dmMonoBold: { name: 'DM Mono', googleFamily: 'DM+Mono', weight: 500, style: 'normal' },
} as const satisfies Record<string, FontSpec>;

export type FontKey = keyof typeof SPECS;

const cache = new Map<string, ArrayBuffer>();

async function loadOne(spec: FontSpec): Promise<ArrayBuffer> {
    const key = `${spec.googleFamily}-${spec.weight}-${spec.style}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const axis =
        spec.style === 'italic' ? `ital,wght@1,${spec.weight}` : `wght@${spec.weight}`;
    const cssUrl = `https://fonts.googleapis.com/css2?family=${spec.googleFamily}:${axis}&display=swap`;
    const cssRes = await fetch(cssUrl, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15',
        },
    });
    const css = await cssRes.text();
    const match = /src:\s*url\((https:\/\/[^)]+\.woff2)\)/.exec(css);
    if (!match) throw new Error(`OG font url not found for ${key}`);
    const fontUrl = match[1];
    if (!fontUrl) throw new Error(`OG font url empty for ${key}`);
    const fontRes = await fetch(fontUrl);
    const buf = await fontRes.arrayBuffer();
    cache.set(key, buf);
    return buf;
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
            const data = await loadOne(spec);
            return { name: spec.name, data, weight: spec.weight, style: spec.style };
        }),
    );
}
