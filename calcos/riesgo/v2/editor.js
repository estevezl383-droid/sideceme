// Pantalla de la MATRIZ DE ADMINISTRACIÓN DEL RIESGO en el Tablero del G-3
// (F2·P7 y su actualización F6·P3). Se trabaja COMO MATRIZ, con las casillas del
// RO-06-01-04 (Anexo «B»):
//
//   · 👁️ Vista previa y 📄 Word (formato militar): membrete táctico Arial 10 negrilla,
//     SECRETO arriba y abajo, numeración «1 - 2», la matriz y la firma;
//   · 🌱 armarla con lo del ejercicio (misión, grupo fecha/hora, quién la prepara, las
//     tareas de la F2·P3) · 📋 en la actualización, partir de la F2·P7;
//   · 🤖 trabajarla con IA (el mismo panel de las demás hojas, con el expediente entero);
//   · A–D, y por TAREA (E) sus OBSTÁCULOS (F) con la estimación (G), los controles (H),
//     el riesgo residual (I) y cómo se implementan (J); K se calcula solo;
//   · la revisión doctrinaria y el membrete (lo que escribe el oficial manda).
//
// JavaScript sin compilar: React llega por runtime.js (el de la Mesa).
import {
  PROBABILIDAD,
  SEVERIDAD,
  NIVEL,
  NIVELES,
  FACTORES,
  ROTULOS,
  CAMPOS_MEMBRETE,
  CLASIFICACIONES,
  normalizarRiesgo,
  serializar,
  rotulosDe,
  membreteDe,
  lineasMembrete,
  firmaDe,
  tituloDe,
  esActualizacion,
  nivelInicial,
  nivelResidual,
  nivelGeneral,
  revisarRiesgo,
  armarDesdeEjercicio,
  partirDeFaseII,
  tieneRiesgo,
  peligroVacio,
  tareaVacia,
  resumenRiesgo,
  limpio,
} from './modelo.js'
import { paginaRiesgoHTML } from './vista.js'
import { descargarWordRiesgo } from './word.js'
import { MODOS, pedidoRiesgo, aplicarRespuestaRiesgo } from './ia.js'
import { useState, jsx, jsxs, panelIA, encabezadoIA, corregirIA, lineaDeTiempo } from './runtime.js'

function h(tipo, props, ...hijos) {
  const { key, ...p } = props || {}
  const hs = hijos.flat().filter((x) => x !== null && x !== undefined && x !== false)
  if (!hs.length) return jsx(tipo, p, key)
  if (hs.length === 1) return jsx(tipo, { ...p, children: hs[0] }, key)
  return jsxs(tipo, { ...p, children: hs }, key)
}

