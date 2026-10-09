// Las pantallas del motor de documentos de Estado Mayor (JavaScript sin compilar; React
// llega por runtime.js), en «📋 Mis hojas» de cada sección registrada:
//
//   · <EditorDocumento>: un documento con forma militar (la Apreciación, el Anexo…): 📘 la
//     guía, 🔎 lo que entregaron las otras secciones, 📋 partir de la versión anterior,
//     🌱 traer del calco y de las hojas, 💡 las ideas del oficial, 🤖 la IA con TODO el
//     expediente, 🗺️ lo que toma del calco (con botones para acostar), el documento
//     apartado por apartado con su numeración, 👁️ vista previa y 📄 Word militar;
//   · <AyudaHoja>: arriba de las hojas de trabajo de siempre (filas, dos listas, campos):
//     📘 la guía y 🌱 traer del calco lo que falte (sin pisar).
//
// v3 (G-5): un apartado con texto propio Y subapartados («B.- Fuerzas propias.» del Anexo de
// AC/GM); los CAP se nombran, se agregan y se quitan en la COMPARACIÓN cuando el documento no
// tiene análisis por CAP (la Apreciación de AC/GM); `doc.registro.militar` saca el Word con
// el formato militar común aunque el documento no tenga modelo dedicado en el catálogo (el
// Anexo de AC/GM, como el que ya bajaba la Mesa); `cfg.sinNadaHoja` es el aviso del 🌱 de
// las hojas de trabajo de cada sección.
import * as M from './motor.js'
import { configDe, docDe, guiaHoja, sembrarHoja, tieneSemilla, registroWord } from './registro.js'
import { useState, jsx, jsxs, panelIA, encabezadoIA, corregirIA, wordMilitar, registroMilitar, vistaMilitar, mostrarDocx, useCalco, accion, contexto, verEnCarta } from './runtime.js'

function h(tipo, props, ...hijos) {
  const { key, ...p } = props || {}
  const hs = hijos.flat().filter((x) => x !== null && x !== undefined && x !== false && x !== '')
  if (!hs.length) return jsx(tipo, p, key)
  if (hs.length === 1) return jsx(tipo, { ...p, children: hs[0] }, key)
  return jsxs(tipo, { ...p, children: hs }, key)
}

