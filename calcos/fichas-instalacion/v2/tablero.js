// TABLERO G-4 DE UNA INSTALACIÓN — lo que se abre al tocar una instalación en la carta.
//
// Antes era una ficha documental de puro texto. Ahora es el tablero del G-4 con GRÁFICOS
// Y NÚMEROS sacados del calco: a qué unidades apoya la instalación (también una Fuerza de
// Tarea, sumando sus piezas), cuánta gente, cuántos vehículos y qué armas tienen, cuánto
// consumen por día en esta operación (la defensa sube la Clase IV y la V), cuántos
// camiones / cisternas / ambulancias hacen falta, cuántos viajes y cada cuánto, el ciclo
// de cada vehículo en la jornada y el croquis del apoyo. Todo se puede corregir (datos
// de cada unidad, factores, frecuencia, modalidad) y se acuesta en la carta. La IA recibe
// todo eso más las ideas del oficial (se copia el pedido y se pega la respuesta).
//
// Pestañas: 📊 Tablero · 🪖 Unidades apoyadas · ⚙ Factores · 🤖 IA · 📚 Documentos.
// Se guarda: en la instalación `tableroG4` (frecuencia, modalidad, disponibles, ideas, IA)
// y `apoyaA` (si el oficial eligió a quién apoya); en cada unidad apoyada `logDatos`
// (efectivos, vehículos y armas reales); y en el calco `ops.planLog` (factores y operación).
import { useCalco, calcoActual, accion, catalogo, encabezadoIA, mostrarFlujos, ocultarFlujos, flujosVisibles, verEnCarta } from '../../logistica/v1/runtime.js'
import {
  planInstalacion,
  operacionDelCalco,
  unidadesQueReciben,
  perfilUnidad,
  posicion,
  resumenCorto,
  textoPlan,
  CLASES,
  SERIES_CLASES,
  VEHICULOS,
  ARMAS,
  MEDIOS,
  MODALIDADES,
  OPERACIONES_PLAN,
  FILAS_FACTORES,
  FACTORES_DEFECTO,
  AVISO_FACTORES,
  FUENTE_OPERACION,
  leerRuta,
  fijarRuta,
  rutaCambiada,
  medioDe,
  claseDe,
  fmtN,
  fmtT,
  fmtL,
  fmtCant,
  fmtFrec,
  ESCALONES,
} from '../../logistica/v1/planeamiento.js'
import { nombreUnidad } from '../../logistica/v1/analisis.js'
import { masCercano } from '../../logistica/v1/geo.js'
import * as G from '../../logistica/v1/graficos.js'
import { PEDIDOS, PEDIDOS_DEFECTO, generarPromptG4, leerRespuestaG4 } from './ia.js'

const PESTANAS = [
  { id: 'tablero', nom: '📊 Tablero' },
  { id: 'unidades', nom: '🪖 Unidades apoyadas' },
  { id: 'factores', nom: '⚙ Factores' },
  { id: 'ia', nom: '🤖 IA' },
  { id: 'documentos', nom: '📚 Documentos' },
]
const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
const VACIO = Object.freeze({})
const TIPOS_FT = { infanteria: '#3987e5', mecanizada: '#199e70', blindada: '#d95926', caballeria: '#c98500', artilleria: '#9085e9', art155: '#9085e9', morteros: '#d55181', antitanque: '#c98500', ingenieria: '#8a96a8', ada: '#8a96a8', andina: '#3987e5', aerotransportada: '#3987e5', otras: '#8a96a8' }

// El plan de una instalación con el calco vivo (lo usan el tablero y el globo de la carta).
function planDe(inst, unidades, calco, info) {
  return planInstalacion(inst, { ops: calco.ops || {}, unidades: unidades || calco.unidades || [], conceptoApoyo: calco.conceptoApoyo || [] }, { info: info || {}, plan: calco.ops?.planLog || {}, tablero: inst?.tableroG4 || {} })
}
const valorPrincipal = (plan) =>
  plan.modo === 'sanidad'
    ? { rot: 'Heridos / día', valor: fmtN(plan.totales.heridos, 1), sub: `${fmtN(plan.totales.muertos, 1)} muertos/día (estimado)` }
    : plan.modo === 'mant'
      ? { rot: 'Averías / día', valor: fmtN(plan.totales.averias, 1), sub: `de ${fmtN(plan.totales.vehiculos)} vehículos` }
      : plan.modo === 'personal'
        ? { rot: 'Bajas / día', valor: fmtN(plan.totales.heridos + plan.totales.muertos, 1), sub: 'reemplazos a reunir' }
        : { rot: 'Mueve por día', valor: fmtT(plan.totales.t), sub: plan.clases.length === CLASES.length ? 'todas las clases' : plan.clases.map((c) => claseDe(c)?.corto).join(' + ') }

// ─── El globo de la carta (popup) ─────────────────────────────────────────────────
const escH = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
export function resumenHTML(inst, calco, info) {
  const plan = planDe(inst, calco.unidades, calco, info)
  const vp = valorPrincipal(plan)
  const max = Math.max(1e-9, ...plan.filas.map((f) => (plan.modo === 'sanidad' ? f.heridos : plan.modo === 'mant' ? f.averias : plan.modo === 'personal' ? f.heridos + f.muertos : f.t)))
  const filas = plan.filas
    .slice(0, 8)
    .map((f) => {
      const v = plan.modo === 'sanidad' ? f.heridos : plan.modo === 'mant' ? f.averias : plan.modo === 'personal' ? f.heridos + f.muertos : f.t
      const txt = plan.modo === 'abast' || plan.modo === 'general' ? fmtT(v) : fmtN(v, 1)
      return `<div style="display:grid;grid-template-columns:96px 1fr 44px;gap:5px;align-items:center;font:11px system-ui"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escH(f.nombre)}">${escH(f.nombre)}</span><span style="height:8px;background:#e7ebf0;border-radius:3px"><span style="display:block;height:8px;width:${((100 * v) / max).toFixed(1)}%;background:#d95926;border-radius:3px"></span></span><b style="text-align:right">${escH(txt)}</b></div>`
    })
    .join('')
  const flota = plan.flota.map((x) => `<b>${x.vehiculos}</b> ${escH(x.vehiculos === 1 ? x.corto : x.plural)}`).join(' · ')
  return `<div style="min-width:230px;max-width:280px;margin-top:6px;display:flex;flex-direction:column;gap:5px;font:12px system-ui;color:#1b2533">
<div style="font-size:10px;color:#5b6b80;text-transform:uppercase;letter-spacing:.04em">Apoya a ${plan.filas.length} unidad(es) · ${escH(plan.operacion.nom)}</div>
<div style="display:flex;gap:10px;flex-wrap:wrap"><span><b style="font-size:16px">${fmtN(plan.totales.hombres)}</b> hombres</span><span><b style="font-size:16px">${fmtN(plan.totales.vehiculos)}</b> vehículos</span><span><b style="font-size:16px">${escH(vp.valor)}</b> ${escH(vp.rot.toLowerCase())}</span></div>
${filas}${plan.filas.length > 8 ? `<div style="font-size:10px;color:#5b6b80">y ${plan.filas.length - 8} más…</div>` : ''}
${flota ? `<div>🚚 ${flota} · ${escH(fmtFrec(plan.frecuenciaH))}</div>` : ''}
${plan.avisos.length ? `<div style="color:#b3261e;font-size:11px">⚠ ${escH(plan.avisos[0])}</div>` : ''}
</div>`
}
if (typeof window !== 'undefined') {
  window.SIDResumenInst = (id, el) => {
    try {
      const calco = calcoActual()
      const inst = (calco.unidades || []).find((u) => u.id === id)
      const cat = catalogo()
      if (!inst || !el) return
      el.innerHTML = resumenHTML(inst, calco, cat ? cat(inst.instalacion) : {})
    } catch (e) {
      if (el) el.textContent = ''
    }
  }
}

