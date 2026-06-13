import Phaser from 'phaser';
import { SpriteFactory } from '../rendering/SpriteFactory';
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
    // Cargar fondo de batalla
    this.load.image('battlefield', 'assets/backgrounds/battlefield.png');

    // Cargar sprites crudos con fondo negro
    this.load.image('raw-ally-bunker', 'assets/sprites/ally-bunker.png');
    this.load.image('raw-enemy-bunker', 'assets/sprites/enemy-bunker.png');
    this.load.image('raw-unit-rifleman', 'assets/sprites/unit-rifleman.png');
    this.load.image('raw-enemy-revenant-grunt', 'assets/sprites/enemy-revenant-grunt.png');
  }

  create(): void {
    // Procesar imágenes con fondo negro para hacerlas transparentes
    SpriteFactory.processTransparentTexture(this, 'raw-ally-bunker', 'ally-bunker');
    SpriteFactory.processTransparentTexture(this, 'raw-enemy-bunker', 'enemy-bunker');
    SpriteFactory.processTransparentTexture(this, 'raw-unit-rifleman', 'unit-rifleman');
    SpriteFactory.processTransparentTexture(this, 'raw-enemy-revenant-grunt', 'enemy-revenant-grunt');

    // ── Dev jump (solo para pruebas): ?scene=battle | ?scene=boss | ?scene=map ──
    const jump = new URLSearchParams(window.location.search).get('scene');
    if (jump) {
      const runState = RunSystem.startNewRun();
      const mapDef = RunSystem.generateMap(runState.seed);
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
    }

    // Ir al menú principal
    this.scene.start('MainMenu');
  }
}

