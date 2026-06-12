import type { Modifier, PlaceholderArt } from './common';

export type EnemyTier =
  | 'fodder'    // masa básica
  | 'fast'      // presión rápida
  | 'armored'   // tanque de línea
  | 'special'   // mecánica propia (exploder, etc.)
  | 'elite'     // alto valor, alta amenaza
  | 'miniboss'
  | 'boss';

export type EnemyBehavior =
  | 'advance'       // camina y pelea con lo que encuentre
  | 'rush'          // prioriza avanzar rápido
  | 'kamikaze'      // corre y detona
  | 'buff-aura'     // potencia aliados cercanos
  | 'caster'        // usa habilidades a distancia
  | 'hunt-backline' // intenta esquivar el frente y atacar soporte
  | 'siege';        // prioriza estructuras y base

export interface EnemyAbility {
  id: 'fog' | 'revive' | 'mutate' | 'summon' | 'detonate' | 'heal-zone' | 'cannon';
  cooldown: number; // ms
  description: string;
  params?: Record<string, number | string>;
}

export interface EnemyStats {
  maxHp: number;
  damage: number;
  attackInterval: number; // ms
  range: number;          // px (melee ~16-26)
  moveSpeed: number;      // px/s
  armor: number;
  aoeRadius?: number;
}

export interface EnemyAura {
  radius: number;
  description: string;
  modifiers: Modifier[];
}

export interface EnemyDef {
  id: string;
  name: string;
  tier: EnemyTier;
  behaviors: EnemyBehavior[];
  description: string;
  stats: EnemyStats;
  aura?: EnemyAura;
  abilities?: EnemyAbility[];
  bounty: number;          // supplies al matarlo
  intelGain?: number;      // intel (élites y superiores)
  moraleOnDeath: number;   // +moral aliada al matarlo
  moraleOnBreach: number;  // -moral aliada si llega a la base (valor positivo)
  tags: string[];          // 'undead' | 'occult' | 'mechanical' | ...
  placeholder: PlaceholderArt;
}

export interface BossPhase {
  untilHpPct: number; // fase activa mientras hp% > untilHpPct (la última usa 0)
  description: string;
  behaviors?: EnemyBehavior[];
  abilities?: EnemyAbility[];
  statOverrides?: Partial<EnemyStats>;
}

export interface BossDef extends EnemyDef {
  title: string;       // epíteto pulp
  phases: BossPhase[];
}
