import type { CommanderDef } from '../types/CommanderTypes';

/** 5 comandantes: 3 iniciales + 2 desbloqueables con medallas. */
export const COMMANDERS: CommanderDef[] = [
  {
    id: 'capt-miller',
    name: 'Capitán Ortega',
    callsign: 'Yunque',
    description: 'Oficial de infantería de la vieja escuela. Sus soldados resisten porque él está de pie.',
    unlockedByDefault: true,
    passiveText: ['Comienza la batalla con +15 de moral.', 'La infantería tiene +10% de HP máximo.'],
    passives: [
      { stat: 'moraleStart', op: 'add', value: 15 },
      { stat: 'maxHp', op: 'mul', value: 1.1, filter: { tags: ['infantry'] } },
    ],
    startingUnits: ['rifleman', 'medic', 'heavy-gunner'],
    startingAbilities: ['airstrike', 'medkit'],
  },
  {
    id: 'maj-brooks',
    name: 'Mayor Benítez',
    callsign: 'Trueno',
    description: 'Fanático de la artillería pesada. Resuelve cualquier inconveniente con una ráfaga de mortero.',
    unlockedByDefault: true,
    passiveText: ['Las habilidades de comandante recargan 25% más rápido.', 'Las batallas comienzan con -10 de moral.'],
    passives: [
      { stat: 'abilityCooldown', op: 'mul', value: 0.75 },
      { stat: 'moraleStart', op: 'add', value: -10 },
    ],
    startingUnits: ['rifleman', 'heavy-gunner', 'engineer'],
    startingAbilities: ['artillery-barrage', 'airstrike'],
  },
  {
    id: 'dr-carter',
    name: 'Doctor Rossi',
    callsign: 'Bisturí',
    description: 'Oficial de inteligencia con la curiosidad de un científico y los nervios de un timbero.',
    unlockedByDefault: true,
    passiveText: [
      'Las pantallas de recompensa ofrecen +1 opción.',
      '+50% de inteligencia ganada.',
      'Las partidas comienzan con una mutación extra.',
    ],
    passives: [{ stat: 'intelGain', op: 'mul', value: 1.5 }],
    passiveHooks: ['extra-reward-option', 'extra-mutation-start'],
    startingUnits: ['rifleman', 'medic', 'engineer'],
    startingAbilities: ['supply-drop', 'smoke-screen'],
  },
  {
    id: 'sgt-ramirez',
    name: 'Sargento Ramírez',
    callsign: 'Brasa',
    description: 'Lidera desde el frente junto al Parrillero. A veces, demasiado cerca del fuego.',
    unlockedByDefault: false,
    unlockCostMedals: 100,
    passiveText: ['La infantería inflige +15% de daño.', 'Tiempo de recarga de despliegue de infantería 15% más corto.'],
    passives: [
      { stat: 'damage', op: 'mul', value: 1.15, filter: { tags: ['infantry'] } },
      { stat: 'deployCooldown', op: 'mul', value: 0.85, filter: { tags: ['infantry'] } },
    ],
    startingUnits: ['rifleman', 'flamethrower', 'heavy-gunner'],
    startingAbilities: ['rally', 'airstrike'],
  },
  {
    id: 'father-donovan',
    name: 'Padre Silva',
    callsign: 'Pastor',
    description: 'Capellán de frontera. La Legión teme a un solo hombre en esta tierra fría, y es a él.',
    unlockedByDefault: false,
    unlockCostMedals: 100,
    passiveText: ['Los perjuicios ocultistas duran 50% menos.', 'Pérdidas de moral reducidas un 25%.'],
    passives: [{ stat: 'moraleLossMult', op: 'mul', value: 0.75 }],
    passiveHooks: ['occult-resist'],
    startingUnits: ['rifleman', 'medic', 'sniper'],
    startingAbilities: ['holy-flare', 'medkit'],
  },
];

export const COMMANDER_INDEX: Record<string, CommanderDef> = Object.fromEntries(
  COMMANDERS.map((c) => [c.id, c]),
);
