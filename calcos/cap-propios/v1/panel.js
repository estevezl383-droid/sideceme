// 💡 El panel «La Mesa propone 2 CAP para este ejercicio», arriba de la F3·P6 (y de la F3·P4) en el Tablero del
// G-3, y los botones «CAP 1 / CAP 2» del 🎬 C.A. por fases. La lógica está en proponer.mjs; acá sólo se dibuja.
// JavaScript sin compilar: React llega por configurarCAP() (lo llama el compilado antes del primer render).
import { proponer, capsDe, fasesPorCAP, llevarAHoja, FORMAS } from './proponer.mjs'
import { pedidoCarta, leerRespuesta } from './carta-ia.mjs'
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

  const tarjeta = (c) =>
    h('div', { key: c.n, style: E.tarjeta(c.n === C.activo), 'data-tarjeta-cap': c.n },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' } },
        h('span', { style: E.tit }, `CAP ${c.n}`),
        h('select', { style: E.sel, value: c.forma, 'data-forma-cap': c.n, onChange: (e) => onAccion?.('forma', { n: c.n, forma: e.target.value }) },
          FORMAS[P.tipo].map((f) => h('option', { key: f.id, value: f.id }, f.larga)))),
      c.roles.map((r, i) => h('div', { key: i, style: E.rol }, h('b', null, `${r.principal ? '★ ' : ''}${r.rol}: `), `${r.unidades.map((u) => u.nom).join(', ')} — ${r.tarea}.`)),
      h('div', { style: E.dist }, `🗺️ En la carta: ${c.distingue}.`),
      h('div', { style: E.fases }, `🎬 ${c.fases.map((f, i) => `${i + 1}. ${f.nombre} (${f.cuando})`).join(' · ')}`))

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
      h('button', { style: E.btn, onClick: () => (setMsg(''), onAccion?.('fases', { cap: activo, formas })) }, `🎬 Armar las ${activo.fases.length} fases 🔵 del CAP ${activo.n} (con el dispositivo de ahora; después movés las fichas)`)),
    msg && h('div', { style: E.ok }, msg),
    // 🤖 La IA desarrolla los dos CAP y la Mesa los pone en la carta (la caja de la IA de la Mesa: copiar, abrir en
    // Claude / ChatGPT / Gemini, pegar la respuesta y ✓ Aplicar).
    abierto && R.CajaIA && h(R.CajaIA, {
      key: 'ia-carta',
      titulo: '🤖 La IA desarrolla los dos CAP EN LA CARTA',
      nota: 'Le manda el expediente, esta propuesta y las piezas de la carta (las unidades, los lugares, las tareas tácticas y los obstáculos). Al pegar su respuesta, la Mesa arma las fases 🔵 de los DOS CAP: mueve cada unidad al lugar que dijo, pone las tareas tácticas y los obstáculos, y llena la F3·P6 de cada uno (sólo lo vacío). Después vos lo corregís en la carta.',
      color: AZUL,
      onPedido: async () => {
        const e = await onExpediente?.()
        return pedidoCarta({ ctx, P, activo: C.activo, expediente: e?.md || '', lugares: lugaresDeLaCarta(), tareas: R.tareas || [], obstaculos: R.obstaculos || {} })
      },
      onAplicar: (texto) => {
        const r = leerRespuesta(texto, { ...ctx, lugares: lugaresDeLaCarta(), tareas: R.tareas || [], obstaculos: R.obstaculos || {} })
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
