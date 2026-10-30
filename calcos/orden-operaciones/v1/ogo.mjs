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
]
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
  hipotesis: '(Aplica sólo para el Plan de Operaciones) Enumere todas las hipótesis establecidas. En una ORDEN de operaciones se deja vacío (no sale en el Word)',
  mision: 'Quién, qué, cuándo, dónde y —lo más importante— el propósito («con el propósito de…»), en una oración. Es la transcripción de la misión aprobada por el Comandante al finalizar el Análisis de la Misión',
  intencion: 'Va inmediatamente antes del párrafo III.- A.-: el propósito de la operación, el punto decisivo, las tareas clave y el estado final (la fuerza propia, la amenaza y el terreno). Es el nexo entre la misión y el concepto: no entra en el «cómo»',
  concepto: 'Cómo el Comandante visualiza las acciones de las Unidades subordinadas: expande el curso de acción aprobado. «Cumpliremos la misión mediante (forma de maniobra); el punto decisivo es … porque …», la operación decisiva y las de configuración, el esfuerzo principal de cada fase y la lista de las fases («FASE I (NOMBRE) desde … hasta …»)',
  maniobra: 'El esquema de maniobra, consistente con el calco: la operación decisiva y las de configuración, las operaciones de seguridad y el uso de la reserva. FASE POR FASE («FASE I (NOMBRE) desde … hasta …») y, en cada fase, cada unidad con su designación, (OD/OC-n/RESERVA), si es esfuerzo principal o secundario, su tarea, dónde y «con el propósito de…». Al final, el riesgo a afrontar y cómo se mitiga',
  fuegos: 'La intención del Comandante respecto a los fuegos, en cuatro elementos: la TAREA esencial (destruir, neutralizar o suprimir) en relación con una formación o función enemiga, el PROPÓSITO, el MÉTODO (prioridad por fase, asignación y restricciones) y el EFECTO deseado (cuantificado y observable)',
  apoyoAereo: 'La asignación de los vuelos de Apoyo Aéreo Cercano (AAC), de interdicción aérea (Cuerpo de Ejército) y las designaciones (División): prioridad y misiones por unidad',
  artilleria: 'Las prioridades (contrabatería, interdicción), la prioridad de fuego por fase, la prioridad para la adquisición de blancos, las restricciones y la Organización de la Artillería para el Combate (OAPC: «RAM-4 : AG CE-I»)',
  mcaf: 'Las medidas permisivas (LCAF, LSAA, AFL) y las restrictivas (AFP, AFR, LRF), con su ubicación y desde cuándo rigen',
  reconocimiento: 'El punto focal del esfuerzo de recopilación de inteligencia y cómo complementa el plan de maniobra: los recursos de inteligencia a emplear y las áreas de interés nombradas (A.I.N.); puede remitir a la Matriz de Eventos o de Reconocimiento y Vigilancia',
  inteligencia: 'El concepto del sistema de inteligencia: la prioridad del esfuerzo entre el desarrollo de la situación, la búsqueda de blancos y la evaluación de daños de combate; la prioridad de apoyo para las Unidades y la de contrainteligencia. Remite al Anexo de Inteligencia',
  ingenieros: 'El propósito de los recursos u obstáculos de ingenieros; la prioridad del esfuerzo de Movilidad, Contramovilidad y Supervivencia (MCS); la prioridad de trabajo (qué Unidades reciben apoyo, en orden) y las restricciones o la delegación de autoridad para emplazar obstáculos',
  antiaerea: 'El concepto general de defensa antiaérea en apoyo de la maniobra, el apoyo de la Fuerza Aérea, la prioridad de defensa antiaérea y los niveles de alerta (ROJA: ataque inminente; AMARILLA: ataque probable; VERDE: ataque improbable)',
  qbn: 'El concepto general de las operaciones QBN y las prioridades de esfuerzo y de apoyo («Omitido.» si no corresponde)',
  policiaMilitar: 'El concepto general de las operaciones de la Policía Militar en apoyo de la maniobra: prioridades, control de circulación y seguridad del área de retaguardia',
  acgm: 'El concepto general de las operaciones de AC/GM y las prioridades de esfuerzo y de apoyo (evacuación de civiles, ejes humanitarios, bienes protegidos); remite al Anexo de AC/GM',
  tareasManiobra: 'Un subpárrafo por cada Unidad de maniobra que depende directamente, en el orden de la organización de la tarea, incluida la reserva: «1.- DIV MEC-2 (OD).» y debajo sus tareas «a.- …», «b.- …» en orden cronológico. Pasaje de líneas y puntos de enlace, puntos de contacto, misiones «en condiciones de…», coordinación de los flancos, evacuación de refugiados',
  tareasApoyo: 'Un subpárrafo por cada Unidad de apoyo de combate (artillería, ingeniería, antiaérea, comunicaciones, inteligencia, policía militar…), en el orden de la organización de la tarea: sólo las tareas que no se especifican o sobreentienden en otra parte',
  vigencia: 'Hora o condición cuando un plan o una orden entra en vigor; el día D y la hora H',
  rpi: 'Los Requerimientos Prioritarios de Inteligencia: preguntas sobre el enemigo, el terreno y las CC.MM. («1) ¿Por dónde lleva el enemigo su esfuerzo principal?»). Los RCIC van SOLAMENTE acá (no en los anexos) y son diez o menos',
  rifa: 'Los Requerimientos de Información de la Fuerza Amiga («1) Informar cuando…»)',
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
        hoja('hipotesis', 'Hipótesis.', { soloConTexto: true }),
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
    { id: 'mision', txt: 'II.- Falta la MISIÓN (quién, qué, cuándo, dónde y para qué): es la misión aprobada de la F2·P12.', tipo: 'err' },
    { id: 'intencion', txt: 'III.- Falta la INTENCIÓN DEL COMANDANTE (propósito, punto decisivo, tareas clave y estado final).', tipo: 'err' },
    { id: 'concepto', txt: 'III.- A.- Falta el CONCEPTO DE LA OPERACIÓN (forma de maniobra, punto decisivo, esfuerzo principal y fases).', tipo: 'err' },
    { id: 'maniobra', txt: 'III.- A.- 1.- Falta la MANIOBRA fase por fase, con la tarea y el propósito de cada unidad.', tipo: 'err' },
    { id: 'tareasManiobra', txt: 'III.- B.- Faltan las TAREAS DE LAS UNIDADES DE MANIOBRA (un subpárrafo por unidad, con la reserva).', tipo: 'err' },
    { id: 'orgTarea', txt: 'Falta la ORGANIZACIÓN DE LA TAREA (las agrupaciones y lo que queda bajo control).' },
    { id: 'enemigo', txt: 'I.- A.- Faltan las FUERZAS ENEMIGAS (dos escalones abajo).' },
    { id: 'caeProbable', txt: 'I.- A.- 1.- Falta el CURSO DE ACCIÓN DEL ENEMIGO MÁS PROBABLE (el del G-2).' },
    { id: 'caePeligroso', txt: 'I.- A.- 2.- Falta el CURSO DE ACCIÓN DEL ENEMIGO MÁS PELIGROSO (el del G-2).' },
    { id: 'propias', txt: 'I.- B.- Faltan las FUERZAS PROPIAS (misión, intención y concepto de dos escalones arriba; las adyacentes).' },
    { id: 'fuegos', txt: 'III.- A.- 2.- Falta el APOYO DE FUEGOS (tarea, propósito, método y efecto).' },
    { id: 'ingenieros', txt: 'III.- A.- 5.- Faltan los INGENIEROS (propósito, prioridad de esfuerzo y de trabajo).' },
    { id: 'tareasApoyo', txt: 'III.- C.- Faltan las TAREAS DE LAS UNIDADES DE APOYO DE COMBATE.' },
    { id: 'vigencia', txt: 'III.- D.- 1.- Falta la hora o condición de entrada en vigor (día D, hora H).' },
    { id: 'rpi', txt: 'III.- D.- 2.- Faltan los RCIC (RPI).' },
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

