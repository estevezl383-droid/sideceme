// 🗡️ H.T. 19 fase por fase con TODOS los elementos (calcos/ht19-cae/v1/cae.mjs).
// El caso de Sergio: la Brigada enemiga de 13 elementos; la hoja sólo traía OC-1…OC-3, OD, ART., MORT. y AAC.
//   node ht19-fases.mjs
import assert from 'node:assert/strict'
import { funcionDe, elementosCAE, socbCAE, etiquetaCAE, prepCAE, htmlCAE, docxCAE, extraCAE } from '../ht19-cae/v1/cae.mjs'

let n = 0
const caso = (nombre, fn) => { fn(); n++; console.log('  ✔ ' + nombre) }

const E = (designacion, escalon, tipo = 'unidad') => ({ designacion, escalon, tipo, bando: 'enemigo' })
const BRIGADA = [
  E('PEL. REC. BLIN.', 'seccion'), E('BAT. INF. BLIN. «CARAMPAGUÉ»', 'batallon'), E('CÍA. MORT. 120', 'compania'),
  E('G.A.AP. «SALVO»', 'batallon'), E('CÍA. A/B (SPIKE)', 'compania'), E('PC BAT.', 'batallon', 'pc'), E('BAT. AA.', 'compania'),
  E('G. BLIN. 9 «VENCEDORES» (OD)', 'batallon'), E('CÍA. ING. MEC. «ACONCAGUA»', 'compania'), E('BAT. LAR-160', 'compania'),
  E('PC 1RA. BRIG.', 'brigada', 'pc'), E('CÍA. TELECOM.', 'compania'), E('CÍA. LOG.', 'compania'),
]
// La definición de la hoja, como está en el compilado.
const HT19 = {
  id: 'ht19', tipo: 'cae', cabecera: ['Quién', 'Qué', 'Cuándo', 'Dónde', 'Con qué fuerza'],
  socb: [
    { nom: 'MANIOBRA', items: ['OC-1', 'OC-2', 'OC-3', 'OD'], campos: ['Tarea', 'Propósito'] },
    { nom: 'APOYO DE FUEGOS', items: ['ART.', 'MORT.', 'AAC.'], campos: ['Tarea', 'Propósito', 'Método', 'Efecto'] },
    { nom: 'INTELIGENCIA', items: ['—'], campos: ['E.I.', 'A.I.N.', 'Recursos'] },
    { nom: 'INGENIERÍA', items: ['—'], campos: ['Prioridad', 'P. esfuerzo', 'P. trabajo'] },
    { nom: 'ADA.', items: ['—'], campos: ['Tarea', 'Propósito', 'P. apoyo'] },
    { nom: 'APOYO DE SERVICIOS', items: ['—'], campos: ['E.A.L.', 'P.A.L.'] },
    { nom: 'C4', items: ['—'], campos: ['PCP', 'PCA', 'MCC', 'PD'] },
  ],
  fases: ['FASE I', 'FASE II', 'FASE III', 'FASE IV'], cierre: ['Objetivo inicial', 'Objetivos subsiguientes', 'Estado final deseado'],
}

caso('Cada uno de los 13 elementos cae en su sistema operativo', () => {
  const g = Object.fromEntries(BRIGADA.map((u) => [u.designacion, `${funcionDe(u).grupo}${funcionDe(u).base ? ' ' + funcionDe(u).base : ''}`]))
  assert.deepEqual(g, {
    'PEL. REC. BLIN.': 'MANIOBRA SEG.', 'BAT. INF. BLIN. «CARAMPAGUÉ»': 'MANIOBRA OC', 'CÍA. MORT. 120': 'APOYO DE FUEGOS MORT.',
    'G.A.AP. «SALVO»': 'APOYO DE FUEGOS ART.', 'CÍA. A/B (SPIKE)': 'MANIOBRA OC', 'PC BAT.': 'C4', 'BAT. AA.': 'ADA.',
    'G. BLIN. 9 «VENCEDORES» (OD)': 'MANIOBRA OD', 'CÍA. ING. MEC. «ACONCAGUA»': 'INGENIERÍA', 'BAT. LAR-160': 'APOYO DE FUEGOS ART.',
    'PC 1RA. BRIG.': 'C4', 'CÍA. TELECOM.': 'C4', 'CÍA. LOG.': 'APOYO DE SERVICIOS',
  })
})

caso('Sin fichas enemigas no propone renglones (la hoja queda con los de siempre)', () => {
  assert.equal(elementosCAE({ unidades: [{ designacion: 'RI-1', bando: 'propias' }] }), null)
  assert.deepEqual(socbCAE(HT19, {}).map((g) => g.items), HT19.socb.map((g) => g.items))
})

const e = elementosCAE({ unidades: BRIGADA })
const hoja = prepCAE(HT19, { 'MANIOBRA|OC-1|FASE I|Tarea': 'Escrito por el G-2' }, { unidades: BRIGADA })