const estilos = (C) => ({
  raiz: { display: 'flex', flexDirection: 'column', gap: 8, color: '#e6eef6', fontSize: 12 },
  caja: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: 9, display: 'flex', flexDirection: 'column', gap: 6 },
  sub: { fontSize: 10, color: '#8fa2bd', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },
  parrafo: { fontSize: 12, color: C, fontWeight: 700, letterSpacing: 0.3 },
  fila: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  btn: { flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 6, padding: '7px 8px', cursor: 'pointer', fontSize: 12 },
  btnPrin: { flex: 1, minWidth: 140, background: C, color: '#0b1420', border: 'none', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 },
  sembrar: { background: 'rgba(52,211,153,0.10)', color: '#9ff0c8', border: '1px solid rgba(52,211,153,0.5)', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, width: '100%' },
  btnChico: { background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', fontSize: 11, lineHeight: 1.2 },
  btnMas: { background: 'transparent', color: C, border: `1px dashed ${C}88`, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11.5, textAlign: 'left' },
  ayuda: { fontSize: 10.5, color: '#9fb0c8', lineHeight: 1.45 },
  ok: { background: '#12291d', border: '1px solid #2f6b46', color: '#9fe0c0', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  err: { background: '#2a1416', border: '1px solid #6b2f35', color: '#f0b0b6', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  aviso: { background: 'rgba(255,212,122,0.08)', border: '1px solid rgba(255,212,122,0.3)', color: '#ffd47a', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  area: { background: 'rgba(0,0,0,0.4)', color: '#e6eef6', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: '5px 7px', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', lineHeight: 1.35 },
  campo: { width: '100%', boxSizing: 'border-box', background: '#172332', color: '#fff', border: '1px solid #4d5d70', borderRadius: 4, padding: '5px 6px', fontSize: 12, fontFamily: 'inherit' },
  rot: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 11, color: '#b9c9da', marginBottom: 2, fontWeight: 600 },
  numRot: { display: 'inline-block', minWidth: 22, color: C, fontWeight: 700 },
  tarjeta: { background: '#101a27', border: `1px solid ${C}47`, borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 },
  ia: { display: 'inline-flex', gap: 5, alignItems: 'center', background: 'rgba(198,156,255,0.12)', border: '1px solid rgba(198,156,255,0.4)', color: '#d9c2ff', borderRadius: 6, padding: '1px 6px', fontSize: 10.5, fontWeight: 400 },
  instr: { fontSize: 10, color: '#8fa2bd', fontStyle: 'italic', fontWeight: 400 },
  guia: { background: 'rgba(125,211,252,0.06)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 5 },
  guiaTit: { background: 'transparent', border: 'none', color: '#ffd47a', fontWeight: 700, fontSize: 12.5, textAlign: 'left', cursor: 'pointer', padding: 0 },
  guiaLi: { fontSize: 11.5, color: '#dfe7f1', lineHeight: 1.45, marginBottom: 3 },
  cae: { background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.4)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 },
  caeTit: { color: '#c9b3ff', fontWeight: 700, fontSize: 12 },
})
const filasDe = (t, min = 2, max = 10) => Math.min(max, Math.max(min, Math.ceil(String(t || '').length / 46) + (String(t || '').match(/\n/g) || []).length))

// ─── Visor a pantalla completa (va en <body>: el panel lo recortaría) ───────────────
function abrirVisor({ titulo, aviso = '', html = '', dibujar = null, botones = [], color = '#7dd3fc' }) {
  document.getElementById('sid-visor-em')?.remove()
  const velo = document.createElement('div')
  velo.id = 'sid-visor-em'
  velo.setAttribute('role', 'dialog')
  velo.setAttribute('aria-label', titulo)
  Object.assign(velo.style, { position: 'fixed', inset: '0', zIndex: '100000', background: 'rgba(8,12,20,0.94)', display: 'flex', flexDirection: 'column', padding: '8px', boxSizing: 'border-box', gap: '8px' })
  const barra = document.createElement('div')
  Object.assign(barra.style, { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: '#141a29', border: '1px solid #34405a', borderRadius: '8px', padding: '8px', fontFamily: 'system-ui, sans-serif' })
  const tit = document.createElement('b')
  tit.textContent = titulo
  Object.assign(tit.style, { color, fontSize: '13px', flex: '1 1 220px' })
  const estado = document.createElement('span')
  Object.assign(estado.style, { color: '#ffd47a', fontSize: '12px', flex: '1 1 100%' })
  estado.textContent = aviso
  const boton = (texto, principal, f) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = texto
    Object.assign(b.style, principal ? { background: color, color: '#0b1420', border: 'none', borderRadius: '7px', padding: '8px 12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' } : { background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', fontSize: '13px' })
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
    Object.assign(hoja.style, { background: '#fff', maxWidth: '21.6cm', margin: '12px auto', padding: '1.5cm', boxSizing: 'border-box' })
    hoja.innerHTML = html
    marco.append(hoja)
  }
  velo.append(barra, marco)
  document.addEventListener('keydown', tecla)
  document.body.appendChild(velo)
}

function Msg({ E, msg }) {
  return msg ? h('div', { style: E[msg.tipo] || E.ok, role: 'status' }, msg.txt) : null
}
function MarcaIA({ E, activa, onRevisado }) {
  if (!activa) return null
  return h('span', { style: E.ia, title: 'Lo escribió la IA: es una propuesta, no una fuente. No se imprime esta marca.' }, '🤖 revisar', h('button', { style: { ...E.btnChico, padding: '0 5px', fontSize: 10 }, onClick: onRevisado }, '✓ revisado'))
}
function Texto({ E, rot, num = '', valor, onCambio, placeholder = '', min = 2, ia = false, onRevisado, ayuda = '', id = '' }) {
  return h(
    'label',
    { 'data-campo': id || undefined },
    h('span', { style: E.rot }, num && h('span', { style: E.numRot }, num), rot, h(MarcaIA, { E, activa: ia, onRevisado })),
    h('textarea', { style: E.area, rows: filasDe(valor, min), value: valor || '', placeholder: placeholder || ayuda, title: ayuda || undefined, onChange: (e) => onCambio(e.target.value) }),
  )
}
export function Guia({ E, guia, abierta = true }) {
  const [ver, setVer] = useState(abierta)
  if (!guia) return null
  return h(
    'div',
    { style: E.guia, 'data-em': 'guia' },
    h('button', { style: E.guiaTit, onClick: () => setVer(!ver), 'aria-expanded': ver ? 'true' : 'false' }, `${ver ? '▾' : '▸'} 📘 ¿Para qué es y cómo se llena?`),
    ver && h('div', { style: { fontSize: 12, color: '#e6eef6', lineHeight: 1.45 } }, guia.para),
    ver && guia.como?.length > 0 && h('ul', { style: { margin: '2px 0 0 16px', padding: 0 } }, guia.como.map((x, i) => h('li', { key: i, style: E.guiaLi }, x))),
    ver && guia.ejemplo && h('div', { style: { fontSize: 11.5, color: '#ffe3a0' } }, h('b', null, 'Ejemplo: '), guia.ejemplo),
  )
}
function Entregas({ E, items }) {
  const [ver, setVer] = useState(false)
  if (!items?.length) return null
  return h(
    'div',
    { style: E.cae, 'data-em': 'entregas' },
    h('button', { style: { ...E.guiaTit, color: '#c9b3ff' }, onClick: () => setVer(!ver) }, `${ver ? '▾' : '▸'} 🔎 Lo que ya entregaron las otras secciones (${items.map((x) => x.de).join(' · ')})`),
    ver && items.map((e, i) => h('div', { key: i }, h('div', { style: E.caeTit }, e.de), e.items.map(([k, x], j) => h('div', { key: j, style: { fontSize: 11.5, lineHeight: 1.4 } }, h('b', null, `${k}: `), M.sinMarcaIA(x))))),
  )
}
function Revision({ E, items }) {
  const [ver, setVer] = useState(false)
  const errores = items.filter((x) => x.tipo === 'err').length
  return h(
    'div',
    { style: E.caja },
    h('div', { style: { ...E.fila, justifyContent: 'space-between' } }, h('div', { style: E.sub }, items.length ? `Para que quede completo: ${items.length} pendiente(s)${errores ? ` · ${errores} importante(s)` : ''}` : '✓ Tiene todos sus apartados'), items.length > 0 && h('button', { style: E.btnChico, onClick: () => setVer(!ver) }, ver ? '▾ Ocultar' : '▸ Ver')),
    ver && items.map((x, i) => h('div', { key: i, style: x.tipo === 'err' ? E.err : E.aviso }, x.txt)),
  )
}
function BloqueCalco({ E, estado }) {
  if (!estado) return null
  return h(
    'div',
    { style: E.caja, 'data-em': 'calco' },
    h('div', { style: E.sub }, '🗺️ En el calco (lo que esta hoja toma y lo que le falta)'),
    h('div', { style: E.ayuda }, estado.texto),
    h(
      'div',
      { style: E.fila },
      estado.verEnCarta?.length > 0 && h('button', { style: E.btn, onClick: () => verEnCarta(estado.verEnCarta) }, '📍 Ver en la carta'),
      (estado.botones || []).filter((b) => accion(b.accion)).map((b, i) => h('button', { key: i, style: E.btn, onClick: () => accion(b.accion)?.(b.arg) }, b.texto)),
    ),
  )
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
const nombreArchivo = (hoja, def) => `${String(hoja?.num || '').replace(/[^A-Za-z0-9]+/g, '')}_${String(def.archivo || def.titulo).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`

// ════════════════════════════════════════════════════════════════════════════════════
// EL DOCUMENTO
// ════════════════════════════════════════════════════════════════════════════════════
export default function EditorDocumento({ campo = '', hoja = null, valor, onValor, hojas = {}, onExpediente = null, ctxDoc = {} }) {
  const vivo = useCalco()
  const r = docDe(hoja)
  const cfg = r?.campo || configDe(campo)
  const doc = r?.doc
  const [msg, setMsg] = useState(null)
  if (!cfg || !doc) return null
  const E = estilos(cfg.color || '#7dd3fc')
  const def = doc.def
  const ctx = contexto({ campo: cfg.id, hojas, ctxDoc, vivo })
  const fases = (vivo.fasesCOA?.propio || []).map((f) => M.limpio(f?.nombre))
  const v = M.conFases(def, M.normalizar(def, valor), fases)
  const ia = new Set(v.iaCampos)
  const titulo = `${hoja?.num || ''} ${def.titulo}${hoja?.id === 'aprecOrientacion' ? ' (actualizada)' : ''}`.trim()
  const nombre = nombreArchivo(hoja, def)
  const guardar = (nv) => onValor?.(M.normalizar(def, nv))
  const setC = (k, x) => guardar({ ...v, campos: { ...v.campos, [k]: x } })
  const revisado = (k) => guardar({ ...v, iaCampos: v.iaCampos.filter((x) => x !== k) })
  const setCap = (id, f) => guardar({ ...v, caps: v.caps.map((c) => (c.id === id ? f(c) : c)) })
  const firma = typeof doc.firma === 'function' ? doc.firma(ctx) : ''
  const tablas = typeof doc.tablas === 'function' ? doc.tablas(ctx) : {}
  const spec = () => M.especificacion(def, v, { firma, tablas })
  const ctxWord = { ...ctxDoc, g: cfg.id, seccion: cfg.seccionWord || '', firma: firma || '' }
  // sin modelo dedicado en el catálogo: estructura propia con el formato militar común
  const registro = () => registroWord(doc, registroMilitar()?.({ ...(doc.registro || {}), id: doc.registro?.id || hoja?.id, num: hoja?.num || '' }, ctxWord) || null)
  const word = async () => {
    const W = wordMilitar()
    if (!W) return 'El formato militar no está disponible en esta versión de la Mesa.'
    try {
      const x = await W(spec(), nombre, { ctx: ctxWord, registro: registro() })
      return x ? `✓ Word descargado: ${nombre}.docx` : 'No se descargó el Word (se canceló el cuadro de revisión).'
    } catch (e) {
      return `No se pudo generar el Word: ${e?.message || e}`
    }
  }
  const verPrevia = async () => {
    const V = vistaMilitar()
    const Mo = mostrarDocx()
    const bajar = { texto: '📄 Word (formato militar)', principal: true, accion: word }
    const respaldo = () => M.html(def, v, { firma, tablas })
    if (!V || !Mo) return abrirVisor({ titulo, html: respaldo(), botones: [bajar], color: cfg.color, aviso: 'Vista aproximada (sin membrete).' })
    try {
      const x = await V(spec(), nombre, { ctx: ctxWord, registro: registro() })
      if (x?.blob) abrirVisor({ titulo, dibujar: (host) => Mo(x.blob, host), botones: [bajar], color: cfg.color })
      else abrirVisor({ titulo, html: respaldo(), botones: [bajar], color: cfg.color, aviso: 'Vista aproximada (sin membrete).' })
    } catch (e) {
      abrirVisor({ titulo, html: respaldo(), botones: [bajar], color: cfg.color, aviso: `${e?.message || e} — Mientras tanto, el documento sin membrete.` })
    }
  }
  const armar = () => {
    const P = typeof doc.propuestas === 'function' ? doc.propuestas(ctx, hoja) : {}
    const x = M.armar(def, v, P)
    if (!x.cambios.length) return setMsg({ tipo: 'aviso', txt: 'No había nada nuevo que traer.' })
    guardar(x.valor)
    setMsg({ tipo: 'ok', txt: `🌱 Se trajo: ${x.cambios.join(' · ')}` })
  }
  const base = doc.partirDe ? hojas?.[doc.partirDe] : null
  const Panel = panelIA()
  const onPedido = async (modo) =>
    M.pedido(def, v, {
      encabezado: encabezadoIA(),
      expediente: await expedienteDe(onExpediente),
      seccion: cfg.seccionIA,
      producto: typeof doc.producto === 'function' ? doc.producto(ctx, hoja) : '',
      bloques: [
        { titulo: `LO QUE LA MESA YA CALCULÓ Y TIENE EN EL CALCO PARA ${cfg.nombre.toUpperCase()} (son datos: usalos tal cual)`, texto: cfg.datosCalco?.(ctx) || '' },
        { titulo: 'LO QUE YA ENTREGARON LAS OTRAS SECCIONES', texto: cfg.entregasTexto?.(ctx) || '' },
        { titulo: `LO QUE YA DICEN TUS OTRAS HOJAS (${cfg.nombre})`, texto: cfg.otrasHojas?.(ctx, [hoja?.id]) || '' },
      ],
      doctrina: cfg.doctrina?.() || '',
      ideasQue: doc.ideasQue,
      verificacion: doc.verificacion || [],
      modo,
      fasesCOA: fases,
    })
  const onAplicar = (texto, modo) => {
    const x = M.aplicarRespuesta(def, texto, v, { modo, corregir: corregirIA() })
    if (!x.ok) return x
    guardar(x.valor)
    return { ok: true, msg: x.msg }
  }

  // ── El documento, apartado por apartado ──
  const campo_ = (n, num) => h(Texto, { E, key: n.id, id: n.id, rot: n.t, num, ayuda: n.ayuda, valor: v.campos[n.id], onCambio: (x) => setC(n.id, x), ia: ia.has(`campo:${n.id}`), onRevisado: () => revisado(`campo:${n.id}`) })
  const capsUI = (nivel, num0) =>
    v.caps
      .map((c, k) =>
        h(
          'div',
          { key: c.id, style: E.tarjeta, 'data-cap': c.id },
          h('div', { style: E.fila }, h('span', { style: E.numRot }, M.rotNum(nivel, num0 + k)), h('input', { style: { ...E.campo, flex: 1, fontWeight: 700 }, value: c.nombre, 'aria-label': 'Nombre del curso de acción', onChange: (e) => setCap(c.id, (y) => ({ ...y, nombre: e.target.value })) }), v.caps.length > 1 && h('button', { style: E.btnChico, title: 'Quitar este CAP', onClick: () => window.confirm(`¿Quitar el ${c.nombre}?`) && guardar({ ...v, caps: v.caps.filter((x) => x.id !== c.id) }) }, '✕')),
          (def.cap?.porCap || []).map((x, j) => h(Texto, { E, key: x.id, rot: x.t, ayuda: x.ayuda, num: M.rotNum(nivel + 1, j + 1), min: 1, valor: c.valores[x.id], onCambio: (t) => setCap(c.id, (y) => ({ ...y, valores: { ...y.valores, [x.id]: t } })), ia: ia.has(`cap:${c.id}:${x.id}`), onRevisado: () => revisado(`cap:${c.id}:${x.id}`) })),
          c.fases.map((f, kf) =>
            h(
              'div',
              { key: kf, style: { ...E.caja, padding: 7 }, 'data-fase': String(kf) },
              h('div', { style: E.rot }, h('span', { style: E.numRot }, M.rotNum(nivel + 1, (def.cap?.porCap || []).length + kf + 1)), f.nombre),
              (def.cap?.porFase || []).map((x, j) => h(Texto, { E, key: x.id, rot: x.t, ayuda: x.ayuda, num: M.rotNum(nivel + 2, j + 1), min: 1, valor: f.valores[x.id], onCambio: (t) => setCap(c.id, (y) => ({ ...y, fases: y.fases.map((ff, i) => (i === kf ? { ...ff, valores: { ...ff.valores, [x.id]: t } } : ff)) })), ia: ia.has(`cap:${c.id}:f${kf}:${x.id}`), onRevisado: () => revisado(`cap:${c.id}:f${kf}:${x.id}`) })),
            ),
          ),
          (def.cap?.porFase || []).length > 0 && h('button', { style: E.btnMas, onClick: () => setCap(c.id, (y) => ({ ...y, fases: [...y.fases, M.faseVacia(def, y.fases.length)] })) }, '+ Agregar una fase'),
        ),
      )
      .concat([h('button', { key: 'mas', style: E.btnMas, onClick: () => guardar({ ...v, caps: [...v.caps, M.nuevoCap(def, v, Math.max(1, fases.length))] }) }, '+ Agregar curso de acción propio')])
  // Sin análisis por CAP en el documento, los CAP se nombran y se agregan en la comparación.
  const sinAnalisis = !def.arbol.some(function busca(n) {
    return n.caps || (n.hijos || []).some(busca)
  })
  const ventajasUI = (n, num, nivel) =>
    h(
      'div',
      { key: 'ventajas', style: E.tarjeta, 'data-em': 'ventajas' },
      h('div', { style: E.rot }, h('span', { style: E.numRot }, num), n.t),
      v.caps.map((c, k) =>
        h(
          'div',
          { key: c.id, 'data-cap': sinAnalisis ? c.id : undefined },
          sinAnalisis
            ? h('div', { style: E.fila }, h('span', { style: E.numRot }, M.rotNum(nivel + 1, k + 1)), h('input', { style: { ...E.campo, flex: 1, fontWeight: 700 }, value: c.nombre, 'aria-label': 'Nombre del curso de acción', onChange: (e) => setCap(c.id, (y) => ({ ...y, nombre: e.target.value })) }), v.caps.length > 1 && h('button', { style: E.btnChico, title: 'Quitar este CAP', onClick: () => window.confirm(`¿Quitar el ${c.nombre}?`) && guardar({ ...v, caps: v.caps.filter((x) => x.id !== c.id) }) }, '✕'))
            : h('b', { style: { fontSize: 11 } }, `${M.rotNum(nivel + 1, k + 1)} ${c.nombre}`),
          h(Texto, { E, rot: 'Ventajas.', num: M.rotNum(nivel + 2, 1), min: 1, valor: c.ventajas, onCambio: (x) => setCap(c.id, (y) => ({ ...y, ventajas: x })), ia: ia.has(`cap:${c.id}:ventajas`), onRevisado: () => revisado(`cap:${c.id}:ventajas`) }),
          h(Texto, { E, rot: 'Desventajas.', num: M.rotNum(nivel + 2, 2), min: 1, valor: c.desventajas, onCambio: (x) => setCap(c.id, (y) => ({ ...y, desventajas: x })), ia: ia.has(`cap:${c.id}:desventajas`), onRevisado: () => revisado(`cap:${c.id}:desventajas`) }),
        ),
      ),
      sinAnalisis && h('button', { style: E.btnMas, onClick: () => guardar({ ...v, caps: [...v.caps, M.nuevoCap(def, v, Math.max(1, fases.length))] }) }, '+ Agregar curso de acción propio'),
    )
  const nodos = (ns, nivel) => {
    let i = 0
    return ns.flatMap((n, j) => {
      if (n.caps) {
        const out = capsUI(nivel, i + 1)
        i += v.caps.length
        return out
      }
      const num = n.sinNumero ? '' : M.rotNum(nivel, ++i)
      if (n.ventajas) return [ventajasUI(n, num, nivel)]
      if (n.hijos) {
        // (v3) el texto propio del apartado, antes de sus subapartados
        const propio = n.id && h(Texto, { E, id: n.id, rot: '', valor: v.campos[n.id], onCambio: (x) => setC(n.id, x), ia: ia.has(`campo:${n.id}`), onRevisado: () => revisado(`campo:${n.id}`) })
        if (nivel === 0) return [h('div', { key: j, style: E.caja }, h('div', { style: E.parrafo }, `${num} ${n.t}`), propio, nodos(n.hijos, 1))]
        return [h('div', { key: j, style: E.tarjeta }, h('div', { style: E.rot }, h('span', { style: E.numRot }, num), n.t), propio, nodos(n.hijos, nivel + 1))]
      }
      if (nivel === 0) return [h('div', { key: j, style: E.caja }, h('div', { style: E.parrafo }, `${num} ${n.t}`), h(Texto, { E, id: n.id, rot: '', ayuda: n.ayuda, valor: v.campos[n.id], onCambio: (x) => setC(n.id, x), ia: ia.has(`campo:${n.id}`), onRevisado: () => revisado(`campo:${n.id}`) }))]
      return [campo_(n, num)]
    })
  }
  const estado = typeof cfg.estadoCalco === 'function' ? cfg.estadoCalco(ctx) : null
  return h(
    'div',
    { style: E.raiz, 'data-em-doc': hoja?.id || '' },
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.sub }, `${titulo} · ${M.resumen(def, v)}`),
      h('div', { style: E.fila }, h('button', { style: E.btn, onClick: verPrevia }, '👁️ Vista previa'), h('button', { style: E.btnPrin, onClick: async () => setMsg({ tipo: 'ok', txt: await word() }) }, '📄 Word (formato militar)')),
    ),
    h(Msg, { E, msg }),
    h(Guia, { E, guia: guiaHoja(cfg.id, hoja), abierta: false }),
    h(Entregas, { E, items: typeof cfg.entregas === 'function' ? cfg.entregas(ctx) : [] }),
    base && h('div', { style: E.caja }, h('button', { style: E.btn, onClick: () => (guardar(M.partirDe(def, v, base)), setMsg({ tipo: 'ok', txt: `📋 Se copió lo de la ${doc.partirDe === 'aprecActiva' ? 'F1·P3' : 'versión anterior'} en lo que estaba vacío. Ahora actualizala.` })) }, `📋 Partir de la ${doc.partirDe === 'aprecActiva' ? 'F1·P3' : 'versión anterior'} (sin pisar)`)),
    h('div', { style: E.caja }, h('button', { style: E.sembrar, onClick: armar }, '🌱 Traer del calco y de mis hojas lo que falte')),
    h('div', { style: E.caja }, h('div', { style: E.sub }, '💡 Mis ideas'), h('textarea', { style: E.area, rows: filasDe(v.ideas, 3), value: v.ideas, placeholder: doc.ideasEjemplo || 'Lo que querés que diga, lo que te preocupa, qué curso de acción preferís.', onChange: (e) => guardar({ ...v, ideas: e.target.value }) })),
    Panel && h(Panel, { titulo: '🤖 Trabajar esta hoja con IA', nota: '', color: cfg.color, modos: M.MODOS, onPedido, onAplicar }),
    h(BloqueCalco, { E, estado }),
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.parrafo }, `${def.titulo}${def.nivel === 'anexo' ? '' : ` No. ${M.limpio(v.numero) || '01'}`}`),
      h('label', null, h('span', { style: E.rot }, 'Número'), h('input', { style: { ...E.campo, width: 120 }, value: v.numero, placeholder: def.nivel === 'anexo' ? '(lo pide el Word)' : '01', onChange: (e) => guardar({ ...v, numero: e.target.value }) })),
      (def.preliminares || []).map((p) => h(Texto, { E, key: p.id, id: p.id, rot: p.t, ayuda: p.ayuda, min: 1, valor: v.campos[p.id], onCambio: (x) => setC(p.id, x), ia: ia.has(`campo:${p.id}`), onRevisado: () => revisado(`campo:${p.id}`) })),
    ),
    nodos(def.arbol, 0),
    h('div', { style: E.caja }, h('label', null, h('span', { style: E.rot }, 'Firma (vacía = la arma la Mesa)'), h('input', { style: E.campo, value: v.firma, placeholder: firma || 'EL COMANDANTE', onChange: (e) => guardar({ ...v, firma: e.target.value }) }))),
    h(Revision, { E, items: M.revisar(def, v) }),
  )
}

