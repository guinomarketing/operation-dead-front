# Operation Dead Front — Claude Sync & Progress Document

This document is updated automatically to help Claude understand the current state, progress, and architectural decisions made by Antigravity in this project.

## Current State: MVP 0.3 (The Roguelite Run Loop & Boss Fight) ✅

We have successfully completed all core features of **MVP 0.3 (La Run)**:
1. **Procedural Map & Navigation (`RunSystem.ts`, `MapScene.ts`)**:
   - Seeds generation for a 9-row grid map connecting nodes dynamically (prevents isolated nodes, no elites in rows 1-2, final Boss on row 8).
   - Core node types: `battle` (normal fights), `elite` (hard fights with 1.6x threat budget), `event` (narrative event resolution), `supply` (shop using Intel credentials), and `hq` (rest camp to restore +30 base HP or +20 morale).
   - Semi-transparent HTML/CSS glassmorphic overlays for interactive events, shop requisitions, and camp briefing choices.
2. **Persistent Run State (`BattleScene.ts`, `ResultScene.ts`)**:
   - Global state tracks commander, base HP, morale (30-100), upgrades, relics, intel, and medals.
   - HP and morale are persistent; taking damage in battle is saved to the registry and carried over to the map.
   - Victory rewards choice of upgrades (which are added to `runState.upgradeIds`) and +1 Intel/Medal before returning to the map.
3. **General Eisenfaust Boss Fight (`BattleSystem.ts`, `WaveSystem.ts`, `BattleScene.ts`)**:
   - Skips normal waves. Spawns General Eisenfaust as a high-HP (1200) unit in the center lane.
   - Enemy bastion health bar is linked to the Boss's health; killing him wins the match.
   - Dynamic HP threshold phases:
     - **Phase 1 (HP > 70%)**: Commands from rear, summons 3 Revenant Grunts every 8s.
     - **Phase 2 (35% < HP <= 70%)**: Joins front, summons 3 grunts every 8s, command aura (+20% damage to nearby Reich units), and ground slam AoE (90px).
     - **Phase 3 (HP <= 35%)**: Iron rage, summons 2 Runner Corpses every 5s, 30% speed boost (move speed 16), and ground slam AoE.
   - **Epic Visuals**: Red intro text splash with shake, screenshake on summons, red flash and warning text on phase transition, and chained delayed airstrike explosions + blood/toxic cloud on death.
4. **Elite Threat Multiplier (`WaveSystem.ts`)**:
   - Elite battles increase threat spawn budget by a multiplier of `1.6x` for a harder challenge.

---

## Code Architecture Guidelines (For Claude)

- **Strict Separation of Concerns**:
  - `src/systems/`: Pure TypeScript logic (`BattleSystem`, `WaveSystem`, `RunSystem`). No Phaser imports. Headless testing ready.
  - `src/scenes/`: Phaser rendering, animations, visual effects, and cameras.
  - `src/ui/`: HTML UI overlay elements (`BattleUI`, `MapScene` overlays).
  - `src/data/`: Declarative game database (`units.ts`, `enemies.ts`, `bosses.ts`, `events.ts`, etc.).
- **Visual polish details**:
  - Screen shakes on heavy events (`base-hit` shakes on damage; amount 999 shakes on phase transition; amount 0 shakes on boss ground slams).
  - Clean state flow transitions: Main Menu -> Deploy -> Map -> Battle -> Choice Rewards -> Back to Map -> Campaign Completion.
