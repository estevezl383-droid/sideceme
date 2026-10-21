// 🧮 Cálculos y ▣ ASDI / ARCE del G-4 en grande, y el reabastecimiento por ciclos (21-10-2026).
//
// Lo pidió Sergio con capturas del panel del G-4 y del Word del cálculo:
//   1. «la operación durará más de 30 días… debería haber la opción para cargar más días… e inclusive
//      calcular cada cuánto tiempo se podría realizar el reabastecimiento, o sea cada 3 días… tampoco es
//      que se dispone de todos los vehículos del mundo para mover»;
//   2. «ya que estos son cálculos muy delicados está muy pequeño… se podría abrir en el panel de abajo
//      automáticamente… lo que necesitamos es espacio» (y después: «igual para el ASDI y el ARCE»);
//   3. «Vehículos: 920 veh × 3 L × 2 días… no entiendo qué es veh»;
//   4. OBJETO / CARTAS / ANEXOS del Word vacíos: «cartas son las mismas que colocás, anexos S/A y
//      objeto la Sección IV Logística en Apoyo a las Operaciones Defensivas del CE-I».
//
// Este módulo tiene la lógica legible; el compilado (index-reabastecimiento-20261021.js) sólo lo llama.
// No importa React: recibe el `f` (jsx/jsxs del compilado) para armar los elementos.

// ── 1. Reabastecimiento por ciclos ─────────────────────────────────────────────────────────────────

// Peso de referencia de UNA ración (kg, con el embalaje): la ración normal son géneros en estado natural,
// la colectiva enlatados o liofilizados, la de combate tres comidas acondicionadas. Se pueden corregir.
export const KG_RACION = { normal: 2, colectiva: 1.5, combate: 1.2 }
// Días seguidos que se puede usar cada ración (lo dice la descripción de cada tipo en el cálculo).
export const MAX_DIAS_RACION = { colectiva: 10, combate: 3 }
export const REAB_INICIAL = { ciclo: 3, camiones: 10, cargaT: 3, kgRacion: null, cisternas: 2, litrosCisterna: 4800, distKm: 40, velKmH: 30, horasCarga: 2 }

const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d }
const pos = (v, d = 0) => Math.max(0, num(v, d))
const ent = (n) => Math.round(n).toLocaleString('es')
export const dia = (i) => (i === 0 ? 'D' : `D+${i}`)

// Días de la operación que cubren las jornadas de la Clase III: una por cada renglón con los
// Movimientos Diversos tildados (la segunda línea de un mismo día va sin MD).
export const diasJornadas = (filas = []) => (filas.filter((r) => !r.sinMD).length || filas.length || 1)

