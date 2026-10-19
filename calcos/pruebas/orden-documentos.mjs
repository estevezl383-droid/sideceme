// 📄 La Orden del escalón superior sale de los documentos del ejercicio (calcos/orden-documentos),
// sin navegador. Textos FICTICIOS con la forma de la Orden de la Escuela: como la extrae la Mesa de
// un Word (membrete arriba, títulos sin numeración) y como viene en un .md («I.- SITUACIÓN.»,
// «A.- Fuerzas enemigas. Ver…», «1.- CE-I (…).», «a.- Defiende…»).
//   node orden-documentos.mjs
import assert from 'node:assert/strict'
import { leerOrden, completarOrdenSup } from '../orden-documentos/v1/orden.mjs'

const WORD = [
  'CTO', 'FF.TT. (FICT.)', 'CG. Pueblo-X. D-44 (0900)', 'EMO/SEC-III', 'No. 001/XYZ.',
  'ORDEN DE OPERACIONES No. 01',
  '\t\tOBJETO\t:\tOperaciones defensivas (FICT.).',
  '\t\tCARTA\t:\tESPECIAL, Esc. 1:250.000.',
  'ORGANIZACIÓN DE LA TAREA:', 'CE-I', 'CE-II', '\t-\tDIV-1', '\t-\tDIV-2',
  'SITUACIÓN.',
  'Fuerzas enemigas.', 'Ver Anexo «B». El enemigo (FICT.) tiene dos brigadas acorazadas.',
  'Curso de acción más probable.', 'Ataca por el valle del río X (FICT.).',
  'Curso de acción más peligroso.', 'Ataca por el norte hacia la capital (FICT.).',
  'Fuerzas propias.', 'CTO.', 'Misión: rechazar al enemigo (FICT.).',
  'Refuerzos y reducciones.', 'La DIV-1 pasa al CE-I el D-15 (FICT.).',
  'MISIÓN.', 'Las FF.TT. (FICT.) defienden, a partir del D (0400) y hasta el D+15 (1800), el sector X.',
  'EJECUCIÓN.',
  'Intención del Comandante.', 'Propósito: detener al enemigo al oeste de la LDE-2 (FICT.).',
  'Concepto de la operación.', 'Defensa de área en dos sectores (FICT.).',
  'Maniobra.', 'Operación decisiva: el CE-II (FICT.).',
  'Apoyo de fuegos.', 'Tarea: neutralizar la artillería enemiga (FICT.).',
  'Tareas de las unidades de maniobra.',
  'CE-I (DIV-1, DIV-6; GALM-1 en refuerzo).',
  'Defiende el AO LAUCA, a partir del D (0400) y hasta el D+15 (1800), con el propósito de impedir la penetración (FICT.).',
  'Límites del AO LAUCA:', 'norte, río X; sur, río Y (FICT.).',
  'Recibe un escuadrón de drones del Rgto.', 'UAV-3 en apoyo directo desde el D-3 (0600).',
  'Estar preparado para:', '1) contraatacar hacia el sur (FICT.); 2) dar paso a la reserva.',
  'CE-II (DIV-2, DIV-9).',
  'Esfuerzo principal. Defiende el AO PISIGA, a partir del D (0400) y hasta el D+15 (1800) (FICT.).',
  'Reserva (RIAEROTRANS-18).', 'En zona de reunión en Pueblo-Z (FICT.).',
  'Tareas de las unidades de apoyo de combate.',
  'GALM-1.', 'En refuerzo al CE-I desde el D-15 (0600).',
  'Bat. Com. I. Instala y opera el sistema de comunicaciones (FICT.).',
  'Instrucciones de coordinación.', 'Hora o condición en que la orden entra en vigor.', 'A la recepción de la presente (FICT.).',
  'APOYO DE SERVICIO.', 'Ver Anexo «G».',
  'COMANDO Y COMUNICACIONES.',
  'Comando.', 'PC principal en Pueblo-X (FICT.).',
  'Comunicaciones.', 'IOC «ALFA» en vigencia desde el D-30 (0000).',
  'EL COMANDANTE DE LAS FF.TT. (FICT.)',
].join('\n')

