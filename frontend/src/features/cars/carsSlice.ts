import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { CAR_API_URL } from "../../config/api";

export type Car = { id: number; name: string; brand_id: number };

type CarsState = {
  cars: Car[];
  loading: boolean;
  error: string | null;
};

const initialState: CarsState = {
  cars: [],
  loading: false,
  error: null,
};

export const fetchCars = createAsyncThunk("cars/fetch", async () => {
  const response = await fetch(`${CAR_API_URL}/cars`);
  if (!response.ok) {
    throw new Error("Failed to load cars");
  }
  return (await response.json()) as Car[];
});

export const createCar = createAsyncThunk(
  "cars/create",
  async (payload: { name: string; brand_id: number }) => {
    const response = await fetch(`${CAR_API_URL}/cars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error("Failed to create car");
    }
    return (await response.json()) as Car;
  },
);

const carsSlice = createSlice({
  name: "cars",
  initialState,
  reducers: {
    clearCarError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCars.fulfilled, (state, action) => {
        state.loading = false;
        state.cars = action.payload;
      })
      .addCase(fetchCars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load cars";
      })
      .addCase(createCar.pending, (state) => {
        state.error = null;
      })
      .addCase(createCar.fulfilled, (state, action) => {
        state.cars.push(action.payload);
        state.cars.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(createCar.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to add car";
      });
  },
});

export const { clearCarError } = carsSlice.actions;
export default carsSlice.reducer;
