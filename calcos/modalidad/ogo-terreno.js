/* 🧭 DÓNDE PONER UNA UNIDAD QUE FALTA, MIRANDO EL TERRENO (modalidad Profesor). Código aparte del
   compilado, puro (se prueba en Node). Lo pidió Sergio (11-10-2026): «la ubicación que sugiere la Mesa
   es una regla de distancias respecto del PC, no un análisis del terreno… ARREGLA ESTO».
   Con lo que la Mesa ya tiene del terreno —las capas de los calcos generados (carreteras, caminos,
   vías militares, poblaciones y áreas urbanas, ríos y lagos, aeródromos, cimas) y el CMOC (terreno
   restringido y severamente restringido, avenidas de aproximación del enemigo)— y de la situación (el
   PC de quien expide, las fichas enemigas, las propias ya puestas), se arma una rejilla de puntos
   dentro del Área de Operaciones y cada punto se califica según lo que la doctrina pide a cada tipo de
   unidad:
   · lo logístico (logística, intendencia, transporte, mantenimiento, sanidad): detrás del PC, fuera
     del alcance de la artillería enemiga, junto a una carretera y a una población, fuera del terreno
     restringido, de las avenidas del enemigo y del agua;
   · la aviación: atrás, en terreno llano (no restringido), junto a un aeródromo o a una carretera;
   · la artillería: entre el PC y el frente, al alcance del frente pero fuera del fuego directo,
     con espacio (no restringido), cerca de un camino, fuera de las poblaciones; los lanzadores
     múltiples, más atrás;
   · ingenieros, comunicaciones (en altura), defensa antiaérea, PC alterno: cerca del PC y de los
     caminos;
   · la maniobra (Cuerpos, Divisiones, Brigadas): adelante, sobre las avenidas que tiene que cerrar;
     la reserva, atrás y en el centro, junto a las carreteras.
   Nunca en un lago ni en terreno severamente restringido; separadas de las otras fichas.
   · ubicar(u, ej, ident, op) → { lat, lng, porque: [...], puntaje } o null (sin Área de Operaciones).
   · revisar(u, lat, lng, ej, ident) → { graves: [...], notas: [...] }: lo que el terreno dice de una
     ubicación dada (la de la IA): en el agua, en terreno severamente restringido, al alcance directo
     del enemigo, fuera del área… */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./ogo-mesa.js'))
  else raiz.SIDOgoTerreno = fabrica(raiz.SIDOgoMesa)
})(typeof window !== 'undefined' ? window : this, function (MESA) {
  'use strict'
  if (!MESA) return null

  // ─── Geometría en km sobre un plano local ───────────────────────────────────────────
  function plano(lng0, lat0) {
    var kx = 111.32 * Math.cos(lat0 * Math.PI / 180), ky = 110.57
    return { a: function (p) { return [(p[0] - lng0) * kx, (p[1] - lat0) * ky] }, de: function (q) { return [q[0] / kx + lng0, q[1] / ky + lat0] } }
  }
  function par(p) { return Array.isArray(p) && p.length >= 2 && isFinite(+p[0]) && isFinite(+p[1]) && p[0] !== null && p[1] !== null }
  function dentro(p, an) {
    var c = false
    for (var i = 0, j = an.length - 1; i < an.length; j = i++) {
      var a = an[i], b = an[j]
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c
    }
    return c
  }
  function caja(ps) { var c = [Infinity, Infinity, -Infinity, -Infinity]; ps.forEach(function (p) { c[0] = Math.min(c[0], p[0]); c[1] = Math.min(c[1], p[1]); c[2] = Math.max(c[2], p[0]); c[3] = Math.max(c[3], p[1]) }); return c }
  // Las geometrías de las capas: GeoJSON (Feature / geometría / FeatureCollection) o {coords} de la Mesa.
  function geometrias(x, acc) {
    acc = acc || []
    if (!x) return acc
    if (Array.isArray(x)) { x.forEach(function (y) { geometrias(y, acc) }); return acc }
    if (x.fc) return geometrias(x.fc, acc)
    if (x.type === 'FeatureCollection') return geometrias(x.features, acc)
    if (x.type === 'Feature') { if (x.geometry) acc.push(x.geometry); return acc }
    if (x.geometry) { acc.push(x.geometry); return acc }
    if (x.type && x.coordinates) { acc.push(x); return acc }
    if (Array.isArray(x.coords) && x.coords.length && par(x.coords[0])) acc.push({ type: x.coords.length >= 3 && x.cerrada !== false ? 'MesaCoords' : 'LineString', coordinates: x.coords })
    else if (par(x.centro)) acc.push({ type: 'Point', coordinates: x.centro })
    return acc
  }
  function anillosDe(g) {
    if (!g) return []
    if (g.type === 'Polygon') return [g.coordinates[0]]
    if (g.type === 'MultiPolygon') return g.coordinates.map(function (p) { return p[0] })
    if (g.type === 'MesaCoords') return [g.coordinates]
    return []
  }
  function lineasDe(g) {
    if (!g) return []
    if (g.type === 'LineString' || g.type === 'MesaCoords') return [g.coordinates]
    if (g.type === 'MultiLineString') return g.coordinates
    if (g.type === 'Polygon') return [g.coordinates[0]]
    if (g.type === 'MultiPolygon') return g.coordinates.map(function (p) { return p[0] })
    return []
  }
  function puntosDe(g) { return g && g.type === 'Point' ? [g.coordinates] : g && g.type === 'MultiPoint' ? g.coordinates : [] }

  // Buscador del punto más cercano (rejilla de celdas de 2 km).
  function buscador(xy) {
    var C = 2, celdas = {}
    xy.forEach(function (p, i) { var k = Math.floor(p[0] / C) + ',' + Math.floor(p[1] / C); (celdas[k] = celdas[k] || []).push(i) })
    return {
      n: xy.length,
      cerca: function (q, maxKm) {
        if (!xy.length) return { d: Infinity, i: -1 }
        var cx = Math.floor(q[0] / C), cy = Math.floor(q[1] / C), mejor = { d: Infinity, i: -1 }, R = Math.ceil((maxKm || 80) / C)
        for (var r = 0; r <= R; r++) {
          for (var a = -r; a <= r; a++) for (var b = -r; b <= r; b++) {
            if (Math.max(Math.abs(a), Math.abs(b)) !== r) continue
            ;(celdas[(cx + a) + ',' + (cy + b)] || []).forEach(function (i) { var d = Math.hypot(xy[i][0] - q[0], xy[i][1] - q[1]); if (d < mejor.d) mejor = { d: d, i: i } })
          }
          if (mejor.d <= r * C) break // ya no puede haber uno más cerca
        }
        return mejor
      }
    }
  }
  // Puntos a lo largo de las líneas, cada `paso` km (para medir la distancia a un camino o a un río).
  function densificar(lineas, P, paso, caja_) {
    var out = []
    lineas.forEach(function (l) {
      var xy = l.filter(par).map(function (p) { return P.a([+p[0], +p[1]]) })
      for (var i = 0; i < xy.length; i++) {
        var a = xy[i]
        if (!caja_ || (a[0] > caja_[0] && a[0] < caja_[2] && a[1] > caja_[1] && a[1] < caja_[3])) out.push(a)
        if (i + 1 < xy.length) {
          var b = xy[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(d / paso)
          for (var k = 1; k < n; k++) { var q = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]; if (!caja_ || (q[0] > caja_[0] && q[0] < caja_[2] && q[1] > caja_[1] && q[1] < caja_[3])) out.push(q) }
        }
      }
    })
    return out
  }

  // ─── El índice del terreno de un ejercicio (se arma una vez y se guarda) ────────────
  var cache = { clave: null, idx: null }
  var CAPAS = ['comunicaciones_vias', 'mil_vias', 'comunicaciones_caminos', 'comunicaciones_ffcc', 'hidro_lineas', 'hidro_poligonos', 'poblaciones_areas', 'comunicaciones_aero', 'elevaciones_puntos']
  // cuántos elementos y dónde empiezan y terminan (barato; cambia si se regenera la capa o se edita el CMOC)
  function firma(x) {
    var gs = geometrias(x), n = gs.length
    if (!n) return '0'
    var punta = function (g, ult) { var c = g && (g.coordinates || g.coords), k = 0; while (Array.isArray(c) && Array.isArray(c[0]) && k++ < 6) c = ult ? c[c.length - 1] : c[0]; return Array.isArray(c) ? c.join(',') : '' }
    return n + '|' + punta(gs[0]) + '|' + punta(gs[n - 1], true)
  }
  function capa(ej, id) { var r = ej.resultados || ej.datosCapas || ej.datosAnalizados || {}; return r[id] || null }
  function indice(ej) {
    var area = MESA.areaMayor(ej)
    if (!area) return null
    var cm = ej.cmoc || {}
    // la clave, por CONTENIDO: la Mesa entrega una copia nueva del ejercicio cada vez (foto())
    var clave = [JSON.stringify(area.an), firma(cm.severo), firma(cm.restringido), firma(cm.avenidas), JSON.stringify(MESA.poblaciones(ej).length)]
      .concat(CAPAS.map(function (id) { return firma(capa(ej, id)) }))
    if (cache.idx && cache.clave && cache.clave.length === clave.length && cache.clave.every(function (x, i) { return x === clave[i] })) return cache.idx
    var cc = caja(area.an), P = plano((cc[0] + cc[2]) / 2, (cc[1] + cc[3]) / 2)
    var an = area.an.map(function (p) { return P.a(p) }), ca = caja(an), margen = 15, cajaM = [ca[0] - margen, ca[1] - margen, ca[2] + margen, ca[3] + margen]
    var lin = function (ids) { var l = []; ids.forEach(function (id) { geometrias(capa(ej, id)).forEach(function (g) { l = l.concat(lineasDe(g)) }) }); return l }
    var pol = function (x) { var l = []; geometrias(x).forEach(function (g) { anillosDe(g).forEach(function (a) { var xy = (a || []).filter(par).map(function (p) { return P.a([+p[0], +p[1]]) }); if (xy.length >= 3) l.push({ an: xy, c: caja(xy) }) }) }); return l }
    var carreteras = buscador(densificar(lin(['comunicaciones_vias', 'mil_vias']), P, 0.5, cajaM))
    var caminos = buscador(densificar(lin(['comunicaciones_vias', 'mil_vias', 'comunicaciones_caminos', 'comunicaciones_ffcc']), P, 0.5, cajaM))
    var rios = buscador(densificar(lin(['hidro_lineas']), P, 0.5, cajaM))
    var agua = pol(capa(ej, 'hidro_poligonos')), urbano = pol(capa(ej, 'poblaciones_areas'))
    var severo = pol(cm.severo), restringido = pol(cm.restringido)
    var avenidasEn = []
    ;(cm.avenidas || []).forEach(function (a) { if (/enem|rojo/i.test(String(a && a.bando || ''))) avenidasEn.push(a) })
    var avEn = buscador(densificar([].concat.apply([], avenidasEn.map(function (a) { return geometrias(a).map(lineasDe).reduce(function (s, x) { return s.concat(x) }, []) })), P, 1, cajaM))
    var aeros = buscador(geometrias(capa(ej, 'comunicaciones_aero')).map(function (g) { var a = anillosDe(g)[0] || puntosDe(g); return a && a.length ? P.a([a.reduce(function (s, p) { return s + +p[0] }, 0) / a.length, a.reduce(function (s, p) { return s + +p[1] }, 0) / a.length]) : null }).filter(Boolean))
    var cimas = buscador(geometrias(capa(ej, 'elevaciones_puntos')).map(puntosDe).reduce(function (s, x) { return s.concat(x) }, []).filter(par).map(function (p) { return P.a([+p[0], +p[1]]) }))
    var pobs = MESA.poblaciones(ej), pobXY = pobs.map(function (p) { return P.a([p.lng, p.lat]) }), pobB = buscador(pobXY)
    var enPol = function (q, l) { return l.some(function (x) { return q[0] >= x.c[0] && q[0] <= x.c[2] && q[1] >= x.c[1] && q[1] <= x.c[3] && dentro(q, x.an) }) }
    // la rejilla: ~800 puntos dentro del área
    var w = ca[2] - ca[0], h = ca[3] - ca[1], paso = Math.max(0.5, Math.sqrt(w * h / 1100)), cands = []
    for (var x = ca[0] + paso / 2; x < ca[2]; x += paso) for (var y = ca[1] + paso / 2; y < ca[3]; y += paso) {
      var q = [x, y]
      if (!dentro(q, an)) continue
      var cv = carreteras.cerca(q, 40), cm_ = caminos.cerca(q, 40), pb = pobB.cerca(q, 40)
      cands.push({ xy: q, dCarretera: cv.d, dCamino: cm_.d, dRio: rios.cerca(q, 10).d, agua: enPol(q, agua), urbano: enPol(q, urbano),
        severo: enPol(q, severo), restringido: enPol(q, restringido), dAvEn: avEn.cerca(q, 20).d, dAero: aeros.cerca(q, 40).d, dCima: cimas.cerca(q, 10).d,
        dPob: pb.d, pob: pb.i >= 0 ? pobs[pb.i] : null })
    }
    var idx = { P: P, an: an, cands: cands, paso: paso, fuentes: { carreteras: carreteras.n, caminos: caminos.n, rios: rios.n, agua: agua.length, severo: severo.length, restringido: restringido.length, avenidasEnemigas: avenidasEn.length, poblaciones: pobs.length, aerodromos: aeros.n } }
    cache = { clave: clave, idx: idx }
    return idx
  }

  // ─── Lo que pide cada tipo de unidad ────────────────────────────────────────────────
  var LOGISTICA = /logistica|intendencia|transporte|mantenimiento|materialbelico|sanidad|veterinaria/
  function rolDe(u) {
    if (u.tipo === 'pc') return 'pc'
    if (LOGISTICA.test(u.arma)) return 'log'
    if (u.arma === 'aviacion') return 'av'
    if (u.arma === 'lanzacohetes') return 'galm'
    if (u.arma === 'artilleria' || u.arma === 'morteros') return 'art'
    if (u.arma === 'ingenieria') return 'ing'
    if (u.arma === 'comunicaciones' || u.arma === 'inteligencia') return 'com'
    if (u.arma === 'antiaerea') return 'aa'
    if (/reserva/i.test((u.relacion || '') + ' ' + (u.nombre || ''))) return 'res'
    if (/cuerpo|division|brigada|regimiento/.test(u.escalon)) return 'man'
    return 'otro'
  }
  // f: km hacia el frente desde el PC (negativo = atrás); dEn: km al enemigo más cercano.
  var REGLAS = {
    log: { dEnMin: 35, f: [-25, -2], dPC: [4, 25], carretera: 3, camino: 1.5, pob: 1.5, evitaAv: 3, evitaRestr: 2, porque: 'detrás del PC' },
    av: { dEnMin: 40, f: [-35, -5], dPC: [6, 35], carretera: 1, camino: 0.5, aero: 4, evitaRestr: 3, evitaAv: 2, evitaUrbano: 1, porque: 'atrás, en terreno llano' },
    art: { dEn: [12, 30], f: [2, 40], camino: 1.5, evitaRestr: 2, evitaUrbano: 1.5, evitaAv: 1, porque: 'entre el PC y el frente, al alcance del frente y fuera del fuego directo' },
    galm: { dEn: [20, 45], f: [-5, 30], camino: 1.5, evitaRestr: 2, evitaUrbano: 1.5, evitaAv: 1.5, porque: 'detrás de la artillería de tubo, con alcance sobre el frente' },
    ing: { dEnMin: 18, dPC: [3, 20], camino: 2, rio: 0.5, evitaAv: 1, evitaRestr: 1, porque: 'cerca del PC y de los caminos' },
    com: { dEnMin: 20, dPC: [2, 10], cima: 2, camino: 1, evitaAv: 1, porque: 'cerca del PC, en altura' },
    aa: { dEnMin: 15, dPC: [2, 10], camino: 1, evitaRestr: 1, porque: 'cubriendo el PC y las instalaciones' },
    pc: { dEnMin: 25, dPC: [8, 25], carretera: 2, camino: 1, pob: 1.5, evitaAv: 3, evitaRestr: 1.5, porque: 'lejos del PC principal, junto a una población y a un camino' },
    res: { dEnMin: 25, fRel: [0.15, 0.4], carretera: 2.5, evitaRestr: 1.5, centro: 2, porque: 'en profundidad y en el centro, junto a las carreteras' },
    man: { dEnMin: 8, fRel: [0.5, 0.85], avEn: 2, evitaSevero: 3, carretera: 0.5, porque: 'adelante, sobre las avenidas que tiene que cerrar' },
    otro: { dEnMin: 15, dPC: [3, 25], camino: 1, evitaRestr: 1, porque: 'cerca del PC' }
  }
  function enRango(x, r) { return x >= r[0] && x <= r[1] ? 0 : x < r[0] ? r[0] - x : x - r[1] }
  function n1(x) { return (Math.round(x * 10) / 10).toFixed(1).replace('.', ',') }
  // Puntaje (más es mejor) y los motivos, para una unidad en un punto.
  function calificar(c, u, s) {
    var R = REGLAS[s.rol], p = 0, por = []
    if (c.agua || c.severo) return { p: -1e9, por: [] }
    var dEn = s.enemigos.length ? Math.min.apply(null, s.enemigos.map(function (e) { return Math.hypot(e[0] - c.xy[0], e[1] - c.xy[1]) })) : Infinity
    var f = (c.xy[0] - s.pc[0]) * s.u[0] + (c.xy[1] - s.pc[1]) * s.u[1], lat_ = (c.xy[0] - s.pc[0]) * -s.u[1] + (c.xy[1] - s.pc[1]) * s.u[0]
    var dPC = Math.hypot(c.xy[0] - s.pc[0], c.xy[1] - s.pc[1])
    if (R.dEnMin && isFinite(dEn)) { p -= Math.max(0, R.dEnMin - dEn) * 3; if (dEn >= R.dEnMin) por.push('a ' + n1(dEn) + ' km del enemigo (fuera del alcance de su artillería)') }
    if (R.dEn && isFinite(dEn)) { var e = enRango(dEn, R.dEn); p -= e * 2; if (!e) por.push('a ' + n1(dEn) + ' km del enemigo') }
    if (R.f) p -= enRango(f, R.f) * 1.2
    if (R.fRel && s.D > 3) p -= enRango(f / s.D, R.fRel) * 30
    if (R.dPC) p -= enRango(dPC, R.dPC) * 1
    if (R.centro) p -= Math.abs(lat_) / Math.max(5, s.ancho / 2) * 6 * R.centro
    if (R.carretera) { p -= Math.min(c.dCarretera, 30) * R.carretera; if (c.dCarretera < 3) por.push('a ' + n1(c.dCarretera) + ' km de una carretera') }
    if (R.camino) { p -= Math.min(c.dCamino, 30) * R.camino; if (!R.carretera && c.dCamino < 2.5) por.push('a ' + n1(c.dCamino) + ' km de un camino') }
    if (R.pob && c.pob) { p -= Math.min(c.dPob, 30) * R.pob; if (c.dPob < 6) por.push('junto a ' + c.pob.nombre.toUpperCase() + ' (' + n1(c.dPob) + ' km)') }
    if (R.aero) { if (c.dAero < 15) { p -= c.dAero * R.aero; por.push('a ' + n1(c.dAero) + ' km de un aeródromo') } else p -= 15 * R.aero }
    if (R.cima) { if (c.dCima < 5) { p += (5 - c.dCima) * R.cima; por.push('en altura (cerca de una cima)') } }
    if (R.rio && c.dRio < 3) { p += (3 - c.dRio) * R.rio; por.push('cerca de un curso de agua (pasos y abastecimiento)') }
    if (R.avEn) { if (c.dAvEn < 8) { p += (8 - c.dAvEn) * R.avEn; por.push('sobre una avenida de aproximación del enemigo') } }
    if (R.evitaAv && c.dAvEn < 4) p -= (4 - c.dAvEn) * R.evitaAv * 3
    else if (R.evitaAv && isFinite(c.dAvEn)) por.push('fuera de las avenidas del enemigo')
    if (R.evitaRestr && c.restringido) p -= 8 * R.evitaRestr
    else if (R.evitaRestr && s.hayRestr) por.push('fuera del terreno restringido')
    if (R.evitaSevero) {} // el severo ya está descartado
    if (R.evitaUrbano && c.urbano) p -= 6 * R.evitaUrbano
    if (c.dRio < 0.4) p -= 3 // no sobre el río
    // separada de las fichas propias (no encimadas)
    var dOc = s.ocupados.length ? Math.min.apply(null, s.ocupados.map(function (o) { return Math.hypot(o[0] - c.xy[0], o[1] - c.xy[1]) })) : Infinity
    if (dOc < 3) p -= (3 - dOc) * 6
    if (f < 0 && /log|av|pc|res/.test(s.rol)) por.unshift(n1(-f) + ' km detrás del PC')
    return { p: p, por: por, dEn: dEn, f: f }
  }
  function situacion(u, ej, ident, idx, op) {
    var P = idx.P, ps = (ej.unidades || []).filter(function (x) { return x && isFinite(+x.lat) && x.lat != null })
    var en = ps.filter(function (x) { return /enem|rojo/i.test(x.bando || '') }).map(function (x) { return P.a([+x.lng, +x.lat]) })
    var pc = ident && ident.ficha ? P.a([+ident.ficha.lng, +ident.ficha.lat]) : idx.an.reduce(function (s, p) { return [s[0] + p[0] / idx.an.length, s[1] + p[1] / idx.an.length] }, [0, 0])
    var obj = en.length ? [en.reduce(function (s, p) { return s + p[0] }, 0) / en.length, en.reduce(function (s, p) { return s + p[1] }, 0) / en.length] : idx.an.reduce(function (s, p) { return [s[0] + p[0] / idx.an.length, s[1] + p[1] / idx.an.length] }, [0, 0])
    var D = Math.hypot(obj[0] - pc[0], obj[1] - pc[1]), uu = D > 0.5 ? [(obj[0] - pc[0]) / D, (obj[1] - pc[1]) / D] : [0, 1]
    var cc = caja(idx.an), ancho = Math.max(cc[2] - cc[0], cc[3] - cc[1])
    var ocupados = ps.filter(function (x) { return !/enem|rojo/i.test(x.bando || '') }).map(function (x) { return P.a([+x.lng, +x.lat]) }).concat((op && op.ocupados || []).map(function (q) { return P.a([q[0], q[1]]) }))
    return { rol: rolDe(u), enemigos: en, pc: pc, u: uu, D: D, ancho: ancho, ocupados: ocupados, hayRestr: idx.fuentes.restringido + idx.fuentes.severo > 0 }
  }
  // op.ocupados: [[lng, lat]] de las ya sugeridas en esta pasada (para no encimarlas)
  function ubicar(u, ej, ident, op) {
    ej = ej || {}
    var idx = indice(ej)
    if (!idx || !idx.cands.length) return null
    var s = situacion(u, ej, ident, idx, op), mejor = null
    idx.cands.forEach(function (c) { var r = calificar(c, u, s); if (!mejor || r.p > mejor.r.p) mejor = { c: c, r: r } })
    if (!mejor || mejor.r.p < -1e8) return null
    var ll = idx.P.de(mejor.c.xy), R = REGLAS[s.rol]
    var por = [R.porque].concat(mejor.r.por).filter(function (x, i, a) { return x && a.indexOf(x) === i }).slice(0, 5)
    return { lat: Math.round(ll[1] * 1e6) / 1e6, lng: Math.round(ll[0] * 1e6) / 1e6, porque: por, puntaje: mejor.r.p, rol: s.rol, fuentes: idx.fuentes }
  }
  // Lo que el terreno dice de una ubicación dada (la de la IA): lo grave obliga a buscar otra.
  function revisar(u, lat, lng, ej, ident) {
    ej = ej || {}
    var idx = indice(ej), graves = [], notas = []
    if (!idx) return { graves: graves, notas: notas }
    var q = idx.P.a([+lng, +lat])
    if (!dentro(q, idx.an)) graves.push('fuera del Área de Operaciones')
    var cerca = null, dmin = Infinity
    idx.cands.forEach(function (c) { var d = Math.hypot(c.xy[0] - q[0], c.xy[1] - q[1]); if (d < dmin) { dmin = d; cerca = c } })
    if (cerca && dmin <= idx.paso) {
      if (cerca.agua) graves.push('en un lago o humedal')
      if (cerca.severo) graves.push('en terreno severamente restringido')
      if (cerca.restringido) notas.push('en terreno restringido')
      if (cerca.dAvEn < 3 && rolDe(u) !== 'man') notas.push('sobre una avenida de aproximación del enemigo')
    }
    var s = situacion(u, ej, ident, idx), en = s.enemigos.length ? Math.min.apply(null, s.enemigos.map(function (e) { return Math.hypot(e[0] - q[0], e[1] - q[1]) })) : Infinity
    var R = REGLAS[s.rol]
    if (R.dEnMin && en < R.dEnMin * 0.5) graves.push('a ' + n1(en) + ' km del enemigo (al alcance de su fuego)')
    else if (R.dEnMin && en < R.dEnMin) notas.push('a ' + n1(en) + ' km del enemigo (al alcance de su artillería)')
    return { graves: graves, notas: notas }
  }

  return { ubicar: ubicar, revisar: revisar, indice: indice, rolDe: rolDe, REGLAS: REGLAS }
})
