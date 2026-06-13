import type { MutationDef } from '../types/RunTypes';

/** Mutaciones: modificadores negativos de run que escalan la dificultad. */
export const MUTATIONS: MutationDef[] = [
  {
    id: 'hasty-dead',
    name: 'Pasos Apurados',
    description: 'Todos los enemigos se mueven 20% más rápido.',
    modifiers: [{ stat: 'moveSpeed', op: 'mul', value: 1.2, filter: { side: 'enemy' } }],
  },
  {
    id: 'blast-doctrine',
    name: 'Doctrina Volátil',
    description: 'Los Infectados Gaseosos aparecen más seguido y causan +25% de daño.',
    modifiers: [{ stat: 'damage', op: 'mul', value: 1.25, filter: { enemyIds: ['exploder'] } }],
  },
  {
    id: 'endless-fog',
    name: 'Neblina Eterna',
    description: 'Una densa bruma permanente reduce el alcance aliado un 20%.',
    modifiers: [{ stat: 'range', op: 'mul', value: 0.8, filter: { side: 'ally' } }],
  },
  {
    id: 'thin-supplies',
    name: 'Yerba Lavada',
    description: 'Los ingresos de suministros disminuyen un 25%.',
    modifiers: [{ stat: 'incomeRate', op: 'mul', value: 0.75 }],
  },
  {
    id: 'grave-discipline',
    name: 'Firmeza de Ultratumba',
    description: 'Los enemigos rasos tienen un 30% de probabilidad de resucitar una vez.',
    hooks: ['fodder-revive'],
  },
  {
    id: 'honor-guard',
    name: 'Guardia del Cóndor',
    description: 'El jefe de la operación es escoltado por 2 unidades élite.',
    hooks: ['boss-honor-guard'],
  },
];

export const MUTATION_INDEX: Record<string, MutationDef> = Object.fromEntries(
  MUTATIONS.map((m) => [m.id, m]),
);
