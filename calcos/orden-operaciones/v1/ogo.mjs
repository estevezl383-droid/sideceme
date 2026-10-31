// 📜 LA ORDEN GENERAL DE OPERACIONES (F7·P1 del G-3) con la forma del TEXTO PMTD 2017, Parte Primera, Capítulo VII
// «Elaboración de planes y órdenes», y con TODO lo que trabajó el Estado Mayor en la Mesa.
//
// Lo pidió Sergio el 30-10-2026 con el Word que bajó de la F7·P1 del CE-I (AO LAUCA), dos órdenes de ejemplo (la OGO
// No. 01/21 del CE-I «KILÓMETRO 7» y la Orden de Operaciones 05/24 del RI-20) y el texto del PMTD: «la Mesa y toda la
// información que se generó ya es completa: están los cursos de acción enemigos, los propios, las tareas y propósitos…
// la IA debería integrar TODA la información que generó la aplicación manteniendo el formato del PMTD… quiero una buena
// orden de operaciones, muy completa, clara y que tenga todos los elementos. Es en esto en lo que desemboca todo el
// ejercicio».
//
// Qué estaba mal (index-guardar-ia-20261029.js):
//   · la hoja era un formulario plano de 32 casillas («A.1 Maniobra», «A.2.b Apoyo de artillería…»); el Word militar le
//     ponía su numeración ENCIMA de la de las casillas («III. I.- SITUACIÓN», «E. 2.b Apoyo de artillería») y dejaba
//     afuera lo vacío: salió sin IV.- APOYO DE SERVICIO ni V.- COMANDO Y COMUNICACIONES;
//   · 🌱 escribía cuentas, no una orden: «Agrupación (OD): Atacar con Fuego.», «Medios disponibles: RES (alcance 23 km)»,
//     «18 límite(s), 15 punto(s) de coordinación…», «Plan de barreras: 13 trabajo(s), 479 h…»;
//   · el pedido a la IA no le daba la doctrina del Capítulo VII (cómo se redactan la misión, la intención, el concepto,
//     la maniobra por fases y las tareas), ni el CAP aprobado fase por fase con la tarea y el propósito de cada unidad,
//     ni el CAE del G-2; y el encabezado común le decía «NO escribas… la Orden de Operaciones».
//
// Ahora la F7·P1 es un DOCUMENTO del motor del Estado Mayor (estado-mayor/v8, campos/g3.js) y este módulo es todo lo
// suyo, sin DOM (se prueba en Node: calcos/pruebas/orden-operaciones.mjs):
//   · DEF: la forma del modelo del Capítulo VII apartado por apartado, con la instrucción LITERAL del PMTD;
//   · desdeHojaVieja: lo que ya estaba escrito en la hoja vieja pasa a su apartado (sin las cuentas del 🌱 viejo);
//   · propuestas (🌱): la Orden superior, el CAE del G-2 (PICB), la misión aprobada, la intención y los RCIC del
//     Comandante, el CAP aprobado con sus fases de la carta y la tarea y el propósito de cada unidad, la organización de
//     la tarea, los fuegos, las barreras, el reconocimiento, la matriz de riesgo, los eventos y lo de los anexos del G-1,
//     G-4 y G-5;
//   · DOCTRINA y EJEMPLO: el Capítulo VII y cómo se redacta cada párrafo, con los ejemplos del PMTD y de la OGO del CE-I
//     «KILÓMETRO 7» (como forma y nivel de detalle: no para copiar);
//   · especificacion: el Word con la numeración del PMTD (I.- A.- 1.- a.- 1) a)), la Organización de la Tarea en cuadro,
//     las fases como subtítulos y las tareas de cada unidad como incisos.
//
// El mismo día Sergio volvió con el Word que le dio la Orden ya hecha y el TEXTO PMTD 2017: «los párrafos, la estructura
// está bien, pero el contenido…». Cada párrafo va ahora con la FORMA del PMTD, en 🌱 y en lo que se le pide a la IA:
//   · la MISIÓN, una oración con QUIÉN, QUÉ, CUÁNDO, DÓNDE y PROPÓSITO en ese orden (paso 11 del Análisis de la Misión);
//   · la INTENCIÓN en prosa y sin rótulos: «Mi intención es…, para esto es clave… Al finalizar la operación, (propia
//     fuerza), (enemigo), (operación futura).» (la Hoja de trabajo de la Intención del Comandante);
//   · el CONCEPTO como el enunciado del CAP de la Div-2: «Vamos a cumplir la misión mediante… El punto decisivo es…», una
//     oración por unidad («Una División Mecanizada (OD y esfuerzo principal) defiende…, con el propósito de…»), la reserva,
//     el propósito de los fuegos, de la defensa antiaérea y de los ingenieros, el sostenimiento, las fases y el estado final;
//   · la MANIOBRA fase por fase con la designación de cada unidad; fuegos, inteligencia, ingenieros y defensa antiaérea con
//     la forma de sus ejemplos; el riesgo al final;
//   · las TAREAS fase por fase y, en cada fase, TODAS las unidades con «TAREA:» y «PROPÓSITO:»;
//   · los RCIC: los que ya determinó cada sección (la F2·P8 del G-1, G-3, G-4, G-5 y EME, el Plan de búsqueda del G-2),
//     primero los que priorizó el Comandante.
import { limpio, texto, sinMarcaIA, articuloDe } from '../../riesgo/v1/modelo.js'
import { describirFases } from '../../cap-propios/v1/texto-carta.mjs'
import { capAprobado } from '../../orden-preparatoria/v1/prep.mjs'
import { textoOrden as textoReconocimiento } from '../../reconocimiento/v1/modelo.js'
import { mismaUnidad } from '../../disgregar/v1/disgregar.mjs'

export const ESQUEMA = 'ogo-v1'
export const TITULO = 'ORDEN GENERAL DE OPERACIONES'
export const FUENTE = 'TEXTO PMTD 2017, Parte Primera, Capítulo VII «Elaboración de planes y órdenes» — formato de la Orden de Operaciones'
export const PENDIENTE = '[Pendiente de elaboración]'

// ─── Ayudantes de texto ─────────────────────────────────────────────────────────────────────────────────────────
const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const norm = (s) => sinTildes(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const MARCAS = /\s*[[(]\s*(?:IA|Mesa)\s*[—–-]+\s*verificar\s*[\])]\s*/gi
const MARCA_CARTA = /—\s*Según (?:la carta|el calco)[^\n:]*:\s*/gi
// Un texto de las hojas, sin las marcas de la IA ni «Según la carta…», con sus renglones.
const txt = (s) => texto(sinMarcaIA(String(s ?? '').replace(MARCAS, ' ').replace(MARCA_CARTA, '')))
// En un renglón.
const plano = (s) => limpio(txt(s).replace(/\s*\n\s*/g, ' '))
const vacio = (s) => !plano(s)
const punto = (s) => (s && !/[.:;!?…]$/.test(s) ? `${s}.` : s)
const sinPunto = (s) => String(s || '').replace(/[.;:\s]+$/, '')
const minus = (s) => String(s || '').replace(/^\p{Lu}(?!\p{Lu})/u, (c) => c.toLowerCase())
const mayus = (s) => String(s || '').replace(/^\p{Ll}/u, (c) => c.toUpperCase())
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const romano = (n) => ROMANOS[n - 1] || String(n)
const unicos = (xs) => [...new Set(xs.filter(Boolean))]
const lineas = (s) => txt(s).split('\n').map((l) => l.trim()).filter(Boolean)
const listaY = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)

// El valor de la casilla cuyo rótulo EMPIEZA con alguna de las claves (sin tildes ni mayúsculas).
export function casilla(obj, ...claves) {
  if (!esObj(obj)) return ''
  for (const k of claves) {
    const hit = Object.keys(obj).find((x) => !x.startsWith('_') && norm(x).startsWith(norm(k)))
    if (hit && !vacio(obj[hit])) return txt(obj[hit])
  }
  return ''
}
const filasDe = (x) => (Array.isArray(x) ? x.filter((f) => esObj(f) && Object.entries(f).some(([k, v]) => !k.startsWith('_') && !vacio(v))) : [])
const camposDoc = (v) => (esObj(v?.campos) ? v.campos : {})

