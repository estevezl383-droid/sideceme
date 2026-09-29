// El Word de la matriz de administración del riesgo (formato militar, listo para firmar):
//
//   · hoja carta APAISADA, Arial;
//   · la clasificación (SECRETO) arriba y abajo de cada página, y la numeración «1 - 2»
//     al pie, como la matriz de la Escuela;
//   · el MEMBRETE TÁCTICO en Arial 10 negrilla (escalón superior · unidad considerada
//     con el puesto de comando y la hora · sección · número);
//   · el título, la MATRIZ del RO-06-01-04 (Anexo «B»): A–D arriba, E–J por tarea y
//     obstáculo, K abajo con el nivel general ENCERRADO EN UN CÍRCULO;
//   · la firma del Comandante.
import { paqueteDocx, run, campo, par, celda, fila, tabla, elipse, anchoTexto } from './docx.js'
import { normalizarRiesgo, rotulosDe, membreteDe, lineasMembrete, firmaDe, tituloDe, nivelInicial, nivelResidual, textoNivel, nivelGeneral, NIVELES, limpio, texto } from './modelo.js'

// Carta apaisada (11 × 8,5 pulgadas), márgenes 2,5 cm (izquierdo) y 2 cm.
export const PAGINA = { ancho: 15840, alto: 12240, apaisada: true, arriba: 1134, abajo: 1134, izq: 1418, der: 1134, encabezado: 567, pie: 567 }
const ANCHO_UTIL = PAGINA.ancho - PAGINA.izq - PAGINA.der // 13288
// E Tarea · F Obstáculos · G Estimar · H Medidas de control · I Residual · J Implementar
export const PROPORCION = [17, 18, 11, 22, 11, 21]
export function anchosColumnas(total = ANCHO_UTIL) {
  const suma = PROPORCION.reduce((s, x) => s + x, 0)
  const a = PROPORCION.map((x) => Math.floor((total * x) / suma))
  a[3] += total - a.reduce((s, x) => s + x, 0)
  return a
}
const TAM = 20 // Arial 10
const MARGEN_CELDA = 70

