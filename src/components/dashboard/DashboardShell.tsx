"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/dashboard/AuthProvider";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { DesktopSidebar } from "@/components/dashboard/DesktopSidebar";
import { DevModeBadge } from "@/components/dashboard/DevModeBadge";
import styles from "./DashboardShell.module.css";

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading Vemee…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.loading}>
        <p>Redirecting to login…</p>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Authenticated app chrome: sidebar on desktop, bottom nav on mobile.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Guard>
        <div className={styles.shell}>
          <DevModeBadge />
          <DesktopSidebar />
          <div className={styles.mainCol}>
            <div className={styles.scroll}>{children}</div>
            <BottomNav />
          </div>
        </div>
      </Guard>
    </AuthProvider>
  );
}