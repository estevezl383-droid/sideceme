// 🌍 Abrir KMZ / KML de Google Earth como ejercicio nuevo (08-11-2026).
//   node calcos/pruebas/abrir-kmz.mjs
import assert from 'node:assert/strict'
import { deflateRawSync, deflateSync } from 'node:zlib'
import { readFileSync, existsSync } from 'node:fs'
import { leerArchivoMesa, unirArchivos, kmlsDelZip, paqueteDeKml, placemarks, leerXml, superposicionDeArchivo, rgbaDePng } from '../areas-operaciones/abrir-kmz.mjs'
import { ejercicioDeArchivo } from '../areas-operaciones/abrir-archivo.mjs'

// Un ZIP mínimo (un .kml comprimido con deflate), como el KMZ de Google Earth.
function zip(nombre, texto) {
  const datos = Buffer.from(texto, 'utf8'), comp = deflateRawSync(datos), n = Buffer.from(nombre)
  const loc = Buffer.alloc(30); loc.writeUInt32LE(0x04034b50, 0); loc.writeUInt16LE(8, 8); loc.writeUInt32LE(comp.length, 18); loc.writeUInt32LE(datos.length, 22); loc.writeUInt16LE(n.length, 26)
  const cen = Buffer.alloc(46); cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(8, 10); cen.writeUInt32LE(comp.length, 20); cen.writeUInt32LE(datos.length, 24); cen.writeUInt16LE(n.length, 28)
  const local = Buffer.concat([loc, n, comp]), central = Buffer.concat([cen, n])
  const fin = Buffer.alloc(22); fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(1, 8); fin.writeUInt16LE(1, 10); fin.writeUInt32LE(central.length, 12); fin.writeUInt32LE(local.length, 16)
  return Buffer.concat([local, central, fin])
}
const archivo = (name, b) => ({ name, size: b.length, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.length), text: async () => b.toString('utf8') })
const poli = (nom, c) => `<Placemark><name>${nom}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${c.map(p => p.join(',') + ',0').join(' ')}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>`
const punto = (nom, desc, c) => `<Placemark><name>${nom}</name><description><![CDATA[${desc}]]></description><styleUrl>#s</styleUrl><Point><coordinates>${c.join(',')},0</coordinates></Point></Placemark>`
const anillo = [[-68, -19], [-67.5, -19], [-67.5, -19.5], [-68, -19.5], [-68, -19]]
const kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>EJ.kmz</name>
<Folder><name>01 TEATRO DE OPERACIONES</name>${poli('SUB TEATRO CENTRAL', anillo.map(([a, b]) => [a - 1, b + 1]))}</Folder>
<Folder><name>AO CE-II PUMA</name><Folder><name>Área de interés</name>${poli('Área de Operaciones', anillo)}${poli('Área de interés', anillo)}</Folder>
  <Folder><name>CALCO DE ELEVACIONES</name><Placemark><name>c</name><LineString><coordinates>-68,-19 -67,-19</coordinates></LineString></Placemark></Folder></Folder>
<Folder><name>02 DIAMANTE | Unidades enemigas (SATURNO)</name>
  ${punto('2ª Brig. Acor. «Cazadores» – Colchane', '<b>x</b><br/>Escalón: Brigada Acorazada (X) – de la DE-VI<br/>Enfrenta a: CE-II', [-68.62, -19.27])}
  ${punto('Arica (origen)', 'origen', [-70.3, -18.4])}</Folder>
<Folder><name>AZUL | Dispositivo</name>${punto('CE – II – Corque', 'Escalón: Cuerpo de Ejército (XXX)', [-67.68, -18.35])}
  ${punto('AGRP. LOG. – CE-II', '', [-67.7, -18.4])}${punto('DIV. MEC.-5 – Huari', 'Escalón: División Mecanizada (XX)', [-66.9, -19.0])}</Folder>
