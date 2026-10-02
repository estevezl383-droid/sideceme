// Las pantallas de logística del G-4 (JavaScript sin compilar; React llega por runtime.js):
//
//   · <PasoAPaso>: arriba de la pestaña «▣ ASDI». Construye el área de apoyo logístico
//     PASO A PASO, como enseña la Escuela: 1 entender (ASDI, ARCE y el esquema en
//     profundidad) · 2 proponer áreas A, B… sobre el calco · 3 verificar los datos
//     generales de planeamiento (tamaño, distancia de seguridad, DMA, tonelaje) y
//     ACOSTAR las medidas en la carta · 4 evaluar las áreas (la matriz de la Escuela, con
//     lo medido, lo del oficial y la IA) · 5 elegir y desplegar el Batallón Logístico.
//   · <EditorHojaLog>: en «📋 Mis hojas» del G-4, la APRECIACIÓN DE SITUACIÓN DE LOGÍSTICA
//     (F1·P3 y F2·P13) y la MATRIZ DE SINCRONIZACIÓN LOGÍSTICA (F7·P2): 🌱 traer del calco
//     y de las demás hojas, 💡 ideas del oficial, 🤖 IA, Word y acostar al calco.
import { ENTENDER, FACTORES, TAMANO, SEGURIDAD, TONELAJE_BATALLON, TONELAJE_DIVISION, FUENTE_DATOS, FUENTE_FACTORES, OBS_SEGURIDAD, DMA_NOTA, FILAS_MATRIZ, NIVELES_AMENAZA, FUENTE_AMENAZA, SIGLAS_MATRIZ, EJEMPLO_CONCLUSION } from './doctrina.js'
import { analizarCalco, LETRAS, REGLAS, batallonesDelCalco, tonelaje, nombreArea } from './analisis.js'
import { fmtKm, fmtKm2 } from './geo.js'
import {
  limpio,
  CLAVE_EVAL,
  normalizarEval,
  celdaEval,
  ciclarCelda,
  fijarCelda,
  resumenEval,
  conclusionAuto,
  mejorArea,
  normalizarASL,
  armarASL,
  partirDe,
  revisarASL,
  resumenASL,
  ARBOL_ASL,
  ANALISIS_CAP,
  TITULO_ASL,
  nuevoCap,
  normalizarMatriz,
  armarMatriz,
  copiarFaseAnterior,
  revisarMatriz,
  nuevaFase,
  TITULO_MATRIZ,
  unidadDe,
} from './modelo.js'
import { MODOS, pedidoEval, aplicarRespuestaEval, pedidoASL, aplicarRespuestaASL, pedidoMatriz, aplicarRespuestaMatriz, otrasHojasG4 } from './ia.js'
import { especificacionASL, aslHTML, crearWordMatriz, crearWordEvaluacion, matrizHTML, descargar, blobDe } from './documento.js'
import { useState, useEffect, jsx, jsxs, panelIA, encabezadoIA, corregirIA, wordMilitar, registroMilitar, vistaMilitar, mostrarDocx, catalogo, useCalco, accion, verEnCarta, mostrarMedidas, ocultarMedidas, medidasVisibles } from './runtime.js'

function h(tipo, props, ...hijos) {
  const { key, ...p } = props || {}
  const hs = hijos.flat().filter((x) => x !== null && x !== undefined && x !== false && x !== '')
  if (!hs.length) return jsx(tipo, p, key)
  if (hs.length === 1) return jsx(tipo, { ...p, children: hs[0] }, key)
  return jsxs(tipo, { ...p, children: hs }, key)
}

