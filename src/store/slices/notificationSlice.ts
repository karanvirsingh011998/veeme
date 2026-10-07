import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { listConnectionsForAsync } from "@/lib/connections/service";
import type { Connection } from "@/lib/connections/types";
import type { PublicProfileDto } from "@/lib/people/types";
import { clientSessionCleared } from "@/store/sessionActions";
import { singleFlight } from "@/store/singleFlight";
import { isFresh, SHARED_CACHE_MS, type RequestStatus } from "@/store/status";

export type AppNotification = {
  id: string;
  kind: "request" | "accepted" | "declined";
  actorId: string;
  actorName: string;
  message: string;
  href: string;
  at: string;
};

type NotificationState = {
  items: AppNotification[];
  seenIds: string[];
  status: RequestStatus;
  error: string | null;
  fetchedAt: number;
  userId: string;
};

const initialState: NotificationState = {
  items: [],
  seenIds: [],
  status: "idle",
  error: null,
  fetchedAt: 0,
  userId: "",
};

function seenKey(userId: string) {
  return `vemee_notif_seen_v1:${userId}`;
}

function readSeen(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(seenKey(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeSeen(userId: string, ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(seenKey(userId), JSON.stringify(ids));
}

function toNotifications(
  userId: string,
  connections: Connection[],
  names: Record<string, string>,
): AppNotification[] {
  const items: AppNotification[] = [];
  for (const connection of connections) {
    const nameFor = (id: string) => names[id] || "Someone";
    if (connection.recipientId === userId && connection.status === "pending") {
      const actorId = connection.requesterId;
      items.push({
        id: `${connection.id}:request`,
        kind: "request",
        actorId,
        actorName: nameFor(actorId),
        message: `${nameFor(actorId)} sent you a chat request`,
        href: "/dashboard/people",
        at: connection.updatedAt || connection.createdAt,
      });
      continue;
    }
    if (connection.requesterId === userId && connection.status === "accepted") {
      const actorId = connection.recipientId;
      items.push({
        id: `${connection.id}:accepted`,
        kind: "accepted",
        actorId,
        actorName: nameFor(actorId),
        message: `${nameFor(actorId)} accepted your request`,
        href: `/dashboard/people/${actorId}`,
        at: connection.updatedAt || connection.createdAt,
      });
      continue;
    }
    if (connection.requesterId === userId && connection.status === "declined") {
      const actorId = connection.recipientId;
      items.push({
        id: `${connection.id}:declined`,
        kind: "declined",
        actorId,
        actorName: nameFor(actorId),
        message: `${nameFor(actorId)} declined your request`,
        href: `/dashboard/people/${actorId}`,
        at: connection.updatedAt || connection.createdAt,
      });
    }
  }
  return items.sort((a, b) => (a.at < b.at ? 1 : -1));
}

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (arg: { userId: string; force?: boolean }) => {
    return singleFlight(`notifications:${arg.userId}`, async () => {
      const connections = await listConnectionsForAsync(arg.userId);
      const actorIds = [
        ...new Set(
          connections.flatMap((connection) =>
            connection.requesterId === arg.userId
              ? [connection.recipientId]
              : [connection.requesterId],
          ),
        ),
      ];
      const names: Record<string, string> = {};
      if (actorIds.length > 0) {
        const res = await fetch(
          `/api/people?ids=${encodeURIComponent(actorIds.join(","))}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const data = (await res.json()) as { people?: PublicProfileDto[] };
          for (const person of data.people || []) names[person.id] = person.name;
        }
      }
      return {
        userId: arg.userId,
        items: toNotifications(arg.userId, connections, names),
        seenIds: readSeen(arg.userId),
      };
    });
  },
  {
    condition: (arg, { getState }) => {
      if (!arg.userId) return false;
      const notifications = (getState() as { notifications: NotificationState }).notifications;
      if (notifications.status === "loading") return false;
      if (
        !arg.force &&
        notifications.status === "succeeded" &&
        notifications.userId === arg.userId &&
        isFresh(notifications.fetchedAt, SHARED_CACHE_MS)
      ) {
        return false;
      }
      return true;
    },
  },
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    notificationsSeen(state, action: PayloadAction<string[]>) {
      if (!state.userId || action.payload.length === 0) return;
      const next = new Set(state.seenIds);
      for (const id of action.payload) next.add(id);
      state.seenIds = [...next];
      writeSeen(state.userId, state.seenIds);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state, action) => {
        if (state.userId !== action.meta.arg.userId) {
          state.items = [];
          state.seenIds = [];
        }
        if (state.status !== "succeeded" || state.userId !== action.meta.arg.userId) {
          state.status = "loading";
        }
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const sameUser = state.userId === action.payload.userId;
        state.items = action.payload.items;
        state.seenIds = sameUser
          ? [...new Set([...state.seenIds, ...action.payload.seenIds])]
          : action.payload.seenIds;
        state.userId = action.payload.userId;
        state.status = "succeeded";
        state.error = null;
        state.fetchedAt = Date.now();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        if (action.meta.condition) return;
        state.status = "failed";
        state.error = "Couldn't load notifications.";
      })
      .addCase(clientSessionCleared, () => initialState);
  },
});

export const { notificationsSeen } = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;
