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
    name: 'Conscripto',
    role: 'assault',
    description: 'Recluta de primera línea. Barato y compañero. Gana moral al estar rodeado.',
    cost: 25,
    deployCooldown: 2000,
    stats: { maxHp: 65, damage: 6, attackInterval: 600, range: 110, moveSpeed: 30, armor: 0 },
    traits: [],
    tags: ['infantry', 'organic'],
    placeholder: { color: 0x5d7c4a, label: 'C' },
    phrase: "¡Por la patria y el asado!"
  },
  {
    id: 'heavy-gunner',
    name: 'Gendarme',
    role: 'suppression',
    description: 'Resistente defensor de frontera. Su fuego pesado ralentiza zombis.',
    cost: 60,
    deployCooldown: 8000,
    stats: { maxHp: 150, damage: 5, attackInterval: 200, range: 120, moveSpeed: 20, armor: 2 },
    traits: [
      {
        id: 'suppress',
        name: 'Supresión',
        description: 'Targets hit are slowed by 15%.',
        value: 0.15,
      },
    ],
    tags: ['infantry', 'organic'],
    placeholder: { color: 0x3f5a36, label: 'G' },
    phrase: "Atrás de la línea, pibe."
  },
  {
    id: 'medic',
    name: 'Médico de Guardia',
    role: 'support',
    description: 'Sanitario de hospital público. Prioriza curar aliados heridos.',
    cost: 45,
    deployCooldown: 9000,
    stats: {
      maxHp: 55, damage: 2, attackInterval: 900, range: 75, moveSpeed: 30, armor: 0,
      healPower: 9, healRadius: 90,
    },
    traits: [
      {
        id: 'field-medic',
        name: 'Médico de Guardia',
        description: 'Prioritizes healing the most wounded ally in radius over attacking.',
      },
    ],
    tags: ['infantry', 'organic', 'support'],
    placeholder: { color: 0xc9c9b0, label: 'M' },
    phrase: "Tengo tres horas de sueño, apurate."
  },
  {
    id: 'engineer',
    name: 'Mecánico de Barrio',
    role: 'engineering',
    description: 'Improvisa barricadas de chapa y alambre. Repara defensas.',
    cost: 50,
    deployCooldown: 12000,
    stats: { maxHp: 75, damage: 3, attackInterval: 800, range: 80, moveSpeed: 28, armor: 0 },
    traits: [
      {
        id: 'build-barricade',
        name: 'Barricada Improvisada',
        description: 'Deploys a 200 HP barricade at the frontline, then fights normally.',
        value: 200,
      },
    ],
    tags: ['infantry', 'organic', 'specialist'],
    placeholder: { color: 0x8a6f3c, label: 'E' },
    phrase: "Con dos precintos esto queda flama."
  },
  {
    id: 'sniper',
    name: 'Cazador Patagónico',
    role: 'precision',
    description: 'Fusil de cerrojo de caza mayor. Busca oficiales y monstruos primero.',
    cost: 70,
    deployCooldown: 12000,
    stats: { maxHp: 45, damage: 50, attackInterval: 2800, range: 270, moveSpeed: 26, armor: 0 },
    traits: [
      {
        id: 'priority-elite',
        name: 'Prioridad de Caza',
        description: 'Targets elites and minibosses in range before anything else.',
      },
    ],
    tags: ['infantry', 'organic', 'specialist'],
    placeholder: { color: 0x4a5d6b, label: 'S' },
    phrase: "Un tiro, una plaga menos."
  },
  {
    id: 'flamethrower',
    name: 'Parrillero',
    role: 'incendiary',
    description: 'Fuego lento. Su soplete calcina hordas y deja brasas ardientes.',
    cost: 55,
    deployCooldown: 10000,
    stats: {
      maxHp: 85, damage: 7, attackInterval: 300, range: 60, moveSpeed: 28, armor: 0,
      maxTargets: 3,
    },
    traits: [
      {
        id: 'burn',
        name: 'Quemadura',
        description: 'Hits ignite targets: 3 damage per second for 2 seconds.',
        value: 3,
      },
    ],
    tags: ['infantry', 'organic', 'specialist'],
    placeholder: { color: 0xc4622d, label: 'P' },
    phrase: "Aplicales fuego que se nos hace tarde."
  },
];

/** Índice por id para lookups O(1). */
export const UNIT_INDEX: Record<string, UnitDef> = Object.fromEntries(
  UNITS.map((u) => [u.id, u]),
);
