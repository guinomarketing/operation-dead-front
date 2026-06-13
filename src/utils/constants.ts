/**
 * constants.ts — Números base del juego. Fuente única de verdad.
 * Cambiar acá primero; los sistemas leen de acá, nunca hardcodean.
 *
 * ORIENTACIÓN: LANDSCAPE 16:9 (mobile horizontal).
 * Base lógica 960x540 → escala exacta ×2 a 1920x1080. Phaser Scale.FIT + autoCenter.
 */

// ── Viewport lógico (landscape 16:9) ───────────────────────
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/**
 * LAYOUT — Bandas verticales de la pantalla de combate.
 * Top HUD ≈ 12% · Battlefield ≈ 66% · Bottom UI ≈ 22%.
 * El battlefield es el protagonista; la UI acompaña.
 */
export const LAYOUT = {
  SAFE_MARGIN: 16,
  UI_TOP_HEIGHT: 66, // ~12% de 540
  UI_BOTTOM_HEIGHT: 120, // ~22% de 540
  get BATTLEFIELD_TOP() {
    return this.UI_TOP_HEIGHT;
  },
  get BATTLEFIELD_BOTTOM() {
    return GAME_HEIGHT - this.UI_BOTTOM_HEIGHT;
  },
  get BATTLEFIELD_HEIGHT() {
    return GAME_HEIGHT - this.UI_TOP_HEIGHT - this.UI_BOTTOM_HEIGHT;
  },
  BATTLEFIELD_WIDTH: GAME_WIDTH,
} as const;

/**
 * FIELD — Campo de batalla lateral.
 * Base argentina a la IZQUIERDA, búnker enemigo a la DERECHA.
 * Aliados avanzan → (x creciente). Enemigos avanzan ← (x decreciente).
 * 4 carriles horizontales repartidos dentro de la banda del battlefield.
 */
export const FIELD = {
  ALLY_BASE_X: 64, // centro de la base aliada (izquierda)
  ENEMY_BASE_X: 896, // centro del bastión enemigo (derecha)
  SPAWN_ALLY_X: 140, // las tropas aparecen pasando la trinchera
  SPAWN_ENEMY_X: 820, // los revenants salen del búnker
  // 4 carriles repartidos verticalmente en la zona [BATTLEFIELD_TOP+inset, BATTLEFIELD_BOTTOM-inset].
  // Centro vertical de cada carril (de arriba hacia abajo).
  LANES_Y: [168, 248, 328, 396] as const,
  UNIT_SEPARATION: 28, // px mínimos entre unidades del mismo carril
  /** Centro vertical del campo (para bases y splashes). */
  get CENTER_Y() {
    return (this.LANES_Y[0] + this.LANES_Y[this.LANES_Y.length - 1]) / 2;
  },
  /** Carril central (para spawn de jefe). */
  get CENTER_LANE() {
    return Math.floor((this.LANES_Y.length - 1) / 2);
  },
  /** Devuelve el índice de carril más cercano a una coordenada Y. */
  laneFromY(y: number): number {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < this.LANES_Y.length; i++) {
      const d = Math.abs(this.LANES_Y[i] - y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  },
} as const;

export const ECONOMY = {
  STARTING_SUPPLIES: 40,
  INCOME_PER_SECOND: 8,
} as const;

export const BASES = {
  ALLY_HP: 100, // persiste durante toda la run (vida de la run)
  ENEMY_BASTION_HP: 250, // por batalla en modo assault
} as const;

export const MORALE = {
  START: 70,
  MAX: 100,
  PER_KILL: 1,
  PER_ELITE_KILL: 5,
  PER_WAVE_CLEARED: 5,
  PER_VICTORY: 8, // recuperación al ganar un nodo
  BASE_HIT_PER_10_DMG: 3, // -moral por cada 10 de daño a la base
  UNIT_DEATH_BASE: 2, // -moral por baja = 2 + floor(cost / 25)
} as const;

export const LIMITS = {
  MAX_ALLY_UNITS: 12,
  MAX_ENEMY_UNITS: 28,
  ABILITY_SLOTS: 2,
} as const;

// MVP 0.1: spawn fijo de Revenant Grunt (sin WaveSystem todavía).
export const SPAWN_MVP01 = {
  GRUNT_INTERVAL_MS: 3500,
} as const;

// Oleadas (MVP 0.2+): presupuesto de amenaza por nodo.
export const WAVES = {
  BASE_BUDGET: 20,
  BUDGET_PER_ROW: 8,
  ELITE_NODE_MULT: 1.6,
  WAVES_PER_DEFENSE_NODE: 3,
} as const;
