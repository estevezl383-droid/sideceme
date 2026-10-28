/* 🛟 RESGUARDO del ejercicio de la Mesa del EM (18-10-2026). Código aparte del compilado.

   Lo pidió Sergio el 18-10-2026 con la captura de 📁 Ejercicio («⚠️ no se guardó · reintentar»):
   «quisiera saber dónde se está guardando… que los ejercicios se guarden en una carpeta de
   documentos, en la nube está bien pero también en una carpeta para ubicarlos con más facilidad,
   en formato JSON»; y, al saber que se había perdido lo de dos días, «de aquí en adelante
   solucioná que no se joda».

   Qué había pasado (registros de calco-ops y tabla sesiones de SIDECEME): la sesión de SIDECEME de
   esa computadora venció el 16-10 a las 19:03 con la Mesa abierta. La Mesa lee la sesión UNA vez,
   al abrir la página (index.html → window.SIDECEME_CALCOS.token): desde ahí el servidor contestó
   «403 · Sesion no valida» a cada guardado, uno por minuto, durante dos días. Y la copia de
   seguridad del navegador (`<nombre>__anterior`) sólo se escribe cuando el guardado en la nube
   SALE BIEN —y se pisa al volver a abrir el ejercicio—: lo trabajado quedó sólo en la pestaña.

   Lo que hace este módulo (no toca el compilado ni el servidor):
   · 🔑 SESIÓN QUE SE RENUEVA SOLA: cada 20 s, al volver a la pestaña y cuando otra pestaña entra
     a SIDECEME (evento «storage»), vuelve a leer la sesión como index.html y, si hay una nueva y
     vigente, se la da a la Mesa (`SIDECEME_CALCOS.token`, que la Mesa lee en cada guardado) y
     reintenta el guardado (aprieta el sello «⚠️ no se guardó · reintentar»). Sin recargar.
   · ⚠️ AVISO CLARO: cuando la sesión venció (o el servidor contesta «Sesion no valida»), una franja
     arriba dice que NO se puede guardar en la nube, que NO cierre la pestaña, y da «🔑 Entrar a
     SIDECEME en otra pestaña» y «⬇️ Bajar el ejercicio ahora». 15 min antes de vencer, lo avisa.
   · 🖥️ COPIAS EN ESTA COMPUTADORA que no dependen de la nube: cada minuto (y al irse de la
     pestaña), si el ejercicio cambió, una copia en el IndexedDB «sid-resguardo» (las últimas 8 de
     cada ejercicio, sin repetir; abrir el ejercicio NO las pisa).
   · 📁 TU CARPETA (Chrome/Edge de computadora): se elige una vez (p. ej. Documentos/SIDECEME) y
     cada vez que cambia el ejercicio queda `<nombre>.json` y, por día, `respaldos/<nombre> AAAA-MM-DD.json`.
     Es el ejercicio entero, el mismo JSON que abre «📂 Abrir archivo JSON» (como ejercicio nuevo).
     Después de cerrar el navegador, Chrome pide permiso otra vez: un toque en «Permitir».
   · ⬇️ BAJAR AHORA: el ejercicio tal como está en pantalla, en un .json (sirve en cualquier
     navegador, también en el iPhone).
   · 🛟 Si al abrir un ejercicio hay en esta computadora una versión más nueva que la de SIDECEME,
     lo avisa y la deja bajar.
   Se ve con el botón «💾 Copias» (al lado de 🎖️ Mesa · 🎓 Aprendizaje · 🧑‍🏫 Profesor). */
