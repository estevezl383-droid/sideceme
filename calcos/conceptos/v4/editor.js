// Pantalla de la hoja F2·P1 «Conceptos entrelazados» en el Tablero del G-3.
//
//   0 · ¿Con qué unidades? Unidades puras (orgánicas, como la organización de la tarea
//       de la orden) · FT / agrupaciones tácticas (las de 🧩 Organización de la tarea)
//       · mi unidad entre las adyacentes. Arriba siempre la cadena de mando:
//       CTO (XXXXX) → FF.TT.T.O. (XXXX) → CE (XXX) → División (XX).
//   1 · 🌱 Armar la hoja con lo del ejercicio (orden superior, organización de la
//       tarea, fichas del calco, fases del COA, reexpresión de la misión)
//   2 · 🤖 Trabajar esta hoja con IA — como en las demás hojas: el pedido lleva el
//       expediente completo; además, la IDEA del oficial y ORIENTACIONES O
//       INFORMACIÓN propias de esta hoja (texto o archivos .txt / .md / .docx)
//   3 · 👁️ Ver la hoja · 📄 Word (formato del PMTD) · 🖨️ Imprimir
//   4 · ✏️ Corregir a mano: fases, unidades, tareas y propósitos, relaciones
//
// JavaScript sin compilar: React llega por runtime.js (el de la Mesa).
import { GRUPOS, ENFOQUES, MAGNITUDES, ARMAS, ROLES, CAMPOS, AYUDA_CAMPO, normalizarConceptos, nuevaUnidad, eliminarUnidad, antecedentesConceptos, armarDesdeEjercicio, revisarConceptos, resumenConceptos, tipoUnidad, nombreUnidad, romano, nuevoId, limpio, acomodarJerarquia, unidadPropiaDelEjercicio } from './modelo.js'
import { laminasConceptos } from './laminas.js'
import { descargarConceptosWord } from './word.js'
import { pedidoIA, conIndicacion, aplicarRespuestaIA } from './ia.js'
import { useState, useMemo, jsx, jsxs, encabezadoIA, corregirIA } from './runtime.js'

function h(tipo, props, ...hijos) {
  const { key, ...p } = props || {}
  if (!hijos.length) return jsx(tipo, p, key)
  if (hijos.length === 1) return jsx(tipo, { ...p, children: hijos[0] }, key)
  return jsxs(tipo, { ...p, children: hijos }, key)
}

