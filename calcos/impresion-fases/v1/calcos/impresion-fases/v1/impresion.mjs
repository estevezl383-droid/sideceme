// 🖨️ Imprimir los CURSOS DE ACCIÓN por FASES y por CAPAS (14-11-2026).
//
// Pedido: «imprimir por capas los cursos de acción propios, los CAE y las plantillas doctrinales;
// que todo o la mayor parte del área de interés y/o de operaciones salga en la hoja; por fases y por
// capas». El «Imprimir por capas» del compilado sólo saca la carta y los calcos del terreno.
//
// Cómo trabaja: no redibuja nada por su cuenta. Usa la MISMA carta 2D de la Mesa, con los mismos ojos
// del panel izquierdo y la misma selección de fase (CAP n · fase k, CAE · fase k). Para cada hoja:
//   1) toca la fase (como el botón del panel),  2) deja encendidas sólo las capas de esa hoja,
//   3) toma una «foto» del DOM de la carta (vectores, fichas, rótulos y, si se pide, la carta de fondo).
// Todas las hojas usan el MISMO encuadre (ajustado al A.O. y/o al Área de Interés, con zoom fraccionario
// para llenar la hoja) y llevan las mismas cruces de registro: se pueden superponer en papel mantequilla.
// Al terminar se devuelven la fase, el CAP, los ojos y la vista tal como estaban.
//
// Los datos llegan de los componentes del panel (visibilidad/v1/cursos.mjs y panel.mjs), que en cada
// dibujo llaman a registrar(): no hace falta tocar el compilado.
//
// 🌎 14-11-2026 b · FASES ROJO del Teatro: con los CAE por fases del PICB del Teatro (picb-teatro/v1, paso 4) el diálogo
// suma «🌎 FASES ROJO · CAE-1 / CAE-2»: una hoja por fase, sólo con las fichas rojas de ESA fase (SIDPicbTeatro.verFase).
// 🔵 14-11-2026 c · con el paso 5 del Teatro, también «FASES AZUL» (el CAP) y «ENFRENTAMIENTO» (rojo y azul de la misma fase).
// 🗺️ 17-11-2026 · CARTA BASE Y CALCOS (pedido de la Mesa del Teatro: «primero su carta base y después sus calcos»).
// La hoja 1 puede ser la CARTA BASE —la carta con el relieve, los caminos y las poblaciones, para papel normal— y de
// ahí en más cada calco sale TRANSPARENTE, con el mismo encuadre y las mismas cruces de registro: se superponen encima
// en papel mantequilla. Se suman los CALCOS DEL TEATRO sueltos (comunicaciones, poblaciones, grandes obstáculos,
// efectos del teatro y calco del enemigo), uno por hoja, y «💾 Descargar las hojas»: un .html con todas las hojas
// adentro, que se abre e imprime después, sin conexión. Atajo desde el panel 🌎 PICB del Teatro: abrirCalcos().
import { capsDe } from '../../cap-propios/v1/proponer.mjs'

const ctx = {}
export function registrar(parcial) { Object.assign(ctx, parcial) }

// ── Capas imprimibles (claves de los ojos del panel) ──────────────────────────────────────────────────
const G4 = ['zonasLog', 'zonasLog:asdi', 'zonasLog:arce', 'zonasLog:otras', 'g4:sectores', 'g4:epa', 'g4:epe', 'g4:instalaciones']
const G1 = ['g1:lineaExtraviados', 'g1:puestosExtraviados', 'g1:prisioneros', 'g1:rutaPrisioneros', 'g1:otrasInstalaciones']
const CMOC = ['restringido', 'severo', 'defensivo', 'ae', 'avenidas', 'corredores', 'corredoresClandestinos', 'clave']
export const CAPAS = [
  { id: 'cap', nom: 'CAP · maniobra, tareas y fichas propias', claves: ['cap', 'unidadesAzul'], bando: 'propio', fase: true, def: true },
  { id: 'fuegos', nom: 'CAP · plan de fuegos', claves: ['planFuegos'], bando: 'propio', fase: true, def: true },
  { id: 'barreras', nom: 'CAP · plan de barreras y posiciones defensivas', claves: ['planBarreras', 'posDef'], bando: 'propio', fase: true, def: true },
  { id: 'cae', nom: 'CAE · fichas y despliegue enemigo de la fase', claves: ['cae', 'unidadesRojo'], bando: 'enemigo', fase: true, def: true },
  { id: 'teatro', nom: '🌎 PICB del Teatro · fichas de la fase (rojas, azules o las dos), DEOP, A.I.N. y calcos del panel', claves: [], bando: 'teatro', fase: true, def: true, teatro: true },
  { id: 'plantilla', nom: 'Plantilla doctrinal / situacional, objetivos, maniobra y A.I.N. (G-2)', claves: ['plantilla', 'objetivos', 'maniobra', 'ains'], fase: false, def: true },
  { id: 'cmoc', nom: 'CMOC · terreno juzgado', claves: CMOC, fase: false, def: false },
  { id: 'g4', nom: 'G-4 · logística', claves: G4, fase: false, def: false },
  { id: 'g1', nom: 'G-1 · personal', claves: G1, fase: false, def: false }
]
const REFERENCIA = ['areaOps', 'areaInteres', 'areaInfluencia']
const TODAS = [...new Set([...CAPAS.flatMap(c => c.claves), ...REFERENCIA])]
// 🗺️ Los calcos del Teatro, uno por hoja (claves de los ojos del panel 🌎 PICB del Teatro, que los enciende de a uno).
export const CAPAS_TEATRO = [
  ['comunicaciones', '🛣️ Comunicaciones · rutas, ferrocarriles, aeródromos y pasos'],
  ['poblaciones', '🏙️ Poblaciones'],
  ['obstaculos', '⛰️ Grandes obstáculos · relieve, salares, lagos y ríos'],
  ['efectos', '🎯 Efectos del teatro · corredores (DEOP) y nudos de comunicaciones'],
  ['enemigo', '🟥 Calco del enemigo · itinerarios con D+n, ejes, orígenes y A.I.N.']
]

