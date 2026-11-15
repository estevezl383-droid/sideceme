// Límites de espera y copia de texto. No llama a servicios de IA ni guarda ejercicios.
export function conLimite(tarea, { ms = 30000, mensaje = 'La preparación tardó demasiado. Comprueba tu conexión y vuelve a intentarlo.' } = {}) {
  return new Promise((resolve, reject) => {
    const reloj = setTimeout(() => reject(new Error(mensaje)), ms)
    let resultado
    try { resultado = tarea() } catch (e) { clearTimeout(reloj); reject(e); return }
    Promise.resolve(resultado).then(resolve, reject).finally(() => clearTimeout(reloj))
  })
}

// ============================================================
// 2026-11-15 — EL RECORTE DE CAPAS ESPERA SU TURNO (clase entera a la vez).
// Cuando toda la clase aprieta «Generar calcos» en el mismo minuto, el servidor
// (`calcos-datos` v5) atiende de a CINCO y a los demás los hace esperar hasta 90 s;
// además la respuesta pesa de 0,2 a 10 MB según la zona. Con el límite general de
// 20 s, del sexto alumno en adelante la Mesa cortaba el pedido y mostraba «no
// respondieron a tiempo», mientras el servidor seguía trabajando para nadie. Eso
// es lo que se vio en clase: «sólo funcionó para 5 u 8».
// Acá el recorte tiene su propio límite (5 min en total) y, si el servidor contesta
// «ocupado» (503, codigo:'ocupado'), se vuelve a pedir solo hasta 3 veces, con una
// pausa que lleva azar para que los que esperan no golpeen todos juntos.
// Los demás pedidos (censo, archivos) siguen con sus 20 s de siempre.
// ============================================================
export const RECORTE_LIMITE_MS = 300000
export const RECORTE_REINTENTOS = 3
export const RECORTE_PAUSA_MS = [8000, 15000]
export function esRecorte(url, opciones) {
  try { return String(url).includes('/calcos-datos') && String(opciones?.body || '').includes('"recortar"') } catch { return false }
}

export async function leerJSON(url, opciones = {}, { ms, fetcher = globalThis.fetch, pausa = (t) => new Promise((r) => setTimeout(r, t)) } = {}) {
  const recorte = esRecorte(url, opciones)
  if (ms == null) ms = recorte ? RECORTE_LIMITE_MS : 20000
  const controlador = new AbortController()
  const externo = opciones.signal
  const abortar = () => controlador.abort()
  if (externo?.aborted) abortar()
  else externo?.addEventListener('abort', abortar, { once: true })
  try {
    return await conLimite(async () => {
      for (let intento = 0; ; intento++) {
        const r = await fetcher(url, { ...opciones, signal: controlador.signal })
        let j
        try { j = await r.json() } catch { throw new Error(`El servidor respondió con datos no válidos (${r.status}).`) }
        if (r.ok) return j
        const ocupado = recorte && r.status === 503 && j?.codigo === 'ocupado'
        if (ocupado && intento < RECORTE_REINTENTOS && !controlador.signal.aborted) {
          await pausa(RECORTE_PAUSA_MS[0] + Math.random() * (RECORTE_PAUSA_MS[1] - RECORTE_PAUSA_MS[0]))
          continue
        }
        throw new Error(j?.error || `No se pudieron cargar los datos (${r.status}).`)
      }
    }, { ms, mensaje: 'Los datos del terreno no respondieron a tiempo. Comprueba tu conexión y vuelve a intentarlo.' })
  } finally {
    controlador.abort()
    externo?.removeEventListener('abort', abortar)
  }
}

export async function copiarTexto(texto) {
  const valor = String(texto ?? '')
  try {
    if (!globalThis.navigator?.clipboard?.writeText) throw new Error('portapapeles no disponible')
    await conLimite(() => navigator.clipboard.writeText(valor), { ms: 3000, mensaje: 'El portapapeles no respondió.' })
    return
  } catch {}
  const d = globalThis.document
  if (!d?.body) throw new Error('No se pudo copiar el texto.')
  const anterior = d.activeElement
  const ta = d.createElement('textarea')
  ta.value = valor
  ta.setAttribute('readonly', '')
  ta.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none'
  d.body.appendChild(ta)
  try {
    ta.focus({ preventScroll: true }); ta.select(); ta.setSelectionRange(0, valor.length)
    if (!d.execCommand?.('copy')) throw new Error('El navegador bloqueó la copia. Selecciona el texto preparado y cópialo manualmente, o descarga el pedido.')
  } finally {
    ta.remove()
    anterior?.focus?.({ preventScroll: true })
  }
}
