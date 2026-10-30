// La F7·P1 ORDEN GENERAL DE OPERACIONES del G-3 con la forma del TEXTO PMTD 2017 (Parte Primera, Capítulo VII) y con
// todo lo que trabajó el Estado Mayor (calcos/orden-operaciones/v1/ogo.mjs; el motor, calcos/estado-mayor/vN con
// campos/g3.js, la carpeta que importa el compilado vigente):
//   · la FORMA: OBJETO, CARTAS, ANEXOS; ORGANIZACIÓN DE LA TAREA; I.- a V.- con sus subapartados, en el orden del modelo
//     y con la instrucción LITERAL del PMTD;
//   · la hoja VIEJA (32 casillas planas): lo escrito pasa a su apartado; las cuentas del 🌱 viejo no pasan;
//   · 🌱 con un ejercicio FICTICIO (el CE-I de Sergio como forma): la Orden superior, el CAE del G-2, la misión aprobada,
//     la intención y los RCIC del Comandante, el CAP aprobado FASE POR FASE con la tarea y el propósito de cada unidad
//     (como la OGO del CE-I «KILÓMETRO 7»), las tareas de cada unidad, fuegos, barreras, riesgo, anexos G-1/G-4/G-5…;
//   · la IA: el pedido (doctrina del Capítulo VII, el ejemplo, las reglas, la verificación, por partes; sin «NO escribas…
//     la Orden de Operaciones») y la respuesta (JSON, sólo completar no pisa, escrita como documento);
//   · el Word: la numeración del PMTD (I.- A.- 1.- a.- 1) a)), las fases como subtítulos, las tareas como incisos, la
//     Organización de la Tarea en cuadro, la firma del Comandante, la autenticación del G-3 y la distribución;
//   · el compilado: la F7·P1 del G-3 pasa por el motor (las demás hojas quedan igual), el avance la cuenta por lo escrito,
//     la carpeta la muestra con su forma y los botones «Orden de Operaciones» bajan esta Orden.
//
//   node orden-operaciones.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const { cargar, vigente } = require('./extraer.js')
const { ejercicioOGO, VIEJA, SIDcarta } = require('./ogo-ejemplo.js')
const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.join(AQUI, '..')
const VIGENTE = vigente()
const SRC = fs.readFileSync(VIGENTE, 'utf8')
const V = (SRC.match(/"\.\.\/estado-mayor\/(v\d+)\/registro\.js(?:\?[^" ]*)?"/) || [])[1]
const url = (p) => pathToFileURL(path.join(RAIZ, p)).href

let fallos = 0
const casos = []
const caso = (nombre, f) => casos.push([nombre, f])

const M = await import(url(`estado-mayor/${V}/motor.js`))
const R = await import(url(`estado-mayor/${V}/registro.js`))
const RT = await import(url(`estado-mayor/${V}/runtime.js`))
const P = await import(url(`estado-mayor/${V}/pedido.js`))
const G3 = (await import(url(`estado-mayor/${V}/campos/g3.js`))).default
const O = await import(url('orden-operaciones/v1/ogo.mjs'))
const { leerRespuesta } = await import(url('cap-propios/v1/carta-ia.mjs'))
const DOC = G3.documentos.opord
const DEF = DOC.def
console.log(`compilado: ${path.basename(VIGENTE)} · motor: calcos/estado-mayor/${V}`)

// ─── Un ejercicio FICTICIO, con la forma del CE-I (AO LAUCA) de Sergio (ogo-ejemplo.js) ─────────────────────────
const ejercicio = () => ejercicioOGO({ leerRespuesta })
function ctxDe(e = ejercicio(), { hojas = e.g3 } = {}) {
  RT.sincronizarEM(e.calco)
  return RT.contexto({ campo: 'g3', hojas, ctxDoc: { unidad: 'CE-I', SIDcarta } })
}
const HOJA = { id: 'opord', num: 'F7·P1', nom: 'Orden General de Operaciones y Anexos', tipo: 'docEM', campoEM: 'g3', docEM: 'opord' }