// ── Hojas a imprimir (función pura: la prueba la llama sin navegador) ─────────────────────────────────
// cursos: [{ bando:'propio', n, idx, titulo } | { bando:'enemigo', idx, titulo }]
export function planDeHojas({ cursos = [], capas = [], modo = 'juntas', referencia = true, base = false }) {
  const elegidas = CAPAS.filter(c => capas.includes(c.id))
  const deFase = elegidas.filter(c => c.fase), fijas = elegidas.filter(c => !c.fase)
  const ref = referencia ? REFERENCIA : []
  const hojas = []
  for (const curso of cursos) {
    const propias = deFase.filter(c => c.bando === curso.bando)
    if (modo === 'juntas') {
      const juntas = [...propias, ...fijas]
      if (juntas.length) hojas.push({ curso, capas: juntas.map(c => c.id), claves: [...juntas.flatMap(c => c.claves), ...ref], titulo: curso.titulo, sub: juntas.map(c => c.nom).join(' · ') })
    } else {
      for (const c of propias) hojas.push({ curso, capas: [c.id], claves: [...c.claves, ...ref], titulo: curso.titulo, sub: c.nom })
    }
  }
  if (modo !== 'juntas' || !cursos.length) {
    for (const c of fijas) hojas.push({ curso: null, capas: [c.id], claves: [...c.claves, ...ref], titulo: c.nom, sub: 'Capa sin fase' })
  }
  // 🗺️ 17-11-2026 · la CARTA BASE va primera y con la carta de fondo; los calcos, transparentes, para superponerlos.
  if (base) {
    for (const h of hojas) h.conCarta = false
    hojas.unshift({ curso: { bando: 'teatro', cae: 'base', idx: null, titulo: 'CARTA BASE' }, capas: ['base', 'teatro'], claves: [...REFERENCIA], conCarta: true, base: true,
      titulo: '🗺️ CARTA BASE', sub: 'La carta con el relieve, los caminos y las poblaciones · imprimila en papel normal: encima van los calcos' })
  }
  return hojas
}

// ── Encuadre: A.O. y/o Área de Interés ───────────────────────────────────────────────────────────────
function juntarLngLat(x, out) {
  if (!Array.isArray(x)) return out
  if (x.length >= 2 && typeof x[0] === 'number' && typeof x[1] === 'number') {
    if (Number.isFinite(x[0]) && Number.isFinite(x[1]) && Math.abs(x[0]) <= 180 && Math.abs(x[1]) <= 90) out.push(x)
    return out
  }
  for (const y of x) juntarLngLat(y, out)
  return out
}
export function limitesEncuadre(encuadre, { aoi, ops } = {}) {
  const pts = []
  if (encuadre !== 'ao') {
    const areas = aoi?.properties?.areasInteres
    if (Array.isArray(areas) && areas.length) areas.forEach(a => juntarLngLat(a?.geometry?.coordinates, pts))
    else if (aoi?.type === 'FeatureCollection') aoi.features.forEach(f => juntarLngLat(f?.geometry?.coordinates, pts))
    else juntarLngLat((aoi?.geometry || aoi)?.coordinates, pts)
  }
  if (encuadre !== 'ai') juntarLngLat(ops?.areaOps?.coords, pts)
  if (!pts.length) return null
  const lngs = pts.map(p => p[0]), lats = pts.map(p => p[1])
  return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]]
}

// ── Papel (px CSS a 96 ppp; carta con márgenes de 8 mm) ───────────────────────────────────────────────
const PAPEL = { landscape: { w: 990, h: 668 }, portrait: { w: 750, h: 905 } }
const FICHAS = { grandes: 1, normales: 1.35, chicas: 1.8 }
export function escalaRedonda(n) {
  const p = 10 ** Math.floor(Math.log10(n))
  return Math.round(n / p * 4) / 4 * p
}

const esperar = ms => new Promise(r => setTimeout(r, ms))
const cuadro = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
async function hasta(cond, ms = 6000) {
  const fin = Date.now() + ms
  while (Date.now() < fin) {
    try { if (cond()) return true } catch {}
    await esperar(80)
  }
  return false
}
async function tilesListos(map, ms = 6000) {
  const pendientes = []
  map.eachLayer(l => { if (typeof l.isLoading === 'function' && l.isLoading()) pendientes.push(new Promise(r => l.once('load', r))) })
  await Promise.race([Promise.all(pendientes), esperar(ms)])
}
const capActivo = () => capsDe(ctx.g3 || {}).activo

// Ojos: todas las capas imprimibles apagadas salvo las de la hoja.
function aplicarOjos(claves) {
  const on = new Set(claves)
  ctx.onGrupo(TODAS.filter(k => !on.has(k)), false)
  ctx.onGrupo([...on], true)
}
function restaurarOjos(orig) {
  const valor = k => orig[k] !== false
  const claves = [...new Set([...TODAS, ...Object.keys(orig)])]
  const base = claves.filter(k => !k.includes(':')), sub = claves.filter(k => k.includes(':'))
  for (const lista of [base, sub]) {
    const si = lista.filter(valor), no = lista.filter(k => !valor(k))
    if (si.length) ctx.onGrupo(si, true)
    if (no.length) ctx.onGrupo(no, false)
  }
}

