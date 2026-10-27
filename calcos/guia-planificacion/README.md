# 📄 La Guía de Planificación del Comandante (F2·P15) y la Final (F6·P2) con el formato del PMTD 2017

Lo pidió Sergio el 27-10-2026 con el Word de la F2·P15 del CE-I (AO LAUCA) y el formato de la Escuela al lado:
«el formato está muy mal… corregí la guía de planificación de acuerdo al formato adjunto».

## Por qué pasaba

La hoja del Comandante era un cuadro de renglones libres «Área / Sección · Guía impartida · Observación» (la
F6·P2, «Área / Sección · Guía final impartida · Plazo»). El Word convierte un cuadro así en un inciso por
renglón, con los nombres de las columnas adelante: salía «A.- Área / Sección: Apreciación y Método · Guía
impartida: … · Observación: …», «B.- Área / Sección: Inteligencia (G-2) · …», y así.

El formato de la Escuela (PMTD 2017, Parte Tercera, Cap. II «Guía del Comandante») no es un cuadro: son
párrafos numerados con su título.

| F2·P15 Guía de Planificación del Comandante | F6·P2 Guía de Planificación Final |
|---|---|
| I.- LA OPERACIÓN DECISIVA | I.- DECISIÓN |
| II.- CURSOS DE ACCIÓN PROPIOS Y DEL ENEMIGO PARA SER CONSIDERADOS | II.- INTENCIÓN DEL COMANDANTE |
| III.- REQUERIMIENTOS CRÍTICOS DE INFORMACIÓN DEL COMANDANTE (RCIC) | III.- REQUERIMIENTOS CRÍTICOS DE INFORMACIÓN DEL COMANDANTE |
| IV.- LA GUÍA DE RECONOCIMIENTO | IV.- PRIORIDADES PARA LOS SISTEMAS OPERATIVOS DEL CAMPO DE BATALLA |
| V.- RIESGO | V.- DISPOSICIONES SOBRE LA ELABORACIÓN DE LOS PLANES U ÓRDENES |
| VI.- ENGAÑO MILITAR | VI.- DISPOSICIONES SOBRE LA PREPARACIÓN Y EJECUCIÓN DE ENSAYOS |
| VII.- APOYO DE FUEGOS | |
| VIII.- APOYO DE INGENIERÍA (MOVILIDAD/CONTRA MOVILIDAD) | |
| IX.- MEDIDAS DE SEGURIDAD | |
| X.- PLAN DE TIEMPO | |
| XI.- TIPO DE ORDEN QUE SE DEBE DISTRIBUIR | |
| XII.- TIPO DE ENSAYO QUE SE DEBERÁ LLEVAR A CABO | |
| XIII.- PRIORIDADES DE APOYO DE SERVICIO DE COMBATE | |

## Qué cambió

- **La hoja** (⭐ Comandante → Mis hojas → F2·P15 / F6·P2) tiene un casillero por párrafo, con su título y,
  debajo, 📕 lo que el reglamento dice que va ahí (con su ejemplo). Es el mismo tipo de hoja que la Guía Inicial.
- **El Word** sale con los párrafos I.- … XIII.- (la Final, I.- … VI.-), el título en negrilla subrayado y el
  texto debajo, como el modelo. Salen los trece siempre, en su orden: el que quede sin guía va sólo con su
  título, así la numeración no se corre (LA GUÍA DE RECONOCIMIENTO es siempre el IV).
- **La IA** («Trabajar esta hoja con IA») recibe las trece claves y, para cada una, qué tiene que decir según el
  PMTD 2017, escrito por el Comandante en forma directiva y con los nombres del expediente.
- **Lo que ya estaba escrito con el cuadro viejo no se pierde**: cada renglón pasa al párrafo que le toca por su
  «Área / Sección» (y si no se reconoce, por lo que dice), con la observación (o el plazo) al final. Se ve así
  en la hoja, en el Word y en el pedido a la IA; queda guardado así la primera vez que se escribe en la hoja.

  | Área / Sección del renglón | Párrafo |
  |---|---|
  | Operaciones (G-3), maniobra, operación decisiva | I |
  | Apreciación y Método, cursos de acción, CAP/CAE | II |
  | Inteligencia (G-2), RCIC, RPI, EEIA | III |
  | Reconocimiento, búsqueda, vigilancia | IV |
  | Riesgo | V |
  | Engaño | VI |
  | Fuegos, Artillería, Defensa Antiaérea, morteros | VII |
  | Ingeniería, movilidad, obstáculos, supervivencia | VIII |
  | Seguridad, Comunicaciones, SAR, CDA | IX |
  | Tiempo, plazos | X |
  | Tipo de orden | XI |
  | Ensayo | XII |
  | Logística (G-4), Personal (G-1), AC/GM (G-5), sanidad | XIII |
  | Lo que no se reconoce | I |

  En la Final: decisión/CAP → I, intención → II, RCIC/inteligencia → III, orden/plan/anexos → V, ensayo → VI y
  el resto (las secciones y sus prioridades) → IV.

**Qué es del reglamento y qué es criterio de la Mesa**: los títulos, su orden y lo que va en cada párrafo son
del PMTD 2017 (Parte Tercera, Cap. II). A qué párrafo va cada renglón del cuadro viejo es criterio de la Mesa
(el modelo pone, por ejemplo, la defensa antiaérea en APOYO DE FUEGOS y al G-1 y al G-5 en PRIORIDADES DE
APOYO DE SERVICIO DE COMBATE).

**Qué no cambió**: el membrete (EMO/JEM y el correlativo de la sección, como el resto de los documentos del
Comandante), la clasificación y la firma salen como en los demás documentos militares de la Mesa.

## Dónde está

- `v1/guia.mjs`: las dos hojas (`HOJA_GUIA_PLANIFICACION`, `HOJA_GUIA_FINAL`: campos, `ayudaCampos`,
  `ayudaIA`, nota) y `leerGuia(hoja, valor)` (la lectura de lo escrito con el cuadro viejo). Sin DOM.
- En el compilado (`assets/index-guia-plan-20261027.js`, ver `CAMBIOS-EN-EL-COMPILADO.md`): el import; las dos
  hojas del Comandante son las del módulo; `leerGuia` en la hoja (`yU`), en el Word (`Jq`) y en la IA (`KD`);
  el pedido suma `ayudaIA`.

## Pruebas

```bash
cd calcos/pruebas
node guia-planificacion.mjs          # las hojas y el paso de cada renglón viejo a su párrafo
node e2e/guia-planificacion.cjs      # la Mesa real: la hoja vieja, su Word, el pedido, ✓ Aplicar, el Word y la F6·P2
node reemplazos-compilado.js         # la cadena de compilados es reversible
```
