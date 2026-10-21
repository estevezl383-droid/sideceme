/* 🎓 MODO PRÁCTICA (…/calcos/?practica) — la Mesa SIN el servidor (21-10-2026). Código aparte del compilado.
   Lo pidió Sergio después de la caída del 20-10-2026: los 125 alumnos practican el G-4 con el
   EJERCICIO_….json que les manda el profesor por WhatsApp y le devuelven su trabajo por WhatsApp.
   index.html sólo marca window.SIDECEME_PRACTICA (y no le da el servidor a la Mesa); acá está:
   · el cartel amarillo con los pasos (al cerrarlo queda una píldora con «📤 Entregar»);
   · 📤 Entregar: guarda ya (el sello 💾), pide el nombre del alumno una vez y baja
     ENTREGA_G4_<alumno>_<fecha>.json — el ejercicio entero, con nombre «G-4 · <alumno>», que el
     profesor abre con 📁 Ejercicios → 📂 Abrir archivo JSON. (⬇️ Bajar el ejercicio (.zip) sigue
     andando, pero los 125 llegaban como «CE-I.V9.zip».)
   · al recargar o al volver otro día la Mesa arrancaba VACÍA (el ejercicio quedaba en 📁 Ejercicios →
     Abrir guardados) y el alumno creía que lo había perdido: si no hay ninguno abierto, abre el último
     guardado en este navegador y lo avisa. No borra nada. */
