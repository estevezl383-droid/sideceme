/* 🎲 LLEVAR MI EJERCICIO AL JUEGO DE GUERRA — 17-11-2026 (v2.9.490)
 *
 * Sergio: «necesito que los alumnos tengan acceso a poder descargar su ejercicio tanto en los
 * Cuerpos de Ejército como en las Divisiones y también en las FF.TT.T.O., y que lo puedan llevar
 * y cargar en el Juego de Guerra. Eso lo deben poder hacer TODOS los alumnos».
 *
 * EL PROBLEMA. El .json para el Juego se bajaba en dos lugares escondidos: el cuadro de ejercicios
 * (que el oficial que entra por su enlace «?puesto=g4» no abre) y el panel del PICB del Teatro
 * (paso 5, y sólo si el ejercicio es de nivel teatro). O sea: el G-3 a veces, los demás nunca.
 *
 * LO QUE HACE ESTO. Una pestaña 🎲 AL JUEGO en el borde derecho de la Mesa, para CUALQUIER puesto
 * (G-1 a G-5, Cmte., JEM, instructor) y CUALQUIER nivel (CE, División, FF.TT.T.O.). Baja el
 * ejercicio tal como está en la Mesa — el mismo «ejercicio.json» que pide el Juego de Guerra —
 * y explica los tres pasos para cargarlo. No toca nada del ejercicio: sólo lee.
 *
 * De dónde saca el ejercicio: window.SIDMesaEjercicio.foto(), que deja el autoguardado.
 * JavaScript sin compilar, como los demás módulos de la Mesa: no hay que recompilar el tablero.
 */
