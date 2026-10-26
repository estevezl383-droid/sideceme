// ⚔️ El Juego de Guerra trae las DOS fases enfrentadas (v2.9.437): el evento crítico de la Matriz de sincronización
// (F4·P6-7) y «⚔️ Enfrentar una fase 🔵 con una fase 🔴». Corre las funciones REALES de index.html (_wgFasesCOA,
// _wgPreguntarFase y _wgEscenarioDesde) y el cuadro de elección en Chromium.
//   node --test tests/wargame-evento-critico.test.cjs
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const corte = (desde, hasta) => {
  const i = html.indexOf(desde), j = html.indexOf(hasta, i);
  assert.ok(i > 0 && j > i, 'no se encontró ' + desde);
  return html.slice(i, j);
};
// Desde los ⚔️ hasta el fin de _wgEscenarioDesde (con las tablas de instalaciones y ejes que usa).
const fuente = corte('// v2.9.437 — ⚔️ LAS DOS FASES ENFRENTADAS', '// v2.9.352 — VARIOS ARCHIVOS')
  .replace(/\/\/ =+\s*$/, '');
const auxiliares = [
  html.match(/function _rgEsc\(s\)\{[^\n]*\n/)[0],
  corte('const WG_PODER=', ';\n') + ';\n',
  corte('const WG_OBS=', ';\n') + ';\n',   // con «=»: WG_OBS_MESA (v2.9.439) empieza igual
  // v2.9.439: la importación arma los MEDIOS de cada unidad (catálogo de armas,
  // autonomía y los espejos de sistemas / UF / tanque).
  corte('const WG_ARMAS={', '// ============================================================\n// v2.9.214 — PANEL DE SISTEMAS DE ARMAS.'),
  html.match(/const WG_AUTONOMIA=\{[^\n]*\n/)[0],
  html.match(/function _wgEsConvoy\(u\)\{[^\n]*\n/)[0],
  html.match(/function _wgMedioDe\(u\)\{[^\n]*\n/)[0],
  corte('// v2.9.439 — LOS MEDIOS DE VERDAD DE CADA UNIDAD. Espejo', 'const WG_ROMANO='),
].join('');
const W = new Function(auxiliares + fuente + `
  function _wgNumerarUnidades(u){ return u; }
  function _wgMedioPorArma(){ return 'pie'; }
  return { _wgFasesCOA, _wgEscenarioDesde, _wgEnfrentar, _wgPreguntarFase };`)();

const azul = (id, lng) => ({ id, designacion: id, bando: 'propias', tipo: 'unidad', escalon: 'division', lng, lat: -18.5 });
const roja = (id, lng) => ({ id, designacion: id, bando: 'enemigo', tipo: 'unidad', escalon: 'batallon', lng, lat: -18.5 });
const asdi = { bando: 'propias', tipo: 'instalacion', instalacion: 'asdi', lng: -68.2, lat: -18.6 };
// La fase 🔵 se guarda SIN rojas (la Mesa saca las que puso a la vista); la 🔴 lleva a los azules donde estaban.
const ej = () => ({
  nombre: 'CE-I (FICT.)',
  unidades: [azul('DIV-1', -68.4), roja('BIA-1', -69.9), asdi],
  ops: { ejesLog: [] },
  fasesCOA: {
    propio: [
      { nombre: 'Concentración', unidades: [azul('DIV-1', -68.4)], ops: {} },
      { nombre: 'Ocupación', unidades: [azul('DIV-1', -68.86)], ops: { tareas: [{ tarea: 'bloquear' }] }, contra: 2 },
    ],
    enemigo: [
      { coa: 'probable', n: 1, nombre: 'Ramificación', unidades: [azul('DIV-1', -68.4), roja('BIA-1', -69.9)] },
      { coa: 'probable', n: 2, nombre: 'Apresto', unidades: [azul('DIV-1', -68.4), roja('BIA-1', -69.5)] },
      { coa: 'probable', n: 3, nombre: 'Ataque', unidades: [azul('DIV-1', -68.4), roja('BIA-1', -68.95), roja('BTQ-1', -68.97)] },
      { coa: 'peligroso', n: 1, nombre: 'Ataque', unidades: [azul('DIV-1', -68.4), roja('BTQ-9', -68.9)] },
    ],
  },
  g3: { _caps: { activo: 1, guardados: { 2: { fases: [{ nombre: 'Retardo', unidades: [azul('DIV-1', -69.0)] }] } } } },
});
const ids = (us) => us.filter((u) => u.tipo !== 'instalacion').map((u) => `${u.id}@${u.lng}`).sort();

test('el evento crítico guardado en la Matriz de sincronización va PRIMERO, con azules de la 🔵 y rojas de la 🔴', () => {
  const d = ej();
  d.g3.sincro = { _evento: { cap: 1, azul: 1, rojo: 2, coa: 'probable' } };
  const f = W._wgFasesCOA(d);
  assert.strictEqual(f[0].evento, true);
  assert.strictEqual(f[0].nombre, '⚔️ EVENTO CRÍTICO — CAP 1 · Fase II — Ocupación contra CAE más probable · Fase III — Ataque');
  assert.deepStrictEqual(ids(f[0].unidades), ['BIA-1@-68.95', 'BTQ-1@-68.97', 'DIV-1@-68.86']);
  assert.deepStrictEqual([f[0].nAzul, f[0].nRojo], [1, 2]);
  // Al tablero: las unidades de las dos fases, el calco (tareas) de la propia y el ASDI del estado vivo.
  const esc = W._wgEscenarioDesde(d, f[0]);
  assert.deepStrictEqual(esc.unidades.map((u) => `${u.bando}:${u.lng}`).sort(), ['azul:-68.86', 'rojo:-68.95', 'rojo:-68.97']);
  assert.strictEqual(esc.instalaciones.length, 1);
  assert.strictEqual(esc.fase, f[0].nombre);
});

test('el archivo bajado desde la Mesa trae `eventoCritico` ya armado', () => {
  const d = ej();
  d.eventoCritico = { nombre: 'EVENTO CRÍTICO — X contra Y', unidades: [azul('A', -68), roja('R', -68.1)], ops: { tareas: [] } };
  const f = W._wgFasesCOA(d);
  assert.strictEqual(f[0].nombre, '⚔️ EVENTO CRÍTICO — X contra Y');
  assert.deepStrictEqual(ids(f[0].unidades), ['A@-68', 'R@-68.1']);
});

test('la fase 🔵 con `contra` (🎬 C.A. por fases) ya no llega sin enemigo', () => {
  const f = W._wgFasesCOA(ej());
  const p = f.filter((x) => x.bando === 'propio');
  assert.deepStrictEqual(p.map((x) => x.nombre), ['CAP 1 · Fase I — Concentración', 'CAP 1 · Fase II — Ocupación ⚔️ contra CAE más probable · Fase III — Ataque']);
  assert.deepStrictEqual(ids(p[0].unidades), ['DIV-1@-68.4']);
  assert.deepStrictEqual(ids(p[1].unidades), ['BIA-1@-68.95', 'BTQ-1@-68.97', 'DIV-1@-68.86']);
  assert.ok(!f.some((x) => x.evento), 'sin evento guardado no hay opción ⚔️ EVENTO CRÍTICO');
  // Las 🔴 siguen como antes, con su nombre del CAE.
  assert.deepStrictEqual(f.filter((x) => x.bando === 'enemigo').map((x) => x.nombre), ['CAE más probable · Fase I — Ramificación', 'CAE más probable · Fase II — Apresto', 'CAE más probable · Fase III — Ataque', 'CAE más peligroso · Fase I — Ataque']);
  // Para «⚔️ Enfrentar»: también el CAP guardado.
  assert.deepStrictEqual(f._azules.map((a) => a.nombre), ['CAP 1 · Fase I — Concentración', 'CAP 1 · Fase II — Ocupación', 'CAP 2 · Fase I — Retardo (guardado)']);
  assert.strictEqual(f._rojas.length, 4);
});

test('las fichas «enemigas» de la Mesa entran como ROJO (antes entraban como AZUL)', () => {
  const d = ej();
  d.fasesCOA.enemigo[2].unidades = d.fasesCOA.enemigo[2].unidades.map((u) => (u.bando === 'enemigo' ? { ...u, bando: 'enemigas' } : u));
  d.g3.sincro = { _evento: { cap: 1, azul: 1, rojo: 2 } };
  const f = W._wgFasesCOA(d);
  assert.deepStrictEqual([f[0].nAzul, f[0].nRojo], [1, 2]);
  assert.deepStrictEqual(W._wgEscenarioDesde(d, f[0]).unidades.map((u) => u.bando).sort(), ['azul', 'rojo', 'rojo']);
});

test('las agrupaciones de la organización para el combate (OD, OC, RES) no entran como «brigadas»', () => {
  const ag = (id) => ({ id, designacion: id, bando: 'propias', tipo: 'unidad', escalon: 'brigada', esAgrupacion: true, agrupacion: true, agId: 'g-' + id, lng: -68.8, lat: -18.5 });
  const d = ej();
  d.fasesCOA.propio[1].unidades.push(ag('OD'), ag('OC 1'), ag('RES'));
  d.g3.sincro = { _evento: { cap: 1, azul: 1, rojo: 2 } };
  const f = W._wgFasesCOA(d);
  assert.deepStrictEqual([f[0].nAzul, f[0].nRojo], [1, 2], 'la cuenta del cuadro no las suma');
  const esc = W._wgEscenarioDesde(d, f[0]);
  assert.deepStrictEqual(esc.unidades.map((u) => u.designacion).sort(), ['BIA-1', 'BTQ-1', 'DIV-1']);
  assert.deepStrictEqual(esc.agrupaciones, ['OD', 'OC 1', 'RES']);
  // Si el bando SÓLO tiene agrupaciones, quedan (son su única maniobra).
  const solo = { unidades: [ag('OD'), roja('R', -69)], fasesCOA: {} };
  assert.deepStrictEqual(W._wgEscenarioDesde(solo, null).unidades.map((u) => u.designacion).sort(), ['OD', 'R']);
});

test('un ejercicio de antes (sin CAP ni CAE con nombre) se sigue viendo igual', () => {
  const d = { unidades: [], fasesCOA: { propio: [{ unidades: [azul('A', -68)] }], enemigo: [{ unidades: [roja('R', -69), azul('A', -68)] }] } };
  const f = W._wgFasesCOA(d);
  assert.deepStrictEqual(f.map((x) => x.nombre), ['COA PROPIO · Fase I', 'COA ENEMIGO · Fase I']);
  assert.deepStrictEqual(ids(f[1].unidades), ['A@-68', 'R@-69']);
  assert.strictEqual(W._wgFasesCOA({ unidades: [] }).length, 0);
});

test('el cuadro de elección en Chromium: ⚔️ EVENTO CRÍTICO y ⚔️ Enfrentar con dos listas', async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_e) { return; }
  const b = await chromium.launch();
  try {
    const page = await b.newPage();
    await page.setContent('<div id="wg-imp-estado"></div>');
    await page.addScriptTag({ content: auxiliares + fuente + '\nwindow._wgFasesCOA=_wgFasesCOA;window._wgPreguntarFase=_wgPreguntarFase;' });
    const d = ej();
    d.g3.sincro = { _evento: { cap: 1, azul: 1, rojo: 2 } };
    const poner = 't=>document.getElementById("wg-imp-estado").innerHTML=t';
    // 1) El evento crítico.
    let r = page.evaluate(([d, p]) => window._wgPreguntarFase(Object.assign(window._wgFasesCOA(d), { _vivas: {} }), eval(p)).then((x) => x && x.nombre), [d, poner]);
    await page.waitForSelector('button[data-fase="0"]');
    assert.match(await page.textContent('button[data-fase="0"]'), /⚔️ EVENTO CRÍTICO — CAP 1 · Fase II — Ocupación contra CAE más probable · Fase III — Ataque — 3 unidad\(es\) de combate 🔵 1 🔴 2/);
    await page.click('button[data-fase="0"]');
    assert.match(await r, /^⚔️ EVENTO CRÍTICO/);
    // 2) Otra pareja: CAP 2 (guardado) contra el CAE más peligroso.
    r = page.evaluate(([d, p]) => window._wgPreguntarFase(Object.assign(window._wgFasesCOA(d), { _vivas: {} }), eval(p)).then((x) => x && { nombre: x.nombre, us: x.unidades.map((u) => u.id + '@' + u.lng) }), [d, poner]);
    await page.waitForSelector('#wg-enf-azul');
    // La pareja del evento crítico ya viene elegida en las dos listas.
    assert.deepStrictEqual([await page.inputValue('#wg-enf-azul'), await page.inputValue('#wg-enf-rojo')], ['1', '2']);
    // Orden: el evento crítico, «⚔️ Enfrentar», el estado actual y al final las fases sueltas.
    const orden = await page.$$eval('#wg-imp-estado button[data-fase]', (bs) => bs.map((b) => b.getAttribute('data-fase')));
    assert.deepStrictEqual(orden.slice(0, 3), ['0', 'enfrentar', 'viva']);
    assert.match(await page.textContent('#wg-imp-estado'), /Una fase sola, sin enfrentar/);
    await page.selectOption('#wg-enf-azul', '2');
    await page.selectOption('#wg-enf-rojo', '3');
    await page.click('button[data-fase="enfrentar"]');
    const x = await r;
    assert.strictEqual(x.nombre, '⚔️ CAP 2 · Fase I — Retardo (guardado) contra CAE más peligroso · Fase I — Ataque');
    assert.deepStrictEqual(x.us, ['DIV-1@-69', 'BTQ-9@-68.9']);
  } finally {
    await b.close();
  }
});
