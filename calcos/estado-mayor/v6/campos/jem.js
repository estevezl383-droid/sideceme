// JEFE DE ESTADO MAYOR — lo que el motor necesita para trabajar sus hojas en «📋 Mis hojas»
// (panel 🎖️):
//
//   · 🌱 en cada hoja, con lo que YA HIZO el Estado Mayor y lo que ya dispuso el Comandante:
//     la Línea Inicial de Tiempo y el Programa General (las de siempre, compartidas con el
//     G-3), la Intención y la selección de cursos de acción del Comandante, las apreciaciones
//     de cada sección, los eventos críticos y el método del Juego de Guerra del G-3;
//   · la IA recibe además lo que la Mesa no manda al expediente: las hojas del Comandante y
//     las propias, y la doctrina de cada hoja.
//
// No hay documento propio de la Escuela (modelo) para estas hojas: son los cuadros del PMTD
// (Visión Horizontal) y se trabajan con su forma (campos, filas) y su Word de hoja.
import { limpio, lista, obj, filasDe, col, g3De, cmteDe, jemDe, unir, cae, fasesCOA, cursosDeAccion, estadoApreciaciones, programa, fila, contenidoDe, SECCIONES } from './mando.js'

export const ID = 'jem'
export const COLOR = '#0f766e'
export const SECCION_IA = 'JEFATURA DE ESTADO MAYOR — el Jefe de Estado Mayor'

export const DOCTRINA = [
  'LA LÍNEA INICIAL DE TIEMPO (RC-02-101; PMTD 2017): es del JEM. Del recibo de la orden al inicio de la operación, un tercio es para el planeamiento del Estado Mayor y dos tercios para la preparación de las unidades subordinadas. Define el día D, el fin de las operaciones, TD/TE/TTD y el reparto por fases (40/10/30/5/5/10 en el PMTD 2017). Alimenta la Guía Inicial del Comandante y el Programa General de Planeamiento.',
  'EL PROGRAMA GENERAL DE PLANEAMIENTO: diez eventos fijos del PMTD, con un responsable fijo y plazos que salen de la Línea Inicial de Tiempo, encadenados.',
  'LA LÍNEA DE TIEMPO ACTUALIZADA (Fase II) es la misma de la Fase I, ya actualizada y COMPARADA CON LA DEL ENEMIGO, con hora y lugar de las orientaciones, las horas de planeamiento cooperativo y los ensayos.',
  'LA ORIENTACIÓN DEL ESTADO MAYOR (Fase II): el JEM. arma el rol; cada miembro del Estado Mayor presenta el resumen de la apreciación activa de su campo.',
  'LAS NORMAS DE EVALUACIÓN las determina el JEM. y se fijan ANTES de desarrollar los cursos de acción: si se fijan después, se terminan acomodando al curso que ya gustó. Alimentan la matriz de decisión de la Fase V. Un curso de acción debe ser adecuado, factible, aceptable, distinguible y completo (PMTD 2017).',
  'EL LIBRETO DEL JEM. para el Juego de Guerra: qué cursos se juegan, con qué técnica (faja, profundidad o caja), qué eventos críticos, qué reglas y turnos y quién registra. Evita que el juego de guerra se convierta en una conversación.',
  'EL MÉTODO DE REGISTRO (Fase IV): las matrices (la de sincronización) se preparan EN BLANCO y se llenan recién en el paso siguiente, durante el juego de guerra.',
  'EL ROL DE EXPOSICIONES PARA LA TOMA DE DECISIONES (Fase V): el JEM. arma el orden en que el Estado Mayor le expone al Comandante y recomienda el mejor curso de acción.',
]
export const doctrinaParaIA = () => DOCTRINA.map((x) => `- ${x}`).join('\n')

const campoG3 = (ctx, id) => obj(g3De(ctx)[id])

