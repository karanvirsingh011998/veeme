import { createSelector } from "@reduxjs/toolkit";
import type { PlanWithMeta } from "@/lib/plans/service";
import type { RootState } from "@/store";
import { plansAdapter } from "@/store/slices/plansSlice";

const catalog = plansAdapter.getSelectors((state: RootState) => state.plans.catalog);

const selectEntities = (state: RootState) => state.plans.catalog.entities;

export const selectPlanById = (state: RootState, planId: string) =>
  catalog.selectById(state, planId);

export const selectExploreFilters = (state: RootState) => state.plans.filters;

export const selectJoinedMap = (state: RootState) => state.plans.joined;

export const selectHomePlansStatus = (state: RootState) => state.plans.home.status;

export const selectHomePlansError = (state: RootState) => state.plans.home.error;

export const selectExplorePlansStatus = (state: RootState) => state.plans.explore.status;

export const selectExplorePlansError = (state: RootState) => state.plans.explore.error;

export const selectExploreLoadingMore = (state: RootState) => state.plans.explore.loadingMore;

export const selectHasMorePlans = (state: RootState) => state.plans.explore.hasMore;

export const selectExploreOffset = (state: RootState) => state.plans.explore.offset;

export const selectSelectedPlanId = (state: RootState) => state.plans.selectedId;

export const selectHomePlans = createSelector(
  [(state: RootState) => state.plans.home.ids, selectEntities],
  (ids, entities) =>
    ids
      .map((id) => entities[id])
      .filter((plan): plan is PlanWithMeta => plan != null),
);

export const selectExplorePlans = createSelector(
  [(state: RootState) => state.plans.explore.ids, selectEntities],
  (ids, entities) =>
    ids
      .map((id) => entities[id])
      .filter((plan): plan is PlanWithMeta => plan != null),
);

export const selectHomeUpcoming = createSelector(
  [selectHomePlans, selectJoinedMap],
  (plans, joined) =>
    plans.filter((plan) => plan.viewerJoined || joined[plan.id]).slice(0, 4),
);
