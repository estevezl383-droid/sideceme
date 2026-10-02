// Los DOCUMENTOS de logística del G-4:
//
//   · la APRECIACIÓN DE SITUACIÓN DE LOGÍSTICA sale por el formato militar de la Mesa
//     (membrete, SECRETO, numeración I.- A.- 1.- a.-, firma, autenticación): acá se arma
//     la especificación con la estructura propia de la apreciación;
//   · la MATRIZ DE SINCRONIZACIÓN LOGÍSTICA y la EVALUACIÓN DE LAS ÁREAS PROPUESTAS son
//     cuadros apaisados con la forma de las láminas de la Escuela: se escriben con el Word
//     propio (XML a mano) de la matriz de riesgo, que permite pintar las casillas.
//
// Sin DOM (salvo descargar): se prueba en Node.
import { paqueteDocx, run, campo, par, celda, fila, tabla } from '../../riesgo/v1/docx.js'
import { ESC } from '../../riesgo/v1/modelo.js'
import { FACTORES, FILAS_MATRIZ, SIGLAS_MATRIZ, FUENTES } from './doctrina.js'
import {
  limpio,
  texto,
  sinMarcaIA,
  normalizarASL,
  normalizarMatriz,
  normalizarEval,
  ARBOL_ASL,
  ANALISIS_CAP,
  TITULO_ASL,
  TITULO_MATRIZ,
  celdaEval,
  conclusionDe,
  firmaG4,
  unidadDe,
} from './modelo.js'

export const PENDIENTE = '[Pendiente de elaboración]'
const punto = (s) => (s && !/[.!?:;)]$/.test(s) ? `${s}.` : s)

// Un texto de la hoja → { texto, vinetas }: los renglones que empiezan con «- » van
// como guiones debajo del texto.
function partir(t) {
  const ls = sinMarcaIA(t).split('\n').map((x) => x.trim()).filter(Boolean)
  const vin = []
  const txt = []
  for (const l of ls) (/^[-•·]\s+/.test(l) ? vin : txt).push(l.replace(/^[-•·]\s+/, ''))
  return { texto: txt.join('\n'), vinetas: vin.map(punto) }
}
function apartado(titulo, valor = '', hijos = []) {
  const { texto: t, vinetas } = partir(valor)
  const n = { titulo, texto: t, hijos }
  if (vinetas.length) n.vinetas = vinetas
  if (!t && !hijos.length && !vinetas.length) n.texto = PENDIENTE
  return n
}

// ─── APRECIACIÓN DE SITUACIÓN DE LOGÍSTICA ──────────────────────────────────────────
const SUB_ABAST = [
  ['abastDisp', 'Disponibilidades.'],
  ['abastNiveles', 'Niveles prescritos.'],
  ['abastNecesidades', 'Necesidades.'],
  ['abastLimitaciones', 'Limitaciones.'],
  ['abastRequerimientos', 'Requerimientos a efectuar.'],
]
const RESTO_CAP = ANALISIS_CAP.filter(([k]) => !k.startsWith('abast')).map(([k, t]) => [k, t.replace(/ \(.*\)\.$/, '.')])
export function seccionesASL(valor) {
  const v = normalizarASL(valor)
  const nodo = ([id, t, h]) => {
    if (id === 'CAPS') return null
    if (id === 'VENTAJAS') return apartado(t, '', v.caps.map((c) => apartado(`${punto(c.nombre)}`, '', [apartado('Ventajas.', c.ventajas), apartado('Desventajas.', c.desventajas)])))
    if (h) {
      const hijos = h.flatMap((x) => (x[0] === 'CAPS' ? capsAnalisis(v) : [nodo(x)])).filter(Boolean)
      return { titulo: t, texto: '', hijos }
    }
    return apartado(t, v.campos[id])
  }
  return ARBOL_ASL.map(nodo)
}
function capsAnalisis(v) {
  return v.caps.map((c) =>
    apartado(`${punto(c.nombre)}`, '', [
      apartado('Abastecimientos.', '', SUB_ABAST.map(([k, t]) => apartado(t, c.analisis[k]))),
      ...RESTO_CAP.map(([k, t]) => apartado(t, c.analisis[k])),
    ]),
  )
}
export function especificacionASL(valor, { ctx = {} } = {}) {
  const v = normalizarASL(valor)
  return {
    titulo: TITULO_ASL,
    numero: limpio(v.numero) || '01',
    estructuraPropia: true,
    modelo: 'Apreciación de Situación de Logística (G-4) — forma de la Mesa del Estado Mayor',
    preliminares: [
      { rotulo: 'OBJETO', texto: sinMarcaIA(v.objeto) },
      { rotulo: 'CARTAS', texto: sinMarcaIA(v.cartas) },
      { rotulo: 'ANEXOS', texto: sinMarcaIA(v.anexos) },
    ],
    secciones: seccionesASL(v),
    firma: firmaG4(ctx, v.firma),
  }
}

