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
  assert.deepEqual(t(sit.hijos), ['Fuerzas enemigas.', 'Fuerzas propias.', 'Refuerzos y reducciones.'], 'sin hipótesis: es una ORDEN de operaciones')
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
  // con los cinco elementos de la F2·P12, en el orden del PMTD: QUIÉN, QUÉ, CUÁNDO, DÓNDE y PROPÓSITO, en una oración
  const e3 = ejercicio()
  e3.g3.mision = {
    'QUIÉN (la unidad que ejecuta)': 'CE-I',
    'QUÉ (tipo de operación + tarea esencial, como tarea táctica)': 'Defender y bloquear a la 1ª Br. Ac. (FICT.)',
    'CUÁNDO (desde / hasta, en términos de tiempo)': 'D (0400) a D+15 (1800)',
    'DÓNDE (AO, objetivos, coordenadas)': 'el AO LAUCA, al oeste de la LF «PUMA»',
    'PROPÓSITO (el porqué de la operación)': 'para impedir que SATURNO penetre hacia TURCO.',
    'ENUNCIADO COMPLETO DE LA MISIÓN': 'El CE-I defiende el AO LAUCA reteniendo la LF «PUMA» (FICT.).',
  }
  assert.equal(O.propuestas(ctxDe(e3)).campos.mision, 'El CE-I, defiende y bloquea a la 1ª Br. Ac. (FICT.) a partir del D (0400) hasta el D+15 (1800) en el AO LAUCA, al oeste de la LF «PUMA» con el propósito de impedir que SATURNO penetre hacia TURCO.')
  assert.equal(C.hipotesis, undefined, 'una ORDEN no lleva hipótesis')
})

