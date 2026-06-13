import { WAVES } from '../utils/constants';
import { ENEMY_INDEX } from '../data/enemies';
import type { BattleSystem } from './BattleSystem';

export interface WaveState {
  currentWave: number;
  totalWaves: number;
  isActive: boolean;
  budgetRemaining: number;
  timeSinceLastSpawn: number;
  nextSpawnDelay: number;
  gracePeriodTimer: number; // Time between waves
}

export class WaveSystem {
  state: WaveState;
  
  constructor(private sim: BattleSystem, totalWaves: number = WAVES.WAVES_PER_DEFENSE_NODE) {
    this.state = {
      currentWave: 0,
      totalWaves,
      isActive: false,
      budgetRemaining: 0,
      timeSinceLastSpawn: 0,
      nextSpawnDelay: 0,
      gracePeriodTimer: 5000, // 5 seconds initial grace period
    };
  }

  update(dtMs: number): void {
    if (this.sim.nodeType === 'boss') return; // No regular waves for boss node
    if (this.state.currentWave > this.state.totalWaves) return;

    // Grace period between waves
    if (!this.state.isActive) {
      this.state.gracePeriodTimer -= dtMs;
      if (this.state.gracePeriodTimer <= 0) {
        this.startNextWave();
      }
      return;
    }

    // Active wave
    if (this.state.budgetRemaining <= 0) {
      // Check if all enemies are dead
      const hasEnemies = this.sim.combatants.some(c => c.alive && c.faction === 'enemy');
      if (!hasEnemies) {
        this.state.isActive = false;
        this.state.gracePeriodTimer = 6000; // 6 seconds before next wave
        
        // If that was the last wave, trigger win condition in BattleSystem
        if (this.state.currentWave >= this.state.totalWaves) {
          this.state.currentWave++; // Push it over total to stop ticking
          this.sim.outcome = 'won';
        }
      }
      return;
    }

    // Spawning logic
    this.state.timeSinceLastSpawn += dtMs;
    if (this.state.timeSinceLastSpawn >= this.state.nextSpawnDelay) {
      this.spawnFromBudget();
    }
  }

  private startNextWave(): void {
    this.state.currentWave++;
    this.state.isActive = true;
    
    // Calculate budget based on wave number
    // Wave 1: base + budget_per_row. Wave 2: base + 2*budget_per_row, etc.
    let budget = WAVES.BASE_BUDGET + (this.state.currentWave * WAVES.BUDGET_PER_ROW);
    if (this.sim.nodeType === 'elite') {
      budget = Math.round(budget * WAVES.ELITE_NODE_MULT);
    }
    this.state.budgetRemaining = budget;
    
    this.state.timeSinceLastSpawn = 0;
    this.state.nextSpawnDelay = 1000; // Fast initial spawn
  }

  private spawnFromBudget(): void {
    // Pick an enemy that fits the budget
    // For MVP 0.2, mostly grunts, sometimes runners
    const available = Object.values(ENEMY_INDEX).filter(e => (e.bounty || 1) <= this.state.budgetRemaining);
    
    if (available.length === 0) {
      // Nothing fits budget, waste the rest
      this.state.budgetRemaining = 0;
      return;
    }

    // Pick random available enemy (weight towards cheaper ones usually, but simple random for now)
    const def = available[Math.floor(Math.random() * available.length)];
    
    const spawned = this.sim.spawnEnemy(def.id);
    if (spawned) {
      this.state.budgetRemaining -= (def.bounty || 1);
      this.state.timeSinceLastSpawn = 0;
      
      // Randomize next spawn delay between 1.5s and 3s
      this.state.nextSpawnDelay = 1500 + Math.random() * 1500;
    }
  }
}
