# Áreas de operaciones y aislamiento de ejercicios — 08-OCT-2026

## Diagnóstico confirmado

En `index-organizacion-20261006.js`, terminar un trazado `areaops` devolvía
`{...ct, areaOps: nueva}`: reemplazaba deliberadamente el único polígono.
El callback `Av` (nuevo ejercicio / limpiar vista) omitía `setPlanFuegos(null)`
y `setAcadMesa(null)`. El plan anterior permanecía en memoria y el autoguardado
podía copiarlo al ejercicio recién creado. Abrir un ejercicio guardado sí cargaba
su propio `planFuegos`. No es evidencia de corrupción de toda la base de datos.

## Contrato compatible para Claude

- `ops.areaOps` sigue siendo el área activa, compatible con consumidores existentes.
- `ops.areasOps` conserva las otras áreas, con identificador propio, nombre,
  unidad responsable y operación asignada. `listarAreas()` da prioridad a la
  versión activa para conservar sus últimas ediciones de vértices.
- Cada trazado añade un área. Cambiar de selección conserva la anterior.
  El menú de borrado elimina solamente la activa y selecciona otra si queda alguna.
- El gestor respeta el candado de la BASE cuando pertenece a otro puesto y
  bloquea cambios en ejercicios finalizados.
- En la carta 2D, las otras áreas aparecen punteadas y rotuladas; se seleccionan
  en el panel para editarlas. El análisis existente sigue usando el área activa.
  No se modifica el motor 3D: allí sigue mostrándose el área activa.
- **Compartir en la aplicación / Recibidos** usa una bandeja en `calco_compartidos`.
  El docente guarda el origen, pone nombre al envío, marca áreas y elige un
  ejercicio personal propio o un grupo activo. El paquete contiene nombres y
  contornos, y opcionalmente unidad, operación, documentos e indicaciones.
  `planFuegos`, respuestas, notas y las demás capas nunca se copian.
  El receptor incorpora al ejercicio abierto; no se reemplaza el payload del
  destino al enviar. `ops.entregasAreas` evita incorporar dos veces el mismo
  envío. Los documentos se añaden con identidad propia; los previos se conservan.
  La copia JSON de áreas sigue disponible como respaldo opcional.
- Las tres acciones `areas_destinos`, `areas_enviar`, `areas_recibidos` pasan por
  la sesión SIDECEME existente y verifican origen/destino en el servidor.
  Las tablas nuevas tienen RLS y acceso exclusivo por service_role; no se usa
  service_role en el navegador. Los cursantes leen solo su grupo y ejercicio.
- Crear/limpiar ejercicio limpia plan, estado académico y modos de captura.
  Abrir un ejercicio carga su plan; importar una BASE limpia el plan previo,
  porque el contrato BASE no incluye fuegos.
- El módulo de fuegos limpia selección, borradores y captura al cambiar de
  ejercicio. No borra archivos guardados ni decide el origen de blancos existentes.

## Alcance de datos existentes

DIAMANTE (propietario verificado P030, Sergio Morales) contiene 14 blancos
AB-010–AB-023 cuyo plan es idéntico al de ARMAS y cuyos identificadores fueron
creados antes que DIAMANTE. La limpieza confirmada se limita a esos IDs en
ese calco. Antes de limpiar se guarda el payload entero en `calco_versiones`.
`calco_blancos_excluidos` impide que el autoguardado de una pestaña antigua
reintroduzca los mismos IDs en DIAMANTE. No afecta otros ejercicios ni nuevos
registros de DIAMANTE. Para restaurar el respaldo, quitar primero esas
exclusiones y recuperar la versión; no borrar los respaldos.
Una sola área antigua abre sin migración destructiva. No es posible recuperar
áreas previamente reemplazadas salvo desde respaldos.

## Construcción y revisión

`node calcos/pruebas/construir-areas.js` aplica 12 sustituciones únicas al
compilado vigente y verifica reversión byte por byte. Genera
`index-areas-20261008.js`, conserva el compilado anterior y cambia solamente
la referencia en `calcos/index.html`. La cadena de verificación incluye el paso.

