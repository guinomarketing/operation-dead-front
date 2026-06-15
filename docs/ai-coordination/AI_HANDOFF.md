# AI Handoff — Patagonia Z

> El archivo MÁS importante. Ninguna IA termina una sesión sin actualizar esto.
> La próxima IA empieza leyendo este archivo + `NEXT_ACTIONS.md`.

## Última IA que trabajó
- **Herramienta:** Claude Code (Opus)
- **Fecha:** 2026-06-15
- **Objetivo de la sesión:** Crear el sistema de coordinación entre IAs + **arreglar el bug P0 de despliegue en carriles inferiores** (verificado en preview).

## Resumen ejecutivo
Se creó la documentación viva de coordinación (`/docs/ai-coordination/` + AGENTS/CLAUDE/CODEX/GRAVITY). Se auditó el repo. Se **resolvió el P0**: el toque en los carriles inferiores no llegaba al canvas porque la barra de cartas (DOM) lo tapaba en viewports chicos; se agregó un **DOM deploy-catcher** que enruta el toque a `handleBattlefieldClick` con coords lógicas, y se corrigió que `selectUnit/selectAbility` desactivaban el catcher al llamar al setter contrario. Verificado a 812×375 (Conscripto (3)→(2) al tocar el carril inferior). Acordado con el dueño: **los assets visuales los genera Codex con ChatGPT Images 2** — Claude no genera arte, solo integra y deja el pedido en `ASSET_PIPELINE.md`.

## Archivos modificados (esta sesión)
- `docs/ai-coordination/*` (9 archivos NUEVOS) — sistema de coordinación. Riesgo: ninguno (solo docs).
- `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `GRAVITY.md` (NUEVOS, raíz) — instrucciones por herramienta. Riesgo: ninguno.

## Features completadas (acumulado del proyecto, para contexto)
- Landscape 16:9 · combate por carriles + frente · 12 unidades + 9 enemigos + boss · HUD premium · audio SFX+música · progresión meta (start con 1 + desbloqueos por medallas) · tutorial · intro narrativa. Probar: `npm run dev` → menú → DESPLEGAR. Atajos: `?scene=battle&demo=1`, `?scene=boss`, `?scene=map`, `?scene=story`.

## Features en progreso
- **Animación por frames de bosses** (otra herramienta): spritesheets `boss-doctor-totenkopf-sheet-v2` y `boss-locomotora-profanadora-sheet-v2` cargados en `BootScene`; falta confirmar que las animaciones/fases estén enchufadas en combate. Continuar en `BattleScene`/`UnitRenderer` + `data/bosses.ts`.
- **Assets por sala** (town/ironworks/hq-progression): cargados; verificar que cada nodo/operación use el fondo correcto.

## Bugs detectados
- **P0-1 Despliegue carriles inferiores** (ver `BUGS_AND_TECH_DEBT.md`). Severidad P0. Reproducir: en combate, seleccionar unidad e intentar desplegar en los 2 carriles de abajo. Causa probable: barra de cartas DOM tapa el toque. Prioridad máxima.

## Bugs corregidos
- **P0-1 despliegue carriles inferiores** — DOM deploy-catcher + fix de toggles de selección. Validado en preview (deploy en carril inferior OK). Archivos: `ui/BattleUI.ts`, `scenes/BattleScene.ts`, `utils/constants.ts`.

## Decisiones de diseño tomadas
- **Empezar con 1 soldado (Conscripto)** + desbloqueo por medallas (reemplaza el arranque con 8 reclutas de `CLAUDE_SYNC.md`). Motivo: sensación de progresión roguelite. Impacto: `RunSystem.startNewRun`, `MetaProgression`, cartas dinámicas.
- **`/docs/ai-coordination/` es la fuente de verdad** de coordinación (sustituye notas sueltas). `CLAUDE_SYNC.md` queda como histórico.

## Decisiones técnicas tomadas
- Cartas desplegables = `runState.unlockedUnitIds` (se pasan a `BattleUI`, ya no el const estático `DEPLOYABLE`).
- Audio 100% procedural (sin assets de SFX) + 2 mp3 de música.

## Assets creados o requeridos
- No se crearon assets esta sesión (MCP de imágenes desconectado). Requerimientos pendientes en `ASSET_PIPELINE.md` (logo Patagonia Z, frames de unidades, iconos de reliquias, fondos de evento).

## Tests realizados
- `npx tsc --noEmit` → OK (en commits previos de esta jornada). Esta sesión: solo documentación, sin cambios de código que testear.

## Lo próximo que debería hacer la siguiente IA
1. **Arreglar P0-1** (despliegue carriles inferiores) y verificar en `localhost`.
2. Confirmar/terminar **animación de bosses** (spritesheets ya cargados) y fases legibles.
3. **Mapa como frente táctico vivo** (rediseño, ver roadmap Fase 3).
4. **Reliquias que cambian builds** (Fase 4) — enchufar `relics.ts` al combate.
5. Pasada de **balance** de la primera experiencia + curva de desbloqueo.

## Advertencias para la próxima IA
- **No tocar** la separación `systems/` (sin Phaser) ↔ `scenes/` (Phaser). Mantener `BattleSystem` testeable.
- **Revisar antes**: `RunSystem.startNewRun(operationId?)` y `generateMap(seed, operationId?)` cambiaron firma (otra herramienta). `MetaProgression` (localStorage `pz_meta_v1`).
- **Riesgos**: la barra de UI inferior (DOM) puede tapar toques del canvas (causa del P0). El preview/screenshot del entorno es inestable — validar en navegador real.
- Actualizá ESTE archivo + `CHANGELOG_AI.md` + `NEXT_ACTIONS.md` al terminar.
