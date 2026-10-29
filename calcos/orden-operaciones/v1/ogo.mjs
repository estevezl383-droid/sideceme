// 📜 La ORDEN GENERAL DE OPERACIONES (F7·P1 del G-3, Fase VII «Elaborar planes y órdenes») con la forma del PMTD
// 2017 (RO-06-01-02, Parte Tercera, Cap. VII «Elaboración de planes y órdenes», VI.- Técnica de elaboración) y de los
// modelos de la Escuela («OGO 01-35 (PICB)», «ORDEN GENERAL DE OPERACIONES No. 01/21» del CE-I y la «ORDEN DE
// OPERACIONES 05/24» del RI-20).
//
// Lo pidió Sergio el 27-10-2026 con el Word que le bajó la Mesa («F7P1_Orden_General_de_Operaciones.docx»): «está
// demasiado incompleta, mal redactada y muy mal hecha… la OGO contiene tareas y un montón de información que ya hay
// en la Mesa». Lo que pasaba:
//   · la hoja tenía claves como «A.1 Curso de acción más PROBABLE» y el Word genérico (R3e del compilado) les ponía
//     encima su propia numeración: salía «I. Encabezamiento · A. OBJETO», «III. I.- SITUACIÓN», «B. 1 Curso de
//     acción más PROBABLE», «C. 1 Maniobra», «G. 5 Ingenieros»; OBJETO, CARTA y ANEXOS quedaban «[Pendiente]» arriba
//     y repetidos como párrafos;
//   · la ORGANIZACIÓN DE LA TAREA salía como texto y no como el cuadro de los modelos;
//   · la INTENCIÓN salía como «Propósito: … Punto decisivo: … Tareas clave: …» y no redactada en forma inextensa
//     («Mi intención es …, para esto es clave: … Al finalizar la operación …», PMTD 2017, 14.° paso);
//   · 🌱 traía casi nada («Medios disponibles: RES (alcance 23 km)», «Agrupación (OD): Atacar con Fuego.», «18
//     límite(s), 15 punto(s) de coordinación…»), aunque el Estado Mayor ya había trabajado la misión, la intención,
//     el CAP aprobado con sus fases, la organización de la tarea, los RCIC, el riesgo, la matriz de sincronización, el
//     concepto de apoyo…;
//   · las tareas de cada unidad no salían como subpárrafos (1.- unidad, a.- tarea), ni las instrucciones de
//     coordinación como la lista numerada del PMTD; la autenticación decía «G3» y la distribución «UU. DEP.».
//
// Acá está todo, sin dependencias del compilado: la hoja (`HOJA`), la guía (`GUIA`), lo que se le dice a la IA
// (`ayudaIA`), 🌱 (`semillaOgo`), la lectura de lo guardado con las claves de antes (`leerOgo`) y el Word con el
// formato militar de la Mesa (`wordOgo`). Lo que necesita del compilado (lo que ya traía 🌱 —el CAE, los fuegos, el
// plan de barreras—, la carta para nombrar los lugares, la Línea de Tiempo) llega en `aux`.
import { lecturaDelEjercicio, oraciones } from '../../conceptos/v4/modelo.js'
import { capAprobado } from '../../orden-preparatoria/v1/prep.mjs?v=op320261026'
import { describirFases } from '../../cap-propios/v1/texto-carta.mjs'
import { normalizarRiesgo } from '../../riesgo/v2/modelo.js'

// ─── La hoja: las casillas en el orden del documento ────────────────────────────────────────────────────────────
// La clave lleva la numeración del modelo (la ve el oficial y la IA); el Word la vuelve a numerar sola, así que una
// casilla optativa vacía no deja un hueco («la cantidad de subpárrafos depende de lo que el Comandante considera
// apropiado», PMTD 2017).
export const K = {
  objeto: 'OBJETO',
  cartas: 'CARTAS',
  anexos: 'ANEXOS',
  org: 'ORGANIZACIÓN DE LA TAREA',
  enemigas: 'I.- A.- Fuerzas enemigas',
  probable: 'I.- A.- 1.- Curso de acción más probable',
  peligroso: 'I.- A.- 2.- Curso de acción más peligroso',
  propias: 'I.- B.- Fuerzas propias',
  refuerzos: 'I.- C.- Refuerzos y reducciones',
  hipotesis: 'I.- D.- Hipótesis (sólo en el Plan de Operaciones)',
  mision: 'II.- MISIÓN',
  intencion: 'III.- Intención del Comandante',
  concepto: 'III.- A.- Concepto de la operación',
  maniobra: 'III.- A.- 1.- Maniobra',
  fuegos: 'III.- A.- 2.- Fuegos',
  aereo: 'III.- A.- 2.- a.- Apoyo aéreo',
  artilleria: 'III.- A.- 2.- b.- Apoyo de artillería de campaña',
  mcaf: 'III.- A.- 2.- c.- Medidas de coordinación de apoyo de fuegos',
  reconocimiento: 'III.- A.- 3.- Reconocimiento y vigilancia',
  inteligencia: 'III.- A.- 4.- Inteligencia',
  ingenieros: 'III.- A.- 5.- Ingenieros',
  ada: 'III.- A.- 6.- Defensa antiaérea',
  qbn: 'III.- A.- 7.- Operaciones QBN',
  pm: 'III.- A.- 8.- Operaciones de la Policía Militar',
  acgm: 'III.- A.- 9.- Operaciones de AC/GM',
  proteccion: 'III.- A.- 10.- Protección',
  info: 'III.- A.- 11.- Operaciones de información',
  tareasManiobra: 'III.- B.- Tareas de las unidades de maniobra',
  tareasApoyo: 'III.- C.- Tareas de las unidades de apoyo de combate',
  coordinacion: 'III.- D.- Instrucciones de coordinación',
  apoyoConcepto: 'IV.- A.- Concepto de apoyo',
  personal: 'IV.- B.- Personal',
  comando: 'V.- A.- Comando',
  comunicaciones: 'V.- B.- Comunicaciones',
}
export const CAMPOS = Object.values(K)

const GRUPO = {
  [K.objeto]: 'OBJETO · CARTAS · ANEXOS',
  [K.cartas]: 'OBJETO · CARTAS · ANEXOS',
  [K.anexos]: 'OBJETO · CARTAS · ANEXOS',
  [K.org]: 'ORGANIZACIÓN DE LA TAREA',
}
for (const k of CAMPOS) {
  if (GRUPO[k]) continue
  GRUPO[k] = k.startsWith('I.-') ? 'I.- SITUACIÓN' : k.startsWith('II.-') ? 'II.- MISIÓN' : k.startsWith('III.-') ? 'III.- EJECUCIÓN' : k.startsWith('IV.-') ? 'IV.- APOYO DE SERVICIO' : 'V.- COMANDO Y COMUNICACIONES'
}

// Lo que dice el PMTD 2017 de cada casilla (la instrucción del modelo, literal o resumida sin sacar nada) y cómo se
// escribe en la hoja para que el Word salga con su forma.
export const AYUDA = {
  [K.objeto]: 'El asunto en una línea: «El CE-I en la ejecución de Operaciones Defensivas.» / «La DIVMEC-1 en la Defensa Móvil.»',
  [K.cartas]: 'La carta, su escala y su edición: «Mosaico Especial SEVARUYO Esc. 1:50.000.»',
  [K.anexos]: 'Uno por renglón, con su letra y el nombre del sistema (en una ORDEN los anexos llevan el nombre del sistema; en un PLAN, «Plan de…»): «“A” Calco de Operaciones.» · «“B” Inteligencia.» · «“C” Apoyo de Fuegos.»…',
  [K.org]: 'La disposición de las fuerzas para apoyar el concepto de la operación (PMTD 2017). Una agrupación por renglón: «DIMEC-1 (OC-1): BIMEC-I; BIMEC-II; GAC-I; BATING-I». Las que dependen directamente del Comando, en un renglón «BAJO CONTROL: RAC-21; RAA-22; …». El Word lo pone en el CUADRO de la Organización de la Tarea.',
  [K.enemigas]: 'En términos de DOS escalones enemigos por debajo del suyo (la División habla de compañías; el Batallón, de secciones): composición, dispositivo, efectivos, medios y refuerzos. Puede remitir al Anexo de Inteligencia.',
  [K.probable]: 'Descripción concisa de las acciones más probables de la amenaza, de principio a fin, vista desde su lado: la tarea y el propósito de cada uno de sus elementos principales, cómo empleará sus armas de apoyo, sus objetivos y su estado final deseado. Es la transcripción del CAE que elaboró el G-2 (PICB) y que se sometió al Juego de Guerra.',
  [K.peligroso]: 'Lo que la amenaza es capaz de hacer y que pone en riesgo el curso de acción propio; dentro de sus capacidades y su doctrina; con el mismo detalle.',
  [K.propias]: 'La misión, la intención y el concepto de la operación de DOS escalones arriba; las misiones de las unidades de los flancos y de las otras cuyas acciones afectan a la unidad. Un escalón por renglón terminado en «:» y debajo, con «- », «- Misión: …», «- Intención: …», «- Concepto de la operación: …»; las adyacentes en «Unidades adyacentes:».',
  [K.refuerzos]: 'Las unidades en refuerzo o reducidas, con el lugar, la fecha y la hora en que cobra vigencia; o «Omitido.» si todo está en la Organización de la Tarea.',
  [K.hipotesis]: 'SÓLO si es un PLAN de operaciones: las hipótesis (suposiciones críticas) establecidas. En una ORDEN queda vacío y no sale en el Word.',
  [K.mision]: 'Quién, qué, cuándo, dónde y —lo más importante— el PARA QUÉ (propósito). Es la transcripción de la misión aprobada por el Comandante al final del Análisis de la Misión.',
  [K.intencion]: 'Va antes del párrafo A, sin letra. Redactada en forma INEXTENSA (PMTD 2017, 14.° paso): «Mi intención es [propósito], para esto es clave:» y las tareas clave (una por renglón con «- »), y el estado final: «Al finalizar la operación, [cómo queda la fuerza propia], [cómo queda el enemigo], [la operación futura]». Es el puente entre la misión y el concepto: no dice el «cómo».',
  [K.concepto]: 'Cómo visualiza el Comandante las acciones de las unidades subordinadas: «Cumpliremos la misión mediante la ejecución de [tipo de operación], decisivo para la operación es [punto / operación decisiva], porque [razón].» y las fases, una por renglón: «FASE I (PREPARACIÓN) desde el D-15 hasta el D (0500).» Consistente con la intención de los Comandantes dos niveles arriba.',
  [K.maniobra]: 'El esquema de maniobra, FASE POR FASE, consistente con el Calco de Operaciones: la operación decisiva, las de configuración, la seguridad y el empleo de la reserva. La fase en su renglón terminado en «:» y debajo, con «- », un párrafo por unidad: «- El RIM-8 «AYACUCHO» (OC1), esfuerzo principal, defiende y bloquea …, con el propósito de …».',
  [K.fuegos]: 'La intención del Comandante respecto de los fuegos (PMTD 2017): la tarea esencial (destruir, neutralizar, suprimir) contra una formación o función enemiga, el propósito, el método (prioridad, asignación, restricciones) y el efecto cuantificado, POR FASE.',
  [K.aereo]: 'Asignación de los vuelos de Apoyo Aéreo Cercano y de interdicción aérea, y las designaciones. Si no hay, queda vacío y no sale.',
  [K.artilleria]: 'Prioridades (contrabatería, interdicción) y la organización de la artillería para el combate («RAC-21/CE-I : AG CE-I»); prioridad para la adquisición de blancos; restricciones.',
  [K.mcaf]: 'Las medidas permisivas (LCAF, línea de seguridad…) y restrictivas (áreas de fuego prohibido / restringido).',
  [K.reconocimiento]: 'El punto focal del esfuerzo de búsqueda y cómo complementa la maniobra; los medios y las áreas de interés nombradas (puede remitir a la Matriz de Reconocimiento y Vigilancia).',
  [K.inteligencia]: 'El concepto del sistema de inteligencia: la prioridad del esfuerzo (desarrollo de la situación, búsqueda de blancos, evaluación de daños), la prioridad de apoyo a las unidades y la de contrainteligencia. Remite al Anexo de Inteligencia.',
  [K.ingenieros]: 'El propósito de los obstáculos y de los recursos de ingenieros; la prioridad del esfuerzo (movilidad, contramovilidad, supervivencia) y la prioridad de trabajo por unidad, POR FASE; restricciones para emplazar obstáculos.',
  [K.ada]: 'El concepto de defensa antiaérea en apoyo de la maniobra, la prioridad de defensa y los niveles de alerta: ROJA (ataque inminente), AMARILLA (probable), VERDE (improbable).',
  [K.qbn]: 'Concepto, prioridades de esfuerzo y de apoyo. Si no aplica, queda vacío y no sale.',
  [K.pm]: 'Concepto, prioridades, control de circulación y seguridad del área de retaguardia. Si no aplica, queda vacío y no sale.',
  [K.acgm]: 'Concepto de las operaciones de AC/GM, prioridades de esfuerzo y de apoyo (población civil, desplazados, patrimonio). Puede remitir al Anexo de AC/GM.',
  [K.proteccion]: 'Optativo (modelo del CE-I): en qué se centran los esfuerzos de protección y su prioridad (PC, comunicaciones, artillería, bases logísticas).',
  [K.info]: 'Optativo (modelo del CE-I): el enfoque de las operaciones de información y de la seguridad del mando y control.',
  [K.tareasManiobra]: 'Una unidad por renglón terminado en «:» («DIMEC-1 (OC-1):»), en el orden de la Organización de la Tarea e incluida la reserva, y debajo sus tareas, una por renglón con «- » («- Recibe a un Batallón de la FT-32 RIOS.»): pasaje de líneas, puntos de contacto, misiones de «estar en condiciones de», coordinación de flancos, evacuación de refugiados. El Word las numera 1.- unidad, a.- tarea.',
  [K.tareasApoyo]: 'Igual que las de maniobra, para cada unidad de apoyo de combate (artillería, ingeniería, antiaérea, comunicaciones, PM, inteligencia): sólo las tareas que no se dicen en otra parte.',
  [K.coordinacion]: 'Lo que aplica a dos o más unidades, una instrucción por renglón (el Word las numera 1.-, 2.-…): entrada en vigor; RCIC (sólo acá: «Requerimientos prioritarios de inteligencia (RPI):» y debajo «- ¿…?»; «Requerimientos de información de la fuerza amiga (RIFA):»); medidas de control para la reducción de riesgos; reglas de enfrentamiento; consideraciones ambientales; protección de la fuerza; instrucciones adicionales; límite de avance; medidas de coordinación de apoyo de fuegos; ensayo; nivel de amenaza en el área de retaguardia; restricciones.',
  [K.apoyoConcepto]: 'El concepto de apoyo logístico en apoyo de la intención y del concepto de la operación: el enfoque y la prioridad de apoyo a las unidades dependientes en CADA FASE. Puede remitir al Anexo de Apoyo de Servicio de Combate.',
  [K.personal]: 'El enfoque del apoyo de personal: reemplazos (prioridad y desde cuándo), PP.GG., sanidad y evacuación de bajas.',
  [K.comando]: 'La sucesión de mando («Sucesión de mando:» y debajo «- Comandante del …», «- Jefe de Estado Mayor …») y los puestos comando con su ubicación («Puestos comando:» y debajo «- PCP. …», «- PCA. …», «- PCR. …»).',
  [K.comunicaciones]: 'La edición de las Instrucciones de Comunicación en vigor («IEC “ANGEL” en vigor a partir del D-5 (1800).») y los centros de comunicaciones / la prioridad de las comunicaciones por eventos.',
}