export function planReabastecimiento({
  dias = 1, ciclo = 3, efectivo = 0, vehiculos = 0, seguridad = 0.1, racion = 'combate', kgRacion = null,
  litrosHombre = 12, litrosVehiculo = 3, cl3 = { total: 0, filas: [] }, cl5 = { filas: [] }, aguaPorViaje = 0,
  camiones = 0, cargaT = 3, cisternas = 0, litrosCisterna = 4800, distKm = 0, velKmH = 30, horasCarga = 2,
} = {}) {
  const D = Math.max(1, Math.round(pos(dias, 1)))
  const C = Math.min(D, Math.max(1, Math.round(pos(ciclo, 1))))
  const kg = pos(kgRacion ?? KG_RACION[racion] ?? 1.5)
  const racDia = pos(efectivo) * (1 + pos(seguridad))
  const aguaDia = pos(efectivo) * pos(litrosHombre) + pos(vehiculos) * pos(litrosVehiculo)
  const dJ = diasJornadas(cl3.filas)
  const cl3Dia = pos(cl3.total) / dJ
  const cl5D = (cl5.filas || []).reduce((s, a) => s + a.cantidad * a.primerDia, 0)
  const cl5Suc = (cl5.filas || []).reduce((s, a) => s + a.cantidad * a.sucesivos, 0)

  const filas = []
  for (let desde = 0, n = 1; desde < D; desde += C, n++) {
    const d = Math.min(C, D - desde)
    filas.push({
      n, desde, hasta: desde + d - 1, dias: d,
      raciones: Math.ceil(racDia * d),
      agua: Math.round(aguaDia * d),
      cl3: Math.round(cl3Dia * d),
      cl5: desde === 0 ? cl5D + cl5Suc * (d - 1) : cl5Suc * d,
    })
  }
  const mayor = filas[0] // el primer ciclo es el más cargado (lleva el día D)
  const toneladas = (mayor.raciones * kg) / 1000
  const capCamiones = pos(camiones) * pos(cargaT)
  const capCisternas = pos(cisternas) * pos(litrosCisterna)
  const vueltas = (carga, cap) => (carga <= 0 ? 0 : cap > 0 ? Math.ceil(carga / cap) : Infinity)
  const v = { racion: vueltas(toneladas, capCamiones), agua: vueltas(mayor.agua, pos(aguaPorViaje)), cl3: vueltas(mayor.cl3, capCisternas) }
  const vueltasMax = Math.max(v.racion, v.agua, v.cl3)
  const horasVuelta = (pos(velKmH) > 0 ? (2 * pos(distKm)) / pos(velKmH) : 0) + pos(horasCarga)
  const horasNecesarias = vueltasMax * horasVuelta
  const horasCiclo = C * 24
  const alcanza = Number.isFinite(horasNecesarias) && horasNecesarias <= horasCiclo
  const camionesUnaVuelta = pos(cargaT) > 0 ? Math.ceil(toneladas / pos(cargaT)) : null

  const avisos = []
  const max = MAX_DIAS_RACION[racion]
  if (max && C > max) avisos.push(`Esta ración se usa como máximo ${max} días seguidos: con ella el ciclo no puede pasar de ${max} días (o se alterna con la ración normal).`)
  else if (max && D > max) avisos.push(`La operación dura ${D} días y esta ración sirve ${max} días seguidos: planificá la ración normal (o la colectiva) y dejá ésta para los días de combate y la reserva.`)
  if (!Number.isFinite(vueltasMax)) avisos.push('Faltan medios: cargá camiones, cisternas y medios de distribución de agua para saber cuántas vueltas hacen falta.')
  else if (!alcanza) avisos.push(`Con estos medios no se llega: hacen falta ${ent(horasNecesarias)} h de transporte y el ciclo tiene ${horasCiclo} h. Reabastecé más seguido, acercá el punto de abastecimiento o pedí más vehículos.`)

  const vtxt = (x) => (Number.isFinite(x) ? `${x} vuelta(s)` : 'sin medios')
  const pasos = [
    `Ciclo: un reabastecimiento cada ${C} día(s) → ${filas.length} reabastecimiento(s) en ${D} días.`,
    `Clase I: ${ent(pos(efectivo))} hombres × (1 + ${Math.round(pos(seguridad) * 100)} % de seguridad) × ${mayor.dias} días = ${ent(mayor.raciones)} raciones → × ${kg} kg = ${toneladas.toLocaleString('es', { maximumFractionDigits: 1 })} t → ${vtxt(v.racion)} con ${ent(pos(camiones))} camiones de ${pos(cargaT)} t (en una sola vuelta harían falta ${camionesUnaVuelta ?? '—'} camiones).`,
    `Agua: (${ent(pos(efectivo))} hombres × ${pos(litrosHombre)} L + ${ent(pos(vehiculos))} vehículos × ${pos(litrosVehiculo)} L) × ${mayor.dias} días = ${ent(mayor.agua)} L → ${vtxt(v.agua)} con los medios de distribución (${ent(pos(aguaPorViaje))} L por vuelta).`,
    `Clase III: ${ent(pos(cl3.total))} L en ${dJ} jornada(s) = ${ent(cl3Dia)} L por día × ${mayor.dias} días = ${ent(mayor.cl3)} L → ${vtxt(v.cl3)} con ${ent(pos(cisternas))} cisterna(s) de ${ent(pos(litrosCisterna))} L.`,
    `Clase V: ${ent(mayor.cl5)} proyectiles en el primer ciclo (lleva el día D) y ${ent(cl5Suc * C)} en cada ciclo completo siguiente.`,
    `Cada vuelta: 2 × ${pos(distKm)} km ÷ ${pos(velKmH)} km/h + ${pos(horasCarga)} h de carga y descarga = ${horasVuelta.toLocaleString('es', { maximumFractionDigits: 1 })} h → ${Number.isFinite(horasNecesarias) ? ent(horasNecesarias) : '—'} h de las ${horasCiclo} h del ciclo.`,
  ]
  return { dias: D, ciclo: C, filas, kgRacion: kg, toneladas, vueltas: v, vueltasMax, horasVuelta, horasNecesarias, horasCiclo, alcanza, camionesUnaVuelta, cl3Dia, diasJornadas: dJ, avisos, pasos }
}

