const assert = require('node:assert/strict');
const { abrir, estadoReact, sembrarYAbrir, entrar3D, salir3D, leerGuardado } = require('./navegador');
const { ejercicioFicticio } = require('../ejercicio-ficticio');
const instalaciones = [
  { id: 'ficha-a', designacion: 'INSTALACIÓN A', tipo: 'instalacion', instalacion: 'pd_cl1', bando: 'propias', arma: 'logistica', escalon: 'seccion', lat: -17.005, lng: -65.052 },
  { id: 'ficha-b', designacion: 'INSTALACIÓN B', tipo: 'instalacion', instalacion: 'pcm', bando: 'propias', arma: 'logistica', escalon: 'seccion', lat: -17.007, lng: -65.040 },
];
async function clicFicha(page, id) {
  const punto = await page.evaluate(c => {
    const m = Object.values(window.__lm2d._layers).find(x => x._icon && x.getLatLng && Math.abs(x.getLatLng().lng - c.lng) < 1e-8 && Math.abs(x.getLatLng().lat - c.lat) < 1e-8);
    if (!m) throw Error('Marcador no encontrado');
    const r = m._icon.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];
  }, instalaciones.find(u => u.id === id));
  const tapa = await page.evaluate(([x, y]) => !document.elementFromPoint(x, y)?.closest('.leaflet-container, .maplibregl-map'), punto);
  if (tapa) await page.evaluate(c => { const m = Object.values(window.__lm2d._layers).find(x => x._icon && x.getLatLng && Math.abs(x.getLatLng().lng - c.lng) < 1e-8 && Math.abs(x.getLatLng().lat - c.lat) < 1e-8); m.fire('click', { latlng: m.getLatLng(), originalEvent: new MouseEvent('click') }); }, instalaciones.find(u => u.id === id));
  else await page.mouse.click(...punto);
  await page.getByRole('region', { name: 'Ficha documental de instalación' }).waitFor();
}
const datosReact = p => estadoReact(p, v => Array.isArray(v) && v.some(u => u?.id === 'ficha-a') ? JSON.parse(JSON.stringify(v)) : undefined);
(async () => {
  const m = await abrir(); const { page } = m;
  try {
    const d = ejercicioFicticio({ conPlantilla: false }); d.unidades.push(...instalaciones); d.ops.unidadConsiderada = { nombre: 'DIV. FICT.', escalon: 'division', confirmada: true };
    await sembrarYAbrir(page, d);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const ocultar = page.getByText('▼ ocultar'); if (await ocultar.count()) await ocultar.first().click().catch(() => {});
    await entrar3D(page);
    await page.evaluate(() => { window.__lm2d = window.__espejo3d.lm; window.__map3d.jumpTo({ center: [-65.05, -17.015], zoom: 13.2, pitch: 40, bearing: 0 }); });
    await page.waitForTimeout(1500); await salir3D(page);
    await clicFicha(page, 'ficha-a');
    const panel = page.locator('.sid-fi');
    await panel.getByLabel('OBSERVACIONES DEL CURSANTE', { exact: true }).fill('Nota exclusiva de A');
    await panel.getByLabel('INDICACIÓN ADICIONAL DE ESTUDIO', { exact: true }).fill('Explica la diferencia entre función y servicio.');
    await panel.getByText('DOCUMENTOS Y FRAGMENTOS PARA ESTUDIAR', { exact: true }).click();
    await panel.locator('input[type=file]').setInputFiles({ name: 'referencia-prueba.txt', mimeType: 'text/plain', buffer: Buffer.from('Documento educativo: definición de una función institucional.') });
    await panel.getByLabel('CONSULTAR TEXTO EXTRAÍDO', { exact: true }).selectOption('0');
    assert((await panel.getByLabel('Texto extraído del documento').inputValue()).includes('función institucional'));
    await panel.getByLabel('FRAGMENTOS SELECCIONADOS Y REFERENCIAS', { exact: true }).fill('referencia-prueba.txt, apartado 1: definición de una función institucional.');
    await panel.getByRole('button', { name: 'GENERAR PROMPT', exact: true }).click();
    const prompt = await panel.getByLabel('Prompt documental generado').inputValue();
    assert(prompt.includes('ficha-a') && prompt.includes('referencia-prueba.txt') && prompt.includes('función y servicio'));
    await panel.getByRole('button', { name: 'COPIAR PROMPT', exact: true }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), prompt);
    const respuesta = { version: 1, instalacionId: 'ficha-a', resumen: 'Síntesis educativa de A', funciones: ['Función de prueba A'], organizacion: [], servicios: ['Servicio documental'], fuentes: [{ documento: 'referencia-prueba.txt', referencia: 'apartado 1', aporte: 'Definición' }], datosFaltantes: ['Falta la descripción particular'], observaciones: [], preguntasEstudio: ['¿Qué es una función?'] };
    await panel.getByLabel('PEGAR RESPUESTA DE LA IA', { exact: true }).fill(JSON.stringify({ ...respuesta, instalacionId: 'ficha-b' }));
    await panel.getByRole('button', { name: 'PROYECTAR RESPUESTA EN LA FICHA' }).click();
    assert((await panel.getByRole('alert').innerText()).includes('otra instalación'));
    await panel.getByLabel('PEGAR RESPUESTA DE LA IA', { exact: true }).fill(JSON.stringify(respuesta));
    await panel.getByRole('button', { name: 'PROYECTAR RESPUESTA EN LA FICHA' }).click();
    assert((await panel.locator('.sid-fi-resultado').innerText()).includes('Función de prueba A'));
    await page.screenshot({ path: '/tmp/ficha-documental-ok.png' });
    await panel.getByRole('button', { name: 'MARCAR COMO REVISADO CON LAS FUENTES' }).click();
    assert.equal(await panel.locator('.sid-fi-revisado').count(), 1);
    await panel.getByLabel('Instalación de la ficha').selectOption('ficha-b');
    assert.equal(await panel.getByLabel('OBSERVACIONES DEL CURSANTE', { exact: true }).inputValue(), '');
    await panel.getByLabel('FORMATO DE LA RESPUESTA').selectOption('texto');
    await panel.getByLabel('PEGAR RESPUESTA DE LA IA', { exact: true }).fill('Texto de B <img src=x onerror=alert(1)>');
    await panel.getByRole('button', { name: 'PROYECTAR RESPUESTA EN LA FICHA' }).click();
    assert.equal(await panel.locator('.sid-fi-resultado img').count(), 0);
    assert((await panel.locator('.sid-fi-resultado').innerText()).includes('<img'));
    await panel.getByRole('button', { name: 'GUARDAR FICHA', exact: true }).click();
    await panel.getByLabel('Cerrar ficha documental').click();
    await entrar3D(page); await page.waitForTimeout(1500); await page.evaluate(() => { window.__lm2d = window.__espejo3d.lm; window.__map3d.jumpTo({ center: [-65.05, -17.015], zoom: 13.2, pitch: 40, bearing: 0 }); }); await page.waitForTimeout(1500);
    await clicFicha(page, 'ficha-a');
    assert.equal(await panel.getByLabel('OBSERVACIONES DEL CURSANTE', { exact: true }).inputValue(), 'Nota exclusiva de A');
    assert((await panel.locator('.sid-fi-resultado').innerText()).includes('Síntesis educativa de A'));
    await panel.getByLabel('Minimizar ficha').click(); assert.equal(await page.locator('.sid-fi-cuerpo').count(), 0);
    await panel.getByLabel('Ampliar ficha').click();
    await panel.getByRole('button', { name: 'GUARDAR FICHA', exact: true }).click();
    await panel.getByLabel('Cerrar ficha documental').click();
    const antes = await datosReact(page); assert(antes.find(u => u.id === 'ficha-b').fichaDocumental.resultadoIA.textoLibre.includes('Texto de B'));
    if (!(await page.getByRole('button', { name: /Guardar todo/ }).count())) await page.getByRole('button', { name: /^📁 / }).first().dispatchEvent('click');
    await page.getByRole('button', { name: /Guardar todo/ }).dispatchEvent('click');
    await page.waitForTimeout(1500);
    const guardado = await leerGuardado(page, d.nombre);
    assert.equal(guardado.unidades.find(u => u.id === 'ficha-a').fichaDocumental.resultadoIA.resumen, respuesta.resumen);
    assert.equal(guardado.documentos[0].nombre, 'referencia-prueba.txt');
    await page.reload(); await page.waitForTimeout(2000); await sembrarYAbrir(page, guardado);
    // Recuperación después de cerrar el navegador: lee la ficha desde estado confirmado.
    const recuperado = await datosReact(page); assert.deepEqual(recuperado.find(u => u.id === 'ficha-a').fichaDocumental, antes.find(u => u.id === 'ficha-a').fichaDocumental);
    assert.deepEqual(m.errores, []);
    console.log('✔ 2D/3D: clic en instalación, consulta de adjuntos, prompt/portapapeles, JSON, texto seguro, aislamiento, revisión, guardado y recuperación');
  } catch(e) { await page.screenshot({ path: '/tmp/ficha-documental-error.png' }); console.log((await page.locator('body').innerText()).slice(-12000)); throw e; } finally { await m.cerrar(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