export const NOTA =
  'Formato de CINCO PÁRRAFOS del PMTD 2017 (Parte Tercera, Cap. VII) y de los modelos de la Escuela (OGO 01-35, OGO 01/21 del CE-I): OBJETO, CARTAS y ANEXOS; el cuadro de la ORGANIZACIÓN DE LA TAREA; I.- SITUACIÓN; II.- MISIÓN; III.- EJECUCIÓN (Intención, A.- Concepto con sus subpárrafos, B.- Tareas de las unidades de maniobra, C.- de apoyo de combate, D.- Instrucciones de coordinación); IV.- APOYO DE SERVICIO; V.- COMANDO Y COMUNICACIONES. 🌱 trae lo que ya trabajó el Estado Mayor (misión, intención, CAP aprobado con sus fases, tareas de cada unidad, RCIC, riesgo, matriz de sincronización, concepto de apoyo); la IA lo redacta; el Word sale con la numeración militar. La revisa y aprueba el Comandante (F7·P2).'

// La regla para la IA (va al pedido, en «CÓMO CONTESTAR»): el formato de la Escuela y qué va en cada casilla.
export const AYUDA_IA =
  'ES LA ORDEN GENERAL DE OPERACIONES DE LA UNIDAD, CON EL FORMATO DE LA ESCUELA (PMTD 2017, Parte Tercera, Cap. VII, y los modelos «OGO 01-35» y «OGO 01/21» del CE-I). Es el producto final del PMTD: se redacta COMPLETA, con lo que ya trabajó el Estado Mayor (no es un resumen), con redacción impositiva y en presente («defiende», «ataca», «se repliega»; nunca «tratará de»), y con los nombres de las unidades, del terreno, de las líneas de fase y de las fases del expediente. Cada clave es un apartado del documento con su numeración: NO repitas la numeración ni el título dentro del texto (el Word numera solo).\n' +
  'CÓMO SE ESCRIBE CADA CASILLA PARA QUE EL WORD SALGA BIEN:\n' +
  '- Un renglón por párrafo (salto de línea \\n).\n' +
  '- «ORGANIZACIÓN DE LA TAREA»: una agrupación por renglón, «NOMBRE (OD): unidad; unidad; unidad», y al final «BAJO CONTROL: unidad; unidad».\n' +
  '- «III.- Intención del Comandante»: en forma INEXTENSA: «Mi intención es …, para esto es clave:» + una tarea clave por renglón con «- » + «Al finalizar la operación, [la fuerza propia], [el enemigo], [encontrándonos en condiciones de …].» NO la escribas como «Propósito: … Tareas clave: … Estado final: …».\n' +
  '- «III.- A.- Concepto de la operación»: «Cumpliremos la misión mediante la ejecución de …, decisivo para la operación es …, porque …» y «La operación se ejecutará en las siguientes fases:» con una fase por renglón («FASE I (NOMBRE) desde el … hasta el …»).\n' +
  '- «III.- A.- 1.- Maniobra»: cada fase en su renglón terminado en «:» y debajo, con «- », un párrafo por unidad: unidad (rol), esfuerzo principal o secundario, tarea, dónde, «con el propósito de …», «a fin de …».\n' +
  '- «III.- B.-» y «III.- C.-»: cada unidad en su renglón terminado en «:» y debajo sus tareas, una por renglón con «- » (verbo en presente).\n' +
  '- «I.- B.- Fuerzas propias», «III.- D.- Instrucciones de coordinación» y «V.- A.- Comando»: un renglón por subpárrafo; si tiene incisos, el renglón termina en «:» y los incisos van debajo con «- ».\n' +
  '- Las casillas optativas que de verdad no aplican (Hipótesis en una ORDEN, Apoyo aéreo, QBN, Policía Militar, Protección, Operaciones de información) van vacías: no salen en el Word. Las demás NUNCA vacías.\n' +
  'QUÉ VA EN CADA CLAVE:\n' +
  CAMPOS.map((c) => `- "${c}": ${AYUDA[c]}`).join('\n')

// 📘 La guía de la hoja.
export const GUIA = {
  para: 'Es el producto final del PMTD (Fase VII): la orden con la que el Comandante transmite a sus comandantes subordinados la decisión ya tomada. La coordina el G-3 pero la escribe TODO el Estado Mayor con lo que ya trabajó: el CAE del G-2, la misión y la intención aprobadas, el CAP aprobado con sus fases, las tareas de cada unidad, los RCIC, el riesgo, la matriz de sincronización, el concepto de apoyo del G-4, el de personal del G-1 y el de AC/GM del G-5. Tiene CINCO PÁRRAFOS (PMTD 2017, Cap. VII). La revisa y aprueba el Comandante ANTES de diseminarla (F7·P2).',
  como: [
    'OBJETO, CARTAS y ANEXOS arriba; debajo el CUADRO de la Organización de la Tarea (una agrupación por renglón: «DIMEC-1 (OC-1): BIMEC-I; BIMEC-II…», y «BAJO CONTROL: …»).',
    'I.- SITUACIÓN: A.- Fuerzas enemigas (1.- CAE más probable, 2.- CAE más peligroso, los del G-2 tal como quedaron después del Juego de Guerra); B.- Fuerzas propias (misión, intención y concepto de DOS escalones arriba y las adyacentes); C.- Refuerzos y reducciones; D.- Hipótesis SÓLO si es un Plan.',
    'II.- MISIÓN: la misión reexpresada y aprobada (quién, qué, cuándo, dónde y para qué).',
    'III.- EJECUCIÓN: la INTENCIÓN en forma inextensa («Mi intención es…, para esto es clave:… Al finalizar la operación…»); A.- Concepto («Cumpliremos la misión mediante…» y las fases) con 1.- Maniobra fase por fase y unidad por unidad, 2.- Fuegos, 3.- Reconocimiento, 4.- Inteligencia, 5.- Ingenieros, 6.- Defensa antiaérea… ; B.- Tareas de las unidades de maniobra y C.- de apoyo de combate (cada unidad con sus tareas: el Word las numera 1.- / a.-); D.- Instrucciones de coordinación (entrada en vigor, RCIC —sólo acá—, reducción de riesgos, reglas de enfrentamiento, consideraciones ambientales, protección, límite de avance, MCAF, ensayo, nivel de amenaza…).',
    'IV.- APOYO DE SERVICIO: el concepto de apoyo POR FASE (enfoque y prioridad) y el de personal; V.- COMANDO Y COMUNICACIONES: sucesión de mando, puestos comando y comunicaciones.',
    '🌱 trae del ejercicio todo lo que ya está trabajado (sólo llena lo vacío); 🤖 la IA lo redacta con todo el expediente; 📄 el Word sale con el formato militar (numeración I.- A.- 1.- a.-, cuadro de la organización, firma, autenticación del JEM. y del G-3 y la distribución a las unidades).',
  ],
  ejemplo:
    '«Mi intención es detener la progresión de RAGNAR hacia la Zona del Interior de ORIÓN, a fin de evitar la conquista de zonas estratégicas y poblaciones importantes, para eso es clave: realizar trabajos de Organización del Terreno…; defender la LPR desde nuestras posiciones defensivas… Al finalizar la operación, la DIV.MEC.-1 habrá impedido que las unidades enemigas continúen con su progresión; la DIV. ACORAZADA de RAGNAR habrá sido destruida; finalmente nuestras unidades se encontrarán en condiciones de continuar con las operaciones ofensivas con orden.» (OGO 01-35)',
}

// La hoja del Tablero del G-3 (F7·P1). `anexos` (la lista de lo que puede llevar) la pone el compilado.
export const HOJA = {
  entrega: 'Se difunde — la revisa y aprueba el Comandante',
  responsable: 'Todo el EM, coordina el G-3',
  tipo: 'campos',
  campos: CAMPOS,
  ayudaCampos: AYUDA,
  grupoCampos: GRUPO,
  autollena: 'opord',
  ayudaIA: AYUDA_IA,
  nota: NOTA,
}

