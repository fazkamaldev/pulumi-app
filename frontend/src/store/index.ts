import { configureStore } from "@reduxjs/toolkit";
import brandsReducer from "../features/brands/brandsSlice";
import carsReducer from "../features/cars/carsSlice";
import settingsReducer from "../features/settings/settingsSlice";

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    brands: brandsReducer,
    cars: carsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