<Folder><name>07 DESPLIEGUE</name>${punto('DIV. MEC.-5 – Huari (reserva)', 'Escalón: División Mecanizada (XX)', [-66.901, -19.001])}</Folder>
</Document></kml>`

// 1 · El KMZ: áreas y fichas, lo demás afuera.
const [k] = await kmlsDelZip(zip('doc.kml', kml))
assert.equal(k.nombre, 'doc.kml'); assert.equal(k.texto, kml)
const j = await leerArchivoMesa(unirArchivos([archivo('EJ.kmz', zip('doc.kml', kml))]))
assert.equal(j.tipoArchivo, 'sideceme-areas-operaciones')
assert.deepEqual(j.areas.map(a => a.nombre), ['SUB TEATRO CENTRAL', 'AO CE-II PUMA'], 'el teatro primero; «Área de Operaciones» toma el nombre de su carpeta; el Área de interés no es área')
assert.equal(j.areas[1].coords.length, 4, 'sin el vértice que cierra'); assert.equal(j.areas[1].escalon, 'cuerpo')
const f = Object.fromEntries(j.contenido.unidades.map(u => [u.designacion, u]))
assert.deepEqual(Object.keys(f), ['2ª Brig. Acor. «Cazadores»', 'CE-II', 'AGRP. LOG. – CE-II', 'DIV. MEC.-5'], 'el origen no es ficha; la DIV. MEC.-5 repetida, una sola')
assert.equal(f['2ª Brig. Acor. «Cazadores»'].bando, 'enemigo'); assert.equal(f['2ª Brig. Acor. «Cazadores»'].escalon, 'brigada'); assert.equal(f['2ª Brig. Acor. «Cazadores»'].arma, 'blindada')
assert.equal(f['CE-II'].bando, 'propias'); assert.equal(f['CE-II'].escalon, 'cuerpo')
assert.equal(f['AGRP. LOG. – CE-II'].escalon, 'division'); assert.equal(f['AGRP. LOG. – CE-II'].arma, 'logistica')
assert.equal(f['DIV. MEC.-5'].arma, 'mecanizada'); assert.equal(f['DIV. MEC.-5'].lat, -19)
assert.match(j.indicaciones, /1 trazos de calcos del terreno.*1 puntos que no son unidades.*1 polígonos que no son áreas/)

// 2 · De ahí, el camino de siempre: ejercicio nuevo con las áreas y las fichas.
const Vt = { limites: [], areaOps: null }
const r = ejercicioDeArchivo(j, { archivo: 'EJ.kmz', opsVacias: Vt, cmocVacio: {} })
assert.equal(r.ok, true); assert.equal(r.nombre, 'EJ'); assert.equal(r.datos.ops.areaOps.nombre, 'AO CE-II PUMA', 'queda activa la AO, no el teatro')
assert.equal(r.datos.unidades.length, 4); assert.match(r.resumen, /2 áreas/)

// 3 · Varios a la vez (las AO de un archivo y las fichas de otro) y KML suelto.
const soloFichas = kml.replace(/<Folder><name>01 TEATRO[\s\S]*?<Folder><name>02/, '<Folder><name>02')
const v = await leerArchivoMesa(unirArchivos([archivo('AO.kml', Buffer.from(`<kml><Document>${poli('AO OSO CE-IV', anillo)}</Document></kml>`)), archivo('FICHAS.kmz', zip('doc.kml', soloFichas))]))
assert.deepEqual(v.areas.map(a => a.nombre), ['AO OSO CE-IV']); assert.equal(v.contenido.unidades.length, 4); assert.equal(v.ejercicioOrigen, 'AO')
// Sólo fichas, sin AO: se abre como ejercicio con las fichas.
const s = await leerArchivoMesa(archivo('FICHAS.kmz', zip('doc.kml', soloFichas)))
assert.equal(s.unidades.length, 4); assert.equal(ejercicioDeArchivo(s, { archivo: 'FICHAS.kmz' }).tipo, 'ejercicio')

// 4 · Lo que no se puede, con el porqué. El JSON sigue igual.
await assert.rejects(leerArchivoMesa(archivo('PASOS.kml', Buffer.from(`<kml>${punto('TAMBO QUEMADO', '', [-69, -18])}</kml>`))), /no trae áreas de operaciones ni fichas.*1 puntos que no son unidades/)
await assert.rejects(leerArchivoMesa(archivo('roto.kmz', Buffer.from('no es zip'))), /«roto.kmz»: no es un KMZ/)
await assert.rejects(leerArchivoMesa(unirArchivos([archivo('a.kmz', zip('doc.kml', kml)), archivo('b.json', Buffer.from('{}'))])), /todos KMZ o KML/)
assert.deepEqual(await leerArchivoMesa(archivo('x.json', Buffer.from('{"a":1}'))), { a: 1 })
await assert.rejects(leerArchivoMesa(archivo('x.json', Buffer.from('{'))), /no es un JSON válido/)
// El lector de XML: entidades, CDATA y prefijos.
const pm = placemarks(leerXml('<k:kml><k:Placemark><k:name>A &amp; B</k:name><k:Point><k:coordinates>1,2</k:coordinates></k:Point></k:Placemark></k:kml>'))
assert.deepEqual(pm.map(p => [p.nombre, p.coords]), [['A & B', [[1, 2]]]])
assert.equal(paqueteDeKml([]).paquete, null)
// 5 · El BANDO lo da el color del ícono (09-11-2026): «1ª Brig. Acor. «Coraceros» – Chungará.kmz»
// trae un ROMBO ROJO (files/b1.png) y el nombre no dice «enemigo»: tiene que entrar ROJA.
const zipVarios = entradas => {
  const locs = [], cens = []; let off = 0
  for (const [nombre, contenido] of entradas) {
    const datos = Buffer.isBuffer(contenido) ? contenido : Buffer.from(contenido, 'utf8'), comp = deflateRawSync(datos), n = Buffer.from(nombre)
    const loc = Buffer.alloc(30); loc.writeUInt32LE(0x04034b50, 0); loc.writeUInt16LE(8, 8); loc.writeUInt32LE(comp.length, 18); loc.writeUInt32LE(datos.length, 22); loc.writeUInt16LE(n.length, 26)
    const cen = Buffer.alloc(46); cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(8, 10); cen.writeUInt32LE(comp.length, 20); cen.writeUInt32LE(datos.length, 24); cen.writeUInt16LE(n.length, 28); cen.writeUInt32LE(off, 42)
    const l = Buffer.concat([loc, n, comp]); locs.push(l); cens.push(Buffer.concat([cen, n])); off += l.length
  }
  const central = Buffer.concat(cens), fin = Buffer.alloc(22)
  fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(entradas.length, 8); fin.writeUInt16LE(entradas.length, 10); fin.writeUInt32LE(central.length, 12); fin.writeUInt32LE(off, 16)
  return Buffer.concat([...locs, central, fin])
}
// Un PNG RGBA de 20×20: fondo transparente y un rombo del color pedido (filtro «Sub» en las filas pares).
function png([r, g, b]) {
  const W = 20, filas = []
  for (let y = 0; y < W; y++) {
    const f = Buffer.alloc(1 + W * 4); f[0] = y % 2 ? 0 : 1
    const px = []
    for (let x = 0; x < W; x++) px.push(Math.abs(x - 9.5) + Math.abs(y - 9.5) <= 8 ? [r, g, b, 255] : [0, 0, 0, 0])
    px.forEach((c, x) => c.forEach((v, k) => { const prev = x ? px[x - 1][k] : 0; f[1 + x * 4 + k] = y % 2 ? v : (v - prev) & 255 }))
    filas.push(f)
  }
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); return Buffer.concat([l, Buffer.from(t), d, Buffer.alloc(4)]) }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(W, 4); ih[8] = 8; ih[9] = 6
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ih), chunk('IDAT', deflateSync(Buffer.concat(filas))), chunk('IEND', Buffer.alloc(0))])
}
const rgba = await rgbaDePng(png([255, 34, 34]))
assert.deepEqual([...rgba.slice((10 * 20 + 10) * 4, (10 * 20 + 10) * 4 + 4)], [255, 34, 34, 255], 'el PNG se lee bien (filtros incluidos)')
const conIcono = (nom, estilo, extra = '') => `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${nom}.kmz</name>${estilo}
  <Placemark><name>${nom}</name><description><![CDATA[Escalón: Brigada Acorazada (X) – de la DE-VI<br/>Enfrenta a: CE-I]]></description><styleUrl>#m</styleUrl><Point><coordinates>-69.0758,-18.2839,0</coordinates></Point></Placemark>${extra}</Document></kml>`
