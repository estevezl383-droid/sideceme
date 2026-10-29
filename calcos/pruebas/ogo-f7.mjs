// 📜 La Orden General de Operaciones (F7·P1 del G-3) con la forma de la Escuela — orden-operaciones/v1/ogo.mjs y el
// compilado vigente (index-ogo-20261029.js), con sus funciones REALES (ev, Qoe, l3e, MS, Soe):
//   · la hoja tiene las casillas del modelo (OBJETO, CARTAS, ANEXOS, ORGANIZACIÓN DE LA TAREA, I.- a V.-), sin el
//     aviso que mandaba a otro documento, con la guía del PMTD y la ayuda de la IA con lo que ya tiene la Mesa;
//   · 🌱 trae lo que trabajó todo el Estado Mayor (misión, intención inextensa, CAP aprobado con sus fases, tareas de
//     cada unidad, RCIC, riesgo, concepto de apoyo…) y no pisa lo escrito;
//   · lo guardado con las claves de antes (la F7·P1 que bajó Sergio el 27-10-2026) pasa a las de ahora;
//   · el Word: sin «Encabezamiento» ni «III. I.- SITUACIÓN», el cuadro de la organización, la intención inextensa,
//     las tareas 1.- / a.-, las instrucciones numeradas, la firma, «G-3» y la distribución a las unidades.
//   node ogo-f7.mjs [carpeta donde dejar el .docx]
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const DIR = path.dirname(fileURLToPath(import.meta.url))
const { vigente } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')
const { ejercicioDivmec } = require('./conceptos-divmec.js')
const O = await import('../orden-operaciones/v1/ogo.mjs')
const VIG = vigente()
const SRC = fs.readFileSync(VIG, 'utf8')
const SALIDA = process.argv[2] || path.join(DIR, 'salidas-ogo-f7')

