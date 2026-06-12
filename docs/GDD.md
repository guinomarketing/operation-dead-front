# Operation Dead Front — Game Design Document

## Ficha

- **Título:** Operation Dead Front
- **Género:** Roguelite táctico de frente lateral (lane battler + run con mapa).
- **Plataforma:** Mobile (portrait), 2D. Web/desktop como entorno de desarrollo.
- **Referencia mecánica:** *Warfare 1917* (frente lateral, despliegue por recursos,
  presión de línea, moral). No se clona: identidad y contenido propios.
- **Fantasía central:** comandás un destacamento que frena una marea de muertos
  reanimados por un culto bélico. Cada decisión —qué desplegar, cuándo gastar, qué
  ruta tomar, qué reliquia llevar— pesa más que los reflejos.

## Pilares de diseño

1. **Decisiones > reflejos.** El combate es legible y semiautomático; el jugador
   decide composición, timing económico y uso de habilidades, no microcontrol.
2. **"Una run más".** Estructura roguelite corta (12–16 min), build emergente,
   recompensas que cambian el próximo intento.
3. **Legibilidad mobile.** Silueta y color comunican rol y amenaza a un golpe de
   vista; UI de pulgar, botones grandes, una pantalla.
4. **Build emergente.** Reliquias, upgrades, comandantes y mutaciones se combinan
   en sinergias buscadas (ver §Sinergias).
5. **Pulp anti-nazi sin iconografía real.** Enemigo ficticio (Revenant Reich),
   monstruos nunca heroicos, sin símbolos históricos.

## Lore breve

El **Revenant Reich** es lo que quedó de un ejército derrotado, reanimado por el
**Proyecto Umbra** y el **Rito de la Última Marcha**. Su enseña es la **Garra de
Hierro** (*Iron Talon*): tres garras sobre un anillo roto. El jugador comanda la
**Task Force Gravedigger**, enviada a enterrar otra vez lo que no quiere quedarse
bajo tierra. Villano recurrente: **Doctor Totenkopf**, padre del suero (emblema:
calavera de vidrio con suero verde — nunca una calavera SS).

## Loops

- **Loop de combate (segundos):** desplegás unidad → avanza y pelea sola → cobrás
  bounty → re-desplegás / lanzás habilidad.
- **Loop de batalla (1–2 min):** assault (destruí el bastión) o defense (sobreviví
  N oleadas) → pantalla de recompensa (elegís 1 de 3 cartas).
- **Loop de run (12–16 min):** recorrés un mapa tipo *Slay the Spire* de nodos →
  batallas, élites, eventos, supply, HQ → boss final de la operación.
- **Loop meta (entre runs):** ganás medallas e intel → desbloqueás unidades,
  comandantes y operaciones.

## Combate

**Campo.** Franja lateral dentro de la pantalla vertical. Base aliada a la izquierda
(x≈50), bastión enemigo a la derecha (x≈490). Tres sub-carriles (y = 470/545/620)
dan profundidad y reparten unidades para legibilidad. Números base en
`src/utils/constants.ts`.

**Despliegue.** No hay soldados persistentes individuales: se desbloquean **tipos**
de unidad por run y se despliegan ilimitadamente, gateados por **coste** (supplies)
y **cooldown** por tipo. Tope simultáneo aliado: 10 (perf + lectura).

**Economía.** *Supplies* es la moneda por batalla (arranque 40, +8/s). Matar enemigos
da *bounty*. *Intel* y *medallas* son meta-moneda (no se gastan en batalla).

**Moral** (MVP 0.2+). Persiste entre batallas. Sube por matar (especialmente élites),
limpiar oleadas y ganar; baja por bajas (2 + coste/25), golpes a la base y daño
recibido. A 0 = ruta (derrota inmediata). Fuente única de números: `MORALE` en
constants.

**Vida.** HQ aliado = **vida de la run** (100, persiste entre batallas). Bastión
enemigo = 250 por batalla (modo assault). Las unidades que llegan a una base la
golpean por su daño.

**Win / lose.** Assault: bastión a 0 = victoria; HQ a 0 = derrota. Defense: sobreviví
las oleadas = victoria.

**Modos de batalla.** `assault` (destruir bastión) · `defense` (aguantar oleadas).

