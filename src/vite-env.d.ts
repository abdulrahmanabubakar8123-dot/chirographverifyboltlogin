/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  /**
   * Public PostHog project API key. This is intentionally a public key
   * (phc_...) and must never be a personal API key (phx_...). Leave unset
   * to disable analytics entirely.
   */
  readonly VITE_POSTHOG_KEY?: string;
  /** PostHog ingestion host. Defaults to the EU cloud instance. */
  readonly VITE_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
