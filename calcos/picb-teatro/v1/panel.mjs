// 🌎 PICB DEL TEATRO (FF.TT.T.O.) — el panel y las capas en la carta. Código aparte del compilado.
//
// Se enciende SÓLO cuando el ejercicio es de nivel teatro (unidad considerada FF.TT.T.O., o trae el
// TO / los subteatros): aparece la pestaña «🌎 PICB TEATRO» a la derecha. En un ejercicio de CE o de
// DIV no aparece nada y no se dibuja nada.
//
// Qué toma de la Mesa (sólo lectura): la foto del ejercicio (window.SIDMesaEjercicio.foto(): áreas,
// fichas, unidad considerada) y la carta 2D (window.__mapa2d). Qué escribe: lo suyo, en
// `resultados.picbTeatro` (con window.__SIDECEME_IMPORT_STATE.setResultados): se guarda con el
// ejercicio y viaja con él (también al Juego de Guerra). Para que «⚡ Generar calcos» no lo borre,
// envuelve `SIDECEME_IMPORTAR_GE.preservarImportados`. Si algo falla, la Mesa sigue igual.
import * as M from './modelo.mjs'
import * as A from './analisis.mjs'
import { armarRed } from './red.mjs'
import * as D from './doctrina.mjs'

const VERSION_DATOS = '20261109'
const VERSION_PANEL = '20261114b' // 14-11-2026 b: verFase, para imprimir las FASES ROJO una hoja por fase · 14-11-2026: plantilla doctrinal, CAE por fases, prompt para la IA
const DATOS = new URL(`./datos/teatro-base.json?v=${VERSION_DATOS}`, import.meta.url).href
const LECTOR_KMZ = new URL('../../areas-operaciones/abrir-kmz.mjs?v=cae20261114', import.meta.url).href
const CLAVE = 'picbTeatro'
const LS = 'sid_picb_teatro_v1'

const S = {
  abierto: false, min: false, paso: 1, nombre: '', firma: '', nivel: { teatro: false },
  foto: null, base: null, cargando: null, error: '', red: null,
  areas: [], resumen: null, unidades: { enemigas: [], propias: [] }, g: {},
  ai: null, capas: null, analisis: [], nudos: [], ains: [], prc: [], cae: null, efectos: null,
  modelo: null, caes: null, vista: null, caeVisto: 'probable', faseVista: null,
  ver: { comunicaciones: true, poblaciones: true, obstaculos: true, efectos: true, enemigo: true, mascara: true, fases: true },
  aviso: '',
}
try { Object.assign(S.ver, JSON.parse(localStorage.getItem(LS) || '{}').ver || {}) } catch (e) {}
const recordarVer = () => { try { localStorage.setItem(LS, JSON.stringify({ ver: S.ver })) } catch (e) {} }

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const hook = () => window.__SIDECEME_IMPORT_STATE
const fotoMesa = () => { try { return window.SIDMesaEjercicio?.foto?.() || null } catch (e) { return null } }
const colorDeop = (n) => A.COLOR_DEOP[(n - 1) % A.COLOR_DEOP.length]

// ── el puente con MesaAcademica (para agregar GG.UU. del KMZ al ejercicio, con su ↶ Deshacer) ──
let puente = null
function engancharPuente() {
  const Ma = window.MesaAcademica
  if (!Ma || typeof Ma.sincronizar !== 'function') return false
  if (Ma.__sidptPuente) return true
  const orig = Ma.sincronizar
  Ma.sincronizar = function (p) { if (p && typeof p.agregarUnidades === 'function') puente = p; return orig.apply(this, arguments) }
  Ma.__sidptPuente = true
  return true
}
// «⚡ Generar calcos» rehace `resultados` desde cero: lo del teatro pasa igual.
function engancharPreservar() {
  const GE = window.SIDECEME_IMPORTAR_GE
  if (!GE || typeof GE.preservarImportados !== 'function') return false
  if (GE.preservarImportados.__sidpt) return true
  const orig = GE.preservarImportados
  const envuelta = function (nuevo, anterior) {
    const r = orig.apply(this, arguments) || nuevo
    if (anterior && anterior[CLAVE] && r && typeof r === 'object' && !r[CLAVE]) return { ...r, [CLAVE]: anterior[CLAVE] }
    return r
  }
  envuelta.__sidpt = true
  GE.preservarImportados = envuelta
  return true
}

// ── lo guardado en el ejercicio ──
let tGuardar = null
function guardar(cambios) {
  S.g = { ...S.g, ...cambios, v: 1 }
  clearTimeout(tGuardar)
  tGuardar = setTimeout(() => {
    const h = hook()
    if (!h || typeof h.setResultados !== 'function') { S.aviso = 'La Mesa todavía no está lista para guardar: se guarda en cuanto lo esté.'; return }
    const valor = { ...S.g, actualizado: new Date().toISOString() }
    S.g = valor
    tGuardar = null
    h.setResultados((prev) => ({ ...(prev || {}), [CLAVE]: valor }))
  }, 500)
}

// ── la carga del archivo de datos del teatro ──
function cargarBase() {
  if (S.base || S.cargando) return S.cargando
  S.cargando = fetch(DATOS).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    .then((j) => { S.base = M.abrirBase(j); S.red = armarRed(S.base.vias); S.error = ''; recalcular(); pintar(); dibujar() })
    .catch((e) => { S.error = 'No se pudo cargar la carta del teatro (' + (e.message || e) + '). Revisá la conexión y volvé a abrir el panel.'; S.cargando = null; pintar() })
  return S.cargando
}

// ── lo que se calcula ──
function recalcular() {
  const f = S.foto || {}
  S.nivel = M.nivelDelEjercicio(f)
  const propias = M.areasDelEjercicio(f)
  // Si el ejercicio no trae el TO pero el KMZ cargado acá sí, se usa el del KMZ (sólo para este análisis).
  S.areas = propias.some((a) => a.tipo === 'teatro' || a.tipo === 'subteatro') ? propias
    : [...propias, ...((S.g.teatro && S.g.teatro.areas) || []).map((a) => ({ ...a, km2: M.areaKm2(a.anillo) }))]
  S.resumen = M.resumenTeatro(S.areas)
  S.unidades = M.unidadesDelEjercicio(f)
  const teatro = S.g.teatro || { deop: [], ejes: [], origenes: [] }
  const auto = M.areaDeInteres({ areas: S.areas, unidades: S.unidades, teatro, margenKm: Number(S.g.margenKm) || 40 })
  S.ai = S.g.aiFijo && S.g.ai ? { anillo: S.g.ai, km2: M.areaKm2(S.g.ai), fuera: auto.fuera } : auto
  if (!S.base) return
  S.capas = M.recortarBase(S.base, S.ai.anillo)
  S.analisis = (teatro.deop || []).map((d) => A.analizarDeop(d, S.red, S.unidades, { ritmo: (S.g.ritmos || {})[d.n] }))
  S.nudos = A.nudos(S.red, S.capas, S.ai.anillo)
  S.ains = A.ainsDelTeatro(S.analisis)
  S.prc = A.prcPorDeop(S.analisis, S.g.poderes || {})
  S.cae = S.analisis.length ? A.caeOperacionales(S.analisis, S.prc, S.unidades, S.capas, { objetivo: S.g.objetivo || '' }) : null
  S.efectos = A.resumenEfectos(S.capas, S.red, S.ai.anillo)
  // 14-11-2026: pasos 3 y 4 a fondo (doctrina.mjs). Si algo falla ahí, el resto del panel sigue.
  const ctxD = { analisis: S.analisis, prc: S.prc, cae: S.cae, unidades: S.unidades, ains: S.ains, nudos: S.nudos, capas: S.capas, teatro, fuera: S.ai?.fuera || [], cruce: cruceDe(), objetivo: S.g.objetivo || '' }
  try { S.modelo = S.analisis.length ? D.modeloAmenaza(ctxD) : null; S.caes = S.analisis.length ? D.caePorFases(ctxD) : null } catch (e) { console.warn('PICB Teatro · doctrina:', e); S.modelo = null; S.caes = null }
  S.vista = D.vista(S.modelo, S.caes, S.g.ia?.datos || null)
}
const cruceDe = () => (Number(S.g.cruce) >= 0 && S.g.cruce !== '' && S.g.cruce != null ? Number(S.g.cruce) : 5)

// ── seguir al ejercicio (cada 2 s) ──
function firmaDe(f) {
  if (!f) return ''
  const o = f.ops || {}
  const areas = [o.areaOps, ...(o.areasOps || [])].filter(Boolean).map((a) => `${a.id}|${a.nombre}|${(a.coords || []).length}`).join(';')
  const u = (f.unidades || []).map((x) => `${x.designacion}|${x.bando}|${x.escalon}|${Number(x.lat).toFixed(3)}|${Number(x.lng).toFixed(3)}`).join(';')
  return [f.nombre, areas, u, o.unidadConsiderada?.nombre, f.ordenSup?.unidad, f.resultados?.[CLAVE]?.actualizado || ''].join('#')
}
function seguir() {
  const f = fotoMesa()
  const firma = firmaDe(f)
  if (firma === S.firma) return
  const otroEjercicio = (f?.nombre || '') !== S.nombre
  S.firma = firma; S.foto = f; S.nombre = f?.nombre || ''
  if (otroEjercicio) S.yaEncuadrado = false
  const guardado = f?.resultados?.[CLAVE]
  if (otroEjercicio || (guardado && guardado.actualizado !== S.g.actualizado && !tGuardar)) S.g = guardado ? { ...guardado } : {}
  recalcular()
  boton()
  if (!S.nivel.teatro) { if (S.abierto) cerrar(); return }
  if (S.abierto) { pintar(); dibujar() }
}

