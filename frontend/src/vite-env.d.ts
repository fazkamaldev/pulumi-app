/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly INIT_SETTINGS_API_URL: string;
  readonly INIT_BRAND_API_URL: string;
  readonly INIT_CAR_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
