// audit-required:exempt — read-only proxy to the U.S. National Weather
// Service forecast API. Used by the shift editor to populate the heat
// advisory forecast. NWS is free, requires no key, and covers all of CA.

import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import {
    requireAuth,
    requireActiveEmployer,
    requireEmployerPermission,
    requireTenant,
    type AuthVars,
} from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

export const employerWeatherRoutes = new Hono<{
    Variables: AuthVars & AuditCtxVars;
}>();
employerWeatherRoutes.use('*', requireAuth('employer'));
employerWeatherRoutes.use('*', requireActiveEmployer);
employerWeatherRoutes.use('*', requireTenant);

const NWS_USER_AGENT = 'AGCONN (agconn.com, ops@agconn.com)';
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<
    string,
    { highTempF: number | null; condition: string | null; expires: number }
>();

employerWeatherRoutes.get('/forecast', requireEmployerPermission('jobs.read'), async (c) => {
    const lat = Number(c.req.query('lat'));
    const lng = Number(c.req.query('lng'));
    const date = c.req.query('date') ?? '';

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return err(c, 400, 'invalid_lat');
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) return err(c, 400, 'invalid_lng');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return err(c, 400, 'invalid_date');

    const key = `${lat.toFixed(2)},${lng.toFixed(2)},${date}`;
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) {
        return ok(c, {
            highTempF: hit.highTempF,
            condition: hit.condition,
            source: 'nws',
            cached: true,
        });
    }

    const target = await resolveDailyForecast(lat, lng, date);
    cache.set(key, { ...target, expires: Date.now() + CACHE_TTL_MS });
    return ok(c, {
        highTempF: target.highTempF,
        condition: target.condition,
        source: 'nws',
        cached: false,
    });
});

type ForecastResult = { highTempF: number | null; condition: string | null };

async function resolveDailyForecast(
    lat: number,
    lng: number,
    date: string,
): Promise<ForecastResult> {
    try {
        const pointsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`;
        const pointsRes = await fetch(pointsUrl, {
            headers: { 'User-Agent': NWS_USER_AGENT, Accept: 'application/geo+json' },
        });
        if (!pointsRes.ok) return { highTempF: null, condition: null };
        const points = (await pointsRes.json()) as {
            properties?: { forecast?: string };
        };
        const forecastUrl = points.properties?.forecast;
        if (!forecastUrl) return { highTempF: null, condition: null };

        const forecastRes = await fetch(forecastUrl, {
            headers: { 'User-Agent': NWS_USER_AGENT, Accept: 'application/geo+json' },
        });
        if (!forecastRes.ok) return { highTempF: null, condition: null };
        const forecast = (await forecastRes.json()) as {
            properties?: {
                periods?: Array<{
                    startTime: string;
                    isDaytime: boolean;
                    temperature: number;
                    temperatureUnit: 'F' | 'C';
                    shortForecast: string;
                }>;
            };
        };
        const periods = forecast.properties?.periods ?? [];
        const daytime = periods.find(
            (p) => p.isDaytime && p.startTime.slice(0, 10) === date,
        );
        if (!daytime) return { highTempF: null, condition: null };
        const tempF =
            daytime.temperatureUnit === 'C'
                ? Math.round(daytime.temperature * (9 / 5) + 32)
                : daytime.temperature;
        return { highTempF: tempF, condition: daytime.shortForecast ?? null };
    } catch (e) {
        console.error('nws forecast lookup failed', e);
        return { highTempF: null, condition: null };
    }
}
