import type { OperationDef } from '../types/RunTypes';

/** 3 operaciones iniciales. Cada una es una run completa con su boss. */
export const OPERATIONS: OperationDef[] = [
  {
    id: 'op-first-light',
    name: 'Operation First Light',
    codename: 'FIRST LIGHT',
    biome: 'trenches',
    description:
      'The trench lines where the Last March began. Hold the old front and put General Eisenfaust back in the ground.',
    rows: [8, 9],
    enemyPool: ['revenant-grunt', 'runner-corpse', 'shielded-revenant', 'exploder', 'rot-hound'],
    elitePool: ['dead-officer', 'occultist'],
    bossId: 'general-eisenfaust',
    mutationPool: ['hasty-dead', 'thin-supplies', 'grave-discipline'],
    unlockedByDefault: true,
  },
  {
    id: 'op-hollow-town',
    name: 'Operation Hollow Town',
    codename: 'HOLLOW TOWN',
    biome: 'ruined-town',
    description:
      'A town the Reich emptied for its experiments. Doctor Totenkopf is still inside. So are his patients.',
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
    name: 'Operation Iron Grave',
    codename: 'IRON GRAVE',
    biome: 'iron-works',
    description:
      'The foundry where the Reich welds its dead into machines. Stop the Rolling Grave before it rolls out.',
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
