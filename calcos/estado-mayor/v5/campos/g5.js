// G-5 ASUNTOS CIVILES Y GOBIERNO MILITAR — lo que el motor necesita para trabajar las hojas
// del G-5 en «📋 Mis hojas» (lo pidió Sergio el 03-10-2026, con capturas del panel del G-5:
// la Apreciación y el Anexo «se bajaban hechos» y no se podían trabajar):
//
//   · los DOCUMENTOS con forma militar:
//       F1·P3 / F2·P13  APRECIACIÓN DE SITUACIÓN DE AC/GM  (modelo «aprec-acgm» de la
//                       Escuela, el que ya está en el catálogo del formato militar)
//       F7·P1           ANEXO DE AC/GM a la Orden            (la Escuela NO tiene modelo de
//                       anexo del G-5 en el catálogo: es la estructura del Anexo de AC/GM que
//                       ya bajaba la Mesa —fNe del compilado—, con el formato militar común:
//                       membrete, OCA, firma; así lo pidió Sergio)
//   · la DOCTRINA del campo de AC/GM (el modelo, la secuencia de planeamiento de AC/GM que ya
//     usaba el panel del G-5, el DICA y el PMTD), que va a la IA;
//   · lo que la Mesa trae del CALCO (🌱, sin pisar), con la MISMA cuenta del panel del G-5:
//     el inventario de recursos del área (capas + Censo 2024) con la clasificación del G-5
//     (EXPLOTABLE / PROTEGIDO / NEGADO), la población, la previsión de evacuación (agua,
//     raciones, albergues, transporte), lo que se descarga al G-4, los ejes humanitarios (y
//     si se montan sobre el EPA), las instalaciones de AC/GM y los bienes protegidos, las
//     fichas, las fases del COA y lo que entregaron la Orden, el G-1, el G-2 y el G-4;
//   · la GUÍA «¿Para qué es y cómo se llena?» y la 🌱 de las hojas de trabajo del G-5
//     (F2·P3, F2·P5, F2·P6, F2·P8, F2·P11, F3·P1, F5·P1, F6·P3).
//
// Sin DOM: se prueba en Node.
import { limpio, texto, sinMarcaIA, romano, lista, esObj, claveTexto, normalizar, tiene } from '../motor.js'
import { articuloDe } from '../../../riesgo/v1/modelo.js'
import { distKm, largoKm, limpiar, fmtKm, distPuntoLinea } from '../../../logistica/v1/geo.js'

export const ID = 'g5'
export const COLOR = '#a78bfa'
export const SECCION_IA = 'SECCIÓN V — ASUNTOS CIVILES Y GOBIERNO MILITAR (G-5) del Estado Mayor'

// ════════════════════════════════════════════════════════════════════════════════════
// DOCTRINA
// ════════════════════════════════════════════════════════════════════════════════════
export const FUENTES = {
  aprec: 'Modelo de Apreciación de Situación de AC/GM (EM. o Pl. My. / Sec- V) de la Escuela',
  secuencia: 'secuencia de planeamiento de AC/GM del panel del G-5 de la Mesa',
  anexo: 'Anexo de AC/GM de la Mesa (estructura propia; la Escuela no tiene modelo de anexo del G-5 en el catálogo)',
  dica: 'DICA: IV Convenio de Ginebra (1949), Convención de La Haya (1954) y Protocolo Adicional I (1977)',
  pmtd: 'PMTD (Visión Horizontal del PMTD 2020)',
}
// Las referencias de planeamiento del panel del G-5 (las mismas constantes del compilado:
// Lse, Dse, zU, Nse y el agua por fuente de SDe). Son editables en el panel y se confirman
// con un reconocimiento especializado antes de contar con ellas.
export const REF = { aguaL: 20, raciones: 1, porAlbergue: 150, plazas: 40, aguaFuenteL: 5000, pctEvacuar: 30, dias: 3 }
// Las instalaciones de AC/GM del catálogo de la Mesa (grupo «ac»).
export const GRUPOS = {
  pc: ['pc_acgm'],
  evacuacion: ['p_evac_civ', 'c_ctrl_evac', 'destino_seguro'],
  ayuda: ['p_ayuda'],
  protegidos: ['bien_protegido'],
  recursos: ['recurso_local'],
}
export const TODAS_AC = Object.values(GRUPOS).flat()
// Instalaciones de otras secciones que pesan en AC/GM (II.- C.- del modelo).
const GRUPOS_PERSONAL = ['personal']
const GRUPOS_LOG = ['areas', 'mando', 'abast', 'agua', 'mant', 'sanidad', 'transp']
export const UMBRAL_EPA_KM = 0.5 // un eje humanitario a menos de 500 m del EPA «se monta» sobre él (criterio de la Mesa)
export const ESTADOS = [
  { id: 'explotable', nom: 'EXPLOTABLE' },
  { id: 'protegido', nom: 'PROTEGIDO' },
  { id: 'negado', nom: 'NEGADO' },
  { id: 'sin', nom: 'sin clasificar' },
]

export const DOCTRINA = [
  `LAS FUNCIONES DE AC/GM (${FUENTES.aprec}, III.- ANÁLISIS): A) Unidades y operaciones de AC/GM (escalón de ocupación y escalón de apoyo de combate); B) Gobierno (gobierno civil o militar; justicia, ley y orden público; seguridad pública; salud pública; bienestar y beneficio; hacienda pública y finanzas; educación pública; trabajo); C) Economía política (economía; comercio e industria; control de recursos y agricultura; control de precios y racionamiento; control de propiedad; abastecimientos civiles); D) Instalaciones públicas (servicio, comunicaciones y transporte públicos); E) Funciones especiales (informaciones públicas y civiles; desplazados, expatriados y refugiados; bellas artes, monumentos y archivos; religión). En cada función: necesidades, disponibilidades, limitaciones y recomendaciones; y como conclusión, el enfoque de la función y la prioridad de esfuerzo de los Equipos organizados.`,
  `LA APRECIACIÓN DE AC/GM (${FUENTES.aprec}): termina indicando si la misión puede o no ser apoyada desde el punto de vista de AC/GM, qué curso de acción propio puede ser mejor apoyado (y sus ventajas), y el mejor curso de acción de AC/GM, que se convierte en el CONCEPTO DE APOYO de AC/GM. En la comparación, los factores que afectan por igual a los cursos de acción no se comparan.`,
  `LA SECUENCIA DE PLANEAMIENTO DE AC/GM (${FUENTES.secuencia}): paso 2, el Estudio de Situación Inicial: los recursos del área no se inventan, salen de los datos (capas y Censo 2024) y se clasifican EXPLOTABLE (se aprovecha; lo que sale de acá no viaja en convoy: descarga al G-4), PROTEGIDO (se respeta y se señala para evitar daño colateral: sanidad civil, templos, bienes culturales) o NEGADO (no se usa ni se permite su uso al enemigo); pasos 3 y 5, dimensionar el apoyo y establecer los ejes humanitarios, los Puestos de Reunión de Evacuados y los Locales de Destino Seguro, con condiciones de funcionamiento y seguridad definidas; paso 4, el enlace con las autoridades centrales, departamentales y municipales y con las agencias humanitarias (ACNUR, Cruz Roja).`,
  'MEDIOS CIVILES PRIMERO: la evacuación y la ayuda humanitaria se apoyan con medios CIVILES (transporte, albergues, abastecimiento local) para no perjudicar el apoyo logístico a las operaciones militares. El eje humanitario NO se monta sobre el Eje Principal de Abastecimiento: una columna civil sobre el EPA le cuesta horas al G-4.',
  `BIENES QUE NO SE BATEN: los monumentos culturales y obras de arte, que se mandan ubicar expresamente junto con represas y usinas; se marcan en el calco y viajan al Juego de Guerra como áreas restringidas. ${FUENTES.dica}: la población civil y sus bienes indispensables para la supervivencia (víveres, zonas agrícolas, instalaciones de agua potable — PA I, art. 54) se protegen; los bienes culturales y lugares de culto no se atacan ni se usan en apoyo del esfuerzo militar (La Haya 1954; PA I, art. 53); las obras que contienen fuerzas peligrosas —presas, diques, centrales de energía eléctrica— no se atacan si eso libera fuerzas que causen pérdidas en la población civil (PA I, art. 56).`,
  `DIMENSIONAMIENTO DE LA EVACUACIÓN (referencias de planeamiento del panel del G-5, editables): evacuados = población × % a evacuar (por defecto ${REF.pctEvacuar} %); agua ${REF.aguaL} L por persona y día; ${REF.raciones} ración por persona y día; un albergue cada ${REF.porAlbergue} evacuados; ${REF.plazas} plazas por medio de transporte civil; cada fuente de abastecimiento local EXPLOTABLE descarga ≈ ${REF.aguaFuenteL.toLocaleString('es')} L de agua al G-4. Son cifras para el planeamiento inicial: se confirman con un reconocimiento especializado antes de contar con ellas.`,
  'UNIDADES E INSTALACIONES DE AC/GM (catálogo de la Mesa): a nivel División, una Sección de AC con equipos funcionales; en el CE, una o más compañías. PC de la Unidad de AC; Puesto de Reunión de Evacuados (donde se concentra la población antes de encaminarla por el eje humanitario); Centro de Control de Evacuados (flujo y registro); Local de Destino Seguro (adonde va la población; se define con las autoridades y agencias humanitarias); Punto de Distribución de Ayuda Humanitaria (agua, medicina, alimentos y ropa).',
  'MANO DE OBRA CIVIL: su empleo en la Zona de Combate lo autoriza el escalón superior; el pago se hace en el Puesto de Pagaduría.',
  `LOS DOCUMENTOS DEL G-5 (${FUENTES.pmtd}): la Apreciación de AC/GM NO se difunde: se elabora en la fase 1 (F1·P3) y se actualiza con el análisis de la misión (F2·P13) para la orientación al Comandante. Los Temas y mensajes de información iniciales (F2·P11) son el único documento del G-5 en la fase 2 que SÍ se difunde: alineados con la intención del Comandante. El Anexo de AC/GM (F7·P1) se difunde con la Orden; la Escuela no tiene modelo dedicado: sale con la estructura del Anexo de AC/GM de la Mesa y el formato militar común.`,
]
export const doctrinaParaIA = () => DOCTRINA.map((x) => `- ${x}`).join('\n')

