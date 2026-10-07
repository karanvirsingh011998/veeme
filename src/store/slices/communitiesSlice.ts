import { createSlice } from "@reduxjs/toolkit";
import { COMMUNITY_LIST } from "@/lib/dashboard/demo-data";
import { clientSessionCleared } from "@/store/sessionActions";
import type { RequestStatus } from "@/store/status";

export type CommunityItem = {
  icon: string;
  name: string;
  members: string;
};

type CommunitiesState = {
  items: CommunityItem[];
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
  status: "succeeded",
  error: null,
  fetchedAt: 0,
};

const communitiesSlice = createSlice({
  name: "communities",
  initialState,
  reducers: {
    communitiesTouched(state) {
      if (state.fetchedAt === 0) state.fetchedAt = Date.now();
      state.status = "succeeded";
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clientSessionCleared, () => initialState);
  },
});

export const { communitiesTouched } = communitiesSlice.actions;
export const communitiesReducer = communitiesSlice.reducer;