const AMBAR = '#fbbf24'
const E = {
  raiz: { display: 'flex', flexDirection: 'column', gap: 8, color: '#e6eef6', fontSize: 12 },
  caja: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: 9, display: 'flex', flexDirection: 'column', gap: 6 },
  pasoCab: { display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.35)', color: '#ffe3a0', borderRadius: 8, padding: '7px 9px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, width: '100%', textAlign: 'left' },
  pasoNum: { background: AMBAR, color: '#1b1405', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flex: '0 0 auto' },
  estado: { marginLeft: 'auto', fontSize: 11, fontWeight: 400 },
  sub: { fontSize: 10, color: '#8fa2bd', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },
  parrafo: { fontSize: 12, color: AMBAR, fontWeight: 700, letterSpacing: 0.3 },
  fila: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  btn: { flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 6, padding: '7px 8px', cursor: 'pointer', fontSize: 12 },
  btnPrin: { flex: 1, minWidth: 140, background: AMBAR, color: '#1b1405', border: 'none', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 },
  btnChico: { background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', fontSize: 11, lineHeight: 1.2 },
  btnMas: { background: 'transparent', color: AMBAR, border: `1px dashed ${AMBAR}88`, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11.5, textAlign: 'left' },
  ayuda: { fontSize: 10.5, color: '#9fb0c8', lineHeight: 1.45 },
  ok: { background: '#12291d', border: '1px solid #2f6b46', color: '#9fe0c0', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  err: { background: '#2a1416', border: '1px solid #6b2f35', color: '#f0b0b6', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  aviso: { background: 'rgba(255,212,122,0.08)', border: '1px solid rgba(255,212,122,0.3)', color: '#ffd47a', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  area: { background: 'rgba(0,0,0,0.4)', color: '#e6eef6', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: '5px 7px', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', lineHeight: 1.35 },
  campo: { width: '100%', boxSizing: 'border-box', background: '#172332', color: '#fff', border: '1px solid #4d5d70', borderRadius: 4, padding: '5px 6px', fontSize: 12, fontFamily: 'inherit' },
  num: { width: 58, background: '#172332', color: '#fff', border: '1px solid #4d5d70', borderRadius: 4, padding: '4px 5px', fontSize: 12 },
  rot: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 11, color: '#b9c9da', marginBottom: 2, fontWeight: 600 },
  numRot: { display: 'inline-block', minWidth: 22, color: AMBAR, fontWeight: 700 },
  tarjeta: { background: '#101a27', border: '1px solid rgba(251,191,36,0.28)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 },
  fuente: { fontSize: 9.5, color: '#7f8ea6', fontStyle: 'italic' },
  ia: { display: 'inline-flex', gap: 5, alignItems: 'center', background: 'rgba(198,156,255,0.12)', border: '1px solid rgba(198,156,255,0.4)', color: '#d9c2ff', borderRadius: 6, padding: '1px 6px', fontSize: 10.5, fontWeight: 400 },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
  th: { border: '1px solid #3a4a68', padding: '3px 4px', background: '#1a2436', color: '#cfe0ea', fontWeight: 700, textAlign: 'center' },
  td: { border: '1px solid #3a4a68', padding: '3px 4px', verticalAlign: 'top' },
  chip: { background: '#0e1320', color: '#cdd8e8', border: '1px solid #34405a', borderRadius: 12, padding: '3px 9px', cursor: 'pointer', fontSize: 11 },
  chipOn: { background: AMBAR, color: '#1b1405', borderColor: AMBAR, fontWeight: 700 },
}
const filasDe = (t, min = 2, max = 10) => Math.min(max, Math.max(min, Math.ceil(String(t || '').length / 46) + (String(t || '').match(/\n/g) || []).length))

// ─── Visor a pantalla completa (va en <body>: el panel lo recortaría) ───────────────
function abrirVisor({ titulo, aviso = '', html = '', dibujar = null, botones = [] }) {
  document.getElementById('sid-visor-log')?.remove()
  const velo = document.createElement('div')
  velo.id = 'sid-visor-log'
  velo.setAttribute('role', 'dialog')
  velo.setAttribute('aria-label', titulo)
  Object.assign(velo.style, { position: 'fixed', inset: '0', zIndex: '100000', background: 'rgba(8,12,20,0.94)', display: 'flex', flexDirection: 'column', padding: '8px', boxSizing: 'border-box', gap: '8px' })
  const barra = document.createElement('div')
  Object.assign(barra.style, { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: '#141a29', border: '1px solid #34405a', borderRadius: '8px', padding: '8px', fontFamily: 'system-ui, sans-serif' })
  const tit = document.createElement('b')
  tit.textContent = titulo
  Object.assign(tit.style, { color: AMBAR, fontSize: '13px', flex: '1 1 220px' })
  const estado = document.createElement('span')
  Object.assign(estado.style, { color: '#ffd47a', fontSize: '12px', flex: '1 1 100%' })
  estado.textContent = aviso
  const boton = (texto, principal, f) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = texto
    Object.assign(b.style, principal ? { background: AMBAR, color: '#1b1405', border: 'none', borderRadius: '7px', padding: '8px 12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' } : { background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', fontSize: '13px' })
    b.onclick = f
    return b
  }
  const cerrar = () => {
    velo.remove()
    document.removeEventListener('keydown', tecla)
  }
  const tecla = (e) => e.key === 'Escape' && cerrar()
  barra.append(tit, ...botones.map((x) => boton(x.texto, x.principal, async () => (estado.textContent = (await x.accion()) || ''))), boton('✕ Cerrar', false, cerrar), estado)
  const marco = document.createElement('div')
  Object.assign(marco.style, { flex: '1 1 auto', width: '100%', overflow: 'auto', borderRadius: '6px', background: '#5d6470' })
  if (dibujar)
    dibujar(marco).catch((e) => {
      estado.textContent = `No se pudo dibujar el Word: ${e?.message || e}`
    })
  else {
    const hoja = document.createElement('div')
    Object.assign(hoja.style, { background: '#fff', maxWidth: '27.9cm', margin: '12px auto', padding: '1.5cm', boxSizing: 'border-box' })
    hoja.innerHTML = html
    marco.append(hoja)
  }
  velo.append(barra, marco)
  document.addEventListener('keydown', tecla)
  document.body.appendChild(velo)
}
async function previaDocx(titulo, datos, nombre, htmlRespaldo) {
  const M = mostrarDocx()
  const bajar = { texto: '📄 Descargar el Word', principal: true, accion: () => (descargar(datos, nombre), `✓ Word descargado: ${nombre}`) }
  if (!M) return abrirVisor({ titulo, html: htmlRespaldo, botones: [bajar], aviso: 'Vista aproximada: el Word lleva además el membrete, SECRETO y la numeración.' })
  abrirVisor({ titulo, dibujar: (host) => M(blobDe(datos), host), botones: [bajar] })
}

function MarcaIA({ activa, onRevisado }) {
  if (!activa) return null
  return h('span', { style: E.ia, title: 'Lo escribió la IA: es una propuesta, no una fuente. No se imprime esta marca.' }, '🤖 revisar', h('button', { style: { ...E.btnChico, padding: '0 5px', fontSize: 10 }, onClick: onRevisado }, '✓ revisado'))
}
function Texto({ rot, num = '', valor, onCambio, placeholder = '', min = 2, ia = false, onRevisado }) {
  return h('label', null, h('span', { style: E.rot }, num && h('span', { style: E.numRot }, num), rot, h(MarcaIA, { activa: ia, onRevisado })), h('textarea', { style: E.area, rows: filasDe(valor, min), value: valor || '', placeholder, onChange: (e) => onCambio(e.target.value) }))
}
function Msg({ msg }) {
  return msg ? h('div', { style: E[msg.tipo] || E.ok, role: 'status' }, msg.txt) : null
}
function Paso({ n, titulo, estado = '', abierto, onAbrir, children }) {
  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 6 }, 'data-paso': String(n) },
    h('button', { style: E.pasoCab, onClick: onAbrir, 'aria-expanded': abierto ? 'true' : 'false' }, h('span', { style: E.pasoNum }, String(n)), titulo, h('span', { style: E.estado }, estado), h('span', null, abierto ? '▾' : '▸')),
    abierto && h('div', { style: { ...E.caja, borderColor: 'rgba(251,191,36,0.25)' } }, children),
  )
}

// El contexto que usan modelo, IA y documentos.
function contexto({ calco, analisis, ev, hojas, ctxDoc = {}, orden = null }) {
  return { ...ctxDoc, ordenSup: orden && Object.keys(orden).length ? orden : ctxDoc.ordenSup || {}, unidad: ctxDoc.unidad || orden?.unidad || '', calco, analisis, evaluacion: ev, hojasG4: hojas, catalogo: catalogo() }
}
async function expedienteDe(onExpediente) {
  try {
    return (await onExpediente?.({ conCoc: true }))?.md || ''
  } catch {
    try {
      return (await onExpediente?.())?.md || ''
    } catch {
      return ''
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════════════
// PASO A PASO — pestaña «▣ ASDI»
// ════════════════════════════════════════════════════════════════════════════════════
const ESQUEMA = [
  { t: 'Zona del Interior', d: 'producción y acumulación' },
  { t: 'Base Logística', d: 'relaciona la ZI con la ZE' },
  { t: 'Zona de Etapas', d: 'Sección Base → Sección Avanzada (una por CE)' },
  { t: 'ARCE', d: 'Cuerpo de Ejército · 9-12 km² · ≥ 25 km', marca: true },
  { t: 'ASDI', d: 'División (Bat. Log.) · 6-9 km² · ≥ 12 km', marca: true },
  { t: 'Áreas de trenes', d: 'Regimiento / Batallón · 1-2 km² · ≥ 5 km' },
  { t: 'LC / LPR', d: 'las tropas en contacto' },
]
function Esquema() {
  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 3 }, 'aria-label': 'Esquema en profundidad del apoyo logístico' },
    h('div', { style: E.sub }, 'De atrás (retaguardia) hacia adelante (el frente) — el abastecimiento sube, la evacuación baja'),
    ESQUEMA.map((x, i) =>
      h(
        'div',
        { key: i, style: { display: 'flex', alignItems: 'center', gap: 6 } },
        h('span', { style: { color: '#7f8ea6', width: 14, textAlign: 'center' } }, i ? '↓' : ''),
        h('div', { style: { flex: 1, background: x.marca ? 'rgba(251,191,36,0.16)' : 'rgba(255,255,255,0.05)', border: `1px solid ${x.marca ? AMBAR : 'rgba(255,255,255,0.15)'}`, borderRadius: 6, padding: '4px 7px' } }, h('b', { style: { color: x.marca ? AMBAR : '#dfeaf3' } }, x.t), h('span', { style: { color: '#9fb0c8', fontSize: 10.5 } }, ` — ${x.d}`)),
      ),
    ),
  )
}

function Datos() {
  return h(
    'div',
    { style: E.tarjeta },
    h('b', { style: { color: AMBAR } }, 'DATOS GENERALES DE PLANEAMIENTO LOGÍSTICO'),
    h('table', { style: E.tabla }, h('tbody', null,
      h('tr', null, h('th', { style: E.th, colSpan: 2 }, 'Tamaño de un área de apoyo logístico')),
      TAMANO.map((x) => h('tr', { key: x.id }, h('td', { style: E.td }, x.nom), h('td', { style: { ...E.td, textAlign: 'center', whiteSpace: 'nowrap' } }, x.nota))),
      h('tr', null, h('th', { style: E.th, colSpan: 2 }, 'Distancia de seguridad')),
      SEGURIDAD.map((x) => h('tr', { key: x.id }, h('td', { style: E.td }, x.nom), h('td', { style: { ...E.td, textAlign: 'center', whiteSpace: 'nowrap' } }, x.nota))),
      h('tr', null, h('td', { style: { ...E.td, fontSize: 10.5, color: '#9fb0c8' }, colSpan: 2 }, OBS_SEGURIDAD)),
      h('tr', null, h('th', { style: E.th, colSpan: 2 }, 'Tonelaje mínimo/día para los ejes de abastecimiento — valor Batallón')),
      TONELAJE_BATALLON.map((x) => h('tr', { key: x.id }, h('td', { style: E.td }, x.nom), h('td', { style: { ...E.td, textAlign: 'center' } }, `${x.t} t`))),
      h('tr', null, h('th', { style: E.th, colSpan: 2 }, 'Tonelaje mínimo/día — valor División')),
      TONELAJE_DIVISION.map((x) => h('tr', { key: x.id }, h('td', { style: E.td }, x.nom), h('td', { style: { ...E.td, textAlign: 'center' } }, `${x.t} t`))),
    )),
    h('div', { style: E.fuente }, FUENTE_DATOS),
  )
}

const marcaFuente = { calco: '🧮', oficial: '👤', ia: '🤖' }
const tituloFuente = { calco: 'medido en el calco', oficial: 'lo decidió el oficial', ia: 'propuesto por la IA (revisar)' }

export function PasoAPaso({ hojas = {}, onHojas, onExpediente, ctxDoc = {}, orden = {}, onSeleccionarArea = null }) {
  const calco = useCalco()
  const ev = normalizarEval(hojas?.[CLAVE_EVAL])
  const an = analizarCalco(calco, ev.parametros)
  const areas = an.areas
  const zonas = calco.ops?.zonasLog || []
  const propuestas = zonas.map((z, i) => ({ z, i })).filter(({ z }) => z.propuesta)
  const ctx = contexto({ calco, analisis: an, ev, hojas, ctxDoc, orden })
  const resumen = resumenEval(ev, areas, an.sugerencias)
  const elegida = areas.find((a) => a.clave === ev.elegida && zonas[a.idx]?.elegida)
  const sinEvaluar = resumen.reduce((s, r) => s + r.sin, 0)
  const pasoInicial = !propuestas.length ? 1 : areas.some((a) => a.seguridad?.ok == null) ? 3 : !elegida ? 4 : 5
  const [abierto, setAbierto] = useState(pasoInicial)
  const [pendiente, setPendiente] = useState(null)
  const [msg, setMsg] = useState(null)
  const [aspecto, setAspecto] = useState(null)
  const [verMedidas, setVerMedidas] = useState(medidasVisibles())
  const nivelPorDefecto = /\bCE\b|CUERPO/i.test(unidadDe(ctx)) ? 'arce' : 'asdi'
  const [nivel, setNivel] = useState(nivelPorDefecto)
  const guardar = (nv) => onHojas?.({ ...(hojas || {}), [CLAVE_EVAL]: normalizarEval(nv) })

  // El área que se acaba de trazar recibe su letra.
  const nZonas = zonas.length
  useEffect(() => {
    if (!pendiente) return
    if (nZonas > pendiente.n) {
      accion('ajustarZona')?.(nZonas - 1, { propuesta: pendiente.letra })
      setMsg({ tipo: 'ok', txt: `▣ Área ${pendiente.letra} trazada. ${pendiente.letra === 'A' ? 'Trazá la B para poder compararlas.' : 'Pasá al paso 3: la Mesa ya la midió.'}` })
      setPendiente(null)
    } else if (calco.herramienta !== 'zonalog' && pendiente.activo) setPendiente(null)
    else if (calco.herramienta === 'zonalog' && !pendiente.activo) setPendiente({ ...pendiente, activo: true })
  }, [nZonas, calco.herramienta, pendiente])
  // Al cambiar el calco, las medidas dibujadas se rehacen.
  useEffect(() => {
    if (verMedidas) mostrarMedidas(an)
  }, [verMedidas, JSON.stringify(areas.map((a) => [a.clave, a.km2, a.seguridad?.km]))])

  const proximaLetra = LETRAS.split('').find((l) => !propuestas.some(({ z }) => z.propuesta === l)) || ''
  const trazar = (letra) => {
    if (!accion('herramienta')) return setMsg({ tipo: 'err', txt: 'Esta versión de la Mesa no deja trazar desde acá: usá «▣ Trazar el ASDI» de abajo.' })
    accion('zonaLogTipo')?.(nivel)
    accion('herramienta')('zonalog')
    setPendiente({ letra, n: nZonas, activo: false })
    setMsg({ tipo: 'aviso', txt: `Marcá el Área ${letra} sobre el terreno: clic = vértice; cerrá con doble clic, Enter, clic en el primer vértice o «✓ Cerrar el área».` })
  }
  const etiquetar = (i, letra) => accion('ajustarZona')?.(i, { propuesta: letra || '', elegida: false })

  const elegir = (a) => {
    for (const { z, i } of propuestas) if (z.zona === a.zona) accion('ajustarZona')?.(i, { elegida: i === a.idx })
    guardar({ ...ev, elegida: a.clave })
    onSeleccionarArea?.(a.idx)
    setMsg({ tipo: 'ok', txt: `✔ ${a.nombre} elegida: en la carta queda como ${a.zona === 'arce' ? 'ÁREA RET. AG. CE.' : 'ÁREA SERV. DIV.'} (las otras siguen como propuestas, con línea discontinua). Ahora desplegá el Batallón Logístico abajo (plantilla de las cinco compañías) y adaptalo al terreno.` })
  }
  const quitarDescartadas = () => {
    const quitar = propuestas.filter(({ z }) => !z.elegida && z.zona === zonas[elegida?.idx]?.zona)
    if (!quitar.length) return
    if (!window.confirm(`¿Quitar del calco ${quitar.map(({ z }) => `el Área ${z.propuesta}`).join(', ')}? La evaluación queda guardada.`)) return
    const claves = new Set(quitar.map(({ z, i }) => z.clave || `${z.zona}-${i}`))
    accion('setOps')?.((o) => ({ ...o, zonasLog: (o.zonasLog || []).filter((z, i) => !claves.has(z.clave || `${z.zona}-${i}`)), magnitudes: (o.magnitudes || []).filter((m) => ![...claves].some((c) => m.origen === `zona-${c}`)) }))
    setMsg({ tipo: 'ok', txt: 'Áreas descartadas quitadas del calco.' })
  }

  // ── IA de la evaluación ──
  const Panel = panelIA()
  const onPedido = async (modo) => pedidoEval(ev, { analisis: an, expediente: await expedienteDe(onExpediente), ctx, modo, encabezado: encabezadoIA() })
  const onAplicar = (texto, modo) => {
    const r = aplicarRespuestaEval(texto, ev, { analisis: an, modo, corregir: corregirIA() })
    if (!r.ok) return r
    guardar(r.valor)
    return { ok: true, msg: r.msg }
  }
  const wordEval = () => {
    const nombre = 'G4_Evaluacion_de_las_areas_propuestas.docx'
    descargar(crearWordEvaluacion(ev, an, { ctx }), nombre)
    return `✓ Word descargado: ${nombre}`
  }

  const P = (k, v) => guardar({ ...ev, parametros: { ...ev.parametros, [k]: v === '' ? '' : Number(v) } })
  const conteo = { ...batallonesDelCalco(calco.unidades), ...ev.tropas }
  const ton = tonelaje(conteo)
  const div = TONELAJE_DIVISION.find((x) => x.id === ev.tipoDivision)
  const autoConc = conclusionAuto(ev, areas, an.sugerencias, ctx)
  const mejor = mejorArea(ev, areas, an.sugerencias)
  const estadoCelda = (c) => (c.estado === 'si' ? { bg: '#e01b1b', fg: '#fff', t: '✔' } : c.estado === 'no' ? { bg: '#f4f4f4', fg: '#333', t: '' } : { bg: 'transparent', fg: '#8fa2bd', t: '?' })
  const ok = (b) => (b === true ? h('span', { style: { color: '#7dffb0', fontWeight: 700 } }, '✓ ') : b === false ? h('span', { style: { color: '#ff7a7a', fontWeight: 700 } }, '✗ ') : '')

  return h(
    'div',
    { style: E.raiz, 'data-g4': 'paso-a-paso' },
    h('div', { style: { ...E.aviso, color: '#ffe3a0' } }, h('b', null, '🧭 Construí el área de apoyo logístico paso a paso. '), 'Cada paso usa lo que ya está en el calco y lo que resolvés vuelve al calco (las áreas, las medidas, el área elegida) y a tus hojas (la Apreciación F1·P3 y la Matriz de sincronización F7·P2).'),
    h(Msg, { msg }),

    // ── 1 · Entender ──
    h(
      Paso,
      { n: 1, titulo: 'Entender: ASDI, ARCE y el esquema en profundidad', estado: 'leé esto primero', abierto: abierto === 1, onAbrir: () => setAbierto(abierto === 1 ? 0 : 1) },
      h(Esquema),
      ENTENDER.map((t) => h('div', { key: t.id, style: E.tarjeta }, h('b', { style: { color: AMBAR } }, t.titulo), h('div', { style: { fontSize: 11.5, lineHeight: 1.45 } }, t.texto), h('div', { style: E.fuente }, t.fuente))),
      h('button', { style: E.btnPrin, onClick: () => setAbierto(2) }, 'Entendido → proponer las áreas'),
    ),

    // ── 2 · Proponer ──
    h(
      Paso,
      { n: 2, titulo: 'Proponer las áreas posibles (A, B…) sobre el terreno', estado: propuestas.length ? `${propuestas.length} propuesta(s)` : 'ninguna todavía', abierto: abierto === 2, onAbrir: () => setAbierto(abierto === 2 ? 0 : 2) },
      h('div', { style: E.ayuda }, 'Mirá la carta y buscá dos o tres lugares donde podría ir el área: cerca de una buena ruta (el futuro EPA), detrás de la tropa que apoyás, con cubiertas, agua y suelo firme, lejos de los flancos y fuera del alcance de la artillería enemiga. Trazá cada una como un polígono. Todavía no se decide nada: después se comparan.'),
      h('div', { style: E.sub }, '¿Qué área estás eligiendo?'),
      h(
        'div',
        { style: E.fila },
        h('button', { style: { ...E.chip, ...(nivel === 'asdi' ? E.chipOn : {}) }, onClick: () => setNivel('asdi') }, 'ASDI — soy G-4 de una División'),
        h('button', { style: { ...E.chip, ...(nivel === 'arce' ? E.chipOn : {}) }, onClick: () => setNivel('arce') }, 'ARCE — soy G-4 de un Cuerpo de Ejército'),
      ),
      h('div', { style: E.ayuda }, nivel === 'asdi' ? 'Cada área: 6 a 9 km², a 12 km o más de la LC/LPR. El ARCE lo fija el CE: si lo tenés, trazalo como referencia (sin letra) y la Mesa mide la distancia de cada propuesta al escalón superior.' : 'Cada área: 9 a 12 km², a 25 km o más de la LC/LPR.'),
      h(
        'div',
        { style: E.fila },
        proximaLetra && h('button', { style: E.btnPrin, disabled: !!pendiente, onClick: () => trazar(proximaLetra) }, pendiente ? `⏳ Trazando el Área ${pendiente.letra}…` : `▣ Trazar el Área ${proximaLetra}`),
        nivel === 'asdi' && h('button', { style: E.btn, onClick: () => { accion('zonaLogTipo')?.('arce'); accion('herramienta')?.('zonalog'); setPendiente(null); setMsg({ tipo: 'aviso', txt: 'Marcá el ARCE (referencia del escalón superior) y cerralo.' }) } }, '▣ Trazar el ARCE (referencia)'),
      ),
      calco.herramienta === 'zonalog' &&
        h('div', { style: E.fila }, h('button', { style: E.btn, onClick: () => window.dispatchEvent(new Event('sideceme:cerrar-zonalog')) }, '✓ Cerrar el área'), h('button', { style: E.btn, onClick: () => (accion('herramienta')?.(null), setPendiente(null)) }, '✕ Cancelar el trazado')),
      zonas.some((z) => ['asdi', 'arce'].includes(z.zona)) &&
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
          h('div', { style: E.sub }, 'Áreas en el calco'),
          zonas.map((z, i) =>
            ['asdi', 'arce'].includes(z.zona)
              ? h(
                  'div',
                  { key: z.clave || i, style: { ...E.fila, background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '4px 6px' } },
                  h('span', { style: { flex: '1 1 120px' } }, h('b', null, z.propuesta ? `Área ${z.propuesta}` : nombreArea(z, i)), ` · ${String(z.zona).toUpperCase()}${z.elegida ? ' · ✔ elegida' : z.propuesta ? ' · propuesta' : ''}`),
                  h('select', { style: { ...E.campo, width: 'auto' }, value: z.propuesta || '', 'aria-label': 'Letra de la propuesta', onChange: (e) => etiquetar(i, e.target.value) }, h('option', { value: '' }, 'sin letra (referencia)'), LETRAS.split('').slice(0, 5).map((l) => h('option', { key: l, value: l }, `Área ${l}`))),
                  h('button', { style: E.btnChico, onClick: () => verEnCarta([z.coords]) }, '📍 Ver'),
                )
              : null,
          ),
        ),
      propuestas.length >= 1 && h('button', { style: E.btnPrin, onClick: () => setAbierto(3) }, 'Listo → verificar los datos generales'),
    ),

    // ── 3 · Verificar ──
    h(
      Paso,
      { n: 3, titulo: 'Verificar los datos generales de planeamiento', estado: !areas.length ? 'sin áreas' : areas.some((a) => a.seguridad?.ok === false || a.dma?.ok === false) ? '✗ hay un impositivo que no cumple' : '✓ medido', abierto: abierto === 3, onAbrir: () => setAbierto(abierto === 3 ? 0 : 3) },
      h('div', { style: E.ayuda }, 'La Mesa mide cada área en el calco y la compara con la norma de la Escuela. Lo IMPOSITIVO (distancia de seguridad y distancia máxima de apoyo) descarta el área que no cumple.'),
      !areas.length && h('div', { style: E.aviso }, 'Todavía no hay áreas para medir: trazá al menos una en el paso 2.'),
      !an.frente && areas.length > 0 && h('div', { style: E.aviso }, 'No hay Área de Operaciones ni fichas enemigas: no hay desde dónde medir la distancia de seguridad. Trazá el AO (▧ Área de Ops — el primer lado que trazás ES el frente).'),
      an.frente && h('div', { style: E.ayuda }, `Distancia de seguridad medida desde ${an.frente.fuente}.`),
      areas.length > 0 &&
        h('div', { style: { overflowX: 'auto' } }, h('table', { style: E.tabla, 'data-g4': 'verificacion' }, h('tbody', null,
          h('tr', null, h('th', { style: E.th }, ''), areas.map((a) => h('th', { key: a.clave, style: E.th }, a.nombre))),
          h('tr', null, h('td', { style: E.td }, h('b', null, 'Tamaño'), h('br'), h('span', { style: E.fuente }, areas[0].tamano.norma)), areas.map((a) => h('td', { key: a.clave, style: E.td }, ok(a.tamano.ok), fmtKm2(a.km2), a.tamano.chica ? ' — chica' : a.tamano.grande ? ' — grande' : ''))),
          h('tr', null, h('td', { style: E.td }, h('b', null, 'Distancia de seguridad'), h('br'), h('span', { style: E.fuente }, `mínimo ${areas[0].seguridad.min} km · impositivo`)), areas.map((a) => h('td', { key: a.clave, style: E.td }, ok(a.seguridad.ok), Number.isFinite(a.seguridad.km) ? `${fmtKm(a.seguridad.km)} de la ${a.seguridad.ref}` : '—'))),
          h('tr', null, h('td', { style: E.td }, h('b', null, 'Distancia máxima de apoyo'), h('br'), h('span', { style: E.fuente }, an.dma.ok ? `DMA ${fmtKm(an.dma.km, 0)} · impositivo` : '')), areas.map((a) => h('td', { key: a.clave, style: E.td }, ok(a.dma.ok), a.dma.ok != null ? `${a.dma.lejano}: ≈ ${fmtKm(a.dma.carretera)} por carretera` : '—'))),
          h('tr', null, h('td', { style: E.td }, h('b', null, 'EPA')), areas.map((a) => h('td', { key: a.clave, style: E.td }, a.epa ? (a.epa.toca ? '✓ llega al área' : `a ${fmtKm(a.epa.km)}`) : 'sin EPA'))),
          h('tr', null, h('td', { style: E.td }, h('b', null, 'Ficha enemiga más cercana')), areas.map((a) => h('td', { key: a.clave, style: E.td }, a.enemigo ? `${a.enemigo.nombre}: ${fmtKm(a.enemigo.km)}` : '—'))),
        ))),
      h('div', { style: E.sub }, 'Distancia máxima de apoyo — DMA = (TD − TC) × V / 2'),
      h(
        'div',
        { style: E.fila },
        h('label', null, 'TD ', h('input', { style: E.num, type: 'number', value: ev.parametros.td, onChange: (e) => P('td', e.target.value) }), ' h'),
        h('label', null, 'TC ', h('input', { style: E.num, type: 'number', value: ev.parametros.tc, onChange: (e) => P('tc', e.target.value) }), ' h'),
        h('label', null, 'V ', h('input', { style: E.num, type: 'number', value: ev.parametros.v, onChange: (e) => P('v', e.target.value) }), ' km/h'),
        h('label', { title: 'La Mesa no tiene la red vial: la distancia por carretera se estima con la línea recta por este factor. Medila en la carta.' }, 'carretera ≈ recta × ', h('input', { style: E.num, type: 'number', step: '0.1', value: ev.parametros.factor, onChange: (e) => P('factor', e.target.value) })),
      ),
      h('div', { style: E.ayuda }, an.dma.ok ? an.dma.texto : an.dma.error, '. ', DMA_NOTA),
      h('div', { style: E.sub }, 'Tonelaje que tiene que soportar el EPA (t/día)'),
      h(
        'div',
        { style: E.fila },
        TONELAJE_BATALLON.map((x) => h('label', { key: x.id, style: { fontSize: 11 } }, `${x.nom.replace('Tropas ', '')} `, h('input', { style: { ...E.num, width: 44 }, type: 'number', min: 0, value: conteo[x.id] ?? 0, onChange: (e) => guardar({ ...ev, tropas: { ...ev.tropas, [x.id]: e.target.value === '' ? 0 : Number(e.target.value) } }) }))),
      ),
      h('div', { style: E.ayuda }, ton.total ? `Valor batallón: ${ton.texto}.` : 'Poné cuántos batallones (o regimientos, que en el cuadro valen un batallón) apoya el EPA; la Mesa propone los del calco.', ' ', 'Valor División: ', h('select', { style: { ...E.campo, width: 'auto' }, value: ev.tipoDivision, onChange: (e) => guardar({ ...ev, tipoDivision: e.target.value }) }, h('option', { value: '' }, '— tipo de División —'), TONELAJE_DIVISION.map((x) => h('option', { key: x.id, value: x.id }, x.nom))), div ? ` → ${div.t} t/día como mínimo.` : ''),
      h(
        'div',
        { style: E.fila },
        h('button', {
          style: E.btnPrin,
          disabled: !areas.length,
          onClick: () => {
            if (verMedidas) {
              ocultarMedidas()
              setVerMedidas(false)
              return
            }
            const ok = mostrarMedidas(an)
            setVerMedidas(ok)
            setMsg(ok ? { tipo: 'ok', txt: '🗺️ Medidas acostadas en la carta: la línea de la distancia de seguridad mínima, la menor distancia de cada área al frente y el anillo de la DMA.' } : { tipo: 'aviso', txt: 'Las medidas se dibujan en la carta 2D: volvé a la vista 2D.' })
          },
        }, verMedidas ? '🙈 Quitar las medidas de la carta' : '🗺️ Acostar las medidas en la carta'),
      ),
      h('div', { style: E.ayuda }, 'Dibuja en la carta la línea de la distancia de seguridad mínima, la menor distancia de cada área al frente (verde cumple, rojo no) y el anillo de la DMA de cada área.'),
      h('details', null, h('summary', { style: { cursor: 'pointer', color: AMBAR, fontSize: 11.5 } }, '📊 Datos generales de planeamiento logístico (la lámina)'), h(Datos)),
      areas.length > 0 && h('button', { style: E.btnPrin, onClick: () => setAbierto(4) }, 'Siguiente → evaluar las áreas'),
    ),

    // ── 4 · Evaluar ──
    h(
      Paso,
      { n: 4, titulo: 'Evaluar las áreas propuestas (factores de la Escuela)', estado: !areas.length ? 'sin áreas' : sinEvaluar ? `${sinEvaluar} casilla(s) sin evaluar` : '✓ completa', abierto: abierto === 4, onAbrir: () => setAbierto(abierto === 4 ? 0 : 4) },
      h('div', { style: E.ayuda }, 'Tocá una casilla para decidir: ', h('b', { style: { color: '#ff8a8a' } }, 'roja ✔ = el área REÚNE el aspecto'), ', blanca = no lo reúne; un tercer toque la devuelve a lo que midió la Mesa. 🧮 medido en el calco · 👤 lo decidiste vos · 🤖 lo propuso la IA. Tocá el nombre del aspecto para ver qué significa y por qué.'),
      areas.length > 0 &&
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: 6 }, 'data-g4': 'matriz-evaluacion' },
          FACTORES.map((f) =>
            h(
              'div',
              { key: f.id, style: { border: `1px solid ${f.color}66`, borderRadius: 7, overflow: 'hidden' } },
              h('div', { style: { background: f.color, color: '#111', fontWeight: 700, fontSize: 11.5, padding: '3px 7px', display: 'flex' } }, h('span', { style: { flex: 1 } }, f.nom), areas.map((a) => h('span', { key: a.clave, style: { width: 46, textAlign: 'center', fontSize: 10.5 } }, a.propuesta || a.nombre.slice(0, 6)))),
              f.aspectos.map((asp) => {
                const abiertoAsp = aspecto === asp.id
                return h(
                  'div',
                  { key: asp.id, style: { borderTop: '1px solid rgba(255,255,255,0.08)' } },
                  h(
                    'div',
                    { style: { display: 'flex', alignItems: 'stretch' } },
                    h('button', { style: { flex: 1, background: 'transparent', color: '#dfeaf3', border: 'none', textAlign: 'left', padding: '4px 7px', cursor: 'pointer', fontSize: 11.5 }, onClick: () => setAspecto(abiertoAsp ? null : asp.id) }, asp.grupo ? h('span', { style: { color: '#8fa2bd', fontSize: 10 } }, `${f.grupos.find((g) => g.id === asp.grupo)?.nom} · `) : null, asp.nom, asp.impositivo ? h('b', { style: { color: '#ff9a9a' } }, ' (impositivo)') : null),
                    areas.map((a) => {
                      const c = celdaEval(ev, an.sugerencias, asp.id, a.clave)
                      const s = estadoCelda(c)
                      return h('button', { key: a.clave, 'data-celda': `${asp.id}|${a.propuesta || a.clave}`, title: `${a.nombre}: ${c.estado === 'si' ? 'reúne' : c.estado === 'no' ? 'no reúne' : 'sin evaluar'}${c.fuente ? ` — ${tituloFuente[c.fuente]}` : ''}${c.motivo ? `. ${c.motivo}` : ''}`, style: { width: 46, border: 'none', borderLeft: '1px solid rgba(255,255,255,0.12)', background: s.bg, color: s.fg, cursor: 'pointer', fontSize: 11, fontWeight: 700 }, onClick: () => guardar(ciclarCelda(ev, an.sugerencias, asp.id, a.clave)) }, s.t, h('span', { style: { fontSize: 9, marginLeft: 2 } }, marcaFuente[c.fuente] || ''))
                    }),
                  ),
                  abiertoAsp &&
                    h(
                      'div',
                      { style: { background: 'rgba(0,0,0,0.3)', padding: '5px 8px', display: 'flex', flexDirection: 'column', gap: 4 } },
                      h('div', { style: E.ayuda }, asp.def),
                      areas.map((a) => {
                        const c = celdaEval(ev, an.sugerencias, asp.id, a.clave)
                        return h(
                          'div',
                          { key: a.clave, style: { fontSize: 11, lineHeight: 1.4 } },
                          h('b', null, `${a.nombre}: `),
                          c.estado === 'si' ? 'reúne' : c.estado === 'no' ? 'no reúne' : 'sin evaluar',
                          c.fuente ? ` (${tituloFuente[c.fuente]}${c.regla ? ` — ${REGLAS[c.regla]}` : ''})` : '',
                          c.motivo ? `. ${c.motivo}` : '',
                          c.fuente !== 'calco' && c.sugerida ? h('span', { style: { color: '#8fa2bd' } }, ` · la Mesa midió: ${c.sugerida.estado === 'si' ? 'reúne' : 'no reúne'} — ${c.sugerida.motivo}`) : null,
                          h('span', { style: { marginLeft: 6 } }, h('button', { style: E.btnChico, onClick: () => guardar(fijarCelda(ev, asp.id, a.clave, 'si')) }, '✔ reúne'), ' ', h('button', { style: E.btnChico, onClick: () => guardar(fijarCelda(ev, asp.id, a.clave, 'no')) }, 'no reúne'), ' ', h('button', { style: E.btnChico, onClick: () => guardar(fijarCelda(ev, asp.id, a.clave, '')) }, '↺')),
                        )
                      }),
                    ),
                )
              }),
            ),
          ),
          h('div', { style: E.fuente }, FUENTE_FACTORES),
          h('div', { style: E.fila }, resumen.map((r) => h('span', { key: r.clave, style: { ...E.chip, cursor: 'default', borderColor: r.descartada ? '#ff7a7a' : '#34405a' } }, `${r.nombre}: ${r.si} ✔ · ${r.no} ✗ · ${r.sin} ?${r.descartada ? ' · DESCARTADA' : ''}`))),
        ),
      h('div', { style: E.sub }, '💡 Qué área preferís y por qué (tus ideas — van a la IA)'),
      h('textarea', { style: E.area, rows: filasDe(ev.ideas, 2), value: ev.ideas, placeholder: 'Ej.: «Prefiero la A porque queda sobre la ruta 1 y detrás del RI-1, pero me preocupa el río que la corta» · «La B tiene la estancia que sirve de depósito».', onChange: (e) => guardar({ ...ev, ideas: e.target.value }) }),
      Panel && areas.length > 0 && h(Panel, { titulo: '🤖 Evaluar las áreas con IA', nota: 'Le manda el expediente entero, lo que midió la Mesa en el calco (km², distancia de seguridad, DMA, EPA, tropa amiga, flancos), los factores de la Escuela, lo que ya decidiste y TUS IDEAS. Devuelve cada aspecto con su motivo concreto y la conclusión. Nunca cambia lo que decidiste vos ni lo impositivo medido.', color: AMBAR, modos: MODOS, onPedido, onAplicar }),
      areas.length > 0 && h('div', { style: E.sub }, 'Conclusión'),
      areas.length > 0 && h('textarea', { style: E.area, rows: filasDe(ev.conclusion || autoConc, 3), value: ev.conclusion, placeholder: autoConc || EJEMPLO_CONCLUSION, onChange: (e) => guardar({ ...ev, conclusion: e.target.value, conclusionIA: false }), 'aria-label': 'Conclusión de la evaluación' }),
      areas.length > 0 && h('div', { style: E.ayuda }, ev.conclusion ? h('span', null, ev.conclusionIA ? '🤖 La escribió la IA: revisala. ' : 'La escribiste vos. ', h('button', { style: E.btnChico, onClick: () => guardar({ ...ev, conclusion: '', conclusionIA: false }) }, '↺ Volver a la que arma la Mesa')) : 'Vacía = la arma la Mesa con la matriz (se ve en gris). Escribí encima para corregirla.'),
      areas.length > 0 && h('div', { style: E.fila }, h('button', { style: E.btn, onClick: () => previaDocx('Evaluación de las áreas propuestas', crearWordEvaluacion(ev, an, { ctx }), 'G4_Evaluacion_de_las_areas_propuestas.docx', '') }, '👁️ Vista previa'), h('button', { style: E.btnPrin, onClick: () => setMsg({ tipo: 'ok', txt: wordEval() }) }, '📄 Evaluación (Word)')),
      areas.length > 0 && h('button', { style: E.btnPrin, onClick: () => setAbierto(5) }, 'Siguiente → elegir y acostar'),
    ),

    // ── 5 · Elegir y acostar ──
    h(
      Paso,
      { n: 5, titulo: 'Elegir el área y desplegar el Batallón Logístico', estado: elegida ? `✔ ${elegida.nombre}` : 'sin elegir', abierto: abierto === 5, onAbrir: () => setAbierto(abierto === 5 ? 0 : 5) },
      !areas.length && h('div', { style: E.aviso }, 'Primero trazá y evaluá las áreas.'),
      mejor && !elegida && h('div', { style: E.ok }, `Según la matriz, el ${mejor.nombre} tiene ventaja (${mejor.si} aspectos favorables).`),
      areas.map((a) => {
        const r = resumen.find((x) => x.clave === a.clave)
        return h(
          'div',
          { key: a.clave, style: { ...E.tarjeta, borderColor: elegida?.clave === a.clave ? AMBAR : r?.descartada ? '#6b2f35' : 'rgba(251,191,36,0.28)' } },
          h('b', null, `${a.nombre}${elegida?.clave === a.clave ? ' — ✔ ELEGIDA' : ''}`),
          h('div', { style: E.ayuda }, `${a.tamano.txt}. Seguridad: ${a.seguridad.txt}. ${a.dma.txt}.`),
          r?.descartada && h('div', { style: E.err }, `No cumple lo impositivo: ${r.impositivosNo.join(', ')}.`),
          h('div', { style: E.fila }, a.propuesta && h('button', { style: E.btnPrin, disabled: elegida?.clave === a.clave, onClick: () => elegir(a) }, elegida?.clave === a.clave ? '✔ Elegida' : `✔ Elegir el ${a.nombre}`), h('button', { style: E.btn, onClick: () => verEnCarta([a.coords]) }, '📍 Ver en la carta')),
        )
      }),
      elegida && propuestas.some(({ z }) => !z.elegida && z.zona === zonas[elegida.idx]?.zona) && h('button', { style: E.btn, onClick: quitarDescartadas }, '🗑 Quitar del calco las áreas no elegidas'),
      elegida && h('div', { style: E.ok }, '👇 Abajo: elegí esta área en «Área sobre la que desplegar», marcá hacia dónde está el frente y desplegá las compañías del Batallón Logístico. Después adaptá cada puesto al terreno (se arrastran). Con «Desplegar el esquema en profundidad» salen también el Área de Trenes adelante y el ARCE atrás.'),
      h('div', { style: E.ayuda }, 'La evaluación, la conclusión y el área elegida entran solas en la Apreciación de Logística (📋 Mis hojas → F1·P3, «🌱 Traer…») y en la Matriz de sincronización logística (F7·P2).'),
    ),
  )
}