async function irAFase(curso) {
  if (!curso) return true
  if (curso.bando === 'teatro') {
    const T = window.SIDPicbTeatro
    if (curso.cae === 'base' && typeof T?.verFase !== 'function') return true   // ejercicio sin Teatro: la carta base es la carta sola
    const ok = T?.verFase?.(curso.cae, curso.idx); await cuadro(); return !!ok
  }
  if (curso.bando === 'propio') {
    if (capActivo() === curso.n && ctx.activa?.bando === 'propio' && ctx.activa.idx === curso.idx) return true
    ctx.onFase(curso.n, curso.idx)
    return hasta(() => capActivo() === curso.n && ctx.activa?.bando === 'propio' && ctx.activa.idx === curso.idx, 9000)
  }
  if (ctx.activa?.bando === 'enemigo' && ctx.activa.idx === curso.idx) return true
  if (!ctx.onFaseEnemigo) await abrirG2()
  if (!ctx.onFaseEnemigo) return false
  ctx.onFaseEnemigo('enemigo', curso.idx)
  return hasta(() => ctx.activa?.bando === 'enemigo' && ctx.activa.idx === curso.idx)
}
// Los botones de fase de los CAE se dibujan sólo con el grupo G-2 desplegado.
async function abrirG2() {
  const b = [...document.querySelectorAll('button.ver-cab')].find(x => /Producto del G-2/.test(x.getAttribute('aria-label') || ''))
  if (b && b.getAttribute('aria-expanded') !== 'true') { b.click(); await hasta(() => ctx.onFaseEnemigo, 2000) }
}

// 🌎 Las capas del PICB del Teatro van en sus propios paneles de Leaflet (sidpt*): salen sólo en las hojas del Teatro
// y al terminar vuelven como estaban. Con hojas del Teatro el encuadre suma su Área de Interés (el A.O. de la Mesa suele
// ser un solo subteatro y cortaba medio teatro).
const panesOrig = new Map()
function verPanesTeatro(map, ver) {
  for (const [n, p] of Object.entries(map._panes || {})) {
    if (!n.startsWith('sidpt')) continue
    if (!panesOrig.has(p)) panesOrig.set(p, p.style.display)
    p.style.display = ver === null || ver ? panesOrig.get(p) : 'none'
  }
  if (ver === null) panesOrig.clear()
}
function limitesTeatro(hojas) {
  if (!hojas.some(h => h.curso?.bando === 'teatro')) return null
  const anillo = window.SIDPicbTeatro?.estado?.()?.ai?.anillo
  return anillo?.length ? limitesEncuadre('ai', { aoi: { coordinates: anillo } }) : null
}
function unirLimites(a, b) {
  if (!a || !b) return a || b
  return [[Math.min(a[0][0], b[0][0]), Math.min(a[0][1], b[0][1])], [Math.max(a[1][0], b[1][0]), Math.max(a[1][1], b[1][1])]]
}

// ── Foto de la carta (clon del DOM de Leaflet) ───────────────────────────────────────────────────────
function foto(map, { conCarta }, teatro = false) {
  const cont = map.getContainer(), pane = map.getPane('mapPane')
  const clon = pane.cloneNode(true)
  const oc = pane.querySelectorAll('canvas'), cc = clon.querySelectorAll('canvas')
  oc.forEach((c, i) => {
    const destino = cc[i]
    if (!destino) return
    const esTile = c.classList.contains('leaflet-tile')
    if (esTile && !conCarta) { destino.remove(); return }
    try {
      const img = document.createElement('img')
      img.src = c.toDataURL('image/png')
      img.className = c.className
      img.style.cssText = 'position:absolute;left:0;top:0;' + c.style.cssText   // como «.leaflet-pane > canvas»: si un panel tiene varios lienzos, no se apilan fuera de la hoja
      img.style.width = img.style.width || `${c.clientWidth || c.width}px`
      img.style.height = img.style.height || `${c.clientHeight || c.height}px`
      destino.replaceWith(img)
    } catch { destino.remove() }
  })
  if (!conCarta) clon.querySelectorAll('.leaflet-tile-pane, img.leaflet-tile, .leaflet-tile-container').forEach(e => e.remove())
  clon.querySelectorAll('.leaflet-popup-pane > *').forEach(e => e.remove())
  // 🌎 Hoja de una fase del Teatro: fuera los rótulos D+n de los itinerarios (tapan las fichas de la fase); quedan los de origen «DEOP n · D».
  if (teatro) clon.querySelectorAll('.sidpt-dn').forEach(e => { if (!/^DEOP/.test(e.querySelector('small')?.textContent || '')) (e.closest('.leaflet-marker-icon') || e).remove() })
  return `<div class="${cont.className}" style="position:relative;width:${cont.clientWidth}px;height:${cont.clientHeight}px;overflow:hidden;background:${conCarta ? '#fff' : 'transparent'}">${clon.outerHTML}</div>`
}

function escalaDe(map, k) {
  const cont = map.getContainer(), w = cont.clientWidth, y = cont.clientHeight / 2
  const metros = map.distance(map.containerPointToLatLng([0, y]), map.containerPointToLatLng([w, y]))
  const mPorPxPapel = metros / w * k                    // metros por px CSS impreso
  const den = mPorPxPapel / (25.4 / 96 / 1000)          // 1 px CSS = 25.4/96 mm
  const anchoMetros = mPorPxPapel * 160
  const barra = escalaRedonda(anchoMetros)
  return { den: escalaRedonda(den), barraM: barra, barraPx: barra / mPorPxPapel }
}