// ─── Guardado diferido (los textos no se guardan en cada tecla) ────────────────────
function useDiferido(R, inicial, guardar, ms = 600) {
  const [v, setV] = R.useState(inicial)
  const ref = R.useRef(inicial)
  const pend = R.useRef(false)
  const g = R.useRef(guardar)
  g.current = guardar
  R.useEffect(() => {
    if (!pend.current) {
      ref.current = inicial
      setV(inicial)
    }
  }, [inicial])
  R.useEffect(() => {
    if (!pend.current) return
    const t = setTimeout(() => {
      pend.current = false
      g.current(ref.current)
    }, ms)
    return () => clearTimeout(t)
  }, [v])
  R.useEffect(() => () => pend.current && g.current(ref.current), [])
  const set = (nuevo) => {
    const x = typeof nuevo === 'function' ? nuevo(ref.current) : nuevo
    ref.current = x
    pend.current = true
    setV(x)
  }
  const ya = () => {
    if (pend.current) {
      pend.current = false
      g.current(ref.current)
    }
  }
  return [v, set, ya]
}

// ════════════════════════════════════════════════════════════════════════════════════
export default function FichaInstalacion({ react: R, unidades = [], documentos = [], ejercicio = '', info: buscarInfo, onEditar, onAgregarDocumentos }) {
  const h = R.createElement
  const [id, setId] = R.useState(null)
  const [minimo, setMinimo] = R.useState(false)
  const calco = useCalco()
  const idRef = R.useRef(null)
  idRef.current = id
  R.useEffect(() => {
    const abrir = (e) => {
      setId(e.detail?.id ?? null)
      setMinimo(false)
    }
    // Tocar la instalación en la carta 2D abre su globo (con el resumen y el botón del
    // tablero); si el tablero ya está abierto pasa a esa instalación, y en el 3D (donde el
    // globo no se ve) se abre directo.
    const tocada = (e) => {
      if (idRef.current != null || window.__map3d) abrir(e)
    }
    window.addEventListener('sideceme:ficha-instalacion', abrir)
    window.addEventListener('sideceme:instalacion-tocada', tocada)
    return () => {
      window.removeEventListener('sideceme:ficha-instalacion', abrir)
      window.removeEventListener('sideceme:instalacion-tocada', tocada)
    }
  }, [])
  R.useEffect(() => setId(null), [ejercicio])
  R.useEffect(() => () => ocultarFlujos(), [])
  const instaladas = unidades.filter((u) => u.tipo === 'instalacion')
  const unidad = instaladas.find((u) => u.id === id)
  R.useEffect(() => {
    if (!unidad) ocultarFlujos()
  }, [!!unidad])
  if (!unidad) return null
  const info = buscarInfo(unidad.instalacion) || {}
  return h(
    'section',
    { className: 'sid-fi sid-tg' + (minimo ? ' sid-fi-min' : ''), 'aria-label': 'Tablero G-4 de la instalación', 'data-tablero-g4': unidad.id },
    h(
      'header',
      { className: 'sid-fi-cab' },
      h(
        'div',
        { style: { minWidth: 0 } },
        h('strong', null, '📊 TABLERO G-4 · INSTALACIÓN'),
        h(
          'select',
          { 'aria-label': 'Instalación del tablero', value: String(id), onChange: (e) => { const u = instaladas.find((x) => String(x.id) === e.target.value); if (u) setId(u.id) } },
          ...instaladas.map((u) => h('option', { key: u.id, value: String(u.id) }, `${u.designacion || buscarInfo(u.instalacion)?.nom || 'Instalación'}`)),
        ),
      ),
      h('div', { className: 'sid-fi-acciones' }, h('button', { onClick: () => setMinimo(!minimo), 'aria-label': minimo ? 'Ampliar el tablero' : 'Minimizar el tablero' }, minimo ? 'AMPLIAR' : 'MINIMIZAR'), h('button', { onClick: () => setId(null), 'aria-label': 'Cerrar el tablero' }, '✕')),
    ),
    !minimo && h(Tablero, { key: `${ejercicio}:${unidad.id}`, R, unidad, unidades, info, calco, documentos, onEditar, onAgregarDocumentos }),
  )
}

