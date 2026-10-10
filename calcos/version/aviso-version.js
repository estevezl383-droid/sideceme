/*
 * 🔄 Aviso de versión nueva de la Mesa del EM.
 *
 * Lo pidió Sergio sin saberlo (10-10-2026): el arreglo del pedido a la IA se publicó a las
 * 20:55 y a las 21:53 su Mesa seguía armando el pedido VIEJO — la pestaña estaba abierta desde
 * antes y el navegador no vuelve a bajar el programa hasta que se recarga. Gemini contestó otra
 * vez «se cortó… indique cuál es el producto», y parecía que el arreglo no servía.
 *
 * Qué hace: cada 5 minutos y cada vez que se vuelve a la pestaña (como mucho una vez por
 * minuto) baja calcos/index.html sin caché y compara sus <script src> con los que cargó esta
 * pestaña. Si cambiaron —se publicó un compilado o un módulo con otra versión—, muestra una
 * franja arriba: «Hay una versión nueva de la Mesa… Recargar ahora / Más tarde». Recargar
 * espera a que el ejercicio termine de guardarse («💾 guardando…», el autoguardado de la Mesa).
 *
 * Código aparte del compilado. No toca el ejercicio ni guarda nada. Si algo falla (sin red,
 * file:// de la app de escritorio), no hace nada y la Mesa sigue igual.
 */
(function () {
  'use strict'
  if (location.protocol === 'file:') return

  var CADA = 5 * 60 * 1000
  var MINIMO = 60 * 1000
  var POSPONER = 30 * 60 * 1000
  var ultimaRevision = 0
  var pospuestoHasta = 0
  var franja = null

  // Los <script src> de un index.html, tal cual están escritos (con su ?v=).
  function firma(html) {
    var re = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi
    var out = []
    var m
    while ((m = re.exec(String(html || '')))) out.push(m[1])
    return out.sort().join('\n')
  }
  // Los de ESTA pestaña: los que trajo su index.html (el compilado todavía no agregó ninguno:
  // este script es «defer» y corre cuando el HTML terminó de leerse).
  var cargada = firma(
    Array.prototype.map
      .call(document.querySelectorAll('script[src]'), function (s) {
        return '<script src="' + s.getAttribute('src') + '">'
      })
      .join('\n'),
  )

  // El sello del autoguardado (guardado/v1/autoguardado.mjs) dice su estado en data-estado.
  // Con cambios pendientes, tocarlo los guarda ya; recargar espera a que termine.
  function guardando() {
    var s = document.querySelector('.sello-guardado')
    if (!s) return false
    var e = s.getAttribute('data-estado')
    if (e === 'pendiente') {
      s.click()
      return true
    }
    return e === 'guardando' || /guardando/i.test(s.textContent || '')
  }

  function recargar(boton) {
    var vueltas = 0
    ;(function esperar() {
      if (guardando() && vueltas++ < 40) {
        if (boton) boton.textContent = 'Guardando el ejercicio…'
        return setTimeout(esperar, 250)
      }
      location.reload()
    })()
  }

  function mostrar() {
    if (franja || Date.now() < pospuestoHasta) return
    franja = document.createElement('div')
    franja.className = 'sid-aviso-version'
    franja.setAttribute('role', 'alert')
    franja.innerHTML =
      '<div class="sid-av-texto"><b>🔄 Hay una versión nueva de la Mesa.</b> Esta pestaña sigue con la anterior: ' +
      'los arreglos publicados no te llegan hasta que recargues. El ejercicio se guarda solo.</div>' +
      '<div class="sid-av-botones"><button type="button" class="sid-av-recargar">Recargar ahora</button>' +
      '<button type="button" class="sid-av-luego">Más tarde</button></div>'
    var css = document.createElement('style')
    css.textContent =
      '.sid-aviso-version{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:2147483000;' +
      'width:calc(100% - 24px);max-width:560px;box-sizing:border-box;display:flex;flex-wrap:wrap;gap:8px 12px;' +
      'align-items:center;padding:10px 14px;border-radius:10px;border:1px solid #f0b429;' +
      'background:rgba(10,18,36,.96);color:#e8eef9;font:13px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;' +
      'box-shadow:0 6px 24px rgba(0,0,0,.45)}' +
      '.sid-av-texto{flex:1 1 260px}.sid-av-texto b{color:#ffd56b}' +
      '.sid-av-botones{display:flex;gap:8px;flex:0 0 auto}' +
      '.sid-aviso-version button{font:600 13px system-ui,sans-serif;border-radius:7px;padding:7px 12px;cursor:pointer}' +
      '.sid-av-recargar{background:#f0b429;color:#1a1300;border:0}' +
      '.sid-av-luego{background:transparent;color:#c9d4e6;border:1px solid #4a5a78}'
    franja.appendChild(css)
    franja.querySelector('.sid-av-recargar').onclick = function () {
      recargar(this)
    }
    franja.querySelector('.sid-av-luego').onclick = function () {
      pospuestoHasta = Date.now() + POSPONER
      franja.remove()
      franja = null
    }
    document.body.appendChild(franja)
  }

  function revisar(forzar) {
    var ahora = Date.now()
    if (!forzar && ahora - ultimaRevision < MINIMO) return Promise.resolve(null)
    ultimaRevision = ahora
    var url = new URL('index.html', location.href)
    url.searchParams.set('_', String(ahora))
    return fetch(url.href, { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.text() : null
      })
      .then(function (html) {
        var nueva = html && firma(html)
        // un index.html sin scripts (una página de error del servidor) no cuenta
        var cambio = !!nueva && nueva !== cargada
        if (cambio) mostrar()
        return cambio
      })
      .catch(function () {
        return null
      })
  }

  setInterval(revisar, CADA)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') revisar()
  })
  window.addEventListener('focus', function () {
    revisar()
  })
  // para las pruebas
  window.SIDAvisoVersion = { firma: firma, cargada: cargada, revisar: revisar }
})()
