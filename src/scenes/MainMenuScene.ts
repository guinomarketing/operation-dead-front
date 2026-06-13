import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { RunSystem } from '../systems/RunSystem';

export class MainMenuScene extends Phaser.Scene {
  private uiContainer!: HTMLElement | null;

  constructor() {
    super('MainMenu');
  }

  preload() {
    this.load.image('bg_battlefield', '/assets/backgrounds/battlefield.png');
  }

  create(): void {
    // Inicializar / reiniciar mejoras de la run
    this.game.registry.set('upgrades', []);

    // Dibujar el nuevo fondo premium
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_battlefield');
    // Escalar para que cubra la pantalla manteniendo la relación de aspecto
    const scaleX = GAME_WIDTH / bg.width;
    const scaleY = GAME_HEIGHT / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);

    // Fade in sutil
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Crear Interfaz HTML
    this.createHTMLMenu();
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
    title.innerHTML = 'OPERACIÓN<br/>CÓNDOR MUERTO';

    const subtitle = document.createElement('p');
    subtitle.innerText = 'La Legión marcha bajo una bandera robada.\nSostené la línea. Enterralos de nuevo.';
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
    
    startBtn.onclick = () => this.startGame(menuDiv);

    menuDiv.appendChild(title);
    menuDiv.appendChild(subtitle);
    menuDiv.appendChild(startBtn);

    this.uiContainer.appendChild(menuDiv);
  }

  private startGame(menuDiv: HTMLElement) {
    // Inicializar RunState procedimental (MVP 0.3)
    const runState = RunSystem.startNewRun();
    const mapDef = RunSystem.generateMap(runState.seed);
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
      // Cambiar de escena al mapa táctico en lugar de directo a batalla
      this.scene.start('Map');
    });
  }
}
