// ⚔️ EL G-3 — lo que el motor necesita para trabajar su F7·P1 ORDEN GENERAL DE OPERACIONES en el Tablero del G-3
// (📄 Documentos → 7 · Elaborar planes y órdenes) con la forma del TEXTO PMTD 2017, Parte Primera, Capítulo VII.
//
// Lo pidió Sergio el 30-10-2026 con el Word que bajó de la F7·P1 del CE-I y dos órdenes de ejemplo («la OGO que me
// está generando la aplicación es inaceptable… la IA debería integrar TODA la información que generó la aplicación
// manteniendo el formato del PMTD… es en esto en lo que desemboca todo el ejercicio»). Todo lo de la Orden (la forma,
// 🌱, la doctrina, el ejemplo, el Word) está en calcos/orden-operaciones/v1/ogo.mjs; acá sólo se lo conecta al motor.
//
// `soloDocumentos`: las demás hojas del G-3 (las de siempre, la PRC, las Órdenes Preparatorias…) siguen exactamente
// como estaban: el Tablero del G-3 no pasa por los ganchos de las hojas de trabajo del motor.
//
// Sin DOM: se prueba en Node (calcos/pruebas/orden-operaciones.mjs).
import * as OGO from '../../../orden-operaciones/v1/ogo.mjs'
import { camposDe } from '../motor.js'
import G1 from './g1.js'
import G5 from './g5.js'
import { CAMPOS_ANEXO } from '../../../logistica/v1/modelo.js'

export const ID = 'g3'
export const COLOR = '#ff5c7a'

const NOTA =
  'La Orden General de Operaciones se trabaja acá con la forma del TEXTO PMTD 2017 (Capítulo VII): OBJETO, CARTAS, ANEXOS; ORGANIZACIÓN DE LA TAREA; I.- SITUACIÓN; II.- MISIÓN; III.- EJECUCIÓN; IV.- APOYO DE SERVICIO; V.- COMANDO Y COMUNICACIONES. 🌱 trae todo lo que ya trabajó el Estado Mayor (la Orden superior, el CAE del G-2, la misión, la intención y los RCIC del Comandante, el CAP aprobado fase por fase con la tarea y el propósito de cada unidad, fuegos, barreras, riesgo y los anexos del G-1, G-4 y G-5); 💡 tus ideas van a la IA; 🤖 la IA la redacta completa con la doctrina del Capítulo VII; y sale en Word con el formato militar.'

// Los títulos de los apartados de los anexos del G-1, del G-4 y del G-5: en el pedido a la IA, lo de cada anexo va con su
// título («Reemplazos», «Seguridad del área de retaguardia»), no con el nombre de la casilla.
let titulos = null
const titulosDe = (def) => (def ? Object.fromEntries(camposDe(def).map((c) => [c.id, c.t])) : {})
const titulosAnexos = () => (titulos ||= { g1: titulosDe(G1.documentos?.anexo?.def), g5: titulosDe(G5.documentos?.anexo?.def), g4: Object.fromEntries(CAMPOS_ANEXO.map((c) => [c.id, c.titulo])) })

