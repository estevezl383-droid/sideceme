// 🎖️ El panel de la F4·P6-7 Matriz de sincronización en el Tablero del G-3, en tres pasos:
//   ① JUEGO DE GUERRA: cada fase 🔵 del CAP contra una fase 🔴 del CAE (más probable / más peligroso), la más crítica
//     con ⭐; se guarda en la hoja y se baja para el Juego de Guerra (modelo.mjs);
//   ② DECISIÓN DEL COMANDANTE: CAP 1 o CAP 2 (decision.mjs). La Mesa pasa a ese CAP: el resto del planeamiento sigue
//     con él;
//   ③ la MATRIZ: recién con la decisión (el compilado esconde 🌱, la IA y la rejilla hasta entonces).
// 08-11-2026, Sergio: «reduce el texto… que sea sólo de ejecución… que no haya tanto texto pequeño».
// JavaScript sin compilar: React llega en la prop R (jsx, jsxs, useState) desde el compilado. `onAccion` es la acción de
// los CAP de la Mesa (la misma del F3·P6: 'cambiar'); `onG3` el setState del G-3 (acepta una función).
import { encuentros, resolver, conEvento, anotar, paraElJuego, nombreArchivo, textoMedida, textoCorto, capActivo, fasesDeCAP, NOM_COA } from './modelo.mjs?v=decision20261108'
import { estado, conDecision, sinDecision, nombreCAP, escritas, guardadaDe } from './decision.mjs?v=decision20261108'

