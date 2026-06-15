/**
 * Small deterministic PRNG for reproducible runs and combat encounters.
 * The same seed always produces the same sequence across supported browsers.
 */
export function createSeededRandom(seed: string): () => number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function randomItem<T>(random: () => number, items: readonly T[]): T {
  if (items.length === 0) throw new Error('Cannot pick from an empty collection');
  return items[Math.floor(random() * items.length)];
}
