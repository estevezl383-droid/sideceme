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
     (MesaAcademica.sincronizar → agregarUnidades): no se toca el compilado.
   Lo marcado, el escalón y el foco quedan en localStorage de ESTE navegador (no viajan con el
   ejercicio). El catálogo está en catalogo.js. Con «Mesa completa» no cambia nada. */
(function () {
  'use strict'
  var CAT = window.SIDModalidadCatalogo, IA = window.SIDIAProfesor
  if (!CAT) return
  var K_MODO = 'sid_modalidad', K_HECHO = 'sid_mod_hecho', K_FASE = 'sid_mod_fase', K_ESC = 'sid_mod_escalon', K_PLEGADO = 'sid_mod_plegado', K_FOCO = 'sid_mod_foco'
  var MODOS = [
    { id: 'mesa', rot: '🎖️ Mesa', title: 'La Mesa completa, como siempre: el instructor arma y reparte; cada G trabaja su tablero' },
    { id: 'aprendizaje', rot: '🎓 Aprendizaje', title: 'Un solo alumno hace TODO el PMTD, fase por fase y paso por paso' },
    { id: 'profesor', rot: '🧑‍🏫 Profesor', title: 'Armar un ejercicio para los alumnos, paso a paso, con las herramientas de la Mesa' }
  ]
  var body = document.body
  var modo = 'mesa', hecho = {}, fase = 1, escalon = 'ce', plegado = false, panel = null, sel = null, firma = ''
  var foco = 'pmtd', iaPaso = 0, iaTexto = '', aviso = {}, puente = null // puente: lo último que la Mesa le mandó a MesaAcademica.sincronizar (ejercicio, fichas, centro, agregarUnidades)

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
    MA.sincronizar = function (p) { puente = p || null; return orig.apply(this, arguments) }
    MA.__sidModalidad = true
  }
  function centroMesa() { try { var c = puente && (typeof puente.centro === 'function' ? puente.centro() : puente.centro); return c && isFinite(c.lat) ? c : null } catch (e) { return null } }
  function ponerModo(m) {
    modo = m; guarda(K_MODO, m)
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

  // ---------- la IA del profesor ----------
  // El compilado manda por el puente el NOMBRE del ejercicio abierto (no sus datos); los datos
  // (la Orden escrita, el CMOC, las fases, los documentos) están en el IndexedDB «calcos»,
  // donde la Mesa guarda el ejercicio solo cada pocos segundos. Se lee de ahí, sin crear nada:
  // si la base no existe todavía, el pedido sale sin contexto y lo dice.
  function leerEjercicio(nombre) {
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
              var g = db.transaction('ejercicios', 'readonly').objectStore('ejercicios').get(nombre)
              g.onsuccess = function () { var v = g.result, d = v && (v.datos || v); db.close(); if (d && typeof d === 'object') d.nombre = d.nombre || nombre; ok(d && typeof d === 'object' ? d : null) }
              g.onerror = function () { db.close(); ok(null) }
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
  function armarPedido(p) {
    if (!IA) return Promise.resolve('')
    var nombre = puente && (typeof puente.ejercicio === 'string' ? puente.ejercicio : puente.ejercicio && puente.ejercicio.nombre)
    return leerEjercicio(nombre).then(function (ej) {
      if (!ej && puente && puente.ejercicio && typeof puente.ejercicio === 'object') ej = puente.ejercicio
      if (!ej && nombre) ej = { nombre: nombre }
      return IA.armarPedido(p, { escalon: escalonDe(escalon), foco: focoDe(foco), ejercicio: ej, unidades: puente && puente.unidades, centro: centroMesa() })
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
    var ia = p.ia || {}, abierto = iaPaso === p.n
    var h = '<div class="ia' + (p.ogo ? ' ogo' : '') + '">' +
      '<button type="button" class="ia-btn" data-ia-paso="' + p.n + '" aria-expanded="' + abierto + '" title="Arma el pedido a la IA con lo que ya hay en el ejercicio (escalón, campo que se entrena, Orden, fichas, documentos). Se copia o se baja y se le da a ChatGPT, Gemini o Claude.">' +
      (p.ogo ? '🤖 OGO con todos sus anexos (IA)' : '🤖 IA: ' + esc(ia.tit || p.nom)) + (abierto ? ' ▴' : ' ▸') + '</button>'
    if (abierto) {
      var n = iaTexto.length
      h += '<div class="ia-caja"><p class="ia-ayuda">' + (p.ogo ? 'Pide la <b>Orden General de Operaciones</b> del ' + esc(escalonDe(escalon).profesor) + ' con TODOS sus anexos (' + CAT.ANEXOS_OGO.map(function (a) { return a.letra }).join(', ') + '), completa en todo salvo en lo que entrena: <b>' + esc(focoDe(foco).nom) + '</b>. ' : esc(ia.pide ? ia.pide.split('.')[0] + '.' : '')) +
        'Copialo y pegalo en ChatGPT, Gemini o Claude (' + n.toLocaleString('es') + ' caracteres' + (n > 120000 ? '; es largo: si la IA lo corta, usá Claude o Gemini pagos' : '') + ').' + (!puente ? ' <b>La Mesa todavía no mandó el ejercicio</b> (abrí uno): el pedido va sin contexto.' : '') + '</p>' +
        '<div class="ia-acc"><button type="button" class="ir" data-a="ia-copiar">📋 Copiar el pedido</button><button type="button" class="ir" data-a="ia-bajar">⬇️ Bajar .md</button><button type="button" class="chico" data-a="ia-cerrar">Cerrar</button>' + (aviso['ia' + p.n] ? '<span class="ia-aviso">' + esc(aviso['ia' + p.n]) + '</span>' : '') + '</div>' +
        '<textarea data-ia readonly rows="8" aria-label="Pedido a la IA">' + esc(iaTexto) + '</textarea></div>'
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
      '<div class="org-nota">Son organizaciones genéricas de escuela; se ajustan ficha por ficha en 🪖 Unidades. ROJO se dibuja espejado (viene del otro lado).</div></div>'
  }
  function insertarFichas(fichas, de) {
    if (!puente || !puente.agregarUnidades) { aviso.org = 'La Mesa no mandó el puente de las fichas: abrí un ejercicio.'; return }
    if (!fichas.length) { aviso.org = 'No hay fichas para insertar.'; return }
    puente.agregarUnidades(fichas)
    puente = Object.assign({}, puente, { unidades: (puente.unidades || []).concat(fichas) })
    aviso.org = '✓ ' + fichas.length + ' fichas insertadas (' + de + '). Ajustalas en 🪖 Unidades; con ⟲ Deshacer de la Mesa se quitan.'
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
      '<label class="cab"><input type="checkbox" data-f="' + F.id + '" data-n="' + p.n + '"' + (h ? ' checked' : '') + ' aria-label="Paso ' + p.n + ' hecho"><span class="num">' + p.n + '</span><span class="nom">' + esc(p.nom) + '</span></label>' +
      '<div class="doc">' + (p.doc ? '📄 ' + esc(p.doc) : esc(p.que || '')) + '</div>' +
      (p.resp ? '<div class="resp">' + chips(p.resp) + '</div>' : '') +
      (p.escalon ? selectorEscalon() + selectorFoco() : '') +
      botonesAbrir(p.abrir, F.id, p.n) +
      (F.id === 'P' && p.organizaciones ? htmlOrganizaciones(p) : '') +
      (F.id === 'P' && p.ia ? htmlIA(p) : '') + '</li>'
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
      '<div class="total"><span class="barra"><i style="width:' + Math.round(100 * a.h / a.t) + '%"></i></span><b>' + a.h + ' / ' + a.t + ' pasos</b></div></div>' +
      '<ol class="pasos prof">' + CAT.PROFESOR.map(function (p) { return paso(F, p) }).join('') + '</ol>' +
      '<div class="pie"><div class="secs">Tableros de cada sección: ' + Object.keys(CAT.SECCIONES).map(function (s) { return '<button type="button" class="ir sec-ir" data-sec="' + s + '" style="--sc:' + CAT.SECCIONES[s].color + '">' + esc(CAT.SECCIONES[s].corto) + '</button>' }).join('') + '</div>' +
      '<button type="button" class="chico" data-a="reiniciar">Reiniciar lo marcado</button></div>'
  }
  function pintar(forzar) {
    if (!panel) return
    var f = [modo, fase, escalon, foco, plegado, iaPaso, JSON.stringify(hecho), JSON.stringify(aviso), !!(puente && puente.agregarUnidades)].join('|')
    if (!forzar && f === firma) return
    firma = f
    panel.hidden = modo === 'mesa'
    panel.className = plegado ? 'plegado' : ''
    if (modo === 'mesa') return
    panel.innerHTML = '<button type="button" class="asa" data-a="asa" aria-expanded="' + !plegado + '" title="' + (plegado ? 'Desplegar el tablero' : 'Plegar el tablero para ver la carta') + '">' + (plegado ? (modo === 'profesor' ? '🧑‍🏫 Pasos ◂' : '🎓 Fases ◂') : '▸ Plegar') + '</button>' +
      '<div class="cuerpo">' + (modo === 'profesor' ? htmlProfesor() : htmlAprendizaje()) + '</div>'
  }

  // ---------- eventos ----------
  function onClic(e) {
    var t = e.target
    var a = t.closest && t.closest('[data-a]')
    if (a && a.getAttribute('data-a') === 'asa') { plegado = !plegado; guarda(K_PLEGADO, plegado ? '1' : '0'); pintar(true); return }
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
      if (acc === 'ia-copiar') { copiar(iaTexto).then(function () { aviso['ia' + pa.n] = '📋 Pedido copiado (' + iaTexto.length.toLocaleString('es') + ' caracteres): pegalo en la IA.'; pintar(true) }, function () { aviso['ia' + pa.n] = 'No se pudo copiar: seleccioná el texto y copialo a mano.'; pintar(true) }); return }
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
      if (ok === true) { plegado = true; guarda(K_PLEGADO, '1'); pintar(true) } // el panel real quedó abierto en su lugar: el tablero se pliega al borde
      else { var r = b.textContent; b.textContent = ok === 'calcos' ? 'Primero ⚡ Generar calcos' : 'No está en esta Mesa'; b.classList.add('no'); setTimeout(function () { b.textContent = r; b.classList.remove('no') }, 2200) }
    })
  }
  function onCambio(e) {
    var t = e.target
    if (t.matches && t.matches('input[type=checkbox][data-f]')) { marcar(t.getAttribute('data-f') === 'P' ? 'P' : +t.getAttribute('data-f'), +t.getAttribute('data-n'), t.checked); pintar(true); return }
    if (t.matches && t.matches('select[data-escalon]')) { escalon = t.value; guarda(K_ESC, escalon); iaPaso = 0; pintar(true); return }
    if (t.matches && t.matches('select[data-foco]')) { foco = t.value; guarda(K_FOCO, foco); iaPaso = 0; pintar(true) }
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
    document.body.appendChild(panel)
    body.setAttribute('data-sid-modo', modo)
    engancharPuente()
    pintar(true)
  }
  cargar()
  engancharPuente()
  if (document.body) crear(); else document.addEventListener('DOMContentLoaded', crear)

  window.SIDModalidad = {
    get modo() { return modo }, poner: ponerModo, abrir: abrir, catalogo: CAT,
    get panel() { return panel }, get hecho() { return hecho },
    get foco() { return foco }, get puente() { return puente }, armarPedido: armarPedido, leerEjercicio: leerEjercicio
  }
})()
