"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut, type AuthUser } from "@/lib/auth/auth";
import { getProfile } from "@/lib/profile/service";
import type { ProfileRow } from "@/types/database";

type AuthContextValue = {
  user: AuthUser | null;
  profile: ProfileRow | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const current = await getCurrentUser();
    if (!current) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    setUser(current);
    const row = await getProfile(current.id);
    setProfile(row);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, profile, loading, refresh, logout }),
    [user, profile, loading, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}