// 🚚 Reabastecimiento y encabezado del cálculo del G-4 (calcos/logistica/v1/calculo.mjs).
// El caso de Sergio: DI. Motz. 2, 6446 hombres, 920 vehículos; la operación dura más de 30 días.
//   node reabastecimiento.mjs
import assert from 'node:assert/strict'
import { planReabastecimiento, encabezadoCalculo, tipoOperacion, completarJornadas, diasJornadas, htmlReabastecimiento } from '../logistica/v1/calculo.mjs'

let n = 0
const caso = (nombre, fn) => { fn(); n++; console.log('  ✔ ' + nombre) }
const jornadas = [
  { nombre: 'D − 1', kmOp: 29, dm: 43 }, { nombre: 'D', kmOp: 23, dm: 49 },
  { nombre: 'D (B Log)', kmOp: 9, dm: 37, sinMD: true }, { nombre: 'D + 1', kmOp: 29, dm: 0 },
]
const cl3 = { total: 6449, filas: jornadas }
const cl5 = { filas: [{ cantidad: 32, primerDia: 132, sucesivos: 102 }] }
const base = { dias: 30, ciclo: 3, efectivo: 6446, vehiculos: 920, seguridad: 0.1, racion: 'normal', litrosHombre: 12, cl3, cl5, aguaPorViaje: 17600, camiones: 10, cargaT: 3, cisternas: 2, litrosCisterna: 4800, distKm: 40, velKmH: 30, horasCarga: 2 }

caso('30 días cada 3 → 10 reabastecimientos de 3 días', () => {
  const p = planReabastecimiento(base)
  assert.equal(p.filas.length, 10)
  assert.ok(p.filas.every((f) => f.dias === 3))
  assert.equal(p.filas[0].raciones, Math.ceil(6446 * 1.1 * 3))
  assert.equal(p.filas[0].agua, (6446 * 12 + 920 * 3) * 3)
  assert.equal(p.filas[9].desde, 27)
})

caso('el último ciclo se acorta y el primero lleva el día D de la Cl V', () => {
  const p = planReabastecimiento({ ...base, dias: 20 })
  assert.equal(p.filas.length, 7)
  assert.equal(p.filas[6].dias, 2)
  assert.equal(p.filas[0].cl5, 32 * 132 + 32 * 102 * 2)
  assert.equal(p.filas[1].cl5, 32 * 102 * 3)
})

caso('Cl III por día: el total sobre las jornadas con MD (3 días)', () => {
  assert.equal(diasJornadas(jornadas), 3)
  const p = planReabastecimiento(base)
  assert.equal(p.filas[0].cl3, Math.round((6449 / 3) * 3))
})

caso('vueltas, horas y veredicto con los vehículos que hay', () => {
  const p = planReabastecimiento(base)
  // 21.274 raciones × 2 kg = 42,5 t; 10 camiones × 3 t = 30 t → 2 vueltas
  assert.equal(p.vueltas.racion, 2)
  assert.equal(p.horasVuelta, 2 * 40 / 30 + 2)
  assert.ok(p.alcanza)
  const sin = planReabastecimiento({ ...base, cisternas: 0 })
  assert.equal(sin.alcanza, false)
  assert.ok(sin.avisos.some((a) => /Faltan medios/.test(a)))
  const lejos = planReabastecimiento({ ...base, ciclo: 1, camiones: 1, distKm: 300 })
  assert.equal(lejos.alcanza, false)
})

caso('la ración de combate avisa sus 3 días seguidos', () => {
  assert.ok(planReabastecimiento({ ...base, racion: 'combate' }).avisos.some((a) => /máximo 3 días|sirve 3 días/.test(a)))
  assert.ok(planReabastecimiento({ ...base, racion: 'combate', ciclo: 5 }).avisos.some((a) => /no puede pasar de 3 días/.test(a)))
})

caso('encabezado: OBJETO con el tipo de operación, CARTAS de la Orden, ANEXOS S/A', () => {
  const orden = { unidad: 'CE-I', carta: 'Bolivia 1:250.000, hojas SE 19-3 y SE 19-7', mision: 'El CE-I DEFIENDE en el sector Challapata…' }
  assert.equal(tipoOperacion(orden), 'Defensivas')
  assert.deepEqual(encabezadoCalculo(orden, 'CE-I'), { objeto: 'Sección IV Logística en Apoyo a las Operaciones Defensivas del CE-I.', cartas: 'Bolivia 1:250.000, hojas SE 19-3 y SE 19-7', anexos: 'S/A' })
  assert.equal(tipoOperacion({ mision: 'atacar a partir de D…' }), 'Ofensivas')
  assert.equal(encabezadoCalculo({}, 'DI. Motz. 2').objeto, 'Sección IV Logística en Apoyo a las Operaciones del DI. Motz. 2.')
})

caso('Cl III: copiar la última jornada hasta los días de la operación', () => {
  const j = completarJornadas(jornadas, 6)
  assert.equal(diasJornadas(j), 6)
  assert.deepEqual(j.slice(4).map((r) => r.nombre), ['D + 2', 'D + 3', 'D + 4'])
  assert.equal(completarJornadas(jornadas, 2).length, 4) // ya cubre: no quita nada
})

caso('el Word lleva la sección REABASTECIMIENTO con una fila por ciclo', () => {
  const h = htmlReabastecimiento(planReabastecimiento(base))
  assert.match(h, /<h2>REABASTECIMIENTO<\/h2>/)
  assert.equal((h.match(/<tr>/g) || []).length, 11)
  assert.match(h, /D\+27 a D\+29/)
  assert.equal(htmlReabastecimiento(null), '')
})

console.log(`\n${n} casos pasan.`)
