// 🌎 PICB del Teatro — paso 1 de la construcción de los datos: leer un extracto de OpenStreetMap
// (Geofabrik, formato .osm.pbf) y sacar SOLO lo que se ve a escala de teatro (1:1.000.000):
// carreteras (motorway → tertiary), ferrocarriles, ríos, aeródromos, poblaciones, volcanes y picos,
// pasos de montaña, puestos de frontera y estaciones de tren.
//
// Uso:  node extraer-osm.mjs bolivia.osm.pbf bolivia.crudo.json
//
// No usa librerías: el PBF es protobuf + zlib, y Node trae zlib. Dos pasadas:
//   1) las etiquetas: qué vías y qué puntos sirven, y qué nodos hacen falta para dibujar las vías;
//   2) las coordenadas de esos nodos.
// Lo que sale es «crudo» (sin simplificar ni recortar): lo junta y lo achica generalizar.mjs.
import fs from 'node:fs'
import zlib from 'node:zlib'

// ── protobuf mínimo ──────────────────────────────────────────────────────────────────────
class Lector {
  constructor(b, ini = 0, fin = b.length) { this.b = b; this.p = ini; this.f = fin }
  get fin() { return this.p >= this.f }
  varint() {
    const b = this.b
    let p = this.p, x = 0, s = 1, c
    do { c = b[p++]; x += (c & 0x7f) * s; s *= 128 } while (c & 0x80)
    this.p = p
    return x
  }
  svarint() { const v = this.varint(); return v % 2 === 1 ? -(v + 1) / 2 : v / 2 }
  bytes() { const n = this.varint(), ini = this.p; this.p += n; return this.b.subarray(ini, ini + n) }
  sub() { const n = this.varint(), ini = this.p; this.p += n; return new Lector(this.b, ini, ini + n) }
  texto() { return Buffer.from(this.bytes()).toString('utf8') }
  saltar(tipo) {
    if (tipo === 0) this.varint()
    else if (tipo === 1) this.p += 8
    else if (tipo === 2) { const n = this.varint(); this.p += n }   // ojo: `this.p += this.varint()` lee p ANTES del largo
    else if (tipo === 5) this.p += 4
    else throw new Error('tipo de campo protobuf desconocido: ' + tipo)
  }
  empaquetados(signo) { const s = this.sub(), out = []; while (!s.fin) out.push(signo ? s.svarint() : s.varint()); return out }
}

// ── los bloques del archivo ──────────────────────────────────────────────────────────────
function* bloques(ruta) {
  const fd = fs.openSync(ruta, 'r'), tam = fs.fstatSync(fd).size
  const largo = Buffer.alloc(4)
  let pos = 0
  try {
    while (pos < tam) {
      fs.readSync(fd, largo, 0, 4, pos); pos += 4
      const n = largo.readUInt32BE(0), cab = Buffer.alloc(n)
      fs.readSync(fd, cab, 0, n, pos); pos += n
      let tipo = '', tamDatos = 0
      for (const L = new Lector(cab); !L.fin;) {
        const t = L.varint(), campo = t >>> 3
        if (campo === 1) tipo = L.texto(); else if (campo === 3) tamDatos = L.varint(); else L.saltar(t & 7)
      }
      const blob = Buffer.alloc(tamDatos)
      fs.readSync(fd, blob, 0, tamDatos, pos); pos += tamDatos
      let crudo = null, comprimido = null
      for (const L = new Lector(blob); !L.fin;) {
        const t = L.varint(), campo = t >>> 3
        if (campo === 1) crudo = L.bytes(); else if (campo === 3) comprimido = L.bytes(); else L.saltar(t & 7)
      }
      const datos = crudo || (comprimido ? zlib.inflateSync(comprimido) : null)
      if (!datos) throw new Error('bloque sin datos zlib (¿lzma?)')
      yield { tipo, datos, avance: pos / tam }
    }
  } finally { fs.closeSync(fd) }
}

// PrimitiveBlock → { cadenas, gran, latOff, lonOff, grupos[] }
function bloquePrimitivo(datos) {
  const r = { cadenas: [], gran: 100, latOff: 0, lonOff: 0, grupos: [] }
  for (const L = new Lector(datos); !L.fin;) {
    const t = L.varint(), campo = t >>> 3
    if (campo === 1) {
      const S = L.sub()
      while (!S.fin) { const u = S.varint(); if (u >>> 3 === 1) r.cadenas.push(S.texto()); else S.saltar(u & 7) }
    } else if (campo === 2) r.grupos.push(L.sub())
    else if (campo === 17) r.gran = L.varint()
    else if (campo === 19) r.latOff = L.varint()
    else if (campo === 20) r.lonOff = L.varint()
    else L.saltar(t & 7)
  }
  return r
}