caso('🌱: la intención y el concepto como en el PMTD, y la MANIOBRA fase por fase con cada unidad (tarea y propósito)', () => {
  const C = O.propuestas(ctxDe()).campos
  // la intención en prosa, como la Hoja de trabajo del PMTD: «Mi intención es…, para esto es clave… Al finalizar…»
  assert.deepEqual(C.intencion.split('\n'), [
    'Mi intención es detener al primer escalón enemigo al oeste de la LDE-2 (FICT.), para esto es clave inicialmente fijar a la 1ª Br. Ac. al oeste de la LF «PUMA», consolidar la ZO-1, asimismo es importante evacuar civiles hasta el D-10.',
    'Al finalizar la operación, la 1ª Br. Ac. detenida y desgastada, la LDE-2 retenida y el CE-I listo para la Segunda Campaña (FICT.).',
  ])
  // el concepto como el enunciado del CAP de la Div-2 del PMTD, un renglón por idea
  const con = C.concepto.split('\n')
  assert.equal(con[0], 'Vamos a cumplir la misión mediante una defensa de área. El punto decisivo es SIN DATO — verificar (dónde y por qué).')
  assert.equal(con[1], 'Una División Mecanizada (OD y esfuerzo principal) detiene al enemigo en la AA-1 en Guata, con el propósito de que no pase la LF «PUMA».', 'la tarea y el propósito de la fase decisiva (CONDUCCIÓN DE LA DEFENSA)')
  assert.equal(con[2], 'Una División de Infantería (OC-1 y esfuerzo secundario) defiende la LPR a 7 km al O de Julo.')
  assert.equal(con[3], 'Una División de Infantería (RESERVA) constituye la reserva, encontrándose en condiciones de contraatacar en Guata con orden, con prioridad de planeamiento a la OD y posteriormente a la OC-1.')
  assert.ok(con[4].startsWith('El propósito del apoyo de fuegos es neutralizar el 50% de los lanzadores de cohetes LAR-160'))
  assert.equal(con[5], 'La prioridad de esfuerzo de ingeniería será la contramovilidad mediante la construcción de campo minado anticarro y zanja antitanque (FASE III), la prioridad de trabajo será para la Unidad que lleve la OD.', 'los tipos de obstáculo, sin el lugar de cada uno')
  assert.ok(C.concepto.includes('La operación se desarrollará en las siguientes fases:\nFASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).\nFASE II: DESPLAZAMIENTO (desde el D-8 hasta el D-5).'))
  assert.ok(con[con.length - 1].startsWith('Al finalizar la operación, el primer escalón de la VI División de Ejército de SATURNO'), 'el estado final al final')
  assert.ok(!/Esfuerzo principal:|Cumpliremos/.test(C.concepto), 'sin rótulos de la hoja del CAP')
  // la puntuación del PMTD con el punto decisivo de la F2·SAL; la defensa antiaérea y el sostenimiento con sus unidades
  const e2 = ejercicio()
  e2.g3.estructura = { 'PUNTO DECISIVO|Qué comprende y qué se hace en ella': 'El paso Ungallire–Guata porque canaliza a la 1ª Br. Ac. (FICT.)' }
  e2.unidades.push({ id: 'aa2', tipo: 'unidad', bando: 'propias', designacion: 'BAT AA-2', arma: 'antiaerea', escalon: 'batallon', lat: -18.5, lng: -68.5 }, { id: 'log2', tipo: 'unidad', bando: 'propias', designacion: 'BAT LOG-II', arma: 'logistica', escalon: 'batallon', lat: -18.55, lng: -68.45 })
  e2.calco.unidades = e2.unidades
  const C2 = O.propuestas(ctxDe(e2)).campos
  assert.ok(C2.concepto.startsWith('Vamos a cumplir la misión mediante una defensa de área. El punto decisivo es el paso Ungallire–Guata porque canaliza a la 1ª Br. Ac. (FICT.).'))
  assert.ok(C2.concepto.includes('El propósito del apoyo de defensa antiaérea es proporcionar cobertura a las operaciones terrestres, con prioridad a la Unidad que lleve la OD.'))
  assert.ok(C2.concepto.includes('El Batallón Logístico (operación de sostenimiento) tiene la tarea de proporcionar apoyo de servicio de combate, con el propósito de satisfacer las necesidades de vida y de combate de las Unidades empeñadas en primera línea.'))
  assert.ok(C2.antiaerea.startsWith('La tarea de los medios de defensa antiaérea (BAT AA-2) es destruir los vectores aéreos enemigos, con el propósito de proporcionar cobertura a las operaciones terrestres, la prioridad de apoyo a la DIV MEC-2 (OD).'))
  // la maniobra fase por fase, cada unidad con su designación: «La FT VARGAS (OD y esfuerzo principal) defiende…»
  const man = C.maniobra.split('\n')
  const fases = man.filter((l) => /^FASE [IVX]+: /.test(l))
  assert.equal(fases.length, 5, 'las cinco fases del CAP en la carta')
  assert.equal(man[0], 'FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).')
  assert.ok(man.includes('La DIV MEC-2 (OD y esfuerzo principal) se concentra en Turco.'))
  assert.ok(man.includes('La DIV-1 (OC-1 y esfuerzo secundario) se concentra en Huachacalla.'))
  assert.ok(man.includes('La DIV MEC-2 (OD y esfuerzo principal) detiene al enemigo en la AA-1 en Guata, con el propósito de que no pase la LF «PUMA».'))
  assert.ok(man.includes('La DIV-6 (RESERVA) constituye la reserva en Estancia Ticanani, encontrándose en condiciones de ser empleada con orden, con prioridad de planeamiento a la OD y posteriormente a la OC-1.'))
  assert.ok(man.includes('La DIV-6 (RESERVA) continúa como reserva en Estancia Ticanani.'), 'lo que sigue igual: «continúa…»')
  assert.ok(man.includes('La DIV-1 (OC-1 y esfuerzo secundario) continúa defendiendo la LPR a 7 km al O de Julo.'))
  assert.ok(man.includes('La DIV-6 (RESERVA) contraataca en Guata, con el propósito de restablecer la LPR.'))
  assert.ok(man[man.length - 1].startsWith('Se acepta el riesgo de concentrar la masa defensiva'), 'el riesgo al final')
  assert.ok(!man.some((l) => /^La RESERVA: Composición/.test(l)), 'sin la hoja del CAP copiada')
  for (const l of man) assert.ok(!/\d+ (trabajo|límite|punto)\(s\)|ver F\d·P\d/i.test(l), `sin cuentas ni remisiones: ${l}`)
  // los demás del concepto, con la forma de los ejemplos del PMTD
  assert.ok(C.fuegos.startsWith('Los medios de apoyo de fuegos tienen la tarea de ejecutar fuegos de contrabatería masiva e interdicción lejana'))
  assert.ok(C.fuegos.includes(', con el propósito de neutralizar el 50% de los lanzadores de cohetes LAR-160'))
  assert.ok(C.fuegos.includes(', el método: la prioridad de apoyo de fuegos de la FASE I a la FASE V a la DIV MEC-2 (OD), se asignan los blancos AB-010 y AB-011, el efecto será destruir más del 30% de los tanques Leopard 2A4'))
  assert.ok(C.fuegos.includes('Los fuegos planificados:\n- FASE IV: destruir AB-010 en Ungallire con RAM-4, con el propósito de impedir el cruce del Lauca (FICT.); método: fuego de protección final.'))
  assert.ok(C.artilleria.includes('Organización de la Artillería para el Combate.\nGALM-1 : Refuerzo de fuegos DIV MEC-2\nRAM-4 : Acción de conjunto CE-I'))
  assert.equal(C.mcaf, 'LCAF sobre la LDE-1 desde el D (0400) (FICT.).')
  assert.ok(C.reconocimiento.startsWith('El punto focal del esfuerzo de reconocimiento y vigilancia son las áreas de interés nombradas AIN-2, AIN-3 y AIN-5.'))
  assert.ok(C.reconocimiento.includes('Los indicadores a vigilar:\n- AIN-3: movimiento de obuses M109 (FICT.), no antes del D-1 y no después del D+1.'))
  assert.deepEqual(C.inteligencia.split('\n'), ['El enfoque de recopilación de inteligencia está dirigido a determinar el dispositivo de ataque, la dirección del esfuerzo principal y las rutas alternas que pueda emplear la 1ª BR. AC. «CORACEROS» en nuestra área de operaciones.', 'La prioridad de apoyo a la DIV MEC-2 (OD).', 'Ver Anexo “B” Inteligencia.'])
  assert.ok(C.ingenieros.startsWith('La prioridad de esfuerzo es de contramovilidad mediante la construcción de campo minado anticarro y zanja antitanque (FASE III), la prioridad de trabajo a la DIV MEC-2 (OD) y posteriormente a la DIV-1 (OC-1).'))
  assert.ok(C.ingenieros.includes('\n- Contramovilidad: Construcción de la Zona de Obstáculos principal ZO-1'))
  assert.ok(C.antiaerea.includes('Por fase:\n- FASE IV: Prioridad al PC de Ticanani (FICT.).'))
  assert.ok(C.acgm.startsWith('Evacuar la población de Guata antes del D-10 (FICT.).'))
  assert.ok(C.acgm.endsWith('Ver Anexo “H” Asuntos Civiles y Gobierno Militar.'))
})

