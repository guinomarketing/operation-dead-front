# AI Handoff — Patagonia Z

> El archivo MÁS importante. Ninguna IA termina una sesión sin actualizar esto.
> La próxima IA empieza leyendo este archivo + `NEXT_ACTIONS.md`.

## Última IA que trabajó
- **Herramienta:** Antigravity
- **Fecha:** 2026-06-16
- **Objetivo de la sesión:** Implementar el menú de pausa de combate y la configuración de volumen en el menú principal y pantalla de batalla.

## Resumen ejecutivo
**Actualización Antigravity (combat pause & volume settings overlays):**
Se completó la implementación y validación del sistema de pausa táctica y configuración de volumen:
1. **MainMenuScene**: Añadido el botón de configuración que abre un modal HTML (`glass-panel`) con deslizadores para volumen de música, volumen de efectos de sonido (SFX) y botón mute interactivo conectado al singleton `Audio2`. Mover el deslizador de SFX reproduce un sonido `uiClick` a ritmo de throttle para dar feedback inmediato al usuario.
2. **BattleUI**: Se redujo el ancho de la barra de HUD superior para hacer espacio en la esquina derecha e inyectar el botón `⏸` interactivo que ejecuta el callback de pausa.
3. **BattleScene**: Añadido soporte para detener la simulación de juego mediante una pausa suave (retornando temprano en el método `update()` y `handleBattlefieldClick()`), pausando el reloj de Phaser, todos los tweens y animaciones. Al pausar, se despliega un modal HTML con sliders de volumen, mute, botón de "REANUDAR" y botón rojo de "RETIRARSE" (el cual ejecuta `endBattle('lost')` aplicando permadeath a las tropas caídas en ese combate táctico). La tecla `ESC` y el botón de pausa flotante funcionan indistintamente para pausar y reanudar el combate sin interferir con la entrada del motor Phaser. Se corrigió un error de compilación por falta de importación de `Audio2` en `src/ui/BattleUI.ts`.

Tests de Vitest (19/19) y build de producción de Vite (`npm run build`) se encuentran en verde. El servidor local de desarrollo está listo para pruebas.

## Archivos modificados (esta sesión)
- `src/scenes/MainMenuScene.ts` — inyección de botón de Configuración y modal HTML interactivo `openConfigOverlay`.
- `src/ui/BattleUI.ts` — ajuste de tamaño del HUD superior, adición de botón `⏸` e importación de `Audio2`.
- `src/scenes/BattleScene.ts` — implementación de flag `isPaused`, interrupción de `update` e inputs, listener de tecla `ESC`, listener de shutdown y método `togglePause` con modal de pausa.
- `docs/ai-coordination/*` — handoff/changelog/next actions actualizados.

## Features completadas (acumulado del proyecto, para contexto)
- Landscape 16:9 · combate por carriles + frente · 12 unidades + 9 enemigos + boss · HUD premium · audio SFX+música · progresión meta (start con 1 + desbloqueos por medallas) · tutorial · intro narrativa.
- Roster XCOM-like: soldados, XP, niveles, apodos, tintes, permadeath, derrota definitiva en mapa táctico.
- Reliquias visuales: spritesheet, tooltips dinámicos con color por rareza, inventario en el mapa y cartas de recompensa en victorias.
- **Pausa de Combate y Configuración**: menús interactivos DOM con persistencia local de audio y botones reanudar/retirarse.

## Features en progreso
- **Playtest de balance de reliquias**: primera pasada funcional hecha. Falta confirmar curva y balance de combinaciones.
- **Fases funcionales + FX básicos + balance inicial de bosses**: Eisenfaust, Totenkopf y Locomotora listos. Falta animación por frames dedicada y playtest fino.
- **Mapa como frente táctico vivo** (rediseño, ver roadmap Fase 3).

## Bugs detectados
- Ninguno de severidad P0/P1 abierto.

## Bugs corregidos
- **Falta de import de Audio2 en BattleUI.ts** — Corregido, solucionando el fallo en `npm run build`.

## Decisiones técnicas tomadas
- Pausa Suave ("Soft-Pause") en Phaser 3 para evitar congelar el Phaser Input Manager (lo que sucede con `this.scene.pause()`). Al pausar solo relojes, tweens, animaciones, lógica de simulación y click handler, se preserva el listener del teclado para que la tecla `ESC` pueda despausar el juego limpiamente.

## Assets creados o requeridos
- Ninguno.

## Tests realizados
- `npm run test -- --run` -> OK, 19 tests.
- `npm run build` -> OK. Build exitoso en dist/.

## Lo próximo que debería hacer la siguiente IA
1. **Playtest fino de combinaciones de reliquias**: confirmar que los modificadores declarativos de combate y economía son legibles y divertidos en runs reales.
2. **Verificar flujo completo en mobile real**: comprobar cómo responde la interfaz del mapa táctico y la pausa de combate en pantallas táctiles reales.
3. **Animaciones por frames**: integrar animaciones dedicadas (idle/walk/attack/death) para unidades y poses únicas para bosses.
4. **Mapa como frente táctico vivo** (rediseño, ver roadmap Fase 3).

## Advertencias para la próxima IA
- **No tocar** la separación `systems/` (sin Phaser) ↔ `scenes/` (Phaser).
- **Tooltips**: `TooltipManager` está inyectado directamente en el DOM para simplificar el estilizado responsivo. Recordar llamar a `TooltipManager.hide()` en los eventos de transición/shutdown de escenas Phaser para evitar tooltips huerfanos.
- Actualizá ESTE archivo + `CHANGELOG_AI.md` + `NEXT_ACTIONS.md` al terminar.