function Tablero({ R, unidad, unidades, info, calco, documentos, onEditar, onAgregarDocumentos }) {
  const h = R.createElement
  const [pest, setPest] = R.useState('tablero')
  const [aviso, setAviso] = R.useState('')
  const [enCarta, setEnCarta] = R.useState(flujosVisibles())
  const tab = esObj(unidad.tableroG4) ? unidad.tableroG4 : {}
  const plan = planDe(unidad, unidades, calco, info)
  const planLog = esObj(calco.ops?.planLog) ? calco.ops.planLog : {}
  const editarTab = (patch) => onEditar?.(unidad.id, { tableroG4: { ...(esObj(unidad.tableroG4) ? unidad.tableroG4 : {}), ...patch } })
  const editarPlanLog = (patch) => {
    const set = accion('setOps')
    if (!set) return setAviso('Esta versión de la Mesa no deja guardar los factores.')
    set((o) => ({ ...o, planLog: { ...(esObj(o.planLog) ? o.planLog : {}), ...patch } }))
  }
  const acostar = (forzar) => {
    if (enCarta && !forzar) {
      ocultarFlujos()
      setEnCarta(false)
      return
    }
    const origen = posicion(unidad)
    const vp = (f) => (plan.modo === 'sanidad' ? f.heridos : plan.modo === 'mant' ? f.averias : plan.modo === 'personal' ? f.heridos + f.muertos : f.t)
    const ok = mostrarFlujos(
      origen,
      plan.filas.map((f) => ({ p: posicion(f.u), peso: vp(f), color: f.dentro ? '#ffb020' : '#d03b3b', rot: `${f.nombre}: ${plan.modo === 'abast' || plan.modo === 'general' ? fmtT(f.t) + '/día' : fmtN(vp(f), 1) + '/día'} · ${fmtN(f.km, 1)} km · ${Object.values(f.porMedio).reduce((s, x) => s + x.viajesEntrega, 0)} viaje(s)` })),
    )
    setEnCarta(ok)
    setAviso(ok ? '🗺️ Flujos acostados en la carta: una flecha a cada unidad apoyada (grosor = lo que recibe por día).' : 'Los flujos se dibujan en la carta 2D: volvé a la vista 2D.')
  }
  // Si cambia el plan con la carta prendida, se redibuja.
  const firma = JSON.stringify(plan.filas.map((f) => [f.id, Math.round(f.t * 10), Math.round(f.km * 10)]))
  R.useEffect(() => {
    if (enCarta) acostar(true)
  }, [firma])

  const vp = valorPrincipal(plan)
  const principal = plan.flota[0]
  const viajes = plan.flota.reduce((s, x) => s + x.viajesDia, 0)
  const fuera = plan.filas.filter((f) => !f.dentro).length
  const chips = h(
    'div',
    { className: 'sid-tg-controles' },
    h('label', null, 'Operación ', h('select', { value: planLog.operacion || '', onChange: (e) => editarPlanLog({ operacion: e.target.value || undefined }) }, h('option', { value: '' }, `Del calco: ${operacionDelCalco({ ops: calco.ops }, {}).nom}`), ...OPERACIONES_PLAN.map((o) => h('option', { key: o.id, value: o.id }, o.nom)))),
    h('label', null, 'Distribución ', h('select', { value: tab.modalidad || '', onChange: (e) => editarTab({ modalidad: e.target.value || undefined }) }, h('option', { value: '' }, `Del concepto: ${MODALIDADES.find((m) => m.id === plan.modalidad)?.nom}`), ...MODALIDADES.map((m) => h('option', { key: m.id, value: m.id }, m.nom)))),
    h('label', null, 'Entrega ', h('select', { value: String(plan.frecuenciaH), onChange: (e) => editarTab({ frecuenciaH: +e.target.value }) }, ...[12, 24, 48, 72].map((x) => h('option', { key: x, value: String(x) }, fmtFrec(x))))),
    h('button', { className: enCarta ? 'sid-fi-pri' : '', onClick: () => acostar(false), 'data-accion': 'acostar' }, enCarta ? '🙈 Quitar de la carta' : '🗺️ Acostar en la carta'),
    h('button', { onClick: () => verEnCarta([[posicion(unidad)].filter(Boolean), plan.filas.map((f) => posicion(f.u)).filter(Boolean)]) }, '📍 Ver'),
    h('button', { 'data-accion': 'imagen', title: 'Bajar la pestaña que estás viendo como imagen PNG (para pegar en tus documentos)', onClick: async (e) => setAviso(await G.exportarImagen(e.currentTarget.closest('.sid-tg-cuerpo')?.querySelector('.sid-tg-pagina > div'), `Tablero ${plan.inst.nombre}`, '#17212e')) }, '🖼️ Imagen'),
  )
  return h(
    'div',
    { className: 'sid-tg-cuerpo' },
    h(
      'div',
      { className: 'sid-tg-sub' },
      h('div', { className: 'sid-tg-ident' }, h('b', null, info.nom || unidad.instalacion || 'Instalación'), h('span', null, `${plan.zona ? `en ${plan.zona} · ` : ''}${plan.clases.length && plan.clases.length < CLASES.length ? plan.clases.map((c) => claseDe(c)?.nom).join(' · ') : plan.modo === 'sanidad' ? 'Sanidad' : plan.modo === 'mant' ? 'Mantenimiento' : plan.modo === 'personal' ? 'Personal' : 'Todas las clases'} · ${plan.operacion.nom}`)),
      chips,
    ),
    h('nav', { className: 'sid-tg-pest', role: 'tablist' }, ...PESTANAS.map((p) => h('button', { key: p.id, role: 'tab', 'aria-selected': pest === p.id ? 'true' : 'false', className: pest === p.id ? 'on' : '', onClick: () => setPest(p.id), 'data-pestana': p.id }, p.nom))),
    aviso && h('div', { className: 'sid-tg-aviso', role: 'status' }, aviso, h('button', { onClick: () => setAviso(''), 'aria-label': 'Cerrar aviso' }, '✕')),
    h(
      'div',
      { className: 'sid-tg-pagina' },
      pest === 'tablero' && h(PaginaTablero, { R, unidad, plan, tab, vp, principal, viajes, fuera, editarTab, irA: setPest, calco }),
      pest === 'unidades' && h(PaginaUnidades, { R, unidad, unidades, plan, onEditar }),
      pest === 'factores' && h(PaginaFactores, { R, plan, planLog, editarPlanLog }),
      pest === 'ia' && h(PaginaIA, { R, unidad, plan, tab, editarTab, editarPlanLog, planLog, setAviso }),
      pest === 'documentos' && h(PaginaDocumentos, { R, unidad, documentos, onEditar, onAgregarDocumentos }),
    ),
  )
}

