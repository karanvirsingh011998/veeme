"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/dashboard/AuthProvider";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { DesktopSidebar } from "@/components/dashboard/DesktopSidebar";
import { DevModeBadge } from "@/components/dashboard/DevModeBadge";
import { ChatUnreadProvider } from "@/components/dashboard/chat/ChatUnreadProvider";
import { SplashScreen } from "@/components/ui/SplashScreen";
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
    return <SplashScreen message="Loading your plans…" />;
  }

  if (!user) {
    return <SplashScreen message="Taking you to login…" />;
  }

  return <>{children}</>;
}

/**
 * Authenticated app chrome: sidebar on desktop, bottom nav on mobile.
 */
function ShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const chatThread =
    pathname.startsWith("/dashboard/chat/") && pathname !== "/dashboard/chat";

  return (
    <div className={styles.shell}>
      <DevModeBadge />
      <DesktopSidebar />
      <div className={styles.mainCol}>
        <div
          className={`${styles.scroll} ${chatThread ? styles.scrollFlush : ""}`}
        >
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Guard>
        <ChatUnreadProvider>
          <ShellFrame>{children}</ShellFrame>
        </ChatUnreadProvider>
      </Guard>
    </AuthProvider>
  );
}