import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { Audio2 } from '../systems/AudioSystem';

/**
 * StoryScene — intro narrativa corta al iniciar una run.
 * Key art de fondo + páginas de texto. Lleva al mapa de la run.
 */
const PAGES = [
  'PATAGONIA. Hoy.\n\nBajo el hielo y la roca, un búnker que la guerra olvidó nunca dejó de funcionar.',
  'Adentro, la Orden del Cóndor Negro siguió con sus experimentos: biología, ocultismo y muerte.\n\nHasta que algo se soltó.',
  'El virus levantó a los muertos del Reich. Oficiales, perros, mutaciones.\nAhora marchan sobre el país.',
  'No somos soldados perfectos.\nSomos los que decidimos no arrodillarnos.\n\nSostené la línea. Enterralos de nuevo.',
];

export class StoryScene extends Phaser.Scene {
  private uiContainer!: HTMLElement | null;
  private background?: Phaser.GameObjects.Image;

  constructor() {
    super('Story');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#07090a');
    if (this.textures.exists('story-01')) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'story-01');
      const cover = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
      bg.setScale(cover);
      this.background = bg;
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05070a, 0.16);
    }
    this.cameras.main.fadeIn(700, 0, 0, 0);
    Audio2.unlock();
    Audio2.playMusic('menu');
    this.buildOverlay();
  }

  private buildOverlay(): void {
    this.uiContainer = document.getElementById('ui-layer');
    if (!this.uiContainer) { this.goMap(); return; }
    this.uiContainer.innerHTML = '';

    const root = document.createElement('div');
    Object.assign(root.style, {
      position: 'absolute', inset: '0', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '7%', boxSizing: 'border-box',
      pointerEvents: 'auto',
      background: 'linear-gradient(to bottom, rgba(5,7,8,0.1) 40%, rgba(5,7,8,0.85) 100%)',
    } as CSSStyleDeclaration);

    const text = document.createElement('div');
    Object.assign(text.style, {
      maxWidth: '620px', width: '84%', minHeight: '120px', textAlign: 'center',
      fontFamily: 'var(--font-body)', fontSize: '20px', color: '#f0ece0', lineHeight: '1.5',
      whiteSpace: 'pre-line', textShadow: '0 2px 6px #000', marginBottom: '18px',
    } as CSSStyleDeclaration);

    const dots = document.createElement('div');
    Object.assign(dots.style, { color: 'var(--primary)', fontSize: '14px', marginBottom: '14px' } as CSSStyleDeclaration);

    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', gap: '14px' } as CSSStyleDeclaration);

    const skip = document.createElement('button');
    skip.className = 'btn-primary';
    skip.innerText = 'SALTAR';
    skip.style.background = '#2a2a24'; skip.style.color = '#ddd';
    skip.style.padding = '10px 22px';
    skip.onclick = () => { Audio2.play('uiClick'); this.goMap(); };

    const next = document.createElement('button');
    next.className = 'btn-primary';
    next.style.padding = '10px 30px';

    row.appendChild(skip); row.appendChild(next);
    root.appendChild(text); root.appendChild(dots); root.appendChild(row);
    this.uiContainer.appendChild(root);

    const requestedPage = Number(new URLSearchParams(window.location.search).get('storyPage') || '1') - 1;
    let i = Phaser.Math.Clamp(Number.isFinite(requestedPage) ? requestedPage : 0, 0, PAGES.length - 1);
    let firstRender = true;
    const render = () => {
      this.showPanel(i, !firstRender);
      firstRender = false;
      text.style.opacity = '0';
      window.setTimeout(() => { text.innerText = PAGES[i]; text.style.transition = 'opacity 0.4s'; text.style.opacity = '1'; }, 60);
      dots.innerText = PAGES.map((_, k) => (k === i ? '●' : '○')).join(' ');
      next.innerText = i < PAGES.length - 1 ? 'CONTINUAR ›' : 'COMENZAR ⚔';
    };
    next.onclick = () => {
      Audio2.play('uiClick');
      i++;
      if (i >= PAGES.length) { this.goMap(); return; }
      render();
    };
    render();
  }

  private showPanel(index: number, animate: boolean): void {
    if (!this.background) return;
    const textureKey = `story-0${index + 1}`;
    if (!this.textures.exists(textureKey) || this.background.texture.key === textureKey) return;
    const applyTexture = () => {
      if (!this.background) return;
      this.background.setTexture(textureKey);
      const cover = Math.max(GAME_WIDTH / this.background.width, GAME_HEIGHT / this.background.height);
      this.background.setScale(cover);
    };
    if (!animate) {
      applyTexture();
      this.background.setAlpha(1);
      return;
    }
    this.tweens.killTweensOf(this.background);
    this.tweens.add({
      targets: this.background,
      alpha: 0.15,
      duration: 160,
      onComplete: () => {
        applyTexture();
        if (!this.background) return;
        this.tweens.add({ targets: this.background, alpha: 1, duration: 320 });
      },
    });
  }

  private goMap(): void {
    if (this.uiContainer) this.uiContainer.innerHTML = '';
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
  }
}
