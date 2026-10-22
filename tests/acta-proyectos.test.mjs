// Acta de ELABORACIÓN DE PROYECTOS sobre el Anexo A: corre el motor real del
// acta (extraído de index.html) en Chromium y revisa el Word celda por celda.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

// Playwright no es dependencia del proyecto: se usa el que haya instalado
// (PLAYWRIGHT_MODULE=/ruta/a/playwright si no está en node_modules).
const require = createRequire(import.meta.url);
const {chromium} = [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node22/lib/node_modules/playwright']
  .filter(Boolean).map(c => { try { return require(c); } catch { return null; } }).find(Boolean)
  || (() => { throw new Error('Falta Playwright: npm install --no-save playwright'); })();

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const motor = html.slice(html.indexOf('const NS_W = '), html.indexOf('\nfunction nombreActa('));
assert.ok(motor.includes('async function actaDocx('), 'no se encontró el motor del acta');

const forma = [1, 2];
const fondo = [1,1,1, 2,2,2,2,3,3,3,3, 1,6,5,5,4,2,3,3, 2,3,1,2];
const acta = {
  carpeta: {materia: 'ELABORACIÓN DE PROYECTOS'},
  config: {unidad_competencia: 'ELABORACIÓN DE PROYECTOS', ciclo_texto: 'SEGUNDO', lugar: 'Cochabamba'},
  grupo: {numero: 12, nombre: 'B · Grupo 6', paralelo: 'B', tema: 'Sistema de saneamiento para el RA-5'},
  fecha_texto: 'Cochabamba, 23 de octubre de 2026',
  banda: {activa: true, aplicar_a: 'texto_65', modo: 'reescalado', nota_minima: 58, nota_maxima: 63},
  forma: forma.map((v, i) => ({orden: i + 1, valor_pct: v, nota: v})),
  fondo: fondo.map((v, i) => ({orden: i + 1, valor_pct: v, nota: v === 6 ? 4 : v})),
  exposicion: [2, 15, 10, 10].map((v, i) => ({orden: i + 1, valor_pct: v, nota: [2, 13, 9, 8.5][i]})),
  jurados: ['P009', 'P032', 'P022'].map((profesor_id, i) => ({profesor_id, nombre: 'Jurado ' + (i + 1), grado: 'Tcnl.'})),
  cursantes: ['Espinoza Vaca', 'Bravo Calle', 'Fernandez Villa', 'Ovalle Quisbert', 'Mercado Carrasco'].map((n, k) => ({
    nombre: n, grado: 'My.', arma: 'Inf.',
    detalle_evaluadores: ['P009', 'P032', 'P022'].map((profesor_id, j) => ({profesor_id, total: [34, 33, 32.5][j] - k * 0.5}))
  }))
};

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.setContent('<!doctype html><meta charset="utf-8"><body></body>');
await pagina.addScriptTag({path: path.join(raiz, 'jszip.min.js')});
await pagina.addScriptTag({path: path.join(raiz, 'evaluaciones/anexo-a-proyectos.js')});
await pagina.addScriptTag({content: 'function eemNombre(o){return [o.grado,o.arma,o.nombre].filter(Boolean).join(" ");}\n' + motor +
  '\nwindow.__acta = async a => { const u8 = await actaDocx(new Uint8Array(0), a);' +
  ' const z = await JSZip.loadAsync(u8); return {xml: await z.file("word/document.xml").async("string"),' +
  ' b64: btoa(Array.from(u8, c => String.fromCharCode(c)).join(""))}; };'});
const {xml, b64} = await pagina.evaluate(a => window.__acta(a), acta);
const original = await pagina.evaluate(async () => {
  const z = await JSZip.loadAsync(Uint8Array.from(atob(window.EEM_ANEXO_A_PROYECTOS_B64), c => c.charCodeAt(0)));
  return z.file('word/document.xml').async('string');
});
await navegador.close();
if (process.env.ACTA_SALIDA) fs.writeFileSync(process.env.ACTA_SALIDA, Buffer.from(b64, 'base64'));

// ── utilidades de lectura del XML ──
const texto = s => (s.match(/<w:t[^>]*>[^<]*<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('');
function tablasDe(x) {
  const body = x.slice(x.indexOf('<w:body>')), out = [];
  let d = 0, ini = 0;
  for (const m of body.matchAll(/<w:tbl>|<\/w:tbl>/g)) {
    if (m[0] === '<w:tbl>') { if (d++ === 0) ini = m.index; }
    else if (--d === 0) out.push(body.slice(ini, m.index + 8));
  }
  return out;
}
const filas = t => (t.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || []).map(tr => (tr.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []).map(texto));
const tablas = tablasDe(xml), tablasOrig = tablasDe(original);
const buscar = q => tablas.find(t => texto(t).toUpperCase().includes(q));

// 1 · encabezado: el valor va después de los dos puntos, el rótulo y sus tabulaciones quedan
const parrafo = q => (xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []).find(p => texto(p).startsWith(q));
assert.equal(texto(parrafo('PARALELO')), 'PARALELO: B');
assert.match(parrafo('PARALELO'), /<w:tab\/>/);
assert.equal(texto(parrafo('TEMA')), 'TEMA: Sistema de saneamiento para el RA-5');
assert.equal(texto(parrafo('CICLO')), 'CICLO: SEGUNDO');
assert.ok(xml.includes('UNIDAD DE COMPETENCIA: ELABORACIÓN DE PROYECTOS'));

// 2 · forma: el Anexo numera 2 y 3; las notas entran por posición
const tForma = filas(buscar('ASPECTOS DE FORMA (3%)'));
assert.deepEqual(tForma.filter(f => /^\d+$/.test(f[0])).map(f => [f[0], f.at(-1)]), [['2', '1.00'], ['3', '2.00']]);
assert.equal(tForma.find(f => f[0].startsWith('PROMEDIO PARCIAL')).at(-1), '3.00');

// 3 · fondo: 23 filas, cada una con su nota; totales parciales
const tFondo = filas(buscar('ASPECTOS DE FONDO'));
const numeradas = tFondo.filter(f => /^\d+$/.test(f[0]));
assert.equal(numeradas.length, 23);
numeradas.forEach((f, i) => assert.equal(f.at(-1), (fondo[i] === 6 ? 4 : fondo[i]).toFixed(2), 'fondo ítem ' + (i + 1)));
const rot = r => tFondo.find(f => f[0].startsWith(r)).at(-1);
assert.equal(rot('PROMEDIO PARCIAL'), '58.00');
assert.equal(rot('ASPECTOS DE FORMA'), '3.00');
assert.equal(rot('ASPECTO DE FONDO'), '58.00');
assert.equal(rot('TOTAL PARCIAL'), '61.00');

// 4 · impresión prolija con su nota; el cuadro de exposición queda IDÉNTICO al Anexo
assert.equal(filas(buscar('IMPRESIÓN PROLIJA')).find(f => f[0].startsWith('Impresión')).at(-1), '2.00');
const iExpo = tablasOrig.findIndex(t => texto(t).includes('EXPOSICIÓN, DEFENSA Y SUSTENTACIÓN GRUPAL'));
const tExpo = tablas.find(t => texto(t).includes('EXPOSICIÓN, DEFENSA Y SUSTENTACIÓN GRUPAL'));
assert.equal(tExpo, tablasOrig[iExpo], 'el cuadro de exposición no debe cambiar ni una coma');

// 5 · cursantes: escrito 58-63 en CADA fila, exposición promedio de los 3 jurados, final = suma
const escrito = Math.round((58 + 61 / 63 * 5) * 10000) / 10000;      // 62.8413
const tCur = filas(tablas.find(t => texto(t).includes('NOTA TEXTO')));
assert.deepEqual(tCur[0], ['GRADO, APELLIDOS Y NOMBRES  ', 'NOTA TEXTO 63%', 'NOTA EXPOSICIÓN 37%', 'NOTA FINAL 100%', 'FIRMA']);
const datos = tCur.slice(1);
assert.equal(datos.length, 5);
datos.forEach((f, k) => {
  const expo = (34 + 33 + 32.5) / 3 - k * 0.5;
  assert.equal(f[1], escrito.toFixed(2));
  assert.equal(f[2], expo.toFixed(2));
  assert.equal(f[3], (Math.round((escrito + expo) * 10000) / 10000).toFixed(2));
  assert.ok(Number(f[1]) >= 58 && Number(f[1]) <= 63);
});
console.log('Acta de Proyectos sobre el Anexo A: encabezado, forma, fondo, impresión, cuadro de exposición intacto y cursantes OK');