// ─── El ejercicio (FICT.) ──────────────────────────────────────────────────────────────────────────────────────
function ejercicio() {
  const e = ejercicioDivmec()
  e.unidad = 'DIVMEC-1'
  Object.assign(e.ordenSup, {
    unidad: 'DIVMEC-1',
    carta: 'Especial Calacoto (FICT.), Esc. 1:50.000.',
    concepto: 'El CE-I defiende en dos escalones (FICT.).',
    coordinacion:
      'Prohibición total del uso de minas antipersonal (Convención de Ottawa). Se evitará la contaminación de las aguas del RÍO DESAGUADERO (FICT.). El nivel de amenaza actual en el área de retaguardia es Nivel II. Desplazamientos de convoyes exclusivamente nocturnos (FICT.).',
    comunicaciones: 'IEC «OMEGA» (FICT.) en vigor a partir del día D-14 (1800).',
  })
  e.g3 = {
    mision: { 'ENUNCIADO COMPLETO DE LA MISIÓN': 'La DIV.MEC.-1 defiende y destruye a la DIVISIÓN ACORAZADA de RAGNAR (FICT.), a partir del día D (0500) al D+2 (1800) en su Área de Operaciones, con el propósito de detener la progresión enemiga hacia la Zona del Interior.' },
    concepto: {
      'Forma de maniobra elegida y por qué': 'una Defensa Móvil',
      'Reserva: composición, ubicación y plazo de empleo': 'RCB-1 «CALAMA» (FICT.) en la Cmdad. Arhuanamina, se empeña en la FASE II',
      'Fuegos: tarea esencial de apoyo de fuegos': 'Neutralizar la artillería de la DIV. ACORAZADA (FICT.) con el propósito de evitar que interfiera con la defensa',
      'Movilidad / contramovilidad / supervivencia (plan de barreras)': 'Prioridad de esfuerzo a la contramovilidad, fajas de minas AT delante de la LPR',
      'Riesgo aceptado': 'que el enemigo eluda el AE VULCAN por el norte',
    },
    rcic: [
      { 'Tipo (RCIC / EEIA)': 'RCIC', Requerimiento: '¿Adelantará el enemigo su artillería de campaña?' },
      { 'Tipo (RCIC / EEIA)': 'RCIC', Requerimiento: 'Informar cuando las unidades de maniobra bajen al 80% de eficiencia' },
      { 'Tipo (RCIC / EEIA)': 'EEIA', Requerimiento: 'Ubicación de los puestos comando de la División' },
    ],
    controlOrden: { 'Tipo de orden (Orden de Operaciones · Plan de Operaciones · Orden Parcial)': 'Orden de Operaciones', 'Tipo de ensayo (completo · reducido · sobre maqueta · sobre carta · de mando)': 'De comprobación y repetición de órdenes el D-5 (0700) en el PCP' },
    limitaciones: { a: ['No cruzar la LDE-1 sin autorización (FICT.)'], b: ['Ocupar las posiciones a más tardar el D-3 (1800)'] },
    orgTarea: [
      { Agrupación: 'RCB-1 «CALAMA» (OD)', Unidad: 'Edrón. Tq. «A»; Edrón. Tq. «B»; ERM. «D»' },
      { Agrupación: 'RIM-8 «AYACUCHO» (OC1)', Unidad: 'Comp. Inf. Mec. «A»; Comp. Inf. Mec. «B»' },
      { Agrupación: 'RAM-2 «BOLÍVAR»', Unidad: 'RAM-2 «BOLÍVAR»', 'Relación de comando (O / AD / AG / R)': 'AG' },
    ],
    riesgoFinal: { esquema: 'riesgo-v2', tareas: [{ id: 't1', tarea: 'Defensa', peligros: [{ id: 'p1', peligro: 'Fratricidio', controles: ['Coordinar la dirección y el traslado de los fuegos con las unidades adyacentes'] }] }] },
  }
  e.fasesCOA = {
    propio: [
      { nombre: 'PREPARACIÓN', unidades: [{ tipo: 'unidad', designacion: 'RIM-8 «AYACUCHO»', tarea: 'Ocupa y establece sus posiciones defensivas entre la Ecia. Chojllo Kheri y la Ecia. Tankhara', proposito: 'Estar en condiciones de defender la LPR' }, { tipo: 'unidad', designacion: 'RCB-1 «CALAMA»', tarea: 'Ocupa posiciones en la zona de despliegue', proposito: 'Constituirse en la reserva' }, { tipo: 'unidad', designacion: 'RAM-2 «BOLÍVAR»', arma: 'artilleria', tarea: 'Ocupa sus posiciones de tiro', proposito: 'Apoyar con sus fuegos a la OC1' }] },
      { nombre: 'DESTRUCCIÓN', unidades: [{ tipo: 'unidad', designacion: 'RCB-1 «CALAMA»', principal: true, tarea: 'Ataca y destruye a las unidades canalizadas en el AE VULCAN', proposito: 'Impedir su progresión' }] },
    ],
  }
  e.hojasG = {
    cmte: {
      intencion: { 'Propósito ampliado': 'Detener la progresión de RAGNAR hacia la Zona del Interior de ORIÓN (FICT.)', 'Tareas clave': '- Realizar trabajos de organización del terreno en nuestro sector\n- Defender la LPR desde los Centros de Resistencia', 'Estado Final Deseado': 'la DIV.MEC.-1 habrá impedido la progresión enemiga, la DIV. ACORAZADA habrá sido destruida y nos encontraremos en condiciones de continuar con operaciones ofensivas con orden' },
    },
  }
  e.conceptoApoyo = [{ nombre: 'PREPARACIÓN', enfoque: ['cl1', 'cl3', 'cl5'], prioridad: 'RIM-8 «AYACUCHO»' }, { nombre: 'DESTRUCCIÓN', enfoque: ['cl3', 'cl5'], prioridad: 'RCB-1 «CALAMA»' }]
  e.misionLog = 'Los elementos de apoyo de servicio de combate proporcionan apoyo logístico del D-15 al D+2 (FICT.).'
  e.unidades.push({ id: 'pc1', tipo: 'pc', designacion: 'PCP DIVMEC-1', bando: 'propio', lat: -16.95, lng: -68.4 })
  return e
}
// La F7·P1 que le bajó la Mesa a Sergio (27-10-2026), con las claves de ANTES: lo escrito no se pierde.
const ANTES = {
  OBJETO: 'Emitir la Orden General de Operaciones N° 01/26 del I Cuerpo de Ejército (CE-I) para la conducción de la Operación Defensiva de Área en el AO LAUCA.',
  CARTA: 'TRITÓN, Esc. 1:250.000 (hojas CORQUE y SABAYA).',
  ANEXOS: 'Anexo "A" (Calco de Operaciones), Anexo "B" (Plan de Inteligencia), Anexo "C" (Plan de Apoyo de Fuegos), Anexo "G" (Plan de Logística).',
  'Organización de la tarea': '1. Agrupación Táctica OD (DIV MEC-2): DIV MEC-2 (orgánica), BATING MEC-2, BAT. LOG-II\n2. Agrupación Táctica OC 1 (DIV-1): DIV-1 (orgánica), RAC-1',
  'A. Fuerzas enemigas': 'SATURNO emplea contra TRITÓN su Fuerza Terrestre en dos divisiones de ejército en primer escalón.',
  'A.1 Curso de acción más PROBABLE': 'A partir del D hora H (0400), SATURNO ataca en dos escalones por la Avenida de Aproximación Principal AA-1.',
  'A.2 Curso de acción más PELIGROSO': 'La VI División de Ejército hace su esfuerzo principal hacia LA PAZ.',
  'B. Fuerzas propias': '1. Escalón Superior (FF.TT.T.O.): Defienden entre la LDE-1 y la LDE-2 del D (0400) al D+15 (1800).\n2. Unidades Adyacentes: Al Norte, la DIV MEC-1 defiende TAMBO QUEMADO.',
  'C. Refuerzos y reducciones': '1. Refuerzos: La DIV-1 y la DIV-6 se incorporan al CE-I entre el D-30 y el D-15.\n2. Reducciones: No se registran reducciones.',
  'D. Hipótesis (sólo en el PLAN de operaciones)': 'N/A — Se emite ORDEN DE OPERACIONES.',
  Misión: 'El I Cuerpo de Ejército (CE-I) defiende el AO LAUCA a partir del D (04 de diciembre de 2026 a las 0400) y hasta el D+15, con el propósito de impedir que las fuerzas de SATURNO penetren por el valle del río LAUCA.',
  'Intención del Comandante': 'Propósito: Detener al primer escalón de la VI División de Ejército de SATURNO al oeste de la LDE-2. Punto decisivo: El desfiladero del río LAUCA en UNGALLIRE – GUATA. Tareas clave: Fijar al primer escalón enemigo al oeste de la LF «PUMA»; consolidar el plan de barreras (ZO-1); mantener enlaces con DIV MEC-1 y CE-II. Estado final: La 1ª Brigada Acorazada «CORACEROS» detenida y desgastada al oeste de la LF «PUMA»; el CE-I con su poder de combate preservado sobre la LDE-2.',
  'A. Concepto de la operación': 'Operación defensiva de área ejecutada en dos escalones y cuatro fases operacionales.',
  'A.1 Maniobra': 'En primer escalón, la DIV MEC-2 (esfuerzo principal) retiene la LF «PUMA».',
  'A.2 Apoyo de fuegos': 'Medios disponibles: RES (alcance 23 km).',
  'A.5 Ingenieros': 'Plan de barreras: 13 trabajo(s), 479 h de trabajo.',
  'B. Tareas de las unidades de maniobra': 'Agrupación (OD): Atacar con Fuego.\nAgrupación (OC1): Canalizar.',
  'D. Instrucciones de coordinación': '1. La orden entra en vigor a su recepción; Fase I en ejecución.\n2. Puntos de Contacto obligatorios: PC-1 y PC-2 con la DIV MEC-1.\n6. Ensayo de Comandantes: D-5 a las 0900 horas en el PC de CHALLAPATA.',
}

