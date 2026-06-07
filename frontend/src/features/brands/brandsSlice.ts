import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { BRAND_API_URL } from "../../config/api";

export type Brand = { id: number; name: string };

type BrandsState = {
  brands: Brand[];
  loading: boolean;
  error: string | null;
};

const initialState: BrandsState = {
  brands: [],
  loading: false,
  error: null,
};

export const fetchBrands = createAsyncThunk("brands/fetch", async () => {
  const response = await fetch(`${BRAND_API_URL}/brands`);
  if (!response.ok) {
    throw new Error("Failed to load brands");
  }
  return (await response.json()) as Brand[];
});

export const createBrand = createAsyncThunk(
  "brands/create",
  async (name: string) => {
    const response = await fetch(`${BRAND_API_URL}/brands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      throw new Error("Failed to create brand");
    }
    return (await response.json()) as Brand;
  },
);

const brandsSlice = createSlice({
  name: "brands",
  initialState,
  reducers: {
    clearBrandError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.brands = action.payload;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load brands";
      })
      .addCase(createBrand.pending, (state) => {
        state.error = null;
      })
      .addCase(createBrand.fulfilled, (state, action) => {
        state.brands.push(action.payload);
        state.brands.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(createBrand.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to add brand";
      });
  },
});

export const { clearBrandError } = brandsSlice.actions;
export default brandsSlice.reducer;
