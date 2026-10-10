// G-1 PERSONAL — lo que el motor necesita para trabajar las hojas del G-1 en «📋 Mis hojas»:
//
//   · los DOCUMENTOS con forma militar, copiados del modelo de la Escuela que ya está en
//     el catálogo del formato militar:
//       F1·P3 / F2·P13  APRECIACIÓN DE SITUACIÓN DE PERSONAL  (modelo «aprec-personal»)
//       F7·P1           ANEXO DE PERSONAL a la Orden          (modelo «plan-personal»)
//   · la DOCTRINA del campo de personal (ECEM 15-08 y los dos modelos), que va a la IA;
//   · lo que la Mesa trae del CALCO y de las demás hojas (🌱, sin pisar): la apreciación
//     de bajas por fase (los nueve factores del panel «📊 Bajas»), las instalaciones de
//     personal, la cadena y la ruta de PP.GG., la Línea de Extraviados, las fichas, las
//     fases del COA, lo que entregaron el G-2, el G-3, el G-4 y el G-5;
//   · la GUÍA «¿Para qué es y cómo se llena?» y la 🌱 de las hojas de trabajo del G-1
//     (F2·P3, F2·P5, F2·P6, F2·P8, F3·P1, F5·P1, F6·P3), que ya tenían su IA.
//
// Sin DOM: se prueba en Node.
import { limpio, texto, sinMarcaIA, romano, lista, esObj, vacio, claveTexto, normalizar, tiene } from '../motor.js'
import { articuloDe } from '../../../riesgo/v1/modelo.js'
import { distKm, largoKm, limpiar, fmtKm } from '../../../logistica/v1/geo.js'

export const ID = 'g1'
export const COLOR = '#7dd3fc'
export const SECCION_IA = 'SECCIÓN I — PERSONAL (G-1) del Estado Mayor'

// ════════════════════════════════════════════════════════════════════════════════════
// DOCTRINA
// ════════════════════════════════════════════════════════════════════════════════════
export const FUENTES = {
  ecem: 'ECEM 15-08 (apoyo de personal)',
  aprec: 'Modelo de Apreciación de Situación de Personal (EM. o Pl. My. / Sec- I) de la Escuela',
  plan: 'Modelo de Plan de Personal (EM. o Pl. My. / Sec- I) de la Escuela',
  pmtd: 'PMTD 2017',
}
// La cadena de evacuación de PP.GG. (ECEM 15-08, cap. III) y los grupos de instalaciones
// del calco (los mismos que usa el Anexo de Personal que ya bajaba la Mesa).
export const CADENA_PPGG = [
  { id: 'p_ppgg', orden: 1, nivel: 'Batallón / GG.UU.', nota: 'Temporal y cerca del PC. En el Batallón se inicia el interrogatorio si hay especialista; en la División, el procesamiento.' },
  { id: 'dpg', orden: 2, nivel: 'Cuerpo de Ejército', nota: 'Retención provisional cuando el número es considerable o falla la evacuación.' },
  { id: 'crpg', orden: 3, nivel: 'Zona de Etapas', nota: 'Procesamiento completo, gran capacidad, construcciones más permanentes.' },
  { id: 'ccpg', orden: 4, nivel: 'Zona del Interior', nota: 'Administración total y permanente de los PP.GG.' },
]
export const MANEJO_PPGG = 'la PM. orgánica de la GU., fraccionada en unidades de CUSTODIA (vigilancia en las instalaciones y durante el traslado) y unidades de PROCESAMIENTO (registro y archivo).'
export const GRUPOS = {
  ppgg: CADENA_PPGG.map((x) => x.id),
  leyOrden: ['pce', 'p_extrav', 'p_pm', 'p_ctrl_tran', 'p_confin'],
  servicios: ['a_descanso', 'p_cant', 'p_ban', 'p_lav', 'p_relig', 'p_correo', 'p_pag'],
  sepulturas: ['prm', 'p_sepul'],
  reemplazos: ['p_reu_reempl'],
}
export const UMBRAL_EFICIENCIA = 20 // % de bajas sobre el efectivo: por encima, la Unidad pierde eficiencia combativa

export const DOCTRINA = [
  `LAS ÁREAS DEL CAMPO DE PERSONAL (${FUENTES.aprec} y ${FUENTES.plan}): 1) mantenimiento del efectivo de la Unidad (efectivos, refuerzos, reemplazos, partes e informes); 2) administración de personal (procedimientos de personal —premios, recompensas, condecoraciones, ascensos, rotación—, prisioneros de guerra, personal civil); 3) mantenimiento de la disciplina, ley y orden; 4) incremento de la moral (moral y servicios del personal; registro de sepulturas, entierros y efectos personales); 5) administración interna del PC. o CG.; 6) diversos (seguridad contra accidentes, actividades subversivas y sicológicas).`,
  `APRECIACIÓN DE BAJAS (${FUENTES.ecem}): no da una tabla cerrada; da NUEVE FACTORES que el G-1 pondera: dispositivo, tipo de operación, terreno, enemigo, clima y CC.MM., estado físico y moral, experiencia de combate, condiciones sanitarias y tiempo en combate. Fija el ORDEN (en la ofensiva las bajas son altas, en la defensa menos, en las retrógradas bajas) y que las unidades con experiencia de combate sufren menos bajas que las nuevas; la mayor causa de pérdidas fuera de combate son los cambios de estación y la región donde opera la unidad. Las bajas se aprecian POR FASE, no de una vez. Los porcentajes base de la Mesa son referencias de planeamiento editables.`,
  `UMBRAL: por encima del ${UMBRAL_EFICIENCIA} % de bajas sobre el efectivo, la Unidad pierde eficiencia combativa: hay que decirlo en las conclusiones y prever reemplazos o rotación.`,
  'A EVACUAR Y ATENDER = heridos + pérdidas fuera de combate: es el requerimiento al G-4 (lo que tiene que absorber el Puesto de Clasificación y Evacuación Divisionario y mover la Sección de Ambulancias). REEMPLAZOS A SOLICITAR = muertos + desaparecidos + heridos no recuperables + parte de las pérdidas fuera de combate.',
  `PRISIONEROS DE GUERRA (${FUENTES.ecem}, cap. III): suben por una cadena de cuatro eslabones, cada uno más atrás y más permanente: ${CADENA_PPGG.map((x) => `${x.orden}) ${x.id.toUpperCase()} — ${x.nivel}: ${x.nota}`).join(' ')} Van por el EJE PRINCIPAL DE EVACUACIÓN, nunca por el de abastecimiento (el que sube prisioneros no puede estar bajando munición). Los maneja ${MANEJO_PPGG} Trato conforme a los Protocolos de Ginebra: cuidado, alimentación, vestuario, disciplina, trabajo, remuneración y representación.`,
  'LÍNEA DE EXTRAVIADOS: medida de control que opera la Policía Militar; se tiende normalmente a retaguardia de las posiciones de artillería en el escalón División; sobre ella y en los cruces hacia retaguardia van los Puestos de Control, y el Puesto de Reunión queda cerca de las instalaciones de sanidad para facilitar la clasificación médica.',
  'MORAL: el Área de Descanso (y las instalaciones de incremento de la moral) va LEJOS del Puesto de Reunión de Muertos.',
  'PERSONAL CIVIL: su empleo en la Zona de Combate lo autoriza el escalón superior; el pago se hace en el Puesto de Pagaduría.',
  `LA APRECIACIÓN DE PERSONAL (${FUENTES.pmtd}): NO se difunde; se elabora en la fase 1 (F1·P3) y se actualiza con el análisis de la misión (F2·P13) para la orientación al Comandante. Termina diciendo si la operación puede ser apoyada desde el punto de vista del personal y qué curso de acción se apoya mejor. El ANEXO DE PERSONAL (F7·P1) sí se difunde con la Orden.`,
]
export const doctrinaParaIA = () => DOCTRINA.map((x) => `- ${x}`).join('\n')