// ── 2. Encabezado del Word: OBJETO, CARTAS, ANEXOS ─────────────────────────────────────────────────

const plano = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// «Defensivas» u «Ofensivas», según lo que dice la Orden (misión, intención, concepto…).
export function tipoOperacion(orden = {}) {
  const t = plano(['mision', 'intencion', 'concepto', 'tipoOperacion', 'organizacionTarea', 'coordinacion'].map((k) => orden?.[k] || '').join(' '))
  const def = (t.match(/defens|defender|defiend|retardad|retrograd/g) || []).length
  const ofe = (t.match(/ofensiv|atacar|ataque|ataca|contraofensiv/g) || []).length
  return def > ofe ? 'Defensivas' : ofe > def ? 'Ofensivas' : ''
}

export function encabezadoCalculo(orden = {}, unidad = '') {
  const tipo = tipoOperacion(orden)
  const u = String(unidad || orden?.unidad || '').trim()
  return {
    objeto: `Sección IV Logística en Apoyo a las Operaciones${tipo ? ' ' + tipo : ''}${u ? ' del ' + u : ''}.`,
    cartas: String(orden?.carta || '').trim(),
    anexos: 'S/A',
  }
}

// ── 3. El tablero grande abajo (Cálculos y ASDI / ARCE) ────────────────────────────────────────────

const CLAVE = 'sid-g4-tablero'
export function modoTableroInicial() {
  try { const m = localStorage.getItem(CLAVE); if (m === 'abajo' || m === 'panel' || m === 'mini') return m } catch {}
  return typeof window !== 'undefined' && window.innerWidth < 900 ? 'panel' : 'abajo'
}
export function guardarModoTablero(m) { try { localStorage.setItem(CLAVE, m) } catch {} }

// Alto del tablero abajo, en % de la pantalla. 60 por defecto para que se vea el cálculo completo sin scrollear;
// el borde de arriba se arrastra para achicarlo o agrandarlo, y el alto queda guardado en el navegador.
const ALTO_CLAVE = 'sid-g4-tablero-alto'
const ALTO_INICIAL = 60
const ALTO_MIN = 20
const ALTO_MAX = 90
export function altoTablero() { try { const a = Number(localStorage.getItem(ALTO_CLAVE)); if (a >= ALTO_MIN && a <= ALTO_MAX) return a } catch {} return ALTO_INICIAL }
function guardarAlto(a) { try { localStorage.setItem(ALTO_CLAVE, String(a)) } catch {} }

const E = {
  tablero: { position: 'fixed', left: 12, right: 354, bottom: 12, zIndex: 1190, background: 'linear-gradient(180deg, rgba(20,27,40,0.98), rgba(12,17,27,0.99))', color: '#e8edf5', border: '1px solid #8a6d1f', borderRadius: 10, boxShadow: '0 -4px 30px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', maxHeight: '30vh', font: '13px/1.4 Arial, sans-serif' },
  cabecera: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: '1px solid #34405a' },
  titulo: { flex: 1, font: '700 13px/1 Arial', letterSpacing: '.08em', color: '#e0b84a' },
  btn: { background: '#0e1320', color: '#cdd8e8', border: '1px solid #34405a', borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 12 },
  cuerpo: { overflowY: 'auto', padding: 12, display: 'grid', gap: 14, alignItems: 'start', zoom: 1.06 },
  pie: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '8px 12px', borderTop: '1px solid #34405a' },
  nota: { fontSize: 11, color: '#cfe0f2', background: '#16233a', border: '1px solid #2f6df0', borderRadius: 6, padding: '7px 9px', lineHeight: 1.45, display: 'flex', flexDirection: 'column', gap: 6 },
  carta: { background: '#141b29', border: '1px solid #23304a', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0, overflowX: 'auto' },
  agarre: { flex: '0 0 auto', height: 12, cursor: 'ns-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', borderBottom: '1px solid #34405a' },
  agarreRaya: { width: 44, height: 4, borderRadius: 2, background: '#8a6d1f' },
}

