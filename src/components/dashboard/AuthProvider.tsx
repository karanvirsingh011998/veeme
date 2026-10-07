"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectAuthLoading,
  selectAuthUser,
} from "@/store/selectors/authSelectors";
import { selectProfile } from "@/store/selectors/userSelectors";
import { clientSessionCleared } from "@/store/sessionActions";
import { initializeSession } from "@/store/slices/authSlice";

/**
 * Boots auth once and mirrors Supabase auth events into Redux.
 * Screens read the same session through useAuth().
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(initializeSession());
    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        void getCurrentUser().then((user) => {
          if (!user) dispatch(clientSessionCleared());
        });
        return;
      }
      if (
        event === "SIGNED_IN" ||
        event === "USER_UPDATED" ||
        event === "TOKEN_REFRESHED"
      ) {
        void dispatch(initializeSession());
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(selectAuthUser);
  const profile = useAppSelector(selectProfile);
  const loading = useAppSelector(selectAuthLoading);

  const refresh = useCallback(async () => {
    await dispatch(initializeSession({ force: true }));
  }, [dispatch]);

  const logout = useCallback(async () => {
    await signOut();
    dispatch(clientSessionCleared());
    router.replace("/login");
  }, [dispatch, router]);

  return { user, profile, loading, refresh, logout };
}
