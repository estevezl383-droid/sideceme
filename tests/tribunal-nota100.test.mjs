// Columna NOTA FINAL /100 de la grilla del tribunal: corre el módulo real del
// tribunal (index.html) y el de evaluaciones/config.js en Chromium, con el
// servidor simulado. La nota sólo aparece cuando TODA la mesa cerró.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {chromium} = [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node22/lib/node_modules/playwright']
  .filter(Boolean).map(c => { try { return require(c); } catch { return null; } }).find(Boolean)
  || (() => { throw new Error('Falta Playwright: npm install --no-save playwright'); })();

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const corte = (desde, hasta, de = 0) => { const i = html.indexOf(desde, de); return html.slice(i, html.indexOf(hasta, i) + hasta.length); };
const iTrb = html.indexOf('FASE 4 — EL TRIBUNAL');
const modulo = html.slice(html.lastIndexOf('<script>', iTrb) + 8, html.indexOf('</script>', iTrb));
const estilo = html.slice(html.lastIndexOf('<style', html.indexOf('.trb-total{')), html.indexOf('</style>', html.indexOf('.trb-total{')) + 8);
const pantalla = corte('<section id="screen-eem-trib-grilla"', '</section>');
const config = fs.readFileSync(path.join(raiz, 'evaluaciones/config.js'), 'utf8');

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
pagina.on('pageerror', e => { throw e; });
await pagina.setContent('<!doctype html><meta charset="utf-8">' + estilo + '<body>' + pantalla + '</body>');
await pagina.addScriptTag({content: `
  window.showScreen = id => { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); };
  window.getTokenSesion = () => 'token'; window.eemMaterialHTML = () => ''; window.eemEscritoMontar = () => {};
  window.ACT = {}; window.alert = () => {};
  window.SERVIDOR = {cerrados: 3, texto: 61.881, promedios: {C1: 33.5, C2: 32.1667, C3: 31, C4: 34.8333, C5: 30.25}};
  const filas = ['C1','C2','C3','C4','C5'].map((id, k) => ({cursante_id: id, grado: 'My.', nombre: 'Cursante ' + (k + 1),
    cerrado: true, notas: {'1': 2, '2': 13, '3': 9, '4': 8}}));
  window.sb = {functions: {invoke: async (fn, {body}) => {
    if (fn === 'eem-evaluar-forma' && body.accion === 'escrito')
      return {data: {ok: true, resultado: {texto_65: SERVIDOR.texto, bruta: 48.9}}};
    if (fn === 'eem-tribunal' && body.accion === 'grilla') return {data: {ok: true, yo: {id: 'P009'}, grilla: {
      grupo: {grupo_id: 'g1', nombre: 'B · Grupo 6', tema: 'Saneamiento', paralelo: 'B'}, carpeta_id: 'c1',
      entrega: {entrega_id: 'e1'}, filas: JSON.parse(JSON.stringify(filas)),
      jurados: [{profesor_id: 'P009'}, {profesor_id: 'P032'}, {profesor_id: 'P022'}],
      items: [2, 15, 10, 10].map((valor, i) => ({orden: i + 1, valor, mitad: valor / 2,
        descripcion: i === 1 ? 'Tienen conocimiento ... sobre la elaboración de Proyectos.' : 'Ítem ' + (i + 1)}))}}};
    if (fn === 'eem-tribunal' && body.accion === 'comparativo')
      return {data: {ok: true, comparativo: {cerrados: SERVIDOR.cerrados, promedio: SERVIDOR.promedios[body.cursante_id]}}};
    return {data: {ok: false, error: 'no simulado: ' + fn + ' ' + body.accion}};
  }}};`});
await pagina.addScriptTag({content: modulo});
await pagina.addScriptTag({content: config});

const leer = () => pagina.evaluate(() => Array.from(document.querySelectorAll('tr[data-fila]')).map(tr =>
  [tr.dataset.fila, document.getElementById('trb-t100-' + tr.dataset.fila).textContent,
   document.getElementById('trb-t100m-' + tr.dataset.fila).textContent]));
const esperar = cond => pagina.waitForFunction(cond, null, {timeout: 5000});

// 1 · mesa incompleta: 2 de 3 jurados cerraron → no hay nota
await pagina.evaluate(() => { SERVIDOR.cerrados = 2; return trbGrilla('g1'); });
await esperar(() => /Cerraron 2 de 3/.test(document.getElementById('trb-t100-C5')?.title || ''));
for (const [, t, m] of await leer()) { assert.equal(t, '—'); assert.equal(m, '—'); }

// 2 · mesa completa: escrito (con banda) + promedio de los 3 jurados, a 4 decimales
await pagina.evaluate(() => { SERVIDOR.cerrados = 3; return trbGrilla('g1'); });
await esperar(() => /^\d/.test(document.getElementById('trb-t100-C5')?.textContent || ''));
const esperado = {C1: '95.3810', C2: '94.0477', C3: '92.8810', C4: '96.7143', C5: '92.1310'};
for (const [id, t, m] of await leer()) { assert.equal(t, esperado[id], id); assert.equal(m, esperado[id], id + ' (teléfono)'); }
if (process.env.GRILLA_PNG) {
  await pagina.setViewportSize({width: 1500, height: 900});
  await pagina.locator('table.trb-grilla').screenshot({path: process.env.GRILLA_PNG});
}

// 3 · la tabla sigue cuadrada con la casilla grupal fusionada y la columna nueva
const forma = await pagina.evaluate(() => {
  const t = document.querySelector('table.trb-grilla');
  const ancho = r => Array.from(r.cells).reduce((a, c) => a + c.colSpan, 0);
  const enc = ancho(t.tHead.rows[0]);
  const primera = t.tBodies[0].rows[0];
  const fusion = primera.querySelector('.epla-unica');
  return {enc, cabecera: Array.from(t.tHead.rows[0].cells).map(c => c.textContent.replace(/\s+/g, ' ').trim()),
    primera: ancho(primera), resto: Array.from(t.tBodies[0].querySelectorAll('tr[data-fila]')).slice(1).map(r => ancho(r) + 1),
    fusion: fusion && fusion.rowSpan, obs: Array.from(t.tBodies[0].querySelectorAll('tr[id^="trb-obsfila-"]')).map(r => ancho(r) + 1)};
});
assert.equal(forma.enc, 8);
assert.match(forma.cabecera[2], /Elaboración de proyectos/);
assert.match(forma.cabecera[6], /NOTA FINAL\s*\/100/);
assert.equal(forma.primera, 8);
assert.ok(forma.resto.every(n => n === 8), 'filas con la celda fusionada: ' + forma.resto);
assert.ok(forma.obs.every(n => n === 8), 'filas de observación: ' + forma.obs);

// 4 · escrito pendiente → tampoco hay nota final
await pagina.evaluate(() => { SERVIDOR.texto = null; return trbGrilla('g1'); });
await esperar(() => /escrito/.test(document.getElementById('trb-t100-C5')?.title || ''));
for (const [, t] of await leer()) assert.equal(t, '—');

await navegador.close();
console.log('NOTA FINAL /100 del tribunal: oculta con la mesa incompleta, exacta con los 3 jurados, tabla cuadrada OK');
