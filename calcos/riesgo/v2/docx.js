// Word (.docx) sin bibliotecas: el XML de Word se escribe a mano y se empaqueta en un
// ZIP sin compresión («stored»), que Word y LibreOffice abren igual que uno comprimido.
// Así la hoja puede llevar lo que el constructor de Word del compilado no hace (la
// elipse que encierra el nivel general, casilla K) y se prueba en Node sin navegador.
const enc = new TextEncoder()

let TABLA_CRC = null
export function crc32(b) {
  if (!TABLA_CRC) {
    TABLA_CRC = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      TABLA_CRC[n] = c >>> 0
    }
  }
  let c = 0xffffffff
  for (let i = 0; i < b.length; i++) c = TABLA_CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

// archivos: [{ nombre: 'word/document.xml', datos: string | Uint8Array }]
export function zip(archivos) {
  const fecha = ((2026 - 1980) << 9) | (1 << 5) | 1 // 01-01-2026: el mismo Word da los mismos bytes
  const locales = []
  const centrales = []
  let desplazamiento = 0
  for (const { nombre, datos } of archivos) {
    const nb = enc.encode(nombre)
    const d = typeof datos === 'string' ? enc.encode(datos) : datos
    const crc = crc32(d)
    const lh = new Uint8Array(30 + nb.length)
    const l = new DataView(lh.buffer)
    l.setUint32(0, 0x04034b50, true)
    l.setUint16(4, 20, true)
    l.setUint16(6, 0x0800, true) // nombres en UTF-8
    l.setUint16(8, 0, true) // sin compresión
    l.setUint16(10, 0, true)
    l.setUint16(12, fecha, true)
    l.setUint32(14, crc, true)
    l.setUint32(18, d.length, true)
    l.setUint32(22, d.length, true)
    l.setUint16(26, nb.length, true)
    l.setUint16(28, 0, true)
    lh.set(nb, 30)
    const ch = new Uint8Array(46 + nb.length)
    const c = new DataView(ch.buffer)
    c.setUint32(0, 0x02014b50, true)
    c.setUint16(4, 20, true)
    c.setUint16(6, 20, true)
    c.setUint16(8, 0x0800, true)
    c.setUint16(10, 0, true)
    c.setUint16(12, 0, true)
    c.setUint16(14, fecha, true)
    c.setUint32(16, crc, true)
    c.setUint32(20, d.length, true)
    c.setUint32(24, d.length, true)
    c.setUint16(28, nb.length, true)
    c.setUint32(42, desplazamiento, true)
    ch.set(nb, 46)
    locales.push(lh, d)
    centrales.push(ch)
    desplazamiento += lh.length + d.length
  }
  const tamCentral = centrales.reduce((s, x) => s + x.length, 0)
  const fin = new Uint8Array(22)
  const f = new DataView(fin.buffer)
  f.setUint32(0, 0x06054b50, true)
  f.setUint16(8, archivos.length, true)
  f.setUint16(10, archivos.length, true)
  f.setUint32(12, tamCentral, true)
  f.setUint32(16, desplazamiento, true)
  const total = new Uint8Array(desplazamiento + tamCentral + 22)
  let p = 0
  for (const x of [...locales, ...centrales, fin]) {
    total.set(x, p)
    p += x.length
  }
  return total
}

