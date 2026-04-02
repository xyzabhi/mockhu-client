declare namespace NodeJS {
  interface ProcessEnv {
    /** Mockhu API origin without trailing slash, e.g. https://api.example.com */
    EXPO_PUBLIC_MOCKHU_API_BASE_URL?: string;
    /** __DEV__ only: ms to sleep before each API fetch (0 / off / false to disable). */
    EXPO_PUBLIC_MOCKHU_API_DEV_DELAY_MS?: string;
  }
}
