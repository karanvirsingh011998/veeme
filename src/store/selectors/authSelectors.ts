import type { RootState } from "@/store";

export const selectAuthUser = (state: RootState) => state.auth.user;

export const selectAuthSession = (state: RootState) => state.auth.session;

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

export const selectAuthInitialized = (state: RootState) => state.auth.initialized;

export const selectAuthStatus = (state: RootState) => state.auth.status;

export const selectAuthLoading = (state: RootState) =>
  !state.auth.initialized || state.auth.status === "loading";