// ═══════════════════════════════ LA CARTA ═══════════════════════════════
const PANES = { sidptFondo: 352, sidptMascara: 356, sidptRed: 412, sidptDeop: 424, sidptRotulos: 594 }
let mapa = null, capas = {}, rotulos = [], zoomHook = null
function prepararMapa() {
  const m = window.__mapa2d, L = window.L
  if (!m || !L) return null
  if (mapa !== m) {
    mapa = m
    for (const [n, z] of Object.entries(PANES)) { if (!m.getPane(n)) { const p = m.createPane(n); p.style.zIndex = z; if (n !== 'sidptRotulos') p.style.pointerEvents = 'none' } }
    zoomHook = () => visibilidadPorZoom()
    m.on('zoomend', zoomHook)
  }
  return m
}
function quitarCapas() {
  for (const k of Object.keys(capas)) { try { capas[k].remove() } catch (e) {} }
  capas = {}; rotulos = []
}
const ll = (c) => c.map((p) => [p[1], p[0]])
function grupo(nombre) { const g = window.L.layerGroup(); capas[nombre] = g; return g }
function rotulo(g, p, html, clase, zMin = 0, zMax = 30, titulo = '') {
  const L = window.L
  // bubblingMouseEvents: un clic sobre un rótulo llega igual a la carta (las herramientas de la Mesa siguen andando)
  const mk = L.marker([p[1], p[0]], { pane: 'sidptRotulos', interactive: !!titulo, bubblingMouseEvents: true, keyboard: false, icon: L.divIcon({ className: '', html: `<div class="sidpt-lbl ${clase}">${html}</div>`, iconSize: [0, 0] }) })
  if (titulo) mk.bindTooltip(titulo, { className: 'sidpt-tt', direction: 'top' })
  mk.__z = [zMin, zMax]
  g.addLayer(mk); rotulos.push(mk)
  return mk
}
function visibilidadPorZoom() {
  if (!mapa) return
  const z = mapa.getZoom()
  for (const mk of rotulos) {
    const el = mk.getElement && mk.getElement()
    if (el) el.style.display = z >= mk.__z[0] && z <= mk.__z[1] ? '' : 'none'
  }
  for (const [k, g] of Object.entries(capas)) {
    if (!g.__zMin) continue
    const ver = z >= g.__zMin
    if (ver && !mapa.hasLayer(g) && g.__quiere) g.addTo(mapa)
    if (!ver && mapa.hasLayer(g)) g.remove()
  }
}
function conZoom(g, zMin) { g.__zMin = zMin; g.__quiere = true; return g }

