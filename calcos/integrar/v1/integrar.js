/* 🧩 INTEGRAR — el JEM junta en SU ejercicio el trabajo que cada G hizo en su computadora (30-10-2026).

   Lo pidió Sergio: «que cada G vaya generando su trabajo y lo vaya integrando el JEM… y también
   pueda copiarle a los G sus trabajos integrados… lo que me preocupa es que al integrar mezcle
   algunas cosas y se vuelva un espagueti o cruce de información, entonces tal vez pueda elegir las
   hojas de trabajo o documentos e integrarlos», y «el trabajo se realizará cada uno en su
   computadora y no se lo desarrollará en línea».

   Cómo se usa (sin red entre las computadoras: el archivo va por USB, correo o WhatsApp):
     1. Cada G trabaja en su Mesa y baja su archivo con «💾 Guardar como» (EJERCICIO_….json).
     2. El JEM, con su ejercicio abierto, toca «🧩 Integrar», abre los archivos de los G y marca
        qué hojas trae de cada uno. Sólo vienen marcadas las hojas de la sección dueña del archivo
        (el G-1 trae las del G-1): las copias viejas que ese archivo tenga de otras secciones NO se
        marcan solas. Una hoja se trae de UN solo archivo.
     3. «✅ Integrar» pone esas hojas en el ejercicio del JEM, una por una, en su lugar; lo que no
        se marcó no se toca. «↩️ Deshacer» vuelve a como estaba.
     4. «📤 Guardar el integrado para los G» baja el ejercicio del JEM. Cada G lo abre con su propio
        «🧩 Integrar»: como el archivo es del JEM, vienen marcadas las hojas de TODAS las secciones
        menos la suya, así no pierde lo que siguió haciendo.

   Dónde vive cada hoja en el ejercicio (la foto que arma la Mesa, la misma del JSON):
     G-1, G-4, G-5, CMTE., JEM y EME → hojasG.<sección>.<hoja>; G-2 → picb.<hoja>; G-3 → g3.<hoja>;
     las hojas del CMTE. y del JEM marcadas «compartida: 'g3'» (la Línea de Tiempo, el Programa
     General de Planeamiento, la Guía Inicial…) → g3.<hoja>, y son de quien las declara.
   Los nombres de las hojas los da el compilado (window.SIDCatalogoHojas) y el ejercicio se pone
   en la pantalla con la misma función que abre un ejercicio (window.SIDMesaCargar). */