// ── Diálogo ──────────────────────────────────────────────────────────────────────────────────────────
const CSS = `
.sidif-fondo{position:fixed;inset:0;z-index:2147482000;background:rgba(4,10,18,.72);display:grid;place-items:center}
.sidif{width:min(760px,94vw);max-height:90vh;overflow:auto;background:#0f1d2a;color:#dbe9f2;border:1px solid #3c5268;border-radius:10px;padding:14px 16px;font:13px system-ui,sans-serif;box-shadow:0 10px 40px #000a}
.sidif h3{margin:0 0 6px;font-size:15px;color:#5ce1ff}.sidif small{color:#9fb3c6}
.sidif fieldset{border:1px solid #2c4255;border-radius:7px;margin:10px 0;padding:8px 10px}
.sidif legend{color:#ffd27a;font-weight:700;padding:0 4px}
.sidif label{display:flex;gap:6px;align-items:flex-start;margin:3px 0;cursor:pointer}
.sidif .cursos{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}
.sidif .curso{border:1px solid #2c4255;border-radius:6px;padding:6px}
.sidif .curso b{display:block;margin-bottom:3px}
.sidif .fila{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
.sidif .acciones{display:flex;gap:8px;justify-content:flex-end;margin-top:10px;position:sticky;bottom:-14px;background:#0f1d2a;padding:8px 0}
.sidif button{padding:7px 12px;border-radius:6px;border:1px solid #3c5268;background:#101f2c;color:#dbe9f2;cursor:pointer}
.sidif button.si{background:#1d6f86;border-color:#5ce1ff;color:#fff;font-weight:700}
.sidif .aviso{color:#ffb37a}
.sidif-prog{position:fixed;inset:0;z-index:2147483000;background:rgba(6,14,22,.96);color:#dbe9f2;display:grid;place-items:center;font:15px system-ui,sans-serif;text-align:center}
.sidif-prog button{margin-top:14px;padding:7px 14px;border-radius:6px;border:1px solid #3c5268;background:#101f2c;color:#dbe9f2;cursor:pointer}`
function estilo() {
  if (document.getElementById('sidif-css')) return
  const s = document.createElement('style'); s.id = 'sidif-css'; s.textContent = CSS; document.head.append(s)
}
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function cursosDisponibles() {
  const fc = ctx.fasesCOA || {}, caps = capsDe(ctx.g3 || {})
  const lista = []
  for (const n of [1, 2]) {
    const fases = (n === caps.activo ? fc.propio : caps.guardados?.[n]?.fases) || []
    lista.push({ id: `cap${n}`, nombre: `CAP ${n}${n === caps.activo ? ' (en la Mesa)' : ''}`, bando: 'propio', otro: n !== caps.activo,
      fases: fases.map((f, idx) => ({ bando: 'propio', n, idx, titulo: `CAP ${n} · Fase ${idx + 1}${f?.nombre ? ' · ' + f.nombre : ''}` })) })
  }
  const enemigo = { probable: [], peligroso: [] }
  ;(fc.enemigo || []).forEach((f, idx) => {
    const k = f?.coa === 'peligroso' ? 'peligroso' : 'probable'
    const nom = k === 'peligroso' ? 'CAE más peligroso' : 'CAE más probable'
    enemigo[k].push({ bando: 'enemigo', idx, titulo: `${nom} · Fase ${f?.n || enemigo[k].length + 1}${f?.nombre ? ' · ' + f.nombre : ''}` })
  })
  lista.push({ id: 'probable', nombre: 'CAE más probable', bando: 'enemigo', fases: enemigo.probable })
  lista.push({ id: 'peligroso', nombre: 'CAE más peligroso', bando: 'enemigo', fases: enemigo.peligroso })
  lista.push(...cursosTeatro())
  return lista
}

// 🌎 FASES ROJO del Teatro: los CAE por fases del PICB del Teatro (paso 4); sólo las fases con fichas en la carta.
export function cursosTeatro(T = typeof window !== 'undefined' ? window.SIDPicbTeatro : null) {
  if (typeof T?.verFase !== 'function') return []
  const caes = T.vista?.()?.caes || {}
  const lista = []
  // 🗺️ 17-11-2026 · los CALCOS DEL TEATRO sueltos: uno por hoja, sin fase (van encima de la carta base).
  if (T.estado?.()?.nivel?.teatro) lista.push({ id: 'teatro-capas', nombre: '🌎 CALCOS DEL TEATRO · uno por hoja', bando: 'teatro', sinMarcar: true,
    fases: CAPAS_TEATRO.map(([k, nom]) => ({ bando: 'teatro', cae: `capa:${k}`, idx: null, corto: nom, titulo: `Calco del Teatro · ${nom}` })) })
  for (const [k, nom] of [['probable', 'más probable'], ['peligroso', 'más peligroso']]) {
    const c = caes[k], cid = c?.id || (k === 'peligroso' ? 'CAE-2' : 'CAE-1')
    const fases = (c?.fases || []).map((f, idx) => ({ f, idx })).filter(({ f }) => (f?.acciones || []).some(a => Number.isFinite(a?.lat) && Number.isFinite(a?.lng)))
    if (!fases.length) continue
    lista.push({ id: `teatro-${k}`, nombre: `🌎 FASES ROJO · ${cid} ${nom} (Teatro)`, bando: 'teatro', fases: fases.map(({ f, idx }) => {
      const corto = `${f.id || `Fase ${idx + 1}`}${f.nombre ? ` ${f.nombre}` : ''}${f.ventana ? ` (${f.ventana})` : ''}`
      return { bando: 'teatro', cae: k, idx, corto, titulo: `${cid} ${nom} · ${corto}` }
    }) })
  }
  // 🔵 FASES AZUL (paso 5) y ⚔ ENFRENTAMIENTO (el CAE que enfrenta el CAP, y el CAP): una hoja por fase; sin marcar de entrada.
  const cap = typeof T.capAzul === 'function' ? T.capAzul() : null
  if (cap?.fases?.length) {
    const cid = caes[cap.frente]?.id || 'CAE'
    for (const [k, nombre, pre] of [['azul', `🌎 FASES AZUL · CAP del Teatro (frente al ${cid})`, 'CAP azul'], ['ambos', `🌎 ENFRENTAMIENTO · ${cid} contra el CAP azul`, `${cid} contra CAP`]]) {
      lista.push({ id: `teatro-${k}`, nombre, bando: 'teatro', sinMarcar: true, fases: cap.fases.map((f, idx) => {
        const corto = `${f.id} ${k === 'azul' ? f.nombre : 'rojo y azul'} (${f.ventana})`
        return { bando: 'teatro', cae: k, idx, corto, titulo: `${pre} · ${corto}` }
      }) })
    }
  }
  // 🚚 15-11-2026 · APOYO LOGÍSTICO (paso 6 del Teatro): el calco de apoyo logístico de cada fase (BL, SB, SE, SA por CE,
  // BR, EPA, DMA y a quién apoya cada una) sobre las fichas azules de esa fase.
  const lg = typeof T.logistica === 'function' ? T.logistica() : null
  if (lg?.fases?.length) lista.push({ id: 'teatro-logistica', nombre: '🌎 APOYO LOGÍSTICO · calco de apoyo logístico y de personal (Teatro)', bando: 'teatro', sinMarcar: true,
    fases: lg.fases.map((f, idx) => { const corto = `${f.id} ${f.nombre} (${f.ventana || ''})`; return { bando: 'teatro', cae: 'logistica', idx, corto, titulo: `Apoyo logístico · ${corto}` } }) })
  return lista
}