// Lo que cambia el dibujo (no la posición de cada ficha: esas las dibuja la Mesa).
function firmaDibujo() {
  return JSON.stringify([S.abierto, S.nivel.teatro, !!S.capas, S.paso === 4, S.ver, S.ai?.anillo?.length, S.ai?.anillo?.[0],
    S.analisis.map((a) => [a.n, Math.round(a.kmRuta), a.ritmo, a.puntos.length]), S.ains.length, S.nudos.map((n) => n.nombre),
    (S.g.teatro?.deop || []).length, (S.g.teatro?.ejes || []).length, S.unidades.enemigas.length, S.unidades.propias.length,
    S.ver.fases, S.caeVisto, S.faseVista, S.g.cruce, !!S.g.ia, S.g.ia?.cuando, S.paso])
}
let ultimaFirmaDibujo = ''
function dibujar(forzar = false) {
  const t0 = performance.now()
  const m = prepararMapa()
  if (!m) return
  const fd = firmaDibujo()
  if (!forzar && fd === ultimaFirmaDibujo && Object.keys(capas).length) return
  ultimaFirmaDibujo = fd
  quitarCapas()
  if ((!S.abierto && S.faseVista === null) || !S.nivel.teatro || !S.capas) return   // 🖨️ con faseVista dibuja aunque el panel esté cerrado
  const L = window.L, C = S.capas
  const lienzo = (pane) => L.canvas({ pane, padding: 0.4 })
  const rFondo = lienzo('sidptFondo'), rMasc = lienzo('sidptMascara'), rRed = lienzo('sidptRed'), rDeop = lienzo('sidptDeop')
  const pol = (lista) => lista.map((p) => p.map(ll))

  // máscara fuera del Área de Interés
  if (S.ver.mascara && S.ai?.anillo) {
    const g = grupo('mascara')
    g.addLayer(L.polygon([[[-89, -179], [-89, 179], [89, 179], [89, -179]], ll(S.ai.anillo)], { renderer: rMasc, stroke: false, fillColor: '#0a1016', fillOpacity: 0.28, interactive: false }))
    g.addLayer(L.polyline(ll(S.ai.anillo), { renderer: rMasc, color: '#e7c46a', weight: 2, dashArray: '10 6', opacity: 0.95, interactive: false }))
    g.addTo(m)
  }
  // países: el del enemigo, teñido
  const enemigoPais = paisDe(S.unidades.enemigas), propioPais = paisDe(S.unidades.propias)
  {
    const g = grupo('paises')
    for (const [nom, iso, partes] of C.paises || []) {
      if (iso === enemigoPais && iso !== propioPais) g.addLayer(L.polygon(pol(partes), { renderer: rFondo, stroke: false, fillColor: '#d33a2c', fillOpacity: 0.07, interactive: false }))
      const caja = M.cajaDe(partes.map((p) => p[0]))
      const c = etiquetaPais(nom, caja)
      if (c) rotulo(g, c, esc(nom.toUpperCase()), `pais ${iso === enemigoPais && iso !== propioPais ? 'en' : ''}`, 5, 8)
    }
    g.addTo(m)
  }
  // En el paso 4 manda el calco del enemigo: lo demás va de fondo, apagado.
  const enEnemigo = S.paso === 4 && S.ver.enemigo && S.analisis.length > 0
  const marca = (g, p, html, zMin) => { const mk = L.marker([p[1], p[0]], { pane: 'sidptRotulos', interactive: false, keyboard: false, icon: L.divIcon({ className: '', html, iconSize: [0, 0] }) }); mk.__z = [zMin, 30]; g.addLayer(mk); rotulos.push(mk) }
  // ⛰️ grandes obstáculos
  if (S.ver.obstaculos) {
    const g = grupo('obstaculos')
    const r1 = (C.relieve.find((r) => r[0] === 1) || [0, []])[1], r2 = (C.relieve.find((r) => r[0] === 2) || [0, []])[1]
    if (r1.length) g.addLayer(L.polygon(pol(r1), { renderer: rFondo, stroke: false, fillColor: '#b07a3c', fillOpacity: enEnemigo ? 0.06 : 0.13, interactive: false }))
    if (r2.length) g.addLayer(L.polygon(pol(r2), { renderer: rFondo, color: '#5c2f12', weight: 0.5, opacity: enEnemigo ? 0.2 : 0.45, fillColor: '#6b3a1f', fillOpacity: enEnemigo ? 0.13 : 0.27, interactive: false }))
    for (const [nom, partes] of C.salares) {
      g.addLayer(L.polygon(pol(partes), { renderer: rFondo, color: '#7f9cb8', weight: 1.2, dashArray: '3 3', fillColor: '#f6f8fa', fillOpacity: 0.86, interactive: false }))
      const k = M.cajaDe(partes.map((q) => q[0])); rotulo(g, [(k[0] + k[2]) / 2, (k[1] + k[3]) / 2], esc(nom), 'salar', 6)
    }
    for (const [nom, partes] of C.lagos) {
      g.addLayer(L.polygon(pol(partes), { renderer: rFondo, color: '#2f6fb0', weight: 1, fillColor: '#4a90d9', fillOpacity: 0.6, interactive: false }))
      if (nom) { const k = M.cajaDe(partes.map((q) => q[0])); rotulo(g, [(k[0] + k[2]) / 2, (k[1] + k[3]) / 2], esc(nom), 'salar', 7) }
    }
    if (C.rios.length) g.addLayer(L.polyline(C.rios.map((r) => ll(r[1])), { renderer: rRed, color: '#2f7fd0', weight: enEnemigo ? 1 : 1.5, opacity: enEnemigo ? 0.6 : 0.9, interactive: false }))
    if (!enEnemigo) for (const v of C.volcanes) {
      marca(g, [v[2], v[3]], '<div class="sidpt-ico" style="color:#6b3a1f">▲</div>', 7.5)
      rotulo(g, [v[2], v[3]], `${esc(v[0])} <small>${v[1].toLocaleString('es-BO')} m</small>`, 'volcan', 8.5)
    }
    for (const r of C.regiones) rotulo(g, [r[1], r[2]], esc(r[0]), 'reg', 5, 8)
    g.addTo(m)
  }
  // fronteras
  { const g = grupo('fronteras'); if (C.fronteras.length) g.addLayer(L.polyline(C.fronteras.map(ll), { renderer: rRed, color: '#6b2c91', weight: 2.4, dashArray: '12 4 3 4', opacity: 0.95, interactive: false })); g.addTo(m) }
  // 🛣️ comunicaciones
  if (S.ver.comunicaciones) {
    const g = grupo('comunicaciones')
    const porClase = (c) => C.vias.filter((v) => v[0] === c).map((v) => ll(v[3]))
    const c1 = porClase(1), c2 = porClase(2)
    const fa = C.ffcc.filter((f) => f[0] === 'activo').map((f) => ll(f[2])), fd = C.ffcc.filter((f) => f[0] !== 'activo').map((f) => ll(f[2]))
    if (enEnemigo) {
      if (c2.length) g.addLayer(L.polyline(c2, { renderer: rRed, color: '#8d8d8d', weight: 1.5, opacity: 0.9, interactive: false }))
      if (c1.length) g.addLayer(L.polyline(c1, { renderer: rRed, color: '#5b5b5b', weight: 2.3, opacity: 0.9, interactive: false }))
      if (fa.length) g.addLayer(L.polyline(fa, { renderer: rRed, color: '#333', weight: 1.4, dashArray: '5 4', opacity: 0.8, interactive: false }))
    } else {
      const c3 = porClase(3)
      if (c3.length) { const g3 = grupo('secundarias'); g3.addLayer(L.polyline(c3, { renderer: rRed, color: '#e2b52b', weight: 1.7, opacity: 0.95, interactive: false })); conZoom(g3, 7.5) }
      if (c2.length) { g.addLayer(L.polyline(c2, { renderer: rRed, color: '#6b3b00', weight: 4, opacity: 0.85, interactive: false })); g.addLayer(L.polyline(c2, { renderer: rRed, color: '#ff9500', weight: 2.4, interactive: false })) }
      if (c1.length) { g.addLayer(L.polyline(c1, { renderer: rRed, color: '#5a0b0b', weight: 5, opacity: 0.85, interactive: false })); g.addLayer(L.polyline(c1, { renderer: rRed, color: '#ff3b30', weight: 3.2, interactive: false })) }
      if (fd.length) g.addLayer(L.polyline(fd, { renderer: rRed, color: '#555', weight: 1.6, dashArray: '4 5', interactive: false }))
      if (fa.length) { g.addLayer(L.polyline(fa, { renderer: rRed, color: '#1a1a1a', weight: 3, interactive: false })); g.addLayer(L.polyline(fa, { renderer: rRed, color: '#fff', weight: 1.4, dashArray: '7 7', interactive: false })) }
      // rótulo de ruta en las troncales y primarias largas
      const puestos = []
      for (const v of C.vias) {
        if (v[0] > 2 || !v[1] || M.largoKm(v[3]) < 25) continue
        const mid = v[3][Math.floor(v[3].length / 2)]
        if (puestos.some((q) => q[0] === v[1] && M.distKm(q[1], mid) < 70)) continue
        puestos.push([v[1], mid])
        marca(g, mid, `<div class="sidpt-ref">${esc(v[1].split(';')[0])}</div>`, 7.5)
      }
    }
    for (const a of C.aerodromos) if (!enEnemigo || a[2] === 1) rotulo(g, [a[3], a[4]], `✈ ${esc(a[1])}`, 'aero', a[2] === 1 ? 6.5 : a[2] === 2 ? 8 : 9.5, 30, `${a[0]} (${a[1]})`)
    for (const q of C.pasos) {
      g.addLayer(L.circleMarker([q[3], q[2]], { renderer: rDeop, radius: enEnemigo ? 3.5 : 5, color: '#111', weight: 1.5, fillColor: '#ffd400', fillOpacity: 1, interactive: false }))
      if (!enEnemigo) rotulo(g, [q[2], q[3]], esc(q[0]), 'paso', 7.5)
    }
    g.addTo(m)
    // las terciarias, sólo de cerca
    const c4 = porClase(4)
    if (c4.length) { const g4 = grupo('terciarias'); g4.addLayer(L.polyline(c4, { renderer: rRed, color: '#9b9b9b', weight: 1, opacity: 0.9, interactive: false })); conZoom(g4, 9) }
  }
  // 🏘️ poblaciones
  if (S.ver.poblaciones) {
    const g = grupo('poblaciones')
    const R = { 1: [6.5, '#fff', 2.4], 2: [5, '#fff', 2], 3: [3.6, '#333', 1.2], 4: [2.6, '#555', 1] }
    const Z = { 1: 5, 2: 6.3, 3: 8, 4: 9 }
    for (const q of C.poblaciones) {
      if (q[1] > (enEnemigo ? 2 : 4)) continue
      const [r, fill, w] = R[q[1]]
      g.addLayer(L.circleMarker([q[3], q[2]], { renderer: rDeop, radius: r, color: '#111', weight: w, fillColor: fill, fillOpacity: 1, interactive: false }))
      rotulo(g, [q[2], q[3]], esc(q[0]), `r${q[1]}`, Z[q[1]], 30, q[4] ? `${q[0]} · ${M.RANGO_POBLACION[q[1]]} · ${q[4].toLocaleString('es-BO')} hab.` : '')
    }
    g.addTo(m)
    if (!enEnemigo) {
      const g5 = grupo('aldeas')
      for (const q of C.poblaciones) if (q[1] === 5) { g5.addLayer(L.circleMarker([q[3], q[2]], { renderer: rDeop, radius: 2, color: '#444', weight: 1, fillColor: '#999', fillOpacity: 1, interactive: false })); rotulo(g5, [q[2], q[3]], esc(q[0]), 'r5', 10) }
      conZoom(g5, 9.5)
    }
  }
  // 🎯 efectos del teatro: corredores DEOP, nudos, AIN
  if (S.ver.efectos) {
    const g = grupo('efectos')
    for (const d of (S.g.teatro?.deop || [])) if (d.corredor) g.addLayer(L.polygon(ll(d.corredor), { renderer: rFondo, color: colorDeop(d.n), weight: 1.4, opacity: 0.9, fillColor: colorDeop(d.n), fillOpacity: 0.15, interactive: false }))
    for (const n of S.nudos) rotulo(g, [n.lng, n.lat], `★ ${esc(n.nombre)}`, 'nudo r2', 6, 30, `${n.nombre}: ${n.porque}`)
    g.addTo(m)
  }
  // 🔴 calco del enemigo (paso 4): itinerarios sobre la red, D+n, ejes de aproximación y A.I.N.
  if (S.ver.enemigo && S.paso === 4) {
    const g = grupo('enemigo')
    for (const e of (S.g.teatro?.ejes || [])) {
      g.addLayer(L.polyline(ll(e.linea), { renderer: rDeop, color: '#e0443a', weight: 2.6, dashArray: '9 6', opacity: 0.95, interactive: false }))
      flecha(g, e.linea, '#e0443a')
    }
    for (const o of (S.g.teatro?.origenes || [])) {
      g.addLayer(L.circleMarker([o.lat, o.lng], { renderer: rDeop, radius: 4.5, color: '#fff', weight: 1.5, fillColor: '#e0443a', fillOpacity: 1, interactive: false }))
      rotulo(g, [o.lng, o.lat], `${esc(o.nombre)} <small>(origen)</small>`, 'r3', 6)
    }
    for (const a of S.analisis) {
      const c = colorDeop(a.n)
      g.addLayer(L.polyline(ll(a.coords), { renderer: rDeop, color: '#000', weight: 9, opacity: 0.5, interactive: false }))
      g.addLayer(L.polyline(ll(a.coords), { renderer: rDeop, color: '#fff', weight: 6.6, opacity: 1, interactive: false }))
      g.addLayer(L.polyline(ll(a.coords), { renderer: rDeop, color: c, weight: 4.4, opacity: 1, interactive: false }))
      flecha(g, a.coords, c)
      a.puntos.forEach((p, i) => {
        g.addLayer(L.circleMarker([p.lat, p.lng], { renderer: rDeop, radius: 5.5, color: '#fff', weight: 2, fillColor: c, fillOpacity: 1, interactive: false }))
        const mk = L.marker([p.lat, p.lng], { pane: 'sidptRotulos', interactive: false, keyboard: false, icon: L.divIcon({ className: '', html: `<div class="sidpt-dn" style="--c:${c}">${esc(p.nombre.replace(/\s*\((Chile|Bolivia)\)/i, ''))} <small>${i === 0 ? `DEOP ${a.n} · D` : M.fmtDia(p.dia)}</small></div>`, iconSize: [0, 0] }) })
        mk.__z = [i === 0 || i === a.puntos.length - 1 ? 5 : 7, 30]; g.addLayer(mk); rotulos.push(mk)
      })
    }
    for (const a of S.ains) {
      g.addLayer(L.circle([a.lat, a.lng], { renderer: rDeop, radius: 7000, color: '#111', weight: 2.2, dashArray: '6 4', fillColor: '#ffd400', fillOpacity: 0.18, interactive: false }))
      const mk = L.marker([a.lat, a.lng], { pane: 'sidptRotulos', interactive: true, bubblingMouseEvents: true, keyboard: false, icon: L.divIcon({ className: '', html: `<div class="sidpt-ainl">${esc(a.id)}</div>`, iconSize: [0, 0] }) })
      mk.bindTooltip(`<b>${esc(a.id)} ${esc(a.nombre)}</b><br>DEOP ${a.deop.join('/')} · entre ${M.fmtDia(a.net)} y ${M.fmtDia(a.nlt)}<br>${esc(a.indicador)}`, { className: 'sidpt-tt', direction: 'top' })
      mk.__z = [7, 30]; g.addLayer(mk); rotulos.push(mk)
    }
    g.addTo(m)
  }
  // 🧭 CAE por fases (paso 4): las fichas del enemigo al fin de cada fase y el recorrido de cada actor.
  // 🖨️ Con S.faseVista (lo pone verFase, para «Imprimir por fases y capas»): sólo las fichas de ESA fase, visibles a
  // cualquier zoom, y el recorrido de cada actor hasta ella; se dibuja aunque el panel esté en otro paso.
  const fv = Number.isInteger(S.faseVista) ? S.faseVista : null
  if ((S.paso === 4 || fv !== null) && (S.ver.fases || fv !== null) && S.vista?.caes) {
    const c = S.caeVisto === 'peligroso' ? S.vista.caes.peligroso : S.vista.caes.probable
    if (c && c.fases?.length) {
      const g = grupo('fases')
      const porQuien = new Map()
      for (const [i, f] of c.fases.entries()) if (fv === null || i <= fv) for (const a of f.acciones) {
        if (!Number.isFinite(a.lng) || !Number.isFinite(a.lat)) continue
        if (!porQuien.has(a.quien)) porQuien.set(a.quien, { pts: [], papel: a.papel })
        porQuien.get(a.quien).pts.push([a.lng, a.lat])
        if (fv !== null && i !== fv) continue
        const clase = a.papel === 'reserva' ? 'reserva' : a.papel === 'apoyo' ? 'apoyo' : a.papel === 'engaño' ? 'engano' : ''
        const mk = L.marker([a.lat, a.lng], { pane: 'sidptRotulos', interactive: true, bubblingMouseEvents: true, keyboard: false, icon: L.divIcon({ className: '', html: `<div class="sidpt-fch ${clase}">${esc(f.id)} <small>${esc(M.fmtDia(a.dia))}</small> ${esc(a.quien.length > 30 ? a.quien.slice(0, 28) + '…' : a.quien)}</div>`, iconSize: [0, 0] }) })
        mk.bindTooltip(`<b>${esc(c.id)} · ${esc(f.id)} ${esc(f.nombre)}</b><br>${esc(a.quien)} (${esc(a.papel)}${a.deop ? `, DEOP ${a.deop}` : ''})<br>${esc(a.que)}`, { className: 'sidpt-tt', direction: 'top' })
        mk.__z = fv !== null ? [0, 30] : [a.papel === 'reserva' || a.papel === 'esfuerzo principal' ? 5 : 6.5, 30]; g.addLayer(mk); rotulos.push(mk)
      }
      for (const [, q] of porQuien) if (q.pts.length >= 2) g.addLayer(L.polyline(ll(q.pts), { renderer: rDeop, color: q.papel === 'reserva' ? '#8e24aa' : q.papel === 'apoyo' ? '#1e88e5' : '#b71c1c', weight: 2.2, dashArray: '4 6', opacity: 0.9, interactive: false }))
      g.addTo(m)
    }
  }
  visibilidadPorZoom()
  S.msDibujo = Math.round(performance.now() - t0)
}
function flecha(g, coords, color) {
  const L = window.L, n = coords.length
  if (n < 2) return
  const a = coords[n - 2], b = coords[n - 1]
  const ang = (Math.atan2(b[1] - a[1], (b[0] - a[0]) * Math.cos((b[1] * Math.PI) / 180)) * 180) / Math.PI
  const svg = `<svg width="0" height="0" style="transform:rotate(${-ang}deg)"><path d="M -2 -8 L 14 0 L -2 8 Z" fill="${color}" stroke="#fff" stroke-width="1.5"/></svg>`
  g.addLayer(L.marker([b[1], b[0]], { pane: 'sidptDeop', interactive: false, keyboard: false, icon: L.divIcon({ className: 'sidpt-flecha', html: svg, iconSize: [0, 0] }) }))
}
function paisDe(lista) {
  if (!S.base || !lista.length) return ''
  const cuenta = {}
  for (const u of lista) for (const [, iso, partes] of S.base.paises) if (partes.some((p) => M.enPoligono([u.lng, u.lat], p[0]))) { cuenta[iso] = (cuenta[iso] || 0) + 1; break }
  return Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
}
function etiquetaPais(nom, caja) {
  const ai = S.ai?.anillo
  if (!ai) return null
  // el punto del país más hacia adentro del Área de Interés (grilla gruesa)
  let mejor = null
  for (let i = 1; i < 6; i++) for (let j = 1; j < 6; j++) {
    const p = [caja[0] + ((caja[2] - caja[0]) * i) / 6, caja[1] + ((caja[3] - caja[1]) * j) / 6]
    if (!M.enPoligono(p, ai)) continue
    const pais = S.base.paises.find((x) => x[0] === nom)
    if (pais && !pais[2].some((q) => M.enPoligono(p, q[0]))) continue
    if (!mejor) mejor = p
  }
  return mejor
}
function irA(lng, lat, z = 9) { const m = prepararMapa(); if (m) m.setView([lat, lng], Math.max(m.getZoom(), z)) }
function encuadrar(anillo) {
  const m = prepararMapa()
  if (!m || !anillo?.length) return
  // que no quede tapado por la barra de arriba ni por el panel
  const der = S.abierto && !S.min && raiz ? Math.min(raiz.getBoundingClientRect().width + 60, window.innerWidth * 0.45) : 40
  m.fitBounds(window.L.latLngBounds(ll(anillo)), { paddingTopLeft: [30, 150], paddingBottomRight: [der, 30] })
}

