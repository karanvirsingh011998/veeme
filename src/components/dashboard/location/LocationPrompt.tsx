"use client";

import { useEffect, useState } from "react";
import {
  MANUAL_CITIES,
  readApproxLocation,
  type ApproxLocation,
} from "@/lib/location/geo";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectApproxLocation, selectLocationError, selectLocationStatus } from "@/store/selectors/sharedSelectors";
import {
  commitApproxLocation,
  isStoredLocationStale,
  requestDeviceLocation,
} from "@/store/slices/locationSlice";
import styles from "../social.module.css";

type LocationPromptProps = {
  onResolved?: (loc: ApproxLocation) => void;
};

/**
 * Permission-based location gate. A saved location is reused from Redux
 * instead of asking the browser again on every screen.
 */
export function LocationPrompt({ onResolved }: LocationPromptProps) {
  const dispatch = useAppDispatch();
  const stored = useAppSelector(selectApproxLocation);
  const status = useAppSelector(selectLocationStatus);
  const locationError = useAppSelector(selectLocationError);
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = status === "loading";

  useEffect(() => {
    const existing = stored ?? readApproxLocation();
    if (
      existing &&
      existing.source !== "none" &&
      !isStoredLocationStale(existing.updatedAt, existing.source)
    ) {
      if (!stored) dispatch(commitApproxLocation(existing));
      onResolved?.(existing);
      return;
    }
    setOpen(true);
    if (existing && isStoredLocationStale(existing.updatedAt, existing.source)) setManual(false);
    // Ask once per mount. Later screens read the shared Redux location.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function allowGps() {
    setError(null);
    const result = await dispatch(requestDeviceLocation());
    if (requestDeviceLocation.rejected.match(result)) {
      const payload = result.payload as { error?: string } | undefined;
      setError(payload?.error || locationError || "Location permission was not granted.");
      setManual(true);
      return;
    }
    if (requestDeviceLocation.fulfilled.match(result)) {
      onResolved?.(result.payload);
      setOpen(false);
    }
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
    dispatch(commitApproxLocation(loc));
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