// Lo que las hojas de la Mesa escriben solas cuando siembran (cuentas del calco, no órdenes): no pasa a la Orden.
const CUENTAS = [
  /\d+\s+l[ií]mite\(s\),\s*\d+\s+punto\(s\) de coordinaci[oó]n[^.]*\./gi,
  /\d+\s+obst[aá]culo\(s\) y \d+ posici[oó]n\(es\)[^.]*\./gi,
  /Plan de barreras:\s*\d+\s+trabajo\(s\)[^.]*\.(\s*Al enemigo[^.]*\.)?(\s*Prioridad de esfuerzo:[^.]*\.)?/gi,
  /\d+\s+trabajo\(s\)( de ingenier[ií]a)?[:,][^.]*\.(\s*Al enemigo deber[ií]a costarle[^.]*\.)?/gi,
  /Medios disponibles:[^.]*\(alcance[^)]*\)[^.]*\./gi,
  /Piezas en el calco:[^.]*\.(\s*Definir las medidas permisivas y restrictivas\.)?/gi,
  /\d+\s+fase\(s\) del COA propio cargadas en el calco[^.]*\./gi,
  /La operaci[oó]n se ejecuta en \d+ fase\(s\), seg[uú]n el curso de acci[oó]n propio cargado en el calco\./gi,
  /(Dentro del )?[ÁA]rea de Operaciones asignada \((ver )?calco\)\./gi,
  /\(tarea t[aá]ctica trazada en el calco\)/gi,
  /Se planifica contra el CAE m[aá]s probable[^—]*—\s*PICB del G-2\./gi,
  /[ÓO]rganos:[^.]*\.\s*Ver el Plan de Reconocimiento \(F2·P9\)\./gi,
  /Recursos:[^.]*\.\s*Ver Plan de Reconocimiento \(F2·P9\)\./gi,
  /Prioridad de trabajo: plan de barreras \([^)]*\)\./gi,
  /\d+\s+terreno\(s\) clave marcados por el G-2 en el CMOC\./gi,
  /\d+\s+pieza\(s\)/gi,
  /\s*\(\d+ en la carta\)/gi,
]
// «en -18.5347, -68.7610» → «en Coord. 18°32'05"S 68°45'40"O» (como las escribe la Mesa): en una Orden no van decimales.
const gms = (v, pos, neg) => {
  const r = Math.round(Math.abs(v) * 3600)
  return `${Math.floor(r / 3600)}°${String(Math.floor((r % 3600) / 60)).padStart(2, '0')}'${String(r % 60).padStart(2, '0')}"${v >= 0 ? pos : neg}`
}
export const conCoordenadas = (t) => String(t ?? '').replace(/(?<![\d.°'"])(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})(?!\d|\.\d)/g, (m, la, lo) => `Coord. ${gms(+la, 'N', 'S')} ${gms(+lo, 'E', 'O')}`)
export function sinCuentas(s) {
  let t = txt(s)
  for (const re of CUENTAS) t = t.replace(re, ' ')
  return texto(t.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n')).replace(/^[\s.;,·—-]+$/gm, '').trim()
}

// ─── LA FORMA DEL DOCUMENTO ─────────────────────────────────────────────────────────────────────────────────────
// El modelo del Capítulo VII, apartado por apartado y en orden. Las instrucciones van LITERALES en `ayuda` (así las ven
// el oficial y la IA). Dentro de un apartado, los subapartados se escriben «1.- …», «a.- …», «1) …» y las fases
// «FASE I (…) desde … hasta …»: el Word los numera (estructurar).
const AY = {
  orgTarea: 'Describa la disposición de las fuerzas para apoyar el concepto de la operación. Si es larga o complicada la organización se puede hacer referencia a un anexo. Una agrupación por renglón: «DIV MEC-2 (OD): BIMEC-I, BIMEC-II, GAC-2» y, al final, «BAJO CONTROL: GALM-1, BAT AA-2…» (las que quedan a órdenes directas)',
  situacion: 'Información relativa a la situación general considerada esencial para que los comandantes subordinados comprendan la situación actual: una enunciación concisa y general de lo que está haciendo la amenaza o preparándose para hacer y de lo que están haciendo las Unidades amigas (opcional: el panorama general, antes de A.-)',
  enemigo: 'Exprese la información en términos de dos escalones enemigos por debajo del suyo (la División hace alusión a las compañías y los Batallones a secciones). Composición, dispositivo, efectivos, medios y capacidades; puede hacer referencia al Anexo de Inteligencia',
  caeProbable: 'Descripción concisa de las acciones más probables de la amenaza, de principio a fin y desde su punto de vista: la tarea y el propósito de cada uno de sus principales elementos y cómo serán empleados frente a sus fuerzas, cómo empleará sus armas de apoyo, sus objetivos y su estado final deseado. Es la transcripción del que elaboró el G-2 en la PICB',
  caePeligroso: 'Lo que la amenaza es capaz de hacer que puede amenazar el éxito del curso de acción propio; dentro de su capacidad y de su doctrina. El mismo nivel de detalle que el más probable',
  propias: 'Considere la misión, la intención del Comandante y el concepto de la operación de dos escalones superiores. Los subpárrafos indican las misiones de las Unidades en los flancos y otras Unidades cuyas acciones tienen un efecto significativo en el comando de la Unidad («1.- FF.TT.T.O.» con «a.- Misión: …», «b.- Intención: …», «c.- Concepto: …»; «2.- Unidades adyacentes: …»)',
  refuerzos: 'Generalmente, la organización de la tarea se cubre en el Anexo “A” (Organización de la Tarea) en lo que respecta a las órdenes de operaciones de División y Cuerpo de Ejército. Si el Anexo “A” no se incluye con la orden, la información respecto a las Unidades en refuerzo o reducidas se incluye en este subpárrafo, indicando el lugar, fecha y hora en que la reducción o refuerzo cobra vigencia («Omitido.» si no hay)',
  mision: 'Es la transcripción de la misión aprobada por el Comandante al finalizar el Análisis de la Misión: UNA oración con todos sus elementos y EN ESTE ORDEN: QUIÉN (la Unidad que ejecuta la operación), QUÉ (el tipo de operación —ataca, defiende— y la tarea esencial, expresada como tarea táctica: destruye, fija, canaliza, bloquea…), CUÁNDO (a partir del D (hora) hasta el D+n (hora), con orden…), DÓNDE (AO, objetivos, coordenadas) y el PROPÓSITO («con el propósito de…»). Sin agregados («reteniendo…», «sin permitir…»). Ej. del PMTD: «La Div-2, defiende y destruye al batallón de tanques a partir del D(0600) hasta D+6 (1800) al sud de la LF. ÁGUILA con el propósito de permitir a la DBL-22 ejecutar el contraataque y destruir al Regimiento de tanques de Rojo en el AE. LEÓN.»',
  intencion: 'Va inmediatamente antes del párrafo III.- A.-, redactada en forma inextensa (sin rótulos «Propósito:», «Tareas clave:» ni numeración) con sus tres partes: el PROPÓSITO («Mi intención es…»), las TAREAS CLAVE y/o condiciones («…, para esto es clave inicialmente…, asimismo es importante…») y, en otro párrafo, el ESTADO FINAL: cómo queda la propia fuerza, cómo queda el enemigo y la operación futura («Al finalizar la operación, la FT “LANZA” se encontrará ocupando posiciones en…, con eficiencia combativa, el RIMEC-6 habrá sido destruido…, encontrándose nuestra Unidad en condiciones de realizar operaciones ofensivas con orden.»). Es el nexo entre la misión y el concepto: no entra en el «cómo»',
  concepto: 'Cómo el Comandante visualiza las acciones de las Unidades subordinadas: expande el curso de acción aprobado. Como en el PMTD, un renglón por idea: «Vamos a cumplir la misión mediante (forma de maniobra / forma defensiva). El punto decisivo es … porque …»; una oración por Unidad con su tarea y su propósito: «Una Fuerza de Tarea fuerte en Infantería (OD y esfuerzo principal) defiende y bloquea al…, con el propósito de…», «Una … (OC1 y esfuerzo secundario)…», la reserva («… constituye la reserva, encontrándose en condiciones de ser empleada con orden, con prioridad de planeamiento a la OD y posteriormente a OC1 y OC2»); «El propósito del apoyo de fuegos es…», «La prioridad de esfuerzo de ingeniería será…, la prioridad de trabajo será para la Unidad que lleve la OD», «El Batallón Logístico (operación de sostenimiento) tiene la tarea de…, con el propósito de…»; «La operación se desarrollará en las siguientes fases:» (una por renglón: «FASE I: OCUPACIÓN Y ORGANIZACIÓN DE LA PD (desde … hasta …).») y el estado final («Al finalizar la operación…»)',
  maniobra: 'El esquema de maniobra, consistente con el calco: la operación decisiva y las de configuración, las operaciones de seguridad y el uso de la reserva. FASE POR FASE («FASE I: NOMBRE (desde … hasta …).») y, debajo, una oración por Unidad con su designación: «La Fuerza de Tarea VARGAS (OD y esfuerzo principal) defiende y bloquea al BIM (OD) de la DIMEC-56, con el propósito de evitar la conquista de Co. TUNARI.»; la reserva: «La FT LANDA (OC3) constituye la reserva, encontrándose en condiciones de ser empleada con orden, con prioridad de planeamiento a la OD y posteriormente a OC1 y OC2.». Al final, el riesgo: «Se asume como riesgo…» y cómo se mitiga',
  fuegos: 'La intención del Comandante respecto a los fuegos, en sus cuatro elementos y en un párrafo, como en el PMTD: «Los medios de apoyo de fuegos tienen la tarea de (destruir / neutralizar / suprimir) a … (una formación o función enemiga), con el propósito de …, el método: la prioridad de apoyo de fuegos a … (por fase), se asignan los blancos …, restricciones: …, el efecto será … (cuantificado y observable)»',
  apoyoAereo: 'La asignación de los vuelos de Apoyo Aéreo Cercano (AAC), de interdicción aérea (Cuerpo de Ejército) y las designaciones (División): prioridad y misiones por unidad',
  artilleria: 'Las prioridades (contrabatería, interdicción), la prioridad de fuego por fase, la prioridad para la adquisición de blancos, las restricciones y la Organización de la Artillería para el Combate (OAPC: «RAM-4 : AG CE-I»)',
  mcaf: 'Las medidas permisivas (LCAF, LSAA, AFL) y las restrictivas (AFP, AFR, LRF), con su ubicación y desde cuándo rigen',
  reconocimiento: 'El punto focal del esfuerzo de recopilación de inteligencia y cómo complementa el plan de maniobra: los recursos de inteligencia a emplear y las áreas de interés nombradas (A.I.N.); puede remitir a la Matriz de Eventos o de Reconocimiento y Vigilancia',
  inteligencia: 'El concepto del sistema de inteligencia, como en el PMTD: «El enfoque de recopilación de inteligencia está dirigido a … La prioridad de apoyo a la … (OD). Los recursos son …». La prioridad del esfuerzo entre el desarrollo de la situación, la búsqueda de blancos y la evaluación de daños de combate, y la de contrainteligencia. Remite al Anexo de Inteligencia',
  ingenieros: 'Como en el PMTD: «La prioridad de esfuerzo es de (movilidad / contramovilidad / supervivencia) mediante …, la prioridad de trabajo a la … (OD) y posteriormente a …». El propósito de los obstáculos y las restricciones o la delegación de autoridad para emplazarlos',
  antiaerea: 'Como en el PMTD: «La tarea de los medios de ADA es …, con el propósito de …, la prioridad de apoyo a la … (OD)». El apoyo de la Fuerza Aérea y los niveles de alerta (ROJA: ataque inminente; AMARILLA: ataque probable; VERDE: ataque improbable)',
  qbn: 'El concepto general de las operaciones QBN y las prioridades de esfuerzo y de apoyo («Omitido.» si no corresponde)',
  policiaMilitar: 'El concepto general de las operaciones de la Policía Militar en apoyo de la maniobra: prioridades, control de circulación y seguridad del área de retaguardia',
  acgm: 'El concepto general de las operaciones de AC/GM y las prioridades de esfuerzo y de apoyo (evacuación de civiles, ejes humanitarios, bienes protegidos); remite al Anexo de AC/GM',
  tareasManiobra: 'Mediante la emisión de órdenes y FASE POR FASE: «FASE I: NOMBRE (desde … hasta …).» y debajo TODAS las Unidades de maniobra que dependen directamente, incluida la reserva, en el orden de la organización de la tarea, cada una con su TAREA y su PROPÓSITO: «1.- FT VARGAS (OD).», «TAREA: Se desplaza a la PD.», «PROPÓSITO: Ocupar la PD.». Pasaje de líneas y puntos de enlace, puntos de contacto, misiones «en condiciones de…», coordinación de los flancos, evacuación de refugiados',
  tareasApoyo: 'Como las de maniobra, FASE POR FASE: cada Unidad de apoyo de combate (artillería, ingeniería, antiaérea, comunicaciones, inteligencia, policía militar…), en el orden de la organización de la tarea, con su «TAREA: …» y su «PROPÓSITO: …»',
  vigencia: 'Hora o condición cuando un plan o una orden entra en vigor; el día D y la hora H',
  rpi: 'Los Requerimientos Prioritarios de Inteligencia que ya determinó cada sección del Estado Mayor (y priorizó el Comandante): preguntas sobre el enemigo, el terreno, las condiciones meteorológicas y las CC.MM., una por renglón («1) ¿Por dónde lleva el enemigo su esfuerzo principal?»). Los RCIC van SOLAMENTE acá (no en los anexos)',
  rifa: 'Los Requerimientos de Información de la Fuerza Amiga que ya determinó cada sección: sobre las PROPIAS FUERZAS, uno por renglón («1) Informar cuando…»)',
  eeia: 'Los Elementos Esenciales de Información Amiga: lo que hay que negarle al enemigo (opcional)',
  riesgos: 'Las medidas de control para la reducción de riesgos, producto del proceso de administración de riesgos (Matriz de riesgo), una por renglón',
  reglas: 'Las reglas de enfrentamiento (DICA, población civil, prisioneros de guerra, armas restringidas)',
  ambiente: 'Las consideraciones ambientales (agua, flora, fauna, contaminación)',
  proteccion: 'Las medidas de protección de la fuerza (estado de alerta de defensa antiaérea, control de armas, seguridad de PC e instalaciones, contrainteligencia)',
  adicionales: 'Las instrucciones que afectan a dos o más Unidades: horarios, puntos de contacto y de enlace, coordinación entre adyacentes, puntos de decisión, movimientos, contraataques',
  limiteAvance: 'La línea avanzada de las tropas o el límite de avance para el reconocimiento, por unidad',
  mcafVigentes: 'Las medidas de control de coordinación de apoyo de fuegos vigentes y desde cuándo (puede remitir a III.- A.- 2.- c.- y al Anexo de Apoyo de Fuegos)',
  ensayo: 'Cuándo y dónde se lleva a cabo el ensayo, de qué tipo y quiénes participan',
  amenazaRetaguardia: 'El nivel de amenaza actual en el área de retaguardia (Nivel I, II o III), por fase si cambia',
  restricciones: 'Restricciones y definiciones no cubiertas en los párrafos anteriores',
  servicio: 'Haga referencia de ser necesario, al anexo “Plan de Apoyo de Servicio de Combate” si es un Plan de Operaciones, o al Anexo “Apoyo de Servicio de Combate” si es una Orden de Operaciones. Al margen de hacer referencia a los anexos podrá incluir los subpárrafos siguientes',
  conceptoApoyo: 'Describir el concepto de apoyo logístico en apoyo de la intención del Comandante y del concepto de operaciones del Plan u Orden de Operaciones. Establezca el enfoque de apoyo logístico y la prioridad de apoyo a las Unidades dependientes para cada fase de la operación',
  logistica: 'Abastecimiento (clases y puntos de distribución), mantenimiento, evacuación y hospitalización, transporte, ejes de abastecimiento y de evacuación (EPA / EPE) y las instalaciones logísticas',
  personal: 'Mantenimiento de efectivos (bajas previstas y reemplazos, con la prioridad), prisioneros de guerra (cadena y puesto de reunión), moral, disciplina y servicios de personal',
  asuntosCiviles: 'Evacuación de la población civil, ejes humanitarios, puestos de reunión de evacuados, recursos locales y bienes protegidos',
  comando: 'Haga referencia al Anexo de Comunicaciones',
  sucesion: 'Designe la sucesión de mando (en orden)',
  puestosComando: 'Describa los puestos de comando y otras instalaciones de C2, y sus ubicaciones (PCP, PCA, PCR: lugar y coordenadas)',
  ioc: 'Indique la edición de las Instrucciones Operativas de Comunicación (IOC.) que está en vigencia (y desde cuándo); los centros de comunicaciones',
  prioridadCom: 'Describa la prioridad de las comunicaciones para las Unidades por eventos (o por fase)',
}
const hoja = (id, t, extra = {}) => ({ id, t, ayuda: AY[id] || '', ...extra })

export const DEF = {
  esquema: ESQUEMA,
  titulo: TITULO,
  archivo: 'Orden_General_de_Operaciones',
  plantilla: 'orden-operaciones',
  fuente: 'modelo de Orden de Operaciones del TEXTO PMTD 2017 (Capítulo VII)',
  modelo: 'Orden General de Operaciones — TEXTO PMTD 2017, Parte Primera, Capítulo VII, con el formato militar común de la Mesa',
  nivel: 'principal',
  preliminares: [
    { id: 'objeto', t: 'OBJETO', ayuda: 'La unidad y la operación, en una línea: «El CE-I en la defensa de área.»' },
    { id: 'cartas', t: 'CARTAS', ayuda: 'Nombre, escala y edición de la(s) carta(s)' },
    { id: 'anexos', t: 'ANEXOS', ayuda: 'Uno por renglón, con su letra, en el orden en que la Orden los menciona: «“A” Calco de Operaciones.», «“B” Inteligencia.»…' },
  ],
  arbol: [
    hoja('orgTarea', 'ORGANIZACIÓN DE LA TAREA.', { sinNumero: true }),
    hoja('situacion', 'SITUACIÓN.', {
      hijos: [
        hoja('enemigo', 'Fuerzas enemigas.', { hijos: [hoja('caeProbable', 'Curso de acción del enemigo más probable.'), hoja('caePeligroso', 'Curso de acción del enemigo más peligroso.')] }),
        hoja('propias', 'Fuerzas propias.'),
        hoja('refuerzos', 'Refuerzos y reducciones.'),
        // sin «D.- Hipótesis»: es una ORDEN de operaciones (las hipótesis son sólo del PLAN)
      ],
    }),
    hoja('mision', 'MISIÓN.'),
    {
      t: 'EJECUCIÓN.',
      hijos: [
        hoja('intencion', 'Intención del Comandante.', { sinNumero: true }),
        hoja('concepto', 'Concepto de la operación.', {
          hijos: [
            hoja('maniobra', 'Maniobra.'),
            hoja('fuegos', 'Apoyo de fuegos.', {
              hijos: [hoja('apoyoAereo', 'Apoyo aéreo.'), hoja('artilleria', 'Apoyo de artillería de campaña.'), hoja('mcaf', 'Medidas de coordinación de apoyo de fuegos.')],
            }),
            hoja('reconocimiento', 'Reconocimiento y vigilancia.'),
            hoja('inteligencia', 'Inteligencia.'),
            hoja('ingenieros', 'Ingenieros.'),
            hoja('antiaerea', 'Defensa antiaérea.'),
            hoja('qbn', 'Operaciones QBN.'),
            hoja('policiaMilitar', 'Operaciones de la Policía Militar.'),
            hoja('acgm', 'Operaciones de AC/GM.'),
          ],
        }),
        hoja('tareasManiobra', 'Tareas de las unidades de maniobra.'),
        hoja('tareasApoyo', 'Tareas de las unidades de apoyo de combate.'),
        {
          t: 'Instrucciones de coordinación.',
          hijos: [
            hoja('vigencia', 'Hora o condición de entrada en vigor.'),
            { t: 'Información esencial requerida por el Comandante (RCIC).', hijos: [hoja('rpi', 'Requerimientos prioritarios de inteligencia (RPI).'), hoja('rifa', 'Requerimientos de información de la fuerza amiga (RIFA).'), hoja('eeia', 'Elementos esenciales de información amiga (EEIA).', { soloConTexto: true })] },
            hoja('riesgos', 'Medidas de control para la reducción de riesgos.'),
            hoja('reglas', 'Reglas de enfrentamiento.'),
            hoja('ambiente', 'Consideraciones ambientales.'),
            hoja('proteccion', 'Protección de la fuerza.'),
            hoja('adicionales', 'Instrucciones de coordinación adicionales.'),
            hoja('limiteAvance', 'Línea avanzada de las tropas o límite de avance para el reconocimiento.'),
            hoja('mcafVigentes', 'Medidas de control de coordinación de apoyo de fuegos.'),
            hoja('ensayo', 'Ensayo.'),
            hoja('amenazaRetaguardia', 'Nivel de amenaza en el área de retaguardia.'),
            hoja('restricciones', 'Restricciones y definiciones no cubiertas en los párrafos anteriores.'),
          ],
        },
      ],
    },
    hoja('servicio', 'APOYO DE SERVICIO.', {
      hijos: [hoja('conceptoApoyo', 'Concepto de apoyo.'), hoja('logistica', 'Logística.'), hoja('personal', 'Personal.'), hoja('asuntosCiviles', 'Asuntos civiles y gobierno militar.')],
    }),
    hoja('comando', 'COMANDO Y COMUNICACIONES.', {
      hijos: [
        { t: 'Comando.', hijos: [hoja('sucesion', 'Sucesión de mando.'), hoja('puestosComando', 'Puestos comando e instalaciones de C2.')] },
        { t: 'Comunicaciones.', hijos: [hoja('ioc', 'Instrucciones operativas de comunicaciones (IOC).'), hoja('prioridadCom', 'Prioridad de las comunicaciones.')] },
      ],
    }),
  ],
  obligatorios: [
    { id: 'mision', txt: 'II.- Falta la MISIÓN (quién, qué, cuándo, dónde y propósito, en ese orden): es la misión aprobada de la F2·P12.', tipo: 'err' },
    { id: 'intencion', txt: 'III.- Falta la INTENCIÓN DEL COMANDANTE («Mi intención es…»: propósito, tareas clave y estado final).', tipo: 'err' },
    { id: 'concepto', txt: 'III.- A.- Falta el CONCEPTO DE LA OPERACIÓN (forma de maniobra, punto decisivo, la tarea y el propósito de cada Unidad, fuegos, ingenieros, sostenimiento, fases y estado final).', tipo: 'err' },
    { id: 'maniobra', txt: 'III.- A.- 1.- Falta la MANIOBRA fase por fase, con la tarea y el propósito de cada unidad.', tipo: 'err' },
    { id: 'tareasManiobra', txt: 'III.- B.- Faltan las TAREAS DE LAS UNIDADES DE MANIOBRA (fase por fase, todas las Unidades con la reserva, cada una con TAREA y PROPÓSITO).', tipo: 'err' },
    { id: 'orgTarea', txt: 'Falta la ORGANIZACIÓN DE LA TAREA (las agrupaciones y lo que queda bajo control).' },
    { id: 'enemigo', txt: 'I.- A.- Faltan las FUERZAS ENEMIGAS (dos escalones abajo).' },
    { id: 'caeProbable', txt: 'I.- A.- 1.- Falta el CURSO DE ACCIÓN DEL ENEMIGO MÁS PROBABLE (el del G-2).' },
    { id: 'caePeligroso', txt: 'I.- A.- 2.- Falta el CURSO DE ACCIÓN DEL ENEMIGO MÁS PELIGROSO (el del G-2).' },
    { id: 'propias', txt: 'I.- B.- Faltan las FUERZAS PROPIAS (misión, intención y concepto de dos escalones arriba; las adyacentes).' },
    { id: 'fuegos', txt: 'III.- A.- 2.- Falta el APOYO DE FUEGOS (tarea, propósito, método y efecto).' },
    { id: 'ingenieros', txt: 'III.- A.- 5.- Faltan los INGENIEROS (propósito, prioridad de esfuerzo y de trabajo).' },
    { id: 'tareasApoyo', txt: 'III.- C.- Faltan las TAREAS DE LAS UNIDADES DE APOYO DE COMBATE.' },
    { id: 'vigencia', txt: 'III.- D.- 1.- Falta la hora o condición de entrada en vigor (día D, hora H).' },
    { id: 'rpi', txt: 'III.- D.- 2.- Faltan los RCIC (RPI): los que determinó cada sección del Estado Mayor.' },
    { id: 'conceptoApoyo', txt: 'IV.- A.- Falta el CONCEPTO DE APOYO (enfoque y prioridad por fase).' },
    { id: 'puestosComando', txt: 'V.- A.- 2.- Faltan los PUESTOS COMANDO con sus ubicaciones.' },
    { id: 'ioc', txt: 'V.- B.- 1.- Faltan las IOC en vigencia.' },
  ],
}

// Los ids de los campos, en el orden del documento (preliminares primero).
export function idsDe(def = DEF) {
  const out = (def.preliminares || []).map((p) => p.id)
  const rec = (ns) => {
    for (const n of ns || []) {
      if (n.id) out.push(n.id)
      if (n.hijos) rec(n.hijos)
    }
  }
  rec(def.arbol)
  return out
}

// ♻️ Los apartados que se rehacen con la forma del PMTD en una Orden que ya estaba escrita con otra (30-10-2026).
export const REHACER = ['mision', 'intencion', 'concepto', 'maniobra', 'fuegos', 'reconocimiento', 'inteligencia', 'ingenieros', 'antiaerea', 'tareasManiobra', 'tareasApoyo', 'rpi', 'rifa', 'eeia', 'conceptoApoyo']

// La Orden es larga: si la IA corta respuestas largas, se le pide por partes (el oficial elige cuál en la hoja).
export const PARTES = [
  { id: 'todo', nom: 'Toda la Orden', ayuda: 'Todos los apartados en un solo pedido (Claude o Gemini, o ChatGPT con un plan pago).' },
  { id: 'situacion', nom: 'I-II', ayuda: 'OBJETO, CARTAS, ANEXOS, Organización de la tarea, I.- SITUACIÓN y II.- MISIÓN.', campos: ['objeto', 'cartas', 'anexos', 'orgTarea', 'situacion', 'enemigo', 'caeProbable', 'caePeligroso', 'propias', 'refuerzos', 'mision'] },
  { id: 'concepto', nom: 'III concepto', ayuda: 'III.- Intención, A.- Concepto de la operación: maniobra fase por fase, fuegos, reconocimiento, inteligencia, ingenieros, antiaérea, QBN, PM y AC/GM.', campos: ['intencion', 'concepto', 'maniobra', 'fuegos', 'apoyoAereo', 'artilleria', 'mcaf', 'reconocimiento', 'inteligencia', 'ingenieros', 'antiaerea', 'qbn', 'policiaMilitar', 'acgm'] },
  { id: 'tareas', nom: 'III tareas', ayuda: 'III.- B.- y C.- Tareas de las unidades de maniobra y de apoyo de combate, y D.- Instrucciones de coordinación.', campos: ['tareasManiobra', 'tareasApoyo', 'vigencia', 'rpi', 'rifa', 'eeia', 'riesgos', 'reglas', 'ambiente', 'proteccion', 'adicionales', 'limiteAvance', 'mcafVigentes', 'ensayo', 'amenazaRetaguardia', 'restricciones'] },
  { id: 'servicio', nom: 'IV-V', ayuda: 'IV.- APOYO DE SERVICIO y V.- COMANDO Y COMUNICACIONES.', campos: ['servicio', 'conceptoApoyo', 'logistica', 'personal', 'asuntosCiviles', 'comando', 'sucesion', 'puestosComando', 'ioc', 'prioridadCom'] },
]

// ─── Una ORDEN de operaciones no lleva hipótesis ─────────────────────────────────────────────────────────────────
// Si la IA (o una hoja de antes) escribe igual «D.- Hipótesis.» con su texto, eso no queda en ningún apartado (el lector
// de documentos lo dejaba al final de «C.- Refuerzos y reducciones»): se corta desde ese título hasta el final.
const TITULO_HIPOTESIS = /^\s*(?:[A-Z]\s*\.-\s*|\d{1,2}\s*\.-\s*)?(?:Hip[oó]tesis|Suposiciones)\s*(?:[.:]|$)/i
export function sinHipotesis(t) {
  const ls = String(t ?? '').split('\n')
  const i = ls.findIndex((l) => TITULO_HIPOTESIS.test(l))
  return i < 0 ? String(t ?? '') : ls.slice(0, i).join('\n').trim()
}

// ─── Lo escrito en la hoja vieja (32 casillas planas) pasa a su apartado ───────────────────────────────────────
const VIEJAS = [
  ['OBJETO', 'objeto'],
  ['CARTA', 'cartas'],
  ['ANEXOS', 'anexos'],
  ['Organización de la tarea', 'orgTarea'],
  ['A. Fuerzas enemigas', 'enemigo'],
  ['A.1 Curso de acción más PROBABLE', 'caeProbable'],
  ['A.2 Curso de acción más PELIGROSO', 'caePeligroso'],
  ['B. Fuerzas propias', 'propias'],
  ['C. Refuerzos y reducciones', 'refuerzos'],
  ['D. Hipótesis (sólo en el PLAN de operaciones)', null], // una ORDEN no lleva hipótesis: lo escrito ahí no pasa
  ['Misión', 'mision'],
  ['Intención del Comandante', 'intencion'],
  ['A. Concepto de la operación', 'concepto'],
  ['A.1 Maniobra', 'maniobra'],
  ['A.2 Apoyo de fuegos', 'fuegos'],
  ['A.2.a Apoyo aéreo', 'apoyoAereo'],
  ['A.2.b Apoyo de artillería de campaña', 'artilleria'],
  ['A.2.c Medidas de coordinación de apoyo de fuegos', 'mcaf'],
  ['A.3 Reconocimiento y vigilancia', 'reconocimiento'],
  ['A.4 Inteligencia', 'inteligencia'],
  ['A.5 Ingenieros', 'ingenieros'],
  ['A.6 Defensa antiaérea', 'antiaerea'],
  ['A.7 Operaciones QBN', 'qbn'],
  ['A.8 Operaciones de Policía Militar', 'policiaMilitar'],
  ['A.9 Operaciones de AC/GM', 'acgm'],
  ['B. Tareas de las unidades de maniobra', 'tareasManiobra'],
  ['C. Tareas de las unidades de apoyo de combate', 'tareasApoyo'],
  ['D. Instrucciones de coordinación', 'adicionales'],
  ['A. Concepto de apoyo', 'conceptoApoyo'],
  ['B. Otros aspectos de apoyo de servicio', 'logistica'],
  ['A. Comando', 'puestosComando'],
  ['B. Comunicaciones', 'ioc'],
]
// Lo que escribía el 🌱 viejo (l3e, «opord»): cuentas, no una orden. No pasa.
const SEMILLA_VIEJA = {
  orgTarea: /^.+ — \d+ elemento\(s\)( de .*)?\.$/,
  maniobra: /^.{1,80} \([A-ZÁÉÍÓÚÑ0-9 -]*\): [^\n]*\.$/,
  tareasManiobra: /^.{1,80} \([A-ZÁÉÍÓÚÑ0-9 -]*\): [^\n]*\.$/,
  fuegos: /^Medios disponibles: .*\(alcance [^)]*\).*\.$/,
  artilleria: /^Medios disponibles: .*\(alcance [^)]*\).*\.$/,
  mcaf: /^\d+ límite\(s\), \d+ punto\(s\) de coordinación y \d+ punto\(s\) de pasaje en el calco\.$/,
  reconocimiento: /^Órganos: .*Ver el Plan de Reconocimiento \(F2·P9\)\.$/,
  ingenieros: /^Plan de barreras: \d+ trabajo\(s\), .* h de trabajo\..*$/,
  concepto: /^La operación se ejecuta en \d+ fase\(s\), según el curso de acción propio cargado en el calco\.$/,
}
const TIENE_MARCA = /[[(]\s*IA\s*[—–-]+\s*verificar\s*[\])]/i
export const esHojaVieja = (v) => esObj(v) && v.esquema !== ESQUEMA && VIEJAS.some(([k]) => typeof v[k] === 'string')
export function desdeHojaVieja(v) {
  if (!esObj(v) || v.esquema === ESQUEMA) return v
  const campos = {}
  const ia = []
  for (const [k, id] of VIEJAS) {
    const x = v[k]
    if (!id || typeof x !== 'string' || vacio(x)) continue
    const deIA = TIENE_MARCA.test(x)
    const ls = lineas(x)
    if (!deIA && SEMILLA_VIEJA[id] && ls.every((l) => SEMILLA_VIEJA[id].test(l))) continue
    let t = txt(x)
    if (id === 'puestosComando' && /sucesi[oó]n/i.test(t) && !/puesto/i.test(t)) {
      campos.sucesion = t
      if (deIA) ia.push('campo:sucesion')
      continue
    }
    campos[id] = campos[id] ? `${campos[id]}\n${t}` : t
    if (deIA) ia.push(`campo:${id}`)
  }
  return { esquema: ESQUEMA, numero: '', campos, ideas: '', firma: '', iaCampos: unicos(ia), _desdeHojaVieja: true }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// LO QUE YA ESTÁ EN EL EJERCICIO
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ctx (el del motor): { calco: { ops, unidades, fasesCOA, orgTarea, ordenSup, hojasG, g3, picb, conceptoApoyo,
// misionLog, bajasPorFase, evacuacion }, hojas (las del G-3), ordenSup, unidad, coordenada, SIDcarta() }.
const g3De = (ctx = {}) => (esObj(ctx.hojas) && Object.keys(ctx.hojas).length ? ctx.hojas : esObj(ctx.calco?.g3) ? ctx.calco.g3 : {})
const hojasDe = (ctx, g) => (esObj(ctx.calco?.hojasG?.[g]) ? ctx.calco.hojasG[g] : {})
const picbDe = (ctx = {}) => (esObj(ctx.calco?.picb) ? ctx.calco.picb : esObj(ctx.picb) ? ctx.picb : {})
const ordenDe = (ctx = {}) => (esObj(ctx.ordenSup) && Object.keys(ctx.ordenSup).length ? ctx.ordenSup : esObj(ctx.calco?.ordenSup) ? ctx.calco.ordenSup : {})
export const unidadDe = (ctx = {}) => limpio(ordenDe(ctx).unidadPropia || ctx.unidad || ordenDe(ctx).unidad || '')
const superiorDe = (ctx = {}) => limpio(ordenDe(ctx).escalonSuperior || ctx.unidadSuperior || '')
const fasesCOA = (ctx = {}) => (esObj(ctx.calco?.fasesCOA) ? ctx.calco.fasesCOA : esObj(ctx.fasesCOA) ? ctx.fasesCOA : {})
const cartaDe = (ctx = {}) => {
  try {
    const c = typeof ctx.SIDcarta === 'function' ? ctx.SIDcarta() : ctx.SIDcarta
    return esObj(c) ? c : {}
  } catch {
    return {}
  }
}
const articulo = (d) => (/^(CE\b|C\.?E\.?[- ]|CUERPO|EJ|R[A-Z]{0,3}[ .-]|REG|BAT|BI\b|B\.?I\.?[- ]|GA|G[A-Z]{1,3}[ .-]|GRUPO|ESC|DESTAC|EQUIPO|CIRT|CIE\b)/i.test(sinTildes(d)) && !/^BR|^BIM|^BIA/i.test(sinTildes(d)) ? 'El' : 'La')

// Las unidades del calco.
const esEnemiga = (u) => /enem|rojo|amenaza/i.test(String(u?.bando || ''))
const esUnidad = (u) => !!u && (u.tipo || 'unidad') === 'unidad'
const nombreDe = (u) => limpio(u?.designacion || u?.nombre || '')
// maniobra | apoyo (de combate) | servicio
export function claseDe(u) {
  const d = sinTildes(nombreDe(u)).toUpperCase()
  const a = norm(u?.arma)
  const s = norm(u?.simbolo)
  if (/\bLOG\b|LOG\.|LOGIST|SANID|INTEND|TRANSP|MANTEN|\bABAST/.test(d) || ['logistica', 'sanidad'].includes(a) || ['logistica', 'sanidad'].includes(s)) return 'servicio'
  if (/ARTILL|\bART\b|\bG\.?A\.?[A-Z]{0,3}[- ]?\d|\bGA[A-Z]{0,3}-|\bRA[A-Z]?-|LANZACOH|COHETE|MORT|\bAT\b|ANTITANQ/.test(d) || ['artilleria', 'lanzacohetes', 'morteros', 'antitanque'].includes(a) || ['artilleria', 'morteros', 'antitanque'].includes(s)) return 'apoyo'
  if (/INGEN|\bING\b|BATING|ZAPAD/.test(d) || a === 'ingenieria' || s === 'ingenieros') return 'apoyo'
  if (/ANTIAER|\bAA\b|\bA\.A\.|\bADA\b|\bRAA\b|BAT ?AA/.test(d) || ['antiaerea', 'ada'].includes(a) || ['ada', 'cab antiaerea'].includes(s)) return 'apoyo'
  if (/COMUNIC|\bCOM\b|BAT\.? ?COM|TELECOM|TRANSM/.test(d) || a === 'comunicaciones' || s === 'comunicaciones') return 'apoyo'
  if (/INTELIG|EXPLOR|\bCIE\b|\bCIRT\b|UAV|DRON|GUERRA ELECTR/.test(d) || a === 'inteligencia' || s === 'inteligencia') return 'apoyo'
  if (/POLIC|\bPM\b|\bRPM\b/.test(d) || ['policiamilitar', 'policia'].includes(a) || s === 'policia') return 'apoyo'
  if (/\bQBN\b|QUIMIC/.test(d)) return 'apoyo'
  if (/AVIAC|HELIC|\bHEL\b/.test(d) || a === 'aviacion') return 'apoyo'
  return 'maniobra'
}
// Las fichas GENÉRICAS del curso de acción («OD», «OC 1», «RES»…, las de la formación inicial de las fuerzas): no son
// unidades, son el lugar de la unidad que tiene ese rol.
const RE_GENERICA = /^(O\.?\s?D\.?|O\.?\s?C\.?\s*-?\s*\d{1,2}|RES(ERVA)?|SOST(ENIMIENTO)?|SEG(URIDAD)?)$/i
export const esGenerica = (nom) => RE_GENERICA.test(limpio(sinTildes(nom)))
function rolGenerico(nom) {
  const t = limpio(sinTildes(nom)).toUpperCase()
  if (/^O\.?\s?D/.test(t)) return 'OD'
  const m = t.match(/^O\.?\s?C\.?\s*-?\s*(\d{1,2})$/)
  if (m) return `OC-${m[1]}`
  return /^RES/.test(t) ? 'RESERVA' : /^SOST/.test(t) ? 'SOST' : ''
}
const todasLasFichas = (ctx = {}) => (Array.isArray(ctx.calco?.unidades) ? ctx.calco.unidades : Array.isArray(ctx.unidades) ? ctx.unidades : [])
// `dependeDe` es el id de la ficha madre (disgregar.mjs); en hojas viejas, su nombre. Sin madre en la carta: directa.
function madreDe(ctx, u) {
  const d = u?.dependeDe
  if (d == null || d === '') return null
  const todas = todasLasFichas(ctx)
  return todas.find((x) => x && x.id != null && x.id === d) || todas.find((x) => nombreDe(x) && mismaUnidad(nombreDe(x), String(d))) || null
}
const nombreMadre = (ctx, u) => nombreDe(madreDe(ctx, u) || {})
// Depende directamente de la unidad considerada (sin madre, o la madre es la unidad considerada o su PC).
export function directa(ctx, u) {
  const m = madreDe(ctx, u)
  if (!m) return true
  const u0 = unidadDe(ctx)
  return m.tipo === 'pc' || !!(u0 && mismaUnidad(nombreDe(m), u0))
}
export function unidadesPropias(ctx = {}) {
  const u = unidadDe(ctx)
  const todas = todasLasFichas(ctx).filter((x) => esUnidad(x) && !esEnemiga(x) && nombreDe(x) && !esGenerica(nombreDe(x)))
  const sinCG = todas.filter((x) => !(u && mismaUnidad(nombreDe(x), u)))
  const vistas = new Set()
  return sinCG.filter((x) => {
    const k = norm(nombreDe(x))
    if (vistas.has(k)) return false
    vistas.add(k)
    return true
  })
}
const ESCALON = { equipo: 'Equipo', escuadra: 'Escuadra', seccion: 'Sección', compania: 'Compañía', batallon: 'Batallón', regimiento: 'Regimiento', brigada: 'Brigada', division: 'División', cuerpo: 'Cuerpo de Ejército', ejercito: 'Ejército' }
export const enemigas = (ctx = {}) => (Array.isArray(ctx.calco?.unidades) ? ctx.calco.unidades : []).filter((x) => esUnidad(x) && esEnemiga(x) && nombreDe(x) && x.deFaseEnemiga == null)

// El rol de cada unidad (OD, OC-1… RESERVA): las agrupaciones de 🧩 Agrupar, la F4·P2 y lo que dice el concepto.
const OPERACION = { od: 'OD', oc1: 'OC-1', oc2: 'OC-2', oc3: 'OC-3', oc4: 'OC-4', oc5: 'OC-5', reserva: 'RESERVA', sost: 'SOST' }
const rolDeTexto = (s) => {
  const t = sinTildes(String(s || '')).toUpperCase()
  if (/\bRES(ERVA)?\b/.test(t)) return 'RESERVA'
  if (/\bO\.?\s?D\b|OPERACION DECISIVA|ESFUERZO PRINCIPAL/.test(t)) return 'OD'
  const m = t.match(/\bO\.?\s?C\.?\s*-?\s*(\d)/)
  if (m) return `OC-${m[1]}`
  if (/\bSOST/.test(t)) return 'SOST'
  return ''
}
export function rolesDe(ctx = {}) {
  const R = new Map()
  const poner = (nom, rol) => {
    const n = limpio(nom)
    if (!n || !rol) return
    const k = [...R.keys()].find((x) => mismaUnidad(x, n))
    if (!k) R.set(n, rol)
  }
  // 🧩 las agrupaciones del G-3 (operación od / oc1 / reserva) y sus piezas (madre)
  for (const ag of Array.isArray(ctx.calco?.orgTarea) ? ctx.calco.orgTarea : []) {
    const rol = OPERACION[ag?.operacion] || ''
    if (!rol) continue
    poner(ag.nombre, rol)
    for (const m of unicos((ag.piezas || []).map((p) => limpio(p?.madre)))) poner(m, rol)
  }
  const g3 = g3De(ctx)
  // F4·P2 Organización de la tarea: «Agrupación» con OD / OC / RES, o el nombre de la unidad con su rol
  for (const f of filasDe(g3.orgTarea)) {
    const ag = casilla(f, 'Agrupación')
    const un = casilla(f, 'Unidad')
    const rol = rolDeTexto(ag) || rolDeTexto(casilla(f, 'Observaciones'))
    for (const n of un.split(/\s*[·,;]\s*/)) poner(n, rol)
    if (rol && ag && !/^(OD|OC|RES)/i.test(sinTildes(ag))) poner(ag.replace(/\(.*?\)/g, ''), rol)
  }
  // F3·P4: quién es esfuerzo principal, secundario y reserva
  const C = capAprobado(g3, fasesCOA(ctx))
  const us = unidadesPropias(ctx).filter((u) => claseDe(u) === 'maniobra')
  const nombra = (t) => us.map(nombreDe).filter((n) => new RegExp(`(^|[^A-Z0-9])${sinTildes(n).toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[\s.-]+/g, '[\\s.-]*')}(?![A-Z0-9])`).test(sinTildes(t).toUpperCase()))
  for (const n of nombra(casilla(C.concepto, 'Esfuerzo principal'))) poner(n, 'OD')
  for (const n of nombra(casilla(C.concepto, 'Reserva'))) poner(n, 'RESERVA')
  let k = 1
  for (const n of nombra(casilla(C.concepto, 'Esfuerzos secundarios'))) if (![...R.keys()].some((x) => mismaUnidad(x, n))) poner(n, `OC-${k++}`)
  // las fichas de las fases marcadas como esfuerzo principal
  for (const f of C.fases || []) for (const u of f?.unidades || []) if (u?.principal && !esEnemiga(u)) poner(u.designacion, 'OD')
  return R
}
const rolDe = (R, nom) => {
  for (const [k, v] of R) if (mismaUnidad(k, nom)) return v
  return ''
}
const conRol = (R, nom) => {
  const r = rolDe(R, nom)
  return r && !new RegExp(`\\(${r}\\)`).test(nom) ? `${nom} (${r})` : nom
}
const ORDEN_ROL = (r) => (r === 'OD' ? 0 : /^OC-(\d)/.test(r) ? Number(r.slice(3)) : r === 'RESERVA' ? 8 : r === 'SOST' ? 9 : 7)
const esfuerzoDe = (r, principal) => (principal || r === 'OD' ? 'esfuerzo principal' : r === 'RESERVA' ? 'reserva' : 'esfuerzo secundario')

// ─── La conjugación de las tareas de la carta («Defender la LPR» → «defiende la LPR») ──────────────────────────
const IRREGULAR = {
  defender: 'defiende', detener: 'detiene', mantener: 'mantiene', contener: 'contiene', retener: 'retiene', obtener: 'obtiene', sostener: 'sostiene',
  reunir: 'reúne', destruir: 'destruye', construir: 'construye', contribuir: 'contribuye', distribuir: 'distribuye', constituir: 'constituye', incluir: 'incluye', concluir: 'concluye', sustituir: 'sustituye',
  seguir: 'sigue', perseguir: 'persigue', conseguir: 'consigue', impedir: 'impide', medir: 'mide', servir: 'sirve', elegir: 'elige', corregir: 'corrige',
  mover: 'mueve', desplegar: 'despliega', replegar: 'repliega', negar: 'niega', cerrar: 'cierra', atravesar: 'atraviesa', volver: 'vuelve', envolver: 'envuelve',
  reforzar: 'refuerza', forzar: 'fuerza', atender: 'atiende', extender: 'extiende', advertir: 'advierte', convertir: 'convierte', ir: 'va', dar: 'da', hacer: 'hace',
  poner: 'pone', disponer: 'dispone', imponer: 'impone', salir: 'sale', conducir: 'conduce', reducir: 'reduce', producir: 'produce', encontrar: 'encuentra', recordar: 'recuerda',
}
const NO_VERBO = new Set(['lugar', 'militar', 'similar', 'particular', 'titular', 'nivel', 'mar', 'hogar', 'familiar', 'auxiliar', 'polar', 'regular', 'solar', 'exterior', 'interior', 'anterior', 'posterior'])
export function enPresente(frase) {
  const s = limpio(frase)
  const m = s.match(/^(\p{L}+?)(se|lo|la|los|las)?(?=$|[\s,.;:])/iu)
  if (!m) return s
  const w = m[0]
  const base = sinTildes(m[1]).toLowerCase()
  const pron = m[2] ? m[2].toLowerCase() : ''
  if (!/(ar|er|ir)$/.test(base) || base.length < 3 || NO_VERBO.has(base)) return s
  let v = IRREGULAR[base]
  if (!v) {
    const r = base.slice(0, -2)
    v = base.endsWith('ar') ? `${r}a` : `${r}e`
  }
  const resto = s.slice(w.length)
  return `${pron ? `${pron} ` : ''}${v}${resto}`
}
// El gerundio para «continúa …» («Defender la LPR» → «defendiendo la LPR»; «Concentrarse» → «concentrándose»).
const GERUNDIO = {
  destruir: 'destruyendo', construir: 'construyendo', contribuir: 'contribuyendo', distribuir: 'distribuyendo', constituir: 'constituyendo', incluir: 'incluyendo',
  seguir: 'siguiendo', perseguir: 'persiguiendo', conseguir: 'consiguiendo', impedir: 'impidiendo', medir: 'midiendo', servir: 'sirviendo', elegir: 'eligiendo', corregir: 'corrigiendo',
  advertir: 'advirtiendo', convertir: 'convirtiendo', ir: 'yendo', leer: 'leyendo', proveer: 'proveyendo',
}
const ACENTO = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }
export function enGerundio(frase) {
  const s = limpio(frase)
  const m = s.match(/^(\p{L}+?)(se|lo|la|los|las)?(?=$|[\s,.;:])/iu)
  if (!m) return ''
  const base = sinTildes(m[1]).toLowerCase()
  const pron = m[2] ? m[2].toLowerCase() : ''
  if (!/(ar|er|ir)$/.test(base) || base.length < 3 || NO_VERBO.has(base)) return ''
  let g = GERUNDIO[base] || (base.endsWith('ar') ? `${base.slice(0, -2)}ando` : `${base.slice(0, -2)}iendo`)
  // con pronombre pegado, la tilde va en la vocal de la terminación: «concentrándose», «deteniéndolo»
  if (pron) g = g.replace(/([aeiou])(ndo)$/, (x, v, r) => `${ACENTO[v]}${r}`) + pron
  return `${g}${s.slice(m[0].length)}`
}
// Todos los verbos de la tarea en presente: «Retardar sobre la AA-1 y pasar por las líneas…» → «retarda sobre la AA-1 y
// pasa por las líneas…»; «Lista para contraatacar» → «se encuentra lista para contraatacar».
export function presenteTodo(frase) {
  let s = enPresente(frase)
  s = s.replace(/(\s(?:y|e)\s)(\p{L}+?(?:ar|er|ir)(?:se|lo|la|los|las)?)(?=$|[\s,.;:)])/giu, (m, c, w) => `${c}${enPresente(w)}`)
  if (/^(list[oa]s?|preparad[oa]s?|en condiciones)\b/i.test(s)) s = `se encuentra ${minus(s)}`
  return s
}
// La tarea de la ficha dicha como orden: «Reserva» → «constituye la reserva»; los verbos, en presente.
export const tareaEnPresente = (t) => (/^reserva\b/i.test(limpio(t)) ? `constituye la ${minus(limpio(t))}` : presenteTodo(t))
// «para que no pase…» → «con el propósito de que no pase…»; vacío si es el genérico «para cumplir la misión».
export function proposito(p) {
  let s = plano(p).replace(/[.;]+$/, '')
  if (!s || /^para cumplir (con )?la misi[oó]n$/i.test(s)) return ''
  s = s.replace(/^(con el (prop[oó]sito|fin|objeto) de|a fin de|con la finalidad de)\s+/i, '')
  const sinMayus = (x) => minus(x.replace(/^(\p{Lu}{4,})(?=\s+\p{Ll})/u, (w) => w.toLowerCase()))
  if (/^para que\b/i.test(s)) return `con el propósito de que ${sinMayus(s.replace(/^para que\s+/i, ''))}`
  return `con el propósito de ${sinMayus(s.replace(/^para\s+/i, ''))}`
}

// ─── El CAP aprobado en la carta ────────────────────────────────────────────────────────────────────────────────
// Cada fase: { n, nombre, cuando, tarea, unidades: [{ nom, rol, principal, tarea, proposito, donde }], tareas, obstaculos, fuegos }
const cuandoLargo = (c) => {
  const m = String(c || '').match(/^(.+?)\s+(?:a|al|hasta(?: el)?)\s+(.+)$/i)
  return m ? `desde el ${m[1].replace(/^(el|desde el)\s+/i, '')} hasta el ${m[2].replace(/^el\s+/i, '')}` : c ? `(${c})` : ''
}
export function fasesDelCAP(ctx = {}) {
  const C = capAprobado(g3De(ctx), fasesCOA(ctx))
  const fases = Array.isArray(C.fases) ? C.fases : []
  if (!fases.length) return { C, fases: [] }
  const carta = cartaDe(ctx)
  let D = []
  try {
    D = describirFases(fases, { nomenclator: carta.nomenclator || [], catalogos: carta.catalogos || {} })
  } catch {
    D = []
  }
  const R = rolesDe(ctx)
  const realDe = (rol) => [...R.entries()].find(([k, r]) => r === rol && !esGenerica(k))?.[0] || ''
  const out = fases.map((f, i) => {
    const d = D[i] || { n: i + 1, nombre: limpio(f?.nombre) || `Fase ${i + 1}`, cuando: '', tarea: '', tareas: [], obstaculos: [], fuegos: [], final: [] }
    const donde = new Map((d.final || []).map((x) => [norm(x.nom), x.donde]))
    const todas = (f?.unidades || [])
      .filter((u) => esUnidad(u) && !esEnemiga(u) && u.deFaseEnemiga == null && nombreDe(u) && !(unidadDe(ctx) && mismaUnidad(nombreDe(u), unidadDe(ctx))))
      .map((u) => ({ nom: nombreDe(u), clase: claseDe(u), rol: rolDe(R, nombreDe(u)), principal: !!u.principal, tarea: plano(u.tarea), proposito: plano(u.proposito), donde: donde.get(norm(nombreDe(u))) || '' }))
    // las fichas genéricas («OD», «OC 1»…) son la unidad que tiene ese rol: si esa unidad ya tiene su ficha en la fase,
    // sobran; si no, su tarea es la de esa unidad. Sin una unidad con ese rol, no van (la Orden nombra unidades).
    const us = []
    for (const u of todas) {
      if (!esGenerica(u.nom)) {
        if (!us.some((x) => mismaUnidad(x.nom, u.nom))) us.push(u)
        continue
      }
      const rol = rolGenerico(u.nom)
      const real = rol && realDe(rol)
      if (!real || u.clase !== 'maniobra' || todas.some((x) => !esGenerica(x.nom) && mismaUnidad(x.nom, real) && x.tarea) || us.some((x) => mismaUnidad(x.nom, real))) continue
      us.push({ ...u, nom: real, rol })
    }
    // un solo esfuerzo principal en la fase: la OD (operación decisiva = esfuerzo principal, PMTD); sin la OD en la
    // fase, el que marca la carta (si marca más de uno, el primero)
    const deManiobra = us.filter((u) => u.clase === 'maniobra')
    const od = deManiobra.find((u) => u.rol === 'OD')
    if (od) for (const u of deManiobra) u.principal = u === od
    else deManiobra.filter((u) => u.principal).slice(1).forEach((u) => (u.principal = false))
    const nombre = limpio(d.nombre).replace(/^FASE\s+[IVX\d]+\s*[—–:-]?\s*/i, '')
    return { n: i + 1, nombre, cuando: d.cuando || '', tarea: plano(d.tarea || f?.tarea), proposito: plano(f?.proposito), unidades: us, tareas: d.tareas || [], obstaculos: d.obstaculos || [], fuegos: d.fuegos || [] }
  })
  return { C, fases: out }
}
// «FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).», como en el PMTD («Fase I: Ocupación y organización de la PD.»).
const cabeceraFase = (f) => {
  const c = cuandoLargo(f.cuando).replace(/^\((.*)\)$/, '$1')
  return `FASE ${romano(f.n)}${f.nombre ? `: ${f.nombre.toUpperCase()}` : ''}${c ? ` (${c})` : ''}.`
}
const SIN_DATO = 'SIN DATO — verificar'
// La designación con lo que es en la operación, como en el PMTD: «(OD y esfuerzo principal)», «(OC-1 y esfuerzo
// secundario)», «(RESERVA)».
const esReservaU = (u) => u.rol === 'RESERVA' || /^reserva\b/i.test(u.tarea || '')
function etiquetaDe(u) {
  if (esReservaU(u)) return 'RESERVA'
  const esf = esfuerzoDe(u.rol, u.principal)
  return u.rol ? `${u.rol} y ${esf}` : esf
}
// «con prioridad de planeamiento a la OD y posteriormente a la OC-1 y OC-2»
function planeamientoDe(roles) {
  const xs = unicos(roles.filter((r) => r && r !== 'RESERVA' && r !== 'SOST')).sort((a, b) => ORDEN_ROL(a) - ORDEN_ROL(b))
  return xs.length ? `con prioridad de planeamiento a la ${xs[0]}${xs.length > 1 ? ` y posteriormente a la ${listaY(xs.slice(1))}` : ''}` : ''
}
const dondeDe = (u) => (u.donde && !/sin posici[oó]n/i.test(u.donde) && !norm(u.tarea).includes(norm(u.donde.replace(/^en\s+/i, ''))) ? ` ${u.donde}` : '')
// La unidad en la fase, como en el PMTD: «La Fuerza de Tarea VARGAS (OD y esfuerzo principal) defiende y bloquea al BIM
// (OD) de la DIMEC-56, con el propósito de evitar la conquista de Co. TUNARI.»; la reserva, «… constituye la reserva,
// encontrándose en condiciones de ser empleada con orden, con prioridad de planeamiento a la OD…».
function oracionUnidad(u, ant, { planeamiento = '' } = {}) {
  const cabeza = `${articulo(u.nom)} ${u.nom} (${etiquetaDe(u)})`
  const repetida = ant && ant.tarea === u.tarea && ant.donde === u.donde
  const donde = dondeDe(u)
  let queHace
  if (/^reserva$/i.test(u.tarea)) queHace = repetida ? 'continúa como reserva' : 'constituye la reserva'
  else if (repetida) queHace = enGerundio(u.tarea) ? `continúa ${enGerundio(u.tarea)}` : `mantiene su tarea (${minus(u.tarea)})`
  else queHace = u.tarea ? minus(presenteTodo(u.tarea)) : 'mantiene su dispositivo'
  const p = repetida ? '' : proposito(u.proposito)
  const lista = /^reserva$/i.test(u.tarea) && !repetida && planeamiento ? `, encontrándose en condiciones de ser ${articulo(u.nom) === 'El' ? 'empleado' : 'empleada'} con orden, ${planeamiento}` : ''
  return `${cabeza} ${sinPunto(queHace)}${donde}${p ? `, ${p}` : ''}${lista}.`
}
// La fase en la que se libra la operación decisiva (la que el concepto cuenta unidad por unidad): la que se llama como
// el combate («CONDUCCIÓN DE LA DEFENSA», «ATAQUE»…) y no como un movimiento; si no, la primera en la que el esfuerzo
// principal no se mueve; si no, la última.
const MOVIMIENTO = /concentr|desplaz|ocupaci|organizaci|reorganiz|consolid|preparaci|movimiento|marcha|aprest|alistam|reuni[oó]n|repliegue/i
const COMBATE = /defens|conducci|decisiv|ataque|asalto|bloqueo|destrucci|canaliz|retardo|combate|ruptura|penetraci|envolv|contraataque|explotaci|persecuci|cobertura|desgaste/i
const VERBO_MOVIMIENTO = /^(concentrar|desplazar|ocupar|mover|marchar|trasladar|reunir|replegar|alistar)/i
export function faseDecisiva(fases = []) {
  if (!fases.length) return null
  const porNombre = fases.find((f) => COMBATE.test(sinTildes(f.nombre)) && !MOVIMIENTO.test(sinTildes(f.nombre))) || fases.find((f) => COMBATE.test(sinTildes(f.nombre)))
  if (porNombre) return porNombre
  const od = fases.find((f) => f.unidades.some((u) => u.clase === 'maniobra' && (u.principal || u.rol === 'OD') && u.tarea && !VERBO_MOVIMIENTO.test(sinTildes(u.tarea)) && !/^reserva$/i.test(u.tarea)))
  return od || fases[fases.length - 1]
}
// La Unidad dicha como en el concepto del PMTD («Una División Mecanizada», «Un Batallón de Infantería», «Una Fuerza de
// Tarea»): el escalón y el arma de la ficha; si no, los de la designación.
const ESCALONES = { equipo: ['Equipo de Combate', 'm'], seccion: ['Sección', 'f'], compania: ['Compañía', 'f'], escuadron: ['Escuadrón', 'm'], batallon: ['Batallón', 'm'], grupo: ['Grupo', 'm'], regimiento: ['Regimiento', 'm'], brigada: ['Brigada', 'f'], division: ['División', 'f'], cuerpo: ['Cuerpo de Ejército', 'm'] }
const ARMAS = { infanteria: 'de Infantería', mecanizada: ['Mecanizada', 'Mecanizado'], blindada: ['Blindada', 'Blindado'], motorizada: ['Motorizada', 'Motorizado'], caballeria: 'de Caballería', cabmec: 'de Caballería Mecanizada', aerotransportada: ['Aerotransportada', 'Aerotransportado'], andina: ['Andina', 'Andino'], paracaidista: 'Paracaidista', logistica: ['Logística', 'Logístico'], sanidad: 'de Sanidad', artilleria: 'de Artillería', ingenieria: 'de Ingeniería', antiaerea: 'de Artillería Antiaérea', comunicaciones: 'de Comunicaciones' }
export function genericoDe(ctx, nom, { definido = false } = {}) {
  const u = unidadesPropias(ctx).find((x) => mismaUnidad(nombreDe(x), nom)) || {}
  const d = sinTildes(nom).toUpperCase()
  const ft = /^(F\.?\s?T\.?\b|FUERZA DE TAREA|AGRUP)/.test(d)
  const esc = !ft && (norm(u.escalon) || (/^DIV/.test(d) ? 'division' : /^BR/.test(d) ? 'brigada' : /^(R[A-Z]{0,4}-|REG)/.test(d) ? 'regimiento' : /^(B[A-Z]{0,5}-|BAT)/.test(d) ? 'batallon' : /^(C[IÍ]A|CIA)/.test(d) ? 'compania' : /^ESC/.test(d) ? 'escuadron' : ''))
  const E = ESCALONES[esc]
  if (!E) return `${definido ? 'La' : 'Una'} Fuerza de Tarea`
  const arma = norm(u.arma).replace(/\s+/g, '') || (/MEC/.test(d) ? 'mecanizada' : /BLIN|\bAC\b/.test(d) ? 'blindada' : /MOT/.test(d) ? 'motorizada' : /CAB/.test(d) ? 'caballeria' : /LOG/.test(d) ? 'logistica' : '')
  const A = ARMAS[arma]
  const adj = Array.isArray(A) ? A[E[1] === 'f' ? 0 : 1] : A || ''
  const art = definido ? (E[1] === 'f' ? 'La' : 'El') : E[1] === 'f' ? 'Una' : 'Un'
  return `${art} ${E[0]}${adj ? ` ${adj}` : ''}`
}

// ─── El CAE del G-2 ─────────────────────────────────────────────────────────────────────────────────────────────
// ht18: _marca { «CAE-1»: «MÁS PROBABLE», … }; cae: el enunciado del más probable; ht19: fase por fase.
export function caeDe(ctx = {}) {
  const p = picbDe(ctx)
  const marca = esObj(p.ht18?._marca) ? p.ht18._marca : {}
  const probable = Object.keys(marca).find((k) => /PROBABLE/i.test(marca[k])) || ''
  const peligroso = Object.keys(marca).find((k) => /PELIGROSO/i.test(marca[k])) || ''
  const cae = esObj(p.cae) ? p.cae : {}
  const enunciado = ['Misión', 'Intención del Comandante', 'Concepto de la operación', 'Maniobra', 'Apoyo de fuegos', 'Inteligencia', 'Ingeniería', 'ASC.', 'Ramas', 'Secuelas', 'Estado final deseado']
    .map((k) => [k, casilla(cae, k)])
    .filter(([, x]) => x)
  // H.T. 19: «MANIOBRA|OC-1|FASE I|Tarea» → por fase, cada elemento con su tarea y su propósito
  const h = esObj(p.ht19) ? p.ht19 : {}
  const nom = esObj(h._nom) ? h._nom : {}
  const porFase = new Map()
  for (const [k, x] of Object.entries(h)) {
    if (k.startsWith('_') || vacio(x)) continue
    const [grupo, item, fase, campo] = k.split('|')
    if (!fase || !campo) continue
    const clave = `${grupo}|${item}`
    if (!porFase.has(fase)) porFase.set(fase, new Map())
    const F = porFase.get(fase)
    if (!F.has(clave)) F.set(clave, { quien: limpio(nom[clave] || nom[item] || h[`${grupo}|${item}|Unidad`] || item), grupo, campos: {} })
    F.get(clave).campos[campo] = plano(x)
  }
  const ht19 = [...porFase.entries()].map(([fase, F]) => ({
    fase,
    elementos: [...F.values()].map((e) => `${e.quien}${e.grupo && e.grupo !== 'MANIOBRA' ? ` (${e.grupo.toLowerCase()})` : ''}: ${Object.entries(e.campos).map(([c, x]) => `${c.toLowerCase()}: ${x}`).join('; ')}`),
  }))
  const cierre = ['Objetivo inicial', 'Objetivos subsiguientes', 'Estado final deseado'].map((k) => [k, casilla(h, k) || casilla(h, `CIERRE|${k}`)]).filter(([, x]) => x)
  return { probable, peligroso, enunciado, ht19, cierre, hay: !!(probable || peligroso || enunciado.length || ht19.length) }
}
// Las fases del CAE en la carta (las fichas rojas): por cuál curso de acción (coa: probable / peligroso).
function fasesEnemigas(ctx = {}, cual = 'probable') {
  const fs = (fasesCOA(ctx).enemigo || []).filter(Boolean)
  const elegidas = fs.filter((f) => (f.coa || 'probable') === cual)
  return (elegidas.length ? elegidas : cual === 'probable' ? fs.filter((f) => !f.coa) : []).map((f, i) => {
    const us = (f.unidades || []).filter((u) => esUnidad(u) && esEnemiga(u) && nombreDe(u))
    const cosas = us.filter((u) => plano(u.tarea)).map((u) => `${nombreDe(u)}: ${plano(u.tarea)}${plano(u.proposito) ? `, ${minus(proposito(u.proposito))}` : ''}`)
    return `FASE ${romano(i + 1)}${limpio(f.nombre) ? ` (${limpio(f.nombre).replace(/^FASE\s+[IVX\d]+\s*[—–:-]?\s*/i, '').toUpperCase()})` : ''}${plano(f.descripcion) ? `: ${plano(f.descripcion)}` : ''}${cosas.length ? `${plano(f.descripcion) ? ' ' : ': '}${cosas.join('; ')}.` : plano(f.descripcion) ? '' : '.'}`
  })
}

// ─── Lo de los anexos de las otras secciones ───────────────────────────────────────────────────────────────────
const anexoG1 = (ctx) => camposDoc(hojasDe(ctx, 'g1').anexo)
const anexoG5 = (ctx) => camposDoc(hojasDe(ctx, 'g5').anexo)
const anexoG4 = (ctx) => camposDoc(hojasDe(ctx, 'g4').anexoF7P1)
const guiaFinal = (ctx) => camposDoc(hojasDe(ctx, 'cmte').guiaFinal)

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 🌱 LO QUE TRAE LA MESA, PÁRRAFO POR PÁRRAFO
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
const FORMAS = [
  [/defensa m[oó]vil/i, 'defensa móvil'],
  [/defensa de [aá]rea/i, 'defensa de área'],
  [/defensa tenaz/i, 'defensa tenaz'],
  [/acci[oó]n retardatriz|operaci[oó]n de retardo|\bretardo\b/i, 'acción retardatriz'],
  [/repliegue/i, 'repliegue'],
  [/envolvimiento/i, 'ataque con envolvimiento'],
  [/penetraci[oó]n/i, 'ataque con penetración'],
  [/infiltraci[oó]n/i, 'ataque con infiltración'],
  [/ataque frontal/i, 'ataque frontal'],
  [/flanqueo|movimiento desbordante/i, 'ataque con movimiento desbordante'],
  [/contraofensiva|contraataque/i, 'contraataque'],
  [/defensa|defensiv|defiende/i, 'defensa'],
  [/ofensiv|\bataca\b|ataque/i, 'ofensiva'],
]
export function formaDeManiobra(ctx = {}) {
  const g3 = g3De(ctx)
  const C = capAprobado(g3, fasesCOA(ctx))
  const fuentes = [casilla(C.concepto, 'Forma de maniobra'), casilla(C.coa, 'CÓMO'), casilla(C.coa, 'Enunciado completo'), casilla(C.coa, 'Denominación'), casilla(g3.mision, 'QUÉ'), casilla(g3.mision, 'ENUNCIADO'), plano(ordenDe(ctx).mision)]
  for (const t of fuentes) for (const [re, f] of FORMAS) if (t && re.test(t)) return f
  return ''
}
export function objetoTexto(ctx = {}) {
  const u = unidadDe(ctx)
  const f = formaDeManiobra(ctx)
  if (!u || !f) return ''
  if (f === 'defensa' || f === 'ofensiva') return `${articulo(u)} ${u} en la ejecución de operaciones ${f === 'defensa' ? 'defensivas' : 'ofensivas'}.`
  return `${articulo(u)} ${u} en la ${f}.`
}
export const ANEXOS_PMTD = ['“A” Calco de Operaciones.', '“B” Inteligencia.', '“C” Apoyo de Fuegos.', '“D” Defensa Antiaérea.', '“E” Ingeniería.', '“F” Apoyo de Servicio de Combate.', '“G” Personal.', '“H” Asuntos Civiles y Gobierno Militar.', '“I” Comunicaciones.']
const letraDe = (asunto) => (ANEXOS_PMTD.find((a) => norm(a).includes(norm(asunto))) || '').match(/“(\w)”/)?.[1] || ''

// La Organización de la tarea: de la F4·P2; si no, de las agrupaciones y las fichas (con su dependencia).
export function organizacionTexto(ctx = {}) {
  const g3 = g3De(ctx)
  const R = rolesDe(ctx)
  const grupos = new Map()
  const agregar = (cab, el) => {
    const k = [...grupos.keys()].find((x) => mismaUnidad(x, cab)) || cab
    if (!grupos.has(k)) grupos.set(k, [])
    for (const e of el) if (e && !grupos.get(k).some((x) => mismaUnidad(x, e)) && !mismaUnidad(e, k)) grupos.get(k).push(e)
  }
  for (const f of filasDe(g3.orgTarea)) {
    const ag = sinCuentas(casilla(f, 'Agrupación'))
    const un = sinCuentas(casilla(f, 'Unidad')).split(/\s*[·,;]\s*/).map(limpio).filter(Boolean)
    const rel = casilla(f, 'Relación')
    if (!ag && !un.length) continue
    if (ag && !/^(OD|OC|RES)/i.test(sinTildes(ag))) agregar(ag, un.map((x) => (rel && !/^O$/i.test(rel) && !mismaUnidad(x, ag) ? `${x} (${rel})` : x)))
    else for (const x of un) agregar(x, [])
  }
  const us = unidadesPropias(ctx)
  if (!grupos.size) {
    for (const u of us.filter((x) => claseDe(x) === 'maniobra' && directa(ctx, x))) agregar(nombreDe(u), [])
  }
  // las dependientes de cada agrupación (las fichas con `dependeDe`)
  for (const u of us) {
    if (directa(ctx, u)) continue
    const k = [...grupos.keys()].find((x) => mismaUnidad(x, nombreMadre(ctx, u)))
    if (k) agregar(k, [`${nombreDe(u)}${limpio(u.relacion) && !/orgánic/i.test(u.relacion) ? ` (${limpio(u.relacion)})` : ''}`])
  }
  if (!grupos.size) return ''
  const enGrupo = (n) => [...grupos.entries()].some(([k, xs]) => mismaUnidad(k, n) || xs.some((x) => mismaUnidad(x.replace(/\(.*$/, ''), n)))
  const control = us.filter((u) => claseDe(u) !== 'maniobra' && !enGrupo(nombreDe(u)) && directa(ctx, u)).map((u) => `${nombreDe(u)}${limpio(u.relacion) && !/orgánic/i.test(u.relacion) ? ` (${limpio(u.relacion)})` : ''}`)
  const filas = [...grupos.entries()].sort(([a], [b]) => ORDEN_ROL(rolDe(R, a)) - ORDEN_ROL(rolDe(R, b))).map(([k, xs]) => `${conRol(R, k)}: ${xs.join(', ')}`.replace(/:\s*$/, ':'))
  if (control.length) filas.push(`BAJO CONTROL: ${control.join(', ')}`)
  return filas.join('\n')
}

export function enemigoTexto(ctx = {}) {
  const os = ordenDe(ctx)
  const L = []
  const e = txt(os.enemigo)
  if (e) {
    // los CAE de la Orden superior van a sus subpárrafos
    L.push(e.split(/\n?Curso de acci[oó]n m[aá]s (probable|peligroso):/i)[0].trim())
  }
  const rojas = enemigas(ctx)
  if (rojas.length) {
    const porEsc = rojas.map((u) => `${nombreDe(u)}${u.escalon ? ` (${ESCALON[u.escalon] || u.escalon})` : ''}`)
    L.push(`En el área de operaciones (calco del G-2): ${porEsc.join(', ')}.`)
  }
  const cae = caeDe(ctx)
  const mis = cae.enunciado.find(([k]) => k === 'Misión')?.[1]
  if (mis) L.push(`Misión estimada del enemigo: ${punto(plano(mis))}`)
  if (L.length) L.push(`Ver Anexo “${letraDe('Inteligencia')}” Inteligencia.`)
  return L.filter(Boolean).join('\n')
}
export function caeProbableTexto(ctx = {}) {
  const cae = caeDe(ctx)
  const L = []
  const desdeOrden = (txt(ordenDe(ctx).enemigo).match(/Curso de acci[oó]n m[aá]s probable:\s*([\s\S]*?)(?:\nCurso de acci[oó]n m[aá]s peligroso:|$)/i) || [])[1]
  const en = cae.enunciado.filter(([k]) => k !== 'Misión')
  if (en.length) {
    if (cae.probable) L.push(`${cae.probable} (el MÁS PROBABLE para el G-2, H.T. 18).`)
    for (const [k, x] of en) L.push(`${k}: ${punto(plano(x))}`)
  } else if (desdeOrden) L.push(txt(desdeOrden))
  const ht = cae.ht19.length ? cae.ht19.map((f) => `${f.fase}: ${f.elementos.join('; ')}.`) : fasesEnemigas(ctx, 'probable')
  if (ht.length) L.push(...ht)
  for (const [k, x] of cae.cierre) L.push(`${k}: ${punto(plano(x))}`)
  return L.join('\n')
}
export function caePeligrosoTexto(ctx = {}) {
  const cae = caeDe(ctx)
  const L = []
  const desdeOrden = (txt(ordenDe(ctx).enemigo).match(/Curso de acci[oó]n m[aá]s peligroso:\s*([\s\S]*)$/i) || [])[1]
  if (cae.peligroso && cae.peligroso !== cae.probable) L.push(`${cae.peligroso} (el MÁS PELIGROSO para el G-2, H.T. 18).`)
  if (desdeOrden) L.push(txt(desdeOrden))
  const fs = fasesEnemigas(ctx, 'peligroso')
  if (fs.length) L.push(...fs)
  return L.length > (cae.peligroso ? 1 : 0) || desdeOrden || fs.length ? L.join('\n') : cae.peligroso ? L.join('\n') : ''
}
export function propiasTexto(ctx = {}) {
  const os = ordenDe(ctx)
  const g3 = g3De(ctx)
  const ent = esObj(g3.entrelazados) ? g3.entrelazados : {}
  const sup = superiorDe(ctx)
  const L = []
  const dos = casilla(ent, 'INTENCIÓN DEL COMANDANTE SUPERIOR')
  const mision = limpio(txt(os.propias).match(/Misi[oó]n:\s*([^\n]+)/i)?.[1] || '')
  const intencion = txt(os.intencion)
  const concepto = txt(os.concepto)
  if (sup && (mision || intencion || concepto || dos)) {
    L.push(`1.- ${punto(sup)}`)
    if (mision) L.push(`a.- Misión: ${punto(mision)}`)
    if (intencion || dos) L.push(`${mision ? 'b' : 'a'}.- Intención del Comandante: ${punto(plano(intencion || dos))}`)
    if (concepto) L.push(`${['a', 'b', 'c'][[mision, intencion || dos].filter(Boolean).length]}.- Concepto de la operación: ${punto(plano(concepto))}`)
  }
  const ady = [casilla(ent, 'MISIONES DE LAS UNIDADES ADYACENTES'), txt(os.propias).replace(/^.*\(escal[oó]n superior\)\.\s*Misi[oó]n:[^\n]*\n?/i, '')].filter((x) => !vacio(x))
  if (ady.length) L.push(`${L.length ? '2' : '1'}.- Unidades adyacentes y de apoyo: ${punto(plano(unicos(ady.map(plano)).join(' ')))}`)
  return L.join('\n')
}
export function refuerzosTexto(ctx = {}) {
  const os = ordenDe(ctx)
  const L = [txt(os.refuerzos)]
  const ref = unidadesPropias(ctx).filter((u) => /refuerzo|agregad|reducc/i.test(String(u.relacion || '')))
  if (ref.length && !L[0]) L.push(...ref.map((u) => `${nombreDe(u)}: ${limpio(u.relacion)}.`))
  return L.filter(Boolean).join('\n')
}
// ─── II.- MISIÓN ────────────────────────────────────────────────────────────────────────────────────────────────
// La misión aprobada (F2·P12) en el orden del PMTD: QUIÉN, QUÉ, CUÁNDO, DÓNDE y PROPÓSITO, en una oración («La Div-2,
// defiende y destruye al batallón de tanques a partir del D(0600) hasta D+6 (1800) al sud de la LF. ÁGUILA con el
// propósito de…»). Con sus cinco elementos escritos se arma con ellos, en ese orden; si no, el enunciado completo.
const PREP_LUGAR = /^(en|al|a la|a lo largo|sobre|entre|dentro|frente|delante|detr[aá]s|desde|hacia|del?|por|hasta)\b/i
function cuandoMision(c) {
  const s = sinPunto(plano(c))
  if (!s || /^(a partir|desde|entre|con orden|durante|antes|despu[eé]s|hasta)\b/i.test(s)) return s
  const m = s.match(/^(?:el\s+)?(.+?)\s+(?:a|al|hasta(?: el)?)\s+(?:el\s+)?(.+)$/i)
  if (m && /^(D\b|D[\s(+-]|d[ií]a\b)/i.test(m[1])) return `a partir del ${m[1]} hasta el ${m[2]}`
  return /^(D\b|D[\s(+-])/.test(s) ? `a partir del ${s}` : s
}
const dondeMision = (d) => (!d || PREP_LUGAR.test(d) ? d : `en ${d}`)
// «Defender y retener la LF PUMA» → «defiende y retiene la LF PUMA»
const quePresente = (q) => minus(presenteTodo(q))
// «El CE-I defiende el AO LAUCA a partir del D (0400) y hasta el D+15 (1800), reteniendo la LPR sobre la LF «PUMA» sin
// permitir que…, con el propósito de…» → «El CE-I, defiende y retiene la LPR sobre la LF «PUMA» a partir del D (0400)
// hasta el D+15 (1800) en el AO LAUCA, con el propósito de…»: quién, qué, cuándo, dónde y propósito, sin el gerundio.
const PRESENTE_DE = { reteniendo: 'retiene', manteniendo: 'mantiene', deteniendo: 'detiene', conteniendo: 'contiene', destruyendo: 'destruye', impidiendo: 'impide', defendiendo: 'defiende', negando: 'niega', persiguiendo: 'persigue' }
const presenteDeGerundio = (g) => PRESENTE_DE[sinTildes(g).toLowerCase()] || (/ando$/i.test(g) ? g.replace(/ando$/i, 'a') : /iendo$/i.test(g) ? g.replace(/iendo$/i, 'e') : g)
const VERBO_MISION = /\s(defiende|ataca|retarda|retiene|bloquea|destruye|fija|canaliza|contraataca|conquista|ocupa|asegura|controla|neutraliza|se repliega)\b/i
export function misionOrdenada(t) {
  const s = plano(t)
  const ip = s.search(/,?\s+con el prop[oó]sito de\s/i)
  if (ip < 0) return s
  let cabeza = s.slice(0, ip).trim()
  const prop = sinPunto(s.slice(ip).replace(/^,?\s+/, ''))
  const g = cabeza.match(/,\s*(\p{L}+(?:ando|iendo|endo))\s+(.+)$/u)
  if (!g) return s
  cabeza = cabeza.slice(0, g.index).trim()
  const objeto = g[2].replace(/\s+sin permitir\b.*$/i, '').trim()
  const tm = cabeza.match(/\s+((?:a partir del?|desde el?)\s.+)$/i)
  if (!tm) return s
  const cuando = tm[1].replace(/\s+y\s+hasta\s+/i, ' hasta ')
  cabeza = cabeza.slice(0, tm.index).trim()
  const vm = cabeza.match(VERBO_MISION)
  if (!vm) return s
  const quien = cabeza.slice(0, vm.index).trim().replace(/,$/, '')
  const donde = cabeza.slice(vm.index + vm[0].length).trim()
  return punto(`${quien}, ${vm[1]} y ${presenteDeGerundio(g[1])} ${objeto} ${cuando}${donde ? ` ${dondeMision(donde)}` : ''}, ${prop}`)
}
export function misionTexto(ctx = {}) {
  const g3 = g3De(ctx)
  const [quien, que, cuando, donde, prop] = ['QUIÉN', 'QUÉ', 'CUÁNDO', 'DÓNDE', 'PROPÓSITO'].map((k) => sinPunto(plano(sinCuentas(casilla(g3.mision, k)))))
  const p = proposito(prop)
  const armar = () => {
    const q = /^(el|la|los|las)\s/i.test(quien) ? mayus(quien) : `${articulo(quien)} ${quien}`
    return punto(limpio(`${q}, ${quePresente(que)} ${cuandoMision(cuando)} ${dondeMision(donde)} ${p}`))
  }
  if (quien && que && cuando && donde && p && [quien, que, cuando, donde, prop].every((x) => x.length < 300)) return armar()
  const enunciado = casilla(g3.mision, 'ENUNCIADO COMPLETO')
  if (enunciado) return punto(misionOrdenada(enunciado))
  if (quien && que && [cuando, donde, p].filter(Boolean).length >= 2) return armar()
  return punto(misionOrdenada(casilla(g3.prep3, 'II.- MISIÓN') || ordenDe(ctx).mision))
}

// ─── LA INTENCIÓN DEL COMANDANTE ────────────────────────────────────────────────────────────────────────────────
// Como en el PMTD, en forma inextensa y sin rótulos: «Mi intención es (propósito), para esto es clave inicialmente
// (tareas clave), asimismo es importante…» y, en otro párrafo, el estado final: «Al finalizar la operación, (cómo queda
// la propia fuerza), (cómo queda el enemigo), (la operación futura).»
const ROTULOS_INTENCION = [
  ['proposito', 'prop[oó]sito(?: ampliado| de la operaci[oó]n)?'],
  ['pd', 'punto decisivo'],
  ['tareas', 'tareas? claves?(?: y\\/o condiciones)?'],
  ['propia', '(?:c[oó]mo queda la )?(?:propia fuerza|fuerza propia)'],
  ['enemigo', '(?:c[oó]mo queda el )?enemigo'],
  ['futura', 'operaci[oó]n(?:es)? futuras?'],
  ['fin', 'estado final(?: deseado)?'],
]
const RE_ROTULO_INTENCION = new RegExp(`(?:^|\\n|(?<=[.;])[ \\t]+)(${ROTULOS_INTENCION.map(([, r]) => r).join('|')})\\s*:\\s*`, 'gi')
// «Propósito: … Punto decisivo: … Tareas clave: … Estado final: …» → { proposito, pd, tareas, fin, propia, enemigo, futura }
export function partesIntencion(t) {
  const s = txt(t)
  const ms = [...s.matchAll(RE_ROTULO_INTENCION)]
  const out = {}
  ms.forEach((m, i) => {
    const k = ROTULOS_INTENCION.find(([, r]) => new RegExp(`^(?:${r})$`, 'i').test(m[1]))?.[0]
    const v = s.slice(m.index + m[0].length, i + 1 < ms.length ? ms[i + 1].index : s.length).trim()
    if (k && v) out[k] = out[k] ? `${out[k]}\n${v}` : v
  })
  return out
}
// Las tareas clave, una por elemento («1) …», «- …», «PRIMERO.- …», o separadas por «;» en un renglón).
export function listaTareas(t) {
  const ls = lineas(t)
  const xs = ls.length === 1 ? ls[0].split(/\s*;\s*|\s+(?=\d{1,2}\)\s)|\s*\b(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO)\s*\.?-?\s*/) : ls
  return xs.map((l) => sinPunto(l.replace(/^[-•·]\s*|^\d{1,2}\s*(?:\.-|[.)])\s+|^[a-z]\s*(?:\.-|\))\s+/i, '').trim())).filter(Boolean)
}
function tareasEnProsa(ts) {
  const t = ts.map((x) => minus(sinPunto(x)))
  if (!t.length) return ''
  if (t.length === 1) return `para esto es clave ${t[0]}`
  if (t.length === 2) return `para esto es clave inicialmente ${t[0]} y ${t[1]}`
  return `para esto es clave inicialmente ${t[0]}, ${t[1]}, asimismo es importante ${listaY(t.slice(2))}`
}
export function componerIntencion({ proposito: p = '', tareas = [], fin = '', propia = '', enemigo = '', futura = '' } = {}) {
  const prop = minus(sinPunto(plano(p))).replace(/^(mi intenci[oó]n es|el prop[oó]sito(?: ampliado)?(?: de la operaci[oó]n)? es)\s+/i, '')
  const tp = tareasEnProsa(tareas)
  const L = []
  if (prop || tp) L.push(punto(prop ? `Mi intención es ${prop}${tp ? `, ${tp}` : ''}` : mayus(tp)))
  const fut = sinPunto(plano(futura))
  const finales = [propia, enemigo].map((x) => sinPunto(plano(x))).filter(Boolean)
  if (fut) finales.push(/^(encontr|en condiciones|quedando|list[oa]s?|preparad)/i.test(fut) ? fut : `encontrándonos en condiciones de ${minus(fut)}`)
  const f = finales.length ? finales.map((x, i) => (i ? minus(x) : x)).join(', ') : sinPunto(plano(fin))
  if (f) L.push(/^al finalizar/i.test(f) ? punto(f) : `Al finalizar la operación, ${minus(punto(f))}`)
  return L.join('\n')
}
// Una intención escrita de cualquier forma, dicha como en el PMTD.
export function intencionEnProsa(t) {
  const s = txt(t).trim()
  if (!s || /^mi intenci[oó]n\b/i.test(s)) return s
  const P = partesIntencion(s)
  if (P.proposito || P.tareas || P.fin || P.propia || P.enemigo) return componerIntencion({ ...P, tareas: listaTareas(P.tareas || '') })
  // como la escribía antes la Mesa: «El propósito de la operación es… Para esto será necesario cumplir las siguientes
  // tareas clave: 1) … Al finalizar la operación, …»
  const vieja = s.match(/^El prop[oó]sito(?: de la operaci[oó]n)? es\s+([\s\S]*?)\n(?:El punto decisivo es [^\n]*\n)?Para esto ser[aá] necesario cumplir las siguientes tareas clave:\n([\s\S]*?)(?:\n(Al finalizar la operaci[oó]n,[\s\S]*))?$/i)
  if (vieja) return componerIntencion({ proposito: vieja[1], tareas: listaTareas(vieja[2]), fin: vieja[3] || '' })
  return s.replace(/^El prop[oó]sito(?: de la operaci[oó]n)? es\s+/i, 'Mi intención es ')
}
// La de la Guía de Planificación Final (F6·P2, la definitiva); si no, la Intención Inicial (F2·P14); si no, la O.P. N° 3.
export function intencionTexto(ctx = {}) {
  const gf = txt(guiaFinal(ctx).intencion)
  if (!vacio(gf)) return intencionEnProsa(gf)
  const h = hojasDe(ctx, 'cmte').intencion
  const prop = casilla(h, 'Propósito')
  const tareas = casilla(h, 'Tareas clave')
  const fin = casilla(h, 'Estado Final')
  if (prop || tareas || fin) return componerIntencion({ proposito: prop, tareas: listaTareas(tareas), fin })
  return intencionEnProsa(casilla(g3De(ctx).prep3, 'III.- EJECUCIÓN · Intención', 'III.- EJECUCION · Intencion'))
}

// ─── III.- A.- EL CONCEPTO DE LA OPERACIÓN ──────────────────────────────────────────────────────────────────────
// Como en el PMTD (Desarrollo de los CAP, paso 4, y el enunciado del CAP de la Div-2): «Vamos a cumplir la misión
// mediante… El punto decisivo es… porque…», una oración por unidad («Una Fuerza de Tarea fuerte en Infantería (OD y
// esfuerzo principal) defiende y bloquea…, con el propósito de…»), la reserva, el propósito de los fuegos, de la defensa
// antiaérea y del esfuerzo de ingenieros, la operación de sostenimiento, las fases y el estado final.
const formaEnFrase = (f) => (f === 'defensa' ? 'una operación defensiva' : f === 'ofensiva' ? 'una operación ofensiva' : `${/^(repliegue|ataque|contraataque)/.test(f) ? 'un' : 'una'} ${f}`)
const aLa = (n) => `${articulo(n) === 'El' ? 'al' : 'a la'} ${n}`
const deLa = (n) => `${articulo(n) === 'El' ? 'del' : 'de la'} ${n}`
// El punto decisivo: el de la Estructura del campo de batalla (F2·SAL); si no, el que dijo el Comandante.
export function puntoDecisivo(ctx = {}) {
  const fuentes = [casilla(g3De(ctx).estructura, 'PUNTO DECISIVO'), partesIntencion(guiaFinal(ctx).intencion).pd, casilla(hojasDe(ctx, 'cmte').intencion, 'Punto decisivo')]
  const pd = fuentes.map((x) => sinPunto(plano(sinCuentas(x)))).find(Boolean) || ''
  return pd.replace(/^(el )?punto decisivo (es|ser[aá]|se encuentra(?: materializado)?(?: por| en)?)\s*:?\s*/i, '')
}
// «con el propósito de X» (o «a fin de X») dentro de un texto, hasta el fin de la oración.
function propositoEn(t) {
  const m = plano(t).match(/(?:con el prop[oó]sito de|con la finalidad de|a fin de)\s+(.+?)(?:\.\s+(?=\p{Lu})|\.$|;|$)/iu)
  return m ? sinPunto(m[1]) : ''
}
// La tarea de la unidad en la fase decisiva (si no tiene ficha en esa fase, la de la última anterior; si no, la próxima).
function enLaFase(fases, dec, nom) {
  const i = Math.max(0, fases.indexOf(dec))
  const orden = [...fases.slice(0, i + 1).reverse(), ...fases.slice(i + 1)]
  for (const f of orden) {
    const u = f.unidades.find((x) => mismaUnidad(x.nom, nom) && x.tarea)
    if (u) return u
  }
  return null
}
// Las unidades de maniobra que dependen directamente (con la reserva), en el orden OD, OC-n, RESERVA.
export function maniobraDirecta(ctx = {}, fases = fasesDelCAP(ctx).fases) {
  const R = rolesDe(ctx)
  const propias = unidadesPropias(ctx)
  const subordinada = (n) => {
    const x = propias.find((y) => mismaUnidad(nombreDe(y), n))
    return !!(x && !directa(ctx, x))
  }
  const xs = []
  const sumar = (n) => n && !xs.some((x) => mismaUnidad(x, n)) && !subordinada(n) && xs.push(n)
  for (const f of fases) for (const u of f.unidades) if (u.clase === 'maniobra') sumar(u.nom)
  for (const u of propias) if (claseDe(u) === 'maniobra' && directa(ctx, u)) sumar(nombreDe(u))
  // el esfuerzo principal de la operación es la OD; sin OD, el que la carta marca como principal
  const marcada = (n) => fases.some((f) => f.unidades.some((u) => mismaUnidad(u.nom, n) && u.principal))
  const hayOD = xs.some((n) => rolDe(R, n) === 'OD')
  const rolOrden = (u) => (u.principal && !u.rol ? 'OD' : u.rol)
  return xs.map((nom) => ({ nom, rol: rolDe(R, nom), principal: rolDe(R, nom) === 'OD' || (!hayOD && marcada(nom)) })).sort((a, b) => ORDEN_ROL(rolOrden(a)) - ORDEN_ROL(rolOrden(b)))
}
// Lo de los ingenieros: la prioridad de esfuerzo (la que el concepto del CAP nombra primero), los obstáculos de la carta
// por fase y lo que dice el concepto de cada uno.
function ingenieria(ctx, C, fases) {
  const t = sinCuentas(casilla(C.concepto, 'Movilidad'))
  const todo = `${t} ${sincro(ctx, 'MOVILIDAD / CONTRAMOVILIDAD / SUPERVIVENCIA (ING.)').join(' ')}`
  const donde = (re) => {
    const i = todo.search(re)
    return i < 0 ? Infinity : i
  }
  const cand = [['contramovilidad', donde(/contra\s?movilidad/i)], ['movilidad', donde(/(?<!contra\s?)movilidad/i)], ['supervivencia', donde(/supervivencia/i)]].sort((a, b) => a[1] - b[1])
  // los obstáculos de la carta (son contramovilidad): sus tipos, sin el lugar de cada uno, y en qué fases
  const tipoObs = (o) => minus(sinPunto(o).replace(/\s+(en|a\s+\d+\s*km)\b.*$/i, '').trim())
  const tipos = unicos(fases.flatMap((f) => f.obstaculos.map(tipoObs)).filter(Boolean))
  const enFases = fases.filter((f) => f.obstaculos.length).map((f) => `FASE ${romano(f.n)}`)
  const obs = tipos.length ? [`${listaY(tipos)}${enFases.length ? ` (${listaY(enFases)})` : ''}`] : []
  const tipo = obs.length ? 'contramovilidad' : cand[0][1] < Infinity ? cand[0][0] : ''
  const segs = {}
  for (const m of t.matchAll(/\b(Contramovilidad|Movilidad|Supervivencia)\s*:\s*([\s\S]*?)(?=\s*\b(?:Contramovilidad|Movilidad|Supervivencia)\s*:|$)/gi)) segs[norm(m[1])] = sinPunto(plano(m[2]))
  return { tipo, mediante: obs.length ? `la construcción de ${obs.join('; ')}` : '', segs, texto: t }
}
// «a la DIV MEC-2 (OD) y posteriormente a la DIV-1 (OC-1)»
function prioridadTrabajo(ctx, fases) {
  const R = rolesDe(ctx)
  const xs = maniobraDirecta(ctx, fases).filter((u) => u.rol !== 'RESERVA').map((u) => conRol(R, u.nom))
  return xs.length ? `${aLa(xs[0])}${xs.length > 1 ? ` y posteriormente ${listaY(xs.slice(1).map(aLa))}` : ''}` : ''
}
const esADA = (u) => /antiaer|\bada\b|\baa\b|raa|bat ?aa/i.test(sinTildes(`${u.arma} ${u.simbolo} ${nombreDe(u)}`))
// La operación de sostenimiento: «El Batallón Logístico (operación de sostenimiento) tiene la tarea de proporcionar apoyo
// de servicio de combate, con el propósito de…» (el propósito, el de la misión logística del G-4).
function sostenimientoFrase(ctx) {
  const log = unidadesPropias(ctx).filter((u) => claseDe(u) === 'servicio' && directa(ctx, u))
  const ml = sinPunto(plano(ctx.calco?.misionLog))
  if (log.length) {
    const quien = log.length === 1 ? genericoDe(ctx, nombreDe(log[0]), { definido: true }) : 'Las Unidades de apoyo de servicio de combate'
    return `${quien} (operación de sostenimiento) ${log.length === 1 ? 'tiene' : 'tienen'} la tarea de proporcionar apoyo de servicio de combate, con el propósito de ${propositoEn(ml) || 'satisfacer las necesidades de vida y de combate de las Unidades empeñadas en primera línea'}.`
  }
  return ml ? `La operación de sostenimiento: ${punto(ml)}` : ''
}
// El estado final: el del concepto del CAP; si no, el de la intención del Comandante.
function estadoFinal(ctx, C) {
  const pi = partesIntencion(guiaFinal(ctx).intencion)
  const fin = sinCuentas(casilla(C.concepto, 'Estado final')) || [pi.propia, pi.enemigo].filter(Boolean).join(', ') || pi.fin || casilla(hojasDe(ctx, 'cmte').intencion, 'Estado Final')
  const f = sinPunto(plano(fin))
  return !f ? '' : /^al finalizar/i.test(f) ? punto(f) : `Al finalizar la operación, ${minus(punto(f))}`
}
export function conceptoTexto(ctx = {}) {
  const { C, fases } = fasesDelCAP(ctx)
  const k = C.concepto
  const forma = formaDeManiobra(ctx)
  const pd = puntoDecisivo(ctx)
  const L = []
  if (forma || pd || fases.length) {
    const a = forma ? `Vamos a cumplir la misión mediante ${formaEnFrase(forma)}.` : ''
    const b = pd ? `El punto decisivo es ${minus(pd)}.` : fases.length ? `El punto decisivo es ${SIN_DATO} (dónde y por qué).` : ''
    L.push([a, b].filter(Boolean).join(' '))
  }
  const dec = faseDecisiva(fases)
  const us = maniobraDirecta(ctx, fases)
  const plan = planeamientoDe(us.map((u) => u.rol))
  for (const x of dec ? us : []) {
    const gen = genericoDe(ctx, x.nom)
    const u = enLaFase(fases, dec, x.nom)
    if (x.rol === 'RESERVA' || (u && /^reserva$/i.test(u.tarea))) {
      // lo que hará con orden: su primera tarea después de la fase decisiva que no sea «Reserva»
      const despues = fases.slice(fases.indexOf(dec) + 1).flatMap((f) => f.unidades.filter((y) => mismaUnidad(y.nom, x.nom) && y.tarea && !/^reserva$/i.test(y.tarea)))[0]
      const cond = despues ? `${minus(sinPunto(despues.tarea))}${/\d+\.\d{3,}/.test(despues.donde) ? '' : dondeDe(despues)} con orden` : `ser ${/^Un /.test(gen) ? 'empleado' : 'empleada'} con orden`
      L.push(`${gen} (RESERVA) constituye la reserva, encontrándose en condiciones de ${cond}${plan ? `, ${plan}` : ''}.`)
    } else if (u) {
      const p = proposito(u.proposito)
      const donde = /\d+\.\d{3,}/.test(u.donde) ? '' : dondeDe(u)
      L.push(`${gen} (${etiquetaDe({ ...u, rol: x.rol, principal: x.principal })}) ${sinPunto(quePresente(u.tarea))}${donde}${p ? `, ${p}` : ''}.`)
    }
  }
  if (!dec) {
    // sin las fases en la carta: lo que dice el concepto del CAP (F3·P4)
    for (const [r, t] of [['OD', 'Esfuerzo principal'], ['OC', 'Esfuerzos secundarios'], ['RESERVA', 'Reserva']]) {
      const x = sinCuentas(casilla(k, t))
      if (x) L.push(`${t} (${r}): ${punto(plano(x))}`)
    }
  }
  const pf = propositoEn(casilla(k, 'Fuegos')) || filasDe(g3De(ctx).fuegos).map((f) => proposito(casilla(f, 'Propósito')).replace(/^con el propósito de\s+/, '')).find(Boolean)
  if (pf) L.push(`El propósito del apoyo de fuegos es ${minus(pf)}.`)
  if (unidadesPropias(ctx).some(esADA)) L.push('El propósito del apoyo de defensa antiaérea es proporcionar cobertura a las operaciones terrestres, con prioridad a la Unidad que lleve la OD.')
  const I = ingenieria(ctx, C, fases)
  if (I.tipo) L.push(`La prioridad de esfuerzo de ingeniería será la ${I.tipo}${I.mediante ? ` mediante ${I.mediante}` : ''}, la prioridad de trabajo será para la Unidad que lleve la OD.`)
  const sost = sostenimientoFrase(ctx)
  if (sost) L.push(sost)
  if (fases.length) L.push('La operación se desarrollará en las siguientes fases:', ...fases.map(cabeceraFase))
  const fin = estadoFinal(ctx, C)
  if (fin && L.length) L.push(fin)
  return L.join('\n')
}
// III.- A.- 1.- Maniobra: fase por fase, una oración por unidad con su designación; al final, el riesgo.
export function maniobraTexto(ctx = {}) {
  const { C, fases } = fasesDelCAP(ctx)
  const plan = planeamientoDe(maniobraDirecta(ctx, fases).map((u) => u.rol))
  const L = []
  let ant = new Map()
  for (const f of fases) {
    const us = f.unidades.filter((u) => u.clase === 'maniobra' && (u.tarea || !ant.has(norm(u.nom)))).sort((a, b) => ORDEN_ROL(a.principal ? 'OD' : a.rol) - ORDEN_ROL(b.principal ? 'OD' : b.rol))
    const conTarea = us.filter((u) => u.tarea)
    if (!conTarea.length && !f.tarea) continue
    L.push(cabeceraFase(f))
    if (f.tarea && !conTarea.length && !/del CE|^Concentraci|^Desplazamiento/i.test(f.tarea)) L.push(punto(mayus(sinCuentas(f.tarea))))
    for (const u of conTarea) L.push(oracionUnidad(u, ant.get(norm(u.nom)), { planeamiento: plan }))
    const otras = f.tareas.filter((t) => !conTarea.some((u) => norm(t).includes(norm(u.nom))))
    if (otras.length) L.push(`Tareas tácticas: ${otras.join('; ')}.`)
    ant = new Map(f.unidades.map((u) => [norm(u.nom), u]))
  }
  const riesgo = plano(sinCuentas(casilla(C.concepto, 'Riesgo aceptado'))).replace(/(^|\s)\d{1,2}\)\s+/g, ' ').trim()
  if (riesgo) L.push(/^se (asume|acepta)/i.test(riesgo) ? punto(mayus(riesgo)) : `Se asume como riesgo ${minus(punto(riesgo))}`)
  return L.join('\n')
}
// La prioridad de una fila de la Matriz de sincronización (F4·P6-7), fase por fase.
function sincro(ctx, fila) {
  const s = g3De(ctx).sincro
  if (!esObj(s)) return []
  const cols = Array.isArray(s._cols) && s._cols.length ? s._cols : ['FASE I', 'FASE II', 'FASE III', 'FASE IV', 'FASE V']
  return cols.map((c) => [c, sinCuentas(s[`${fila}|${c}`])]).filter(([, x]) => x).map(([c, x]) => `${limpio(c).replace(/^FASE\s+(\d+)/i, (m, n) => `FASE ${romano(Number(n))}`)}: ${sinPunto(plano(x))}.`)
}
// III.- A.- 2.- Apoyo de fuegos, en sus cuatro elementos y en un párrafo, como en el PMTD: «Los medios de apoyo de fuegos
// tienen la tarea de suprimir a…, con el propósito de…, el método: la prioridad de apoyo de fuegos a…, se asignan los
// blancos…, restricciones:…, el efecto será…».
const CODIGO_BLANCO = /^[A-Z]{1,4}-?\d{1,4}\b/
function prioridadFuegos(ctx, fases) {
  const R = rolesDe(ctx)
  const pri = sincro(ctx, 'APOYO DE FUEGOS')
  if (pri.length) return `la prioridad de apoyo de fuegos ${pri.map((x) => sinPunto(x).replace(/^(FASE\s+[IVX]+):\s*(.*)$/, (m, f, r) => `en la ${f}, ${minus(r)}`)).join('; ')}`
  const p = fases.map((f) => [f.n, f.unidades.filter((u) => u.clase === 'maniobra' && (u.principal || u.rol === 'OD') && u.tarea).map((u) => conRol(R, u.nom))]).filter(([, a]) => a.length).map(([n, a]) => [n, listaY(a.map(aLa))])
  const tramos = []
  for (const [n, a] of p) {
    const t = tramos[tramos.length - 1]
    if (t && t.a === a && t.hasta === n - 1) t.hasta = n
    else tramos.push({ desde: n, hasta: n, a })
  }
  return tramos.length ? `la prioridad de apoyo de fuegos ${tramos.map((t) => `${t.desde === t.hasta ? `en la FASE ${romano(t.desde)}` : `de la FASE ${romano(t.desde)} a la FASE ${romano(t.hasta)}`} ${t.a}`).join('; ')}` : ''
}
const restriccionesFuego = (ctx) => unicos(sinCuentas(casilla(g3De(ctx).controlOrden, 'Medidas de coordinación de apoyo')).split(/(?<=[.;])\s+|\n/).map((x) => sinPunto(plano(x))).filter((x) => /\b(AFP|AFR|LRF|ZFP|ZFR)\b|restrictiv|prohib/i.test(x)))
export function fuegosTexto(ctx = {}) {
  const { C, fases } = fasesDelCAP(ctx)
  const g3 = g3De(ctx)
  const k = sinCuentas(casilla(C.concepto, 'Fuegos'))
  const filas = filasDe(g3.fuegos)
  // la TAREA y el PROPÓSITO: los del concepto del CAP; si no, la primera fila de la Matriz de ejecución (F4·P7)
  let tarea = ''
  let prop = ''
  const conProp = plano(k).split(/(?<=\.)\s+(?=Fase\s+[IVX\d]+\b)/i).find((x) => /con el prop[oó]sito de/i.test(x)) || ''
  if (conProp) {
    const [a, b] = conProp.split(/,?\s*con el prop[oó]sito de\s+/i)
    tarea = minus(sinPunto(a.replace(/^Fase\s+[IVX\d]+\s*(\([^)]*\))?\s*:\s*/i, '')))
    prop = sinPunto(String(b || '').split(/\.\s+(?=\p{Lu})/u)[0])
  }
  const f0 = filas.find((f) => casilla(f, 'Tarea'))
  if (!tarea && f0) {
    tarea = limpio(`${minus(plano(casilla(f0, 'Tarea')))} ${plano(casilla(f0, 'Blanco'))}`)
    prop = proposito(casilla(f0, 'Propósito')).replace(/^con el propósito de\s+/, '')
  }
  // el MÉTODO: la prioridad por fase, los blancos asignados y las restricciones
  const pri = prioridadFuegos(ctx, fases)
  const blancos = unicos([...fases.flatMap((f) => f.fuegos.map((x) => (limpio(x).match(CODIGO_BLANCO) || [])[0])), ...filas.map((f) => (plano(casilla(f, 'Blanco')).match(CODIGO_BLANCO) || [])[0])].filter(Boolean))
  const restr = restriccionesFuego(ctx)
  // el EFECTO: lo cuantificado o lo que impide, que no está ya en el propósito
  const efecto = [...plano(k).matchAll(/(?:para|a fin de|con el prop[oó]sito de)\s+((?:destruir|neutralizar|suprimir|impedir|evitar|degradar|desgastar|reducir)[^.;]*)/gi)].map((m) => sinPunto(m[1])).find((x) => /\d\s?%|impedir|evitar/i.test(x) && !prop.includes(x)) || ''
  const L = []
  if (tarea || prop || pri || blancos.length) {
    const metodo = [pri, blancos.length ? `se ${blancos.length === 1 ? 'asigna el blanco' : 'asignan los blancos'} ${listaY(blancos)}` : '', restr.length ? `restricciones: ${restr.join('; ')}` : ''].filter(Boolean).join(', ')
    L.push(punto([`Los medios de apoyo de fuegos tienen la tarea de ${tarea || SIN_DATO}`, prop ? `con el propósito de ${prop}` : '', metodo ? `el método: ${metodo}` : '', efecto ? `el efecto será ${efecto}` : ''].filter(Boolean).join(', ')))
  }
  // los fuegos planificados, fase por fase (la Matriz de ejecución y los fuegos de la carta)
  const mat = filas.map((f) => {
    const blanco = casilla(f, 'Blanco')
    const quien = casilla(f, 'Unidad que lo bate')
    const t = casilla(f, 'Tarea')
    const p = casilla(f, 'Propósito')
    const met = casilla(f, 'Método')
    const fase = casilla(f, 'Fase')
    return t || p ? `- ${fase ? `${plano(fase)}: ` : ''}${minus(plano(t)) || 'batir'} ${plano(blanco)}${quien ? ` con ${plano(quien)}` : ''}${p ? `, ${proposito(p)}` : ''}${met ? `; método: ${minus(plano(met))}` : ''}.` : ''
  }).filter(Boolean)
  const deFases = fases.filter((f) => f.fuegos.length).map((f) => `- FASE ${romano(f.n)}: ${f.fuegos.join('; ')}.`)
  if (mat.length || deFases.length) L.push('Los fuegos planificados:', ...mat, ...deFases)
  return L.join('\n')
}
export function artilleriaTexto(ctx = {}) {
  const g3 = g3De(ctx)
  const fuego = unidadesPropias(ctx).filter((u) => claseDe(u) === 'apoyo' && /artiller|lanzacoh|cohete|morter|^ga|^ra[a-z]?-|galm|gac|ram/i.test(`${u.arma} ${nombreDe(u)}`))
  const rec = filasDe(g3.recursos)
  const L = []
  const oapc = fuego.map((u) => {
    const f = rec.find((r) => mismaUnidad(casilla(r, 'Recurso'), nombreDe(u)))
    const aq = f ? sinCuentas(casilla(f, 'A quién')) : ''
    const rel = f ? sinCuentas(casilla(f, 'Relación')) : limpio(u.relacion)
    return `${nombreDe(u)} : ${[rel, aq].filter(Boolean).join(' ') || 'SIN DATO — verificar'}`
  })
  const pri = sincro(ctx, 'APOYO DE FUEGOS')
  if (pri.length) L.push('1) Prioridad de fuego.', ...pri)
  const lbl = esObj(g3.lbl) ? Object.entries(g3.lbl).filter(([k, x]) => !k.startsWith('_') && !k.includes('|') && !vacio(x)).map(([k, x]) => `${k}: ${plano(x)}`) : []
  if (lbl.length) L.push(`${pri.length ? '2' : '1'}) Prioridad para la adquisición de blancos.`, ...lbl)
  if (oapc.length) L.push(`${1 + [pri.length, lbl.length].filter(Boolean).length}) Organización de la Artillería para el Combate.`, ...oapc)
  return L.join('\n')
}
export function mcafTexto(ctx = {}) {
  return punto(sinCuentas(casilla(g3De(ctx).controlOrden, 'Medidas de coordinación de apoyo')))
}
// Los órganos de reconocimiento de la Orden de Reconocimiento (F2·P9): «Escuadrón ZULU — …».
function organosReco(ctx) {
  let reco = ''
  try {
    reco = textoReconocimiento(g3De(ctx).ivr)
  } catch {
    reco = ''
  }
  return reco
    .split('\n')
    .map((l) => l.replace(/^\s*-\s*/, ''))
    .filter((l) => /—/.test(l) && !/^(Número|OBJETO|CARTA|ANEXOS)\b/.test(l))
}
export function reconocimientoTexto(ctx = {}) {
  const L = []
  const ains = unicos((ctx.calco?.ops?.ains || []).map((a) => limpio(a?.nom || (a?.n != null ? `AIN-${a.n}` : ''))))
  if (ains.length) L.push(`El punto focal del esfuerzo de reconocimiento y vigilancia son ${ains.length === 1 ? 'el área de interés nombrada' : 'las áreas de interés nombradas'} ${listaY(ains)}.`)
  const eq = organosReco(ctx)
  if (eq.length) L.push('Los órganos de reconocimiento y sus tareas:', ...eq.map((l) => `- ${punto(l)}`))
  const ev = filasDe(picbDe(ctx).ht20)
    .map((f) => {
      const ain = casilla(f, 'N° A.I.N.')
      const ind = casilla(f, 'Indicador')
      const na = casilla(f, 'No antes de')
      const nd = casilla(f, 'No después de')
      return ind ? `${ain ? `${ain}: ` : ''}${minus(sinPunto(plano(ind)))}${na ? `, no antes del ${plano(na)}` : ''}${nd ? `${na ? ' y' : ','} no después del ${plano(nd)}` : ''}` : ''
    })
    .filter(Boolean)
  if (ev.length) L.push('Los indicadores a vigilar:', ...unicos(ev).map((x) => `- ${punto(x)}`))
  return L.join('\n')
}
// III.- A.- 4.- Inteligencia, como en el PMTD: «El enfoque de recopilación de inteligencia está dirigido a determinar…
// La prioridad de apoyo a la… (OD). Los recursos son…».
export function inteligenciaTexto(ctx = {}) {
  const { fases } = fasesDelCAP(ctx)
  const R = rolesDe(ctx)
  const L = []
  const RANGO = ['equipo', 'escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito']
  const rango = (u) => RANGO.indexOf(norm(u.escalon))
  const enemigo = nombreDe(enemigas(ctx).filter((u) => claseDe(u) === 'maniobra').sort((a, b) => rango(b) - rango(a))[0] || {})
  const defensiva = /defens|retard|repliegue/.test(formaDeManiobra(ctx))
  if (enemigo) L.push(`El enfoque de recopilación de inteligencia está dirigido a determinar ${defensiva ? `el dispositivo de ataque, la dirección del esfuerzo principal y las rutas alternas que pueda emplear ${articulo(enemigo) === 'El' ? 'el' : 'la'} ${enemigo}` : `el dispositivo defensivo, las reservas y los obstáculos ${deLa(enemigo)}`} en nuestra área de operaciones.`)
  const od = maniobraDirecta(ctx, fases).find((u) => u.rol === 'OD' || u.principal)
  if (od) L.push(`La prioridad de apoyo ${aLa(conRol(R, od.nom))}.`)
  const intel = unidadesPropias(ctx).filter((u) => /intelig|explor|\bcie\b|cirt|uav|dron|guerra electr/i.test(sinTildes(`${u.arma} ${u.simbolo} ${nombreDe(u)}`))).map(nombreDe)
  const recursos = unicos([...intel, ...organosReco(ctx).map((l) => limpio(l.split('—')[0]))])
  if (recursos.length) L.push(`Los recursos son ${listaY(recursos)}.`)
  const pri = sincro(ctx, 'INTELIGENCIA')
  if (pri.length && L.length) L.push('Por fase:', ...pri.map((x) => `- ${x}`))
  if (L.length) L.push(`Ver Anexo “${letraDe('Inteligencia')}” Inteligencia.`)
  return L.join('\n')
}
// III.- A.- 5.- Ingenieros, como en el PMTD: «La prioridad de esfuerzo es de contramovilidad mediante…, la prioridad de
// trabajo a la… (OD)».
export function ingenierosTexto(ctx = {}) {
  const { C, fases } = fasesDelCAP(ctx)
  const I = ingenieria(ctx, C, fases)
  const trabajo = prioridadTrabajo(ctx, fases)
  const L = []
  if (I.tipo) L.push(`La prioridad de esfuerzo es de ${I.tipo}${I.mediante ? ` mediante ${I.mediante}` : ''}${trabajo ? `, la prioridad de trabajo ${trabajo}` : ''}.`)
  const segs = [['contramovilidad', 'Contramovilidad'], ['movilidad', 'Movilidad'], ['supervivencia', 'Supervivencia']].filter(([k]) => I.segs[k])
  if (segs.length) L.push(...segs.map(([k, t]) => `- ${t}: ${punto(I.segs[k])}`))
  else if (I.texto) L.push(punto(plano(I.texto)))
  const obs = sinCuentas(casilla(g3De(ctx).controlOrden, 'Medidas de control de obstáculos'))
  if (obs) L.push(`Control de obstáculos: ${punto(plano(obs))}`)
  const pri = sincro(ctx, 'MOVILIDAD / CONTRAMOVILIDAD / SUPERVIVENCIA (ING.)')
  if (pri.length) L.push('Por fase:', ...pri.map((x) => `- ${x}`))
  return L.join('\n')
}
// III.- A.- 6.- Defensa antiaérea, como en el PMTD: «La tarea de los medios de ADA es destruir vectores aéreos…, con el
// propósito de proporcionar cobertura a las operaciones terrestres, la prioridad de apoyo a la… (OD)».
export function antiaereaTexto(ctx = {}) {
  const { fases } = fasesDelCAP(ctx)
  const R = rolesDe(ctx)
  const ada = unidadesPropias(ctx).filter(esADA)
  const pri = sincro(ctx, 'ADA.')
  const L = []
  if (ada.length || pri.length) {
    const od = maniobraDirecta(ctx, fases).find((u) => u.rol === 'OD' || u.principal)
    L.push(`La tarea de los medios de defensa antiaérea${ada.length ? ` (${listaY(ada.map((u) => `${nombreDe(u)}${limpio(u.relacion) ? `, ${limpio(u.relacion)}` : ''}`))})` : ''} es destruir los vectores aéreos enemigos, con el propósito de proporcionar cobertura a las operaciones terrestres${od ? `, la prioridad de apoyo ${aLa(conRol(R, od.nom))}` : ''}.`)
  }
  if (pri.length) L.push('Por fase:', ...pri.map((x) => `- ${x}`))
  return L.join('\n')
}
export function policiaTexto(ctx = {}) {
  const pm = unidadesPropias(ctx).filter((u) => /polic|\bpm\b|rpm/i.test(`${u.arma} ${u.simbolo} ${sinTildes(nombreDe(u))}`))
  return pm.length ? `Medios de Policía Militar: ${pm.map(nombreDe).join(', ')}.` : ''
}
export function acgmTexto(ctx = {}) {
  const a = anexoG5(ctx)
  const L = []
  if (!vacio(a.concepto)) L.push(punto(plano(a.concepto)))
  if (!vacio(a.evacuacion)) L.push(`Evacuación: ${punto(plano(a.evacuacion))}`)
  if (!vacio(a.ejes)) L.push(`Ejes humanitarios: ${punto(plano(a.ejes))}`)
  if (!vacio(a.bienesProtegidos)) L.push(`Bienes protegidos: ${punto(plano(a.bienesProtegidos))}`)
  if (L.length) L.push(`Ver Anexo “${letraDe('Asuntos Civiles')}” Asuntos Civiles y Gobierno Militar.`)
  return L.join('\n')
}
// III.- B.- y C.- Las tareas de las unidades, FASE POR FASE como en el PMTD: en cada fase TODAS las unidades (las de
// maniobra que dependen directamente, con la reserva; o las de apoyo de combate), cada una con su TAREA y su PROPÓSITO:
//   FASE I: OCUPACIÓN Y ORGANIZACIÓN DE LA PD (desde … hasta …).
//   1.- FT VARGAS (OD).
//   TAREA: Se desplaza a la PD.
//   PROPÓSITO: Ocupar la PD.
// La tarea es la de la ficha de la unidad en esa fase (conjugada); sin ficha, «Continúa …» lo de la fase anterior. Las de
// apoyo de combate suman su relación de apoyo (F4·SAL, desde su fase) y sus fuegos de la Matriz de ejecución (F4·P7).
// «a la DIV MEC-2 (OD)», «al CE-I»; lo que no es una designación, tal cual («a los Puestos de Mando…»).
const esDesignacion = (a) => /^[A-ZÁÉÍÓÚÑ0-9«»"'().,/ -]+$/.test(String(a).replace(/\(.*?\)/g, '').trim())
const aQuien = (a) => (esDesignacion(a) ? aLa(a) : `a ${a}`)
const deQuien = (a) => (esDesignacion(a) ? deLa(a) : `de ${a}`)
const RELACION = [
  [/refuerzo de fuegos|apoyo general.?refuerzo/i, (a) => `Refuerza los fuegos ${deQuien(a)}`],
  [/refuerzo/i, (a) => `Refuerza ${aQuien(a)}`],
  [/apoyo directo/i, (a) => `Apoya directamente ${aQuien(a)}`],
  [/acci[oó]n de conjunto|apoyo general/i, (a) => `Ejecuta acción de conjunto en apoyo ${deQuien(a)}`],
  [/org[aá]nic/i, (a) => `Apoya ${aQuien(a)} (orgánica)`],
]
// ¿El texto nombra a la unidad? («RAM-4, RAC-1 y RAC-6 (artillería de campaña)» nombra a la RAM-4)
const menciona = (t, nom) => new RegExp(`(^|[^A-Z0-9])${sinTildes(nom).toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[\s.-]+/g, '[\\s.-]*')}(?![A-Z0-9])`).test(sinTildes(t).toUpperCase())
const numFase = (s) => {
  const m = sinTildes(String(s || '')).toUpperCase().match(/FASE\s+([IVX]+|\d+)\b/)
  return !m ? null : /^\d+$/.test(m[1]) ? Number(m[1]) : ROMANOS.indexOf(m[1]) + 1 || null
}
const sinProposito = (p) => sinPunto(String(p || '').replace(/^con el propósito de\s+/i, ''))
const continua = (u) => (/^reserva$/i.test(u.tarea) ? 'Continúa como reserva' : enGerundio(u.tarea) ? `Continúa ${enGerundio(u.tarea)}${dondeDe(u)}` : `Continúa con su tarea: ${minus(sinPunto(u.tarea))}`)
export function tareasTexto(ctx = {}, clase = 'maniobra') {
  const { fases } = fasesDelCAP(ctx)
  const R = rolesDe(ctx)
  const g3 = g3De(ctx)
  const u0 = unidadDe(ctx)
  const propias = unidadesPropias(ctx)
  const deClase = (u) => (clase === 'maniobra' ? u.clase === 'maniobra' : u.clase === 'apoyo')
  const deManiobra = maniobraDirecta(ctx, fases)
  const plan = planeamientoDe(deManiobra.map((u) => u.rol))
  // las unidades, en el orden de la organización de la tarea
  let nombres = []
  // las de apoyo de combate: las de la carta; cada renglón de la Asignación de recursos (F4·SAL) y de la Matriz de
  // ejecución de fuegos (F4·P7) va a las unidades que nombra («RAM-4, RAC-1 y RAC-6 (…)» → RAM-4); si no nombra
  // ninguna, a la que dice (sin lo que va entre paréntesis), si es de apoyo de combate
  const dueños = new Map()
  if (clase === 'maniobra') nombres = deManiobra.map((u) => u.nom)
  else {
    const sumar = (n) => {
      const x = propias.find((y) => mismaUnidad(nombreDe(y), n))
      if (n && !esGenerica(n) && !nombres.some((y) => mismaUnidad(y, n)) && !(x && claseDe(x) !== 'apoyo') && !(u0 && mismaUnidad(n, u0))) nombres.push(n)
    }
    for (const u of propias) if (claseDe(u) === 'apoyo' && directa(ctx, u)) sumar(nombreDe(u))
    for (const f of fases) for (const u of f.unidades) if (deClase(u)) sumar(u.nom)
    const asignar = (fila, t) => {
      const conocidas = nombres.filter((n) => menciona(t, n))
      if (conocidas.length) return dueños.set(fila, conocidas)
      const n = limpio(sinCuentas(t).replace(/\s*\(.*?\)\s*/g, ' '))
      if (n && n.length <= 40 && claseDe({ designacion: n }) === 'apoyo') {
        sumar(n)
        dueños.set(fila, [nombres.find((x) => mismaUnidad(x, n)) || n])
      }
    }
    for (const f of filasDe(g3.recursos)) asignar(f, casilla(f, 'Recurso'))
    for (const f of filasDe(g3.fuegos)) asignar(f, casilla(f, 'Unidad que lo bate'))
  }
  const de = (fila, nom) => (dueños.get(fila) || []).some((x) => mismaUnidad(x, nom))
  // lo que una unidad de apoyo de combate hace en la fase n fuera de su ficha
  const extra = (nom, n) => {
    const tareas = []
    const props = []
    if (clase === 'maniobra') return { tareas, props }
    for (const f of filasDe(g3.recursos)) {
      if (!de(f, nom)) continue
      const desde = numFase(casilla(f, 'Desde qué fase'))
      if (desde && n < desde) continue
      const aq = sinCuentas(casilla(f, 'A quién'))
      const rel = sinCuentas(casilla(f, 'Relación'))
      const a = aq ? conRol(R, aq) : ''
      const r = RELACION.find(([re]) => re.test(rel))
      if (a || rel) tareas.push(r && a ? r[1](a) : `${mayus(rel || 'Apoya')}${a ? ` ${aQuien(a)}` : ''}`)
    }
    for (const f of filasDe(g3.fuegos)) {
      const nf = numFase(casilla(f, 'Fase'))
      if (!de(f, nom) || (nf && nf !== n)) continue
      const t = plano(casilla(f, 'Tarea'))
      if (t) tareas.push(limpio(`${mayus(enPresente(t))} ${plano(casilla(f, 'Blanco'))}`))
      const p = sinProposito(proposito(casilla(f, 'Propósito')))
      if (p) props.push(p)
    }
    return { tareas, props }
  }
  const juntar = (xs) => xs.map((x, i) => (i ? minus(sinPunto(x)) : mayus(sinPunto(x)))).join('; ')
  // (el rol OD / OC / RESERVA es de las de maniobra)
  const bloque = (i, nom, tareas, props) => [`${i}.- ${clase === 'maniobra' ? conRol(R, nom) : nom}.`, `TAREA: ${punto(juntar(tareas))}`, `PROPÓSITO: ${props.length ? punto(juntar(props)) : `${SIN_DATO}.`}`]
  const L = []
  if (!fases.length) {
    // sin las fases en la carta: sólo las de apoyo de combate, con su relación de apoyo
    if (clase === 'maniobra') return ''
    let i = 0
    for (const nom of nombres) {
      const x = extra(nom, Infinity)
      if (x.tareas.length) L.push(...bloque(++i, nom, x.tareas, x.props))
    }
    return L.join('\n')
  }
  const ultimo = new Map()
  for (const f of fases) {
    const B = []
    let i = 0
    for (const nom of nombres) {
      const k = norm(nom)
      const u = f.unidades.find((x) => deClase(x) && mismaUnidad(x.nom, nom) && x.tarea)
      const prev = ultimo.get(k)
      let tarea = ''
      let prop = ''
      if (u) {
        const igual = prev && prev.u.tarea === u.tarea && prev.u.donde === u.donde
        tarea = igual ? continua(u) : `${mayus(sinPunto(tareaEnPresente(u.tarea)))}${dondeDe(u)}`
        prop = sinProposito(proposito(u.proposito)) || (igual ? prev.prop : '')
        ultimo.set(k, { u, prop })
      } else if (prev) {
        tarea = continua(prev.u)
        prop = prev.prop
      }
      const x = extra(nom, f.n)
      const tareas = [tarea, ...x.tareas].filter(Boolean)
      const props = unicos([prop, ...x.props].filter(Boolean))
      if (!tareas.length) {
        if (clase !== 'maniobra') continue
        tareas.push(SIN_DATO)
      }
      const reserva = /^reserva$/i.test((u || prev?.u)?.tarea || '')
      if (!props.length && reserva && plan) props.push(`encontrarse en condiciones de ser ${articulo(nom) === 'El' ? 'empleado' : 'empleada'} con orden, ${plan}`)
      if (!props.length && f.proposito) props.push(sinProposito(proposito(f.proposito)))
      B.push(...bloque(++i, nom, tareas, props.filter(Boolean)))
    }
    if (B.length) L.push(cabeceraFase(f), ...B)
  }
  return L.join('\n')
}
export function vigenciaTexto(ctx = {}) {
  const os = ordenDe(ctx)
  const fuentes = [txt(os.coordinacion), txt(os.vigencia), txt(os.cuando)].join('\n')
  const d = fuentes.match(/(?:fecha|d[ií]a)\s+D\s*[:=]?\s*([^,;\n]+)/i)?.[1]
  const h = fuentes.match(/hora\s+H\s*[:=]?\s*([^,;\n.]+)/i)?.[1]
  const L = ['La presente orden entra en vigor a partir de su emisión.']
  if (d || h) L.push(`${d ? `Día D: ${limpio(d)}` : ''}${d && h ? '; ' : ''}${h ? `hora H: ${limpio(h)}` : ''}.`)
  return d || h || unidadDe(ctx) ? L.join('\n') : ''
}
// ─── III.- D.- 2.- LOS RCIC ─────────────────────────────────────────────────────────────────────────────────────
// Los que ya determinó cada sección del Estado Mayor (PMTD 2017, octavo paso del Análisis de la Misión: «desde sus
// respectivos campos de responsabilidad, desarrollan tanto RPI como RIFA y las presentan a consideración del
// Comandante»): la F2·P8 «RCIC. y EEIA.» del G-1, del G-3, del G-4, del G-5 y del EME, y el Plan de búsqueda de
// información del G-2 (sus requisitos son los RPI). Primero los que priorizó el Comandante (F2·P8 «Prioridad a los RCIC.»
// y la Guía de Planificación Final), en su orden; después los de cada sección. RPI = sobre el enemigo, el terreno, las
// condiciones meteorológicas y las CC.MM.; RIFA = sobre las propias fuerzas; EEIA = lo que hay que negarle al enemigo.
const SECCIONES_RCIC = [['g1', 'G-1'], ['g4', 'G-4'], ['g5', 'G-5'], ['eme', 'EME']]
const RE_EEIA = /\bEEIA\b|que el enemigo no (conozca|detecte|descubra|sepa|ubique)|negar(le)? al enemigo|ocultar|enmascar/i
const RE_RPI = /\benemig|\brojo\b|amenaza|adversari|\bCAE\b|terreno|camino|carretera|puente|vado|\br[ií]o\b|transitab|clima|meteorol|lluvia|nevad|helada|visibilidad|iluminaci|poblaci|civil|refugiad|desplazad|autoridad|\bONG\b|\bCC\.?\s?MM\b/i
const RE_RIFA = /^informar\b|\bnuestr|\bpropi[ao]s?\b|\bamig|eficiencia|abastec|clase\s+(i|ii|iii|iv|v|vi|vii|viii|ix|x)\b|reemplaz|munici[oó]n|combustible|baja(s)? propia|repliegue de|empe[nñ]o de la reserva|concluy|complet/i
function tipoRequerimiento(r, de, tipo = '') {
  if (/EEIA/i.test(tipo) || RE_EEIA.test(r)) return 'EEIA'
  if (/RIFA/i.test(tipo) || /^\s*RIFA\b/i.test(r)) return 'RIFA'
  if (/RPI/i.test(tipo) || /^\s*(RPI|ORI)\b/i.test(r) || de === 'G-2') return 'RPI'
  if (RE_RPI.test(r) && !/^\s*informar\b/i.test(r)) return 'RPI'
  if (RE_RIFA.test(r)) return 'RIFA'
  return de === 'G-1' || de === 'G-4' ? 'RIFA' : /[¿?]/.test(r) ? 'RPI' : 'RIFA'
}
const limpiarReq = (r) =>
  sinPunto(plano(r).replace(/^(?:[-•·]\s*|\d{1,2}\s*(?:\.-|[.)])\s+|(?:RCIC|RPI|RIFA|ORI|EEIA)\s*[-–—.]?\s*\d*\s*[.:)-]*\s*)+/i, '').replace(/\s*\((?:prioridad|lo propuso|sostiene|no despu[eé]s)[^)]*\)\s*$/i, ''))
