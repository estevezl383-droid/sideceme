// 📄 Las Órdenes Preparatorias del G-3 (F1·P7, F2·P17 y sobre todo la F6·P4 «Orden Preparatoria N° 3») con lo que
// ya trabajó el Estado Mayor: el CAP APROBADO en el «Concepto de la operación», las tareas de cada unidad fase por
// fase, las instrucciones de coordinación y la situación en SU casilla. Sin dependencias del compilado: lo usan el
// Tablero del G-3 (🌱, 🤖 y ✓ Aplicar) y las pruebas (en Node).
//
// Sergio, 26-10-2026, con la F6·P4 del CE-I (AO LAUCA) después de «Completar y mejorar»: «la Orden Preparatoria N° 3
// ya casi es la Orden de Operaciones… está muy incompleta… ¿por qué lo de la imagen 2 está vacío si ya llenamos
// todo?». La imagen 2 era «III.- EJECUCIÓN · A. Concepto de la operación (el CAP aprobado)», vacía, y el Word salía
// con «Concepto de la operación.» sin nada debajo. Pasaba porque:
//   · 🌱 no traía nada a esa casilla (sólo la OPORD tenía «La operación se ejecuta en n fase(s)…»), ni a B, C, IV y V;
//     y ponía la situación en «I.- SITUACIÓN · A. Fuerzas enemigas», una casilla que la F6·P4 NO tiene (la suya es
//     «I.- SITUACIÓN»): no se veía, no salía en el Word y el aviso de unidades la nombraba igual;
//   · el pedido a la IA no le daba el CAP aprobado (la F3·P4, la F3·P6, la decisión de la F5·P1 y las fases de la
//     carta) ni le decía que esa casilla es obligatoria: la IA metió el concepto dentro de la Intención y la dejó vacía;
//   · si la IA escribía la clave con otras palabras («A. Concepto de la operación (CAP aprobado)»), ✓ Aplicar la tiraba.
import { describirFases } from '../../cap-propios/v1/texto-carta.mjs'

