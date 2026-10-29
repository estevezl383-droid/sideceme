const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto')
const cambios = require('./reemplazos-2026-10-28-vista')
const assets = path.resolve(__dirname, '../assets')
const anterior = 'index-areas-interes-20261028.js', nuevo = 'index-vista-plegada-20261028.js'
const original = fs.readFileSync(path.join(assets, anterior), 'utf8')
if (crypto.createHash('sha256').update(original).digest('hex') !== 'f2205076988481dfc8b92e544a79350bec730c3aaff62783fc953adcf4dc9a20') throw new Error('Cambió el compilado anterior.')
let salida = original
for (const c of cambios) {
  const n = salida.split(c.viejo).length - 1
  if (n !== c.veces) throw new Error(`${c.nombre}: se esperaban ${c.veces}, hay ${n}`)
  salida = salida.split(c.viejo).join(c.nuevo)
}
let reversa = salida
for (const c of [...cambios].reverse()) reversa = reversa.split(c.nuevo).join(c.viejo)
if (reversa !== original) throw new Error('No se pudo invertir el cambio byte por byte.')
const indice = path.resolve(__dirname, '../index.html')
let html = fs.readFileSync(indice, 'utf8')
if (!html.includes(anterior) && !html.includes(nuevo)) throw new Error('Cambió el compilado activo.')
html = html.replace(anterior, nuevo).replace(/(index-vista-plegada-20261028\.js)\?v=[^"]*/, '$1?v=20261028-vista')
html = html.replace('./paquetes/v1/paquetes.mjs?v=20261027', './paquetes/v1/paquetes.mjs?v=20261028-vista')
html = html.replace('./modalidad/modalidad.js?v=20261021reab', './modalidad/modalidad.js?v=20261028-plegado')
html = html.replace(/^.*<script src="\.\/cartografia-areas\/v1\/abrir\.js[^\n]*\n/m, '')
fs.writeFileSync(path.join(assets, nuevo), salida)
fs.writeFileSync(indice, html)
console.log(`${nuevo}: ${cambios.length} cambios reversibles`)
