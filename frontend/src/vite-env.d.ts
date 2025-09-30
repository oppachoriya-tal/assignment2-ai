/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_NODE_ENV: string
  readonly VITE_FRONTEND_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
