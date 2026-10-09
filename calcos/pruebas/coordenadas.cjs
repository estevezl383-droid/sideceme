// La coordenada que escribe la Mesa (Sc del compilado: grados, minutos y segundos) ACARREA:
// nunca «60"» ni «60'». Se prueba la función TEXTUAL del compilado vigente:
//   · el caso que apareció en los Word del G-5: -68,35 → «68°21'00"O» (el compilado
//     anterior escribía «68°20'60"O»);
//   · una grilla fina alrededor de cada segundo (±0,4") en varios grados, más valores al
//     azar: ningún «60"» ni «60'», y la coordenada leída de vuelta queda a medio segundo;
//   · los reemplazos: una vez, reversibles, y ninguno cae dentro de lo que insertaron las
//     listas anteriores.
//
//   node coordenadas.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { vigente, cargar } = require('./extraer')

const RAIZ = path.join(__dirname, '..')
const ANTERIOR = path.join(RAIZ, 'assets', 'index-g5-20261003.js')
const NUEVO = path.join(RAIZ, 'assets', 'index-coordenadas-20261003.js')
const lista = require('./reemplazos-2026-10-03-coordenadas.js')
let fallos = 0
const caso = (nombre, f) => {
  try {
    f()
    console.log(`✓ ${nombre}`)
  } catch (e) {
    fallos++
    console.error(`✗ ${nombre}\n  ${e.message}`)
  }
}

const { Sc } = cargar(vigente(), ['Sc'])
const viejo = cargar(ANTERIOR, ['Sc']).Sc
// «17°00'00"S» → -17
const leer = (s) => {
  const m = /^(\d+)°(\d{2})'(\d{2})"([NSEO])$/.exec(s)
  assert.ok(m, `forma: ${s}`)
  const v = +m[1] + +m[2] / 60 + +m[3] / 3600
  return /[SO]/.test(m[4]) ? -v : v
}

caso('el caso de los Word del G-5: -68,35 sale 68°21\'00"O (el compilado anterior escribía 68°20\'60"O)', () => {
  assert.equal(viejo(-17, -68.35), '17°00\'00"S 68°20\'60"O', 'el fallo se reproduce con el compilado anterior')
  assert.equal(Sc(-17, -68.35), '17°00\'00"S 68°21\'00"O')
  assert.equal(Sc(-16.93, -68.36), '16°55\'48"S 68°21\'36"O', 'lo que ya estaba bien no cambia')
  assert.equal(Sc(-16.93, -68.36), viejo(-16.93, -68.36))
  assert.equal(Sc(10.5, 20.25), '10°30\'00"N 20°15\'00"E')
})
caso('acarrea también el minuto al grado (59\'59,9" → 1°)', () => {
  assert.equal(Sc(0.99999, -0.99999), '1°00\'00"N 1°00\'00"O')
  assert.equal(Sc(-16.999999, 179.9999999), '17°00\'00"S 180°00\'00"E')
})
caso('grilla fina: ningún «60"» ni «60\'», y vuelve a la misma coordenada (±0,5")', () => {
  let n = 0
  let malos = 0
  for (const g of [0, 16, 17, 68, 89]) {
    for (let k = 0; k < 3600; k++) {
      for (const d of [-0.4, -0.01, 0, 0.01, 0.4]) {
        const v = g + (k + d) / 3600
        if (v < 0) continue
        for (const signo of [1, -1]) {
          const x = signo * v
          const s = Sc(x, x)
          n++
          if (/60"|60'/.test(s)) malos++
          const [a, b] = s.split(' ')
          assert.ok(Math.abs(leer(a) - x) <= 0.5 / 3600 + 1e-12, `${x} → ${a}`)
          assert.ok(Math.abs(leer(b) - x) <= 0.5 / 3600 + 1e-12, `${x} → ${b}`)
        }
      }
    }
  }
  assert.equal(malos, 0, `${malos} de ${n} con 60`)
  let viejoMalos = 0
  for (let k = 0; k < 3600; k++) if (/60"|60'/.test(viejo(68 + (k + 0.6) / 3600, 0))) viejoMalos++
  assert.ok(viejoMalos > 0, 'la grilla encuentra el fallo en el compilado anterior')
})
caso('al azar: lo mismo en 20.000 coordenadas', () => {
  let semilla = 7
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 20000; i++) {
    const lat = azar() * 180 - 90
    const lng = azar() * 360 - 180
    const s = Sc(lat, lng)
    assert.ok(!/60"|60'/.test(s), s)
    const [a, b] = s.split(' ')
    assert.ok(Math.abs(leer(a) - lat) <= 0.5 / 3600 + 1e-12, `${lat} → ${a}`)
    assert.ok(Math.abs(leer(b) - lng) <= 0.5 / 3600 + 1e-12, `${lng} → ${b}`)
  }
})
caso('los reemplazos: cada uno una vez, el vigente los conserva y ninguno cae dentro de lo que insertaron las listas anteriores', () => {
  const ant = fs.readFileSync(ANTERIOR, 'utf8')
  const nue = fs.readFileSync(NUEVO, 'utf8')
  const vig = fs.readFileSync(vigente(), 'utf8')
  for (const r of lista) {
    assert.equal(ant.split(r.viejo).length - 1, r.veces, r.nombre)
    assert.equal(nue.split(r.nuevo).length - 1, r.veces, r.nombre)
    assert.ok(vig.includes(r.nuevo), `el vigente conserva: ${r.nombre}`)
  }
  assert.equal((ant.match(/\bSc\(/g) || []).length, (nue.match(/\bSc\(/g) || []).length, 'los mismos usos de Sc')
  let n = 0
  const rotos = []
  for (const f of fs.readdirSync(__dirname)) {
    let l = null
    if (/^reemplazos-.*\.js$/.test(f) && !['reemplazos-compilado.js', 'reemplazos-2026-10-03-coordenadas.js'].includes(f)) l = require(path.join(__dirname, f))
    else if (/^reemplazos-.*\.json$/.test(f)) l = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')).reemplazos
    for (const r of l || []) {
      if (!r.nuevo || !ant.includes(r.nuevo)) continue
      n++
      if (!nue.includes(r.nuevo)) rotos.push(`${f}: ${r.nombre || r.nuevo.slice(0, 80)}`)
    }
  }
  assert.ok(n > 100, `se revisaron ${n}`)
  assert.deepEqual(rotos, [])
})

console.log(fallos ? `${fallos} FALLO(S)` : 'OK — coordenadas')
process.exit(fallos ? 1 : 0)
