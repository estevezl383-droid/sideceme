/* 🗺️ EL CALCO DE OPERACIONES (Anexo A de la OGO del profesor) COMO GRÁFICO. Código aparte del
   compilado, puro (se prueba en Node: arma un SVG; el navegador lo pasa a PNG para el Word). Lo pidió
   Sergio (11-10-2026) con el Word que le había salido en texto («REFERENCIAS DEL CALCO: …») y el calco
   de la Escuela del RI-13 «MONTES»: «el calco es un gráfico, no es texto: lo que harías es extractar el
   Área de Operaciones, las unidades, colocar las dos cruces de amarre con sus coordenadas: ese es el
   calco».
   · dibujo(ej, op) → { svg, ancho, alto, cruces, zona, avisos, cuenta }: lo dibujado en la Mesa sobre
     papel blanco y en negro, como un calco: el Área de Operaciones (y las otras áreas, punteadas), los
     límites con su magnitud, las líneas y zonas de las medidas, los objetivos y puntos, las fichas
     PROPIAS con su símbolo (marco, arma, escalón) y su designación, los PC con su asta, y las DOS
     CRUCES DE AMARRE (noroeste y sudeste) sobre la cuadrícula UTM con sus coordenadas (los dos dígitos
     principales al lado de cada brazo, como en el calco de la Escuela, y al pie la coordenada entera,
     UTM y geográfica), más una escala gráfica. El enemigo no va (va en el Anexo de Inteligencia).
   · utm(lat, lng, zona) → { e, n, zona, banda }: UTM WGS-84 (con la zona que se le pida). */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./ogo-mesa.js'))
  else raiz.SIDOgoCalco = fabrica(raiz.SIDOgoMesa)
})(typeof window !== 'undefined' ? window : this, function (MESA) {
  'use strict'

  // ─── UTM (WGS-84) ───────────────────────────────────────────────────────────────────
  var A = 6378137, F = 1 / 298.257223563, K0 = 0.9996, E2 = F * (2 - F), EP2 = E2 / (1 - E2), R = Math.PI / 180
  function zonaDe(lng) { return Math.min(60, Math.max(1, Math.floor((lng + 180) / 6) + 1)) }
  function banda(lat) { return 'CDEFGHJKLMNPQRSTUVWX'.charAt(Math.max(0, Math.min(19, Math.floor((lat + 80) / 8)))) }
  function utm(lat, lng, zona) {
    zona = zona || zonaDe(lng)
    var phi = lat * R, lam = lng * R, lam0 = ((zona - 1) * 6 - 180 + 3) * R
    var s = Math.sin(phi), c = Math.cos(phi), t = Math.tan(phi)
    var N = A / Math.sqrt(1 - E2 * s * s), T = t * t, C = EP2 * c * c, Aa = c * (lam - lam0)
    var M = A * ((1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 * E2 * E2 / 256) * phi - (3 * E2 / 8 + 3 * E2 * E2 / 32 + 45 * E2 * E2 * E2 / 1024) * Math.sin(2 * phi) +
      (15 * E2 * E2 / 256 + 45 * E2 * E2 * E2 / 1024) * Math.sin(4 * phi) - (35 * E2 * E2 * E2 / 3072) * Math.sin(6 * phi))
    var e = K0 * N * (Aa + (1 - T + C) * Math.pow(Aa, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * EP2) * Math.pow(Aa, 5) / 120) + 500000
    var n = K0 * (M + N * t * (Aa * Aa / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(Aa, 4) / 24 + (61 - 58 * T + T * T + 600 * C - 330 * EP2) * Math.pow(Aa, 6) / 720))
    if (lat < 0) n += 10000000
    return { e: e, n: n, zona: zona, banda: banda(lat) }
  }
  // de UTM a lat, lng (para escribir la coordenada geográfica de cada cruz)
  function geo(e, n, zona, sur) {
    var x = e - 500000, y = sur ? n - 10000000 : n, lam0 = ((zona - 1) * 6 - 180 + 3) * R
    var M = y / K0, mu = M / (A * (1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 * E2 * E2 / 256)), e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2))
    var p1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu) + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu)
    var s = Math.sin(p1), c = Math.cos(p1), t = Math.tan(p1), N1 = A / Math.sqrt(1 - E2 * s * s), T1 = t * t, C1 = EP2 * c * c, R1 = A * (1 - E2) / Math.pow(1 - E2 * s * s, 1.5), D = x / (N1 * K0)
    var lat = p1 - (N1 * t / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * EP2) * Math.pow(D, 4) / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * EP2 - 3 * C1 * C1) * Math.pow(D, 6) / 720)
    var lng = lam0 + (D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * EP2 + 24 * T1 * T1) * Math.pow(D, 5) / 120) / c
    return { lat: lat / R, lng: lng / R }
  }

  // ─── Utilidades ─────────────────────────────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  function par(p) { return Array.isArray(p) && p.length >= 2 && isFinite(+p[0]) && isFinite(+p[1]) && p[0] !== null && p[1] !== null }
  function coords(x) { return x && Array.isArray(x.coords) ? x.coords.filter(par).map(function (p) { return [+p[0], +p[1]] }) : [] }
  function enemiga(u) { return /enem|rojo/i.test(String(u && u.bando || '')) }
  function rotulo(x) { return String((x && (x.nombre || x.etiqueta || x.clave || x.codigo || x.designacion)) || '').replace(/\s+/g, ' ').trim() }
  function n0(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') }
  function f4(x) { return (Math.round(x * 1e4) / 1e4).toFixed(4).replace('-', '−') }
  function dos(x) { return String(Math.floor(x / 1000) % 100).padStart(2, '0') } // los dos dígitos principales (km)
  var MARCA = { ejercito: 'XXXX', cuerpo: 'XXX', division: 'XX', brigada: 'X', regimiento: 'III', batallon: 'II', compania: 'I', seccion: '•••', escuadra: '••', equipo: '•' }

  // El símbolo de una ficha propia: marco, arma y escalón (Reglamento de signos convencionales, simplificado).
  function arma(a, x, y) {
    var w = 17, h = 11, l = function (d) { return '<path d="' + d + '" fill="none" stroke="#000" stroke-width="1.6"/>' }
    var tx = function (t) { return '<text x="' + x + '" y="' + (y + 4) + '" font-size="10" font-weight="bold" text-anchor="middle">' + t + '</text>' }
    var X = l('M' + (x - w) + ' ' + (y - h) + 'L' + (x + w) + ' ' + (y + h) + 'M' + (x - w) + ' ' + (y + h) + 'L' + (x + w) + ' ' + (y - h))
    var oval = '<ellipse cx="' + x + '" cy="' + y + '" rx="10" ry="5.5" fill="none" stroke="#000" stroke-width="1.6"/>'
    switch (a) {
      case 'mecanizada': return X + oval
      case 'blindada': return oval
      case 'caballeria': return l('M' + (x - w) + ' ' + (y + h) + 'L' + (x + w) + ' ' + (y - h))
      case 'cabmec': return l('M' + (x - w) + ' ' + (y + h) + 'L' + (x + w) + ' ' + (y - h)) + oval
      case 'artilleria': return '<circle cx="' + x + '" cy="' + y + '" r="3.6"/>'
      case 'lanzacohetes': return '<circle cx="' + x + '" cy="' + (y + 3) + '" r="3"/>' + l('M' + (x - 5) + ' ' + (y - 2) + 'L' + x + ' ' + (y - 8) + 'L' + (x + 5) + ' ' + (y - 2))
      case 'morteros': return '<circle cx="' + x + '" cy="' + (y + 4) + '" r="2.6"/>' + l('M' + x + ' ' + (y + 2) + 'V' + (y - 8))
      case 'antiaerea': return l('M' + (x - w) + ' ' + (y + h) + 'Q' + x + ' ' + (y - 9) + ' ' + (x + w) + ' ' + (y + h))
      case 'ingenieria': return l('M' + (x - 9) + ' ' + (y + 5) + 'V' + (y - 4) + 'H' + (x + 9) + 'V' + (y + 5) + 'M' + x + ' ' + (y - 4) + 'V' + (y + 5))
      case 'comunicaciones': return l('M' + (x - w) + ' ' + (y - h) + 'L' + (x - 2) + ' ' + (y + 2) + 'L' + (x + 2) + ' ' + (y - 2) + 'L' + (x + w) + ' ' + (y + h))
      case 'aviacion': return '<path d="M' + (x - 10) + ' ' + (y - 6) + 'L' + x + ' ' + y + 'L' + (x - 10) + ' ' + (y + 6) + 'Z M' + (x + 10) + ' ' + (y - 6) + 'L' + x + ' ' + y + 'L' + (x + 10) + ' ' + (y + 6) + 'Z" fill="#000"/>'
      case 'sanidad': return l('M' + x + ' ' + (y - 8) + 'V' + (y + 8) + 'M' + (x - 8) + ' ' + y + 'H' + (x + 8))
      case 'antitanque': return l('M' + (x - w) + ' ' + (y + h) + 'L' + x + ' ' + (y - h) + 'L' + (x + w) + ' ' + (y + h))
      case 'logistica': case 'intendencia': case 'transporte': case 'mantenimiento': case 'materialbelico': return tx({ logistica: 'LOG', intendencia: 'INT', transporte: 'TRP', mantenimiento: 'MNT', materialbelico: 'MB' }[a])
      case 'inteligencia': return tx('ICIA')
      case 'policiamilitar': return tx('PM')
      case 'ametralladoras': return tx('AM')
      case 'ninguna': return ''
      default: return X // infantería, andina, selva, motorizada, aerotransportada
    }
  }
  // El símbolo (sin el rótulo: lo ubica `rotular` donde no pise a otro). La caja que ocupa: [x0, y0, x1, y1].
  function simbolo(u, x, y) {
    var w = 17, h = 11, pc = u.tipo === 'pc', s = '<g class="ficha">'
    if (pc) { // PC: el marco con su asta abajo a la izquierda (la punta del asta es el lugar)
      s += '<rect x="' + (x - w) + '" y="' + (y - 2 * h - 14) + '" width="' + 2 * w + '" height="' + 2 * h + '" fill="#fff" stroke="#000" stroke-width="2"/>' +
        '<path d="M' + (x - w) + ' ' + (y - 14) + 'V' + y + '" stroke="#000" stroke-width="2"/><text x="' + x + '" y="' + (y - h - 10) + '" font-size="10" font-weight="bold" text-anchor="middle">PC</text>'
    } else {
      s += '<rect x="' + (x - w) + '" y="' + (y - h) + '" width="' + 2 * w + '" height="' + 2 * h + '" fill="#fff" stroke="#000" stroke-width="2"/>' + arma(u.arma, x, y)
      if (MARCA[u.escalon]) s += '<text x="' + x + '" y="' + (y - h - 4) + '" font-size="11" font-weight="bold" text-anchor="middle">' + MARCA[u.escalon] + '</text>'
    }
    return s + '</g>'
  }
  function cajaSimbolo(u, x, y) { return u.tipo === 'pc' ? [x - 18, y - 37, x + 18, y + 1] : [x - 18, y - 27, x + 18, y + 12] }
  function pisa(a, b) { return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3] }
  // El rótulo de una ficha: a la derecha; si pisa a otro símbolo o rótulo, a la izquierda, abajo, arriba…
  function rotular(u, x, y, ocupado, W, H) {
    var d = String(u.designacion || u.nombre || '').toUpperCase(), w = Math.max(20, d.length * 7.3), yy = u.tipo === 'pc' ? y - 21 : y
    var cand = [[x + 22, yy + 4, 'start'], [x - 22, yy + 4, 'end'], [x - 17, y + 27, 'start'], [x - 17, y - (u.tipo === 'pc' ? 42 : 31), 'start'], [x + 22, yy + 19, 'start'], [x + 22, yy - 11, 'start'], [x - 22, yy + 19, 'end'], [x - 22, yy - 11, 'end']]
    var caja = function (c) { var x0 = c[2] === 'end' ? c[0] - w : c[0]; return [x0, c[1] - 11, x0 + w, c[1] + 3] }
    var elegido = cand.filter(function (c) { var b = caja(c); return b[0] > 2 && b[2] < W - 2 && b[1] > 2 && b[3] < H - 2 && !ocupado.some(function (o) { return pisa(o, b) }) })[0] || cand[0]
    ocupado.push(caja(elegido))
    return '<text x="' + elegido[0].toFixed(1) + '" y="' + elegido[1].toFixed(1) + '" font-size="12" font-weight="bold" text-anchor="' + elegido[2] + '">' + esc(d) + '</text>'
  }
  function cruz(x, y, arriba, izq, abajo, der) {
    var L = 20, t = function (tx, ty, s, a) { return s ? '<text x="' + tx + '" y="' + ty + '" font-size="15" font-weight="bold" text-anchor="' + a + '">' + s + '</text>' : '' }
    return '<g class="cruz"><path d="M' + (x - L) + ' ' + y + 'H' + (x + L) + 'M' + x + ' ' + (y - L) + 'V' + (y + L) + '" stroke="#000" stroke-width="2.6"/>' +
      t(x, y - L - 5, arriba, 'middle') + t(x - L - 5, y + 5, izq, 'end') + t(x, y + L + 17, abajo, 'middle') + t(x + L + 5, y + 5, der, 'start') + '</g>'
  }

  // ─── El dibujo ──────────────────────────────────────────────────────────────────────
  // op: { ancho (px, 1100), altoMax (px, 1500), enemigo (false) }
  function dibujo(ej, op) {
    op = op || {}; ej = ej || {}
    var o = ej.ops || {}, avisos = [], cuenta = { areas: 0, limites: 0, lineas: 0, zonas: 0, puntos: 0, fichas: 0, pc: 0 }
    // el Área de Operaciones de quien expide (la más grande) en trazo grueso; las cortadas con la tijera, punteadas
    var mayor = MESA.areaMayor(ej), an = mayor ? mayor.an : null
    var otras = MESA.areas(ej).filter(function (x) { return !mayor || x.a !== mayor.a }).map(function (x) { return x.a })
    var fichas = (ej.unidades || []).filter(function (u) { return u && isFinite(+u.lat) && isFinite(+u.lng) && u.lat !== null && (op.enemigo || !enemiga(u)) })
    // los límites del dibujo: el Área de Operaciones (o lo que haya) y las fichas propias cercanas
    var base = an ? an.slice() : [], todo = []
    otras.forEach(function (a) { base = base.concat(coords(a)) })
    ;(o.limites || []).forEach(function (l) { todo = todo.concat(coords(l)) })
    if (!base.length) { base = fichas.map(function (u) { return [+u.lng, +u.lat] }).concat(todo); if (!base.length) return { svg: '', ancho: 0, alto: 0, cruces: [], avisos: ['En la carta no hay Área de Operaciones ni fichas propias: no hay nada que dibujar en el calco.'], cuenta: cuenta } }
    if (!an) avisos.push('No hay ÁREA DE OPERACIONES trazada: el calco se dibuja alrededor de las fichas.')
    var lngs = base.map(function (p) { return p[0] }), lats = base.map(function (p) { return p[1] })
    var zona = zonaDe((Math.min.apply(null, lngs) + Math.max.apply(null, lngs)) / 2), sur = (Math.min.apply(null, lats) + Math.max.apply(null, lats)) / 2 < 0
    var P = function (p) { var u = utm(p[1], p[0], zona); return [u.e, u.n] }
    var bb = base.map(P)
    // las fichas que quedan apenas afuera del área también entran (hasta un 15 % del tamaño del área)
    var e0 = Math.min.apply(null, bb.map(function (p) { return p[0] })), e1 = Math.max.apply(null, bb.map(function (p) { return p[0] }))
    var m0 = Math.min.apply(null, bb.map(function (p) { return p[1] })), m1 = Math.max.apply(null, bb.map(function (p) { return p[1] }))
    var tol = Math.max(e1 - e0, m1 - m0) * 0.15
    fichas.forEach(function (u) { var q = P([+u.lng, +u.lat]); if (q[0] > e0 - tol && q[0] < e1 + tol && q[1] > m0 - tol && q[1] < m1 + tol) { e0 = Math.min(e0, q[0]); e1 = Math.max(e1, q[0]); m0 = Math.min(m0, q[1]); m1 = Math.max(m1, q[1]) } })
    var dE = Math.max(e1 - e0, 500), dN = Math.max(m1 - m0, 500), pad = Math.max(dE, dN) * 0.07
    e0 -= pad; e1 += pad; m0 -= pad; m1 += pad; dE = e1 - e0; dN = m1 - m0
    var M = 46, PIE = 104, W = op.ancho || 1100, altoMax = op.altoMax || 1500
    var s = (W - 2 * M) / dE
    if (dN * s + 2 * M + PIE > altoMax) { s = (altoMax - 2 * M - PIE) / dN; W = Math.round(dE * s + 2 * M) }
    var H = Math.round(dN * s + 2 * M + PIE)
    var X = function (e) { return +(M + (e - e0) * s).toFixed(1) }, Y = function (n) { return +(M + (m1 - n) * s).toFixed(1) }
    var XY = function (p) { var q = P(p); return [X(q[0]), Y(q[1])] }
    var ruta = function (cs, cerrar) { return cs.map(function (p, i) { var q = XY(p); return (i ? 'L' : 'M') + q[0] + ' ' + q[1] }).join('') + (cerrar ? 'Z' : '') }
    var svg = []
    // las áreas
    otras.forEach(function (a) { svg.push('<path d="' + ruta(coords(a), true) + '" fill="none" stroke="#000" stroke-width="1.6" stroke-dasharray="10 6"/>'); var c = XY(centro(coords(a))); if (rotulo(a)) svg.push(texto(c[0], c[1], rotulo(a), 13)); cuenta.areas++ })
    if (an) { svg.push('<path d="' + ruta(an, true) + '" fill="none" stroke="#000" stroke-width="3.4"/>'); cuenta.areas++ }
    ;['zonasLog', 'sectoresLog'].forEach(function (k) { (o[k] || []).forEach(function (z) { var cs = coords(z); if (cs.length < 3) return; svg.push('<path d="' + ruta(cs, true) + '" fill="none" stroke="#000" stroke-width="1.4" stroke-dasharray="4 4"/>'); var c = XY(centro(cs)); if (rotulo(z)) svg.push(texto(c[0], c[1], rotulo(z).toUpperCase(), 12)); cuenta.zonas++ }) })
    // los límites, con su magnitud
    ;(o.limites || []).forEach(function (l, i) {
      var cs = coords(l); if (cs.length < 2) return
      svg.push('<path d="' + ruta(cs) + '" fill="none" stroke="#000" stroke-width="2.6"/>'); cuenta.limites++
      var conMarca = (o.magnitudes || []).some(function (m) { return m && m.origen === 'limite-' + i })
      if (!conMarca && MARCA[l.escalon]) { var c = XY(medio(cs)); svg.push(texto(c[0], c[1], (rotulo(l) && !/^(limite|magnitud)$/i.test(rotulo(l)) ? rotulo(l).toUpperCase() + ' ' : '') + MARCA[l.escalon], 13, true)) }
    })
    ;(o.magnitudes || []).forEach(function (m) { if (!m || !par(m.centro) || !MARCA[m.escalon]) return; var c = XY(m.centro); svg.push(texto(c[0], c[1], MARCA[m.escalon], 13, true)) })
    // las líneas de las medidas (líneas de fase, ejes, flechas)
    ;['lineasEM', 'ejesLog', 'flechasZona'].forEach(function (k) { (o[k] || []).forEach(function (l) { var cs = coords(l); if (cs.length < 2) return; svg.push('<path d="' + ruta(cs) + '" fill="none" stroke="#000" stroke-width="1.8"' + (k === 'ejesLog' ? ' stroke-dasharray="12 5"' : '') + '/>'); if (rotulo(l)) { var c = XY(cs[0]); svg.push(texto(c[0], c[1] - 8, rotulo(l).toUpperCase(), 12)) } cuenta.lineas++ }) })
    ;(o.maniobra || []).forEach(function (a) { var cs = coords(a); if (cs.length < 3) return; svg.push('<path d="' + ruta(cs, true) + '" fill="none" stroke="#000" stroke-width="1.8"/>'); cuenta.lineas++ })
    // objetivos y puntos
    ;(o.objetivos || []).forEach(function (x) { if (!x || !par(x.centro)) return; var c = XY(x.centro); svg.push('<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="22" ry="14" fill="none" stroke="#000" stroke-width="2"/>' + texto(c[0], c[1] + 4, 'OBJ ' + (rotulo(x) || '').toUpperCase(), 11)); cuenta.puntos++ })
    ;['coordinacion', 'pasaje', 'posDef', 'ains'].forEach(function (k) { (o[k] || []).forEach(function (x) { if (!x || !par(x.centro)) return; var c = XY(x.centro); svg.push(k === 'pasaje' ? '<rect x="' + (c[0] - 6) + '" y="' + (c[1] - 6) + '" width="12" height="12" fill="none" stroke="#000" stroke-width="1.6"/>' : '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="6" fill="none" stroke="#000" stroke-width="1.6"/>'); if (rotulo(x)) svg.push('<text x="' + (c[0] + 9) + '" y="' + (c[1] - 6) + '" font-size="11">' + esc(rotulo(x).toUpperCase()) + '</text>'); cuenta.puntos++ }) })
    // las fichas propias
    var puestas = fichas.map(function (u) { var q = P([+u.lng, +u.lat]); return q[0] < e0 || q[0] > e1 || q[1] < m0 || q[1] > m1 ? null : { u: u, x: X(q[0]), y: Y(q[1]) } }).filter(Boolean)
    var ocupado = puestas.map(function (f) { return cajaSimbolo(f.u, f.x, f.y) })
    puestas.forEach(function (f) { svg.push(simbolo(f.u, f.x, f.y)); if (f.u.tipo === 'pc') cuenta.pc++; else cuenta.fichas++ })
    puestas.forEach(function (f) { svg.push(rotular(f.u, f.x, f.y, ocupado, W, H - PIE)) })
    if (!cuenta.fichas && !cuenta.pc) avisos.push('En la carta no hay fichas PROPIAS dentro del área: el calco sale sin unidades.')
    // las dos cruces de amarre, sobre la cuadrícula UTM
    var g = Math.max(dE, dN) > 150000 ? 20000 : Math.max(dE, dN) > 60000 ? 10000 : Math.max(dE, dN) > 20000 ? 5000 : Math.max(dE, dN) > 8000 ? 2000 : 1000
    var ce1 = Math.ceil((e0 + 0.06 * dE) / g) * g, cn1 = Math.floor((m1 - 0.06 * dN) / g) * g, ce2 = Math.floor((e1 - 0.06 * dE) / g) * g, cn2 = Math.ceil((m0 + 0.06 * dN) / g) * g
    if (ce2 <= ce1 || cn2 >= cn1) { ce1 = Math.round(e0 + 0.08 * dE); cn1 = Math.round(m1 - 0.08 * dN); ce2 = Math.round(e1 - 0.08 * dE); cn2 = Math.round(m0 + 0.08 * dN) }
    var cruces = [{ e: ce1, n: cn1 }, { e: ce2, n: cn2 }].map(function (k, i) { var gg = geo(k.e, k.n, zona, sur); return { lugar: i ? 'SE' : 'NO', e: k.e, n: k.n, lat: gg.lat, lng: gg.lng, etiquetaE: dos(k.e), etiquetaN: dos(k.n) } })
    svg.push(cruz(X(ce1), Y(cn1), cruces[0].etiquetaE, cruces[0].etiquetaN, '', ''))
    svg.push(cruz(X(ce2), Y(cn2), '', '', cruces[1].etiquetaE, cruces[1].etiquetaN))
    // al pie: la escala gráfica y las coordenadas enteras de las cruces
    var paso = [1, 2, 5, 10, 20, 25, 50].filter(function (k) { return k * 1000 * s * 2 <= W * 0.3 }).pop() || 1
    var y0 = H - PIE + 26, x0 = M, bar = paso * 1000 * s
    svg.push('<g class="escala"><path d="M' + x0 + ' ' + y0 + 'h' + (2 * bar).toFixed(1) + '" stroke="#000" stroke-width="2"/><rect x="' + x0 + '" y="' + (y0 - 4) + '" width="' + bar.toFixed(1) + '" height="8" fill="#000"/><rect x="' + (x0 + bar).toFixed(1) + '" y="' + (y0 - 4) + '" width="' + bar.toFixed(1) + '" height="8" fill="#fff" stroke="#000" stroke-width="1.2"/>' +
      '<text x="' + x0 + '" y="' + (y0 + 20) + '" font-size="12" text-anchor="middle">0</text><text x="' + (x0 + bar).toFixed(1) + '" y="' + (y0 + 20) + '" font-size="12" text-anchor="middle">' + paso + '</text><text x="' + (x0 + 2 * bar).toFixed(1) + '" y="' + (y0 + 20) + '" font-size="12" text-anchor="middle">' + 2 * paso + ' km</text></g>')
    var zb = zona + banda((Math.min.apply(null, lats) + Math.max.apply(null, lats)) / 2)
    var renglones = ['Cruces de amarre (cuadrícula UTM zona ' + zb + ', WGS-84):'].concat(cruces.map(function (k) { return (k.lugar === 'NO' ? 'Noroeste' : 'Sudeste') + ': ' + n0(k.e) + ' E – ' + n0(k.n) + ' N  (lat ' + f4(k.lat) + ', lng ' + f4(k.lng) + ')' }))
    var xt = x0 + 2 * bar + 46, yt = y0 - 8
    if (W - xt < 430) { xt = x0; yt = y0 + 40 } // angosto: debajo de la escala
    renglones.forEach(function (r, i) { svg.push('<text x="' + xt.toFixed(1) + '" y="' + (yt + i * 16) + '" font-size="12"' + (i ? '' : ' font-weight="bold"') + '>' + esc(r) + '</text>') })
    var pie = renglones.join(' ')
    var out = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" font-family="Arial, Helvetica, sans-serif">' +
      '<rect width="' + W + '" height="' + H + '" fill="#fff"/>' + svg.join('') + '</svg>'
    return { svg: out, ancho: W, alto: H, cruces: cruces, zona: zb, avisos: avisos, cuenta: cuenta, pie: pie }
  }
  function medio(cs) { // el punto de la mitad del trazo (por largo, en grados: alcanza para ubicar un rótulo)
    var L = 0, i, ls = []
    for (i = 1; i < cs.length; i++) { ls.push(Math.hypot(cs[i][0] - cs[i - 1][0], cs[i][1] - cs[i - 1][1])); L += ls[i - 1] }
    var r = L / 2
    for (i = 1; i < cs.length; i++) { if (r <= ls[i - 1]) { var t = ls[i - 1] ? r / ls[i - 1] : 0; return [cs[i - 1][0] + (cs[i][0] - cs[i - 1][0]) * t, cs[i - 1][1] + (cs[i][1] - cs[i - 1][1]) * t] } r -= ls[i - 1] }
    return cs[cs.length - 1]
  }
  function centro(cs) { var x = 0, y = 0; cs.forEach(function (p) { x += p[0]; y += p[1] }); return [x / cs.length, y / cs.length] }
  function texto(x, y, t, tam, fondo) {
    var s = esc(t)
    if (!s) return ''
    var w = Math.max(16, s.length * tam * 0.62)
    return (fondo ? '<rect x="' + (x - w / 2 - 3).toFixed(1) + '" y="' + (y - tam + 1).toFixed(1) + '" width="' + (w + 6).toFixed(1) + '" height="' + (tam + 5) + '" fill="#fff"/>' : '') +
      '<text x="' + x + '" y="' + (y + tam / 2 - 1).toFixed(1) + '" font-size="' + tam + '" font-weight="bold" text-anchor="middle">' + s + '</text>'
  }
  // El tamaño en el Word (word.js: hasta el ancho útil de la hoja): un calco alto se achica para que entre
  // en la hoja con el membrete, el título y la firma (≈ 640 px de alto en una hoja carta vertical).
  function paraWord(d, op) {
    op = op || {}
    var maxAlto = op.maxAlto || 640, r = d.ancho / d.alto
    return d.alto / d.ancho * 627 > maxAlto ? { ancho: Math.round(maxAlto * r), alto: maxAlto } : { ancho: d.ancho, alto: d.alto }
  }

  return { utm: utm, geo: geo, zonaDe: zonaDe, dibujo: dibujo, paraWord: paraWord, MARCA: MARCA }
})
