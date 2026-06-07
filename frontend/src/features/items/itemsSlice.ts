import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_URL } from "../../config/api";

export type Item = { id: number; name: string };

type ItemsState = {
  items: Item[];
  loading: boolean;
  error: string | null;
};

const initialState: ItemsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchItems = createAsyncThunk("items/fetch", async () => {
  const response = await fetch(`${API_URL}/items`);
  if (!response.ok) {
    throw new Error("Failed to load items");
  }
  return (await response.json()) as Item[];
});

export const createItem = createAsyncThunk(
  "items/create",
  async (name: string) => {
    const response = await fetch(`${API_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      throw new Error("Failed to create item");
    }
    return (await response.json()) as Item;
  },
);

const itemsSlice = createSlice({
  name: "items",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load items";
      })
      .addCase(createItem.pending, (state) => {
        state.error = null;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(createItem.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to add item";
      });
  },
});

export const { clearError } = itemsSlice.actions;
export default itemsSlice.reducer;
