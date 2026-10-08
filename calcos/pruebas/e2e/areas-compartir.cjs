const assert = require('assert/strict')
const { abrir, estadoReact } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
;(async () => {
  const origen = ejercicioFicticio({ conPlantilla: false }); origen.nombre = 'DIAMANTE de prueba'
  origen.planFuegos = { blancos: [{ id: 'propio', lng: 1, lat: 1 }] }
  const calcos = [{ id: 'origen', nombre: origen.nombre, payload: origen },
    { id: 'destino', nombre: 'Destino de prueba', payload: { ...origen, nombre: 'Destino de prueba', ops: { ...origen.ops, areaOps: null }, planFuegos: null } }]
  const envios = []
  const { page, errores, cerrar } = await abrir({ preparar: async (page,url) => {
    await page.addInitScript(url => { window.SIDECEME_CALCOS = { url, token: 'sesion-ficticia' } }, new URL(url).origin)
    await page.route('**/functions/v1/calcos-datos', r => r.fulfill({ json: { ok: true, permitido: true, capas: {} } }))
    await page.route('**/functions/v1/calco-ops', async route => {
      const b = route.request().postDataJSON(); const c = calcos.find(c => c.id === b.calco_id)
      let r = { ok: true }
      switch (b.accion) {
        case 'mis_calcos': r.calcos = calcos.map(c => ({ id: c.id, nombre: c.nombre })); break
        case 'mi_calco': r.calco = calcos[0]; break
        case 'abrir_mio': r.calco = c; break
        case 'guardar': c.payload = b.payload; break
        case 'areas_destinos': r.destinos = [{ clave: 'calco:destino', calco_id: 'destino', nombre: 'Destino de prueba' }]; break
        case 'areas_enviar': {
          const { construirPaquete } = await import('../../areas-operaciones/compartir-modelo.mjs')
          envios.push({ id: 'envio', nombre: b.nombre, enviado_por: 'Docente de prueba', destino: b.destino.calco_id,
            paquete: construirPaquete({ ...c.payload, nombre: c.nombre }, b.areas, b.opciones) }); break
        }
        case 'areas_recibidos': r.envios = envios.filter(e => e.destino === c.id); break
        default: r = { ok: false, error: 'Acción ficticia no configurada: ' + b.accion }
      }
      await route.fulfill({ json: r })
    })
  } })
  const abrirCalco = async nombre => {
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('button', { name: 'Abrir guardados' }).dispatchEvent('click')
    const fila = page.locator('div', { hasText: nombre }).filter({ has: page.getByRole('button', { name: 'Abrir' }) }).last()
    await fila.getByRole('button', { name: 'Abrir' }).dispatchEvent('click')
    await page.waitForTimeout(1000)
  }
  try {
    await abrirCalco(origen.nombre)
    await page.getByRole('button', { name: /ÁREA DE OPS/i }).first().dispatchEvent('click')
    let panel = page.getByRole('region', { name: 'Áreas del ejercicio' })
    await panel.getByLabel('Nombre del área').fill('Zona asignada')
    await panel.getByLabel('Compartir Zona asignada', { exact: true }).check()
    await panel.getByRole('button', { name: 'Compartir en la aplicación / Recibidos' }).click()
    await panel.getByLabel('Nombre del envío', { exact: true }).fill('Asignación DIAMANTE')
    await panel.getByLabel('Ejercicio o grupo destinatario').selectOption('calco:destino')
    await panel.getByRole('button', { name: 'Guardar y enviar selección' }).click()
    await page.getByRole('status').filter({ hasText: 'Enviado a' }).waitFor()
    assert.equal(envios.length, 1); assert.equal(envios[0].paquete.planFuegos, undefined)
    assert.equal(calcos[1].payload.ops.areaOps, null)
    await abrirCalco('Destino de prueba')
    // El panel puede haber permanecido abierto al cambiar de ejercicio.
    panel = page.getByRole('region', { name: 'Áreas del ejercicio' })
    if (!await panel.count()) await page.getByRole('button', { name: /ÁREA DE OPS/i }).first().dispatchEvent('click')
    await panel.getByRole('button', { name: 'Compartir en la aplicación / Recibidos' }).click()
    await page.waitForTimeout(800)
    await panel.getByRole('button', { name: 'Incorporar al ejercicio' }).click()
    await page.waitForTimeout(500)
    if (!await panel.getByRole('button', { name: 'Ya incorporado' }).count()) await panel.getByRole('button', { name: 'Compartir en la aplicación / Recibidos' }).click()
    await panel.getByRole('button', { name: 'Ya incorporado' }).waitFor()
    const ops = await estadoReact(page, v => v?.entregasAreas?.length ? v : undefined)
    assert.equal(ops.areasOps.length, 1)
    assert.equal(ops.areaOps.nombre, 'Zona asignada')
    assert.equal(await page.evaluate(() => window.MesaFuegos.plan.blancos.length), 0)
    assert.equal(calcos[0].payload.planFuegos.blancos.length, 1)
    assert.deepEqual(errores, [])
    console.log('E2E nube: nombrar, guardar, enviar selección y recibir en destino; sin pisar datos ni arrastrar fuegos.')
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
