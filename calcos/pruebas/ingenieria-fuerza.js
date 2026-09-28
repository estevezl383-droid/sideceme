// Cuánto tardan los trabajos de ingeniería con la ingeniería que tenemos.
//
// Corre, TEXTUALMENTE, las funciones del compilado que carga calcos/index.html
// (fuerzaIngenieria, leerIngenieriaDoc, ingTiempo, b0 y lo que usan) sobre la
// Organización de la tarea de la OGO 01/35 del ejercicio «ARMAS», tal como la
// guarda la Mesa: la tabla en Markdown (el .docx.md) y el texto plano del Word.
//
//   node ingenieria-fuerza.js [compilado.js]
const assert = require('assert')
const { vigente, cargar } = require('./extraer')

const archivo = process.argv[2] || vigente()
const m = cargar(archivo, ['ING_CLASE', 'ingNorm', 'ingEscalon', 'ingEsElemento', 'ingTrozos', 'leerIngenieriaDoc', 'ingNomDoc', 'fuerzaIngenieria', 'ingN', 'ingTiempo', 'ingHoras', 'UCe', 'qCe', 'b0', 'Lae', 'mD', 'jae', 'L7', 'pD', 'j7', 'k7', 'fD', 'R7', 'O7', 'NCe', 'eye', 'tye', 'Rae', 'Oae', 'T7', 'LCe', 'DCe', 'M7', 'P7', 'd5', 'nye', 'aye', 'Q0e'])

