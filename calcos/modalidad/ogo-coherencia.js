/* 🔎 REVISIÓN DE COHERENCIA DE LA OGO Y LAS UNIDADES QUE FALTAN EN LA CARTA (modalidad Profesor).
   Código aparte del compilado, puro (se prueba en Node). Lo pidió Sergio (11-10-2026), después de
   armar la OGO documento por documento: «necesito que antes del paso 11 haya una revisión de todos los
   documentos y que arregle contradicciones o incoherencias… para que se conviertan en documentos
   sólidos… copiando un prompt que ya me genere todos los documentos consolidados, bien coordinados,
   lógicos y racionales, sin contradicciones». Y, con la organización de la tarea que trajo unidades
   «(supuesto)»: «una vez revisada la coherencia, generame esas unidades y su ubicación y que me salga
   un panel que diga aceptar… las que decían supuestas ya no deben decir supuestas».
   · pedido(ctx): UN pedido con TODOS los documentos escritos, los datos fijos del membrete, la lista de
     chequeo de una orden sin observaciones, las fichas de la carta (con su población más cercana), las
     unidades de la organización de la tarea que no están en la carta y las poblaciones del Área de
     Operaciones. La IA contesta: === REVISIÓN === (lo que corrigió), === DATOS === (```json con la
     fecha y las unidades que faltan, con su ubicación) y === DOCUMENTO: id === por cada documento.
   · leer(texto, est) → { revision, datos, docs, sigue, desconocidos }: lo pegado (en una o en varias
     partes); aplicar(est, leido): reemplaza los documentos (guarda el anterior), la fecha y las
     unidades; deshacer(est); pedidoSeguir(est): si la IA cortó, pide los que faltan.
   · porUbicar(est, ej, op): las unidades (de la IA y de la organización de la tarea) que no están en
     la carta, con su ubicación (la de la IA o la que sugiere la Mesa), la población más cercana y si
     cae dentro del Área de Operaciones; aceptar(est, item) → la ficha y los documentos sin «(supuesto)»
     para esa unidad; descartar(est, item). */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./ogo.js'), require('./ogo-mesa.js'), require('./ia-profesor.js'))
  else raiz.SIDOgoCoherencia = fabrica(raiz.SIDOgo, raiz.SIDOgoMesa, raiz.SIDIAProfesor)
})(typeof window !== 'undefined' ? window : this, function (OGO, MESA, IA) {
  'use strict'
  if (!OGO || !MESA) return null

  var una = MESA.una
  function f4(x) { return String(Math.round(x * 1e4) / 1e4) }
  function kmTxt(x) { return x.toFixed(1).replace('.', ',') }
  function escrito(est, id) { var x = est && est.docs && est.docs[id]; return !!(x && una(x.texto)) }
  function escritos(est) { return OGO.elegidos(est).filter(function (d) { return escrito(est, d.id) }) }
  function marca(d, est) { return '=== DOCUMENTO: ' + d.id + ' · ' + OGO.titulo(d.id, est) + ' ===' }

  // ─── El pedido ──────────────────────────────────────────────────────────────────────
  var CHEQUEO = [
    'La MISMA misión, intención del comandante, concepto de la operación y FASES (con sus mismas fechas D/H) en la Orden y en todos los anexos.',
    'La MISMA organización de la tarea en la Orden y en los anexos: cada unidad con la MISMA designación en todos lados; ninguna unidad que aparezca en un anexo y no en la organización de la tarea (o al revés).',
    'Las MISMAS letras de los anexos en todos lados (la lista de ANEXOS de la Orden es la de abajo).',
    'Las coordenadas de cada unidad, PC, instalación y medida de coordinación IGUALES en todos los documentos, DENTRO del Área de Operaciones y coherentes con las fichas de la carta.',
    'Los PC, CG e instalaciones nombrados por la POBLACIÓN MÁS CERCANA (lista de poblaciones abajo).',
    'Los mismos nombres de avenidas de aproximación, terreno clave, líneas de fase, objetivos y áreas de empeñamiento en todos los documentos.',
    'Los apoyos (fuegos, ingenieros, defensa antiaérea, comunicaciones, logística, personal, AC/GM) sostienen ESA maniobra: la prioridad al esfuerzo principal de la Orden, con los mismos medios y los mismos tiempos.',
    'Los tiempos encajan: nada ocurre antes de que se expida la Orden; los OPCON, las agregaciones y los movimientos tienen hora D/H y coinciden en todos los documentos.',
    'Escalón coherente: quien expide da tareas a su nivel y dos escalones abajo; el enemigo se describe dos escalones abajo.',
    'Sin «……», «[completar]», «XXX» ni apartados vacíos; un apartado que no aplica dice «Sin novedad.» y por qué.',
    'Ninguna unidad queda «(supuesto)»: cada unidad que hacía falta pasa a ser parte del ejercicio, con designación, ubicación (lat, lng) dentro del Área de Operaciones y su población más cercana, y va en el bloque DATOS para que el profesor la coloque en la carta.'
  ]
  function fichasTexto(ej) {
    var todas = MESA.poblaciones(ej)
    var us = ((ej && ej.unidades) || []).filter(function (u) { return u && isFinite(+u.lat) && u.lat != null })
    if (!us.length) return '(todavía no hay fichas en la carta)'
    return us.map(function (u) {
      var c = MESA.masCercana(todas, u.lat, u.lng)
      return '- ' + (/enem|rojo/i.test(u.bando || '') ? 'ROJO' : 'AZUL') + ' · ' + una(u.designacion || u.nombre) + (u.tipo === 'pc' ? ' (PC)' : '') + ' · ' + (u.arma || '') + ' · ' + (u.escalon || '') + ' · ' + f4(+u.lat) + ', ' + f4(+u.lng) + (c ? ' · cerca de ' + c.nombre + ' (' + kmTxt(c.km) + ' km)' : '')
    }).join('\n')
  }
  // ctx: { escalon, foco, ogo (con config completada: OGO.completarConfig), ejercicio, biblioteca, carpeta, fuente }
  function pedido(ctx) {
    ctx = Object.assign({}, ctx)
    var est = ctx.ogo || OGO.vacio(''), c = est.config || {}, E = ctx.escalon || { profesor: 'Comandante del escalón superior', alumnos: 'Comandantes del escalón subordinado' }
    var F = ctx.foco || { id: 'pmtd', nom: 'PMTD completo', pide: '', deja: '' }, ej = ctx.ejercicio || {}
    var ds = escritos(est), todos = OGO.elegidos(est), L = OGO.letras(est)
    var fftt = MESA.nivelDe(c.unidad) === 'fftt'
    var falt = porUbicar(est, ej, { escalon: ctx.escalonId }).filter(function (x) { return x.estado === 'pendiente' })
    var t = '# PEDIDO DE TRABAJO PARA LA IA — REVISIÓN DE COHERENCIA Y DOCUMENTOS CONSOLIDADOS — LEÉ ESTO PRIMERO\n\n' +
      'Sos el Estado Mayor de un **' + E.profesor + '** que arma un EJERCICIO DE ESCUELA para sus alumnos (**' + E.alumnos + '**). Abajo están TODOS los documentos de la **' + OGO.tituloOrden(est) + '** (' + ds.length + ' de ' + todos.length + ' escritos), cada uno escrito por separado. Los van a leer y a observar oficiales de Estado Mayor.\n\n' +
      '## LA TAREA\n' +
      '1. Leé TODOS los documentos JUNTOS, con la carta (fichas, poblaciones) y la lista de chequeo de abajo, y encontrá TODAS las contradicciones, incoherencias, datos que no cierran y vacíos.\n' +
      '2. Resolvelas con criterio táctico y doctrinario (la ORDEN manda; si la Orden es la que está mal, corregila también) y devolvé CADA documento COMPLETO y CONSOLIDADO: los mismos apartados del modelo de la Escuela, la misma numeración militar, el mismo formato de antes, ahora coordinados entre sí, lógicos y sin contradicciones.\n' +
      '3. Las unidades que hacían falta (las «(supuesto)» y las de la organización de la tarea que no están en la carta, lista abajo) pasan a ser parte del ejercicio: dales designación, arma, escalón, ubicación (lat, lng) DENTRO del Área de Operaciones según la doctrina (lo logístico atrás, la artillería entre el PC y el frente…) y su población más cercana; en los documentos ya NO dicen «(supuesto)».\n' +
      '4. En el campo que entrena el ejercicio (' + F.nom + ') NO le resuelvas al alumno lo que tiene que producir él' + (F.deja ? ': ' + F.deja : '') + '.\n\n' +
      '## DATOS FIJOS (la Mesa los pone en el membrete de TODOS los documentos: respetalos y no los cambies)\n' +
      '- Expide: ' + (una(c.unidad) || '(la unidad del ' + E.profesor + ')') + '\n' +
      '- Escalón superior: ' + (una(c.superior) || '—') + (fftt ? ' (Comando del Teatro de Operaciones: es el ÚNICO escalón superior de las FF.TT.T.O.; no nombres otro)' : '') + '\n' +
      '- La reciben (alumnos): ' + (una(c.alumnos) || E.alumnos) + '\n' +
      '- CG de quien expide: ' + (una(c.lugar) ? una(c.lugar) + ' (la población más cercana a su PC en la carta)' : '(la población más cercana a su PC: elegila de la lista de poblaciones)') + '\n' +
      '- Fecha y hora de la OGO: ' + (una(c.fechaHora) ? una(c.fechaHora) + ' (la MISMA en todos los documentos)' : 'todavía no está fijada: fijá UNA (regla de 1/3 – 2/3 sobre el tiempo hasta D) y ponela en DATOS') + '\n' +
      '- N°: ' + OGO.tituloOrden(est) + ' · Tipo: ' + (c.tipo === 'plan' ? 'PLAN (lleva «Hipótesis»)' : 'ORDEN (sin «Hipótesis»)') + '\n' +
      '- ANEXOS (con estas letras): ' + todos.filter(function (d) { return !d.principal }).map(function (d) { return (d.apendiceDe ? 'Apéndice “' + L[d.id] + '” al Anexo “' + L[d.apendiceDe] + '”' : 'Anexo “' + L[d.id] + '”') + ' ' + d.asunto.split(' / ')[0] }).join(' · ') + '\n\n' +
      '## LISTA DE CHEQUEO (una orden sin observaciones)\n' + CHEQUEO.map(function (x, i) { return (i + 1) + '. ' + x }).join('\n') + '\n\n' +
      '## CÓMO CONTESTAR (la Mesa separa lo que contestes por estas marcas: escribilas EXACTAMENTE así, cada una sola en su línea)\n' +
      '1. `=== REVISIÓN ===` y debajo una lista numerada de cada contradicción o incoherencia que encontraste: en qué documentos estaba y cómo la resolviste.\n' +
      '2. `=== DATOS ===` y debajo UN bloque ```json así:\n' +
      '```json\n{"membrete": {"fechaHora": "D-60 (0800)"},\n "unidades": [{"designacion": "BAT. LOG. FF.TT.", "bando": "propias", "tipo": "unidad", "arma": "logistica", "escalon": "batallon", "lat": -18.86, "lng": -68.52, "poblacion": "TUNAPA", "porque": "Detrás del PC, sobre la RPA, fuera del alcance de la artillería enemiga"}],\n "medidas": [{"nombre": "LF ALFA", "tipo": "linea", "coords": [[-18.60, -68.80], [-18.75, -68.80]]}]}\n```\n' +
      '   - `unidades`: SOLO las que NO están entre las fichas de la carta (lista «Fichas en la carta» abajo) y que los documentos nombran: las de la organización de la tarea, los PC (alterno incluido, con "tipo": "pc") y las instalaciones con unidad. `arma`: ' + MESA.ARMAS.join(', ') + '. `escalon`: ' + MESA.ESCALONES.join(', ') + '. Coordenadas en grados decimales, DENTRO del Área de Operaciones y IGUALES a las que escribís en los documentos.\n' +
      '   - `medidas`: las medidas de coordinación y control que nombran los documentos (líneas de fase, áreas de empeñamiento, objetivos, puntos de control…) con sus coordenadas [lat, lng], para que el profesor las dibuje.\n' +
      '3. Después, CADA documento empezando con su marca y su texto completo debajo, en este orden:\n' + todos.map(function (d) { return '   ' + marca(d, est) }).join('\n') + '\n' +
      '   Debajo de cada marca, el documento como antes: empezá con OBJETO:, CARTA:, ANEXOS: / APÉNDICES: (sin apéndices: «APÉNDICES: S/A.»), la ORGANIZACIÓN DE LA TAREA en líneas «AGRUPACIÓN: unidad; unidad» y cada apartado en su línea con su numeración militar (I.- A.- 1.- a.- 1) a)). Sin membrete, sin título, sin firma, sin autenticación ni distribución: los pone la Mesa. Al final de cada documento, «## PARA EL PROFESOR» si hay algo que el profesor tiene que revisar.\n' +
      '4. Si no te entra todo en una respuesta, cortá al TERMINAR un documento y escribí en su línea «SIGUE: <id del documento que sigue>»; el profesor te pide el resto y lo pega debajo.\n\n'
    t += '## LOS DOCUMENTOS (como están ahora)\n\n' + (ds.length ? ds.map(function (d) { return marca(d, est) + '\n' + OGO.producto(est.docs[d.id].texto).trim() }).join('\n\n') : '(Todavía no hay documentos escritos: primero escribí la OGO en el paso 10.)') + '\n\n'
    var sin = todos.filter(function (d) { return !escrito(est, d.id) })
    if (sin.length) t += 'Sin escribir todavía (escribilos vos, completos y coherentes con los demás): ' + sin.map(function (d) { return OGO.corto(d.id, est) }).join(' · ') + '.\n\n'
    t += '## LA CARTA (lo que está dibujado en la Mesa)\n### Fichas en la carta (con la población más cercana)\n' + fichasTexto(ej) + '\n\n'
    if (falt.length) t += '### Unidades que nombran los documentos y NO están en la carta (van en DATOS con su ubicación)\n' + falt.map(function (x) { return '- ' + x.u.designacion + (x.u.nombre && x.u.nombre !== x.u.designacion ? ' (' + x.u.nombre + ')' : '') + ' · ' + x.u.arma + ' · ' + x.u.escalon + (x.u.supuesto ? ' · estaba «(supuesto)»' : '') + (x.u.de ? ' · de ' + x.u.de : '') + (x.u.relacion ? ' · ' + x.u.relacion : '') }).join('\n') + '\n\n'
    var pobs = MESA.poblacionesParaPedido(ej, 80)
    if (pobs.length) t += '### Poblaciones del Área de Operaciones (nombre · tipo · lat, lng · habitantes)\n' + pobs.map(function (p) { return '- ' + p.nombre + (p.tipo ? ' · ' + p.tipo : '') + ' · ' + f4(p.lat) + ', ' + f4(p.lng) + (p.poblacion ? ' · ' + p.poblacion + ' hab.' : '') }).join('\n') + '\n\n'
    var an = MESA.anillo(ej)
    if (an) { var xs = an.map(function (p) { return +p[0] }), ys = an.map(function (p) { return +p[1] }); t += '### Área de Operaciones\nEntre lat ' + f4(Math.min.apply(null, ys)) + ' y ' + f4(Math.max.apply(null, ys)) + ', lng ' + f4(Math.min.apply(null, xs)) + ' y ' + f4(Math.max.apply(null, xs)) + '; vértices (lat, lng): ' + an.slice(0, 40).map(function (p) { return f4(+p[1]) + ', ' + f4(+p[0]) }).join(' → ') + '\n\n' }
    if (IA) t += '---\n\n# CONTEXTO DEL EJERCICIO (el terreno, la Orden de «Mesa · Preparación», la carpeta del profesor)\n\n' + IA.contexto({ ejercicio: ej, unidades: [], carpeta: ctx.carpeta, biblioteca: ctx.biblioteca, fuente: ctx.fuente, limite: 25000, limiteCarpeta: 20000, limiteBiblioteca: 12000, paso: 0 }) + '\n\n'
    t += '---\nRECORDATORIO: primero «=== REVISIÓN ===», después «=== DATOS ===» con el ```json, después CADA documento con su marca «=== DOCUMENTO: id · título ===», COMPLETO, consolidado y sin contradicciones, con los datos fijos del membrete (' + [una(c.unidad), una(c.superior), una(c.lugar), una(c.fechaHora)].filter(Boolean).join(' · ') + ').\n'
    return t
  }

  // ─── Leer lo que contestó la IA ─────────────────────────────────────────────────────
  var RE_MARCA = /^\s*[#>*_`\s]*={2,}\s*(REVISI[OÓ]N|DATOS|DOCUMENTO\b\s*:?\s*(.*?))\s*=*\s*[*_`]*\s*$/i
  function idDe(cab, est) {
    var t = una(cab), ids = OGO.DOCS.map(function (d) { return d.id })
    var tok = (/^([A-Za-z]+)\b/.exec(t) || [])[1]
    if (tok) for (var i = 0; i < ids.length; i++) if (ids[i].toLowerCase() === tok.toLowerCase()) return ids[i]
    var n = OGO.una(t).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), L = OGO.letras(est), k
    var ap = /AP[EE]NDICE\s*[“"«']?\s*([0-9A-Z])\b/.exec(n)
    if (ap) for (k in L) if (OGO.doc(k) && OGO.doc(k).apendiceDe && L[k] === ap[1]) return k
    var an = /ANEXO\s*[“"«']?\s*([A-Z])\b/.exec(n)
    if (an) for (k in L) if (OGO.doc(k) && !OGO.doc(k).apendiceDe && L[k] === an[1]) return k
    if (/(ORDEN|PLAN) DE OPERACIONES|CUERPO DE LA ORDEN|\bOGO\b/.test(n)) return 'ogo'
    return ''
  }
  function jsonDe(t) {
    var bloques = [], re = /```(?:json)?\s*([\s\S]*?)```/gi, m
    while ((m = re.exec(t))) bloques.push(m[1])
    if (!bloques.length) { var i0 = t.indexOf('{'), i1 = t.lastIndexOf('}'); if (i0 >= 0 && i1 > i0) bloques.push(t.slice(i0, i1 + 1)) }
    for (var i = 0; i < bloques.length; i++) { try { var j = JSON.parse(bloques[i]); if (j && typeof j === 'object') return j } catch (e) {} }
    return null
  }
  function leer(texto, est) {
    est = est || OGO.vacio('')
    var lineas = String(texto || '').replace(/\r\n?/g, '\n').split('\n'), partes = [], act = null, sigue = false, desconocidos = []
    lineas.forEach(function (l) {
      var m = RE_MARCA.exec(l)
      if (m) {
        var tipo = /^REVISI/i.test(m[1]) ? 'revision' : /^DATOS/i.test(m[1]) ? 'datos' : 'doc'
        act = { tipo: tipo, id: tipo === 'doc' ? idDe(m[2] || '', est) : '', cab: una(m[2] || ''), lineas: [] }
        if (tipo === 'doc') sigue = false // vino la parte siguiente
        if (tipo === 'doc' && !act.id) desconocidos.push(act.cab || l.trim())
        partes.push(act); return
      }
      if (/^\s*[*_`]*SIGUE\s*:/i.test(l)) { sigue = true; return }
      if (act) act.lineas.push(l)
    })
    var res = { revision: '', datos: null, docs: {}, orden: [], sigue: sigue, desconocidos: desconocidos }
    partes.forEach(function (p) {
      var tx = p.lineas.join('\n').replace(/^\s*-{3,}\s*$/gm, '').trim()
      if (p.tipo === 'revision') res.revision = (res.revision ? res.revision + '\n' : '') + tx
      else if (p.tipo === 'datos') { var j = jsonDe(tx); if (j) res.datos = juntarDatos(res.datos, j) }
      else if (p.id && tx) { if (!res.docs[p.id]) res.orden.push(p.id); res.docs[p.id] = tx } // si vino dos veces, la última
    })
    if (!res.datos && !partes.some(function (p) { return p.tipo === 'datos' })) { var j2 = /"unidades"\s*:/.test(texto) ? jsonDe(String(texto)) : null; if (j2) res.datos = juntarDatos(null, j2) }
    // sin ninguna marca: no es una respuesta consolidada
    res.vacio = !partes.length
    return res
  }
  function listaDe(x) { return Array.isArray(x) ? x.filter(function (u) { return u && typeof u === 'object' }) : [] }
  function juntarDatos(a, b) {
    a = a || { membrete: {}, unidades: [], medidas: [] }
    var out = { membrete: Object.assign({}, a.membrete, (b && b.membrete) || {}), unidades: listaDe(a.unidades).slice(), medidas: listaDe(a.medidas).slice() }
    listaDe(b && (b.unidades || b.fichas)).forEach(function (u) {
      var i = -1; out.unidades.forEach(function (x, k) { if (MESA.mismaUnidad(x.designacion, u.designacion)) i = k })
      if (i >= 0) out.unidades[i] = Object.assign({}, out.unidades[i], u); else out.unidades.push(u)
    })
    listaDe(b && b.medidas).forEach(function (m) { if (!out.medidas.some(function (x) { return una(x.nombre) && una(x.nombre) === una(m.nombre) })) out.medidas.push(m) })
    return out
  }
  // Reemplaza los documentos que vinieron (guarda el anterior para volver atrás), la fecha y las unidades.
  function aplicar(est, leido, ahora) {
    ahora = ahora || new Date().toISOString()
    var n = Object.assign({}, est, { docs: Object.assign({}, est.docs), actualizado: ahora }), ids = []
    var validos = OGO.elegidos(est).map(function (d) { return d.id })
    Object.keys(leido.docs || {}).forEach(function (id) {
      if (validos.indexOf(id) < 0) return
      var txt = String(leido.docs[id]).trim(), prev = est.docs && est.docs[id]
      n.docs[id] = { texto: txt, guardado: ahora, consolidado: ahora, previo: prev ? (prev.consolidado ? prev.previo : prev.texto) : '' }
      ids.push(id)
    })
    var prevC = est.coherencia || {}
    var datos = leido.datos ? juntarDatos(prevC.datos, leido.datos) : prevC.datos || null
    n.coherencia = { aplicado: ahora, revision: leido.revision || prevC.revision || '', datos: datos, docs: (prevC.docs || []).filter(function (x) { return ids.indexOf(x) < 0 }).concat(ids) }
    var fh = datos && datos.membrete && una(datos.membrete.fechaHora)
    if (!fh && leido.docs && leido.docs.ogo) fh = OGO.estructura(leido.docs.ogo).fechaHora
    if (fh) n.auto = Object.assign({}, est.auto, { fechaHora: fh, de: 'coherencia' })
    return { est: n, aplicados: ids }
  }
  function deshacer(est) {
    var n = Object.assign({}, est, { docs: Object.assign({}, est.docs), actualizado: new Date().toISOString() }), k = 0
    Object.keys(n.docs).forEach(function (id) {
      var x = n.docs[id]
      if (!x || !x.consolidado) return
      if (una(x.previo)) n.docs[id] = { texto: x.previo, guardado: n.actualizado }
      else delete n.docs[id]
      k++
    })
    delete n.coherencia
    return { est: n, vueltos: k }
  }
  function estado(est) {
    var c = est && est.coherencia, todos = OGO.elegidos(est)
    var hechos = todos.filter(function (d) { var x = est.docs && est.docs[d.id]; return x && x.consolidado }).map(function (d) { return d.id })
    return { aplicado: c ? c.aplicado : '', hechos: hechos, faltan: todos.filter(function (d) { return hechos.indexOf(d.id) < 0 }).map(function (d) { return d.id }), revision: c ? c.revision : '', datos: c ? c.datos : null }
  }
  // La IA cortó («SIGUE: …»): el pedido de los documentos que faltan, en la misma conversación.
  function pedidoSeguir(est) {
    var e = estado(est)
    if (!e.faltan.length) return ''
    return 'SEGUÍ con la consolidación, en la MISMA conversación y con las MISMAS decisiones de tu «=== REVISIÓN ===» y de tus «=== DATOS ===» (las mismas unidades, coordenadas, nombres, fases y fecha). Faltan estos documentos, COMPLETOS y cada uno con su marca:\n' +
      e.faltan.map(function (id) { return marca(OGO.doc(id), est) }).join('\n') + '\n\nSi tampoco entran todos, cortá al terminar un documento y escribí «SIGUE: <id del que sigue>».\n'
  }

  // ─── Las unidades que faltan en la carta ────────────────────────────────────────────
  var BANDO_PROPIO = /propi|azul|amig/i
  function normal(u, de) {
    var designacion = una(u.designacion || u.nombre || u.unidad)
    if (!designacion) return null
    var arma = String(u.arma || '').toLowerCase(), esc = String(u.escalon || '').toLowerCase()
    var r = {
      designacion: designacion, nombre: una(u.nombre || ''), sigla: una(u.sigla || ''), tipo: /pc|puesto/i.test(u.tipo || '') || /^\s*P\.?\s?C\.?\b|PUESTO\s+(DE\s+)?COMANDO/i.test(designacion) ? 'pc' : 'unidad',
      arma: MESA.ARMAS.indexOf(arma) >= 0 ? arma : MESA.rasgos(designacion).arma || 'infanteria', escalon: MESA.ESCALONES.indexOf(esc) >= 0 ? esc : (MESA.rasgos(designacion).nivel || 'batallon'),
      supuesto: !!u.supuesto, relacion: una(u.relacion || ''), de: una(u.de || ''), porque: una(u.porque || u.motivo || ''), fuente: de
    }
    if (u.bando && !BANDO_PROPIO.test(u.bando)) return null // sólo las propias se colocan desde acá
    var lat = +u.lat, lng = +(u.lng != null ? u.lng : u.lon)
    if (isFinite(lat) && isFinite(lng) && u.lat != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) { r.lat = lat; r.lng = lng }
    if (una(u.poblacion)) r.poblacionIA = una(u.poblacion)
    return r
  }
  function clave(u) { return MESA.rasgos(u.designacion).k || una(u.designacion).toUpperCase() }
  // → [{ clave, u, lat, lng, de: 'la IA' | 'la Mesa', poblacion, dentro, estado: pendiente | colocada | descartada }]
  function porUbicar(est, ej, op) {
    op = op || {}; est = est || OGO.vacio(''); ej = ej || {}
    var lista = []
    var suma = function (u) { if (u && !lista.some(function (x) { return MESA.mismaUnidad(x.designacion, u.designacion) || (u.sigla && MESA.mismaUnidad(x.designacion, u.sigla)) || (x.sigla && MESA.mismaUnidad(x.sigla, u.designacion)) })) lista.push(u) }
    var datos = est.coherencia && est.coherencia.datos
    listaDe(datos && datos.unidades).forEach(function (u) { suma(normal(u, 'la IA')) })
    var orgDe = function (id) { var x = est.docs && est.docs[id]; return x && una(x.texto) ? OGO.estructura(x.texto).organizacion : [] }
    // las de la organización de la tarea de la Orden: suman las que la IA no trajo y le dicen a las suyas si eran «(supuesto)»
    MESA.unidadesDeOrganizacion(orgDe('ogo')).forEach(function (o) {
      var ya = lista.filter(function (x) { return MESA.mismaUnidad(x.designacion, o.designacion) || (o.sigla && MESA.mismaUnidad(x.designacion, o.sigla)) || (o.nombre && MESA.mismaUnidad(x.designacion, o.nombre)) })[0]
      if (!ya) return suma(normal(o, 'la organización de la tarea'))
      ya.supuesto = ya.supuesto || o.supuesto; ya.relacion = ya.relacion || o.relacion; ya.de = ya.de || o.de; ya.nombre = ya.nombre || o.nombre; ya.sigla = ya.sigla || o.sigla
    })
    var c = (est.config || {}), ident = MESA.identidad(ej, op.escalon)
    // quien expide y sus alumnos no se «colocan» desde acá (ya están o son el ejercicio)
    lista = lista.filter(function (u) { return !(c.unidad && MESA.mismaUnidad(u.designacion, c.unidad)) && !(ident.unidad && MESA.mismaUnidad(u.designacion, ident.unidad)) })
    var falta = MESA.faltantes(lista, ej.unidades), pobs = MESA.poblaciones(ej), an = MESA.anillo(ej), col = est.colocadas || {}, desc = est.descartadas || {}
    var porRol = {}
    var items = lista.map(function (u) {
      var k = clave(u), esta = falta.indexOf(u) < 0
      var rol = u.arma + '|' + (/cuerpo|division|brigada/.test(u.escalon) ? 'm' : ''), i = porRol[rol] = (porRol[rol] == null ? 0 : porRol[rol] + 1)
      var p = isFinite(u.lat) ? { lat: u.lat, lng: u.lng, de: 'la IA' } : MESA.sugerir(u, ej, ident, i)
      if (p && !p.de) p.de = 'la Mesa'
      var pob = p ? MESA.masCercana(pobs, p.lat, p.lng) : null
      return { clave: k, u: u, lat: p ? p.lat : null, lng: p ? p.lng : null, de: p ? p.de : '', poblacion: pob, dentro: p && an ? MESA.dentro([p.lng, p.lat], an) : null,
        estado: col[k] ? 'colocada' : esta ? 'en la carta' : desc[k] ? 'descartada' : 'pendiente', colocada: col[k] || null }
    })
    return items
  }
  // Aceptar: la ficha para la Mesa y los documentos sin «(supuesto)» en las líneas de esa unidad.
  function aceptar(est, item, ahora, lugar) {
    ahora = ahora || new Date().toISOString()
    var u = Object.assign({}, item.u, lugar || { lat: item.lat, lng: item.lng })
    if (u.lat == null || u.lng == null || u.lat === '' || !isFinite(+u.lat) || !isFinite(+u.lng)) throw new Error('«' + item.u.designacion + '» no tiene ubicación: trazá el Área de Operaciones o poné la ficha a mano.')
    var f = MESA.ficha(u, Date.parse(ahora) || Date.now())
    var n = Object.assign({}, est, { docs: Object.assign({}, est.docs), actualizado: ahora, colocadas: Object.assign({}, est.colocadas) }), cambios = 0
    Object.keys(n.docs).forEach(function (id) {
      var x = n.docs[id]; if (!x || !una(x.texto)) return
      var r = MESA.quitarSupuesto(x.texto, item.u)
      if (r.cambios) { n.docs[id] = Object.assign({}, x, { texto: r.texto, guardado: ahora }); cambios += r.cambios }
    })
    n.colocadas[item.clave] = { designacion: f.designacion, lat: f.lat, lng: f.lng, poblacion: item.poblacion ? item.poblacion.nombre : '', cuando: ahora, ficha: f.id }
    if (n.descartadas) { n.descartadas = Object.assign({}, n.descartadas); delete n.descartadas[item.clave] }
    return { est: n, ficha: f, cambios: cambios }
  }
  function descartar(est, item, si) {
    var n = Object.assign({}, est, { descartadas: Object.assign({}, est.descartadas), actualizado: new Date().toISOString() })
    if (si === false) delete n.descartadas[item.clave]; else n.descartadas[item.clave] = true
    return n
  }

  return { CHEQUEO: CHEQUEO, pedido: pedido, leer: leer, aplicar: aplicar, deshacer: deshacer, estado: estado, pedidoSeguir: pedidoSeguir, porUbicar: porUbicar, aceptar: aceptar, descartar: descartar, idDe: idDe }
})
