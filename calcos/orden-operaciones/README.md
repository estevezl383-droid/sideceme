# 📜 La Orden General de Operaciones (F7·P1 del G-3) con la forma de la Escuela

Lo pidió Sergio el 27-10-2026 con el Word que le bajó la Mesa («F7P1_Orden_General_de_Operaciones.docx»), la OGO
01-35 (PICB), la OGO 01/21 del CE-I («KILÓMETRO 7»), la Orden de Operaciones 05/24 del RI-20 y el texto del PMTD
2017: «está demasiado incompleta, mal redactada y muy mal hecha… la OGO contiene tareas y un montón de información que
ya hay en la Mesa». Se hizo el 29-10-2026 (`index-ogo-20261029.js`).

## Lo que estaba mal

| | Antes | Ahora (PMTD 2017, Parte Tercera, Cap. VII, y los modelos de la Escuela) |
|---|---|---|
| La numeración del Word | El Word genérico le ponía su numeración a claves que ya traían la suya: «I. Encabezamiento · A. OBJETO», «III. I.- SITUACIÓN», «B. 1 Curso de acción más PROBABLE», «C. 1 Maniobra», «G. 5 Ingenieros» | I.- SITUACIÓN (A.- Fuerzas enemigas con 1.- más probable y 2.- más peligroso, B.- Fuerzas propias, C.- Refuerzos y reducciones, D.- Hipótesis sólo en un Plan), II.- MISIÓN, III.- EJECUCIÓN (Intención sin letra, A.- Concepto con 1.- Maniobra, 2.- Fuegos…, B.-, C.-, D.-), IV.- APOYO DE SERVICIO, V.- COMANDO Y COMUNICACIONES |
| OBJETO, CARTA, ANEXOS | «[Pendiente]» arriba y repetidos como párrafos | OBJETO, CARTAS y ANEXOS arriba (un anexo por renglón) |
| Organización de la Tarea | Texto suelto | El CUADRO del modelo (una columna por agrupación; «BAJO CONTROL») |
| Intención | «Propósito: … Punto decisivo: … Tareas clave: … Estado final: …» | En forma INEXTENSA (14.° paso): «Mi intención es …, para esto es clave:» + las tareas clave + «Al finalizar la operación, …». Lo escrito con la forma vieja se redacta así en el Word |
| Tareas de las unidades | «Agrupación (OD): Atacar con Fuego.» | 1.- unidad, a.- tarea, b.- tarea… (cada tarea en presente) |
| Instrucciones de coordinación | Párrafos sueltos | La lista del PMTD numerada: entrada en vigor, RCIC (RPI / RIFA), reducción de riesgos, reglas de enfrentamiento, consideraciones ambientales, protección, adicionales, límite de avance, MCAF, ensayo, nivel de amenaza, restricciones |
| 🌱 | Casi nada: «Medios disponibles: RES (alcance 23 km)», «18 límite(s)…» | Lo que trabajó TODO el Estado Mayor (ver abajo) |
| La firma y la distribución | «G3 ………» y «Copia 1-12 : UU. DEP.» | «G-3 ………» y una copia por unidad de la organización de la tarea |
| Mesa EM → «Orden de Operaciones + matriz» | Otro borrador, con «[Completar…]» | Baja la MISMA OGO que la F7·P1 (la hoja y, en lo vacío, lo de 🌱) |

## Lo que trae 🌱 (sólo a las casillas vacías; lo escrito por el oficial o la IA manda)