(function (raiz, fabrica) {
  var R = fabrica()
  if (typeof module === 'object' && module.exports) module.exports = R
  else {
    raiz.SIDIntegrar = R
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', R.iniciar)
    else R.iniciar()
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict'

  // ─── puro (se prueba en Node) ──────────────────────────────────────────────────────────

  // En el orden de la Mesa. `ruta`: dónde guarda sus hojas en el ejercicio.
  var SECCIONES = [
    { id: 'cmte', nom: 'Comandante', corto: 'CMTE.', ruta: ['hojasG', 'cmte'] },
    { id: 'jem', nom: 'Jefe de Estado Mayor', corto: 'JEM', ruta: ['hojasG', 'jem'] },
    { id: 'g1', nom: 'G-1 Personal', corto: 'G-1', ruta: ['hojasG', 'g1'] },
    { id: 'g2', nom: 'G-2 Inteligencia', corto: 'G-2', ruta: ['picb'] },
    { id: 'g3', nom: 'G-3 Operaciones', corto: 'G-3', ruta: ['g3'] },
    { id: 'g4', nom: 'G-4 Logística', corto: 'G-4', ruta: ['hojasG', 'g4'] },
    { id: 'g5', nom: 'G-5 Asuntos Civiles', corto: 'G-5', ruta: ['hojasG', 'g5'] },
    { id: 'eme', nom: 'Estado Mayor Especial', corto: 'EME', ruta: ['hojasG', 'eme'] },
  ]
  var SECC = {}
  SECCIONES.forEach(function (s) { SECC[s.id] = s })
  // Lo dibujado en la carta: va entero (no se puede mezclar a medias) y nunca se marca solo.
  var CARTA = [
    { id: 'unidades', nom: 'Unidades puestas en la carta' },
    { id: 'ops', nom: 'Tareas, límites y medidas de coordinación de la carta' },
    { id: 'fasesCOA', nom: 'Fases de los cursos de acción (propio y enemigo)' },
    { id: 'orgTarea', nom: 'Organización de la tarea' },
  ]

  function tiene(v) {
    if (v == null) return false
    if (typeof v === 'string') return v.trim() !== ''
    if (typeof v === 'number') return isFinite(v)
    if (typeof v === 'boolean') return v
    if (Array.isArray(v)) return v.some(tiene)
    if (typeof v === 'object') { for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k) && tiene(v[k])) return true }
    return false
  }
  // JSON con las claves ordenadas: dos hojas iguales escritas en otro orden son iguales.
  function canon(v) {
    if (v === undefined) return 'null'
    if (v === null || typeof v !== 'object') return JSON.stringify(v)
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'
    return '{' + Object.keys(v).sort().filter(function (k) { return v[k] !== undefined }).map(function (k) { return JSON.stringify(k) + ':' + canon(v[k]) }).join(',') + '}'
  }
  function clonar(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)) }
  function en(o, ruta) { for (var i = 0; i < ruta.length; i++) { if (!o || typeof o !== 'object') return undefined; o = o[ruta[i]] } return o }

  // Las hojas que existen, con dónde se guardan y de quién son. `catalogo`: {cmte:[fases], jem, g1,
  // g2, g3, g4, g5, eme} con fases {hojas:[{id,num,nom,tipo,compartida}]} (window.SIDCatalogoHojas()).
  function indice(catalogo) {
    var hojas = [], vistas = {}
    SECCIONES.forEach(function (s) {
      ;((catalogo && catalogo[s.id]) || []).forEach(function (fase) {
        ;((fase && fase.hojas) || []).forEach(function (h) {
          if (!h || !h.id || h.tipo === 'remite') return
          var ruta = h.compartida === 'g3' && s.id !== 'g3' ? ['g3', h.id] : s.ruta.concat(h.id), clave = ruta.join('/')
          if (vistas[clave]) return // la del G-3 que es del JEM o del CMTE.: ya está con su dueño
          vistas[clave] = 1
          hojas.push({ clave: clave, ruta: ruta, seccion: s.id, id: h.id, num: h.num || '', nom: h.nom || h.id, fase: (fase && (fase.corto || fase.nom)) || '' })
        })
      })
    })
    return hojas
  }

  // Lo que trae `archivo` comparado con `base` (el ejercicio abierto). Sólo lo que el archivo trae
  // con algo escrito. estado: 'nueva' (en el tuyo está vacía), 'distinta' o 'igual'.
  function comparar(base, archivo, catalogo) {
    base = base || {}; archivo = archivo || {}
    var items = [], conocidas = {}
    function poner(it, va, ya) {
      if (!tiene(va)) return
      it.estado = !tiene(ya) ? 'nueva' : canon(va) === canon(ya) ? 'igual' : 'distinta'
      it.valor = va
      items.push(it)
    }
    indice(catalogo).forEach(function (h) {
      conocidas[h.clave] = 1
      poner({ grupo: 'hoja', clave: h.clave, ruta: h.ruta, seccion: h.seccion, id: h.id, num: h.num, nom: h.nom, fase: h.fase }, en(archivo, h.ruta), en(base, h.ruta))
    })
    // lo que el catálogo no nombra (datos propios de la sección): con su clave, de la sección dueña
    SECCIONES.forEach(function (s) {
      var caja = en(archivo, s.ruta)
      if (!caja || typeof caja !== 'object' || Array.isArray(caja)) return
      Object.keys(caja).forEach(function (k) {
        var ruta = s.ruta.concat(k), clave = ruta.join('/')
        if (conocidas[clave]) return
        poner({ grupo: 'hoja', clave: clave, ruta: ruta, seccion: s.id, id: k, num: '', nom: 'Otros datos: ' + k, fase: '', otro: true }, caja[k], en(base, ruta))
      })
    })
    CARTA.forEach(function (c) {
      poner({ grupo: 'carta', clave: 'carta/' + c.id, ruta: [c.id], seccion: 'g3', id: c.id, num: '🗺️', nom: c.nom }, archivo[c.id], base[c.id])
    })
    var mios = {}
    ;(Array.isArray(base.documentos) ? base.documentos : []).forEach(function (d) { if (d && d.nombre) mios[d.nombre] = d })
    ;(Array.isArray(archivo.documentos) ? archivo.documentos : []).forEach(function (d) {
      if (!d || !d.nombre) return
      poner({ grupo: 'documento', clave: 'documentos/' + d.nombre, ruta: null, seccion: null, id: d.nombre, num: '📎', nom: d.nombre }, d, mios[d.nombre])
    })
    return items
  }

  // De quién es un archivo: la Mesa guarda el puesto con el que se trabajó (puestoActivo); si no,
  // el nombre del archivo («EJERCICIO_CE-I_G-1_…», «G1 CE-I.json»…).
  function deQuien(datos, nombreArchivo) {
    var p = datos && datos.puestoActivo
    if (p && SECC[p]) return p
    var n = ' ' + String(nombreArchivo || '').toUpperCase().replace(/[_.\-\s]+/g, ' ') + ' '
    if (/ INTEGRADO /.test(n) || / JEM /.test(n)) return 'jem'
    if (/ CMTE /.test(n) || / COMANDANTE /.test(n)) return 'cmte'
    if (/ EME /.test(n)) return 'eme'
    var m = n.match(/ G ?([1-5]) /)
    return m ? 'g' + m[1] : ''
  }

  // Lo que se marca solo. Un archivo del G-x trae marcadas sus hojas nuevas o cambiadas; el del
  // JEM (el integrado) las de todas las secciones menos la de quien lo recibe (`mio`). La carta y
  // las hojas de otras secciones se marcan a mano. Un documento nuevo se trae.
  function sugerida(it, de, mio) {
    if (it.estado === 'igual') return false
    if (it.grupo === 'documento') return it.estado === 'nueva'
    if (it.grupo === 'carta' || !de) return false
    if (de === 'jem') return it.seccion !== mio
    return it.seccion === de
  }

  // `elegidas`: [{clave, item}] (cada clave una sola vez). Devuelve el ejercicio nuevo; `base` no se toca.
  function integrar(base, elegidas) {
    var d = clonar(base || {}), hechas = []
    ;(elegidas || []).forEach(function (e) {
      var it = e.item, v = clonar(it.valor)
      if (it.grupo === 'documento') {
        var l = Array.isArray(d.documentos) ? d.documentos : (d.documentos = []), i = -1
        l.forEach(function (x, j) { if (x && x.nombre === it.id) i = j })
        if (i >= 0) l[i] = v; else l.push(v)
      } else {
        var o = d
        for (var k = 0; k < it.ruta.length - 1; k++) {
          if (!o[it.ruta[k]] || typeof o[it.ruta[k]] !== 'object' || Array.isArray(o[it.ruta[k]])) o[it.ruta[k]] = {}
          o = o[it.ruta[k]]
        }
        o[it.ruta[it.ruta.length - 1]] = v
      }
      hechas.push(it)
    })
    return { datos: d, hechas: hechas }
  }

  function pad(n) { return (n < 10 ? '0' : '') + n }
  function limpio(n) { return String(n || '').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_').slice(0, 80) || 'ejercicio' }
  function archivoIntegrado(nombre, ms) {
    var f = new Date(ms)
    return 'INTEGRADO-JEM_' + limpio(nombre) + '_' + f.getFullYear() + '-' + pad(f.getMonth() + 1) + '-' + pad(f.getDate()) + '_' + pad(f.getHours()) + pad(f.getMinutes()) + '.json'
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }

  // ─── en el navegador ───────────────────────────────────────────────────────────────────
  // est.archivos: [{nombre, datos, de, items, marcadas:{clave:true}, abiertas:{grupo:true}}]
  var est = { ver: false, mio: '', archivos: [], antes: null, aviso: '', tipoAviso: '' }
  var btn = null, pan = null, entrada = null

  function mesa() { return window.SIDMesaEjercicio || null }
  function nombreAbierto() { try { var M = mesa(); return (M && M.nombre && M.nombre()) || '' } catch (e) { return '' } }
  function fotoActual() { var M = mesa(); return M && M.foto ? clonar(M.foto()) : null }
  function catalogo() { try { return window.SIDCatalogoHojas ? window.SIDCatalogoHojas() : null } catch (e) { return null } }
  // Quién está en esta Mesa: el puesto del ejercicio, el del enlace (?puesto=g1) o el que recuerda
  // el navegador (pmtd_puesto_recordado, del compilado); si no, el JEM.
  function puestoPropio(f) {
    var p = f && f.puestoActivo
    if (!SECC[p]) try { p = new URL(window.location.href).searchParams.get('puesto') } catch (e) {}
    if (!SECC[p]) try { p = localStorage.getItem('pmtd_puesto_recordado') } catch (e) {}
    return SECC[p] ? p : 'jem'
  }
  function finalizado() { return !!document.querySelector('.sello-guardado[data-estado="finalizado"]') }
  function avisar(t, tipo) { est.aviso = t; est.tipoAviso = tipo || '' }

  // Si el JEM elige una hoja en un archivo, se desmarca en los demás: una hoja viene de un solo lado.
  function marcar(ai, clave, si) {
    var a = est.archivos[ai]
    if (!a) return
    if (!si) { delete a.marcadas[clave]; return }
    est.archivos.forEach(function (b, bi) {
      if (bi !== ai && b.marcadas[clave]) {
        delete b.marcadas[clave]
        var it = a.items.filter(function (x) { return x.clave === clave })[0]
        avisar('ℹ️ «' + ((it && (it.num ? it.num + ' ' : '') + it.nom) || clave) + '» venía de ' + b.nombre + ': ahora se trae de ' + a.nombre + '. Una hoja se trae de un solo archivo.', 'info')
      }
    })
    a.marcadas[clave] = true
  }
  function remarcar(ai) {
    var a = est.archivos[ai]
    a.marcadas = {}
    a.items.forEach(function (it) {
      if (!sugerida(it, a.de, est.mio)) return
      var otra = est.archivos.some(function (b, bi) { return bi !== ai && b.marcadas[it.clave] })
      if (!otra) a.marcadas[it.clave] = true
    })
  }
  function recomparar() {
    var base = fotoActual() || {}, cat = catalogo()
    est.archivos.forEach(function (a) { a.items = comparar(base, a.datos, cat) })
  }

  function leerArchivos(lista) {
    var base = fotoActual()
    if (!base) { avisar('Abrí primero tu ejercicio (📁) y después los archivos de los G.', 'error'); return pintar() }
    if (!est.mio) est.mio = puestoPropio(base)
    var cat = catalogo()
    Promise.all(Array.prototype.map.call(lista, function (f) {
      return f.text().then(function (t) {
        var d
        try { d = JSON.parse(t) } catch (e) { return { error: f.name + ': no es un archivo JSON.' } }
        if (!d || typeof d !== 'object' || Array.isArray(d) || (!d.hojasG && !d.picb && !d.g3 && !d.unidades)) return { error: f.name + ': no es un ejercicio de la Mesa (bajalo con «💾 Guardar como»).' }
        return { nombre: f.name, datos: d }
      }, function (e) { return { error: f.name + ': ' + ((e && e.message) || e) } })
    })).then(function (rs) {
      var malos = [], nuevos = 0
      rs.forEach(function (r) {
        if (r.error) return malos.push(r.error)
        var a = { nombre: r.nombre, datos: r.datos, de: deQuien(r.datos, r.nombre), items: comparar(base, r.datos, cat), marcadas: {}, abiertas: {} }
        est.archivos.push(a)
        remarcar(est.archivos.length - 1)
        nuevos++
      })
      avisar(malos.length ? '⚠️ ' + malos.join(' · ') : nuevos ? '✓ ' + nuevos + ' archivo(s) abiertos. Revisá lo marcado y tocá «✅ Integrar».' : '', malos.length ? 'error' : 'ok')
      pintar()
    })
  }

  function elegidas() {
    var l = []
    est.archivos.forEach(function (a) {
      a.items.forEach(function (it) { if (a.marcadas[it.clave]) l.push({ clave: it.clave, item: it, de: a.nombre }) })
    })
    return l
  }

  function aplicar() {
    var cargar = window.SIDMesaCargar, nombre = nombreAbierto(), base = fotoActual()
    if (!cargar || !base || !nombre) { avisar('Abrí primero tu ejercicio (📁). Si ya está abierto, recargá la página: esta versión de la Mesa no permite integrar.', 'error'); return pintar() }
    if (finalizado()) { avisar('🔒 Tu ejercicio está finalizado: no se le pueden integrar hojas.', 'error'); return pintar() }
    var l = elegidas()
    if (!l.length) { avisar('No hay nada marcado para integrar.', 'error'); return pintar() }
    var cartas = l.filter(function (e) { return e.item.grupo === 'carta' })
    if (cartas.length && !window.confirm('Vas a reemplazar lo de tu carta (' + cartas.map(function (e) { return e.item.nom }).join(', ') + ') por lo del archivo. ¿Seguro?')) return
    var r = integrar(base, l)
    r.datos.finalizado = false
    try { cargar(r.datos, nombre) } catch (e) { avisar('⚠️ No se pudo integrar: ' + ((e && e.message) || e), 'error'); return pintar() }
    est.antes = { datos: base, nombre: nombre, n: l.length }
    // Lo integrado ya está en tu ejercicio: los archivos se vuelven a comparar (quedan «iguales»).
    setTimeout(function () {
      recomparar()
      est.archivos.forEach(function (a, i) { remarcar(i) })
      pintar()
    }, 400)
    avisar('✓ Integradas ' + l.length + ' hoja(s): ' + l.map(function (e) { return (e.item.num ? e.item.num + ' ' : '') + e.item.nom + ' (de ' + e.de + ')' }).join(' · ') + '. Se guarda solo. Si algo no era, «↩️ Deshacer».', 'ok')
    pintar()
  }

  function deshacer() {
    var a = est.antes
    if (!a || !window.SIDMesaCargar) return
    if (nombreAbierto() !== a.nombre) { avisar('Abriste otro ejercicio: ya no se puede deshacer la integración de «' + a.nombre + '».', 'error'); est.antes = null; return pintar() }
    window.SIDMesaCargar(a.datos, a.nombre)
    est.antes = null
    setTimeout(function () { recomparar(); est.archivos.forEach(function (x, i) { remarcar(i) }); pintar() }, 400)
    avisar('↩️ Listo: tu ejercicio volvió a como estaba antes de integrar.', 'ok')
    pintar()
  }

  function bajarIntegrado() {
    var nombre = nombreAbierto(), d = fotoActual()
    if (!d || !nombre) { avisar('Abrí primero tu ejercicio (📁).', 'error'); return pintar() }
    var ahora = Date.now(), archivo = archivoIntegrado(nombre, ahora)
    d.guardadoEn = new Date(ahora).toISOString()
    var u = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' })), a = document.createElement('a')
    a.href = u; a.download = archivo; document.body.appendChild(a); a.click(); a.remove()
    setTimeout(function () { URL.revokeObjectURL(u) }, 4000)
    avisar('⬇️ Descarga solicitada: ' + archivo + '. Pasáselo a cada G: lo abre con su «🧩 Integrar» y trae las hojas de los demás sin perder las suyas.', 'ok')
    pintar()
  }

  // ── la pantalla ──
  function opcionesSeccion(sel, conVacia) {
    return (conVacia ? '<option value=""' + (!sel ? ' selected' : '') + '>¿de quién es? (elegí)</option>' : '') +
      SECCIONES.map(function (s) { return '<option value="' + s.id + '"' + (s.id === sel ? ' selected' : '') + '>' + esc(s.corto + ' · ' + s.nom) + '</option>' }).join('')
  }
  var ESTADO = { nueva: '🆕 nueva', distinta: '✏️ distinta de la tuya', igual: '✓ igual a la tuya' }
  function fila(ai, it, a) {
    var id = 'sid-integ-' + ai + '-' + it.clave.replace(/[^A-Za-z0-9_-]/g, '_')
    var dis = it.estado === 'igual'
    return '<li class="' + it.estado + '"><input type="checkbox" id="' + esc(id) + '" data-i="marcar" data-a="' + ai + '" data-c="' + esc(it.clave) + '"' + (a.marcadas[it.clave] ? ' checked' : '') + (dis ? ' disabled' : '') + '>' +
      '<label for="' + esc(id) + '"><b>' + esc(it.num) + '</b> ' + esc(it.nom) + (it.fase ? ' <small>· ' + esc(it.fase) + '</small>' : '') + '</label><span class="est">' + ESTADO[it.estado] + '</span></li>'
  }
  function bloque(ai, a, clave, titulo, items, abierto, nota) {
    if (!items.length) return ''
    var abre = a.abiertas[clave] != null ? a.abiertas[clave] : abierto
    var marc = items.filter(function (it) { return a.marcadas[it.clave] }).length
    return '<details data-a="' + ai + '" data-g="' + esc(clave) + '"' + (abre ? ' open' : '') + '><summary>' + esc(titulo) + ' <small>(' + items.length + (marc ? ' · ' + marc + ' marcada' + (marc > 1 ? 's' : '') : '') + ')</small></summary>' +
      (nota ? '<p class="nota">' + nota + '</p>' : '') + '<ul>' + items.map(function (it) { return fila(ai, it, a) }).join('') + '</ul></details>'
  }
  function tarjeta(a, ai) {
    var nombre = nombreAbierto(), suyo = a.datos.nombre || '', otro = suyo && nombre && suyo !== nombre
    var utiles = a.items.filter(function (it) { return it.estado !== 'igual' }), iguales = a.items.length - utiles.length
    var propias = utiles.filter(function (it) { return it.grupo === 'hoja' && (a.de === 'jem' ? it.seccion !== est.mio : it.seccion === a.de) })
    var ajenas = utiles.filter(function (it) { return it.grupo === 'hoja' && propias.indexOf(it) < 0 })
    var h = '<section class="archivo"><div class="cab"><b>📄 ' + esc(a.nombre) + '</b><button type="button" class="chico" data-i="quitar" data-a="' + ai + '" title="Quitar este archivo de la lista">✕</button></div>' +
      '<label class="de">Es el trabajo del: <select data-i="de" data-a="' + ai + '">' + opcionesSeccion(a.de, true) + '</select></label>' +
      (otro ? '<p class="nota error">⚠️ Este archivo es del ejercicio «' + esc(suyo) + '» y vos tenés abierto «' + esc(nombre) + '». Revisá que sea el mismo ejercicio antes de integrar.</p>' : '')
    if (!a.de) h += '<p class="nota error">Elegí de quién es el archivo y se marcan solas sus hojas.</p>'
    if (!utiles.length) h += '<p class="nota ok">✓ Todo lo que trae este archivo ya está igual en tu ejercicio.</p>'
    // las del dueño por sección; las demás, plegadas
    SECCIONES.forEach(function (s) {
      var l = propias.filter(function (it) { return it.seccion === s.id })
      h += bloque(ai, a, 'p-' + s.id, (a.de === 'jem' ? '' : '✅ ') + s.corto + ' · ' + s.nom, l, true, '')
    })
    if (ajenas.length) {
      h += bloque(ai, a, 'ajenas', '⚠️ Hojas de otras secciones que trae este archivo', ajenas, false,
        a.de === 'jem' ? 'Son <b>tus</b> hojas (' + esc(SECC[est.mio] ? SECC[est.mio].corto : est.mio) + ') según el archivo del JEM: no se marcan para no pisar lo que seguiste haciendo.' :
          'Pueden ser copias viejas que ese G tenía. No se marcan solas para no cruzar información: marcalas sólo si sabés que son las buenas.')
    }
    h += bloque(ai, a, 'carta', '🗺️ Lo dibujado en la carta (va entero)', utiles.filter(function (it) { return it.grupo === 'carta' }), false, 'Reemplaza TODO lo de tu carta en ese rubro por lo del archivo. Nunca se marca solo.')
    h += bloque(ai, a, 'docs', '📎 Documentos adjuntados', utiles.filter(function (it) { return it.grupo === 'documento' }), true, '')
    if (iguales) h += '<p class="nota">' + iguales + ' hoja(s) ya iguales a las tuyas (no hace falta traerlas).</p>'
    return h + '</section>'
  }
  function pintar() {
    if (!pan) return
    if (btn) btn.setAttribute('aria-expanded', String(est.ver))
    pan.hidden = !est.ver
    if (!est.ver) return
    setTimeout(colocar, 0)
    var nombre = nombreAbierto(), n = elegidas().length
    var mio = est.mio || puestoPropio(fotoActual())
    est.mio = mio
    var h = '<div class="cab"><b>🧩 Integrar el trabajo de los G · ' + esc(nombre || 'sin ejercicio abierto') + '</b><button type="button" class="chico" data-i="cerrar">✕</button></div>' +
      '<p class="nota">Cada G baja su trabajo con <b>💾 Guardar como</b> y te pasa el archivo (USB, correo, WhatsApp). Acá abrís esos archivos, elegís <b>qué hojas</b> traer y la Mesa las pone en tu ejercicio, cada una en su lugar. Lo que no marques no se toca.</p>' +
      '<label class="de">Yo soy: <select data-i="mio">' + opcionesSeccion(mio, false) + '</select></label>' +
      '<button type="button" class="grande" data-i="abrir"' + (nombre ? '' : ' disabled') + '>📂 Abrir archivos de los G (.json)</button>' +
      (nombre ? '' : '<p class="nota error">Abrí primero tu ejercicio con 📁.</p>') +
      est.archivos.map(tarjeta).join('') +
      (est.archivos.length ? '<button type="button" class="grande ok" data-i="integrar"' + (n ? '' : ' disabled') + '>✅ Integrar ' + n + ' hoja' + (n === 1 ? '' : 's') + ' marcada' + (n === 1 ? '' : 's') + '</button>' : '') +
      (est.antes ? '<button type="button" class="grande chico" data-i="deshacer">↩️ Deshacer la última integración (' + est.antes.n + ')</button>' : '') +
      '<button type="button" class="grande chico" data-i="bajar"' + (nombre ? '' : ' disabled') + ' title="Baja tu ejercicio tal como está para repartirlo a los G">📤 Guardar el integrado para los G</button>' +
      (est.aviso ? '<p role="status" class="nota ' + esc(est.tipoAviso) + '">' + esc(est.aviso) + '</p>' : '')
    var y = pan.scrollTop
    pan.innerHTML = h
    pan.scrollTop = y
  }
  function crear() {
    if (document.getElementById('sid-integ-btn')) return
    btn = document.createElement('button')
    btn.type = 'button'; btn.id = 'sid-integ-btn'; btn.textContent = '🧩 Integrar'
    btn.setAttribute('aria-controls', 'sid-integ-panel')
    btn.title = 'JEM: juntar en tu ejercicio las hojas que cada G trabajó en su computadora, y repartir el integrado.'
    btn.addEventListener('click', function () { est.ver = !est.ver; if (est.ver) { recomparar(); est.aviso = '' } pintar() })
    pan = document.createElement('div'); pan.id = 'sid-integ-panel'; pan.hidden = true; pan.setAttribute('role', 'region'); pan.setAttribute('aria-label', 'Integrar el trabajo de los G')
    entrada = document.createElement('input'); entrada.type = 'file'; entrada.accept = '.json,application/json'; entrada.multiple = true; entrada.hidden = true
    entrada.setAttribute('aria-label', 'Archivos JSON de los G')
    entrada.addEventListener('change', function () { var l = Array.prototype.slice.call(entrada.files || []); entrada.value = ''; if (l.length) leerArchivos(l) })
    document.body.appendChild(btn); document.body.appendChild(pan); document.body.appendChild(entrada)
    pan.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-i]')
      if (!b) return
      var q = b.getAttribute('data-i'), ai = +b.getAttribute('data-a')
      if (q === 'cerrar') { est.ver = false; pintar() }
      else if (q === 'abrir') entrada.click()
      else if (q === 'quitar') { est.archivos.splice(ai, 1); est.aviso = ''; pintar() }
      else if (q === 'integrar') aplicar()
      else if (q === 'deshacer') deshacer()
      else if (q === 'bajar') bajarIntegrado()
    })
    pan.addEventListener('change', function (e) {
      var t = e.target, q = t.getAttribute && t.getAttribute('data-i'), ai = +t.getAttribute('data-a')
      if (q === 'marcar') { est.aviso = ''; marcar(ai, t.getAttribute('data-c'), t.checked); pintar() }
      else if (q === 'de') { est.archivos[ai].de = t.value; est.aviso = ''; remarcar(ai); pintar() }
      else if (q === 'mio') { est.mio = t.value; est.aviso = ''; est.archivos.forEach(function (a, i) { if (a.de === 'jem') remarcar(i) }); pintar() }
    })
    pan.addEventListener('toggle', function (e) {
      var d = e.target
      if (d && d.tagName === 'DETAILS' && est.archivos[+d.getAttribute('data-a')]) est.archivos[+d.getAttribute('data-a')].abiertas[d.getAttribute('data-g')] = d.open
    }, true)
  }
  // A la izquierda de «💾 Guardar como» (que está a la izquierda del selector de modalidad).
  function colocar() {
    if (!btn) return
    var g = document.getElementById('sid-resg-btn'), r = g && g.getBoundingClientRect(), s = btn.style
    if (r && r.width) {
      var izq = Math.round(r.left - btn.offsetWidth - 6)
      if (izq >= 4) { s.top = Math.round(r.top) + 'px'; s.left = izq + 'px' }
      else { s.top = Math.round(r.top > window.innerHeight / 2 ? r.top - btn.offsetHeight - 6 : r.bottom + 6) + 'px'; s.left = Math.max(4, Math.round(r.left)) + 'px' }
      s.right = 'auto'
    } else { s.top = '8px'; s.left = 'auto'; s.right = '150px' }
    if (!pan || pan.hidden) return
    var b = btn.getBoundingClientRect(), abajo = b.top < window.innerHeight / 2
    pan.style.top = abajo ? Math.round(b.bottom + 6) + 'px' : 'auto'
    pan.style.bottom = abajo ? 'auto' : Math.round(window.innerHeight - b.top + 6) + 'px'
  }
  var iniciado = false
  function iniciar() {
    if (iniciado) return
    iniciado = true
    crear(); colocar()
    setInterval(colocar, 700)
    window.addEventListener('resize', colocar)
  }

  return {
    // puro
    SECCIONES: SECCIONES, CARTA: CARTA, tiene: tiene, canon: canon, indice: indice, comparar: comparar, deQuien: deQuien, sugerida: sugerida, integrar: integrar, archivoIntegrado: archivoIntegrado,
    // en el navegador
    iniciar: iniciar, leerArchivos: leerArchivos, aplicar: aplicar, deshacer: deshacer, bajarIntegrado: bajarIntegrado, marcar: marcar,
    get estado() { return est },
  }
})
