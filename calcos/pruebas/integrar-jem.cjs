// 🧩 Integrar el trabajo de los G (calcos/integrar/v1/integrar.js): la parte que decide qué hoja
// viene de dónde y la que la pone en el ejercicio, sin el navegador.
//   node integrar-jem.cjs
const assert = require('node:assert/strict')
const I = require('../integrar/v1/integrar.js')

const caso = (nombre, f) => {
  f()
  console.log('✓ ' + nombre)
}

// Un catálogo chico con la forma del de la Mesa (window.SIDCatalogoHojas()).
const CAT = {
  cmte: [{ nom: 'Recibir la misión', hojas: [{ id: 'aprecCmte', num: 'F1·P3', nom: 'Apreciación Activa del Comandante' }, { id: 'guiaInicial', num: 'F1·P6', nom: 'Guía Inicial', compartida: 'g3' }] }],
  jem: [{ nom: 'Recibir la misión', hojas: [{ id: 'lineaTiempo', num: 'F1·P5', nom: 'Línea Inicial de Tiempo', compartida: 'g3' }, { id: 'libreto', num: 'F4·P2', nom: 'Libreto' }] }],
  g1: [{ nom: 'Análisis', hojas: [{ id: 'apPersonal', num: 'F2·P1', nom: 'Apreciación de Personal' }, { id: 'verG3', num: '—', nom: 'Ver la hoja del G-3', tipo: 'remite' }] }],
  g2: [{ nom: 'Definir el ambiente', hojas: [{ id: 'ht1', num: 'H.T. 1', nom: 'Características del ambiente' }] }],
  g3: [{ nom: 'Recibir la misión', hojas: [{ id: 'alerta', num: 'F1·P1', nom: 'Orden de Alerta' }, { id: 'lineaTiempo', num: 'F1·P5', nom: 'Línea Inicial de Tiempo' }] }],
  g4: [{ nom: 'Análisis', hojas: [{ id: 'apLog', num: 'F2·P1', nom: 'Apreciación Logística' }] }],
  g5: [],
  eme: [],
}

// El ejercicio del JEM y los archivos de los G (la foto que baja «💾 Guardar como»).
const jem = () => ({
  nombre: 'CE-I',
  puestoActivo: 'jem',
  hojasG: { g1: {}, g4: { apLog: { a: 'G-4 del JEM' } }, g5: {}, cmte: {}, jem: { libreto: { x: 'del JEM' } }, eme: {} },
  picb: { ht1: [{ Característica: 'GEOGRAFÍA', Descripción: 'G-2 VIEJO' }] },
  g3: { lineaTiempo: [{ act: 'D-3' }] },
  unidades: [{ id: 'u1' }],
  documentos: [{ nombre: 'ORDEN.pdf', texto: 'orden' }],
})
const deG1 = () => ({
  nombre: 'CE-I',
  puestoActivo: 'g1',
  hojasG: { g1: { apPersonal: { efectivos: '1200' } }, g4: { apLog: { a: 'copia VIEJA del G-4' } }, jem: {} },
  picb: { ht1: [{ Característica: 'GEOGRAFÍA', Descripción: 'G-2 VIEJO' }] },
  g3: { lineaTiempo: [{ act: 'D-5 (vieja)' }] },
  unidades: [{ id: 'u1' }, { id: 'u2' }],
  documentos: [{ nombre: 'ORDEN.pdf', texto: 'orden' }, { nombre: 'CUADRO G-1.xlsx', texto: 'efectivos' }],
})
const deG2 = () => ({ nombre: 'CE-I', puestoActivo: 'g2', hojasG: {}, picb: { ht1: [{ Característica: 'GEOGRAFÍA', Descripción: 'G-2 NUEVO' }] }, g3: {} })

caso('el índice pone cada hoja donde vive y la compartida con el G-3 es de quien la declara', () => {
  const h = I.indice(CAT)
  const por = Object.fromEntries(h.map((x) => [x.clave, x]))
  assert.equal(por['g3/lineaTiempo'].seccion, 'jem', 'la Línea de Tiempo es del JEM aunque se guarde en g3')
  assert.equal(por['g3/guiaInicial'].seccion, 'cmte')
  assert.equal(por['g3/alerta'].seccion, 'g3')
  assert.equal(por['picb/ht1'].seccion, 'g2')
  assert.equal(por['hojasG/g1/apPersonal'].seccion, 'g1')
  assert.equal(h.filter((x) => x.clave === 'g3/lineaTiempo').length, 1, 'una sola vez')
  assert.ok(!por['hojasG/g1/verG3'], 'las que sólo remiten a otra sección no se listan')
})

caso('comparar: sólo lo que el archivo trae escrito, y si es nuevo, distinto o igual', () => {
  const it = Object.fromEntries(I.comparar(jem(), deG1(), CAT).map((x) => [x.clave, x]))
  assert.equal(it['hojasG/g1/apPersonal'].estado, 'nueva')
  assert.equal(it['hojasG/g4/apLog'].estado, 'distinta')
  assert.equal(it['picb/ht1'].estado, 'igual')
  assert.equal(it['g3/lineaTiempo'].estado, 'distinta')
  assert.equal(it['carta/unidades'].estado, 'distinta')
  assert.equal(it['documentos/ORDEN.pdf'].estado, 'igual')
  assert.equal(it['documentos/CUADRO G-1.xlsx'].estado, 'nueva')
  assert.ok(!it['hojasG/jem/libreto'], 'lo que el archivo trae vacío no aparece')
})

