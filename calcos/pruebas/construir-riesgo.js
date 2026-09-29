// Arma el compilado nuevo de la Mesa: index-ucOhdPbL.js + reemplazos-2026-09-29-riesgo.js.
// Cada «viejo» tiene que aparecer exactamente «veces» veces; el nombre del archivo nuevo
// sale de su SHA-256 (como los de Vite). Imprime el nombre para ponerlo en calcos/index.html.
//
//   node construir-riesgo.js
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-ucOhdPbL.js')
const lista = require('./reemplazos-2026-09-29-riesgo')

let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const hash = crypto.createHash('sha256').update(src).digest('base64url').replace(/[^A-Za-z0-9]/g, '').slice(0, 8)
const nombre = `index-${hash}.js`
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
