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
    // Fondo de batalla (16:9, generado con Magnific)
    this.load.image('battlefield', 'assets/backgrounds/battlefield.jpg');

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
  }

  create(): void {
    // Los personajes ya vienen transparentes; las texturas no presentes
    // (rot-hound, occultist, panzer-corpse, barricade, partículas) las genera
    // SpriteFactory de forma procedural como fallback.

    // ── Dev jump (solo para pruebas): ?scene=battle | ?scene=boss | ?scene=map ──
    const jump = new URLSearchParams(window.location.search).get('scene');
    if (jump) {
      const runState = RunSystem.startNewRun();
      // Demo: desbloquear y enrolar todas las clases (sin tocar el guardado real).
      const all = ['rifleman', 'heavy-gunner', 'medic', 'engineer', 'sniper', 'flamethrower',
        'bombero', 'cientifica', 'veterano', 'gaucho', 'colectivero', 'electricista'];
      runState.unlockedUnitIds = all;
      for (const id of all) if (!runState.roster.some((s) => s.unitId === id)) runState.roster.push(RunSystem.generateRandomSoldier(id));
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

