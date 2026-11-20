// v2.9.495 — 🧹 UNA SOLA ORDEN VIVA POR UNIDAD. Con el reloj continuo, una orden que quedó pendiente en una
// jornada (una marcha trabada en combate, o larga) ya no revive cuando la unidad cumple otra más nueva.
//   NODE_PATH=<carpeta con typescript@5> node --test tests/wargame-ordenes-superadas.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const ts = require('typescript');
const { laboratorio } = require('./helpers/wargame-lab.cjs');

function motor() {
  const src = fs.readFileSync(path.join(__dirname, '../supabase/functions/wargame-ops/index.ts'), 'utf8').replace(/^import .*$/mg, '');
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None } }).outputText;
  return new Function('createClient', 'Deno', 'Request', 'Response', js + '\nreturn { ordenesSuperadas };')(
    () => ({}), { env: { get: () => '' }, serve: () => {} }, Request, Response);
}
const reloj = (lab) => lab.tables.wg_terreno.find((t) => t.tipo === 'reloj')?.geojson;

test('manda la orden más nueva de cada unidad; las anteriores se cierran', () => {
  const { ordenesSuperadas } = motor();
  const ctx = { hora: 50, horasTurno: 24, horas: 1, teatro: true };
  const fuera = ordenesSuperadas([
    { id: 5, unidad_id: 1, turno: 1, tipo: 'mover' }, { id: 9, unidad_id: 1, turno: 3, tipo: 'mover' },
    { id: 7, unidad_id: 2, turno: 2, tipo: 'defender' }, { id: 3, unidad_id: 1, turno: 1, tipo: 'defender' }, { id: null, unidad_id: 1 },
  ], ctx);
  assert.deepEqual([...fuera].sort(), [3, 5]);
  assert.equal(ordenesSuperadas([], ctx).size, 0);
});

test('a escala táctica, una orden con hora de arranque futura no corta a la que corre hasta que arranca', () => {
  const { ordenesSuperadas } = motor();
  const ordenes = [{ id: 5, unidad_id: 1, turno: 1, inicio: null }, { id: 9, unidad_id: 1, turno: 2, inicio: 20 }];
  // Jornada 2, hora 0: la nueva arranca a las 20 → la vieja sigue.
  assert.equal(ordenesSuperadas(ordenes, { hora: 24, horasTurno: 24, horas: 2 }).size, 0);
  // Jornada 2, hora 19: arranca dentro de este paso → la vieja se cierra.
  assert.deepEqual([...ordenesSuperadas(ordenes, { hora: 43, horasTurno: 24, horas: 2 })], [5]);
  // Una orden VIEJA con hora futura también queda superada por una más nueva que ya rige.
  assert.deepEqual([...ordenesSuperadas([{ id: 5, unidad_id: 1, turno: 1, inicio: 30 }, { id: 9, unidad_id: 1, turno: 1, inicio: null }],
    { hora: 0, horasTurno: 24, horas: 2 })], [5]);
});

test('la marcha de la jornada anterior no revive cuando la nueva se cumple (reloj continuo, teatro)', async () => {
  const lab = laboratorio();
  const imp = await lab.invoke('importar_escenario', { limpiar: true, escala: 'teatro',
    unidades: [{ bando: 'azul', designacion: 'FICHA A', escalon: 'brigada', arma: 'motorizada', medio: 'motor', lng: 1, lat: 1, poder_max: 40, obs_km: 30 }] });
  assert.equal(imp.ok, true, imp.error);
  assert.equal((await lab.invoke('iniciar')).ok, true);
  const u = lab.tables.wg_unidades[0], id = u.id;
  const orden = (lng) => lab.invoke('enviar_orden', { orden: { unidad_id: id, tipo: 'mover', ruta: [[u.lng, 1], [lng, 1]], destino_lng: lng, destino_lat: 1, mision: 'marcada' } });
  assert.equal((await orden(4)).ok, true);   // jornada 1: un destino lejano, no llega en el día
  assert.equal((await lab.invoke('reloj', { activo: true, velocidad: 2880 })).ok, true);
  reloj(lab).hEn = 23; lab.clock.now += 5000;
  const t1 = await lab.invoke('tic');
  assert.equal(t1.ok, true, t1.error); assert.equal(t1.turno, 2);
  const vieja = lab.tables.wg_ordenes.find((o) => o.unidad_id === id);
  assert.equal(vieja.estado, 'pendiente', 'la marcha larga sigue viva en la jornada 2');
  const x0 = u.lng;
  assert.ok(x0 > 1 && x0 < 1.2, `marchó una hora: ${x0}`);
  assert.equal((await orden(x0 + 0.1)).ok, true);   // jornada 2: otro destino, cerca
  assert.equal(lab.tables.wg_ordenes.filter((o) => o.unidad_id === id && o.estado === 'pendiente').length, 2);
  for (let k = 0; k < 4; k++) { lab.clock.now += 5000; const t = await lab.invoke('tic'); assert.equal(t.ok, true, t.error); }
  assert.equal(vieja.estado, 'resuelta', 'la orden de la jornada 1 quedó cerrada');
  assert.equal(lab.tables.wg_ordenes.filter((o) => o.unidad_id === id && o.estado === 'pendiente').length, 0);
  assert.ok(Math.abs(u.lng - (x0 + 0.1)) < 0.005, `se quedó en su destino nuevo y no volvió a la marcha vieja: ${u.lng}`);
});
