import { describe, expect, it } from 'vitest';
import { ABILITY_INDEX } from '../data/abilities';
import { BOSS_INDEX } from '../data/bosses';
import { ENEMY_INDEX } from '../data/enemies';
import { RELICS } from '../data/relics';
import { UNIT_INDEX } from '../data/units';
import { ECONOMY, FIELD } from '../utils/constants';
import { BattleSystem } from './BattleSystem';
import { RunSystem } from './RunSystem';

const BOSS_BENCH_DEPLOY_PLAN: Array<{ unitId: string; lane: number }> = [
  { unitId: 'rifleman', lane: 2 },
  { unitId: 'medic', lane: 2 },
  { unitId: 'engineer', lane: 1 },
  { unitId: 'heavy-gunner', lane: 1 },
  { unitId: 'sniper', lane: 3 },
  { unitId: 'flamethrower', lane: 1 },
  { unitId: 'bombero', lane: 0 },
  { unitId: 'cientifica', lane: 3 },
  { unitId: 'gaucho', lane: 0 },
  { unitId: 'veterano', lane: 2 },
  { unitId: 'colectivero', lane: 1 },
  { unitId: 'electricista', lane: 3 },
];

function runBossBalanceBench(bossId: string, operationId: string) {
  const sim = new BattleSystem(100, [], 'boss', 'assault', bossId, operationId, `bench:${bossId}`);
  const unitCooldowns = new Map<string, number>();
  const abilityCooldowns = new Map<string, number>([
    ['airstrike', 0],
    ['medkit', 0],
  ]);
  let elapsedMs = 0;
  let nextDeployIndex = 0;
  let deployedCount = 0;
  let maxRegularEnemies = 0;
  let maxAllies = 0;
  let phaseEvents = 0;
  const bossAbilityEvents: Record<string, number> = {};
  let playerAirstrikes = 0;
  let playerMedkits = 0;
  const tickMs = 200;
  const maxMs = 240000;

  while (sim.outcome === 'ongoing' && elapsedMs < maxMs) {
    for (const [unitId, cooldown] of unitCooldowns) unitCooldowns.set(unitId, Math.max(0, cooldown - tickMs));
    for (const [abilityId, cooldown] of abilityCooldowns) abilityCooldowns.set(abilityId, Math.max(0, cooldown - tickMs));

    let deploysThisTick = 0;
    while (nextDeployIndex < BOSS_BENCH_DEPLOY_PLAN.length && deploysThisTick < 2) {
      const plan = BOSS_BENCH_DEPLOY_PLAN[nextDeployIndex];
      const unitDef = UNIT_INDEX[plan.unitId];
      if (!unitDef || (unitCooldowns.get(plan.unitId) ?? 0) > 0 || !sim.canAfford(plan.unitId)) break;

      const spawned = sim.spawnAlly(plan.unitId, plan.lane);
      if (!spawned) break;
      unitCooldowns.set(plan.unitId, unitDef.deployCooldown);
      nextDeployIndex++;
      deployedCount++;
      deploysThisTick++;
    }

    const wounded = sim.combatants
      .filter((combatant) => combatant.alive && combatant.faction === 'ally' && combatant.defId !== 'barricade')
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const medkit = ABILITY_INDEX.medkit;
    if (wounded && wounded.hp / wounded.maxHp <= 0.45 && medkit && sim.supplies >= medkit.cost && (abilityCooldowns.get('medkit') ?? 0) <= 0) {
      sim.supplies -= medkit.cost;
      sim.castMedkit(wounded.x);
      abilityCooldowns.set('medkit', medkit.cooldown);
      playerMedkits++;
    }

    const boss = sim.combatants.find((combatant) => combatant.alive && combatant.defId === bossId);
    const regularEnemies = sim.combatants.filter((combatant) => combatant.alive && combatant.faction === 'enemy' && combatant.defId !== bossId);
    const airstrike = ABILITY_INDEX.airstrike;
    const shouldAirstrike = regularEnemies.length >= 4 || (!!boss && boss.hp / boss.maxHp <= 0.55);
    if (airstrike && shouldAirstrike && sim.supplies >= airstrike.cost && (abilityCooldowns.get('airstrike') ?? 0) <= 0) {
      sim.supplies -= airstrike.cost;
      sim.castAirstrike(boss?.x ?? FIELD.SPAWN_ENEMY_X);
      abilityCooldowns.set('airstrike', airstrike.cooldown);
      playerAirstrikes++;
    }

    sim.update(tickMs);
    elapsedMs += tickMs;

    for (const event of sim.pendingEvents) {
      if (event.phaseIndex !== undefined) phaseEvents++;
      if (event.abilityId) bossAbilityEvents[event.abilityId] = (bossAbilityEvents[event.abilityId] ?? 0) + 1;
    }
    maxRegularEnemies = Math.max(maxRegularEnemies, regularEnemies.length);
    maxAllies = Math.max(maxAllies, sim.combatants.filter((combatant) => combatant.alive && combatant.faction === 'ally').length);
  }

  return {
    outcome: sim.outcome,
    elapsedMs,
    allyBaseHp: sim.allyBaseHp,
    morale: sim.morale,
    bossHp: sim.enemyBaseHp,
    deployedCount,
    maxAllies,
    maxRegularEnemies,
    phaseEvents,
    bossAbilityEvents,
    playerAirstrikes,
    playerMedkits,
  };
}

