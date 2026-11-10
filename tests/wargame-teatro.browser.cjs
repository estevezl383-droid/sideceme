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
      assert.equal(await page.locator('#wg-hoja').isVisible(),false,'La hoja cerrada no debe cubrir el tablero');
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
      await page.evaluate(() => wgHoja('matriz'));
      assert.match(await page.locator('#wg-matriz').textContent(), /RELOJ EN PAUSA/);
      assert.match(await page.locator('#wg-matriz').textContent(), /esperando PLAY/);
      assert.doesNotMatch(await page.locator('#wg-matriz').textContent(), /en curso/);
      await page.locator('#wg-matriz button', { hasText: 'PLAY · INICIAR MOVIMIENTOS' }).click();
      await page.waitForFunction(() => _wgCorre());
      assert.doesNotMatch(await page.locator('#wg-matriz').textContent(), /RELOJ EN PAUSA|esperando PLAY/);
      await page.evaluate(() => { WG.vivo=true; _wgVivoLatiendo(); });
      const inicio = await page.evaluate(uid => _wgUnidadPorId(uid).lng, id);
      const step = await page.evaluate(async () => {
        const result = await (await fetch('/__lab/paso')).json(); _wgTicRecibido(result); return result;
      });
      assert.equal(step.ok, true, step.error); assert.ok(step.trazas.length);
      const destino = step.cambios.find(u => u.id === id).lng;
      await page.waitForFunction(({id,inicio,destino}) => {
        const u=_wgUnidadPorId(id); let marcador;
        WG.capa.eachLayer(l=>{ if(String(l.__uid)===String(id)) marcador=l.getLatLng(); });
        return u.lng>inicio+.00001 && u.lng<destino && marcador && Math.abs(marcador.lng-u.lng)<.000001;
      }, {id,inicio,destino});
      await page.evaluate(() => _wgVivoLatiendo()); // Rearmar el sondeo tampoco interrumpe el avance.
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
      assert.match(await page.locator('#wg-matriz').textContent(), /RELOJ EN PAUSA/);
      assert.deepEqual(errors, []);
      await page.close();
    }
    await fetch(origin + '/__lab/reiniciar');
    const page = await browser.newPage({ viewport:{width:1440,height:950},serviceWorkers:'block' }), errors=[];
    page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
    await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    await page.goto(origin + '/'); await page.waitForFunction(() => window.labReady);
    const cuerpos = { ...fixture.ejercicio, unidades: [
      ...Array.from({length:4},(_,i)=>({id:'C'+i,tipo:'unidad',designacion:'CUERPO FICTICIO '+(i+1),bando:'propias',
        escalon:'cuerpo',arma:'motorizada',lng:1,lat:1+i*.025})),
      {...fixture.ejercicio.unidades[1],lng:1.8,lat:1.4},
    ] };
    await page.locator('#wg-imp-file').setInputFiles({name:'cuerpos-ficticios.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(cuerpos))});
    await page.waitForFunction(() => WG.teatro && WG.estado.unidades.length === 5);
    const origenes=await page.evaluate(() => WG.estado.unidades.filter(u=>u.bando==='azul').map(u=>({id:u.id,lng:u.lng,lat:u.lat})));
    const pasoCuerpos=await page.evaluate(async () => {
      await wgIniciar();
      for(const u of WG.estado.unidades.filter(u=>u.bando==='azul')) {
        (WG.rutas||(WG.rutas={}))[u.id]=[[1.3,u.lat]]; _wgOrdenDesdeRuta(u.id);
      }
      await wgTeatroEjecutar(null); WG.vivo=true; _wgVivoLatiendo();
      WG.map.setView([1.035,1.06],11); await wgReloj(true);
      const r=await(await fetch('/__lab/paso')).json();_wgTicRecibido(r);return r;
    });
    assert.equal(pasoCuerpos.ok,true,pasoCuerpos.error); assert.equal(pasoCuerpos.trazas.length,4);
    await page.waitForFunction(origenes => origenes.every(o=>{
      let p; WG.capa.eachLayer(l=>{if(l.__uid===o.id) p=l.getLatLng();});
      return p && Math.hypot(p.lng-o.lng,p.lat-o.lat)>.0001;
    }), origenes);
    await page.waitForFunction(() => (WG._vivoHumo||[]).length>=24);
    assert.ok(await page.locator('.wg-polvo i').evaluateAll(els=>els.some(el=>parseFloat(el.style.width)>=60)));
    assert.ok(await page.locator('.wg-polvo i').count()<=160);
    await page.screenshot({path:path.join(output,'cuerpos-en-marcha.png'),fullPage:false});
    await page.evaluate(() => { WG.vivo=false;_wgVivoLatiendo(); });
    await page.waitForFunction(() => Object.keys(WG._vivo||{}).length===0 && !(WG._vivoHumo||[]).length, null, {timeout:15000});
    assert.equal(await page.locator('.wg-polvo').count(),0);
    assert.deepEqual(errors,[]); await page.close();
    console.log('Chromium: escritorio/móvil, PLAY y pausa visibles, fichas y marcadores en movimiento con sondeo activo, cuatro cuerpos, polvo por escalón y limpieza: OK');
    console.log('Capturas: ' + output);
  } finally {
    if (browser) await browser.close(); await new Promise(resolve => server.close(resolve));
  }
})().catch(e => { console.error(e); process.exitCode=1; });
