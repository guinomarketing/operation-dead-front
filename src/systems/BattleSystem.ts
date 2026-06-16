/**
 * BattleSystem — lógica de combate pura, sin Phaser.
 * Integra WaveSystem y lógica de habilidades/estados (MVP 0.2).
 */
import { FIELD, BASES, ECONOMY, MORALE } from '../utils/constants';
import { UNIT_INDEX } from '../data/units';
import { ENEMY_INDEX } from '../data/enemies';
import { BOSS_INDEX } from '../data/bosses';
import { OPERATION_INDEX } from '../data/operations';
import { RELIC_INDEX } from '../data/relics';
import { WaveSystem } from './WaveSystem';
import type { NodeType, BattleMode, RosterSoldier } from '../types/RunTypes';
import type { BossPhase, EnemyAbility, EnemyStats } from '../types/EnemyTypes';
import type { Modifier, StatKey, TargetFilter } from '../types/common';
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
  abilityId?: EnemyAbility['id'];
  phaseIndex?: number;
  defId?: string;
  x?: number;
  y?: number;
  uid?: number;
}

interface ModifierSubject {
  faction: Faction;
  defId: string;
  tags: string[];
  role?: string;
  tier?: string;
}

type CombatantDraft = Omit<Combatant, 'uid' | 'defId' | 'faction' | 'x' | 'lane' | 'hp' | 'attackCooldown' | 'alive'>;

export class BattleSystem {
  combatants: Combatant[] = [];
  allyBaseHp: number;
  allyBaseMaxHp: number;
  enemyBaseHp: number;
  enemyBaseMaxHp: number;
  supplies: number;
  morale: number;
  activeUpgrades: string[] = [];
  activeRelics: string[] = [];
  outcome: BattleOutcome = 'ongoing';
  waveSys: WaveSystem;
  nodeType: NodeType;
  battleMode: BattleMode;
  bossId: string;
  operationId: string;

  private nextUid = 1;
  private incomeCarry = 0;
  private readonly seededRandom: () => number;
  private activeModifiers: Modifier[] = [];
  private activeHooks = new Set<string>();
  private moraleFloorUsed = false;
  private firstDeathSurviveUsed = false;
  private enemyKillsForRelics = 0;
  private freeDeployCharges = 0;
  pendingEvents: BattleEvent[] = [];

