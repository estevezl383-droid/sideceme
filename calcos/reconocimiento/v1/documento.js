// La Orden de Reconocimiento como DOCUMENTO: la misma estructura sirve para el Word
// (lo arma el formato militar de la Mesa: membrete, SECRETO, numeración I.- A.- 1.- a.-,
// firma, autenticación y distribución) y para el HTML de la carpeta del G-3.
//
// El Word NO pasa por el «modelo» genérico del paquete: la orden ya viene con la forma
// de la Escuela (estructuraPropia), así no se reacomoda ni se agregan apartados ajenos.
// Sin DOM.
import { ESC } from '../../riesgo/v1/modelo.js'
import {
  TITULO,
  MODELO,
  FORMA_INTRO,
  normalizarOrden,
  sinMarcaIA,
  limpio,
  lista,
  rotuloEquipo,
  incisoEquipo,
  cuerpoEquipo,
  plazosDeEquipos,
  firmaDe,
  distribucionDe,
} from './modelo.js'

export const PENDIENTE = '[Pendiente de elaboración]'
const punto = (s) => (s && !/[.!?:;)]$/.test(s) ? `${s}.` : s)
const incisos = (xs) => lista(xs).map((x) => ({ titulo: punto(x), item: true }))
// Un apartado: su texto, sus incisos numerados o, si no tiene nada, «[Pendiente…]».
function apartado(titulo, { texto = '', hijos = [], vinetas = [] } = {}) {
  const t = sinMarcaIA(texto)
  const n = { titulo, texto: t, hijos }
  if (vinetas.length) n.vinetas = vinetas
  if (!t && !hijos.length && !vinetas.length) n.texto = PENDIENTE
  return n
}

export function seccionesOrden(valor) {
  const v = normalizarOrden(valor)
  const medios = incisos(v.medios)
  const intro = sinMarcaIA(v.formaIntro) || (medios.length ? FORMA_INTRO : '')
  const equipos = v.equipos.map((e, i) => {
    const { lineas, obtener } = cuerpoEquipo(e)
    return apartado(incisoEquipo(e, i), { texto: lineas.join('\n'), vinetas: obtener })
  })
  return [
    apartado('SITUACIÓN.', { hijos: [apartado('Enemiga.', { texto: v.enemiga }), apartado('Propia.', { texto: v.propia })] }),
    apartado('MISIÓN.', { texto: v.mision }),
    apartado('EJECUCIÓN.', {
      hijos: [
        apartado('Plan de Reconocimiento.', {
          hijos: [apartado('Objetivo general del reconocimiento.', { texto: v.objetivo }), apartado('Método del reconocimiento.', { texto: v.metodo })],
        }),
        apartado('Tareas para los equipos de reconocimiento.', {
          hijos: [
            apartado('Forma de llegar a la zona de reconocimiento.', { texto: intro, hijos: medios }),
            apartado('Tareas.', { hijos: equipos }),
            apartado('Plazos en tiempo.', { texto: v.plazos, vinetas: plazosDeEquipos(v) }),
          ],
        }),
        apartado('Instrucciones de coordinación.', { hijos: incisos(v.coordinacion) }),
      ],
    }),
    apartado('APOYO DE SERVICIO.', {
      hijos: [apartado('Abastecimientos.', { hijos: incisos(v.abastecimientos) }), apartado('Transporte.', { texto: v.transporte })],
    }),
    apartado('COMANDO Y COMUNICACIONES.', {
      hijos: [apartado('Comando.', { hijos: incisos(v.comando) }), apartado('Comunicaciones.', { hijos: incisos(v.comunicaciones) })],
    }),
  ]
}

export function organizacionOrden(valor) {
  const v = normalizarOrden(valor)
  return { titulo: 'ORGANIZACIÓN DE LA TAREA', equipos: v.equipos.map((e, i) => ({ nombre: rotuloEquipo(e, i), elementos: lista(e.elementos) })) }
}

// Lo que recibe el formato militar (formato-militar/v1: runtime.js → word.js).
export function especificacionOrden(valor, { ctx = {} } = {}) {
  const v = normalizarOrden(valor)
  const firma = firmaDe(v, ctx)
  return {
    titulo: TITULO,
    numero: limpio(v.numero) || '01',
    estructuraPropia: true,
    modelo: MODELO,
    preliminares: [
      { rotulo: 'OBJETO', texto: sinMarcaIA(v.objeto) },
      { rotulo: 'CARTA', texto: sinMarcaIA(v.carta) },
      { rotulo: 'ANEXOS', texto: sinMarcaIA(v.anexos) },
    ],
    organizacion: organizacionOrden(v),
    secciones: seccionesOrden(v),
    ...(firma ? { firma } : {}),
    distribucion: distribucionDe(v, ctx),
  }
}

