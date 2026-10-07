"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { readAuthSession } from "@/lib/auth/session";
import { SplashScreen } from "@/components/ui/SplashScreen";

/**
 * Login and signup are for signed-out visitors.
 * An existing session goes to the dashboard.
 */
export function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (readAuthSession()) {
      router.replace("/dashboard");
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return <SplashScreen message="Loading your plans…" />;
  }

  return <>{children}</>;
}
