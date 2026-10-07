import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { buildCreatorMapAsync } from "@/lib/people/service";
import {
  joinPlan,
  listPlansPage,
  type PlanWithMeta,
} from "@/lib/plans/service";
import type { PlanFilters } from "@/lib/plans/types";
import type { ApproxLocation } from "@/lib/location/geo";
import { clientSessionCleared } from "@/store/sessionActions";
import { singleFlight } from "@/store/singleFlight";
import { isFresh, SHARED_CACHE_MS, type RequestStatus } from "@/store/status";

export const plansAdapter = createEntityAdapter<PlanWithMeta>();

export type PlanListBucket = {
  ids: string[];
  status: RequestStatus;
  loadingMore: boolean;
  error: string | null;
  offset: number;
  hasMore: boolean;
  key: string;
  fetchedAt: number;
};

export type PlansState = {
  catalog: ReturnType<typeof plansAdapter.getInitialState>;
  home: PlanListBucket;
  explore: PlanListBucket;
  filters: PlanFilters;
  selectedId: string | null;
  joined: Record<string, boolean>;
};

const defaultFilters: PlanFilters = {
  category: "all",
  datePreset: "all",
  distanceKm: "all",
  availability: "all",
};

function emptyBucket(): PlanListBucket {
  return {
    ids: [],
    status: "idle",
    loadingMore: false,
    error: null,
    offset: 0,
    hasMore: true,
    key: "",
    fetchedAt: 0,
  };
}

const initialState: PlansState = {
  catalog: plansAdapter.getInitialState(),
  home: emptyBucket(),
  explore: emptyBucket(),
  filters: defaultFilters,
  selectedId: null,
  joined: {},
};

type HomeArgs = {
  userId: string;
  location: ApproxLocation | null;
  force?: boolean;
};

type ExploreArgs = {
  userId: string;
  location: ApproxLocation | null;
  filters: PlanFilters;
  offset: number;
  append: boolean;
  force?: boolean;
};

export function homePlansKey(userId: string, location: ApproxLocation | null) {
  return `${userId}|${location?.lat ?? ""}|${location?.lng ?? ""}|${location?.city ?? ""}`;
}

export function explorePlansKey(
  userId: string,
  filters: PlanFilters,
  location: ApproxLocation | null,
) {
  return JSON.stringify({
    userId,
    category: filters.category ?? "all",
    date: filters.datePreset ?? "all",
    distance: filters.distanceKm ?? "all",
    availability: filters.availability ?? "all",
    city: location?.city ?? null,
    lat: location?.lat ?? null,
  });
}

async function namePlans(plans: PlanWithMeta[]) {
  const creators = await buildCreatorMapAsync(plans.map((plan) => plan.creatorId));
  return plans.map((plan) => {
    const creator = creators.get(plan.creatorId);
    return creator
      ? { ...plan, creatorName: creator.name, creatorAvatar: creator.avatar }
      : plan;
  });
}

export const fetchHomePlans = createAsyncThunk(
  "plans/fetchHome",
  async (arg: HomeArgs) => {
    const key = homePlansKey(arg.userId, arg.location);
    const page = await singleFlight(`plans:home:${key}`, () =>
      listPlansPage(
        { distanceKm: arg.location?.lat != null ? "25" : "all" },
        { userLocation: arg.location, viewerId: arg.userId, limit: 12 },
      ),
    );
    const plans = await namePlans(page.plans);
    return { key, plans, hasMore: page.hasMore };
  },
  {
    condition: (arg, { getState }) => {
      const home = (getState() as { plans: PlansState }).plans.home;
      const key = homePlansKey(arg.userId, arg.location);
      if (home.status === "loading" && home.key === key) return false;
      if (
        !arg.force &&
        home.status === "succeeded" &&
        home.key === key &&
        isFresh(home.fetchedAt, SHARED_CACHE_MS)
      ) {
        return false;
      }
      return true;
    },
  },
);

export const fetchExplorePlans = createAsyncThunk(
  "plans/fetchExplore",
  async (arg: ExploreArgs) => {
    const key = explorePlansKey(arg.userId, arg.filters, arg.location);
    const page = await singleFlight(`plans:explore:${key}:${arg.offset}`, () =>
      listPlansPage(arg.filters, {
        userLocation: arg.location,
        viewerId: arg.userId,
        limit: 20,
        offset: arg.offset,
      }),
    );
    const plans = await namePlans(page.plans);
    return {
      key,
      plans,
      hasMore: page.hasMore,
      offset: arg.offset,
      append: arg.append,
    };
  },
  {
    condition: (arg, { getState }) => {
      const explore = (getState() as { plans: PlansState }).plans.explore;
      if (arg.append) return !explore.loadingMore;
      const key = explorePlansKey(arg.userId, arg.filters, arg.location);
      if (explore.status === "loading" && explore.key === key) return false;
      if (
        !arg.force &&
        explore.status === "succeeded" &&
        explore.key === key &&
        isFresh(explore.fetchedAt, SHARED_CACHE_MS)
      ) {
        return false;
      }
      return true;
    },
  },
);