// ════════════════════════════════════════════════════════════════════════════════════
// LOS DOCUMENTOS (la forma exacta de los modelos del catálogo)
// ════════════════════════════════════════════════════════════════════════════════════
export const APREC = {
  esquema: 'aprec-personal-v1',
  titulo: 'APRECIACIÓN DE SITUACIÓN DE PERSONAL',
  archivo: 'Apreciacion_de_Personal',
  plantilla: 'aprec-personal',
  fuente: 'modelo de apreciación de personal',
  modelo: 'Apreciación de Situación de Personal (G-1) — modelo de la Escuela, forma de la Mesa del Estado Mayor',
  nivel: 'principal',
  preliminares: [
    { id: 'objeto', t: 'OBJETO' },
    { id: 'cartas', t: 'CARTAS' },
    { id: 'anexos', t: 'ANEXOS', ayuda: 'uno por renglón' },
  ],
  arbol: [
    { t: 'MISIÓN.', hijos: [
      { t: 'Tareas.', hijos: [
        { id: 'tareasEsp', t: 'Específicas.', ayuda: 'las que la Orden superior le impone al campo de personal' },
        { id: 'tareasImp', t: 'Implícitas.', ayuda: 'las que hay que hacer para cumplir las específicas' },
        { id: 'tareasEse', t: 'Esenciales.', ayuda: 'sin ellas no hay cumplimiento' },
      ] },
      { id: 'recursos', t: 'Recursos.', ayuda: 'efectivo, unidades e instalaciones de personal disponibles' },
      { id: 'limitaciones', t: 'Limitaciones.', ayuda: 'restricciones y prohibiciones que afectan al personal' },
      { id: 'mision', t: 'Misión de Personal.', ayuda: 'quién, qué, cuándo, dónde y para qué' },
    ] },
    { t: 'SITUACIÓN Y CONSIDERACIONES DE PERSONAL.', hijos: [
      { t: 'Situación de Inteligencia.', hijos: [
        { t: 'Características del área de operaciones.', hijos: [
          { id: 'terrenoCCMM', t: 'Conclusiones del estudio del terreno y de las CC.MM.' },
          { id: 'efectosPersonal', t: 'Efectos sobre las actividades del personal.' },
        ] },
        { id: 'enemigoDispositivo', t: 'Efectivo y dispositivo del Enemigo.' },
        { id: 'enemigoCA', t: 'Curso de acción del Enemigo.' },
      ] },
      { t: 'Situación Propia.', hijos: [
        { id: 'dispositivo', t: 'Dispositivo actual de los elementos tácticos principales.' },
        { id: 'refuerzosPropios', t: 'Refuerzos.' },
        { id: 'capsPropios', t: 'Cursos de Acción Propios.' },
        { id: 'operacionesFuturas', t: 'Operaciones futuras (después de cumplir la misión).' },
      ] },
      { t: 'Situación Logística.', hijos: [
        { id: 'logDispositivo', t: 'Dispositivo actual de los medios logísticos que afecten a personal.' },
        { id: 'logProyectos', t: 'Proyectos dentro de logística que afecten a la situación de personal.' },
      ] },
      { t: 'Situación de asuntos civiles y gobierno militar.', hijos: [
        { id: 'acDispositivo', t: 'Dispositivo actual de las Unidades e instalaciones de AC. que afecten a la situación de personal.' },
        { id: 'acPrevisiones', t: 'Previsiones de AC. que afecten a las actividades de personal.' },
      ] },
      { id: 'hipotesis', t: 'Hipótesis.' },
      { t: 'Situación de Personal.', hijos: [
        { t: 'Mantenimiento del efectivo de la Unidad.', hijos: [
          { id: 'efectivos', t: 'Efectivos.', ayuda: 'de la GU. y de cada Unidad subordinada' },
          { id: 'refuerzos', t: 'Refuerzos.', ayuda: 'asignados por el escalón superior' },
          { id: 'reemplazos', t: 'Reemplazos.', ayuda: 'los asignados, su calidad y la ubicación de las Unidades de reemplazo' },
          { id: 'partes', t: 'Partes e informes.', ayuda: 'los que se elevan al escalón superior, con su horario' },
        ] },
        { t: 'Administración de Personal.', hijos: [
          { id: 'procedimientos', t: 'Procedimientos de Personal.', ayuda: 'premios, recompensas, condecoraciones, ascensos y rotación' },
          { id: 'ppgg', t: 'Prisioneros de guerra.', ayuda: 'número, actitud, nacionalidades, medios de evacuación e instalaciones' },
          { id: 'civil', t: 'Personal Civil.', ayuda: 'empleo de la mano de obra civil y disposiciones que lo rigen' },
        ] },
        { id: 'disciplina', t: 'Mantenimiento de la disciplina, ley y orden.', ayuda: 'conducta y presentación de la tropa, deserciones, casos disciplinarios, relación con la población civil' },
        { t: 'Incremento de la moral.', hijos: [
          { id: 'moral', t: 'Moral y servicios del personal.' },
          { id: 'sepulturas', t: 'Registros de sepulturas, entierros y efectos personales.' },
        ] },
        { id: 'adminCG', t: 'Administración Interna del CG.', ayuda: 'ubicación y organización de los Puestos Comando' },
        { id: 'diversos', t: 'Diversos.', ayuda: 'seguridad contra accidentes, actividades subversivas y sicológicas' },
      ] },
    ] },
    { t: 'ANÁLISIS.', hijos: [{ caps: true }] },
    { t: 'COMPARACIÓN.', hijos: [
      { id: 'factores', t: 'Factores determinantes.', ayuda: 'Valorizar los factores determinantes o normas de evaluación del personal y las limitaciones o deficiencias que hubieran con respecto al cumplimiento de la misión con cada CAP. en análisis' },
      { ventajas: true, t: 'Ventajas y desventajas de cada Curso de Acción Propio.', ayuda: 'Considerar las ventajas y desventajas que ofrece desde el punto de vista del personal cada CAP. en análisis' },
      { id: 'superar', t: 'Medios o procedimientos para superar las limitaciones.', ayuda: 'Incluir los medios o procedimientos a emplear para superar las limitaciones o deficiencias o bien las modificaciones que se deberán introducir en cada CAP' },
    ] },
    { t: 'CONCLUSIONES Y RECOMENDACIONES.', hijos: [
      { id: 'factibilidad', t: 'Factibilidad del apoyo de personal.', ayuda: 'Expresar si la operación puede o no ser apoyada en buenas condiciones desde el punto de vista del personal' },
      { id: 'mejorCap', t: 'Curso de acción mejor apoyado.', ayuda: 'Señalar cuál Curso de acción Propio podría ser mejor apoyado desde el punto de vista de personal' },
      { id: 'desventajasRestantes', t: 'Desventajas de los demás cursos de acción.', ayuda: 'Establecer las desventajas sobre el punto de vista del personal en cada Curso de acción no enumerado en el subpárrafo anterior' },
      { id: 'problemas', t: 'Problemas, deficiencias y recomendaciones.', ayuda: 'Exponer los problemas y deficiencias en medios cuando son cuestiones muy importantes y las recomendaciones específicas para resolver estos problemas, así como cualquier deficiencia que pueda afectar al cumplimiento de la misión' },
    ] },
  ],
  // III.- ANÁLISIS: «CAP No. 1 → Fase 1 – Fase 2… → Mantenimiento del efectivo de la Unidad.
  // / Administración de Personal.» (el modelo)
  cap: {
    porCap: [],
    porFase: [
      { id: 'mantenimiento', t: 'Mantenimiento del efectivo de la Unidad.', ayuda: 'bajas previstas en la fase (de combate y fuera de combate), a evacuar, reemplazos, refuerzos, partes' },
      { id: 'administracion', t: 'Administración de Personal.', ayuda: 'PP.GG. previstos y su evacuación, personal civil, disciplina, ley y orden, moral y sepulturas en la fase' },
    ],
  },
  obligatorios: [
    { id: 'mision', txt: 'I.- D.- Falta la MISIÓN DE PERSONAL (con la tarea esencial).', tipo: 'err' },
    { id: 'tareasEsp', txt: 'I.- A.- 1.- Faltan las tareas específicas (la F2·P3 del G-1 las trae).' },
    { id: 'efectivos', txt: 'II.- F.- 1.- a.- Faltan los efectivos (apreciá las bajas en «📊 Bajas» y traelas con 🌱).' },
    { id: 'ppgg', txt: 'II.- F.- 2.- b.- Faltan los prisioneros de guerra (cadena y ruta: pestaña «🔒 PP.GG.»).' },
    { id: 'factibilidad', txt: 'V.- A.- Falta decir si la operación puede ser apoyada desde el punto de vista del personal.', tipo: 'err' },
    { id: 'mejorCap', txt: 'V.- B.- Falta el curso de acción mejor apoyado.', tipo: 'err' },
  ],
}

