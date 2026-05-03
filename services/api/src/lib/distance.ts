// Haversine distance helpers. Used by match-preview + auto-match worker.

const EARTH_R_MILES = 3958.7613;

export function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

// County centroid fallbacks for workers without a precise location. Keeps the
// match-preview meaningful before we ship worker-side geo opt-in.
export const COUNTY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  Fresno: { lat: 36.7378, lng: -119.7871 },
  Kern:   { lat: 35.3733, lng: -119.0187 },
  Kings:  { lat: 36.0758, lng: -119.8155 },
  Madera: { lat: 36.9613, lng: -120.0607 },
  Tulare: { lat: 36.2077, lng: -119.3473 },
};

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
