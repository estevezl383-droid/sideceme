// 💡 El panel «La Mesa propone 2 CAP para este ejercicio», arriba de la F3·P6 (y de la F3·P4) en el Tablero del
// G-3, y los botones «CAP 1 / CAP 2» del 🎬 C.A. por fases. La lógica está en proponer.mjs; acá sólo se dibuja.
// JavaScript sin compilar: React llega por configurarCAP() (lo llama el compilado antes del primer render).
import { proponer, capsDe, fasesPorCAP, llevarAHoja, FORMAS, armarCAP } from './proponer.mjs?v=ruta20261111'
import { pedido, HOJAS_POR_CAP, pasosCAP, existeCAP, cerradoCAP } from './proponer.mjs?v=ruta20261111'
// Lo nuevo del 12-11-2026 (fugaDelCAP, filasComandos) por el espacio de nombres: si el navegador todavía tiene el
// proponer.mjs de antes (misma dirección), falta la función y nada más —una importación con nombre rompería todo—.
import * as PP from './proponer.mjs?v=ruta20261111'
import { planFuegosCAP } from './fuegos-cap.mjs?v=ruta20261111'
// Con versión: lo nuevo (la lectura tolerante del JSON, las posiciones por fase, las tareas con su unidad) tiene que
// llegar aunque el navegador tenga guardados los archivos de antes.
import { pedidoCarta, leerRespuesta } from './carta-ia.mjs?v=iti20261025'
import { textoDeLaCarta, hojaConCarta, bloqueCartaIA, nomenclatorDe } from './texto-carta.mjs'
import { posicionesCAP, movibles } from './posiciones.mjs?v=iti20261025'
import { tareasPorFase } from './tareas-fase.mjs?v=iti20261025'
import { COLOR_CAP, COLOR_CAP_CLARO, NOMBRE_COLOR } from './itinerario.mjs?v=iti20261025'
import { datosPuente } from '../../concepto-operacion/v1/carta.js'

let R = {}
export function configurarCAP(v) {
  R = { ...R, ...(v || {}) }
}
function h(tipo, props, ...hijos) {
  const { key, ...p } = props || {}
  const hs = hijos.flat().filter((x) => x !== null && x !== undefined && x !== false && x !== '')
  if (!hs.length) return R.jsx(tipo, p, key)
  if (hs.length === 1) return R.jsx(tipo, { ...p, children: hs[0] }, key)
  return R.jsxs(tipo, { ...p, children: hs }, key)
}