export const ANEXO = {
  esquema: 'anexo-personal-v1',
  titulo: 'ANEXO (PERSONAL)',
  archivo: 'Anexo_de_Personal',
  plantilla: 'plan-personal',
  fuente: 'modelo de plan de personal',
  modelo: 'Anexo de Personal (Plan de Personal, G-1) — modelo de la Escuela, forma de la Mesa del Estado Mayor',
  nivel: 'anexo',
  preliminares: [
    { id: 'objeto', t: 'OBJETO' },
    { id: 'carta', t: 'CARTA' },
    { id: 'apendice', t: 'APÉNDICE', ayuda: 'uno por renglón' },
  ],
  arbol: [
    { t: 'SITUACIÓN.', hijos: [
      { id: 'fuerzasPropias', t: 'Fuerzas Propias.', ayuda: 'referirse a la Orden o Plan de Operaciones; efectivo de planeamiento' },
      { id: 'hipotesis', t: 'Hipótesis.', ayuda: 'aplica sólo para el Plan: las hipótesis del campo de personal válidas al cerrar el planeamiento' },
    ] },
    { id: 'mision', t: 'MISIÓN.', ayuda: 'la misión de personal: quién, qué, cuándo, dónde y para qué' },
    { t: 'EJECUCIÓN.', hijos: [
      { id: 'concepto', t: 'Concepto de Apoyo.', ayuda: 'articulación de las instalaciones de personal —ubicación y propósito de cada una— y prioridad de apoyo de reemplazos a las Unidades dependientes en cada fase' },
    ] },
    { t: 'APOYO DE PERSONAL.', hijos: [
      { t: 'Mantenimiento de efectivos.', hijos: [
        { id: 'efectivos', t: 'Efectivos.', ayuda: 'apreciación de bajas por fase y requerimiento de evacuación al G-4' },
        { id: 'reemplazos', t: 'Reemplazos.', ayuda: 'cuántos se solicitan, prioridad y Puesto de Reunión de Reemplazos' },
        { id: 'partes', t: 'Partes e informes.', ayuda: 'los que se elevan, con su horario' },
      ] },
      { t: 'Administración de personal.', hijos: [
        { id: 'procedimientos', t: 'Procedimientos de personal.', ayuda: 'premios, recompensas, condecoraciones, ascensos y rotación' },
        { id: 'ppgg', t: 'Prisioneros de guerra.', ayuda: 'cadena de evacuación, ruta por el EPE, quién los maneja y trato' },
        { id: 'civil', t: 'Personal civil.' },
      ] },
      { id: 'disciplina', t: 'Mantenimiento de la Disciplina, Ley y Orden.', ayuda: 'Línea de Extraviados, instalaciones disciplinarias, empleo de la PM., justicia militar' },
      { t: 'Incremento de la Moral.', hijos: [
        { id: 'moral', t: 'Moral.' },
        { id: 'servicios', t: 'Servicios de Personal.', ayuda: 'descanso, cantina, baño, lavandería, religioso, correo, pagaduría' },
        { id: 'sepulturas', t: 'Registro de sepulturas, entierros y efectos personales.' },
      ] },
      { id: 'adminCG', t: 'Administración interna del PC. o CG.', ayuda: 'ubicación, funcionamiento y movimiento del Puesto Comando: organización, seguridad por dispersión, funcionalidad y continuidad' },
      { id: 'diversos', t: 'Diversos.', ayuda: 'seguridad contra accidentes, actividades subversivas y sicológicas' },
    ] },
    { t: 'COMANDO Y COMUNICACIONES.', hijos: [
      { id: 'comando', t: 'Comando.', ayuda: 'ubicación de los PP.CC. y cadena de mando si difiere del PON' },
      { id: 'comunicaciones', t: 'Comunicaciones.', ayuda: 'IOC. en vigor' },
    ] },
  ],
  obligatorios: [
    { id: 'mision', txt: 'II.- Falta la MISIÓN.', tipo: 'err' },
    { id: 'concepto', txt: 'III.- A.- Falta el concepto de apoyo (instalaciones y prioridad por fase).', tipo: 'err' },
    { id: 'efectivos', txt: 'IV.- A.- 1.- Faltan los efectivos (apreciá las bajas en «📊 Bajas»).' },
    { id: 'ppgg', txt: 'IV.- B.- 2.- Faltan los prisioneros de guerra.' },
    { id: 'disciplina', txt: 'IV.- C.- Falta el mantenimiento de la disciplina, ley y orden (Línea de Extraviados).' },
  ],
}

