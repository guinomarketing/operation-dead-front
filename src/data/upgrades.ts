import type { BuildingDef, UpgradeDef } from '../types/UpgradeTypes';

export const BUILDINGS: BuildingDef[] = [
  { id: 'barracks', name: 'Logística de Tropa', description: 'Entrenamiento de infantería y suministros.' },
  { id: 'armory', name: 'Taller de Armas', description: 'Armas, tipos de munición y potencia de fuego.' },
  { id: 'med-tent', name: 'Puesto Sanitario', description: 'Medicina de campaña y cuidado de bajas.' },
  { id: 'engineering-bay', name: 'Taller de Chatarra', description: 'Estructuras y defensas de trinchera.' },
  { id: 'intel-room', name: 'Puesto de Baquianos', description: 'Reconocimiento táctico y mapas de la zona.' },
  { id: 'war-room', name: 'Mando Central', description: 'Habilidades del comandante y doctrinas.' },
];

/** Upgrades de run, 3 tiers encadenados por edificio. */
export const UPGRADES: UpgradeDef[] = [
  // --- Barracks ---
  {
    id: 'barracks-1', buildingId: 'barracks', tier: 1,
    name: 'Reclutas Curtidos',
    description: 'Los Conscriptos ganan +20% de HP máximo.',
    modifiers: [{ stat: 'maxHp', op: 'mul', value: 1.2, filter: { unitIds: ['rifleman'] } }],
  },
  {
    id: 'barracks-2', buildingId: 'barracks', tier: 2, requiresUpgradeId: 'barracks-1',
    name: 'Logística Aceitada',
    description: 'La infantería cuesta 15% menos de suministros.',
    modifiers: [{ stat: 'cost', op: 'mul', value: 0.85, filter: { tags: ['infantry'] } }],
  },
  {
    id: 'barracks-3', buildingId: 'barracks', tier: 3, requiresUpgradeId: 'barracks-2',
    name: 'Cuadro de Veteranos',
    description: 'Cada unidad desplegada gana +10% de daño y +10% de HP máximo.',
    modifiers: [
      { stat: 'damage', op: 'mul', value: 1.1, filter: { side: 'ally' } },
      { stat: 'maxHp', op: 'mul', value: 1.1, filter: { side: 'ally' } },
    ],
  },
  // --- Armory ---
  {
    id: 'armory-1', buildingId: 'armory', tier: 1,
    name: 'Munición Fresca',
    description: 'Todas las unidades aliadas causan +10% de daño.',
    modifiers: [{ stat: 'damage', op: 'mul', value: 1.1, filter: { side: 'ally' } }],
  },
  {
    id: 'armory-2', buildingId: 'armory', tier: 2, requiresUpgradeId: 'armory-1',
    name: 'Rondas Incendiarias',
    description: 'Conscriptos y Gendarmes prenden fuego a sus objetivos por 2 segundos.',
    hooks: ['incendiary-rounds'],
  },
  {
    id: 'armory-3', buildingId: 'armory', tier: 3, requiresUpgradeId: 'armory-2',
    name: 'Balas Perforantes',
    description: 'Los disparos aliados ignoran 2 puntos de armadura enemiga.',
    hooks: ['ap-rounds'],
  },
  // --- Med Tent ---
  {
    id: 'med-tent-1', buildingId: 'med-tent', tier: 1,
    name: 'Vendas de Gasa Fuerte',
    description: 'Las curaciones son 30% más efectivas.',
    modifiers: [{ stat: 'healPower', op: 'mul', value: 1.3, filter: { side: 'ally' } }],
  },
  {
    id: 'med-tent-2', buildingId: 'med-tent', tier: 2, requiresUpgradeId: 'med-tent-1',
    name: 'Rescate en Combate',
    description: '25% de las unidades caídas reembolsan la mitad de su costo de despliegue.',
    hooks: ['casualty-refund'],
  },
  {
    id: 'med-tent-3', buildingId: 'med-tent', tier: 3, requiresUpgradeId: 'med-tent-2',
    name: 'Manos Milagrosas',
    description: 'Los Médicos de Guardia pueden revivir a una unidad caída por batalla.',
    hooks: ['revive-once-per-battle'],
  },
  // --- Engineering Bay ---
  {
    id: 'engineering-bay-1', buildingId: 'engineering-bay', tier: 1,
    name: 'Barricadas Reforzadas',
    description: 'Las estructuras de defensa ganan +50% de HP.',
    modifiers: [{ stat: 'maxHp', op: 'mul', value: 1.5, filter: { tags: ['structure'] } }],
  },
  {
    id: 'engineering-bay-2', buildingId: 'engineering-bay', tier: 2, requiresUpgradeId: 'engineering-bay-1',
    name: 'Minas de Contacto',
    description: 'Los Mecánicos de Barrio ahora pueden plantar minas explosivas.',
    hooks: ['structure-mine'],
    unlocks: [{ kind: 'structure', id: 'mine' }],
  },
  {
    id: 'engineering-bay-3', buildingId: 'engineering-bay', tier: 3, requiresUpgradeId: 'engineering-bay-2',
    name: 'Torreta Casera',
    description: 'Los Mecánicos de Barrio ahora pueden construir una torreta ligera.',
    hooks: ['structure-turret'],
    unlocks: [{ kind: 'structure', id: 'turret' }],
  },
  // --- Intel Room ---
  {
    id: 'intel-room-1', buildingId: 'intel-room', tier: 1,
    name: 'Exploradores de Vanguardia',
    description: 'Revela los tipos de nodos del mapa en la siguiente fila.',
    hooks: ['reveal-next-nodes'],
  },
  {
    id: 'intel-room-2', buildingId: 'intel-room', tier: 2, requiresUpgradeId: 'intel-room-1',
    name: 'Dossiers del Cóndor Negro',
    description: 'Revela la composición exacta de los enemigos en los nodos Élite.',
    hooks: ['reveal-elite-comp'],
  },
  {
    id: 'intel-room-3', buildingId: 'intel-room', tier: 3, requiresUpgradeId: 'intel-room-2',
    name: 'Red de Suministros',
    description: 'Los enemigos derrotados otorgan +15% de suministros en batalla.',
    modifiers: [{ stat: 'bounty', op: 'mul', value: 1.15 }],
  },
  // --- War Room ---
  {
    id: 'war-room-1', buildingId: 'war-room', tier: 1,
    name: 'Línea Directa',
    description: 'Las habilidades de comandante recargan 20% más rápido.',
    modifiers: [{ stat: 'abilityCooldown', op: 'mul', value: 0.8 }],
  },
  {
    id: 'war-room-2', buildingId: 'war-room', tier: 2, requiresUpgradeId: 'war-room-1',
    name: 'Requisición Prioritaria',
    description: 'Las habilidades de comandante cuestan 25% menos de suministros en combate.',
    modifiers: [{ stat: 'abilityCost', op: 'mul', value: 0.75 }],
  },
  {
    id: 'war-room-3', buildingId: 'war-room', tier: 3, requiresUpgradeId: 'war-room-2',
    name: 'Doctrina Ampliada',
    description: 'Desbloquea un tercer espacio de habilidad de comandante.',
    hooks: ['ability-slot-3'],
    unlocks: [{ kind: 'ability-slot', id: 'slot-3' }],
  },
];

export const UPGRADE_INDEX: Record<string, UpgradeDef> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u]),
);
