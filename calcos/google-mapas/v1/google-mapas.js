// 🛰️ Imágenes de Google en la Mesa del EM (Map Tiles API de Google Maps Platform).
//
// Lo pidió Sergio (23-10-2026): «quiero usar esas imágenes… en 3D y 2D con relieve, para mis ejercicios
// académicos». La Mesa dibuja con Leaflet (carta 2D) y MapLibre (⛰️ 3D con el relieve SRTM); este módulo
// les da los cuadritos (tiles) de Google como un mapa base más, junto al satélite de Esri y al mapa de OSM:
//   · 🛰️ Google Satélite, 🛰️ Google Satélite con nombres y ⛰️ Google Relieve (relieve sombreado con rutas);
//   · el ⛰️ 3D de la Mesa pone la imagen elegida sobre el relieve, igual que con Esri;
//   · 🏙️ 3D realista (última opción de Google en el selector) abre el lugar que se está mirando en el 3D
//     realista de Google (google-mapas/v1/3d.html).
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
  // g3d no es un mapa base: elegirlo abre 🏙️ Google 3D en otra pestaña y el selector queda como estaba.
  const GRUPOS = [
    { grupo: 'Google', opciones: [{ id: 'gsat' }, { id: 'ghib' }, { id: 'gter' }, { id: 'g3d', nombre: '🏙️ 3D realista ↗', titulo: 'Abre el 3D realista de Google en otra pestaña' }] },
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

  function opciones() {
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

  // 🏙️ Google 3D: el 3D realista de Google en otra pestaña, donde se está mirando.
  function abrir3D() {
    const v = vista || { lat: -16.5, lng: -68.15, zoom: 12 }
    const url = new URL('google-mapas/v1/3d.html', location.href.replace(/[^/]*$/, ''))
    url.hash = `${v.lat.toFixed(5)},${v.lng.toFixed(5)},${v.zoom.toFixed(1)}`
    window.open(url.toString(), '_blank', 'noopener')
  }

  window.SIDGoogle = { CLAVE, TIPOS, leaflet, maplibre, opciones, seguir, abrir3D, esGoogle, vista: () => vista }
})()