let calcoVivo = {}
const G = { SIDGuiaCalco: () => calcoVivo, SIDCapDocs: () => ({ nomenclator: [], catalogos: {} }) }
const C = cargarConDependencias(VIG, ['ev', 'Qoe', 'l3e', 'MS', 'Soe', 'VM'], (c) => {
  c.MS({})
  c.MS({ recepcion: '2026-10-20T09:00', inicioOperacion: '2026-12-04T04:00' })
  const e = ejercicio()
  c.l3e('opord', e)
  c.l3e('SIDopordViejo', { ...e, picb: { ht18: { _marca: { 'CAE-1': 'MÁS PROBABLE' } }, cae: { Misión: 'x' } }, ops: { ...e.ops, limites: [{}] } })
  c.l3e('opord', { ...e, g3: { ...e.g3, opord: ANTES } })
  c.Soe(c.VM('opord'))
  calcoVivo = e
  void c.VM('opord').ayudaIA
  calcoVivo = {}
}, G)

let fallos = 0
const casos = []
const caso = (n, f) => casos.push([n, f])

caso('la F7·P1 del Tablero del G-3: las casillas del modelo de la Escuela, sin el aviso que mandaba a otro documento', () => {
  const h = C.ev.flatMap((f) => f.hojas).find((x) => x.id === 'opord')
  assert.equal(h.num, 'F7·P1')
  assert.equal(h.tipo, 'campos')
  assert.deepEqual(h.campos, O.CAMPOS)
  assert.equal(h.campos[0], 'OBJETO')
  assert.equal(h.campos[1], 'CARTAS', '«CARTAS» (y no «CARTA»): así la hoja no se confunde con una Orden Preparatoria (woe)')
  assert.ok(!h.campos.some((k) => /^A\.\d|Encabezamiento/.test(k)), 'sin las claves de antes')
  assert.equal(h.remite, undefined, 'sin «La OPORD completa… se baja desde Mesa EM»')
  assert.equal(h.autollena, 'opord')
  assert.ok(Array.isArray(h.anexos) && h.anexos.length, 'la lista de anexos que puede llevar sigue')
  assert.equal(h.grupoCampos['I.- A.- 1.- Curso de acción más probable'], 'I.- SITUACIÓN')
  assert.match(h.ayudaCampos['III.- Intención del Comandante'], /INEXTENSA/)
  assert.equal(C.Soe(C.VM('opord')), true, 'el botón del Word militar sigue')
  assert.ok(!SRC.includes('remite:"opord"'))
})

