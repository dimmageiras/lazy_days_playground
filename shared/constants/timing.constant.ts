const TIMING = Object.freeze({
  FAST: 200,
  SEARCH: 300,
  VALIDATION: 500,
  EXPENSIVE: 1_000,

  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 250,
  ANIMATION_SLOW: 400,

  API_TIMEOUT: 10_000,
  SSR_TIMEOUT: 5_000,
  WEBSOCKET_TIMEOUT: 30_000,

  LOADING_DELAY: 300,
  NOTIFICATION_DISMISS: 5_000,
  TOOLTIP_DELAY: 500,

  // Cache and query timings (milliseconds)
  /** React Query garbage collection time (15 minutes) */
  QUERY_GC_TIME: 15 * 60 * 1_000,
  /** React Query stale time (10 minutes) */
  QUERY_STALE_TIME: 10 * 60 * 1_000,
  /** Server-side query garbage collection (2 seconds) */
  QUERY_SSR_GC_TIME: 2_000,
} as const);

export { TIMING };
