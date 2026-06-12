import type { Modifier } from './common';

/** Efectos de habilidad como unión discriminada: cada kind lo resuelve BattleSystem. */
export type AbilityEffect =
  | { kind: 'zone-damage'; damage: number; radius: number; delayMs?: number; ticks?: number; intervalMs?: number }
  | { kind: 'zone-heal'; heal: number; radius: number }
  | { kind: 'squad-buff'; modifiers: Modifier[]; durationMs: number; moraleBonus?: number }
  | { kind: 'zone-debuff'; modifiers: Modifier[]; radius: number; durationMs: number; allyDamageReductionPct?: number }
  | { kind: 'random-supply'; options: Array<'supplies' | 'heal' | 'damage-buff'> }
  | { kind: 'flare'; radius: number; durationMs: number; bonusVsTags: string[]; bonusDamageMult: number; stunRevivedMs?: number };

export interface AbilityDef {
  id: string;
  name: string;
  description: string;
  useCase: string;     // cuándo conviene usarla
  cost: number;        // supplies
  cooldown: number;    // ms
  targeted: boolean;   // true = el jugador toca un punto del campo
  effect: AbilityEffect;
}
