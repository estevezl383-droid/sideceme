// v2.9.486 — 🚚 LOGÍSTICA y 👥 PERSONAL A ESCALA TEATRO (15-11-2026): las hojas del G-4 y del G-1 cuando la partida
// es de teatro y trae las instalaciones del PICB del Teatro (paso 6). El motor (wargame-ops, logisticaTeatro) mueve
// las toneladas y los hombres; acá se ve cómo está cada eslabón y se dan las tres órdenes logísticas:
//   · ⭐ PRIORIDAD: la instalación (o el BR) «apoya» primero a una GU  → orden `apoyar` con objetivo;
//   · 📨 PEDIDO DE EMERGENCIA de reemplazos a la Zona del Interior     → orden `apoyar` del BR con misión «emergencia»;
//   · 📍 DESPLAZAR una sección: se elige la ficha y se le da una orden de mover en la carta, como a cualquier otra.
// La pantalla (index.html) pasa las unidades de la consola y las funciones para ordenar y elegir.
const DMA_GU = 80, ALCANCE = 2, FACTOR = 1.3
const TIPO = { BL: '🏭 Base Logística', SB: '📦 Sección Base', SE: '📦 Sección Especial', SA: '🚚 Sección Avanzada', BR: '👥 Batallón de Reemplazos' }
const ESTADO = { operando: ['opera', '#4fd17f'], amenazada: ['AMENAZADA', '#ff6b6b'], desplazandose: ['se desplaza', '#ffd166'], instalandose: ['instalándose', '#ffd166'], capturada: ['CAPTURADA', '#ff6b6b'] }
const ORDEN = ['BL', 'SB', 'SE', 'SA', 'BR']
const R = (n) => Math.round(Number(n) || 0).toLocaleString('es-BO')
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
function kmCamino(a, b) {
  const r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lng - a.lng) * r
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h))) * FACTOR
}
export const logDe = (u) => (u && u.arma === 'logistica' && u.carga?.teatro?.log) || null
// v2.9.487 — 🚚 columna de transporte automática (empuje de la BL/SB/SE o retiro de un CE)
export const colDe = (u) => (u && u.arma === 'convoy' && u.carga?.teatro?.col) || null
const FASE = { base: ['en su base', '#8ea3b3'], carga: ['cargando', '#ffd166'], ida: ['en camino', '#5ce1ff'], descarga: ['descargando', '#ffd166'], vuelta: ['volviendo', '#8ec5ff'], destruida: ['DESTRUIDA', '#ff6b6b'] }
export const hayLogistica = (us) => (us || []).some((u) => logDe(u) && u.estado !== 'fuera_combate')
const viva = (u) => u && u.estado !== 'fuera_combate' && Number(u.poder_actual) > 0
const barra = (pct, col) => `<span style="display:inline-block;width:70px;height:7px;background:#1f3442;border-radius:4px;vertical-align:middle"><span style="display:block;height:7px;width:${Math.max(0, Math.min(100, pct))}%;background:${col};border-radius:4px"></span></span>`
// De qué instalación se abastece una GU (la misma regla que el motor): SA; si no, SE o SB; hasta 2 DMA.
export function apoyoDe(u, inst) {
  let m = null
  for (const x of inst) {
    const l = logDe(x)
    if (!l || x.bando !== u.bando || !viva(x) || l.estado !== 'operando' || !['SA', 'SE', 'SB'].includes(l.tipo)) continue
    const d = kmCamino(x, u), p = l.tipo === 'SA' ? ((l.apoya || []).includes(u.designacion) ? 0.75 : 1) : 1.15
    if (!m || d * p < m.p) m = { x, d, p: d * p }
  }
  return m && m.d <= DMA_GU * ALCANCE ? m : m ? { ...m, lejos: true } : null
}
const prioridadDe = (x, ordenes, us) => {
  const o = (ordenes || []).find((y) => String(y.unidad_id) === String(x.id) && y.tipo === 'apoyar' && y.objetivo_id != null)
  return o ? us.find((u) => String(u.id) === String(o.objetivo_id)) || null : null
}
const elegirGU = (gus, accion, id, texto) => `<select data-lg="${accion}" data-id="${esc(id)}" style="max-width:150px;background:#0b1218;color:#dbe9f2;border:1px solid #31495a;border-radius:4px;font-size:11px"><option value="">${esc(texto)}</option>${gus.map((g) => `<option value="${esc(g.id)}">${esc(g.designacion)}</option>`).join('')}</select>`