| Casilla | De dónde |
|---|---|
| OBJETO | La unidad y el tipo de operación (Área de Operaciones, F2·P12, la Orden superior) |
| CARTAS | La Orden superior / la O.P. N° 3 |
| ANEXOS | Calco, Inteligencia, Apoyo de Fuegos, Ingeniería y Defensa Antiaérea (si hay esas unidades u obstáculos), Apoyo de Servicio de Combate, Comunicaciones |
| ORGANIZACIÓN DE LA TAREA | F4·P2 del G-3 (o las agrupaciones del calco) y las unidades BAJO CONTROL |
| I.- A.- | El CAE del G-2 (lo que ya traía la Mesa) o la O.P. N° 3 |
| I.- B.- | Los dos escalones superiores (misión; del inmediato, intención y concepto de la Orden) y las adyacentes (Conceptos Entrelazados) |
| II.- MISIÓN | La misión reexpresada (F2·P12), o la de la O.P. N° 3 |
| III.- Intención | La de la Guía de Planificación Final (F6·P2), o la Intención Inicial (F2·P14), redactada en forma inextensa |
| III.- A.- Concepto | El CAP aprobado (F3·P4 / F3·P6, la operación decisiva de la F2·P15) y sus FASES |
| III.- A.- 1.- Maniobra | Fase por fase, lo que hace cada unidad de maniobra en la carta (su tarea y su propósito, el esfuerzo principal) |
| III.- A.- 2.- a 6.- | Fuegos (F3·P4, F4·P7, Matriz de sincronización, F6·P2), artillería (F4·P2: AD / AG), MCAF (F6·SAL), reconocimiento (F2·P15 y los órganos del calco), inteligencia y defensa antiaérea (Matriz de sincronización), ingenieros (F3·P4, plan de barreras) |
| III.- B.- y C.- | Las tareas de cada unidad en todas las fases del CAP (las de apoyo en C.-, con la Asignación de recursos F4·SAL) |
| III.- D.- | RCIC (F2·P8 del Cmte. y del G-3, F6·P2), medidas de control del riesgo (F6·P3 / F2·P7), lo que dispone la Orden superior, movimientos (F2·SAL), puntos de decisión (F4·P4), ensayo (F6·SAL, F6·P2), limitaciones (F2·P5) |
| IV.- | La misión y el concepto de apoyo del G-4 por fase (enfoque y prioridad), la F2·P15 (XIII) |
| V.- | Sucesión de mando (el Comandante, el JEM., el G-3 y los comandantes de las agrupaciones, la OD primero), los PC de la carta, las comunicaciones de la Orden |

## Archivos

- `v1/ogo.mjs` — sin dependencias del compilado: la hoja (`HOJA`, `CAMPOS`, `AYUDA`), la guía (`GUIA`), lo que se le dice
  a la IA (`AYUDA_IA`, `ayudaIAConMesa`: el formato y lo que la Mesa ya tiene), 🌱 (`semillaOgo`, `sembrarOgo`), las
  claves de antes (`VIEJAS`, `leerOgo`), la intención inextensa (`partesIntencion`, `intencionInextensa`) y el Word
  (`wordOgo`, `bloques`, `subparrafos`, `apartado`, `equiposOrg`, `distribucion`).
- `formato-militar/v1/runtime.js` (versión `ogo20261029`): `spec.autenticador` (la OGO lo autentica el «G-3»).
- En el compilado (`pruebas/reemplazos-2026-10-29-ogo.js`, `index-ogo-20261029.js`): el import, la hoja F7·P1 del
  Tablero del G-3, la guía, 🌱 (`l3e`), el Word (`Aoe` y `Coe`), la lectura de las claves de antes (`yU`), el guardado
  sin ellas (`Ge` del Tablero) y el botón de Mesa EM.
- Pruebas: `pruebas/ogo-f7.mjs` (8 casos con las funciones REALES del compilado y la F7·P1 que bajó Sergio, y el .docx
  con el formato militar) y `pruebas/e2e/ogo-f7.cjs` (en la Mesa, escritorio y teléfono).

## Qué es doctrina y qué es criterio de la Mesa

- Los cinco párrafos, sus subpárrafos y lo que va en cada uno, la intención inextensa, los RCIC sólo en las
  instrucciones de coordinación y la Hipótesis sólo en un Plan: PMTD 2017 y los modelos de la Escuela.
- «Protección» y «Operaciones de información» como subpárrafos optativos del Concepto: el modelo del CE-I (01/21).
- La lista de anexos que propone 🌱, la sucesión de mando (OD primero) y el pasaje de las tareas en infinitivo a
  presente son criterio de la Mesa: el oficial los corrige en la hoja.
