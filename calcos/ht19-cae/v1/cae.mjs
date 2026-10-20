// 🗡️ H.T. 19 — Desarrollo del curso de acción enemigo: TODOS los elementos, FASE POR FASE (20-10-2026).
//
// Lo pidió Sergio con la H.T. 19 bajada en Word: la Brigada enemiga tiene 13 elementos en la
// plantilla (PEL. REC. BLIN., BAT. INF. BLIN. «CARAMPAGUÉ», CÍA. MORT. 120, G.A.AP. «SALVO»,
// CÍA. A/B (SPIKE), PC BAT., BAT. AA., G. BLIN. 9 «VENCEDORES» (OD), CÍA. ING. MEC., BAT. LAR-160,
// PC 1RA. BRIG., CÍA. TELECOM., CÍA. LOG.) y la hoja sólo traía OC-1…OC-3, OD, ART., MORT. y AAC.
// sin nombre: la IA llenó dos renglones, el resto quedó en blanco, y lo que escribió era largo.
// «Debería ser la explicación para cada fase: en la FASE I cada unidad con su TAREA y su PROPÓSITO
// (la artillería y otras con su formato), después la FASE II, la misma estructura con otro
// contenido… Respuestas más cortas y precisas: TAREA Y PROPÓSITO.»
//
// Qué hace este módulo:
//   · elementosCAE: reparte las fichas enemigas del calco en los sistemas operativos de la hoja —
//     MANIOBRA (SEG., OC-n, OD, RES.), APOYO DE FUEGOS (ART., MORT., AAC.), INGENIERÍA, ADA.,
//     APOYO DE SERVICIOS y C4— y deja en la hoja `_items` (qué renglones hay) y `_nom` (qué unidad
//     es cada uno). Las claves de las casillas siguen siendo «MANIOBRA|OC-1|FASE I|Tarea»: lo que ya
//     estaba escrito en OC-1, OD, ART., MORT. o AAC. no se pierde.
//   · htmlCAE / docxCAE: la hoja se imprime FASE POR FASE; en cada fase, un cuadro por sistema
//     operativo con un renglón por elemento y una columna por campo (Tarea | Propósito, o el formato
//     propio de fuegos, ingeniería, ADA, servicios y C4).
//   · extraCAE: las reglas de la IA para esta hoja — una oración corta por casilla, tarea con verbo
//     táctico, propósito con «para…», distinto en cada fase y coherente con el calco.

const norm = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
const limpio = (t) => String(t ?? '').replace(/\s+/g, ' ').trim()
const esEnemigo = (u) => u && (u.bando === 'enemigo' || u.bando === 'enemigas')

const ESCALONES = ['equipo', 'escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito']

// A qué sistema operativo va cada ficha. El rol de la plantilla manda; si no hay, la designación.
export function funcionDe(u) {
  const d = norm(u?.designacion || u?.nom || u?.nombre)
  const rol = u?.rol || ''
  if (u?.tipo === 'pc' || rol === 'pc' || /^P\.? ?C\.?\b|PUESTO DE (MANDO|COMANDO)/.test(d)) return { grupo: 'C4' }
  if (/TELECOM|COMUNICAC|\bTRANSM|\bCOM\.|\bSEC\.? ?COM\b/.test(d)) return { grupo: 'C4' }
  if (/\bLOG\b|\bLOG\.|LOGIST|SANID|\bSAN\.|ABAST|MANTEN|INTEND|\bTREN\b/.test(d)) return { grupo: 'APOYO DE SERVICIOS' }
  if (/\bING\b|\bING\.|INGENIER|ZAPAD/.test(d)) return { grupo: 'INGENIERÍA' }
  if (/\bA\. ?A\.|\bAA\b|ANTIAER|GEPARD|MISTRAL|\bADA\b|\bD\.? ?A\.? ?A\./.test(d)) return { grupo: 'ADA.' }
  if (/MORT/.test(d)) return { grupo: 'APOYO DE FUEGOS', base: 'MORT.' }
  if (rol === 'artilleria' || /\bG\. ?A\.|ARTILL|\bART\.|\bLAR\b|LAR-|OBUS|LANZACOH|COHETE|\bGAD\b|M109/.test(d))
    return { grupo: 'APOYO DE FUEGOS', base: 'ART.' }
  if (/AVIAC|\bAV\. ?EJ|F-?16|HELIC|\bAAC\b|AEREO/.test(d)) return { grupo: 'APOYO DE FUEGOS', base: 'AAC.' }
  if (/\(OD\)/.test(d)) return { grupo: 'MANIOBRA', base: 'OD' }
  if (rol === 'reconocimiento' || rol === 'seguridad' || /\bREC\.|RECON|EXPLOR|\bSEG\.|SEGURIDAD|VANGUARD/.test(d))
    return { grupo: 'MANIOBRA', base: 'SEG.' }
  if (rol === 'reserva' || /RESERVA/.test(d)) return { grupo: 'MANIOBRA', base: 'RES.' }
  return { grupo: 'MANIOBRA', base: 'OC' }
}