// ─── 📊 TABLERO ──────────────────────────────────────────────────────────────────────
function PaginaTablero({ R, unidad, plan, tab, vp, principal, viajes, fuera, editarTab, irA, calco }) {
  const h = R.createElement
  const abast = plan.modo === 'abast' || plan.modo === 'general'
  const t = plan.totales
  const disp = esObj(tab.disponibles) ? tab.disponibles : {}
  const items = [
    { icono: '🪖', rot: 'Unidades apoyadas', valor: String(plan.filas.length), sub: plan.filas.some((f) => f.perfil.esFT) ? `${plan.filas.filter((f) => f.perfil.esFT).length} Fuerza(s) de Tarea` : plan.apoyo.modo === 'oficial' ? 'elegidas por el oficial' : 'dedujo la Mesa' },
    { icono: '👥', rot: 'Efectivos', valor: fmtN(t.hombres), sub: plan.filas.some((f) => f.perfil.estimado) ? 'hay estimados (⚙ corregí en Unidades)' : 'datos del oficial', estado: plan.filas.some((f) => f.perfil.estimado) ? 'alerta' : 'bien' },
    { icono: '🚙', rot: 'Vehículos apoyados', valor: fmtN(t.vehiculos), sub: VEHICULOS.map((v) => [v, plan.filas.reduce((s, f) => s + (f.perfil.veh[v.id] || 0), 0)]).filter(([, n]) => n).map(([v, n]) => `${n} ${v.corto}`).join(' · ') },
    { icono: abast ? '📦' : plan.modo === 'sanidad' ? '🩺' : plan.modo === 'mant' ? '🔧' : '👤', rot: vp.rot, valor: vp.valor, sub: vp.sub },
    principal ? { icono: '🚚', rot: `Flota · ${principal.plural}`, valor: String(principal.vehiculos), sub: plan.flota.length > 1 ? plan.flota.slice(1).map((x) => `+ ${x.vehiculos} ${x.vehiculos === 1 ? x.corto : x.plural}`).join(' ') : `capacidad ${fmtN(principal.cap)} ${principal.unidadCap}`, estado: Number.isFinite(+disp[principal.id]) ? (+disp[principal.id] >= principal.vehiculos ? 'bien' : 'mal') : undefined } : null,
    { icono: '🔁', rot: 'Viajes por día', valor: fmtN(viajes, viajes < 10 ? 1 : 0), sub: fmtFrec(plan.frecuenciaH) },
    { icono: '📏', rot: 'Más lejana', valor: plan.filas.length ? `${fmtN(Math.max(...plan.filas.map((f) => f.ciclo.carretera)), 0)} km` : '—', sub: fuera ? `${fuera} fuera de la DMA` : 'por carretera (estimada)', estado: fuera ? 'mal' : plan.filas.length ? 'bien' : undefined },
  ].filter(Boolean)
  const serie = SERIES_CLASES.filter((s) => s.clases.some((c) => plan.clases.includes(c)))
  const valorFila = (f) => (plan.modo === 'sanidad' ? f.heridos : plan.modo === 'mant' ? f.averias : plan.modo === 'personal' ? f.heridos + f.muertos : f.t)
  // Croquis del apoyo.
  const zona = (calco.ops?.zonasLog || []).find((z) => plan.zona && (z.clave === unidad.areaLog))
  const fr = calco.ops?.areaOps?.frente
  const croquis = G.croquis(h, {
    dato: 'croquis',
    rotulo: 'Croquis del apoyo: la instalación y las unidades que apoya',
    alto: 250,
    ancho: 420,
    foco: [posicion(unidad), ...plan.filas.map((f) => posicion(f.u)), Array.isArray(fr) && fr.length >= 2 && posicion(unidad) ? masCercano(posicion(unidad), fr) : null],
    poligonos: [...(calco.ops?.zonasLog || []).filter((z) => ['asdi', 'arce'].includes(z.zona) && (z.elegida || z === zona || z.clave === unidad.areaLog)).map((z) => ({ coords: z.coords, color: '#ffc278', relleno: '#ffc278', opacidad: 0.12, trazo: '5 4', titulo: z.zona.toUpperCase() }))],
    lineas: [...(Array.isArray(fr) && fr.length >= 2 ? [{ coords: fr, color: '#d03b3b', grosor: 2.5, rot: 'LPR / LC', trazo: '' }] : []), ...(calco.ops?.ejesLog || []).filter((e) => e.tipo === 'epa').map((e) => ({ coords: e.coords, color: '#8a96a8', grosor: 1.5, trazo: '6 4', rot: 'EPA' }))],
    flechas: plan.filas.filter((f) => posicion(f.u) && posicion(unidad)).map((f) => {
      const mx = Math.max(1e-9, ...plan.filas.map(valorFila))
      return { de: posicion(unidad), a: posicion(f.u), grosor: 1.5 + (5 * valorFila(f)) / mx, color: f.dentro ? '#ffb020' : '#d03b3b', rot: abast ? fmtT(f.t) : fmtN(valorFila(f), 1), titulo: `${f.nombre}: ${fmtN(f.km, 1)} km en línea recta, ciclo ${fmtN(f.ciclo.horas, 1)} h` }
    }),
    puntos: [
      ...plan.filas.filter((f) => posicion(f.u)).map((f) => ({ p: posicion(f.u), forma: 'unidad', color: '#3987e5', rot: f.nombre.length > 22 ? f.nombre.slice(0, 21) + '…' : f.nombre, titulo: `${f.nombre}: ${fmtN(f.perfil.hombres)} hombres, ${fmtN(f.perfil.vehTotal)} vehículos` })),
      ...(posicion(unidad) ? [{ p: posicion(unidad), forma: 'cuadrado', color: '#ffc278', rot: 'ESTA INSTALACIÓN', colorRot: '#ffc278', tam: 6 }] : []),
    ],
  })
  const barrasUnidad = abast
    ? G.barras(h, {
        dato: 'consumo-unidad',
        series: serie,
        fmt: fmtT,
        filas: plan.filas.map((f) => ({ id: f.id, nom: f.nombre, sub: `${fmtN(f.perfil.hombres)} h · ${fmtN(f.perfil.vehTotal)} veh · ${fmtN(f.km, 1)} km`, txt: fmtT(f.t), partes: serie.map((s) => ({ id: s.id, color: s.color, valor: s.clases.filter((c) => plan.clases.includes(c)).reduce((x, c) => x + (f.req[c]?.t || 0), 0), titulo: `${f.nombre} · ${s.nom}: ${fmtT(s.clases.reduce((x, c) => x + (plan.clases.includes(c) ? f.req[c]?.t || 0 : 0), 0))}/día` })) })),
      })
    : G.barras(h, {
        dato: 'consumo-unidad',
        fmt: (x) => fmtN(x, 1),
        filas: plan.filas.map((f) => ({ id: f.id, nom: f.nombre, sub: `${fmtN(f.perfil.hombres)} h · ${fmtN(f.perfil.vehTotal)} veh · ${fmtN(f.km, 1)} km`, txt: `${fmtN(valorFila(f), 1)}`, partes: [{ id: 'v', color: plan.modo === 'sanidad' ? '#d55181' : plan.modo === 'mant' ? '#9085e9' : '#8a96a8', valor: valorFila(f), titulo: `${f.nombre}: ${fmtN(valorFila(f), 1)} por día` }] })),
      })
  const flota = h(
    R.Fragment,
    null,
    plan.flota.length
      ? G.pictogramas(h, { dato: 'flota', filas: plan.flota.map((x) => ({ id: x.id, nom: x.vehiculos === 1 ? x.nom : x.nomPlural, n: x.vehiculos, color: x.color, icono: x.icono, sub: `${fmtCant(x.cantidad, x.unidad)}/día · cap. ${fmtN(x.cap)} ${x.unidadCap} · ${fmtN(x.viajesDia, 1)} viajes/día · ${fmtN(x.horas, 1)} h-veh.`, disponibles: Number.isFinite(+disp[x.id]) && disp[x.id] !== '' ? +disp[x.id] : null })) })
      : h('div', { className: 'sid-tg-suave' }, 'Esta instalación no mueve carga: no necesita vehículos de distribución.'),
    plan.flota.length > 0 &&
      h(
        'div',
        { className: 'sid-tg-disponibles' },
        h('span', null, '¿Cuántos tenés?'),
        ...plan.flota.map((x) => h('label', { key: x.id }, `${x.corto} `, h('input', { type: 'number', min: 0, value: disp[x.id] ?? '', placeholder: '—', 'aria-label': `${x.nom} disponibles`, onChange: (e) => editarTab({ disponibles: { ...disp, [x.id]: e.target.value === '' ? undefined : Math.max(0, +e.target.value) } }) }))),
      ),
    h('div', { className: 'sid-tg-suave' }, plan.modalidad === 'propia' ? '🔁 Por cuenta propia: estos vehículos son de las UNIDADES apoyadas y vienen a la instalación a buscar.' : plan.modalidad === 'mixto' ? '🔁 Mixta: una parte la retiran las unidades y otra la entrega la instalación.' : '🔁 A domicilio: estos vehículos son de la INSTALACIÓN y van a cada unidad.'),
  )
  const cicloG = G.ciclo(h, { dato: 'ciclo', td: plan.factores.transporte.td, filas: plan.filas.map((f) => ({ id: f.id, nom: `${f.nombre} (${fmtN(f.ciclo.carretera, 0)} km)`, ciclo: f.ciclo })) })
  const municion = t.municion.length && (plan.clases.includes('cl5') || plan.modo === 'general')
    ? G.barras(h, { dato: 'municion', fmt: fmtT, filas: t.municion.map((a) => ({ id: a.id, nom: a.nom, sub: `${fmtN(a.n)} armas × ${fmtN(a.disparos / a.n, 0)} disparos/día`, txt: fmtT(a.kg / 1000), partes: [{ id: a.id, valor: a.kg / 1000, color: '#d95926', titulo: `${a.nom}: ${fmtN(a.disparos)} disparos = ${fmtT(a.kg / 1000)}/día` }] })) })
    : null
  const porUnidadMunicion = municion
    ? G.barras(h, { fmt: fmtT, filas: plan.filas.map((f) => ({ id: f.id, nom: f.nombre, txt: fmtT(f.req.cl5.t), partes: [{ id: 'cl5', color: '#d95926', valor: f.req.cl5.t, titulo: `${f.nombre}: ${fmtT(f.req.cl5.t)} de munición por día` }] })) })
    : null
  const totalClases = SERIES_CLASES.map((s) => ({ id: s.id, nom: s.nom, color: s.color, valor: s.clases.reduce((x, c) => x + (t.porClase[c] || 0), 0) }))
  const sumaTodas = totalClases.reduce((s, x) => s + x.valor, 0)
  const tabla = h(
    'details',
    { className: 'sid-tg-tabla' },
    h('summary', null, '🔢 Ver todos los números en una tabla'),
    h(
      'div',
      { style: { overflowX: 'auto' } },
      h(
        'table',
        null,
        h('thead', null, h('tr', null, ...['Unidad', 'Hombres', 'Vehículos', 'km (carretera)', 'Ciclo (h)', 'Viajes/veh.', ...CLASES.map((c) => c.corto), 'Medio: viajes por entrega'].map((x) => h('th', { key: x }, x)))),
        h(
          'tbody',
          null,
          ...plan.filas.map((f) =>
            h(
              'tr',
              { key: f.id },
              h('td', null, f.nombre),
              h('td', null, fmtN(f.perfil.hombres)),
              h('td', null, fmtN(f.perfil.vehTotal)),
              h('td', null, fmtN(f.ciclo.carretera, 1)),
              h('td', null, fmtN(f.ciclo.horas, 1)),
              h('td', null, String(f.ciclo.viajes)),
              ...CLASES.map((c) => h('td', { key: c.id, className: plan.clases.includes(c.id) ? 'on' : '' }, c.liquido ? fmtL(f.req[c.id].l) : fmtT(f.req[c.id].t))),
              h('td', null, Object.entries(f.porMedio).map(([m, x]) => `${medioDe(m).corto}: ${x.viajesEntrega}`).join(' · ') || '—'),
            ),
          ),
        ),
      ),
    ),
  )
  return h(
    'div',
    { className: 'sid-tg-tablero', 'data-pagina': 'tablero' },
    h(
      'div',
      { className: 'sid-tg-apoya' },
      h('span', { className: 'sid-tg-suave' }, 'APOYA A:'),
      ...plan.filas.map((f) => h('span', { key: f.id, className: 'sid-tg-chip' + (f.perfil.esFT ? ' ft' : ''), title: `${fmtN(f.perfil.hombres)} hombres · ${fmtN(f.perfil.vehTotal)} vehículos` }, f.perfil.esFT ? '🛡️ ' : '', f.nombre)),
      !plan.filas.length && h('span', { className: 'sid-tg-chip mal' }, 'ninguna'),
      h('button', { className: 'sid-tg-link', onClick: () => irA('unidades') }, 'cambiar →'),
      h('span', { className: 'sid-tg-suave', style: { flexBasis: '100%' } }, plan.apoyo.motivo),
    ),
    G.kpis(h, items),
    plan.avisos.length > 0 && h('div', { className: 'sid-tg-alertas' }, ...plan.avisos.map((a, i) => h('div', { key: i }, '⚠ ', a))),
    h(
      'div',
      { className: 'sid-tg-grilla' },
      G.tarjeta(h, { tit: 'Croquis del apoyo', nota: 'Flecha = lo que recibe cada unidad por día (grosor). Roja = no llega en una jornada.', ancho: 1, children: [croquis] }),
      G.tarjeta(h, { tit: abast ? 'Lo que recibe cada unidad por día' : plan.modo === 'sanidad' ? 'Heridos por día de cada unidad (a evacuar)' : plan.modo === 'mant' ? 'Vehículos averiados por día' : 'Bajas por día (reemplazos)', nota: abast ? `Clases que maneja esta instalación, en ${plan.operacion.nom.toLowerCase()}.` : `Tasa de ${plan.operacion.nom.toLowerCase()}: ${plan.modo === 'mant' ? `${plan.factores.operacion[plan.operacion.id].averias} % de los vehículos` : `${plan.factores.operacion[plan.operacion.id].heridos} % de los efectivos`} por día.`, children: [barrasUnidad] }),
      G.tarjeta(h, { tit: 'Flota necesaria', nota: 'Vehículo-horas por día ÷ TD (cada unidad con su propio ciclo).', children: [flota] }),
      G.tarjeta(h, { tit: `Ciclo de un vehículo en la jornada (TD ${plan.factores.transporte.td} h)`, nota: `Carga + ida + descarga + regreso, a ${plan.factores.transporte.v} km/h de noche. Cuántos viajes entran por jornada.`, children: [cicloG] }),
      municion && G.tarjeta(h, { tit: `Munición por día — ${plan.operacion.nom}`, nota: `Disparos por arma × peso, con el multiplicador ×${plan.factores.operacion[plan.operacion.id].cl5} de la operación. ${FUENTE_OPERACION}`, children: [municion, h('div', { key: 'u', className: 'sid-tg-subtit' }, 'Por unidad'), porUnidadMunicion] }),
      sumaTodas > 0 && G.tarjeta(h, { tit: 'Consumo total de las unidades apoyadas', nota: abast && plan.clases.length < CLASES.length ? `Esta instalación mueve ${fmtT(t.t)} de ${fmtT(sumaTodas)} por día (${Math.round((100 * t.t) / sumaTodas)} %).` : 'Todas las clases, por día.', children: [G.dona(h, { dato: 'dona', partes: totalClases, centro: fmtT(sumaTodas), sub: 'por día', fmt: fmtT })] }),
    ),
    tabla,
    h('div', { className: 'sid-tg-fuente' }, AVISO_FACTORES),
  )
}