// ── qué se guarda ────────────────────────────────────────────────────────────────────────
const VIAS = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary'])
const FFCC = new Set(['rail', 'narrow_gauge', 'disused'])
const LUGARES = new Set(['city', 'town', 'village', 'hamlet'])
const CLAVES = ['name', 'ref', 'surface', 'place', 'population', 'ele', 'iata', 'icao', 'aerodrome:type', 'aeroway',
  'railway', 'usage', 'highway', 'waterway', 'natural', 'barrier', 'mountain_pass', 'capital', 'admin_level', 'is_in:country', 'name:es']

function interesaPunto(e) {
  if (LUGARES.has(e.place) && e.name) return 'lugar'
  if (e.aeroway === 'aerodrome') return 'aerodromo'
  if ((e.natural === 'volcano' || e.natural === 'peak') && e.name) return e.natural === 'volcano' ? 'volcan' : 'pico'
  if (e.mountain_pass === 'yes' || e.natural === 'saddle' && e.name) return 'paso'
  if (e.barrier === 'border_control') return 'frontera'
  if ((e.railway === 'station' || e.railway === 'halt') && e.name) return 'estacion'
  return null
}
function interesaVia(e) {
  if (VIAS.has(e.highway)) return 'via'
  if (FFCC.has(e.railway)) return 'ffcc'
  if (e.waterway === 'river') return 'rio'
  if (e.aeroway === 'aerodrome') return 'aerodromo'
  return null
}
const etiquetas = (claves, valores, cad) => {
  const e = {}
  for (let i = 0; i < claves.length; i++) { const k = cad[claves[i]]; if (CLAVES.includes(k)) e[k] = cad[valores[i]] }
  return e
}

// ── pasada 1: etiquetas ──────────────────────────────────────────────────────────────────
function pasada1(ruta) {
  const puntos = [], vias = []
  let nDense = 0
  for (const { tipo, datos, avance } of bloques(ruta)) {
    if (tipo !== 'OSMData') continue
    const B = bloquePrimitivo(datos)
    const g = B.gran, lat = v => (B.latOff + g * v) * 1e-9, lon = v => (B.lonOff + g * v) * 1e-9
    for (const G of B.grupos) {
      while (!G.fin) {
        const t = G.varint(), campo = t >>> 3
        if (campo === 2) {                       // DenseNodes
          const D = G.sub()
          let ids = [], lats = [], lons = [], kv = null
          while (!D.fin) {
            const u = D.varint(), c = u >>> 3
            if (c === 1) ids = D.empaquetados(true)
            else if (c === 8) lats = D.empaquetados(true)
            else if (c === 9) lons = D.empaquetados(true)
            else if (c === 10) kv = D.empaquetados(false)
            else D.saltar(u & 7)
          }
          nDense += ids.length
          if (!kv) continue
          let id = 0, la = 0, lo = 0, j = 0
          for (let i = 0; i < ids.length; i++) {
            id += ids[i]; la += lats[i]; lo += lons[i]
            if (kv[j] === 0) { j++; continue }
            const e = {}
            while (j < kv.length && kv[j] !== 0) {
              const k = B.cadenas[kv[j]], v = B.cadenas[kv[j + 1]]
              if (CLAVES.includes(k)) e[k] = v
              j += 2
            }
            j++
            const que = interesaPunto(e)
            if (que) puntos.push({ que, id, lon: +lon(lo).toFixed(6), lat: +lat(la).toFixed(6), e })
          }
        } else if (campo === 3) {                // Way
          const W = G.sub()
          let id = 0, claves = [], valores = [], refs = null
          while (!W.fin) {
            const u = W.varint(), c = u >>> 3
            if (c === 1) id = W.varint()
            else if (c === 2) claves = W.empaquetados(false)
            else if (c === 3) valores = W.empaquetados(false)
            else if (c === 8) refs = W.empaquetados(true)
            else W.saltar(u & 7)
          }
          if (!claves.length || !refs) continue
          const e = etiquetas(claves, valores, B.cadenas)
          const que = interesaVia(e)
          if (!que) continue
          for (let i = 1; i < refs.length; i++) refs[i] += refs[i - 1]
          vias.push({ que, id, e, refs })
        } else if (campo === 1) {                // Node suelto (raro en Geofabrik)
          const N = G.sub()
          let id = 0, la = 0, lo = 0, claves = [], valores = []
          while (!N.fin) {
            const u = N.varint(), c = u >>> 3
            if (c === 1) id = N.svarint(); else if (c === 2) claves = N.empaquetados(false)
            else if (c === 3) valores = N.empaquetados(false); else if (c === 8) la = N.svarint(); else if (c === 9) lo = N.svarint()
            else N.saltar(u & 7)
          }
          const e = etiquetas(claves, valores, B.cadenas), que = interesaPunto(e)
          if (que) puntos.push({ que, id, lon: +lon(lo).toFixed(6), lat: +lat(la).toFixed(6), e })
        } else G.saltar(t & 7)
      }
    }
    if (Math.random() < 0.02) process.stderr.write(`  pasada 1: ${(avance * 100).toFixed(0)} %\r`)
  }
  return { puntos, vias, nDense }
}