// ════════════════════════════════════════════════════════════════════════════════════
// HOJAS — Apreciación de Situación de Logística y Matriz de Sincronización
// ════════════════════════════════════════════════════════════════════════════════════
export default function EditorHojaLog(props) {
  if (props?.hoja?.tipo === 'matrizLog') return h(EditorMatriz, props)
  return h(EditorASL, props)
}

function BloqueAcostar({ calco, verEje = true }) {
  const ops = calco.ops || {}
  const areas = (ops.zonasLog || []).filter((z) => ['asdi', 'arce'].includes(z.zona) && (!z.propuesta || z.elegida))
  const epa = (ops.ejesLog || []).filter((e) => e.tipo === 'epa')
  const epe = (ops.ejesLog || []).filter((e) => e.tipo === 'epe')
  const herr = (t) => accion('herramienta')?.(t)
  const todo = [...areas.map((z) => z.coords), ...(ops.ejesLog || []).map((e) => e.coords)]
  return h(
    'div',
    { style: E.caja, 'data-g4': 'acostar' },
    h('div', { style: E.sub }, '🗺️ En el calco (lo que esta hoja toma y lo que le falta)'),
    h('div', { style: E.ayuda }, `${areas.length ? `✓ ${areas.length} área(s) de apoyo logístico` : '✗ sin área elegida'} · ${epa.length ? `✓ ${epa.length} EPA` : '✗ sin EPA'} · ${epe.length ? `✓ ${epe.length} EPE` : '✗ sin EPE'} · ${(calco.unidades || []).filter((u) => u.tipo === 'instalacion').length} instalación(es)`),
    h(
      'div',
      { style: E.fila },
      todo.length > 0 && h('button', { style: E.btn, onClick: () => verEnCarta(todo) }, '📍 Ver en la carta'),
      verEje && h('button', { style: E.btn, onClick: () => herr('epa') }, '↔ Trazar el EPA'),
      verEje && h('button', { style: E.btn, onClick: () => herr('epe') }, '↔ Trazar el EPE'),
    ),
    !areas.length && h('div', { style: E.ayuda }, 'El área se propone, se evalúa y se elige en la pestaña «▣ ASDI» (paso a paso).'),
  )
}

