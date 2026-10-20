// 🎯 Los objetivos del enemigo van donde el G-2 los indica (calcos/objetivos-indicados/v1/objetivos.mjs).
// El caso de Sergio: Acostar los puso donde quiso la plantilla; escribió «EL TERRENO C 13 ES EL OBJETIVO
// UNO, OSEA EL TERRENO CLAVE 13» y volvió a Acostar.
//   node objetivos-indicados.mjs
import assert from 'node:assert/strict'
import { clavesNombradas, objetivoNombrado, leerIndicados, aplicarIndicados, fuentesHT16, objetivosIndicados, avisoIndicados } from '../objetivos-indicados/v1/objetivos.mjs'

let n = 0
const caso = (nombre, fn) => { fn(); n++; console.log('  ✔ ' + nombre) }

const claves = Array.from({ length: 15 }, (_, i) => ({ etiqueta: `C${i + 1}`, centro: [-68 + i * 0.01, -19] }))
claves.push({ etiqueta: 'Cerro Chico', centro: [-67.5, -19.2] })
// Lo que deja sK: dos intermedios y el final (O1), en otro lado.
const acostados = () => [
  { id: 'obj-probable-i0', clase: 'intermedio', etiqueta: 'Oa', centro: [-69, -20], nom: 'Objetivo intermedio', apoyadoEn: '' },
  { id: 'obj-probable-i1', clase: 'intermedio', etiqueta: 'Ob', centro: [-69.1, -20], nom: 'Objetivo intermedio', apoyadoEn: '' },
  { id: 'obj-probable-final', clase: 'final', etiqueta: 'O1', centro: [-69.2, -20.1], nom: 'OBJETIVO FINAL', apoyadoEn: 'C2' },
]
const ot = () => ({ ok: true, objetivos: acostados(), resumen: { intermedios: 2, final: true, profundidadAOkm: 20, apoyadosEnClave: 1 } })

caso('clavesNombradas: «C 13», «C13», «C-13», «terreno clave 13», «clave 13», «T.C. 13» y el nombre', () => {
  for (const t of ['C 13', 'el C13.', 'C-13', 'TERRENO CLAVE 13', 'la clave 13', 'T.C. 13', 'terreno clave N° 13'])
    assert.equal(clavesNombradas(t, claves)[0]?.rot, 'C13', t)
  assert.equal(clavesNombradas('sobre el cerro chico', claves)[0]?.rot, 'Cerro Chico')
  assert.deepEqual(clavesNombradas('CAE-1 a D-15 (1800), LDE-1, CE-VI', claves), [], 'no confunde otras siglas')
})

caso('objetivoNombrado: 1 / uno / final / O1 es el FINAL; a, b, 2, 3 los intermedios', () => {
  assert.deepEqual(objetivoNombrado('ES EL OBJETIVO UNO'), { final: true })
  assert.deepEqual(objetivoNombrado('objetivo 1'), { final: true })
  assert.deepEqual(objetivoNombrado('el objetivo final'), { final: true })
  assert.deepEqual(objetivoNombrado('O1'), { final: true })
  assert.deepEqual(objetivoNombrado('el Oa'), { intermedio: 0 })
  assert.deepEqual(objetivoNombrado('objetivo intermedio b'), { intermedio: 1 })
  assert.deepEqual(objetivoNombrado('objetivo dos'), { intermedio: 0 })
  assert.equal(objetivoNombrado('el terreno C 13'), null)
})

caso('El caso de Sergio: C 13 es el OBJETIVO UNO → el O1 (final) va sobre C13', () => {
  const r = objetivosIndicados(ot(), { _indic: { ht16: 'EL TERRENO C 13 ES EL OBJETIVO UNO , OSEA EL TERRENO CLAVE 13' } }, { clave: claves })
  const fin = r.objetivos.find((o) => o.clase === 'final')
  assert.deepEqual(fin.centro, claves[12].centro)
  assert.equal(fin.apoyadoEn, 'C13')
  assert.equal(fin.etiqueta, 'O1')
  assert.ok(fin.indicado)
  assert.equal(r.objetivos.length, 3, 'no duplica: «o sea el terreno clave 13» es la misma')
  assert.deepEqual(r.objetivos[0].centro, [-69, -20], 'los intermedios quedan donde estaban')
  assert.match(avisoIndicados(r), /OBJETIVO FINAL \(O1\) en C13/)
})

caso('Intermedios por letra y por número; uno más de los que había se agrega', () => {
  const r = objetivosIndicados(ot(), { _indic: { ht16: 'Oa en C3 y Ob en C5; el objetivo intermedio c es la clave 7' } }, { clave: claves })
  const inter = r.objetivos.filter((o) => o.clase === 'intermedio')
  assert.deepEqual(inter.map((o) => o.apoyadoEn), ['C3', 'C5', 'C7'])
  assert.equal(inter[2].etiqueta, 'Oc')
  assert.equal(r.resumen.intermedios, 3)
  assert.equal(r.objetivos[r.objetivos.length - 1].clase, 'final')
})

caso('Clave suelta: el final si está libre; en la celda «Objetivo intermedio» de la H.T. 16, un intermedio', () => {
  let r = objetivosIndicados(ot(), { _indic: { ht16: 'tomar C9' } }, { clave: claves })
  assert.equal(r.objetivos.find((o) => o.clase === 'final').apoyadoEn, 'C9')
  r = objetivosIndicados(ot(), { ht16: [{ Fase: 'ATAQUE', 'Objetivo intermedio': 'Ocupar la altura C4 [IA — verificar]', 'Objetivo final': 'Llegar a C11' }] }, { clave: claves })
  assert.equal(r.objetivos[0].apoyadoEn, 'C4')
  assert.equal(r.objetivos.find((o) => o.clase === 'final').apoyadoEn, 'C11')
  assert.match(r.objetivos[0].porQue, /H\.T\. 16 · ATAQUE/)
})

caso('La indicación manda sobre la hoja; un terreno clave que no existe se avisa', () => {
  const picb = { _indic: { ht16: 'C 13 es el objetivo final, y C99 el Oa' }, ht16: [{ 'Objetivo final': 'C2' }] }
  const r = objetivosIndicados(ot(), picb, { clave: claves })
  assert.equal(r.objetivos.find((o) => o.clase === 'final').apoyadoEn, 'C13')
  assert.deepEqual(r.faltan, ['C99'])
  assert.match(avisoIndicados(r), /No hay terreno clave C99/)
})

caso('Sin nada indicado, Acostar queda igual que antes', () => {
  const o = ot()
  const r = objetivosIndicados(o, { ht16: [{ Fase: 'APRESTO', 'Objetivo intermedio': 'Ocupar la zona de seguridad' }] }, { clave: claves })
  assert.deepEqual(r.objetivos, o.objetivos)
  assert.equal(avisoIndicados(r), '')
  assert.deepEqual(objetivosIndicados({ ok: false, error: 'x' }, {}, {}).error, 'x')
  assert.deepEqual(fuentesHT16({}), [])
})

caso('aplicarIndicados no toca la lista de entrada', () => {
  const o = acostados()
  aplicarIndicados(o, leerIndicados([{ texto: 'C13 objetivo final' }], claves))
  assert.deepEqual(o, acostados())
})

console.log(`objetivos-indicados: ${n} casos OK`)