// ─── HTML (carpeta del G-3; la carpeta ya pone membrete y título por hoja) ───────
const FORMATOS = ['I', 'A', '1', 'a', '1', 'a']
const SUFIJO = ['.-', '.-', '.-', '.-', ')', ')']
function rotuloNumero(nivel, n) {
  const f = FORMATOS[Math.min(nivel, 5)]
  let s
  if (f === 'I') {
    const r = [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]
    s = ''
    let x = n
    for (const [l, val] of r) while (x >= val) (s += l), (x -= val)
  } else if (f === 'A' || f === 'a') {
    s = String.fromCharCode(64 + ((n - 1) % 26) + 1)
    if (f === 'a') s = s.toLowerCase()
  } else s = String(n)
  return s + SUFIJO[Math.min(nivel, 5)]
}
function nodosHTML(ns, nivel = 0) {
  let c = 0
  return (ns || [])
    .map((n) => {
      c++
      const sangria = (nivel + 1) * 1
      const num = rotuloNumero(nivel, c)
      const cab = n.item
        ? `<p class="inc" style="margin-left:${sangria}cm;text-indent:-1cm"><b>${num}</b>&emsp;${ESC(n.titulo)}</p>`
        : `<p class="tit n${nivel}" style="margin-left:${sangria}cm;text-indent:-1cm"><b>${num}</b>&emsp;<b${nivel < 2 ? ' style="text-decoration:underline"' : ''}>${ESC(n.titulo)}</b></p>`
      const cuerpo = String(n.texto || '')
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => `<p class="cue${l === PENDIENTE ? ' pend' : ''}" style="margin-left:${sangria}cm">${ESC(l)}</p>`)
        .join('')
      const vin = (n.vinetas || []).map((x) => `<p class="vin" style="margin-left:${sangria + 1}cm;text-indent:-0.5cm">-&emsp;${ESC(x)}</p>`).join('')
      return cab + cuerpo + vin + nodosHTML(n.hijos, nivel + 1)
    })
    .join('')
}
export function cuadroHTML(org) {
  if (!org?.equipos?.length) return ''
  const grupos = []
  for (let i = 0; i < org.equipos.length; i += 4) grupos.push(org.equipos.slice(i, i + 4))
  return grupos
    .map(
      (g) =>
        `<table class="org"><tr>${g.map((e) => `<th>${ESC(e.nombre)}</th>`).join('')}</tr><tr>${g
          .map((e) => `<td>${(e.elementos || []).map((x) => `<div>-&ensp;${ESC(x)}</div>`).join('') || '&nbsp;'}</td>`)
          .join('')}</tr></table>`,
    )
    .join('')
}
export function ordenHTML(valor, op = {}) {
  const s = especificacionOrden(valor, { ctx: op.ctx || {} })
  const pre = s.preliminares.map((o) => `<p class="oca"><b>${ESC(o.rotulo)}</b>&emsp;:&emsp;${ESC(o.texto) || '<span class="pend">[Pendiente]</span>'}</p>`).join('')
  const org = s.organizacion.equipos.length ? `<p class="oca"><b>ORGANIZACIÓN DE LA TAREA:</b></p>${cuadroHTML(s.organizacion)}` : ''
  const estilo =
    '<style>.reco{font-family:Arial,Helvetica,sans-serif;font-size:12pt;color:#000}.reco p{margin:0 0 8pt;text-align:justify}.reco .inc,.reco .vin{margin-bottom:2pt}.reco .pend{color:#a33;font-style:italic}.reco table.org{border-collapse:collapse;width:100%;margin:4pt 0 10pt}.reco table.org th,.reco table.org td{border:1px solid #000;padding:3pt 5pt;font-size:10pt;vertical-align:top}.reco table.org th{text-align:center}.reco .firma{text-align:center;font-weight:bold;margin-top:24pt}</style>'
  return `${estilo}<div class="reco">${pre}${org}${nodosHTML(s.secciones)}${s.firma ? `<p class="firma">${ESC(s.firma)}</p>` : ''}</div>`
}
