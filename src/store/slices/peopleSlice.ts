import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  listAcceptedForAsync,
  listPendingForAsync,
  type Connection,
} from "@/lib/connections/service";
import type { ApproxLocation } from "@/lib/location/geo";
import {
  buildCreatorMapAsync,
  listPeopleYouMayConnectWith,
  type PeopleCard,
} from "@/lib/people/service";
import { clientSessionCleared } from "@/store/sessionActions";
import { singleFlight } from "@/store/singleFlight";
import { isFresh, SHARED_CACHE_MS, type RequestStatus } from "@/store/status";

export type PeopleState = {
  items: PeopleCard[];
  pending: Connection[];
  accepted: Connection[];
  names: Record<string, string>;
  status: RequestStatus;
  connectionsStatus: RequestStatus;
  error: string | null;
  key: string;
  fetchedAt: number;
  connectionsFetchedAt: number;
  page: number;
  hasMore: boolean;
};

const initialState: PeopleState = {
  items: [],
  pending: [],
  accepted: [],
  names: {},
  status: "idle",
  connectionsStatus: "idle",
  error: null,
  key: "",
  fetchedAt: 0,
  connectionsFetchedAt: 0,
  page: 0,
  hasMore: false,
};

type PeopleArgs = {
  userId: string;
  location: ApproxLocation | null;
  force?: boolean;
};

export function peopleKey(userId: string, location: ApproxLocation | null) {
  return `${userId}|${location?.lat ?? ""}|${location?.city ?? ""}`;
}

export const fetchPeopleCards = createAsyncThunk(
  "people/fetchCards",
  async (arg: PeopleArgs) => {
    const key = peopleKey(arg.userId, arg.location);
    const items = await singleFlight(`people:${key}`, () =>
      listPeopleYouMayConnectWith(arg.userId, {
        userLocation: arg.location,
        currentInterests: [],
      }),
    );
    return { key, items };
  },
  {
    condition: (arg, { getState }) => {
      const people = (getState() as { people: PeopleState }).people;
      const key = peopleKey(arg.userId, arg.location);
      if (people.status === "loading" && people.key === key) return false;
      if (
        !arg.force &&
        people.status === "succeeded" &&
        people.key === key &&
        isFresh(people.fetchedAt, SHARED_CACHE_MS)
      ) {
        return false;
      }
      return true;
    },
  },
);

export const fetchPeopleConnections = createAsyncThunk(
  "people/fetchConnections",
  async (arg: PeopleArgs) => {
    return singleFlight(`people-connections:${arg.userId}`, async () => {
      const [pending, accepted] = await Promise.all([
        listPendingForAsync(arg.userId),
        listAcceptedForAsync(arg.userId),
      ]);
      const ids = new Set<string>();
      for (const req of pending) ids.add(req.requesterId);
      for (const row of accepted) {
        ids.add(row.requesterId === arg.userId ? row.recipientId : row.requesterId);
      }
      const creators = await buildCreatorMapAsync([...ids]);
      const names: Record<string, string> = {};
      for (const id of ids) names[id] = creators.get(id)?.name || "a member";
      return { pending, accepted, names };
    });
  },
  {
    condition: (arg, { getState }) => {
      if (!arg.userId) return false;
      const people = (getState() as { people: PeopleState }).people;
      if (people.connectionsStatus === "loading") return false;
      if (
        !arg.force &&
        people.connectionsStatus === "succeeded" &&
        isFresh(people.connectionsFetchedAt, SHARED_CACHE_MS)
      ) {
        return false;
      }
      return true;
    },
  },
);

const peopleSlice = createSlice({
  name: "people",
  initialState,
  reducers: {
    setPersonConnection(
      state,
      action: PayloadAction<{
        id: string;
        status: PeopleCard["connectionStatus"];
      }>,
    ) {
      const person = state.items.find((item) => item.id === action.payload.id);
      if (person) person.connectionStatus = action.payload.status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPeopleCards.pending, (state, action) => {
        const key = peopleKey(action.meta.arg.userId, action.meta.arg.location);
        const keep = state.key === key && state.status === "succeeded";
        if (state.key !== key) state.items = [];
        state.key = key;
        if (!keep) state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPeopleCards.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.key = action.payload.key;
        state.status = "succeeded";
        state.error = null;
        state.fetchedAt = Date.now();
        state.page = 0;
        state.hasMore = false;
      })
      .addCase(fetchPeopleCards.rejected, (state, action) => {
        if (action.meta.condition) return;
        if (state.items.length === 0) {
          state.status = "failed";
          state.error = "Couldn't load people.";
        }
      })
      .addCase(fetchPeopleConnections.pending, (state) => {
        if (state.connectionsStatus !== "succeeded") {
          state.connectionsStatus = "loading";
        }
        state.error = null;
      })
      .addCase(fetchPeopleConnections.fulfilled, (state, action) => {
        state.pending = action.payload.pending;
        state.accepted = action.payload.accepted;
        state.names = action.payload.names;
        state.connectionsStatus = "succeeded";
        state.connectionsFetchedAt = Date.now();
      })
      .addCase(fetchPeopleConnections.rejected, (state, action) => {
        if (action.meta.condition) return;
        state.connectionsStatus = "failed";
        state.error = "Couldn't load people.";
      })
      .addCase(clientSessionCleared, () => initialState);
  },
});

export const { setPersonConnection } = peopleSlice.actions;
export const peopleReducer = peopleSlice.reducer;
