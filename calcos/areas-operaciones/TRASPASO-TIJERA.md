# Traspaso — La tijera ✂️ del Área de Operaciones (Mesa del EM) · 16-10-2026

Resumen para seguir en otra sesión. Lo que viene son **correcciones, sobre todo del corte del área (el polígono)**.

---

## 0. Para pegar al empezar la sesión nueva

> Repo `estevezl383-droid/sideceme`, Mesa del Estado Mayor en `calcos/`. Leé
> `calcos/areas-operaciones/TRASPASO-TIJERA.md` (este archivo) y la sección «✂️ La tijera…» de
> `calcos/areas-operaciones/README.md`. Tengo correcciones del corte del área/polígono que te voy a
> describir con capturas. Primero analizá y preguntame si algo no se entiende; no publiques nada
> (servidor ni merge) sin preguntarme.

(Si este archivo no está en el repo, pegá su contenido entero.)

---

## 1. Dónde quedó

| Qué | Estado |
|---|---|
| Página (Mesa) | PR [#111](https://github.com/estevezl383-droid/sideceme/pull/111) **juntado** en `main` (commit `a93e231`). GitHub Pages publicó bien (16-10-2026 09:15 UTC). |
| Servidor `calco-ops` (Supabase SIDECEME-V2, `ofsyiylhdrdiqtnbaovo`) | **v11 publicada** 16-10-2026 01:55 UTC, JWT OFF. **Todavía nadie la usó**: confirmar que al compartir diga «guardado». |
| Rama `claude/practical-turing-hwy90f` | Ya juntada. Lo nuevo va en una rama nueva desde `main`. |
| Para verlo | Abrir la Mesa → «Recargar» en «Hay una versión nueva» → botón **✂️ CORTAR ÁREA** (al lado de «▧ Área de Ops»). |

---

## 2. Qué pidió Sergio y qué eligió

Con las capturas de **FABBLE 1.1**: cortó el área del Cuerpo de arriba y salió mezclada con el Cuerpo de
abajo (sombreado y líneas que seguían de largo), y faltaban las unidades de Rojo.

- La herramienta de cortar va **en la barra principal**, no sólo dentro del panel ▧.
- **El polígono se corta tomando como referencia los límites de las unidades** (sub-área de UN solo
  Cuerpo, sin mezclarse con el vecino).
- **Las líneas se cortan donde pasó el lazo** (no enteras).
- **Todo lo que esté activado y se vea en la mesa** (fichas propias **y enemigas**, objetivos, maniobra,
  CMOC, avenidas de aproximación, calcos del terreno…), **cortado por donde pasó la tijera**.
- Fuera de las Áreas de Operaciones va todo lo activado que encierre el lazo; **dentro, sólo lo del
  área cortada**.
- **Vista previa y confirmar** antes de cortar.

---

## 3. Cómo funciona hoy el corte del polígono (lo que hay que corregir)

Flujo: `tijera.mjs` → lazo (`lazo.mjs · iniciarLazo`) → `repartir` (vista previa) → toques →
**✓ Cortar y guardar selección** → `modelo.mjs · recortarArea` + `guardarSeleccion` (una sola foto del ↶).

Todo está en `calcos/areas-operaciones/recorte.mjs` (coordenadas `[lng, lat]`; el cálculo se hace en
metros sobre un plano local equirectangular).

### 3.1 Elegir el área que se reparte — `repartir` (`recorte.mjs:267`)
- Se toman 20 muestras del contorno del lazo; gana el área con más muestras adentro. Entre las que
  tienen ≥ 90 % del mejor puntaje, **la más chica** (así se reparte un Cuerpo en Divisiones).
- Con un toque (sin lazo): el área que contiene el toque.

### 3.2 Partir el área en zonas — `caras` (`recorte.mjs:99`)
- Cortan el área: **`ops.limites` que no son «medidas» ni flechas** (`esMedida`, `recorte.mjs:252`) y
  **los contornos de las otras Áreas de Operaciones**.
- `esMedida` = línea de fase/LCAF/área de empeño: origen `ogo-ia`, **o con nombre y sin magnitud**, o
  punteada cerrada. **No cortan** el área (siguen yendo con ella).
- Cada extremo de línea se **alarga `S`** = 3 % de la diagonal del área (entre 150 m y 5 km), para que
  un límite que quedó corto llegue al borde; lo que sobra se poda.
- Dos vértices a menos de 0,5 m son el mismo.
- Si nada divide el área → se corta **por el lazo mismo** (`libre: true`).

### 3.3 Elegir las zonas
- Lazo: entra una zona si **≥ la mitad de sus 24 muestras** caen dentro del lazo.
- Las zonas que ya son de otra área cortada dentro de la misma («hermanas», un Cuerpo ya repartido)
  se dejan afuera (`dejadas`); si sólo hay de esas, se avisa (`encima`).
- **Toques de la vista previa** (`seleccion.toques`): cada toque suma o quita la zona de abajo.
- Devuelve `zonas` (todas, con `elegida`) para pintarlas en `lazo.mjs · vistaPrevia`.

### 3.4 Armar el contorno — `union` (`recorte.mjs:226`)
- Borra las aristas entre zonas elegidas y recorre el borde.
- ⚠️ **Se queda sólo con el anillo más grande** (`anillos[0]`): si las zonas elegidas no se tocan
  (`separadas: true`), **las chicas se pierden**. No hay huecos.

### 3.5 Nombre y escalón — `escalonDelBorde` / `topeDelArea` (`recorte.mjs:398–420`)
- El escalón = el **menor** de los límites **con magnitud** que bordean el área (tolerancia 1,2 % de la
  diagonal, 100 m–5 km). Rodeada por límites de Cuerpo → «CE-I», «CE-II»…
- Los límites del borde de un escalón **mayor** (los de la FF.TT.T.O.) no van con el área.
- `modelo.mjs · recortarArea` (`modelo.mjs:170`) arma el área: nombre `CE-<romano>`, hereda
  `operacion/tipo/modalidad/ambiente` del área madre y guarda `origen: { recorte: <id madre> }`.

### 3.6 Lo que se entrega — `regionTijera` (`recorte.mjs:681`) y `recortarContenido` (`recorte.mjs:841`)
- Región = **dentro del lazo** Y (dentro del área cortada, **o** cerca de su borde, **o** fuera de
  todas las otras Áreas de Operaciones).
- Tolerancias: líneas `eps` = 0,02 % de la diagonal (2–30 m); **puntos/fichas `tolPunto` = 1,2 % de la
  diagonal (100 m–5 km)**.
- Sin lazo (un toque): la región es el área.
- `cortarLinea` (`:706`): corta cada línea donde cruza un borde (índice en grilla `indiceBordes`).
- `cortarPoligono` (`:755`): recorta polígonos con `caras` (sólo el anillo exterior).
- Flechas: enteras si su mitad cae adentro. Las marcas de un límite siguen a su pedazo.
- Sólo lo que se ve: teclas de «Qué se ve en el calco» (`unidadesAzul`, `unidadesRojo`, `objetivos`,
  `maniobra`, `ains`, `zonasLog`, `posDef`, capas del CMOC), el botón CLANDESTINOS de la barra y los
  calcos del terreno prendidos (`resultados`).

---

## 4. Puntos flojos conocidos (candidatos para las correcciones)

1. **Zonas separadas**: sólo queda el pedazo más grande (§3.4).
2. **Límite con nombre pero sin magnitud** = se toma como línea de fase y **no corta** el área (§3.2).
   Si un límite de unidad no tiene `escalon`/`tipo: 'magnitud'`, el área no se parte por él.
3. **Alargue `S` de hasta 5 km**: un límite que termina a propósito antes del borde igual corta. Uno
   que se pasa poco puede dejar una zona finita (astilla).
4. **Elección por la mitad de las muestras**: una zona tapada a medias puede entrar o no entrar, y eso
   sorprende.
5. **Fichas del vecino cerca del límite compartido**: `tolPunto` (hasta 5 km) puede meter unidades del
   Cuerpo vecino que están pegadas al límite → posible «mezcla».
6. **Elección del área madre**: si el lazo tapa parecido a FABBLE y a CE-I, gana la más chica.
7. **Polígonos con huecos**: `cortarPoligono` sólo mira el anillo exterior.
8. **Vista 3D**: no se tocó; muestra sólo el área activa.
9. **No viaja**: la plantilla situacional del G-2.
10. **Selecciones viejas** (CE-I, CE-V de antes del 16-10) no tienen `tijera`: hay que volver a cortarlas.

### Síntoma → dónde mirar

| Si pasa esto… | Mirar |
|---|---|
| El área no sigue el límite / se corta donde no debe | `caras`, `corta`/`esMedida`, alargue `S` en `repartir` |
| Falta un pedazo del área | `union` (sólo `anillos[0]`), elección por muestras, `hermanas`/`dejadas` |
| Se mezcla con el Cuerpo vecino (zona) | `repartir`: contornos de otras áreas como cortes, `hermanas` |
| Se mezcla con el Cuerpo vecino (fichas/líneas) | `regionTijera` (`tolPunto`, `eps`, `otras`) |
| Las líneas siguen enteras / cortadas mal | `cortarLinea`, `indiceBordes`, `cortesTramo` |
| Un polígono (zona log., AE, avenida) mal recortado | `cortarPoligono`, `puntoInterior` |
| Falta algo que estaba prendido (Rojo, CMOC, calcos) | `recortarContenido`, `VIS_OPS`, `capasCmocVisibles` |
| Nombre/escalón equivocado (CE-I vs DIV…) | `topeDelArea`, `escalonDelBorde`, `recortarArea` |
| La vista previa no pinta o el toque no suma | `lazo.mjs · vistaPrevia`, `tijera.mjs:87–110` |

---

## 5. Correcciones que quiero hacer (completar)

> Sergio: anotá acá cada corrección (y adjuntá la captura en la sesión nueva).

1. **Qué hice**: en FABBLE 1.1 cortó con el lazo la parte de arriba (CE-VI) y abrió
   `Seleccion_CE-VI.json` como ejercicio nuevo («CE-VI.1»).
   **Qué salió**: abajo seguía un polígono «AO CE-I» hasta el fondo; parecía que el corte no había
   achicado el área.
   **Qué pasaba**: **el corte estaba bien** (CE-VI.1 tiene sólo CE-VI, con los límites cortados en el
   límite de abajo, y así lo quiere: también la franja entre el frente y el límite de la izquierda).
   El polígono era un archivo de áreas de FABBLE (CE-I y CE-II) cargado antes en **🧩 Superponer**,
   que el navegador recuerda y mostraba encima de cualquier ejercicio. **Pista**: si un rótulo dice
   «AO …» con la unidad abajo, en la esquina de abajo a la izquierda, es de Superponer (las áreas del
   ejercicio dicen «ÁREA DE OPERACIONES …»).
   **Arreglo (eligió «que se apague solo»)**: lo cargado en Superponer se ve sólo en su ejercicio; al
   abrir otro se apaga con aviso y queda en el tablero (`superponer.js`, ver README «🧩 El JSON del
   corte se abre limpio»). Prueba: `e2e/superponer-ejercicio.cjs`.
2. …

---

## 6. Archivos

| Archivo | Qué hace |
|---|---|
| `calcos/areas-operaciones/recorte.mjs` | Todo el cálculo: repartir, caras, union, región de la tijera, cortes de líneas/polígonos, qué se entrega. Lo usan el navegador **y el servidor**. |
| `calcos/areas-operaciones/modelo.mjs` | `recortarArea`, `guardarSeleccion` (guarda `tijera: { lazo, vista }`), `paqueteSeleccion` (JSON), `contenidoTijera`, `vistaLimpia`. |
| `calcos/areas-operaciones/tijera.mjs` | La tarjeta de la tijera (fases lazo/vista/guardada/aviso), arriba a la izquierda. Exporta `pedirTijera`, `pedirCompartir`, `terrenoDeLaMesa`. |
| `calcos/areas-operaciones/lazo.mjs` | El lazo a mano alzada y `vistaPrevia` (zonas punteadas, celeste = se cortan, toque suma/quita). |
| `calcos/areas-operaciones/editor.mjs` | Panel ▧ Área de Ops; su botón «✂️ Cortar con la tijera» llama a `pedirTijera()`. |
| `calcos/areas-operaciones/abrir-archivo.mjs` | Abrir el JSON: trae calcos cortados, lazo como Área de Interés, `calcosVer`. |
| `calcos/areas-operaciones/compartir-modelo.mjs` / `compartir-editor.mjs` | Compartir al ciclo/paralelo; con `opciones.tijera` corta igual; si pasa de 2 MB va sin calcos (`calcosFuera`). |
| `calcos/modalidad/modalidad.js` | Paso 13 del Profesor: manda `tijera` y los calcos. |
| `calcos/assets/index-tijera-20261016.js` | Compilado vigente (no se edita a mano). |
| `supabase/espejo-ge/calco-ops/` | `index.ts` + `compartir.mjs` del servidor. |

Los módulos se importan con **`?v=tijera20261016`** (dentro de los `.mjs`, en `modalidad.js` y dentro
del compilado). **Si cambia un `.mjs`, cambiar el `?v=` en todos lados**; como el compilado también
lo tiene, eso pide un compilado nuevo.

---

## 7. Cómo cambiar el compilado (sólo con reemplazos reversibles)

1. Lista nueva `calcos/pruebas/reemplazos-AAAA-MM-DD-<nombre>.js` (cada uno con `nombre`, `viejo`,
   `nuevo`, `veces`), tomando como base **`index-tijera-20261016.js`**.
2. `construir-<nombre>.js` copiando `calcos/pruebas/construir-tijera.js` → genera
   `calcos/assets/index-<nombre>-AAAAMMDD.js` (el anterior se conserva).
3. Agregar el PASO en `calcos/pruebas/reemplazos-compilado.js` (cadena SHA-256: el `anterior` es el
   SHA del compilado vigente) y verificar la reversión byte por byte.
4. Cambiar en `calcos/index.html` el `src` del compilado y los `?v=` que correspondan
   (el aviso «Hay una versión nueva» lo detecta solo).

---

## 8. Pruebas

```bash
npm ci --prefix calcos/pruebas
npm test --prefix calcos/pruebas              # todas las unitarias (incluye la cadena del compilado)
node calcos/pruebas/areas-tijera.mjs          # la tijera: FABBLE ficticio, toques, nombre, cortes, Rojo, JSON, servidor
node calcos/pruebas/e2e/areas-tijera.cjs      # la Mesa en Chromium (capturas en calcos/pruebas/salidas-tijera/)
node calcos/pruebas/e2e/areas-lazo.cjs
node calcos/pruebas/e2e/areas-seleccion.cjs
node calcos/pruebas/e2e/superponer-ejercicio.cjs   # lo de 🧩 Superponer se apaga al abrir otro ejercicio
```

- `e2e/trazos.cjs` tiene **2 fallas que ya estaban antes** («dedo (Safari) · Área de Operaciones: doble
  toque»); no son de la tijera.
- Correr las e2e cambia PNG versionados de `salidas-modalidad`: `git checkout` antes de commitear.
- Para cada corrección: **primero una prueba que reproduzca el caso de Sergio** en `areas-tijera.mjs`,
  después el arreglo.

---

## 9. Servidor `calco-ops`

- Se despliegan 5 archivos **con los imports aplanados y sin `?v=`**: `index.ts`, `compartir.mjs`,
  `compartir-modelo.mjs`, `modelo.mjs`, `recorte.mjs` (en `compartir.mjs` el import pasa a
  `./compartir-modelo.mjs`). **JWT OFF** (valida la sesión de SIDECEME). Sin migraciones.
- Si se cambia `recorte.mjs`/`modelo.mjs`/`compartir-modelo.mjs`, **el servidor también necesita la
  versión nueva** (corta igual al compartir). Preguntarle a Sergio antes de publicar.
- **Volver a la v10** si la v11 falla: desplegar esos mismos 5 archivos tal como estaban en el commit
  `eaec838` (el `main` de antes del merge), aplanados igual.
- Logs: `function_edge_logs` en Supabase (buscar `calco-ops`).

## 10. Datos reales para diagnosticar (sólo lectura)

- Tabla `calcos` (columna `payload`: `ops.areaOps`, `ops.areasOps`, `ops.limites`, `ops.selecciones`,
  `resultados`…) y `calco_versiones`.
- **FABBLE 1.1**: `calcos.id = '2ab61c4c-acf8-4bd3-bc4a-a9284093f45e'` (P030; áreas FABBLE, CE-I, CE-II,
  CE-III…).
- **CE-I** abierto desde el JSON (el resultado viejo, con el problema): `996350dc-a232-4e16-b1d2-3c7b3ecb0fcc`.
- Con datos reales: copiarlos a un archivo local y probar `repartir`/`recortarContenido` con node.
  **No escribir en la base.**

## 11. Cómo trabajar con Sergio

- En castellano y simple. Manda capturas: mirarlas bien y **preguntar antes** si hay dudas.
- **No publicar** (servidor, merge) sin que diga que sí.
- Probar todo (unitarias + e2e) antes de subir; explicar qué cambió en palabras de la Mesa.
- Documentar cada cambio en `calcos/areas-operaciones/README.md` y en `calcos/CAMBIOS-EN-EL-COMPILADO.md`.
