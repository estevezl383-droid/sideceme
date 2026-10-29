/* La clave sólo viene en el fragmento del enlace; no se envía al servidor. */
(() => {
  'use strict'
  const estado = document.getElementById('estado')
  const descargar = document.getElementById('descargar')
  const instrucciones = document.getElementById('instrucciones')
  const partes = /^#v1\.([a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/.exec(location.hash)

  async function preparar() {
    if (!partes) {
      estado.textContent = 'Abre el enlace completo de recuperación que recibiste en el chat. Esta página necesita la clave incluida al final del enlace.'
      return
    }
    if (!window.isSecureContext || !window.crypto?.subtle) {
      estado.textContent = 'Abre este enlace con HTTPS en una versión reciente de Chrome, Edge, Firefox o Safari.'
      return
    }
    const [, id, secreto] = partes
    try {
      const datosClave = Uint8Array.from(atob(secreto.replace(/-/g, '+').replace(/_/g, '/') + '='), c => c.charCodeAt(0))
      const clave = await crypto.subtle.importKey('raw', datosClave, 'AES-GCM', false, ['decrypt'])
      const respuesta = await fetch(`./archivos/${id}.bin`, { credentials: 'omit', referrerPolicy: 'no-referrer' })
      if (!respuesta.ok) throw new Error('archivo no disponible')
      const paquete = new Uint8Array(await respuesta.arrayBuffer())
      if (paquete.length < 29) throw new Error('archivo incompleto')
      const contenido = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: paquete.slice(0, 12), additionalData: new TextEncoder().encode(id) }, clave, paquete.slice(12))
      const ejercicio = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(contenido))
      if (!ejercicio || typeof ejercicio !== 'object' || !ejercicio.g3 || !Array.isArray(ejercicio.fasesCOA?.propio)) throw new Error('ejercicio no válido')
      const url = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }))
      descargar.href = url
      descargar.hidden = false
      instrucciones.hidden = false
      estado.textContent = 'Archivo listo. Pulsa el botón para guardarlo en tu equipo.'
      descargar.addEventListener('click', () => {
        estado.textContent = 'Descarga solicitada. Busca EJERCICIO_RECUPERADO_G3.json en tus descargas; si tu navegador pregunta, elige Guardar.'
      })
    } catch {
      estado.textContent = 'No se pudo preparar la descarga. Vuelve a abrir el enlace completo del chat y comprueba tu conexión.'
    }
  }
  preparar()
})()