Pruebas:

```bash
npm ci --prefix calcos/pruebas
node calcos/pruebas/areas-operaciones.mjs
node calcos/pruebas/areas-compartir.mjs
node calcos/pruebas/edicion-figuras.cjs
node calcos/pruebas/plan-fuegos-modelo.js
node calcos/pruebas/reemplazos-compilado.js
node calcos/pruebas/e2e/areas-aislamiento.cjs
node calcos/pruebas/e2e/areas-compartir.cjs
```

Validación: modelos, edición y cadena reversible pasan. La prueba en Chromium
de GitHub Actions confirmó exportación/importación aditiva, plan vacío en nuevo
ejercicio, conservación y reapertura del plan original, y ausencia de errores JS.
El servidor de prueba incluye MIME para `.mjs` y ubica el botón de ejercicios
por su título estable, porque su nombre visible cambia al abrir un ejercicio.

Antes de integrar, comprobar el HEAD actual de `main`: Claude puede haber
publicado otros cambios. Integrar la rama mediante PR, sin force-push ni
reemplazar una versión posterior del compilado. Reversión: restaurar las
referencias anteriores de `calcos/index.html` y el módulo de fuegos. No abrir y
guardar un ejercicio con varias áreas usando versiones anteriores del editor.

## Despliegue del servidor

Fuente conservada en `supabase/espejo-ge/calco-ops/`. El entrypoint solo agrega
el import y la llamada al despachador; los flujos anteriores quedan intactos.
Para desplegar, incluir `index.ts`, `compartir.mjs`, `compartir-modelo.mjs` y
`modelo.mjs`. En la copia de despliegue, cambiar el import del despachador
a `./compartir-modelo.mjs` (en el repo usa la ruta del módulo frontend).
Aplicar primero la migración `20261008160528_calco_compartidos.sql`.
JWT permanece OFF porque la función valida las sesiones institucionales.
No se generan nuevos grupos ni se envía contenido real a destinatarios
sin selección expresa del docente.

## Frentes y profundidades (09-OCT-2026)

`node calcos/pruebas/construir-frentes.js` aplica 4 sustituciones reversibles a
`index-areas-20261008.js` y genera `index-areas-20261009.js` (lista en
`calcos/pruebas/reemplazos-2026-10-09-frentes.js`). Cuadro PMTD 2017 Tabla 45 con
valores fijos por terreno (llano/altiplano ×1,0; valle/montaña frente ×0,7; selva
frente ×0,5 y profundidad ×0,7), retrógradas = defensiva ×2 frente, ×1,5 profundidad.
Las claves de ambiente guardadas (`llano`, `altiplano`, `montana`, `selva`) no cambian.

## ✂️ Repartir el área con el lazo y entregar lo que está dentro (10-OCT-2026)

Lo pidió Sergio (Profesor): trazó el Área de Operaciones de la FF.TT.T.O., la dividió en
Cuerpos con límites y quería entregarle a cada escalón subordinado SU área, con todo lo que
tiene dentro, sin redibujar dos áreas con bordes que encajen.

- **Lazo** (`lazo.mjs`): botón «✂️ Seleccionar con lazo» en «Áreas del ejercicio». Una capa
  transparente tapa la carta 2D (z 690, debajo de los controles); se arrastra a mano alzada
  con mouse, dedo o lápiz y al soltar se cierra. Un toque sin arrastrar elige la zona de
  abajo. La rueda sigue acercando; Esc o «Cancelar» lo apagan. Elegir otra herramienta de
  dibujo lo apaga, y el lazo apaga la herramienta activa. En 3D no hay lazo (avisa).