// ════════════════════════════════════════════════════════════════════════════════════
// LO QUE LA MESA SABE DEL CALCO
// ════════════════════════════════════════════════════════════════════════════════════
const num = (x) => Math.round(+x || 0).toLocaleString('es')
const dec = (x) => (Math.round((+x || 0) * 10) / 10).toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const filasDe = (h) => (Array.isArray(h) ? h.filter(esObj) : [])
const col = (fila, re) => {
  const k = Object.keys(fila || {}).find((x) => re.test(x))
  return k ? sinMarcaIA(fila[k]) : ''
}
export const unidadDe = (ctx = {}) => limpio(ctx?.ordenSup?.unidad || ctx?.unidad || '')
const deLa = (u) => (u ? `${articuloDe(u).toLowerCase()} ${u}` : 'de la unidad')
export function firmaG1(ctx = {}) {
  const u = unidadDe(ctx)
  return u ? `EL G-1 ${articuloDe(u)} ${u}` : 'EL G-1 DE LA UNIDAD'
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
export function instalaciones(ctx = {}, ids = []) {
  return (ctx.calco?.unidades || [])
    .filter((u) => u?.tipo === 'instalacion' && (!ids.length || ids.includes(u.instalacion)))
    .map((u) => {
      const inf = infoInst(ctx, u.instalacion)
      return { id: u.instalacion, abrev: inf?.abrev || limpio(u.designacion || u.nombre || u.instalacion), nom: inf?.nom || '', p: [+u.lng, +u.lat] }
    })
}
const instTexto = (ctx, xs) => xs.map((x) => `${x.abrev}${x.nom && x.nom !== x.abrev ? ` (${x.nom})` : ''} en ${coordenada(ctx, x.p)}`).join('; ')
export const lineas = (ctx = {}, tipo) => (ctx.calco?.ops?.lineasEM || []).filter((l) => l?.tipo === tipo && limpiar(l.coords).length >= 2)
const lineaTexto = (ctx, l) => {
  const c = limpiar(l.coords)
  return `${fmtKm(largoKm(c))}, desde ${coordenada(ctx, c[0])} hasta ${coordenada(ctx, c[c.length - 1])}`
}
export const fichas = (ctx = {}, bando) => (ctx.calco?.unidades || []).filter((u) => (!u.tipo || u.tipo === 'unidad') && u.bando === bando)
const nombreFicha = (u) => limpio(u.designacion || u.nombre || u.id || 'unidad')
export const fasesDe = (ctx = {}) => (Array.isArray(ctx.calco?.fasesCOA?.propio) ? ctx.calco.fasesCOA.propio : [])
export const nombresFases = (ctx = {}) => fasesDe(ctx).map((f) => limpio(f?.nombre))

// La apreciación de bajas por fase con la MISMA cuenta del panel «📊 Bajas» (la función
// de la Mesa llega por el runtime: ctx.bajas).
export const EFECTIVO_DEFECTO = 6446
const FACT = [
  ['tipoOperacion', 'operación', 'ofensiva'],
  ['dispositivo', 'dispositivo', 'primer'],
  ['terreno', 'terreno', 'normal'],
  ['enemigo', 'enemigo', 'equivalente'],
  ['clima', 'clima y CC.MM.', 'normal'],
  ['sanidad', 'condiciones sanitarias', 'regular'],
  ['moral', 'estado físico y moral', 'normal'],
  ['experiencia', 'experiencia de combate', 'veterana'],
]
const NOMBRES_FACT = {
  tipoOperacion: { ofensiva: 'ofensiva', defensiva: 'defensiva', retrograda: 'retrógrada', movimiento: 'marcha / movimiento' },
  dispositivo: { primer: 'primer escalón', segundo: 'segundo escalón', reserva: 'reserva', apoyo: 'apoyo de combate / servicios' },
  terreno: { favorable: 'favorable', normal: 'normal', desfavorable: 'desfavorable' },
  enemigo: { inferior: 'inferior', equivalente: 'equivalente', superior: 'superior' },
  clima: { benigno: 'benigno', normal: 'normal', riguroso: 'riguroso o cambio de estación' },
  sanidad: { buena: 'buenas', regular: 'regulares', mala: 'deficientes' },
  moral: { alta: 'alta', normal: 'normal', baja: 'baja (desgastada)' },
  experiencia: { veterana: 'con experiencia de combate', nueva: 'nueva, sin bautismo de fuego' },
}
export function bajasDe(ctx = {}) {
  const f = ctx.bajas
  const porFase = Array.isArray(ctx.calco?.bajasPorFase) ? ctx.calco.bajasPorFase : []
  const n = Math.max(fasesDe(ctx).length, porFase.length)
  if (typeof f !== 'function' || !n) return null
  const nombres = nombresFases(ctx)
  const tot = { bc: 0, pfc: 0, total: 0, muertos: 0, heridos: 0, desaparecidos: 0, aEvacuar: 0, reemplazos: 0 }
  const fases = []
  let efectivo = 0
  for (let i = 0; i < n; i++) {
    const v = porFase[i] || {}
    const p = { efectivo: v.efectivo ?? ctx.efectivoGU ?? EFECTIVO_DEFECTO, dias: v.dias ?? 1, diasEnCombate: v.diasEnCombate ?? 0 }
    for (const [k, , def] of FACT) p[k] = v[k] || def
    let r
    try {
      r = f(p)
    } catch {
      return null
    }
    for (const k of Object.keys(tot)) tot[k] += +r[k] || 0
    efectivo = Math.max(efectivo, +p.efectivo || 0)
    fases.push({ i, nombre: nombres[i] || '', p, r, cargada: !!porFase[i] && Object.keys(porFase[i]).length > 0 })
  }
  return { fases, total: tot, efectivo, pct: efectivo ? (tot.total / efectivo) * 100 : 0, alguna: fases.some((x) => x.cargada) }
}
const nombreFase = (b) => `Fase ${romano(b.i + 1)}${b.nombre ? ` — ${b.nombre}` : ''}`
const factoresTexto = (p) => FACT.map(([k, rot]) => `${rot} ${NOMBRES_FACT[k]?.[p[k]] || p[k]}`).join(', ')
export function bajasFaseTexto(b) {
  const r = b.r
  return `Bajas previstas: ${num(r.total)} (${dec(r.pctEfectivo)} % del efectivo de ${num(b.p.efectivo)}): ${num(r.bc)} de combate (${num(r.muertos)} muertos, ${num(r.heridos)} heridos, ${num(r.desaparecidos)} desaparecidos) y ${num(r.pfc)} fuera de combate. A evacuar y atender: ${num(r.aEvacuar)}. Reemplazos a solicitar: ${num(r.reemplazos)}. (${b.p.dias} día(s); ${factoresTexto(b.p)}.)`
}
export function tablaBajas(ctx = {}) {
  const B = bajasDe(ctx)
  if (!B) return null
  const t = B.total
  return {
    cabecera: ['Fase', 'Operación', 'Bajas de combate', 'Fuera de combate', 'Total', 'A evacuar', 'Reemplazos'],
    filas: [
      ...B.fases.map((b) => [nombreFase(b), NOMBRES_FACT.tipoOperacion[b.p.tipoOperacion] || b.p.tipoOperacion, num(b.r.bc), num(b.r.pfc), num(b.r.total), num(b.r.aEvacuar), num(b.r.reemplazos)]),
      [{ t: 'TOTAL', bold: true }, '', { t: num(t.bc), bold: true }, { t: num(t.pfc), bold: true }, { t: num(t.total), bold: true }, { t: num(t.aEvacuar), bold: true }, { t: num(t.reemplazos), bold: true }],
    ],
  }
}
// Distancia entre el Área de Descanso y el Puesto de Reunión de Muertos (la doctrina los
// quiere LEJOS).
export function descansoPRM(ctx = {}) {
  const d = instalaciones(ctx, ['a_descanso'])[0]
  const m = instalaciones(ctx, ['prm'])[0]
  return d && m ? distKm(d.p, m.p) : null
}

// Lo que la Mesa calculó y tiene en el calco, en texto (va a la IA de todas las hojas).
export function datosCalco(ctx = {}) {
  const L = []
  const B = bajasDe(ctx)
  if (B) {
    L.push(`APRECIACIÓN DE BAJAS POR FASE (panel «📊 Bajas» del G-1, nueve factores del ECEM 15-08${B.alguna ? '' : ' — el G-1 todavía no ajustó los factores: son los valores por defecto'}):`)
    for (const b of B.fases) L.push(`- ${nombreFase(b)}: ${bajasFaseTexto(b)}`)
    L.push(`- TOTAL DE LA OPERACIÓN: ${num(B.total.total)} bajas (${dec(B.pct)} % del efectivo de ${num(B.efectivo)}); a evacuar y atender ${num(B.total.aEvacuar)}; reemplazos a solicitar ${num(B.total.reemplazos)}; muertos ${num(B.total.muertos)}; desaparecidos ${num(B.total.desaparecidos)}.${B.pct >= UMBRAL_EFICIENCIA ? ` ⚠️ Supera el ${UMBRAL_EFICIENCIA} %: la Unidad pierde eficiencia combativa.` : ''}`)
  } else if (fasesDe(ctx).length === 0) L.push('APRECIACIÓN DE BAJAS: el G-3 todavía no creó las fases del COA (las bajas se aprecian por fase).')
  const g = (k, rot) => {
    const xs = instalaciones(ctx, GRUPOS[k])
    L.push(`${rot}: ${xs.length ? instTexto(ctx, xs) : 'ninguna en el calco'}.`)
  }
  g('ppgg', 'CADENA DE PP.GG. en el calco')
  const rp = lineas(ctx, 'ppgg')
  L.push(`RUTA DE EVACUACIÓN DE PP.GG.: ${rp.length ? rp.map((l) => lineaTexto(ctx, l)).join('; ') : 'sin trazar'}.`)
  const le = lineas(ctx, 'extraviados')
  L.push(`LÍNEA DE EXTRAVIADOS: ${le.length ? le.map((l) => lineaTexto(ctx, l)).join('; ') : 'sin trazar'}.`)
  g('leyOrden', 'INSTALACIONES DE LEY Y ORDEN')
  g('servicios', 'SERVICIOS DE PERSONAL')
  g('sepulturas', 'REGISTRO NECROLÓGICO')
  g('reemplazos', 'PUESTO DE REUNIÓN DE REEMPLAZOS')
  const d = descansoPRM(ctx)
  if (d !== null && d < 2) L.push(`⚠️ El Área de Descanso está a ${fmtKm(d)} del Puesto de Reunión de Muertos: la doctrina los quiere LEJOS.`)
  const pr = fichas(ctx, 'propias')
  if (pr.length) L.push(`FICHAS PROPIAS EN EL CALCO (${pr.length}): ${pr.map(nombreFicha).join('; ')}.`)
  const en = fichas(ctx, 'enemigas')
  if (en.length) L.push(`FICHAS ENEMIGAS EN EL CALCO (${en.length}): ${en.map(nombreFicha).join('; ')}.`)
  const fs = nombresFases(ctx)
  if (fs.length) L.push(`FASES DEL CURSO DE ACCIÓN PROPIO: ${fs.map((n, i) => `Fase ${romano(i + 1)}${n ? ` — ${n}` : ''}`).join('; ')}.`)
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
  const g4 = []
  if (limpio(ctx.calco?.misionLog)) g4.push(['Misión de logística', ctx.calco.misionLog])
  const sanidad = instalaciones(ctx).filter((x) => /^(pced|p_socorro|lug_heridos|p_amb|p_quir)/.test(x.id))
  if (sanidad.length) g4.push(['Instalaciones de sanidad', instTexto(ctx, sanidad)])
  const epe = (ctx.calco?.ops?.ejesLog || []).filter((e) => e?.tipo === 'epe' && limpiar(e.coords).length >= 2)
  if (epe.length) g4.push(['Eje Principal de Evacuación', epe.map((l) => lineaTexto(ctx, l)).join('; ')])
  if (g4.length) E.push({ de: 'El G-4', items: g4 })
  const ev = Object.entries(ctx.calco?.evacuacion || {}).filter(([, x]) => limpio(x))
  const rec = Object.entries(ctx.calco?.estadosRecursos || {}).filter(([, x]) => limpio(x))
  if (ev.length || rec.length) E.push({ de: 'El G-5', items: [ev.length && ['Previsión de evacuación de civiles', ev.map(([k, x]) => `${k}: ${x}`).join(' · ')], rec.length && ['Recursos locales clasificados', rec.map(([k, x]) => `${k} = ${x}`).join(' · ')]].filter(Boolean) })
  return E
}
export const entregasTexto = (ctx) => entregas(ctx).map((e) => `${e.de}:\n${e.items.map(([k, x]) => `- ${k}: ${sinMarcaIA(x)}`).join('\n')}`).join('\n\n')

// Lo que ya dicen las otras hojas del G-1 (para el pedido de cada documento).
export function otrasHojas(ctx = {}, sin = []) {
  const h = ctx.hojas || {}
  const L = []
  const filas = (id, rot) => {
    const xs = filasDe(h[id]).map((f) => Object.entries(f).filter(([k, x]) => !k.startsWith('_') && limpio(x)).map(([k, x]) => `${k}: ${sinMarcaIA(x)}`).join(' · ')).filter(Boolean)
    if (xs.length && !sin.includes(id)) L.push(`${rot}:\n${xs.map((x) => `- ${x}`).join('\n')}`)
  }
  filas('tareas', 'F2·P3 Tareas de personal')
  filas('limitaciones', 'F2·P5 Limitaciones de personal')
  if (esObj(h.hechos) && !sin.includes('hechos')) {
    const a = lista(h.hechos.a)
    const b = lista(h.hechos.b)
    if (a.length || b.length) L.push(`F2·P6 Hechos y suposiciones:\n${a.map((x) => `- HECHO: ${x}`).join('\n')}${a.length && b.length ? '\n' : ''}${b.map((x) => `- SUPOSICIÓN: ${x}`).join('\n')}`)
  }
  filas('rcic', 'F2·P8 RCIC y EEIA de personal')
  if (esObj(h.potencia) && !sin.includes('potencia')) {
    const xs = Object.entries(h.potencia).filter(([k, x]) => !k.startsWith('_') && limpio(x))
    if (xs.length) L.push(`F3·P1 Aporte a la potencia relativa:\n${xs.map(([k, x]) => `- ${k}: ${sinMarcaIA(x)}`).join('\n')}`)
  }
  filas('decision', 'F5·P1 Ventajas y desventajas de cada CAP desde personal')
  filas('riesgo', 'F6·P3 Riesgos de personal')
  for (const [id, def, rot] of [['aprecOrientacion', APREC, 'F2·P13 Apreciación de Personal (actualizada)'], ['aprecActiva', APREC, 'F1·P3 Apreciación de Personal'], ['anexo', ANEXO, 'F7·P1 Anexo de Personal']]) {
    if (sin.includes(id) || !tiene(def, h[id])) continue
    const v = normalizar(def, h[id])
    const llenos = Object.entries(v.campos).filter(([, x]) => limpio(x)).map(([k, x]) => `- ${k}: ${sinMarcaIA(x).replace(/\n+/g, ' / ')}`)
    if (llenos.length) L.push(`${rot}:\n${llenos.join('\n')}`)
  }
  return L.join('\n\n')
}

// ─── 🗺️ Lo que esta hoja toma del calco y lo que le falta (con botones para acostar) ─
export function estadoCalco(ctx = {}) {
  const B = bajasDe(ctx)
  const n = (k) => instalaciones(ctx, GRUPOS[k]).length
  const items = [
    fasesDe(ctx).length ? `✓ ${fasesDe(ctx).length} fase(s) del COA` : '✗ sin fases del COA (G-3)',
    B ? `✓ bajas apreciadas: ${num(B.total.total)} (${dec(B.pct)} %)${B.alguna ? '' : ' — factores por defecto'}` : '✗ sin apreciación de bajas',
    n('ppgg') ? `✓ ${n('ppgg')} instalación(es) de PP.GG.` : '✗ sin cadena de PP.GG.',
    lineas(ctx, 'ppgg').length ? '✓ ruta de PP.GG.' : '✗ sin ruta de PP.GG.',
    lineas(ctx, 'extraviados').length ? '✓ Línea de Extraviados' : '✗ sin Línea de Extraviados',
    n('leyOrden') + n('servicios') + n('sepulturas') + n('reemplazos') ? `✓ ${n('leyOrden') + n('servicios') + n('sepulturas') + n('reemplazos')} instalación(es) de ley y orden, moral y reemplazos` : '✗ sin instalaciones de ley y orden ni de moral',
  ]
  const todo = [...instalaciones(ctx, Object.values(GRUPOS).flat()).map((x) => [x.p]), ...lineas(ctx, 'ppgg').map((l) => l.coords), ...lineas(ctx, 'extraviados').map((l) => l.coords)]
  return {
    texto: items.join(' · '),
    verEnCarta: todo,
    botones: [
      { texto: '┅ Trazar la Línea de Extraviados', accion: 'herramienta', arg: 'extraviados' },
      { texto: '↗ Trazar la ruta de PP.GG.', accion: 'herramienta', arg: 'ppgg' },
    ],
    ayuda: 'Las bajas se aprecian en «📊 Bajas»; la cadena de PP.GG. se coloca en «🔒 PP.GG.»; las instalaciones de ley y orden y de moral, en «🚨 Orden».',
  }
}

// ════════════════════════════════════════════════════════════════════════════════════
// 🌱 LAS PROPUESTAS PARA CADA DOCUMENTO (sólo llenan lo vacío)
// ════════════════════════════════════════════════════════════════════════════════════
const porTipo = (h, re) => filasDe(h?.tareas).filter((f) => re.test(claveTexto(col(f, /tipo/i)))).map((f) => col(f, /^tarea/i)).filter(Boolean)
const guiones = (xs) => xs.map((x) => `- ${x}`).join('\n')
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
  const sup = esObj(h.hechos) ? lista(h.hechos.b) : []
  const B = bajasDe(ctx)
  const hip = [...sup]
  if (B?.alguna) hip.push(...B.fases.filter((b) => b.cargada).map((b) => `${nombreFase(b)}: la apreciación de bajas supone ${factoresTexto(b.p)}.`))
  if (hip.length) P.hipotesis = guiones(hip)
  const os = ctx.ordenSup || {}
  if (limpio(os.mision)) P.mision = `${unidad ? `El G-1 ${deLa(unidad)}` : 'El G-1'} mantiene el efectivo de las unidades, administra el personal y los prisioneros de guerra y sostiene la disciplina, la ley y el orden y la moral de las tropas${limpio(os.cuando) ? `, ${limpio(os.cuando)}` : ''}, para apoyar el cumplimiento de la misión: «${limpio(os.mision)}».`
  const B2 = B
  if (B2) {
    P.efectivos = `Efectivo de planeamiento: ${num(B2.efectivo)} hombres. Bajas previstas en la operación: ${num(B2.total.total)} (${dec(B2.pct)} % del efectivo), en ${B2.fases.length} fase(s):\n${B2.fases.map((b) => `- ${nombreFase(b)}: ${num(b.r.total)} bajas (${num(b.r.bc)} de combate y ${num(b.r.pfc)} fuera de combate); a evacuar ${num(b.r.aEvacuar)}.`).join('\n')}${B2.pct >= UMBRAL_EFICIENCIA ? `\n- Las bajas superan el ${UMBRAL_EFICIENCIA} % del efectivo: la Unidad pierde eficiencia combativa.` : ''}`
    const prr = instalaciones(ctx, GRUPOS.reemplazos)
    P.reemplazos = `Reemplazos a solicitar en la operación: ${num(B2.total.reemplazos)}.${prr.length ? ` Puesto de Reunión de Reemplazos: ${instTexto(ctx, prr)}.` : ' [Designar el Puesto de Reunión de Reemplazos.]'}`
  }
  const cad = instalaciones(ctx, GRUPOS.ppgg)
  const rp = lineas(ctx, 'ppgg')
  if (cad.length || rp.length)
    P.ppgg = [
      cad.length && `Cadena de evacuación en el calco: ${CADENA_PPGG.filter((c) => cad.some((x) => x.id === c.id)).map((c) => `${c.orden}.- ${cad.find((x) => x.id === c.id).abrev} (${c.nivel}) en ${coordenada(ctx, cad.find((x) => x.id === c.id).p)}`).join('; ')}.`,
      rp.length ? `- Ruta de evacuación: ${rp.map((l) => lineaTexto(ctx, l)).join('; ')} (por el EPE, no por el eje de abastecimiento).` : '- Ruta de evacuación: [trazarla por el EPE, no por el eje de abastecimiento].',
      `- Los maneja ${MANEJO_PPGG}`,
    ].filter(Boolean).join('\n')
  const le = lineas(ctx, 'extraviados')
  const lo = instalaciones(ctx, GRUPOS.leyOrden)
  if (le.length || lo.length)
    P.disciplina = [le.length && `- Línea de Extraviados: ${le.map((l) => lineaTexto(ctx, l)).join('; ')}, a retaguardia de las posiciones de artillería; la opera la PM.`, lo.length && `- Instalaciones de ley y orden: ${instTexto(ctx, lo)}.`].filter(Boolean).join('\n')
  const sp = instalaciones(ctx, GRUPOS.sepulturas)
  if (sp.length || B) P.sepulturas = [sp.length && `Instalaciones: ${instTexto(ctx, sp)}.`, B && `Bajas previstas por muerte: ${num(B.total.muertos)}; desaparecidos: ${num(B.total.desaparecidos)}.`].filter(Boolean).join(' ')
  const d = descansoPRM(ctx)
  P._avisoMoral = d !== null && d < 2 ? `- ATENCIÓN: el Área de Descanso está a ${fmtKm(d)} del Puesto de Reunión de Muertos; hay que alejarla (la doctrina los quiere LEJOS).` : ''
  return P
}

