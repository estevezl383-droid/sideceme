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
