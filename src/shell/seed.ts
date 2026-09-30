// AD-5, R-74: the shell generates seeds; the engine never does.
export function newSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
