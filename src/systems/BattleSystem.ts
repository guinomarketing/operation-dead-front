/**
 * BattleSystem — lógica de combate pura, sin Phaser.
 * La escena crea sprites y lee este estado cada frame para dibujar.
 * Coordenadas: x crece hacia la derecha. Aliados van hacia ENEMY_BASE_X,
 * enemigos hacia ALLY_BASE_X.
 */
import { FIELD, BASES, ECONOMY } from '../utils/constants';
import { UNIT_INDEX } from '../data/units';
import { ENEMY_INDEX } from '../data/enemies';

export type Faction = 'ally' | 'enemy';

export interface Combatant {
  uid: number;
  defId: string;
  faction: Faction;
  x: number;
  lane: number;
  hp: number;
  maxHp: number;
  damage: number;
  attackInterval: number;
  range: number;
  moveSpeed: number;
  armor: number;
  attackCooldown: number; // ms restantes para el próximo ataque
  alive: boolean;
  color: number;
  label: string;
}

export type BattleOutcome = 'ongoing' | 'won' | 'lost';

export interface BattleEvent {
  type: 'death' | 'bounty' | 'base-hit';
  faction?: Faction;
  amount?: number;
  defId?: string;
}

export class BattleSystem {
  combatants: Combatant[] = [];
  allyBaseHp: number;
  allyBaseMaxHp: number;
  enemyBaseHp: number;
  enemyBaseMaxHp: number;
  supplies: number;
  outcome: BattleOutcome = 'ongoing';

  private nextUid = 1;
  private incomeCarry = 0;
  /** Eventos producidos en el último update, para que la escena reaccione (FX, contadores). */
  pendingEvents: BattleEvent[] = [];

  constructor(allyBaseHp = BASES.ALLY_HP) {
    this.allyBaseHp = allyBaseHp;
    this.allyBaseMaxHp = allyBaseHp;
    this.enemyBaseHp = BASES.ENEMY_BASTION_HP;
    this.enemyBaseMaxHp = BASES.ENEMY_BASTION_HP;
    this.supplies = ECONOMY.STARTING_SUPPLIES;
  }

  /** ¿Puede pagarse y desplegarse esta unidad ahora? (cooldown lo maneja la escena/HUD) */
  canAfford(unitId: string): boolean {
    const def = UNIT_INDEX[unitId];
    return !!def && this.supplies >= def.cost;
  }

  spawnAlly(unitId: string): Combatant | null {
    const def = UNIT_INDEX[unitId];
    if (!def || this.supplies < def.cost) return null;
    this.supplies -= def.cost;
    return this.addCombatant(def.id, 'ally', FIELD.SPAWN_ALLY_X, {
      maxHp: def.stats.maxHp,
      damage: def.stats.damage,
      attackInterval: def.stats.attackInterval,
      range: def.stats.range,
      moveSpeed: def.stats.moveSpeed,
      armor: def.stats.armor,
      color: def.placeholder.color,
      label: def.placeholder.label,
    });
  }

  spawnEnemy(enemyId: string): Combatant | null {
    const def = ENEMY_INDEX[enemyId];
    if (!def) return null;
    return this.addCombatant(def.id, 'enemy', FIELD.SPAWN_ENEMY_X, {
      maxHp: def.stats.maxHp,
      damage: def.stats.damage,
      attackInterval: def.stats.attackInterval,
      range: def.stats.range,
      moveSpeed: def.stats.moveSpeed,
      armor: def.stats.armor,
      color: def.placeholder.color,
      label: def.placeholder.label,
    });
  }

  private addCombatant(
    defId: string,
    faction: Faction,
    x: number,
    s: Omit<Combatant, 'uid' | 'defId' | 'faction' | 'x' | 'lane' | 'hp' | 'attackCooldown' | 'alive'>,
  ): Combatant {
    // Reparte en el carril menos poblado para legibilidad.
    const lane = this.leastBusyLane(faction);
    const c: Combatant = {
      uid: this.nextUid++,
      defId,
      faction,
      x,
      lane,
      hp: s.maxHp,
      attackCooldown: 0,
      alive: true,
      ...s,
    };
    this.combatants.push(c);
    return c;
  }

  private leastBusyLane(faction: Faction): number {
    const counts = FIELD.LANES_Y.map(
      (_, i) => this.combatants.filter((c) => c.alive && c.faction === faction && c.lane === i).length,
    );
    let min = 0;
    for (let i = 1; i < counts.length; i++) if (counts[i] < counts[min]) min = i;
    return min;
  }