// Texto seguro para el XML (sin los caracteres de control que Word no acepta).
export const xmlEsc = (s) =>
  String(s ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// ─── Piezas de WordprocessingML ─────────────────────────────────────────────────
// Un tramo de texto. `\n` → salto de línea; `\t` → tabulación.
export function run(txt, { b = false, sz = 20, font = 'Arial', caps = false, color = '' } = {}) {
  const rpr = `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}" w:eastAsia="${font}"/>${b ? '<w:b/><w:bCs/>' : ''}${caps ? '<w:caps/>' : ''}${color ? `<w:color w:val="${color}"/>` : ''}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr>`
  const partes = String(txt ?? '').split(/(\n|\t)/)
  const cuerpo = partes.map((x) => (x === '\n' ? '<w:br/>' : x === '\t' ? '<w:tab/>' : x ? `<w:t xml:space="preserve">${xmlEsc(x)}</w:t>` : '')).join('')
  return `<w:r>${rpr}${cuerpo}</w:r>`
}
export function campo(instr, visible, op = {}) {
  const r = (x) => `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${op.b ? '<w:b/><w:bCs/>' : ''}<w:sz w:val="${op.sz || 20}"/><w:szCs w:val="${op.sz || 20}"/></w:rPr>${x}</w:r>`
  return r('<w:fldChar w:fldCharType="begin"/>') + r(`<w:instrText xml:space="preserve"> ${instr} </w:instrText>`) + r('<w:fldChar w:fldCharType="separate"/>') + r(`<w:t>${xmlEsc(visible)}</w:t>`) + r('<w:fldChar w:fldCharType="end"/>')
}
// Un párrafo. jc: left | center | right | both. tabs: [{ pos, tipo: 'left'|'center'|'right' }]
export function par(contenido, { jc = 'left', antes = 0, despues = 0, izq = 0, colgante = 0, tabs = [], numId = 0, keepNext = false, interlineado = 240 } = {}) {
  const t = tabs.length ? `<w:tabs>${tabs.map((x) => `<w:tab w:val="${x.tipo || 'left'}" w:pos="${Math.round(x.pos)}"/>`).join('')}</w:tabs>` : ''
  const num = numId ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr>` : ''
  const ind = izq || colgante ? `<w:ind w:left="${izq}"${colgante ? ` w:hanging="${colgante}"` : ''}/>` : ''
  return `<w:p><w:pPr>${keepNext ? '<w:keepNext/>' : ''}${num}${t}<w:spacing w:before="${antes}" w:after="${despues}" w:line="${interlineado}" w:lineRule="auto"/>${ind}<w:jc w:val="${jc}"/></w:pPr>${contenido}</w:p>`
}
// Una celda. `span`: columnas que ocupa; `vMerge`: 'restart' | 'continue'.
export function celda(pars, { ancho, span = 1, vMerge = '', vAlign = 'top', relleno = '' } = {}) {
  const contenido = (Array.isArray(pars) ? pars : [pars]).filter(Boolean).join('') || par('')
  return `<w:tc><w:tcPr><w:tcW w:w="${Math.round(ancho)}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ''}${vMerge ? `<w:vMerge w:val="${vMerge}"/>` : ''}${relleno ? `<w:shd w:val="clear" w:color="auto" w:fill="${relleno}"/>` : ''}<w:vAlign w:val="${vAlign}"/></w:tcPr>${contenido}</w:tc>`
}
export function fila(celdas, { noPartir = true, encabezado = false } = {}) {
  const tr = noPartir || encabezado ? `<w:trPr>${noPartir ? '<w:cantSplit/>' : ''}${encabezado ? '<w:tblHeader/>' : ''}</w:trPr>` : ''
  return `<w:tr>${tr}${celdas.join('')}</w:tr>`
}
export function tabla(filas, anchos, { margenCelda = 70 } = {}) {
  const borde = (x) => `<w:${x} w:val="single" w:sz="6" w:space="0" w:color="000000"/>`
  const total = anchos.reduce((s, x) => s + x, 0)
  return `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(borde).join('')}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="${margenCelda}" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="${margenCelda}" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="0000" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="0"/></w:tblPr><w:tblGrid>${anchos.map((w) => `<w:gridCol w:w="${Math.round(w)}"/>`).join('')}</w:tblGrid>${filas.join('')}</w:tbl>`
}

// Elipse sin relleno anclada al texto que sigue (encierra el nivel general, casilla K).
// dx, dy, ancho y alto en puntos; posición relativa al carácter y al párrafo.
export function elipse({ dx = 0, dy = 0, ancho = 100, alto = 20, id = 1, grosor = 1.25 } = {}) {
  const emu = (pt) => Math.round(pt * 12700)
  const w = emu(ancho)
  const hh = emu(alto)
  const anchor = `<wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${251659264 + id}" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="character"><wp:posOffset>${emu(dx)}</wp:posOffset></wp:positionH><wp:positionV relativeFrom="paragraph"><wp:posOffset>${emu(dy)}</wp:posOffset></wp:positionV><wp:extent cx="${w}" cy="${hh}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${id}" name="Elipse ${id}" descr="Nivel general encerrado en un círculo"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:cNvSpPr/><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${w}" cy="${hh}"/></a:xfrm><a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="${emu(grosor)}"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln></wps:spPr><wps:bodyPr rot="0" vert="horz" wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr" anchorCtr="0"><a:noAutofit/></wps:bodyPr></wps:wsp></a:graphicData></a:graphic></wp:anchor>`
  const vml = `<w:pict><v:oval style="position:absolute;margin-left:${dx.toFixed(1)}pt;margin-top:${dy.toFixed(1)}pt;width:${ancho.toFixed(1)}pt;height:${alto.toFixed(1)}pt;z-index:${251659264 + id};mso-position-horizontal:absolute;mso-position-horizontal-relative:char;mso-position-vertical:absolute;mso-position-vertical-relative:text" filled="f" strokeweight="${grosor}pt"/></w:pict>`
  return `<w:r><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing>${anchor}</w:drawing></mc:Choice><mc:Fallback>${vml}</mc:Fallback></mc:AlternateContent></w:r>`
}

// Ancho aproximado (en puntos) de un texto en Arial negrilla: alcanza para dimensionar
// la elipse. Tabla en milésimas de em (métricas de Arial Bold).
const ANCHO_ARIAL_B = { ' ': 278, '(': 333, ')': 333, '.': 278, '-': 333, '/': 278, A: 722, B: 722, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 556, K: 722, L: 611, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611 }
export const anchoTexto = (t, pt = 10) => ([...String(t)].reduce((s, c) => s + (ANCHO_ARIAL_B[c.toUpperCase()] ?? 611), 0) * pt) / 1000

// ─── El paquete .docx ───────────────────────────────────────────────────────────
const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
const NS_DIBUJO = 'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w10="urn:schemas-microsoft-com:office:word"'
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'

// Viñetas: 1 = ✓ (Wingdings, como el ejemplo del reglamento) · 2 = «-» (como la
// matriz de la Escuela).
const NUMERACION = `${XML}<w:numbering ${NS}><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="&#xF0FC;"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="284" w:hanging="284"/></w:pPr><w:rPr><w:rFonts w:ascii="Wingdings" w:hAnsi="Wingdings" w:hint="default"/></w:rPr></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="-"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="227" w:hanging="227"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:hint="default"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`
const ESTILOS = `${XML}<w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="es-BO" w:eastAsia="es-BO" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="table" w:default="1" w:styleId="TablaNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`
const AJUSTES = `${XML}<w:settings ${NS}><w:zoom w:percent="100"/><w:defaultTabStop w:val="708"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`

// cuerpo: el XML de los párrafos y tablas. seccion: { ancho, alto, apaisada, margenes }.
export function paqueteDocx({ cuerpo, encabezado, pie, pagina, titulo = '', autor = 'SIDECEME — Mesa del Estado Mayor' }) {
  const p = pagina
  const documento = `${XML}<w:document ${NS} ${NS_DIBUJO}><w:body>${cuerpo}<w:sectPr><w:headerReference w:type="default" r:id="rIdEnc"/><w:footerReference w:type="default" r:id="rIdPie"/><w:pgSz w:w="${p.ancho}" w:h="${p.alto}"${p.apaisada ? ' w:orient="landscape"' : ''}/><w:pgMar w:top="${p.arriba}" w:right="${p.der}" w:bottom="${p.abajo}" w:left="${p.izq}" w:header="${p.encabezado}" w:footer="${p.pie}" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>`
  const hoy = '2026-01-01T00:00:00Z'
  return zip([
    {
      nombre: '[Content_Types].xml',
      datos: `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
    },
    {
      nombre: '_rels/.rels',
      datos: `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
    },
    {
      nombre: 'docProps/core.xml',
      datos: `${XML}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEsc(titulo)}</dc:title><dc:creator>${xmlEsc(autor)}</dc:creator><cp:lastModifiedBy>${xmlEsc(autor)}</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${hoy}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${hoy}</dcterms:modified></cp:coreProperties>`,
    },
    {
      nombre: 'docProps/app.xml',
      datos: `${XML}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>SIDECEME</Application></Properties>`,
    },
    {
      nombre: 'word/_rels/document.xml.rels',
      datos: `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdEstilos" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdAjustes" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rIdEnc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdPie" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>`,
    },
    { nombre: 'word/document.xml', datos: documento },
    { nombre: 'word/styles.xml', datos: ESTILOS },
    { nombre: 'word/settings.xml', datos: AJUSTES },
    { nombre: 'word/numbering.xml', datos: NUMERACION },
    { nombre: 'word/header1.xml', datos: `${XML}<w:hdr ${NS}>${encabezado}</w:hdr>` },
    { nombre: 'word/footer1.xml', datos: `${XML}<w:ftr ${NS}>${pie}</w:ftr>` },
  ])
}
