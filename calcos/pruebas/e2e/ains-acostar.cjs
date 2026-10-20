// ◎ Acostar las A.I.N. de la H.T. 20 (index-ains-acostar-20261020.js), en la Mesa real (Chromium).
// El caso de Sergio: la IA le hizo la H.T. 20 con «AIN-2», «AIN-3»… y el lugar sólo en el indicador
// («ruta Putre – Guallatire», «vados de Ungallire – Guata»); apretó «◎ Acostar las A.I.N.» y en la
// carta no apareció ninguna (la Mesa pasaba a «ubicar a mano, una por una»).
//   · las cuatro quedan sobre la carta (ops.ains), repartidas sobre las avenidas del CMOC;
//   · el aviso lo dice y el panel ya no pide tocarlas en la carta;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/ains-acostar.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-ains-acostar')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')

const fila = (n, indicador, probable, peligroso) => ({ 'N° A.I.N.': n, 'No antes de': 'D-3 (0600)', 'No después de': 'D+2 (1800)', 'Indicador (evento)': indicador, 'CAE más probable': probable, 'CAE más peligroso': peligroso })
const HT20 = [
  fila('AIN-2', 'Movimiento de columnas blindadas y convoyes logísticos de la 1ª Br. Ac. sobre la ruta Putre – Guallatire.', 'Penetración por el valle del río Lauca hacia Turco y Huachacalla.', 'Viraje de flanqueo al norte por el río Sajama.'),
  fila('AIN-3', 'Despliegue del Pelotón de Reconocimiento Blindado (M113) en vados de Ungallire – Guata.', 'Irrupción de la vanguardia del BIB N° 27 sobre el paso del río Lauca.', 'Reconocimiento de vados alternativos sobre el río Sajama.'),
  fila('AIN-5', 'Infiltración de patrullas de Comandos al sur del Volcán Puquintica (eje Julo – Bella Vista).', 'Ataque secundario de fijación.', 'Envolvimiento profundo del flanco sur.'),
  fila('AIN-1', 'Fuegos de saturación sobre posiciones de la DIV MEC-1 en Tambo Quemado.', 'Fijación en Tambo Quemado – Chungará.', 'Esfuerzo principal sobre el eje Tambo Quemado – Patacamaya.'),
]
const leerAins = (page) =>
  estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.objetivos) && Array.isArray(v.limites) ? JSON.parse(JSON.stringify(v.ains || [])) : undefined))
async function esperar(page, leer, cumple, ms = 20000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await page.waitForTimeout(250)
  }
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const datos = ejercicioPersonal({ nombre: 'PRUEBA A.I.N. (FICT.)' })
  const av = (lat) => {
    const c = []
    for (let lng = -69.0; lng <= -67.6; lng += 0.05) c.push([+lng.toFixed(3), lat])
    return { coords: c, escalon: 'batallon', bando: 'enemigo' }
  }
  datos.cmoc = { restringido: [], severo: [], clave: [], defensivo: [], ae: [], corredores: [], avenidas: [av(-16.95), av(-17.1), av(-17.25)], desplazamientos: [] }
  datos.picb = { ht20: HT20 }
  try {
    await sembrarYAbrir(page, datos)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-2 INTELIGENCIA/i }).first())
    await page.getByText('🔎 PICB — las 4 fases del G-2').waitFor({ timeout: 15000 })
    await clic(page.getByText('Desarrollar los cursos de acción del enemigo').first())
    await page.waitForTimeout(400)
    await clic(page.getByText('H.T. 20', { exact: true }).first())
    const acostar = page.getByRole('button', { name: /Acostar las 4 A\.I\.N\. de esta hoja sobre el calco/ }).first()
    await acostar.waitFor({ timeout: 10000 })
    assert.deepEqual(await leerAins(page), [], 'antes no hay A.I.N.')
    await clic(acostar)
    const ains = await esperar(page, leerAins, (a) => a.length >= 4)
    assert.deepEqual(ains.map((a) => a.nom), ['AIN-2', 'AIN-3', 'AIN-5', 'AIN-1'], 'las cuatro de la hoja quedan sobre la carta')
    for (const a of ains) {
      assert.ok(Array.isArray(a.centro) && a.centro[0] > -69.1 && a.centro[0] < -67.5 && a.centro[1] < -16.9 && a.centro[1] > -17.3, `${a.nom} sobre una avenida: ${a.centro}`)
      assert.ok(a.indicador && a.porQue, `${a.nom} lleva su indicador y su porqué`)
    }
    await page.getByText(/4 A\.I\.N\. sobre la carta/).first().waitFor({ timeout: 5000 })
    assert.equal(await page.getByText(/Ubicando las A\.I\.N\. de la hoja/).count(), 0, 'no pasa a ubicarlas a mano')
    await page.getByText(/Las 4 A\.I\.N\. de la hoja ya están sobre el calco/).first().waitFor({ timeout: 5000 })
    await page.screenshot({ path: path.join(SALIDAS, '1-ains-sobre-la-carta.png') })
    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('OK: las A.I.N. de la H.T. 20 sin lugar del CMOC en el nombre quedan sobre la carta.')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