caso('🌱: las TAREAS fase por fase (todas las unidades, TAREA y PROPÓSITO), los RCIC de cada sección, IV y V', () => {
  const C = O.propuestas(ctxDe()).campos
  // fase por fase y, en cada fase, TODAS las unidades de maniobra con la reserva: «1.- DIV MEC-2 (OD).», «TAREA:», «PROPÓSITO:»
  const tm = C.tareasManiobra.split('\n')
  assert.deepEqual(tm.filter((l) => /^FASE [IVX]+: /.test(l)).length, 5)
  assert.deepEqual(tm.slice(0, 10), [
    'FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).',
    '1.- DIV MEC-2 (OD).',
    'TAREA: Se concentra en Turco.',
    'PROPÓSITO: SIN DATO — verificar.',
    '2.- DIV-1 (OC-1).',
    'TAREA: Se concentra en Huachacalla.',
    'PROPÓSITO: SIN DATO — verificar.',
    '3.- DIV-6 (RESERVA).',
    'TAREA: Se concentra en Turco.',
    'PROPÓSITO: SIN DATO — verificar.',
  ])
  for (let i = 0; i < 5; i++) assert.deepEqual(tm.filter((l) => /^\d+\.- /.test(l)).slice(i * 3, i * 3 + 3), ['1.- DIV MEC-2 (OD).', '2.- DIV-1 (OC-1).', '3.- DIV-6 (RESERVA).'], 'las tres unidades en cada fase')
  const iv = tm.indexOf('FASE IV: CONDUCCIÓN DE LA DEFENSA (desde el D hasta el D+8).')
  assert.deepEqual(tm.slice(iv + 1, iv + 10), [
    '1.- DIV MEC-2 (OD).',
    'TAREA: Detiene al enemigo en la AA-1 en Guata.',
    'PROPÓSITO: Que no pase la LF «PUMA».',
    '2.- DIV-1 (OC-1).',
    'TAREA: Defiende la LPR a 7 km al O de Julo.',
    'PROPÓSITO: SIN DATO — verificar.',
    '3.- DIV-6 (RESERVA).',
    'TAREA: Continúa como reserva.',
    'PROPÓSITO: Encontrarse en condiciones de ser empleada con orden, con prioridad de planeamiento a la OD y posteriormente a la OC-1.',
  ])
  assert.ok(tm.includes('TAREA: Continúa deteniendo al enemigo en la AA-1 en Guata.'), 'lo que sigue igual: «Continúa…», con su propósito')
  assert.ok(tm.includes('TAREA: Contraataca en Guata.') && tm.includes('PROPÓSITO: Restablecer la LPR.'))
  // las de apoyo de combate, con la misma forma: la relación de apoyo desde su fase y sus fuegos
  const ta = C.tareasApoyo.split('\n')
  assert.deepEqual(ta.slice(0, 4), ['FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).', '1.- RAM-4.', 'TAREA: Ejecuta acción de conjunto en apoyo del CE-I.', 'PROPÓSITO: SIN DATO — verificar.'], 'el GALM-1 recién desde la FASE II')
  assert.ok(C.tareasApoyo.includes('FASE II: DESPLAZAMIENTO (desde el D-8 hasta el D-5).\n1.- GALM-1.\nTAREA: Refuerza los fuegos de la DIV MEC-2 (OD).'))
  assert.ok(C.tareasApoyo.includes('2.- RAM-4.\nTAREA: Ejecuta acción de conjunto en apoyo del CE-I; destruye AB-010 en Ungallire.\nPROPÓSITO: Impedir el cruce del Lauca (FICT.).'))
  assert.equal(C.vigencia, 'La presente orden entra en vigor a partir de su emisión.\nDía D: 15 de noviembre (FICT.); hora H: 0400.')
  // los RCIC que determinó CADA sección (la F2·P8 del G-1, G-3, G-4 y G-5 y el Plan de búsqueda del G-2), primero los que
  // priorizó el Comandante; RPI y RIFA por separado, uno por renglón, sin repetir
  assert.equal(C.rpi, '1) ¿Por qué avenida (FICT.) empeña el enemigo su esfuerzo principal?\n2) ¿Dónde emplaza el enemigo sus lanzadores LAR-160 (FICT.)?\n3) ¿Cuántos civiles permanecen al oeste de la LF «PUMA» (FICT.)?')
  assert.equal(C.rifa, '1) Informar cuando la DIV-6 complete su aclimatación en TURCO (FICT.).\n2) Informar cuando las bajas de la DIV MEC-2 superen el 10 % de sus efectivos (FICT.).\n3) Informar cuando la Clase III de la DIV MEC-2 baje de dos días de consumo (FICT.).')
  assert.equal(C.eeia, 'a.- La ubicación de la reserva (FICT.).')
  const req = O.requerimientosDe(ctxDe())
  assert.deepEqual(req.find((x) => /avenida/.test(x.r)).de, ['G-2'], 'el que priorizó el Comandante y también trae el G-2 va una vez')
  assert.deepEqual(req.map((x) => x.de.join('/')).filter(Boolean), ['G-2', 'G-2', 'G-3', 'G-1', 'G-4', 'G-5'])
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
  // sin el anexo del G-4, el concepto de apoyo por fase del calco dicho como en el PMTD
  const e4 = ejercicio()
  e4.hojasG.g4.anexoF7P1 = { campos: {} }
  e4.calco.conceptoApoyo = [null, null, { enfoque: ['abastecimiento de Clase IV', 'Clase V'], prioridad: 'DIV MEC-2 (OD)' }]
  assert.ok(O.propuestas(ctxDe(e4)).campos.conceptoApoyo.includes('- FASE III (Ocupación y organización): el enfoque de apoyo logístico es de abastecimiento de Clase IV, Clase V, la prioridad de apoyo a la DIV MEC-2 (OD).'))
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
  assert.deepEqual(vacios.sort(), ['situacion', 'apoyoAereo', 'policiaMilitar', 'proteccion', 'qbn', 'refuerzos', 'limiteAvance'].sort())
})

