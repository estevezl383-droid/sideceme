// El pedido a la IA del TABLERO G-4 de una instalación y la lectura de su respuesta.
// La Mesa no consulta ninguna IA: arma el pedido (con TODO lo que calculó y las ideas del
// oficial), el oficial lo copia en la IA que quiera y pega la respuesta. Lo que vuelve
// queda «pendiente de revisión» hasta que el oficial lo marque; los números que propone
// (frecuencia, modalidad, factores) sólo se aplican con el botón y quedan señalados.
// Sin DOM: se prueba en Node.
import { textoPlan, leerRuta, FACTORES_DEFECTO, FILAS_FACTORES, AVISO_FACTORES, MODALIDADES } from '../../logistica/v1/planeamiento.js'
import { doctrinaParaIA } from '../../logistica/v1/doctrina.js'

export const PEDIDOS = [
  { id: 'verificar', nom: '🧮 Verificar el cálculo', txt: 'Verificá el cálculo (efectivos, vehículos, consumos por clase, ciclos, viajes y flota). Si un factor de referencia te parece fuera de lo normal para esta operación, decí cuál y con qué valor lo reemplazarías (en «ajustes.factores»).' },
  { id: 'frecuencia', nom: '⏱️ Frecuencia y modalidad', txt: 'Proponé la frecuencia de entrega y la modalidad de distribución (a domicilio, por cuenta propia o mixta) para cada unidad apoyada, con el motivo.' },
  { id: 'prioridad', nom: '🎯 Prioridad de apoyo', txt: 'Ordená las unidades apoyadas por prioridad de apoyo según la maniobra (el esfuerzo principal primero) y explicá por qué.' },
  { id: 'municion', nom: '💥 Munición y niveles', txt: 'Para la munición (Clase V) y las demás clases que maneja la instalación: proponé los niveles de abastecimiento en días (NO, NS y NMA = NO + NS) y qué hay que elevar antes del inicio de la operación.' },
  { id: 'seguridad', nom: '🛡️ Seguridad del flujo', txt: 'Analizá los riesgos para el flujo (ejes, distancias, puntos críticos, posibilidades del enemigo, nivel de amenaza en el área de retaguardia) y proponé medidas.' },
  { id: 'matriz', nom: '📋 Para la matriz de sincronización', txt: 'Redactá lo que esta instalación aporta a la Matriz de sincronización logística (renglones de abastecimiento, transporte y la prioridad de apoyo).' },
]
export const PEDIDOS_DEFECTO = ['verificar', 'frecuencia', 'prioridad']

export function esquemaRespuesta(id) {
  return {
    version: 1,
    instalacionId: String(id),
    resumen: 'Dos o tres líneas: qué apoya esta instalación, cuánto mueve por día, con cuántos vehículos y cada cuánto.',
    verificacion: ['Lo que revisaste del cálculo, con números.'],
    recomendaciones: ['Recomendación concreta para el G-4.'],
    riesgos: ['Riesgo y su medida.'],
    prioridades: [{ unidad: 'Nombre exacto de la unidad', prioridad: 1, motivo: 'Por qué.' }],
    niveles: { NO: 1, NS: 1, NMA: 2 },
    ajustes: { frecuenciaH: 24, modalidad: 'domicilio', factores: { 'clases.cl1': 2 } },
    preguntas: ['Pregunta para el oficial o para el estudio.'],
  }
}

export function generarPromptG4(plan, { ideas = '', pedir = PEDIDOS_DEFECTO, fragmentos = '', observaciones = '', encabezado = '', expediente = '' } = {}) {
  const P = []
  if (encabezado) P.push(encabezado)
  P.push(`Trabajás como Oficial de Logística (G-4) del Estado Mayor en un ejercicio académico de la Escuela de Comando y Estado Mayor. Analizás UNA instalación logística del calco: ${plan.inst.nombre}.`)
  P.push(`# LO QUE CALCULÓ LA MESA (son datos del calco y de los factores: usalos)\n\n${textoPlan(plan)}`)
  P.push(`# FACTORES DE PLANEAMIENTO USADOS\n\n${AVISO_FACTORES}\n${FILAS_FACTORES.map((g) => `${g.grupo}: ${g.filas.map((f) => `${f.ruta} = ${leerRuta(plan.factores, f.ruta)}${f.unidad ? ` ${f.unidad}` : ''}${leerRuta(plan.factores, f.ruta) !== leerRuta(FACTORES_DEFECTO, f.ruta) ? ' (cambiado por el oficial)' : ''}`).join('; ')}`).join('\n')}\nMultiplicadores de la operación «${plan.operacion.nom}»: ${Object.entries(plan.factores.operacion[plan.operacion.id] || {}).map(([k, v]) => `${k} ×${v}`).join(', ')}.`)
  if (plan.opDoc) P.push(`# QUÉ DICE LA ESCUELA DE ESTA OPERACIÓN\n\n${plan.opDoc.nom}: ${plan.opDoc.despliegue} ${plan.opDoc.clases ? `Clases: ${plan.opDoc.clases}` : ''} ${plan.opDoc.otros || ''}`)
  P.push(doctrinaParaIA({ conFactores: false, conMatriz: false, conAmenaza: true }))
  if (String(expediente || '').trim()) P.push(`# EXPEDIENTE DEL EJERCICIO\n\n${expediente}`)
  if (String(fragmentos || '').trim()) P.push(`# FRAGMENTOS DE DOCUMENTOS QUE ELIGIÓ EL OFICIAL (citá documento y página)\n\n${fragmentos.trim()}`)
  if (String(observaciones || '').trim()) P.push(`# OBSERVACIONES DEL OFICIAL\n\n${observaciones.trim()}`)
  if (String(ideas || '').trim()) P.push(`# IDEAS DEL OFICIAL — respetalas\n\n${ideas.trim()}\n\nSi una idea choca con los datos o con la doctrina, seguila igual y avisalo en «riesgos» o «preguntas».`)
  const sel = PEDIDOS.filter((x) => pedir.includes(x.id))
  P.push(`# QUÉ TENÉS QUE HACER\n\n${(sel.length ? sel : PEDIDOS.filter((x) => PEDIDOS_DEFECTO.includes(x.id))).map((x, i) => `${i + 1}. ${x.txt}`).join('\n')}`)
  P.push(`# REGLAS\n\n- Usá los números que calculó la Mesa; si los corregís, decí el número nuevo y por qué.\n- No inventes unidades, lugares ni coordenadas: nombrá las unidades EXACTAMENTE como figuran arriba.\n- «ajustes.frecuenciaH» sólo puede ser 12, 24, 48 o 72; «ajustes.modalidad» sólo ${MODALIDADES.map((m) => `«${m.id}»`).join(', ')}; «ajustes.factores» usa las rutas de arriba (p. ej. «clases.cl1», «disparos.art105», «medios.carga») con números. Dejá «ajustes» vacío si no cambiarías nada.\n- Los niveles van en DÍAS.\n- Devolvé ÚNICAMENTE un objeto JSON válido (sin comentarios ni texto alrededor), con esta forma; mantené version e instalacionId exactamente:\n${JSON.stringify(esquemaRespuesta(plan.inst.id), null, 2)}`)
  return P.join('\n\n')
}

