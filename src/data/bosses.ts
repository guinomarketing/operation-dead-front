import type { BossDef } from '../types/EnemyTypes';

/**
 * Bosses (1 por operación). Las fases se activan al cruzar umbrales de HP:
 * la fase i rige mientras hp% > untilHpPct de la fase i; la última usa 0.
 * statOverrides se aplican SOBRE los stats base al entrar a la fase.
 */
export const BOSSES: BossDef[] = [
  {
    id: 'general-eisenfaust',
    name: 'Coronel Von Grüber',
    title: 'El Terror Blindado del Búnker',
    tier: 'boss',
    behaviors: ['advance'],
    description:
      'Un robusto coronel reanimado con una gabardina militar desgarrada y una prótesis hidráulica oxidada.',
    stats: {
      maxHp: 900, damage: 30, attackInterval: 2400, range: 40, moveSpeed: 12, armor: 3,
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
        description: 'Ordena desde atras: invoca 2 Zombis del Condor cada 9 segundos.',
        abilities: [
          {
            id: 'summon',
            cooldown: 9000,
            description: 'Invoca 2 Zombis del Condor en la linea de spawn enemiga.',
            params: { enemyId: 'revenant-grunt', count: 2 },
          },
        ],
      },
      {
        untilHpPct: 35,
        description: 'Carga al frente: aura de comando (+25% daño, +15% velocidad a zombis) y ataques en área.',
        abilities: [
          {
            id: 'summon',
            cooldown: 9000,
            description: 'Invoca 2 Zombis del Condor en la linea de spawn enemiga.',
            params: { enemyId: 'revenant-grunt', count: 2 },
          },
        ],
      },
      {
        untilHpPct: 0,
        description: 'Furia de metal: invoca Infectados Veloces cada 8 segundos y aumenta su velocidad.',
        abilities: [
          {
            id: 'summon',
            cooldown: 8000,
            description: 'Invoca 2 Infectados Veloces en la línea de spawn.',
            params: { enemyId: 'runner-corpse', count: 2 },
          },
        ],
        statOverrides: { moveSpeed: 14 },
      },
    ],
  },
  {
    id: 'doctor-totenkopf',
    name: 'Doctor Von Totenkopf',
    title: 'Creador del Suero Cóndor',
    tier: 'boss',
    behaviors: ['caster'],
    description:
      'La mente oscura detrás del Proyecto Umbra. Inyecta mutágenos a sus creaciones y cura sus heridas con suero.',
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
        description: 'Ensayos de campo: muta un zombi cada 10s y derrama zonas de curación.',
        abilities: [
          {
            id: 'mutate',
            cooldown: 10000,
            description: 'Muta a un enemigo: +50% HP máximo y +30% de daño.',
            params: { hpMult: 1.5, damageMult: 1.3 },
          },
          {
            id: 'summon',
            cooldown: 12000,
            description: 'Libera un sujeto de prueba toxico desde la niebla del pueblo.',
            params: { enemyId: 'toxic-carrier', count: 1 },
          },
          {
            id: 'heal-zone',
            cooldown: 12000,
            description: 'Derrame de suero: cura a las unidades de la secta 10 HP/s en un radio de 110px por 5s.',
            params: { healPerSecond: 10, radius: 110, durationMs: 5000 },
          },
        ],
      },
      {
        untilHpPct: 30,
        description: 'Pruebas aceleradas: el cooldown de mutación disminuye a 7 segundos.',
        abilities: [
          {
            id: 'mutate',
            cooldown: 7000,
            description: 'Muta a un enemigo: +50% HP máximo y +30% de daño.',
            params: { hpMult: 1.5, damageMult: 1.3 },
          },
          {
            id: 'summon',
            cooldown: 9000,
            description: 'Libera un sujeto de prueba toxico desde la niebla del pueblo.',
            params: { enemyId: 'toxic-carrier', count: 1 },
          },
          {
            id: 'heal-zone',
            cooldown: 12000,
            description: 'Derrame de suero: cura a las unidades de la secta 10 HP/s en un radio de 110px por 5s.',
            params: { healPerSecond: 10, radius: 110, durationMs: 5000 },
          },
        ],
      },
      {
        untilHpPct: 0,
        description: 'Autoinyección: duplica su daño y gana +40% de velocidad, pero pierde toda armadura.',
        statOverrides: { damage: 20, moveSpeed: 20, armor: 0 },
      },
    ],
  },
  {
    id: 'panzer-corpse-engine',
    name: 'Locomotora Profanadora',
    title: 'La Tumba de Acero Rodante',
    tier: 'boss',
    behaviors: ['siege'],
    description:
      'Un tanque viviente ensamblado con chatarra pesada y cuerpos reanimados. Lento pero devastador.',
    stats: {
      maxHp: 1600, damage: 45, attackInterval: 6000, range: 200, moveSpeed: 6, armor: 8,
      aoeRadius: 100,
    },
    abilities: [
      {
        id: 'cannon',
        cooldown: 6000,
        description: 'Dispara su canon de cadaveres: 44 de dano en un radio de 100px.',
        params: { damage: 44, radius: 100 },
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
        description: 'Avance blindado: suelta 2 Zombis del Cóndor al perder 20% de HP (80/60/40/20%).',
        abilities: [
          {
            id: 'summon',
            cooldown: 0,
            description: 'En cada umbral del 20% de HP, 2 Zombis del Cóndor caen de la chatarra.',
            params: { enemyId: 'revenant-grunt', count: 2, onHpThresholdPct: 20 },
          },
        ],
      },
      {
        untilHpPct: 0,
        description: 'Motor expuesto: la armadura cae a 3, aumenta su velocidad y recarga más rápido el cañón.',
        statOverrides: { armor: 3, moveSpeed: 10, attackInterval: 4500 },
        abilities: [
          {
            id: 'cannon',
            cooldown: 4500,
            description: 'Dispara su canon de cadaveres: 44 de dano en un radio de 100px.',
            params: { damage: 44, radius: 100 },
          },
        ],
      },
    ],
  },
];

export const BOSS_INDEX: Record<string, BossDef> = Object.fromEntries(
  BOSSES.map((b) => [b.id, b]),
);
