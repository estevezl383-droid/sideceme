// 🛰️ Imágenes de Google en la Mesa del EM (Map Tiles API de Google Maps Platform).
//
// Lo pidió Sergio (23-10-2026): «quiero usar esas imágenes… en 3D y 2D con relieve, para mis ejercicios
// académicos». La Mesa dibuja con Leaflet (carta 2D) y MapLibre (⛰️ 3D con el relieve SRTM); este módulo
// les da los cuadritos (tiles) de Google como un mapa base más, junto al satélite de Esri y al mapa de OSM:
//   · 🛰️ Google Satélite, 🛰️ Google Satélite con nombres y ⛰️ Google Relieve (relieve sombreado con rutas);
//   · el ⛰️ 3D de la Mesa pone la imagen elegida sobre el relieve, igual que con Esri;
//   · 🏙️ 3D realista (última opción de Google en el selector) muestra, DENTRO de la carta, el lugar que se está
//     mirando en el 3D realista de Google (google-mapas/v1/3d.html en un iframe), con el calco encima.
//
// Cómo funciona la API: se pide una «sesión» por tipo de mapa (POST createSession, dura unas dos semanas y se
// guarda en localStorage) y cada tile es https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=…&key=….
// La clave es de navegador: Google sólo la acepta desde https://estevezl383-droid.github.io/* y sólo para la
// Map Tiles API (restricciones puestas en la consola de Google Cloud, proyecto CIDECEME). Por eso puede ir acá.
//
// Reglas de Google que se cumplen acá: el nombre «Google» y la atribución de las imágenes del lugar que se
// mira (endpoint viewport) quedan siempre a la vista sobre la carta; no se guardan imágenes.
// Si Google no responde (sin conexión, cupo del día agotado, otra dirección), la carta vuelve sola a Esri.
;(function () {
  'use strict'
  const CLAVE = 'AIzaSyBRBu8sOmDm6eIaVNq6vNkyYKNwx4zXTxY'
  const API = 'https://tile.googleapis.com'
  const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  const UN_DIA = 24 * 3600 * 1000
  const ERRORES_PARA_RENDIRSE = 6

  const TIPOS = {
    gsat: { nombre: '🛰️ Google', titulo: 'Satélite de Google', pedido: { mapType: 'satellite' } },
    ghib: { nombre: '🏷️ Nombres', titulo: 'Satélite con rutas, ríos y nombres de lugares', pedido: { mapType: 'satellite', layerTypes: ['layerRoadmap'] } },
    gter: { nombre: '⛰️ Relieve', titulo: 'Relieve sombreado con rutas y nombres', pedido: { mapType: 'terrain', layerTypes: ['layerRoadmap'] } },
  }
  // El selector de la barra de la carta, en dos grupos. Nombres cortos: el selector tiene un ancho fijo para
  // que la barra siga en una fila, y cerrado muestra sólo el nombre elegido (la lista abierta es más ancha).
  // g3d no es un mapa base: elegirlo muestra 🏙️ Google 3D sobre la carta (con el calco) sin cambiar el mapa base.
  const GRUPOS = [
    { grupo: 'Google', opciones: [{ id: 'gsat' }, { id: 'ghib' }, { id: 'gter' }, { id: 'g3d', nombre: '🏙️ 3D realista', titulo: 'El 3D realista de Google en la carta, con el calco encima' }] },
    { grupo: 'Esri / OSM (gratis)', opciones: [{ id: 'sat', nombre: '🛰️ Esri' }, { id: 'osm', nombre: '🗺️ Mapa' }] },
  ]

  // id → { session, expiry } | 'pidiendo' | 'fallo'
  const sesiones = {}
  let rendido = false // Google falló en la carta (cupo, red): por esta visita se usa Esri.
  let vista = null // { lat, lng, zoom } de la última carta seguida.

  const guardado = (id) => 'sidgoogle:v1:' + id + ':' + CLAVE.slice(-6)
  function leer(id) {
    try {
      const s = JSON.parse(localStorage.getItem(guardado(id)) || 'null')
      if (s && s.session && Number(s.expiry) * 1000 - Date.now() > UN_DIA) return s
    } catch {}
    return null
  }

  function pedirSesion(id) {
    const ya = leer(id)
    if (ya) return (sesiones[id] = ya)
    sesiones[id] = 'pidiendo'
    const cuerpo = { ...TIPOS[id].pedido, language: 'es-419', region: 'BO' }
    fetch(`${API}/v1/createSession?key=${CLAVE}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((s) => {
        if (!s || !s.session) throw new Error('sin sesión')
        sesiones[id] = { session: s.session, expiry: s.expiry }
        try {
          localStorage.setItem(guardado(id), JSON.stringify(sesiones[id]))
        } catch {}
      })
      .catch((e) => {
        sesiones[id] = 'fallo'
        console.info('[Google mapas] sin sesión para', id, '—', e.message)
      })
    return null
  }
  for (const id of Object.keys(TIPOS)) pedirSesion(id)

  const esGoogle = (id) => Object.prototype.hasOwnProperty.call(TIPOS, id)
  function urlTiles(id) {
    const s = sesiones[id]
    if (rendido || !s || typeof s !== 'object') return null
    return `${API}/v1/2dtiles/{z}/{x}/{y}?session=${encodeURIComponent(s.session)}&key=${CLAVE}`
  }

  // Configuración del mapa base para la carta 2D (Leaflet: { url, attribution, maxNativeZoom }).
  // null si no es un mapa de Google; si es de Google pero todavía no hay sesión, el satélite de Esri.
  function leaflet(id) {
    if (!esGoogle(id)) return null
    const url = urlTiles(id)
    if (!url) return { url: ESRI, attribution: 'Tiles &copy; Esri', maxNativeZoom: 19 }
    return { url, attribution: 'Google Maps', maxNativeZoom: id === 'gter' ? 15 : 20 }
  }
  // Lo mismo para el ⛰️ 3D (MapLibre: { tiles, atrib, maxzoom }).
  function maplibre(id) {
    if (!esGoogle(id)) return null
    const url = urlTiles(id)
    if (!url) return { tiles: [ESRI], atrib: 'Tiles © Esri', maxzoom: 19 }
    return { tiles: [url], atrib: 'Google Maps', maxzoom: id === 'gter' ? 15 : 19 }
  }

  // El título del selector está en el compilado y decía que el 3D se abría en otra pestaña sin lo trazado: se
  // corrige acá (React no lo vuelve a poner mientras no cambie).
  const TITULO_SELECTOR =
    'Mapa base: las imágenes de Google (satélite, con nombres o relieve), el satélite de Esri o el mapa de calles. ' +
    '🏙️ 3D realista muestra el 3D de Google del lugar en la misma carta, con el calco encima.'
  function opciones() {
    setTimeout(() => {
      const sel = document.querySelector('select.sid-base')
      if (sel && sel.title !== TITULO_SELECTOR) sel.title = TITULO_SELECTOR
    })
    return GRUPOS.map((g) => ({
      grupo: g.grupo,
      opciones: g.opciones
        .filter((o) => !esGoogle(o.id) || (sesiones[o.id] !== 'fallo' && !rendido))
        .map((o) => ({ id: o.id, nombre: o.nombre || TIPOS[o.id].nombre, titulo: o.titulo || TIPOS[o.id]?.titulo || '' })),
    }))
  }

  // ── Atribución y respaldo sobre cada carta (Leaflet o MapLibre) ─────────────────────────────────────────
  const esMapLibre = (mapa) => typeof mapa.getStyle === 'function'
  function urlBase(mapa) {
    if (esMapLibre(mapa)) {
      const s = mapa.getSource && mapa.getSource('base')
      return (s && s.tiles && s.tiles[0]) || ''
    }
    let u = ''
    mapa.eachLayer((c) => {
      if (c._url && c._url.indexOf(API) === 0) u = c._url
    })
    return u
  }
  const sesionDe = (url) => (/[?&]session=([^&]+)/.exec(url) || [])[1]

  function cartel(mapa) {
    if (mapa._sidGoogle) return mapa._sidGoogle
    const el = document.createElement('div')
    el.className = 'sid-google-atrib'
    // Abajo al centro, pegado al borde: los paneles de la Mesa tapan las esquinas de abajo (el de la izquierda,
    // 📋 Mi dispositivo, la leyenda), y por debajo de la barra del tablero la carta queda libre.
    el.style.cssText =
      'position:absolute;left:50%;bottom:1px;transform:translateX(-50%);z-index:1000;pointer-events:none;display:none;align-items:baseline;gap:7px;' +
      'max-width:62%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 6px;border-radius:3px;background:rgba(0,0,0,.38);' +
      'font:500 10px/1.3 Roboto,Arial,sans-serif;color:#fff;text-shadow:0 0 3px #000,0 0 2px #000'
    el.innerHTML =
      '<b style="font:700 13px/1.1 \'Product Sans\',Roboto,Arial,sans-serif;letter-spacing:-.2px">Google</b><span class="sid-google-texto" style="overflow:hidden;text-overflow:ellipsis"></span>'
    mapa.getContainer().appendChild(el)
    mapa._sidGoogle = el
    return el
  }

  async function atribucion(mapa, el) {
    const url = urlBase(mapa)
    const sesion = sesionDe(url)
    el.style.display = sesion ? 'flex' : 'none'
    if (!sesion) return
    const b = mapa.getBounds()
    const zoom = Math.max(0, Math.min(22, Math.round(mapa.getZoom()) + (esMapLibre(mapa) ? 1 : 0)))
    const q = `session=${sesion}&key=${CLAVE}&zoom=${zoom}&north=${b.getNorth().toFixed(5)}&south=${b.getSouth().toFixed(5)}&east=${b.getEast().toFixed(5)}&west=${b.getWest().toFixed(5)}`
    if (el._q === q) return
    el._q = q
    try {
      const r = await fetch(`${API}/tile/v1/viewport?${q}`)
      const j = r.ok ? await r.json() : null
      if (el._q === q && j) el.querySelector('.sid-google-texto').textContent = j.copyright || ''
    } catch {}
  }

  function avisar(texto) {
    const t = document.createElement('div')
    t.textContent = texto
    t.style.cssText =
      'position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:99999;max-width:min(560px,92vw);padding:9px 14px;border-radius:6px;' +
      'background:rgba(12,18,24,.95);border:1px solid #d9a400;color:#ffd75e;font:600 12px Arial,sans-serif;box-shadow:0 4px 18px #0008'
    document.body.appendChild(t)
    setTimeout(() => t.remove(), 9000)
  }

  // Google dejó de dar tiles (cupo del día agotado, clave, red): se pasa la carta a Esri y se avisa una vez.
  function rendirse(mapa) {
    if (!rendido) {
      rendido = true
      avisar('🛰️ Google no está entregando imágenes (cupo del día agotado o sin conexión). La carta vuelve al satélite de Esri.')
    }
    if (esMapLibre(mapa)) {
      for (const id of ['base', 'baseBaja']) {
        const s = mapa.getSource(id)
        if (s && s.tiles && s.tiles[0].indexOf(API) === 0) s.setTiles([ESRI])
      }
    } else {
      mapa.eachLayer((c) => {
        if (c._url && c._url.indexOf(API) === 0) c.setUrl(ESRI)
      })
    }
    if (mapa._sidGoogle) mapa._sidGoogle.style.display = 'none'
    // El selector de la barra (React) pasa a 🛰️ Satélite (Esri): así la Mesa guarda ese mapa base y el
    // selector se vuelve a dibujar sin las opciones de Google.
    const sel = document.querySelector('select.sid-base')
    if (sel && esGoogle(sel.value)) {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sel, 'sat')
      sel.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  // La Mesa llama esto con cada carta que crea: la 2D (Leaflet, en su addInitHook) y la del ⛰️ 3D (MapLibre).
  function seguir(mapa) {
    if (!mapa || mapa._sidGoogleSigue) return
    mapa._sidGoogleSigue = true
    let espera = null
    let errores = 0
    const actualizar = () => {
      try {
        const c = mapa.getCenter()
        vista = { lat: c.lat, lng: c.lng, zoom: mapa.getZoom() + (esMapLibre(mapa) ? 1 : 0) }
      } catch {}
      clearTimeout(espera)
      espera = setTimeout(() => {
        try {
          if (mapa.getContainer && mapa.getContainer()) atribucion(mapa, cartel(mapa))
        } catch {}
      }, 350)
    }
    const fallo = () => {
      if (++errores >= ERRORES_PARA_RENDIRSE) rendirse(mapa)
    }
    mapa.on('moveend', actualizar)
    if (esMapLibre(mapa)) {
      mapa.on('load', actualizar)
      mapa.on('sourcedata', (e) => {
        if (e && e.sourceId === 'base' && e.sourceDataType === 'metadata') actualizar()
      })
      mapa.on('error', (e) => {
        const err = e && e.error
        if ((e.sourceId === 'base' || e.sourceId === 'baseBaja') && err && err.status !== 404 && urlBase(mapa).indexOf(API) === 0) fallo()
      })
    } else {
      mapa.on('layeradd', (e) => {
        const c = e.layer
        if (c && c._url && c._url.indexOf(API) === 0) {
          errores = 0
          c.on('tileerror', fallo)
        }
        actualizar()
      })
      mapa.on('layerremove', actualizar)
      mapa.whenReady(actualizar)
    }
  }

  // ── 🏙️ Google 3D en la carta, con el calco encima ──────────────────────────────────────────────────────
  // Sergio (23-10-2026): «cuando cambio a Google 3D se sale de la imagen y se abre otra aparte… no muestra la
  // plantilla». Ahora el 3D va en un iframe (3d.html?embebido=1) sobre la carta, debajo de los paneles de la Mesa,
  // y se le manda lo que está prendido en la carta 2D para que lo dibuje pegado al terreno.
  const redondo = (n) => Math.round(n * 1e6) / 1e6
  const lngLat = (ll) => [redondo(ll.lng), redondo(ll.lat)]

  function estiloDe(o) {
    return {
      color: o.color || '#3388ff',
      ancho: o.weight == null ? 3 : Number(o.weight),
      opacidad: o.stroke === false ? 0 : o.opacity == null ? 1 : Number(o.opacity),
      guiones: o.dashArray ? String(o.dashArray) : '',
      relleno: o.fill ? o.fillColor || o.color || '#3388ff' : '',
      opRelleno: o.fill ? (o.fillOpacity == null ? 0.2 : Number(o.fillOpacity)) : 0,
    }
  }
  const anillos = (coords, prof) => (prof === 0 ? simplificar(coords.map((p) => [redondo(p[0]), redondo(p[1])])) : coords.map((c) => anillos(c, prof - 1)))

  // Los caminos, ríos y áreas de los calcos del terreno traen miles de puntos: en el 3D cada tramo es un volumen que
  // se pinta sobre los tiles de Google, y con todos la navegación se arrastra (Sergio, 23-10-2026: «para navegar está
  // muy lenta, muy lenta»). Se sacan los puntos que se apartan menos de ~8 m de la línea (Douglas-Peucker); a la vista
  // no cambia nada. Las líneas cortas pasan como están.
  const TOLERANCIA_M = 8
  function simplificar(pts) {
    if (pts.length <= 12) return pts
    const kx = 111320 * Math.cos((pts[0][1] * Math.PI) / 180)
    const ky = 110574
    const t2 = TOLERANCIA_M * TOLERANCIA_M
    const queda = new Uint8Array(pts.length)
    queda[0] = queda[pts.length - 1] = 1
    const pila = [[0, pts.length - 1]]
    while (pila.length) {
      const [a, b] = pila.pop()
      const ax = pts[a][0] * kx, ay = pts[a][1] * ky
      const dx = pts[b][0] * kx - ax, dy = pts[b][1] * ky - ay
      const l2 = dx * dx + dy * dy
      let peor = -1, dmax = t2
      for (let i = a + 1; i < b; i++) {
        const px = pts[i][0] * kx - ax, py = pts[i][1] * ky - ay
        const u = l2 ? Math.max(0, Math.min(1, (px * dx + py * dy) / l2)) : 0
        const ex = px - u * dx, ey = py - u * dy
        const d2 = ex * ex + ey * ey
        if (d2 > dmax) { dmax = d2; peor = i }
      }
      if (peor > 0) { queda[peor] = 1; pila.push([a, peor], [peor, b]) }
    }
    return pts.filter((p, i) => queda[i])
  }

  // Un DivIcon de la carta → ficha (si tiene una imagen), flecha (si es sólo un SVG) o rótulo (texto).
  function divIcono(html, ll, tam, calco) {
    const d = document.createElement('div')
    d.innerHTML = typeof html === 'string' ? html : html && html.outerHTML ? html.outerHTML : ''
    const texto = d.textContent.replace(/\s+/g, ' ').trim()
    const img = d.querySelector('img')
    if (img && img.getAttribute('src') && !texto) {
      const w = Number(img.getAttribute('width')) || (tam && tam.x) || 0
      const h = Number(img.getAttribute('height')) || (tam && tam.y) || 0
      return calco.fichas.push({ lng: ll[0], lat: ll[1], img: img.src, ancho: w, alto: h, ax: w / 2, ay: h / 2 })
    }
    const svg = d.querySelector('svg')
    if (svg && texto === svg.textContent.replace(/\s+/g, ' ').trim()) {
      const w = Number(svg.getAttribute('width')) || (tam && tam.x) || 18
      const h = Number(svg.getAttribute('height')) || (tam && tam.y) || 18
      svg.setAttribute('width', w)
      svg.setAttribute('height', h)
      const giro = /rotate\((-?[\d.]+)deg\)/.exec(d.innerHTML)
      const fuente = new XMLSerializer().serializeToString(svg)
      return calco.flechas.push({ lng: ll[0], lat: ll[1], svg: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fuente), ancho: w, alto: h, rot: giro ? Number(giro[1]) : 0 })
    }
    if (!texto) return
    // Un renglón por cada <div> sin otros adentro o por cada <br>.
    const hojas = Array.from(d.querySelectorAll('div')).filter((x) => !x.querySelector('div'))
    const lineas = hojas.length > 1 ? hojas.map((x) => x.textContent.trim()).filter(Boolean) : [d.innerHTML.split(/<br\s*\/?>/i).map((t) => { const e = document.createElement('div'); e.innerHTML = t; return e.textContent.trim() }).filter(Boolean).join('\n')]
    const color = /(?:^|[;"\s])color:\s*([^;"]+)/.exec(d.innerHTML)
    const tamLetra = /font:[^;"]*?([\d.]+)px/.exec(d.innerHTML) || /font-size:\s*([\d.]+)px/.exec(d.innerHTML)
    calco.rotulos.push({ lng: ll[0], lat: ll[1], texto: lineas.join('\n'), color: color ? color[1].trim() : '#000', tam: tamLetra ? Number(tamLetra[1]) : 12 })
  }

  // Lo que está prendido en la carta 2D (Leaflet): áreas, líneas, círculos, fichas, flechas y rótulos, en grados.
  function calcoDeLaCarta() {
    const calco = { lineas: [], areas: [], circulos: [], puntos: [], fichas: [], flechas: [], rotulos: [] }
    const mapa = window.__mapa2d
    const L = window.L
    if (!mapa || !L || !mapa.eachLayer) return calco
    mapa.eachLayer((c) => {
      try {
        if (c instanceof L.Circle) {
          calco.circulos.push({ centro: lngLat(c.getLatLng()), radio: c.getRadius(), ...estiloDe(c.options) })
        } else if (c instanceof L.CircleMarker) {
          const e = estiloDe(c.options)
          const [lng, lat] = lngLat(c.getLatLng())
          calco.puntos.push({ lng, lat, radio: c.getRadius(), color: e.relleno || e.color, opacidad: Math.max(e.opacidad, e.opRelleno) })
        } else if (c instanceof L.Polygon) {
          const g = c.toGeoJSON().geometry
          const poligonos = g.type === 'Polygon' ? [anillos(g.coordinates, 1)] : g.type === 'MultiPolygon' ? anillos(g.coordinates, 2) : []
          if (poligonos.length) calco.areas.push({ poligonos, ...estiloDe(c.options) })
        } else if (c instanceof L.Polyline) {
          const g = c.toGeoJSON().geometry
          const tramos = g.type === 'LineString' ? [anillos(g.coordinates, 0)] : g.type === 'MultiLineString' ? anillos(g.coordinates, 1) : []
          const e = estiloDe(c.options)
          for (const coords of tramos) calco.lineas.push({ coords, ...e })
        } else if (c instanceof L.Marker) {
          if (c.options.opacity === 0) return
          const ll = lngLat(c.getLatLng())
          const io = (c.options.icon && c.options.icon.options) || {}
          const tam = io.iconSize ? L.point(io.iconSize) : null
          if (io.iconUrl) {
            const anc = io.iconAnchor ? L.point(io.iconAnchor) : tam ? tam.divideBy(2) : L.point(0, 0)
            calco.fichas.push({ lng: ll[0], lat: ll[1], img: io.iconUrl, ancho: tam ? tam.x : 0, alto: tam ? tam.y : 0, ax: anc.x, ay: anc.y })
          } else if (io.html) divIcono(io.html, ll, tam, calco)
        }
        // Rótulos fijos (los de medición, con km y km², quedan sólo en la carta).
        const tt = c.getTooltip && c.getTooltip()
        if (tt && tt.options.permanent && !/medida/.test(tt.options.className || '') && (!c.isTooltipOpen || c.isTooltipOpen())) {
          const ll = tt.getLatLng ? tt.getLatLng() : null
          const lugar = ll || (c.getCenter ? c.getCenter() : c.getLatLng ? c.getLatLng() : null)
          const d = document.createElement('div')
          d.innerHTML = String(tt.getContent() || '')
          d.querySelectorAll('.tt-sub').forEach((x) => x.remove())
          const texto = d.innerHTML.split(/<br\s*\/?>/i).map((t) => { const e = document.createElement('div'); e.innerHTML = t; return e.textContent.trim() }).filter(Boolean)[0]
          if (lugar && texto) {
            const [lng, lat] = lngLat(lugar)
            calco.rotulos.push({ lng, lat, texto, color: '#000', tam: 12 })
          }
        }
      } catch (e) {
        console.info('[Google 3D] no se pasó una capa de la carta:', e && e.message)
      }
    })
    // Los halos: en la carta cada línea de la maniobra, los corredores, la línea de vista… lleva debajo una línea blanca
    // más ancha para que se lea sobre el satélite. En el 3D el halo asoma entre los guiones y entre los tramos (Sergio,
    // 23-10-2026: «las líneas tienen partes blancas… eso no se ve claro, se ve horrible»): va sólo la línea de color.
    const conColor = new Set(calco.lineas.filter((l) => !esBlanco(l.color)).map((l) => JSON.stringify(l.coords)))
    calco.lineas = calco.lineas.filter((l) => !(esBlanco(l.color) && conColor.has(JSON.stringify(l.coords))))
    return calco
  }
  const esBlanco = (c) => /^\s*(#fff(fff)?\b|white\b|rgba?\(\s*255\s*,\s*255\s*,\s*255\b)/i.test(String(c || ''))

  let g3d = null // { caja, marco, base, reloj, alCambiar, alClic, alMensaje, alCapa, alRelieve, ocultos, barra, lugar }
  const destino = () => (location.origin === 'null' ? '*' : location.origin)

  function estilos3D() {
    if (document.getElementById('sid-g3d-estilos')) return
    const st = document.createElement('style')
    st.id = 'sid-g3d-estilos'
    // Mientras se ve el 3D, los botones de zoom y la atribución de la carta 2D (que queda debajo) no van.
    st.textContent = '.sid-g3d-abierto .mapa-principal .leaflet-control-container,.sid-g3d-abierto .mapa-principal .sid-google-atrib{display:none!important}'
    document.head.appendChild(st)
  }

  // La carta 2D vuelve a dibujar sus capas cada vez que cambia algo del ejercicio (y al guardar): si el calco es el
  // mismo, el 3D no lo rehace (rehacerlo traba la navegación unos segundos). `forzar`: cuando el 3D lo pide.
  function enviarCalco(forzar) {
    if (!g3d || !g3d.marco.contentWindow) return
    try {
      const calco = calcoDeLaCarta()
      const firma = JSON.stringify(calco)
      if (!forzar && firma === g3d.firma) return
      g3d.firma = firma
      g3d.enviados = (g3d.enviados || 0) + 1
      g3d.marco.contentWindow.postMessage({ sid3d: 'calco', calco }, destino())
    } catch (e) {
      console.info('[Google 3D] no se pudo mandar el calco:', e && e.message)
    }
  }

  // El «Relieve ×» de la barra de arriba de la Mesa (`label.m3d-des`): en el ⛰️ 3D es la exageración vertical (en la
  // carta 2D, la intensidad del sombreado: ése no se toca). Con el 🏙️ Google 3D abierto también mueve el de Google.
  function relieveDeLaMesa(el) {
    const r = el || document.querySelector('label.m3d-des input[type=range]')
    const etiqueta = r && r.closest && r.closest('label.m3d-des')
    if (!etiqueta || r.disabled || !/^Exageración vertical/.test(etiqueta.title || '')) return null
    const x = Number(r.value)
    return Number.isFinite(x) ? x : null
  }
  function mandarRelieve(x) {
    if (g3d && x != null && g3d.marco.contentWindow) g3d.marco.contentWindow.postMessage({ sid3d: 'relieve', x }, destino())
  }

  // La barra del 3D (⛰️ Relieve ×, ⚡ Detalle, ✕ Volver…) va donde ningún panel de la Mesa la tape: se prueba de abajo
  // hacia arriba, en el centro de la carta y un poco a los costados, con elementFromPoint (si en esos puntos lo que
  // está encima es el 3D, está libre). Antes iba fija abajo y el tablero del plan de barreras la tapaba entera.
  function ubicarBarra(g, forzar) {
    if (!g || g3d !== g || !g.marco.contentWindow) return
    const r = g.marco.getBoundingClientRect()
    if (r.width < 160 || r.height < 120) return
    const ancho = Math.min(g.barra ? g.barra.ancho : 640, r.width - 16)
    const alto = (g.barra ? g.barra.alto : 34) + 22 // y la atribución de Google, debajo
    const libre = (cx, y) => {
      for (const fy of [1, alto / 2, alto - 1]) {
        for (const fx of [-0.5, -0.25, 0, 0.25, 0.5]) {
          const x = cx + fx * (ancho - 4)
          if (document.elementFromPoint(x, y + fy) !== g.marco) return false
        }
      }
      return true
    }
    const ya = g.lugar
    const medio = ancho / 2 + 6
    const centros = [0.5, 0.4, 0.6, 0.3, 0.7].map((f) => Math.min(r.right - medio, Math.max(r.left + medio, r.left + r.width * f)))
    if (!forzar && ya && ya.tapada && Date.now() - ya.tapada < 4000) return
    // Lo más abajo que se pueda (al centro, si no un poco a un costado). Si se cerró un tablero, baja; si se abrió
    // uno encima, sube.
    let lugar = null
    for (let y = r.bottom - alto - 6; y >= r.top + 6 && !lugar; y -= 12) {
      for (const cx of centros) {
        if (libre(cx, y)) {
          lugar = { cx: Math.round(cx - r.left), y: Math.round(y - r.top) }
          break
        }
      }
    }
    // Todo tapado: arriba al centro (y se vuelve a probar en unos segundos).
    if (!lugar) lugar = { cx: Math.round(r.width / 2), y: 6, tapada: Date.now() }
    if (ya && ya.cx === lugar.cx && ya.y === lugar.y) return (g.lugar = lugar)
    g.lugar = lugar
    g.marco.contentWindow.postMessage({ sid3d: 'lugar', cx: lugar.cx, y: lugar.y }, destino())
  }

  function cerrar3D() {
    if (!g3d) return
    const g = g3d
    g3d = null
    clearInterval(g.reloj)
    clearInterval(g.relojBarra)
    clearTimeout(g.espera)
    document.removeEventListener('change', g.alCambiar, true)
    document.removeEventListener('click', g.alClic, true)
    document.removeEventListener('input', g.alRelieve, true)
    window.removeEventListener('resize', g.alTamano)
    window.removeEventListener('message', g.alMensaje)
    for (const el of g.ocultos) el.style.visibility = ''
    if (window.__mapa2d && window.__mapa2d.off) window.__mapa2d.off('layeradd layerremove', g.alCapa)
    g.caja.remove()
    document.documentElement.classList.remove('sid-g3d-abierto')
    const sel = document.querySelector('select.sid-base')
    if (sel && sel.value === 'g3d' && g.base) sel.value = g.base
  }

  // La pestaña aparte de antes: sólo si no hay carta donde ponerlo.
  function abrirPestana3D(v) {
    const url = new URL('google-mapas/v1/3d.html', location.href.replace(/[^/]*$/, ''))
    url.hash = `${v.lat.toFixed(5)},${v.lng.toFixed(5)},${v.zoom.toFixed(1)}`
    window.open(url.toString(), '_blank', 'noopener')
  }

  // 🏙️ Google 3D sobre la carta, donde se está mirando y con el calco.
  function abrir3D() {
    const v = vista || { lat: -16.5, lng: -68.15, zoom: 12 }
    if (g3d) return enviarCalco(true)
    const mapa = window.__mapa2d
    const contenedor = mapa && mapa.getContainer && mapa.getContainer() && mapa.getContainer().parentElement
    if (!contenedor) return abrirPestana3D(v)
    estilos3D()
    const caja = document.createElement('div')
    caja.className = 'sid-g3d'
    // Encima de la carta 2D y del ⛰️ 3D, debajo de los paneles de la Mesa (z-index 1000 y más).
    caja.style.cssText = 'position:absolute;inset:0;z-index:999;background:#0a0e13'
    const marco = document.createElement('iframe')
    marco.title = 'Google 3D con el calco'
    marco.setAttribute('allow', 'fullscreen')
    marco.style.cssText = 'border:0;width:100%;height:100%;display:block'
    const url = new URL('google-mapas/v1/3d.html', location.href.replace(/[^/]*$/, ''))
    url.search = '?embebido=1&v=20261023-claro' // el ?v= para que el navegador no use un 3d.html viejo
    url.hash = `${v.lat.toFixed(5)},${v.lng.toFixed(5)},${v.zoom.toFixed(1)}`
    marco.src = url.toString()
    caja.appendChild(marco)
    contenedor.appendChild(caja)
    document.documentElement.classList.add('sid-g3d-abierto')
    // Las cartas de abajo (la 2D y la del ⛰️ 3D) no se ven mientras está el 3D: se ocultan para que el navegador no
    // las siga pintando (más fluido). Al cerrar vuelven.
    const ocultos = Array.from(contenedor.querySelectorAll('.leaflet-map-pane, .maplibregl-canvas')).filter((el) => !caja.contains(el) && !el.style.visibility)
    for (const el of ocultos) el.style.visibility = 'hidden'

    const g = (g3d = { caja, marco, base: '', ocultos })
    g.alMensaje = (e) => {
      if (!g3d || e.source !== marco.contentWindow || !e.data) return
      if (e.data.sid3d === 'listo' || e.data.sid3d === 'pedirCalco') {
        enviarCalco(true)
        if (e.data.sid3d === 'listo') mandarRelieve(relieveDeLaMesa())
      } else if (e.data.sid3d === 'cerrar') cerrar3D()
      else if (e.data.sid3d === 'barra') {
        g.barra = { ancho: Number(e.data.ancho) || 640, alto: Number(e.data.alto) || 34 }
        ubicarBarra(g, true)
      }
    }
    window.addEventListener('message', g.alMensaje)
    g.alRelieve = (e) => {
      const t = e.target
      if (t && t.matches && t.matches('label.m3d-des input[type=range]')) mandarRelieve(relieveDeLaMesa(t))
    }
    document.addEventListener('input', g.alRelieve, true)
    // Los paneles de la Mesa se abren, se cierran y se agrandan: cada tanto se mira si la barra sigue a la vista.
    g.relojBarra = setInterval(() => ubicarBarra(g), 1200)
    g.alTamano = () => ubicarBarra(g, true)
    window.addEventListener('resize', g.alTamano)
    // Lo que se prende, apaga o se vuelve a dibujar en la carta llega al 3D.
    g.alCapa = () => {
      clearTimeout(g.espera)
      g.espera = setTimeout(() => enviarCalco(false), 700)
    }
    if (mapa.on) mapa.on('layeradd layerremove', g.alCapa)
    // El selector muestra «🏙️ 3D realista» mientras se ve el 3D (React lo vuelve a poner en el mapa base en cada
    // dibujo); elegir otro mapa base, o 🗺️ 2D / ⛰️ 3D, vuelve a la carta.
    g.reloj = setInterval(() => {
      const sel = document.querySelector('select.sid-base')
      if (!sel || sel.value === 'g3d') return
      if (!g.base) g.base = sel.value
      sel.value = 'g3d'
    }, 250)
    g.alCambiar = (e) => {
      if (e.target && e.target.matches && e.target.matches('select.sid-base') && e.target.value !== 'g3d') cerrar3D()
    }
    g.alClic = (e) => {
      if (e.target && e.target.closest && e.target.closest('.m3d-seg button')) cerrar3D()
    }
    document.addEventListener('change', g.alCambiar, true)
    document.addEventListener('click', g.alClic, true)
  }

  window.SIDGoogle = { CLAVE, TIPOS, leaflet, maplibre, opciones, seguir, abrir3D, cerrar3D, calcoDeLaCarta, esGoogle, vista: () => vista, abierto3D: () => !!g3d, enviados3D: () => (g3d ? g3d.enviados || 0 : 0) }
})()