export const joinPlanOptimistic = createAsyncThunk(
  "plans/join",
  async (arg: { planId: string; userId: string }, { dispatch }) => {
    dispatch(markJoined({ planId: arg.planId, joined: true }));
    const result = await joinPlan(arg.planId, arg.userId);
    if (!result.ok) {
      dispatch(markJoined({ planId: arg.planId, joined: false }));
      throw new Error(result.error);
    }
  },
);

function rememberJoined(state: PlansState, plans: PlanWithMeta[]) {
  for (const plan of plans) {
    if (plan.viewerJoined) state.joined[plan.id] = true;
    else if (state.joined[plan.id] !== true) state.joined[plan.id] = false;
  }
}

function mergeIds(existing: string[], incoming: string[]) {
  const seen = new Set(existing);
  const next = [...existing];
  for (const id of incoming) {
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}

const plansSlice = createSlice({
  name: "plans",
  initialState,
  reducers: {
    setExploreFilters(state, action: PayloadAction<PlanFilters>) {
      state.filters = action.payload;
    },
    selectPlan(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    upsertPlans(state, action: PayloadAction<PlanWithMeta[]>) {
      plansAdapter.upsertMany(state.catalog, action.payload);
      rememberJoined(state, action.payload);
    },
    markJoined(state, action: PayloadAction<{ planId: string; joined: boolean }>) {
      state.joined[action.payload.planId] = action.payload.joined;
      const entity = state.catalog.entities[action.payload.planId];
      if (entity) entity.viewerJoined = action.payload.joined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomePlans.pending, (state, action) => {
        const key = homePlansKey(action.meta.arg.userId, action.meta.arg.location);
        const keep = state.home.key === key && state.home.status === "succeeded";
        if (state.home.key !== key) state.home.ids = [];
        state.home.key = key;
        if (!keep) state.home.status = "loading";
        state.home.error = null;
      })
      .addCase(fetchHomePlans.fulfilled, (state, action) => {
        if (!action.payload) return;
        plansAdapter.upsertMany(state.catalog, action.payload.plans);
        state.home.ids = action.payload.plans.map((plan) => plan.id);
        state.home.hasMore = action.payload.hasMore;
        state.home.offset = 0;
        state.home.status = "succeeded";
        state.home.error = null;
        state.home.fetchedAt = Date.now();
        state.home.key = action.payload.key;
        rememberJoined(state, action.payload.plans);
      })
      .addCase(fetchHomePlans.rejected, (state, action) => {
        if (action.meta.condition) return;
        if (state.home.ids.length === 0) {
          state.home.status = "failed";
          state.home.error = "Couldn't load plans.";
        }
      })
      .addCase(fetchExplorePlans.pending, (state, action) => {
        if (action.meta.arg.append) {
          state.explore.loadingMore = true;
          state.explore.error = null;
          return;
        }
        const key = explorePlansKey(
          action.meta.arg.userId,
          action.meta.arg.filters,
          action.meta.arg.location,
        );
        const keep = state.explore.key === key && state.explore.status === "succeeded";
        if (state.explore.key !== key) {
          state.explore.ids = [];
          state.explore.offset = 0;
        }
        state.explore.key = key;
        if (!keep) state.explore.status = "loading";
        state.explore.error = null;
      })
      .addCase(fetchExplorePlans.fulfilled, (state, action) => {
        plansAdapter.upsertMany(state.catalog, action.payload.plans);
        const ids = action.payload.plans.map((plan) => plan.id);
        state.explore.ids = action.payload.append
          ? mergeIds(state.explore.ids, ids)
          : ids;
        state.explore.offset = action.payload.offset;
        state.explore.hasMore = action.payload.hasMore;
        state.explore.status = "succeeded";
        state.explore.loadingMore = false;
        state.explore.error = null;
        state.explore.fetchedAt = Date.now();
        state.explore.key = action.payload.key;
        rememberJoined(state, action.payload.plans);
      })
      .addCase(fetchExplorePlans.rejected, (state, action) => {
        if (action.meta.condition) return;
        state.explore.loadingMore = false;
        if (state.explore.ids.length === 0 || !action.meta.arg.append) {
          if (state.explore.ids.length === 0) {
            state.explore.status = "failed";
            state.explore.error = "Couldn't load plans.";
          }
        }
      })
      .addCase(clientSessionCleared, () => initialState);
  },
});

export const { setExploreFilters, selectPlan, upsertPlans, markJoined } =
  plansSlice.actions;
export const plansReducer = plansSlice.reducer;
