/**
 * UnitRenderer — sprite, animación y estado visual de un combatiente.
 * Personajes ilustrados (PNG transparente) con los pies sobre la línea del carril,
 * escala de profundidad por carril y animación procedural (marcha, ataque, golpe, muerte).
 */
import Phaser from 'phaser';
import { FIELD } from '../utils/constants';
import { COLORS, lerpColor } from '../ui/colors';
import { SpriteFactory } from './SpriteFactory';
import type { Combatant } from '../systems/BattleSystem';

/** Color de niebla para perspectiva atmosférica (carriles del fondo). */
const FOG_TINT = 0x9fb0ba;

const REAL_ART = new Set([
  'unit-rifleman', 'unit-heavy-gunner', 'unit-medic', 'unit-engineer', 'unit-sniper', 'unit-flamethrower',
  'unit-bombero', 'unit-cientifica', 'unit-veterano', 'unit-gaucho', 'unit-colectivero', 'unit-electricista',
  'enemy-revenant-grunt', 'enemy-runner-corpse', 'enemy-shielded-revenant', 'enemy-exploder',
  'enemy-dead-officer', 'enemy-occultist', 'enemy-panzer-corpse', 'enemy-rot-hound', 'enemy-toxic-carrier',
  'enemy-general-eisenfaust', 'enemy-doctor-totenkopf', 'enemy-panzer-corpse-engine',
]);

const FRAME_ANIMATED = new Set(['doctor-totenkopf', 'panzer-corpse-engine']);

/** Altura base de display (px) por tipo, antes de la escala de carril. */
function baseHeightFor(defId: string): number {
  switch (defId) {
    case 'general-eisenfaust': return 188; // jefe
    case 'doctor-totenkopf': return 188;
    case 'panzer-corpse-engine': return 220;
    case 'panzer-corpse': return 132; // mutante blindado (mini-boss)
    case 'shielded-revenant': return 96;
    case 'dead-officer': return 92;
    case 'occultist': return 90;
    case 'toxic-carrier': return 88;
    case 'exploder': return 74;
    case 'rot-hound': return 50; // perro (cuadrúpedo, bajo)
    case 'veterano': return 88;
    case 'barricade': return 66;
    default: return 80;
  }
}

export class UnitRenderer {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private container: Phaser.GameObjects.Container;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private hpBarTrail: Phaser.GameObjects.Rectangle;

  private faction: 'ally' | 'enemy';
  private frameAnimated: boolean;
  private dispW: number;
  private dispH: number;
  private barW: number;
  private baseScaleX: number;
  private baseScaleY: number;
  private colorTint = 0xffffff;

  private walkPhase = Math.random() * Math.PI * 2;
  private idlePhase = Math.random() * Math.PI * 2;
  private trailHpPct = 1;
  private lastX: number;
  private lastHp: number;
  private attackFlashTimer = 0;
  private hitFlashTimer = 0;
  private spawned = false;

  readonly uid: number;