// ═══════════════════════════════ EL PANEL ═══════════════════════════════
let btn = null, raiz = null, input = null
function boton() {
  if (!btn) {
    btn = document.createElement('button')
    btn.type = 'button'; btn.className = 'sidpt-btn'; btn.textContent = '🌎 PICB TEATRO'
    btn.title = 'PICB a nivel FF.TT.T.O.: los calcos del teatro con lo más sobresaliente'
    btn.setAttribute('aria-expanded', 'false')
    btn.addEventListener('click', () => (S.abierto ? cerrar() : abrir()))
    document.body.appendChild(btn)
    window.addEventListener('resize', ubicarBoton)
  }
  btn.hidden = !S.nivel.teatro
  ubicarBoton()
}
// Las pestañas del borde derecho (🧩 Superponer, 🗂️ Despliegue del TO…) tienen cada una su altura fija y
// esta no debe taparlas ni quedar tapada (09-11-2026: en la Mesa publicada quedó debajo del Despliegue).
// Se ubica justo debajo de la última; si no entra, arriba de la primera.
function ubicarBoton() {
  if (!btn || btn.hidden) return
  const otras = [...document.body.children].filter((e) => {
    if (e === btn || !(e instanceof HTMLElement)) return false
    const cs = getComputedStyle(e)
    return cs.position === 'fixed' && cs.display !== 'none' && cs.visibility !== 'hidden' && /^vertical/.test(cs.writingMode)
  }).map((e) => e.getBoundingClientRect()).filter((r) => r.height > 0 && r.right >= window.innerWidth - 4)
  const alto = btn.getBoundingClientRect().height || 150, H = window.innerHeight
  let top = Math.round(H * 0.46)
  if (otras.length) {
    const abajo = Math.max(...otras.map((r) => r.bottom)) + 10, arriba = Math.min(...otras.map((r) => r.top)) - 10 - alto
    top = abajo + alto <= H - 20 ? abajo : arriba >= 64 ? arriba : Math.max(64, H - alto - 20)
  }
  const nuevo = `${Math.round(top)}px`
  if (btn.style.top !== nuevo) btn.style.top = nuevo
}
function abrir() {
  if (!S.nivel.teatro) return
  S.abierto = true; S.min = false
  if (!raiz) {
    raiz = document.createElement('section')
    raiz.className = 'sidpt'; raiz.setAttribute('aria-label', 'PICB del Teatro de Operaciones')
    document.body.appendChild(raiz)
    raiz.addEventListener('click', alClic)
    raiz.addEventListener('change', alCambio)
    raiz.addEventListener('input', alEscribir)
    input = document.createElement('input')
    input.type = 'file'; input.className = 'sidpt-file'; input.multiple = true; input.accept = '.kmz,.kml'; input.hidden = true
    input.addEventListener('change', () => { const fs = [...(input.files || [])]; input.value = ''; if (fs.length) cargarKmz(fs) })
    document.body.appendChild(input)
  }
  raiz.hidden = false
  btn?.setAttribute('aria-expanded', 'true')
  cargarBase()
  recalcular(); pintar(); dibujar()
  if (S.ai?.anillo && !S.yaEncuadrado) { S.yaEncuadrado = true; encuadrar(S.ai.anillo) }
}
function cerrar() {
  S.abierto = false
  if (raiz) raiz.hidden = true
  btn?.setAttribute('aria-expanded', 'false')
  quitarCapas()
  ultimaFirmaDibujo = ''
}

const PASOS = [
  [1, 'Ambiente', 'Definir el ambiente operacional'],
  [2, 'Efectos', 'Describir los efectos del teatro'],
  [3, 'Amenaza', 'Evaluar la amenaza'],
  [4, 'CAE', 'Cursos de acción del enemigo'],
]
function pintar() {
  if (!raiz || !S.abierto) return
  const sub = `${esc(S.nombre || 'Ejercicio')} · ${esc(S.nivel.unidad || 'FF.TT.T.O.')} · escala 1:1.000.000`
  raiz.className = 'sidpt' + (S.min ? ' min' : '')
  raiz.innerHTML = `
    <div class="sidpt-hd"><div class="sidpt-tit"><h2>🌎 PICB DEL TEATRO · FF.TT.T.O.</h2><p>${sub}</p></div>
      <button type="button" data-a="min" title="${S.min ? 'Desplegar' : 'Plegar el panel (la carta sigue)'}">${S.min ? '▸' : '▾'}</button>
      <button type="button" data-a="cerrar" title="Cerrar (quita los calcos del teatro de la carta)">✕</button></div>
    <nav class="sidpt-pasos">${PASOS.map(([n, c, t]) => `<button type="button" data-a="paso" data-n="${n}" class="${S.paso === n ? 'on' : ''}" title="${t}"><b>${n}</b>${c}</button>`).join('')}</nav>
    <div class="sidpt-bd">${S.error ? `<div class="sidpt-error">${esc(S.error)}</div>` : ''}${!S.base && !S.error ? '<div class="sidpt-aviso">Cargando la carta del teatro (rutas, poblaciones, relieve)…</div>' : ''}${S.aviso ? `<div class="sidpt-aviso">${esc(S.aviso)}</div>` : ''}${[paso1, paso2, paso3, paso4][S.paso - 1]()}</div>
    <div class="sidpt-pie">Terreno: © OpenStreetMap (ODbL) · Natural Earth · Terrain Tiles AWS, generalizado a 1:1.000.000. Poder y ritmos: referencias a validar.</div>`
}

function paso1() {
  const r = S.resumen, t = S.g.teatro || {}
  const sub = (r?.subteatros || []).concat(r?.teatro || [])
  return `
  <div class="sidpt-card"><h3>Por qué este apartado</h3>
    <p class="sidpt-guia">Este ejercicio es de nivel teatro (${esc(S.nivel.motivo)}). A esta escala la Mesa no genera los calcos de detalle (tope ${M.fmtKm2(M.LIMITE_TACTICO_KM2)}): acá se trabaja con <b>lo más sobresaliente del teatro</b>, como en una carta 1:1.000.000. La PICB de CE y DIV no cambia.</p></div>
  <div class="sidpt-card"><h3>Teatro de Operaciones</h3>
    ${r && r.km2 ? `<div class="sidpt-num"><div><b>${M.fmtKm2(r.km2)}</b><span>superficie</span></div><div><b>${Math.round(r.anchoKm)} km</b><span>de este a oeste</span></div><div><b>${Math.round(r.altoKm)} km</b><span>de norte a sur</span></div></div>
    <ul class="sidpt-lista" style="margin-top:7px">${sub.map((a) => `<li><span class="k">▸</span><button class="sidpt-ir" data-a="area" data-id="${esc(a.id)}">${esc(a.nombre)}</button> <span class="k">${M.fmtKm2(a.km2)}</span></li>`).join('')}</ul>
    ${r.aos.length ? `<p class="sidpt-guia" style="margin-top:6px">Áreas de operaciones de los CE: ${r.aos.map((a) => `<button class="sidpt-ir" data-a="area" data-id="${esc(a.id)}">${esc(a.nombre)}</button>`).join(', ')}.</p>` : ''}`
    : '<div class="sidpt-aviso">El ejercicio todavía no tiene el TO ni los subteatros. Cargalos con <b>📂 Abrir KMZ</b> (en 📁 Ejercicios) o con el KMZ de abajo.</div>'}
  </div>
  <div class="sidpt-card"><h3>Área de Interés del TO <small>${S.ai?.km2 ? M.fmtKm2(S.ai.km2) : ''}</small></h3>
    <p class="sidpt-guia">El teatro más las bases y los orígenes del enemigo (sus GG.UU. y los ejes de aproximación), con un margen. ${S.ai?.fuera?.length ? `Quedan afuera por lejanas: ${S.ai.fuera.map((f) => `${esc(f.nombre)} (${f.km.toLocaleString('es-BO')} km)`).join(', ')}.` : ''}</p>
    <label class="sidpt-rango">Margen <input type="range" min="10" max="120" step="5" data-a="margen" value="${Number(S.g.margenKm) || 40}"> <b>${Number(S.g.margenKm) || 40} km</b></label>
    <div class="sidpt-fila" style="margin-top:6px"><button class="sidpt-b sec" data-a="verai">🔍 Ver el área</button>
      <label class="sidpt-fila" style="font-size:12px;color:#aebfcc"><input type="checkbox" data-a="mascara" ${S.ver.mascara ? 'checked' : ''}> Oscurecer lo de afuera</label></div>
  </div>
  <div class="sidpt-card"><h3>KMZ del teatro <small>DEOP, ejes, orígenes</small></h3>
    <p class="sidpt-guia">Cargá los KMZ de Google Earth del escalón superior: las <b>Direcciones Estratégicas Operativas</b> (corredor, línea y puntos numerados), los <b>ejes de aproximación</b> y las GG.UU. Se pueden elegir varios a la vez.</p>
    <button class="sidpt-cargar" data-a="kmz">📥 Cargar KMZ del teatro…</button>
    <p class="sidpt-guia" style="margin-top:6px">${(t.deop || []).length ? `Cargado: <b>${t.deop.length} DEOP</b> (${t.deop.map((d) => `DEOP ${d.n}`).join(', ')}), ${(t.ejes || []).length} ejes de aproximación, ${(t.origenes || []).length} orígenes.` : 'Todavía no hay DEOP cargadas.'}
    ${(t.deop || []).length ? ' <button class="sidpt-ir" data-a="borrarkmz">Quitar lo cargado</button>' : ''}</p>
  </div>
  <div class="sidpt-card"><h3>Notas del G-2 · paso 1</h3><textarea class="sidpt-txt" data-nota="paso1" placeholder="Límites, Área de Interés, información que falta (vacíos de inteligencia)…">${esc(S.g.notas?.paso1 || '')}</textarea></div>`
}