const VERDE = '#7dffb0'
const E = {
  raiz: { display: 'flex', flexDirection: 'column', gap: 8, color: '#e6eef6', fontSize: 12 },
  caja: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: 9, display: 'flex', flexDirection: 'column', gap: 6 },
  paso: { fontSize: 10, color: '#8fa2bd', textTransform: 'uppercase', letterSpacing: 0.4 },
  intro: { fontSize: 11.5, color: '#b9c9da', lineHeight: 1.45 },
  fila: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  btn: { flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 6, padding: '7px 8px', cursor: 'pointer', fontSize: 12 },
  btnPrin: { flex: 1, minWidth: 140, background: VERDE, color: '#10202a', border: 'none', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 },
  btnChico: { background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', fontSize: 11, lineHeight: 1.2 },
  btnMas: { background: 'transparent', color: VERDE, border: `1px dashed ${VERDE}88`, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11.5, textAlign: 'left' },
  opcion: { flex: 1, minWidth: 140, textAlign: 'left', background: '#0e1320', color: '#cdd8e8', border: '1px solid #34405a', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', fontSize: 11.5, lineHeight: 1.3 },
  opcionOn: { background: '#16301f', color: '#fff', borderColor: VERDE, boxShadow: `0 0 0 1px ${VERDE}55` },
  ayuda: { fontSize: 10.5, color: '#9fb0c8', lineHeight: 1.4, fontStyle: 'italic' },
  ok: { background: '#12291d', border: '1px solid #2f6b46', color: '#9fe0c0', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  err: { background: '#2a1416', border: '1px solid #6b2f35', color: '#f0b0b6', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  aviso: { background: 'rgba(255,212,122,0.08)', border: '1px solid rgba(255,212,122,0.3)', color: '#ffd47a', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  area: { background: 'rgba(0,0,0,0.4)', color: '#e6eef6', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: '5px 7px', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', lineHeight: 1.35 },
  campo: { width: '100%', boxSizing: 'border-box', background: '#172332', color: '#fff', border: '1px solid #4d5d70', borderRadius: 4, padding: '5px 6px', fontSize: 12, fontFamily: 'inherit' },
  sel: { background: '#172332', color: '#fff', border: '1px solid #4d5d70', borderRadius: 4, padding: '4px 5px', fontSize: 11.5, fontFamily: 'inherit', maxWidth: '100%' },
  rot: { display: 'block', fontSize: 11, color: '#b9c9da', marginBottom: 2, fontWeight: 600 },
  letra: { display: 'inline-block', minWidth: 18, textAlign: 'center', background: 'rgba(125,255,176,0.14)', color: VERDE, borderRadius: 4, padding: '0 4px', marginRight: 5, fontWeight: 700, fontSize: 11 },
  tarea: { background: '#101a27', border: '1px solid rgba(125,255,176,0.28)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 },
  peligro: { background: '#0c131e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: 7, display: 'flex', flexDirection: 'column', gap: 6 },
  cab: { display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  memb: { background: '#fff', color: '#000', borderRadius: 4, padding: '8px 10px', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 11, fontWeight: 700, lineHeight: 1.3 },
  ia: { display: 'inline-flex', gap: 6, alignItems: 'center', background: 'rgba(198,156,255,0.12)', border: '1px solid rgba(198,156,255,0.4)', color: '#d9c2ff', borderRadius: 6, padding: '3px 7px', fontSize: 11 },
  antes: { fontSize: 10.5, color: '#c8b27a', background: 'rgba(255,212,122,0.06)', borderRadius: 5, padding: '4px 6px', lineHeight: 1.4 },
  item: { display: 'flex', gap: 4, alignItems: 'flex-start' },
}

// ─── Visor a pantalla completa (va en <body>: el panel del Tablero lo recortaría) ───
function abrirVisor(html, { titulo, onWord }) {
  document.getElementById('sid-visor-riesgo')?.remove()
  const velo = document.createElement('div')
  velo.id = 'sid-visor-riesgo'
  velo.setAttribute('role', 'dialog')
  velo.setAttribute('aria-label', titulo)
  Object.assign(velo.style, { position: 'fixed', inset: '0', zIndex: '100000', background: 'rgba(8,12,20,0.94)', display: 'flex', flexDirection: 'column', padding: '8px', boxSizing: 'border-box', gap: '8px' })
  const barra = document.createElement('div')
  Object.assign(barra.style, { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: '#141a29', border: '1px solid #34405a', borderRadius: '8px', padding: '8px', fontFamily: 'system-ui, sans-serif' })
  const tit = document.createElement('b')
  tit.textContent = titulo
  Object.assign(tit.style, { color: VERDE, fontSize: '13px', flex: '1 1 220px' })
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
  barra.append(
    tit,
    boton('📄 Word (formato militar)', true, () => {
      estado.textContent = onWord()
    }),
    boton('✕ Cerrar', false, cerrar),
    estado,
  )
  const marco = document.createElement('iframe')
  marco.title = titulo
  marco.srcdoc = html
  Object.assign(marco.style, { flex: '1 1 auto', width: '100%', border: 'none', borderRadius: '6px', background: '#5d6470' })
  velo.append(barra, marco)
  document.addEventListener('keydown', tecla)
  document.body.appendChild(velo)
}

const filasDe = (t, min = 2, max = 8) => Math.min(max, Math.max(min, Math.ceil(String(t || '').length / 46) + (String(t || '').match(/\n/g) || []).length))
const letraDe = (rot) => String(rot).split(/[.\s]/)[0]
const quitarRotulo = (rot) => String(rot).replace(/^[A-Z0-9]+\.\s*/, '').replace(/:$/, '')

function Chip({ nivel }) {
  const n = NIVEL[nivel]
  if (!n) return h('span', { style: { fontSize: 11, color: '#8fa2bd' } }, '— sin estimar')
  return h('span', { style: { display: 'inline-block', background: n.color, color: '#fff', borderRadius: 10, padding: '2px 9px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' } }, `${n.nom.toUpperCase()} (${n.id})`)
}

function Estimacion({ titulo, prob, sev, onProb, onSev }) {
  return h(
    'div',
    null,
    h('span', { style: E.rot }, titulo),
    h(
      'div',
      { style: E.fila },
      h(
        'select',
        { style: E.sel, value: prob || '', onChange: (e) => onProb(e.target.value), 'aria-label': `${titulo}: probabilidad` },
        h('option', { value: '' }, 'Probabilidad…'),
        PROBABILIDAD.map((p) => h('option', { key: p.id, value: p.id, title: p.txt }, `${p.id} · ${p.nom}`)),
      ),
      h(
        'select',
        { style: E.sel, value: sev || '', onChange: (e) => onSev(e.target.value), 'aria-label': `${titulo}: severidad` },
        h('option', { value: '' }, 'Severidad…'),
        SEVERIDAD.map((s) => h('option', { key: s.id, value: s.id, title: s.txt }, `${s.id} · ${s.nom}`)),
      ),
      h('span', null, '→ '),
      h(Chip, { nivel: prob && sev ? nivelDeLetras(prob, sev) : '' }),
    ),
  )
}
const nivelDeLetras = (prob, sev) => nivelInicial({ prob, sev })

function ListaEditable({ titulo, items, placeholder, onCambio, textoMas }) {
  const xs = items.length ? items : ['']
  return h(
    'div',
    null,
    h('span', { style: E.rot }, titulo),
    xs.map((x, i) =>
      h(
        'div',
        { key: i, style: { ...E.item, marginBottom: 4 } },
        h('textarea', {
          style: E.area,
          rows: filasDe(x, 1, 6),
          value: x,
          placeholder,
          onChange: (e) => {
            const n = [...xs]
            n[i] = e.target.value
            onCambio(n)
          },
        }),
        (items.length > 1 || limpio(x)) &&
          h('button', { style: E.btnChico, title: 'Quitar', onClick: () => onCambio(xs.filter((_, j) => j !== i)) }, '✕'),
      ),
    ),
    h('button', { style: E.btnMas, onClick: () => onCambio([...xs.map((x) => x), '']) }, textoMas),
  )
}

export default function EditorRiesgo({ hoja = null, valor, onValor, ctx = null, onExpediente = null }) {
  // El id de la hoja numera el documento (la F2·P7 y la F6·P3 son dos documentos).
  const c = { ...(ctx || {}), hojaId: hoja?.id || 'riesgo' }
  const v = normalizarRiesgo(valor)
  const R = rotulosDe(v)
  const act = esActualizacion(hoja)
  const [msg, setMsg] = useState(null)
  const [verMembrete, setVerMembrete] = useState(false)
  const [verRevision, setVerRevision] = useState(false)
  const m = membreteDe(v, c)
  const g = nivelGeneral(v)
  const revision = revisarRiesgo(v, { hoja })
  const titulo = `${hoja?.num || 'F2·P7'} ${tituloDe(hoja)}`

  const guardar = (nv) => onValor?.(serializar(nv))
  const set = (k, x) => guardar({ ...v, [k]: x })
  const conTareas = (fn) => guardar({ ...v, tareas: fn(v.tareas.map((t) => ({ ...t, peligros: [...t.peligros] }))) })
  const setTarea = (tid, cambios) => conTareas((ts) => ts.map((t) => (t.id === tid ? { ...t, ...cambios } : t)))
  const setPeligro = (tid, pid, cambios) => conTareas((ts) => ts.map((t) => (t.id === tid ? { ...t, peligros: t.peligros.map((p) => (p.id === pid ? { ...p, ...cambios } : p)) } : t)))
  const mover = (lista, i, d) => {
    const j = i + d
    if (j < 0 || j >= lista.length) return lista
    const n = [...lista]
    ;[n[i], n[j]] = [n[j], n[i]]
    return n
  }

  const word = () => {
    try {
      const nombre = descargarWordRiesgo(v, { ctx: c, hoja })
      return `✓ Word descargado: ${nombre}`
    } catch (e) {
      return `No se pudo generar el Word: ${e?.message || e}`
    }
  }
  const armar = () => {
    const r = armarDesdeEjercicio(v, c, { lineaDeTiempo: lineaDeTiempo(), hoja })
    if (!r.cambios.length) {
      setMsg({ tipo: 'aviso', txt: 'No había nada nuevo que traer del ejercicio: lo que la Mesa encontró ya está en la matriz (no se pisa lo escrito). Cargá la Orden del escalón superior, la Línea Inicial de Tiempo, la reexpresión de la misión y las tareas (F2·P3), o trabajala con la IA.' })
      return
    }
    guardar(r.valor)
    setMsg({ tipo: 'ok', txt: `🌱 Se trajo del ejercicio: ${r.cambios.join(' · ')}. Los obstáculos de cada tarea los identificás vos o la IA (con el expediente entero).` })
  }
  const traerFaseII = () => {
    const r = partirDeFaseII(v, c.g3?.riesgo)
    if (!r.n) {
      setMsg({ tipo: 'aviso', txt: tieneRiesgo(c.g3?.riesgo) ? 'Las tareas de la F2·P7 ya están en la actualización.' : 'La matriz de la fase II (F2·P7) todavía está vacía.' })
      return
    }
    guardar(r.valor)
    setMsg({ tipo: 'ok', txt: `📋 Se trajeron ${r.n} tarea(s) de la F2·P7 con sus obstáculos. Ahora reevaluálos con el curso de acción aprobado.` })
  }

  const Panel = panelIA()
  const onPedido = async (modo) => {
    let exp = null
    try {
      exp = await onExpediente?.({ conCoc: true })
    } catch {
      try {
        exp = await onExpediente?.()
      } catch {}
    }
    return pedidoRiesgo(v, { expediente: exp?.md || '', ctx: c, hoja, modo, encabezado: encabezadoIA(), lineaDeTiempo: lineaDeTiempo() })
  }
  const onAplicar = (texto, modo) => {
    const r = aplicarRespuestaRiesgo(texto, v, { modo, corregir: corregirIA() })
    if (!r.ok) return r
    guardar(r.valor)
    return { ok: true, msg: r.msg }
  }

  const iaRevisar = v.tareas.reduce((s, t) => s + t.peligros.filter((p) => p.ia).length, 0)
  const nPeligros = v.tareas.reduce((s, t) => s + t.peligros.length, 0)
  const errores = revision.filter((x) => x.tipo === 'err').length

  return h(
    'div',
    { style: E.raiz, 'data-hoja': 'matriz-riesgo' },
    // ── Documento ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, `${titulo} · ${resumenRiesgo(v)}`),
      h(
        'div',
        { style: E.fila },
        h('button', { style: E.btn, onClick: () => abrirVisor(paginaRiesgoHTML(v, { ctx: c, hoja }), { titulo, onWord: word }) }, '👁️ Vista previa'),
        h('button', { style: E.btnPrin, title: 'Membrete táctico, SECRETO, la matriz y la firma: listo para firmar', onClick: () => setMsg({ tipo: 'ok', txt: word() }) }, '📄 Word (formato militar)'),
      ),
      h('div', { style: E.ayuda }, `Sale como la hoja de trabajo del ${'RO-06-01-04'} (Anexo «B»): carta apaisada, membrete táctico en Arial 10 negrilla, ${m.clasificacion} arriba y abajo de cada página, numeración «1 - 2» al pie y la firma del Comandante.`),
    ),
    msg && h('div', { style: E[msg.tipo] || E.ok }, msg.txt),
    v.legado &&
      h(
        'div',
        { style: E.aviso },
        'Esta hoja estaba en el formato anterior (una lista de renglones). Cada renglón quedó como un obstáculo de una tarea SIN NOMBRE, y lo que decía queda a la vista («Antes decía…»): escribí la tarea, estimá cada obstáculo con letras y completá el residual. ',
        h('button', { style: { ...E.btnChico, marginTop: 4 }, onClick: () => guardar({ ...v, legado: false }) }, 'Entendido'),
      ),
    // ── Armar ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, '1 · Lo que ya tiene el ejercicio'),
      h(
        'div',
        { style: E.fila },
        h('button', { style: E.btn, onClick: armar }, '🌱 Armar con lo del ejercicio'),
        act && h('button', { style: E.btn, onClick: traerFaseII }, '📋 Partir de la matriz de la fase II (F2·P7)'),
      ),
      h('div', { style: E.ayuda }, 'Trae la misión, el grupo fecha/hora (Línea Inicial de Tiempo o la misión), la fecha de preparación, quién la prepara y las tareas de la F2·P3. No pisa nada de lo que ya está escrito.'),
    ),
    // ── IA ──
    Panel &&
      h(Panel, {
        titulo: '🤖 Trabajar esta hoja con IA',
        nota: 'Le manda el expediente completo del ejercicio —la orden del escalón superior (tema base), los documentos aportados, el terreno con el COC y el CMOC, la meteorología, el enemigo y las hojas de trabajo de todo el Estado Mayor— y el método del RO-06-01-04. Devuelve la MATRIZ: tareas, obstáculos por MATT-TCE, estimación, controles, riesgo residual y cómo implementarlos.',
        color: VERDE,
        modos: MODOS,
        onPedido,
        onAplicar,
      }),
    // ── Rótulos ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, 'Rótulos de las casillas'),
      h(
        'div',
        { style: E.fila },
        Object.entries(ROTULOS).map(([id, r]) => h('button', { key: id, style: { ...E.opcion, ...(v.rotulos === id ? E.opcionOn : null) }, onClick: () => set('rotulos', id) }, r.nom)),
      ),
    ),
    // ── Membrete ──
    h(
      'div',
      { style: E.caja },
      h(
        'div',
        { style: E.cab },
        h('div', { style: E.paso }, 'Membrete táctico (Arial 10 negrilla) y firma'),
        h('button', { style: E.btnChico, onClick: () => setVerMembrete(!verMembrete) }, verMembrete ? '▾ Cerrar' : '✏️ Corregir'),
      ),
      h(
        'div',
        { style: E.memb },
        h('div', { style: { textAlign: 'center', marginBottom: 4 } }, m.clasificacion),
        lineasMembrete(m).map((l, i) => h('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' } }, h('span', null, l.izq), l.der && h('span', null, l.der))),
      ),
      !limpio(m.unidad) && h('div', { style: E.aviso }, 'Falta la UNIDAD CONSIDERADA: cargala en la Orden del escalón superior («Unidad considerada») o escribila acá.'),
      verMembrete &&
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
          CAMPOS_MEMBRETE.map(([k, rot]) =>
            h(
              'label',
              { key: k },
              h('span', { style: E.rot }, rot),
              k === 'clasificacion'
                ? h(
                    'select',
                    { style: E.campo, value: v.membrete.clasificacion || m.defecto.clasificacion, onChange: (e) => set('membrete', { ...v.membrete, clasificacion: e.target.value }) },
                    CLASIFICACIONES.map((x) => h('option', { key: x, value: x }, x)),
                  )
                : h('input', {
                    style: E.campo,
                    value: v.membrete[k] || '',
                    placeholder: m.defecto[k] ? `${m.defecto[k]} — ${m.fuentes[k]}` : 'SIN DATO en el ejercicio: escribilo',
                    onChange: (e) => set('membrete', { ...v.membrete, [k]: e.target.value }),
                  }),
            ),
          ),
          h('label', null, h('span', { style: E.rot }, 'Firma'), h('input', { style: E.campo, value: v.firma, placeholder: firmaDe({ ...v, firma: '' }, c), onChange: (e) => set('firma', e.target.value) })),
          h('div', { style: E.ayuda }, 'Vacío = lo que sale de la Orden del escalón superior (se ve en gris). Lo que escribas acá manda.'),
        ),
    ),
    // ── A · B · C · D ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, `${letraDe(R.A)} – ${letraDe(R.D)} · Encabezado de la matriz`),
      h('label', null, h('span', { style: E.rot }, h('span', { style: E.letra }, letraDe(R.A)), quitarRotulo(R.A)), h('textarea', { style: E.area, rows: filasDe(v.mision, 2, 6), value: v.mision, placeholder: 'La misión reexpresada (QUIÉN, QUÉ, CUÁNDO, DÓNDE y PARA QUÉ)', onChange: (e) => set('mision', e.target.value) })),
      h(
        'div',
        { style: E.fila },
        h('label', { style: { flex: '1 1 140px' } }, h('span', { style: E.rot }, h('span', { style: E.letra }, letraDe(R.B)), `${quitarRotulo(R.B)} · ${R.empieza.replace(/:$/, '').toLowerCase()}`), h('input', { style: E.campo, value: v.empieza, placeholder: 'D (0500)', onChange: (e) => set('empieza', e.target.value) })),
        h('label', { style: { flex: '1 1 140px' } }, h('span', { style: E.rot }, `${R.termina.replace(/:$/, '').toLowerCase()}`), h('input', { style: E.campo, value: v.termina, placeholder: 'D+1 (1800)', onChange: (e) => set('termina', e.target.value) })),
        h('label', { style: { flex: '1 1 140px' } }, h('span', { style: E.rot }, h('span', { style: E.letra }, letraDe(R.C)), quitarRotulo(R.C)), h('input', { style: E.campo, value: v.preparacion, placeholder: 'D-6 (0900)', onChange: (e) => set('preparacion', e.target.value) })),
      ),
      h('label', null, h('span', { style: E.rot }, h('span', { style: E.letra }, letraDe(R.D)), `${quitarRotulo(R.D)} (grado, apellido y cargo)`), h('input', { style: E.campo, value: v.preparadoPor, placeholder: `G-3 ${m.unidad ? `DE LA ${m.unidad}` : 'DE LA UNIDAD'}`, onChange: (e) => set('preparadoPor', e.target.value) })),
    ),
    // ── E … J ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, `${letraDe(R.E)} – ${letraDe(R.J)} · La matriz: cada tarea con sus obstáculos`),
      !v.tareas.length && h('div', { style: E.ayuda }, 'Todavía no hay tareas. 🌱 Traelas de la F2·P3, pedíselas a la IA o agregalas acá.'),
      v.tareas.map((t, i) =>
        h(
          'div',
          { key: t.id, style: E.tarea, 'data-tarea': t.id },
          h(
            'div',
            { style: E.cab },
            h('span', { style: { ...E.rot, marginBottom: 0 } }, h('span', { style: E.letra }, letraDe(R.E)), `${quitarRotulo(R.E)} ${i + 1}`),
            h(
              'span',
              { style: E.fila },
              h('button', { style: E.btnChico, title: 'Subir', onClick: () => conTareas((ts) => mover(ts, i, -1)) }, '↑'),
              h('button', { style: E.btnChico, title: 'Bajar', onClick: () => conTareas((ts) => mover(ts, i, 1)) }, '↓'),
              h(
                'button',
                {
                  style: E.btnChico,
                  title: 'Quitar la tarea',
                  onClick: () => {
                    if ((t.peligros.length || limpio(t.tarea)) && typeof window !== 'undefined' && !window.confirm(`¿Quitar la tarea «${limpio(t.tarea) || i + 1}» con sus ${t.peligros.length} obstáculo(s)?`)) return
                    conTareas((ts) => ts.filter((x) => x.id !== t.id))
                  },
                },
                '✕',
              ),
            ),
          ),
          h('textarea', { style: E.area, rows: filasDe(t.tarea, 1, 3), value: t.tarea, placeholder: 'Tarea de la misión (p. ej. «Ocupar la posición defensiva», «Reconocimientos en el terreno», «Trabajos de OT»)', onChange: (e) => setTarea(t.id, { tarea: e.target.value }) }),
          t.peligros.map((p, j) => {
            const ni = nivelInicial(p)
            const nr = nivelResidual(p)
            return h(
              'div',
              { key: p.id, style: E.peligro, 'data-peligro': p.id },
              h(
                'div',
                { style: E.cab },
                h('span', { style: { ...E.rot, marginBottom: 0 } }, h('span', { style: E.letra }, letraDe(R.F)), `Obstáculo ${j + 1}`, ' ', h(Chip, { nivel: nr || ni })),
                h(
                  'span',
                  { style: E.fila },
                  h('button', { style: E.btnChico, title: 'Subir', onClick: () => setTarea(t.id, { peligros: mover(t.peligros, j, -1) }) }, '↑'),
                  h('button', { style: E.btnChico, title: 'Bajar', onClick: () => setTarea(t.id, { peligros: mover(t.peligros, j, 1) }) }, '↓'),
                  h(
                    'button',
                    {
                      style: E.btnChico,
                      title: 'Quitar el obstáculo',
                      onClick: () => {
                        if (limpio(p.peligro) && typeof window !== 'undefined' && !window.confirm(`¿Quitar el obstáculo «${limpio(p.peligro)}»?`)) return
                        setTarea(t.id, { peligros: t.peligros.filter((x) => x.id !== p.id) })
                      },
                    },
                    '✕',
                  ),
                ),
              ),
              p.ia &&
                h(
                  'div',
                  { style: E.ia },
                  '🤖 Lo propuso la IA: revisalo.',
                  h('button', { style: E.btnChico, onClick: () => setPeligro(t.id, p.id, { ia: false }) }, '✓ Revisado'),
                ),
              p.antes && h('div', { style: E.antes }, `Antes decía: ${Object.entries(p.antes).map(([k, x]) => `${k} «${x}»`).join(' · ')}`),
              h('label', null, h('span', { style: E.rot }, quitarRotulo(R.F)), h('textarea', { style: E.area, rows: filasDe(p.peligro, 1, 4), value: p.peligro, placeholder: 'Qué puede pasar, dónde, a quién y cuándo (concreto, del ejercicio)', onChange: (e) => setPeligro(t.id, p.id, { peligro: e.target.value }) })),
              h(
                'div',
                { style: E.fila },
                h('span', { style: { fontSize: 11, color: '#b9c9da' } }, 'Factor MATT-TCE (paso 1):'),
                h(
                  'select',
                  { style: E.sel, value: p.factor || '', onChange: (e) => setPeligro(t.id, p.id, { factor: e.target.value }) },
                  h('option', { value: '' }, '—'),
                  FACTORES.map((f) => h('option', { key: f.id, value: f.id, title: f.ayuda }, f.nom)),
                ),
              ),
              h(Estimacion, { titulo: `${letraDe(R.G)} · ${quitarRotulo(R.G)} (probabilidad × severidad → Figura 6)`, prob: p.prob, sev: p.sev, onProb: (x) => setPeligro(t.id, p.id, { prob: x }), onSev: (x) => setPeligro(t.id, p.id, { sev: x }) }),
              h(ListaEditable, { titulo: `${letraDe(R.H)} · ${quitarRotulo(R.H)} — quién, qué, dónde, cuándo y cómo`, items: p.controles, placeholder: 'QUIÉN hace QUÉ, DÓNDE, CUÁNDO y CÓMO', onCambio: (x) => setPeligro(t.id, p.id, { controles: x }), textoMas: '+ Medida de control' }),
              h(Estimacion, { titulo: `${letraDe(R.I)} · ${quitarRotulo(R.I)} (con el control puesto)`, prob: p.probRes, sev: p.sevRes, onProb: (x) => setPeligro(t.id, p.id, { probRes: x }), onSev: (x) => setPeligro(t.id, p.id, { sevRes: x }) }),
              ni && nr && NIVEL[nr].orden > NIVEL[ni].orden && h('div', { style: E.err }, 'El residual quedó MÁS ALTO que el inicial: un control no puede aumentar el riesgo.'),
              h(ListaEditable, { titulo: `${letraDe(R.J)} · ${quitarRotulo(R.J)}`, items: p.implementar, placeholder: 'Párrafo o anexo de la orden, PON, ensayo, instrucción; con quién se coordina', onCambio: (x) => setPeligro(t.id, p.id, { implementar: x }), textoMas: '+ Cómo se implementa' }),
              h('label', null, h('span', { style: { ...E.rot, fontWeight: 400 } }, 'De dónde sale (no se imprime)'), h('input', { style: E.campo, value: p.fuente, placeholder: '§ del expediente o documento aportado', onChange: (e) => setPeligro(t.id, p.id, { fuente: e.target.value }) })),
            )
          }),
          h('button', { style: E.btnMas, onClick: () => setTarea(t.id, { peligros: [...t.peligros, peligroVacio()] }) }, `+ Obstáculo (peligro) para esta tarea`),
        ),
      ),
      h('button', { style: E.btnMas, onClick: () => conTareas((ts) => [...ts, tareaVacia()]) }, '+ Tarea'),
    ),
    // ── K ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, `${letraDe(R.K)} · Nivel general de la misión (se calcula solo: el MAYOR riesgo residual)`),
      h(
        'div',
        { style: { ...E.fila, justifyContent: 'space-around', background: '#fff', color: '#000', borderRadius: 4, padding: '8px 4px', fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 700, fontSize: 11 } },
        NIVELES.map((n) => h('span', { key: n.id, style: { padding: '3px 9px', whiteSpace: 'nowrap', ...(n.id === g.nivel ? { border: '2px solid #000', borderRadius: '50%' } : null) } }, n.rotulo)),
      ),
      g.nivel ? h('div', { style: E.ayuda }, `Sale de: ${g.desde.map((x) => `«${x}»`).join(', ')}. Lo acepta (o no) el Comandante: si es muy alto, ordena más controles o cambia el curso de acción.`) : h('div', { style: E.ayuda }, 'Todavía no hay ningún obstáculo estimado.'),
    ),
    // ── Revisión ──
    h(
      'div',
      { style: E.caja },
      h(
        'div',
        { style: E.cab },
        h('div', { style: E.paso }, `Revisión (RO-06-01-04) · ${errores ? `${errores} a corregir` : 'sin errores'}${iaRevisar ? ` · ${iaRevisar} de la IA por revisar` : ''} · ${nPeligros} obstáculo(s)`),
        revision.length > 3 && h('button', { style: E.btnChico, onClick: () => setVerRevision(!verRevision) }, verRevision ? '▾ Menos' : `▸ Ver las ${revision.length}`),
      ),
      (verRevision ? revision : revision.slice(0, 3)).map((x, i) => h('div', { key: i, style: x.tipo === 'err' ? E.err : x.tipo === 'aviso' ? E.aviso : E.ok }, `${x.tipo === 'err' ? '⛔' : x.tipo === 'aviso' ? '⚠️' : 'ℹ️'} ${x.txt}`)),
    ),
    h('div', { style: { ...E.ayuda, fontStyle: 'normal', textAlign: 'right' } }, 'Matriz de riesgo · versión 1 (29-09) · RO-06-01-04, Anexo «B».'),
  )
}
