// Ciclo de vida del navegador y de las llamadas; no ejecuta el motor ni usa datos reales.
// node --test tests/wargame-reproduccion.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(process.env.SIDECEME_REPRO_HTML || path.join(__dirname, '..', 'index.html'), 'utf8');
function extract(start, end) {
  const from = html.indexOf(start), to = html.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `No se encontró ${start}`);
  return html.slice(from, to);
}
const framesSource = extract('function _wgCuadro(fn){', '// Las banderas de animación');
const invokeSource = extract('async function _wgInvoke(accion, extra){', 'function _wgEsInstructor()');

function clock() {
  let id = 0, now = 0;
  const timers = new Map(), frames = new Map();
  return {
    timers, frames, performance: { now: () => now },
    setTimeout(fn, ms) { const key = id++; timers.set(key, { fn, ms }); return key; },
    clearTimeout(key) { timers.delete(key); },
    requestAnimationFrame(fn) { const key = id++; frames.set(key, fn); return key; },
    cancelAnimationFrame(key) { frames.delete(key); },
    timer(at) {
      const [key, entry] = timers.entries().next().value || [];
      assert.ok(entry, 'Debe quedar un temporizador de respaldo');
      now = at; timers.delete(key); entry.fn();
    },
    frame(at) {
      const [key, fn] = frames.entries().next().value || [];
      assert.ok(fn, 'Debe quedar un cuadro');
      now = at; frames.delete(key); fn(at);
    },
  };
}
function scheduler(hidden = false) {
  const c = clock(), document = { hidden };
  const ctx = vm.createContext({ ...c, document });
  vm.runInContext(framesSource, ctx);
  return { ...c, document, run: ctx._wgCuadro };
}

test('un cuadro visible cancela el respaldo, incluso si el identificador del timer es cero', () => {
  const c = scheduler(), seen = [];
  c.run(t => seen.push(t));
  c.frame(16.7);
  assert.deepEqual(seen, [16.7]);
  assert.equal(c.timers.size, 0);
  assert.equal(c.frames.size, 0);
});

test('ocultar la pestaña después de solicitar el cuadro no congela la reproducción', () => {
  const c = scheduler(), seen = [];
  c.run(t => seen.push(t));
  c.document.hidden = true; // El rAF que ya estaba pedido nunca llega.
  c.timer(1000);
  assert.deepEqual(seen, [1000]);
  assert.equal(c.frames.size, 0);
  assert.equal(c.timers.size, 0);
});

test('un rAF tardío no reproduce dos veces el cuadro que entregó el respaldo', () => {
  const c = scheduler(), seen = [];
  c.run(t => seen.push(t));
  const lateFrame = [...c.frames.values()][0];
  c.timer(250);
  lateFrame(270);
  assert.deepEqual(seen, [250]);
});

test('un temporizador que ya estaba encolado tampoco duplica un cuadro', () => {
  const c = scheduler(), seen = [];
  c.run(t => seen.push(t));
  assert.ok(c.timers.size, 'El respaldo debe armarse antes de ocultar la pestaña');
  const lateTimer = [...c.timers.values()][0].fn;
  c.frame(16);
  lateTimer();
  assert.deepEqual(seen, [16]);
});

test('en segundo plano avanza sin depender de requestAnimationFrame', () => {
  const c = scheduler(true), seen = [];
  c.run(t => seen.push(t));
  assert.equal(c.frames.size, 0);
  c.timer(33);
  assert.deepEqual(seen, [33]);
});

test('volver de una pestaña oculta conserva un solo lazo de reproducción', () => {
  const c = scheduler(), seen = [];
  function next(t) { seen.push(t); if (seen.length < 3) c.run(next); }
  c.run(next);
  const lateFrame = [...c.frames.values()][0];
  c.document.hidden = true;
  c.timer(1000);
  c.document.hidden = false;
  c.timer(2000);
  lateFrame(2010);
  assert.equal(c.frames.size, 1);
  c.frame(2016);
  assert.deepEqual(seen, [1000, 2000, 2016]);
  assert.equal(c.frames.size + c.timers.size, 0);
});

test('si falla el consumidor no quedan callbacks duplicados pendientes', () => {
  const c = scheduler();
  c.run(() => { throw new Error('fallo ficticio'); });
  assert.throws(() => c.frame(16), /fallo ficticio/);
  assert.equal(c.frames.size + c.timers.size, 0);
});

function invoke(request, options = {}) {
  const c = clock(), calls = [], samples = [];
  const ctx = vm.createContext({
    ...c, Date, console,
    WG: { mon: false, invitado: null, ...options.wg },
    WG_MON_LECTURAS: { estado: true, pulso: true },
    getTokenSesion: () => options.token === undefined ? 'sesion-ficticia' : options.token,
    _wgRelojMuestra: (...args) => samples.push(args),
    sb: { functions: { invoke(name, args) { calls.push({ name, ...args }); return request(); } } },
  });
  vm.runInContext(invokeSource, ctx);
  return { ...c, calls, samples, run: ctx._wgInvoke };
}

test('una respuesta rápida libera su espera y conserva el contrato de la llamada', async () => {
  const c = invoke(() => Promise.resolve({ data: { ok: true, ahora_ms: 123 } }));
  assert.equal((await c.run('estado', { partida_id: 7 })).ok, true);
  assert.equal(c.timers.size, 0);
  assert.equal(c.calls[0].name, 'wargame-ops');
  assert.equal(c.calls[0].body.token, 'sesion-ficticia');
  assert.equal(c.calls[0].body.partida_id, 7);
  assert.equal(c.samples.length, 1);
});

test('el error del servidor sigue siendo legible y libera su espera', async () => {
  const c = invoke(() => Promise.resolve({ error: { message: 'HTTP error', context: {
    json: async () => ({ error: 'mensaje ficticio del servidor' }),
  } } }));
  assert.equal((await c.run('estado')).error, 'mensaje ficticio del servidor');
  assert.equal(c.timers.size, 0);
});

test('un rechazo de red libera su espera', async () => {
  const c = invoke(() => Promise.reject(new Error('sin conexión ficticia')));
  assert.match((await c.run('estado')).error, /sin conexión ficticia/);
  assert.equal(c.timers.size, 0);
});

for (const [action, ms] of [['estado', 20000], ['resolver_turno', 45000]]) {
  test(`el límite de ${action} sigue cortando una llamada que nunca responde`, async () => {
    let finish;
    const c = invoke(() => new Promise(resolve => { finish = resolve; }));
    const result = c.run(action);
    assert.equal([...c.timers.values()][0].ms, ms);
    c.timer(ms);
    assert.match((await result).error, new RegExp(`no respondió en ${ms / 1000} segundos`));
    finish({ data: { ok: true, ahora_ms: 123 } });
    await Promise.resolve();
    assert.equal(c.samples.length, 0, 'La respuesta tardía no cambia el reloj');
    assert.equal(c.timers.size, 0);
  });
}

test('sin sesión no se envía ninguna llamada ni se arma una espera', async () => {
  const c = invoke(() => assert.fail('No debe llamar'), { token: null });
  assert.match((await c.run('estado')).error, /sesión venció/);
  assert.equal(c.calls.length + c.timers.size, 0);
});

test('la pantalla de monitoreo conserva su acceso de lectura', async () => {
  const c = invoke(() => assert.fail('No debe llamar'), { wg: { mon: true } });
  assert.match((await c.run('reloj', { activo: true })).error, /sólo mira/);
  assert.equal(c.calls.length + c.timers.size, 0);
});
