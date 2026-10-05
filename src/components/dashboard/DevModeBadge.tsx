"use client";

import { useEffect, useState } from "react";
import { getAuthConfig } from "@/lib/auth/auth";
import styles from "./DevModeBadge.module.css";

/**
 * Development-only indicator for auth mode. Hidden in production / Supabase mode.
 */
export function DevModeBadge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    getAuthConfig().then((config) => {
      setShow(config.showDevIndicator);
    });
  }, []);

  if (!show) return null;

  return (
    <div className={styles.badge} role="status">
      Development mode · Dummy OTP enabled
    </div>
  );
}