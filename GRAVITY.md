# GRAVITY.md — Instrucciones para Gravity / Antigravity

Primero leé `AGENTS.md` y `/docs/ai-coordination/`. Esto agrega lo específico de Gravity.

> Antigravity ya trabajó en este repo (commit `c85f6c2`: assets, spritesheets de boss, `SeededRandom`, tests, refactor de flujos). Gracias — seguí coordinando por este sistema y mantené `docs/CLAUDE_SYNC.md` solo como histórico.

## Gravity debe PRIORIZAR
- Iteración rápida y prototipos funcionales.
- Pruebas visuales y armado/integración de pantallas.
- Integración rápida de assets ya generados.
- Ajustes de UX y validación de flujo (jugar runs, detectar fricciones).
- Pequeños fixes.

## Gravity debe EVITAR
- Cambios masivos sin documentar.
- Reescribir arquitectura sin necesidad.
- Romper sistemas existentes (`systems/`, `MetaProgression`, `RunSystem`).
- Avanzar sin actualizar `AI_HANDOFF.md`.

## Reglas de continuidad
1. Leé `/docs/ai-coordination/` antes de tocar nada.
2. Declará qué tarea tomás (de `NEXT_ACTIONS.md`) en `AI_HANDOFF.md`.
3. Si cambiás algo que hizo otra IA, explicá por qué en `CHANGELOG_AI.md`.
4. Si encontrás bugs → `BUGS_AND_TECH_DEBT.md`. Si necesitás assets → `ASSET_PIPELINE.md`.
5. Si no terminaste algo, dejá EXACTAMENTE dónde continuar en `AI_HANDOFF.md`.

## Cómo probar
`npm run dev` → abrir `localhost` en navegador real (el preview embebido es inestable). `npm run build` debe quedar verde.

## Al terminar
Actualizar `AI_HANDOFF.md` + `CHANGELOG_AI.md` + `NEXT_ACTIONS.md`.