const seccionDe = (s) => {
  const t = sinTildes(String(s || '')).toUpperCase()
  const m = t.match(/\bG\s*-?\s*([1-5])\b/)
  return m ? `G-${m[1]}` : /\bEME\b|ESPECIAL/.test(t) ? 'EME' : /CMTE|COMANDANTE/.test(t) ? 'Cmte.' : limpio(s)
}
// [{ r, tipo: 'RPI' | 'RIFA' | 'EEIA', de: ['G-2', …], p }] en el orden en que van en la Orden.
export function requerimientosDe(ctx = {}) {
  const lista = []
  const agregar = (r0, de, tipo = '', p = null) => {
    const r = limpiarReq(r0)
    if (!r) return
    const ya = lista.find((x) => norm(x.r) === norm(r))
    if (ya) {
      if (p != null && (ya.p == null || p < ya.p)) ya.p = p
      if (de && !ya.de.includes(de)) ya.de.push(de)
      return
    }
    lista.push({ r, tipo: tipoRequerimiento(plano(r0), de, tipo), de: de ? [de] : [], p, i: lista.length })
  }
  filasDe(hojasDe(ctx, 'cmte').prioridadRcic).forEach((f) => {
    const n = parseFloat(casilla(f, 'Prioridad'))
    agregar(casilla(f, 'Requerimiento'), seccionDe(casilla(f, 'Quién lo propone', 'Quien')), '', Number.isFinite(n) ? n : 50)
  })
  lineas(guiaFinal(ctx).rcic).forEach((l, i) => {
    const n = Number(l.match(/prioridad\s*(\d+)/i)?.[1])
    agregar(l, seccionDe(l.match(/lo propuso\s*([^);]+)/i)?.[1] || ''), '', Number.isFinite(n) && n > 0 ? n : 50 + i / 100)
  })
  // el G-2: los requisitos de su Plan de búsqueda de información (si no tiene, los vacíos de inteligencia de la H.T. 4)
  const p = picbDe(ctx)
  const pbi = Array.isArray(p.pbi) ? p.pbi.map((f) => casilla(f, 'Requisito')) : Array.isArray(p.pbi?.requisitos) ? p.pbi.requisitos.map((x) => (esObj(x) ? x.requisito : '')) : []
  const reqG2 = pbi.map(plano).filter(Boolean)
  for (const r of reqG2.length ? reqG2 : Array.isArray(p.ht4?.a) ? p.ht4.a : []) agregar(r, 'G-2', 'RPI')
  // el G-3 (F2·P8, con su tipo) y las demás secciones (su F2·P8 «RCIC. y EEIA.»)
  filasDe(g3De(ctx).rcic).forEach((f) => agregar(casilla(f, 'Requerimiento'), 'G-3', casilla(f, 'Tipo')))
  for (const [g, de] of SECCIONES_RCIC) filasDe(hojasDe(ctx, g).rcic).forEach((f) => agregar(casilla(f, 'Requerimiento'), de, casilla(f, 'Tipo')))
  return lista.sort((a, b) => (a.p ?? 999) - (b.p ?? 999) || a.i - b.i)
}
export function rcicDe(ctx = {}) {
  const L = requerimientosDe(ctx)
  const de = (t) => L.filter((x) => x.tipo === t).map((x) => x.r)
  const num = (xs) => xs.map((r, i) => `${i + 1}) ${punto(mayus(r))}`).join('\n')
  return { rpi: num(de('RPI')), rifa: num(de('RIFA')), eeia: de('EEIA').map((r, i) => `${String.fromCharCode(97 + (i % 26))}.- ${punto(mayus(r))}`).join('\n') }
}
// La matriz de riesgo (F6·P3; si no, F2·P7): cada peligro con sus medidas de control.
export function riesgosTexto(ctx = {}) {
  const g3 = g3De(ctx)
  const L = []
  for (const m of [g3.riesgoFinal, g3.riesgo]) {
    if (L.length) break
    if (Array.isArray(m)) {
      for (const f of filasDe(m)) {
        const pel = casilla(f, 'Peligro')
        const med = casilla(f, 'Medida de control')
        if (med) L.push(`- ${pel ? `${sinPunto(plano(pel))}: ` : ''}${punto(plano(med))}`)
      }
    } else if (esObj(m) && Array.isArray(m.tareas)) {
      for (const t of m.tareas) for (const p of t?.peligros || []) {
        const ctl = (Array.isArray(p?.controles) ? p.controles : [p?.controles]).map((c) => plano(typeof c === 'object' && c ? c.texto || c.control : c)).filter(Boolean)
        if (ctl.length) L.push(`- ${plano(p.peligro) ? `${sinPunto(plano(p.peligro))}: ` : ''}${ctl.map((c) => punto(c)).join(' ')}`)
      }
    }
  }
  return unicos(L).join('\n')
}
const PROHIBE = (ctx) => (Array.isArray(g3De(ctx).limitaciones?.a) ? g3De(ctx).limitaciones.a : []).map(plano).filter(Boolean)
const OBLIGA = (ctx) => (Array.isArray(g3De(ctx).limitaciones?.b) ? g3De(ctx).limitaciones.b : []).map(plano).filter(Boolean)
const RE_REGLAS = /mina|civil|poblaci|prisioner|pp\.?\s?gg|dica|ginebra|patrimonio|cultural|templo|fuego|bombarde|armas?\b|qu[ií]mic|humanitari/i
const RE_AMBIENTE = /\bagua|r[ií]o|lago|bofedal|contamin|fauna|flora|caza|tala|[aá]rbol|ambient|vicu[nñ]a|parque|reserva natural/i
export function reglasTexto(ctx = {}) {
  return PROHIBE(ctx).filter((x) => RE_REGLAS.test(x) && !RE_AMBIENTE.test(x)).map((x) => `- ${punto(x)}`).join('\n')
}
export function ambienteTexto(ctx = {}) {
  return [...PROHIBE(ctx), ...OBLIGA(ctx)].filter((x) => RE_AMBIENTE.test(x)).map((x) => `- ${punto(x)}`).join('\n')
}
export function restriccionesTexto(ctx = {}) {
  return PROHIBE(ctx).filter((x) => !RE_REGLAS.test(x) && !RE_AMBIENTE.test(x)).map((x) => `- ${punto(x)}`).join('\n')
}
export function adicionalesTexto(ctx = {}) {
  const os = ordenDe(ctx)
  const g3 = g3De(ctx)
  const L = []
  const coord = lineas(os.coordinacion).filter((l) => !/(fecha|d[ií]a)\s+D\b|hora\s+H\b/i.test(l) || l.length > 60)
  if (coord.length) L.push(...coord.map((l) => `- ${punto(l)}`))
  for (const x of OBLIGA(ctx).filter((x) => !RE_AMBIENTE.test(x))) L.push(`- ${punto(x)}`)
  const pd = filasDe(g3.eventos)
    .map((f) => {
      const n = casilla(f, 'N° P.D.')
      const ev = sinCuentas(casilla(f, 'Evento crítico'))
      const dec = casilla(f, 'Decisión')
      const cri = casilla(f, 'Criterio')
      const ain = casilla(f, 'A.I.N.')
      if (!dec && !cri) return ''
      return `- Punto de decisión ${n || ''}${ev ? ` (${sinPunto(plano(ev))})` : ''}: ${cri ? `cuando ${minus(sinPunto(plano(cri)).replace(/^cuando\s+/i, ''))}` : ''}${dec ? `${cri ? ', ' : ''}${minus(sinPunto(plano(dec)))}` : ''}${ain ? ` (${plano(ain)})` : ''}.`
    })
    .filter(Boolean)
  if (pd.length) L.push(...pd)
  const pcs = (ctx.calco?.ops?.coordinacion || []).map((p) => limpio(p?.nom || p?.nombre || p?.etiqueta)).filter((n) => /^P\.?C\.?\s*-?\s*\d/i.test(n))
  if (pcs.length && !L.some((l) => /puntos? de contacto/i.test(l))) L.push(`- Puntos de contacto con las unidades adyacentes: ${pcs.join(', ')} (ver Anexo “A” Calco de Operaciones).`)
  return unicos(L).join('\n')
}
export function mcafVigentesTexto(ctx = {}) {
  return mcafTexto(ctx) ? `Las establecidas en el párrafo III.- A.- 2.- c.- y en el Anexo “${letraDe('Apoyo de Fuegos')}” Apoyo de Fuegos.` : ''
}
export function ensayoTexto(ctx = {}) {
  const co = g3De(ctx).controlOrden
  const L = []
  const gf = txt(guiaFinal(ctx).ensayos)
  const tipo = casilla(co, 'Tipo de ensayo')
  const quien = casilla(co, 'Quiénes participan', 'Quienes participan')
  if (tipo) L.push(`Tipo de ensayo: ${punto(plano(tipo))}`)
  if (quien) L.push(`Participan y cuándo: ${punto(plano(quien))}`)
  if (!L.length && gf) L.push(gf)
  return L.join('\n')
}
export function amenazaTexto(ctx = {}) {
  return txt(anexoG4(ctx).segar)
}
export function conceptoApoyoTexto(ctx = {}) {
  const c = ctx.calco || {}
  const L = []
  if (!vacio(c.misionLog)) L.push(punto(plano(c.misionLog)))
  const a4 = anexoG4(ctx)
  if (!vacio(a4.concepto)) L.push(txt(a4.concepto))
  else {
    const fases = c.fasesCOA?.propio || []
    // como en el PMTD: «El enfoque de apoyo logístico es de abastecimiento de clase III y V, la prioridad de apoyo a la…»
    const cc = (Array.isArray(c.conceptoApoyo) ? c.conceptoApoyo : []).map((x, i) => {
      if (!esObj(x) || (!(x.enfoque || []).length && !limpio(x.prioridad))) return ''
      const nom = limpio(x.nombre || fases[i]?.nombre).replace(/^FASE\s+[IVX\d]+\s*[—–:-]?\s*/i, '')
      const pri = limpio(x.prioridad)
      return `- FASE ${romano(i + 1)}${nom ? ` (${nom})` : ''}: el enfoque de apoyo logístico es de ${(x.enfoque || []).join(', ') || SIN_DATO}, la prioridad de apoyo ${!pri ? SIN_DATO : /^(a|al)\s/i.test(pri) ? pri : aLa(pri)}.`
    }).filter(Boolean)
    L.push(...cc)
  }
  const pri = sincro(ctx, 'APOYO DE SERVICIO DE COMBATE')
  if (pri.length && L.length < 3) L.push(...pri.map((x) => `- ${x}`))
  return L.join('\n')
}
export function logisticaTexto(ctx = {}) {
  const a4 = anexoG4(ctx)
  const L = [['abastecimiento', 'Abastecimiento'], ['mantenimientoA', 'Mantenimiento'], ['evacuacionA', 'Evacuación y hospitalización'], ['transporteA', 'Transporte'], ['epa', 'Eje Principal de Abastecimiento (EPA)'], ['epe', 'Eje Principal de Evacuación (EPE)']]
    .filter(([k]) => !vacio(a4[k]))
    .map(([k, t]) => `- ${t}: ${punto(plano(a4[k]))}`)
  return L.length ? [...L, `Ver Anexo “${letraDe('Servicio de Combate')}” Apoyo de Servicio de Combate.`].join('\n') : ''
}
export function personalTexto(ctx = {}) {
  const a1 = anexoG1(ctx)
  const L = [['concepto', 'Concepto de apoyo de personal'], ['efectivos', 'Efectivos'], ['reemplazos', 'Reemplazos'], ['ppgg', 'Prisioneros de guerra'], ['moral', 'Moral'], ['disciplina', 'Disciplina, ley y orden']]
    .filter(([k]) => !vacio(a1[k]))
    .map(([k, t]) => `- ${t}: ${punto(plano(a1[k]))}`)
  if (!L.length && !vacio(anexoG4(ctx).personal)) L.push(punto(plano(anexoG4(ctx).personal)))
  if (!L.length) {
    const b = (ctx.calco?.bajasPorFase || []).filter((x) => x && (x.total || x.r?.total))
    if (b.length) L.push(`Bajas previstas por fase (G-1): ${b.map((x, i) => `FASE ${romano(i + 1)}: ${Math.round(x.total || x.r?.total).toLocaleString('es')}`).join('; ')}.`)
  }
  return L.length ? [...L, `Ver Anexo “${letraDe('Personal')}” Personal.`].join('\n') : ''
}
export function asuntosCivilesTexto(ctx = {}) {
  const a5 = anexoG5(ctx)
  const L = [['evacuacion', 'Evacuación'], ['ejes', 'Ejes humanitarios'], ['instalaciones', 'Instalaciones de AC/GM'], ['recursosArea', 'Recursos del área'], ['manoObra', 'Mano de obra civil']]
    .filter(([k]) => !vacio(a5[k]))
    .map(([k, t]) => `- ${t}: ${punto(plano(a5[k]))}`)
  if (!L.length && !vacio(anexoG4(ctx).asuntosCiviles)) L.push(punto(plano(anexoG4(ctx).asuntosCiviles)))
  return L.length ? [...L, `Ver Anexo “${letraDe('Asuntos Civiles')}” Asuntos Civiles y Gobierno Militar.`].join('\n') : ''
}
// «a.- Comandante del CE-I. b.- Jefe de Estado Mayor del CE-I. c.- G-3 del CE-I. d.- Cmte. de la DIV MEC-2 (OD)…»
export function sucesionTexto(ctx = {}) {
  const u = unidadDe(ctx)
  if (!u) return ''
  const R = rolesDe(ctx)
  const de = articuloDe(u) === 'DEL' ? 'del' : 'de la'
  const sub = unidadesPropias(ctx).filter((x) => claseDe(x) === 'maniobra' && directa(ctx, x)).map(nombreDe).sort((a, b) => ORDEN_ROL(rolDe(R, a)) - ORDEN_ROL(rolDe(R, b)))
  const L = [`Comandante ${de} ${u}.`, `Jefe de Estado Mayor ${de} ${u}.`, `G-3 ${de} ${u}.`, ...sub.map((n) => `Comandante ${articulo(n) === 'El' ? 'del' : 'de la'} ${conRol(R, n)}.`)]
  return L.map((x, i) => `${String.fromCharCode(97 + i)}.- ${x}`).join('\n')
}
export function puestosComandoTexto(ctx = {}) {
  const u = unidadDe(ctx)
  const C = capAprobado(g3De(ctx), fasesCOA(ctx))
  const L = []
  const fuentes = [casilla(C.concepto, 'Medidas de control gráficas'), casilla(g3De(ctx).controlOrden, 'Medidas de control gráficas'), txt(ordenDe(ctx).comando)].join('\n')
  const frases = fuentes.split(/(?<=[.;])\s+|\n|,\s*(?=P\.?C\.?\s)/).map(limpio).filter((f) => /\bP\.?C\.?\s*(P|A|R)\b|Puesto[s]? (de )?(Mando|Comando)|PC (Principal|Alterno|Retrasado|Avanzado)/i.test(f) && !/^(Punto|PC-\d)/i.test(f))
  L.push(...unicos(frases).map((f) => `- ${punto(f.replace(/^Puestos de Mando:\s*/i, ''))}`))
  const coord = typeof ctx.coordenada === 'function' ? ctx.coordenada : null
  const pcs = (Array.isArray(ctx.calco?.unidades) ? ctx.calco.unidades : []).filter((x) => x?.tipo === 'pc' && !esEnemiga(x) && Number.isFinite(+x.lat) && Number.isFinite(+x.lng))
  const carta = cartaDe(ctx)
  for (const p of pcs) {
    const n = nombreDe(p)
    let donde = ''
    try {
      donde = describirFases([{ unidades: [{ ...p, tipo: 'unidad' }] }], { nomenclator: carta.nomenclator || [] })[0]?.final?.[0]?.donde || ''
    } catch {}
    const c = coord ? coord([+p.lng, +p.lat]) : ''
    const es = u && mismaUnidad(n, u) ? `PC ${articuloDe(u) === 'DEL' ? 'del' : 'de la'} ${u}` : `PC ${n}`
    if (!L.some((l) => norm(l).includes(norm(n)) && /pc/i.test(l))) L.push(`- ${es}: ${[donde.replace(/^en\s+/, ''), c ? `Coord. ${c}` : ''].filter(Boolean).join(', ') || 'ubicado en el calco'}.`)
  }
  return L.join('\n')
}
export function iocTexto(ctx = {}) {
  const os = ordenDe(ctx)
  const L = []
  if (!vacio(os.comunicaciones)) L.push(txt(os.comunicaciones))
  const sil = lineas(os.coordinacion).filter((l) => /silencio|IOC|IEC|radial|radioel/i.test(l))
  if (sil.length && !L.length) L.push(...sil.map(punto))
  return L.join('\n')
}
export function prioridadComTexto(ctx = {}) {
  return sincro(ctx, 'C2').map((x) => `- ${x}`).join('\n')
}

