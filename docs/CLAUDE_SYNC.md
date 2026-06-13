# Operation Dead Front — Claude Sync & Progress Document

This document is updated automatically to help Claude understand the current state, progress, and architectural decisions made by Antigravity in this project.

## Current State: MVP 0.4 (XCOM-Style Squad Roster, Customization & Permadeath) ⚙️ (In Progress)

We are currently implementing **MVP 0.4 (El Plantel y Permadeath)**:
1. **Persistent Squad Roster**: A list of named, custom soldiers (`RosterSoldier`) stored in `RunState` and initialized with 8 starting recruits of different classes.
2. **Individual Customization**: Nicknames can be edited in real-time, and color tints can be selected to change their in-battle sprite color.
3. **Level & XP Progression**: Soldiers earn XP for surviving combat and scoring kills. They level up (ranks 1-5), improving their base HP (+15% per level) and Damage (+10% per level).
4. **Permadeath**: If a soldier falls in battle, they are lost forever. If the roster reaches 0, the campaign fails.
5. **Recruitment**: Added "Recruit Specialist" option at shops (using Intel) and camps (free reinforcement) to prevent roster depletion.
6. **Deployment Limitation**: Soldiers are unique resources; once deployed in a battle, they cannot be deployed again in that same battle. Deploy cards show the remaining count of available units.

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