caso('📘 la guía y 🤖 la ayuda de la IA: el formato de la Escuela y lo que la Mesa ya tiene', () => {
  assert.equal(C.Qoe.opord, O.GUIA)
  assert.match(O.GUIA.para, /CINCO PÁRRAFOS/)
  calcoVivo = ejercicio()
  const h = C.ev.flatMap((f) => f.hojas).find((x) => x.id === 'opord')
  const a = h.ayudaIA
  assert.ok(a.startsWith(O.AYUDA_IA))
  assert.match(a, /LO QUE LA MESA YA TIENE PARA CADA APARTADO/)
  assert.match(a, /## III\.- Intención del Comandante\nMi intención es detener la progresión de RAGNAR/)
  assert.match(a, /NO la escribas como «Propósito: … Tareas clave: … Estado final: …»/)
  const copia = C.VM('opord')
  assert.ok(copia.ayudaIA.includes('LO QUE LA MESA YA TIENE'), 'también en la copia (VM)')
  calcoVivo = {}
})

caso('🌱 (l3e real) trae lo que trabajó el Estado Mayor, cada cosa en su casilla', () => {
  const e = ejercicio()
  calcoVivo = { hojasG: e.hojasG, conceptoApoyo: e.conceptoApoyo, misionLog: e.misionLog }
  // Como en el Tablero del G-3: el contexto no trae las hojas de las otras secciones ni el concepto de apoyo; salen del
  // calco vivo del motor del Estado Mayor (SIDGuiaCalco).
  const { hojasG, conceptoApoyo, misionLog, ...delTablero } = e
  const s = C.l3e('opord', delTablero)
  calcoVivo = {}
  assert.equal(s.OBJETO, 'La DIVMEC-1 en la ejecución de Operaciones Defensivas.')
  assert.equal(s.CARTAS, 'Especial Calacoto (FICT.), Esc. 1:50.000.')
  assert.match(s.ANEXOS, /^“A” Calco de Operaciones\.\n“B” Inteligencia\.\n“C” Apoyo de Fuegos\./)
  assert.match(s['ORGANIZACIÓN DE LA TAREA'], /^RCB-1 «CALAMA» \(OD\): Edrón\. Tq\. «A»; Edrón\. Tq\. «B»; ERM\. «D»\nRIM-8 «AYACUCHO» \(OC1\): Comp\. Inf\. Mec\. «A»/)
  assert.match(s['ORGANIZACIÓN DE LA TAREA'], /BAJO CONTROL: Comp\. Av\. Ejto\. «LIMA»/)
  assert.match(s['I.- B.- Fuerzas propias'], /I CUERPO DE EJÉRCITO:\n- Misión: El I CUERPO DE EJÉRCITO defiende y derrota/)
  assert.match(s['I.- B.- Fuerzas propias'], /- Concepto de la operación: El CE-I defiende en dos escalones/)
  assert.match(s['I.- B.- Fuerzas propias'], /Unidades adyacentes:\n- La DIVMEC-2 defiende en el sector ESTE/)
  assert.match(s['II.- MISIÓN'], /^La DIV\.MEC\.-1 defiende y destruye/)
  assert.equal(
    s['III.- Intención del Comandante'],
    'Mi intención es detener la progresión de RAGNAR hacia la Zona del Interior de ORIÓN (FICT.), para esto es clave:\n- Realizar trabajos de organización del terreno en nuestro sector.\n- Defender la LPR desde los Centros de Resistencia.\nAl finalizar la operación, la DIV.MEC.-1 habrá impedido la progresión enemiga, la DIV. ACORAZADA habrá sido destruida y nos encontraremos en condiciones de continuar con operaciones ofensivas con orden.',
  )
  const c = s['III.- A.- Concepto de la operación']
  assert.match(c, /^Cumpliremos la misión mediante la ejecución de una Defensa Móvil\./)
  assert.match(c, /La operación se ejecutará en las siguientes fases:\nFASE I \(PREPARACIÓN\)\.\nFASE II \(DESTRUCCIÓN\)\./)
  assert.match(c, /El riesgo que se acepta es que el enemigo eluda el AE VULCAN/)
  const m = s['III.- A.- 1.- Maniobra']
  assert.match(m, /^FASE I \(PREPARACIÓN\):\n- El RIM-8 «AYACUCHO» \(OC-1\) ocupa y establece sus posiciones defensivas.*con el propósito de estar en condiciones de defender la LPR\./)
  assert.match(m, /FASE II \(DESTRUCCIÓN\):\n- El RCB-1 «CALAMA» \(OD\), esfuerzo principal, ataca y destruye/)
  assert.ok(!/RAM-2/.test(m), 'la artillería no va en la maniobra: va en C.-')
  assert.match(s['III.- A.- 2.- Fuegos'], /^Neutralizar la artillería de la DIV\. ACORAZADA/)
  assert.match(s['III.- A.- 2.- b.- Apoyo de artillería de campaña'], /Organización de la Artillería para el Combate:\n- RAM-2 «BOLÍVAR» : AG/)
  assert.match(s['III.- A.- 5.- Ingenieros'], /contramovilidad/)
  assert.match(s['III.- B.- Tareas de las unidades de maniobra'], /RCB-1 «CALAMA» \(OD\):\n- Ocupa posiciones en la zona de despliegue, con el propósito de constituirse en la reserva\.\n- Ataca y destruye/)
  assert.match(s['III.- C.- Tareas de las unidades de apoyo de combate'], /^RAM-2 «BOLÍVAR»:\n- Ocupa sus posiciones de tiro, con el propósito de apoyar con sus fuegos a la OC1\./)
  const d = s['III.- D.- Instrucciones de coordinación']
  const r = d.split('\n')
  assert.equal(r[0], 'La presente orden entra en vigor a partir de su emisión.')
  assert.ok(r.includes('Requerimientos críticos de información del Comandante:'))
  assert.ok(r.includes('- Requerimientos prioritarios de inteligencia (RPI): ¿Adelantará el enemigo su artillería de campaña?'))
  assert.ok(r.some((x) => /^- Requerimientos de información de la fuerza amiga \(RIFA\): Informar cuando las unidades de maniobra bajen al 80%/.test(x)))
  assert.ok(r.includes('Elementos esenciales de información amiga:'))
  assert.ok(r.includes('Medidas de control para la reducción de riesgos:') && r.some((x) => /Coordinar la dirección y el traslado de los fuegos/.test(x)))
  assert.ok(r.includes('Reglas de enfrentamiento:') && r.some((x) => /Ottawa/.test(x)))
  assert.ok(r.includes('Consideraciones ambientales:') && r.some((x) => /RÍO DESAGUADERO/.test(x)))
  assert.ok(r.some((x) => /^Ensayo: De comprobación y repetición de órdenes el D-5 \(0700\)/.test(x)))
  assert.ok(r.some((x) => /Nivel II/.test(x)))
  assert.ok(r.includes('Restricciones:') && r.includes('- No cruzar la LDE-1 sin autorización (FICT.).'))
  assert.match(s['IV.- A.- Concepto de apoyo'], /En la FASE I \(PREPARACIÓN\), el enfoque de apoyo logístico será de Clase I, Clase III y Clase V, con prioridad de apoyo a RIM-8 «AYACUCHO»\./)
  assert.match(s['V.- A.- Comando'], /^Sucesión de mando:\n- Comandante de la DIVMEC-1\.\n- Jefe de Estado Mayor de la DIVMEC-1\.\n- G-3 de la DIVMEC-1\.\n- Comandante del RCB-1 «CALAMA»\./)
  assert.match(s['V.- A.- Comando'], /Puestos comando:\n- PCP DIVMEC-1 \(Coord\. -16\.9500, -68\.4000\)\./)
  assert.match(s['V.- B.- Comunicaciones'], /IEC «OMEGA»/)
  for (const v of Object.values(s)) assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(v), 'sin emojis en lo que va al Word')
})