- **Recorte** (`recorte.mjs` → `repartir`): el área se corta por TODOS los límites trazados
  (menos las flechas) y por el contorno de las otras áreas, como un grafo plano; se queda con
  las caras que el lazo encierra en más de la mitad (o la del toque) y las une. El borde
  nuevo usa los mismos vértices de los límites: dos Cuerpos vecinos encajan sin huecos. Un
  límite que se queda corto o se pasa del borde hasta el 3 % del tamaño del área (150 m–5 km)
  se cierra solo. El área a repartir es la que contiene el toque o la que más tapa el lazo;
  entre parecidas, la más chica (así un Cuerpo se reparte en Divisiones). Si nada divide el
  área, corta por el lazo mismo y lo avisa. `recortarArea` (modelo) la agrega activa, con
  nombre por magnitud (CE-I, CE-II… según «Magnitud que se va a colocar»), la operación y el
  tipo del área madre. DESHACER la quita.
- **Qué se entrega** (`contenidoDeAreas`): con «Todo lo que está dentro» marcado (por
  defecto), el paquete lleva `contenido: { ops, unidades }`: los límites que bordean o cruzan
  el área (completos), puntos de coordinación y de pasaje (también los del borde), marcas
  (las de un límite lo siguen y se renumeran), tareas, obstáculos, posiciones, objetivos,
  A.I.N., zonas/sectores/ejes logísticos, flechas y las fichas de adentro (las enemigas, si
  está marcado). Un límite que sólo toca el área con la punta (el que separa a los dos
  vecinos) no va. Los límites y marcas del borde de un escalón MAYOR que el del área (los de
  la FF.TT.T.O.) no van; el escalón del área se deduce del menor límite con magnitud que la
  bordea, no de lo elegido en el panel. Planes de fuegos, respuestas y notas nunca van (el CMOC,
  desde el 11-10-2026, sólo el que está a la vista y si se marca: ver «💾 Guardar selección como área»).
- **Recibir**: «Importar áreas compartidas» y «Incorporar al ejercicio» suman el área, las
  capas (`sumarContenido`, valida cada elemento) y las fichas con id nuevo
  (`fichasDelPaquete`; por la bandeja, una sola vez por envío con `recibirUnidades`).
- **Servidor**: `construirPaquete` arma `contenido` sólo si `opciones.contenido`; un cliente
  viejo sigue recibiendo sólo contornos. Desplegar `calco-ops` con `index.ts`,
  `compartir.mjs`, `compartir-modelo.mjs`, `modelo.mjs` y `recorte.mjs`, con los imports
  aplanados (`./compartir-modelo.mjs`) y sin `?v=`.
- **Caché**: el compilado y los módulos se importan con `?v=lazo20261010`, para que un
  navegador no mezcle un `editor.mjs` nuevo con un `modelo.mjs` viejo.
- **Compilado**: `node calcos/pruebas/construir-lazo.js` (6 reemplazos en
  `reemplazos-2026-10-10-lazo.js`) genera `index-lazo-20261010.js`: el panel recibe las
  fichas (`SIDunidades`/`SIDonUnidades`, con los candados de ops), la magnitud y la
  herramienta activa.

Pruebas: `node calcos/pruebas/areas-lazo.mjs` (zonas exactas sin huecos, lazo tosco y libre,
Cuerpo → Divisiones, contenido, paquete, importación y servidor) y
`node calcos/pruebas/e2e/areas-lazo.cjs` (la Mesa en Chromium: lazo con el mouse, toque,
entrega JSON e importación con fichas; capturas en `pruebas/salidas-lazo/`).

## 💾 Guardar selección como área, el CMOC a la vista y el lazo que no corta por las medidas (11-OCT-2026, noche)

Lo pidió Sergio con la captura del panel del lazo («✂️ «CE-III» creada dentro de «FABBLE». Borde exacto de
sus límites (3 zonas unidas)…»): «quisiera que haya una opción que diga guardar selección como área y ahí yo le
pongo el nombre; debe ser idéntico a lo que se recortó y además debe seleccionar todo lo que está activo… y
luego yo pueda seleccionar el JSON donde se guarda con el nombre que le di y compartirlo al curso o paralelo»;
y «me parece que el lazo no lo está haciendo bien».