(function () {
  'use strict'
  if (!window.SIDECEME_PRACTICA) return

  var BOTON = 'button[title="Crear, abrir y guardar ejercicios"]'
  var ANTERIOR = '__anterior' // la copia de resguardo que la Mesa guarda al lado de cada ejercicio
  var CLAVE_ALUMNO = 'sid_practica_alumno'

  function $$(sel) { return [].slice.call(document.querySelectorAll(sel)) }
  function boton() { return document.querySelector(BOTON) }
  // «📁 Ejercicio» = no hay ninguno abierto; con uno abierto dice «📁 CE-I.V9».
  function abierto() {
    var b = boton(), t = b ? b.textContent.replace(/^\W+/, '').trim() : ''
    return t && !/^ejercicio$/i.test(t) ? t : ''
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  function lee(k) { try { return localStorage.getItem(k) || '' } catch (e) { return '' } }
  function guarda(k, v) { try { localStorage.setItem(k, v) } catch (e) {} }

  function esperar(cond, ms) {
    return new Promise(function (ok) {
      var t0 = Date.now()
      ;(function mira() {
        var r = cond()
        if (r || Date.now() - t0 > ms) return ok(r || null)
        setTimeout(mira, 250)
      })()
    })
  }

  // Los ejercicios guardados en este navegador (IndexedDB «calcos» → «ejercicios», sin las copias
  // «__anterior»), el más reciente primero. Nunca crea la base: si la Mesa todavía no la creó no hay
  // nada (y crearla vacía le rompería el arranque).
  function guardados() {
    return new Promise(function (ok) {
      if (!window.indexedDB) return ok([])
      var leer = function () {
        try {
          var r = indexedDB.open('calcos')
          r.onerror = function () { ok([]) }
          r.onsuccess = function () {
            var db = r.result
            if (!db.objectStoreNames.contains('ejercicios')) { db.close(); return ok([]) }
            var q = db.transaction('ejercicios').objectStore('ejercicios').getAll()
            q.onerror = function () { db.close(); ok([]) }
            q.onsuccess = function () {
              db.close()
              var ej = (q.result || []).filter(function (e) { return e && e.nombre && e.nombre.slice(-ANTERIOR.length) !== ANTERIOR })
              ej.sort(function (a, b) { return String(b.guardadoEn || '').localeCompare(String(a.guardadoEn || '')) })
              ok(ej)
            }
          }
        } catch (e) { ok([]) }
      }
      if (indexedDB.databases) indexedDB.databases().then(function (ds) { (ds || []).some(function (d) { return d.name === 'calcos' }) ? leer() : ok([]) }, leer)
      else leer()
    })
  }

  // ─── aviso verde arriba (se va solo) ───
  function aviso(html, ms) {
    var v = document.getElementById('aviso-practica-ok')
    if (v) v.remove()
    var a = document.createElement('div')
    a.id = 'aviso-practica-ok'
    a.style.cssText = 'position:fixed;left:50%;top:56px;transform:translateX(-50%);z-index:100000;' +
      'max-width:min(560px,calc(100vw - 32px));padding:8px 34px 8px 14px;border-radius:8px;' +
      'background:#0d3320;color:#b8f5d0;border:1px solid #39d98a;font:13px/1.4 system-ui,sans-serif;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.45)'
    a.innerHTML = html + '<button aria-label="Cerrar aviso" style="position:absolute;top:4px;right:6px;background:none;' +
      'border:0;color:#b8f5d0;font-size:16px;cursor:pointer">✕</button>'
    a.querySelector('button').onclick = function () { a.remove() }
    document.body.appendChild(a)
    setTimeout(function () { a.remove() }, ms || 15000)
  }

  // ─── el cartel amarillo (abajo) ───
  var ESTILO_BOTON = 'margin-top:6px;background:#f0b400;color:#241a00;border:0;border-radius:6px;padding:6px 12px;' +
    'font:600 13px system-ui,sans-serif;cursor:pointer'
  function cartel() {
    var c = document.createElement('div')
    c.id = 'aviso-practica'
    c.style.cssText = 'position:fixed;left:50%;bottom:56px;transform:translateX(-50%);z-index:99999;' +
      'max-width:min(560px,calc(100vw - 32px));padding:8px 34px 8px 14px;border-radius:8px;' +
      'background:#3a2a00;color:#ffe08a;border:1px solid #f0b400;font:13px/1.4 system-ui,sans-serif;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.45)'
    var grande = function () {
      c.style.padding = '8px 34px 8px 14px'
      c.innerHTML = '<b>🎓 MODO PRÁCTICA</b> — sin SIDECEME. Abrí el ejercicio con ' +
        '<b>📁 Ejercicios → 📂 Abrir archivo JSON</b> (una sola vez). Lo tuyo se guarda solo en este navegador. ' +
        'Si la carta aparece vacía, tu trabajo está en <b>📁 Ejercicios → Abrir guardados</b>: no vuelvas a abrir el JSON.<br>' +
        '<button type="button" data-a="entregar" style="' + ESTILO_BOTON + '">📤 Entregar (bajar mi trabajo para el profesor)</button>' +
        '<button type="button" data-a="chico" aria-label="Achicar aviso" style="position:absolute;top:4px;right:6px;background:none;' +
        'border:0;color:#ffe08a;font-size:16px;cursor:pointer">✕</button>'
    }
    var chico = function () {
      c.style.padding = '4px 8px'
      c.innerHTML = '<b>🎓 PRÁCTICA</b> <button type="button" data-a="entregar" style="' + ESTILO_BOTON + ';margin:0 0 0 6px;padding:3px 10px">📤 Entregar</button>' +
        '<button type="button" data-a="grande" aria-label="Ver los pasos" style="margin-left:4px;background:none;border:0;color:#ffe08a;cursor:pointer">▴</button>'
    }
    c.addEventListener('click', function (e) {
      var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a')
      if (a === 'entregar') entregar()
      else if (a === 'chico') chico()
      else if (a === 'grande') grande()
    })
    grande()
    document.body.appendChild(c)
  }

  // ─── 📤 Entregar ───
  var entregando = false
  function entregar() {
    if (entregando) return
    var nombre = abierto()
    if (!nombre) { alert('Primero abrí tu ejercicio: 📁 Ejercicios → Abrir guardados (o 📂 Abrir archivo JSON si todavía no lo abriste nunca).'); return }
    var alumno = (prompt('Tu grado y nombre completo (así le llega al profesor):', lee(CLAVE_ALUMNO)) || '').replace(/\s+/g, ' ').trim()
    if (!alumno) return
    guarda(CLAVE_ALUMNO, alumno)
    entregando = true
    // Guardar YA (tocar el sello 💾) para que no quede afuera lo último que escribió.
    var sello = document.querySelector('button.sello-guardado')
    if (sello && !sello.disabled) sello.click()
    esperar(function () {
      var s = document.querySelector('button.sello-guardado')
      var e = s && s.getAttribute('data-estado')
      return !s || e === 'al-dia' || e === 'error' || e === 'finalizado' ? (e || 'sin-sello') : null
    }, 15000).then(function (estado) {
      if (estado === 'error') alert('⚠️ El navegador no pudo guardar lo último (mirá el sello 💾 arriba). Se entrega lo último que sí se guardó.')
      return guardados()
    }).then(function (ej) {
      var reg = ej.filter(function (e) { return e.nombre === nombre })[0]
      if (!reg || !reg.datos) throw new Error('no encontré «' + nombre + '» guardado en este navegador')
      var datos = JSON.parse(JSON.stringify(reg.datos))
      datos.nombre = 'G-4 · ' + alumno
      datos.entregaPractica = { alumno: alumno, ejercicio: nombre, entregadoEn: new Date().toISOString() }
      var d = new Date(), dd = function (n) { return (n < 10 ? '0' : '') + n }
      var archivo = 'ENTREGA_G4_' + alumno.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) +
        '_' + d.getFullYear() + '-' + dd(d.getMonth() + 1) + '-' + dd(d.getDate()) + '_' + dd(d.getHours()) + dd(d.getMinutes()) + '.json'
      var url = URL.createObjectURL(new Blob([JSON.stringify(datos)], { type: 'application/json' }))
      var a = document.createElement('a')
      a.href = url; a.download = archivo
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(function () { URL.revokeObjectURL(url) }, 60000)
      aviso('<b>📤 Se bajó «' + esc(archivo) + '»</b> (está en <b>Descargas</b>). Mandalo por <b>WhatsApp</b> al profesor ' +
        'como <b>documento</b> (📎 → Documento). Podés seguir trabajando y volver a entregar: vale el último.', 30000)
    }).catch(function (e) {
      alert('⚠️ No se pudo entregar: ' + (e && e.message || e) + '. Probá con 📁 Ejercicios → ⬇️ Bajar el ejercicio (.zip).')
    }).then(function () { entregando = false })
  }

  // ─── volver a abrir el último ejercicio ───
  function reabrir() {
    esperar(boton, 60000).then(function (b) {
      if (!b) return
      // Un respiro para que la Mesa termine de arrancar.
      setTimeout(function () {
        if (abierto()) return
        guardados().then(function (ej) {
          ej = ej[0]
          if (!ej || abierto()) return
          b.click()
          esperar(function () { return $$('button').filter(function (x) { return x.textContent.trim() === 'Abrir guardados' })[0] }, 5000).then(function (pestaña) {
            if (!pestaña) return
            pestaña.click()
            esperar(function () {
              var fila = $$('span').filter(function (s) { return s.textContent.trim() === '📄 ' + ej.nombre })[0]
              return fila && fila.parentElement && fila.parentElement.querySelector('button')
            }, 5000).then(function (btn) {
              if (!btn) return
              btn.click()
              esperar(abierto, 20000).then(function (ok) {
                if (!ok) return
                // Si la ventana de 📁 Ejercicios quedó abierta, se cierra con su ✕.
                var h = $$('h3').filter(function (x) { return x.textContent.trim() === '📁 Ejercicios' })[0]
                var x = h && h.parentElement && h.parentElement.querySelector('button')
                if (x && x.textContent.trim() === '✕') x.click()
                var g = new Date(ej.guardadoEn)
                aviso('<b>✅ Se volvió a abrir tu ejercicio «' + esc(ej.nombre) + '»</b>' +
                  (isNaN(g) ? '' : ' (guardado el ' + esc(g.toLocaleDateString()) + ' a las ' + esc(g.toLocaleTimeString().slice(0, 5)) + ')') +
                  '. Seguí trabajando: <b>no</b> vuelvas a abrir el archivo JSON.')
              })
            })
          })
        })
      }, 2500)
    })
  }

  function arrancar() { cartel(); reabrir() }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar)
  else arrancar()
})()
