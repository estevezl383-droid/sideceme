/* 🚚 LA RUTA DEL G-4 — 🎓 Aprendizaje · «Practicar como G-4» (16-10-2026).
   Lo pidió Sergio con capturas del panel del G-4 (▣ ASDI · ↔ Ejes · 🎬 Concepto · 🧮 Cálculos ·
   📋 Mis hojas): «no sé en qué momento del planeamiento se establece… es un orden lógico y
   sistemático: eso quisiera que vaya siguiendo el alumno… que se ilumine lo primero que se tiene
   que hacer… y lo del G-1 al G-5 se completa automáticamente; la idea es que aprenda esta vez
   logística, después avanzaremos al resto».

   Acá están (puro, se prueba en Node):
   · INSUMOS: lo que las OTRAS secciones (y el escalón superior) le entregan al G-4, en qué fase, para
     qué le sirve y cómo se sabe si ya está en la Mesa (las hojas del Cmte., del JEM, del G-3, la PICB
     del G-2, el CMOC, las fases, las bajas del G-1, los recursos del G-5…) o si lo entregó el
     🤖 EM simulado (un documento del ejercicio con `emSimulado`).
   · PASOS: el trabajo del G-4 EN ORDEN, por las 7 fases del PMTD, con el porqué de cada momento, lo
     que recibe, lo que hace, lo que entrega, dónde se abre en el panel del G-4 y cómo se sabe que
     está hecho (de lo guardado en el ejercicio; lo que la Mesa no guarda lo marca el alumno).
   · estado(): el paso ACTUAL (el primero sin hacer: el que se ilumina), lo hecho y lo que falta.
   · pedidoEM() / leerEntregas() / documentos(): el pedido a la IA para que el Estado Mayor simulado
     entregue lo que falta de UNA fase (nunca lo de una fase a la que el alumno no llegó: así la
     decisión del Cmte. no aparece antes de comparar los CAP), y su respuesta pasada a documentos
     del ejercicio — así la IA de cada hoja del G-4 los lee en el expediente.
   · parteEM() / entrada() (18-10-2026): el 📣 parte de qué terminó cada sección y qué te debe, y con qué
     entrás al paso de ahora (y lo de tu fase que todavía no te hace falta: no te adelantes).
   · pedidoFichas() / unidadesDelTexto() / desplegar() (18-10-2026): el G-3 del EM simulado devuelve las
     unidades del CAP 1 con su lugar y la Mesa las pone en la carta (las que ya están, las mueve).
   El orden sigue la Visión Horizontal del PMTD 2020 (las hojas del G-4 en cada fase) y el «Estudio
   de situación de logística» de la Escuela (las áreas de apoyo logístico se eligen en el análisis de
   los CAP, con la DMA y la seguridad), en calcos/logistica/v1/doctrina.js. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica()
  else raiz.SIDRutaG4 = fabrica()
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict'

  // ─── utilidades ──────────────────────────────────────────────────────────────────────
  function limpia(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim() }
  function lista(x) { return Array.isArray(x) ? x : [] }
  function obj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  // ¿hay algo ESCRITO? (lo que arma la Mesa sola —esquema, número, firma, ids— no cuenta)
  var NO_CUENTA = { esquema: 1, numero: 1, firma: 1, id: 1, clave: 1, tipo: 1, version: 1, por: 1, estado: 1, fecha: 1, desde: 1, hasta: 1, num: 1 }
  function tieneTexto(v, prof) {
    prof = prof || 0
    if (v == null || prof > 8) return false
    if (typeof v === 'string') return /[A-Za-zÁÉÍÓÚÑáéíóúñ0-9].*[A-Za-zÁÉÍÓÚÑáéíóúñ0-9].*[A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/.test(v)
    if (typeof v !== 'object') return false
    if (Array.isArray(v)) return v.some(function (x) { return tieneTexto(x, prof + 1) })
    return Object.keys(v).some(function (k) { return !NO_CUENTA[k] && k.charAt(0) !== '_' && tieneTexto(v[k], prof + 1) })
  }
  function hoja(ej, sec, id) {
    if (!ej) return null
    if (sec === 'g3') return obj(ej.g3)[id]
    if (sec === 'g2') return obj(ej.picb)[id]
    return obj(obj(ej.hojasG)[sec])[id]
  }
  function hayHoja(ej, sec, id) { return tieneTexto(hoja(ej, sec, id)) }
  function propias(ej) { return lista(ej && ej.unidades).filter(function (u) { return u && (u.tipo || 'unidad') === 'unidad' && !/enem|rojo/i.test(u.bando || '') }) }
  function docsDeLaMesa(ej) { return lista(ej && ej.documentos).filter(function (d) { return d && !d.emSimulado }) }
  function docsEM(ej) { return lista(ej && ej.documentos).filter(function (d) { return d && d.emSimulado && d.emSimulado.insumo }) }
  function plural(n, s, p) { return n + ' ' + (n === 1 ? s : (p || s + 's')) }
  function ok(det) { return { ok: true, det: det || '' } }
  function no(det) { return { ok: false, det: det || '' } }

  // ─── quién entrega ───────────────────────────────────────────────────────────────────
  // (los colores son los de las secciones de catalogo.js; «sup» es el escalón superior)
  var DE = {
    sup: { corto: 'Sup.', nom: 'Escalón superior', color: '#94a3b8' },
    cmte: { corto: 'Cmte.', nom: 'Comandante', color: '#dc2626' },
    jem: { corto: 'JEM', nom: 'Jefe de Estado Mayor', color: '#f59e0b' },
    g1: { corto: 'G-1', nom: 'Personal', color: '#7dd3fc' },
    g2: { corto: 'G-2', nom: 'Inteligencia', color: '#6ee08a' },
    g3: { corto: 'G-3', nom: 'Operaciones', color: '#ff9a5c' },
    g5: { corto: 'G-5', nom: 'AC/GM', color: '#a78bfa' }
  }

  // ─── lo que le entregan al G-4 (en el orden en que llega) ────────────────────────────
  // fase: cuándo lo entregan · corto: cómo se nombra en el 📣 Parte del EM · para: qué saca de ahí el G-4 · hay(ej): si ya está en la Mesa ·
  // pide: qué tiene que escribir el EM simulado · simulable: false = lo pone el profesor en la carta.
  var RE_ANEXO_LOG = /(anexo|plan)[^\n]{0,60}(log[íi]stic|servicio de combate|\bA\.?S\.?C\b|SPAC|apoyo log)/i
  var INSUMOS = [
    { id: 'orden', fase: 1, de: 'sup', nom: 'La Orden del escalón superior', corto: 'la Orden',
      para: 'la misión, el tiempo (del D… al D+…) y lo que el superior te da y te pide',
      hay: function (ej) {
        if (limpia(obj(ej.ordenSup).mision)) return ok('la Orden está escrita en «Mesa · Preparación»')
        var d = docsDeLaMesa(ej).filter(function (x) { return x.categoria === 'orden' || /\borden\b/i.test(x.nombre || '') })
        return d.length ? ok(plural(d.length, 'documento') + ' de la Orden en el ejercicio') : no()
      },
      pide: 'La ORDEN DE OPERACIONES del escalón superior, con lo esencial para planificar: número, carta y clave; situación (enemiga y propia); la MISIÓN de la unidad del alumno con su tiempo (del D… al D+…); el concepto de la operación; las tareas a la unidad del alumno; las instrucciones de coordinación; y la lista de anexos (entre ellos el de Logística / Apoyo de Servicio de Combate).' },
    { id: 'anexoLogSup', fase: 1, de: 'sup', nom: 'El Anexo de Logística (ASC) del escalón superior', corto: 'el Anexo de Logística',
      para: 'dónde está el área logística del superior (ARCE o Base), su EPA y su EPE, los niveles y dotaciones con que llegás',
      hay: function (ej) {
        var d = docsDeLaMesa(ej).filter(function (x) { return RE_ANEXO_LOG.test(x.nombre || '') || RE_ANEXO_LOG.test(String(x.texto || '').slice(0, 600)) })
        return d.length ? ok('«' + limpia(d[0].nombre) + '»') : no()
      },
      pide: 'El ANEXO DE LOGÍSTICA / APOYO DE SERVICIO DE COMBATE del escalón superior, con DATOS concretos: situación logística; misión; concepto de apoyo por fase; las instalaciones del superior (su área de apoyo logístico —ARCE o Base Logística—, con su ubicación en la carta); sus ejes (EPA y EPE del superior) con los lugares por donde pasan; niveles de abastecimiento y dotaciones por clase (días de abastecimiento, toneladas); mantenimiento; evacuación y hospitalización (a dónde se evacúa); transporte que asigna; y lo que la unidad del alumno tiene que resolver con sus medios. NO le elijas el área de apoyo logístico ni los ejes a la unidad del alumno: eso es del G-4.' },
    { id: 'unidad', fase: 1, de: 'sup', nom: 'Tu unidad y sus fichas en la carta', corto: 'tus fichas en la carta', simulable: false,
      para: 'a quién apoyás: el efectivo y los vehículos salen de las fichas y de la organización',
      hay: function (ej) {
        var uc = obj(obj(ej.ops).unidadConsiderada), n = propias(ej).length
        if (!limpia(uc.nombre)) return no(n ? plural(n, 'ficha propia', 'fichas propias') + ', pero falta el «¿Quién soy?» del inicio del ejercicio' : 'faltan el «¿Quién soy?» y las fichas propias')
        return n ? ok(limpia(uc.nombre) + ' · ' + plural(n, 'ficha propia', 'fichas propias')) : no(limpia(uc.nombre) + ': faltan las fichas propias en la carta')
      },
      quien: 'Lo pone el profesor en la carta (🪖 Unidades) o vos, con el «¿Quién soy?» del inicio del ejercicio.' },
    { id: 'guiaInicial', fase: 1, de: 'cmte', nom: 'La Guía Inicial del Comandante', corto: 'la Guía Inicial',
      para: 'los plazos y lo primero que el Cmte. espera de logística',
      hay: function (ej) { return hayHoja(ej, 'cmte', 'guiaInicial') || hayHoja(ej, 'g3', 'guiaInicial') ? ok('hoja F1·P6 del Cmte.') : no() },
      pide: 'La GUÍA INICIAL DEL COMANDANTE: el tiempo disponible y su reparto (TTD/TD, regla de 1/3 – 2/3), qué espera de cada sección en esta fase, las primeras directivas y lo que el G-4 tiene que averiguar ya (estado de los medios, dotaciones).' },

    { id: 'picb', fase: 2, de: 'g2', nom: 'La PICB del G-2: el terreno juzgado (CMOC)', corto: 'la PICB (terreno juzgado)',
      para: 'el área de apoyo va en terreno firme, cubierto y fuera de las avenidas del enemigo; el EPA sigue los corredores',
      hay: function (ej) {
        var c = obj(ej.cmoc), k = { restringido: 'restringido', severo: 'sev. restringido', clave: 'terreno clave', corredores: 'corredores', avenidas: 'avenidas' }, partes = []
        Object.keys(k).forEach(function (x) { var n = lista(c[x]).length; if (n) partes.push(n + ' ' + k[x]) })
        if (partes.length) return ok('CMOC en la carta: ' + partes.join(' · '))
        return hayHoja(ej, 'g2', 'ht12') || hayHoja(ej, 'g2', 'ht7') ? ok('el análisis del terreno del G-2 (OCOTA)') : no()
      },
      pide: 'El producto de la PICB del G-2 para el Estado Mayor: el TERRENO JUZGADO —corredores de movilidad, avenidas de aproximación del enemigo, terreno clave, áreas restringidas y severamente restringidas, con NOMBRE y ubicación (partí de lo que ya está dibujado en el CMOC de la Mesa)—, el Área de Interés, el clima y sus efectos, y la evaluación de la amenaza, incluidas sus posibilidades contra la RETAGUARDIA (comandos, aviación, artillería de largo alcance).' },
    // 18-10-2026: los CAE salen de la PICB (F2·P2, su último paso): llegan en la fase 2, no en la 3.
    // Sergio: «los cursos de acción propios y del enemigo ya se supone que deberían estar».
    { id: 'cae', fase: 2, de: 'g2', nom: 'Los cursos de acción del enemigo', corto: 'los CAE',
      para: 'la amenaza sobre tu retaguardia y tus ejes (niveles I – II – III)',
      hay: function (ej) {
        if (lista(obj(ej.fasesCOA).enemigo).length) return ok('las fases del curso de acción enemigo')
        return hayHoja(ej, 'g2', 'cae') || hayHoja(ej, 'g2', 'ht19') ? ok('el CAE del G-2') : no()
      },
      pide: 'Del G-2 (el último paso de la PICB): los CURSOS DE ACCIÓN DEL ENEMIGO más probable y más peligroso, por fase, y sus posibilidades contra la retaguardia y los ejes logísticos (con el nivel de amenaza I, II o III).' },
    { id: 'recursosG5', fase: 2, de: 'g5', nom: 'Los recursos locales y la población (G-5)', corto: 'los recursos locales',
      para: 'lo explotable que podés usar (agua, combustible, talleres, hospitales) y los civiles que pueden cruzarse con tus ejes',
      hay: function (ej) {
        var n = Object.keys(obj(ej.estadosRecursos)).length
        if (n) return ok(plural(n, 'recurso clasificado', 'recursos clasificados') + ' por el G-5')
        return hayHoja(ej, 'g5', 'aprecActiva') ? ok('la Apreciación de AC/GM del G-5') : no()
      },
      pide: 'Del G-5: la población del área de operaciones; los RECURSOS LOCALES clasificados (EXPLOTABLE / PROTEGIDO / NEGADO): agua, combustible, alimentos, talleres, hospitales, transporte civil, con su lugar; y los movimientos de civiles previstos (evacuados, refugiados) y por dónde pasan.' },
    { id: 'tareasG3', fase: 2, de: 'g3', nom: 'Las tareas de la unidad (G-3)', corto: 'las tareas de la unidad',
      para: 'de cada tarea táctica sale una tarea logística implícita',
      hay: function (ej) { return hayHoja(ej, 'g3', 'tareas') ? ok('hoja F2·P3 del G-3') : no() },
      pide: 'Del G-3: las TAREAS específicas, implícitas y esenciales de la unidad (cuadro: Tarea · Tipo · De dónde sale · Quién la ejecuta).' },
    { id: 'misionReexp', fase: 2, de: 'g3', nom: 'La misión reexpresada', corto: 'la misión reexpresada',
      para: 'tu misión de logística apoya ESTA misión',
      hay: function (ej) { return hayHoja(ej, 'g3', 'mision') ? ok('hoja F2·P12 del G-3') : limpia(ej.mision) ? ok('la misión escrita en la Mesa') : no() },
      pide: 'Del G-3: la MISIÓN REEXPRESADA de la unidad (quién, qué, cuándo, dónde y para qué).' },
    { id: 'intencion', fase: 2, de: 'cmte', nom: 'La Intención y la Guía de Planificación del Comandante', corto: 'la Intención y la Guía',
      para: 'el estado final y el riesgo que acepta: ordena tus prioridades',
      hay: function (ej) { return hayHoja(ej, 'cmte', 'intencion') || hayHoja(ej, 'cmte', 'guiaPlanificacion') ? ok('hojas F2·P14 / F2·P15 del Cmte.') : no() },
      pide: 'Del Comandante: la INTENCIÓN INICIAL (propósito, tareas clave, estado final deseado) y la GUÍA DE PLANIFICACIÓN (cuántos CAP desarrollar, qué tipo de maniobra, prioridades y el riesgo que acepta; lo que le pide a logística).' },
    { id: 'normasEval', fase: 2, de: 'jem', nom: 'Las normas de evaluación de los CAP (JEM)', corto: 'las normas de evaluación',
      para: 'con esos criterios vas a comparar los CAP desde logística',
      hay: function (ej) { return hayHoja(ej, 'jem', 'normasEval') ? ok('hoja F2·P16 del JEM') : no() },
      pide: 'Del JEM: las NORMAS DE EVALUACIÓN de los cursos de acción (criterios, el peso de cada uno y cómo se califica), entre ellos el criterio logístico.' },

    { id: 'fases', fase: 3, de: 'g3', nom: 'Las fases del curso de acción propio', corto: 'las fases del CAP',
      para: 'el concepto de apoyo y la matriz de sincronización se arman fase por fase',
      hay: function (ej) {
        var f = lista(obj(ej.fasesCOA).propio)
        return f.length ? ok(plural(f.length, 'fase') + ': ' + f.map(function (x) { return limpia(x && x.nombre) || '—' }).join(' · ')) : no()
      },
      pide: 'Del G-3: las FASES del curso de acción propio (nombre, desde — hasta en D±, qué pasa en cada una y quién hace el esfuerzo principal).' },
    { id: 'caps', fase: 3, de: 'g3', nom: 'Los cursos de acción propios (CAP 1 y CAP 2)', corto: 'los CAP 1 y 2', fichas: true,
      para: 'recién con la maniobra sabés dónde poner el área de apoyo y por dónde llevar el EPA',
      hay: function (ej) { return hayHoja(ej, 'g3', 'coa') ? ok('hoja F3·P6 del G-3') : hayHoja(ej, 'g3', 'concepto') ? ok('el concepto amplio del G-3 (F3·P4)') : no() },
      pide: 'Del G-3: los CURSOS DE ACCIÓN PROPIOS (CAP 1 y CAP 2; uno más si la guía lo pide), cada uno con su ENUNCIADO (quién, qué, cuándo, dónde, cómo y para qué) y su BOSQUEJO por fase: esfuerzo principal, esfuerzos secundarios y reserva, con las unidades de la carta y los lugares (nombres y coordenadas aproximadas) por donde maniobran.' },
    { id: 'orgTarea', fase: 3, de: 'g3', nom: 'La organización de la tarea', corto: 'la organización de la tarea', fichas: true,
      para: 'quién es quién: el efectivo y los vehículos de cada agrupación para calcular',
      hay: function (ej) {
        if (lista(ej.orgTarea).length) return ok(plural(lista(ej.orgTarea).length, 'agrupación', 'agrupaciones') + ' en la organización de la tarea')
        return hayHoja(ej, 'g3', 'orgTarea') || hayHoja(ej, 'g3', 'organizacion') ? ok('hoja de organización del G-3') : no()
      },
      pide: 'Del G-3: la ORGANIZACIÓN DE LA TAREA de cada CAP: cada agrupación con sus unidades orgánicas, agregadas y en apoyo, y su EFECTIVO aproximado (personal y vehículos), que el G-4 necesita para calcular.' },

    { id: 'sincroG3', fase: 4, de: 'g3', nom: 'El Juego de Guerra: la matriz de sincronización', corto: 'la matriz del Juego de Guerra',
      para: 'acción por acción ves cuánto se consume, cuándo y dónde: ahí están los puntos críticos',
      hay: function (ej) { return hayHoja(ej, 'g3', 'sincro') || hayHoja(ej, 'g3', 'eventos') ? ok('la matriz / los eventos críticos del G-3') : no() },
      pide: 'Del G-3: el resultado del JUEGO DE GUERRA de cada CAP: la matriz de sincronización por fase (acción · reacción · contrarreacción), los eventos críticos y puntos de decisión, y la duración real de cada fase.' },
    { id: 'bajas', fase: 4, de: 'g1', nom: 'Las bajas estimadas por fase (G-1)', corto: 'las bajas por fase',
      para: 'la evacuación y la hospitalización (y el EPE) se dimensionan con las bajas',
      hay: function (ej) { var b = lista(ej.bajasPorFase); return b.length ? ok('bajas de ' + plural(b.length, 'fase') + ' (panel 📊 Bajas del G-1)') : no() },
      pide: 'Del G-1: las BAJAS estimadas por fase y por agrupación (de combate y fuera de combate, a evacuar), con el total y el porcentaje del efectivo.' },
    { id: 'barreras', fase: 4, de: 'g3', nom: 'El plan de barreras (obstáculos y sus tiempos)', corto: 'el plan de barreras',
      para: 'el material de los trabajos (Clase IV) y su transporte',
      hay: function (ej) { var n = lista(obj(ej.ops).obstaculos).length; return n ? ok(plural(n, 'obstáculo') + ' en la carta') : no() },
      pide: 'Del G-3 con Ingenieros: el PLAN DE BARRERAS (obstáculos por tipo, ubicación y para cuándo tienen que estar listos) con el MATERIAL que necesitan (Clase IV), SIN calcular el transporte (eso es del G-4).' },

    { id: 'decision', fase: 6, de: 'cmte', nom: 'La decisión del Comandante (el CAP aprobado)', corto: 'la decisión del Cmte.',
      para: 'el área se elige y los ejes se ajustan para el CAP que aprobó el Cmte.',
      hay: function (ej) { return hayHoja(ej, 'cmte', 'decisionCmte') || hayHoja(ej, 'cmte', 'guiaFinal') ? ok('hojas F6·P1 / F6·P2 del Cmte.') : no() },
      pide: 'Del Comandante: la DECISIÓN (qué CAP aprueba, con qué modificaciones y por qué) y la GUÍA DE PLANIFICACIÓN FINAL (riesgo aceptado, prioridades por fase, lo que le pide a logística).' },

    { id: 'opord', fase: 7, de: 'g3', nom: 'La Orden General de Operaciones (sin tu anexo)', corto: 'la OGO',
      para: 'tu Anexo y tu matriz dicen lo mismo que la Orden: mismas fases, mismas unidades, mismas letras',
      hay: function (ej) { return hayHoja(ej, 'g3', 'opord') ? ok('hoja F7·P1 del G-3') : no() },
      pide: 'Del G-3: la ORDEN GENERAL DE OPERACIONES del CAP aprobado (situación, misión, ejecución con el concepto de la operación y las tareas a cada unidad, instrucciones de coordinación, comando y comunicaciones) SIN el Anexo de Logística (lo escribe el G-4), y la lista de anexos con sus letras.' }
  ]
  // Dónde lo mira el alumno cuando ya está en la Mesa (lo hizo el profesor o un compañero): la hoja
  // de esa sección o la herramienta (las mismas referencias que catalogo.js: {s, num, nom} o {h}).
  var VER = {
    orden: { h: 'mesaEM' }, anexoLogSup: { h: 'ejercicio' }, unidad: { h: 'unidades' },
    guiaInicial: { s: 'cmte', num: 'F1·P6', nom: /Guía Inicial/i },
    picb: { h: 'cmoc' }, recursosG5: { s: 'g5' }, tareasG3: { s: 'g3', num: 'F2·P3', nom: /Tareas específicas/i },
    misionReexp: { s: 'g3', num: 'F2·P12', nom: /Reexpresión/i }, intencion: { s: 'cmte', num: 'F2·P14', nom: /Intención Inicial/i },
    normasEval: { s: 'jem', num: 'F2·P16', nom: /Normas de Evaluación/i },
    fases: { h: 'caFases' }, caps: { s: 'g3', num: 'F3·P6', nom: /Curso de acción propio/i }, orgTarea: { s: 'g3', num: 'F4·P2', nom: /Organización de la tarea/i }, cae: { s: 'g2' },
    sincroG3: { s: 'g3', num: 'F4·P6-7', nom: /Matriz de sincronización/i }, bajas: { s: 'g1' }, barreras: { h: 'defensa' },
    decision: { s: 'cmte', num: 'F6·P1', nom: /Decisión del Comandante/i },
    opord: { s: 'g3', num: 'F7·P1', nom: /Orden General de Operaciones/i }
  }
  var INS = {}
  INSUMOS.forEach(function (i) { INS[i.id] = i; if (VER[i.id]) i.ver = VER[i.id] })

  // ─── las 7 fases (las del PMTD, catalogo.js) ─────────────────────────────────────────
  var FASES = [
    { id: 1, nom: 'Recibir la misión', que: 'Llega la Orden: la leés con ojos de logístico y abrís tu apreciación.' },
    { id: 2, nom: 'Analizar la misión', que: 'Qué te piden, con qué contás y qué te falta: tareas, necesidades, limitaciones y suposiciones.' },
    { id: 3, nom: 'Desarrollar los cursos de acción', que: 'Con los CAP del G-3 proponés dónde y cómo apoyar cada uno: las áreas, los ejes y el concepto por fase.' },
    { id: 4, nom: 'Juego de Guerra', que: 'Cada CAP se juega acción por acción: verificás las áreas y medís consumos, bajas y transporte.' },
    { id: 5, nom: 'Comparar los cursos de acción', que: 'Desde logística: qué área conviene y qué CAP se apoya mejor.' },
    { id: 6, nom: 'Aprobar el curso de acción', que: 'Con la decisión del Cmte. elegís el área y dejás los ejes definitivos.' },
    { id: 7, nom: 'Elaborar planes y órdenes', que: 'Tu Anexo de Logística y la Matriz de sincronización, iguales a la Orden.' }
  ]

  // ─── el trabajo del G-4, en orden ────────────────────────────────────────────────────
  // abrir: dónde se hace en el panel del G-4: la pestaña (tab) y, si hay, la hoja (num, nom), el paso
  // del ▣ ASDI (paso) o el botón (boton) que se ilumina; o una herramienta de la Mesa (h).
  // hecho(ej): de lo guardado en el ejercicio; sin hecho, lo marca el alumno («✓ Listo»).
  // automatico: el clic en el panel real que lo da por hecho (lo que la Mesa no guarda).
  function zonas(ej) { return lista(obj(ej.ops).zonasLog) }
  function propuestas(ej) { return zonas(ej).filter(function (z) { return z && z.propuesta }) }
  function evalAreas(ej) { return obj(obj(obj(ej.hojasG).g4).evalAreas) }
  function deHoja(id) { return function (ej) { return hayHoja(ej, 'g4', id) ? ok('con contenido') : no() } }
  var PASOS = [
    { id: 'leer-orden', fase: 1, pmtd: 'F1·P2', nom: 'Leer la Orden y el Anexo de Logística del superior',
      porque: 'Todo empieza acá: la misión, el tiempo y lo que el escalón superior ya resolvió por vos (su área logística, su EPA, los niveles con que llegás). Lo que no te dan, lo tenés que planificar.',
      recibe: ['orden', 'anexoLogSup', 'unidad'],
      hace: 'Leé la misión y el tiempo (del D… al D+…), dónde está el área logística del superior y sus ejes, los niveles y dotaciones. Anotá lo que no sabés: va a tus suposiciones y a tus RCIC.',
      entrega: 'Nada todavía: es la base de tu apreciación.',
      abrir: { h: 'ejercicio' } },
    { id: 'aprec-activa', fase: 1, pmtd: 'F1·P3', nom: 'Abrir tu Apreciación Activa de Logística',
      porque: 'Es tu cuaderno de todo el planeamiento: se abre al recibir la misión y se actualiza en cada fase. Lo que vayas resolviendo (áreas, ejes, lo medido) vuelve a ella. NO se difunde.',
      recibe: ['orden', 'anexoLogSup', 'guiaInicial'],
      hace: '🌱 Traé lo del calco y completá I.- Misión y II.- Situación y consideraciones logísticas (efectivos, dotaciones, estado de los medios y lo que te da el superior). El análisis por CAP queda para después.',
      entrega: 'F1·P3 Apreciación Activa de Logística (no se difunde).',
      abrir: { tab: 'hojas', num: 'F1·P3', nom: /Apreciación Activa/i }, hecho: deHoja('aprecActiva') },
    { id: 'asdi-entender', fase: 1, pmtd: 'F1·P4', nom: 'Entender el esquema logístico en profundidad (ASDI / ARCE)',
      porque: 'Antes de proponer nada tenés que saber qué se despliega y dónde: Zona del Interior → Base Log. → Zona de Etapas → ARCE (Cuerpo) → ASDI (División) → áreas de trenes → la tropa. Así sabés qué te da el superior y qué te toca a vos.',
      recibe: ['anexoLogSup'],
      hace: 'Con el Anexo de Logística del superior, ubicá en la carta lo que te da (su área, sus puntos de distribución, su EPA) y lo que te toca a vos: ASDI = División, 6 a 9 km², a 12 km o más de la LC/LPR; ARCE = Cuerpo de Ejército, 9 a 12 km², a 25 km o más. Ubicá en la carta el área del superior.',
      entrega: 'Nada todavía: es lo que vas a aplicar en la fase 3.',
      abrir: { tab: 'asdi' } },

    { id: 'tareas', fase: 2, pmtd: 'F2·P3', nom: 'Tareas específicas, implícitas y esenciales de logística',
      porque: 'De la Orden y de las tareas tácticas de la unidad salen tus tareas: unas están escritas (específicas), otras hay que deducirlas (implícitas); las esenciales son pocas.',
      recibe: ['orden', 'anexoLogSup', 'tareasG3'],
      hace: 'Llená el cuadro: cada tarea con su tipo, de dónde sale y quién la ejecuta (Bat. Log., trenes, el superior).',
      entrega: 'F2·P3 Tareas de logística (no se difunde).',
      abrir: { tab: 'hojas', num: 'F2·P3', nom: /Tareas específicas/i }, hecho: deHoja('tareas') },
    { id: 'calculos', fase: 2, pmtd: 'F2·P4', nom: 'Calcular las necesidades iniciales (Cl I, agua, Cl III, Cl V)',
      porque: '«Comprobar los recursos disponibles»: con el efectivo, los vehículos y los días de la Orden sabés cuánto necesitás; contra lo que tenés y lo que te da el superior aparece lo que falta, que es una limitación.',
      recibe: ['orden', 'unidad'],
      hace: 'En 🧮 Cálculos: unidad, efectivo, vehículos y días de la operación; recorré Cl I, Agua, Cl III y Cl V con la disponibilidad real. Bajá el cálculo (.docx) para tu apreciación.',
      entrega: 'El cálculo de necesidades (.docx) y los pedidos a formular.',
      abrir: { tab: 'calculo', boton: /Descargar el cálculo/i }, automatico: /Descargar el cálculo/i },
    { id: 'limitaciones', fase: 2, pmtd: 'F2·P5', nom: 'Limitaciones de logística',
      porque: 'Lo que la Orden te obliga o te prohíbe, y lo que te falta según el cálculo: cada limitación tiene un efecto sobre la operación.',
      recibe: ['orden', 'anexoLogSup'],
      hace: 'Cada limitación con su tipo (restricción o prohibición), su origen y su efecto.',
      entrega: 'F2·P5 Limitaciones de logística.',
      abrir: { tab: 'hojas', num: 'F2·P5', nom: /Limitaciones/i }, hecho: deHoja('limitaciones') },
    { id: 'hechos', fase: 2, pmtd: 'F2·P6', nom: 'Hechos y suposiciones de logística',
      porque: 'Para planificar sin todos los datos necesitás suposiciones, y cada una con quién la confirma: si cae una, cae el plan.',
      recibe: ['anexoLogSup', 'picb', 'recursosG5'],
      hace: 'Separá lo que se puede probar hoy (hechos) de lo que necesitás suponer (estado de las rutas, recursos locales, reabastecimiento del superior).',
      entrega: 'F2·P6 Hechos y suposiciones.',
      abrir: { tab: 'hojas', num: 'F2·P6', nom: /Hechos y suposiciones/i }, hecho: deHoja('hechos') },
    { id: 'rcic', fase: 2, pmtd: 'F2·P8', nom: 'RCIC y EEIA de logística',
      porque: 'Lo que necesitás saber para no planificar a ciegas (puentes, rutas, recursos) y lo que el enemigo no tiene que saber de tu apoyo.',
      recibe: ['picb', 'cae'],
      hace: 'Cada requerimiento con por qué es crítico, quién lo busca y para cuándo.',
      entrega: 'F2·P8 RCIC y EEIA de logística.',
      abrir: { tab: 'hojas', num: 'F2·P8', nom: /RCIC/i }, hecho: deHoja('rcic') },
    { id: 'aprec-orientacion', fase: 2, pmtd: 'F2·P13', nom: 'Actualizar la apreciación y exponerla',
      porque: 'Con el análisis de la misión terminado, actualizás la apreciación (📋 Partir de la F1·P3) y la exponés en la orientación al Comandante: de ahí salen su intención y su guía.',
      recibe: ['picb', 'misionReexp', 'recursosG5'],
      hace: 'Partí de la F1·P3 y sumá tareas, necesidades, limitaciones y suposiciones. Es lo que exponés.',
      entrega: 'F2·P13 Apreciación de Logística actualizada.',
      abrir: { tab: 'hojas', num: 'F2·P13', nom: /actualizada/i }, hecho: deHoja('aprecOrientacion') },

    { id: 'potencia', fase: 3, pmtd: 'F3·P1', nom: 'Aporte de logística a la potencia relativa de combate',
      porque: 'Antes de generar los CAP el G-3 compara las fuerzas; logística dice qué sostiene y qué limita a cada bando.',
      recibe: ['cae', 'picb'],
      hace: 'Lo que tu apoyo APORTA y LIMITA a la potencia propia, lo mismo del enemigo, y la conclusión.',
      entrega: 'F3·P1 Aporte de logística a la PRC.',
      abrir: { tab: 'hojas', num: 'F3·P1', nom: /potencia relativa/i }, hecho: deHoja('potencia') },
    { id: 'asdi-proponer', fase: 3, pmtd: 'F3·P4', nom: 'Proponer las áreas de apoyo (A, B, C) sobre el terreno',
      porque: 'Recién con los CAP sabés dónde va a estar la maniobra. El área tiene que apoyarla: a la distancia de seguridad de la LC/LPR, en terreno firme y cubierto, cerca de una buena ruta y lejos de las avenidas del enemigo.',
      recibe: ['caps', 'picb', 'orgTarea'],
      hace: 'En el paso 1 del ▣ ASDI trazá dos o tres áreas posibles (o calculá la propuesta de la Mesa con la PICB). Todavía no se elige: se comparan después.',
      entrega: 'Las áreas A, B… en el calco.',
      abrir: { tab: 'asdi', paso: 1 },
      hecho: function (ej) { var n = propuestas(ej).length; return n >= 2 ? ok(plural(n, 'área propuesta', 'áreas propuestas')) : no(n ? 'una sola área: proponé al menos dos para poder compararlas' : '') } },
    { id: 'ejes-tentativos', fase: 3, pmtd: 'F3·P4', nom: 'Trazar el EPA y el EPE tentativos',
      porque: 'Con el CAP ya sabés de dónde a dónde fluye el apoyo: el EPA va del área del superior a tu área y hasta las unidades; el EPE vuelve con heridos, material y prisioneros, por otra ruta para no cruzarse.',
      recibe: ['caps', 'picb', 'anexoLogSup'],
      hace: 'En ↔ Ejes trazá el EPA y después el EPE, en el sentido del flujo (la punta de flecha sale del último tramo).',
      entrega: 'El EPA y el EPE en el calco.',
      abrir: { tab: 'ejes', boton: /Trazar el EPA/i },
      hecho: function (ej) {
        var e = lista(obj(ej.ops).ejesLog), a = e.some(function (x) { return x && x.tipo === 'epa' }), b = e.some(function (x) { return x && x.tipo === 'epe' })
        return a && b ? ok('EPA y EPE trazados') : no(a ? 'falta el EPE' : b ? 'falta el EPA' : '')
      } },
    { id: 'concepto', fase: 3, pmtd: 'F3·P4', nom: 'Concepto de apoyo por fase (enfoque y prioridad)',
      porque: 'Cada fase del G-3 pide un ENFOQUE (qué función pesa: Cl III en la marcha, Cl V en la defensa…) y una PRIORIDAD (a quién se atiende primero, según las prioridades del Comandante). Es el párrafo III.A.1 de tu Anexo.',
      recibe: ['fases', 'caps', 'orgTarea', 'intencion'],
      hace: 'En 🎬 Concepto, para cada fase: el enfoque, la prioridad de apoyo y la forma de distribución; y la misión de logística.',
      entrega: 'El concepto de apoyo por fase (lo toman tu Anexo y tu Matriz).',
      abrir: { tab: 'concepto' },
      hecho: function (ej) {
        var nf = lista(obj(ej.fasesCOA).propio).length, c = lista(ej.conceptoApoyo).filter(function (x) { return x && (lista(x.enfoque).length || limpia(x.prioridad)) }).length
        if (!c) return no()
        return !nf || c >= nf ? ok(plural(c, 'fase') + ' con enfoque o prioridad') : no(c + ' de ' + nf + ' fases')
      } },

    { id: 'asdi-verificar', fase: 4, pmtd: 'F4·P7', nom: 'Verificar las áreas con los datos generales de planeamiento',
      porque: 'Al jugar cada CAP se ve si el área aguanta: tamaño, distancia de seguridad, distancia máxima de apoyo (DMA = (TD − TC) × V / 2) y el tonelaje que tiene que soportar el EPA.',
      recibe: ['sincroG3', 'caps'],
      hace: 'En el paso 2 del ▣ ASDI revisá lo medido y 🗺️ acostá las medidas en la carta: verde cumple, rojo no.',
      entrega: 'Lo medido de cada área (va a la evaluación).',
      abrir: { tab: 'asdi', paso: 2 } },
    { id: 'consumos-fase', fase: 4, pmtd: 'F4·P7', nom: 'Consumo, evacuación y transporte por fase',
      porque: 'En el Juego de Guerra, acción por acción, el G-4 registra cuánto se consume, cuántas bajas hay que evacuar y qué transporte hace falta: ahí aparecen los puntos críticos de cada CAP.',
      recibe: ['sincroG3', 'bajas', 'barreras'],
      hace: 'Rehacé 🧮 Cálculos con el efectivo y los días de cada fase; tocá cada instalación en la carta (📊 Tablero G-4) para ver consumo, vehículos y viajes; anotá los puntos críticos en tu apreciación.',
      entrega: 'Necesidades y puntos críticos por fase y por CAP.',
      abrir: { tab: 'calculo' } },

    { id: 'asdi-evaluar', fase: 5, pmtd: 'F5·P1', nom: 'Evaluar las áreas propuestas (factores de la Escuela)',
      porque: 'Se comparan las áreas con los factores de la Escuela —MANIOBRA, TERRENO, SEGURIDAD y SITUACIÓN LOGÍSTICA—: lo impositivo lo mide la Mesa, lo demás lo juzgás vos.',
      recibe: ['picb', 'caps'],
      hace: 'En el paso 3 del ▣ ASDI marcá cada casilla (✔ reúne el aspecto), con tus ideas, y escribí la conclusión.',
      entrega: 'La matriz de evaluación de las áreas y su conclusión (Word apaisado).',
      abrir: { tab: 'asdi', paso: 3 },
      hecho: function (ej) {
        var e = evalAreas(ej), n = 0
        Object.keys(obj(e.notas)).forEach(function (a) { Object.keys(obj(e.notas[a])).forEach(function (z) { if (obj(e.notas[a][z]).estado) n++ }) })
        return limpia(e.conclusion) || limpia(e.conclusionIA) ? ok(plural(n, 'casilla evaluada', 'casillas evaluadas') + ' y la conclusión') : no(n ? plural(n, 'casilla evaluada', 'casillas evaluadas') + '; falta la conclusión' : '')
      } },
    { id: 'ventajas', fase: 5, pmtd: 'F5·P1', nom: 'Ventajas y desventajas de cada CAP desde logística',
      porque: 'La pregunta que el Comandante espera contestada: desde logística, ¿este CAP se puede apoyar o no, y con qué costo?',
      recibe: ['normasEval', 'caps'],
      hace: 'Para cada CAP: ventajas, desventajas y si se puede apoyar, con las normas de evaluación del JEM.',
      entrega: 'F5·P1 Ventajas y desventajas (tu aporte a la matriz de decisión).',
      abrir: { tab: 'hojas', num: 'F5·P1', nom: /Ventajas y desventajas/i }, hecho: deHoja('decision') },

    { id: 'asdi-elegir', fase: 6, pmtd: 'F6·P1', nom: 'Elegir el área y desplegar el Batallón Logístico',
      porque: 'El área se elige para el CAP que aprobó el Comandante; adentro se despliegan las cinco compañías del Batallón Logístico y se adaptan al terreno.',
      recibe: ['decision'],
      hace: 'En el paso 4 del ▣ ASDI elegí el área (queda como ÁREA SERV. DIV.) y desplegá el Batallón Logístico.',
      entrega: 'El área de apoyo elegida y desplegada en el calco.',
      abrir: { tab: 'asdi', paso: 4 },
      hecho: function (ej) { var z = zonas(ej).filter(function (x) { return x && x.elegida })[0]; return z ? ok('Área ' + (z.propuesta || '') + ' elegida') : evalAreas(ej).elegida ? ok('Área ' + evalAreas(ej).elegida + ' elegida') : no() } },
    { id: 'ejes-definitivos', fase: 6, pmtd: 'F6·P2', nom: 'Ajustar el EPA y el EPE y pasar tu capa al G-3',
      porque: 'Con el CAP aprobado y el área elegida, los ejes quedan definitivos; el G-3 los necesita para el calco de operaciones.',
      recibe: ['decision'],
      hace: 'En ↔ Ejes corregí el EPA y el EPE si hace falta y bajá tu capa (G4) para el G-3.',
      entrega: 'Tu capa del G-4 para el calco de operaciones.',
      abrir: { tab: 'ejes', boton: /Bajar mi capa/i }, automatico: /Bajar mi capa/i },
    { id: 'riesgo', fase: 6, pmtd: 'F6·P3', nom: 'Riesgos de logística (actualización)',
      porque: 'El riesgo se actualiza con el CAP ya aprobado: un riesgo sin medida de control y sin responsable es sólo una preocupación.',
      recibe: ['decision', 'cae'],
      hace: 'Cada riesgo logístico con su probabilidad, gravedad, medida de control y quién la ejecuta (la SEGAR, los convoyes, el nivel de amenaza en la retaguardia).',
      entrega: 'F6·P3 Riesgos de logística.',
      abrir: { tab: 'hojas', num: 'F6·P3', nom: /Riesgos/i }, hecho: deHoja('riesgo') },

    { id: 'anexo', fase: 7, pmtd: 'F7·P1', nom: 'Anexo de Logística a la Orden General de Operaciones',
      porque: 'Es lo que SE DIFUNDE con la Orden: junta todo lo que hiciste (la misión de logística, el concepto por fase, el área, los ejes, las instalaciones) y tiene que decir lo mismo que la Orden.',
      recibe: ['opord', 'decision'],
      hace: '🌱 Traé del calco y de tus hojas, completá cada apartado y revisá contra la Orden del G-3 (fases, unidades, letras).',
      entrega: 'F7·P1 Anexo de Logística (Word con el formato militar).',
      abrir: { tab: 'hojas', num: 'F7·P1', nom: /Anexo de/i }, hecho: deHoja('anexo') },
    { id: 'matriz', fase: 7, pmtd: 'F7·P2', nom: 'Matriz de sincronización logística',
      porque: 'El producto final del G-4: las fases del CAP como columnas y, en cada una, la Zona de Etapas, el enfoque y la prioridad, el abastecimiento, la evacuación, el transporte, el mantenimiento y la amenaza en la retaguardia.',
      recibe: ['opord', 'fases'],
      hace: '🌱 Traé el concepto por fase y lo del calco; completá cada celda y bajá el Word apaisado.',
      entrega: 'F7·P2 Matriz de sincronización logística.',
      abrir: { tab: 'hojas', num: 'F7·P2', nom: /sincronización logística/i }, hecho: deHoja('matrizSinc') }
  ]

  // ─── el estado de la ruta ────────────────────────────────────────────────────────────
  // marcas: { [paso]: 1 } lo que el alumno marcó a mano («✓ Listo»).
  function estadoInsumo(ins, ej) {
    var r = ej ? ins.hay(ej) : no()
    if (r.ok) return { ok: true, de: 'mesa', det: r.det }
    var d = ej && docsEM(ej).filter(function (x) { return x.emSimulado.insumo === ins.id })[0]
    if (d) return { ok: true, de: 'em', det: '🤖 lo entregó el EM simulado', doc: d.nombre }
    return { ok: false, de: '', det: r.det || '' }
  }
  function estado(ej, marcas) {
    marcas = obj(marcas)
    var pasos = PASOS.map(function (p, i) {
      var a = ej && p.hecho ? p.hecho(ej) : null, m = !!marcas[p.id]
      return { p: p, n: i + 1, ok: !!((a && a.ok) || m), auto: !!(a && a.ok), manual: m, det: a ? a.det : '', insumos: p.recibe.map(function (id) { return { ins: INS[id], e: estadoInsumo(INS[id], ej) } }) }
    })
    var actual = null
    for (var i = 0; i < pasos.length; i++) if (!pasos[i].ok) { actual = pasos[i]; break }
    var hechos = pasos.filter(function (x) { return x.ok }).length
    return { pasos: pasos, actual: actual, fase: actual ? actual.p.fase : FASES.length, hechos: hechos, total: pasos.length, porFase: FASES.map(function (F) { var ps = pasos.filter(function (x) { return x.p.fase === F.id }); return { F: F, pasos: ps, hechos: ps.filter(function (x) { return x.ok }).length, insumos: insumosDeFase(F.id, ej) } }) }
  }
  function insumosDeFase(f, ej) { return INSUMOS.filter(function (i) { return i.fase === f }).map(function (i) { return { ins: i, e: estadoInsumo(i, ej) } }) }
  // lo que el EM simulado puede entregar en la fase f: lo que falta de esa fase y de las anteriores
  function faltantes(f, ej) { return INSUMOS.filter(function (i) { return i.fase <= f && i.simulable !== false && !estadoInsumo(i, ej).ok }) }

  // ─── 🤖 el Estado Mayor simulado ─────────────────────────────────────────────────────
  // op: { contexto: el ejercicio en texto (ia-profesor.js · contexto), unidad }
  function nombreUnidad(ej) {
    var uc = obj(obj(ej && ej.ops).unidadConsiderada)
    return limpia(uc.nombre) || limpia(obj(ej && ej.ordenSup).unidad) || 'la unidad del ejercicio'
  }
  // ─── 🪖 las unidades que el G-3 despliega en la carta (18-10-2026) ──────────────────────
  // Sergio: «no se ven las unidades que se supone que el G-3 ya debería haber desplazado… mis unidades
  // todavía no se disgregaron, siguen como Cuerpo de Ejército». El EM simulado escribía sólo texto:
  // ahora el G-3 devuelve también las unidades del CAP 1 con su lugar, y la Mesa las pone en la carta
  // (las que ya están, con la misma designación, se MUEVEN; las demás se agregan).
  var ARMAS_TXT = 'infanteria, mecanizada, motorizada, andina, selva, caballeria, cabmec, blindada, artilleria, antiaerea, ingenieria, comunicaciones, aviacion, logistica, sanidad, transporte, mantenimiento, inteligencia, policiamilitar, antitanque'
  var ESCALONES_TXT = 'compania, batallon, regimiento, brigada, division, cuerpo'
  function pedidoFichas(ins, u) {
    return '## Las unidades en la carta (lo hace el G-3)\n' +
      'El G-4 tiene que VER la maniobra en la carta. Al final de la entrega `' + ins.id + '`, después del texto, agregá UN bloque ```json con las unidades propias SUBORDINADAS de ' + u + ' (un escalón abajo —divisiones o brigadas— y las de apoyo de combate de la organización de la tarea; NO la propia ' + u + ' entera), cada una DONDE LA PONE EL CAP 1 al iniciar la operación (su zona de reunión o su posición de la formación inicial), DENTRO del Área de Operaciones y con coordenadas decimales (WGS84):\n\n' +
      '```json\n{"fichas":[{"designacion":"1ra. DIV.","bando":"propias","arma":"infanteria","escalon":"division","lat":-17.1234,"lng":-65.4321,"cap":1}]}\n```\n\n' +
      '- `designacion`: la de la Orden / la organización de la tarea. Si la unidad YA está en la carta (ver «Unidades» en el CONTEXTO), usá EXACTAMENTE su designación: la Mesa la mueve, no la duplica.\n' +
      '- `arma`: una de ' + ARMAS_TXT + '. `escalon`: uno de ' + ESCALONES_TXT + '.\n' +
      '- Sólo las del CAP 1 (`"cap":1`); el CAP 2 va descripto en el texto de su bosquejo.\n' +
      '- Nada logístico propio del G-4 (ni áreas de apoyo, ni ejes, ni instalaciones logísticas).\n\n'
  }
  function claveDesig(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '') }
  // los bloques ```json de una entrega → la lista cruda de unidades (designacion, bando, arma, escalon, lat, lng)
  function unidadesDelTexto(t) {
    var out = [], re = /```(?:json)?\s*([\s\S]*?)```/gi, m
    while ((m = re.exec(t))) {
      var x = null
      try { x = JSON.parse(m[1]) } catch (e) { continue }
      var l = Array.isArray(x) ? x : obj(x).fichas || obj(x).unidades || []
      lista(l).forEach(function (v) {
        v = obj(v)
        var lat = num(v.lat), lng = num(v.lng != null ? v.lng : v.lon)
        if (!limpia(v.designacion || v.nombre) || !isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return
        if (v.cap != null && +v.cap !== 1) return
        out.push({ designacion: limpia(v.designacion || v.nombre), bando: v.bando || 'propias', arma: limpia(v.arma).toLowerCase(), escalon: limpia(v.escalon).toLowerCase(), lat: lat, lng: lng })
      })
    }
    return out
  }
  function num(x) { return x == null || String(x).trim() === '' ? NaN : +x } // null o '' no son 0°
  function sinJSON(t) { return String(t || '').replace(/```(?:json)?\s*[\s\S]*?```/gi, '').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') }
  // fichas (ya en la forma de la Mesa) contra las unidades de la carta: las propias con la misma
  // designación se MUEVEN (id + lugar nuevo); las demás son nuevas. Nunca se tocan las enemigas.
  function desplegar(fichas, unidades) {
    var porClave = {}
    propias({ unidades: unidades }).forEach(function (x) { var k = claveDesig(x.designacion); if (k && !porClave[k]) porClave[k] = x })
    var mover = [], nuevas = [], vistas = {}
    lista(fichas).forEach(function (f) {
      var k = claveDesig(f && f.designacion)
      if (!k || vistas[k]) return
      vistas[k] = 1
      var ya = /enem|rojo/i.test(f.bando || '') ? null : porClave[k]
      if (ya) mover.push({ id: ya.id, designacion: ya.designacion, lat: f.lat, lng: f.lng, de: { lat: ya.lat, lng: ya.lng } })
      else nuevas.push(f)
    })
    return { mover: mover, nuevas: nuevas }
  }

  // ─── 📣 el parte del Estado Mayor: qué terminó cada sección y qué te deben ─────────────────
  // Sergio: «debería salir un mensaje diciendo: el G-2 ya terminó esto, el G-3 ya terminó esto, para
  // saber que todo avanza… quiero que aprenda dónde, cuándo y con qué insumos de los otros entra».
  // Por sección (en el orden de DE): lo que ya entregó, lo que te debe hasta tu fase y lo que entrega
  // más adelante; cada insumo con el paso en que lo vas a usar (desde el que sigue).
  function usoDesde(id, desde) {
    for (var k = 0; k < PASOS.length; k++) if (k + 1 >= desde && PASOS[k].recibe.indexOf(id) >= 0) return { n: k + 1, p: PASOS[k] }
    return null
  }
  function parteEM(ej, marcas) {
    var E = estado(ej, marcas), desde = E.actual ? E.actual.n : PASOS.length + 1
    return Object.keys(DE).map(function (de) {
      var it = INSUMOS.filter(function (i) { return i.de === de }).map(function (i) { return { ins: i, e: estadoInsumo(i, ej), uso: usoDesde(i.id, desde) } })
      if (!it.length) return null
      return {
        de: de, S: DE[de],
        listos: it.filter(function (x) { return x.e.ok }),
        deben: it.filter(function (x) { return !x.e.ok && x.ins.fase <= E.fase }),
        luego: it.filter(function (x) { return !x.e.ok && x.ins.fase > E.fase })
      }
    }).filter(Boolean)
  }
  // ¿Dónde entrás? Lo que el paso de ahora necesita y lo que ya es de tu fase pero usás MÁS ADELANTE
  // (p. ej., en la F3·P1 todavía no van los CAP: el G-3 los arma después de la potencia relativa).
  function entrada(E, ej) {
    var A = E && E.actual
    if (!A) return null
    var despues = INSUMOS.filter(function (i) { return i.fase === A.p.fase && A.p.recibe.indexOf(i.id) < 0 }).map(function (i) { return { ins: i, e: estadoInsumo(i, ej), uso: usoDesde(i.id, A.n + 1) } })
      .filter(function (x) { return x.uso && x.uso.p.fase === A.p.fase && !x.e.ok })
    return { paso: A, necesita: A.insumos, despues: despues }
  }

  function pedidoEM(f, ej, op) {
    op = op || {}
    var F = FASES[f - 1], lis = faltantes(f, ej), u = op.unidad || nombreUnidad(ej)
    if (!F || !lis.length) return ''
    var ya = docsEM(ej), conFichas = lis.filter(function (i) { return i.fichas }).slice(-1)[0]
    return '# PEDIDO DE TRABAJO PARA LA IA — LEÉ ESTO PRIMERO\n\n' +
      'Sos el **ESTADO MAYOR SIMULADO** de **' + u + '** (el Comandante, el JEM, el G-1, el G-2, el G-3 y el G-5) en un ejercicio de Escuela (ECEME). ' +
      'Hay UN solo alumno: es el **G-4 (Logística)** y está aprendiendo a planificar siguiendo el PMTD. Lo que escribís es lo que sus compañeros del Estado Mayor (y el escalón superior, si falta) le ENTREGAN al llegar a la **FASE ' + F.id + ' · ' + F.nom + '**, para que él pueda hacer su trabajo.\n\n' +
      '## Regla de oro\n' +
      '- Escribí SÓLO lo que te pido abajo, como lo entregaría cada sección, con datos concretos de ESTE ejercicio: las unidades, los lugares y las coordenadas de la carta, los días (D-x / D+x) de la Orden.\n' +
      '- **NO hagas el trabajo del G-4**: nada de áreas de apoyo logístico propias (ASDI), EPA ni EPE propios, cálculos de abastecimiento, concepto de apoyo, apreciación, anexo ni matriz de logística. Si un producto necesita algo logístico, escribí «(lo determina el G-4)».\n' +
      '- Coherente con la Orden del escalón superior y con lo que el EM simulado ya entregó' + (ya.length ? ' (está en los documentos del ejercicio que empiezan con «EM SIMULADO»: ' + ya.map(function (d) { return '«' + limpia(d.nombre).replace(/\.md$/, '') + '»' }).join(', ') + ')' : '') + ': mismos nombres, mismas fases, mismas designaciones.\n' +
      '- Si falta un dato, inventalo verosímil para ESTE terreno y ESTE escalón y marcalo «(supuesto)».\n' +
      '- Si el texto te llega cortado, contestá igual con lo que tengas.\n\n' +
      '## Lo que tenés que entregar\n' + lis.map(function (i, k) { return (k + 1) + '. `' + i.id + '` — **' + DE[i.de].corto + ' · ' + i.nom + '**' + (i.fase < f ? ' (es de la fase ' + i.fase + ' y todavía no está)' : '') + ': ' + i.pide }).join('\n') + '\n\n' +
      (conFichas ? pedidoFichas(conFichas, u) : '') +
      '## Cómo contestar\nUn bloque por producto, en ese orden, cada uno empezando con su línea de marca EXACTA (y nada antes de la primera marca ni después del último documento: ni saludos, ni preguntas, ni ofrecimientos):\n\n' +
      lis.map(function (i) { return '=== ENTREGA: ' + i.id + ' ===\n(' + DE[i.de].corto + ' · ' + i.nom + ': el documento en Markdown, en español militar, con la forma de la Escuela y cuadros donde haga falta)' + (i === conFichas ? '\n(y al final, el bloque ```json con las unidades desplegadas)' : '') }).join('\n\n') + '\n\n' +
      '---\n\n# CONTEXTO DEL EJERCICIO (lo que ya hay en la Mesa)\n\n' + (op.contexto || '(la Mesa no mandó el ejercicio)') + '\n\n---\n' +
      'RECORDATORIO: sos el Estado Mayor simulado de ' + u + ' y entregás al G-4 lo de la fase ' + F.id + ' (' + lis.map(function (i) { return i.id }).join(', ') + '), con las marcas «=== ENTREGA: … ===»' + (conFichas ? ', y al final de `' + conFichas.id + '` el bloque ```json con las unidades del G-3 desplegadas en la carta' : '') + '. No hagas el trabajo del G-4.\n'
  }
  // → { entregas: [{ insumo, texto, unidades }], desconocidos: [id…] } (unidades: las del bloque ```json, sólo
  // en las entregas del G-3 que despliegan; el texto queda sin el bloque)
  function leerEntregas(texto) {
    var t = String(texto || '').replace(/\r\n?/g, '\n'), re = /^[ \t>*#]*={2,}\s*ENTREGA\s*:\s*`?([\w-]+)`?\s*={2,}[ \t*]*$/gim, m, marcas = []
    while ((m = re.exec(t))) marcas.push({ id: m[1], ini: m.index, fin: re.lastIndex })
    var entregas = [], desconocidos = []
    marcas.forEach(function (x, k) {
      var cuerpo = t.slice(x.fin, k + 1 < marcas.length ? marcas[k + 1].ini : t.length).replace(/^\s*\n/, '').replace(/\s+$/, '')
      var id = INSUMOS.filter(function (i) { return i.id.toLowerCase() === x.id.toLowerCase() })[0]
      if (!id || id.simulable === false) { desconocidos.push(x.id); return }
      var us = id.fichas ? unidadesDelTexto(cuerpo) : []
      if (id.fichas) cuerpo = sinJSON(cuerpo)
      if (!tieneTexto(cuerpo) && !us.length) return
      entregas = entregas.filter(function (e) { return e.insumo !== id.id }).concat([{ insumo: id.id, texto: cuerpo, unidades: us }])
    })
    return { entregas: entregas, desconocidos: desconocidos }
  }
  function nombreDoc(ins) { return 'EM SIMULADO · F' + ins.fase + ' · ' + DE[ins.de].corto + ' · ' + ins.nom + '.md' }
  // los documentos que se adjuntan al ejercicio (la IA de las hojas del G-4 los lee en el expediente)
  function documentos(entregas, ej) {
    var u = nombreUnidad(ej)
    return lista(entregas).map(function (e) {
      var ins = INS[e.insumo], F = FASES[ins.fase - 1], sup = ins.de === 'sup'
      var cab = 'EM SIMULADO — ' + (sup ? 'DEL ESCALÓN SUPERIOR' : 'ENTREGA DEL ' + DE[ins.de].corto.toUpperCase() + ' (' + DE[ins.de].nom.toUpperCase() + ')') + ' AL G-4 · FASE ' + F.id + ' (' + F.nom.toUpperCase() + ')\n' +
        ins.nom.toUpperCase() + '\n' +
        '(Producto del Estado Mayor simulado de ' + u + ': lo escribió la IA para que el G-4 practique. ' + (sup ? 'Hace las veces del documento del escalón superior.' : 'NO es la Orden del escalón superior.') + ')\n\n'
      var us = lista(e.unidades), pie = us.length ? '\n\nUNIDADES DESPLEGADAS EN LA CARTA POR EL G-3 (CAP 1, al iniciar la operación):\n' + us.map(function (x) { return '- ' + x.designacion + (x.arma || x.escalon ? ' (' + [x.arma, x.escalon].filter(Boolean).join(', ') + ')' : '') + ': ' + (Math.round(x.lat * 1e4) / 1e4) + ', ' + (Math.round(x.lng * 1e4) / 1e4) }).join('\n') : ''
      return { nombre: nombreDoc(ins), mime: 'text/plain', tipo: 'texto', texto: cab + e.texto + pie, base64: null, paginas: 0, categoria: sup ? 'orden' : 'bases', emSimulado: { insumo: ins.id, fase: ins.fase, de: ins.de } }
    })
  }

  return {
    DE: DE, INSUMOS: INSUMOS, PASOS: PASOS, FASES: FASES, insumo: function (id) { return INS[id] || null },
    estado: estado, estadoInsumo: estadoInsumo, insumosDeFase: insumosDeFase, faltantes: faltantes,
    pedidoEM: pedidoEM, leerEntregas: leerEntregas, documentos: documentos, nombreDoc: nombreDoc, nombreUnidad: nombreUnidad,
    parteEM: parteEM, entrada: entrada, desplegar: desplegar, unidadesDelTexto: unidadesDelTexto, usoDesde: usoDesde,
    tieneTexto: tieneTexto, esc: esc
  }
})