// HTML (vista previa sin el Word y carpeta del EM).
const FORM = ['I', 'A', '1', 'a', '1', 'a']
const SUF = ['.-', '.-', '.-', '.-', ')', ')']
function rotNum(nivel, n) {
  const f = FORM[Math.min(nivel, 5)]
  let s
  if (f === 'I') {
    s = ''
    let x = n
    for (const [l, val] of [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]) while (x >= val) (s += l), (x -= val)
  } else if (f === 'A' || f === 'a') {
    s = String.fromCharCode(65 + ((n - 1) % 26))
    if (f === 'a') s = s.toLowerCase()
  } else s = String(n)
  return s + SUF[Math.min(nivel, 5)]
}
function nodosHTML(ns, nivel = 0) {
  return (ns || [])
    .filter(Boolean)
    .map((n, i) => {
      const pend = n.texto === PENDIENTE
      const t = n.texto ? `<span${pend ? ' style="color:#888;font-style:italic"' : ''}> ${ESC(n.texto).replace(/\n/g, '<br>')}</span>` : ''
      const vin = (n.vinetas || []).map((x) => `<div style="margin-left:${(nivel + 2) * 14}px">- ${ESC(x)}</div>`).join('')
      return `<div style="margin:3px 0 3px ${nivel * 14}px"><b>${rotNum(nivel, i + 1)} ${ESC(n.titulo)}</b>${t}</div>${vin}${nodosHTML(n.hijos, nivel + 1)}`
    })
    .join('')
}
export function aslHTML(valor, { ctx = {} } = {}) {
  const s = especificacionASL(valor, { ctx })
  const pre = s.preliminares.map((p) => `<div><b>${p.rotulo}:</b> ${ESC(p.texto) || `<i style="color:#888">${PENDIENTE}</i>`}</div>`).join('')
  return `<div style="font-family:Arial,sans-serif;font-size:12px;color:#111"><h3 style="text-align:center;margin:4px 0">${ESC(s.titulo)} No. ${ESC(s.numero)}</h3>${pre}<hr>${nodosHTML(s.secciones)}<p style="text-align:center;margin-top:24px"><b>${ESC(s.firma)}</b></p></div>`
}

// ─── Cuadros apaisados (matriz y evaluación) ────────────────────────────────────────
export const PAGINA = { ancho: 15840, alto: 12240, apaisada: true, arriba: 1134, abajo: 1134, izq: 1418, der: 1134, encabezado: 567, pie: 567 }
const UTIL = PAGINA.ancho - PAGINA.izq - PAGINA.der
const TAM = 18 // Arial 9 en las celdas
const B = (t, op = {}) => run(t, { b: true, sz: TAM, ...op })
const N = (t, op = {}) => run(t, { sz: TAM, ...op })
const lineas = (t) => texto(sinMarcaIA(t)).split('\n').map((x) => x.trim()).filter(Boolean)

