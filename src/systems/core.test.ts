import { describe, expect, it } from 'vitest';
import { BOSS_INDEX } from '../data/bosses';
import { FIELD } from '../utils/constants';
import { BattleSystem } from './BattleSystem';
import { RunSystem } from './RunSystem';

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

describe('operations and waves', () => {
  it('spawns the configured boss for the active operation', () => {
    const sim = new BattleSystem(100, [], 'boss', 'assault', 'doctor-totenkopf', 'op-hollow-town', 'totenkopf');
    const boss = sim.combatants.find((combatant) => combatant.faction === 'enemy');

    expect(boss?.defId).toBe('doctor-totenkopf');
    expect(sim.enemyBaseHp).toBe(BOSS_INDEX['doctor-totenkopf'].stats.maxHp);
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
