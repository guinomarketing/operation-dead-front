# Next Actions — Patagonia Z (lista viva)

> La próxima IA EMPIEZA leyendo este archivo. Tomá una tarea, declarala en `AI_HANDOFF.md`, hacela, documentá.
> Actualizado: 2026-06-15 (Claude Code).

## P0 — Hacer ahora (bloquea calidad/core)
1. ✅ **HECHO** — Bug despliegue carriles inferiores (P0-1). Resuelto con DOM deploy-catcher; verificado en preview. Ver `BUGS_AND_TECH_DEBT.md`.
2. **Verificar flujo completo en mobile real** tras catcher + merge `c85f6c2`: jugar run (deploy en los 4 carriles, habilidades, victoria/derrota). → **Gravity / Claude**.

## P1 — Siguiente bloque
1. **Animación de unidades y bosses**: terminar de enchufar spritesheets de boss (doctor-totenkopf, locomotora) + fases legibles; definir plan de frames de unidades (idle/walk/attack/death). Frames → **Codex**; integración → **Claude Code**.
2. **Mapa = frente táctico vivo** (Fase 3): rediseño con base AR / base enemiga, sub-bases, trincheras, decisiones de ataque/defensa, consecuencias. Diseño visual → **Codex**; lógica → **Claude Code**.
3. **Reliquias que cambian builds** (Fase 4): enchufar `relics.ts` a `BattleSystem`/`RunState` con categorías y rarezas. → **Claude Code**. Iconos → **Codex**.

## P2 — Luego
1. **Personalización de tropas** ampliada (especializaciones, variantes, skins, habilidades desbloqueables).
2. **Pantallas**: evento a 2 columnas, recompensa, config con volúmenes, pausa.
3. **Logo Patagonia Z** real + pulido de tipografía/branding. → **Codex**.
4. **Balance** de economía/oleadas/curva de desbloqueo.

## Backlog
- Variedad de salas (modificadores + composición de oleadas por nodo).
- Más bosses integrados (data + arte + fases).
- Build Android (Capacitor), íconos, screenshots Play Store, política de privacidad.
- Code-splitting del bundle (Phaser pesa ~1.6 MB).
- Unificar/retirar `docs/CLAUDE_SYNC.md` (histórico) hacia este sistema.