// Las fichas enemigas del calco, sin repetir (CÍA. MORT. 120 y PC BAT. van una vez por unidad de
// primer escalón), con el rol que tienen en el curso de acción más probable.
export function fichasEnemigas(ctx = {}) {
  const fases = (ctx.fasesCOA?.enemigo || []).filter(Boolean)
  const probable = fases.find((f) => f.coa === 'probable') || fases.find((f) => !f.coa) || fases[0]
  const deFase = (Array.isArray(probable?.unidades) ? probable.unidades : []).filter(esEnemigo)
  const rol = new Map(deFase.filter((u) => u.rol).map((u) => [norm(u.designacion), u]))
  const enCalco = (ctx.unidades || []).filter((u) => esEnemigo(u) && ['unidad', 'pc', undefined, null, ''].includes(u.tipo))
  const base = enCalco.length ? enCalco : deFase
  const vistas = new Set()
  const out = []
  for (const u of base) {
    const d = limpio(u.designacion)
    if (!d || vistas.has(norm(d))) continue
    vistas.add(norm(d))
    const r = rol.get(norm(d))
    out.push({ ...u, designacion: d, rol: u.rol || r?.rol, principal: u.principal ?? r?.principal })
  }
  return out
}

// Qué renglones lleva la hoja y quién es cada uno. null si no hay fichas enemigas.
export function elementosCAE(ctx = {}) {
  const fichas = fichasEnemigas(ctx)
  if (!fichas.length) return null
  const grupos = { MANIOBRA: [], 'APOYO DE FUEGOS': [], 'INGENIERÍA': [], 'ADA.': [], 'APOYO DE SERVICIOS': [], C4: [] }
  for (const u of fichas) {
    const f = funcionDe(u)
    grupos[f.grupo].push({ u, base: f.base })
  }
  const _items = {}
  const _nom = {}
  // MANIOBRA: SEG. → OC-1… (1er escalón primero, después el de mayor escalón) → OD → RES.
  const orden = { e1: 0, flanqueo: 1, e2: 2, reserva: 3 }
  const ocs = grupos.MANIOBRA.filter((x) => x.base === 'OC')
    .map((x, i) => ({ ...x, i }))
    .sort((a, b) => (orden[a.u.rol] ?? 1) - (orden[b.u.rol] ?? 1) || ESCALONES.indexOf(b.u.escalon) - ESCALONES.indexOf(a.u.escalon) || a.i - b.i)
  const man = []
  const poner = (grupo, lista, cod, u) => {
    lista.push(cod)
    if (u) _nom[`${grupo}|${cod}`] = u.designacion
  }
  // «OC-1, OC-2…»; los demás conservan su código el primero («ART.», «ART.-2») para no perder lo escrito.
  const numerar = (grupo, lista, pref, xs, solo) =>
    xs.forEach((x, i) => poner(grupo, lista, solo ? (i === 0 ? pref : `${pref}-${i + 1}`) : `${pref}${i + 1}`, x.u))
  numerar('MANIOBRA', man, 'SEG.', grupos.MANIOBRA.filter((x) => x.base === 'SEG.'), true)
  numerar('MANIOBRA', man, 'OC-', ocs, false)
  const od = grupos.MANIOBRA.filter((x) => x.base === 'OD')
  if (od.length) numerar('MANIOBRA', man, 'OD', od, true)
  else man.push('OD') // la OD va siempre: si no está marcada en el calco, la escribe el G-2
  numerar('MANIOBRA', man, 'RES.', grupos.MANIOBRA.filter((x) => x.base === 'RES.'), true)
  if (!ocs.length) man.splice(man.indexOf('OD'), 0, 'OC-1')
  _items.MANIOBRA = man
  // APOYO DE FUEGOS: siempre ART., MORT. y AAC. (el apoyo aéreo cercano no es una ficha); uno por unidad.
  const fue = []
  for (const pref of ['ART.', 'MORT.', 'AAC.']) {
    const xs = grupos['APOYO DE FUEGOS'].filter((x) => x.base === pref)
    if (xs.length) numerar('APOYO DE FUEGOS', fue, pref, xs, true)
    else fue.push(pref)
  }
  _items['APOYO DE FUEGOS'] = fue
  // Los de un solo renglón («—»): la unidad que lo ejecuta va en el rótulo.
  for (const g of ['INGENIERÍA', 'ADA.', 'APOYO DE SERVICIOS', 'C4'])
    if (grupos[g].length) _nom[`${g}|—`] = grupos[g].map((x) => x.u.designacion).join(' · ')
  return { _items, _nom }
}

