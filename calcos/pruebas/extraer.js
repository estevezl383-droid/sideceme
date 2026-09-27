// Carga, TEXTUALMENTE, funciones y constantes de nivel superior del compilado
// de la Mesa del EM, para correrlas en Node sin reescribirlas.
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const acorn = require('acorn')

// El compilado que carga calcos/index.html.
function vigente() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')
  return path.join(__dirname, '..', html.match(/\.\/(assets\/index-[\w-]+\.js)/)[1])
}

function cargar(ruta, nombres, globales = {}) {
  const src = fs.readFileSync(ruta, 'utf8')
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' })
  const quiero = new Set(nombres)
  const partes = []
  for (const n of ast.body) {
    if (n.type === 'FunctionDeclaration' && quiero.delete(n.id.name)) partes.push(src.slice(n.start, n.end))
    else if (n.type === 'VariableDeclaration') {
      for (const d of n.declarations) {
        if (d.id.type === 'Identifier' && quiero.delete(d.id.name)) partes.push(`var ${src.slice(d.start, d.end)};`)
      }
    }
  }
  if (quiero.size) throw new Error(`No están en ${ruta}: ${[...quiero].join(', ')}`)
  const ctx = { ...globales }
  vm.createContext(ctx)
  vm.runInContext(partes.join('\n'), ctx)
  return ctx
}

module.exports = { vigente, cargar }