// ════════════════════════════════════════════════════════════════════════════════════
// LOS DOCUMENTOS
// ════════════════════════════════════════════════════════════════════════════════════
const ANALISIS = 'necesidades, disponibilidades, limitaciones y recomendaciones'
// La forma EXACTA del modelo «aprec-acgm» de la Escuela (catálogo del formato militar),
// apartado por apartado y en orden. Los apartados que en el modelo son INSTRUCCIONES llevan
// un rótulo descriptivo y la instrucción literal como ayuda.
export const APREC = {
  esquema: 'aprec-acgm-v1',
  titulo: 'APRECIACIÓN DE SITUACIÓN DE AC/GM',
  archivo: 'Apreciacion_de_ACGM',
  plantilla: 'aprec-acgm',
  fuente: 'modelo de apreciación de AC/GM',
  modelo: 'Apreciación de Situación de Asuntos Civiles y Gobierno Militar (G-5) — modelo de la Escuela, forma de la Mesa del Estado Mayor',
  nivel: 'principal',
  preliminares: [
    { id: 'objeto', t: 'OBJETO' },
    { id: 'carta', t: 'CARTA' },
    { id: 'anexos', t: 'ANEXOS', ayuda: 'uno por renglón' },
  ],
  arbol: [
    { t: 'MISIÓN.', hijos: [
      { t: 'Tareas.', hijos: [
        { id: 'tareasEsp', t: 'Específicas.', ayuda: 'las que la Orden superior le impone al campo de AC/GM' },
        { id: 'tareasImp', t: 'Implícitas.', ayuda: 'las que hay que hacer para cumplir las específicas' },
        { id: 'tareasEse', t: 'Esenciales.', ayuda: 'sin ellas no hay cumplimiento' },
      ] },
      { id: 'recursos', t: 'Recursos.', ayuda: 'unidades e instalaciones de AC/GM y recursos locales disponibles' },
      { id: 'limitaciones', t: 'Limitaciones.', ayuda: 'restricciones y prohibiciones que afectan a AC/GM' },
      { id: 'mision', t: 'Misión de AC/GM.', ayuda: 'quién, qué, cuándo, dónde y para qué' },
    ] },
    { t: 'SITUACIÓN Y CONSIDERACIONES DE AC/GM.', hijos: [
      { t: 'Situación de Inteligencia (Ver ASI.)', hijos: [
        { t: 'Características del Área de Operaciones.', hijos: [
          { id: 'ccmm', t: 'Condiciones Meteorológicas.', ayuda: 'y su efecto sobre la población y las operaciones de AC/GM' },
          { t: 'Terreno.', hijos: [
            { id: 'terrenoDescripcion', t: 'Descripción del área incluyendo los factores geográficos, aspectos militares, sociológicos, políticos, económicos y psicológicos.' },
            { id: 'terrenoEfectosEnemigo', t: 'Efectos sobre las operaciones del enemigo.' },
            { id: 'terrenoEfectosAC', t: 'Efectos sobre las operaciones de AC/GM.' },
          ] },
          { t: 'Población.', hijos: [
            { id: 'disponibilidadLocal', t: 'Disponibilidad local de personal y material para apoyar operaciones de AC/GM.' },
            { id: 'desplazadosEstimados', t: 'Número estimado de refugiados, evacuados y personal desplazado del área.', ayuda: 'Estimar el número de refugiados, evacuados y personal desplazado del área.' },
            { id: 'danosEconomia', t: 'Cantidad y tipo de daños que sufre la economía por efectos de la guerra (económicos, financieros, servicios públicos).' },
            { id: 'gobiernoCivil', t: 'Estado y naturaleza del gobierno civil.' },
            { id: 'estadoSanitario', t: 'Estado sanitario de la población.' },
            { id: 'abastecimientosCiviles', t: 'Abastecimientos civiles.' },
          ] },
        ] },
        { t: 'Situación Enemiga.', hijos: [
          { id: 'enDispositivo', t: 'Dispositivo.' },
          { id: 'enComposicion', t: 'Composición.' },
          { id: 'enFuerza', t: 'Fuerza.' },
          { id: 'enActividades', t: 'Actividades presentes y significativas.' },
          { id: 'enPeculiaridades', t: 'Peculiaridades y servidumbres.' },
        ] },
        { id: 'enemigoCA', t: 'Cursos de Acción del Enemigo.' },
      ] },
      { t: 'Situación táctica.', hijos: [
        { id: 'dispositivo', t: 'Dispositivo actual de las Unidades subordinadas más importantes.' },
        { id: 'capsPropios', t: 'Cursos de Acción Propios.' },
        { id: 'operacionesProyectadas', t: 'Operaciones proyectadas.' },
      ] },
      { t: 'Situación de Personal.', hijos: [
        { id: 'perDispositivo', t: 'Dispositivo actual de las Unidades e instalaciones administrativas diferentes a las de logística y de AC que tengan influencia en las operaciones de AC.' },
        { id: 'logDispositivo', t: 'Dispositivo actual de las Unidades e instalaciones logísticas que tengan influencia en las operaciones de AC.' },
        { id: 'logProyectos', t: 'Proyecto o cambios en el campo logístico que puedan afectar las operaciones de AC.' },
      ] },
      { t: 'Situación de Asuntos Civiles.', hijos: [
        { id: 'acProblemas', t: 'Problemas actuales para apoyar la operación.', ayuda: 'Revisar detalladamente los problemas actuales que se hace frente para apoyar la operación referente a la misión de asuntos civiles.' },
        { id: 'acPlanesFuturos', t: 'Influencia de los planes futuros de la fuerza apoyada.', ayuda: 'Apreciar la influencia de los planes futuros de la fuerza apoyada en las operaciones de AC.' },
        { id: 'acUnidades', t: 'Unidades de AC. disponibles y abastecimientos utilizables por la población.', ayuda: 'Considerar el número y composición de las UU. de AC. disponibles y la disponibilidad de abastecimientos militares y civiles que pueden utilizarse en la población.' },
      ] },
      { id: 'hipotesis', t: 'Hipótesis.' },
    ] },
    { t: 'ANÁLISIS.', hijos: [
      { t: 'Unidades y operaciones de AC/GM.', hijos: [
        { id: 'escOcupacion', t: 'Escalón de ocupación.', ayuda: ANALISIS },
        { id: 'escApoyo', t: 'Escalón de apoyo de combate.', ayuda: ANALISIS },
      ] },
      { t: 'Gobierno.', hijos: [
        { id: 'gobCivilMilitar', t: 'Gobierno civil o militar.', ayuda: ANALISIS },
        { id: 'justicia', t: 'Justicia, ley y orden público.', ayuda: ANALISIS },
        { id: 'seguridadPublica', t: 'Seguridad pública.', ayuda: ANALISIS },
        { id: 'saludPublica', t: 'Salud pública.', ayuda: ANALISIS },
        { id: 'bienestar', t: 'Bienestar y beneficio.', ayuda: ANALISIS },
        { id: 'hacienda', t: 'Hacienda pública y finanzas.', ayuda: ANALISIS },
        { id: 'educacion', t: 'Educación pública.', ayuda: ANALISIS },
        { id: 'trabajo', t: 'Trabajo.', ayuda: ANALISIS },
      ] },
      { t: 'Economía política.', hijos: [
        { id: 'economia', t: 'Economía.', ayuda: ANALISIS },
        { id: 'comercio', t: 'Comercio e industria.', ayuda: ANALISIS },
        { id: 'controlRecursos', t: 'Control de recursos y agricultura.', ayuda: ANALISIS },
        { id: 'controlPrecios', t: 'Control de precios y racionamiento.', ayuda: ANALISIS },
        { id: 'controlPropiedad', t: 'Control de propiedad.', ayuda: ANALISIS },
        { id: 'abastecimientosAnalisis', t: 'Abastecimientos civiles.', ayuda: ANALISIS },
      ] },
      { t: 'Instalaciones públicas.', hijos: [
        { id: 'servicioPublico', t: 'Servicio público.', ayuda: ANALISIS },
        { id: 'comunicacionesPublicas', t: 'Comunicaciones públicas.', ayuda: ANALISIS },
        { id: 'transportePublico', t: 'Transporte público.', ayuda: ANALISIS },
      ] },
      { t: 'Funciones especiales.', hijos: [
        { id: 'informacionesPublicas', t: 'Informaciones públicas y civiles.', ayuda: ANALISIS },
        { id: 'desplazados', t: 'Desplazados, expatriados, refugiados, etc.', ayuda: ANALISIS },
        { id: 'bellasArtes', t: 'Bellas artes, monumentos y archivos.', ayuda: ANALISIS },
        { id: 'religion', t: 'Religión.', ayuda: ANALISIS },
      ] },
    ] },
    { t: 'COMPARACIÓN.', hijos: [
      { t: 'Problemas de AC/GM.', hijos: [
        { id: 'problemas', t: 'Enumeración del problema y factores determinantes.' },
        { id: 'problemasRecomendaciones', t: 'Recomendaciones para resolver esos problemas.' },
      ] },
      { t: 'Cursos de Acción de AC. y GM.', hijos: [
        { id: 'caComparacion', t: 'Comparación de los cursos de acción de AC/GM en cada factor determinante.', ayuda: 'Efectuar la comparación de cada factor determinante con cada Curso de Acción de AC/GM estableciendo ventajas y desventajas de cada Curso de Acción en relación a dicho factor.' },
        { id: 'caMejor', t: 'Mejor curso de acción de AC/GM en relación al factor comparado.', ayuda: 'Recomiende el mejor Curso de Acción en relación al factor comparado.' },
        { id: 'caIguales', t: 'Factores que afectan por igual a los cursos de acción.', ayuda: 'Los factores que afectan por igual cada Curso de Acción no deben ser considerados en la comparación.' },
      ] },
      { t: 'Cursos de Acción Propios (CAPs).', hijos: [
        { ventajas: true, t: 'Ventajas y desventajas de cada CAP. en los factores determinantes de AC/GM.', ayuda: 'Efectuar la comparación de cada CAP. en cada factor determinante de AC/GM estableciendo sus ventajas y desventajas. Los factores que afecten por igual a los CAPs. no se comparan.' },
        { id: 'capMejorFactor', t: 'Mejor CAP. en relación a cada factor determinante.', ayuda: 'Se recomienda el mejor CAP. en relación al factor determinante comparado.' },
        { id: 'capDemas', t: 'Comparación en los demás CAPs. y factores determinantes.', ayuda: 'Se prosigue en igual forma en los demás CAPs. y factores determinantes.' },
      ] },
    ] },
    { t: 'CONCLUSIONES Y RECOMENDACIONES.', hijos: [
      { id: 'factibilidad', t: 'Factibilidad del apoyo de AC/GM.', ayuda: 'Indicar si la misión puede o no ser apoyada desde el punto de vista de AC/GM.' },
      { id: 'mejorCap', t: 'Curso de acción propio mejor apoyado.', ayuda: 'Indicar cuando sea apropiado, qué curso de acción propio puede ser mejor apoyadas por AC/GM y cuáles son sus ventajas.' },
      { id: 'mejorCaAC', t: 'Mejor curso de acción de AC/GM (concepto de apoyo).', ayuda: 'Recomiende el mejor curso de acción de AC/GM que se convertirá en el concepto de apoyo de AC/GM y establezca las ventajas y desventajas en relación a los otros cursos de acción.' },
      { id: 'recomendaciones', t: 'Recomendaciones de AC/GM.', ayuda: 'Exponer las recomendaciones de asuntos civiles y gobierno militar.' },
    ] },
  ],
  // El modelo NO analiza por CAP (analiza por FUNCIÓN): los CAP sólo aparecen en la
  // COMPARACIÓN (ventajas y desventajas). Sin campos por CAP ni por fase.
  cap: { porCap: [], porFase: [] },
  obligatorios: [
    { id: 'mision', txt: 'I.- D.- Falta la MISIÓN DE AC/GM (con la tarea esencial).', tipo: 'err' },
    { id: 'tareasEsp', txt: 'I.- A.- 1.- Faltan las tareas específicas (la F2·P3 del G-5 las trae).' },
    { id: 'disponibilidadLocal', txt: 'II.- A.- 1.- c.- 1) Falta la disponibilidad local (clasificá los recursos en «🔎 Recursos» y traelos con 🌱).' },
    { id: 'desplazadosEstimados', txt: 'II.- A.- 1.- c.- 2) Falta estimar los refugiados, evacuados y desplazados (dimensioná la evacuación en «🚸 Evacuación»).' },
    { id: 'factibilidad', txt: 'V.- A.- Falta indicar si la misión puede ser apoyada desde el punto de vista de AC/GM.', tipo: 'err' },
    { id: 'mejorCap', txt: 'V.- B.- Falta el curso de acción propio mejor apoyado.', tipo: 'err' },
    { id: 'mejorCaAC', txt: 'V.- C.- Falta el mejor curso de acción de AC/GM (el que se convierte en el concepto de apoyo).' },
  ],
}

// La Escuela no tiene modelo de anexo del G-5: es la estructura del Anexo de AC/GM que ya
// bajaba la Mesa (fNe del compilado), apartado por apartado y en orden, con el formato
// militar común (registro.militar).
export const ANEXO = {
  esquema: 'anexo-acgm-v1',
  titulo: 'ANEXO (ASUNTOS CIVILES Y GOBIERNO MILITAR)',
  archivo: 'Anexo_de_ACGM',
  plantilla: null,
  fuente: 'Anexo de AC/GM de la Mesa (sin modelo dedicado de la Escuela)',
  modelo: 'Anexo de Asuntos Civiles y Gobierno Militar (G-5) — estructura propia de la Mesa con el formato militar común (la Escuela no tiene modelo de anexo del G-5 en el catálogo)',
  nivel: 'anexo',
  preliminares: [
    { id: 'objeto', t: 'OBJETO' },
    { id: 'carta', t: 'CARTA' },
    { id: 'apendice', t: 'APÉNDICE', ayuda: 'uno por renglón' },
  ],
  arbol: [
    { id: 'orgTarea', t: 'Organización de la Tarea.', sinNumero: true, ayuda: 'los equipos funcionales de AC/GM disponibles y asignados' },
    { t: 'SITUACIÓN.', hijos: [
      { id: 'enemigo', t: 'Fuerzas enemigas.', ayuda: 'referirse al Anexo de Inteligencia o al Plan de Inteligencia' },
      { id: 'fuerzasPropias', t: 'Fuerzas propias.', ayuda: 'la población en el área de operaciones', hijos: [
        { id: 'actitud', t: 'Actitud de la población.', ayuda: 'territorio amigo, aliado u ocupado; si coopera o no' },
        { id: 'autoridades', t: 'Autoridades y agencias presentes.', ayuda: 'autoridades centrales, departamentales y municipales; agencias humanitarias (ACNUR, Cruz Roja)' },
        { id: 'recursosArea', t: 'Recursos del área.', ayuda: 'los recursos clave identificados, clasificados según su empleo' },
      ] },
      { id: 'hipotesis', t: 'Hipótesis.', ayuda: 'sólo para el Plan: las hipótesis del campo de AC/GM válidas al cerrar el planeamiento' },
    ] },
    { id: 'mision', t: 'MISIÓN.', ayuda: 'la misión de AC/GM: quién, qué, cuándo, dónde y para qué' },
    { t: 'EJECUCIÓN.', hijos: [
      { id: 'concepto', t: 'Concepto de Apoyo.', ayuda: 'enfoque de cada función —Gobierno, Economía, SS.PP.EE. y Servicios Especiales— y prioridad de esfuerzo de los equipos organizados, fase por fase', hijos: [
        { id: 'evacuacion', t: 'Previsión de evacuación y dimensionamiento del apoyo.', ayuda: 'priorizar los medios CIVILES para no perjudicar el apoyo logístico a las operaciones militares' },
        { id: 'ejes', t: 'Ejes humanitarios.', ayuda: 'sobre carreteras y caminos disponibles, sin montarlos sobre el Eje Principal de Abastecimiento' },
        { id: 'instalaciones', t: 'Instalaciones de AC/GM.', ayuda: 'ubicación y condiciones de funcionamiento y seguridad de cada una (paso 5 de la secuencia de planeamiento)' },
      ] },
      { t: 'Tareas para los Equipos Funcionales.', hijos: [
        { id: 'tareaGobierno', t: 'En la función de Gobierno.', ayuda: 'seguridad pública, control de la población, salud pública, justicia y orden' },
        { id: 'tareaEconomia', t: 'En la función de Economía.', ayuda: 'abastecimiento civil, recursos locales, control de precios y de propiedad' },
        { id: 'tareaSSPP', t: 'En la función de SS.PP.EE.', ayuda: 'servicio, comunicaciones y transporte públicos' },
        { id: 'tareaEspeciales', t: 'En la función de Servicios Especiales.', ayuda: 'evacuación, desplazados y refugiados, bellas artes y archivos, religión' },
      ] },
      { t: 'Instrucciones de Coordinación.', hijos: [
        { id: 'bienesProtegidos', t: 'Bienes protegidos.' },
        { id: 'manoObra', t: 'Mano de obra civil.' },
        { id: 'toqueQueda', t: 'Toque de queda.', ayuda: 'si corresponde, por seguridad y para evitar saqueos' },
        { id: 'enlace', t: 'Enlace.' },
      ] },
    ] },
    { id: 'apoyoServicio', t: 'APOYO DE SERVICIO.', ayuda: 'referirse al Anexo de Logística o extractar de él lo pertinente al apoyo de AC/GM' },
    { t: 'COMANDO Y COMUNICACIONES.', hijos: [
      { id: 'comando', t: 'Comando.', ayuda: 'ubicación de los PP.CC. y cadena de mando si difiere del PON' },
      { id: 'comunicaciones', t: 'Comunicaciones.', ayuda: 'IOC. en vigor' },
    ] },
  ],
  obligatorios: [
    { id: 'mision', txt: 'II.- Falta la MISIÓN.', tipo: 'err' },
    { id: 'concepto', txt: 'III.- A.- Falta el concepto de apoyo (enfoque de cada función y prioridad de esfuerzo por fase).', tipo: 'err' },
    { id: 'evacuacion', txt: 'III.- A.- 1.- Falta la previsión de evacuación (dimensionala en «🚸 Evacuación»).' },
    { id: 'ejes', txt: 'III.- A.- 2.- Faltan los ejes humanitarios (trazalos fuera del EPA).' },
    { id: 'bienesProtegidos', txt: 'III.- C.- 1.- Faltan los bienes protegidos (los que no se baten).' },
  ],
}