// La Orden es larga: si la IA corta respuestas largas, se le pide por partes (el oficial elige cuál en la hoja).
export const PARTES = [
  { id: 'todo', nom: 'Toda la Orden', ayuda: 'Todos los apartados en un solo pedido (Claude o Gemini, o ChatGPT con un plan pago).' },
  { id: 'situacion', nom: 'I-II', ayuda: 'OBJETO, CARTAS, ANEXOS, Organización de la tarea, I.- SITUACIÓN y II.- MISIÓN.', campos: ['objeto', 'cartas', 'anexos', 'orgTarea', 'situacion', 'enemigo', 'caeProbable', 'caePeligroso', 'propias', 'refuerzos', 'hipotesis', 'mision'] },
  { id: 'concepto', nom: 'III concepto', ayuda: 'III.- Intención, A.- Concepto de la operación: maniobra fase por fase, fuegos, reconocimiento, inteligencia, ingenieros, antiaérea, QBN, PM y AC/GM.', campos: ['intencion', 'concepto', 'maniobra', 'fuegos', 'apoyoAereo', 'artilleria', 'mcaf', 'reconocimiento', 'inteligencia', 'ingenieros', 'antiaerea', 'qbn', 'policiaMilitar', 'acgm'] },
  { id: 'tareas', nom: 'III tareas', ayuda: 'III.- B.- y C.- Tareas de las unidades de maniobra y de apoyo de combate, y D.- Instrucciones de coordinación.', campos: ['tareasManiobra', 'tareasApoyo', 'vigencia', 'rpi', 'rifa', 'eeia', 'riesgos', 'reglas', 'ambiente', 'proteccion', 'adicionales', 'limiteAvance', 'mcafVigentes', 'ensayo', 'amenazaRetaguardia', 'restricciones'] },
  { id: 'servicio', nom: 'IV-V', ayuda: 'IV.- APOYO DE SERVICIO y V.- COMANDO Y COMUNICACIONES.', campos: ['servicio', 'conceptoApoyo', 'logistica', 'personal', 'asuntosCiviles', 'comando', 'sucesion', 'puestosComando', 'ioc', 'prioridadCom'] },
]

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
  ['D. Hipótesis (sólo en el PLAN de operaciones)', 'hipotesis'],
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
    if (typeof x !== 'string' || vacio(x)) continue
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
export function unidadesPropias(ctx = {}) {
  const u = unidadDe(ctx)
  const todas = (Array.isArray(ctx.calco?.unidades) ? ctx.calco.unidades : Array.isArray(ctx.unidades) ? ctx.unidades : []).filter((x) => esUnidad(x) && !esEnemiga(x) && nombreDe(x))
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
  destruir: 'destruye', construir: 'construye', contribuir: 'contribuye', distribuir: 'distribuye', constituir: 'constituye', incluir: 'incluye', concluir: 'concluye', sustituir: 'sustituye',
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
// La tarea de la ficha dicha como orden: «Reserva» → «constituye la reserva»; un verbo, en presente.
export const tareaEnPresente = (t) => (/^reserva\b/i.test(limpio(t)) ? `constituye la ${minus(limpio(t))}` : enPresente(t))
// «para que no pase…» → «con el propósito de que no pase…»; vacío si es el genérico «para cumplir la misión».
export function proposito(p) {
  let s = plano(p).replace(/[.;]+$/, '')
  if (!s || /^para cumplir (con )?la misi[oó]n$/i.test(s)) return ''
  s = s.replace(/^(con el (prop[oó]sito|fin|objeto) de|a fin de|con la finalidad de)\s+/i, '')
  if (/^para que\b/i.test(s)) return `con el propósito de que ${s.replace(/^para que\s+/i, '')}`
  return `con el propósito de ${s.replace(/^para\s+/i, '')}`
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
  const out = fases.map((f, i) => {
    const d = D[i] || { n: i + 1, nombre: limpio(f?.nombre) || `Fase ${i + 1}`, cuando: '', tarea: '', tareas: [], obstaculos: [], fuegos: [], final: [] }
    const donde = new Map((d.final || []).map((x) => [norm(x.nom), x.donde]))
    const us = (f?.unidades || [])
      .filter((u) => esUnidad(u) && !esEnemiga(u) && u.deFaseEnemiga == null && nombreDe(u) && !(unidadDe(ctx) && mismaUnidad(nombreDe(u), unidadDe(ctx))))
      .map((u) => ({ nom: nombreDe(u), clase: claseDe(u), rol: rolDe(R, nombreDe(u)), principal: !!u.principal, tarea: plano(u.tarea), proposito: plano(u.proposito), donde: donde.get(norm(nombreDe(u))) || '' }))
    const nombre = limpio(d.nombre).replace(/^FASE\s+[IVX\d]+\s*[—–:-]?\s*/i, '')
    return { n: i + 1, nombre, cuando: d.cuando || '', tarea: plano(d.tarea || f?.tarea), proposito: plano(f?.proposito), unidades: us, tareas: d.tareas || [], obstaculos: d.obstaculos || [], fuegos: d.fuegos || [] }
  })
  return { C, fases: out }
}
const cabeceraFase = (f) => `FASE ${romano(f.n)}${f.nombre ? ` (${f.nombre.toUpperCase()})` : ''}${f.cuando ? ` ${cuandoLargo(f.cuando)}` : ''}.`
// La unidad en la fase, como en la OGO del CE-I «KILÓMETRO 7»: «La DIV MEC-2 (OD), esfuerzo principal, defiende la LPR en
// Estancia Esmeralda, con el propósito de…».
function oracionUnidad(u, ant) {
  const esReserva = u.rol === 'RESERVA' || /^reserva$/i.test(u.tarea)
  const nom = u.rol ? `${u.nom} (${u.rol})` : u.nom
  const cabeza = `${articulo(u.nom)} ${nom}${esReserva ? '' : `, ${esfuerzoDe(u.rol, u.principal)},`}`
  const repetida = ant && ant.tarea === u.tarea && ant.donde === u.donde
  const donde = u.donde && !/sin posici[oó]n/i.test(u.donde) && !norm(u.tarea).includes(norm(u.donde.replace(/^en\s+/i, ''))) ? ` ${u.donde}` : ''
  let queHace
  if (/^reserva$/i.test(u.tarea)) queHace = repetida ? 'continúa como reserva' : 'constituye la reserva'
  else if (repetida) queHace = enGerundio(u.tarea) ? `continúa ${enGerundio(u.tarea)}` : `mantiene su tarea (${minus(u.tarea)})`
  else queHace = u.tarea ? minus(enPresente(u.tarea)) : 'mantiene su dispositivo'
  const p = repetida ? '' : proposito(u.proposito)
  return `${cabeza} ${sinPunto(queHace)}${donde}${p ? `, ${p}` : ''}.`
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
    for (const u of us.filter((x) => claseDe(x) === 'maniobra' && (!x.dependeDe || mismaUnidad(x.dependeDe, unidadDe(ctx))))) agregar(nombreDe(u), [])
  }
  // las dependientes de cada agrupación (las fichas con `dependeDe`)
  for (const u of us) {
    if (!u.dependeDe || mismaUnidad(u.dependeDe, unidadDe(ctx))) continue
    const k = [...grupos.keys()].find((x) => mismaUnidad(x, u.dependeDe))
    if (k) agregar(k, [`${nombreDe(u)}${limpio(u.relacion) && !/orgánic/i.test(u.relacion) ? ` (${limpio(u.relacion)})` : ''}`])
  }
  if (!grupos.size) return ''
  const enGrupo = (n) => [...grupos.entries()].some(([k, xs]) => mismaUnidad(k, n) || xs.some((x) => mismaUnidad(x.replace(/\(.*$/, ''), n)))
  const control = us.filter((u) => claseDe(u) !== 'maniobra' && !enGrupo(nombreDe(u)) && (!u.dependeDe || mismaUnidad(u.dependeDe, unidadDe(ctx)))).map((u) => `${nombreDe(u)}${limpio(u.relacion) && !/orgánic/i.test(u.relacion) ? ` (${limpio(u.relacion)})` : ''}`)
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
export function misionTexto(ctx = {}) {
  const g3 = g3De(ctx)
  const m = casilla(g3.mision, 'ENUNCIADO COMPLETO')
  if (m) return punto(plano(m))
  const partes = ['QUIÉN', 'QUÉ', 'CUÁNDO', 'DÓNDE', 'PROPÓSITO'].map((k) => sinCuentas(casilla(g3.mision, k)))
  if (partes[0] && partes[1] && partes.slice(2).filter(Boolean).length >= 2) return punto(partes.filter(Boolean).join(', ').replace(/,\s*(para|con el prop)/i, ' $1'))
  return punto(plano(casilla(g3.prep3, 'II.- MISIÓN')) || plano(ordenDe(ctx).mision))
}
// La intención: la de la Guía de Planificación Final (F6·P2); si no, la Intención Inicial (F2·P14) dicha como en el
// PMTD («El propósito de la operación es… Para esto será clave… Al finalizar la operación…»); si no, la O.P. N° 3.
export function intencionTexto(ctx = {}) {
  const gf = plano(guiaFinal(ctx).intencion) ? txt(guiaFinal(ctx).intencion) : ''
  const h = hojasDe(ctx, 'cmte').intencion
  const prop = casilla(h, 'Propósito')
  const pd = casilla(h, 'Punto decisivo')
  const tareas = casilla(h, 'Tareas clave')
  const fin = casilla(h, 'Estado Final')
  if (prop || tareas || fin) {
    const L = []
    if (prop) L.push(`El propósito de la operación es ${minus(punto(plano(prop)).replace(/^(el prop[oó]sito( de la operaci[oó]n)? es\s+)/i, ''))}`)
    if (pd) L.push(`El punto decisivo es ${minus(punto(plano(pd)))}`)
    const ts = lineas(tareas)
      .flatMap((l) => (lineas(tareas).length === 1 ? l.split(/\s*;\s*|\s*\d\)\s+/) : [l]))
      .map((l) => l.replace(/^[-•·\d.)\s]+/, '').trim())
      .filter(Boolean)
    if (ts.length) L.push('Para esto será necesario cumplir las siguientes tareas clave:', ...ts.map((t, i) => `${i + 1}) ${punto(mayus(t))}`))
    if (fin) L.push(`Al finalizar la operación, ${minus(punto(plano(fin)))}`)
    return gf && gf.length > L.join(' ').length ? gf : L.join('\n')
  }
  return gf || casilla(g3De(ctx).prep3, 'III.- EJECUCIÓN · Intención', 'III.- EJECUCION · Intencion')
}
export function conceptoTexto(ctx = {}) {
  const { C, fases } = fasesDelCAP(ctx)
  const g3 = g3De(ctx)
  const k = C.concepto
  const forma = formaDeManiobra(ctx)
  const pd = sinCuentas(casilla(g3.estructura, 'PUNTO DECISIVO'))
  const enunciado = sinCuentas(casilla(C.coa, 'Enunciado completo'))
  const L = []
  if (forma || pd) L.push(`Cumpliremos la misión mediante la ejecución de una ${forma || 'operación'}${pd ? `; el punto decisivo es ${minus(sinPunto(plano(pd)))}` : ''}.`)
  const fm = sinCuentas(casilla(k, 'Forma de maniobra'))
  if (fm) L.push(punto(plano(fm)))
  else if (enunciado) L.push(punto(plano(enunciado)))
  const ep = sinCuentas(casilla(k, 'Esfuerzo principal'))
  if (ep) L.push(`Esfuerzo principal: ${punto(plano(ep))}`)
  const es = sinCuentas(casilla(k, 'Esfuerzos secundarios'))
  if (es) L.push(`Esfuerzos secundarios: ${punto(plano(es))}`)
  if (fases.length) {
    L.push('La operación se desarrollará en las siguientes fases:')
    for (const f of fases) L.push(cabeceraFase(f))
  }
  return L.join('\n')
}
export function maniobraTexto(ctx = {}) {
  const { C, fases } = fasesDelCAP(ctx)
  const L = []
  let ant = new Map()
  for (const f of fases) {
    const us = f.unidades.filter((u) => u.clase === 'maniobra' && (u.tarea || !ant.has(norm(u.nom)))).sort((a, b) => ORDEN_ROL(a.principal ? 'OD' : a.rol) - ORDEN_ROL(b.principal ? 'OD' : b.rol))
    const conTarea = us.filter((u) => u.tarea)
    if (!conTarea.length && !f.tarea) continue
    L.push(cabeceraFase(f))
    if (f.tarea && !/del CE|^Concentraci|^Desplazamiento/i.test(f.tarea)) L.push(punto(mayus(f.tarea)))
    for (const u of conTarea) L.push(oracionUnidad(u, ant.get(norm(u.nom))))
    const otras = f.tareas.filter((t) => !conTarea.some((u) => norm(t).includes(norm(u.nom))))
    if (otras.length) L.push(`Tareas tácticas en la carta: ${otras.join('; ')}.`)
    ant = new Map(f.unidades.map((u) => [norm(u.nom), u]))
  }
  const res = sinCuentas(casilla(C.concepto, 'Reserva'))
  if (res) L.push(`La RESERVA: ${punto(plano(res))}`)
  const riesgo = sinCuentas(casilla(C.concepto, 'Riesgo aceptado'))
  if (riesgo) L.push(`El riesgo a afrontar: ${punto(plano(riesgo))}`)
  return L.join('\n')
}
// La prioridad de una fila de la Matriz de sincronización (F4·P6-7), fase por fase.
function sincro(ctx, fila) {
  const s = g3De(ctx).sincro
  if (!esObj(s)) return []
  const cols = Array.isArray(s._cols) && s._cols.length ? s._cols : ['FASE I', 'FASE II', 'FASE III', 'FASE IV', 'FASE V']
  return cols.map((c) => [c, sinCuentas(s[`${fila}|${c}`])]).filter(([, x]) => x).map(([c, x]) => `${limpio(c).replace(/^FASE\s+(\d+)/i, (m, n) => `FASE ${romano(Number(n))}`)}: ${sinPunto(plano(x))}.`)
}
export function fuegosTexto(ctx = {}) {
  const { C, fases } = fasesDelCAP(ctx)
  const g3 = g3De(ctx)
  const L = []
  const k = sinCuentas(casilla(C.concepto, 'Fuegos'))
  if (k) L.push(punto(plano(k)))
  const pri = sincro(ctx, 'APOYO DE FUEGOS')
  if (pri.length) L.push('Prioridad de fuegos por fase:', ...pri.map((x) => `- ${x}`))
  else {
    const p = fases.map((f) => [f.n, f.unidades.filter((u) => u.clase === 'maniobra' && (u.principal || u.rol === 'OD') && u.tarea).map((u) => u.nom).join(' y a la ')]).filter(([, a]) => a)
    const tramos = []
    for (const [n, a] of p) {
      const t = tramos[tramos.length - 1]
      if (t && t.a === a && t.hasta === n - 1) t.hasta = n
      else tramos.push({ desde: n, hasta: n, a })
    }
    if (tramos.length) L.push(`Prioridad de fuegos: ${tramos.map((t) => `${t.desde === t.hasta ? `en la FASE ${romano(t.desde)}` : `de la FASE ${romano(t.desde)} a la FASE ${romano(t.hasta)}`} a la ${t.a}`).join('; ')}.`)
  }
  const mat = filasDe(g3.fuegos).map((f) => {
    const blanco = casilla(f, 'Blanco')
    const quien = casilla(f, 'Unidad que lo bate')
    const tarea = casilla(f, 'Tarea')
    const prop = casilla(f, 'Propósito')
    const met = casilla(f, 'Método')
    const fase = casilla(f, 'Fase')
    return tarea || prop ? `- ${fase ? `${plano(fase)}: ` : ''}${plano(tarea) || 'batir'} ${plano(blanco)}${quien ? ` con ${plano(quien)}` : ''}${prop ? `, ${minus(proposito(prop))}` : ''}${met ? `. Método: ${plano(met)}` : ''}.` : ''
  }).filter(Boolean)
  if (mat.length) L.push('Matriz de ejecución de apoyo de fuegos (F4·P7):', ...mat)
  const deFases = fases.filter((f) => f.fuegos.length).map((f) => `- FASE ${romano(f.n)}: ${f.fuegos.join('; ')}.`)
  if (deFases.length) L.push('Fuegos planificados en la carta:', ...deFases)
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
export function reconocimientoTexto(ctx = {}) {
  const g3 = g3De(ctx)
  const L = []
  let reco = ''
  try {
    reco = textoReconocimiento(g3.ivr)
  } catch {
    reco = ''
  }
  const eq = reco
    .split('\n')
    .map((l) => l.replace(/^\s*-\s*/, ''))
    .filter((l) => /—/.test(l) && !/^(Número|OBJETO|CARTA|ANEXOS)\b/.test(l))
  if (eq.length) L.push('Órganos de reconocimiento (Orden de Reconocimiento, F2·P9):', ...eq.map((l) => `- ${punto(l)}`))
  const ains = (ctx.calco?.ops?.ains || []).map((a) => limpio(a?.nom || (a?.n != null ? `AIN-${a.n}` : '')) + (plano(a?.porQue) ? ` (${plano(a.porQue)})` : '')).filter(Boolean)
  if (ains.length) L.push(`Áreas de interés nombradas: ${ains.join('; ')}.`)
  const ev = filasDe(picbDe(ctx).ht20).map((f) => `${casilla(f, 'N° A.I.N.')}: ${casilla(f, 'Indicador')}${casilla(f, 'No antes de') ? `, no antes de ${casilla(f, 'No antes de')}` : ''}${casilla(f, 'No después de') ? `, no después de ${casilla(f, 'No después de')}` : ''}`).filter((x) => !/^:\s*$/.test(x))
  if (ev.length) L.push('Matriz de eventos del G-2 (H.T. 20):', ...ev.map((x) => `- ${punto(plano(x))}`))
  const pri = sincro(ctx, 'INTELIGENCIA')
  if (pri.length) L.push('Por fase (Matriz de sincronización):', ...pri.map((x) => `- ${x}`))
  return L.join('\n')
}
export function ingenierosTexto(ctx = {}) {
  const { C, fases } = fasesDelCAP(ctx)
  const L = []
  const mcs = sinCuentas(casilla(C.concepto, 'Movilidad'))
  if (mcs) L.push(punto(plano(mcs)))
  const obs = sinCuentas(casilla(g3De(ctx).controlOrden, 'Medidas de control de obstáculos'))
  if (obs) L.push(`Control de obstáculos: ${punto(plano(obs))}`)
  const pri = sincro(ctx, 'MOVILIDAD / CONTRAMOVILIDAD / SUPERVIVENCIA (ING.)')
  if (pri.length) L.push('Por fase (Matriz de sincronización):', ...pri.map((x) => `- ${x}`))
  const deFases = fases.filter((f) => f.obstaculos.length).map((f) => `- FASE ${romano(f.n)}: ${f.obstaculos.join('; ')}.`)
  if (deFases.length) L.push('Obstáculos planificados en la carta:', ...deFases)
  return L.join('\n')
}
export function antiaereaTexto(ctx = {}) {
  const ada = unidadesPropias(ctx).filter((u) => /antiaer|\bada\b|\baa\b|raa|bat ?aa/i.test(`${u.arma} ${u.simbolo} ${sinTildes(nombreDe(u))}`))
  const L = []
  if (ada.length) L.push(`Medios de defensa antiaérea: ${ada.map((u) => `${nombreDe(u)}${limpio(u.relacion) ? ` (${limpio(u.relacion)})` : ''}`).join(', ')}.`)
  const pri = sincro(ctx, 'ADA.')
  if (pri.length) L.push('Por fase (Matriz de sincronización):', ...pri.map((x) => `- ${x}`))
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
// «1.- DIV MEC-2 (OD).» y debajo sus tareas, fase por fase (las de la carta, conjugadas).
export function tareasTexto(ctx = {}, clase = 'maniobra') {
  const { fases } = fasesDelCAP(ctx)
  const R = rolesDe(ctx)
  const por = new Map()
  for (const f of fases) {
    for (const u of f.unidades) {
      if ((clase === 'maniobra') !== (u.clase === 'maniobra') || u.clase === 'servicio' || !u.tarea) continue
      const k = [...por.keys()].find((x) => mismaUnidad(x, u.nom)) || u.nom
      if (!por.has(k)) por.set(k, { nom: k, rol: u.rol || rolDe(R, k), items: [] })
      const p = proposito(u.proposito)
      const linea = `FASE ${romano(f.n)}: ${sinPunto(mayus(tareaEnPresente(u.tarea)))}${u.donde && !/sin posici/i.test(u.donde) ? ` ${u.donde}` : ''}${p ? `, ${p}` : ''}.`
      const x = por.get(k)
      if (!x.items.some((i) => i.replace(/^FASE [IVX]+: /, '') === linea.replace(/^FASE [IVX]+: /, ''))) x.items.push(linea)
    }
  }
  if (clase !== 'maniobra') {
    for (const f of filasDe(g3De(ctx).recursos)) {
      const quien = sinCuentas(casilla(f, 'Recurso'))
      if (!quien) continue
      const k = [...por.keys()].find((x) => mismaUnidad(x, quien)) || quien
      if (!por.has(k)) por.set(k, { nom: k, rol: '', items: [] })
      const aq = sinCuentas(casilla(f, 'A quién'))
      const rel = sinCuentas(casilla(f, 'Relación'))
      const desde = sinCuentas(casilla(f, 'Desde qué fase'))
      const pr = sinCuentas(casilla(f, 'Prioridad'))
      const linea = `${rel ? mayus(rel) : 'Apoya'}${aq ? ` a ${aq}` : ''}${desde ? ` desde la ${desde}` : ''}${pr ? `, prioridad ${pr}` : ''}.`
      if (aq || rel) por.get(k).items.unshift(linea)
    }
  }
  const xs = [...por.values()].filter((x) => x.items.length).sort((a, b) => ORDEN_ROL(a.rol) - ORDEN_ROL(b.rol))
  return xs.map((x, i) => [`${i + 1}.- ${x.rol ? `${x.nom} (${x.rol})` : x.nom}.`, ...x.items.map((t, j) => `${String.fromCharCode(97 + (j % 26))}.- ${t}`)].join('\n')).join('\n')
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
// Los RCIC: los de la Guía de Planificación Final; si no, los priorizados por el Comandante (F2·P8); si no, los del
// G-3 (F2·P8). RPI = preguntas sobre el enemigo, el terreno y las CC.MM.; RIFA = sobre la fuerza propia.
export function rcicDe(ctx = {}) {
  const RIFA = /^informar|\bnuestr|\bpropi[ao]s?\b|\bamig|eficiencia|abastecim|clase (iii|v)\b|repliegue de la|concluy|baj(a|en) (del|de)|reemplaz/i
  const lista = []
  const delG3 = filasDe(g3De(ctx).rcic).map((f) => ({ r: casilla(f, 'Requerimiento'), tipo: casilla(f, 'Tipo') })).filter((x) => x.r)
  const gf = lineas(guiaFinal(ctx).rcic).map((l) => l.replace(/^[-•·\d.)\s]+/, '').replace(/\s*\((?:prioridad|lo propuso|sostiene)[^)]*\)\s*$/i, ''))
  const pr = filasDe(hojasDe(ctx, 'cmte').prioridadRcic).map((f) => ({ r: casilla(f, 'Requerimiento'), p: parseFloat(casilla(f, 'Prioridad')) || 99 })).filter((x) => x.r).sort((a, b) => a.p - b.p)
  if (gf.length) lista.push(...gf.map((r) => ({ r, tipo: '' })))
  else if (pr.length) lista.push(...pr.map((x) => ({ r: x.r, tipo: '' })))
  else lista.push(...delG3)
  // los EEIA del G-3 van siempre: el Comandante prioriza los RCIC (RPI y RIFA), no lo que hay que negarle al enemigo
  if (gf.length || pr.length) lista.push(...delG3.filter((x) => /EEIA/i.test(x.tipo)))
  const rpi = []
  const rifa = []
  const eeia = []
  for (const x of lista) {
    const r = plano(x.r)
    if (/EEIA/i.test(x.tipo)) eeia.push(r)
    else if (RIFA.test(r) && !/\benemig|\brojo\b|\bsaturno\b|magenta|goliat/i.test(r)) rifa.push(r)
    else rpi.push(r)
  }
  const num = (xs) => xs.slice(0, 10).map((r, i) => `${i + 1}) ${punto(mayus(r))}`).join('\n')
  return { rpi: num(rpi), rifa: num(rifa), eeia: eeia.map((r, i) => `${String.fromCharCode(97 + i)}.- ${punto(mayus(r))}`).join('\n') }
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
    const cc = (Array.isArray(c.conceptoApoyo) ? c.conceptoApoyo : []).map((x, i) => (esObj(x) && ((x.enfoque || []).length || limpio(x.prioridad)) ? `- FASE ${romano(i + 1)}${limpio(x.nombre || fases[i]?.nombre) ? ` (${limpio(x.nombre || fases[i]?.nombre).replace(/^FASE\s+[IVX\d]+\s*[—–:-]?\s*/i, '')})` : ''}: enfoque de apoyo en ${(x.enfoque || []).join(', ') || '[definir]'}; prioridad de apoyo: ${limpio(x.prioridad) || '[definir]'}.` : '')).filter(Boolean)
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
  const sub = unidadesPropias(ctx).filter((x) => claseDe(x) === 'maniobra' && (!x.dependeDe || mismaUnidad(x.dependeDe, u))).map(nombreDe).sort((a, b) => ORDEN_ROL(rolDe(R, a)) - ORDEN_ROL(rolDe(R, b)))
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
      if (!vacio(t)) campos[id] = texto(t)
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
  'LA MISIÓN (PMTD 2017, Análisis de la Misión, paso 11): contiene QUIÉN (la unidad), QUÉ (el tipo de operación —ataca, defiende— y la tarea esencial como tarea táctica: destruye, fija, canaliza…), CUÁNDO (desde el D-2 hasta el D+3, con orden), DÓNDE (AO, objetivos, coordenadas) y el PROPÓSITO (el porqué). Ejemplo del PMTD: «La Div-2, defiende y destruye al batallón de tanques a partir del D(0600) hasta D+6 (1800) al sud de la LF. ÁGUILA con el propósito de permitir a la DBL-22 ejecutar el contraataque y destruir al Regimiento de tanques de Rojo en el AE. LEÓN.» En la Orden es la TRANSCRIPCIÓN de la misión aprobada por el Comandante.',
  'LA INTENCIÓN DEL COMANDANTE (PMTD 2017, paso 14 y Cap. VII): enunciado claro y conciso de lo que la fuerza debe desempeñar para tener éxito en relación con el terreno, el enemigo y el estado final deseado; el ENLACE entre la misión y el concepto: propósito, punto decisivo, tareas clave y estado final (cómo quedan la fuerza propia, la amenaza y el terreno). No entra en el «cómo». Se redacta en forma inextensa. Ejemplo del PMTD: «Mi intención es facilitar la destrucción de la FT-43 en el AE. YUNQUE por parte de la FT CALAMA y de esta manera evitar la conquista de VIACHA y VILLA BOLÍVAR, para esto es clave inicialmente aprovechar al máximo las características del terreno en los trabajos de OT… Al finalizar la operación, la FT “LANZA” se encontrará ocupando posiciones en Coord. 7600-4400, con eficiencia combativa, el RIMEC-6 habrá sido destruido por la FT “INGAVI” y las Unidades de la FT-43 se encontrarán comprometidas en el AE. “YUNQUE”, encontrándose nuestra Unidad en condiciones de realizar operaciones ofensivas con orden.»',
  'EL CONCEPTO DE LA OPERACIÓN (PMTD 2017, Desarrollo de los CAP, paso 4): «Vamos a cumplir la misión… (forma de maniobra / forma defensiva). El punto decisivo es … porque … Un (…) Operación decisiva, esfuerzo principal, (Tarea/propósito). Una … (Op. Configuración 1), esfuerzo secundario, (Tarea/propósito)… El propósito de los fuegos de artillería es… El propósito del apoyo de defensa aérea… El propósito del esfuerzo de ingenieros es… La operación de sostenimiento (tarea/propósito)… La misión se ejecutará en las siguientes fases… El estado final deseado…». Ejemplo del PMTD: «Vamos a cumplir la misión mediante una operación defensiva y de retardo en una parte de nuestro sector defensivo. El punto decisivo se encuentra materializado por el corredor de movilidad situado entre Co…… y Co…… porque el mismo posibilita que el primer y el segundo escalón de ataque de la FT-43 de ROJO pueda desviar su dirección de ataque hacia el sector de la Div-2 evitando su canalización. Un Equipo de Combate fuerte en Tanques OD, esfuerzo principal, defiende y bloquea a las Unidades enemigas del primer y segundo escalón de ataque entre Co… y Co… con el propósito de evitar que las mencionadas Unidades eludan la canalización hacia AE YUNQUE…» El Cap. VII: el concepto expande el curso de acción seleccionado; trata la operación decisiva y las de configuración; designa el esfuerzo principal PARA CADA FASE; incluye las misiones «estar preparado»; las fases se designan «Fase» y número romano.',
  'EL ESQUEMA DE MANIOBRA (PMTD 2017): «El enunciado de los cursos de acción se convierte en la base del párrafo III A 1 (Maniobra) del Plan u Orden de Operaciones y el bosquejo del curso de acción se convierte en la base del Calco de Operaciones.» La guía del enunciado: «Maniobra (UNIDADES DE MANIOBRA POR FASES). Para cada Unidad: Tarea, Propósito.» Trata la operación decisiva, las de configuración, las de seguridad y el empleo de la reserva (con su prioridad de planeamiento); es consistente con el calco y no duplica las tareas a las unidades. Termina con el riesgo táctico («El riesgo a afrontar es…, lo cual será mitigado mediante…»).',
  'EL APOYO DE FUEGOS (PMTD 2017): cuatro elementos — TAREA esencial de apoyo de fuegos (destruir, neutralizar, suprimir) sobre una formación o función enemiga; PROPÓSITO (el beneficio para la maniobra); MÉTODO (prioridades por fase, asignaciones y restricciones); EFECTO (cuantificado y observable: «destruir el 30 % de…», «evitar la maniobra…»). Luego a.- Apoyo aéreo (misiones de AAC por unidad), b.- Apoyo de artillería de campaña (prioridad de fuego, prioridad para la adquisición de blancos, restricciones y la Organización de la Artillería para el Combate: «RAC-21/CE-I : AG CE-I»), c.- Medidas de coordinación (permisivas y restrictivas).',
  'MOVILIDAD / CONTRAMOVILIDAD / SUPERVIVENCIA: prioridad de esfuerzo (movilidad, contramovilidad o supervivencia) y prioridad de trabajo (a qué unidad se apoya, en orden), con el propósito de los obstáculos. DEFENSA ANTIAÉREA: tarea, propósito, prioridad de apoyo, y los niveles de alerta (ROJA: ataque inminente; AMARILLA: ataque probable; VERDE: ataque improbable). INTELIGENCIA: enfoque de la recopilación (¿a qué está dirigida?), prioridad de apoyo (¿a qué unidad?) y recursos (¿con qué medios?). SOSTENIMIENTO: enfoque del apoyo logístico (abastecimiento, evacuación, transporte…) y prioridad de apoyo, por fase.',
  'TAREAS A LAS UNIDADES (Cap. VII, III.- B.- y C.-): mediante la emisión de órdenes, un subpárrafo por unidad, en la secuencia de la organización de la tarea, con la reserva; las tareas que son necesarias para la comprensión, claridad y énfasis; las que afectan a dos o más unidades van en las instrucciones de coordinación. Para las de apoyo de combate, sólo las tareas que no se especifican o sobreentienden en otra parte.',
  'INSTRUCCIONES DE COORDINACIÓN: las que aplican a dos o más unidades; los RCIC SOLAMENTE en «Información esencial requerida por el Comandante» (RPI y RIFA), nunca en los anexos; son diez o menos. La Matriz de riesgo aporta las medidas de control para la reducción de riesgos.',
  'ANEXOS (Cap. VII, V): en una ORDEN llevan el nombre del sistema (Anexo «B» Inteligencia; en un PLAN, «Plan de Inteligencia»); los numera la Sección III según el orden en que la Orden los menciona. Los de una unidad de maniobra (Tabla 28 del PMTD): Organización de la Tarea / Calco de Operaciones, Inteligencia, Apoyo de Fuegos, Defensa Antiaérea, Ingeniería, Apoyo de Servicio de Combate (o Logística, Personal y AC/GM por separado), Comunicaciones, Engaño. Los anexos tienen CONCEPTO DE APOYO, no intención.',
  'Encabezado del modelo: (CLASIFICACIÓN) · Unidad Superior · Unidad Considerada, PC., lugar, fecha y hora · EM./Sec. III Ops. · No. / Clave · ORDEN DE OPERACIONES No. … · OBJETO, CARTA, ANEXOS · ORGANIZACIÓN DE LA TAREA · I.- a V.- · EL COMANDANTE DE UNIDAD · Autenticación (JEM, G-3) · Distribución. El membrete, la numeración, la firma, la autenticación y la distribución los pone la Mesa.',
]
export const doctrinaParaIA = () => DOCTRINA.map((x) => `- ${x}`).join('\n')

// El nivel de detalle que se espera, con la OGO del CE-I «KILÓMETRO 7» (ejercicio de la Escuela: AZUL contra MAGENTA).
// Es la FORMA: la IA no copia sus unidades, sus lugares ni sus cifras.
export const EJEMPLO = `EJEMPLO DE REDACCIÓN — ORDEN GENERAL DE OPERACIONES No. 01/21 del CE-I «KILÓMETRO 7» (OTRO ejercicio de la Escuela: AZUL contra MAGENTA). Copiá el NIVEL DE DETALLE, la FORMA y el TONO; nunca sus unidades, sus lugares ni sus cifras.

I.- SITUACIÓN. A.- Fuerzas enemigas. … D.- Curso de Acción del Enemigo más probable.
«Fuerzas del EO de MAGENTA del valor de hasta 16 Batallones, atacan y derrotan a las Fuerzas defensivas de AZUL, a partir del D (0400), progresando sobre su posición por dos ejes de penetración… Para esto, abandonará su zona de apresto lejano HUACHACALLA… La DE-VI ocupará su posición de ataque al norte de Co. LLALLAGUANI… Las Brigadas de la DE-I atacan por la AA-1 y conquistan Co. TUSQUI…, con el propósito de ganar terreno que permita conquistar Co. CHIVO… El propósito de los ingenieros de combate es abrir brechas… Los fuegos suprimirán las fuerzas blindadas de contraataque de AZUL… El propósito de la defensa aérea es evitar el Apoyo Aéreo Cercano… Al finalizar la operación las fuerzas de AZUL habrán sido derrotadas en sus posiciones, MAGENTA habrá conquistado y controlado la PAMPA DE LOS CHIVOS…»

B.- Situación Propia. 1.- CTO. a.- Misión. b.- Intención del Comandante del CTO. 2.- FFTTTO. a.- Misión. b.- Intención del Comandante de las FF.TT.TO. c.- Concepto de la Operación (con sus fases y el papel de cada CE).

II.- MISIÓN. «El CE-I defiende y derrota a las fuerzas de la DE-I y DE-VI, a partir del D (0400) hasta el D (1800), en su área de operaciones PAMPA DE LOS CHIVOS, con el propósito de establecer las condiciones para detener el esfuerzo principal de ataque de MAGENTA, y disminuir su poder de combate.»

III.- EJECUCIÓN. Intención del Comandante del CE-I.
«El propósito de la Operación es disminuir el poder de combate enemigo, hasta que no puedan reaccionar a nuestro contraataque, para esto será necesario cumplir las siguientes tareas claves: PRIMERO.- Sobreextender las líneas de comunicación y ejes de abastecimiento de MAGENTA. SEGUNDO.- Aislar a las Brigadas Reserva… TERCERO.- Ejecutar ataques violentos sobre los flancos enemigos. Al final de la Operación las Fuerzas atacantes de MAGENTA habrán sido detenidas y derrotadas, el CE-I mantendrá un poder de combate superior, los civiles afectados serán puestos en condiciones de seguridad, y podremos continuar con operaciones futuras…»

A.- Concepto de la Operación.
«Cumpliremos la misión mediante la ejecución de una operación defensiva – defensa móvil, el punto decisivo para la operación es la derrota de las Brigadas Reserva de MAGENTA en el AE GUANO y AE SALITRE, porque de esta manera perderá sus medios físicos para continuar su avance… La operación se desarrollará en las siguientes fases: FASE I (DEFENSA) desde el D (0400) hasta el D (1300). FASE II (CANALIZACIÓN) desde el D (1300) hasta el D (1530). FASE III (DERROTA) desde el D (1530) hasta el D (1800).»

1.- Movimiento y Maniobra.
FASE I (DEFENSA) desde el D (0400) hasta el D (1300).
«La FT 32 RIOS, (OC-3) esfuerzo secundario, ejecuta la cobertura de las unidades de maniobra del área principal de combate, ocupando posiciones en KOTOKKOTA PAMPA y Co. KIVILLANI (LF BRUMA), con el propósito de evitar ataques sorpresivos y ganar el contacto con las fuerzas atacantes… Con orden, inicia su repliegue por rutas establecidas, empleando PP definidos en su Plan de Repliegue… Una vez en la retaguardia, ocupa posiciones en ACAUQUIRI PAMPA, pasando a constituir la RESERVA del CE-I.»
«La DIMEC-2 (OC-2), esfuerzo principal, recibe a una unidad de la FT 32 RIOS, asume la responsabilidad de la batalla, y defiende y derrota al Batallón de la BA de MAGENTA que ataca por el sector ESTE de la LF NIEBLA, con el propósito de impedir su avance y limitar el ímpetu de ataque inicial del enemigo.»
«La DIBLIN-3 (OD) constituirá la RESERVA hasta que la FT-32 RIOS asuma esta función. Ocupa posiciones en ECIA. SEVENCANI VINTO, en condiciones de apoyar a las unidades de primera línea, con prioridad de planeamiento a la OC-1 y OC-2.»
FASE II (CANALIZACIÓN) … FASE III (DERROTA) … (las mismas unidades, con su tarea y su propósito en cada fase; el esfuerzo principal cambia de fase a fase).
«El riesgo a afrontar es dividir la fuerza de golpe en tres núcleos de contraataque…, lo cual será mitigado mediante la reconstitución rápida de una nueva reserva por parte de la FT-32 RIOS…»

2.- Fuegos. «Los fuegos buscarán dar profundidad a la batalla, desorganizando la progresión ordenada de las unidades de maniobra enemigas… Asimismo, neutralizan los sistemas de tiro indirecto de largo alcance… La prioridad de apoyo de fuegos en la FASE I a la OC-3, OC-1, OC-2 y OD en ese orden. En la FASE II a la OC-1, OC-2 y OD…»
a.- Apoyo aéreo cercano. «1) La prioridad inicial del Apoyo Aéreo Cercano será a las unidades de maniobra del CE-I, mediante la destrucción de los sistemas de armas de tiro indirecto y sistemas de comando y control. 2) El CE-I cuenta con 15 misiones diarias…: a) CE-I: 4 b) DIMEC-1: 4 …»
b.- Apoyo de artillería de campaña. «1) Prioridad de fuego. En la FASE I a la OC-3. En la fase II a la OC-1 y OC-2… 2) Prioridad para la adquisición de blancos. Instalaciones de mando y control. Unidades de Artillería de Campaña… 3) Restricciones. AFP todas las poblaciones… 4) Organización de la Artillería para el Combate. RAC-21/CE-I : AG CE-I; GAC-I/DIMEC-1 : AD DIMEC-1…»
3.- Reconocimiento e Inteligencia. 4.- Ingeniería («El propósito del apoyo de ingeniería para la preparación y fase I es asegurar la movilidad por el PASO DEL ANTA. Para la fase II es contramovilidad…»). 5.- Defensa Antiaérea. 6.- Protección. 7.- Operaciones de Información. 8.- Asuntos Civiles.

B.- Tareas a las Unidades de Movimiento y Maniobra.
«1.- DIMEC-1 (OC-1). a. Recibe a un Batallón de la FT 32 RIOS. b. Asume la responsabilidad de la batalla en su sector. c. Derrota al Batallón de la BA de MAGENTA que ataca por el sector OESTE de la LF NIEBLA. d. Se repliega y canaliza a las fuerzas remanentes de la BA… e. Cede espacio hasta LF. NIEBLA. f. Bloquea a la BA reserva de la DE-VI de MAGENTA, sobre la LF HUMO.» (y así cada unidad, con la reserva)

C.- Tareas para las unidades de apoyo de combate. «1.- RAC-21. Suprime las amenazas de MAGENTA sobre los puntos de pasaje 1, 2, 3 y 4 mediante fuegos de concentración… 3.- BATING-XXIII. Proporciona apoyo de contramovilidad… mediante la construcción de zanjas antitanque…»

D.- Instrucciones de coordinación. «1.- La presente orden entra en vigor a partir de su emisión. 2.- Requerimientos críticos de información del comandante: a.- RPI: 1) ¿Por dónde lleva el enemigo su esfuerzo principal? 2) ¿Cuándo empleará MAGENTA sus helicópteros de ataque?… b.- RIFA: 1) Informar cuándo la FT-32 RIOS concluya su repliegue. 2) Informar cuando las UU. de maniobra bajen 10, 15 y 20 % de su eficiencia combativa… 4.- Medidas de control para la reducción de riesgos: a.- Los contraataques deberán disponer de rutas previamente establecidas… 9.- Límite de Avance de las tropas: a.- FT-32 RIOS: Camino SANTUARIO DE QUILLACAS – TAMBO TAMBILLO… 11.- Medidas de fuego indirecto: a.- Permisivas: 1) LCAF sobre el camino AROMA – PAMPA AULLAGAS… b.- Restrictivas: 1) Áreas de fuego prohibido: Ecia. KIVILLANIK (Coord 9940 – 6330)… 12.- La ejecución del ensayo de comprobación y repetición de órdenes se realizará el D-1 (0600) en el PCP del CE-I Ecia SUMA. 13.- El nivel de amenaza actual en el área de retaguardia es Nivel II.»

IV.- SOSTENIMIENTO / APOYO DE SERVICIO (Ver anexo). «A.- Logística. El sistema de apoyo logístico del CE-I está enfocado a… B.- Personal. … Instalará y operará un puesto de reunión de PP.GG. en COROMA (Coord. 2950 – 3950). La prioridad de apoyo de reemplazos a la OD, OC-1 y OC-2, en ese orden a partir del D-1 (0800).»

V.- COMANDO Y COMUNICACIONES. «A.- Comando. 1.- Cadena de Mando: a.- Comandante del CE-I. b.- Jefe de Estado Mayor del CE-I. c.- G-3 del CE-I. d.- Cmte. de DIBLIND-3… 2.- Ubicación del Puesto Comando: a.- PCA. del CE-I Ecia. ICHALULA (Coord. 9490 – 5410). b.- PCP. … c.- PCR. … B.- Comunicaciones. 1.- IEC «ANGEL» en vigor a partir del día D-5 (1800). 2.- Centro de Comunicaciones: CC. Adelantado…, CC. Principal…, CC. Retrasado…»

A nivel Regimiento, la Orden de Operaciones 05/24 del RI-20 escribe las tareas de cada fase como «Compañía "A". TAREA: … PROPÓSITO: …»: la misma idea, más corta.`

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
  add('Las unidades propias en el calco (con su rol y su clase)', us.map((u) => `- ${conRol(R, nombreDe(u))} — ${claseDe(u) === 'maniobra' ? 'maniobra' : claseDe(u) === 'apoyo' ? 'apoyo de combate' : 'apoyo de servicio de combate'}${u.escalon ? `, ${u.escalon}` : ''}${limpio(u.dependeDe) ? `, depende de ${limpio(u.dependeDe)}` : ''}${limpio(u.relacion) ? ` (${limpio(u.relacion)})` : ''}`).join('\n'))
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
  add('RCIC y EEIA del G-3 (F2·P8)', filasTxt(g3.rcic))
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
  return B.join('\n\n')
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
export function estructurar(t, { llano = false } = {}) {
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
    if (FASE.test(l) && l.length <= 220) {
      const dos = l.length > 110 ? l.match(/^(.{6,110}?):\s+(.+)$/) : null
      fase = { titulo: dos ? punto(dos[1]) : punto(l), sinRotulo: true, items: dos ? [{ v: false, l: dos[2] }] : [], hijos: [] }
      raiz.hijos.push(fase)
      pila.length = 0
      continue
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
    const propio = n.id ? estructurar(C[n.id], { llano: !!n.sinNumero }) : { texto: '', vinetas: [], hijos: [] }
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
  for (const id of idsDe()) campos[id] = texto(o.campos?.[id] ?? '')
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
    'Dentro de un apartado, los subapartados se escriben «1.- DIV MEC-2 (OD).», «a.- …», «1) …» y las fases «FASE I (NOMBRE) desde … hasta …», cada uno en su renglón: el Word los numera solo (I.- A.- 1.- a.- 1) a)).',
    'Los RCIC van SOLAMENTE en III.- D.- 2.- (no en los anexos). Una ORDEN no lleva hipótesis (sólo el PLAN).',
    'Controlá los anexos (🗺️ abajo): Inteligencia (G-2), Apoyo de Fuegos, Ingeniería, Apoyo de Servicio de Combate (G-4), Personal (G-1) y AC/GM (G-5).',
    '👁️ Vista previa y 📄 Word (formato militar): membrete, la Organización de la Tarea en cuadro, la numeración del PMTD, la firma del Comandante, la autenticación y la distribución.',
  ],
  ejemplo: '«La DIV MEC-2 (OD), esfuerzo principal, defiende sobre la LF «PUMA» y bloquea a la 1ª Br. Ac. en el paso Ungallire–Guata, con el propósito de impedir que penetre hacia TURCO.» Una oración por unidad y por fase: quién, qué, dónde, cuándo y para qué.',
}

export const PRODUCTO = (ctx, hoja) =>
  `Tu producto es la ORDEN GENERAL DE OPERACIONES ${unidadDe(ctx) ? `${articuloDe(unidadDe(ctx)) === 'DEL' ? 'del' : 'de la'} ${unidadDe(ctx)} ` : ''}(hoja ${hoja?.num || 'F7·P1'} del PMTD, Fase VII «Elaborar planes y órdenes»): el documento en el que desemboca TODO el planeamiento. La coordina el G-3, la escribe todo el Estado Mayor y la firma el Comandante. Va con la forma de CINCO PÁRRAFOS del TEXTO PMTD 2017 (Parte Primera, Capítulo VII), apartado por apartado: OBJETO, CARTAS, ANEXOS; ORGANIZACIÓN DE LA TAREA; I.- SITUACIÓN; II.- MISIÓN; III.- EJECUCIÓN (la Intención del Comandante sin número, A.- Concepto de la operación con 1.- Maniobra … 9.- Operaciones de AC/GM, B.- Tareas de las unidades de maniobra, C.- de apoyo de combate, D.- Instrucciones de coordinación); IV.- APOYO DE SERVICIO; V.- COMANDO Y COMUNICACIONES. Tiene que INTEGRAR todo lo que ya trabajó el Estado Mayor en la Mesa: la Orden del escalón superior, el CAE más probable y el más peligroso del G-2, la misión aprobada, la intención y los RCIC del Comandante, el CAP aprobado con su maniobra FASE POR FASE y la tarea y el propósito de CADA unidad, los fuegos, el plan de barreras, el reconocimiento, la matriz de riesgo, la matriz de sincronización y los anexos del G-1, G-4 y G-5. Tiene que quedar COMPLETA, con el nivel de detalle de una orden real de Cuerpo de Ejército o División (ver el EJEMPLO DE REDACCIÓN): nada de resúmenes, de cuentas sueltas («13 trabajos», «18 límites») ni de remisiones a hojas de la Mesa («ver F3·P4»). El membrete, la numeración, la firma, la autenticación y la distribución los pone la Mesa.`

export const REGLAS = [
  'Dentro de un apartado, los SUBAPARTADOS van cada uno en su renglón con su marca: «1.- DIV MEC-2 (OD).» (y su texto en el renglón siguiente o después de «:»), «a.- …», «1) …», «a) …»; las fases, «FASE I (NOMBRE) desde el … hasta el ….» en su propio renglón. La Mesa los numera en el Word: la marca sólo dice el nivel.',
  'NO repitas el título del apartado dentro de su texto ni le pongas la numeración del apartado («III.- A.- 1.-»): eso lo pone la Mesa.',
  'Ninguna clave queda vacía ni con «…». Lo que no corresponda: «Omitido.» (refuerzos, QBN) o, si de verdad falta el dato, «SIN DATO — verificar» en ese dato. La «hipotesis» va VACÍA en una ORDEN (sólo el PLAN la lleva).',
  'Las unidades, lugares, líneas, puntos, coordenadas, días y horas son SÓLO los del expediente (la Orden superior, el calco, las fases del CAP, las hojas). No inventes unidades ni las renombres.',
]

export const VERIFICACION = [
  'Están TODAS las claves del JSON con texto de ESTA situación; la Orden se lee completa de OBJETO a V.- COMANDO Y COMUNICACIONES, sin huecos.',
  'MISIÓN: una oración con quién, qué (tipo de operación + tarea táctica), cuándo (D y hora), dónde y «con el propósito de…»; es la misión aprobada (F2·P12) del expediente.',
  'INTENCIÓN: propósito, punto decisivo, tareas clave (numeradas) y estado final (fuerza propia, enemigo, terreno); NO describe la maniobra.',
  'CONCEPTO: «Cumpliremos la misión mediante…», el punto decisivo y el porqué, la operación decisiva y las de configuración, el esfuerzo principal de cada fase y la lista de FASES con su nombre y desde/hasta.',
  'MANIOBRA: FASE POR FASE, CADA unidad de maniobra del CAP aprobado con su designación real, (OD / OC-n / RESERVA), esfuerzo principal o secundario, su tarea táctica, dónde y «con el propósito de…»; la reserva con su prioridad de planeamiento; el riesgo y cómo se mitiga. Coincide con las fases y las fichas de la carta.',
  'APOYO DE FUEGOS: tarea (destruir / neutralizar / suprimir) sobre una formación enemiga, propósito, método (prioridad por fase, asignación, restricciones) y efecto cuantificado; a.- b.- c.- con contenido; OAPC con la relación de cada unidad de artillería.',
  'TAREAS: un subpárrafo «1.- UNIDAD (rol).» por unidad de maniobra (con la reserva) y otro por unidad de apoyo de combate, cada uno con sus tareas «a.- …» en orden cronológico, en presente impositivo («defiende», «bloquea», «se repliega»).',
  'INSTRUCCIONES DE COORDINACIÓN: vigencia; RCIC (RPI como preguntas, RIFA como «Informar…», diez o menos); medidas de reducción de riesgos de la matriz; reglas; ambiente; protección; adicionales (puntos de contacto, enlaces, puntos de decisión); límite de avance; MCAF; ensayo (tipo, lugar y D-hora); nivel de amenaza.',
  'IV y V completos: concepto de apoyo POR FASE, logística, personal, AC/GM; sucesión de mando; PCP / PCA / PCR con su ubicación; IOC en vigor; prioridad de las comunicaciones.',
  'Redacción impositiva, positiva y en presente; sin «tratará de», sin cuentas sueltas, sin coordenadas decimales sueltas, sin «[IA — verificar]» y sin remisiones a hojas de la Mesa.',
]
