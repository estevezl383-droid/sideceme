// Guía de Planificación del Comandante (F2·P15) y Guía de Planificación Final (F6·P2) con el
// formato del PMTD 2017 (Parte Tercera, Cap. II «Guía del Comandante»).
//
// Lo pidió Sergio el 27-10-2026 con el Word de la F2·P15 del CE-I y el formato de la Escuela al
// lado: la hoja era un cuadro «Área / Sección · Guía impartida · Observación» y el Word salía con
// un párrafo «A.- Área / Sección: … · Guía impartida: … · Observación: …» por renglón. El formato
// son los párrafos I.- a XIII.- (la Final, I.- a VI.-), cada uno con su título.
//
// Acá están las dos hojas (campos, ayuda de cada campo y lo que se le dice a la IA) y la lectura
// de lo que ya estaba escrito con el cuadro viejo: cada renglón pasa al párrafo que le toca por
// su «Área / Sección» (y si no se reconoce, por lo que dice), sin perder nada.
// Sin DOM: se prueba en Node (calcos/pruebas/guia-planificacion.mjs).

const PLAN = [
  ['I.- LA OPERACIÓN DECISIVA',
    'Si el Comandante desea puede ya identificar la operación decisiva o podrá dejar a su Estado Mayor o Plana Mayor para que lo establezca. Ej.: «Deseo que la operación decisiva sea planificada durante la tercera fase mediante un retardo desde LF. SIERRA a LF. COMBO; para ello se debe considerar la capacidad de movilidad de las Unidades empeñadas».'],
  ['II.- CURSOS DE ACCIÓN PROPIOS Y DEL ENEMIGO PARA SER CONSIDERADOS',
    'Cuántos cursos de acción propios deberán ser elaborados y qué cursos de acción del enemigo, de los expuestos en la Orientación del Análisis de la Misión, se deberán tomar en cuenta.'],
  ['III.- REQUERIMIENTOS CRÍTICOS DE INFORMACIÓN DEL COMANDANTE (RCIC)',
    'El Comandante guía los requerimientos de información que sean de interés para la operación.'],
  ['IV.- LA GUÍA DE RECONOCIMIENTO',
    'Hacia dónde enfoca el esfuerzo de búsqueda de información de los reconocimientos. Ej.: «Los reconocimientos están autorizados a partir del D-10, enfocados a determinar las características del terreno útil para la defensa, sectores de tiro con buena observación y campos de tiro hacia las avenidas de aproximación, y las posibilidades de desplazamiento de fuerzas propias y enemigas».'],
  ['V.- RIESGO',
    'De los riesgos que el JEM. expuso en la Orientación del Análisis de la Misión, a cuáles se les da prioridad en la implementación de controles. Ej.: «Deseo que trabajen en la Fase I sobre el riesgo de emboscadas y en la Fase II sobre el riesgo de fratricidio sobre la Div-2».'],
  ['VI.- ENGAÑO MILITAR',
    'Dónde desea el Comandante, de acuerdo a su visualización, que se realice la operación de engaño.'],
  ['VII.- APOYO DE FUEGOS',
    'Cómo deberá ser el apoyo de fuegos de los medios disponibles (artillería, morteros, apoyo de fuego aéreo, etc.); qué medidas permisivas y restrictivas deberán planificarse y dónde; cómo y en qué deberá consistir el apoyo de defensa antiaérea.'],
  ['VIII.- APOYO DE INGENIERÍA (MOVILIDAD/CONTRA MOVILIDAD)',
    'La prioridad de trabajo (movilidad, contramovilidad o supervivencia), en qué lugares y el propósito que buscarán esos trabajos.'],
  ['IX.- MEDIDAS DE SEGURIDAD',
    'Qué medidas de seguridad se implementan, con énfasis en lo propio de la operación: en una División, las responsabilidades sobre la Seguridad en el Área de Retaguardia (SAR.) y el Control de Daños de Área (CDA.); la seguridad de las comunicaciones, de los estacionamientos, de los movimientos, de los flancos, etc.'],
  ['X.- PLAN DE TIEMPO',
    'Sobre la Línea de Tiempo que expuso el JEM. en la Orientación del Análisis de la Misión, las actividades y plazos que el Comandante implementa o modifica. Ej.: «El D-10 debe ser expedida la Orden de Operaciones a las Unidades de maniobra; desde ese día el G-3 dispone su preparación; todas las Unidades en eficiencia el D-2».'],
  ['XI.- TIPO DE ORDEN QUE SE DEBE DISTRIBUIR',
    'El tipo de orden a distribuir (PMTD 2017, Cap. VII «Elaboración de Planes y Órdenes»).'],
  ['XII.- TIPO DE ENSAYO QUE SE DEBERÁ LLEVAR A CABO',
    'El tipo de ensayo (Reglamento «Ensayos Militares» RO-06-01-03), la técnica que se empleará, lugar, fecha y hora, y otras disposiciones necesarias.'],
  ['XIII.- PRIORIDADES DE APOYO DE SERVICIO DE COMBATE',
    'El enfoque de apoyo logístico (cuál es la función logística principal y la prioridad de apoyo), el enfoque de apoyo de personal y algunas prioridades de AC/GM. Ej.: «Abastecimientos principalmente de Clase III y V, prioridad a las Unidades de primera línea… Los reemplazos serán efectivos a partir del D+1… El G-5 coordinará la evacuación de la población civil hasta el D-20».'],
]

