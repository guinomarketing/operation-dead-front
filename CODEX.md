# CODEX.md — Instrucciones para Codex

Primero leé `AGENTS.md` y `/docs/ai-coordination/`. Esto agrega lo específico de Codex.

## Codex debe PRIORIZAR
- Generación visual y dirección de arte (cómic bélico oscuro argentino; ver `AI_MASTER_CONTEXT.md`, `docs/ART_DIRECTION.md`, `docs/MAGNIFIC_PROMPTS.md`).
- UI mockups, paneles, botones, tipografía/branding y **logo real de Patagonia Z**.
- Variaciones de personajes y bosses; **frames/spritesheets de animación** (idle/walk/attack/death/fases de boss).
- Iconos (reliquias, habilidades), fondos (incl. campo con perspectiva y "frente táctico vivo"), pantallas de menú/victoria/derrota, splash, screenshots Play Store.
- Revisión estética y propuestas de polish visual.

## Codex puede tocar código
Sí, si hace falta, pero respetando `AGENTS.md`, `FEATURE_OWNERSHIP.md` y dejando registro en `CHANGELOG_AI.md`. No es la primera opción para grandes refactors de gameplay/arquitectura ni sistemas persistentes delicados (run system, guardado).

## Reglas de entrega de assets (obligatorio)
Por cada asset, dejar en `CHANGELOG_AI.md` (y/o `ASSET_PIPELINE.md`):
- nombre de archivo (seguir naming de `ASSET_PIPELINE.md`)
- prompt usado
- ubicación sugerida (`public/assets/...`)
- uso dentro del juego (qué key/escena)
- estado (borrador/final) y variantes
- próximos pasos de integración (para Claude Code)

## Reglas técnicas de assets
- Personajes/bosses: PNG transparente, recortado al alpha (pies al borde inferior).
- Fondos: 16:9, reescalar ≤1600px, JPEG q85 (~200–350 KB). No subir PNGs 2k de varios MB.
- Mantener keys existentes (`unit-<id>`, `enemy-<id>`, `icon-*`) para no romper `BootScene`.

## Al terminar
Actualizar `AI_HANDOFF.md` + `CHANGELOG_AI.md` + `ASSET_PIPELINE.md` (y `NEXT_ACTIONS.md` si cambian prioridades).
