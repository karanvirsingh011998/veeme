import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  readApproxLocation,
  requestBrowserLocation,
  saveApproxLocation,
  type ApproxLocation,
} from "@/lib/location/geo";
import type { RequestStatus } from "@/store/status";

export const LOCATION_STALE_MS = 30 * 60 * 1000;

type LocationPermission = "unknown" | "granted" | "denied";

type LocationState = {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  area: string | null;
  source: ApproxLocation["source"];
  permission: LocationPermission;
  updatedAt: string | null;
  status: RequestStatus;
  error: string | null;
};

const initialState: LocationState = {
  latitude: null,
  longitude: null,
  city: null,
  area: null,
  source: "none",
  permission: "unknown",
  updatedAt: null,
  status: "idle",
  error: null,
};

function toState(loc: ApproxLocation, permission?: LocationPermission): LocationState {
  return {
    latitude: loc.lat,
    longitude: loc.lng,
    city: loc.city,
    area: loc.area,
    source: loc.source,
    permission:
      permission ??
      (loc.source === "gps" ? "granted" : loc.source === "manual" ? "granted" : "unknown"),
    updatedAt: loc.updatedAt,
    status: "succeeded",
    error: null,
  };
}

export function isStoredLocationStale(
  updatedAt: string | null,
  source: "gps" | "manual" | "none" = "gps",
) {
  if (!updatedAt || source === "none") return true;
  const age = Date.now() - new Date(updatedAt).getTime();
  if (Number.isNaN(age)) return true;
  const maxAge = source === "manual" ? 7 * 24 * 60 * 60 * 1000 : LOCATION_STALE_MS;
  return age > maxAge;
}

export const requestDeviceLocation = createAsyncThunk(
  "location/request",
  async (_, { rejectWithValue }) => {
    const result = await requestBrowserLocation();
    if (!result.ok) {
      return rejectWithValue({
        error: result.error,
        denied: Boolean(result.denied),
      });
    }
    const loc: ApproxLocation = {
      lat: result.lat,
      lng: result.lng,
      city: null,
      area: null,
      source: "gps",
      updatedAt: new Date().toISOString(),
    };
    saveApproxLocation(loc);
    return loc;
  },
);

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    locationCommitted(state, action: PayloadAction<ApproxLocation>) {
      const next = toState(action.payload);
      state.latitude = next.latitude;
      state.longitude = next.longitude;
      state.city = next.city;
      state.area = next.area;
      state.source = next.source;
      state.permission = next.permission;
      state.updatedAt = next.updatedAt;
      state.status = "succeeded";
      state.error = null;
    },
    locationHydrated(state) {
      const existing = readApproxLocation();
      if (!existing || existing.source === "none") {
        state.status = "succeeded";
        return;
      }
      const next = toState(existing);
      state.latitude = next.latitude;
      state.longitude = next.longitude;
      state.city = next.city;
      state.area = next.area;
      state.source = next.source;
      state.permission = next.permission;
      state.updatedAt = next.updatedAt;
      state.status = "succeeded";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestDeviceLocation.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(requestDeviceLocation.fulfilled, (state, action) => {
        const next = toState(action.payload, "granted");
        state.latitude = next.latitude;
        state.longitude = next.longitude;
        state.city = next.city;
        state.area = next.area;
        state.source = next.source;
        state.permission = "granted";
        state.updatedAt = next.updatedAt;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(requestDeviceLocation.rejected, (state, action) => {
        const payload = action.payload as { error: string; denied: boolean } | undefined;
        state.status = "failed";
        state.error = payload?.error || "Location permission was not granted.";
        if (payload?.denied) state.permission = "denied";
      });
  },
});

export const { locationCommitted, locationHydrated } = locationSlice.actions;

export function commitApproxLocation(loc: ApproxLocation) {
  saveApproxLocation(loc);
  return locationCommitted(loc);
}

export const locationReducer = locationSlice.reducer;