// ─── 🪖 UNIDADES APOYADAS ────────────────────────────────────────────────────────────
function PaginaUnidades({ R, unidad, unidades, plan, onEditar }) {
  const h = R.createElement
  const todas = unidadesQueReciben(unidades)
  const manual = Array.isArray(unidad.apoyaA)
  const sel = new Set(plan.filas.map((f) => String(f.id)))
  const alternar = (u) => {
    const s = new Set(manual ? unidad.apoyaA.map(String) : [...sel])
    s.has(String(u.id)) ? s.delete(String(u.id)) : s.add(String(u.id))
    onEditar?.(unidad.id, { apoyaA: [...s] })
  }
  return h(
    'div',
    { className: 'sid-tg-unidades', 'data-pagina': 'unidades' },
    h(
      'div',
      { className: 'sid-tg-fila' },
      h('b', null, '¿A quién apoya esta instalación?'),
      h('button', { className: !manual ? 'sid-fi-pri' : '', onClick: () => onEditar?.(unidad.id, { apoyaA: undefined }) }, '🧮 Que lo decida la Mesa'),
      h('button', { className: manual ? 'sid-fi-pri' : '', onClick: () => onEditar?.(unidad.id, { apoyaA: [...sel] }) }, '👤 Elijo yo'),
    ),
    h('div', { className: 'sid-tg-suave' }, manual ? 'Tocá una unidad para sumarla o sacarla.' : plan.apoyo.motivo + ' Tocá una unidad para elegir vos.'),
    h('div', { className: 'sid-tg-chips' }, ...todas.map((u) => h('button', { key: u.id, className: 'sid-tg-chip boton' + (sel.has(String(u.id)) ? ' on' : ''), 'aria-pressed': sel.has(String(u.id)) ? 'true' : 'false', onClick: () => alternar(u) }, sel.has(String(u.id)) ? '✓ ' : '+ ', nombreUnidad(u)))),
    !todas.length && h('div', { className: 'sid-tg-alertas' }, '⚠ No hay fichas de unidades propias en el calco.'),
    h('div', { className: 'sid-tg-subtit' }, 'Datos de cada unidad apoyada — la Mesa los estima por tipo y escalón (y por las piezas de una FT); poné los reales y manda lo tuyo.'),
    ...plan.filas.map((f) => h(DatosUnidad, { key: f.id, R, u: f.u, perfil: f.perfil, onEditar })),
  )
}
function DatosUnidad({ R, u, perfil, onEditar }) {
  const h = R.createElement
  const d = esObj(u.logDatos) ? u.logDatos : VACIO
  const [v, setV, ya] = useDiferido(R, d, (x) => onEditar?.(u.id, { logDatos: x }), 500)
  const num = (ruta, valor) => {
    const [a, b] = ruta.split('.')
    setV((o) => {
      const n = JSON.parse(JSON.stringify(o || {}))
      if (b) {
        n[a] = esObj(n[a]) ? n[a] : {}
        if (valor === '') delete n[a][b]
        else n[a][b] = Math.max(0, +valor)
      } else if (valor === '') delete n[a]
      else n[a] = Math.max(0, +valor)
      return n
    })
  }
  const est = perfil.estimacion
  const comp = perfil.composicion
  const campo = (ruta, ph) => {
    const [a, b] = ruta.split('.')
    const val = b ? v[a]?.[b] : v[a]
    return h('input', { type: 'number', min: 0, value: val ?? '', placeholder: String(ph), 'aria-label': ruta, onChange: (e) => num(ruta, e.target.value) })
  }
  const vehUsa = VEHICULOS.filter((x) => perfil.veh[x.id] || v.veh?.[x.id] != null)
  const vehNo = VEHICULOS.filter((x) => !vehUsa.includes(x))
  const armUsa = ARMAS.filter((x) => perfil.armas[x.id] || v.armas?.[x.id] != null)
  const armNo = ARMAS.filter((x) => !armUsa.includes(x))
  return h(
    'div',
    { className: 'sid-tg-unidad', 'data-unidad': u.id },
    h('div', { className: 'sid-tg-fila' }, h('b', null, perfil.esFT ? '🛡️ ' : '', nombreUnidad(u)), h('span', { className: perfil.estimado ? 'sid-tg-etq alerta' : 'sid-tg-etq bien' }, perfil.estimado ? '⚠ estimado por la Mesa' : '✓ datos del oficial'), !perfil.estimado && h('button', { className: 'sid-tg-link', onClick: () => { ya(); onEditar?.(u.id, { logDatos: undefined }); setV({}) } }, '↺ volver a la estimación')),
    h('div', { className: 'sid-tg-comp', title: 'Composición' }, ...comp.map((c, i) => h('span', { key: i, style: { flex: c.n, background: TIPOS_FT[c.tipo] || '#8a96a8' }, title: `${c.n} × ${c.nom} (${c.escalon})` }, `${c.n > 1 ? `${c.n}× ` : ''}${c.nom.split(' ')[0]} · ${c.escalon}`))),
    h(
      'div',
      { className: 'sid-tg-nums' },
      h('label', null, '👥 Efectivos', campo('hombres', est.hombres)),
      ...vehUsa.map((x) => h('label', { key: x.id }, `🚙 ${x.nom}`, campo(`veh.${x.id}`, perfil.veh[x.id] || 0))),
      ...armUsa.map((x) => h('label', { key: x.id }, `💥 ${x.nom}`, campo(`armas.${x.id}`, perfil.armas[x.id] || 0))),
    ),
    (vehNo.length > 0 || armNo.length > 0) &&
      h('details', null, h('summary', null, `+ Otros vehículos y armas (${vehNo.length + armNo.length})`), h('div', { className: 'sid-tg-nums' }, ...vehNo.map((x) => h('label', { key: x.id }, `🚙 ${x.nom}`, campo(`veh.${x.id}`, 0))), ...armNo.map((x) => h('label', { key: x.id }, `💥 ${x.nom}`, campo(`armas.${x.id}`, 0))))),
  )
}