export function membreteDe(ctx = {}, numero = '') {
  const os = ctx?.ordenSup || {}
  const clave = limpio(os.clave).toUpperCase()
  return {
    clasificacion: 'SECRETO',
    superior: limpio(os.escalonSuperior),
    unidad: unidadDe(ctx),
    derecha: [limpio(os.puestoMando), limpio(os.vigencia)].filter(Boolean).join(' '),
    seccion: 'EM. Sec. IV (LOG.)',
    numero: limpio(numero) || (clave ? `001/${clave}` : '001'),
  }
}
function membreteXML(m) {
  const B10 = (t) => run(t, { b: true, sz: 20 })
  return [
    m.superior && par(B10(m.superior)),
    (m.unidad || m.derecha) && par(B10(`${m.unidad}${m.derecha ? `\t${m.derecha}` : ''}`), { tabs: m.derecha ? [{ pos: UTIL, tipo: 'right' }] : [] }),
    par(B10(m.seccion)),
    par(B10(`No. ${m.numero}`)),
  ]
    .filter(Boolean)
    .join('')
}
function encabezadoPie(clas) {
  const encabezado = par(run(clas, { b: true, sz: 24 }), { jc: 'center' })
  const pie = par(run(clas, { b: true, sz: 24 }), { jc: 'center' }) + par(campo('PAGE', '1', { b: true, sz: 24 }) + run(' - ', { b: true, sz: 24 }) + campo('NUMPAGES', '1', { b: true, sz: 24 }), { jc: 'center' })
  return { encabezado, pie }
}
const parsDe = (t, op = {}) => {
  const ls = lineas(t)
  return ls.length ? ls.map((x) => par(N(x), { ...op })) : [par('')]
}

// ─── MATRIZ DE SINCRONIZACIÓN LOGÍSTICA ─────────────────────────────────────────────
export function documentoMatriz(valor, { ctx = {} } = {}) {
  const v = normalizarMatriz(valor)
  const nF = v.fases.length
  const c0 = Math.round(UTIL * 0.12)
  const c1 = Math.round(UTIL * 0.16)
  const resto = UTIL - c0 - c1
  const cf = Array.from({ length: nF }, (_, i) => Math.floor(resto / nF) + (i === nF - 1 ? resto - Math.floor(resto / nF) * nF : 0))
  const anchos = [c0, c1, ...cf]
  const filas = []
  filas.push(
    fila(
      [
        celda([par(B('FASES / Eventos'), { jc: 'center' })], { ancho: c0 + c1, span: 2, vAlign: 'center', relleno: 'D9D9D9' }),
        ...v.fases.map((f, i) =>
          celda([par(B(f.nombre), { jc: 'center' }), par(B(`DESDE ${limpio(f.desde) || '……'}   HASTA ${limpio(f.hasta) || '……'}`), { jc: 'center' })], { ancho: cf[i], vAlign: 'center', relleno: 'D9D9D9' }),
        ),
      ],
      { encabezado: true },
    ),
  )
  const grupos = {}
  FILAS_MATRIZ.forEach((f) => f.grupo && (grupos[f.grupo] = (grupos[f.grupo] || 0) + 1))
  const vistos = {}
  for (const f of FILAS_MATRIZ) {
    const celdasFase = v.fases.map((fa, i) => celda(parsDe(v.celdas[f.id][fa.id]), { ancho: cf[i] }))
    if (!f.grupo) {
      filas.push(fila([celda([par(B(f.rot))], { ancho: c0 + c1, span: 2 }), ...celdasFase]))
      continue
    }
    const primero = !vistos[f.grupo]
    vistos[f.grupo] = true
    filas.push(
      fila([
        primero ? celda([par(B(f.grupo))], { ancho: c0, vMerge: grupos[f.grupo] > 1 ? 'restart' : '' }) : celda([par('')], { ancho: c0, vMerge: 'continue' }),
        celda([par(N(f.rot))], { ancho: c1 }),
        ...celdasFase,
      ]),
    )
  }
  const m = membreteDe(ctx, v.numero)
  const leyenda = SIGLAS_MATRIZ.map(([a, b]) => par(B(`${a}\t:\t`) + N(b), { tabs: [{ pos: 900 }, { pos: 1300 }] })).join('')
  const cuerpo = [
    membreteXML(m),
    par('', { despues: 120 }),
    par(run(TITULO_MATRIZ, { b: true, sz: 32 }), { jc: 'center', despues: 200 }),
    tabla(filas, anchos, { margenCelda: 70 }),
    par('', { despues: 120 }),
    leyenda,
    par(run(firmaG4(ctx, v.firma), { b: true, sz: 24 }), { jc: 'center', antes: 1200 }),
  ].join('')
  return { cuerpo, ...encabezadoPie(m.clasificacion), titulo: TITULO_MATRIZ }
}
export function crearWordMatriz(valor, op = {}) {
  const d = documentoMatriz(valor, op)
  return paqueteDocx({ cuerpo: d.cuerpo, encabezado: d.encabezado, pie: d.pie, pagina: PAGINA, titulo: d.titulo })
}

