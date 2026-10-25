// ⚔️ El panel «Evento crítico para el Juego de Guerra», arriba de la F4·P6-7 Matriz de sincronización en el Tablero
// del G-3: elige una fase 🔵 del CAP y la fase 🔴 del CAE que la enfrenta, marca la más crítica (⭐), lo guarda en el
// ejercicio, lo anota en la matriz y baja el archivo para el Juego de Guerra. La lógica está en modelo.mjs.
// JavaScript sin compilar: React llega en la prop R (jsx, jsxs, useState) desde el compilado.
import { encuentros, resolver, conEvento, anotar, paraElJuego, nombreArchivo, textoMedida, capActivo, fasesDeCAP, NOM_COA } from './modelo.mjs?v=ev20261025'

const ROJO = '#ff6b6b'
const AZUL = '#5aa9ff'
const E = {
  raiz: { background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.45)', borderRadius: 8, padding: '8px 10px', margin: '6px 0', color: '#e6eef6', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 7 },
  tit: { font: '800 13px Arial', color: '#ffb3b3' },
  sub: { fontSize: 11, color: '#b9c9da', lineHeight: 1.45 },
  aviso: { fontSize: 11.5, color: '#ffd479', background: '#3a2f12', borderRadius: 6, padding: '6px 8px', lineHeight: 1.4 },
  fila: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  opc: (on) => ({ padding: '5px 9px', borderRadius: 6, cursor: on ? 'default' : 'pointer', border: `1.5px solid ${on ? ROJO : 'rgba(255,255,255,0.18)'}`, background: on ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.03)', color: on ? '#fff' : '#b9c9da', font: '700 11.5px Arial' }),
  encuentro: (on) => ({ border: `1.5px solid ${on ? ROJO : 'rgba(255,255,255,0.14)'}`, borderRadius: 7, padding: '6px 8px', background: on ? 'rgba(255,107,107,0.12)' : 'rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer' }),
  azul: { color: AZUL, fontWeight: 700 },
  rojo: { color: ROJO, fontWeight: 700 },
  medida: { fontSize: 11, color: '#cfd9e3', lineHeight: 1.4 },
  sel: { background: '#0f1b26', color: '#e6eef6', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 5, padding: '3px 5px', fontSize: 11.5, maxWidth: '100%' },
  btn: { background: 'rgba(255,107,107,0.16)', color: '#ffe3e3', border: '1px solid rgba(255,107,107,0.55)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontSize: 12, textAlign: 'left' },
  ok: { fontSize: 11.5, color: '#7dffb0', lineHeight: 1.4 },
  pie: { fontSize: 11, color: '#c69cff', lineHeight: 1.45 },
}

function bajar(nombre, texto) {
  const u = URL.createObjectURL(new Blob([texto], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = u
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(u), 4000)
}

export default function PanelEvento({ R, hoja, valor, ctx, onLlevar }) {
  const v = valor || {}
  const guardado = v._evento || null
  const act = capActivo(ctx?.g3)
  const [cap, setCap] = R.useState(guardado?.cap || act)
  const [coa, setCoa] = R.useState(guardado?.coa || 'probable')
  const [elegidas, setElegidas] = R.useState(guardado ? { [guardado.azul]: guardado.rojo } : {})
  const [sel, setSel] = R.useState(guardado ? guardado.azul : null)
  const [msg, setMsg] = R.useState('')
  const h = (t, p, ...c) => {
    const hs = c.flat().filter((x) => x !== null && x !== undefined && x !== false && x !== '')
    const { key, ...q } = p || {}
    return hs.length > 1 ? R.jsxs(t, { ...q, children: hs }, key) : R.jsx(t, hs.length ? { ...q, children: hs[0] } : q, key)
  }

  const conFases = [1, 2].filter((n) => fasesDeCAP(ctx, n).length)
  // El CAP y el CAE que se ven: los elegidos si tienen fases; si no, los que las tengan.
  const capV = conFases.includes(cap) ? cap : conFases[0] || cap
  let enc = encuentros(ctx, { cap: capV, coa, elegidas })
  const coaV = enc.coas.includes(coa) ? coa : enc.coas[0] || coa
  if (coaV !== coa) enc = encuentros(ctx, { cap: capV, coa: coaV })
  const caeHay = enc.rojas.length > 0
  const elegido = enc.filas.find((f) => f.azul.idx === sel && f.roja) || enc.critico
  const selActual = elegido && elegido.roja ? { cap: elegido.azul.cap, azul: elegido.azul.idx, rojo: elegido.roja.idx, coa: elegido.roja.coa } : null
  const r = selActual ? resolver(ctx, selActual) : null
  const yaGuardado = guardado && selActual && guardado.cap === selActual.cap && guardado.azul === selActual.azul && guardado.rojo === selActual.rojo

  const guardar = () => {
    if (!selActual) return
    onLlevar(conEvento(v, selActual))
    setMsg(`💾 Guardado en el ejercicio: ${r.nombre}. El Juego de Guerra lo ofrece primero al traer este ejercicio.`)
  }
  const anotarEnMatriz = () => {
    if (!r) return
    if (!r.azul.activo) return setMsg(`📝 Las columnas de la matriz son las fases del CAP ${act} (el activo). Para anotar el CAP ${r.azul.cap}, pasá a él (F3·P6 o 🎬 C.A. por fases).`)
    const a = anotar(conEvento(v, selActual), hoja, r)
    onLlevar(a.valor)
    setMsg(a.n ? `📝 Anotado en la columna «${a.col}»: ${a.n} casilla(s) vacía(s) (MANIOBRA e INTELIGENCIA), con «[Mesa — verificar]». Lo que ya estaba escrito no se tocó. El enfrentamiento quedó guardado.` : '📝 Esas casillas ya tenían texto: no se tocaron. El enfrentamiento quedó guardado.')
  }
  const bajarJuego = () => {
    const M = typeof window !== 'undefined' && window.SIDMesaEjercicio
    let ej = null
    try {
      ej = M && M.foto && M.foto()
    } catch {
      ej = null
    }
    if (!ej) return setMsg('⚠️ No encontré el ejercicio abierto en la Mesa: abrilo y volvé a tocar.')
    const d = paraElJuego(ej, v, selActual)
    if (!d) return setMsg('⚠️ Esas fases ya no están en el ejercicio: elegí de nuevo.')
    d.guardadoEn = new Date().toISOString()
    bajar(nombreArchivo(M.nombre && M.nombre()), JSON.stringify(d))
    if (!yaGuardado) onLlevar(conEvento(v, selActual))
    setMsg('⬇️ Bajado (está en Descargas). En el Juego de Guerra: ⚙️ Configurar → 🌄 Traer escenario → 📂 Cargar escenario (reemplaza) → elegí ese archivo → «⚔️ EVENTO CRÍTICO».')
  }

  return h(
    'div',
    { style: E.raiz, 'data-evento-critico': '1' },
    h('div', { style: E.tit }, '⚔️ Evento crítico para el Juego de Guerra — 🔴 CAE (G-2) contra 🔵 CAP (G-3)'),
    h('div', { style: E.sub }, 'PMTD 2017: la matriz de sincronización «permite sincronizar el curso de acción para que coincida en tiempo, espacio y propósito en relación con el curso de acción más probable del enemigo». Elegí la fase 🔵 y la fase 🔴 que se enfrentan: quedan guardadas juntas en el ejercicio y el Juego de Guerra las carga en el mismo tablero, los dos bandos a la vez. ⭐ = el encuentro más crítico (más unidades enemigas en contacto, más poder enemigo y más cerca).'),
    !caeHay && h('div', { style: E.aviso }, '⚠️ El G-2 todavía no armó las fases 🔴 del CAE. En la carta: 🎬 C.A. por fases → «Generar el curso de acción enemigo» (sale de la plantilla situacional acostada).'),
    !conFases.length && h('div', { style: E.aviso }, '⚠️ Todavía no hay fases 🔵 del CAP. Tablero del G-3 → F3·P6 → «🎬 Armar las 5 fases 🔵 del CAP» (o pedíselas a la IA).'),
    conFases.length > 1 &&
      h('div', { style: E.fila }, h('span', { style: E.sub }, '🔵 CAP:'), ...conFases.map((n) => h('button', { key: 'cap' + n, style: E.opc(n === capV), onClick: () => { setCap(n); setSel(null); setElegidas({}) } }, `CAP ${n}${n === act ? ' (activo)' : ' (guardado)'}`))),
    enc.coas.length > 1 &&
      h('div', { style: E.fila }, h('span', { style: E.sub }, '🔴 contra:'), ...enc.coas.map((c) => h('button', { key: 'coa' + c, style: E.opc(c === coaV), onClick: () => { setCoa(c); setSel(null); setElegidas({}) } }, NOM_COA[c]))),
    caeHay &&
      enc.filas.map((f) => {
        const on = elegido && elegido.azul.idx === f.azul.idx
        const delCAE = enc.rojas.filter((x) => x.coa === coaV)
        return h(
          'div',
          { key: 'e' + f.azul.cap + '-' + f.azul.idx, style: E.encuentro(on), 'data-ev-fila': String(f.azul.idx), onClick: () => setSel(f.azul.idx) },
          h('div', null, enc.critico === f ? '⭐ ' : '', h('span', { style: E.azul }, '🔵 ' + f.azul.nombre)),
          h(
            'div',
            { style: E.fila },
            h('span', { style: E.rojo }, '⚔️ 🔴'),
            h(
              'select',
              {
                style: E.sel,
                value: f.roja ? String(f.roja.idx) : '',
                onClick: (e) => e.stopPropagation(),
                onChange: (e) => {
                  setElegidas({ ...elegidas, [f.azul.idx]: Number(e.target.value) })
                  setSel(f.azul.idx)
                },
              },
              ...delCAE.map((x) => h('option', { key: 'o' + x.idx, value: String(x.idx) }, x.nombre)),
            ),
          ),
          f.medida && h('div', { style: E.medida }, textoMedida(f.medida) + '.'),
        )
      }),
    r &&
      h(
        'div',
        { style: E.fila },
        h('button', { style: E.btn, onClick: guardar, 'data-ev': 'guardar' }, yaGuardado ? '💾 Guardado ✓ (volver a guardar)' : '💾 Guardar este enfrentamiento'),
        h('button', { style: E.btn, onClick: anotarEnMatriz, 'data-ev': 'anotar' }, '📝 Anotarlo en la matriz'),
        h('button', { style: E.btn, onClick: bajarJuego, 'data-ev': 'bajar' }, '⬇️ Bajar para el Juego de Guerra (.json)'),
      ),
    guardado && !yaGuardado && resolver(ctx, guardado) && h('div', { style: E.sub }, `Guardado ahora: ${resolver(ctx, guardado).nombre}.`),
    msg && h('div', { style: E.ok }, msg),
    h('div', { style: E.pie }, '🎲 En el Juego de Guerra (SIDECEME): ⚙️ Configurar → 🌄 Traer escenario del Generador de Calcos → 📂 Cargar escenario (reemplaza) con este ejercicio (el .json de ⬇️, o el de la carpeta del ejercicio) → «⚔️ EVENTO CRÍTICO». Ahí también se puede armar otro enfrentamiento con «⚔️ Enfrentar una fase 🔵 con una fase 🔴».'),
  )
}
