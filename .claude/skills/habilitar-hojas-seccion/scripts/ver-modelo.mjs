// Imprime el árbol de un modelo militar de la Escuela del catálogo del formato militar
// (calcos/formato-militar/v1/catalogo.js), con sus rótulos y la numeración I.- A.- 1.- a.-
//
//   node .claude/skills/habilitar-hojas-seccion/scripts/ver-modelo.mjs            → lista los modelos
//   node .claude/skills/habilitar-hojas-seccion/scripts/ver-modelo.mjs aprec-acgm → el árbol
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const { catalogo } = await import(pathToFileURL(path.join(raiz, 'calcos/formato-militar/v1/catalogo.js')).href)
const id = process.argv[2]
if (!id || !catalogo[id]) {
  console.log('Modelos del catálogo:')
  for (const [k, v] of Object.entries(catalogo)) console.log(`  ${k.padEnd(22)} ${String(v.apartados?.length || 0).padStart(3)} apartados · ${v.fuente} · ${v.seccionFuente || ''}`)
  process.exit(id ? 1 : 0)
}
const m = catalogo[id]
console.log(`${id} — ${m.fuente} (${m.seccionFuente || 's/sección'})`)
console.log(`Rótulos: ${m.rotulos.join(' · ')}`)
const FORM = ['I', 'A', '1', 'a', '1', 'a']
const cont = []
const rom = (n) => { let s = ''; for (const [l, v] of [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]) while (n >= v) (s += l), (n -= v); return s }
for (const a of m.apartados) {
  const d = a.nivel - 1
  cont.length = d + 1
  cont[d] = (cont[d] || 0) + 1
  const f = FORM[Math.min(d, 5)]
  const n = f === 'I' ? rom(cont[d]) : f === 'A' ? String.fromCharCode(64 + cont[d]) : f === 'a' ? String.fromCharCode(96 + cont[d]) : String(cont[d])
  console.log(`${'  '.repeat(d)}${n}${d >= 4 ? ')' : '.-'} ${a.titulo}`)
}
