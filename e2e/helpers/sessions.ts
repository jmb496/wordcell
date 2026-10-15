// Epic 6 ticket 6.11: sessions the keyboard specs seed that are not `fixtures/` files (AD-17 pins
// the valid `fixtures/session-*.json` set to the rebuilt ones in src/engine/serialize.test.ts).
// Each is a valid Session built with the engine's own commands over the stated seed; seed one with
// `openFixture(page, { literal: SESSIONS.flow6 })`.
export const SESSIONS = {
  // Seed 1 after three whole-column words (columns 1-3 emptied, cell 7 holds 14 cards, cell 8 holds
  // 7), Idle: a Flow 1 stand-in. Column 6's bottom four cards dropped on column 5 (k = 1, left,
  // B-less: the block is `Z`) and cell 8's top card as the free letter spell ZENANA (six letters:
  // the default target is cell 6).
  flow6:
    '{"version":1,"seed":1,"moves":[{"sourceColumn":1,"sourceCount":7,"destinationColumn":1,"destinationCount":0,"destinationSide":"left","freeLetters":[],"arrangement":[24,6,49,30,25,20,48],"reached":"committed","targetCell":7,"placementOrder":[24,6,49,30,25,20,48]},{"sourceColumn":2,"sourceCount":7,"destinationColumn":2,"destinationCount":0,"destinationSide":"left","freeLetters":[],"arrangement":[44,29,33,7,47,19,26],"reached":"committed","targetCell":7,"placementOrder":[44,29,33,7,47,19,26]},{"sourceColumn":3,"sourceCount":7,"destinationColumn":3,"destinationCount":0,"destinationSide":"left","freeLetters":[],"arrangement":[23,35,8,21,2,42,0],"reached":"committed","targetCell":8,"placementOrder":[23,35,8,21,2,42,0]}],"cursor":{"index":3,"phase":"idle"},"gaveUp":false,"activeMs":0}',
  // Seed 3608 after one move: column 2's seven cards with column 1's bottom three on the right
  // spell DUPLICATOR (10 letters) on cell 10, Idle.
  cell10:
    '{"version":1,"seed":3608,"moves":[{"sourceColumn":2,"sourceCount":7,"destinationColumn":1,"destinationCount":3,"destinationSide":"right","freeLetters":[],"arrangement":[7,45,34,24,20,4,2],"reached":"committed","targetCell":10,"placementOrder":[7,45,34,24,20,4,2,42,31,38]}],"cursor":{"index":1,"phase":"idle"},"gaveUp":false,"activeMs":0}',
} as const;