// ─── Utilidades ───────────────────────────────────────────────────────────────────────────────────────────────
const MARCA_IA = /\s*[[(]\s*(?:IA|Mesa)\s*[—–-]\s*verificar\s*[\])]/gi
const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
const sinMarca = (s) => String(s ?? '').replace(MARCA_IA, '')
const limpio = (s) => sinMarca(s).replace(/\s+/g, ' ').trim()
const vacio = (x) => !limpio(typeof x === 'string' ? x : '')
const texto = (s) =>
  sinMarca(s)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const norm = (s) => sinTildes(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const punto = (s) => {
  const t = limpio(s)
  // «… RIM-8 «AYACUCHO»» lleva su punto; «… (FICT.)» también.
  return t && !/[.:;!?…]$/.test(t) && !/[.!?…][»”"]$/.test(t) ? `${t}.` : t
}
const sinPunto = (s) => limpio(s).replace(/[.;:]+$/, '')
const minus1 = (s) => {
  const t = limpio(s)
  // «Detener…» → «detener…», pero no «RAGNAR…», «DIV MEC-2…», «AO LAUCA…».
  return /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t
}
const lista = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const romano = (n) => ROMANOS[n - 1] || String(n)
const filas = (xs) => (Array.isArray(xs) ? xs.filter((f) => esObj(f) && Object.entries(f).some(([k, v]) => !k.startsWith('_') && !vacio(v))) : [])
// El valor de la casilla cuyo rótulo EMPIEZA con alguno de `claves` (sin tildes ni mayúsculas).
export function casilla(obj, ...claves) {
  if (!esObj(obj)) return ''
  for (const k of claves) {
    const hit = Object.keys(obj).find((x) => !x.startsWith('_') && norm(x).startsWith(norm(k)))
    if (hit && !vacio(obj[hit])) return texto(obj[hit])
  }
  return ''
}
const art = (u) => {
  const t = limpio(u).replace(/^(?:el|la|los|las)\s+/i, '')
  if (/^(FF\.?\s?TT\.?|FUERZAS)/i.test(t)) return 'las'
  return /\bCUERPO\b|^(R[A-Z]|R\b|B[A-Z]|CE\b|CE[-.\s]|GRUPO|BAT|ESCUADR|DESTACAMENTO|COMANDO|REGIMIENTO|[IVX]+\s*C\.?\s?E)/i.test(t) ? 'el' : 'la'
}
const del = (u) => ({ el: 'del', la: 'de la', las: 'de las' })[art(u)]
const conArt = (u) => `${art(u)} ${limpio(u)}`
// Las oraciones de unos textos que cumplen `re` (sin repetir).
function oracionesQue(textos, re, max = 4) {
  const out = []
  for (const t of textos) for (const o of oraciones(sinMarca(t || ''))) if (re.test(o) && limpio(o).length > 12 && !out.includes(limpio(o))) out.push(limpio(o))
  return out.slice(0, max)
}
const deDocumento = (x) => (esObj(x) && esObj(x.campos) ? x.campos : {})

// ─── Lo que guardó el Estado Mayor: de dónde sale cada cosa ─────────────────────────────────────────────────────
// ctx: el calco vivo (calcoActual del motor del Estado Mayor) + lo que pasa l3e: { ordenSup, unidades, ops,
// fasesCOA, picb, orgTarea, g3 (las hojas del G-3), hojasG ({ cmte, g1, g4, g5 }), unidad, conceptoApoyo,
// misionLog, documentos }.
const hojasDe = (ctx, g) => (esObj(ctx?.hojasG?.[g]) ? ctx.hojasG[g] : {})
const g3De = (ctx) => (esObj(ctx?.g3) ? ctx.g3 : {})

// Una orden preparatoria guardada, por partes («I.- SITUACIÓN», «III.- EJECUCIÓN · A. Concepto…»).
function partesPrep(v) {
  if (!esObj(v)) return {}
  const P = [
    ['situacion', /^I\.- SITUACI[OÓ]N/],
    ['mision', /^II\.- MISI[OÓ]N/],
    ['intencion', /^III\.- EJECUCI[OÓ]N · Intenci[oó]n/],
    ['concepto', /^III\.- EJECUCI[OÓ]N · A\./],
    ['maniobra', /^III\.- EJECUCI[OÓ]N · B\./],
    ['apoyo', /^III\.- EJECUCI[OÓ]N · C\./],
    ['coordinacion', /^III\.- EJECUCI[OÓ]N · D\./],
    ['servicio', /^IV\.- APOYO DE SERVICIO/],
    ['comando', /^V\.- COMANDO/],
    ['carta', /^CARTA/],
    ['objeto', /^OBJETO/],
    ['anexos', /^ANEXOS/],
  ]
  const out = {}
  for (const [k, x] of Object.entries(v)) {
    if (vacio(x)) continue
    const p = (P.find(([, re]) => re.test(k)) || [])[0]
    if (p && !out[p]) out[p] = texto(x)
  }
  return out
}
// La más avanzada de las órdenes preparatorias (la N° 3 ya «casi es la Orden de Operaciones»).
function prepDe(ctx, parte) {
  const g3 = g3De(ctx)
  for (const id of ['prep3', 'prep2', 'prep1']) {
    const t = partesPrep(g3[id])[parte]
    if (t) return t
  }
  return ''
}
// «A. Fuerzas enemigas: …» dentro de la «I.- SITUACIÓN» de la O.P. N° 3.
function deSituacion(ctx, letra) {
  const s = prepDe(ctx, 'situacion')
  if (!s) return ''
  const m = s.match(new RegExp(`(?:^|\\n)\\s*${letra}\\.-?\\s*[^:\\n]{3,40}:\\s*([\\s\\S]*?)(?=\\n\\s*[A-D]\\.-?\\s*[^:\\n]{3,40}:|$)`))
  return m ? texto(m[1]) : ''
}

export function lecturaUnidades(ctx = {}) {
  let r = null
  try {
    r = lecturaDelEjercicio({ ...ctx, ordenSup: ctx.ordenSup || {}, unidades: ctx.unidades || [], documentos: ctx.documentos || [], orgTarea: ctx.orgTarea || [], g3: g3De(ctx) }, 'puras')
  } catch {
    r = null
  }
  const os = ctx.ordenSup || {}
  const propia = limpio(ctx.unidad) || limpio(os.unidad) || limpio(r?.propia?.nombre)
  const cadena = (r?.cadena || []).map((c) => ({ nombre: limpio(c.nombre), tarea: limpio(c.tarea), proposito: limpio(c.proposito) }))
  const superior = limpio(os.escalonSuperior) || cadena[cadena.length - 1]?.nombre || ''
  const subs = (r?.subordinadas || []).map((u) => ({ nombre: limpio(u.nombre), arma: u.arma || '', bajoControl: /BAJO CONTROL/i.test(u.mando || '') }))
  return {
    propia,
    superior,
    cadena,
    subordinadas: subs.filter((u) => !u.bajoControl).map((u) => u.nombre),
    bajoControl: subs.filter((u) => u.bajoControl).map((u) => u.nombre),
    adyacentes: (r?.adyacentes || []).map((a) => ({ nombre: limpio(a.nombre), tarea: limpio(a.tarea), proposito: limpio(a.proposito) })).filter((a) => a.nombre),
  }
}

// ─── ORGANIZACIÓN DE LA TAREA ───────────────────────────────────────────────────────────────────────────────────
const ROL = { od: 'OD', oc1: 'OC-1', oc2: 'OC-2', oc3: 'OC-3', oc4: 'OC-4', reserva: 'RESERVA', res: 'RESERVA', sost: 'SOST' }
const rolDe = (op) => ROL[String(op || '').toLowerCase().replace(/[^a-z0-9]/g, '')] || limpio(op).toUpperCase()
// Las agrupaciones: la F4·P2 del G-3 (Agrupación · Unidad…) y, si no, las del calco (piezas de cada agrupación).
export function agrupaciones(ctx = {}) {
  const out = []
  const poner = (nombre, unidad) => {
    const n = limpio(nombre)
    if (!n) return
    let a = out.find((x) => norm(x.nombre) === norm(n))
    if (!a) out.push((a = { nombre: n, elementos: [] }))
    for (const u of String(unidad || '').split(/\s*(?:[;·]|\n)\s*/)) if (limpio(u) && !a.elementos.some((e) => norm(e) === norm(u))) a.elementos.push(limpio(u))
  }
  for (const f of filas(g3De(ctx).orgTarea)) poner(casilla(f, 'Agrupación', 'Agrupacion'), casilla(f, 'Unidad'))
  if (!out.length)
    for (const a of Array.isArray(ctx.orgTarea) ? ctx.orgTarea : []) {
      if (!esObj(a)) continue
      const rol = rolDe(a.operacion)
      const nom = limpio(a.nombre) || 'Agrupación'
      poner(rol && !nom.toUpperCase().includes(rol) ? `${nom} (${rol})` : nom, [...new Set((a.piezas || []).map((p) => limpio(p?.nom || p?.madre)).filter(Boolean))].join(';'))
    }
  return out
}
function organizacionTexto(ctx, L) {
  const ag = agrupaciones(ctx)
  const L2 = ag.map((a) => `${a.nombre}${a.elementos.length ? `: ${a.elementos.join('; ')}` : ''}`)
  const bc = L.bajoControl.filter((u) => !ag.some((a) => a.elementos.some((e) => norm(e) === norm(u)) || norm(a.nombre) === norm(u)))
  if (bc.length && !ag.some((a) => /BAJO CONTROL/i.test(a.nombre))) L2.push(`BAJO CONTROL: ${bc.join('; ')}`)
  return L2.join('\n')
}
// El nombre de la agrupación (con su rol) de una unidad, para «DIMEC-1 (OC-1)».
function rolDeUnidad(ctx, nombre) {
  const n = norm(nombre)
  if (!n) return ''
  for (const a of Array.isArray(ctx.orgTarea) ? ctx.orgTarea : []) {
    if (!esObj(a)) continue
    const nom = norm(a.nombre)
    const piezas = (a.piezas || []).map((p) => norm(p?.nom || p?.madre))
    if (nom === n || nom.startsWith(`${n} `) || piezas.includes(n)) return rolDe(a.operacion)
  }
  // La F4·P2 del G-3: «RCB-1 «CALAMA» (OD)» en la Agrupación.
  for (const a of agrupaciones(ctx)) {
    const m = /\((OD|OC-?\d|RESERVA|RES)\)\s*$/i.exec(a.nombre)
    if (m && norm(a.nombre.replace(m[0], '')) === n) return m[1].toUpperCase().replace(/^OC(\d)/, 'OC-$1').replace(/^RES$/, 'RESERVA')
  }
  return ''
}
const conRol = (ctx, nombre) => {
  const r = rolDeUnidad(ctx, nombre)
  return r && !norm(nombre).includes(norm(r)) ? `${limpio(nombre)} (${r})` : limpio(nombre)
}

// ─── OBJETO, CARTAS, ANEXOS ─────────────────────────────────────────────────────────────────────────────────────
function tipoOperacion(ctx) {
  const t = norm(`${ctx.ops?.areaOps?.tipo || ''} ${casilla(g3De(ctx).mision, 'QUÉ', 'QUE')} ${casilla(g3De(ctx).mision, 'ENUNCIADO')} ${ctx.ordenSup?.mision || ''}`)
  if (/defensa movil/.test(t)) return 'la Defensa Móvil'
  if (/retardo|retarda|repliegue|retrograd/.test(t)) return 'la ejecución de Operaciones Retrógradas'
  if (/defens|defiende|bloquea|retiene|fija y mantiene/.test(t)) return 'la ejecución de Operaciones Defensivas'
  if (/ofens|ataca|ataque|conquista|destruye|contraataca/.test(t)) return 'la ejecución de Operaciones Ofensivas'
  return ''
}
function anexosTexto(ctx) {
  const unid = (ctx.unidades || []).filter((u) => esObj(u) && (u.tipo || 'unidad') === 'unidad' && !/enem/i.test(String(u.bando || '')))
  const hay = (re) => unid.some((u) => re.test(`${u.arma || ''} ${u.designacion || ''}`)) || agrupaciones(ctx).some((a) => a.elementos.some((e) => re.test(e)))
  const A = ['Calco de Operaciones', 'Inteligencia', 'Apoyo de Fuegos']
  if (hay(/ingenier|BATING|ING\b/i) || (ctx.ops?.obstaculos || []).length) A.push('Ingeniería')
  if (hay(/antiaer|RAA|BAT\.?\s?AA|ADA\b/i)) A.push('Defensa Antiaérea')
  A.push('Apoyo de Servicio de Combate')
  if (hay(/comunicac|BAT\.?\s?COM|telecom/i)) A.push('Comunicaciones')
  return A.map((n, i) => `“${String.fromCharCode(65 + i)}” ${n}.`).join('\n')
}

// ─── I.- SITUACIÓN ──────────────────────────────────────────────────────────────────────────────────────────────
function fuerzasPropias(ctx, L) {
  const os = ctx.ordenSup || {}
  const out = []
  // Dos escalones arriba (la cadena de los Conceptos Entrelazados) con su tarea y propósito.
  const cadena = L.cadena.slice(-2)
  cadena.forEach((c, i) => {
    const inmediato = i === cadena.length - 1
    const sub = []
    const mis = c.tarea ? `${punto(`${conArt(c.nombre).replace(/^./, (x) => x.toUpperCase())} ${minus1(c.tarea)}${c.proposito ? `, con el propósito de ${minus1(c.proposito).replace(/^(el propósito de|para)\s+/i, '')}` : ''}`)}` : ''
    if (mis) sub.push(`- Misión: ${mis}`)
    if (inmediato && !vacio(os.intencion)) sub.push(`- Intención: ${texto(os.intencion).replace(/\n+/g, ' ')}`)
    if (inmediato && !vacio(os.concepto)) sub.push(`- Concepto de la operación: ${texto(os.concepto).replace(/\n+/g, ' ')}`)
    if (sub.length) out.push(`${c.nombre}:`, ...sub)
  })
  if (!out.length && !vacio(os.propias)) out.push(texto(os.propias))
  const ady = L.adyacentes.filter((a) => a.tarea || a.proposito)
  if (ady.length) out.push('Unidades adyacentes:', ...ady.map((a) => `- ${punto(`${conArt(a.nombre).replace(/^./, (x) => x.toUpperCase())} ${minus1(a.tarea)}${a.proposito ? `, con el propósito de ${minus1(a.proposito)}` : ''}`)}`))
  return out.join('\n')
}

// ─── II.- MISIÓN ────────────────────────────────────────────────────────────────────────────────────────────────
function misionTexto(ctx) {
  const m = g3De(ctx).mision
  const enunciado = casilla(m, 'ENUNCIADO COMPLETO')
  if (enunciado) return enunciado
  const pr = prepDe(ctx, 'mision')
  if (pr) return pr
  const partes = ['QUIÉN', 'QUÉ', 'CUÁNDO', 'DÓNDE'].map((k) => sinPunto(casilla(m, k)))
  const prop = sinPunto(casilla(m, 'PROPÓSITO', 'PROPOSITO'))
  if (partes[0] && partes[1]) return punto(`${partes.filter(Boolean).join(' ')}${prop ? `, con el propósito de ${minus1(prop).replace(/^(con el propósito de|para)\s+/i, '')}` : ''}`)
  return texto(ctx.ordenSup?.mision || '')
}

// ─── III.- Intención (forma inextensa, PMTD 2017, 14.° paso) ────────────────────────────────────────────────────
// «Propósito: … Punto decisivo: … Tareas clave: … Estado final: …» (como la escribían la F2·P14, la F6·P2 y la IA)
// → { proposito, decisivo, tareas[], fin }. null si no tiene esa forma.
export function partesIntencion(t) {
  const s = texto(t)
  if (!s || /^\s*mi intenci[oó]n/i.test(s)) return null
  const R = /(Prop[oó]sito(?:\s+ampliado)?|Punto decisivo|Tareas?\s+clave(?:s)?(?:\s+y\/?o\s+condiciones)?|Estado\s+final(?:\s+deseado)?)\s*:\s*/gi
  const marcas = [...s.matchAll(R)]
  if (marcas.length < 2 && !(marcas.length === 1 && marcas[0].index === 0)) return null
  const out = { proposito: '', decisivo: '', tareas: [], fin: '' }
  marcas.forEach((m, i) => {
    const cuerpo = texto(s.slice(m.index + m[0].length, i + 1 < marcas.length ? marcas[i + 1].index : s.length))
    const k = norm(m[1])
    if (k.startsWith('proposito')) out.proposito = cuerpo
    else if (k.startsWith('punto')) out.decisivo = cuerpo
    else if (k.startsWith('tarea')) out.tareas = separarTareas(cuerpo)
    else out.fin = cuerpo
  })
  return out.proposito || out.tareas.length || out.fin ? out : null
}
function separarTareas(t) {
  const s = texto(t)
  const renglones = s.split('\n').map((x) => x.replace(/^\s*(?:[-–•·*]|\d{1,2}[.)]-?|[a-z][.)]-?|PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO)\.?-?\s*/i, '').trim()).filter(Boolean)
  const base = renglones.length > 1 ? renglones : s.split(/\s*;\s*|(?<=[a-záéíóúñ)»”])\.\s+(?=[A-ZÁÉÍÓÚÑ])/)
  return base.map(sinPunto).filter((x) => x.length > 3)
}
// La intención redactada como la pide el PMTD 2017 y como la traen los modelos de la Escuela.
export function intencionInextensa(p) {
  if (!p) return ''
  const L = []
  const prop = sinPunto(p.proposito).replace(/^(el prop[oó]sito (de nuestra operaci[oó]n|de la operaci[oó]n)? ?es|es|mi intenci[oó]n es)\s+/i, '')
  const cab = prop ? `Mi intención es ${minus1(prop)}` : 'Mi intención es cumplir la misión asignada'
  const dec = sinPunto(p.decisivo)
  if (p.tareas.length) {
    L.push(`${cab}${dec ? `; el punto decisivo es ${minus1(dec)}` : ''}, para esto es clave:`)
    for (const t of p.tareas) L.push(`- ${punto(t.charAt(0).toUpperCase() + t.slice(1))}`)
  } else L.push(punto(`${cab}${dec ? `; el punto decisivo es ${minus1(dec)}` : ''}`))
  const fin = sinPunto(p.fin)
  if (fin) L.push(/^al (final|finalizar|t[eé]rmino)/i.test(fin) ? punto(fin) : punto(`Al finalizar la operación, ${minus1(fin)}`))
  return L.join('\n')
}
const redactarIntencion = (t) => {
  const p = partesIntencion(t)
  return p ? intencionInextensa(p) : texto(t)
}
function intencionTexto(ctx) {
  const cm = hojasDe(ctx, 'cmte')
  const final = deDocumento(cm.guiaFinal).intencion || casilla(cm.guiaFinal, 'II.- INTENCI', 'INTENCI')
  if (!vacio(final)) return redactarIntencion(final)
  const prop = casilla(cm.intencion, 'Propósito', 'Proposito')
  const tareas = casilla(cm.intencion, 'Tareas clave')
  const fin = casilla(cm.intencion, 'Estado Final')
  if (prop || tareas || fin) return intencionInextensa({ proposito: prop, decisivo: '', tareas: separarTareas(tareas), fin })
  const pr = prepDe(ctx, 'intencion')
  return pr ? redactarIntencion(pr) : ''
}