caso('🌱 no pisa lo escrito, y lo escrito con las claves de antes pasa a su casilla nueva', () => {
  const e = ejercicio()
  e.g3.opord = { ...ANTES }
  const s = C.l3e('opord', e)
  assert.equal(s['II.- MISIÓN'], ANTES.Misión, 'lo que ya estaba escrito manda sobre lo de la Mesa')
  assert.equal(s.OBJETO, ANTES.OBJETO)
  assert.equal(s['I.- A.- 1.- Curso de acción más probable'], ANTES['A.1 Curso de acción más PROBABLE'])
  const r = O.sembrarOgo({ 'II.- MISIÓN': 'La mía (FICT.).', 'III.- A.- 1.- Maniobra': '  ' }, s)
  assert.equal(r.valor['II.- MISIÓN'], 'La mía (FICT.).')
  assert.ok(r.valor['III.- A.- 1.- Maniobra'].trim())
  const l = O.leerOgo({ id: 'opord', tipo: 'campos' }, { ...ANTES, 'II.- MISIÓN': 'Nueva (FICT.).' })
  assert.equal(l['II.- MISIÓN'], 'Nueva (FICT.).', 'la clave nueva manda')
  assert.equal(l.CARTAS, ANTES.CARTA)
  assert.ok(!('Misión' in l) && !('A.1 Maniobra' in l), 'las claves de antes se sacan')
  assert.equal(O.leerOgo({ id: 'opord', tipo: 'campos' }, { 'II.- MISIÓN': 'x' }), null, 'sin claves viejas: nada que convertir')
  assert.equal(O.leerOgo({ id: 'prep3', tipo: 'campos' }, ANTES), null, 'sólo la F7·P1')
  assert.ok(SRC.includes('{var y,g;e=SIDOgoLeer(t,e)||e;const v=SIDGuiaLeer(t,e)||e||'), 'la hoja la lee con las claves de ahora')
})

