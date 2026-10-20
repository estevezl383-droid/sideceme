// Prueba del autollenado de la H.T. 19 sobre el COMPILADO de la Mesa del EM.
//
// Extrae del compilado, tal cual, las funciones UIe (autollenado), vD (rótulo
// de los renglones) e iq (mezcla con lo ya escrito) y las corre en Node.
//
//   cd calcos/pruebas && npm install
//   node ht19-autollenado.js                     → el compilado que carga calcos/index.html
//   node ht19-autollenado.js <compilado.js>      → otro compilado
//   node ht19-autollenado.js --base <anterior.js> → además compara con el anterior
//
// Para comparar con el compilado de antes de un commit:
//   git show <commit>:calcos/assets/index-XXXX.js > /tmp/anterior.js
const path = require('path')
const assert = require('assert')
const { vigente, cargar: cargarNombres } = require('./extraer')

const args = process.argv.slice(2)
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : null
const suelto = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--base')
const archivo = suelto || vigente()

// hie() sólo alimenta a otras hojas. SIDCaeElem no es del compilado: lo importa de calcos/ht19-cae/v1
// (los elementos de la H.T. 19, desde el 20-10-2026); los compilados anteriores no lo usan.
const cae = require('../ht19-cae/v1/cae.mjs')
const cargar = ruta => cargarNombres(ruta, ['UIe', 'vD', 'iq'], { hie: () => ({}), SIDCaeElem: cae.elementosCAE })

// Las 16 fichas de la plantilla situacional de la 1ra. Brigada Acorazada
// (RAGNAR, envolvimiento, nivel brigada) y dos fichas propias. Sólo los
// atributos que usa el autollenado.
const E = (designacion, escalon, tipo = 'unidad') => ({ designacion, escalon, tipo, bando: 'enemigo' })
const FICHAS = [
  { designacion: '', escalon: 'regimiento', tipo: 'unidad', bando: 'propias' },
  { designacion: '', escalon: 'batallon', tipo: 'unidad', bando: 'propias' },
  E('BAT. INF. BLIN. «CARAMPAGUÉ» (AMARRE)', 'batallon'),
  E('G. BLIN. 9 «VENCEDORES» (OD)', 'batallon'),
  E('RESERVA', 'compania'),
  E('G.A.AP. «SALVO»', 'batallon'),
  E('BAT. LAR-160', 'compania'),
  E('CÍA. MORT. 120', 'compania'),
  E('CÍA. MORT. 120', 'compania'),
  E('CÍA. A/B (SPIKE)', 'compania'),
  E('BAT. AA.', 'compania'),
  E('CÍA. ING. MEC. «ACONCAGUA»', 'compania'),
  E('PEL. REC. BLIN.', 'seccion'),
  E('PC BAT.', 'batallon', 'pc'),
  E('PC BAT.', 'batallon', 'pc'),
  E('PC 1RA. BRIG.', 'brigada', 'pc'),
  E('CÍA. TELECOM.', 'compania'), // unidad de comunicaciones, no un PC
  E('CÍA. LOG.', 'compania'),
]
const ht19 = (c, unidades) => c.UIe('ht19', { unidades, picb: {} })

