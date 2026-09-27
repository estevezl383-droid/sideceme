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
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const assert = require('assert')
const acorn = require('acorn')

const args = process.argv.slice(2)
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : null
const suelto = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--base')
const vigente = () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')
  return path.join(__dirname, '..', html.match(/\.\/(assets\/index-[\w-]+\.js)/)[1])
}
const archivo = suelto || vigente()

// Las funciones de nivel superior, copiadas textualmente del compilado.
function cargar(ruta) {
  const src = fs.readFileSync(ruta, 'utf8')
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' })
  const quiero = new Set(['UIe', 'vD', 'iq'])
  const partes = []
  for (const n of ast.body) {
    if (n.type === 'FunctionDeclaration' && quiero.delete(n.id.name)) partes.push(src.slice(n.start, n.end))
  }
  if (quiero.size) throw new Error(`No están en ${ruta}: ${[...quiero].join(', ')}`)
  const ctx = { hie: () => ({}) } // hie() sólo alimenta a otras hojas
  vm.createContext(ctx)
  vm.runInContext(partes.join('\n'), ctx)
  return ctx
}

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
      const sin = o => { const { 'Quién': _q, 'Con qué fuerza': _f, _ocsNom: _o, ...resto } = o; return resto }
      assert.deepStrictEqual(sin(c.UIe('ht19', ctx)), sin(b.UIe('ht19', ctx)), `difiere en «${nom}»`)
    }
  })
}

console.log(fallas ? `\n${fallas} caso(s) fallan.\n` : '\nTodos los casos pasan.\n')
process.exit(fallas ? 1 : 0)