// ════════════════════════════════════════════════════════════════════════════════════
// LO QUE LA MESA SABE DEL CALCO (la MISMA cuenta del panel del G-5)
// ════════════════════════════════════════════════════════════════════════════════════
export const num = (x) => Math.round(+x || 0).toLocaleString('es')
const filasDe = (h) => (Array.isArray(h) ? h.filter(esObj) : [])
const col = (fila, re) => {
  const k = Object.keys(fila || {}).find((x) => re.test(x))
  return k ? sinMarcaIA(fila[k]) : ''
}
const guiones = (xs) => xs.filter(Boolean).map((x) => `- ${x}`).join('\n')
export const unidadDe = (ctx = {}) => limpio(ctx?.ordenSup?.unidad || ctx?.unidad || '')
const deLa = (u) => (u ? `${articuloDe(u).toLowerCase()} ${u}` : 'de la unidad')
export function firmaG5(ctx = {}) {
  const u = unidadDe(ctx)
  return u ? `EL G-5 ${articuloDe(u)} ${u}` : 'EL G-5 DE LA UNIDAD'
}
export function coordenada(ctx, p) {
  if (!Array.isArray(p) || !Number.isFinite(+p[0]) || !Number.isFinite(+p[1])) return ''
  if (typeof ctx?.coordenada === 'function') {
    try {
      const s = ctx.coordenada(+p[1], +p[0])
      if (s) return String(s)
    } catch {}
  }
  return `${(+p[1]).toFixed(4)}, ${(+p[0]).toFixed(4)}`
}
const infoInst = (ctx, id) => {
  try {
    return (typeof ctx?.catalogo === 'function' ? ctx.catalogo(id) : null) || null
  } catch {
    return null
  }
}
// Las instalaciones del calco; `ids` (por instalación) o `grupos` (por grupo del catálogo).
export function instalaciones(ctx = {}, ids = [], grupos = []) {
  return (ctx.calco?.unidades || [])
    .filter((u) => u?.tipo === 'instalacion')
    .map((u) => {
      const inf = infoInst(ctx, u.instalacion)
      return { id: u.instalacion, grupo: inf?.grupo || '', abrev: inf?.abrev || limpio(u.designacion || u.nombre || u.instalacion), nom: inf?.nom || '', p: [+u.lng, +u.lat] }
    })
    .filter((x) => (ids.length ? ids.includes(x.id) : true) && (grupos.length ? grupos.includes(x.grupo) : true))
}
const instTexto = (ctx, xs) => xs.map((x) => `${x.abrev}${x.nom && x.nom !== x.abrev ? ` (${x.nom})` : ''} en ${coordenada(ctx, x.p)}`).join('; ')
const lineaTexto = (ctx, coords) => {
  const c = limpiar(coords)
  return `${fmtKm(largoKm(c))}, desde ${coordenada(ctx, c[0])} hasta ${coordenada(ctx, c[c.length - 1])}`
}
export const ejesHumanitarios = (ctx = {}) => (ctx.calco?.ops?.lineasEM || []).filter((l) => l?.tipo === 'humanitario' && limpiar(l.coords).length >= 2)
export const ejesLog = (ctx = {}, tipo) => (ctx.calco?.ops?.ejesLog || []).filter((e) => e?.tipo === tipo && limpiar(e.coords).length >= 2)
export const fichas = (ctx = {}, bando) => (ctx.calco?.unidades || []).filter((u) => (!u.tipo || u.tipo === 'unidad') && u.bando === bando)
const nombreFicha = (u) => limpio(u.designacion || u.nombre || u.id || 'unidad')
export const fasesDe = (ctx = {}) => (Array.isArray(ctx.calco?.fasesCOA?.propio) ? ctx.calco.fasesCOA.propio : [])
export const nombresFases = (ctx = {}) => fasesDe(ctx).map((f) => limpio(f?.nombre))
const nombreFase = (n, i) => `Fase ${romano(i + 1)}${n ? ` — ${n}` : ''}`

// Cuántos km de un eje humanitario van a menos de UMBRAL_EPA_KM de un EPA («se monta»).
export function sobreEPA(eje, epas = [], umbral = UMBRAL_EPA_KM) {
  const xs = limpiar(eje)
  const ls = epas.map((e) => limpiar(e.coords || e)).filter((l) => l.length >= 2)
  if (xs.length < 2 || !ls.length) return 0
  let km = 0
  for (let i = 1; i < xs.length; i++) {
    const a = xs[i - 1]
    const b = xs[i]
    const largo = distKm(a, b)
    const n = Math.max(1, Math.ceil(largo / 0.1))
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n
      const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
      if (ls.some((l) => distPuntoLinea(p, l) <= umbral)) km += largo / n
    }
  }
  return km
}

// El INVENTARIO de recursos del área (rC de la Mesa sobre las capas cargadas) con la
// clasificación del G-5 (estadosRecursos: «categoría:índice» → estado; si no, la sugerida).
export function inventario(ctx = {}) {
  let r = null
  try {
    r = typeof ctx.inventarioAC === 'function' ? ctx.inventarioAC() : null
  } catch {
    r = null
  }
  if (!r || !Array.isArray(r.categorias) || !r.total) return null
  const est = ctx.calco?.estadosRecursos || {}
  const porEstado = { explotable: 0, protegido: 0, negado: 0, sin: 0 }
  let revisados = 0
  const categorias = r.categorias.map((c) => {
    const cuenta = { explotable: 0, protegido: 0, negado: 0, sin: 0 }
    const recursos = (c.recursos || []).map((x, i) => {
      const k = `${c.id}:${i}`
      if (k in est) revisados++
      const e = est[k] ?? x.estado ?? 'sin'
      const estado = e in cuenta ? e : 'sin'
      cuenta[estado]++
      porEstado[estado]++
      return { ...x, estado }
    })
    return { id: c.id, nom: c.nom, icono: c.icono, aporta: c.aporta, recursos, cuenta }
  })
  return { categorias, total: r.total, porEstado, revisados, crudo: r }
}
export const categoria = (inv, id) => inv?.categorias?.find((c) => c.id === id) || null
const nombresRec = (xs, n = 8) => (xs.length ? `${xs.slice(0, n).map((x) => limpio(x.nombre)).join('; ')}${xs.length > n ? ` … y ${xs.length - n} más` : ''}` : '')
const deClase = (c, re) => (c?.recursos || []).filter((x) => re.test(String(x.fclass || '')))
const cuentaTexto = (cu) => ESTADOS.filter((e) => cu[e.id]).map((e) => `${e.nom} ${cu[e.id]}`).join(', ')
export function categoriaTexto(c, n = 8) {
  const partes = ESTADOS.filter((e) => e.id !== 'sin' && c.cuenta[e.id]).map((e) => `${e.nom} (${c.cuenta[e.id]}): ${nombresRec(c.recursos.filter((x) => x.estado === e.id), n)}`)
  if (c.cuenta.sin) partes.push(`sin clasificar (${c.cuenta.sin}): ${nombresRec(c.recursos.filter((x) => x.estado === 'sin'), n)}`)
  return `${c.nom} — ${c.recursos.length} identificado(s). ${partes.join(' · ')}.`
}
// La POBLACIÓN del área (mP de la Mesa: Censo 2024 o referencia por tipo de lugar).
export function poblacion(ctx = {}) {
  let r = null
  try {
    r = typeof ctx.poblacionAC === 'function' ? ctx.poblacionAC() : null
  } catch {
    r = null
  }
  return r && r.nLugares > 0 ? r : null
}
export function poblacionTexto(P) {
  if (!P) return ''
  const top = (P.lugares || []).slice(0, 5).map((l) => `${limpio(l.nombre)} (${num(l.hab)} hab.${l.fuente === 'Censo 2024' ? '' : ', referencia'})`)
  return `Población en el área de operaciones: ${num(P.total)} habitantes en ${P.nLugares} centro(s) poblado(s)${P.conCenso ? `, de los cuales ${P.conCenso} con población oficial del Censo 2024 (${num(P.habCenso)} habitantes)` : ''}${P.estimados ? ` y ${P.estimados} por referencia de tipo de lugar (${num(P.habEstim)} habitantes)` : ''}.${top.length ? ` Los más poblados: ${top.join('; ')}.` : ''}`
}
// La PREVISIÓN DE EVACUACIÓN (fN de la Mesa, con los parámetros del panel «🚸 Evacuación»).
export function evacuacion(ctx = {}) {
  const ev = esObj(ctx.calco?.evacuacion) ? ctx.calco.evacuacion : {}
  const P = poblacion(ctx)
  const inv = inventario(ctx)
  const p = {
    poblacion: ev.poblacion ?? (P ? P.total : 0),
    pctEvacuar: ev.pctEvacuar ?? REF.pctEvacuar,
    dias: ev.dias ?? REF.dias,
    albergues: categoria(inv, 'albergue')?.recursos.length || 0,
    buses: ev.buses ?? 0,
  }
  if (!(+p.poblacion > 0) || typeof ctx.evacuacionAC !== 'function') return null
  let r = null
  try {
    r = ctx.evacuacionAC(p)
  } catch {
    return null
  }
  return r ? { p, r, ajustada: Object.keys(ev).length > 0 } : null
}
export function evacuacionTexto(E) {
  if (!E) return ''
  const { p, r } = E
  return `Previsión de evacuación: ${p.pctEvacuar} % de ${num(p.poblacion)} habitantes → ${num(r.evacuados)} personas durante ${p.dias} día(s): agua ${num(r.agua)} L, ${num(r.raciones)} raciones, ${num(r.albergesNec)} albergue(s) necesario(s) (identificados en el área: ${p.albergues})${r.viajes != null ? `, ${num(r.viajes)} viaje(s) con ${p.buses} medio(s) civil(es)` : ', sin medios civiles de transporte asignados todavía'}.${r.alerta ? ` ATENCIÓN: ${r.alerta}` : ''}`
}
export function tablaEvacuacion(ctx = {}) {
  const E = evacuacion(ctx)
  if (!E) return null
  const { p, r } = E
  return {
    cabecera: ['Concepto', 'Cantidad'],
    filas: [
      ['Población en el área', `${num(p.poblacion)} hab.`],
      ['Previsión de evacuación', `${p.pctEvacuar} % → ${num(r.evacuados)} personas`],
      [`Agua (${p.dias} día(s))`, `${num(r.agua)} L`],
      ['Raciones', num(r.raciones)],
      ['Albergues necesarios', `${num(r.albergesNec)} · identificados en el área: ${p.albergues}`],
      ...(r.viajes != null ? [['Transporte civil', `${num(r.viajes)} viaje(s)`]] : []),
    ],
  }
}
// Lo que los recursos EXPLOTABLES le descargan al G-4 (SDe de la Mesa).
export function descarga(ctx = {}) {
  const inv = inventario(ctx)
  if (!inv || typeof ctx.descargaAC !== 'function') return null
  try {
    return ctx.descargaAC(inv.crudo.categorias, ctx.calco?.estadosRecursos || {})
  } catch {
    return null
  }
}
export const descargaTexto = (D, { nota = false } = {}) => (D ? `${D.abast} fuente(s) de abastecimiento local (≈ ${num(D.aguaL)} L de agua de referencia), ${num(D.plazasAlbergue)} plaza(s) de albergue y ${D.transporte} medio(s) de transporte civil EXPLOTABLES.${nota && D.nota ? ` ${D.nota}` : ''}` : '')
export function tablaRecursos(ctx = {}) {
  const inv = inventario(ctx)
  if (!inv) return null
  const fila = (c) => [c.nom, String(c.recursos.length), String(c.cuenta.explotable), String(c.cuenta.protegido), String(c.cuenta.negado), String(c.cuenta.sin)]
  const t = inv.porEstado
  return {
    cabecera: ['Categoría', 'Identificados', 'Explotables', 'Protegidos', 'Negados', 'Sin clasificar'],
    filas: [...inv.categorias.map(fila), [{ t: 'TOTAL', bold: true }, { t: String(inv.total), bold: true }, { t: String(t.explotable), bold: true }, { t: String(t.protegido), bold: true }, { t: String(t.negado), bold: true }, { t: String(t.sin), bold: true }]],
  }
}
// Los ejes humanitarios, con lo que se montan sobre el EPA.
export function ejesTexto(ctx = {}) {
  const xs = ejesHumanitarios(ctx)
  const epas = ejesLog(ctx, 'epa')
  return xs.map((e, i) => {
    const s = epas.length ? sobreEPA(e.coords, epas) : 0
    return `Eje humanitario ${i + 1}: ${lineaTexto(ctx, e.coords)}${s > 0 ? `. ATENCIÓN: ${fmtKm(s)} van a menos de ${UMBRAL_EPA_KM * 1000} m del EPA (se monta sobre el eje de abastecimiento)` : ''}.`
  })
}
export const solapeEPA = (ctx = {}) => {
  const epas = ejesLog(ctx, 'epa')
  return epas.length ? ejesHumanitarios(ctx).reduce((s, e) => s + sobreEPA(e.coords, epas), 0) : 0
}
// Los recursos y las instalaciones que NO se baten.
export function protegidos(ctx = {}) {
  const inv = inventario(ctx)
  const rec = inv ? inv.categorias.flatMap((c) => c.recursos.filter((x) => x.estado === 'protegido').map((x) => ({ ...x, cat: c.nom }))) : []
  const inst = instalaciones(ctx, GRUPOS.protegidos)
  return { rec, inst, n: rec.length + inst.length }
}
// Los problemas que la Mesa puede medir (para II.- D.- 1.- y los riesgos).
export function problemas(ctx = {}) {
  const P = []
  const E = evacuacion(ctx)
  if (E?.r?.alerta) P.push(E.r.alerta)
  if (E && E.r.evacuados > 0 && !ejesHumanitarios(ctx).length) P.push(`Hay ${num(E.r.evacuados)} evacuados previstos y no hay eje humanitario trazado.`)
  if (E && E.r.evacuados > 0 && E.r.viajes == null) P.push('No hay medios civiles de transporte asignados para la evacuación.')
  if (E && E.r.evacuados > 0 && !instalaciones(ctx, ['destino_seguro']).length) P.push('No hay Local de Destino Seguro designado para la población evacuada.')
  const s = solapeEPA(ctx)
  if (s > 0) P.push(`El eje humanitario se monta sobre el EPA en ${fmtKm(s)} (a menos de ${UMBRAL_EPA_KM * 1000} m): la columna civil le cuesta horas al G-4.`)
  const inv = inventario(ctx)
  if (inv?.porEstado.sin) P.push(`${inv.porEstado.sin} recurso(s) del área sin clasificar.`)
  return P
}

