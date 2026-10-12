/* MODALIDAD de la Mesa del EM: 🎖️ Mesa completa · 🎓 Aprendizaje · 🧑‍🏫 Profesor.
   Código aparte del compilado (como la piel Pandora): no toca React ni guarda nada en el
   ejercicio. Agrega un selector arriba (al lado de «Vista clásica») y, en las modalidades
   Aprendizaje y Profesor, un tablero a la derecha que REEMPLAZA la columna CMTE./JEM./G-1…G-5:
   · Aprendizaje: las 7 fases del PMTD con sus pasos en orden (Visión Horizontal 2020). Cada paso
     dice qué se hace, qué documento sale y quién lo hace, y «Abrir» lleva a la hoja real de la
     Mesa (abre el panel de la sección, su pestaña y la hoja). El alumno marca lo hecho.
   · Profesor: los pasos para armar el ejercicio, en orden, con la herramienta real de cada uno,
     el escalón (yo soy el Cmte. de X, mis alumnos son los Cmtes. de Y) y el FOCO (qué G entrena
     el ejercicio). Cada paso tiene «🤖 Pedido a la IA» (ia-profesor.js arma el texto con el
     ejercicio de la Mesa; se copia o se baja y se le da a ChatGPT / Gemini / Claude); el de la
     Orden saca la OGO completa con sus anexos. En «Unidades» se inserta de una vez una
     organización tipo (FF.TT., C.E., División, Brigada, COE) de AZUL o de ROJO, o se pegan las
     fichas que devolvió la IA. Las fichas entran por el mismo puente que usa academico.js
     (MesaAcademica.sincronizar → agregarUnidades): no se toca el compilado. Debajo de cada pedido,
     «📥 La respuesta de la IA»: lo que contestó se guarda en la 📕 carpeta del profesor (carpeta.js)
     y entra en los pedidos de los pasos que siguen.
   Lo marcado, el escalón y el foco quedan en localStorage de ESTE navegador; la biblioteca y la
   carpeta, en su IndexedDB (no viajan con el ejercicio). El catálogo está en catalogo.js. Con
   «Mesa completa» no cambia nada. */