export function propuestasAprec(ctx = {}) {
  const C = comunes(ctx)
  const P = { ...C }
  delete P._avisoMoral
  const unidad = unidadDe(ctx)
  P.objeto = `Determinar si la operación ${deLa(unidad)} puede ser apoyada desde el punto de vista del personal y cuál es el curso de acción propio mejor apoyado.`
  if (limpio(ctx.ordenSup?.carta)) P.cartas = texto(ctx.ordenSup.carta)
  P.anexos = ['“A” Calco de apoyo de personal (instalaciones, Línea de Extraviados y ruta de evacuación de PP.GG.).', bajasDe(ctx) ? '“B” Apreciación de bajas por fase.' : ''].filter(Boolean).join('\n')
  const inst = instalaciones(ctx, Object.values(GRUPOS).flat())
  const B = bajasDe(ctx)
  if (B || inst.length) P.recursos = [B && `Efectivo de planeamiento: ${num(B.efectivo)} hombres.`, inst.length && `Instalaciones de personal desplegadas en el calco: ${inst.map((x) => x.abrev).join(', ')}.`].filter(Boolean).join(' ')
  if (B?.alguna) P.efectosPersonal = guiones(B.fases.filter((b) => b.cargada).map((b) => `${nombreFase(b)}: terreno ${NOMBRES_FACT.terreno[b.p.terreno]}, clima y CC.MM. ${NOMBRES_FACT.clima[b.p.clima]}, condiciones sanitarias ${NOMBRES_FACT.sanidad[b.p.sanidad]}: ${num(b.r.pfc)} pérdidas fuera de combate previstas.`))
  const en = fichas(ctx, 'enemigas')
  if (en.length) P.enemigoDispositivo = `Fichas enemigas en el calco: ${en.map(nombreFicha).join('; ')}.`
  const g2 = entregas(ctx).find((e) => e.de === 'El G-2')
  if (g2) P.enemigoCA = g2.items.map(([k, x]) => `${k}: ${sinMarcaIA(x)}`).join('\n')
  const pr = fichas(ctx, 'propias')
  if (pr.length) P.dispositivo = `Elementos propios en el calco: ${pr.map(nombreFicha).join('; ')}.`
  const fs = nombresFases(ctx)
  if (fs.length) P.capsPropios = `Curso de acción propio en ${fs.length} fase(s): ${fs.map((n, i) => `Fase ${romano(i + 1)}${n ? ` — ${n}` : ''}`).join('; ')}.`
  const g4 = entregas(ctx).find((e) => e.de === 'El G-4')
  if (g4) P.logDispositivo = g4.items.map(([k, x]) => `- ${k}: ${sinMarcaIA(x)}`).join('\n')
  const conc = (ctx.calco?.conceptoApoyo || []).map((c, i) => (esObj(c) && limpio(c.prioridad) ? `- Fase ${romano(i + 1)}: prioridad de apoyo logístico ${limpio(c.prioridad)}.` : '')).filter(Boolean)
  if (conc.length) P.logProyectos = conc.join('\n')
  const g5 = entregas(ctx).find((e) => e.de === 'El G-5')
  if (g5) P.acPrevisiones = g5.items.map(([k, x]) => `- ${k}: ${sinMarcaIA(x)}`).join('\n')
  const sv = instalaciones(ctx, GRUPOS.servicios)
  if (sv.length || C._avisoMoral) P.moral = [sv.length && `Servicios de personal en el calco: ${instTexto(ctx, sv)}.`, C._avisoMoral].filter(Boolean).join('\n')
  const decs = filasDe(ctx.hojas?.decision)
  const apoyables = decs.filter((f) => limpio(col(f, /apoyar/i)))
  if (apoyables.length || B) P.factibilidad = [...apoyables.map((f) => `- ${col(f, /curso/i) || 'CAP'}: ${col(f, /apoyar/i)}`), B && B.pct >= UMBRAL_EFICIENCIA ? `- Las bajas previstas (${dec(B.pct)} % del efectivo) superan el ${UMBRAL_EFICIENCIA} %: el apoyo exige reemplazos anticipados.` : ''].filter(Boolean).join('\n') || ''
  if (!P.factibilidad) delete P.factibilidad
  // Los CAP: los de la F5·P1 (nombre, ventajas, desventajas); el análisis fase por fase
  // del primero lleva la apreciación de bajas del panel (es la del CAP en estudio).
  const caps = decs.map((f) => ({ nombre: col(f, /curso/i), ventajas: col(f, /^ventaja/i), desventajas: col(f, /^desventaja/i) }))
  if (B) {
    if (!caps.length) caps.push({})
    caps[0].fases = B.fases.map((b) => ({ valores: { mantenimiento: bajasFaseTexto(b) } }))
  }
  return { campos: P, fases: fs, caps }
}