// 🗺️ Atajo del panel 🌎 PICB del Teatro: el mismo diálogo, con la CARTA BASE y los calcos del Teatro ya marcados.
export function abrirCalcos() { return abrirImpresion({ preset: 'teatro' }) }

export function abrirImpresion({ preset = '' } = {}) {
  estilo()
  if (!ctx.onGrupo || !ctx.onFase) { alert('Abrí primero la MESA (la carta con el panel de capas a la izquierda) y volvé a intentar.'); return }
  const cursos = cursosDisponibles(), hayTeatro = cursos.some(c => c.bando === 'teatro')
  const teatro = preset === 'teatro' && hayTeatro
  const marcado = (c) => teatro ? (c.id === 'teatro-capas' ? 'checked' : '') : (c.otro || c.sinMarcar ? '' : 'checked')
  const fondo = document.createElement('div'); fondo.className = 'sidif-fondo'
  const caja = document.createElement('div'); caja.className = 'sidif'; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-label', 'Imprimir por fases y capas')
  caja.innerHTML = `
<h3>${teatro ? '🗺️ Carta base y calcos del Teatro' : '🖨️ Imprimir cursos de acción por FASES y por CAPAS'}</h3>
<small>Primero la <b>carta base</b> en papel normal; después, con el mismo encuadre y las mismas cruces de registro, el <b>calco de cada fase u opción</b> en papel mantequilla, para superponerlos sobre ella.</small>
<fieldset><legend>1 · Cursos y fases</legend><div class="cursos">${cursos.map(c => `
  <div class="curso"><b>${esc(c.nombre)}</b>${c.fases.length ? c.fases.map((f, i) => `
    <label><input type="checkbox" data-curso="${c.id}" data-i="${i}" ${marcado(c)}> ${esc(f.corto || f.titulo.replace(/^.*? · Fase/, 'Fase'))}</label>`).join('') : '<small>Sin fases guardadas.</small>'}
    ${c.otro && c.fases.length ? '<small class="aviso">Para imprimirlo la Mesa pasa a este CAP y al final vuelve al que tenías.</small>' : ''}</div>`).join('')}
</div>${!hayTeatro && window.SIDPicbTeatro?.estado?.()?.nivel?.teatro ? '<small class="aviso">🌎 Para imprimir las FASES ROJO del Teatro: abrí el PICB del Teatro en el paso 4 · CAE, con las DEOP cargadas, y volvé a abrir este diálogo.</small>' : ''}</fieldset>
<fieldset><legend>2 · Capas</legend>${CAPAS.filter(c => !c.teatro || hayTeatro).map(c => `
  <label><input type="checkbox" data-capa="${c.id}" ${(teatro ? c.id === 'teatro' : c.def) ? 'checked' : ''}> ${esc(c.nom)}${c.fase ? '' : ' <small>(no cambia con la fase)</small>'}</label>`).join('')}
  <label><input type="checkbox" data-ref checked> Área de Operaciones, Área de Interés y de Influencia en todas las hojas <small>(referencia para superponer)</small></label>
</fieldset>
<fieldset><legend>3 · Cómo salen las hojas</legend>
  <label style="border:1px solid #2c4255;border-radius:6px;padding:5px 7px;background:#10303a"><input type="checkbox" data-base ${teatro ? 'checked' : ''}> <span><b>🗺️ Hoja 1: la CARTA BASE</b> (la carta sola, con el relieve, los caminos y las poblaciones) y <b>los calcos transparentes</b> encima <small>— así se imprime la carta base en papel normal y cada calco en papel mantequilla</small></span></label>
  <label><input type="radio" name="sidif-modo" value="juntas" checked> <span><b>Una hoja por fase</b>, con todas las capas elegidas juntas</span></label>
  <label><input type="radio" name="sidif-modo" value="separadas"> <span><b>Una hoja por capa y por fase</b> (calcos sueltos para superponer)</span></label>
  <div class="fila" style="margin-top:6px">
    <span>Encuadre:</span>
    <label><input type="radio" name="sidif-enc" value="ambas" checked> A.O. + Área de Interés</label>
    <label><input type="radio" name="sidif-enc" value="ao"> Sólo A.O.</label>
    <label><input type="radio" name="sidif-enc" value="ai"> Sólo Área de Interés</label>
    <label><input type="radio" name="sidif-enc" value="vista"> Lo que veo ahora</label>
  </div>
  <div class="fila">
    <span>Hoja carta:</span>
    <label><input type="radio" name="sidif-ori" value="auto" checked> Auto</label>
    <label><input type="radio" name="sidif-ori" value="landscape"> Horizontal</label>
    <label><input type="radio" name="sidif-ori" value="portrait"> Vertical</label>
    <span style="margin-left:10px">Fichas:</span>
    <select data-fichas><option value="grandes">grandes</option><option value="normales" selected>normales</option><option value="chicas">chicas (más detalle)</option></select>
  </div>
  <label><input type="checkbox" data-carta checked> Con la carta de fondo en los calcos <small>(no se usa si pedís la carta base: ahí los calcos salen transparentes)</small></label>
</fieldset>
<div class="acciones"><small data-cuenta style="margin-right:auto;align-self:center"></small><button data-cerrar>Cancelar</button><button class="si" data-ir>Preparar hojas</button></div>`
  fondo.append(caja); document.body.append(fondo)
  const leer = () => {
    const sel = []
    caja.querySelectorAll('input[data-curso]').forEach(i => { if (i.checked) sel.push(cursos.find(c => c.id === i.dataset.curso).fases[+i.dataset.i]) })
    return {
      cursos: sel,
      capas: [...caja.querySelectorAll('input[data-capa]')].filter(i => i.checked).map(i => i.dataset.capa),
      referencia: caja.querySelector('[data-ref]').checked,
      modo: caja.querySelector('input[name=sidif-modo]:checked').value,
      encuadre: caja.querySelector('input[name=sidif-enc]:checked').value,
      orientacion: caja.querySelector('input[name=sidif-ori]:checked').value,
      fichas: caja.querySelector('[data-fichas]').value,
      base: caja.querySelector('[data-base]').checked,
      conCarta: caja.querySelector('[data-carta]').checked
    }
  }
  const contar = () => {
    const n = planDeHojas(leer()).length
    caja.querySelector('[data-cuenta]').textContent = `${n} hoja${n === 1 ? '' : 's'}`
    caja.querySelector('[data-ir]').disabled = !n
  }
  caja.addEventListener('change', contar); contar()
  const cerrar = () => fondo.remove()
  fondo.addEventListener('click', e => { if (e.target === fondo) cerrar() })
  caja.querySelector('[data-cerrar]').onclick = cerrar
  caja.querySelector('[data-ir]').onclick = () => { const op = leer(); cerrar(); generar(op) }
}

