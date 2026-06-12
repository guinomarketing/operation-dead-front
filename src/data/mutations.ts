import type { MutationDef } from '../types/RunTypes';

/** Mutaciones: modificadores negativos de run que escalan la dificultad. */
export const MUTATIONS: MutationDef[] = [
  {
    id: 'hasty-dead',
    name: 'Hasty Dead',
    description: 'All enemies move 20% faster.',
    modifiers: [{ stat: 'moveSpeed', op: 'mul', value: 1.2, filter: { side: 'enemy' } }],
  },
  {
    id: 'blast-doctrine',
    name: 'Blast Doctrine',
    description: 'Exploders are more common and deal +25% damage.',
    modifiers: [{ stat: 'damage', op: 'mul', value: 1.25, filter: { enemyIds: ['exploder'] } }],
  },
  {
    id: 'endless-fog',
    name: 'Endless Fog',
    description: 'A permanent haze: allied range reduced by 20%.',
    modifiers: [{ stat: 'range', op: 'mul', value: 0.8, filter: { side: 'ally' } }],
  },
  {
    id: 'thin-supplies',
    name: 'Thin Supplies',
    description: 'Supply income reduced by 25%.',
    modifiers: [{ stat: 'incomeRate', op: 'mul', value: 0.75 }],
  },
  {
    id: 'grave-discipline',
    name: 'Grave Discipline',
    description: 'Fodder enemies have a 30% chance to rise again once.',
    hooks: ['fodder-revive'],
  },
  {
    id: 'honor-guard',
    name: 'Honor Guard',
    description: 'The operation boss is escorted by 2 elite units.',
    hooks: ['boss-honor-guard'],
  },
];

export const MUTATION_INDEX: Record<string, MutationDef> = Object.fromEntries(
  MUTATIONS.map((m) => [m.id, m]),
);
