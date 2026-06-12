# Roadmap — Operation Dead Front

Fases incrementales. Cada una termina en algo jugable y testeable.

## MVP 0.1 — Combate mínimo ✅ (entregado)

**Objetivo:** una batalla assault jugable de punta a punta.
**Alcance:** setup Vite+TS+Phaser; escenas Boot/Menu/Battle/Result; campo con dos
bases; despliegue de Rifleman (coste+cooldown); spawn fijo de Revenant Grunt; combate
automático; economía de supplies +bounty; HP de bases; victoria/derrota + reinicio.
**Criterios de salida:** se puede ganar y perder; `tsc` limpio; `vite build` ok;
smoke test del `BattleSystem` pasa (derrota pasiva + victoria agresiva). **Cumplido.**

## MVP 0.2 — Profundidad de batalla

**Objetivo:** que una batalla tenga decisiones tácticas reales.
**Alcance:** Heavy Gunner + Medic desplegables; Runner Corpse + Exploder; sistema de
**moral** (con ruta a 0); **oleadas** (WaveSystem con presupuesto por nodo); primera
**habilidad** de comandante (Airstrike) con botón; pantalla de **recompensa** (1 de 3).
**Criterios de salida:** moral afecta el resultado; las oleadas escalan; el jugador
elige una recompensa que cambia la siguiente batalla.

## MVP 0.3 — La run

**Objetivo:** encadenar batallas en una run con mapa.
**Alcance:** mapa de nodos por semilla (StS-like); **eventos** narrativos (usar
`data/events.ts`); 10 upgrades enchufados; 5 reliquias activas; **1 boss**
(General Eisenfaust) con fases; HQ y moral persistentes entre nodos.
**Criterios de salida:** una run completa First Light de principio a boss; reliquias
y upgrades modifican el combate; eventos producen efectos reales.

## Alpha — Contenido completo

Toda la data enchufada: 6 unidades, 8 enemigos, 3 bosses, 7 habilidades, 18 upgrades,
20 reliquias, 25 eventos, 6 mutaciones; 3 comandantes jugables; meta-progresión
(medallas/intel + desbloqueos); **guardado** local versionado; **trincheras
capturables**.

## Beta — Pulido y mobile

Balance pasada a fondo; audio; primera tanda de arte real reemplazando placeholders;
builds Capacitor iOS/Android; settings y accesibilidad.

## Soft launch

Analytics, onboarding/tutorial, listados de store, las 2 operaciones restantes y
comandantes desbloqueables, monetización cosmética.
