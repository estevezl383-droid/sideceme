// El compilado que carga calcos/index.html es una cadena de compilados, cada
// uno el anterior MÁS su lista de reemplazos, y nada más:
//   index-4OsERrlJ.js + reemplazos-2026-09-27.js = index-sxnJI1Ur.js
//   index-sxnJI1Ur.js + reemplazos-2026-09-28.js = index-zhbwncsH.js
//   index-zhbwncsH.js + integrar-conceptos.cjs = index-conceptos-20260928.js
//   index-conceptos-20260928.js + reemplazos-2026-09-28-fuegos.js = index-nQKdqwIj.js
//   index-nQKdqwIj.js + reemplazos-2026-09-28-conceptos-ia.js = index-6Gm5UQ97.js
//   index-6Gm5UQ97.js + reemplazos-2026-09-29-conceptos-v3.js = index-nDtcWpLo.js
//   index-nDtcWpLo.js + reemplazos-2026-09-29-conceptos-v4.js = index-ucOhdPbL.js
//   index-ucOhdPbL.js + reemplazos-2026-09-29-riesgo.js = index-5bpBlYsz.js
//   … (pasos de construir-*.py) …
//   index-oca-militar-20261001.js + reemplazos-2026-10-01-reconocimiento.js = index-reconocimiento-20261001.js
//   index-reconocimiento-20261001.js + reemplazos-2026-10-02-logistica.js = index-logistica-20261002.js
//   index-logistica-20261002.js + reemplazos-2026-10-03-estado-mayor.js = index-personal-20261003.js
//   index-personal-20261003.js + reemplazos-2026-10-03-lector.js = index-lector-20261003.js
//   index-lector-20261003.js + reemplazos-2026-10-03-g5.js = index-g5-20261003.js
//   index-g5-20261003.js + reemplazos-2026-10-03-coordenadas.js = index-coordenadas-20261003.js
//   index-coordenadas-20261003.js + reemplazos-2026-10-03-respuestas.js = index-respuestas-20261003.js
//   index-respuestas-20261003.js + reemplazos-2026-10-03-trazos.js = index-trazos-20261003.js
//   index-trazos-20261003.js + reemplazos-2026-10-03-edicion.js = index-edicion-20261003.js
//   index-edicion-20261003.js + reemplazos-2026-10-03-tablero-g4.js = index-tablero-g4-20261003.js
//   index-tablero-g4-20261003.js + reemplazos-2026-10-06-prc.js = index-prc-20261006.js
//   index-prc-20261006.js + reemplazos-2026-10-06-organizacion.js = index-organizacion-20261006.js
//   index-organizacion-20261006.js + reemplazos-2026-10-08-areas.js = index-areas-20261008.js
//   index-areas-20261008.js + reemplazos-2026-10-09-frentes.js = index-areas-20261009.js
//   … + reemplazos-2026-10-09-unidades.json = index-unidades-20261009.js
//   index-unidades-20261009.js + reemplazos-2026-09-29-membrete.js = index-membrete-20261009.js
//   index-membrete-20261009.js + reemplazos-2026-10-09-divmec.js = index-divmec-20261009.js
//   index-divmec-20261009.js + reemplazos-2026-10-09-fichas.js = index-fichas-20261009.js
//   index-fichas-20261009.js + reemplazos-2026-10-10-pedido.js = index-pedido-20261010.js
//   index-pedido-20261010.js + reemplazos-2026-10-10-lazo.js = index-lazo-20261010.js
//   index-lazo-20261010.js + reemplazos-2026-10-10-guardado.js = index-guardado-20261010.js
//   index-guardado-20261010.js + reemplazos-2026-10-11-deshacer.js = index-deshacer-20261011.js
//   index-deshacer-20261011.js + reemplazos-2026-10-11-medidas.js = index-medidas-20261011.js
//   index-medidas-20261011.js + reemplazos-2026-10-11-seleccion.js = index-seleccion-20261011.js
//   index-seleccion-20261011.js + reemplazos-2026-10-12-abrir.js = index-abrir-20261012.js
//   index-abrir-20261012.js + reemplazos-2026-10-16-tijera.js = index-tijera-20261016.js
//   index-tijera-20261016.js + reemplazos-2026-10-16-huellas.js = index-huellas-20261016.js
//   index-huellas-20261016.js + reemplazos-2026-10-18-seleccionar.js = index-seleccionar-20261018.js
//   index-seleccionar-20261018.js + reemplazos-2026-10-19-linea-tiempo.js = index-linea-tiempo-20261019.js
//   index-linea-tiempo-20261019.js + reemplazos-2026-10-19-orden-documentos.js = index-orden-documentos-20261019.js
//   index-orden-documentos-20261019.js + reemplazos-2026-10-19-picb-tiempo.js = index-picb-tiempo-20261019.js
//   index-picb-tiempo-20261019.js + reemplazos-2026-10-19-rotulo-avenidas.js = index-rotulo-avenidas-20261019.js
//   index-rotulo-avenidas-20261019.js + reemplazos-2026-10-20-plantilla-ajuste.js = index-plantilla-ajuste-20261020.js
//   index-plantilla-ajuste-20261020.js + reemplazos-2026-10-20-objetivos-indicados.js = index-objetivos-indicados-20261020.js
//   index-objetivos-indicados-20261020.js + reemplazos-2026-10-20-ht19-fases.js = index-ht19-fases-20261020.js
//   index-ht19-fases-20261020.js + reemplazos-2026-10-20-ains-acostar.js = index-ains-acostar-20261020.js
//   index-ains-acostar-20261020.js + reemplazos-2026-10-20-disgregar.js = index-disgregar-20261020.js
//   index-disgregar-20261020.js + reemplazos-2026-10-21-ain-chico.js = index-ain-chico-20261021.js
//   index-ain-chico-20261021.js + reemplazos-2026-10-21-reabastecimiento.js = index-reabastecimiento-20261021.js
//   index-reabastecimiento-20261021.js + reemplazos-2026-10-22-concepto.js = index-concepto-20261022.js
//   index-concepto-20261022.js + reemplazos-2026-10-22-fichas-chicas.js = index-fichas-chicas-20261022.js
//   index-fichas-chicas-20261022.js + reemplazos-2026-10-23-google-mapas.js = index-google-mapas-20261023.js
//   index-google-mapas-20261023.js + reemplazos-2026-10-23-tareas-chicas.js = index-tareas-chicas-20261023.js
//   index-tareas-chicas-20261023.js + reemplazos-2026-10-23-puntos-chicos.js = index-puntos-chicos-20261023.js
//   index-puntos-chicos-20261023.js + reemplazos-2026-10-23-suelo.js = index-suelo-20261023.js
//   index-suelo-20261023.js + reemplazos-2026-10-23-editar-tareas.js = index-editar-tareas-20261023.js
//   index-editar-tareas-20261023.js + reemplazos-2026-10-24-puntos-decision.js = index-puntos-decision-20261024.js
//   index-puntos-decision-20261024.js + reemplazos-2026-10-24-cae-enemigo.js = index-cae-enemigo-20261024.js
//   index-cae-enemigo-20261024.js + reemplazos-2026-10-24-cap-propios.js = index-cap-propios-20261024.js
//   index-cap-propios-20261024.js + reemplazos-2026-10-24-cap-carta.js = index-cap-carta-20261024.js
//   index-cap-carta-20261024.js + reemplazos-2026-10-24-fuegos-fase.js = index-fuegos-fase-20261024.js
//   index-fuegos-fase-20261024.js + reemplazos-2026-10-24-json-ia.js = index-json-ia-20261024.js
//   index-json-ia-20261024.js + reemplazos-2026-10-24-fases-cap.js = index-fases-cap-20261024.js
//   index-fases-cap-20261024.js + reemplazos-2026-10-24-posiciones-fase.js = index-posiciones-fase-20261024.js
//   index-posiciones-fase-20261024.js + reemplazos-2026-10-24-todas-fichas.js = index-todas-fichas-20261024.js
//   index-todas-fichas-20261024.js + reemplazos-2026-10-25-itinerario.js = index-itinerario-20261025.js
//   index-itinerario-20261025.js + reemplazos-2026-10-25-evento-critico.js = index-evento-critico-20261025.js
//   index-evento-critico-20261025.js + reemplazos-2026-10-25-evento-fases.js = index-evento-fases-20261025.js
//   index-evento-fases-20261025.js + reemplazos-2026-10-26-op3.js = index-op3-20261026.js
//   index-op3-20261026.js + reemplazos-2026-10-27-guia-final.js = index-guia-final-20261027.js (el vigente)
// Del vigente hacia atrás, para cada paso:
//   · cada reemplazo aparece las veces esperadas,
//   · deshaciéndolos se vuelve BYTE POR BYTE al compilado anterior (SHA-256).
//
//   node reemplazos-compilado.js [compilado.js]
const assert = require('assert')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { vigente } = require('./extraer')