export function propuestasAnexo(ctx = {}) {
  const C = comunes(ctx)
  const P = {}
  const unidad = unidadDe(ctx)
  const os = ctx.ordenSup || {}
  const ap = ctx.hojas?.aprecOrientacion && tiene(APREC, ctx.hojas.aprecOrientacion) ? normalizar(APREC, ctx.hojas.aprecOrientacion) : ctx.hojas?.aprecActiva && tiene(APREC, ctx.hojas.aprecActiva) ? normalizar(APREC, ctx.hojas.aprecActiva) : null
  P.objeto = `Establecer el apoyo de personal a la operación ${deLa(unidad)}.`
  if (limpio(os.carta)) P.carta = texto(os.carta)
  P.apendice = '“1” Calco de apoyo de personal (instalaciones, Línea de Extraviados y ruta de evacuación de PP.GG.).'
  const B = bajasDe(ctx)
  const pr = fichas(ctx, 'propias')
  P.fuerzasPropias = ['Referirse a la Orden de Operaciones.', B && `Efectivo de planeamiento ${deLa(unidad)}: ${num(B.efectivo)} hombres.`, pr.length && `Elementos: ${pr.map(nombreFicha).join('; ')}.`].filter(Boolean).join(' ')
  const hip = ap?.campos?.hipotesis || C.hipotesis
  if (limpio(hip)) P.hipotesis = hip
  const mis = ap?.campos?.mision || C.mision
  if (limpio(mis)) P.mision = mis
  const inst = instalaciones(ctx, Object.values(GRUPOS).flat())
  if (B || inst.length)
    P.concepto = [
      inst.length && `Instalaciones de personal: ${instTexto(ctx, inst)}.`,
      ...(B ? B.fases.map((b) => `- ${nombreFase(b)}: ${num(b.r.total)} bajas previstas, ${num(b.r.reemplazos)} reemplazos; prioridad de reemplazos: [definir].`) : []),
    ].filter(Boolean).join('\n')
  if (B) P.efectivos = `Apreciación de bajas por fase, con los nueve factores ponderados del ECEM 15-08 (cuadro). Requerimiento al G-4: capacidad de evacuar y atender ${num(B.total.aEvacuar)} bajas en el conjunto de la operación (Puesto de Clasificación y Evacuación Divisionario y Sección de Ambulancias).`
  if (C.reemplazos) P.reemplazos = C.reemplazos
  if (C.ppgg) P.ppgg = `${C.ppgg}\n- Trato: conforme a los Protocolos de Ginebra — cuidado, alimentación, vestuario, disciplina, trabajo, remuneración y representación.`
  P.civil = 'Su empleo en la Zona de Combate lo autoriza el escalón superior; el pago se hace en el Puesto de Pagaduría.'
  if (C.disciplina) P.disciplina = C.disciplina
  const sv = instalaciones(ctx, GRUPOS.servicios)
  if (sv.length) P.servicios = `${instTexto(ctx, sv)}.`
  if (C.sepulturas || C._avisoMoral) P.sepulturas = [C.sepulturas, C._avisoMoral].filter(Boolean).join('\n')
  if (limpio(os.puestoMando)) P.comando = `PC. ${deLa(unidad)}: ${limpio(os.puestoMando)}.`
  // Lo que la apreciación ya resolvió y vale igual en el anexo.
  for (const k of ['partes', 'procedimientos', 'adminCG', 'diversos']) if (!P[k] && limpio(ap?.campos?.[k])) P[k] = ap.campos[k]
  return { campos: P }
}
export const tablasAnexo = (ctx) => {
  const t = tablaBajas(ctx)
  return t ? { efectivos: t } : {}
}

// ════════════════════════════════════════════════════════════════════════════════════
// LAS HOJAS DE TRABAJO DEL G-1 (guía y 🌱)
// ════════════════════════════════════════════════════════════════════════════════════
export const GUIAS = {
  aprecActiva: {
    para: 'Es TU evaluación como G-1, en los cinco pasos de toda apreciación: con ella sostenés, desde el campo de personal, si la operación se puede apoyar y qué curso de acción se apoya mejor. NO se difunde.',
    como: [
      'OBJETO, CARTAS y ANEXOS: qué se aprecia, la carta de la Orden y el calco de apoyo de personal.',
      'I.- MISIÓN: las tareas específicas, implícitas y esenciales del campo de personal (F2·P3), los recursos, las limitaciones (F2·P5) y la MISIÓN DE PERSONAL.',
      'II.- SITUACIÓN Y CONSIDERACIONES DE PERSONAL: lo que dicen el G-2 (terreno, CC.MM. y enemigo, con su EFECTO sobre el personal), el G-3 (dispositivo y CAP), el G-4 (sanidad y evacuación) y el G-5; las hipótesis; y la situación de personal: efectivos, refuerzos, reemplazos, partes, procedimientos, PP.GG., personal civil, disciplina, moral, sepulturas, CG. y diversos.',
      'III.- ANÁLISIS: cada CAP, FASE POR FASE: mantenimiento del efectivo (las bajas que aprecia el panel «📊 Bajas») y administración de personal.',
      'IV.- COMPARACIÓN: factores determinantes, ventajas y desventajas de cada CAP desde personal, y cómo superar las limitaciones.',
      'V.- CONCLUSIONES Y RECOMENDACIONES: si la operación se puede apoyar, qué CAP se apoya mejor, las desventajas de los otros y los problemas con su solución.',
    ],
    ejemplo: '«Las bajas previstas en la fase II (412, 6,4 % del efectivo) son absorbibles con los reemplazos asignados; el CAP N° 1 se apoya mejor porque concentra la evacuación de PP.GG. sobre un solo EPE.» Fijate que no describe: concluye para la decisión.',
  },
  aprecOrientacion: {
    para: 'Es la misma apreciación de la fase 1 (📋 Partir de la F1·P3), ACTUALIZADA con el análisis de la misión: la que el G-1 expone en la orientación al Comandante. NO se difunde.',
    como: ['Partí de la F1·P3 y actualizá lo que cambió con el análisis de la misión: tareas, limitaciones, hechos y suposiciones, bajas por fase.', 'Las conclusiones tienen que responder lo que el Comandante va a preguntar: ¿se puede apoyar?, ¿con qué costo en personal?'],
    ejemplo: '«Desde personal, la operación puede ser apoyada; el CAP N° 2 exige 180 reemplazos más que el CAP N° 1 en la fase de ruptura.»',
  },
  anexo: {
    para: 'Es la orden del campo de personal: lo que las unidades tienen que HACER en efectivos, PP.GG., disciplina y moral. SE DIFUNDE con la Orden y lo firma el Comandante.',
    como: [
      'OBJETO, CARTA y APÉNDICE (el calco de apoyo de personal).',
      'I.- SITUACIÓN: fuerzas propias e hipótesis (sólo en el Plan).',
      'II.- MISIÓN: la misión de personal de la apreciación.',
      'III.- EJECUCIÓN: el concepto de apoyo (las instalaciones y la prioridad de reemplazos por fase).',
      'IV.- APOYO DE PERSONAL: efectivos (el cuadro de bajas por fase y el requerimiento de evacuación al G-4), reemplazos, partes, procedimientos, PP.GG. (cadena, ruta por el EPE, quién los maneja, trato), personal civil, disciplina (Línea de Extraviados, PM.), moral, servicios, sepulturas, administración del PC. y diversos.',
      'V.- COMANDO Y COMUNICACIONES.',
    ],
    ejemplo: '«2.- Prisioneros de guerra. Se evacuarán por el EPE (ruta 4) hasta el DPG del CE; la Cía. PM. los custodia desde el PPGG del Batallón.»',
  },
  tareas: {
    para: 'Separa lo que la Orden le IMPONE al campo de personal de lo que el G-1 DEDUCE que hay que hacer, y marca lo indispensable. De acá sale la misión de personal.',
    como: [
      'Tarea: un verbo en infinitivo y su objeto («Evacuar los PP.GG. hasta el DPG del CE»).',
      'Tipo: ESPECÍFICA (escrita en la Orden o en su Anexo de Personal), IMPLÍCITA (necesaria para cumplir las específicas: reemplazos, evacuación de PP.GG., Línea de Extraviados, registro de sepulturas…) o ESENCIAL (sin ella no hay misión).',
      'De dónde sale: la Orden superior, su anexo, la doctrina (ECEM 15-08) o el calco.',
      'Quién la ejecuta: la Sección de Personal, la PM., el Puesto de Reunión de Reemplazos…',
    ],
    ejemplo: '«Solicitar 640 reemplazos al CE antes del D-2» — Implícita — Apreciación de bajas — G-1.',
  },
  limitaciones: {
    para: 'Lo que el campo de personal TIENE que hacer (restricción) o NO PUEDE hacer (prohibición), y qué le cuesta a la operación.',
    como: ['Limitación: concreta, con su cifra o su lugar.', 'Tipo: RESTRICCIÓN o PROHIBICIÓN.', 'Origen: la Orden superior, la ley (DICA, Protocolos de Ginebra) o los medios que faltan.', 'Efecto sobre la operación: qué cambia en el apoyo de personal.'],
    ejemplo: '«No emplear mano de obra civil al norte del río X» — Prohibición — Orden N° 3 — los trabajos de la zona de combate quedan sólo a cargo de la tropa.',
  },
  hechos: {
    para: 'Un HECHO se puede probar hoy; una SUPOSICIÓN hace falta para planificar y hay que confirmarla. En personal, las suposiciones suelen ser las de la apreciación de bajas y las de los reemplazos.',
    como: ['HECHOS: efectivo de planeamiento, fases, instalaciones desplegadas, lo que dice la Orden.', 'SUPOSICIONES: los factores de bajas que asumiste (enemigo, terreno, clima, moral, experiencia), cuándo llegan los reemplazos, cuántos PP.GG. habrá. Cada una con quién la confirma.'],
    ejemplo: 'Hecho: «La DIV.MEC.-1 tiene 6.446 hombres de efectivo de planeamiento». Suposición: «Los reemplazos del CE llegan antes del D+1».',
  },
  rcic: {
    para: 'RCIC: lo que el Comandante necesita saber del campo de personal para decidir. EEIA: lo que el enemigo NO tiene que saber de nuestro personal.',
    como: ['Requerimiento: una pregunta concreta.', 'Por qué es crítico: qué decisión depende de él.', 'Quién lo busca: la sección o el órgano.', 'Para cuándo: sin fecha límite no sirve.'],
    ejemplo: '«¿Cuántas bajas tiene el RI-1 al cerrar la fase II?» — define si se rota con la reserva — G-1 (partes) — D+1 (1800).',
  },
  potencia: {
    para: 'El aporte del campo de personal a la potencia relativa de combate: qué suma y qué resta el estado del personal, propio y enemigo.',
    como: ['APORTA: efectivo, moral, experiencia, reemplazos disponibles.', 'LIMITA: bajas previstas (y si pasan el 20 %), falta de reemplazos, desgaste.', 'ENEMIGO: lo mismo del lado enemigo (lo que dice el G-2).', 'CONCLUSIÓN: qué significa para el planeamiento.'],
    ejemplo: '«Con 12 % de bajas previstas en la ruptura, la potencia propia cae por debajo de 3 a 1 en el eje principal si no entran los reemplazos.»',
  },
  decision: {
    para: 'El aporte del G-1 a la matriz de decisión: desde el personal, ¿cada curso se puede apoyar?, ¿con qué costo?',
    como: ['Un renglón por CAP.', 'Ventajas y desventajas DESDE PERSONAL: bajas, reemplazos, PP.GG., moral, disciplina.', '¿Se puede apoyar?: sí, sí con limitaciones (cuáles) o no.'],
    ejemplo: 'CAP N° 1 — menos bajas en la fase I — más PP.GG. que evacuar por un solo EPE — Sí, reforzando la custodia de la PM.',
  },
  riesgo: {
    para: 'Los riesgos del campo de personal sobre el curso aprobado, cada uno con su medida de control y su responsable.',
    como: ['Riesgo: el peligro concreto (bajas por encima del 20 %, PP.GG. sobre el eje de abastecimiento, rezagados sin control, moral baja…).', 'Probabilidad y gravedad.', 'Medida de control: qué se hace para bajarlo.', 'Quién la ejecuta.'],
    ejemplo: '«Rezagados sin control en la retaguardia» — Probable — Marginal — tender la Línea de Extraviados con PP.CC. en los cruces — PM.',
  },
}
// Lo que la IA de las hojas de trabajo tiene que saber del G-1 (va como guía del pedido).
export function guiaIA(hojaId) {
  const g = GUIAS[hojaId]
  return g ? { ...g, como: [...g.como, `Trabajás desde el campo de PERSONAL (G-1): usá la doctrina —${FUENTES.ecem} y los modelos de la Escuela— y las cifras que calculó la Mesa.`] } : null
}