// Arrastrar el borde de arriba del tablero para cambiar su alto (en % de la pantalla, entre ALTO_MIN y ALTO_MAX).
// Mueve el DOM directo mientras se arrastra y guarda el valor al soltar; el render lo vuelve a leer de ahí.
function arrastrarAlto(ev) {
  ev.preventDefault()
  const caja = ev.currentTarget.parentElement
  const y0 = ev.clientY
  const a0 = parseFloat(caja.style.maxHeight) || ALTO_INICIAL
  let a = a0
  const mover = (e) => {
    a = Math.min(ALTO_MAX, Math.max(ALTO_MIN, Math.round(a0 + ((y0 - e.clientY) / window.innerHeight) * 100)))
    caja.style.maxHeight = a + 'vh'
  }
  const soltar = () => {
    guardarAlto(a)
    window.removeEventListener('pointermove', mover)
    window.removeEventListener('pointerup', soltar)
  }
  window.addEventListener('pointermove', mover)
  window.addEventListener('pointerup', soltar)
}
export const tituloSeccion = { font: '700 11px/1.2 Arial', letterSpacing: '.08em', color: '#e0b84a', borderBottom: '1px solid #34405a', paddingBottom: 4 }

const limpio = (xs) => (xs || []).filter((x) => x !== false && x != null && x !== '')

// Dónde termina el panel de la izquierda (la Mesa del Estado Mayor), si está a la vista.
function bordePanelIzq() {
  if (typeof document === 'undefined') return 4
  const r = document.querySelector('aside.panel')?.getBoundingClientRect()
  return r && r.width > 0 && r.right > 0 && r.left < 40 && r.right < window.innerWidth / 2 ? Math.round(r.right) : 4
}

// cabeza: queda siempre en el panel. cuerpo: va abajo, en grande. pie: en el panel y, si pieAbajo, también abajo.
export function tablero({ f, portal, trazando = false, modo = 'panel', onModo, titulo, columnas = 'repeat(auto-fit, minmax(330px, 1fr))', cabeza = [], cuerpo = [], pie = [], pieAbajo = false }) {
  const ir = (m) => () => { guardarModoTablero(m); onModo?.(m) }
  if (modo === 'panel') {
    return f.jsxs(f.Fragment, { children: [...limpio(cabeza), f.jsx('button', { style: E.btn, onClick: ir('abajo'), title: 'Abrir esto en grande, en el espacio de abajo de la pantalla', children: '⤢ Abrir en grande abajo' }), ...limpio(cuerpo), ...limpio(pie)] })
  }
  // Mientras se traza en la carta (ASDI, ARCE, áreas A/B, EPA/EPE) se corre a la derecha, en una columna donde
  // está el panel, para dejar la carta libre; es el mismo elemento (no se rehace: el paso abierto sigue abierto).
  const mini = modo === 'mini' && !trazando
  // Abajo: la mitad de alto (30vh, lo pidió Sergio el 21-10-2026: «me tapa toda la vista de la carta») y
  // empezando donde termina el panel de la izquierda, para no taparlo.
  const estilo = trazando ? { ...E.tablero, left: 'auto', right: 12, top: 56, bottom: 'auto', width: 380, maxHeight: 'calc(100vh - 80px)', zIndex: 1210 } : { ...E.tablero, left: bordePanelIzq() + 8, maxHeight: altoTablero() + 'vh' }
  const caja = f.jsxs('div', { style: estilo, 'data-g4-tablero': titulo, children: [
    !trazando && !mini && f.jsx('div', { style: E.agarre, title: 'Arrastrá este borde para agrandar o achicar el tablero', onPointerDown: arrastrarAlto, children: f.jsx('span', { style: E.agarreRaya }) }),
    f.jsxs('div', { style: E.cabecera, children: [
      f.jsx('span', { style: E.titulo, children: titulo }),
      !trazando && f.jsx('button', { style: E.btn, onClick: ir(mini ? 'abajo' : 'mini'), title: mini ? 'Volver a abrirlo' : 'Achicarlo para ver la carta (por ejemplo, para trazar)', children: mini ? '▴ Agrandar' : '▾ Achicar' }),
      f.jsx('button', { style: E.btn, onClick: ir('panel'), title: 'Volver a ponerlo en el panel de la derecha', children: '↗ Al panel' }),
    ] }),
    !mini && f.jsx('div', { style: { ...E.cuerpo, gridTemplateColumns: trazando ? 'minmax(0, 1fr)' : columnas }, children: limpio(cuerpo) }),
    !mini && pieAbajo && limpio(pie).length > 0 && f.jsx('div', { style: E.pie, children: limpio(pie) }),
  ] })
  return f.jsxs(f.Fragment, { children: [
    ...limpio(cabeza),
    f.jsxs('div', { style: E.nota, children: [
      f.jsx('span', { children: trazando ? '→ Mientras trazás en la carta está a la derecha; vuelve abajo al terminar.' : mini ? '▾ Está achicado abajo: agrandalo cuando termines de trazar.' : '⤢ Está abierto en grande, abajo de la pantalla.' }),
      f.jsx('button', { style: E.btn, onClick: ir('panel'), children: '↗ Traerlo al panel' }),
    ] }),
    ...limpio(pie),
    // al <body>: dentro del panel, `position: fixed` queda atrapado en el ancho del panel
    portal && typeof document !== 'undefined' ? portal(caja, document.body) : caja,
  ] })
}