function Revision({ items }) {
  const [ver, setVer] = useState(false)
  const errores = items.filter((x) => x.tipo === 'err').length
  return h(
    'div',
    { style: E.caja },
    h('div', { style: { ...E.fila, justifyContent: 'space-between' } }, h('div', { style: E.sub }, items.length ? `Para que quede completa: ${items.length} pendiente(s)${errores ? ` · ${errores} importante(s)` : ''}` : '✓ Tiene todos sus apartados'), items.length > 0 && h('button', { style: E.btnChico, onClick: () => setVer(!ver) }, ver ? '▾ Ocultar' : '▸ Ver')),
    ver && items.map((x, i) => h('div', { key: i, style: x.tipo === 'err' ? E.err : E.aviso }, x.txt)),
  )
}

// ─── APRECIACIÓN DE SITUACIÓN DE LOGÍSTICA (F1·P3 / F2·P13) ─────────────────────────
function EditorASL({ hoja = null, valor, onValor, hojas = {}, onExpediente = null, ctxDoc = {} }) {
  const calco = useCalco()
  const v = normalizarASL(valor)
  const ev = normalizarEval(hojas?.[CLAVE_EVAL])
  const an = analizarCalco(calco, ev.parametros)
  const ctx = contexto({ calco, analisis: an, ev, hojas, ctxDoc })
  const [msg, setMsg] = useState(null)
  const ia = new Set(v.iaCampos)
  const titulo = `${hoja?.num || 'F1·P3'} ${TITULO_ASL}${hoja?.id === 'aprecOrientacion' ? ' (actualizada)' : ''}`
  const nombre = `${String(hoja?.num || 'F1P3').replace(/[^A-Za-z0-9]+/g, '')}_Apreciacion_de_Logistica`
  const guardar = (nv) => onValor?.(normalizarASL(nv))
  const setC = (k, x) => guardar({ ...v, campos: { ...v.campos, [k]: x } })
  const revisado = (k) => guardar({ ...v, iaCampos: v.iaCampos.filter((x) => x !== k) })
  const setCap = (id, cambios) => guardar({ ...v, caps: v.caps.map((c) => (c.id === id ? { ...c, ...cambios } : c)) })
  const ctxWord = { ...ctxDoc, g: 'g4', seccion: 'E. M. G-4', firma: 'EL G-4' }
  const registro = () => registroMilitar()?.(hoja || { id: 'aprecActiva', num: 'F1·P3' }, ctxWord) || null
  const word = async () => {
    const W = wordMilitar()
    if (!W) return 'El formato militar no está disponible en esta versión de la Mesa.'
    try {
      const r = await W(especificacionASL(v, { ctx }), nombre, { ctx: ctxWord, registro: registro() })
      return r ? `✓ Word descargado: ${nombre}.docx` : 'No se descargó el Word.'
    } catch (e) {
      return `No se pudo generar el Word: ${e?.message || e}`
    }
  }
  const verPrevia = async () => {
    const V = vistaMilitar()
    const M = mostrarDocx()
    const bajar = { texto: '📄 Word (formato militar)', principal: true, accion: word }
    if (!V || !M) return abrirVisor({ titulo, html: aslHTML(v, { ctx }), botones: [bajar], aviso: 'Vista aproximada (sin membrete).' })
    try {
      const r = await V(especificacionASL(v, { ctx }), nombre, { ctx: ctxWord, registro: registro() })
      if (r?.blob) abrirVisor({ titulo, dibujar: (host) => M(r.blob, host), botones: [bajar] })
    } catch (e) {
      abrirVisor({ titulo, html: aslHTML(v, { ctx }), botones: [bajar], aviso: `${e?.message || e} — Mientras tanto, la apreciación sin membrete.` })
    }
  }
  const armar = () => {
    const r = armarASL(v, ctx)
    if (!r.cambios.length) return setMsg({ tipo: 'aviso', txt: 'No había nada nuevo que traer (no se pisa lo escrito). Cargá el calco (áreas, ejes, instalaciones), el concepto de apoyo por fase y las otras hojas del G-4, o trabajala con la IA.' })
    guardar(r.valor)
    setMsg({ tipo: 'ok', txt: `🌱 Se trajo: ${r.cambios.join(' · ')}. Revisalo y completá lo que es juicio tuyo (o pedíselo a la IA).` })
  }
  const base = hoja?.id === 'aprecOrientacion' ? hojas?.aprecActiva : null
  const Panel = panelIA()
  const onPedido = async (modo) => pedidoASL(v, { analisis: an, evaluacion: ev, expediente: await expedienteDe(onExpediente), ctx, hoja, modo, encabezado: encabezadoIA() })
  const onAplicar = (texto, modo) => {
    const r = aplicarRespuestaASL(texto, v, { modo, corregir: corregirIA() })
    if (!r.ok) return r
    guardar(r.valor)
    return { ok: true, msg: r.msg }
  }
  const campo = (id, t, num) => h(Texto, { key: id, rot: t, num, valor: v.campos[id], onCambio: (x) => setC(id, x), ia: ia.has(`campo:${id}`), onRevisado: () => revisado(`campo:${id}`) })
  const LET = 'ABCDEFGHIJ'
  const seccion = ([id, t, hs], i) =>
    h(
      'div',
      { key: id, style: E.caja },
      h('div', { style: E.parrafo }, `${id}.- ${t}`),
      hs.flatMap(([cid, ct, sub], j) => {
        if (cid === 'CAPS')
          return v.caps.map((c, k) =>
            h(
              'div',
              { key: c.id, style: E.tarjeta },
              h('div', { style: E.fila }, h('span', { style: E.numRot }, `${LET[j + k]}.-`), h('input', { style: { ...E.campo, flex: 1, fontWeight: 700 }, value: c.nombre, 'aria-label': 'Nombre del curso de acción', onChange: (e) => setCap(c.id, { nombre: e.target.value }) }), v.caps.length > 1 && h('button', { style: E.btnChico, title: 'Quitar este CAP', onClick: () => window.confirm(`¿Quitar el ${c.nombre}?`) && guardar({ ...v, caps: v.caps.filter((x) => x.id !== c.id) }) }, '✕')),
              ANALISIS_CAP.map(([k, kt], m) => h(Texto, { key: k, rot: kt, num: `${m + 1}.-`, min: 1, valor: c.analisis[k], onCambio: (x) => setCap(c.id, { analisis: { ...c.analisis, [k]: x } }), ia: ia.has(`cap:${c.id}:${k}`), onRevisado: () => revisado(`cap:${c.id}:${k}`) })),
            ),
          ).concat([h('button', { key: 'mas', style: E.btnMas, onClick: () => guardar({ ...v, caps: [...v.caps, nuevoCap(v)] }) }, '+ Agregar curso de acción propio')])
        if (cid === 'VENTAJAS')
          return [h('div', { key: cid, style: E.tarjeta }, h('div', { style: E.rot }, h('span', { style: E.numRot }, `${LET[j]}.-`), ct), v.caps.map((c, k) => h('div', { key: c.id }, h('b', { style: { fontSize: 11 } }, `${k + 1}.- ${c.nombre}`), h(Texto, { rot: 'Ventajas.', num: 'a.-', min: 1, valor: c.ventajas, onCambio: (x) => setCap(c.id, { ventajas: x }), ia: ia.has(`cap:${c.id}:ventajas`), onRevisado: () => revisado(`cap:${c.id}:ventajas`) }), h(Texto, { rot: 'Desventajas.', num: 'b.-', min: 1, valor: c.desventajas, onCambio: (x) => setCap(c.id, { desventajas: x }), ia: ia.has(`cap:${c.id}:desventajas`), onRevisado: () => revisado(`cap:${c.id}:desventajas`) }))))]
        if (sub) return [h('div', { key: cid, style: E.tarjeta }, h('div', { style: E.rot }, h('span', { style: E.numRot }, `${LET[j]}.-`), ct), sub.map(([sid, st], k) => campo(sid, st, `${k + 1}.-`)))]
        return [campo(cid, ct, `${LET[j]}.-`)]
      }),
    )
  return h(
    'div',
    { style: E.raiz, 'data-hoja': 'apreciacion-logistica' },
    h('div', { style: E.caja }, h('div', { style: E.sub }, `${titulo} · ${resumenASL(v)}`), h('div', { style: E.fila }, h('button', { style: E.btn, onClick: verPrevia }, '👁️ Vista previa'), h('button', { style: E.btnPrin, onClick: async () => setMsg({ tipo: 'ok', txt: await word() }) }, '📄 Word (formato militar)')), h('div', { style: E.ayuda }, 'Sale con el membrete de los demás documentos de la Mesa: OBJETO, CARTAS y ANEXOS; I.- Misión, II.- Situación y consideraciones logísticas, III.- Análisis (la elección del área y cada CAP), IV.- Comparación y V.- Conclusiones y recomendaciones; firma del G-4.')),
    h(Msg, { msg }),
    base && h('div', { style: E.caja }, h('button', { style: E.btn, onClick: () => (guardar(partirDe(v, base)), setMsg({ tipo: 'ok', txt: '📋 Se copió lo de la F1·P3 en lo que estaba vacío. Ahora actualizala con el análisis de la misión.' })) }, '📋 Partir de la F1·P3 (sin pisar)')),
    h('div', { style: E.caja }, h('div', { style: E.sub }, '1 · Lo que ya tiene el ejercicio'), h('button', { style: E.btn, onClick: armar }, '🌱 Traer del calco y de mis hojas lo que falte'), h('div', { style: E.ayuda }, 'Trae del calco las instalaciones por función, las áreas y los ejes (con sus coordenadas y largos), lo que midió la Mesa y la evaluación de las áreas; de tus hojas del G-4, las tareas (F2·P3), las limitaciones (F2·P5), las suposiciones (F2·P6) y las ventajas y desventajas de cada CAP (F5·P1); del concepto de apoyo, el enfoque y la prioridad por fase. No pisa lo escrito.')),
    h('div', { style: E.caja }, h('div', { style: E.sub }, '2 · 💡 Mis ideas (cómo quiero la apreciación)'), h('textarea', { style: E.area, rows: filasDe(v.ideas, 3), value: v.ideas, placeholder: 'Ej.: «El problema es la Clase III: el EPA mide 120 km» · «Prefiero el CAP 1 porque se apoya desde una sola área» · «Que la evacuación vaya por la ruta 4 y no por el EPA».', onChange: (e) => guardar({ ...v, ideas: e.target.value }) }), h('div', { style: E.ayuda }, 'No se imprime: va al pedido a la IA y la IA lo sigue. También podés escribir directamente en cualquier apartado: lo que escribís vos manda.')),
    Panel && h(Panel, { titulo: '🤖 Trabajar esta hoja con IA', nota: 'Le manda el expediente completo, lo que midió la Mesa en el calco, la evaluación de las áreas, la doctrina de logística de la Escuela, TUS IDEAS y la apreciación como está. Devuelve la apreciación completa, apartado por apartado y por CAP.', color: AMBAR, modos: MODOS, onPedido, onAplicar }),
    h(BloqueAcostar, { calco }),
    h('div', { style: E.caja }, h('div', { style: E.parrafo }, `${TITULO_ASL} No. ${limpio(v.numero) || '01'}`), h('label', null, h('span', { style: E.rot }, 'Número'), h('input', { style: { ...E.campo, width: 120 }, value: v.numero, placeholder: '01', onChange: (e) => guardar({ ...v, numero: e.target.value }) })), h(Texto, { rot: 'OBJETO', valor: v.objeto, min: 1, onCambio: (x) => guardar({ ...v, objeto: x }), ia: ia.has('objeto'), onRevisado: () => revisado('objeto') }), h(Texto, { rot: 'CARTAS', valor: v.cartas, min: 1, onCambio: (x) => guardar({ ...v, cartas: x }), ia: ia.has('cartas'), onRevisado: () => revisado('cartas') }), h(Texto, { rot: 'ANEXOS (uno por renglón)', valor: v.anexos, min: 1, onCambio: (x) => guardar({ ...v, anexos: x }), ia: ia.has('anexos'), onRevisado: () => revisado('anexos') })),
    ARBOL_ASL.map(seccion),
    h('div', { style: E.caja }, h('label', null, h('span', { style: E.rot }, 'Firma (vacía = la arma la Mesa)'), h('input', { style: E.campo, value: v.firma, placeholder: `EL G-4 DE ${unidadDe(ctx) || 'LA UNIDAD'}`, onChange: (e) => guardar({ ...v, firma: e.target.value }) }))),
    h(Revision, { items: revisarASL(v) }),
  )
}

