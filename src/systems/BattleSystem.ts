/**
 * BattleSystem — lógica de combate pura, sin Phaser.
 * Integra WaveSystem y lógica de habilidades/estados (MVP 0.2).
 */
import { FIELD, BASES, ECONOMY, MORALE } from '../utils/constants';
import { UNIT_INDEX } from '../data/units';
import { ENEMY_INDEX } from '../data/enemies';
import { BOSS_INDEX } from '../data/bosses';
import { OPERATION_INDEX } from '../data/operations';
import { WaveSystem } from './WaveSystem';
import type { NodeType, BattleMode, RosterSoldier } from '../types/RunTypes';
import { createSeededRandom } from '../utils/SeededRandom';

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
  aoeRadius?: number;

  // Estados
  slowRemaining?: number;
  burnRemaining?: number;
  burnTickTimer?: number;

  // XCOM Soldier customization
  soldierId?: string;
  nickname?: string;
  level?: number;
  colorTint?: number;
  kills?: number;
}

export type BattleOutcome = 'ongoing' | 'won' | 'lost';

export interface BattleEvent {
  type: 'death' | 'bounty' | 'base-hit' | 'heal';
  faction?: Faction;
  amount?: number;
  defId?: string;
  x?: number;
  y?: number;
  uid?: number;
}

export class BattleSystem {
  combatants: Combatant[] = [];
  allyBaseHp: number;
  allyBaseMaxHp: number;
  enemyBaseHp: number;
  enemyBaseMaxHp: number;
  supplies: number;
  morale: number;
  activeUpgrades: string[] = [];
  outcome: BattleOutcome = 'ongoing';
  waveSys: WaveSystem;
  nodeType: NodeType;
  battleMode: BattleMode;
  bossId: string;
  operationId: string;

  private nextUid = 1;
  private incomeCarry = 0;
  private readonly seededRandom: () => number;
  pendingEvents: BattleEvent[] = [];

  constructor(
    allyBaseHp = BASES.ALLY_HP,
    activeUpgrades: string[] = [],
    nodeType: NodeType = 'battle',
    battleMode: BattleMode = 'assault',
    bossId: string = 'general-eisenfaust',
    operationId: string = 'op-first-light',
    seed: string = 'battle',
  ) {
    this.allyBaseHp = allyBaseHp;
    this.allyBaseMaxHp = allyBaseHp;
    this.nodeType = nodeType;
    this.battleMode = battleMode;
    this.bossId = BOSS_INDEX[bossId] ? bossId : 'general-eisenfaust';
    this.operationId = OPERATION_INDEX[operationId] ? operationId : 'op-first-light';
    this.seededRandom = createSeededRandom(`${seed}:${this.operationId}:${nodeType}:${battleMode}`);
    this.supplies = ECONOMY.STARTING_SUPPLIES;
    this.morale = MORALE.START;
    this.activeUpgrades = activeUpgrades;
    this.waveSys = new WaveSystem(this);

    if (nodeType === 'boss') {
      const bossDef = BOSS_INDEX[this.bossId];
      this.enemyBaseHp = bossDef.stats.maxHp;
      this.enemyBaseMaxHp = bossDef.stats.maxHp;
      // Spawn General Eisenfaust en el carril central (en posición de spawn enemigo)
      this.spawnBoss(this.bossId, FIELD.CENTER_LANE);
    } else {
      this.enemyBaseHp = BASES.ENEMY_BASTION_HP;
      this.enemyBaseMaxHp = BASES.ENEMY_BASTION_HP;
    }
  }

  random(): number {
    return this.seededRandom();
  }

  getWaveEnemyIds(): string[] {
    const operation = OPERATION_INDEX[this.operationId];
    return this.nodeType === 'elite'
      ? [...operation.enemyPool, ...operation.elitePool]
      : operation.enemyPool;
  }

  completeDefense(): void {
    if (this.battleMode === 'defense' && this.outcome === 'ongoing') {
      this.outcome = 'won';
    }
  }

