import type { HookId, Modifier } from './common';

export interface CommanderDef {
  id: string;
  name: string;
  callsign: string;
  description: string;
  unlockedByDefault: boolean;
  unlockCostMedals?: number;
  /** Texto legible de cada pasiva (UI). */
  passiveText: string[];
  /** Pasivas expresadas como modificadores estándar. */
  passives: Modifier[];
  /** Pasivas especiales por hook (ver registro en common.ts). */
  passiveHooks?: HookId[];
  /** Unidades desbloqueadas al iniciar la run. */
  startingUnits: string[];
  /** Habilidades equipadas al iniciar (2 slots base). */
  startingAbilities: string[];
  startingRelicId?: string;
}
