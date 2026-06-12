import type { RelicDef } from '../types/RunTypes';

/** 20 reliquias iniciales. Hooks documentados en types/common.ts. */
export const RELICS: RelicDef[] = [
  {
    id: 'broken-flag', name: 'Broken Flag', rarity: 'rare',
    description: 'When your base drops below 40% HP, all allies deal +30% damage.',
    flavor: 'It never surrendered. Neither will you.',
    hooks: ['low-base-rage'],
  },
  {
    id: 'blessed-ammo', name: 'Blessed Ammo', rarity: 'common',
    description: '+30% damage vs occult units, +10% vs everything else.',
    modifiers: [
      { stat: 'damage', op: 'mul', value: 1.3, filter: { side: 'ally', tags: ['occult'] }, note: 'filter = target tags' },
      { stat: 'damage', op: 'mul', value: 1.1, filter: { side: 'ally' } },
    ],
  },
  {
    id: 'black-coffee-rations', name: 'Black Coffee Rations', rarity: 'common',
    description: 'Allies attack 15% faster but deal 10% less damage per hit.',
    modifiers: [
      { stat: 'attackInterval', op: 'mul', value: 0.85, filter: { side: 'ally' } },
      { stat: 'damage', op: 'mul', value: 0.9, filter: { side: 'ally' } },
    ],
  },
  {
    id: 'last-stand-medal', name: 'Last Stand Medal', rarity: 'rare',
    description: 'Once per battle, morale cannot drop below 1 and instead surges +20.',
    hooks: ['morale-floor-once'],
  },
  {
    id: 'experimental-serum', name: 'Experimental Serum', rarity: 'rare',
    description: 'Healing is 50% stronger, but each heal has a 10% chance to scar (-10% max HP).',
    modifiers: [{ stat: 'healPower', op: 'mul', value: 1.5, filter: { side: 'ally' } }],
    hooks: ['serum-infection-risk'],
  },
  {
    id: 'engineers-toolkit', name: "Engineer's Toolkit", rarity: 'common',
    description: 'Structures cost 25% less, build 25% faster and have +25% HP.',
    modifiers: [
      { stat: 'cost', op: 'mul', value: 0.75, filter: { tags: ['structure'] } },
      { stat: 'deployCooldown', op: 'mul', value: 0.75, filter: { unitIds: ['engineer'] } },
      { stat: 'maxHp', op: 'mul', value: 1.25, filter: { tags: ['structure'] } },
    ],
  },
  {
    id: 'sniper-scope', name: 'Match-Grade Scope', rarity: 'common',
    description: 'Snipers deal +25% damage to elites and minibosses.',
    modifiers: [
      { stat: 'damage', op: 'mul', value: 1.25, filter: { unitIds: ['sniper'], tiers: ['elite', 'miniboss'] }, note: 'tiers = target tiers' },
    ],
  },
  {
    id: 'burning-oil', name: 'Burning Oil', rarity: 'rare',
    description: 'Fire attacks leave burning ground for 2 seconds.',
    hooks: ['ground-fire'],
  },
  {
    id: 'war-bonds', name: 'War Bonds', rarity: 'rare',
    description: '+25% supply income, but battles start with -15 morale.',
    modifiers: [
      { stat: 'incomeRate', op: 'mul', value: 1.25 },
      { stat: 'moraleStart', op: 'add', value: -15 },
    ],
  },
  {
    id: 'radio-intercept', name: 'Radio Intercept', rarity: 'common',
    description: 'Reveals the next event node before you reach it.',
    hooks: ['reveal-next-event'],
  },
  {
    id: 'captains-helmet', name: "Captain's Helmet", rarity: 'epic',
    description: 'The first allied unit to die each battle survives at 1 HP instead.',
    flavor: 'Dented twice. Never pierced.',
    hooks: ['first-death-survives'],
  },
  {
    id: 'forbidden-field-manual', name: 'Forbidden Field Manual', rarity: 'epic',
    description: 'Reward screens offer +1 option, but the run starts with an extra mutation.',
    hooks: ['extra-reward-option', 'extra-mutation-start'],
  },
  {
    id: 'trench-whistle', name: 'Trench Whistle', rarity: 'common',
    description: 'Deploy cooldowns are 20% shorter.',
    modifiers: [{ stat: 'deployCooldown', op: 'mul', value: 0.8, filter: { side: 'ally' } }],
  },
  {
    id: 'iron-rations', name: 'Iron Rations', rarity: 'common',
    description: 'All allied units gain +15% max HP.',
    modifiers: [{ stat: 'maxHp', op: 'mul', value: 1.15, filter: { side: 'ally' } }],
  },
  {
    id: 'gas-mask-crate', name: 'Gas Mask Crate', rarity: 'common',
    description: 'Occult debuffs last 50% less on your units.',
    hooks: ['occult-resist'],
  },
  {
    id: 'lucky-zippo', name: 'Lucky Zippo', rarity: 'common',
    description: 'Burn effects last twice as long; Flamethrowers gain +15 range.',
    modifiers: [{ stat: 'range', op: 'add', value: 15, filter: { unitIds: ['flamethrower'] } }],
    hooks: ['ground-fire'],
  },
  {
    id: 'field-radio', name: 'Field Radio', rarity: 'rare',
    description: 'Every battle opens with a free Supply Drop.',
    hooks: ['supply-drop-start'],
  },
  {
    id: 'dog-tag-ledger', name: 'Dog Tag Ledger', rarity: 'rare',
    description: 'Gain 10 supplies whenever an allied unit dies.',
    flavor: 'Every name gets counted. Every count gets paid.',
    hooks: ['salvage-on-death'],
  },
  {
    id: 'chaplains-cross', name: "Chaplain's Cross", rarity: 'rare',
    description: 'Morale losses are halved and battles start with +10 morale.',
    modifiers: [
      { stat: 'moraleLossMult', op: 'mul', value: 0.5 },
      { stat: 'moraleStart', op: 'add', value: 10 },
    ],
  },
  {
    id: 'reapers-ledger', name: "Reaper's Ledger", rarity: 'epic',
    description: 'Every 12 kills, your next deployment is free.',
    hooks: ['free-deploy-per-12-kills'],
  },
];

export const RELIC_INDEX: Record<string, RelicDef> = Object.fromEntries(
  RELICS.map((r) => [r.id, r]),
);