let fallas = 0
function caso(nombre, fn) {
  try {
    fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.message).split('\n').join('\n      ')}`)
  }
}

// ── Los documentos ──
const { OGO_MD, OGO_WORD } = require('./ogo-organizacion')

const ANEXO_B = 'ANEXO «B» (INTELIGENCIA)\nFuerzas del enemigo\nCía. de Ingenieros Mecanizados «ACONCAGUA»\nCompañía de Ingenieros\n' + 'x'.repeat(60)

const doc = (nombre, categoria, texto) => ({ nombre, categoria, tipo: 'texto', texto })
const ingCalco = { id: 'u-ing', bando: 'propias', tipo: 'unidad', arma: 'ingenieria', escalon: 'regimiento', designacion: '' }
const infCalco = { id: 'u-inf', bando: 'propias', tipo: 'unidad', arma: 'infanteria', escalon: 'regimiento' }
const ingEnemiga = { id: 'u-eno', bando: 'enemigo', tipo: 'unidad', arma: 'ingenieria', escalon: 'compania' }

// Lo que devuelve el compilado vive en otro contexto (vm): se compara en JSON.
const plano = (x) => JSON.parse(JSON.stringify(x))
const nombres = (lista) => plano(lista.map((x) => x.nom))

console.log(`\nCompilado: ${archivo.replace(/.*calcos\//, 'calcos/')}\n`)

caso('OGO en Markdown: el BATING. MEC.-II «ROMÁN» con sus compañías, y cuáles construyen obstáculos', () => {
  const r = m.leerIngenieriaDoc(OGO_MD)
  assert.deepStrictEqual(nombres(r.unidades), ['BATING. MEC.- II “ROMAN”'])
  assert.deepStrictEqual(
    plano(r.elementos.map((e) => [e.nom, e.clase, e.secciones])),
    [
      ['Comp. Ing. Comb. “A”', 'combate', 3],
      ['Comp. Ing. Comb. “B”', 'combate', 3],
      ['Comp. Ing. Eq. Pes.', 'equipo', 0],
      ['Comp. Ing. Puentes', 'puentes', 0],
      ['Comp. Mtto. Ing.', 'mtto', 0],
    ],
  )
  assert.strictEqual(r.secciones, 6)
  assert.strictEqual(r.equipo, true)
  assert.strictEqual(r.porEscalon, false)
})

caso('La ingeniería del ENEMIGO (párrafo «Fuerzas enemigas») no cuenta', () => {
  const r = m.leerIngenieriaDoc(OGO_MD)
  assert.ok(!JSON.stringify(r).includes('ACONCAGUA'), 'se coló la Cía. ACONCAGUA')
  assert.ok(!JSON.stringify(r).includes('barreminas'), 'se coló la Cía. de Ingenieros de RAGNAR')
})

caso('OGO en texto de Word: lo mismo, sin contar dos veces la compañía nombrada en una frase', () => {
  const r = m.leerIngenieriaDoc(OGO_WORD)
  assert.deepStrictEqual(nombres(r.unidades), ['BATING. MEC.- II “ROMAN”'])
  assert.deepStrictEqual(nombres(r.elementos), ['Comp. Ing. Comb. “A”', 'Comp. Ing. Comb. “B”', 'Comp. Ing. Eq. Pes.', 'Comp. Ing. Puentes', 'Comp. Mtto. Ing.'])
  assert.strictEqual(r.secciones, 6)
})

caso('«ARMAS»: la orden manda sobre la ficha de ingeniería del calco (6 secciones, no 9)', () => {
  // Así están guardados los dos documentos del ejercicio.
  const docs = [doc('1.- OGO 01-35 (PICB).docx.md', 'orden', OGO_MD), { ...doc('1.- OGO 01-35 (PICB).docx', null, OGO_WORD), tipo: 'word' }]
  const fi = m.fuerzaIngenieria(docs, [ingCalco, infCalco, ingEnemiga], null)
  assert.strictEqual(fi.fuente, 'orden')
  assert.strictEqual(fi.documento, '1.- OGO 01-35 (PICB)')
  assert.strictEqual(fi.secciones, 6)
  assert.strictEqual(fi.seccionesOrden, 6)
  assert.strictEqual(fi.seccionesCalco, 9)
  assert.strictEqual(fi.calco.unidades.length, 1, 'la ficha enemiga no es nuestra')
  assert.strictEqual(fi.equipo, true)
  assert.strictEqual(fi.nomEquipo, 'Comp. Ing. Eq. Pes.')
  assert.strictEqual(fi.manual, false)
})

caso('El Anexo de Inteligencia nunca se lee como fuerza propia', () => {
  const fi = m.fuerzaIngenieria([doc('Anexo B Inteligencia.docx', 'anexoicia', ANEXO_B), doc('Anexo B.docx', null, ANEXO_B)], [], null)
  assert.strictEqual(fi.fuente, 'supuesta')
  assert.strictEqual(fi.orden, null)
  assert.strictEqual(fi.secciones, 1)
})

caso('Sin documentos: la ficha de ingeniería del calco (regimiento = 9 secciones, por el escalón)', () => {
  const fi = m.fuerzaIngenieria([], [ingCalco, infCalco], null)
  assert.strictEqual(fi.fuente, 'calco')
  assert.strictEqual(fi.secciones, 9)
  assert.strictEqual(fi.supuesta, false)
})

caso('Sin documentos ni ficha: 1 sección supuesta (y lo avisa)', () => {
  const fi = m.fuerzaIngenieria([], [infCalco, ingEnemiga], null)
  assert.strictEqual(fi.fuente, 'supuesta')
  assert.strictEqual(fi.supuesta, true)
  assert.strictEqual(fi.secciones, 1)
})

caso('Lo escrito a mano en «Secciones al trabajo» manda (y se sabe qué dice la orden)', () => {
  const fi = m.fuerzaIngenieria([doc('OGO.docx.md', 'orden', OGO_MD)], [], 4)
  assert.strictEqual(fi.secciones, 4)
  assert.strictEqual(fi.manual, true)
  assert.strictEqual(fi.seccionesOrden, 6)
  assert.strictEqual(m.fuerzaIngenieria([doc('OGO.docx.md', 'orden', OGO_MD)], [], null).secciones, 6)
})

caso('Una orden que sólo nombra el batallón: se estima por el escalón (9 secciones)', () => {
  const r = m.leerIngenieriaDoc('ORGANIZACIÓN DE LA TAREA.\nBAT. ING. 1 «PIONEROS»\nRIM-8 «AYACUCHO»')
  assert.deepStrictEqual(nombres(r.unidades), ['BAT. ING. 1 «PIONEROS»'])
  assert.strictEqual(r.porEscalon, true)
  assert.strictEqual(r.secciones, 9)
})

caso('Compañía y sección de ingenieros escritas con todas las letras', () => {
  const r = m.leerIngenieriaDoc('Refuerzos y reducciones.\nCompañía de Ingenieros de Combate «A»\nSección de Ingenieros «B»\nCía. Ing. Puentes')
  assert.deepStrictEqual(plano(r.elementos.map((e) => [e.clase, e.secciones])), [['combate', 3], ['combate', 1], ['puentes', 0]])
  assert.strictEqual(r.secciones, 4)
})

caso('Una orden que sólo trae puentes: no hay quién construya; se usa el calco', () => {
  const fi = m.fuerzaIngenieria([doc('OGO.docx.md', 'orden', 'ORGANIZACIÓN DE LA TAREA.\nComp. Ing. Puentes\n' + 'x'.repeat(50))], [ingCalco], null)
  assert.strictEqual(fi.seccionesOrden, null)
  assert.strictEqual(fi.fuente, 'calco')
  assert.strictEqual(fi.secciones, 9)
})

caso('El tiempo se dice en horas, jornadas de 10 h y días de 24 h', () => {
  assert.deepStrictEqual(plano(m.ingTiempo(62)), { horas: '62', jornadas: '6,2', diasTrabajo: 7, dias24: '2,6' })
  assert.deepStrictEqual(plano(m.ingTiempo(374)), { horas: '374', jornadas: '37,4', diasTrabajo: 38, dias24: '15,6' })
  assert.deepStrictEqual(plano(m.ingTiempo(0)), { horas: '0', jornadas: '0', diasTrabajo: 0, dias24: '0' })
})

caso('Cada trabajo en horas; si es menos de una hora, en minutos (un bloqueo con 6 secciones no es «0 h»)', () => {
  assert.strictEqual(m.ingHoras(44.2), '44 h')
  assert.strictEqual(m.ingHoras(6.24), '6,2 h')
  assert.strictEqual(m.ingHoras(3 / 180), '1 min')
  assert.strictEqual(m.ingHoras(0.5), '30 min')
  assert.strictEqual(m.ingHoras(0), '0 h')
})

caso('El plan de «ARMAS» (2 zanjas antitanque y 8 bloqueos): 374 h con 1 sección → 62 h con las 6 del BATING', () => {
  // Largos de las dos zanjas de «ARMAS» (3233 m y 1248 m) y ocho bloqueos.
  const trabajos = [
    { ob: { tipo: 'zanja_at' }, etiqueta: 'ZANJA AT', largoM: 3233 },
    { ob: { tipo: 'zanja_at' }, etiqueta: 'ZANJA AT', largoM: 1248 },
    ...Array.from({ length: 8 }, () => ({ ob: { tipo: 'bloqueo' }, etiqueta: 'BLOQUEO' })),
  ]
  const con1 = m.b0(trabajos, { efectivoSeccion: 30, secciones: 1 })
  assert.strictEqual(con1.horas, 374, 'con 1 sección tenía que dar lo que mostraba la barra')
  const fi = m.fuerzaIngenieria([doc('OGO.docx.md', 'orden', OGO_MD)], [ingCalco], null)
  const con6 = m.b0(trabajos, { efectivoSeccion: 30, secciones: fi.secciones })
  assert.strictEqual(con6.horas, 62)
  assert.strictEqual(con6.hh, con1.hh, 'los hombres-hora no cambian: cambia quién los pone')
  assert.deepStrictEqual(plano(m.ingTiempo(con6.horas)), { horas: '62', jornadas: '6,2', diasTrabajo: 7, dias24: '2,6' })
  // Con las máquinas de la Cía. Ing. Eq. Pes. (zanja al 10 %, bloqueo al 40 %).
  const maq = m.b0(trabajos, { efectivoSeccion: 30, secciones: 6, conMaquinaria: true })
  assert.ok(maq.horas < 10, `con equipo tenía que bajar mucho (dio ${maq.horas} h)`)
})

console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
process.exit(fallas ? 1 : 0)