// ─── ⚙ FACTORES ──────────────────────────────────────────────────────────────────────
function PaginaFactores({ R, plan, planLog, editarPlanLog }) {
  const h = R.createElement
  const over = esObj(planLog.factores) ? planLog.factores : VACIO
  const [v, setV] = useDiferido(R, over, (x) => editarPlanLog({ factores: x }), 500)
  const op = plan.operacion.id
  const multi = ['cl1', 'agua', 'cl2', 'cl3', 'cl4', 'cl5', 'cl8', 'cl9', 'heridos', 'averias']
  const nomMulti = { heridos: 'Heridos (% efectivos/día)', averias: 'Averías (% vehículos/día)' }
  const celda = (ruta, unidad) =>
    h('input', { type: 'number', step: 'any', min: 0, value: leerRuta(v, ruta) ?? '', placeholder: String(leerRuta(FACTORES_DEFECTO, ruta)), className: rutaCambiada(v, ruta) ? 'cambiado' : '', 'aria-label': ruta, onChange: (e) => setV((o) => fijarRuta(o, ruta, e.target.value)) })
  return h(
    'div',
    { className: 'sid-tg-factores', 'data-pagina': 'factores' },
    h('div', { className: 'sid-tg-alertas' }, '⚠ ', AVISO_FACTORES),
    h('div', { className: 'sid-tg-fila' }, h('span', { className: 'sid-tg-suave' }, 'Casilla vacía = valor de referencia (en gris). En ámbar = lo cambiaste vos. Vale para TODAS las instalaciones del ejercicio.'), h('button', { onClick: () => setV({}) }, '↺ Todo a los de referencia')),
    h('div', { className: 'sid-tg-subtit' }, `Multiplicadores de la operación: ${plan.operacion.nom} (1 = consumo normal)`),
    h('div', { className: 'sid-tg-nums' }, ...multi.map((k) => h('label', { key: k }, nomMulti[k] || claseDe(k)?.nom || k, celda(`operacion.${op}.${k}`)))),
    h('div', { className: 'sid-tg-fuente' }, FUENTE_OPERACION),
    ...FILAS_FACTORES.map((g) => h(R.Fragment, { key: g.grupo }, h('div', { className: 'sid-tg-subtit' }, g.grupo), h('div', { className: 'sid-tg-nums' }, ...g.filas.map((f) => h('label', { key: f.ruta }, `${f.nom}${f.unidad ? ` (${f.unidad})` : ''}`, celda(f.ruta)))))),
  )
}

