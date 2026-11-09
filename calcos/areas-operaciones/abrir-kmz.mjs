// 🌍 Abrir KMZ / KML de Google Earth como ejercicio nuevo (08-11-2026).
//
// Lo pidió Sergio con la captura de 📁 Ejercicios y la carpeta «NUEVO EJERCICIO TCNL GALVEZ»
// (AO OSO CE-IV (UYUNI-OLLAGUE).kmz, 01 TEATRO DE OPERACIONES.kmz, 060700NOV26.kmz…): «me
// permitas cargar documentos KMZ y que se guarden luego en el formato del juego… para este
// ejercicio los formatos iniciales están en KMZ… hay áreas de operaciones y fichas enemigas».
//
// El botón «📂 Abrir archivo» de 📁 Ejercicios ya abría el JSON de la Mesa como ejercicio NUEVO.
// Acá se lee el KMZ (o KML, o varios a la vez) y se arma el MISMO paquete de áreas que baja la
// Mesa (tipoArchivo 'sideceme-areas-operaciones'): de ahí sigue el camino de siempre
// (abrir-archivo.mjs → ejercicio nuevo → se guarda en SIDECEME → ejercicio.json del Juego).
//   · Áreas: los polígonos que se llaman o están en una carpeta «AO …», «Área de Operaciones»,
//     «Teatro / Subteatro de Operaciones», «Zona de …». «Área de interés», las DEOP y los
//     polígonos de los calcos del terreno NO son áreas.
//   · Fichas: los puntos que son unidades (la descripción dice «Escalón:», o el nombre es CE,
//     DIV, BRIG, RI…). El BANDO lo da primero el COLOR DEL ÍCONO (rombo rojo = enemigo, azul =
//     propio; 09-11-2026, ver «Bando por el color del ícono»); si el ícono no tiene un color claro,
//     son ENEMIGAS si la carpeta, el nombre o la descripción dicen enemigo, rojo, SATURNO,
//     adversario; si no, PROPIAS. El escalón sale de las X/I del símbolo
//     («(XX)» = División) o del nombre; el arma, de las palabras (Acorazada, Mecanizada…).
//   · Lo demás (líneas, puntos del terreno, los calcos ya hechos en Google Earth) no se pasa:
//     los calcos del terreno se vuelven a generar en la Mesa con ⚡ Generar calcos.
// Sin React ni librerías: el ZIP se abre con DecompressionStream y el KML con un lector propio,
// para que ande igual en el navegador y en las pruebas de Node.

const MAX_AREAS = 200, MAX_FICHAS = 3000

// ── El ZIP (KMZ) ─────────────────────────────────────────────────────────────────
const u16 = (b, i) => b[i] | (b[i + 1] << 8)
const u32 = (b, i) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0

async function inflar(datos) {
  const ds = new DecompressionStream('deflate-raw')
  const salida = new Blob([datos]).stream().pipeThrough(ds)
  return new Uint8Array(await new Response(salida).arrayBuffer())
}

// Los .kml de adentro del KMZ: { nombre, texto }. doc.kml primero (es el que abre Google Earth).
export async function kmlsDelZip(bytes) { return (await archivosDelZip(bytes)).kmls }

// Los .kml y las IMÁGENES de los íconos (files/b1.png…): { kmls, imagenes: Map(ruta → bytes) }.
export async function archivosDelZip(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let fin = -1
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (u32(b, i) === 0x06054b50) { fin = i; break }
  if (fin < 0) throw new Error('no es un KMZ (no se encontró el índice del ZIP)')
  const total = u16(b, fin + 10)
  let p = u32(b, fin + 16)
  const salida = [], imagenes = new Map()
  for (let k = 0; k < total && u32(b, p) === 0x02014b50; k++) {
    const metodo = u16(b, p + 10), comprimido = u32(b, p + 20)
    const largoNombre = u16(b, p + 28), largoExtra = u16(b, p + 30), largoComent = u16(b, p + 32)
    const local = u32(b, p + 42)
    const nombre = new TextDecoder().decode(b.subarray(p + 46, p + 46 + largoNombre))
    p += 46 + largoNombre + largoExtra + largoComent
    const esKml = /\.kml$/i.test(nombre), esImagen = /\.(png|jpe?g|gif|bmp|webp)$/i.test(nombre)
    if (!(esKml || (esImagen && comprimido < 4e6 && imagenes.size < 400)) || u32(b, local) !== 0x04034b50) continue
    const ini = local + 30 + u16(b, local + 26) + u16(b, local + 28)
    const crudo = b.subarray(ini, ini + comprimido)
    let datos = null
    try { datos = metodo === 0 ? crudo : metodo === 8 ? await inflar(crudo) : null } catch (e) { if (esKml) throw e }
    if (!datos) continue
    if (esKml) salida.push({ nombre, texto: new TextDecoder().decode(datos) })
    else imagenes.set(nombre, datos)
  }
  salida.sort((x, y) => (/(^|\/)doc\.kml$/i.test(y.nombre) ? 1 : 0) - (/(^|\/)doc\.kml$/i.test(x.nombre) ? 1 : 0))
  return { kmls: salida, imagenes }
}