describe('run generation', () => {
  it('generates the same map for the same seed and operation', () => {
    const first = RunSystem.generateMap('same-seed', 'op-hollow-town');
    const second = RunSystem.generateMap('same-seed', 'op-hollow-town');

    expect(second).toEqual(first);
  });

  it('uses the operation row range and keeps the boss at the final row', () => {
    const map = RunSystem.generateMap('iron-seed', 'op-iron-grave');
    const finalRow = Math.max(...map.nodes.map((node) => node.row));
    const boss = map.nodes.find((node) => node.id === map.bossNodeId);

    expect(finalRow).toBeGreaterThanOrEqual(9);
    expect(finalRow).toBeLessThanOrEqual(10);
    expect(boss?.type).toBe('boss');
    expect(boss?.row).toBe(finalRow);
  });
});

describe('battle objectives', () => {
  it('does not let assault battles win just because waves are cleared', () => {
    const sim = new BattleSystem(100, [], 'battle', 'assault', 'general-eisenfaust', 'op-first-light', 'assault-clear');
    sim.waveSys.state.currentWave = sim.waveSys.state.totalWaves;
    sim.waveSys.state.isActive = true;
    sim.waveSys.state.budgetRemaining = 0;

    sim.update(16);

    expect(sim.outcome).toBe('ongoing');
    expect(sim.enemyBaseHp).toBeGreaterThan(0);
  });

  it('wins defense battles only after all waves are cleared', () => {
    const sim = new BattleSystem(100, [], 'battle', 'defense', 'general-eisenfaust', 'op-first-light', 'defense-clear');
    sim.waveSys.state.currentWave = sim.waveSys.state.totalWaves;
    sim.waveSys.state.isActive = true;
    sim.waveSys.state.budgetRemaining = 0;

    sim.update(16);

    expect(sim.outcome).toBe('won');
  });

  it('does not let a defense battle win by destroying the enemy bunker', () => {
    const sim = new BattleSystem(100, [], 'battle', 'defense', 'general-eisenfaust', 'op-first-light', 'defense-bunker');
    sim.enemyBaseHp = 0;

    sim.update(16);

    expect(sim.outcome).toBe('ongoing');
  });

  it('applies base damage using the attacker cadence instead of every frame', () => {
    const sim = new BattleSystem(100, [], 'battle', 'assault', 'general-eisenfaust', 'op-first-light', 'base-cadence');
    const rifleman = sim.spawnAlly('rifleman', FIELD.CENTER_LANE);
    expect(rifleman).not.toBeNull();
    if (!rifleman) return;

    rifleman.x = FIELD.ENEMY_BASE_X;
    rifleman.attackCooldown = 0;

    sim.update(16);
    const afterFirstHit = sim.enemyBaseHp;
    sim.update(16);

    expect(afterFirstHit).toBeLessThan(sim.enemyBaseMaxHp);
    expect(sim.enemyBaseHp).toBe(afterFirstHit);
  });
});