const MD = [
  'ORDEN DE OPERACIONES No. 01', '',
  'OBJETO: Operaciones defensivas (FICT.).',
  'CARTA: ESPECIAL, Esc. 1:250.000 (hoja X).',
  'ORGANIZACIÓN DE LA TAREA:', 'CE-I: DIV-1; DIV-6', 'CE-II: DIV-2; DIV-9', '',
  'I.- SITUACIÓN.',
  'A.- Fuerzas enemigas. Ver Anexo “B”.', 'El enemigo (FICT.) tiene dos brigadas acorazadas.',
  '1.- Curso de acción más probable.', 'Ataca por el valle del río X (FICT.).',
  '2.- Curso de acción más peligroso.', 'Ataca por el norte hacia la capital (FICT.).',
  'B.- Fuerzas propias.', '1.- CTO. Misión: rechazar al enemigo (FICT.).',
  'C.- Refuerzos y reducciones.', 'La DIV-1 pasa al CE-I el D-15 (FICT.).', '',
  'II.- MISIÓN.', 'Las FF.TT. (FICT.) defienden, a partir del D (0400) y hasta el D\\+15 (1800), el sector X.', '',
  'III.- EJECUCIÓN.',
  'Intención del Comandante. Propósito: detener al enemigo (FICT.).',
  'A.- Concepto de la operación. Defensa de área en dos sectores (FICT.).',
  '1.- Maniobra. Operación decisiva: el CE-II (FICT.).',
  '2.- Apoyo de fuegos. Tarea: neutralizar la artillería (FICT.).',
  'B.- Tareas de las unidades de maniobra.',
  '1.- CE-I (DIV-1, DIV-6; GALM-1 en refuerzo).',
  'a.- Defiende el AO LAUCA, a partir del D (0400) y hasta el D+15 (1800), con el propósito de impedir la penetración (FICT.).',
  'b.- Límites del AO LAUCA: norte, río X; sur, río Y (FICT.).',
  'c.- Estar preparado para: 1) contraatacar hacia el sur (FICT.).',
  '2.- CE-II (DIV-2, DIV-9). Esfuerzo principal. Defiende el AO PISIGA, a partir del D (0400) y hasta el D+15 (1800) (FICT.).',
  'C.- Tareas de las unidades de apoyo de combate.',
  '1.- GALM-1. En refuerzo al CE-I desde el D-15 (0600).',
  'D.- Instrucciones de coordinación.', '1.- Hora o condición en que la orden entra en vigor. A la recepción de la presente (FICT.).', '',
  'IV.- APOYO DE SERVICIO.', 'Ver Anexo “G”.', '',
  'V.- COMANDO Y COMUNICACIONES.',
  'A.- Comando.', '1.- Puestos comando: PC principal en Pueblo-X (FICT.).',
  'B.- Comunicaciones.', '1.- IOC «ALFA» en vigencia desde el D-30 (0000).',
].join('\n')

const ANEXO = ['CTO', 'FF.TT. (FICT.)', 'CG. Pueblo-X. D-44 (0900)', 'EMO/SEC-I', 'ANEXO “H” (Plan de Personal) A LA ORDEN DE OPERACIONES No. 01', 'OBJETO: Apoyo de personal (FICT.).', 'Texto del anexo. '.repeat(20)].join('\n')

