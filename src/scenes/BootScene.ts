import Phaser from 'phaser';
import { SpriteFactory } from '../rendering/SpriteFactory';

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

    // Ir al menú principal
    this.scene.start('MainMenu');
  }
}

