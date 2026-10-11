/* 📍 LO QUE LA OGO LEE DE LA MESA (modalidad Profesor). Código aparte del compilado, puro (se prueba
   en Node). Lo pidió Sergio (11-10-2026) con el Word del Anexo A que le salió con «[Escalón superior
   pendiente]», «[Unidad pendiente]», «CG. [Lugar pendiente]» y «No. 002/[Iniciales pendientes]»:
   «siempre que se habla de FF.TT.T.O. el escalón superior es el CTO… la unidad considerada ya te dije
   al inicio que somos las FF.TT.T.O. … si ya sabés en el calco que mi unidad está en Tunapa, la
   ubicación del CG debería estar llena… los CG o los PC tienen el nombre de la población más cercana
   y por eso tenés el calco de poblaciones». Y con la organización de la tarea que trajo unidades
   «(supuesto)» que no estaban en la carta: «generame esas unidades y su ubicación y que me salga un
   panel que diga aceptar».
   · identidad(ej, escalon): quién expide (la unidad de «¿Quién soy?» del inicio del ejercicio, si es
     del escalón del profesor), su escalón superior (FF.TT.T.O. → CTO), los alumnos (las fichas del
     escalón de abajo), la ficha de su PC y la POBLACIÓN MÁS CERCANA (capa «Centros poblados»).
   · poblaciones(ej) / masCercana(pobs, lat, lng): la capa de poblaciones de los calcos del terreno.
   · mismaUnidad(a, b): «I CUERPO DE EJÉRCITO (I CE)» = «CE-I» = «C.E. 1»; «BATALLÓN LOGÍSTICO DE
     FF.TT.» = «Bat. Log. FF.TT.».
   · unidadesDeOrganizacion(org): las unidades de la ORGANIZACIÓN DE LA TAREA (las agrupaciones y lo
     que tienen: «GALM-1 (OPCON…)»), con su arma, su escalón y si vino «(supuesto)».
   · faltantes(lista, fichas) / sugerir(u, ej, ident, i): las que no están en la carta y dónde
     ponerlas (detrás del PC lo logístico, entre el PC y el frente la artillería…), siempre dentro
     del Área de Operaciones.
   · ficha(u): la ficha para la Mesa (la forma de academico.js) · quitarSupuesto(texto, nombre). */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica()
  else raiz.SIDOgoMesa = fabrica()
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict'

  function una(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim() }
  function sinTildes(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '') }
  // En el membrete y en la firma va SÓLO la sigla (Sergio, 11-10-2026: el Word decía «FF.TT.T.O. ()FUERZAS
  // TERRESTRES DEL TEATRO DE OPERACIONES» y «es solo esto: FF.TT.T.O.»). Saca el desarrollo de una sigla con
  // puntos cuando sus palabras empiezan con las letras de la sigla, entre paréntesis o pegado a un «()», y los
  // «()» vacíos; sin paréntesis, sólo si la sigla tiene 3 grupos o más. La misma regla que
  // calcos/membrete/v1/membrete.js (sinDesarrollo), para el resto de los documentos.
  var CONECTORES = { DE: 1, DEL: 1, LA: 1, LAS: 1, LOS: 1, EL: 1, Y: 1, EN: 1 }
  function sinDesarrollo(texto) {
    var s = String(texto == null ? '' : texto), re = /(?:[A-ZÁÉÍÓÚÑ]{1,3}\.){2,}/g, out = '', desde = 0, m
    while ((m = re.exec(s))) {
      var fin = m.index + m[0].length, resto = s.slice(fin)
      var letras = m[0].split('.').filter(Boolean).map(function (g) { return sinTildes(g)[0] })
      var cab = /^(\s*\(\s*\))?\s*(\()?\s*/.exec(resto), j = cab[0].length, n = 0, w
      while (n < letras.length && (w = /^([A-Za-zÁÉÍÓÚÑáéíóúñÜü]+)\s*/.exec(resto.slice(j)))) {
        var P = sinTildes(w[1]).toUpperCase()
        if (CONECTORES[P] && n > 0) { j += w[0].length; continue }
        if (P.length < 2 || P[0] !== letras[n]) break
        n++; j += w[0].length
      }
      if (n < letras.length || (!cab[1] && !cab[2] && letras.length < 3)) continue
      if (cab[2]) { var c = /^\s*\)/.exec(resto.slice(j)); if (!c) continue; j += c[0].length }
      out += s.slice(desde, fin) + (/^[\w(«“"]/.test(resto.slice(j)) ? ' ' : '')
      desde = fin + j; re.lastIndex = desde
    }
    return una((out + s.slice(desde)).replace(/\(\s*\)/g, ' ')).replace(/\s+([.,;:])/g, '$1')
  }
  function r4(x) { return Math.round(x * 1e4) / 1e4 }
  function r6(x) { return Math.round(x * 1e6) / 1e6 }
  function enemiga(u) { return /enem|rojo/i.test(String(u && u.bando || '')) }
  function conLugar(u) { return u && isFinite(+u.lat) && isFinite(+u.lng) && u.lat !== null && u.lng !== null }
  function km(a, b) { // [lng, lat]
    var r = function (x) { return x * Math.PI / 180 }, x = r(b[1] - a[1]), y = r(b[0] - a[0])
    return 12742 * Math.asin(Math.sqrt(Math.pow(Math.sin(x / 2), 2) + Math.cos(r(a[1])) * Math.cos(r(b[1])) * Math.pow(Math.sin(y / 2), 2)))
  }

  // ─── Las designaciones ──────────────────────────────────────────────────────────────
  // Las fichas de la Mesa (escalon) y los escalones del profesor (catalogo.js: ESCALONES).
  var ESC_FICHA = { fftt: 'ejercito', ce: 'cuerpo', div: 'division', brig: 'brigada', unidad: 'regimiento' }
  var DEBAJO = { fftt: 'ce', ce: 'div', div: 'brig', brig: 'unidad' }
  var SINONIMOS = {
    CUERPO: 'CE', AGRUPACION: 'AGR', AGRUP: 'AGR', BATALLON: 'BAT', BTN: 'BAT', BN: 'BAT', B: 'BAT', BRIGADA: 'BR', BRIG: 'BR', GRUPO: 'G', GPO: 'G',
    REGIMIENTO: 'R', REG: 'R', RGTO: 'R', COMPANIA: 'CIA', CIA: 'CIA', COMP: 'CIA', DIVISION: 'DIV', DIV: 'DIV', DI: 'DIV', DIMEC: 'DIV MEC', DIVMEC: 'DIV MEC',
    SECCION: 'SECC', SEC: 'SECC', ESCUADRON: 'ESC', ARTILLERIA: 'ART', ARTILLERO: 'ART', ING: 'ING', INGENIEROS: 'ING', INGENIERIA: 'ING', ZAPADORES: 'ING',
    LOGISTICO: 'LOG', LOGISTICA: 'LOG', LOGISTICOS: 'LOG', AVIACION: 'AV', AV: 'AV', EJERCITO: 'EJ', EJTO: 'EJ', EJ: 'EJ', COMUNICACIONES: 'COM', TELECOMUNICACIONES: 'COM', TELECOM: 'COM', TRANSMISIONES: 'COM',
    ANTIAEREA: 'AA', ANTIAEREO: 'AA', DAA: 'AA', ADA: 'AA', SANIDAD: 'SAN', INTELIGENCIA: 'ICIA', INTEL: 'ICIA', MECANIZADA: 'MEC', MECANIZADO: 'MEC', BLINDADA: 'BL', BLINDADO: 'BL', ACORAZADA: 'BL',
    CABALLERIA: 'CAB', INFANTERIA: 'INF', MOTORIZADA: 'MOT', MOTORIZADO: 'MOT', LANZADORES: 'LANZ', COHETES: 'LANZ', POLICIA: 'PM', COMANDO: 'CMDO', CMDO: 'CMDO', MULTIPLES: 'MULT', MULTIPLE: 'MULT',
    TRANSPORTE: 'TRANSP', MANTENIMIENTO: 'MANT', INTENDENCIA: 'INT', RESERVA: 'RES'
  }
  var VACIAS = { DE: 1, DEL: 1, LA: 1, LAS: 1, LOS: 1, EL: 1, Y: 1, A: 1, EN: 1, ORGANICO: 1, ORGANICA: 1, SUPUESTO: 1, SUPUESTA: 1 }
  var ROMANOS = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 }
  // «FF.TT.T.O.» → «FFTTTO», «C.E.» → «CE», «D.A.A.» → «DAA»: las siglas con puntos van juntas
  function juntarSiglas(t) { return t.replace(/\b((?:[A-Z]{1,2}\.){2,})/g, function (m) { return m.replace(/\./g, '') + ' ' }) }
  function fichas_(s) { // los tokens de una designación, en mayúsculas, sin tildes y con sinónimos
    var t = juntarSiglas(sinTildes(s).toUpperCase().replace(/[«»“”"']/g, ' '))
    t = t.replace(/CUERPO\s+DE\s+EJ[EÉ]RCITO/g, 'CE').replace(/\bFF[\s.]*TT\b/g, 'FFTT').replace(/[.\-–_/,;:()]/g, ' ')
    return t.split(/\s+/).filter(Boolean).map(function (x) {
      if (/^FFTT/.test(x)) return x // FFTT, FFTTTO
      if (/^\d+$/.test(x)) return String(+x)
      if (ROMANOS[x]) return String(ROMANOS[x])
      return SINONIMOS[x] || x
    }).join(' ').split(' ').filter(function (x) { return x && !VACIAS[x] })
  }
  function rasgos(s) {
    var sinPar = String(s == null ? '' : s).replace(/\([^)]*\)/g, ' ') // «I CUERPO DE EJÉRCITO (I CE)»: lo de afuera
    var tk = fichas_(una(sinPar) ? sinPar : s), k = tk.join(' ')
    var nums = tk.filter(function (x, i) { return /^\d+$/.test(x) && tk.indexOf(x) === i })
    var arma = /\bGALM\b|\bLANZ\b/.test(k) ? 'lanzacohetes' : /\bART\b/.test(k) ? 'artilleria' : /\bING\b/.test(k) ? 'ingenieria' : /\bLOG\b/.test(k) ? 'logistica' :
      /\bAV\b/.test(k) ? 'aviacion' : /\bCOM\b/.test(k) ? 'comunicaciones' : /\bAA\b/.test(k) ? 'antiaerea' : /\bSAN\b/.test(k) ? 'sanidad' : /\bICIA\b/.test(k) ? 'inteligencia' :
      /\bPM\b/.test(k) ? 'policiamilitar' : /\bTRANSP\b/.test(k) ? 'transporte' : /\bMANT\b/.test(k) ? 'mantenimiento' : /\bINT\b/.test(k) ? 'intendencia' : ''
    var nivel = /^(CMDO )?FFTT/.test(k) ? 'ejercito' : /(^|\b)CE\b/.test(k) ? 'cuerpo' : /\bDIV\b/.test(k) ? 'division' : /\b(BR|AGR)\b/.test(k) ? 'brigada' :
      /\b(R|RI|RC|RA|RIM|RCB|RIAT|RAM|RAA|RCM|RIMEC)\b/.test(k) ? 'regimiento' : /\b(BAT|G|GALM)\b/.test(k) ? 'batallon' : /\bCIA\b|\bESC\b/.test(k) ? 'compania' : /\bSECC\b/.test(k) ? 'seccion' : ''
    return { k: k, nums: nums, arma: arma, nivel: nivel, fftt: /FFTT/.test(k) }
  }
  function mismaUnidad(a, b) {
    if (!una(a) || !una(b)) return false
    var A = rasgos(a), B = rasgos(b)
    if (A.k && A.k === B.k) return true
    var mismosNums = A.nums.join(',') === B.nums.join(',')
    if (A.arma || B.arma) return A.arma === B.arma && mismosNums && A.fftt === B.fftt && (!A.nivel || !B.nivel || A.nivel === B.nivel || /brigada|batallon/.test(A.nivel + B.nivel) && !A.nums.length)
    return !!A.nivel && A.nivel === B.nivel && mismosNums && (A.nums.length > 0 || A.fftt === B.fftt && A.fftt)
  }
  // El escalón del profesor por el nombre de la unidad (catalogo.js: fftt, ce, div, brig).
  function nivelDe(nombre) {
    var k = rasgos(nombre).k
    if (/^(CMDO )?FFTT/.test(k)) return 'fftt'
    if (/^(CMDO )?(\d+ )?CE\b/.test(k)) return 'ce'
    if (/^(CMDO )?DIV\b/.test(k)) return 'div'
    if (/^(CMDO )?BR\b/.test(k)) return 'brig'
    if (/^(R|RI|RC|RA|RIM|RCB|RIAT|RAM|RAA|RCM|RIMEC|BAT|G|GALM)\b/.test(k)) return 'unidad'
    return ''
  }
  // Lo pidió Sergio: el escalón superior de las FF.TT.T.O. es SIEMPRE el CTO (Comando del Teatro de Operaciones).
  function superiorDe(unidad) { return nivelDe(unidad) === 'fftt' ? 'CTO' : '' }

  // ─── La capa de poblaciones ─────────────────────────────────────────────────────────
  var TIPO_POB = { city: 'Ciudad', town: 'Pueblo', village: 'Poblado', hamlet: 'Caserío', locality: 'Localidad', isolated_dwelling: 'Vivienda aislada', farm: 'Estancia', suburb: 'Barrio', national_capital: 'Capital' }
  function coordDe(p) {
    var g = p && p.geometry, c = g && (g.type === 'Point' ? g.coordinates : null) || (p && p.coords)
    if (Array.isArray(c) && c.length >= 2 && isFinite(+c[0]) && isFinite(+c[1])) return [+c[0], +c[1]]
    if (p && isFinite(+p.lat) && isFinite(+p.lng) && p.lat != null) return [+p.lng, +p.lat]
    return null
  }
  function poblaciones(ej) {
    ej = ej || {}
    var out = [], visto = {}
    var capas = [ej.resultados, ej.datosCapas, ej.datosAnalizados].filter(Boolean)
    capas.forEach(function (cs) {
      var c = cs.poblaciones_puntos
      var fs = (c && ((c.fc && c.fc.features) || c.features)) || []
      fs.forEach(function (f) { out.push(f) })
    })
    ;((ej.cmoc && ej.cmoc.poblaciones) || []).forEach(function (p) { out.push(p) })
    return out.map(function (f) {
      var pr = f.properties || f, c = coordDe(f), nom = una(pr.name || pr.nombre || pr.Nombre || pr.NOMBRE || pr.nom)
      var pob = +(pr._censo && pr._censo.pob2024) || +pr.population || +pr.poblacion || +pr._pob2024 || 0
      return c && nom && !/^sin nombre$/i.test(nom) ? { nombre: nom, tipo: TIPO_POB[pr.fclass] || una(pr.tipo || pr.Tipo || ''), lat: c[1], lng: c[0], poblacion: pob } : null
    }).filter(function (p) { if (!p) return false; var k = p.nombre + '|' + r4(p.lat) + '|' + r4(p.lng); if (visto[k]) return false; visto[k] = 1; return true })
  }
  function masCercana(pobs, lat, lng, maxKm) {
    if (!isFinite(+lat) || !isFinite(+lng)) return null
    var mejor = null
    ;(pobs || []).forEach(function (p) { var d = km([+lng, +lat], [p.lng, p.lat]); if (!mejor || d < mejor.km) mejor = { nombre: p.nombre, tipo: p.tipo, lat: p.lat, lng: p.lng, poblacion: p.poblacion, km: d } })
    return mejor && mejor.km <= (maxKm || 60) ? mejor : null
  }
  // Las poblaciones más grandes (y las más cercanas a las fichas propias) para el pedido a la IA.
  function poblacionesParaPedido(ej, max) {
    var pobs = poblaciones(ej), propias = ((ej && ej.unidades) || []).filter(function (u) { return conLugar(u) && !enemiga(u) })
    var ao = anillo(ej), dentro_ = function (p) { return !ao || dentro([p.lng, p.lat], ao) }
    var cerca = {}
    propias.forEach(function (u) { var c = masCercana(pobs, u.lat, u.lng); if (c) cerca[c.nombre + '|' + r4(c.lat)] = 1 })
    return pobs.filter(dentro_).sort(function (a, b) { return (cerca[b.nombre + '|' + r4(b.lat)] || 0) - (cerca[a.nombre + '|' + r4(a.lat)] || 0) || b.poblacion - a.poblacion }).slice(0, max || 60)
  }

  // ─── El Área de Operaciones ─────────────────────────────────────────────────────────
  // El Área de Operaciones de quien expide: la MÁS GRANDE de las áreas del ejercicio. Las que se cortaron
  // con la tijera (✂️ lazo: la de cada Cuerpo) son pedazos de ella, aunque una esté seleccionada.
  function limpiaAnillo(c) { return (Array.isArray(c) ? c : []).filter(function (p) { return Array.isArray(p) && isFinite(+p[0]) && isFinite(+p[1]) && p[0] !== null }).map(function (p) { return [+p[0], +p[1]] }) }
  function superficie(an) { var s = 0; for (var i = 0, j = an.length - 1; i < an.length; j = i++) s += an[j][0] * an[i][1] - an[i][0] * an[j][1]; return Math.abs(s / 2) }
  function areas(ej) {
    var o = (ej && ej.ops) || {}, l = (o.areasOps || []).slice()
    if (o.areaOps && !l.some(function (a) { return a && o.areaOps.id && a.id === o.areaOps.id })) l.unshift(o.areaOps)
    return l.map(function (a) { return a && { a: a, an: limpiaAnillo(a.coords) } }).filter(function (x) { return x && x.an.length >= 3 })
  }
  function areaMayor(ej) { var l = areas(ej); l.sort(function (x, y) { return superficie(y.an) - superficie(x.an) }); return l[0] || null }
  function anillo(ej) { var m = areaMayor(ej); return m ? m.an : null }
  function dentro(p, an) {
    var c = false
    for (var i = 0, j = an.length - 1; i < an.length; j = i++) {
      var a = an[i], b = an[j]
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c
    }
    return c
  }
  function centroide(an) { var x = 0, y = 0; an.forEach(function (p) { x += +p[0]; y += +p[1] }); return [x / an.length, y / an.length] }

  // ─── Quién expide ───────────────────────────────────────────────────────────────────
  // La ficha de quien expide: su PC (tipo «pc») o su ficha, por el nombre; si no, la del escalón.
  function fichaDe(unidades, nombre, nivel) {
    var ps = (unidades || []).filter(function (u) { return conLugar(u) && !enemiga(u) })
    var pcs = ps.filter(function (u) { return u.tipo === 'pc' }), us = ps.filter(function (u) { return (u.tipo || 'unidad') === 'unidad' })
    var nom = function (u) { return u.designacion || u.nombre || '' }
    var porNombre = function (l) { return l.filter(function (u) { var d = nom(u).replace(/^\s*(P\.?\s?C\.?|PUESTO\s+(DE\s+)?(COMANDO|MANDO))\s*(PRINCIPAL|PPAL\.?)?\s*(DE\s+(LAS?|LOS)?\s*)?/i, ''); return nombre && (mismaUnidad(d, nombre) || mismaUnidad(nom(u), nombre)) })[0] }
    var esc = ESC_FICHA[nivel], porEscalon = function (l) { var x = l.filter(function (u) { return esc && u.escalon === esc }); return x.length === 1 ? x[0] : null }
    var alterno = function (u) { return /altern/i.test(nom(u)) }
    return porNombre(pcs.filter(function (u) { return !alterno(u) })) || porNombre(us) || porEscalon(pcs.filter(function (u) { return !alterno(u) })) || porEscalon(us) || null
  }
  function ordenarPorNumero(a, b) { var na = +(rasgos(a).nums[0] || 0), nb = +(rasgos(b).nums[0] || 0); return na - nb || String(a).localeCompare(String(b)) }
  function lista(xs) { return xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1] }
  // → { unidad, superior, alumnos, ficha, lugar: {nombre, km, …}, fuentes: {campo: 'de dónde'} }
  function identidad(ej, escalon) {
    ej = ej || {}
    var os = ej.ordenSup || {}, uc = ej.ops && ej.ops.unidadConsiderada, yo = una(uc && uc.nombre) || una(os.unidad), f = {}, sup = una(os.escalonSuperior)
    var r = { unidad: '', superior: '', alumnos: '', ficha: null, lugar: null, fuentes: f }
    // «¿Quién soy?» es quien expide si es del escalón del profesor, o si «Mesa · Preparación» no nombra
    // otro escalón superior (o nombra el de ella: «CTO» para las FF.TT.T.O.); si no, son los alumnos.
    if (yo && nivelDe(yo) && (nivelDe(yo) === escalon || !sup || mismaUnidad(sup, superiorDe(yo)) || sup.toUpperCase() === superiorDe(yo))) { r.unidad = yo; f.unidad = '«¿Quién soy?» del inicio del ejercicio' }
    else if (sup) { r.unidad = sup; f.unidad = '«Mesa · Preparación» (escalón superior)'; if (yo && !mismaUnidad(yo, r.unidad)) { r.alumnos = yo; f.alumnos = '«¿Quién soy?» del inicio del ejercicio' } }
    var nivelProf = escalon || nivelDe(r.unidad) || ''
    if (!r.unidad && nivelProf) { // sin identidad: la ficha del escalón del profesor («Cmdo. FF.TT. «…»»)
      var fe = fichaDe(ej.unidades, '', nivelProf)
      if (fe && fe.tipo !== 'pc') { r.unidad = una(String(fe.designacion || fe.nombre || '').replace(/^\s*CMDO\.?\s*/i, '')); if (r.unidad) f.unidad = 'La ficha «' + una(fe.designacion || fe.nombre) + '» de la carta' }
    }
    r.superior = superiorDe(r.unidad)
    if (r.superior) f.superior = 'Regla de la Escuela: el escalón superior de las FF.TT.T.O. es el CTO'
    else if (sup && r.unidad && !mismaUnidad(sup, r.unidad)) { r.superior = sup; f.superior = '«Mesa · Preparación»' }
    if (!r.alumnos) {
      var abajo = ESC_FICHA[DEBAJO[nivelProf]]
      var ds = ((ej.unidades || []).filter(function (u) { return !enemiga(u) && (u.tipo || 'unidad') === 'unidad' && u.escalon === abajo }).map(function (u) { return una(u.designacion || u.nombre) }).filter(Boolean))
      ds = ds.filter(function (d, i) { return ds.indexOf(d) === i }).sort(ordenarPorNumero)
      if (una(os.unidadPropia)) { r.alumnos = una(os.unidadPropia); f.alumnos = '«Mesa · Preparación»' }
      else if (ds.length && ds.length <= 8) { r.alumnos = lista(ds); f.alumnos = 'Las fichas propias del escalón de abajo (' + abajo + ')' }
    }
    r.ficha = fichaDe(ej.unidades, r.unidad, nivelProf)
    if (r.ficha) {
      r.lugar = masCercana(poblaciones(ej), r.ficha.lat, r.ficha.lng)
      if (r.lugar) f.lugar = 'La población más cercana (' + r.lugar.km.toFixed(1).replace('.', ',') + ' km) a la ficha «' + una(r.ficha.designacion || r.ficha.nombre) + '» (capa Centros poblados)'
    }
    return r
  }

  // ─── Las unidades de la organización de la tarea ────────────────────────────────────
  var ABREV = [[/\bAGRUPACI[OÓ]N\b/gi, 'AGR.'], [/\bBATALL[OÓ]N\b/gi, 'BAT.'], [/\bBRIGADA\b/gi, 'BR.'], [/\bREGIMIENTO\b/gi, 'REG.'], [/\bCOMPA[NÑ][IÍ]A\b/gi, 'CÍA.'], [/\bDIVISI[OÓ]N\b/gi, 'DIV.'],
    [/\bARTILLER[IÍ]A\b/gi, 'ART.'], [/\bINGENIEROS?\b/gi, 'ING.'], [/\bLOG[IÍ]STIC[OA]S?\b/gi, 'LOG.'], [/\bAVIACI[OÓ]N\b/gi, 'AV.'], [/\bEJ[EÉ]RCITO\b/gi, 'EJTO.'],
    [/\bCOMUNICACIONES\b/gi, 'COM.'], [/\bANTIA[EÉ]RE[AO]\b/gi, 'AA.'], [/\bSANIDAD\b/gi, 'SAN.'], [/\bINTELIGENCIA\b/gi, 'ICIA.'], [/\bMECANIZAD[AO]\b/gi, 'MEC.'], [/\bGRUPO\b/gi, 'GPO.']]
  function abreviar(nombre) {
    var t = una(nombre).toUpperCase()
    if (t.length <= 18) return t
    ABREV.forEach(function (a) { t = t.replace(a[0], a[1]) })
    return una(t.replace(/\s+(DE|DEL|LA|LAS|LOS)\s+/g, ' ').replace(/\.\./g, '.'))
  }
  // «Grupo de Artillería de Lanzadores Múltiples 1 (GALM-1) (OPCON a partir D-2 1200)» → GALM-1
  function sigla(t) {
    var ms = String(t).match(/\(([^()]{2,18})\)/g) || []
    for (var i = 0; i < ms.length; i++) {
      var x = ms[i].slice(1, -1).trim()
      if (/^[A-ZÁÉÍÓÚÑ0-9][A-ZÁÉÍÓÚÑ0-9.\- ]{1,16}$/.test(x) && /[A-Z]/.test(x) && !/^(OPCON|TACON|AGREG|APOYO|SUPUEST|ORG)/i.test(x) && (/\d|-|\b[IVX]+\b/.test(x) || x.split(/\s+/).length <= 3)) return x
    }
    return ''
  }
  function relacion(t) { var m = /\b(OPCON|TACON|AGREGAD[OA]|AGREG\.|APOYO DIRECTO|APOYO GENERAL|EN APOYO|RESERVA)\b[^)]*/i.exec(t); return m ? una(m[0]) : '' }
  // sin los paréntesis ni el punto final de la oración («Orgánico.», «GALM-1.»); el de una sigla («FF.TT.») queda
  function nombreDe(t) { return una(String(t).replace(/\([^)]*\)/g, ' ')).replace(/\s+([.;:,])/g, '$1').replace(/^[-–•*\s]+/, '').replace(/[;:,\s]+$/, '').replace(/([a-záéíóúñ0-9])\.$/, '$1') }
  var NO_UNIDAD = /^(org[aá]nic[oa]s?|menos\b|sin\b|resto\b|elementos?\b|tropas\b|apoyos?\b|reserva\b|-+|ninguno|n\/a|s\/a)/i
  function armaDeNombre(n) { var r = rasgos(n); return r.arma || (/\bMEC\b/.test(r.k) ? 'mecanizada' : /\bBL\b/.test(r.k) ? 'blindada' : /\bCAB\b/.test(r.k) ? 'caballeria' : /\bMOT\b/.test(r.k) ? 'motorizada' : 'infanteria') }
  function escalonDeNombre(n) { var r = rasgos(n); return r.nivel === 'ejercito' && !/^(CMDO )?FFTT/.test(r.k) ? 'brigada' : r.nivel || 'batallon' }
  function unidad_(texto, de) {
    var s = sigla(texto), nom = nombreDe(texto) || s
    if (!nom || NO_UNIDAD.test(nom) || nom.length < 2) return null
    var desig = s && rasgos(s).nums.length ? s : abreviar(nom)
    return { designacion: desig, nombre: nom, sigla: s, arma: armaDeNombre(nom + ' ' + s), escalon: escalonDeNombre(nom + ' ' + s), supuesto: /\(\s*supuest[oa]s?\s*\)/i.test(texto), relacion: relacion(texto), de: de || '' }
  }
  // org: [{ nombre, elementos }] (ogo.js · estructura(texto).organizacion)
  function unidadesDeOrganizacion(org) {
    var out = []
    var suma = function (u) { if (!u) return; var ya = out.filter(function (x) { return mismaUnidad(x.designacion, u.designacion) || mismaUnidad(x.nombre, u.nombre) })[0]; if (ya) { ya.supuesto = ya.supuesto || u.supuesto; return } out.push(u) }
    ;(org || []).forEach(function (a) {
      var cab = unidad_(a.nombre, '')
      var orgSup = (a.elementos || []).some(function (e) { return /^\s*org[aá]nic[oa]s?\b[^;]*\(\s*supuest/i.test(e) })
      if (cab) { cab.supuesto = cab.supuesto || orgSup; suma(cab) }
      ;(a.elementos || []).forEach(function (e) { suma(unidad_(e, cab ? cab.designacion : '')) })
    })
    return out
  }
  // Las de la lista que NO están en la carta (fichas propias por designación).
  function faltantes(listaU, unidades) {
    var ps = (unidades || []).filter(function (u) { return !enemiga(u) })
    return (listaU || []).filter(function (u) {
      return !ps.some(function (f) { var d = f.designacion || f.nombre || ''; return mismaUnidad(d, u.designacion) || (u.nombre && mismaUnidad(d, u.nombre)) || (u.sigla && mismaUnidad(d, u.sigla)) })
    })
  }

  // ─── Dónde ponerlas ─────────────────────────────────────────────────────────────────
  // km → grados: x al este, y al norte de `c` ([lng, lat])
  function mover(c, x, y) { return [c[0] + x / (111.32 * Math.max(0.2, Math.cos(c[1] * Math.PI / 180))), c[1] + y / 110.57] }
  var ROL = { logistica: [-7, 4], sanidad: [-6, -4], intendencia: [-7, 6], transporte: [-8, 2], mantenimiento: [-8, -2], aviacion: [-11, -6], ingenieria: [4, 6], comunicaciones: [0, -3], antiaerea: [2, 2], inteligencia: [3, -5], policiamilitar: [-3, 3] }
  // Detrás del PC lo logístico y la aviación, a su costado ingenieros y comunicaciones, entre el PC y el
  // frente la artillería, adelante la maniobra. El frente: hacia el enemigo (o el centro del Área de
  // Operaciones). Siempre dentro del Área de Operaciones. i: el número de orden (para no encimarlas).
  function sugerir(u, ej, ident, i) {
    ej = ej || {}
    var an = anillo(ej), ref = ident && ident.ficha ? [+ident.ficha.lng, +ident.ficha.lat] : an ? centroide(an) : null
    if (!ref) return null
    var en = (ej.unidades || []).filter(function (x) { return conLugar(x) && enemiga(x) }), obj
    if (en.length) obj = [en.reduce(function (s, x) { return s + +x.lng }, 0) / en.length, en.reduce(function (s, x) { return s + +x.lat }, 0) / en.length]
    else obj = an ? centroide(an) : [ref[0], ref[1] + 0.3]
    var D = km(ref, obj)
    if (D < 3) { obj = [ref[0], ref[1] + 0.3]; D = km(ref, obj) }
    var ux = (obj[0] - ref[0]) * 111.32 * Math.cos(ref[1] * Math.PI / 180) / D, uy = (obj[1] - ref[1]) * 110.57 / D // hacia el frente (unitario, en km)
    var f, l, rol = ROL[u.arma]
    if (rol) { f = rol[0]; l = rol[1] }
    else if (u.arma === 'artilleria' || u.arma === 'lanzacohetes') { f = Math.min(0.45 * D, 25); l = 0 }
    else if (/cuerpo|division|brigada|regimiento/.test(u.escalon)) { f = /reserva/i.test(u.relacion || '') ? Math.min(0.2 * D, 15) : Math.min(0.65 * D, 45); l = 0 }
    else { f = Math.min(0.3 * D, 20); l = 0 }
    l += ((i || 0) % 2 ? -1 : 1) * Math.ceil((i || 0) / 2) * 4 // las del mismo rol, separadas 4 km
    var p = mover(ref, f * ux - l * uy, f * uy + l * ux)
    if (an && !dentro(p, an)) { // adentro: hacia el centro del área de a poco
      var c = centroide(an)
      for (var k = 1; k <= 10 && !dentro(p, an); k++) p = [p[0] + (c[0] - p[0]) * 0.2, p[1] + (c[1] - p[1]) * 0.2]
    }
    return { lat: r6(p[1]), lng: r6(p[0]) }
  }
  // La ficha para la Mesa (la forma de academico.js / ia-profesor.js).
  var ARMAS = ['infanteria', 'mecanizada', 'motorizada', 'andina', 'selva', 'caballeria', 'cabmec', 'artilleria', 'antiaerea', 'ingenieria', 'comunicaciones', 'blindada', 'aerotransportada', 'aviacion', 'logistica', 'intendencia', 'materialbelico', 'sanidad', 'transporte', 'mantenimiento', 'veterinaria', 'policiamilitar', 'antitanque', 'morteros', 'ametralladoras', 'lanzacohetes', 'inteligencia', 'ninguna']
  var ESCALONES = ['escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito']
  // La Mesa pone la designación (y los nombres de las medidas) tal cual en el HTML de la carta: lo que
  // escribió la IA entra sin < > & " ' `.
  var SIN_HTML = /[<>&"'`]/g
  function ficha(u, ahora) {
    var pc = u.tipo === 'pc'
    return {
      id: 'ogo-' + (ahora || Date.now()) + '-' + Math.random().toString(36).slice(2, 7), bando: 'propias', tipo: pc ? 'pc' : 'unidad',
      designacion: una(u.designacion).replace(SIN_HTML, '') || 'Unidad', arma: pc ? 'ninguna' : ARMAS.indexOf(u.arma) >= 0 ? u.arma : 'infanteria',
      escalon: ESCALONES.indexOf(u.escalon) >= 0 ? u.escalon : 'batallon', lat: r6(+u.lat), lng: r6(+u.lng), piezas: 3, origen: 'ogo-profesor'
    }
  }
  // «Orgánico (supuesto)» → «Orgánico»: en las líneas que nombran a la unidad, sin tocar las otras.
  function quitarSupuesto(texto, u) {
    var nombres = [u.designacion, u.nombre, u.sigla].filter(function (x) { return una(x) })
    var claves = nombres.map(function (n) { return fichas_(n).join(' ') }).filter(function (k) { return k.length >= 2 })
    var cambios = 0
    var t = String(texto || '').split('\n').map(function (l) {
      if (!/\(\s*supuest[oa]s?\s*\)/i.test(l)) return l
      var k = ' ' + fichas_(l).join(' ') + ' '
      if (!claves.some(function (c) { return k.indexOf(' ' + c + ' ') >= 0 })) return l
      cambios++
      return l.replace(/\s*\(\s*supuest[oa]s?\s*\)/gi, '')
    }).join('\n')
    return { texto: t, cambios: cambios }
  }

  return {
    una: una, sinDesarrollo: sinDesarrollo, rasgos: rasgos, mismaUnidad: mismaUnidad, nivelDe: nivelDe, superiorDe: superiorDe, poblaciones: poblaciones, masCercana: masCercana,
    poblacionesParaPedido: poblacionesParaPedido, anillo: anillo, areaMayor: areaMayor, areas: areas, dentro: dentro, fichaDe: fichaDe, identidad: identidad, abreviar: abreviar, sigla: sigla,
    unidadesDeOrganizacion: unidadesDeOrganizacion, faltantes: faltantes, sugerir: sugerir, ficha: ficha, quitarSupuesto: quitarSupuesto, km: km,
    ARMAS: ARMAS, ESCALONES: ESCALONES, SIN_HTML: SIN_HTML, ESC_FICHA: ESC_FICHA
  }
})