// ─── III.- A.- Concepto y Maniobra (el CAP aprobado) ────────────────────────────────────────────────────────────
function fasesDescritas(C, carta) {
  try {
    return describirFases(C.fases || [], { nomenclator: carta?.nomenclator || [], catalogos: carta?.catalogos || {} })
  } catch {
    return []
  }
}
const nombreFase = (d, i) => {
  const nom = limpio(d?.nombre || '').replace(/^FASE\s+[IVX\d]+\s*[—–:(-]?\s*/i, '').replace(/\)$/, '')
  return `FASE ${romano(i + 1)}${nom ? ` (${nom.toUpperCase()})` : ''}`
}
const cuandoFase = (d, f) => limpio(d?.cuando || f?.cuando || [f?.desde, f?.hasta].filter(Boolean).join(' hasta el '))
function conceptoTexto(ctx, carta) {
  const C = capAprobado(g3De(ctx), ctx.fasesCOA || {})
  const k = C.concepto
  const coa = C.coa
  const forma = sinPunto(casilla(k, 'Forma de maniobra') || casilla(coa, 'CÓMO', 'COMO'))
  const decisiva = sinPunto(casilla(hojasDe(ctx, 'cmte').guiaPlanificacion, 'I.- LA OPERACI', 'LA OPERACI'))
  const ep = sinPunto(casilla(k, 'Esfuerzo principal'))
  const porque = sinPunto(casilla(coa, 'POR QUÉ', 'POR QUE', 'Razón fundamental'))
  const L = []
  if (forma) {
    let o = `Cumpliremos la misión mediante la ejecución de ${minus1(forma).replace(/^(la ejecuci[oó]n de|ejecutar)\s+/i, '')}`
    if (decisiva) o += `; decisivo para la operación es ${minus1(decisiva).replace(/^(deseo que )?la operaci[oó]n decisiva (sea|es)\s+/i, '')}`
    else if (ep) o += `; el esfuerzo principal lo realiza ${minus1(ep)}`
    if (porque) o += `, porque ${minus1(porque).replace(/^(porque|para)\s+/i, '')}`
    L.push(punto(o))
  }
  const fases = (C.fases || []).filter(esObj)
  if (fases.length) {
    const D = fasesDescritas(C, carta)
    L.push('La operación se ejecutará en las siguientes fases:')
    fases.forEach((f, i) => {
      const c = cuandoFase(D[i], f)
      L.push(punto(`${nombreFase(D[i] || f, i)}${c ? ` ${/^(desde|del|de|entre|a partir)/i.test(c) ? '' : 'desde '}${c}` : ''}`))
    })
  }
  const res = sinPunto(casilla(k, 'Reserva'))
  if (res) L.push(punto(`Reserva: ${res}`))
  const riesgo = sinPunto(casilla(k, 'Riesgo aceptado'))
  if (riesgo) L.push(punto(`El riesgo que se acepta es ${minus1(riesgo)}`))
  if (L.length) return L.join('\n')
  return prepDe(ctx, 'concepto')
}
// Lo que hace cada unidad propia en cada fase del CAP aprobado (la ficha de esa fase: tarea, propósito, si es el
// esfuerzo principal).
export function unidadesPorFase(ctx = {}) {
  const C = capAprobado(g3De(ctx), ctx.fasesCOA || {})
  const fases = (Array.isArray(C.fases) ? C.fases : []).filter(esObj)
  return fases.map((f) =>
    (f.unidades || [])
      .filter((u) => esObj(u) && (u.tipo || 'unidad') === 'unidad' && !/^enem/i.test(String(u.bando || '')) && u.deFaseEnemiga == null && limpio(u.designacion) && limpio(u.tarea))
      .map((u) => ({ nombre: limpio(u.designacion), tarea: enPresente(sinPunto(u.tarea)), proposito: sinPunto(u.proposito), principal: !!u.principal, apoyo: esApoyo(u) })),
  )
}
// La tarea en presente, como la escribe la orden («se concentra», «defiende la LPR»): las fichas del CAP la traen a
// veces en infinitivo («Concentrarse», «Defender la LPR»). Lo que ya está conjugado queda igual.
const IRREGULARES = {
  defender: 'defiende', detener: 'detiene', mantener: 'mantiene', contener: 'contiene', retener: 'retiene', obtener: 'obtiene', sostener: 'sostiene',
  conducir: 'conduce', seguir: 'sigue', impedir: 'impide', reforzar: 'refuerza', desplegar: 'despliega', replegar: 'repliega', cerrar: 'cierra',
  destruir: 'destruye', constituir: 'constituye', contribuir: 'contribuye', distribuir: 'distribuye', reconocer: 'reconoce', establecer: 'establece',
  proteger: 'protege', recoger: 'recoge', elegir: 'elige', dirigir: 'dirige', volver: 'vuelve', mover: 'mueve', moverse: 'se mueve', poner: 'pone',
  hacer: 'hace', tener: 'tiene', ir: 'va', dar: 'da', ser: 'es', estar: 'está', asumir: 'asume', recibir: 'recibe', cubrir: 'cubre', permitir: 'permite',
  atraer: 'atrae', extender: 'extiende', entender: 'entiende', sustituir: 'sustituye', relevar: 'releva', reconstituir: 'reconstituye',
}
export function enPresente(t) {
  const s = limpio(t)
  if (/^reserva\.?$/i.test(s)) return 'constituye la reserva'
  const m = /^([A-Za-zÁÉÍÓÚÑáéíóúñ]+?)(se)?(\b.*)$/.exec(s)
  if (!m) return s
  const verbo = m[1].toLowerCase()
  const resto = m[3]
  let pres = IRREGULARES[verbo + (m[2] || '')] || IRREGULARES[verbo]
  if (!pres) {
    if (!/(ar|er|ir)$/.test(verbo) || verbo.length < 4) return s
    pres = verbo.replace(/ar$/, 'a').replace(/[ei]r$/, 'e')
  }
  if (pres.startsWith('se ')) return `${pres}${resto}`
  return `${m[2] ? 'se ' : ''}${pres}${resto}`
}
const esApoyo = (u) => /artiller|ingenier|antiaer|comunicac|logist|sanidad|intelig|uav|policia|guerra electr/i.test(`${u?.arma || ''} ${u?.tipoApoyo || ''}`)
const conProposito = (t, p) => {
  const tt = sinPunto(t)
  const pp = sinPunto(p).replace(/^(con el prop[oó]sito de|para|a fin de)\s+/i, '')
  return pp && !norm(tt).includes(norm(pp)) ? `${tt}, con el propósito de ${minus1(pp)}` : tt
}
function maniobraTexto(ctx, carta) {
  const C = capAprobado(g3De(ctx), ctx.fasesCOA || {})
  const fases = (C.fases || []).filter(esObj)
  if (!fases.length) return ''
  const D = fasesDescritas(C, carta)
  const U = unidadesPorFase(ctx)
  const L = []
  fases.forEach((f, i) => {
    const us = U[i].filter((u) => !u.apoyo)
    if (!us.length) return
    const c = cuandoFase(D[i], f)
    L.push(`${nombreFase(D[i] || f, i)}${c ? ` ${/^(desde|del|de|entre|a partir)/i.test(c) ? '' : 'desde '}${c}` : ''}:`)
    for (const u of us) L.push(`- ${punto(`${conArt(conRol(ctx, u.nombre)).replace(/^./, (x) => x.toUpperCase())}${u.principal ? ', esfuerzo principal,' : ''} ${minus1(conProposito(u.tarea, u.proposito))}`)}`)
  })
  return L.join('\n')
}
// B.- / C.-: cada unidad con sus tareas (las de todas las fases, sin repetir), en el orden en que aparecen.
function tareasTexto(ctx, apoyo) {
  const U = unidadesPorFase(ctx)
  const por = new Map()
  U.forEach((us, i) =>
    us
      .filter((u) => u.apoyo === apoyo)
      .forEach((u) => {
        if (!por.has(u.nombre)) por.set(u.nombre, [])
        const t = punto(conProposito(u.tarea, u.proposito).replace(/^./, (x) => x.toUpperCase()))
        if (!por.get(u.nombre).some((x) => norm(x) === norm(t))) por.get(u.nombre).push(t)
      }),
  )
  const L = []
  for (const [nom, ts] of por) L.push(`${conRol(ctx, nom)}:`, ...ts.map((t) => `- ${t}`))
  if (apoyo) {
    const rec = filas(g3De(ctx).recursos)
    for (const f of rec) {
      const v = Object.values(f).map(limpio)
      const [quien, aQuien, rel, desde, prio] = v
      if (!quien) continue
      const t = punto(`${rel ? `En ${rel}` : 'Apoya'}${aQuien ? ` a ${aQuien}` : ''}${desde ? `, desde ${desde}` : ''}${prio ? `, prioridad ${prio}` : ''}`)
      const i = L.findIndex((x) => norm(x) === norm(`${quien}:`) || norm(x).startsWith(`${norm(quien)} `))
      if (i >= 0) L.splice(i + 1, 0, `- ${t}`)
      else L.push(`${quien}:`, `- ${t}`)
    }
  }
  return L.join('\n')
}