// ── El KML ───────────────────────────────────────────────────────────────────────
const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const desEscapar = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#'
  ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENTIDADES[e] ?? m))

// Árbol mínimo: { tag (sin prefijo), hijos, texto }. Alcanza para Folder/Document/Placemark.
export function leerXml(texto) {
  const raiz = { tag: '#raiz', hijos: [], texto: '' }
  const pila = [raiz]
  const re = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/\s*([\w:.-]+)\s*>|<([\w:.-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|([^<]+)/g
  let m
  while ((m = re.exec(texto))) {
    const actual = pila[pila.length - 1]
    if (m[1] !== undefined) actual.texto += m[1]
    else if (m[2]) {
      const tag = m[2].replace(/^.*:/, '')
      for (let i = pila.length - 1; i > 0; i--) if (pila[i].tag === tag) { pila.length = i; break }
    } else if (m[3]) {
      const nodo = { tag: m[3].replace(/^.*:/, ''), hijos: [], texto: '' }
      const id = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(m[4] || '')
      if (id) nodo.attrs = { id: id[1] ?? id[2] }
      actual.hijos.push(nodo)
      if (!m[5]) pila.push(nodo)
    } else if (m[6] !== undefined) actual.texto += desEscapar(m[6])
  }
  return raiz
}

const hijo = (n, tag) => n.hijos.find(h => h.tag === tag)
const buscar = (n, tag) => { if (n.tag === tag) return n; for (const h of n.hijos) { const r = buscar(h, tag); if (r) return r } return null }
const textoDe = (n, tag) => (hijo(n, tag)?.texto || '').trim()
const sinHtml = s => String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
  .replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n').trim()

function coordenadas(n) {
  return String(n?.texto || '').trim().split(/\s+/).map(t => t.split(',').map(Number))
    .filter(p => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90)
    .map(p => [Math.round(p[0] * 1e7) / 1e7, Math.round(p[1] * 1e7) / 1e7])
}

// Los estilos del KML: id → { href del ícono, color del ícono (aabbggrr) }. Un StyleMap apunta a su
// estilo «normal».
function estilosDe(arbol) {
  const estilos = new Map(), mapas = new Map()
  const recorrer = n => {
    for (const h of n.hijos) {
      const id = (h.attrs?.id || '').trim()
      if (h.tag === 'Style' && id) estilos.set(id, iconoDe(h))
      else if (h.tag === 'StyleMap' && id) {
        const par = h.hijos.filter(x => x.tag === 'Pair')
        const normal = par.find(x => textoDe(x, 'key') === 'normal') || par[0]
        if (normal) mapas.set(id, textoDe(normal, 'styleUrl').replace(/^.*#/, ''))
      }
      if (h.hijos.length) recorrer(h)
    }
  }
  recorrer(arbol)
  for (const [id, destino] of mapas) if (!estilos.has(id) && estilos.has(destino)) estilos.set(id, estilos.get(destino))
  return estilos
}
function iconoDe(estilo) {
  const is = estilo && hijo(estilo, 'IconStyle')
  if (!is) return null
  const href = (buscar(is, 'href')?.texto || '').trim()
  const color = textoDe(is, 'color')
  return href || color ? { href, color } : null
}

// Cada Placemark con su camino de carpetas: { nombre, desc, estilo, camino[], tipo, coords, icono }.
export function placemarks(arbol, { conLineas = false } = {}) {
  const salida = [], estilos = estilosDe(arbol)
  const recorrer = (n, camino) => {
    for (const h of n.hijos) {
      if (h.tag === 'Folder' || h.tag === 'Document') recorrer(h, [...camino, textoDe(h, 'name')])
      else if (h.tag === 'Placemark') {
        const base = { nombre: textoDe(h, 'name'), desc: sinHtml(textoDe(h, 'description')), estilo: textoDe(h, 'styleUrl'), camino }
        const propio = iconoDe(hijo(h, 'Style')), delId = estilos.get(base.estilo.replace(/^.*#/, ''))
        const icono = propio?.href || propio?.color ? { href: propio.href || delId?.href || '', color: propio.color || delId?.color || '' } : delId
        if (icono) base.icono = icono
        const poli = buscar(h, 'Polygon'), linea = buscar(h, 'LineString'), punto = buscar(h, 'Point')
        if (poli) {
          const ext = buscar(hijo(poli, 'outerBoundaryIs') || poli, 'coordinates')
          salida.push({ ...base, tipo: 'poligono', coords: coordenadas(ext) })
        } else if (punto) salida.push({ ...base, tipo: 'punto', coords: coordenadas(buscar(punto, 'coordinates')) })
        else if (linea) salida.push({ ...base, tipo: 'linea', coords: [], ...(conLineas ? { lineaCoords: coordenadas(buscar(linea, 'coordinates')) } : {}) })
      } else if (h.tag !== 'Style' && h.tag !== 'StyleMap') recorrer(h, camino)
    }
  }
  recorrer(arbol, [])
  return salida
}

// ── Qué es cada cosa ─────────────────────────────────────────────────────────────
const sinTildes = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const CALCO = /^\s*calco\b/i
const ES_AREA = /(^|[^A-Z])A\.?\s?O\.?(?![A-Z])|AREA DE OPERACION|SUB\s*-?\s*TEATR|TEATRO DE OPERACION|ZONA DE (ACCION|COMBATE|RETAGUARDIA|DEFENSA)|ZONA DEL INTERIOR/i
const NO_AREA = /AREA DE INTERES|\bDEOP\b|DIRECCION(ES)? ESTRATEGICA|AEREO/i
const ENEMIGO = /ENEMIG|\bROJ[OA]S?\b|SATURNO|ADVERSARI|HOSTIL|AGRESOR/i
const PROPIO = /\bAZUL(ES)?\b|PROPI[OA]S?\b|AMIG[OA]S?\b/i
const UNIDAD = /^(\d+\s*[ªº°a]?\s*)?(C\.?T\.?O|CE|DE|DIV|BRIG|GU|RI|RC|RA|RAA|RCB|RIM|BTN|BAT|BI|REG|RGTO|CIA|ESC|ESCUADRON|AGRP|AGRUP|FF\.?\s?TT|FF\.?\s?EE|FF\.?\s?AA|COMANDO|CUERPO|DIVISION|BRIGADA|REGIMIENTO|BATALLON|COMPANIA|GRUPO)\b/i

// ── Bando por el color del ícono (09-11-2026) ──────────────────────────────────────
// Sergio cargó «1ª Brig. Acor. «Coraceros» – Chungará.kmz» (y la 2ª, la 3ª y la Brig. Mot. Nº 1):
// el ícono es un ROMBO ROJO, pero el nombre no dice «enemigo» ni «SATURNO», y entraron como fichas
// AZULES: «así en ese formato se les pasará a los alumnos y si están en azul está mal… que no
// vuelva a suceder». Lo que se VE en Google Earth manda: el color del ícono decide el bando, y las
// palabras quedan para cuando el ícono no tiene un color claro (blanco, amarillo, sin ícono).
//   1. El tinte del ícono (<IconStyle><color>aabbggrr), si no es blanco.
//   2. Los píxeles de la imagen del ícono dentro del KMZ (files/b1.png): rojo o azul que domine.
//   3. El nombre de los íconos de Google (…/paddle/red-diamond.png, blu-circle.png).
const rgbDeKml = c => { const h = String(c || '').trim().replace(/^#/, ''); return /^[0-9a-f]{8}$/i.test(h) ? [parseInt(h.slice(6, 8), 16), parseInt(h.slice(4, 6), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(0, 2), 16)] : null }
// Un color «rojo» o «azul» de símbolo militar (rojo #e0443a, #ff0000; azul #4f9cf0, #0000ff, #1f5fbf).
function bandoDeRgb(r, g, b) {
  if (r >= 140 && r - g >= 70 && r - b >= 60) return 'enemigo'
  if (b >= 120 && b - r >= 60 && b - g >= 20) return 'propias'
  return null
}
// Cuenta los píxeles visibles rojos y azules; decide si uno domina claramente.
export function bandoDePixeles(rgba, canales = 4) {
  let rojos = 0, azules = 0
  for (let i = 0; i + canales - 1 < rgba.length; i += canales) {
    if (canales === 4 && rgba[i + 3] < 128) continue
    const k = bandoDeRgb(rgba[i], rgba[i + 1], rgba[i + 2])
    if (k === 'enemigo') rojos++; else if (k === 'propias') azules++
  }
  if (rojos >= 12 && rojos >= 3 * azules) return 'enemigo'
  if (azules >= 12 && azules >= 3 * rojos) return 'propias'
  return null
}
const nombreHref = h => String(h || '').split(/[?#]/)[0].split('/').pop().toLowerCase()
function bandoDeNombreIcono(href) {
  const n = nombreHref(href)
  if (/^(red|rojo|roja)([-_.]|$)|[-_](red|rojo|roja)[-_.]/.test(n)) return 'enemigo'
  if (/^(blu|blue|azul|ltblu)([-_.]|$)|[-_](blu|blue|azul)[-_.]/.test(n)) return 'propias'
  return null
}
// PNG → RGBA (8 bits por canal). Sin librerías: IHDR + IDAT inflado + filtros. null si no se puede.
async function inflarZlib(datos) {
  const ds = new DecompressionStream('deflate')
  return new Uint8Array(await new Response(new Blob([datos]).stream().pipeThrough(ds)).arrayBuffer())
}
export async function rgbaDePng(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (b.length < 33 || b[0] !== 0x89 || b[1] !== 0x50 || b[2] !== 0x4e || b[3] !== 0x47) return null
  const be32 = i => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
  let p = 8, ancho = 0, alto = 0, prof = 0, tipo = 0, entrelazado = 0, paleta = null, alfaPaleta = null
  const idat = []
  while (p + 8 <= b.length) {
    const largo = be32(p), t = String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]), d = b.subarray(p + 8, p + 8 + largo)
    if (t === 'IHDR') { ancho = be32(p + 8); alto = be32(p + 12); prof = d[8]; tipo = d[9]; entrelazado = d[12] }
    else if (t === 'PLTE') paleta = d
    else if (t === 'tRNS') alfaPaleta = d
    else if (t === 'IDAT') idat.push(d)
    else if (t === 'IEND') break
    p += 12 + largo
  }
  const canales = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[tipo]
  if (!ancho || !alto || ancho * alto > 4e6 || entrelazado || !canales || !idat.length || ![1, 2, 4, 8, 16].includes(prof)) return null
  const junto = new Uint8Array(idat.reduce((s, x) => s + x.length, 0))
  let o = 0
  for (const x of idat) { junto.set(x, o); o += x.length }
  let crudo
  try { crudo = await inflarZlib(junto) } catch { return null }
  const bitsPx = canales * prof, bpp = Math.max(1, bitsPx >> 3), fila = Math.ceil(ancho * bitsPx / 8)
  if (crudo.length < alto * (fila + 1)) return null
  const lineas = new Uint8Array(alto * fila)
  for (let y = 0; y < alto; y++) {
    const f = crudo[y * (fila + 1)], src = y * (fila + 1) + 1, dst = y * fila
    for (let x = 0; x < fila; x++) {
      const a = x >= bpp ? lineas[dst + x - bpp] : 0, u = y ? lineas[dst - fila + x] : 0, c = x >= bpp && y ? lineas[dst - fila + x - bpp] : 0
      let v = crudo[src + x]
      if (f === 1) v += a; else if (f === 2) v += u; else if (f === 3) v += (a + u) >> 1
      else if (f === 4) { const pp = a + u - c, pa = Math.abs(pp - a), pb = Math.abs(pp - u), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c }
      lineas[dst + x] = v & 255
    }
  }
  const rgba = new Uint8Array(ancho * alto * 4)
  const muestra = (y, x, k) => { // canal k del píxel (x, y), escalado a 8 bits
    if (prof === 16) return lineas[y * fila + (x * canales + k) * 2]
    if (prof === 8) return lineas[y * fila + x * canales + k]
    const bit = (x * canales + k) * prof, v = (lineas[y * fila + (bit >> 3)] >> (8 - prof - (bit & 7))) & ((1 << prof) - 1)
    return tipo === 3 ? v : Math.round(v * 255 / ((1 << prof) - 1))
  }
  for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) {
    const i = (y * ancho + x) * 4
    if (tipo === 3) {
      const idx = muestra(y, x, 0)
      rgba[i] = paleta?.[idx * 3] ?? 0; rgba[i + 1] = paleta?.[idx * 3 + 1] ?? 0; rgba[i + 2] = paleta?.[idx * 3 + 2] ?? 0
      rgba[i + 3] = alfaPaleta && idx < alfaPaleta.length ? alfaPaleta[idx] : 255
    } else if (canales <= 2) {
      rgba[i] = rgba[i + 1] = rgba[i + 2] = muestra(y, x, 0); rgba[i + 3] = canales === 2 ? muestra(y, x, 1) : 255
    } else {
      rgba[i] = muestra(y, x, 0); rgba[i + 1] = muestra(y, x, 1); rgba[i + 2] = muestra(y, x, 2); rgba[i + 3] = canales === 4 ? muestra(y, x, 3) : 255
    }
  }
  return rgba
}
// Otra imagen (JPG, GIF…): sólo en el navegador, con un lienzo.
async function rgbaConLienzo(bytes) {
  if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas !== 'function') return null
  try {
    const bmp = await createImageBitmap(new Blob([bytes]))
    const w = Math.min(bmp.width, 256), h = Math.min(bmp.height, 256)
    const cv = new OffscreenCanvas(w, h), cx = cv.getContext('2d')
    cx.drawImage(bmp, 0, 0, w, h)
    return cx.getImageData(0, 0, w, h).data
  } catch { return null }
}
// El bando de cada imagen del KMZ: Map(ruta → 'enemigo' | 'propias' | null).
export async function bandosDeImagenes(imagenes) {
  const r = new Map()
  for (const [ruta, bytes] of imagenes || []) {
    const rgba = (await rgbaDePng(bytes).catch(() => null)) || (await rgbaConLienzo(bytes))
    r.set(ruta, rgba ? bandoDePixeles(rgba) : null)
  }
  return r
}
// El bando que dice el ícono del Placemark (o null si el ícono no lo dice). `imagenes` = lo de arriba.
export function bandoDeIcono(icono, imagenes, carpetaKml = '') {
  if (!icono) return null
  const tinte = rgbDeKml(icono.color)
  if (tinte && tinte[3] > 40 && !(tinte[0] > 230 && tinte[1] > 230 && tinte[2] > 230)) {
    const k = bandoDeRgb(tinte[0], tinte[1], tinte[2])
    if (k) return k
  }
  const href = String(icono.href || '').trim()
  if (href && imagenes?.size) {
    const limpio = href.split(/[?#]/)[0].replace(/^\.\//, '')
    const ruta = [carpetaKml ? `${carpetaKml}/${limpio}` : limpio, limpio].find(x => imagenes.has(x)) ||
      [...imagenes.keys()].find(x => x.toLowerCase().endsWith('/' + limpio.toLowerCase()) || x.toLowerCase() === limpio.toLowerCase())
    if (ruta && imagenes.get(ruta)) return imagenes.get(ruta)
  }
  return bandoDeNombreIcono(href)
}

function escalonDe(nombre, linea) {
  const marca = (linea.match(/\(\s*([XI]{1,5})\s*\)/) || nombre.match(/\(\s*([XI]{1,5})\s*\)/) || [])[1]
  if (marca && /X/.test(marca)) return ['brigada', 'division', 'cuerpo', 'ejercito', 'ejercito'][marca.length - 1]
  if (marca) return ['compania', 'batallon', 'regimiento'][Math.min(marca.length, 3) - 1]
  // Primero lo que dice la propia designación («AGRP. LOG. – CE-I» es la agrupación, no el CE).
  const primera = sinTildes(nombre.split(/\s+[–—-]\s+/)[0]).toUpperCase()
  return escalonPorPalabras(primera) || escalonPorPalabras(sinTildes(linea).toUpperCase()) || 'brigada'
}
function escalonPorPalabras(t) {
  if (/C\.?T\.?O\b|TEATRO|FF\.?\s?TT|EJERCITO\b/.test(t)) return 'ejercito'
  if (/\bCUERPO\b|^\s*CE\b|\bCE\s*[-–]/.test(t)) return 'cuerpo'
  if (/DIVISION|\bDIV\b|\bDE\s*[-–]|\bAGRP\b|\bAGRUP/.test(t)) return 'division'
  if (/BRIGADA|\bBRIG\b|\bGU\b/.test(t)) return 'brigada'
  if (/REGIMIENTO|\bRGTO\b|\bREG\b|\bR[ICA]\b|FF\.?\s?EE/.test(t)) return 'regimiento'
  if (/BATALLON|\bBTN\b|\bBAT\b/.test(t)) return 'batallon'
  if (/COMPANIA|\bCIA\b|ESCUADRON/.test(t)) return 'compania'
  return ''
}
function armaDe(texto) {
  const t = sinTildes(texto).toUpperCase()
  if (/ANTIAERE|\bAA\b|D\.?A\.?A\b/.test(t)) return 'antiaerea'
  if (/AVIACION|\bBAVE\b|VANT|HELICOP|\bAERE[OA]S?\b/.test(t)) return 'aviacion'
  if (/ACORAZ|BLIND|TANQUE/.test(t)) return 'blindada'
  if (/CAB(ALLERIA)?\.?\s*MEC/.test(t)) return 'cabmec'
  if (/MECANIZ|\bMEC\b/.test(t)) return 'mecanizada'
  if (/MOTORIZ|\bMOT\b/.test(t)) return 'motorizada'
  if (/LOGIST|\bLOG\b|ABASTEC/.test(t)) return 'logistica'
  if (/ARTILLER|\bART\b|LANZACOHET/.test(t)) return 'artilleria'
  if (/INGENIER|\bING\b|ZAPADOR/.test(t)) return 'ingenieria'
  if (/COMUNICACI|\bCOM\b|TRANSMISION/.test(t)) return 'comunicaciones'
  if (/CABALLER|\bCAB\b|\bRC\b/.test(t)) return 'caballeria'
  if (/AEROTRANSP|PARACAID/.test(t)) return 'aerotransportada'
  if (/SANIDAD|HOSPITAL/.test(t)) return 'sanidad'
  if (/MONTANA|ANDIN/.test(t)) return 'andina'
  if (/SELVA/.test(t)) return 'selva'
  return 'infanteria'
}
// «1ª Brig. Acor. «Coraceros» – Chungará» → «1ª Brig. Acor. «Coraceros»». Si lo último también es una
// unidad («DIV-3 – CE-I»), queda entero.
function designacionDe(nombre) {
  const partes = nombre.split(/\s+[–—-]\s+/)
  const ultima = sinTildes(partes[partes.length - 1])
  const d = partes.length < 2 || UNIDAD.test(ultima) ? nombre : partes.slice(0, -1).join(' – ')
  // «CE – I» → «CE-I»
  return d.replace(/\s+[–—-]\s+(?=[IVX]+\b)/g, '-').slice(0, 80)
}
const escalonArea = t => /\bCE\b|CUERPO/.test(t) ? 'cuerpo' : /\bDIV\b|DIVISION/.test(t) ? 'division' : /\bBRIG\b|BRIGADA/.test(t) ? 'brigada' : ''

function abrirAnillo(c) {
  const r = c.slice()
  while (r.length > 3 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r.pop()
  return r
}

// Arma el paquete de áreas de la Mesa con los Placemark de uno o varios KML.
//   { paquete, areas, fichas: { enemigo, propias }, omitidos: { lineas, puntos, poligonos } }
export function paqueteDeKml(lista, { nombre = '' } = {}) {
  const areas = [], fichas = [], vistos = new Set()
  const omitidos = { lineas: 0, puntos: 0, poligonos: 0, calcos: 0 }
  let sello = 0
  for (const pm of lista) {
    const camino = pm.camino.filter(Boolean)
    if (camino.slice(1).some(c => CALCO.test(c))) { omitidos.calcos++; continue }
    if (pm.tipo === 'linea') { omitidos.lineas++; continue }
    const nom = sinTildes(pm.nombre).toUpperCase()
    const ruta = camino.map(c => sinTildes(c).toUpperCase())
    if (pm.tipo === 'poligono') {
      const coords = abrirAnillo(pm.coords)
      const carpeta = [...ruta].reverse().find(c => ES_AREA.test(c) && !NO_AREA.test(c)) || ''
      const esArea = coords.length >= 3 && !NO_AREA.test(nom) && (ES_AREA.test(nom) || (!!carpeta && !NO_AREA.test(ruta[ruta.length - 1] || '')))
      if (!esArea) { omitidos.poligonos++; continue }
      // «Área de Operaciones» a secas toma el nombre de su carpeta («AO CE-I TIGRE»).
      const generico = /^AREA DE OPERACIONES?$/.test(nom.trim()) || !nom.trim()
      const nombreArea = generico ? (camino[ruta.lastIndexOf(carpeta)] || pm.nombre || 'Área') : pm.nombre
      const clave = `a|${sinTildes(nombreArea).toUpperCase()}|${coords.length}|${coords[0]}`
      if (vistos.has(clave)) continue
      vistos.add(clave)
      const esc = escalonArea(sinTildes(nombreArea).toUpperCase())
      areas.push({
        id: `kmz-${Date.now().toString(36)}-${sello++}`, nombre: nombreArea.slice(0, 160), coords,
        unidad: (nombreArea.match(/\b(CE|DIV|BRIG)\s*[-–]?\s*[IVX\d]+\b/i) || [''])[0].replace(/\s+/g, ''),
        operacion: '', ...(esc ? { escalon: esc } : {}), tipo: 'defensiva', modalidad: 'tenaz', ambiente: 'llano',
        teatro: /TEATR/.test(nom + ' ' + sinTildes(nombreArea).toUpperCase()),
        origenKmz: [...camino, pm.nombre].join(' / ').slice(0, 300),
      })
      continue
    }
    // Punto: ¿es una unidad?
    const lineaEsc = (pm.desc.match(/Escal[oó]n\s*:\s*([^\n]*)/i) || [])[1] || ''
    if (!pm.coords.length || !(lineaEsc || UNIDAD.test(nom))) { omitidos.puntos++; continue }
    const [lng, lat] = pm.coords[0]
    // La misma ficha en dos carpetas (DIV. MEC.-5 en el dispositivo azul y en el despliegue): una sola.
    const desig = designacionDe(pm.nombre)
    const clave = `f|${sinTildes(desig).toUpperCase()}|${lng.toFixed(2)}|${lat.toFixed(2)}`
    if (vistos.has(clave)) continue
    vistos.add(clave)
    const todo = sinTildes(`${ruta.join(' ')} ${nom} ${pm.estilo} ${lineaEsc}`).toUpperCase()
    const enemigo = pm.bandoIcono ? pm.bandoIcono === 'enemigo'
      : ENEMIGO.test(todo) && !(PROPIO.test(ruta.join(' ')) && !ENEMIGO.test(ruta.join(' ')))
    fichas.push({
      lat, lng, bando: enemigo ? 'enemigo' : 'propias', tipo: 'unidad',
      escalon: escalonDe(pm.nombre, lineaEsc), arma: armaDe(`${pm.nombre} ${lineaEsc}`),
      instalacion: '', designacion: desig, futura: false, agrupacion: false,
      nombreKmz: pm.nombre.slice(0, 160), descripcionKmz: pm.desc.slice(0, 1500),
    })
  }
  // El teatro y los subteatros primero: la última que entra queda ACTIVA, y conviene que sea un AO.
  areas.sort((a, b) => (b.teatro ? 1 : 0) - (a.teatro ? 1 : 0))
  for (const a of areas) delete a.teatro
  const enemigo = fichas.filter(f => f.bando === 'enemigo').length
  return {
    areas: areas.slice(0, MAX_AREAS), fichas: { enemigo, propias: fichas.length - enemigo }, omitidos,
    paquete: areas.length ? {
      tipoArchivo: 'sideceme-areas-operaciones', version: 1, ejercicioOrigen: nombre,
      seleccion: { nombre }, areas: areas.slice(0, MAX_AREAS),
      contenido: { unidades: fichas.slice(0, MAX_FICHAS) },
      indicaciones: 'Abierto desde Google Earth (KMZ/KML).',
    } : null,
    unidades: fichas.slice(0, MAX_FICHAS),
  }
}

// ── Lo que llama la Mesa ─────────────────────────────────────────────────────────
export const esGoogleEarth = f => /\.(kmz|kml)$/i.test(String(f?.name || ''))
const nombreSinExt = n => String(n || '').replace(/\.(kmz|kml|json)$/i, '').replace(/\s*\(\d+\)$/, '').trim()

// Varios archivos elegidos a la vez se abren como UN ejercicio (las AO de un archivo y las
// fichas de otro). Uno solo pasa tal cual.
export function unirArchivos(lista) {
  const fs = Array.from(lista || [])
  if (fs.length <= 1) return fs[0] || null
  return { name: `${fs.length} archivos`, size: fs.reduce((s, f) => s + (f.size || 0), 0), archivos: fs, nombreSugerido: nombreSinExt(fs[0].name) }
}

async function textosKml(f) {
  if (/\.kml$/i.test(f.name)) return { kmls: [{ nombre: f.name, texto: await f.text() }], imagenes: new Map() }
  const z = await archivosDelZip(new Uint8Array(await f.arrayBuffer()))
  if (!z.kmls.length) throw new Error(`«${f.name}» no trae ningún KML adentro.`)
  return z
}
// Los Placemark de un archivo, cada uno con `bandoIcono` si su ícono dice rojo o azul.
async function placemarksDeArchivo(f, opciones) {
  const { kmls, imagenes } = await textosKml(f)
  const bandos = await bandosDeImagenes(imagenes)
  const lista = []
  for (const k of kmls) {
    const carpeta = k.nombre.includes('/') ? k.nombre.slice(0, k.nombre.lastIndexOf('/')) : ''
    for (const pm of placemarks(leerXml(k.texto), opciones)) {
      const b = bandoDeIcono(pm.icono, bandos, carpeta)
      lista.push(b ? { ...pm, bandoIcono: b } : pm)
    }
  }
  return lista
}

// El objeto que espera ejercicioDeArchivo (abrir-archivo.mjs): el JSON tal cual, o el paquete de
// áreas armado con el KMZ. Error con el porqué si no se puede.
export async function leerArchivoMesa(f) {
  const archivos = f?.archivos || [f]
  const json = archivos.filter(x => !esGoogleEarth(x))
  if (archivos.length === 1 && json.length === 1) {
    try { return JSON.parse(await f.text()) } catch { throw new Error(`«${f.name}» no es un JSON válido.`) }
  }
  if (json.length) throw new Error(`Para abrir varios a la vez tienen que ser todos KMZ o KML de Google Earth («${json[0].name}» no lo es).`)
  const lista = []
  for (const a of archivos) {
    try { lista.push(...await placemarksDeArchivo(a)) } catch (e) { throw new Error(e.message.startsWith('«') ? e.message : `«${a.name}»: ${e.message}`) }
  }
  const nombre = f.nombreSugerido || nombreSinExt(f.name)
  const r = paqueteDeKml(lista, { nombre })
  const nota = [r.omitidos.calcos ? `${r.omitidos.calcos} trazos de calcos del terreno` : '', r.omitidos.lineas ? `${r.omitidos.lineas} líneas` : '',
    r.omitidos.puntos ? `${r.omitidos.puntos} puntos que no son unidades` : '', r.omitidos.poligonos ? `${r.omitidos.poligonos} polígonos que no son áreas` : ''].filter(Boolean).join(', ')
  if (r.paquete) {
    if (nota) r.paquete.indicaciones += ` No se pasaron: ${nota}.`
    return r.paquete
  }
  if (r.unidades.length) {
    // Sólo fichas, sin ninguna AO: se abre igual, como ejercicio con las fichas.
    return { version: 1, nombre, unidades: r.unidades }
  }
  throw new Error(`«${f.name}» no trae áreas de operaciones ni fichas de unidades${nota ? ` (tiene ${nota})` : ''}. ` +
    'Las áreas se reconocen por el nombre («AO …», «Área de Operaciones», «Subteatro…») y las fichas por la descripción «Escalón: …» o el nombre (CE, DIV, BRIG…).')
}

// ── 🧩 Superponer un KMZ/KML (08-11-2026) ──────────────────────────────────────────
// Sergio: «quise superponer algo más pero en superponer no me da la opción de superponer un KMZ».
// Superponer sólo MUESTRA encima de la carta (no entra al ejercicio), así que acá va TODO lo del
// KMZ: áreas, líneas, fichas (con su símbolo y color rojo/azul) y puntos, un grupo por carpeta de
// Google Earth para prenderlas y apagarlas en el tablero 🧩. Formato 'sideceme-superposicion'.
const MARCA_ESC = { equipo: '', escuadra: '•', seccion: '•••', compania: 'I', batallon: 'II', regimiento: 'III', brigada: 'X', division: 'XX', cuerpo: 'XXX', ejercito: 'XXXX' }
const SIMBOLO_SUP = { blindada: 'mec', mecanizada: 'mec', cabmec: 'mec', aviacion: 'air', aerotransportada: 'aeromov' }
const MAX_SUP = 25000

export function superposicionDeKml(lista, { nombre = '' } = {}) {
  const grupos = new Map(), ll = p => [p[1], p[0]]
  let total = 0, fuera = 0
  for (const pm of lista) {
    if (total >= MAX_SUP) { fuera++; continue }
    const camino = pm.camino.filter(Boolean)
    // El grupo: la carpeta de arriba (sin la raíz del KMZ) y, si es de calcos, también la de abajo.
    const util = camino.length > 1 ? camino.slice(1) : camino
    const sinTemp = util[0] && /^sitios temporales$/i.test(util[0]) ? util.slice(1) : util
    const iCalco = sinTemp.findIndex(c => CALCO.test(c))
    const partes = iCalco >= 0 ? [...sinTemp.slice(0, iCalco), sinTemp[iCalco], sinTemp[sinTemp.length - 1]] : sinTemp.slice(0, 2)
    const clave = [...new Set(partes)].join(' › ') || nombre || 'Elementos'
    if (!grupos.has(clave)) grupos.set(clave, [])
    const el = grupos.get(clave)
    const nom = sinTildes(pm.nombre).toUpperCase(), ruta = sinTildes(camino.join(' ')).toUpperCase()
    const enemigo = pm.bandoIcono ? pm.bandoIcono === 'enemigo' : ENEMIGO.test(`${ruta} ${nom} ${sinTildes(pm.estilo).toUpperCase()}`)
    const color = enemigo ? '#e0443a' : '#4f9cf0'
    if (pm.tipo === 'poligono') {
      const c = abrirAnillo(pm.coords)
      if (c.length < 3) continue
      el.push({ tipo: 'area', coords: c.map(ll), rotulo: iCalco >= 0 ? '' : pm.nombre.slice(0, 80), color })
    } else if (pm.tipo === 'linea') {
      if (pm.lineaCoords?.length > 1) el.push({ tipo: 'linea', coords: pm.lineaCoords.map(ll), info: pm.nombre, color: iCalco >= 0 ? '#5b7a99' : color })
      else continue
    } else if (pm.coords.length) {
      const lineaEsc = (pm.desc.match(/Escal[oó]n\s*:\s*([^\n]*)/i) || [])[1] || ''
      const unidad = !!(lineaEsc || UNIDAD.test(nom))
      const info = [pm.nombre, pm.desc.split('\n').slice(1, 4).join(' · ')].filter(Boolean).join(' — ').slice(0, 400)
      if (unidad) {
        const escalon = escalonDe(pm.nombre, lineaEsc), arma = armaDe(`${pm.nombre} ${lineaEsc}`)
        // `ficha`: lo que hace falta para 📌 Pasar fichas al ejercicio (superponer.js).
        el.push({ tipo: 'unidad', ll: ll(pm.coords[0]), simbolo: SIMBOLO_SUP[arma] || 'inf', escalon: MARCA_ESC[escalon] || '', rotulo: designacionDe(pm.nombre), info, color,
          ficha: { escalon, arma, bando: enemigo ? 'enemigo' : 'propias', designacion: designacionDe(pm.nombre) } })
      } else el.push({ tipo: 'unidad', ll: ll(pm.coords[0]), simbolo: 'pto', rotulo: iCalco >= 0 ? '' : pm.nombre.slice(0, 60), info, color: iCalco >= 0 ? '#5b7a99' : color })
    }
    total++
  }
  const lista2 = [...grupos].filter(([, e]) => e.length).map(([n, e], i) => ({
    id: `kmz${i}`, nombre: `${n} (${e.length})`,
    // Los calcos del terreno vienen apagados: son miles de trazos; se prenden en el tablero.
    visible: !/›.*calco|^calco/i.test(n) && !CALCO.test(n.split(' › ').slice(-2, -1)[0] || ''), elementos: e,
  }))
  return { tipoArchivo: 'sideceme-superposicion', nombre, grupos: lista2, total, fuera }
}

// 📌 Pasar fichas al ejercicio (08-11-2026): una ficha superpuesta → una ficha de la Mesa. Sirve para
// las de un KMZ (traen `ficha`) y, por el rótulo, el símbolo y el color, para las cargadas antes o desde
// un JSON. Los puntos sueltos (simbolo 'pto') no son unidades.
const ESC_DE_MARCA = { XXXX: 'ejercito', XXX: 'cuerpo', XX: 'division', X: 'brigada', III: 'regimiento', II: 'batallon', I: 'compania', '•••': 'seccion', '•': 'escuadra' }
export function fichaDeSuperpuesta(el) {
  if (!el || el.tipo !== 'unidad' || !Array.isArray(el.ll) || el.simbolo === 'pto') return null
  const lat = +el.ll[0], lng = +el.ll[1]
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  const f = el.ficha || {}
  const designacion = String(f.designacion || el.rotulo || '').trim().slice(0, 80)
  if (!designacion) return null
  const bando = f.bando || (/^#e0443a$/i.test(String(el.color || '')) ? 'enemigo' : 'propias')
  return {
    lat, lng, bando, tipo: 'unidad',
    escalon: f.escalon || ESC_DE_MARCA[String(el.escalon || '').trim()] || escalonDe(designacion, ''),
    arma: f.arma || (el.simbolo === 'air' ? 'aviacion' : el.simbolo === 'aeromov' ? 'aerotransportada' : armaDe(`${designacion} ${el.info || ''}`)),
    instalacion: '', designacion, futura: false, agrupacion: false,
  }
}

// Lo que llama superponer.js con los archivos elegidos (KMZ o KML). Un archivo = una capa.
export async function superposicionDeArchivo(f) {
  let lista
  try { lista = await placemarksDeArchivo(f, { conLineas: true }) } catch (e) { throw new Error(e.message.startsWith('«') ? e.message : `«${f.name}»: ${e.message}`) }
  const r = superposicionDeKml(lista, { nombre: nombreSinExt(f.name) })
  if (!r.total) throw new Error(`«${f.name}» no trae nada con coordenadas.`)
  return r
}