const B = (t, op = {}) => run(t, { b: true, sz: TAM, ...op })
// «PELIGROS/OBSTÁCULOS» se puede cortar después de la barra (y no en «OBSTÁCULO-S»).
const cortable = (t) => String(t).replace(/\//g, '/\u200b')
const N = (t, op = {}) => run(t, { sz: TAM, ...op })
const lineas = (t) => texto(t).split('\n').filter((x, i, a) => x || (i > 0 && i < a.length - 1))

function membreteXML(m) {
  // La hora y el puesto de comando, a la derecha de la unidad (tabulación a 15 cm).
  return lineasMembrete(m)
    .map((l) => par(l.der ? B(`${l.izq}\t${l.der}`) : B(l.izq), { tabs: l.der ? [{ pos: 8505 }] : [] }))
    .join('')
}

function celdaNivel(nivel, prob, sev, R, rotulos, ancho, kn) {
  const t = textoNivel(nivel, prob, sev, rotulos)
  return celda(t ? lineas(t).map((x) => par(B(x), { jc: 'center', keepNext: kn })) : [par('', { keepNext: kn })], { ancho, vAlign: R.alinear })
}
function celdaLista(items, numId, ancho, R, kn) {
  const ps = items
    .map(limpio)
    .filter(Boolean)
    .map((x) => (numId ? par(N(x), { numId, izq: numId === 1 ? 284 : 227, colgante: numId === 1 ? 284 : 227, keepNext: kn }) : par(N(x), { keepNext: kn })))
  return celda(ps.length ? ps : [par('', { keepNext: kn })], { ancho, vAlign: R.alinear })
}

// La fila K: el rótulo y los cuatro niveles; el que corresponde, encerrado en un círculo.
function filaK(nivel, R, anchoTotal) {
  const util = anchoTotal - 2 * MARGEN_CELDA
  const centros = [1, 3, 5, 7].map((k) => (util * k) / 8)
  const partes = []
  for (const n of NIVELES) {
    partes.push(N('\t'))
    if (n.id === nivel) {
      // La elipse se angosta arriba y abajo: el texto entra si su mitad cabe en el 85 %
      // del semieje (a la altura de las mayúsculas).
      const t = anchoTexto(n.rotulo, 10)
      const ancho = t / 0.85 + 12
      partes.push(elipse({ dx: -(ancho - t) / 2, dy: -5.5, ancho, alto: 22 }))
    }
    partes.push(B(n.rotulo))
  }
  return fila(
    [
      celda(
        [
          par(B(R.K), { antes: 40, despues: 120 }),
          par(partes.join(''), { tabs: centros.map((pos) => ({ pos, tipo: 'center' })), antes: 140, despues: 180 }),
        ],
        { ancho: anchoTotal, span: 6 },
      ),
    ],
    { noPartir: true },
  )
}

export function documentoRiesgo(valor, { ctx = {}, hoja = null } = {}) {
  const v = normalizarRiesgo(valor)
  const R = rotulosDe(v)
  const m = membreteDe(v, ctx)
  const a = anchosColumnas()
  const total = a.reduce((s, x) => s + x, 0)
  const bullH = R.vinetaH === 'check' ? 1 : 2
  const bullJ = R.vinetaJ === 'guion' ? 2 : 0

  const filas = []
  // A · B · C
  filas.push(
    fila([
      celda([par(B(R.A)), ...lineas(v.mision).map((x) => par(N(x), { jc: 'both' }))], { ancho: a[0] + a[1] + a[2], span: 3 }),
      celda([par(B(R.B)), par(B(`${R.empieza} `) + N(limpio(v.empieza))), par(B(`${R.termina} `) + N(limpio(v.termina)))], { ancho: a[3] }),
      celda([par(B(R.C)), par(N(limpio(v.preparacion)))], { ancho: a[4] + a[5], span: 2 }),
    ]),
  )
  // D
  filas.push(fila([celda([par(B(`${R.D} `) + N(limpio(v.preparadoPor)))], { ancho: total, span: 6 })]))
  // E … J (rótulos)
  filas.push(fila(['E', 'F', 'G', 'H', 'I', 'J'].map((k, i) => celda([par(B(cortable(R[k])), { jc: 'center', keepNext: true })], { ancho: a[i], vAlign: 'center' }))))
  // Una fila por obstáculo; la tarea ocupa (combinada) las filas de sus obstáculos.
  const tareas = v.tareas.length ? v.tareas : [{ tarea: '', peligros: [] }, { tarea: '', peligros: [] }, { tarea: '', peligros: [] }]
  for (const t of tareas) {
    const ps = t.peligros.length ? t.peligros : [{ peligro: '', controles: [], implementar: [] }]
    ps.forEach((p, j) => {
      const kn = j < ps.length - 1 // «conservar con la siguiente»: la tarea no se parte entre páginas
      const tareaTxt = R.tareaMayusculas ? limpio(t.tarea).toUpperCase() : limpio(t.tarea)
      const celdaTarea =
        j === 0
          ? celda([par(R.tareaMayusculas ? B(tareaTxt) : N(tareaTxt), { jc: 'center', keepNext: kn })], { ancho: a[0], vMerge: ps.length > 1 ? 'restart' : '', vAlign: R.alinear })
          : celda([par('', { keepNext: kn })], { ancho: a[0], vMerge: 'continue', vAlign: R.alinear })
      filas.push(
        fila([
          celdaTarea,
          celda(lineas(p.peligro).length ? lineas(p.peligro).map((x) => par(N(x), { jc: 'center', keepNext: kn })) : [par('', { keepNext: kn })], { ancho: a[1], vAlign: R.alinear }),
          celdaNivel(nivelInicial(p), p.prob, p.sev, R, v.rotulos, a[2], kn),
          celdaLista(p.controles || [], bullH, a[3], R, kn),
          celdaNivel(nivelResidual(p), p.probRes, p.sevRes, R, v.rotulos, a[4], kn),
          celdaLista(p.implementar || [], bullJ, a[5], R, kn),
        ]),
      )
    })
  }
  // K
  filas.push(filaK(nivelGeneral(v).nivel, R, total))

  const cuerpo = [
    membreteXML(m),
    par('', { despues: 120 }),
    par(run(tituloDe(hoja), { b: true, sz: 32 }), { jc: 'center', despues: 200 }),
    tabla(filas, a, { margenCelda: MARGEN_CELDA }),
    par(run(firmaDe(v, ctx), { b: true, sz: 24 }), { jc: 'center', antes: 1440 }),
  ].join('')
  const clas = limpio(m.clasificacion) || 'SECRETO'
  const encabezado = par(run(clas, { b: true, sz: 24 }), { jc: 'center' })
  const pie = par(run(clas, { b: true, sz: 24 }), { jc: 'center' }) + par(campo('PAGE', '1', { b: true, sz: 24 }) + run(' - ', { b: true, sz: 24 }) + campo('NUMPAGES', '1', { b: true, sz: 24 }), { jc: 'center' })
  return { cuerpo, encabezado, pie, titulo: tituloDe(hoja) }
}

// Uint8Array con el .docx (sirve en el navegador y en Node).
export function crearWordRiesgo(valor, op = {}) {
  const d = documentoRiesgo(valor, op)
  return paqueteDocx({ cuerpo: d.cuerpo, encabezado: d.encabezado, pie: d.pie, pagina: PAGINA, titulo: d.titulo })
}
export function nombreArchivo(hoja = null) {
  return `${String(hoja?.num || 'F2·P7').replace(/[^A-Za-z0-9]+/g, '')}_Matriz_de_administracion_del_riesgo${hoja && (hoja.actualiza === 'riesgo' || hoja.id === 'riesgoFinal') ? '_actualizacion' : ''}.docx`
}
export function descargarWordRiesgo(valor, op = {}) {
  const datos = crearWordRiesgo(valor, op)
  const blob = new Blob([datos], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo(op.hoja)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
  return a.download
}
