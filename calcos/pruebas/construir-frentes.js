const fs = require('fs'), path = require('path')
const lista = require('./reemplazos-2026-10-09-frentes')
const assets = path.join(__dirname, '..', 'assets')
const anterior = 'index-areas-20261008.js', nuevo = 'index-areas-20261009.js'
const base = fs.readFileSync(path.join(assets, anterior), 'utf8')
let src = base
for (const r of lista) {
  if (src.split(r.viejo).length - 1 !== r.veces) throw new Error('Ancla no única: ' + r.nombre)
  src = src.replace(r.viejo, () => r.nuevo)
}
let atras = src
for (const r of [...lista].reverse()) atras = atras.replace(r.nuevo, () => r.viejo)
if (atras !== base) throw new Error('El parche no es reversible byte por byte.')
const indice = path.join(__dirname, '..', 'index.html')
const html = fs.readFileSync(indice, 'utf8')
if (!html.includes(anterior)) throw new Error('Cambió el compilado activo: revisar antes de continuar.')
fs.writeFileSync(path.join(assets, nuevo), src)
fs.writeFileSync(indice, html.replace(anterior + '?v=contornos-nombres-20261008', nuevo + '?v=frentes-20261009'))
console.log(nuevo + ': ' + lista.length + ' cambios reversibles')
