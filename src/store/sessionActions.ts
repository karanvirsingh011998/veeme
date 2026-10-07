import { createAction } from "@reduxjs/toolkit";

/** Clears shared client caches after sign-out. Does not touch location or UI preferences. */
export const clientSessionCleared = createAction("session/cleared");