caso('prepCAE agrega los renglones sin tocar lo escrito, y no pisa los que ya tiene', () => {
  assert.equal(hoja['MANIOBRA|OC-1|FASE I|Tarea'], 'Escrito por el G-2')
  assert.deepEqual(hoja._items, e._items)
  const propia = { _items: { MANIOBRA: ['OC-1'] } }
  assert.equal(prepCAE(HT19, propia, { unidades: BRIGADA }), propia)
  assert.equal(prepCAE({ tipo: 'campos' }, propia, { unidades: BRIGADA }), propia)
})

caso('Rótulos: código y unidad; la unidad escrita por el G-2 manda', () => {
  assert.equal(etiquetaCAE('MANIOBRA', 'OC-2', hoja), 'OC-2 · CÍA. A/B (SPIKE)')
  assert.equal(etiquetaCAE('APOYO DE FUEGOS', 'AAC.', hoja), 'AAC.')
  assert.equal(etiquetaCAE('ADA.', '—', hoja), 'ADA. · BAT. AA.')
  assert.equal(etiquetaCAE('INTELIGENCIA', '—', hoja), 'INTELIGENCIA')
  assert.equal(etiquetaCAE('MANIOBRA', 'OC-1', { ...hoja, 'MANIOBRA|OC-1|Unidad': 'FT IBARRA' }), 'OC-1 · FT IBARRA')
})

caso('Vista previa / Word .doc: FASE I con un cuadro por sistema operativo, después FASE II', () => {
  const html = htmlCAE(HT19, hoja, { wa: (s) => String(s), celda: (v) => v || '—' })
  const i1 = html.indexOf('<h3>FASE I</h3>'), i2 = html.indexOf('<h3>FASE II</h3>')
  assert.ok(i1 >= 0 && i2 > i1)
  const f1 = html.slice(i1, i2)
  for (const r of ['SEG. · PEL. REC. BLIN.', 'OC-1 · BAT. INF. BLIN. «CARAMPAGUÉ»', 'OD · G. BLIN. 9 «VENCEDORES» (OD)', 'ART.-2 · BAT. LAR-160', 'MORT. · CÍA. MORT. 120', 'C4 · PC BAT. · PC 1RA. BRIG. · CÍA. TELECOM.'])
    assert.ok(f1.includes(r), `falta «${r}» en la FASE I`)
  assert.ok(f1.includes('<th>Tarea</th><th>Propósito</th>') && f1.includes('<th>Método</th><th>Efecto</th>'))
  assert.ok(f1.includes('Escrito por el G-2'))
  assert.ok(html.endsWith('</table>') && html.includes('<h3>Cierre</h3>'))
})

caso('Word .docx: cabecera, 4 fases × 7 sistemas operativos y cierre', () => {
  const Ac = (t) => String(t ?? '').trim()
  const ZS = (f) => f.some((x) => Ac(typeof x === 'object' ? x?.t : x))
  const s = docxCAE(HT19, hoja, { Ac, ZS })
  assert.equal(s.length, 1 + 4 * 7 + 1)
  assert.equal(s[1].titulo, 'FASE I — MANIOBRA')
  assert.equal(s[2].titulo, 'APOYO DE FUEGOS')
  assert.deepEqual(s[1].tabla.cabecera.map((c) => c.t), ['ELEMENTO', 'TAREA', 'PROPÓSITO'])
  assert.deepEqual(s[1].tabla.filas[1].map((c) => (typeof c === 'object' ? c.t : c)), ['OC-1 · BAT. INF. BLIN. «CARAMPAGUÉ»', 'Escrito por el G-2', ''])
  assert.equal(docxCAE(HT19, {}, { Ac, ZS }), null, 'hoja vacía: no hay documento')
})

caso('Pedido a la IA: reglas cortas, los elementos con su unidad y qué pasa en cada fase', () => {
  const T = extraCAE({ ...HT19, }, { ...hoja, _fases: ['Ramificación', 'Apresto lejano', 'Ataque propiamente tal', 'Ruptura, consolidación y explotación del éxito'] }, [], { json: '{}', extra: 'Las claves…' })
  assert.ok(T.extra.startsWith('Las claves…'))
  assert.match(T.extra, /UNA SOLA ORACIÓN por casilla/)
  assert.match(T.extra, /PROPÓSITO = PARA QUÉ: empieza con «Para»/)
  assert.match(T.extra, /OC-2 · CÍA\. A\/B \(SPIKE\)/)
  assert.match(T.extra, /Ruptura, consolidación y explotación del éxito — la OD pasa por la brecha/)
  assert.match(T.extra, /primero TODA la Ramificación/)
  const otra = { json: '{}', extra: 'x' }
  assert.equal(extraCAE({ tipo: 'campos' }, {}, [], otra), otra, 'las otras hojas no cambian')
})

console.log(`ht19-fases: ${n} casos OK`)