export function datosCalco(ctx = {}) {
  const L = []
  const os = ctx.ordenSup || {}
  const orden = [['Unidad', os.unidad], ['Misión recibida', os.mision], ['Intención del Comandante superior', os.intencion], ['Momento de la ejecución', os.cuando || os.vigencia]].filter(([, x]) => limpio(x))
  if (orden.length) L.push(`LA ORDEN DEL ESCALÓN SUPERIOR\n${orden.map(([k, x]) => `- ${k}: ${limpio(x)}`).join('\n')}`)
  const P = programa(ctx)
  if (P.some((p) => p.plazos)) L.push(`PROGRAMA GENERAL DE PLANEAMIENTO (de la Línea Inicial de Tiempo; plazos en notación de día D)\n${P.map((p) => `- ${p.evento} — ${p.responsable}${p.plazos ? `: ${p.plazos}` : ''}`).join('\n')}`)
  const g2 = cae(ctx)
  if (g2.hay) L.push(`EL G-2 (PICB)\n${[['CAE más probable', g2.probable], ['CAE más peligroso', g2.peligroso]].filter(([, x]) => limpio(x)).map(([k, x]) => `- ${k}: ${x}`).join('\n')}`)
  const fs = fasesCOA(ctx)
  if (fs.length) L.push(`FASES DEL CURSO DE ACCIÓN PROPIO EN EL CALCO\n${fs.map((n, i) => `- Fase ${i + 1}: ${n}`).join('\n')}`)
  const cs = cursosDeAccion(ctx)
  if (cs.length) L.push(`CURSOS DE ACCIÓN PROPIOS QUE YA NOMBRÓ EL ESTADO MAYOR\n${cs.map((n) => `- ${n}`).join('\n')}`)
  const ap = estadoApreciaciones(ctx)
  L.push(`APRECIACIONES DEL ESTADO MAYOR\n${ap.map((a) => `- ${a.rot}: ${a.actual ? 'actualizada (F2·P13)' : a.activa ? 'abierta (F1·P3)' : 'sin trabajar'}`).join('\n')}`)
  return L.join('\n\n')
}
export const entregasTexto = (ctx) => contenidoDe(ctx, ['cmte', 'g3', 'g1', 'g2', 'g4', 'g5', 'eme'], [], 800)
export const otrasHojas = (ctx, sin = []) => contenidoDe(ctx, ['jem'], sin, 900)
export const entregas = () => []

const GUIAS_IA = {
  lineaTiempoAct: { para: 'La línea de tiempo de la Fase I, ya actualizada y comparada con la del enemigo: actividades, responsable, fecha y hora, lugar.', como: ['Las diez actividades son las del Programa General de Planeamiento; los plazos salen de la Línea Inicial de Tiempo (notación de día D).', 'Sumá las orientaciones, las horas de planeamiento cooperativo y los ensayos con su hora y lugar.'] },
  orientacionEM: { para: 'El rol de la orientación del Estado Mayor sobre el análisis de la misión: cada miembro presenta el resumen de su apreciación activa.', como: ['Un renglón por expositor (Comandante aparte, G-1 a G-5 y EME.).', 'El producto que presenta es la apreciación de su campo (F2·P13).', 'El tiempo sale de la línea de tiempo: no pases de lo asignado a la orientación.'] },
  normasEval: { para: 'Normas de evaluación de los cursos de acción: se fijan ANTES de desarrollarlos.', como: ['Un renglón por norma: qué mide, peso y fundamento.', 'Incluí cumplir la intención del Comandante (su Intención Inicial ya está en el pedido) y las pruebas de validez de un CAP (adecuado, factible, aceptable, distinguible, completo).', 'Los pesos suman 100.'] },
  libreto: { para: 'El libreto del JEM. para el Juego de Guerra.', como: ['Cursos que se juegan: los que el Comandante dejó pasar (su selección está en el pedido).', 'Técnica: faja, profundidad o caja, con el método y el orden de los SOCB que ya eligió el G-3.', 'Eventos críticos: los del G-3 (F4·P4).'] },
  rolExposiciones: { para: 'El rol de exposiciones para la toma de decisiones: el orden en que el Estado Mayor le expone al Comandante y la recomendación que sostiene cada uno.', como: ['Un renglón por expositor.', 'La recomendación sale de la comparación de los cursos de acción de cada sección (F5·P1).'] },
}
export function guiaIA(hojaId) {
  const g = GUIAS_IA[hojaId]
  return g ? { ...g, como: [...g.como, 'Trabajás como el JEFE DE ESTADO MAYOR. Usá lo que ya hicieron el Comandante y cada sección (están en «LO QUE YA ENTREGARON LAS OTRAS SECCIONES») y la doctrina.'] } : null
}