const estiloImg = href => `<Style id="s"><IconStyle><scale>2</scale><Icon><href>${href}</href></Icon></IconStyle></Style><StyleMap id="m"><Pair><key>normal</key><styleUrl>#s</styleUrl></Pair><Pair><key>highlight</key><styleUrl>#s</styleUrl></Pair></StyleMap>`
const bandoDe = async (nombre, bytes) => (await leerArchivoMesa(archivo(nombre, bytes))).unidades.map(u => u.bando)
// Rombo rojo (imagen dentro del KMZ, por un StyleMap) → enemigo, en 📂 Abrir y en 🧩 Superponer.
const rojo = zipVarios([['doc.kml', conIcono('1ª Brig. Acor. «Coraceros» – Chungará', estiloImg('files/b1.png'))], ['files/b1.png', png([255, 34, 34])]])
assert.deepEqual(await bandoDe('Coraceros.kmz', rojo), ['enemigo'], 'rombo rojo sin la palabra «enemigo» = ficha ROJA')
const sup = (await superposicionDeArchivo(archivo('Coraceros.kmz', rojo))).grupos.flatMap(g => g.elementos)
assert.equal(sup[0].ficha.bando, 'enemigo'); assert.equal(sup[0].color, '#e0443a')
// Ícono azul → propia aunque la carpeta diga «enemigo»: manda lo que se ve.
const azul = zipVarios([['doc.kml', conIcono('RI-23 – Enemigo', estiloImg('files/a.png'))], ['files/a.png', png([31, 95, 191])]])
assert.deepEqual(await bandoDe('azul.kmz', azul), ['propias'], 'ícono azul = ficha AZUL')
// Ícono sin color claro (amarillo) → como antes, por las palabras.
const amarillo = n => zipVarios([['doc.kml', conIcono(n, estiloImg('files/y.png'))], ['files/y.png', png([240, 220, 30])]])
assert.deepEqual(await bandoDe('y.kmz', amarillo('2ª Brig. – SATURNO')), ['enemigo']); assert.deepEqual(await bandoDe('y.kmz', amarillo('2ª Brig. Mot.')), ['propias'])
// Tinte del ícono de Google Earth (aabbggrr) y los íconos de Google por su nombre, en un KML suelto.
const tinte = (c, href = 'http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png') => Buffer.from(conIcono('Brig. Mot. Nº 1', `<Style id="m"><IconStyle><color>${c}</color><Icon><href>${href}</href></Icon></IconStyle></Style>`))
assert.deepEqual(await bandoDe('t.kml', tinte('ff0000ff')), ['enemigo'], 'tinte rojo'); assert.deepEqual(await bandoDe('t.kml', tinte('ffff0000')), ['propias'], 'tinte azul')
assert.deepEqual(await bandoDe('t.kml', tinte('ffffffff', 'http://maps.google.com/mapfiles/kml/paddle/red-diamond.png')), ['enemigo'], 'red-diamond.png')
assert.deepEqual(await bandoDe('t.kml', tinte('ffffffff', 'http://maps.google.com/mapfiles/kml/paddle/blu-circle.png')), ['propias'], 'blu-circle.png')
// Los 4 KMZ reales de Sergio (si están en esta Mac): las cuatro brigadas, ROJAS.
const CARPETA = `${process.env.HOME}/Desktop/FF.TT.T.O.`
for (const n of ['1ª Brig. Acor. «Coraceros» – Chungará.kmz', '2ª Brig. Acor. «Cazadores» – Colchane.kmz', '3ª Brig. Acor. «La Concepción» – Ollagüe.kmz', 'Brig. Mot. Nº 1 «Calama» – Cancosa.kmz']) {
  const ruta = `${CARPETA}/${n}`
  if (existsSync(ruta)) assert.deepEqual(await bandoDe(n, readFileSync(ruta)), ['enemigo'], n)
}
console.log('abrir-kmz: el KMZ/KML de Google Earth se abre como ejercicio con sus Áreas de Operaciones y sus fichas rojas y azules (el color del ícono manda).')
