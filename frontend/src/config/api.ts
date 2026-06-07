export const SETTINGS_API_URL =
  import.meta.env.INIT_SETTINGS_API_URL ??
  (import.meta.env.PROD ? "" : "http://localhost:8000");

export const BRAND_API_URL =
  import.meta.env.INIT_BRAND_API_URL ??
  (import.meta.env.PROD ? "" : "http://localhost:8001");

export const CAR_API_URL =
  import.meta.env.INIT_CAR_API_URL ??
  (import.meta.env.PROD ? "" : "http://localhost:8002");