  constructor(scene: Phaser.Scene, c: Combatant) {
    this.scene = scene;
    this.uid = c.uid;
    this.faction = c.faction;
    this.frameAnimated = FRAME_ANIMATED.has(c.defId);
    this.lastX = c.x;
    this.lastHp = c.hp;

    const groundY = FIELD.LANES_Y[c.lane];
    const scale = FIELD.laneScale(c.lane);

    const textureKey = SpriteFactory.getTextureKey(c.defId, c.faction);
    const isReal = REAL_ART.has(textureKey);
    const hasTexture = scene.textures.exists(textureKey);

    this.dispH = baseHeightFor(c.defId) * scale;

    // Tinte de base (color del soldado o blanco) mezclado con niebla según profundidad.
    const baseTint = (c.faction === 'ally' && c.colorTint && c.colorTint !== 0xffffff) ? c.colorTint
      : (hasTexture ? 0xffffff : c.color);
    const fogAmount = Phaser.Math.Clamp(0.30 - scale * 0.24, 0, 0.30); // atrás ~0.10, adelante ~0.05
    this.colorTint = lerpColor(baseTint, FOG_TINT, fogAmount);

    if (hasTexture) {
      this.sprite = scene.add.image(c.x, groundY, textureKey);
      const aspect = this.sprite.frame.height ? this.sprite.frame.width / this.sprite.frame.height : 0.6;
      this.dispW = this.dispH * aspect;
      this.sprite.setDisplaySize(this.dispW, this.dispH);
    } else {
      this.sprite = scene.add.image(c.x, groundY, '__DEFAULT');
      this.dispW = this.dispH * 0.55;
      this.sprite.setDisplaySize(this.dispW, this.dispH);
    }
    this.sprite.setTint(this.colorTint);
    this.sprite.setOrigin(0.5, 1);
    if (c.faction === 'enemy' && !isReal) this.sprite.setFlipX(true);

    this.baseScaleX = this.sprite.scaleX;
    this.baseScaleY = this.sprite.scaleY;

    // Sombra de contacto suave en el piso (asienta a la unidad).
    if (scene.textures.exists('soft-shadow')) {
      this.shadow = scene.add.image(c.x, groundY, 'soft-shadow');
      this.shadow.setDisplaySize(this.dispW * 1.2, this.dispH * 0.32);
      this.shadow.setAlpha(0.5);
    } else {
      this.shadow = scene.add.image(c.x, groundY, '__DEFAULT');
      this.shadow.setDisplaySize(this.dispW * 0.6, this.dispH * 0.12);
      this.shadow.setTint(0x000000).setAlpha(0.3);
    }

    // Barra de vida + nombre
    this.barW = Math.min(60, Math.max(32, this.dispW * 0.7));
    const barH = 5;

    this.hpBarBg = scene.add.rectangle(0, 0, this.barW + 2, barH, COLORS.hpBg).setOrigin(0.5);
    this.hpBarTrail = scene.add.rectangle(-this.barW / 2, 0, this.barW, barH - 1, COLORS.hpTrail).setOrigin(0, 0.5);
    this.hpBarFill = scene.add.rectangle(-this.barW / 2, 0, this.barW, barH - 1, COLORS.hpGood).setOrigin(0, 0.5);
    const els: Phaser.GameObjects.GameObject[] = [this.hpBarBg, this.hpBarTrail, this.hpBarFill];

    if (c.faction === 'ally' && c.nickname) {
      const nameText = scene.add.text(0, -12, c.nickname, {
        fontFamily: 'Roboto Condensed, sans-serif',
        fontSize: '10px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5);
      els.push(nameText);
    }

    this.container = scene.add.container(c.x, groundY - this.dispH - 8, els as any);
    this.applyDepth(groundY);

    // Aparición
    this.sprite.setAlpha(0);
    this.sprite.scaleX = this.baseScaleX * 0.55;
    this.sprite.scaleY = this.baseScaleY * 0.55;
    scene.tweens.add({
      targets: this.sprite, alpha: 1, scaleX: this.baseScaleX, scaleY: this.baseScaleY,
      duration: 240, ease: 'Back.easeOut', onComplete: () => { this.spawned = true; },
    });
  }

  private applyDepth(groundY: number): void {
    this.shadow.setDepth(groundY - 1);
    this.sprite.setDepth(groundY);
    this.container.setDepth(groundY + 1);
  }

  update(c: Combatant, delta: number): void {
    const groundY = FIELD.LANES_Y[c.lane];

    // ── Detección de movimiento (para la animación de marcha) ──
    const moved = Math.abs(c.x - this.lastX);
    const isMoving = moved > 0.05 && c.defId !== 'barricade';
    this.lastX = c.x;

    // ── Golpe recibido ──
    if (c.hp < this.lastHp - 0.01) {
      this.hitFlashTimer = 110;
    }
    this.lastHp = c.hp;

    this.sprite.x = c.x;
    this.shadow.x = c.x;
    this.shadow.y = groundY;
    this.container.x = c.x;
    this.container.y = groundY - this.dispH - 8;
    this.applyDepth(groundY);

    // ── Animación procedural ──
    let bob = 0;
    let lean = 0;
    let squashY = 1;
    if (this.spawned) {
      if (isMoving) {
        this.walkPhase += delta * 0.020;
        // rebote de paso (los pies tocan el piso en cada paso)
        bob = Math.abs(Math.sin(this.walkPhase)) * 3.2;
        // balanceo del cuerpo
        lean = Math.sin(this.walkPhase) * 4;
        squashY = 1 + Math.sin(this.walkPhase * 2) * 0.03;
      } else {
        // respiración en idle / combate
        this.idlePhase += delta * 0.004;
        squashY = 1 + Math.sin(this.idlePhase) * 0.02;
        bob = 0;
      }
    }

    // golpe: tinte rojo + temblor
    let jitter = 0;
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      jitter = (Math.random() - 0.5) * 3;
      this.sprite.setTint(0xff5555);
    } else if (this.attackFlashTimer > 0) {
      this.attackFlashTimer -= delta;
      if (this.attackFlashTimer <= 0) this.sprite.setTint(this.colorTint);
    } else {
      this.sprite.setTint(this.colorTint);
    }

    this.sprite.x = c.x + jitter;
    this.sprite.y = groundY - bob;
    this.sprite.angle = lean;
    this.sprite.scaleY = this.baseScaleY * squashY;

    if (this.frameAnimated) {
      if (this.hitFlashTimer > 0) this.sprite.setFrame(5);
      else if (this.attackFlashTimer <= 0) this.sprite.setFrame(isMoving ? (Math.sin(this.walkPhase) > 0 ? 1 : 2) : 0);
    }

    // ── Barra de vida ──
    const hpPct = Phaser.Math.Clamp(c.hp / c.maxHp, 0, 1);
    if (hpPct < this.trailHpPct) this.trailHpPct = Phaser.Math.Linear(this.trailHpPct, hpPct, 0.06);
    else this.trailHpPct = hpPct;
    this.hpBarFill.width = Math.max(1, this.barW * hpPct);
    this.hpBarTrail.width = Math.max(1, this.barW * this.trailHpPct);
    this.hpBarFill.fillColor = hpPct > 0.6 ? COLORS.hpGood : (hpPct > 0.3 ? COLORS.warn : COLORS.hpBad);
    const showBar = hpPct < 1;
    this.hpBarBg.setVisible(showBar);
    this.hpBarFill.setVisible(showBar);
    this.hpBarTrail.setVisible(showBar);
  }

  playAttack(): void {
    this.attackFlashTimer = this.frameAnimated ? 220 : 90;
    if (this.frameAnimated) {
      this.sprite.setFrame(3);
      this.scene.time.delayedCall(80, () => {
        if (this.sprite?.active) this.sprite.setFrame(4);
      });
    }
    this.sprite.setTint(0xffffff);
    const recoil = this.faction === 'ally' ? -4 : 4;
    this.scene.tweens.add({ targets: this.sprite, x: this.sprite.x + recoil, duration: 60, yoyo: true, ease: 'Power2' });
  }

  playDeath(onComplete?: () => void): void {
    const fallDir = this.faction === 'ally' ? -1 : 1;
    this.sprite.setTint(this.colorTint);
    this.scene.tweens.add({
      targets: this.sprite, alpha: 0, angle: fallDir * 82, scaleY: this.baseScaleY * 0.8,
      y: this.sprite.y + 8, duration: 380, ease: 'Power2',
      onComplete: () => { this.destroy(); onComplete?.(); },
    });
    this.scene.tweens.add({ targets: [this.shadow, this.container], alpha: 0, duration: 280 });
  }

  destroy(): void {
    this.sprite?.destroy();
    this.shadow?.destroy();
    this.container?.destroy();
  }
}