const ROJO = '#ff6b6b'
const AZUL = '#5aa9ff'
const ORO = '#ffd479'
const VERDE = '#7dffb0'
const E = {
  raiz: { background: 'rgba(255,212,121,0.07)', border: `2px solid ${ORO}`, borderRadius: 10, padding: '10px 11px', margin: '6px 0', color: '#e6eef6', fontSize: 13.5, display: 'flex', flexDirection: 'column', gap: 9 },
  cab: { font: '800 16px/1.25 Arial', color: ORO, letterSpacing: '.02em' },
  pasos: { display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', font: '700 12.5px Arial' },
  paso: (on, hecho) => ({ borderRadius: 12, padding: '3px 9px', background: on ? ORO : hecho ? 'rgba(125,255,176,0.16)' : 'rgba(255,255,255,0.06)', color: on ? '#1a1405' : hecho ? VERDE : '#b9c9da' }),
  caja: (c) => ({ border: `1.5px solid ${c}`, borderRadius: 8, padding: '8px 9px', background: 'rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', gap: 7 }),
  tit: (c) => ({ font: '800 14px/1.3 Arial', color: c, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'default' }),
  plegar: { font: '800 14px/1.3 Arial', color: ROJO, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', width: '100%' },
  aviso: { fontSize: 13, color: '#ffe3a3', background: '#3a2f12', borderRadius: 6, padding: '6px 8px', lineHeight: 1.4 },
  fila: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  rot: { font: '700 13px Arial', color: '#b9c9da' },
  opc: (on, c = ROJO) => ({ padding: '6px 11px', borderRadius: 7, cursor: on ? 'default' : 'pointer', border: `1.5px solid ${on ? c : 'rgba(255,255,255,0.2)'}`, background: on ? `${c}33` : 'rgba(255,255,255,0.03)', color: on ? '#fff' : '#cfd9e3', font: '700 13px Arial' }),
  encuentro: (on) => ({ border: `1.5px solid ${on ? ROJO : 'rgba(255,255,255,0.14)'}`, borderRadius: 7, padding: '7px 8px', background: on ? 'rgba(255,107,107,0.12)' : 'rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 5, cursor: 'pointer' }),
  azul: { color: AZUL, font: '700 13.5px/1.3 Arial' },
  rojo: { color: ROJO, font: '700 13.5px Arial' },
  medida: { fontSize: 12.5, color: '#cfd9e3', lineHeight: 1.35 },
  sel: { background: '#0f1b26', color: '#e6eef6', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '5px 6px', fontSize: 13, flex: 1, minWidth: 0 },
  btn: { background: 'rgba(255,107,107,0.16)', color: '#ffe3e3', border: '1px solid rgba(255,107,107,0.6)', borderRadius: 7, padding: '7px 10px', cursor: 'pointer', font: '700 13px Arial', textAlign: 'left' },
  decidir: (n) => ({ flex: '1 1 140px', background: n === 1 ? 'rgba(160,110,255,0.18)' : 'rgba(255,92,200,0.16)', color: '#fff', border: `2px solid ${ORO}`, borderRadius: 9, padding: '10px 10px', cursor: 'pointer', font: '800 16px Arial', textAlign: 'left' }),
  decSub: { font: '400 12.5px/1.3 Arial', color: '#e6dcc0', marginTop: 3 },
  decidido: { font: '800 16px/1.3 Arial', color: VERDE },
  chico: { background: 'rgba(255,255,255,0.06)', color: '#cfd9e3', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', font: '700 12.5px Arial' },
  volver: { background: 'rgba(255,212,121,0.2)', color: '#fff', border: `1.5px solid ${ORO}`, borderRadius: 7, padding: '7px 10px', cursor: 'pointer', font: '800 13px Arial' },
  ok: { fontSize: 13, color: VERDE, lineHeight: 1.4 },
  candado: { font: '700 13.5px/1.4 Arial', color: '#e6dcc0' },
  abierta: { font: '800 14px/1.35 Arial', color: VERDE },
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
const sinCAP = (nombre) => String(nombre || '').replace(/^CAP \d+ · /, '')
const sinCAE = (nombre) => String(nombre || '').replace(/^CAE más (probable|peligroso) · /, '')

export default function PanelEvento({ R, hoja, valor, ctx, onLlevar, onAccion, onG3 }) {
  const v = valor || {}
  const guardado = v._evento || null
  const act = capActivo(ctx?.g3)
  const est = estado(ctx || {})
  const [cap, setCap] = R.useState(guardado?.cap || est.decidido || act)
  const [coa, setCoa] = R.useState(guardado?.coa || 'probable')
  const [elegidas, setElegidas] = R.useState(guardado ? { [guardado.azul]: guardado.rojo } : {})
  const [sel, setSel] = R.useState(guardado ? guardado.azul : null)
  const [verJuego, setVerJuego] = R.useState(null)
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
  const rGuardado = guardado ? resolver(ctx, guardado) : null
  // ① se pliega una vez decidido (se abre tocando el título).
  const juegoAbierto = verJuego == null ? !est.decidido : verJuego

  const guardar = () => {
    if (!selActual) return
    onLlevar(conEvento(v, selActual))
    setMsg(`💾 Guardado: ${r.nombre}.`)
  }
  const anotarEnMatriz = () => {
    if (!r || !r.azul.activo) return
    const a = anotar(conEvento(v, selActual), hoja, r)
    onLlevar(a.valor)
    setMsg(a.n ? `📝 Anotado en «${a.col}» (${a.n} casilla(s) vacía(s)).` : '📝 Esas casillas ya tenían texto: no se tocaron.')
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
    // Con los COE de 📚 Mis documentos (biblioteca del profesor): en el Juego cada unidad va con lo que tiene.
    let biblio = null
    try {
      biblio = (typeof window !== 'undefined' && window.SIDModalidad && window.SIDModalidad.biblioteca) || null
    } catch {
      biblio = null
    }
    const d = paraElJuego(ej, v, selActual, biblio)
    if (!d) return setMsg('⚠️ Esas fases ya no están en el ejercicio: elegí de nuevo.')
    d.guardadoEn = new Date().toISOString()
    bajar(nombreArchivo(M.nombre && M.nombre()), JSON.stringify(d))
    if (!yaGuardado) onLlevar(conEvento(v, selActual))
    const nCoe = (d.bibliotecaCOE || []).length
    setMsg(`⬇️ Bajado (en Descargas${nCoe ? `, con ${nCoe} COE` : ''}). En el Juego: ⚙️ Configurar → 🌄 Traer escenario → 📂 Cargar.`)
  }

  // ② Decidir: la Mesa pasa al CAP decidido (sus fases, su F3·P4 y su F3·P6, como el botón del F3·P6) y la matriz
  // pasa a ser la de ese CAP. Primero el cambio de CAP (setG3 con el G-3 entero); después, sobre ése, la decisión
  // (con una función: si no, el segundo pisaría al primero).
  const decidir = (n) => {
    if (typeof onAccion !== 'function' || typeof onG3 !== 'function') return setMsg('⚠️ Recargá la página (Cmd+Shift+R) para decidir.')
    const antes = act
    const nFases = fasesDeCAP(ctx, n).length
    if (n !== antes && !onAccion('cambiar', { n })) return setMsg(`⚠️ No se pudo pasar al CAP ${n}.`)
    onG3((g) => conDecision(g, n, { activoAntes: antes, nFases }))
    setVerJuego(null)
    // ① muestra las fases del CAP decidido (📝 anota las de ése).
    setCap(n)
    setSel(null)
    setElegidas({})
    const otra = n !== antes && escritas(v) ? ` La matriz que tenía (CAP ${v._cap === 1 || v._cap === 2 ? v._cap : antes}) quedó guardada.` : ''
    const vuelve = guardadaDe(v, n) ? ` Volvió la matriz del CAP ${n}.` : ''
    setMsg(`🎖️ CAP ${n} decidido.${n !== antes ? ` La Mesa pasó al CAP ${n}.` : ''}${otra}${vuelve}`)
  }
  const cambiarDecision = () => {
    if (typeof onG3 !== 'function') return
    onG3((g) => sinDecision(g))
    setVerJuego(true)
    setMsg('↺ Sin decisión: elegí de nuevo el CAP.')
  }
  const volverAlDecidido = () => {
    if (typeof onAccion !== 'function') return setMsg('⚠️ Recargá la página (Cmd+Shift+R).')
    if (!onAccion('cambiar', { n: est.decidido })) return setMsg(`⚠️ No se pudo pasar al CAP ${est.decidido}.`)
    setMsg(`🔵 De vuelta en el CAP ${est.decidido}.`)
  }

  const pasoActual = !est.decidido ? (guardado ? 2 : 1) : 3
  const nomCap = (n) => nombreCAP(ctx?.g3 || {}, n)

  // ── ① Juego de guerra ──
  const juego = h(
    'div',
    { key: 'juego', style: E.caja(ROJO), 'data-ev-juego': '1' },
    h('button', { style: E.plegar, onClick: () => setVerJuego(!juegoAbierto), 'data-ev-plegar': '1' }, `${juegoAbierto ? '▾' : '▸'} ① JUEGO DE GUERRA · CAP contra CAE`),
    !juegoAbierto && rGuardado && h('div', { style: E.medida }, `⚔️ ${rGuardado.nombre}`),
    juegoAbierto && !caeHay && h('div', { style: E.aviso }, '⚠️ Faltan las fases 🔴 del CAE: 🎬 C.A. por fases → «Generar el curso de acción enemigo».'),
    juegoAbierto && !conFases.length && h('div', { style: E.aviso }, '⚠️ Faltan las fases 🔵 del CAP: F3·P6 → «🎬 Armar las 5 fases 🔵».'),
    juegoAbierto &&
      conFases.length > 1 &&
      h('div', { style: E.fila }, h('span', { style: E.rot }, '🔵'), ...conFases.map((n) => h('button', { key: 'cap' + n, style: E.opc(n === capV, AZUL), onClick: () => { setCap(n); setSel(null); setElegidas({}) } }, `CAP ${n}${n === est.decidido ? ' 🎖️' : ''}`))),
    juegoAbierto &&
      enc.coas.length > 1 &&
      h('div', { style: E.fila }, h('span', { style: E.rot }, '🔴'), ...enc.coas.map((c) => h('button', { key: 'coa' + c, style: E.opc(c === coaV), onClick: () => { setCoa(c); setSel(null); setElegidas({}) } }, NOM_COA[c]))),
    juegoAbierto &&
      caeHay &&
      enc.filas.map((f) => {
        const on = elegido && elegido.azul.idx === f.azul.idx
        const delCAE = enc.rojas.filter((x) => x.coa === coaV)
        return h(
          'div',
          { key: 'e' + f.azul.cap + '-' + f.azul.idx, style: E.encuentro(on), 'data-ev-fila': String(f.azul.idx), onClick: () => setSel(f.azul.idx) },
          h('div', { style: E.azul }, `${enc.critico === f ? '⭐ ' : ''}🔵 ${sinCAP(f.azul.nombre)}`),
          h(
            'div',
            { style: { ...E.fila, flexWrap: 'nowrap' } },
            h('span', { style: E.rojo }, '⚔️'),
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
              ...delCAE.map((x) => h('option', { key: 'o' + x.idx, value: String(x.idx) }, `🔴 ${sinCAE(x.nombre)}`)),
            ),
          ),
          f.medida && h('div', { style: E.medida, title: textoMedida(f.medida) }, textoCorto(f.medida)),
        )
      }),
    juegoAbierto &&
      r &&
      h(
        'div',
        { style: E.fila },
        h('button', { style: E.btn, onClick: guardar, 'data-ev': 'guardar' }, yaGuardado ? '💾 Guardado ✓' : '💾 Guardar'),
        h('button', { style: E.btn, onClick: bajarJuego, 'data-ev': 'bajar' }, '⬇️ Bajar para el Juego'),
        est.abierta && r.azul.activo && h('button', { style: E.btn, onClick: anotarEnMatriz, 'data-ev': 'anotar' }, '📝 Anotar en la matriz'),
      ),
  )

  // ── ② Decisión del Comandante ──
  const nf = (n) => fasesDeCAP(ctx, n).length
  const decision = h(
    'div',
    { key: 'decision', style: E.caja(ORO), 'data-decision': est.decidido ? String(est.decidido) : '0' },
    h('div', { style: E.tit(ORO) }, '② ¿QUÉ CAP DECIDIÓ EL COMANDANTE?'),
    !est.decidido &&
      h(
        'div',
        { style: E.fila },
        [1, 2].map((n) =>
          h('button', { key: 'dec' + n, style: E.decidir(n), onClick: () => decidir(n), 'data-dec': String(n) }, `CAP ${n}`, h('div', { style: E.decSub }, [nomCap(n), nf(n) ? `${nf(n)} fases` : 'sin fases'].filter(Boolean).join(' · '))),
        ),
      ),
    est.decidido && h('div', { style: E.decidido, 'data-dec-estado': '1' }, `✅ CAP ${est.decidido}${nomCap(est.decidido) ? ` · ${nomCap(est.decidido)}` : ''}`),
    est.motivo === 'otro-cap' &&
      h('div', { style: E.aviso }, `⚠️ A la vista está el CAP ${est.activo}.`, ' ', h('button', { style: E.volver, onClick: volverAlDecidido, 'data-dec-volver': '1' }, `Volver al CAP ${est.decidido}`)),
    est.decidido && h('div', { style: E.fila }, h('button', { style: E.chico, onClick: cambiarDecision, 'data-dec-cambiar': '1' }, '↺ Cambiar la decisión')),
  )

  // ── ③ La matriz ──
  const nEsc = escritas(v)
  const matriz = est.abierta
    ? h('div', { key: 'matriz', style: E.abierta, 'data-matriz': 'abierta' }, `③ MATRIZ DEL CAP ${est.decidido} ↓ (🌱 del calco o 🤖 con IA)`)
    : h('div', { key: 'matriz', style: E.candado, 'data-matriz': 'cerrada' }, `🔒 ③ La matriz se llena después de la decisión${est.motivo === 'otro-cap' ? `, con el CAP ${est.decidido} a la vista` : ''}.${nEsc ? ` Ya tiene ${nEsc} casilla(s): se guardan.` : ''}`)

  return h(
    'div',
    { style: E.raiz, 'data-evento-critico': '1' },
    h('div', { style: E.cab }, '🎖️ DECISIÓN DEL COMANDANTE'),
    h('div', { style: E.pasos }, h('span', { style: E.paso(pasoActual === 1, pasoActual > 1) }, '① Juego de guerra'), '→', h('span', { style: E.paso(pasoActual === 2, pasoActual > 2) }, '② Decisión'), '→', h('span', { style: E.paso(pasoActual === 3, false) }, '③ Matriz')),
    juego,
    decision,
    msg && h('div', { style: E.ok, 'data-ev-msg': '1' }, msg),
    matriz,
  )
}
