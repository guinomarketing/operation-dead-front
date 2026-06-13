# Próximos pasos — Operación Cóndor Muerto

Estado: landscape jugable de punta a punta + fondo y key art finales (Magnific).
Lo que sigue, en orden de impacto hacia una **v1.0 premium**.

## Para una v1.0 más premium (orden recomendado)
1. **Personajes con arte final (P1)** — generar e integrar sprites de unidades, enemigos y
   el primer boss (prompts en `MAGNIFIC_PROMPTS.md`). Reemplazar `SpriteFactory`. Es el
   mayor salto de percepción tras los fondos.
2. **Animaciones (P1)** — mínimo idle/walk/attack/death por unidad y enemigo (spritesheets
   o tweens). Hoy las unidades sólo "bobbean".
3. **Audio + música (P1)** — `AudioSystem` con SFX (disparo, fuego, explosión, despliegue,
   muerte, UI, daño a base, cambio de oleada) y loops (menú/combate/boss/victoria/derrota)
   + settings de volumen. Hoy el juego es mudo.
4. **Tutorial (P1)** — onboarding integrado en la primera batalla (desplegar, carriles,
   recursos, moral, habilidades, run, reliquias).
5. **Variedad de rooms (P2)** — fondos y objetivos por tipo de sala (emboscada, defensa,
   rescate, laboratorio, antena, tienda, mini-boss) + modificadores para que cada run cambie.
6. **Meta-progresión + guardado (P2)** — desbloqueos persistentes entre runs (localStorage),
   recompensas post-run, dificultad escalable.
7. **Pantallas faltantes (P2)** — splash, configuración completa, créditos, selección de
   comandante/escuadrón; event screen a 2 columnas (ilustración izq / texto der).
8. **Balance (P2)** — pasada de números (costos, HP, oleadas, economía) para early/mid/late.

## Para Play Store
- Build Android con **Capacitor**, orientación bloqueada en landscape, test en gama media.
- Icono de app, key art (✅ base lista), 5–8 screenshots de gameplay, descripción corta/larga,
  pitch, clasificación de contenido (atención al uso de zombis nazis → usar siempre la
  facción ficticia, sin simbología real).
- Política de privacidad si se agrega analytics.

## Para monetización (a futuro)
- Cosméticos (skins de unidad, tints), no pay-to-win; posibles run-modifiers desbloqueables.
- Pase de temporada o desbloqueo premium de operaciones adicionales.

## Para un trailer
- Capturar gameplay real (combate, habilidad, boss, mapa) a 1080p; usar el key art como
  cierre; música de combate/boss; 20–30 s, ritmo rápido.

## Deuda técnica / riesgos
- Reemplazar texturas procedurales de `SpriteFactory` por arte final sin romper `UnitRenderer`.
- Code-splitting del bundle (Phaser pesa ~1.6 MB; warning de chunk >500 KB).
- En dev, HMR + Phaser apila instancias — recargar la pestaña; no afecta producción.
