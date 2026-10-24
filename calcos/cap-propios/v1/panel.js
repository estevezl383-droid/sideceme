// 💡 El panel «La Mesa propone 2 CAP para este ejercicio», arriba de la F3·P6 (y de la F3·P4) en el Tablero del
// G-3, y los botones «CAP 1 / CAP 2» del 🎬 C.A. por fases. La lógica está en proponer.mjs; acá sólo se dibuja.
// JavaScript sin compilar: React llega por configurarCAP() (lo llama el compilado antes del primer render).
import { proponer, capsDe, fasesPorCAP, llevarAHoja, FORMAS, armarCAP } from './proponer.mjs?v=todas20261024'
import { pedido, HOJAS_POR_CAP } from './proponer.mjs?v=todas20261024'
// Con versión: lo nuevo (la lectura tolerante del JSON, las posiciones por fase) tiene que llegar aunque el navegador
// tenga guardados los archivos de antes.
import { pedidoCarta, leerRespuesta } from './carta-ia.mjs?v=todas20261024'
import { textoDeLaCarta, hojaConCarta, bloqueCartaIA, nomenclatorDe } from './texto-carta.mjs'
import { posicionesCAP, movibles } from './posiciones.mjs?v=todas20261024'
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

// props: { hoja, valor, ctx: { unidades, ops, cmoc, ordenSup, unidad, fasesCOA, g3 }, onAccion(que, datos), onLlevar(valor),
//          onExpediente() → { md } }
export default function PanelCAP({ hoja, valor, ctx = {}, onAccion, onLlevar, onExpediente }) {
  const [abierto, setAbierto] = R.useState(hoja?.id === 'coa')
  const [msg, setMsg] = R.useState('')
  const C = capsDe(ctx.g3)
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

  const botonCAP = (c) =>
    h('button', { key: c.n, style: E.cap(c.n === C.activo), 'data-cap': c.n, onClick: () => c.n !== C.activo && (setMsg(''), onAccion?.('cambiar', { n: c.n, formas })) },
      `${c.n === C.activo ? '● ' : ''}CAP ${c.n} · ${c.nomForma}`,
      h('div', { style: { fontWeight: 400, fontSize: 10.5, marginTop: 2 } }, `${nf[c.n] || 0} fase(s) 🔵${c.n === C.activo ? ' · el que estás trabajando' : ' · guardado'}`))

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
  const botonesFase = (c) => {
    const fs = fasesDe(c.n)
    if (!fs.length) return h('div', { style: E.fases }, '🎬 Todavía sin fases en la carta: tocá «🎬 Armar las fases» o pedíselas a la IA (abajo).')
    const q = quietas(fs)
    const deNuevo = c.n === C.activo ? 'Tocá «🎬 Armar las fases» de nuevo' : `Pasá al CAP ${c.n} y tocá «🎬 Armar las fases»`
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
          onClick: () => (setMsg(''), onAccion?.('fase', { n: c.n, idx: i, formas })),
        }, `FASE ${ROM[i] || i + 1}${f.nombre ? ` · ${corto(f.nombre)}` : ''}`))))
  }

  const tarjeta = (c) =>
    h('div', { key: c.n, style: E.tarjeta(c.n === C.activo), 'data-tarjeta-cap': c.n },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' } },
        h('span', { style: E.tit }, `CAP ${c.n}`),
        h('select', { style: E.sel, value: c.forma, 'data-forma-cap': c.n, onChange: (e) => onAccion?.('forma', { n: c.n, forma: e.target.value }) },
          FORMAS[P.tipo].map((f) => h('option', { key: f.id, value: f.id }, f.larga)))),
      c.roles.map((r, i) => h('div', { key: i, style: E.rol }, h('b', null, `${r.principal ? '★ ' : ''}${r.rol}: `), `${r.unidades.map((u) => u.nom).join(', ')} — ${r.tarea}.`)),
      h('div', { style: E.dist }, `🗺️ En la carta: ${c.distingue}.`),
      h('div', { style: E.fases }, `🎬 ${c.fases.map((f, i) => `${i + 1}. ${f.nombre} (${f.cuando})`).join(' · ')}`),
      botonesFase(c))

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
      h('button', { style: E.btn, onClick: () => (setMsg(''), onAccion?.('fases', { cap: activo, formas, posiciones: (us, ops, x) => posicionesCAP(activo, { unidades: us, ops, marcas: ctx.g3?.conceptoCarta?.marcas || [], A: P.A, previas: x?.previas }) })) }, `🎬 Armar las ${activo.fases.length} fases 🔵 del CAP ${activo.n} (todas las fichas: juntas con el CE, a sus trabajos de barreras, a su puesto…)`)),
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
    const nf = fasesPorCAP(info.g3, fasesCOA || {})
    const nomF = (n) => {
      const id = C.formas[n]
      const f = id && Object.values(FORMAS).flat().find((x) => x.id === id)
      return f ? ` · ${f.nom}` : ''
    }
    return h('div', { style: { display: 'flex', gap: 5, margin: '4px 0 6px', alignItems: 'center', flexWrap: 'wrap' }, 'data-cap-botones': '1' },
      [1, 2].map((n) =>
        h('button', { key: n, 'data-cap': n, style: { ...E.cap(n === C.activo), flex: '0 0 auto', padding: '4px 8px', fontSize: 11.5 }, onClick: () => n !== C.activo && info.acc?.('cambiar', { n }) }, `${n === C.activo ? '● ' : ''}CAP ${n}${nomF(n)} (${nf[n] || 0})`)),
      h('span', { style: { fontSize: 10.5, color: '#8fa3b5' } }, 'El otro CAP queda guardado con sus fases.'))
  } catch {
    return null
  }
}
