// 📄 La Orden del escalón superior sale de los documentos del ejercicio
// (index-orden-documentos-20261019.js), en la Mesa real (Chromium). Lo pidió Sergio con la captura
// de la F1·P7 Orden Preparatoria N° 1: «Todavía no hay nada en el calco para sembrar esta hoja»
// teniendo la Orden cargada: «los documentos que yo cargo… esos deben ser la fuente de información».
//   · un ejercicio con la Orden (.md, sin membrete) y un anexo cargados, sin fichas ni MESA EM llena;
//   · la Orden del escalón superior se llena sola (lo que estaba escrito no se pisa) y se guarda;
//   · G-3 → Documentos → F1·P7: «🌱 Traer del calco lo que falte» llena misión, situación y
//     coordinación con lo de la Orden; sin errores de consola.
//   node calcos/pruebas/e2e/orden-documentos.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, leerGuardado, estadoReact } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-orden-documentos')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')

const ORDEN_MD = [
  'ORDEN DE OPERACIONES No. 01', '',
  'OBJETO: Operaciones defensivas (FICT.).',
  'CARTA: ESPECIAL, Esc. 1:250.000.', '',
  'I.- SITUACIÓN.',
  'A.- Fuerzas enemigas. Ver Anexo “B”.', 'El enemigo (FICT.) tiene dos brigadas acorazadas.',
  'B.- Fuerzas propias.', '1.- CTO. Misión: rechazar al enemigo (FICT.).',
  'C.- Refuerzos y reducciones.', 'La DIV-1 pasa al CE-I el D-15 (FICT.).', '',
  'II.- MISIÓN.', 'Las FF.TT. (FICT.) defienden, a partir del D (0400) y hasta el D+15 (1800), el sector X.', '',
  'III.- EJECUCIÓN.',
  'Intención del Comandante. Propósito: detener al enemigo (FICT.).',
  'A.- Concepto de la operación. Defensa de área en dos sectores (FICT.).',
  'B.- Tareas de las unidades de maniobra.',
  '1.- CE-I (DIV-1, DIV-6; GALM-1 en refuerzo).',
  'a.- Defiende el AO LAUCA, a partir del D (0400) y hasta el D+15 (1800), con el propósito de impedir la penetración (FICT.).',
  'b.- Límites del AO LAUCA: norte, río X; sur, río Y (FICT.).',
  '2.- CE-II (DIV-2, DIV-9). Defiende el AO PISIGA, a partir del D (0400) y hasta el D+15 (1800) (FICT.).',
  'D.- Instrucciones de coordinación.', '1.- Hora o condición en que la orden entra en vigor. A la recepción de la presente (FICT.).', '',
  'IV.- APOYO DE SERVICIO.', 'Ver Anexo “G”.', '',
  'V.- COMANDO Y COMUNICACIONES.', 'A.- Comando.', '1.- PC principal en Pueblo-X (FICT.).',
].join('\n')
const ANEXO = ['CTO', 'FF.TT. (FICT.)', 'CG. Pueblo-X. D-44 (0900)', 'EMO/SEC-I', 'ANEXO “H” (Plan de Personal) A LA ORDEN DE OPERACIONES No. 01', 'Texto del anexo. '.repeat(20)].join('\n')

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const datos = ejercicioPersonal({ nombre: 'PRUEBA ORDEN DOCS (FICT.)' })
  datos.documentos = [
    { nombre: 'ORDEN DE OPERACIONES No 01.md', categoria: 'orden', tipo: 'texto', texto: ORDEN_MD },
    { nombre: 'Anexo H - Plan de Personal.md', categoria: 'orden', tipo: 'texto', texto: ANEXO },
  ]
  // Como en el ejercicio de Sergio: MESA EM casi vacía; sólo la unidad (y un casillero escrito a mano).
  datos.ordenSup = { unidad: 'CE-I', clasificacion: 'RESERVADO', carta: 'MI CARTA A MANO', mision: '', enemigo: '', escalonSuperior: '' }
  datos.g3 = {}
  try {
    await sembrarYAbrir(page, datos)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})

    // La Orden del escalón superior se llenó sola con la Orden cargada.
    const os = await estadoReact(page, (v) => (v && !Array.isArray(v) && 'escalonSuperior' in v && 'vigencia' in v && 'unidad' in v ? v : undefined))
    assert.ok(os, 'no encontré la Orden del escalón superior en el estado')
    assert.match(os.mision || '', /^El CE-I defiende el AO LAUCA/, `misión: ${os.mision}`)
    assert.equal(os.escalonSuperior, 'FF.TT. (FICT.)')
    assert.equal(os.vigencia, 'D-44 (0900)')
    assert.match(os.enemigo || '', /dos brigadas acorazadas/)
    assert.equal(os.carta, 'MI CARTA A MANO', 'lo escrito a mano no se pisa')
    assert.equal(os.clasificacion, 'RESERVADO')

    // G-3 → Documentos → F1·P7 Orden Preparatoria N° 1 → 🌱
    await clic(page.getByRole('button', { name: /G-3/ }).first())
    await page.waitForTimeout(800)
    await clic(page.getByRole('button', { name: /^\W*Documentos$/ }).first())
    await page.waitForTimeout(800)
    await clic(page.getByRole('button', { name: /F1·P7\s*Orden Preparatoria N° 1/ }).first())
    const sembrar = page.getByRole('button', { name: /Traer del calco lo que falte/ }).first()
    await sembrar.waitFor({ timeout: 15000 })
    let alerta = null
    page.once('dialog', (d) => (alerta = d.message()))
    await clic(sembrar)
    await page.waitForTimeout(1500)
    assert.ok(!alerta || !/Todavía no hay nada/.test(alerta), `salió el aviso: ${alerta}`)
    const valores = await page.locator('textarea, input').evaluateAll((xs) => xs.map((x) => x.value).join('\n'))
    assert.match(valores, /El CE-I defiende el AO LAUCA/, 'la misión entra en la Orden Preparatoria')
    assert.match(valores, /dos brigadas acorazadas/, 'el enemigo entra en la Orden Preparatoria')
    assert.match(valores, /CE-I: DIV-1, DIV-6; GALM-1 en refuerzo/, 'la organización de la tarea entra en ORGANIZACIÓN (MEDIOS)')
    await page.screenshot({ path: path.join(SALIDAS, 'f1p7-sembrada.png') })

    await page.waitForTimeout(3500)
    const g = await leerGuardado(page, datos.nombre)
    assert.match(g?.ordenSup?.mision || '', /^El CE-I defiende/, 'la Orden completada quedó guardada')
    assert.ok(g?.ordenSup?._desdeDocs?.mision, 'queda anotado de qué documento salió')
    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('OK: la Orden del escalón superior se llena con la Orden cargada (sin pisar lo escrito) y la F1·P7 se siembra con eso.')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
