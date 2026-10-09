/*
 * 🗂️ Despliegue del TO — panel inferior de la Mesa del EM.
 *
 * Código aparte del compilado (como el Estudio y el Plan de fuegos): no toca
 * el estado de la Mesa, no guarda nada y no cambia el tamaño de las fichas.
 * Sólo lee un archivo de datos por ejercicio y lo muestra abajo de la carta.
 *
 * Cómo sabe qué ejercicio está abierto: busca el nombre en la barra de la Mesa
 * (el botón con el nombre del ejercicio). Si coincide con alguno de
 * EJERCICIOS, aparece la pestaña «DESPLIEGUE DEL TO» en el borde derecho.
 *
 * Para agregar otro ejercicio: crear ejercicios/<carpeta>/despliegue.json con
 * el mismo formato y sumarlo a EJERCICIOS.
 */
(function () {
  'use strict'
  var EJERCICIOS = [{ clave: 'DIAMANTE', archivo: './ejercicios/diamante/despliegue.json?v=20261009c' }]
  var datos = null, activo = null, tab = null, panel = null, pestana = 'mando'

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    })
  }

  // Símbolo APP-6 pequeño (fuerza propia, azul). arma: inf | mov | mec | uav
  function simbolo(arma, ech) {
    var c = '#5aa2ef', w = 34, h = 22, x = 1, y = 9
    var s = '<svg width="36" height="32" viewBox="0 0 36 32" aria-hidden="true">'
    s += '<text x="18" y="7" text-anchor="middle" font-size="8" font-weight="700" fill="#e4e8ec" font-family="Arial">' + (ech || 'XX') + '</text>'
    s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="rgba(90,162,239,.12)" stroke="' + c + '" stroke-width="1.6"' + (arma === 'mov' ? ' stroke-dasharray="3 2"' : '') + '/>'
    if (arma === 'inf' || arma === 'mov' || arma === 'mec') s += '<path d="M' + x + ' ' + y + 'L' + (x + w) + ' ' + (y + h) + 'M' + (x + w) + ' ' + y + 'L' + x + ' ' + (y + h) + '" stroke="' + c + '" stroke-width="1.2"/>'
    if (arma === 'mec') s += '<ellipse cx="18" cy="20" rx="9" ry="5" fill="none" stroke="' + c + '" stroke-width="1.2"/>'
    if (arma === 'uav') s += '<path d="M6 16 L18 24 L30 16 L18 20 Z" fill="' + c + '"/>'
    return s + '</svg>'
  }

  var TABS = [['mando', 'CADENA DE MANDO'], ['CE-I', 'CE-I'], ['CE-II', 'CE-II'], ['CE-III', 'CE-III'], ['CE-IV', 'CE-IV'], ['drones', 'DRONES · CTO'], ['reservas', 'RESERVAS'], ['crono', 'CRONOLOGÍA']]

  function cuerpo() {
    var d = datos, h = ''
    if (pestana === 'mando') {
      h += '<div class="sdp-grid">'
      d.mando.forEach(function (m) {
        h += '<div class="sdp-card"><div class="sdp-k">PC ' + esc(m.pc) + '</div><h4>' + esc(m.sigla) + '</h4><p>' + esc(m.txt) + '</p></div>'
      })
      h += '</div><div class="sdp-grid" style="margin-top:12px">'
      d.ce.forEach(function (c) {
        h += '<div class="sdp-card"><div class="sdp-k">AO ' + esc(c.ao) + '</div><h4>' + esc(c.id) + ' · PC ' + esc(c.pc) + '</h4><p>' +
          c.divs.map(function (v) { return esc(v.id) }).join(' · ') + '</p></div>'
      })
      return h + '</div>'
    }
    var ce = d.ce.filter(function (c) { return c.id === pestana })[0]
    if (ce) {
      h += '<div class="sdp-ce"><div><div class="sdp-big">' + esc(ce.id) + '</div><div class="sdp-k" style="margin-top:6px">AO ' + esc(ce.ao) + '</div>' +
        '<div class="sdp-meta"><div><span class="sdp-k">PC</span><b>' + esc(ce.pc) + '</b></div><div><span class="sdp-k">Frente</span><b>' + ce.frente.toFixed(1) + ' km</b></div><div><span class="sdp-k">Profundidad</span><b>' + ce.prof.toFixed(1) + ' km</b></div></div>' +
        '<p style="margin:0;color:#aeb8c1;font-size:13px">Eje ' + esc(ce.eje) + '</p>' +
        '<p style="margin:8px 0 0;color:#7f8c97;font-size:12px">Distancia en línea recta desde la guarnición hasta el PC del CE. Dónde se ubica cada división en el AO lo decide el alumno.</p></div><div class="sdp-divs">'
      ce.divs.forEach(function (v) {
        h += '<div class="sdp-div' + (v.arma === 'mov' ? ' mov' : '') + '"><div class="sdp-dh">' + simbolo(v.arma, 'XX') +
          '<div><b>' + esc(v.id) + '</b><br><span>' + esc(v.de) + '</span></div><span class="sdp-km">' + v.km + ' km</span></div><ul>' +
          v.u.map(function (u) { return '<li>' + esc(u) + '</li>' }).join('') + '</ul>' + (v.nota ? '<p class="sdp-nota">' + esc(v.nota) + '</p>' : '') + '</div>'
      })
      return h + '</div></div>'
    }
    if (pestana === 'drones') {
      var dr = d.drones
      h += '<div class="sdp-dr"><div><div class="sdp-dh">' + simbolo('uav', 'XX') + '<div><b>' + esc(dr.nombre) + '</b><br><span>' + esc(dr.dep) + '</span></div></div>' +
        '<p style="margin:10px 0 0;font-size:13px">' + esc(dr.mision) + '</p><p class="sdp-nota" style="margin-top:10px">' + esc(dr.decide) + '</p></div><ol>'
      dr.u.forEach(function (u) { h += '<li><b>' + esc(u[0]) + '</b><span>' + esc(u[1]) + '</span></li>' })
      return h + '</ol></div>'
    }
    if (pestana === 'reservas') {
      var col = { cto: '#e7c46a', ffto: '#a993ec', fuera: '#7f8c97' }
      h += '<div class="sdp-res">'
      d.reservas.forEach(function (r) {
        h += '<div class="sdp-ri" style="--c:' + col[r.tipo] + '"><i></i><div><h4>' + esc(r.t) + '</h4><p>' + esc(r.d) + '</p></div></div>'
      })
      return h + '</div>'
    }
    h += '<div class="sdp-tl">'
    d.crono.forEach(function (t) { h += '<div class="sdp-t' + (t[0] === 'D' ? ' d' : '') + '"><b>' + esc(t[0]) + '</b><span>' + esc(t[1]) + '</span></div>' })
    return h + '</div>'
  }

  function pintar() {
    if (!panel || !datos) return
    panel.querySelector('.sdp-tabs').innerHTML = TABS.map(function (t) {
      return '<button role="tab" data-t="' + t[0] + '" aria-selected="' + (t[0] === pestana) + '">' + t[1] + '</button>'
    }).join('')
    panel.querySelector('.sdp-bd').innerHTML = cuerpo()
  }

  function crear() {
    tab = document.createElement('button')
    tab.className = 'sdp-tab'
    tab.type = 'button'
    tab.textContent = '🗂️ DESPLIEGUE DEL TO'
    tab.title = 'Ver con qué cuenta cada escalón (se abre abajo de la carta)'
    panel = document.createElement('section')
    panel.className = 'sdp'
    panel.hidden = true
    panel.setAttribute('aria-label', 'Despliegue del Teatro de Operaciones')
    panel.innerHTML = '<div class="sdp-hd"><span class="sdp-ti"></span><span class="sdp-am"></span><button type="button" class="sdp-x">▼ Cerrar</button></div>' +
      '<div class="sdp-tabs" role="tablist"></div><div class="sdp-bd"></div>'
    document.body.appendChild(tab)
    document.body.appendChild(panel)
    tab.addEventListener('click', function () { panel.hidden = !panel.hidden; tab.hidden = !panel.hidden })
    panel.querySelector('.sdp-x').addEventListener('click', function () { panel.hidden = true; tab.hidden = false })
    panel.querySelector('.sdp-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-t]')
      if (!b) return
      pestana = b.getAttribute('data-t')
      pintar()
    })
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel && !panel.hidden) { panel.hidden = true; tab.hidden = false }
    })
  }

  function nombreEjercicio() {
    // El nombre del ejercicio abierto está en el botón «📁» de la barra de la Mesa.
    var b = document.querySelector('button[title="Crear, abrir y guardar ejercicios"]')
    var t = b ? (b.textContent || '').toUpperCase() : ''
    for (var j = 0; j < EJERCICIOS.length; j++) if (t.indexOf(EJERCICIOS[j].clave) >= 0) return EJERCICIOS[j]
    // El profesor lo ve siempre (para prepararlo en un ejercicio nuevo o duplicado).
    if (window.SIDECEME_CALCOS && window.SIDECEME_CALCOS.esProfesor) return EJERCICIOS[0]
    var h = location.hostname
    if (location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1') return EJERCICIOS[0]
    return null
  }

  function revisar() {
    var ej = nombreEjercicio()
    if (!ej) { if (tab) { tab.hidden = true; panel.hidden = true } activo = null; return }
    if (activo === ej.clave) { if (tab && panel.hidden) tab.hidden = false; return }
    activo = ej.clave
    fetch(ej.archivo).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json() }).then(function (j) {
      datos = j
      if (!panel) crear()
      panel.querySelector('.sdp-ti').textContent = j.titulo
      panel.querySelector('.sdp-am').innerHTML = j.amenaza ? '<b>Amenaza principal:</b> ' + esc(j.amenaza) : ''
      tab.hidden = false
      pintar()
    }).catch(function () { activo = null })
  }

  function arrancar() {
    try {
      revisar()
      setInterval(revisar, 2000)
    } catch (e) { /* el panel es un agregado: si algo falla, la Mesa sigue igual */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar)
  else arrancar()
  window.SIDDespliegue = { abrir: function () { if (tab) tab.click() } }
})()
