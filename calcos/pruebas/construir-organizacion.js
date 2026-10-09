// Arma el compilado nuevo de la Mesa: index-prc-20261006.js +
// reemplazos-2026-10-06-organizacion.js → index-organizacion-20261006.js, comprueba que
// deshaciendo los reemplazos se vuelve byte por byte al anterior y rehace los compilados que
// se armaron después sobre este (las áreas y los frentes).
//
//   node construir-organizacion.js
const fs = require('fs')
const path = require('path')

const ASSETS = path.join(__dirname, '..', 'assets')
const ANTERIOR = 'index-prc-20261006.js'
const NUEVO = 'index-organizacion-20261006.js'
const lista = require('./reemplazos-2026-10-06-organizacion')

const base = fs.readFileSync(path.join(ASSETS, ANTERIOR), 'utf8')
let src = base
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
let atras = src
for (const r of [...lista].reverse()) atras = atras.split(r.nuevo).join(r.viejo)
if (atras !== base) throw new Error('Deshaciendo los reemplazos no se vuelve al compilado anterior.')
fs.writeFileSync(path.join(ASSETS, NUEVO), src)
console.log(NUEVO)
// Los compilados que se armaron DESPUÉS sobre este (las áreas y los frentes, 08 y 09-10-2026)
// se rehacen con su misma lista y la misma forma de reemplazar que su construir-*.js, para
// que el vigente lleve también esto. calcos/index.html ya carga el último y no se toca.
const POSTERIORES = [
  { anterior: NUEVO, nuevo: 'index-areas-20261008.js', lista: './reemplazos-2026-10-08-areas', conFuncion: false },
  { anterior: 'index-areas-20261008.js', nuevo: 'index-areas-20261009.js', lista: './reemplazos-2026-10-09-frentes', conFuncion: true },
]
for (const p of POSTERIORES) {
  const antes = fs.readFileSync(path.join(ASSETS, p.anterior), 'utf8')
  let s = antes
  for (const r of require(p.lista)) {
    if (s.split(r.viejo).length - 1 !== r.veces) throw new Error(`${p.nuevo}: «${r.nombre}» ya no está una sola vez.`)
    s = p.conFuncion ? s.replace(r.viejo, () => r.nuevo) : s.replace(r.viejo, r.nuevo)
  }
  let vuelta = s
  for (const r of [...require(p.lista)].reverse()) vuelta = p.conFuncion ? vuelta.replace(r.nuevo, () => r.viejo) : vuelta.replace(r.nuevo, r.viejo)
  if (vuelta !== antes) throw new Error(`${p.nuevo}: deshaciendo no se vuelve al anterior.`)
  fs.writeFileSync(path.join(ASSETS, p.nuevo), s)
  console.log(`${p.nuevo} (rehecho: actualizá su «anterior» en reemplazos-compilado.js)`)
}
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')
if (![NUEVO, ...POSTERIORES.map((p) => p.nuevo)].some((n) => html.includes(n))) throw new Error('calcos/index.html no carga ninguno de estos compilados.')
