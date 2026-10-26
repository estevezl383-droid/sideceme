# CAE del G-2: desde el lado del enemigo y sin unidades inventadas

Pasó con el ejercicio de Sergio (24-10-2026): el CE-I defiende el AO LAUCA contra la 1ª Br. Ac. «CORACEROS». En la
hoja del G-2 **«CAE — Enunciado del curso de acción más probable»**, la IA escribió:

- en **Misión** (del ENEMIGO) la misión PROPIA: «El CE-I (DIV MEC-2…) defiende el AO LAUCA…»;
- en **Estado final deseado** (del ENEMIGO) el estado final PROPIO, con una unidad que nunca estuvo en el
  ejercicio: «El primer escalón de la **VI División de Ejército** de SATURNO (1ª Brigada Acorazada «CORACEROS»)
  detenido y desgastado…».

Las hojas del G-3 muestran el CAE en «🔎 Lo que entregó el G-2» y se lo mandan a la IA, así que la «VI División»
pasó a la F3·P4 (Concepto amplio) y al P.D. 6 de la F4·P4.

## En la Mesa

| Dónde | Qué hace ahora |
|---|---|
| **G-2 → CAE** (arriba de la hoja) | ⚠️ «Revisar el CAE: …», un renglón por problema: la casilla con la misión propia, el estado final propio, la unidad que no está en el ejercicio. Se va solo cuando se corrige |
| **G-2 → CAE → 🤖 IA** | El pedido lleva «QUIÉN ES QUIÉN EN ESTA HOJA»: el sujeto es el enemigo de las fichas rojas (y su escalón), nosotros somos a quien ataca, qué va en «Misión» y en «Estado final deseado», y que no invente unidades ni escalones |
| **G-2 → CAE → ✓ Aplicar** | Si lo que quedó tiene alguno de esos errores, el mensaje dice «⚠️ OJO, el CAE tiene errores: …» |
| **G-3 → 🔎 Lo que entregó el G-2** (F2·P…, F3·P4, F3·P6, F4·P4…) | ⚠️ «Este CAE tiene errores (que lo corrija el G-2…; mientras tanto no lo copies a esta hoja)» |
| **Cada hoja del G-3** | ⚠️ «Revisar esta hoja: «VI División de Ejército» (en «P.D. 6») no está en las fichas ni en la Orden superior: el enemigo es 1ª BR. AC. «CORACEROS» (una brigada).» |
| **G-3 → 🤖 IA** | El pedido lleva «EL ENEMIGO ES EL DEL EJERCICIO» (no inventar unidades) y, si el CAE está mal, qué tiene mal y que no lo copie |
| **G-3 → ✓ Aplicar** | Si la respuesta nombra una unidad enemiga que no existe, lo avisa |

## Cómo decide

- **Misión propia**: la PRIMERA unidad que nombra la casilla es la propia (la de la Orden superior o una ficha azul)
  y es el sujeto («El CE-I … defiende»). No cuenta si antes dice «enemigo», «contra», «ataca»… («El enemigo ataca
  para destruir al CE-I» está bien). Se mira en Misión, Intención, Concepto y Estado final.
- **Estado final propio**: el enemigo (o «su primer escalón») aparece «detenido, desgastado, destruido,
  rechazado…» sin una unidad propia en el medio («la defensa del CE-I desarticulada» es del enemigo y está bien).
- **Unidad inventada**: una gran unidad con número («VI División de Ejército», «DE-VI», «II Cuerpo de Ejército»,
  «1ª Brigada»…) que el texto pone del lado ENEMIGO (cerca dice «enemigo/a» o el nombre o apodo de una ficha
  roja) y que no es una ficha roja ni algo que nombre la Orden superior. No se avisan los adyacentes («el enlace
  con la DIV MEC-1»), las propias nombradas por su designación («la DIV-6 contraataca a la 1ª Br. Ac.») ni las que
  sigue el apodo de una ficha («1ª Br. Ac. «CORACEROS»»).
- (26-10-2026, con la O.P. N° 3 de Sergio) **No se avisan**: las grandes unidades que la Orden superior pone del lado
  enemigo («SATURNO emplea… la VI DE»: «VI DE» es una división y la «VI División de Ejército» que la nombra, también),
  ni un adyacente que la Orden nombra con su calificativo aunque haya una propia con el mismo número («DIV MEC-1» no es
  la «DIV-1»). Sólo se revisan las casillas que la hoja muestra. El enemigo del aviso es la ficha roja de mayor
  escalón; si no tiene el escalón cargado, sale de la designación («1ª BR. AC.» → brigada).
- Si el escenario NO tiene fichas rojas, el aviso de misión propia igual funciona (con la unidad de la Orden
  superior); el de unidades inventadas sólo mira «enemigo/a».

## Archivos

- `v1/revisar.mjs` — sin dependencias: `fuerzas`, `formaciones`, `revisarCAE`, `unidadesInventadas`,
  `textoAvisos`, `pedidoCAE`, `pedidoG3`, `avisoAplicar`, `avisoHoja`, `avisoG2`, `despues`.
- En el compilado (`pruebas/reemplazos-2026-10-24-cae-enemigo.js`): el import, el pedido y el ✓ Aplicar del CAE,
  el aviso arriba del CAE, el recuadro del G-2 y el aviso de cada hoja del G-3, el ✓ Aplicar del G-3, y en la caja
  de la IA (`hU`) la prop `SIDdespues` (el pedido del G-3 que arma la PRC queda igual y se retoca después).
- Pruebas: `pruebas/cae-enemigo.mjs` (los textos reales del error, un CAE bien escrito, la F3·P4 y la F4·P4 de
  Sergio) y `pruebas/e2e/cae-enemigo.cjs` (en la Mesa).