const fila = (cols, valores) => Object.fromEntries(cols.map((c, i) => [c, valores[i] ?? '']))
export const SEMILLAS = {
  tareas: (ctx, hoja) => {
    const cols = hoja?.cols || ['Tarea', 'Tipo', 'De dónde sale', 'Quién la ejecuta']
    const R = []
    for (const t of lista(String(ctx.ordenSup?.tareas || '').replace(/;\s*/g, '\n'))) R.push(fila(cols, [t, 'Específica', 'Orden del escalón superior', '']))
    const B = bajasDe(ctx)
    if (B) {
      R.push(fila(cols, [`Solicitar ${num(B.total.reemplazos)} reemplazos al escalón superior`, 'Implícita', 'Apreciación de bajas por fase (panel del G-1)', 'G-1 / Sección de Personal']))
      R.push(fila(cols, [`Coordinar con el G-4 la evacuación y atención de ${num(B.total.aEvacuar)} bajas`, 'Implícita', 'Apreciación de bajas por fase (panel del G-1)', 'G-1 con el G-4']))
    }
    const cad = instalaciones(ctx, GRUPOS.ppgg)
    if (cad.length) R.push(fila(cols, [`Evacuar los PP.GG. por la cadena ${cad.map((x) => x.abrev).join(' → ')} por el EPE`, 'Implícita', 'Calco (cadena de PP.GG.) y ECEM 15-08', 'PM. (custodia y procesamiento)']))
    const le = lineas(ctx, 'extraviados')
    if (le.length) R.push(fila(cols, [`Controlar la Línea de Extraviados (${fmtKm(largoKm(limpiar(le[0].coords)))})`, 'Implícita', 'Calco (Línea de Extraviados)', 'PM.']))
    return R
  },
  limitaciones: (ctx, hoja) => {
    const cols = hoja?.cols || ['Limitación', 'Tipo', 'Origen', 'Efecto sobre la operación']
    return lista(String(ctx.ordenSup?.limitaciones || '').replace(/;\s*/g, '\n')).map((t) => fila(cols, [t, /\bno\b|prohib/i.test(t) ? 'Prohibición' : 'Restricción', 'Orden del escalón superior', '']))
  },
  hechos: (ctx) => {
    const a = []
    const b = []
    const B = bajasDe(ctx)
    if (B) a.push(`Efectivo de planeamiento: ${num(B.efectivo)} hombres.`)
    const fs = nombresFases(ctx)
    if (fs.length) a.push(`El curso de acción propio tiene ${fs.length} fase(s): ${fs.map((n, i) => `Fase ${romano(i + 1)}${n ? ` — ${n}` : ''}`).join('; ')}.`)
    const inst = instalaciones(ctx, Object.values(GRUPOS).flat())
    if (inst.length) a.push(`Instalaciones de personal desplegadas: ${inst.map((x) => x.abrev).join(', ')}.`)
    for (const [tipo, rot] of [['extraviados', 'Línea de Extraviados'], ['ppgg', 'Ruta de evacuación de PP.GG.']]) {
      const l = lineas(ctx, tipo)
      if (l.length) a.push(`${rot} trazada: ${fmtKm(largoKm(limpiar(l[0].coords)))}.`)
    }
    if (B) for (const f of B.fases) b.push(`${nombreFase(f)}: ${factoresTexto(f.p)} → ${num(f.r.total)} bajas (confirma: G-2 y G-3).`)
    return { a, b }
  },
  rcic: (ctx, hoja) => {
    const cols = hoja?.cols || ['Requerimiento', 'Por qué es crítico', 'Quién lo busca', 'Para cuándo']
    const u = unidadDe(ctx) || 'la unidad'
    const R = []
    const B = bajasDe(ctx)
    if (B) for (const b of B.fases) R.push(fila(cols, [`RCIC: ¿cuántas bajas tiene ${u} al cerrar la ${nombreFase(b)}? (previstas: ${num(b.r.total)})`, 'Define si hay que adelantar los reemplazos o rotar con la reserva', 'G-1 (partes de personal de las unidades)', `Al cerrar la ${nombreFase(b)}`]))
    if (instalaciones(ctx, GRUPOS.ppgg).length) R.push(fila(cols, ['RCIC: ¿cuántos PP.GG. se capturan, de qué unidades y en qué estado?', 'Define la custodia de la PM. y la capacidad de la cadena de PP.GG.', 'G-1 con el G-2 (interrogatorio)', 'En cada fase']))
    if (fasesDe(ctx).length) R.push(fila(cols, [`EEIA: el efectivo y las bajas de ${u}`, 'Revelan al enemigo el desgaste propio y dónde reforzar su esfuerzo', 'G-2 (contrainteligencia) y G-1', 'Toda la operación']))
    return R
  },
  potencia: (ctx, hoja) => {
    const B = bajasDe(ctx)
    if (!B) return {}
    const cs = hoja?.campos || []
    const k = (re) => cs.find((c) => re.test(c))
    const P = {}
    const ap = k(/APORTA/i)
    const li = k(/LIMITA/i)
    if (ap) P[ap] = `Efectivo de planeamiento de ${num(B.efectivo)} hombres; ${num(B.total.reemplazos)} reemplazos a solicitar para sostenerlo en ${B.fases.length} fase(s).`
    if (li) P[li] = `Bajas previstas: ${num(B.total.total)} (${dec(B.pct)} % del efectivo)${B.pct >= UMBRAL_EFICIENCIA ? `, por encima del ${UMBRAL_EFICIENCIA} %: la Unidad pierde eficiencia combativa` : ''}; la fase más costosa es la ${nombreFase([...B.fases].sort((x, y) => y.r.total - x.r.total)[0])}.`
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
    const B = bajasDe(ctx)
    if (B && B.pct >= UMBRAL_EFICIENCIA) R.push(fila(cols, [`Pérdida de eficiencia combativa: bajas previstas del ${dec(B.pct)} % del efectivo`, '', '', 'Reemplazos anticipados y rotación con la reserva', 'G-1']))
    const d = descansoPRM(ctx)
    if (d !== null && d < 2) R.push(fila(cols, [`Caída de la moral: el Área de Descanso está a ${fmtKm(d)} del Puesto de Reunión de Muertos`, '', '', 'Alejar el Área de Descanso del PRM', 'G-1']))
    if (instalaciones(ctx, GRUPOS.ppgg).length && !lineas(ctx, 'ppgg').length) R.push(fila(cols, ['PP.GG. sobre el eje de abastecimiento (sin ruta de evacuación trazada)', '', '', 'Trazar la ruta de PP.GG. por el EPE', 'G-1 / PM.']))
    if (!lineas(ctx, 'extraviados').length && fasesDe(ctx).length) R.push(fila(cols, ['Rezagados y extraviados sin control en la retaguardia', '', '', 'Tender la Línea de Extraviados a retaguardia de la artillería, con PP.CC. en los cruces', 'PM.']))
    return R
  },
}

