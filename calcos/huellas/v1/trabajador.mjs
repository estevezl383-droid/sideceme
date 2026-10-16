// 🛤️ Huellas y sendas: el Web Worker. Descarga, lee el JSON de Overpass y
// recorta FUERA del hilo de la página, así la Mesa no se traba aunque el área
// sea grande. Le habla a huellas-osm.mjs con { tipo: 'aviso' | 'listo' | 'error' }.
import { traer } from './nucleo.mjs?v=huellas20261016'

self.onmessage = async ({ data }) => {
  const aviso = (texto) => self.postMessage({ tipo: 'aviso', texto })
  aviso('🛤️ Consultando OpenStreetMap…')
  try {
    const resultado = await traer(data.aoi, { aviso, limites: data.limites })
    self.postMessage({ tipo: 'listo', resultado })
  } catch (e) {
    self.postMessage({ tipo: 'error', mensaje: String(e?.message || e), definitivo: !!e?.definitivo })
  }
}
