/**
 * The one engine error class. `check` is a kebab-case code unique per check, so tests assert
 * exactly which check threw. Codes in use: `card-id-domain`, `lang-deck-size`,
 * `lang-unknown-letter`.
 */
export class EngineError extends Error {
  readonly check: string;

  constructor(check: string, message?: string) {
    super(message ?? check);
    this.name = 'EngineError';
    this.check = check;
  }
}
