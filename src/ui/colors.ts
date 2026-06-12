/**
 * colors.ts — Paleta completa del juego.
 * Números Phaser 0xRRGGBB. Ver docs/ART_DIRECTION.md.
 */

export const COLORS = {
  // ── Original core ──────────────────────────────────────────
  bgTop: 0x1a2118,
  bgField: 0x2c3526,
  bgFieldAlt: 0x252e20,
  ink: 0xe8e6d8,
  inkDim: 0x9aa08c,
  ally: 0x5d7c4a,
  allyBase: 0x6b8f54,
  enemy: 0x8c1d1d,
  enemyBase: 0x6b1f1f,
  serum: 0x5ee03a,
  hpGood: 0x7bbf4a,
  hpBad: 0xc0432d,
  panel: 0x161c14,
  panelEdge: 0x3a452f,
  cardFace: 0x222a1c,
  warn: 0xd9a441,

  // ── Sky & atmosphere ───────────────────────────────────────
  skyTop: 0x080c1a,
  skyMid: 0x1a1028,
  skyHorizon: 0x5a2210,
  skyFire: 0x8a3a10,
  cloudDark: 0x1a1018,
  cloudLight: 0x2a1a22,

  // ── Terrain ────────────────────────────────────────────────
  groundTop: 0x2e2618,
  groundMid: 0x252010,
  groundBot: 0x1c1a0e,
  mud: 0x3a2e1e,
  trench: 0x1a1610,

  // ── Ally unit details ──────────────────────────────────────
  allyHelmet: 0x4a5a3a,
  allyHelmetLight: 0x5a6a4a,
  allySkin: 0xc4946a,
  allyUniform: 0x3a4a2e,
  allyUniformLight: 0x4a5a3e,
  allyBoots: 0x2a2018,
  allyWeapon: 0x3a3a38,
  allyWebbing: 0x5a5a40,

  // ── Enemy unit details ─────────────────────────────────────
  enemySkin: 0x5a7a5a,
  enemySkinDark: 0x3a4a3a,
  enemyRot: 0x4a3a2a,
  enemyEyes: 0x33ff11,
  enemyUniform: 0x3a3a34,
  enemyUniformDark: 0x2a2a28,
  enemyBlood: 0x6a2222,
  enemyBone: 0xaaa888,

  // ── Particles & FX ─────────────────────────────────────────
  fire: 0xff6622,
  fireGlow: 0xffaa44,
  fireDim: 0xaa4411,
  smoke: 0x555555,
  smokeDark: 0x2a2a2a,
  blood: 0x8a1111,
  bloodDark: 0x550808,
  ash: 0x888877,
  ember: 0xff5500,
  muzzleFlash: 0xffee88,
  muzzleCore: 0xffffff,
  impact: 0xddccaa,
  serumGlow: 0x33ff11,
  electricBlue: 0x4488ff,

  // ── UI premium ─────────────────────────────────────────────
  gold: 0xd4a843,
  goldDark: 0x8a6a20,
  goldLight: 0xf0d070,
  metalFrame: 0x4a4a42,
  metalLight: 0x6a6a5a,
  metalDark: 0x2a2a24,
  panelTop: 0x1e2418,
  panelBot: 0x0e1208,
  cardBorder: 0x556b44,
  cardReady: 0x33aa22,
  cardLocked: 0x555544,
  supplyIcon: 0xc8a84a,

  // ── Health bars ────────────────────────────────────────────
  hpBg: 0x111108,
  hpBorder: 0x444438,
  hpTrail: 0xccccaa,
  hpAlly: 0x4499ff,
  hpEnemy: 0xcc3322,

  // ── Text ───────────────────────────────────────────────────
  textWhite: 0xffffff,
  textDamage: 0xff4444,
  textHeal: 0x44ff88,
  textBounty: 0xffd700,
  textCrit: 0xff8800,
} as const;

/** Tipo para las claves de COLORS. */
export type ColorKey = keyof typeof COLORS;

/** '#rrggbb' string desde 0xRRGGBB para estilos de texto Phaser. */
export function hex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

/** Extrae componentes r, g, b (0-255) de un color 0xRRGGBB. */
export function rgb(n: number): { r: number; g: number; b: number } {
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
  };
}

/** Crea string 'rgba(r,g,b,a)' para uso en canvas 2D context. */
export function rgba(n: number, a: number = 1): string {
  const { r, g, b } = rgb(n);
  return `rgba(${r},${g},${b},${a})`;
}

/** Interpola linealmente entre dos colores. t=0 devuelve a, t=1 devuelve b. */
export function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return (rr << 16) | (rg << 8) | rb;
}

/** Font families consistentes para todo el juego. */
export const FONTS = {
  title: '"Black Ops One", cursive',
  ui: '"Roboto Condensed", sans-serif',
  body: '"Roboto Condensed", sans-serif',
} as const;
