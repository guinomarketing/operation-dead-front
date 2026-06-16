import type { HookId, Modifier, Rarity } from './common';
import type { BuildingId } from './UpgradeTypes';

export type NodeType = 'battle' | 'elite' | 'event' | 'supply' | 'hq' | 'boss';

/** assault = destruir el bastión enemigo · defense = sobrevivir N oleadas */
export type BattleMode = 'assault' | 'defense';

export interface RunNodeDef {
  id: string;
  row: number;
  col: number;
  type: NodeType;
  battleMode?: BattleMode;
  edges: string[]; // ids de nodos de la fila siguiente alcanzables
}

export interface RunMapDef {
  seed: string;
  nodes: RunNodeDef[];
  startNodeId: string;
  bossNodeId: string;
}

/**
 * Vocabulario cerrado de efectos de run. Eventos, recompensas y reliquias
 * solo pueden producir efectos de esta lista => RunSystem los resuelve todos.
 * Notas de diseño:
 * - 'supplies' modifica los supplies INICIALES de la próxima batalla.
 * - 'base-hp' modifica la vida persistente de la base (la "vida" de la run).
 * - 'morale' modifica la moral persistente (se arrastra entre batallas).
 */
export type RunEffect =
  | { kind: 'supplies'; amount: number }
  | { kind: 'intel'; amount: number }
  | { kind: 'medals'; amount: number }
  | { kind: 'morale'; amount: number }
  | { kind: 'base-hp'; amount: number }
  | { kind: 'unlock-unit'; unitId: string }
  | { kind: 'disable-unit-next-battle'; unitId?: string; random?: boolean }
  | { kind: 'gain-relic'; relicId?: string } // sin id = aleatoria
  | { kind: 'gain-upgrade'; upgradeId?: string; buildingId?: BuildingId }
  | { kind: 'add-mutation'; mutationId?: string }
  | { kind: 'remove-mutation'; mutationId?: string }
  | { kind: 'run-modifier'; modifier: Modifier; duration: 'run' | 'next-battle' }
  | { kind: 'spawn-threat'; enemyId: string; count: number } // extra en la próxima batalla
  | { kind: 'reduce-waves'; amount: number }                 // próxima batalla
  | { kind: 'reveal-map' }
  | { kind: 'reveal-next-event' }
  | { kind: 'ability-charge'; abilityId: string }            // 1 uso gratis próxima batalla
  | { kind: 'flag'; id: string };

export interface RewardOption {
  id: string;
  label: string;
  effects: RunEffect[];
}

export interface RelicDef {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  flavor?: string;
  iconFrame?: number;
  modifiers?: Modifier[];
  hooks?: HookId[];
}

export interface MutationDef {
  id: string;
  name: string;
  description: string;
  modifiers?: Modifier[];
  hooks?: HookId[];
}

export type BiomeId = 'trenches' | 'ruined-town' | 'iron-works';

export interface OperationDef {
  id: string;
  name: string;
  codename: string;
  biome: BiomeId;
  description: string;
  rows: [number, number]; // min/max de filas del mapa (sin contar boss)
  enemyPool: string[];
  elitePool: string[];
  bossId: string;
  mutationPool: string[];
  unlockedByDefault: boolean;
  unlockCostMedals?: number; // alternativa a desbloquear venciendo la anterior
}

export interface RosterSoldier {
  id: string;
  unitId: string;
  name: string;
  nickname: string;
  level: number;
  xp: number;
  colorTint: number;
  status: 'ready' | 'dead';
  kills?: number;
}

/** Estado serializable de la run en curso (lo persiste SaveSystem). */
export interface RunState {
  operationId: string;
  commanderId: string;
  seed: string;
  currentNodeId: string | null;
  visitedNodeIds: string[];
  baseHp: number;
  baseMaxHp: number;
  morale: number;
  suppliesBonusNextBattle: number;
  unlockedUnitIds: string[];
  equippedAbilityIds: string[];
  upgradeIds: string[];
  relicIds: string[];
  mutationIds: string[];
  flags: string[];
  intelEarned: number;
  medalsEarned: number;
  kills: number;
  roster: RosterSoldier[];
}