// Un número con su rótulo, como función (no como componente) para que el cursor no se pierda al escribir.
function campo(f, fn, { rot, valor, onCambio, ancho = 62, sufijo, paso, titulo }) {
  return f.jsxs('label', { style: fn.campo, title: titulo, children: [
    f.jsx('span', { children: rot }),
    f.jsxs('span', { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [
      f.jsx('input', { type: 'number', min: 0, step: paso, value: valor ?? '', onChange: (e) => onCambio(e.target.value === '' ? '' : Number(e.target.value)), style: { ...fn.inp, width: ancho } }),
      sufijo && f.jsx('span', { style: { fontSize: 10, color: '#8fa6bd' }, children: sufijo }),
    ] }),
  ] })
}

export function reabastecimientoUI({ f, fn, plan, val, onVal, racion }) {
  const set = (k) => (v) => onVal((o) => ({ ...o, [k]: v }))
  const MAXF = 15
  const filas = plan.filas.slice(0, MAXF)
  const th = (t) => f.jsx('th', { style: fn.th, children: t })
  const td = (t, der) => f.jsx('td', { style: { ...fn.td, ...(der ? { textAlign: 'right' } : {}) }, children: t })
  return f.jsxs('div', { style: { ...E.carta, gridColumn: '1 / -1' }, 'data-calc': 'reab', children: [
    f.jsx('div', { style: tituloSeccion, children: '🚚 REABASTECIMIENTO — ¿CADA CUÁNTO Y CON QUÉ VEHÍCULOS?' }),
    f.jsxs('div', { style: { ...fn.fila, alignItems: 'flex-end' }, children: [
      campo(f, fn, { rot: 'Reabastecer cada', valor: val.ciclo, onCambio: set('ciclo'), ancho: 50, sufijo: 'días' }),
      campo(f, fn, { rot: 'Camiones de carga', valor: val.camiones, onCambio: set('camiones'), ancho: 54 }),
      campo(f, fn, { rot: 'Carga por camión', valor: val.cargaT, onCambio: set('cargaT'), ancho: 50, sufijo: 't', paso: 0.5 }),
      campo(f, fn, { rot: 'Peso de 1 ración', valor: val.kgRacion ?? KG_RACION[racion] ?? 1.5, onCambio: set('kgRacion'), ancho: 50, sufijo: 'kg', paso: 0.1, titulo: 'Referencia con el embalaje; corregila con el dato de tu unidad' }),
      campo(f, fn, { rot: 'Cisternas Cl III', valor: val.cisternas, onCambio: set('cisternas'), ancho: 50 }),
      campo(f, fn, { rot: 'Litros por cisterna', valor: val.litrosCisterna, onCambio: set('litrosCisterna'), ancho: 64, sufijo: 'L' }),
      campo(f, fn, { rot: 'Distancia al punto de abast.', valor: val.distKm, onCambio: set('distKm'), ancho: 54, sufijo: 'km' }),
      campo(f, fn, { rot: 'Velocidad de marcha', valor: val.velKmH, onCambio: set('velKmH'), ancho: 50, sufijo: 'km/h' }),
      campo(f, fn, { rot: 'Carga y descarga', valor: val.horasCarga, onCambio: set('horasCarga'), ancho: 50, sufijo: 'h', paso: 0.5 }),
    ] }),
    f.jsx('div', { style: { overflowX: 'auto' }, children: f.jsxs('table', { style: { ...fn.tabla, width: '100%' }, children: [
      f.jsx('thead', { children: f.jsxs('tr', { children: [th('N°'), th('Días'), th('Raciones'), th('Agua (L)'), th('Cl III (L)'), th('Cl V (proy.)')] }) }),
      f.jsxs('tbody', { children: [
        ...filas.map((r) => f.jsxs('tr', { children: [td(r.n), td(r.dias > 1 ? `${dia(r.desde)} a ${dia(r.hasta)}` : dia(r.desde)), td(ent(r.raciones), 1), td(ent(r.agua), 1), td(ent(r.cl3), 1), td(ent(r.cl5), 1)] }, r.n)),
        plan.filas.length > MAXF && f.jsx('tr', { children: f.jsx('td', { colSpan: 6, style: fn.td, children: `… y ${plan.filas.length - MAXF} reabastecimiento(s) más, iguales.` }) }, 'mas'),
      ] }),
    ] }) }),
    f.jsxs('div', { style: fn.desarrollo, children: [f.jsx('div', { style: { fontSize: 9, letterSpacing: 1, color: '#8fa6bd', marginBottom: 3 }, children: 'DESARROLLO' }), ...plan.pasos.map((p, i) => f.jsx('div', { style: { marginBottom: 2 }, children: p }, i))] }),
    f.jsx('div', { style: { ...fn.veredicto, background: plan.alcanza ? '#16261f' : '#2a1618', color: plan.alcanza ? '#9fe8a0' : '#ff9f9f' }, children: plan.alcanza
      ? `✅ Con estos medios se reabastece cada ${plan.ciclo} día(s): ${plan.vueltasMax} vuelta(s) de ${plan.horasVuelta.toLocaleString('es', { maximumFractionDigits: 1 })} h, dentro de las ${plan.horasCiclo} h del ciclo.`
      : '⛔ Con estos medios NO se llega a reabastecer en el ciclo elegido.' }),
    ...plan.avisos.map((a, i) => f.jsx('div', { style: fn.aviso, children: '⚠️ ' + a }, 'a' + i)),
  ] })
}