// ── Armado de las hojas ──────────────────────────────────────────────────────────────────────────────
let corriendo = false
export async function generar(op) {
  if (corriendo) return
  const map = window.__mapa2d
  if (!map || !map.getContainer().getClientRects().length) { alert('Pasá la carta a 2D para imprimir (el botón 2D de arriba).'); return }
  const hojas = planDeHojas(op)
  if (!hojas.length) return
  corriendo = true
  const cont = map.getContainer()
  const orig = { ver: { ...(ctx.verCapa || {}) }, activa: ctx.activa ? { ...ctx.activa } : null, cap: capActivo(),
    centro: map.getCenter(), zoom: map.getZoom(), css: cont.style.cssText, snap: map.options.zoomSnap, confirm: window.confirm }
  const prog = document.createElement('div'); prog.className = 'sidif-prog'
  prog.innerHTML = '<div><div data-t>Preparando…</div><button data-x>Cancelar</button></div>'
  let cancelado = false
  prog.querySelector('[data-x]').onclick = () => { cancelado = true }
  document.body.append(prog)
  const t = s => { prog.querySelector('[data-t]').textContent = s }
  const salida = [], avisos = []
  let geo = null
  try {
    window.confirm = () => true   // el «¿pasar al CAP n?» ya lo aceptó al elegir ese CAP en el diálogo
    const lim = op.encuadre === 'vista' ? null : unirLimites(limitesEncuadre(op.encuadre, ctx), limitesTeatro(hojas))
    const vista = map.getBounds()
    const caja = lim || [[vista.getSouth(), vista.getWest()], [vista.getNorth(), vista.getEast()]]
    const altoGeo = map.latLngToContainerPoint([caja[0][0], caja[0][1]]).y - map.latLngToContainerPoint([caja[1][0], caja[1][1]]).y
    const anchoGeo = map.latLngToContainerPoint([caja[0][0], caja[1][1]]).x - map.latLngToContainerPoint([caja[0][0], caja[0][1]]).x
    const ori = op.orientacion === 'auto' ? (Math.abs(anchoGeo) >= Math.abs(altoGeo) ? 'landscape' : 'portrait') : op.orientacion
    const k = FICHAS[op.fichas] || 1.35, papel = PAPEL[ori]
    const W = Math.round(papel.w * k), H = Math.round(papel.h * k)
    cont.style.cssText = `${orig.css};position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:1`
    map.invalidateSize({ pan: false })
    map.options.zoomSnap = 0
    map.fitBounds(caja, { padding: [Math.round(12 * k), Math.round(12 * k)], animate: false })
    if (!lim && op.encuadre !== 'vista') avisos.push('No encontré el A.O. ni el Área de Interés: se usó la vista actual.')
    const vistaFija = { c: map.getCenter(), z: map.getZoom() }
    geo = { k, ori, papel, escala: null }
    for (let i = 0; i < hojas.length && !cancelado; i++) {
      const h = hojas[i]
      t(`Hoja ${i + 1} de ${hojas.length} · ${h.titulo}`)
      if (!(await irAFase(h.curso))) { avisos.push(`No se pudo mostrar «${h.titulo}» (¿ejercicio bloqueado?). Se omitió.`); continue }
      aplicarOjos(h.claves)
      verPanesTeatro(map, h.capas.includes('teatro'))
      await cuadro(); await esperar(450)
      map.setView(vistaFija.c, vistaFija.z, { animate: false })   // pasar de CAP puede mover la carta
      await tilesListos(map); await cuadro(); await esperar(150)
      geo.escala = geo.escala || escalaDe(map, k)
      salida.push({ ...h, html: foto(map, { conCarta: h.conCarta ?? op.conCarta }, h.curso?.bando === 'teatro' && !h.base) })
    }
  } catch (e) {
    avisos.push('Error al armar las hojas: ' + (e?.message || e))
  } finally {
    t('Devolviendo la Mesa como estaba…')
    try {
      if (orig.cap && capActivo() !== orig.cap) await irAFase({ bando: 'propio', n: orig.cap, idx: orig.activa?.bando === 'propio' ? orig.activa.idx : 0 })
      if (orig.activa) await irAFase(orig.activa.bando === 'propio' ? { bando: 'propio', n: orig.cap, idx: orig.activa.idx } : { bando: 'enemigo', idx: orig.activa.idx })
      restaurarOjos(orig.ver)
    } catch {}
    try { window.SIDPicbTeatro?.verFase?.(null); verPanesTeatro(map, null) } catch {}
    window.confirm = orig.confirm
    cont.style.cssText = orig.css
    map.options.zoomSnap = orig.snap
    map.invalidateSize({ pan: false })
    map.setView(orig.centro, orig.zoom, { animate: false })
    prog.remove()
    corriendo = false
  }
  if (salida.length) abrirVentana(salida, geo, avisos, op)
  else alert(avisos.join('\n') || 'No se armó ninguna hoja.')
}