(function () {
  'use strict'
  var CAT = window.SIDModalidadCatalogo, IA = window.SIDIAProfesor, BIB = window.SIDBiblioteca, CARP = window.SIDCarpetaProfesor, OGO = window.SIDOgo
  var COH = window.SIDOgoCoherencia, MESA = window.SIDOgoMesa, CALCO = window.SIDOgoCalco // 11-10-2026: coherencia, unidades que faltan, calco gráfico
  if (!CAT) return
  var K_MODO = 'sid_modalidad', K_HECHO = 'sid_mod_hecho', K_FASE = 'sid_mod_fase', K_ESC = 'sid_mod_escalon', K_PLEGADO = 'sid_mod_plegado', K_FOCO = 'sid_mod_foco'
  var MODOS = [
    { id: 'mesa', rot: '🎖️ Mesa', title: 'La Mesa completa, como siempre: el instructor arma y reparte; cada G trabaja su tablero' },
    { id: 'aprendizaje', rot: '🎓 Aprendizaje', title: 'Un solo alumno hace TODO el PMTD, fase por fase y paso por paso' },
    { id: 'profesor', rot: '🧑‍🏫 Profesor', title: 'Armar un ejercicio para los alumnos, paso a paso, con las herramientas de la Mesa' }
  ]
  var body = document.body
  var modo = 'mesa', hecho = {}, fase = 1, escalon = 'ce', plegado = false, panel = null, sel = null, firma = ''
  // tapado: un tablero de la Mesa (Unidades, Área de Ops, Mesa EM…) o el de Superponer ocupa la
  // columna derecha; el tablero se pliega solo mientras tanto. abiertoIgual: lo abrió el usuario
  // igual (se corre a la izquierda de ese tablero).
  var tapado = false, abiertoIgual = false
  var biblio = [], verBiblio = false, bibVer = 0, bibVista = '' // la biblioteca del profesor (IndexedDB «sid-biblioteca»)
  var foco = 'pmtd', iaPaso = 0, iaTexto = '', aviso = {}, puente = null // puente: lo último que la Mesa le mandó a MesaAcademica.sincronizar (ejercicio, fichas, centro, agregarUnidades)
  // 📕 la carpeta del profesor del ejercicio abierto (IndexedDB «sid-profesor»): las respuestas de la IA de cada paso
  var carpeta = CARP ? CARP.vacia('') : null, carpetaDe = null, verCarpeta = false, carVer = 0, carVista = 0, borrador = {}
  // 📜 la OGO completa del ejercicio abierto (IndexedDB «sid-profesor-ogo»): sus datos y lo que contestó la IA de cada documento
  var ogo = OGO ? OGO.vacio('') : null, ogoDe = null, ogoVer = 0, ogoAbierto = '', ogoPedido = '', ogoPedidoDe = 'pedido', ogoRev = null, ogoRevDoc = {}, ogoCache = {}, ogoBorr = {}, verOgoDatos = false
  var ogoEjUlt = null // el último ejercicio leído de la Mesa: lo de «Mesa · Preparación» se muestra como sugerencia en los datos de la Orden
  // 🔎 la revisión de coherencia (paso 11), 📍 las unidades que faltan (paso 12) y 📤 el reparto (paso 13)
  var cohAbierto = false, cohPedido = '', cohBorr = '', nuevoVer = 0, cohModo = '' // cohModo: 'actualizar' = el pedido para refrescar con la Mesa
  var rep = { destinos: null, destino: '', calcoId: '', nombre: '', ind: '', contenido: true, enemigo: false, otros: false, docs: null, ocupado: false, sinCiclos: false, sel: '', selDe: '' } // sel: la selección guardada que va (selDe: de qué ejercicio)

  function lee(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v } catch (e) { return d } }
  function guarda(k, v) { try { localStorage.setItem(k, v) } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  function texto(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim() }
  function botones(donde) {
    if (donde === 'barra') return document.querySelectorAll('.botones-mapa > button')
    if (donde === 'panel') return document.querySelectorAll('.panel button')
    if (donde === 'cmoc') return document.querySelectorAll('.btn-cmoc-abrir')
    return document.querySelectorAll('button')
  }
  function boton(re, donde) {
    var bs = botones(donde)
    for (var i = 0; i < bs.length; i++) if (re.test(texto(bs[i]))) return bs[i]
    return null
  }
  // la hoja (botón «F1·P3 Nombre…» de la lista de hojas), si está a la vista
  function botonHoja(num, nomRe) {
    var bs = document.querySelectorAll('button')
    for (var i = 0; i < bs.length; i++) {
      var t = texto(bs[i])
      if (t.indexOf(num) === 0 && (!nomRe || nomRe.test(t)) && !panel.contains(bs[i])) return bs[i]
    }
    return null
  }
  function hojaAbierta(num, nomRe) { // el título de la hoja ya abierta (número + nombre, sin ser botón)
    var vs = document.querySelectorAll('div, h3, h4')
    for (var i = 0; i < vs.length; i++) {
      var v = vs[i]
      if (v.children.length && v.children.length <= 3 && texto(v).indexOf(num) === 0 && (!nomRe || nomRe.test(texto(v))) && !panel.contains(v) && texto(v).length < 160) return v
    }
    return null
  }
  function espera(ms) { return new Promise(function (ok) { setTimeout(ok, ms) }) }
  // repite `f` hasta que devuelva algo o se acabe el tiempo
  function hasta(f, ms) {
    var t0 = Date.now()
    return new Promise(function (ok) {
      ;(function tic() { var r = f(); if (r || Date.now() - t0 > ms) ok(r || null); else setTimeout(tic, 150) })()
    })
  }

  // Abre una sección (botón CMTE./JEM./G-x/EME.), su pestaña de hojas y la hoja pedida.
  async function abrirHoja(ref) {
    var S = CAT.SECCIONES[ref.s]
    if (!S) return false
    var ya = ref.num && (botonHoja(ref.num, ref.nom) || hojaAbierta(ref.num, ref.nom))
    if (!ya) {
      var tab = S.pestana && boton(S.pestana)
      if (!tab) { // el panel de la sección no está abierto (o es Cmte./JEM/EME, que no tienen pestaña)
        var b = boton(S.boton, 'barra')
        if (!b) return false
        if (!S.pestana) { // sin pestaña: si ya hay hojas de la sección a la vista, el panel está abierto
          var volver = boton(/Volver a mis hojas/i)
          if (volver) volver.click()
          else if (!(await hasta(function () { return ref.num ? botonHoja(ref.num) : null }, 10))) b.click()
        } else b.click()
        tab = await hasta(function () { return S.pestana ? boton(S.pestana) : true }, 2500)
      }
      if (S.pestana && tab && tab !== true) {
        if (tab.getAttribute('aria-selected') !== 'true') tab.click()
        var volver2 = await hasta(function () { return boton(/Volver a mis hojas/i) }, 400)
        if (volver2) volver2.click()
      }
    }
    if (!ref.num) return true
    var h = await hasta(function () { return botonHoja(ref.num, ref.nom) || hojaAbierta(ref.num, ref.nom) }, 2500)
    if (!h) { // el G-3 agrupa sus documentos por fase: abrir la fase y volver a buscar
      var F = CAT.FASES[+ref.num.charAt(1) - 1]
      var bf = F && boton(new RegExp('^\\W*(F\\s*' + F.id + '\\b|' + F.id + '\\s*[·.·-])?\\s*' + F.corto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
      if (bf) { bf.click(); h = await hasta(function () { return botonHoja(ref.num, ref.nom) }, 1500) }
    }
    if (h && h.tagName === 'BUTTON') h.click()
    return !!h
  }
  async function abrirHerr(id) {
    var T = CAT.HERRAMIENTAS[id]
    if (!T) return false
    var b = boton(T.boton, T.donde)
    if (!b && (T.donde === 'panel' || T.donde === 'cmoc')) { // el panel de la izquierda puede estar plegado
      var ab = boton(/^\W*\+$|mostrar|abrir panel/i)
      if (ab) { ab.click(); b = await hasta(function () { return boton(T.boton, T.donde) }, 1200) }
    }
    if (!b) return T.donde === 'cmoc' ? 'calcos' : false // el editor CMOC y el Análisis IA aparecen recién con los calcos generados
    b.click()
    return true
  }
  function abrir(ref) { return ref.h ? abrirHerr(ref.h) : abrirHoja(ref) }

  // ---------- estado ----------
  function cargar() {
    modo = lee(K_MODO, 'mesa'); if (!MODOS.some(function (m) { return m.id === modo })) modo = 'mesa'
    try { hecho = JSON.parse(lee(K_HECHO, '{}')) || {} } catch (e) { hecho = {} }
    fase = +lee(K_FASE, '1') || 1
    escalon = lee(K_ESC, 'ce')
    plegado = lee(K_PLEGADO, '0') === '1'
    foco = lee(K_FOCO, 'pmtd'); if (!CAT.FOCOS.some(function (f) { return f.id === foco })) foco = 'pmtd'
  }
  // El puente con la Mesa: el compilado llama a MesaAcademica.sincronizar({unidades, ejercicio,
  // centro, agregarUnidades, docente…}) cada vez que cambia algo; nos quedamos con una copia.
  function engancharPuente() {
    var MA = window.MesaAcademica
    if (!MA || MA.__sidModalidad) return
    var orig = MA.sincronizar
    MA.sincronizar = function (p) { puente = p || null; setTimeout(function () { carRevisar(); ogoRevisarCarga(); ubiRevisar() }, 0); return orig.apply(this, arguments) }
    MA.__sidModalidad = true
  }
  function centroMesa() { try { var c = puente && (typeof puente.centro === 'function' ? puente.centro() : puente.centro); return c && isFinite(c.lat) ? c : null } catch (e) { return null } }
  function ponerModo(m) {
    modo = m; guarda(K_MODO, m)
    var cu = panel && panel.querySelector('.cuerpo'); if (cu) cu.scrollTop = 0 // otra modalidad: desde arriba
    body.setAttribute('data-sid-modo', m)
    if (sel) sel.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-m') === m) })
    pintar(true)
    setTimeout(function () { window.dispatchEvent(new Event('resize')) }, 60)
  }
  function clave(f, n) { return (modo === 'profesor' ? 'P' : 'F' + f) + '.' + n }
  function hechoDe(f, n) { return !!hecho[clave(f, n)] }
  function marcar(f, n, v) { if (v) hecho[clave(f, n)] = 1; else delete hecho[clave(f, n)]; guarda(K_HECHO, JSON.stringify(hecho)) }
  function avance(F) { var h = 0; F.pasos.forEach(function (p) { if (hechoDe(F.id, p.n)) h++ }); return { h: h, t: F.pasos.length } }
  function escalonDe(id) { for (var i = 0; i < CAT.ESCALONES.length; i++) if (CAT.ESCALONES[i].id === id) return CAT.ESCALONES[i]; return CAT.ESCALONES[1] }
  function focoDe(id) { for (var i = 0; i < CAT.FOCOS.length; i++) if (CAT.FOCOS[i].id === id) return CAT.FOCOS[i]; return CAT.FOCOS[0] }
  function pasoProfesor(n) { for (var i = 0; i < CAT.PROFESOR.length; i++) if (CAT.PROFESOR[i].n === n) return CAT.PROFESOR[i]; return null }
  function verDe(n) { var p = pasoProfesor(n); return p && p.ver ? p.ver : n } // el número que se muestra

  // ---------- la IA del profesor ----------
  // El compilado manda por el puente el NOMBRE del ejercicio abierto (no sus datos). Los datos (la
  // Orden escrita, el CMOC, las fases, los documentos) se buscan, en este orden:
  //  1° tal como están en la Mesa: window.SIDMesaEjercicio, que deja el autoguardado
  //     (calcos/guardado/v1/autoguardado.mjs); trae hasta lo que todavía no se guardó;
  //  2° el IndexedDB «calcos» con su nombre: la Mesa sin SIDECEME (escritorio, desarrollo) guarda ahí;
  //  3° la copia de respaldo «<nombre>__anterior» del mismo IndexedDB: con la Mesa publicada el
  //     ejercicio se guarda en SIDECEME y en el navegador sólo queda esa copia (de hasta 2 min atrás).
  // Hasta el 10-10-2026 sólo se probaba el 2°: con la Mesa publicada el pedido salía sin el CMOC
  // dibujado, sin la Orden y sin el Área de Interés (sólo con las fichas). Se lee sin crear nada.
  function nombreGuardado(t) { return String(t || '').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').slice(0, 80) } // como lo guarda la Mesa
  function hora(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) }
  function leerIDB(nombre) {
    return new Promise(function (ok) {
      if (!nombre || typeof nombre !== 'string' || !window.indexedDB) return ok(null)
      var abrir_ = function () {
        try {
          var r = indexedDB.open('calcos')
          r.onupgradeneeded = function () { try { r.transaction.abort() } catch (e) {} } // no existía: no la creamos
          r.onsuccess = function () {
            var db = r.result
            try {
              if (!db.objectStoreNames.contains('ejercicios')) { db.close(); return ok(null) }
              var st = db.transaction('ejercicios', 'readonly').objectStore('ejercicios'), claves = [nombre, nombreGuardado(nombre), nombreGuardado(nombre) + '__anterior'], i = 0
              var sig = function () {
                if (i >= claves.length) { db.close(); return ok(null) }
                var k = claves[i++], g = st.get(k)
                g.onsuccess = function () {
                  var v = g.result, d = v && (v.datos || v)
                  if (d && typeof d === 'object') { db.close(); ok({ datos: d, fuente: /__anterior$/.test(k) ? 'la copia de respaldo del navegador' + (v.guardadoEn ? ' de las ' + hora(v.guardadoEn) : '') + ' (lo dibujado en los últimos minutos puede faltar)' : 'el ejercicio guardado en este navegador' }) } else sig()
                }
                g.onerror = sig
              }
              sig()
            } catch (e) { db.close(); ok(null) }
          }
          r.onerror = function () { ok(null) }
          r.onblocked = function () { ok(null) }
        } catch (e) { ok(null) }
      }
      if (indexedDB.databases) indexedDB.databases().then(function (ds) { (ds || []).some(function (d) { return d.name === 'calcos' }) ? abrir_() : ok(null) }, abrir_)
      else abrir_()
    })
  }
  function nombreEj() {
    var n = puente && (typeof puente.ejercicio === 'string' ? puente.ejercicio : puente.ejercicio && puente.ejercicio.nombre)
    if (!n) try { n = window.SIDMesaEjercicio && window.SIDMesaEjercicio.nombre() } catch (e) {}
    return n || ''
  }
  // → { datos, fuente } o null
  function leerEjercicio(nombre) {
    var M = window.SIDMesaEjercicio
    try {
      var f = M && M.foto && (!nombre || M.nombre() === nombre) ? M.foto() : null
      if (f && typeof f === 'object') return Promise.resolve({ datos: Object.assign({}, f, { nombre: f.nombre || nombre }), fuente: 'la Mesa abierta, tal como está ahora' })
    } catch (e) {}
    return leerIDB(nombre).then(function (r) { return r && { datos: Object.assign({}, r.datos, { nombre: r.datos.nombre || nombre }), fuente: r.fuente } })
  }
  function armarPedido(p) {
    if (!IA) return Promise.resolve('')
    var nombre = nombreEj()
    return leerEjercicio(nombre).then(function (r) {
      var ej = r && r.datos
      if (!ej && puente && puente.ejercicio && typeof puente.ejercicio === 'object') ej = puente.ejercicio
      if (!ej && nombre) ej = { nombre: nombre }
      return IA.armarPedido(p, { escalon: escalonDe(escalon), foco: focoDe(foco), ejercicio: ej, fuente: r ? r.fuente : '', unidades: puente && puente.unidades, centro: centroMesa(), biblioteca: biblio, carpeta: carpeta })
    })
  }
  function copiar(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texto)
    return new Promise(function (ok, no) {
      var ta = panel.querySelector('textarea[data-ia]'); if (!ta) return no(new Error('sin texto'))
      ta.focus(); ta.select(); try { document.execCommand('copy') ? ok() : no(new Error('copy')) } catch (e) { no(e) }
    })
  }
  function bajar(nombre, texto) {
    var a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([texto], { type: 'text/markdown;charset=utf-8' }))
    a.download = nombre; document.body.appendChild(a); a.click()
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove() }, 500)
  }
  function nombreArchivo(p) { return 'pedido-ia-profesor-' + p.n + '-' + p.nom.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '.md' }
  function htmlIA(p) {
    var ia = p.ia || {}, abierto = iaPaso === p.n, guardada = CARP && carpeta && carpeta.pasos && carpeta.pasos[p.n]
    var h = '<div class="ia">' +
      '<button type="button" class="ia-btn" data-ia-paso="' + p.n + '" aria-expanded="' + abierto + '" title="Arma el pedido a la IA con lo que ya hay en el ejercicio (escalón, campo que se entrena, Orden, fichas, documentos). Se copia o se baja y se le da a ChatGPT, Gemini o Claude.">' +
      '🤖 IA: ' + esc(ia.tit || p.nom) + (guardada ? ' · 📕✓' : '') + (abierto ? ' ▴' : ' ▸') + '</button>'
    if (abierto) {
      var n = iaTexto.length, otros = CARP ? CARP.lista(carpeta).filter(function (g) { return g.n !== p.n }).map(function (g) { return g.n }) : []
      h += '<div class="ia-caja"><p class="ia-ayuda">' + esc(ia.pide ? ia.pide.split('.')[0] + '.' : '') +
        'Copialo y pegalo en ChatGPT, Gemini o Claude (' + n.toLocaleString('es') + ' caracteres' + (n > 120000 ? '; es largo: si la IA lo corta, usá Claude o Gemini pagos' : '') + ').' + (otros.length ? ' Lleva lo guardado en la 📕 carpeta (paso' + (otros.length > 1 ? 's ' : ' ') + otros.join(', ') + ').' : '') + (!puente ? ' <b>La Mesa todavía no mandó el ejercicio</b> (abrí uno): el pedido va sin contexto.' : '') + '</p>' +
        '<div class="ia-acc"><button type="button" class="ir" data-a="ia-copiar">📋 Copiar el pedido</button><button type="button" class="ir" data-a="ia-bajar">⬇️ Bajar .md</button><button type="button" class="chico" data-a="ia-cerrar">Cerrar</button>' + (aviso['ia' + p.n] ? '<span class="ia-aviso">' + esc(aviso['ia' + p.n]) + '</span>' : '') + '</div>' +
        '<textarea data-ia readonly rows="8" aria-label="Pedido a la IA">' + esc(iaTexto) + '</textarea>' + htmlRespuesta(p) + '</div>'
    }
    return h + '</div>'
  }
  function selectorFoco() {
    var F = focoDe(foco)
    return '<div class="foco"><label>El ejercicio entrena <select data-foco>' + CAT.FOCOS.map(function (f) { return '<option value="' + f.id + '"' + (f.id === foco ? ' selected' : '') + '>' + esc(f.nom) + '</option>' }).join('') + '</select></label>' +
      '<div class="foco-nota">La OGO y sus anexos salen completos en lo demás y dejan al alumno ' + esc(F.deja) + '.</div></div>'
  }
  // Organizaciones tipo para insertar de una vez (paso «Unidades»), y las fichas de la IA.
  function htmlOrganizaciones(p) {
    var puede = !!(puente && puente.agregarUnidades)
    return '<div class="org"><div class="org-tit">Insertar una organización tipo en la carta</div>' +
      '<div class="org-fila"><select data-org>' + CAT.ORGANIZACIONES.map(function (o) { return '<option value="' + o.id + '">' + esc(o.nom) + '</option>' }).join('') + '</select></div>' +
      '<div class="org-fila"><label><input type="radio" name="sid-org-bando" value="propias" checked> 🔵 AZUL (propias)</label><label><input type="radio" name="sid-org-bando" value="enemigas"> 🔴 ROJO (enemigas)</label>' +
      '<label>N° <input type="text" data-org-num value="1" size="3" maxlength="6" aria-label="Número de la organización"></label></div>' +
      '<div class="org-fila"><button type="button" class="ir" data-a="org-insertar"' + (puede ? '' : ' disabled title="Abrí un ejercicio en la Mesa: todavía no mandó el puente de las fichas"') + '>➕ Insertar en el centro de la vista</button>' +
      '<button type="button" class="chico" data-a="org-pegar" aria-expanded="' + (aviso.pegar ? 'true' : 'false') + '">📥 Pegar fichas de la IA (JSON)</button></div>' +
      (aviso.pegar ? '<textarea data-org-json rows="4" placeholder="Pegá acá el bloque ```json que devolvió la IA (designacion, bando, arma, escalon, lat, lng)"></textarea><div class="org-fila"><button type="button" class="ir" data-a="org-pegar-ok"' + (puede ? '' : ' disabled') + '>➕ Insertar esas fichas</button></div>' : '') +
      (aviso.org ? '<div class="ia-aviso">' + esc(aviso.org) + '</div>' : '') +
      '<div class="org-nota">Son organizaciones genéricas de escuela; se ajustan ficha por ficha en 🪖 Unidades. ROJO se dibuja espejado (viene del otro lado).</div>' +
      (BIB ? '<div class="org-tit">Desde mis COE</div>' + (biblio.some(function (d) { return d.coe }) ?
        '<div class="org-fila"><select data-bib-coe>' + biblio.filter(function (d) { return d.coe }).map(function (d) { return '<option value="' + esc(d.id) + '">' + esc(d.coe.division) + ' (' + (d.bando === 'enemigas' ? 'ROJO' : 'AZUL') + ', ' + d.coe.unidades.length + ' u.)</option>' }).join('') + '</select>' +
        '<button type="button" class="ir" data-a="bib-insertar-sel"' + (puede ? '' : ' disabled') + '>➕ Insertar</button></div>' + (aviso.bib && /fichas insertadas|puente/.test(aviso.bib) ? '<div class="ia-aviso">' + esc(aviso.bib) + '</div>' : '')
        : '<div class="org-fila"><button type="button" class="chico" data-a="bib">📚 Cargar mis COE (Word o .zip)</button></div>') : '') + '</div>'
  }
  function insertarFichas(fichas, de, clave) {
    clave = clave || 'org'
    if (!puente || !puente.agregarUnidades) { aviso[clave] = 'La Mesa no mandó el puente de las fichas: abrí un ejercicio.'; return }
    if (!fichas.length) { aviso[clave] = 'No hay fichas para insertar.'; return }
    puente.agregarUnidades(fichas)
    puente = Object.assign({}, puente, { unidades: (puente.unidades || []).concat(fichas) })
    aviso[clave] = '✓ ' + fichas.length + ' fichas insertadas (' + de + '). Ajustalas en 🪖 Unidades; con ↶ Deshacer de la barra se quitan.'
  }

  // ---------- 📚 la biblioteca del profesor ----------
  // Los documentos propios (COE, organización, armamento, reglamentos) quedan en el IndexedDB
  // «sid-biblioteca» de ESTE navegador: se cargan una vez y sirven para todos los ejercicios.
  function dbOp(base, almacen, clave, modo_, f) {
    return new Promise(function (ok, no) {
      try {
        var r = indexedDB.open(base, 1)
        r.onupgradeneeded = function () { if (!r.result.objectStoreNames.contains(almacen)) r.result.createObjectStore(almacen, { keyPath: clave }) }
        r.onsuccess = function () { ok(r.result) }
        r.onerror = function () { no(r.error) }
      } catch (e) { no(e) }
    }).then(function (db) {
      return new Promise(function (ok, no) {
        var tx = db.transaction(almacen, modo_), st = tx.objectStore(almacen), res = f(st)
        tx.oncomplete = function () { db.close(); ok(res && 'result' in res ? res.result : undefined) }
        tx.onerror = function () { db.close(); no(tx.error) }
      })
    })
  }
  function bibOp(modo_, f) { return dbOp('sid-biblioteca', 'docs', 'id', modo_, f) }
  function bibCargar() {
    if (!window.indexedDB) return Promise.resolve()
    return bibOp('readonly', function (st) { return st.getAll() }).then(function (ds) {
      biblio = (ds || []).sort(function (a, b) { return String(a.cargado).localeCompare(String(b.cargado)) }); bibVer++; pintar(true)
    }, function () {})
  }
  function bibGuardar(d) { return bibOp('readwrite', function (st) { st.put(d) }) }
  function bibBorrar(id) { return bibOp('readwrite', function (st) { st.delete(id) }) }
  function bibDoc(id) { for (var i = 0; i < biblio.length; i++) if (biblio[i].id === id) return biblio[i]; return null }

  function cargarScript(src) {
    return new Promise(function (ok, no) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = function () { no(new Error('No se pudo cargar ' + src)) }; document.head.appendChild(sc) })
  }
  function conJSZip() { return window.JSZip ? Promise.resolve(window.JSZip) : cargarScript('../jszip.min.js').then(function () { return window.JSZip }) }
  function textoPDF(buf) {
    var P = window.pdfjsLib
    if (!P || !P.getDocument) return Promise.reject(new Error('el lector de PDF de la Mesa no está cargado'))
    try { if (P.GlobalWorkerOptions && !P.GlobalWorkerOptions.workerSrc) P.GlobalWorkerOptions.workerSrc = new URL('./assets/pdf.worker.min-CrMmvqMo.mjs', location.href).href } catch (e) {}
    return P.getDocument({ data: new Uint8Array(buf) }).promise.then(function (pdf) {
      var paginas = [], i = 1
      function sig() {
        if (i > pdf.numPages) return paginas.join('\n\n')
        var n = i++
        return pdf.getPage(n).then(function (pg) { return pg.getTextContent() }).then(function (tc) { paginas.push('[Página ' + n + '] ' + tc.items.map(function (it) { return it.str }).join(' ')) }).then(sig)
      }
      return sig()
    })
  }
  // Un archivo → uno o varios documentos de la biblioteca (un .zip trae varios).
  function leerArchivo(nombre, buf, J) {
    var n = nombre.toLowerCase()
    if (/\.zip$/.test(n)) {
      return J.loadAsync(buf).then(function (z) {
        var ents = Object.keys(z.files).filter(function (k) { return !z.files[k].dir && !/__MACOSX|(^|\/)\./.test(k) && /\.(docx|pdf|txt|md)$/i.test(k) }).sort()
        return ents.reduce(function (pr, k) {
          return pr.then(function (acc) { return z.file(k).async('arraybuffer').then(function (b) { return leerArchivo(k.split('/').pop(), b, J) }).then(function (ds) { return acc.concat(ds) }) })
        }, Promise.resolve([]))
      })
    }
    if (/\.docx$/.test(n)) return BIB.leerDocx(buf, J).then(function (d) { return [BIB.documento(nombre.replace(/\.docx$/i, ''), { texto: d.texto, coe: BIB.leerCOE(d) })] })
    if (/\.pdf$/.test(n)) return textoPDF(buf).then(function (t) { return [BIB.documento(nombre.replace(/\.pdf$/i, ''), { texto: t })] }, function (e) { return [BIB.documento(nombre.replace(/\.pdf$/i, ''), { texto: '(No se pudo leer el texto del PDF: ' + e.message + '. Si es un escaneo, pasalo a Word.)' })] })
    if (/\.(txt|md|csv)$/.test(n)) return Promise.resolve([BIB.documento(nombre.replace(/\.\w+$/, ''), { texto: new TextDecoder('utf-8').decode(buf) })])
    if (/\.doc$/.test(n)) return Promise.reject(new Error(nombre + ': es un Word viejo (.doc). Abrilo en Word y «Guardar como» .docx.'))
    return Promise.reject(new Error(nombre + ': formato no soportado (Word .docx, PDF, .zip o texto).'))
  }
  function bibSubir(files) {
    if (!BIB) return
    aviso.bib = '⏳ Leyendo ' + files.length + ' archivo(s)…'; pintar(true)
    var nuevos = [], errores = []
    conJSZip().then(function (J) {
      return Array.prototype.reduce.call(files, function (pr, f) {
        return pr.then(function () { return f.arrayBuffer() }).then(function (b) { return leerArchivo(f.name, b, J) }).then(function (ds) { nuevos = nuevos.concat(ds) }, function (e) { errores.push(e && e.message ? e.message : String(e)) })
      }, Promise.resolve())
    }).then(function () {
      return nuevos.reduce(function (pr, d) { return pr.then(function () { return bibGuardar(d) }) }, Promise.resolve())
    }).then(function () {
      var coes = nuevos.filter(function (d) { return d.coe }).length
      aviso.bib = (nuevos.length ? '✓ ' + nuevos.length + ' documento(s) en la biblioteca' + (coes ? ' (' + coes + ' COE con sus unidades)' : '') + '.' : '') + (errores.length ? ' ⚠️ ' + errores.join(' · ') : '')
      return bibCargar()
    }).catch(function (e) { aviso.bib = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
  }
  function htmlBiblioteca() {
    var coes = biblio.filter(function (d) { return d.coe })
    var h = '<section class="bib"><div class="bib-cab"><b>📚 Mis documentos</b><span>COE de cada División, organización y armamento (propios o del enemigo), reglamentos. Se cargan una vez y sirven para todos los ejercicios: los COE se insertan en la carta y todo entra en los pedidos a la IA.</span></div>' +
      '<label class="ir bib-subir">📤 Cargar Word, PDF o .zip<input type="file" data-bib-archivo multiple accept=".docx,.pdf,.zip,.txt,.md,.csv" hidden></label>' +
      (aviso.bib ? '<div class="ia-aviso">' + esc(aviso.bib) + '</div>' : '')
    if (!biblio.length) return h + '<p class="bib-vacia">Todavía no cargaste nada. Probá con el .zip de los COE: cada Word queda como una División con sus unidades.</p></section>'
    h += '<ul class="bib-lista">' + biblio.map(function (d) {
      return '<li data-bib="' + esc(d.id) + '"><div class="bib-nom">' + esc(d.nombre) + (d.recortado ? ' <small>(guardados ' + Math.round(d.texto.length / 1000) + ' mil de ' + Math.round(d.recortado / 1000) + ' mil caracteres)</small>' : '') + '</div>' +
        (d.coe ? '<div class="bib-coe">🪖 ' + esc(d.coe.division) + ' · ' + d.coe.unidades.length + ' unidades · ' + (d.coe.efectivo || '?').toLocaleString('es') + ' H</div>' : '') +
        '<div class="org-fila"><select data-bib-tipo aria-label="Tipo de documento">' + BIB.TIPOS.map(function (t) { return '<option value="' + t.id + '"' + (t.id === d.tipo ? ' selected' : '') + '>' + esc(t.nom) + '</option>' }).join('') + '</select>' +
        '<select data-bib-bando aria-label="Bando"><option value="propias"' + (d.bando !== 'enemigas' ? ' selected' : '') + '>🔵 AZUL</option><option value="enemigas"' + (d.bando === 'enemigas' ? ' selected' : '') + '>🔴 ROJO</option></select>' +
        '<label title="Entra en los pedidos a la IA"><input type="checkbox" data-bib-ia' + (d.enIA !== false ? ' checked' : '') + '> IA</label></div>' +
        '<div class="org-fila">' + (d.coe ? '<button type="button" class="ir" data-a="bib-insertar">➕ A la carta</button>' : '') +
        '<button type="button" class="chico" data-a="bib-ver">' + (bibVista === d.id ? 'Ocultar' : '👁️ Ver') + '</button><button type="button" class="chico" data-a="bib-borrar">🗑️</button></div>' +
        (bibVista === d.id ? '<textarea readonly rows="8">' + esc(d.coe ? BIB.resumenCOE(d.coe) : d.texto.slice(0, 20000)) + '</textarea>' : '') + '</li>'
    }).join('') + '</ul>'
    if (coes.length > 1) h += '<div class="org-fila"><button type="button" class="ir" data-a="bib-insertar-todos">➕ Todos los COE a la carta (' + coes.length + ' Divisiones, una al lado de la otra)</button></div>'
    return h + '</section>'
  }
  function insertarCOE(docs) {
    var c = centroMesa() || { lat: -16.5, lng: -64.5 }, todas = [], ancho = 60 // km entre Divisiones
    docs.forEach(function (d, i) {
      var dx = (i - (docs.length - 1) / 2) * ancho
      var ce = { lat: c.lat, lng: c.lng + dx / (111.32 * Math.max(0.2, Math.cos(c.lat * Math.PI / 180))) }
      todas = todas.concat(BIB.fichasDeCOE(d.coe, { bando: d.bando, centro: ce }))
    })
    insertarFichas(todas, docs.length === 1 ? 'COE de la ' + docs[0].coe.division : docs.length + ' COE', 'bib')
  }

  // ---------- 📕 la carpeta del profesor ----------
  // Lo pidió Sergio (10-10-2026) con la captura del paso 4: la IA le devolvió el CMOC y «no hay
  // dónde pegar el resultado… debe ir registrado en algún lado, ya que servirá para los cursos de
  // acción o el anexo de inteligencia… y si hay algo para el profesor, que se vaya sumando». En cada
  // «🤖 IA» se pega la respuesta y se guarda en la carpeta del ejercicio (carpeta.js): entra en los
  // pedidos de los pasos que siguen y lo «PARA EL PROFESOR» se va sumando. Queda en el IndexedDB
  // «sid-profesor» de ESTE navegador, NO en el ejercicio: el ejercicio se reparte a los alumnos y la
  // solución del profesor no tiene que viajar con él. Para llevarla a otro equipo: ⬇️ Bajar / 📤 Cargar.
  function claveCarpeta() { return nombreGuardado(nombreEj()) }
  function carOp(modo_, f) { return dbOp('sid-profesor', 'carpetas', 'ejercicio', modo_, f) }
  // Mientras se lee la carpeta del ejercicio recién abierto, `carpeta` es una vacía marcada
  // «cargando»: no se guarda nada encima (pisaría la de verdad).
  function carCargar() {
    var k = claveCarpeta()
    carpetaDe = k
    if (!CARP) return Promise.resolve()
    if (!carpeta || carpeta.ejercicio !== k) { carpeta = CARP.vacia(k); carpeta.cargando = !!(k && window.indexedDB); carVer++ }
    if (!k || !window.indexedDB) { carpeta = CARP.vacia(k); carVer++; pintar(true); return Promise.resolve() }
    return carOp('readonly', function (st) { return st.get(k) }).then(function (c) {
      if (carpetaDe !== k) return
      carpeta = c && c.pasos ? c : CARP.vacia(k); carVer++; pintar(true)
    }, function () { if (carpetaDe === k) { carpeta = CARP.vacia(k); carVer++; pintar(true) } })
  }
  function carRevisar() { if (CARP && carpetaDe !== claveCarpeta()) carCargar() }
  function carGuardar(c) {
    carpeta = c; carVer++
    if (!window.indexedDB) return Promise.reject(new Error('este navegador no deja guardar (¿ventana privada?)'))
    return carOp('readwrite', function (st) { st.put(c) })
  }
  // lo pegado y todavía no guardado, por ejercicio y paso (se rearma el tablero y no se pierde)
  function bk(n) { return claveCarpeta() + '|' + n }
  function guardarRespuesta(p) {
    var ta = panel.querySelector('textarea[data-ia-resp="' + p.n + '"]'), txt = ta ? ta.value : borrador[bk(p.n)] || ''
    var k = claveCarpeta(), clave_ = 'resp' + p.n
    if (!String(txt).trim()) { aviso[clave_] = 'Pegá primero la respuesta de la IA en el cuadro.'; return pintar(true) }
    if (!k) { borrador[bk(p.n)] = txt; aviso[clave_] = '⚠️ Abrí (o creá) el ejercicio en la Mesa: la carpeta va con el nombre del ejercicio. Lo pegado queda acá mientras tanto.'; return pintar(true) }
    if (carpeta.cargando || carpeta.ejercicio !== k) { borrador[bk(p.n)] = txt; aviso[clave_] = '⏳ Cargando la carpeta del ejercicio… tocá «💾 Guardar» otra vez.'; carRevisar(); return pintar(true) }
    var c = CARP.poner(carpeta, p, txt), g = c.pasos[p.n]
    c.ejercicio = k
    delete borrador[bk(p.n)]
    aviso[clave_] = '⏳ Guardando…'
    carGuardar(c).then(function () {
      var notas = CARP.separar(g.texto).profesor
      aviso[clave_] = '✓ Guardada en la 📕 carpeta (' + (g.destino === 'solucion' ? '🔒 solución del profesor' : '📤 va a los alumnos') + ')' + (notas ? '; lo «PARA EL PROFESOR» se sumó a la carpeta' : '') + '. Entra en los pedidos de los pasos que siguen.'
      pintar(true)
    }, function (e) { aviso[clave_] = '⚠️ No se pudo guardar: ' + (e && e.message ? e.message : e) + '. Copiá el texto para no perderlo.'; pintar(true) })
    pintar(true)
  }
  function nombreArchivoCarpeta() { return 'carpeta-profesor-' + (carpeta.ejercicio || 'ejercicio').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) + '.md' }
  function cargarCarpeta(file) {
    var k = claveCarpeta()
    if (!k) { aviso.car = '⚠️ Abrí primero el ejercicio en la Mesa: la carpeta se suma a la de ESE ejercicio.'; return pintar(true) }
    if (carpeta.cargando || carpeta.ejercicio !== k) { aviso.car = '⏳ Cargando la carpeta del ejercicio… probá otra vez.'; carRevisar(); return pintar(true) }
    file.text().then(function (t) {
      var c = CARP.leerMarkdown(t)
      if (c.ejercicio && c.ejercicio !== k && !window.confirm('Esa carpeta es del ejercicio «' + c.ejercicio + '» y tenés abierto «' + k + '». ¿Sumarla a «' + k + '»?')) { aviso.car = 'No se cargó nada.'; return pintar(true) }
      var j = CARP.juntar(carpeta, c); j.ejercicio = k
      return carGuardar(j).then(function () { aviso.car = '✓ Cargada: ' + CARP.cuantos(c) + ' paso(s) (de cada paso queda la respuesta más nueva).'; pintar(true) })
    }).catch(function (e) { aviso.car = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
  }
  function htmlRespuesta(p) {
    if (!CARP) return ''
    var g = carpeta && carpeta.pasos && carpeta.pasos[p.n], b = borrador[bk(p.n)], val = b != null ? b : g ? g.texto : ''
    return '<div class="ia-resp"><div class="ia-resp-tit">📥 La respuesta de la IA<span>Pegala acá y guardala: queda en la 📕 carpeta del profesor de este ejercicio y entra en los pedidos de los pasos que siguen' + (p.n === 4 ? ' (la OGO y su Anexo A de Inteligencia, los cursos de acción del enemigo, la pauta de corrección)' : '') + '; lo «PARA EL PROFESOR» se va sumando en la carpeta.</span></div>' +
      '<textarea data-ia-resp="' + p.n + '" rows="7" placeholder="Pegá acá TODO lo que te contestó la IA (con «PARA EL PROFESOR» incluido)">' + esc(val) + '</textarea>' +
      '<div class="ia-acc"><button type="button" class="ir" data-a="ia-guardar">💾 Guardar en la carpeta</button>' +
      (g ? '<select data-ia-destino aria-label="A quién va este documento">' + Object.keys(CARP.DESTINOS).map(function (d) { return '<option value="' + d + '"' + (g.destino === d ? ' selected' : '') + '>' + esc(CARP.DESTINOS[d].nom) + '</option>' }).join('') + '</select>' +
        '<button type="button" class="chico" data-a="ia-quitar" title="Sacar esta respuesta de la carpeta">🗑️</button>' : '') + '</div>' +
      (g ? '<div class="ia-guardada">📕 Guardada el ' + esc(CARP.fecha(g.guardado)) + ' · ' + g.texto.length.toLocaleString('es') + ' caracteres</div>' : '') +
      (aviso['resp' + p.n] ? '<div class="ia-aviso">' + esc(aviso['resp' + p.n]) + '</div>' : '') + '</div>'
  }
  function htmlCarpeta() {
    var ps = CARP.lista(carpeta), notas = CARP.notasProfesor(carpeta), nom = carpeta.ejercicio
    var h = '<section class="car"><div class="bib-cab"><b>📕 Carpeta del profesor' + (nom ? ' — ' + esc(nom) : '') + '</b><span>Las respuestas de la IA que guardaste en cada paso. Entran en los pedidos de los pasos que siguen y lo «PARA EL PROFESOR» se va sumando abajo. Queda en ESTE navegador, aparte del ejercicio (no viaja a los alumnos): bajala para tenerla en papel o llevarla a otro equipo.</span></div>' +
      '<div class="org-fila"><button type="button" class="ir" data-a="car-bajar"' + (ps.length ? '' : ' disabled') + '>⬇️ Bajar la carpeta (.md)</button><label class="ir car-subir">📤 Cargar una carpeta<input type="file" data-car-archivo accept=".md,.txt,text/markdown,text/plain" hidden></label></div>' +
      (aviso.car ? '<div class="ia-aviso">' + esc(aviso.car) + '</div>' : '')
    if (!nom) h += '<p class="bib-vacia">Abrí (o creá) el ejercicio en la Mesa: cada ejercicio tiene su carpeta.</p>'
    if (!ps.length) return h + '<p class="bib-vacia">Todavía no guardaste ninguna respuesta. En cada paso: 🤖 IA → 📋 Copiar el pedido → pegalo en la IA → pegá lo que contestó en «📥 La respuesta de la IA» → 💾 Guardar.</p></section>'
    h += '<ul class="car-lista">' + ps.map(function (g) {
      return '<li data-car="' + g.n + '"><div class="bib-nom">Paso ' + verDe(g.n) + ' · ' + esc(g.tit) + '</div><div class="car-meta">' + (g.destino === 'solucion' ? '🔒 Solución del profesor' : '📤 Va a los alumnos') + ' · ' + esc(CARP.fecha(g.guardado)) + ' · ' + g.texto.length.toLocaleString('es') + ' caracteres</div>' +
        '<div class="org-fila"><button type="button" class="chico" data-a="car-ver">' + (carVista === g.n ? 'Ocultar' : '👁️ Ver') + '</button><button type="button" class="chico" data-a="car-ir">Ir al paso ▸</button></div>' +
        (carVista === g.n ? '<textarea readonly rows="10" aria-label="Respuesta guardada">' + esc(g.texto) + '</textarea>' : '') + '</li>'
    }).join('') + '</ul>'
    return h + '<div class="car-notas"><div class="org-tit">🧑‍🏫 Para el profesor (se va sumando)</div>' + (notas.length ? notas.map(function (x) { return '<div class="car-nota"><b>Paso ' + verDe(x.n) + ' · ' + esc(x.tit) + '</b><div class="car-txt">' + esc(x.texto) + '</div></div>' }).join('') : '<p class="bib-vacia">Ninguna respuesta trajo todavía la sección «PARA EL PROFESOR».</p>') + '</div></section>'
  }

  // ---------- 📜 la OGO completa con sus anexos (el paso final) ----------
  // Lo pidió Sergio (11-10-2026): «cuando termine todos esos pasos… salga una OGO completa con sus
  // planes de apoyo para darles a los alumnos… no quiero ser objeto de observaciones con órdenes mal
  // hechas o incompletas». Documento por documento, sobre los MODELOS DE LA ESCUELA (ogo-modelos.js):
  // 🤖 el pedido (con todo lo de la Mesa y lo ya escrito de la OGO) → la respuesta de la IA → ✅ la
  // revisión (lo que le falta) → ⬇️ el Word con el formato militar de la Mesa (formato-militar/v1/
  // word.js) → 📎 al ejercicio para los alumnos. Queda en el IndexedDB «sid-profesor-ogo» de ESTE
  // navegador (como la carpeta); para llevarla a otro equipo, ⬇️ .md / 📤 Cargar.
  function ogoOp(modo_, f) { return dbOp('sid-profesor-ogo', 'ogos', 'ejercicio', modo_, f) }
  function ogoCargar() {
    var k = claveCarpeta()
    ogoDe = k; ogoRev = null; ogoRevDoc = {}; ogoCache = {}
    if (!OGO) return Promise.resolve()
    if (!k || !window.indexedDB) { ogo = OGO.vacio(k); ogoVer++; pintar(true); return Promise.resolve() }
    ogo = OGO.vacio(k); ogo.cargando = true; ogoVer++
    return ogoOp('readonly', function (st) { return st.get(k) }).then(function (e) {
      if (ogoDe !== k) return
      ogo = e && e.config ? e : OGO.vacio(k); ogoVer++; pintar(true)
    }, function () { if (ogoDe === k) { ogo = OGO.vacio(k); ogoVer++; pintar(true) } })
  }
  function ogoRevisarCarga() { if (OGO && ogoDe !== claveCarpeta()) ogoCargar() }
  function ogoGuardar(e) {
    var k = claveCarpeta()
    if (!k) return Promise.reject(new Error('abrí (o creá) el ejercicio en la Mesa: la OGO va con el nombre del ejercicio'))
    if (ogo && ogo.cargando) return Promise.reject(new Error('todavía se está leyendo la OGO guardada de este ejercicio; probá de nuevo en un segundo'))
    e.ejercicio = k; delete e.cargando
    ogo = e; ogoVer++
    if (!window.indexedDB) return Promise.reject(new Error('este navegador no deja guardar (¿ventana privada?)'))
    return ogoOp('readwrite', function (st) { st.put(e) })
  }
  // El ejercicio de la Mesa y el contexto de los pedidos (el mismo de los otros pasos).
  function ogoContexto() {
    var nombre = nombreEj()
    return leerEjercicio(nombre).then(function (r) {
      var ej = r && r.datos
      if (!ej && puente && puente.ejercicio && typeof puente.ejercicio === 'object') ej = puente.ejercicio
      if (!ej && nombre) ej = { nombre: nombre }
      if (ej && puente && puente.unidades && !ej.unidades) ej = Object.assign({}, ej, { unidades: puente.unidades })
      ogoEjUlt = ej
      var est = OGO.completarConfig(ogo, ej || {}, { escalon: escalon })
      return { ej: ej, est: est, ctx: { escalon: escalonDe(escalon), escalonId: escalon, foco: focoDe(foco), ogo: est, ejercicio: ej, fuente: r ? r.fuente : '', unidades: puente && puente.unidades, centro: centroMesa(), biblioteca: biblio, carpeta: carpeta } }
    })
  }
  function ogoRevisionDe(id) { // en caché por documento y por cuándo se guardó
    var x = ogo && ogo.docs && ogo.docs[id]
    if (!x) return null
    var k = id + '|' + x.guardado + '|' + JSON.stringify([ogo.config.tipo, ogo.config.seleccion, ogo.config.letras, ogo.config.alumnos])
    if (!ogoCache[k]) ogoCache[k] = OGO.revisar(id, x.texto, { ogo: ogo })
    return ogoCache[k]
  }
  function ogoEstado(id) {
    var r = ogoRevisionDe(id)
    if (!r && id === 'calco') return '<span class="ogo-est bien" title="El Anexo A es el gráfico de lo dibujado en la Mesa: el Área de Operaciones, los límites, las fichas y las cruces de amarre">🗺️ gráfico de la Mesa</span>'
    if (!r) return '<span class="ogo-est pend">⏳ sin escribir</span>'
    var n = r.faltan.length + r.faltanTexto.length + r.vacios.length + r.marcadores.length + r.avisos.filter(function (a) { return !/supuesto/.test(a) }).length
    return n ? '<span class="ogo-est mal">⚠️ ' + n + (n > 1 ? ' observaciones' : ' observación') + '</span>' : '<span class="ogo-est bien">✓ completo' + (r.supuestos ? ' · ' + r.supuestos + ' supuesto' + (r.supuestos > 1 ? 's' : '') : '') + '</span>'
  }
  function ogoLista(r) {
    if (!r) return ''
    var it = []
    if (r.faltan.length) it.push('<li><b>Faltan apartados del modelo:</b> ' + r.faltan.map(esc).join(' · ') + '</li>')
    if (r.faltanTexto.length) it.push('<li><b>No dice:</b> ' + r.faltanTexto.map(esc).join(' · ') + '</li>')
    if (r.vacios.length) it.push('<li><b>Apartados vacíos:</b> ' + r.vacios.map(esc).join(' · ') + '</li>')
    if (r.marcadores.length) it.push('<li><b>Marcas sin llenar:</b> ' + r.marcadores.map(function (m) { return '«' + esc(m.slice(0, 80)) + '»' }).join(' · ') + '</li>')
    r.avisos.filter(function (a) { return !/supuesto/.test(a) }).forEach(function (a) { it.push('<li>' + esc(a) + '</li>') })
    var sup = r.avisos.filter(function (a) { return /supuesto/.test(a) })[0]
    return (it.length ? '<ul class="ogo-obs">' + it.join('') + '</ul>' : '<p class="ogo-ok">✓ Tiene todos los apartados del modelo de la Escuela, sin vacíos ni marcas sin llenar (' + r.apartados + ' apartados).</p>') +
      (sup ? '<p class="ogo-nota">🔎 ' + esc(sup) + '</p>' : '')
  }
  function ogoCampo(k, rot, ph, area) {
    var v = (ogo.config || {})[k] || '', cc = ogoEjUlt ? OGO.completarConfig(Object.assign(OGO.vacio(''), { auto: ogo.auto }), ogoEjUlt, { escalon: escalon }) : null, der = cc ? cc.config[k] : ''
    if (der && typeof der === 'string') ph = der + '  (de ' + (cc.autoDe[k] || '«Mesa · Preparación»') + ')'
    return '<label class="ogo-campo"><span>' + esc(rot) + '</span>' + (area ? '<textarea data-ogo-cfg="' + k + '" rows="3" placeholder="' + esc(ph || '') + '">' + esc(v) + '</textarea>' : '<input type="text" data-ogo-cfg="' + k + '" value="' + esc(v) + '" placeholder="' + esc(ph || '') + '">') + '</label>'
  }
  function htmlOGO() {
    if (!OGO) return ''
    var c = ogo.config || {}, L = OGO.letras(ogo), F = focoDe(foco), nom = claveCarpeta(), sel = c.seleccion || OGO.seleccionInicial()
    var lista = OGO.elegidos(ogo), escritos = lista.filter(function (d) { return ogo.docs && ogo.docs[d.id] }).length
    var h = '<div class="ogo" id="sid-ogo">' +
      '<p class="ogo-ayuda"><b>Cómo:</b> 1) revisá los datos de la Orden; 2) elegí los anexos; 3) en cada documento, de arriba hacia abajo: <b>🤖 Pedido</b> → pegalo en la IA → pegá lo que contestó → <b>💾 Guardar</b> (cada pedido lleva lo ya escrito, así todo queda coherente); 4) <b>✅ Revisar todo</b>; 5) <b>⬇️ Word</b> y <b>📎 al ejercicio</b>.</p>' +
      (!nom ? '<p class="ogo-aviso">⚠️ Abrí (o creá) el ejercicio en la Mesa: la OGO va con el nombre del ejercicio.</p>' : '') +
      '<button type="button" class="chico ogo-sec" data-a="ogo-datos" aria-expanded="' + verOgoDatos + '">🧾 Datos de la Orden y del membrete' + (verOgoDatos ? ' ▴' : ' ▸') + '</button>'
    if (verOgoDatos) {
      h += '<div class="ogo-datos"><p class="ogo-nota">Lo vacío se completa solo con la Mesa al armar los pedidos y el Word: quien expide (tu «¿Quién soy?» del inicio), su escalón superior (de las FF.TT.T.O.: el CTO), el CG (la población más cercana a su PC en la carta), la fecha que fijó la IA y lo de «Mesa · Preparación». Sin iniciales va «XYZ».</p>' +
        '<label class="ogo-campo"><span>Tipo</span><select data-ogo-cfg="tipo"><option value="orden"' + (c.tipo !== 'plan' ? ' selected' : '') + '>Orden de operaciones (sin hipótesis)</option><option value="plan"' + (c.tipo === 'plan' ? ' selected' : '') + '>Plan de operaciones (con hipótesis)</option></select></label>' +
        ogoCampo('numero', 'N° de la Orden', '01') + ogoCampo('unidad', 'Unidad que expide (la tuya)', 'FF.TT. «…» / CE-I') + ogoCampo('superior', 'Escalón superior de tu unidad (arriba del membrete)', 'COMANDO EN JEFE…') +
        ogoCampo('alumnos', 'Unidad que la recibe (los alumnos)', 'DIV.MEC.-1') + ogoCampo('lugar', 'CG / lugar del puesto comando', 'VIACHA') + ogoCampo('fechaHora', 'Fecha y hora (grupo fecha-hora o D/H)', '250600-JUN / D-5 (0800)') +
        ogoCampo('carta', 'Carta', 'Bolivia, hoja …, Esc. 1:250.000') + ogoCampo('iniciales', 'Iniciales del elaborador', 'SMM') + ogoCampo('jem', 'Iniciales del JEM', 'JGS') +
        ogoCampo('firma', 'Firma (vacío = «EL COMANDANTE DE …»)', '') + ogoCampo('distribucion', 'Distribución (una línea por destino)', 'Original: …\nCopia 1-12: UU. DEP.\nCopia 13: ARCHIVO', true) +
        '<label class="ogo-check"><input type="checkbox" data-ogo-cfg="ensenanza"' + (c.ensenanza ? ' checked' : '') + '> Leyenda «Solo para fines de enseñanza» al pie</label></div>'
    }
    h += '<div class="org-tit ogo-tit">Documentos de la OGO · ' + escritos + ' de ' + lista.length + ' escritos</div><ul class="ogo-docs">' + OGO.DOCS.map(function (d) {
      var on = d.principal || (sel[d.id] && (!d.apendiceDe || sel[d.apendiceDe])), ab = ogoAbierto === d.id, x = ogo.docs && ogo.docs[d.id]
      var rot = d.principal ? OGO.tituloOrden(ogo) : d.apendiceDe ? 'Apéndice “' + (L[d.id] || d.numero) + '” al Anexo “' + (L[d.apendiceDe] || '?') + '”' : 'Anexo'
      var li = '<li class="ogo-doc' + (on ? '' : ' fuera') + (ab ? ' abierto' : '') + '" data-ogo-doc="' + d.id + '"><div class="ogo-fila">' +
        (d.principal ? '<span class="ogo-fija">📜</span>' : '<input type="checkbox" data-ogo-sel="' + d.id + '"' + (sel[d.id] ? ' checked' : '') + (d.apendiceDe && !sel[d.apendiceDe] ? ' disabled' : '') + ' aria-label="Incluir ' + esc(d.nom) + '">') +
        '<span class="ogo-nom"><b>' + esc(rot) + '</b>' + (!d.principal && !d.apendiceDe ? ' <input type="text" class="ogo-letra" data-ogo-letra="' + d.id + '" value="' + esc(L[d.id] || '') + '" maxlength="1" aria-label="Letra del anexo" title="Letra del anexo (la cambiás si el reglamento las ordena distinto)"' + (on ? '' : ' disabled') + '>' : '') + ' ' + esc(d.principal ? '(el cuerpo de la Orden)' : d.nom) +
        (OGO.entrena(d, F) ? ' <span class="ogo-entrena" title="Es el campo que entrena el ejercicio: el superior da todo lo que sabe, con datos, y el alumno hace su propio anexo">⭐ entrena</span>' : '') + '</span>' +
        (on ? ogoEstado(d.id) : '') + '</div>'
      if (on) li += '<div class="ia-acc"><button type="button" class="ir" data-a="ogo-pedido">' + (ab ? '🤖 Pedido ▴' : '🤖 Pedido ▸') + '</button>' + (x || d.id === 'calco' ? '<button type="button" class="ir" data-a="ogo-word"' + (d.id === 'calco' ? ' title="El calco GRÁFICO: lo dibujado en la Mesa con las dos cruces de amarre"' : '') + '>⬇️ Word</button>' : '') + '</div>'
      if (on && ab) {
        var r = ogoRevDoc[d.id] || ogoRevisionDe(d.id), b = ogoBorr[d.id], val = b != null ? b : x ? x.texto : ''
        li += '<div class="ia-caja"><p class="ia-ayuda">' + (ogoPedidoDe === 'corregir' ? '<b>Pedido de CORRECCIÓN</b>: le dice a la IA qué le falta y le pide el documento completo corregido. ' : 'El pedido lleva el <b>modelo de la Escuela</b> de este documento, lo ya escrito de la OGO y todo lo de la Mesa. ') + 'Copialo y pegalo en ChatGPT, Gemini o Claude (' + ogoPedido.length.toLocaleString('es') + ' caracteres).</p>' +
          '<div class="ia-acc"><button type="button" class="ir" data-a="ogo-copiar">📋 Copiar el pedido</button><button type="button" class="ir" data-a="ogo-bajar-pedido">⬇️ .md</button><button type="button" class="chico" data-a="ogo-cerrar">Cerrar</button></div>' +
          '<textarea data-ogo-pedido readonly rows="6" aria-label="Pedido a la IA">' + esc(ogoPedido) + '</textarea>' +
          '<div class="ia-resp"><div class="ia-resp-tit">📥 Lo que contestó la IA<span>Pegalo entero (con «PARA EL PROFESOR»: no va al Word ni a los alumnos). Si vino cortado («SIGUE: …»), pedile el resto y pegalo debajo.</span></div>' +
          '<textarea data-ogo-resp="' + d.id + '" rows="8" placeholder="Pegá acá lo que contestó la IA para este documento">' + esc(val) + '</textarea>' +
          '<div class="ia-acc"><button type="button" class="ir" data-a="ogo-guardar">💾 Guardar y revisar</button>' + (x ? '<button type="button" class="chico" data-a="ogo-quitar" title="Sacar este documento de la OGO guardada">🗑️</button>' : '') + '</div>' +
          (x ? '<div class="ia-guardada">💾 Guardado el ' + esc(CARP ? CARP.fecha(x.guardado) : x.guardado) + ' · ' + x.texto.length.toLocaleString('es') + ' caracteres</div>' : '') +
          (aviso['ogo-' + d.id] ? '<div class="ia-aviso">' + esc(aviso['ogo-' + d.id]) + '</div>' : '') +
          (r ? '<div class="ogo-rev"><div class="org-tit">✅ Revisión contra el modelo</div>' + ogoLista(r) + (r.ok ? '' : '<button type="button" class="ir" data-a="ogo-corregir">🤖 Pedido de corrección</button>') + '</div>' : '') + '</div></div>'
      }
      return li + '</li>'
    }).join('') + '</ul>'
    h += '<div class="ia-acc ogo-fin"><button type="button" class="ir" data-a="ogo-revisar">✅ Revisar todo</button>' + (COH ? '<button type="button" class="ir" data-a="coh-ir" title="El paso que sigue: la IA revisa todos los documentos juntos y los devuelve consolidados, sin contradicciones">🔎 Revisión de coherencia (paso 11) ▸</button>' : '') + '<button type="button" class="ir" data-a="ogo-zip"' + (escritos ? '' : ' disabled') + '>⬇️ Todo en Word (.zip)</button><button type="button" class="ir" data-a="ogo-md"' + (escritos ? '' : ' disabled') + '>⬇️ Todo (.md)</button><label class="ir ogo-subir">📤 Cargar (.md)<input type="file" data-ogo-archivo accept=".md,.txt,text/markdown,text/plain" hidden></label><button type="button" class="ir" data-a="ogo-adjuntar"' + (escritos ? '' : ' disabled') + ' title="Suma los documentos de la OGO a los documentos del ejercicio: los ven los alumnos. Lo «PARA EL PROFESOR» no va.">📎 Adjuntar al ejercicio</button></div>' +
      (aviso.ogo ? '<div class="ia-aviso">' + esc(aviso.ogo) + '</div>' : '')
    if (ogoRev) {
      h += '<div class="ogo-rev ogo-todo"><div class="org-tit">' + (ogoRev.ok ? '✅ La OGO está completa: ' : '📋 Revisión de la OGO: ') + ogoRev.listos + ' de ' + ogoRev.total + ' documentos sin observaciones</div>' +
        (ogoRev.generales.length ? '<ul class="ogo-obs">' + ogoRev.generales.map(function (g) { return '<li>' + esc(g) + '</li>' }).join('') + '</ul>' : '') +
        '<ul class="ogo-res">' + lista.map(function (d) { var r = ogoRev.docs[d.id]; return '<li>' + esc(OGO.corto(d.id, ogo)) + ' — ' + (!r ? '⏳ sin escribir' : r.ok ? '✓' : '⚠️ ' + (r.faltan.length + r.faltanTexto.length + r.vacios.length + r.marcadores.length + r.avisos.filter(function (a) { return !/supuesto/.test(a) }).length) + ' observación(es) (abrilo para verlas)') + '</li>' }).join('') + '</ul></div>'
    }
    return h + '</div>'
  }
  function ogoAbrirDoc(id, modo_) {
    ogoAbierto = id; ogoPedidoDe = modo_ || 'pedido'; ogoPedido = '… armando el pedido con el ejercicio de la Mesa'
    pintar(true)
    return ogoContexto().then(function (o) {
      if (ogoAbierto !== id) return
      ogoPedido = modo_ === 'corregir' ? OGO.pedidoCorregir(id, OGO.revisar(id, (ogo.docs[id] || {}).texto || '', { ogo: o.est }), o.ctx) : OGO.pedido(id, o.ctx)
      pintar(true)
    }).catch(function (e) { ogoPedido = '⚠️ No se pudo armar el pedido: ' + (e && e.message ? e.message : e); pintar(true) })
  }
  function bajarBlob(nombre, blob) {
    var a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click()
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove() }, 1500)
  }
  // El Word con el formato militar de la Mesa: word.js con la librería docx del compilado
  // (window.SIDMilLib, la que el compilado le da a formato-militar).
  var wordMod = null
  function conWord() {
    var L = window.SIDMilLib
    if (!L || !L.Packer || !L.Document) return Promise.reject(new Error('la Mesa todavía no cargó su formato militar (recargá la página)'))
    if (!wordMod) wordMod = import('../formato-militar/v1/word.js?v=sigla20261011').then(function (m) { m.configurarWord(L); return m }, function (e) { wordMod = null; throw e })
    return wordMod
  }
  // El Anexo A es el GRÁFICO de la Mesa (ogo-calco.js): el SVG se pasa a PNG en un canvas.
  function svgAPng(svg, w, h, k) {
    return new Promise(function (ok, no) {
      var img = new Image()
      img.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k)
          var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height)
          c.toBlob(function (b) { if (!b) return no(new Error('no se pudo dibujar el calco')); b.arrayBuffer().then(function (buf) { ok(new Uint8Array(buf)) }, no) }, 'image/png')
        } catch (e) { no(e) }
      }
      img.onerror = function () { no(new Error('no se pudo dibujar el calco')) }
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    })
  }
  function calcoImagen(ej, k) {
    if (!CALCO) return Promise.reject(new Error('falta el módulo del calco (recargá la página)'))
    var d = CALCO.dibujo(ej || {})
    if (!d.svg) return Promise.reject(new Error(d.avisos.join(' ')))
    return svgAPng(d.svg, d.ancho, d.alto, k || 2).then(function (png) { var t = CALCO.paraWord(d); return { data: png, ancho: t.ancho, alto: t.alto, dibujo: d } })
  }
  function base64De(u8) { var s = '', i, n = 8192; for (i = 0; i < u8.length; i += n) s += String.fromCharCode.apply(null, u8.subarray(i, i + n)); return btoa(s) }
  function wordDe(id, est, ej) {
    return conWord().then(function (W) {
      var x = OGO.cfgWord(id, est), texto = (est.docs[id] || {}).texto || ''
      // sin nada que dibujar en la carta: con texto escrito sale el texto; sin texto, el aviso de qué falta
      return (id === 'calco' ? calcoImagen(ej || ogoEjUlt, 2).catch(function (e) { if (OGO.una(texto)) return null; throw e }) : Promise.resolve(null)).then(function (im) {
        return window.SIDMilLib.Packer.toBlob(W.crearWord(OGO.aSpec(id, texto, est, im ? { imagen: { data: im.data, ancho: im.ancho, alto: im.alto } } : {}), x.cfg, x.padre))
      })
    })
  }
  // Lo de la OGO que va a los alumnos: los documentos en texto (sin «PARA EL PROFESOR») y el Anexo A como
  // la IMAGEN del calco (si la carta no tiene qué dibujar, va su texto). ids: sólo esos documentos.
  function documentosAlumnos(est, ej, ids) {
    var nom = function (id) { return OGO.nombreArchivo(id, est) + '.md' }
    var docs = OGO.paraEjercicio(est).filter(function (d) { return !ids || ids.some(function (id) { return d.nombre === nom(id) }) })
    var conCalco = OGO.elegidos(est).some(function (d) { return d.id === 'calco' }) && (!ids || ids.indexOf('calco') >= 0)
    if (!conCalco) return Promise.resolve(docs)
    return calcoImagen(ej, 1.5).then(function (im) {
      return docs.filter(function (d) { return d.nombre !== nom('calco') }).concat([{ nombre: OGO.nombreArchivo('calco', est) + '.png', mime: 'image/png', tipo: 'imagen', texto: '', base64: base64De(im.data), paginas: 0, categoria: 'orden' }])
    }, function () { return docs })
  }

  function ogoAccion(acc, id) {
    var d = id && OGO.doc(id)
    if (acc === 'ogo-datos') { verOgoDatos = !verOgoDatos; pintar(true); if (verOgoDatos) ogoContexto().then(function () { ogoVer++; pintar(true) }, function () {}); return }
    if (acc === 'ogo-pedido' && d) { if (ogoAbierto === id) { ogoAbierto = ''; pintar(true) } else ogoAbrirDoc(id); return }
    if (acc === 'ogo-cerrar') { ogoAbierto = ''; pintar(true); return }
    if (acc === 'ogo-copiar') { var did = ogoAbierto; copiar(ogoPedido).then(function () { aviso['ogo-' + did] = '📋 Pedido copiado (' + ogoPedido.length.toLocaleString('es') + ' caracteres): pegalo en la IA.'; pintar(true) }, function () { aviso['ogo-' + did] = 'No se pudo copiar: seleccioná el texto y copialo a mano.'; pintar(true) }); return }
    if (acc === 'ogo-bajar-pedido') { bajar('pedido-ia-ogo-' + OGO.nombreArchivo(ogoAbierto, ogo).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) + '.md', ogoPedido); aviso['ogo-' + ogoAbierto] = '⬇️ Bajado: adjuntalo a la IA con la orden de cumplirlo.'; pintar(true); return }
    if (acc === 'ogo-corregir' && d) { ogoAbrirDoc(id, 'corregir'); return }
    if (acc === 'ogo-guardar' && d) {
      var ta = panel.querySelector('textarea[data-ogo-resp="' + id + '"]'), txt = ta ? ta.value : ogoBorr[id] || ''
      if (!String(txt).trim()) { aviso['ogo-' + id] = 'Pegá primero lo que contestó la IA en el cuadro.'; return pintar(true) }
      var nuevo = OGO.poner(ogo, id, txt)
      if (COH && !nuevo.mesaRef && ejSync()) nuevo = COH.marcarMesa(nuevo, ejSync()) // desde acá se ve qué cambia en la Mesa
      ogoGuardar(nuevo).then(function () {
        delete ogoBorr[id]; delete ogoRevDoc[id]
        var r = ogoRevisionDe(id)
        aviso['ogo-' + id] = '✓ Guardado. ' + (r.ok ? 'La revisión no encontró faltas.' : 'La revisión encontró observaciones (abajo): «🤖 Pedido de corrección» le pide a la IA el documento corregido.')
        pintar(true)
      }, function (e) { ogoBorr[id] = txt; aviso['ogo-' + id] = '⚠️ No se guardó: ' + (e && e.message ? e.message : e) + '. Lo pegado queda en el cuadro.'; pintar(true) })
      return
    }
    if (acc === 'ogo-quitar' && d) {
      if (!window.confirm('¿Sacar de la OGO guardada el ' + OGO.corto(id, ogo) + '?')) return
      ogoGuardar(OGO.poner(ogo, id, '')).then(function () { ogoBorr[id] = ''; aviso['ogo-' + id] = 'Se sacó de la OGO guardada.'; pintar(true) }, function (e) { aviso['ogo-' + id] = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
      return
    }
    if (acc === 'ogo-word' && d) {
      aviso.ogo = '⏳ Armando el Word del ' + OGO.corto(id, ogo) + '…'; pintar(true)
      ogoContexto().then(function (o) { return wordDe(id, o.est, o.ej).then(function (blob) { bajarBlob(OGO.nombreArchivo(id, o.est) + '.docx', blob); aviso.ogo = '⬇️ Bajado: ' + OGO.nombreArchivo(id, o.est) + '.docx (formato militar de la Mesa).'; pintar(true) }) })
        .catch(function (e) { aviso.ogo = '⚠️ No se pudo armar el Word: ' + (e && e.message ? e.message : e); pintar(true) })
      return
    }
    if (acc === 'ogo-revisar') { ogoContexto().then(function (o) { ogoRev = OGO.revisarTodo(o.est, { ejercicio: o.ej }); aviso.ogo = ''; pintar(true) }); return }
    if (acc === 'ogo-md') { var E_ = escalonDe(escalon); bajar('OGO-' + OGO.nombreArchivo('ogo', ogo).replace(/\s+/g, '-') + '-' + (ogo.ejercicio || 'ejercicio').replace(/[^\w-]+/g, '-') + '.md', OGO.markdown(OGO.completarConfig(ogo, {}), { escalon: E_.profesor, alumnos: E_.alumnos, foco: focoDe(foco).nom })); aviso.ogo = '⬇️ Bajada la OGO entera (.md). Para llevarla a otro equipo: 📤 Cargar, con el ejercicio abierto.'; pintar(true); return }
    if (acc === 'ogo-zip') {
      aviso.ogo = '⏳ Armando los Word…'; pintar(true)
      ogoContexto().then(function (o) {
        var grafico = OGO.calcoDeLaMesa(o.ej)
        var docs = OGO.elegidos(o.est).filter(function (x) { return o.est.docs[x.id] || (x.id === 'calco' && grafico) })
        return conJSZip().then(function (J) {
          var z = new J()
          return docs.reduce(function (pr, x, i) { return pr.then(function () { return wordDe(x.id, o.est, o.ej).then(function (b) { z.file(OGO.nombreArchivo(x.id, o.est, i) + '.docx', b) }) }) }, Promise.resolve())
            .then(function () { var E_ = escalonDe(escalon); z.file('OGO completa (texto, con lo PARA EL PROFESOR).md', OGO.markdown(o.est, { escalon: E_.profesor, alumnos: E_.alumnos, foco: focoDe(foco).nom })); return paqueteJSON(o).then(function (pq) { if (pq) z.file(pq.nombre, pq.texto) }, function () {}) })
            .then(function () { return z.generateAsync({ type: 'blob' }) })
            .then(function (blob) {
              bajarBlob(OGO.nombreArchivo('ogo', o.est) + ' - ' + (o.est.ejercicio || 'ejercicio').replace(/[^\w .-]+/g, '') + '.zip', blob)
              var faltan = OGO.elegidos(o.est).length - docs.length, cm = COH ? COH.estadoMesa(o.est, o.ej).cambios.length : 0
              aviso.ogo = '⬇️ Bajados ' + docs.length + ' Word con el formato militar' + (faltan ? ' (faltan ' + faltan + ' documento(s) por escribir)' : '') + '.' +
                (cm ? ' ⚠️ La Mesa cambió (' + cm + ' cambio(s)) desde que se consolidaron: el calco y el membrete salen de la Mesa de ahora, el texto de los documentos todavía no: «🔄 Refrescar los documentos con la Mesa».' : ''); pintar(true)
            })
        })
      }).catch(function (e) { aviso.ogo = '⚠️ No se pudo armar el .zip: ' + (e && e.message ? e.message : e); pintar(true) })
      return
    }
    if (acc === 'ogo-adjuntar') {
      if (!puente || !puente.agregarDocumentos) { aviso.ogo = '⚠️ Esta Mesa no tiene el puente para adjuntar (recargá la página con el ejercicio abierto).'; return pintar(true) }
      ogoContexto().then(function (o) {
        return documentosAlumnos(o.est, o.ej).then(function (docs) {
          var rev = OGO.revisarTodo(o.est, { ejercicio: o.ej })
          if (!docs.length) { aviso.ogo = 'Todavía no hay documentos escritos.'; return pintar(true) }
          if (!window.confirm('Se adjuntan ' + docs.length + ' documento(s) de la OGO al ejercicio «' + (o.est.ejercicio || '') + '»: los alumnos los ven en los documentos del ejercicio (lo «PARA EL PROFESOR» NO va; el Anexo A va como la imagen del calco).' + (rev.ok ? '' : '\n\n⚠️ La revisión todavía encuentra observaciones (' + rev.listos + ' de ' + rev.total + ' documentos sin observaciones).') + '\n\nSi ya estaban adjuntos, se reemplazan. ¿Seguimos?')) return
          puente.agregarDocumentos(docs)
          aviso.ogo = '📎 ' + docs.length + ' documento(s) adjuntados al ejercicio (se guarda solo).'; pintar(true)
        })
      }).catch(function (e) { aviso.ogo = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
    }
  }

  // ════════ 🔎 Paso 11: la revisión de coherencia (ogo-coherencia.js) ════════
  // Lo pidió Sergio (11-10-2026): antes de repartir, UN pedido con todos los documentos que arregle las
  // contradicciones y devuelva todo consolidado; lo pegado reemplaza cada documento (lo anterior queda).
  function ejSync() { try { var M = window.SIDMesaEjercicio, f = M && M.foto && M.foto(); if (f) return f } catch (e) {} return ogoEjUlt }
  function fechaCorta(iso) { return CARP ? CARP.fecha(iso) : iso }
  // 🔄 Lo que cambió en la Mesa desde que se consolidaron los documentos (Sergio, 11-10-2026: «yo puedo
  // seguir editando… refrescá todos los documentos, OGO, anexos y todo en base a lo que se está
  // modificando en la Mesa… si es necesario se somete otra vez a la IA»). Va en el paso 11 y en el 13;
  // se vuelve a pintar solo cuando cambia la carta (mesaRevisar).
  function htmlMesa(donde) {
    if (!COH || !OGO) return ''
    var escr = OGO.elegidos(ogo).filter(function (d) { return ogo.docs && ogo.docs[d.id] }).length
    if (!escr) return '<div class="sid-mesa" data-donde="' + donde + '"></div>'
    var ej = ejSync() || {}, m = COH.estadoMesa(ogo, ej), h = '<div class="sid-mesa ogo-rev" data-donde="' + donde + '">'
    if (!m.ref) h += '<p class="ogo-nota">🔄 Todavía no hay una foto de la Mesa junto con los documentos: se toma al aplicar la revisión de coherencia. <button type="button" class="chico" data-a="mesa-al-dia">📸 Tomarla ahora</button> (desde ahí se avisa qué cambia en la carta).</p>'
    else if (!m.cambios.length) h += '<p class="ogo-ok">✓ Los documentos están al día con la Mesa (foto del ' + esc(fechaCorta(m.ref.cuando)) + '). Si seguís editando la carta, acá aparece lo que cambie.</p>'
    else {
      h += '<div class="org-tit">🔄 La Mesa cambió desde que se consolidaron los documentos (' + esc(fechaCorta(m.ref.cuando)) + '): ' + m.cambios.length + ' cambio(s)</div>' +
        '<ul class="rep-docs">' + m.cambios.slice(0, 12).map(function (c) { return '<li>' + esc(c.tipo + ' ' + c.texto) + '</li>' }).join('') + (m.cambios.length > 12 ? '<li>… y ' + (m.cambios.length - 12) + ' más (van todos en el pedido).</li>' : '') + '</ul>' +
        '<p class="ogo-nota">El calco del Anexo A y el membrete (la unidad, el CG por la población más cercana) ya salen de la Mesa de ahora al bajar los Word. El TEXTO de la Orden y de los anexos lo reescribe la IA: <b>🔄 Refrescar</b> arma el pedido con estos cambios y TODOS los documentos; pegá la respuesta en el paso 11 y <b>💾 Aplicar</b>.</p>' +
        '<div class="ia-acc"><button type="button" class="ir" data-a="mesa-pedido">🔄 Refrescar los documentos con la Mesa (IA)</button><button type="button" class="chico" data-a="mesa-al-dia" title="Los documentos ya dicen esto: se toma la Mesa de ahora como la de los documentos">✓ Ya están al día</button></div>'
    }
    return h + (aviso.mesa ? '<div class="ia-aviso">' + esc(aviso.mesa) + '</div>' : '') + '</div>'
  }
  function mesaAccion(acc) {
    if (acc === 'mesa-pedido') {
      cohArmar(false, 'actualizar').then(function () { var lc = panel.querySelector('#sid-coh'); if (lc) lc.scrollIntoView({ block: 'start' }) })
      aviso.coh = '🔄 Pedido para refrescar los documentos con la Mesa: copialo, pegalo en la IA y pegá su respuesta acá abajo (💾 Aplicar).'
      return
    }
    if (acc === 'mesa-al-dia') {
      var ej = ejSync(); if (!ej) { aviso.mesa = 'Abrí el ejercicio en la Mesa.'; return pintar(true) }
      ogoGuardar(COH.marcarMesa(ogo, ej)).then(function () { aviso.mesa = '📸 Listo: desde ahora se avisa lo que cambie en la carta.'; pintar(true) }, function (e) { aviso.mesa = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
    }
  }
  function htmlCoherencia() {
    if (!COH || !OGO) return ''
    var e = COH.estado(ogo), lista = OGO.elegidos(ogo), escr = lista.filter(function (d) { return ogo.docs && ogo.docs[d.id] }).length
    var h = '<div class="ogo coh" id="sid-coh">' + htmlMesa('coh') + '<p class="ogo-ayuda"><b>Cómo:</b> 1) <b>🤖 Pedido de coherencia</b>: lleva los ' + escr + ' documentos escritos, la carta (fichas con su población más cercana) y las poblaciones; pegalo en la IA. 2) Pegá TODO lo que contestó (si vino en partes, cada parte debajo de la anterior). 3) <b>💾 Aplicar</b>: cada documento se reemplaza por el consolidado (lo anterior queda para volver atrás). 4) Si cortó, <b>🤖 Pedido para seguir</b>.</p>'
    if (!escr) h += '<p class="ogo-aviso">⚠️ Primero escribí la OGO (paso 10): la revisión trabaja sobre lo escrito.</p>'
    var tituloPed = cohModo === 'actualizar' ? '🔄 Pedido para refrescar con la Mesa' : '🤖 Pedido de coherencia'
    h += '<div class="ia-acc"><button type="button" class="ir" data-a="coh-pedido" aria-expanded="' + cohAbierto + '">' + tituloPed + (cohAbierto ? ' ▴' : ' ▸') + '</button>' +
      (e.aplicado && e.faltan.length ? '<button type="button" class="ir" data-a="coh-seguir">🤖 Pedido para seguir (faltan ' + e.faltan.length + ')</button>' : '') + '</div>'
    if (cohAbierto) h += '<div class="ia-caja"><p class="ia-ayuda">Copialo y pegalo en ChatGPT, Gemini o Claude (' + cohPedido.length.toLocaleString('es') + ' caracteres). Si la IA corta («SIGUE: …»), pedile el resto con «🤖 Pedido para seguir».</p>' +
      '<div class="ia-acc"><button type="button" class="ir" data-a="coh-copiar">📋 Copiar el pedido</button><button type="button" class="ir" data-a="coh-bajar">⬇️ .md</button><button type="button" class="chico" data-a="coh-cerrar">Cerrar</button></div>' +
      '<textarea data-coh-pedido readonly rows="6" aria-label="Pedido de coherencia">' + esc(cohPedido) + '</textarea></div>'
    h += '<div class="coh-resp"><div class="ia-resp-tit">📥 Lo que contestó la IA<span>Con sus marcas «=== REVISIÓN ===», «=== DATOS ===» y «=== DOCUMENTO: … ===». Si vino en partes, pegá cada una debajo de la anterior.</span></div>' +
      '<textarea data-coh-resp rows="8" placeholder="Pegá acá la respuesta consolidada">' + esc(cohBorr) + '</textarea>' +
      '<div class="ia-acc"><button type="button" class="ir" data-a="coh-aplicar">💾 Aplicar los documentos consolidados</button>' + (e.hechos.length ? '<button type="button" class="chico" data-a="coh-deshacer" title="Vuelve cada documento a como estaba antes de consolidarlo">↶ Volver a lo anterior</button>' : '') + '</div></div>'
    if (e.aplicado) {
      h += '<div class="ogo-rev"><div class="org-tit">' + (e.faltan.length ? '📋 Consolidados ' : '✅ La OGO está consolidada: ') + e.hechos.length + ' de ' + lista.length + ' documentos · ' + esc(fechaCorta(e.aplicado)) + '</div>' +
        (e.faltan.length ? '<p class="ogo-nota">Faltan: ' + e.faltan.map(function (id) { return esc(OGO.corto(id, ogo)) }).join(' · ') + '</p>' : '') +
        (e.datos && e.datos.membrete && e.datos.membrete.fechaHora ? '<p class="ogo-nota">📅 Fecha de la OGO: <b>' + esc(e.datos.membrete.fechaHora) + '</b> (va al membrete de todos los documentos)</p>' : '') +
        (e.revision ? '<details class="coh-rev"><summary>🔎 Lo que corrigió la IA</summary><div class="car-txt">' + esc(e.revision) + '</div></details>' : '') + '</div>'
      var n = COH.porUbicar(ogo, ejSync() || {}, { escalon: escalon }).filter(function (x) { return x.estado === 'pendiente' }).length
      var nm = COH.medidasPorDibujar(ogo, ejSync() || {}).filter(function (x) { return x.estado === 'pendiente' }).length
      if (n || nm) h += '<button type="button" class="ir coh-ubi" data-a="ubi-ir">📍 ' + [n ? n + ' unidad' + (n > 1 ? 'es' : '') + ' para colocar' : '', nm ? nm + ' medida' + (nm > 1 ? 's' : '') + ' para dibujar' : ''].filter(Boolean).join(' y ') + ' (paso 12) ▸</button>'
    }
    return h + (aviso.coh ? '<div class="ia-aviso">' + esc(aviso.coh) + '</div>' : '') + '</div>'
  }
  // modo 'actualizar': el pedido de coherencia con lo que cambió en la Mesa adelante (🔄 Refrescar).
  function cohArmar(seguir, modo_) {
    cohModo = seguir ? cohModo : modo_ || ''
    cohAbierto = true; cohPedido = '… armando el pedido con TODOS los documentos y la Mesa'; pintar(true)
    return ogoContexto().then(function (o) {
      cohPedido = seguir ? COH.pedidoSeguir(o.est) || 'No falta ningún documento: la OGO ya está consolidada.'
        : cohModo === 'actualizar' ? COH.pedidoActualizar(o.ctx, COH.estadoMesa(o.est, o.ej).cambios) : COH.pedido(o.ctx)
      pintar(true)
    }).catch(function (e) { cohPedido = '⚠️ No se pudo armar el pedido: ' + (e && e.message ? e.message : e); pintar(true) })
  }
  function cohAccion(acc) {
    if (acc === 'coh-ir') { var lc = panel.querySelector('#sid-coh'); if (lc) lc.scrollIntoView({ block: 'start' }); return }
    if (acc === 'coh-pedido') { if (cohAbierto) { cohAbierto = false; pintar(true) } else cohArmar(false); return }
    if (acc === 'coh-seguir') { cohArmar(true); return }
    if (acc === 'coh-cerrar') { cohAbierto = false; pintar(true); return }
    if (acc === 'coh-copiar') { copiar(cohPedido).then(function () { aviso.coh = '📋 Pedido copiado (' + cohPedido.length.toLocaleString('es') + ' caracteres): pegalo en la IA.'; pintar(true) }, function () { aviso.coh = 'No se pudo copiar: seleccioná el texto y copialo a mano.'; pintar(true) }); return }
    if (acc === 'coh-bajar') { bajar('pedido-ia-coherencia-' + String(ogo.ejercicio || 'ejercicio').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '.md', cohPedido); aviso.coh = '⬇️ Bajado: adjuntalo a la IA con la orden de cumplirlo.'; pintar(true); return }
    if (acc === 'coh-aplicar') {
      var ta = panel.querySelector('textarea[data-coh-resp]'), txt = ta ? ta.value : cohBorr
      cohBorr = txt
      if (!String(txt).trim()) { aviso.coh = 'Pegá primero lo que contestó la IA.'; return pintar(true) }
      var leido = COH.leer(txt, ogo)
      if (leido.vacio || (!Object.keys(leido.docs).length && !leido.datos)) { aviso.coh = '⚠️ No encuentro las marcas «=== DOCUMENTO: … ===» ni «=== DATOS ===»: pegá la respuesta completa de la IA al pedido de coherencia.'; return pintar(true) }
      var r = COH.aplicar(ogo, leido, undefined, ejSync()) // con la Mesa de ahora: lo que cambie después se avisa
      ogoGuardar(r.est).then(function () {
        cohModo = ''
        ogoCache = {}; ogoRev = null; ogoRevDoc = {}
        var n = COH.porUbicar(ogo, ejSync() || {}, { escalon: escalon }).filter(function (x) { return x.estado === 'pendiente' }).length
        aviso.coh = '✓ ' + r.aplicados.length + ' documento(s) consolidados' + (r.aplicados.length ? ' (' + r.aplicados.map(function (id) { return OGO.corto(id, ogo).split(' — ')[0] }).join(', ') + ')' : '') + '.' +
          (leido.sigue ? ' La IA cortó («SIGUE»): 🤖 Pedido para seguir.' : '') + (leido.desconocidos.length ? ' No reconocí: ' + leido.desconocidos.join(' · ') + '.' : '') + (n ? ' 📍 ' + n + ' unidad(es) para colocar en la carta (paso 12).' : '')
        pintar(true)
        if (n) { var li = panel.querySelector('#sid-ubi'); if (li) li.scrollIntoView({ block: 'start' }) }
      }, function (e) { aviso.coh = '⚠️ No se guardó: ' + (e && e.message ? e.message : e) + '. Lo pegado queda en el cuadro.'; pintar(true) })
      return
    }
    if (acc === 'coh-deshacer') {
      if (!window.confirm('¿Volver cada documento consolidado a como estaba antes de la revisión de coherencia?')) return
      var d = COH.deshacer(ogo)
      ogoGuardar(d.est).then(function () { ogoCache = {}; ogoRev = null; aviso.coh = '↶ ' + d.vueltos + ' documento(s) vueltos a lo anterior.'; pintar(true) }, function (e) { aviso.coh = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
    }
  }

  // ════════ 📍 Paso 12: las unidades que faltan en la carta (✓ Aceptar) ════════
  function kmTxt(x) { return x.toFixed(1).replace('.', ',') }
  function ll4(x) { return (Math.round(x * 1e4) / 1e4).toFixed(4) }
  // Si la carta cambia por fuera del panel (↶ Deshacer, 🗑️ en 🪖 Unidades o ⚫ MEDIDAS), el paso 12 se
  // vuelve a pintar solo: lo que manda es la carta. Sólo ese bloque (no tiene campos que se escriban).
  var ubiFirma = '', ubiT = 0
  function firmaCarta(ej) {
    var o = (ej && ej.ops) || {}, nom = function (x) { return x && (x.nombre || x.etiqueta) || '' }
    return [(ej && ej.unidades || []).map(function (u) { return u.designacion }).join('|'), (o.limites || []).map(nom).join('|'), (o.objetivos || []).map(nom).join('|'), (o.coordinacion || []).map(nom).join('|')].join('#')
  }
  function ubiRevisar() {
    clearTimeout(ubiT)
    ubiT = setTimeout(function () {
      if (modo !== 'profesor') return
      var viejo = panel && panel.querySelector('#sid-ubi'), ej = COH ? ejSync() : null
      if (!ej) return
      mesaRevisar(ej)
      if (!viejo) return
      var f = firmaCarta(ej)
      if (f === ubiFirma) return
      var d = document.createElement('div'); d.innerHTML = htmlPorUbicar()
      if (d.firstChild) viejo.parentNode.replaceChild(d.firstChild, viejo)
    }, 250)
  }
  // 🔄 Lo mismo para «La Mesa cambió» (pasos 11 y 13) y el reparto (paso 13: aparecen las áreas y las
  // selecciones nuevas): «hasta lo último» que se editó, sin recargar. El reparto no se repinta mientras
  // se escribe en uno de sus campos.
  var mesaFirma = ''
  function mesaRevisar(ej) {
    if (!COH || !OGO || !panel || !ej) return
    var f = JSON.stringify(COH.huella(ej)) + '#' + seleccionesDe(ej).map(function (x) { return x.id + ':' + x.nombre + ':' + x.guardada }).join('|') + '#' + JSON.stringify(ogo && ogo.mesaRef ? ogo.mesaRef.cuando : '')
    if (f === mesaFirma) return
    var rp = panel.querySelector('#sid-rep'), activo = document.activeElement
    if (rp && activo && rp.contains(activo) && /^(INPUT|TEXTAREA|SELECT)$/.test(activo.tagName) && activo.type !== 'checkbox' && activo.type !== 'radio') return
    mesaFirma = f
    panel.querySelectorAll('.sid-mesa').forEach(function (b) { if (rp && rp.contains(b)) return; var d = document.createElement('div'); d.innerHTML = htmlMesa(b.getAttribute('data-donde') || ''); if (d.firstChild) b.parentNode.replaceChild(d.firstChild, b) })
    if (rp) { var d2 = document.createElement('div'); d2.innerHTML = htmlRepartir(); if (d2.firstChild) rp.parentNode.replaceChild(d2.firstChild, rp) }
  }
  function htmlPorUbicar() {
    if (!COH) return ''
    var ej = ejSync()
    if (!ej) return '<div class="ubi" id="sid-ubi"><p class="ogo-nota">Abrí el ejercicio en la Mesa.</p></div>'
    ubiFirma = firmaCarta(ej)
    var items = COH.porUbicar(ogo, ej, { escalon: escalon })
    var pend = items.filter(function (x) { return x.estado === 'pendiente' }), col = items.filter(function (x) { return x.estado === 'colocada' }), desc = items.filter(function (x) { return x.estado === 'descartada' }), ya = items.filter(function (x) { return x.estado === 'en la carta' })
    var h = '<div class="ubi" id="sid-ubi">'
    if (!items.length) h += '<p class="ogo-nota">Todavía no hay unidades para revisar: escribí la Orden con su organización de la tarea (paso 10) y hacé la revisión de coherencia (paso 11).</p>'
    else if (!pend.length) h += '<p class="ogo-ok">✓ Todas las unidades que nombran los documentos están en la carta.</p>'
    else h += '<p class="ogo-ayuda">Las que nombran los documentos y <b>no están en la carta</b>. <b>✓ Aceptar</b> la coloca donde dice (la de la IA, si el terreno no la objeta, o la que la Mesa busca en el terreno: caminos, poblaciones, CMOC, agua, enemigo) y saca el «(supuesto)» de los documentos. Después la movés en 🪖 Unidades si hace falta.</p>'
    if (pend.length) h += '<ul class="ubi-lista">' + pend.map(function (x) {
      var u = x.u
      return '<li class="ubi-it" data-ubi="' + esc(x.clave) + '"><div class="ubi-nom">' + (u.tipo === 'pc' ? '🚩' : '🪖') + ' <b>' + esc(u.designacion) + '</b> <small>' + esc((u.tipo === 'pc' ? 'puesto comando' : u.arma) + ' · ' + u.escalon) + '</small>' + (u.supuesto ? ' <span class="ogo-entrena">estaba «(supuesto)»</span>' : '') + (u.relacion ? ' <small>· ' + esc(u.relacion) + '</small>' : '') + '</div>' +
        (x.lat != null ? '<div class="ubi-lug">📍 ' + (x.poblacion ? 'cerca de <b>' + esc(x.poblacion.nombre.toUpperCase()) + '</b> (' + esc(x.poblacion.tipo || 'población') + ', ' + kmTxt(x.poblacion.km) + ' km)' : 'sin población cercana') + ' · ' + ll4(x.lat) + ', ' + ll4(x.lng) + ' · <i>' + (x.de === 'la IA' ? 'ubicación de la IA' : x.de === 'el terreno' ? 'buscada en el terreno' : 'sugerida por la Mesa') + '</i>' + (x.dentro === false ? ' · <b class="ubi-fuera">⚠️ fuera del Área de Operaciones</b>' : '') + '</div>' : '<div class="ubi-lug">⚠️ Sin ubicación: trazá el Área de Operaciones o colocala a mano.</div>') +
        (x.porque.length ? '<div class="ubi-pq">🧭 ' + esc(x.porque.join(' · ')) + '</div>' : '') + (x.reemplaza ? '<div class="ubi-pq">↪ Se cambió: ' + esc(x.reemplaza) + '.</div>' : '') +
        (x.graves.length ? '<div class="ubi-pq ubi-fuera">⚠️ ' + esc(x.graves.join(' · ')) + '</div>' : '') + (x.notas.length ? '<div class="ubi-pq">ℹ️ ' + esc(x.notas.join(' · ')) + '</div>' : '') +
        (u.porque ? '<div class="ubi-pq">' + esc(u.porque) + '</div>' : '') + (u.de ? '<div class="ubi-pq">de ' + esc(u.de) + '</div>' : '') +
        '<div class="ia-acc"><button type="button" class="ir ubi-ok" data-a="ubi-aceptar"' + (x.lat == null ? ' disabled' : '') + '>✓ Aceptar</button><button type="button" class="chico" data-a="ubi-descartar" title="No colocarla (ya está con otro nombre, o no va)">✕ No colocar</button></div></li>'
    }).join('') + '</ul>' + (pend.length > 1 ? '<div class="ia-acc"><button type="button" class="ir ubi-ok" data-a="ubi-todas">✓ Aceptar todas (' + pend.length + ')</button></div>' : '')
    if (col.length) h += '<p class="ogo-nota">✓ Colocadas: ' + col.map(function (x) { return esc(x.u.designacion) + (x.colocada && x.colocada.poblacion ? ' (' + esc(x.colocada.poblacion) + ')' : '') }).join(' · ') + '</p>'
    if (ya.length) h += '<p class="ogo-nota">Ya en la carta: ' + ya.map(function (x) { return esc(x.u.designacion) }).join(' · ') + '</p>'
    if (desc.length) h += '<p class="ogo-nota">✕ Sin colocar: ' + desc.map(function (x) { return esc(x.u.designacion) + ' <button type="button" class="chico" data-a="ubi-volver" data-ubi-k="' + esc(x.clave) + '" title="Volver a ofrecerla">↺</button>' }).join(' · ') + '</p>'
    h += (aviso.ubi ? '<div class="ia-aviso">' + esc(aviso.ubi) + '</div>' : '') + htmlMedidas(ej)
    return h + '</div>'
  }
  // 📐 Las medidas de coordinación y control de la IA (los DATOS de la coherencia): ✓ Dibujar las pone en
  // la carta por el puente `agregarOps` (index-medidas-20261011.js), con su nombre y ↶ Deshacer.
  var TIPO_MED = { 'línea': '─ línea', 'área': '⬚ área', objetivo: '◎ objetivo', punto: '⊗ punto' }
  function htmlMedidas(ej) {
    var ms = COH.medidasPorDibujar(ogo, ej), pend = ms.filter(function (x) { return x.estado === 'pendiente' })
    var hechas = ms.filter(function (x) { return x.estado === 'dibujada' }), ya = ms.filter(function (x) { return x.estado === 'en la carta' }), desc = ms.filter(function (x) { return x.estado === 'descartada' })
    var h = '<div class="org-tit ubi-med-tit">📐 Medidas de coordinación y control</div>'
    if (!ms.length) return h + '<p class="ogo-nota">La revisión de coherencia (paso 11) no trajo medidas con coordenadas en los DATOS.</p>'
    if (!pend.length) h += '<p class="ogo-ok">✓ Las medidas que nombran los documentos están dibujadas en la carta.</p>'
    else h += '<p class="ogo-ayuda"><b>✓ Dibujar</b> la pone en la carta con su nombre (y en el calco del Anexo A). Después la ajustás en ⚫ MEDIDAS; «↶ Deshacer» de la barra la quita.</p><ul class="ubi-lista">' + pend.map(function (x) {
      var el = x.op.el, n = el.coords ? el.coords.length - (x.op.tipo === 'área' ? 1 : 0) : 1, p = el.centro || el.coords[0]
      return '<li class="ubi-it" data-med="' + esc(x.clave) + '"><div class="ubi-nom">📐 <b>' + esc(el.nombre || el.etiqueta) + '</b> <small>' + esc(TIPO_MED[x.op.tipo] || x.op.tipo) + (el.coords ? ' · ' + n + ' puntos' : '') + (el.escalon ? ' · ' + esc(el.escalon) : '') + '</small></div>' +
        '<div class="ubi-lug">📍 ' + ll4(p[1]) + ', ' + ll4(p[0]) + (el.coords ? ' …' : '') + (x.dentro === false ? ' · <b class="ubi-fuera">⚠️ fuera del Área de Operaciones</b>' : '') + '</div>' +
        '<div class="ia-acc"><button type="button" class="ir ubi-ok" data-a="med-aceptar">✓ Dibujar</button><button type="button" class="chico" data-a="med-descartar" title="No dibujarla">✕ No dibujar</button></div></li>'
    }).join('') + '</ul>' + (pend.length > 1 ? '<div class="ia-acc"><button type="button" class="ir ubi-ok" data-a="med-todas">✓ Dibujar todas (' + pend.length + ')</button></div>' : '')
    if (hechas.length) h += '<p class="ogo-nota">✓ Dibujadas: ' + hechas.map(function (x) { return esc(x.op.el.nombre || x.op.el.etiqueta) }).join(' · ') + '</p>'
    if (ya.length) h += '<p class="ogo-nota">Ya en la carta: ' + ya.map(function (x) { return esc(x.op.el.nombre || x.op.el.etiqueta) }).join(' · ') + '</p>'
    if (desc.length) h += '<p class="ogo-nota">✕ Sin dibujar: ' + desc.map(function (x) { return esc(x.op.el.nombre || x.op.el.etiqueta) + ' <button type="button" class="chico" data-a="med-volver" data-med-k="' + esc(x.clave) + '" title="Volver a ofrecerla">↺</button>' }).join(' · ') + '</p>'
    return h + (aviso.med ? '<div class="ia-aviso">' + esc(aviso.med) + '</div>' : '')
  }
  function medAccion(acc, clave_) {
    var ej = ejSync() || {}, items = COH.medidasPorDibujar(ogo, ej), it = items.filter(function (x) { return x.clave === clave_ })[0]
    if (acc === 'med-descartar' && it) { ogoGuardar(COH.descartarMedida(ogo, it)).then(function () { pintar(true) }, function () {}); return }
    if (acc === 'med-volver' && it) { ogoGuardar(COH.descartarMedida(ogo, it, false)).then(function () { pintar(true) }, function () {}); return }
    var lista = acc === 'med-todas' ? items.filter(function (x) { return x.estado === 'pendiente' }) : acc === 'med-aceptar' && it ? [it] : []
    if (!lista.length) return
    if (!puente || !puente.agregarOps) { aviso.med = '⚠️ Esta Mesa todavía no sabe dibujar las medidas de la IA: recargá la página (Ctrl+F5) con el ejercicio abierto.'; return pintar(true) }
    var r = COH.aceptarMedidas(ogo, lista)
    if (puente.agregarOps(r.capas) === false) { aviso.med = '⚠️ La Mesa no dejó dibujar (ejercicio bloqueado o finalizado).'; return pintar(true) }
    ogoGuardar(COH.absorber(r.est, { capas: r.capas })).then(function () { // las nombran los documentos: no son un «cambio» de la Mesa
      aviso.med = '✓ ' + (lista.length === 1 ? (lista[0].op.el.nombre || lista[0].op.el.etiqueta) + ' dibujada' : lista.length + ' medidas dibujadas') + ' en la carta (y en el calco). ↶ Deshacer (barra) las quita.'
      setTimeout(function () { pintar(true) }, 300)
    }, function (e) { aviso.med = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
  }
  function ubiAccion(acc, clave_) {
    var ej = ejSync() || {}, items = COH.porUbicar(ogo, ej, { escalon: escalon })
    var it = items.filter(function (x) { return x.clave === clave_ })[0]
    if (acc === 'ubi-ir') { var li = panel.querySelector('#sid-ubi'); if (li) li.scrollIntoView({ block: 'start' }); return }
    if (acc === 'ubi-descartar' && it) { ogoGuardar(COH.descartar(ogo, it)).then(function () { pintar(true) }, function () {}); return }
    if (acc === 'ubi-volver' && it) { ogoGuardar(COH.descartar(ogo, it, false)).then(function () { pintar(true) }, function () {}); return }
    var lista = acc === 'ubi-todas' ? items.filter(function (x) { return x.estado === 'pendiente' && x.lat != null }) : acc === 'ubi-aceptar' && it ? [it] : []
    if (!lista.length) return
    if (!puente || !puente.agregarUnidades) { aviso.ubi = '⚠️ Esta Mesa no tiene el puente para colocar fichas (recargá la página con el ejercicio abierto).'; return pintar(true) }
    var est = ogo, fichas = [], cambios = 0
    try { lista.forEach(function (x) { var r = COH.aceptar(est, x); est = r.est; fichas.push(r.ficha); cambios += r.cambios }) } catch (e) { aviso.ubi = '⚠️ ' + e.message; return pintar(true) }
    puente.agregarUnidades(fichas)
    ogoGuardar(COH.absorber(est, { fichas: fichas })).then(function () { // las nombran los documentos: no son un «cambio» de la Mesa
      ogoCache = {}; ogoRev = null
      aviso.ubi = '✓ ' + (fichas.length === 1 ? fichas[0].designacion + ' colocada' + (lista[0].poblacion ? ' cerca de ' + lista[0].poblacion.nombre.toUpperCase() : '') : fichas.length + ' unidades colocadas') + ' en la carta' + (cambios ? '; se sacó «(supuesto)» de ' + cambios + ' línea(s) de los documentos' : '') + '. ↶ Deshacer (barra) las quita de la carta.'
      setTimeout(function () { pintar(true) }, 300) // la Mesa tarda un instante en tener la ficha nueva
    }, function (e) { aviso.ubi = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
  }

  // ════════ 📤 Paso 13: repartir el ejercicio (documentos consolidados + JSON, por ciclo o paralelo) ════════
  // Lo pidió Sergio: «darme los documentos consolidados en la opción de compartir; compartir a los alumnos
  // por ciclo o por paralelo; a estos documentos siempre debe ir el JSON, y con mi tijerita (el ✂️ lazo)
  // compartirles sólo la parte que yo seleccione y que la tenga seleccionada». Va por calco-ops
  // (`areas_destinos` / `ejercicio_enviar`, supabase/espejo-ge/calco-ops/compartir.mjs) con la sesión de
  // SIDECEME de esta Mesa; lo recibe el cursante en «Compartir en la aplicación / Recibidos» de su Mesa.
  var K_REP = 'sid_rep_areas'
  function valida(a) { return !!a && Array.isArray(a.coords) && a.coords.length >= 3 }
  function areasDe(ops) { // como listarAreas (areas-operaciones/modelo.mjs): los mismos id que usa el servidor
    ops = ops || {}
    var l = (ops.areasOps || []).filter(valida).map(function (a, i) { return Object.assign({}, a, { id: a.id || 'ao-' + i }) })
    if (valida(ops.areaOps)) { var act = Object.assign({}, ops.areaOps, { id: ops.areaOps.id || 'ao-original' }), i = -1; l.forEach(function (a, k) { if (a.id === act.id) i = k }); if (i >= 0) l[i] = act; else l.unshift(act) }
    return l
  }
  function repLeer() { try { return JSON.parse(lee(K_REP, '{}'))[claveCarpeta()] || null } catch (e) { return null } }
  function repGuardar(v) { try { var t = JSON.parse(lee(K_REP, '{}')); t[claveCarpeta()] = v; guarda(K_REP, JSON.stringify(t)) } catch (e) {} }
  // 💾 Las selecciones guardadas con el lazo («Guardar selección como área»: ops.selecciones, ver
  // areas-operaciones/modelo.mjs). Elegida una, va ELLA: el área idéntica a lo que se recortó y lo que
  // tenía activo al guardarla (todo lo de adentro, las fichas enemigas, el CMOC a la vista).
  function seleccionesDe(ej) { var l = ej && ej.ops && Array.isArray(ej.ops.selecciones) ? ej.ops.selecciones : []; return l.filter(function (x) { return x && typeof x.id === 'string' && typeof x.nombre === 'string' && valida(x) }) }
  function selElegida(ej) { if (!rep.sel || rep.selDe !== claveCarpeta()) return null; return seleccionesDe(ej).filter(function (x) { return x.id === rep.sel })[0] || null }
  // Las áreas que van: las marcadas; si se cortó otra con la tijera (es la activa nueva), ésa sola.
  function areasElegidas(ej) {
    var sl = selElegida(ej); if (sl) return [sl.areaId]
    var as = areasDe(ej && ej.ops), activa = ej && ej.ops && ej.ops.areaOps ? (ej.ops.areaOps.id || 'ao-original') : (as[0] && as[0].id), g = repLeer()
    if (!g || g.activa !== activa) { g = { activa: activa, ids: activa ? [activa] : [] }; repGuardar(g) }
    return g.ids.filter(function (id) { return as.some(function (a) { return a.id === id }) })
  }
  function docsElegidos() { var l = OGO.elegidos(ogo).filter(function (d) { return (ogo.docs && ogo.docs[d.id]) || d.id === 'calco' }).map(function (d) { return d.id }); return rep.docs ? l.filter(function (id) { return rep.docs.indexOf(id) >= 0 }) : l }
  var cmMod = null, mdMod = null
  function conModeloAreas() { if (!mdMod) mdMod = import('../areas-operaciones/modelo.mjs?v=seleccion20261011').catch(function (e) { mdMod = null; throw e }); return mdMod }
  function conCompartir() { if (!cmMod) cmMod = import('../areas-operaciones/compartir-modelo.mjs?v=seleccion20261011').catch(function (e) { cmMod = null; throw e }); return cmMod }
  function nombreEnvio() { var sl = selElegida(ejSync()); return rep.nombre || (sl ? sl.nombre : claveCarpeta() + ' · ' + OGO.tituloOrden(ogo)) }
  function indicaciones() {
    if (rep.ind) return rep.ind
    var g = CARP && carpeta && CARP.lista(carpeta).filter(function (x) { return x.n === 10 })[0]
    return g ? String(CARP.separar(g.texto).producto || '').slice(0, 4000) : ''
  }
  function opcionesEnvio(nombres, sl) {
    var o = sl && sl.opciones ? sl.opciones : null
    return { unidad: true, operacion: true, documentos: true, documentosNombres: nombres, contenido: o ? o.contenido !== false : !!rep.contenido, enemigo: o ? o.enemigo !== false : !!rep.enemigo,
      cmoc: !!(o && o.contenido !== false && o.cmoc !== false && Array.isArray(sl.capasCmoc) && sl.capasCmoc.length), capasCmoc: o && Array.isArray(sl.capasCmoc) ? sl.capasCmoc : [], indicaciones: indicaciones() }
  }
  // Las ops que van: con la selección elegida, su área con el contorno EXACTO que se guardó.
  function opsDeEnvio(ej, sl) { return sl ? conModeloAreas().then(function (m) { return m.opsConSeleccion(ej.ops || {}, sl) }) : Promise.resolve(ej.ops || {}) }
  // El JSON del ejercicio (el paquete de áreas de la Mesa: 📁 Ejercicios → «📂 Abrir archivo JSON» lo abre) con los documentos.
  function paqueteJSON(o) {
    var areas = areasElegidas(o.ej), sl = selElegida(o.ej)
    if (!areas.length) return Promise.resolve(null)
    return Promise.all([conCompartir(), documentosAlumnos(o.est, o.ej, docsElegidos()), opsDeEnvio(o.ej, sl)]).then(function (r) {
      var docs = r[1].concat(rep.otros ? (o.ej.documentos || []).filter(function (d) { return !r[1].some(function (x) { return x.nombre === d.nombre }) }) : [])
      var p = r[0].construirPaquete({ ops: r[2], unidades: o.ej.unidades || [], documentos: docs, cmoc: o.ej.cmoc || null, nombre: o.ej.nombre || claveCarpeta() }, areas, opcionesEnvio(docs.map(function (d) { return d.nombre }), sl))
      if (sl) p.seleccion = { nombre: sl.nombre, guardada: sl.guardada }
      var base = sl ? 'Seleccion ' + sl.nombre : 'Ejercicio ' + String(o.ej.nombre || claveCarpeta())
      return { nombre: base.replace(/[^\w .-]+/g, '') + ' - para los alumnos.json', texto: JSON.stringify(p, null, 1), paquete: p, docs: docs, areas: areas, ops: r[2], sel: sl }
    })
  }
  function nubeApi(accion, datos) {
    var c = window.SIDECEME_CALCOS
    if (!c || !c.url) return Promise.reject(new Error('Esta Mesa no está abierta desde SIDECEME: bajá el ⬇️ JSON y mandalo por otro medio.'))
    if (!c.token) return Promise.reject(new Error('Tu sesión de SIDECEME no está activa: volvé a entrar.'))
    var hd = { 'Content-Type': 'application/json' }
    if (c.anonKey) { hd.apikey = c.anonKey; hd.Authorization = 'Bearer ' + c.anonKey }
    return fetch(c.url + '/functions/v1/calco-ops', { method: 'POST', headers: hd, body: JSON.stringify(Object.assign({ accion: accion, token: c.token }, datos || {})) })
      .then(function (r) { return r.json() }).then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || 'No se pudo completar.'); return j })
  }
  function repCalcoId() {
    if (rep.calcoId && rep.calcoDe === claveCarpeta()) return Promise.resolve(rep.calcoId)
    return nubeApi('mis_calcos').then(function (j) {
      var n = claveCarpeta(), c = (j.calcos || []).filter(function (x) { return x.nombre === n || nombreGuardado(x.nombre) === n })[0]
      if (!c) throw new Error('«' + n + '» no está guardado en SIDECEME: guardalo (📁 Ejercicio → Guardar) y volvé a intentar.')
      rep.calcoId = c.id; rep.calcoDe = n; return c.id
    })
  }
  function htmlRepartir() {
    if (!OGO) return ''
    var ej = ejSync(), as = areasDe(ej && ej.ops), sel_ = ej ? areasElegidas(ej) : [], activa = ej && ej.ops && ej.ops.areaOps ? (ej.ops.areaOps.id || 'ao-original') : ''
    var docs = OGO.elegidos(ogo).filter(function (d) { return (ogo.docs && ogo.docs[d.id]) || d.id === 'calco' }), elegidos_ = docsElegidos(), e = COH ? COH.estado(ogo) : { hechos: [] }
    var h = '<div class="ogo rep" id="sid-rep">' + htmlMesa('rep')
    h += '<div class="org-tit">1 · Los documentos consolidados</div><p class="ogo-nota">' + (e.hechos.length ? '✓ ' + e.hechos.length + ' consolidado(s) en la revisión de coherencia.' : '⚠️ Todavía sin la revisión de coherencia (paso 11).') + ' El Anexo A va como el gráfico del calco.</p>' +
      '<ul class="rep-docs">' + docs.map(function (d) { return '<li><label><input type="checkbox" data-rep-doc="' + d.id + '"' + (elegidos_.indexOf(d.id) >= 0 ? ' checked' : '') + '> ' + esc(OGO.corto(d.id, ogo)) + (d.id === 'calco' ? ' 🗺️' : '') + '</label></li>' }).join('') + '</ul>' +
      '<div class="ia-acc"><button type="button" class="ir" data-a="ogo-zip">⬇️ Word (.zip) con el JSON</button><button type="button" class="ir" data-a="rep-json">⬇️ JSON del ejercicio</button><button type="button" class="ir" data-a="ogo-adjuntar">📎 Adjuntar al ejercicio</button></div>'
    var sels = seleccionesDe(ej), slx = selElegida(ej)
    h += '<div class="org-tit">2 · Qué parte del ejercicio va (el JSON) ✂️</div>'
    if (sels.length) h += '<p class="ogo-nota"><b>💾 Tus selecciones guardadas</b> (✂️ lazo → «💾 Guardar selección como área»): elegí una y va IDÉNTICA a lo que recortaste, con lo que tenía activo al guardarla.</p>' +
      '<ul class="rep-docs">' + sels.map(function (x) { var o = x.opciones || {}; return '<li><label><input type="radio" name="rep-sel" data-rep-sel="' + esc(x.id) + '"' + (slx && slx.id === x.id ? ' checked' : '') + '> 💾 <b>' + esc(x.nombre) + '</b> <small>(guardada ' + esc(fechaCorta(x.guardada)) + (o.contenido === false ? ' · sólo el contorno' : ' · todo lo de adentro' + (o.enemigo !== false ? ', las fichas enemigas' : '') + (o.cmoc !== false && (x.capasCmoc || []).length ? ', el CMOC a la vista' : '')) + ')</small></label></li>' }).join('') +
      '<li><label><input type="radio" name="rep-sel" data-rep-sel=""' + (slx ? '' : ' checked') + '> Elegir las áreas a mano (abajo)</label></li></ul>'
    if (slx) h += '<p class="ogo-ok">Va «' + esc(slx.nombre) + '»: el área tal cual se guardó y lo de adentro como está ahora en la Mesa.</p>'
    else h += (as.length ? '<ul class="rep-docs">' + as.map(function (a) { return '<li><label><input type="checkbox" data-rep-area="' + esc(a.id) + '"' + (sel_.indexOf(a.id) >= 0 ? ' checked' : '') + '> ' + esc(a.nombre || 'Área') + (a.id === activa ? ' <small>(la seleccionada en la Mesa)</small>' : '') + '</label></li>' }).join('') + '</ul>' : '<p class="ogo-aviso">⚠️ No hay Área de Operaciones trazada: trazala (▧ ÁREA DE OPS).</p>') +
      '<div class="ia-acc"><button type="button" class="ir" data-a="rep-tijera" title="Abre el Área de Operaciones: «✂️ Seleccionar con lazo» corta la parte que querés repartir; al volver, queda elegida">✂️ Elegir otra parte con la tijera</button></div>' +
      '<label class="ogo-check"><input type="checkbox" data-rep-op="contenido"' + (rep.contenido ? ' checked' : '') + '> Todo lo que está dentro (límites, medidas, fichas)</label>' +
      '<label class="ogo-check"><input type="checkbox" data-rep-op="enemigo"' + (rep.enemigo ? ' checked' : '') + '> También las fichas enemigas</label>'
    h += '<label class="ogo-check"><input type="checkbox" data-rep-op="otros"' + (rep.otros ? ' checked' : '') + '> También los otros documentos del ejercicio</label>'
    h += '<div class="org-tit">3 · A quién</div>'
    if (!rep.destinos) h += '<div class="ia-acc"><button type="button" class="ir" data-a="rep-destinos"' + (rep.ocupado ? ' disabled' : '') + '>👥 Ver a quién (ciclos, paralelos, Estados Mayores)</button></div>'
    else {
      var grupos = [['ciclo', '🎓 Por ciclo'], ['paralelo', '🏫 Por paralelo'], ['grupo', '🪖 Estados Mayores (grupos)'], ['calco', '📁 Mis ejercicios']]
      var tipoDe = function (d) { return d.tipo || (d.grupo_id ? 'grupo' : 'calco') }
      h += '<select data-rep-destino aria-label="Destino"><option value="">— Elegí el destino —</option>' + grupos.map(function (g) { var ds = rep.destinos.filter(function (d) { return tipoDe(d) === g[0] }); return ds.length ? '<optgroup label="' + g[1] + '">' + ds.map(function (d) { return '<option value="' + esc(d.clave) + '"' + (d.clave === rep.destino ? ' selected' : '') + '>' + esc(d.nombre) + '</option>' }).join('') + '</optgroup>' : '' }).join('') + '</select>'
      if (rep.sinCiclos) h += '<p class="ogo-aviso">⚠️ El servidor de SIDECEME todavía no ofrece los ciclos ni los paralelos: falta publicar la versión nueva de calco-ops. Mientras tanto: un Estado Mayor, o el ⬇️ JSON.</p>'
      h += '<label class="ogo-campo"><span>Nombre del envío</span><input type="text" data-rep-nombre maxlength="160" value="' + esc(nombreEnvio()) + '"></label>' +
        '<label class="ogo-campo"><span>Indicaciones para los alumnos' + (indicaciones() && !rep.ind ? ' (de tu carpeta, paso 13)' : '') + '</span><textarea data-rep-ind rows="3" maxlength="4000">' + esc(indicaciones()) + '</textarea></label>' +
        '<div class="ia-acc"><button type="button" class="ir ubi-ok" data-a="rep-enviar"' + (rep.ocupado || !rep.destino || !sel_.length ? ' disabled' : '') + '>📤 Enviar a los alumnos</button></div>' +
        '<p class="ogo-nota">Lo reciben en su Mesa: ▧ ÁREA DE OPS → «Compartir en la aplicación / Recibidos» → «Incorporar al ejercicio» (el área, lo de adentro y los documentos). Lo PARA EL PROFESOR y tu carpeta no van.</p>'
    }
    return h + (aviso.ogo && /Word|\.zip|adjunt|⏳/i.test(aviso.ogo) ? '<div class="ia-aviso">' + esc(aviso.ogo) + '</div>' : '') + (aviso.rep ? '<div class="ia-aviso">' + esc(aviso.rep) + '</div>' : '') + '</div>'
  }
  function repAccion(acc, el) {
    if (acc === 'rep-tijera') { ir(el, { h: 'areaOps' }); return }
    if (acc === 'rep-json') {
      aviso.rep = '⏳ Armando el JSON…'; pintar(true)
      ogoContexto().then(paqueteJSON).then(function (pq) {
        if (!pq) { aviso.rep = '⚠️ Elegí (o trazá) el Área de Operaciones que va.'; return pintar(true) }
        bajarBlob(pq.nombre, new Blob([pq.texto], { type: 'application/json' }))
        aviso.rep = '⬇️ ' + pq.nombre + ': ' + pq.areas.length + ' área(s) y ' + pq.docs.length + ' documento(s). El alumno lo abre en su Mesa con 📁 Ejercicios → «📂 Abrir archivo JSON» (como ejercicio nuevo, con los documentos), no con doble clic.'; pintar(true)
      }).catch(function (e) { aviso.rep = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
      return
    }
    if (acc === 'rep-destinos') {
      rep.ocupado = true; aviso.rep = '⏳ Buscando los destinos en SIDECEME…'; pintar(true)
      repCalcoId().then(function (id) { return nubeApi('areas_destinos', { calco_id: id }) }).then(function (j) {
        rep.destinos = j.destinos || []; rep.sinCiclos = !rep.destinos.some(function (d) { return d.tipo === 'ciclo' || d.tipo === 'paralelo' }); aviso.rep = ''
      }).catch(function (e) { aviso.rep = '⚠️ ' + (e && e.message ? e.message : e) }).then(function () { rep.ocupado = false; pintar(true) })
      return
    }
    if (acc === 'rep-enviar') {
      var d = (rep.destinos || []).filter(function (x) { return x.clave === rep.destino })[0]
      if (!d) { aviso.rep = 'Elegí el destino.'; return pintar(true) }
      rep.ocupado = true; aviso.rep = '⏳ Armando el envío…'; pintar(true)
      var o_
      ogoContexto().then(function (o) { o_ = o; return paqueteJSON(o) }).then(function (pq) {
        if (!pq) throw new Error('Elegí (o trazá) el Área de Operaciones que va.')
        if (!window.confirm('Se envía «' + nombreEnvio() + '» a ' + d.nombre + ':\n· ' + (pq.sel ? 'la selección guardada «' + pq.sel.nombre + '» (idéntica a lo recortado)' : pq.areas.length + ' área(s) del ejercicio') + (opcionesEnvio([], pq.sel).contenido ? ', con lo que está dentro' : '') + '\n· ' + pq.docs.length + ' documento(s)\n\n¿Enviar?')) return null
        return repCalcoId().then(function (id) {
          return nubeApi('ejercicio_enviar', { calco_id: id, nombre: nombreEnvio(), areas: pq.areas, destino: d, opciones: opcionesEnvio(pq.docs.map(function (x) { return x.nombre }), pq.sel), foto: { ops: pq.ops, unidades: o_.ej.unidades || [], documentos: pq.docs, cmoc: pq.sel ? o_.ej.cmoc || null : null } })
        }).then(function () { aviso.rep = '📤 Enviado a ' + d.nombre + '. Lo encuentran en su Mesa: ▧ ÁREA DE OPS → «Compartir en la aplicación / Recibidos».' })
      }).catch(function (e) {
        var m = e && e.message ? e.message : String(e)
        aviso.rep = '⚠️ ' + (/no reconocida/i.test(m) ? 'El servidor de SIDECEME todavía no tiene el envío del ejercicio (falta publicar calco-ops): usá ⬇️ JSON del ejercicio.' : m)
      }).then(function () { rep.ocupado = false; pintar(true) })
    }
  }

  // ---------- dibujo ----------
  function chips(resp) {
    return (resp || []).map(function (s) { var S = CAT.SECCIONES[s]; return S ? '<span class="sec" style="--sc:' + S.color + '" title="' + esc(S.nom) + '">' + esc(S.corto) + '</span>' : '' }).join('')
  }
  function botonesAbrir(abrirs, f, n) {
    if (!abrirs || !abrirs.length) return ''
    return '<div class="abrir">' + abrirs.map(function (a, i) {
      var rot, tt
      if (a.h) { rot = CAT.HERRAMIENTAS[a.h].nom; tt = 'Abre ' + rot + ' en la Mesa' }
      else { var S = CAT.SECCIONES[a.s]; rot = S.corto + (a.num ? ' · ' + a.num : ''); tt = (a.num ? 'Abre la hoja ' + a.num + ' del ' : 'Abre el tablero del ') + S.nom }
      return '<button type="button" class="ir" data-f="' + f + '" data-n="' + n + '" data-i="' + i + '" title="' + esc(tt) + '"' + (a.s ? ' style="--sc:' + CAT.SECCIONES[a.s].color + '"' : '') + '>' + esc(rot) + ' ▸</button>'
    }).join('') + '</div>'
  }
  function paso(F, p) {
    var h = hechoDe(F.id, p.n)
    return '<li class="paso' + (h ? ' hecho' : '') + '" data-paso="' + F.id + '.' + p.n + '">' +
      '<label class="cab"><input type="checkbox" data-f="' + F.id + '" data-n="' + p.n + '"' + (h ? ' checked' : '') + ' aria-label="Paso ' + (p.ver || p.n) + ' hecho"><span class="num">' + (p.ver || p.n) + '</span><span class="nom">' + esc(p.nom) + '</span></label>' +
      '<div class="doc">' + (p.doc ? '📄 ' + esc(p.doc) : esc(p.que || '')) + '</div>' +
      (p.resp ? '<div class="resp">' + chips(p.resp) + '</div>' : '') +
      (p.escalon ? selectorEscalon() + selectorFoco() : '') +
      botonesAbrir(p.abrir, F.id, p.n) +
      (F.id === 'P' && p.organizaciones ? htmlOrganizaciones(p) : '') +
      (F.id === 'P' && p.coherencia ? htmlCoherencia() : '') +
      (F.id === 'P' && p.porUbicar ? htmlPorUbicar() : '') +
      (F.id === 'P' && p.repartir ? htmlRepartir() : '') +
      (F.id === 'P' && p.ia ? htmlIA(p) : '') +
      (F.id === 'P' && p.ogoFinal ? htmlOGO() : '') + '</li>'
  }
  function selectorEscalon() {
    var E = escalonDe(escalon)
    return '<div class="escalon"><label>Yo soy el <select data-escalon>' + CAT.ESCALONES.map(function (e) { return '<option value="' + e.id + '"' + (e.id === escalon ? ' selected' : '') + '>' + esc(e.profesor) + '</option>' }).join('') + '</select></label>' +
      '<div class="alumnos">Mis alumnos son <b>' + esc(E.alumnos) + '</b>.<br>Escribo: <b>' + esc(E.orden) + '</b>.</div></div>'
  }
  function siguiente() { // primer paso sin marcar, en orden
    for (var i = 0; i < CAT.FASES.length; i++) for (var j = 0; j < CAT.FASES[i].pasos.length; j++) if (!hechoDe(CAT.FASES[i].id, CAT.FASES[i].pasos[j].n)) return { f: CAT.FASES[i].id, n: CAT.FASES[i].pasos[j].n }
    return null
  }
  function htmlAprendizaje() {
    var sig = siguiente(), tot = 0, hh = 0
    CAT.FASES.forEach(function (F) { var a = avance(F); tot += a.t; hh += a.h })
    return '<div class="cab-tab"><h2>🎓 PMTD por fases</h2><p>Sos el único alumno: hacés el Proceso Militar de Toma de Decisiones completo, en el orden de la Visión Horizontal 2020 (texto PMTD 2017). Cada paso dice qué sale, quién lo hace y dónde se abre en la Mesa.</p>' +
      '<div class="total"><span class="barra"><i style="width:' + (tot ? Math.round(100 * hh / tot) : 0) + '%"></i></span><b>' + hh + ' / ' + tot + ' pasos</b>' +
      (sig ? '<button type="button" class="sig" data-sig="' + sig.f + '.' + sig.n + '">Siguiente: F' + sig.f + '·P' + sig.n + ' ▸</button>' : '<span class="fin">✓ PMTD completo</span>') + '</div></div>' +
      '<ol class="fases">' + CAT.FASES.map(function (F) {
        var a = avance(F), on = F.id === fase
        return '<li class="fase' + (on ? ' on' : '') + (a.h === a.t ? ' lista' : '') + '" data-fase="' + F.id + '">' +
          '<button type="button" class="fcab" data-fase="' + F.id + '" aria-expanded="' + on + '"><span class="fn">FASE ' + F.id + '</span><span class="ft">' + esc(F.nom) + '</span><span class="fa">' + a.h + '/' + a.t + '</span></button>' +
          (on ? '<p class="que">' + esc(F.que) + '</p><ol class="pasos">' + F.pasos.map(function (p) { return paso(F, p) }).join('') + '</ol>' : '') + '</li>'
      }).join('') + '</ol>' +
      '<div class="pie"><button type="button" class="chico" data-a="reiniciar">Reiniciar lo marcado</button></div>'
  }
  function htmlProfesor() {
    var F = { id: 'P', pasos: CAT.PROFESOR }, a = avance(F), E = escalonDe(escalon)
    return '<div class="cab-tab"><h2>🧑‍🏫 Armar el ejercicio</h2><p>Vos sos el <b>' + esc(E.profesor) + '</b>: escribís la Orden del escalón superior y armás el tablero que reciben tus alumnos (<b>' + esc(E.alumnos) + '</b>). Los pasos van en el orden en que la Mesa los necesita.</p>' +
      '<div class="total"><span class="barra"><i style="width:' + Math.round(100 * a.h / a.t) + '%"></i></span><b>' + a.h + ' / ' + a.t + ' pasos</b></div>' +
      (BIB ? '<button type="button" class="bib-btn" data-a="bib" aria-expanded="' + verBiblio + '">📚 Mis documentos: COE, organización, armamento' + (biblio.length ? ' · ' + biblio.length : '') + (verBiblio ? ' ▴' : ' ▸') + '</button>' + (verBiblio ? htmlBiblioteca() : '') : '') +
      (CARP ? '<button type="button" class="car-btn" data-a="car" aria-expanded="' + verCarpeta + '">📕 Carpeta del profesor: lo que ya resolviste con la IA' + (CARP.cuantos(carpeta) ? ' · ' + CARP.cuantos(carpeta) : '') + (verCarpeta ? ' ▴' : ' ▸') + '</button>' + (verCarpeta ? htmlCarpeta() : '') : '') +
      (OGO ? '<button type="button" class="ogo-btn" data-a="ogo-ir" title="El paso final: la OGO completa con sus anexos, documento por documento, sobre los modelos de la Escuela">📜 OGO completa con sus anexos · ' + OGO.elegidos(ogo).filter(function (d) { return ogo.docs && ogo.docs[d.id] }).length + '/' + OGO.elegidos(ogo).length + ' ▾</button>' : '') + '</div>' +
      '<ol class="pasos prof">' + CAT.PROFESOR.map(function (p) { return paso(F, p) }).join('') + '</ol>' +
      '<div class="pie"><div class="secs">Tableros de cada sección: ' + Object.keys(CAT.SECCIONES).map(function (s) { return '<button type="button" class="ir sec-ir" data-sec="' + s + '" style="--sc:' + CAT.SECCIONES[s].color + '">' + esc(CAT.SECCIONES[s].corto) + '</button>' }).join('') + '</div>' +
      '<button type="button" class="chico" data-a="reiniciar">Reiniciar lo marcado</button></div>'
  }
  function cerrado() { return plegado || (tapado && !abiertoIgual) }
  function pintar(forzar) {
    if (!panel) return
    var pl = cerrado()
    var f = [modo, fase, escalon, foco, pl, iaPaso, JSON.stringify(hecho), JSON.stringify(aviso), !!(puente && puente.agregarUnidades), verBiblio, bibVer, bibVista, verCarpeta, carVer, carVista, ogoVer, ogoAbierto, ogoPedido.length, verOgoDatos, !!ogoRev, cohAbierto, cohPedido.length, nuevoVer, rep.destino, !!rep.destinos, rep.ocupado].join('|')
    if (!forzar && f === firma) return
    firma = f
    panel.hidden = modo === 'mesa'
    panel.className = pl ? 'plegado' : ''
    if (modo !== 'mesa') {
      var cu0 = panel.querySelector('.cuerpo'), arriba_ = cu0 ? cu0.scrollTop : 0 // que no salte arriba al tocar algo
      panel.innerHTML = '<button type="button" class="asa" data-a="asa" aria-expanded="' + !pl + '" title="' + (pl ? 'Desplegar el tablero' : 'Plegar el tablero para ver la carta') + '">' + (pl ? (modo === 'profesor' ? '🧑‍🏫 Pasos ◂' : '🎓 Fases ◂') : '▸ Plegar') + '</button>' +
        '<div class="cuerpo">' + (modo === 'profesor' ? htmlProfesor() : htmlAprendizaje()) + '</div>'
      var cu1 = panel.querySelector('.cuerpo'); if (cu1 && arriba_) cu1.scrollTop = arriba_
    }
    acomodar()
  }

  // ---------- lugar en la pantalla: que no se cruce con nada ----------
  // Lo pidió Sergio (10-10-2026) con capturas: el tablero tapaba la punta derecha de la barra de
  // herramientas (arriba) y el tablero «Mesa · Preparación» le quedaba encima (abajo); había botones
  // a los que no se llegaba. Ahora va ENTRE la barra de arriba y lo que esté apoyado abajo (Mesa ·
  // Preparación, Fichas, Despliegue del TO, la leyenda); si ahí no entra, lo de abajo se angosta y le
  // deja la columna; y se pliega solo mientras un tablero de la Mesa ocupa la columna derecha.
  // Sólo en pantalla ancha: en el teléfono sigue abajo, como estaba.
  var HUECO = 8, ALTO_MIN = 240, DER = 44, ARRIBA = 62, ABAJO = 60
  function caja(el) {
    if (!el || el === panel || el === sel || el.nodeType !== 1 || /^(SCRIPT|STYLE|LINK)$/.test(el.tagName)) return null
    var cs = getComputedStyle(el)
    if ((cs.position !== 'absolute' && cs.position !== 'fixed') || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return null
    var r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 ? { r: r, z: parseInt(cs.zIndex, 10) || 0 } : null
  }
  // lo que flota sobre la carta: hijos del <body> y de la carta de la Mesa
  function flotantes() {
    var l = Array.prototype.slice.call(body.children)
    var m = document.querySelector('.contenedor-mapa')
    if (m) l = l.concat(Array.prototype.slice.call(m.children))
    return l.map(caja).filter(Boolean)
  }
  // Sin lugar entre la barra y lo de abajo: lo apoyado abajo (Mesa · Preparación, Fichas, Despliegue)
  // termina antes de la columna del tablero (modalidad.css, body[data-sid-mod-col]).
  function columna(px) {
    var v = px ? String(px) : null
    if (body.getAttribute('data-sid-mod-col') === v) return
    if (v) { body.setAttribute('data-sid-mod-col', v); body.style.setProperty('--sid-mod-col', v + 'px') }
    else { body.removeAttribute('data-sid-mod-col'); body.style.removeProperty('--sid-mod-col') }
  }
  function acomodar() {
    if (!panel) return
    var W = window.innerWidth, H = window.innerHeight, ancha = W > 820
    var fl = modo === 'mesa' || !ancha ? [] : flotantes()
    // ¿un tablero ocupa la columna derecha? (arriba, alto, de la mitad derecha, por encima de la carta)
    var izq = W
    fl.forEach(function (c) { var r = c.r; if (c.z >= 1100 && r.left > W * 0.5 && r.top < H * 0.3 && r.height > 150 && r.width > 200) izq = Math.min(izq, r.left) })
    var t = izq < W
    if (t !== tapado) { tapado = t; if (!t) abiertoIgual = false; return pintar(true) }
    var s = panel.style
    var poner = function (v) { for (var k in v) if (s[k] !== v[k]) s[k] = v[k] }
    var libre = { top: '', bottom: '', right: '', zIndex: '' }
    if (panel.hidden || !ancha || (cerrado() && !tapado)) { columna(0); return poner(libre) }
    // el borde de arriba (debajo de la barra) y el de abajo (encima de lo apoyado abajo) en la columna x0–x1
    var bordes = function (x0, x1) {
      var cruza = function (r) { return r.right > x0 + 1 && r.left < x1 - 1 }
      var arriba = ARRIBA, abajo = H - ABAJO
      flotantes().forEach(function (c) {
        var r = c.r
        if (!cruza(r)) return
        // arriba: la barra de herramientas y lo chico apoyado arriba (p. ej. el cuadro del Área de Influencia)
        if (r.top < H * 0.3 && r.bottom < H * 0.6) arriba = Math.max(arriba, Math.round(r.bottom + HUECO))
        // abajo: Mesa · Preparación, Fichas, Despliegue del TO, la leyenda
        else if (r.top > H * 0.3 && r.bottom > H - 90) abajo = Math.min(abajo, Math.round(r.top - HUECO))
      })
      return { arriba: arriba, abajo: abajo }
    }
    if (cerrado()) { // plegado mientras un tablero ocupa la derecha: la pestaña, pegada a ese tablero y debajo de la barra
      var w = panel.offsetWidth, h = panel.offsetHeight
      columna(0)
      var b = bordes(izq - w, izq)
      if (b.abajo - b.arriba < h) { columna(Math.round(W - izq + w + HUECO)); b = bordes(izq - w, izq) } // lo de abajo le deja lugar
      if (b.abajo - b.arriba < h) columna(0)
      return poner(b.abajo - b.arriba >= h ? { top: b.arriba + 'px', bottom: 'auto', right: Math.round(W - izq) + 'px', zIndex: '' } : libre)
    }
    var der = tapado ? Math.max(DER, Math.round(W - izq + HUECO)) : DER
    var x1 = W - der, x0 = x1 - panel.offsetWidth
    if (tapado) { // al costado del tablero sólo si entra sin pisar el panel de la izquierda; si no, plegado
      var lp = document.querySelector('.panel'), m = document.querySelector('.contenedor-mapa')
      var lpr = lp && lp.getBoundingClientRect(), limite = Math.max(m ? m.getBoundingClientRect().left : 0, lpr && lpr.width ? lpr.right : 0)
      if (x0 < limite + HUECO) { abiertoIgual = false; return pintar(true) }
    }
    // 1° entre la barra y lo de abajo; 2° si no entra, lo de abajo se angosta y deja libre la columna;
    // 3° si ni así entra (pantalla muy baja), queda encima de lo de abajo
    columna(0)
    var B = bordes(x0, x1), z = ''
    if (B.abajo - B.arriba < ALTO_MIN) { columna(Math.round(W - x0 + HUECO)); B = bordes(x0, x1) }
    if (B.abajo - B.arriba < ALTO_MIN) { B.abajo = H - ABAJO; z = '1160' }
    poner({ top: B.arriba + 'px', bottom: H - B.abajo + 'px', right: der + 'px', zIndex: z })
  }

  // ---------- eventos ----------
  function onClic(e) {
    var t = e.target
    var a = t.closest && t.closest('[data-a]')
    if (a && a.getAttribute('data-a') === 'asa') {
      if (cerrado()) { // desplegar: si lo plegó el usuario, se recuerda; si está tapado, se abre igual (al costado)
        if (plegado) { plegado = false; guarda(K_PLEGADO, '0') }
        if (tapado) abiertoIgual = true
      } else { plegado = true; abiertoIgual = false; guarda(K_PLEGADO, '1') }
      pintar(true); return
    }
    var ib = t.closest && t.closest('[data-ia-paso]')
    if (ib) {
      var pn = +ib.getAttribute('data-ia-paso')
      if (iaPaso === pn) iaPaso = 0
      else {
        var pp = pasoProfesor(pn); iaPaso = pn; iaTexto = '… armando el pedido con el ejercicio de la Mesa'; delete aviso['ia' + pn]
        if (pp) armarPedido(pp).then(function (txt) { if (iaPaso === pn) { iaTexto = txt; pintar(true) } })
      }
      pintar(true); return
    }
    if (a && /^ia-/.test(a.getAttribute('data-a'))) {
      var acc = a.getAttribute('data-a'), pa = pasoProfesor(iaPaso)
      if (acc === 'ia-cerrar') { iaPaso = 0; pintar(true); return }
      if (!pa) return
      if (acc === 'ia-bajar') { bajar(nombreArchivo(pa), iaTexto); aviso['ia' + pa.n] = '⬇️ Bajado: adjuntalo a la IA con la orden de cumplirlo.'; pintar(true); return }
      if (acc === 'ia-guardar') { guardarRespuesta(pa); return }
      if (acc === 'ia-quitar') {
        if (!window.confirm('¿Sacar de la carpeta la respuesta guardada del paso ' + pa.n + '?')) return
        borrador[bk(pa.n)] = ''; delete aviso['resp' + pa.n]
        carGuardar(CARP.quitar(carpeta, pa.n)).then(function () { aviso['resp' + pa.n] = 'Se sacó de la carpeta.'; pintar(true) }, function () {})
        pintar(true); return
      }
      if (acc === 'ia-copiar') { copiar(iaTexto).then(function () { aviso['ia' + pa.n] = '📋 Pedido copiado (' + iaTexto.length.toLocaleString('es') + ' caracteres): pegalo en la IA.'; pintar(true) }, function () { aviso['ia' + pa.n] = 'No se pudo copiar: seleccioná el texto y copialo a mano.'; pintar(true) }); return }
    }
    if (a && a.getAttribute('data-a') === 'ogo-ir') {
      plegado = false; ogoRevisarCarga(); pintar(true)
      var lo = panel.querySelector('[data-paso="P.' + CAT.PROFESOR.filter(function (x) { return x.ogoFinal })[0].n + '"]'); if (lo) lo.scrollIntoView({ block: 'start' })
      return
    }
    if (a && /^ogo-/.test(a.getAttribute('data-a')) && OGO) { var od = a.closest('[data-ogo-doc]'); ogoAccion(a.getAttribute('data-a'), od ? od.getAttribute('data-ogo-doc') : ogoAbierto); return }
    if (a && /^coh-/.test(a.getAttribute('data-a')) && COH) { cohAccion(a.getAttribute('data-a')); return }
    if (a && /^mesa-/.test(a.getAttribute('data-a')) && COH) { mesaAccion(a.getAttribute('data-a')); return }
    if (a && /^med-/.test(a.getAttribute('data-a')) && COH) { var mi = a.closest('[data-med]'); medAccion(a.getAttribute('data-a'), a.getAttribute('data-med-k') || (mi ? mi.getAttribute('data-med') : '')); return }
    if (a && /^ubi-/.test(a.getAttribute('data-a')) && COH) { var ui = a.closest('[data-ubi]'); ubiAccion(a.getAttribute('data-a'), a.getAttribute('data-ubi-k') || (ui ? ui.getAttribute('data-ubi') : '')); return }
    if (a && /^rep-/.test(a.getAttribute('data-a')) && OGO) { repAccion(a.getAttribute('data-a'), a); return }
    if (a && a.getAttribute('data-a') === 'car') { verCarpeta = !verCarpeta; if (verCarpeta) { plegado = false; carRevisar() } pintar(true); return }
    if (a && /^car-/.test(a.getAttribute('data-a'))) {
      var ac = a.getAttribute('data-a'), lc = a.closest('[data-car]'), nc = lc ? +lc.getAttribute('data-car') : 0
      if (ac === 'car-bajar') { var E_ = escalonDe(escalon); bajar(nombreArchivoCarpeta(), CARP.markdown(carpeta, { escalon: E_.profesor, alumnos: E_.alumnos, foco: focoDe(foco).nom })); aviso.car = '⬇️ Bajada. Para llevarla a otro equipo: 📤 Cargar una carpeta, con el ejercicio abierto.'; pintar(true); return }
      if (ac === 'car-ver' && nc) { carVista = carVista === nc ? 0 : nc; pintar(true); return }
      if (ac === 'car-ir' && nc) {
        var pp_ = pasoProfesor(nc); if (!pp_) return
        iaPaso = nc; iaTexto = '… armando el pedido con el ejercicio de la Mesa'; verCarpeta = false
        armarPedido(pp_).then(function (txt) { if (iaPaso === nc) { iaTexto = txt; pintar(true) } })
        pintar(true)
        var li_ = panel.querySelector('[data-paso="P.' + nc + '"]'); if (li_) li_.scrollIntoView({ block: 'start' })
        return
      }
    }
    if (a && a.getAttribute('data-a') === 'bib') { verBiblio = !verBiblio; if (verBiblio) { plegado = false; var cu = panel.querySelector('.cuerpo'); if (cu) cu.scrollTop = 0 } pintar(true); return }
    if (a && /^bib-/.test(a.getAttribute('data-a'))) {
      var ab_ = a.getAttribute('data-a'), li_ = a.closest('[data-bib]'), d_ = li_ && bibDoc(li_.getAttribute('data-bib'))
      if (ab_ === 'bib-ver' && d_) { bibVista = bibVista === d_.id ? '' : d_.id; pintar(true); return }
      if (ab_ === 'bib-borrar' && d_) { if (window.confirm('¿Sacar «' + d_.nombre + '» de la biblioteca? (las fichas ya insertadas en la carta no se tocan)')) bibBorrar(d_.id).then(bibCargar); return }
      if (ab_ === 'bib-insertar' && d_ && d_.coe) { insertarCOE([d_]); pintar(true); return }
      if (ab_ === 'bib-insertar-todos') { insertarCOE(biblio.filter(function (d) { return d.coe })); pintar(true); return }
      if (ab_ === 'bib-insertar-sel') { var sc_ = panel.querySelector('select[data-bib-coe]'), dd = sc_ && bibDoc(sc_.value); if (dd) insertarCOE([dd]); pintar(true); return }
    }
    if (a && /^org-/.test(a.getAttribute('data-a'))) {
      var ao = a.getAttribute('data-a')
      if (ao === 'org-pegar') { aviso.pegar = !aviso.pegar; delete aviso.org; pintar(true); return }
      if (!IA) return
      if (ao === 'org-insertar') {
        var so = panel.querySelector('select[data-org]'), bo = panel.querySelector('input[name=sid-org-bando]:checked'), no = panel.querySelector('input[data-org-num]')
        var org = IA.organizacionDe(so && so.value)
        if (org) insertarFichas(IA.fichasDeOrganizacion(org, { bando: bo ? bo.value : 'propias', numero: no ? no.value : '1', centro: centroMesa() }), org.nom + ' · ' + (bo && bo.value === 'enemigas' ? 'ROJO' : 'AZUL'))
        pintar(true); return
      }
      if (ao === 'org-pegar-ok') {
        var tj = panel.querySelector('textarea[data-org-json]')
        try { var r = IA.fichasDeJSON(tj ? tj.value : '', { centro: centroMesa() }); insertarFichas(r.fichas, 'de la IA' + (r.sinLugar ? '; ' + r.sinLugar + ' sin lat/lng, puestas junto al centro' : '')); if (r.fichas.length) aviso.pegar = false }
        catch (e) { aviso.org = '⚠️ ' + (e && e.message ? e.message : e) }
        pintar(true); return
      }
    }
    if (a && a.getAttribute('data-a') === 'reiniciar') {
      if (!window.confirm('¿Desmarcar todos los pasos de esta modalidad? (las hojas de la Mesa no se tocan)')) return
      Object.keys(hecho).forEach(function (k) { if (k.charAt(0) === (modo === 'profesor' ? 'P' : 'F')) delete hecho[k] })
      guarda(K_HECHO, JSON.stringify(hecho)); pintar(true); return
    }
    var fc = t.closest && t.closest('.fcab')
    if (fc) { fase = +fc.getAttribute('data-fase'); guarda(K_FASE, String(fase)); pintar(true); return }
    var sg = t.closest && t.closest('[data-sig]')
    if (sg) { fase = +sg.getAttribute('data-sig').split('.')[0]; guarda(K_FASE, String(fase)); pintar(true); var li = panel.querySelector('[data-paso="' + sg.getAttribute('data-sig') + '"]'); if (li) { li.scrollIntoView({ block: 'center' }); li.classList.add('foco') } return }
    var si = t.closest && t.closest('.sec-ir')
    if (si) { ir(si, { s: si.getAttribute('data-sec') }); return }
    var ir_ = t.closest && t.closest('.ir')
    if (ir_ && ir_.hasAttribute('data-f')) {
      var fid = ir_.getAttribute('data-f'), n = +ir_.getAttribute('data-n'), i = +ir_.getAttribute('data-i')
      var lista = modo === 'profesor' ? CAT.PROFESOR : (CAT.FASES[+fid - 1] || {}).pasos || []
      var p = null; lista.forEach(function (x) { if (x.n === n) p = x })
      if (p && p.abrir && p.abrir[i]) ir(ir_, p.abrir[i])
    }
  }
  function ir(b, ref) {
    b.classList.add('yendo')
    abrir(ref).then(function (ok) {
      b.classList.remove('yendo')
      // El panel real quedó abierto en su lugar: el tablero se pliega al borde. Si lo que se abrió es un
      // tablero de la columna derecha, se pliega solo mientras esté abierto y vuelve al cerrarlo.
      if (ok === true) { abiertoIgual = false; acomodar(); if (!tapado) { plegado = true; guarda(K_PLEGADO, '1') } pintar(true) }
      else { var r = b.textContent; b.textContent = ok === 'calcos' ? 'Primero ⚡ Generar calcos' : 'No está en esta Mesa'; b.classList.add('no'); setTimeout(function () { b.textContent = r; b.classList.remove('no') }, 2200) }
    })
  }
  function onCambio(e) {
    var t = e.target
    if (t.matches && t.matches('input[type=checkbox][data-f]')) { marcar(t.getAttribute('data-f') === 'P' ? 'P' : +t.getAttribute('data-f'), +t.getAttribute('data-n'), t.checked); pintar(true); return }
    if (t.matches && t.matches('select[data-escalon]')) { escalon = t.value; guarda(K_ESC, escalon); iaPaso = 0; pintar(true); return }
    if (t.matches && t.matches('select[data-foco]')) { foco = t.value; guarda(K_FOCO, foco); iaPaso = 0; pintar(true); return }
    if (t.matches && t.matches('select[data-ia-destino]') && CARP) { var pd = pasoProfesor(iaPaso); if (pd) carGuardar(CARP.cambiarDestino(carpeta, pd.n, t.value)).then(function () { pintar(true) }, function () {}); return }
    if (t.matches && t.matches('input[data-car-archivo]')) { if (t.files && t.files[0]) cargarCarpeta(t.files[0]); t.value = ''; return }
    if (t.matches && t.matches('input[data-rep-doc]')) { var ld = docsElegidos(), di = t.getAttribute('data-rep-doc'); rep.docs = t.checked ? ld.concat([di]) : ld.filter(function (x) { return x !== di }); nuevoVer++; pintar(true); return }
    if (t.matches && t.matches('input[data-rep-area]')) {
      var ejx = ejSync(), g = { activa: ejx && ejx.ops && ejx.ops.areaOps ? (ejx.ops.areaOps.id || 'ao-original') : '', ids: areasElegidas(ejx) }, ai = t.getAttribute('data-rep-area')
      g.ids = t.checked ? g.ids.filter(function (x) { return x !== ai }).concat([ai]) : g.ids.filter(function (x) { return x !== ai }); repGuardar(g); nuevoVer++; pintar(true); return
    }
    if (t.matches && t.matches('input[data-rep-op]')) { rep[t.getAttribute('data-rep-op')] = t.checked; nuevoVer++; pintar(true); return }
    if (t.matches && t.matches('input[data-rep-sel]')) { rep.sel = t.getAttribute('data-rep-sel') || ''; rep.selDe = claveCarpeta(); rep.nombre = ''; nuevoVer++; pintar(true); return }
    if (t.matches && t.matches('select[data-rep-destino]')) { rep.destino = t.value; nuevoVer++; pintar(true); return }
    if (OGO && t.matches && t.matches('[data-ogo-cfg]')) {
      var ck = t.getAttribute('data-ogo-cfg'), cv = t.type === 'checkbox' ? t.checked : t.value, cc = {}; cc[ck] = cv
      ogoGuardar(OGO.conConfig(ogo, cc)).then(function () { ogoCache = {}; pintar(true) }, function (e) { aviso.ogo = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
      return
    }
    if (OGO && t.matches && t.matches('input[data-ogo-sel]')) {
      var sl = Object.assign({}, ogo.config.seleccion || OGO.seleccionInicial()); sl[t.getAttribute('data-ogo-sel')] = t.checked
      ogoGuardar(OGO.conConfig(ogo, { seleccion: sl })).then(function () { ogoCache = {}; ogoRev = null; pintar(true) }, function (e) { aviso.ogo = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
      return
    }
    if (OGO && t.matches && t.matches('input[data-ogo-letra]')) {
      var lt = Object.assign({}, ogo.config.letras || {}); lt[t.getAttribute('data-ogo-letra')] = String(t.value || '').trim().toUpperCase().slice(0, 1)
      ogoGuardar(OGO.conConfig(ogo, { letras: lt })).then(function () { ogoCache = {}; ogoRev = null; pintar(true) }, function (e) { aviso.ogo = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
      return
    }
    if (OGO && t.matches && t.matches('input[data-ogo-archivo]')) {
      var fo = t.files && t.files[0]; t.value = ''
      if (!fo) return
      fo.text().then(function (txt) {
        var e = OGO.leerMarkdown(txt), k = claveCarpeta()
        if (!k) throw new Error('abrí primero el ejercicio en la Mesa')
        if (e.ejercicio && e.ejercicio !== k && !window.confirm('Esa OGO es del ejercicio «' + e.ejercicio + '» y tenés abierto «' + k + '». ¿Cargarla en «' + k + '»?')) return
        if (Object.keys(ogo.docs || {}).length && !window.confirm('Ya hay una OGO guardada en «' + k + '». ¿Reemplazarla por la del archivo?')) return
        return ogoGuardar(e).then(function () { ogoCache = {}; ogoRev = null; aviso.ogo = '✓ Cargada: ' + Object.keys(e.docs).length + ' documento(s).'; pintar(true) })
      }).catch(function (e) { aviso.ogo = '⚠️ ' + (e && e.message ? e.message : e); pintar(true) })
      return
    }
    if (t.matches && t.matches('input[data-bib-archivo]')) { if (t.files && t.files.length) bibSubir(Array.prototype.slice.call(t.files)); return }
    var li = t.closest && t.closest('[data-bib]'), d = li && bibDoc(li.getAttribute('data-bib'))
    if (d && t.matches('select[data-bib-tipo]')) { d.tipo = t.value; bibGuardar(d).then(bibCargar); return }
    if (d && t.matches('select[data-bib-bando]')) { d.bando = t.value; bibGuardar(d).then(bibCargar); return }
    if (d && t.matches('input[data-bib-ia]')) { d.enIA = t.checked; bibGuardar(d).then(bibCargar) }
  }

  // ---------- armado ----------
  function crear() {
    if (sel) return
    sel = document.createElement('div')
    sel.id = 'sid-mod-sel'
    sel.setAttribute('role', 'group')
    sel.setAttribute('aria-label', 'Modalidad de la Mesa')
    sel.innerHTML = MODOS.map(function (m) { return '<button type="button" data-m="' + m.id + '" title="' + esc(m.title) + '" aria-pressed="' + (m.id === modo) + '">' + m.rot + '</button>' }).join('')
    sel.addEventListener('click', function (e) { var b = e.target.closest('button[data-m]'); if (b) ponerModo(b.getAttribute('data-m')) })
    document.body.appendChild(sel)
    panel = document.createElement('aside')
    panel.id = 'sid-mod-panel'
    panel.setAttribute('aria-label', 'Tablero de la modalidad')
    panel.addEventListener('click', onClic)
    panel.addEventListener('change', onCambio)
    panel.addEventListener('input', function (e) {
      var t = e.target
      if (t.matches && t.matches('textarea[data-ia-resp]')) borrador[bk(+t.getAttribute('data-ia-resp'))] = t.value
      if (t.matches && t.matches('textarea[data-ogo-resp]')) ogoBorr[t.getAttribute('data-ogo-resp')] = t.value
      if (t.matches && t.matches('textarea[data-coh-resp]')) cohBorr = t.value
      if (t.matches && t.matches('input[data-rep-nombre]')) rep.nombre = t.value
      if (t.matches && t.matches('textarea[data-rep-ind]')) rep.ind = t.value
    })
    document.body.appendChild(panel)
    // las medidas y las fichas que se quitan en la Mesa (↶ Deshacer, 🗑️) no pasan por el puente: el
    // paso 12 vuelve a mirar la carta después de un clic en la Mesa y al volver al tablero
    document.addEventListener('click', function (e) { if (!panel.contains(e.target)) ubiRevisar() }, true)
    panel.addEventListener('pointerenter', ubiRevisar)
    body.setAttribute('data-sid-modo', modo)
    engancharPuente()
    pintar(true)
    // la barra se acomoda en filas, el tablero de abajo se abre y se cierra, los tableros de la
    // derecha van y vienen: se revisa seguido (es barato) y al cambiar el tamaño de la ventana
    setInterval(function () { if (modo !== 'mesa') acomodar() }, 400)
    window.addEventListener('resize', acomodar)
    bibCargar()
    carCargar()
    ogoCargar()
  }
  cargar()
  engancharPuente()
  if (document.body) crear(); else document.addEventListener('DOMContentLoaded', crear)

  window.SIDModalidad = {
    get modo() { return modo }, poner: ponerModo, abrir: abrir, catalogo: CAT,
    get panel() { return panel }, get hecho() { return hecho }, get tapado() { return tapado }, acomodar: acomodar,
    get foco() { return foco }, get puente() { return puente }, armarPedido: armarPedido, leerEjercicio: leerEjercicio,
    get biblioteca() { return biblio }, subir: bibSubir, recargarBiblioteca: bibCargar,
    get carpeta() { return carpeta }, recargarCarpeta: carCargar,
    get ogo() { return ogo }, recargarOgo: ogoCargar,
    get rep() { return rep }, nubeApi: nubeApi, calcoImagen: calcoImagen, documentosAlumnos: documentosAlumnos
  }
})()
