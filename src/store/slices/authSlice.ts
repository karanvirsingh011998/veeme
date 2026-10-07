import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getCurrentUser, type AuthUser } from "@/lib/auth/auth";
import { readAuthSession, type AuthSession } from "@/lib/auth/session";
import { getProfile } from "@/lib/profile/service";
import { clientSessionCleared } from "@/store/sessionActions";
import { singleFlight } from "@/store/singleFlight";
import type { RequestStatus } from "@/store/status";
import {
  profileCleared,
  profileFailed,
  profileLoaded,
  type UserState,
} from "@/store/slices/userSlice";

export type AuthState = {
  user: AuthUser | null;
  /** App session identity. Access tokens stay in the Supabase client. */
  session: AuthSession | null;
  isAuthenticated: boolean;
  initialized: boolean;
  status: RequestStatus;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  initialized: false,
  status: "idle",
  error: null,
};

let profileFlight: { id: string; promise: Promise<Awaited<ReturnType<typeof getProfile>>> } | null =
  null;

function loadProfile(userId: string) {
  if (profileFlight?.id === userId) return profileFlight.promise;
  const promise = getProfile(userId).finally(() => {
    if (profileFlight?.promise === promise) profileFlight = null;
  });
  profileFlight = { id: userId, promise };
  return promise;
}

type SessionArg = { force?: boolean } | undefined;

export const initializeSession = createAsyncThunk(
  "auth/initialize",
  async (arg: SessionArg, { dispatch, getState }) => {
    await singleFlight("auth:initialize", async () => {
      const force = Boolean(arg?.force);
      const user = await getCurrentUser();
      const session = readAuthSession();
      if (!user) {
        dispatch(authReady({ user: null, session: null }));
        dispatch(profileCleared());
        return;
      }

      const state = getState() as { auth: AuthState; user: UserState };
      if (
        !force &&
        state.auth.initialized &&
        state.auth.user?.id === user.id &&
        state.user.status === "succeeded"
      ) {
        dispatch(authReady({ user, session }));
        return;
      }

      try {
        const profile = await loadProfile(user.id);
        dispatch(profileLoaded(profile));
        dispatch(authReady({ user, session }));
      } catch {
        dispatch(profileFailed("Couldn't load your profile."));
        dispatch(authReady({ user, session }));
      }
    });
  },
  {
    condition: (_, { getState }) => {
      const auth = (getState() as { auth: AuthState }).auth;
      return auth.status !== "loading";
    },
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authReady(
      state,
      action: PayloadAction<{ user: AuthUser | null; session: AuthSession | null }>,
    ) {
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.isAuthenticated = Boolean(action.payload.user);
      state.initialized = true;
      state.status = "succeeded";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSession.pending, (state, action) => {
        if (state.initialized && state.user && !action.meta.arg?.force) return;
        state.status = "loading";
        state.error = null;
      })
      .addCase(initializeSession.rejected, (state, action) => {
        if (action.meta.condition) return;
        state.initialized = true;
        state.status = "failed";
        state.error = action.error.message || "Couldn't restore your session.";
      })
      .addCase(clientSessionCleared, (state) => {
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.initialized = true;
        state.status = "succeeded";
        state.error = null;
      });
  },
});

export const { authReady } = authSlice.actions;
export const authReducer = authSlice.reducer;
