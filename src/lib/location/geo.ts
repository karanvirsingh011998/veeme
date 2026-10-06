/**
 * Approximate location helpers — never expose exact coordinates in UI.
 */

export type ApproxLocation = {
  lat: number | null;
  lng: number | null;
  city: string | null;
  area: string | null;
  source: "gps" | "manual" | "none";
  updatedAt: string;
};

const LOCATION_KEY = "vemee_approx_location_v1";

export function readApproxLocation(): ApproxLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? (JSON.parse(raw) as ApproxLocation) : null;
  } catch {
    return null;
  }
}

export function saveApproxLocation(loc: ApproxLocation): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
}

export function clearApproxLocation(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCATION_KEY);
}

/** Haversine distance in km. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Public-facing approximate distance label. */
export function formatApproxDistance(km: number): string {
  if (km < 0.2) return "Nearby";
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

/**
 * Request browser geolocation (permission-based).
 */
export function requestBrowserLocation(): Promise<
  | { ok: true; lat: number; lng: number }
  | { ok: false; error: string; denied?: boolean }
> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ ok: false, error: "Geolocation is not supported on this device." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        resolve({
          ok: false,
          error: err.message || "Location permission was not granted.",
          denied: err.code === err.PERMISSION_DENIED,
        });
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 },
    );
  });
}

/** City presets for manual location (India-first MVP). */
export const MANUAL_CITIES = [
  { city: "Chandigarh", area: "Sector 17", lat: 30.7415, lng: 76.7785 },
  { city: "Mohali", area: "Phase 5", lat: 30.7046, lng: 76.7179 },
  { city: "Panchkula", area: "Sector 5", lat: 30.6942, lng: 76.8606 },
  { city: "Delhi", area: "Connaught Place", lat: 28.6315, lng: 77.2167 },
  { city: "Gurugram", area: "Cyber Hub", lat: 28.495, lng: 77.089 },
  { city: "Noida", area: "Sector 18", lat: 28.5708, lng: 77.3261 },
  { city: "Bengaluru", area: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  { city: "Mumbai", area: "Bandra", lat: 19.0596, lng: 72.8295 },
] as const;