let fallas = 0
function caso(nombre, fn) {
  try {
    fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.message).split('\n').slice(0, 8).join('\n      ')}`)
  }
}

for (const [forma, texto] of [['Word', WORD], ['.md', MD]]) {
  const docs = [{ nombre: 'Anexo H.docx', categoria: 'orden', texto: ANEXO }, { nombre: `ORDEN ${forma}`, categoria: 'orden', texto }]
  const r = leerOrden(docs, { unidad: 'CE-I' })
  const c = r?.campos || {}
  caso(`${forma}: encuentra la Orden (no el anexo)`, () => assert.equal(r?.doc, `ORDEN ${forma}`))
  caso(`${forma}: membrete (del anexo si la Orden no lo trae)`, () => {
    assert.equal(c.escalonSuperior, 'FF.TT. (FICT.)')
    assert.equal(c.puestoMando, 'CG. Pueblo-X')
    assert.equal(c.vigencia, 'D-44 (0900)')
  })
  caso(`${forma}: número y carta`, () => {
    assert.equal(c.numero, '01')
    assert.match(c.carta, /^ESPECIAL, Esc\. 1:250\.000/)
  })
  caso(`${forma}: enemigo con sus dos CAE, sin las fuerzas propias`, () => {
    assert.match(c.enemigo, /dos brigadas acorazadas/)
    assert.match(c.enemigo, /Curso de acción más probable: Ataca por el valle/)
    assert.match(c.enemigo, /Curso de acción más peligroso: Ataca por el norte/)
    assert.doesNotMatch(c.enemigo, /rechazar/)
    assert.equal((c.enemigo.match(/dos brigadas/g) || []).length, 1, 'sin repetir el primer párrafo')
  })
  caso(`${forma}: propias con la misión del superior; «Misión:» del CTO no es el párrafo II`, () => {
    assert.match(c.propias, /^FF\.TT\. \(FICT\.\) \(escalón superior\)\. Misión: Las FF\.TT\. \(FICT\.\) defienden/)
    assert.match(c.propias, /rechazar al enemigo/)
  })
  caso(`${forma}: refuerzos, intención, concepto con la maniobra`, () => {
    assert.match(c.refuerzos, /La DIV-1 pasa al CE-I/)
    assert.match(c.intencion, /detener al enemigo/)
    assert.match(c.concepto, /Defensa de área/)
    assert.match(c.concepto, /Maniobra: Operación decisiva/)
    assert.doesNotMatch(c.concepto, /neutralizar la artillería/)
  })
  caso(`${forma}: nuestra misión es el párrafo del CE-I (no el del CE-II ni la del superior)`, () => {
    assert.match(c.mision, /^El CE-I defiende el AO LAUCA, a partir del D \(0400\) y hasta el D\+15 \(1800\)/)
    assert.equal(c.cuando, 'a partir del D (0400) y hasta el D+15 (1800)')
    assert.match(c.tareas, /Límites del AO LAUCA/)
    assert.match(c.tareas, /contraatacar hacia el sur/)
    assert.doesNotMatch(c.tareas, /PISIGA|Pueblo-Z/)
    assert.equal(c.organizacionTarea, 'CE-I: DIV-1, DIV-6; GALM-1 en refuerzo')
  })
  caso(`${forma}: coordinación, comando y comunicaciones`, () => {
    assert.match(c.coordinacion, /A la recepción de la presente/)
    assert.doesNotMatch(c.coordinacion, /Anexo «G»|Anexo “G”/)
    assert.match(c.comando, /PC principal en Pueblo-X/)
    assert.match(c.comunicaciones, /IOC «ALFA»/)
  })
  caso(`${forma}: «Esfuerzo principal.» no entra en la misión del CE-II`, () => {
    const r2 = leerOrden(docs, { unidad: 'CE-II' })
    assert.match(r2.campos.mision, /^El CE-II defiende el AO PISIGA/)
  })
  caso(`${forma}: una unidad de apoyo de combate (GALM-1)`, () => {
    const r3 = leerOrden(docs, { unidad: 'GALM-1' })
    assert.match(r3.campos.mision, /En refuerzo al CE-I|en refuerzo al CE-I/)
    assert.doesNotMatch(r3.campos.tareas || '', /Bat\. Com\./)
  })
}

caso('completar: llena los casilleros vacíos y no pisa lo escrito', () => {
  const os = { unidad: 'CE-I', carta: 'MI CARTA', mision: '', clasificacion: 'RESERVADO' }
  const n = completarOrdenSup(os, [{ nombre: 'ORDEN.docx', categoria: 'orden', texto: WORD }])
  assert.equal(n.carta, 'MI CARTA')
  assert.match(n.mision, /^El CE-I defiende/)
  assert.equal(n.escalonSuperior, 'FF.TT. (FICT.)')
  assert.equal(n._desdeDocs.mision, 'ORDEN.docx')
  assert.equal(n._desdeDocs.carta, undefined)
})
caso('completar: si ya está todo, devuelve null (no hay bucle)', () => {
  const docs = [{ nombre: 'ORDEN.docx', categoria: 'orden', texto: WORD }]
  const n = completarOrdenSup({ unidad: 'CE-I' }, docs)
  assert.equal(completarOrdenSup(n, docs), null)
})
caso('completar: lo que el oficial borró después no vuelve', () => {
  const docs = [{ nombre: 'ORDEN.docx', categoria: 'orden', texto: WORD }]
  const n = completarOrdenSup({ unidad: 'CE-I' }, docs)
  assert.equal(completarOrdenSup({ ...n, mision: '' }, docs), null)
})
caso('completar: sin unidad, igual trae la Orden (sin la misión propia)', () => {
  const n = completarOrdenSup({}, [{ nombre: 'ORDEN.docx', categoria: 'orden', texto: WORD }])
  assert.equal(n.mision, undefined)
  assert.match(n.enemigo, /dos brigadas/)
})
caso('sin Orden entre los documentos (sólo anexos), no inventa nada', () => {
  assert.equal(leerOrden([{ nombre: 'Anexo H.docx', categoria: 'orden', texto: ANEXO }], { unidad: 'CE-I' }), null)
  assert.equal(completarOrdenSup({ unidad: 'CE-I' }, []), null)
})

if (fallas) {
  console.log(`\n${fallas} caso(s) fallaron.`)
  process.exit(1)
}
console.log('\nOK: la Orden del escalón superior sale de los documentos del ejercicio (Word y .md).')