caso('la intención en forma inextensa (PMTD 2017, 14.° paso), también la escrita como «Propósito: … Tareas clave: …»', () => {
  const p = O.partesIntencion(ANTES['Intención del Comandante'])
  assert.equal(p.tareas.length, 3)
  const t = O.intencionInextensa(p)
  assert.match(t, /^Mi intención es detener al primer escalón de la VI División de Ejército de SATURNO al oeste de la LDE-2; el punto decisivo es el desfiladero del río LAUCA en UNGALLIRE – GUATA, para esto es clave:\n- Fijar al primer escalón/)
  assert.match(t, /\nAl finalizar la operación, la 1ª Brigada Acorazada «CORACEROS» detenida/)
  assert.equal(O.partesIntencion('Mi intención es … (FICT.)'), null, 'la ya redactada no se toca')
})

let SPEC = null
caso('📄 el Word (la F7·P1 que bajó Sergio): la forma de la Escuela, sin «Encabezamiento» ni numeración repetida', () => {
  const e = ejercicio()
  const v = O.sembrarOgo(O.leerOgo(ANTES), C.l3e('opord', { ...e, g3: { ...e.g3, opord: ANTES } })).valor
  const w = O.wordOgo(v, { membrete: ['M'], clasificacion: 'SECRETO' }, { unidad: 'CE-I', superior: 'FF.TT.T.O.', controlOrden: e.g3.controlOrden, lt: C.MS({ recepcion: '2026-10-20T09:00', inicioOperacion: '2026-12-04T04:00' }) })
  SPEC = w
  assert.equal(w.titulo, 'ORDEN GENERAL DE OPERACIONES')
  assert.equal(w.estructuraPropia, true)
  assert.deepEqual(w.membrete, ['M'])
  assert.deepEqual(w.preliminares.map((x) => x.rotulo), ['OBJETO', 'CARTAS', 'ANEXOS'])
  assert.ok(w.preliminares.every((x) => x.texto), 'OBJETO, CARTAS y ANEXOS con su texto (no «[Pendiente]»)')
  assert.deepEqual(w.secciones.map((x) => x.titulo), ['SITUACIÓN.', 'MISIÓN.', 'EJECUCIÓN.', 'APOYO DE SERVICIO.', 'COMANDO Y COMUNICACIONES.'])
  const todos = []
  const rec = (ns) => (ns || []).forEach((n) => { if (n.titulo) todos.push(n.titulo); rec(n.hijos) })
  rec(w.secciones)
  assert.ok(!todos.some((x) => /Encabezamiento|^[IVX]+\.-|^[A-D]\.\s|^\d+\s|^[A-D]\.\d/.test(x)), `títulos con numeración propia: ${todos.filter((x) => /^[IVX]+\.-|^[A-D]\.\d/.test(x))}`)
  const [sit, mis, eje] = w.secciones
  assert.deepEqual(sit.hijos.map((x) => x.titulo), ['Fuerzas enemigas.', 'Fuerzas propias.', 'Refuerzos y reducciones.'], 'la Hipótesis «N/A» de una ORDEN no sale')
  assert.deepEqual(sit.hijos[0].hijos.map((x) => x.titulo), ['Curso de acción más probable.', 'Curso de acción más peligroso.'])
  assert.match(mis.texto, /^El I Cuerpo de Ejército \(CE-I\) defiende el AO LAUCA/)
  assert.equal(eje.hijos[0].titulo, 'Intención del Comandante.')
  assert.equal(eje.hijos[0].sinRotulo, true, 'la intención va antes de A, sin letra')
  assert.match(eje.hijos[0].texto, /^Mi intención es detener al primer escalón/)
  assert.equal(eje.hijos[0].vinetas.length, 3)
  assert.deepEqual(eje.hijos.slice(1).map((x) => x.titulo), ['Concepto de la operación.', 'Tareas de las unidades de maniobra.', 'Tareas de las unidades de apoyo de combate.', 'Instrucciones de coordinación.'])
  const conc = eje.hijos[1]
  const sub = conc.hijos.map((x) => x.titulo)
  assert.deepEqual(sub.slice(0, 2), ['Maniobra.', 'Fuegos.'])
  assert.ok(sub.indexOf('Ingenieros.') > 1, sub.join(' · '))
  assert.ok(!sub.includes('Operaciones QBN.'), 'las optativas vacías no salen')
  const tm = eje.hijos[2].hijos
  assert.equal(tm[0].titulo, 'Agrupación (OD).')
  assert.equal(tm[0].texto, 'Atacar con Fuego.')
  const ic = eje.hijos[4].hijos
  assert.equal(ic[0].titulo, 'La orden entra en vigor a su recepción; Fase I en ejecución.', 'sin el «1.» que escribió la IA')
  assert.ok(ic.every((x) => x.item || x.hijos), 'cada instrucción numerada')
  assert.equal(w.organizacion.titulo, 'ORGANIZACIÓN DE LA TAREA')
  assert.equal(w.organizacion.equipos[0].nombre, 'Agrupación Táctica OD (DIV MEC-2)')
  assert.deepEqual(w.organizacion.equipos[0].elementos, ['DIV MEC-2 (orgánica)', 'BATING MEC-2', 'BAT. LOG-II'])
  assert.equal(w.firma, 'EL COMANDANTE DEL CE-I')
  assert.equal(w.autenticador, 'G-3')
  assert.equal(w.numero, '01/26')
  assert.equal(w.distribucion, 'Original : FF.TT.T.O.\nCopia 1 : DIV MEC-2\nCopia 2 : DIV-1\nCopia 3 : ARCHIVO', 'la unidad, no «Agrupación Táctica OD (…)»')
  assert.equal(w.preliminares[2].texto.split('\n').length, 4, 'un anexo por renglón (venían en una línea con comas)')
  assert.ok(!/,$/m.test(w.preliminares[2].texto))
  assert.equal(w.secciones[3].texto, 'Ver Anexo “G” Plan de Logística.')
  const prop = w.secciones[0].hijos[1].hijos
  assert.equal(prop[0].titulo, 'Escalón Superior (FF.TT.T.O.).', 'los «1. Rótulo: …» como subpárrafos')
  assert.match(prop[0].texto, /^Defienden entre la LDE-1/)
  assert.match(w.secciones[3].texto, /^Ver Anexo “G” Plan de Logística\.$|Ver Anexo/)
  assert.equal(O.wordOgo({}, {}, {}), null, 'la hoja vacía no baja nada')
  assert.equal(O.wordOgo({}, {}, { controlOrden: { 'Tipo de orden': 'Plan de Operaciones' } }), null)
  assert.equal(O.wordOgo({ 'II.- MISIÓN': 'x' }, {}, { controlOrden: { 'Tipo de orden': 'Plan de Operaciones' } }).titulo, 'PLAN GENERAL DE OPERACIONES')
})