  /** Avanza la simulación dtMs milisegundos. */
  update(dtMs: number): void {
    if (this.outcome !== 'ongoing') return;
    this.pendingEvents = [];
    const dt = dtMs / 1000;

    // Economía
    this.incomeCarry += ECONOMY.INCOME_PER_SECOND * dt;
    if (this.incomeCarry >= 1) {
      const gained = Math.floor(this.incomeCarry);
      this.supplies += gained;
      this.incomeCarry -= gained;
    }

    for (const c of this.combatants) {
      if (!c.alive) continue;
      if (c.attackCooldown > 0) c.attackCooldown -= dtMs;

      const target = this.findTarget(c);

      if (target) {
        const dist = Math.abs(target.x - c.x);
        if (dist <= c.range) {
          // En rango: atacar si el cooldown lo permite.
          if (c.attackCooldown <= 0) {
            this.dealDamage(c, target);
            c.attackCooldown = c.attackInterval;
          }
        } else {
          this.advance(c, dt);
        }
      } else {
        // Sin objetivo: avanzar hacia la base enemiga / atacarla.
        if (this.atEnemyBase(c)) {
          this.hitBase(c);
          c.attackCooldown = c.attackInterval;
        } else {
          this.advance(c, dt);
        }
      }
    }

    // Limpiar muertos del array (la escena ya recibió los eventos 'death').
    this.combatants = this.combatants.filter((c) => c.alive);

    this.checkOutcome();
  }

  private advance(c: Combatant, dt: number): void {
    const dir = c.faction === 'ally' ? 1 : -1;
    c.x += dir * c.moveSpeed * dt;
  }

  private atEnemyBase(c: Combatant): boolean {
    if (c.faction === 'ally') return c.x >= FIELD.ENEMY_BASE_X - 10;
    return c.x <= FIELD.ALLY_BASE_X + 10;
  }

  /** Objetivo enemigo más cercano en el mismo carril (o adyacente) y por delante. */
  private findTarget(c: Combatant): Combatant | null {
    let best: Combatant | null = null;
    let bestDist = Infinity;
    for (const o of this.combatants) {
      if (!o.alive || o.faction === c.faction) continue;
      if (Math.abs(o.lane - c.lane) > 1) continue;
      const dist = Math.abs(o.x - c.x);
      // Solo objetivos dentro de un alcance de detección razonable (range + margen de avance).
      if (dist <= c.range + 40 && dist < bestDist) {
        bestDist = dist;
        best = o;
      }
    }
    return best;
  }

  private dealDamage(attacker: Combatant, target: Combatant): void {
    const dmg = Math.max(1, attacker.damage - target.armor);
    target.hp -= dmg;
    if (target.hp <= 0) this.kill(target, attacker.faction);
  }

  private kill(c: Combatant, killerFaction: Faction): void {
    if (!c.alive) return;
    c.alive = false;
    this.pendingEvents.push({ type: 'death', faction: c.faction, defId: c.defId });
    // Recompensa: el aliado cobra bounty al matar enemigos.
    if (c.faction === 'enemy' && killerFaction === 'ally') {
      const def = ENEMY_INDEX[c.defId];
      const bounty = def?.bounty ?? 0;
      this.supplies += bounty;
      this.pendingEvents.push({ type: 'bounty', amount: bounty, defId: c.defId });
    }
  }

  private hitBase(c: Combatant): void {
    if (c.faction === 'ally') {
      this.enemyBaseHp -= c.damage;
      this.pendingEvents.push({ type: 'base-hit', faction: 'enemy', amount: c.damage });
      if (this.enemyBaseHp <= 0) this.enemyBaseHp = 0;
    } else {
      this.allyBaseHp -= c.damage;
      this.pendingEvents.push({ type: 'base-hit', faction: 'ally', amount: c.damage });
      if (this.allyBaseHp <= 0) this.allyBaseHp = 0;
    }
  }

  private checkOutcome(): void {
    if (this.enemyBaseHp <= 0) this.outcome = 'won';
    else if (this.allyBaseHp <= 0) this.outcome = 'lost';
  }

  get allyCount(): number {
    return this.combatants.filter((c) => c.alive && c.faction === 'ally').length;
  }

  get enemyCount(): number {
    return this.combatants.filter((c) => c.alive && c.faction === 'enemy').length;
  }
}
