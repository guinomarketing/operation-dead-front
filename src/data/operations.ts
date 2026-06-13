import type { OperationDef } from '../types/RunTypes';

/** 3 operaciones iniciales. Cada una es una run completa con su boss. */
export const OPERATIONS: OperationDef[] = [
  {
    id: 'op-first-light',
    name: 'Operación Viento Blanco',
    codename: 'VIENTO BLANCO',
    biome: 'trenches',
    description:
      'Las trincheras congeladas de la estepa profunda. Resistí el avance de la Legión y devolvé al Coronel Von Grüber a la tumba.',
    rows: [8, 9],
    enemyPool: ['revenant-grunt', 'runner-corpse', 'shielded-revenant', 'exploder', 'rot-hound'],
    elitePool: ['dead-officer', 'occultist'],
    bossId: 'general-eisenfaust',
    mutationPool: ['hasty-dead', 'thin-supplies', 'grave-discipline'],
    unlockedByDefault: true,
  },
  {
    id: 'op-hollow-town',
    name: 'Operación Pueblo Fantasma',
    codename: 'PUEBLO FANTASMA',
    biome: 'ruined-town',
    description:
      'Un pueblo patagónico desalojado por el culto para sus rituales. El Doctor Von Totenkopf y sus creaciones acechan en la niebla.',
    rows: [8, 10],
    enemyPool: ['revenant-grunt', 'runner-corpse', 'exploder', 'rot-hound', 'shielded-revenant'],
    elitePool: ['occultist', 'dead-officer'],
    bossId: 'doctor-totenkopf',
    mutationPool: ['endless-fog', 'blast-doctrine', 'grave-discipline', 'hasty-dead'],
    unlockedByDefault: false,
    unlockCostMedals: 40,
  },
  {
    id: 'op-iron-grave',
    name: 'Operación Fundición Negra',
    codename: 'FUNDICIÓN NEGRA',
    biome: 'iron-works',
    description:
      'La vieja metalúrgica donde la secta ensambla sus monstruosidades mecánicas. Detené a la Locomotora Profanadora.',
    rows: [9, 10],
    enemyPool: ['revenant-grunt', 'shielded-revenant', 'exploder', 'runner-corpse', 'rot-hound'],
    elitePool: ['dead-officer', 'occultist'],
    bossId: 'panzer-corpse-engine',
    mutationPool: ['blast-doctrine', 'thin-supplies', 'honor-guard', 'hasty-dead'],
    unlockedByDefault: false,
    unlockCostMedals: 90,
  },
];

export const OPERATION_INDEX: Record<string, OperationDef> = Object.fromEntries(
  OPERATIONS.map((o) => [o.id, o]),
);