describe('relic gameplay', () => {
  it('grants a random unowned relic when events request a relic without an id', () => {
    const state = RunSystem.startNewRun('op-first-light', 'capt-miller', 'relic-grant');

    RunSystem.resolveEffect(state, { kind: 'gain-relic' });

    expect(state.relicIds).toHaveLength(1);
    expect(RELICS.some((relic) => relic.id === state.relicIds[0])).toBe(true);
  });

  it('applies relic unit modifiers to deployment cadence, health and cost', () => {
    const sim = new BattleSystem(
      100,
      [],
      'battle',
      'assault',
      'general-eisenfaust',
      'op-first-light',
      'relic-stats',
      ['black-coffee-rations', 'iron-rations', 'trench-whistle'],
    );
    sim.supplies = 100;

    const rifleman = sim.spawnAlly('rifleman', FIELD.CENTER_LANE);
    expect(rifleman).not.toBeNull();
    if (!rifleman) return;

    expect(rifleman.maxHp).toBe(Math.round(UNIT_INDEX.rifleman.stats.maxHp * 1.15));
    expect(rifleman.attackInterval).toBe(Math.round(UNIT_INDEX.rifleman.stats.attackInterval * 0.85));
    expect(sim.getDeployCooldown('rifleman')).toBe(Math.round(UNIT_INDEX.rifleman.deployCooldown * 0.8));
    expect(sim.getModifiedDamage(rifleman)).toBe(Math.round(UNIT_INDEX.rifleman.stats.damage * 0.9));
  });

  it('uses target-aware relic filters for occult and elite counters', () => {
    const blessed = new BattleSystem(100, [], 'battle', 'assault', 'general-eisenfaust', 'op-first-light', 'blessed', ['blessed-ammo']);
    blessed.supplies = 100;
    const rifleman = blessed.spawnAlly('rifleman', FIELD.CENTER_LANE);
    const occultist = blessed.spawnEnemy('occultist');
    expect(rifleman).not.toBeNull();
    expect(occultist).not.toBeNull();
    if (!rifleman || !occultist) return;

    expect(blessed.getModifiedDamage(rifleman, occultist)).toBe(Math.round(UNIT_INDEX.rifleman.stats.damage * 1.3));

    const scoped = new BattleSystem(100, [], 'battle', 'assault', 'general-eisenfaust', 'op-first-light', 'scope', ['sniper-scope']);
    scoped.supplies = 100;
    const sniper = scoped.spawnAlly('sniper', FIELD.CENTER_LANE);
    const officer = scoped.spawnEnemy('dead-officer');
    const grunt = scoped.spawnEnemy('revenant-grunt');
    expect(sniper).not.toBeNull();
    expect(officer).not.toBeNull();
    expect(grunt).not.toBeNull();
    if (!sniper || !officer || !grunt) return;

    expect(scoped.getModifiedDamage(sniper, officer)).toBe(Math.round(UNIT_INDEX.sniper.stats.damage * 1.25));
    expect(scoped.getModifiedDamage(sniper, grunt)).toBe(UNIT_INDEX.sniper.stats.damage);
  });

  it('applies relic economy and morale tradeoffs at battle start', () => {
    const sim = new BattleSystem(
      100,
      [],
      'boss',
      'assault',
      'general-eisenfaust',
      'op-first-light',
      'war-bonds',
      ['war-bonds', 'chaplains-cross'],
    );

    expect(sim.morale).toBe(65);

    sim.update(1000);

    expect(sim.supplies).toBe(ECONOMY.STARTING_SUPPLIES + 10);
  });
});