// Los sistemas operativos de la hoja con los renglones de ESTE ejercicio.
export function socbCAE(t, v) {
  const it = v && typeof v === 'object' ? v._items || {} : {}
  return (t?.socb || []).map((g) => (Array.isArray(it[g.nom]) && it[g.nom].length ? { ...g, items: it[g.nom] } : g))
}

// La unidad de un renglón: la que escribió el G-2 («MANIOBRA|OC-1|Unidad») o la del calco.
export function nomCAE(grupo, item, v = {}) {
  const h = v || {}
  const escrita = item && item !== '—' ? limpio(h[`MANIOBRA|${item}|Unidad`]) : ''
  if (escrita && grupo === 'MANIOBRA') return escrita
  return limpio((h._nom || {})[`${grupo}|${item}`])
}

// El rótulo del renglón: «OC-1 · BAT. INF. BLIN. «CARAMPAGUÉ»», «ADA. · BAT. AA.», «AAC.».
export function etiquetaCAE(grupo, item, v) {
  const n = nomCAE(grupo, item, v)
  if (item === '—') return n ? `${grupo} · ${n}` : grupo
  return n ? `${item} · ${n}` : item
}

const fasesDe = (t, v) => (v?._fases?.length ? v._fases : t?.fases || [])

// La hoja preparada para la IA y para aplicar su respuesta: si todavía no tiene sus renglones, se
// los pone con las fichas del calco (sin tocar nada de lo escrito).
export function prepCAE(t, hoja, ctx) {
  if (t?.tipo !== 'cae') return hoja
  if (hoja && hoja._items && Object.keys(hoja._items).length) return hoja
  const e = elementosCAE(ctx || {})
  if (!e) return hoja
  const h = hoja && typeof hoja === 'object' ? hoja : {}
  return { ...h, _items: e._items, _nom: { ...e._nom, ...(h._nom || {}) } }
}

// ───────────────────────── Impresión: FASE POR FASE ─────────────────────────

// Vista previa y Word (.doc HTML). `wa` escapa el texto; `celda` arma el contenido de una casilla.
export function htmlCAE(t, a = {}, { wa, celda }) {
  const v = a || {}
  const fila = (k) => `<tr><td class="rot">${wa(k)}</td><td>${celda(v[k])}</td></tr>`
  const cab = `<table>${(t.cabecera || []).map(fila).join('')}</table>`
  const fases = fasesDe(t, v)
  const cuerpo = fases
    .map((fase) => {
      const cuadros = socbCAE(t, v)
        .map(
          (g) => `<p style="margin:8px 0 2px;font-weight:bold">${wa(g.nom)}</p><table>
        <tr><th>Elemento</th>${g.campos.map((c) => `<th>${wa(c)}</th>`).join('')}</tr>
        ${g.items
          .map((it) => `<tr><td class="rot">${wa(etiquetaCAE(g.nom, it, v))}</td>${g.campos.map((c) => `<td>${celda(v[`${g.nom}|${it}|${fase}|${c}`])}</td>`).join('')}</tr>`)
          .join('')}</table>`,
        )
        .join('')
      return `<h3>${wa(fase)}</h3>${cuadros}`
    })
    .join('')
  const cierre = `<table>${(t.cierre || []).map(fila).join('')}</table>`
  return cab + cuerpo + '<h3>Cierre</h3>' + cierre
}

// Word (.docx): secciones { titulo, tabla } — una por sistema operativo en cada fase.
export function docxCAE(t, e, { Ac, ZS }) {
  const v = e || {}
  const fases = fasesDe(t, v)
  const out = []
  let hay = false
  const tablaPares = (claves) => {
    const filas = claves.map((k) => [{ t: k.toUpperCase(), bold: true }, Ac(v[k])])
    if (filas.some((f) => ZS(f.slice(1)))) hay = true
    return { titulo: '', sinRotulo: true, tabla: { cabecera: [], filas, anchos: [3, 8] } }
  }
  out.push(tablaPares(t.cabecera || []))
  fases.forEach((fase) => {
    socbCAE(t, v).forEach((g, gi) => {
      const filas = g.items.map((it) => [{ t: etiquetaCAE(g.nom, it, v), bold: true }, ...g.campos.map((c) => Ac(v[`${g.nom}|${it}|${fase}|${c}`]))])
      if (filas.some((f) => ZS(f.slice(1)))) hay = true
      out.push({
        titulo: gi === 0 ? `${String(fase).toUpperCase()} — ${g.nom}` : g.nom,
        sinRotulo: true,
        tabla: { cabecera: [{ t: 'ELEMENTO' }, ...g.campos.map((c) => ({ t: c.toUpperCase() }))], filas, anchos: [3, ...g.campos.map(() => (g.campos.length > 2 ? 3 : 4))] },
      })
    })
  })
  out.push(tablaPares(t.cierre || []))
  return hay ? out : null
}

