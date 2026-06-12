/**
 * constants.ts — Números base del juego. Fuente única de verdad para el MVP.
 * Cambiar acá primero; los sistemas leen de acá, nunca hardcodean.
 */

// Viewport lógico (portrait). Phaser Scale.FIT + autoCenter.
export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;

// Campo de batalla lateral dentro de la pantalla vertical.
export const FIELD = {
  ALLY_BASE_X: 50,     // centro de la base aliada
  ENEMY_BASE_X: 490,   // centro del bastión enemigo
  SPAWN_ALLY_X: 85,
  SPAWN_ENEMY_X: 455,
  LANES_Y: [470, 545, 620] as const, // 3 sub-carriles para profundidad visual
  UNIT_SEPARATION: 26, // px mínimos entre unidades del mismo carril
} as const;

export const ECONOMY = {
  STARTING_SUPPLIES: 40,
  INCOME_PER_SECOND: 8,
} as const;

export const BASES = {
  ALLY_HP: 100,          // persiste durante toda la run (vida de la run)
  ENEMY_BASTION_HP: 250, // por batalla en modo assault
} as const;

export const MORALE = {
  START: 70,
  MAX: 100,
  PER_KILL: 1,
  PER_ELITE_KILL: 5,
  PER_WAVE_CLEARED: 5,
  PER_VICTORY: 8,          // recuperación al ganar un nodo
  BASE_HIT_PER_10_DMG: 3,  // -moral por cada 10 de daño a la base
  UNIT_DEATH_BASE: 2,      // -moral por baja = 2 + floor(cost / 25)
} as const;

export const LIMITS = {
  MAX_ALLY_UNITS: 10,
  MAX_ENEMY_UNITS: 25,
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