**Habilidades de comandante** (MVP 0.2+). 2 slots base (3 con War Room T3). Coste en
supplies + cooldown. Ej.: Airstrike, Artillery Barrage, Medkit, Rally, Supply Drop,
Smoke Screen, Holy Flare. Definidas en `src/data/abilities.ts`.

## Estructura de run

Mapa generado por semilla, tipo *Slay the Spire*: 8–10 filas, 2–4 nodos por fila,
boss en la cima. Tipos de nodo: `battle`, `elite`, `event`, `supply`, `hq`, `boss`.

Reglas de generación: al menos un `hq` y un `supply` por run; sin élites en las
filas 1–2. Distribución objetivo aproximada: 45% battle, 12% elite, 18% event,
10% supply, 10% hq, + 1 boss.

Recompensa post-combate: elegir 1 de 3 cartas (desbloquear unidad / upgrade /
reliquia / paquete de supplies+moral). Nodos élite garantizan opción de reliquia.

## Contenido (resumen)

Definido en `/src/data` — acá sólo el índice, los números viven en la data:

- **Unidades (6):** Rifleman, Heavy Gunner, Medic, Engineer, Sniper, Flamethrower.
- **Enemigos (8):** Revenant Grunt, Runner Corpse, Shielded Revenant, Exploder,
  Dead Officer (élite), Occultist (élite), Panzer Corpse (miniboss), Rot Hound.
- **Bosses (3):** General Eisenfaust, Doctor Totenkopf, Panzer Corpse Engine.
- **Habilidades (7), Edificios (6) + Upgrades (18), Reliquias (20), Eventos (25),
  Mutaciones (6), Comandantes (5), Operaciones (3).**

## Sinergias buscadas

- **Armory (incendiary/AP) + Flamethrower/Lucky Zippo** → control de hordas con fuego
  en el suelo.
- **Sniper + Match-Grade Scope + Intel Room** → eliminación quirúrgica de élites.
- **Med Tent + Experimental Serum** → frente que no muere, con riesgo de cicatriz.
- **Engineer + Engineer's Toolkit** → muro de estructuras barato y resistente.
- **Father Donovan / Holy Flare + Blessed Ammo** → counter dedicado a ocultistas.
- **Reaper's Ledger / Dog Tag Ledger** → economía agresiva basada en kills.

## Comandantes

5 comandantes (3 iniciales: Miller, Brooks, Carter; 2 por 100 medallas: Ramirez,
Donovan). Cada uno trae unidades y habilidades iniciales + pasivas. Ver
`src/data/commanders.ts`.

## Progresión permanente

- **Medallas:** 10 por ganar una run, 5 por llegar al boss, 1 por cada élite.
- **Intel:** de élites (1–3) y eventos.
- **Desbloqueos (medallas):** Operación 2 (40), Operación 3 (90), Ramirez (100),
  Donovan (100). Chaplain/Commando como unidades futuras.

## Balance inicial

Números base en `constants.ts`. Objetivo de sensación: una fodder muere en 3–5 s
ante una unidad; una batalla assault dura ~20–40 s en el MVP. El smoke test del
`BattleSystem` confirma derrota pasiva (~24 s) y victoria con presión (~22 s).

## Trincheras capturables

Diferidas a fase Alpha (post-MVP 0.3): puntos de control a media cancha que reducen
daño recibido, guiño directo a *Warfare 1917*. No están en el MVP.

## Monetización (a futuro, no P2W)

Cosméticos (skins de unidades/comandantes), operaciones premium, pase de temporada
cosmético. Sin energía, sin gacha, sin ventaja pagada.

## Riesgos de scope y cortes

- **Cortar primero si aprieta:** Chaplain/Commando, Operación 3, mutaciones, moral
  enemiga, clima.
- **Nunca en v1:** multiplayer, mundo abierto, cinemáticas, gacha.

## Glosario

- **Supplies:** moneda de batalla. **Bounty:** supplies por matar. **Intel/Medallas:**
  meta-moneda. **Bastión:** base enemiga. **HQ:** base aliada (vida de la run).
- **Reliquia:** modificador permanente de run. **Mutación:** modificador negativo de
  dificultad. **Operación:** una run/campaña completa con su boss.
