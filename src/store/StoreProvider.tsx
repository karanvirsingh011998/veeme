"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/store";
import { locationHydrated } from "@/store/slices/locationSlice";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    storeRef.current?.dispatch(locationHydrated());
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