describe('operations and waves', () => {
  it('spawns the configured boss for the active operation', () => {
    const sim = new BattleSystem(100, [], 'boss', 'assault', 'doctor-totenkopf', 'op-hollow-town', 'totenkopf');
    const boss = sim.combatants.find((combatant) => combatant.faction === 'enemy');

    expect(boss?.defId).toBe('doctor-totenkopf');
    expect(sim.enemyBaseHp).toBe(BOSS_INDEX['doctor-totenkopf'].stats.maxHp);
  });

  it('applies Doctor Totenkopf final phase stat overrides', () => {
    const sim = new BattleSystem(100, [], 'boss', 'assault', 'doctor-totenkopf', 'op-hollow-town', 'totenkopf-phase');
    const boss = sim.combatants.find((combatant) => combatant.defId === 'doctor-totenkopf');
    expect(boss).toBeDefined();
    if (!boss) return;

    boss.hp = Math.floor(boss.maxHp * 0.29);
    sim.enemyBaseHp = boss.hp;
    sim.update(16);

    expect(boss.damage).toBe(20);
    expect(boss.moveSpeed).toBe(20);
    expect(boss.armor).toBe(0);
    expect(sim.pendingEvents).toContainEqual(expect.objectContaining({ amount: 999 }));
  });

  it('staggers Doctor Totenkopf subjects before mutation for a readable opening', () => {
    const sim = new BattleSystem(100, [], 'boss', 'assault', 'doctor-totenkopf', 'op-hollow-town', 'totenkopf-loop');

    sim.update(4900);

    const subject = sim.combatants.find((combatant) => combatant.defId === 'toxic-carrier');
    expect(subject).toBeDefined();
    expect(sim.pendingEvents).toContainEqual(expect.objectContaining({ abilityId: 'summon' }));
    expect(sim.pendingEvents).not.toContainEqual(expect.objectContaining({ abilityId: 'mutate' }));

    sim.update(1600);

    const mutatedSubject = sim.combatants.find((combatant) => combatant.defId === 'toxic-carrier');
    expect(mutatedSubject?.maxHp).toBe(Math.round(ENEMY_INDEX['toxic-carrier'].stats.maxHp * 1.5));
    expect(mutatedSubject?.damage).toBe(Math.round(ENEMY_INDEX['toxic-carrier'].stats.damage * 1.3));
    expect(sim.pendingEvents).toContainEqual(expect.objectContaining({ abilityId: 'mutate' }));
  });

  it('uses Locomotora threshold summons and exposed-engine phase stats', () => {
    const sim = new BattleSystem(100, [], 'boss', 'assault', 'panzer-corpse-engine', 'op-iron-grave', 'locomotora-phase');
    const boss = sim.combatants.find((combatant) => combatant.defId === 'panzer-corpse-engine');
    expect(boss).toBeDefined();
    if (!boss) return;

    boss.hp = Math.floor(boss.maxHp * 0.79);
    sim.enemyBaseHp = boss.hp;
    sim.update(16);

    expect(sim.combatants.filter((combatant) => combatant.defId === 'revenant-grunt')).toHaveLength(2);

    boss.hp = Math.floor(boss.maxHp * 0.49);
    sim.enemyBaseHp = boss.hp;
    sim.update(16);

    expect(boss.armor).toBe(3);
    expect(boss.moveSpeed).toBe(10);
    expect(boss.attackInterval).toBe(4500);
  });

  it('does not double-fire Locomotora cannon when phase cannon replaces the base cannon', () => {
    const sim = new BattleSystem(100, [], 'boss', 'assault', 'panzer-corpse-engine', 'op-iron-grave', 'locomotora-cannon');
    const boss = sim.combatants.find((combatant) => combatant.defId === 'panzer-corpse-engine');
    const target = sim.spawnAlly('rifleman', FIELD.CENTER_LANE);
    expect(boss).toBeDefined();
    expect(target).not.toBeNull();
    if (!boss || !target) return;

    target.x = boss.x - 120;
    boss.hp = Math.floor(boss.maxHp * 0.49);
    sim.enemyBaseHp = boss.hp;

    sim.update(5200);

    expect(sim.pendingEvents.filter((event) => event.abilityId === 'cannon')).toHaveLength(1);
  });

  it('routes ally base attacks into the living boss during boss battles', () => {
    const sim = new BattleSystem(100, [], 'boss', 'assault', 'panzer-corpse-engine', 'op-iron-grave', 'boss-base-routing');
    const boss = sim.combatants.find((combatant) => combatant.defId === 'panzer-corpse-engine');
    const rifleman = sim.spawnAlly('rifleman', FIELD.CENTER_LANE);
    expect(boss).toBeDefined();
    expect(rifleman).not.toBeNull();
    if (!boss || !rifleman) return;

    rifleman.x = FIELD.ENEMY_BASE_X;
    rifleman.attackCooldown = 0;
    sim.update(16);

    expect(boss.hp).toBeLessThan(boss.maxHp);
    expect(sim.enemyBaseHp).toBe(boss.hp);
  });

  it('keeps boss fights winnable and readable for a competent full-roster player', () => {
    const reports = [
      runBossBalanceBench('general-eisenfaust', 'op-first-light'),
      runBossBalanceBench('doctor-totenkopf', 'op-hollow-town'),
      runBossBalanceBench('panzer-corpse-engine', 'op-iron-grave'),
    ];

    for (const report of reports) {
      const context = JSON.stringify(report);
      expect(report.outcome, context).toBe('won');
      expect(report.elapsedMs, context).toBeGreaterThan(30000);
      expect(report.elapsedMs, context).toBeLessThan(210000);
      expect(report.allyBaseHp, context).toBeGreaterThan(0);
      expect(report.morale, context).toBeGreaterThan(0);
      expect(report.deployedCount, context).toBeGreaterThanOrEqual(8);
      expect(report.maxRegularEnemies, context).toBeLessThanOrEqual(14);
    }

    expect(reports[0].phaseEvents).toBeGreaterThanOrEqual(2);
    expect(reports[1].bossAbilityEvents.summon).toBeGreaterThanOrEqual(1);
    expect(reports[1].bossAbilityEvents.mutate).toBeGreaterThanOrEqual(1);
    expect(reports[2].bossAbilityEvents.cannon).toBeGreaterThanOrEqual(1);
  });

  it('uses operation enemy pools for wave composition', () => {
    const regular = new BattleSystem(100, [], 'battle', 'defense', 'general-eisenfaust', 'op-hollow-town', 'pool');
    const elite = new BattleSystem(100, [], 'elite', 'defense', 'general-eisenfaust', 'op-hollow-town', 'pool');

    expect(regular.getWaveEnemyIds()).toContain('rot-hound');
    expect(regular.getWaveEnemyIds()).not.toContain('occultist');
    expect(elite.getWaveEnemyIds()).toContain('occultist');
  });

  it('spawns the same first wave enemy for the same battle seed', () => {
    const makeReady = () => {
      const sim = new BattleSystem(100, [], 'battle', 'defense', 'general-eisenfaust', 'op-first-light', 'same-wave');
      sim.waveSys.state.currentWave = 1;
      sim.waveSys.state.isActive = true;
      sim.waveSys.state.budgetRemaining = 40;
      sim.waveSys.state.timeSinceLastSpawn = 1000;
      sim.waveSys.state.nextSpawnDelay = 0;
      return sim;
    };

    const first = makeReady();
    const second = makeReady();
    first.update(16);
    second.update(16);

    expect(first.combatants.map((combatant) => combatant.defId)).toEqual(
      second.combatants.map((combatant) => combatant.defId),
    );
  });
});