// ── LA FORMA ────────────────────────────────────────────────────────────────────────────────────────────────────
caso('la forma: los párrafos del modelo del Capítulo VII, en orden, con su instrucción literal', () => {
  assert.equal(DEF.titulo, 'ORDEN GENERAL DE OPERACIONES')
  assert.deepEqual(DEF.preliminares.map((p) => p.t), ['OBJETO', 'CARTAS', 'ANEXOS'])
  assert.deepEqual(DEF.arbol.map((n) => n.t), ['ORGANIZACIÓN DE LA TAREA.', 'SITUACIÓN.', 'MISIÓN.', 'EJECUCIÓN.', 'APOYO DE SERVICIO.', 'COMANDO Y COMUNICACIONES.'])
  const t = (ns) => ns.map((n) => n.t)
  const [, sit, , eje, ser, com] = DEF.arbol
  assert.deepEqual(t(sit.hijos), ['Fuerzas enemigas.', 'Fuerzas propias.', 'Refuerzos y reducciones.', 'Hipótesis.'])
  assert.deepEqual(t(sit.hijos[0].hijos), ['Curso de acción del enemigo más probable.', 'Curso de acción del enemigo más peligroso.'])
  assert.deepEqual(t(eje.hijos), ['Intención del Comandante.', 'Concepto de la operación.', 'Tareas de las unidades de maniobra.', 'Tareas de las unidades de apoyo de combate.', 'Instrucciones de coordinación.'])
  assert.ok(eje.hijos[0].sinNumero, 'la intención va sin número, antes de A.-')
  assert.deepEqual(t(eje.hijos[1].hijos), ['Maniobra.', 'Apoyo de fuegos.', 'Reconocimiento y vigilancia.', 'Inteligencia.', 'Ingenieros.', 'Defensa antiaérea.', 'Operaciones QBN.', 'Operaciones de la Policía Militar.', 'Operaciones de AC/GM.'])
  assert.deepEqual(t(eje.hijos[1].hijos[1].hijos), ['Apoyo aéreo.', 'Apoyo de artillería de campaña.', 'Medidas de coordinación de apoyo de fuegos.'])
  const coord = eje.hijos[4].hijos
  assert.equal(coord[0].t, 'Hora o condición de entrada en vigor.')
  assert.equal(coord[1].t, 'Información esencial requerida por el Comandante (RCIC).')
  assert.deepEqual(t(coord[1].hijos), ['Requerimientos prioritarios de inteligencia (RPI).', 'Requerimientos de información de la fuerza amiga (RIFA).', 'Elementos esenciales de información amiga (EEIA).'])
  assert.deepEqual(t(ser.hijos), ['Concepto de apoyo.', 'Logística.', 'Personal.', 'Asuntos civiles y gobierno militar.'])
  assert.deepEqual(t(com.hijos), ['Comando.', 'Comunicaciones.'])
  assert.deepEqual(t(com.hijos[0].hijos), ['Sucesión de mando.', 'Puestos comando e instalaciones de C2.'])
  // la instrucción del PMTD, literal
  const ay = Object.fromEntries(M.camposDe(DEF).map((c) => [c.id, c.ayuda || '']))
  for (const [id, frase] of [
    ['orgTarea', 'Describa la disposición de las fuerzas para apoyar el concepto de la operación'],
    ['enemigo', 'Exprese la información en términos de dos escalones enemigos por debajo del suyo'],
    ['propias', 'Considere la misión, la intención del Comandante y el concepto de la operación de dos escalones superiores'],
    ['refuerzos', 'la información respecto a las Unidades en refuerzo o reducidas se incluye en este subpárrafo, indicando el lugar, fecha y hora en que la reducción o refuerzo cobra vigencia'],
    ['hipotesis', '(Aplica sólo para el Plan de Operaciones) Enumere todas las hipótesis establecidas'],
    ['vigencia', 'Hora o condición cuando un plan o una orden entra en vigor'],
    ['conceptoApoyo', 'Establezca el enfoque de apoyo logístico y la prioridad de apoyo a las Unidades dependientes para cada fase de la operación'],
    ['servicio', 'al Anexo “Apoyo de Servicio de Combate” si es una Orden de Operaciones'],
    ['comando', 'Haga referencia al Anexo de Comunicaciones'],
    ['sucesion', 'Designe la sucesión de mando'],
    ['puestosComando', 'Describa los puestos de comando y otras instalaciones de C2, y sus ubicaciones'],
    ['ioc', 'Indique la edición de las Instrucciones Operativas de Comunicación (IOC.) que está en vigencia'],
    ['prioridadCom', 'Describa la prioridad de las comunicaciones para las Unidades por eventos'],
  ])
    assert.ok(ay[id].includes(frase), `${id}: «${frase}»`)
  // el formato para la IA, con la numeración del documento
  const f = M.formatoParaIA(DEF)
  for (const x of ['OBJETO', 'I.- SITUACIÓN.', 'II.- MISIÓN.', 'III.- EJECUCIÓN.', 'IV.- APOYO DE SERVICIO.', 'V.- COMANDO Y COMUNICACIONES.', '"campos"."maniobra"', '"campos"."tareasManiobra"', '"campos"."rpi"', '"campos"."prioridadCom"']) assert.ok(f.includes(x), `formato: ${x}`)
  assert.deepEqual(O.idsDe(), M.camposDe(DEF).map((c) => c.id), 'los ids del documento son los campos del motor, en orden')
  // las partes cubren toda la Orden, sin repetir
  const ids = new Set(M.camposDe(DEF).map((c) => c.id))
  const partes = O.PARTES.filter((p) => p.campos).flatMap((p) => p.campos)
  for (const id of ids) assert.ok(partes.includes(id), `la parte que trabaja «${id}»`)
  assert.equal(new Set(partes).size, partes.length)
})

// ── LA HOJA VIEJA ───────────────────────────────────────────────────────────────────────────────────────────────
caso('la hoja vieja: lo escrito pasa a su apartado; las cuentas del 🌱 viejo no pasan; lo de la IA queda marcado', () => {
  assert.ok(O.esHojaVieja(VIEJA))
  assert.ok(M.esDe(DEF, VIEJA), 'el motor la reconoce como del documento')
  assert.ok(M.tiene(DEF, VIEJA), 'cuenta como hecha (tiene lo escrito por el oficial)')
  const v = M.normalizar(DEF, VIEJA)
  assert.equal(v.esquema, 'ogo-v1')
  assert.equal(v.campos.objeto, 'El CE-I en la defensa de área (FICT.).')
  assert.equal(v.campos.mision, 'El CE-I defiende el AO LAUCA (escrito por el oficial, FICT.).')
  assert.equal(v.campos.sucesion, 'Sucesión: Cmte., JEM, G-3 (FICT.).', '«A. Comando» con la sucesión va a la sucesión de mando')
  assert.equal(v.campos.ioc, 'IOC «ILLIMANI» (FICT.).')
  assert.ok(v.campos.reconocimiento.includes('La CIE-297 reconoce la AIN-3'))
  assert.ok(v.iaCampos.includes('campo:reconocimiento'), 'lo que escribió la IA queda para revisar')
  for (const id of ['orgTarea', 'maniobra', 'fuegos', 'mcaf', 'ingenieros']) assert.equal(v.campos[id], '', `${id}: el 🌱 viejo (cuentas) no pasa`)
  // sólo con cuentas del 🌱 viejo: no cuenta como hecha
  const soloCuentas = { 'A.1 Maniobra': VIEJA['A.1 Maniobra'], 'A.5 Ingenieros': VIEJA['A.5 Ingenieros'] }
  assert.equal(M.tiene(DEF, soloCuentas), false)
  // lo nuevo no se toca
  const nuevo = M.armar(DEF, {}, { campos: { mision: 'X (FICT.)' } }).valor
  assert.equal(O.desdeHojaVieja(nuevo), nuevo)
  assert.equal(O.sinCuentas('Plan de barreras: 13 trabajo(s), 479 h de trabajo. Al enemigo debería costarle 12 h. La ZO-1 fija al enemigo.'), 'La ZO-1 fija al enemigo.')
})

