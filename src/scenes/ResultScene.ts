/**
 * ResultScene — Pantalla de resultados dramática.
 */
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { COLORS, hex, FONTS } from '../ui/colors';

interface ResultData {
  outcome: 'won' | 'lost';
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create(data: ResultData): void {
    const cx = GAME_WIDTH / 2;
    const won = data.outcome === 'won';

    this.drawBackground(won);
    this.startAmbientParticles(won);
    this.drawContent(cx, won);
    this.drawVignette();

    this.cameras.main.fadeIn(800, 0, 0, 0);
  }

  private drawBackground(won: boolean): void {
    const g = this.add.graphics();
    const steps = 30;
    const stepH = GAME_HEIGHT / steps;
    
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      let topColor = won ? COLORS.skyTop : COLORS.hpBg;
      let botColor = won ? COLORS.goldDark : COLORS.hpBad;
      
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(topColor),
        Phaser.Display.Color.IntegerToColor(botColor),
        100, Math.round(t * 100)
      );
      
      // Make it very dark
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), won ? 0.3 : 0.4);
      g.fillRect(0, i * stepH, GAME_WIDTH, stepH + 1);
    }
    
    // Add solid dark background behind the gradient
    this.cameras.main.setBackgroundColor('#0a0c0a');
  }

  private startAmbientParticles(won: boolean): void {
    this.time.addEvent({
      delay: won ? 300 : 100,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(0, GAME_WIDTH);
        const size = Phaser.Math.Between(1, 3);
        const color = won ? COLORS.gold : COLORS.ember;
        const alpha = Phaser.Math.FloatBetween(0.2, 0.6);

        const p = this.add.rectangle(x, -10, size, size, color, alpha);
        
        this.tweens.add({
          targets: p,
          y: GAME_HEIGHT + 20,
          x: x + Phaser.Math.Between(-50, 50),
          alpha: 0,
          duration: Phaser.Math.Between(3000, 6000),
          onComplete: () => p.destroy()
        });
      }
    });
  }

  private drawContent(cx: number, won: boolean): void {
    let delay = 0;

    // Title
    const title = this.add.text(cx, 240, won ? 'BASTION FALLEN' : 'HQ OVERRUN', {
      fontFamily: FONTS.title,
      fontSize: '46px',
      color: won ? hex(COLORS.gold) : hex(COLORS.hpBad),
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 8, fill: true }
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, y: 220, duration: 800, delay });
    delay += 400;

    // Subtitle
    const subText = won 
      ? 'The line held. The dead go back to the ground.' 
      : 'The dead poured through. The front collapsed.';
      
    const sub = this.add.text(cx, 290, subText, {
      fontFamily: FONTS.body,
      fontSize: '18px',
      color: won ? hex(COLORS.ink) : hex(COLORS.inkDim),
      align: 'center',
      fontStyle: 'italic',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: sub, alpha: 1, duration: 800, delay });
    delay += 500;

    // Separator line
    const sep = this.add.graphics().setAlpha(0);
    sep.lineStyle(1, won ? COLORS.goldDark : COLORS.enemy, 0.5);
    sep.beginPath();
    sep.moveTo(cx - 150, 340);
    sep.lineTo(cx + 150, 340);
    sep.strokePath();
    
    this.tweens.add({ targets: sep, alpha: 1, duration: 600, delay });
    delay += 300;

    // Buttons
    this.time.delayedCall(delay, () => {
      this.makeButton(cx, 540, won ? 'NEXT BATTLE' : 'TRY AGAIN', () => this.transition('Battle'), won ? COLORS.allyBase : COLORS.enemyBase);
      this.makeButton(cx, 640, 'MAIN MENU', () => this.transition('MainMenu'), COLORS.metalDark);
    });
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void, fill: number): void {
    const w = 240;
    const h = 72;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-w/2, -h/2, w, h, 8);
    bg.lineStyle(2, COLORS.metalLight, 0.6);
    bg.strokeRoundedRect(-w/2, -h/2, w, h, 8);

    // Inner shadow
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(-w/2, 0, w, h/2, { tl: 0, tr: 0, bl: 8, br: 8 });

    const txt = this.add.text(0, 0, label, {
      fontFamily: FONTS.title,
      fontSize: '28px',
      color: hex(COLORS.textWhite),
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, fill: true }
    }).setOrigin(0.5);

    container.add([bg, txt]);
    container.setAlpha(0);

    this.tweens.add({ targets: container, alpha: 1, y: y - 10, duration: 600, ease: 'Back.easeOut' });

    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    
    zone.on('pointerdown', () => this.tweens.add({ targets: container, scale: 0.95, duration: 60 }));
    zone.on('pointerup', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 60 });
      onClick();
    });
  }

  private transition(sceneName: string): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneName);
    });
  }

  private drawVignette(): void {
    const v = this.add.graphics();
    for (let i = 0; i < 6; i++) {
      v.fillStyle(0x000000, 0.15 - i * 0.02);
      v.fillRect(0, 0, GAME_WIDTH, 40 - i * 5);
      v.fillRect(0, GAME_HEIGHT - 40 + i * 5, GAME_WIDTH, 40 - i * 5);
      v.fillRect(0, 0, 30 - i * 4, GAME_HEIGHT);
      v.fillRect(GAME_WIDTH - 30 + i * 4, 0, 30 - i * 4, GAME_HEIGHT);
    }
  }
}
