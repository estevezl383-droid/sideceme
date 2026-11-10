const { chromium } = require(process.env.SIDECEME_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path'), fs = require('node:fs'), os = require('node:os');
const { crearServidor } = require('./helpers/wargame-teatro-servidor.cjs');
const output = process.env.SIDECEME_REPRO_SALIDA || path.join(os.tmpdir(), 'sideceme-teatro');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const fixture = crearServidor(), { server } = fixture;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ ...(process.env.SIDECEME_CHROMIUM ? { executablePath: process.env.SIDECEME_CHROMIUM } : {}), headless:true, args:['--no-sandbox'] });
    for (const width of [1440, 390]) {
      if (width === 390) await fetch(origin + '/__lab/reiniciar');
      const page = await browser.newPage({ viewport:{width,height:950},serviceWorkers:'block' }), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('dialog', dialog => dialog.accept());
      await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      await page.goto(origin + '/');
      await page.waitForFunction(() => window.labReady || window.labError);
      assert.equal(await page.evaluate(() => window.labError), undefined);
      await page.locator('#wg-imp-file').setInputFiles({ name:'juego-ficticio.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture.ejercicio)) });
      await page.waitForFunction(() => WG.teatro && (WG.estado?.unidades || []).length === 2);
      await page.waitForFunction(() => document.body.classList.contains('wg-teatro'));
      assert.equal(await page.locator('#wg-escala-chip').textContent(), '🌎 TEATRO · FICCIÓN');
      assert.equal(await page.evaluate(() => WG.estado.partida.duracion_turno_horas), 24);
      assert.equal(await page.locator('#wg-drones').isVisible(), false);
      await page.evaluate(() => wgIniciar());
      await page.waitForFunction(() => WG.estado.partida.estado === 'en_curso');
      const options = await page.locator('#wg-reloj-vel option').evaluateAll(els => els.map(e => Number(e.value)));
      assert.deepEqual(options, [2880,1440,720,360]);
      const id = await page.evaluate(() => WG.estado.unidades.find(u => u.bando === 'azul').id);
      await page.evaluate(uid => {
        WG.sel=uid;WG.rutas={[uid]:[[1.2,1]]};_wgOrdenDesdeRuta(uid);_wgRender();
      }, id);
      await page.waitForFunction(uid => !!WG.ordenes[uid]?._teatroFirma, id);
      assert.ok(await page.evaluate(uid => WG.ordenes[uid].ruta.length <= 60, id));
      await page.evaluate(uid => wgTeatroEjecutar(uid), id);
      assert.equal(fixture.lab.tables.wg_ordenes.length, 1);
      assert.equal(fixture.lab.tables.wg_ordenes[0].mision, 'marcada');
      await page.evaluate(() => wgReloj(true));
      await page.waitForFunction(() => _wgCorre());
      const step = await page.evaluate(async () => {
        const result = await (await fetch('/__lab/paso')).json(); _wgTicRecibido(result); return result;
      });
      assert.equal(step.ok, true, step.error); assert.ok(step.trazas.length);
      assert.ok(step.encuentros.length, 'El juego devuelve el encuentro que debe reproducir');
      assert.ok(await page.evaluate(() => WG._combates && WG._combates.size > 0));
      await page.waitForFunction(() => !!document.querySelector('.wg-humo-cv'));
      await page.waitForTimeout(1200);
      const aviso=await page.locator('#wg-ayuda').boundingBox();
      if(aviso) assert.ok(aviso.height<250,'El aviso no debe tapar el tablero');
      await page.screenshot({path:path.join(output,`juego-teatro-${width}.png`),fullPage:false});
      await page.evaluate(() => wgReloj(false));
      assert.equal(await page.evaluate(() => _wgCorre()), false);
      assert.match(await page.locator('#wg-turno-chip').textContent(), /D\+0/);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('Juego ficticio en Chromium escritorio/móvil: importación real, escala por partida, ruta previa, envío, PLAY, encuentro visible y PAUSA: OK');
    console.log('Capturas: ' + output);
  } finally {
    if (browser) await browser.close(); await new Promise(resolve => server.close(resolve));
  }
})().catch(e => { console.error(e); process.exitCode=1; });
