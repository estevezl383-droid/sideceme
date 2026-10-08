// areaOps sigue siendo el área activa para los consumidores anteriores.
// areasOps conserva todas; el área activa prevalece para reflejar sus ediciones.
const copiar = x => JSON.parse(JSON.stringify(x))
export function validarArea(a) {
  return !!a && Array.isArray(a.coords) && a.coords.length >= 3 && a.coords.every(p =>
    Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) &&
    Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90)
}
export function listarAreas(ops = {}) {
  const lista = (Array.isArray(ops.areasOps) ? ops.areasOps : []).filter(validarArea).map((a, i) => ({ ...a, id: a.id || `ao-${i}` }))
  if (validarArea(ops.areaOps)) {
    const activa = { ...ops.areaOps, id: ops.areaOps.id || 'ao-original' }
    const i = lista.findIndex(a => a.id === activa.id)
    if (i >= 0) lista[i] = activa
    else lista.unshift(activa)
  }
  return lista
}
export function agregarArea(ops, area) {
  if (!validarArea(area)) throw new Error('El área necesita al menos tres coordenadas válidas.')
  const lista = listarAreas(ops)
  const nueva = { ...copiar(area), id: `ao-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)}`,
    nombre: String(area.nombre || `Área ${lista.length + 1}`).slice(0, 160) }
  return { ...ops, areasOps: [...lista, nueva], areaOps: nueva }
}
export function seleccionarArea(ops, id) {
  const lista = listarAreas(ops), activa = lista.find(a => a.id === id)
  return activa ? { ...ops, areasOps: lista, areaOps: activa } : ops
}
export function editarArea(ops, id, datos) {
  const lista = listarAreas(ops).map(a => a.id === id ? { ...a, ...datos, id: a.id } : a)
  return { ...ops, areasOps: lista, areaOps: lista.find(a => a.id === (ops.areaOps?.id || 'ao-original')) || null }
}
export function borrarAreaActiva(ops) {
  const id = ops.areaOps?.id || 'ao-original'
  const lista = listarAreas(ops).filter(a => a.id !== id)
  return { ...ops, areasOps: lista, areaOps: lista[0] || null }
}
export function paqueteAreas(ops, ids, ejercicio) {
  const areas = listarAreas(ops).filter(a => ids.includes(a.id))
  if (!areas.length) throw new Error('Seleccione por lo menos un área.')
  return { tipoArchivo: 'sideceme-areas-operaciones', version: 1, ejercicioOrigen: ejercicio || '', areas: copiar(areas) }
}
export function importarAreas(ops, paquete) {
  if (paquete?.tipoArchivo !== 'sideceme-areas-operaciones' || paquete.version !== 1 ||
      !Array.isArray(paquete.areas) || !paquete.areas.length || paquete.areas.length > 200 || !paquete.areas.every(validarArea))
    throw new Error('El archivo no contiene áreas de operaciones válidas.')
  return paquete.areas.reduce((estado, a) => agregarArea(estado, {
    ...a, origen: { ejercicio: String(paquete.ejercicioOrigen || ''), areaId: String(a.id || '') }
  }), ops)
}
// Rótulo compartido por el área activa y las conservadas; textContent evita HTML del nombre.
export function rotuloArea(area, color = '#111111', escala = 1) {
  const div = document.createElement('div')
  div.style.cssText = `color:${color};font:700 ${Math.max(9, 14 * escala).toFixed(1)}px/1.15 Arial;text-align:center;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff`
  for (const texto of ['ÁREA DE', 'OPERACIONES', area.nombre || 'Área sin nombre']) {
    const linea = document.createElement('div')
    linea.textContent = texto
    div.appendChild(linea)
  }
  return div.outerHTML
}
export function dibujarOtrasAreas(L, capa, ops, visible, color = '#111111', escala = 1) {
  if (!visible) return
  const id = ops.areaOps?.id || 'ao-original'
  for (const a of listarAreas(ops).filter(a => a.id !== id)) {
    const p = L.polygon(a.coords.map(c => [c[1], c[0]]), {
      color, weight: 4, fillColor: color, fillOpacity: .03, interactive: false
    }).addTo(capa)
    L.marker(p.getBounds().getCenter(), {
      interactive: false,
      icon: L.divIcon({ className: 'zona-log', html: rotuloArea(a, color, escala),
        iconSize: [180, 60], iconAnchor: [90, 30] })
    }).addTo(capa)
  }
}