// Del más nuevo al más viejo. `anterior`: SHA-256 del compilado antes de la lista.
const PASOS = [
  {
    lista: require('./reemplazos-2026-10-27-guia-final'),
    nombre: 'reemplazos-2026-10-27-guia-final',
    // calcos/assets/index-op3-20261026.js (antes de la Guía de Planificación Final con la forma del PMTD 2017).
    anterior: '4ebbd3ab59a83a5dbb023a585a14262f2d53ea7a045bd5eb6c04dd143e70dc90',
  },
  {
    lista: require('./reemplazos-2026-10-26-op3'),
    nombre: 'reemplazos-2026-10-26-op3',
    // calcos/assets/index-evento-fases-20261025.js (antes de la O.P. N° 3 con el CAP aprobado).
    anterior: '2a395fca30c4a04dfa9e5b70d4aa5bab46974c1ecc7a78f8464c541256d80640',
  },
  {
    lista: require('./reemplazos-2026-10-25-evento-fases'),
    nombre: 'reemplazos-2026-10-25-evento-fases',
    // calcos/assets/index-evento-critico-20261025.js (antes de alinear las fases del evento crítico por el final).
    anterior: 'db9426dce0371d259cd42853b6b2244d88a87b1a6da946e1d75e496fc9d49740',
  },
  {
    lista: require('./reemplazos-2026-10-25-evento-critico'),
    nombre: 'reemplazos-2026-10-25-evento-critico',
    // calcos/assets/index-itinerario-20261025.js (antes del evento crítico de la Matriz de sincronización).
    anterior: '67fe207ae83345c987ce5a89001410c99ad306b786369ed11d5669fc28456d82',
  },
  {
    lista: require('./reemplazos-2026-10-25-itinerario'),
    nombre: 'reemplazos-2026-10-25-itinerario',
    // calcos/assets/index-todas-fichas-20261024.js (antes del itinerario con flechas y las tareas con su unidad).
    anterior: '26aaf60613f2e7ac89a145be538a6fbf1d2cd53a698cd0bc7cae0b318d67a026',
  },
  {
    lista: require('./reemplazos-2026-10-24-todas-fichas'),
    nombre: 'reemplazos-2026-10-24-todas-fichas',
    // calcos/assets/index-posiciones-fase-20261024.js (antes de mover todas las fichas en las fases de los CAP).
    anterior: '5e585635c4edda2e92035fa20f6a2704984ff979700db5be7be9c2e9bd3af057',
  },
  {
    lista: require('./reemplazos-2026-10-24-posiciones-fase'),
    nombre: 'reemplazos-2026-10-24-posiciones-fase',
    // calcos/assets/index-fases-cap-20261024.js (antes de las posiciones por fase de los CAP).
    anterior: '27edd4decd859be07826cc309be9fd7b0efddfe9a498e38c79debb5a6ee0be2a',
  },
  {
    lista: require('./reemplazos-2026-10-24-fases-cap'),
    nombre: 'reemplazos-2026-10-24-fases-cap',
    // calcos/assets/index-json-ia-20261024.js (antes de los botones de fase en cada CAP del panel).
    anterior: 'bb6b73ab7919f06c66494e5f6d750406def4f5f6611500b3c3fb5a29bfdfda11',
  },
  {
    lista: require('./reemplazos-2026-10-24-json-ia'),
    nombre: 'reemplazos-2026-10-24-json-ia',
    // calcos/assets/index-fuegos-fase-20261024.js (antes de la versión en la carga del panel de los CAP).
    anterior: '9672bb8a67ec6e25337e568efc8c53a290baac093673f3c1dcf03f793d35280c',
  },
  {
    lista: require('./reemplazos-2026-10-24-fuegos-fase'),
    nombre: 'reemplazos-2026-10-24-fuegos-fase',
    // calcos/assets/index-cap-carta-20261024.js (antes de los fuegos por fase y el texto de la F3·P6 desde la carta).
    anterior: 'ca358322e4536af3ff585307434a3718517db3698517cb42999350715208fb68',
  },
  {
    lista: require('./reemplazos-2026-10-24-cap-carta'),
    nombre: 'reemplazos-2026-10-24-cap-carta',
    // calcos/assets/index-cap-propios-20261024.js (antes de que la IA ponga los dos CAP en la carta).
    anterior: '99ba40e423e91f93729954f390788e862af13d51887bb6a25adccd753f635341',
  },
  {
    lista: require('./reemplazos-2026-10-24-cap-propios'),
    nombre: 'reemplazos-2026-10-24-cap-propios',
    // calcos/assets/index-cae-enemigo-20261024.js (antes de los dos CAP propios que propone la Mesa).
    anterior: '1e14809887a0e8c3bb63b9853757e21c2d683ebdd6c93e6c6e2322c7ead024b1',
  },
  {
    lista: require('./reemplazos-2026-10-24-cae-enemigo'),
    nombre: 'reemplazos-2026-10-24-cae-enemigo',
    // calcos/assets/index-puntos-decision-20261024.js (antes de la revisión del CAE: misión propia y unidades inventadas).
    anterior: '1d65735175b9563da589ad2b6b87d6608fec85b12814ada87c063307027c78c4',
  },
  {
    lista: require('./reemplazos-2026-10-24-puntos-decision'),
    nombre: 'reemplazos-2026-10-24-puntos-decision',
    // calcos/assets/index-editar-tareas-20261023.js (antes de los puntos de decisión de la F4·P4 en la carta).
    anterior: '8eefa352f3fb3b32ff6cc6ed328f7b50b427953dc78885786a49465960a0143b',
  },
  {
    lista: require('./reemplazos-2026-10-23-editar-tareas'),
    nombre: 'reemplazos-2026-10-23-editar-tareas',
    // calcos/assets/index-suelo-20261023.js (antes del recuadro para editar las tareas tácticas ya puestas).
    anterior: 'b2464c1e5869d997d8eb26b553fcd96947a70cc21af2ca5c2f7837c1ab260fcc',
  },
  {
    lista: require('./reemplazos-2026-10-23-suelo'),
    nombre: 'reemplazos-2026-10-23-suelo',
    // calcos/assets/index-puntos-chicos-20261023.js (antes de las magnitudes al 60 %, lo acostado en el 3D y las fichas que no se rehacen).
    anterior: '2dfcbd19572f92751e6066c832f24b2434a7ab3a3f8ee6ac41b5ec31c95aa5ae',
  },
  {
    lista: require('./reemplazos-2026-10-23-puntos-chicos'),
    nombre: 'reemplazos-2026-10-23-puntos-chicos',
    // calcos/assets/index-tareas-chicas-20261023.js (antes de los puntos de coordinación al 40 % y los AIN al 30 %).
    anterior: '6a2bd6f9a82286e0138ce7738f4154ab8cb263f8e48dbf3db318e4090c3622af',
  },
  {
    lista: require('./reemplazos-2026-10-23-tareas-chicas'),
    nombre: 'reemplazos-2026-10-23-tareas-chicas',
    // calcos/assets/index-google-mapas-20261023.js (antes de las tareas tácticas al 40 %).
    anterior: '8574bf36cf677724ec1135df924d38faeef5824f14d78dc9462975899a88c1eb',
  },
  {
    lista: require('./reemplazos-2026-10-23-google-mapas'),
    nombre: 'reemplazos-2026-10-23-google-mapas',
    // calcos/assets/index-fichas-chicas-20261022.js (antes de las imágenes de Google).
    anterior: '96263b390efe7f2eddae7fe651bf94882d6bfdd30fefc3563ed73f433bc7ac3f',
  },
  {
    lista: require('./reemplazos-2026-10-22-fichas-chicas'),
    nombre: 'reemplazos-2026-10-22-fichas-chicas',
    // calcos/assets/index-concepto-20261022.js (antes de las fichas al 40 % y con fondo blanco).
    anterior: 'b2e29940bb646e2d8cbd5f408b101ced8f2083e18cbc697929d27eab68cafb0a',
  },
  {
    lista: require('./reemplazos-2026-10-22-concepto'),
    nombre: 'reemplazos-2026-10-22-concepto',
    // calcos/assets/index-reabastecimiento-20261021.js (antes del concepto de la operación en la carta, F3·P4).
    anterior: '8b72f8115cd8cf51db323f398af41df03430e7429e9c4befcff2dc6520e6a3d5',
  },
  {
    lista: require('./reemplazos-2026-10-21-reabastecimiento'),
    nombre: 'reemplazos-2026-10-21-reabastecimiento',
    // calcos/assets/index-ain-chico-20261021.js (antes del reabastecimiento y los tableros grandes del G-4).
    anterior: '82a1bd560cde245d58b208be052bcc88bcd31389b8b992bcd8396af5a3fb5412',
  },
  {
    lista: require('./reemplazos-2026-10-21-ain-chico'),
    nombre: 'reemplazos-2026-10-21-ain-chico',
    // calcos/assets/index-disgregar-20261020.js (antes de los rótulos AIN al 60 %).
    anterior: '5bffe6a6a16c60da5733fcd7307b40ac9f92296fb974807c6aadfca96674d713',
  },
  {
    lista: require('./reemplazos-2026-10-20-disgregar'),
    nombre: 'reemplazos-2026-10-20-disgregar',
    // calcos/assets/index-ains-acostar-20261020.js (antes de ⊞ Disgregar una gran unidad en sus dependientes).
    anterior: '5656ff5eaae353fc5e58d35d3937a93d356abe7e2eb0c19dfaa2114e5ac2c3e3',
  },
  {
    lista: require('./reemplazos-2026-10-20-ains-acostar'),
    nombre: 'reemplazos-2026-10-20-ains-acostar',
    // calcos/assets/index-ht19-fases-20261020.js (antes de acostar las A.I.N. que no nombran el CMOC).
    anterior: '79c049e0f7977914456ecfe6a3daf545d89624930c33ca17dc0398836d58b0e6',
  },
  {
    lista: require('./reemplazos-2026-10-20-ht19-fases'),
    nombre: 'reemplazos-2026-10-20-ht19-fases',
    // calcos/assets/index-objetivos-indicados-20261020.js (antes de la H.T. 19 fase por fase con todos los elementos).
    anterior: 'feb9ffd5f415a20f6909be4c53037e0383a8ad40e2ac452be9d5bcf1d6832290',
  },
  {
    lista: require('./reemplazos-2026-10-20-objetivos-indicados'),
    nombre: 'reemplazos-2026-10-20-objetivos-indicados',
    // calcos/assets/index-plantilla-ajuste-20261020.js (antes de que los objetivos sigan la indicación del G-2).
    anterior: 'dd55976a19d94b472e35a05fd26586cd944021bcd54e1798c6d04f39c7bb2b0d',
  },
  {
    lista: require('./reemplazos-2026-10-20-plantilla-ajuste'),
    nombre: 'reemplazos-2026-10-20-plantilla-ajuste',
    // calcos/assets/index-rotulo-avenidas-20261019.js (antes de 🧭 de dónde viene el enemigo y ✋ mover la plantilla).
    anterior: '3a590906fecdc5b632ad49d64133d6d01097553d98c8cd382157469659cf498a',
  },
  {
    lista: require('./reemplazos-2026-10-19-rotulo-avenidas'),
    nombre: 'reemplazos-2026-10-19-rotulo-avenidas',
    // calcos/assets/index-picb-tiempo-20261019.js (antes del rótulo AA-n de las avenidas).
    anterior: '702ef22a7b4ce4e4cb5b43b065d197731a4c7302fdb22ddd82f37ae889e86abe',
  },
  {
    lista: require('./reemplazos-2026-10-19-picb-tiempo'),
    nombre: 'reemplazos-2026-10-19-picb-tiempo',
    // calcos/assets/index-orden-documentos-20261019.js (antes de que la PICB tome el tiempo de la Línea de Tiempo).
    anterior: '00b39e37fb7038e794c40cd111afac4cf59346804b829e7d704aede540271b12',
  },
  {
    lista: require('./reemplazos-2026-10-19-orden-documentos'),
    nombre: 'reemplazos-2026-10-19-orden-documentos',
    // calcos/assets/index-linea-tiempo-20261019.js (antes de que la Orden del escalón superior salga de los documentos).
    anterior: '52750f47b67a9af7f8059a6277e734c1a4d7c99c557d68294e0f609932e39b43',
  },
  {
    lista: require('./reemplazos-2026-10-19-linea-tiempo'),
    nombre: 'reemplazos-2026-10-19-linea-tiempo',
    // calcos/assets/index-seleccionar-20261018.js (antes de que la Línea de Tiempo lea todos los documentos).
    anterior: '2527a3e16789741b0ec32c3dc08a24a6db975542beeceadb8f9143da40b5f33e',
  },
  {
    lista: require('./reemplazos-2026-10-18-seleccionar'),
    nombre: 'reemplazos-2026-10-18-seleccionar',
    // calcos/assets/index-huellas-20261016.js (antes de ⬚ Seleccionar y del G-4 sin textos).
    anterior: 'f74f56c27cbdb626264b1b765716153ffde35232cdc902acfb4233f9de4a0ddd',
  },
  {
    lista: require('./reemplazos-2026-10-16-huellas'),
    nombre: 'reemplazos-2026-10-16-huellas',
    // calcos/assets/index-tijera-20261016.js (antes de las huellas de OSM en calcos/huellas).
    anterior: '14d4146525267f92fcff5e6acc16c4dbc7ad98b6ee8e503530ffc6139f94bdb5',
  },
  {
    lista: require('./reemplazos-2026-10-16-tijera'),
    nombre: 'reemplazos-2026-10-16-tijera',
    // calcos/assets/index-abrir-20261012.js (antes de la ✂️ tijera en la barra principal).
    anterior: 'f945d869d0577ba8ba78318fdde233ccac7a9b4d99b59644f6d2185488557162',
  },
  {
    lista: require('./reemplazos-2026-10-12-abrir'),
    nombre: 'reemplazos-2026-10-12-abrir',
    // calcos/assets/index-seleccion-20261011.js (antes de «📂 Abrir archivo JSON» en 📁 Ejercicios).
    anterior: 'bf589a1a209eb1ade955f03d08ca2817b031dda33bddae4d160b5300e6132b3a',
  },
  {
    lista: require('./reemplazos-2026-10-11-seleccion'),
    nombre: 'reemplazos-2026-10-11-seleccion',
    // calcos/assets/index-medidas-20261011.js (antes de las selecciones guardadas, el CMOC al panel de áreas y el borrado de las AE).
    anterior: '577d28c0af9a6b7f22ac569fbd586a7393e24635ef76bc57be5be2d1c8b83808',
  },
  {
    lista: require('./reemplazos-2026-10-11-medidas'),
    nombre: 'reemplazos-2026-10-11-medidas',
    // calcos/assets/index-deshacer-20261011.js (antes de agregarOps y los rótulos de las medidas).
    anterior: '322508de6661feaf78fc56f1255e7b6a2991d6b504b80a124945bbfb3081846e',
  },
  {
    lista: require('./reemplazos-2026-10-11-deshacer'),
    nombre: 'reemplazos-2026-10-11-deshacer',
    // calcos/assets/index-guardado-20261010.js (antes del deshacer con las fichas).
    anterior: '7339dc5d14e2f5990ce9a01d098a90055075de9d9177874b9ff0209626450196',
  },
  {
    lista: require('./reemplazos-2026-10-10-guardado'),
    nombre: 'reemplazos-2026-10-10-guardado',
    // calcos/assets/index-lazo-20261010.js (antes del autoguardado con sello que se toca).
    anterior: '8e31a3d09ef53aee124975cd729922e5fb30b4f7cb5aa0bdd0206bd966e10f51',
  },
  {
    lista: require('./reemplazos-2026-10-10-lazo'),
    nombre: 'reemplazos-2026-10-10-lazo',
    // calcos/assets/index-pedido-20261010.js (antes del lazo para repartir el Área de Operaciones).
    anterior: '82bd58526ea97534b6bc2f4aff875c91fdf2b49af2cdcaefc8d8f9ece78f7d07',
  },
  {
    lista: require('./reemplazos-2026-10-10-pedido'),
    nombre: 'reemplazos-2026-10-10-pedido',
    // calcos/assets/index-fichas-20261009.js (antes del pedido con la tarea al principio).
    anterior: 'b70ae3085835ba65068d7cdc3edfdd69f37abfc5a6f3bc3ed1f94b1ddd278783',
  },
  {
    lista: require('./reemplazos-2026-10-09-fichas'),
    nombre: 'reemplazos-2026-10-09-fichas',
    // calcos/assets/index-divmec-20261009.js (antes de agrandar las fichas).
    anterior: '00222b66f173ecc68d4998de3abda1a0b2be79652f9ca6a09dd1138870178293',
  },
  {
    lista: require('./reemplazos-2026-10-09-divmec'),
    nombre: 'reemplazos-2026-10-09-divmec',
    // calcos/assets/index-membrete-20261009.js (antes de «somos la DIV.MEC.-1»).
    anterior: 'cd1c2f619e9045be69980acabb66637295125eb87daf47e1dae070a854e63c47',
  },
  {
    lista: require('./reemplazos-2026-09-29-membrete'),
    nombre: 'reemplazos-2026-09-29-membrete',
    // calcos/assets/index-unidades-20261009.js (antes del membrete táctico).
    anterior: 'd098a722d0bae97ad06495194e7687e5fd71906c51502782c1e90ab3ba2588d7',
  },
  {lista: require('./reemplazos-2026-10-09-unidades.json'), nombre: 'reemplazos-2026-10-09-unidades', anterior: '333e0751443ed1638b69ffa8a2037d4d72beb114e1c24404a734c0c5825237b2'},
  {
    lista: require('./reemplazos-2026-10-09-frentes'),
    nombre: 'reemplazos-2026-10-09-frentes',
    // calcos/assets/index-areas-20261008.js (rehecho el 09-10-2026 sobre el index-organizacion
    // con la tercera vuelta de la F3·P3).
    anterior: 'fb8b33ed4f243799391b80da6641e9ad3a1e15cf209be266c6ee948d731a0638',
  },
  {
    lista: require('./reemplazos-2026-10-08-areas'),
    nombre: 'reemplazos-2026-10-08-areas',
    // calcos/assets/index-organizacion-20261006.js con la tercera vuelta de la F3·P3 (09-10-2026).
    anterior: '23d336b7801547dd3de4dce8bae6f64176adcbc96c600aff9a39abd0bd5b9372',
  },
  {
    lista: require('./reemplazos-2026-10-06-organizacion'),
    nombre: 'reemplazos-2026-10-06-organizacion',
    // calcos/assets/index-prc-20261006.js (merge fa2e89f, antes de estos cambios).
    anterior: 'ea31d06008e535ef6e31c997a092d3cca18f2f4d79b3adfe7e34113896432ee7',
  },
  {
    lista: require('./reemplazos-2026-10-06-prc'),
    nombre: 'reemplazos-2026-10-06-prc',
    // calcos/assets/index-tablero-g4-20261003.js (merge 6a47f53, antes de estos cambios).
    anterior: '90b846f9ce2ff4f2fb52cc638a12b1a0a4ede7d5b4e98f072106ed00f023351d',
  },
  {
    lista: require('./reemplazos-2026-10-03-tablero-g4'),
    nombre: 'reemplazos-2026-10-03-tablero-g4',
    // calcos/assets/index-edicion-20261003.js (merge 6abfbce, antes de estos cambios).
    anterior: 'e019c5b4fc943a5874aad19018f9acd8718d6dc26cc0069a808f41ccf2f98693',
  },
  {
    lista: require('./reemplazos-2026-10-03-edicion'),
    nombre: 'reemplazos-2026-10-03-edicion',
    // calcos/assets/index-trazos-20261003.js (merge ecfcb3a, antes de estos cambios).
    anterior: '21272a34de3eb8eeee2607f4d0be8612f6df2b0b7177d737e8c93978330ccc75',
  },
  {
    lista: require('./reemplazos-2026-10-03-trazos'),
    nombre: 'reemplazos-2026-10-03-trazos',
    // calcos/assets/index-respuestas-20261003.js (merge 2e56d33, antes de estos cambios).
    anterior: '82d368c7e428fe8e4a6f31e262f77dab26eb9c73585fbbbfe089fcfb30de393d',
  },
  {
    lista: require('./reemplazos-2026-10-03-respuestas'),
    nombre: 'reemplazos-2026-10-03-respuestas',
    // calcos/assets/index-coordenadas-20261003.js (merge 7802670, antes de estos cambios).
    anterior: 'ed72c0b9adf5347e9d2ddebe15e78928f8ba8a4cca0c100ac42b3345707fda68',
  },
  {
    lista: require('./reemplazos-2026-10-03-coordenadas'),
    nombre: 'reemplazos-2026-10-03-coordenadas',
    // calcos/assets/index-g5-20261003.js (merge 2c206f4, antes de estos cambios).
    anterior: '36338e67018d462156e06de6c1dc8911e82093bd0b66affd0a50020991950efc',
  },
  {
    lista: require('./reemplazos-2026-10-03-g5'),
    nombre: 'reemplazos-2026-10-03-g5',
    // calcos/assets/index-lector-20261003.js (merge 79e5252, antes de estos cambios).
    anterior: '3fef83ee731be3471b9acae79feac08c7fad4690be7eaf4302609ec970dbf245',
  },
  {
    lista: require('./reemplazos-2026-10-03-lector'),
    nombre: 'reemplazos-2026-10-03-lector',
    // calcos/assets/index-personal-20261003.js (merge f3fd423, antes de estos cambios).
    anterior: '7e516566aad27315745a4a86f8025097c2ddc796e5be12e83a0a4b0d3189c540',
  },
  {
    lista: require('./reemplazos-2026-10-03-estado-mayor'),
    nombre: 'reemplazos-2026-10-03-estado-mayor',
    // calcos/assets/index-logistica-20261002.js (commit d4bd001, antes de estos cambios).
    anterior: '3c04918bdfc4e071f53d6f0fb51fb49198b7f9e898b135b17bb2808efc37c820',
  },
  {
    lista: require('./reemplazos-2026-10-02-logistica'),
    nombre: 'reemplazos-2026-10-02-logistica',
    // calcos/assets/index-reconocimiento-20261001.js (commit b595504, antes de estos cambios).
    anterior: '14d4554f94f4414304039bf89dc5e6c9f22179b81a98ddf672f022155841443a',
  },
  {
    lista: require('./reemplazos-2026-10-01-reconocimiento'),
    nombre: 'reemplazos-2026-10-01-reconocimiento',
    // calcos/assets/index-oca-militar-20261001.js (commit 48da26a, antes de estos cambios).
    // Entre éste y el de riesgo hay pasos armados con construir-*.py (formato militar,
    // fichas, ejes…) que todavía no están en esta cadena.
    anterior: '604c8a4760bdb8b8e4c41f9db19c4a522b14c1c1faa5fed1ea6b20c3a1738a85',
  },
  {
    lista: require('./reemplazos-2026-09-29-riesgo'),
    nombre: 'reemplazos-2026-09-29-riesgo',
    // Entre index-oca-militar-20261001.js y éste hay pasos de construir-*.py (formato militar,
    // fichas, ejes, ASDI, importador GE…) que no están en esta cadena: se retoma desde el
    // compilado guardado y se sigue comprobando hacia atrás desde ahí.
    desde: 'index-5bpBlYsz.js',
    // calcos/assets/index-ucOhdPbL.js (commit 1fcdfb0, antes de estos cambios).
    anterior: 'b9c3a174f6cb93b9a42100fefb671a179308851f270db1481669e299c607b346',
  },
  {
    lista: require('./reemplazos-2026-09-29-conceptos-v4'),
    nombre: 'reemplazos-2026-09-29-conceptos-v4',
    // calcos/assets/index-nDtcWpLo.js (commit 9ce1acb, antes de estos cambios).
    anterior: '9c3b5c5a92e8e4ab52d9c8d6f713166442f63370e27d9d85b3b60dd95672cbb3',
  },
  {
    lista: require('./reemplazos-2026-09-29-conceptos-v3'),
    nombre: 'reemplazos-2026-09-29-conceptos-v3',
    // calcos/assets/index-6Gm5UQ97.js (commit 21ff394, antes de estos cambios).
    anterior: 'e869b9510f7be1a8107baa8ce02e903f797e193789b2542e85bafe5e64b10f87',
  },
  {
    lista: require('./reemplazos-2026-09-28-conceptos-ia'),
    nombre: 'reemplazos-2026-09-28-conceptos-ia',
    // calcos/assets/index-nQKdqwIj.js (commit 849d876, antes de estos cambios).
    anterior: '9fe40a76ac088eab81fdcaed6c65f75e401116d9b084c580c5e6906dc36e917b',
  },
  {
    lista: require('./reemplazos-2026-09-28-fuegos'),
    nombre: 'reemplazos-2026-09-28-fuegos',
    // calcos/assets/index-conceptos-20260928.js (commit d8c94f4, antes de estos cambios).
    anterior: '9a3b1d285b4a1e1e9196250f99c43f29c78c4a49a03fd4ca70073de3265ed7f7',
  },
  {
    // Conceptos entrelazados (codex/conceptos-graficos-20260928): su lista vive en integrar-conceptos.cjs.
    lista: require('./integrar-conceptos.cjs').cambios.map(([viejo, nuevo], i) => ({ nombre: `conceptos ${i + 1}`, viejo, nuevo, veces: 1 })),
    nombre: 'integrar-conceptos',
    // calcos/assets/index-zhbwncsH.js (commit d9230e6).
    anterior: 'ce16f09dcb0768f0436d2ddf723f327d5446bd69020309dc2569bc6d99f71872',
  },
  {
    lista: require('./reemplazos-2026-09-28'),
    nombre: 'reemplazos-2026-09-28',
    // calcos/assets/index-sxnJI1Ur.js (commit 68c1c78, antes de estos cambios).
    anterior: 'b319c923552bc3f2e32d1407b30cb5fda4a034b76f31e7cca519155322368990',
  },
  {
    lista: require('./reemplazos-2026-09-27'),
    nombre: 'reemplazos-2026-09-27',
    // calcos/assets/index-4OsERrlJ.js (commit 296803f, antes de estos cambios).
    anterior: 'e0eb0446b949f70fcd76d273d048a772d125149f7475d5f58b8354228ff01041',
  },
]

const archivo = process.argv[2] || vigente()
let src = fs.readFileSync(archivo, 'utf8')
console.log(`\nCompilado: ${archivo.replace(/.*calcos\//, 'calcos/')} · ${PASOS.map((p) => `${p.nombre} (${p.lista.length})`).join(' · ')}\n`)

let fallas = 0
function caso(nombre, fn) {
  try {
    fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.message).split('\n').join('\n      ')}`)
  }
}

for (const paso of PASOS) {
  if (paso.desde) src = fs.readFileSync(path.join(__dirname, '..', 'assets', paso.desde), 'utf8')
  caso(`${paso.nombre}: cada reemplazo está en el compilado las veces previstas`, () => {
    const mal = paso.lista.filter((p) => src.split(p.nuevo).length - 1 !== p.veces).map((p) => p.nombre)
    assert.deepStrictEqual(mal, [])
  })

  caso(`${paso.nombre}: deshaciéndolos se vuelve byte por byte al compilado anterior`, () => {
    for (const p of [...paso.lista].reverse()) src = src.split(p.nuevo).join(p.viejo)
    assert.strictEqual(crypto.createHash('sha256').update(src).digest('hex'), paso.anterior)
  })
}

console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
process.exit(fallas ? 1 : 0)
