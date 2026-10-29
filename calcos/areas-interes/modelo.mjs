// El análisis sigue recibiendo un único GeoJSON (la unión real, sin rellenar los
// espacios entre áreas). Las áreas originales viajan dentro de aoi.properties,
// por lo que los guardados, las BASE y los JSON existentes las conservan.
const copiar = value => JSON.parse(JSON.stringify(value))
const nombre = (value, defecto) => String(value || '').trim().slice(0, 100) || defecto

function geometriaValida(g) {
  const poligonos = g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : []
  return Array.isArray(poligonos) && poligonos.length > 0 && poligonos.every(p =>
    Array.isArray(p) && p.length > 0 && p.every(r => Array.isArray(r) && r.length >= 4 &&
      r.every(c => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]) && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90) &&
      r[0][0] === r.at(-1)[0] && r[0][1] === r.at(-1)[1] &&
      new Set(r.slice(0, -1).map(c => `${c[0]},${c[1]}`)).size >= 3))
}

export function listarAreas(aoi) {
  const guardadas = aoi?.properties?.areasInteres
  if (Array.isArray(guardadas) && guardadas.length) {
    return guardadas.filter(a => a?.id && geometriaValida(a.geometry)).map((a, i) => ({
      id: String(a.id), nombre: nombre(a.nombre, `Área de Interés ${i + 1}`), geometry: copiar(a.geometry)
    }))
  }
  const originales = aoi?.type === 'FeatureCollection' ? aoi.features : aoi ? [aoi] : []
  return originales.filter(a => geometriaValida(a?.geometry || a)).map((a, i) => ({
    id: `ai-original-${i + 1}`, nombre: nombre(a.properties?.nombre, `Área de Interés ${i + 1}`), geometry: copiar(a.geometry || a)
  }))
}

export function construirAoi(areas, unir) {
  if (!areas.length) return null
  if (areas.some(a => !geometriaValida(a.geometry))) throw new Error('El área necesita un polígono válido y cerrado.')
  const features = areas.map(a => ({ type: 'Feature', properties: { nombre: a.nombre }, geometry: copiar(a.geometry) }))
  const union = features.length === 1 ? features[0] : unir({ type: 'FeatureCollection', features })
  if (!geometriaValida(union?.geometry)) throw new Error('No se pudieron combinar las áreas de interés.')
  return { type: 'Feature', properties: {
    nombre: areas.length === 1 ? areas[0].nombre : `${areas.length} Áreas de Interés`,
    areasInteres: copiar(areas)
  }, geometry: copiar(union.geometry) }
}

export function agregarArea(aoi, feature, unir) {
  if (!geometriaValida(feature?.geometry)) throw new Error('El área necesita al menos tres puntos distintos y un contorno cerrado.')
  const areas = listarAreas(aoi)
  const usados = new Set(areas.map(a => a.nombre))
  let numero = areas.length + 1
  while (usados.has(`Área de Interés ${numero}`)) numero++
  const defecto = `Área de Interés ${numero}`
  const nom = feature.properties?.nombre
  const id = globalThis.crypto?.randomUUID?.() || `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return construirAoi([...areas, { id, nombre: nombre(nom === 'Área dibujada' ? '' : nom, defecto), geometry: feature.geometry }], unir)
}

export function quitarArea(aoi, id, unir) {
  const areas = listarAreas(aoi)
  if (!areas.some(a => a.id === id)) return aoi
  return construirAoi(areas.filter(a => a.id !== id), unir)
}

export function renombrarArea(aoi, id, texto) {
  const areas = listarAreas(aoi)
  const nueva = String(texto).slice(0, 100)
  if (!areas.some(a => a.id === id)) return aoi
  const actualizadas = areas.map(a => a.id === id ? { ...a, nombre: nueva } : a)
  return { ...aoi, properties: { ...aoi.properties,
    nombre: areas.length === 1 ? nueva : `${areas.length} Áreas de Interés`, areasInteres: actualizadas } }
}

export function areasEnMapa(aoi, verCapa = {}) {
  return { type: 'FeatureCollection', features: listarAreas(aoi).filter(a => verCapa.areaInteres !== false && verCapa[`areaInteres:${a.id}`] !== false).map(a => ({
    type: 'Feature', id: a.id, properties: { nombre: a.nombre }, geometry: a.geometry
  })) }
}

export function rotularArea(feature, layer) {
  const etiqueta = document.createElement('span')
  etiqueta.textContent = feature.properties?.nombre || 'Área de Interés'
  layer.bindTooltip(etiqueta, { permanent: true, direction: 'center', className: 'rotulo-area-interes' })
}