// Lo que la Mesa calculó y tiene en el calco, en texto (va a la IA de todas las hojas).
export function datosCalco(ctx = {}) {
  const L = []
  const P = poblacion(ctx)
  L.push(P ? `POBLACIÓN (capas de centros poblados y Censo 2024): ${poblacionTexto(P)}` : 'POBLACIÓN: sin capas de centros poblados cargadas (encender «Centros poblados» con el área definida).')
  const inv = inventario(ctx)
  if (inv) {
    L.push(`RECURSOS DEL ÁREA (panel «🔎 Recursos» del G-5: ${inv.total} identificados; ${cuentaTexto(inv.porEstado)}${inv.revisados ? `; ${inv.revisados} clasificados por el G-5, el resto con la clasificación sugerida` : '; todavía con la clasificación SUGERIDA, el G-5 no la revisó'}):`)
    for (const c of inv.categorias) L.push(`- ${categoriaTexto(c)}`)
  } else L.push('RECURSOS DEL ÁREA: sin capas de infraestructura cargadas (encender «Infraestructura (colegios, templos, salud…)» con el área definida).')
  const D = descarga(ctx)
  if (D) L.push(`LO QUE SE DESCARGA AL G-4 (recursos EXPLOTABLES): ${descargaTexto(D, { nota: true })}`)
  const E = evacuacion(ctx)
  L.push(E ? `EVACUACIÓN (panel «🚸 Evacuación»${E.ajustada ? '' : ', valores por defecto'}): ${evacuacionTexto(E)}` : 'EVACUACIÓN: sin dimensionar (falta la población del área).')
  const ej = ejesTexto(ctx)
  L.push(`EJES HUMANITARIOS: ${ej.length ? ej.join(' ') : 'sin trazar'}`)
  const epa = ejesLog(ctx, 'epa')
  if (epa.length) L.push(`EPA DEL G-4: ${epa.map((e) => lineaTexto(ctx, e.coords)).join('; ')}.`)
  const ac = instalaciones(ctx, TODAS_AC)
  L.push(`INSTALACIONES DE AC/GM EN EL CALCO: ${ac.length ? instTexto(ctx, ac) : 'ninguna'}.`)
  const pr = protegidos(ctx)
  if (pr.n) L.push(`BIENES QUE NO SE BATEN: ${pr.inst.length ? `${pr.inst.length} marcado(s) en el calco (${instTexto(ctx, pr.inst)})` : ''}${pr.inst.length && pr.rec.length ? '; ' : ''}${pr.rec.length ? `${pr.rec.length} recurso(s) clasificado(s) PROTEGIDO (${nombresRec(pr.rec, 10)})` : ''}.`)
  const pb = problemas(ctx)
  if (pb.length) L.push(`PROBLEMAS QUE MIDE LA MESA:\n${guiones(pb)}`)
  const fpr = fichas(ctx, 'propias')
  if (fpr.length) L.push(`FICHAS PROPIAS EN EL CALCO (${fpr.length}): ${fpr.map(nombreFicha).join('; ')}.`)
  const fen = fichas(ctx, 'enemigas')
  if (fen.length) L.push(`FICHAS ENEMIGAS EN EL CALCO (${fen.length}): ${fen.map(nombreFicha).join('; ')}.`)
  const fs = nombresFases(ctx)
  if (fs.length) L.push(`FASES DEL CURSO DE ACCIÓN PROPIO: ${fs.map(nombreFase).join('; ')}.`)
  return L.join('\n')
}

// Lo que entregaron las otras secciones (se muestra arriba del documento y va a la IA).
export function entregas(ctx = {}) {
  const E = []
  const os = ctx.ordenSup || {}
  const g3 = [['Misión recibida', os.mision], ['Intención del Comandante superior', os.intencion], ['Tareas asignadas', os.tareas], ['Limitaciones y restricciones', os.limitaciones], ['Momento de la ejecución', os.cuando]].filter(([, x]) => limpio(x))
  if (g3.length) E.push({ de: 'La Orden del escalón superior', items: g3 })
  const g2 = typeof ctx.resumenG2 === 'function' ? (() => { try { return ctx.resumenG2(ctx.calco?.picb || {}) } catch { return null } })() : null
  if (g2?.hay) E.push({ de: 'El G-2', items: [['CAE más probable', g2.probable], ['CAE más peligroso', g2.peligroso], ['Misión estimada del enemigo', g2.mision], ['Su estado final deseado', g2.estadoFinal]].filter(([, x]) => limpio(x)) })
  const fs = nombresFases(ctx)
  if (fs.length) E.push({ de: 'El G-3', items: [['Fases del curso de acción', fs.map(nombreFase).join('; ')]] })
  const g1 = []
  const per = instalaciones(ctx, [], GRUPOS_PERSONAL)
  if (per.length) g1.push(['Instalaciones de personal', instTexto(ctx, per)])
  const ap1 = ctx.calco?.hojasG?.g1?.aprecOrientacion?.campos?.civil || ctx.calco?.hojasG?.g1?.aprecActiva?.campos?.civil
  if (limpio(ap1)) g1.push(['Personal civil (Apreciación de Personal)', ap1])
  if (g1.length) E.push({ de: 'El G-1', items: g1 })
  const g4 = []
  if (limpio(ctx.calco?.misionLog)) g4.push(['Misión de logística', ctx.calco.misionLog])
  const epa = ejesLog(ctx, 'epa')
  if (epa.length) g4.push(['Eje Principal de Abastecimiento', epa.map((l) => lineaTexto(ctx, l.coords)).join('; ')])
  const epe = ejesLog(ctx, 'epe')
  if (epe.length) g4.push(['Eje Principal de Evacuación', epe.map((l) => lineaTexto(ctx, l.coords)).join('; ')])
  const log = instalaciones(ctx, [], GRUPOS_LOG)
  if (log.length) g4.push(['Instalaciones logísticas', instTexto(ctx, log)])
  if (g4.length) E.push({ de: 'El G-4', items: g4 })
  return E
}
export const entregasTexto = (ctx) => entregas(ctx).map((e) => `${e.de}:\n${e.items.map(([k, x]) => `- ${k}: ${sinMarcaIA(x)}`).join('\n')}`).join('\n\n')

// Lo que ya dicen las otras hojas del G-5 (para el pedido de cada documento).
export function otrasHojas(ctx = {}, sin = []) {
  const h = ctx.hojas || {}
  const L = []
  const filas = (id, rot) => {
    const xs = filasDe(h[id]).map((f) => Object.entries(f).filter(([k, x]) => !k.startsWith('_') && limpio(x)).map(([k, x]) => `${k}: ${sinMarcaIA(x)}`).join(' · ')).filter(Boolean)
    if (xs.length && !sin.includes(id)) L.push(`${rot}:\n${xs.map((x) => `- ${x}`).join('\n')}`)
  }
  filas('tareas', 'F2·P3 Tareas de AC/GM')
  filas('limitaciones', 'F2·P5 Limitaciones de AC/GM')
  if (esObj(h.hechos) && !sin.includes('hechos')) {
    const a = lista(h.hechos.a)
    const b = lista(h.hechos.b)
    if (a.length || b.length) L.push(`F2·P6 Hechos y suposiciones:\n${a.map((x) => `- HECHO: ${x}`).join('\n')}${a.length && b.length ? '\n' : ''}${b.map((x) => `- SUPOSICIÓN: ${x}`).join('\n')}`)
  }
  filas('rcic', 'F2·P8 RCIC y EEIA de AC/GM')
  filas('temas', 'F2·P11 Temas y mensajes de información iniciales')
  if (esObj(h.potencia) && !sin.includes('potencia')) {
    const xs = Object.entries(h.potencia).filter(([k, x]) => !k.startsWith('_') && limpio(x))
    if (xs.length) L.push(`F3·P1 Aporte a la potencia relativa:\n${xs.map(([k, x]) => `- ${k}: ${sinMarcaIA(x)}`).join('\n')}`)
  }
  filas('decision', 'F5·P1 Ventajas y desventajas de cada CAP desde AC/GM')
  filas('riesgo', 'F6·P3 Riesgos de AC/GM')
  for (const [id, def, rot] of [['aprecOrientacion', APREC, 'F2·P13 Apreciación de AC/GM (actualizada)'], ['aprecActiva', APREC, 'F1·P3 Apreciación de AC/GM'], ['anexo', ANEXO, 'F7·P1 Anexo de AC/GM']]) {
    if (sin.includes(id) || !tiene(def, h[id])) continue
    const v = normalizar(def, h[id])
    const llenos = Object.entries(v.campos).filter(([, x]) => limpio(x)).map(([k, x]) => `- ${k}: ${sinMarcaIA(x).replace(/\n+/g, ' / ')}`)
    if (llenos.length) L.push(`${rot}:\n${llenos.join('\n')}`)
  }
  return L.join('\n\n')
}