caso('el compilado: el Word por la forma de la Escuela, Mesa EM baja la MISMA OGO y el formato militar con «G-3»', () => {
  assert.ok(SRC.includes('if(t==="opord"){const i=VM(t);if(!i)return!1;const SIDo=n.ordenSup||{},SIDs=SIDOgoWord('))
  assert.ok(SRC.includes('"F7P1_Orden_General_de_Operaciones"'))
  assert.ok(SRC.includes('if(t.id==="opord"&&VM(t.id))return Aoe(t.id,e,n,a);'))
  assert.ok(SRC.includes('{id:"opord",nom:"Orden General de Operaciones (F7·P1)",tipo:"orden",estado:"auto"}'))
  assert.ok(SRC.includes('SIDv=SIDOgoSembrar(SIDg.opord,l3e("opord",{...SIDn,unidades:dn,g3:SIDg})).valor;Aoe("opord",SIDv,SIDn,SIDg)'))
  assert.ok(SRC.includes('formato-militar/v1/runtime.js?v=ogo20261029'))
  const rt = fs.readFileSync(path.join(DIR, '..', 'formato-militar', 'v1', 'runtime.js'), 'utf8')
  assert.ok(rt.includes('if(spec.autenticador)cfg.autenticador=spec.autenticador'))
})

