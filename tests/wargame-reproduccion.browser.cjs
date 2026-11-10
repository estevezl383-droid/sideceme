// Laboratorio local del renderizador existente. No llama a Supabase ni ejecuta
// el motor: la secuencia es ficticia y el tablero no representa ningún lugar.
// NODE_PATH=<carpeta de módulos> node tests/wargame-reproduccion.browser.cjs
const { chromium } = require(process.env.SIDECEME_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const output = process.env.SIDECEME_REPRO_SALIDA || path.join(os.tmpdir(), 'sideceme-reproduccion');
fs.mkdirSync(output, { recursive: true });
function cut(from, to) {
  const start = html.indexOf(from), end = html.indexOf(to, start + from.length);
  assert.ok(start >= 0 && end > start, `No se encontró ${from}`);
  return html.slice(start, end);
}
const actualCode = [
  cut('function _wgCuadro(fn){', '// Las banderas de animación'),
  html.match(/function _wgEn3D\(\)\{[^\n]*/)[0],
  html.match(/function _wgFinMarcha\(t\)\{[^\n]*/)[0],
  cut('function _wgFusionarTrazas(trazas){', '// ============================================================'),
  cut('const WG_VUELO_MS =', '// v2.9.441 — LAS MINAS ESTALLAN'),
].join('\n');
const actualStyle = cut('.wg-proy{', '/* v2.9.441 — LA MINA QUE SALTA');
const fixture = `<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Laboratorio de reproducción SIDECEME</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#07111b;color:#deebf5;font:16px system-ui,sans-serif}
main{max-width:1100px;margin:48px auto;padding:0 20px}small{color:#8cb6cc;letter-spacing:2px}
h1{font-size:clamp(24px,4vw,38px);margin:14px 0}p{color:#aac2d3;line-height:1.6}
#wg-map{position:relative;height:390px;border:1px solid #33506a;border-radius:16px;overflow:hidden;
background:radial-gradient(ellipse at center,#1d3442,#0a1823 75%)}
#wg-map::before{content:'';position:absolute;inset:0;background-image:linear-gradient(#78a2b00e 1px,transparent 1px),linear-gradient(90deg,#78a2b00e 1px,transparent 1px);background-size:40px 40px}
.piece{position:absolute;top:50%;width:58px;height:58px;border:2px solid currentColor;border-radius:14px;
transform:translate(-50%,-50%);display:grid;place-items:center;font-size:28px;background:#0d1c2a;box-shadow:0 0 38px #51aeff26}
.piece span{position:absolute;top:76px;white-space:nowrap;font-size:11px;letter-spacing:1px}
.a{left:18%;color:#72baff}.b{left:82%;color:#ff8c79}
.controls{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:20px}
button{font:600 15px system-ui;padding:12px 18px;background:#214664;color:#eff8ff;border:1px solid #6597ba;border-radius:10px;cursor:pointer}
button:disabled{opacity:.5;cursor:default}#status{color:#9fd3b8;font-size:14px}
footer{border-top:1px solid #263d50;margin-top:30px;padding-top:18px;color:#8ea9ba;font-size:13px}
${actualStyle}
</style><main><small>SIDECEME · LABORATORIO LOCAL</small>
<h1>Reproducción visual</h1>
<p>Secuencia ficticia para comprobar que la animación termina aunque se interrumpa un cuadro del navegador.</p>
<div id="wg-map" aria-label="Tablero de prueba sin ubicación geográfica">
<div class="piece a">◆<span>FICHA A</span></div><div class="piece b">◆<span>FICHA B</span></div></div>
<div class="controls"><button id="play">▶ Reproducir secuencia</button><span id="status" role="status">Lista para reproducir</span></div>
<footer>Datos ficticios · Sin conexión a partidas · Sólo efectos visuales existentes</footer>
</main><script>
const WG={partidaId:null,map3d:null,camara:0,_accion:false};
WG.map={latLngToContainerPoint(p){const box=document.getElementById('wg-map');return {x:p[1]*box.clientWidth,y:p[0]*box.clientHeight};}};
// El humo no forma parte de esta prueba del ciclo de cuadros y proyectiles.
function _wgHumoExplosion(){}
${actualCode}
window.__reproducciones=0;
document.getElementById('play').onclick=async()=>{
  const button=document.getElementById('play'),status=document.getElementById('status');
  button.disabled=true;status.textContent='Reproduciendo…';
  await _wgAnimarDisparos([
    {desde:[.18,.5],lng:.82,lat:.5,arma:'ficticia'},
    {desde:[.82,.5],lng:.18,lat:.5,arma:'ficticia',respuesta:true}
  ],[]);
  window.__reproducciones++;button.disabled=false;status.textContent='Reproducción terminada';
};
</script></html>`;

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/reproduccion') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(fixture);
  }
  const file = path.resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); return res.end();
  }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({
      ...(process.env.SIDECEME_CHROMIUM ? { executablePath: process.env.SIDECEME_CHROMIUM } : {}),
      headless: true, args: ['--no-sandbox'],
    });
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 880 }, serviceWorkers: 'block' });
      const page = await context.newPage(), errors = [], remote = [];
      page.on('pageerror', err => errors.push(err.message));
      await context.route('**/*', route => {
        if (route.request().url().startsWith(origin + '/')) return route.continue();
        remote.push(route.request().url()); return route.abort();
      });
      await page.addInitScript(() => {
        const nativeRAF = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = fn => {
          if (window.__perderCuadro) {
            window.__perderCuadro = false;
            window.__cuadroTardio = fn;
            return 2147483647;
          }
          return nativeRAF(fn);
        };
      });
      await page.goto(origin + '/reproduccion');
      // Simula el rAF que el navegador suspende después de pasar a segundo plano.
      await page.evaluate(() => { window.__perderCuadro = true; });
      await page.locator('#play').click();
      await page.waitForFunction(() => [...document.querySelectorAll('.wg-proy')].some(el => el.style.display !== 'none'));
      await page.evaluate(() => window.__cuadroTardio(performance.now()));
      await page.waitForFunction(() => document.querySelectorAll('.wg-boom').length > 0);
      await page.screenshot({ path: path.join(output, `reproduccion-${width}.png`), fullPage: true });
      await page.waitForFunction(() => window.__reproducciones === 1, null, { timeout: 15000 });
      assert.equal(await page.evaluate(() => WG._accion), false);
      assert.equal(await page.locator('.wg-proy').count(), 0);
      await page.locator('.wg-boom').waitFor({ state: 'detached' });
      assert.equal(await page.locator('#play').isEnabled(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
      assert.deepEqual(errors, []);
      assert.deepEqual(remote, []);
      await context.close();
    }
    // Carga completa de index.html: cliente simulado, sin credenciales ni API remota.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
    const appErrors = [];
    page.on('pageerror', err => appErrors.push(err.message));
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith(origin + '/')) return route.continue();
      if (url === 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2') return route.fulfill({
        contentType: 'text/javascript', body: `window.supabase={createClient(){return {functions:{invoke:async()=>({data:{ok:false},error:null})}}}};`,
      });
      return route.abort();
    });
    await page.goto(origin + '/index.html');
    assert.equal(await page.evaluate(() => typeof _wgCuadro), 'function');
    assert.equal(await page.evaluate(() => typeof _wgInvoke), 'function');
    assert.equal(await page.locator('#version-marker').textContent(), 'v2.9.482');
    assert.deepEqual(appErrors, []);
    await page.screenshot({ path: path.join(output, 'aplicacion-inicio.png'), fullPage: false });
    await page.close();
    console.log('Chromium: reproducción escritorio/móvil, cuadro suspendido y tardío, finalización, limpieza y carga de la aplicación: OK');
    console.log(`Capturas: ${output}`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
