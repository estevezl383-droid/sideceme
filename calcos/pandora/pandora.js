/* Piel «Pandora» de la pantalla de calcos.
   No toca el compilado ni mueve nodos de React: sólo agrega atributos data-* a los botones
   (para que el CSS los reparta), un fondo decorativo a la derecha y el interruptor
   «Vista clásica». Se puede apagar: quita la clase sid-pandora del <body>. */
(function () {
  'use strict'
  var CLAVE = 'sid_pandora_off'
  var body = document.body

  function apagada() {
    try { return localStorage.getItem(CLAVE) === '1' } catch (e) { return false }
  }
  function aplicar(on) {
    body.classList.toggle('sid-pandora', on)
    var sw = document.getElementById('sid-pd-sw')
    if (sw) sw.textContent = on ? '◐ Vista clásica' : '◑ Vista Pandora'
    // el mapa cambia de ancho: avisa a Leaflet
    setTimeout(function () { window.dispatchEvent(new Event('resize')) }, 50)
  }

  // Interruptor y fondo decorativo (viven fuera del árbol de React)
  var sw = document.createElement('button')
  sw.id = 'sid-pd-sw'
  sw.type = 'button'
  sw.title = 'Alternar entre la vista nueva y la de siempre'
  sw.addEventListener('click', function () {
    var on = !body.classList.contains('sid-pandora')
    try { localStorage.setItem(CLAVE, on ? '0' : '1') } catch (e) {}
    aplicar(on)
  })
  document.body.appendChild(sw)
  var der = document.createElement('div')
  der.id = 'sid-pd-der'
  der.setAttribute('aria-hidden', 'true')
  document.body.appendChild(der)

  // Reparto de botones por grupo (por el texto, sin tocar los nodos)
  var MANDO = [/^\W*CMTE\./i, /^\W*JEM\./i, /^\W*EME\./i, /G-1/i, /G-2/i, /G-3/i, /G-4/i, /G-5/i]
  var HERR = /deshacer|limpiar|ejercicio|regla|bajar kmz|complementar/i
  var DIBUJO = /área de ops|área de interés|á\. influencia|a\.i\.n/i

  function clasificar() {
    var cont = document.querySelector('.botones-mapa')
    if (!cont) return
    var btns = cont.querySelectorAll(':scope > button')
    var vistos = {}
    btns.forEach(function (b) {
      var t = (b.textContent || '').trim()
      var g = 'paneles', idx = -1
      for (var i = 0; i < MANDO.length; i++) { if (MANDO[i].test(t)) { idx = i; break } }
      if (idx >= 0) g = 'mando'
      else if (HERR.test(t)) g = 'herr'
      else if (DIBUJO.test(t)) g = 'dibujo'
      if (b.getAttribute('data-sid-g') !== g) b.setAttribute('data-sid-g', g)
      if (g === 'mando' && b.getAttribute('data-sid-i') !== String(idx)) b.setAttribute('data-sid-i', String(idx))
      // el primer botón de cada grupo lleva un separador
      var p = (g !== 'mando' && !vistos[g]) ? '1' : '0'
      vistos[g] = true
      if (b.getAttribute('data-sid-p') !== p) b.setAttribute('data-sid-p', p)
    })
  }

  var pendiente = false
  function programar() {
    if (pendiente) return
    pendiente = true
    requestAnimationFrame(function () { pendiente = false; clasificar() })
  }
  new MutationObserver(programar).observe(document.body, { childList: true, subtree: true })

  // El tablero de abajo (Mesa · Preparación) empieza recogido: se abre con su botón cuando se necesita.
  function recogerMesa() {
    try { if (sessionStorage.getItem('sid_pd_mesa') === '1') return } catch (e) { return }
    if (!body.classList.contains('sid-pandora')) return
    var m = document.querySelector('.contenedor-mapa')
    if (!m) return
    var bs = m.querySelectorAll('button')
    for (var i = 0; i < bs.length; i++) {
      if (/ocultar/i.test(bs[i].textContent || '')) {
        try { sessionStorage.setItem('sid_pd_mesa', '1') } catch (e) {}
        bs[i].click()
        return
      }
    }
  }
  new MutationObserver(function () { recogerMesa() }).observe(document.body, { childList: true, subtree: true })

  aplicar(!apagada())
  programar()
})()
