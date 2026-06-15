# Feature Ownership — Patagonia Z

Qué conviene hacer con cada herramienta. Regla transversal: **si una IA cambia algo que otra hizo, explica por qué en `CHANGELOG_AI.md` y `AI_HANDOFF.md`.**

## Codex
**Usar para:** generación de imágenes, dirección de arte, UI mockups, variaciones de personajes/bosses, iconos, fondos (incl. fondos con perspectiva del campo), pantallas de menú/victoria/derrota, splash, logo Patagonia Z, screenshots Play Store, revisión/propuestas de polish visual, prompts de assets.
**No como primera opción:** grandes refactors de gameplay, arquitectura compleja, sistemas persistentes delicados (guardado, run system).
Si genera assets, dejar en `CHANGELOG_AI.md`: nombre, prompt, ubicación sugerida, uso en el juego, estado, variantes, próximos pasos de integración.

## Claude Code
**Usar para:** arquitectura, gameplay, bugs complejos, refactors, run system, mapa táctico (lógica), progresión, guardado/carga, lógica de combate, **integración de assets** (carga, spritesheets, anim configs, VFX hooks), HUD funcional, testing, performance.
**No como primera opción:** exploración visual masiva, generar muchas variantes de imagen final.

## Gravity / Antigravity
**Usar para:** iteración rápida, prototipos funcionales, ajustes visuales, armado/integración de pantallas, pruebas de flujo, pequeñas mejoras de UX, validación rápida.
**No como primera opción:** cambios grandes sin documentar, reescribir arquitectura sin necesidad, romper sistemas existentes.
Nota: Antigravity ya trabajó en este repo (commit `c85f6c2`: assets, spritesheets, tests, `SeededRandom`, refactor de flujos). Mantener su `docs/CLAUDE_SYNC.md` como histórico; coordinar vía este sistema.

## Matriz rápida por área
| Área | Primaria | Apoyo |
|---|---|---|
| Bug despliegue P0 | Claude | — |
| Lógica de combate / systems | Claude | Gravity |
| Mapa "frente vivo" (lógica) | Claude | Gravity |
| Mapa/escenarios (arte) | Codex | Gravity |
| Animación (frames/spritesheets) | Codex (frames) | Claude (integra) |
| Reliquias/builds (lógica) | Claude | — |
| Iconos/UI/logo | Codex | Gravity |
| Balance | Claude | Gravity (playtest) |
| Build Android / perf | Claude | — |

## Regla de oro
Trabajar como **un mismo estudio**: leer `/docs/ai-coordination/` antes, declarar la tarea desde `NEXT_ACTIONS.md`, y dejar handoff al terminar. Nadie es una isla.