export default {
  id: ID,
  nombre: 'G-3 Operaciones',
  color: COLOR,
  seccionIA: 'SECCIÓN III — OPERACIONES (G-3) del Estado Mayor, que coordina la Orden General de Operaciones que escribe TODO el Estado Mayor y firma el Comandante',
  seccionWord: 'EMO/SEC-III',
  soloDocumentos: true,
  doctrina: OGO.doctrinaParaIA,
  datosCalco: (ctx) => OGO.datosParaIA({ ...ctx, titulosAnexos: titulosAnexos() }),
  entregas: OGO.entregas,
  entregasTexto: OGO.entregasTexto,
  estadoCalco: (ctx) => OGO.estadoAnexos(ctx),
  guias: { opord: OGO.GUIA },
  documentos: {
    opord: {
      def: { ...OGO.DEF, desdeViejo: OGO.desdeHojaVieja, limpiar: (id, x) => OGO.sinHipotesis(x) },
      nota: NOTA,
      // el Word: la identidad de la OGO del G-3 (plantilla «orden-operaciones») con su estructura propia
      registro: { id: 'opord', militar: true },
      firma: OGO.firmaOGO,
      propuestas: OGO.propuestas,
      producto: OGO.PRODUCTO,
      reglas: OGO.REGLAS,
      verificacion: OGO.VERIFICACION,
      partes: OGO.PARTES,
      // el borrador de ♻️ es la BASE de la IA (lo pule y lo completa, no lo rehace); después, el ejemplo de redacción
      bloquesIA: (ctx, hoja, valor) => [
        { titulo: 'EL BORRADOR DE LA MESA — la forma del PMTD con las unidades, fases, tareas, propósitos y RCIC de ESTE ejercicio: PARTÍ DE ACÁ (mejoralo, no lo rehagas)', texto: OGO.borradorParaIA(ctx, valor) },
        { titulo: 'EJEMPLO DE REDACCIÓN — LA FORMA Y EL NIVEL DE DETALLE QUE SE ESPERA (es de OTRO ejercicio: no copies sus unidades ni sus lugares)', texto: OGO.EJEMPLO },
      ],
      tareaIA: OGO.TAREA_IA,
      especificacion: (v, ctx, op) => OGO.especificacion(v, ctx, op),
      // ♻️ la Orden que ya estaba escrita (por el oficial o la IA) con otra forma: estos apartados pasan a la forma del PMTD
      rehacer: {
        campos: OGO.REHACER,
        boton: '♻️ Rehacer con la forma del PMTD: misión, intención, concepto, maniobra, tareas y RCIC',
        confirmar: '¿Rehacer con la forma del PMTD la MISIÓN, la INTENCIÓN, el CONCEPTO (con maniobra, fuegos, inteligencia, ingenieros y antiaérea), las TAREAS fase por fase, los RCIC de cada sección y el concepto de apoyo? Lo que está escrito en esos apartados se reemplaza; queda guardado y se puede volver atrás.',
        ayuda: 'Para la Orden que ya estaba hecha con otra forma (🌱 no pisa lo escrito): reemplaza esos apartados por lo que trae la Mesa con la forma del PMTD 2017 — la misión en una oración (quién, qué, cuándo, dónde, propósito), la intención «Mi intención es…», el concepto «Vamos a cumplir la misión mediante…», las tareas fase por fase con TAREA y PROPÓSITO de todas las unidades y los RCIC de cada sección. Lo que la Mesa no sabe queda «SIN DATO — verificar»: completalo vos o con la IA («Completar y mejorar»). Los demás apartados no se tocan.',
      },
      ideasQue: 'cómo quiere la orden: el énfasis, lo que no puede faltar, lo que cambió el Comandante',
      ideasEjemplo: 'Ej.: «El esfuerzo principal es la DIV MEC-2 en la AA-1 en todas las fases» · «La DIV-6 contraataca por el eje Julo–Bella Vista con orden» · «Prioridad de fuegos a la DIV-1 en la fase II» · «El ensayo es de comandantes sobre maqueta el D-5 en el PC».',
      sembrarAyuda:
        'Trae, sin pisar lo escrito: la Orden superior (carta, enemigo, misión, intención y concepto de dos escalones arriba, refuerzos, coordinación, IOC), el CAE más probable y el más peligroso del G-2 (H.T. 18, enunciado y H.T. 19), la misión aprobada (F2·P12), la intención (F6·P2 o F2·P14) dicha como en el PMTD («Mi intención es…»), los RCIC que determinó cada sección (la F2·P8 de cada G y el Plan de búsqueda del G-2, primero los que priorizó el Comandante), el CAP aprobado (F3·P4, F3·P6) con sus fases de la carta —el concepto, la maniobra y las tareas fase por fase, cada unidad con TAREA y PROPÓSITO—, la organización de la tarea (F4·P2), los fuegos (F4·P7), el plan de barreras, el reconocimiento (F2·P9), la matriz de riesgo, los puntos de decisión (F4·P4), la F6·SAL y lo de los anexos del G-1, G-4 y G-5.',
    },
  },
}
