/**
 * UnitRenderer — sprite, animación y estado visual de un combatiente.
 * Renderiza personajes ilustrados (PNG transparente) con origen en los pies,
 * apoyados sobre la línea del carril. Sprites procedurales como fallback.
 */
import Phaser from 'phaser';
import { FIELD } from '../utils/constants';
import { COLORS } from '../ui/colors';
import { SpriteFactory } from './SpriteFactory';
import type { Combatant } from '../systems/BattleSystem';

/** Texturas que son arte ilustrado real (ya miran en la dirección correcta). */
const REAL_ART = new Set([
  'unit-rifleman', 'unit-heavy-gunner', 'unit-medic', 'unit-engineer', 'unit-sniper', 'unit-flamethrower',
  'enemy-revenant-grunt', 'enemy-runner-corpse', 'enemy-shielded-revenant', 'enemy-exploder',
  'enemy-dead-officer', 'enemy-general-eisenfaust',
]);

/** Altura de display (px) por tipo de combatiente. */
function displayHeightFor(defId: string, faction: 'ally' | 'enemy'): number {
  switch (defId) {
    case 'general-eisenfaust': return 210; // jefe
    case 'panzer-corpse': return 120;
    case 'shielded-revenant': return 104;
    case 'dead-officer': return 106;
    case 'exploder': return 86;
    case 'rot-hound': return 60;
    case 'barricade': return 76;
    default: return faction === 'ally' ? 94 : 92;
  }
}

/** Desplazamiento de los pies bajo el centro del carril. */
const FOOT_OFFSET = 16;

export class UnitRenderer {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Ellipse;
  private container: Phaser.GameObjects.Container; // barra de vida + nombre
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private hpBarTrail: Phaser.GameObjects.Rectangle;

  private faction: 'ally' | 'enemy';
  private dispW: number;
  private dispH: number;
  private barW: number;

  private walkPhase = Math.random() * Math.PI * 2;
  private trailHpPct = 1;
  private attackFlashTimer = 0;
  private isAttacking = false;

  readonly uid: number;

  constructor(scene: Phaser.Scene, c: Combatant) {
    this.scene = scene;
    this.uid = c.uid;
    this.faction = c.faction;

    const laneY = FIELD.LANES_Y[c.lane];
    const groundY = laneY + FOOT_OFFSET;

    const textureKey = SpriteFactory.getTextureKey(c.defId, c.faction);
    const isReal = REAL_ART.has(textureKey);
    const hasTexture = scene.textures.exists(textureKey);

    this.dispH = displayHeightFor(c.defId, c.faction);

    // Sombra en el piso
    this.shadow = scene.add.ellipse(c.x, groundY, this.dispH * 0.5, this.dispH * 0.14, 0x000000, 0.32);

    // Sprite principal (origen en los pies)
    if (hasTexture) {
      this.sprite = scene.add.image(c.x, groundY, textureKey);
      const src = scene.textures.get(textureKey).getSourceImage() as HTMLImageElement;
      const aspect = src && src.height ? src.width / src.height : 0.6;
      this.dispW = this.dispH * aspect;
      this.sprite.setDisplaySize(this.dispW, this.dispH);
      if (c.faction === 'ally' && c.colorTint && c.colorTint !== 0xffffff) {
        this.sprite.setTint(c.colorTint);
      }
    } else {
      this.sprite = scene.add.image(c.x, groundY, '__DEFAULT');
      this.dispW = this.dispH * 0.55;
      this.sprite.setDisplaySize(this.dispW, this.dispH);
      this.sprite.setTint(c.faction === 'ally' && c.colorTint && c.colorTint !== 0xffffff ? c.colorTint : c.color);
    }
    this.sprite.setOrigin(0.5, 1);

    // Voltear solo los sprites procedurales enemigos (el arte real ya mira a la izquierda)
    if (c.faction === 'enemy' && !isReal) this.sprite.setFlipX(true);

    // Barra de vida + nombre (contenedor sobre la cabeza)
    this.barW = Math.min(64, Math.max(34, this.dispW * 0.7));
    const barH = 5;
    const headY = groundY - this.dispH - 8;

    this.hpBarBg = scene.add.rectangle(0, 0, this.barW + 2, barH, COLORS.hpBg).setOrigin(0.5);
    this.hpBarTrail = scene.add.rectangle(-this.barW / 2, 0, this.barW, barH - 1, COLORS.hpTrail).setOrigin(0, 0.5);
    this.hpBarFill = scene.add.rectangle(-this.barW / 2, 0, this.barW, barH - 1, COLORS.hpGood).setOrigin(0, 0.5);

    const els: Phaser.GameObjects.GameObject[] = [this.hpBarBg, this.hpBarTrail, this.hpBarFill];

    if (c.faction === 'ally' && c.nickname) {
      const nameText = scene.add.text(0, -12, c.nickname, {
        fontFamily: 'Roboto Condensed, sans-serif',
        fontSize: '10px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
      els.push(nameText);
    }

    this.container = scene.add.container(c.x, headY, els as any);

    this.applyDepth(groundY);

    // Animación de aparición
    this.sprite.setAlpha(0);
    this.sprite.scaleX *= 0.6;
    this.sprite.scaleY *= 0.6;
    const targetSX = this.sprite.scaleX / 0.6;
    const targetSY = this.sprite.scaleY / 0.6;
    scene.tweens.add({ targets: this.sprite, alpha: 1, scaleX: targetSX, scaleY: targetSY, duration: 220, ease: 'Back.easeOut' });
  }

  private applyDepth(groundY: number): void {
    this.shadow.setDepth(groundY - 1);
    this.sprite.setDepth(groundY);
    this.container.setDepth(groundY + 1);
  }

  update(c: Combatant, delta: number): void {
    const laneY = FIELD.LANES_Y[c.lane];
    const groundY = laneY + FOOT_OFFSET;

    this.sprite.x = c.x;
    this.shadow.x = c.x;
    this.shadow.y = groundY;
    this.container.x = c.x;
    this.container.y = groundY - this.dispH - 8;

    this.applyDepth(groundY);

    // Bobbing de caminata (estructuras no se mueven)
    let bob = 0;
    if (c.defId !== 'barricade') {
      this.walkPhase += delta * 0.012;
      bob = Math.abs(Math.sin(this.walkPhase)) * 2.5;
    }
    this.sprite.y = groundY - bob;

    if (this.attackFlashTimer > 0) {
      this.attackFlashTimer -= delta;
      if (this.attackFlashTimer <= 0) {
        if (this.faction === 'ally' && c.colorTint && c.colorTint !== 0xffffff) this.sprite.setTint(c.colorTint);
        else this.sprite.clearTint();
        this.isAttacking = false;
      }
    }

    // Barra de vida
    const hpPct = Phaser.Math.Clamp(c.hp / c.maxHp, 0, 1);
    if (hpPct < this.trailHpPct) this.trailHpPct = Phaser.Math.Linear(this.trailHpPct, hpPct, 0.05);
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
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.attackFlashTimer = 90;
    this.sprite.setTint(0xffffff);
    const recoil = this.faction === 'ally' ? -3 : 3;
    this.scene.tweens.add({ targets: this.sprite, x: this.sprite.x + recoil, duration: 50, yoyo: true, ease: 'Power2' });
  }

  playDeath(onComplete?: () => void): void {
    const fallDir = this.faction === 'ally' ? -1 : 1;
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      angle: fallDir * 80,
      y: this.sprite.y + 8,
      duration: 380,
      ease: 'Power2',
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