// ── 🌱 ──────────────────────────────────────────────────────────────────────────────────────────────────────────
caso('🌱: los preliminares, la organización de la tarea, la situación y la misión', () => {
  const C = O.propuestas(ctxDe()).campos
  assert.equal(C.objeto, 'El CE-I en la defensa de área.')
  assert.equal(C.cartas, 'TRITÓN, Esc. 1:250.000 (FICT.)')
  assert.equal(C.anexos.split('\n').length, 9)
  assert.ok(C.anexos.startsWith('“A” Calco de Operaciones.\n“B” Inteligencia.'))
  const org = C.orgTarea.split('\n')
  assert.deepEqual(org.slice(0, 3).map((l) => l.replace(/:.*$/, '')), ['DIV MEC-2 (OD)', 'DIV-1 (OC-1)', 'DIV-6 (RESERVA)'], 'las agrupaciones en el orden OD, OC, RESERVA')
  assert.equal(org[3], 'BAJO CONTROL: GALM-1, RAM-4')
  // I.- A.- con dos escalones abajo y el CAE del G-2 (H.T. 18 / enunciado / H.T. 19)
  assert.ok(C.enemigo.startsWith('La VI DE de SATURNO ataca con la 1ª Br. Ac. «CORACEROS»'))
  assert.ok(C.enemigo.includes('1ª BR. AC. «CORACEROS» (Brigada), GAAP N° 4 «MIRAFLORES» (Batallón)'))
  assert.ok(C.enemigo.includes('Misión estimada del enemigo: La VI DE ataca a partir del D (0400) para conquistar TURCO (FICT.).'))
  assert.ok(C.enemigo.endsWith('Ver Anexo “B” Inteligencia.'))
  assert.ok(C.caeProbable.startsWith('CAE-1 (el MÁS PROBABLE para el G-2, H.T. 18).'))
  assert.ok(C.caeProbable.includes('Maniobra: La 1ª Br. Ac. ataca por la AA-1'))
  assert.ok(C.caeProbable.includes('FASE I: 1ª BR. AC. «CORACEROS»: tarea: Ataca por el valle del Lauca (FICT.); propósito: para conquistar el paso Ungallire (FICT.).'))
  assert.ok(C.caeProbable.includes('Estado final deseado: TURCO conquistado'))
  assert.ok(C.caePeligroso.startsWith('CAE-2 (el MÁS PELIGROSO para el G-2, H.T. 18).'))
  // I.- B.- dos escalones arriba y las adyacentes, como subpárrafos
  assert.equal(C.propias.split('\n')[0], '1.- FF.TT.T.O. (FICT.).')
  assert.ok(C.propias.includes('a.- Misión: Las FF.TT.T.O. defienden entre la LDE-1 y la LDE-2 (FICT.).'))
  assert.ok(C.propias.includes('b.- Intención del Comandante: Detener a SATURNO al oeste de la LDE-2 (FICT.).'))
  assert.ok(C.propias.includes('2.- Unidades adyacentes y de apoyo: La DIV MEC-1 defiende TAMBO QUEMADO'))
  // II.- la misión aprobada, transcripta
  assert.equal(C.mision, 'El CE-I defiende el AO LAUCA a partir del D (0400) hasta el D+15 (1800), reteniendo la LF «PUMA», con el propósito de impedir que SATURNO penetre hacia TURCO (FICT.).')
  assert.equal(C.hipotesis, undefined, 'una ORDEN no lleva hipótesis')
})