// ── 📦 LOGÍSTICA (G-4) ──
export function panelLogistica(el, ctx) {
  const us = ctx.unidades || [], inst = us.filter(logDe), gus = us.filter((u) => !logDe(u) && u.escalon !== 'ejercito' && viva(u))
  if (!inst.length) { el.innerHTML = '<div class="rg-meta">🌎 Partida de TEATRO sin instalaciones logísticas: cada GU se reabastece cerca de su PC. Para jugar la logística, bajá del PICB del Teatro (paso 6) el «enfrentamiento CON logística» y volvé a importarlo.</div>'; return }
  const porDes = new Map(inst.map((x) => [x.bando + '|' + x.designacion, x]))
  const filas = inst.slice().sort((a, b) => (a.bando > b.bando ? 1 : a.bando < b.bando ? -1 : 0) || ORDEN.indexOf(logDe(a).tipo) - ORDEN.indexOf(logDe(b).tipo)).map((x) => {
    const l = logDe(x), st = ESTADO[x.estado === 'fuera_combate' ? 'capturada' : l.estado || 'operando'] || ESTADO.operando
    const de = l.de ? porDes.get(x.bando + '|' + l.de) : null
    const prio = prioridadDe(x, ctx.ordenes, us)
    const clientes = l.tipo === 'BR' ? gus.filter((g) => g.bando === x.bando) : [...inst.filter((y) => y.bando === x.bando && logDe(y).de === x.designacion), ...gus.filter((g) => g.bando === x.bando && apoyoDe(g, inst)?.x === x)]
    const stock = l.tipo === 'BR' ? `${R(l.hombres)} hombres` : `${R(l.t)} / ${R(l.max)} t ${barra((100 * (Number(l.t) || 0)) / Math.max(1, Number(l.max) || 1), '#5ce1ff')}`
    const puede = viva(x) && ctx.puede(x)
    // Una TARJETA por instalación (la hoja es angosta: en tabla, los botones quedaban cortados a la derecha).
    return `<div style="border-top:1px solid #1f3442;padding:6px 0">
      <div style="display:flex;justify-content:space-between;gap:6px;align-items:baseline"><b style="color:${x.bando === 'rojo' ? '#ff8a80' : '#8ec5ff'}">${esc(x.designacion)}</b><b style="color:${st[1]};white-space:nowrap">${st[0]}</b></div>
      <small style="color:#8ea3b3">${esc(TIPO[l.tipo] || l.tipo)}${l.ferro ? ' · 🚆' : ''}${de ? ` · de ${esc(de.designacion)} · ${R(kmCamino(de, x))} km` : l.tipo === 'BL' ? ' · de la Zona del Interior' : ''}</small>
      <div>${stock}${l.tipo !== 'BR' ? ` · <small>transporte ${R(l.cap)} t/día</small>` : ` · <small>procesa ${R(l.procesa)} por día</small>`}</div>
      <small>${clientes.length ? 'Apoya a ' + esc(clientes.map((c) => c.designacion).slice(0, 6).join(', ')) + (clientes.length > 6 ? '…' : '') : 'Sin a quién apoyar a su alcance'}</small>${prio ? `<br><small style="color:#ffd166">⭐ prioridad: ${esc(prio.designacion)}</small>` : ''}
      ${puede ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">${l.tipo !== 'BL' ? `<button class="rg-doc" data-lg="mover" data-id="${esc(x.id)}" title="Elegir la ficha para darle una orden de MOVER en la carta">📍 Desplazar</button>` : ''}${clientes.length ? elegirGU(clientes, 'prio', x.id, '⭐ Prioridad a…') : ''}</div>` : ''}</div>`
  }).join('')
  // v2.9.487: las columnas automáticas (no se les da orden: van y vuelven solas).
  const cols = us.filter(colDe).sort((a, b) => (a.bando > b.bando ? 1 : a.bando < b.bando ? -1 : 0) || (colDe(a).tipo > colDe(b).tipo ? 1 : -1))
  const filasCol = cols.map((c) => {
    const k = colDe(c), f = c.estado === 'fuera_combate' ? FASE.destruida : FASE[k.fase || 'base'] || FASE.base
    const hacia = k.tipo === 'empuje' ? `→ ${k.para || '?'}` : k.fase && k.fase !== 'base' ? `↔ ${k.dest || 'su apoyo'}` : `de ${k.base || '?'}`
    return `<div style="border-top:1px solid #1f3442;padding:4px 0"><div style="display:flex;justify-content:space-between;gap:6px"><b style="color:${c.bando === 'rojo' ? '#ff8a80' : '#8ec5ff'}">🚚 ${esc(c.designacion)}</b><b style="color:${f[1]};white-space:nowrap">${f[0]}</b></div>
      <small style="color:#8ea3b3">${k.tipo === 'empuje' ? 'empuje' : 'retiro'} ${esc(hacia)} · ${R(k.t)} de ${R(k.cap)} t a bordo · ${R(k.viajes)} viajes · ${R(k.entregado)} t entregadas${c.estado === 'fuera_combate' && k.reconst != null && ctx.hora ? ` · se reconstituye el ${esc(ctx.hora(k.reconst))}` : ''}</small></div>`
  }).join('')
  const filasGu = gus.filter((g) => inst.some((x) => x.bando === g.bando)).map((g) => {
    const t = g.carga?.teatro || {}, dos = Number.isFinite(Number(t.dos)) ? Number(t.dos) : 5, a = apoyoDe(g, inst)
    const col = dos >= 3 ? '#4fd17f' : dos >= 1 ? '#ffd166' : '#ff6b6b'
    return `<tr style="border-top:1px solid #1f3442"><td>${esc(g.designacion)}</td><td>${barra((dos / 5) * 100, col)} <b style="color:${col}">${dos.toFixed(1)} d</b></td>
      <td>${a ? `${esc(a.x.designacion)}<br><small style="color:${a.lejos ? '#ff6b6b' : a.d > DMA_GU ? '#ffd166' : '#4fd17f'}">${R(a.d)} km ${a.lejos ? '· FUERA DE ALCANCE' : a.d > DMA_GU ? `· más que la DMA (${DMA_GU})` : '✓'}</small>` : '<small style="color:#ff6b6b">sin instalación que lo apoye</small>'}</td></tr>`
  }).join('')
  el.innerHTML = `<div style="font-size:12px;line-height:1.35">
    <div class="rg-meta" style="margin-bottom:6px">🌎 <b>Cadena logística del teatro</b>: BL → Sección Base → (Especial) → Sección Avanzada de cada CE → GG.UU. Cada instalación mueve su transporte a la DMA (${DMA_GU} km a las GG.UU.); más lejos rinde menos. Con el enemigo a 30 km queda <b>amenazada</b> (no recibe ni distribuye) y si llega, <b>cae</b>.</div>
    ${filas}
    ${filasCol ? `<div style="margin:10px 0 2px;color:#5ce1ff"><b>🚚 Columnas de transporte (automáticas)</b></div><div class="rg-meta" style="margin-bottom:2px">Empuje: salen solas cuando su instalación baja del 75 % (o cada 24 h). Retiro: la columna del CE va a su SA cuando el CE baja de 3,5 días. Si el enemigo las alcanza, se pierden con su carga y se reconstituyen en 48 h.</div>${filasCol}` : ''}
    <div style="margin:10px 0 4px;color:#5ce1ff"><b>GG.UU.: días de abastecimiento y de dónde los toman</b></div>
    <table style="width:100%;border-collapse:collapse"><thead><tr style="color:#8ea3b3;text-align:left"><th>GU</th><th>Días</th><th>Se abastece de</th></tr></thead><tbody>${filasGu || '<tr><td colspan="3" class="rg-meta">Sin GG.UU. con logística.</td></tr>'}</tbody></table>
    <div class="rg-meta" style="margin-top:6px">Sin días de abastecimiento, la GU marcha y pelea a menos de la mitad. En contacto recibe la mitad. Los partes del día salen en la 📜 bitácora.</div></div>`
  enganchar(el, ctx)
}

// ── 👥 PERSONAL (G-1): bajas, reemplazos y el Batallón de Reemplazos ──
export function panelPersonal(el, ctx) {
  const us = ctx.unidades || [], inst = us.filter(logDe), brs = inst.filter((x) => logDe(x).tipo === 'BR')
  const gus = us.filter((u) => !logDe(u) && u.escalon !== 'ejercito')
  if (!brs.length) { el.innerHTML = '<div class="rg-meta">🌎 Partida de TEATRO sin Batallón de Reemplazos: las bajas no se reponen. Bajá del PICB del Teatro (paso 6) el «enfrentamiento CON logística» y volvé a importarlo.</div>'; return }
  const conBR = gus.filter((g) => brs.some((b) => b.bando === g.bando))
  const tot = { ef: 0, hom: 0, m: 0, h: 0, d: 0, rec: 0 }
  const filas = conBR.map((g) => {
    const t = g.carga?.teatro || {}, ef = Number(t.ef) || 0, hom = t.hom != null ? Number(t.hom) : ef, b = t.baj || {}
    const enCamino = (t.rc || []).reduce((a, q) => a + (Number(q[1]) || 0), 0)
    tot.ef += ef; tot.hom += hom; tot.m += Number(b.m) || 0; tot.h += Number(b.h) || 0; tot.d += Number(b.d) || 0; tot.rec += Number(t.recib) || 0
    const pct = ef ? Math.round((100 * hom) / ef) : 100, col = pct >= 85 ? '#4fd17f' : pct >= 70 ? '#ffd166' : '#ff6b6b'
    return `<tr style="border-top:1px solid #1f3442"><td>${esc(g.designacion)}${g.estado === 'fuera_combate' ? ' <small style="color:#ff6b6b">fuera de combate</small>' : ''}</td><td>${barra(pct, col)} <b style="color:${col}">${pct} %</b><br><small>${R(hom)} de ${R(ef)}</small></td>
      <td><small>${R(b.m)} m · ${R(b.h)} h · ${R(b.d)} d</small></td><td><small>${R(t.recib)} recibidos${enCamino >= 1 ? `<br>${R(enCamino)} en camino` : ''}${Number(t.pend) >= 1 ? `<br>${R(t.pend)} por integrar` : ''}</small></td></tr>`
  }).join('')
  const cajasBR = brs.map((x) => {
    const l = logDe(x), enRec = (l.cola || []).reduce((a, q) => a + (Number(q[1]) || 0), 0), prio = prioridadDe(x, ctx.ordenes, us), puede = viva(x) && ctx.puede(x)
    const ped = Array.isArray(l.ped) ? l.ped : null
    return `<div style="border:1px solid #31495a;border-radius:7px;padding:6px 8px;margin-bottom:6px"><b style="color:${x.bando === 'rojo' ? '#ff8a80' : '#8ec5ff'}">👥 ${esc(x.designacion)}</b> <small style="color:#8ea3b3">${R(l.cias)} Cías · procesa ${R(l.procesa)} por día</small><br>
      Disponibles: <b>${R(l.hombres)}</b> · heridos en recuperación (vuelven por el BR): <b>${R(enRec)}</b>${ped ? ` · 📨 pedido de emergencia: ${R(ped[1])} llegan el ${esc(ctx.hora ? ctx.hora(ped[0]) : '')}` : ''}${prio ? `<br><span style="color:#ffd166">⭐ prioridad de reemplazos: ${esc(prio.designacion)}</span>` : ''}
      ${puede ? `<div style="margin-top:4px">${elegirGU(gus.filter((g) => g.bando === x.bando && viva(g)), 'prio', x.id, '⭐ Prioridad de reemplazos a…')} <button class="rg-doc" data-lg="emergencia" data-id="${esc(x.id)}" ${ped ? 'disabled title="Ya hay un pedido en curso"' : ''}>📨 Pedido de emergencia (${R(l.emergencia || 800)}, llegan en ${R(l.emergenciaDias || 3)} días)</button></div>` : ''}</div>`
  }).join('')
  el.innerHTML = `<div style="font-size:12px;line-height:1.35">
    <div class="rg-meta" style="margin-bottom:6px">🌎 <b>Sistema de reemplazos de las FF.TT.T.O.</b> (SPAC cap. XVII): el poder perdido son bajas (20 % muertos, 65 % heridos, 15 % desaparecidos); el 40 % de los heridos vuelve a los 10 días por el Batallón de Reemplazos. El BR manda reemplazos por camino y la GU los integra al llegar (en contacto, un tercio por día). La prioridad la fija el G-3; el G-1 la ordena acá.</div>
    ${cajasBR}
    <div style="margin:4px 0;color:#5ce1ff"><b>Efectivos: ${R(tot.hom)} de ${R(tot.ef)}</b> · bajas ${R(tot.m + tot.h + tot.d)} (${R(tot.m)} muertos, ${R(tot.h)} heridos, ${R(tot.d)} desaparecidos) · reemplazos recibidos ${R(tot.rec)}</div>
    <table style="width:100%;border-collapse:collapse"><thead><tr style="color:#8ea3b3;text-align:left"><th>GU</th><th>Efectivos</th><th>Bajas</th><th>Reemplazos</th></tr></thead><tbody>${filas}</tbody></table>
    <div class="rg-meta" style="margin-top:6px">El PARTE DE PERSONAL de cada día sale en la 📜 bitácora.</div></div>`
  enganchar(el, ctx)
}

function enganchar(el, ctx) {
  for (const b of el.querySelectorAll('[data-lg]')) {
    const id = b.dataset.id
    if (b.dataset.lg === 'mover') b.onclick = () => ctx.elegir(id)
    if (b.dataset.lg === 'emergencia') b.onclick = () => ctx.ordenar(id, { tipo: 'apoyar', mision: 'emergencia' }, b)
    if (b.dataset.lg === 'prio') b.onchange = () => { if (b.value) ctx.ordenar(id, { tipo: 'apoyar', objetivo_id: Number(b.value) }, b) }
  }
}
