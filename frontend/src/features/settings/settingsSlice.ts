import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { SETTINGS_API_URL } from "../../config/api";

export type Setting = { id: number; name: string };

type SettingsState = {
  settings: Setting[];
  loading: boolean;
  error: string | null;
};

const initialState: SettingsState = {
  settings: [],
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk("settings/fetch", async () => {
  const response = await fetch(`${SETTINGS_API_URL}/settings`);
  if (!response.ok) {
    throw new Error("Failed to load settings");
  }
  return (await response.json()) as Setting[];
});

export const createSetting = createAsyncThunk(
  "settings/create",
  async (name: string) => {
    const response = await fetch(`${SETTINGS_API_URL}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      throw new Error("Failed to create setting");
    }
    return (await response.json()) as Setting;
  },
);

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    clearSettingsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load settings";
      })
      .addCase(createSetting.pending, (state) => {
        state.error = null;
      })
      .addCase(createSetting.fulfilled, (state, action) => {
        state.settings.push(action.payload);
        state.settings.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(createSetting.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to add setting";
      });
  },
});

export const { clearSettingsError } = settingsSlice.actions;
export default settingsSlice.reducer;
