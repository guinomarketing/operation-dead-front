/**
 * UnitRenderer — Maneja el sprite, animación y estado visual de un combatiente.
 * Cada Combatant en el BattleSystem tiene un UnitRenderer asociado.
 */
import Phaser from 'phaser';
import { FIELD } from '../utils/constants';
import { COLORS } from '../ui/colors';
import { SpriteFactory } from './SpriteFactory';
import type { Combatant } from '../systems/BattleSystem';

/** Display size for units on screen. Texture is 2x this. */
const DISPLAY_W = 32;
const DISPLAY_H = 48;
const DOG_DISPLAY_H = 28;

export class UnitRenderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Ellipse;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private hpBarTrail: Phaser.GameObjects.Rectangle;

  private faction: 'ally' | 'enemy';
  private isDog: boolean;
  private displayH: number;

  // Animation state
  private walkPhase = 0;
  private trailHpPct = 1;
  private attackFlashTimer = 0;
  private isAttacking = false;

  /** UID of the combatant this renderer is tracking. */
  readonly uid: number;

  constructor(scene: Phaser.Scene, c: Combatant) {
    this.scene = scene;
    this.uid = c.uid;
    this.faction = c.faction;
    this.isDog = c.defId === 'rot-hound';
    this.displayH = this.isDog ? DOG_DISPLAY_H : DISPLAY_H;

    const y = FIELD.LANES_Y[c.lane];
    const textureKey = SpriteFactory.getTextureKey(c.defId, c.faction);
    const isAssetImage = textureKey === 'unit-rifleman' || textureKey === 'enemy-revenant-grunt';

    const dispW = isAssetImage ? 56 : DISPLAY_W;
    const dispH = isAssetImage ? 56 : this.displayH;

    // Shadow
    this.shadow = scene.add.ellipse(c.x, y + dispH / 2 - 2, 24, 8, 0x000000, 0.25);
    this.shadow.setDepth(y - 1);

    // Main sprite
    const hasTexture = scene.textures.exists(textureKey);
    let sourceW = 64;
    let sourceH = 96;

    if (hasTexture) {
      this.sprite = scene.add.image(c.x, y, textureKey);
      const tex = scene.textures.get(textureKey);
      const srcImg = tex.getSourceImage() as HTMLImageElement;
      if (srcImg) {
        sourceW = srcImg.width;
        sourceH = srcImg.height;
      }
      this.sprite.setDisplaySize(dispW, dispH);
    } else {
      // Fallback: create a colored rectangle image via a temp texture
      this.sprite = scene.add.image(c.x, y, '__DEFAULT');
      this.sprite.setDisplaySize(dispW, dispH);
      this.sprite.setTint(c.color);
    }

    // Flip enemies to face left
    if (c.faction === 'enemy') {
      this.sprite.setFlipX(true);
    }

    this.sprite.setOrigin(0.5, 0.5);

    // Health bar
    const barW = dispW + 4;
    const barH = 4;
    const barY = -dispH / 2 - 8;

    this.hpBarBg = scene.add.rectangle(0, barY, barW, barH, COLORS.hpBg).setOrigin(0.5);
    this.hpBarTrail = scene.add.rectangle(-barW / 2, barY, barW, barH - 1, COLORS.hpTrail).setOrigin(0, 0.5);
    this.hpBarFill = scene.add.rectangle(-barW / 2, barY, barW, barH - 1, COLORS.hpGood).setOrigin(0, 0.5);

    // Container to group everything (easier positioning)
    this.container = scene.add.container(c.x, y, [
      this.hpBarBg,
      this.hpBarTrail,
      this.hpBarFill,
    ]);
    this.container.setDepth(y);

    this.sprite.setDepth(y + 1);
    this.shadow.setDepth(y - 1);

    // Spawn animation
    this.sprite.setAlpha(0);
    this.sprite.setScale(0);

    const scaleXDest = (c.faction === 'enemy' ? -1 : 1) * (dispW / sourceW);
    const scaleYDest = dispH / sourceH;

    scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scaleX: scaleXDest,
      scaleY: scaleYDest,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  /** Sync the renderer with the latest combatant state. */
  update(c: Combatant, delta: number): void {
    const y = FIELD.LANES_Y[c.lane];

    // Position
    this.sprite.x = c.x;
    this.sprite.y = y;
    this.shadow.x = c.x;
    this.shadow.y = y + this.displayH / 2 - 2;
    this.container.x = c.x;
    this.container.y = y;

    // Depth sorting by Y (lower Y = further back)
    this.sprite.setDepth(y + 1);
    this.shadow.setDepth(y - 1);
    this.container.setDepth(y + 2);

    // Walk animation (bobbing - structures don't bob)
    if (c.defId !== 'barricade') {
      this.walkPhase += delta * 0.008;
      const bobAmount = Math.sin(this.walkPhase) * 1.5;
      this.sprite.y = y + bobAmount;
    }

    // Attack flash
    if (this.attackFlashTimer > 0) {
      this.attackFlashTimer -= delta;
      if (this.attackFlashTimer <= 0) {
        this.sprite.clearTint();
        this.isAttacking = false;
      }
    }

    // Health bar
    const hpPct = Phaser.Math.Clamp(c.hp / c.maxHp, 0, 1);
    const barW = DISPLAY_W + 4;

    // Trail lerp (slowly catches up)
    if (hpPct < this.trailHpPct) {
      this.trailHpPct = Phaser.Math.Linear(this.trailHpPct, hpPct, 0.05);
    } else {
      this.trailHpPct = hpPct;
    }

    this.hpBarFill.width = Math.max(1, barW * hpPct);
    this.hpBarTrail.width = Math.max(1, barW * this.trailHpPct);

    // HP bar color
    if (hpPct > 0.6) {
      this.hpBarFill.fillColor = COLORS.hpGood;
    } else if (hpPct > 0.3) {
      this.hpBarFill.fillColor = COLORS.warn;
    } else {
      this.hpBarFill.fillColor = COLORS.hpBad;
    }

    // Hide HP bar when full
    const showBar = hpPct < 1;
    this.hpBarBg.setVisible(showBar);
    this.hpBarFill.setVisible(showBar);
    this.hpBarTrail.setVisible(showBar);
  }

  /** Trigger attack visual feedback. */
  playAttack(): void {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.attackFlashTimer = 100;
    this.sprite.setTint(0xffffff);

    // Recoil animation
    const recoilDir = this.faction === 'ally' ? -3 : 3;
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + recoilDir,
      duration: 50,
      yoyo: true,
      ease: 'Power2',
    });
  }

  /** Play death animation and clean up after. */
  playDeath(onComplete?: () => void): void {
    // Fall animation (structures collapse downward instead of falling sideways)
    if (this.sprite.texture.key === 'unit-barricade') {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        scaleY: 0,
        y: this.sprite.y + 15,
        duration: 350,
        ease: 'Linear',
        onComplete: () => {
          this.destroy();
          onComplete?.();
        },
      });
    } else {
      const fallDir = this.faction === 'ally' ? -1 : 1;
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        angle: fallDir * 90,
        y: this.sprite.y + 10,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          this.destroy();
          onComplete?.();
        },
      });
    }

    // Fade out shadow and HP bar
    this.scene.tweens.add({
      targets: [this.shadow, this.container],
      alpha: 0,
      duration: 300,
    });
  }

  /** Immediate cleanup. */
  destroy(): void {
    this.sprite?.destroy();
    this.shadow?.destroy();
    this.container?.destroy();
  }
}
