/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRANSACTIONS_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  // eslint-disable-next-line no-var
  var __VITE_TRANSACTIONS_API__?: string
}

export {}