// ─── 🗺️ Lo que esta hoja toma del calco y lo que le falta (con botones para acostar) ─
export function estadoCalco(ctx = {}) {
  const inv = inventario(ctx)
  const P = poblacion(ctx)
  const E = evacuacion(ctx)
  const ej = ejesHumanitarios(ctx)
  const s = solapeEPA(ctx)
  const ac = instalaciones(ctx, TODAS_AC)
  const pr = protegidos(ctx)
  const items = [
    inv ? `✓ ${inv.total} recurso(s) del área${inv.revisados ? ` (${inv.revisados} clasificados por el G-5)` : ' (clasificación sugerida, sin revisar)'}` : '✗ sin capas de infraestructura',
    P ? `✓ ${num(P.total)} hab. en ${P.nLugares} centro(s) poblado(s)` : '✗ sin capas de población',
    E ? `✓ ${num(E.r.evacuados)} a evacuar` : '✗ evacuación sin dimensionar',
    ej.length ? `✓ ${ej.length} eje(s) humanitario(s)${s > 0 ? ` (ATENCIÓN: ${fmtKm(s)} sobre el EPA)` : ''}` : '✗ sin eje humanitario',
    instalaciones(ctx, ['destino_seguro']).length ? '✓ Local de Destino Seguro' : '✗ sin Local de Destino Seguro',
    ac.length ? `✓ ${ac.length} instalación(es) de AC/GM` : '✗ sin instalaciones de AC/GM',
    pr.n ? `✓ ${pr.n} bien(es) que no se baten` : '✗ sin bienes protegidos marcados',
  ]
  return {
    texto: items.join(' · '),
    verEnCarta: [...ac.map((x) => [x.p]), ...ej.map((e) => e.coords)],
    botones: [
      { texto: '➡️ Trazar el eje humanitario', accion: 'herramienta', arg: 'humanitario' },
      { texto: '＋ Local de Destino Seguro', accion: 'colocar', arg: 'destino_seguro' },
      { texto: '＋ Puesto de Reunión de Evacuados', accion: 'colocar', arg: 'p_evac_civ' },
      { texto: '＋ Bien protegido', accion: 'colocar', arg: 'bien_protegido' },
    ],
    ayuda: 'Los recursos se clasifican en «🔎 Recursos» (con las capas «Centros poblados» e «Infraestructura» encendidas); la evacuación se dimensiona en «🚸 Evacuación»; los bienes que no se baten, en «⛔ Restringido».',
  }
}

// ════════════════════════════════════════════════════════════════════════════════════
// 🌱 LAS PROPUESTAS PARA CADA DOCUMENTO (sólo llenan lo vacío)
// ════════════════════════════════════════════════════════════════════════════════════
const porTipo = (h, re) => filasDe(h?.tareas).filter((f) => re.test(claveTexto(col(f, /tipo/i)))).map((f) => col(f, /^tarea/i)).filter(Boolean)
function comunes(ctx) {
  const P = {}
  const h = ctx.hojas || {}
  const unidad = unidadDe(ctx)
  const esp = porTipo(h, /ESPEC/)
  const imp = porTipo(h, /IMPL/)
  const ese = porTipo(h, /ESENC/)
  if (esp.length) P.tareasEsp = guiones(esp)
  if (imp.length) P.tareasImp = guiones(imp)
  if (ese.length) P.tareasEse = guiones(ese)
  const lim = filasDe(h.limitaciones).map((f) => [col(f, /^limitaci/i), col(f, /^tipo/i)].filter(Boolean).join(' — ')).filter(Boolean)
  if (lim.length) P.limitaciones = guiones(lim)
  else if (limpio(ctx.ordenSup?.limitaciones)) P.limitaciones = texto(ctx.ordenSup.limitaciones)
  const E = evacuacion(ctx)
  const sup = esObj(h.hechos) ? lista(h.hechos.b) : []
  const hip = [...sup]
  if (E) hip.push(`La previsión de evacuación supone el ${E.p.pctEvacuar} % de la población (${num(E.p.poblacion)} habitantes) durante ${E.p.dias} día(s).`)
  const D = descarga(ctx)
  if (D && (D.abast || D.albergue || D.transporte)) hip.push('Los recursos locales clasificados EXPLOTABLES están disponibles (se confirman con un reconocimiento especializado antes de contar con ellos).')
  if (hip.length) P.hipotesis = guiones(hip)
  const os = ctx.ordenSup || {}
  if (limpio(os.mision))
    P.mision = `${unidad ? `El G-5 ${deLa(unidad)}` : 'El G-5'} mantiene el orden público, evita la interferencia de la población civil en las operaciones y protege y emplea los recursos locales${E && E.r.evacuados ? `, y conduce la evacuación prevista de ${num(E.r.evacuados)} personas por medios civiles` : ''}${limpio(os.cuando) ? `, ${limpio(os.cuando)}` : ''}, para apoyar el cumplimiento de la misión: «${limpio(os.mision)}».`
  return P
}
const de = (inv, id) => categoria(inv, id)
const enumerar = (rot, xs, n = 8) => (xs.length ? `${rot} (${xs.length}): ${nombresRec(xs, n)}.` : '')

export function propuestasAprec(ctx = {}) {
  const P = { ...comunes(ctx) }
  const unidad = unidadDe(ctx)
  const os = ctx.ordenSup || {}
  const inv = inventario(ctx)
  const Po = poblacion(ctx)
  const E = evacuacion(ctx)
  const D = descarga(ctx)
  const ac = instalaciones(ctx, TODAS_AC)
  P.objeto = `Determinar si la misión ${deLa(unidad)} puede ser apoyada desde el punto de vista de los asuntos civiles y el gobierno militar, qué curso de acción propio se apoya mejor y cuál es el mejor curso de acción de AC/GM.`
  if (limpio(os.carta)) P.carta = texto(os.carta)
  P.anexos = ['“A” Calco de AC/GM (recursos clasificados, ejes humanitarios, instalaciones de AC/GM y bienes protegidos).', inv ? '“B” Inventario de recursos locales clasificados.' : '', E ? '“C” Previsión de evacuación de la población.' : ''].filter(Boolean).join('\n')
  if (inv || ac.length) P.recursos = [ac.length && `Instalaciones de AC/GM desplegadas en el calco: ${ac.map((x) => x.abrev).join(', ')}.`, inv && `Recursos locales identificados en el área: ${inv.total} (${cuentaTexto(inv.porEstado)}).`, D && `Descargan al G-4: ${descargaTexto(D)}`].filter(Boolean).join(' ')
  // II.- A.- Situación de inteligencia: la población y el terreno
  if (Po || inv) P.terrenoDescripcion = [Po && `Aspectos sociológicos: ${poblacionTexto(Po)}`, inv && `Aspectos económicos y de infraestructura: ${inv.categorias.map((c) => `${c.nom.toLowerCase()} ${c.recursos.length}`).join(', ')}.`].filter(Boolean).join('\n')
  const ej = ejesTexto(ctx)
  if (ej.length) P.terrenoEfectosAC = guiones(ej)
  if (inv) {
    const xs = inv.categorias.map((c) => (c.cuenta.explotable ? `${c.nom}: ${c.cuenta.explotable} EXPLOTABLE(S) (${nombresRec(c.recursos.filter((x) => x.estado === 'explotable'), 6)}).` : '')).filter(Boolean)
    if (xs.length || D) P.disponibilidadLocal = [guiones(xs), D && `- Descarga al G-4: ${descargaTexto(D)}`].filter(Boolean).join('\n')
  }
  if (E) P.desplazadosEstimados = evacuacionTexto(E)
  const gob = de(inv, 'gobierno')
  if (gob) P.gobiernoCivil = `Autoridades y sedes de gobierno identificadas en el área para el enlace: ${gob.recursos.length} (${nombresRec(gob.recursos, 10)}).`
  const san = de(inv, 'sanidad')
  if (san) P.estadoSanitario = categoriaTexto(san)
  const ab = de(inv, 'abastecimiento')
  if (ab || E) P.abastecimientosCiviles = [ab && categoriaTexto(ab), E && `Necesidad de los evacuados: ${num(E.r.agua)} L de agua y ${num(E.r.raciones)} raciones para ${E.p.dias} día(s).`].filter(Boolean).join('\n')
  const en = fichas(ctx, 'enemigas')
  if (en.length) P.enDispositivo = `Fichas enemigas en el calco: ${en.map(nombreFicha).join('; ')}.`
  const g2 = entregas(ctx).find((e) => e.de === 'El G-2')
  if (g2) P.enemigoCA = g2.items.map(([k, x]) => `${k}: ${sinMarcaIA(x)}`).join('\n')
  const pr = fichas(ctx, 'propias')
  if (pr.length) P.dispositivo = `Elementos propios en el calco: ${pr.map(nombreFicha).join('; ')}.`
  const fs = nombresFases(ctx)
  if (fs.length) P.capsPropios = `Curso de acción propio en ${fs.length} fase(s): ${fs.map(nombreFase).join('; ')}.`
  const per = instalaciones(ctx, [], GRUPOS_PERSONAL)
  if (per.length) P.perDispositivo = `Instalaciones de personal (G-1) en el calco: ${instTexto(ctx, per)}.`
  const log = instalaciones(ctx, [], GRUPOS_LOG)
  const epa = ejesLog(ctx, 'epa')
  const epe = ejesLog(ctx, 'epe')
  if (log.length || epa.length || epe.length) P.logDispositivo = guiones([log.length && `Instalaciones logísticas: ${instTexto(ctx, log)}.`, epa.length && `EPA: ${epa.map((e) => lineaTexto(ctx, e.coords)).join('; ')}.`, epe.length && `EPE: ${epe.map((e) => lineaTexto(ctx, e.coords)).join('; ')}.`])
  const conc = (ctx.calco?.conceptoApoyo || []).map((c, i) => (esObj(c) && limpio(c.prioridad) ? `Fase ${romano(i + 1)}: prioridad de apoyo logístico ${limpio(c.prioridad)}.` : '')).filter(Boolean)
  if (conc.length) P.logProyectos = guiones(conc)
  const pb = problemas(ctx)
  if (pb.length) P.acProblemas = guiones(pb)
  if (fs.length) P.acPlanesFuturos = `La fuerza apoyada prevé ${fs.length} fase(s): ${fs.map(nombreFase).join('; ')}.${limpio(os.cuando) ? ` Ejecución: ${limpio(os.cuando)}.` : ''}`
  if (ac.length || D) P.acUnidades = [ac.length && `Instalaciones de AC/GM: ${instTexto(ctx, ac)}.`, D && `Abastecimientos civiles utilizables: ${descargaTexto(D)}`].filter(Boolean).join('\n')
  // III.- ANÁLISIS: lo que la Mesa identificó en el área para cada función
  const emer = de(inv, 'emergencia')
  if (emer) P.seguridadPublica = categoriaTexto(emer)
  if (san) P.saludPublica = categoriaTexto(san)
  if (E) P.bienestar = `Evacuados a atender: ${num(E.r.evacuados)} — ${num(E.r.agua)} L de agua, ${num(E.r.raciones)} raciones y ${num(E.r.albergesNec)} albergue(s) para ${E.p.dias} día(s).${instalaciones(ctx, GRUPOS.ayuda).length ? ` Puntos de distribución de ayuda humanitaria: ${instTexto(ctx, instalaciones(ctx, GRUPOS.ayuda))}.` : ''}`
  const tribunales = deClase(gob, /courthouse/)
  if (tribunales.length) P.justicia = enumerar('Tribunales identificados', tribunales)
  const ayuntamientos = deClase(gob, /town_hall/)
  if (ayuntamientos.length) P.gobCivilMilitar = enumerar('Sedes de gobierno municipal identificadas', ayuntamientos)
  const bancos = deClase(gob, /bank/)
  if (bancos.length) P.hacienda = enumerar('Entidades financieras identificadas', bancos)
  const alb = de(inv, 'albergue')
  const educ = deClase(alb, /school|college|university|kindergarten/)
  if (educ.length) P.educacion = `${enumerar('Establecimientos educativos identificados', educ)} Son también los abrigos y albergues previstos para los evacuados.`
  const merc = deClase(ab, /marketplace|supermarket/)
  if (merc.length) P.comercio = enumerar('Mercados y supermercados identificados', merc)
  if (inv) P.controlRecursos = `Clasificación de los ${inv.total} recursos del área: ${cuentaTexto(inv.porEstado)}.`
  const neg = inv ? inv.categorias.flatMap((c) => c.recursos.filter((x) => x.estado === 'negado')) : []
  if (neg.length) P.controlPropiedad = enumerar('Recursos NEGADOS (no se usan ni se permite su uso al enemigo)', neg, 10)
  if (ab || E) P.abastecimientosAnalisis = [E && `Necesidad: ${num(E.r.agua)} L de agua y ${num(E.r.raciones)} raciones para los evacuados.`, D && `Disponibilidad local EXPLOTABLE: ${D.abast} fuente(s) (≈ ${num(D.aguaL)} L de agua de referencia).`].filter(Boolean).join(' ')
  const agua = deClase(ab, /water_tower/)
  const combustible = deClase(ab, /fuel/)
  if (agua.length || combustible.length) P.servicioPublico = [enumerar('Tanques de agua', agua), enumerar('Estaciones de combustible', combustible)].filter(Boolean).join(' ')
  const com = de(inv, 'comunicacion')
  const correo = deClase(gob, /post_office/)
  if (com || correo.length) P.comunicacionesPublicas = [com && categoriaTexto(com), enumerar('Oficinas de correo', correo)].filter(Boolean).join(' ')
  const tr = de(inv, 'transporte')
  const trans = deClase(tr, /airport|airfield|helipad|terminal/)
  const aloj = deClase(tr, /hotel|hostel|guesthouse|motel/)
  if (trans.length || aloj.length || E) P.transportePublico = [enumerar('Terminales y aeródromos', trans), enumerar('Alojamiento civil', aloj), E && (E.r.viajes != null ? `Evacuación: ${num(E.r.viajes)} viaje(s) con ${E.p.buses} medio(s) civil(es) de ${REF.plazas} plazas.` : 'Evacuación: sin medios civiles de transporte asignados todavía.')].filter(Boolean).join(' ')
  const temas = filasDe(ctx.hojas?.temas).map((f) => col(f, /^tema/i)).filter(Boolean)
  if (temas.length || com) P.informacionesPublicas = [temas.length && `Temas y mensajes iniciales (F2·P11): ${temas.join('; ')}.`, com && `Medios para difundirlos: ${com.recursos.length} medio(s) de comunicación identificado(s).`].filter(Boolean).join(' ')
  const evacInst = instalaciones(ctx, GRUPOS.evacuacion)
  if (E || evacInst.length || ej.length) P.desplazados = guiones([E && evacuacionTexto(E), ...ej, evacInst.length && `Instalaciones: ${instTexto(ctx, evacInst)}.`])
  const protI = instalaciones(ctx, GRUPOS.protegidos)
  const cult = de(inv, 'protegido_cult')
  if (protI.length || cult) P.bellasArtes = [protI.length && `Bienes protegidos marcados en el calco (no se baten): ${instTexto(ctx, protI)}.`, cult && `Bienes culturales y lugares de culto: ${cult.recursos.length} identificado(s), ${cult.cuenta.protegido} PROTEGIDO(S).`].filter(Boolean).join(' ')
  if (cult) P.religion = enumerar('Templos y lugares de culto identificados', cult.recursos, 10)
  // IV.- COMPARACIÓN y V.- CONCLUSIONES: lo que ya resolvió la F5·P1
  const fact = []
  if (E) fact.push(`Población a evacuar: ${num(E.r.evacuados)} personas; albergues necesarios ${num(E.r.albergesNec)} (identificados ${E.p.albergues}).`)
  const s = solapeEPA(ctx)
  if (ej.length) fact.push(`Ejes humanitarios: ${ej.length}${s > 0 ? `, ${fmtKm(s)} sobre el EPA` : ', separados del EPA'}.`)
  const prot = protegidos(ctx)
  if (prot.n) fact.push(`Bienes que no se baten en el área: ${prot.n}.`)
  if (D) fact.push(`Recursos EXPLOTABLES que descargan al G-4: ${D.abast} fuente(s) de abastecimiento, ${num(D.plazasAlbergue)} plazas de albergue, ${D.transporte} medio(s) de transporte.`)
  if (fact.length || pb.length) P.problemas = guiones([...pb, ...fact.map((x) => `Factor determinante — ${x}`)])
  const decs = filasDe(ctx.hojas?.decision)
  const apoyables = decs.filter((f) => limpio(col(f, /apoyar/i)))
  if (apoyables.length) P.factibilidad = guiones(apoyables.map((f) => `${col(f, /curso/i) || 'CAP'}: ${col(f, /apoyar/i)}`))
  const caps = decs.map((f) => ({ nombre: col(f, /curso/i), ventajas: col(f, /^ventaja/i), desventajas: col(f, /^desventaja/i) }))
  return { campos: P, caps }
}

