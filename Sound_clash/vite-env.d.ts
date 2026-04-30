/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_START_THRESHOLD: string;
  readonly VITE_SUSTAIN_THRESHOLD: string;
  readonly VITE_DROPOUT_GRACE_PERIOD: string;
  readonly VITE_UI_UPDATE_INTERVAL: string;
  readonly VITE_SCORE_MULTIPLIER: string;
  readonly VITE_API_PORT: string;
  readonly VITE_BACKGROUND_URL: string;
  readonly VITE_LOGO_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
