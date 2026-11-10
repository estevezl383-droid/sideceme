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

function marcha({ teatro = true, escalon = 'cuerpo', medio = 'motor' } = {}) {
  const c = clock(), posiciones = [], nubes = [];
  const unidad = { id: 1, lng: 1, lat: 1, escalon, medio };
  const classes = new Set();
  const ficha = { __uid: 1, _map: {}, setLatLng: p => posiciones.push(p),
    _icon: { firstChild: { style: {}, classList: {
      contains: k => classes.has(k), add: k => classes.add(k), remove: k => classes.delete(k),
    } } } };
  const WG = { teatro, vivo: true, _vivo: {}, estado: { unidades: [unidad] },
    capa: { eachLayer: fn => fn(ficha) }, map: { getZoom: () => 8, removeLayer() {} } };
  const ctx = vm.createContext({ ...c, WG, document: { hidden: false }, Math: Object.assign(Object.create(Math), { random: () => .5 }),
    _wgUnidadPorId: id => String(id) === '1' ? unidad : null,
    _wgHav: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) * 111,
    _wgCuadro: fn => c.requestAnimationFrame(fn), _wgEn3D: () => false, _wgOrientar() {},
    WG_VIVO_MS: 7000, wgEstado: async () => {},
    L: { divIcon: value => value, marker: (p, options) => ({ addTo() { nubes.push({ p, options }); return this; } }) },
  });
  vm.runInContext(extract('function _wgVivoLatiendo(){', 'function wgVivo(btn){'), ctx);
  vm.runInContext(extract('const WG_TIC_MS=5000;', '// EL ESTADO QUE LLEGA NO HACE SALTAR A NADIE'), ctx);
  return { ...c, ctx, WG, unidad, posiciones, nubes };
}

test('activar el refresco en vivo antes de mover no sustituye la cola de marcha por un temporizador', () => {
  const m = marcha();
  m.setTimeout(() => {}, 7000); // En el navegador ya existen otros temporizadores.
  m.ctx._wgVivoLatiendo();
  assert.doesNotThrow(() => m.ctx._wgVivoEncolar(1, [[1.1, 1]], true));
  m.frame(1000); m.frame(2000);
  assert.ok(m.unidad.lng > 1 && m.unidad.lng < 1.1);
  assert.ok(m.posiciones.at(-1)[1] > m.posiciones[0][1], 'También avanza el marcador visible');
});

test('rearmar o apagar el refresco conserva una marcha que ya está avanzando', () => {
  const m = marcha();
  m.ctx._wgVivoEncolar(1, [[1.1, 1]], true);
  const cola = m.WG._vivo, recorrido = cola['1'];
  m.ctx._wgVivoLatiendo(); m.ctx._wgVivoLatiendo();
  assert.equal(m.WG._vivo, cola);
  assert.equal(m.timers.size, 1);
  m.WG.vivo = false; m.ctx._wgVivoLatiendo();
  assert.equal(m.timers.size, 0);
  assert.equal(m.WG._vivo['1'], recorrido);
  m.frame(1000); m.frame(2000);
  assert.ok(m.unidad.lng > 1);
});

test('la ficha alcanza su destino y termina de disipar el polvo sin dejar otro lazo pendiente', () => {
  const m = marcha();
  m.ctx._wgVivoEncolar(1, [[1.1, 1]], true);
  for (let t = 1000; m.frames.size && t < 30000; t += 250) m.frame(t);
  assert.equal(m.unidad.lng, 1.1);
  assert.equal(Object.keys(m.WG._vivo).length, 0);
  assert.equal(m.WG._vivoHumo.length, 0);
  assert.equal(m.WG._vivoAnda, false);
  assert.equal(m.frames.size, 0);
});

test('el cuerpo de ejército levanta una columna de polvo mayor y más persistente que la brigada', () => {
  const cuerpo = marcha(), brigada = marcha({ escalon: 'brigada' }), tactica = marcha({ teatro: false });
  for (const m of [cuerpo, brigada, tactica]) m.ctx._wgVivoPolvo({ id: '1' }, [1, 1], 0, 1000, false);
  const a = cuerpo.WG._vivoHumo, b = brigada.WG._vivoHumo, c = tactica.WG._vivoHumo;
  assert.ok(a.length > b.length && b.length > c.length);
  assert.ok(a[0].r0 > b[0].r0 && b[0].r0 > c[0].r0);
  assert.ok(a[0].vida > b[0].vida);
  assert.equal(c[0].r0, 24 * .55, 'El tamaño del modo táctico se conserva');
});

test('el polvo respeta su presupuesto de partículas y las unidades a pie no lo generan', () => {
  const m = marcha(), pie = marcha({ medio: 'pie' });
  for (let i = 0; i < 100; i++) m.ctx._wgVivoPolvo({ id: '1' }, [1, 1], 0, 1000, false);
  assert.ok(m.WG._vivoHumo.length <= 160);
  pie.ctx._wgVivoPolvo({ id: '1' }, [1, 1], 0, 1000, false);
  assert.equal((pie.WG._vivoHumo || []).length, 0);
  pie.ctx._wgVivoEncolar(1, [[1.1, 1]], true); pie.frame(1000);
  assert.equal((pie.WG._vivoHumo || []).length, 0);
});

test('la vista 3D recibe el polvo del cuerpo con su tamaño y termina limpiándolo', () => {
  const m = marcha(), dibujos = [];
  m.WG.map3d = { getZoom: () => 8, getSource: () => ({ setData: data => dibujos.push(data) }) };
  m.ctx._wgVivoPolvo({ id: '1' }, [1, 1], Math.PI / 2, 1000, true);
  assert.equal(m.nubes.length, 0, 'El 3D no crea marcadores de Leaflet');
  m.ctx._wgVivoPolvoPaso(1600, true);
  assert.equal(dibujos[0].features.length, 3);
  assert.ok(dibujos[0].features.every(f => f.properties._r > 40 && f.properties._op > 0));
  assert.ok(dibujos[0].features.every(f => f.geometry.coordinates[0] < 1), 'La estela queda detrás de la marcha');
  m.ctx._wgVivoPolvoPaso(6000, true);
  assert.equal(dibujos.at(-1).features.length, 0);
});
