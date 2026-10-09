/* Capas que pertenecen a una sección (piel «Pandora»):
   · Posiciones defensivas → G-3 Operaciones
   · Logística            → G-4 Logística
   En «Qué se ve en el calco» esas dos filas se esconden (sólo con la piel Pandora) y cada una
   queda en un menú chico pegado a su botón de la derecha. La casilla del menú es el mismo
   botón de siempre: al tocarla se hace clic en la fila original, así que no cambia nada de lo que
   hace la Mesa. En «Vista clásica» las filas vuelven a verse donde estaban. */
(function () {
  'use strict'
  var CAPAS = [
    { g: 'g3', i: 5, re: /Posiciones defensivas/i, etiqueta: 'Posiciones defensivas' },
    { g: 'g4', i: 6, re: /^\W*Log[ií]stica/i, etiqueta: 'Logística' }
  ]
  var nodos = {}, abierta = null, firma = ''

  function chip(re) {
    var cs = document.querySelectorAll('.bloque-ver .ver-chip')
    for (var i = 0; i < cs.length; i++) if (re.test((cs[i].textContent || '').trim())) return cs[i]
    return null
  }
  function contador(c) {
    var n = c && c.querySelector('.ver-chip-n, .ver-n, b')
    var t = n ? (n.textContent || '').trim() : ''
    return /^\d+$/.test(t) ? t : ''
  }
  function marcar() { // las filas originales se marcan para que el CSS las esconda
    CAPAS.forEach(function (k) {
      var c = chip(k.re)
      if (c && c.getAttribute('data-sid-capa') !== k.g) c.setAttribute('data-sid-capa', k.g)
    })
  }
  function crear() {
    CAPAS.forEach(function (k) {
      if (nodos[k.g]) return
      var n = document.createElement('div')
      n.className = 'sid-pd-cap'
      n.setAttribute('data-i', k.i)
      n.innerHTML = '<button type="button" class="tg" aria-expanded="false" aria-label="Capa de ' + k.etiqueta + '" title="' + k.etiqueta + '">▾</button>' +
        '<label class="pop" hidden><input type="checkbox"><span></span><b></b></label>'
      document.body.appendChild(n)
      n.querySelector('.tg').addEventListener('click', function () {
        abierta = abierta === k.g ? null : k.g
        pintar(true)
      })
      n.querySelector('input').addEventListener('click', function (e) {
        e.stopPropagation()
        var c = chip(k.re)
        if (c) c.click()
      })
      nodos[k.g] = n
    })
  }
  function firmaActual() {
    return CAPAS.map(function (k) {
      var c = chip(k.re)
      return (c ? (/\bon\b/.test(c.className) ? 1 : 0) + contador(c) : 'x')
    }).join('|') + '|' + abierta
  }
  function pintar(forzar) {
    var f = firmaActual()
    if (!forzar && f === firma) return
    firma = f
    CAPAS.forEach(function (k) {
      var n = nodos[k.g]
      if (!n) return
      var c = chip(k.re)
      var tg = n.querySelector('.tg'), pop = n.querySelector('.pop')
      var on = !!(c && /\bon\b/.test(c.className))
      n.classList.toggle('on', on)
      n.classList.toggle('sin', !c)
      tg.setAttribute('aria-expanded', abierta === k.g)
      pop.hidden = abierta !== k.g
      pop.querySelector('input').checked = on
      pop.querySelector('input').disabled = !c
      pop.querySelector('span').textContent = k.etiqueta
      pop.querySelector('b').textContent = contador(c)
    })
  }
  var pend = false
  function revisar() {
    if (pend) return
    pend = true
    requestAnimationFrame(function () { pend = false; marcar(); crear(); pintar(false) })
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierta) { abierta = null; pintar(true) } })
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var t = ms[i].target
      var propio = t.closest && t.closest('.sid-pd-cap')
      if (!propio) { revisar(); return }
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  revisar()
})()
