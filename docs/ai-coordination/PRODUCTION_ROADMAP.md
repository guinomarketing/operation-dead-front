# Production Roadmap — Patagonia Z → v1.0

Estado: `✅ hecho` · `🟡 parcial` · `⬜ pendiente`. Responsable ideal: Codex (arte) / Claude (lógica) / Gravity (iteración).

## Fase 0 — Estabilización  🟡 (PRIORIDAD ACTUAL)
- **Objetivo:** que el core no se rompa y se pueda jugar limpio.
- ⬜ **P0** Bug despliegue carriles inferiores (BUGS P0-1) — Claude.
- 🟡 Verificar build/flujo tras merge `c85f6c2` — Claude/Gravity.
- ✅ Estructura de archivos + separación systems/scenes/ui/data — Claude.
- 🟡 Deuda técnica urgente documentada (este sistema).
- **Dependencias:** ninguna. **Bloquea:** todo lo demás (no avanzar features sin P0).

## Fase 1 — Core Gameplay  🟡
- **Objetivo:** combate divertido y legible.
- ✅ Carriles, unidades, enemigos, recursos, moral, oleadas, boss, frente/línea.
- 🟡 Feedback visual (hay flash/shake/partículas básicas; falta impacto por frames).
- ✅ Feedback sonoro (SFX procedurales + música).
- 🟡 Counters/roles claros (existen por traits; falta telegrafía y balance).
- Responsable: Claude (lógica/feel) + Codex (VFX art).

## Fase 2 — UX/UI  🟡
- ✅ Menú principal (key art), HUD de combate premium, victoria/derrota, tutorial básico, selección implícita por desbloqueos.
- 🟡 Recompensas, configuración (volúmenes), pausa, evento a 2 columnas, tooltips.
- Responsable: Codex (mockups/branding) + Claude (integración) + Gravity (iteración).

## Fase 3 — Run System / Frente táctico vivo  ⬜
- **Objetivo:** que el mapa deje de ser nodos y sea un frente con decisiones.
- ⬜ Base AR / base enemiga, sub-bases, trincheras, antenas, rutas, labs, búnkers.
- ⬜ Ataque/defensa simultáneos, asignación de tropas, amenaza dinámica, consecuencias (moral/objetos/tropas/rutas).
- Responsable: Claude (sistema) + Codex (arte de mapa).

## Fase 4 — Roguelite Depth  ⬜
- **Objetivo:** builds y rejugabilidad.
- ⬜ Objetos/reliquias con efecto real; categorías (ofensiva/defensiva/económica/táctica/narrativa/maldita); rarezas (común→legendaria); sinergias; upgrades temporales.
- Responsable: Claude (lógica) + Codex (iconos).

## Fase 5 — Meta Progression  🟡
- ✅ Desbloqueo de unidades por medallas (persistente), empezar con 1 soldado.
- 🟡 Mejoras permanentes, rangos, personalización (apodo/color/nivel ya; faltan especializaciones/skins/variantes/habilidades).
- Responsable: Claude + Codex (skins).

## Fase 6 — Art & Animation Polish  🟡
- 🟡 Animaciones de unidades (frames), bosses (spritesheets cargados, integrar fases), integración de escenarios, perspectiva del campo, VFX, partículas, sombras (sombra suave ya).
- Responsable: Codex (frames/spritesheets) + Claude (integración).

## Fase 7 — Audio  🟡
- ✅ SFX core + música menú/combate.
- ⬜ Música de boss/evento/victoria/derrota, ambiente, voces/radio opcional, mezcla.
- Responsable: Claude (integración) + Codex/Magnific (generación).

## Fase 8 — Play Store Readiness  ⬜
- ⬜ Performance, bugs, balance, onboarding, build Android (Capacitor), icono, screenshots, trailer, privacidad/compliance (atención a la temática nazi/revenant → facción ficticia).
- Responsable: Claude (build/perf) + Codex (store art).