export const HOJAS_PREP = ['prep1', 'prep2', 'prep3']
const TAG = /\s*\[(IA|Mesa)\s*[—–-]\s*verificar\]\s*/gi
const MARCA_CARTA = /—\s*Según (la carta|el calco)[^\n:]*:\s*/gi
const texto = (s) =>
  String(s ?? '')
    .replace(TAG, ' ')
    .replace(MARCA_CARTA, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
const plano = (s) => texto(s).replace(/\s*\n\s*/g, ' ')
const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const norm = (s) => sinTildes(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
const vacio = (x) => !texto(typeof x === 'string' ? x : '')
const punto = (s) => (s && !/[.:;!?…]$/.test(s) ? `${s}.` : s)
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const romano = (n) => ROMANOS[n - 1] || String(n)

// ─── Las casillas de cada orden ─────────────────────────────────────────────────────────────────────────────────
// Por el comienzo del rótulo (las tres órdenes los escriben un poco distinto: «II.- MISIÓN (aprobada)», «III.-
// EJECUCIÓN · Intención»…).
const PARTES = [
  ['situacion', /^I\.- SITUACI[OÓ]N(?! ·)/],
  ['enemigas', /^I\.- SITUACI[OÓ]N · A\./],
  ['propias', /^I\.- SITUACI[OÓ]N · B\./],
  ['refuerzos', /^I\.- SITUACI[OÓ]N · C\./],
  ['mision', /^II\.- MISI[OÓ]N/],
  ['intencion', /^III\.- EJECUCI[OÓ]N · Intenci[oó]n/],
  ['concepto', /^III\.- EJECUCI[OÓ]N · A\. Concepto/],
  ['maniobra', /^III\.- EJECUCI[OÓ]N · B\./],
  ['apoyo', /^III\.- EJECUCI[OÓ]N · C\./],
  ['coordinacion', /^III\.- EJECUCI[OÓ]N · D\./],
  ['servicio', /^IV\.- APOYO DE SERVICIO/],
  ['comando', /^V\.- COMANDO/],
]
const parteDe = (k) => (PARTES.find(([, re]) => re.test(String(k || ''))) || [])[0] || null
export function casillas(hoja) {
  const out = {}
  for (const c of hoja?.campos || []) {
    const p = parteDe(c)
    if (p && !out[p]) out[p] = c
  }
  return out
}

// ─── El CAP aprobado ────────────────────────────────────────────────────────────────────────────────────────────
// El que la F5·P1 marcó «RECOMENDADO AL COMANDANTE» (si está); si no, el CAP activo. El activo está donde la Mesa
// lo busca siempre (fasesCOA.propio, g3.concepto, g3.coa); el otro, en g3._caps.guardados (cap-propios/v1).
export function capAprobado(g3 = {}, fasesCOA = {}) {
  const c = g3?._caps || {}
  const activo = c.activo === 2 ? 2 : 1
  const marca = esObj(g3?.decision?._marca) ? g3.decision._marca : {}
  const rec = Object.entries(marca).find(([, v]) => /RECOMENDAD|APROBAD/i.test(String(v || '')))
  const n = rec ? Number(String(rec[0]).match(/\d+/)?.[0]) || activo : activo
  const guardado = n !== activo ? c.guardados?.[n] : null
  return {
    n,
    recomendado: !!rec,
    concepto: (guardado ? guardado.concepto : g3?.concepto) || {},
    coa: (guardado ? guardado.coa : g3?.coa) || {},
    fases: (guardado ? guardado.fases : fasesCOA?.propio) || [],
    activo,
  }
}

const de = (obj, ...claves) => {
  if (!esObj(obj)) return ''
  for (const k of claves) {
    const hit = Object.keys(obj).find((x) => norm(x).startsWith(norm(k)))
    if (hit && !vacio(obj[hit])) return texto(obj[hit])
  }
  return ''
}
const filas = (xs) => (Array.isArray(xs) ? xs.filter((f) => esObj(f) && Object.values(f).some((v) => !vacio(v))) : [])

// Las fases del CAP en palabras (las de la carta), una por renglón.
function fasesEnPalabras(fases, carta = {}) {
  let D = []
  try {
    D = describirFases(fases || [], { nomenclator: carta.nomenclator || [], catalogos: carta.catalogos || {} })
  } catch {
    D = []
  }
  return D.map((d) => {
    const qué = [
      d.tarea ? punto(d.tarea) : '',
      d.movimientos.length ? `Unidades: ${d.movimientos.join('; ')}.` : '',
      d.tareas.length ? `Tareas tácticas: ${d.tareas.join('; ')}.` : '',
      d.obstaculos.length ? `Obstáculos: ${d.obstaculos.join('; ')}.` : '',
      d.fuegos.length ? `Fuegos: ${d.fuegos.join('; ')}.` : '',
    ].filter(Boolean)
    const nom = d.nombre.replace(/^FASE\s+[IVX\d]+\s*[—–:-]?\s*/i, '')
    return `FASE ${romano(d.n)}${nom ? ` — ${nom}` : ''}${d.cuando ? ` (${d.cuando})` : ''}: ${qué.join(' ') || 'sin cambios en la carta.'}`
  })
}

// «III.- EJECUCIÓN · A. Concepto de la operación (el CAP aprobado)»: el CAP que aprobó el Comandante, con su maniobra,
// sus fases, los fuegos, los ingenieros, las medidas de control, el riesgo y el estado final.
export function conceptoDelCAP(ctx = {}, carta = {}) {
  const C = capAprobado(ctx.g3, ctx.fasesCOA)
  const k = C.concepto
  const coa = C.coa
  const nom = de(coa, 'Denominación del CAP')
  const enunciado = de(coa, 'Enunciado completo')
  const forma = de(k, 'Forma de maniobra') || de(coa, 'CÓMO')
  const ep = de(k, 'Esfuerzo principal')
  const es = de(k, 'Esfuerzos secundarios')
  const res = de(k, 'Reserva')
  const fuegos = de(k, 'Fuegos')
  const ing = de(k, 'Movilidad')
  const mc = de(k, 'Medidas de control') || de(ctx.g3?.controlOrden, 'Medidas de control gráficas')
  const riesgo = de(k, 'Riesgo aceptado')
  const fin = de(k, 'Estado final')
  const fases = fasesEnPalabras(C.fases, carta)
  const maniobra = [forma ? `Forma de maniobra: ${punto(plano(forma))}` : '', ep ? `Esfuerzo principal: ${punto(plano(ep))}` : '', es ? `Esfuerzos secundarios: ${punto(plano(es))}` : '', res ? `Reserva: ${punto(plano(res))}` : ''].filter(Boolean)
  const L = []
  const cab = `CAP ${C.n}${nom ? ` «${plano(nom).replace(/^CAP\s*\d+\s*[—–:-]?\s*/i, '')}»` : ''}, aprobado por el Comandante${C.recomendado ? ' (el recomendado en la Matriz de decisión, F5·P1)' : ''}.`
  if (!enunciado && !maniobra.length && !fases.length && !fuegos && !ing && !fin) return ''
  L.push(cab)
  if (enunciado) L.push(punto(plano(enunciado)))
  let i = 0
  const sub = (t, cuerpo) => cuerpo && L.push(`${++i}. ${t}: ${cuerpo}`)
  if (maniobra.length) L.push(`${++i}. Maniobra. ${maniobra.join(' ')}`)
  if (fases.length) L.push(`${++i}. Fases:`, ...fases.map((f) => `   ${f}`))
  sub('Apoyo de fuegos', punto(plano(fuegos)))
  sub('Movilidad, contramovilidad y supervivencia', punto(plano(ing)))
  sub('Medidas de control', punto(plano(mc)))
  sub('Riesgo aceptado', punto(plano(riesgo)))
  sub('Estado final', punto(plano(fin)))
  return L.join('\n')
}

// «B. Tareas para las UU. de maniobra»: lo que hace cada unidad propia en cada fase del CAP aprobado (la tarea y el
// propósito que tiene en la ficha de esa fase, y dónde está), en subpárrafos numerados.
export function tareasPorUnidad(ctx = {}, carta = {}) {
  const C = capAprobado(ctx.g3, ctx.fasesCOA)
  const fases = Array.isArray(C.fases) ? C.fases : []
  if (!fases.length) return { maniobra: '', apoyo: '' }
  const apoyo = (u) => /artiller|ingenier|antiaer|comunicac|apoyo|logist|sanidad|intelig|uav/i.test(`${u?.arma || ''} ${u?.tipoApoyo || ''}`)
  const por = new Map()
  fases.forEach((f, i) => {
    for (const u of f?.unidades || []) {
      if (!u || (u.tipo || 'unidad') !== 'unidad' || /^enemig/i.test(String(u.bando || '')) || u.deFaseEnemiga != null) continue
      const nom = texto(u.designacion)
      const t = plano(u.tarea)
      if (!nom || !t) continue
      if (!por.has(nom)) por.set(nom, { nom, apoyo: apoyo(u), principal: false, fases: [] })
      const x = por.get(nom)
      if (u.principal) x.principal = true
      const ant = x.fases[x.fases.length - 1]
      const linea = `${t}${plano(u.proposito) && !t.toLowerCase().includes(plano(u.proposito).toLowerCase()) ? `, ${plano(u.proposito)}` : ''}`
      if (ant && ant.linea === linea) continue
      x.fases.push({ n: i + 1, linea })
    }
  })
  const escribir = (xs) =>
    xs
      .map((x, k) => `${k + 1}. ${x.nom}${x.principal ? ' (esfuerzo principal)' : ''}: ${x.fases.map((f) => `FASE ${romano(f.n)}: ${punto(f.linea)}`).join(' ')}`)
      .join('\n')
  const todas = [...por.values()].filter((x) => x.fases.length)
  return { maniobra: escribir(todas.filter((x) => !x.apoyo)), apoyo: escribir(todas.filter((x) => x.apoyo)) }
}

// «C. Tareas para las otras UU. y de apoyo de combate»: las de apoyo en las fases y la Asignación de recursos (F4·SAL).
function tareasApoyo(ctx = {}, deFases = '') {
  const L = deFases ? [deFases] : []
  const rec = filas(ctx.g3?.recursos)
  if (rec.length) {
    const r = rec.map((f) => {
      const v = Object.values(f).map(plano)
      const [quien, aQuien, rel, desde, prio] = v
      return `${quien}${aQuien ? ` → ${aQuien}` : ''}${rel ? ` (${rel})` : ''}${desde ? `, desde ${desde}` : ''}${prio ? `, prioridad ${prio}` : ''}`
    })
    L.push(`Asignación de recursos (F4·SAL): ${r.join('; ')}.`)
  }
  return L.join('\n')
}

// «D. Instrucciones de coordinación»: lo de la Orden superior, las medidas de control, el tipo de ensayo y los
// puntos de decisión (F4·P4).
function instrucciones(ctx = {}) {
  const Z = ctx.ordenSup || {}
  const co = ctx.g3?.controlOrden || {}
  const L = []
  if (!vacio(Z.vigencia)) L.push(`Vigencia: ${punto(plano(Z.vigencia))}`)
  if (!vacio(Z.coordinacion)) L.push(punto(plano(Z.coordinacion)))
  const mc = [de(co, 'Medidas de control gráficas'), de(co, 'Medidas de coordinación de apoyo'), de(co, 'Medidas de control de obstáculos')].filter(Boolean)
  if (mc.length) L.push(`Medidas de control: ${mc.map(plano).map(punto).join(' ')}`)
  const pd = filas(ctx.g3?.eventos)
    .map((f) => {
      const v = Object.values(f).map(plano)
      return v[0] && v[1] ? `P.D. ${v[0].replace(/^P\.?D\.?\s*/i, '')}: ${v[1]}${v[4] ? ` (se decide cuando ${v[4].replace(/^cuando\s+/i, '')})` : ''}${v[5] ? ` → ${v[5]}` : ''}` : ''
    })
    .filter(Boolean)
  if (pd.length) L.push(`Puntos de decisión (F4·P4): ${pd.join('; ')}.`)
  const ens = [de(co, 'Tipo de ensayo'), de(co, 'Quiénes participan')].filter(Boolean)
  if (ens.length) L.push(`Ensayo: ${ens.map(plano).map(punto).join(' ')}`)
  const tipo = de(co, 'Tipo de orden')
  if (tipo) L.push(`Tipo de orden: ${punto(plano(tipo))}`)
  return L.join('\n')
}

// ─── 🌱 Traer del calco ─────────────────────────────────────────────────────────────────────────────────────────
// `base`: lo que ya traía la Mesa (l3e del compilado). Devuelve SÓLO casillas de la hoja: lo que venía con un rótulo
// que la hoja no tiene (la situación en tres casillas, en una orden que tiene una) va a la casilla que sí tiene.
export function semillaPrep(hoja, base = {}, ctx = {}, carta = {}) {
  try {
    if (!HOJAS_PREP.includes(hoja?.id) || hoja?.tipo !== 'campos') return base
    const K = casillas(hoja)
    const out = ordenarHoja(hoja, esObj(base) ? base : {}).valor
    const pon = (parte, t) => {
      const k = K[parte]
      if (k && t && vacio(out[k])) out[k] = t
    }
    const Z = ctx.ordenSup || {}
    if (hoja.id !== 'prep1') {
      const T = tareasPorUnidad(ctx, carta)
      pon('concepto', conceptoDelCAP(ctx, carta))
      pon('maniobra', T.maniobra)
      pon('apoyo', tareasApoyo(ctx, T.apoyo))
      pon('coordinacion', instrucciones(ctx))
    }
    if (!vacio(Z.servicio)) pon('servicio', texto(Z.servicio))
    const cc = [Z.comando ? `Comando: ${punto(plano(Z.comando))}` : '', Z.comunicaciones ? `Comunicaciones: ${punto(plano(Z.comunicaciones))}` : '', !Z.comando && Z.puestoMando ? `Puesto de Mando: ${punto(plano(Z.puestoMando))}` : ''].filter(Boolean)
    pon('comando', cc.join('\n'))
    return out
  } catch {
    return base
  }
}

// Lo que quedó guardado con un rótulo que la hoja NO tiene pasa a la casilla que sí (si está vacía) y se borra:
// { «I.- SITUACIÓN · A. Fuerzas enemigas»: … } en la F6·P4 → «I.- SITUACIÓN» con «A. Fuerzas enemigas: …».
const SIT = { enemigas: 'A. Fuerzas enemigas', propias: 'B. Fuerzas propias', refuerzos: 'C. Refuerzos y reducciones' }
export function ordenarHoja(hoja, valor) {
  if (!esObj(valor) || hoja?.tipo !== 'campos' || !Array.isArray(hoja.campos)) return { valor, n: 0 }
  const tiene = new Set(hoja.campos)
  const K = casillas(hoja)
  const v = { ...valor }
  const sit = []
  let n = 0
  for (const [k, x] of Object.entries(valor)) {
    if (tiene.has(k) || k.startsWith('_') || typeof x !== 'string') continue
    const p = parteDe(k)
    if (SIT[p] && K.situacion) {
      if (!vacio(x)) sit.push(`${SIT[p]}: ${texto(x)}`)
    } else if (p && K[p]) {
      if (vacio(v[K[p]]) && !vacio(x)) v[K[p]] = x
    } else continue
    delete v[k]
    n++
  }
  if (sit.length && vacio(v[K.situacion])) v[K.situacion] = sit.join('\n')
  return { valor: v, n }
}

// ─── ✓ Aplicar ──────────────────────────────────────────────────────────────────────────────────────────────────
// Lo que la IA dejó vacío (o no mandó) se llena con lo de la Mesa: el «Concepto de la operación» nunca queda en
// blanco si el G-3 ya tiene el CAP. Devuelve { valor, n, cuales }.
export function trasIA(hoja, valor, semilla) {
  try {
    if (!HOJAS_PREP.includes(hoja?.id)) return { valor, n: 0, cuales: [] }
    const o = ordenarHoja(hoja, valor)
    const v = { ...(o.valor || {}) }
    const S = typeof semilla === 'function' ? semilla() : semilla
    const cuales = []
    for (const k of hoja.campos || []) {
      if (!vacio(v[k]) || !esObj(S) || vacio(S[k])) continue
      v[k] = S[k]
      cuales.push(k)
    }
    return { valor: v, n: cuales.length, cuales }
  } catch {
    return { valor, n: 0, cuales: [] }
  }
}
// Lo que se suma al mensaje de ✓ Aplicar (con un espacio adelante) o ''.
export function avisoTrasIA(r) {
  if (!r?.n) return ''
  const nom = r.cuales.map((k) => `«${k.replace(/^[IVX]+\.-\s*/, '')}»`).join(', ')
  return ` La IA dejó vacío ${r.n === 1 ? 'un apartado' : `${r.n} apartados`} (${nom}): ${r.n === 1 ? 'se llenó' : 'se llenaron'} con lo que ya tiene el G-3 (el CAP aprobado, la F3·P4, la F3·P6 y las fases de la carta).`
}

// La clave que la IA escribió con otras palabras («III.- EJECUCIÓN · A. Concepto de la operación (CAP aprobado)»,
// «A. Concepto de la operación», «Concepto de la operación»): la casilla de la hoja con ese mismo comienzo. Sólo
// si hay UNA que corresponde. Va después de la búsqueda de siempre (claveCasilla de estado-mayor).
export function claveParecida(k, claves = []) {
  try {
    const sinPar = (s) => norm(String(s ?? '').replace(/\([^)]*\)/g, ' '))
    const n = sinPar(k)
    if (!n) return undefined
    const cs = claves.filter((x) => {
      const c = sinPar(x.k)
      return c === n || c.endsWith(` ${n}`) || n.endsWith(` ${c}`)
    })
    if (cs.length === 1) return cs[0].k
    const p = parteDe(String(k).replace(/^\s+/, ''))
    const ps = p ? claves.filter((x) => parteDe(x.k) === p) : []
    return ps.length === 1 ? ps[0].k : undefined
  } catch {
    return undefined
  }
}

// ─── 🤖 El pedido de la IA ──────────────────────────────────────────────────────────────────────────────────────
// Va justo antes de «# CÓMO CONTESTAR» (lo último, donde más pesa); si no está, al final.
function insertar(prompt, bloque) {
  const marca = '\n\n---\n\n# CÓMO CONTESTAR'
  const i = prompt.lastIndexOf(marca)
  return i >= 0 ? `${prompt.slice(0, i)}\n\n---\n\n${bloque}${prompt.slice(i)}` : `${prompt}\n\n---\n\n${bloque}`
}
const hojaEnTexto = (obj) =>
  esObj(obj)
    ? Object.entries(obj)
        .filter(([k, v]) => !k.startsWith('_') && typeof v === 'string' && !vacio(v))
        .map(([k, v]) => `- ${k}: ${plano(v)}`)
        .join('\n')
    : ''
const filasEnTexto = (xs) => filas(xs).map((f) => `- ${Object.entries(f).filter(([, v]) => !vacio(v)).map(([k, v]) => `${k}: ${plano(v)}`).join(' · ')}`).join('\n')

export function bloquePrep(hoja, ctx = {}, carta = {}) {
  const K = casillas(hoja)
  const C = capAprobado(ctx.g3, ctx.fasesCOA)
  const g3 = ctx.g3 || {}
  const conc = K.concepto || 'III.- EJECUCIÓN · A. Concepto de la operación'
  const esTres = hoja?.id === 'prep3'
  const partes = [
    `# ${esTres ? 'LA ORDEN PREPARATORIA N° 3 ES CASI LA ORDEN DE OPERACIONES' : 'LA ORDEN PREPARATORIA CON LO QUE YA TRABAJÓ EL ESTADO MAYOR'} — DESARROLLÁ CADA APARTADO COMPLETO`,
    '',
    esTres
      ? `Va con el CAP APROBADO (el CAP ${C.n}${C.recomendado ? ', el recomendado en la Matriz de decisión' : ''}): acá ya no hay opciones. Contiene las instrucciones FINALES para que las unidades completen su planeamiento y alisten la ejecución, así que cada apartado tiene que estar escrito COMPLETO, como en la Orden General de Operaciones (no un resumen).`
      : 'Lo que ya trabajó el G-3 (abajo) es la base: no lo contradigas.',
    `- «${conc}» es OBLIGATORIO y es el apartado más largo. Escribí el CAP aprobado: la maniobra (forma, esfuerzo principal, esfuerzos secundarios, reserva y cuándo se empeña), FASE POR FASE (qué hace cada unidad, dónde y cuándo), el apoyo de fuegos, la movilidad / contramovilidad / supervivencia (el plan de barreras), las medidas de control, el riesgo aceptado y el estado final. NO lo dejes vacío y NO lo metas dentro de la Intención.`,
    K.intencion ? `- «${K.intencion}»: SÓLO el propósito, el punto decisivo (si lo hay), las tareas clave y el estado final, corto. La maniobra va en el Concepto.` : '',
    K.maniobra ? `- «${K.maniobra}»: un subpárrafo numerado por cada unidad de maniobra (1. DIV…, 2. …) con TODAS sus tareas, fase por fase, y su propósito.` : '',
    K.apoyo ? `- «${K.apoyo}»: un subpárrafo numerado por cada unidad de apoyo de combate (artillería, ingenieros, antiaérea, comunicaciones, exploración) con sus tareas, su relación de apoyo y desde cuándo.` : '',
    K.coordinacion ? `- «${K.coordinacion}»: día D y hora H, vigencia, medidas de control, puntos de decisión, RCIC/EEIA, reducción de riesgos, reglas de enfrentamiento, ensayos y horarios.` : '',
    K.situacion ? `- «${K.situacion}»: los tres subpárrafos en esta casilla: «A. Fuerzas enemigas» (con el CAE más probable y el más peligroso del G-2), «B. Fuerzas propias» y «C. Refuerzos y reducciones».` : '',
    '- Usá las claves EXACTAS de la hoja (copialas tal cual, con su numeración y lo que va entre paréntesis). Ninguna casilla queda vacía: si de verdad falta un dato, escribí lo que sí hay y marcá sólo ese dato «SIN DATO — verificar».',
  ].filter(Boolean)
  const datos = []
  const k = hojaEnTexto(C.concepto)
  const coa = hojaEnTexto(C.coa)
  if (coa) datos.push(`## F3·P6 — Curso de acción propio (CAP ${C.n})\n${coa}`)
  if (k) datos.push(`## F3·P4 — Concepto amplio de la operación (CAP ${C.n})\n${k}`)
  const fases = fasesEnPalabras(C.fases, carta)
  if (fases.length) datos.push(`## Las fases 🔵 del CAP ${C.n} en la carta\n${fases.map((f) => `- ${f}`).join('\n')}`)
  const T = tareasPorUnidad(ctx, carta)
  if (T.maniobra || T.apoyo) datos.push(`## Lo que hace cada unidad en cada fase (fichas de la carta)\n${[T.maniobra, T.apoyo].filter(Boolean).join('\n')}`)
  const dec = esObj(g3.decision) ? hojaEnTexto(Object.fromEntries(Object.entries(g3.decision).filter(([kk]) => kk.includes('|')))) : ''
  if (dec) datos.push(`## F5·P1 — Matriz de decisión${C.recomendado ? ` (RECOMENDADO AL COMANDANTE: CAP-${C.n})` : ''}\n${dec}`)
  const org = filasEnTexto(g3.orgTarea)
  if (org) datos.push(`## F4·P2 — Organización de la tarea\n${org}`)
  const ev = filasEnTexto(g3.eventos)
  if (ev) datos.push(`## F4·P4 — Eventos críticos y puntos de decisión\n${ev}`)
  const rec = filasEnTexto(g3.recursos)
  if (rec) datos.push(`## F4·SAL — Asignación de recursos\n${rec}`)
  const co = hojaEnTexto(g3.controlOrden)
  if (co) datos.push(`## F6·SAL — Medidas de control, tipo de orden y tipo de ensayo\n${co}`)
  return `${partes.join('\n')}${datos.length ? `\n\n# LO QUE YA TRABAJÓ EL G-3 PARA ESTA ORDEN (usalo: es el CAP aprobado)\n\n${datos.join('\n\n')}` : ''}`
}

export function pedidoPrep(r, hoja, ctx = {}, carta = {}) {
  if (r && typeof r.then === 'function') return r.then((x) => pedidoPrep(x, hoja, ctx, carta))
  try {
    if (!HOJAS_PREP.includes(hoja?.id) || !r?.ok || typeof r.prompt !== 'string') return r
    const c = typeof carta === 'function' ? carta() : carta
    return { ...r, prompt: insertar(r.prompt, bloquePrep(hoja, ctx, c || {})) }
  } catch {
    return r
  }
}
