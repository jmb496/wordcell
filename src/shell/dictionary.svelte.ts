// Hashed dictionary asset URL (AD-8); epic 3 adds the load states.
import url from '../../generated/dictionary/en.txt?url';

export const dictionaryUrl = url;

/** The loaded word list, passed to `apply` as `ctx.dictionary`; entry 9 loads and assigns it. */
export let words: ReadonlySet<string> | undefined;
