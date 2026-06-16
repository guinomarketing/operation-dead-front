import Phaser from 'phaser';
import { RunSystem } from '../systems/RunSystem';

/**
 * BootScene — punto de entrada.
 * Carga los assets de imagen estáticos y procesa las transparencias.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Fondos de batalla y campaña.
    this.load.image('battlefield', 'assets/backgrounds/battlefield.jpg');
    this.load.image('battlefield-town', 'assets/backgrounds/battlefield-town-v1.png');
    this.load.image('battlefield-ironworks', 'assets/backgrounds/battlefield-ironworks-v1.png');
    this.load.image('keyart-main', 'assets/backgrounds/keyart-main-v2.png');
    this.load.image('map-patagonia', 'assets/backgrounds/map-patagonia-v2.png');
    this.load.image('result-victory', 'assets/backgrounds/result-victory-v1.png');
    this.load.image('result-defeat', 'assets/backgrounds/result-defeat-v1.png');
    this.load.image('hq-progression', 'assets/backgrounds/hq-progression-v1.png');
    this.load.image('story-01', 'assets/backgrounds/story-01-bunker-v1.png');
    this.load.image('story-02', 'assets/backgrounds/story-02-breach-v1.png');
    this.load.image('story-03', 'assets/backgrounds/story-03-invasion-v1.png');
    this.load.image('story-04', 'assets/backgrounds/story-04-defense-v1.png');

    // ── Personajes ilustrados (Magnific, PNG transparente recortado) ──
    // Unidades argentinas (key = unit-<defId>)
    const units = [
      'rifleman', 'heavy-gunner', 'medic', 'engineer', 'sniper', 'flamethrower',
      'bombero', 'cientifica', 'veterano', 'gaucho', 'colectivero', 'electricista',
    ];
    for (const u of units) this.load.image(`unit-${u}`, `assets/sprites/unit-${u}.png`);

    // Enemigos + jefe (key = enemy-<defId>)
    const enemies = [
      'revenant-grunt', 'runner-corpse', 'shielded-revenant', 'exploder', 'dead-officer',
      'occultist', 'panzer-corpse', 'rot-hound', 'toxic-carrier', 'general-eisenfaust',
    ];
    for (const e of enemies) this.load.image(`enemy-${e}`, `assets/sprites/enemy-${e}.png`);

    // Bosses con hojas fuente de animacion generadas para cada operacion.
    this.load.spritesheet('enemy-doctor-totenkopf', 'assets/sprites/boss-doctor-totenkopf-sheet-v2.png', {
      frameWidth: 362,
      frameHeight: 663,
    });
    this.load.spritesheet('enemy-panzer-corpse-engine', 'assets/sprites/boss-locomotora-profanadora-sheet-v2.png', {
      frameWidth: 362,
      frameHeight: 413,
    });
    // Reliquias
    this.load.spritesheet('relics-sheet', 'assets/sprites/relics-sheet.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create(): void {
    // Los personajes ya vienen transparentes; las texturas no presentes
    // (rot-hound, occultist, panzer-corpse, barricade, partículas) las genera
    // SpriteFactory de forma procedural como fallback.

    // ── Dev jump (solo para pruebas): ?scene=battle | ?scene=boss | ?scene=map ──
    const jump = new URLSearchParams(window.location.search).get('scene');
    if (jump) {
      const operationId = new URLSearchParams(window.location.search).get('operation') || undefined;
      const runState = RunSystem.startNewRun(operationId);
      // Demo: desbloquear y enrolar todas las clases (sin tocar el guardado real).
      const all = ['rifleman', 'heavy-gunner', 'medic', 'engineer', 'sniper', 'flamethrower',
        'bombero', 'cientifica', 'veterano', 'gaucho', 'colectivero', 'electricista'];
      runState.unlockedUnitIds = all;
      for (const id of all) if (!runState.roster.some((s) => s.unitId === id)) runState.roster.push(RunSystem.generateRandomSoldier(id));
      const mapDef = RunSystem.generateMap(runState.seed, runState.operationId);
      this.game.registry.set('runState', runState);
      this.game.registry.set('mapDef', mapDef);
      if (jump === 'battle') {
        this.scene.start('Battle', { nodeType: 'battle', battleMode: 'defense' });
        return;
      }
      if (jump === 'boss') {
        this.scene.start('Battle', { nodeType: 'boss', battleMode: 'assault' });
        return;
      }
      if (jump === 'map') {
        this.scene.start('Map');
        return;
      }
      if (jump === 'story') {
        this.scene.start('Story');
        return;
      }
      if (jump === 'result-win' || jump === 'result-loss') {
        this.scene.start('Result', { outcome: jump === 'result-win' ? 'won' : 'lost', nodeType: 'battle' });
        return;
      }
    }

    // Ir al menú principal
    this.scene.start('MainMenu');
  }
}
