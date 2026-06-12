import type { RunEffect } from './RunTypes';

/**
 * Un outcome por opción si es determinista; varios con 'chance' si es azaroso.
 * Las chances de una misma opción deben sumar ~1. 'hidden' marca consecuencias
 * que NO se anticipan en la UI (se revelan al resolverse).
 */
export interface EventOutcome {
  chance?: number;
  text: string;
  effects: RunEffect[];
  hidden?: boolean;
}

export interface EventOption {
  id: string;
  label: string;
  hint?: string;          // pista de riesgo/recompensa mostrada al jugador
  requiresUnitId?: string; // opción visible solo si la unidad está desbloqueada en la run
  outcomes: EventOutcome[];
}

export interface EventDef {
  id: string;
  title: string;
  text: string;
  weight?: number; // peso relativo de aparición (default 1)
  options: EventOption[];
}