const CAPAS_TXT = [
  ['comunicaciones', '🛣️ Comunicaciones', 'Rutas troncales (rojo), primarias (naranja) y secundarias; terciarias de cerca. Ferrocarriles, aeródromos y pasos fronterizos.', 'linear-gradient(90deg,#ff3b30 0 40%,#ff9500 40% 70%,#1a1a1a 70%)'],
  ['poblaciones', '🏘️ Poblaciones', 'Capitales, ciudades, pueblos y localidades de frontera; las aldeas sólo de cerca.', 'radial-gradient(circle,#fff 30%,#111 32% 45%,transparent 47%)'],
  ['obstaculos', '⛰️ Grandes obstáculos', 'Relieve severamente restringido (marrón) y restringido, salares, lagos, ríos principales y volcanes.', 'linear-gradient(90deg,#6b3a1f 0 35%,#f6f8fa 35% 65%,#4a90d9 65%)'],
  ['efectos', '🎯 Efectos del teatro', 'Corredores (DEOP) con la magnitud que admiten y los nudos de comunicaciones: el terreno decisivo.', 'linear-gradient(90deg,#e74c3c55 0 50%,#2489db55 50%)'],
]
function paso2() {
  const e = S.efectos
  const est = estacion()
  return `
  <div class="sidpt-card"><h3>Los cuatro calcos del teatro</h3><div style="display:grid;gap:6px">
    ${CAPAS_TXT.map(([k, t, d, sw]) => `<div class="sidpt-capa"><span class="sw" style="background:${sw}"></span><div><b>${t}</b><small>${d}</small></div>
      <label class="sidpt-tog" title="Mostrar u ocultar"><input type="checkbox" data-a="ver" data-k="${k}" ${S.ver[k] ? 'checked' : ''}><span></span></label></div>`).join('')}
  </div></div>
  ${e ? `<div class="sidpt-card"><h3>Lo que hay en el Área de Interés</h3>
    <div class="sidpt-num"><div><b>${M.fmtKm(e.kmPor[1] || 0)}</b><span>troncales</span></div><div><b>${M.fmtKm(e.kmPor[2] || 0)}</b><span>primarias</span></div><div><b>${M.fmtKm(e.kmPor[3] || 0)}</b><span>secundarias</span></div>
      <div><b>${M.fmtKm(e.kmFfcc)}</b><span>ferrocarril</span></div><div><b>${e.aerodromos.length}</b><span>aeródromos</span></div><div><b>${e.pasos.length}</b><span>pasos fronterizos</span></div></div>
    <ul class="sidpt-lista" style="margin-top:7px">
      <li><span class="k">Pasos:</span><span>${e.pasos.slice(0, 14).map((p) => `<button class="sidpt-ir" data-a="ir" data-lng="${p[2]}" data-lat="${p[3]}">${esc(p[0])}</button>`).join(', ') || '—'}</span></li>
      <li><span class="k">Ciudades:</span><span>${e.ciudades.slice(0, 16).map((c) => `<button class="sidpt-ir" data-a="ir" data-lng="${c[2]}" data-lat="${c[3]}">${esc(c[0])}</button>`).join(', ') || '—'}</span></li>
      <li><span class="k">Obstáculos:</span><span>${[...e.salares.map((s) => `${esc(s.nombre)} (${M.fmtKm2(s.km2)})`), ...e.lagos.filter((l) => l.km2 > 50).map((s) => `${esc(s.nombre)} (${M.fmtKm2(s.km2)})`)].join(', ') || '—'}; relieve severo ${M.fmtKm2(e.severoKm2)}, restringido ${M.fmtKm2(e.restrKm2)}.</span></li>
    </ul></div>` : ''}
  <div class="sidpt-card"><h3>Terreno decisivo <small>nudos de comunicaciones</small></h3>
    <ul class="sidpt-lista">${S.nudos.map((n) => `<li><span class="k">★</span><button class="sidpt-ir" data-a="ir" data-lng="${n.lng}" data-lat="${n.lat}">${esc(n.nombre)}</button> <span class="k">${esc(n.porque)}</span></li>`).join('') || '<li>—</li>'}</ul></div>
  ${S.analisis.length ? `<div class="sidpt-card"><h3>Corredores a nivel teatro <small>las DEOP sobre la red vial</small></h3>
    <ul class="sidpt-lista">${S.analisis.map((a) => `<li><span class="k" style="color:${colorDeop(a.n)}">■</span><span><b>${esc(a.nombre)}</b> — ${M.fmtKm(a.kmRuta)} por vía; mejor vía ${esc(a.via)}; admite <b>${esc(a.magnitud)}</b>${a.anchoKm ? `; ancho medio ${Math.round(a.anchoKm)} km` : ''}.</span></li>`).join('')}</ul></div>` : ''}
  <div class="sidpt-card"><h3>Condiciones meteorológicas <small>${esc(est.nombre)}</small></h3><p class="sidpt-guia">${est.texto}</p></div>
  <div class="sidpt-card"><h3>Notas del G-2 · paso 2</h3><textarea class="sidpt-txt" data-nota="paso2" placeholder="Efectos del teatro sobre las operaciones del enemigo y las propias…">${esc(S.g.notas?.paso2 || '')}</textarea></div>`
}
function estacion() {
  const mes = new Date().getMonth() + 1
  const lluvias = mes === 12 || mes <= 3
  return lluvias
    ? { nombre: 'época de lluvias (diciembre a marzo)', texto: 'El <b>Salar de Uyuni</b> y el de Coipasa se cubren de agua y los bofedales se anegan: el salar deja de ser transitable para vehículos pesados fuera de sus bordes firmes y las huellas de tierra se cortan. Crecen el Desaguadero y los ríos del altiplano. Nubosidad y tormentas eléctricas por la tarde: limitan la aviación y el apoyo aéreo. Altura (3.600–4.600 m): menor rendimiento de motores y del personal no aclimatado.' }
    : { nombre: 'época seca (abril a noviembre)', texto: 'El <b>altiplano</b> es transitable casi en toda su extensión y el Salar de Uyuni soporta vehículos por su costra firme. Heladas nocturnas (−15 °C o menos en junio-julio), viento fuerte en la tarde y polvo que delata movimientos. Cielo despejado: excelente observación y empleo de la aviación y de los sensores (SANT). Altura (3.600–4.600 m): menor rendimiento de motores y del personal no aclimatado.' }
}
function filaU(u, bando) {
  const aj = (S.g.poderes || {})[u.designacion]
  return `<tr><td>${esc(u.designacion)}${u.lugar ? `<br><span style="color:#8ea3b3">${esc(u.lugar)}</span>` : ''}</td><td>${esc((M.NOM_ESCALON[u.escalon] || u.escalon).replace(/\s*\(.*\)/, ''))}<br><span style="color:#8ea3b3">${esc(A.NOM_ARMA[u.arma] || u.arma)}</span></td>
    <td>${u.rol ? esc(u.rol) : '—'}${u.deop ? `<br>DEOP ${u.deop}` : ''}</td><td><input type="number" min="0" step="1" data-a="poder" data-u="${esc(u.designacion)}" value="${aj != null ? aj : u.poder}" title="Poder de combate (referencia por escalón y arma). Corregilo con el COE."></td></tr>`
}
function paso3() {
  const en = S.unidades.enemigas, pr = S.unidades.propias
  const prim = en.filter((u) => u.deop && !['reserva', 'apoyo', 'comando'].includes(u.rol)), res = en.filter((u) => u.rol === 'reserva'), apo = en.filter((u) => u.rol === 'apoyo'), com = en.filter((u) => u.rol === 'comando')
  return `
  <div class="sidpt-card"><h3>Modelo del enemigo a nivel operacional</h3>
    <p class="sidpt-guia">${en.length ? `<b>Primer escalón:</b> ${prim.map((u) => `${esc(u.designacion)} (DEOP ${u.deop})`).join(', ') || '—'}${com.length ? `, bajo el mando de ${com.map((u) => esc(u.designacion)).join(' y ')}` : ''}. <b>Reserva:</b> ${res.map((u) => esc(u.designacion)).join(', ') || '—'}. <b>Apoyo:</b> ${apo.map((u) => esc(u.designacion)).join(', ') || '—'}.` : 'No hay GG.UU. enemigas en el ejercicio: cargalas con 📂 Abrir KMZ, con 🧩 Superponer → 📌 Pasar, o con el KMZ del paso 1.'}</p></div>
  ${cardModelo()}
  <div class="sidpt-card"><h3>GG.UU. enemigas <small>${en.length}</small></h3>
    <table class="sidpt-tabla"><thead><tr><th>Unidad</th><th>Escalón · arma</th><th>Rol</th><th>Poder</th></tr></thead><tbody>${en.map((u) => filaU(u, 'e')).join('')}</tbody></table></div>
  <div class="sidpt-card"><h3>GG.UU. propias <small>${pr.length}</small></h3>
    <table class="sidpt-tabla"><thead><tr><th>Unidad</th><th>Escalón · arma</th><th>Rol</th><th>Poder</th></tr></thead><tbody>${pr.map((u) => filaU(u, 'p')).join('')}</tbody></table></div>
  ${S.prc.length ? `<div class="sidpt-card"><h3>Poder relativo por DEOP <small>referencia</small></h3>
    <table class="sidpt-tabla"><thead><tr><th>DEOP</th><th>Enemigo</th><th>Propio</th><th>Relación</th></tr></thead><tbody>
    ${S.prc.map((r) => `<tr><td style="color:${colorDeop(r.n)};font-weight:700">DEOP ${r.n}</td><td>${r.enemigas.map((u) => esc(u.designacion)).join('<br>') || '—'} <b>${M.redondeo(r.poderE, 1)}</b></td><td>${r.propias.map((u) => esc(u.designacion)).join('<br>') || '—'} <b>${M.redondeo(r.poderP, 1)}</b></td><td><b>${A.fmtRelacion(r.relacion)}</b></td></tr>`).join('')}
    </tbody></table><p class="sidpt-guia" style="margin-top:5px">Poder = escalón × calidad del arma (Brigada 40, División 80, CE 150; acorazada ×1,3, mecanizada ×1,2). Son cifras de referencia: corregí cada unidad con su COE.</p></div>` : ''}
  <div class="sidpt-card"><h3>Notas del G-2 · paso 3</h3><textarea class="sidpt-txt" data-nota="paso3" placeholder="Doctrina, TTP, blancos de alto valor, capacidades y vulnerabilidades del enemigo…">${esc(S.g.notas?.paso3 || '')}</textarea></div>`
}
function paso4() {
  if (!S.analisis.length) return `<div class="sidpt-card"><h3>Calco del enemigo</h3><div class="sidpt-aviso">Para el calco del enemigo hacen falta las DEOP: cargá su KMZ en el <b>paso 1</b> («📥 Cargar KMZ del teatro»).</div></div>`
  const cae = S.cae
  return `
  <div class="sidpt-capa"><span class="sw" style="background:linear-gradient(90deg,#e0443a 0 50%,#ffd400 50%)"></span><div><b>🔴 Calco del enemigo</b><small>Itinerarios sobre la red vial con D+n, ejes de aproximación y A.I.N.</small></div>
    <label class="sidpt-tog"><input type="checkbox" data-a="ver" data-k="enemigo" ${S.ver.enemigo ? 'checked' : ''}><span></span></label></div>
  ${S.analisis.map((a) => `<div class="sidpt-deop" style="--c:${colorDeop(a.n)}">
    <div class="t"><b>${esc(a.nombre)}</b><label>km/día <input type="number" min="3" max="200" step="1" data-a="ritmo" data-n="${a.n}" value="${a.ritmo}" title="Ritmo de avance en contacto (referencia por arma)"></label></div>
    <div class="d">${M.fmtKm(a.kmRuta)} por vía (${M.fmtKm(a.kmRecta)} en línea recta) · mejor vía: ${esc(a.via)} · admite ${esc(a.magnitud)} · llega ${M.fmtDia(a.dias)}</div>
    <div class="d">${a.enemigas.map((u) => `<span style="color:#ff8a80">◆ ${esc(u.designacion)}</span>`).join(' ') || '<span style="color:#8ea3b3">sin GU enemiga asignada</span>'} <span style="color:#8ea3b3">frente a</span> ${a.propias.map((u) => `<span style="color:#8ec5ff">■ ${esc(u.designacion)}</span>`).join(' ') || '—'}</div>
    <div class="sidpt-itin">${a.puntos.map((p, i) => `<span data-a="ir" data-lng="${p.lng}" data-lat="${p.lat}">${esc(p.nombre.replace(/\s*\((Chile|Bolivia)\)/i, ''))} <b>${i ? M.fmtDia(p.dia) : 'D'}</b></span>`).join('')}</div>
    ${a.tramos.some((t) => !t.porRed) ? `<div class="d" style="color:#e7c46a">Tramo sin vía principal: ${a.tramos.filter((t) => !t.porRed).map((t) => `${esc(t.de)} → ${esc(t.a)} (${esc(t.motivo)})`).join('; ')}.</div>` : ''}
  </div>`).join('')}
  <div class="sidpt-card"><h3>Áreas de Interés Nombradas <small>${S.ains.length}</small></h3>
    <table class="sidpt-tabla"><thead><tr><th>A.I.N.</th><th>DEOP</th><th>Ventana</th><th>Indicador</th></tr></thead><tbody>
    ${S.ains.map((a) => `<tr><td><button class="sidpt-ir" data-a="ir" data-lng="${a.lng}" data-lat="${a.lat}"><b>${esc(a.id)}</b> ${esc(a.nombre)}</button></td><td>${a.deop.join('/')}</td><td>${M.fmtDia(a.net)}–${M.fmtDia(a.nlt)}</td><td>${esc(a.indicador)}</td></tr>`).join('')}
    </tbody></table></div>
  <div class="sidpt-card"><h3>Cursos de acción del enemigo</h3>
    <label style="font-size:12px;color:#aebfcc">Objetivo estratégico del enemigo (de la Apreciación de Inteligencia Estratégica)</label>
    <input class="sidpt-inp" data-a="objetivo" placeholder="p. ej. Salar de Uyuni" value="${esc(S.g.objetivo || '')}">
    ${cae ? `<div class="sidpt-cae" style="margin-top:8px"><h4>CAE más probable <small style="color:#8ea3b3">(esfuerzo principal: DEOP ${cae.probable.n})</small></h4>
      <textarea class="sidpt-txt" data-nota="caeProbable">${esc(S.g.notas?.caeProbable || cae.probable.texto)}</textarea>
      ${S.g.notas?.caeProbable ? '<button class="sidpt-ir" data-a="propuesta" data-k="caeProbable">↺ volver a la propuesta</button>' : ''}</div>
    <div class="sidpt-cae pel" style="margin-top:8px"><h4>CAE más peligroso <small style="color:#8ea3b3">(DEOP ${cae.peligroso.n})</small></h4>
      <textarea class="sidpt-txt" data-nota="caePeligroso">${esc(S.g.notas?.caePeligroso || cae.peligroso.texto)}</textarea>
      ${S.g.notas?.caePeligroso ? '<button class="sidpt-ir" data-a="propuesta" data-k="caePeligroso">↺ volver a la propuesta</button>' : ''}</div>` : ''}
    <p class="sidpt-guia" style="margin-top:6px">La máquina propone, el G-2 dispone: corregí el texto; lo tuyo queda guardado con el ejercicio.</p></div>
  ${cardCaes()}
  <div class="sidpt-card"><h3>Llevarlo</h3><div class="sidpt-fila">
    <button class="sidpt-b ok" data-a="kmzout">⬇ KMZ para Google Earth</button>
    <button class="sidpt-b" data-a="word">📄 Párrafo para la Apreciación (Word)</button>
    <button class="sidpt-b sec" data-a="copiar">📋 Copiar el texto</button></div></div>`
}