// ─── MATRIZ DE SINCRONIZACIÓN LOGÍSTICA (F7·P2) ─────────────────────────────────────
function EditorMatriz({ hoja = null, valor, onValor, hojas = {}, onExpediente = null, ctxDoc = {} }) {
  const calco = useCalco()
  const v = normalizarMatriz(valor)
  const ev = normalizarEval(hojas?.[CLAVE_EVAL])
  const an = analizarCalco(calco, ev.parametros)
  const ctx = contexto({ calco, analisis: an, ev, hojas, ctxDoc })
  const [msg, setMsg] = useState(null)
  const [faseSel, setFaseSel] = useState(v.fases[0]?.id)
  const fase = v.fases.find((f) => f.id === faseSel) || v.fases[0]
  const ia = new Set(v.iaCampos)
  const nombre = `${String(hoja?.num || 'F7P2').replace(/[^A-Za-z0-9]+/g, '')}_Matriz_de_sincronizacion_logistica.docx`
  const guardar = (nv) => onValor?.(normalizarMatriz(nv))
  const setCelda = (fila, faseId, x) => guardar({ ...v, celdas: { ...v.celdas, [fila]: { ...v.celdas[fila], [faseId]: x } } })
  const setFase = (id, cambios) => guardar({ ...v, fases: v.fases.map((f) => (f.id === id ? { ...f, ...cambios } : f)) })
  const armar = () => {
    const r = armarMatriz(v, ctx)
    if (!r.cambios.length) return setMsg({ tipo: 'aviso', txt: 'No había nada nuevo que traer (no se pisa lo escrito). Cargá las fases del COA, el concepto de apoyo por fase (🎬 Concepto) y el calco de apoyo logístico, o trabajala con la IA.' })
    guardar(r.valor)
    if (!r.valor.fases.some((f) => f.id === faseSel)) setFaseSel(r.valor.fases[0]?.id)
    setMsg({ tipo: 'ok', txt: `🌱 Se trajo: ${r.cambios.join(' · ')}. Lo del calco va en la primera fase: copialo a las siguientes si no cambia.` })
  }
  const Panel = panelIA()
  const onPedido = async (modo) => pedidoMatriz(v, { analisis: an, otras: otrasHojasG4({ evaluacion: ev, analisis: an, asl: hojas?.aprecOrientacion || hojas?.aprecActiva, ctx }), expediente: await expedienteDe(onExpediente), ctx, hoja, modo, encabezado: encabezadoIA() })
  const onAplicar = (texto, modo) => {
    const r = aplicarRespuestaMatriz(texto, v, { modo, corregir: corregirIA() })
    if (!r.ok) return r
    guardar(r.valor)
    return { ok: true, msg: r.msg }
  }
  const zonasDe = (fila) => {
    const ops = calco.ops || {}
    if (fila.calco === 'zonalog') return (ops.zonasLog || []).filter((z) => ['asdi', 'arce'].includes(z.zona) && (!z.propuesta || z.elegida)).map((z) => z.coords)
    if (fila.calco === 'epa' || fila.calco === 'epe') return (ops.ejesLog || []).filter((e) => e.tipo === fila.calco).map((e) => e.coords)
    return []
  }
  const nivelDe = (t) => (String(t || '').match(/Nivel\s+(I{1,3})\b/i) || [])[1]?.toUpperCase() || ''
  return h(
    'div',
    { style: E.raiz, 'data-hoja': 'matriz-sincronizacion-logistica' },
    h('div', { style: E.caja }, h('div', { style: E.sub }, `${hoja?.num || 'F7·P2'} ${TITULO_MATRIZ} · ${v.fases.length} fase(s)`), h('div', { style: E.fila }, h('button', { style: E.btn, onClick: () => previaDocx(TITULO_MATRIZ, crearWordMatriz(v, { ctx }), nombre, matrizHTML(v)) }, '👁️ Vista previa'), h('button', { style: E.btnPrin, onClick: () => (descargar(crearWordMatriz(v, { ctx }), nombre), setMsg({ tipo: 'ok', txt: `✓ Word descargado: ${nombre}` })) }, '📄 Matriz (Word)')), h('div', { style: E.ayuda }, 'El producto final del G-4: cada función logística sincronizada con cada fase de la operación (desde — hasta), con la forma de la lámina de la Escuela. Sale en carta apaisada, con membrete, SECRETO, las siglas y la firma del G-4.')),
    h(Msg, { msg }),
    h('div', { style: E.caja }, h('div', { style: E.sub }, '1 · Lo que ya tiene el ejercicio'), h('button', { style: E.btn, onClick: armar }, '🌱 Traer del calco y de mis hojas lo que falte'), h('div', { style: E.ayuda }, 'Las fases del COA del G-3; el enfoque y la prioridad de cada fase (🎬 Concepto); y del calco: el ARCE, el área elegida y los puestos, el EPA y el EPE, la sanidad, el mantenimiento y la recolección, con sus coordenadas. No pisa lo escrito.')),
    h('div', { style: E.caja }, h('div', { style: E.sub }, '2 · 💡 Mis ideas (cómo quiero sincronizar el apoyo)'), h('textarea', { style: E.area, rows: filasDe(v.ideas, 3), value: v.ideas, placeholder: 'Ej.: «En la fase II el esfuerzo va a la Clase V y a la evacuación» · «El ASDI se adelanta en la fase III a la zona de …» · «Amenaza nivel II en el área de retaguardia por los comandos enemigos».', onChange: (e) => guardar({ ...v, ideas: e.target.value }) }), h('div', { style: E.ayuda }, 'No se imprime: va al pedido a la IA.')),
    Panel && h(Panel, { titulo: '🤖 Trabajar esta hoja con IA', nota: 'Le manda el expediente completo, lo que midió la Mesa en el calco, la evaluación de las áreas y la Apreciación de Logística, la doctrina, TUS IDEAS y la matriz como está. Devuelve cada renglón en cada fase.', color: AMBAR, modos: MODOS, onPedido, onAplicar }),
    h(BloqueAcostar, { calco }),
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.parrafo }, 'FASES (columnas)'),
      h('div', { style: E.fila }, v.fases.map((f) => h('button', { key: f.id, style: { ...E.chip, ...(f.id === fase?.id ? E.chipOn : {}) }, onClick: () => setFaseSel(f.id) }, f.nombre.split(' — ')[0]))),
      fase &&
        h(
          'div',
          { style: E.tarjeta, 'data-fase': fase.id },
          h('label', null, h('span', { style: E.rot }, 'Nombre de la fase'), h('input', { style: E.campo, value: fase.nombre, onChange: (e) => setFase(fase.id, { nombre: e.target.value }) })),
          h('div', { style: E.fila }, h('label', { style: { flex: 1 } }, h('span', { style: E.rot }, 'DESDE'), h('input', { style: E.campo, value: fase.desde, placeholder: 'D-1 (1800)', onChange: (e) => setFase(fase.id, { desde: e.target.value }) })), h('label', { style: { flex: 1 } }, h('span', { style: E.rot }, 'HASTA'), h('input', { style: E.campo, value: fase.hasta, placeholder: 'D (0500)', onChange: (e) => setFase(fase.id, { hasta: e.target.value }) }))),
          h(
            'div',
            { style: E.fila },
            v.fases.indexOf(fase) > 0 && h('button', { style: E.btnChico, onClick: () => guardar(copiarFaseAnterior(v, fase.id)) }, '⧉ Copiar lo vacío de la fase anterior'),
            v.fases.length > 1 && h('button', { style: E.btnChico, onClick: () => window.confirm(`¿Quitar la ${fase.nombre}? Se pierde lo escrito en esa columna.`) && (guardar({ ...v, fases: v.fases.filter((f) => f.id !== fase.id) }), setFaseSel(v.fases.find((f) => f.id !== fase.id)?.id)) }, '✕ Quitar la fase'),
          ),
        ),
      h('button', { style: E.btnMas, onClick: () => { const nf = nuevaFase(v); guardar({ ...v, fases: [...v.fases, nf] }); setFaseSel(nf.id) } }, '+ Agregar fase'),
    ),
    fase &&
      h(
        'div',
        { style: E.caja, 'data-g4': 'matriz-fase' },
        h('div', { style: E.parrafo }, fase.nombre),
        FILAS_MATRIZ.map((f, i) => {
          const k = `${f.id}|${fase.id}`
          const zs = zonasDe(f)
          return h(
            'div',
            { key: f.id, style: { display: 'flex', flexDirection: 'column', gap: 3 } },
            h(Texto, { rot: `${f.grupo ? `${f.grupo} — ` : ''}${f.rot}`, valor: v.celdas[f.id][fase.id], placeholder: f.guia, min: 1, onCambio: (x) => setCelda(f.id, fase.id, x), ia: ia.has(k), onRevisado: () => guardar({ ...v, iaCampos: v.iaCampos.filter((x) => x !== k) }) }),
            f.id === 'amenaza' &&
              h(
                'div',
                { style: E.fila },
                NIVELES_AMENAZA.map((n) => h('button', { key: n.id, title: `${n.que} ${n.quien}`, style: { ...E.chip, ...(nivelDe(v.celdas.amenaza[fase.id]) === n.id ? E.chipOn : {}) }, onClick: () => setCelda('amenaza', fase.id, `${n.nom}: ${n.que}${String(v.celdas.amenaza[fase.id] || '').replace(/^Nivel\s+I{1,3}:[^\n]*/i, '').trim() ? `\n${String(v.celdas.amenaza[fase.id]).replace(/^Nivel\s+I{1,3}:[^\n]*\n?/i, '').trim()}` : ''}`) }, n.nom)),
                h('span', { style: E.fuente }, FUENTE_AMENAZA),
              ),
            f.calco && h('div', { style: E.fila }, h('button', { style: E.btnChico, onClick: () => (f.calco === 'zonalog' ? setMsg({ tipo: 'aviso', txt: 'El área se propone, se evalúa y se elige en la pestaña «▣ ASDI» (paso a paso).' }) : accion('herramienta')?.(f.calco)) }, f.calco === 'zonalog' ? '▣ Elegir el área (pestaña ASDI)' : `↔ Trazar el ${f.calco.toUpperCase()} en el calco`), zs.length > 0 && h('button', { style: E.btnChico, onClick: () => verEnCarta(zs) }, '📍 Ver en la carta')),
          )
        }),
        h('div', { style: E.fuente }, `Siglas: ${SIGLAS_MATRIZ.map(([a, b]) => `${a} = ${b}`).join(' · ')}`),
      ),
    h('button', { style: E.btn, onClick: () => abrirVisor({ titulo: TITULO_MATRIZ, html: matrizHTML(v) }) }, '🔍 Ver la matriz completa (todas las fases)'),
    h(Revision, { items: revisarMatriz(v) }),
  )
}
