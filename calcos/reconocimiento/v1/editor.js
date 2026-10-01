// Pantalla de la ORDEN DE RECONOCIMIENTO (F2·P9) en el Tablero del G-3. Se trabaja la
// orden COMPLETA, apartado por apartado, en el orden en que se imprime:
//
//   · 👁️ Vista previa (el Word real) y 📄 Word (formato militar): el membrete de la Mesa,
//     OBJETO / CARTA / ANEXOS, el cuadro de ORGANIZACIÓN DE LA TAREA, los párrafos I a V,
//     la firma del Comandante, la autenticación y la distribución;
//   · 🌱 traer del calco lo que falte (los órganos de reconocimiento con su alcance);
//   · 💡 las ideas del oficial sobre cómo quiere el reconocimiento (van a la IA);
//   · 🤖 trabajarla con IA (el mismo panel de las demás hojas, con el expediente entero);
//   · cada apartado se puede escribir o corregir a mano: lo que escribe el oficial manda.
//
// JavaScript sin compilar: React llega por runtime.js (el de la Mesa).
import {
  TITULO,
  FONETICO,
  FORMA_INTRO,
  OBTENER,
  normalizarOrden,
  serializar,
  equipoVacio,
  rotuloEquipo,
  nombreEquipo,
  armarDesdeEjercicio,
  revisarOrden,
  resumenOrden,
  firmaDe,
  distribucionDe,
  plazosDeEquipos,
  lista,
  limpio,
  nuevoId,
} from './modelo.js'
import { especificacionOrden, ordenHTML } from './documento.js'
import { MODOS, pedidoOrden, aplicarRespuestaOrden } from './ia.js'
import { useState, jsx, jsxs, panelIA, encabezadoIA, corregirIA, semilla, wordMilitar, registroMilitar, vistaMilitar, mostrarDocx } from './runtime.js'

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
  parrafo: { fontSize: 12, color: VERDE, fontWeight: 700, letterSpacing: 0.3 },
  fila: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  btn: { flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 6, padding: '7px 8px', cursor: 'pointer', fontSize: 12 },
  btnPrin: { flex: 1, minWidth: 140, background: VERDE, color: '#10202a', border: 'none', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 },
  btnChico: { background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', fontSize: 11, lineHeight: 1.2 },
  btnMas: { background: 'transparent', color: VERDE, border: `1px dashed ${VERDE}88`, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11.5, textAlign: 'left' },
  ayuda: { fontSize: 10.5, color: '#9fb0c8', lineHeight: 1.4, fontStyle: 'italic' },
  ok: { background: '#12291d', border: '1px solid #2f6b46', color: '#9fe0c0', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  err: { background: '#2a1416', border: '1px solid #6b2f35', color: '#f0b0b6', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  aviso: { background: 'rgba(255,212,122,0.08)', border: '1px solid rgba(255,212,122,0.3)', color: '#ffd47a', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  area: { background: 'rgba(0,0,0,0.4)', color: '#e6eef6', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: '5px 7px', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', lineHeight: 1.35 },
  campo: { width: '100%', boxSizing: 'border-box', background: '#172332', color: '#fff', border: '1px solid #4d5d70', borderRadius: 4, padding: '5px 6px', fontSize: 12, fontFamily: 'inherit' },
  rot: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 11, color: '#b9c9da', marginBottom: 2, fontWeight: 600 },
  num: { display: 'inline-block', minWidth: 22, color: VERDE, fontWeight: 700 },
  equipo: { background: '#101a27', border: '1px solid rgba(125,255,176,0.28)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 },
  cab: { display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  ia: { display: 'inline-flex', gap: 5, alignItems: 'center', background: 'rgba(198,156,255,0.12)', border: '1px solid rgba(198,156,255,0.4)', color: '#d9c2ff', borderRadius: 6, padding: '1px 6px', fontSize: 10.5, fontWeight: 400 },
  antes: { fontSize: 10.5, color: '#c8b27a', background: 'rgba(255,212,122,0.06)', borderRadius: 5, padding: '4px 6px', lineHeight: 1.4 },
  item: { display: 'flex', gap: 4, alignItems: 'flex-start' },
  cuadro: { width: '100%', borderCollapse: 'collapse', background: '#fff', color: '#000', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 10.5 },
  th: { border: '1px solid #000', padding: '3px 5px', textAlign: 'center', fontWeight: 700 },
  td: { border: '1px solid #000', padding: '3px 5px', verticalAlign: 'top' },
}

const filasDe = (t, min = 2, max = 10) => Math.min(max, Math.max(min, Math.ceil(String(t || '').length / 42) + (String(t || '').match(/\n/g) || []).length))
const LETRAS = 'abcdefghijklmnopqrstuvwxyz'
const marca = { a: (i) => `${LETRAS[i % 26]}.-`, '1': (i) => `${i + 1}.-`, '-': () => '-' }

// ─── Visor a pantalla completa (va en <body>: el panel del Tablero lo recortaría) ───
function abrirVisor({ titulo, aviso = '', html = '', dibujar = null, onWord }) {
  document.getElementById('sid-visor-reco')?.remove()
  const velo = document.createElement('div')
  velo.id = 'sid-visor-reco'
  velo.setAttribute('role', 'dialog')
  velo.setAttribute('aria-label', titulo)
  Object.assign(velo.style, { position: 'fixed', inset: '0', zIndex: '100000', background: 'rgba(8,12,20,0.94)', display: 'flex', flexDirection: 'column', padding: '8px', boxSizing: 'border-box', gap: '8px' })
  const barra = document.createElement('div')
  Object.assign(barra.style, { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: '#141a29', border: '1px solid #34405a', borderRadius: '8px', padding: '8px', fontFamily: 'system-ui, sans-serif' })
  const tit = document.createElement('b')
  tit.textContent = titulo
  Object.assign(tit.style, { color: VERDE, fontSize: '13px', flex: '1 1 220px' })
  const estado = document.createElement('span')
  Object.assign(estado.style, { color: '#ffd47a', fontSize: '12px', flex: '1 1 100%' })
  estado.textContent = aviso
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
    boton('📄 Word (formato militar)', true, async () => {
      estado.style.color = '#9fe0c0'
      estado.textContent = '⏳ Armando el Word…'
      estado.textContent = await onWord()
    }),
    boton('✕ Cerrar', false, cerrar),
    estado,
  )
  const marco = document.createElement('div')
  Object.assign(marco.style, { flex: '1 1 auto', width: '100%', overflow: 'auto', borderRadius: '6px', background: '#5d6470' })
  if (dibujar) {
    dibujar(marco).catch((e) => {
      estado.textContent = `No se pudo dibujar el Word: ${e?.message || e}`
    })
  } else {
    const hoja = document.createElement('div')
    Object.assign(hoja.style, { background: '#fff', maxWidth: '21.6cm', margin: '12px auto', padding: '2cm 2cm 2cm 3cm', boxSizing: 'border-box' })
    hoja.innerHTML = html
    marco.append(hoja)
  }
  velo.append(barra, marco)
  document.addEventListener('keydown', tecla)
  document.body.appendChild(velo)
}

function MarcaIA({ activa, onRevisado }) {
  if (!activa) return null
  return h('span', { style: E.ia, title: 'Lo escribió la IA: es una propuesta, no una fuente. No se imprime esta marca.' }, '🤖 revisar', h('button', { style: { ...E.btnChico, padding: '0 5px', fontSize: 10 }, onClick: onRevisado }, '✓ revisado'))
}

function Texto({ rot, num = '', valor, onCambio, placeholder = '', min = 2, ia = false, onRevisado }) {
  return h(
    'label',
    null,
    h('span', { style: E.rot }, num && h('span', { style: E.num }, num), rot, h(MarcaIA, { activa: ia, onRevisado })),
    h('textarea', { style: E.area, rows: filasDe(valor, min), value: valor, placeholder, onChange: (e) => onCambio(e.target.value) }),
  )
}
function Linea({ rot, valor, onCambio, placeholder = '', flex = '1 1 140px' }) {
  return h('label', { style: { flex } }, h('span', { style: E.rot }, rot), h('input', { style: E.campo, value: valor, placeholder, onChange: (e) => onCambio(e.target.value) }))
}
// Una lista de incisos: «a.- b.- c.-», «1.- 2.- 3.-» o guiones. Un renglón por inciso.
function Lista({ rot, num = '', items, onCambio, placeholder, textoMas, tipo = '1', ia = false, onRevisado }) {
  const xs = items.length ? items : ['']
  return h(
    'div',
    null,
    h('span', { style: E.rot }, num && h('span', { style: E.num }, num), rot, h(MarcaIA, { activa: ia, onRevisado })),
    xs.map((x, i) =>
      h(
        'div',
        { key: i, style: { ...E.item, marginBottom: 4 } },
        h('span', { style: { ...E.num, paddingTop: 5 } }, marca[tipo](i)),
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
        (items.length > 1 || limpio(x)) && h('button', { style: E.btnChico, title: 'Quitar', onClick: () => onCambio(xs.filter((_, j) => j !== i)) }, '✕'),
      ),
    ),
    h('button', { style: E.btnMas, onClick: () => onCambio([...xs, '']) }, textoMas),
  )
}

function Cuadro({ equipos }) {
  if (!equipos.length) return null
  return h(
    'table',
    { style: E.cuadro },
    h('tbody', null, h('tr', null, equipos.map((e, i) => h('th', { key: e.id, style: E.th }, rotuloEquipo(e, i)))), h('tr', null, equipos.map((e) => h('td', { key: e.id, style: E.td }, lista(e.elementos).length ? lista(e.elementos).map((x, j) => h('div', { key: j }, `- ${x}`)) : '—')))),
  )
}

export default function EditorReconocimiento({ hoja = null, valor, onValor, ctx = null, onExpediente = null }) {
  const c = ctx || {}
  const v = normalizarOrden(valor)
  const [msg, setMsg] = useState(null)
  const [verRevision, setVerRevision] = useState(false)
  const revision = revisarOrden(v)
  const titulo = `${hoja?.num || 'F2·P9'} ${hoja?.nom || 'Orden de Reconocimiento'}`
  const nombre = `${String(hoja?.num || 'F2P9').replace(/[^A-Za-z0-9]+/g, '')}_Orden_de_Reconocimiento`
  const ia = new Set(v.iaCampos)

  const guardar = (nv) => onValor?.(serializar(nv))
  const set = (k, x) => guardar({ ...v, [k]: x })
  const revisado = (k) => guardar({ ...v, iaCampos: v.iaCampos.filter((x) => x !== k) })
  const conEquipos = (fn) => guardar({ ...v, equipos: fn(v.equipos.map((e) => ({ ...e }))) })
  const setEquipo = (id, cambios) => conEquipos((es) => es.map((e) => (e.id === id ? { ...e, ...cambios } : e)))
  const mover = (i, d) =>
    conEquipos((es) => {
      const j = i + d
      if (j < 0 || j >= es.length) return es
      ;[es[i], es[j]] = [es[j], es[i]]
      return es
    })
  const proximoNombre = () => {
    const usados = new Set(v.equipos.map((e) => nombreEquipo(e.nombre)))
    return ['ZULU', 'TANGO', 'VICTOR', ...FONETICO].find((x) => !usados.has(x)) || ''
  }

  const registro = () => {
    const R = registroMilitar()
    return R ? R(hoja || { id: 'ivr', num: 'F2·P9', nom: 'Orden de Reconocimiento' }, c) : null
  }
  const word = async () => {
    const W = wordMilitar()
    if (!W) return 'El formato militar no está disponible en esta versión de la Mesa.'
    try {
      const r = await W(especificacionOrden(v, { ctx: c }), nombre, { ctx: c, registro: registro() })
      return r ? `✓ Word descargado: ${nombre}.docx` : 'No se descargó el Word.'
    } catch (e) {
      return `No se pudo generar el Word: ${e?.message || e}`
    }
  }
  const verPrevia = async () => {
    const V = vistaMilitar()
    const M = mostrarDocx()
    const html = () => ordenHTML(v, { ctx: c })
    if (!V || !M) return abrirVisor({ titulo, html: html(), aviso: 'Vista aproximada (sin membrete): el Word lleva además el membrete, SECRETO y la numeración.', onWord: word })
    try {
      const r = await V(especificacionOrden(v, { ctx: c }), nombre, { ctx: c, registro: registro() })
      if (!r?.blob) return
      abrirVisor({ titulo, dibujar: (host) => M(r.blob, host), onWord: word })
    } catch (e) {
      abrirVisor({ titulo, html: html(), aviso: `${e?.message || e} — Mientras tanto, ésta es la orden sin membrete.`, onWord: word })
    }
  }
  const armar = () => {
    const r = armarDesdeEjercicio(v, c, { semilla: semilla() })
    if (!r.cambios.length) {
      setMsg({ tipo: 'aviso', txt: 'No había nada nuevo que traer: los órganos de reconocimiento del calco ya están en los equipos (no se pisa lo escrito). Colocá las unidades de reconocimiento en el calco o trabajá la orden con la IA.' })
      return
    }
    guardar(r.valor)
    setMsg({ tipo: 'ok', txt: `🌱 Se trajo: ${r.cambios.join(' · ')}. Dales nombre clave a los equipos (o juntalos) y escribí qué tiene que obtener cada uno, o pedíselo a la IA.` })
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
    return pedidoOrden(v, { expediente: exp?.md || '', ctx: c, hoja, modo, encabezado: encabezadoIA(), semilla: semilla() })
  }
  const onAplicar = (texto, modo) => {
    const r = aplicarRespuestaOrden(texto, v, { modo, corregir: corregirIA() })
    if (!r.ok) return r
    guardar(r.valor)
    return { ok: true, msg: r.msg }
  }

  const T = (k, rot, num, placeholder, min = 2) => h(Texto, { rot, num, valor: v[k], placeholder, min, onCambio: (x) => set(k, x), ia: ia.has(k), onRevisado: () => revisado(k) })
  const L = (k, rot, num, tipo, placeholder, textoMas) => h(Lista, { rot, num, items: v[k], tipo, placeholder, textoMas, onCambio: (x) => set(k, x), ia: ia.has(k), onRevisado: () => revisado(k) })
  const plazosEq = plazosDeEquipos(v)
  const errores = revision.filter((x) => x.tipo === 'err').length

  return h(
    'div',
    { style: E.raiz, 'data-hoja': 'orden-reconocimiento' },
    // ── Documento ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, `${titulo} · ${resumenOrden(v)}`),
      h('div', { style: E.fila }, h('button', { style: E.btn, onClick: verPrevia }, '👁️ Vista previa'), h('button', { style: E.btnPrin, title: 'Membrete, OBJETO/CARTA/ANEXOS, organización de la tarea, párrafos I a V y firma: listo para firmar', onClick: async () => setMsg({ tipo: 'ok', txt: await word() }) }, '📄 Word (formato militar)')),
      h('div', { style: E.ayuda }, 'Sale como la orden de reconocimiento de la Escuela, con el membrete de los demás documentos: OBJETO, CARTA y ANEXOS; el cuadro de ORGANIZACIÓN DE LA TAREA; I.- Situación, II.- Misión, III.- Ejecución, IV.- Apoyo de servicio y V.- Comando y comunicaciones; la firma del Comandante, la autenticación y la distribución.'),
    ),
    msg && h('div', { style: E[msg.tipo] || E.ok }, msg.txt),
    v.legado &&
      h(
        'div',
        { style: E.aviso },
        'Esta hoja estaba en el formato anterior (una matriz con un órgano por renglón). Cada renglón quedó como un EQUIPO, con su tarea, área, alcance, plazos y dónde informa: no se perdió nada. Ahora dales nombre clave (ZULU, TANGO, VICTOR…), juntá los que trabajan juntos y completá la orden, a mano o con la IA. ',
        h('button', { style: { ...E.btnChico, marginTop: 4 }, onClick: () => guardar({ ...v, legado: false }) }, 'Entendido'),
      ),
    // ── Armar ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, '1 · Lo que ya tiene el ejercicio'),
      h('button', { style: E.btn, onClick: armar }, '🌱 Traer del calco lo que falte'),
      h('div', { style: E.ayuda }, 'Trae los órganos de reconocimiento del calco (cada uno como un equipo, con el alcance de su medio), la carta de la Orden del escalón superior y la referencia a la Orden Preparatoria. No pisa nada de lo que ya está escrito.'),
    ),
    // ── Ideas del oficial ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, '2 · 💡 Cómo querés el reconocimiento (tus ideas)'),
      h('textarea', {
        style: E.area,
        rows: filasDe(v.ideas, 3),
        value: v.ideas,
        placeholder: 'Ej.: «Tres equipos: ZULU con la sección de aviación y la de IM al norte, TANGO con los observadores y los ingenieros sobre el río, VICTOR con los ERM en el centro» · «Reconocimiento de ruta y zona, a pie en las áreas críticas» · «Que informen por radio cada 2 horas y el informe escrito al D-89 (2330)».',
        onChange: (e) => set('ideas', e.target.value),
      }),
      h('div', { style: E.ayuda }, 'No se imprime: va en el pedido a la IA y la IA lo sigue al pie de la letra. También podés escribir directamente en cualquier apartado de abajo: lo que escribís vos manda y «Sólo completar» no lo toca.'),
    ),
    // ── IA ──
    Panel &&
      h(Panel, {
        titulo: '🤖 Trabajar esta hoja con IA',
        nota: 'Le manda el expediente completo del ejercicio (orden del escalón superior, documentos aportados, terreno, enemigo, vacíos de inteligencia, RCIC y las hojas de todo el Estado Mayor), los órganos de reconocimiento del calco con su alcance, el ejemplo de la Escuela y TUS IDEAS. Devuelve la ORDEN completa: equipos, situación, misión, ejecución, apoyo y comunicaciones.',
        color: VERDE,
        modos: MODOS,
        onPedido,
        onAplicar,
      }),
    // ── Encabezado ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.parrafo }, `${TITULO} No. ${limpio(v.numero) || '01'}`),
      h('div', { style: E.fila }, h(Linea, { rot: 'Número de la orden', valor: v.numero, placeholder: '01', flex: '0 1 120px', onCambio: (x) => set('numero', x) })),
      T('objeto', 'OBJETO (una sola frase)', '', 'Reconocimiento del AO de la … entre la LF. «…» y la LS.', 1),
      T('carta', 'CARTA', '', 'Especial …, Esc. 1:250.000', 1),
      T('anexos', 'ANEXOS (uno por renglón)', '', '“A” Calco de reconocimiento.', 1),
      h('div', { style: E.ayuda }, 'El membrete (escalón superior, unidad, CG., fecha y hora, sección y número) lo pone la Mesa, como en los demás documentos.'),
    ),
    // ── Organización de la tarea ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.parrafo }, 'ORGANIZACIÓN DE LA TAREA · y la tarea de cada equipo (III.- B.- 2.-)'),
      h(Cuadro, { equipos: v.equipos }),
      !v.equipos.length && h('div', { style: E.ayuda }, 'Todavía no hay equipos. 🌱 Traelos del calco, pedíselos a la IA o agregalos acá.'),
      v.equipos.map((e, i) =>
        h(
          'div',
          { key: e.id, style: E.equipo },
          h(
            'div',
            { style: E.cab },
            h('span', { style: { ...E.num, minWidth: 0 } }, `${LETRAS[i % 26]}.-`),
            h('span', { style: { color: VERDE, fontWeight: 700 } }, 'EQ.'),
            h('input', { style: { ...E.campo, flex: '1 1 120px', width: 'auto', fontWeight: 700, textTransform: 'uppercase' }, value: e.nombre, placeholder: `nombre clave (${proximoNombre() || 'ZULU'})`, 'aria-label': 'Nombre clave del equipo', onChange: (x) => setEquipo(e.id, { nombre: x.target.value }) }),
            h(MarcaIA, { activa: e.ia, onRevisado: () => setEquipo(e.id, { ia: false }) }),
            h('button', { style: E.btnChico, title: 'Subir', onClick: () => mover(i, -1) }, '↑'),
            h('button', { style: E.btnChico, title: 'Bajar', onClick: () => mover(i, 1) }, '↓'),
            h('button', { style: E.btnChico, title: 'Quitar el equipo', onClick: () => window.confirm(`¿Quitar ${rotuloEquipo(e, i)}?`) && conEquipos((es) => es.filter((x) => x.id !== e.id)) }, '✕'),
          ),
          h(Lista, { rot: 'Elementos (van en el cuadro)', items: e.elementos, tipo: '-', placeholder: 'SECC. AV 2 · ERM/8 · OA. REAM-3 · dron …', textoMas: '+ Agregar elemento', onCambio: (x) => setEquipo(e.id, { elementos: x }) }),
          h(Texto, { rot: 'Tarea (qué hace y dónde, opcional)', valor: e.tarea, min: 1, placeholder: 'Reconocer la zona entre la LF. «…» y la LS, sector norte del AO.', onCambio: (x) => setEquipo(e.id, { tarea: x }) }),
          h(
            'div',
            { style: E.fila },
            h(Linea, { rot: 'Área / objetivo a reconocer', valor: e.area, flex: '2 1 200px', onCambio: (x) => setEquipo(e.id, { area: x }) }),
            h(Linea, { rot: 'Alcance del medio (no se imprime)', valor: e.alcance, placeholder: '30 km — escuadrón', onCambio: (x) => setEquipo(e.id, { alcance: x }) }),
          ),
          h(
            'div',
            { style: E.fila },
            h(Linea, { rot: 'No antes de', valor: e.noAntes, placeholder: 'D-90 (1000)', onCambio: (x) => setEquipo(e.id, { noAntes: x }) }),
            h(Linea, { rot: 'No después de', valor: e.noDespues, placeholder: 'D-89 (1800)', onCambio: (x) => setEquipo(e.id, { noDespues: x }) }),
            h(Linea, { rot: 'Dónde informa', valor: e.informa, placeholder: 'PC de la … (G-2)', onCambio: (x) => setEquipo(e.id, { informa: x }) }),
          ),
          h(Lista, { rot: OBTENER, items: e.obtener, tipo: '-', placeholder: 'Profundidad, ancho y cauce de los cursos de agua.', textoMas: '+ Agregar información a obtener', onCambio: (x) => setEquipo(e.id, { obtener: x }) }),
          e.antes && h('div', { style: E.antes }, 'Antes decía: ', Object.entries(e.antes).map(([k, x]) => `${k}: ${x}`).join(' · ')),
        ),
      ),
      h('button', { style: E.btnMas, onClick: () => conEquipos((es) => [...es, { ...equipoVacio(nuevoId('e')), nombre: proximoNombre() }]) }, '+ Agregar equipo'),
    ),
    // ── I.- SITUACIÓN ──
    h('div', { style: E.caja }, h('div', { style: E.parrafo }, 'I.- SITUACIÓN.'), T('enemiga', 'Enemiga.', 'A.-', 'Ver Orden Preparatoria No. 01 y Anexo de Inteligencia.'), T('propia', 'Propia.', 'B.-', 'La … se encuentra en su actual ZR «…» realizando …')),
    // ── II.- MISIÓN ──
    h('div', { style: E.caja }, h('div', { style: E.parrafo }, 'II.- MISIÓN.'), T('mision', 'Quién, qué, cuándo, dónde y para qué', '', 'Los EQUIPOS «ZULU», «TANGO» y «VICTOR» de la …, ejecutarán un reconocimiento a partir del D-… (…) hasta el D-… (…) en …, con el propósito de …', 3)),
    // ── III.- EJECUCIÓN ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.parrafo }, 'III.- EJECUCIÓN.'),
      h('div', { style: E.rot }, h('span', { style: E.num }, 'A.-'), 'Plan de Reconocimiento.'),
      T('objetivo', 'Objetivo general del reconocimiento.', '1.-', 'Obtener información sobre …'),
      T('metodo', 'Método del reconocimiento.', '2.-', 'Observación y vigilancia a corto y largo alcance …; reconocimiento de ruta, zona y área.'),
      h('div', { style: E.rot }, h('span', { style: E.num }, 'B.-'), 'Tareas para los equipos de reconocimiento.'),
      T('formaIntro', 'Forma de llegar a la zona de reconocimiento.', '1.-', FORMA_INTRO, 1),
      L('medios', 'Medios (a.- b.- c.-)', '', 'a', 'Movimiento motorizado.', '+ Agregar medio'),
      h('div', { style: E.rot }, h('span', { style: E.num }, '2.-'), 'Tareas: se arman con los equipos de arriba («a.- Equipo ZULU. Obtener información referente a: …»).'),
      T('plazos', 'Plazos en tiempo.', '3.-', 'Duración del reconocimiento … hrs.', 1),
      plazosEq.length > 0 && h('div', { style: E.ayuda }, `Y abajo, los de cada equipo: ${plazosEq.join(' · ')}`),
      L('coordinacion', 'Instrucciones de coordinación.', 'C.-', '1', 'En caso de ataque dar parte inmediatamente al PC.', '+ Agregar instrucción'),
    ),
    // ── IV.- APOYO DE SERVICIO ──
    h('div', { style: E.caja }, h('div', { style: E.parrafo }, 'IV.- APOYO DE SERVICIO.'), L('abastecimientos', 'Abastecimientos.', 'A.-', '1', 'Clase I para 2 días de operación.', '+ Agregar inciso'), T('transporte', 'Transporte.', 'B.-', 'Se emplearán los medios orgánicos de la … para ejecutar la operación.', 1)),
    // ── V.- COMANDO Y COMUNICACIONES ──
    h('div', { style: E.caja }, h('div', { style: E.parrafo }, 'V.- COMANDO Y COMUNICACIONES.'), L('comando', 'Comando.', 'A.-', '1', 'PC: …', '+ Agregar inciso'), L('comunicaciones', 'Comunicaciones.', 'B.-', '1', 'IEC «…» en vigor.', '+ Agregar inciso')),
    // ── Firma y distribución ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.paso }, 'Firma y distribución'),
      h(Linea, { rot: 'Firma', valor: v.firma, placeholder: firmaDe({ ...v, firma: '' }, c) || 'EL COMANDANTE DE LA …', flex: '1 1 100%', onCambio: (x) => set('firma', x) }),
      h('label', null, h('span', { style: E.rot }, 'Distribución (un renglón por destinatario: «Copia 1: SEC-III»)'), h('textarea', { style: E.area, rows: 3, value: v.distribucion, placeholder: distribucionDe({ ...v, distribucion: '' }, c), onChange: (e) => set('distribucion', e.target.value) })),
      h('div', { style: E.ayuda }, 'Vacío = lo que arma la Mesa (se ve en gris): el original en la unidad, una copia a la Sec. III y una a cada equipo. Lo que escribas acá manda.'),
    ),
    // ── Revisión ──
    h(
      'div',
      { style: E.caja },
      h('div', { style: E.cab }, h('div', { style: E.paso }, revision.length ? `Para que la orden quede completa: ${revision.length} pendiente(s)${errores ? ` · ${errores} importante(s)` : ''}` : '✓ La orden tiene todos sus apartados'), revision.length > 0 && h('button', { style: E.btnChico, onClick: () => setVerRevision(!verRevision) }, verRevision ? '▾ Ocultar' : '▸ Ver')),
      verRevision && revision.map((x, i) => h('div', { key: i, style: x.tipo === 'err' ? E.err : E.aviso }, x.txt)),
    ),
  )
}
