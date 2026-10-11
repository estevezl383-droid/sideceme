// 💾📤 La Mesa real en Chromium con un SIDECEME de mentira (11-10-2026): una selección guardada
// («CE-III») se comparte a un CICLO desde «Selecciones guardadas»: va la Mesa TAL COMO ESTÁ
// (ejercicio_enviar, con el contorno guardado, aunque el área de la carta se haya movido después) y
// lo de adentro con el CMOC a la vista; el que la recibe la incorpora con su área de empeño.
//   node calcos/pruebas/e2e/areas-seleccion-nube.cjs
const assert = require('assert/strict')
const { abrir, estadoReact } = require('./navegador')
const { ejercicioFicticio, unidad } = require('../ejercicio-ficticio')

;(async () => {
  const origen = ejercicioFicticio({ conPlantilla: false }); origen.nombre = 'FABBLE de prueba (nube)'
  const ce3 = { id: 'ao-ce3', nombre: 'CE-III', unidad: 'CE-III', escalon: 'cuerpo', coords: [[-65.033, -16.98], [-65.0, -16.98], [-65.0, -17.05], [-65.033, -17.05]] }
  origen.ops.areaOps = { ...origen.ops.areaOps, id: 'ao-fabble', nombre: 'FABBLE' }
  // El área de la carta se movió DESPUÉS de guardar la selección: tiene que ir el contorno guardado.
  origen.ops.areasOps = [origen.ops.areaOps, { ...ce3, coords: ce3.coords.map(([x, y]) => [x - 0.01, y]) }]
  origen.ops.selecciones = [{ id: 'sel-1', nombre: 'CE-III', areaId: 'ao-ce3', coords: ce3.coords, escalon: 'cuerpo', opciones: { contenido: true, enemigo: false, cmoc: true }, capasCmoc: ['ae'], guardada: '2026-10-11T20:00:00.000Z' }]
  origen.ops.limites = [{ coords: [[-65.033, -16.975], [-65.033, -17.055]], escalon: 'cuerpo', tipo: 'magnitud' }]
  origen.cmoc = { restringido: [], severo: [], defensivo: [], corredores: [], avenidas: [], clave: [], desplazamientos: [],
    ae: [{ coords: [[-65.02, -17.005], [-65.008, -17.005], [-65.008, -17.015], [-65.02, -17.015]], centro: [-65.014, -17.01] }] }
  origen.unidades = [unidad('fict-este', 'R.I. «ESTE» (FICT.)', 'infanteria', 'regimiento', -17.03, -65.02),
    { ...unidad('fict-rojo', 'R.I. «ROJO» (FICT.)', 'infanteria', 'regimiento', -16.99, -65.015), bando: 'enemigo' }]
  const destino = { ...origen, nombre: 'CE-III del alumno', ops: { limites: [], coordinacion: [], pasaje: [], tareas: [], magnitudes: [], areaOps: null }, unidades: [], cmoc: { restringido: [], severo: [], defensivo: [], corredores: [], avenidas: [], clave: [], ae: [], desplazamientos: [] } }
  const calcos = [{ id: 'origen', nombre: origen.nombre, payload: origen }, { id: 'destino', nombre: destino.nombre, payload: destino }]
  const envios = [], peticiones = []
  const { page, errores, cerrar } = await abrir({ preparar: async (page, url) => {
    await page.addInitScript(url => { window.SIDECEME_CALCOS = { url, token: 'sesion-ficticia' } }, new URL(url).origin)
    await page.route('**/functions/v1/calcos-datos', r => r.fulfill({ json: { ok: true, permitido: true, capas: {} } }))
    await page.route('**/functions/v1/calco-ops', async route => {
      const b = route.request().postDataJSON(); peticiones.push(b.accion); const c = calcos.find(c => c.id === b.calco_id)
      let r = { ok: true }
      switch (b.accion) {
        case 'mis_calcos': r.calcos = calcos.map(c => ({ id: c.id, nombre: c.nombre })); break
        case 'mi_calco': r.calco = calcos[0]; break
        case 'abrir_mio': r.calco = c; break
        case 'guardar': c.payload = b.payload; break
        case 'areas_destinos': r.destinos = [{ clave: 'ciclo:1ER CICLO', tipo: 'ciclo', ciclo: '1ER CICLO', nombre: 'Todo el 1ER CICLO (3 cursantes)' }, { clave: 'paralelo:1ER CICLO:A', tipo: 'paralelo', ciclo: '1ER CICLO', paralelo: 'A', nombre: '1ER CICLO · Paralelo A (2 cursantes)' }]; break
        case 'ejercicio_enviar': {
          // Como el servidor (compartir.mjs): el paquete sale de la foto de la Mesa, con la lista permitida.
          const { construirPaquete } = await import('../../areas-operaciones/compartir-modelo.mjs')
          const f = b.foto
          envios.push({ id: 'envio-ciclo', nombre: b.nombre, enviado_por: 'Docente de prueba', destino: b.destino,
            paquete: construirPaquete({ ops: f.ops, unidades: f.unidades, documentos: f.documentos, cmoc: f.cmoc, nombre: c.nombre }, b.areas, b.opciones) }); break
        }
        case 'areas_recibidos': r.envios = b.calco_id === 'destino' ? envios : []; break
        default: r = { ok: false, error: 'Acción ficticia no configurada: ' + b.accion }
      }
      await route.fulfill({ json: r })
    })
  } })
  const abrirCalco = async nombre => {
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('button', { name: 'Abrir guardados' }).dispatchEvent('click')
    const fila = page.locator('span', { hasText: nombre }).locator('..').filter({ has: page.getByRole('button', { name: 'Abrir', exact: true }) }).last()
    await fila.getByRole('button', { name: 'Abrir' }).dispatchEvent('click')
    await page.waitForFunction(nombre => [...document.querySelectorAll('button[title="Crear, abrir y guardar ejercicios"]')].some(b => b.textContent.includes(nombre)), nombre)
    await page.waitForTimeout(1000)
  }
  try {
    await abrirCalco(origen.nombre)
    await page.getByRole('button', { name: /ÁREA DE OPS/i }).first().dispatchEvent('click')
    let panel = page.getByRole('region', { name: 'Áreas del ejercicio' })
    const lista = panel.getByRole('group', { name: 'Selecciones guardadas' })
    assert.match(await lista.innerText(), /CE-III[\s\S]*1 área\(s\) de empeño \(CMOC\)/)
    await lista.getByRole('button', { name: '📤 Compartir (ciclo / paralelo)' }).click()
    await panel.getByLabel('Ejercicio o grupo destinatario').waitFor()
    assert.equal(await panel.getByLabel('Nombre del envío', { exact: true }).inputValue(), 'CE-III', 'con el nombre de la selección')
    assert.match(await panel.getByRole('region', { name: 'Compartir dentro de SIDE-CEME' }).innerText(), /💾 Selección guardada «CE-III»/)
    await panel.getByLabel('Ejercicio o grupo destinatario').selectOption('ciclo:1ER CICLO')
    await panel.getByRole('button', { name: 'Guardar y enviar selección' }).click()
    await page.getByRole('status').filter({ hasText: 'Enviado a' }).waitFor()
    assert.equal(envios.length, 1)
    const p = envios[0].paquete
    assert.equal(envios[0].destino.tipo, 'ciclo')
    assert.deepEqual(p.areas.map(a => a.nombre), ['CE-III'])
    assert.deepEqual(p.areas[0].coords, ce3.coords, 'va el contorno guardado (idéntico al recorte)')
    assert.deepEqual(p.contenido.unidades.map(u => u.id), ['fict-este'], 'sin las enemigas (la selección no las llevaba)')
    assert.equal(p.contenido.cmoc.ae.length, 1, 'con el área de empeño a la vista')
    assert.ok(peticiones.includes('guardar'), 'antes de enviar se guarda el ejercicio')

    // El alumno lo incorpora: el área, la ficha y el área de empeño.
    await abrirCalco(destino.nombre)
    panel = page.getByRole('region', { name: 'Áreas del ejercicio' })
    if (!await panel.count()) await page.getByRole('button', { name: /ÁREA DE OPS/i }).first().dispatchEvent('click')
    await panel.getByRole('button', { name: 'Compartir en la aplicación / Recibidos' }).click()
    await page.waitForTimeout(800)
    await panel.getByRole('button', { name: 'Incorporar al ejercicio' }).click()
    await page.waitForTimeout(500)
    if (!await panel.getByRole('button', { name: 'Ya incorporado' }).count()) await panel.getByRole('button', { name: 'Compartir en la aplicación / Recibidos' }).click()
    await panel.getByRole('button', { name: 'Ya incorporado' }).waitFor()
    const ops = await estadoReact(page, v => v?.entregasAreas?.length ? v : undefined)
    assert.equal(ops.areaOps.nombre, 'CE-III')
    const cm = await estadoReact(page, v => v && !Array.isArray(v) && Array.isArray(v.ae) && Array.isArray(v.restringido) ? v : undefined)
    assert.equal(cm.ae.length, 1, 'llega el área de empeño del CMOC')
    assert.equal(cm.ae[0].envioAreas, 'envio-ciclo')
    assert.deepEqual(errores, [])
    console.log('E2E selección por la nube: «📤 Compartir» de una selección guardada la manda a un ciclo con el contorno guardado y el CMOC a la vista; el alumno la incorpora con su área de empeño. Sin errores JS.')
  } catch (e) { console.error('DIAGNOSTICO', await page.getByRole('region', { name: 'Áreas del ejercicio' }).innerText().catch(() => ''), peticiones, errores); throw e } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