// Todo lo de 🌱: { campos: { [id]: texto } }. Nunca pisa: el motor llena sólo lo vacío.
export function propuestas(ctx = {}) {
  const campos = {}
  const poner = (id, f) => {
    try {
      const t = typeof f === 'function' ? f(ctx) : f
      if (!vacio(t)) campos[id] = texto(conCoordenadas(t))
    } catch {}
  }
  poner('objeto', objetoTexto)
  poner('cartas', () => plano(ordenDe(ctx).carta))
  poner('anexos', () => (unidadDe(ctx) ? ANEXOS_PMTD.join('\n') : ''))
  poner('orgTarea', organizacionTexto)
  poner('enemigo', enemigoTexto)
  poner('caeProbable', caeProbableTexto)
  poner('caePeligroso', caePeligrosoTexto)
  poner('propias', propiasTexto)
  poner('refuerzos', refuerzosTexto)
  poner('mision', misionTexto)
  poner('intencion', intencionTexto)
  poner('concepto', conceptoTexto)
  poner('maniobra', maniobraTexto)
  poner('fuegos', fuegosTexto)
  poner('artilleria', artilleriaTexto)
  poner('mcaf', mcafTexto)
  poner('reconocimiento', reconocimientoTexto)
  poner('inteligencia', inteligenciaTexto)
  poner('ingenieros', ingenierosTexto)
  poner('antiaerea', antiaereaTexto)
  poner('policiaMilitar', policiaTexto)
  poner('acgm', acgmTexto)
  poner('tareasManiobra', () => tareasTexto(ctx, 'maniobra'))
  poner('tareasApoyo', () => tareasTexto(ctx, 'apoyo'))
  poner('vigencia', vigenciaTexto)
  const r = (() => {
    try {
      return rcicDe(ctx)
    } catch {
      return {}
    }
  })()
  poner('rpi', r.rpi)
  poner('rifa', r.rifa)
  poner('eeia', r.eeia)
  poner('riesgos', riesgosTexto)
  poner('reglas', reglasTexto)
  poner('ambiente', ambienteTexto)
  poner('adicionales', adicionalesTexto)
  poner('mcafVigentes', mcafVigentesTexto)
  poner('ensayo', ensayoTexto)
  poner('amenazaRetaguardia', amenazaTexto)
  poner('restricciones', restriccionesTexto)
  poner('servicio', () => (unidadDe(ctx) ? `Ver Anexo “${letraDe('Servicio de Combate')}” Apoyo de Servicio de Combate.` : ''))
  poner('conceptoApoyo', conceptoApoyoTexto)
  poner('logistica', logisticaTexto)
  poner('personal', personalTexto)
  poner('asuntosCiviles', asuntosCivilesTexto)
  poner('comando', () => (unidadDe(ctx) ? `Ver Anexo “${letraDe('Comunicaciones')}” Comunicaciones.` : ''))
  poner('sucesion', sucesionTexto)
  poner('puestosComando', puestosComandoTexto)
  poner('ioc', iocTexto)
  poner('prioridadCom', prioridadComTexto)
  return { campos }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// LA DOCTRINA (va a la IA)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
export const DOCTRINA = [
  `${FUENTE}. «Los planes y las órdenes son los medios que emplea el Comandante para expresar a sus subordinados su visualización del campo de batalla, intención y decisiones… Deben proporcionar el qué en vez del cómo con el objeto de alentar la iniciativa.» Todos los planes y órdenes: tienen CINCO PÁRRAFOS; proporcionan la organización táctica y el esquema de maniobra; una declaración clara y concisa de la misión, con la fecha y hora de ejecución; transmiten la intención y el concepto de la operación del Comandante; generalmente incluyen un calco y los anexos necesarios.`,
  'Características (PMTD 2017, Cap. VII, IV): las ÓRDENES de operaciones NO indican suposiciones (sólo los planes). Expresión de carácter IMPOSITIVO: redacción directa, sin lugar a dudas de lo que el Comandante desea. Expresión POSITIVA («Los trenes de combate permanecerán en el área de reunión», no «no acompañarán»). Evitar expresiones no pertinentes: no «trate de controlar», sino «controle hasta»; no «atacará» ni «retardará mientras mantiene contacto», sino «ataca», «retarda». Simplicidad, brevedad (no repetir lo que está en los PON), CLARIDAD (términos y gráficas doctrinales), CABALIDAD (medidas de control completas, relaciones de mando y apoyo claras, responsabilidades asignadas de acuerdo con la intención), coordinación (contacto entre subordinados, apoyo mutuo, evitar el fratricidio) y flexibilidad.',
  'LA MISIÓN (PMTD 2017, Análisis de la Misión, paso 11 «Re expresión de la misión»): debe contener todos los elementos de un enunciado de la misión — QUIÉN (la Unidad que ejecutará la operación), QUÉ (el tipo de operación que realizará —ataca, defiende— y la tarea esencial seleccionada en el análisis, el efecto que se busca lograr, expresado como una tarea táctica: destruye, fija, canaliza, bloquea…), CUÁNDO (la oportunidad de ejecución en términos de tiempo: desde el D-2 hasta el D+3, con orden, fecha…), DÓNDE (AO, objetivos, coordenadas) y el PROPÓSITO (el porqué de la operación). Se escribe en UNA oración y EN ESE ORDEN, sin agregados («reteniendo…», «sin permitir…», «manteniendo…»). Ejemplo del PMTD: «La Div-2, defiende y destruye al batallón de tanques a partir del D(0600) hasta D+6 (1800) al sud de la LF. ÁGUILA con el propósito de permitir a la DBL-22 ejecutar el contraataque y destruir al Regimiento de tanques de Rojo en el AE. LEÓN.» Otro del PMTD: «La Div – 2, defiende y bloquea a la DIMEC – 56 de ROJO, a partir del día D hora H hasta el día D H + 10, delante de la LF TORO en su sector de responsabilidad, con el propósito de impedir la progresión del enemigo hacia TAMENGO y posibilitar su destrucción por parte de la Primera Brigada Blindada desde el sudoeste.» En la Orden es la TRANSCRIPCIÓN de la misión aprobada por el Comandante (si está desordenada, se la ordena: quién, qué, cuándo, dónde, propósito).',
  'LA INTENCIÓN DEL COMANDANTE (PMTD 2017, paso 14 y la Hoja de trabajo de la Intención): enunciado claro y conciso de lo que la fuerza debe desempeñar para tener éxito en relación con el terreno, el enemigo y el estado final deseado; el ENLACE entre la misión y el concepto; no entra en el «cómo». Se compone de: 1) PROPÓSITO — un propósito más amplio que el porqué de la operación inmediata (en los niveles tácticos inferiores puede ser el mismo propósito de la misión); 2) TAREAS CLAVE y/o CONDICIONES — las que la fuerza necesariamente debe desempeñar para alcanzar el propósito (el ritmo, la duración, el efecto sobre el enemigo, el terreno que se debe controlar…); 3) ESTADO FINAL — CÓMO QUEDA LA PROPIA FUERZA (eficiencia combativa, ubicación, efectivos), CÓMO QUEDA EL ENEMIGO (bajas, potencia de combate, ubicación) y la OPERACIÓN FUTURA. Pero NO se escribe con esos rótulos ni numerada: «debe ser redactada en forma inextensa de la siguiente manera»: «Mi intención es facilitar la destrucción de la FT-43 en el AE. YUNQUE por parte de la FT CALAMA y de esta manera evitar la conquista de VIACHA y VILLA BOLÍVAR, para esto es clave inicialmente, aprovechar al máximo las características del terreno en los trabajos de OT, de manera de lograr el grado de protección y el efecto deseado contra el fuego y la maniobra del enemigo, efectuar y terminar el recibimiento de las Unidades del GRM-I por el PP-B antes del D(0400), de manera que dicha operación no sufra interferencia con el ataque enemigo, asimismo es importante seleccionar y disponer de sectores de tiro adecuados que permitan optimizar los fuegos de apoyo a la FT INGAVI, coordinando la dirección y el traslado de nuestros fuegos con la mencionada Unidad, para la canalización considero que debemos realizar un retardo a la FT-43, mostrando un frente débil evitando que estas Unidades evadan las acciones en el AE YUNQUE y se dirijan hacia el Sector de responsabilidad de la Div-2.» y, en otro párrafo, «Al finalizar la operación, la FT “LANZA” se encontrará ocupando posiciones en Coord. 7600-4400, con eficiencia combativa, el RIMEC-6 habrá sido destruido por la FT “INGAVI” y las Unidades de la FT-43 se encontrarán comprometidas en el AE. “YUNQUE”, encontrándose nuestra Unidad en condiciones de realizar operaciones ofensivas con orden.»',
  'EL CONCEPTO DE LA OPERACIÓN (PMTD 2017, Desarrollo de los CAP, paso 4, y Cap. VII): describe cómo las fuerzas dispuestas cumplirán la intención del Comandante; trata la operación decisiva y las de configuración, designa el esfuerzo principal para cada fase e incluye las misiones «estar preparado». Abarca, en este orden y un renglón por idea: «Vamos a cumplir la misión… (forma de maniobra / forma defensiva). El punto decisivo es … porque …» · «Un (Batallón, Compañía…) Operación decisiva, esfuerzo principal, (tarea / propósito)» · «Una … (Op. Configuración 1), esfuerzo secundario, (tarea / propósito)» (una por cada una) · la reserva · «El propósito de los fuegos de artillería es…» · «El propósito del apoyo de defensa aérea…» · «El propósito del esfuerzo de ingenieros es…» · «La operación de sostenimiento (tarea / propósito)» · «La misión se ejecutará en las siguientes fases:» · el estado final deseado. Ejemplo del PMTD (el enunciado del CAP de la Div-2): «La operación se cumple mediante una defensa tenaz, el punto decisivo es el bloqueo en la parte central de la posición defensiva (Co. TUNARI) para impedir al BIM. (OD.) de la DIMEC – 56 y evitar la conquista de las elevaciones de Co. TUNARI y la conquista de O1 (TAMENGO). / Una Fuerza de Tarea fuerte en Infantería (OD y esfuerzo principal) defiende y bloquea al BIM (OD) de la DIMEC – 56, con el propósito de evitar la conquista de Co. TUNARI. / Una Fuerza de Tarea de Infantería (OC1 y esfuerzo secundario), defiende y controla Co. KHISKA LOMA, con el propósito de evitar la conquista de Co. KHISKA LOMA por parte del BIM. OC 1 de ROJO. / Una Fuerza de Tarea de Infantería (OC2 y esfuerzo secundario), defiende y controla Co. OTUKIS, con el propósito de evitar la conquista de Co. OTUKIS por el BIM. OC2 de ROJO. / Una Fuerza de Tarea (OC3) constituye la reserva, encontrándose en condiciones de ser empleada con orden, con prioridad de planeamiento a la OD. y posteriormente a OC1 y OC2. / El propósito del apoyo de fuegos es suprimir el ataque del enemigo y evitar su progresión hacia O1 (TAMENGO). / La prioridad de esfuerzo de ingeniería será la construcción de obstáculos de contra movilidad en los corredores de movilidad e impedir al Enemigo dirigirse hacia TAMENGO, la prioridad de trabajo será para la Unidad que lleve la OD. / El Batallón Logístico (operación de sostenimiento), tiene la tarea de proporcionar apoyo de servicio de combate con el propósito de satisfacer las necesidades de vida y de combate de las Unidades empeñadas en primera línea. / La operación se desarrollará en las siguientes fases: Primera fase: Ocupación y Organización de la Posición defensiva. Segunda fase: Defensa de la Posición Defensiva. Tercera fase: Reorganización. / Al finalizar la operación las Unidades de primera línea de la Div-2 se encontrarán manteniendo sus posiciones defensivas sobre Co. OTUQUIS – Co. KHISKA LOMA – Co. TUNARI, habiéndose imposibilitado la progresión de DIMEC – 56 de ROJO hacia TAMENGO, encontrándonos en condiciones de continuar operaciones ofensivas en coordinación con la Div-1.» (cada «/» es un renglón aparte).',
  'LOS SUBPÁRRAFOS DEL CONCEPTO (PMTD 2017, la guía del enunciado del curso de acción y el ejemplo de la Div-2), con la forma de cada uno: 1.- MANIOBRA, «(UNIDADES DE MANIOBRA POR FASES) Para cada Unidad: Tarea, Propósito»: «Fase I: Ocupación y organización de la PD. Las Unidades de Combate, de apoyo de combate y apoyo de servicios de combate se desplazan desde su actual ZR (ARUBA) por el ITIN ROJO con el propósito de ocupar y organizar la PD. Fase II: Defensa de la Posición Defensiva. La Fuerza de Tarea VARGAS fuerte en Infantería (OD y esfuerzo principal) defiende y bloquea al BIM (OD) de la DIMEC – 56, con el propósito de evitar la conquista de Co. TUNARI. La Fuerza de Tarea IBARRA (OC1 y esfuerzo secundario), defiende y controla Co. KHISKA LOMA, con el propósito de… La Fuerza de Tarea LANDA (OC3) constituye la reserva, encontrándose en condiciones de ser empleada con orden, con prioridad de planeamiento a la OD. y posteriormente a OC1 y OC2.» y al final el RIESGO: «Se asume como riesgo que el flanco norte se encuentre desprotegido, debido al empeñamiento de nuestras Unidades en el frente de operaciones y el flanco sur.» (y cómo se mitiga). 2.- APOYO DE FUEGOS (Tarea: destruir, neutralizar, suprimir; Propósito; Método: prioridades, asignaciones, restricciones; Efecto: cuantificado), en un párrafo: «Los medios de apoyo de fuegos tienen la tarea de suprimir a las Unidades del primer y segundo escalón de ataque la DIMEC – 56, con el propósito de evitar su progresión ordenada y sostenida hacia TAMENGO, el método: la prioridad de apoyo de fuegos a la Fuerza de Tarea VARGAS (OD) se asigna los blancos AB-001, 002, 003, restricciones: el AFR 1 y 2, el efecto será lograr impedir el avance de la DIMEC – 56 por la avenida de aproximación No. 1.» Luego a.- Apoyo aéreo (misiones de AAC por unidad), b.- Apoyo de artillería de campaña (prioridad de fuego, prioridad para la adquisición de blancos, restricciones y la Organización de la Artillería para el Combate: «RAC-21/CE-I : AG CE-I»), c.- Medidas de coordinación (permisivas y restrictivas). 5.- INGENIEROS (Prioridad de esfuerzo: movilidad, contramovilidad, supervivencia; Prioridad de trabajo: a qué Unidad apoya): «La prioridad de esfuerzo es de contra movilidad mediante la construcción de fajas de minas; campos minados, alambradas, la prioridad de trabajo a la Fuerza de Tarea VARGAS (OD).» 6.- DEFENSA ANTIAÉREA (Tarea, Propósito, Prioridad de apoyo): «La tarea de los medios de ADA es destruir vectores aéreos de ROJO, con el propósito de proporcionar cobertura a las operaciones Terrestres la prioridad de apoyo a la Fuerza de Tarea VARGAS (OD).», con los niveles de alerta (ROJA: ataque inminente; AMARILLA: ataque probable; VERDE: ataque improbable). 4.- INTELIGENCIA (Enfoque de recopilación: ¿a qué está dirigida?; Prioridad de apoyo: ¿a qué Unidad?; Recursos: ¿con qué medios?): «El enfoque de recopilación de inteligencia está dirigido a determinar el dispositivo de ataque de la DIMEC – 56 y las rutas alternas que pueda emplear hacia TAMENGO en nuestra área de operaciones. La prioridad de apoyo a la Fuerza de Tarea VARGAS (OD). Los recursos son las Secciones de Reconocimiento y Exploración de las Compañías Comando y Servicios de las Unidades de Maniobra.» SOSTENIMIENTO (va en IV.- A.- Concepto de apoyo; Enfoque de apoyo logístico y Prioridad de apoyo, por fase): «El enfoque de apoyo logístico es de abastecimiento de clase III y V, la prioridad de apoyo a la FT VARGAS (OD), FT IBARRA (OC1), FT ROJAS (OC2).»',
  'EL ESQUEMA DE MANIOBRA (PMTD 2017): «El enunciado de los cursos de acción se convierte en la base del párrafo III A 1 (Maniobra) del Plan u Orden de Operaciones y el bosquejo del curso de acción se convierte en la base del Calco de Operaciones.» En la Orden cada Unidad va con su DESIGNACIÓN real («La Fuerza de Tarea VARGAS…», «La DIV MEC-2…»), fase por fase, con su tarea y su propósito; es consistente con el calco y no duplica las tareas a las unidades.',
  'TAREAS A LAS UNIDADES (Cap. VII, III.- B.- y C.-): «Exprese, mediante la emisión de órdenes, las misiones o tareas asignadas a cada Unidad de maniobra que depende directamente del comando de Unidad. Utilice un subpárrafo separado para cada Unidad… Enumere las Unidades en secuencia de la organización establecida. Incluya las reservas.» En la Mesa se escriben FASE POR FASE y, en cada fase, TODAS las Unidades dependientes con las que se cuenta, cada una con su TAREA y su PROPÓSITO, uno por renglón: «FASE I: OCUPACIÓN Y ORGANIZACIÓN DE LA PD.» / «1.- FT VARGAS (OD).» / «TAREA: Se desplaza a la PD.» / «PROPÓSITO: Ocupar la PD.» / «2.- FT IBARRA (OC1).» / «TAREA: …» / «PROPÓSITO: …» … y lo mismo en la FASE II, la FASE III… Las de apoyo de combate (III.- C.-), con la misma forma.',
  'INSTRUCCIONES DE COORDINACIÓN: las que aplican a dos o más unidades; los RCIC SOLAMENTE en «Información esencial requerida por el Comandante», nunca en los anexos: a.- RPI (sobre el ENEMIGO, el TERRENO, las CONDICIONES METEOROLÓGICAS y las CC.MM.) y b.- RIFA (sobre las PROPIAS FUERZAS), uno por renglón. Son los que cada miembro del Estado Mayor desarrolló «desde sus respectivos campos de responsabilidad» (paso 8 del Análisis de la Misión) y presentó al Comandante: se transcriben los que ya determinó cada sección, en el orden de prioridad que les dio el Comandante (la doctrina pide limitarlos a diez o menos: eso lo decide el Comandante). La Matriz de riesgo aporta las medidas de control para la reducción de riesgos.',
  'ANEXOS (Cap. VII, V): en una ORDEN llevan el nombre del sistema (Anexo «B» Inteligencia; en un PLAN, «Plan de Inteligencia»); los numera la Sección III según el orden en que la Orden los menciona. Los de una unidad de maniobra (Tabla 28 del PMTD): Organización de la Tarea / Calco de Operaciones, Inteligencia, Apoyo de Fuegos, Defensa Antiaérea, Ingeniería, Apoyo de Servicio de Combate (o Logística, Personal y AC/GM por separado), Comunicaciones, Engaño. Los anexos tienen CONCEPTO DE APOYO, no intención.',
  'Encabezado del modelo: (CLASIFICACIÓN) · Unidad Superior · Unidad Considerada, PC., lugar, fecha y hora · EM./Sec. III Ops. · No. / Clave · ORDEN DE OPERACIONES No. … · OBJETO, CARTA, ANEXOS · ORGANIZACIÓN DE LA TAREA · I.- a V.- · EL COMANDANTE DE UNIDAD · Autenticación (JEM, G-3) · Distribución. El membrete, la numeración, la firma, la autenticación y la distribución los pone la Mesa.',
]
export const doctrinaParaIA = () => DOCTRINA.map((x) => `- ${x}`).join('\n')

// El nivel de detalle y la FORMA que se espera, con los ejemplos del TEXTO PMTD 2017 (la Div-2 en TAMENGO y la FT
// «LANZA») para la misión, la intención, el concepto, la maniobra y las tareas, y la OGO del CE-I «KILÓMETRO 7» (ejercicio
// de la Escuela: AZUL contra MAGENTA) para la situación, la coordinación y los párrafos IV y V. La IA no copia sus
// unidades, sus lugares ni sus cifras.
export const EJEMPLO = `EJEMPLO DE REDACCIÓN — con los ejemplos del TEXTO PMTD 2017 (la Div-2 contra la DIMEC-56 de ROJO en TAMENGO; la FT «LANZA») y la ORDEN GENERAL DE OPERACIONES No. 01/21 del CE-I «KILÓMETRO 7» (AZUL contra MAGENTA): son OTROS ejercicios. Copiá la FORMA, el ORDEN de cada párrafo y el TONO; nunca sus unidades, sus lugares ni sus cifras.

I.- SITUACIÓN. A.- Fuerzas enemigas. … Curso de Acción del Enemigo más probable (KM 7).
«Fuerzas del EO de MAGENTA del valor de hasta 16 Batallones, atacan y derrotan a las Fuerzas defensivas de AZUL, a partir del D (0400), progresando sobre su posición por dos ejes de penetración… Para esto, abandonará su zona de apresto lejano HUACHACALLA… La DE-VI ocupará su posición de ataque al norte de Co. LLALLAGUANI… Las Brigadas de la DE-I atacan por la AA-1 y conquistan Co. TUSQUI…, con el propósito de ganar terreno que permita conquistar Co. CHIVO… El propósito de los ingenieros de combate es abrir brechas… Los fuegos suprimirán las fuerzas blindadas de contraataque de AZUL… El propósito de la defensa aérea es evitar el Apoyo Aéreo Cercano… Al finalizar la operación las fuerzas de AZUL habrán sido derrotadas en sus posiciones, MAGENTA habrá conquistado y controlado la PAMPA DE LOS CHIVOS…»

B.- Fuerzas propias (KM 7). 1.- CTO. a.- Misión. b.- Intención del Comandante del CTO. 2.- FFTTTO. a.- Misión. b.- Intención del Comandante de las FF.TT.TO. c.- Concepto de la Operación (con sus fases y el papel de cada CE).

II.- MISIÓN — QUIÉN, QUÉ, CUÁNDO, DÓNDE y PROPÓSITO, en ese orden y en UNA oración (PMTD):
«La Div – 2, defiende y bloquea a la DIMEC – 56 de ROJO, a partir del día D hora H hasta el día D H + 10, delante de la LF TORO en su sector de responsabilidad, con el propósito de impedir la progresión del enemigo hacia TAMENGO y posibilitar su destrucción por parte de la Primera Brigada Blindada desde el sudoeste.»

III.- EJECUCIÓN. Intención del Comandante — en forma inextensa, SIN rótulos: el propósito y las tareas clave en un párrafo, el estado final (propia fuerza, enemigo, operación futura) en otro (PMTD):
«Mi intención es facilitar la destrucción de la FT-43 en el AE. YUNQUE por parte de la FT CALAMA y de esta manera evitar la conquista de VIACHA y VILLA BOLÍVAR, para esto es clave inicialmente, aprovechar al máximo las características del terreno en los trabajos de OT, de manera de lograr el grado de protección y el efecto deseado contra el fuego y la maniobra del enemigo, efectuar y terminar el recibimiento de las Unidades del GRM-I por el PP-B antes del D(0400), de manera que dicha operación no sufra interferencia con el ataque enemigo, asimismo es importante seleccionar y disponer de sectores de tiro adecuados que permitan optimizar los fuegos de apoyo a la FT INGAVI, coordinando la dirección y el traslado de nuestros fuegos con la mencionada Unidad, para la canalización considero que debemos realizar un retardo a la FT-43, mostrando un frente débil evitando que estas Unidades evadan las acciones en el AE YUNQUE y se dirijan hacia el Sector de responsabilidad de la Div-2.
Al finalizar la operación, la FT “LANZA” se encontrará ocupando posiciones en Coord. 7600-4400, con eficiencia combativa, el RIMEC-6 habrá sido destruido por la FT “INGAVI” y las Unidades de la FT-43 se encontrarán comprometidas en el AE. “YUNQUE”, encontrándose nuestra Unidad en condiciones de realizar operaciones ofensivas con orden.»

A.- Concepto de la operación — un renglón por idea (PMTD):
«La operación se cumple mediante una defensa tenaz, el punto decisivo es el bloqueo en la parte central de la posición defensiva (Co. TUNARI) para impedir al BIM. (OD.) de la DIMEC – 56 y evitar la conquista de las elevaciones de Co. TUNARI y la conquista de O1 (TAMENGO).
Una Fuerza de Tarea fuerte en Infantería (OD y esfuerzo principal) defiende y bloquea al BIM (OD) de la DIMEC – 56, con el propósito de evitar la conquista de Co. TUNARI.
Una Fuerza de Tarea de Infantería (OC1 y esfuerzo secundario), defiende y controla Co. KHISKA LOMA, con el propósito de evitar la conquista de Co. KHISKA LOMA por parte del BIM. OC 1 de ROJO.
Una Fuerza de Tarea de Infantería (OC2 y esfuerzo secundario), defiende y controla Co. OTUKIS, con el propósito de evitar la conquista de Co. OTUKIS por el BIM. OC2 de ROJO.
Una Fuerza de Tarea (OC3) constituye la reserva, encontrándose en condiciones de ser empleada con orden, con prioridad de planeamiento a la OD. y posteriormente a OC1 y OC2.
El propósito del apoyo de fuegos es suprimir el ataque del enemigo y evitar su progresión hacia O1 (TAMENGO).
La prioridad de esfuerzo de ingeniería será la construcción de obstáculos de contra movilidad en los corredores de movilidad e impedir al Enemigo dirigirse hacia TAMENGO, la prioridad de trabajo será para la Unidad que lleve la OD.
El Batallón Logístico (operación de sostenimiento), tiene la tarea de proporcionar apoyo de servicio de combate con el propósito de satisfacer las necesidades de vida y de combate de las Unidades empeñadas en primera línea.
La operación se desarrollará en las siguientes fases:
FASE I: OCUPACIÓN Y ORGANIZACIÓN DE LA POSICIÓN DEFENSIVA.
FASE II: DEFENSA DE LA POSICIÓN DEFENSIVA.
FASE III: REORGANIZACIÓN.
Al finalizar la operación las Unidades de primera línea de la Div-2 se encontrarán manteniendo sus posiciones defensivas sobre Co. OTUQUIS – Co. KHISKA LOMA – Co. TUNARI, habiéndose imposibilitado la progresión de DIMEC – 56 de ROJO hacia TAMENGO, encontrándonos en condiciones de continuar operaciones ofensivas en coordinación con la Div-1.»

1.- Maniobra — fase por fase, cada Unidad con su designación, su tarea y su propósito; al final el riesgo (PMTD):
«FASE I: OCUPACIÓN Y ORGANIZACIÓN DE LA PD.
Las Unidades de Combate, de apoyo de combate y apoyo de servicios de combate se desplazan desde su actual ZR (ARUBA) por el ITIN ROJO con el propósito de ocupar y organizar la PD.
FASE II: DEFENSA DE LA POSICIÓN DEFENSIVA.
La Fuerza de Tarea VARGAS fuerte en Infantería (OD y esfuerzo principal) defiende y bloquea al BIM (OD) de la DIMEC – 56, con el propósito de evitar la conquista de Co. TUNARI.
La Fuerza de Tarea IBARRA (OC1 y esfuerzo secundario), defiende y controla Co. KHISKA LOMA, con el propósito de evitar la conquista de Co. KHISKA LOMA por parte del BIM. OC 1 de ROJO.
La Fuerza de Tarea ROJAS (OC2 y esfuerzo secundario), defiende y controla Co. OTUKIS, con el propósito de evitar la conquista de Co OTUKIS por el BIM (OC2) de ROJO.
La Fuerza de Tarea LANDA (OC3) constituye la reserva, encontrándose en condiciones de ser empleada con orden, con prioridad de planeamiento a la OD. y posteriormente a OC1 y OC2.
Se asume como riesgo que el flanco norte se encuentre desprotegido, debido al empeñamiento de nuestras Unidades en el frente de operaciones y el flanco sur.»

2.- Apoyo de fuegos — tarea, propósito, método y efecto en un párrafo (PMTD):
«Los medios de apoyo de fuegos tienen la tarea de suprimir a las Unidades del primer y segundo escalón de ataque la DIMEC – 56, con el propósito de evitar su progresión ordenada y sostenida hacia TAMENGO, el método: la prioridad de apoyo de fuegos a la Fuerza de Tarea VARGAS (OD) se asigna los blancos AB-001, 002, 003, restricciones: el AFR 1 y 2, el efecto será lograr impedir el avance de la DIMEC – 56 por la avenida de aproximación No. 1.»
b.- Apoyo de artillería de campaña (KM 7): «1) Prioridad de fuego. En la FASE I a la OC-3. En la fase II a la OC-1 y OC-2… 2) Prioridad para la adquisición de blancos. Instalaciones de mando y control. Unidades de Artillería de Campaña… 3) Restricciones. AFP todas las poblaciones… 4) Organización de la Artillería para el Combate. RAC-21/CE-I : AG CE-I; GAC-I/DIMEC-1 : AD DIMEC-1…»

4.- Inteligencia (PMTD): «El enfoque de recopilación de inteligencia está dirigido a determinar el dispositivo de ataque de la DIMEC – 56 y las rutas alternas que pueda emplear hacia TAMENGO en nuestra área de operaciones. La prioridad de apoyo a la Fuerza de Tarea VARGAS (OD). Los recursos son las Secciones de Reconocimiento y Exploración de las Compañías Comando y Servicios de las Unidades de Maniobra.»
5.- Ingenieros (PMTD): «La prioridad de esfuerzo es de contra movilidad mediante la construcción de fajas de minas; campos minados, alambradas, la prioridad de trabajo a la Fuerza de Tarea VARGAS (OD).»
6.- Defensa antiaérea (PMTD): «La tarea de los medios de ADA es destruir vectores aéreos de ROJO, con el propósito de proporcionar cobertura a las operaciones Terrestres la prioridad de apoyo a la Fuerza de Tarea VARGAS (OD).»

B.- Tareas de las unidades de maniobra — fase por fase, TODAS las Unidades dependientes (con la reserva), cada una con TAREA y PROPÓSITO, un renglón cada uno:
«FASE I: OCUPACIÓN Y ORGANIZACIÓN DE LA PD.
1.- FT VARGAS (OD).
TAREA: Se desplaza desde la ZR ARUBA por el ITIN ROJO a la PD.
PROPÓSITO: Ocupar y organizar la PD en Co. TUNARI.
2.- FT IBARRA (OC1).
TAREA: Se desplaza desde la ZR ARUBA por el ITIN ROJO a la PD.
PROPÓSITO: Ocupar y organizar la PD en Co. KHISKA LOMA.
3.- FT ROJAS (OC2).
TAREA: …
PROPÓSITO: …
4.- FT LANDA (OC3).
TAREA: …
PROPÓSITO: …
FASE II: DEFENSA DE LA POSICIÓN DEFENSIVA.
1.- FT VARGAS (OD).
TAREA: Defiende y bloquea al BIM (OD) de la DIMEC – 56.
PROPÓSITO: Evitar la conquista de Co. TUNARI.
2.- FT IBARRA (OC1).
TAREA: Defiende y controla Co. KHISKA LOMA.
PROPÓSITO: Evitar la conquista de Co. KHISKA LOMA por parte del BIM OC1 de ROJO.
… (cada Unidad, en cada fase)»

C.- Tareas de las unidades de apoyo de combate — con la misma forma, fase por fase:
«FASE II: DEFENSA DE LA POSICIÓN DEFENSIVA.
1.- RAC-21.
TAREA: Suprime las amenazas de MAGENTA sobre los puntos de pasaje 1, 2, 3 y 4 mediante fuegos de concentración.
PROPÓSITO: …
2.- BATING-XXIII.
TAREA: Proporciona apoyo de contramovilidad mediante la construcción de zanjas antitanque.
PROPÓSITO: …»

D.- Instrucciones de coordinación (KM 7). «1.- La presente orden entra en vigor a partir de su emisión. 2.- Requerimientos críticos de información del comandante: a.- RPI: 1) ¿Por dónde lleva el enemigo su esfuerzo principal? 2) ¿Cuándo empleará MAGENTA sus helicópteros de ataque?… b.- RIFA: 1) Informar cuándo la FT-32 RIOS concluya su repliegue. 2) Informar cuando las UU. de maniobra bajen 10, 15 y 20 % de su eficiencia combativa… (uno por renglón) 4.- Medidas de control para la reducción de riesgos: a.- Los contraataques deberán disponer de rutas previamente establecidas… 9.- Límite de Avance de las tropas: a.- FT-32 RIOS: Camino SANTUARIO DE QUILLACAS – TAMBO TAMBILLO… 11.- Medidas de fuego indirecto: a.- Permisivas: 1) LCAF sobre el camino AROMA – PAMPA AULLAGAS… b.- Restrictivas: 1) Áreas de fuego prohibido: Ecia. KIVILLANIK (Coord 9940 – 6330)… 12.- La ejecución del ensayo de comprobación y repetición de órdenes se realizará el D-1 (0600) en el PCP del CE-I Ecia SUMA. 13.- El nivel de amenaza actual en el área de retaguardia es Nivel II.»

IV.- APOYO DE SERVICIO. A.- Concepto de apoyo (PMTD): «El enfoque de apoyo logístico es de abastecimiento de clase III y V, la prioridad de apoyo a la FT VARGAS (OD), FT IBARRA (OC1), FT ROJAS (OC2).» (por fase si cambia). B.- Personal (KM 7): «… Instalará y operará un puesto de reunión de PP.GG. en COROMA (Coord. 2950 – 3950). La prioridad de apoyo de reemplazos a la OD, OC-1 y OC-2, en ese orden a partir del D-1 (0800).»

V.- COMANDO Y COMUNICACIONES (KM 7). «A.- Comando. 1.- Cadena de Mando: a.- Comandante del CE-I. b.- Jefe de Estado Mayor del CE-I. c.- G-3 del CE-I. d.- Cmte. de DIBLIND-3… 2.- Ubicación del Puesto Comando: a.- PCA. del CE-I Ecia. ICHALULA (Coord. 9490 – 5410). b.- PCP. … c.- PCR. … B.- Comunicaciones. 1.- IEC «ANGEL» en vigor a partir del día D-5 (1800). 2.- Centro de Comunicaciones: CC. Adelantado…, CC. Principal…, CC. Retrasado…»`


// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// LA IA: lo que la Mesa ya sabe, ordenado para la Orden
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
export function datosParaIA(ctx = {}) {
  const B = []
  const add = (t, x) => !vacio(x) && B.push(`## ${t}\n${texto(x)}`)
  const os = ordenDe(ctx)
  add('La Orden del escalón superior (lo que la Mesa leyó de ella)', [['Escalón superior', os.escalonSuperior], ['Unidad considerada', unidadDe(ctx)], ['Carta', os.carta], ['Fuerzas enemigas', os.enemigo], ['Fuerzas propias', os.propias], ['Refuerzos', os.refuerzos], ['Misión de nuestra unidad', os.mision], ['Tareas de nuestra unidad', os.tareas], ['Intención del escalón superior', os.intencion], ['Concepto del escalón superior', os.concepto], ['Coordinación', os.coordinacion], ['Comando', os.comando], ['Comunicaciones', os.comunicaciones]].filter(([, x]) => !vacio(x)).map(([k, x]) => `- ${k}: ${plano(x)}`).join('\n'))
  const R = rolesDe(ctx)
  const us = unidadesPropias(ctx)
  add('Las unidades propias en el calco (con su rol y su clase)', us.map((u) => `- ${conRol(R, nombreDe(u))} — ${claseDe(u) === 'maniobra' ? 'maniobra' : claseDe(u) === 'apoyo' ? 'apoyo de combate' : 'apoyo de servicio de combate'}${u.escalon ? `, ${u.escalon}` : ''}${!directa(ctx, u) && nombreMadre(ctx, u) ? `, depende de ${nombreMadre(ctx, u)}` : ''}${limpio(u.relacion) ? ` (${limpio(u.relacion)})` : ''}`).join('\n'))
  add('La organización de la tarea (F4·P2 y agrupaciones)', organizacionTexto(ctx))
  const cae = caeDe(ctx)
  add('El CAE del G-2 (PICB): el MÁS PROBABLE (H.T. 18, enunciado y H.T. 19 fase por fase)', caeProbableTexto(ctx))
  add('El CAE del G-2: el MÁS PELIGROSO', caePeligrosoTexto(ctx) || (cae.peligroso ? `${cae.peligroso}.` : ''))
  const g3 = g3De(ctx)
  add('La misión aprobada (F2·P12)', ['QUIÉN', 'QUÉ', 'CUÁNDO', 'DÓNDE', 'PROPÓSITO', 'ENUNCIADO COMPLETO'].map((k) => [k, sinCuentas(casilla(g3.mision, k))]).filter(([, x]) => x).map(([k, x]) => `- ${k}: ${plano(x)}`).join('\n'))
  const { C, fases } = fasesDelCAP(ctx)
  add(`El CAP aprobado: CAP ${C.n}${C.recomendado ? ' (RECOMENDADO AL COMANDANTE en la F5·P1)' : ''} — F3·P6 y F3·P4`, [...Object.entries(C.coa || {}), ...Object.entries(C.concepto || {})].filter(([k, x]) => !k.startsWith('_') && typeof x === 'string' && !vacio(sinCuentas(x))).map(([k, x]) => `- ${k}: ${plano(sinCuentas(x))}`).join('\n'))
  add(
    'Las fases del CAP aprobado en la carta: lo que hace CADA unidad (tarea y propósito de su ficha, y dónde)',
    fases
      .map((f) => [cabeceraFase(f), ...(f.tarea ? [`  Tarea de la fase: ${f.tarea}${f.proposito ? ` — ${f.proposito}` : ''}`] : []), ...f.unidades.filter((u) => u.tarea).map((u) => `  - ${u.nom}${u.rol ? ` (${u.rol})` : ''}${u.principal ? ' [esfuerzo principal]' : ''}: ${u.tarea}${u.donde ? `, ${u.donde}` : ''}${u.proposito ? ` — ${u.proposito}` : ''}`), ...(f.tareas.length ? [`  Tareas tácticas: ${f.tareas.join('; ')}`] : []), ...(f.obstaculos.length ? [`  Obstáculos: ${f.obstaculos.join('; ')}`] : []), ...(f.fuegos.length ? [`  Fuegos: ${f.fuegos.join('; ')}`] : [])].join('\n'))
      .join('\n'),
  )
  const cm = hojasDe(ctx, 'cmte')
  add('Lo del Comandante (F6·P2 Guía de Planificación Final, F6·P1 decisión, F2·P14 intención)', [...Object.entries(guiaFinal(ctx)).map(([k, x]) => [`Guía Final — ${k}`, x]), ['F6·P1 Curso de acción aprobado', casilla(cm.decisionCmte, 'Curso de acción aprobado')], ['F6·P1 Modificaciones', casilla(cm.decisionCmte, 'Modificaciones')], ['F2·P14 Propósito', casilla(cm.intencion, 'Propósito')], ['F2·P14 Tareas clave', casilla(cm.intencion, 'Tareas clave')], ['F2·P14 Estado final', casilla(cm.intencion, 'Estado Final')]].filter(([, x]) => !vacio(x)).map(([k, x]) => `- ${k}: ${plano(x)}`).join('\n'))
  const filasTxt = (xs) => filasDe(xs).map((f) => `- ${Object.entries(f).filter(([k, x]) => !k.startsWith('_') && !vacio(sinCuentas(x))).map(([k, x]) => `${k}: ${plano(sinCuentas(x))}`).join(' · ')}`).join('\n')
  add(
    'LOS RCIC QUE YA DETERMINÓ CADA SECCIÓN DEL ESTADO MAYOR (la F2·P8 «RCIC. y EEIA.» del G-1, G-3, G-4, G-5 y EME, el Plan de búsqueda de información del G-2 y la prioridad que les dio el Comandante): van TODOS, en este orden, en III.- D.- 2.- (RPI en a.-, RIFA en b.-, EEIA en c.-), uno por renglón — no los cambies por otros',
    requerimientosDe(ctx).map((x) => `- ${x.tipo}${x.de.length ? ` (${x.de.join(', ')}${x.p != null && x.p < 50 ? `; prioridad ${x.p}` : ''})` : ''}: ${punto(mayus(x.r))}`).join('\n'),
  )
  add('Eventos críticos y puntos de decisión (F4·P4)', filasTxt(g3.eventos))
  add('Asignación de recursos (F4·SAL)', filasTxt(g3.recursos))
  add('Matriz de ejecución de apoyo de fuegos (F4·P7)', filasTxt(g3.fuegos))
  const s = esObj(g3.sincro) ? Object.entries(g3.sincro).filter(([k, x]) => !k.startsWith('_') && !vacio(sinCuentas(x))).map(([k, x]) => `- ${k.replace('|', ' · ')}: ${plano(sinCuentas(x))}`).join('\n') : ''
  add('Matriz de sincronización (F4·P6-7)', s)
  add('Medidas de control, tipo de orden y de ensayo (F6·SAL)', Object.entries(esObj(g3.controlOrden) ? g3.controlOrden : {}).filter(([k, x]) => !k.startsWith('_') && !vacio(sinCuentas(x))).map(([k, x]) => `- ${k}: ${plano(sinCuentas(x))}`).join('\n'))
  add('Limitaciones del G-3 (F2·P5)', [...PROHIBE(ctx).map((x) => `- PROHIBIDO: ${x}`), ...OBLIGA(ctx).map((x) => `- OBLIGATORIO: ${x}`)].join('\n'))
  add('Medidas de control de la Matriz de riesgo (F6·P3 / F2·P7)', riesgosTexto(ctx))
  add('Reconocimiento (F2·P9) y A.I.N.', reconocimientoTexto(ctx))
  const a4 = anexoG4(ctx)
  // con el título de cada apartado del anexo («Reemplazos», no «reemplazos»): campos/g3.js los pasa en ctx.titulosAnexos
  const tit = (g, k) => limpio(String(ctx.titulosAnexos?.[g]?.[k] || '')).replace(/\.$/, '') || k
  add('Lo del G-4 (Anexo de Apoyo de Servicio de Combate y concepto de apoyo por fase)', [conceptoApoyoTexto(ctx), ...Object.entries(a4).filter(([k, x]) => !['concepto'].includes(k) && !vacio(x)).map(([k, x]) => `- ${tit('g4', k)}: ${plano(x)}`)].filter(Boolean).join('\n'))
  add('Lo del G-1 (Anexo de Personal)', Object.entries(anexoG1(ctx)).filter(([, x]) => !vacio(x)).map(([k, x]) => `- ${tit('g1', k)}: ${plano(x)}`).join('\n'))
  add('Lo del G-5 (Anexo de AC/GM)', Object.entries(anexoG5(ctx)).filter(([, x]) => !vacio(x)).map(([k, x]) => `- ${tit('g5', k)}: ${plano(x)}`).join('\n'))
  add('Puestos comando (calco y textos)', puestosComandoTexto(ctx))
  return conCoordenadas(B.join('\n\n'))
}

// 🔎 Lo que ya entregaron el Comandante y las otras secciones (el panel del documento).
export function entregas(ctx = {}) {
  const E = []
  const cm = hojasDe(ctx, 'cmte')
  const de = (titulo, items) => {
    const xs = items.filter(([, x]) => !vacio(x))
    if (xs.length) E.push({ de: titulo, items: xs.map(([k, x]) => [k, txt(x)]) })
  }
  de('El Comandante', [['Decisión (F6·P1)', casilla(cm.decisionCmte, 'Curso de acción aprobado')], ['Intención (F6·P2 / F2·P14)', intencionTexto(ctx)], ['RCIC (F6·P2)', guiaFinal(ctx).rcic], ['Elaboración de la orden (F6·P2)', guiaFinal(ctx).ordenes]])
  const cae = caeDe(ctx)
  de('El G-2 (PICB)', [['CAE más probable', cae.probable], ['CAE más peligroso', cae.peligroso], ['Misión estimada del enemigo', cae.enunciado.find(([k]) => k === 'Misión')?.[1]], ['Estado final del enemigo', cae.enunciado.find(([k]) => k === 'Estado final deseado')?.[1]]])
  const a1 = anexoG1(ctx)
  de('El G-1 (Anexo de Personal)', [['Concepto de apoyo', a1.concepto], ['Reemplazos', a1.reemplazos], ['PP.GG.', a1.ppgg]])
  const a4 = anexoG4(ctx)
  de('El G-4 (Anexo de Apoyo de Servicio de Combate)', [['Misión logística', ctx.calco?.misionLog], ['Concepto de apoyo', a4.concepto], ['EPA', a4.epa], ['EPE', a4.epe]])
  const a5 = anexoG5(ctx)
  de('El G-5 (Anexo de AC/GM)', [['Concepto de apoyo', a5.concepto], ['Evacuación', a5.evacuacion], ['Ejes humanitarios', a5.ejes]])
  // los RCIC de cada sección (F2·P8 y el Plan de búsqueda del G-2): de dónde sale III.- D.- 2.-
  const req = requerimientosDe(ctx)
  de(
    'Los RCIC de cada sección (F2·P8 y el Plan de búsqueda del G-2)',
    unicos(req.flatMap((x) => x.de)).map((s) => [s, req.filter((x) => x.de.includes(s)).map((x) => `${x.tipo}: ${punto(mayus(x.r))}`).join('\n')]),
  )
  return E
}
export function entregasTexto(ctx = {}) {
  return entregas(ctx)
    .map((e) => `## ${e.de}\n${e.items.map(([k, x]) => `- ${k}: ${sinMarcaIA(x).replace(/\n+/g, ' / ')}`).join('\n')}`)
    .join('\n\n')
}

// 🗺️ El control de los anexos (lo que prometía la hoja vieja: «controlá que no falte ningún anexo»).
export function estadoAnexos(ctx = {}) {
  const g3 = g3De(ctx)
  const p = picbDe(ctx)
  const tiene = (x) => (esObj(x) ? Object.entries(x).some(([k, v]) => !k.startsWith('_') && (typeof v === 'string' ? !vacio(v) : esObj(v) || Array.isArray(v) ? tiene(v) : false)) : Array.isArray(x) ? x.some((y) => tiene(y) || (typeof y === 'string' && !vacio(y))) : false)
  const ops = ctx.calco?.ops || {}
  const filas = [
    ['A', 'Calco de Operaciones', 'G-3', (ops.limites || []).length + (ops.tareas || []).length > 0 || (fasesCOA(ctx).propio || []).length > 0, 'la carta: límites, tareas tácticas y las fases del CAP'],
    ['B', 'Inteligencia', 'G-2', caeDe(ctx).hay || tiene(p.ht20), 'la PICB con el CAE más probable y el más peligroso'],
    ['C', 'Apoyo de Fuegos', 'G-3 / CAF', tiene(g3.fuegos) || tiene(g3.lbl), 'la Matriz de ejecución de apoyo de fuegos (F4·P7)'],
    ['D', 'Defensa Antiaérea', 'EME', unidadesPropias(ctx).some((u) => /antiaer|\bada\b|\baa\b/i.test(`${u.arma} ${u.simbolo} ${nombreDe(u)}`)), 'medios de defensa antiaérea en el calco'],
    ['E', 'Ingeniería', 'EME', (ops.obstaculos || []).length > 0 || !!casilla(capAprobado(g3, fasesCOA(ctx)).concepto, 'Movilidad'), 'el plan de barreras'],
    ['F', 'Apoyo de Servicio de Combate', 'G-4', tiene(anexoG4(ctx)), 'el Anexo del G-4 (F7·P1)'],
    ['G', 'Personal', 'G-1', tiene(anexoG1(ctx)), 'el Anexo del G-1 (F7·P1)'],
    ['H', 'Asuntos Civiles y Gobierno Militar', 'G-5', tiene(anexoG5(ctx)), 'el Anexo del G-5 (F7·P1)'],
    ['I', 'Comunicaciones', 'EME', !vacio(ordenDe(ctx).comunicaciones), 'las IOC de la Orden superior'],
  ]
  const L = filas.map(([l, n, quien, ok, que]) => `“${l}” ${n} (${quien}): ${ok ? `✓ hay ${que}` : `✗ falta ${que}`}`)
  const faltan = filas.filter((f) => !f[3]).length
  return { texto: `Anexos de la Orden (la letra, como en ANEXOS): ${L.join(' · ')}.`, ayuda: faltan ? `Faltan ${faltan} anexo(s): pedíselos a quien corresponde antes de que el Comandante firme la Orden.` : 'Están todos los anexos.' }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// EL WORD
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// Un apartado escrito (por el oficial, 🌱 o la IA) → nodos del formato militar:
//   · «FASE I (…) desde … hasta …» → subtítulo sin número (como en la OGO del CE-I «KILÓMETRO 7»);
//   · «1.- DIV MEC-2 (OD).», «a.- …», «1) …», «a) …» → subapartados numerados: el NIVEL sale del tipo de marca (la
//     primera que aparece es el primer nivel); el número lo pone el Word;
//   · un subapartado sin nada debajo es un inciso (sin negrita); con texto o subapartados, un título;
//   · «- …» → guion; lo demás, párrafos.
const MARCA = [
  ['A', /^([A-Z])\s*\.-\s*(?=\S)/],
  ['1', /^(\d{1,2})\s*(?:\.-|\.(?!\d)|-(?!\d))\s*(?=\S)/],
  ['a', /^([a-zñ])\s*(?:\.-|\.(?![a-z]))\s*(?=\S)/],
  ['1)', /^(\d{1,2})\s*\)\s*(?=\S)/],
  ['a)', /^([a-zñ])\s*\)\s*(?=\S)/],
]
const marcaDe = (l) => {
  for (const [tipo, re] of MARCA) {
    const m = l.match(re)
    if (m) return { tipo, resto: l.slice(m[0].length).trim() }
  }
  return null
}
const FASE = /^(FASE|Fase)\s+([IVXL]+|\d{1,2})\b/
const RIESGO = /^(Se (asume|acepta)\b[^.]{0,40}\briesgo|El riesgo (a afrontar|que se asume|aceptado)\b|Riesgos?\s*[:.-])/i
const ROTULO = /^(Misi[oó]n|Intenci[oó]n( del Comandante)?|Concepto( de la operaci[oó]n)?|Tarea|Prop[oó]sito|M[eé]todo|Efecto|Prioridad[^.:]{0,40}|Restricciones|Medidas (permisivas|restrictivas)|Organizaci[oó]n[^.:]{0,40}|Enfoque|Recursos|Composici[oó]n|Ubicaci[oó]n|Riesgo|Estado final[^.:]{0,20})$/i
function partirTitulo(l) {
  const dos = l.match(/^([^:]{2,70}[^\s:]):\s+(.+)$/)
  if (dos && dos[1].split(/\s+/).length <= 8 && !/\d{3,}/.test(dos[1]) && !FASE.test(dos[1])) return { titulo: punto(dos[1]), resto: dos[2] }
  const pt = l.match(/^([^.]{2,50})\.\s+(\S.*)$/)
  if (pt && ROTULO.test(pt[1].trim())) return { titulo: `${pt[1].trim()}.`, resto: pt[2] }
  return { titulo: l, resto: '' }
}
// Los renglones y los guiones EN EL ORDEN en que se escribieron. El Word pone el texto de un apartado antes de sus
// guiones: lo que sigue a un guion («Ver Anexo…» después de la lista, otro «Título:» con su lista) va en un bloque sin
// número aparte, para que no suba arriba de la lista.
const VINETA = /^[-•·–]\s+/
function bloques(items) {
  const B = []
  let b = null
  for (const x of items) {
    if (!b || (!x.v && b.vinetas.length)) B.push((b = { texto: [], vinetas: [] }))
    ;(x.v ? b.vinetas : b.texto).push(x.l)
  }
  const [primero = { texto: [], vinetas: [] }, ...resto] = B
  return { texto: primero.texto.join('\n'), vinetas: primero.vinetas, segmentos: resto.map((r) => ({ titulo: '', sinRotulo: true, texto: r.texto.join('\n'), vinetas: r.vinetas, hijos: [] })) }
}
const renglon = (l) => (VINETA.test(l) ? { v: true, l: punto(l.replace(VINETA, '')) } : { v: false, l })
// `fases: false`: las «FASE I: …» son renglones del texto (el concepto las enumera: no son subtítulos con lo que sigue).
export function estructurar(t, { llano = false, fases = true } = {}) {
  const ls = txt(t)
    .split('\n')
    .map((l) => l.trim().replace(/^\*\*(.+?)\*\*\s*:?$/, '$1').replace(/\*\*/g, '').replace(/^#{1,6}\s+/, ''))
    .filter(Boolean)
  if (llano) {
    const b = bloques(ls.map(renglon))
    return { texto: b.texto, vinetas: b.vinetas, hijos: b.segmentos }
  }
  const raiz = { items: [], hijos: [] }
  let fase = null
  const pila = []
  const base = () => fase || raiz
  for (const l of ls) {
    const m = marcaDe(l)
    if (m && m.resto) {
      const k = pila.findIndex((x) => x.tipo === m.tipo)
      if (k >= 0) pila.length = k
      const padre = pila.length ? pila[pila.length - 1].nodo : base()
      const n = { linea: m.resto, items: [], hijos: [] }
      padre.hijos.push(n)
      pila.push({ tipo: m.tipo, nodo: n })
      continue
    }
    if (fases && FASE.test(l) && l.length <= 220) {
      // «FASE I: NOMBRE (desde … hasta …).» es el subtítulo entero; si sigue texto en el mismo renglón, va debajo
      const dos = l.length > 110 ? l.match(/^(FASE\s+[IVXL\d]+\s*:?\s*[^:]*?\))\s*[.:]\s+(\S.*)$/i) || l.match(/^(.{6,110}?):\s+(.+)$/) : null
      const partir = dos && !/^FASE\s+[IVXL\d]+$/i.test(dos[1].trim())
      fase = { titulo: punto(partir ? dos[1] : l), sinRotulo: true, items: partir ? [{ v: false, l: dos[2] }] : [], hijos: [] }
      raiz.hijos.push(fase)
      pila.length = 0
      continue
    }
    // el riesgo, al final de la maniobra, no es de la última fase: va después de las fases
    if (fase && RIESGO.test(l)) {
      fase = { titulo: '', sinRotulo: true, items: [], hijos: [] }
      raiz.hijos.push(fase)
      pila.length = 0
    }
    ;(pila.length ? pila[pila.length - 1].nodo : base()).items.push(renglon(l))
  }
  const fin = (n) => {
    const hijos = n.hijos.map(fin)
    if (n.linea == null) {
      const b = bloques(n.items)
      return { titulo: n.titulo, sinRotulo: true, texto: b.texto, vinetas: b.vinetas, hijos: [...b.segmentos, ...hijos] }
    }
    const { titulo, resto } = partirTitulo(n.linea)
    const b = bloques([...(resto ? [{ v: false, l: resto }] : []), ...n.items])
    if (!b.texto && !hijos.length && !b.vinetas.length && !b.segmentos.length) return { titulo: punto(n.linea), item: true }
    return { titulo: punto(titulo), texto: b.texto, vinetas: b.vinetas, hijos: [...b.segmentos, ...hijos] }
  }
  const b = bloques(raiz.items)
  return { texto: b.texto, vinetas: b.vinetas, hijos: [...b.segmentos, ...raiz.hijos.map(fin)] }
}
// La Organización de la tarea escrita «DIV MEC-2 (OD): BIMEC-I, …» → el cuadro del formato militar (como el de la OGO
// del CE-I «KILÓMETRO 7») y lo que queda BAJO CONTROL.
export function organizacionDe(t) {
  const equipos = []
  const control = []
  const resto = []
  for (const l of lineas(t)) {
    const m = l.replace(/^[-•·]\s*/, '').match(/^(.{2,70}?)\s*:\s*(.*)$/)
    if (m && !/^\d+\)/.test(l)) {
      const nombre = limpio(m[1])
      const elementos = m[2].split(/\s*[;,·]\s*/).map(limpio).filter(Boolean).map((x) => sinPunto(x))
      if (/^(bajo control|control directo|a [oó]rdenes directas|tropas del)/i.test(sinTildes(nombre))) control.push(...elementos)
      else equipos.push({ nombre, elementos })
    } else resto.push(l)
  }
  return { equipos, control, resto }
}

