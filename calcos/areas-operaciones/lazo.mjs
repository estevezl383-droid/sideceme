// ✂️ Lazo a mano alzada sobre la carta 2D (como en GoodNotes o PowerPoint).
//
// Una capa transparente tapa la carta mientras el lazo está activo: se arrastra
// con el mouse, el dedo o el lápiz y al soltar se cierra el lazo. Un toque sin
// arrastrar elige la zona que está debajo. La rueda sigue acercando y alejando.
// Esc o «Cancelar» lo apagan. No guarda nada: sólo devuelve lo que se marcó.

export function iniciarLazo(mapa, { alTerminar, alCancelar } = {}) {
  const cont = mapa.getContainer()
  const capa = document.createElement('div')
  capa.className = 'sid-lazo'
  capa.setAttribute('aria-label', 'Lazo: encierre la zona o toque dentro de ella')
  // Arriba de las figuras (z 600–650) y debajo de los controles de la carta.
  capa.style.cssText = 'position:absolute;inset:0;z-index:690;cursor:crosshair;touch-action:none;background:rgba(92,225,255,.04)'
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%')
  svg.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:visible'
  const trazo = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  trazo.setAttribute('style', 'fill:rgba(92,225,255,.15);stroke:#0b7fa8;stroke-width:3;stroke-dasharray:8 5;stroke-linejoin:round')
  svg.appendChild(trazo); capa.appendChild(svg); cont.appendChild(capa)

  let puntos = [], activo = null, inicio = null, recorrido = 0, terminado = false
  const pixel = e => { const r = cont.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
  const dibujar = () => {
    trazo.setAttribute('points', puntos.map(ll => { const p = mapa.latLngToContainerPoint(ll); return `${p.x},${p.y}` }).join(' '))
  }
  const parar = e => { e.stopPropagation() }
  const abajo = e => {
    e.preventDefault(); e.stopPropagation()
    if (activo !== null || (e.pointerType === 'mouse' && e.button !== 0)) return
    activo = e.pointerId; inicio = pixel(e); recorrido = 0
    try { capa.setPointerCapture(e.pointerId) } catch {}
    puntos = [mapa.containerPointToLatLng(inicio)]
    dibujar()
  }
  let ultimo = null
  const mover = e => {
    if (e.pointerId !== activo) return
    e.preventDefault(); e.stopPropagation()
    const p = pixel(e)
    const ref = ultimo || inicio
    const d = Math.hypot(p[0] - ref[0], p[1] - ref[1])
    if (d < 3) return
    recorrido += d; ultimo = p
    puntos.push(mapa.containerPointToLatLng(p))
    dibujar()
  }
  const arriba = e => {
    if (e.pointerId !== activo) return
    e.preventDefault(); e.stopPropagation()
    activo = null; ultimo = null
    const lls = puntos; puntos = []; dibujar()
    if (recorrido < 8) {
      const ll = lls[0]
      terminar({ punto: [ll.lng, ll.lat] })
    } else if (lls.length >= 3) terminar({ lazo: lls.map(ll => [ll.lng, ll.lat]) })
  }
  const tecla = e => { if (e.key === 'Escape') { detener(); alCancelar?.() } }
  const terminar = sel => { if (terminado) return; detener(); alTerminar?.(sel) }
  capa.addEventListener('pointerdown', abajo)
  capa.addEventListener('pointermove', mover)
  capa.addEventListener('pointerup', arriba)
  capa.addEventListener('pointercancel', arriba)
  // Que Leaflet no arrastre la carta ni abra el menú de una figura por debajo.
  for (const t of ['mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'touchstart', 'touchmove', 'touchend']) capa.addEventListener(t, parar)
  mapa.on('move zoom', dibujar)
  document.addEventListener('keydown', tecla)
  function detener() {
    if (terminado) return
    terminado = true
    mapa.off('move zoom', dibujar)
    document.removeEventListener('keydown', tecla)
    capa.remove()
  }
  return detener
}

// La carta 2D, si está a la vista (en 3D no hay lazo).
export function carta2D() {
  const m = globalThis.window?.__mapa2d
  try { return m && m.getContainer().isConnected && m.getContainer().offsetParent !== null ? m : null } catch { return null }
}

// 👁 Vista previa de la tijera (16-10-2026): encima de la carta 2D se dibujan las zonas en que los
// límites parten el área, en celeste las que se van a cortar y en naranja el trazo de la tijera.
// Un toque suma o quita la zona de abajo; arrastrar mueve la carta; con dos dedos se acerca o se
// aleja; la rueda acerca como siempre. Esc cancela. No guarda nada.
export function vistaPrevia(mapa, { alTocar, alCancelar } = {}) {
  const cont = mapa.getContainer()
  const capa = document.createElement('div')
  capa.className = 'sid-tijera-vista'
  capa.setAttribute('aria-label', 'Vista previa de la tijera: toque una zona para sumarla o quitarla')
  capa.style.cssText = 'position:absolute;inset:0;z-index:690;cursor:pointer;touch-action:none'
  const NS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%')
  svg.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:visible'
  capa.appendChild(svg); cont.appendChild(capa)
  let datos = { zonas: [], area: null, lazo: null }, terminado = false
  const puntos = c => c.map(([lng, lat]) => { const p = mapa.latLngToContainerPoint([lat, lng]); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
  const figura = (c, estilo) => {
    if (!Array.isArray(c) || c.length < 3) return
    const f = document.createElementNS(NS, 'polygon')
    f.setAttribute('points', puntos(c)); f.setAttribute('style', estilo)
    svg.appendChild(f)
  }
  const dibujar = () => {
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    for (const z of datos.zonas || []) figura(z.coords, z.elegida
      ? 'fill:rgba(92,225,255,.30);stroke:#0b7fa8;stroke-width:1.5;stroke-linejoin:round'
      : 'fill:rgba(255,255,255,.07);stroke:#ffffff;stroke-width:1.5;stroke-dasharray:6 4;stroke-linejoin:round')
    figura(datos.area, 'fill:none;stroke:#00e5ff;stroke-width:4;stroke-linejoin:round')
    figura(datos.lazo, 'fill:none;stroke:#ff9d2e;stroke-width:2.5;stroke-dasharray:9 6;stroke-linejoin:round')
  }
  const pixel = e => { const r = cont.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
  const activos = new Map()
  let inicio = null, movido = 0, pinza = null
  const distancia = () => { const [a, b] = [...activos.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]) }
  const abajo = e => {
    e.preventDefault(); e.stopPropagation()
    if (e.pointerType === 'mouse' && e.button !== 0) return
    try { capa.setPointerCapture(e.pointerId) } catch {}
    activos.set(e.pointerId, pixel(e))
    if (activos.size === 1) { inicio = pixel(e); movido = 0 }
    else if (activos.size === 2) { pinza = { d: distancia() }; inicio = null }
  }
  const mover = e => {
    if (!activos.has(e.pointerId)) return
    e.preventDefault(); e.stopPropagation()
    const p = pixel(e), previo = activos.get(e.pointerId)
    activos.set(e.pointerId, p)
    if (activos.size === 1 && inicio) {
      const dx = p[0] - previo[0], dy = p[1] - previo[1]
      movido += Math.hypot(dx, dy)
      if (movido > 6) mapa.panBy([-dx, -dy], { animate: false })
    } else if (activos.size === 2 && pinza) {
      const d = distancia(), [a, b] = [...activos.values()]
      const centro = mapa.containerPointToLatLng([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2])
      if (d / pinza.d > 1.3) { mapa.setZoomAround(centro, mapa.getZoom() + 1, { animate: false }); pinza.d = d }
      else if (d / pinza.d < 0.77) { mapa.setZoomAround(centro, mapa.getZoom() - 1, { animate: false }); pinza.d = d }
    }
  }
  const arriba = e => {
    if (!activos.has(e.pointerId)) return
    e.preventDefault(); e.stopPropagation()
    if (activos.size === 1 && inicio && movido <= 6 && e.type === 'pointerup') {
      const ll = mapa.containerPointToLatLng(pixel(e))
      alTocar?.([ll.lng, ll.lat])
    }
    activos.delete(e.pointerId)
    if (activos.size < 2) pinza = null
    if (!activos.size) inicio = null
  }
  const parar = e => { e.stopPropagation() }
  const tecla = e => { if (e.key === 'Escape') { detener(); alCancelar?.() } }
  capa.addEventListener('pointerdown', abajo)
  capa.addEventListener('pointermove', mover)
  capa.addEventListener('pointerup', arriba)
  capa.addEventListener('pointercancel', arriba)
  for (const t of ['mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'touchstart', 'touchmove', 'touchend']) capa.addEventListener(t, parar)
  mapa.on('move zoom viewreset resize', dibujar)
  document.addEventListener('keydown', tecla)
  function detener() {
    if (terminado) return
    terminado = true
    mapa.off('move zoom viewreset resize', dibujar)
    document.removeEventListener('keydown', tecla)
    capa.remove()
  }
  return { poner(d) { datos = d || datos; if (!terminado) dibujar() }, detener }
}