// ─── 🤖 IA ───────────────────────────────────────────────────────────────────────────
function PaginaIA({ R, unidad, plan, tab, editarTab, editarPlanLog, planLog, setAviso }) {
  const h = R.createElement
  const [ideas, setIdeas, ya] = useDiferido(R, tab.ideas || '', (x) => editarTab({ ideas: x }))
  const [entrada, setEntrada] = R.useState(tab.entradaIA || '')
  const [prompt, setPrompt] = R.useState('')
  const [error, setError] = R.useState('')
  const pedir = Array.isArray(tab.pedir) ? tab.pedir : PEDIDOS_DEFECTO
  const formato = tab.formato === 'texto' ? 'texto' : 'json'
  const r = tab.resultadoIA
  const fd = esObj(unidad.fichaDocumental) ? unidad.fichaDocumental : {}
  const generar = () => {
    ya()
    const p = generarPromptG4(plan, { ideas, pedir, fragmentos: fd.fragmentos, observaciones: fd.observaciones, encabezado: encabezadoIA() })
    setPrompt(p)
    return p
  }
  const copiar = async () => {
    const p = prompt || generar()
    try {
      await navigator.clipboard.writeText(p)
      setAviso('📋 Pedido copiado: pegalo en la IA que uses y traé la respuesta.')
    } catch {
      setAviso('No se pudo copiar solo: seleccioná el texto del pedido y copialo.')
    }
  }
  const proyectar = () => {
    try {
      const res = leerRespuestaG4(entrada, unidad.id, formato)
      editarTab({ entradaIA: entrada, resultadoIA: res, revisadoEn: null, importadoEn: new Date().toISOString() })
      setError('')
      setAviso('🤖 Respuesta proyectada en el tablero: revisala con las fuentes.')
    } catch (e) {
      setError(e.message)
    }
  }
  const aplicar = () => {
    const a = r?.ajustes || {}
    const patch = {}
    if (a.frecuenciaH) patch.frecuenciaH = a.frecuenciaH
    if (a.modalidad) patch.modalidad = a.modalidad
    if (Object.keys(patch).length) editarTab({ ...patch, ajustesIA: new Date().toISOString() })
    if (a.factores) {
      let over = esObj(planLog.factores) ? planLog.factores : {}
      for (const [ruta, val] of Object.entries(a.factores)) over = fijarRuta(over, ruta, val)
      editarPlanLog({ factores: over })
    }
    setAviso('🤖 Ajustes de la IA aplicados (frecuencia, modalidad y factores). Revisá el tablero.')
  }
  const lista = (tit, xs, cls = '') => (xs?.length ? h('div', { className: 'sid-tg-ia-bloque ' + cls }, h('div', { className: 'sid-tg-subtit' }, tit), h('ul', null, ...xs.map((x, i) => h('li', { key: i }, x)))) : null)
  const maxNivel = Math.max(1, ...Object.values(r?.niveles || {}))
  return h(
    'div',
    { className: 'sid-tg-ia', 'data-pagina': 'ia' },
    h(
      'div',
      { className: 'sid-tg-ia-col' },
      h('div', { className: 'sid-tg-suave' }, 'La Mesa arma el pedido con TODO lo que calculó (unidades, efectivos, vehículos, consumos, munición, viajes, flota, factores y la doctrina de la operación) más TUS IDEAS. Lo copiás, lo pegás en la IA que uses y traés la respuesta. La Mesa no consulta ninguna IA sola.'),
      h('label', { className: 'sid-fi-campo' }, '💡 TUS IDEAS PARA ESTA INSTALACIÓN', h('textarea', { rows: 4, value: ideas, placeholder: 'Ej.: «La FT TORREZ es el esfuerzo principal: prioridad 1 en Cl V. Quiero entregar a domicilio de noche cada 12 h. Tengo sólo 6 camiones.»', onChange: (e) => setIdeas(e.target.value) })),
      h('div', { className: 'sid-tg-subtit' }, 'Qué le pedís'),
      h('div', { className: 'sid-tg-chips' }, ...PEDIDOS.map((p) => h('button', { key: p.id, className: 'sid-tg-chip boton' + (pedir.includes(p.id) ? ' on' : ''), 'aria-pressed': pedir.includes(p.id) ? 'true' : 'false', title: p.txt, onClick: () => editarTab({ pedir: pedir.includes(p.id) ? pedir.filter((x) => x !== p.id) : [...pedir, p.id] }) }, p.nom))),
      h('div', { className: 'sid-fi-acciones' }, h('button', { className: 'sid-fi-pri', onClick: () => { generar(); setAviso('Pedido armado: copialo.') } }, '⚙ GENERAR PEDIDO'), h('button', { className: 'sid-fi-pri', onClick: copiar }, '📋 COPIAR PEDIDO')),
      prompt && h('textarea', { rows: 6, readOnly: true, value: prompt, 'aria-label': 'Pedido a la IA' }),
      h('label', { className: 'sid-fi-campo' }, 'FORMATO DE LA RESPUESTA', h('select', { value: formato, onChange: (e) => editarTab({ formato: e.target.value }) }, h('option', { value: 'json' }, 'JSON del pedido (se proyecta en gráficos)'), h('option', { value: 'texto' }, 'Texto libre'))),
      h('label', { className: 'sid-fi-campo' }, 'PEGAR LA RESPUESTA DE LA IA', h('textarea', { rows: 5, value: entrada, placeholder: 'Pegá acá la respuesta completa.', onChange: (e) => setEntrada(e.target.value) })),
      h('button', { className: 'sid-fi-pri', onClick: proyectar }, '📊 PROYECTAR LA RESPUESTA'),
      error && h('p', { role: 'alert', className: 'sid-fi-error' }, error),
    ),
    h(
      'div',
      { className: 'sid-tg-ia-col sid-tg-ia-res', 'data-ia': r ? 'con-respuesta' : 'vacia' },
      !r
        ? h('div', { className: 'sid-fi-vacio' }, 'Acá aparece la respuesta de la IA: resumen, verificación del cálculo, prioridades (en barras), niveles de abastecimiento (en barras), recomendaciones, riesgos y los ajustes que se pueden aplicar con un botón.')
        : h(
            R.Fragment,
            null,
            h('p', { className: tab.revisadoEn ? 'sid-fi-revisado' : 'sid-fi-pendiente' }, tab.revisadoEn ? '✓ REVISADO POR EL OFICIAL' : '🤖 CONTENIDO DE IA · PENDIENTE DE REVISIÓN'),
            r.textoLibre ? h('div', { className: 'sid-fi-texto' }, r.textoLibre) : null,
            r.resumen ? h('div', { className: 'sid-tg-ia-resumen' }, r.resumen) : null,
            r.prioridades?.length
              ? G.tarjeta(h, { tit: 'Prioridad de apoyo', children: [G.barras(h, { fmt: (x) => x, filas: r.prioridades.map((p, i) => ({ id: String(i), nom: `${p.prioridad}° ${p.unidad}`, sub: p.motivo, txt: `${p.prioridad}°`, partes: [{ id: 'p', valor: r.prioridades.length - i, color: '#c98500', titulo: p.motivo }] })) })] })
              : null,
            Object.keys(r.niveles || {}).length
              ? G.tarjeta(h, { tit: 'Niveles de abastecimiento (días)', children: [G.barras(h, { fmt: (x) => `${x} d`, max: maxNivel, filas: ['NO', 'NS', 'NMA'].filter((k) => k in r.niveles).map((k) => ({ id: k, nom: { NO: 'Nivel operativo (NO)', NS: 'Nivel de seguridad (NS)', NMA: 'Nivel máximo (NMA)' }[k], txt: `${r.niveles[k]} días`, partes: [{ id: k, valor: r.niveles[k], color: '#3987e5' }] })) })] })
              : null,
            lista('🧮 Verificación del cálculo', r.verificacion),
            lista('✅ Recomendaciones', r.recomendaciones),
            lista('🛡️ Riesgos', r.riesgos, 'riesgo'),
            lista('❓ Preguntas', r.preguntas),
            r.ajustes && Object.keys(r.ajustes).length
              ? h(
                  'div',
                  { className: 'sid-tg-ia-bloque ajustes' },
                  h('div', { className: 'sid-tg-subtit' }, '🔧 Ajustes que propone'),
                  h('ul', null, r.ajustes.frecuenciaH ? h('li', null, `Entrega ${fmtFrec(r.ajustes.frecuenciaH)}`) : null, r.ajustes.modalidad ? h('li', null, `Distribución ${MODALIDADES.find((m) => m.id === r.ajustes.modalidad)?.nom}`) : null, ...Object.entries(r.ajustes.factores || {}).map(([k, val]) => h('li', { key: k }, `${k}: ${leerRuta(plan.factores, k)} → ${val}`))),
                  h('button', { className: 'sid-fi-pri', onClick: aplicar }, '✓ Aplicar los ajustes al tablero'),
                )
              : null,
            h('div', { className: 'sid-fi-acciones' }, h('button', { onClick: () => editarTab({ revisadoEn: tab.revisadoEn ? null : new Date().toISOString() }) }, tab.revisadoEn ? 'VOLVER A PENDIENTE' : '✓ MARCAR COMO REVISADO'), h('button', { onClick: () => editarTab({ resultadoIA: null, entradaIA: '' }) }, '🗑 Quitar la respuesta')),
          ),
    ),
  )
}

