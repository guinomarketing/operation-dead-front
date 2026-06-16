# AI Handoff — Patagonia Z

> El archivo MÁS importante. Ninguna IA termina una sesión sin actualizar esto.
> La próxima IA empieza leyendo este archivo + `NEXT_ACTIONS.md`.

## Última IA que trabajó
- **Herramienta:** Antigravity
- **Fecha:** 2026-06-15
- **Objetivo de la sesión:** Implementar el pase de arte/UI para reliquias (P1-3): crear spritesheet de 20 íconos, inyectar tooltips HTML detallados según rareza e integrar la visualización del inventario de reliquias en el mapa y recompensas de victoria.

## Resumen ejecutivo
**Actualización Antigravity (relic visuals & tooltip pass):** Se completó el soporte visual de reliquias. Se generó un spritesheet pixel art de `320x256` con los 20 íconos de reliquias (`public/assets/sprites/relics-sheet.png`) y se precargó en `BootScene`. Se adaptó `RelicDef` para mapear los índices de cuadro (`iconFrame`). Se implementó `TooltipManager.ts` para inyectar tooltips HTML premium flotantes que muestran título, rareza (coloreada según nivel), descripción y flavor text con reposicionamiento dinámico y soporte móvil. En `MapScene.ts`, el inventario superior ahora muestra los íconos reales de las reliquias equipadas con hover del tooltip. En `ResultScene.ts`, las cartas de recompensa muestran el ícono pixel art de la reliquia y el tooltip interactivo antes de seleccionarla (además se diseñó un engranaje vectorial para las cartas de mejoras para mantener consistencia visual).
Tests en Vitest (19/19) y build (`npm run build`) siguen en verde. El servidor de desarrollo se reactivó tras el reinicio en background.

## Archivos modificados (esta sesión)
- `src/types/RunTypes.ts` — cambio de `iconPath` a `iconFrame` en `RelicDef`.
- `src/data/relics.ts` — asignación de índices de cuadro de 0 a 19 para mapear con el spritesheet.
- `src/scenes/BootScene.ts` — precarga de `relics-sheet` como spritesheet de `64x64`.
- `src/ui/TooltipManager.ts` (NUEVO) — inyección y control de tooltips HTML interactivos en el DOM con CSS glassmorphism.
- `src/scenes/MapScene.ts` — renderizado de iconos en barra de monedas superior con listeners mouseenter/mouseleave para tooltips.
- `src/scenes/ResultScene.ts` — renderizado de iconos (Phaser image/graphics) y listeners interactivos de tooltip en cartas de recompensa.
- `public/assets/sprites/relics-sheet.png` (NUEVO) — spritesheet generado de 20 iconos en rejilla de 5x4.
- `docs/ai-coordination/*` — handoff/changelog/next actions/debt actualizados.

## Features completadas (acumulado del proyecto, para contexto)
- Landscape 16:9 · combate por carriles + frente · 12 unidades + 9 enemigos + boss · HUD premium · audio SFX+música · progresión meta (start con 1 + desbloqueos por medallas) · tutorial · intro narrativa.
- Roster XCOM-like: soldados, XP, niveles, apodos, tintes, permadeath, derrota definitiva en mapa táctico.
- **Reliquias visuales**: spritesheet, tooltips dinámicos con color por rareza, inventario en el mapa y cartas de recompensa en victorias.

## Features en progreso
- **Playtest de balance de reliquias**: primera pasada funcional hecha. Falta confirmar curva y balance de combinaciones.
- **Fases funcionales + FX básicos + balance inicial de bosses**: Eisenfaust, Totenkopf y Locomotora listos. Falta animación por frames dedicada y playtest fino.
- **Mapa como frente táctico vivo** (rediseño, ver roadmap Fase 3).

## Bugs detectados
- Ninguno de severidad P0/P1 abierto. El despliegue de carriles inferiores está validado.

## Bugs corregidos
- **P0-1 despliegue carriles inferiores** — resuelto y verificado previamente.
- Se corrigió el cálculo de posiciones del tooltip en `ResultScene.ts` para que soporte eventos táctiles (`touches`) y evite caídas por tipos en TypeScript.

## Decisiones técnicas tomadas
- Spritesheet unificado (`relics-sheet`) de 64x64 px por icono para optimizar rendimiento (1 única petición HTTP y fácil renderizado en Phaser y CSS/HTML usando `background-position` / `background-size`).

## Assets creados o requeridos
- **Creado**: `public/assets/sprites/relics-sheet.png` (spritesheet de 20 iconos pixel art).
- Pendiente en `ASSET_PIPELINE.md` (logo Patagonia Z, frames de unidades, fondos de evento).

## Tests realizados
- `npm run test -- --reporter=dot` -> OK, 19 tests.
- `npm run build` -> OK. Build exitoso en dist/.
- Browser local: validación de hover en recompensa de victoria (`?scene=result-win`), selección de reliquia, guardado en `runState`, paso de escena al mapa táctico (`?scene=map`) e inspección en barra superior. Sin errores de consola. Detección táctil funcionando.

## Lo próximo que debería hacer la siguiente IA
1. **Playtest fino de combinaciones de reliquias**: confirmar que los modificadores declarativos de combate y economía son legibles y divertidos en runs reales.
2. **Verificar flujo completo en mobile real**: comprobar cómo responde la interfaz del mapa táctico con el nuevo inventario de reliquias en pantallas táctiles reales.
3. **Animaciones por frames**: integrar animaciones dedicadas (idle/walk/attack/death) para unidades y poses únicas para bosses.
4. **Mapa como frente táctico vivo** (rediseño, ver roadmap Fase 3).

## Advertencias para la próxima IA
- **No tocar** la separación `systems/` (sin Phaser) ↔ `scenes/` (Phaser).
- **Tooltips**: `TooltipManager` está inyectado directamente en el DOM para simplificar el estilizado responsivo. Recordar llamar a `TooltipManager.hide()` en los eventos de transición/shutdown de escenas Phaser para evitar tooltips huerfanos.
- Actualizá ESTE archivo + `CHANGELOG_AI.md` + `NEXT_ACTIONS.md` al terminar.
