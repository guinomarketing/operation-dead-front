/**
 * BattleSystem — lógica de combate pura, sin Phaser.
 * Integra WaveSystem y lógica de habilidades/estados (MVP 0.2).
 */
import { FIELD, BASES, ECONOMY } from '../utils/constants';
import { UNIT_INDEX } from '../data/units';
import { ENEMY_INDEX } from '../data/enemies';
import { WaveSystem } from './WaveSystem';

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

  // Habilidades y tags
  tags: string[];
  traits: string[];
  healPower?: number;
  healRadius?: number;
  maxTargets?: number;

  // Estados
  slowRemaining?: number;
  burnRemaining?: number;
  burnTickTimer?: number;
}

export type BattleOutcome = 'ongoing' | 'won' | 'lost';

export interface BattleEvent {
  type: 'death' | 'bounty' | 'base-hit' | 'heal';
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
  waveSys: WaveSystem;

  private nextUid = 1;
  private incomeCarry = 0;
  pendingEvents: BattleEvent[] = [];

  constructor(allyBaseHp = BASES.ALLY_HP) {
    this.allyBaseHp = allyBaseHp;
    this.allyBaseMaxHp = allyBaseHp;
    this.enemyBaseHp = BASES.ENEMY_BASTION_HP;
    this.enemyBaseMaxHp = BASES.ENEMY_BASTION_HP;
    this.supplies = ECONOMY.STARTING_SUPPLIES;
    this.waveSys = new WaveSystem(this);
  }

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
      tags: def.tags || [],
      traits: def.traits ? def.traits.map(t => t.id) : [],
      healPower: (def.stats as any).healPower,
      healRadius: (def.stats as any).healRadius,
      maxTargets: (def.stats as any).maxTargets,
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
      tags: def.tags || [],
      traits: [],
    });
  }

  private addCombatant(
    defId: string,
    faction: Faction,
    x: number,
    s: Omit<Combatant, 'uid' | 'defId' | 'faction' | 'x' | 'lane' | 'hp' | 'attackCooldown' | 'alive'>,
  ): Combatant {
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

  update(dtMs: number): void {
    if (this.outcome !== 'ongoing') return;
    this.pendingEvents = [];
    const dt = dtMs / 1000;

    // Actualizar Oleadas
    this.waveSys.update(dtMs);

    // Economía
    this.incomeCarry += ECONOMY.INCOME_PER_SECOND * dt;
    if (this.incomeCarry >= 1) {
      const gained = Math.floor(this.incomeCarry);
      this.supplies += gained;
      this.incomeCarry -= gained;
    }

    for (const c of this.combatants) {
      if (!c.alive) continue;
      
      // Status Effects
      if (c.slowRemaining && c.slowRemaining > 0) c.slowRemaining -= dtMs;
      if (c.burnRemaining && c.burnRemaining > 0) {
        c.burnRemaining -= dtMs;
        if (c.burnTickTimer !== undefined) c.burnTickTimer -= dtMs;
        if (c.burnTickTimer !== undefined && c.burnTickTimer <= 0) {
           c.hp -= 3; // Burn damage
           if (c.hp <= 0) this.kill(c, c.faction === 'ally' ? 'enemy' : 'ally');
           c.burnTickTimer = 1000;
        }
      }
      if (!c.alive) continue; // Died to burn

      if (c.attackCooldown > 0) c.attackCooldown -= dtMs;

      // Support: Medic Healing
      if (c.traits.includes('field-medic')) {
        const healTarget = this.findHealTarget(c);
        if (healTarget) {
          if (c.attackCooldown <= 0) {
            const amount = c.healPower || 8;
            healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + amount);
            c.attackCooldown = c.attackInterval;
            this.pendingEvents.push({ type: 'heal', faction: c.faction, amount });
          }
          continue; // Medic stays to heal
        }
      }

      // Normal Combat Logic
      const target = this.findTarget(c);

      if (target) {
        const dist = Math.abs(target.x - c.x);
        if (dist <= c.range) {
          if (c.attackCooldown <= 0) {
            this.dealDamage(c, target);
            // AoE (Flamethrower)
            if (c.traits.includes('burn') && c.maxTargets && c.maxTargets > 1) {
              this.dealAoEDamage(c, target);
            }
            c.attackCooldown = c.attackInterval;
          }
        } else {
          this.advance(c, dt);
        }
      } else {
        if (this.atEnemyBase(c)) {
          this.hitBase(c);
          c.attackCooldown = c.attackInterval;
        } else {
          this.advance(c, dt);
        }
      }
    }

    this.combatants = this.combatants.filter((c) => c.alive);
    this.checkOutcome();
  }

  private advance(c: Combatant, dt: number): void {
    const dir = c.faction === 'ally' ? 1 : -1;
    const speed = (c.slowRemaining && c.slowRemaining > 0) ? c.moveSpeed * 0.85 : c.moveSpeed;
    c.x += dir * speed * dt;
  }

  private atEnemyBase(c: Combatant): boolean {
    if (c.faction === 'ally') return c.x >= FIELD.ENEMY_BASE_X - 10;
    return c.x <= FIELD.ALLY_BASE_X + 10;
  }

  private findTarget(c: Combatant): Combatant | null {
    let best: Combatant | null = null;
    let bestDist = Infinity;
    
    let priorityTarget = false;
    const isSniper = c.traits.includes('priority-elite');

    for (const o of this.combatants) {
      if (!o.alive || o.faction === c.faction) continue;
      if (Math.abs(o.lane - c.lane) > 1) continue; // Same or adjacent lane
      const dist = Math.abs(o.x - c.x);
      
      if (dist <= c.range + 40) {
        if (isSniper && o.tags.includes('elite')) {
          if (!priorityTarget || dist < bestDist) {
            bestDist = dist;
            best = o;
            priorityTarget = true;
          }
        } else if (!priorityTarget && dist < bestDist) {
          bestDist = dist;
          best = o;
        }
      }
    }
    return best;
  }

  private findHealTarget(c: Combatant): Combatant | null {
    let best: Combatant | null = null;
    let lowestHp = Infinity;
    const healRadius = c.healRadius || 90;
    
    for (const o of this.combatants) {
      if (!o.alive || o.faction !== c.faction || o.uid === c.uid) continue;
      if (Math.abs(o.lane - c.lane) > 1) continue;
      const dist = Math.abs(o.x - c.x);
      
      if (dist <= healRadius && o.hp < o.maxHp) {
        if (o.hp < lowestHp) {
          lowestHp = o.hp;
          best = o;
        }
      }
    }
    return best;
  }

  private dealDamage(attacker: Combatant, target: Combatant): void {
    const dmg = Math.max(1, attacker.damage - target.armor);
    target.hp -= dmg;
    
    // Suppression Slow
    if (attacker.traits.includes('suppress')) {
      target.slowRemaining = 2000;
    }
    // Incendiary Burn
    if (attacker.traits.includes('burn')) {
      target.burnRemaining = 2000;
      target.burnTickTimer = 1000;
    }

    if (target.hp <= 0) this.kill(target, attacker.faction);
  }

  private dealAoEDamage(attacker: Combatant, primaryTarget: Combatant): void {
    let hitCount = 1;
    const maxHits = attacker.maxTargets || 1;
    for (const o of this.combatants) {
      if (hitCount >= maxHits) break;
      if (!o.alive || o.faction === attacker.faction || o.uid === primaryTarget.uid) continue;
      if (Math.abs(o.lane - primaryTarget.lane) > 1) continue;
      
      const dist = Math.abs(o.x - primaryTarget.x);
      if (dist <= 40) { // AoE radius
        this.dealDamage(attacker, o);
        hitCount++;
      }
    }
  }

  private kill(c: Combatant, killerFaction: Faction): void {
    if (!c.alive) return;
    c.alive = false;
    this.pendingEvents.push({ type: 'death', faction: c.faction, defId: c.defId });
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
