import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { RunSystem } from '../systems/RunSystem';
import { Audio2 } from '../systems/AudioSystem';
import { MetaProgression, UNLOCK_CATALOG } from '../systems/MetaProgression';
import { UNIT_INDEX } from '../data/units';

export class MainMenuScene extends Phaser.Scene {
  private uiContainer!: HTMLElement | null;
  private background?: Phaser.GameObjects.Image;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    // Inicializar / reiniciar mejoras de la run
    this.game.registry.set('upgrades', []);

    // Dibujar el nuevo fondo premium
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'keyart-main');
    this.background = bg;
    // Escalar para que cubra la pantalla manteniendo la relación de aspecto
    const scaleX = GAME_WIDTH / bg.width;
    const scaleY = GAME_HEIGHT / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);

    // Fade in sutil
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Desbloquear audio + música de menú al primer gesto del usuario
    const unlockOnce = () => { Audio2.unlock(); Audio2.playMusic('menu'); };
    document.addEventListener('pointerdown', unlockOnce, { once: true });

    // Crear Interfaz HTML
    this.createHTMLMenu();
    if (new URLSearchParams(window.location.search).get('panel') === 'unlocks') {
      this.time.delayedCall(100, () => this.openUnlocksOverlay());
    }
  }

  private createHTMLMenu() {
    this.uiContainer = document.getElementById('ui-layer');
    if (!this.uiContainer) return;

    // Limpiar UI previa si existiese
    this.uiContainer.innerHTML = '';

    // Crear contenedor principal del menú
    const menuDiv = document.createElement('div');
    menuDiv.id = 'main-menu-ui';

    const title = document.createElement('h1');
    title.innerHTML = 'PATAGONIA<br/>Z';

    const subtitle = document.createElement('p');
    subtitle.innerText = 'La Patagonia no se entrega.\nSostené la línea. Enterralos de nuevo.';
    subtitle.style.fontSize = '1.2rem';
    subtitle.style.color = '#ccc';
    subtitle.style.textAlign = 'center';
    subtitle.style.marginBottom = '3rem';
    subtitle.style.fontStyle = 'italic';
    subtitle.style.textShadow = '0 2px 4px rgba(0,0,0,0.8)';

    const startBtn = document.createElement('button');
    startBtn.className = 'btn-primary';
    startBtn.innerText = 'DESPLEGAR';
    startBtn.style.padding = '16px 48px';
    startBtn.style.fontSize = '1.8rem';
    
    startBtn.onclick = () => { Audio2.unlock(); Audio2.play('uiClick'); this.startGame(menuDiv); };

    const unlockBtn = document.createElement('button');
    unlockBtn.className = 'btn-primary';
    unlockBtn.innerText = '★ DESBLOQUEOS';
    unlockBtn.style.marginTop = '14px';
    unlockBtn.style.padding = '10px 28px';
    unlockBtn.style.fontSize = '1.1rem';
    unlockBtn.style.background = '#2a2a24';
    unlockBtn.style.color = '#f0d070';
    unlockBtn.onclick = () => { Audio2.unlock(); Audio2.play('uiClick'); this.openUnlocksOverlay(); };

    menuDiv.appendChild(title);
    menuDiv.appendChild(subtitle);
    menuDiv.appendChild(startBtn);
    menuDiv.appendChild(unlockBtn);

    this.uiContainer.appendChild(menuDiv);
  }

  private openUnlocksOverlay(): void {
    if (!this.uiContainer) return;
    this.setBackground('hq-progression');
    const menu = document.getElementById('main-menu-ui');
    if (menu) menu.style.visibility = 'hidden';
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'absolute', inset: '0', background: 'rgba(8,10,8,0.62)', zIndex: '300',
      pointerEvents: 'auto', display: 'flex', flexDirection: 'column', padding: '18px 22px', boxSizing: 'border-box',
    } as CSSStyleDeclaration);

    const render = () => {
      overlay.innerHTML = '';
      const header = document.createElement('div');
      Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #3f3f3f', paddingBottom: '10px', marginBottom: '12px' } as CSSStyleDeclaration);
      const h = document.createElement('div');
      h.innerHTML = `<span style="font-family:var(--font-title); font-size:22px; color:var(--primary);">CUARTEL · DESBLOQUEOS</span> <span style="color:#f0d070; font-family:var(--font-title); margin-left:14px;">★ ${MetaProgression.getMedals()} medallas</span>`;
      const close = document.createElement('button');
      close.className = 'btn-primary'; close.innerText = 'VOLVER'; close.style.padding = '6px 16px'; close.style.fontSize = '12px';
      close.onclick = () => {
        Audio2.play('uiClick');
        overlay.remove();
        if (menu) menu.style.visibility = 'visible';
        this.setBackground('keyart-main');
      };
      header.appendChild(h); header.appendChild(close);
      overlay.appendChild(header);

      const sub = document.createElement('div');
      sub.innerText = 'Empezás cada campaña con el Conscripto. Gastá medallas (ganadas al ganar combates y completar runs) para sumar nuevas clases a tu plantel inicial.';
      Object.assign(sub.style, { color: '#aaa', fontSize: '12px', marginBottom: '12px' } as CSSStyleDeclaration);
      overlay.appendChild(sub);

      const grid = document.createElement('div');
      Object.assign(grid.style, { flex: '1', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', alignContent: 'start' } as CSSStyleDeclaration);

      for (const entry of UNLOCK_CATALOG) {
        const def = UNIT_INDEX[entry.id];
        if (!def) continue;
        const unlocked = MetaProgression.isUnlocked(entry.id);
        const medals = MetaProgression.getMedals();
        const card = document.createElement('div');
        card.className = 'glass-panel';
        Object.assign(card.style, { padding: '8px', display: 'flex', gap: '8px', alignItems: 'center', opacity: unlocked ? '1' : '0.92' } as CSSStyleDeclaration);

        const img = document.createElement('img');
        img.src = `/assets/sprites/unit-${entry.id}.png`;
        Object.assign(img.style, { height: '56px', width: 'auto', objectFit: 'contain', filter: unlocked ? 'none' : 'grayscale(0.7) brightness(0.7)' } as CSSStyleDeclaration);
        img.onerror = () => { img.style.display = 'none'; };

        const info = document.createElement('div'); info.style.flex = '1';
        info.innerHTML = `<div style="font-weight:bold; color:#fff; font-size:13px;">${def.name}</div><div style="font-size:10px; color:#9aa08c; text-transform:uppercase;">${def.role}</div>`;
        const act = document.createElement('div'); act.style.marginTop = '5px';
        if (unlocked) {
          act.innerHTML = `<span style="color:#5fbf5a; font-size:11px; font-weight:bold;">✔ DISPONIBLE</span>`;
        } else {
          const b = document.createElement('button');
          b.className = 'btn-primary'; b.style.padding = '4px 10px'; b.style.fontSize = '11px';
          b.innerText = `★ ${entry.cost}`;
          const can = medals >= entry.cost;
          if (!can) { b.disabled = true; b.style.opacity = '0.5'; }
          b.onclick = () => { if (MetaProgression.unlock(entry.id)) { Audio2.play('victory'); render(); } else { Audio2.play('uiClick'); } };
          act.appendChild(b);
        }
        info.appendChild(act);
        card.appendChild(img); card.appendChild(info);
        grid.appendChild(card);
      }
      overlay.appendChild(grid);
    };

    render();
    this.uiContainer.appendChild(overlay);
  }

  private setBackground(textureKey: string): void {
    if (!this.background) return;
    this.background.setTexture(textureKey);
    const scale = Math.max(GAME_WIDTH / this.background.width, GAME_HEIGHT / this.background.height);
    this.background.setScale(scale);
  }

  private startGame(menuDiv: HTMLElement) {
    // Inicializar RunState procedimental (MVP 0.3)
    const runState = RunSystem.startNewRun();
    const mapDef = RunSystem.generateMap(runState.seed, runState.operationId);
    this.game.registry.set('runState', runState);
    this.game.registry.set('mapDef', mapDef);

    // Animación de salida de la UI
    menuDiv.style.transition = 'opacity 0.4s ease';
    menuDiv.style.opacity = '0';
    
    // Fade out de la cámara del juego
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Limpiar DOM
      if (this.uiContainer && menuDiv.parentNode) {
        this.uiContainer.removeChild(menuDiv);
      }
      // Intro narrativa → mapa de la run
      this.scene.start('Story');
    });
  }
}