(function (raiz, fabrica) {
  var R = fabrica()
  if (typeof module === 'object' && module.exports) module.exports = R
  else {
    raiz.SIDResguardo = R
    R.vigilar() // ya: antes de que la Mesa haga su primer pedido a SIDECEME
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', R.iniciar)
    else R.iniciar()
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict'
  var MAX_COPIAS = 8
  var CADA = 60000 // copia local y en la carpeta, si cambió
  var SESION_CADA = 20000 // volver a leer la sesión
  var AVISO_ANTES = 15 * 60000 // avisar antes de que venza

  // ─── puro (se prueba en Node) ──────────────────────────────────────────────────────────
  function pad(n) { return (n < 10 ? '0' : '') + n }
  // La sesión como la lee index.html: profesores en localStorage 'sideceme_token_p', cursantes en
  // sessionStorage 'sideceme_token'; `lee(clave)` mira sessionStorage y después localStorage.
  function leerSesion(lee, ahora) {
    var tp = lee('sideceme_token_p'), tc = lee('sideceme_token'), token = tp || tc || null
    var ex = lee('sideceme_token_expira_p') || lee('sideceme_token_expira'), expira = ex ? Date.parse(ex) : NaN
    if (!isFinite(expira)) expira = null
    var vencida = !!(token && expira != null && expira < ahora)
    return { token: vencida ? null : token, expira: expira, vencida: vencida, profesor: !!tp && !vencida }
  }
  // El ejercicio sin la hora de la foto (la foto pone la hora de AHORA cada vez): para saber si cambió.
  function texto(datos) {
    var o = {}
    for (var k in datos) if (Object.prototype.hasOwnProperty.call(datos, k)) o[k] = datos[k]
    o.guardadoEn = ''
    return JSON.stringify(o)
  }
  function huella(s) { // FNV-1a y el largo
    var h = 0x811c9dc5
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
    return ('0000000' + h.toString(16)).slice(-8) + '-' + s.length.toString(36)
  }
  // Como la Mesa (vS del compilado): sin área, fichas, calcos, misión ni documentos no hay nada que cuidar.
  function vacio(d) {
    if (!d || typeof d !== 'object') return true
    var ops = d.ops || {}
    return !d.aoi && !ops.areaOps && !(Array.isArray(d.unidades) && d.unidades.length) && !d.resultados && !String(d.mision || '').trim() && !(Array.isArray(d.documentos) && d.documentos.length) && !d.ordenSup
  }
  function limpio(n) { return String(n || '').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').slice(0, 80) || 'ejercicio' }
  function dia(ms) { var d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) }
  function horaMin(ms) { var d = new Date(ms); return pad(d.getHours()) + pad(d.getMinutes()) }
  function archivoDe(nombre) { return limpio(nombre) + '.json' } // en tu carpeta
  function respaldoDe(nombre, ms) { return limpio(nombre) + ' ' + dia(ms) + '.json' } // en tu carpeta/respaldos
  // El que se baja: «📂 Abrir archivo JSON» le saca «EJERCICIO_» y la fecha y lo abre con su nombre.
  function bajadaDe(nombre, ms) { return 'EJERCICIO_' + limpio(nombre).replace(/ /g, '_') + '_' + dia(ms) + '_' + horaMin(ms) + '.json' }
  // El archivo: el ejercicio entero con la hora de la copia.
  function contenido(s, ms) { var d = JSON.parse(s); d.guardadoEn = new Date(ms).toISOString(); return JSON.stringify(d) }
  // Las copias que quedan de un ejercicio: sin repetir (la misma huella, la más nueva) y las `max` más nuevas.
  function podar(copias, max) {
    var vistas = {}, orden = copias.slice().sort(function (a, b) { return String(b.t).localeCompare(String(a.t)) }), quedan = [], sobran = []
    orden.forEach(function (c) { if (vistas[c.h] || quedan.length >= (max || MAX_COPIAS)) sobran.push(c); else { vistas[c.h] = 1; quedan.push(c) } })
    return { quedan: quedan, sobran: sobran }
  }
  // La copia de esta computadora más nueva que lo que hay en pantalla y que lo que tiene la nube.
  function masNueva(copias, hActual, nubeMs) {
    return copias.filter(function (c) { return c.h !== hActual && (!nubeMs || Date.parse(c.t) > nubeMs + 60000) })
      .sort(function (a, b) { return String(b.t).localeCompare(String(a.t)) })[0] || null
  }
  function hora(ms) { try { return new Date(ms).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) } catch (e) { return new Date(ms).toISOString().slice(5, 16).replace('T', ' ') } }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB' }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }

  // ─── en el navegador ──────────────────────────────────────────────────────────────────
  var est = { sesion: 'local', expira: null, nubeOk: 0, nubeVencida: false, renovada: 0, carpeta: null, permiso: '', carpetaUlt: 0, carpetaErr: '', copias: [], ultimo: {}, nubeDe: {}, abierto: '', nueva: null, aviso: '', verPanel: false }
  var btn = null, pan = null, franja = null, idb = null

  function lee(k) { try { return sessionStorage.getItem(k) || localStorage.getItem(k) } catch (e) { return null } }
  function C() { return window.SIDECEME_PAQUETES ? null : window.SIDECEME_CALCOS || null }
  function mesa() { return window.SIDMesaEjercicio || null }

  // IndexedDB «sid-resguardo»: copias {clave, nombre, h, t, bytes, s} y ajustes {k, v} (la carpeta)
  function base() {
    if (idb) return idb
    idb = new Promise(function (ok, mal) {
      try {
        var r = indexedDB.open('sid-resguardo', 1)
        r.onupgradeneeded = function () {
          var db = r.result
          if (!db.objectStoreNames.contains('copias')) db.createObjectStore('copias', { keyPath: 'clave' }).createIndex('nombre', 'nombre', { unique: false })
          if (!db.objectStoreNames.contains('ajustes')) db.createObjectStore('ajustes', { keyPath: 'k' })
        }
        r.onsuccess = function () { ok(r.result) }
        r.onerror = function () { mal(r.error) }
      } catch (e) { mal(e) }
    })
    idb.catch(function () { idb = null })
    return idb
  }
  function op(almacen, modo, f) {
    return base().then(function (db) {
      return new Promise(function (ok, mal) {
        var tx = db.transaction(almacen, modo), r = f(tx.objectStore(almacen))
        tx.oncomplete = function () { ok(r && r.result) }
        tx.onerror = function () { mal(tx.error) }
        tx.onabort = function () { mal(tx.error) }
      })
    })
  }
  function copiasDe(nombre) {
    return op('copias', 'readonly', function (st) { return st.index('nombre').getAll(nombre) }).then(function (l) {
      return (l || []).map(function (c) { return { clave: c.clave, nombre: c.nombre, h: c.h, t: c.t, bytes: c.bytes } }).sort(function (a, b) { return String(b.t).localeCompare(String(a.t)) })
    }, function () { return [] })
  }
  function copiaTexto(clave) { return op('copias', 'readonly', function (st) { return st.get(clave) }).then(function (c) { return c ? c.s : null }) }

  // ── 🔑 la sesión ──
  function revisarSesion() {
    var c = C()
    if (!c || !c.url) { est.sesion = 'local'; return pintar() }
    var s = leerSesion(lee, Date.now())
    if (s.token && s.token !== c.token) { // entró de nuevo (en otra pestaña): la Mesa la usa desde el próximo guardado
      c.token = s.token; c.esProfesor = s.profesor
      est.renovada = Date.now(); est.nubeVencida = false
      reintentar()
    }
    est.expira = s.token === c.token ? s.expira : null
    // vencida: la Mesa no tiene sesión, la que hay en el navegador ya venció, o el servidor la rechazó
    if (!c.token || (s.vencida && !s.token) || est.nubeVencida) est.sesion = 'vencida'
    else if (est.expira && est.expira - Date.now() < AVISO_ANTES) est.sesion = 'por-vencer'
    else est.sesion = 'ok'
    pintar()
  }
  // el sello de la Mesa, si quedó en error: apretarlo guarda todo ahora
  function reintentar() {
    setTimeout(function () { var b = document.querySelector('.sello-guardado[data-estado="error"]'); if (b) b.click() }, 300)
  }
  // Lo que contesta calco-ops: «Sesion no valida» (403), un guardado que salió bien, la hora de cada
  // ejercicio en la nube (mis_calcos). La Mesa llama a `fetch` en cada pedido: se mira la respuesta.
  function vigilarFetch() {
    if (!window.fetch || window.fetch.__sidResguardo) return
    var f0 = window.fetch
    var f = function (u, o) {
      var p = f0.apply(this, arguments)
      try {
        var url = String((u && u.url) || u || '')
        if (/functions\/v1\/calco-ops/.test(url)) {
          var cuerpo = o && typeof o.body === 'string' ? o.body : '', accion = (cuerpo.match(/"accion":"(\w+)"/) || [])[1] || ''
          p.then(function (r) {
            if (r.status === 403) r.clone().json().then(function (j) { if (/sesi[oó]n no v[aá]lida|volv[eé] a entrar/i.test((j && j.error) || '')) { est.nubeVencida = true; revisarSesion() } }, function () {})
            else if (r.ok && (accion === 'guardar' || accion === 'mis_calcos')) r.clone().json().then(function (j) {
              if (!j || j.ok === false) return
              est.nubeVencida = false
              if (accion === 'guardar') { est.nubeOk = Date.now(); revisarSesion() }
              if (accion === 'mis_calcos' && Array.isArray(j.calcos)) j.calcos.forEach(function (x) { if (x && x.nombre) est.nubeDe[limpio(x.nombre)] = Date.parse(x.actualizado_en) || 0 })
            }, function () {})
          }, function () {})
        }
      } catch (e) {}
      return p
    }
    f.__sidResguardo = true
    window.fetch = f
  }

  // ── 🖥️ las copias y 📁 la carpeta ──
  function resguardar(forzar) {
    var M = mesa()
    if (!M || !M.foto) return Promise.resolve(null)
    var nombre, datos
    try { nombre = M.nombre(); datos = nombre ? M.foto() : null } catch (e) { return Promise.resolve(null) }
    if (!nombre || vacio(datos)) return Promise.resolve(null)
    var s
    try { s = texto(datos) } catch (e) { return Promise.resolve(null) }
    var k = limpio(nombre), h = huella(s), ahora = Date.now()
    if (k !== est.abierto) { est.abierto = k; est.nueva = null; buscarNueva(k, h) }
    if (!forzar && est.ultimo[k] === h) return Promise.resolve(null)
    est.ultimo[k] = h
    var t = new Date(ahora).toISOString()
    return op('copias', 'readwrite', function (st) { st.put({ clave: k + '|' + h, nombre: k, h: h, t: t, bytes: s.length, s: s }) })
      .then(function () { return copiasDe(k) })
      .then(function (l) {
        var p = podar(l, MAX_COPIAS)
        est.copias = p.quedan
        return p.sobran.length ? op('copias', 'readwrite', function (st) { p.sobran.forEach(function (c) { st.delete(c.clave) }) }) : null
      })
      .catch(function (e) { est.aviso = 'No se pudo dejar la copia en esta computadora: ' + ((e && e.message) || e) })
      .then(function () { return enCarpeta(nombre, s, ahora) })
      .then(function () { pintar(); return { nombre: k, h: h } })
  }
  function buscarNueva(k, h) {
    copiasDe(k).then(function (l) {
      est.copias = l
      var n = masNueva(l, h, est.nubeDe[k] || 0)
      est.nueva = n && est.nubeDe[k] ? n : null // sólo si sabemos cuándo se guardó en la nube
      pintar()
    })
  }
  function puedeCarpeta() { return typeof window.showDirectoryPicker === 'function' }
  function permisoDe(h, pedir) {
    if (!h) return Promise.resolve('')
    if (!h.queryPermission) return Promise.resolve('granted') // carpeta de prueba (OPFS): no pide
    return h.queryPermission({ mode: 'readwrite' }).then(function (p) { return p === 'granted' || !pedir ? p : h.requestPermission({ mode: 'readwrite' }) })
  }
  function escribir(dir, nombre, txt) {
    return dir.getFileHandle(nombre, { create: true }).then(function (fh) { return fh.createWritable() }).then(function (w) { return w.write(txt).then(function () { return w.close() }) })
  }
  function enCarpeta(nombre, s, ahora) {
    var h = est.carpeta
    if (!h || est.permiso !== 'granted') return Promise.resolve()
    var txt = contenido(s, ahora)
    return escribir(h, archivoDe(nombre), txt)
      .then(function () { return h.getDirectoryHandle('respaldos', { create: true }) })
      .then(function (r) { return escribir(r, respaldoDe(nombre, ahora), txt) })
      .then(function () { est.carpetaUlt = ahora; est.carpetaErr = '' })
      .catch(function (e) {
        est.carpetaErr = (e && e.message) || String(e)
        if (e && /NotAllowed|permission/i.test(e.name + ' ' + e.message)) est.permiso = 'prompt'
      })
  }
  function usarCarpeta(h) {
    est.carpeta = h
    return op('ajustes', 'readwrite', function (st) { st.put({ k: 'carpeta', v: h }) }).catch(function () {})
      .then(function () { return permisoDe(h, false) }).then(function (p) { est.permiso = p; return resguardar(true) })
  }
  function elegirCarpeta() {
    if (!puedeCarpeta()) return
    window.showDirectoryPicker({ id: 'sideceme-ejercicios', mode: 'readwrite', startIn: 'documents' }).then(usarCarpeta, function (e) { if (e && e.name !== 'AbortError') { est.carpetaErr = e.message; pintar() } })
  }
  function permitirCarpeta() { permisoDe(est.carpeta, true).then(function (p) { est.permiso = p; return resguardar(true) }, function (e) { est.carpetaErr = e.message; pintar() }) }
  function olvidarCarpeta() { est.carpeta = null; est.permiso = ''; op('ajustes', 'readwrite', function (st) { st.delete('carpeta') }).catch(function () {}); pintar() }
  function cargarCarpeta() {
    return op('ajustes', 'readonly', function (st) { return st.get('carpeta') }).then(function (a) {
      if (!a || !a.v) return
      est.carpeta = a.v
      return permisoDe(a.v, false).then(function (p) { est.permiso = p })
    }).catch(function () {}).then(pintar)
  }

  // ── ⬇️ bajar ──
  function bajar(nombre, txt) {
    var u = URL.createObjectURL(new Blob([txt], { type: 'application/json' })), a = document.createElement('a')
    a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); a.remove()
    setTimeout(function () { URL.revokeObjectURL(u) }, 4000)
  }
  function bajarAhora() {
    var M = mesa(), nombre = M && M.nombre && M.nombre()
    if (!nombre) { est.aviso = 'Abrí un ejercicio primero.'; return pintar() }
    var ahora = Date.now()
    bajar(bajadaDe(nombre, ahora), contenido(texto(M.foto()), ahora))
    est.aviso = '⬇️ Bajado: está en tu carpeta de Descargas. Para abrirlo: 📁 Ejercicio → 📂 Abrir archivo JSON.'
    pintar()
  }
  function bajarCopia(clave) {
    var c = est.copias.filter(function (x) { return x.clave === clave })[0] || (est.nueva && est.nueva.clave === clave ? est.nueva : null)
    if (!c) return
    copiaTexto(clave).then(function (s) { if (s) bajar(bajadaDe(c.nombre, Date.parse(c.t)), contenido(s, Date.parse(c.t))) })
  }

  // ── la pantalla ──
  function crear() {
    if (!document.getElementById('sid-resg-btn')) {
      btn = document.createElement('button')
      btn.type = 'button'; btn.id = 'sid-resg-btn'
      btn.title = 'Dónde se guarda el ejercicio: SIDECEME (la nube), tu carpeta y esta computadora. Bajar el ejercicio en .json.'
      btn.addEventListener('click', function () { est.verPanel = !est.verPanel; if (est.verPanel) resguardar(false); pintar() })
      document.body.appendChild(btn)
    }
    pan = document.createElement('div'); pan.id = 'sid-resg-panel'; pan.hidden = true
    franja = document.createElement('div'); franja.id = 'sid-resg-aviso'; franja.hidden = true; franja.setAttribute('role', 'alert')
    document.body.appendChild(pan); document.body.appendChild(franja)
    var acc = function (e) {
      var a = e.target.closest && e.target.closest('[data-r]')
      if (!a) return
      var q = a.getAttribute('data-r')
      if (q === 'entrar') window.open(new URL('../', location.href).href, '_blank')
      else if (q === 'bajar') bajarAhora()
      else if (q === 'copia') bajarCopia(a.getAttribute('data-c'))
      else if (q === 'carpeta') elegirCarpeta()
      else if (q === 'permitir') permitirCarpeta()
      else if (q === 'olvidar') olvidarCarpeta()
      else if (q === 'cerrar') { est.verPanel = false; pintar() }
      else if (q === 'ver') { est.verPanel = true; pintar() }
      else if (q === 'nueva-no') { est.nueva = null; pintar() }
    }
    pan.addEventListener('click', acc); franja.addEventListener('click', acc)
  }
  function lineaNube() {
    if (est.sesion === 'local') return '<li><b>☁️ SIDECEME (la nube)</b><span>Esta Mesa no está conectada a SIDECEME: se guarda en este navegador.</span></li>'
    var ok = est.nubeOk ? 'último guardado en la nube: ' + hora(est.nubeOk) : 'todavía no se guardó en esta sesión'
    if (est.sesion === 'vencida') return '<li class="mal"><b>☁️ SIDECEME (la nube)</b><span>⚠️ No se puede guardar: tu sesión venció. Entrá a SIDECEME en otra pestaña y la Mesa vuelve a guardar sola.</span><button type="button" data-r="entrar">🔑 Entrar a SIDECEME</button></li>'
    return '<li class="bien"><b>☁️ SIDECEME (la nube)</b><span>✓ ' + esc(ok) + (est.expira ? ' · tu sesión vence ' + esc(hora(est.expira)) : '') + '</span></li>'
  }
  function lineaCarpeta() {
    if (!puedeCarpeta()) return '<li><b>📁 Tu carpeta</b><span>Este navegador no deja guardar solo en una carpeta (sí Chrome y Edge de computadora): usá «⬇️ Bajar el ejercicio ahora».</span></li>'
    if (!est.carpeta) return '<li><b>📁 Tu carpeta</b><span>Elegí una carpeta (por ejemplo Documentos › SIDECEME) y cada vez que cambie el ejercicio va a quedar ahí «' + esc(archivoDe(nombreAbierto() || 'CE-VI.1')) + '».</span><button type="button" data-r="carpeta">📁 Elegir carpeta</button></li>'
    if (est.permiso !== 'granted') return '<li class="mal"><b>📁 Tu carpeta «' + esc(est.carpeta.name) + '»</b><span>El navegador pide permiso otra vez para escribir en ella.</span><button type="button" data-r="permitir">🔓 Permitir</button><button type="button" class="chico" data-r="olvidar">Elegir otra</button></li>'
    return '<li class="bien"><b>📁 Tu carpeta «' + esc(est.carpeta.name) + '»</b><span>' + (est.carpetaUlt ? '✓ ' + esc(archivoDe(nombreAbierto() || '')) + ' · ' + esc(hora(est.carpetaUlt)) + ' (y uno por día en «respaldos»)' : 'Se guarda ahí apenas cambie el ejercicio.') + (est.carpetaErr ? ' ⚠️ ' + esc(est.carpetaErr) : '') + '</span><button type="button" class="chico" data-r="olvidar">Elegir otra</button></li>'
  }
  function lineaCopias() {
    var l = est.copias
    return '<li><b>🖥️ Esta computadora</b><span>' + (l.length ? l.length + ' copia(s) de «' + esc(nombreAbierto()) + '» (no se pisan al abrir el ejercicio):' : 'Todavía no hay copias de este ejercicio.') + '</span>' +
      (l.length ? '<ol>' + l.map(function (c) { return '<li>' + esc(hora(Date.parse(c.t))) + ' · ' + esc(kb(c.bytes)) + ' <button type="button" class="chico" data-r="copia" data-c="' + esc(c.clave) + '">⬇️</button></li>' }).join('') + '</ol>' : '') + '</li>'
  }
  function nombreAbierto() { try { var M = mesa(); return (M && M.nombre && M.nombre()) || '' } catch (e) { return '' } }
  function pintar() {
    if (!pan) return
    var mal = est.sesion === 'vencida' || (est.carpeta && est.permiso && est.permiso !== 'granted')
    if (btn) { btn.textContent = mal ? '⚠️ Copias' : '💾 Copias'; btn.classList.toggle('mal', !!mal); btn.setAttribute('aria-expanded', String(est.verPanel)) }
    pan.hidden = !est.verPanel
    if (est.verPanel) setTimeout(colocar, 0)
    if (est.verPanel) pan.innerHTML = '<div class="cab"><b>💾 Dónde se guarda «' + esc(nombreAbierto() || 'el ejercicio') + '»</b><button type="button" class="chico" data-r="cerrar">✕</button></div>' +
      '<ul>' + lineaNube() + lineaCarpeta() + lineaCopias() + '</ul>' +
      '<button type="button" class="grande" data-r="bajar">⬇️ Bajar el ejercicio ahora (.json)</button>' +
      '<p class="nota">Un .json se abre con <b>📁 Ejercicio → 📂 Abrir archivo JSON</b>: entra como ejercicio NUEVO y el que tenías abierto no se toca.</p>' +
      (est.aviso ? '<p class="nota ok">' + esc(est.aviso) + '</p>' : '')
    // la franja de arriba
    var f = ''
    if (est.sesion === 'vencida') f = '<b>⚠️ Tu sesión de SIDECEME venció: la Mesa NO puede guardar en la nube.</b> <span>No cierres ni recargues esta pestaña. Entrá a SIDECEME en otra pestaña con tu usuario y la Mesa vuelve a guardar sola' + (est.carpeta && est.permiso === 'granted' ? '; mientras tanto se guarda en tu carpeta «' + esc(est.carpeta.name) + '» y en esta computadora.' : '; mientras tanto se guarda en esta computadora.') + '</span><button type="button" data-r="entrar">🔑 Entrar a SIDECEME</button><button type="button" data-r="bajar">⬇️ Bajar el ejercicio ahora</button>'
    else if (est.renovada && Date.now() - est.renovada < 8000) f = '<b>🔑 Sesión de SIDECEME renovada:</b> <span>la Mesa vuelve a guardar en la nube.</span>'
    else if (est.nueva) f = '<b>🛟 En esta computadora hay una versión de «' + esc(est.nueva.nombre) + '» más nueva (' + esc(hora(Date.parse(est.nueva.t))) + ') que la de SIDECEME.</b> <span>Bajala y abrila con 📁 Ejercicio → 📂 Abrir archivo JSON (entra como ejercicio nuevo).</span><button type="button" data-r="copia" data-c="' + esc(est.nueva.clave) + '">⬇️ Bajar esa versión</button><button type="button" class="chico" data-r="nueva-no">No, gracias</button>'
    else if (est.sesion === 'por-vencer') f = '<b>⏳ Tu sesión de SIDECEME vence ' + esc(hora(est.expira)) + '.</b> <span>Entrá de nuevo a SIDECEME en otra pestaña antes y la Mesa la toma sola.</span><button type="button" data-r="entrar">🔑 Entrar a SIDECEME</button>'
    else if (est.carpeta && est.permiso === 'prompt' && nombreAbierto()) f = '<b>📁 Tu carpeta «' + esc(est.carpeta.name) + '» espera permiso</b> <span>para seguir guardando ahí el ejercicio.</span><button type="button" data-r="permitir">🔓 Permitir</button>'
    franja.hidden = !f
    franja.className = est.sesion === 'vencida' ? 'mal' : est.nueva || est.sesion === 'por-vencer' || (est.carpeta && est.permiso === 'prompt') ? 'ojo' : 'bien'
    if (franja.__f !== f) { franja.innerHTML = f; franja.__f = f }
  }

  // «💾 Copias» va a la izquierda del selector 🎖️ Mesa · 🎓 Aprendizaje · 🧑‍🏫 Profesor (arriba en la
  // computadora, abajo en el teléfono) y el panel se abre hacia donde haya lugar
  function colocar() {
    if (!btn) return
    var sel = document.getElementById('sid-mod-sel'), r = sel && sel.getBoundingClientRect(), s = btn.style
    if (r && r.width) { s.top = Math.round(r.top + (r.height - btn.offsetHeight) / 2) + 'px'; s.left = Math.max(4, Math.round(r.left - btn.offsetWidth - 6)) + 'px'; s.right = 'auto' }
    else { s.top = '8px'; s.right = '8px'; s.left = 'auto' }
    if (!pan || pan.hidden) return
    var b = btn.getBoundingClientRect(), abajo = b.top < window.innerHeight / 2
    pan.style.top = abajo ? Math.round(b.bottom + 6) + 'px' : 'auto'
    pan.style.bottom = abajo ? 'auto' : Math.round(window.innerHeight - b.top + 6) + 'px'
  }

  var iniciado = false
  function iniciar() {
    if (iniciado) return
    iniciado = true
    vigilarFetch()
    crear(); cargarCarpeta(); revisarSesion(); colocar()
    setInterval(colocar, 700)
    window.addEventListener('resize', colocar)
    setInterval(revisarSesion, SESION_CADA)
    setInterval(function () { resguardar(false) }, CADA)
    setInterval(function () { if (est.renovada && Date.now() - est.renovada > 8000 && Date.now() - est.renovada < 9000) pintar() }, 1000)
    window.addEventListener('storage', function (e) { if (!e.key || /sideceme_token/.test(e.key)) revisarSesion() })
    window.addEventListener('focus', revisarSesion)
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') revisarSesion(); else resguardar(false) })
    window.addEventListener('pagehide', function () { resguardar(false) })
    // la primera copia apenas hay un ejercicio abierto
    var m = 0, t2 = setInterval(function () { var M = mesa(); if ((M && M.nombre && M.nombre()) || ++m > 120) { clearInterval(t2); resguardar(false) } }, 1000)
  }

  return {
    // puro
    leerSesion: leerSesion, texto: texto, huella: huella, vacio: vacio, limpio: limpio, archivoDe: archivoDe, respaldoDe: respaldoDe, bajadaDe: bajadaDe, contenido: contenido, podar: podar, masNueva: masNueva, MAX_COPIAS: MAX_COPIAS,
    // en el navegador
    iniciar: iniciar, vigilar: vigilarFetch, revisarSesion: revisarSesion, resguardar: resguardar, usarCarpeta: usarCarpeta, copiasDe: copiasDe, copiaTexto: copiaTexto, bajarAhora: bajarAhora,
    get estado() { return est }
  }
})