;(function () {
  'use strict'
  if (window.__SIDLlevarAlJuego) return
  window.__SIDLlevarAlJuego = true

  var VERSION = '20261117'
  var CSS = [
    '.sidlj-btn{position:fixed;right:0;top:70%;z-index:1490;writing-mode:vertical-rl;transform:rotate(180deg);',
    '  background:#2a2208;color:#f3cc62;border:1px solid #caa14a;border-left:0;border-radius:0 8px 8px 0;',
    '  font:700 12px/1 Arial,sans-serif;letter-spacing:.12em;padding:14px 8px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.4)}',
    '.sidlj-btn:hover,.sidlj-btn:focus-visible,.sidlj-btn[aria-expanded="true"]{background:#3a2f0c;outline:2px solid #f3cc62;outline-offset:1px}',
    '.sidlj{position:fixed;right:44px;top:108px;z-index:1496;width:min(430px,calc(100vw - 60px));max-height:calc(100vh - 128px);',
    '  overflow:auto;background:#141108;color:#e8e2d2;border:1px solid #caa14a;border-radius:10px;',
    '  box-shadow:0 12px 34px rgba(0,0,0,.6);font:13px/1.5 Arial,Helvetica,sans-serif}',
    '.sidlj[hidden],.sidlj-btn[hidden]{display:none}',
    '.sidlj *{box-sizing:border-box}',
    '.sidlj-hd{display:flex;align-items:flex-start;gap:8px;padding:10px 12px 8px;border-bottom:1px solid #3a3118;background:linear-gradient(#20190a,#141108)}',
    '.sidlj-hd h2{margin:0;font:700 14px/1.25 Arial,sans-serif;color:#f3cc62;letter-spacing:.06em}',
    '.sidlj-hd p{margin:3px 0 0;font-size:11.5px;color:#b5ab90}',
    '.sidlj-hd .sidlj-tit{flex:1;min-width:0}',
    '.sidlj-hd button{background:transparent;border:1px solid #4a3f20;color:#d8d0bb;border-radius:6px;padding:2px 8px;cursor:pointer;font-size:13px}',
    '.sidlj-hd button:hover{border-color:#f3cc62;color:#f3cc62}',
    '.sidlj-bd{padding:10px 12px 14px;display:flex;flex-direction:column;gap:9px}',
    '.sidlj-ej{font-size:12.5px;color:#e8e2d2;background:rgba(243,204,98,.08);border:1px solid #4a3f20;border-radius:7px;padding:7px 9px}',
    '.sidlj-ej b{color:#f3cc62}',
    '.sidlj-b{background:linear-gradient(180deg,#caa14a,#8a6d24);color:#1a1407;border:0;border-radius:8px;',
    '  padding:11px 12px;font:800 14px/1.2 Arial,sans-serif;cursor:pointer;text-align:center}',
    '.sidlj-b:hover{filter:brightness(1.08)}',
    '.sidlj-b[disabled]{opacity:.45;cursor:not-allowed;filter:none}',
    '.sidlj-b2{background:rgba(243,204,98,.1);color:#f3cc62;border:1px solid #6b5a2c;border-radius:7px;padding:8px 10px;font:700 12.5px Arial,sans-serif;cursor:pointer;text-align:left}',
    '.sidlj-b2:hover{border-color:#f3cc62}',
    '.sidlj-paso{font-size:12.5px;color:#cfc7b2;line-height:1.5}',
    '.sidlj-paso b{color:#f3cc62}',
    '.sidlj-n{display:inline-block;min-width:18px;height:18px;line-height:18px;text-align:center;border-radius:50%;background:#caa14a;color:#1a1407;font:800 11px Arial;margin-right:5px}',
    '.sidlj-ok{font-size:12px;color:#8fe3a6;line-height:1.45}',
    '.sidlj-mal{font-size:12px;color:#ffb3b3;line-height:1.45}',
    '.sidlj-pie{font-size:11.5px;color:#9b937c;line-height:1.45;border-top:1px solid #2c2614;padding-top:8px}',
  ].join('\n')

  var btn = null, raiz = null, cuerpo = null, abierto = false, aviso = ''

  function estilo() {
    if (document.getElementById('sidlj-css')) return
    var s = document.createElement('style')
    s.id = 'sidlj-css'
    s.textContent = CSS
    document.head.appendChild(s)
  }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    })
  }
  function mesa() { try { return window.SIDMesaEjercicio || null } catch (e) { return null } }
  function nombre() { try { var M = mesa(); return (M && M.nombre && M.nombre()) || '' } catch (e) { return '' } }
  function foto() { try { var M = mesa(); return (M && M.foto && M.foto()) || null } catch (e) { return null } }

  // Lo que lleva el archivo, en castellano, para que el alumno vea que no baja algo vacío.
  function resumen(ej) {
    if (!ej) return null
    var u = (ej.unidades || []).filter(function (x) { return x && x.tipo !== 'instalacion' }).length
    var inst = (ej.unidades || []).filter(function (x) { return x && x.tipo === 'instalacion' }).length
    var ops = ej.ops || {}
    var fases = 0
    try {
      var f = ej.fasesCOA || {}
      fases = ((f.propio || []).length || 0) + ((f.enemigo || []).length || 0)
    } catch (e) { fases = 0 }
    var obs = (ops.obstaculos || []).length
    return { u: u, inst: inst, fases: fases, obs: obs, area: !!(ops.areaOps || ej.aoi) }
  }
  // Nivel, sólo para decirlo en pantalla: el Juego lo reconoce solo al importar.
  function nivel(ej) {
    if (!ej) return ''
    var txt = String((ej.baseInfo && (ej.baseInfo.unidad || ej.baseInfo.magnitud)) || ej.unidadConsiderada || '')
    if (/FF\.?\s*TT\.?\s*T\.?\s*O|TEATRO|FUERZAS?\s+TERRESTRES/i.test(txt)) return 'FF.TT.T.O. (teatro)'
    if (/CUERPO|\bC\.?E\.?\b/i.test(txt)) return 'Cuerpo de Ejército'
    if (/DIVISI/i.test(txt)) return 'División'
    var areas = (ej.ops && ej.ops.areas) || ej.areas || []
    if (Array.isArray(areas) && areas.some(function (a) { return a && /teatro/i.test(String(a.tipo || a.nombre || '')) })) return 'FF.TT.T.O. (teatro)'
    return txt || ''
  }

  function bajar() {
    var ej = foto()
    if (!ej) { aviso = 'mal:No hay ejercicio abierto en la Mesa. Abrí el tuyo y volvé a tocar.'; return pintar() }
    var n = nombre() || 'ejercicio'
    var limpio = n.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'ejercicio'
    var texto
    try { texto = JSON.stringify(ej) } catch (e) { aviso = 'mal:No se pudo armar el archivo: ' + (e.message || e); return pintar() }
    var u = URL.createObjectURL(new Blob([texto], { type: 'application/json' }))
    var a = document.createElement('a')
    a.href = u
    a.download = limpio + ' - ejercicio.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(function () { URL.revokeObjectURL(u) }, 4000)
    var mb = Math.round((texto.length / 1048576) * 10) / 10
    aviso = 'ok:⬇ Bajado: «' + limpio + ' - ejercicio.json» (' + (mb < 0.1 ? 'menos de 0,1' : String(mb).replace('.', ',')) + ' MB). Está en la carpeta de Descargas.'
    pintar()
  }

  function html() {
    var ej = foto(), n = nombre(), r = resumen(ej), niv = nivel(ej)
    var hay = !!ej
    var cab = '<div class="sidlj-ej">' + (hay
      ? '📁 <b>' + esc(n || 'Ejercicio sin nombre') + '</b>' + (niv ? ' · ' + esc(niv) : '') +
        '<br>Lleva ' + (r.u || 0) + ' unidad(es), ' + (r.inst || 0) + ' instalación(es)' +
        (r.fases ? ', ' + r.fases + ' fase(s) de curso de acción' : '') +
        (r.obs ? ' y ' + r.obs + ' obra(s) del plan de barreras' : '') + '.'
      : '⚠️ <b>No hay ejercicio abierto en la Mesa.</b> Abrí el tuyo y volvé a esta pestaña.') + '</div>'

    var botones = '<button class="sidlj-b" data-a="bajar"' + (hay ? '' : ' disabled') + '>⬇ Bajar mi ejercicio (.json)</button>'

    var pasos =
      '<div class="sidlj-paso"><span class="sidlj-n">1</span>Bajá el archivo con el botón de arriba.</div>' +
      '<div class="sidlj-paso"><span class="sidlj-n">2</span>En SIDECEME entrá a <b>🎲 Juego de Guerra</b> y creá tu partida con <b>➕ Crear partida</b> (quedás de árbitro de la tuya). Si el instructor ya te dio una, abrila.</div>' +
      '<div class="sidlj-paso"><span class="sidlj-n">3</span>Dentro de la partida: <b>⚙️ Configurar → 🌄 Traer escenario del Generador de Calcos → 📂 Cargar escenario (reemplaza)</b> y elegí el archivo que bajaste.</div>'

    var cola = '<div class="sidlj-pie">Sirve igual para <b>Cuerpo de Ejército</b>, <b>División</b> y <b>FF.TT.T.O.</b>: al importar, el Juego reconoce solo la escala y te pregunta con qué fase del curso de acción querés jugar.<br>' +
      'Si tu ejercicio es de teatro y ya armaste las <b>FASES ROJO</b> (paso 4) y las <b>FASES AZUL</b> (paso 5) en 🌎 PICB TEATRO, de ahí sale además el <b>«… ENFRENTAMIENTO ROJO vs AZUL.json»</b>, que entra con los dos bandos enfrentados por fase.</div>'

    var m = ''
    if (aviso) {
      var cl = aviso.indexOf('mal:') === 0 ? 'sidlj-mal' : 'sidlj-ok'
      m = '<div class="' + cl + '">' + esc(aviso.replace(/^(ok|mal):/, '')) + '</div>'
    }
    return '<div class="sidlj-hd"><div class="sidlj-tit"><h2>🎲 LLEVAR MI EJERCICIO AL JUEGO DE GUERRA</h2>' +
      '<p>El mismo ejercicio que tenés en la Mesa, en un archivo que el Juego de Guerra abre.</p></div>' +
      '<button data-a="cerrar" title="Cerrar">✕</button></div>' +
      '<div class="sidlj-bd">' + cab + botones + m + pasos + cola + '</div>'
  }

  function pintar() {
    if (!raiz) return
    raiz.innerHTML = html()
  }

  function alClic(e) {
    var t = e.target.closest('[data-a]')
    if (!t) return
    var a = t.getAttribute('data-a')
    if (a === 'cerrar') return cerrar()
    if (a === 'bajar') return bajar()
  }

  function abrir() {
    abierto = true
    aviso = ''
    if (!raiz) {
      raiz = document.createElement('section')
      raiz.className = 'sidlj'
      raiz.setAttribute('aria-label', 'Llevar mi ejercicio al Juego de Guerra')
      raiz.addEventListener('click', alClic)
      document.body.appendChild(raiz)
    }
    raiz.hidden = false
    btn.setAttribute('aria-expanded', 'true')
    pintar()
  }
  function cerrar() {
    abierto = false
    if (raiz) raiz.hidden = true
    if (btn) btn.setAttribute('aria-expanded', 'false')
  }

  // Las pestañas del borde derecho (🧩 Superponer, 🌎 PICB TEATRO…) son fijas y verticales: esta se
  // acomoda debajo de la última para no taparlas. Se recalcula al rato, porque algunas se montan
  // después, y cuando cambia el tamaño de la ventana.
  function ubicar() {
    if (!btn || btn.hidden) return
    var otras = [].slice.call(document.body.children).filter(function (e) {
      if (e === btn || !(e instanceof HTMLElement)) return false
      var cs = getComputedStyle(e)
      return cs.position === 'fixed' && cs.display !== 'none' && cs.visibility !== 'hidden' && /^vertical/.test(cs.writingMode)
    }).map(function (e) { return e.getBoundingClientRect() })
      .filter(function (r) { return r.height > 0 && r.right >= window.innerWidth - 4 })
    var alto = btn.getBoundingClientRect().height || 170, H = window.innerHeight
    var top = Math.round(H * 0.7)
    if (otras.length) {
      var abajo = Math.max.apply(null, otras.map(function (r) { return r.bottom })) + 10
      var arriba = Math.min.apply(null, otras.map(function (r) { return r.top })) - 10 - alto
      top = abajo + alto <= H - 20 ? abajo : arriba >= 64 ? arriba : Math.max(64, H - alto - 20)
    }
    var nuevo = Math.round(top) + 'px'
    if (btn.style.top !== nuevo) btn.style.top = nuevo
  }

  function montar() {
    estilo()
    if (btn) return
    btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'sidlj-btn'
    btn.textContent = '🎲 AL JUEGO'
    btn.title = 'Bajar mi ejercicio (.json) para cargarlo en el Juego de Guerra'
    btn.setAttribute('aria-expanded', 'false')
    btn.addEventListener('click', function () { return abierto ? cerrar() : abrir() })
    document.body.appendChild(btn)
    window.addEventListener('resize', ubicar)
    ubicar()
    setTimeout(ubicar, 1500)
    setTimeout(ubicar, 4000)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar)
  else montar()

  window.SIDLlevarAlJuego = { version: VERSION, abrir: abrir, cerrar: cerrar, bajar: bajar }
})()