const FINAL = [
  ['I.- DECISIÓN',
    'La decisión del Comandante: qué curso de acción propio es el elegido para articular el Plan u Orden de Operaciones. Ej.: «Señores miembros de la Plana Mayor, mi decisión es que el Curso de Acción Propio No. 2 es el más adecuado para cumplir con la misión asignada».'],
  ['II.- INTENCIÓN DEL COMANDANTE',
    'La Intención del Comandante, mejorada en base a las orientaciones posteriores o mantenida como definitiva; cualquiera sea el caso, se la hace conocer.'],
  ['III.- REQUERIMIENTOS CRÍTICOS DE INFORMACIÓN DEL COMANDANTE',
    'Los nuevos RCIC. para llenar los vacíos de información durante la preparación y la ejecución: Requerimientos Prioritarios de Inteligencia (enemigo, terreno y CC.MM.) o Requerimientos de Información de las Fuerzas Amigas (RIFA.).'],
  ['IV.- PRIORIDADES PARA LOS SISTEMAS OPERATIVOS DEL CAMPO DE BATALLA',
    'Si existen las condiciones y la necesidad, prioridades de apoyo de las Unidades de apoyo de combate o de apoyo de servicio de combate hacia las Unidades de maniobra en algunas fases.'],
  ['V.- DISPOSICIONES SOBRE LA ELABORACIÓN DE LOS PLANES U ÓRDENES',
    'Medidas para la elaboración de los planes u órdenes y sus anexos: tipo de orden, cantidad de anexos, plazos para su elaboración, etc. (si no lo dijo en la Guía de Planificación). Ej.: «Será una Orden de Operaciones con todos sus Anexos, sin Anexo de Organización de la Tarea… lista para su emisión el D-3 (0800)».'],
  ['VI.- DISPOSICIONES SOBRE LA PREPARACIÓN Y EJECUCIÓN DE ENSAYOS',
    'Disposiciones sobre el tipo de ensayo y la técnica usada, si no las dio en su Guía de Planificación.'],
]

// Cada renglón del cuadro viejo va al párrafo cuyo patrón reconoce su «Área / Sección»; si el área
// no dice nada, se mira lo que dice el renglón. El orden importa: lo más específico primero.
const REGLAS_PLAN = [
  [/engan|decepci/, 5],
  [/riesgo/, 4],
  [/ensayo/, 11],
  [/tipo de orden|orden a (distribuir|elaborar)/, 10],
  [/tiempo|plazo|cronograma/, 9],
  [/seguridad|comunicaci|\bsar\b|\bcda\b|contrainteligencia/, 8],
  [/ingenier|movilidad|obstacul|barrera|supervivencia/, 7],
  [/fuego|artiller|antiaere|\bada\b|\baa\b|mortero|cohete/, 6],
  [/reconoc|busqueda|vigilancia/, 3],
  [/rcic|requerimiento|inteligencia|\bg-?2\b|\brpi\b|eeia/, 2],
  [/curso|\bcaps?\b|\bcaes?\b|metodo|apreciaci/, 1],
  [/logist|personal|asuntos civiles|\bac\/?gm\b|\bg-?[145]\b|sanidad|abastec|servicio de combate|reemplazo|evacuaci/, 12],
  [/operaci|maniobra|\bg-?3\b|decisiv|esfuerzo/, 0],
]
const REGLAS_FINAL = [
  [/ensayo/, 5],
  [/orden|plan|anexo|elaboraci/, 4],
  [/rcic|requerimiento|inteligencia|\bg-?2\b|\brpi\b|rifa/, 2],
  [/intenci/, 1],
  [/decisi|curso|\bcaps?\b/, 0],
  [/./, 3],
]

const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const texto = (v) => String(v ?? '').replace(/\s+$/g, '').trim()