// ── PASO 3: la plantilla doctrinal (modelo de la amenaza) ──
function cardModelo() {
  const m = S.vista?.modelo
  if (!m) return `<div class="sidpt-card"><h3>Plantilla doctrinal · modelo de la amenaza</h3><div class="sidpt-aviso">Para armar el modelo de la amenaza hacen falta las DEOP (📥 KMZ del teatro, paso 1) y las GG.UU. enemigas en el ejercicio.</div></div>`
  const a = m.art
  const u = (l) => l.map((z) => esc(z.designacion)).join(', ') || '—'
  return `<div class="sidpt-card"><h3>Plantilla doctrinal · modelo de la amenaza ${m.fuente === 'IA' ? '<span class="sidpt-fuente">IA, revisado</span>' : ''}</h3>
    ${a ? `<ul class="sidpt-lista">
      <li><span class="k">Esfuerzo principal:</span><span>DEOP ${a.ep.n} — ${u(a.ep.enemigas)}</span></li>
      ${a.es.map((z) => `<li><span class="k">Secundario:</span><span>DEOP ${z.n} — ${u(z.enemigas)}</span></li>`).join('')}
      ${a.engano ? `<li><span class="k">Engaño / fijación:</span><span>DEOP ${a.engano.n} — ${u(a.engano.enemigas)}</span></li>` : ''}
      <li><span class="k">Reserva operativa:</span><span>${u(a.reserva)}${a.reserva.length ? ' · sin empleo taxativo: magnitud, ubicación y direcciones probables (RDO Art. 807)' : ' · no identificada: la formará con su segundo escalón'}</span></li>
      ${a.apoyos.length ? `<li><span class="k">Apoyos:</span><span>${u(a.apoyos)}</span></li>` : ''}
      ${a.comandos.length ? `<li><span class="k">Mando:</span><span>${u(a.comandos)}</span></li>` : ''}
      ${a.sinDeop.length ? `<li><span class="k">Sin DEOP:</span><span>${u(a.sinDeop)} — escribí «DEOP n» o «Reserva» en la descripción de la ficha</span></li>` : ''}
    </ul>` : ''}
    <p class="sidpt-guia" style="margin-top:6px"><b>Así ataca:</b> ${esc(m.descripcion)}</p>
    <details class="sidpt-det" style="margin-top:6px" open><summary>Decisiones del Comandante enemigo (${m.decisiones.length})</summary>
      <table class="sidpt-tabla" style="margin-top:4px"><thead><tr><th>PD</th><th>Decisión</th><th>Ventana</th><th>Dónde se ve</th></tr></thead><tbody>${m.decisiones.map((d) => `<tr><td><b>${esc(d.id)}</b></td><td>${esc(d.decision)}</td><td>${esc(d.ventana)}</td><td>${esc(d.donde)}</td></tr>`).join('')}</tbody></table></details>
    <details class="sidpt-det" style="margin-top:6px"><summary>Blancos de alto valor (${m.bav.length})</summary><ul class="sidpt-lista" style="margin-top:4px">${m.bav.map((b) => `<li><span class="k">◆</span><span>${esc(b)}</span></li>`).join('')}</ul></details>
    <details class="sidpt-det" style="margin-top:6px"><summary>Normas de distancia y tiempo a escala teatro (referencia)</summary>
      <table class="sidpt-tabla" style="margin-top:4px"><tbody>${m.normas.map(([n, v, f]) => `<tr><td>${esc(n)}</td><td><b>${esc(v)}</b><br><span style="color:#8ea3b3">${esc(f)}</span></td></tr>`).join('')}</tbody></table></details>
    <details class="sidpt-det" style="margin-top:6px"><summary>Cómo articula la maniobra (su doctrina)</summary><ul class="sidpt-lista" style="margin-top:4px">${m.articulacion.map(([n, d]) => `<li><span class="k">▸</span><span><b>${esc(n)}.</b> ${esc(d)}</span></li>`).join('')}</ul></details>
    <p class="sidpt-guia" style="margin-top:6px">La máquina propone con lo que hay en el ejercicio. En el paso 4 está el prompt para que una IA lo mejore y el lugar para pegar su respuesta.</p></div>`
}
// ── PASO 4: los CAE por fases, la matriz, los RPI, los PD propios y la IA ──
function tablaFases(c) {
  const fases = c.fasesIA || c.fases || []
  if (!fases.length) return ''
  const d = (x) => (x == null || x === '' ? '' : ` <i>(${typeof x === 'number' ? esc(M.fmtDia(x)) : esc(x)})</i>`)
  return `<table class="sidpt-fases"><thead><tr><th>Fase</th><th>Acciones (unidad: qué — dónde, cuándo)</th></tr></thead><tbody>${fases.map((f) => `<tr><td class="f">${esc(f.id)}<br><small>${esc(f.ventana || '')}</small></td><td>${(f.acciones || []).map((a) => `<div class="ac ${esc(a.papel === 'reserva' ? 'reserva' : a.papel === 'apoyo' ? 'apoyo' : '')}">${a.quien ? `<b>${esc(a.quien)}</b>: ` : ''}${esc(a.que)}${a.lugar ? ` — ${esc(a.lugar)}` : ''}${d(a.dia)}</div>`).join('')}</td></tr>`).join('')}</tbody></table>`
}
function cardCae(c, abierto) {
  if (!c) return ''
  const r = c.reservaIA || c.reserva
  return `<details class="sidpt-det ${c.tipo === 'peligroso' ? 'pel' : ''}" ${abierto ? 'open' : ''}><summary><b>${esc(c.id)}</b> · ${c.tipo === 'probable' ? 'más probable' : 'más peligroso'} · DEOP ${c.n}${c.criterio ? ` <small>(${esc(c.criterio)})</small>` : ''}${c.fuente === 'IA' ? '<span class="sidpt-fuente">IA, revisado</span>' : ''}</summary>
    <p class="sidpt-guia" style="margin:6px 0"><b>Enunciado:</b> ${esc(c.enunciado)}</p>
    ${tablaFases(c)}
    ${r ? `<p class="sidpt-guia" style="margin-top:6px"><b>Reserva enemiga:</b> ${esc(r.magnitud || '')}${r.ubicacion ? ` · <b>dónde:</b> ${esc(r.ubicacion)}` : ''}${r.empeno ? ` · <b>empeño:</b> ${esc(r.empeno)}` : ''}${r.direcciones?.length ? `<br><b>Direcciones de empleo:</b> ${r.direcciones.map(esc).join('; ')}` : ''}${r.condicion ? `<br><b>Condición:</b> ${esc(r.condicion)}` : ''}</p>` : ''}
    ${c.porque?.length ? `<p class="sidpt-guia" style="margin-top:6px"><b>Por qué:</b> ${c.porque.map(esc).join(' ')}</p>` : ''}
  </details>`
}
function cardCaes() {
  const v = S.vista, cs = v?.caes
  if (!cs) return ''
  const ia = S.g.ia
  return `<div class="sidpt-card"><h3>CAE por fases <small>con el empleo de la reserva</small>${v.fuente === 'IA' ? '<span class="sidpt-fuente">IA, revisado</span>' : ''}</h3>
    <div class="sidpt-fila" style="margin-bottom:6px;justify-content:space-between"><label style="font-size:12px;color:#aebfcc">Cruce de los pasos el D+<input type="number" min="0" max="30" step="1" data-a="cruce" value="${cruceDe()}" class="sidpt-num-inp" title="Día en que el enemigo cruza los pasos (fin de su fase de superioridad aérea). Los D+n del itinerario se suman a este."></label>
      <span class="sidpt-radio">En la carta: <label><input type="radio" name="sidpt-caev" data-a="caevisto" value="probable" ${S.caeVisto !== 'peligroso' ? 'checked' : ''}> ${esc(cs.probable?.id || 'CAE-1')}</label><label><input type="radio" name="sidpt-caev" data-a="caevisto" value="peligroso" ${S.caeVisto === 'peligroso' ? 'checked' : ''}> ${esc(cs.peligroso?.id || 'CAE-2')}</label>
      <label class="sidpt-tog" title="Fichas por fase en la carta"><input type="checkbox" data-a="ver" data-k="fases" ${S.ver.fases ? 'checked' : ''}><span></span></label></span></div>
    <div style="display:grid;gap:6px">${cardCae(cs.probable, true)}${cardCae(cs.peligroso, false)}</div>
    <details class="sidpt-det" style="margin-top:6px"><summary>Matriz de eventos (${(cs.matriz || []).length})</summary>
      <table class="sidpt-tabla" style="margin-top:4px"><thead><tr><th>A.I.N.</th><th>Ventana</th><th>Indicador</th><th>Confirma</th></tr></thead><tbody>${(cs.matriz || []).map((x) => `<tr><td><b>${esc(x.ain)}</b> ${esc(x.lugar)}</td><td>${esc(x.ventana)}</td><td>${esc(x.indicador)}</td><td>${esc(x.confirma)}</td></tr>`).join('')}</tbody></table></details>
    <details class="sidpt-det" style="margin-top:6px"><summary>RPI propuestos (${(cs.rpi || []).length})</summary><ul class="sidpt-lista" style="margin-top:4px">${(cs.rpi || []).map((r) => `<li><span class="k"><b>${esc(r.id)}</b></span><span>${esc(r.pregunta)} <i>De ser así:</i> ${esc(r.deSerAsi)} <i>Especial atención:</i> ${esc(r.atencion)}</span></li>`).join('')}</ul></details>
    <details class="sidpt-det" style="margin-top:6px"><summary>Puntos de decisión propios (${(cs.propias || []).length})</summary>
      <table class="sidpt-tabla" style="margin-top:4px"><thead><tr><th>PD</th><th>Decisión</th><th>A más tardar</th><th>AIN</th><th>AIS</th></tr></thead><tbody>${(cs.propias || []).map((d) => `<tr><td><b>${esc(d.id)}</b></td><td>${esc(d.decision)}</td><td>${esc(d.aMasTardar)}</td><td>${esc(d.ain)}</td><td>${esc(d.ais)}</td></tr>`).join('')}</tbody></table></details>
    <div class="sidpt-ia" style="margin-top:8px"><h4>🤖 Con ayuda de la IA (fuera de la app: no gasta plata)</h4>
      <p class="sidpt-guia">1) Bajá o copiá el prompt: lleva el teatro, las DEOP con sus D+n, las GG.UU., las A.I.N., la doctrina del enemigo y lo que ya propone el motor. 2) Pegalo en la IA que tengas. 3) Pegá acá su respuesta (el JSON) y aplicala: reemplaza la propuesta del motor y queda guardada con el ejercicio.</p>
      <div class="sidpt-fila"><button class="sidpt-b" data-a="prompt">📝 Bajar el prompt (.md)</button><button class="sidpt-b sec" data-a="copiarprompt">📋 Copiar el prompt</button></div>
      <textarea class="sidpt-txt" data-a="iatxt" placeholder="Pegá acá la respuesta de la IA (el JSON)…" style="min-height:70px"></textarea>
      <div class="sidpt-fila"><button class="sidpt-b ok" data-a="aplicaria">✓ Aplicar la respuesta</button>${ia ? `<button class="sidpt-b sec" data-a="quitaria">✕ Quitar lo de la IA (volver al motor)</button><span class="sidpt-guia">Aplicada ${esc(new Date(ia.cuando).toLocaleString('es-BO'))}: ${esc(ia.resumen)}</span>` : ''}</div>
    </div>
    <p class="sidpt-guia" style="margin-top:6px">Todo esto va al KMZ (carpetas 10 a 12) y al Word de abajo.</p></div>`
}
// ── eventos ──
function alClic(ev) {
  const b = ev.target.closest('[data-a]')
  if (!b || !raiz.contains(b)) return
  const a = b.dataset.a
  if (a === 'cerrar') return cerrar()
  if (a === 'min') { S.min = !S.min; return pintar() }
  if (a === 'paso') { const antes = S.paso === 4; S.paso = Number(b.dataset.n); pintar(); raiz.querySelector('.sidpt-bd')?.scrollTo(0, 0); if (antes !== (S.paso === 4)) dibujar(); return }
  if (a === 'kmz') return input.click()
  if (a === 'borrarkmz') { if (window.confirm('¿Quitar las DEOP, los ejes y los orígenes cargados del KMZ? (Las fichas del ejercicio no se tocan.)')) { guardar({ teatro: { deop: [], ejes: [], origenes: [], areas: [] } }); recalcular(); pintar(); dibujar() } return }
  if (a === 'verai') return encuadrar(S.ai?.anillo)
  if (a === 'area') { const x = S.areas.find((y) => String(y.id) === b.dataset.id); return x && encuadrar(x.anillo) }
  if (a === 'ir') return irA(Number(b.dataset.lng), Number(b.dataset.lat))
  if (a === 'propuesta') { guardar({ notas: { ...(S.g.notas || {}), [b.dataset.k]: '' } }); return pintar() }
  if (a === 'kmzout') return bajarKmz()
  if (a === 'word') return bajarWord()
  if (a === 'copiar') return copiarTexto()
  if (a === 'prompt') return bajarPrompt()
  if (a === 'copiarprompt') return copiarPrompt()
  if (a === 'aplicaria') return aplicarIA(raiz.querySelector('[data-a="iatxt"]')?.value || '')
  if (a === 'quitaria') { guardar({ ia: null }); S.aviso = 'Se quitó lo de la IA: vuelve la propuesta del motor.'; recalcular(); pintar(); return dibujar(true) }
}
function alCambio(ev) {
  const t = ev.target, a = t.dataset.a
  if (a === 'ver') { S.ver[t.dataset.k] = t.checked; recordarVer(); return dibujar() }
  if (a === 'mascara') { S.ver.mascara = t.checked; recordarVer(); return dibujar() }
  if (a === 'margen') { guardar({ margenKm: Number(t.value), aiFijo: false }); recalcular(); pintar(); return dibujar() }
  if (a === 'poder') { const v = Number(t.value); guardar({ poderes: { ...(S.g.poderes || {}), [t.dataset.u]: v > 0 ? v : undefined } }); recalcular(); pintar(); return }
  if (a === 'ritmo') { const v = Number(t.value); guardar({ ritmos: { ...(S.g.ritmos || {}), [t.dataset.n]: v > 0 ? v : undefined } }); recalcular(); pintar(); return dibujar() }
  if (a === 'objetivo') { guardar({ objetivo: t.value }); recalcular(); return pintar() }
  if (a === 'cruce') { const v = Number(t.value); guardar({ cruce: Number.isFinite(v) && v >= 0 ? v : undefined }); recalcular(); pintar(); return dibujar(true) }
  if (a === 'caevisto') { S.caeVisto = t.value; return dibujar(true) }
}
let tNota = null
function alEscribir(ev) {
  const t = ev.target
  if (t.dataset.nota) { clearTimeout(tNota); const k = t.dataset.nota, v = t.value; tNota = setTimeout(() => guardar({ notas: { ...(S.g.notas || {}), [k]: v } }), 400) }
  if (t.dataset.a === 'margen') { const b = t.parentElement.querySelector('b'); if (b) b.textContent = `${t.value} km` }
}

