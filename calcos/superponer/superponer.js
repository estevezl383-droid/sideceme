/*
 * 🧩 Superponer — tablero de capas superpuestas de la Mesa del EM.
 *
 * Funciona en la carta 2D (Leaflet) y en la vista 3D (MapLibre).
 *
 * Código aparte del compilado (como el Despliegue del TO y el Plan de fuegos).
 * NO toca el ejercicio: no guarda nada en él, no borra nada y no cambia las
 * fichas. Dibuja encima de la carta 2D lo que se cargue y lo deja activar y
 * desactivar desde un tablero. Si algo falla, la Mesa sigue igual.
 *
 * Diferencia con «Integrar capa del Estado Mayor»:
 *   - Integrar  → mete la capa de un G DENTRO del ejercicio (reemplaza lo de ese G).
 *   - Superponer → sólo la muestra ENCIMA, para ver o exponer; se apaga cuando se quiere.
 *
 * Archivos que entiende:
 *   - sideceme-superposicion  (formato propio: grupos de áreas, unidades y líneas)
 *   - sideceme-areas-operaciones (el que baja «Área de Ops»)
 *   - capa-em (la capa de un G) y ejercicio.json: toma las fichas con lat/lng y las áreas
 *   - GeoJSON (FeatureCollection / Feature)
 *
 * Lo cargado se recuerda en este navegador (localStorage); si no se puede, igual funciona.
 */