// ════════════════════════════════════════════════════════════════════════════════════
// LA CONFIGURACIÓN QUE LEE EL MOTOR
// ════════════════════════════════════════════════════════════════════════════════════
const PRODUCTO_APREC = (ctx, hoja) =>
  `Tu producto es la ${APREC.titulo} (hoja ${hoja?.num || 'F1·P3'} del PMTD${hoja?.id === 'aprecOrientacion' ? ', la apreciación ACTUALIZADA con el análisis de la misión, la que se expone en la orientación al Comandante' : ''}) ${deLa(unidadDe(ctx))}, con la forma EXACTA del modelo de la Escuela: OBJETO, CARTAS, ANEXOS; I.- MISIÓN; II.- SITUACIÓN Y CONSIDERACIONES DE PERSONAL; III.- ANÁLISIS (cada CAP, fase por fase); IV.- COMPARACIÓN; V.- CONCLUSIONES Y RECOMENDACIONES. El membrete, la numeración y la firma los pone la Mesa.`
const VERIF_APREC = [
  '¿La misión de personal dice quién, qué, cuándo, dónde y para qué, e incluye la tarea esencial?',
  '¿La situación de inteligencia dice el EFECTO del terreno, las CC.MM. y el enemigo sobre el PERSONAL (no sólo los describe)?',
  '¿Cada CAP tiene su análisis fase por fase, con las bajas que calculó la Mesa (sin cambiarlas)?',
  `¿Si las bajas pasan el ${UMBRAL_EFICIENCIA} % del efectivo, lo dijiste en las conclusiones?`,
  '¿V.- dice si la operación puede ser apoyada y qué CAP se apoya mejor, y por qué?',
  '¿Usaste lo de los documentos aportados (la Orden y sus anexos) y seguiste las ideas del oficial?',
]
const VERIF_ANEXO = [
  '¿La misión es la de personal y coincide con la de la apreciación?',
  '¿El concepto de apoyo dice dónde está cada instalación de personal y la prioridad de reemplazos por fase?',
  '¿Los efectivos y reemplazos usan las cifras de la Mesa y el requerimiento de evacuación al G-4?',
  '¿Los PP.GG. van por el EPE, con su cadena, quién los maneja y el trato?',
  '¿Está la Línea de Extraviados y quién la opera?',
  '¿Es una ORDEN (lo que hay que hacer), no una apreciación?',
]

export default {
  id: ID,
  nombre: 'G-1 Personal',
  color: COLOR,
  seccionIA: SECCION_IA,
  seccionWord: 'E. M. G-1',
  doctrina: doctrinaParaIA,
  datosCalco,
  entregas,
  entregasTexto,
  otrasHojas,
  estadoCalco,
  guias: GUIAS,
  guiaIA,
  semillas: SEMILLAS,
  documentos: {
    aprecActiva: {
      def: APREC,
      nom: (h) => h.nom,
      nota: 'La Apreciación de Situación de Personal se trabaja acá, con la forma del modelo de la Escuela: 🌱 trae del calco y de tus hojas (bajas por fase, PP.GG., Línea de Extraviados, instalaciones, fichas, lo que entregaron el G-2, el G-3, el G-4 y el G-5); 💡 tus ideas van a la IA; 🤖 la IA la completa o la mejora con TODO el expediente (la Orden y los documentos aportados) y la doctrina; y sale en Word con el formato militar. En la fase 1 se elabora; en la fase 2 (F2·P13) se actualiza.',
      registro: { id: 'aprecActiva' },
      firma: firmaG1,
      propuestas: propuestasAprec,
      producto: PRODUCTO_APREC,
      verificacion: VERIF_APREC,
      ideasQue: 'qué quiere apreciar, qué le preocupa del personal, qué CAP prefiere',
      ideasEjemplo: 'Ej.: «Lo crítico son los reemplazos de la fase II» · «Prefiero el CAP 1: un solo EPE para heridos y PP.GG.» · «El enemigo captura personal en las infiltraciones nocturnas».',
      sembrarAyuda: 'Trae del calco la apreciación de bajas por fase (panel «📊 Bajas»), la cadena y la ruta de PP.GG., la Línea de Extraviados, las instalaciones de ley y orden, de moral y de sepulturas, las fichas y las fases del COA; de lo que entregaron las otras secciones, la Orden superior, el curso de acción del enemigo (G-2), la sanidad y el EPE (G-4) y la evacuación de civiles (G-5); de tus hojas del G-1, las tareas (F2·P3), limitaciones (F2·P5), suposiciones (F2·P6) y las ventajas y desventajas de cada CAP (F5·P1). No pisa lo escrito.',
    },
    aprecOrientacion: {
      def: APREC,
      nota: 'La misma apreciación de la fase 1 (📋 Partir de la F1·P3), actualizada con el análisis de la misión: es la que se expone en la orientación al Comandante. Se trabaja igual: calco, ideas, IA con todo el expediente y Word militar.',
      registro: { id: 'aprecOrientacion' },
      partirDe: 'aprecActiva',
      firma: firmaG1,
      propuestas: propuestasAprec,
      producto: PRODUCTO_APREC,
      verificacion: VERIF_APREC,
      ideasQue: 'qué cambió con el análisis de la misión y qué quiere exponer al Comandante',
      ideasEjemplo: 'Ej.: «Con la misión reexpresada, la fase de ruptura es la más costosa» · «Recomendar el CAP 2 aunque exija más reemplazos».',
      sembrarAyuda: 'Trae lo mismo que la F1·P3, ya actualizado (bajas, PP.GG., Línea de Extraviados, fichas, fases, lo de las otras secciones y tus hojas). No pisa lo escrito.',
    },
    anexo: {
      def: ANEXO,
      nota: 'El Anexo de Personal se trabaja acá, con la forma del modelo de Plan de Personal de la Escuela: 🌱 trae el cuadro de bajas por fase, los reemplazos, la cadena y la ruta de PP.GG., la Línea de Extraviados, las instalaciones y lo que ya resolvió tu Apreciación; 💡 tus ideas; 🤖 la IA con todo el expediente y la doctrina; y sale en Word con el formato militar (es un ANEXO: el cuadro de revisión pide su letra y la Orden). Revisalo antes de firmarlo.',
      registro: { id: 'anexoF7P1' },
      firma: () => '',
      propuestas: propuestasAnexo,
      tablas: tablasAnexo,
      producto: (ctx, hoja) => `Tu producto es el ANEXO DE PERSONAL a la Orden General de Operaciones (hoja ${hoja?.num || 'F7·P1'} del PMTD) ${deLa(unidadDe(ctx))}, con la forma EXACTA del modelo de Plan de Personal de la Escuela: OBJETO, CARTA y APÉNDICE; I.- SITUACIÓN; II.- MISIÓN; III.- EJECUCIÓN (concepto de apoyo); IV.- APOYO DE PERSONAL; V.- COMANDO Y COMUNICACIONES. Es una ORDEN: dice lo que hay que hacer. El cuadro de bajas por fase lo pone la Mesa debajo de «Efectivos».`,
      verificacion: VERIF_ANEXO,
      ideasQue: 'cómo quiere el apoyo de personal',
      ideasEjemplo: 'Ej.: «Prioridad de reemplazos al RI-1 en la fase II» · «La Cía. PM. custodia los PP.GG. hasta el DPG» · «Pagaduría en el ASDI».',
      sembrarAyuda: 'Trae el cuadro de bajas por fase y el requerimiento de evacuación al G-4, los reemplazos y el Puesto de Reunión de Reemplazos, la cadena y la ruta de PP.GG., la Línea de Extraviados, las instalaciones de ley y orden, de servicios y de sepulturas, el PC. de la Orden, y de tu Apreciación la misión de personal y las hipótesis. No pisa lo escrito.',
    },
  },
}
