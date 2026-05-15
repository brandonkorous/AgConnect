import type { ReactNode } from 'react';
import { palette } from './palette';

type Locale = 'en' | 'es';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'AGCONN';
const HOST = (process.env.NEXT_PUBLIC_SITE_URL ?? 'agconn.com')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

const ROSETTA: Record<Locale, { region: string; verified: string; lang: string }> = {
    en: { region: 'Central Valley · California', verified: 'Verified employers', lang: 'EN · ES' },
    es: { region: 'Valle Central · California', verified: 'Empleadores verificados', lang: 'ES · EN' },
};

export function OgFrame({
    locale,
    eyebrow,
    children,
    footerLeft,
    footerRight,
}: {
    locale: Locale;
    eyebrow: string;
    children: ReactNode;
    footerLeft?: ReactNode;
    footerRight?: ReactNode;
}) {
    const t = ROSETTA[locale];
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '64px 72px',
                backgroundColor: palette.base,
                backgroundImage: `radial-gradient(circle at 92% 0%, ${palette.accentSoft}22 0%, ${palette.accentSoft}00 36%), radial-gradient(circle at 0% 100%, ${palette.primary}1F 0%, ${palette.primary}00 42%)`,
                fontFamily: 'Inter',
                color: palette.ink,
                position: 'relative',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 6,
                    display: 'flex',
                    flexDirection: 'row',
                }}
            >
                <div style={{ width: 280, height: 6, backgroundColor: palette.primary }} />
                <div style={{ width: 120, height: 6, backgroundColor: palette.accent }} />
                <div style={{ width: 64, height: 6, backgroundColor: palette.soil }} />
                <div style={{ flex: 1, height: 6, backgroundColor: palette.hairlineSoft }} />
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                        style={{
                            width: 14,
                            height: 14,
                            borderRadius: 9999,
                            backgroundColor: palette.accent,
                        }}
                    />
                    <span
                        style={{
                            fontFamily: 'Inter',
                            fontSize: 22,
                            fontWeight: 700,
                            letterSpacing: 6,
                            textTransform: 'uppercase',
                            color: palette.ink,
                        }}
                    >
                        {BRAND}
                    </span>
                    <span
                        style={{
                            display: 'flex',
                            width: 1,
                            height: 22,
                            backgroundColor: palette.hairline,
                            margin: '0 6px',
                        }}
                    />
                    <span
                        style={{
                            fontFamily: 'Inter',
                            fontSize: 18,
                            fontWeight: 500,
                            color: palette.soil,
                            letterSpacing: 2,
                            textTransform: 'uppercase',
                        }}
                    >
                        {eyebrow}
                    </span>
                </div>

                <span
                    style={{
                        fontFamily: 'DM Mono',
                        fontSize: 16,
                        fontWeight: 500,
                        color: palette.soil,
                        letterSpacing: 2,
                    }}
                >
                    {t.lang}
                </span>
            </div>

            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    paddingTop: 36,
                    paddingBottom: 36,
                }}
            >
                {children}
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    paddingTop: 24,
                    borderTop: `1px solid ${palette.hairline}`,
                    gap: 24,
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {footerLeft ?? (
                        <span
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 22,
                                fontWeight: 500,
                                color: palette.ink,
                                lineHeight: 1.3,
                                maxWidth: 700,
                            }}
                        >
                            {t.region}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {footerRight ?? null}
                    <span
                        style={{
                            fontFamily: 'Inter',
                            fontSize: 20,
                            fontWeight: 700,
                            letterSpacing: 2,
                            color: palette.primary,
                        }}
                    >
                        {HOST}
                    </span>
                </div>
            </div>
        </div>
    );
}
