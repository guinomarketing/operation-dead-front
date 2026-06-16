import type { RelicDef } from '../types/RunTypes';

/** 20 reliquias iniciales. Hooks documentados en types/common.ts. */
export const RELICS: RelicDef[] = [
  {
    id: 'broken-flag', name: 'Bandera Jironada', rarity: 'rare',
    description: 'Cuando la base cae por debajo de 40% de vida, todos los aliados infligen +30% de daño.',
    flavor: 'Jirones de gloria patria que resisten hasta el final.',
    iconFrame: 0,
    hooks: ['low-base-rage'],
  },
  {
    id: 'blessed-ammo', name: 'Munición Bendecida', rarity: 'common',
    description: '+30% de daño contra unidades ocultistas, +10% contra todos los demás.',
    iconFrame: 1,
    modifiers: [
      { stat: 'damage', op: 'mul', value: 1.1818, filter: { side: 'ally', tags: ['occult'] }, note: 'stacks with the base +10% to total about +30% vs target tags' },
      { stat: 'damage', op: 'mul', value: 1.1, filter: { side: 'ally' } },
    ],
  },
  {
    id: 'black-coffee-rations', name: 'Mate Cocido Quemado', rarity: 'common',
    description: 'Los aliados atacan 15% más rápido pero infligen 10% menos de daño por golpe.',
    iconFrame: 2,
    modifiers: [
      { stat: 'attackInterval', op: 'mul', value: 0.85, filter: { side: 'ally' } },
      { stat: 'damage', op: 'mul', value: 0.9, filter: { side: 'ally' } },
    ],
  },
  {
    id: 'last-stand-medal', name: 'Escarapela de Trinchera', rarity: 'rare',
    description: 'Una vez por batalla, la moral no puede caer por debajo de 1 y en su lugar sube +20.',
    iconFrame: 3,
    hooks: ['morale-floor-once'],
  },
  {
    id: 'experimental-serum', name: 'Elixir de Calafate', rarity: 'rare',
    description: 'La curación es 50% más fuerte, pero cada curación tiene un 10% de probabilidad de secuela (-10% de HP máximo).',
    iconFrame: 4,
    modifiers: [{ stat: 'healPower', op: 'mul', value: 1.5, filter: { side: 'ally' } }],
    hooks: ['serum-infection-risk'],
  },
  {
    id: 'engineers-toolkit', name: 'Caja de Herramientas de Barrio', rarity: 'common',
    description: 'Las estructuras cuestan 25% menos, se despliegan 25% más rápido y tienen +25% de vida.',
    iconFrame: 5,
    modifiers: [
      { stat: 'cost', op: 'mul', value: 0.75, filter: { tags: ['structure'] } },
      { stat: 'deployCooldown', op: 'mul', value: 0.75, filter: { unitIds: ['engineer'] } },
      { stat: 'maxHp', op: 'mul', value: 1.25, filter: { tags: ['structure'] } },
    ],
  },
  {
    id: 'sniper-scope', name: 'Mira de Caza Mayor', rarity: 'common',
    description: 'Los Cazadores Patagónicos infligen +25% de daño a élites y minibosses.',
    iconFrame: 6,
    modifiers: [
      { stat: 'damage', op: 'mul', value: 1.25, filter: { unitIds: ['sniper'], tiers: ['elite', 'miniboss'] }, note: 'tiers = target tiers' },
    ],
  },
  {
    id: 'burning-oil', name: 'Carbón del Asado', rarity: 'rare',
    description: 'Los ataques de fuego dejan el suelo ardiendo por 2 segundos adicionales.',
    iconFrame: 7,
    hooks: ['ground-fire'],
  },
  {
    id: 'war-bonds', name: 'Patacón de la Suerte', rarity: 'rare',
    description: '+25% de ingresos de suministros, pero las batallas comienzan con -15 de moral.',
    iconFrame: 8,
    modifiers: [
      { stat: 'incomeRate', op: 'mul', value: 1.25 },
      { stat: 'moraleStart', op: 'add', value: -15 },
    ],
  },
  {
    id: 'radio-intercept', name: 'Baquiano de Confianza', rarity: 'common',
    description: 'Revela el siguiente nodo de evento antes de que llegues a él.',
    iconFrame: 9,
    hooks: ['reveal-next-event'],
  },
  {
    id: 'captains-helmet', name: 'Casco de Acero Histórico', rarity: 'epic',
    description: 'El primer aliado en morir en cada batalla sobrevive con 1 de vida en su lugar.',
    flavor: 'Abollado y rayado por la metralla, sigue aguantando los golpes.',
    iconFrame: 10,
    hooks: ['first-death-survives'],
  },
  {
    id: 'forbidden-field-manual', name: 'Manual del Conscripto', rarity: 'epic',
    description: 'Las pantallas de recompensa ofrecen +1 opción, pero la partida comienza con una mutación extra.',
    iconFrame: 11,
    hooks: ['extra-reward-option', 'extra-mutation-start'],
  },
  {
    id: 'trench-whistle', name: 'Silbato del Sargento', rarity: 'common',
    description: 'Los tiempos de recarga de despliegue son 20% más cortos.',
    iconFrame: 12,
    modifiers: [{ stat: 'deployCooldown', op: 'mul', value: 0.8, filter: { side: 'ally' } }],
  },
  {
    id: 'iron-rations', name: 'Guiso de Lentejas', rarity: 'common',
    description: 'Todas las unidades aliadas ganan +15% de vida máxima.',
    iconFrame: 13,
    modifiers: [{ stat: 'maxHp', op: 'mul', value: 1.15, filter: { side: 'ally' } }],
  },
  {
    id: 'gas-mask-crate', name: 'Pañuelos de Combate', rarity: 'common',
    description: 'Los efectos perjudiciales ocultistas duran 50% menos en tus unidades.',
    iconFrame: 14,
    hooks: ['occult-resist'],
  },
  {
    id: 'lucky-zippo', name: 'Encendedor de Trinchera', rarity: 'common',
    description: 'Los efectos de quemadura duran el doble; los Parrilleros ganan +15 de alcance.',
    iconFrame: 15,
    modifiers: [{ stat: 'range', op: 'add', value: 15, filter: { unitIds: ['flamethrower'] } }],
    hooks: ['ground-fire'],
  },
  {
    id: 'field-radio', name: 'Cajón de Suministros', rarity: 'rare',
    description: 'Cada batalla comienza con un envío de suministros gratuito.',
    iconFrame: 16,
    hooks: ['supply-drop-start'],
  },
  {
    id: 'dog-tag-ledger', name: 'Libreta de Enrolamiento', rarity: 'rare',
    description: 'Gana 10 suministros cada vez que una unidad aliada muere.',
    flavor: 'El registro de los caídos. Sus pertenencias regresan al frente.',
    iconFrame: 17,
    hooks: ['salvage-on-death'],
  },
  {
    id: 'chaplains-cross', name: 'Cruz de Campaña', rarity: 'rare',
    description: 'Las pérdidas de moral se reducen a la mitad y las batallas comienzan con +10 de moral.',
    iconFrame: 18,
    modifiers: [
      { stat: 'moraleLossMult', op: 'mul', value: 0.5 },
      { stat: 'moraleStart', op: 'add', value: 10 },
    ],
  },
  {
    id: 'reapers-ledger', name: 'Cuaderno de Fiambrera', rarity: 'epic',
    description: 'Cada 12 bajas enemigas, tu próximo despliegue de unidad es gratis.',
    iconFrame: 19,
    hooks: ['free-deploy-per-12-kills'],
  },
];

export const RELIC_INDEX: Record<string, RelicDef> = Object.fromEntries(
  RELICS.map((r) => [r.id, r]),
);