// ─── EVALUACIÓN DE LAS ÁREAS PROPUESTAS ─────────────────────────────────────────────
const ROJO = 'FF0000'
const COLOR_FACTOR = { maniobra: 'FF0000', terreno: '00CC00', seguridad: 'FF99CC', situacion: 'FFC000' }
const COLOR_AREA = ['FFC000', 'FFFF00', 'FFD966', 'FFE699', 'F4B183', 'C9C9C9']
export function documentoEvaluacion(valor, analisis, { ctx = {} } = {}) {
  const ev = normalizarEval(valor)
  const areas = analisis?.areas || []
  const sug = analisis?.sugerencias || {}
  const nA = Math.max(1, areas.length)
  const cA = Math.round((UTIL * 0.34) / nA)
  const cF = Math.round(UTIL * 0.16)
  const cG = Math.round(UTIL * 0.12)
  const cAsp = UTIL - cF - cG - cA * nA
  const anchos = [cF, cG, cAsp, ...areas.map(() => cA)]
  const filas = []
  filas.push(
    fila(
      [
        celda([par(B('FACTOR', { sz: 22 }), { jc: 'center' })], { ancho: cF, vAlign: 'center', relleno: '00FFFF' }),
        celda([par(B('ASPECTO', { sz: 22 }), { jc: 'center' })], { ancho: cG + cAsp, span: 2, vAlign: 'center', relleno: 'E7E6E6' }),
        ...areas.map((a, i) => celda([par(B(a.nombre.toUpperCase(), { sz: 22 }), { jc: 'center' })], { ancho: cA, vAlign: 'center', relleno: COLOR_AREA[i % COLOR_AREA.length] })),
      ],
      { encabezado: true },
    ),
  )
  for (const f of FACTORES) {
    const grupos = f.grupos || null
    f.aspectos.forEach((asp, j) => {
      const fac = j === 0 ? celda([par(B(f.nom, { sz: 22 }), { jc: 'center' })], { ancho: cF, vMerge: f.aspectos.length > 1 ? 'restart' : '', vAlign: 'center', relleno: COLOR_FACTOR[f.id] }) : celda([par('')], { ancho: cF, vMerge: 'continue', relleno: COLOR_FACTOR[f.id] })
      const marcas = areas.map((a) => {
        const c = celdaEval(ev, sug, asp.id, a.clave)
        return celda([par(c.estado === 'si' ? '' : c.estado === 'no' ? '' : N('?', { color: '808080' }), { jc: 'center' })], { ancho: cA, vAlign: 'center', relleno: c.estado === 'si' ? ROJO : '' })
      })
      if (grupos) {
        const g = asp.grupo
        const delGrupo = f.aspectos.filter((x) => x.grupo === g)
        const primero = delGrupo[0].id === asp.id
        const cg = primero ? celda([par(run(grupos.find((x) => x.id === g)?.nom || '', { b: true, sz: TAM }), { jc: 'center' })], { ancho: cG, vMerge: delGrupo.length > 1 ? 'restart' : '', vAlign: 'center' }) : celda([par('')], { ancho: cG, vMerge: 'continue' })
        filas.push(fila([fac, cg, celda([par(N(asp.nom))], { ancho: cAsp, vAlign: 'center' }), ...marcas]))
      } else filas.push(fila([fac, celda([par(N(asp.nom))], { ancho: cG + cAsp, span: 2, vAlign: 'center' }), ...marcas]))
    })
  }
  // Datos medidos en el calco (verificación de los datos generales de planeamiento)
  const filasDatos = [
    fila([celda([par(B('DATO'), { jc: 'center' })], { ancho: cF + cG, span: 2, relleno: 'D9D9D9' }), celda([par(B('NORMA (datos generales de planeamiento)'), { jc: 'center' })], { ancho: cAsp, relleno: 'D9D9D9' }), ...areas.map((a) => celda([par(B(a.nombre.toUpperCase()), { jc: 'center' })], { ancho: cA, relleno: 'D9D9D9' }))]),
  ]
  const dato = (rot, norma, f) => filasDatos.push(fila([celda([par(B(rot))], { ancho: cF + cG, span: 2 }), celda([par(N(norma))], { ancho: cAsp }), ...areas.map((a) => celda(parsDe(f(a)), { ancho: cA }))]))
  if (areas.length) {
    dato('Tamaño del área', areas[0].tamano.norma, (a) => a.tamano.txt)
    dato('Distancia de seguridad', `Mínimo ${areas[0].seguridad.min} km (impositivo)`, (a) => a.seguridad.txt)
    dato('Distancia máxima de apoyo', analisis.dma?.texto || '', (a) => a.dma.txt)
  }
  const m = membreteDe(ctx)
  const concl = conclusionDe(ev, areas, sug, ctx)
  const elegida = areas.find((a) => a.clave === ev.elegida)
  const cuerpo = [
    membreteXML(m),
    par('', { despues: 120 }),
    par(run('EVALUACIÓN DE LAS ÁREAS PROPUESTAS', { b: true, sz: 32 }), { jc: 'center', despues: 200 }),
    tabla(filas, anchos, { margenCelda: 60 }),
    par(N('Casilla pintada: el área REÚNE el aspecto. Casilla en blanco: no lo reúne. «?»: sin evaluar.', { sz: 16, color: '595959' }), { antes: 60 }),
    par('', { despues: 160 }),
    areas.length ? par(B('VERIFICACIÓN DE LOS DATOS GENERALES DE PLANEAMIENTO (medidos en el calco)'), { despues: 80, keepNext: true }) : '',
    areas.length ? tabla(filasDatos, anchos.slice(0, 3).concat(areas.map(() => cA)), { margenCelda: 60 }) : '',
    par('', { despues: 160 }),
    concl ? par(B('CONCLUSIÓN:'), { keepNext: true }) + par(N(concl, { sz: 20 }), { jc: 'both', despues: 120 }) : '',
    elegida ? par(B('ÁREA ELEGIDA: ') + N(`${elegida.nombre} (${elegida.tamano.txt}).`, { sz: 20 })) : '',
    par(N(`Fuente: ${FUENTES.dia} — «Factores de empleo» (maniobra, terreno, seguridad y situación logística), «Evaluación de las áreas propuestas» y «Datos generales de planeamiento logístico».`, { sz: 14, color: '595959' }), { antes: 200 }),
    par(run(firmaG4(ctx), { b: true, sz: 24 }), { jc: 'center', antes: 1000 }),
  ].join('')
  return { cuerpo, ...encabezadoPie(m.clasificacion), titulo: 'EVALUACIÓN DE LAS ÁREAS PROPUESTAS' }
}
export function crearWordEvaluacion(valor, analisis, op = {}) {
  const d = documentoEvaluacion(valor, analisis, op)
  return paqueteDocx({ cuerpo: d.cuerpo, encabezado: d.encabezado, pie: d.pie, pagina: PAGINA, titulo: d.titulo })
}