caso('los reemplazos: cada uno una vez, reversibles byte por byte, y ninguno cae DENTRO de lo que insertaron las listas anteriores', () => {
  const lista = require('./reemplazos-2026-10-29-ogo.js')
  const viejo = fs.readFileSync(path.join(DIR, '..', 'assets', 'index-areas-logisticas-20261029.js'), 'utf8')
  for (const r of lista) {
    assert.equal(viejo.split(r.viejo).length - 1, r.veces, r.nombre)
    assert.equal(SRC.split(r.nuevo).length - 1, r.veces, r.nombre)
  }
  let d = SRC
  for (const r of [...lista].reverse()) d = d.split(r.nuevo).join(r.viejo)
  assert.equal(d, viejo)
  // Lo que insertaron las listas anteriores y estaba en el compilado anterior sigue entero (salvo la versión del
  // formato militar).
  const rotos = []
  for (const f of fs.readdirSync(DIR)) {
    if (!/^reemplazos-.*\.js$/.test(f) || ['reemplazos-compilado.js', 'reemplazos-2026-10-29-ogo.js'].includes(f)) continue
    for (const r of require(path.join(DIR, f)) || []) if (r.nuevo && viejo.includes(r.nuevo) && !SRC.includes(r.nuevo) && !/formato-militar\/v1\/runtime\.js\?v=/.test(r.nuevo)) rotos.push(`${f}: ${r.nombre}`)
  }
  assert.deepEqual(rotos, [])
})

for (const [n, f] of casos) {
  try {
    f()
    console.log(`✓ ${n}`)
  } catch (e) {
    fallos++
    console.log(`✗ ${n}\n  ${String(e.message).split('\n').join('\n  ')}`)
  }
}

// El .docx con el MISMO formato militar de la Mesa (word.js), si está la librería docx.
const docx = (() => {
  for (const c of [process.env.DOCX_MODULE, process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES && `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/docx`, 'docx', '/opt/node-tools/node_modules/docx'].filter(Boolean)) {
    try {
      return require(c)
    } catch {}
  }
  return null
})()
if (docx && SPEC) {
  try {
    globalThis.SIDMembrete = (await import('../membrete/v1/membrete.js')).default
    const word = await import('../formato-militar/v1/word.js')
    word.configurarWord(docx)
    const cfg = { superior: 'FF.TT.T.O.', unidad: 'CE-I', lugar: 'CHALLAPATA', fechaHora: 'D-30 (2320)', seccion: 'EMO/SEC-III', expedicion: 16, iniciales: 'XYZ', titulo: SPEC.titulo, numero: SPEC.numero, nivel: 'principal', firma: SPEC.firma, jem: 'XYZ', autenticador: SPEC.autenticador, inicialesAut: 'XYZ', distribucion: SPEC.distribucion }
    const buf = await docx.Packer.toBuffer(word.crearWord(SPEC, cfg, null))
    fs.mkdirSync(SALIDA, { recursive: true })
    fs.writeFileSync(path.join(SALIDA, 'F7P1_Orden_General_de_Operaciones.docx'), buf)
    const xml = (await (require('/opt/node-tools/node_modules/jszip')).loadAsync(buf).then((z) => z.file('word/document.xml').async('string'))).replace(/<[^>]+>/g, ' ')
    for (const t of ['ORGANIZACIÓN DE LA TAREA', 'SITUACIÓN.', 'Intención del Comandante.', 'Mi intención es', 'Tareas de las unidades de maniobra.', 'EL COMANDANTE DEL CE-I', 'G-3', 'Copia 3']) assert.ok(xml.includes(t), `el .docx no dice «${t}»`)
    assert.ok(!/Encabezamiento|\[Pendiente\]/.test(xml))
    console.log(`✓ el .docx con el formato militar de la Mesa (${path.join(SALIDA, 'F7P1_Orden_General_de_Operaciones.docx')})`)
  } catch (e) {
    fallos++
    console.log(`✗ el .docx con el formato militar de la Mesa\n  ${e.message}`)
  }
} else console.log('(sin Word: falta la librería docx)')

console.log(fallos ? `${fallos} FALLO(S)` : `OK — ${casos.length} casos`)
process.exit(fallos ? 1 : 0)
