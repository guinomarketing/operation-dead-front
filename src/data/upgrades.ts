import type { BuildingDef, UpgradeDef } from '../types/UpgradeTypes';

export const BUILDINGS: BuildingDef[] = [
  { id: 'barracks', name: 'Barracks', description: 'Infantry training and logistics.' },
  { id: 'armory', name: 'Armory', description: 'Weapons, ammo types and firepower.' },
  { id: 'med-tent', name: 'Med Tent', description: 'Field medicine and casualty care.' },
  { id: 'engineering-bay', name: 'Engineering Bay', description: 'Structures and field works.' },
  { id: 'intel-room', name: 'Intel Room', description: 'Recon, bounties and map knowledge.' },
  { id: 'war-room', name: 'War Room', description: 'Commander abilities and doctrine.' },
];

/** Upgrades de run, 3 tiers encadenados por edificio. */
export const UPGRADES: UpgradeDef[] = [
  // --- Barracks ---
  {
    id: 'barracks-1', buildingId: 'barracks', tier: 1,
    name: 'Hardened Recruits',
    description: 'Riflemen gain +20% max HP.',
    modifiers: [{ stat: 'maxHp', op: 'mul', value: 1.2, filter: { unitIds: ['rifleman'] } }],
  },
  {
    id: 'barracks-2', buildingId: 'barracks', tier: 2, requiresUpgradeId: 'barracks-1',
    name: 'Streamlined Logistics',
    description: 'Infantry costs 15% fewer supplies.',
    modifiers: [{ stat: 'cost', op: 'mul', value: 0.85, filter: { tags: ['infantry'] } }],
  },
  {
    id: 'barracks-3', buildingId: 'barracks', tier: 3, requiresUpgradeId: 'barracks-2',
    name: 'Veteran Cadre',
    description: 'Every deployed unit gains +10% damage and +10% max HP.',
    modifiers: [
      { stat: 'damage', op: 'mul', value: 1.1, filter: { side: 'ally' } },
      { stat: 'maxHp', op: 'mul', value: 1.1, filter: { side: 'ally' } },
    ],
  },
  // --- Armory ---
  {
    id: 'armory-1', buildingId: 'armory', tier: 1,
    name: 'Fresh Ammunition',
    description: 'All allied units deal +10% damage.',
    modifiers: [{ stat: 'damage', op: 'mul', value: 1.1, filter: { side: 'ally' } }],
  },
  {
    id: 'armory-2', buildingId: 'armory', tier: 2, requiresUpgradeId: 'armory-1',
    name: 'Incendiary Rounds',
    description: 'Riflemen and Heavy Gunners ignite targets for 2 seconds.',
    hooks: ['incendiary-rounds'],
  },
  {
    id: 'armory-3', buildingId: 'armory', tier: 3, requiresUpgradeId: 'armory-2',
    name: 'AP Rounds',
    description: 'Allied shots ignore 2 points of armor.',
    hooks: ['ap-rounds'],
  },
  // --- Med Tent ---
  {
    id: 'med-tent-1', buildingId: 'med-tent', tier: 1,
    name: 'Better Bandages',
    description: 'Healing is 30% more effective.',
    modifiers: [{ stat: 'healPower', op: 'mul', value: 1.3, filter: { side: 'ally' } }],
  },
  {
    id: 'med-tent-2', buildingId: 'med-tent', tier: 2, requiresUpgradeId: 'med-tent-1',
    name: 'Casualty Recovery',
    description: '25% of fallen units refund half their cost.',
    hooks: ['casualty-refund'],
  },
  {
    id: 'med-tent-3', buildingId: 'med-tent', tier: 3, requiresUpgradeId: 'med-tent-2',
    name: 'Miracle Workers',
    description: 'Medics can revive one fallen unit per battle.',
    hooks: ['revive-once-per-battle'],
  },
  // --- Engineering Bay ---
  {
    id: 'engineering-bay-1', buildingId: 'engineering-bay', tier: 1,
    name: 'Reinforced Barricades',
    description: 'Structures gain +50% HP.',
    modifiers: [{ stat: 'maxHp', op: 'mul', value: 1.5, filter: { tags: ['structure'] } }],
  },
  {
    id: 'engineering-bay-2', buildingId: 'engineering-bay', tier: 2, requiresUpgradeId: 'engineering-bay-1',
    name: 'Field Mines',
    description: 'Engineers can plant mines.',
    hooks: ['structure-mine'],
    unlocks: [{ kind: 'structure', id: 'mine' }],
  },
  {
    id: 'engineering-bay-3', buildingId: 'engineering-bay', tier: 3, requiresUpgradeId: 'engineering-bay-2',
    name: 'Automated Turret',
    description: 'Engineers can build a light turret.',
    hooks: ['structure-turret'],
    unlocks: [{ kind: 'structure', id: 'turret' }],
  },
  // --- Intel Room ---
  {
    id: 'intel-room-1', buildingId: 'intel-room', tier: 1,
    name: 'Forward Scouts',
    description: 'Reveals the node types of the next row.',
    hooks: ['reveal-next-nodes'],
  },
  {
    id: 'intel-room-2', buildingId: 'intel-room', tier: 2, requiresUpgradeId: 'intel-room-1',
    name: 'Enemy Dossiers',
    description: 'Reveals the composition of elite nodes.',
    hooks: ['reveal-elite-comp'],
  },
  {
    id: 'intel-room-3', buildingId: 'intel-room', tier: 3, requiresUpgradeId: 'intel-room-2',
    name: 'Bounty Network',
    description: 'Enemies drop +15% supplies.',
    modifiers: [{ stat: 'bounty', op: 'mul', value: 1.15 }],
  },
  // --- War Room ---
  {
    id: 'war-room-1', buildingId: 'war-room', tier: 1,
    name: 'Direct Line',
    description: 'Commander abilities recharge 20% faster.',
    modifiers: [{ stat: 'abilityCooldown', op: 'mul', value: 0.8 }],
  },
  {
    id: 'war-room-2', buildingId: 'war-room', tier: 2, requiresUpgradeId: 'war-room-1',
    name: 'Requisition Priority',
    description: 'Commander abilities cost 25% fewer supplies.',
    modifiers: [{ stat: 'abilityCost', op: 'mul', value: 0.75 }],
  },
  {
    id: 'war-room-3', buildingId: 'war-room', tier: 3, requiresUpgradeId: 'war-room-2',
    name: 'Extended Doctrine',
    description: 'Unlocks a third ability slot.',
    hooks: ['ability-slot-3'],
    unlocks: [{ kind: 'ability-slot', id: 'slot-3' }],
  },
];

export const UPGRADE_INDEX: Record<string, UpgradeDef> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u]),
);