// ─── Los subpárrafos del Concepto (fuegos, reconocimiento, inteligencia, ingenieros, defensa antiaérea…) ───────
const NOMBRE_SOCB = {
  INTELIGENCIA: 'inteligencia',
  'APOYO DE FUEGOS': 'fuegos',
  'ADA.': 'ada',
  'MOVILIDAD / CONTRAMOVILIDAD / SUPERVIVENCIA (ING.)': 'ingenieros',
  'APOYO DE SERVICIO DE COMBATE': 'asc',
  C2: 'c2',
}
// Lo que dice la Matriz de sincronización (F4·P6-7) de un sistema, fase por fase.
function sincro(ctx, sistema) {
  const s = esObj(g3De(ctx).sincro) ? g3De(ctx).sincro : {}
  const fila = Object.keys(NOMBRE_SOCB).find((k) => NOMBRE_SOCB[k] === sistema)
  const cols = Array.isArray(s._cols) && s._cols.length ? s._cols : ['FASE I', 'FASE II', 'FASE III', 'FASE IV', 'FASE V']
  return cols
    .map((c) => [limpio(c), sinPunto(s[`${fila}|${c}`])])
    .filter(([, x]) => x)
    .map(([c, x]) => `${/^fase/i.test(c) ? c.toUpperCase().replace(/^FASE\s*/, 'En la FASE ') : c}: ${x}.`)
}
const guiaPlan = (ctx, rot) => casilla(hojasDe(ctx, 'cmte').guiaPlanificacion, rot)
function fuegosTexto(ctx, viejo) {
  const L = []
  const C = capAprobado(g3De(ctx), ctx.fasesCOA || {})
  const f = sinPunto(casilla(C.concepto, 'Fuegos'))
  if (f) L.push(punto(f))
  for (const fila of filas(g3De(ctx).fuegos)) {
    const fase = casilla(fila, 'Fase')
    const quien = casilla(fila, 'Unidad que lo bate')
    const tarea = sinPunto(casilla(fila, 'Tarea'))
    const blanco = casilla(fila, 'Blanco')
    const prop = sinPunto(casilla(fila, 'Propósito', 'Proposito'))
    if (!tarea && !prop) continue
    L.push(punto(`${fase ? `${fase}: ` : ''}${quien ? `${quien} ` : ''}${tarea ? minus1(tarea) : 'bate'}${blanco ? ` ${blanco}` : ''}${prop ? `, con el propósito de ${minus1(prop)}` : ''}`))
  }
  L.push(...sincro(ctx, 'fuegos'))
  const g = sinPunto(guiaPlan(ctx, 'VII.- APOYO DE FUEGOS'))
  if (!L.length && g) L.push(punto(g))
  const pf = sinPunto(deDocumento(hojasDe(ctx, 'cmte').guiaFinal).prioridades || '')
    .split('\n')
    .find((x) => /fuegos/i.test(x))
  if (pf) L.push(punto(pf.replace(/^-\s*/, '')))
  if (!L.length && viejo?.['A.2 Apoyo de fuegos']) L.push(texto(viejo['A.2 Apoyo de fuegos']))
  return L.join('\n')
}
function artilleriaTexto(ctx) {
  const L = []
  for (const f of filas(g3De(ctx).orgTarea)) {
    const u = casilla(f, 'Unidad')
    const rel = casilla(f, 'Relación', 'Relacion')
    const ag = casilla(f, 'Agrupación', 'Agrupacion')
    if (!/artiller|\bRA[MCL]?\b|\bGA[CL]\b|GALM|lanzacoh|obus/i.test(`${u} ${ag}`)) continue
    if (/^(AD|AG|R|O)$/i.test(rel)) L.push(`${u} : ${rel.toUpperCase()}${rel.toUpperCase() !== 'AG' && ag ? ` ${ag}` : ''}`)
  }
  return L.length ? ['Organización de la Artillería para el Combate:', ...L.map((x) => `- ${x}`)].join('\n') : ''
}
function mcafTexto(ctx, viejo) {
  const co = g3De(ctx).controlOrden
  const m = casilla(co, 'Medidas de coordinación de apoyo')
  if (m) return m
  return texto(viejo?.['A.2.c Medidas de coordinación de apoyo de fuegos'] || '')
}
function reconocimientoTexto(ctx, viejo) {
  const L = []
  const g = sinPunto(guiaPlan(ctx, 'IV.- LA GU', 'LA GUIA DE RECONOC'))
  if (g) L.push(punto(g))
  L.push(...sincro(ctx, 'inteligencia').filter((x) => /reconoc|vigil|explor|AIN|patrull/i.test(x)))
  if (viejo?.['A.3 Reconocimiento y vigilancia']) L.push(texto(viejo['A.3 Reconocimiento y vigilancia']))
  return L.join('\n')
}
function inteligenciaTexto(ctx) {
  const L = sincro(ctx, 'inteligencia').filter((x) => !/reconoc|vigil|explor|patrull/i.test(x))
  if (L.length) L.push('Ver Anexo de Inteligencia.')
  return L.join('\n')
}
function ingenierosTexto(ctx, viejo) {
  const L = []
  const C = capAprobado(g3De(ctx), ctx.fasesCOA || {})
  const m = sinPunto(casilla(C.concepto, 'Movilidad'))
  if (m) L.push(punto(m))
  L.push(...sincro(ctx, 'ingenieros'))
  const g = sinPunto(guiaPlan(ctx, 'VIII.- APOYO DE INGENIER'))
  if (!L.length && g) L.push(punto(g))
  const obs = casilla(g3De(ctx).controlOrden, 'Medidas de control de obstáculos')
  if (obs) L.push(punto(`Medidas de control de obstáculos: ${sinPunto(obs)}`))
  if (viejo?.['A.5 Ingenieros']) L.push(texto(viejo['A.5 Ingenieros']))
  return L.join('\n')
}
function adaTexto(ctx) {
  const L = sincro(ctx, 'ada')
  return L.join('\n')
}