const lista = (x, n = 60) => (Array.isArray(x) ? x.filter((y) => typeof y === 'string' && y.trim()).slice(0, n).map((y) => y.trim().slice(0, 4000)) : [])
function leerJSON(t) {
  const s = String(t || '')
  const cand = []
  for (const m of s.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) cand.push(m[1])
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  if (a >= 0 && b > a) cand.push(s.slice(a, b + 1))
  for (const x of cand) {
    try {
      return JSON.parse(x)
    } catch {}
  }
  return null
}
const RUTAS = new Set(FILAS_FACTORES.flatMap((g) => g.filas.map((f) => f.ruta)))

export function leerRespuestaG4(entrada, id, formato = 'json') {
  if (typeof entrada !== 'string' || !entrada.trim()) throw new Error('Pegá primero la respuesta de la IA.')
  if (entrada.length > 200000) throw new Error('La respuesta supera los 200.000 caracteres.')
  if (formato === 'texto') return { version: 1, instalacionId: String(id), textoLibre: entrada.trim() }
  const j = leerJSON(entrada)
  if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error('No encontré un objeto JSON en la respuesta. Copiala entera o elegí «Texto libre».')
  if (j.instalacionId != null && String(j.instalacionId) !== String(id)) throw new Error('La respuesta es de otra instalación (instalacionId distinto). Generá el pedido de ésta.')
  const r = { version: 1, instalacionId: String(id), resumen: typeof j.resumen === 'string' ? j.resumen.trim().slice(0, 6000) : '' }
  for (const k of ['verificacion', 'recomendaciones', 'riesgos', 'preguntas']) r[k] = lista(j[k])
  r.prioridades = (Array.isArray(j.prioridades) ? j.prioridades : [])
    .filter((p) => p && typeof p.unidad === 'string' && p.unidad.trim())
    .slice(0, 40)
    .map((p, i) => ({ unidad: p.unidad.trim().slice(0, 200), prioridad: Number.isFinite(+p.prioridad) ? +p.prioridad : i + 1, motivo: typeof p.motivo === 'string' ? p.motivo.trim().slice(0, 2000) : '' }))
    .sort((a, b) => a.prioridad - b.prioridad)
  const n = j.niveles && typeof j.niveles === 'object' ? j.niveles : {}
  r.niveles = {}
  for (const k of ['NO', 'NS', 'NMA']) if (Number.isFinite(+n[k]) && +n[k] >= 0 && +n[k] <= 60) r.niveles[k] = +n[k]
  const a = j.ajustes && typeof j.ajustes === 'object' ? j.ajustes : {}
  r.ajustes = {}
  if ([12, 24, 48, 72].includes(+a.frecuenciaH)) r.ajustes.frecuenciaH = +a.frecuenciaH
  if (MODALIDADES.some((m) => m.id === a.modalidad)) r.ajustes.modalidad = a.modalidad
  const f = a.factores && typeof a.factores === 'object' ? a.factores : {}
  const fs = {}
  for (const [k, v] of Object.entries(f)) if (RUTAS.has(k) && Number.isFinite(+v) && +v >= 0 && +v <= 1e6) fs[k] = +v
  if (Object.keys(fs).length) r.ajustes.factores = fs
  if (!r.resumen && !r.recomendaciones.length && !r.verificacion.length && !r.prioridades.length) throw new Error('El JSON no trae nada que la Mesa sepa mostrar (resumen, verificación, recomendaciones, prioridades…).')
  return r
}