- **El lazo no corta por las medidas de coordinación** (`recorte.mjs · esMedida`): las líneas de fase, la
  LCAF, las áreas de empeñamiento que trae la IA (`origen: 'ogo-ia'`), una línea con nombre y sin magnitud o
  un contorno punteado cerrado cruzan el área pero NO la reparten. Antes sí: el «3 zonas unidas» era la LF y el
  AE-1 partiendo la zona, y un clic dentro de un Cuerpo se quedaba hasta la línea de fase. Siguen yendo con el
  área (son «lo de adentro»). Los límites con magnitud y las líneas simples sin nombre cortan como antes.
- **No se encima con lo ya cortado** (`repartir` → `dejadas` / `encima`): las zonas que ya son de otra área
  cortada dentro de la misma (un Cuerpo ya repartido) se dejan afuera aunque el lazo las tape («Lo que ya es
  de «CE-II» quedó afuera»); si el lazo no encierra otra cosa, quedan y se avisa («⚠️ Queda encima de…»).
- **💾 Guardar selección como área** (`editor.mjs`, `modelo.mjs · guardarSeleccion`): después del lazo, en
  el mismo recuadro, «Nombre de la selección (el área recortada)» y **💾 Guardar selección como área** (o
  **✕ Descartar el recorte**). Le pone el nombre al área (y a la unidad, si no tenía otra) y guarda EN EL
  EJERCICIO (`ops.selecciones`) la selección: su nombre, el id del área, una copia EXACTA del contorno que se
  recortó, lo que estaba activo (las casillas «Todo lo que está dentro», «También las fichas enemigas», «También
  el CMOC que está a la vista» y qué capas del CMOC estaban prendidas en «Qué se ve en el calco») y cuándo.
  Guardar otra con el mismo nombre (o la misma área) la reemplaza.
- **💾 Selecciones guardadas** (debajo de «Qué se entrega»): cada una con lo que lleva y **⬇️ JSON**
  (`Seleccion_<nombre>.json`, `paqueteSeleccion`: el área con el contorno guardado aunque después se haya
  movido, y lo de adentro como está AHORA en la carta: «hasta lo último»), **📤 Compartir (ciclo / paralelo)**
  (abre «Compartir» con su nombre; envía la Mesa tal como está con `ejercicio_enviar`, con el contorno
  guardado: `opsConSeleccion`) y 🗑. En el paso 13 del tablero del profesor también se elige por su nombre
  (`calcos/modalidad`). Las selecciones nunca viajan a los alumnos (el paquete sale de la lista permitida).
- **El CMOC a la vista** (`recorte.mjs · CAPAS_CMOC, capasCmocVisibles, cmocDeAreas, sumarCmoc`): áreas de
  empeño, zonas restringidas y sev. restringidas (GeoJSON), terreno defensivo, avenidas, corredores (también
  los clandestinos) y terreno clave que estén dentro o crucen el área, sólo de las capas prendidas. Va en
  `contenido.cmoc`; al importar el JSON o «Incorporar al ejercicio» se suma al CMOC del que recibe (una sola
  vez por envío: `envioAreas`; `compartir-modelo.mjs · recibirCmoc`). El compilado le pasa al editor `cmoc`,
  `onCmoc` y `verCapa` (`index-seleccion-20261011.js`).
- **Servidor**: `construirPaquete` arma `contenido.cmoc` sólo si `opciones.cmoc` y de las capas de
  `opciones.capasCmoc` (un cliente viejo no lo pide); `compartir.mjs` pasa `foto.cmoc`. **Publicado el
  11-10-2026 (con el permiso de Sergio): calco-ops v10** en SIDECEME-V2 con `index.ts` (sin cambios),
  `compartir.mjs`, `compartir-modelo.mjs`, `modelo.mjs` y `recorte.mjs`, con los imports aplanados
  (`./compartir-modelo.mjs`, `./modelo.mjs`, `./recorte.mjs`, sin `?v=` y sin el comentario del `?v=` de
  `modelo.mjs`, como la v9), JWT OFF como estaba. Antes se comprobó que la v9 desplegada era, archivo por
  archivo, la de este repositorio (nada del servidor quedaba afuera) y después que los cinco archivos de la v10
  son idénticos a los de acá. Sin migración: no cambia ninguna tabla.
