import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { COMMUNITY_LIST } from "@/lib/dashboard/demo-data";
import { listOwnedCommunities } from "@/lib/communities/service";
import type { OwnedCommunity } from "@/lib/communities/types";
import { clientSessionCleared } from "@/store/sessionActions";
import { singleFlight } from "@/store/singleFlight";
import { isFresh, SHARED_CACHE_MS, type RequestStatus } from "@/store/status";

export type CommunityItem = {
  icon: string;
  name: string;
  members: string;
};

type CommunitiesState = {
  items: CommunityItem[];
  owned: OwnedCommunity[];
  ownedStatus: RequestStatus;
  ownedFor: string;
  ownedFetchedAt: number;
  status: RequestStatus;
  error: string | null;
  fetchedAt: number;
};

const initialState: CommunitiesState = {
  items: COMMUNITY_LIST.map((item) => ({
    icon: item.icon,
    name: item.name,
    members: item.members,
  })),
  owned: [],
  ownedStatus: "idle",
  ownedFor: "",
  ownedFetchedAt: 0,
  status: "succeeded",
  error: null,
  fetchedAt: 0,
};

export const fetchOwnedCommunities = createAsyncThunk(
  "communities/fetchOwned",
  async (arg: { userId: string; force?: boolean }) => {
    const communities = await singleFlight(`communities:owned:${arg.userId}`, () =>
      listOwnedCommunities(arg.userId),
    );
    return { userId: arg.userId, communities };
  },
  {
    condition: (arg, { getState }) => {
      if (arg.force) return true;
      const state = getState() as { communities: CommunitiesState };
      if (state.communities.ownedFor !== arg.userId) return true;
      if (state.communities.ownedStatus === "loading") return false;
      return !isFresh(state.communities.ownedFetchedAt, SHARED_CACHE_MS);
    },
  },
);

const communitiesSlice = createSlice({
  name: "communities",
  initialState,
  reducers: {
    communitiesTouched(state) {
      if (state.fetchedAt === 0) state.fetchedAt = Date.now();
      state.status = "succeeded";
    },
    communityCreated(state, action: PayloadAction<OwnedCommunity>) {
      state.owned = [
        action.payload,
        ...state.owned.filter((item) => item.id !== action.payload.id),
      ];
      state.ownedFor = action.payload.creatorId;
      state.ownedStatus = "succeeded";
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clientSessionCleared, () => initialState);
    builder.addCase(fetchOwnedCommunities.pending, (state, action) => {
      state.ownedStatus = "loading";
      state.error = null;
      if (state.ownedFor !== action.meta.arg.userId) state.owned = [];
    });
    builder.addCase(fetchOwnedCommunities.fulfilled, (state, action) => {
      const incomingIds = new Set(action.payload.communities.map((item) => item.id));
      const pendingLocal = state.owned.filter(
        (item) =>
          item.creatorId === action.payload.userId && !incomingIds.has(item.id),
      );
      state.owned = [...pendingLocal, ...action.payload.communities];
      state.ownedFor = action.payload.userId;
      state.ownedStatus = "succeeded";
      state.ownedFetchedAt = Date.now();
    });
    builder.addCase(fetchOwnedCommunities.rejected, (state, action) => {
      state.ownedStatus = "failed";
      state.error = action.error.message || "Could not load your communities.";
    });
  },
});

export const { communitiesTouched, communityCreated } = communitiesSlice.actions;
export const communitiesReducer = communitiesSlice.reducer;