const AZUL = '#5aa9ff'
const E = {
  raiz: { background: 'rgba(90,169,255,0.07)', border: '1px solid rgba(90,169,255,0.4)', borderRadius: 8, padding: '8px 10px', margin: '6px 0', color: '#e6eef6', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 7 },
  cab: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: AZUL, font: '800 13px Arial', cursor: 'pointer', padding: 0, textAlign: 'left' },
  sub: { fontSize: 11, color: '#b9c9da', lineHeight: 1.4 },
  aviso: { fontSize: 11.5, color: '#ffd479', background: '#3a2f12', borderRadius: 6, padding: '6px 8px', lineHeight: 1.4 },
  fila: { display: 'flex', gap: 6 },
  cap: (on) => ({ flex: 1, padding: '7px 8px', borderRadius: 7, cursor: on ? 'default' : 'pointer', border: `1.5px solid ${on ? AZUL : 'rgba(255,255,255,0.18)'}`, background: on ? 'rgba(90,169,255,0.22)' : 'rgba(255,255,255,0.03)', color: on ? '#fff' : '#b9c9da', font: '700 12px Arial', textAlign: 'left' }),
  tarjeta: (on) => ({ border: `1px solid ${on ? AZUL : 'rgba(255,255,255,0.14)'}`, borderRadius: 7, padding: '7px 9px', background: 'rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 4 }),
  tit: { font: '800 12.5px Arial', color: '#fff' },
  sel: { background: '#0f1b26', color: '#e6eef6', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 5, padding: '3px 5px', fontSize: 11.5 },
  rol: { fontSize: 11.5, lineHeight: 1.4, color: '#dbe6f1' },
  dist: { fontSize: 11.5, lineHeight: 1.4, color: '#9fe0ff' },
  fases: { fontSize: 11, color: '#b9c9da', lineHeight: 1.4 },
  btn: { background: 'rgba(90,169,255,0.18)', color: '#dff0ff', border: '1px solid rgba(90,169,255,0.55)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontSize: 12, textAlign: 'left' },
  ok: { fontSize: 11.5, color: '#7dffb0', lineHeight: 1.4 },
  pie: { fontSize: 11, color: '#c69cff', lineHeight: 1.4 },
}

// El nomenclátor de la carta (el mismo que usa la F3·P4: poblaciones y terreno de los calcos generados).
function lugaresDeLaCarta() {
  try {
    return datosPuente().lugares?.() || []
  } catch {
    return []
  }
}

// Los catálogos de la Mesa: tareas tácticas y obstáculos (configurarCAP) y los del plan de fuegos (window.MesaFuegos).
function catalogos() {
  const F = (typeof window !== 'undefined' && window.MesaFuegos && window.MesaFuegos.modelo) || {}
  return { tareas: R.tareas || [], obstaculos: R.obstaculos || {}, tiposFuego: F.TIPOS_FUEGO || [], efectos: F.EFECTOS || [] }
}
// ➜ El botón que prende o apaga las flechas del itinerario (itinerario.mjs, por window.SIDItinerario: si el navegador
// tiene guardado un itinerario.mjs de antes, el botón no aparece). El texto lo cambia itinerario.mjs en todos los
// botones a la vez (el del panel y el del 🎬 C.A. por fases).
function botonFlechas(extra) {
  const I = typeof window !== 'undefined' && window.SIDItinerario
  if (!I || typeof I.alternar !== 'function') return null
  const v = I.visibles()
  return h('button', {
    'data-iti-flechas': '1',
    'aria-pressed': String(v),
    title: 'Prender o apagar, en la carta (y en el 🏙️ Google 3D), las flechas con el recorrido de cada unidad de una fase a la otra',
    style: { ...E.btn, padding: '4px 8px', fontSize: 11.5, fontWeight: 700, ...(extra || {}) },
    onClick: () => I.alternar(),
  }, I.texto(v))
}

const planDeLaCarta = () => {
  try {
    return datosPuente().plan || null
  } catch {
    return null
  }
}
// Cómo se escribe la F3·P6 desde la carta (para la acción «texto» de la Mesa).
function escritor(ctx) {
  const nomenclator = nomenclatorDe({ ...ctx, lugares: lugaresDeLaCarta() })
  return { campos: (fases) => textoDeLaCarta(fases, { nomenclator, catalogos: catalogos() }).campos, conBloques: (v, c) => hojaConCarta(v, c).valor }
}
// El nomenclátor y los catálogos de la carta para los documentos que describen el CAP aprobado (las Órdenes
// Preparatorias, orden-preparatoria/v1/prep.mjs): los mismos con los que se escribe la F3·P6.
export function cartaParaDocumentos(ctx = {}) {
  try {
    return { nomenclator: nomenclatorDe({ ...ctx, lugares: lugaresDeLaCarta() }), catalogos: catalogos() }
  } catch {
    return { nomenclator: [], catalogos: catalogos() }
  }
}
// El pedido de la IA de la F3·P4 y la F3·P6 (lo usa el compilado): la propuesta de los dos CAP (proponer.mjs) y lo que
// ya está en la carta del CAP activo, antes de «# CÓMO CONTESTAR».
export function pedidoCAP(r, hoja, ctx = {}) {
  if (r && typeof r.then === 'function') return r.then((x) => pedidoCAP(x, hoja, ctx))
  const p = pedido(r, hoja, ctx)
  try {
    if (!HOJAS_POR_CAP.includes(hoja?.id) || !p?.ok || typeof p.prompt !== 'string') return p
    const fases = ctx.fasesCOA?.propio || []
    if (!fases.length) return p
    const b = bloqueCartaIA(fases, { nomenclator: nomenclatorDe({ ...ctx, lugares: lugaresDeLaCarta() }), catalogos: catalogos() }, capsDe(ctx.g3).activo)
    if (!b) return p
    const marca = '\n\n---\n\n# CÓMO CONTESTAR'
    const i = p.prompt.lastIndexOf(marca)
    return { ...p, prompt: i >= 0 ? `${p.prompt.slice(0, i)}\n\n---\n\n${b}${p.prompt.slice(i)}` : `${p.prompt}\n\n---\n\n${b}` }
  } catch {
    return p
  }
}

// 🎬 Lo que necesita la Mesa para armar las fases de un CAP: cada unidad en su lugar en cada fase (posiciones.mjs) y
// cada tarea táctica con su unidad (tareas-fase.mjs).
function armadoDe(c, P, ctx, formas, extra = {}) {
  return {
    cap: c,
    formas,
    posiciones: (us, ops, x) => posicionesCAP(c, { unidades: us, ops, marcas: ctx.g3?.conceptoCarta?.marcas || [], A: P.A, previas: x?.previas }),
    conTareas: (fs) => tareasPorFase(fs, { n: c.n }),
    ...extra,
  }
}
// ¿Se puede pasar al CAP n? Uno que todavía no existe sólo aparece cuando el activo está terminado (11-11-2026).
function puedeIr(g3, n) {
  const C = capsDe(g3)
  if (n === C.activo || existeCAP(g3, n)) return { ok: true, nuevo: false }
  if (cerradoCAP(g3, C.activo)) return { ok: true, nuevo: true }
  return { ok: false, msg: `🔒 El CAP ${n} se arma DESPUÉS de terminar el CAP ${C.activo}: completá sus pasos (F3·P3 → F3·P6, fuegos, barrera y fases) y tocá «✓ Terminar el CAP ${C.activo}». Ahí aparece «➕ Generar el CAP ${n}», que empieza de nuevo desde la F3·P3.` }
}

// Los CAP cuyas fases están todas iguales y el oficial dijo que NO las armemos al tocar una (no se pregunta otra vez).
const noArmar = new Set()
// Los CAP cuya F3·P5 ya se armó sola en esta visita (12-11-2026).
const autoP5 = new Set()

// props: { hoja, valor, ctx: { unidades, ops, cmoc, ordenSup, unidad, fasesCOA, g3 }, onAccion(que, datos), onLlevar(valor),
//          onExpediente() → { md } }
export default function PanelCAP({ hoja, valor, ctx = {}, onAccion, onLlevar, onExpediente }) {
  const [abierto, setAbierto] = R.useState(hoja?.id === 'coa')
  const [msg, setMsg] = R.useState('')
  const C = capsDe(ctx.g3)
  // 🎖️ El CAP que decidió el Comandante en la F4·P6-7 (evento-critico/v1/decision.mjs), 08-11-2026.
  const decidido = [1, 2].includes(Number(ctx.g3?._caps?.decision?.cap)) ? Number(ctx.g3._caps.decision.cap) : null
  let P = null
  try {
    P = proponer(ctx, C.formas)
  } catch {
    return null
  }
  const nf = fasesPorCAP(ctx.g3, ctx.fasesCOA)
  const activo = P.caps.find((c) => c.n === C.activo) || P.caps[0]
  const A = P.A
  const formas = { 1: P.caps[0].forma, 2: P.caps[1].forma }

  const irA = (n) => {
    if (n === C.activo) return
    const v = puedeIr(ctx.g3, n)
    if (!v.ok) return setMsg(v.msg)
    setMsg('')
    onAccion?.(v.nuevo ? 'nuevo' : 'cambiar', { n, formas })
  }
  const botonCAP = (c) =>
    h('button', { key: c.n, style: { ...E.cap(c.n === C.activo), ...(puedeIr(ctx.g3, c.n).ok ? {} : { opacity: 0.55 }) }, 'data-cap': c.n, onClick: () => irA(c.n) },
      `${c.n === C.activo ? '● ' : ''}CAP ${c.n} · ${c.nomForma}${c.n === decidido ? ' 🎖️' : ''}`,
      h('div', { style: { fontWeight: 400, fontSize: 10.5, marginTop: 2 } }, `${nf[c.n] || 0} fase(s) 🔵${c.n === decidido ? ' · 🎖️ decidido por el Comandante' : c.n === C.activo ? (cerradoCAP(ctx.g3, c.n) ? ' · ✓ terminado' : ' · el que estás trabajando') : existeCAP(ctx.g3, c.n) ? ' · guardado' : puedeIr(ctx.g3, c.n).ok ? ' · ➕ generarlo' : ' · 🔒 después del otro'}`))

  // Las fases de cada CAP que ya están en la carta: las del activo (fasesCOA.propio) y las del guardado.
  const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  const corto = (t) => {
    const x = String(t).trim()
    return x.length <= 28 ? x : `${x.slice(0, 28).replace(/\s+\S*$/, '')}…`
  }
  const fasesDe = (n) => (n === C.activo ? ctx.fasesCOA?.propio : C.guardados[n]?.fases) || []
  const enVista = (n, i) => n === C.activo && ctx.faseActiva?.bando === 'propio' && ctx.faseActiva?.idx === i
  // ¿Hay fichas propias que no se mueven en ninguna fase? (las fases que se armaron antes: copiando el dispositivo, o
  // moviendo sólo las unidades del CAP y no las agrupaciones OD, OC…). Devuelve sus nombres; todas → 'todas'.
  const quietas = (fs) => {
    if (fs.length < 2) return null
    const en = fs.map((f) => new Map(movibles(f?.unidades || [], A).map((u) => [u.id, u])))
    const ids = [...en[0].keys()].filter((id) => en.every((m) => m.has(id)))
    const lugar = (u) => `${(+u.lng).toFixed(4)},${(+u.lat).toFixed(4)}`
    const fijas = ids.filter((id) => en.every((m) => lugar(m.get(id)) === lugar(en[0].get(id))))
    if (!fijas.length) return null
    return fijas.length === ids.length ? 'todas' : fijas.map((id) => en[0].get(id).designacion || id)
  }
  // 🎬 Armar las fases de un CAP: cada unidad en su lugar en cada fase (posiciones.mjs) y cada tarea táctica con su
  // unidad (tareas-fase.mjs). El del CAP guardado lo arma ahí mismo y pasa a él (proponer.mjs, armarGuardado).
  const armado = (c, extra = {}) => armadoDe(c, P, ctx, formas, extra)
  const botonesFase = (c) => {
    const fs = fasesDe(c.n)
    if (!fs.length) return h('div', { style: E.fases }, `🎬 Todavía sin fases en la carta: tocá «🎬 Armar las fases» ${c.n === C.activo ? '(abajo)' : 'de este CAP (abajo)'} o pedíselas a la IA.`)
    const q = quietas(fs)
    const deNuevo = c.n === C.activo ? 'Tocá «🎬 Armar las fases» de nuevo' : `Tocá «🎬 Armar las fases de este CAP» (acá abajo)`
    // Si todas las fases tienen las fichas en el mismo lugar, tocar una no cambia nada: la Mesa ofrece armarlas ya.
    const tocar = (i) => {
      setMsg('')
      if (q === 'todas' && !noArmar.has(c.n)) {
        const si = typeof window === 'undefined' || window.confirm(`Las ${fs.length} fases del CAP ${c.n} tienen TODAS las fichas en el MISMO lugar (se armaron copiando el dispositivo): por eso de una fase a otra no cambia nada.\n\n¿Las armo ahora? La Mesa ubica cada unidad en cada fase (${c.nomForma}): FASE I juntas con el CE, FASE II a sus trabajos, FASE III en su puesto con su tarea táctica… y marca el itinerario con flechas.\n\n(Cancelar: la muestra como está.)`)
        // (si no se pudo armar —el candado del ejercicio—, igual se muestra la fase)
        if (si && onAccion?.('fases', armado(c, { ver: i, sinPreguntar: true }))) return
        if (!si) noArmar.add(c.n)
      }
      onAccion?.('fase', { n: c.n, idx: i, formas })
    }
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
      q && h('div', { style: E.aviso, 'data-quietas': c.n }, q === 'todas'
        ? `⚠️ En las ${fs.length} fases del CAP ${c.n} las fichas están en el MISMO lugar (se armaron copiando el dispositivo). ${deNuevo}: ahora la Mesa ubica cada unidad en cada fase (o movelas a mano fase por fase).`
        : `⚠️ En las ${fs.length} fases del CAP ${c.n} no se mueven: ${q.slice(0, 8).join(', ')}${q.length > 8 ? '…' : ''}. ${deNuevo}: ahora se mueven TODAS las fichas (FASE I juntas con el CE, FASE II a sus trabajos de barreras, FASE III a su puesto…).`),
      h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 4 }, 'data-fases-cap': c.n },
      fs.map((f, i) =>
        h('button', {
          key: i,
          'data-fase': i + 1,
          title: `${f.nombre || `Fase ${i + 1}`}${f.origen ? ` · ${f.origen}` : ''} — tocala y la carta muestra dónde está cada ficha`,
          style: { ...E.btn, padding: '4px 8px', fontSize: 11.5, fontWeight: 700, background: enVista(c.n, i) ? AZUL : 'rgba(90,169,255,0.12)', color: enVista(c.n, i) ? '#fff' : '#dff0ff' },
          onClick: () => tocar(i),
        }, `FASE ${ROM[i] || i + 1}${f.nombre ? ` · ${corto(f.nombre)}` : ''}`))))
  }
  // El CAP guardado se arma desde su tarjeta (sin pasar antes a él): «el CAP 2 no está funcionando nada».
  const botonArmarGuardado = (c) =>
    c.n !== C.activo &&
    existeCAP(ctx.g3, c.n) &&
    h('button', { style: { ...E.btn, borderColor: COLOR_CAP[c.n] || AZUL }, 'data-armar-cap': c.n, onClick: () => (setMsg(''), onAccion?.('fases', armado(c))) },
      `🎬 Armar las ${c.fases.length} fases 🔵 de este CAP (CAP ${c.n}) y verlas en la carta`)

  const tarjeta = (c) =>
    h('div', { key: c.n, style: E.tarjeta(c.n === C.activo), 'data-tarjeta-cap': c.n },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' } },
        h('span', { style: E.tit }, `CAP ${c.n}`),
        h('select', { style: E.sel, value: c.forma, 'data-forma-cap': c.n, onChange: (e) => onAccion?.('forma', { n: c.n, forma: e.target.value }) },
          FORMAS[P.tipo].map((f) => h('option', { key: f.id, value: f.id }, f.larga)))),
      c.roles.map((r, i) => h('div', { key: i, style: E.rol }, h('b', null, `${r.principal ? '★ ' : ''}${r.rol}: `), `${r.unidades.map((u) => u.nom).join(', ')} — ${r.tarea}.`)),
      h('div', { style: E.dist }, `🗺️ En la carta: ${c.distingue}.`),
      h('div', { style: E.fases }, `🎬 ${c.fases.map((f, i) => `${i + 1}. ${f.nombre} (${f.cuando})`).join(' · ')}`),
      h('div', { style: { ...E.fases, color: COLOR_CAP_CLARO[c.n] || E.fases.color }, 'data-itinerario-cap': c.n }, `➜ En las fases, el itinerario de cada unidad va marcado con flechas ${NOMBRE_COLOR[c.n] || ''}: llena la de la fase a la vista, punteadas las de las anteriores, una punta donde está cada unidad y el número de la fase por donde pasó.`),
      c.n === C.activo && botonFlechas({ alignSelf: 'flex-start', borderColor: COLOR_CAP[c.n] || AZUL }),
      botonesFase(c),
      botonArmarGuardado(c))

  const llevar = () => {
    const r = llevarAHoja(valor, activo)
    if (!r.n) return setMsg('Esta hoja ya tiene todas las casillas escritas: no se tocó nada. Si querés el texto de la Mesa, borrá la casilla y volvé a tocar.')
    onLlevar?.(r.valor)
    setMsg(`🌱 ${r.n} casilla(s) con el CAP ${activo.n}, marcadas «[Mesa — verificar]». Lo que ya estaba escrito no se tocó.`)
  }

  return h('div', { style: E.raiz, 'data-cap-panel': hoja?.id },
    h('button', { style: E.cab, onClick: () => setAbierto((x) => !x) }, `${abierto ? '▾' : '▸'} 💡 La Mesa propone 2 cursos de acción propios para ESTE ejercicio`),
    h('div', { style: E.fila }, P.caps.map(botonCAP)),
    abierto && h('div', { style: E.sub }, `Leyó: operación ${A.tipo} · ${A.propia} · maniobra: ${A.maniobra.map((u) => u.designacion).join(', ') || '—'}${A.reserva ? ` · más atrás: ${A.reserva.designacion}` : ''} · avenidas: ${A.avenidas.map((a) => a.nombre).join(', ') || '—'} · enemigo: ${A.enemigo}. Cambiá la forma de cada CAP en su lista.`),
    abierto && P.avisos.map((a, i) => h('div', { key: i, style: E.aviso }, `⚠️ ${a}`)),
    abierto && P.caps.map(tarjeta),
    abierto && h('div', { style: { display: 'flex', flexDirection: 'column', gap: 5 } },
      hoja?.id === 'coa' && h('button', { style: E.btn, onClick: llevar }, `🌱 Llevar el CAP ${activo.n} a esta hoja (sólo las casillas vacías)`),
      hoja?.id === 'coa' && h('button', { style: E.btn, 'data-cap-texto': '1', onClick: () => (setMsg(''), onAccion?.('texto', escritor(ctx))) }, '📝 Llevar la carta a la F3·P6 de los dos CAP (lo que quedó en las fases 🔵: unidades, tareas, obstáculos y fuegos)'),
      h('button', { style: E.btn, onClick: () => (setMsg(''), onAccion?.('fases', armado(activo))) }, `🎬 Armar las ${activo.fases.length} fases 🔵 del CAP ${activo.n} (todas las fichas: juntas con el CE, a sus trabajos de barreras, a su puesto con su tarea…)`)),
    msg && h('div', { style: E.ok }, msg),
    // 🤖 La IA desarrolla los dos CAP y la Mesa los pone en la carta (la caja de la IA de la Mesa: copiar, abrir en
    // Claude / ChatGPT / Gemini, pegar la respuesta y ✓ Aplicar).
    abierto && R.CajaIA && h(R.CajaIA, {
      key: 'ia-carta',
      titulo: '🤖 La IA desarrolla los dos CAP EN LA CARTA',
      nota: 'Le manda el expediente, esta propuesta y las piezas de la carta (las unidades, los lugares, las tareas tácticas, los obstáculos y los fuegos). Al pegar su respuesta, la Mesa arma las fases 🔵 de los DOS CAP: mueve cada unidad al lugar que dijo, pone las tareas tácticas, los obstáculos y los fuegos de cada fase, y llena la F3·P6 de cada uno (sólo lo vacío). Después vos lo corregís en la carta.',
      color: AZUL,
      onPedido: async () => {
        const e = await onExpediente?.()
        return pedidoCarta({ ctx, P, activo: C.activo, expediente: e?.md || '', lugares: lugaresDeLaCarta(), ...catalogos() })
      },
      onAplicar: (texto) => {
        // Si la IA nombra un lugar que no está en la carta, la unidad va donde la pone la Mesa en esa fase.
        const mesaPos = {}
        for (const c of P.caps) mesaPos[c.n] = (forma) => posicionesCAP(forma && forma !== c.forma ? armarCAP(c.n, forma, P.A) : c, { unidades: ctx.unidades || [], ops: ctx.ops || {}, marcas: ctx.g3?.conceptoCarta?.marcas || [], A: P.A, previas: fasesDe(c.n) })
        const r = leerRespuesta(texto, { ...ctx, lugares: lugaresDeLaCarta(), plan: planDeLaCarta(), mesaPos, ...catalogos() })
        if (!r.ok) return { ok: false, error: r.error }
        if (onAccion?.('colocar', { resultado: r }) === false) return { ok: false, error: 'No se colocó nada (se canceló, o la BASE está con candado).' }
        const f = r.faltan.length ? ` ⚠️ No se pudo: ${r.faltan.slice(0, 6).join('; ')}${r.faltan.length > 6 ? `; y ${r.faltan.length - 6} más` : ''}.` : ''
        return { ok: true, msg: `🗺️ ${r.resumen} en la carta. Mirá el CAP ${C.activo} fase por fase en el 🎬 C.A. por fases; el otro quedó guardado (tocá su botón).${f} Revisá todo antes de darlo por bueno.` }
      },
    }),
    abierto && h('div', { style: E.pie }, `🤖 «Trabajar esta hoja con IA» le manda esta propuesta: la IA tiene que decir si cada CAP SIRVE o NO para este ejercicio (las cinco pruebas) y desarrollar el CAP ${C.activo} en esta hoja.`))
}