// ───────────────────────── IA: corto, tarea y propósito ─────────────────────────

// Qué se hace en cada fase del ataque (RC-02-107 / RDO-20001), para que cada fase diga otra cosa.
const QUE_FASE = [
  [/RAMIFIC|FASE I\b(?!I)/, 'deja los caminos de marcha y se despliega por columnas hacia sus zonas; el reconocimiento va adelante.'],
  [/APRESTO|FASE II\b(?!I)/, 'ocupa zonas de apresto y posiciones de ataque; los fuegos de preparación empiezan; la OD se mantiene atrás, a cubierto.'],
  [/ATAQUE|ASALTO|IRRUP|PENETR|FASE III\b/, 'aproximación, asalto, irrupción y penetración: los OC fijan y abren la brecha con el apoyo de fuegos.'],
  [/RUPTURA|EXPLOT|CONSOLID|FASE IV\b/, 'la OD pasa por la brecha y explota hacia el objetivo; los OC consolidan y aseguran los flancos.'],
]
const queFase = (f) => (QUE_FASE.find(([re]) => re.test(norm(f))) || [null, ''])[1]

export const REGLAS_CAE = `ESTA HOJA SE ESCRIBE CORTO — MANDA SOBRE «CÓMO SE ESCRIBE UNA HOJA DE TRABAJO»:
- UNA SOLA ORACIÓN por casilla, de 8 a 18 palabras. Nada de párrafos ni de explicaciones.
- TAREA = QUÉ HACE: verbo táctico en infinitivo + sobre qué + dónde (nombre del calco).
  Verbos: reconocer, fijar, atacar, abrir brecha, irrumpir, penetrar, destruir, neutralizar,
  suprimir, bloquear, ocupar, mantener, seguir y apoyar, apoyar por el fuego, explotar, proteger.
  Ej.: «Fijar a la defensa del CE-I en el AE AVAROA.»
- PROPÓSITO = PARA QUÉ: empieza con «Para» y dice el efecto que habilita a otro elemento o a la
  operación. Ej.: «Para abrir el paso a la OD hacia VIACHA.»
- FUEGOS: TAREA (qué bate), PROPÓSITO (para qué), MÉTODO (tipo de fuego, desde dónde y cuándo:
  preparación, apoyo cercano, contrabatería, interdicción), EFECTO (destruir / neutralizar /
  suprimir + qué). AAC. es el apoyo aéreo cercano.
- INTELIGENCIA, INGENIERÍA, ADA., SERVICIOS y C4: el dato concreto de cada campo en una línea.
- CADA FASE DICE OTRA COSA: el mismo elemento cambia de tarea de una fase a la otra. Prohibido
  copiar la misma frase en dos fases.
- COHERENCIA: en cada fase, el propósito de los apoyos (fuegos, ingeniería, ADA.) apunta a la
  tarea de los OC o de la OD de ESA fase.
- TODOS LOS ELEMENTOS, TODAS LAS FASES: no dejes ninguna casilla vacía. Si un elemento no actúa
  en una fase, decí qué hace igual («Seguir a retaguardia del OC-1 en columna», «Mantenerse en
  la zona de apresto»).
- Lo que escribís es lo que hace el ENEMIGO, con los nombres de sus unidades y del terreno del
  calco (líneas, objetivos, terreno clave, A.I.N.). No inventes unidades.`

export function extraCAE(t, hoja, claves, T) {
  if (t?.tipo !== 'cae') return T
  const v = hoja || {}
  const fases = fasesDe(t, v)
  const els = socbCAE(t, v)
    .map((g) => `  ${g.nom}: ${g.items.map((it) => etiquetaCAE(g.nom, it, v)).join(' | ')}  →  ${g.campos.join(' / ')}`)
    .join('\n')
  const fs = fases.map((f, i) => `  ${f}${queFase(f) ? ` — ${queFase(f)}` : ''}`).join('\n')
  const extra = `${REGLAS_CAE}

LOS ELEMENTOS DE LA HOJA (cada uno con su tarea y propósito en cada fase):
${els}

LAS FASES, EN ORDEN:
${fs}

Escribí fase por fase: primero TODA la ${fases[0] || 'FASE I'}, elemento por elemento; después la siguiente.`
  return { ...T, extra: T.extra ? `${T.extra}\n\n${extra}` : extra }
}
