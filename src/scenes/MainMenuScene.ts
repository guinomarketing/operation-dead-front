/**
 * MainMenuScene — Menú principal con calidad premium.
 * Atmósfera bélica oscura, partículas de ceniza y tipografía militar.
 */
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { COLORS, hex, FONTS } from '../ui/colors';

export class MainMenuScene extends Phaser.Scene {
  private ambientTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    this.drawBackground();
    this.startAmbientParticles();
    this.drawSigil(cx, 230);
    this.drawText(cx);
    this.buildDeployButton(cx, 680);
    this.drawVignette();

    // Camera fade in
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }

  private drawBackground(): void {
    const g = this.add.graphics();
    
    // Sky gradient
    const steps = 30;
    const stepH = GAME_HEIGHT / steps;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(COLORS.skyTop),
        Phaser.Display.Color.IntegerToColor(COLORS.skyHorizon),
        100, Math.round(t * 100)
      );
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
      g.fillRect(0, i * stepH, GAME_WIDTH, stepH + 1);
    }

    // Distant ruins silhouette at bottom
    g.fillStyle(0x0a0a0a, 0.9);
    g.fillRect(0, GAME_HEIGHT - 100, GAME_WIDTH, 100);
    g.fillRect(50, GAME_HEIGHT - 140, 40, 40);
    g.fillTriangle(40, GAME_HEIGHT - 100, 70, GAME_HEIGHT - 160, 100, GAME_HEIGHT - 100);
    g.fillRect(200, GAME_HEIGHT - 120, 60, 20);
    g.fillRect(380, GAME_HEIGHT - 150, 30, 50);
    g.fillRect(420, GAME_HEIGHT - 180, 8, 80);

    // Subtle fog
    g.fillStyle(COLORS.skyMid, 0.15);
    g.fillEllipse(GAME_WIDTH / 2, GAME_HEIGHT - 50, GAME_WIDTH * 1.5, 150);
  }

  private startAmbientParticles(): void {
    this.ambientTimer = this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(0, GAME_WIDTH);
        const isEmber = Math.random() < 0.2;
        const size = isEmber ? Phaser.Math.Between(2, 4) : Phaser.Math.Between(1, 3);
        const color = isEmber ? COLORS.ember : COLORS.ash;
        const alpha = isEmber ? Phaser.Math.FloatBetween(0.5, 0.9) : Phaser.Math.FloatBetween(0.1, 0.4);

        const p = this.add.rectangle(x, -10, size, size, color, alpha);
        
        this.tweens.add({
          targets: p,
          y: GAME_HEIGHT + 20,
          x: x + Phaser.Math.Between(-80, 80),
          alpha: 0,
          duration: Phaser.Math.Between(4000, 8000),
          onComplete: () => p.destroy()
        });
      }
    });
  }

  private drawSigil(x: number, y: number): void {
    const container = this.add.container(x, y);
    const g = this.add.graphics();
    container.add(g);

    // Inner glow
    const glow = this.add.graphics();
    glow.fillStyle(COLORS.serumGlow, 0.15);
    glow.fillCircle(0, 0, 70);
    container.addAt(glow, 0);

    this.tweens.add({
      targets: glow,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Outer ring (broken)
    g.lineStyle(6, COLORS.serum, 0.9);
    g.beginPath();
    g.arc(0, 0, 60, -Math.PI * 0.8, Math.PI * 1.8);
    g.strokePath();

    // The Iron Talon marks
    g.lineStyle(8, COLORS.enemy, 1);
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(i * 18, -30);
      g.lineTo(i * 12, 40);
      g.strokePath();
    }
  }

  private drawText(cx: number): void {
    // Main Title
    this.add.text(cx, 360, 'OPERATION', {
      fontFamily: FONTS.title,
      fontSize: '48px',
      color: hex(COLORS.ink),
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5);

    this.add.text(cx, 415, 'DEAD FRONT', {
      fontFamily: FONTS.title,
      fontSize: '56px',
      color: hex(COLORS.serum),
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 8, fill: true }
    }).setOrigin(0.5);

    // Lore text (fades in)
    const lore = this.add.text(cx, 490, 'The dead march under a stolen flag.\nHold the line. Bury them again.', {
      fontFamily: FONTS.body,
      fontSize: '16px',
      color: hex(COLORS.inkDim),
      align: 'center',
      fontStyle: 'italic',
      lineSpacing: 8,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: lore,
      alpha: 1,
      duration: 1500,
      delay: 500,
      ease: 'Power2'
    });

    // Sub-title
    this.add.text(cx, 560, 'OPERATION FIRST LIGHT', {
      fontFamily: FONTS.ui,
      fontSize: '14px',
      color: hex(COLORS.gold),
      fontStyle: 'bold',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
    }).setOrigin(0.5);

    // Version
    this.add.text(cx, GAME_HEIGHT - 25, 'MVP 0.1 · PROTO-BUILD', {
      fontFamily: FONTS.ui,
      fontSize: '11px',
      color: hex(COLORS.inkDim),
    }).setOrigin(0.5);
  }

  private buildDeployButton(x: number, y: number): void {
    const w = 260;
    const h = 76;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.allyBase, 1);
    bg.fillRoundedRect(-w/2, -h/2, w, h, 8);
    bg.lineStyle(3, COLORS.allyHelmetLight, 0.8);
    bg.strokeRoundedRect(-w/2, -h/2, w, h, 8);

    // Inner shadow/gradient effect
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(-w/2, 0, w, h/2, { tl: 0, tr: 0, bl: 8, br: 8 });

    const txt = this.add.text(0, 0, 'DEPLOY', {
      fontFamily: FONTS.title,
      fontSize: '32px',
      color: hex(COLORS.textWhite),
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, fill: true }
    }).setOrigin(0.5);

    container.add([bg, txt]);

    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.95, duration: 60 });
    });

    zone.on('pointerup', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 60 });
      // Transition
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.ambientTimer?.destroy();
        this.scene.start('Battle');
      });
    });

    // Pulse glow
    this.tweens.add({
      targets: container,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private drawVignette(): void {
    const v = this.add.graphics();
    for (let i = 0; i < 4; i++) {
      v.fillStyle(0x000000, 0.15 - i * 0.03);
      v.fillRect(0, 0, GAME_WIDTH, 30 - i * 5);
      v.fillRect(0, GAME_HEIGHT - 30 + i * 5, GAME_WIDTH, 30 - i * 5);
      v.fillRect(0, 0, 20 - i * 4, GAME_HEIGHT);
      v.fillRect(GAME_WIDTH - 20 + i * 4, 0, 20 - i * 4, GAME_HEIGHT);
    }
  }
}