caso('🌱: la intención y el concepto como en el PMTD, y la MANIOBRA fase por fase con cada unidad (tarea y propósito)', () => {
  const C = O.propuestas(ctxDe()).campos
  assert.deepEqual(C.intencion.split('\n'), [
    'El propósito de la operación es detener al primer escalón enemigo al oeste de la LDE-2 (FICT.).',
    'Para esto será necesario cumplir las siguientes tareas clave:',
    '1) Fijar a la 1ª Br. Ac. al oeste de la LF «PUMA».',
    '2) Consolidar la ZO-1.',
    '3) Evacuar civiles hasta el D-10.',
    'Al finalizar la operación, la 1ª Br. Ac. detenida y desgastada, la LDE-2 retenida y el CE-I listo para la Segunda Campaña (FICT.).',
  ])
  assert.ok(C.concepto.startsWith('Cumpliremos la misión mediante la ejecución de una defensa de área.'))
  assert.ok(C.concepto.includes('Esfuerzo principal: '))
  assert.ok(C.concepto.includes('La operación se desarrollará en las siguientes fases:\nFASE I (CONCENTRACIÓN) desde el D-10 hasta el D-8.'))
  const man = C.maniobra.split('\n')
  const fases = man.filter((l) => /^FASE [IVX]+ \(/.test(l))
  assert.equal(fases.length, 5, 'las cinco fases del CAP en la carta')
  assert.equal(man[0], 'FASE I (CONCENTRACIÓN) desde el D-10 hasta el D-8.')
  // la oración de la OGO del CE-I «KILÓMETRO 7»: «La DIV MEC-2 (OD), esfuerzo principal, defiende…, con el propósito de…»
  assert.ok(man.includes('La DIV MEC-2 (OD), esfuerzo principal, se concentra en Turco.'))
  assert.ok(man.includes('La DIV-1 (OC-1), esfuerzo secundario, se concentra en Huachacalla.'))
  assert.ok(man.includes('La DIV MEC-2 (OD), esfuerzo principal, detiene al enemigo en la AA-1 en Guata, con el propósito de que no pase la LF «PUMA».'))
  assert.ok(man.includes('La DIV-6 (RESERVA) constituye la reserva en Estancia Ticanani.'))
  assert.ok(man.includes('La DIV-6 (RESERVA) continúa como reserva en Estancia Ticanani.'), 'lo que sigue igual: «continúa…»')
  assert.ok(man.includes('La DIV-1 (OC-1), esfuerzo secundario, continúa defendiendo la LPR a 7 km al O de Julo.'))
  assert.ok(man.includes('La DIV-6 (RESERVA) contraataca en Guata, con el propósito de restablecer la LPR.'))
  assert.ok(man.some((l) => l.startsWith('La RESERVA: Composición: ')))
  assert.ok(man.some((l) => l.startsWith('El riesgo a afrontar: ')))
  for (const l of man) assert.ok(!/\d+ (trabajo|límite|punto)\(s\)|ver F\d·P\d/i.test(l), `sin cuentas ni remisiones: ${l}`)
  // los demás del concepto
  assert.ok(C.fuegos.includes('Prioridad de fuegos: de la FASE I a la FASE V a la DIV MEC-2.') || C.fuegos.includes('Prioridad de fuegos'))
  assert.ok(C.fuegos.includes('Matriz de ejecución de apoyo de fuegos (F4·P7):\n- FASE IV: Destruir AB-010 en Ungallire con RAM-4, con el propósito de impedir el cruce del Lauca (FICT.). Método: fuego de protección final.'))
  assert.ok(C.artilleria.includes('Organización de la Artillería para el Combate.\nGALM-1 : Refuerzo de fuegos DIV MEC-2\nRAM-4 : Acción de conjunto CE-I'))
  assert.equal(C.mcaf, 'LCAF sobre la LDE-1 desde el D (0400) (FICT.).')
  assert.ok(C.reconocimiento.includes('Matriz de eventos del G-2 (H.T. 20):\n- AIN-3: Movimiento de obuses M109 (FICT.), no antes de D-1, no después de D+1.'))
  assert.ok(C.ingenieros.startsWith('Contramovilidad: '))
  assert.ok(C.ingenieros.includes('Obstáculos planificados en la carta:\n- FASE III: '))
  assert.ok(C.antiaerea.includes('- FASE IV: Prioridad al PC de Ticanani (FICT.).'))
  assert.ok(C.acgm.startsWith('Evacuar la población de Guata antes del D-10 (FICT.).'))
  assert.ok(C.acgm.endsWith('Ver Anexo “H” Asuntos Civiles y Gobierno Militar.'))
})

caso('🌱: las TAREAS de cada unidad (incisos por fase), la coordinación con los RCIC, IV y V', () => {
  const C = O.propuestas(ctxDe()).campos
  const tm = C.tareasManiobra.split('\n')
  assert.deepEqual(tm.filter((l) => /^\d+\.- /.test(l)), ['1.- DIV MEC-2 (OD).', '2.- DIV-1 (OC-1).', '3.- DIV-6 (RESERVA).'])
  assert.equal(tm[1], 'a.- FASE I: Se concentra en Turco.')
  assert.ok(tm.includes('d.- FASE IV: Detiene al enemigo en la AA-1 en Guata, con el propósito de que no pase la LF «PUMA».'))
  assert.ok(tm.includes('b.- FASE III: Constituye la reserva en Estancia Ticanani.'))
  assert.ok(C.tareasApoyo.includes('GALM-1.\na.- Refuerzo de fuegos a DIV MEC-2 desde la FASE II, prioridad 1.'))
  assert.equal(C.vigencia, 'La presente orden entra en vigor a partir de su emisión.\nDía D: 15 de noviembre (FICT.); hora H: 0400.')
  // los RCIC: los priorizados por el Comandante (F2·P8), RPI y RIFA por separado
  assert.equal(C.rpi, '1) ¿Por qué avenida (FICT.) empeña el enemigo su esfuerzo principal?')
  assert.equal(C.rifa, '1) Informar cuando la DIV-6 complete su aclimatación en TURCO (FICT.).')
  assert.equal(C.eeia, 'a.- La ubicación de la reserva (FICT.).', 'el EEIA del G-3 va igual (el Comandante prioriza los RCIC)')
  assert.equal(C.riesgos, '- Fratricidio en el pasaje de líneas: Puntos de pasaje con guías y señales de reconocimiento (FICT.).')
  assert.equal(C.reglas, '- Emplear minas antipersonal (FICT.).')
  assert.equal(C.ambiente, '- Contaminar el río Lauca con combustibles (FICT.).')
  assert.equal(C.restricciones, '- Cruzar la frontera internacional (FICT.).')
  assert.ok(C.adicionales.includes('- Enlace con el CE-II en el PC-3 (FICT.).'))
  assert.ok(C.adicionales.includes('- Mantener el enlace con el CE-II en el PC-3 (FICT.).'))
  assert.ok(C.adicionales.includes('- Punto de decisión 1 (Irrupción en la AA-1): cuando el enemigo supera la LF «PUMA» con más de un batallón (FICT.), empeñar la DIV-6 en contraataque (AIN-2).'))
  assert.equal(C.mcafVigentes, 'Las establecidas en el párrafo III.- A.- 2.- c.- y en el Anexo “C” Apoyo de Fuegos.')
  assert.equal(C.ensayo, 'Tipo de ensayo: Ensayo de comandantes sobre maqueta (FICT.).\nParticipan y cuándo: Comandantes de división, el D-5 (0900) en el PCP (FICT.).')
  assert.equal(C.amenazaRetaguardia, 'Nivel II (FICT.).')
  assert.equal(C.servicio, 'Ver Anexo “F” Apoyo de Servicio de Combate.')
  assert.ok(C.conceptoApoyo.includes('- FASE III: enfoque de apoyo en Clase IV y Clase V; prioridad a la DIV MEC-2 (FICT.).'))
  assert.ok(C.logistica.includes('- Eje Principal de Abastecimiento (EPA): Oruro–Toledo–Corque–Turco (FICT.).'))
  assert.ok(C.personal.includes('- Reemplazos: 450 reemplazos el D-3 (FICT.).'))
  assert.ok(C.personal.endsWith('Ver Anexo “G” Personal.'))
  assert.ok(C.asuntosCiviles.includes('- Evacuación: Puesto de reunión de evacuados en Corque (FICT.).'))
  assert.equal(C.comando, 'Ver Anexo “I” Comunicaciones.')
  assert.deepEqual(C.sucesion.split('\n').slice(0, 4), ['a.- Comandante del CE-I.', 'b.- Jefe de Estado Mayor del CE-I.', 'c.- G-3 del CE-I.', 'd.- Comandante de la DIV MEC-2 (OD).'])
  assert.deepEqual(C.puestosComando.split('\n'), ['- PC Principal CE-I en Estancia Ticanani.', '- PC Alterno en Turco.', '- PC Retrasado en Toledo.'], 'los del concepto (F3·P6); la ficha del PC del CE-I ya está nombrada')
  // sin el texto del concepto, la ficha del PC (tipo «pc») en la carta, con el lugar más cercano
  const e2 = ejercicio()
  e2.g3.concepto = Object.fromEntries(Object.entries(e2.g3.concepto).filter(([k]) => !/^Medidas de control/.test(k)))
  assert.match(O.propuestas(ctxDe(e2)).campos.puestosComando, /^- PC del CE-I: .*Ticanani/i)
  assert.equal(C.ioc, 'IOC «ILLIMANI» en vigor desde el D-30 (0000) (FICT.).')
  assert.equal(C.prioridadCom, '- FASE IV: Prioridad a la DIV MEC-2 (FICT.).')
  // 🌱 llena TODA la Orden con este ejercicio (salvo lo que no corresponde o es juicio del Comandante)
  const vacios = M.camposDe(DEF).map((c) => c.id).filter((id) => !C[id])
  assert.deepEqual(vacios.sort(), ['situacion', 'apoyoAereo', 'hipotesis', 'inteligencia', 'policiaMilitar', 'proteccion', 'qbn', 'refuerzos', 'limiteAvance'].sort())
})

caso('🌱: sin pisar; con la hoja vieja trae todo lo demás; sin datos no inventa', () => {
  const ctx = ctxDe()
  const P1 = O.propuestas(ctx)
  const x = M.armar(DEF, VIEJA, P1)
  assert.equal(x.valor.campos.mision, VIEJA['Misión'], 'lo que escribió el oficial manda')
  assert.ok(x.valor.campos.maniobra.startsWith('FASE I (CONCENTRACIÓN)'), 'la maniobra del 🌱 viejo (cuentas) no estorbaba: ahora viene la de la carta')
  assert.ok(x.cambios.length > 30)
  const y = M.armar(DEF, x.valor, P1)
  assert.equal(y.cambios.length, 0, 'una segunda vez no trae nada nuevo')
  assert.deepEqual(O.propuestas({}).campos, {})
  assert.deepEqual(O.propuestas(RT.contexto({ campo: 'g3', hojas: {}, ctxDoc: {}, vivo: { ops: {}, unidades: [], fasesCOA: {}, hojasG: {}, g3: {}, picb: {}, ordenSup: {} } })).campos, {})
})

caso('la conjugación de las tareas de la carta (presente impositivo y «continúa …»)', () => {
  assert.deepEqual(['Defender la LPR', 'Concentrarse en Turco', 'Destruirlo', 'Detener al enemigo', 'Seguir', 'Lugar'].map(O.enPresente), ['defiende la LPR', 'se concentra en Turco', 'lo destruye', 'detiene al enemigo', 'sigue', 'Lugar'])
  assert.deepEqual(['Defender la LPR', 'Concentrarse', 'Destruirlo', 'Detener al enemigo', 'Reserva'].map(O.enGerundio), ['defendiendo la LPR', 'concentrándose', 'destruyéndolo', 'deteniendo al enemigo', ''])
  assert.equal(O.tareaEnPresente('Reserva'), 'constituye la reserva')
  assert.equal(O.proposito('para que no pase la LF «PUMA»'), 'con el propósito de que no pase la LF «PUMA»')
  assert.equal(O.proposito('Para cumplir la misión'), '')
})

// ── LA IA ───────────────────────────────────────────────────────────────────────────────────────────────────────
const pedidoDe = (valor = {}, op = {}) => {
  const ctx = ctxDe()
  return M.pedido(DEF, valor, {
    encabezado: '',
    expediente: `${P.MARCA_EXPEDIENTE}\n\n### ORDEN DE OPERACIONES DE LAS FF.TT.T.O. (FICT.)\nEl CE-I defiende el AO LAUCA.`,
    seccion: G3.seccionIA,
    producto: DOC.producto(ctx, HOJA),
    bloques: [
      { titulo: 'LO QUE LA MESA YA CALCULÓ Y TIENE EN EL CALCO PARA G-3 OPERACIONES (son datos: usalos tal cual)', texto: G3.datosCalco(ctx, HOJA) },
      { titulo: 'LO QUE YA ENTREGARON LAS OTRAS SECCIONES', texto: G3.entregasTexto(ctx) },
      ...DOC.bloquesIA(ctx, HOJA),
    ],
    doctrina: G3.doctrina(),
    ideasQue: DOC.ideasQue,
    reglas: DOC.reglas,
    verificacion: DOC.verificacion,
    ...op,
  })
}
caso('la IA: el pedido trae la forma, la doctrina del Capítulo VII, el ejemplo KM 7, TODO lo de la Mesa y las reglas', () => {
  const p = pedidoDe().prompt
  for (const t of [
    'SECCIÓN III — OPERACIONES (G-3)',
    'Tu producto es la ORDEN GENERAL DE OPERACIONES del CE-I',
    '# EL FORMATO DEL DOCUMENTO — ORDEN GENERAL DE OPERACIONES',
    'II.- MISIÓN.',
    'V.- COMANDO Y COMUNICACIONES.',
    'TEXTO PMTD 2017, Parte Primera, Capítulo VII',
    'Vamos a cumplir la misión',
    'El riesgo a afrontar es',
    'EJEMPLO DE REDACCIÓN',
    'KILÓMETRO 7',
    'La DIMEC-2 (OC-2), esfuerzo principal',
    // lo de la Mesa
    'El CAE del G-2 (PICB): el MÁS PROBABLE',
    'La misión aprobada (F2·P12)',
    'Las fases del CAP aprobado en la carta: lo que hace CADA unidad',
    '- DIV MEC-2 (OD): Detener al enemigo en la AA-1, en Guata — para que no pase la LF «PUMA»',
    '- Reemplazos: 450 reemplazos el D-3 (FICT.)',
    '- Seguridad del área de retaguardia: Nivel II (FICT.).',
    '- Previsión de evacuación y dimensionamiento del apoyo: Puesto de reunión de evacuados en Corque (FICT.)',
    'Matriz de ejecución de apoyo de fuegos (F4·P7)',
    'Lo del G-4 (Anexo de Apoyo de Servicio de Combate',
    'Lo del G-1 (Anexo de Personal)',
    'Lo del G-5 (Anexo de AC/GM)',
    'El G-2 (PICB)',
    // las reglas y la verificación
    '«1.- DIV MEC-2 (OD).»',
    'La «hipotesis» va VACÍA en una ORDEN',
    'MANIOBRA: FASE POR FASE',
    '"maniobra": "…"',
    '"prioridadCom": "…"',
  ])
    assert.ok(p.includes(t), `el pedido no trae «${t}»`)
  assert.ok(!/\d+ l[ií]mite\(s\), \d+ punto\(s\)/.test(p), 'sin las cuentas del calco')
})

caso('la IA: el encabezado común ya no le dice «NO escribas… la Orden de Operaciones» (a las demás hojas sí)', () => {
  const p = pedidoDe().prompt
  assert.equal(P.hojaDelPedido(`\n${p}`).trim(), 'ORDEN GENERAL DE OPERACIONES')
  const final = P.armarPedidoFinal(p, '')
  assert.ok(!final.includes('la Orden de Operaciones, una matriz de sincronización'), 'a la Orden no se le prohíbe escribir la Orden')
  assert.ok(final.includes('La Orden va COMPLETA, apartado por apartado, DENTRO de las claves del JSON.'))
  for (const t of ['KILÓMETRO 7', 'TEXTO PMTD 2017, Parte Primera, Capítulo VII', '"tareasManiobra": "…"']) assert.ok(final.includes(t), `el pedido final (tamaño Normal) conserva «${t}»`)
  assert.ok(final.startsWith(P.TITULO_PEDIDO), 'la tarea va adelante')
  const otra = P.encabezado('# PEDIDO\n\n# LA HOJA\n\nF2·P5 — Limitaciones\n\n# CÓMO CONTESTAR\n\n```json\n{"a":"…"}\n```')
  assert.ok(otra.includes('la Orden de Operaciones, una matriz de sincronización'), 'las demás hojas, como antes')
})

caso('la IA: por partes (la Orden es larga) — sólo esas claves, con el formato completo', () => {
  const parte = O.PARTES.find((x) => x.id === 'concepto')
  const r = pedidoDe({}, { soloCampos: parte.campos, parte: `${parte.nom}: ${parte.ayuda}` })
  const p = r.prompt
  assert.ok(p.includes('ESTA VEZ TRABAJÁS SÓLO ESTA PARTE DEL DOCUMENTO (III concepto:'))
  const json = p.slice(p.lastIndexOf('# CÓMO CONTESTAR'))
  assert.ok(json.includes('"maniobra": "…"'))
  assert.ok(!json.includes('"mision": "…"'), 'el JSON sólo pide la parte')
  assert.ok(p.includes('I.- SITUACIÓN.'), 'el formato sigue completo')
  assert.deepEqual(O.PARTES.map((x) => x.nom), ['Toda la Orden', 'I-II', 'III concepto', 'III tareas', 'IV-V'])
})

caso('la IA: la respuesta en JSON (sólo completar no pisa) y escrita como documento', () => {
  const campos = Object.fromEntries(M.camposDe(DEF).map((c) => [c.id, `${c.t} (IA, FICT.)`]))
  campos.hipotesis = ''
  campos.maniobra = 'FASE I (CONCENTRACIÓN) desde el D-10 hasta el D-8.\nLa DIV MEC-2 (OD), esfuerzo principal, se concentra en Turco (IA, FICT.).'
  const resp = '```json\n' + JSON.stringify({ campos }) + '\n```'
  const a = M.aplicarRespuesta(DEF, resp, {})
  assert.ok(a.ok, a.error)
  assert.equal(a.valor.campos.maniobra, campos.maniobra)
  assert.equal(a.valor.campos.hipotesis, '')
  const propio = M.armar(DEF, {}, { campos: { mision: 'La mía (FICT.)' } }).valor
  const b = M.aplicarRespuesta(DEF, resp, propio, { modo: 'completar' })
  assert.equal(b.valor.campos.mision, 'La mía (FICT.)')
  const c = M.aplicarRespuesta(DEF, resp, propio, { modo: 'completar_mejorar' })
  assert.equal(c.valor.campos.mision, 'MISIÓN. (IA, FICT.)')
  // la IA que no contesta en JSON y escribe la Orden con sus títulos
  const prosa = ['ORDEN GENERAL DE OPERACIONES No. 01', '', 'I.- SITUACIÓN.', 'A.- Fuerzas enemigas.', 'La VI DE ataca (FICT.).', 'B.- Fuerzas propias.', 'Las FF.TT.T.O. defienden (FICT.).', '', 'II.- MISIÓN.', 'El CE-I defiende el AO LAUCA (FICT.).', '', 'III.- EJECUCIÓN.', 'A.- Concepto de la operación.', 'Cumpliremos la misión mediante una defensa de área (FICT.).', '1.- Maniobra.', 'FASE I (CONCENTRACIÓN) desde el D-10 hasta el D-8.', 'La DIV MEC-2 (OD), esfuerzo principal, se concentra en Turco (FICT.).', '', 'IV.- APOYO DE SERVICIO.', 'Ver Anexo “F” (FICT.).', '', 'V.- COMANDO Y COMUNICACIONES.', 'Ver Anexo “I” (FICT.).'].join('\n')
  const d = M.aplicarRespuesta(DEF, prosa, {})
  assert.ok(d.ok, d.error)
  assert.equal(d.como, 'documento')
  assert.equal(d.valor.campos.mision, 'El CE-I defiende el AO LAUCA (FICT.).')
  assert.ok(d.valor.campos.maniobra.includes('FASE I (CONCENTRACIÓN)'), JSON.stringify(d.valor.campos.maniobra))
  assert.ok(d.valor.campos.enemigo.includes('La VI DE ataca (FICT.).'))
})

// ── EL WORD ─────────────────────────────────────────────────────────────────────────────────────────────────────
// La numeración que pone el Word (formato-militar/v1/word.js): I.- A.- 1.- a.- 1) a); los «sinRotulo» no numeran.
const FORM = ['I', 'A', '1', 'a', '1)', 'a)']
const rom = (n) => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n - 1]
const num = (nivel, n) => {
  const f = FORM[Math.min(nivel, 5)]
  return f === 'I' ? `${rom(n)}.-` : f === 'A' ? `${String.fromCharCode(64 + n)}.-` : f === '1' ? `${n}.-` : f === 'a' ? `${String.fromCharCode(96 + n)}.-` : f === '1)' ? `${n})` : `${String.fromCharCode(96 + n)})`
}
function arbolDe(ns, nivel = 0, out = []) {
  let i = 0
  for (const n of ns) {
    out.push(`${'  '.repeat(nivel)}${n.sinRotulo ? '' : `${num(nivel, ++i)} `}${n.titulo}${n.item ? ' ·inciso' : ''}`)
    arbolDe(n.hijos || [], n.sinRotulo ? nivel : nivel + 1, out)
  }
  return out
}
caso('el Word: la numeración del PMTD, las fases como subtítulos, las tareas como incisos, el cuadro y la distribución', () => {
  const ctx = ctxDe()
  const v = M.armar(DEF, {}, O.propuestas(ctx)).valor
  const s = DOC.especificacion(v, ctx, { firma: DOC.firma(ctx) })
  assert.equal(s.titulo, 'ORDEN GENERAL DE OPERACIONES')
  assert.equal(s.numero, '01')
  assert.ok(s.estructuraPropia)
  assert.equal(s.autenticador, 'G-3')
  assert.equal(s.firma, 'EL COMANDANTE DEL CE-I')
  assert.deepEqual(s.preliminares.map((p) => p.rotulo), ['OBJETO', 'CARTAS', 'ANEXOS'])
  assert.deepEqual(s.organizacion.equipos.map((e) => e.nombre), ['DIV MEC-2 (OD)', 'DIV-1 (OC-1)', 'DIV-6 (RESERVA)'])
  assert.equal(s.secciones[0].titulo, 'BAJO CONTROL:')
  assert.equal(s.secciones[0].texto, 'GALM-1\nRAM-4')
  assert.deepEqual(s.distribucion.split('\n'), ['Original : FF.TT.T.O. (FICT.)', 'Copia 1 : CE-I', 'Copia 2 : DIV MEC-2', 'Copia 3 : DIV-1', 'Copia 4 : DIV-6', 'Copia 5 : GALM-1', 'Copia 6 : RAM-4', 'Copia 7 : ARCHIVO'])
  const a = arbolDe(s.secciones)
  const linea = (x) => assert.ok(a.includes(x), `falta «${x}»:\n${a.join('\n')}`)
  linea('I.- SITUACIÓN.')
  linea('  A.- Fuerzas enemigas.')
  linea('    1.- Curso de acción del enemigo más probable.')
  linea('    2.- Curso de acción del enemigo más peligroso.')
  linea('  B.- Fuerzas propias.')
  linea('    1.- FF.TT.T.O. (FICT.).')
  linea('      a.- Misión.')
  linea('II.- MISIÓN.')
  linea('III.- EJECUCIÓN.')
  linea('  Intención del Comandante.')
  linea('  A.- Concepto de la operación.')
  linea('    1.- Maniobra.')
  linea('      FASE I (CONCENTRACIÓN) desde el D-10 hasta el D-8.')
  linea('    2.- Apoyo de fuegos.')
  linea('      a.- Apoyo aéreo.')
  linea('      b.- Apoyo de artillería de campaña.')
  linea('    9.- Operaciones de AC/GM.')
  linea('  B.- Tareas de las unidades de maniobra.')
  linea('    1.- DIV MEC-2 (OD).')
  linea('      a.- FASE I: Se concentra en Turco. ·inciso')
  linea('    3.- DIV-6 (RESERVA).')
  linea('  C.- Tareas de las unidades de apoyo de combate.')
  linea('  D.- Instrucciones de coordinación.')
  linea('    1.- Hora o condición de entrada en vigor.')
  linea('    2.- Información esencial requerida por el Comandante (RCIC).')
  linea('      a.- Requerimientos prioritarios de inteligencia (RPI).')
  linea('      b.- Requerimientos de información de la fuerza amiga (RIFA).')
  linea('    12.- Restricciones y definiciones no cubiertas en los párrafos anteriores.')
  linea('IV.- APOYO DE SERVICIO.')
  linea('  A.- Concepto de apoyo.')
  linea('  D.- Asuntos civiles y gobierno militar.')
  linea('V.- COMANDO Y COMUNICACIONES.')
  linea('  A.- Comando.')
  linea('    1.- Sucesión de mando.')
  linea('      a.- Comandante del CE-I. ·inciso')
  linea('    2.- Puestos comando e instalaciones de C2.')
  linea('  B.- Comunicaciones.')
  linea('    2.- Prioridad de las comunicaciones.')
  linea('      c.- Elementos esenciales de información amiga (EEIA).')
  assert.ok(!a.some((l) => /Hipótesis/.test(l)), 'sin hipótesis (es una ORDEN)')
  const sinEeia = DOC.especificacion({ ...v, campos: { ...v.campos, eeia: '' } }, ctx, {})
  assert.ok(!arbolDe(sinEeia.secciones).some((l) => /Elementos esenciales de información amiga/.test(l)), 'el EEIA vacío no sale (es opcional)')
  assert.ok(!a.some((l) => /III\. I\.-|E\. 2\.b/.test(l)), 'sin la numeración doble de la hoja vieja')
  // la intención va llana (sus tareas clave 1) 2) 3) no son subapartados)
  const int = s.secciones.find((x) => x.titulo === 'EJECUCIÓN.').hijos[0]
  assert.ok(int.sinRotulo)
  assert.equal(int.hijos.length, 0)
  assert.ok(int.texto.includes('1) Fijar a la 1ª Br. Ac. al oeste de la LF «PUMA».'))
  // lo vacío sale «[Pendiente de elaboración]», no se cae
  const vacio = DOC.especificacion(M.normalizar(DEF, {}), ctx, {})
  const sv = arbolDe(vacio.secciones)
  assert.ok(sv.includes('IV.- APOYO DE SERVICIO.') && sv.includes('V.- COMANDO Y COMUNICACIONES.'))
  assert.equal(vacio.secciones.find((x) => x.titulo === 'MISIÓN.').texto, O.PENDIENTE)
  // la vista previa
  const html = M.htmlDeSpec(s, s.firma)
  for (const x of ['ORDEN GENERAL DE OPERACIONES', 'ORGANIZACIÓN DE LA TAREA', 'DIV MEC-2 (OD)', 'I.- SITUACIÓN.', 'V.- COMANDO Y COMUNICACIONES.', 'EL COMANDANTE DEL CE-I']) assert.ok(html.includes(x), `la vista previa: ${x}`)
})