  spawnBoss(bossId: string, lane: number): Combatant | null {
    const def = BOSS_INDEX[bossId];
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
      aoeRadius: def.stats.aoeRadius,
    }, lane);
  }

  canAfford(unitId: string): boolean {
    const def = UNIT_INDEX[unitId];
    return !!def && this.supplies >= def.cost;
  }

  spawnAlly(unitId: string, customLane?: number, soldier?: RosterSoldier): Combatant | null {
    const def = UNIT_INDEX[unitId];
    if (!def || this.supplies < def.cost) return null;
    this.supplies -= def.cost;

    let maxHp = def.stats.maxHp;
    let damage = def.stats.damage;

    if (soldier) {
      const lv = soldier.level || 1;
      const hpMult = 1 + (lv - 1) * 0.15;
      const dmgMult = 1 + (lv - 1) * 0.10;
      maxHp = Math.round(maxHp * hpMult);
      damage = Math.round(damage * dmgMult);
    }

    if (unitId === 'rifleman' && this.activeUpgrades.includes('barracks-1')) {
      maxHp = Math.round(maxHp * 1.2);
    }

    if (this.activeUpgrades.includes('armory-1')) {
      damage = Math.round(damage * 1.1);
    }

    let healPower = (def.stats as any).healPower;
    if (healPower && this.activeUpgrades.includes('med-tent-1')) {
      healPower = Math.round(healPower * 1.3);
    }

    const combatantColor = soldier && soldier.colorTint !== 0xffffff ? soldier.colorTint : def.placeholder.color;

    const c = this.addCombatant(def.id, 'ally', FIELD.SPAWN_ALLY_X, {
      maxHp,
      damage,
      attackInterval: def.stats.attackInterval,
      range: def.stats.range,
      moveSpeed: def.stats.moveSpeed,
      armor: def.stats.armor,
      color: combatantColor,
      label: def.placeholder.label,
      tags: def.tags || [],
      traits: def.traits ? def.traits.map(t => t.id) : [],
      healPower,
      healRadius: (def.stats as any).healRadius,
      maxTargets: (def.stats as any).maxTargets,
    }, customLane);

    if (c && soldier) {
      c.soldierId = soldier.id;
      c.nickname = soldier.nickname;
      c.level = soldier.level;
      c.colorTint = soldier.colorTint;
      c.kills = 0;
    }

    // Habilidad barricada del Engineer
    if (c && c.traits.includes('build-barricade')) {
      let barHp = 180;
      if (this.activeUpgrades.includes('engineering-bay-1')) {
        barHp = Math.round(barHp * 1.5);
      }
      this.addCombatant('barricade', 'ally', FIELD.SPAWN_ALLY_X + 50, {
        maxHp: barHp, // Vida de la barricada
        damage: 0,
        attackInterval: 999999,
        range: 0,
        moveSpeed: 0,
        armor: 2,
        color: 0x8a6f3c,
        label: 'B',
        tags: ['structure', 'mechanical'],
        traits: [],
      }, c.lane);
    }

    return c;
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
    customLane?: number,
  ): Combatant {
    const lane = customLane !== undefined ? customLane : this.leastBusyLane(faction);
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

    // Actualizar Oleadas o Fase de Jefe
    if (this.nodeType === 'boss') {
      this.updateBossPhases(dtMs);
    } else {
      this.waveSys.update(dtMs);
    }
    if (this.outcome !== 'ongoing') return;

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
           if (c.defId === this.bossId) {
             this.enemyBaseHp = Math.max(0, c.hp);
           }
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
            // AoE (Flamethrower / Boss ground slam)
            if ((c.traits.includes('burn') && c.maxTargets && c.maxTargets > 1) || c.aoeRadius) {
              this.dealAoEDamage(c, target);
              if (c.aoeRadius) {
                // Ground slam shake
                this.pendingEvents.push({ type: 'base-hit', faction: 'ally', amount: 0 });
              }
            }
            c.attackCooldown = c.attackInterval;
          }
        } else {
          this.advance(c, dt);
        }
      } else {
        if (this.atEnemyBase(c)) {
          if (c.attackCooldown <= 0) {
            this.hitBase(c);
            c.attackCooldown = c.attackInterval;
          }
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
    const speed = this.getModifiedMoveSpeed(c);
    let newX = c.x + dir * speed * dt;

    // Frontline: no rebasar al compañero de adelante en el mismo carril.
    // Las unidades se forman en línea y empujan el frente (sensación Warfare 1917).
    const sep = FIELD.UNIT_SEPARATION;
    for (const o of this.combatants) {
      if (o.uid === c.uid || !o.alive || o.faction !== c.faction || o.lane !== c.lane) continue;
      if (dir > 0 && o.x > c.x) newX = Math.min(newX, o.x - sep);
      else if (dir < 0 && o.x < c.x) newX = Math.max(newX, o.x + sep);
    }
    c.x = newX;
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

  private detonate(c: Combatant): void {
    if ((c as any).detonated) return;
    (c as any).detonated = true;
    c.hp = 0;
    c.alive = false;

    this.pendingEvents.push({
      type: 'death',
      faction: c.faction,
      defId: c.defId,
      x: c.x,
      y: FIELD.LANES_Y[c.lane]
    });

    const radius = 70;
    const damage = 45;
    const baseDamage = 20;

    // Dañar aliados en rango
    for (const o of this.combatants) {
      if (o.alive && o.faction === 'ally') {
        const dist = Math.abs(o.x - c.x);
        if (dist <= radius && Math.abs(o.lane - c.lane) <= 1) {
          o.hp -= damage;
          if (o.hp <= 0) this.kill(o, 'enemy');
        }
      }
    }

    // Dañar base si está cerca
    if (c.x <= FIELD.ALLY_BASE_X + radius) {
      this.allyBaseHp = Math.max(0, this.allyBaseHp - baseDamage);
      this.pendingEvents.push({ type: 'base-hit', faction: 'ally', amount: baseDamage });
      
      const loss = (baseDamage / 10) * MORALE.BASE_HIT_PER_10_DMG;
      this.morale = Math.max(0, this.morale - loss);
    }
  }

  getModifiedDamage(attacker: Combatant): number {
    let dmg = attacker.damage;
    if (attacker.faction === 'enemy') {
      // Check for Officer aura (+25% damage)
      const hasOfficerAura = this.combatants.some(o => 
        o.alive && o.faction === 'enemy' && o.defId === 'dead-officer' && o.uid !== attacker.uid && 
        Math.abs(o.x - attacker.x) <= 140 && Math.abs(o.lane - attacker.lane) <= 1
      );
      if (hasOfficerAura) {
        dmg = Math.round(dmg * 1.25);
      }
      // Check for Boss Phase 2 aura (+20% damage)
      const hasBossAura = this.combatants.some(o => {
        if (!o.alive || o.faction !== 'enemy' || o.defId !== 'general-eisenfaust' || o.uid === attacker.uid) return false;
        const hpPct = o.hp / o.maxHp;
        const inPhase2 = hpPct <= 0.70 && hpPct > 0.35;
        if (!inPhase2) return false;
        return Math.abs(o.x - attacker.x) <= 140 && Math.abs(o.lane - attacker.lane) <= 1;
      });
      if (hasBossAura) {
        dmg = Math.round(dmg * 1.20);
      }
    }
    return dmg;
  }

  getModifiedMoveSpeed(c: Combatant): number {
    let speed = (c.slowRemaining && c.slowRemaining > 0) ? c.moveSpeed * 0.85 : c.moveSpeed;
    if (c.faction === 'enemy') {
      const hasOfficerAura = this.combatants.some(o => 
        o.alive && o.faction === 'enemy' && o.defId === 'dead-officer' && o.uid !== c.uid && 
        Math.abs(o.x - c.x) <= 140 && Math.abs(o.lane - c.lane) <= 1
      );
      if (hasOfficerAura) {
        speed = speed * 1.15;
      }
    }
    return speed;
  }

  private dealDamage(attacker: Combatant, target: Combatant): void {
    if (attacker.defId === 'exploder') {
      this.detonate(attacker);
      return;
    }

    const baseDmg = this.getModifiedDamage(attacker);
    const dmg = Math.max(1, baseDmg - target.armor);
    target.hp -= dmg;
    
    if (target.defId === this.bossId) {
      this.enemyBaseHp = Math.max(0, target.hp);
    }

    // Suppression Slow
    if (attacker.traits.includes('suppress')) {
      target.slowRemaining = 2000;
    }
    // Incendiary Burn
    if (attacker.traits.includes('burn')) {
      target.burnRemaining = 2000;
      target.burnTickTimer = 1000;
    }

    if (target.hp <= 0) this.kill(target, attacker);
  }

  private dealAoEDamage(attacker: Combatant, primaryTarget: Combatant): void {
    if (attacker.aoeRadius) {
      const radius = attacker.aoeRadius;
      for (const o of this.combatants) {
        if (!o.alive || o.faction === attacker.faction || o.uid === primaryTarget.uid) continue;
        if (Math.abs(o.lane - primaryTarget.lane) > 1) continue;
        
        const dist = Math.abs(o.x - primaryTarget.x);
        if (dist <= radius) {
          const baseDmg = this.getModifiedDamage(attacker);
          const dmg = Math.max(1, baseDmg - o.armor);
          o.hp -= dmg;
          if (o.hp <= 0) this.kill(o, attacker);
        }
      }
      return;
    }

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

  private kill(c: Combatant, killer: Combatant | Faction): void {
    if (!c.alive) return;

    if (c.defId === 'exploder') {
      this.detonate(c);
      return;
    }

    c.alive = false;
    if (c.defId === this.bossId) {
      this.enemyBaseHp = 0;
    }

    this.pendingEvents.push({
      type: 'death',
      faction: c.faction,
      defId: c.defId,
      x: c.x,
      y: FIELD.LANES_Y[c.lane],
      uid: c.uid
    });

    let killerFaction: Faction;
    let attackerCombatant: Combatant | null = null;
    if (typeof killer === 'string') {
      killerFaction = killer;
    } else {
      killerFaction = killer.faction;
      attackerCombatant = killer;
    }

    if (c.faction === 'enemy' && killerFaction === 'ally') {
      const def = ENEMY_INDEX[c.defId];
      const bounty = def?.bounty ?? 0;
      this.supplies += bounty;
      this.pendingEvents.push({ type: 'bounty', amount: bounty, defId: c.defId });

      // Track kill on the attacker combatant if it is an ally
      if (attackerCombatant && attackerCombatant.faction === 'ally') {
        if (attackerCombatant.kills === undefined) {
          attackerCombatant.kills = 0;
        }
        attackerCombatant.kills++;
      }

      // Aumento de moral por muerte enemiga
      const isElite = c.tags.includes('elite') || c.tags.includes('officer');
      const moraleGain = isElite ? MORALE.PER_ELITE_KILL : MORALE.PER_KILL;
      this.morale = Math.min(MORALE.MAX, this.morale + moraleGain);
    } else if (c.faction === 'ally') {
      // Disminución de moral por muerte aliada (las barricadas no cuentan)
      if (c.defId !== 'barricade') {
        const def = UNIT_INDEX[c.defId];
        const cost = def?.cost ?? 0;
        const loss = MORALE.UNIT_DEATH_BASE + Math.floor(cost / 25);
        this.morale = Math.max(0, this.morale - loss);
      }
    }
  }

  private hitBase(c: Combatant): void {
    if (c.defId === 'exploder') {
      this.detonate(c);
      return;
    }

    if (c.faction === 'ally') {
      this.enemyBaseHp -= c.damage;
      this.pendingEvents.push({ type: 'base-hit', faction: 'enemy', amount: c.damage });
      if (this.enemyBaseHp <= 0) this.enemyBaseHp = 0;
    } else {
      this.allyBaseHp -= c.damage;
      this.pendingEvents.push({ type: 'base-hit', faction: 'ally', amount: c.damage });
      if (this.allyBaseHp <= 0) this.allyBaseHp = 0;
      // Disminución de moral por golpe a la base
      const loss = (c.damage / 10) * MORALE.BASE_HIT_PER_10_DMG;
      this.morale = Math.max(0, this.morale - loss);
    }
  }

  private checkOutcome(): void {
    if (this.allyBaseHp <= 0 || this.morale <= 0) {
      this.outcome = 'lost';
      return;
    }
    if (this.battleMode === 'assault' && this.enemyBaseHp <= 0) {
      this.outcome = 'won';
    }
  }

  castAirstrike(x: number): void {
    for (const c of this.combatants) {
      if (c.alive && c.faction === 'enemy') {
        const dist = Math.abs(c.x - x);
        if (dist <= 140) {
          c.hp -= 80;
          if (c.defId === this.bossId) {
            this.enemyBaseHp = Math.max(0, c.hp);
          }
          if (c.hp <= 0) this.kill(c, 'ally');
        }
      }
    }
    this.pendingEvents.push({ type: 'base-hit', faction: 'enemy', amount: 0 }); // Shake
  }

  castMedkit(x: number): void {
    for (const c of this.combatants) {
      if (c.alive && c.faction === 'ally' && c.defId !== 'barricade') {
        const dist = Math.abs(c.x - x);
        if (dist <= 120) {
          c.hp = Math.min(c.maxHp, c.hp + 40);
          this.pendingEvents.push({ type: 'heal', faction: 'ally', amount: 40 });
        }
      }
    }
  }

  get allyCount(): number {
    return this.combatants.filter((c) => c.alive && c.faction === 'ally').length;
  }

  get enemyCount(): number {
    return this.combatants.filter((c) => c.alive && c.faction === 'enemy').length;
  }

  updateBossPhases(dtMs: number): void {
    if (this.bossId !== 'general-eisenfaust') return;
    const boss = this.combatants.find(c => c.alive && c.defId === 'general-eisenfaust');
    if (!boss) return;

    const hpPct = boss.hp / boss.maxHp;
    let newPhase = 0; // Phase 1
    if (hpPct <= 0.35) {
      newPhase = 2; // Phase 3
    } else if (hpPct <= 0.70) {
      newPhase = 1; // Phase 2
    }

    if ((this as any).currentBossPhase === undefined) {
      (this as any).currentBossPhase = 0;
    }

    const prevPhase = (this as any).currentBossPhase;
    if (newPhase !== prevPhase) {
      (this as any).currentBossPhase = newPhase;
      // Trigger a phase transition event
      this.pendingEvents.push({
        type: 'base-hit',
        faction: 'enemy',
        amount: 999 // Special amount code for phase transition
      });

      // Apply statOverrides
      if (newPhase === 2) {
        boss.moveSpeed = 16; // Speed up 30%
      }
    }

    // Update Boss Abilities Cooldown
    if ((boss as any).bossAbilityCooldown === undefined) {
      (boss as any).bossAbilityCooldown = 4000; // Start with 4s cooldown
    }

    (boss as any).bossAbilityCooldown -= dtMs;
    if ((boss as any).bossAbilityCooldown <= 0) {
      // Cast boss summon ability!
      if (newPhase === 0 || newPhase === 1) {
        // Summons 3 Revenant Grunts
        for (let i = 0; i < 3; i++) {
          this.spawnEnemy('revenant-grunt');
        }
        (boss as any).bossAbilityCooldown = 8000; // 8s cooldown
      } else if (newPhase === 2) {
        // Summons 2 Runner Corpses
        for (let i = 0; i < 2; i++) {
          this.spawnEnemy('runner-corpse');
        }
        (boss as any).bossAbilityCooldown = 5000; // 5s cooldown
      }
      // Trigger a summon visual event
      this.pendingEvents.push({
        type: 'heal',
        faction: 'enemy',
        amount: 888 // Special amount code for boss summon
      });
    }
  }
}
