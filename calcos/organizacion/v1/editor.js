// Pantalla de la F3·P3 FORMACIÓN INICIAL DE LAS FUERZAS en el Tablero del G-3. Se trabaja
// en el ORDEN de la doctrina, sobre el terreno (ver modelo.js):
//
//   ① lo que se considera (misión, intención, avenidas, CAE y objetivos del enemigo);
//   ② las tareas tácticas en la carta, y a cada una su operación (OD, OC 1, OC 2…);
//   ③ la proporción para cada tarea frente al enemigo de su sector (la OD primero);
//   ④ las unidades genéricas (triángulos y cuadrados) de lo que hay; lo que sobra a la
//      reserva, lo que falta como requerimiento;
//   ⑤ cómo queda en la carta (el rótulo y las unidades genéricas junto a cada tarea);
//   ⑥ la forma gráfica de la organización;
//   ⑦ la Organización de la Tarea (el panel 🧩) y el cuadro de la hoja.
//
// JavaScript sin compilar: React llega por runtime.js (el de la Mesa).
import {
  OPERACIONES,
  RESERVA,
  PROPORCIONES,
  RELACIONES,
  CLAVE_FLUJO,
  ESCALONES,
  operacionDe,
  balance,
  proponerReparto,
  moverPieza,
  oiDe,
  nuevoId,
  flujoNormal,
  proximaOperacion,
  sugerirEnemigos,
  enemigosCerca,
  radioSector,
  textoSugerido,
  filasCuadro,
  formaGrafica,
  sincronizarOrganizacion,
  actualizarFichas,
  desdeOrganizacion,
  revisar,
  resumenG2,
  avenidas,
  misionReexpresada,
  cantidad,
  fmtDist,
  esPropia,
  marcaDe,
} from './modelo.js'
import { graficaHTML, abrirParaImprimir } from './grafica.js'
import { useState, useEffect, useMemo, jsx, jsxs, simb, svgPieza, svgTarea, catalogoTareas } from './runtime.js'
import { datosPuente, editorAbierto, colocar, cancelarColocar } from './carta.js'

function h(tipo, props, ...hijos) {
  const { key, ...p } = props || {}
  const hs = hijos.flat().filter((x) => x !== null && x !== undefined && x !== false && x !== '')
  if (!hs.length) return jsx(tipo, p, key)
  if (hs.length === 1) return jsx(tipo, { ...p, children: hs[0] }, key)
  return jsxs(tipo, { ...p, children: hs }, key)
}
const svg = (html, estilo = {}) => h('span', { style: { lineHeight: 0, display: 'inline-block', ...estilo }, dangerouslySetInnerHTML: { __html: html } })