caso('el Word: «estructurar» lee lo escrito por el oficial o la IA (marcas, fases, incisos, títulos)', () => {
  const e = O.estructurar('Texto del apartado.\n1.- DIV MEC-2 (OD).\na.- FASE I: Se concentra en Turco.\nb.- FASE II: Se desplaza.\n2.- DIV-1 (OC-1).\na.- Defiende la LPR.\n- un guion')
  assert.equal(e.texto, 'Texto del apartado.')
  assert.deepEqual(e.hijos.map((h) => h.titulo), ['DIV MEC-2 (OD).', 'DIV-1 (OC-1).'])
  assert.deepEqual(e.hijos[0].hijos.map((h) => [h.titulo, !!h.item]), [['FASE I: Se concentra en Turco.', true], ['FASE II: Se desplaza.', true]])
  assert.deepEqual(e.hijos[1].hijos[0].vinetas, ['un guion.'], 'el guion va con el inciso abierto (que deja de ser inciso)')
  assert.equal(e.hijos[1].hijos[0].item, undefined)
  const f = O.estructurar('FASE I (DEFENSA) desde el D (0400) hasta el D (1300).\nLa DIV-1 (OC-1) defiende.\nFASE II (CANALIZACIÓN) desde el D (1300) hasta el D (1530).\nLa DIV-1 se repliega.')
  assert.deepEqual(f.hijos.map((h) => [h.titulo, h.sinRotulo, h.texto]), [['FASE I (DEFENSA) desde el D (0400) hasta el D (1300).', true, 'La DIV-1 (OC-1) defiende.'], ['FASE II (CANALIZACIÓN) desde el D (1300) hasta el D (1530).', true, 'La DIV-1 se repliega.']])
  const t = O.estructurar('1) Prioridad de fuego. FASE I a la OC-3.\n2) Restricciones: AFP en todas las poblaciones.')
  assert.deepEqual(t.hijos.map((h) => [h.titulo, h.texto]), [['Prioridad de fuego.', 'FASE I a la OC-3.'], ['Restricciones.', 'AFP en todas las poblaciones.']])
  // el orden en que se escribió: lo que sigue a una lista va DESPUÉS de la lista (el Word pone el texto antes que los guiones)
  const l = O.estructurar('- Abastecimiento: PD-1 en Turco.\n- EPA: Oruro–Turco.\nVer Anexo “F” Apoyo de Servicio de Combate.')
  assert.deepEqual([l.texto, l.vinetas, l.hijos.map((h) => [h.titulo, h.sinRotulo, h.texto])], ['', ['Abastecimiento: PD-1 en Turco.', 'EPA: Oruro–Turco.'], [['', true, 'Ver Anexo “F” Apoyo de Servicio de Combate.']]])
  const g = O.estructurar('Prioridad de fuegos a la DIV MEC-2.\nMatriz de ejecución:\n- FASE IV: destruir AB-010.\nFuegos planificados en la carta:\n- FASE IV: AB-011.\n1) Organización de la Artillería para el Combate.\nRAM-4 : AG CE-I')
  assert.equal(g.texto, 'Prioridad de fuegos a la DIV MEC-2.\nMatriz de ejecución:')
  assert.deepEqual(g.vinetas, ['FASE IV: destruir AB-010.'])
  assert.deepEqual(g.hijos.map((h) => [h.titulo, h.texto, h.vinetas]), [['', 'Fuegos planificados en la carta:', ['FASE IV: AB-011.']], ['Organización de la Artillería para el Combate.', 'RAM-4 : AG CE-I', []]])
  assert.deepEqual(O.organizacionDe('DIV MEC-2 (OD): BIMEC-I, BIMEC-II, GAC-2\nBAJO CONTROL: GALM-1, BAT AA-2'), { equipos: [{ nombre: 'DIV MEC-2 (OD)', elementos: ['BIMEC-I', 'BIMEC-II', 'GAC-2'] }], control: ['GALM-1', 'BAT AA-2'], resto: [] })
})