- **Caché**: los módulos se importan con `?v=seleccion20261011`.

Pruebas: `node calcos/pruebas/areas-seleccion.mjs`, `node calcos/pruebas/e2e/areas-seleccion.cjs` (la Mesa en
Chromium: lazo, guardar, JSON con el AE, abrirlo en otro ejercicio, borrar un AE con el panel ▧ abierto;
capturas en `pruebas/salidas-seleccion/`) y `node calcos/pruebas/e2e/areas-seleccion-nube.cjs` (compartirla a
un ciclo y recibirla con su área de empeño).

## 📤 Por ciclo o por paralelo, y el ejercicio del profesor tal como está (11-OCT-2026)

Lo pidió Sergio para el paso 13 del tablero del profesor (`calcos/modalidad`): «compartir a los
alumnos por ciclo o por paralelo, siempre con el JSON, y con mi tijerita compartirles sólo la parte
que yo seleccione».

- **Destinos** (`areas_destinos`): además de «Mi ejercicio · …» y los grupos (Estados Mayores), los
  **ciclos** («Todo el 1ER CICLO (125 cursantes)») y los **paralelos** («1ER CICLO · Paralelo A
  (42 cursantes)») de los cursantes activos (`cursantes.ciclo` / `cursantes.paralelo`).
- **Enviar** (`areas_enviar` y la nueva `ejercicio_enviar`): `destino: { ciclo, paralelo? }` guarda
  `destino_ciclo` / `destino_paralelo` (comprueba que haya cursantes activos). `ejercicio_enviar` arma
  el paquete con la Mesa del profesor TAL COMO ESTÁ (`foto`: ops, fichas y los documentos de la OGO
  consolidada, el calco como imagen), sin esperar al autoguardado; el origen sigue siendo un ejercicio
  personal SUYO y el paquete sale del mismo `construirPaquete` (lista permitida, sólo las áreas
  elegidas y lo que tienen adentro). `opciones.documentosNombres`: sólo esos documentos, y de cada uno
  sólo `nombre, mime, tipo, texto, base64, paginas, categoria`.
- **Recibir** (`areas_recibidos`): el cursante ve, además de lo de su grupo, lo enviado a su ciclo y a
  su paralelo (no lo de otro paralelo ni de otro ciclo), lo más nuevo primero.
- **Base**: `supabase/migrations/20261011150000_calco_compartidos_ciclo.sql` agrega las dos columnas,
  reemplaza la regla de destino (`calco_compartidos_check` → `calco_compartidos_destino_check`, con la
  tercera forma) y un índice. No borra nada.

**Publicado el 11-10-2026** (con el permiso de Sergio): 1) la migración aplicada en SIDECEME-V2
(`20261011150000_calco_compartidos_ciclo`; no borró nada: los envíos anteriores siguen con su destino);
2) `calco-ops` **v9** desplegada con `index.ts` (sin cambios), `compartir.mjs`, `compartir-modelo.mjs`,
`modelo.mjs` y `recorte.mjs`, con los imports aplanados (`./compartir-modelo.mjs`, `./modelo.mjs`,
`./recorte.mjs`, sin `?v=`), JWT OFF como estaba. Se comprobó que los archivos desplegados son, byte por
byte (SHA-256), los de este repositorio con esos imports, y la regla nueva de destino con una transacción
que se deshizo (ROLLBACK): un envío por ciclo (y por paralelo) entra; uno con paralelo y sin ciclo se rechaza; no quedó ninguna fila de prueba. Si se vuelve a desplegar, igual:
los mismos cinco archivos con los imports aplanados.

Prueba: `node calcos/pruebas/areas-compartir.mjs` (destinos, envío por paralelo, documentos elegidos,
lo de adentro desde la Mesa del profesor, un cursante no envía, qué recibe cada cursante).