const VERDE = '#7dffb0'
const E = {
  raiz: { display: 'flex', flexDirection: 'column', gap: 8, color: '#e6eef6', fontSize: 12, marginBottom: 10 },
  cabeza: { background: 'linear-gradient(90deg, rgba(125,255,176,0.10), rgba(92,157,255,0.08))', border: '1px solid rgba(125,255,176,0.35)', borderRadius: 8, padding: '8px 10px' },
  cabTit: { fontSize: 13.5, fontWeight: 800, color: VERDE, letterSpacing: 0.2 },
  cabSub: { fontSize: 11, color: '#b9c9da', marginTop: 2, lineHeight: 1.4 },
  pasos: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 },
  pasoChip: { fontSize: 10.5, borderRadius: 10, padding: '1px 7px', border: '1px solid rgba(255,255,255,0.25)', color: '#cfe0ee', background: 'rgba(0,0,0,0.25)', cursor: 'pointer' },
  paso: { background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, overflow: 'hidden' },
  pasoCab: { width: '100%', display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#e6eef6', padding: '8px 10px', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, fontWeight: 700 },
  num: { minWidth: 22, height: 22, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#10202a' },
  cuerpo: { padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7 },
  doctrina: { fontSize: 11, color: '#c8d6e5', lineHeight: 1.45, background: 'rgba(92,157,255,0.07)', borderLeft: '3px solid #5c9dff', padding: '5px 8px', borderRadius: 4 },
  fila: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  item: { display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11.5, lineHeight: 1.4 },
  rot: { fontSize: 10.5, color: '#9fb0c8', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 700 },
  ok: { color: VERDE },
  falta: { color: '#ffb35c' },
  btn: { background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 6, padding: '6px 9px', cursor: 'pointer', fontSize: 12 },
  btnPrin: { background: VERDE, color: '#10202a', border: 'none', borderRadius: 7, padding: '8px 11px', cursor: 'pointer', fontSize: 12.5, fontWeight: 800 },
  btnChico: { background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontSize: 11, lineHeight: 1.3 },
  chip: { borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', color: '#cfe0ee' },
  sel: { background: '#172332', color: '#fff', border: '1px solid #4d5d70', borderRadius: 4, padding: '4px 5px', fontSize: 12, maxWidth: '100%' },
  campo: { width: '100%', boxSizing: 'border-box', background: '#172332', color: '#fff', border: '1px solid #4d5d70', borderRadius: 4, padding: '5px 6px', fontSize: 12, fontFamily: 'inherit' },
  tarjeta: { background: '#101a27', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 },
  aviso: { background: 'rgba(255,212,122,0.08)', border: '1px solid rgba(255,212,122,0.3)', color: '#ffd47a', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  bien: { background: '#12291d', border: '1px solid #2f6b46', color: '#9fe0c0', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  ayuda: { fontSize: 10.5, color: '#9fb0c8', lineHeight: 1.4, fontStyle: 'italic' },
  pieza: { background: '#e9eef3', border: '1px solid #9fb0c8', borderRadius: 5, padding: '2px 3px', cursor: 'pointer', lineHeight: 0 },
  piezaDentro: { background: '#fff', border: '1px solid #6d7f92', borderRadius: 5, padding: '2px 3px', cursor: 'pointer', lineHeight: 0 },
  zona: { display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 34, background: 'rgba(0,0,0,0.25)', border: '1px dashed rgba(255,255,255,0.25)', borderRadius: 6, padding: 4, alignItems: 'center' },
  papel: { borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.25)' },
}
const CATS = [
  { id: 'enemigo', nom: 'Sobre el enemigo' },
  { id: 'terreno', nom: 'Sobre el terreno' },
  { id: 'amigas', nom: 'Acciones de las tropas propias' },
]
const n1 = (x) => String(Math.round(x * 10) / 10).replace('.', ',')

function Paso({ n, titulo, ok, abierto, onAbrir, children }) {
  return h(
    'div',
    { style: E.paso, id: `oi-paso-${n}` },
    h('button', { style: E.pasoCab, onClick: onAbrir, 'aria-expanded': abierto ? 'true' : 'false' }, h('span', { style: { ...E.num, background: ok ? VERDE : '#ffb35c' } }, String(n)), h('span', { style: { flex: 1 } }, titulo), h('span', { style: { fontSize: 11, color: ok ? VERDE : '#ffb35c' } }, ok ? '✅' : '⚠️'), h('span', { style: { color: '#8fa2bd' } }, abierto ? '▾' : '▸')),
    abierto && h('div', { style: E.cuerpo }, children),
  )
}

export default function SIDEditorOrgInicial({ hoja, ctx = {}, onG3, onAbrirOrgTarea }) {
  const ops = ctx.ops || {}
  // Las unidades del calco SIN descontar las piezas ya consolidadas (las mismas que usa la
  // Organización de la Tarea): con las descontadas, los id de las piezas no coinciden.
  const unidades = ctx.SIDdn || ctx.unidades || []
  const g3 = ctx.g3 || {}
  const orgTarea = ctx.orgTarea || []
  const P = datosPuente()
  const bal = useMemo(() => balance({ ops, g3, unidades }, simb), [ops, g3, unidades])
  const [abiertos, setAbiertos] = useState({ 1: true, 2: true, 3: true, 4: true, 5: false, 6: false, 7: true })
  const [activa, setActiva] = useState(null)
  const [nueva, setNueva] = useState(() => ({ tarea: 'bloquear', operacion: proximaOperacion(ops), escalon: '' }))
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    editorAbierto(true)
    return () => {
      editorAbierto(false)
      cancelarColocar()
    }
  }, [])
  // Cada tarea de la carta necesita un id propio para guardar su operación y sus piezas.
  useEffect(() => {
    if ((ops.tareas || []).some((t) => t && t.centro && !oiDe(t).id)) P.setOps?.((o) => ({ ...o, tareas: (o.tareas || []).map((t) => (t && t.centro && !oiDe(t).id ? { ...t, oi: { ...oiDe(t), id: nuevoId() } } : t)) }))
  }, [ops.tareas])

  const aviso = (tipo, txt) => setMsg({ tipo, txt })
  const abrir = (n, v) => setAbiertos((a) => ({ ...a, [n]: v ?? !a[n] }))
  const setFlujo = (fn) => onG3?.((prev) => ({ [CLAVE_FLUJO]: fn(flujoNormal(prev?.[CLAVE_FLUJO])) }))
  const cambiarTareas = (fn) => P.setOps?.((o) => ({ ...o, tareas: fn(o.tareas || []) }))
  const cambiarOI = (id, cambio) => cambiarTareas((ts) => ts.map((t) => (oiDe(t).id === id ? { ...t, oi: { ...oiDe(t), ...(typeof cambio === 'function' ? cambio(oiDe(t), t) : cambio) } } : t)))
  const irA = (centro, radio = 3000) => P.irA?.(centro, radio)
  const sinPuente = !P.setOps

  // ─── Datos de cada paso ───
  const g2 = resumenG2(ctx.picb)
  const av = avenidas(ctx.cmoc)
  const mision = misionReexpresada(g3, ctx.ordenSup)
  const intencion = String(ctx.ordenSup?.intencion || '').trim()
  const objetivos = (ops.objetivos || []).filter((o) => o && o.centro)
  const enemigas = unidades.filter((u) => ['enemigo', 'enemigas', 'rojo'].includes(String(u?.bando || '').toLowerCase()) && (u.tipo || 'unidad') === 'unidad')
  const tareasCalco = (ops.tareas || []).filter((t) => t && t.centro && oiDe(t).id)
  const sinOperacion = tareasCalco.filter((t) => !operacionDe(oiDe(t).operacion) || oiDe(t).operacion === 'reserva')
  const sueltas = orgTarea.filter((a) => a && OPERACIONES.concat(RESERVA).some((o) => o.id === a.operacion) && !(ops.tareas || []).some((t) => oiDe(t).agId === a.id) && a.id !== bal.flujo.reserva.agId)
  const avisos = revisar(bal, { picb: ctx.picb, ops, cmoc: ctx.cmoc, g3, ordenSup: ctx.ordenSup })
  const listo = {
    1: !!g2.probable && objetivos.length > 0,
    2: bal.tareas.some((x) => x.op.id === 'od'),
    3: bal.tareas.length > 0 && bal.tareas.every((x) => x.nivel !== 'sin-enemigo'),
    4: bal.tareas.length > 0 && bal.tareas.every((x) => x.nivel !== 'falta') && !bal.libresManiobra.length,
    5: bal.flujo.verEnCarta && bal.tareas.length > 0,
    6: bal.tareas.some((x) => x.piezas.length),
    7: bal.tareas.length > 0 && bal.tareas.every((x) => x.oi.agId && orgTarea.some((a) => a.id === x.oi.agId)),
  }

  // ─── Acciones ───
  const ponerOperacion = (id, op) =>
    cambiarTareas((ts) =>
      ts.map((t) => {
        const oi = oiDe(t)
        if (oi.id === id) return { ...t, oi: { ...oi, operacion: op } }
        // La OD y cada OC son una sola: la que la tenía la pierde.
        if (op && op !== 'sost' && oi.operacion === op) return { ...t, oi: { ...oi, operacion: '' } }
        return t
      }),
    )
  const colocarNueva = () => {
    const op = operacionDe(nueva.operacion)
    const nom = simb.nombreTarea(nueva.tarea)
    const escalon = nueva.escalon || bal.agrupacionEscalon
    const ok = colocar({
      texto: `Tocá la carta donde va «${nom}»${op ? ` (${op.corto})` : ''}: sobre el terreno, frente al enemigo de su sector.`,
      al: (centro) => {
        P.marcar?.()
        const t = { centro, tarea: nueva.tarea, escalon, rot: 0, escala: 1, oi: { id: nuevoId(), operacion: nueva.operacion || '', texto: '', enemigos: sugerirEnemigos({ centro, escalon }, unidades), proporcion: '' } }
        P.setOps?.((o) => ({ ...o, tareas: [...(o.tareas || []).map((x) => (nueva.operacion && nueva.operacion !== 'sost' && oiDe(x).operacion === nueva.operacion ? { ...x, oi: { ...oiDe(x), operacion: '' } } : x)), t] }))
        setNueva((v) => ({ ...v, operacion: proximaOperacion({ tareas: [...(ops.tareas || []), t] }) }))
        aviso('ok', `📍 «${nom}» quedó en la carta${op ? ` como ${op.corto}` : ''}. Seguí con la próxima, o pasá al paso ③.`)
      },
    })
    if (ok) aviso('info', '📍 Tocá la carta donde va la tarea (Esc cancela).')
  }
  const quitarTarea = (id) => {
    if (!window.confirm('¿Quitar esta tarea táctica de la carta? Sus unidades genéricas vuelven a quedar libres.')) return
    P.marcar?.()
    cambiarTareas((ts) => ts.filter((t) => oiDe(t).id !== id))
    if (activa === id) setActiva(null)
  }
  const partirDeOrganizacion = () => {
    const c = P.centro?.()
    const r = desdeOrganizacion({ ops, flujo: bal.flujo, orgTarea, unidades }, { centro: objetivos[0]?.centro || (c ? [c.lng, c.lat] : null), G: bal.G })
    if (!r.tareas.length && r.reserva === bal.flujo.reserva) return aviso('info', 'No hay agrupaciones con operación para traer.')
    P.marcar?.()
    if (r.tareas.length) P.setOps?.((o) => ({ ...o, tareas: [...(o.tareas || []), ...r.tareas] }))
    setFlujo((f) => ({ ...f, reserva: r.reserva }))
    aviso('ok', `⬅️ ${r.tareas.length} agrupación(es) pasaron a la carta como tareas tácticas, con su operación y sus piezas. Arrastralas a su lugar sobre el terreno y revisá la tarea de cada una.`)
  }
  const asignar = (pieza, destino) => {
    P.setOps?.((o) => moverPieza({ ops: o, flujo: {} }, pieza, destino).ops)
    setFlujo((f) => moverPieza({ ops: { tareas: [] }, flujo: f }, pieza, destino).flujo)
  }
  const tocarPieza = (p) => {
    if (!activa) return aviso('info', 'Primero tocá la tarea (o la reserva) que va a recibir las piezas; después las piezas de «Lo que tengo».')
    asignar(p, activa)
  }
  const repartir = () => {
    const r = proponerReparto(bal)
    cambiarTareas((ts) => ts.map((t) => (r.tareas[oiDe(t).id] ? { ...t, oi: { ...oiDe(t), piezas: r.tareas[oiDe(t).id] } } : t)))
    setFlujo((f) => ({ ...f, reserva: { ...f.reserva, piezas: r.reserva } }))
    aviso('ok', '⚡ Reparto propuesto: cada tarea, desde la OD, con las piezas de maniobra que le faltaban; lo que sobró va a la reserva. Los apoyos quedan bajo control: sumalos a mano donde hagan falta.')
  }
  const vaciar = () => {
    if (!window.confirm('¿Vaciar el reparto? Todas las piezas vuelven a «Lo que tengo».')) return
    cambiarTareas((ts) => ts.map((t) => (oiDe(t).id ? { ...t, oi: { ...oiDe(t), piezas: [] } } : t)))
    setFlujo((f) => ({ ...f, reserva: { ...f.reserva, piezas: [] } }))
  }
  const sobranteAReserva = () => {
    const libres = bal.libresManiobra
    if (!libres.length) return
    setFlujo((f) => ({ ...f, reserva: { ...f.reserva, piezas: [...f.reserva.piezas, ...libres] } }))
  }
  const aOrganizacion = () => {
    if (!bal.tareas.length) return aviso('info', 'Primero las tareas tácticas con su operación (paso ②).')
    const r = sincronizarOrganizacion({ ops, flujo: bal.flujo, orgTarea }, bal)
    P.setOrgTarea?.(r.orgTarea)
    P.setUnidades?.((u) => actualizarFichas(u, r.orgTarea))
    cambiarTareas((ts) => ts.map((t) => (r.vinculos[oiDe(t).id] ? { ...t, oi: { ...oiDe(t), agId: r.vinculos[oiDe(t).id] } } : t)))
    setFlujo((f) => ({ ...f, reserva: { ...f.reserva, agId: r.reservaAgId || null } }))
    aviso('ok', `🧩 ${r.nuevas.length} agrupación(es) nueva(s) y ${r.actualizadas.length} actualizada(s) en la Organización de la Tarea, con su operación, su tarea y sus piezas. Ahí ponéles el NOMBRE y el PROPÓSITO y llevalas al calco.`)
    onAbrirOrgTarea?.()
  }
  const aCuadro = () => {
    const filas = filasCuadro({ ops, g3, unidades }, simb)
    if (!filas.length) return aviso('info', 'Todavía no hay nada para el cuadro.')
    const antes = Array.isArray(g3[hoja?.id || 'organizacion']) ? g3[hoja?.id || 'organizacion'] : []
    if (antes.some((f) => Object.values(f || {}).some((v) => String(v || '').trim())) && !window.confirm(`El cuadro de la hoja ya tiene ${antes.length} renglón(es). Se reemplaza por el de la organización inicial (${filas.length}). ¿Seguimos?`)) return
    onG3?.({ [hoja?.id || 'organizacion']: filas })
    aviso('ok', `📋 El cuadro de la hoja quedó con ${filas.length} renglón(es): es lo que va al Word y a la IA.`)
  }

  const forma = useMemo(() => formaGrafica(bal, { unidades, orgTarea }, simb), [bal, unidades, orgTarea])
  const tareasZg = catalogoTareas()

  if (sinPuente) return h('div', { style: E.aviso }, 'La carta todavía no terminó de cargar: volvé a abrir la hoja en un momento.')

  // ─── ① Lo que se considera ───
  const estado = (ok, txt, falta) => h('div', { style: E.item }, h('span', { style: ok ? E.ok : E.falta }, ok ? '✅' : '⚠️'), h('span', null, ok ? txt : falta))
  const paso1 = h(
    Paso,
    { n: 1, titulo: 'Lo que se considera antes de disponer', ok: listo[1], abierto: abiertos[1], onAbrir: () => abrir(1) },
    h('div', { style: E.doctrina }, 'Para determinar las fuerzas necesarias y dar una base al concepto de la operación: la misión reexpresada y la intención del Comandante superior; las avenidas de aproximación (propias y enemigas); y, según el tiempo lo permita, la mayor cantidad posible de cursos de acción del enemigo, empezando con el MÁS PROBABLE y terminando con el MÁS PELIGROSO.'),
    estado(!!mision, h('span', null, h('b', null, 'Misión reexpresada: '), mision.slice(0, 260), mision.length > 260 ? '…' : ''), 'Falta la misión reexpresada (F2·P12).'),
    estado(!!intencion, h('span', null, h('b', null, 'Intención del Comandante superior: '), intencion.slice(0, 220), intencion.length > 220 ? '…' : ''), 'Falta la intención del Comandante superior (la Orden del escalón superior).'),
    estado(av.total > 0, h('span', null, h('b', null, 'Avenidas de aproximación: '), `${av.enemigas} enemiga(s) y ${av.propias} propia(s) en el calco.`), 'No hay avenidas de aproximación en el calco (CMOC).'),
    estado(!!g2.probable, h('span', null, h('b', null, 'CAE más probable: '), g2.probable, g2.peligroso ? h('span', null, ' · ', h('b', null, 'más peligroso: '), g2.peligroso) : null, g2.mismo ? ' (son el mismo)' : '', g2.mision ? h('span', null, ' · ', h('b', null, 'misión estimada: '), g2.mision.slice(0, 160)) : null), 'El G-2 todavía no marcó el CAE más probable (H.T. 18). Se puede seguir, pero la disposición se hace frente a ese curso de acción.'),
    estado(
      objetivos.length > 0,
      h('span', null, h('b', null, 'Objetivos del enemigo (H.T. 16): '), ...objetivos.map((o, i) => h('button', { key: `ob${i}`, style: { ...E.btnChico, marginRight: 4 }, onClick: () => irA(o.centro, 4000), title: 'Ver en la carta' }, `🎯 ${o.etiqueta || `Obj. ${i + 1}`}`)), (ops.maniobra || []).length ? ` · ${(ops.maniobra || []).length} flecha(s) del esquema de maniobra.` : ''),
      'No hay objetivos del enemigo en el calco (H.T. 16): ponélos desde el G-2 para disponer frente a ellos.',
    ),
    estado(enemigas.length > 0, h('span', null, h('b', null, 'Dispositivo enemigo en el calco: '), `${enemigas.length} ficha(s).`), 'No hay fichas enemigas en el calco: la proporción de cada sector se puede escribir a mano (paso ③), o colocar el dispositivo del CAE más probable.'),
    h('div', { style: E.ayuda }, 'Después, considerá la situación de engaño: los aspectos de la situación pueden influir en dónde colocás las unidades.'),
  )

  // ─── ② Las tareas tácticas en el terreno ───
  const opChips = (actual, onElegir, conNada = true) =>
    h(
      'div',
      { style: E.fila },
      ...OPERACIONES.map((o) => h('button', { key: o.id, onClick: () => onElegir(o.id), style: { ...E.chip, ...(actual === o.id ? { background: `${o.color}33`, color: o.color, border: `1px solid ${o.color}` } : {}) }, title: o.nom }, o.corto)),
      conNada && h('button', { key: 'nada', onClick: () => onElegir(''), style: { ...E.chip, ...(!actual ? { background: 'rgba(255,255,255,0.18)' } : {}) }, title: 'No entra en esta organización' }, '—'),
    )
  const selTarea = (valor, onCambio) =>
    h(
      'select',
      { style: E.sel, value: valor, onChange: (e) => onCambio(e.target.value), 'aria-label': 'Tarea táctica' },
      ...CATS.map((c) => h('optgroup', { key: c.id, label: c.nom }, ...tareasZg.filter((t) => t.cat === c.id).map((t) => h('option', { key: t.id, value: t.id }, t.nombre)))),
    )
  const tarjetaTarea = (t) => {
    const oi = oiDe(t)
    const op = operacionDe(oi.operacion)
    const sug = textoSugerido(t, { unidades, objetivos }, simb)
    return h(
      'div',
      { key: oi.id, style: { ...E.tarjeta, borderColor: op ? `${op.color}88` : 'rgba(255,255,255,0.12)', opacity: op ? 1 : 0.8 } },
      h('div', { style: E.fila }, svg(svgTarea(t.tarea, 34, '#e6eef6', t.rot || 0)), selTarea(t.tarea, (v) => cambiarTareas((ts) => ts.map((x) => (oiDe(x).id === oi.id ? { ...x, tarea: v } : x)))), h('span', { style: { flex: 1 } }), h('button', { style: E.btnChico, onClick: () => irA(t.centro), title: 'Ver en la carta' }, '🎯 Ir'), h('button', { style: E.btnChico, onClick: () => quitarTarea(oi.id), title: 'Quitar de la carta' }, '🗑️')),
      opChips(oi.operacion || '', (v) => ponerOperacion(oi.id, v)),
      op && h('label', { style: { display: 'flex', gap: 5, alignItems: 'center' } }, h('b', { style: { color: op.color } }, 'T:'), h('input', { style: E.campo, value: oi.texto || '', placeholder: sug, onChange: (e) => cambiarOI(oi.id, { texto: e.target.value }), 'aria-label': `Texto de la tarea ${op.corto}` })),
      op && !oi.texto && h('button', { style: { ...E.btnChico, alignSelf: 'flex-start' }, onClick: () => cambiarOI(oi.id, { texto: sug }) }, `✍️ Usar «${sug.length > 60 ? sug.slice(0, 60) + '…' : sug}»`),
      !op && h('div', { style: E.ayuda }, 'Sin operación: no entra en la organización inicial (puede ser una tarea del análisis de la misión).'),
    )
  }
  const ordenadas = [...bal.tareas.map((x) => x.t), ...sinOperacion]
  const paso2 = h(
    Paso,
    { n: 2, titulo: 'Las tareas tácticas en el terreno: OD y OC', ok: listo[2], abierto: abiertos[2], onAbrir: () => abrir(2) },
    h('div', { style: E.doctrina }, 'Se dispone empezando por la OPERACIÓN DECISIVA (el esfuerzo principal) en el PUNTO DECISIVO y siguiendo por las OPERACIONES DE CONFIGURACIÓN (los esfuerzos secundarios que permiten que la OD tenga éxito). Cada tarea va en la carta, sobre el terreno, frente al enemigo y sus objetivos.'),
    h(
      'div',
      { style: { ...E.tarjeta, borderColor: `${VERDE}66` }, className: 'oi-nueva' },
      h('div', { style: E.rot }, '➕ Nueva tarea táctica'),
      h('div', { style: E.fila }, selTarea(nueva.tarea, (v) => setNueva((n) => ({ ...n, tarea: v }))), h('select', { style: E.sel, value: nueva.escalon || bal.agrupacionEscalon, onChange: (e) => setNueva((n) => ({ ...n, escalon: e.target.value })), 'aria-label': 'Magnitud del símbolo' }, ...ESCALONES.slice(2, 8).map((e) => h('option', { key: e, value: e }, `${marcaDe(e)} ${cantidad(1, e).replace(/^1 /, '')}`)))),
      opChips(nueva.operacion, (v) => setNueva((n) => ({ ...n, operacion: v }))),
      h('button', { style: E.btnPrin, onClick: colocarNueva }, '📍 Colocarla en la carta'),
    ),
    ...ordenadas.map(tarjetaTarea),
    !tareasCalco.length && h('div', { style: E.aviso }, 'Todavía no hay tareas tácticas en la carta. Empezá por la OD.'),
    !!sueltas.length && h('div', { style: E.aviso }, `Ya armaste ${sueltas.length} agrupación(es) en la Organización de la Tarea que no están en la carta como tarea. `, h('button', { style: E.btnChico, onClick: partirDeOrganizacion }, '⬅️ Partir de lo que ya armé')),
  )

  // ─── ③ La proporción ───
  const tarjetaProporcion = (x) => {
    const oi = x.oi
    const cerca = enemigosCerca(x.t.centro, unidades).filter((c, i) => i < 8 || (oi.enemigos || []).includes(c.u.id))
    const elegidos = new Set(oi.enemigos || [])
    const man = oi.enemigoManual || {}
    return h(
      'div',
      { key: oi.id, style: { ...E.tarjeta, borderColor: `${x.op.color}88` }, className: 'oi-proporcion', 'data-op': x.op.id },
      h('div', { style: E.fila }, h('span', { style: { ...E.chip, background: x.op.color, color: '#fff', cursor: 'default' } }, x.op.corto), svg(svgTarea(x.t.tarea, 26, '#e6eef6')), h('b', null, simb.nombreTarea(x.t.tarea)), h('span', { style: { flex: 1, color: '#9fb0c8', fontSize: 11 } }, oi.texto ? `T: ${oi.texto}` : '')),
      h('div', { style: E.rot }, 'Enemigo ubicado en su sector'),
      cerca.length
        ? h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: 2 } },
            ...cerca.map(({ u, d }) =>
              h(
                'label',
                { key: u.id, style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 11.5, cursor: 'pointer' } },
                h('input', { type: 'checkbox', checked: elegidos.has(u.id), onChange: () => cambiarOI(oi.id, (v) => ({ enemigos: elegidos.has(u.id) ? (v.enemigos || []).filter((k) => k !== u.id) : [...(v.enemigos || []), u.id] })) }),
                h('span', null, simb.rotulo(u)),
                h('span', { style: { color: '#8fa2bd' } }, `· ${marcaDe(u.escalon)} · a ${fmtDist(d)}${d > radioSector(x.t.escalon) ? ' (lejos)' : ''}`),
              ),
            ),
            h('div', { style: E.fila }, h('button', { style: E.btnChico, onClick: () => cambiarOI(oi.id, { enemigos: sugerirEnemigos(x.t, unidades) }) }, '✨ Proponer por cercanía'), h('span', { style: E.ayuda }, `Sector: hasta ${fmtDist(radioSector(x.t.escalon))} de la tarea (criterio de la Mesa). Tildá lo que de verdad enfrenta.`)),
          )
        : h('div', { style: E.ayuda }, 'No hay fichas enemigas en el calco.'),
      h(
        'div',
        { style: E.fila },
        h('span', { style: { fontSize: 11 } }, 'O escribí cuánto enemigo hay:'),
        h('input', { type: 'number', min: 0, step: 1, style: { ...E.campo, width: 60 }, value: man.n ?? '', onChange: (e) => cambiarOI(oi.id, { enemigoManual: { ...man, n: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)), escalon: man.escalon || 'batallon' } }), 'aria-label': 'Cantidad de unidades enemigas' }),
        h('select', { style: E.sel, value: man.escalon || 'batallon', onChange: (e) => cambiarOI(oi.id, { enemigoManual: { ...man, escalon: e.target.value } }) }, ...ESCALONES.slice(2, 8).map((e) => h('option', { key: e, value: e }, cantidad(2, e).replace(/^2 /, '')))),
      ),
      h('div', { style: { fontSize: 11.5 } }, h('b', null, 'Enemigo en el sector: '), x.enemigo.gen > 0 ? `≈ ${cantidad(x.enemigo.gen, bal.G)} genéricas de maniobra` : 'ninguno', x.enemigo.apoyo.length ? ` (más ${x.enemigo.apoyo.length} de apoyo, que no entran en la proporción)` : ''),
      h('div', { style: E.rot }, 'Proporción requerida (propias : enemigas)'),
      h('select', { style: E.sel, value: x.prop.id, onChange: (e) => cambiarOI(oi.id, { proporcion: e.target.value }), 'aria-label': `Proporción ${x.op.corto}` }, ...PROPORCIONES.map((p) => h('option', { key: p.id, value: p.id }, `${p.id} — ${p.nom}`))),
      h('div', { style: E.ayuda }, `La Mesa propone ${x.propSugerida.id}: ${x.propSugerida.por}`),
      h(
        'div',
        { style: x.nivel === 'sin-enemigo' ? E.aviso : E.bien },
        x.nivel === 'sin-enemigo' ? 'Sin enemigo en el sector: no hay proporción que calcular (tildá el enemigo o escribilo).' : h('span', null, 'Hacen falta ', h('b', null, cantidad(x.requeridas, bal.G)), ` genéricas de maniobra (${n1(x.enemigo.gen)} × ${x.prop.amigo}/${x.prop.enemigo}).`),
      ),
    )
  }
  const paso3 = h(
    Paso,
    { n: 3, titulo: 'La proporción para cada tarea, frente al enemigo de su sector', ok: listo[3], abierto: abiertos[3], onAbrir: () => abrir(3) },
    h('div', { style: E.doctrina }, 'Para CADA tarea, empezando por la operación decisiva y siguiendo por todas las de configuración, la proporción requerida de unidades propias frente a las enemigas de ese sector. Es un instrumento de planeamiento para desarrollar los CAP, no se aplica al combate en sí: considera el terreno y la misión, no el tiempo, la iniciativa, la sorpresa, la logística ni los intangibles (liderazgo, adiestramiento, moral). Persecución, explotación y movimiento para hacer contacto no requieren una proporción particular (se puede usar 1:1).'),
    !bal.tareas.length && h('div', { style: E.aviso }, 'Primero el paso ②: las tareas con su operación.'),
    ...bal.tareas.map(tarjetaProporcion),
  )

  // ─── ④ Las unidades genéricas ───
  const libres = new Set(bal.libres.map((p) => p.id))
  const madres = unidades.filter(esPropia).map((u) => ({ u, piezas: simb.piezasDe(u) })).filter((m) => m.piezas.length)
  const botonPieza = (p, alTocar, estilo, titulo) => h('button', { key: p.id, style: estilo, onClick: alTocar, title: titulo }, svg(svgPieza(p.simbolo, 40, '#0e1320')))
  const zonaDe = (clave, titulo, color, piezas, pie) =>
    h(
      'div',
      { key: clave, style: { ...E.tarjeta, borderColor: activa === clave ? color : `${color}66`, boxShadow: activa === clave ? `0 0 0 2px ${color}66` : 'none', cursor: 'pointer' }, onClick: () => setActiva(clave) },
      h('div', { style: E.fila }, titulo, h('span', { style: { flex: 1 } }), activa === clave ? h('span', { style: { fontSize: 10.5, color } }, '◀ recibiendo piezas') : h('span', { style: { fontSize: 10.5, color: '#8fa2bd' } }, 'tocá para elegirla')),
      h('div', { style: E.zona }, ...piezas.map((p) => botonPieza(p, (e) => (e.stopPropagation(), asignar(p, null)), E.piezaDentro, `${p.nom} — de ${p.madre}. Tocar para sacarla.`)), !piezas.length && h('span', { style: E.ayuda }, 'Vacía.')),
      pie,
    )
  const paso4 = h(
    Paso,
    { n: 4, titulo: 'Las unidades genéricas: con qué se cumple cada tarea', ok: listo[4], abierto: abiertos[4], onAbrir: () => abrir(4) },
    h('div', { style: E.doctrina }, `Se dispone hasta DOS NIVELES INFERIORES con unidades GENÉRICAS de maniobra (acá: ${cantidad(2, bal.G).replace(/^2 /, '')}), sin tomar en cuenta todavía un tipo específico; después se suman los multiplicadores de combate. No se asignan misiones a unidades designadas: sólo se cuenta con qué se dispone. Si lo dispuesto es MENOS que lo disponible, lo demás va a una agrupación aparte; si es MÁS, la deficiencia es un posible requerimiento de recursos adicionales.`),
    h('div', { style: E.fila }, h('b', null, `Disponibles: ${cantidad(bal.totalManiobra, bal.G)} genéricas de maniobra`), h('span', null, `· requeridas: ${n1(bal.totalRequerido)}`), bal.deficiencia > 0 ? h('span', { style: E.falta }, `· FALTAN ${n1(bal.deficiencia)}`) : bal.tareas.length ? h('span', { style: E.ok }, `· sobran ${n1(bal.sobrante)}`) : null),
    h('div', { style: E.fila }, h('button', { style: E.btnPrin, onClick: repartir, disabled: !bal.tareas.length }, '⚡ Proponer el reparto (la OD primero)'), h('button', { style: E.btn, onClick: vaciar }, '🧹 Vaciar el reparto')),
    h('div', { style: E.rot }, 'Lo que tengo (tocá una tarea y después las piezas)'),
    !madres.length && h('div', { style: E.aviso }, 'No hay unidades propias en el calco. Colocalas en 🪖 Unidades y volvé: acá aparecen disgregadas en sus piezas genéricas.'),
    ...madres.map(({ u, piezas }) => {
      const sueltas = piezas.filter((p) => libres.has(p.id))
      return h(
        'div',
        { key: u.id, style: { display: 'flex', flexDirection: 'column', gap: 3 } },
        h('div', { style: { fontSize: 11.5, display: 'flex', gap: 6 } }, h('b', { style: { flex: 1 } }, simb.rotulo(u)), h('span', { style: { color: VERDE } }, `${sueltas.length}/${piezas.length} libres`)),
        h('div', { style: E.fila }, ...sueltas.map((p) => botonPieza({ ...p, grupo: simb.grupoDe(p.simbolo) }, () => tocarPieza(p), E.pieza, `${p.nom} — tocar para meterla en lo elegido`)), !sueltas.length && h('span', { style: E.ayuda }, 'Todas repartidas.')),
      )
    }),
    h('div', { style: E.rot }, 'Cada tarea, con qué la cumple'),
    ...bal.tareas.map((x) =>
      zonaDe(
        x.oi.id,
        h('span', { style: E.fila }, h('span', { style: { ...E.chip, background: x.op.color, color: '#fff' } }, x.op.corto), h('span', null, simb.nombreTarea(x.t.tarea))),
        x.op.color,
        x.piezas,
        h(
          'div',
          { style: E.fila },
          h('span', { style: x.nivel === 'falta' ? E.falta : E.ok }, x.nivel === 'sin-enemigo' ? `${n1(x.dispuestas)} dispuestas (sin enemigo en el sector)` : `${n1(x.dispuestas)} de ${cantidad(x.requeridas, bal.G)} (${x.prop.id})${x.falta ? ` — faltan ${n1(x.falta)}` : x.sobra ? ` — sobran ${n1(x.sobra)}` : ' ✓'}`),
          h('span', { style: { flex: 1 } }),
          h('select', { style: E.sel, value: x.oi.relacion || 'Orgánica', onClick: (e) => e.stopPropagation(), onChange: (e) => cambiarOI(x.oi.id, { relacion: e.target.value }), 'aria-label': 'Relación de comando' }, ...RELACIONES.map((r) => h('option', { key: r, value: r }, r))),
        ),
      ),
    ),
    zonaDe('reserva', h('span', { style: E.fila }, h('span', { style: { ...E.chip, background: RESERVA.color, color: '#10202a' } }, RESERVA.corto), h('span', null, 'Agrupación aparte (reserva): lo que sobra')), RESERVA.color, bal.reserva, bal.libresManiobra.length ? h('button', { style: { ...E.btnChico, alignSelf: 'flex-start' }, onClick: (e) => (e.stopPropagation(), sobranteAReserva()) }, `⬇️ Pasar lo que sobra (${bal.libresManiobra.length} pieza(s) de maniobra)`) : null),
    bal.deficiencia > 0 && h('div', { style: E.aviso }, `⚠️ Lo requerido supera lo disponible en ${cantidad(bal.deficiencia, bal.G)}: identificalo como un posible REQUERIMIENTO DE RECURSOS ADICIONALES al escalón superior.`),
    !!bal.perdidas.length && h('div', { style: E.aviso }, `${bal.perdidas.length} pieza(s) del reparto ya no están en el calco (se borró o cambió su unidad): quedaron afuera.`),
  )

  // ─── ⑤ En la carta ───
  const paso5 = h(
    Paso,
    { n: 5, titulo: 'Cómo queda en la carta (el calco de la organización inicial)', ok: listo[5], abierto: abiertos[5], onAbrir: () => abrir(5) },
    h('div', { style: E.doctrina }, 'Junto a cada tarea, su operación, su «T: …» y las unidades genéricas que la cumplen, como el calco de la Escuela. Con esta hoja abierta, arrastrá cada rótulo adonde se lea mejor; la línea de puntos va al enemigo de su sector.'),
    h('label', { style: { display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' } }, h('input', { type: 'checkbox', checked: bal.flujo.verEnCarta, onChange: () => setFlujo((f) => ({ ...f, verEnCarta: !f.verEnCarta })) }), 'Ver en la carta los rótulos y las unidades genéricas'),
    h('div', { style: E.fila }, ...bal.tareas.map((x) => h('button', { key: x.oi.id, style: E.btnChico, onClick: () => irA(x.t.centro, 5000) }, `🎯 ${x.op.corto}`)), bal.tareas.some((x) => x.oi.desp) && h('button', { style: E.btnChico, onClick: () => cambiarTareas((ts) => ts.map((t) => (oiDe(t).desp ? { ...t, oi: { ...oiDe(t), desp: null } } : t))) }, '↺ Rótulos junto a su tarea')),
  )

  // ─── ⑥ La forma gráfica ───
  const paso6 = h(
    Paso,
    { n: 6, titulo: 'La organización en forma gráfica', ok: listo[6], abierto: abiertos[6], onAbrir: () => abrir(6) },
    h('div', { style: E.papel, dangerouslySetInnerHTML: { __html: graficaHTML(forma) } }),
    h('div', { style: E.fila }, h('button', { style: E.btn, onClick: () => abrirParaImprimir(forma, { unidad: ctx.unidad || ctx.ordenSup?.unidad || '' }) }, '🖨️ Ver para imprimir'), h('span', { style: E.ayuda }, 'El nombre de cada agrupación sale de la Organización de la Tarea (paso ⑦).')),
  )

  // ─── ⑦ La Organización de la Tarea y el cuadro ───
  const paso7 = h(
    Paso,
    { n: 7, titulo: 'La Organización de la Tarea y el cuadro de la hoja', ok: listo[7], abierto: abiertos[7], onAbrir: () => abrir(7) },
    h('div', { style: E.doctrina }, 'La formación inicial identifica el total de unidades requeridas y los posibles métodos para tratar con el enemigo. Recién ahora se arman las agrupaciones tácticas: cada tarea pasa a la Organización de la Tarea con su operación, su tarea y sus piezas; ahí se les pone el NOMBRE (FT «VARGAS»…) y el PROPÓSITO y se llevan al calco.'),
    ...bal.tareas.map((x) => {
      const ag = orgTarea.find((a) => a.id === x.oi.agId)
      return h('div', { key: x.oi.id, style: E.item }, h('span', { style: ag ? E.ok : E.falta }, ag ? '✅' : '•'), h('span', null, h('b', null, x.op.corto), ` — ${simb.nombreTarea(x.t.tarea)}: `, ag ? `${String(ag.nombre || '').trim() || 'agrupación sin nombre'}${ag.consolidada ? ' (en el calco)' : ''}` : 'todavía no pasó a la Organización de la Tarea'))
    }),
    h('div', { style: E.fila }, h('button', { style: E.btnPrin, onClick: aOrganizacion }, '🧩 Pasar a la Organización de la Tarea'), h('button', { style: E.btn, onClick: aCuadro }, '📋 Pasar al cuadro de la hoja')),
    h('div', { style: E.ayuda }, 'El cuadro (abajo) es lo que va a la vista previa, al Word y a la IA. «🌱 Traer del calco lo que falte» también lo arma desde la carta.'),
  )

  return h(
    'div',
    { style: E.raiz, className: 'oi-editor' },
    h(
      'div',
      { style: E.cabeza },
      h('div', { style: E.cabTit }, '🧭 Formación inicial de las fuerzas — paso a paso, sobre el terreno'),
      h('div', { style: E.cabSub }, 'En orden: lo que se considera → las tareas en la carta con su OD y sus OC → la proporción de cada una → las unidades genéricas (triángulos y cuadrados) → la forma gráfica → la Organización de la Tarea.'),
      h('div', { style: E.pasos }, ...[1, 2, 3, 4, 5, 6, 7].map((n) => h('button', { key: n, style: { ...E.pasoChip, borderColor: listo[n] ? VERDE : '#ffb35c66' }, onClick: () => (abrir(n, true), document.getElementById(`oi-paso-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }, `${listo[n] ? '✅' : '○'} ${n}`))),
    ),
    msg && h('div', { style: msg.tipo === 'ok' ? E.bien : E.aviso, role: 'status' }, msg.txt, h('button', { style: { ...E.btnChico, marginLeft: 6 }, onClick: () => setMsg(null) }, '✕')),
    paso1,
    paso2,
    paso3,
    paso4,
    paso5,
    paso6,
    paso7,
    !!avisos.length && h('div', { style: E.aviso }, h('b', null, 'Lo que falta: '), ...avisos.map((a, i) => h('div', { key: i }, `${a.paso}. ${a.txt}`))),
  )
}