// ─── III.- D.- Instrucciones de coordinación (la lista del PMTD 2017) ───────────────────────────────────────────
function rcicTexto(ctx) {
  const cm = hojasDe(ctx, 'cmte')
  const g3 = g3De(ctx)
  const rpi = []
  const rifa = []
  const eeia = []
  const poner = (req, tipo) => {
    const r = sinPunto(req)
    if (!r) return
    const t = norm(tipo)
    const destino = /eeia|esencial/.test(t) ? eeia : /rifa|amig|propi/.test(t) || /^informar|nuestr|propias|amigas/i.test(r) ? rifa : rpi
    const f = /^[¿?]/.test(r) || /^informar/i.test(r) ? r : `¿${r.replace(/^[¿]|[?]$/g, '')}?`
    if (!destino.some((x) => norm(x) === norm(f))) destino.push(/[?.]$/.test(f) ? f : `${f}.`)
  }
  for (const f of filas(cm.prioridadRcic)) poner(casilla(f, 'Requerimiento'), '')
  for (const f of filas(g3.rcic)) poner(casilla(f, 'Requerimiento'), casilla(f, 'Tipo'))
  const final = deDocumento(cm.guiaFinal).rcic || ''
  for (const r of texto(final).split('\n')) poner(r.replace(/^\s*-\s*/, '').replace(/\s*\((?:prioridad|lo propuso|sostiene|no despu)[^)]*\)\s*$/i, ''), '')
  const L = []
  if (rpi.length || rifa.length) {
    L.push('Requerimientos críticos de información del Comandante:')
    if (rpi.length) L.push(`- Requerimientos prioritarios de inteligencia (RPI): ${rpi.join(' ')}`)
    if (rifa.length) L.push(`- Requerimientos de información de la fuerza amiga (RIFA): ${rifa.join(' ')}`)
  }
  if (eeia.length) L.push('Elementos esenciales de información amiga:', ...eeia.map((x) => `- ${x.replace(/^¿|\?$/g, '')}${/[.]$/.test(x) ? '' : '.'}`))
  return L
}
function riesgoTexto(ctx) {
  const g3 = g3De(ctx)
  const out = []
  for (const v of [g3.riesgoFinal, g3.riesgo]) {
    if (!v) continue
    let m = null
    try {
      m = normalizarRiesgo(v)
    } catch {
      m = null
    }
    for (const t of m?.tareas || []) for (const p of t.peligros || []) for (const c of p.controles || []) if (!vacio(c) && !out.some((x) => norm(x) === norm(c))) out.push(punto(c))
    if (out.length) break
  }
  return out.slice(0, 10)
}
function coordinacionTexto(ctx, aux = {}) {
  const os = ctx.ordenSup || {}
  const g3 = g3De(ctx)
  const co = g3.controlOrden
  const cm = hojasDe(ctx, 'cmte')
  const fuentes = [os.coordinacion, os.tareas, os.concepto, os.limitaciones]
  const usadas = new Set()
  const de = (re, max = 3) => {
    const xs = oracionesQue(fuentes, re, max).filter((o) => !usadas.has(o))
    xs.forEach((o) => usadas.add(o))
    return xs
  }
  const L = []
  // 1.- Hora o condición de entrada en vigor.
  const dia = aux.lt?.ok && !aux.lt.sinCalendario && aux.lt.inicioOperacionTxt ? ` Día D hora H: ${aux.lt.inicioOperacionD} — ${aux.lt.inicioOperacionTxt}.` : ''
  L.push(`La presente orden entra en vigor a partir de su emisión.${dia}`)
  // 2.- RCIC (sólo acá).
  L.push(...rcicTexto(ctx))
  // 3.- Medidas de control para la reducción de riesgos.
  const rs = riesgoTexto(ctx)
  if (rs.length) L.push('Medidas de control para la reducción de riesgos:', ...rs.map((x) => `- ${x}`))
  // 4.- Reglas de enfrentamiento.
  const re = de(/enfrentamiento|\bDICA\b|\bDIH\b|derecho internacional|prisioner|no combatiente|genocid|ottawa/i)
  if (re.length) L.push('Reglas de enfrentamiento:', ...re.map((x) => `- ${punto(x)}`))
  // 5.- Consideraciones ambientales.
  const amb = de(/ambient|contamina|fauna|flora|caza|tala|recursos h[ií]dricos/i)
  if (amb.length) L.push('Consideraciones ambientales:', ...amb.map((x) => `- ${punto(x)}`))
  // 6.- Protección de la fuerza.
  const prot = sinPunto(guiaPlan(ctx, 'IX.- MEDIDAS DE SEGURIDAD'))
  if (prot) L.push('Protección de la fuerza:', ...separarTareas(prot).map((x) => `- ${punto(x)}`))
  // 7.- Instrucciones de coordinación adicionales: lo que dispone la Orden superior, los movimientos y los P.D.
  const adic = []
  for (const o of oracionesQue(fuentes, /./, 12)) if (!usadas.has(o) && !/l[ií]mite de avance|nivel (de amenaza )?(I{1,3}|bajo|alto)\b|ensayo/i.test(o)) adic.push(punto(o))
  for (const f of filas(g3.movimientos)) {
    const u = casilla(f, 'Unidad')
    if (!u) continue
    adic.push(punto(`${u} se desplaza${casilla(f, 'Desde') ? ` desde ${casilla(f, 'Desde')}` : ''}${casilla(f, 'Hasta') ? ` hasta ${casilla(f, 'Hasta')}` : ''}${casilla(f, 'Itinerario') ? ` por ${casilla(f, 'Itinerario')}` : ''}${casilla(f, 'No antes de') ? `, no antes del ${casilla(f, 'No antes de')}` : ''}${casilla(f, 'No después de', 'No despues de') ? ` y no después del ${casilla(f, 'No después de', 'No despues de')}` : ''}`))
  }
  for (const f of filas(g3.eventos)) {
    const v = Object.values(f).map(limpio)
    if (v[0] && v[1]) adic.push(punto(`Punto de decisión ${v[0].replace(/^P\.?\s?D\.?\s*/i, '')}: ${v[1]}${v[4] ? `; se decide cuando ${minus1(v[4]).replace(/^cuando\s+/i, '')}` : ''}${v[5] ? `; decisión: ${minus1(v[5])}` : ''}`))
  }
  const mc = casilla(co, 'Medidas de control gráficas')
  if (mc) adic.push(punto(`Medidas de control: ${sinPunto(mc)}`))
  if (adic.length) L.push('Instrucciones de coordinación adicionales:', ...adic.slice(0, 14).map((x) => `- ${x}`))
  // 8.- Línea avanzada de las tropas / límite de avance.
  const lim = oracionesQue(fuentes, /l[ií]mite de avance|l[ií]nea avanzada|\bLAAT\b/i, 2)
  if (lim.length) L.push('Límite de avance:', ...lim.map((x) => `- ${punto(x)}`))
  // 9.- Medidas de control de coordinación de apoyo de fuegos.
  const mcaf = casilla(co, 'Medidas de coordinación de apoyo')
  if (mcaf) L.push(punto(`Las medidas de coordinación de apoyo de fuegos son las del párrafo III.- A.- 2.- y el Anexo de Apoyo de Fuegos: ${sinPunto(mcaf)}`))
  // 10.- Ensayo.
  const ens = [casilla(co, 'Tipo de ensayo'), casilla(co, 'Quiénes participan', 'Quienes participan'), sinPunto(deDocumento(cm.guiaFinal).ensayos || '').replace(/\n+/g, ' ')].map(sinPunto).filter(Boolean)
  if (ens.length) L.push(punto(`Ensayo: ${ens.join('; ')}`))
  // 11.- Nivel de amenaza en el área de retaguardia.
  const am = oracionesQue(fuentes, /nivel (de amenaza )?(I{1,3}|bajo|medio|alto)\b|amenaza.*retaguardia/i, 1)
  if (am.length) L.push(punto(am[0]))
  // 12.- Restricciones.
  const lim2 = g3.limitaciones
  const prohib = Array.isArray(lim2?.a) ? lim2.a.map(sinPunto).filter(Boolean) : []
  const oblig = Array.isArray(lim2?.b) ? lim2.b.map(sinPunto).filter(Boolean) : []
  if (prohib.length || oblig.length) L.push('Restricciones:', ...[...prohib, ...oblig].slice(0, 10).map((x) => `- ${punto(x.replace(/^[^\wÁÉÍÓÚÑ¿]+/u, ''))}`))
  return L.join('\n')
}

// ─── IV.- APOYO DE SERVICIO y V.- COMANDO Y COMUNICACIONES ──────────────────────────────────────────────────────
const ENFOQUE = { cl1: 'Clase I', cl2: 'Clase II', cl3: 'Clase III', cl4: 'Clase IV', cl5: 'Clase V', cl6: 'Clase VI', cl7: 'Clase VII', cl8: 'Clase VIII', cl9: 'Clase IX', cl10: 'Clase X', evacuacion: 'evacuación', mantenimiento: 'mantenimiento', transporte: 'transporte', sanidad: 'sanidad' }
function apoyoTexto(ctx) {
  const L = []
  const ml = sinPunto(ctx.misionLog)
  if (ml) L.push(punto(ml))
  ;(Array.isArray(ctx.conceptoApoyo) ? ctx.conceptoApoyo : []).forEach((c, i) => {
    if (!esObj(c)) return
    const enf = (Array.isArray(c.enfoque) ? c.enfoque : []).map((e) => ENFOQUE[e] || e).filter(Boolean)
    const pr = sinPunto(c.prioridad)
    if (!enf.length && !pr) return
    L.push(punto(`En la FASE ${romano(i + 1)}${limpio(c.nombre) ? ` (${limpio(c.nombre).toUpperCase()})` : ''}${enf.length ? `, el enfoque de apoyo logístico será de ${lista(enf)}` : ''}${pr ? `${enf.length ? ', con' : ', la'} prioridad de apoyo a ${pr}` : ''}`))
  })
  if (!L.length) L.push(...sincro(ctx, 'asc'))
  const g = guiaPlan(ctx, 'XIII.- PRIORIDADES DE APOYO')
  if (!L.length && g) L.push(...oraciones(g).filter((o) => /abastec|clase|log[ií]st|transport|mantenim/i.test(o)).map(punto))
  if (!L.length) {
    const p = prepDe(ctx, 'servicio') || texto(ctx.ordenSup?.servicio || '')
    if (p) L.push(p)
  }
  return L.join('\n')
}
function personalTexto(ctx) {
  const g = guiaPlan(ctx, 'XIII.- PRIORIDADES DE APOYO')
  return oraciones(g || '')
    .filter((o) => /personal|reemplaz|PP\.?\s?GG|prisioner|bajas|sanidad|moral/i.test(o))
    .map(punto)
    .join('\n')
}
function comandoTexto(ctx, L) {
  const os = ctx.ordenSup || {}
  const out = []
  const sub = agrupaciones(ctx).map((a) => a.nombre.replace(/\s*\((?:OD|OC-?\d|RESERVA|RES)\)\s*$/i, '').trim()).filter((n) => !/BAJO CONTROL/i.test(n))
  const od = agrupaciones(ctx).find((a) => /\(OD\)/i.test(a.nombre))
  if (L.propia) {
    const orden = od ? [od.nombre.replace(/\s*\(OD\)\s*$/i, ''), ...sub.filter((n) => norm(n) !== norm(od.nombre.replace(/\s*\(OD\)\s*$/i, '')))] : sub
    out.push('Sucesión de mando:', `- Comandante ${del(L.propia)} ${L.propia}.`, `- Jefe de Estado Mayor ${del(L.propia)} ${L.propia}.`, `- G-3 ${del(L.propia)} ${L.propia}.`, ...orden.slice(0, 6).map((n) => `- Comandante ${del(n)} ${n}.`))
  }
  const pcs = (ctx.unidades || []).filter((u) => esObj(u) && (u.tipo === 'pc' || /^\s*P\.?\s?C\.?\s?[PAR]?\b/i.test(u.designacion || '')) && !/enem/i.test(String(u.bando || '')))
  const pcTxt = pcs.map((u) => `- ${limpio(u.designacion) || 'PC'}${Number.isFinite(+u.lat) && Number.isFinite(+u.lng) ? ` (Coord. ${(+u.lat).toFixed(4)}, ${(+u.lng).toFixed(4)})` : ''}.`)
  if (pcTxt.length) out.push('Puestos comando:', ...pcTxt)
  else if (!vacio(os.comando)) out.push(punto(texto(os.comando).replace(/\n+/g, ' ')))
  else if (!vacio(os.puestoMando)) out.push('Puestos comando:', `- PCP. ${del(L.propia || 'la Unidad')} ${L.propia || 'Unidad'}: ${sinPunto(os.puestoMando).replace(/^C\.?\s?G\.?\s*/i, '')}.`)
  return out.join('\n') || prepDe(ctx, 'comando')
}
function comunicacionesTexto(ctx) {
  const os = ctx.ordenSup || {}
  return vacio(os.comunicaciones) ? '' : texto(os.comunicaciones)
}

