/**
 * common.ts — Tipos compartidos, agnósticos del motor.
 * REGLA: ningún archivo de /types ni /data importa Phaser. Son contratos puros.
 */

export type Rarity = 'common' | 'rare' | 'epic';

export type Side = 'ally' | 'enemy';

/** Stats modificables por upgrades, reliquias, auras, mutaciones y pasivas. */
export type StatKey =
  // Combate de entidad
  | 'maxHp'
  | 'damage'
  | 'attackInterval' // ms entre ataques (menor = más rápido)
  | 'range'          // px
  | 'moveSpeed'      // px/s
  | 'armor'          // reducción plana de daño por golpe
  | 'healPower'      // hp/s de curación
  | 'healRadius'
  | 'maxTargets'     // objetivos simultáneos (AoE)
  // Despliegue / economía
  | 'cost'
  | 'deployCooldown' // ms
  | 'incomeRate'     // supplies/s
  | 'startingSupplies'
  // Moral
  | 'moraleStart'
  | 'moraleLossMult' // multiplicador de pérdida de moral (1 = normal)
  // Habilidades de comandante
  | 'abilityCooldown'
  | 'abilityCost'
  // Recompensas
  | 'bounty'
  | 'intelGain';

export type ModOp = 'add' | 'mul';

/** A quién aplica un modificador. Sin filtro = aplica a todo lo del lado implícito. */
export interface TargetFilter {
  side?: Side;
  unitIds?: string[];
  enemyIds?: string[];
  roles?: string[]; // UnitRole
  tiers?: string[]; // EnemyTier
  tags?: string[];  // ej. 'infantry', 'occult', 'structure'
}

/** Pieza central del balance data-driven: todo buff/debuff es un Modifier. */
export interface Modifier {
  stat: StatKey;
  op: ModOp;
  value: number;
  filter?: TargetFilter;
  note?: string;
}

/** Arte placeholder para MVP: rectángulo coloreado + letra. */
export interface PlaceholderArt {
  color: number; // 0xRRGGBB
  label: string; // 1-2 caracteres
}

/**
 * REGISTRO DE HOOKS
 * Comportamientos especiales que no se expresan como Modifier plano.
 * Cada hook se implementa una sola vez en el sistema correspondiente y se
 * activa por id desde reliquias, upgrades, mutaciones o pasivas.
 *
 * Hooks definidos en la data inicial (implementar bajo demanda, por fase):
 * - 'low-base-rage'           Base aliada <40% HP => aliados +30% daño. (BattleSystem)
 * - 'morale-floor-once'       1 vez por batalla la moral no baja de 1 y suma +20. (MoraleSystem)
 * - 'serum-infection-risk'    Curaciones potentes con 10% de aplicar -10% maxHp. (BattleSystem)
 * - 'ground-fire'             Ataques de fuego dejan llamas 2s (3 dps). (BattleSystem)
 * - 'first-death-survives'    La primera baja aliada por batalla queda en 1 HP. (BattleSystem)
 * - 'salvage-on-death'        +10 supplies cuando muere una unidad aliada. (EconomySystem)
 * - 'free-deploy-per-12-kills' Cada 12 kills, el próximo despliegue es gratis. (EconomySystem)
 * - 'supply-drop-start'       Supply Drop gratuito al iniciar cada batalla. (BattleSystem)
 * - 'occult-resist'           Debuffs ocultistas duran 50% menos. (BattleSystem)
 * - 'reveal-next-event'       Muestra el próximo evento del mapa. (RunSystem)
 * - 'reveal-next-nodes'       Muestra el tipo de los nodos de la próxima fila. (RunSystem)
 * - 'reveal-elite-comp'       Muestra la composición de nodos élite. (RunSystem)
 * - 'extra-reward-option'     +1 opción en pantallas de recompensa. (RunSystem)
 * - 'extra-mutation-start'    La run comienza con 1 mutación adicional. (RunSystem)
 * - 'incendiary-rounds'       Riflemen y Heavy aplican quemadura 2s. (BattleSystem)
 * - 'ap-rounds'               Disparos ignoran 2 de armor. (BattleSystem)
 * - 'casualty-refund'         25% de las bajas devuelven 50% del coste. (EconomySystem)
 * - 'revive-once-per-battle'  Medics reviven 1 unidad por batalla. (BattleSystem)
 * - 'structure-mine'          Engineer desbloquea minas. (UnitSpawnSystem)
 * - 'structure-turret'        Engineer desbloquea torreta. (UnitSpawnSystem)
 * - 'ability-slot-3'          Tercer slot de habilidad activa. (CommanderSystem)
 * - 'boss-honor-guard'        El boss aparece escoltado por 2 élites. (EnemySpawnSystem)
 * - 'fodder-revive'           Fodder enemigo revive 1 vez (30%). (EnemySpawnSystem)
 * - 'mascot-morale'           +1 moral extra por victoria. (MoraleSystem)
 */
export type HookId = string;
