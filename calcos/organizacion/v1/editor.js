// Pantalla de la F3·P3 FORMACIÓN INICIAL DE LAS FUERZAS en el Tablero del G-3. Se trabaja
// en el ORDEN de la doctrina, sobre el terreno (ver modelo.js):
//
//   ① lo que se considera (misión, intención, avenidas, CAE y objetivos del enemigo, las
//      unidades con que se cuenta —y traer de la Orden las que falten en el calco—);
//   ② las tareas tácticas en la carta: TODAS las que hagan falta, cada una con su orientación;
//   ③ las fuerzas de cada tarea: el enemigo de su sector, la proporción y CUÁNTAS de cada
//      tipo (infantería, caballería, ingeniería, comunicaciones…), que quedan junto a su
//      tarea; lo que sobra a la reserva, lo que falta como requerimiento;
//   ④ recién entonces, cuál es la OD, cuál la OC 1, la OC 2…;
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
  FUERA,
  operacionDe,
  balance,
  proponerReparto,
  moverPieza,
  oiDe,
  nuevoId,
  flujoNormal,
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
  genericas,
  fmtDist,
  esPropia,
  marcaDe,
  resumenPiezas,
  tiposDisponibles,
  piezaParaAgregar,
  piezaParaQuitar,
  origenDePiezas,
  leerOrdenDeBatalla,
  ubicarNuevas,
  yaEnElCalco,
} from './modelo.js'
import { graficaHTML, abrirParaImprimir } from './grafica.js'
import { useState, useEffect, useMemo, jsx, jsxs, simb, svgPieza, svgTarea, catalogoTareas, armas } from './runtime.js'
import { datosPuente, editorAbierto, colocar, cancelarColocar, centroVista } from './carta.js'

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
  masMenos: { minWidth: 30, height: 28, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 16, fontWeight: 800, lineHeight: 1 },
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
  tipos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 4 },
  tipo: { display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '3px 5px' },
  simbolo: { background: '#e9eef3', borderRadius: 4, padding: 1 },
  papel: { borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.25)' },
}
const CATS = [
  { id: 'enemigo', nom: 'Sobre el enemigo' },
  { id: 'terreno', nom: 'Sobre el terreno' },
  { id: 'amigas', nom: 'Acciones de las tropas propias' },
]
const n1 = (x) => String(Math.round(x * 10) / 10).replace('.', ',')
const grados = (r) => ((Math.round(Number(r) || 0) % 360) + 360) % 360
const ES_INFANTERIA = /^inf/

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
  const [nueva, setNueva] = useState(() => ({ tarea: 'bloquear', escalon: '', rot: 0 }))
  const [traer, setTraer] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    editorAbierto(true)
    return () => {
      editorAbierto(false)
      cancelarColocar()
    }
  }, [])
  // Cada tarea de la carta necesita un id propio para guardar su orientación, sus fuerzas y
  // su operación.
  useEffect(() => {
    if ((ops.tareas || []).some((t) => t && t.centro && !oiDe(t).id)) P.setOps?.((o) => ({ ...o, tareas: (o.tareas || []).map((t) => (t && t.centro && !oiDe(t).id ? { ...t, oi: { ...oiDe(t), id: nuevoId() } } : t)) }))
  }, [ops.tareas])

  const aviso = (tipo, txt) => setMsg({ tipo, txt })
  const abrir = (n, v) => setAbiertos((a) => ({ ...a, [n]: v ?? !a[n] }))
  const irAlPaso = (n) => (abrir(n, true), setTimeout(() => document.getElementById(`oi-paso-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30))
  const setFlujo = (fn) => onG3?.((prev) => ({ [CLAVE_FLUJO]: fn(flujoNormal(prev?.[CLAVE_FLUJO])) }))
  const cambiarTareas = (fn) => P.setOps?.((o) => ({ ...o, tareas: fn(o.tareas || []) }))
  const cambiarTarea = (id, cambio) => cambiarTareas((ts) => ts.map((t) => (oiDe(t).id === id ? { ...t, ...cambio } : t)))
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
  const propias = unidades.filter(esPropia)
  const fuera = (ops.tareas || []).filter((t) => t && t.centro && oiDe(t).id && oiDe(t).operacion === FUERA)
  const porOrden = [...bal.tareas].sort((a, b) => a.n - b.n)
  const sueltas = orgTarea.filter((a) => a && OPERACIONES.concat(RESERVA).some((o) => o.id === a.operacion) && !(ops.tareas || []).some((t) => oiDe(t).agId === a.id) && a.id !== bal.flujo.reserva.agId)
  const tipos = tiposDisponibles(bal, simb)
  const hayInfanteria = tipos.some((tp) => ES_INFANTERIA.test(tp.simbolo))
  const avisos = revisar(bal, { picb: ctx.picb, ops, cmoc: ctx.cmoc, g3, ordenSup: ctx.ordenSup })
  const ods = bal.tareas.filter((x) => x.op.id === 'od').length
  const listo = {
    1: !!g2.probable && objetivos.length > 0 && propias.length > 0,
    2: bal.tareas.length > 0,
    3: bal.tareas.length > 0 && bal.tareas.every((x) => x.nivel !== 'sin-enemigo' && x.nivel !== 'falta') && !bal.libresManiobra.length,
    4: bal.tareas.length > 0 && bal.tareas.every((x) => x.designada) && ods === 1,
    5: bal.flujo.verEnCarta && bal.tareas.length > 0,
    6: bal.tareas.some((x) => x.piezas.length),
    7: bal.tareas.length > 0 && bal.tareas.every((x) => x.oi.agId && orgTarea.some((a) => a.id === x.oi.agId)),
  }

  // ─── Acciones: las tareas ───
  // Dónde se puede poner una tarea SIN tocar la carta (en el teléfono la carta queda tapada):
  // en un objetivo del enemigo o en el centro de lo que se ve; después se arrastra.
  // (el centro de la vista se lee al tocar: la carta se pudo mover desde que se dibujó la hoja)
  const destinos = () => [...objetivos.map((o, i) => ({ clave: `ob${i}`, nom: `🎯 en ${o.etiqueta || `Obj. ${i + 1}`}`, centro: () => o.centro })), { clave: 'vista', nom: '⊕ en el centro de la vista', centro: centroVista }]
  const conDestino = (d, f) => {
    const c = d.centro()
    if (c) f(c)
    else aviso('info', 'La carta todavía no está lista.')
  }
  const ponerNueva = (centro) => {
    const nom = simb.nombreTarea(nueva.tarea)
    const escalon = nueva.escalon || bal.agrupacionEscalon
    const n = bal.tareas.length + 1
    P.marcar?.()
    const t = { centro, tarea: nueva.tarea, escalon, rot: grados(nueva.rot), escala: 1, oi: { id: nuevoId(), operacion: '', texto: '', enemigos: sugerirEnemigos({ centro, escalon }, unidades), proporcion: '' } }
    P.setOps?.((o) => ({ ...o, tareas: [...(o.tareas || []), t] }))
    aviso('ok', `📍 «${nom}» quedó en la carta como T${n}. Si no quedó justo en su lugar, arrastrá su símbolo (o «📍 Mover»); si apunta al revés, «⇄ Al otro lado». Poné la próxima tarea táctica, o pasá al paso ③ a darles las fuerzas.`)
  }
  const colocarNueva = () => {
    const nom = simb.nombreTarea(nueva.tarea)
    const ok = colocar({ texto: `Tocá la carta donde va «${nom}»: sobre el terreno, frente al enemigo de su sector.`, al: ponerNueva })
    if (ok) aviso('info', '📍 Tocá la carta donde va la tarea (Esc cancela).')
  }
  const moverA = (id, centro) => {
    P.marcar?.()
    cambiarTarea(id, { centro: [centro[0], centro[1]] })
  }
  const moverTocando = (id) => {
    const ok = colocar({ texto: 'Tocá la carta donde va ahora esta tarea.', al: (c) => (moverA(id, c), aviso('ok', '📍 La tarea quedó en su nuevo lugar.')) })
    if (ok) aviso('info', '📍 Tocá la carta donde va la tarea (Esc cancela).')
  }
  const girar = (id, rot) => cambiarTarea(id, { rot: grados(rot) })
  const quitarTarea = (id) => {
    if (!window.confirm('¿Quitar esta tarea táctica de la carta? Sus fuerzas vuelven a quedar libres.')) return
    P.marcar?.()
    cambiarTareas((ts) => ts.filter((t) => oiDe(t).id !== id))
  }
  const sacarDeLaOrganizacion = (id) => cambiarOI(id, { operacion: FUERA, piezas: [] })
  const partirDeOrganizacion = () => {
    const c = P.centro?.()
    const r = desdeOrganizacion({ ops, flujo: bal.flujo, orgTarea, unidades }, { centro: objetivos[0]?.centro || (c ? [c.lng, c.lat] : null), G: bal.G })
    if (!r.tareas.length && r.reserva === bal.flujo.reserva) return aviso('info', 'No hay agrupaciones con operación para traer.')
    P.marcar?.()
    if (r.tareas.length) P.setOps?.((o) => ({ ...o, tareas: [...(o.tareas || []), ...r.tareas] }))
    setFlujo((f) => ({ ...f, reserva: r.reserva }))
    aviso('ok', `⬅️ ${r.tareas.length} agrupación(es) pasaron a la carta como tareas tácticas, con su operación y sus piezas. Arrastralas a su lugar sobre el terreno y revisá la tarea de cada una.`)
  }

  // ─── Acciones: las fuerzas ───
  const asignar = (pieza, destino) => {
    P.setOps?.((o) => moverPieza({ ops: o, flujo: {} }, pieza, destino).ops)
    setFlujo((f) => moverPieza({ ops: { tareas: [] }, flujo: f }, pieza, destino).flujo)
  }
  const agregarTipo = (destino, x, tp) => {
    const p = piezaParaAgregar(bal, x || { piezas: bal.reserva }, tp.simbolo)
    if (!p) return aviso('info', `No quedan ${tp.nom || tp.corto} libres: sacalas de otra tarea o de la reserva (−), o traé más unidades de la Orden.`)
    asignar(p, destino)
  }
  const quitarTipo = (x, tp) => {
    const p = piezaParaQuitar(x || { piezas: bal.reserva }, tp.simbolo)
    if (p) asignar(p, null)
  }
  const repartir = () => {
    const r = proponerReparto(bal)
    cambiarTareas((ts) => ts.map((t) => (r.tareas[oiDe(t).id] ? { ...t, oi: { ...oiDe(t), piezas: r.tareas[oiDe(t).id] } } : t)))
    setFlujo((f) => ({ ...f, reserva: { ...f.reserva, piezas: r.reserva } }))
    aviso('ok', '⚡ Reparto propuesto: a cada tarea, las piezas de maniobra que le faltaban para su proporción; lo que sobró va a la reserva. Los apoyos (ingeniería, comunicaciones, artillería…) sumalos con «+» donde hagan falta.')
  }
  const vaciar = () => {
    if (!window.confirm('¿Vaciar el reparto? Todas las piezas vuelven a quedar libres.')) return
    cambiarTareas((ts) => ts.map((t) => (oiDe(t).id ? { ...t, oi: { ...oiDe(t), piezas: [] } } : t)))
    setFlujo((f) => ({ ...f, reserva: { ...f.reserva, piezas: [] } }))
  }
  const sobranteAReserva = () => {
    const libres = bal.libresManiobra
    if (!libres.length) return
    setFlujo((f) => ({ ...f, reserva: { ...f.reserva, piezas: [...f.reserva.piezas, ...libres] } }))
  }

  // ─── Acciones: las unidades de la Orden ───
  const docsConTexto = (ctx.documentos || []).filter((d) => d && String(d.texto || '').trim())
  const leerOrden = (texto, de) => {
    const lista = leerOrdenDeBatalla(texto).map((u, i) => ({ ...u, k: i, ya: yaEnElCalco(u, unidades) }))
    setTraer((v) => ({ ...(v || {}), lista: lista.map((u) => ({ ...u, incluir: !u.ya })), de }))
    if (!lista.length) aviso('info', `No encontré unidades en ${de}. Pegá el cuadro de la organización (la sigla y el nombre entre comillas: RIM-8 «AYACUCHO»…).`)
  }
  const cambiarTraida = (k, cambio) => setTraer((v) => ({ ...v, lista: v.lista.map((u) => (u.k === k ? { ...u, ...cambio } : u)) }))
  const ponerTraidas = () => {
    const sel = (traer?.lista || []).filter((u) => u.incluir)
    if (!sel.length) return aviso('info', 'No hay ninguna unidad tildada.')
    const c = centroVista()
    if (!c) return aviso('info', 'La carta todavía no está lista.')
    const base = Date.now()
    const fichas = ubicarNuevas(
      sel.map((u, i) => ({ id: base + i + Math.random(), bando: 'propias', tipo: 'unidad', escalon: u.escalon, arma: u.arma, instalacion: '', designacion: u.designacion, futura: false, agrupacion: false, piezas: Math.max(1, Number(u.piezas) || 3), ...(u.escalonPiezas ? { escalonPiezas: u.escalonPiezas } : {}) })),
      [c[0] - 0.018, c[1] + 0.012],
    )
    P.marcar?.()
    P.setUnidades?.((us) => [...us, ...fichas])
    setTraer(null)
    aviso('ok', `🪖 ${fichas.length} unidad(es) quedaron en la carta, en filas en el centro de la vista: arrastralas a su lugar. Ya están en «Las unidades con que cuento» (paso ③), disgregadas en sus piezas.`)
  }

  // ─── Acciones: la designación (OD, OC 1…) ───
  const designar = (id, op) => {
    const yo = bal.tareas.find((x) => x.oi.id === id)
    const otra = op && op !== 'sost' ? bal.tareas.find((x) => x.oi.id !== id && x.oi.operacion === op) : null
    const antes = yo?.oi.operacion || ''
    cambiarTareas((ts) =>
      ts.map((t) => {
        const oi = oiDe(t)
        if (oi.id === id) return { ...t, oi: { ...oi, operacion: op } }
        // La OD y cada OC son una sola: la que la tenía se queda con la que tenía esta (se intercambian).
        if (otra && oi.id === otra.oi.id) return { ...t, oi: { ...oi, operacion: antes } }
        return t
      }),
    )
    if (otra) aviso('ok', `🔁 ${operacionDe(op).corto} pasó a T${yo?.n}; T${otra.n} quedó ${antes ? `como ${operacionDe(antes).corto}` : 'sin designar'}.`)
  }
  const proponerDesignacion = () => {
    const sin = bal.tareas.filter((x) => !x.designada)
    if (!sin.length) return aviso('info', 'Todas las tareas ya están designadas.')
    const usadas = new Set(bal.tareas.map((x) => x.oi.operacion).filter(Boolean))
    const libresOps = OPERACIONES.filter((o) => o.id !== 'sost' && !usadas.has(o.id)).map((o) => o.id)
    let orden = [...sin].sort((a, b) => a.n - b.n)
    if (libresOps[0] === 'od') {
      // La OD, donde está el mayor esfuerzo: la tarea con más fuerzas (o la que más requiere).
      const od = [...sin].sort((a, b) => b.dispuestas - a.dispuestas || b.requeridas - a.requeridas || a.n - b.n)[0]
      orden = [od, ...orden.filter((x) => x !== od)]
    }
    const asign = {}
    orden.forEach((x, k) => libresOps[k] && (asign[x.oi.id] = libresOps[k]))
    cambiarTareas((ts) => ts.map((t) => (asign[oiDe(t).id] ? { ...t, oi: { ...oiDe(t), operacion: asign[oiDe(t).id] } } : t)))
    aviso('ok', `✨ ${Object.keys(asign).length} tarea(s) designada(s): la OD donde pusiste más fuerzas; las demás, OC 1, OC 2… en el orden en que las colocaste. Cambialo con los botones de cada una (se intercambian).`)
  }

  // ─── Acciones: la Organización de la Tarea y el cuadro ───
  const aOrganizacion = () => {
    if (!bal.tareas.length) return aviso('info', 'Primero las tareas tácticas (paso ②) y sus fuerzas (paso ③).')
    if (bal.tareas.some((x) => !x.designada)) return (irAlPaso(4), aviso('info', 'Primero designá cuál es la OD y cuáles las OC (paso ④): cada tarea pasa a la Organización de la Tarea con su operación.'))
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

  // ─── Piezas de la pantalla ───
  const chipOp = (x) => h('span', { style: { ...E.chip, background: x.op.color, color: x.designada ? '#fff' : '#10202a', cursor: 'default' } }, x.op.corto)
  const selTarea = (valor, onCambio) =>
    h(
      'select',
      { style: E.sel, value: valor, onChange: (e) => onCambio(e.target.value), 'aria-label': 'Tarea táctica' },
      ...CATS.map((c) => h('optgroup', { key: c.id, label: c.nom }, ...tareasZg.filter((t) => t.cat === c.id).map((t) => h('option', { key: t.id, value: t.id }, t.nombre)))),
    )
  const orientacion = (rot, onRot, quien) =>
    h(
      'div',
      { style: E.fila, className: 'oi-orientacion' },
      h('span', { style: { fontSize: 11, color: '#b9c9da' } }, 'Orientación:'),
      h('button', { style: E.btnChico, onClick: () => onRot(rot - 15), title: 'Girar 15° a la izquierda', 'aria-label': `Girar a la izquierda ${quien}` }, '↺ 15°'),
      h('button', { style: E.btnChico, onClick: () => onRot(rot + 15), title: 'Girar 15° a la derecha', 'aria-label': `Girar a la derecha ${quien}` }, '↻ 15°'),
      h('button', { style: E.btnChico, onClick: () => onRot(rot + 90), title: 'Girar un cuarto de vuelta', 'aria-label': `Girar 90 grados ${quien}` }, '↻ 90°'),
      h('button', { style: { ...E.btnChico, fontWeight: 700 }, onClick: () => onRot(rot + 180), title: 'Que apunte al otro lado', 'aria-label': `Al otro lado ${quien}` }, '⇄ Al otro lado'),
      h('input', { type: 'number', step: 5, style: { ...E.campo, width: 64 }, value: grados(rot), onChange: (e) => onRot(Number(e.target.value) || 0), 'aria-label': `Grados ${quien}` }),
      h('span', { style: { fontSize: 11 } }, '°'),
    )

  // ─── ① Lo que se considera ───
  const estado = (ok, txt, falta) => h('div', { style: E.item }, h('span', { style: ok ? E.ok : E.falta }, ok ? '✅' : '⚠️'), h('span', null, ok ? txt : falta))
  const abrirTraer = () => (setTraer((v) => v || { lista: null }), irAlPaso(3))
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
    estado(
      propias.length > 0,
      h('span', null, h('b', null, 'Las unidades con que cuento (en el calco): '), propias.map((u) => simb.rotulo(u)).join(' · '), ' ', h('button', { style: E.btnChico, onClick: abrirTraer }, '📄 ¿Falta alguna? Traerla de la Orden')),
      h('span', null, 'No hay unidades propias en el calco. ', h('button', { style: E.btnChico, onClick: abrirTraer }, '📄 Traerlas de la Orden'), ' o colocalas en 🪖 Unidades.'),
    ),
    h('div', { style: E.ayuda }, 'Después, considerá la situación de engaño: los aspectos de la situación pueden influir en dónde colocás las unidades.'),
  )

  // ─── ② Las tareas tácticas en el terreno ───
  const tarjetaTarea = (x) => {
    const { t, oi } = x
    const sug = textoSugerido(t, { unidades, objetivos }, simb)
    return h(
      'div',
      { key: oi.id, style: { ...E.tarjeta, borderColor: `${x.op.color}88` }, className: 'oi-tarea', 'data-n': String(x.n) },
      h('div', { style: E.fila }, chipOp(x), svg(svgTarea(t.tarea, 38, '#e6eef6', t.rot || 0)), selTarea(t.tarea, (v) => cambiarTarea(oi.id, { tarea: v })), h('span', { style: { flex: 1 } }), h('button', { style: E.btnChico, onClick: () => irA(t.centro), title: 'Ver en la carta' }, '🎯 Ir'), h('button', { style: E.btnChico, onClick: () => quitarTarea(oi.id), title: 'Quitar de la carta' }, '🗑️')),
      orientacion(t.rot || 0, (r) => girar(oi.id, r), x.op.corto),
      h('label', { style: { display: 'flex', gap: 5, alignItems: 'center' } }, h('b', { style: { color: x.op.color } }, 'T:'), h('input', { style: E.campo, value: oi.texto || '', placeholder: sug, onChange: (e) => cambiarOI(oi.id, { texto: e.target.value }), 'aria-label': `Texto de la tarea ${x.op.corto}` })),
      !oi.texto && h('button', { style: { ...E.btnChico, alignSelf: 'flex-start' }, onClick: () => cambiarOI(oi.id, { texto: sug }) }, `✍️ Usar «${sug.length > 60 ? sug.slice(0, 60) + '…' : sug}»`),
      h(
        'div',
        { style: E.fila },
        h('button', { style: E.btnChico, onClick: () => moverTocando(oi.id), title: 'Tocar la carta donde va' }, '📍 Mover'),
        ...destinos().map((d) => h('button', { key: d.clave, style: E.btnChico, onClick: () => conDestino(d, (c) => moverA(oi.id, c)), title: 'Llevarla ahí (después se arrastra)' }, d.nom.replace(/^(🎯|⊕) en /, '→ '))),
        h('span', { style: { flex: 1 } }),
        h('button', { style: E.btnChico, onClick: () => sacarDeLaOrganizacion(oi.id), title: 'Es una tarea del análisis de la misión u otra que no forma parte de esta organización' }, '🚫 No entra'),
      ),
    )
  }
  const paso2 = h(
    Paso,
    { n: 2, titulo: 'Las tareas tácticas en el terreno (todas las que hagan falta)', ok: listo[2], abierto: abiertos[2], onAbrir: () => abrir(2) },
    h('div', { style: E.doctrina }, 'Con el CAE más probable y los objetivos del enemigo, se colocan en la carta TODAS las tareas tácticas que hacen falta para cumplir la misión, cada una sobre el terreno, frente al enemigo de su sector, y orientada hacia donde actúa. Todavía no se dice cuál es la OD ni cuáles las OC: eso viene después de darles las fuerzas (paso ④).'),
    h(
      'div',
      { style: { ...E.tarjeta, borderColor: `${VERDE}66` }, className: 'oi-nueva' },
      h('div', { style: E.rot }, bal.tareas.length ? `➕ Otra tarea táctica (la T${bal.tareas.length + 1})` : '➕ Nueva tarea táctica'),
      h('div', { style: E.fila }, svg(svgTarea(nueva.tarea, 42, '#e6eef6', nueva.rot)), selTarea(nueva.tarea, (v) => setNueva((n) => ({ ...n, tarea: v }))), h('select', { style: E.sel, value: nueva.escalon || bal.agrupacionEscalon, onChange: (e) => setNueva((n) => ({ ...n, escalon: e.target.value })), 'aria-label': 'Magnitud del símbolo' }, ...ESCALONES.slice(2, 8).map((e) => h('option', { key: e, value: e }, `${marcaDe(e)} ${cantidad(1, e).replace(/^1 /, '')}`)))),
      orientacion(nueva.rot, (r) => setNueva((n) => ({ ...n, rot: grados(r) })), 'la nueva tarea'),
      h('button', { style: E.btnPrin, onClick: colocarNueva }, '📍 Colocarla en la carta'),
      h('div', { style: E.fila }, h('span', { style: E.ayuda }, 'o ponela directamente:'), ...destinos().map((d) => h('button', { key: d.clave, style: E.btnChico, onClick: () => conDestino(d, ponerNueva) }, d.nom))),
    ),
    ...porOrden.map(tarjetaTarea),
    !bal.tareas.length && h('div', { style: E.aviso }, 'Todavía no hay tareas tácticas en la carta.'),
    bal.tareas.length > 0 && h('div', { style: E.bien }, `${bal.tareas.length} tarea(s) táctica(s) en la carta. ¿Falta alguna? Ponela arriba. Cuando estén todas, pasá al paso ③.`),
    !!fuera.length &&
      h(
        'div',
        { style: { ...E.item, flexWrap: 'wrap' } },
        h('span', { style: E.ayuda }, 'No entran en esta organización: '),
        ...fuera.map((t) => h('button', { key: oiDe(t).id, style: E.btnChico, onClick: () => cambiarOI(oiDe(t).id, { operacion: '' }), title: 'Que entre en la organización' }, `↩ ${simb.nombreTarea(t.tarea)}`)),
      ),
    !!sueltas.length && h('div', { style: E.aviso }, `Ya armaste ${sueltas.length} agrupación(es) en la Organización de la Tarea que no están en la carta como tarea. `, h('button', { style: E.btnChico, onClick: partirDeOrganizacion }, '⬅️ Partir de lo que ya armé')),
  )

  // ─── ③ Las fuerzas de cada tarea ───
  const filaTipo = (destino, x, tp) => {
    const dentro = (x ? x.piezas : bal.reserva).filter((p) => p.simbolo === tp.simbolo).length
    if (!dentro && !tp.libres.length) return null
    const nom = tp.nom || tp.corto
    return h(
      'div',
      { key: tp.simbolo, style: { ...E.tipo, borderColor: dentro ? 'rgba(125,255,176,0.45)' : 'rgba(255,255,255,0.1)' }, className: 'oi-tipo', 'data-simbolo': tp.simbolo },
      svg(svgPieza(tp.simbolo, 30, '#0e1320'), E.simbolo),
      h('span', { style: { flex: 1, fontSize: 11.5, lineHeight: 1.2 } }, nom, h('span', { style: { color: '#8fa2bd', fontSize: 10.5 } }, ` · ${tp.libres.length} libre${tp.libres.length === 1 ? '' : 's'}`)),
      h('button', { style: { ...E.masMenos, opacity: dentro ? 1 : 0.35 }, disabled: !dentro, onClick: () => quitarTipo(x, tp), 'aria-label': `Quitar ${nom}`, title: `Quitar una de ${nom}` }, '−'),
      h('b', { style: { minWidth: 18, textAlign: 'center', fontSize: 13 } }, String(dentro)),
      h('button', { style: { ...E.masMenos, opacity: tp.libres.length ? 1 : 0.35 }, disabled: !tp.libres.length, onClick: () => agregarTipo(destino, x, tp), 'aria-label': `Agregar ${nom}`, title: `Agregar una de ${nom}` }, '+'),
    )
  }
  const piezasDe = (piezas) => h('div', { style: E.zona }, ...piezas.map((p) => h('button', { key: p.id, style: E.piezaDentro, onClick: () => asignar(p, null), title: `${p.nom} — de ${p.madre}. Tocar para sacarla.` }, svg(svgPieza(p.simbolo, 34, '#0e1320')))), !piezas.length && h('span', { style: E.ayuda }, 'Todavía sin fuerzas: sumalas con «+».'))
  const deDonde = (piezas) => {
    const o = origenDePiezas(piezas, unidades, simb)
    return o.length ? h('div', { style: E.ayuda }, 'Salen de: ', o.map((r) => `${r.nombre} (${r.cantidad})`).join(' · ')) : null
  }
  const tarjetaFuerzas = (x) => {
    const oi = x.oi
    const cerca = enemigosCerca(x.t.centro, unidades).filter((c, i) => i < 8 || (oi.enemigos || []).includes(c.u.id))
    const elegidos = new Set(oi.enemigos || [])
    const man = oi.enemigoManual || {}
    return h(
      'div',
      { key: oi.id, style: { ...E.tarjeta, borderColor: `${x.op.color}88` }, className: 'oi-fuerzas', 'data-n': String(x.n), 'data-op': x.op.id },
      h('div', { style: E.fila }, chipOp(x), svg(svgTarea(x.t.tarea, 28, '#e6eef6', x.t.rot || 0)), h('b', null, simb.nombreTarea(x.t.tarea)), h('span', { style: { flex: 1, color: '#9fb0c8', fontSize: 11 } }, oi.texto ? `T: ${oi.texto}` : ''), h('button', { style: E.btnChico, onClick: () => irA(x.t.centro) }, '🎯')),
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 2 } },
        h('div', { style: { fontSize: 11.5 } }, h('b', null, 'Enemigo en su sector: '), x.enemigo.gen > 0 ? `≈ ${genericas(x.enemigo.gen, bal.G)} de maniobra` : 'ninguno todavía', x.enemigo.apoyo.length ? ` (más ${x.enemigo.apoyo.length} de apoyo, que no entran en la proporción)` : ''),
        cerca.length
          ? h(
              'div',
              { style: { display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 } },
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
          { style: { ...E.fila, marginTop: 4 } },
          h('span', { style: { fontSize: 11 } }, 'O escribí cuánto enemigo hay:'),
          h('input', { type: 'number', min: 0, step: 1, style: { ...E.campo, width: 60 }, value: man.n ?? '', onChange: (e) => cambiarOI(oi.id, { enemigoManual: { ...man, n: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)), escalon: man.escalon || 'batallon' } }), 'aria-label': 'Cantidad de unidades enemigas' }),
          h('select', { style: E.sel, value: man.escalon || 'batallon', onChange: (e) => cambiarOI(oi.id, { enemigoManual: { ...man, escalon: e.target.value } }) }, ...ESCALONES.slice(2, 8).map((e) => h('option', { key: e, value: e }, cantidad(2, e).replace(/^2 /, '')))),
        ),
      ),
      h(
        'div',
        { style: E.fila },
        h('span', { style: E.rot }, 'Proporción'),
        h('select', { style: E.sel, value: x.prop.id, onChange: (e) => cambiarOI(oi.id, { proporcion: e.target.value }), 'aria-label': `Proporción ${x.op.corto}` }, ...PROPORCIONES.map((p) => h('option', { key: p.id, value: p.id }, `${p.id} — ${p.nom}`))),
        h('span', { style: E.ayuda }, `(la Mesa propone ${x.propSugerida.id}: ${x.propSugerida.por})`),
      ),
      h('div', { style: E.rot }, 'Sus fuerzas: cuántas de cada tipo'),
      h('div', { style: E.tipos }, ...tipos.map((tp) => filaTipo(oi.id, x, tp))),
      !tipos.length && h('div', { style: E.aviso }, 'No hay unidades propias en el calco para repartir.'),
      piezasDe(x.piezas),
      deDonde(x.piezas),
      h(
        'div',
        { style: E.fila },
        h('span', { style: x.nivel === 'falta' ? E.falta : x.nivel === 'sin-enemigo' ? { color: '#9fb0c8' } : E.ok }, x.nivel === 'sin-enemigo' ? `${n1(x.dispuestas)} de maniobra (sin enemigo en el sector: no hay proporción que calcular)` : `${n1(x.dispuestas)} de ${cantidad(x.requeridas, bal.G)} de maniobra (${x.prop.id})${x.falta ? ` — faltan ${n1(x.falta)}` : x.sobra ? ` — sobran ${n1(x.sobra)}` : ' ✓'}`),
        h('span', { style: { flex: 1 } }),
        h('select', { style: E.sel, value: oi.relacion || 'Orgánica', onChange: (e) => cambiarOI(oi.id, { relacion: e.target.value }), 'aria-label': 'Relación de comando' }, ...RELACIONES.map((r) => h('option', { key: r, value: r }, r))),
      ),
    )
  }
  const panelOrden =
    traer &&
    h(
      'div',
      { style: { ...E.tarjeta, borderColor: '#5c9dff' }, className: 'oi-traer' },
      h('div', { style: E.fila }, h('b', { style: { flex: 1 } }, '📄 Traer las unidades de la Orden (el cuadro de la organización)'), h('button', { style: E.btnChico, onClick: () => setTraer(null) }, '✕')),
      h('div', { style: E.ayuda }, 'Leo las unidades del cuadro (la sigla y el nombre entre comillas: RCB-1 «CALAMA», RIM-8 «AYACUCHO», BATING. MEC.-II «ROMAN»…), con su arma, su escalón y cuántas subunidades de combate tiene (sin la de comando ni la de C y S). Revisá lo que diga ⚠️ antes de ponerlas.'),
      docsConTexto.length > 0 && h('div', { style: E.fila }, h('span', { style: { fontSize: 11 } }, 'De los documentos del ejercicio:'), ...docsConTexto.map((d, i) => h('button', { key: i, style: E.btnChico, onClick: () => leerOrden(d.texto, `«${d.nombre}»`) }, `📄 ${String(d.nombre || `Documento ${i + 1}`).slice(0, 40)}`))),
      h('textarea', { style: { ...E.campo, minHeight: 64 }, value: traer.texto || '', placeholder: 'O pegá acá el cuadro de la organización (copiado del Word o del PDF de la Orden).', onChange: (e) => setTraer((v) => ({ ...v, texto: e.target.value })), 'aria-label': 'Cuadro de la organización' }),
      h('div', { style: E.fila }, h('button', { style: E.btn, onClick: () => leerOrden(traer.texto || '', 'lo que pegaste'), disabled: !String(traer.texto || '').trim() }, '🔎 Leer las unidades')),
      Array.isArray(traer.lista) &&
        traer.lista.length > 0 &&
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
          ...traer.lista.map((u) =>
            h(
              'div',
              { key: u.k, className: 'oi-traida', style: { ...E.fila, gap: 4, opacity: u.incluir ? 1 : 0.55, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4 } },
              h('input', { type: 'checkbox', checked: !!u.incluir, onChange: () => cambiarTraida(u.k, { incluir: !u.incluir }), 'aria-label': `Traer ${u.designacion}` }),
              h('input', { style: { ...E.campo, flex: '1 1 170px', width: 'auto', minWidth: 140 }, value: u.designacion, onChange: (e) => cambiarTraida(u.k, { designacion: e.target.value }), 'aria-label': 'Designación' }),
              h('select', { style: E.sel, value: u.arma, onChange: (e) => cambiarTraida(u.k, { arma: e.target.value }), 'aria-label': `Arma de ${u.designacion}` }, ...(armas().some((a) => a.id === u.arma) ? armas() : [{ id: u.arma, nombre: u.arma }, ...armas()]).map((a) => h('option', { key: a.id, value: a.id }, a.nombre))),
              h('select', { style: E.sel, value: u.escalon, onChange: (e) => cambiarTraida(u.k, { escalon: e.target.value }), 'aria-label': `Escalón de ${u.designacion}` }, ...ESCALONES.slice(2, 8).map((e) => h('option', { key: e, value: e }, cantidad(1, e).replace(/^1 /, '')))),
              h('input', { type: 'number', min: 1, max: 12, style: { ...E.campo, width: 50 }, value: u.piezas, onChange: (e) => cambiarTraida(u.k, { piezas: Math.max(1, Math.min(12, Number(e.target.value) || 1)) }), title: 'Cuántas piezas genéricas (subunidades de combate)', 'aria-label': `Piezas de ${u.designacion}` }),
              h('span', { style: { fontSize: 10.5 } }, 'piezas'),
              u.ya ? h('span', { style: { ...E.ok, fontSize: 10.5 } }, 'ya en el calco') : u.revisar ? h('span', { style: { ...E.falta, fontSize: 10.5 }, title: u.nota || 'Revisalo' }, `⚠️ ${u.nota || 'revisar'}`) : null,
            ),
          ),
        ),
      Array.isArray(traer.lista) && traer.lista.length > 0 && h('button', { style: E.btnPrin, onClick: ponerTraidas }, `🪖 Ponerlas en la carta (${traer.lista.filter((u) => u.incluir).length})`),
    )
  const paso3 = h(
    Paso,
    { n: 3, titulo: 'Las fuerzas de cada tarea: la proporción y cuántas de cada tipo', ok: listo[3], abierto: abiertos[3], onAbrir: () => abrir(3) },
    h('div', { style: E.doctrina }, `Para CADA tarea, la proporción requerida de unidades propias frente a las enemigas de su sector (un instrumento de planeamiento: considera el terreno y la misión, no el tiempo, la iniciativa, la sorpresa, la logística ni los intangibles; persecución, explotación y movimiento para hacer contacto no requieren una proporción particular: 1:1). Se dispone hasta DOS NIVELES INFERIORES con unidades GENÉRICAS (acá: ${cantidad(2, bal.G).replace(/^2 /, '')}), primero las de maniobra y después los multiplicadores de combate (ingeniería, comunicaciones, artillería…). Lo que sobra va a una agrupación aparte; si falta, la deficiencia es un posible requerimiento de recursos adicionales.`),
    h('div', { style: E.rot }, 'Las unidades con que cuento'),
    tipos.length
      ? h('div', { style: E.fila }, ...tipos.map((tp) => h('span', { key: tp.simbolo, style: { ...E.tipo, padding: '2px 6px' }, title: tp.nom }, svg(svgPieza(tp.simbolo, 24, '#0e1320'), E.simbolo), h('span', { style: { fontSize: 11 } }, `${tp.corto || tp.nom} ${tp.libres.length}/${tp.total}`))))
      : h('div', { style: E.aviso }, 'No hay unidades propias en el calco.'),
    h('div', { style: E.ayuda }, propias.map((u) => `${simb.rotulo(u)} (${simb.piezasDe(u).length})`).join(' · ')),
    !hayInfanteria && propias.length > 0 && h('div', { style: E.aviso }, '⚠️ No hay INFANTERÍA entre las unidades del calco. Si la Orden la tiene (RIM, RIAT…), traela: ', h('button', { style: E.btnChico, onClick: () => setTraer((v) => v || { lista: null }) }, '📄 Traer las unidades de la Orden')),
    !traer && (hayInfanteria || !propias.length) && h('div', { style: E.fila }, h('button', { style: E.btnChico, onClick: () => setTraer({ lista: null }) }, '📄 ¿Falta alguna unidad? Traerla de la Orden')),
    panelOrden,
    !bal.tareas.length && h('div', { style: E.aviso }, 'Primero el paso ②: las tareas tácticas en la carta.'),
    bal.tareas.length > 0 && h('div', { style: E.fila }, h('b', null, `Disponibles: ${genericas(bal.totalManiobra, bal.G)} de maniobra`), h('span', null, `· requeridas: ${n1(bal.totalRequerido)}`), bal.deficiencia > 0 ? h('span', { style: E.falta }, `· FALTAN ${n1(bal.deficiencia)}`) : h('span', { style: E.ok }, `· sobran ${n1(bal.sobrante)}`)),
    bal.tareas.length > 0 && h('div', { style: E.fila }, h('button', { style: E.btnPrin, onClick: repartir }, '⚡ Proponer el reparto de la maniobra'), h('button', { style: E.btn, onClick: vaciar }, '🧹 Vaciar el reparto')),
    ...porOrden.map(tarjetaFuerzas),
    bal.tareas.length > 0 &&
      h(
        'div',
        { key: 'reserva', style: { ...E.tarjeta, borderColor: `${RESERVA.color}88` }, className: 'oi-fuerzas', 'data-op': 'reserva' },
        h('div', { style: E.fila }, h('span', { style: { ...E.chip, background: RESERVA.color, color: '#10202a', cursor: 'default' } }, RESERVA.corto), h('b', null, 'Agrupación aparte (reserva): lo que sobra')),
        h('div', { style: E.tipos }, ...tipos.map((tp) => filaTipo('reserva', null, tp))),
        piezasDe(bal.reserva),
        bal.libresManiobra.length > 0 && h('button', { style: { ...E.btnChico, alignSelf: 'flex-start' }, onClick: sobranteAReserva }, `⬇️ Pasar lo que sobra (${bal.libresManiobra.length} pieza(s) de maniobra)`),
      ),
    bal.deficiencia > 0 && h('div', { style: E.aviso }, `⚠️ Lo requerido supera lo disponible en ${cantidad(bal.deficiencia, bal.G)}: identificalo como un posible REQUERIMIENTO DE RECURSOS ADICIONALES al escalón superior.`),
    !!bal.perdidas.length && h('div', { style: E.aviso }, `${bal.perdidas.length} pieza(s) del reparto ya no están en el calco (se borró o cambió su unidad): quedaron afuera.`),
  )

  // ─── ④ La designación: OD, OC 1, OC 2… ───
  const tarjetaDesignar = (x) => {
    const fuerzas = resumenPiezas(x.piezas, bal.G, simb)
    return h(
      'div',
      { key: x.oi.id, style: { ...E.tarjeta, borderColor: `${x.op.color}88` }, className: 'oi-designar', 'data-n': String(x.n) },
      h('div', { style: E.fila }, h('span', { style: { ...E.chip, cursor: 'default' } }, `T${x.n}`), svg(svgTarea(x.t.tarea, 28, '#e6eef6', x.t.rot || 0)), h('b', null, simb.nombreTarea(x.t.tarea)), h('span', { style: { flex: 1, color: '#9fb0c8', fontSize: 11 } }, x.oi.texto ? `T: ${x.oi.texto}` : ''), h('span', { style: { fontSize: 11 } }, fuerzas.length ? fuerzas.join(' + ') : 'sin fuerzas')),
      h(
        'div',
        { style: E.fila },
        ...OPERACIONES.map((o) => {
          const mia = x.oi.operacion === o.id
          const otra = !mia && o.id !== 'sost' && bal.tareas.find((y) => y.oi.operacion === o.id)
          return h('button', { key: o.id, onClick: () => designar(x.oi.id, o.id), style: { ...E.chip, ...(mia ? { background: o.color, color: '#fff', border: `1px solid ${o.color}` } : otra ? { borderStyle: 'dashed', color: '#8fa2bd' } : {}) }, title: otra ? `${o.nom} — la tiene T${otra.n} (se intercambian)` : o.nom }, otra ? `${o.corto} (T${otra.n})` : o.corto)
        }),
        h('button', { key: 'nada', onClick: () => designar(x.oi.id, ''), style: { ...E.chip, ...(!x.designada ? { background: 'rgba(255,255,255,0.18)' } : {}) }, title: 'Sin designar todavía' }, '—'),
      ),
    )
  }
  const paso4 = h(
    Paso,
    { n: 4, titulo: 'Cuál es la OD y cuáles las OC', ok: listo[4], abierto: abiertos[4], onAbrir: () => abrir(4) },
    h('div', { style: E.doctrina }, 'Con las tareas en el terreno y sus fuerzas, se designa la OPERACIÓN DECISIVA (el esfuerzo principal, en el PUNTO DECISIVO: la que cumple directamente la misión) y las OPERACIONES DE CONFIGURACIÓN (los esfuerzos secundarios que crean las condiciones para que la OD tenga éxito): OC 1, OC 2… La OD y cada OC son una sola; SOST, el sostenimiento.'),
    !bal.tareas.length && h('div', { style: E.aviso }, 'Primero el paso ②: las tareas tácticas en la carta.'),
    bal.tareas.length > 0 && h('div', { style: E.fila }, h('button', { style: E.btn, onClick: proponerDesignacion }, '✨ Proponer: la OD donde más fuerzas hay; las demás, OC en orden')),
    ...porOrden.map(tarjetaDesignar),
    bal.tareas.length > 0 && ods === 0 && h('div', { style: E.aviso }, 'Falta la OD: tocá «OD» en la tarea que es el esfuerzo principal.'),
    listo[4] && h('div', { style: E.bien }, '✅ Todas designadas, con una sola OD. En la carta, cada tarea ya muestra su OD / OC.'),
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
      h('div', { style: E.cabSub }, 'En orden: lo que se considera → TODAS las tareas tácticas en la carta, orientadas → las fuerzas de cada una (cuántas de cada tipo, junto a su tarea) → cuál es la OD y cuáles las OC → la forma gráfica → la Organización de la Tarea.'),
      h('div', { style: E.pasos }, ...[1, 2, 3, 4, 5, 6, 7].map((n) => h('button', { key: n, style: { ...E.pasoChip, borderColor: listo[n] ? VERDE : '#ffb35c66' }, onClick: () => irAlPaso(n) }, `${listo[n] ? '✅' : '○'} ${n}`))),
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