(function () {
  'use strict'
  var PRESETS = [{ clave: 'DIAMANTE', nombre: 'DIAMANTE · Despliegue D-30', archivo: './ejercicios/diamante/superposicion.json?v=20261009d' }]
  var KEY = 'sid_superponer_v1'
  var capas = []          // {id, nombre, origen, visible, opac, grupos:[{id,nombre,visible,elementos}], lg, preset}
  var conf = { escala: 1.5, rotulos: 'auto', compacto: true }
  var ZOOM_DETALLE = 8, ultimoCompacto = null
  var mapa = null, btn = null, tab = null, input = null, abierto = false, quitados = {}

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    })
  }
  function guardar() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        conf: conf,
        capas: capas.map(function (c) {
          return { id: c.id, nombre: c.nombre, visible: c.visible, opac: c.opac, preset: c.preset || null,
            grupos: c.grupos.map(function (g) { return { id: g.id, nombre: g.nombre, visible: g.visible, elementos: c.preset ? [] : g.elementos } }) }
        })
      }))
    } catch (e) { /* sin almacenamiento: sigue en memoria */ }
  }
  function leerGuardado() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch (e) { return null }
  }

  // ---------- símbolos (APP-6 simplificado, fuerza propia) ----------
  function simbolo(k, ech, col, esc_) {
    var w = Math.round(30 * esc_), h = Math.round(20 * esc_), sw = Math.max(1.6, 1.4 * esc_)
    var top = Math.round(11 * esc_), W = w + 4, H = h + top + 2
    var x = 2, y = top, cx = x + w / 2, cy = y + h / 2, s = ''
    var fill = 'rgba(255,255,255,.92)'
    if (k === 'pc') {
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + col + '" stroke="#0b1015" stroke-width="' + sw * 0.6 + '"/>'
      s += '<text x="' + cx + '" y="' + (cy + h * 0.2) + '" text-anchor="middle" font-family="Arial" font-weight="700" font-size="' + h * 0.55 + '" fill="#0b1015">PC</text>'
    } else {
      var dash = k === 'mov' ? ' stroke-dasharray="' + 4 * esc_ + ' ' + 2.5 * esc_ + '"' : ''
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '" stroke="' + col + '" stroke-width="' + sw + '"' + dash + '/>'
      var X = '<path d="M' + x + ' ' + y + 'L' + (x + w) + ' ' + (y + h) + 'M' + (x + w) + ' ' + y + 'L' + x + ' ' + (y + h) + '" stroke="' + col + '" stroke-width="' + sw * 0.8 + '"/>'
      var O = '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + w * 0.3 + '" ry="' + h * 0.24 + '" fill="none" stroke="' + col + '" stroke-width="' + sw * 0.8 + '"/>'
      if (k === 'inf' || k === 'mec' || k === 'aeromov') s += X
      if (k === 'mec') s += O
      if (k === 'aeromov') s += '<path d="M' + (cx - w * 0.22) + ' ' + (y + h - 3) + 'Q' + cx + ' ' + (y + h * 0.55) + ' ' + (cx + w * 0.22) + ' ' + (y + h - 3) + '" fill="none" stroke="' + col + '" stroke-width="' + sw * 0.8 + '"/>'
      if (k === 'air') s += '<path d="M' + (x + 4) + ' ' + cy + 'Q' + (x + w * 0.3) + ' ' + (y + 2) + ' ' + cx + ' ' + cy + 'Q' + (x + w * 0.7) + ' ' + (y + h - 2) + ' ' + (x + w - 4) + ' ' + cy + '" fill="none" stroke="' + col + '" stroke-width="' + sw * 0.9 + '"/>'
      if (k === 'nav') s += '<path d="M' + cx + ' ' + (y + 3) + 'V' + (y + h - 3) + 'M' + (x + w * 0.22) + ' ' + (cy + 1) + 'Q' + cx + ' ' + (y + h + 3) + ' ' + (x + w * 0.78) + ' ' + (cy + 1) + '" fill="none" stroke="' + col + '" stroke-width="' + sw * 0.8 + '"/>'
      if (k === 'uav') s += '<path d="M' + (x + w * 0.18) + ' ' + (y + h * 0.3) + 'L' + cx + ' ' + (y + h * 0.8) + 'L' + (x + w * 0.82) + ' ' + (y + h * 0.3) + 'L' + cx + ' ' + (y + h * 0.5) + 'Z" fill="' + col + '"/>'
      var t = k === 'mov' ? 'MOV' : k === 'fe' ? 'FE' : ''
      if (t) s += '<text x="' + cx + '" y="' + (cy + h * 0.18) + '" text-anchor="middle" font-family="Arial" font-weight="700" font-size="' + h * 0.48 + '" fill="' + col + '">' + t + '</text>'
      if (k === 'pto') s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + h * 0.3 + '" fill="' + col + '" stroke="#0b1015"/>'
    }
    if (ech) s += '<text x="' + cx + '" y="' + (top - 2) + '" text-anchor="middle" font-family="Arial" font-weight="700" font-size="' + Math.round(9 * esc_) + '" fill="#f4f6f8" stroke="#0b1015" stroke-width="2.4" paint-order="stroke" letter-spacing="0.5">' + ech + '</text>'
    return { svg: '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' + s + '</svg>', w: W, h: H, top: top }
  }

  function mostrarRotulos() {
    if (conf.rotulos === 'no') return false
    if (conf.rotulos === 'si') return true
    return mapa && mapa.getZoom() >= ZOOM_DETALLE   // auto: lejos se ven sólo los símbolos, para no congestionar
  }

  // Lejos (vista de todo el TO) los símbolos se achican solos para no congestionar la carta;
  // al acercar vuelven al tamaño elegido (150 % por defecto).
  function enCompacto() { return !!(conf.compacto && mapa && mapa.getZoom() < ZOOM_DETALLE) }
  function escalaEf() { return enCompacto() ? Math.max(0.8, conf.escala * 0.6) : conf.escala }
  function alZoom() {
    claseRotulos()
    var c = enCompacto()
    if (c !== ultimoCompacto) { ultimoCompacto = c; capas.forEach(function (x) { if (mapa) dibujar(x) }) }
  }

  // ---------- dibujo ----------
  function dibujar(c) {
    if (!mapa) { actualizar3D(); return }
    var L = window.L
    if (c.lg) { try { mapa.removeLayer(c.lg) } catch (e) {} }
    c.lg = L.layerGroup()
    c.capasGrupo = {}
    c.grupos.forEach(function (g) {
      var lg = L.layerGroup()
      c.capasGrupo[g.id] = lg
      ;(g.elementos || []).forEach(function (el) {
        var col = el.color || '#4f9cf0'
        if (el.tipo === 'area' && el.coords && el.coords.length > 2) {
          L.polygon(el.coords, { color: col, weight: 2.5, dashArray: '7 5', fillColor: col, fillOpacity: 0.22 * c.opac, opacity: c.opac, interactive: true, pane: 'sidSupArea' })
            .bindTooltip('<b>' + esc(el.rotulo || '') + '</b>' + (el.sub ? '<br>' + esc(el.sub) : ''), { sticky: true }).addTo(lg)
          if (el.frente && el.frente.length > 1) L.polyline(el.frente, { color: '#e0443a', weight: 5, opacity: c.opac, pane: 'sidSupArea', interactive: false }).addTo(lg)
          if (el.rotulo) {
            var b = L.latLngBounds(el.coords)
            L.marker([b.getSouth(), b.getWest()], { pane: 'sidSupMarca', interactive: false, keyboard: false,
              icon: L.divIcon({ className: 'sidsup-ao', html: '<div style="opacity:' + c.opac + '"><b>' + esc(el.rotulo) + '</b>' + (el.sub ? '<span>' + esc(el.sub) + '</span>' : '') + '</div>', iconSize: [0, 0], iconAnchor: [-4, -6] }) }).addTo(lg)
          }
        } else if (el.tipo === 'linea' && el.coords && el.coords.length > 1) {
          var pl = L.polyline(el.coords, { color: col, weight: 2.5, opacity: 0.85 * c.opac, dashArray: el.discontinua ? '8 6' : null, pane: 'sidSupArea' })
          if (el.info) pl.bindTooltip(esc(el.info), { sticky: true })
          pl.addTo(lg)
        } else if (el.tipo === 'unidad' && el.ll) {
          var s = simbolo(el.simbolo || 'inf', el.escalon || '', col, escalaEf())
          var lab = el.rotulo ? '<div class="sidsup-lbl" style="left:' + (s.w + 3) + 'px;top:' + (s.top - 1) + 'px"><b>' + esc(el.rotulo) + '</b>' + (el.sub ? '<span>' + esc(el.sub) + '</span>' : '') + '</div>' : ''
          var m = L.marker(el.ll, { pane: 'sidSupMarca', riseOnHover: true, keyboard: false,
            icon: L.divIcon({ className: 'sidsup-u', html: '<div style="opacity:' + c.opac + '">' + s.svg + lab + '</div>', iconSize: [s.w, s.h], iconAnchor: [s.w / 2, s.top + (s.h - s.top) / 2] }) })
          if (el.info) m.bindTooltip(esc(el.info), { direction: 'top', offset: [0, -s.h / 2], className: 'sidsup-tt' })
          m.addTo(lg)
        }
      })
      if (g.visible) lg.addTo(c.lg)
    })
    if (c.visible) c.lg.addTo(mapa)
    actualizar3D()
  }
  function redibujarTodo() { capas.forEach(function (c) { if (mapa) dibujar(c) }) ; claseRotulos() }
  function claseRotulos() { document.documentElement.classList.toggle('sidsup-sinrot', !mostrarRotulos()) }

  // ---------- vista 3D (MapLibre, window.__map3d) ----------
  // Las áreas, frentes y traslados van como capas de la vista 3D (se pegan al relieve);
  // las unidades y los rótulos van como fichas HTML que siguen a la cámara.
  var v3 = { map: null, cont: null, marcas: [], pend: true }
  function geojson3D() {
    var fs = []
    capas.forEach(function (c) {
      if (!c.visible) return
      c.grupos.forEach(function (g) {
        if (!g.visible) return
        ;(g.elementos || []).forEach(function (el) {
          var col = el.color || '#4f9cf0', sw = function (p) { return [p[1], p[0]] }
          if (el.tipo === 'area' && el.coords && el.coords.length > 2) {
            var ring = el.coords.map(sw); ring.push(ring[0])
            fs.push({ type: 'Feature', properties: { k: 'area', col: col, op: c.opac }, geometry: { type: 'Polygon', coordinates: [ring] } })
            if (el.frente && el.frente.length > 1) fs.push({ type: 'Feature', properties: { k: 'frente', col: '#e0443a', op: c.opac }, geometry: { type: 'LineString', coordinates: el.frente.map(sw) } })
          } else if (el.tipo === 'linea' && el.coords && el.coords.length > 1) {
            fs.push({ type: 'Feature', properties: { k: 'linea', col: col, op: c.opac }, geometry: { type: 'LineString', coordinates: el.coords.map(sw) } })
          }
        })
      })
    })
    return { type: 'FeatureCollection', features: fs }
  }
  function capas3D() {
    var m = v3.map
    if (!m || !m.getStyle || !m.getStyle()) return false
    var datos = geojson3D()
    var src = m.getSource('sidsup3')
    if (!src) {
      m.addSource('sidsup3', { type: 'geojson', data: datos })
      m.addLayer({ id: 'sidsup3-fill', type: 'fill', source: 'sidsup3', filter: ['==', ['get', 'k'], 'area'],
        paint: { 'fill-color': ['get', 'col'], 'fill-opacity': ['*', 0.25, ['get', 'op']] } })
      m.addLayer({ id: 'sidsup3-borde', type: 'line', source: 'sidsup3', filter: ['==', ['get', 'k'], 'area'],
        paint: { 'line-color': ['get', 'col'], 'line-width': 2.5, 'line-opacity': ['get', 'op'], 'line-dasharray': [3, 2] } })
      m.addLayer({ id: 'sidsup3-frente', type: 'line', source: 'sidsup3', filter: ['==', ['get', 'k'], 'frente'],
        layout: { 'line-cap': 'round' }, paint: { 'line-color': '#e0443a', 'line-width': 5, 'line-opacity': ['get', 'op'] } })
      m.addLayer({ id: 'sidsup3-linea', type: 'line', source: 'sidsup3', filter: ['==', ['get', 'k'], 'linea'],
        paint: { 'line-color': ['get', 'col'], 'line-width': 2.5, 'line-opacity': ['*', 0.85, ['get', 'op']], 'line-dasharray': [3, 2] } })
    } else src.setData(datos)
    return true
  }
  function marcas3D() {
    if (!v3.cont || !v3.map) return
    v3.cont.innerHTML = ''; v3.marcas = []
    var z = v3.map.getZoom(), comp = conf.compacto && z < ZOOM_DETALLE
    var e = comp ? Math.max(0.8, conf.escala * 0.6) : conf.escala
    capas.forEach(function (c) {
      if (!c.visible) return
      c.grupos.forEach(function (g) {
        if (!g.visible) return
        ;(g.elementos || []).forEach(function (el) {
          var div = document.createElement('div'), pos
          if (el.tipo === 'unidad' && el.ll) {
            var s = simbolo(el.simbolo || 'inf', el.escalon || '', el.color || '#4f9cf0', e)
            div.className = 'sidsup3-u'
            div.style.opacity = c.opac
            div.innerHTML = s.svg + (el.rotulo ? '<div class="sidsup-lbl3" style="left:' + (s.w + 3) + 'px;top:' + (s.top - 1) + 'px"><b>' + esc(el.rotulo) + '</b>' + (el.sub ? '<span>' + esc(el.sub) + '</span>' : '') + '</div>' : '')
            if (el.info) div.title = el.info
            pos = { ll: [el.ll[1], el.ll[0]], dx: -s.w / 2, dy: -(s.top + (s.h - s.top) / 2) }
          } else if (el.tipo === 'area' && el.rotulo && el.coords && el.coords.length > 2) {
            var sur = Infinity, oeste = Infinity
            el.coords.forEach(function (p) { sur = Math.min(sur, p[0]); oeste = Math.min(oeste, p[1]) })
            div.className = 'sidsup3-ao'
            div.style.opacity = c.opac
            div.innerHTML = '<b>' + esc(el.rotulo) + '</b>' + (el.sub ? '<span>' + esc(el.sub) + '</span>' : '')
            pos = { ll: [oeste, sur], dx: 4, dy: 6 }
          } else return
          v3.cont.appendChild(div)
          v3.marcas.push({ el: div, p: pos })
        })
      })
    })
    v3.comp = comp
    ubicar3D()
  }
  function ubicar3D() {
    var m = v3.map
    if (!m || !v3.cont) return
    var W = v3.cont.clientWidth, H = v3.cont.clientHeight
    v3.cont.classList.toggle('sinrot', conf.rotulos === 'no' || (conf.rotulos === 'auto' && m.getZoom() < ZOOM_DETALLE))
    for (var i = 0; i < v3.marcas.length; i++) {
      var k = v3.marcas[i], pt
      try { pt = m.project(k.p.ll) } catch (e) { pt = null }
      if (!pt || !isFinite(pt.x) || pt.x < -200 || pt.y < -200 || pt.x > W + 200 || pt.y > H + 200) { k.el.style.display = 'none'; continue }
      k.el.style.display = ''
      k.el.style.transform = 'translate(' + Math.round(pt.x + k.p.dx) + 'px,' + Math.round(pt.y + k.p.dy) + 'px)'
    }
    var comp = conf.compacto && m.getZoom() < ZOOM_DETALLE
    if (comp !== v3.comp) marcas3D()
  }
  function preparar3D(m) {
    v3.map = m
    v3.cont = document.createElement('div')
    v3.cont.className = 'sidsup3d'
    m.getContainer().appendChild(v3.cont)
    m.on('render', ubicar3D)
    m.on('styledata', function () { v3.pend = true })
    v3.pend = true
    actualizar3D()
  }
  function actualizar3D() {
    if (!v3.map) return
    try { if (capas3D()) v3.pend = false } catch (e) { v3.pend = true }
    marcas3D()
  }
  function revisar3D() {
    var m = window.__map3d
    if (m && m !== v3.map) preparar3D(m)
    else if (!m && v3.map) { v3.map = null; if (v3.cont) v3.cont.remove(); v3.cont = null; v3.marcas = [] }
    else if (v3.map && (v3.pend || !v3.map.getSource('sidsup3'))) { try { if (capas3D()) v3.pend = false } catch (e) {} }
  }

  // ---------- lectura de archivos ----------
  function normalizar(j, nombreArchivo) {
    if (!j || typeof j !== 'object') throw new Error('El archivo no es un JSON válido.')
    if (j.tipoArchivo === 'sideceme-superposicion') return { nombre: j.nombre || nombreArchivo, grupos: j.grupos || [] }
    if (j.tipoArchivo === 'sideceme-areas-operaciones') {
      return { nombre: 'Áreas de operaciones · ' + (j.ejercicioOrigen || nombreArchivo), grupos: [{ id: 'ao', nombre: 'Áreas de operaciones (' + (j.areas || []).length + ')', visible: true,
        elementos: (j.areas || []).map(function (a) {
          var ll = function (p) { return [p[1], p[0]] }
          return { tipo: 'area', coords: (a.coords || []).map(ll), frente: (a.frente || []).map(ll), rotulo: 'AO ' + (a.nombre || ''),
            sub: [a.unidad, a.frenteM ? (a.frenteM / 1000).toFixed(1) + ' km de frente' : ''].filter(Boolean).join(' · '), color: '#4f9cf0' }
        }) }] }
    }
    if (j.type === 'FeatureCollection' || j.type === 'Feature') {
      var fs = j.type === 'Feature' ? [j] : (j.features || []), el = []
      fs.forEach(function (f) {
        var g = f.geometry || {}, p = f.properties || {}, nom = p.name || p.nombre || p.designacion || ''
        var sw = function (c) { return [c[1], c[0]] }
        if (g.type === 'Point') el.push({ tipo: 'unidad', ll: sw(g.coordinates), simbolo: 'pto', rotulo: nom, info: nom })
        if (g.type === 'LineString') el.push({ tipo: 'linea', coords: g.coordinates.map(sw), info: nom })
        if (g.type === 'Polygon') el.push({ tipo: 'area', coords: g.coordinates[0].map(sw), rotulo: nom })
        if (g.type === 'MultiPolygon') g.coordinates.forEach(function (pg) { el.push({ tipo: 'area', coords: pg[0].map(sw), rotulo: nom }) })
      })
      return { nombre: j.name || nombreArchivo, grupos: [{ id: 'g', nombre: 'Elementos (' + el.length + ')', visible: true, elementos: el }] }
    }
    // capa-em, ejercicio.json u otro: buscar fichas con lat/lng y polígonos de áreas
    var fichas = [], areas = [], vistos = 0
    ;(function walk(o, prof) {
      if (!o || typeof o !== 'object' || prof > 9 || vistos > 50000) return
      vistos++
      if (Array.isArray(o)) { o.forEach(function (v) { walk(v, prof + 1) }); return }
      var lat = +(o.lat != null ? o.lat : o.latitud), lng = +(o.lng != null ? o.lng : (o.lon != null ? o.lon : o.longitud))
      if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (o.lat != null || o.latitud != null)) {
        var nom = o.designacion || o.nombre || o.rotulo || o.titulo || ''
        fichas.push({ tipo: 'unidad', ll: [lat, lng], simbolo: /mec|blind/i.test((o.arma || '') + nom) ? 'mec' : (o.arma ? 'inf' : 'pto'),
          escalon: ({ division: 'XX', brigada: 'X', regimiento: 'III', batallon: 'II', compania: 'I', cuerpo: 'XXX', ejercito: 'XXXX' })[o.escalon] || '',
          rotulo: nom, info: [nom, o.mision || o.descripcion || o.obs || ''].filter(Boolean).join(' — '), color: o.bando === 'enemigo' || o.enemigo ? '#e0443a' : '#4f9cf0' })
      }
      var cs = o.coords || o.coordenadas || o.puntos
      if (Array.isArray(cs) && cs.length > 2 && Array.isArray(cs[0]) && cs[0].length >= 2 && typeof cs[0][0] === 'number') {
        var lngPrimero = Math.abs(cs[0][0]) > 60 && Math.abs(cs[0][1]) <= 60 // [lng,lat] en Sudamérica
        areas.push({ tipo: 'area', coords: cs.map(function (p) { return lngPrimero ? [p[1], p[0]] : [p[0], p[1]] }), rotulo: o.nombre || o.rotulo || '', color: '#4f9cf0' })
      } else if (Array.isArray(cs) && cs.length > 2 && cs[0] && typeof cs[0].lat === 'number') {
        areas.push({ tipo: 'area', coords: cs.map(function (p) { return [p.lat, p.lng] }), rotulo: o.nombre || o.rotulo || '', color: '#4f9cf0' })
      }
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k) && o[k] && typeof o[k] === 'object') walk(o[k], prof + 1)
    })(j, 0)
    if (!fichas.length && !areas.length) throw new Error('No encontré fichas ni áreas con coordenadas en este archivo.')
    var gr = []
    if (areas.length) gr.push({ id: 'areas', nombre: 'Áreas (' + areas.length + ')', visible: true, elementos: areas })
    if (fichas.length) gr.push({ id: 'fichas', nombre: 'Fichas (' + fichas.length + ')', visible: true, elementos: fichas })
    var tit = j.tipoArchivo === 'capa-em' ? 'Capa ' + String(j.puesto || '').toUpperCase() + ' · ' + (j.ejercicio || '') : (j.nombre || j.ejercicio || nombreArchivo)
    return { nombre: tit, grupos: gr }
  }

  function agregar(n, extra) {
    var c = { id: 'c' + Date.now() + Math.floor(Math.random() * 1000), nombre: n.nombre, visible: true, opac: 1, grupos: n.grupos.map(function (g) {
      return { id: g.id, nombre: g.nombre, visible: g.visible !== false, elementos: g.elementos || [] } }) }
    if (extra) for (var k in extra) c[k] = extra[k]
    capas.push(c)
    if (mapa) dibujar(c)
    guardar(); pintar()
    return c
  }

  function cargarArchivo(f) {
    var rd = new FileReader()
    rd.onload = function () {
      try {
        var j = JSON.parse(rd.result)
        var c = agregar(normalizar(j, f.name.replace(/\.(geo)?json$/i, '')))
        abrir(true); zoomA(c)
      } catch (e) { aviso('No se pudo superponer «' + f.name + '»: ' + e.message) }
    }
    rd.readAsText(f)
  }

  function cargarPreset(p, visible) {
    if (quitados[p.clave] || capas.some(function (c) { return c.preset === p.clave })) return
    quitados[p.clave] = 'cargando'
    fetch(p.archivo).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json() }).then(function (j) {
      if (capas.some(function (c) { return c.preset === p.clave })) return
      delete quitados[p.clave]
      var guard = (leerGuardado() || { capas: [] }).capas.filter(function (c) { return c.preset === p.clave })[0]
      var n = normalizar(j, p.nombre)
      var c = agregar(n, { preset: p.clave, visible: guard ? guard.visible : visible })
      if (guard) {
        c.opac = guard.opac || 1
        c.grupos.forEach(function (g) { var gg = (guard.grupos || []).filter(function (x) { return x.id === g.id })[0]; if (gg) g.visible = gg.visible })
        if (mapa) dibujar(c)
        pintar()
      }
    }).catch(function () { delete quitados[p.clave] })
  }

  function zoomA(c) {
    if (!mapa && !v3.map) return
    var b = null
    c.grupos.forEach(function (g) { if (!g.visible) return; (g.elementos || []).forEach(function (el) {
      var pts = el.ll ? [el.ll] : (el.coords || [])
      pts.forEach(function (p) { b = b ? b.extend(p) : window.L.latLngBounds([p, p]) })
    }) })
    if (!b) return
    if (mapa) mapa.fitBounds(b.pad(0.12), { maxZoom: 11 })
    if (v3.map) { try { var p = b.pad(0.12); v3.map.fitBounds([[p.getWest(), p.getSouth()], [p.getEast(), p.getNorth()]], { maxZoom: 11, duration: 800 }) } catch (e) {} }
  }

  // ---------- interfaz ----------
  function aviso(t) {
    var a = document.createElement('div'); a.className = 'sidsup-aviso'; a.textContent = t
    document.body.appendChild(a); setTimeout(function () { a.remove() }, 5200)
  }

  function pintar() {
    if (!tab) return
    var h = ''
    if (!capas.length) h += '<p class="sidsup-vacio">Todavía no hay nada superpuesto. Cargue un archivo: queda <b>encima</b> de la carta, no entra al ejercicio.</p>'
    capas.forEach(function (c) {
      h += '<div class="sidsup-capa' + (c.visible ? '' : ' off') + '" data-c="' + c.id + '"><div class="sidsup-ch">' +
        '<label class="sidsup-sw"><input type="checkbox" data-a="ver"' + (c.visible ? ' checked' : '') + '><span></span></label>' +
        '<b title="' + esc(c.nombre) + '">' + esc(c.nombre) + '</b>' +
        '<button type="button" data-a="zoom" title="Ir a la capa">🎯</button>' +
        '<button type="button" data-a="quitar" title="Quitar del tablero (no borra nada del ejercicio)">✕</button></div>' +
        '<div class="sidsup-gs">' + c.grupos.map(function (g) {
          return '<label><input type="checkbox" data-a="grupo" data-g="' + esc(g.id) + '"' + (g.visible ? ' checked' : '') + '> ' + esc(g.nombre) + '</label>'
        }).join('') + '</div>' +
        '<label class="sidsup-op">Opacidad <input type="range" min="0.2" max="1" step="0.1" value="' + c.opac + '" data-a="opac"></label></div>'
    })
    tab.querySelector('.sidsup-lista').innerHTML = h
    tab.querySelector('[data-a="escala"]').value = conf.escala
    tab.querySelector('.sidsup-esc').textContent = Math.round(conf.escala * 100) + ' %'
    tab.querySelector('[data-a="rot"]').value = conf.rotulos
    tab.querySelector('[data-a="comp"]').checked = conf.compacto
  }

  function abrir(si) {
    abierto = si == null ? !abierto : si
    if (tab) tab.hidden = !abierto
    if (btn) btn.setAttribute('aria-expanded', String(abierto))
  }

  function crearUI() {
    btn = document.createElement('button')
    btn.type = 'button'; btn.className = 'sidsup-btn'; btn.textContent = '🧩 SUPERPONER'
    btn.title = 'Tablero de capas superpuestas: activar y desactivar archivos encima de la carta'
    btn.setAttribute('aria-expanded', 'false')
    input = document.createElement('input')
    input.type = 'file'; input.accept = '.json,.geojson,application/json'; input.multiple = true; input.hidden = true
    tab = document.createElement('section')
    tab.className = 'sidsup'; tab.hidden = true; tab.setAttribute('aria-label', 'Tablero de capas superpuestas')
    tab.innerHTML = '<div class="sidsup-hd"><b>🧩 TABLERO · SUPERPONER</b><button type="button" class="sidsup-x" data-a="cerrar" aria-label="Cerrar">✕</button></div>' +
      '<div class="sidsup-bd">' +
      '<button type="button" class="sidsup-cargar" data-a="cargar">➕ Superponer un archivo (JSON / GeoJSON)</button>' +
      '<p class="sidsup-ayuda"><b>Superponer</b> sólo muestra el archivo encima de la carta: no se guarda en el ejercicio ni borra nada. <b>Integrar capa</b> (en 📁 Ejercicio) sí lo mete al ejercicio.</p>' +
      '<div class="sidsup-cf"><label>Tamaño de símbolos <input type="range" min="1" max="2" step="0.1" data-a="escala"> <span class="sidsup-esc"></span></label>' +
      '<label><input type="checkbox" data-a="comp"> Achicar al ver todo el TO (sin congestión)</label>' +
      '<label>Rótulos <select data-a="rot"><option value="auto">Automático (al acercar)</option><option value="si">Siempre</option><option value="no">Ocultos</option></select></label></div>' +
      '<div class="sidsup-lista"></div></div>'
    document.body.appendChild(btn); document.body.appendChild(tab); document.body.appendChild(input)
    btn.addEventListener('click', function () { abrir() })
    input.addEventListener('change', function () { Array.prototype.forEach.call(input.files || [], cargarArchivo); input.value = '' })
    tab.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return
      var a = b.getAttribute('data-a'), cel = b.closest('[data-c]'), c = cel && capas.filter(function (x) { return x.id === cel.getAttribute('data-c') })[0]
      if (a === 'cerrar') abrir(false)
      if (a === 'cargar') input.click()
      if (a === 'zoom' && c) zoomA(c)
      if (a === 'quitar' && c) { if (c.lg) mapa.removeLayer(c.lg); capas = capas.filter(function (x) { return x !== c }); if (c.preset) quitados[c.preset] = true; guardar(); pintar(); actualizar3D() }
    })
    tab.addEventListener('change', function (e) {
      var t = e.target, a = t.getAttribute('data-a'), cel = t.closest('[data-c]'), c = cel && capas.filter(function (x) { return x.id === cel.getAttribute('data-c') })[0]
      if (a === 'ver' && c) { c.visible = t.checked; if (c.lg) { c.visible ? c.lg.addTo(mapa) : mapa.removeLayer(c.lg) } cel.classList.toggle('off', !c.visible); actualizar3D() }
      if (a === 'grupo' && c) {
        var g = c.grupos.filter(function (x) { return x.id === t.getAttribute('data-g') })[0]
        g.visible = t.checked
        var lg = c.capasGrupo && c.capasGrupo[g.id]
        if (lg) { g.visible ? lg.addTo(c.lg) : c.lg.removeLayer(lg) }
        actualizar3D()
      }
      if (a === 'opac' && c) { c.opac = +t.value; dibujar(c) }
      if (a === 'escala') { conf.escala = +t.value; redibujarTodo(); marcas3D(); pintar() }
      if (a === 'rot') { conf.rotulos = t.value; claseRotulos(); ubicar3D() }
      if (a === 'comp') { conf.compacto = t.checked; ultimoCompacto = null; alZoom(); marcas3D() }
      guardar()
    })
    tab.addEventListener('input', function (e) {
      if (e.target.getAttribute('data-a') === 'escala') tab.querySelector('.sidsup-esc').textContent = Math.round(+e.target.value * 100) + ' %'
    })
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierto) abrir(false) })
    pintar()
  }

  // Botón dentro de 📁 Ejercicios, junto a «Integrar capa del Estado Mayor»
  function engancharEjercicios() {
    var els = document.querySelectorAll('button,label,[role="button"]')
    for (var i = 0; i < els.length; i++) {
      var b = els[i]
      if (b.__sidsup || (b.textContent || '').indexOf('Integrar capa del Estado Mayor') < 0) continue
      if (b.closest('.sidsup-ej')) continue
      b.__sidsup = true
      var caja = document.createElement('div')
      caja.className = 'sidsup-ej'
      caja.innerHTML = '<button type="button">🧩 Superponer un archivo encima (sin borrar nada)</button>' +
        '<p><b>Integrar</b> mete la capa de un G <i>dentro</i> del ejercicio y reemplaza lo de ese G. <b>Superponer</b> sólo la muestra <i>encima</i> de la carta, para ver o exponer: se activa y desactiva en el tablero 🧩 y no toca el ejercicio.</p>'
      caja.querySelector('button').addEventListener('click', function () { abrir(true); input.click() })
      // va después del texto explicativo de «Integrar capa» («Cada G baja su capa…»), si está
      var ref = b, sig = b.nextElementSibling
      if (sig && /Cada G baja su capa/.test(sig.textContent || '')) ref = sig
      if (ref.parentElement) ref.parentElement.insertBefore(caja, ref.nextSibling)
    }
  }

  function nombreEjercicio() {
    var b = document.querySelector('button[title="Crear, abrir y guardar ejercicios"]')
    return b ? (b.textContent || '').toUpperCase() : ''
  }

  function prepararMapa(m) {
    mapa = m
    if (!mapa.getPane('sidSupArea')) { mapa.createPane('sidSupArea').style.zIndex = 405 }
    if (!mapa.getPane('sidSupMarca')) { mapa.createPane('sidSupMarca').style.zIndex = 645 }
    mapa.on('zoomend', alZoom)
    ultimoCompacto = enCompacto()
    capas.forEach(dibujar)
    claseRotulos()
  }

  function revisar() {
    try {
      var m = window.__mapa2d
      if (m && m !== mapa && window.L) prepararMapa(m)
      revisar3D()
      if (btn) btn.hidden = !mapa && !v3.map
      engancharEjercicios()
      var nom = nombreEjercicio()
      PRESETS.forEach(function (p) {
        var esProf = window.SIDECEME_CALCOS && window.SIDECEME_CALCOS.esProfesor
        var local = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
        if (nom.indexOf(p.clave) >= 0) cargarPreset(p, true)
        else if (esProf || local) cargarPreset(p, false)   // el profesor lo tiene a mano, apagado
      })
    } catch (e) { /* agregado: si falla, la Mesa sigue igual */ }
  }

  function arrancar() {
    var g = leerGuardado()
    if (g) {
      if (g.conf) { conf.escala = +g.conf.escala || 1.5; conf.rotulos = g.conf.rotulos || 'auto'; conf.compacto = g.conf.compacto !== false }
      ;(g.capas || []).forEach(function (c) { if (!c.preset) capas.push({ id: c.id, nombre: c.nombre, visible: c.visible, opac: c.opac || 1, grupos: c.grupos || [] }) })
    }
    crearUI()
    revisar()
    setInterval(revisar, 1500)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar)
  else arrancar()
  window.SIDSuperponer = { abrir: function () { abrir(true) }, capas: function () { return capas }, normalizar: normalizar }
})()