let fallas = 0
function caso(nombre, fn) {
  try {
    fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.message).split('\n').join('\n      ')}`)
  }
}

const c = cargar(archivo)
const r = ht19(c, FICHAS)
console.log(`\nCompilado: ${path.relative(process.cwd(), archivo)}`)
if (base) {
  const b = ht19(cargar(base), FICHAS)
  console.log(`\nANTES (${path.relative(process.cwd(), base)})`)
  console.log(`  Con qué fuerza: ${b['Con qué fuerza']}\n  Quién: ${b['Quién']}`)
  console.log('AHORA')
}
console.log(`  Con qué fuerza: ${r['Con qué fuerza']}\n  Quién: ${r['Quién']}\n`)

caso('«Con qué fuerza» con las 16 fichas: sin los PC, con plurales y tildes', () => {
  assert.strictEqual(r['Con qué fuerza'], '3 batallones · 9 compañías · 1 sección')
})

caso('«Quién» lista las 13 unidades enemigas, sin los PC (la CÍA. TELECOM. sí va)', () => {
  const lista = r['Quién'].split(', ')
  assert.strictEqual(lista.length, 13, `hay ${lista.length}`)
  assert.ok(!lista.some(d => d.startsWith('PC ')), 'aparece un PC')
  assert.ok(lista.includes('CÍA. TELECOM.'))
})

caso('Singular y plural de los diez escalones de la app', () => {
  const formas = {
    equipo: ['equipo', 'equipos'], escuadra: ['escuadra', 'escuadras'],
    seccion: ['sección', 'secciones'], compania: ['compañía', 'compañías'],
    batallon: ['batallón', 'batallones'], regimiento: ['regimiento', 'regimientos'],
    brigada: ['brigada', 'brigadas'], division: ['división', 'divisiones'],
    cuerpo: ['cuerpo de ejército', 'cuerpos de ejército'], ejercito: ['ejército', 'ejércitos'],
  }
  for (const [esc, [uno, varios]] of Object.entries(formas)) {
    assert.strictEqual(ht19(c, [E('X', esc)])['Con qué fuerza'], `1 ${uno}`)
    assert.strictEqual(ht19(c, [E('X', esc), E('Y', esc)])['Con qué fuerza'], `2 ${varios}`)
  }
})

caso('Sin escalón cuenta como batallón; un escalón desconocido queda tal cual', () => {
  assert.strictEqual(ht19(c, [E('X', undefined)])['Con qué fuerza'], '1 batallón')
  assert.strictEqual(ht19(c, [E('X', 'raro'), E('Y', 'raro')])['Con qué fuerza'], '2 raro')
})

caso('Instalaciones y PC no cuentan; sin «tipo» cuenta como unidad', () => {
  const s = ht19(c, [E('I', 'compania', 'instalacion'), E('P', 'brigada', 'pc'), { designacion: 'U', escalon: 'compania', bando: 'enemigo' }])
  assert.strictEqual(s['Con qué fuerza'], '1 compañía')
  assert.strictEqual(s['Quién'], 'U')
  const soloPC = ht19(c, [E('P', 'brigada', 'pc')])
  assert.ok(!('Quién' in soloPC) && !('Con qué fuerza' in soloPC), 'con sólo PC no debe proponer nada')
})

caso('Lo ya escrito no se pisa (sólo se llena si el campo está vacío)', () => {
  const escrito = { 'Con qué fuerza': 'Texto del docente', 'Quién': 'Otro texto' }
  const m = c.iq(escrito, r)
  assert.strictEqual(m['Con qué fuerza'], 'Texto del docente')
  assert.strictEqual(m['Quién'], 'Otro texto')
})

caso('Sigue sin repartir fichas entre OC-1…OD (arreglo del 27-09)', () => {
  assert.strictEqual(r._ocsNom, undefined)
  assert.strictEqual(c.vD('OC-1', { _ocsNom: { 'OC-1': 'brigada Cab. Mec.' } }), 'OC-1')
})

// Quién es cada elemento (20-10-2026): TODAS las fichas enemigas del calco, cada una en su sistema
// operativo, con el rol del CAE más probable. Antes sólo se nombraban OC-1…OC-3 y OD.
const M = (designacion, rol, escalon, extra = {}) => ({ designacion, rol, escalon, tipo: 'unidad', bando: 'enemigo', ...extra })
const PROBABLE = [
  M('BAT. INF. BLIN. «CARAMPAGUÉ» (AMARRE)', 'e1', 'batallon'),
  M('G. BLIN. 9 «VENCEDORES» (OD)', 'flanqueo', 'batallon', { principal: true }),
  M('RESERVA', 'reserva', 'compania'),
  M('G.A.AP. «SALVO»', 'artilleria', 'batallon', { principal: true }),
  M('PEL. REC. BLIN.', 'reconocimiento', 'seccion'),
]
const PELIGROSO = [
  M('DEMOSTRACIÓN', 'e1', 'compania'),
  M('G. BLIN. 9 «VENCEDORES» (OD)', 'flanqueo', 'batallon', { principal: true }),
  M('BAT. INF. BLIN. «CARAMPAGUÉ» (SIGUE)', 'e2', 'batallon'),
]
const conFases = (...fases) => c.UIe('ht19', { unidades: [], picb: {}, fasesCOA: { enemigo: fases } })
const plano = o => JSON.parse(JSON.stringify(o))

caso('Las 16 fichas de la Brigada: cada una en su sistema operativo, ninguna afuera', () => {
  assert.deepStrictEqual(plano(r._items), {
    MANIOBRA: ['SEG.', 'OC-1', 'OC-2', 'OD', 'RES.'],
    'APOYO DE FUEGOS': ['ART.', 'ART.-2', 'MORT.', 'AAC.'],
  })
  assert.deepStrictEqual(plano(r._nom), {
    'MANIOBRA|SEG.': 'PEL. REC. BLIN.',
    'MANIOBRA|OC-1': 'BAT. INF. BLIN. «CARAMPAGUÉ» (AMARRE)',
    'MANIOBRA|OC-2': 'CÍA. A/B (SPIKE)',
    'MANIOBRA|OD': 'G. BLIN. 9 «VENCEDORES» (OD)',
    'MANIOBRA|RES.': 'RESERVA',
    'APOYO DE FUEGOS|ART.': 'G.A.AP. «SALVO»',
    'APOYO DE FUEGOS|ART.-2': 'BAT. LAR-160',
    'APOYO DE FUEGOS|MORT.': 'CÍA. MORT. 120',
    'INGENIERÍA|—': 'CÍA. ING. MEC. «ACONCAGUA»',
    'ADA.|—': 'BAT. AA.',
    'APOYO DE SERVICIOS|—': 'CÍA. LOG.',
    'C4|—': 'PC BAT. · PC 1RA. BRIG. · CÍA. TELECOM.',
  })
  assert.ok(!Object.keys(r).some(k => /\|Unidad$/.test(k)), 'ya no siembra «MANIOBRA|…|Unidad»: eso es del G-2')
})

caso('Sin fichas en el calco usa las del CAE más probable (aunque el peligroso esté primero)', () => {
  const s = conFases({ coa: 'peligroso', unidades: PELIGROSO }, { coa: 'probable', unidades: PROBABLE })
  assert.deepStrictEqual(plano(s._items.MANIOBRA), ['SEG.', 'OC-1', 'OD', 'RES.'])
  assert.strictEqual(s._nom['MANIOBRA|OC-1'], 'BAT. INF. BLIN. «CARAMPAGUÉ» (AMARRE)')
  assert.strictEqual(s._nom['APOYO DE FUEGOS|ART.'], 'G.A.AP. «SALVO»')
})

caso('Las OC van por ocurrencia (1er escalón → 2do escalón); si coinciden, el de mayor escalón', () => {
  const s = conFases({ coa: 'probable', unidades: [
    M('RES', 'reserva', 'batallon'), M('B', 'e1', 'batallon'), M('SIG', 'e2', 'batallon'),
    M('A', 'e1', 'regimiento'), M('X (OD)', 'e2', 'brigada'),
  ] })
  assert.deepStrictEqual(plano(s._items.MANIOBRA), ['OC-1', 'OC-2', 'OC-3', 'OD', 'RES.'])
  assert.deepStrictEqual(['OC-1', 'OC-2', 'OC-3', 'OD', 'RES.'].map(i => s._nom[`MANIOBRA|${i}`]), ['A', 'B', 'SIG', 'X (OD)', 'RES'])
})

caso('Sin una ficha marcada (OD) el renglón OD queda igual, sin nombre: lo escribe el G-2', () => {
  const s = conFases({ coa: 'probable', unidades: [M('ESF. PPAL.', 'flanqueo', 'batallon', { principal: true }), M('AMARRE', 'e1', 'batallon')] })
  assert.deepStrictEqual(plano(s._items.MANIOBRA), ['OC-1', 'OC-2', 'OD'])
  assert.strictEqual(s._nom['MANIOBRA|OD'], undefined)
})

caso('Lo escrito por el G-2 no se pisa: ni la unidad de un renglón ni los renglones', () => {
  const hoja = { 'MANIOBRA|OC-1|Unidad': 'FT IBARRA', _items: { MANIOBRA: ['OC-1', 'OD'] } }
  const m = c.iq(hoja, conFases({ coa: 'probable', unidades: PROBABLE }))
  assert.strictEqual(m['MANIOBRA|OC-1|Unidad'], 'FT IBARRA')
  assert.deepStrictEqual(m._items, { MANIOBRA: ['OC-1', 'OD'] })
  assert.strictEqual(cae.etiquetaCAE('MANIOBRA', 'OC-1', { ...m, _nom: { 'MANIOBRA|OC-1': 'OTRA' } }), 'OC-1 · FT IBARRA')
})

// Las columnas de fase: sólo las del CAE más probable, y nunca sobre una hoja ya escrita.
const OCHO_FASES = ['probable', 'peligroso'].flatMap(coa =>
  ['Ramificación', 'Apresto lejano', 'Ataque propiamente tal', 'Ruptura'].map(nombre => ({ coa, nombre, unidades: [] })))

caso('Hoja ya escrita en FASE I…IV: «Traer del calco» no le cambia las columnas (lo escrito seguía oculto)', () => {
  const escrita = { 'MANIOBRA|OC-1|FASE I|Tarea': 'Texto del docente', 'Cuándo': '' }
  const s = c.UIe('ht19', { unidades: [], picb: { ht19: escrita }, fasesCOA: { enemigo: OCHO_FASES } })
  assert.strictEqual(s._fases, undefined, `_fases = ${JSON.stringify(s._fases)}`)
  assert.strictEqual(s['Cuándo'], undefined)
  assert.ok('INTELIGENCIA|—|FASE I|A.I.N.' in s, 'lo que propone va en FASE I…IV')
  const m = c.iq(escrita, s)
  assert.strictEqual(m._fases, undefined)
  assert.strictEqual(m['MANIOBRA|OC-1|FASE I|Tarea'], 'Texto del docente')
})

caso('Hoja vacía: toma las 4 fases del CAE más probable (no las 8 de los dos cursos)', () => {
  const s = c.UIe('ht19', { unidades: [], picb: {}, fasesCOA: { enemigo: OCHO_FASES } })
  assert.deepStrictEqual([...s._fases], ['Ramificación', 'Apresto lejano', 'Ataque propiamente tal', 'Ruptura'])
  assert.match(s['Cuándo'], /^4 fase\(s\)/)
})

if (base) {
  caso('El resto del autollenado de la H.T. 19 no cambia respecto del anterior', () => {
    const b = cargar(base)
    const fases = { enemigo: [{ nombre: 'FASE 1' }, { nombre: 'FASE 2' }] }
    const escenarios = [
      ['las 16 fichas', { unidades: FICHAS }],
      ['sin fichas', { unidades: [] }],
      ['con fases y A.I.N.', { unidades: FICHAS, fasesCOA: fases, ops: { ains: [{ nombre: 'AIN 1', indicador: 'columna' }], obstaculos: [{}] } }],
      ['doctrina RDO-20001', { unidades: FICHAS, picb: { _pd: { manual: 'rojo' }, ht16: [{ 'Objetivo intermedio': 'A', 'Objetivo final': 'B' }] } }],
    ]
    for (const [nom, e] of escenarios) {
      const ctx = { picb: {}, ...e }
      const sin = o => {
        const { 'Quién': _q, 'Con qué fuerza': _f, _ocsNom: _o, ...resto } = o
        return Object.fromEntries(Object.entries(resto).filter(([k]) => !/^MANIOBRA\|.*\|Unidad$/.test(k) && k !== '_items' && k !== '_nom'))
      }
      assert.deepStrictEqual(sin(c.UIe('ht19', ctx)), sin(b.UIe('ht19', ctx)), `difiere en «${nom}»`)
    }
  })
}

console.log(fallas ? `\n${fallas} caso(s) fallan.\n` : '\nTodos los casos pasan.\n')
process.exit(fallas ? 1 : 0)
