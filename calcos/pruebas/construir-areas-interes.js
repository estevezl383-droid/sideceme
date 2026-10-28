const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const lista = require('./reemplazos-2026-10-28-areas-interes')
const assets = path.resolve(__dirname, '../assets')
const anterior = 'index-paquetes-20261027.js', nuevo = 'index-areas-interes-20261028.js'
const original = fs.readFileSync(path.join(assets, anterior), 'utf8')
if (crypto.createHash('sha256').update(original).digest('hex') !== '33d4c5a1a44236385716c7dcad9d78b730bee968676720d07385b6438b9a9017') throw new Error('Cambió el compilado de partida.')
let salida = original
for (const r of lista) {
  if (r.prefijo) { salida = r.nuevo + salida; continue }
  const veces = salida.split(r.viejo).length - 1
  if (veces !== r.veces) throw new Error(`${r.nombre}: se esperaban ${r.veces}, hay ${veces}`)
  salida = salida.split(r.viejo).join(r.nuevo)
}
let reversa = salida
for (const r of [...lista].reverse()) reversa = r.prefijo ? reversa.slice(r.nuevo.length) : reversa.split(r.nuevo).join(r.viejo)
if (reversa !== original) throw new Error('Los cambios no son reversibles.')
const indice = path.resolve(__dirname, '../index.html')
const html = fs.readFileSync(indice, 'utf8')
if (!html.includes(anterior) && !html.includes(nuevo)) throw new Error('Cambió el compilado activo.')
fs.writeFileSync(path.join(assets, nuevo), salida)
fs.writeFileSync(indice, html.replace(anterior, nuevo).replace(`${nuevo}?v=20261027`, `${nuevo}?v=20261028`))
console.log(`${nuevo}: ${lista.length} cambios reversibles`)
