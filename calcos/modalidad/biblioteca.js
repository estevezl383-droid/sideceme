/* 📚 BIBLIOTECA del profesor: los documentos PROPIOS que el profesor ya tiene (COE de cada
   División, Organización y Armamento del enemigo, reglamentos…) cargados UNA vez en la Mesa y
   usados donde se necesiten.
   Lo pidió Sergio (10-10-2026) con los Word del Tema Base «DIAMANTE» (13 apéndices «COE de la
   DIV…», un .zip), el Apéndice 1 (Organización de RAGNAR), el Apéndice 2 (Armamento de RAGNAR),
   el Anexo B de Inteligencia y el RDO-20001: «que en la aplicación pueda cargar en formato
   Word estos docs, así los COE y la organización de cada división… donde se necesite lo puedo
   cargar».
   Puro (se prueba en Node con jszip.min.js):
   · leerDocx(buffer, JSZip): los párrafos y las TABLAS (filas × celdas) de un .docx.
   · leerCOE(docx): reconoce la tabla «CLASE | CMDO. | RCB-1 | … | TOTAL» con sus grupos
     PERSONAL · ARMAMENTO · VEHÍCULOS · EQUIPO ESPECIAL y devuelve la División y SUS unidades
     con los efectivos, el armamento y los vehículos de cada una.
   · armaDe / escalonDe: el arma y el escalón de la Mesa a partir de la sigla (RCB, RIM, RIAT,
     RAM, BAT. AA, BATING, BAT. COM, BAT. LOG, COMP. ICIA…).
   · fichasDeCOE(coe, op): las fichas para la carta (la División y sus unidades, AZUL o ROJO).
   · documento(nombre, datos): el documento de la biblioteca (tipo: coe · organizacion ·
     armamento · doctrina · otro) y resumen(docs, limite): lo que va en el pedido a la IA. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica()
  else raiz.SIDBiblioteca = fabrica()
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict'

  function limpia(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim() }
  function sinTildes(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '') }
  function ent(s) { return String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&') }
  function textoXML(x) {
    var t = '', re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:(tab|br|cr)\b[^>]*\/>/g, m
    while ((m = re.exec(x))) t += m[1] != null ? ent(m[1]) : ' '
    return limpia(t)
  }

  // ─── Word ──────────────────────────────────────────────────────────────────────────
  // El cuerpo en orden: párrafos sueltos y tablas (cada celda: su texto; una celda combinada
  // a lo ancho con gridSpan se repite para que las columnas queden alineadas).
  function leerDocumentXML(xml) {
    var cuerpo = (xml.match(/<w:body>([\s\S]*)<\/w:body>/) || [0, xml])[1]
    var parrafos = [], tablas = [], partes = [], re = /<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>/g, m
    while ((m = re.exec(cuerpo))) {
      if (m[0].indexOf('<w:tbl>') === 0) {
        var filas = (m[0].match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || []).map(function (tr) {
          var celdas = []
          ;(tr.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []).forEach(function (tc) {
            var span = +((tc.match(/<w:gridSpan w:val="(\d+)"/) || [])[1] || 1)
            var tx = (tc.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []).map(textoXML).filter(Boolean).join(' ')
            for (var i = 0; i < span; i++) celdas.push(i ? '' : tx)
          })
          return celdas
        })
        tablas.push(filas)
        partes.push(filas.map(function (f) { return f.join(' | ') }).join('\n'))
      } else {
        var p = textoXML(m[0])
        if (p) { parrafos.push(p); partes.push(p) }
      }
    }
    return { parrafos: parrafos, tablas: tablas, texto: partes.join('\n') }
  }
  function leerDocx(buffer, JSZip) {
    return JSZip.loadAsync(buffer).then(function (z) {
      var f = z.file('word/document.xml')
      if (!f) throw new Error('No es un Word (.docx): no tiene word/document.xml.')
      return f.async('string')
    }).then(leerDocumentXML)
  }

  // ─── Siglas → arma y escalón de la Mesa ───────────────────────────────────────────
  function norm(d) { return sinTildes(d).toUpperCase().replace(/\s+/g, ' ').trim() }
  var ARMAS = [ // el orden importa: lo más específico primero
    [/\bCMDO\b|\bCG\b|CUARTEL GENERAL/, null],
    [/\bC\s*Y\s*S\b|CYS/, 'ninguna'],
    [/\bRIAT\b|\bAT\b|ANTITANQ|ANTIBLIND/, 'antitanque'],
    [/\bA\.?\s*A\b|\bAA\b|ANTIAERE|\bDAA\b|\bRAA\b/, 'antiaerea'],
    [/\bRCB\b|BLIND|ACORAZ|\bTQ\b|TANQ/, 'blindada'],
    [/\bRIM\b|\bMEC\b.*\bINF|INF.*\bMEC\b|MECANIZ/, 'mecanizada'],
    [/\bERM\b|\bRC\b|CABALL|EXPLOR|\bESC(UADRON|\.)?\b/, 'cabmec'],
    [/\bRAM\b|\bRAC\b|\bRA\b|ARTILL|\bGA\b|\bOBUS/, 'artilleria'],
    [/ING|ZAPAD/, 'ingenieria'],
    [/\bCOM\b|TELECOM|COMUNIC/, 'comunicaciones'],
    [/\bLOG\b|LOGIST/, 'logistica'],
    [/\bSAN\b|SANIDAD/, 'sanidad'],
    [/ICIA|INTELIG|\bIM\b/, 'inteligencia'],
    [/\bPM\b|POLICIA MIL/, 'policiamilitar'],
    [/\bAV\b|AVIAC|HELIC/, 'aviacion'],
    [/MOTORIZ|\bMOT\b/, 'motorizada'],
    [/ANDIN|MONT/, 'andina'],
    [/SELVA/, 'selva'],
    [/\bRI\b|\bBI\b|INFANT|\bINF\b/, 'infanteria']
  ]
  function armaDe(designacion, armaDivision) {
    var d = norm(designacion)
    for (var i = 0; i < ARMAS.length; i++) if (ARMAS[i][0].test(d)) return ARMAS[i][1] || armaDivision || 'infanteria'
    return 'infanteria'
  }
  function escalonDe(designacion) {
    var d = norm(designacion)
    if (/\bCMDO\b|\bDIV\b|DIVISION/.test(d)) return 'division'
    if (/\bBR(IG)?\b|BRIGADA/.test(d)) return 'brigada'
    if (/^SECC?\b|SECCION|\bPLTN?\b|PELOTON/.test(d)) return 'seccion'
    if (/^COMP\b|^CIA\b|COMPANIA|^ESC\b|ESCUADRON|^ERM\b|^BAT\.? (CMDO|C Y S)|BATERIA/.test(d)) return 'compania'
    if (/^BAT|^B\.? ?[A-Z]|BATALLON|^GRUPO|^G\.? ?A\b/.test(d)) return 'batallon'
    if (/^R[A-Z]*\b|REGIMIENTO/.test(d)) return 'regimiento'
    return 'batallon'
  }

  // ─── El COE ────────────────────────────────────────────────────────────────────────
  var GRUPOS = { PERSONAL: 'personal', ARMAMENTO: 'armamento', VEHICULOS: 'vehiculos', 'EQUIPO ESPECIAL': 'equipo', EQUIPO: 'equipo', MATERIAL: 'equipo' }
  function numero(s) { var n = parseInt(String(s).replace(/[^\d]/g, ''), 10); return isFinite(n) ? n : 0 }
  function tablaCOE(t) {
    if (!t.length || norm(t[0][0]) !== 'CLASE') return null
    var cab = t[0].map(limpia)
    // La cabecera: CLASE (que ocupa la columna del grupo y la del rubro: con gridSpan ya viene
    // expandida; sin él, la cabecera tiene una celda menos que las filas) y después las unidades.
    var off = Math.max(0, (t[1] || []).length - cab.length), unidades = []
    for (var c = 1; c < cab.length; c++) if (cab[c]) unidades.push({ col: c + off, designacion: cab[c] })
    var total = null
    unidades = unidades.filter(function (u) { if (norm(u.designacion) === 'TOTAL') { total = u; return false } return true })
    var datos = unidades.map(function (u) { return { designacion: u.designacion, personal: {}, armamento: {}, vehiculos: {}, equipo: {} } })
    var totales = { personal: {}, armamento: {}, vehiculos: {}, equipo: {} }, grupo = 'personal'
    for (var r = 1; r < t.length; r++) {
      var f = t[r], g = norm(f[0])
      if (g && GRUPOS[g]) grupo = GRUPOS[g]
      var rubro = limpia(f[1]); if (!rubro) continue
      unidades.forEach(function (u, i) { var n = numero(f[u.col]); if (n) datos[i][grupo][rubro] = n })
      if (total) { var nt = numero(f[total.col]); if (nt) totales[grupo][rubro] = nt }
    }
    datos.forEach(function (u) { u.efectivo = u.personal.TOTAL || Object.keys(u.personal).reduce(function (s, k) { return s + u.personal[k] }, 0) })
    return { unidades: datos, totales: totales }
  }
  function leerCOE(docx) {
    var t = null
    for (var i = 0; i < docx.tablas.length && !t; i++) t = tablaCOE(docx.tablas[i])
    if (!t) return null
    var titulo = docx.parrafos.filter(function (p) { return /\bCOE\b/i.test(p) })[0] || ''
    var div = limpia((titulo.match(/COE\s+(?:de\s+la|del|de)\s+([^)]+)\)/i) || [])[1]) || limpia((titulo.match(/COE\s+([^\s(]+(?:\s[^\s(]+)?)/i) || [])[1]) || 'División'
    var armaDiv = /MEC/i.test(div) ? 'mecanizada' : /BLIND|ACORAZ/i.test(div) ? 'blindada' : /MOT/i.test(div) ? 'motorizada' : 'infanteria'
    t.unidades.forEach(function (u) { u.arma = armaDe(u.designacion, armaDiv); u.escalon = escalonDe(u.designacion) })
    return { division: div, arma: armaDiv, titulo: titulo, efectivo: t.totales.personal.TOTAL || t.unidades.reduce(function (s, u) { return s + (u.efectivo || 0) }, 0), unidades: t.unidades, totales: t.totales }
  }

  // Las fichas de un COE: el Comando de la División adelante… no: atrás, en el centro; las de
  // maniobra en una línea adelante; los apoyos de combate en el medio; los de servicio atrás.
  // AZUL mira al norte (ROJO espejado). Distancias en km, a escala de una División.
  var MANIOBRA = ['infanteria', 'mecanizada', 'motorizada', 'andina', 'selva', 'blindada', 'cabmec', 'caballeria', 'antitanque']
  var APOYO = ['artilleria', 'antiaerea', 'ingenieria', 'comunicaciones', 'inteligencia', 'aviacion']
  function fichasDeCOE(coe, op) {
    op = op || {}
    var centro = op.centro && isFinite(op.centro.lat) ? op.centro : { lat: -16.5, lng: -64.5 }
    var bando = /enem|rojo/i.test(op.bando || '') ? 'enemigas' : 'propias', s = bando === 'enemigas' ? -1 : 1
    var ahora = op.ahora || Date.now(), nombre = op.prefijo != null ? op.prefijo : ''
    var filas = [[], [], []] // maniobra, apoyo de combate, servicios (y el Cmdo.)
    var cmdo = null
    coe.unidades.forEach(function (u) {
      if (u.arma === 'ninguna') return // la Comp. C y S va con el Cmdo.
      if (/\bCMDO\b/i.test(u.designacion)) { cmdo = u; return }
      filas[MANIOBRA.indexOf(u.arma) >= 0 ? 0 : APOYO.indexOf(u.arma) >= 0 ? 1 : 2].push(u)
    })
    var lista = [{ u: cmdo || { designacion: 'Cmdo.', arma: coe.arma }, x: 0, y: -14, designacion: 'Cmdo. ' + coe.division, escalon: 'division', arma: coe.arma }]
    var ys = [6, -6, -20]
    filas.forEach(function (fila, k) {
      var paso = k === 0 ? 10 : 7
      fila.forEach(function (u, i) { lista.push({ u: u, x: (i - (fila.length - 1) / 2) * paso, y: ys[k] + (k === 2 && i % 2 ? -4 : 0), designacion: u.designacion, escalon: u.escalon, arma: u.arma }) })
    })
    var kmLat = 1 / 111.32, kmLng = 1 / (111.32 * Math.max(0.2, Math.cos(centro.lat * Math.PI / 180)))
    return lista.map(function (e, i) {
      var f = {
        id: 'coe-' + norm(coe.division).replace(/[^A-Z0-9]+/g, '') + '-' + ahora + '-' + i,
        bando: bando, tipo: 'unidad',
        designacion: limpia(nombre + e.designacion + (i && op.conDivision !== false && !/\bDIV/i.test(e.designacion) ? ' (' + coe.division + ')' : '')),
        arma: e.arma || 'infanteria', escalon: e.escalon || 'batallon',
        lat: Math.round((centro.lat + s * e.y * kmLat) * 1e6) / 1e6,
        lng: Math.round((centro.lng + e.x * kmLng) * 1e6) / 1e6,
        piezas: 3
      }
      if (e.u && e.u.efectivo) f.efectivo = e.u.efectivo
      if (i === 0 && coe.efectivo) f.efectivo = coe.efectivo
      return f
    })
  }

  // ─── Los documentos de la biblioteca ──────────────────────────────────────────────
  var TIPOS = [
    { id: 'coe', nom: 'COE (Cuadro de Organización y Equipo)' },
    { id: 'organizacion', nom: 'Organización (propia o enemiga)' },
    { id: 'armamento', nom: 'Armamento y equipo' },
    { id: 'inteligencia', nom: 'Inteligencia / situación' },
    { id: 'doctrina', nom: 'Reglamento / doctrina' },
    { id: 'otro', nom: 'Otro' }
  ]
  function tipoDe(nombre, texto, coe) {
    if (coe) return 'coe'
    var t = norm(nombre + ' ' + String(texto || '').slice(0, 1500))
    if (/ARMAMENTO|EQUIPO DE /.test(t)) return 'armamento'
    if (/ORGANIZACION/.test(t)) return 'organizacion'
    if (/INTELIGENCIA|SITUACION/.test(t)) return 'inteligencia'
    if (/REGLAMENTO|\bRDO\b|MANUAL|DOCTRINA/.test(t)) return 'doctrina'
    return 'otro'
  }
  var MAX_TEXTO = 400000 // lo que se guarda de cada documento (un reglamento entero pasa del medio millón)
  function documento(nombre, datos) {
    datos = datos || {}
    var texto = String(datos.texto || '')
    return {
      id: 'doc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      nombre: limpia(nombre) || 'Documento',
      tipo: datos.tipo || tipoDe(nombre, texto, datos.coe),
      bando: datos.bando || (/RAGNAR|ENEMIG|ROJO/i.test(nombre + texto.slice(0, 3000)) ? 'enemigas' : 'propias'),
      coe: datos.coe || null,
      texto: texto.length > MAX_TEXTO ? texto.slice(0, MAX_TEXTO) : texto,
      recortado: texto.length > MAX_TEXTO ? texto.length : 0,
      cargado: new Date().toISOString(),
      enIA: datos.enIA !== false
    }
  }
  function resumenCOE(c) {
    var rubros = function (o) { return Object.keys(o).filter(function (k) { return k !== 'TOTAL' }).map(function (k) { return k + ' ' + o[k] }).join(', ') }
    return 'COE de la ' + c.division + ' — efectivo total ' + (c.efectivo || '?') + '\n' +
      c.unidades.map(function (u) { return '- ' + u.designacion + ' (' + u.arma + ', ' + u.escalon + '): ' + (u.efectivo || '?') + ' H' + (Object.keys(u.armamento).length ? '; armamento: ' + rubros(u.armamento) : '') + (Object.keys(u.vehiculos).length ? '; vehículos: ' + rubros(u.vehiculos) : '') }).join('\n') +
      (Object.keys(c.totales.armamento).length ? '\nTotales de armamento: ' + rubros(c.totales.armamento) : '') +
      (Object.keys(c.totales.vehiculos).length ? '\nTotales de vehículos: ' + rubros(c.totales.vehiculos) : '')
  }
  // Lo que va en el pedido a la IA: los COE resumidos (enteros), los demás recortados en partes
  // iguales del espacio que queda. Primero COE, organización, armamento; la doctrina al final.
  function resumen(docs, limite) {
    limite = limite || 40000
    var orden = ['coe', 'organizacion', 'armamento', 'inteligencia', 'otro', 'doctrina']
    var ds = (docs || []).filter(function (d) { return d && d.enIA !== false }).sort(function (a, b) { return orden.indexOf(a.tipo) - orden.indexOf(b.tipo) })
    if (!ds.length) return ''
    var partes = ds.filter(function (d) { return d.coe }).map(function (d) { return '#### ' + d.nombre + ' (' + (d.bando === 'enemigas' ? 'ROJO' : 'AZUL') + ')\n' + resumenCOE(d.coe) })
    var usado = partes.join('\n\n').length, resto = ds.filter(function (d) { return !d.coe })
    var cupo = resto.length ? Math.max(1500, Math.floor((limite - usado) / resto.length)) : 0
    resto.forEach(function (d) {
      var t = limpia(d.texto)
      partes.push('#### ' + d.nombre + ' (' + nomTipo(d.tipo) + (d.tipo !== 'doctrina' ? ', ' + (d.bando === 'enemigas' ? 'ROJO' : 'AZUL') : '') + ')\n' + (t.length > cupo ? t.slice(0, cupo) + ' [… recortado: ' + (t.length - cupo) + ' caracteres más en la biblioteca]' : t))
    })
    return partes.join('\n\n')
  }
  function nomTipo(id) { for (var i = 0; i < TIPOS.length; i++) if (TIPOS[i].id === id) return TIPOS[i].nom; return 'Otro' }

  return { leerDocx: leerDocx, leerDocumentXML: leerDocumentXML, leerCOE: leerCOE, armaDe: armaDe, escalonDe: escalonDe, fichasDeCOE: fichasDeCOE, documento: documento, tipoDe: tipoDe, resumen: resumen, resumenCOE: resumenCOE, TIPOS: TIPOS, nomTipo: nomTipo }
})