export function propuestasAnexo(ctx = {}) {
  const C = comunes(ctx)
  const P = {}
  const unidad = unidadDe(ctx)
  const os = ctx.ordenSup || {}
  const ap = ctx.hojas?.aprecOrientacion && tiene(APREC, ctx.hojas.aprecOrientacion) ? normalizar(APREC, ctx.hojas.aprecOrientacion) : ctx.hojas?.aprecActiva && tiene(APREC, ctx.hojas.aprecActiva) ? normalizar(APREC, ctx.hojas.aprecActiva) : null
  const inv = inventario(ctx)
  const Po = poblacion(ctx)
  const E = evacuacion(ctx)
  const D = descarga(ctx)
  const ac = instalaciones(ctx, TODAS_AC.filter((x) => !GRUPOS.protegidos.includes(x) && !GRUPOS.recursos.includes(x)))
  P.objeto = `Establecer el apoyo de asuntos civiles y gobierno militar a la operación ${deLa(unidad)}.`
  if (limpio(os.carta)) P.carta = texto(os.carta)
  P.apendice = '“1” Calco de AC/GM (recursos clasificados, ejes humanitarios y Locales de Destino Seguro).'
  if (ac.length) P.orgTarea = `Instalaciones y equipos de AC/GM desplegados: ${instTexto(ctx, ac)}.`
  const g2 = entregas(ctx).find((e) => e.de === 'El G-2')
  P.enemigo = ['Referirse al Anexo de Inteligencia.', g2 && g2.items.find(([k]) => /probable/.test(k)) && `CAE más probable: ${sinMarcaIA(g2.items.find(([k]) => /probable/.test(k))[1])}.`].filter(Boolean).join(' ')
  if (Po) P.fuerzasPropias = poblacionTexto(Po)
  const gob = de(inv, 'gobierno')
  if (gob) P.autoridades = `Autoridades y sedes identificadas: ${nombresRec(gob.recursos, 12)}.`
  if (inv) P.recursosArea = [`Se identificaron ${inv.total} recursos clave, clasificados según su empleo (cuadro):`, ...inv.categorias.map((c) => `- ${categoriaTexto(c, 15)}`)].join('\n')
  const hip = ap?.campos?.hipotesis || C.hipotesis
  if (limpio(hip)) P.hipotesis = hip
  const mis = ap?.campos?.mision || C.mision
  if (limpio(mis)) P.mision = mis
  const fs = nombresFases(ctx)
  const conc = ap?.campos?.mejorCaAC
  if (limpio(conc) || fs.length) P.concepto = [limpio(conc) && sinMarcaIA(conc), ...fs.map((n, i) => `- ${nombreFase(n, i)}: enfoque de AC/GM y prioridad de esfuerzo de los equipos: [definir].`)].filter(Boolean).join('\n')
  if (E) P.evacuacion = `${evacuacionTexto(E)}\nSe priorizan los medios CIVILES para no perjudicar el apoyo logístico a las operaciones militares.`
  const ej = ejesTexto(ctx)
  if (ej.length) P.ejes = guiones(ej)
  if (ac.length) P.instalaciones = guiones(ac.map((x) => `${x.abrev}${x.nom && x.nom !== x.abrev ? ` (${x.nom})` : ''}: ${coordenada(ctx, x.p)}.`))
  // Tareas a los equipos funcionales: lo que sale del calco
  const emer = de(inv, 'emergencia')
  if (emer || gob) P.tareaGobierno = guiones([gob && `Establecer el enlace con las autoridades identificadas (${gob.recursos.length}).`, emer && `Coordinar con los ${emer.recursos.length} recurso(s) de policía, bomberos y defensa civil del área el orden público y el rescate.`])
  if (D && (D.abast || D.albergue || D.transporte)) P.tareaEconomia = guiones([`Explotar los recursos clasificados EXPLOTABLES: ${descargaTexto(D)}`, 'Coordinar con el G-4 lo que se descarga del pedido.'])
  const com = de(inv, 'comunicacion')
  if (com) P.tareaSSPP = guiones([`Emplear los medios de comunicación identificados (${nombresRec(com.recursos, 6)}) para la orientación, la información pública y la alarma a la población.`])
  if (E) P.tareaEspeciales = guiones([`Conducir la evacuación de ${num(E.r.evacuados)} personas${ejesHumanitarios(ctx).length ? ' por el eje humanitario' : ''}${instalaciones(ctx, ['destino_seguro']).length ? ' hasta los Locales de Destino Seguro' : ''}.`, instalaciones(ctx, GRUPOS.ayuda).length && `Distribuir la ayuda humanitaria en ${instTexto(ctx, instalaciones(ctx, GRUPOS.ayuda))}.`])
  const prot = protegidos(ctx)
  P.bienesProtegidos = ['No se baten los monumentos culturales, obras de arte, represas y usinas señalados en el calco.', prot.inst.length && `- Marcados: ${instTexto(ctx, prot.inst)}.`, prot.rec.length && `- Recursos clasificados PROTEGIDOS: ${nombresRec(prot.rec, 15)}.`].filter(Boolean).join('\n')
  P.manoObra = 'Su empleo en la Zona de Combate lo autoriza el escalón superior; el pago se hace en el Puesto de Pagaduría.'
  P.enlace = 'Con autoridades centrales, departamentales y municipales y con las agencias humanitarias presentes en el área.'
  const epa = ejesLog(ctx, 'epa')
  P.apoyoServicio = ['Referirse al Anexo de Apoyo de Servicio de Combate.', D && `Los recursos EXPLOTABLES descargan al G-4: ${descargaTexto(D)}`, epa.length && 'La columna de evacuados no usa el EPA.'].filter(Boolean).join(' ')
  const pc = instalaciones(ctx, GRUPOS.pc)
  if (pc.length || limpio(os.puestoMando)) P.comando = [limpio(os.puestoMando) && `PC. ${deLa(unidad)}: ${limpio(os.puestoMando)}.`, pc.length && `PC de la Unidad de AC: ${coordenada(ctx, pc[0].p)}.`].filter(Boolean).join(' ')
  return { campos: P }
}
export const tablasAprec = (ctx) => {
  const T = {}
  const r = tablaRecursos(ctx)
  const e = tablaEvacuacion(ctx)
  if (r) T.disponibilidadLocal = r
  if (e) T.desplazadosEstimados = e
  return T
}
export const tablasAnexo = (ctx) => {
  const T = {}
  const r = tablaRecursos(ctx)
  const e = tablaEvacuacion(ctx)
  if (r) T.recursosArea = r
  if (e) T.evacuacion = e
  return T
}

