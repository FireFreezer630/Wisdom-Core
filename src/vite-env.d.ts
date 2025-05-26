/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly MODE: string
  readonly PROD: boolean
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly glob: <T>(pattern: string, options?: { eager: true; as: string }) => Record<string, string>
  readonly glob: <T>(pattern: string, options?: { eager?: boolean; as?: string }) => Record<string, () => Promise<T>>
}
