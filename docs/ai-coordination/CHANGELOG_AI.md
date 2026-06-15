# AI Changelog — Patagonia Z

Registro de TODO cambio por cada IA. Sin cambios silenciosos: si no está acá, es deuda.
Formato por entrada: Fecha — Herramienta · Objetivo · Archivos · Cambios · Motivo · Riesgos · Cómo probar · Estado.

---

## 2026-06-15 — Claude Code
- **Objetivo:** Crear sistema de coordinación entre IAs + auditoría real (sin features).
- **Archivos:** `docs/ai-coordination/{AI_MASTER_CONTEXT,AI_HANDOFF,PRODUCTION_ROADMAP,CURRENT_STATE,BUGS_AND_TECH_DEBT,ASSET_PIPELINE,FEATURE_OWNERSHIP,CHANGELOG_AI,NEXT_ACTIONS}.md` (nuevos); `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `GRAVITY.md` (nuevos, raíz).
- **Cambios:** documentación viva de coordinación + auditoría del repo + bug P0 documentado.
- **Motivo:** evitar que múltiples IAs (Codex/Claude/Gravity) se pisen o pierdan contexto.
- **Riesgos:** ninguno (solo docs).
- **Cómo probar:** abrir los `.md`; arrancar cualquier sesión leyendo `AGENTS.md` → `/docs/ai-coordination/`.
- **Estado:** ✅ hecho.

## 2026-06-15 (previo, misma jornada) — Claude Code
- **Objetivo:** Progresión "empezar con 1 soldado" + tutorial + intro de historia.
- **Archivos:** `systems/MetaProgression.ts` (nuevo), `systems/RunSystem.ts`, `scenes/StoryScene.ts` (nuevo), `scenes/MainMenuScene.ts`, `scenes/BattleScene.ts`, `scenes/MapScene.ts`, `scenes/ResultScene.ts`, `scenes/BootScene.ts`, `ui/BattleUI.ts`, `main.ts`, `data/units.ts`.
- **Cambios:** meta-progreso persistente (localStorage `pz_meta_v1`), roster inicial = 1 Conscripto + desbloqueos por medallas, cartas dinámicas, pantalla DESBLOQUEOS, tutorial de primer combate, escena de historia.
- **Motivo:** sensación de progresión roguelite (pedido del dueño).
- **Riesgos:** cambió firma de `RunSystem.startNewRun`; cartas ya no usan const `DEPLOYABLE`.
- **Cómo probar:** `npm run dev` → DESPLEGAR → intro → mapa; menú → DESBLOQUEOS.
- **Estado:** ✅ commit `40f1f49`.

## 2026-06-15 (previo) — Antigravity / Codex (commit `c85f6c2`)
- **Objetivo:** "Refactor front-end MVP state and UI flows".
- **Archivos (detectados):** assets nuevos (fondos town/ironworks/hq/result/map/keyart-v2, story-0{1..4}, spritesheets de boss), `utils/SeededRandom.ts`, `systems/core.test.ts`, `BootScene.ts` (carga de nuevos assets + jumps extra), `RunSystem` (operationId), docs `CHECKPOINT_PLAYTEST.md`/`CLAUDE_SYNC.md`/`V1_COMMERCIAL_AUDIT.md`.
- **Motivo:** sumar arte por sala, semilla determinística, tests y flujos.
- **Riesgos:** `CLAUDE_SYNC.md` quedó desactualizado vs. progresión "1 soldado"; integración de animación de bosses a confirmar.
- **Cómo probar:** `npm run build`; jugar run.
- **Estado:** 🟡 integrado, validación de animación/fases pendiente. (Entrada reconstruida por Claude a partir del repo; Antigravity debe completarla.)

## Sesiones anteriores (resumen, ver `git log` + `docs/changelog.md`)
Landscape 16:9 · 22 personajes Magnific + recorte · grounding/sombras/perspectiva plana · HUD premium + íconos · audio SFX+música. Commits `9afdd70`…`5437674`.
