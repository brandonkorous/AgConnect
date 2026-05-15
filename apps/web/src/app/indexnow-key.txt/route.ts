import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 86400;

export async function GET() {
    const key = process.env.INDEXNOW_KEY;
    if (!key || !/^[a-f0-9]{8,128}$/i.test(key)) {
        return new NextResponse('Not configured', { status: 404 });
    }
    return new NextResponse(key, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