// ── Ventana de impresión ─────────────────────────────────────────────────────────────────────────────
function cruces(w, h) {
  const m = 14, l = 9
  const cruz = (x, y) => `<path d="M${x - l} ${y}H${x + l}M${x} ${y - l}V${y + l}"/><circle cx="${x}" cy="${y}" r="4"/>`
  return `<svg class="reg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${[[m, m], [w - m, m], [m, h - m], [w - m, h - m], [w / 2, m], [w / 2, h - m]].map(([x, y]) => cruz(x, y)).join('')}
  <g transform="translate(${w - 34} 34)"><path d="M0 -16 L7 8 L0 3 L-7 8Z" fill="#000"/><text y="22" text-anchor="middle" font-size="11" font-weight="700">N</text></g></svg>`
}
// 🗺️ 17-11-2026 · Si el navegador bloquea la ventana nueva (pasa seguido: las hojas se arman un rato después del clic,
// y ahí Chrome ya no la considera pedida por el usuario), las hojas se muestran acá mismo, en un marco a pantalla
// completa con los mismos botones: 🖨️ Imprimir imprime el marco y 💾 Descargar guarda el .html igual.
function marcoDeHojas() {
  try {
    const fondo = document.createElement('div')
    fondo.className = 'sidif-hojas'
    fondo.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:#666'
    const marco = document.createElement('iframe')
    marco.title = 'Hojas para imprimir'
    marco.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#666'
    const x = document.createElement('button')
    x.textContent = '✕ Cerrar las hojas'
    x.style.cssText = 'position:absolute;right:12px;top:7px;z-index:3;padding:6px 11px;border-radius:6px;border:1px solid #3c5268;background:#101f2c;color:#dbe9f2;font:13px system-ui,sans-serif;cursor:pointer'
    x.onclick = () => fondo.remove()
    fondo.append(marco, x)
    document.body.append(fondo)
    return marco.contentWindow
  } catch (e) { return null }
}
function abrirVentana(hojas, geo, avisos, op) {
  let w = window.open('', '_blank'), enMarco = false
  if (!w) { w = marcoDeHojas(); enMarco = true }
  if (!w) { alert('No se pudieron mostrar las hojas: permití las ventanas emergentes y volvé a intentar.'); return }
  const { papel, k, escala, ori } = geo
  // El CSS va COPIADO (Leaflet incluido): con sólo los <link> la hoja se dibuja antes de que carguen y los paneles
  // de la carta quedan apilados (hoja en blanco). Los <link> siguen después para las url() relativas.
  const texto = [...document.styleSheets].map(h => {
    if (h.ownerNode?.id === 'sidif-css') return ''
    try { return [...h.cssRules].map(r => r.cssText).join('\n') } catch { return '' }
  }).join('\n').replace(/<\/style/gi, '<\\/style')
  const estilos = `<style>${texto}</style>\n` + [...document.querySelectorAll('link[rel="stylesheet"]')].map(n => `<link rel="stylesheet" href="${esc(n.href)}">`).join('\n')
  const fecha = new Date().toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })
  const km = escala.barraM >= 1000 ? `${+(escala.barraM / 1000).toFixed(2)} km` : `${Math.round(escala.barraM)} m`
  const total = hojas.length
  const nomEj = (() => { try { return window.SIDPicbTeatro?.estado?.()?.nombre || window.SIDMesaEjercicio?.foto?.()?.nombre || '' } catch { return '' } })()
  const archivo = `${op.base ? 'CARTA BASE Y CALCOS' : 'CALCOS'}${nomEj ? ' - ' + nomEj : ''} - ${new Date().toISOString().slice(0, 10)}.html`.replace(/[\\/:*?"<>|]/g, '-')
  const cuerpo = hojas.map((h, i) => `
<section class="hoja${h.base ? ' base' : ''}">
  <header><b>${esc(h.titulo)}</b><span>${esc(h.sub)}</span></header>
  <div class="marco" style="width:${papel.w}px;height:${papel.h}px">
    <div class="esc" style="transform:scale(${1 / k})">${h.html}</div>
    ${cruces(papel.w, papel.h)}
  </div>
  <footer><span class="barra"><i style="width:${escala.barraPx.toFixed(1)}px"></i> ${km}</span><span>Escala aprox. 1:${escala.den.toLocaleString('es-BO')} (impreso en carta, sin «ajustar a la página»)</span><span>SIDECEME · Mesa · ${esc(fecha)} · hoja ${i + 1}/${total}</span></footer>
</section>`).join('')
  w.document.open()
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><base href="${esc(location.href)}"><title>Cursos de acción por fases y capas</title>
${estilos}
<style>
@page{size:letter ${ori};margin:8mm}
html,body{margin:0;background:#666;overflow:auto!important;height:auto!important}
body{font:12px Arial,sans-serif;color:#000}
.barra-imp{position:sticky;top:0;z-index:10;background:#0f1d2a;color:#dbe9f2;padding:8px 12px;display:flex;gap:10px;align-items:center}
.barra-imp button{padding:6px 12px;font-weight:700;cursor:pointer}
.hoja{background:#fff;width:${papel.w}px;margin:12px auto;padding:0;page-break-after:always;break-after:page;overflow:hidden}
.hoja:last-child{page-break-after:auto;break-after:auto}
.hoja header{display:flex;gap:12px;align-items:baseline;height:24px;border-bottom:2px solid #000;margin-bottom:3px;overflow:hidden;white-space:nowrap}
.hoja header b{font-size:14px}.hoja header span{font-size:10px;color:#333;overflow:hidden;text-overflow:ellipsis}
.marco{position:relative;overflow:hidden;border:1px solid #000;box-sizing:border-box}
.esc{position:absolute;left:0;top:0;transform-origin:0 0}
.esc .leaflet-container{background:transparent!important}
.hoja .sidpt-fch{font-size:12.5px}
.hoja .sidpt-fch,.hoja .sidpt-dn,.hoja .sidpt-ainl{width:max-content}
.reg{position:absolute;left:0;top:0;pointer-events:none;stroke:#000;stroke-width:1.2;fill:none}
.hoja footer{display:flex;justify-content:space-between;gap:8px;font-size:9px;height:16px;align-items:center;margin-top:3px}
.barra i{display:inline-block;height:5px;border:1px solid #000;background:repeating-linear-gradient(90deg,#000 0 25%,#fff 25% 50%);vertical-align:middle}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
@media print{html,body{background:#fff}.barra-imp{display:none}.hoja{margin:0}}
</style></head><body>
<div class="barra-imp"><button onclick="print()">🖨️ Imprimir ${total} hoja${total === 1 ? '' : 's'}</button>
<button onclick="sidGuardar()" title="Guarda estas mismas hojas en un archivo .html: se abre y se imprime después, sin conexión">💾 Descargar las hojas (.html)</button>
<span>En el diálogo: tamaño <b>Carta</b>, ${ori === 'landscape' ? '<b>horizontal</b>' : '<b>vertical</b>'}, escala <b>100 %</b> (no «ajustar»), gráficos de fondo activados. Para PDF elegí «Guardar como PDF».${op.base ? ' La <b>carta base</b> va en papel normal y los calcos en papel mantequilla, encima.' : ''}</span>
${enMarco ? '<span style="color:#ffb37a">Las hojas se abrieron acá porque el navegador bloqueó la ventana nueva: se imprimen y se descargan igual (✕ arriba a la derecha para cerrarlas).</span>' : ''}
${avisos.length ? `<span style="color:#ffb37a">⚠ ${esc(avisos.join(' · '))}</span>` : ''}</div>
${cuerpo}
</body></html>`)
  w.document.close()
  // 💾 Descargar: el mismo documento (las hojas ya están adentro: la carta y los calcos son imágenes y SVG) en un .html.
  const sc = w.document.createElement('script')
  sc.textContent = `function sidGuardar(){try{const d=document.documentElement.cloneNode(true);const b=d.querySelector('.barra-imp');if(b)b.remove();const f=new Blob(['<!doctype html>\\n'+d.outerHTML],{type:'text/html;charset=utf-8'});const u=URL.createObjectURL(f);const a=document.createElement('a');a.href=u;a.download=${JSON.stringify(archivo)};document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),8000)}catch(e){alert('No se pudo descargar: '+((e&&e.message)||e))}}`
  w.document.body.appendChild(sc)
}

if (typeof window !== 'undefined') {
  window.SIDImpresionFases = { registrar, abrir: abrirImpresion, abrirCalcos, generar, planDeHojas, ctx }
  // Un acceso dentro del «🖨️ IMPRIMIR POR CAPAS» que ya abre el botón IMPRIMIR de la Mesa.
  const inyectar = () => {
    const modal = document.querySelector('.modal-impresion')
    if (!modal || modal.querySelector('[data-sidif]')) return
    const d = document.createElement('div')
    d.setAttribute('data-sidif', '')
    d.style.cssText = 'margin:8px 0;padding:8px 10px;border:1px solid #5ce1ff;border-radius:7px;background:#10303a'
    d.innerHTML = '<b>🎬 Carta base y calcos por FASES y CAPAS</b><br><small>La carta base en papel normal y encima, transparente, el calco de cada fase u opción: CAP 1 y 2, CAE más probable y más peligroso, plantilla doctrinal, fuegos, barreras y los calcos del Teatro. Todo encuadrado al A.O. y al Área de Interés.</small><br>'
    const b = document.createElement('button')
    b.className = 'btn-generar'; b.style.marginTop = '6px'; b.textContent = '🖨️ Elegir fases y capas…'
    b.onclick = () => { modal.closest('.modal-fondo')?.click(); abrirImpresion() }
    d.append(b)
    const cab = modal.querySelector('.cmoc-cab')
    cab ? cab.after(d) : modal.prepend(d)
  }
  document.addEventListener('click', e => {
    const b = e.target?.closest?.('button')
    if (b && /IMPRIMIR/i.test(b.textContent || '') && !b.closest('.modal-impresion, .sidif')) setTimeout(inyectar, 80)
  }, true)
}
