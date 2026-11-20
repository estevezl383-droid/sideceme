// construir-mi-unidad.js — arma `index-mi-unidad-20261119.js` a partir del
// compilado anterior (`index-acostar-20261117.js`).
//
//   node "construir-mi-unidad.js" <compilado-de-entrada> <compilado-de-salida>
//
// Exige que cada texto aparezca UNA sola vez: si el compilado cambió, se planta
// y no entrega nada a medias. Es reversible byte por byte (de ↔ a).
import { readFileSync, writeFileSync } from 'node:fs'
import { REEMPLAZOS } from './reemplazos-2026-11-19-mi-unidad.js'

const [entrada, salida] = process.argv.slice(2)
if (!entrada || !salida) { console.error('Uso: node construir-mi-unidad.js <entrada.js> <salida.js>'); process.exit(1) }

let js = readFileSync(entrada, 'utf8')
for (const r of REEMPLAZOS) {
  const n = js.split(r.de).length - 1
  if (n !== 1) { console.error(`❌ «${r.nombre}»: el texto aparece ${n} veces (tiene que aparecer 1).`); process.exit(1) }
  js = js.replace(r.de, r.a)
  console.log(`✅ ${r.nombre}`)
}
writeFileSync(salida, js)
console.log(`✅ ${salida} — ${(js.length / 1e6).toFixed(2)} MB`)