// ─── 📚 DOCUMENTOS (lo de la ficha documental de antes) ─────────────────────────────
function PaginaDocumentos({ R, unidad, documentos, onEditar, onAgregarDocumentos }) {
  const h = R.createElement
  const fd = esObj(unidad.fichaDocumental) ? unidad.fichaDocumental : VACIO
  const [v, setV] = useDiferido(R, fd, (x) => onEditar?.(unidad.id, { fichaDocumental: x }))
  const [doc, setDoc] = R.useState('')
  const [ocupado, setOcupado] = R.useState(false)
  const [msg, setMsg] = R.useState('')
  const documento = documentos[Number(doc)]
  const agregar = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setOcupado(true)
    try {
      await onAgregarDocumentos?.(files)
      setMsg('Documento añadido al ejercicio. Elegilo abajo para ver el texto.')
    } catch (er) {
      setMsg('No se pudo leer el documento: ' + er.message)
    } finally {
      setOcupado(false)
    }
  }
  const viejo = fd.resultadoIA
  return h(
    'div',
    { className: 'sid-tg-docs', 'data-pagina': 'documentos' },
    h('div', { className: 'sid-tg-suave' }, 'Los fragmentos y las observaciones van al pedido de la IA (pestaña 🤖) para que cite documento y página.'),
    h('label', { className: 'sid-fi-campo' }, ocupado ? 'LEYENDO DOCUMENTO…' : 'ADJUNTAR DOCUMENTO AL EJERCICIO', h('input', { type: 'file', multiple: true, accept: '.pdf,.docx,.txt,.md', disabled: ocupado, onChange: agregar })),
    h('label', { className: 'sid-fi-campo' }, 'CONSULTAR TEXTO EXTRAÍDO', h('select', { value: doc, onChange: (e) => setDoc(e.target.value) }, h('option', { value: '' }, 'Elegí un documento'), ...documentos.map((d, i) => h('option', { key: i, value: String(i) }, d.nombre || 'Documento')))),
    doc !== '' && h('textarea', { readOnly: true, rows: 5, 'aria-label': 'Texto extraído del documento', value: documento?.texto || documento?.aviso || 'Sin texto extraíble.' }),
    h('label', { className: 'sid-fi-campo' }, 'FRAGMENTOS SELECCIONADOS Y REFERENCIAS', h('textarea', { rows: 4, value: v.fragmentos || '', placeholder: 'Documento, página o apartado y fragmento.', onChange: (e) => setV({ ...v, fragmentos: e.target.value }) })),
    h('label', { className: 'sid-fi-campo' }, 'OBSERVACIONES DEL OFICIAL', h('textarea', { rows: 3, value: v.observaciones || '', placeholder: 'Tus observaciones sobre esta instalación.', onChange: (e) => setV({ ...v, observaciones: e.target.value }) })),
    msg && h('p', { className: 'sid-fi-suave', role: 'status' }, msg),
    viejo && h('details', null, h('summary', null, 'RESPUESTA DOCUMENTAL ANTERIOR (ficha de texto)'), h('div', { className: 'sid-fi-texto' }, viejo.textoLibre || [viejo.resumen, ...(viejo.funciones || []), ...(viejo.servicios || [])].filter(Boolean).join('\n'))),
  )
}

export { textoPlan, resumenCorto, MEDIOS, ESCALONES }
