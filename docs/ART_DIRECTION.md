# Dirección de arte — Operation Dead Front

## Estilo

2D vista lateral, semi-cartoon de cómic bélico. Siluetas gruesas y legibles a tamaño
mobile. Gore estilizado, nunca realista. Tono pulp sobrenatural (referencias de tono,
no de copia: *Hellboy*, seriales pulp, *Sky Captain*).

## Paleta (0xRRGGBB)

Definida en código en `src/ui/colors.ts`. Resumen:

- **Aliados:** verdes militares — `0x5d7c4a` (línea), `0x6b8f54` (base/HQ).
- **Enemigos:** rojo oscuro/óxido — `0x8c1d1d`, `0x6b1f1f`.
- **Energía revenant:** verde tóxico `0x5EE03A` (suero, sigilos, ojos).
- **Fondo:** verdes apagados de barro/campo `0x2c3526` / `0x252e20`, noche `0x0d100c`.
- **Tinta/UI:** hueso `0xe8e6d8`, tenue `0x9aa08c`; alerta ámbar `0xd9a441`;
  HP bien `0x7bbf4a`, HP mal `0xc0432d`.

## Lectura por color y rol

El color del placeholder = rol/facción de un vistazo. Cada unidad y enemigo trae
`placeholder: { color, label }` en su data; el motor dibuja un rectángulo con su
letra. Ejemplos: R/H/M/E/S/F (unidades), G/r/Sh/X/O/Oc/P/D (enemigos). El verde tóxico
queda reservado para lo sobrenatural (Exploder, energía, sigilo).

## UI mobile

- Botones / cartas ≥ 72 px de lado en el ancho lógico de 540. Zonas táctiles de pulgar
  abajo.
- Tres zonas de HUD: **arriba** barras (supplies, HQ, bastión); **centro** el campo;
  **abajo** la barra de cartas de despliegue.
- Tipografía: stencil/condensada para títulos (Impact como stand-in), sans del sistema
  para el cuerpo.

## Lenguaje visual del enemigo

Muertos del Revenant Reich: ojos verdes brillantes, posturas rotas, metal oxidado en
los blindados/mecánicos. El boss Totenkopf usa una **calavera de vidrio con suero
verde** como emblema — explícitamente NO una calavera SS.

## Sigilo de facción — Iron Talon / Garra de Hierro

Tres garras de hierro descendentes sobre un **anillo roto** (el anillo se interrumpe
abajo). Bone white + rot green sobre fondo oscuro. Implementado como placeholder
vectorial en el menú (`MainMenuScene`). Es una marca inventada: no se parece a ninguna
insignia histórica.

## Biomas (3)

- **Trenches** — barro, alambradas, cielo plomizo (Operación First Light).
- **Ruined Town** — escombros, niebla, laboratorio (Operación Hollow Town).
- **Iron Works** — fundición, acero, brasas (Operación Iron Grave).

## VFX

Muzzle flashes cortos, explosiones naranjas, niebla ocultista verde translúcida,
"puff" de muerte (el motor ya hace un flash que se expande y desvanece). Mantener
VFX baratos y legibles; nunca tapar el estado de juego.

## Placeholders

Mientras no haya sprites: rectángulo de color + etiqueta (1–2 caracteres) + barra de
HP fina encima. Es el modo de desarrollo oficial del MVP. Sustituir por sprites no
debe cambiar la lógica: sólo el `placeholder` y el render.

## Restricciones duras de contenido

- **Prohibido:** esvásticas, runas SS, águilas/insignias reales, cualquier iconografía
  nazi histórica. La facción es ficticia.
- Los muertos del Reich son **monstruos**, nunca presentados como heroicos o simpáticos.
- Gore estilizado, no realista. Sin sexualización. Apto para store mobile.

## Checklist de legibilidad mobile

- ¿Se distingue aliado de enemigo a un vistazo por color? 
- ¿El estado de las dos bases es visible siempre (barras arriba)? 
- ¿Las cartas de despliegue muestran coste y cooldown sin tocar nada? 
- ¿Ningún VFX tapa unidades o barras por más de ~0,3 s?
