import type { HookId, Modifier } from './common';

export type BuildingId =
  | 'barracks'
  | 'armory'
  | 'med-tent'
  | 'engineering-bay'
  | 'intel-room'
  | 'war-room';

export interface BuildingDef {
  id: BuildingId;
  name: string;
  description: string;
}

export interface UpgradeUnlock {
  kind: 'structure' | 'feature' | 'ability-slot';
  id: string;
}

/**
 * Upgrades temporales de run. Se obtienen como elección en nodos HQ o
 * recompensas post-combate (no se compran con supplies en el MVP).
 */
export interface UpgradeDef {
  id: string;
  buildingId: BuildingId;
  tier: 1 | 2 | 3;
  name: string;
  description: string;
  modifiers?: Modifier[];
  hooks?: HookId[];
  unlocks?: UpgradeUnlock[];
  requiresUpgradeId?: string; // cadena de tiers
}
