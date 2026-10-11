/* 📜 LA OGO COMPLETA CON SUS ANEXOS (modalidad Profesor de la Mesa del EM). Código aparte del
   compilado, puro (se prueba en Node). Lo pidió Sergio (11-10-2026): «cuando termine todos esos
   pasos, en conjunción con la Mesa de planeamiento, con todo lo que se construyó, salga una OGO
   completa con sus planes de apoyo para darles a los alumnos… no quiero ser objeto de
   observaciones y críticas con órdenes mal hechas o incompletas».
   · pedido(id, ctx): el pedido a la IA de UN documento (la Orden o un anexo), con el MODELO de
     la Escuela de ese documento (ogo-modelos.js), lo ya escrito de la OGO (para que todo sea
     coherente), la organización de la tarea de la Mesa y el contexto del ejercicio (el mismo de
     los otros pasos: el terreno dibujado, las fichas, la Orden de «Mesa · Preparación», la
     biblioteca y la carpeta del profesor).
   · revisar(id, texto, op) / revisarTodo(est, op): lo que le falta a lo que contestó la IA para
     no tener observaciones (los apartados del modelo, los vacíos, los «……» y «[completar]», los
     anexos que la Orden no nombra, los datos del membrete, lo que falta dibujar para el calco).
   · pedidoCorregir(id, rev, ctx): el pedido para que la IA devuelva el documento corregido.
   · aSpec(id, texto, est) + cfgWord(id, est): lo que contestó la IA, en la forma que recibe el
     formato militar de la Mesa (calcos/formato-militar/v1/word.js, crearWord): membrete, título,
     OBJETO/CARTA/ANEXOS, organización de la tarea, párrafos I.- A.- 1.- a.- 1) a), firma,
     autenticación y distribución. El MISMO Word de todos los documentos de la Mesa.
   · markdown(est) / leerMarkdown(t): la OGO entera en un .md (y de vuelta), para llevarla a otro equipo.
   · paraEjercicio(est): los documentos para adjuntar al ejercicio (los ven los alumnos).
   Dónde se guarda lo decide modalidad.js (IndexedDB «sid-profesor-ogo» de ese navegador). */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./ogo-modelos.js'), require('./ia-profesor.js'), require('./carpeta.js'), require('./ogo-mesa.js'))
  else raiz.SIDOgo = fabrica(raiz.SIDOgoModelos, raiz.SIDIAProfesor, raiz.SIDCarpetaProfesor, raiz.SIDOgoMesa)
})(typeof window !== 'undefined' ? window : this, function (MOD, IA, CARP, MESA) {
  'use strict'

  var DOCS = MOD.DOCS
  var MARCA = 'sid-ogo-profesor:v1'
  var LIMITE_OGO = 30000 // lo ya escrito de la Orden que entra en el pedido de cada anexo
  var LIMITE_OTRO = 1500 // de cada uno de los otros anexos ya escritos

  function limpia(s) { return String(s == null ? '' : s).replace(/\r\n?/g, '\n') }
  function una(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim() }
  function norm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[“”«»"']/g, '').replace(/\s+/g, ' ').trim() }
  function recorta(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '\n[… recortado: ' + (s.length - n) + ' caracteres más]' : s }
  function doc(id) { for (var i = 0; i < DOCS.length; i++) if (DOCS[i].id === id) return DOCS[i]; return null }
  // lo que va a los alumnos y al Word: sin «PARA EL PROFESOR» ni la línea «FECHA Y HORA:» (va al membrete)
  function productoCrudo(texto) { return CARP ? CARP.separar(texto).producto : limpia(texto) }
  function producto(texto) { return productoCrudo(texto).replace(/^\s*[*_]*FECHA\s+Y\s+HORA(?:\s+DE\s+[^:]{0,30})?\s*:[^\n]*\n?/i, '') }

  // ─── El estado de la OGO de un ejercicio ────────────────────────────────────────────
  // { ejercicio, config: { tipo, numero, superior, unidad, alumnos, lugar, fechaHora, carta,
  //   iniciales, jem, firma, distribucion, ensenanza, seleccion: {id: bool}, letras: {id: 'X'} },
  //   docs: { id: { texto, guardado } }, actualizado }
  function seleccionInicial() { var s = {}; DOCS.forEach(function (d) { s[d.id] = !d.opcional }); return s }
  function vacio(ejercicio) {
    return { ejercicio: String(ejercicio || ''), config: { tipo: 'orden', numero: '', superior: '', unidad: '', alumnos: '', lugar: '', fechaHora: '', carta: '', iniciales: '', jem: '', firma: '', distribucion: '', ensenanza: false, seleccion: seleccionInicial(), letras: {} }, docs: {}, actualizado: '' }
  }
  // Lo vacío de los datos de la Orden, de la Mesa. Solo llena lo que el profesor todavía no escribió
  // en el tablero de la OGO (`config`); de dónde salió cada dato queda en `autoDe` (se muestra).
  // Lo pidió Sergio (11-10-2026) con el Word del Anexo A con «[Escalón superior pendiente]» y
  // «[Unidad pendiente]»: quien expide es la unidad de «¿Quién soy?» del inicio del ejercicio (si es
  // del escalón del profesor; si no, el «Escalón superior» de «Mesa · Preparación»), el escalón
  // superior de las FF.TT.T.O. es el CTO, el CG es la POBLACIÓN MÁS CERCANA a su PC en la carta y la
  // fecha es la que fijó la IA en la Orden (la misma en todos los documentos). op: { escalon }.
  function completarConfig(est, ej, op) {
    op = op || {}
    var os = (ej && ej.ordenSup) || {}, c = Object.assign({}, est.config), de = {}
    var pon = function (k, v, f) { if (!una(c[k]) && una(v)) { c[k] = una(v); de[k] = f || '' } }
    var yo = ej && ej.ops && ej.ops.unidadConsiderada && ej.ops.unidadConsiderada.nombre
    var id = MESA && ej ? MESA.identidad(ej, op.escalon) : null
    pon('numero', os.numero, '«Mesa · Preparación»')
    if (id) {
      pon('unidad', id.unidad, id.fuentes.unidad); pon('superior', id.superior, id.fuentes.superior)
      pon('alumnos', id.alumnos, id.fuentes.alumnos); if (id.lugar) pon('lugar', id.lugar.nombre, id.fuentes.lugar)
    } else {
      pon('unidad', os.escalonSuperior, '«Mesa · Preparación»')
      pon('alumnos', os.unidadPropia || os.unidad || yo, '«Mesa · Preparación»')
    }
    if (MESA) pon('superior', MESA.superiorDe(c.unidad), 'Regla de la Escuela: el escalón superior de las FF.TT.T.O. es el CTO')
    pon('lugar', os.puestoMando, '«Mesa · Preparación» (puesto de mando)')
    pon('fechaHora', est.auto && est.auto.fechaHora, 'La fecha que fijó la IA en la OGO')
    pon('fechaHora', os.vigencia, '«Mesa · Preparación» (vigencia)')
    pon('carta', os.carta, '«Mesa · Preparación»')
    pon('iniciales', os.clave, '«Mesa · Preparación» (clave del redactor)')
    if (!c.seleccion) c.seleccion = seleccionInicial()
    // en el membrete, la firma y los pedidos va sólo la sigla: «FF.TT.T.O.», no su desarrollo (Sergio, 11-10-2026)
    if (MESA) ['unidad', 'superior', 'alumnos', 'firma'].forEach(function (k) { if (una(c[k])) c[k] = MESA.sinDesarrollo(c[k]) })
    return Object.assign({}, est, { config: c, autoDe: de, identidad: id })
  }
  function esPlan(est) { return est && est.config && est.config.tipo === 'plan' }

  // Los documentos elegidos, en orden (la Orden siempre; un apéndice solo si su anexo está).
  function elegidos(est) {
    var s = (est && est.config && est.config.seleccion) || seleccionInicial()
    return DOCS.filter(function (d) { return d.principal || (s[d.id] && (!d.apendiceDe || s[d.apendiceDe])) })
  }
  // Las letras: las que fijan los modelos de la Escuela (A Calco, B Inteligencia, C Apoyo de
  // Fuegos) y las demás seguidas desde la D, en el orden de la lista. El profesor las cambia.
  function letras(est) {
    var res = {}, usadas = {}, man = (est && est.config && est.config.letras) || {}
    var anexos = elegidos(est).filter(function (d) { return !d.principal && !d.apendiceDe })
    anexos.forEach(function (d) { var l = String(man[d.id] || '').trim().toUpperCase(); if (/^[A-Z]$/.test(l) && !usadas[l]) { res[d.id] = l; usadas[l] = 1 } })
    anexos.forEach(function (d) { if (!res[d.id] && d.letra && !usadas[d.letra]) { res[d.id] = d.letra; usadas[d.letra] = 1 } })
    var k = 3 // D
    anexos.forEach(function (d) { if (res[d.id]) return; while (usadas[String.fromCharCode(65 + k)]) k++; res[d.id] = String.fromCharCode(65 + k); usadas[res[d.id]] = 1 })
    elegidos(est).filter(function (d) { return d.apendiceDe }).forEach(function (d) { res[d.id] = d.numero || '1' })
    return res
  }
  function numero(est) { return una(est && est.config && est.config.numero) || '01' }
  function tituloOrden(est) { return (esPlan(est) ? 'PLAN' : 'ORDEN') + ' DE OPERACIONES No. ' + numero(est) }
  function titulo(id, est) {
    var d = doc(id), L = letras(est)
    if (!d || d.principal) return tituloOrden(est)
    if (d.apendiceDe) return 'APÉNDICE “' + L[id] + '” (' + d.asunto + ') AL ' + titulo(d.apendiceDe, est)
    return 'ANEXO “' + L[id] + '” (' + d.asunto + ') ' + (esPlan(est) ? 'AL ' : 'A LA ') + tituloOrden(est)
  }
  function corto(id, est) { var d = doc(id), L = letras(est); return !d || d.principal ? tituloOrden(est) : (d.apendiceDe ? 'Apéndice “' + L[id] + '”' : 'Anexo “' + L[id] + '”') + ' — ' + d.nom.replace(/\s*\(.*\)$/, '') }
  // La lista de ANEXOS de la Orden (o de APÉNDICES de un anexo), uno por línea.
  function listaAnexos(est, de) {
    var L = letras(est)
    return elegidos(est).filter(function (d) { return de ? d.apendiceDe === de : !d.principal && !d.apendiceDe })
      .map(function (d) { return (de ? 'Apéndice “' : 'Anexo “') + L[d.id] + '” ' + d.asunto.split(' / ')[0] + '.' }).join('\n')
  }

  // ─── El pedido a la IA de un documento ──────────────────────────────────────────────
  function entrena(d, foco) { return !!(foco && foco.id !== 'pmtd' && (foco.secs || []).indexOf(d.sec) >= 0) }
  function resumenOrgTarea(ej) {
    var ag = ((ej && ej.orgTarea) || []).filter(Boolean)
    if (!ag.length) return ''
    return ag.map(function (a) {
      var ps = (a.piezas || []).map(function (p) { return una(p.nom || p.madre || p.id) + (p.madre && p.nom ? ' (de ' + una(p.madre) + ')' : '') })
      return '- ' + una(a.nombre || 'Agrupación') + (a.operacion ? ' [' + String(a.operacion).toUpperCase() + ']' : '') + (a.tarea ? ' · tarea: ' + una(a.tarea) : '') + (a.proposito ? ' · propósito: ' + una(a.proposito) : '') + (ps.length ? ': ' + ps.join('; ') : '')
    }).join('\n')
  }
  function yaEscrito(id, est) {
    var docs = (est && est.docs) || {}, t = []
    if (id !== 'ogo' && docs.ogo && una(docs.ogo.texto)) t.push('#### ' + tituloOrden(est) + ' (el cuerpo de la Orden, ya escrito: MANDA)\n' + recorta(producto(docs.ogo.texto), LIMITE_OGO))
    elegidos(est).forEach(function (d) {
      if (d.id === id || d.principal || !docs[d.id] || !una(docs[d.id].texto)) return
      t.push('#### ' + corto(d.id, est) + ' (ya escrito; el comienzo)\n' + recorta(producto(docs[d.id].texto), LIMITE_OTRO))
    })
    return t.join('\n\n')
  }
  function cabecera(id, ctx) {
    var E = ctx.escalon, F = ctx.foco, est = ctx.ogo, d = doc(id), c = est.config, L = letras(est), lista = elegidos(est)
    var k = lista.indexOf(d) + 1
    var t = '# PEDIDO DE TRABAJO PARA LA IA — LEÉ ESTO PRIMERO\n\n' +
      'Sos el Estado Mayor de un **' + E.profesor + '** (escalón SUPERIOR) que arma un EJERCICIO DE ESCUELA para sus alumnos, que son **' + E.alumnos + '**. Estás escribiendo, documento por documento y sobre los MODELOS DE LA ESCUELA, la **' + tituloOrden(est) + '** que ellos van a recibir para planificar. Tiene que quedar COMPLETA, COHERENTE y SIN ERRORES: la van a leer y a observar oficiales de Estado Mayor.\n\n' +
      '**Documento ' + k + ' de ' + lista.length + ':** ' + titulo(id, est) + '\n' +
      '**Expide:** ' + (una(c.unidad) || 'la unidad del ' + E.profesor) + (una(c.lugar) ? ' · PC ' + una(c.lugar) : '') + (una(c.fechaHora) ? ' · ' + una(c.fechaHora) : '') + ' · **la reciben:** ' + (una(c.alumnos) || E.alumnos) + '\n' +
      '**Lo elabora y lo autentica:** el ' + d.autentica + ' (' + d.seccion + '); lo firma el Comandante.\n' +
      membreteParaPedido(est) +
      (esPlan(est) ? '**Es un PLAN de operaciones: lleva «Hipótesis».**\n' : '**Es una ORDEN de operaciones: NO lleva «Hipótesis» (eso es solo del Plan).**\n') +
      '**Qué entrena el ejercicio:** ' + F.nom + ' — ' + F.pide + '\n'
    if (entrena(d, F)) t += '**⚠️ ESTE DOCUMENTO ES DEL CAMPO QUE SE ENTRENA (' + F.nom + '):** escribilo COMPLETO y DETALLADO en todo lo que el escalón superior sabe y le da a la unidad de los alumnos (cifras, instalaciones, capacidades, plazos, prioridades): es la BASE con la que el alumno hace su apreciación y su propio anexo. Pero NO le resuelvas lo que tiene que producir él: ' + F.deja + '.\n'
    t += '**Los documentos de esta OGO:** ' + lista.map(function (x) { return (x.principal ? tituloOrden(est) : (x.apendiceDe ? 'Apéndice “' + L[x.id] + '” ' : 'Anexo “' + L[x.id] + '” ') + x.asunto.split(' / ')[0]) + ((est.docs || {})[x.id] && una(est.docs[x.id].texto) ? ' (✓ escrito)' : '') }).join(' · ') + '\n\n'
    return t
  }
  // Lo que la Mesa ya sabe del membrete y que la IA tiene que respetar en TODOS los documentos.
  function membreteParaPedido(est) {
    var c = est.config || {}, t = ''
    if (MESA && MESA.nivelDe(c.unidad) === 'fftt') t += '**Escalón superior de las ' + una(c.unidad) + ':** CTO (Comando del Teatro de Operaciones). Es el ÚNICO escalón superior de las FF.TT.T.O.: no nombres otro (ni «Comando en Jefe», ni «Ejército»).\n'
    else if (una(c.superior)) t += '**Escalón superior de quien expide:** ' + una(c.superior) + '.\n'
    if (una(c.lugar)) t += '**CG de quien expide:** ' + una(c.lugar) + ' (la población más cercana a su PC en la carta). Los PC, CG e instalaciones se NOMBRAN POR LA POBLACIÓN MÁS CERCANA (lista de poblaciones más abajo).\n'
    t += una(c.fechaHora)
      ? '**Fecha y hora de la OGO:** ' + una(c.fechaHora) + '. Es la MISMA en todos los documentos (y todo lo demás —fases, plazos, OPCON— se cuenta coherente con ella).\n'
      : '**Fecha y hora de la OGO:** todavía no está fijada. Fijala vos (la OGO se expide con tiempo para que los alumnos planifiquen: regla de 1/3 – 2/3 sobre el tiempo hasta el día D) y escribila en la PRIMERA línea de tu respuesta, así: «FECHA Y HORA: D-60 (0800)». Va al membrete de todos los documentos.\n'
    return t
  }
  function comoContestar(d, est) {
    var pre = d.preliminares.map(function (p) { return p + ':' }).join(', ')
    var t = '### Cómo contestar (la Mesa lo pasa al Word con el formato militar de la Escuela)\n' +
      '- NO escribas el membrete, la clasificación, el título, la firma, la autenticación ni la distribución: los pone la Mesa.\n' +
      '- Empezá con los campos del encabezado, cada uno en su propia línea: ' + pre + ' (por ej. «OBJETO: Operaciones defensivas de la …»).\n'
    if (d.principal) t += '- ANEXOS: en su línea y debajo, uno por línea, EXACTAMENTE estos:\n' + listaAnexos(est).split('\n').map(function (l) { return '    ' + l }).join('\n') + '\n'
    else if (listaAnexos(est, d.id)) t += '- APÉNDICES: en su línea y debajo, uno por línea:\n    ' + listaAnexos(est, d.id) + '\n'
    else if (d.preliminares.some(function (p) { return /^AP/.test(p) })) t += '- Sin apéndices: «APÉNDICES: S/A.» (así, no «Sin novedad.»).\n'
    if (d.organizacion === 'cuadro') t += '- ORGANIZACIÓN DE LA TAREA: en su línea y debajo UNA LÍNEA POR AGRUPACIÓN o unidad que depende directamente, así: «NOMBRE DE LA AGRUPACIÓN: unidad; unidad; unidad» (la Mesa arma el cuadro). Usá la organización de la tarea de la Mesa si ya está armada.\n'
    else if (d.organizacion === 'lista') t += '- Organización de la Tarea: en su línea y debajo una línea por elemento: «ELEMENTO: lo que tiene».\n'
    t += d.id === 'calco'
      ? '- Después «REFERENCIAS DEL CALCO» en su línea y debajo una línea por elemento, con guion («- LÍMITES: …»). OJO: el Anexo es un GRÁFICO que la Mesa dibuja con lo trazado en la carta (el Área de Operaciones, los límites, las fichas, las dos cruces de amarre): las referencias NO van al Word; sirven para controlar que todo lo que nombra la Orden esté dibujado, con las MISMAS coordenadas.\n'
      : '- Después, cada apartado del modelo EN SU PROPIA LÍNEA, con su numeración militar y su título, y el texto debajo:\n    I.- SITUACIÓN.\n    A.- Fuerzas enemigas.\n    1.- …\n    a.- …    1) …    a) …\n  Sin «#» ni negritas en los títulos. Cuadros en Markdown (| col | col |). Listas con «- ».\n'
    t += '- Al final, «## PARA EL PROFESOR» (no va al Word ni a los alumnos): los datos que inventaste (los «(supuesto)»), qué dejaste para que lo resuelva el alumno y qué conviene que el profesor revise antes de entregar.\n' +
      '- Si no te entra en una respuesta, cortá al final de un apartado y escribí «SIGUE: <apartado>»; te piden el resto.\n\n'
    return t
  }
  function reglas(d, ctx) {
    var est = ctx.ogo
    var r = [
      'NINGÚN apartado vacío ni con «……», «[completar]», «XXX», «Lugar, fecha y hora». Si un apartado no aplica, escribí «Sin novedad.» o «No aplica en esta operación.» y por qué.',
      'Datos de ESTE ejercicio: las designaciones de las fichas de la carta y de la organización de la tarea, los nombres de las avenidas de aproximación, del terreno clave y de las líneas del CMOC, coordenadas (lat, lng) o accidentes del terreno con nombre, horas en D/H (D-5, D (0500), H+2). Si falta un dato, inventalo verosímil para ESTE terreno y ESTE escalón y marcalo «(supuesto)».',
      'Si hay BIBLIOTECA DEL PROFESOR (COE, organizaciones de AZUL y de ROJO, de las FF.TT., de los Cuerpos, armamento): usá ESAS unidades con sus designaciones, efectivos, armamento y vehículos, ADECUADAS a este ejercicio; no inventes otras.',
      'Coherente con LO YA ESCRITO de esta OGO (más abajo): la misma misión, la misma intención, las mismas fases con sus mismas fechas, los mismos nombres, las mismas unidades y las mismas letras de anexos. Un anexo amplía la Orden: no la contradice ni la repite.',
      'Escalón coherente: el ' + ctx.escalon.profesor + ' escribe; las unidades subordinadas reciben tareas de su nivel (y sus subordinadas, dos escalones abajo); el enemigo se describe en términos de dos escalones por debajo.',
      'Español militar, impersonal, sin voseo; los nombres de líneas, objetivos y avenidas en MAYÚSCULAS; abreviaturas reglamentarias.',
      'Las unidades son las de la carta (fichas) y las de la organización de la tarea, con la MISMA designación en todos los documentos. Si hace falta una que no está en la carta (un batallón logístico, una agrupación de artillería…), dale designación, ubicación (lat, lng) DENTRO del Área de Operaciones y la población más cercana, y marcala «(supuesto)»: la Mesa se la ofrece al profesor para colocarla.'
    ]
    if (d.id === 'ogo' || d.id === 'icia') r.push('Si la CARPETA DEL PROFESOR trae el CMOC (paso 4) y los cursos de acción del enemigo (paso 7), el párrafo I.A y el Anexo de Inteligencia toman de ahí el terreno, las avenidas de aproximación y el terreno clave con sus MISMOS nombres, al nivel del escalón superior; si el ejercicio entrena el G-2 o el PMTD completo, NO le des al alumno la calificación de las avenidas, el terreno decisivo de SU nivel ni cuál es el curso de acción más probable: eso lo produce él.')
    return '### Reglas para que la orden no tenga observaciones\n' + r.map(function (x, i) { return (i + 1) + '. ' + x }).join('\n') + '\n\n'
  }
  // Las poblaciones del Área de Operaciones (capa «Centros poblados» de los calcos) y la más cercana a
  // cada ficha propia: con ellas se nombran los PC, los CG y las instalaciones.
  function poblacionesParaPedido(ej) {
    if (!MESA || !ej) return ''
    var pobs = MESA.poblacionesParaPedido(ej, 60), todas = MESA.poblaciones(ej)
    if (!pobs.length) return ''
    var f4 = function (x) { return String(Math.round(x * 1e4) / 1e4) }
    var propias = (ej.unidades || []).filter(function (u) { return u && isFinite(+u.lat) && u.lat != null && !/enem|rojo/i.test(u.bando || '') })
    var cerca = propias.map(function (u) { var c = MESA.masCercana(todas, u.lat, u.lng); return c ? '- ' + una(u.designacion || u.nombre) + (u.tipo === 'pc' ? ' (PC)' : '') + ' → ' + c.nombre + (c.tipo ? ' (' + c.tipo + ')' : '') + ', a ' + c.km.toFixed(1).replace('.', ',') + ' km' : '' }).filter(Boolean)
    return '### Poblaciones (para nombrar PC, CG e instalaciones: la población más cercana)\n' +
      (cerca.length ? 'La más cercana a cada ficha propia de la carta:\n' + cerca.slice(0, 60).join('\n') + '\n\n' : '') +
      'Poblaciones dentro del Área de Operaciones (nombre · tipo · lat, lng · habitantes):\n' + pobs.map(function (p) { return '- ' + p.nombre + (p.tipo ? ' · ' + p.tipo : '') + ' · ' + f4(p.lat) + ', ' + f4(p.lng) + (p.poblacion ? ' · ' + p.poblacion + ' hab.' : '') }).join('\n') + '\n\n'
  }
  // ctx: { escalon, foco, ogo (estado), ejercicio, unidades, centro, biblioteca, carpeta, fuente }
  function pedido(id, ctx) {
    var d = doc(id)
    if (!d) throw new Error('No hay documento «' + id + '».')
    ctx = Object.assign({}, ctx)
    ctx.escalon = ctx.escalon || { profesor: 'Comandante del escalón superior', alumnos: 'Comandantes del escalón subordinado' }
    ctx.foco = ctx.foco || { id: 'pmtd', nom: 'PMTD completo', pide: '', deja: '', secs: [] }
    ctx.ogo = ctx.ogo || vacio('')
    ctx.paso = 0
    var ya = yaEscrito(id, ctx.ogo), org = resumenOrgTarea(ctx.ejercicio)
    return cabecera(id, ctx) +
      '## LA TAREA: ' + titulo(id, ctx.ogo) + '\n\n' +
      'Escribí ' + (d.principal ? 'el CUERPO de la ' + tituloOrden(ctx.ogo) : 'el ' + titulo(id, ctx.ogo)) + ' siguiendo EL MODELO DE LA ESCUELA de abajo: TODOS sus apartados, en ese orden, con esa numeración, cada uno con el contenido que pide.\n\n' +
      '### El modelo de la Escuela (' + d.fuente + ')\n```\n' + d.modelo + '\n```\n' +
      'Lo que va después de «—» explica qué tiene que decir cada apartado: escribí el CONTENIDO, no copies la explicación. Los «Ej.:» son ejemplos de redacción de la Escuela: redactá así, con los datos de ESTE ejercicio.\n\n' +
      reglas(d, ctx) + comoContestar(d, ctx.ogo) +
      '### LO YA ESCRITO DE ESTA OGO\n' + (ya || '(Todavía nada: ' + (d.principal ? 'este es el primer documento; los anexos se escriben después, sobre esta Orden).' : 'conviene escribir primero el cuerpo de la Orden, así cada anexo la sigue).')) + '\n\n' +
      (org ? '### La organización de la tarea armada en la Mesa (C.A. por fases / Mesa EM)\n' + org + '\n\n' : '') +
      poblacionesParaPedido(ctx.ejercicio) +
      '---\n\n# CONTEXTO DEL EJERCICIO (lo que ya hay en la Mesa)\n\n' + (IA ? IA.contexto(ctx) : '') + '\n\n---\n' +
      'RECORDATORIO: escribí SOLO ' + (d.principal ? 'el cuerpo de la ' + tituloOrden(ctx.ogo) : 'el ' + titulo(id, ctx.ogo)) + ', COMPLETO, sobre el modelo de la Escuela, sin membrete ni firma, empezando por ' + d.preliminares[0] + ':, para un ' + ctx.escalon.profesor + ' cuyos alumnos son ' + ctx.escalon.alumnos + '; el ejercicio entrena ' + ctx.foco.nom + '.\n'
  }

  // ─── Leer lo que contestó la IA ─────────────────────────────────────────────────────
  var ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  var ABREV = /(?:^|\s)(?:\d+(?:ra|da|ro|do|er|to|vo|mo|no)|Secc|Sec|Comp|Cía|Cia|Div|Br|Brig|Reg|Regt|Cnl|Tcnl|My|Cap|Gral|No|N°|Nro|Coord|Coords|aprox|Esc|Ecia|AT|AA\.TT|LF|LP|PC|CE|ZR|AO|AI|Ing|Inf|Mec|Motz|Art|Bat|Bn|Gpo|Agr|Dpto|Prov|Sr|Lic|Ej|Op|Ops|Icia|Log|Pers|Com|Cmdo|Cmte|Fza|Uds?|UU|PP|GG|CC|SS|EE|kms?|mts?|hs|min|aprox|etc|Fig|pág|Pag)\.$/i
  function sinMarcas(s) { return String(s).replace(/\*\*|__|`/g, '').replace(/^\s*>\s?/, '').trim() }
  // Un título: «I.- SITUACIÓN.», «A.- Fuerzas enemigas. Texto…», «1) …», «## II.- MISIÓN», «**a.- …**»
  function leerTitulo(linea) {
    var l = sinMarcas(String(linea).replace(/^\s*#{1,6}\s*/, ''))
    var m = /^((?:X{0,1})(?:IX|IV|V?I{0,3})|[A-Za-z]|\d{1,2})\s*(\.\s*[-–—]|\.|[-–—]|\))\s+(\S.*)$/.exec(l)
    if (!m || !m[1]) return null
    var tok = m[1], sep = m[2], resto = m[3], nivel
    var caps = resto.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, ''), mayus = caps && caps === caps.toUpperCase()
    if (sep === ')') nivel = /^\d+$/.test(tok) ? 5 : /^[a-z]$/.test(tok) ? 6 : 0
    else if (/^\d+$/.test(tok)) nivel = 3
    else if (/^[a-z]$/.test(tok)) nivel = 4
    else if (ROMANOS.indexOf(tok) >= 0 && (tok.length > 1 || mayus)) nivel = 1
    else if (/^[A-Z]$/.test(tok)) nivel = 2
    else nivel = 0
    if (!nivel) return null
    // «A.- Fuerzas enemigas. El enemigo…»: título hasta el primer punto (o dos puntos) que no sea de abreviatura
    var titulo_ = resto, texto = ''
    var re = /[.:](?=\s+\S)/g, x
    while ((x = re.exec(resto))) {
      var antes = resto.slice(0, x.index + 1), ult = (antes.slice(0, -1).split(/\s+/).pop() || ''), sig = resto.slice(x.index + 1).trim().split(/\s+/)[0] || ''
      // «C.E. 1», «Br. Art.», «FF.TT. …», «AT. «LANZA»»: el punto de una abreviatura no cierra el
      // título; el de «Operaciones QBN. Sin amenaza…» sí
      var abrev = antes.charAt(antes.length - 1) === '.' && (/\.[A-Za-zÁÉÍÓÚÑ]/.test(ult) || /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{0,2}$/.test(ult) ||
        (/^[A-ZÁÉÍÓÚÑ]{1,3}$/.test(ult) && ROMANOS.indexOf(ult) < 0 && /^([«“"'(]|[A-ZÁÉÍÓÚÑ0-9\-]{2,}[.,;:]?$)/.test(sig)))
      if (ABREV.test(antes) || abrev) continue
      if (antes.split(/\s+/).length > 14) break
      titulo_ = antes; texto = resto.slice(x.index + 1).trim(); break
    }
    if (!texto && titulo_.length > 160) { texto = titulo_; titulo_ = '' }
    return { nivel: nivel, titulo: titulo_.trim(), texto: texto }
  }
  var RE_SINNUM = /^(intenci[oó]n(?: del comandante)?|referencias del calco)\s*[.:]?\s*(.*)$/i
  var RE_PRE = /^(OBJETO|CARTAS?|ANEXOS?|AP[EÉ]NDICES?|AGREGADOS?)\s*:\s*(.*)$/i
  var RE_ORG = /^ORGANIZACI[OÓ]N\s+DE\s+LA\s+TAREA\b\s*[:.]?\s*(.*)$/i
  // «FECHA Y HORA: D-60 (0800)»: la fecha de la OGO que fija la IA (va al membrete, no al cuerpo)
  var RE_FECHA = /^FECHA\s+Y\s+HORA(?:\s+DE\s+(?:EXPEDICI[OÓ]N|LA\s+(?:ORDEN|OGO)))?\s*:\s*(\S.*)$/i
  // la firma (en MAYÚSCULAS y sola en su línea), la autenticación y la distribución: ahí termina el cuerpo
  var RE_FIN = /^(EL COMANDANTE(?:\s+[A-ZÁÉÍÓÚÑ0-9.\-–«»“”"'\s]+)?$|Autenticaci[oó]n\s*:|AUTENTICACI[OÓ]N\b|Distribuci[oó]n\s*:|\(CLASIFICACI[OÓ]N DE SEGURIDAD\)$)/
  var RE_BASURA = /^(\(?CLASIFICACI[OÓ]N DE SEGURIDAD\)?|SECRETO|RESERVADO|CONFIDENCIAL|DESTINO\s*:.*|-{3,}|_{3,}|\*{3,})$/i
  function celdas(l) { return l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function (c) { return sinMarcas(c.trim()) }) }
  function esSeparadorTabla(l) { return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) }

  // → { preliminares: [{rotulo, texto}], organizacion: [{nombre, elementos}], secciones: [nodos], sigue, fechaHora }
  function estructura(texto) {
    var lineas = productoCrudo(texto).split('\n'), pre = [], org = [], raiz = { nivel: 0, hijos: [], bloques: [] }, pila = [raiz]
    var modo = 'pre', prelim = null, tabla = null, sigue = false, parrafo = [], fechaHora = ''
    var actual = function () { return pila[pila.length - 1] }
    var cerrarParrafo = function () { if (parrafo.length) { actual().bloques.push({ texto: parrafo.join(' ') }); parrafo = [] } }
    var cerrarTabla = function () {
      if (!tabla) return
      var filas = tabla.filter(function (f) { return !f.sep }).map(function (f) { return f.c })
      var cab = tabla.length > 1 && tabla[1].sep ? filas.shift() : null
      if (modo === 'org') filas.forEach(function (f) { if (f[0] && !/^(agrupaci|unidad|elemento|nombre)/i.test(f[0])) org.push({ nombre: f[0], elementos: f.slice(1).join('; ').split(/\s*;\s*|\s*,\s*/).filter(Boolean) }) })
      else actual().bloques.push({ tabla: { cabecera: cab || [], filas: filas } })
      tabla = null
    }
    for (var i = 0; i < lineas.length; i++) {
      var crudo = lineas[i], l = crudo.trim()
      if (/^\s*\|/.test(crudo)) { cerrarParrafo(); if (!tabla) tabla = []; tabla.push(esSeparadorTabla(crudo) ? { sep: true } : { c: celdas(crudo) }); continue }
      cerrarTabla()
      if (!l) { cerrarParrafo(); if (prelim && una(prelim.texto)) prelim = null; continue }
      if (/^SIGUE\s*:/i.test(sinMarcas(l))) { sigue = true; continue }
      var lm = sinMarcas(l.replace(/^#{1,6}\s*/, ''))
      if (RE_FIN.test(lm) && modo === 'cuerpo') break
      if (RE_BASURA.test(lm)) continue
      var fh = modo !== 'cuerpo' && RE_FECHA.exec(lm)
      if (fh) { cerrarParrafo(); fechaHora = una(fh[1]).replace(/[.]$/, ''); prelim = null; continue }
      var p = RE_PRE.exec(lm)
      if (p && modo !== 'cuerpo') { cerrarParrafo(); var r = p[1].toUpperCase().replace('Á', 'A'); prelim = { rotulo: /^CARTA/.test(r) ? 'CARTA' : /^ANEXO/.test(r) ? 'ANEXOS' : /^AP/.test(r) ? 'APÉNDICES' : /^AGREG/.test(r) ? 'AGREGADOS' : 'OBJETO', texto: sinMarcas(p[2]) }; pre.push(prelim); modo = 'pre'; continue }
      var o = RE_ORG.exec(lm)
      if (o && modo !== 'cuerpo') { cerrarParrafo(); modo = 'org'; prelim = null; if (o[1]) org.push({ nombre: o[1], elementos: [] }); continue }
      var sn = RE_SINNUM.exec(lm)
      var t = sn ? null : leerTitulo(l)
      if (sn || t) {
        cerrarParrafo(); modo = 'cuerpo'; prelim = null
        var nivel = sn ? (/^ref/i.test(sn[1]) ? 1 : 2) : t.nivel
        while (pila.length > 1 && actual().nivel >= nivel) pila.pop()
        var nodo = { nivel: nivel, titulo: sn ? sn[1].charAt(0).toUpperCase() + sn[1].slice(1) + (/^ref/i.test(sn[1]) ? '' : '.') : t.titulo, sinRotulo: !!sn, hijos: [], bloques: [] }
        if (sn && /^ref/i.test(sn[1])) nodo.titulo = 'REFERENCIAS DEL CALCO'
        actual().hijos.push(nodo); pila.push(nodo)
        var tx = sn ? sn[2] : t.texto
        if (una(tx)) parrafo.push(sinMarcas(tx))
        continue
      }
      var v = /^\s*(?:[-•–]|\*(?!\*))\s+(.+)$/.exec(crudo)
      if (modo === 'pre') { if (prelim) prelim.texto += (prelim.texto ? '\n' : '') + sinMarcas(v ? v[1] : l); continue }
      if (modo === 'org') {
        var e = sinMarcas(v ? v[1] : l), dp = /^([^:]{2,80}):\s*(.*)$/.exec(e)
        if (dp) org.push({ nombre: dp[1].trim(), elementos: dp[2] ? dp[2].split(/\s*;\s*/).filter(Boolean) : [] })
        else if (org.length) org[org.length - 1].elementos.push(e)
        else org.push({ nombre: e, elementos: [] })
        continue
      }
      if (v) { cerrarParrafo(); var b = actual().bloques, u = b[b.length - 1]; if (u && u.vinetas) u.vinetas.push(sinMarcas(v[1])); else b.push({ vinetas: [sinMarcas(v[1])] }); continue }
      parrafo.push(sinMarcas(l))
    }
    cerrarParrafo(); cerrarTabla()
    // bloques → la forma de word.js: el texto y las viñetas del principio en el nodo; lo que
    // viene después (cuadros, texto después de un cuadro) como nodos sin título, antes de los hijos.
    var convertir = function (n) {
      var out = { titulo: n.titulo, hijos: [] }
      if (n.sinRotulo) out.sinRotulo = true
      // «2.- PC principal en PATACAMAYA; PC alterno en SICA SICA.»: una oración numerada sin nada
      // debajo es un INCISO (numerado, sin negrita), no un título vacío
      if (n.titulo && !n.sinRotulo && !n.bloques.length && !n.hijos.length && n.titulo.split(/\s+/).length >= 4) out.item = true
      var b = n.bloques.slice(), textos = []
      while (b.length && b[0].texto != null) textos.push(b.shift().texto)
      if (textos.length) out.texto = textos.join('\n')
      if (b.length && b[0].vinetas) out.vinetas = b.shift().vinetas
      var sueltos = b.map(function (x) { return x.texto != null ? { texto: x.texto } : x.vinetas ? { vinetas: x.vinetas } : { tabla: x.tabla } })
      out.hijos = sueltos.concat(n.hijos.map(convertir))
      return out
    }
    var secciones = raiz.hijos.map(convertir)
    var sueltoRaiz = convertir({ titulo: undefined, bloques: raiz.bloques, hijos: [] })
    if (sueltoRaiz.texto || sueltoRaiz.vinetas || sueltoRaiz.hijos.length) secciones = [{ texto: sueltoRaiz.texto, vinetas: sueltoRaiz.vinetas, hijos: sueltoRaiz.hijos }].concat(secciones)
    return { preliminares: pre, organizacion: org.filter(function (x) { return una(x.nombre) }), secciones: secciones, sigue: sigue, fechaHora: fechaHora }
  }
  function titulos(secciones, acc) { acc = acc || []; (secciones || []).forEach(function (n) { if (n.titulo) acc.push(n); titulos(n.hijos, acc) }); return acc }
  function tieneContenido(n) { return !!(una(n.texto) || (n.vinetas && n.vinetas.length) || n.tabla || (n.hijos || []).length) }
  function normTitulo(t) { return norm(t).replace(/^[\s.:;,\-–—]+|[\s.:;,\-–—]+$/g, '') }

  // ─── Revisar que no falte nada ──────────────────────────────────────────────────────
  var RE_MARCA = /…|\.{4,}|_{4,}|\[[^\]]*(completar|pendiente|insertar|nombre|coordenada|unidad|fecha|hora|lugar|xx)[^\]]*\]|\bX{3,}\b|\bxx+-xx+\b|lugar,? fecha y hora|\(a completar\)|\bpor definir\b/i
  function revisar(id, texto, op) {
    op = op || {}
    var d = doc(id), est = op.ogo || vacio(''), t = producto(texto)
    if (!una(t)) return { ok: false, vacio: true, faltan: [], faltanTexto: [], vacios: [], marcadores: [], supuestos: 0, avisos: ['Todavía no pegaste lo que contestó la IA.'] }
    var e = estructura(t), ts = titulos(e.secciones), nt = ts.map(function (n) { return normTitulo(n.titulo) }), todo = norm(t)
    var hay = function (re) { var R = new RegExp('^(?:' + re + ')'); return nt.some(function (x) { return R.test(x) }) }
    var obl = (d.obligatorios || []).concat(esPlan(est) ? d.soloPlan || [] : [])
    // la organización de la tarea no es un párrafo numerado: alcanza con que esté
    var faltan = obl.filter(function (o) { return o[1] === 'organizacion de la tarea' ? !(e.organizacion.length || /organizacion de la tarea/.test(todo)) : !hay(o[1]) }).map(function (o) { return o[0] })
    var faltanTexto = (d.enTexto || []).filter(function (o) { return !new RegExp(o[1]).test(todo) }).map(function (o) { return o[0] })
    // vacío: un título sin nada debajo (un inciso que es una oración no cuenta, salvo que sea un apartado del modelo)
    var delModelo = function (x) { return obl.some(function (o) { return o[1] !== 'organizacion de la tarea' && new RegExp('^(?:' + o[1] + ')').test(x) }) }
    var vacios = ts.filter(function (n) { return !tieneContenido(n) && (!n.item || delModelo(normTitulo(n.titulo))) }).map(function (n) { return n.titulo })
    var marcadores = t.split('\n').filter(function (l) { return RE_MARCA.test(l) }).map(una).slice(0, 10)
    var supuestos = (t.match(/\(supuesto\)/gi) || []).length
    var avisos = []
    var preR = e.preliminares.map(function (p) { return p.rotulo })
    d.preliminares.forEach(function (p) { var k = /^CARTA/.test(p) ? 'CARTA' : /^ANEXO/.test(p) ? 'ANEXOS' : /^AP/.test(p) ? 'APÉNDICES' : /^AGREG/.test(p) ? 'AGREGADOS' : 'OBJETO'; if ((k === 'OBJETO' || k === 'CARTA') && preR.indexOf(k) < 0) avisos.push('Falta «' + k + ':» al principio' + (k === 'CARTA' && una(est.config.carta) ? ' (la Mesa pone la de «Datos de la Orden»: ' + una(est.config.carta) + ')' : '') + '.') })
    if (d.principal) {
      var anexosTxt = ((e.preliminares.filter(function (p) { return p.rotulo === 'ANEXOS' })[0] || {}).texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[“”«»"']/g, '')
      var L = letras(est)
      elegidos(est).filter(function (x) { return !x.principal && !x.apendiceDe }).forEach(function (x) {
        var l = L[x.id].toLowerCase()
        if (!new RegExp('(^|\\n)[\\s\\-*]*(anexo\\s+)?' + l + '\\b|\\banexo\\s+' + l + '\\b').test(anexosTxt)) avisos.push('En «ANEXOS:» falta el Anexo “' + L[x.id] + '” ' + x.asunto.split(' / ')[0] + ' (la Mesa lo agrega al Word, pero la Orden tiene que nombrarlo donde corresponda).')
      })
      var mis = ts.filter(function (n) { return /^mision$/.test(normTitulo(n.titulo)) })[0]
      var tm = norm(mis ? [mis.texto].concat((mis.hijos || []).map(function (h) { return h.texto })).join(' ') : '')
      if (mis && tm && !/(proposito|a fin de|para (que|poder|impedir|permitir|posibilitar|destruir|detener|garantizar|mantener|asegurar|evitar|proteger|conservar|recuperar|crear|obligar|desgastar|retardar|canalizar)|con el objeto)/.test(tm)) avisos.push('La MISIÓN no dice el PARA QUÉ (el propósito): «…, con el propósito de …».')
      if (mis && tm && !/\b(d|h)\s*[-+]?\s*\d|\bdia d\b|\bd \(|\d{6}|a partir del|desde el/.test(tm)) avisos.push('La MISIÓN no dice el CUÁNDO (D/H o grupo fecha-hora).')
      if (una(est.config.alumnos)) {
        var al = norm(est.config.alumnos).replace(/[.\-\s]+/g, '')
        var tum = ts.filter(function (n) { return /^tareas (de|a) las unidades de maniobra/.test(normTitulo(n.titulo)) })[0]
        var dentro = function (n) { return norm([n.titulo, n.texto].concat((n.vinetas || [])).join(' ')) + ' ' + (n.hijos || []).map(dentro).join(' ') }
        if (tum && al && dentro(tum).replace(/[.\-\s]+/g, '').indexOf(al) < 0) avisos.push('En «Tareas de las unidades de maniobra» no aparece la unidad de los alumnos (' + una(est.config.alumnos) + ') por su nombre.')
      }
    }
    if (!esPlan(est) && nt.some(function (x) { return /^hipotesis/.test(x) })) avisos.push('Es una ORDEN: el apartado «Hipótesis» va solo en el PLAN de operaciones. Sacalo o cambiá a «Plan» en «Datos de la Orden».')
    if (e.sigue) avisos.push('La respuesta está CORTADA (dice «SIGUE: …»): pedile a la IA el resto y pegalo debajo, en el mismo cuadro.')
    if (d.organizacion === 'cuadro' && !e.organizacion.some(function (x) { return x.elementos.length })) avisos.push('La ORGANIZACIÓN DE LA TAREA no vino en líneas «AGRUPACIÓN: unidad; unidad»: el Word la pone como texto, sin el cuadro.')
    if (supuestos) avisos.push(supuestos + ' dato(s) marcado(s) «(supuesto)»: confirmalos o corregilos antes de entregar.')
    return { ok: !faltan.length && !faltanTexto.length && !vacios.length && !marcadores.length && !avisos.filter(function (a) { return !/supuesto/.test(a) }).length, faltan: faltan, faltanTexto: faltanTexto, vacios: vacios, marcadores: marcadores, supuestos: supuestos, avisos: avisos, apartados: ts.length }
  }
  // La OGO entera: cada documento elegido, los datos del membrete y lo que falta dibujar en la Mesa.
  // El Anexo A es el GRÁFICO de la Mesa: sin texto de la IA, está listo si la carta tiene el Área de
  // Operaciones y fichas propias (el OBJETO y la CARTA los pone la Mesa).
  function calcoDeLaMesa(ej) {
    var ops = (ej && ej.ops) || {}
    return !!(ops.areaOps || (ops.areasOps || []).length) && ((ej && ej.unidades) || []).some(function (u) { return u && !/enem|rojo/i.test(u.bando || '') })
  }
  function revisarTodo(est, op) {
    op = op || {}
    var c = est.config || {}, docs = {}, generales = [], listos = 0, lista = elegidos(est), grafico = calcoDeLaMesa(op.ejercicio)
    lista.forEach(function (d) {
      var x = est.docs && est.docs[d.id]; docs[d.id] = x && una(x.texto) ? revisar(d.id, x.texto, { ogo: est }) : null
      if ((docs[d.id] && docs[d.id].ok) || (d.id === 'calco' && !docs[d.id] && grafico)) listos++
    })
    var faltaDato = [['numero', 'el N° de la Orden'], ['unidad', 'la unidad que expide (la tuya)'], ['superior', 'el escalón superior de tu unidad (va arriba del membrete)'], ['alumnos', 'la unidad de los alumnos'], ['lugar', 'el CG / lugar del puesto comando'], ['fechaHora', 'la fecha y hora (grupo fecha-hora o D/H)'], ['carta', 'la carta']].filter(function (k) { return !una(c[k[0]]) }).map(function (k) { return k[1] })
    if (faltaDato.length) generales.push('En «Datos de la Orden y del membrete» falta: ' + faltaDato.join(', ') + '.')
    var ej = op.ejercicio || {}, ops = ej.ops || {}, us = (ej.unidades || []).filter(function (u) { return u && (u.tipo || 'unidad') === 'unidad' })
    if (op.ejercicio) {
      if (!ops.areaOps) generales.push('En la carta no hay ÁREA DE OPERACIONES trazada (▧ ÁREA DE OPS): el calco de operaciones la necesita.')
      if (!(ops.limites || []).length) generales.push('En la carta no hay LÍMITES ni líneas trazadas (⚫ MEDIDAS): el Calco de Operaciones (Anexo “' + (letras(est).calco || 'A') + '”) los lleva.')
      if (!us.some(function (u) { return u.bando !== 'enemigo' && u.bando !== 'enemigas' })) generales.push('En la carta no hay fichas PROPIAS: la Organización de la Tarea y el calco las necesitan (🪖 UNIDADES).')
      if (!us.some(function (u) { return u.bando === 'enemigo' || u.bando === 'enemigas' })) generales.push('En la carta no hay fichas ENEMIGAS: el párrafo I.A y el Anexo de Inteligencia las necesitan.')
    }
    lista.forEach(function (d) { if (!docs[d.id] && !(d.id === 'calco' && grafico)) generales.push('Falta escribir: ' + corto(d.id, est) + '.') })
    return { docs: docs, generales: generales, listos: listos, total: lista.length, ok: listos === lista.length && !generales.length }
  }
  function pedidoCorregir(id, rev, ctx) {
    var d = doc(id), est = ctx.ogo || vacio(''), x = est.docs && est.docs[id]
    var p = []
    if (rev.faltan.length) p.push('FALTAN estos apartados del modelo: ' + rev.faltan.join(' · ') + '.')
    if (rev.faltanTexto.length) p.push('No dice: ' + rev.faltanTexto.join(' · ') + '.')
    if (rev.vacios.length) p.push('Estos apartados quedaron VACÍOS (solo el título): ' + rev.vacios.join(' · ') + '.')
    if (rev.marcadores.length) p.push('Quedaron MARCAS SIN LLENAR («……», «[completar]», «XXX»…) en: ' + rev.marcadores.map(function (m) { return '«' + m.slice(0, 90) + '»' }).join(' · ') + '.')
    rev.avisos.forEach(function (a) { p.push(a) })
    return '# PEDIDO DE CORRECCIÓN PARA LA IA — LEÉ ESTO PRIMERO\n\n' +
      'Revisé el **' + titulo(id, est) + '** que me diste para un ejercicio de escuela (escribe el ' + (ctx.escalon || {}).profesor + '; lo reciben ' + (ctx.escalon || {}).alumnos + ') contra el modelo de la Escuela y tiene observaciones:\n\n' + p.map(function (x, i) { return (i + 1) + '. ' + x }).join('\n') + '\n\n' +
      '**Devolvé el documento COMPLETO y corregido** (todo, no solo lo que falta), con el mismo formato: empezando por ' + d.preliminares[0] + ':, sin membrete ni firma, cada apartado en su línea con su numeración militar, y «## PARA EL PROFESOR» al final. Lo que no tengas, inventalo verosímil para este ejercicio y marcalo «(supuesto)».\n\n' +
      '### El modelo de la Escuela (' + d.fuente + ')\n```\n' + d.modelo + '\n```\n\n' +
      '### Lo que me diste\n' + recorta(producto(x ? x.texto : ''), 40000) + '\n\n' +
      (id !== 'ogo' && est.docs && est.docs.ogo && una(est.docs.ogo.texto) ? '### La Orden ya escrita (manda: no la contradigas)\n' + recorta(producto(est.docs.ogo.texto), 20000) + '\n\n' : '') +
      '---\nRECORDATORIO: el ' + titulo(id, est) + ' COMPLETO y corregido, sobre el modelo de la Escuela.\n'
  }

  // ─── Al formato militar de la Mesa (word.js · crearWord) ────────────────────────────
  // Sin apéndices: «APÉNDICES : S/A.» (como en los modelos de la Escuela; no «Sin novedad.» ni «Sin.»).
  var RE_SIN = /^(sin\b.*|ningun[oa]s?|no (tiene|hay|lleva|aplica)\b.*|n\/?a|s\/?a|-+|—)\.?$/i
  function deLas(unidad) { var u = MESA ? MESA.sinDesarrollo(unidad) : una(unidad); return !u ? '' : /^(FF\.?\s?TT|FUERZAS)/i.test(u) ? ' de las ' + u : /^(R|B|C\.?E|CUERPO|COMANDO|CMDO|GRUPO|G\.?A|REGIMIENTO|BATALL|[IVX]+\s*C\.?\s?E)/i.test(u) ? ' del ' + u : ' de la ' + u }
  // op.imagen: el gráfico del calco (ogo-calco.js → PNG); el Anexo A es ESE gráfico, no texto (Sergio, 11-10-2026).
  function aSpec(id, texto, est, op) {
    op = op || {}
    var d = doc(id), e = estructura(texto), pre = []
    d.preliminares.forEach(function (rot) {
      var k = /^CARTA/.test(rot) ? 'CARTA' : /^ANEXO/.test(rot) ? 'ANEXOS' : /^AP/.test(rot) ? 'APÉNDICES' : /^AGREG/.test(rot) ? 'AGREGADOS' : 'OBJETO'
      var hay = e.preliminares.filter(function (p) { return p.rotulo === k })[0], txt = hay ? hay.texto : ''
      if (k === 'CARTA' && !una(txt)) txt = una(est.config.carta) || (id === 'calco' ? 'Cartas Topográficas del Área de Operaciones, Esc. 1:100.000.' : '')
      if (k === 'OBJETO' && !una(txt) && id === 'calco') txt = ('Calco de Operaciones anexo a la ' + tituloOrden(est) + deLas(est.config.unidad)).replace(/\.?$/, '.')
      if (k === 'ANEXOS' && d.principal) txt = listaAnexos(est) // la lista de la OGO es la de los anexos elegidos, con sus letras
      if (k === 'APÉNDICES' && (!una(txt) || RE_SIN.test(una(txt)))) txt = listaAnexos(est, id)
      if ((k === 'APÉNDICES' || k === 'AGREGADOS') && RE_SIN.test(una(txt))) txt = ''
      txt = limpia(txt).split('\n').map(una).filter(Boolean).join('\n') // una línea por anexo
      pre.push({ rotulo: rot, texto: txt || (k === 'APÉNDICES' || k === 'AGREGADOS' ? 'S/A.' : '') })
    })
    var spec = { titulo: titulo(id, est), preliminares: pre, secciones: e.secciones, estructuraPropia: true }
    if (id === 'calco' && op.imagen) { spec.secciones = [{ imagen: op.imagen }]; return spec }
    if (e.organizacion.length) {
      if (d.organizacion === 'cuadro' && e.organizacion.some(function (x) { return x.elementos.length })) spec.organizacion = { titulo: 'ORGANIZACIÓN DE LA TAREA', equipos: e.organizacion.map(function (x) { return { nombre: x.nombre, elementos: x.elementos } }) }
      else spec.secciones = [{ titulo: 'Organización de la Tarea.', sinRotulo: true, vinetas: e.organizacion.map(function (x) { return x.nombre + (x.elementos.length ? ': ' + x.elementos.join('; ') : '') }), hijos: [] }].concat(spec.secciones)
    }
    return spec
  }
  function cfgWord(id, est) {
    var d = doc(id), c = est.config || {}, L = letras(est), lista = elegidos(est)
    var nSec = lista.filter(function (x) { return x.seccion === d.seccion }).indexOf(d) + 1
    var sd = MESA ? MESA.sinDesarrollo : una // sólo la sigla: «FF.TT.T.O.» (Sergio, 11-10-2026)
    var unidad = sd(c.unidad), superior = sd(c.superior) || (MESA ? MESA.superiorDe(unidad) : '')
    // «No. 002/XYZ.»: sin iniciales, XYZ (como el resto de los documentos de la Mesa), con su punto
    var ini = una(c.iniciales).toUpperCase().replace(/\.+$/, '') || 'XYZ', lugar = una(c.lugar)
    var cfg = {
      superior: superior || '[Escalón superior pendiente]', unidad: unidad || '[Unidad pendiente]', lugar: lugar ? lugar.replace(/\.?$/, '.') : '', fechaHora: una(c.fechaHora),
      seccion: d.seccion, expedicion: nSec, iniciales: ini + '.', titulo: esPlan(est) ? 'PLAN DE OPERACIONES' : 'ORDEN DE OPERACIONES', numero: numero(est),
      nivel: d.principal ? 'principal' : d.apendiceDe ? 'apendice' : 'anexo', identificador: d.principal ? '' : L[id], asunto: d.principal ? '' : d.asunto,
      firma: sd(c.firma) || (unidad ? 'EL COMANDANTE ' + (/^(R|B|C\.?E|CUERPO|COMANDO|CMDO|GRUPO|G\.?A|REGIMIENTO|BATALL)/i.test(unidad) ? 'DEL ' : /^(FF\.?\s?TT|FUERZAS)/i.test(unidad) ? 'DE LAS ' : 'DE LA ') + unidad.toUpperCase() : 'EL COMANDANTE'),
      jem: una(c.jem).toUpperCase().replace(/\.+$/, '') || 'XYZ', autenticador: d.autentica, inicialesAut: ini,
      distribucion: limpia(c.distribucion).trim() || 'Original: ' + (superior || 'ARCHIVO') + '\nCopia 1-12: UU. DEP.\nCopia 13: ARCHIVO',
      ensenanza: !!c.ensenanza
    }
    var padre = d.principal ? null : { tituloCompleto: d.apendiceDe ? titulo(d.apendiceDe, est) : tituloOrden(est) }
    return { cfg: cfg, padre: padre }
  }
  function nombreArchivo(id, est, i) {
    var d = doc(id), L = letras(est)
    var base = d.principal ? (esPlan(est) ? 'PLAN' : 'ORDEN') + ' DE OPERACIONES No ' + numero(est) : (d.apendiceDe ? 'Apendice ' + L[id] + ' al Anexo ' + L[d.apendiceDe] : 'Anexo ' + L[id]) + ' - ' + d.asunto.split(' / ')[0]
    return (i != null ? String(i).padStart(2, '0') + ' ' : '') + base.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w .-]+/g, '').replace(/\s+/g, ' ').trim()
  }

  // ─── Guardar, el .md, el ejercicio ──────────────────────────────────────────────────
  // La fecha que la IA escribe en la primera línea («FECHA Y HORA: D-60 (0800)») queda como la de TODA
  // la OGO (est.auto.fechaHora): la de la Orden manda; la de un anexo, sólo si todavía no hay ninguna.
  function poner(est, id, texto, ahora) {
    var n = Object.assign({}, est, { docs: Object.assign({}, est.docs), actualizado: ahora || new Date().toISOString() })
    texto = limpia(texto).trim()
    if (texto) n.docs[id] = { texto: texto, guardado: n.actualizado }
    else delete n.docs[id]
    var fh = texto ? estructura(texto).fechaHora : ''
    if (fh && (id === 'ogo' || !(est.auto && est.auto.fechaHora))) n.auto = Object.assign({}, est.auto, { fechaHora: fh, de: id })
    return n
  }
  function conConfig(est, cambios) { return Object.assign({}, est, { config: Object.assign({}, est.config, cambios), actualizado: new Date().toISOString() }) }
  function markdown(est, meta) {
    meta = meta || {}
    var t = '# 📜 ' + tituloOrden(est) + ' — ' + (est.ejercicio || '(sin ejercicio)') + '\n\n'
    if (meta.escalon) t += '**Escalón:** ' + meta.escalon + (meta.alumnos ? ' · alumnos: ' + meta.alumnos : '') + '  \n'
    if (meta.foco) t += '**El ejercicio entrena:** ' + meta.foco + '  \n'
    t += '**Expide:** ' + (una(est.config.unidad) || '—') + ' · **Reciben:** ' + (una(est.config.alumnos) || '—') + '\n\n'
    var notas = []
    elegidos(est).forEach(function (d) {
      var x = est.docs && est.docs[d.id]
      t += '## ' + titulo(d.id, est) + '\n\n' + (x && una(x.texto) ? producto(x.texto) : '_(Todavía no está escrito.)_') + '\n\n'
      var pp = x && CARP ? CARP.separar(x.texto).profesor : ''
      if (pp) notas.push('### ' + corto(d.id, est) + '\n\n' + pp)
    })
    if (notas.length) t += '---\n\n# 🧑‍🏫 PARA EL PROFESOR (no se entrega a los alumnos)\n\n' + notas.join('\n\n') + '\n'
    var datos = JSON.stringify({ ejercicio: est.ejercicio, config: est.config, docs: est.docs, auto: est.auto, coherencia: est.coherencia, colocadas: est.colocadas, actualizado: est.actualizado }).replace(/--/g, '-\\u002d').replace(/>/g, '\\u003e')
    return t + '\n<!-- ' + MARCA + ' ' + datos + ' -->\n'
  }
  function leerMarkdown(texto) {
    var m = new RegExp('<!--\\s*' + MARCA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*([\\s\\S]*?)\\s*-->').exec(String(texto || ''))
    if (!m) throw new Error('Ese archivo no es una OGO bajada de la Mesa (le falta la marca del final).')
    var d = JSON.parse(m[1]), e = vacio(d.ejercicio)
    e.config = Object.assign(e.config, d.config || {})
    Object.keys(d.docs || {}).forEach(function (k) { if (doc(k) && d.docs[k] && una(d.docs[k].texto)) e.docs[k] = Object.assign({}, d.docs[k], { texto: limpia(d.docs[k].texto), guardado: d.docs[k].guardado || '' }) })
    ;['auto', 'coherencia', 'colocadas'].forEach(function (k) { if (d[k] && typeof d[k] === 'object') e[k] = d[k] })
    e.actualizado = d.actualizado || ''
    return e
  }
  // Para adjuntarlos al ejercicio (los ven los alumnos): sin «PARA EL PROFESOR».
  function paraEjercicio(est) {
    return elegidos(est).filter(function (d) { return est.docs && est.docs[d.id] && una(est.docs[d.id].texto) }).map(function (d) {
      var txt = titulo(d.id, est) + '\n\n' + producto(est.docs[d.id].texto)
      return { nombre: nombreArchivo(d.id, est) + '.md', mime: 'text/plain', tipo: 'texto', texto: txt, base64: null, paginas: 0, categoria: d.id === 'icia' ? 'anexoicia' : 'orden' }
    })
  }

  return {
    DOCS: DOCS, doc: doc, vacio: vacio, completarConfig: completarConfig, seleccionInicial: seleccionInicial, elegidos: elegidos, letras: letras,
    tituloOrden: tituloOrden, titulo: titulo, corto: corto, listaAnexos: listaAnexos, entrena: entrena, pedido: pedido, estructura: estructura,
    revisar: revisar, revisarTodo: revisarTodo, calcoDeLaMesa: calcoDeLaMesa, producto: producto, una: una, pedidoCorregir: pedidoCorregir, aSpec: aSpec, cfgWord: cfgWord, nombreArchivo: nombreArchivo,
    poner: poner, conConfig: conConfig, markdown: markdown, leerMarkdown: leerMarkdown, paraEjercicio: paraEjercicio, leerTitulo: leerTitulo
  }
})
