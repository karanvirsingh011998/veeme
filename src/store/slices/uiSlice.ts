import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  sidebarOpen: boolean;
  activeModal: string | null;
  theme: "light";
};

const initialState: UiState = {
  sidebarOpen: false,
  activeModal: null,
  theme: "light",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setActiveModal(state, action: PayloadAction<string | null>) {
      state.activeModal = action.payload;
    },
  },
});

export const { setSidebarOpen, setActiveModal } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