export function encabezadoUI({ f, fn, auto, val, onVal }) {
  const fila = (k, rot, ph) => f.jsxs('label', { style: fn.campoCol, children: [
    f.jsx('span', { children: rot }),
    f.jsx('input', { value: val[k] ?? auto[k] ?? '', placeholder: ph, onChange: (e) => onVal((o) => ({ ...o, [k]: e.target.value })), style: fn.inp }),
  ] })
  return f.jsxs('div', { style: E.carta, 'data-calc': 'encabezado', children: [
    f.jsx('div', { style: tituloSeccion, children: '📄 ENCABEZADO DEL WORD' }),
    fila('objeto', 'OBJETO', 'Sección IV Logística en Apoyo a las Operaciones … del …'),
    fila('cartas', 'CARTAS', 'la carta de la Orden: nombre, escala y edición'),
    fila('anexos', 'ANEXOS', 'S/A'),
  ] })
}

// ── 4. El Word: la sección de reabastecimiento ─────────────────────────────────────────────────────

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export function htmlReabastecimiento(plan) {
  if (!plan) return ''
  const tabla = (cab, filas) => `<table><tr>${cab.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>` + filas.map((r) => `<tr>${r.map((c, j) => `<td${j > 1 ? ' class="n"' : ''}>${c}</td>`).join('')}</tr>`).join('') + '</table>'
  return `<h2>REABASTECIMIENTO</h2>
<ul class="pasos">${plan.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
${tabla(['N°', 'Días', 'Raciones', 'Agua (L)', 'Cl III (L)', 'Cl V (proy.)'], plan.filas.map((r) => [r.n, r.dias > 1 ? `${dia(r.desde)} a ${dia(r.hasta)}` : dia(r.desde), ent(r.raciones), ent(r.agua), ent(r.cl3), ent(r.cl5)]))}
<p>${plan.alcanza ? `Con los medios previstos se reabastece cada ${plan.ciclo} día(s): ${plan.vueltasMax} vuelta(s) de ${esc(plan.horasVuelta.toLocaleString('es', { maximumFractionDigits: 1 }))} h dentro de las ${plan.horasCiclo} h del ciclo.` : '<b>Con los medios previstos NO se llega a reabastecer en el ciclo elegido.</b>'}</p>
${plan.avisos.map((a) => `<p class="nota">${esc(a)}</p>`).join('\n')}`
}

// ── 5. Clase III: copiar la última jornada hasta cubrir los días de la operación ───────────────────
export function completarJornadas(filas = [], dias = 1) {
  if (!filas.length) return filas
  const D = Math.max(1, Math.round(pos(dias, 1)))
  const out = [...filas]
  const base = filas[filas.length - 1]
  for (let k = diasJornadas(out); k < D && out.length < 400; k++) out.push({ ...base, sinMD: false, nombre: `D + ${k - 1}` })
  return out
}

export const cartaEstilo = E.carta
