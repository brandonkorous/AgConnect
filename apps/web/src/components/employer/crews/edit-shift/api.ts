'use client';

import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';

export type WeatherForecast = {
  highTempF: number | null;
  condition: string | null;
  source: 'nws';
  cached: boolean;
};

export async function fetchWeatherForecast(
  locale: string,
  lat: number,
  lng: number,
  date: string,
): Promise<WeatherForecast | null> {
  const client = getApiClient(locale === 'es' ? 'es' : 'en');
  const qs = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    date,
  });
  const res = await client.get<WeatherForecast>(
    `/v1/employer/weather/forecast?${qs.toString()}`,
    { handleErrorInline: true },
  );
  if (!isOk(res)) return null;
  return res.data;
}
