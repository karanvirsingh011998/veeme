import type { RootState } from "@/store";

export const selectProfile = (state: RootState) => state.user.profile;

export const selectProfileStatus = (state: RootState) => state.user.status;

export const selectCurrentUserId = (state: RootState) =>
  state.user.profile?.id || state.auth.user?.id || "";

export const selectProfileStats = (state: RootState) => ({
  createdCount: state.user.createdCount,
  joinedCount: state.user.joinedCount,
  connectionCount: state.user.connectionCount,
  status: state.user.statsStatus,
  error: state.user.statsError,
});