// ─── 🌱 Lo que trae del ejercicio ───────────────────────────────────────────────────────────────────────────────
// ctx: ver arriba. aux: { viejo (lo que traía 🌱 antes, con las claves de antes: el CAE, los fuegos, el plan de
// barreras), carta ({ nomenclator, catalogos }), lt (la Línea de Tiempo, MS del compilado) }.
export function semillaOgo(ctx = {}, aux = {}) {
  const viejo = esObj(aux.viejo) ? aux.viejo : {}
  const L = lecturaUnidades(ctx)
  const os = ctx.ordenSup || {}
  const out = {}
  const pon = (k, f) => {
    try {
      const t = typeof f === 'function' ? f() : f
      if (!vacio(t)) out[k] = texto(t)
    } catch {}
  }
  // Lo que ya estaba escrito en la hoja con las claves de antes (el oficial o la IA): pasa a su casilla nueva.
  const antes = leerOgo(g3De(ctx).opord) || {}
  for (const k of CAMPOS) if (!vacio(antes[k])) out[k] = texto(antes[k])
  const falta = (k) => vacio(out[k])
  const obj = () => {
    const t = tipoOperacion(ctx)
    return L.propia && t ? `${conArt(L.propia).replace(/^./, (x) => x.toUpperCase())} en ${t}.` : prepDe(ctx, 'objeto')
  }
  if (falta(K.objeto)) pon(K.objeto, obj)
  if (falta(K.cartas)) pon(K.cartas, () => os.carta || prepDe(ctx, 'carta') || viejo.CARTA)
  if (falta(K.anexos)) pon(K.anexos, () => anexosTexto(ctx))
  if (falta(K.org)) pon(K.org, () => organizacionTexto(ctx, L))
  if (falta(K.enemigas)) pon(K.enemigas, () => viejo['A. Fuerzas enemigas'] || deSituacion(ctx, 'A') || os.enemigo)
  if (falta(K.probable)) pon(K.probable, () => viejo['A.1 Curso de acción más PROBABLE'])
  if (falta(K.peligroso)) pon(K.peligroso, () => viejo['A.2 Curso de acción más PELIGROSO'])
  if (falta(K.propias)) pon(K.propias, () => fuerzasPropias(ctx, L) || deSituacion(ctx, 'B'))
  if (falta(K.refuerzos)) pon(K.refuerzos, () => os.refuerzos || deSituacion(ctx, 'C'))
  if (falta(K.mision)) pon(K.mision, () => misionTexto(ctx))
  if (falta(K.intencion)) pon(K.intencion, () => intencionTexto(ctx))
  if (falta(K.concepto)) pon(K.concepto, () => conceptoTexto(ctx, aux.carta))
  if (falta(K.maniobra)) pon(K.maniobra, () => maniobraTexto(ctx, aux.carta))
  if (falta(K.fuegos)) pon(K.fuegos, () => fuegosTexto(ctx, viejo))
  if (falta(K.aereo)) pon(K.aereo, () => oracionesQue([os.concepto, os.coordinacion, os.propias, os.tareas], /apoyo a[eé]reo|\bAAC\b|salidas?\/d[ií]a|vuelos?/i, 3).map(punto).join('\n'))
  if (falta(K.artilleria)) pon(K.artilleria, () => artilleriaTexto(ctx))
  if (falta(K.mcaf)) pon(K.mcaf, () => mcafTexto(ctx, viejo))
  if (falta(K.reconocimiento)) pon(K.reconocimiento, () => reconocimientoTexto(ctx, viejo))
  if (falta(K.inteligencia)) pon(K.inteligencia, () => inteligenciaTexto(ctx))
  if (falta(K.ingenieros)) pon(K.ingenieros, () => ingenierosTexto(ctx, viejo))
  if (falta(K.ada)) pon(K.ada, () => adaTexto(ctx))
  if (falta(K.acgm)) pon(K.acgm, () => oraciones(guiaPlan(ctx, 'XIII.- PRIORIDADES DE APOYO') || '').filter((o) => /G-5|AC\/?GM|civil|desplazad|evacuaci[oó]n de la poblaci/i.test(o)).map(punto).join('\n'))
  if (falta(K.proteccion)) pon(K.proteccion, () => sinPunto(guiaPlan(ctx, 'IX.- MEDIDAS DE SEGURIDAD')) && punto(guiaPlan(ctx, 'IX.- MEDIDAS DE SEGURIDAD')))
  if (falta(K.tareasManiobra)) pon(K.tareasManiobra, () => tareasTexto(ctx, false) || prepDe(ctx, 'maniobra'))
  if (falta(K.tareasApoyo)) pon(K.tareasApoyo, () => tareasTexto(ctx, true) || prepDe(ctx, 'apoyo'))
  if (falta(K.coordinacion)) pon(K.coordinacion, () => coordinacionTexto(ctx, aux))
  if (falta(K.apoyoConcepto)) pon(K.apoyoConcepto, () => apoyoTexto(ctx))
  if (falta(K.personal)) pon(K.personal, () => personalTexto(ctx))
  if (falta(K.comando)) pon(K.comando, () => comandoTexto(ctx, L))
  if (falta(K.comunicaciones)) pon(K.comunicaciones, () => comunicacionesTexto(ctx))
  return out
}

// Lo que 🌱 escribe en la hoja: SÓLO lo vacío. { valor, n }
export function sembrarOgo(valor, propuesta) {
  const v = { ...(leerOgo(valor) || (esObj(valor) ? valor : {})) }
  let n = 0
  for (const k of CAMPOS) if (!vacio(propuesta?.[k]) && vacio(v[k])) (v[k] = propuesta[k]), n++
  return { valor: v, n }
}

// ─── Lo guardado con las claves de ANTES (hasta el 27-10-2026) ──────────────────────────────────────────────────
export const VIEJAS = {
  CARTA: K.cartas,
  'Organización de la tarea': K.org,
  'A. Fuerzas enemigas': K.enemigas,
  'A.1 Curso de acción más PROBABLE': K.probable,
  'A.2 Curso de acción más PELIGROSO': K.peligroso,
  'B. Fuerzas propias': K.propias,
  'C. Refuerzos y reducciones': K.refuerzos,
  'D. Hipótesis (sólo en el PLAN de operaciones)': K.hipotesis,
  Misión: K.mision,
  'Intención del Comandante': K.intencion,
  'A. Concepto de la operación': K.concepto,
  'A.1 Maniobra': K.maniobra,
  'A.2 Apoyo de fuegos': K.fuegos,
  'A.2.a Apoyo aéreo': K.aereo,
  'A.2.b Apoyo de artillería de campaña': K.artilleria,
  'A.2.c Medidas de coordinación de apoyo de fuegos': K.mcaf,
  'A.3 Reconocimiento y vigilancia': K.reconocimiento,
  'A.4 Inteligencia': K.inteligencia,
  'A.5 Ingenieros': K.ingenieros,
  'A.6 Defensa antiaérea': K.ada,
  'A.7 Operaciones QBN': K.qbn,
  'A.8 Operaciones de Policía Militar': K.pm,
  'A.9 Operaciones de AC/GM': K.acgm,
  'B. Tareas de las unidades de maniobra': K.tareasManiobra,
  'C. Tareas de las unidades de apoyo de combate': K.tareasApoyo,
  'D. Instrucciones de coordinación': K.coordinacion,
  'A. Concepto de apoyo': K.apoyoConcepto,
  'B. Otros aspectos de apoyo de servicio': K.personal,
  'A. Comando': K.comando,
  'B. Comunicaciones': K.comunicaciones,
}
// La hoja con las claves de ahora: lo de una clave vieja pasa a su casilla nueva si está vacía (y la vieja se saca).
// null si no hay nada que convertir (así el compilado sigue con lo de siempre).
export function leerOgo(hoja, valor) {
  // Se llama como leerOgo(hoja, valor) desde el compilado y como leerOgo(valor) acá adentro.
  if (arguments.length >= 2) {
    if (hoja?.id !== 'opord' || hoja?.tipo !== 'campos') return null
  } else valor = hoja
  if (!esObj(valor) || !Object.keys(VIEJAS).some((k) => k in valor)) return null
  const v = { ...valor }
  for (const [viejo, nuevo] of Object.entries(VIEJAS)) {
    if (!(viejo in v)) continue
    if (vacio(v[nuevo]) && !vacio(v[viejo])) v[nuevo] = v[viejo]
    delete v[viejo]
  }
  return v
}