  constructor(
    allyBaseHp = BASES.ALLY_HP,
    activeUpgrades: string[] = [],
    nodeType: NodeType = 'battle',
    battleMode: BattleMode = 'assault',
    bossId: string = 'general-eisenfaust',
    operationId: string = 'op-first-light',
    seed: string = 'battle',
    activeRelics: string[] = [],
  ) {
    this.allyBaseHp = allyBaseHp;
    this.allyBaseMaxHp = allyBaseHp;
    this.nodeType = nodeType;
    this.battleMode = battleMode;
    this.bossId = BOSS_INDEX[bossId] ? bossId : 'general-eisenfaust';
    this.operationId = OPERATION_INDEX[operationId] ? operationId : 'op-first-light';
    this.seededRandom = createSeededRandom(`${seed}:${this.operationId}:${nodeType}:${battleMode}`);
    this.activeUpgrades = activeUpgrades;
    this.activeRelics = activeRelics.filter((id) => !!RELIC_INDEX[id]);
    this.activeModifiers = this.activeRelics.flatMap((id) => RELIC_INDEX[id].modifiers || []);
    for (const id of this.activeRelics) {
      for (const hook of RELIC_INDEX[id].hooks || []) this.activeHooks.add(hook);
    }
    this.supplies = this.getBattleStartingSupplies();
    this.morale = this.getBattleStartMorale(MORALE.START);
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

  getBattleStartMorale(baseMorale: number): number {
    return Math.max(0, Math.min(MORALE.MAX, Math.round(this.applyModifiers('moraleStart', baseMorale))));
  }

  getUnitCost(unitId: string): number {
    if (this.hasFreeDeployCharge()) return 0;
    return this.getBaseUnitCost(unitId);
  }

  getDeployCooldown(unitId: string): number {
    const def = UNIT_INDEX[unitId];
    if (!def) return 0;
    return Math.max(250, Math.round(this.applyModifiers('deployCooldown', def.deployCooldown, this.subjectForUnit(unitId))));
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
    return !!def && this.supplies >= this.getUnitCost(unitId);
  }

  spawnAlly(unitId: string, customLane?: number, soldier?: RosterSoldier): Combatant | null {
    const def = UNIT_INDEX[unitId];
    const cost = this.getUnitCost(unitId);
    if (!def || this.supplies < cost) return null;
    if (this.hasFreeDeployCharge()) {
      this.freeDeployCharges--;
    } else {
      this.supplies -= cost;
    }

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
    s: CombatantDraft,
    customLane?: number,
  ): Combatant {
    const lane = customLane !== undefined ? customLane : this.leastBusyLane(faction);
    const modified = this.applyCombatantModifiers(defId, faction, s);
    const c: Combatant = {
      uid: this.nextUid++,
      defId,
      faction,
      x,
      lane,
      hp: modified.maxHp,
      attackCooldown: 0,
      alive: true,
      ...modified,
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
    this.incomeCarry += this.getIncomePerSecond() * dt;
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
      this.applyMoraleLoss(loss);
    }
  }

  getModifiedDamage(attacker: Combatant, target?: Combatant): number {
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
    const subject = this.subjectForCombatant(attacker);
    const targetSubject = target ? this.subjectForCombatant(target) : undefined;
    dmg = this.applyModifiers('damage', dmg, subject, targetSubject);

    if (attacker.faction === 'ally' && this.hasHook('low-base-rage') && this.allyBaseHp / this.allyBaseMaxHp <= 0.4) {
      dmg *= 1.3;
    }

    return Math.max(1, Math.round(dmg));
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

    const baseDmg = this.getModifiedDamage(attacker, target);
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
      target.burnRemaining = this.hasHook('ground-fire') ? 4000 : 2000;
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
          const baseDmg = this.getModifiedDamage(attacker, o);
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

    if (this.preventFirstAllyDeath(c)) {
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
      this.enemyKillsForRelics++;
      if (this.hasHook('free-deploy-per-12-kills') && this.enemyKillsForRelics % 12 === 0) {
        this.freeDeployCharges++;
      }

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
        this.applyMoraleLoss(loss);
      }
      if (this.hasHook('salvage-on-death') && c.defId !== 'barricade') {
        this.supplies += 10;
        this.pendingEvents.push({ type: 'bounty', faction: 'ally', amount: 10, defId: c.defId });
      }
    }
  }