// ── 📥 KMZ del teatro ──
async function cargarKmz(archivos) {
  S.aviso = 'Leyendo ' + archivos.map((f) => f.name).join(', ') + '…'; pintar()
  try {
    const K = await import(LECTOR_KMZ)
    let lista = []
    for (const f of archivos) {
      if (/\.kml$/i.test(f.name)) lista.push(...K.placemarks(K.leerXml(await f.text()), { conLineas: true }))
      else {
        const z = await K.archivosDelZip(new Uint8Array(await f.arrayBuffer()))
        for (const k of z.kmls) lista.push(...K.placemarks(K.leerXml(k.texto), { conLineas: true }))
      }
    }
    const nuevo = M.teatroDeKml(lista)
    // áreas del TO del KMZ (por si el ejercicio no las tiene)
    const pk = K.paqueteDeKml(lista.filter((p) => p.tipo !== 'linea'), { nombre: S.nombre })
    const areasKmz = (pk.areas || []).filter((x) => /TEATR/i.test(M.sinTildes(x.nombre))).map((x) => ({ id: x.id, nombre: x.nombre, anillo: x.coords, tipo: /SUB\s*-?\s*TEATR/i.test(M.sinTildes(x.nombre)) ? 'subteatro' : 'teatro' }))
    const previo = S.g.teatro || { deop: [], ejes: [], origenes: [], areas: [] }
    const unido = M.unirTeatro(previo, nuevo)
    unido.areas = [...(previo.areas || []).filter((a) => !areasKmz.some((b) => b.nombre === a.nombre)), ...areasKmz]
    guardar({ teatro: unido })
    const partes = [nuevo.deop.length ? `${nuevo.deop.length} DEOP` : '', nuevo.ejes.length ? `${nuevo.ejes.length} ejes` : '', nuevo.origenes.length ? `${nuevo.origenes.length} orígenes` : '', areasKmz.length ? `${areasKmz.length} áreas del TO` : ''].filter(Boolean)
    S.aviso = partes.length ? `✓ Cargado: ${partes.join(', ')}.` : 'Ese KMZ no trae DEOP, ejes ni áreas del teatro.'
    // GG.UU. que traiga el KMZ y no estén en el ejercicio: se ofrecen (rombo rojo = enemigo).
    const fichas = (pk.unidades || []).filter((u) => ['brigada', 'division', 'cuerpo', 'ejercito'].includes(u.escalon))
    const ya = (S.foto?.unidades || [])
    const nuevas = fichas.filter((u) => !ya.some((x) => M.sinTildes(String(x.designacion || '')).toUpperCase().replace(/\s+/g, '') === M.sinTildes(u.designacion).toUpperCase().replace(/\s+/g, '') || (x.bando === u.bando && M.distKm([Number(x.lng), Number(x.lat)], [u.lng, u.lat]) < 2)))
    if (nuevas.length) {
      engancharPuente()
      if (puente && typeof puente.agregarUnidades === 'function' && window.confirm(`📌 El KMZ trae ${nuevas.length} GG.UU. que no están en el ejercicio:\n\n${nuevas.map((u) => `${u.bando === 'enemigo' ? '◆ ROJA' : '■ AZUL'} ${u.designacion}`).join('\n')}\n\n¿Agregarlas como fichas? (Se deshace con ↶)`)) {
        puente.agregarUnidades(nuevas)
        S.aviso += ` Se agregaron ${nuevas.length} fichas al ejercicio.`
      }
    }
  } catch (e) {
    S.aviso = ''; S.error = 'No se pudo leer el KMZ: ' + (e.message || e)
    setTimeout(() => { S.error = ''; pintar() }, 9000)
  }
  recalcular(); pintar(); dibujar()
}

