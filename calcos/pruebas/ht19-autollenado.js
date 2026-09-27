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

// hie() sólo alimenta a otras hojas.
const cargar = ruta => cargarNombres(ruta, ['UIe', 'vD', 'iq'], { hie: () => ({}) })

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

// Quién es cada OC/OD: sale de las fichas del CAE más probable, con su rol de la
// plantilla. Las fichas de maniobra de los dos CAE de «ARMAS» (27-09).
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
const unidadesDe = s => Object.fromEntries(['OC-1', 'OC-2', 'OC-3', 'OD'].map(i => [i, s[`MANIOBRA|${i}|Unidad`]]))
const conFases = (...fases) => c.UIe('ht19', { unidades: [], picb: {}, fasesCOA: { enemigo: fases } })

caso('Propone quién es cada OC/OD con el CAE más probable del calco (aunque el peligroso esté primero)', () => {
  const s = conFases({ coa: 'peligroso', unidades: PELIGROSO }, { coa: 'probable', unidades: PROBABLE })
  assert.deepStrictEqual(unidadesDe(s), {
    'OC-1': 'BAT. INF. BLIN. «CARAMPAGUÉ» (AMARRE)',
    'OC-2': 'RESERVA',
    'OC-3': undefined,
    OD: 'G. BLIN. 9 «VENCEDORES» (OD)',
  })
})

caso('Las OC van por ocurrencia (1er escalón → 2do escalón → reserva); si coinciden, el de mayor escalón', () => {
  const s = conFases({ coa: 'probable', unidades: [
    M('RES', 'reserva', 'batallon'), M('B', 'e1', 'batallon'), M('SIG', 'e2', 'batallon'),
    M('A', 'e1', 'regimiento'), M('X (OD)', 'e2', 'brigada'),
  ] })
  assert.deepStrictEqual(unidadesDe(s), { 'OC-1': 'A', 'OC-2': 'B', 'OC-3': 'SIG', OD: 'X (OD)' })
})

caso('Sin una ficha marcada (OD) no propone nada: lo escribe el docente', () => {
  const s = conFases({ coa: 'probable', unidades: [M('ESF. PPAL.', 'flanqueo', 'batallon', { principal: true }), M('AMARRE', 'e1', 'batallon')] })
  assert.deepStrictEqual(unidadesDe(s), { 'OC-1': undefined, 'OC-2': undefined, 'OC-3': undefined, OD: undefined })
})

caso('Sin fases trazadas usa las fichas que están en el calco', () => {
  const s = c.UIe('ht19', { unidades: PROBABLE, picb: {} })
  assert.strictEqual(s['MANIOBRA|OD|Unidad'], 'G. BLIN. 9 «VENCEDORES» (OD)')
  assert.strictEqual(s['MANIOBRA|OC-1|Unidad'], 'BAT. INF. BLIN. «CARAMPAGUÉ» (AMARRE)')
})

caso('El rótulo (hoja, vista previa, Word e IA) muestra la unidad; lo escrito por el docente no se pisa', () => {
  const hoja = { 'MANIOBRA|OC-1|Unidad': 'FT IBARRA', 'MANIOBRA|OC-2|Unidad': '   ' }
  assert.strictEqual(c.vD('OC-1', hoja), 'OC-1 · FT IBARRA')
  assert.strictEqual(c.vD('OC-2', hoja), 'OC-2')
  assert.strictEqual(c.vD('ART.', hoja), 'ART.')
  const m = c.iq(hoja, conFases({ coa: 'probable', unidades: PROBABLE }))
  assert.strictEqual(m['MANIOBRA|OC-1|Unidad'], 'FT IBARRA')
  assert.strictEqual(m['MANIOBRA|OD|Unidad'], 'G. BLIN. 9 «VENCEDORES» (OD)')
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
        return Object.fromEntries(Object.entries(resto).filter(([k]) => !/^MANIOBRA\|.*\|Unidad$/.test(k)))
      }
      assert.deepStrictEqual(sin(c.UIe('ht19', ctx)), sin(b.UIe('ht19', ctx)), `difiere en «${nom}»`)
    }
  })
}

console.log(fallas ? `\n${fallas} caso(s) fallan.\n` : '\nTodos los casos pasan.\n')
process.exit(fallas ? 1 : 0)
