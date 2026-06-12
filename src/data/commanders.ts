import type { CommanderDef } from '../types/CommanderTypes';

/** 5 comandantes: 3 iniciales + 2 desbloqueables con medallas. */
export const COMMANDERS: CommanderDef[] = [
  {
    id: 'capt-miller',
    name: 'Captain Miller',
    callsign: 'Anvil',
    description: 'Infantry officer of the old school. His men hold because he holds.',
    unlockedByDefault: true,
    passiveText: ['Battles start with +15 morale.', 'Infantry has +10% max HP.'],
    passives: [
      { stat: 'moraleStart', op: 'add', value: 15 },
      { stat: 'maxHp', op: 'mul', value: 1.1, filter: { tags: ['infantry'] } },
    ],
    startingUnits: ['rifleman', 'medic', 'heavy-gunner'],
    startingAbilities: ['airstrike', 'medkit'],
  },
  {
    id: 'maj-brooks',
    name: 'Major Brooks',
    callsign: 'Thunder',
    description: 'Artillery fanatic. Solves people problems with ordnance solutions.',
    unlockedByDefault: true,
    passiveText: ['Commander abilities recharge 25% faster.', 'Battles start with -10 morale.'],
    passives: [
      { stat: 'abilityCooldown', op: 'mul', value: 0.75 },
      { stat: 'moraleStart', op: 'add', value: -10 },
    ],
    startingUnits: ['rifleman', 'heavy-gunner', 'engineer'],
    startingAbilities: ['artillery-barrage', 'airstrike'],
  },
  {
    id: 'dr-carter',
    name: 'Dr. Carter',
    callsign: 'Scalpel',
    description: 'Intelligence officer with a scientist\'s curiosity and a gambler\'s nerve.',
    unlockedByDefault: true,
    passiveText: [
      'Reward screens offer +1 option.',
      '+50% intel gained.',
      'Runs start with an extra mutation.',
    ],
    passives: [{ stat: 'intelGain', op: 'mul', value: 1.5 }],
    passiveHooks: ['extra-reward-option', 'extra-mutation-start'],
    startingUnits: ['rifleman', 'medic', 'engineer'],
    startingAbilities: ['supply-drop', 'smoke-screen'],
  },
  {
    id: 'sgt-ramirez',
    name: 'Sergeant Ramirez',
    callsign: 'Wildfire',
    description: 'Leads from two meters behind the flamethrower. Sometimes in front of it.',
    unlockedByDefault: false,
    unlockCostMedals: 100,
    passiveText: ['Infantry deals +15% damage.', 'Infantry deploy cooldowns 15% shorter.'],
    passives: [
      { stat: 'damage', op: 'mul', value: 1.15, filter: { tags: ['infantry'] } },
      { stat: 'deployCooldown', op: 'mul', value: 0.85, filter: { tags: ['infantry'] } },
    ],
    startingUnits: ['rifleman', 'flamethrower', 'heavy-gunner'],
    startingAbilities: ['rally', 'airstrike'],
  },
  {
    id: 'father-donovan',
    name: 'Father Donovan',
    callsign: 'Shepherd',
    description: 'Combat chaplain. The dead fear exactly one living man, and it\'s him.',
    unlockedByDefault: false,
    unlockCostMedals: 100,
    passiveText: ['Occult debuffs last 50% less.', 'Morale losses reduced by 25%.'],
    passives: [{ stat: 'moraleLossMult', op: 'mul', value: 0.75 }],
    passiveHooks: ['occult-resist'],
    startingUnits: ['rifleman', 'medic', 'sniper'],
    startingAbilities: ['holy-flare', 'medkit'],
  },
];

export const COMMANDER_INDEX: Record<string, CommanderDef> = Object.fromEntries(
  COMMANDERS.map((c) => [c.id, c]),
);