// Los botones «CAP 1 / CAP 2» del 🎬 C.A. por fases (debajo del título 🔵). info: { g3, fasesCOA, acc }.
export function botonesCAP(info, fasesCOA) {
  try {
    if (!info || !R.jsx) return null
    const C = capsDe(info.g3)
    const decidido = [1, 2].includes(Number(info.g3?._caps?.decision?.cap)) ? Number(info.g3._caps.decision.cap) : null
    const nf = fasesPorCAP(info.g3, fasesCOA || {})
    const nomF = (n) => {
      const id = C.formas[n]
      const f = id && Object.values(FORMAS).flat().find((x) => x.id === id)
      return f ? ` · ${f.nom}` : ''
    }
    return h('div', { style: { display: 'flex', gap: 5, margin: '4px 0 6px', alignItems: 'center', flexWrap: 'wrap' }, 'data-cap-botones': '1' },
      [1, 2].map((n) =>
        h('button', { key: n, 'data-cap': n, title: n === decidido ? 'Decidido por el Comandante (F4·P6-7)' : undefined, style: { ...E.cap(n === C.activo), flex: '0 0 auto', padding: '4px 8px', fontSize: 11.5 }, onClick: () => {
          if (n === C.activo) return
          const v = puedeIr(info.g3, n)
          if (!v.ok) return typeof window !== 'undefined' && window.alert(v.msg)
          info.acc?.(v.nuevo ? 'nuevo' : 'cambiar', { n })
        } }, `${n === C.activo ? '● ' : ''}CAP ${n}${nomF(n)} (${nf[n] || 0})${n === decidido ? ' 🎖️' : ''}`)),
      h('span', { style: { fontSize: 10.5, color: '#8fa3b5' } }, 'El otro CAP queda guardado con sus fases.'),
      botonFlechas({ flex: '0 0 auto', borderColor: COLOR_CAP[C.activo] || AZUL }))
  } catch {
    return null
  }
}