export const SEMILLAS = {
  lineaTiempoAct: (ctx, hoja) => {
    const cols = hoja?.cols || ['Actividad', 'Responsable', 'Fecha y hora', 'Lugar']
    return programa(ctx).filter((p) => p.evento).map((p) => fila(cols, [p.evento, p.responsable, p.plazos, '']))
  },
  orientacionEM: (ctx, hoja) => {
    const cols = hoja?.cols || ['Expositor', 'Tema', 'Tiempo', 'Producto que presenta']
    const ap = estadoApreciaciones(ctx)
    const R = [fila(cols, ['Comandante', 'Intención Inicial y Guía de Planificación', '', 'Intención Inicial (F2·P14)'])]
    for (const a of ap) R.push(fila(cols, [a.rot, `Resumen de la apreciación activa de ${a.corto}`, '', `Apreciación de ${a.corto}${a.actual ? ' actualizada (F2·P13)' : a.activa ? ' (F1·P3, falta actualizarla)' : ' (sin trabajar)'}`]))
    return R
  },
  normasEval: (ctx, hoja) => {
    const cols = hoja?.cols || ['Norma de evaluación', 'Qué mide', 'Peso', 'Fundamento']
    const R = []
    const int = limpio(cmteDe(ctx).intencion && (obj(cmteDe(ctx).intencion)['Estado Final Deseado'] || ''))
    R.push(fila(cols, ['Cumple la intención del Comandante', 'Si el curso lleva al estado final deseado y respeta el propósito ampliado', '', int ? `Intención Inicial (F2·P14): ${int}` : 'Intención Inicial del Comandante (F2·P14)']))
    for (const [n, q] of [['Adecuado', 'Si cumple la misión y respeta las limitaciones'], ['Factible', 'Si se puede ejecutar con los medios, el tiempo y el espacio disponibles'], ['Aceptable', 'Si el riesgo y las bajas previstas valen el resultado'], ['Distinguible', 'Si se diferencia de los demás cursos en lo esencial'], ['Completo', 'Si dice quién, qué, cuándo, dónde, cómo y para qué']]) R.push(fila(cols, [n, q, '', 'Pruebas de validez de un curso de acción (PMTD 2017)']))
    for (const [n, q] of [['Simplicidad', 'Cuánta coordinación exige'], ['Flexibilidad (ramas y secuelas)', 'Cuánto admite cambiar sobre la marcha'], ['Sostenibilidad logística', 'Si el G-4 lo puede sostener'], ['Empleo de la reserva', 'Si deja reserva para lo imprevisto'], ['Riesgo', 'Qué se arriesga y qué medidas lo controlan']]) R.push(fila(cols, [n, q, '', 'Matriz de decisión del G-3 (F5·P1)']))
    return R
  },
  libreto: (ctx) => {
    const sel = filasDe(cmteDe(ctx).seleccionCoa)
    const pasan = sel.filter((f) => /^s[ií]/i.test(col(f, /pasa/i))).map((f) => col(f, /^curso/i))
    const m = campoG3(ctx, 'metodo')
    const ev = filasDe(g3De(ctx).eventos).map((f) => `${col(f, /P\.?D/i) ? `P.D. ${col(f, /P\.?D/i)}: ` : ''}${col(f, /evento/i)}`).filter((x) => limpio(x))
    const P = {}
    P['Cursos que se juegan'] = unir((pasan.length ? pasan : sel.map((f) => col(f, /^curso/i))).map((n) => `- ${n}`))
    P['Técnica elegida (faja / profundidad / caja)'] = unir([m['Técnica elegida (faja · profundidad · caja)'], m['Por qué esa técnica'] && `Por qué: ${m['Por qué esa técnica']}`, m['Fajas / cajas definidas'] && `Fajas / cajas: ${m['Fajas / cajas definidas']}`])
    P['Eventos críticos que se van a jugar'] = unir(ev.map((x) => `- ${x}`))
    P['Reglas del juego y turnos'] = unir([m['Orden de precedencia de los SOCB en el turno'] && `Orden de precedencia de los SOCB en el turno: ${m['Orden de precedencia de los SOCB en el turno']}`])
    P['Quién registra'] = unir([m['Método de registro elegido'] && `Método de registro: ${m['Método de registro elegido']}`])
    return P
  },
  rolExposiciones: (ctx, hoja) => {
    const cols = hoja?.cols || ['Expositor', 'Qué expone', 'Tiempo', 'Recomendación que sostiene']
    const R = [fila(cols, ['Jefe de Estado Mayor', 'Cursos de acción y normas de evaluación', '', ''])]
    for (const s of SECCIONES) {
      const h = s.id === 'g3' ? { decision: obj(ctx.calco?.g3).decision } : obj(ctx.calco?.hojasG?.[s.id])
      const rec = filasDe(h.decision).map((f) => `${col(f, /^curso/i)}${col(f, /apoyar/i) ? `: ${col(f, /apoyar/i)}` : ''}`).filter((x) => limpio(x))
      R.push(fila(cols, [s.rot, `Comparación de los cursos de acción desde ${s.corto}`, '', rec.join('; ')]))
    }
    return R
  },
}

export default {
  id: ID,
  nombre: 'Jefe de Estado Mayor',
  color: COLOR,
  seccionIA: SECCION_IA,
  seccionWord: 'JEFATURA DE EM.',
  doctrina: doctrinaParaIA,
  datosCalco,
  entregas,
  entregasTexto,
  otrasHojas,
  guiaIA,
  semillas: SEMILLAS,
  sinNadaHoja: 'No había nada nuevo que traer: falta lo que el Estado Mayor y el Comandante todavía no hicieron, o ya está todo en la hoja.',
  documentos: {},
}