caso('🌱: sin pisar; con la hoja vieja trae todo lo demás; sin datos no inventa', () => {
  const ctx = ctxDe()
  const P1 = O.propuestas(ctx)
  const x = M.armar(DEF, VIEJA, P1)
  assert.equal(x.valor.campos.mision, VIEJA['Misión'], 'lo que escribió el oficial manda')
  assert.ok(x.valor.campos.maniobra.startsWith('FASE I: CONCENTRACIÓN'), 'la maniobra del 🌱 viejo (cuentas) no estorbaba: ahora viene la de la carta')
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

caso('la forma del PMTD: la intención con rótulos pasa a prosa; la fase decisiva; la unidad genérica del concepto', () => {
  // como venía en la F7·P1 del CE-I: «Propósito: … Punto decisivo: … Tareas clave: … Estado final: …»
  const conRotulos = 'Propósito: detener al primer escalón enemigo al oeste de la LDE-2, sin perder los ejes hacia ORURO (FICT.). Punto decisivo: el desfiladero de UNGALLIRE–GUATA (FICT.). Tareas clave: fijar al enemigo al oeste de la LF «PUMA»; consolidar la ZO-1; vigilar el vacío al sur del Volcán PUQUINTICA. Estado final: 1ª Br. Ac. detenida en la ZO-1 (FICT.).'
  assert.deepEqual(O.intencionEnProsa(conRotulos).split('\n'), [
    'Mi intención es detener al primer escalón enemigo al oeste de la LDE-2, sin perder los ejes hacia ORURO (FICT.), para esto es clave inicialmente fijar al enemigo al oeste de la LF «PUMA», consolidar la ZO-1, asimismo es importante vigilar el vacío al sur del Volcán PUQUINTICA.',
    'Al finalizar la operación, 1ª Br. Ac. detenida en la ZO-1 (FICT.).',
  ])
  assert.equal(O.partesIntencion(conRotulos).pd, 'el desfiladero de UNGALLIRE–GUATA (FICT.).', 'el punto decisivo queda para el concepto')
  // el estado final en sus tres partes: la propia fuerza, el enemigo y la operación futura
  assert.equal(
    O.intencionEnProsa('Propósito: facilitar la destrucción de la FT-43 (FICT.)\nTareas clave:\n1) Aprovechar el terreno en los trabajos de OT.\n2) Recibir al GRM-I por el PP-B antes del D (0400).\nCómo queda la propia fuerza: La FT «LANZA» se encontrará ocupando posiciones en Coord. 7600-4400 (FICT.)\nCómo queda el enemigo: el RIMEC-6 habrá sido destruido (FICT.)\nOperación futura: realizar operaciones ofensivas con orden'),
    'Mi intención es facilitar la destrucción de la FT-43 (FICT.), para esto es clave inicialmente aprovechar el terreno en los trabajos de OT y recibir al GRM-I por el PP-B antes del D (0400).\nAl finalizar la operación, la FT «LANZA» se encontrará ocupando posiciones en Coord. 7600-4400 (FICT.), el RIMEC-6 habrá sido destruido (FICT.), encontrándonos en condiciones de realizar operaciones ofensivas con orden.',
  )
  // la que escribía antes la Mesa, y la que ya está en prosa
  assert.equal(O.intencionEnProsa('El propósito de la operación es detener al enemigo (FICT.).\nPara esto será necesario cumplir las siguientes tareas clave:\n1) Fijar al enemigo.\n2) Consolidar la ZO-1.\nAl finalizar la operación, el enemigo detenido (FICT.).'), 'Mi intención es detener al enemigo (FICT.), para esto es clave inicialmente fijar al enemigo y consolidar la ZO-1.\nAl finalizar la operación, el enemigo detenido (FICT.).')
  assert.equal(O.intencionEnProsa('Mi intención es X (FICT.).'), 'Mi intención es X (FICT.).')
  assert.deepEqual(O.listaTareas('PRIMERO.- Sobreextender las líneas. SEGUNDO.- Aislar a las Brigadas Reserva.'), ['Sobreextender las líneas', 'Aislar a las Brigadas Reserva'])
  // la fase decisiva: la que se llama como el combate, no como un movimiento
  const f = (n, nombre) => ({ n, nombre, unidades: [] })
  assert.equal(O.faseDecisiva([f(1, 'Concentración'), f(2, 'Ocupación y organización'), f(3, 'Conducción de la defensa'), f(4, 'Contraataque y consolidación')]).n, 3)
  assert.equal(O.faseDecisiva([f(1, 'Ocupación y organización de la PD'), f(2, 'Defensa de la posición defensiva'), f(3, 'Reorganización')]).n, 2)
  // la unidad dicha como en el concepto del PMTD
  const ctx = ctxDe()
  assert.deepEqual(['DIV MEC-2', 'DIV-1', 'FT VARGAS', 'RI-20'].map((n) => O.genericoDe(ctx, n)), ['Una División Mecanizada', 'Una División de Infantería', 'Una Fuerza de Tarea', 'Un Regimiento'])
  assert.equal(O.genericoDe(ctx, 'BAT LOG-II', { definido: true }), 'El Batallón Logístico')
})

caso('♻️ Rehacer: la Orden ya escrita con otra forma pasa a la del PMTD (y se puede volver atrás); nunca hay hipótesis', () => {
  // como la F7·P1 del CE-I: la escribió la IA con rótulos, tareas por unidad e hipótesis
  // (M.normalizar: como la guarda el editor)
  const escrita = M.normalizar(DEF, M.armar(DEF, {}, {
    campos: {
      mision: 'El I Cuerpo de Ejército (CE-I) defiende el AO LAUCA a partir del D (0400), reteniendo la LPR, sin permitir… (FICT.).',
      intencion: 'Propósito: detener al primer escalón (FICT.). Punto decisivo: Ungallire (FICT.). Tareas clave: fijar al enemigo (FICT.). Estado final: enemigo detenido (FICT.).',
      tareasManiobra: 'DIV MEC-2: Ocupar LPR (FICT.). DIV-1: Ocupar LPR en el sector sur (FICT.).',
      refuerzos: 'Se incorporan la DIV-1 y la DIV-6 (FICT.).\nD.- Hipótesis.\nEl avance enemigo será canalizado (FICT.).',
      ioc: 'IOC «ILLIMANI» (escrito por el oficial, FICT.).',
    },
  }).valor)
  assert.equal(escrita.campos.refuerzos, 'Se incorporan la DIV-1 y la DIV-6 (FICT.).', 'la hipótesis no queda en ningún apartado')
  const ctx = ctxDe()
  const r = M.rehacer(DEF, escrita, O.propuestas(ctx), DOC.rehacer.campos)
  assert.ok(r.cambios.includes('MISIÓN') && r.cambios.includes('Intención del Comandante') && r.cambios.includes('Tareas de las unidades de maniobra'), r.cambios.join(' · '))
  assert.ok(r.valor.campos.intencion.startsWith('Mi intención es detener al primer escalón enemigo'))
  assert.ok(r.valor.campos.tareasManiobra.startsWith('FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).\n1.- DIV MEC-2 (OD).\nTAREA: Se concentra en Turco.'))
  assert.ok(r.valor.campos.concepto.startsWith('Vamos a cumplir la misión mediante una defensa de área.'))
  assert.equal(r.valor.campos.ioc, 'IOC «ILLIMANI» (escrito por el oficial, FICT.).', 'lo que no es de la forma del PMTD no se toca')
  assert.equal(r.valor.campos.refuerzos, escrita.campos.refuerzos)
  // lo que había queda guardado (también después de guardar) y vuelve con «↩️ Volver a lo anterior»
  const guardado = M.normalizar(DEF, JSON.parse(JSON.stringify(r.valor)))
  assert.equal(guardado.anterior.campos.intencion, escrita.campos.intencion)
  const atras = M.volverAnterior(DEF, guardado)
  assert.equal(atras.campos.intencion, escrita.campos.intencion)
  assert.equal(atras.campos.tareasManiobra, escrita.campos.tareasManiobra)
  assert.equal(atras.anterior, undefined)
  // sin nada nuevo que traer, no cambia nada
  assert.deepEqual(M.rehacer(DEF, r.valor, O.propuestas(ctx), DOC.rehacer.campos).cambios, [])
  // la IA que escribe igual las hipótesis: no quedan (ni en el JSON ni escritas como documento), ni en el Word
  const prosa = ['I.- SITUACIÓN.', 'C.- Refuerzos y reducciones.', 'Se incorporan la DIV-1 (FICT.).', 'D.- Hipótesis.', 'El avance enemigo será canalizado (FICT.).', '', 'II.- MISIÓN.', 'El CE-I defiende (FICT.).'].join('\n')
  const d = M.aplicarRespuesta(DEF, prosa, {})
  assert.equal(d.valor.campos.refuerzos, 'Se incorporan la DIV-1 (FICT.).')
  const j = M.aplicarRespuesta(DEF, '```json\n' + JSON.stringify({ campos: { refuerzos: 'Omitido.', hipotesis: 'X (FICT.)' } }) + '\n```', {})
  assert.ok(j.ok && !('hipotesis' in j.valor.campos))
  const w = O.especificacion({ esquema: 'ogo-v1', campos: { hipotesis: 'Vieja (FICT.)', refuerzos: 'R (FICT.)\nHipótesis: vieja (FICT.)' } }, {})
  const sit = w.secciones.find((x) => x.titulo === 'SITUACIÓN.')
  assert.deepEqual(sit.hijos.map((h) => h.titulo), ['Fuerzas enemigas.', 'Fuerzas propias.', 'Refuerzos y reducciones.'])
  assert.equal(sit.hijos[2].texto, 'R (FICT.)')
})

caso('la carta del CE-I de Sergio: las fichas genéricas («OD», «OC 1», «RES») no son unidades; las divisiones dependen del CE-I por su id', () => {
  const e = ejercicio()
  // disgregar.mjs: la madre va por el id de su ficha
  for (const u of e.unidades) if (/^DIV/.test(u.designacion)) u.dependeDe = 'pc-ce'
  // cada fase trae también las fichas genéricas de la formación inicial, como brigadas, todas «esfuerzo principal»
  const gen = { 'DIV MEC-2': 'OD', 'DIV-1': 'OC 1', 'DIV-6': 'RES' }
  for (const f of e.fasesCOA.propio) {
    const extra = (f.unidades || []).filter((u) => gen[u.designacion]).map((u) => ({ ...u, id: `g-${u.id}`, designacion: gen[u.designacion], escalon: 'brigada', tarea: 'Retardar sobre la AA-1 y pasar por las líneas (FICT.)', principal: true }))
    f.unidades = [...f.unidades.map((u) => (u.designacion === 'DIV-1' ? { ...u, principal: true } : u)), ...extra]
  }
  const C = O.propuestas(ctxDe(e)).campos
  assert.ok(!/Una Brigada/.test(C.concepto), `sin brigadas propias: ${C.concepto}`)
  assert.ok(C.concepto.includes('Una División Mecanizada (OD y esfuerzo principal)'))
  assert.ok(C.concepto.includes('Una División de Infantería (OC-1 y esfuerzo secundario)'), 'un solo esfuerzo principal: la OD')
  assert.deepEqual(unicosDe(C.tareasManiobra.split('\n').filter((l) => /^\d+\.- /.test(l))), ['1.- DIV MEC-2 (OD).', '2.- DIV-1 (OC-1).', '3.- DIV-6 (RESERVA).'], 'las divisiones, no «OD», «OC 1» ni «RES»')
  assert.ok(!/\b(OD|OC 1|RES)\.$/m.test(C.tareasManiobra))
  assert.ok(!C.maniobra.includes('La DIV-1 (OC-1 y esfuerzo principal)'), 'en cada fase, un solo esfuerzo principal')
  assert.ok(C.sucesion.includes('Comandante de la DIV MEC-2 (OD).'), 'la sucesión de mando con las divisiones')
  // los verbos coordinados en presente, «lista para…» con su verbo, y sin coordenadas decimales
  assert.deepEqual(['Retardar sobre la AA-1 y pasar por las líneas', 'Reunirse y sumarse al contraataque', 'Lista para contraatacar (punto de decisión)', 'Ocupar y organizar la posición', 'Contraatacar y destruir al enemigo'].map(O.presenteTodo), ['retarda sobre la AA-1 y pasa por las líneas', 'se reúne y se suma al contraataque', 'se encuentra lista para contraatacar (punto de decisión)', 'ocupa y organiza la posición', 'contraataca y destruye al enemigo'])
  assert.equal(O.conCoordenadas('retarda en -18.5347, -68.7610.'), 'retarda en Coord. 18°32\'05"S 68°45\'40"O.')
  assert.equal(O.proposito('DESTRUIR al enemigo en la zona de destrucción'), 'con el propósito de destruir al enemigo en la zona de destrucción')
})
const unicosDe = (xs) => [...new Set(xs)]

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
      ...DOC.bloquesIA(ctx, HOJA, M.normalizar(DEF, valor)),
    ],
    doctrina: G3.doctrina(),
    tarea: DOC.tareaIA,
    ideasQue: DOC.ideasQue,
    reglas: DOC.reglas,
    verificacion: DOC.verificacion,
    ...op,
  })
}
caso('la IA parte del BORRADOR de la Mesa (♻️): lo mejora, no lo rehace; con el documento ya rehecho, no lo repite', () => {
  const p = pedidoDe().prompt
  for (const t of [
    'PARTÍ DEL BORRADOR DE LA MESA',
    'Tu trabajo es MEJORARLO, no rehacerlo',
    'si son Divisiones, son Divisiones: nunca «Brigada»',
    '# EL BORRADOR DE LA MESA',
    '### MISIÓN — clave "mision"',
    '### Tareas de las unidades de maniobra — clave "tareasManiobra"\nFASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).\n1.- DIV MEC-2 (OD).\nTAREA: Se concentra en Turco.',
    '### Requerimientos prioritarios de inteligencia (RPI) — clave "rpi"',
  ])
    assert.ok(p.includes(t), `el pedido no trae «${t}»`)
  assert.ok(p.indexOf('# EL BORRADOR DE LA MESA') < p.indexOf('# EJEMPLO DE REDACCIÓN'), 'el borrador antes que el ejemplo')
  // el documento ya rehecho con ♻️: el borrador no se repite
  const rehecha = M.rehacer(DEF, {}, O.propuestas(ctxDe()), DOC.rehacer.campos).valor
  const q = pedidoDe(rehecha).prompt
  assert.ok(q.includes('El DOCUMENTO DE HOY ya es el borrador de la Mesa en esos apartados'))
  assert.ok(!q.includes('### MISIÓN — clave "mision"'))
  // sin coordenadas decimales en lo que la Mesa le pasa
  assert.ok(!/-?\d{1,2}\.\d{4},\s*-?\d{1,3}\.\d{4}/.test(G3.datosCalco(ctxDe(), HOJA)))
})

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
    'Se asume como riesgo',
    'EJEMPLO DE REDACCIÓN',
    'KILÓMETRO 7',
    // la forma de cada párrafo, con los ejemplos del PMTD
    'QUIÉN, QUÉ, CUÁNDO, DÓNDE y PROPÓSITO',
    'La Div-2, defiende y destruye al batallón de tanques a partir del D(0600) hasta D+6 (1800)',
    'Mi intención es facilitar la destrucción de la FT-43 en el AE. YUNQUE',
    'CÓMO QUEDA LA PROPIA FUERZA',
    'Una Fuerza de Tarea fuerte en Infantería (OD y esfuerzo principal) defiende y bloquea al BIM (OD) de la DIMEC – 56',
    'La Fuerza de Tarea VARGAS fuerte en Infantería (OD y esfuerzo principal)',
    'Los medios de apoyo de fuegos tienen la tarea de suprimir',
    'El enfoque de recopilación de inteligencia está dirigido a',
    'La prioridad de esfuerzo es de contra movilidad',
    'La tarea de los medios de ADA es destruir vectores aéreos',
    'El enfoque de apoyo logístico es de abastecimiento de clase III y V',
    'TAREA: Defiende y bloquea al BIM (OD) de la DIMEC – 56.',
    'PROPÓSITO: Evitar la conquista de Co. TUNARI.',
    'la intención NO va como «Propósito: … Punto decisivo: … Tareas clave: … Estado final: …»',
    // los RCIC de cada sección
    'LOS RCIC QUE YA DETERMINÓ CADA SECCIÓN DEL ESTADO MAYOR',
    '- RPI (G-2): ¿Dónde emplaza el enemigo sus lanzadores LAR-160 (FICT.)?',
    '- RIFA (G-4): Informar cuando la Clase III de la DIV MEC-2 baje de dos días de consumo (FICT.).',
    '- RPI (G-5): ¿Cuántos civiles permanecen al oeste de la LF «PUMA» (FICT.)?',
    // lo de la Mesa
    'El CAE del G-2 (PICB): el MÁS PROBABLE',
    'La misión aprobada (F2·P12)',
    'Las fases del CAP aprobado en la carta: lo que hace CADA unidad',
    '- DIV MEC-2 (OD) [esfuerzo principal]: Detener al enemigo en la AA-1, en Guata — para que no pase la LF «PUMA»',
    '- Reemplazos: 450 reemplazos el D-3 (FICT.)',
    '- Seguridad del área de retaguardia: Nivel II (FICT.).',
    '- Previsión de evacuación y dimensionamiento del apoyo: Puesto de reunión de evacuados en Corque (FICT.)',
    'Matriz de ejecución de apoyo de fuegos (F4·P7)',
    'Los RCIC de cada sección',
    'Lo del G-4 (Anexo de Apoyo de Servicio de Combate',
    'Lo del G-1 (Anexo de Personal)',
    'Lo del G-5 (Anexo de AC/GM)',
    'El G-2 (PICB)',
    // las reglas y la verificación
    '«1.- DIV MEC-2 (OD).»',
    'NO escribas hipótesis ni suposiciones en ninguna parte',
    'MANIOBRA: FASE POR FASE',
    '"maniobra": "…"',
    '"prioridadCom": "…"',
  ])
    assert.ok(p.includes(t), `el pedido no trae «${t}»`)
  assert.ok(!/\d+ l[ií]mite\(s\), \d+ punto\(s\)/.test(p), 'sin las cuentas del calco')
  assert.ok(!p.includes('La DIMEC-2 (OC-2), esfuerzo principal'), 'el ejemplo ya no lleva la forma de KM 7 para la maniobra ni para las tareas')
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
  campos.maniobra = 'FASE I (CONCENTRACIÓN) desde el D-10 hasta el D-8.\nLa DIV MEC-2 (OD), esfuerzo principal, se concentra en Turco (IA, FICT.).'
  const resp = '```json\n' + JSON.stringify({ campos }) + '\n```'
  const a = M.aplicarRespuesta(DEF, resp, {})
  assert.ok(a.ok, a.error)
  assert.equal(a.valor.campos.maniobra, campos.maniobra)
  assert.ok(!('hipotesis' in a.valor.campos), 'sin hipótesis: es una ORDEN')
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
  linea('      FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).')
  linea('    2.- Apoyo de fuegos.')
  linea('      a.- Apoyo aéreo.')
  linea('      b.- Apoyo de artillería de campaña.')
  linea('    9.- Operaciones de AC/GM.')
  linea('  B.- Tareas de las unidades de maniobra.')
  linea('    FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).')
  linea('    1.- DIV MEC-2 (OD).')
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
  assert.ok(int.texto.startsWith('Mi intención es detener al primer escalón enemigo'))
  // el concepto enumera las fases en su texto (no son subtítulos que se lleven el estado final)
  const con = s.secciones.find((x) => x.titulo === 'EJECUCIÓN.').hijos[1]
  assert.ok(con.texto.includes('La operación se desarrollará en las siguientes fases:\nFASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).'))
  assert.ok(con.texto.split('\n').pop().startsWith('Al finalizar la operación,'))
  assert.deepEqual(con.hijos.map((h) => h.titulo).slice(0, 2), ['Maniobra.', 'Apoyo de fuegos.'])
  // las tareas: cada unidad es un subpárrafo con su TAREA y su PROPÓSITO, debajo de su fase
  const tar = s.secciones.find((x) => x.titulo === 'EJECUCIÓN.').hijos[2]
  assert.equal(tar.hijos[0].titulo, 'FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).')
  assert.deepEqual([tar.hijos[0].hijos[0].titulo, tar.hijos[0].hijos[0].texto], ['DIV MEC-2 (OD).', 'TAREA: Se concentra en Turco.\nPROPÓSITO: SIN DATO — verificar.'])
  // el riesgo va después de las fases de la maniobra, no dentro de la última
  const man = con.hijos[0]
  assert.equal(man.hijos[4].titulo, 'FASE V: CONTRAATAQUE Y CONSOLIDACIÓN (desde el D+8 hasta el D+15).')
  assert.ok(!man.hijos[4].texto.includes('riesgo'))
  assert.ok(man.hijos[5].texto.startsWith('Se acepta el riesgo'))
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
  assert.ok(arbolDe(s.secciones).includes('      FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).'))
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