const VERDE = '#7dffb0'
const E = {
  raiz: { display: 'flex', flexDirection: 'column', gap: 8, color: '#e6eef6', fontSize: 12 },
  caja: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: 9, display: 'flex', flexDirection: 'column', gap: 6 },
  paso: { fontSize: 10, color: '#8fa2bd', textTransform: 'uppercase', letterSpacing: 0.4 },
  intro: { fontSize: 11.5, color: '#b9c9da', lineHeight: 1.45 },
  fila: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  btn: { flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 6, padding: '7px 8px', cursor: 'pointer', fontSize: 12 },
  btnPrin: { flex: 1, minWidth: 140, background: VERDE, color: '#10202a', border: 'none', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 },
  btnChico: { background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 5, padding: '4px 7px', cursor: 'pointer', fontSize: 11 },
  nivel: { flex: 1, minWidth: 140, textAlign: 'left', background: '#0e1320', color: '#cdd8e8', border: '1px solid #34405a', borderRadius: 7, padding: '7px 8px', cursor: 'pointer', fontSize: 11.5, lineHeight: 1.3 },
  nivelOn: { background: '#16301f', color: '#fff', borderColor: VERDE, boxShadow: `0 0 0 1px ${VERDE}55` },
  ayuda: { fontSize: 10.5, color: '#9fb0c8', lineHeight: 1.4, fontStyle: 'italic' },
  ok: { background: '#12291d', border: '1px solid #2f6b46', color: '#9fe0c0', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  err: { background: '#2a1416', border: '1px solid #6b2f35', color: '#f0b0b6', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  aviso: { background: 'rgba(255,212,122,0.08)', border: '1px solid rgba(255,212,122,0.3)', color: '#ffd47a', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  area: { background: 'rgba(0,0,0,0.4)', color: '#e6eef6', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: '6px 8px', fontSize: 11.5, resize: 'vertical', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  areaMono: { background: '#0b0f19', color: '#e8edf5', border: '1px solid #3a4a68', borderRadius: 6, padding: '6px 8px', fontSize: 11, resize: 'vertical', fontFamily: 'ui-monospace, Menlo, monospace', width: '100%', boxSizing: 'border-box' },
  campo: { width: '100%', boxSizing: 'border-box', background: '#172332', color: '#fff', border: '1px solid #4d5d70', borderRadius: 4, padding: '5px 6px', fontSize: 12, fontFamily: 'inherit' },
  etiqueta: { display: 'block', marginTop: 5, fontSize: 11, color: '#b9c9da' },
  unidad: { margin: '6px 0', padding: '6px 8px', background: '#111c29', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' },
  resumen: { cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  fase: { border: '1px solid rgba(255,255,255,0.14)', borderRadius: 6, padding: '4px 7px 7px', margin: '6px 0' },
  miniaturas: { display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 },
  mini: { flex: '0 0 auto', width: 150, background: '#fff', borderRadius: 3, cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.3)', lineHeight: 0 },
  chip: { display: 'inline-block', background: 'rgba(125,255,176,0.12)', border: '1px solid rgba(125,255,176,0.35)', color: VERDE, borderRadius: 10, padding: '1px 7px', fontSize: 10.5, margin: '0 4px 4px 0' },
}
const IAS = [
  { id: 'claude', nom: 'Claude', url: 'https://claude.ai/new' },
  { id: 'chatgpt', nom: 'ChatGPT', url: 'https://chatgpt.com/' },
  { id: 'gemini', nom: 'Gemini', url: 'https://gemini.google.com/app' },
]
const MODOS = [
  { id: 'completar', nom: 'Armar / sólo completar', ayuda: 'Arma lo que falta —unidades, fases, tareas y propósitos, relaciones— sin tocar una coma de lo que ya está escrito. Con la hoja vacía, la arma entera.' },
  { id: 'completar_mejorar', nom: 'Completar y mejorar', ayuda: 'Hace las dos cosas: llena lo que falta Y reescribe lo que ya está como producto de Estado Mayor (tarea táctica, a quién, dónde; propósito ligado al de arriba). REEMPLAZA lo escrito.' },
]

// ─── Archivos que el oficial adjunta a la hoja (.txt, .md, .docx) ─────────────────
function textoDeXmlWord(xml) {
  return String(xml)
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
async function textoDocx(buf) {
  const dv = new DataView(buf)
  let fin = -1
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      fin = i
      break
    }
  }
  if (fin < 0) throw new Error('No parece un .docx válido.')
  const n = dv.getUint16(fin + 10, true)
  let p = dv.getUint32(fin + 16, true)
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break
    const metodo = dv.getUint16(p + 10, true)
    const comprimido = dv.getUint32(p + 20, true)
    const lenN = dv.getUint16(p + 28, true)
    const lenE = dv.getUint16(p + 30, true)
    const lenC = dv.getUint16(p + 32, true)
    const local = dv.getUint32(p + 42, true)
    const nombre = new TextDecoder().decode(new Uint8Array(buf, p + 46, lenN))
    if (nombre === 'word/document.xml') {
      const datos = new Uint8Array(buf, local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true), comprimido)
      let xml
      if (metodo === 0) xml = new TextDecoder().decode(datos)
      else if (metodo === 8 && typeof DecompressionStream !== 'undefined') xml = await new Response(new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text()
      else throw new Error('Este navegador no puede abrir el .docx: copiá y pegá su texto en el recuadro.')
      return textoDeXmlWord(xml)
    }
    p += 46 + lenN + lenE + lenC
  }
  throw new Error('El .docx no trae texto.')
}
async function leerArchivo(f) {
  const nom = String(f.name || '').toLowerCase()
  if (nom.endsWith('.docx')) return textoDocx(await f.arrayBuffer())
  if (/\.(txt|md|markdown|csv|json)$/.test(nom) || String(f.type).startsWith('text/')) return (await f.text()).trim()
  if (nom.endsWith('.pdf')) throw new Error(`«${f.name}»: el PDF no se lee acá. Cargalo en «Documentos aportados por el oficial» de la Mesa (así entra al expediente) o copiá su texto en el recuadro.`)
  throw new Error(`«${f.name}»: sólo se leen .txt, .md y .docx.`)
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    try {
      const t = document.createElement('textarea')
      t.value = texto
      t.style.position = 'fixed'
      t.style.opacity = '0'
      document.body.appendChild(t)
      t.select()
      const ok = document.execCommand('copy')
      t.remove()
      return ok
    } catch {
      return false
    }
  }
}
function bajarTexto(texto, nombre) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/markdown;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function imprimir(svgs) {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>F2·P1 Conceptos entrelazados</title><style>@page{size:letter landscape;margin:8mm}body{margin:0}div{page-break-after:always;text-align:center}svg{width:100%;height:auto;max-height:190mm}</style></head><body>${svgs.map((s) => `<div>${s}</div>`).join('')}</body></html>`,
  )
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 400)
  return true
}

// Visor a pantalla completa. Va directo en <body> (no dentro del panel del Tablero,
// que lo recortaría): las láminas se ven grandes, con Word, Imprimir y Cerrar.
function abrirVisor(svgs, { titulo, onWord }) {
  document.getElementById('sid-visor-conceptos')?.remove()
  const velo = document.createElement('div')
  velo.id = 'sid-visor-conceptos'
  velo.setAttribute('role', 'dialog')
  velo.setAttribute('aria-label', 'Hoja de conceptos entrelazados')
  Object.assign(velo.style, { position: 'fixed', inset: '0', zIndex: '100000', background: 'rgba(8,12,20,0.94)', overflow: 'auto', padding: '10px 10px 40px', boxSizing: 'border-box' })
  const barra = document.createElement('div')
  Object.assign(barra.style, { position: 'sticky', top: '0', zIndex: '1', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: '#141a29', border: '1px solid #34405a', borderRadius: '8px', padding: '8px', margin: '0 auto 10px', maxWidth: '1400px', fontFamily: 'system-ui, sans-serif' })
  const tit = document.createElement('b')
  tit.textContent = titulo
  Object.assign(tit.style, { color: VERDE, fontSize: '13px', flex: '1 1 200px' })
  const estado = document.createElement('span')
  Object.assign(estado.style, { color: '#9fe0c0', fontSize: '12px', flex: '1 1 100%' })
  const boton = (texto, principal, fn) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = texto
    Object.assign(b.style, principal ? { background: VERDE, color: '#10202a', border: 'none', borderRadius: '7px', padding: '8px 12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' } : { background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', fontSize: '13px' })
    b.onclick = fn
    return b
  }
  const cerrar = () => {
    velo.remove()
    document.removeEventListener('keydown', tecla)
  }
  const tecla = (e) => e.key === 'Escape' && cerrar()
  const bWord = boton('📄 Word', true, async () => {
    bWord.disabled = true
    estado.textContent = '⏳ Preparando el Word…'
    const r = await onWord()
    estado.textContent = r
    bWord.disabled = false
  })
  barra.append(tit, bWord, boton('🖨️ Imprimir', false, () => imprimir(svgs)), boton('✕ Cerrar', false, cerrar), estado)
  velo.append(barra)
  for (const s of svgs) {
    const p = document.createElement('div')
    Object.assign(p.style, { background: '#fff', maxWidth: '1400px', margin: '0 auto 14px', boxShadow: '0 4px 18px rgba(0,0,0,0.5)', lineHeight: '0' })
    p.innerHTML = s.replace('<svg ', '<svg style="width:100%;height:auto;display:block" ')
    velo.append(p)
  }
  velo.addEventListener('click', (e) => e.target === velo && cerrar())
  document.addEventListener('keydown', tecla)
  document.body.appendChild(velo)
}

export default function EditorConceptos({ valor, onValor, ctx = null, onExpediente = null }) {
  const v = normalizarConceptos(valor)
  const [ocupado, setOcupado] = useState('')
  const [msg, setMsg] = useState(null)
  const [modo, setModo] = useState('completar')
  const [respuesta, setRespuesta] = useState('')
  const [pedido, setPedido] = useState('')
  const [verPedido, setVerPedido] = useState(false)
  const [msgIA, setMsgIA] = useState(null)
  const [abiertas, setAbiertas] = useState({})
  const guardar = (next) => onValor?.(next)
  const enfoque = ENFOQUES[v.enfoque]
  const op = { clasificacion: ctx?.ordenSup?.clasificacion || '', unidad: limpio(ctx?.ordenSup?.unidad || ctx?.unidad || v.unidades.find((u) => u.propia)?.nombre), ejercicio: limpio(ctx?.ejercicio) }
  const laminas = useMemo(() => {
    try {
      return { svgs: laminasConceptos(v, op), error: '' }
    } catch (e) {
      return { svgs: [], error: e?.message || String(e) }
    }
  }, [valor, op.clasificacion, op.unidad, op.ejercicio])
  const avisos = revisarConceptos(v)
  const cuenta = resumenConceptos(v)
  const antecedentes = antecedentesConceptos(v)
  const hayCtx = !!ctx
  const propiaHoja = v.unidades.find((u) => u.propia)
  const propiaEj = hayCtx ? unidadPropiaDelEjercicio(ctx) : { nombre: '', fuente: '' }
  const cadena = v.unidades.filter((u) => u.grupo === 'superior')
  const acomodo = useMemo(() => (v.unidades.length ? acomodarJerarquia(v, { propia: propiaEj.nombre }) : { cambios: [] }), [valor, propiaEj.nombre])

  const setOrient = (k, x) => guardar({ ...v, orientaciones: { ...v.orientaciones, [k]: x } })
  const setUnidad = (id, datos) => guardar({ ...v, unidades: v.unidades.map((u) => (u.id === id ? { ...u, ...datos } : u)) })
  const setFaseUnidad = (u, faseId, datos) => {
    const ya = u.fases.find((f) => f.fase === faseId)
    const fases = ya ? u.fases.map((f) => (f.fase === faseId ? { ...f, ...datos } : f)) : [...u.fases, { fase: faseId, esfuerzo: false, ...datos }]
    let unidades = v.unidades.map((x) => (x.id === u.id ? { ...x, fases } : x))
    // Un solo esfuerzo principal por fase.
    if (datos.esfuerzo) unidades = unidades.map((x) => (x.id === u.id || x.grupo !== 'maniobra' ? x : { ...x, fases: x.fases.map((f) => (f.fase === faseId ? { ...f, esfuerzo: false } : f)) }))
    guardar({ ...v, unidades })
  }

  const armar = (pisar, enf = v.enfoque) => {
    if (!hayCtx) return setMsg({ tipo: 'err', txt: 'Esta hoja se abrió fuera del Tablero del G-3: no tiene a mano los datos del ejercicio.' })
    if (pisar && v.unidades.length && !window.confirm('♻️ Rearmar TODA la hoja con lo del ejercicio.\n\nSe reemplazan las unidades, las fases y las relaciones (y lo que se escribió en ellas). Las orientaciones y el texto anterior se conservan.\n\n¿Seguimos?')) return
    const { valor: nuevo, resumen } = armarDesdeEjercicio(ctx, { enfoque: enf, previo: v, pisar })
    guardar(nuevo)
    const fuentes = resumen.fuentes.length ? `Salió de: ${resumen.fuentes.join(' · ')}.` : 'El ejercicio todavía no tiene la orden del escalón superior, ni organización de la tarea, ni fichas propias.'
    const ojo = resumen.avisos?.length ? ` ⚠️ ${resumen.avisos.join(' ')}` : ''
    setMsg(
      resumen.agregadas || resumen.completadas
        ? { tipo: 'ok', txt: `🌱 ${resumen.agregadas} unidad(es) puestas${resumen.completadas ? `, ${resumen.completadas} completada(s)` : ''} (${ENFOQUES[enf].nom}). ${fuentes} Lo que la Mesa no sabe (tareas por fase, propósitos, apoyo) se completa con la IA de abajo o a mano.${ojo}` }
        : { tipo: 'ok', txt: `No había nada nuevo para traer: la hoja ya tiene todo lo que sabe la Mesa. ${fuentes}${ojo}` },
    )
  }
  const cambiarNivel = (id) => {
    if (id === v.enfoque) return hayCtx && !v.unidades.length ? armar(false, id) : undefined
    if (hayCtx && v.unidades.length && window.confirm(`Opción: «${ENFOQUES[id].nom}».\n\n¿Rearmo la hoja con lo del ejercicio para esta opción?\n\nAceptar = rearmar (se reemplazan las unidades).\nCancelar = sólo cambiar la opción y dejar las unidades como están.`)) return armar(true, id)
    if (hayCtx && !v.unidades.length) return armar(false, id)
    guardar({ ...v, enfoque: id })
  }
  const acomodar = () => {
    const r = acomodarJerarquia(v, { propia: propiaEj.nombre })
    guardar(r.valor)
    setMsg({ tipo: 'ok', txt: `🧹 Cada unidad en su escalón: ${r.cambios.join(' ')}` })
  }
  const ponerNombrePropia = (x) => {
    if (propiaHoja) return setUnidad(propiaHoja.id, { nombre: x })
    const u = { ...nuevaUnidad(nuevoId('u'), v.enfoque === 'adyacentes' ? 'maniobra' : 'superior'), nombre: x, propia: true, magnitud: 'XX' }
    guardar({ ...v, unidades: [...v.unidades, u] })
  }

  const word = async () => {
    setOcupado('word')
    setMsg(null)
    try {
      await descargarConceptosWord(v, op)
      const t = `📄 Word bajado: ${laminas.svgs.length} hoja(s) apaisada(s) con el formato del PMTD.`
      setMsg({ tipo: 'ok', txt: t })
      return t
    } catch (e) {
      const t = `No se pudo generar el Word: ${e?.message || e}`
      setMsg({ tipo: 'err', txt: t })
      return t
    } finally {
      setOcupado('')
    }
  }
  const verHoja = () => abrirVisor(laminas.svgs, { titulo: `F2·P1 Conceptos entrelazados — ${laminas.svgs.length} hoja(s)`, onWord: word })

  // ─── IA ──────────────────────────────────────────────────────────────────────
  const armarPedido = async () => {
    let expediente = ''
    try {
      const x = await onExpediente?.()
      expediente = x?.md || ''
    } catch {}
    const r = pedidoIA(v, { expediente, modo, ctx: ctx || {}, encabezado: encabezadoIA() })
    return r.ok ? conIndicacion(r.prompt, v.orientaciones.idea) : null
  }
  const pedir = async (url) => {
    setOcupado('pedido')
    setMsgIA(null)
    try {
      const p = await armarPedido()
      if (!p) return setMsgIA({ tipo: 'err', txt: 'No se pudo armar el pedido.' })
      setPedido(p)
      const ok = await copiar(p)
      setMsgIA(
        ok
          ? { tipo: 'ok', txt: `Pedido copiado (${p.length.toLocaleString('es')} caracteres, con el expediente del ejercicio). Pegalo en la IA y traé su respuesta a la caja de abajo.` }
          : { tipo: 'err', txt: 'El portapapeles está bloqueado en este navegador. Usá «⬇ Descargar (.md)» y adjuntá el archivo a la IA, o «👁 Ver el pedido» y copialo de ahí.' },
      )
      if (url) {
        try {
          window.open(url, '_blank')
        } catch {}
      }
    } finally {
      setOcupado('')
    }
  }
  const descargarPedido = async () => {
    setOcupado('pedido')
    try {
      const p = await armarPedido()
      if (!p) return
      setPedido(p)
      bajarTexto(p, 'PEDIDO_A_LA_IA_F2P1_Conceptos_entrelazados.md')
      setMsgIA({ tipo: 'ok', txt: 'Pedido descargado. Adjuntalo en la IA que uses.' })
    } finally {
      setOcupado('')
    }
  }
  const aplicar = () => {
    const r = aplicarRespuestaIA(v, respuesta, { modo, corregir: corregirIA(), ctx })
    if (!r.ok) return setMsgIA({ tipo: 'err', txt: r.error })
    guardar(r.valor)
    setRespuesta('')
    setMsgIA({ tipo: 'ok', txt: `✓ ${r.msg}` })
  }
  const pegar = async () => {
    try {
      const t = await navigator.clipboard.readText()
      if (t) setRespuesta(t)
    } catch {
      setMsgIA({ tipo: 'err', txt: 'El navegador no deja leer el portapapeles: pegá con Ctrl+V (o mantené apretado) en la caja.' })
    }
  }
  const adjuntar = async (e) => {
    const archivos = [...(e.target.files || [])]
    e.target.value = ''
    const nuevos = []
    const errores = []
    for (const f of archivos) {
      try {
        const texto = (await leerArchivo(f)).slice(0, 80000)
        if (texto) nuevos.push({ nombre: f.name, texto })
        else errores.push(`«${f.name}» no trae texto.`)
      } catch (x) {
        errores.push(x?.message || String(x))
      }
    }
    if (nuevos.length) setOrient('adjuntos', [...v.orientaciones.adjuntos, ...nuevos].slice(-6))
    setMsgIA(errores.length ? { tipo: 'err', txt: errores.join(' ') } : { tipo: 'ok', txt: `📎 ${nuevos.length} archivo(s) adjuntado(s): van en el pedido a la IA.` })
  }

  // ─── Formulario ──────────────────────────────────────────────────────────────
  const inp = (rot, val, fn, { largo = false, max, ayuda, filas = 2 } = {}) =>
    h(
      'label',
      { style: E.etiqueta, title: ayuda || undefined },
      rot,
      largo
        ? h('textarea', { 'aria-label': rot, rows: filas, style: E.campo, value: val || '', onChange: (e) => fn(e.target.value) })
        : h('input', { 'aria-label': rot, style: E.campo, value: val || '', maxLength: max, onChange: (e) => fn(e.target.value) }),
    )
  const sel = (rot, val, opciones, fn) =>
    h('label', { style: E.etiqueta }, rot, h('select', { 'aria-label': rot, style: E.campo, value: val || '', onChange: (e) => fn(e.target.value) }, opciones.map(([k, n]) => h('option', { key: k, value: k }, n))))
  const opcionesArma = [['', '— (sin símbolo: texto en el cuadro)'], ...Object.entries(ARMAS).map(([k, a]) => [k, a.nom])]

  const formUnidad = (u) => {
    const tipo = tipoUnidad(u)
    const campos = CAMPOS[tipo]
    const abierta = abiertas[u.id] ?? v.unidades.length <= 3
    const rotuloCampo = (k, r) => (tipo === 'superior' || tipo === 'maniobra' ? (k === 'tarea' ? 'Tarea (T)' : 'Propósito (P)') : r[0] + r.slice(1).toLowerCase())
    return h(
      'details',
      { key: u.id, open: abierta, style: E.unidad, onToggle: (e) => { const o = e.currentTarget.open; if (o !== abierta) setAbiertas((a) => ({ ...a, [u.id]: o })) } },
      h('summary', { style: E.resumen }, [u.rol, limpio(u.nombre) || nombreUnidad(u), u.magnitud ? `(${u.magnitud})` : '', u.propia ? '· PROPIA' : ''].filter(Boolean).join(' ')),
      inp('Denominación', u.nombre, (x) => setUnidad(u.id, { nombre: x }), { max: 90 }),
      h(
        'div',
        { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 } },
        sel('Magnitud (escalón)', u.magnitud, MAGNITUDES, (x) => setUnidad(u.id, { magnitud: x })),
        sel('Arma (símbolo)', u.arma, opcionesArma, (x) => setUnidad(u.id, { arma: x })),
        inp('Rótulo corto (junto al gráfico)', u.rotulo, (x) => setUnidad(u.id, { rotulo: x }), { max: 30 }),
        tipo === 'superior' ? inp('Texto en el cuadro (CTO, FF.TT.T.O., CE…)', u.texto, (x) => setUnidad(u.id, { texto: x }), { max: 12 }) : sel('Rol', u.rol, ROLES, (x) => setUnidad(u.id, { rol: x })),
        inp('Número al pie (1, 2…)', u.numero, (x) => setUnidad(u.id, { numero: x }), { max: 8 }),
        h('label', { style: { ...E.etiqueta, display: 'flex', gap: 5, alignItems: 'center', marginTop: 20 } }, h('input', { type: 'checkbox', checked: !!u.propia, onChange: (e) => guardar({ ...v, unidades: v.unidades.map((x) => ({ ...x, propia: x.id === u.id ? e.target.checked : e.target.checked ? false : x.propia })) }) }), 'Unidad propia'),
      ),
      sel('Lugar en la hoja', u.grupo, GRUPOS.map((g) => [g, enfoque.grupos[g]]), (x) => setUnidad(u.id, { grupo: x })),
      tipo !== 'superior' && inp('Relación de mando (opcional: BAJO CONTROL…)', u.mando, (x) => setUnidad(u.id, { mando: x.toUpperCase() }), { max: 30 }),
      tipo === 'maniobra' && !v.fases.length && h('label', { style: { ...E.etiqueta, display: 'flex', gap: 5, alignItems: 'center' } }, h('input', { type: 'checkbox', checked: !!u.esfuerzo, onChange: (e) => setUnidad(u.id, { esfuerzo: e.target.checked }) }), 'Esfuerzo principal'),
      h('div', { style: { ...E.ayuda, marginTop: 6 } }, tipo === 'superior' || !v.fases.length ? 'Tarea y propósito:' : 'General (si la tarea no cambia por fase; si no, dejalo vacío y escribí por fase):'),
      campos.map(([k, r]) => h('div', { key: k }, inp(rotuloCampo(k, r), u[k], (x) => setUnidad(u.id, { [k]: x }), { largo: true, ayuda: AYUDA_CAMPO[k] }))),
      tipo !== 'superior' &&
        v.fases.map((f, i) => {
          const x = u.fases.find((y) => y.fase === f.id) || {}
          return h(
            'fieldset',
            { key: f.id, style: E.fase },
            h('legend', { style: { fontSize: 11, fontWeight: 700 } }, `FASE ${romano(i + 1)}${f.nombre ? ` — ${f.nombre}` : ''}`),
            tipo === 'maniobra' && h('label', { style: { ...E.etiqueta, display: 'flex', gap: 5, alignItems: 'center', marginTop: 0 } }, h('input', { type: 'checkbox', checked: !!x.esfuerzo, onChange: (e) => setFaseUnidad(u, f.id, { esfuerzo: e.target.checked }) }), '︽ Esfuerzo principal en esta fase'),
            campos.map(([k, r]) => h('div', { key: k }, inp(`${rotuloCampo(k, r)} · F${i + 1}`, x[k], (val) => setFaseUnidad(u, f.id, { [k]: val }), { largo: true, ayuda: AYUDA_CAMPO[k] }))),
          )
        }),
      h('div', { style: { ...E.fila, marginTop: 6 } }, h('button', { style: E.btnChico, onClick: () => window.confirm(`¿Quitar «${nombreUnidad(u)}» de la hoja, con sus relaciones?`) && guardar(eliminarUnidad(v, u.id)) }, '🗑 Quitar la unidad')),
    )
  }

  const nombreDe = (id) => {
    const u = v.unidades.find((x) => x.id === id)
    return u ? `${u.rol ? `${u.rol} · ` : ''}${nombreUnidad(u)}` : '?'
  }

  // ─── Pantalla ────────────────────────────────────────────────────────────────
  return h(
    'div',
    { style: E.raiz },
    h('div', { style: { ...E.ayuda, fontStyle: 'normal', textAlign: 'right' } }, 'Versión 4 (29-09): todas las unidades con flecha directa a tu unidad.'),
    h('div', { style: E.intro }, 'Hoja GRÁFICA del PMTD 2017 (formato de la pág. 20, ejemplo de las págs. 21-22): la posición VERTICAL —la cadena de mando: CTO (XXXXX) → FF.TT.T.O. (XXXX) → CE (XXX) → División (XX)— y HORIZONTAL (maniobra, apoyo de combate y SPAC), con la tarea (T) y el propósito (P) de cada unidad, por fase.'),

    // 0 · Opción
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, '0 · ¿Con qué unidades armás la hoja?'),
      h(
        'div',
        { style: E.fila },
        Object.entries(ENFOQUES).map(([id, x]) =>
          h('button', { key: id, style: { ...E.nivel, ...(v.enfoque === id ? E.nivelOn : {}) }, onClick: () => cambiarNivel(id), 'aria-pressed': v.enfoque === id }, h('b', null, `${v.enfoque === id ? '● ' : '○ '}${x.nom}`), h('div', { style: { fontSize: 10.5, opacity: 0.85 } }, x.corto)),
        ),
      ),
      h('div', { style: E.ayuda }, enfoque.ayuda),
      h(
        'div',
        { style: { ...E.intro, fontSize: 11 } },
        h('b', null, 'Tu unidad: '),
        propiaHoja && limpio(propiaHoja.nombre)
          ? `${propiaHoja.nombre} (${propiaHoja.magnitud || '—'})`
          : propiaEj.nombre
            ? `${propiaEj.nombre} (de ${propiaEj.fuente}; armá la hoja para ponerla)`
            : 'sin denominación',
        cadena.length > 0 && h('div', null, h('b', null, 'Cadena de mando: '), cadena.map((u) => `${nombreUnidad(u)} (${u.magnitud || '—'})`).join(' → ')),
      ),
      hayCtx &&
        !propiaEj.nombre &&
        h('label', { style: E.etiqueta }, '¿Cuál es tu unidad? (la Mesa no la encontró en la orden: escribila acá o en la Orden del escalón superior → «Unidad»)', h('input', { 'aria-label': 'Denominación de tu unidad', style: E.campo, placeholder: 'Ej.: DIVMEC-1', value: propiaHoja?.nombre || '', onChange: (e) => ponerNombrePropia(e.target.value) })),
      acomodo.cambios.length > 0 &&
        h(
          'div',
          { style: E.aviso },
          h('b', null, '⚠️ Hay unidades fuera de su escalón. '),
          acomodo.cambios.join(' '),
          h('div', { style: { ...E.fila, marginTop: 6 } }, h('button', { style: E.btnPrin, onClick: acomodar }, '🧹 Acomodar cada unidad en su escalón'), hayCtx && h('button', { style: E.btn, onClick: () => armar(true) }, '♻️ Rearmar todo')),
        ),
    ),

    // 1 · Armar
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, '1 · La aplicación arma la hoja'),
      h(
        'div',
        { style: E.fila },
        h('button', { style: E.btnPrin, onClick: () => armar(false), disabled: !hayCtx }, v.unidades.length ? '🌱 Traer del ejercicio lo que falte' : '🌱 Armar la hoja con lo del ejercicio'),
        v.unidades.length > 0 && h('button', { style: E.btn, onClick: () => armar(true), disabled: !hayCtx }, '♻️ Rearmar todo'),
      ),
      h('div', { style: E.ayuda }, 'Toma la orden del escalón superior (escalón superior, unidad, misión, intención), la reexpresión de la misión, la 🧩 Organización de la tarea (OD / OC, tarea y propósito), las fichas propias del calco y las fases del COA. No pisa lo que ya escribiste.'),
      msg && h('div', { style: msg.tipo === 'ok' ? E.ok : E.err }, msg.txt),
    ),

    // Vista
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, `La hoja · ${cuenta.total ? `${cuenta.maniobra} de maniobra · ${cuenta.apoyo} de apoyo de combate · ${cuenta.spac} SPAC · ${cuenta.fases} fase(s) · ${cuenta.relaciones} relación(es)` : 'todavía vacía (se ve el formato en blanco)'}`),
      laminas.error ? h('div', { style: E.err }, laminas.error) : h('div', { style: E.miniaturas }, laminas.svgs.map((s, i) => h('div', { key: i, style: E.mini, title: 'Ver la hoja', onClick: verHoja, dangerouslySetInnerHTML: { __html: s.replace('<svg ', '<svg style="width:100%;height:auto" ') } }))),
      h(
        'div',
        { style: E.fila },
        h('button', { style: E.btn, onClick: verHoja }, '👁️ Ver la hoja'),
        h('button', { style: E.btnPrin, disabled: !!ocupado, onClick: word }, ocupado === 'word' ? '⏳ Preparando…' : '📄 Word (formato PMTD)'),
        h('button', { style: E.btn, onClick: () => imprimir(laminas.svgs) || setMsg({ tipo: 'err', txt: 'El navegador bloqueó la ventana de impresión.' }) }, '🖨️ Imprimir'),
      ),
      avisos.length > 0 && cuenta.total > 0 && h('div', { style: E.aviso }, h('b', null, 'Falta revisar: '), avisos.join(' ')),
    ),

    // 2 · IA
    h(
      'div',
      { style: { ...E.caja, border: `1px solid ${VERDE}66`, background: '#141a29' } },
      h('div', { style: { fontSize: 12.5, fontWeight: 700, color: VERDE } }, '🤖 Trabajar esta hoja con IA'),
      h('div', { style: E.ayuda }, 'Le manda el expediente completo del ejercicio (orden del escalón superior, documentos aportados, calco, fases y hojas del EM), la jerarquía con sus magnitudes, la opción elegida y lo que ya identificó la Mesa (tu unidad, la cadena de mando, tus unidades o tus FT). La respuesta vuelve a la hoja: unidades, tareas y propósitos por fase, OD / OC, esfuerzo principal y relaciones directas e indirectas; si la IA pone una unidad fuera de su escalón, la Mesa la acomoda y te avisa.'),
      h('div', { style: E.fila }, MODOS.map((m) => h('button', { key: m.id, style: { ...E.nivel, textAlign: 'center', ...(modo === m.id ? E.nivelOn : {}) }, onClick: () => setModo(m.id) }, m.nom))),
      h('div', { style: E.ayuda }, MODOS.find((m) => m.id === modo).ayuda),
      h('div', { style: E.paso }, '1 · Tu idea para esta hoja (opcional)'),
      h('textarea', { 'aria-label': 'Tu idea para esta hoja', rows: 3, style: E.area, value: v.orientaciones.idea, placeholder: 'Ej.: «La OD la lleva la FT CALAMA en la fase III» · «El RCM-2 es vanguardia hasta el D (0100)» · «Poné la artillería con PAF a la OC1 en la fase I».', onChange: (e) => setOrient('idea', e.target.value) }),
      v.orientaciones.idea.trim() && h('div', { style: { ...E.ayuda, color: '#9fe0c0' } }, 'Va al FINAL del pedido, que es donde más pesa: la IA la lee último, justo antes de contestar. Queda guardada con la hoja.'),
      h('div', { style: E.paso }, '1 bis · 📎 Orientaciones o información para esta hoja (opcional)'),
      h('textarea', { 'aria-label': 'Orientaciones o información para esta hoja', rows: 3, style: E.area, value: v.orientaciones.info, placeholder: 'Pegá acá lo que la IA tiene que tener en cuenta y no está en la Mesa: orientaciones del Comandante o del instructor, párrafos de la orden superior, el concepto de la operación, la organización de la tarea…', onChange: (e) => setOrient('info', e.target.value) }),
      h(
        'div',
        { style: { ...E.fila, alignItems: 'center' } },
        h('label', { style: { ...E.btnChico, display: 'inline-block' } }, '📎 Adjuntar archivo (.docx, .txt, .md)', h('input', { type: 'file', accept: '.docx,.txt,.md,.markdown,text/plain', multiple: true, style: { display: 'none' }, onChange: adjuntar })),
        v.orientaciones.adjuntos.map((a, i) => h('span', { key: `${a.nombre}-${i}`, style: E.chip }, `📄 ${a.nombre} (${Math.round(a.texto.length / 1000) || 1} k) `, h('button', { style: { background: 'none', border: 'none', color: '#f0b0b6', cursor: 'pointer', padding: 0 }, title: 'Quitar', onClick: () => setOrient('adjuntos', v.orientaciones.adjuntos.filter((_, j) => j !== i)) }, '✕'))),
      ),
      h('div', { style: E.paso }, '2 · Copiá el pedido'),
      h('button', { style: E.btnPrin, disabled: !!ocupado, onClick: () => pedir(null) }, ocupado === 'pedido' ? '⏳ Armando…' : '📋 Copiar el pedido'),
      h('div', { style: E.fila }, IAS.map((x) => h('button', { key: x.id, style: { ...E.btnChico, flex: 1 }, disabled: !!ocupado, title: `Copia el pedido y abre ${x.nom} en otra pestaña`, onClick: () => pedir(x.url) }, `↗ ${x.nom}`))),
      h('div', { style: E.fila }, h('button', { style: E.btnChico, disabled: !!ocupado, onClick: descargarPedido }, '⬇ Descargar (.md)'), pedido && h('button', { style: E.btnChico, onClick: () => setVerPedido((x) => !x) }, verPedido ? '▾ Ocultar el pedido' : '👁 Ver el pedido')),
      verPedido && pedido && h('textarea', { 'aria-label': 'Pedido a la IA', rows: 7, readOnly: true, style: E.areaMono, value: pedido, onFocus: (e) => e.target.select() }),
      h('div', { style: E.paso }, '3 · Pegá acá su respuesta'),
      h('textarea', { 'aria-label': 'Respuesta de la IA', rows: 5, style: E.areaMono, value: respuesta, placeholder: 'Pegá acá la respuesta completa de la IA (el bloque JSON)…', onChange: (e) => setRespuesta(e.target.value) }),
      h('div', { style: E.fila }, h('button', { style: { ...E.btnPrin, flex: 2 }, disabled: !respuesta.trim(), onClick: aplicar }, '✓ Aplicar a la hoja'), h('button', { style: E.btn, onClick: pegar }, '📥 Pegar')),
      msgIA && h('div', { style: msgIA.tipo === 'ok' ? E.ok : E.err }, msgIA.txt),
    ),

    // 4 · A mano
    h(
      'details',
      { style: E.caja, open: v.unidades.length > 0 && v.unidades.length <= 3 },
      h('summary', { style: { ...E.resumen, color: '#dfeaf3' } }, `✏️ Corregir a mano (${cuenta.total} unidad(es), ${cuenta.fases} fase(s), ${cuenta.relaciones} relación(es))`),
      h('div', { style: E.paso }, 'Fases de la operación'),
      v.fases.map((f, i) =>
        h(
          'div',
          { key: f.id, style: { display: 'flex', gap: 6, alignItems: 'center' } },
          h('b', { style: { width: 58, fontSize: 11 } }, `FASE ${romano(i + 1)}`),
          h('input', { 'aria-label': `Nombre de la fase ${i + 1}`, style: E.campo, value: f.nombre, onChange: (e) => guardar({ ...v, fases: v.fases.map((x) => (x.id === f.id ? { ...x, nombre: e.target.value } : x)) }) }),
          h('button', { style: E.btnChico, title: 'Quitar la fase', onClick: () => window.confirm(`¿Quitar la FASE ${romano(i + 1)} y lo escrito en ella?`) && guardar({ ...v, fases: v.fases.filter((x) => x.id !== f.id), unidades: v.unidades.map((u) => ({ ...u, fases: u.fases.filter((x) => x.fase !== f.id) })) }) }, '✕'),
        ),
      ),
      h('div', null, h('button', { style: E.btnChico, onClick: () => { let n = v.fases.length + 1; while (v.fases.some((f) => f.id === `F${n}`)) n++; guardar({ ...v, fases: [...v.fases, { id: `F${n}`, nombre: '' }] }) } }, '+ Añadir fase')),
      GRUPOS.map((g) =>
        h(
          'section',
          { key: g, style: { borderTop: '1px solid rgba(255,255,255,0.14)', paddingTop: 6, marginTop: 4 } },
          h('div', { style: { ...E.paso, color: '#cfe0ea' } }, enfoque.grupos[g]),
          g === 'superior' && h('div', { style: E.ayuda }, 'Una caja por escalón, de arriba hacia abajo: CTO (XXXXX), FF.TT.T.O. (XXXX), CE (XXX), División (XX)… Se ordenan solas por la magnitud.'),
          v.unidades.filter((u) => u.grupo === g).map(formUnidad),
          h('button', { style: E.btnChico, onClick: () => guardar({ ...v, unidades: [...v.unidades, nuevaUnidad(nuevoId('u'), g)] }) }, g === 'superior' ? '+ Añadir un escalón a la cadena de mando' : `+ Añadir: ${enfoque.grupos[g]}`),
        ),
      ),
      h(
        'section',
        { style: { borderTop: '1px solid rgba(255,255,255,0.14)', paddingTop: 6, marginTop: 4 } },
        h('div', { style: { ...E.paso, color: '#cfe0ea' } }, 'Relaciones (flechas)'),
        h('div', { style: E.ayuda }, 'Llena = relación directa · discontinua = relación indirecta. «Desde» la unidad que sostiene o apoya, «hasta» la sostenida o apoyada.'),
        v.relaciones.map((r, i) => {
          const cambiar = (k, x) => guardar({ ...v, relaciones: v.relaciones.map((a, j) => (i === j ? { ...a, [k]: x } : a)) })
          const ops = v.unidades.map((u) => [u.id, nombreDe(u.id)])
          return h(
            'div',
            { key: `${r.desde}-${r.hasta}-${i}`, style: { display: 'grid', gridTemplateColumns: '1fr 1fr 92px 28px', gap: 4, alignItems: 'end', marginTop: 4 } },
            sel('Desde', r.desde, ops.filter(([id]) => id !== r.hasta), (x) => cambiar('desde', x)),
            sel('Hasta', r.hasta, ops.filter(([id]) => id !== r.desde), (x) => cambiar('hasta', x)),
            sel('Tipo', r.tipo, [['directa', 'Directa'], ['indirecta', 'Indirecta']], (x) => cambiar('tipo', x)),
            h('button', { style: { ...E.btnChico, height: 28 }, title: 'Quitar la relación', onClick: () => guardar({ ...v, relaciones: v.relaciones.filter((_, j) => j !== i) }) }, '✕'),
          )
        }),
        h(
          'div',
          { style: { marginTop: 5 } },
          h(
            'button',
            {
              style: E.btnChico,
              disabled: v.unidades.length < 2,
              onClick: () => {
                const libre = v.unidades.flatMap((a) => v.unidades.filter((b) => b.id !== a.id).map((b) => [a.id, b.id])).find(([a, b]) => !v.relaciones.some((r) => r.desde === a && r.hasta === b))
                if (libre) guardar({ ...v, relaciones: [...v.relaciones, { desde: libre[0], hasta: libre[1], tipo: 'directa' }] })
              },
            },
            '+ Añadir relación',
          ),
        ),
      ),
    ),

    antecedentes.length > 0 &&
      h(
        'details',
        { style: E.caja },
        h('summary', { style: E.resumen }, `Texto anterior de esta hoja (formato narrativo, ${antecedentes.length} campos)`),
        h('div', { style: E.ayuda }, 'Se conserva tal cual y se le pasa a la IA como fuente. No se dibuja: la hoja ahora es gráfica.'),
        antecedentes.map(([k, t]) => h('div', { key: k }, inp(k, t, (x) => guardar({ ...v, [k]: x }), { largo: true, filas: 3 }))),
      ),
  )
}
