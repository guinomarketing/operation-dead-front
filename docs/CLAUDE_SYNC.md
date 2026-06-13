# Operation Dead Front — Claude Sync & Progress Document

This document is updated automatically to help Claude understand the current state, progress, and architectural decisions made by Antigravity in this project.

## Current State: MVP 0.2 (Wave System & Traits)

We have successfully migrated the game logic from MVP 0.1 to MVP 0.2:
1. **WaveSystem.ts**: Implemented a threat-budget-based wave spawner. It reads threat configurations, budgets, and enemy stats dynamically. Winning the battle occurs when all waves are cleared and remaining enemies are killed.
2. **Special Combat Traits**: 
   - `field-medic`: Restores lowest HP ally in radius instead of attacking.
   - `suppress` (Heavy Gunner): Applies a temporary 15% slow to enemies hit.
   - `burn` (Flamethrower): Applies a Damage-over-Time (DoT) effect (3 dmg/s for 2s) and deals AoE damage to adjacent targets.
   - `priority-elite` (Sniper): Scans and attacks targets tagged as `elite` or `miniboss` first.
3. **UI Integration**: Unlocked all 6 allied units in the deploy bar (Rifleman, Heavy Gunner, Medic, Engineer, Sniper, Flamethrower) with dynamic cooldowns and cost validation.

---

## Active Work: Visual & Gameplay Overhaul (MVP 0.2+)

We are currently implementing a complete visual and gameplay overhaul to make the game feel premium and highly interactive:
1. **Lanes Visualization:** Drawing 3 sutil dirt paths and barbed-wire trenches on the battlefield canvas at `Y` coords `[470, 545, 620]` to define where combat happens.
2. **Lane Selection Deployment:** Players select a card and then tap a lane on the screen to spawn the unit, giving them direct strategic control.
3. **Active Commander Powers:** Adding 2 buttons for active powers:
   - **Airstrike:** Deals 80 damage in a 140px zone after 1s delay (animated with a falling missile trail and a massive explosion).
   - **Medkit Drop:** Heals 40 HP in a 120px area.
4. **Engineer Barricade:** Implementing the `build-barricade` trait. Spawning an Engineer deploys a stationary high-HP blocker (`unit-barricade`) in front of him.
5. **Morale System:** In-battle morale that starts at 70 (max 100). Ally deaths and base damage drop morale. Enemy kills raise it. Reaching 0 morale causes immediate defeat.
6. **No More Broken Icons:** Pass Phaser scene to HTML UI to export procedural sprites as Base64 data URLs for cards (instead of loading missing PNGs).

---

## Code Architecture Guidelines (For Claude)

- **Strict Separation of Concerns:**
  - `src/systems/`: Pure typescript logic (e.g. `BattleSystem`, `WaveSystem`). **Do NOT import Phaser** here. This logic runs headless for vitest.
  - `src/scenes/`: Handles Phaser game objects, graphics, particles, and tweens.
  - `src/ui/`: HTML UI overlay elements (`BattleUI.ts`). Uses CSS variables from `src/style.css` and colors/fonts from `src/ui/colors.ts`.
  - `src/data/`: Declarative JSON-like typescript data definitions (`units.ts`, `enemies.ts`, `abilities.ts`, etc.).
  - `src/utils/`: Constants. `constants.ts` is the single source of truth for variables.
- **Entity Identification:** Combatants use `uid: number` for identification. Avoid comparing objects directly; sync the scene renderers using `uid`.
- **Canvas Textures:** Dynamic textures (like `unit-medic` or custom zombies) are created via `SpriteFactory.ts` using HTML5 Canvas calls on Phaser `CanvasTexture`. If a PNG isn't in `public/assets/sprites/`, it defaults to the procedural drawing.

Please consult the remote repository for the latest source changes.
