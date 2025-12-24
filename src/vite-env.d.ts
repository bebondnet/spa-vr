/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE: 'mock' | 'local' | 'staging' | 'production';
  readonly VITE_API_BASE: string;
  readonly VITE_API_KEY: string;
  readonly VITE_ORG_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
