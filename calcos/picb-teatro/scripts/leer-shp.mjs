// Lector mínimo de shapefile (.shp + .dbf) → GeoJSON, para las capas de Natural Earth
// (salares, lagos, fronteras, poblaciones, aeropuertos). Sin librerías.
//   import { leerShapefile } from './leer-shp.mjs'
//   const fc = leerShapefile('/ruta/ne_10m_playas')   // sin extensión
import fs from 'node:fs'

function leerDbf(ruta) {
  const b = fs.readFileSync(ruta)
  const n = b.readUInt32LE(4), largoCab = b.readUInt16LE(8), largoReg = b.readUInt16LE(10)
  const campos = []
  for (let p = 32; p < largoCab - 1 && b[p] !== 0x0d; p += 32) {
    const nombre = b.subarray(p, p + 11).toString('latin1').replace(/\0.*$/, '')
    campos.push({ nombre, tipo: String.fromCharCode(b[p + 11]), largo: b[p + 16] })
  }
  const filas = []
  for (let i = 0; i < n; i++) {
    let p = largoCab + i * largoReg + 1
    const f = {}
    for (const c of campos) {
      const crudo = b.subarray(p, p + c.largo).toString('utf8').trim()
      p += c.largo
      f[c.nombre] = c.tipo === 'N' || c.tipo === 'F' ? (crudo === '' ? null : Number(crudo)) : crudo
    }
    filas.push(f)
  }
  return filas
}

const areaFirmada = (r) => { let s = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return s / 2 }
const cajaDe = (r) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of r) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y } return [a, b, c, d] }
const dentro = (p, r) => { let s = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) s = !s } return s }

function poligono(anillos) {
  // Shapefile: los anillos exteriores van en sentido horario (área firmada > 0 con esta fórmula).
  const ext = [], huecos = []
  for (const r of anillos) (areaFirmada(r) >= 0 ? ext : huecos).push(r)
  if (!ext.length) return { type: 'Polygon', coordinates: anillos }
  const polis = ext.map((r) => [r])
  for (const h of huecos) {
    const k = polis.findIndex((pp) => dentro(h[0], pp[0]))
    if (k >= 0) polis[k].push(h)
  }
  return polis.length === 1 ? { type: 'Polygon', coordinates: polis[0] } : { type: 'MultiPolygon', coordinates: polis }
}

export function leerShapefile(base) {
  const b = fs.readFileSync(base + '.shp')
  const props = leerDbf(base + '.dbf')
  const features = []
  let p = 100, i = 0
  while (p + 8 <= b.length) {
    const largo = b.readInt32BE(p + 4) * 2
    const c = p + 8
    const tipo = b.readInt32LE(c)
    let geom = null
    if (tipo === 1 || tipo === 11 || tipo === 21) geom = { type: 'Point', coordinates: [b.readDoubleLE(c + 4), b.readDoubleLE(c + 12)] }
    else if ([3, 5, 13, 15, 23, 25].includes(tipo)) {
      const nPartes = b.readInt32LE(c + 36), nPuntos = b.readInt32LE(c + 40)
      const partes = []
      for (let k = 0; k < nPartes; k++) partes.push(b.readInt32LE(c + 44 + 4 * k))
      const base0 = c + 44 + 4 * nPartes
      const pts = []
      for (let k = 0; k < nPuntos; k++) pts.push([b.readDoubleLE(base0 + 16 * k), b.readDoubleLE(base0 + 16 * k + 8)])
      const trozos = partes.map((ini, k) => pts.slice(ini, k + 1 < nPartes ? partes[k + 1] : nPuntos))
      if (tipo === 3 || tipo === 13 || tipo === 23) geom = trozos.length === 1 ? { type: 'LineString', coordinates: trozos[0] } : { type: 'MultiLineString', coordinates: trozos }
      else geom = poligono(trozos)
    }
    features.push({ type: 'Feature', properties: props[i] || {}, geometry: geom })
    p = c + largo
    i++
  }
  return { type: 'FeatureCollection', features: features.filter((f) => f.geometry) }
}

export { cajaDe }
