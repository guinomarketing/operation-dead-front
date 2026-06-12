import type { UnitDef } from '../types/UnitTypes';

/**
 * Unidades aliadas iniciales (MVP).
 * Chaplain y Commando son desbloqueos meta (ver GDD §Progresión) y se
 * agregarán a este archivo cuando entren en alcance.
 * Convenciones: tiempos en ms, velocidades en px/s, rangos en px.
 */
export const UNITS: UnitDef[] = [
  {
    id: 'rifleman',
    name: 'Rifleman',
    role: 'assault',
    description: 'Standard infantry. Cheap, reliable, the backbone of every push.',
    cost: 25,
    deployCooldown: 2000,
    stats: { maxHp: 60, damage: 6, attackInterval: 600, range: 110, moveSpeed: 30, armor: 0 },
    traits: [],
    tags: ['infantry', 'organic'],
    placeholder: { color: 0x5d7c4a, label: 'R' },
  },
  {
    id: 'heavy-gunner',
    name: 'Heavy Gunner',
    role: 'suppression',
    description: 'Sustained fire that chews through hordes and slows the dead.',
    cost: 60,
    deployCooldown: 8000,
    stats: { maxHp: 140, damage: 4, attackInterval: 180, range: 120, moveSpeed: 20, armor: 1 },
    traits: [
      {
        id: 'suppress',
        name: 'Suppression',
        description: 'Targets hit are slowed by 15%.',
        value: 0.15,
      },
    ],
    tags: ['infantry', 'organic'],
    placeholder: { color: 0x3f5a36, label: 'H' },
  },
  {
    id: 'medic',
    name: 'Medic',
    role: 'support',
    description: 'Keeps the line breathing. Low damage, high value.',
    cost: 45,
    deployCooldown: 9000,
    stats: {
      maxHp: 50, damage: 2, attackInterval: 900, range: 70, moveSpeed: 30, armor: 0,
      healPower: 8, healRadius: 90,
    },
    traits: [
      {
        id: 'field-medic',
        name: 'Field Medic',
        description: 'Prioritizes healing the most wounded ally in radius over attacking.',
      },
    ],
    tags: ['infantry', 'organic', 'support'],
    placeholder: { color: 0xc9c9b0, label: 'M' },
  },
  {
    id: 'engineer',
    name: 'Engineer',
    role: 'engineering',
    description: 'Builds a barricade to hold the front. Unlocks mines and turrets via upgrades.',
    cost: 50,
    deployCooldown: 12000,
    stats: { maxHp: 70, damage: 3, attackInterval: 800, range: 80, moveSpeed: 28, armor: 0 },
    traits: [
      {
        id: 'build-barricade',
        name: 'Barricade',
        description: 'Deploys a 180 HP barricade at the frontline, then fights normally.',
        value: 180,
      },
    ],
    tags: ['infantry', 'organic', 'specialist'],
    placeholder: { color: 0x8a6f3c, label: 'E' },
  },
  {
    id: 'sniper',
    name: 'Sniper',
    role: 'precision',
    description: 'One shot, one corpse that stays down. Hunts elites first.',
    cost: 70,
    deployCooldown: 12000,
    stats: { maxHp: 45, damage: 45, attackInterval: 2600, range: 260, moveSpeed: 26, armor: 0 },
    traits: [
      {
        id: 'priority-elite',
        name: 'Target Priority',
        description: 'Targets elites and minibosses in range before anything else.',
      },
    ],
    tags: ['infantry', 'organic', 'specialist'],
    placeholder: { color: 0x4a5d6b, label: 'S' },
  },
  {
    id: 'flamethrower',
    name: 'Flamethrower',
    role: 'incendiary',
    description: 'Short range, wide spray. Hordes hate this one trick.',
    cost: 55,
    deployCooldown: 10000,
    stats: {
      maxHp: 80, damage: 6, attackInterval: 300, range: 60, moveSpeed: 28, armor: 0,
      maxTargets: 3,
    },
    traits: [
      {
        id: 'burn',
        name: 'Burn',
        description: 'Hits ignite targets: 3 damage per second for 2 seconds.',
        value: 3,
      },
    ],
    tags: ['infantry', 'organic', 'specialist'],
    placeholder: { color: 0xc4622d, label: 'F' },
  },
];

/** Índice por id para lookups O(1). */
export const UNIT_INDEX: Record<string, UnitDef> = Object.fromEntries(
  UNITS.map((u) => [u.id, u]),
);
