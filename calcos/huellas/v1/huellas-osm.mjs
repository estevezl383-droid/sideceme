// 🛤️ Huellas y sendas (OSM al día — Vía 3/4) para la Mesa del EM.
//
// Reemplaza a assets/huellasOSM-B2eaicIK.js (el compilado lo importa; ver
// calcos/huellas/README.md y CAMBIOS-EN-EL-COMPILADO.md). Lo que cambia:
//   · el trabajo pesado (descargar, leer el JSON y recortar) va en un Web
//     Worker: la página no se traba aunque OSM traiga decenas de miles de caminos;
//   · nunca espera para siempre: cada servidor y el total tienen tiempo máximo;
//   · lo que entrega ya está recortado al Área de Interés (`_recortada`), así la
//     Mesa no lo vuelve a recortar en su hilo, y con un tope de caminos;
//   · no tira errores: si OSM no contesta devuelve la capa vacía con `_aviso`
//     (lo que se le muestra al usuario) y `_reintentar` (no guardarla en la caché);
//   · la misma área no se pide dos veces (la Mesa la pide al prender la capa y
//     al generar el calco).
import { clasificarVia, traer, LIMITES } from './nucleo.mjs?v=huellas20261016'

export { clasificarVia }

const V = 'huellas20261016'
const VIGENCIA_MS = 30 * 60 * 1000
const CACHE_MAX = 4

// Avisos de progreso: los de cada pedido y los que se suscriban (la Mesa los
// muestra en el botón de ⚡ GENERAR CALCOS y en el del CMOC).
const oyentes = new Set()
export function alAvisar(fn) {
  if (typeof fn !== 'function') return () => {}
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}
let ultAviso = 0
function avisar(texto, forzar = false) {
  const t = Date.now()
  if (!forzar && t - ultAviso < 250) return
  ultAviso = t
  for (const fn of [...oyentes]) {
    try {
      fn(texto)
    } catch {}
  }
}

// Las pruebas achican los tiempos con window.SIDECEME_HUELLAS_LIMITES.
const limites = () => ({ ...LIMITES, ...(globalThis.SIDECEME_HUELLAS_LIMITES || {}) })
const miles = (x) => Math.round(x).toLocaleString('es-BO')

// null: el worker no arrancó (navegador viejo, file://…) y se hace en la página.
function enTrabajador(aoi, lim) {
  if (typeof Worker !== 'function') return Promise.resolve(null)
  let w
  try {
    w = new Worker(new URL(`./trabajador.mjs?v=${V}`, import.meta.url), { type: 'module' })
  } catch {
    return Promise.resolve(null)
  }
  return new Promise((ok, mal) => {
    let hablo = false
    let reloj = null
    const fin = (fn, v) => {
      clearTimeout(reloj)
      try {
        w.terminate()
      } catch {}
      fn(v)
    }
    // Red de seguridad: el worker avisa algo cada segundo mientras espera a OSM
    // y seguido mientras descarga o recorta; si se calla tanto tiempo, se corta.
    const vigilar = () => {
      clearTimeout(reloj)
      reloj = setTimeout(() => fin(mal, new Error('el procesamiento de las huellas dejó de responder')), Math.max(lim.esperaServidorMs, lim.esperaSinDatosMs) + 30000)
    }
    vigilar()
    w.onmessage = ({ data }) => {
      hablo = true
      vigilar()
      if (data?.tipo === 'aviso') avisar(data.texto)
      else if (data?.tipo === 'listo') fin(ok, data.resultado)
      else if (data?.tipo === 'error') {
        const e = new Error(data.mensaje)
        e.definitivo = data.definitivo
        fin(mal, e)
      }
    }
    w.onerror = (ev) => {
      ev?.preventDefault?.()
      if (!hablo) fin(ok, null)
      else fin(mal, new Error(ev?.message || 'falló el procesamiento de las huellas'))
    }
    try {
      // Una copia en JSON: el área puede venir con algo que no se clona.
      w.postMessage({ aoi: JSON.parse(JSON.stringify(aoi)), limites: { ...lim, tramoMs: 250 } })
    } catch {
      fin(ok, null)
    }
  })
}

const enPagina = (aoi, lim) => traer(aoi, { aviso: avisar, limites: lim, ceder: () => new Promise((r) => setTimeout(r, 0)) })

async function buscar(aoi) {
  const lim = limites()
  try {
    const r = (await enTrabajador(aoi, lim)) || (await enPagina(aoi, lim))
    const fc = { type: 'FeatureCollection', features: r.features }
    if (r.recortada) fc._recortada = true
    const n = r.features.length
    const notas = []
    if (r.topado) notas.push(`el área es grande y OSM tiene más caminos de los que la Mesa puede dibujar sin trabarse: van ${miles(n)} (primero las Vía 3 y las huellas, los más largos). Achicá el área para verlos todos`)
    else if (n < r.total) notas.push(`van los ${miles(n)} caminos más importantes de ${miles(r.total)} (primero las Vía 3 y las huellas, los más largos), para no trabar la Mesa. Achicá el área para verlos todos`)
    if (r.parcial) notas.push('OSM cortó la consulta antes de terminar y pueden faltar caminos')
    if (notas.length) fc._aviso = `Huellas y sendas: ${notas.join('; ')}.`
    avisar(`🛤️ ${miles(n)} caminos traídos de OSM`, true)
    return fc
  } catch (e) {
    const msg = String(e?.message || e)
    console.warn('Huellas y sendas de OSM no disponibles:', msg)
    avisar(`🛤️ Sin huellas de OSM (${msg})`, true)
    return {
      type: 'FeatureCollection',
      features: [],
      _aviso: e?.definitivo
        ? `Huellas y sendas: ${msg}.`
        : `Huellas y sendas: no se pudieron traer de OpenStreetMap (${msg}). El calco sale sin ellas (si estás sin internet, con los caminos precargados); se puede volver a generar en un rato.`,
      _reintentar: !e?.definitivo,
    }
  }
}

const cache = new Map()
const claveDe = (aoi) => {
  try {
    return JSON.stringify(aoi?.type === 'Feature' ? aoi.geometry : aoi)
  } catch {
    return null
  }
}

// Las huellas y sendas de OSM dentro del área (FeatureCollection). No tira errores.
// `aviso(texto)`: el progreso de ESTE pedido (además de los suscriptos con alAvisar).
export function traerHuellas(aoi, aviso) {
  const clave = claveDe(aoi)
  let e = clave ? cache.get(clave) : null
  if (!e || Date.now() - e.hora > VIGENCIA_MS) {
    e = { hora: Date.now(), promesa: buscar(aoi) }
    if (clave) {
      cache.delete(clave)
      cache.set(clave, e)
      while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value)
      e.promesa.then((fc) => fc._reintentar && cache.get(clave) === e && cache.delete(clave))
    }
  }
  const soltar = alAvisar(aviso)
  return e.promesa.then((fc) => {
    soltar()
    return { ...fc, features: fc.features.slice() }
  })
}