function definir(id, num, nom, campos, extra) {
  return {
    id, num, nom, tipo: 'campos', entrega: 'SE DIFUNDE SÓLO AL ESTADO MAYOR',
    campos: campos.map(([c]) => c),
    ayudaCampos: Object.fromEntries(campos.map(([c, a]) => [c, a])),
    ayudaIA: 'ES EL FORMATO DE LA ESCUELA (PMTD 2017, Parte Tercera, Cap. II «Guía del Comandante»): cada clave es un párrafo del documento con su numeración romana, en ese orden. Escribí en cada uno la guía del Comandante en primera persona y en forma directiva («Deseo que…», «La prioridad será…»), con los nombres de las unidades, del terreno y de las fases del expediente. No copies la explicación de abajo: es lo que tiene que decir cada párrafo.\nQUÉ VA EN CADA CLAVE:\n' +
      campos.map(([c, a]) => `- "${c}": ${a}`).join('\n'),
    ...extra,
  }
}

export const HOJA_GUIA_PLANIFICACION = definir('guiaPlanificacion', 'F2·P15', 'Guía de Planificación del Comandante', PLAN, {
  legado: { cols: ['Área / Sección', 'Guía impartida', 'Observación'], reglas: REGLAS_PLAN, porDefecto: 0 },
  nota: 'DISTINTA de la Guía Inicial: ésta sale DESPUÉS de la Orientación del Análisis de la Misión y con ella el Estado Mayor recién puede desarrollar los cursos de acción. Va con el formato del PMTD 2017 (Parte Tercera, Cap. II): los trece párrafos I.- a XIII.-, cada uno con su título y en ese orden (el que quede sin guía sale sólo con su título, así no se corre la numeración).',
})

export const HOJA_GUIA_FINAL = definir('guiaFinal', 'F6·P2', 'Guía de Planificación Final', FINAL, {
  legado: { cols: ['Área / Sección', 'Guía final impartida', 'Plazo'], reglas: REGLAS_FINAL, porDefecto: 3 },
  nota: 'La última guía: con ella el Estado Mayor escribe la Orden General de Operaciones y sus anexos. Habilita la Orden Preparatoria N° 3 del G-3. Va con el formato del PMTD 2017: I.- DECISIÓN, II.- INTENCIÓN, III.- RCIC., IV.- PRIORIDADES PARA LOS SISTEMAS OPERATIVOS, V.- ELABORACIÓN DE LOS PLANES U ÓRDENES y VI.- ENSAYOS.',
})

const HOJAS = { guiaPlanificacion: HOJA_GUIA_PLANIFICACION, guiaFinal: HOJA_GUIA_FINAL }

// El párrafo que le toca a un renglón del cuadro viejo.
export function parrafoDe(hoja, fila) {
  const { cols, reglas, porDefecto } = hoja.legado
  const area = sinTildes(fila?.[cols[0]])
  const todo = sinTildes(cols.map((c) => fila?.[c]).join(' '))
  for (const t of [area, todo]) for (const [re, i] of reglas) if (t && re.test(t)) return hoja.campos[i]
  return hoja.campos[porDefecto]
}

// Un renglón del cuadro viejo, como texto del párrafo.
function textoFila(hoja, fila) {
  const [, guia, obs] = hoja.legado.cols
  const g = texto(fila?.[guia]), o = texto(fila?.[obs])
  if (!g && !o) return ''
  return [g, o && `${obs}: ${o}`].filter(Boolean).join(' ')
}

const esFila = (hoja, v) => v && typeof v === 'object' && !Array.isArray(v) && hoja.legado.cols.some((c) => c in v)

// Lo guardado de la hoja, con el formato de los párrafos. Lo que ya está en un párrafo no se toca;
// los renglones del cuadro viejo (la hoja entera era una lista, o quedaron como «0», «1»… después
// de escribir encima) se suman al párrafo que les toca. Devuelve null si no hay nada que convertir.
export function leerGuia(hoja, valor) {
  const h = HOJAS[hoja?.id]
  if (!h || hoja.tipo !== 'campos' || !valor || typeof valor !== 'object') return null
  const filas = Array.isArray(valor) ? valor : Object.entries(valor).filter(([k, v]) => /^\d+$/.test(k) && esFila(h, v)).map(([, v]) => v)
  if (!filas.length) return null
  const out = Array.isArray(valor) ? {} : Object.fromEntries(Object.entries(valor).filter(([k, v]) => !(/^\d+$/.test(k) && esFila(h, v))))
  const suma = {}
  for (const f of filas) {
    const t = textoFila(h, f)
    if (!t) continue
    const c = parrafoDe(h, f)
    ;(suma[c] ||= []).push(t)
  }
  for (const [c, ts] of Object.entries(suma)) if (!texto(out[c])) out[c] = ts.join('\n\n')
  return out
}