// HTML del cuadro (pantalla y carpeta).
export function matrizHTML(valor) {
  const v = normalizarMatriz(valor)
  const td = 'border:1px solid #000;padding:3px 5px;vertical-align:top'
  const cab = `<tr><th style="${td};background:#d9d9d9" colspan="2">FASES / Eventos</th>${v.fases.map((f) => `<th style="${td};background:#d9d9d9">${ESC(f.nombre)}<br>DESDE ${ESC(f.desde || '……')} HASTA ${ESC(f.hasta || '……')}</th>`).join('')}</tr>`
  const cuerpo = FILAS_MATRIZ.map((f) => `<tr><td style="${td}"${f.grupo ? '' : ' colspan="2"'}><b>${ESC(f.grupo || f.rot)}</b></td>${f.grupo ? `<td style="${td}">${ESC(f.rot)}</td>` : ''}${v.fases.map((fa) => `<td style="${td}">${ESC(sinMarcaIA(v.celdas[f.id][fa.id])).replace(/\n/g, '<br>')}</td>`).join('')}</tr>`).join('')
  return `<table style="border-collapse:collapse;font:11px Arial;width:100%">${cab}${cuerpo}</table>`
}

export function descargar(datos, nombre) {
  const blob = new Blob([datos], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
  return blob
}
export const blobDe = (datos) => new Blob([datos], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