// ── pasada 2: coordenadas de los nodos que hacen falta ───────────────────────────────────
function pasada2(ruta, buscados) {
  const lon = new Float64Array(buscados.length).fill(NaN), lat = new Float64Array(buscados.length).fill(NaN)
  let k = 0
  const ubicar = id => {
    if (k < buscados.length && buscados[k] === id) return k
    let a = 0, b = buscados.length - 1
    while (a <= b) { const m = (a + b) >> 1, v = buscados[m]; if (v === id) return m; if (v < id) a = m + 1; else b = m - 1 }
    return -1
  }
  for (const { tipo, datos, avance } of bloques(ruta)) {
    if (tipo !== 'OSMData') continue
    const B = bloquePrimitivo(datos)
    const g = B.gran
    for (const G of B.grupos) {
      while (!G.fin) {
        const t = G.varint(), campo = t >>> 3
        if (campo !== 2) { G.saltar(t & 7); continue }
        const D = G.sub()
        let ids = [], lats = [], lons = []
        while (!D.fin) {
          const u = D.varint(), c = u >>> 3
          if (c === 1) ids = D.empaquetados(true)
          else if (c === 8) lats = D.empaquetados(true)
          else if (c === 9) lons = D.empaquetados(true)
          else D.saltar(u & 7)
        }
        let id = 0, la = 0, lo = 0
        for (let i = 0; i < ids.length; i++) {
          id += ids[i]; la += lats[i]; lo += lons[i]
          const m = ubicar(id)
          if (m >= 0) { lat[m] = (B.latOff + g * la) * 1e-9; lon[m] = (B.lonOff + g * lo) * 1e-9; k = m + 1 }
        }
      }
    }
    if (Math.random() < 0.02) process.stderr.write(`  pasada 2: ${(avance * 100).toFixed(0)} %\r`)
  }
  return { lon, lat }
}

// ── principal ────────────────────────────────────────────────────────────────────────────
const [, , entrada, salida] = process.argv
if (!entrada || !salida) { console.error('uso: node extraer-osm.mjs extracto.osm.pbf salida.json'); process.exit(1) }
const t0 = Date.now()
const { puntos, vias, nDense } = pasada1(entrada)
console.error(`\npasada 1: ${nDense.toLocaleString()} nodos, ${puntos.length} puntos, ${vias.length} vías (${((Date.now() - t0) / 1000).toFixed(0)} s)`)
let total = 0
for (const v of vias) total += v.refs.length
const todos = new Float64Array(total)
let p = 0
for (const v of vias) for (const r of v.refs) todos[p++] = r
todos.sort()
let u = 0
for (let i = 0; i < todos.length; i++) if (i === 0 || todos[i] !== todos[i - 1]) todos[u++] = todos[i]
const buscados = todos.subarray(0, u)
const { lon, lat } = pasada2(entrada, buscados)
console.error(`\npasada 2: ${u.toLocaleString()} nodos ubicados (${((Date.now() - t0) / 1000).toFixed(0)} s)`)
const indice = id => { let a = 0, b = buscados.length - 1; while (a <= b) { const m = (a + b) >> 1, v = buscados[m]; if (v === id) return m; if (v < id) a = m + 1; else b = m - 1 } return -1 }
const out = { fuente: entrada.split('/').pop(), hecho: new Date().toISOString(), puntos, vias: [] }
let sinCoord = 0
for (const v of vias) {
  const coords = []
  for (const r of v.refs) {
    const m = indice(r)
    if (m < 0 || !Number.isFinite(lon[m])) { sinCoord++; continue }
    coords.push([Math.round(lon[m] * 1e6) / 1e6, Math.round(lat[m] * 1e6) / 1e6])
  }
  if (coords.length >= 2) out.vias.push({ que: v.que, id: v.id, e: v.e, c: coords })
}
fs.writeFileSync(salida, JSON.stringify(out))
console.error(`listo: ${out.vias.length} vías, ${out.puntos.length} puntos, ${sinCoord} nodos sin coordenada → ${salida} (${((Date.now() - t0) / 1000).toFixed(0)} s)`)