export function firmaOGO(ctx = {}) {
  const u = unidadDe(ctx)
  return u ? `EL COMANDANTE ${articuloDe(u)} ${u}` : 'EL COMANDANTE'
}
export function distribucionOGO(ctx = {}, org = null) {
  const sup = superiorDe(ctx)
  const u = unidadDe(ctx)
  const o = org || organizacionDe(organizacionTexto(ctx))
  const dest = unicos([u, ...o.equipos.map((e) => e.nombre.replace(/\s*\(.*$/, '')), ...o.control.map((x) => x.replace(/\s*\(.*$/, ''))].map(limpio))
  if (!sup && !dest.length) return ''
  const L = [`Original : ${sup || '[Unidad superior pendiente]'}`]
  dest.forEach((d, i) => L.push(`Copia ${i + 1} : ${d}`))
  L.push(`Copia ${dest.length + 1} : ARCHIVO`)
  return L.join('\n')
}

// La especificación del Word militar (estructuraPropia: formato-militar/v1/word.js la imprime tal cual).
export function especificacion(valor, ctx = {}, { firma = '' } = {}) {
  const v = normalizarValor(valor)
  const C = v.campos
  const org = organizacionDe(C.orgTarea)
  const nodo = (n) => {
    if (n.id === 'orgTarea') return []
    if (n.soloConTexto && vacio(C[n.id])) return []
    const propio = n.id ? estructurar(C[n.id], { llano: !!n.sinNumero, fases: n.id !== 'concepto' }) : { texto: '', vinetas: [], hijos: [] }
    const deDef = (n.hijos || []).flatMap(nodo)
    const hijos = [...propio.hijos, ...deDef]
    const x = { titulo: n.t, texto: propio.texto, hijos }
    if (propio.vinetas.length) x.vinetas = propio.vinetas
    if (n.sinNumero) x.sinRotulo = true
    if (!x.texto && !hijos.length && !propio.vinetas.length) x.texto = PENDIENTE
    return [x]
  }
  const secciones = DEF.arbol.flatMap(nodo)
  if (!org.equipos.length && !vacio(C.orgTarea)) secciones.unshift({ titulo: 'ORGANIZACIÓN DE LA TAREA.', sinRotulo: true, texto: lineas(C.orgTarea).join('\n'), hijos: [] })
  else if (org.control.length || org.resto.length) secciones.unshift({ titulo: org.control.length ? 'BAJO CONTROL:' : 'ORGANIZACIÓN DE LA TAREA (continúa).', sinRotulo: true, texto: [...org.control, ...org.resto].join('\n'), hijos: [] })
  const s = {
    titulo: TITULO,
    numero: limpio(v.numero) || '01',
    estructuraPropia: true,
    modelo: DEF.modelo,
    preliminares: DEF.preliminares.map((p) => ({ rotulo: p.t, texto: sinMarcaIA(C[p.id]) })),
    secciones,
    autenticador: 'G-3',
  }
  if (org.equipos.length) s.organizacion = { titulo: 'ORGANIZACIÓN DE LA TAREA', equipos: org.equipos.map((e) => ({ nombre: e.nombre, elementos: e.elementos })) }
  const f = limpio(v.firma) || limpio(firma) || firmaOGO(ctx)
  if (f) s.firma = f
  const d = distribucionOGO(ctx, org)
  if (d) s.distribucion = d
  return s
}
// El valor guardado (o el de la hoja vieja) con todos sus campos.
export function normalizarValor(valor) {
  const o0 = esHojaVieja(valor) ? desdeHojaVieja(valor) : valor
  const o = esObj(o0) ? o0 : {}
  const campos = {}
  for (const id of idsDe()) campos[id] = texto(sinHipotesis(o.campos?.[id] ?? ''))
  return { esquema: ESQUEMA, numero: limpio(o.numero), campos, ideas: texto(o.ideas), firma: limpio(o.firma), iaCampos: Array.isArray(o.iaCampos) ? o.iaCampos : [] }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// LA GUÍA, EL PRODUCTO Y LA VERIFICACIÓN
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
export const GUIA = {
  para: 'Es el producto final del PMTD (Fase VII): la orden con la que el Comandante pone en ejecución el curso de acción aprobado. La coordina el G-3 y la escribe todo el Estado Mayor (cada sección aporta su párrafo y su anexo); la revisa y aprueba el Comandante ANTES de difundirla. Tiene la forma de cinco párrafos del TEXTO PMTD 2017 (Capítulo VII) y tiene que INTEGRAR todo lo que se trabajó en la Mesa.',
  como: [
    '🌱 trae lo que ya tiene el ejercicio, párrafo por párrafo: la Orden superior, el CAE más probable y el más peligroso del G-2, la misión aprobada (F2·P12), la intención y los RCIC del Comandante, el CAP aprobado con sus fases de la carta y la tarea y el propósito de cada unidad, la organización de la tarea, fuegos, barreras, reconocimiento, riesgo y lo de los anexos del G-1, G-4 y G-5. No pisa lo escrito.',
    '🤖 la IA la redacta COMPLETA con el expediente y la doctrina del Capítulo VII (cómo se escriben la misión, la intención, el concepto, la maniobra por fases y las tareas), con el nivel de detalle de una orden real. Si tu IA corta las respuestas largas, pedila por partes (I-II · III concepto · III tareas · IV-V).',
    'Cada párrafo con la forma del PMTD: la MISIÓN en una oración (quién, qué, cuándo, dónde y propósito, en ese orden); la INTENCIÓN en prosa («Mi intención es…, para esto es clave… Al finalizar la operación…»); el CONCEPTO («Vamos a cumplir la misión mediante… El punto decisivo es… porque…», una oración por Unidad con su tarea y su propósito, fuegos, ingenieros, sostenimiento, fases y estado final); la MANIOBRA fase por fase; las TAREAS fase por fase, TODAS las Unidades con «TAREA:» y «PROPÓSITO:».',
    'Dentro de un apartado, los subapartados se escriben «1.- DIV MEC-2 (OD).», «a.- …», «1) …» y las fases «FASE I: NOMBRE (desde … hasta …).», cada uno en su renglón: el Word los numera solo (I.- A.- 1.- a.- 1) a)).',
    'Los RCIC van SOLAMENTE en III.- D.- 2.- (no en los anexos): 🌱 trae los que ya determinó cada sección (la F2·P8 del G-1, G-3, G-4, G-5 y EME, y el Plan de búsqueda del G-2), primero los que priorizó el Comandante. Una ORDEN de operaciones NO lleva hipótesis: el párrafo I.- SITUACIÓN termina en C.- Refuerzos y reducciones.',
    'Controlá los anexos (🗺️ abajo): Inteligencia (G-2), Apoyo de Fuegos, Ingeniería, Apoyo de Servicio de Combate (G-4), Personal (G-1) y AC/GM (G-5).',
    '👁️ Vista previa y 📄 Word (formato militar): membrete, la Organización de la Tarea en cuadro, la numeración del PMTD, la firma del Comandante, la autenticación y la distribución.',
  ],
  ejemplo: 'Misión: «La Div-2, defiende y destruye al batallón de tanques a partir del D(0600) hasta D+6 (1800) al sud de la LF. ÁGUILA con el propósito de permitir a la DBL-22 ejecutar el contraataque…». Maniobra: «La Fuerza de Tarea VARGAS (OD y esfuerzo principal) defiende y bloquea al BIM (OD) de la DIMEC-56, con el propósito de evitar la conquista de Co. TUNARI.» Tareas: «FASE II: DEFENSA DE LA POSICIÓN DEFENSIVA.» · «1.- FT VARGAS (OD).» · «TAREA: Defiende y bloquea al BIM (OD) de la DIMEC-56.» · «PROPÓSITO: Evitar la conquista de Co. TUNARI.»',
}

export const PRODUCTO = (ctx, hoja) =>
  `LO PRIMERO: más abajo está «EL BORRADOR DE LA MESA» (♻️): la misión, la intención, el concepto, la maniobra, las tareas y los RCIC YA ESTÁN con la forma del PMTD y con los datos de la carta. Devolvelos MEJORADOS conservando esa forma renglón por renglón (lo que la rompa, la Mesa lo descarta) y completá los demás apartados. Tu producto es la ORDEN GENERAL DE OPERACIONES ${unidadDe(ctx) ? `${articuloDe(unidadDe(ctx)) === 'DEL' ? 'del' : 'de la'} ${unidadDe(ctx)} ` : ''}(hoja ${hoja?.num || 'F7·P1'} del PMTD, Fase VII «Elaborar planes y órdenes»): el documento en el que desemboca TODO el planeamiento. La coordina el G-3, la escribe todo el Estado Mayor y la firma el Comandante. Va con la forma de CINCO PÁRRAFOS del TEXTO PMTD 2017 (Parte Primera, Capítulo VII), apartado por apartado: OBJETO, CARTAS, ANEXOS; ORGANIZACIÓN DE LA TAREA; I.- SITUACIÓN; II.- MISIÓN; III.- EJECUCIÓN (la Intención del Comandante sin número, A.- Concepto de la operación con 1.- Maniobra … 9.- Operaciones de AC/GM, B.- Tareas de las unidades de maniobra, C.- de apoyo de combate, D.- Instrucciones de coordinación); IV.- APOYO DE SERVICIO; V.- COMANDO Y COMUNICACIONES. Tiene que INTEGRAR todo lo que ya trabajó el Estado Mayor en la Mesa: la Orden del escalón superior, el CAE más probable y el más peligroso del G-2, la misión aprobada, la intención del Comandante, los RCIC (RPI y RIFA) que determinó cada sección del Estado Mayor, el CAP aprobado con su maniobra FASE POR FASE y la tarea y el propósito de CADA unidad, los fuegos, el plan de barreras, el reconocimiento, la matriz de riesgo, la matriz de sincronización y los anexos del G-1, G-4 y G-5. Cada párrafo va con la FORMA del PMTD (la misión, la intención, el concepto, la maniobra y las tareas como en los ejemplos del PMTD de la DOCTRINA y del EJEMPLO DE REDACCIÓN). Tiene que quedar COMPLETA, con el nivel de detalle de una orden real de Cuerpo de Ejército o División: nada de resúmenes, de cuentas sueltas («13 trabajos», «18 límites») ni de remisiones a hojas de la Mesa («ver F3·P4»). El membrete, la numeración, la firma, la autenticación y la distribución los pone la Mesa.`

// ─── EL BORRADOR DE LA MESA, la base del pedido a la IA ───────────────────────────────────────────────────────────
// Lo que trae ♻️ (la forma del PMTD con las unidades, fases, tareas, propósitos y RCIC del ejercicio) va a la IA como
// BASE OBLIGATORIA de esos apartados: la IA lo pule y lo completa, no lo rehace (Sergio, 30-10-2026: «el botón ♻️ está
// mejor… la IA está sacando cualquier cosa»). Sólo van los apartados en los que el documento de hoy no es ya el borrador.
export function borradorParaIA(ctx = {}, valor = null) {
  const P = propuestas(ctx).campos
  const hoy = esObj(valor?.campos) ? valor.campos : {}
  const tit = {}
  const rec = (ns) => ns.forEach((n) => {
    if (n.id) tit[n.id] = n.t.replace(/\.$/, '')
    if (n.hijos) rec(n.hijos)
  })
  rec(DEF.arbol)
  const ids = REHACER.filter((id) => !vacio(P[id]))
  if (!ids.length) return ''
  const distintos = ids.filter((id) => texto(hoy[id] || '') !== texto(P[id]))
  if (!distintos.length) return 'El DOCUMENTO DE HOY ya es el borrador de la Mesa en esos apartados (♻️): mejoralo conservando su forma renglón por renglón.'
  return distintos.map((id) => `### ${tit[id] || id} — clave "${id}"\n${P[id]}`).join('\n\n')
}
// ¿El apartado conserva la forma del PMTD? Lo que devuelve la IA en los apartados de ♻️ se acepta sólo si la conserva
// (Sergio, 31-10-2026, con la Orden que le hizo la IA: intención con rótulos, concepto resumido, tareas en un párrafo,
// RIFA vacíos, la misión con gerundios); si no, queda lo que había o el borrador de la Mesa.
const RE_FASE = /^FASE\s+[IVXL]+\b/i
const RE_ROTULOS = /^(Prop[oó]sito|Punto decisivo|Tareas? clave|Estado final|Esfuerzo principal|Esfuerzos secundarios|Reserva|Primer escal[oó]n|Segundo escal[oó]n)\s*:/im
// lo que el borrador cumple, el apartado de la IA también tiene que cumplirlo
const SELLOS = {
  fuegos: [/tienen la tarea de/i, /con el prop[oó]sito de/i, /el m[eé]todo/i],
  inteligencia: [/enfoque de recopilaci[oó]n/i, /prioridad de apoyo/i],
  ingenieros: [/prioridad de esfuerzo/i, /prioridad de trabajo/i],
  antiaerea: [/tarea de los medios/i, /con el prop[oó]sito de/i],
  conceptoApoyo: [/enfoque de apoyo log[ií]stico/i],
  reconocimiento: [/punto focal/i],
}
const unidadesDe = (t) => unicos(lineas(t).map((l) => (l.match(/^\d{1,2}\s*\.-\s*(.+?)\.?$/) || [])[1]).filter(Boolean).map(norm))
export function formaPMTD(id, t, borrador = '') {
  const s = txt(t).trim()
  if (!s) return false
  const ls = lineas(s)
  const cuenta = (re, x) => lineas(x).filter((l) => re.test(l)).length
  const brigadasNuevas = /\b(Una|La|Un|El)\s+(Brigada|Fuerza de Tarea)\b/.test(s) && !/\b(Una|La|Un|El)\s+(Brigada|Fuerza de Tarea)\b/.test(borrador)
  if (brigadasNuevas || /(?<![\d.°'"])-?\d{1,2}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}/.test(s)) return false
  switch (id) {
    case 'mision': {
      const antes = s.split(/con el prop[oó]sito de/i)[0]
      return ls.length === 1 && /con el prop[oó]sito de/i.test(s) && !/,\s*\p{L}+(?:ando|iendo)\s/u.test(antes) && !/sin permitir/i.test(antes)
    }
    case 'intencion':
      return /^Mi intenci[oó]n es\b/i.test(s) && /Al finalizar la operaci[oó]n/i.test(s) && !RE_ROTULOS.test(s)
    case 'concepto':
      return /^(Vamos a cumplir la misi[oó]n|La operaci[oó]n se cumple|Cumpliremos la misi[oó]n)\b/i.test(s) && /siguientes fases/i.test(s) && !RE_ROTULOS.test(s) && ls.length >= Math.min(4, lineas(borrador).length || 4)
    case 'maniobra':
      return cuenta(RE_FASE, s) >= Math.max(1, cuenta(RE_FASE, borrador)) && !RE_ROTULOS.test(s)
    case 'tareasManiobra':
    case 'tareasApoyo': {
      const b = unidadesDe(borrador)
      return cuenta(/^TAREA\s*:/i, s) > 0 && cuenta(RE_FASE, s) >= cuenta(RE_FASE, borrador) && cuenta(/^TAREA\s*:/i, s) >= cuenta(/^TAREA\s*:/i, borrador) && cuenta(/^PROP[OÓ]SITO\s*:/i, s) >= cuenta(/^PROP[OÓ]SITO\s*:/i, borrador) && unidadesDe(s).every((u) => !b.length || b.includes(u))
    }
    case 'rpi':
    case 'rifa':
    case 'eeia':
      // uno por renglón (no «1) …? 2) …?» en el mismo), al menos los del borrador, y no «SIN DATO» si el borrador los trae
      return ls.length >= lineas(borrador).length && !ls.some((l) => /[?.;]\s*\d{1,2}\s*[).-]+\s+\S/.test(l)) && !(lineas(borrador).length && /^SIN DATO/i.test(s))
    default:
      return (SELLOS[id] || []).every((re) => !re.test(borrador) || re.test(s))
  }
}
const tituloDe = (id) => {
  let t = id
  const rec = (ns) => ns.forEach((n) => (n.id === id ? (t = n.t.replace(/\.$/, '')) : n.hijos && rec(n.hijos)))
  rec(DEF.arbol)
  return t
}
// Lo que devolvió la IA, revisado: en los apartados de ♻️ que la IA cambió rompiendo la forma del PMTD, queda lo que
// había (si tenía la forma) o el borrador de la Mesa. → { valor, malos: ['Intención del Comandante', …] }
export function aceptarIA(nuevo, antes = {}, ctx = {}) {
  const B = propuestas(ctx).campos
  const campos = { ...(nuevo?.campos || {}) }
  const previo = antes?.campos || {}
  let ia = Array.isArray(nuevo?.iaCampos) ? [...nuevo.iaCampos] : []
  const malos = []
  for (const id of REHACER) {
    if (!(id in campos) || texto(campos[id]) === texto(previo[id] || '')) continue
    const b = texto(B[id] || '')
    if (formaPMTD(id, campos[id], b)) continue
    campos[id] = formaPMTD(id, previo[id], b) ? previo[id] : b || previo[id] || ''
    ia = ia.filter((x) => x !== `campo:${id}`)
    malos.push(tituloDe(id))
  }
  return { valor: { ...nuevo, campos, iaCampos: ia }, malos }
}

export const TAREA_IA = `PARTÍ DEL BORRADOR DE LA MESA. Para la misión, la intención, el concepto de la operación (con la maniobra, los fuegos, el reconocimiento, la inteligencia, los ingenieros y la defensa antiaérea), las tareas de las unidades, los RCIC y el concepto de apoyo, la Mesa ya armó un BORRADOR con la forma del PMTD y con las unidades, las fases, las tareas, los propósitos y los RCIC de este ejercicio (el bloque «EL BORRADOR DE LA MESA», o el documento de hoy si ya lo es). Tu trabajo es MEJORARLO, no rehacerlo:
1. Conservá su forma renglón por renglón: la misión en UNA oración (quién, qué, cuándo, dónde, propósito); la intención «Mi intención es…, para esto es clave…» y «Al finalizar la operación…»; en el concepto, las mismas oraciones («Vamos a cumplir la misión mediante…», una por unidad, fuegos, ingenieros, sostenimiento, las fases, el estado final); en la maniobra y en las tareas, las MISMAS fases con su nombre y desde/hasta y, en cada fase, las MISMAS unidades en el mismo orden con «1.- UNIDAD (rol).», «TAREA: …» y «PROPÓSITO: …»; los mismos RPI, RIFA y EEIA, uno por renglón.
2. Las unidades son SÓLO las del borrador, con su designación y su escalón (si son Divisiones, son Divisiones: nunca «Brigada», «Fuerza de Tarea» ni las fichas genéricas «OD», «OC 1»). No agregues, no saques ni renombres unidades.
3. Completá lo que dice «SIN DATO — verificar» con el expediente (el punto decisivo, el propósito de una tarea…); si de verdad no está, dejalo así.
4. Corregí la redacción: presente impositivo y concordancia («ocupa y organiza», «se reúne y se suma»), sin coordenadas decimales (el lugar o la Coord. del borrador), sin rótulos ni remisiones a hojas de la Mesa.
5. Los apartados que el borrador no trae (la situación, el apoyo aéreo, la artillería, las MCAF, QBN, Policía Militar, AC/GM, las instrucciones de coordinación, IV y V) completalos con el expediente, con la forma de la DOCTRINA y del EJEMPLO.
6. Nunca hipótesis: es una ORDEN de operaciones.
7. La Mesa REVISA lo que devolvés: el apartado que no conserve la forma del borrador (la intención con rótulos, el concepto resumido, las tareas en un párrafo o sin TAREA/PROPÓSITO de cada unidad en cada fase, los RPI o RIFA en un solo renglón o vacíos, la misión con gerundios, otras unidades) se DESCARTA y queda el borrador. Si no podés mejorar un apartado sin romper su forma, devolvelo tal cual.`

export const REGLAS = [
  'Dentro de un apartado, los SUBAPARTADOS van cada uno en su renglón con su marca: «1.- DIV MEC-2 (OD).» (y su texto en el renglón siguiente o después de «:»), «a.- …», «1) …», «a) …»; las fases, «FASE I: NOMBRE (desde el … hasta el …).» en su propio renglón. La Mesa los numera en el Word: la marca sólo dice el nivel.',
  'Cada idea del concepto en su renglón (la forma, el punto decisivo, una oración por Unidad, fuegos, defensa antiaérea, ingenieros, sostenimiento, «La operación se desarrollará en las siguientes fases:», una fase por renglón, el estado final). En las TAREAS (III.- B.- y C.-), por cada fase: «FASE I: NOMBRE (…).», y por cada Unidad tres renglones: «1.- FT VARGAS (OD).», «TAREA: …», «PROPÓSITO: …». Los RPI y los RIFA, uno por renglón («1) …», «2) …»), nunca varios en el mismo renglón separados por «;».',
  'NADA con rótulos donde el PMTD pide prosa: la intención NO va como «Propósito: … Punto decisivo: … Tareas clave: … Estado final: …», sino «Mi intención es…, para esto es clave… Al finalizar la operación…»; la misión NO lleva gerundios agregados («reteniendo…», «sin permitir…»).',
  'NO repitas el título del apartado dentro de su texto ni le pongas la numeración del apartado («III.- A.- 1.-»): eso lo pone la Mesa.',
  'Ninguna clave queda vacía ni con «…». Lo que no corresponda: «Omitido.» (refuerzos, QBN) o, si de verdad falta el dato, «SIN DATO — verificar» en ese dato. NO escribas hipótesis ni suposiciones en ninguna parte: es una ORDEN de operaciones (I.- SITUACIÓN termina en C.- Refuerzos y reducciones).',
  'Las unidades propias son SÓLO las de la organización de la tarea y del BORRADOR DE LA MESA, con su designación y su escalón (si son Divisiones, son Divisiones: nunca «Brigada»); las fichas genéricas «OD», «OC 1», «RES» no son unidades. Sin coordenadas decimales («-18.5347, -68.7610»): el lugar o la Coord. como la trae el borrador.',
  'Las unidades, lugares, líneas, puntos, coordenadas, días y horas son SÓLO los del expediente (la Orden superior, el calco, las fases del CAP, las hojas). No inventes unidades ni las renombres. Los RCIC (RPI y RIFA) son los que ya determinó cada sección: transcribilos todos, en el orden del expediente; no los reemplaces por otros.',
]

export const VERIFICACION = [
  'Cada apartado que vino en EL BORRADOR DE LA MESA conserva su forma renglón por renglón (las mismas fases, las mismas unidades con «TAREA:» y «PROPÓSITO:», la intención «Mi intención es…», el concepto «Vamos a cumplir la misión…», un RPI o RIFA por renglón). Si no, devolvé el del borrador tal cual.',
  'Están TODAS las claves del JSON con texto de ESTA situación; la Orden se lee completa de OBJETO a V.- COMANDO Y COMUNICACIONES, sin huecos.',
  'MISIÓN: UNA oración, en este orden: QUIÉN, QUÉ (tipo de operación + tarea táctica: «defiende y bloquea a…»), CUÁNDO («a partir del D (hora) hasta el D+n (hora)»), DÓNDE y «con el propósito de…»; sin gerundios agregados; es la misión aprobada (F2·P12) del expediente.',
  'INTENCIÓN: en prosa y sin rótulos ni números, como en el PMTD: «Mi intención es (propósito), para esto es clave inicialmente (tareas clave), asimismo es importante…» y, en otro párrafo, «Al finalizar la operación, (cómo queda la propia fuerza), (cómo queda el enemigo), encontrándonos en condiciones de (operación futura).»; NO describe la maniobra.',
  'CONCEPTO: «Vamos a cumplir la misión mediante (forma de maniobra). El punto decisivo es … porque …»; una oración por Unidad («Una División Mecanizada (OD y esfuerzo principal) defiende y bloquea…, con el propósito de…», las OC con «esfuerzo secundario», la reserva «… constituye la reserva, encontrándose en condiciones de ser empleada con orden, con prioridad de planeamiento a la OD y posteriormente a…»); «El propósito del apoyo de fuegos es…»; «La prioridad de esfuerzo de ingeniería será…, la prioridad de trabajo será para la Unidad que lleve la OD»; la operación de sostenimiento (tarea y propósito); «La operación se desarrollará en las siguientes fases:» con cada FASE, su nombre y desde/hasta; y el estado final («Al finalizar la operación…»).',
  'MANIOBRA: FASE POR FASE, CADA unidad de maniobra del CAP aprobado con su designación real: «La DIV MEC-2 (OD y esfuerzo principal) defiende…, con el propósito de…», «La DIV-1 (OC-1 y esfuerzo secundario)…»; la reserva con su prioridad de planeamiento; al final «Se asume como riesgo…» y cómo se mitiga. Coincide con las fases y las fichas de la carta.',
  'APOYO DE FUEGOS: un párrafo «Los medios de apoyo de fuegos tienen la tarea de (destruir / neutralizar / suprimir) a…, con el propósito de…, el método: la prioridad de apoyo de fuegos a…, se asignan los blancos…, restricciones:…, el efecto será…»; a.- b.- c.- con contenido; OAPC con la relación de cada unidad de artillería. INTELIGENCIA: «El enfoque de recopilación de inteligencia está dirigido a… La prioridad de apoyo a la… Los recursos son…». INGENIEROS: «La prioridad de esfuerzo es de… mediante…, la prioridad de trabajo a la…». DEFENSA ANTIAÉREA: «La tarea de los medios de ADA es…, con el propósito de…, la prioridad de apoyo a la…».',
  'TAREAS: FASE POR FASE («FASE I: NOMBRE (…).»); en CADA fase TODAS las Unidades de maniobra dependientes (con la reserva) —y en III.- C.- las de apoyo de combate—, cada una con «1.- UNIDAD (rol).», «TAREA: …» en presente impositivo («Defiende…», «Se desplaza…») y «PROPÓSITO: …» («Evitar la conquista de…»).',
  'INSTRUCCIONES DE COORDINACIÓN: vigencia; RCIC: TODOS los que determinó cada sección (RPI como preguntas, RIFA como «Informar…»), uno por renglón y en el orden del expediente; medidas de reducción de riesgos de la matriz; reglas; ambiente; protección; adicionales (puntos de contacto, enlaces, puntos de decisión); límite de avance; MCAF; ensayo (tipo, lugar y D-hora); nivel de amenaza.',
  'IV y V completos: concepto de apoyo POR FASE («El enfoque de apoyo logístico es de…, la prioridad de apoyo a la…»), logística, personal, AC/GM; sucesión de mando; PCP / PCA / PCR con su ubicación; IOC en vigor; prioridad de las comunicaciones.',
  'Redacción impositiva, positiva y en presente; sin «tratará de», sin cuentas sueltas, sin coordenadas decimales sueltas, sin «[IA — verificar]» y sin remisiones a hojas de la Mesa.',
]