// ─── 🔵 El recorrido de cada CAP (11-11-2026) ────────────────────────────────────────────────────────────────
// Sergio: «armar los dos cursos de acción propio está muy confuso… cada curso de acción debe seguir los pasos
// (F3·P3 → F3·P6)… primero se termine un curso de acción, CAP 1, y luego vuelva la opción para generar otro curso de
// acción desde el principio… en cada curso de acción es necesario colocar su plan de fuegos y su barrera de
// obstáculos… después todo normal: la aplicación desarrolla su fase 1, fase 2, fase 3».
// En 📄 Documentos → «3 · Desarrollar los cursos de acción propios» (completo) y arriba de la F3·P3 a la F3·P6
// (compacto). r: { g3, acc (la acción de la Mesa), abrir(hojaId|null), tab(id), defensa(), ctx, hoja, compacto }
const VERDE = '#7dffb0'
const ER = {
  raiz: { border: `1.5px solid ${AZUL}`, borderRadius: 9, background: 'rgba(90,169,255,0.09)', padding: '9px 10px', margin: '6px 0', display: 'flex', flexDirection: 'column', gap: 6, color: '#e6eef6' },
  tit: { font: '800 13.5px Arial', color: '#fff' },
  sub: { fontSize: 12, color: '#b9c9da', lineHeight: 1.4 },
  caps: { display: 'flex', gap: 6 },
  cap: (on, ok) => ({ flex: 1, padding: '6px 8px', borderRadius: 7, border: `1.5px solid ${on ? AZUL : 'rgba(255,255,255,0.18)'}`, background: on ? 'rgba(90,169,255,0.25)' : 'rgba(255,255,255,0.03)', color: ok ? '#fff' : '#8fa3b5', font: '700 12.5px Arial', textAlign: 'left', cursor: on ? 'default' : 'pointer' }),
  paso: (hecho, sig, aqui) => ({ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 7, cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#e6eef6', border: `1px solid ${aqui ? '#fff' : sig ? '#ffd479' : hecho ? 'rgba(125,255,176,0.45)' : 'rgba(255,255,255,0.14)'}`, background: aqui ? 'rgba(255,255,255,0.12)' : sig ? 'rgba(255,212,121,0.12)' : 'rgba(0,0,0,0.18)' }),
  num: { font: '800 12px Arial', color: '#ff8fa3', minWidth: 42 },
  det: { fontSize: 11.5, color: '#9fc0d4' },
  btn: { ...E.btn, fontSize: 12.5, fontWeight: 700 },
  fin: { ...E.btn, fontSize: 13, fontWeight: 800, textAlign: 'center', background: 'rgba(125,255,176,0.18)', borderColor: VERDE, color: '#eafff2' },
  chip: (hecho, aqui) => ({ padding: '3px 7px', borderRadius: 12, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', border: `1px solid ${aqui ? '#fff' : hecho ? VERDE : 'rgba(255,255,255,0.25)'}`, background: aqui ? AZUL : hecho ? 'rgba(125,255,176,0.15)' : 'rgba(0,0,0,0.2)', color: '#fff' }),
}
export function rutaCAP(r = {}) {
  try {
    if (!R.jsx || !r.g3) return null
    const g3 = r.g3
    const ctx = { ...(r.ctx || {}), g3 }
    const C = capsDe(g3)
    const n = C.activo
    const otro = n === 1 ? 2 : 1
    const acc = (que, d) => r.acc?.(que, d)
    let P = null
    try {
      P = proponer(ctx, C.formas)
    } catch {}
    const cap = P?.caps?.find((c) => c.n === n) || null
    const formas = P ? { 1: P.caps[0].forma, 2: P.caps[1].forma } : undefined
    const plan = ctx.SIDplan !== undefined ? ctx.SIDplan : (typeof window !== 'undefined' && window.MesaFuegos?.plan) || null
    const pasos = pasosCAP(g3, { ops: ctx.ops || {}, plan, fases: (ctx.fasesCOA?.propio || []).length })
    const hechos = pasos.filter((p) => p.hecho).length
    const sig = pasos.find((p) => !p.hecho) || null
    const cerrado = cerradoCAP(g3, n)
    const existeOtro = existeCAP(g3, otro)
    const decidido = [1, 2].includes(Number(g3._caps?.decision?.cap)) ? Number(g3._caps.decision.cap) : null
    const irTab = (t) => (r.abrir?.(null), r.tab?.(t))

    const armarFuegos = () =>
      acc('fuegosCAP', {
        armar: (p) => {
          const MF = typeof window !== 'undefined' ? window.MesaFuegos : null
          return planFuegosCAP({ plan: p ?? MF?.plan ?? null, medios: MF?.medios || [], unidades: ctx.unidades || [], ops: ctx.ops || {}, cap, tipo: P?.tipo, modelo: MF?.modelo })
        },
      })
    const armarFases = () => cap && acc('fases', armadoDe(cap, P, ctx, formas))
    // Lo que hace tocar cada paso (y sus botones).
    const tocar = (p) => {
      if (p.hoja) return r.abrir?.(p.hoja)
      if (p.id === 'fuegos') return irTab('fuegos')
      if (p.id === 'barrera') return irTab('barreras')
      if (p.id === 'fases') return r.abrir?.('coa')
    }
    const extras = (p) => {
      if (r.compacto) return null
      if (p.id === 'fuegos') return h('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap', margin: '2px 0 4px 49px' } },
        h('button', { style: ER.btn, 'data-ruta-fuegos': '1', onClick: armarFuegos }, `🔥 Armar el plan de fuegos del CAP ${n} con la artillería`),
        h('button', { style: { ...ER.btn, fontWeight: 400 }, onClick: () => irTab('fuegos') }, 'Ver / corregir en 🔥 Fuegos'))
      if (p.id === 'barrera') return h('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap', margin: '2px 0 4px 49px' } },
        r.defensa && h('button', { style: ER.btn, 'data-ruta-barrera': '1', onClick: () => (r.abrir?.(null), r.defensa()) }, `🛡️ Trazar la barrera de obstáculos del CAP ${n}`),
        h('button', { style: { ...ER.btn, fontWeight: 400 }, onClick: () => irTab('barreras') }, 'Ver el plan de barreras'))
      if (p.id === 'fases') return h('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap', margin: '2px 0 4px 49px' } },
        cap && h('button', { style: ER.btn, 'data-ruta-fases': '1', onClick: armarFases }, `🎬 Armar las ${cap.fases.length} fases del CAP ${n} (FASE I, II, III…)`))
      return null
    }
    const terminar = () => {
      const faltan = pasos.filter((p) => !p.hecho)
      if (faltan.length && typeof window !== 'undefined' && !window.confirm(`Al CAP ${n} todavía le falta:\n\n${faltan.map((p) => `• ${p.num} ${p.nom}`).join('\n')}\n\n¿Lo das por terminado igual?`)) return
      acc('cerrar')
    }
    const nuevo = () => {
      if (typeof window !== 'undefined' && !window.confirm(`➕ Generar el CAP ${otro}\n\nEmpieza DE NUEVO desde la F3·P3 (Formación inicial de las fuerzas): la F3·P3, F3·P4, F3·P5 y F3·P6 en blanco, la carta sin tareas, sin barrera y sin fuegos, y sin fases.\n\nEl CAP ${n} queda guardado TAL CUAL (con su carta) y vuelve al tocar su botón.\n\n¿Seguimos?`)) return
      if (acc('nuevo', { n: otro, formas }) !== false) r.abrir?.('organizacion')
    }

    // 🧹 12-11-2026: las tareas del otro CAP que se le pasaron a éste al generarlo (proponer.fugaDelCAP).
    let F = null
    try {
      F = PP.fugaDelCAP ? PP.fugaDelCAP(g3, ctx.ops || {}) : null
    } catch {}
    const opCorta = (op) => String(op || '').toUpperCase().replace(/^OC(\d)/, 'OC $1')
    const sacarFuga = () => {
      if (typeof window !== 'undefined' && !window.confirm(`🧹 Sacar del CAP ${n} las ${F.tareas.length} tareas del CAP ${F.otro}\n\nLa carta del CAP ${n} queda sin esas tareas (también en sus fases) y su F3·P3 vuelve a empezar (el cuadro y quién es reserva). Las hojas F3·P4, F3·P5 y F3·P6 quedan como están.\n\nEl CAP ${F.otro} no se toca: las conserva.\n\n¿Seguimos?`)) return
      if (acc('limpiarFuga') !== false) r.abrir?.('organizacion')
    }
    const avisoFuga = F && h('div', { style: { ...E.aviso, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5 }, 'data-ruta-fuga': '1' },
      h('b', null, `⚠️ El CAP ${n} tiene ${F.tareas.length} tarea(s) táctica(s) que son del CAP ${F.otro}: se le pasaron al generarlo (un error de la Mesa, ya corregido).`),
      h('span', null, `Son: ${F.tareas.map((t) => `${PP.nombreTarea ? PP.nombreTarea(t.tarea) : t.tarea}${t.oi?.operacion ? ` (${opCorta(t.oi.operacion)})` : ''}`).join(', ')}. Si el CAP ${n} empieza de cero, sacalas y poné SUS tareas en la F3·P3; el CAP ${F.otro} las conserva.`),
      h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
        h('button', { style: { ...ER.fin, fontSize: 12.5 }, 'data-fuga-sacar': '1', onClick: sacarFuga }, `🧹 Sacarlas del CAP ${n} (empezar de cero)`),
        h('button', { style: { ...ER.btn, fontWeight: 400 }, 'data-fuga-dejar': '1', onClick: () => acc('dejarFuga') }, `Son del CAP ${n}: dejarlas`)))

    // 🪖 La F3·P5 con una fila por agrupación de la F3·P3 (Sergio: «solo debería ser escribir un nombre o dejarlo por
    // defecto en comandante»). Si la hoja está vacía, se arma sola al abrirla.
    const filasP5 = () => {
      try {
        return PP.filasComandos ? PP.filasComandos({ ops: ctx.ops || {}, g3, unidades: ctx.unidades || [], propia: ctx.ordenSup?.unidad || ctx.ordenSup?.unidadPropia || ctx.unidad || '' }) : []
      } catch {
        return []
      }
    }
    const conFilas = Array.isArray(g3.comandos) && g3.comandos.some((f) => f && Object.values(f).some((v) => String(v ?? '').trim()))
    const armarP5 = (preguntar = true) => {
      const filas = filasP5()
      if (filas.length && preguntar && conFilas && typeof window !== 'undefined' && !window.confirm(`🪖 Armar la F3·P5 con tu F3·P3\n\nReemplaza las ${g3.comandos.length} fila(s) que tiene ahora por ${filas.length}: una por agrupación de tu F3·P3 (OD, OC, RES, SOST, AP. FUEGOS), cada una con «Comandante de…». Los nombres que escribiste a mano como comandante se conservan.\n\n¿Seguimos?`)) return
      acc('comandos', { filas })
    }
    if (r.hoja === 'comandos' && !cerrado && !conFilas && !autoP5.has(n) && filasP5().length) {
      autoP5.add(n)
      setTimeout(() => armarP5(false), 0)
    }
    const cajaP5 = r.hoja === 'comandos' && h('div', { style: { ...E.ok, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5 }, 'data-ruta-p5': '1' },
      h('span', null, '🪖 La F3·P5 sale de TU F3·P3: una fila por agrupación (OD, OC, RES, SOST, AP. FUEGOS) con «Comandante de…». Sólo escribí el nombre del comandante, o dejalo así. No hace falta la IA.'),
      h('button', { style: { ...ER.btn, alignSelf: 'flex-start' }, 'data-ruta-p5-armar': '1', onClick: () => armarP5(true) }, '🪖 Armar la F3·P5 con mi F3·P3'))

    const botonCap = (k) => {
      const on = k === n
      const ex = on || existeCAP(g3, k)
      const est = on ? (cerradoCAP(g3, k) ? '✓ terminado' : `paso ${Math.min(hechos + 1, pasos.length)} de ${pasos.length}`) : ex ? (cerradoCAP(g3, k) ? '✓ terminado · guardado' : 'guardado') : cerrado ? '➕ generarlo' : '🔒 después del otro'
      return h('button', {
        key: k,
        'data-ruta-cap': k,
        style: ER.cap(on, ex || cerrado),
        onClick: () => {
          if (on) return
          if (ex) return acc('cambiar', { n: k, formas })
          if (cerrado) return nuevo()
          if (typeof window !== 'undefined') window.alert(`🔒 Primero terminá el CAP ${n}. Después aparece «➕ Generar el CAP ${k}», que empieza de nuevo desde la F3·P3.`)
        },
      }, `${on ? '● ' : ''}CAP ${k}${k === decidido ? ' 🎖️' : ''}`, h('div', { style: { fontWeight: 400, fontSize: 11 } }, est))
    }

    if (r.compacto) {
      return h('div', { style: { ...ER.raiz, gap: 5 }, 'data-ruta': 'compacta' },
        h('div', { style: { ...ER.tit, fontSize: 12.5 } }, `🔵 Estás armando el CAP ${n}${cerrado ? ' (✓ terminado)' : ''} · ${hechos} de ${pasos.length} pasos`),
        h('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap' } },
          pasos.map((p, i) => h('button', { key: p.id, 'aria-label': `Paso ${i + 1} del CAP ${n}: ${p.nom}`, style: ER.chip(p.hecho, p.hoja && p.hoja === r.hoja), title: p.nom, onClick: () => tocar(p) }, `${p.hecho ? '✓ ' : ''}${p.num}`)),
          !cerrado && h('button', { style: { ...ER.chip(false, false), borderColor: VERDE }, 'data-ruta-terminar': '1', onClick: terminar }, `✓ Terminar el CAP ${n}`),
          cerrado && !existeOtro && h('button', { style: { ...ER.chip(false, false), borderColor: VERDE }, 'data-ruta-nuevo': '1', onClick: nuevo }, `➕ Generar el CAP ${otro}`)),
        sig && sig.hoja !== r.hoja && !cerrado && h('div', { style: ER.det }, `Siguiente: ${sig.num} ${sig.nom}${sig.detalle ? ` (${sig.detalle})` : ''}.`),
        avisoFuga,
        cajaP5)
    }

    return h('div', { style: ER.raiz, 'data-ruta': 'completa' },
      h('div', { style: ER.tit }, '🔵 Los cursos de acción propios, UNO POR VEZ'),
      avisoFuga,
      h('div', { style: ER.sub }, `Cada CAP sigue los mismos pasos: F3·P3 → F3·P6, su plan de fuegos (lo dispara la artillería), su barrera de obstáculos y sus fases. Terminás el CAP 1 y recién ahí se genera el CAP 2 desde el principio. (La F3·P1 Potencia relativa de combate es una sola para los dos.)`),
      h('div', { style: ER.caps }, [1, 2].map(botonCap)),
      h('div', { style: { ...ER.tit, fontSize: 12.5, marginTop: 2 } }, `CAP ${n}${cap ? ` · ${cap.nomForma}` : ''} — ${hechos} de ${pasos.length} pasos`),
      pasos.map((p, i) => h('div', { key: p.id },
        h('button', { style: { ...ER.paso(p.hecho, p === sig && !cerrado, false), width: '100%' }, 'data-ruta-paso': p.id, 'aria-label': `Paso ${i + 1} del CAP ${n}: ${p.nom}${p.hecho ? ' (hecho)' : ''}`, onClick: () => tocar(p) },
          h('span', null, p.hecho ? '✅' : p === sig ? '👉' : '⬜'),
          h('span', { style: ER.num }, `${i + 1}. ${p.num}`),
          h('span', { style: { flex: 1 } }, p.nom, p.detalle ? h('div', { style: ER.det }, p.detalle) : null),
          h('span', null, '▸')),
        extras(p))),
      !cerrado && h('button', { style: ER.fin, 'data-ruta-terminar': '1', onClick: terminar }, `✓ Terminar el CAP ${n}`),
      cerrado && h('div', { style: { ...E.ok, fontSize: 12.5 } }, `✓ El CAP ${n} está terminado.`),
      cerrado && !existeOtro && h('button', { style: ER.fin, 'data-ruta-nuevo': '1', onClick: nuevo }, `➕ Generar el CAP ${otro} — empieza de nuevo desde la F3·P3`),
      cerrado && existeOtro && !cerradoCAP(g3, otro) && h('button', { style: ER.fin, onClick: () => acc('cambiar', { n: otro, formas }) }, `➡️ Seguir con el CAP ${otro}`),
      cerrado && existeOtro && cerradoCAP(g3, otro) && h('div', { style: { ...E.ok, fontSize: 12.5 } }, '✓ Los dos CAP están terminados: sigue «4 · Analizar los cursos de acción (Juego de Guerra)».'),
      cerrado && h('button', { style: { ...ER.btn, fontWeight: 400, alignSelf: 'flex-start' }, onClick: () => acc('reabrir') }, `✏️ Reabrir el CAP ${n} para corregirlo`))
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('rutaCAP', e)
    return null
  }
}
