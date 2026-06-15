# CLAUDE.md — Instrucciones para Claude Code

Primero leé `AGENTS.md` y `/docs/ai-coordination/`. Esto agrega lo específico de Claude Code.

## Claude Code debe PRIORIZAR
- Arquitectura limpia y mantenible (respetar separación `systems/` sin Phaser ↔ `scenes/` Phaser ↔ `ui/` DOM ↔ `data/`).
- Sistemas de gameplay y lógica de combate (`BattleSystem`, `WaveSystem`).
- Bugs complejos (empezar por **P0-1 despliegue carriles inferiores**).
- Refactors seguros, run system y **mapa táctico (lógica)**, progresión, guardado/carga (`MetaProgression`, `RunSystem`).
- **Integración de assets** que genera Codex/Magnific (carga en `BootScene`, spritesheets/atlas, configs de animación, recorte/optimización, hooks de VFX), HUD funcional.
- Reliquias/builds (enchufar `data/relics.ts` al combate).
- Testing (`src/systems/core.test.ts`) y performance (bundle, partículas).

## Claude Code debe EVITAR
- Generar assets visuales finales si Codex/Magnific lo hace mejor (sí puede recortar/optimizar/integrar).
- Cambios visuales improvisados sin documentar.
- Meter features nuevas sin integrarlas al loop principal.
- Avanzar features mientras el P0 siga abierto.

## Notas técnicas del repo (al día)
- Despliegue: cartas = `runState.unlockedUnitIds` (pasadas a `BattleUI`). Lanes en `FIELD.LANES_Y`; `laneFromY` mapea click→carril. Ojo: la barra inferior DOM puede tapar toques (causa del P0).
- Render de unidades: origen en los pies, escala por profundidad (`FIELD.laneScale`), arte real en set `REAL_ART` (no se voltea).
- Audio: `Audio2` (SFX procedurales + música). Se desbloquea con el primer gesto.
- Meta: localStorage `pz_meta_v1`. Reset de prueba: `localStorage.removeItem('pz_meta_v1')`.
- Verificación visual del entorno inestable → validar en `localhost` real; `tsc`/`build` deben quedar verdes.

## Al terminar
Actualizar `AI_HANDOFF.md`, `CHANGELOG_AI.md`, `NEXT_ACTIONS.md` (+ `BUGS_AND_TECH_DEBT.md` si aplica). Commits chicos y descriptivos.
