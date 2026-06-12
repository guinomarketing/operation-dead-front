import type { BossDef } from '../types/EnemyTypes';

/**
 * Bosses (1 por operación). Las fases se activan al cruzar umbrales de HP:
 * la fase i rige mientras hp% > untilHpPct de la fase i; la última usa 0.
 * statOverrides se aplican SOBRE los stats base al entrar a la fase.
 */
export const BOSSES: BossDef[] = [
  {
    id: 'general-eisenfaust',
    name: 'General Eisenfaust',
    title: 'The Iron Fist of the Last March',
    tier: 'boss',
    behaviors: ['advance'],
    description:
      'A dead general with a hydraulic arm, still fighting a war that ended for him long ago.',
    stats: {
      maxHp: 1200, damage: 35, attackInterval: 2400, range: 40, moveSpeed: 12, armor: 3,
      aoeRadius: 90,
    },
    bounty: 100,
    intelGain: 5,
    moraleOnDeath: 25,
    moraleOnBreach: 40,
    tags: ['undead', 'officer', 'mechanical'],
    placeholder: { color: 0x9c2424, label: 'B1' },
    phases: [
      {
        untilHpPct: 70,
        description: 'Commands from the rear: summons 3 Revenant Grunts every 8 seconds.',
        abilities: [
          {
            id: 'summon',
            cooldown: 8000,
            description: 'Summons 3 Revenant Grunts at the enemy spawn line.',
            params: { enemyId: 'revenant-grunt', count: 3 },
          },
        ],
      },
      {
        untilHpPct: 35,
        description: 'Joins the front: personal command aura (+20% damage to nearby Reich units) and ground slam.',
        abilities: [
          {
            id: 'summon',
            cooldown: 8000,
            description: 'Summons 3 Revenant Grunts at the enemy spawn line.',
            params: { enemyId: 'revenant-grunt', count: 3 },
          },
        ],
      },
      {
        untilHpPct: 0,
        description: 'Iron rage: summons Runner Corpses every 5 seconds and speeds up 30%.',
        abilities: [
          {
            id: 'summon',
            cooldown: 5000,
            description: 'Summons 2 Runner Corpses at the enemy spawn line.',
            params: { enemyId: 'runner-corpse', count: 2 },
          },
        ],
        statOverrides: { moveSpeed: 16 },
      },
    ],
  },
  {
    id: 'doctor-totenkopf',
    name: 'Doctor Totenkopf',
    title: 'Father of the Serum',
    tier: 'boss',
    behaviors: ['caster'],
    description:
      'The mind behind the Umbra Project. Improves his creations mid-battle and patches them with serum.',
    stats: { maxHp: 950, damage: 10, attackInterval: 1600, range: 180, moveSpeed: 14, armor: 1 },
    bounty: 100,
    intelGain: 5,
    moraleOnDeath: 25,
    moraleOnBreach: 40,
    tags: ['undead', 'occult', 'scientist'],
    placeholder: { color: 0x46a35a, label: 'B2' },
    phases: [
      {
        untilHpPct: 60,
        description: 'Field tests: mutates one living enemy every 10s, drops serum healing zones.',
        abilities: [
          {
            id: 'mutate',
            cooldown: 10000,
            description: 'Mutates a living enemy: +50% max HP and +30% damage.',
            params: { hpMult: 1.5, damageMult: 1.3 },
          },
          {
            id: 'heal-zone',
            cooldown: 12000,
            description: 'Serum spill: heals Reich units 10 HP/s in a 110 px radius for 5s.',
            params: { healPerSecond: 10, radius: 110, durationMs: 5000 },
          },
        ],
      },
      {
        untilHpPct: 30,
        description: 'Accelerated trials: mutation cooldown drops to 7 seconds.',
        abilities: [
          {
            id: 'mutate',
            cooldown: 7000,
            description: 'Mutates a living enemy: +50% max HP and +30% damage.',
            params: { hpMult: 1.5, damageMult: 1.3 },
          },
          {
            id: 'heal-zone',
            cooldown: 12000,
            description: 'Serum spill: heals Reich units 10 HP/s in a 110 px radius for 5s.',
            params: { healPerSecond: 10, radius: 110, durationMs: 5000 },
          },
        ],
      },
      {
        untilHpPct: 0,
        description: 'Self-injection: doubles his damage and gains +40% speed, but his flesh sheds all armor.',
        statOverrides: { damage: 20, moveSpeed: 20, armor: 0 },
      },
    ],
  },
  {
    id: 'panzer-corpse-engine',
    name: 'Panzer Corpse Engine',
    title: 'The Rolling Grave',
    tier: 'boss',
    behaviors: ['siege'],
    description:
      'A living tank welded from steel and the dead. Slow as a funeral, hits like the end of one.',
    stats: {
      maxHp: 2000, damage: 50, attackInterval: 6000, range: 200, moveSpeed: 6, armor: 8,
      aoeRadius: 100,
    },
    abilities: [
      {
        id: 'cannon',
        cooldown: 6000,
        description: 'Fires its corpse-cannon: 50 damage in a 100 px radius.',
        params: { damage: 50, radius: 100 },
      },
    ],
    bounty: 100,
    intelGain: 5,
    moraleOnDeath: 25,
    moraleOnBreach: 40,
    tags: ['undead', 'mechanical', 'armored'],
    placeholder: { color: 0x39444a, label: 'B3' },
    phases: [
      {
        untilHpPct: 50,
        description: 'Armored advance: sheds 2 Scrap Grunts each time it loses 20% HP (80/60/40/20%).',
        abilities: [
          {
            id: 'summon',
            cooldown: 0,
            description: 'On each 20% HP threshold, 2 Revenant Grunts crawl out of the wreck.',
            params: { enemyId: 'revenant-grunt', count: 2, onHpThresholdPct: 20 },
          },
        ],
      },
      {
        untilHpPct: 0,
        description: 'Exposed engine: armor drops to 3, speed rises, cannon reloads faster.',
        statOverrides: { armor: 3, moveSpeed: 10, attackInterval: 4500 },
        abilities: [
          {
            id: 'cannon',
            cooldown: 4500,
            description: 'Fires its corpse-cannon: 50 damage in a 100 px radius.',
            params: { damage: 50, radius: 100 },
          },
        ],
      },
    ],
  },
];

export const BOSS_INDEX: Record<string, BossDef> = Object.fromEntries(
  BOSSES.map((b) => [b.id, b]),
);
