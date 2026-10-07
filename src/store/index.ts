import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/store/slices/authSlice";
import { chatReducer } from "@/store/slices/chatSlice";
import { communitiesReducer } from "@/store/slices/communitiesSlice";
import { locationReducer } from "@/store/slices/locationSlice";
import { notificationReducer } from "@/store/slices/notificationSlice";
import { peopleReducer } from "@/store/slices/peopleSlice";
import { plansReducer } from "@/store/slices/plansSlice";
import { uiReducer } from "@/store/slices/uiSlice";
import { userReducer } from "@/store/slices/userSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      user: userReducer,
      plans: plansReducer,
      people: peopleReducer,
      communities: communitiesReducer,
      chat: chatReducer,
      notifications: notificationReducer,
      location: locationReducer,
      ui: uiReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
