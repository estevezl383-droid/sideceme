/* Tablero 6 · Fichas propias / Fichas enemigas (piel «Pandora»).
   Panel inferior que se despliega cuando hace falta. Reúne en un solo lugar el acceso a lo que la
   Mesa ya tiene (Unidades, Tareas, C.A. por fases, Plan de fuegos, Plan de barreras…): cada pestaña
   abre el panel real con su botón; no copia datos ni guarda nada. Código aparte del compilado,
   como el Despliegue del TO. Sólo se ve con la piel Pandora (body.sid-pandora). */
(function () {
  'use strict'

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    })
  }
  function botonMapa(re) {
    var bs = document.querySelectorAll('.botones-mapa > button')
    for (var i = 0; i < bs.length; i++) if (re.test((bs[i].textContent || '').trim())) return bs[i]
    return null
  }
  function botonDe(re, dentro) {
    var bs = (dentro || document).querySelectorAll('button')
    for (var i = 0; i < bs.length; i++) if (re.test((bs[i].textContent || '').trim())) return bs[i]
    return null
  }
  function clic(el) { if (el) el.click(); return !!el }
  // abre un botón de la barra y, si hace falta, después otro dentro del panel que se abrió
  function abrir(re, luego) {
    var ok = clic(botonMapa(re))
    if (ok && luego) setTimeout(function () { clic(botonDe(luego)) }, 350)
    return ok
  }
  function unidadesMias() {
    var m = document.querySelector('.contenedor-mapa')
    var t = m ? m.textContent || '' : ''
    var r = /(\d+)\s*UNIDAD/i.exec(t)
    return r ? +r[1] : null
  }
  function blancosFuego() {
    try { return window.MesaFuegos && window.MesaFuegos.plan && window.MesaFuegos.plan.blancos ? window.MesaFuegos.plan.blancos.length : null } catch (e) { return null }
  }

  // Cada pestaña: qué es, qué abre y qué dato real se puede mostrar al lado.
  var FICHAS = {
    prop: {
      etiqueta: 'Fichas propias', color: '#5aa0ff', chip: /Fichas propias/i,
      subs: [
        { k: 'Unidades', t: 'Unidades propias', d: 'Colocá y editá tus unidades: tipo, escalón, arma o servicio, número lateral y símbolo.', b: 'Abrir Unidades',
          f: function () { return abrir(/UNIDADES/i, /^Propias/i) }, n: function () { var n = unidadesMias(); return n == null ? '' : n + ' unidad(es) en el ejercicio' } },
        { k: 'Tareas', t: 'Tareas', d: 'Tareas tácticas de tus unidades y su organización.', b: 'Abrir Tareas', f: function () { return abrir(/TAREAS/i) } },
        { k: 'C.A. por fases', t: 'Curso de acción propio, por fases', d: 'Armá tu curso de acción fase por fase. Cada fase guarda la posición de las fichas.', b: 'Abrir C.A. por fases', f: function () { return abrir(/C\.A\. POR FASES/i) } },
        { k: 'Plan de fuegos', t: 'Plan de fuegos', d: 'Blancos, medios y fases del apoyo de fuegos (tablero del G-3).', b: 'Abrir Plan de fuegos',
          f: function () { return abrir(/G-3/i, /^\W*Fuegos/i) }, n: function () { var n = blancosFuego(); return n == null ? '' : n + ' blanco(s) en el plan' } },
        { k: 'Plan de barreras de ingeniería', t: 'Plan de barreras de ingeniería', d: 'Alambradas, campos minados y posiciones defensivas, con el tiempo y la gente que hacen falta.', b: 'Abrir Defensa', f: function () { return abrir(/DEFENSA/i) } },
        { k: 'Fases', t: 'Fases', d: 'Las fases se arman dentro del C.A. por fases; acá se abre el mismo panel.', b: 'Abrir fases', f: function () { return abrir(/C\.A\. POR FASES/i) } }
      ]
    },
    ene: {
      etiqueta: 'Fichas enemigas', color: '#ff6b7a', chip: /Fichas enemigas/i,
      subs: [
        { k: 'Unidades', t: 'Unidades enemigas', d: 'Colocá las unidades del enemigo (rojo): tipo, escalón, arma y símbolo.', b: 'Abrir Unidades enemigas', f: function () { return abrir(/UNIDADES/i, /^Enemigo/i) } },
        { k: 'Tareas', t: 'Tareas', d: 'Tareas del enemigo y su organización.', b: 'Abrir Tareas', f: function () { return abrir(/TAREAS/i) } },
        { k: 'C.A. por fases', t: 'Cursos de acción del enemigo, por fases', d: 'El más probable y el más peligroso, dibujados fase por fase.', b: 'Abrir C.A. por fases', f: function () { return abrir(/C\.A\. POR FASES/i) } },
        { k: 'Fases', t: 'Fases', d: 'Las fases se arman dentro del C.A. por fases; acá se abre el mismo panel.', b: 'Abrir fases', f: function () { return abrir(/C\.A\. POR FASES/i) } },
        { k: 'Todo lo referente', t: 'Todo lo referente al enemigo', d: 'Inteligencia: lo que se sabe del enemigo y sus productos (tablero del G-2).', b: 'Abrir G-2 Inteligencia', f: function () { return abrir(/G-2/i) } }
      ]
    }
  }

  var abierto = false, ficha = 'prop', sub = 'Unidades', nodo = null, firma = ''

  function crear() {
    if (nodo || !document.querySelector('.contenedor-mapa')) return
    nodo = document.createElement('section')
    nodo.id = 'sid-pd-tab'
    nodo.setAttribute('aria-label', 'Tablero de fichas')
    document.body.appendChild(nodo)
    nodo.addEventListener('click', onClic)
    nodo.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.fich')) { e.preventDefault(); e.target.click() }
    })
    pintar()
  }

  function chipVisible(re) {
    var cs = document.querySelectorAll('.bloque-ver .ver-chip')
    for (var i = 0; i < cs.length; i++) if (re.test(cs[i].textContent || '')) return cs[i]
    return null
  }

  // Sólo se vuelve a dibujar si cambió algo que el tablero muestra (así no se repite por los cambios del mapa).
  function firmaActual() {
    var cp = chipVisible(FICHAS.prop.chip), ce = chipVisible(FICHAS.ene.chip)
    return [abierto, ficha, sub, cp ? /\bon\b/.test(cp.className) : '-', ce ? /\bon\b/.test(ce.className) : '-', unidadesMias(), blancosFuego()].join('|')
  }
  function pintar() {
    if (!nodo) return
    firma = firmaActual()
    var F = FICHAS[ficha]
    var actual = null
    F.subs.forEach(function (s) { if (s.k === sub) actual = s })
    if (!actual) { actual = F.subs[0]; sub = actual.k }
    function fich(k) {
      var c = chipVisible(FICHAS[k].chip)
      var on = c ? /\bon\b/.test(c.className) : true
      return '<span class="fich" role="tab" tabindex="0" data-f="' + k + '" aria-selected="' + (ficha === k) + '" style="--fc:' + FICHAS[k].color + '">' +
        '<input type="checkbox" tabindex="-1" data-v="' + k + '" aria-label="Mostrar ' + FICHAS[k].etiqueta + ' en la carta"' + (on ? ' checked' : '') + (c ? '' : ' disabled') + '>' +
        esc(FICHAS[k].etiqueta) + '</span>'
    }
    var dato = actual.n ? actual.n() : ''
    nodo.className = (abierto ? 'abierto' : '')
    nodo.style.setProperty('--fc', F.color)
    nodo.innerHTML =
      '<div class="bh"><button type="button" class="asa" data-a="asa" aria-expanded="' + abierto + '">' + (abierto ? '▼ Cerrar' : '▲ Tablero') + '</button>' +
      fich('prop') + fich('ene') +
      '<div class="subs" role="tablist">' + F.subs.map(function (s) {
        return '<button type="button" role="tab" data-s="' + esc(s.k) + '" aria-selected="' + (sub === s.k) + '">' + esc(s.k) + '</button>'
      }).join('') + '</div></div>' +
      '<div class="bb" role="tabpanel"><div class="tarj"><h3>' + esc(actual.t) + '</h3><p>' + esc(actual.d) + '</p>' +
      (dato ? '<p class="dato">' + esc(dato) + '</p>' : '') +
      '<button type="button" class="ir" data-a="ir">' + esc(actual.b) + ' ▸</button></div></div>'
  }

  function cerrarMesaVieja() {
    var m = document.querySelector('.contenedor-mapa')
    if (!m) return
    var b = botonDe(/ocultar/i, m)
    if (b) b.click()
  }
  function mesaViejaAbierta() {
    var m = document.querySelector('.contenedor-mapa')
    return !!(m && botonDe(/ocultar/i, m))
  }

  function onClic(e) {
    var t = e.target
    var v = t.closest && t.closest('input[data-v]')
    if (v) { // casilla: prende o apaga las fichas en la carta (el mismo botón de «Qué se ve en el calco»)
      e.stopPropagation()
      var c = chipVisible(FICHAS[v.getAttribute('data-v')].chip)
      if (c) c.click()
      return
    }
    var f = t.closest && t.closest('.fich')
    if (f) { ficha = f.getAttribute('data-f'); sub = FICHAS[ficha].subs[0].k; if (!abierto) alternar(true); else pintar(); return }
    var s = t.closest && t.closest('[data-s]')
    if (s) { sub = s.getAttribute('data-s'); pintar(); return }
    var a = t.closest && t.closest('[data-a]')
    if (!a) return
    if (a.getAttribute('data-a') === 'asa') { alternar(!abierto); return }
    if (a.getAttribute('data-a') === 'ir') {
      var cur = null
      FICHAS[ficha].subs.forEach(function (x) { if (x.k === sub) cur = x })
      if (cur) {
        var ok = cur.f()
        if (ok) alternar(false) // el panel real ya se abrió: el tablero se recoge para no taparlo
        else { a.textContent = 'No disponible en este ejercicio'; setTimeout(pintar, 1600) }
      }
    }
  }

  function alternar(on) {
    abierto = !!on
    if (abierto && mesaViejaAbierta()) cerrarMesaVieja()
    pintar()
  }

  // casillas al día cuando cambian las capas de la izquierda, y el tablero se recoge si se abre la mesa vieja
  var pend = false
  function revisar() {
    if (pend) return
    pend = true
    requestAnimationFrame(function () {
      pend = false
      crear()
      if (!nodo) return
      if (abierto && mesaViejaAbierta()) { abierto = false }
      if (firmaActual() !== firma) pintar()
    })
  }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { if (!nodo || !nodo.contains(ms[i].target)) { revisar(); return } }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  revisar()
})()
