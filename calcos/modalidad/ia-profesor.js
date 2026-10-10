/* La IA y las fichas del PROFESOR (modalidad Profesor de la Mesa del EM). Código aparte del
   compilado, sin React. Dos cosas, puras (se prueban en Node):
   · armarPedido(paso, ctx): el PEDIDO A LA IA de cada paso del tablero del profesor. El del
     paso «Orden del escalón superior» pide la OGO COMPLETA con todos sus anexos; los demás,
     lo suyo (CMOC, orden de batalla, CAE por fases, situaciones, pauta de corrección…). Todos
     llevan el escalón (quién soy / quiénes son mis alumnos), el FOCO (qué G entrena el
     ejercicio: la IA deja el trabajo ahí y completa lo demás) y el ejercicio recortado.
   · fichasDeOrganizacion(org, opciones) y fichasDeJSON(texto, opciones): las fichas listas
     para `agregarUnidades` de la Mesa (la misma forma que usa academico.js), de una
     organización tipo del catálogo o del bloque ```json que devuelve la IA.
   Lo pidió Sergio (10-10-2026): «en todas las partes debe haber opción a trabajar con IA para
   generar el prompt adecuado… para el profesor debe salir una OGO con todos sus anexos para
   que el alumno planifique… y la opción de ya tengo COE, divisiones de AZUL o Cuerpos de
   Ejército directo para insertar». */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./catalogo.js'))
  else raiz.SIDIAProfesor = fabrica(raiz.SIDModalidadCatalogo)
})(typeof window !== 'undefined' ? window : this, function (CAT) {
  'use strict'

  // Los catálogos de la Mesa (compilado): el id es el que llevan las fichas.
  var ARMAS = ['infanteria', 'mecanizada', 'motorizada', 'andina', 'selva', 'caballeria', 'cabmec', 'artilleria', 'antiaerea', 'ingenieria', 'comunicaciones', 'blindada', 'aerotransportada', 'aviacion', 'logistica', 'intendencia', 'materialbelico', 'sanidad', 'transporte', 'mantenimiento', 'veterinaria', 'policiamilitar', 'antitanque', 'morteros', 'ametralladoras', 'lanzacohetes', 'inteligencia', 'ninguna']
  var ESCALONES = ['escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito']
  var BANDOS = { propias: 'propias', propio: 'propias', azul: 'propias', amigo: 'propias', enemigas: 'enemigas', enemigo: 'enemigas', rojo: 'enemigas' }
  var LIMITE_EXPEDIENTE = 90000 // caracteres del contexto del ejercicio dentro del pedido (≈ 25 mil tokens)

  function r6(x) { return Math.round(x * 1e6) / 1e6 }
  function limpia(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim() }
  function enumera(xs) { return xs.map(function (x, i) { return (i + 1) + '. ' + x }).join('\n') }

  // ─── Fichas ────────────────────────────────────────────────────────────────────────
  // km → grados en ese punto (la ficha va a x km al este e y km al norte del centro)
  function desplaza(centro, xKm, yKm) {
    var lat = centro.lat + yKm / 111.32
    var lng = centro.lng + xKm / (111.32 * Math.max(0.2, Math.cos(centro.lat * Math.PI / 180)))
    return { lat: r6(lat), lng: r6(lng) }
  }
  function normalizaBando(b) { return BANDOS[limpia(b).toLowerCase()] || 'propias' }
  function ficha(base, i, ahora) {
    return {
      id: 'prof-' + (base.id || i) + '-' + ahora + '-' + i,
      bando: normalizaBando(base.bando),
      tipo: 'unidad',
      designacion: limpia(base.designacion) || 'Unidad ' + (i + 1),
      arma: ARMAS.indexOf(base.arma) >= 0 ? base.arma : 'infanteria',
      escalon: ESCALONES.indexOf(base.escalon) >= 0 ? base.escalon : 'batallon',
      lat: r6(base.lat),
      lng: r6(base.lng),
      piezas: 3
    }
  }
  // Una organización tipo del catálogo, centrada en `centro`, con el número del profesor en
  // vez de %N (y %N1, %N2… para las subordinadas: 1 → 11, 12, 13). ROJO se dibuja espejado
  // (el enemigo viene del otro lado): su comando queda al norte y las de maniobra al sur.
  function fichasDeOrganizacion(org, op) {
    op = op || {}
    var centro = op.centro && isFinite(op.centro.lat) && isFinite(op.centro.lng) ? op.centro : { lat: -16.5, lng: -64.5 }
    var bando = normalizaBando(op.bando), n = limpia(op.numero) || '1', ahora = op.ahora || Date.now()
    var signo = bando === 'enemigas' ? -1 : 1
    return (org.piezas || []).map(function (p, i) {
      var d = p.d.replace(/%N(\d)/g, function (_, k) { return n + k }).replace(/%N/g, n)
      if (op.sufijo) d += ' ' + op.sufijo
      var ll = desplaza(centro, p.x, signo * p.y)
      return ficha({ id: org.id + '-' + i, bando: bando, designacion: d, arma: p.arma, escalon: p.esc, lat: ll.lat, lng: ll.lng }, i, ahora)
    })
  }
  // El bloque ```json que devuelve la IA (o un JSON pegado a mano): una lista de fichas, o un
  // objeto con `fichas`/`unidades`. Las que no traen lat/lng se reparten alrededor del centro.
  function fichasDeJSON(texto, op) {
    op = op || {}
    var t = String(texto || '')
    var m = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (m) t = m[1]
    var i0 = Math.min.apply(null, [t.indexOf('['), t.indexOf('{')].filter(function (i) { return i >= 0 }))
    if (!isFinite(i0)) throw new Error('No encuentro un JSON con las fichas.')
    var datos = JSON.parse(t.slice(i0, Math.max(t.lastIndexOf(']'), t.lastIndexOf('}')) + 1))
    var lista = Array.isArray(datos) ? datos : datos.fichas || datos.unidades || datos.orden_de_batalla || []
    if (!Array.isArray(lista) || !lista.length) throw new Error('El JSON no trae una lista de fichas.')
    var centro = op.centro && isFinite(op.centro.lat) ? op.centro : { lat: -16.5, lng: -64.5 }
    var ahora = op.ahora || Date.now(), sinLugar = 0
    var fichas = lista.map(function (u, i) {
      var lat = +u.lat, lng = +(u.lng != null ? u.lng : u.lon)
      if (!isFinite(lat) || !isFinite(lng)) { var ll = desplaza(centro, (sinLugar % 5 - 2) * 4, -Math.floor(sinLugar / 5) * 4); lat = ll.lat; lng = ll.lng; sinLugar++ }
      return ficha({ id: 'ia', bando: u.bando, designacion: u.designacion || u.nombre || u.unidad, arma: limpia(u.arma).toLowerCase(), escalon: limpia(u.escalon).toLowerCase(), lat: lat, lng: lng }, i, ahora)
    })
    return { fichas: fichas, sinLugar: sinLugar }
  }

  // ─── El contexto del ejercicio (recortado) ─────────────────────────────────────────
  function resumenUnidades(unidades) {
    var us = (unidades || []).filter(function (u) { return u && (u.tipo || 'unidad') === 'unidad' })
    if (!us.length) return '(todavía no hay fichas en la carta)'
    return us.map(function (u) { return '- ' + (u.bando === 'enemigas' || u.bando === 'enemigo' ? 'ROJO' : 'AZUL') + ' · ' + limpia(u.designacion || u.nombre) + ' · ' + (u.arma || '') + ' · ' + (u.escalon || '') + (isFinite(u.lat) ? ' · ' + r6(u.lat) + ', ' + r6(u.lng) : '') }).join('\n')
  }
  function recorta(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '\n[… recortado: ' + (s.length - n) + ' caracteres más en la Mesa]' : s }
  function vacio(v) { return v == null || v === '' || (typeof v === 'object' && !Object.keys(v).some(function (k) { return !vacio(v[k]) })) }
  function bloqueJSON(nombre, v, limite) {
    if (vacio(v)) return ''
    var txt; try { txt = JSON.stringify(v, null, 1) } catch (e) { txt = String(v) }
    return '\n### ' + nombre + '\n```json\n' + recorta(txt, limite) + '\n```\n'
  }
  function contexto(ctx) {
    var ej = ctx.ejercicio || {}, partes = []
    partes.push('### Ejercicio\n- Nombre: ' + (limpia(ej.nombre) || '(sin nombre)') + '\n- Unidad de los alumnos: ' + (limpia(ej.unidadAnalisis && (ej.unidadAnalisis.nombre || ej.unidadAnalisis.designacion)) || limpia(ej.ordenSup && ej.ordenSup.unidad) || '(no elegida todavía: la Mesa la pide al abrir el ejercicio)') + '\n- Misión escrita: ' + (limpia(ej.mision) || '(todavía no hay)'))
    if (ej.aoi && ej.aoi.bbox) partes.push('- Área de Interés (bbox): ' + JSON.stringify(ej.aoi.bbox))
    if (ctx.centro && isFinite(ctx.centro.lat)) partes.push('- Centro de la vista: ' + r6(ctx.centro.lat) + ', ' + r6(ctx.centro.lng))
    partes.push('\n### Fichas en la carta\n' + resumenUnidades(ctx.unidades || ej.unidades))
    partes.push(bloqueJSON('Orden del escalón superior (tablero Mesa · Preparación)', ej.ordenSup, 20000))
    partes.push(bloqueJSON('Escenario y orientación', { escenario: ej.escenario, orientacion: ej.orientacion }, 8000))
    if (ej.cmoc && typeof ej.cmoc === 'object') partes.push(bloqueJSON('CMOC (lo dibujado)', ej.cmoc, 15000))
    if (ej.fasesCOA) partes.push(bloqueJSON('Cursos de acción por fases', ej.fasesCOA, 12000))
    var docs = (ej.documentos || []).filter(Boolean)
    if (docs.length) partes.push('\n### Documentos adjuntos al ejercicio\n' + docs.map(function (d) { return '#### ' + limpia(d.nombre || d.titulo || 'Documento') + '\n' + recorta(limpia(d.texto || d.contenido || ''), 6000) }).join('\n\n'))
    return recorta(partes.filter(Boolean).join('\n'), ctx.limite || LIMITE_EXPEDIENTE)
  }

  // ─── Los pedidos ───────────────────────────────────────────────────────────────────
  function cabecera(paso, ctx) {
    var E = ctx.escalon, F = ctx.foco
    return '# PEDIDO DE TRABAJO PARA LA IA — LEÉ ESTO PRIMERO\n\n' +
      'Sos el Estado Mayor de un **' + E.profesor + '** (escalón SUPERIOR) que arma un EJERCICIO DE ESCUELA para sus alumnos, que son **' + E.alumnos + '**. ' +
      'Lo que escribís es lo que el profesor les da a los alumnos (o lo que guarda como solución para corregirlos: el pedido dice cuál).\n\n' +
      '**Paso del armado:** ' + paso.n + ' · ' + paso.nom + '\n' +
      '**Qué entrena el ejercicio:** ' + F.nom + ' — ' + F.pide + '\n' +
      '**Regla de oro:** completá TODO lo que no es del campo que se entrena, con datos concretos y coherentes entre sí; en el campo que se entrena dejá el TRABAJO al alumno (no le resuelvas su apreciación, su anexo ni su decisión). Si algo del contexto falta, inventalo verosímil, de ESTE terreno y de ESTE escalón, y marcalo con «(supuesto)». Si el texto te llega cortado, contestá igual con lo que tengas.\n\n'
  }
  function formatoFichas() {
    return '## FORMATO DE LAS FICHAS (para pegarlas en la Mesa)\nUn bloque ```json con una LISTA de objetos, uno por unidad:\n' +
      '```json\n[{"designacion":"D.I. 11","bando":"propias","arma":"infanteria","escalon":"division","lat":-16.51,"lng":-64.49}]\n```\n' +
      '- `bando`: "propias" (AZUL) o "enemigas" (ROJO).\n- `arma`: uno de ' + ARMAS.join(', ') + '.\n- `escalon`: uno de ' + ESCALONES.join(', ') + '.\n- `lat`/`lng` en grados decimales, sobre el terreno del ejercicio.\n\n'
  }
  function pedidoOGO(ctx) {
    var E = ctx.escalon, F = ctx.foco
    var anexos = CAT.ANEXOS_OGO.map(function (a) {
      var S = CAT.SECCIONES[a.sec], entrena = F.secs.indexOf(a.sec) >= 0 && F.id !== 'pmtd'
      return 'Anexo ' + a.letra + ' — ' + a.nom + ' (lo recibe el ' + S.corto + ')' + (entrena ? ' ← ES EL CAMPO QUE SE ENTRENA: completo en lo que el superior sabe, SIN resolver lo que el alumno tiene que producir' : '')
    })
    return '## LA TAREA: la ORDEN GENERAL DE OPERACIONES (OGO) del ' + E.profesor + ' a la unidad de los alumnos, COMPLETA, con TODOS sus anexos\n\n' +
      'Es la **' + E.orden + '**. La reciben los alumnos (' + E.alumnos + ') y con ella hacen el PMTD completo (recibir la misión, analizar la misión, desarrollar los CAP, Juego de Guerra, comparar, decidir, elaborar su propia orden).\n\n' +
      '### Formato de la OGO (formato militar de la Escuela)\n' +
      'Encabezado (clasificación, copia N° de, unidad, lugar/PC, grupo fecha-hora, N° de orden, referencias: cartas y escala, huso horario), ORGANIZACIÓN DE LA TAREA (del escalón del profesor, con los alumnos adentro), y los cinco párrafos:\n' +
      enumera([
        'SITUACIÓN: a. Fuerzas enemigas (orden de batalla, dispositivo, capacidades, lo que sabe el superior; remite al Anexo A). b. Fuerzas amigas (misión e intención DOS escalones arriba, unidades vecinas y de apoyo con sus misiones). c. Agregaciones y segregaciones (refuerzos y reducciones de la unidad de los alumnos, con la hora en que rigen). d. Supuestos.',
        'MISIÓN: la misión de la unidad del PROFESOR (quién, qué, cuándo, dónde, para qué).',
        'EJECUCIÓN: a. Intención del Comandante (propósito, tareas clave, estado final). b. Concepto de la operación (esquema de maniobra por fases, operación decisiva y de configuración, fuegos, reconocimiento, ingenieros). c. Tareas a las unidades subordinadas: UNA por unidad, la de los alumnos con todo detalle (misión, límites, objetivos, medidas de coordinación, apoyos recibidos), las vecinas en una línea. d. Instrucciones de coordinación (hora de inicio, líneas y medidas de control, RCIC del superior, administración del riesgo, reglas de empeñamiento).',
        'APOYO DE SERVICIO DE COMBATE / LOGÍSTICA: concepto del apoyo, instalaciones, rutas, clases de abastecimiento, sanidad, mantenimiento, transporte (remite al Anexo D).',
        'COMANDO Y COMUNICACIONES: puestos comando (ubicación y desplazamientos), sucesión de comando, instrucciones de comunicaciones (remite al Anexo G).'
      ]) + '\nFirma del Comandante, autenticación, anexos, distribución.\n\n' +
      '### Los anexos (TODOS, cada uno completo y en su propio formato de anexo, con sus apéndices si corresponde)\n' + enumera(anexos) + '\n\n' +
      '### Reglas\n' +
      '- Los datos tienen que ser de ESTE ejercicio: el terreno del Área de Interés y del CMOC (avenidas de aproximación, terreno clave), las fichas de la carta (usá sus designaciones), la Orden escrita en la Mesa si ya hay algo. Coordenadas, líneas y objetivos con nombre y ubicación.\n' +
      '- Escalón coherente: el ' + E.profesor + ' escribe; la unidad de los alumnos recibe tareas de su nivel, con subordinados dos niveles abajo nombrados.\n' +
      '- Fechas y horas en D/H (D-5, D, D+2; H-2, H+6). Si el ejercicio no tiene calendario, dejá D y H sin fecha.\n' +
      '- ' + F.pide + '\n' +
      '- No escribas el plan de los alumnos ni sus apreciaciones: eso es lo que van a hacer con esta Orden.\n\n' +
      '### Cómo contestar\n' +
      'En Markdown, en español militar, voseo no (es un documento). Primero la OGO entera; después cada anexo con su letra y título como encabezado de nivel 2; al final una sección «## PARA EL PROFESOR» con: 1) qué debe producir el alumno con esta Orden (por fase del PMTD, según el campo que entrena); 2) qué quedó deliberadamente sin resolver para él; 3) una lista de supuestos que inventaste para que el profesor los confirme. Si no entra todo en una respuesta, terminá el documento actual y decí «SIGUE: Anexo X» para que te pidan el resto.\n\n'
  }
  function pedidoPaso(paso, ctx) {
    var ia = paso.ia || {}
    var t = '## LA TAREA: ' + (ia.tit || paso.nom) + '\n\n' + (ia.pide || paso.que) + '\n\n'
    if (paso.organizaciones) t += formatoFichas()
    t += '### Cómo contestar\nEn Markdown, en español militar, con títulos y cuadros donde haga falta; datos de ESTE terreno y de ESTE escalón (' + ctx.escalon.profesor + ' → ' + ctx.escalon.alumnos + '); coherente con lo que ya hay en el ejercicio (abajo). Terminá con «## PARA EL PROFESOR»: qué de esto va a los alumnos y qué es solución para corregirlos, según el campo que entrena (' + ctx.foco.nom + ').\n\n'
    return t
  }
  // El pedido entero de un paso. ctx: { escalon, foco, ejercicio, unidades, centro, limite }.
  function armarPedido(paso, ctx) {
    ctx = ctx || {}
    ctx.escalon = ctx.escalon || CAT.ESCALONES[1]
    ctx.foco = ctx.foco || CAT.FOCOS[0]
    return cabecera(paso, ctx) + (paso.ogo ? pedidoOGO(ctx) : pedidoPaso(paso, ctx)) +
      '---\n\n# CONTEXTO DEL EJERCICIO (lo que ya hay en la Mesa)\n\n' + contexto(ctx) + '\n\n---\n' +
      'RECORDATORIO: ' + (paso.ogo ? 'la OGO completa con TODOS sus anexos, ' : ia(paso) + ', ') + 'para un ' + ctx.escalon.profesor + ' cuyos alumnos son ' + ctx.escalon.alumnos + '; el ejercicio entrena ' + ctx.foco.nom + '.\n'
  }
  function ia(paso) { return (paso.ia && paso.ia.tit) || paso.nom }

  function focoDe(id) { for (var i = 0; i < CAT.FOCOS.length; i++) if (CAT.FOCOS[i].id === id) return CAT.FOCOS[i]; return CAT.FOCOS[0] }
  function organizacionDe(id) { for (var i = 0; i < CAT.ORGANIZACIONES.length; i++) if (CAT.ORGANIZACIONES[i].id === id) return CAT.ORGANIZACIONES[i]; return null }

  return { ARMAS: ARMAS, ESCALONES: ESCALONES, armarPedido: armarPedido, fichasDeOrganizacion: fichasDeOrganizacion, fichasDeJSON: fichasDeJSON, focoDe: focoDe, organizacionDe: organizacionDe, contexto: contexto, LIMITE_EXPEDIENTE: LIMITE_EXPEDIENTE }
})