// ════════════════════════════════════════════════════════════════════════════════════
// LAS HOJAS DE TRABAJO DEL G-5 (guía y 🌱)
// ════════════════════════════════════════════════════════════════════════════════════
export const GUIAS = {
  aprecActiva: {
    para: 'Es TU evaluación como G-5, en los cinco pasos de toda apreciación: con ella sostenés, desde los asuntos civiles y el gobierno militar, si la misión se puede apoyar, qué curso de acción propio se apoya mejor y cuál es el mejor curso de acción de AC/GM (que después es tu concepto de apoyo). NO se difunde.',
    como: [
      'OBJETO, CARTA y ANEXOS: qué se aprecia, la carta de la Orden y el calco de AC/GM.',
      'I.- MISIÓN: las tareas específicas, implícitas y esenciales de AC/GM (F2·P3), los recursos (unidades de AC y recursos locales), las limitaciones (F2·P5) y la MISIÓN DE AC/GM.',
      'II.- SITUACIÓN Y CONSIDERACIONES DE AC/GM: el área (CC.MM., terreno y su EFECTO sobre el enemigo y sobre AC/GM, y la POBLACIÓN: disponibilidad local, refugiados y evacuados, daños a la economía, gobierno civil, estado sanitario, abastecimientos), la situación enemiga, la táctica (G-3), la de personal y logística (G-1 y G-4), la de AC (problemas, planes futuros, unidades y abastecimientos) y las hipótesis.',
      'III.- ANÁLISIS: FUNCIÓN POR FUNCIÓN —unidades de AC, gobierno, economía política, instalaciones públicas y funciones especiales—: necesidades, disponibilidades, limitaciones y recomendaciones.',
      'IV.- COMPARACIÓN: los problemas de AC/GM y sus factores determinantes; tus cursos de acción de AC/GM factor por factor; y las ventajas y desventajas de cada CAP desde AC/GM (lo que afecta igual a todos no se compara).',
      'V.- CONCLUSIONES Y RECOMENDACIONES: si la misión se puede apoyar, qué CAP se apoya mejor, el mejor curso de acción de AC/GM (el concepto de apoyo) y las recomendaciones.',
    ],
    ejemplo: '«Con 5.820 evacuados previstos y 25 albergues identificados para 39 necesarios, el CAP N° 1 se apoya mejor: su eje humanitario por la ruta 2 no toca el EPA.» Fijate que no describe: concluye para la decisión.',
  },
  aprecOrientacion: {
    para: 'Es la misma apreciación de la fase 1 (📋 Partir de la F1·P3), ACTUALIZADA con el análisis de la misión: la que el G-5 expone en la orientación al Comandante. NO se difunde.',
    como: ['Partí de la F1·P3 y actualizá lo que cambió con el análisis de la misión: tareas, limitaciones, hechos y suposiciones, la clasificación de los recursos y la previsión de evacuación.', 'Las conclusiones tienen que responder lo que el Comandante va a preguntar: ¿la población interfiere?, ¿cuántos evacuados y por dónde?, ¿qué no se puede batir?'],
    ejemplo: '«Desde AC/GM la misión puede ser apoyada; el CAP N° 2 exige evacuar 2.000 personas más y cruza el EPA en la fase de ruptura.»',
  },
  anexo: {
    para: 'Es la orden del campo de AC/GM: lo que las unidades y los equipos funcionales tienen que HACER con la población, los recursos locales y los bienes protegidos. SE DIFUNDE con la Orden y lo firma el Comandante.',
    como: [
      'OBJETO, CARTA y APÉNDICE (el calco de AC/GM); la Organización de la Tarea (los equipos de AC/GM).',
      'I.- SITUACIÓN: fuerzas enemigas (al Anexo de Inteligencia), fuerzas propias —la población: su actitud, las autoridades y agencias presentes, los recursos del área clasificados— e hipótesis (sólo en el Plan).',
      'II.- MISIÓN: la misión de AC/GM de la apreciación.',
      'III.- EJECUCIÓN: el concepto de apoyo (enfoque de cada función y prioridad de esfuerzo por fase; la evacuación dimensionada, los ejes humanitarios y las instalaciones), las tareas a los equipos de Gobierno, Economía, SS.PP.EE. y Servicios Especiales, y las instrucciones de coordinación (bienes protegidos, mano de obra civil, toque de queda, enlace).',
      'IV.- APOYO DE SERVICIO y V.- COMANDO Y COMUNICACIONES.',
    ],
    ejemplo: '«2.- Ejes humanitarios. Eje 1 por la ruta 4 (12 km) hasta el LDS de PUEBLO-Z; no usa el EPA. La Sección de AC controla el flujo en el CCE.»',
  },
  tareas: {
    para: 'Separa lo que la Orden le IMPONE al campo de AC/GM de lo que el G-5 DEDUCE que hay que hacer, y marca lo indispensable. De acá sale la misión de AC/GM.',
    como: [
      'Tarea: un verbo en infinitivo y su objeto («Evacuar 5.820 personas hasta los LDS por medios civiles»).',
      'Tipo: ESPECÍFICA (escrita en la Orden o en su Anexo de AC/GM), IMPLÍCITA (necesaria para cumplir las específicas: clasificar los recursos, el enlace con las autoridades, el eje humanitario, señalar los bienes protegidos…) o ESENCIAL (sin ella no hay misión).',
      'De dónde sale: la Orden superior, su anexo, la doctrina o el calco.',
      'Quién la ejecuta: la Sección de AC, sus equipos funcionales, el G-4…',
    ],
    ejemplo: '«Señalar los 12 bienes culturales para que no se batan» — Implícita — Calco (recursos PROTEGIDOS) y DICA — G-5 con el G-3.',
  },
  limitaciones: {
    para: 'Lo que el campo de AC/GM TIENE que hacer (restricción) o NO PUEDE hacer (prohibición), y qué le cuesta a la operación.',
    como: ['Limitación: concreta, con su cifra o su lugar.', 'Tipo: RESTRICCIÓN o PROHIBICIÓN.', 'Origen: la Orden superior, la ley (DICA: población civil, bienes culturales, obras con fuerzas peligrosas) o los medios que faltan.', 'Efecto sobre la operación: qué cambia en el apoyo de AC/GM.'],
    ejemplo: '«No batir la represa de PUEBLO-W» — Prohibición — DICA (PA I, art. 56) — el fuego sobre el puente adyacente necesita otra solución.',
  },
  hechos: {
    para: 'Un HECHO se puede probar hoy; una SUPOSICIÓN hace falta para planificar y hay que confirmarla. En AC/GM, las suposiciones suelen ser cuánta gente se desplaza, si los recursos están disponibles y si la población coopera.',
    como: ['HECHOS: la población del Censo, los recursos identificados y su clasificación, las instalaciones y ejes trazados, lo que dice la Orden.', 'SUPOSICIONES: el % que se evacua y por cuántos días, que los recursos EXPLOTABLES están disponibles, la población estimada donde no hay Censo. Cada una con quién la confirma.'],
    ejemplo: 'Hecho: «Hay 19.400 habitantes en el área (Censo 2024)». Suposición: «Se evacua el 30 % durante 3 días (confirman: autoridades municipales y G-2)».',
  },
  rcic: {
    para: 'RCIC: lo que el Comandante necesita saber de la población y los recursos para decidir. EEIA: lo que el enemigo NO tiene que saber de nuestros planes de AC/GM.',
    como: ['Requerimiento: una pregunta concreta.', 'Por qué es crítico: qué decisión depende de él.', 'Quién lo busca: la sección o el órgano.', 'Para cuándo: sin fecha límite no sirve.'],
    ejemplo: '«¿Cuántos civiles se desplazan por la ruta 2 al iniciar la fase I?» — define si se habilita el segundo LDS — G-5 con el G-2 — D-1 (1800).',
  },
  temas: {
    para: 'Los temas y mensajes que se le dan a la población y a las autoridades al empezar la operación. Es el único documento del G-5 en esta fase que SE DIFUNDE: tiene que estar alineado con la intención del Comandante.',
    como: ['Tema o mensaje: lo que se dice, concreto (dónde reunirse, por dónde ir, qué no hacer).', 'A quién va dirigido: la población de tal lugar, las autoridades, las agencias.', 'Por qué medio: los medios de comunicación y las autoridades identificadas en el área.', 'Cuándo: antes de la fase que lo exige.'],
    ejemplo: '«Los vecinos de PUEBLO-X se reúnen en el PRE de la plaza y salen por la ruta 4» — población de PUEBLO-X — radio local y alcaldía — D-1.',
  },
  potencia: {
    para: 'El aporte de AC/GM a la potencia relativa de combate: qué suma y qué resta la población y los recursos del área, del lado propio y del enemigo.',
    como: ['APORTA: recursos locales EXPLOTABLES (agua, albergue, transporte) que descargan al G-4; la cooperación de la población.', 'LIMITA: evacuados y desplazados que interfieren, ejes humanitarios sobre el EPA, bienes que no se baten.', 'ENEMIGO: lo mismo del lado enemigo (lo que dice el G-2).', 'CONCLUSIÓN: qué significa para el planeamiento.'],
    ejemplo: '«5.820 evacuados sobre la ruta 2 en la fase I restan movilidad al segundo escalón si no se separan del EPA.»',
  },
  decision: {
    para: 'El aporte del G-5 a la matriz de decisión: desde AC/GM, ¿cada curso se puede apoyar?, ¿con qué costo en población, recursos y bienes protegidos?',
    como: ['Un renglón por CAP.', 'Ventajas y desventajas DESDE AC/GM: evacuados, ejes humanitarios, recursos explotables, bienes protegidos, interferencia de la población.', '¿Se puede apoyar?: sí, sí con limitaciones (cuáles) o no.'],
    ejemplo: 'CAP N° 1 — un solo eje humanitario fuera del EPA — atraviesa PUEBLO-X (8.000 hab.) — Sí, evacuando el D-1.',
  },
  riesgo: {
    para: 'Los riesgos del campo de AC/GM sobre el curso aprobado, cada uno con su medida de control y su responsable.',
    como: ['Riesgo: el peligro concreto (la población interfiere, columna civil sobre el EPA, faltan albergues, daño colateral a bienes protegidos…).', 'Probabilidad y gravedad.', 'Medida de control: qué se hace para bajarlo.', 'Quién la ejecuta.'],
    ejemplo: '«Columna de evacuados sobre el EPA» — Probable — Crítica — separar el eje humanitario y controlar el cruce con la PM — G-5 con el G-4.',
  },
}
// Lo que la IA de las hojas de trabajo tiene que saber del G-5 (va como guía del pedido).
export function guiaIA(hojaId) {
  const g = GUIAS[hojaId]
  return g ? { ...g, como: [...g.como, `Trabajás desde el campo de ASUNTOS CIVILES Y GOBIERNO MILITAR (G-5): usá la doctrina —el ${FUENTES.aprec}, la ${FUENTES.secuencia} y el DICA— y las cifras que calculó la Mesa (población, recursos clasificados, evacuación).`] } : null
}

const fila = (cols, valores) => Object.fromEntries(cols.map((c, i) => [c, valores[i] ?? '']))
export const SEMILLAS = {
  tareas: (ctx, hoja) => {
    const cols = hoja?.cols || ['Tarea', 'Tipo', 'De dónde sale', 'Quién la ejecuta']
    const R = []
    for (const t of lista(String(ctx.ordenSup?.tareas || '').replace(/;\s*/g, '\n'))) R.push(fila(cols, [t, 'Específica', 'Orden del escalón superior', '']))
    const inv = inventario(ctx)
    const E = evacuacion(ctx)
    const D = descarga(ctx)
    const pr = protegidos(ctx)
    const gob = categoria(inv, 'gobierno')
    if (inv?.porEstado.sin || (inv && !inv.revisados)) R.push(fila(cols, [`Clasificar los ${inv.total} recursos del área (EXPLOTABLE, PROTEGIDO o NEGADO)`, 'Implícita', 'Calco (inventario del panel del G-5)', 'G-5 / Sección de AC']))
    if (E?.r.evacuados) R.push(fila(cols, [`Evacuar ${num(E.r.evacuados)} personas por medios civiles${instalaciones(ctx, ['destino_seguro']).length ? ' hasta los Locales de Destino Seguro' : ''}`, 'Implícita', 'Previsión de evacuación (panel del G-5)', 'G-5 / Sección de AC']))
    if (E?.r.evacuados && !ejesHumanitarios(ctx).length) R.push(fila(cols, ['Establecer el eje humanitario fuera del EPA', 'Implícita', 'Secuencia de planeamiento de AC/GM (pasos 3 y 5)', 'G-5 con el G-4']))
    if (D && (D.abast || D.albergue || D.transporte)) R.push(fila(cols, [`Coordinar con el G-4 la descarga de los recursos EXPLOTABLES (${D.abast} fuente(s) de abastecimiento, ${num(D.plazasAlbergue)} plazas de albergue, ${D.transporte} medio(s) de transporte)`, 'Implícita', 'Calco (recursos clasificados)', 'G-5 con el G-4']))
    if (pr.n) R.push(fila(cols, [`Señalar los ${pr.n} bienes que no se baten como áreas restringidas`, 'Implícita', 'Calco y DICA', 'G-5 con el G-3']))
    if (gob) R.push(fila(cols, [`Establecer el enlace con las autoridades del área (${gob.recursos.length} sedes identificadas)`, 'Implícita', 'Secuencia de planeamiento de AC/GM (paso 4)', 'G-5 / Equipo de Gobierno']))
    return R
  },
  limitaciones: (ctx, hoja) => {
    const cols = hoja?.cols || ['Limitación', 'Tipo', 'Origen', 'Efecto sobre la operación']
    const R = lista(String(ctx.ordenSup?.limitaciones || '').replace(/;\s*/g, '\n')).map((t) => fila(cols, [t, /\bno\b|prohib/i.test(t) ? 'Prohibición' : 'Restricción', 'Orden del escalón superior', '']))
    const pr = protegidos(ctx)
    if (pr.n) R.push(fila(cols, [`No batir los ${pr.n} bienes protegidos del área (bienes culturales, lugares de culto, represas y usinas)`, 'Prohibición', 'DICA (La Haya 1954; PA I, arts. 53 y 56)', 'Áreas restringidas para el fuego y la maniobra']))
    if (ejesLog(ctx, 'epa').length && (evacuacion(ctx)?.r.evacuados || ejesHumanitarios(ctx).length)) R.push(fila(cols, ['No encaminar la evacuación por el EPA', 'Prohibición', 'Secuencia de planeamiento de AC/GM', 'El eje humanitario va por otras rutas']))
    return R
  },
  hechos: (ctx) => {
    const a = []
    const b = []
    const P = poblacion(ctx)
    const inv = inventario(ctx)
    const E = evacuacion(ctx)
    if (P) a.push(poblacionTexto(P).replace(/ Los más poblados:.*$/, ''))
    if (inv) a.push(`Recursos identificados en el área: ${inv.total} (${cuentaTexto(inv.porEstado)}).`)
    const ac = instalaciones(ctx, TODAS_AC)
    if (ac.length) a.push(`Instalaciones de AC/GM desplegadas: ${ac.map((x) => x.abrev).join(', ')}.`)
    const ej = ejesHumanitarios(ctx)
    if (ej.length) a.push(`Eje(s) humanitario(s) trazado(s): ${ej.map((e) => fmtKm(largoKm(limpiar(e.coords)))).join(', ')}.`)
    const fs = nombresFases(ctx)
    if (fs.length) a.push(`El curso de acción propio tiene ${fs.length} fase(s): ${fs.map(nombreFase).join('; ')}.`)
    if (E) b.push(`Se evacua el ${E.p.pctEvacuar} % de la población (${num(E.r.evacuados)} personas) durante ${E.p.dias} día(s) (confirman: autoridades municipales y G-2).`)
    if (P?.estimados) b.push(`La población de ${P.estimados} centro(s) poblado(s) sin dato del Censo (${num(P.habEstim)} hab.) es una referencia por tipo de lugar (confirma: reconocimiento y autoridades).`)
    const D = descarga(ctx)
    if (D && (D.abast || D.albergue || D.transporte)) b.push('Los recursos EXPLOTABLES están disponibles (confirma: reconocimiento especializado).')
    return { a, b }
  },
  rcic: (ctx, hoja) => {
    const cols = hoja?.cols || ['Requerimiento', 'Por qué es crítico', 'Quién lo busca', 'Para cuándo']
    const R = []
    const E = evacuacion(ctx)
    const fs = nombresFases(ctx)
    const primera = fs.length ? `Antes de la ${nombreFase(fs[0], 0)}` : 'Antes del D'
    if (E?.r.evacuados) R.push(fila(cols, [`RCIC: ¿cuántos civiles se desplazan, desde dónde y por qué rutas? (previstos: ${num(E.r.evacuados)})`, 'Define los Locales de Destino Seguro, el eje humanitario y si la población interfiere con la maniobra', 'G-5 con el G-2 y las autoridades', primera]))
    const D = descarga(ctx)
    if (D && (D.abast || D.albergue || D.transporte)) R.push(fila(cols, ['RCIC: ¿están disponibles los recursos EXPLOTABLES del área?', 'Define lo que se descarga del pedido al G-4', 'G-5 (reconocimiento especializado) con el G-4', primera]))
    if (ejesHumanitarios(ctx).length || instalaciones(ctx, GRUPOS.evacuacion).length) R.push(fila(cols, ['EEIA: los ejes humanitarios, los Locales de Destino Seguro y los horarios de evacuación', 'Revelan al enemigo la dirección y el momento de la operación', 'G-2 (contrainteligencia) y G-5', 'Toda la operación']))
    return R
  },
  temas: (ctx, hoja) => {
    const cols = hoja?.cols || ['Tema o mensaje', 'A quién va dirigido', 'Por qué medio', 'Cuándo']
    const R = []
    const E = evacuacion(ctx)
    const inv = inventario(ctx)
    const com = categoria(inv, 'comunicacion')
    const gob = categoria(inv, 'gobierno')
    const medio = [com && `${com.recursos.length} medio(s) de comunicación del área`, gob && `autoridades municipales (${gob.recursos.length} sedes)`].filter(Boolean).join(' y ')
    const fs = nombresFases(ctx)
    const primera = fs.length ? `Antes de la ${nombreFase(fs[0], 0)}` : 'Antes del D'
    const pre = instalaciones(ctx, ['p_evac_civ'])
    const lds = instalaciones(ctx, ['destino_seguro'])
    if (E?.r.evacuados || pre.length) R.push(fila(cols, [`Evacuación ordenada: reunirse en ${pre.length ? pre.map((x) => `el ${x.abrev} (${coordenada(ctx, x.p)})`).join(' o ') : 'los Puestos de Reunión de Evacuados'} y seguir el eje humanitario${lds.length ? ` hasta ${lds.map((x) => `el ${x.abrev} (${coordenada(ctx, x.p)})`).join(' o ')}` : ''}`, `Población a evacuar${E ? ` (${num(E.r.evacuados)} personas)` : ''}`, medio, primera]))
    const ay = instalaciones(ctx, GRUPOS.ayuda)
    if (ay.length) R.push(fila(cols, [`Distribución de agua, medicina, alimentos y ropa en ${ay.map((x) => `el ${x.abrev} (${coordenada(ctx, x.p)})`).join(' y ')}`, 'Población del área y evacuados', medio, primera]))
    return R
  },
  potencia: (ctx, hoja) => {
    const cs = hoja?.campos || []
    const k = (re) => cs.find((c) => re.test(c))
    const P = {}
    const D = descarga(ctx)
    const E = evacuacion(ctx)
    const s = solapeEPA(ctx)
    const pr = protegidos(ctx)
    const ap = k(/APORTA/i)
    const li = k(/LIMITA/i)
    if (ap && D && (D.abast || D.albergue || D.transporte)) P[ap] = `Recursos locales EXPLOTABLES que descargan al G-4: ${descargaTexto(D)}`
    const lim = [E?.r.evacuados && `${num(E.r.evacuados)} evacuados previstos que hay que sacar del área de operaciones`, s > 0 && `el eje humanitario se monta ${fmtKm(s)} sobre el EPA`, pr.n && `${pr.n} bien(es) que no se baten (áreas restringidas para el fuego)`].filter(Boolean)
    if (li && lim.length) P[li] = `${lim.join('; ')}.`
    return P
  },
  decision: (ctx, hoja) => {
    const cols = hoja?.cols || ['Curso de acción', 'Ventajas', 'Desventajas', '¿Se puede apoyar?']
    const ap = ctx.hojas?.aprecOrientacion && tiene(APREC, ctx.hojas.aprecOrientacion) ? ctx.hojas.aprecOrientacion : ctx.hojas?.aprecActiva
    if (!tiene(APREC, ap)) return []
    return normalizar(APREC, ap).caps.filter((c) => limpio(c.ventajas) || limpio(c.desventajas)).map((c) => fila(cols, [c.nombre, sinMarcaIA(c.ventajas), sinMarcaIA(c.desventajas), '']))
  },
  riesgo: (ctx, hoja) => {
    const cols = hoja?.cols || ['Riesgo', 'Probabilidad', 'Gravedad', 'Medida de control', 'Quién la ejecuta']
    const R = []
    const E = evacuacion(ctx)
    const s = solapeEPA(ctx)
    if (s > 0) R.push(fila(cols, [`Columna de evacuados sobre el EPA (${fmtKm(s)} del eje humanitario a menos de ${UMBRAL_EPA_KM * 1000} m)`, '', '', 'Separar el eje humanitario del EPA y controlar los cruces', 'G-5 con el G-4']))
    if (E?.r.evacuados && !ejesHumanitarios(ctx).length) R.push(fila(cols, [`Interferencia de la población con la maniobra: ${num(E.r.evacuados)} evacuados sin eje humanitario`, '', '', 'Trazar el eje humanitario y habilitar los Puestos de Reunión de Evacuados y los Locales de Destino Seguro', 'G-5']))
    if (E?.r.alerta) R.push(fila(cols, [`Evacuados sin albergue: ${E.r.alerta}`, '', '', 'Habilitar locales adicionales con las autoridades municipales', 'G-5 / Equipo de Servicios Especiales']))
    const pr = protegidos(ctx)
    if (pr.n) R.push(fila(cols, [`Daño colateral a ${pr.n} bien(es) protegido(s)`, '', '', 'Incluirlos como áreas restringidas en el Juego de Guerra y en las medidas de coordinación del apoyo de fuegos', 'G-5 con el G-3']))
    return R
  },
}

