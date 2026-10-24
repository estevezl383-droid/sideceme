# F4·P4 — Los puntos de decisión en la carta (G-3)

Lo pidió Sergio el 24-10-2026 con la F4·P4 «Eventos críticos y puntos de decisión» que le escribió la IA
(seis P.D. sobre la AIN-1, 2, 3 y 5): «🌱 Traer del calco lo que falte» le decía «Todavía no hay nada en el calco
para sembrar esta hoja» con la carta llena, y pidió: «me gustaría que lo pongas en la maqueta para identificar…
no quiero que pongas más texto».

## En la carta

- Cada renglón de la hoja que nombra una A.I.N. del calco (columna «A.I.N. asociada»: `AIN-3`, `A.I.N. 3`…) va
  como una **⭐ con su número** al lado de esa A.I.N. Si varios P.D. comparten A.I.N., van uno al lado del otro.
  No se escribe nada más en la carta.
- **Tocar la estrella**: la ventana de tiempo, el evento crítico, el criterio y la decisión (sin la marca
  «[IA — verificar]» en cada frase; va una vez al pie si el renglón la tiene).
- **Arrastrarla**: queda donde se la suelta (`g3.pdCarta.pos[número]` = `[lng, lat]`). «↺ Volver junto a su
  A.I.N.» (en su recuadro) la devuelve. El ↶ Deshacer de la Mesa guarda el calco (`ops`), no las hojas del G-3.
- **«Ver A.I.N.»** las esconde con las A.I.N. En el ⛰️ 3D se ven solas (el espejo copia la carta 2D).
- Donde no se puede editar (otro tablero, ejercicio finalizado) se ven pero no se arrastran.
- Un P.D. cuya A.I.N. no está en la carta no se dibuja (no se inventa el lugar).

## 🌱 Traer del calco

Además de un renglón por cada cambio de fase del C.A. propio (lo de antes), siembra **un renglón por cada A.I.N.
de la carta que todavía no tiene su P.D.** (con su «no antes de / no después de» y su indicador como criterio),
numerado después de los que ya hay. Si no queda nada, el aviso de esta hoja dice de dónde se siembra.

## Archivos

- `v1/modelo.mjs` — `puntosDeDecision(filas, ains, pos)`: qué P.D. van, dónde y en qué orden (sin dependencias).
- `v1/carta.js` — `sincronizarCarta({ ops, g3, ver, setG3 })`: lo dibuja en `window.__mapa2d`.
- En el compilado (`pruebas/reemplazos-2026-10-24-puntos-decision.js`): el import, la llamada y la siembra.
- Pruebas: `pruebas/puntos-decision.mjs` y `pruebas/e2e/puntos-decision.cjs` (con las filas reales de la IA en
  `pruebas/puntos-decision-ejemplo.js`).
