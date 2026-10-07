import { createSelector } from "@reduxjs/toolkit";
import type { ApproxLocation } from "@/lib/location/geo";
import type { RootState } from "@/store";

export const selectPeople = (state: RootState) => state.people.items;

export const selectPeopleStatus = (state: RootState) => state.people.status;

export const selectPeopleError = (state: RootState) => state.people.error;

export const selectPendingConnections = (state: RootState) => state.people.pending;

export const selectAcceptedConnections = (state: RootState) => state.people.accepted;

export const selectConnectionNames = (state: RootState) => state.people.names;

export const selectConnectionsStatus = (state: RootState) => state.people.connectionsStatus;

export const selectPeoplePreview = createSelector(selectPeople, (items) => items.slice(0, 4));

export const selectCommunities = (state: RootState) => state.communities.items;

export const selectNotifications = (state: RootState) => state.notifications.items;

export const selectNotificationStatus = (state: RootState) => state.notifications.status;

export const selectNotificationError = (state: RootState) => state.notifications.error;

export const selectSeenNotificationIds = (state: RootState) => state.notifications.seenIds;

export const selectUnreadNotificationCount = createSelector(
  [selectNotifications, selectSeenNotificationIds],
  (items, seenIds) => {
    const seen = new Set(seenIds);
    return items.filter((item) => !seen.has(item.id)).length;
  },
);

export const selectApproxLocation = createSelector(
  [(state: RootState) => state.location],
  (location): ApproxLocation | null => {
    if (!location.updatedAt || location.source === "none") return null;
    return {
      lat: location.latitude,
      lng: location.longitude,
      city: location.city,
      area: location.area,
      source: location.source,
      updatedAt: location.updatedAt,
    };
  },
);

export const selectLocationStatus = (state: RootState) => state.location.status;

export const selectLocationError = (state: RootState) => state.location.error;