// ── EL REGISTRO Y EL COMPILADO ──────────────────────────────────────────────────────────────────────────────────
caso('el registro: la Orden para los otros botones (con 🌱 en lo vacío, sin guardar) y la vista de la carpeta', () => {
  ctxDe()
  const s = R.especificacionOrden(undefined, { unidad: 'CE-I', SIDcarta })
  assert.ok(s, 'con el calco cargado hay Orden aunque la F7·P1 esté vacía')
  assert.equal(s.titulo, 'ORDEN GENERAL DE OPERACIONES')
  assert.ok(arbolDe(s.secciones).includes('      FASE I (CONCENTRACIÓN) desde el D-10 hasta el D-8.'))
  const conVieja = R.especificacionOrden(VIEJA, { unidad: 'CE-I', SIDcarta })
  assert.equal(conVieja.secciones.find((x) => x.titulo === 'MISIÓN.').texto, VIEJA['Misión'])
  RT.sincronizarEM({})
  assert.equal(R.especificacionOrden(undefined, {}), null, 'sin nada: los botones bajan lo de antes')
  ctxDe()
  const h = R.fasesConDocumentos({ id: 'g3' }, [{ id: 7, hojas: [{ id: 'opord', num: 'F7·P1', nom: 'Orden General de Operaciones y Anexos', tipo: 'campos' }, { id: 'aprobacion', num: 'F7·P2', tipo: 'campos' }] }])[0].hojas
  assert.equal(h[0].tipo, 'docEM')
  assert.equal(h[1].tipo, 'campos', 'las demás hojas del G-3 quedan como estaban')
  assert.ok(R.esDocumento(h[0]))
  const html = R.htmlDocumento(h[0], VIEJA, { unidad: 'CE-I', SIDcarta })
  assert.ok(html.includes('II.- MISIÓN.') && html.includes(VIEJA['Misión']))
  assert.equal(R.configDe('g3'), G3)
  assert.ok(G3.soloDocumentos)
})

