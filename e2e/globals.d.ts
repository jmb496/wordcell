export {};

declare global {
  interface Window {
    __wordcell?: Readonly<Record<string, never>>;
    __wordcellBoot?: Record<
      'wordcell:session' | 'wordcell:history' | 'wordcell:prefs',
      string | null
    >;
  }
}