caso('igual aunque las claves vengan en otro orden', () => {
  assert.equal(I.canon({ b: 1, a: [{ y: 2, x: 1 }] }), I.canon({ a: [{ x: 1, y: 2 }], b: 1 }))
})

caso('el archivo del G-1 trae marcadas SÓLO las hojas del G-1: no cruza la copia vieja del G-4 ni la Línea de Tiempo', () => {
  const marcadas = I.comparar(jem(), deG1(), CAT).filter((x) => I.sugerida(x, 'g1', 'jem')).map((x) => x.clave)
  assert.deepEqual(marcadas.sort(), ['documentos/CUADRO G-1.xlsx', 'hojasG/g1/apPersonal'])
})

caso('el integrado del JEM trae al G-1 las hojas de los demás, nunca las suyas', () => {
  const g1 = deG1()
  const integrado = I.integrar(jem(), [{ item: I.comparar(jem(), deG2(), CAT).find((x) => x.clave === 'picb/ht1') }]).datos
  const l = I.comparar(g1, integrado, CAT)
  const marcadas = l.filter((x) => I.sugerida(x, 'jem', 'g1')).map((x) => x.clave).sort()
  assert.ok(marcadas.includes('picb/ht1'), 'la H.T. 1 nueva del G-2')
  assert.ok(marcadas.includes('hojasG/g4/apLog'), 'la del G-4')
  assert.ok(marcadas.includes('hojasG/jem/libreto'), 'la del JEM')
  assert.ok(!marcadas.some((c) => c.startsWith('hojasG/g1/')), 'ninguna del G-1')
  assert.ok(!marcadas.some((c) => c.startsWith('carta/')), 'la carta nunca sola')
})

caso('integrar pone cada hoja en su lugar y no toca lo demás ni el original', () => {
  const base = jem()
  const antes = JSON.stringify(base)
  const items = I.comparar(base, deG1(), CAT)
  const eleg = items.filter((x) => ['hojasG/g1/apPersonal', 'documentos/CUADRO G-1.xlsx'].includes(x.clave)).map((item) => ({ clave: item.clave, item }))
  const r = I.integrar(base, eleg)
  assert.equal(JSON.stringify(base), antes, 'el ejercicio de partida no se modifica')
  assert.deepEqual(r.datos.hojasG.g1.apPersonal, { efectivos: '1200' })
  assert.deepEqual(r.datos.hojasG.g4.apLog, { a: 'G-4 del JEM' }, 'la del G-4 sigue siendo la del JEM')
  assert.deepEqual(r.datos.g3.lineaTiempo, [{ act: 'D-3' }], 'la Línea de Tiempo del JEM no se pisa')
  assert.deepEqual(r.datos.hojasG.jem.libreto, { x: 'del JEM' })
  assert.deepEqual(r.datos.unidades, [{ id: 'u1' }], 'la carta no se toca')
  assert.deepEqual(r.datos.documentos.map((d) => d.nombre), ['ORDEN.pdf', 'CUADRO G-1.xlsx'])
  r.datos.hojasG.g1.apPersonal.efectivos = 'X'
  assert.equal(items.find((x) => x.clave === 'hojasG/g1/apPersonal').valor.efectivos, '1200', 'copia, no comparte objetos con el archivo')
})

caso('integrar crea la sección si el ejercicio todavía no la tenía, y reemplaza el documento del mismo nombre', () => {
  const base = { nombre: 'CE-I', documentos: [{ nombre: 'A.txt', texto: 'viejo' }] }
  const arch = { hojasG: { eme: { x: 'hoja del EME' } }, documentos: [{ nombre: 'A.txt', texto: 'nuevo' }] }
  const r = I.integrar(base, I.comparar(base, arch, CAT).map((item) => ({ clave: item.clave, item })))
  assert.equal(r.datos.hojasG.eme.x, 'hoja del EME')
  assert.deepEqual(r.datos.documentos, [{ nombre: 'A.txt', texto: 'nuevo' }])
})

caso('de quién es el archivo: el puesto con que se trabajó o su nombre', () => {
  assert.equal(I.deQuien({ puestoActivo: 'g4' }, 'x.json'), 'g4')
  assert.equal(I.deQuien({}, 'EJERCICIO_CE-I_G-2_2026-10-30_1015.json'), 'g2')
  assert.equal(I.deQuien({}, 'g5 ce-i.json'), 'g5')
  assert.equal(I.deQuien({}, 'INTEGRADO-JEM_CE-I_2026-10-30_1200.json'), 'jem')
  assert.equal(I.deQuien({}, 'EJERCICIO_CE-I_2026-10-30_1015.json'), '', 'sin pistas no se adivina')
  assert.equal(I.deQuien({ puestoActivo: 'otro' }, 'cmte.json'), 'cmte')
})

caso('sin dueño elegido no se marca nada salvo documentos nuevos; lo igual nunca', () => {
  const l = I.comparar(jem(), deG1(), CAT)
  assert.deepEqual(l.filter((x) => I.sugerida(x, '', 'jem')).map((x) => x.clave), ['documentos/CUADRO G-1.xlsx'])
  assert.ok(!l.filter((x) => x.estado === 'igual').some((x) => I.sugerida(x, 'g2', 'jem')))
})

caso('el archivo integrado se llama INTEGRADO-JEM_<ejercicio>_<fecha>_<hora>.json', () => {
  assert.equal(I.archivoIntegrado('CE I / 2', new Date(2026, 9, 30, 9, 5).getTime()), 'INTEGRADO-JEM_CE_I_-_2_2026-10-30_0905.json')
})

console.log('\nTodos los casos pasan.')