// ── ⬇ llevarlo ──
const nombreArchivo = (ext) => `PICB TEATRO - ${(S.nombre || 'ejercicio').replace(/[\\/:*?"<>|]+/g, ' ').trim()}.${ext}`
function descargar(blob, nombre) {
  const u = URL.createObjectURL(blob), a = document.createElement('a')
  a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(u), 4000)
}
async function bajarKmz() {
  const kml = A.kmlDelTeatro({ ejercicio: S.nombre, anillo: S.ai?.anillo, analisis: S.analisis, teatro: S.g.teatro || {}, ains: S.ains, nudos: S.nudos, unidades: S.unidades, capas: S.capas, carpetasExtra: D.kmlCaes(S.vista?.caes), estilosExtra: D.ESTILOS_KML_CAE })
  const Z = window.__SIDECEME_JSZIP || window.JSZip
  if (Z) {
    try { const z = new Z(); z.file('doc.kml', kml); const b = await z.generateAsync({ type: 'blob', compression: 'DEFLATE' }); return descargar(b, nombreArchivo('kmz')) } catch (e) {}
  }
  descargar(new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' }), nombreArchivo('kml'))
}
function textoHtml() {
  return A.textoApreciacion({ ejercicio: S.nombre, resumen: S.resumen, efectos: S.efectos, analisis: S.analisis, nudos: S.nudos, ains: S.ains, prc: S.prc, cae: S.cae, unidades: S.unidades, notas: S.g.notas || {}, extras: D.textoCaes({ modelo: S.vista?.modelo, caes: S.vista?.caes, cruce: cruceDe() }) })
}
// ── 🤖 el prompt para la IA y su respuesta ──
function armarPrompt() {
  return D.promptIA({ ejercicio: S.nombre, resumen: S.resumen, analisis: S.analisis, prc: S.prc, unidades: S.unidades, ains: S.ains, nudos: S.nudos, modelo: S.modelo, caes: S.caes, cruce: cruceDe(), objetivo: S.g.objetivo || '', notas: S.g.notas || {} })
}
function bajarPrompt() { descargar(new Blob([armarPrompt()], { type: 'text/markdown;charset=utf-8' }), nombreArchivo('md').replace('PICB TEATRO', 'PROMPT IA PICB TEATRO')) }
async function copiarPrompt() {
  try { await navigator.clipboard.writeText(armarPrompt()); S.aviso = '✓ Prompt copiado: pegalo en la IA y traé su respuesta (el JSON).' } catch (e) { S.aviso = 'No se pudo copiar: usá «📝 Bajar el prompt».' }
  pintar()
}
function aplicarIA(texto) {
  const r = D.leerRespuestaIA(texto)
  if (!r.ok) { S.error = 'La respuesta de la IA no sirve: ' + r.error; setTimeout(() => { S.error = ''; pintar() }, 9000); return pintar() }
  guardar({ ia: { datos: r.datos, resumen: r.resumen, cuando: new Date().toISOString() } })
  S.aviso = `✓ Respuesta de la IA aplicada (${r.resumen}). Revisala: la máquina propone, el G-2 dispone.`
  recalcular(); pintar(); dibujar(true)
}
function bajarWord() {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>PICB TEATRO</title>
    <style>body{font:11pt Arial,sans-serif}h3{font-size:12pt}p{text-align:justify}</style></head><body>${textoHtml()}</body></html>`
  descargar(new Blob(['﻿', html], { type: 'application/msword' }), nombreArchivo('doc'))
}
async function copiarTexto() {
  const div = document.createElement('div'); div.innerHTML = textoHtml()
  const txt = [...div.querySelectorAll('h3,p')].map((p) => p.textContent.trim()).join('\n')
  try { await navigator.clipboard.writeText(txt); S.aviso = '✓ Texto copiado: pegalo en la Apreciación de Inteligencia.' } catch (e) { S.aviso = 'No se pudo copiar: usá «📄 Párrafo para la Apreciación (Word)».' }
  pintar()
}

// 🖨️ «Imprimir por fases y capas» (impresion-fases/v1): deja en la carta UNA fase de un CAE (las fichas de esa fase y
// el recorrido hasta ella, aunque el panel esté cerrado o en otro paso). verFase(null) vuelve a como estaba.
let caeAntesDeImprimir = null
function verFase(cae, fase) {
  if (cae == null) {
    if (caeAntesDeImprimir === null) return true
    S.caeVisto = caeAntesDeImprimir; caeAntesDeImprimir = null; S.faseVista = null
    dibujar(true)
    return true
  }
  if (!S.nivel.teatro || !S.capas || !S.vista?.caes) return false
  if (caeAntesDeImprimir === null) caeAntesDeImprimir = S.caeVisto
  S.caeVisto = cae === 'peligroso' ? 'peligroso' : 'probable'
  S.faseVista = Number.isInteger(fase) ? fase : null
  dibujar(true)
  return true
}

// ── arranque ──
function arrancar() {
  engancharPuente(); engancharPreservar()
  seguir()
  setInterval(() => { try { seguir(); engancharPreservar(); ubicarBoton() } catch (e) { console.warn('PICB Teatro:', e) } }, 2000)
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar)
else arrancar()
window.SIDPicbTeatro = { abrir, cerrar, estado: () => S, version: VERSION_DATOS, panel: VERSION_PANEL, vista: () => S.vista, prompt: armarPrompt, cargarArchivos: (fs) => cargarKmz([...fs]), aplicarIA, verFase }