caso('el compilado: la F7·P1 del G-3 pasa por el motor, el avance la cuenta por lo escrito y los botones bajan esta Orden', async () => {
  assert.ok(SRC.includes('ev=[{id:1,nom:"Recibir la misión"') && SRC.includes('}]}].map(SIDf=>SIDEMFases({id:"g3"},[SIDf])[0]),SD=ev.reduce('))
  assert.ok(SRC.includes(`"../estado-mayor/${V}/editor.js"`) && SRC.includes(`"../estado-mayor/${V}/runtime.js"`))
  assert.ok(SRC.includes(`{AyudaHoja as SIDEMAyuda,htmlDocumento as SIDEMHtml,especificacionOrden as SIDEMOrden} from "../estado-mayor/${V}/editor.js"`))
  // el editor reexporta los dos ganchos del registro (el compilado los toma de ahí: sigue importando el motor 3 veces)
  const ED = await import(url(`estado-mayor/${V}/editor.js`))
  assert.equal(ED.especificacionOrden, R.especificacionOrden)
  assert.equal(ED.htmlDocumento, R.htmlDocumento)
  assert.ok(SRC.includes('if(Ke&&SIDEMEs(Ke)){'), 'el Tablero del G-3 abre la F7·P1 en el editor del motor')
  assert.ok(SRC.includes('SIDs=SIDEMOrden(Ya?.opord,'), '«Orden de Operaciones» baja la de la F7·P1')
  assert.ok(SRC.includes('return SIDRecoHTML(e,{ctx:n});if(SIDEMEs(t))return SIDEMHtml(t,e,n)'), 'la carpeta y la vista previa muestran la Orden con su forma')
  const mesa = cargar(VIGENTE, ['Ike', 'Cke', 'Oie', 'Pie', 'Mie', 'hq', 'ev', 'SD', 'CD'], { SIDEMFases: R.fasesConDocumentos, SIDEMEs: R.esDocumento, SIDEMTiene: R.tieneDocumento, SIDRiesgoTiene: () => false, SIDRecoTiene: () => false })
  const hojas = mesa.ev.flatMap((f) => f.hojas)
  const op = hojas.find((x) => x.id === 'opord')
  assert.equal(op.num, 'F7·P1')
  assert.equal(op.tipo, 'docEM')
  assert.ok(op.nota.includes('TEXTO PMTD 2017 (Capítulo VII)'))
  assert.equal(hojas.filter((x) => x.tipo === 'docEM').length, 1, 'sólo la F7·P1')
  assert.equal(op.campos.length, 32, 'la hoja vieja tenía 32 casillas (todas tienen su apartado)')
  for (const k of op.campos) assert.ok(O.esHojaVieja({ [k]: 'x' }), `«${k}» tiene apartado`)
  const fase7 = (t) => mesa.CD(t).porFase.find((f) => f.id === 7).hechas
  assert.equal(fase7({ opord: VIEJA }), 1)
  assert.equal(fase7({ opord: { 'A.1 Maniobra': VIEJA['A.1 Maniobra'] } }), 0, 'sólo cuentas del 🌱 viejo: no está hecha')
  assert.equal(fase7({ opord: M.normalizar(DEF, {}) }), 0)
})

for (const [nombre, f] of casos) {
  try {
    await f()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallos++
    console.log(`  ✘ ${nombre}\n      ${String(e.stack || e.message).split('\n').slice(0, 6).join('\n      ')}`)
  }
}
console.log(fallos ? `\n${fallos} caso(s) fallan.` : '\nTodos los casos pasan.')
process.exit(fallos ? 1 : 0)