  private hitBase(c: Combatant): void {
    if (c.defId === 'exploder') {
      this.detonate(c);
      return;
    }

    if (c.faction === 'ally') {
      if (this.nodeType === 'boss') {
        const boss = this.combatants.find(o => o.alive && o.defId === this.bossId);
        if (boss) {
          const dmg = Math.max(1, this.getModifiedDamage(c, boss) - boss.armor);
          boss.hp -= dmg;
          this.enemyBaseHp = Math.max(0, boss.hp);
          this.pendingEvents.push({ type: 'base-hit', faction: 'enemy', amount: dmg });
          if (boss.hp <= 0) this.kill(boss, c);
          return;
        }
      }

      const dmg = this.getModifiedDamage(c);
      this.enemyBaseHp -= dmg;
      this.pendingEvents.push({ type: 'base-hit', faction: 'enemy', amount: dmg });
      if (this.enemyBaseHp <= 0) this.enemyBaseHp = 0;
    } else {
      this.allyBaseHp -= c.damage;
      this.pendingEvents.push({ type: 'base-hit', faction: 'ally', amount: c.damage });
      if (this.allyBaseHp <= 0) this.allyBaseHp = 0;
      // Disminución de moral por golpe a la base
      const loss = (c.damage / 10) * MORALE.BASE_HIT_PER_10_DMG;
      this.applyMoraleLoss(loss);
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
    const healAmount = this.getModifiedHealAmount(40);
    for (const c of this.combatants) {
      if (c.alive && c.faction === 'ally' && c.defId !== 'barricade') {
        const dist = Math.abs(c.x - x);
        if (dist <= 120) {
          c.hp = Math.min(c.maxHp, c.hp + healAmount);
          this.pendingEvents.push({ type: 'heal', faction: 'ally', amount: healAmount });
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
    const bossDef = BOSS_INDEX[this.bossId];
    if (!bossDef) return;
    const boss = this.combatants.find(c => c.alive && c.defId === this.bossId);
    if (!boss) return;

    const hpPct = boss.hp / boss.maxHp;
    const newPhase = this.getBossPhaseIndex(bossDef.phases, hpPct);

    if ((this as any).currentBossPhase === undefined) {
      (this as any).currentBossPhase = 0;
      this.applyBossPhaseStats(boss, bossDef.stats, bossDef.phases[newPhase]);
    }

    const prevPhase = (this as any).currentBossPhase;
    if (newPhase !== prevPhase) {
      (this as any).currentBossPhase = newPhase;
      this.applyBossPhaseStats(boss, bossDef.stats, bossDef.phases[newPhase]);
      this.pendingEvents.push({
        type: 'base-hit',
        faction: 'enemy',
        amount: 999, // Special amount code for phase transition
        defId: boss.defId,
        uid: boss.uid,
        x: boss.x,
        y: FIELD.LANES_Y[boss.lane],
        phaseIndex: newPhase,
      });
    }

    const phaseAbilities = bossDef.phases[newPhase]?.abilities || [];
    const baseAbilities = (bossDef.abilities || []).filter(
      ability => !phaseAbilities.some(phaseAbility => phaseAbility.id === ability.id),
    );

    this.updateBossThresholdAbilities(boss, bossDef.phases, hpPct);
    this.updateBossCooldownAbilities(boss, baseAbilities, dtMs, 'base');
    this.updateBossCooldownAbilities(boss, phaseAbilities, dtMs, `phase-${newPhase}`);
  }

  private getBossPhaseIndex(phases: BossPhase[], hpPct: number): number {
    let phaseIndex = 0;
    for (let i = 0; i < phases.length - 1; i++) {
      if (hpPct <= this.normalizeHpPct(phases[i].untilHpPct)) {
        phaseIndex = i + 1;
      }
    }
    return phaseIndex;
  }

  private normalizeHpPct(value: number): number {
    return value > 1 ? value / 100 : value;
  }

  private applyBossPhaseStats(boss: Combatant, baseStats: EnemyStats, phase?: BossPhase): void {
    const overrides = phase?.statOverrides || {};
    boss.damage = overrides.damage ?? baseStats.damage;
    boss.attackInterval = overrides.attackInterval ?? baseStats.attackInterval;
    boss.range = overrides.range ?? baseStats.range;
    boss.moveSpeed = overrides.moveSpeed ?? baseStats.moveSpeed;
    boss.armor = overrides.armor ?? baseStats.armor;
    boss.aoeRadius = overrides.aoeRadius ?? baseStats.aoeRadius;
  }

  private updateBossThresholdAbilities(boss: Combatant, phases: BossPhase[], hpPct: number): void {
    const triggered = ((boss as any).bossTriggeredThresholds ??= {}) as Record<string, boolean>;
    for (const phase of phases) {
      for (const ability of phase.abilities || []) {
        const thresholdStep = Number(ability.params?.onHpThresholdPct || 0);
        if (!thresholdStep) continue;

        for (let threshold = 100 - thresholdStep; threshold > 0; threshold -= thresholdStep) {
          const key = `${ability.id}:${threshold}`;
          if (triggered[key] || hpPct * 100 > threshold) continue;

          triggered[key] = true;
          this.castBossAbility(boss, ability);
        }
      }
    }
  }

  private updateBossCooldownAbilities(boss: Combatant, abilities: EnemyAbility[], dtMs: number, groupKey: string): void {
    const cooldowns = ((boss as any).bossAbilityCooldowns ??= {}) as Record<string, number>;
    for (let i = 0; i < abilities.length; i++) {
      const ability = abilities[i];
      if (ability.params?.onHpThresholdPct) continue;
      if (ability.cooldown <= 0) continue;

      const key = `${groupKey}:${i}:${ability.id}:${ability.cooldown}`;
      cooldowns[key] = (cooldowns[key] ?? this.getBossInitialAbilityDelay(ability, i)) - dtMs;
      if (cooldowns[key] > 0) continue;

      this.castBossAbility(boss, ability);
      cooldowns[key] = ability.cooldown;
    }
  }

  private getBossInitialAbilityDelay(ability: EnemyAbility, order: number): number {
    const readableDelayByAbility: Record<EnemyAbility['id'], number> = {
      summon: 4500,
      mutate: 6500,
      'heal-zone': 8500,
      cannon: 5200,
      fog: 5000,
      revive: 7000,
      detonate: 0,
    };
    const readableDelay = readableDelayByAbility[ability.id] + order * 400;
    return Math.min(ability.cooldown, readableDelay);
  }

  private castBossAbility(boss: Combatant, ability: EnemyAbility): void {
    if (ability.id === 'summon') {
      this.castBossSummon(boss, ability);
      return;
    }

    if (ability.id === 'mutate') {
      this.castBossMutate(boss, ability);
      return;
    }

    if (ability.id === 'heal-zone') {
      this.castBossHealZone(boss, ability);
      return;
    }

    if (ability.id === 'cannon') {
      this.castBossCannon(boss, ability);
    }
  }

  private castBossSummon(boss: Combatant, ability: EnemyAbility): void {
    const enemyId = String(ability.params?.enemyId || 'revenant-grunt');
    const count = Number(ability.params?.count || 1);
    for (let i = 0; i < count; i++) {
      this.spawnEnemy(enemyId);
    }
    this.pendingEvents.push({
      type: 'heal',
      faction: 'enemy',
      amount: 888, // Special amount code for boss summon
      abilityId: 'summon',
      defId: boss.defId,
      uid: boss.uid,
      x: FIELD.SPAWN_ENEMY_X,
      y: FIELD.LANES_Y[boss.lane],
    });
  }

  private castBossMutate(boss: Combatant, ability: EnemyAbility): void {
    const candidates = this.combatants.filter(c =>
      c.alive && c.faction === 'enemy' && c.uid !== boss.uid && !(c as any).bossMutated
    );
    const target = candidates[0];
    if (!target) return;

    const hpMult = Number(ability.params?.hpMult || 1);
    const damageMult = Number(ability.params?.damageMult || 1);
    target.maxHp = Math.round(target.maxHp * hpMult);
    target.hp = Math.min(target.maxHp, Math.round(target.hp * hpMult));
    target.damage = Math.round(target.damage * damageMult);
    (target as any).bossMutated = true;
    this.pendingEvents.push({
      type: 'heal',
      faction: 'enemy',
      amount: 888,
      abilityId: 'mutate',
      defId: target.defId,
      uid: target.uid,
      x: target.x,
      y: FIELD.LANES_Y[target.lane],
    });
  }

  private castBossHealZone(boss: Combatant, ability: EnemyAbility): void {
    const radius = Number(ability.params?.radius || 110);
    const healPerSecond = Number(ability.params?.healPerSecond || 10);
    const durationMs = Number(ability.params?.durationMs || 3000);
    const amount = Math.max(1, Math.round(healPerSecond * (durationMs / 1000)));

    let healed = false;
    for (const c of this.combatants) {
      if (!c.alive || c.faction !== 'enemy') continue;
      if (Math.abs(c.lane - boss.lane) > 1) continue;
      if (Math.abs(c.x - boss.x) > radius) continue;

      const before = c.hp;
      c.hp = Math.min(c.maxHp, c.hp + amount);
      if (c.hp > before) healed = true;
    }

    if (healed) {
      this.pendingEvents.push({
        type: 'heal',
        faction: 'enemy',
        amount,
        abilityId: 'heal-zone',
        defId: boss.defId,
        uid: boss.uid,
        x: boss.x,
        y: FIELD.LANES_Y[boss.lane],
      });
    }
  }

  private castBossCannon(boss: Combatant, ability: EnemyAbility): void {
    const target = this.findTarget(boss);
    if (!target) return;

    const radius = Number(ability.params?.radius || boss.aoeRadius || 100);
    const damage = Number(ability.params?.damage || boss.damage);
    for (const c of this.combatants) {
      if (!c.alive || c.faction !== 'ally') continue;
      if (Math.abs(c.lane - target.lane) > 1) continue;
      if (Math.abs(c.x - target.x) > radius) continue;

      c.hp -= Math.max(1, damage - c.armor);
      if (c.hp <= 0) this.kill(c, boss);
    }
    this.pendingEvents.push({
      type: 'base-hit',
      faction: 'ally',
      amount: 0,
      abilityId: 'cannon',
      defId: boss.defId,
      uid: boss.uid,
      x: target.x,
      y: FIELD.LANES_Y[target.lane],
    });
  }

  private getBattleStartingSupplies(): number {
    let supplies = Math.round(this.applyModifiers('startingSupplies', ECONOMY.STARTING_SUPPLIES));
    if (this.hasHook('supply-drop-start')) supplies += 60;
    return Math.max(0, supplies);
  }

  private getIncomePerSecond(): number {
    return Math.max(0, this.applyModifiers('incomeRate', ECONOMY.INCOME_PER_SECOND));
  }

  private getBaseUnitCost(unitId: string): number {
    const def = UNIT_INDEX[unitId];
    if (!def) return Infinity;
    return Math.max(0, Math.round(this.applyModifiers('cost', def.cost, this.subjectForUnit(unitId))));
  }

  private hasFreeDeployCharge(): boolean {
    return this.hasHook('free-deploy-per-12-kills') && this.freeDeployCharges > 0;
  }

  private getModifiedHealAmount(amount: number): number {
    const subject: ModifierSubject = { faction: 'ally', defId: 'healing', tags: ['support'] };
    return Math.max(1, Math.round(this.applyModifiers('healPower', amount, subject)));
  }

  private getMoraleLossMultiplier(): number {
    return Math.max(0, this.applyModifiers('moraleLossMult', 1));
  }

  private applyMoraleLoss(rawLoss: number): void {
    const loss = rawLoss * this.getMoraleLossMultiplier();
    const nextMorale = this.morale - loss;
    if (this.hasHook('morale-floor-once') && !this.moraleFloorUsed && nextMorale < 1) {
      this.moraleFloorUsed = true;
      this.morale = Math.min(MORALE.MAX, Math.max(1, this.morale) + 20);
      return;
    }
    this.morale = Math.max(0, nextMorale);
  }

  private preventFirstAllyDeath(c: Combatant): boolean {
    if (!this.hasHook('first-death-survives')) return false;
    if (this.firstDeathSurviveUsed || c.faction !== 'ally' || c.defId === 'barricade') return false;
    this.firstDeathSurviveUsed = true;
    c.hp = 1;
    c.alive = true;
    this.pendingEvents.push({
      type: 'heal',
      faction: 'ally',
      amount: 1,
      defId: c.defId,
      uid: c.uid,
      x: c.x,
      y: FIELD.LANES_Y[c.lane],
    });
    return true;
  }

  private hasHook(hookId: string): boolean {
    return this.activeHooks.has(hookId);
  }

  private applyCombatantModifiers(defId: string, faction: Faction, draft: CombatantDraft): CombatantDraft {
    const subject = this.subjectForDraft(defId, faction, draft.tags);
    return {
      ...draft,
      maxHp: Math.max(1, Math.round(this.applyModifiers('maxHp', draft.maxHp, subject))),
      attackInterval: Math.max(100, Math.round(this.applyModifiers('attackInterval', draft.attackInterval, subject))),
      range: Math.max(0, Math.round(this.applyModifiers('range', draft.range, subject))),
      moveSpeed: Math.max(0, this.applyModifiers('moveSpeed', draft.moveSpeed, subject)),
      armor: Math.max(0, Math.round(this.applyModifiers('armor', draft.armor, subject))),
      healPower: draft.healPower === undefined ? undefined : Math.max(1, Math.round(this.applyModifiers('healPower', draft.healPower, subject))),
      healRadius: draft.healRadius === undefined ? undefined : Math.max(0, Math.round(this.applyModifiers('healRadius', draft.healRadius, subject))),
      maxTargets: draft.maxTargets === undefined ? undefined : Math.max(1, Math.round(this.applyModifiers('maxTargets', draft.maxTargets, subject))),
    };
  }

  private applyModifiers(stat: StatKey, baseValue: number, subject?: ModifierSubject, target?: ModifierSubject): number {
    let value = baseValue;
    for (const modifier of this.activeModifiers) {
      if (modifier.stat !== stat) continue;
      if (!this.modifierMatches(modifier.filter, subject, target)) continue;
      value = modifier.op === 'mul' ? value * modifier.value : value + modifier.value;
    }
    return value;
  }

  private modifierMatches(filter: TargetFilter | undefined, subject?: ModifierSubject, target?: ModifierSubject): boolean {
    if (!filter) return true;
    if (!subject) return false;

    if (filter.side && subject.faction !== filter.side) return false;
    if (filter.unitIds && !filter.unitIds.includes(subject.defId)) return false;
    if (filter.roles && !filter.roles.includes(subject.role || '')) return false;

    if (filter.enemyIds) {
      const subjectMatch = subject.faction === 'enemy' && filter.enemyIds.includes(subject.defId);
      const targetMatch = !!target && target.faction === 'enemy' && filter.enemyIds.includes(target.defId);
      if (!subjectMatch && !targetMatch) return false;
    }

    if (filter.tags) {
      const subjectMatch = this.hasAllTags(subject, filter.tags);
      const targetMatch = target ? this.hasAllTags(target, filter.tags) : false;
      if (!subjectMatch && !targetMatch) return false;
    }

    if (filter.tiers) {
      const subjectMatch = !!subject.tier && filter.tiers.includes(subject.tier);
      const targetMatch = !!target?.tier && filter.tiers.includes(target.tier);
      if (!subjectMatch && !targetMatch) return false;
    }

    return true;
  }

  private hasAllTags(subject: ModifierSubject, tags: string[]): boolean {
    return tags.every((tag) => subject.tags.includes(tag));
  }

  private subjectForCombatant(c: Combatant): ModifierSubject {
    return this.subjectForDraft(c.defId, c.faction, c.tags);
  }

  private subjectForUnit(unitId: string): ModifierSubject {
    const def = UNIT_INDEX[unitId];
    return {
      faction: 'ally',
      defId: unitId,
      tags: def?.tags || [],
      role: def?.role,
    };
  }

  private subjectForDraft(defId: string, faction: Faction, tags: string[]): ModifierSubject {
    const unit = faction === 'ally' ? UNIT_INDEX[defId] : undefined;
    const enemy = faction === 'enemy' ? (ENEMY_INDEX[defId] || BOSS_INDEX[defId]) : undefined;
    return {
      faction,
      defId,
      tags,
      role: unit?.role,
      tier: enemy?.tier,
    };
  }
}
