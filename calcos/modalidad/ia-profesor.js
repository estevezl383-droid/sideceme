/* La IA y las fichas del PROFESOR (modalidad Profesor de la Mesa del EM). Código aparte del
   compilado, sin React. Dos cosas, puras (se prueban en Node):
   · armarPedido(paso, ctx): el PEDIDO A LA IA de cada paso del tablero del profesor. El del
     paso «Orden del escalón superior» pide la OGO COMPLETA con todos sus anexos; los demás,
     lo suyo (CMOC, orden de batalla, CAE por fases, situaciones, pauta de corrección…). Todos
     llevan el escalón (quién soy / quiénes son mis alumnos), el FOCO (qué G entrena el
     ejercicio: la IA deja el trabajo ahí y completa lo demás), el ejercicio recortado con el
     terreno dibujado en texto (resumenTerreno) y la CARPETA DEL PROFESOR (lo que ya resolvió con
     la IA en los otros pasos, carpeta.js).
   · fichasDeOrganizacion(org, opciones) y fichasDeJSON(texto, opciones): las fichas listas
     para `agregarUnidades` de la Mesa (la misma forma que usa academico.js), de una
     organización tipo del catálogo o del bloque ```json que devuelve la IA.
   Lo pidió Sergio (10-10-2026): «en todas las partes debe haber opción a trabajar con IA para
   generar el prompt adecuado… para el profesor debe salir una OGO con todos sus anexos para
   que el alumno planifique… y la opción de ya tengo COE, divisiones de AZUL o Cuerpos de
   Ejército directo para insertar». */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./catalogo.js'), require('./biblioteca.js'), require('./carpeta.js'))
  else raiz.SIDIAProfesor = fabrica(raiz.SIDModalidadCatalogo, raiz.SIDBiblioteca, raiz.SIDCarpetaProfesor)
})(typeof window !== 'undefined' ? window : this, function (CAT, BIB, CARP) {
  'use strict'

  // Los catálogos de la Mesa (compilado): el id es el que llevan las fichas.
  var ARMAS = ['infanteria', 'mecanizada', 'motorizada', 'andina', 'selva', 'caballeria', 'cabmec', 'artilleria', 'antiaerea', 'ingenieria', 'comunicaciones', 'blindada', 'aerotransportada', 'aviacion', 'logistica', 'intendencia', 'materialbelico', 'sanidad', 'transporte', 'mantenimiento', 'veterinaria', 'policiamilitar', 'antitanque', 'morteros', 'ametralladoras', 'lanzacohetes', 'inteligencia', 'ninguna']
  var ESCALONES = ['escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito']
  var BANDOS = { propias: 'propias', propio: 'propias', azul: 'propias', amigo: 'propias', enemigas: 'enemigas', enemigo: 'enemigas', rojo: 'enemigas' }
  var LIMITE_EXPEDIENTE = 90000 // caracteres del contexto del ejercicio dentro del pedido (≈ 25 mil tokens)

  function r6(x) { return Math.round(x * 1e6) / 1e6 }
  function limpia(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim() }
  function enumera(xs) { return xs.map(function (x, i) { return (i + 1) + '. ' + x }).join('\n') }

  // ─── Fichas ────────────────────────────────────────────────────────────────────────
  // km → grados en ese punto (la ficha va a x km al este e y km al norte del centro)
  function desplaza(centro, xKm, yKm) {
    var lat = centro.lat + yKm / 111.32
    var lng = centro.lng + xKm / (111.32 * Math.max(0.2, Math.cos(centro.lat * Math.PI / 180)))
    return { lat: r6(lat), lng: r6(lng) }
  }
  function normalizaBando(b) { return BANDOS[limpia(b).toLowerCase()] || 'propias' }
  function ficha(base, i, ahora) {
    return {
      id: 'prof-' + (base.id || i) + '-' + ahora + '-' + i,
      bando: normalizaBando(base.bando),
      tipo: 'unidad',
      designacion: limpia(base.designacion) || 'Unidad ' + (i + 1),
      arma: ARMAS.indexOf(base.arma) >= 0 ? base.arma : 'infanteria',
      escalon: ESCALONES.indexOf(base.escalon) >= 0 ? base.escalon : 'batallon',
      lat: r6(base.lat),
      lng: r6(base.lng),
      piezas: 3
    }
  }
  // Una organización tipo del catálogo, centrada en `centro`, con el número del profesor en
  // vez de %N (y %N1, %N2… para las subordinadas: 1 → 11, 12, 13). ROJO se dibuja espejado
  // (el enemigo viene del otro lado): su comando queda al norte y las de maniobra al sur.
  function fichasDeOrganizacion(org, op) {
    op = op || {}
    var centro = op.centro && isFinite(op.centro.lat) && isFinite(op.centro.lng) ? op.centro : { lat: -16.5, lng: -64.5 }
    var bando = normalizaBando(op.bando), n = limpia(op.numero) || '1', ahora = op.ahora || Date.now()
    var signo = bando === 'enemigas' ? -1 : 1
    return (org.piezas || []).map(function (p, i) {
      var d = p.d.replace(/%N(\d)/g, function (_, k) { return n + k }).replace(/%N/g, n)
      if (op.sufijo) d += ' ' + op.sufijo
      var ll = desplaza(centro, p.x, signo * p.y)
      return ficha({ id: org.id + '-' + i, bando: bando, designacion: d, arma: p.arma, escalon: p.esc, lat: ll.lat, lng: ll.lng }, i, ahora)
    })
  }
  // El bloque ```json que devuelve la IA (o un JSON pegado a mano): una lista de fichas, o un
  // objeto con `fichas`/`unidades`. Las que no traen lat/lng se reparten alrededor del centro.
  function fichasDeJSON(texto, op) {
    op = op || {}
    var t = String(texto || '')
    var m = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (m) t = m[1]
    var i0 = Math.min.apply(null, [t.indexOf('['), t.indexOf('{')].filter(function (i) { return i >= 0 }))
    if (!isFinite(i0)) throw new Error('No encuentro un JSON con las fichas.')
    var datos = JSON.parse(t.slice(i0, Math.max(t.lastIndexOf(']'), t.lastIndexOf('}')) + 1))
    var lista = Array.isArray(datos) ? datos : datos.fichas || datos.unidades || datos.orden_de_batalla || []
    if (!Array.isArray(lista) || !lista.length) throw new Error('El JSON no trae una lista de fichas.')
    var centro = op.centro && isFinite(op.centro.lat) ? op.centro : { lat: -16.5, lng: -64.5 }
    var ahora = op.ahora || Date.now(), sinLugar = 0
    var fichas = lista.map(function (u, i) {
      var lat = +u.lat, lng = +(u.lng != null ? u.lng : u.lon)
      if (!isFinite(lat) || !isFinite(lng)) { var ll = desplaza(centro, (sinLugar % 5 - 2) * 4, -Math.floor(sinLugar / 5) * 4); lat = ll.lat; lng = ll.lng; sinLugar++ }
      return ficha({ id: 'ia', bando: u.bando, designacion: u.designacion || u.nombre || u.unidad, arma: limpia(u.arma).toLowerCase(), escalon: limpia(u.escalon).toLowerCase(), lat: lat, lng: lng }, i, ahora)
    })
    return { fichas: fichas, sinLugar: sinLugar }
  }

  // ─── El terreno dibujado, en texto (lat, lng) ──────────────────────────────────────
  // El CMOC de la Mesa es GeoJSON ([lng, lat]) y sus áreas restringidas pueden tener cientos de
  // vértices: en JSON crudo se comía el espacio del pedido antes de llegar a los corredores y a las
  // avenidas (y con la Mesa publicada ni siquiera llegaba: ver modalidad.js, leerEjercicio). Acá va
  // cada elemento con lo que sirve para analizarlo: dónde empieza y termina, por dónde pasa (pocos
  // puntos), largo, ancho, superficie, escalón, bando y nombre. Lo pidió Sergio (10-10-2026): «lo
  // que yo inserté como corredores, caminos, etc. debería entrar en el prompt».
  var ANCHO_CORREDOR = { seccion: 0.6, compania: 2, batallon: 6, regimiento: 8, brigada: 10, division: 15, cuerpo: 25 } // km (tabla del compilado)
  var NOM_ESCALON = { seccion: 'Sección', compania: 'Compañía', batallon: 'Batallón', regimiento: 'Regimiento', brigada: 'Brigada', division: 'División', cuerpo: 'Cuerpo de Ejército' }
  function esPunto(p) { return Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number' && isFinite(p[0]) && isFinite(p[1]) }
  function puntos(c, acc) { // todos los [lng, lat] de una geometría, en orden
    acc = acc || []
    if (esPunto(c)) acc.push(c)
    else if (Array.isArray(c)) c.forEach(function (x) { puntos(x, acc) })
    return acc
  }
  function geometria(x) { // Feature, geometría, {poligono}, {coords} o {centro}
    if (!x || typeof x !== 'object') return null
    if (x.geometry) return x.geometry.coordinates
    if (x.coordinates) return x.coordinates
    if (x.poligono) return geometria(x.poligono)
    return null
  }
  function f4(x) { return String(Math.round(x * 1e4) / 1e4) }
  function ll(p) { return f4(p[1]) + ', ' + f4(p[0]) }
  function km(a, b) {
    var R = 6371, r = Math.PI / 180, dLat = (b[1] - a[1]) * r, dLng = (b[0] - a[0]) * r
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
  }
  function largo(l) { var s = 0; for (var i = 1; i < l.length; i++) s += km(l[i - 1], l[i]); return s }
  function anillos(c) { // los anillos exteriores de un Polygon / MultiPolygon (o un anillo suelto)
    if (!Array.isArray(c) || !c.length) return []
    if (esPunto(c[0])) return [c]
    if (Array.isArray(c[0]) && c[0].length && esPunto(c[0][0])) return [c[0]]
    return c.map(function (p) { return Array.isArray(p) && p[0] ? p[0] : null }).filter(function (a) { return a && esPunto(a[0]) })
  }
  function superficie(a) { // km², proyección equirectangular a la latitud media
    if (!a || a.length < 3) return 0
    var lat0 = a.reduce(function (s, p) { return s + p[1] }, 0) / a.length, kx = 111.32 * Math.cos(lat0 * Math.PI / 180), ky = 110.57, s = 0
    for (var i = 0; i < a.length; i++) { var p = a[i], q = a[(i + 1) % a.length]; s += (p[0] * kx) * (q[1] * ky) - (q[0] * kx) * (p[1] * ky) }
    return Math.abs(s / 2)
  }
  function centro(ps) { return ps.length ? [ps.reduce(function (s, p) { return s + p[0] }, 0) / ps.length, ps.reduce(function (s, p) { return s + p[1] }, 0) / ps.length] : null }
  function caja(ps) {
    var b = [Infinity, Infinity, -Infinity, -Infinity]
    ps.forEach(function (p) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]) })
    return isFinite(b[0]) ? b : null
  }
  function muestra(l, n) { // hasta n puntos parejos, con el primero y el último
    if (l.length <= n) return l
    var r = []; for (var i = 0; i < n; i++) r.push(l[Math.round(i * (l.length - 1) / (n - 1))])
    return r
  }
  function n1(x) { return (Math.round(x * 10) / 10).toLocaleString('es') }
  function bandoTxt(b) { b = limpia(b).toLowerCase(); return /amig|propi|azul/.test(b) ? 'PROPIA' : /enem|rojo/.test(b) ? 'ENEMIGA' : '' }
  // lo que trae escrito el elemento (nombre, motivo, descripción…), sin lo interno («_algo») ni lo ya dicho
  function extras(x, sin) {
    var o = x && x.properties && typeof x.properties === 'object' ? Object.assign({}, x.properties, x) : x || {}
    return Object.keys(o).filter(function (k) { return k.charAt(0) !== '_' && sin.indexOf(k) < 0 && (typeof o[k] === 'string' || typeof o[k] === 'number') && limpia(o[k]) }).map(function (k) { return k + ': ' + limpia(o[k]).slice(0, 160) }).join(' · ')
  }
  var YA = ['type', 'coords', 'centro', 'bando', 'escalon', 'ancho', 'km', 'viaBase', 'etiqueta', 'rango', 'tipo', 'clase']
  function linea(nombre, l) { return l.length < 2 ? '' : nombre + ' de ' + ll(l[0]) + ' a ' + ll(l[l.length - 1]) + ' (' + n1(largo(l)) + ' km)' + (l.length > 2 ? ', pasa por ' + muestra(l, 6).slice(1, -1).map(ll).join(' → ') : '') }
  function sinCierre(a) { var u = a[a.length - 1]; return a.length > 3 && u[0] === a[0][0] && u[1] === a[0][1] ? a.slice(0, -1) : a }
  function area(x) {
    var as = anillos(geometria(x) || x.coords), ps = puntos(as.map(sinCierre)), s = as.reduce(function (t, a) { return t + superficie(a) }, 0), b = caja(ps), c = centro(ps)
    return c ? 'centro ' + ll(c) + ' · ' + n1(s) + ' km² · entre lat ' + f4(b[1]) + ' y ' + f4(b[3]) + ', lng ' + f4(b[0]) + ' y ' + f4(b[2]) + (as.length > 1 ? ' · ' + as.length + ' partes' : '') : ''
  }
  function resumenAreas(xs, sigla, max) {
    var r = (xs || []).map(function (x) { var as = anillos(geometria(x) || (x && x.coords)); return { x: x, s: as.reduce(function (t, a) { return t + superficie(a) }, 0) } }).filter(function (o) { return o.s > 0 || puntos(geometria(o.x) || (o.x && o.x.coords)).length })
    if (!r.length) return ''
    var aMano = function (o) { return ((o.x.properties || {})._origen || o.x._origen) === 'manual' ? 1 : 0 }
    var tot = r.reduce(function (t, o) { return t + o.s }, 0), manual = r.filter(aMano).length
    // lo dibujado a mano va siempre (es lo que marcó el profesor); después, lo más grande
    var top = r.slice().sort(function (a, b) { return aMano(b) - aMano(a) || b.s - a.s }).slice(0, max)
    return r.length + ' área(s), ' + n1(tot) + ' km² en total' + (manual ? ' (' + manual + ' dibujada(s) a mano)' : '') + (r.length > max ? '; ' + (manual ? 'las dibujadas a mano y ' : '') + 'las más grandes (' + max + '):' : ':') + '\n' +
      top.map(function (o, i) { var e = extras(o.x, YA); return '  - ' + sigla + '-' + (i + 1) + ' · ' + area(o.x) + (aMano(o) ? ' · dibujada a mano' : '') + (e ? ' · ' + e : '') }).join('\n')
  }
  // El CMOC y lo que el G-3 ya trazó (límites, objetivos, obstáculos) en texto.
  function resumenTerreno(cmoc, ops, dirAvenidas) {
    var c = cmoc && typeof cmoc === 'object' ? cmoc : {}, o = ops && typeof ops === 'object' ? ops : {}, t = []
    var sev = resumenAreas(c.severo, 'TSR', 12), res = resumenAreas(c.restringido, 'TR', 12)
    if (sev) t.push('- Terreno SEVERAMENTE RESTRINGIDO: ' + sev)
    if (res) t.push('- Terreno RESTRINGIDO: ' + res)
    var cor = (c.corredores || []).filter(function (x) { return x && puntos(x.coords).length >= 2 })
    if (cor.length) t.push('- CORREDORES DE MOVILIDAD (' + cor.length + '):\n' + cor.slice(0, 40).map(function (x, i) {
      var l = puntos(x.coords), e = extras(x, YA)
      return '  - CM-' + (i + 1) + ' · ' + (NOM_ESCALON[x.escalon] ? 'escalón ' + NOM_ESCALON[x.escalon] + ' (≈ ' + ANCHO_CORREDOR[x.escalon] + ' km de ancho)' : 'escalón ' + (x.escalon || '¿?')) + (bandoTxt(x.bando) ? ' · ' + bandoTxt(x.bando) : '') +
        (x._origen === 'vias' || x.viaBase ? ' · sobre caminos' + (x.viaBase ? ' (' + limpia(x.viaBase) + ')' : '') : x._origen === 'manual' ? ' · dibujado a mano' : '') + ' · ' + linea('va', l) + (e ? ' · ' + e : '')
    }).join('\n') + (cor.length > 40 ? '\n  - … y ' + (cor.length - 40) + ' más' : ''))
    var cl = (c.corredoresClandestinos || []).filter(function (x) { return x && puntos(x.coords).length >= 2 })
    if (cl.length) t.push('- Corredores clandestinos posibles (' + cl.length + '):\n' + cl.slice(0, 12).map(function (x, i) { return '  - CC-' + (i + 1) + ' · ' + (x.viaBase ? limpia(x.viaBase) + ' · ' : '') + linea('va', puntos(x.coords)) }).join('\n'))
    var av = (c.avenidas || []).filter(function (x) { return x && (puntos(x.coords).length >= 2 || geometria(x)) })
    if (av.length) t.push('- AVENIDAS DE APROXIMACIÓN (' + av.length + ')' + (dirAvenidas ? ', dirección: ' + limpia(dirAvenidas) : '') + ':\n' + av.map(function (x, i) {
      var ejes = Array.isArray(x._astas) && x._astas.length > 1 ? x._astas.map(function (a) { return puntos(a) }) : [puntos(x.coords)]
      var as = anillos(geometria(x)), s = as.reduce(function (t_, a) { return t_ + superficie(a) }, 0), lg = largo(ejes[0]), e = extras(x, YA)
      return '  - AA-' + (i + 1) + (x.nombre ? ' «' + limpia(x.nombre) + '»' : '') + (bandoTxt(x.bando) ? ' · ' + bandoTxt(x.bando) : '') +
        (s && lg ? ' · ancho dibujado ≈ ' + n1(s / Math.max(lg, 0.1)) + ' km' : '') + ' · ' + ejes.map(function (l, k) { return linea(ejes.length > 1 ? 'eje ' + (k + 1) : 'eje', l) }).join('; ') + (e ? ' · ' + e : '')
    }).join('\n'))
    var cv = (c.clave || []).filter(function (x) { return x && esPunto(x.centro) })
    if (cv.length) t.push('- TERRENO CLAVE (' + cv.length + '):\n' + cv.map(function (x, i) { var e = extras(x, YA); return '  - ' + (limpia(x.etiqueta) || 'C' + (i + 1)) + ' · ' + ll(x.centro) + (e ? ' · ' + e : '') }).join('\n'))
    var df = (c.defensivo || []).filter(Boolean)
    if (df.length) t.push('- Terreno defendible (' + df.length + '):\n' + df.slice(0, 12).map(function (x, i) { var e = extras(x, YA); return '  - TD-' + (i + 1) + ' · ' + area(x) + (e ? ' · ' + e : '') }).join('\n'))
    var ae = (c.ae || []).filter(Boolean)
    if (ae.length) t.push('- Áreas de empeñamiento (' + ae.length + '):\n' + ae.slice(0, 12).map(function (x, i) { return '  - AE-' + (i + 1) + ' · ' + area(x) }).join('\n'))
    var dz = (c.desplazamientos || []).filter(function (x) { return x && puntos(x.ruta || x.puntos).length >= 2 })
    if (dz.length) t.push('- Desplazamientos trazados (' + dz.length + '):\n' + dz.slice(0, 12).map(function (x, i) {
      var m = x.metricas && typeof x.metricas === 'object' ? Object.keys(x.metricas).filter(function (k) { return typeof x.metricas[k] === 'number' || typeof x.metricas[k] === 'string' }).map(function (k) { return k + ': ' + (typeof x.metricas[k] === 'number' ? n1(x.metricas[k]) : limpia(x.metricas[k]).slice(0, 60)) }).join(', ') : ''
      return '  - D-' + (i + 1) + (bandoTxt(x.bando) ? ' · ' + bandoTxt(x.bando) : '') + (x.pegado ? ' · por los caminos' : ' · a campo traviesa') + ' · ' + linea('va', puntos(x.ruta || x.puntos)) + (m ? ' · ' + m : '')
    }).join('\n'))
    var ob = (o.obstaculos || []).filter(Boolean)
    if (ob.length) t.push('- OBSTÁCULOS trazados (plan de barreras, ' + ob.length + '):\n' + ob.slice(0, 25).map(function (x, i) {
      var ps = puntos(geometria(x) || x.coords || x.centro), nom = limpia(x.tipo || x.clase || x.nombre || x.etiqueta) || 'obstáculo'
      return '  - ' + nom + (ps.length > 1 ? ' · de ' + ll(ps[0]) + ' a ' + ll(ps[ps.length - 1]) + ' (' + n1(largo(ps)) + ' km)' : ps.length ? ' · ' + ll(ps[0]) : '')
    }).join('\n') + (ob.length > 25 ? '\n  - … y ' + (ob.length - 25) + ' más' : ''))
    var obj = (o.objetivos || []).filter(function (x) { return x && esPunto(x.centro) })
    if (obj.length) t.push('- Objetivos: ' + obj.map(function (x) { return (limpia(x.etiqueta) || 'O') + (x.clase ? ' (' + x.clase + ')' : '') + ' ' + ll(x.centro) }).join(' · '))
    if (o.areaOps) { var pa = puntos(geometria(o.areaOps) || o.areaOps.coords), ba = caja(pa); if (ba) t.push('- Área de Operaciones trazada: entre lat ' + f4(ba[1]) + ' y ' + f4(ba[3]) + ', lng ' + f4(ba[0]) + ' y ' + f4(ba[2]) + ' (≈ ' + n1(km([ba[0], ba[1]], [ba[2], ba[1]])) + ' × ' + n1(km([ba[0], ba[1]], [ba[0], ba[3]])) + ' km)') }
    return t.join('\n')
  }
  function resumenAOI(aoi) {
    if (!aoi) return ''
    var b = Array.isArray(aoi.bbox) && aoi.bbox.length === 4 ? aoi.bbox : caja(puntos(geometria(aoi) || (aoi.features || []).map(geometria)))
    if (!b || !isFinite(b[0])) return ''
    return '- Área de Interés: entre lat ' + f4(b[1]) + ' y ' + f4(b[3]) + ', lng ' + f4(b[0]) + ' y ' + f4(b[2]) + ' (≈ ' + n1(km([b[0], b[1]], [b[2], b[1]])) + ' km de este a oeste × ' + n1(km([b[0], b[1]], [b[0], b[3]])) + ' km de norte a sur; centro ' + ll([(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]) + ')'
  }

  // ─── El contexto del ejercicio (recortado) ─────────────────────────────────────────
  function resumenUnidades(unidades) {
    var us = (unidades || []).filter(function (u) { return u && (u.tipo || 'unidad') === 'unidad' })
    if (!us.length) return '(todavía no hay fichas en la carta)'
    return us.map(function (u) { return '- ' + (u.bando === 'enemigas' || u.bando === 'enemigo' ? 'ROJO' : 'AZUL') + ' · ' + limpia(u.designacion || u.nombre) + ' · ' + (u.arma || '') + ' · ' + (u.escalon || '') + (isFinite(u.lat) ? ' · ' + r6(u.lat) + ', ' + r6(u.lng) : '') }).join('\n')
  }
  function recorta(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '\n[… recortado: ' + (s.length - n) + ' caracteres más en la Mesa]' : s }
  function vacio(v) { return v == null || v === '' || (typeof v === 'object' && !Object.keys(v).some(function (k) { return !vacio(v[k]) })) }
  function bloqueJSON(nombre, v, limite) {
    if (vacio(v)) return ''
    var txt; try { txt = JSON.stringify(v, null, 1) } catch (e) { txt = String(v) }
    return '\n### ' + nombre + '\n```json\n' + recorta(txt, limite) + '\n```\n'
  }
  function contexto(ctx) {
    var ej = ctx.ejercicio || {}, partes = [], uc = ej.ops && ej.ops.unidadConsiderada
    partes.push('### Ejercicio\n- Nombre: ' + (limpia(ej.nombre) || '(sin nombre)') + '\n- Unidad de los alumnos: ' + (limpia(uc && uc.nombre) || limpia(ej.unidadAnalisis && (ej.unidadAnalisis.nombre || ej.unidadAnalisis.designacion)) || limpia(ej.ordenSup && ej.ordenSup.unidad) || '(no elegida todavía: la Mesa la pide al abrir el ejercicio)') + '\n- Misión escrita: ' + (limpia(ej.mision) || '(todavía no hay)'))
    if (ctx.fuente) partes.push('- Leído de: ' + ctx.fuente)
    var aoi = resumenAOI(ej.aoi)
    if (aoi) partes.push(aoi)
    if (ctx.centro && isFinite(ctx.centro.lat)) partes.push('- Centro de la vista: ' + r6(ctx.centro.lat) + ', ' + r6(ctx.centro.lng))
    partes.push('\n### Fichas en la carta\n' + resumenUnidades(ctx.unidades || ej.unidades))
    // El terreno que el profesor ya dibujó va ANTES de la Orden y los documentos: es lo que el
    // análisis tiene que usar, y así el recorte no lo alcanza.
    var ter = resumenTerreno(ej.cmoc, ej.ops, ej.dirAvenidas)
    partes.push('\n### Terreno dibujado en la Mesa (CMOC y lo trazado en la carta; coordenadas en lat, lng)\n' + (ter ? 'Es lo que el profesor YA MARCÓ: partí de esto, con estas coordenadas, y nombrá cada elemento.\n' + ter : '(todavía no hay nada dibujado en el CMOC: ni corredores, ni avenidas, ni terreno clave, ni áreas restringidas)'))
    partes.push(bloqueJSON('Orden del escalón superior (tablero Mesa · Preparación)', ej.ordenSup, 20000))
    partes.push(bloqueJSON('Escenario y orientación', { escenario: ej.escenario, orientacion: ej.orientacion }, 8000))
    if (ej.fasesCOA) partes.push(bloqueJSON('Cursos de acción por fases', ej.fasesCOA, 12000))
    var docs = (ej.documentos || []).filter(Boolean)
    if (docs.length) partes.push('\n### Documentos adjuntos al ejercicio\n' + docs.map(function (d) { return '#### ' + limpia(d.nombre || d.titulo || 'Documento') + '\n' + recorta(limpia(d.texto || d.contenido || ''), 6000) }).join('\n\n'))
    var txt = recorta(partes.filter(Boolean).join('\n'), ctx.limite || LIMITE_EXPEDIENTE)
    // La carpeta del profesor (lo que ya resolvió con la IA en los otros pasos) y la biblioteca van
    // aparte, cada una con su propio espacio.
    var car = CARP && ctx.carpeta ? CARP.paraPedido(ctx.carpeta, { excepto: ctx.paso, limite: ctx.limiteCarpeta || 45000 }) : ''
    var bib = BIB && ctx.biblioteca && ctx.biblioteca.length ? BIB.resumen(ctx.biblioteca, ctx.limiteBiblioteca || 40000) : ''
    return txt +
      (car ? '\n\n### CARPETA DEL PROFESOR: lo que ya resolvió con la IA en los otros pasos (es la BASE de este pedido)\nNo lo contradigas: usá sus nombres (avenidas, corredores, terreno clave, unidades), sus coordenadas y sus fases. Lo marcado «🔒 SOLUCIÓN DEL PROFESOR» es para que todo sea coherente: NO se lo des resuelto al alumno en el campo que entrena.\n\n' + car : '') +
      (bib ? '\n\n### Biblioteca del profesor (COE, organización, armamento, doctrina): USALA como fuente\n' + bib : '')
  }

  // ─── Los pedidos ───────────────────────────────────────────────────────────────────
  function cabecera(paso, ctx) {
    var E = ctx.escalon, F = ctx.foco
    return '# PEDIDO DE TRABAJO PARA LA IA — LEÉ ESTO PRIMERO\n\n' +
      'Sos el Estado Mayor de un **' + E.profesor + '** (escalón SUPERIOR) que arma un EJERCICIO DE ESCUELA para sus alumnos, que son **' + E.alumnos + '**. ' +
      'Lo que escribís es lo que el profesor les da a los alumnos (o lo que guarda como solución para corregirlos: el pedido dice cuál).\n\n' +
      '**Paso del armado:** ' + paso.n + ' · ' + paso.nom + '\n' +
      '**Qué entrena el ejercicio:** ' + F.nom + ' — ' + F.pide + '\n' +
      '**Regla de oro:** completá TODO lo que no es del campo que se entrena, con datos concretos y coherentes entre sí; en el campo que se entrena dejá el TRABAJO al alumno (no le resuelvas su apreciación, su anexo ni su decisión). Si algo del contexto falta, inventalo verosímil, de ESTE terreno y de ESTE escalón, y marcalo con «(supuesto)». Si el texto te llega cortado, contestá igual con lo que tengas.\n' +
      '**Lo que ya hay:** el terreno que el profesor dibujó en la Mesa (CMOC) y su CARPETA (lo que ya resolvió con la IA en los otros pasos, al final del contexto) mandan: usalos y no los contradigas.\n\n'
  }
  function formatoFichas() {
    return '## FORMATO DE LAS FICHAS (para pegarlas en la Mesa)\nUn bloque ```json con una LISTA de objetos, uno por unidad:\n' +
      '```json\n[{"designacion":"D.I. 11","bando":"propias","arma":"infanteria","escalon":"division","lat":-16.51,"lng":-64.49}]\n```\n' +
      '- `bando`: "propias" (AZUL) o "enemigas" (ROJO).\n- `arma`: uno de ' + ARMAS.join(', ') + '.\n- `escalon`: uno de ' + ESCALONES.join(', ') + '.\n- `lat`/`lng` en grados decimales, sobre el terreno del ejercicio.\n\n'
  }
  function pedidoOGO(ctx) {
    var E = ctx.escalon, F = ctx.foco
    var anexos = CAT.ANEXOS_OGO.map(function (a) {
      var S = CAT.SECCIONES[a.sec], entrena = F.secs.indexOf(a.sec) >= 0 && F.id !== 'pmtd'
      return 'Anexo ' + a.letra + ' — ' + a.nom + ' (lo recibe el ' + S.corto + ')' + (entrena ? ' ← ES EL CAMPO QUE SE ENTRENA: completo en lo que el superior sabe, SIN resolver lo que el alumno tiene que producir' : '')
    })
    return '## LA TAREA: la ORDEN GENERAL DE OPERACIONES (OGO) del ' + E.profesor + ' a la unidad de los alumnos, COMPLETA, con TODOS sus anexos\n\n' +
      'Es la **' + E.orden + '**. La reciben los alumnos (' + E.alumnos + ') y con ella hacen el PMTD completo (recibir la misión, analizar la misión, desarrollar los CAP, Juego de Guerra, comparar, decidir, elaborar su propia orden).\n\n' +
      '### Formato de la OGO (formato militar de la Escuela)\n' +
      'Encabezado (clasificación, copia N° de, unidad, lugar/PC, grupo fecha-hora, N° de orden, referencias: cartas y escala, huso horario), ORGANIZACIÓN DE LA TAREA (del escalón del profesor, con los alumnos adentro), y los cinco párrafos:\n' +
      enumera([
        'SITUACIÓN: a. Fuerzas enemigas (orden de batalla, dispositivo, capacidades, lo que sabe el superior; remite al Anexo A). b. Fuerzas amigas (misión e intención DOS escalones arriba, unidades vecinas y de apoyo con sus misiones). c. Agregaciones y segregaciones (refuerzos y reducciones de la unidad de los alumnos, con la hora en que rigen). d. Supuestos.',
        'MISIÓN: la misión de la unidad del PROFESOR (quién, qué, cuándo, dónde, para qué).',
        'EJECUCIÓN: a. Intención del Comandante (propósito, tareas clave, estado final). b. Concepto de la operación (esquema de maniobra por fases, operación decisiva y de configuración, fuegos, reconocimiento, ingenieros). c. Tareas a las unidades subordinadas: UNA por unidad, la de los alumnos con todo detalle (misión, límites, objetivos, medidas de coordinación, apoyos recibidos), las vecinas en una línea. d. Instrucciones de coordinación (hora de inicio, líneas y medidas de control, RCIC del superior, administración del riesgo, reglas de empeñamiento).',
        'APOYO DE SERVICIO DE COMBATE / LOGÍSTICA: concepto del apoyo, instalaciones, rutas, clases de abastecimiento, sanidad, mantenimiento, transporte (remite al Anexo D).',
        'COMANDO Y COMUNICACIONES: puestos comando (ubicación y desplazamientos), sucesión de comando, instrucciones de comunicaciones (remite al Anexo G).'
      ]) + '\nFirma del Comandante, autenticación, anexos, distribución.\n\n' +
      '### Los anexos (TODOS, cada uno completo y en su propio formato de anexo, con sus apéndices si corresponde)\n' + enumera(anexos) + '\n\n' +
      '### Reglas\n' +
      '- Si hay BIBLIOTECA DEL PROFESOR (al final del contexto): la ORGANIZACIÓN DE LA TAREA, las agregaciones y segregaciones y los efectivos salen de SUS COE (designaciones, efectivos, armamento y vehículos tal cual); el enemigo, su organización y su armamento, de los apéndices de organización y armamento del enemigo; citalos como apéndices de los anexos en vez de inventarlos.\n' +
      '- Los datos tienen que ser de ESTE ejercicio: el terreno del Área de Interés y del CMOC (avenidas de aproximación, terreno clave), las fichas de la carta (usá sus designaciones), la Orden escrita en la Mesa si ya hay algo. Coordenadas, líneas y objetivos con nombre y ubicación.\n' +
      '- Si la CARPETA DEL PROFESOR trae el CMOC (paso 4), el párrafo 1.a y el Anexo A (Inteligencia) toman de ahí el terreno, las avenidas de aproximación y el terreno clave con sus mismos nombres, A NIVEL DEL SUPERIOR; si trae los cursos de acción del enemigo (paso 7), el Anexo A da lo que el superior sabe del enemigo sin decirle al alumno cuál es el más probable. Si el ejercicio entrena el G-2 o el PMTD completo, NO le des al alumno la calificación de las avenidas ni el terreno decisivo de SU nivel: eso lo tiene que producir él.\n' +
      '- Escalón coherente: el ' + E.profesor + ' escribe; la unidad de los alumnos recibe tareas de su nivel, con subordinados dos niveles abajo nombrados.\n' +
      '- Fechas y horas en D/H (D-5, D, D+2; H-2, H+6). Si el ejercicio no tiene calendario, dejá D y H sin fecha.\n' +
      '- ' + F.pide + '\n' +
      '- No escribas el plan de los alumnos ni sus apreciaciones: eso es lo que van a hacer con esta Orden.\n\n' +
      '### Cómo contestar\n' +
      'En Markdown, en español militar, voseo no (es un documento). Primero la OGO entera; después cada anexo con su letra y título como encabezado de nivel 2; al final una sección «## PARA EL PROFESOR» con: 1) qué debe producir el alumno con esta Orden (por fase del PMTD, según el campo que entrena); 2) qué quedó deliberadamente sin resolver para él; 3) una lista de supuestos que inventaste para que el profesor los confirme. Si no entra todo en una respuesta, terminá el documento actual y decí «SIGUE: Anexo X» para que te pidan el resto.\n\n'
  }
  // La primera línea dice a quién va el documento: la carpeta del profesor lo separa con eso.
  function destino(paso) {
    if (paso.carpeta === 'solucion') return 'Empezá con la línea «DESTINO: SOLUCIÓN DEL PROFESOR (no va a los alumnos)». '
    if (paso.carpeta === 'alumnos') return 'Empezá con la línea «DESTINO: VA A LOS ALUMNOS». '
    return 'Empezá con UNA línea que diga a quién va: «DESTINO: SOLUCIÓN DEL PROFESOR (no va a los alumnos)» o «DESTINO: VA A LOS ALUMNOS», según el campo que entrena. '
  }
  function pedidoPaso(paso, ctx) {
    var ia = paso.ia || {}
    var t = '## LA TAREA: ' + (ia.tit || paso.nom) + '\n\n' + (ia.pide || paso.que) + '\n\n'
    if (paso.organizaciones) t += formatoFichas()
    t += '### Cómo contestar\nEn Markdown, en español militar, con títulos y cuadros donde haga falta; datos de ESTE terreno y de ESTE escalón (' + ctx.escalon.profesor + ' → ' + ctx.escalon.alumnos + '); coherente con lo que ya hay en el ejercicio (abajo). ' + destino(paso) + 'Terminá con «## PARA EL PROFESOR»: qué de esto va a los alumnos y qué es solución para corregirlos, según el campo que entrena (' + ctx.foco.nom + '), y los puntos críticos que el profesor tiene que mirar al corregir. La respuesta entera se guarda en la carpeta del profesor y entra en los pedidos de los pasos que siguen.\n\n'
    return t
  }
  // El pedido entero de un paso. ctx: { escalon, foco, ejercicio, unidades, centro, limite }.
  function armarPedido(paso, ctx) {
    ctx = ctx || {}
    ctx.escalon = ctx.escalon || CAT.ESCALONES[1]
    ctx.foco = ctx.foco || CAT.FOCOS[0]
    ctx.paso = paso.n
    return cabecera(paso, ctx) + (paso.ogo ? pedidoOGO(ctx) : pedidoPaso(paso, ctx)) +
      '---\n\n# CONTEXTO DEL EJERCICIO (lo que ya hay en la Mesa)\n\n' + contexto(ctx) + '\n\n---\n' +
      'RECORDATORIO: ' + (paso.ogo ? 'la OGO completa con TODOS sus anexos, ' : ia(paso) + ', ') + 'para un ' + ctx.escalon.profesor + ' cuyos alumnos son ' + ctx.escalon.alumnos + '; el ejercicio entrena ' + ctx.foco.nom + '.\n'
  }
  function ia(paso) { return (paso.ia && paso.ia.tit) || paso.nom }

  function focoDe(id) { for (var i = 0; i < CAT.FOCOS.length; i++) if (CAT.FOCOS[i].id === id) return CAT.FOCOS[i]; return CAT.FOCOS[0] }
  function organizacionDe(id) { for (var i = 0; i < CAT.ORGANIZACIONES.length; i++) if (CAT.ORGANIZACIONES[i].id === id) return CAT.ORGANIZACIONES[i]; return null }

  return { ARMAS: ARMAS, ESCALONES: ESCALONES, armarPedido: armarPedido, resumenTerreno: resumenTerreno, resumenAOI: resumenAOI, fichasDeOrganizacion: fichasDeOrganizacion, fichasDeJSON: fichasDeJSON, focoDe: focoDe, organizacionDe: organizacionDe, contexto: contexto, LIMITE_EXPEDIENTE: LIMITE_EXPEDIENTE }
})
