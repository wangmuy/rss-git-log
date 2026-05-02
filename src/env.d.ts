/// <reference types="vite/client" />
/// <reference types="vitest" />

interface ImportMetaEnv {
  // Add any remaining environment variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
