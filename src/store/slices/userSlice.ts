import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { listAcceptedForAsync } from "@/lib/connections/service";
import { listUserPlansAsync } from "@/lib/plans/service";
import type { ProfileRow } from "@/types/database";
import { clientSessionCleared } from "@/store/sessionActions";
import { singleFlight } from "@/store/singleFlight";
import { isFresh, SHARED_CACHE_MS, type RequestStatus } from "@/store/status";

export type UserState = {
  profile: ProfileRow | null;
  status: RequestStatus;
  error: string | null;
  createdCount: number;
  joinedCount: number;
  connectionCount: number;
  statsStatus: RequestStatus;
  statsError: string | null;
  statsFetchedAt: number;
};

const initialState: UserState = {
  profile: null,
  status: "idle",
  error: null,
  createdCount: 0,
  joinedCount: 0,
  connectionCount: 0,
  statsStatus: "idle",
  statsError: null,
  statsFetchedAt: 0,
};

export const fetchProfileStats = createAsyncThunk(
  "user/fetchStats",
  async (userId: string, { getState }) => {
    const current = (getState() as { user: UserState }).user;
    if (
      current.statsStatus === "succeeded" &&
      isFresh(current.statsFetchedAt, SHARED_CACHE_MS)
    ) {
      return null;
    }
    return singleFlight(`profile-stats:${userId}`, async () => {
      const [{ created, joined }, accepted] = await Promise.all([
        listUserPlansAsync(userId),
        listAcceptedForAsync(userId),
      ]);
      return {
        createdCount: created.length,
        joinedCount: joined.length,
        connectionCount: accepted.length,
      };
    });
  },
  {
    condition: (userId, { getState }) => {
      const user = (getState() as { user: UserState }).user;
      if (!userId) return false;
      if (user.statsStatus === "loading") return false;
      if (
        user.statsStatus === "succeeded" &&
        isFresh(user.statsFetchedAt, SHARED_CACHE_MS)
      ) {
        return false;
      }
      return true;
    },
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    profileLoaded(state, action: PayloadAction<ProfileRow | null>) {
      state.profile = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    profileFailed(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
    profileCleared(state) {
      state.profile = null;
      state.status = "idle";
      state.error = null;
      state.createdCount = 0;
      state.joinedCount = 0;
      state.connectionCount = 0;
      state.statsStatus = "idle";
      state.statsError = null;
      state.statsFetchedAt = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileStats.pending, (state) => {
        if (state.statsStatus !== "succeeded") state.statsStatus = "loading";
        state.statsError = null;
      })
      .addCase(fetchProfileStats.fulfilled, (state, action) => {
        if (!action.payload) return;
        state.createdCount = action.payload.createdCount;
        state.joinedCount = action.payload.joinedCount;
        state.connectionCount = action.payload.connectionCount;
        state.statsStatus = "succeeded";
        state.statsError = null;
        state.statsFetchedAt = Date.now();
      })
      .addCase(fetchProfileStats.rejected, (state, action) => {
        if (action.meta.condition) return;
        state.statsStatus = "failed";
        state.statsError = "Couldn't load your activity.";
      })
      .addCase(clientSessionCleared, () => initialState);
  },
});

export const { profileLoaded, profileFailed, profileCleared } = userSlice.actions;
export const userReducer = userSlice.reducer;
