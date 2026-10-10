// SIDECEME «de mentira» para probar la Mesa como está publicada (modo «servidor»: el
// ejercicio se guarda en calco-ops), sin red y sin tocar la base de verdad.
//   · antes de cargar la página, deja la sesión de un profesor (SIDECEME_CALCOS);
//   · calcos-datos contesta que tiene permiso;
//   · calco-ops guarda los ejercicios en `calcos` (en memoria) y anota cada pedido en `log`.
// `fallar(true)` hace que 'guardar' conteste como cuando el servidor falla.
async function servidorFalso(page, calcos, log = []) {
  let falla = false
  await page.addInitScript(() => {
    window.SIDECEME_CALCOS = { url: 'https://servidor-falso.supabase.co', anonKey: 'x', token: 'tok', esProfesor: true }
    try {
      localStorage.setItem('sideceme_token_p', 'tok')
    } catch (e) {}
  })
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }
  const json = (r, o, status = 200) => r.fulfill({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(o) })
  await page.route(/functions\/v1\/calcos-datos/, (r) => (r.request().method() === 'OPTIONS' ? r.fulfill({ status: 200, headers: cors }) : json(r, { ok: true, permitido: true, nombre: 'Prof. de prueba' })))
  await page.route(/functions\/v1\/calco-ops/, (r) => {
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 200, headers: cors })
    const b = JSON.parse(r.request().postData() || '{}')
    log.push({ accion: b.accion, t: Date.now(), payload: b.payload })
    const ok = (o) => json(r, { ok: true, ...o })
    if (b.accion === 'mis_calcos') return ok({ calcos: calcos.map((c) => ({ id: c.id, nombre: c.nombre, actualizado_en: c.actualizado_en, bytes: JSON.stringify(c.payload).length })) })
    if (b.accion === 'mi_calco') return ok({ calco: calcos[0] })
    if (b.accion === 'abrir_mio') return ok({ calco: calcos.find((c) => c.id === b.calco_id) })
    if (b.accion === 'crear_mio') {
      const c = { id: 'id-' + calcos.length, nombre: b.nombre, payload: {}, actualizado_en: new Date().toISOString() }
      calcos.push(c)
      return ok({ calco: c })
    }
    if (b.accion === 'guardar') {
      if (falla) return json(r, { ok: false, error: 'El servidor no responde (prueba)' }, 500)
      const c = calcos.find((x) => x.id === b.calco_id)
      c.payload = b.payload
      c.actualizado_en = new Date().toISOString()
      return ok({})
    }
    return ok({})
  })
  return { fallar: (si) => (falla = !!si) }
}

// Abre un ejercicio de la lista como el usuario (📁 Ejercicio → Abrir guardados → Abrir).
async function abrirDelServidor(page, nombre) {
  await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
  await page.getByRole('button', { name: 'Abrir guardados' }).dispatchEvent('click')
  const fila = page.locator('div', { hasText: nombre }).filter({ has: page.getByRole('button', { name: 'Abrir' }) }).last()
  await fila.getByRole('button', { name: 'Abrir' }).first().waitFor({ timeout: 15000 })
  await fila.getByRole('button', { name: 'Abrir' }).first().dispatchEvent('click')
  await page.waitForTimeout(1500)
}

module.exports = { servidorFalso, abrirDelServidor }
