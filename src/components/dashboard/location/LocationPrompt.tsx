"use client";

import { useEffect, useState } from "react";
import {
  MANUAL_CITIES,
  readApproxLocation,
  requestBrowserLocation,
  saveApproxLocation,
  type ApproxLocation,
} from "@/lib/location/geo";
import styles from "../social.module.css";

type LocationPromptProps = {
  onResolved?: (loc: ApproxLocation) => void;
};

/**
 * Permission-based location gate — never forced; GPS or manual city.
 */
export function LocationPrompt({ onResolved }: LocationPromptProps) {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = readApproxLocation();
    if (!existing || existing.source === "none") {
      setOpen(true);
      return;
    }
    onResolved?.(existing);
    // Intentionally run once on mount for first-relevant location prompt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function allowGps() {
    setBusy(true);
    setError(null);
    const result = await requestBrowserLocation();
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setManual(true);
      return;
    }
    const loc: ApproxLocation = {
      lat: result.lat,
      lng: result.lng,
      city: null,
      area: null,
      source: "gps",
      updatedAt: new Date().toISOString(),
    };
    saveApproxLocation(loc);
    onResolved?.(loc);
    setOpen(false);
  }

  function chooseCity(city: (typeof MANUAL_CITIES)[number]) {
    const loc: ApproxLocation = {
      lat: city.lat,
      lng: city.lng,
      city: city.city,
      area: city.area,
      source: "manual",
      updatedAt: new Date().toISOString(),
    };
    saveApproxLocation(loc);
    onResolved?.(loc);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className={styles.prompt} role="dialog" aria-modal="true" aria-labelledby="loc-title">
      <div className={styles.promptCard}>
        <h2 id="loc-title">Find people and plans near you</h2>
        <p>
          Allow Vemee to use your location to discover activities, plans and
          people nearby. We only use approximate location — never your exact
          address.
        </p>
        {error ? <p className={styles.error}>{error}</p> : null}

        {!manual ? (
          <div className={styles.promptActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => void allowGps()}
              disabled={busy}
            >
              {busy ? "Getting location…" : "Allow Location"}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => setManual(true)}
            >
              Choose Location Manually
            </button>
          </div>
        ) : (
          <>
            <p style={{ marginTop: 14 }}>
              Location access is off. Choose your city or area manually.
            </p>
            <div className={styles.cityList}>
              {MANUAL_CITIES.map((city) => (
                <button
                  key={`${city.city}-${city.area}`}
                  type="button"
                  className={styles.cityBtn}
                  onClick={() => chooseCity(city)}
                >
                  {city.city}
                  <span style={{ display: "block", color: "var(--vemee-muted)", fontSize: 12 }}>
                    {city.area}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
