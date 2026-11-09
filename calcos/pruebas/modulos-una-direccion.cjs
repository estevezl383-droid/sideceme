// 🔗 Ningún módulo con estado propio se carga con DOS direcciones (08-11-2026).
// Para el navegador, «carta.js» y «carta.js?v=…» son dos módulos distintos, cada uno con sus propias variables. El
// 2026-10-29 el compilado pasó a pedir concepto-operacion/v1/carta.js?v=20261029-cursos y el editor de la F3·P4 y el
// panel de los CAP lo siguieron pidiendo sin ?v=: el compilado llenaba el puente de uno y ellos leían el del otro, siempre
// vacío (⚡ Proponer la plantilla del concepto deshabilitado; la IA de los dos CAP sin los lugares de la carta ni el plan
// de fuegos del ejercicio). Esta prueba recorre los import de la Mesa (calcos/index.html → el compilado vigente → cada
// módulo, también los import() dinámicos) y falla si un módulo con estado de nivel superior (let / var, o un Map, Set,
// [] o {} vacío) aparece con más de una dirección. Los módulos sin estado repetidos sólo se descargan dos veces.
// Si se cambia un módulo con estado y hace falta romper el caché, cambiar el ?v= en TODOS los que lo importan.
//   node calcos/pruebas/modulos-una-direccion.cjs   (acorn por NODE_PATH o node_modules)
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const CALCOS = path.resolve(__dirname, '..')
let acorn = null
try {
  acorn = require('acorn')
} catch {}

// Los import con dirección relativa: estáticos, export … from e import() con texto fijo.
const RE_IMPORT = /(?:\bimport\s*(?:[\w$*{}\s,]+?\s*from\s*)?|\bexport\s*[\w$*{}\s,]*?\s*from\s*|\bimport\s*\(\s*)["'`](\.{1,2}\/[^"'`$]+)["'`]/g

function grafo() {
  const html = fs.readFileSync(path.join(CALCOS, 'index.html'), 'utf8')
  const usos = new Map() // archivo (relativo a calcos/) → Map(dirección pedida → Set(quién la pide))
  const anotar = (archivo, dir, quien) => {
    if (!usos.has(archivo)) usos.set(archivo, new Map())
    const m = usos.get(archivo)
    if (!m.has(dir)) m.set(dir, new Set())
    m.get(dir).add(quien)
  }
  const vistos = new Set()
  const recorrer = (rel) => {
    if (vistos.has(rel)) return
    vistos.add(rel)
    const f = path.join(CALCOS, rel)
    if (!fs.existsSync(f)) return
    const src = fs.readFileSync(f, 'utf8')
    for (const m of src.matchAll(RE_IMPORT)) {
      const [p, q] = m[1].split('?')
      const abs = path.posix.normalize(path.posix.join(path.posix.dirname(rel), p))
      anotar(abs, q ? `?${q}` : '(sin ?v)', rel)
      recorrer(abs)
    }
  }
  for (const m of html.matchAll(/<script\b[^>]*\btype="module"[^>]*\bsrc="\.\/([^"]+)"/g)) {
    const [p, q] = m[1].split('?')
    anotar(p, q ? `?${q}` : '(sin ?v)', 'index.html')
    recorrer(p)
  }
  return { usos, vistos }
}

// ¿Tiene el módulo estado propio de nivel superior?
const VACIO = (n) =>
  n && ((n.type === 'NewExpression' && ['Map', 'Set', 'WeakMap', 'WeakSet'].includes(n.callee?.name) && !n.arguments.length) ||
    (n.type === 'ArrayExpression' && !n.elements.length) ||
    (n.type === 'ObjectExpression' && !n.properties.length))
function conEstado(rel) {
  const src = fs.readFileSync(path.join(CALCOS, rel), 'utf8')
  if (acorn) {
    try {
      const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true })
      const nombres = []
      for (const n0 of ast.body) {
        const n = n0.type === 'ExportNamedDeclaration' ? n0.declaration : n0
        if (n?.type !== 'VariableDeclaration') continue
        for (const d of n.declarations) if (n.kind !== 'const' || VACIO(d.init)) nombres.push(d.id.name || '(desestructurado)')
      }
      return nombres
    } catch {}
  }
  // Sin acorn (o si no lo lee): las declaraciones en la columna 0.
  return [...src.matchAll(/^(?:export\s+)?(?:(?:let|var)\s+([\w$]+)|const\s+([\w$]+)\s*=\s*(?:new\s+(?:Map|Set|WeakMap|WeakSet)\(\)|\[\]|\{\}))/gm)].map((m) => m[1] || m[2])
}

let fallos = 0
const caso = (n, f) => {
  try {
    f()
    console.log('✓ ' + n)
  } catch (e) {
    fallos++
    console.log('✗ ' + n + '\n  ' + String(e.message).split('\n').join('\n  '))
  }
}

const { usos, vistos } = grafo()
const describir = (archivo) => [...usos.get(archivo)].map(([dir, quien]) => `${dir} ← ${[...quien].join(', ')}`).join('\n    ')

caso('se recorre la Mesa entera (el compilado vigente y sus módulos)', () => {
  assert.ok([...vistos].some((r) => /^assets\/index-[\w-]+\.js$/.test(r)), 'el compilado de index.html')
  assert.ok(vistos.size > 80, `módulos recorridos: ${vistos.size}`)
  assert.ok(vistos.has('concepto-operacion/v1/editor.js') && vistos.has('cap-propios/v1/panel.js'))
})

caso('el puente de la F3·P4 (concepto-operacion/v1/carta.js) es UN solo módulo: el compilado, el editor y el panel de los CAP piden la misma dirección', () => {
  const m = usos.get('concepto-operacion/v1/carta.js')
  assert.ok(m, 'alguien importa carta.js')
  assert.equal(m.size, 1, `carta.js se pide con ${m.size} direcciones:\n    ${describir('concepto-operacion/v1/carta.js')}`)
  const quien = [...[...m.values()][0]]
  for (const q of ['concepto-operacion/v1/editor.js', 'cap-propios/v1/panel.js']) assert.ok(quien.includes(q), `${q} lo importa`)
  assert.ok(quien.some((q) => q.startsWith('assets/index-')), 'el compilado lo importa')
  assert.ok(conEstado('concepto-operacion/v1/carta.js').includes('puente'), 'tiene estado propio: el puente')
})

caso('ningún módulo con estado propio (let/var, Map/Set/[]/{} vacío de nivel superior) se carga con dos direcciones', () => {
  const malos = []
  for (const [archivo, m] of usos) {
    if (m.size < 2 || !fs.existsSync(path.join(CALCOS, archivo))) continue
    const estado = conEstado(archivo)
    if (estado.length) malos.push(`${archivo} (${estado.slice(0, 4).join(', ')}${estado.length > 4 ? '…' : ''}):\n    ${describir(archivo)}`)
  }
  assert.deepEqual(malos, [], `módulos con estado y más de una dirección:\n${malos.join('\n')}`)
})

console.log(fallos ? `${fallos} FALLO(S)` : `OK — ${vistos.size} módulos recorridos${acorn ? '' : ' (sin acorn: por columnas)'}`)
process.exit(fallos ? 1 : 0)