// ════════════════════════════════════════════════════════════════════════════════════
// LA CONFIGURACIÓN QUE LEE EL MOTOR
// ════════════════════════════════════════════════════════════════════════════════════
const PRODUCTO_APREC = (ctx, hoja) =>
  `Tu producto es la ${APREC.titulo} (hoja ${hoja?.num || 'F1·P3'} del PMTD${hoja?.id === 'aprecOrientacion' ? ', la apreciación ACTUALIZADA con el análisis de la misión, la que se expone en la orientación al Comandante' : ''}) ${deLa(unidadDe(ctx))}, con la forma EXACTA del modelo de la Escuela: OBJETO, CARTA, ANEXOS; I.- MISIÓN; II.- SITUACIÓN Y CONSIDERACIONES DE AC/GM; III.- ANÁLISIS (función por función: unidades de AC, gobierno, economía política, instalaciones públicas y funciones especiales); IV.- COMPARACIÓN; V.- CONCLUSIONES Y RECOMENDACIONES. El membrete, la numeración y la firma los pone la Mesa.`
const VERIF_APREC = [
  '¿La misión de AC/GM dice quién, qué, cuándo, dónde y para qué, e incluye la tarea esencial?',
  '¿La situación dice el EFECTO del terreno, las CC.MM. y el enemigo sobre la POBLACIÓN y las operaciones de AC/GM (no sólo los describe)?',
  '¿Usaste la población, los recursos clasificados y la evacuación que calculó la Mesa (sin cambiar las cifras)?',
  '¿Cada función del ANÁLISIS tiene necesidades, disponibilidades, limitaciones y recomendaciones?',
  '¿V.- dice si la misión puede ser apoyada, qué CAP se apoya mejor y el mejor curso de acción de AC/GM (el concepto de apoyo)?',
  '¿Usaste lo de los documentos aportados (la Orden y sus anexos) y seguiste las ideas del oficial?',
]
const VERIF_ANEXO = [
  '¿La misión es la de AC/GM y coincide con la de la apreciación?',
  '¿El concepto de apoyo dice el enfoque de cada función y la prioridad de esfuerzo de los equipos, fase por fase?',
  '¿La evacuación usa las cifras de la Mesa y prioriza los medios CIVILES?',
  '¿Los ejes humanitarios van fuera del EPA?',
  '¿Están los bienes que no se baten, la mano de obra civil y el enlace con las autoridades?',
  '¿Es una ORDEN (lo que hay que hacer), no una apreciación?',
]

export default {
  id: ID,
  nombre: 'G-5 Asuntos Civiles / GM',
  color: COLOR,
  seccionIA: SECCION_IA,
  seccionWord: 'E. M. G-5',
  doctrina: doctrinaParaIA,
  datosCalco,
  entregas,
  entregasTexto,
  otrasHojas,
  estadoCalco,
  guias: GUIAS,
  guiaIA,
  semillas: SEMILLAS,
  sinNadaHoja: 'No había nada nuevo que traer del calco (no se pisa lo escrito). Encendé las capas de población e infraestructura y clasificá los recursos (🔎), dimensioná la evacuación y trazá el eje humanitario (🚸), marcá los bienes que no se baten (⛔), o trabajala con la IA.',
  documentos: {
    aprecActiva: {
      def: APREC,
      nom: (h) => h.nom,
      nota: 'La Apreciación de Situación de AC/GM se trabaja acá, con la forma del modelo de la Escuela: 🌱 trae del calco y de tus hojas (población, recursos clasificados, evacuación, ejes humanitarios, instalaciones y bienes protegidos, fichas, lo que entregaron la Orden, el G-1, el G-2, el G-3 y el G-4); 💡 tus ideas van a la IA; 🤖 la IA la completa o la mejora con TODO el expediente (la Orden y los documentos aportados) y la doctrina; y sale en Word con el formato militar. En la fase 1 se elabora; en la fase 2 (F2·P13) se actualiza.',
      registro: { id: 'aprecActiva' },
      firma: firmaG5,
      propuestas: propuestasAprec,
      tablas: tablasAprec,
      producto: PRODUCTO_APREC,
      verificacion: VERIF_APREC,
      ideasQue: 'qué quiere apreciar, qué le preocupa de la población y los recursos, qué CAP prefiere',
      ideasEjemplo: 'Ej.: «Lo crítico es la evacuación de PUEBLO-X en la fase I» · «Prefiero el CAP 1: el eje humanitario no toca el EPA» · «La población coopera».',
      sembrarAyuda: 'Trae del calco la población (Censo 2024), los recursos del área con tu clasificación, lo que se descarga al G-4, la previsión de evacuación, los ejes humanitarios (y si se montan sobre el EPA), las instalaciones de AC/GM y los bienes protegidos, las fichas y las fases del COA; de lo que entregaron las otras secciones, la Orden superior, el curso de acción del enemigo (G-2) y las instalaciones y ejes del G-1 y el G-4; de tus hojas del G-5, las tareas (F2·P3), limitaciones (F2·P5), suposiciones (F2·P6), los temas (F2·P11) y las ventajas y desventajas de cada CAP (F5·P1). No pisa lo escrito.',
    },
    aprecOrientacion: {
      def: APREC,
      nota: 'La misma apreciación de la fase 1 (📋 Partir de la F1·P3), actualizada con el análisis de la misión: es la que se expone en la orientación al Comandante. Se trabaja igual: calco, ideas, IA con todo el expediente y Word militar.',
      registro: { id: 'aprecOrientacion' },
      partirDe: 'aprecActiva',
      firma: firmaG5,
      propuestas: propuestasAprec,
      tablas: tablasAprec,
      producto: PRODUCTO_APREC,
      verificacion: VERIF_APREC,
      ideasQue: 'qué cambió con el análisis de la misión y qué quiere exponer al Comandante',
      ideasEjemplo: 'Ej.: «Con la misión reexpresada, la evacuación se adelanta al D-2» · «Recomendar el CAP 2 aunque exija dos LDS».',
      sembrarAyuda: 'Trae lo mismo que la F1·P3, ya actualizado (población, recursos, evacuación, ejes, instalaciones, lo de las otras secciones y tus hojas). No pisa lo escrito.',
    },
    anexo: {
      def: ANEXO,
      nota: 'El Anexo de AC/GM se trabaja acá, con la estructura del Anexo de AC/GM que ya armaba la Mesa (la Escuela no tiene modelo de anexo del G-5) y el formato militar común: 🌱 trae la población, los recursos clasificados (con su cuadro), la evacuación (con su cuadro), los ejes humanitarios, las instalaciones, los bienes protegidos y lo que ya resolvió tu Apreciación; 💡 tus ideas; 🤖 la IA con todo el expediente y la doctrina; y sale en Word con membrete y OCA (es un ANEXO: el cuadro de revisión pide su letra y la Orden). Revisalo antes de firmarlo.',
      registro: { id: 'anexoF7P1', militar: true },
      firma: () => '',
      propuestas: propuestasAnexo,
      tablas: tablasAnexo,
      producto: (ctx, hoja) => `Tu producto es el ANEXO DE ASUNTOS CIVILES Y GOBIERNO MILITAR a la Orden General de Operaciones (hoja ${hoja?.num || 'F7·P1'} del PMTD) ${deLa(unidadDe(ctx))}. La Escuela no tiene modelo de anexo del G-5: respetá la estructura del Anexo de AC/GM de la Mesa: OBJETO, CARTA y APÉNDICE; Organización de la Tarea; I.- SITUACIÓN; II.- MISIÓN; III.- EJECUCIÓN (concepto de apoyo, tareas para los equipos funcionales, instrucciones de coordinación); IV.- APOYO DE SERVICIO; V.- COMANDO Y COMUNICACIONES. Es una ORDEN: dice lo que hay que hacer. Los cuadros de recursos y de evacuación los pone la Mesa.`,
      verificacion: VERIF_ANEXO,
      ideasQue: 'cómo quiere el apoyo de AC/GM',
      ideasEjemplo: 'Ej.: «Prioridad de esfuerzo a Servicios Especiales en la fase I» · «Toque de queda desde las 2000 en PUEBLO-X» · «El LDS en el coliseo de PUEBLO-Z».',
      sembrarAyuda: 'Trae la población, los recursos del área clasificados (con su cuadro), la evacuación dimensionada (con su cuadro), los ejes humanitarios, las instalaciones de AC/GM, los bienes protegidos, el enlace, la mano de obra civil, el PC de la Orden, y de tu Apreciación la misión de AC/GM, las hipótesis y el mejor curso de acción de AC/GM. No pisa lo escrito.',
    },
  },
}
