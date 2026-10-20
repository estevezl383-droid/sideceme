# ⊞ Disgregar una gran unidad en sus dependientes — 20-10-2026

Lo pidió Sergio en la F2·SAL «Movimientos iniciales», con el CE-I como una sola ficha en la carta:

> «Quiero que ese Cuerpo de Ejército se convierta en Puesto Comando y que aparezcan las tres fichas:
> DIV MEC-2, DIV-1, DIV-6» (el GALM-1 en refuerzo ya estaba puesto).

## En la Mesa

🪖 **Unidades** → en la lista, cada gran unidad propia (Brigada, División, Cuerpo, Ejército) lleva
**⊞ Disgregar**:

1. La Mesa lee sus dependientes **inmediatas** (un nivel abajo, más los apoyos y lo que va en refuerzo)
   de la **organización de la tarea** de MESA EM («CE-I: DIV MEC-2, DIV-1, DIV-6; GALM-1 en refuerzo»);
   si está vacía, de la línea o el bloque de esa unidad en los **documentos del ejercicio**.
2. Muestra la lista para **revisarla o corregirla** (si no encontró nada, se escribe: «DIV MEC-2, DIV-1,
   DIV-6, GALM-1 (en refuerzo)»).
3. Aparecen las fichas **alrededor de la madre**, para arrastrarlas a su lugar. Las que **ya están** en
   la carta no se duplican: quedan marcadas como dependientes.
4. La madre queda como su **Puesto Comando** (misma designación): ya no cuenta como unidad de maniobra,
   así la Formación inicial (F3·P3) no cuenta dos veces las mismas fuerzas.

**⊟ Reagrupar** lo deshace (quita las fichas que se pusieron) y **↶ Deshacer** también. Cada división
puesta así se puede disgregar a su vez en sus brigadas.

La **F2·SAL Movimientos iniciales** («🌱 Traer del calco lo que falte») lleva un renglón por cada
dependiente: ocupación de su zona de reunión y desplazamiento a su posición de partida.

## Dónde se guarda

En cada ficha: la madre `tipo: 'pc'` y `disgregada: { puestas, vinculadas, tipoAntes }`; cada
dependiente, `dependeDe` (el id de la madre) y `relacion` («en refuerzo»…).

## Pruebas

`pruebas/disgregar.mjs` y `pruebas/e2e/disgregar.cjs`.