// ════════════════════════════════════════════════════════════════════════════════════
// LAS HOJAS DE TRABAJO DE SIEMPRE: 📘 guía y 🌱
// ════════════════════════════════════════════════════════════════════════════════════
export function AyudaHoja({ campo = '', hoja = null, valor, onValor, hojas = {}, ctxDoc = {} }) {
  const vivo = useCalco()
  const [msg, setMsg] = useState(null)
  const cfg = configDe(campo)
  if (!cfg || !hoja) return null
  const guia = guiaHoja(campo, hoja)
  const semilla = tieneSemilla(campo, hoja)
  if (!guia && !semilla) return null
  const E = estilos(cfg.color || '#7dd3fc')
  const sembrar = () => {
    const ctx = contexto({ campo, hojas, ctxDoc, vivo })
    const r = sembrarHoja(campo, hoja, valor, ctx)
    if (!r.n) return setMsg({ tipo: 'aviso', txt: cfg.sinNadaHoja || 'No había nada nuevo que traer.' })
    onValor?.(r.valor)
    setMsg({ tipo: 'ok', txt: `🌱 Se ${r.n === 1 ? 'agregó 1 entrada' : `agregaron ${r.n} entradas`}` })
  }
  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 6 }, 'data-em': 'ayuda-hoja' },
    h(Guia, { E, guia, abierta: false }),
    semilla && h('button', { style: E.sembrar, onClick: sembrar }, '🌱 Traer del calco lo que falte'),
    h(Msg, { E, msg }),
  )
}
