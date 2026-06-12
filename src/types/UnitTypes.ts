import type { PlaceholderArt } from './common';

export type UnitRole =
  | 'assault'      // daño constante de línea
  | 'suppression'  // anti-horda, daño sostenido
  | 'support'      // curación / buffs
  | 'engineering'  // estructuras y control de campo
  | 'precision'    // anti-élite, single target
  | 'incendiary';  // limpieza en área corta

export interface UnitStats {
  maxHp: number;
  damage: number;
  attackInterval: number; // ms
  range: number;          // px
  moveSpeed: number;      // px/s
  armor: number;
  maxTargets?: number;    // para AoE (default 1)
  healPower?: number;     // hp/s (solo support)
  healRadius?: number;
}

export interface UnitTrait {
  id: string;
  name: string;
  description: string;
  value?: number;
}

export interface UnitDef {
  id: string;
  name: string;
  role: UnitRole;
  description: string;
  cost: number;           // supplies
  deployCooldown: number; // ms
  stats: UnitStats;
  traits: UnitTrait[];
  tags: string[];         // 'infantry' | 'organic' | 'specialist' | ...
  placeholder: PlaceholderArt;
}