// ─── 📄 El Word (formato militar de la Mesa: formato-militar/v1/word.js) ────────────────────────────────────────
const SANGRIA = /^\s*(?:[-–•·*]|[A-Za-z]\.-|[A-Za-z][.)]|\d{1,2}[.)]-?|\d{1,2}\.-)\s+/
const sinNumeracion = (s) => String(s ?? '').replace(SANGRIA, '').trim()
const conPunto = (s) => {
  const t = limpio(s).replace(/:$/, '')
  return /[.!?…»”]$/.test(t) ? t : `${t}.`
}
// Un texto de la hoja → { texto, vinetas, hijos } (párrafos, viñetas y lo que sigue después de las viñetas).
export function bloques(s) {
  const r = texto(s).split('\n').filter(Boolean)
  const B = []
  for (const l of r) {
    const v = /^\s*(?:[-–•·]|\*(?!\*))\s+(.+)$/.exec(l)
    const u = B[B.length - 1]
    if (v) {
      if (u?.vinetas) u.vinetas.push(limpio(v[1]))
      else B.push({ vinetas: [limpio(v[1])] })
    } else B.push({ texto: limpio(l) })
  }
  const out = {}
  const ts = []
  while (B.length && B[0].texto != null) ts.push(B.shift().texto)
  if (ts.length) out.texto = ts.join('\n')
  if (B.length && B[0].vinetas) out.vinetas = B.shift().vinetas
  if (B.length) out.hijos = B
  return out
}
// Un texto con subpárrafos → nodos numerados: el renglón «Rótulo:» es un título con sus incisos debajo («- »), el
// renglón «- Rótulo: texto» un subtítulo con su texto, y cualquier otro renglón un inciso numerado (sin negrita).
// `conTitulo`: los renglones «Rótulo: texto» de arriba también van como título (las unidades de B.- y C.-).
export function subparrafos(s, { conTitulo = false } = {}) {
  const r = texto(s).split('\n').filter((x) => limpio(x))
  const nodos = []
  let actual = null
  for (const crudo of r) {
    const nivel2 = /^\s*(?:[-–•·]|\*(?!\*))\s+/.test(crudo) && !/^\s*(?:--|\s{2,}[-–•·])/.test(crudo)
    const nivel3 = /^\s*(?:--\s+|\s{2,}[-–•·]\s+)/.test(crudo)
    const l = limpio(crudo.replace(/^\s*(?:--|[-–•·]|\*(?!\*))\s+/, ''))
    if (!l) continue
    if (nivel3 && actual?.hijos?.length) {
      const p = actual.hijos[actual.hijos.length - 1]
      ;(p.hijos ||= []).push({ titulo: sinNumeracion(l), item: true })
      if (p.item) {
        delete p.item
        p.titulo = conPunto(p.titulo)
      }
      continue
    }
    if ((nivel2 || nivel3) && actual) {
      const m = /^([^:]{2,60}[^\s:]):\s+(\S.*)$/.exec(l)
      if (m && !/[.;]/.test(m[1]) && m[1].split(/\s+/).length <= 8 && !/^(fase|en la fase)/i.test(m[1])) actual.hijos.push({ titulo: conPunto(m[1]), texto: m[2] })
      else actual.hijos.push({ titulo: sinNumeracion(l), item: true })
      continue
    }
    const tit = /^(.{2,140}?):\s*$/.exec(l)
    if (tit) {
      actual = { titulo: conPunto(sinNumeracion(tit[1])), hijos: [] }
      nodos.push(actual)
      continue
    }
    const m = conTitulo ? /^([^:]{2,80}?[^\s:]):\s+(\S.*)$/.exec(sinNumeracion(l)) : null
    if (m) {
      actual = { titulo: conPunto(m[1]), texto: m[2], hijos: [] }
      nodos.push(actual)
      continue
    }
    actual = null
    nodos.push({ titulo: sinNumeracion(l), item: true })
  }
  return nodos.map((n) => (n.hijos && !n.hijos.length ? (({ hijos, ...x }) => x)(n) : n))
}
// La maniobra (o un texto por fases): «FASE I … :» como subtítulo sin numerar y debajo un párrafo por unidad.
function porFases(s) {
  const r = texto(s).split('\n').filter((x) => limpio(x))
  const out = []
  let actual = null
  for (const crudo of r) {
    const l = limpio(crudo.replace(/^\s*(?:[-–•·]|\*(?!\*))\s+/, ''))
    if (/^FASE\s+[IVX\d]+/i.test(l) && (/:\s*$/.test(l) || l.length < 140)) {
      actual = { titulo: l.replace(/:\s*$/, ''), sinRotulo: true, hijos: [] }
      out.push(actual)
      continue
    }
    if (actual) actual.hijos.push({ texto: l })
    else out.push({ texto: l })
  }
  return out.map((n) => (n.hijos ? { titulo: n.titulo, sinRotulo: true, texto: n.hijos.map((x) => x.texto).join('\n') } : n))
}
// Un apartado que puede venir en párrafos o con subpárrafos: los renglones numerados («1. Refuerzos: …») o con
// títulos («Sucesión de mando:») van como subpárrafos; si no, párrafos.
export function apartado(s) {
  const r = texto(s).split('\n').filter((x) => limpio(x))
  const numerados = r.filter((x) => /^\s*\d{1,2}[.)]-?\s+\S/.test(x)).length
  if (r.length > 1 && numerados >= Math.max(2, r.length / 2)) return { hijos: subparrafos(s, { conTitulo: true }) }
  const n = subparrafos(s)
  return n.every((x) => x.item) ? bloques(s) : { hijos: n }
}
// El cuadro de la ORGANIZACIÓN DE LA TAREA (word.js · organizacion: { titulo, equipos: [{ nombre, elementos }] }).
export function equiposOrg(s) {
  const out = []
  for (const l of texto(s).split('\n')) {
    const x = sinNumeracion(limpio(l))
    if (!x) continue
    const m = /^([^:]{2,80}):\s*(.*)$/.exec(x)
    if (m) out.push({ nombre: limpio(m[1]), elementos: m[2].split(/\s*[;·]\s*|\s*,\s+(?=[A-ZÁÉÍÓÚÑ0-9“"«])/).map(limpio).filter(Boolean) })
    else if (out.length) out[out.length - 1].elementos.push(x)
    else out.push({ nombre: x, elementos: [] })
  }
  return out
}
const lineasOCA = (s) =>
  texto(s)
    .split('\n')
    // «Anexo "A" (Calco de Operaciones), Anexo "B" (…)»: uno por renglón.
    .flatMap((x) => x.split(/[,;]\s*(?=(?:Anexo|Ap[eé]ndice)\s*[“"«]?[A-Z]\b|[“"«][A-Z][”"»])/i))
    .map((x) => limpio(x.replace(/^\s*(?:[-–•·]|\*(?!\*))\s+/, '')).replace(/[,;]\s*$/, ''))
    .filter(Boolean)
    .join('\n')
const noAplica = (s) => /^\s*(n\/?a|no aplica|s\/?a|sin novedad|ninguna?)\b/i.test(limpio(s))

// La distribución del modelo: el escalón superior, una copia por unidad y el ARCHIVO.
export function distribucion(superior, valor = {}) {
  const ag = equiposOrg(valor[K.org])
  const us = []
  for (const a of ag) {
    if (/BAJO CONTROL/i.test(a.nombre)) us.push(...a.elementos)
    else {
      const n = a.nombre.replace(/\s*\((?:OD|OC-?\s?\d|RESERVA|RES)\)\s*$/i, '').trim()
      const de = /^(?:agrupaci[oó]n|AT\b|F\.?T\.?\b)[^(]*\(([^)]+)\)$/i.exec(n)
      us.push(de ? limpio(de[1]) : n)
    }
  }
  const L = [`Original : ${limpio(superior) || 'ESCALÓN SUPERIOR'}`]
  const u = [...new Set(us.filter(Boolean))].slice(0, 15)
  if (u.length) u.forEach((x, i) => L.push(`Copia ${i + 1} : ${x}`))
  else L.push('Copia 1-12 : UU. DEP.')
  L.push(`Copia ${u.length ? u.length + 1 : 13} : ARCHIVO`)
  return L.join('\n')
}
export function firmaOgo(unidad, firma = '') {
  if (limpio(firma)) return limpio(firma)
  const u = limpio(unidad)
  return u ? `EL COMANDANTE ${del(u).toUpperCase()} ${u}` : 'EL COMANDANTE DE LA UNIDAD'
}

// La especificación del Word. base: { membrete, clasificacion } del compilado. op: { unidad, superior, firma, numero,
// plan (true si es un PLAN de operaciones) }. null si la hoja está vacía.
export function wordOgo(valor = {}, base = {}, op = {}) {
  const v = leerOgo(valor) || (esObj(valor) ? valor : {})
  if (!CAMPOS.some((k) => !vacio(v[k]))) return null
  const t = (k) => texto(v[k])
  const nodo = (titulo, cont, extra = {}) => ({ titulo, ...cont, ...extra })
  const conTexto = (titulo, k, f = bloques) => (vacio(v[k]) ? null : nodo(titulo, f === bloques ? bloques(t(k)) : { hijos: f(t(k)) }))
  const sinVacios = (xs) => xs.filter(Boolean)
  // I.- SITUACIÓN
  const enem = { titulo: 'Fuerzas enemigas.', ...bloques(t(K.enemigas)) }
  enem.hijos = [...(enem.hijos || []), nodo('Curso de acción más probable.', bloques(t(K.probable))), nodo('Curso de acción más peligroso.', bloques(t(K.peligroso)))]
  const propias = { titulo: 'Fuerzas propias.', ...apartado(t(K.propias)) }
  const situacion = sinVacios([
    enem,
    propias,
    nodo('Refuerzos y reducciones.', apartado(t(K.refuerzos))),
    !vacio(v[K.hipotesis]) && !noAplica(v[K.hipotesis]) ? nodo('Hipótesis.', bloques(t(K.hipotesis))) : null,
  ])
  // III.- EJECUCIÓN
  const fuegos = { titulo: 'Fuegos.', ...bloques(t(K.fuegos)) }
  const subF = sinVacios([conTexto('Apoyo aéreo.', K.aereo), conTexto('Apoyo de artillería de campaña.', K.artilleria, (x) => subparrafos(x)), conTexto('Medidas de coordinación de apoyo de fuegos.', K.mcaf)])
  // Las listas («Organización de la Artillería para el Combate:» y sus renglones) van como subpárrafos.
  for (const s of subF) if (s.hijos?.length && s.hijos.every((h) => h.item)) Object.assign(s, { texto: undefined })
  fuegos.hijos = [...(fuegos.hijos || []), ...subF]
  const vacioOpt = (k) => vacio(v[k]) || noAplica(v[k])
  const concepto = { titulo: 'Concepto de la operación.', ...bloques(t(K.concepto)) }
  concepto.hijos = [
    ...(concepto.hijos || []),
    nodo('Maniobra.', { hijos: porFases(t(K.maniobra)) }),
    vacio(v[K.fuegos]) && !subF.length ? null : fuegos,
    conTexto('Reconocimiento y vigilancia.', K.reconocimiento),
    conTexto('Inteligencia.', K.inteligencia),
    conTexto('Ingenieros.', K.ingenieros),
    conTexto('Defensa antiaérea.', K.ada),
    vacioOpt(K.qbn) ? null : conTexto('Operaciones QBN.', K.qbn),
    vacioOpt(K.pm) ? null : conTexto('Operaciones de la Policía Militar.', K.pm),
    vacioOpt(K.acgm) ? null : conTexto('Operaciones de AC/GM.', K.acgm),
    vacioOpt(K.proteccion) ? null : conTexto('Protección.', K.proteccion),
    vacioOpt(K.info) ? null : conTexto('Operaciones de información.', K.info),
  ].filter(Boolean)
  const intencion = { titulo: 'Intención del Comandante.', sinRotulo: true, ...bloques(redactarIntencion(t(K.intencion))) }
  const ejecucion = [
    intencion,
    concepto,
    nodo('Tareas de las unidades de maniobra.', { hijos: subparrafos(t(K.tareasManiobra), { conTitulo: true }) }),
    nodo('Tareas de las unidades de apoyo de combate.', { hijos: subparrafos(t(K.tareasApoyo), { conTitulo: true }) }),
    nodo('Instrucciones de coordinación.', { hijos: subparrafos(t(K.coordinacion)) }),
  ]
  // IV.- y V.-
  const anexos = texto(v[K.anexos])
  const anexoDe = (re) => {
    const l = lineasOCA(anexos).split('\n').find((x) => re.test(x))
    const m = l && /[“"«]\s*([A-Z])\s*[”"»]\s*(.*)$/.exec(l)
    return m ? `Ver Anexo “${m[1]}” ${limpio(m[2]).replace(/^\((.*)\)\.?$/, '$1').replace(/\.$/, '')}.` : ''
  }
  const servicio = {
    titulo: 'APOYO DE SERVICIO.',
    texto: anexoDe(/servicio de combate|log[ií]stic|sostenim/i) || undefined,
    hijos: sinVacios([nodo('Concepto de apoyo.', bloques(t(K.apoyoConcepto))), conTexto('Personal.', K.personal)]),
  }
  const comando = { titulo: 'Comando.', ...apartado(t(K.comando)) }
  const comunic = { titulo: 'Comunicaciones.', ...apartado(t(K.comunicaciones)) }
  const cc = { titulo: 'COMANDO Y COMUNICACIONES.', texto: anexoDe(/comunicacion/i) || undefined, hijos: [comando, comunic] }
  const equipos = equiposOrg(t(K.org))
  const tipo = casilla(op.controlOrden, 'Tipo de orden')
  const plan = op.plan ?? (/plan de operaciones/i.test(tipo) && !/orden de operaciones/i.test(tipo))
  // «No. 01/26»: el número y el año de la recepción de la Orden (si la Línea de Tiempo tiene calendario).
  const anio = op.lt?.ok && !op.lt.sinCalendario && op.lt.recepcion && typeof op.lt.recepcion.getFullYear === 'function' ? String(op.lt.recepcion.getFullYear()).slice(-2) : ''
  const spec = {
    ...base,
    titulo: plan ? 'PLAN GENERAL DE OPERACIONES' : 'ORDEN GENERAL DE OPERACIONES',
    numero: limpio(op.numero) || (anio ? `01/${anio}` : '01'),
    preliminares: [
      { rotulo: 'OBJETO', texto: lineasOCA(v[K.objeto]) },
      { rotulo: 'CARTAS', texto: lineasOCA(v[K.cartas]) },
      { rotulo: 'ANEXOS', texto: lineasOCA(v[K.anexos]) },
    ],
    secciones: [
      { titulo: 'SITUACIÓN.', hijos: situacion },
      { titulo: 'MISIÓN.', ...bloques(t(K.mision)) },
      { titulo: 'EJECUCIÓN.', hijos: ejecucion },
      servicio,
      cc,
    ],
    firma: firmaOgo(op.unidad, op.firma),
    distribucion: distribucion(op.superior, v),
    autenticador: 'G-3',
    estructuraPropia: true,
    modelo: 'Orden General de Operaciones — PMTD 2017 (Parte Tercera, Cap. VII) y modelos de la Escuela (OGO 01-35, OGO 01/21 del CE-I)',
  }
  if (equipos.some((e) => e.elementos.length)) spec.organizacion = { titulo: 'ORGANIZACIÓN DE LA TAREA', equipos }
  else if (equipos.length) spec.secciones.unshift({ titulo: 'Organización de la Tarea.', sinRotulo: true, vinetas: equipos.map((e) => e.nombre) })
  return limpiarNodos(spec)
}
// Sin claves undefined ni hijos vacíos (word.js los recorre).
function limpiarNodos(x) {
  if (Array.isArray(x)) return x.map(limpiarNodos)
  if (!esObj(x)) return x
  const o = {}
  for (const [k, val] of Object.entries(x)) {
    if (val === undefined) continue
    if (k === 'hijos' && Array.isArray(val) && !val.length) continue
    o[k] = limpiarNodos(val)
  }
  return o
}

// ─── 🤖 Lo que la Mesa ya tiene, para el pedido a la IA ─────────────────────────────────────────────────────────
// Lo que trae 🌱, casilla por casilla: la IA redacta SOBRE esto (no lo inventa de nuevo). Se recorta para no
// agrandar de más el pedido.
export function bloqueMesa(ctx = {}, aux = {}, max = 24000) {
  let S = {}
  try {
    S = semillaOgo(ctx, aux)
  } catch {
    S = {}
  }
  const xs = CAMPOS.filter((k) => !vacio(S[k])).map((k) => `## ${k}\n${S[k]}`)
  if (!xs.length) return ''
  let t = xs.join('\n\n')
  if (t.length > max) t = `${t.slice(0, max)}\n[… recortado]`
  return `# LO QUE LA MESA YA TIENE PARA CADA APARTADO (lo trabajó el Estado Mayor: redactá SOBRE esto, mejoralo y completalo; no lo contradigas)\n\n${t}`
}
const memo = new WeakMap()
// La ayuda de la IA con lo de la Mesa (la lee el compilado al armar el pedido: `ayudaIA` de la hoja).
export function ayudaIAConMesa(calco, aux = {}) {
  if (!esObj(calco)) return AYUDA_IA
  if (memo.has(calco)) return memo.get(calco)
  let b = ''
  try {
    b = bloqueMesa(calco, { ...aux, viejo: typeof aux.viejo === 'function' ? aux.viejo() : aux.viejo })
  } catch {
    b = ''
  }
  const r = b ? `${AYUDA_IA}\n\n${b}` : AYUDA_IA
  memo.set(calco, r)
  return r
}
