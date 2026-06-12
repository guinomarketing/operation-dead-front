import Phaser from 'phaser';

/**
 * BootScene — punto de entrada. En el MVP no hay assets que cargar
 * (todo es placeholder vectorial), así que pasa directo al menú.
 * Cuando haya sprites/audio, su carga va acá (this.load.*).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Sin assets en MVP 0.1. Placeholder para futura carga.
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
