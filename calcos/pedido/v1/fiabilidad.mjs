// Límites de espera y copia de texto. No llama a servicios de IA ni guarda ejercicios.
export function conLimite(tarea, { ms = 30000, mensaje = 'La preparación tardó demasiado. Comprueba tu conexión y vuelve a intentarlo.' } = {}) {
  return new Promise((resolve, reject) => {
    const reloj = setTimeout(() => reject(new Error(mensaje)), ms)
    let resultado
    try { resultado = tarea() } catch (e) { clearTimeout(reloj); reject(e); return }
    Promise.resolve(resultado).then(resolve, reject).finally(() => clearTimeout(reloj))
  })
}

export async function leerJSON(url, opciones = {}, { ms = 20000, fetcher = globalThis.fetch } = {}) {
  const controlador = new AbortController()
  const externo = opciones.signal
  const abortar = () => controlador.abort()
  if (externo?.aborted) abortar()
  else externo?.addEventListener('abort', abortar, { once: true })
  try {
    return await conLimite(async () => {
      const r = await fetcher(url, { ...opciones, signal: controlador.signal })
      let j
      try { j = await r.json() } catch { throw new Error(`El servidor respondió con datos no válidos (${r.status}).`) }
      if (!r.ok) throw new Error(j?.error || `No se pudieron cargar los datos (${r.status}).`)
      return j
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
