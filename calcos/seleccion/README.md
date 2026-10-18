# ⬚ Seleccionar en la carta (como en PowerPoint) — 18-10-2026

Lo pidió Sergio con la captura del tablero del G-4, con los 30 puestos del Batallón
Logístico amontonados en la carta: «necesito una herramienta que me permita seleccionar
objetos… aquí en el G-4 no encuentro cómo borrar esos símbolos… dibujar un área,
seleccionar, y hacer clic otra vez para deseleccionar uno por uno, así como en PowerPoint».

Antes, cada ficha se borraba de a una (clic derecho → confirmar; una instalación, desde su
cartel → «ELIMINAR INSTALACIÓN»). Con 30 puestos encimados era imposible.

## Cómo se usa

Botón **«⬚ Seleccionar»** en la barra de la carta, al lado de «📏 Regla» (carta 2D). En pantallas
de menos de 1600 px de ancho (portátil, iPad) el botón muestra sólo **«⬚»**: con el texto la barra
sumaba una fila y tapaba más carta.

| Gesto | Qué hace |
|---|---|
| Arrastrar un recuadro | Suma a la selección las fichas (por su centro) y las figuras del calco que quedan **enteras** adentro |
| Alt (o Ctrl) + recuadro | Quita de la selección lo que queda adentro |
| Clic en una ficha o figura | La suma o la quita (de a una) |
| Supr / Retroceso o «🗑 Borrar» | Borra todo lo seleccionado **de una vez** |
| «↶ Deshacer» de la barra | Devuelve todo lo borrado **de un toque** (fichas y figuras juntas) |
| Ctrl + A | Selecciona todo lo que se ve en la carta |
| Esc | Suelta la selección; otro Esc (o «✕ Salir») sale de la herramienta |
| Botón derecho o rueda apretada + arrastrar | Mueve la carta (con el izquierdo se selecciona); la rueda acerca y aleja |

En la barrita de la herramienta: cuánto hay seleccionado, «🪖 Fichas» y «📐 Figuras» (qué
toma el recuadro y el clic), «🗑 Borrar», «Ninguno» y «✕ Salir».

Qué se selecciona:

- **Fichas**: unidades e instalaciones (también los puestos de la plantilla del ASDI), las
  que se ven en la carta (respeta «Fichas propias / enemigas» de «👁 Qué se ve en el calco»).
- **Figuras del calco**: tareas, límites y líneas, marcas de magnitud, puntos de
  coordinación y de pasaje, flechas, áreas y sectores logísticos, ejes, líneas del EM,
  obstáculos, posiciones defensivas, objetivos y flechas de maniobra — las de las capas
  prendidas.
- **No** entran el Área de Operaciones, el Área de Interés, el Área de Influencia, las
  A.I.N. ni el CMOC: son el marco del ejercicio y se borran como siempre (clic derecho).

Al borrar, cada figura se va como con el clic derecho de la Mesa: un límite se lleva su
marca de magnitud (las de los límites siguientes se renumeran) y un área logística las
marcas de su borde. Con el ejercicio finalizado no se borra nada (el candado de siempre).

## Archivos

| Archivo | |
|---|---|
| `v1/modelo.mjs` | Sin pantalla: qué se puede seleccionar (`figuras`), el recuadro (`enElRecuadro`), el clic (`tocado`: ficha → punto → línea o borde → el relleno del área más chica) y el calco después de borrar (`quitarDeOps`). |
| `v1/seleccion.mjs` | La herramienta en la carta 2D (`window.__mapa2d`): el velo que recibe el ratón y el dedo (la carta no se entera), el recuadro, las marcas de lo seleccionado, la barrita y el teclado. `window.SIDSeleccion.estado()` dice qué está seleccionado. |

## En el compilado

`index-seleccionar-20261018.js` (ver `CAMBIOS-EN-EL-COMPILADO.md` y
`pruebas/reemplazos-2026-10-18-seleccionar.js`): el import, el botón (`ba === "seleccionar"`,
la misma herramienta que la Regla), el atributo `data-sid-unidad` en el dibujo de cada ficha
de la carta 2D y el puente `sincronizarSeleccion({ activa, es3D, leaflet, ops, opsVisibles,
verCapa, unidades, aplicar, salir, avisar })`. `aplicar({ unidades: [ids], ops })` guarda
UNA foto (fichas + calco) en la pila del ↶ Deshacer y `Mg` la devuelve entera.

## Pruebas

```bash
cd calcos/pruebas
node seleccion.mjs        # el modelo (y que borra igual que el clic derecho del compilado)
node e2e/seleccion.cjs    # la Mesa real en Chromium: plantilla del ASDI, recuadro, clic, Supr, deshacer, Alt, Esc, guardado
```
