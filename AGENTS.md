# Patagonia Z — Global Agent Instructions

Cualquier IA/agente que trabaje en este repo (Codex, Claude Code, Gravity/Antigravity u otra) debe seguir esto.

## Antes de modificar código, leer OBLIGATORIO:
- `/docs/ai-coordination/AI_MASTER_CONTEXT.md` — visión y reglas del juego.
- `/docs/ai-coordination/CURRENT_STATE.md` — estado real hoy.
- `/docs/ai-coordination/AI_HANDOFF.md` — qué hizo la última IA y dónde seguir.
- `/docs/ai-coordination/NEXT_ACTIONS.md` — prioridades; tomá una tarea de acá.
- `/docs/ai-coordination/BUGS_AND_TECH_DEBT.md` — qué está roto y su prioridad.
- `/docs/ai-coordination/FEATURE_OWNERSHIP.md` — qué conviene hacer con cada herramienta.

## Objetivo del proyecto
Llevar **Patagonia Z** a una **versión 1.0 comercial**, jugable, pulida y apta para **Play Store**. No prototipo, no demo, no MVP pobre.

## Reglas
1. No romper trabajo previo sin justificar (y documentarlo en `CHANGELOG_AI.md`).
2. No crear features aisladas: todo debe integrarse al loop principal.
3. No dejar placeholders sin documentar.
4. No avanzar sin actualizar `AI_HANDOFF.md` al terminar.
5. No tocar grandes sistemas sin revisar dependencias (especialmente `src/systems/`).
6. Priorizar gameplay, UX, claridad visual y estabilidad.
7. Todo cambio debe acercar el juego a una versión comercial real.
8. **No avanzar con features nuevas hasta resolver el bug P0** de despliegue en carriles inferiores (ver `BUGS_AND_TECH_DEBT.md` P0-1), salvo tareas de documentación/arte que no toquen ese flujo.

## Reglas de contenido (duras)
- Enemigos monstruosos, nunca héroes. Sin glorificación nazi. Sin esvásticas / iconografía nazi real: usar la facción ficticia (Orden del Cóndor Negro / Revenant Reich).

## Arquitectura (respetar)
- `src/systems/` lógica pura (sin Phaser, testeable) · `src/scenes/` Phaser/render · `src/ui/` overlay DOM · `src/data/` contenido declarativo · `src/rendering/` sprites/animación · `src/utils/` constantes y helpers.
- Stack: Phaser 3.90 + TS + Vite. Landscape 960×540.

## Cómo correr / probar
```
npm install
npm run dev        # http://localhost:5173 (abrir en navegador real)
npm run build      # tsc --noEmit && vite build  (debe quedar verde)
```
Atajos dev: `?scene=battle&demo=1`, `?scene=boss`, `?scene=map`, `?scene=story`, `?scene=result-win|result-loss`.

## Al terminar cada sesión (obligatorio)
- Actualizar `AI_HANDOFF.md` (última IA, qué hiciste, dónde seguir, advertencias).
- Registrar en `CHANGELOG_AI.md` (archivos, motivo, riesgos, cómo probar).
- Actualizar `NEXT_ACTIONS.md` (re-priorizar) y `BUGS_AND_TECH_DEBT.md` si corresponde.
- Si creaste/necesitás assets, registrarlos en `ASSET_PIPELINE.md`.
- Indicar cómo probar los cambios.

Ver instrucciones por herramienta: `CLAUDE.md`, `CODEX.md`, `GRAVITY.md`.
