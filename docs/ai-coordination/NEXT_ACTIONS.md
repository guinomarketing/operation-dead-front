# Next Actions — Patagonia Z (lista viva)

> La próxima IA EMPIEZA leyendo este archivo. Tomá una tarea, declarala en `AI_HANDOFF.md`, hacela, documentá.
> Actualizado: 2026-06-15 (Codex).

## P0 — Hacer ahora (bloquea calidad/core)
1. ✅ **HECHO** — Bug despliegue carriles inferiores (P0-1). Resuelto con DOM deploy-catcher; verificado en preview. Ver `BUGS_AND_TECH_DEBT.md`.
2. **Verificar flujo completo en mobile real** tras catcher + merge `c85f6c2`: jugar run (deploy en los 4 carriles, habilidades, victoria/derrota). → **Gravity / Claude**.

## P1 — Siguiente bloque
1. **Playtest fino de reliquias/builds**: primera integración funcional hecha (combate, economía, recompensas y eventos). Probar runs reales, detectar combos rotos, ajustar rarezas/números y claridad. → **Claude Code/Codex/Gravity**.
2. ✅ **HECHO** — **Iconos + inventario/tooltip de reliquias**: Spritesheet de 20 iconos, tooltips HTML detallados e inventario en mapa integrados satisfactoriamente. → **Antigravity**.
3. **Playtest fino de bosses activos**: banco automático full-roster ya pasa; medir en mobile real tiempo de kill, presión por carril, daño recibido, uso de habilidades y sensación de justicia. → **Claude Code/Codex/Gravity**.
4. **Animación por frames de unidades y polish de bosses**: FX básicos ya integrados; faltan ciclos dedicados idle/walk/attack/death para unidades y poses/clips únicos de bosses. Frames → **Codex**; integración → **Claude Code/Codex**.
5. **Mapa = frente táctico vivo** (Fase 3): rediseño con base AR / base enemiga, sub-bases, trincheras, decisiones de ataque/defensa, consecuencias. Diseño visual → **Codex**; lógica → **Claude Code**.

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
