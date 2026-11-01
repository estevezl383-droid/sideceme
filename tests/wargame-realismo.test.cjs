// 🎖️ EL JUEGO DE GUERRA DE VERDAD (v2.9.443). Lo pidió Sergio el 31-10-2026: «rojo pasa sobre terreno severamente
// restringido y no se detiene… las unidades disparan hacia la posición antes de que lleguen… no se sincroniza…
// moví vehículos de abastecimiento y estaban disparando como si fueran división… el vehículo deja su abastecimiento y
// vuelve, no deja abastecido a cada aparato… quiero que se les acabe la munición y el combustible de acuerdo a lo que
// planificaron… terreno restringido y severamente restringido no se pasa… la ingeniería puede trabajar en ríos o campos
// minados, pero eso toma tiempo». Confirmado el 31-10: la infantería a pie cruza el restringido despacio (a) y frenan
// los ríos y las lagunas, no las quebradas, con la tropa a pie vadeando despacio (b).
// Se prueba sobre el MOTOR REAL (supabase/functions/wargame-ops/index.ts), las funciones REALES del Juego (index.html)
// y el MANEJADOR REAL de la Edge Function contra una base en memoria (con el tope de 1.000 filas de PostgREST).
//   node --test tests/wargame-realismo.test.cjs
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');

let ts;
try { ts = require('typescript'); } catch (_e) { ts = require('/opt/node-tools/node_modules/typescript'); }
const SRC = fs.readFileSync(path.join(__dirname, '..', 'supabase/functions/wargame-ops/index.ts'), 'utf8');
function cargarMotor() {
  const corte = SRC.indexOf('Deno.serve(');
  assert.ok(corte > 0, 'no se encontró Deno.serve');
  const js = ts.transpileModule(SRC.slice(0, corte).replace(/^import .*$/mg, ''), { compilerOptions: { target: 'ES2020', module: 'None' } }).outputText;
  const expo = ['claseTerreno', 'moverPorRuta', 'prepararTerreno', 'resolverTurno', 'haversineKm', 'reabastecer', 'rutaPorCaminos',
    'horasDeObra', 'VEL', 'puntoEnGeom'];
  const f = new Function('globalThis', 'createClient', js + '\nreturn {' + expo.join(',') + '};');
  globalThis.Deno = { env: { get() { return ''; } }, serve() {} };
  return f(globalThis, () => ({}));
}
const M = cargarMotor();

// ── Las funciones del Juego (la previsión de la orden), cortadas tal cual ──────────────────────────────────────────
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const corte = (desde, hasta) => {
  const i = html.indexOf(desde), j = html.indexOf(hasta, i + desde.length);
  assert.ok(i > 0 && j > i, 'no se encontró ' + desde);
  return html.slice(i, j);
};
const linea = (re) => { const m = html.match(re); assert.ok(m, 'no se encontró ' + re); return m[0] + '\n'; };
const W = new Function([
  'const WG={ terreno:[] };',
  linea(/function _wgEsConvoy\(u\)\{[^\n]*/),
  linea(/const WG_AUTONOMIA=\{[^\n]*/),
  linea(/function _wgMediosDe\(u\)\{[^\n]*/),
  corte('function _wgTanqueDe(u){', '// Sistemas de armas de una unidad'),
  corte('// v2.9.191: helpers del alcance de observación', 'function _wgHoras(h)'),
].join('\n') + '\nreturn { WG, _wgPreverRuta, _wgClaseTerreno, _wgPrepTerreno, _wgPtEnGeom };')();

// ── Campo de juego sintético a la latitud de «ZAPATO II» (−18,5°), en km ────────────────────────────────────────────
const LAT0 = -18.5, LNG0 = -68.7;
const KX = 111.32 * Math.cos(LAT0 * Math.PI / 180), KY = 110.57;
const pt = (x, y) => [LNG0 + x / KX, LAT0 + y / KY];
const xk = (p) => (p[0] - LNG0) * KX;
const yk = (p) => (p[1] - LAT0) * KY;
const cuadro = (x0, y0, x1, y1) => [pt(x0, y0), pt(x1, y0), pt(x1, y1), pt(x0, y1), pt(x0, y0)];
const unidad = (extra) => Object.assign({ id: 1, bando: 'azul', designacion: 'BI-1', escalon: 'batallon', arma: 'infanteria',
  medio: 'motor', poder_max: 12, poder_actual: 12, estado: 'activa', obs_km: 6, combustible_km: 0, lng: pt(0, 0)[0], lat: pt(0, 0)[1] }, extra);
const en = (u, x, y) => Object.assign(u, { lng: pt(x, y)[0], lat: pt(x, y)[1] });
const turno = (unidades, ordenes, extra) => M.resolverTurno(Object.assign({ duracion_turno_horas: 2, rango_combate_km: 3, turno: 5,
  terreno: [], unidades, ordenes: ordenes || [], instalaciones: [] }, extra || {}));
const mover = (id, x, y, extra) => Object.assign({ id, unidad_id: id, tipo: 'mover', destino_lng: pt(x, y)[0], destino_lat: pt(x, y)[1] }, extra || {});

// Río N-S en x=5 con un camino E-O en y=0 que lo cruza (el puente); franja restringida en x=10..11.5 con una senda
// en y=3; laguna en (0..2, 6..8); humedal sin nombre en (−4..−2, 6..8); ferrocarril y aeródromo.
const RIO = { tipo: 'hidro', geojson: { type: 'LineString', coordinates: [pt(5, -20), pt(5, 20)], nom: 'Río Lauca' } };
const RUTA = { tipo: 'via', geojson: { type: 'LineString', coordinates: [pt(-20, 0), pt(25, 0)], nom: 'Ruta A' } };
const RESTR = { tipo: 'restringido', geojson: { type: 'Polygon', coordinates: [cuadro(10, -20, 11.5, 20)] } };
const SENDA = { tipo: 'via', geojson: { type: 'LineString', coordinates: [pt(8, 3), pt(14, 3)], nom: 'Sendero de herradura' } };
const LAGUNA = { tipo: 'hidro', geojson: { type: 'Polygon', coordinates: [cuadro(0, 6, 2, 8)], nom: 'Laguna Macaya' } };
const HUMEDAL = { tipo: 'hidro', geojson: { type: 'Polygon', coordinates: [cuadro(-4, 6, -2, 8)], nom: 'Sin nombre' } };
const FFCC = { tipo: 'via', geojson: { type: 'LineString', coordinates: [pt(10.5, -20), pt(10.5, 20)], nom: 'Ferrocarril Arica-La Paz', e: { k: 'comunicaciones_ffcc' } } };
const AERO = { tipo: 'via', geojson: { type: 'Polygon', coordinates: [cuadro(-12, 10, -10, 12)], nom: 'Aeródromo', e: { k: 'comunicaciones_aero' } } };
const QUEBRADA = { tipo: 'hidro', geojson: { type: 'LineString', coordinates: [pt(-8, -20), pt(-8, 20)], nom: 'Quebrada' } };
const CARTA = [RIO, RUTA, RESTR, SENDA, LAGUNA, HUMEDAL, FFCC, AERO, QUEBRADA];

// ════════════════════════════════════════ 1) LA MOVILIDAD ════════════════════════════════════════════════════════
test('ZAPATO II, turno 1 (datos reales): el blindado rojo ya no cruza el terreno severo — se detiene en el borde', () => {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'datos', 'zapato2-turno1-carampague.json'), 'utf8'));
  const T = M.prepararTerreno(d.terreno);
  const r = M.moverPorRuta({ ...d.unidad }, d.ruta, T, 2, 1);
  assert.strictEqual(r.detenida, true);
  assert.strictEqual(r.llego, false);
  assert.match(r.motivo, /terreno severo infranqueable para motor/);
  // Ni un metro adentro: se recorre su ruta cada 10 m.
  const SEV = M.prepararTerreno(d.terreno.filter((t) => t.tipo === 'severo'));
  let adentro = 0;
  for (let i = 1; i < r.ruta.length; i++) {
    const a = r.ruta[i - 1], b = r.ruta[i], L = M.haversineKm(a, b), n = Math.max(1, Math.ceil(L / 0.01));
    for (let k = 0; k < n; k++) {
      const q = [a[0] + (b[0] - a[0]) * (k + 0.5) / n, a[1] + (b[1] - a[1]) * (k + 0.5) / n];
      if (M.claseTerreno(q, SEV) === 'severo') adentro += L / n;
    }
  }
  assert.ok(adentro < 0.005, 'metros dentro del severo: ' + Math.round(adentro * 1000));
  // Antes (v2.9.442) llegaba: 5,3 km con 126 m adentro del severo. Ahora para a los ~3 km.
  assert.ok(r.avanzadoKm > 2.5 && r.avanzadoKm < 3.5, 'km: ' + r.avanzadoKm);
});

test('el suelo se mira cada 50 m: una franja severa de 120 m entre dos pasos de 500 m ya no se salta', () => {
  const franja = { tipo: 'severo', geojson: { type: 'Polygon', coordinates: [cuadro(2.2, -5, 2.32, 5)] } };
  const r = M.moverPorRuta(unidad({}), [pt(6, 0)], M.prepararTerreno([franja]), 2, 1);
  assert.strictEqual(r.detenida, true);
  assert.ok(xk([r.lng, r.lat]) < 2.21, 'quedó antes de la franja: x=' + xk([r.lng, r.lat]).toFixed(3));
});

test('sólo el camino de verdad abre paso: la senda sirve a pie, el ferrocarril y el aeródromo no son camino', () => {
  const T = M.prepararTerreno(CARTA);
  assert.strictEqual(M.claseTerreno(pt(10.5, 3), T), 'restringido');                  // senda, en vehículo
  assert.strictEqual(M.claseTerreno(pt(10.5, 3), T, null, 'pie'), 'camino');          // senda, a pie
  assert.strictEqual(M.claseTerreno(pt(10.5, -5), T), 'restringido');                 // sobre el ferrocarril
  assert.strictEqual(M.claseTerreno(pt(-11, 11), T), 'libre');                        // en el aeródromo
  assert.strictEqual(M.claseTerreno(pt(10.5, 0), T), 'camino');                       // la ruta sí cruza el restringido
  // Lo importado antes de la v2.9.439 (sin capa): la línea sin nombre sigue siendo camino.
  const viejo = M.prepararTerreno([RESTR, { tipo: 'via', geojson: { type: 'LineString', coordinates: [pt(8, -2), pt(14, -2)], nom: 'Sin nombre' } }]);
  assert.strictEqual(M.claseTerreno(pt(10.5, -2), viejo), 'camino');
  // Un motorizado por la senda se frena en el restringido; la infantería la camina.
  assert.strictEqual(M.moverPorRuta(unidad({ lng: pt(8, 3)[0], lat: pt(8, 3)[1] }), [pt(14, 3)], T, 2, 1).detenida, true);
  assert.strictEqual(M.moverPorRuta(unidad({ medio: 'pie', lng: pt(8, 3)[0], lat: pt(8, 3)[1] }), [pt(14, 3)], T, 2, 1).llego, true);
});

test('restringido: ningún vehículo; a pie 1,5 km/h. Severo: nadie (Sergio, a: «sí»)', () => {
  const T = M.prepararTerreno([RESTR]);
  for (const medio of ['motor', 'oruga']) {
    const r = M.moverPorRuta(unidad({ medio, lng: pt(9, 5)[0], lat: pt(9, 5)[1] }), [pt(13, 5)], T, 2, 1);
    assert.strictEqual(r.detenida, true, medio);
    assert.match(r.motivo, /terreno restringido infranqueable/);
  }
  const cv = M.moverPorRuta(unidad({ arma: 'convoy', lng: pt(9, 5)[0], lat: pt(9, 5)[1] }), [pt(13, 5)], T, 2, 1);
  assert.strictEqual(cv.detenida, true, 'el camión 6×6 tampoco');
  const pie = M.moverPorRuta(unidad({ medio: 'pie', lng: pt(9, 5)[0], lat: pt(9, 5)[1] }), [pt(13, 5)], T, 2, 1);
  assert.strictEqual(pie.llego, true);
  // 1,5 km de restringido a 1,5 km/h + 2,5 km de campo a 5 km/h ≈ 1,5 h
  assert.ok(pie.horasUsadas > 1.4 && pie.horasUsadas < 1.6, 'horas: ' + pie.horasUsadas);
  const sev = M.prepararTerreno([{ tipo: 'severo', geojson: RESTR.geojson }]);
  assert.strictEqual(M.moverPorRuta(unidad({ medio: 'pie', lng: pt(9, 5)[0], lat: pt(9, 5)[1] }), [pt(13, 5)], sev, 2, 1).detenida, true);
  assert.strictEqual(M.VEL.pie.severo, null);
});

test('los ríos y las lagunas frenan; el puente del camino cruza; a pie se vadea despacio; la quebrada no frena (b: «sí»)', () => {
  const T = M.prepararTerreno(CARTA);
  assert.strictEqual(M.claseTerreno(pt(5, 5), T), 'rio');
  assert.strictEqual(M.claseTerreno(pt(5, 0), T), 'camino');                           // el puente
  assert.strictEqual(M.claseTerreno(pt(1, 7), T), 'agua');                             // la laguna
  assert.strictEqual(M.claseTerreno(pt(-3, 7), T), 'restringido');                     // el humedal sin nombre
  assert.strictEqual(M.claseTerreno(pt(-8, 5), T), 'libre');                           // la quebrada
  const mot = M.moverPorRuta(unidad({ lng: pt(0, 5)[0], lat: pt(0, 5)[1] }), [pt(8, 5)], T, 2, 1);
  assert.strictEqual(mot.detenida, true);
  assert.match(mot.motivo, /un río sin puente infranqueable para motor/);
  assert.strictEqual(M.moverPorRuta(unidad({ lng: pt(0, 0.5)[0], lat: pt(0, 0.5)[1] }), [pt(0, 0), pt(8, 0)], T, 2, 1).llego, true);
  const pie = M.moverPorRuta(unidad({ medio: 'pie', lng: pt(4, 5)[0], lat: pt(4, 5)[1] }), [pt(6, 5)], T, 2, 1);
  assert.strictEqual(pie.llego, true);
  assert.ok(pie.porClase.rio > 0.09 && pie.porClase.rio < 0.11, 'vadeó 100 m: ' + pie.porClase.rio);
  assert.ok(pie.horasUsadas > 0.55 && pie.horasUsadas < 0.62, 'a 0,5 km/h en el río: ' + pie.horasUsadas);
  assert.strictEqual(M.moverPorRuta(unidad({ medio: 'pie', lng: pt(1, 4)[0], lat: pt(1, 4)[1] }), [pt(1, 10)], T, 2, 1).detenida, true);
});

test('la previsión de la orden dice exactamente lo mismo que el motor (río, puente, senda, laguna, huecos, brecha)', () => {
  const hueco = { tipo: 'severo', geojson: { type: 'Polygon', coordinates: [cuadro(-20, -20, -14, -14), cuadro(-18, -18, -16, -16)] } };
  const brecha = { tipo: 'via', bando: 'azul', geojson: { type: 'Polygon', coordinates: [cuadro(9.9, 7.9, 11.6, 8.1)], obra: 'brecha' } };
  const carta = [...CARTA, hueco, brecha];
  W.WG.terreno = W._wgPrepTerreno(carta);
  const T = M.prepararTerreno(carta);
  const casos = [
    [unidad({ lng: pt(0, 5)[0], lat: pt(0, 5)[1] }), [pt(8, 5)]],
    [unidad({ lng: pt(0, 0.5)[0], lat: pt(0, 0.5)[1] }), [pt(0, 0), pt(8, 0)]],
    [unidad({ medio: 'pie', lng: pt(4, 5)[0], lat: pt(4, 5)[1] }), [pt(6, 5)]],
    [unidad({ lng: pt(8, 3)[0], lat: pt(8, 3)[1] }), [pt(14, 3)]],
    [unidad({ medio: 'pie', lng: pt(8, 3)[0], lat: pt(8, 3)[1] }), [pt(14, 3)]],
    [unidad({ medio: 'pie', lng: pt(1, 4)[0], lat: pt(1, 4)[1] }), [pt(1, 10)]],
    [unidad({ medio: 'oruga', lng: pt(9, 8)[0], lat: pt(9, 8)[1] }), [pt(13, 8)]],     // por la brecha
    [unidad({ lng: pt(-17, -21)[0], lat: pt(-17, -21)[1] }), [pt(-17, -17)]],           // al hueco del severo
    [unidad({ arma: 'convoy', lng: pt(-15, 0.5)[0], lat: pt(-15, 0.5)[1] }), [pt(-10, 8)]],
  ];
  for (const [u, ruta] of casos) {
    const m = M.moverPorRuta(u, ruta, T, 2, 1);
    const p = W._wgPreverRuta(u, ruta, 2);
    assert.strictEqual(p.detenida, m.detenida, JSON.stringify([u.medio, ruta[0]]));
    assert.strictEqual(p.llego, m.llego);
    assert.ok(M.haversineKm([p.lng, p.lat], [m.lng, m.lat]) < 1e-6, 'misma parada');
    assert.ok(Math.abs(p.horasUsadas - m.horasUsadas) < 1e-9, 'mismas horas');
  }
  W.WG.terreno = [];
});

// ════════════════════════════════════════ 2) EL TURNO EN EL TIEMPO ════════════════════════════════════════════════
test('dos que se topan se detienen DONDE se encontraron, a la misma hora, y los tiros llevan esa hora', () => {
  const az = unidad({ id: 1, designacion: 'BI-AZ' }), ro = en(unidad({ id: 2, bando: 'rojo', designacion: 'BI-RO' }), 30, 0);
  const res = turno([az, ro], [mover(1, 30, 0), mover(2, 0, 0)]);
  const A = res.unidades.find((u) => u.id === 1), R = res.unidades.find((u) => u.id === 2);
  assert.ok(Math.abs(xk([A.lng, A.lat]) - 13.5) < 0.05 && Math.abs(xk([R.lng, R.lat]) - 16.5) < 0.05, 'a 3 km uno del otro');
  assert.ok(A.combustible_km < 14 && A.combustible_km > 13, 'gastó sólo lo que anduvo: ' + A.combustible_km);
  const tz = res.trazas.find((t) => t.id === 1);
  assert.strictEqual(tz.contacto, true);
  assert.strictEqual(tz.tt.length, tz.ruta.length, 'cada punto con su hora');
  const h = tz.tt[tz.tt.length - 1];
  assert.ok(h > 0.3 && h < 0.35, 'H+0:20: ' + h);
  assert.ok(res.impactos.length >= 2 && res.impactos.every((i) => Math.abs(i.hora - h) < 1e-9), 'los dos tiros a la hora del contacto');
  const mv = res.eventos.find((e) => e.tipo === 'movimiento' && /BI-AZ/.test(e.descripcion));
  assert.match(mv.descripcion, /entró EN CONTACTO con 🔴 BI-RO a H\+0:20 y se detuvo ahí/);
  assert.match(mv.descripcion, /ROMPER CONTACTO/);
  assert.ok(res.eventos.some((e) => e.tipo === 'combate' && /^⚔️ \[H\+0:20\]/.test(e.descripcion)));
});

test('el que ya está en contacto no avanza (salvo que rompa contacto), y la marcha cortada no sigue sola', () => {
  const az = unidad({ id: 1 }), ro = en(unidad({ id: 2, bando: 'rojo', designacion: 'BI-RO' }), 2, 0);
  const res = turno([az, ro], [mover(1, 0, 20)]);
  const A = res.unidades.find((u) => u.id === 1);
  assert.ok(M.haversineKm([A.lng, A.lat], pt(0, 0)) < 1e-6, 'no se movió');
  assert.match(res.eventos.find((e) => e.tipo === 'movimiento').descripcion, /ya estaba en contacto/);
  // Con «romper contacto» sí sale (pagando la persecución).
  const r2 = turno([unidad({ id: 1 }), en(unidad({ id: 2, bando: 'rojo' }), 2, 0)], [mover(1, 0, 20, { tipo: 'replegar' })]);
  assert.ok(yk([r2.unidades[0].lng, r2.unidades[0].lat]) > 5, 'se replegó');
});

test('empeño ordenado: se tira a la hora en que el blanco ENTRA al alcance, sobre el punto donde está a esa hora', () => {
  // El mortero (120 mm, 8 km) espera en (0,0); el batallón rojo marcha de (30,4) a (−30,4) a 40 km/h. Entra a los 8 km
  // cuando pasa por x = √(64−16) = 6,93 → a las (30−6,93)/40 = 0,577 h. Antes el tiro salía a H+0, desde 30 km, «corto».
  const tir = unidad({ id: 1, arma: 'morteros', designacion: 'CÍA MORT' });
  const bla = en(unidad({ id: 2, bando: 'rojo', designacion: 'BI-RO' }), 30, 4);
  const res = turno([tir, bla], [mover(2, -30, 4), { id: 3, unidad_id: 1, tipo: 'atacar', objetivo_id: 2, arma: 'mortero120' }]);
  const im = res.impactos.find((i) => i.arma === 'mortero120' && !i.respuesta);
  assert.ok(im, 'hubo tiro: ' + res.eventos.map((e) => e.descripcion).join(' | '));
  assert.ok(Math.abs(im.hora - 0.577) < 0.01, 'hora ' + im.hora);
  assert.ok(Math.abs(xk([im.lng, im.lat]) - 6.93) < 0.05 && Math.abs(yk([im.lng, im.lat]) - 4) < 0.05, 'el blanco donde estaba a esa hora');
  assert.ok(M.haversineKm(im.desde, pt(0, 0)) < 1e-6);
  assert.ok(!res.eventos.some((e) => e.tipo === 'fuego_perdido'), 'justo al entrar al alcance NO es un tiro corto');
  assert.ok(res.eventos.some((e) => e.tipo === 'combate' && /^⚔️ \[H\+0:35\] 🔵 CÍA MORT abrió fuego sobre 🔴 BI-RO con Mortero 120 mm/.test(e.descripcion)));
});

test('el que quedó fuera de combate a una hora no hace nada después, y nadie le gasta munición', () => {
  // La artillería (obús 105, 11 km) destruye al pelotón rojo a H+0:09, antes de que se tope con el batallón azul (H+0:13).
  const art = (x) => en(unidad({ id: 1, arma: 'artilleria', designacion: 'GA-1', municion: { obus105: 5 } }), x, 0);
  const pel = (x) => en(unidad({ id: 2, bando: 'rojo', escalon: 'seccion', designacion: 'PEL-RO', poder_max: 2, poder_actual: 0.5 }), x, 0);
  const bi = () => en(unidad({ id: 3, designacion: 'BI-AZ' }), 0, 0);
  const fuego = { id: 9, unidad_id: 1, tipo: 'atacar', objetivo_id: 2, arma: 'obus105' };
  let res = turno([art(-5), pel(12), bi()], [mover(2, 0, 0), fuego]);
  let P = res.unidades.find((u) => u.id === 2);
  assert.strictEqual(P.estado, 'fuera_combate');
  assert.ok(Math.abs(xk([P.lng, P.lat]) - 6) < 0.05, 'quedó donde lo alcanzó el fuego: x=' + xk([P.lng, P.lat]).toFixed(2));
  assert.strictEqual(res.unidades.find((u) => u.id === 3).poder_actual, 12, 'no llegó a pelear con el batallón');
  assert.ok(!res.eventos.some((e) => /BI-AZ abrió fuego|EN CONTACTO/.test(e.descripcion)));
  assert.match(res.eventos.find((e) => e.tipo === 'movimiento').descripcion, /quedó FUERA DE COMBATE en la marcha/);
  // Al revés: con la batería más atrás (le entraría a x = 2), el pelotón se topa antes con el batallón (x = 3, H+0:10)
  // y cae ahí; la batería ya no tira sobre un destruido.
  res = turno([art(-9), pel(10), bi()], [mover(2, 0, 0), fuego]);
  P = res.unidades.find((u) => u.id === 2);
  assert.strictEqual(P.estado, 'fuera_combate');
  assert.strictEqual(res.unidades.find((u) => u.id === 1).municion.obus105, 5, 'la batería no gastó en un blanco que ya no existía');
  assert.ok(!res.impactos.some((i) => i.arma === 'obus105'));
});

// ════════════════════════════════════════ 3) EL APOYO Y LA MUNICIÓN ═══════════════════════════════════════════════
test('el convoy y el servicio de combate no empiezan un combate; su poder viejo se corrige una vez (el del árbitro, no)', () => {
  const cv = unidad({ id: 1, designacion: 'Cnv-I-1', escalon: 'seccion', arma: 'convoy', poder_max: 15, poder_actual: 15, carga: { I: 3 } });
  const cia = en(unidad({ id: 2, bando: 'rojo', designacion: 'CÍA-RO', escalon: 'compania', poder_max: 4, poder_actual: 4 }), 2, 0);
  const ce = en(unidad({ id: 3, designacion: 'CE-1', escalon: 'cuerpo', arma: 'ninguna', poder_max: 150, poder_actual: 150 }), -40, 0);
  const log = en(unidad({ id: 4, bando: 'rojo', designacion: 'CÍA LOG', escalon: 'compania', arma: 'logistica', poder_max: 4, poder_actual: 4 }), -40, 2);
  const san = en(unidad({ id: 5, bando: 'rojo', designacion: 'BAT SAN (a mano)', arma: 'sanidad', poder_max: 7, poder_actual: 7 }), 30, 30);
  const res = turno([cv, cia, ce, log, san], []);
  const ev = res.eventos.find((e) => e.tipo === 'combate');
  assert.match(ev.descripcion, /🔴 CÍA-RO abrió fuego sobre 🔵 Cnv-I-1/, 'abre fuego la de combate, no el convoy');
  assert.ok(!res.eventos.some((e) => /CE-1 abrió fuego|CÍA LOG abrió fuego|CE-1 y|CÍA LOG y/.test(e.descripcion)), 'dos de apoyo no se pelean');
  const por = Object.fromEntries(res.unidades.map((u) => [u.designacion, u]));
  assert.strictEqual(por['Cnv-I-1'].poder_max, 2);
  assert.strictEqual(por['CE-1'].poder_max, 4);
  assert.strictEqual(por['CÍA LOG'].poder_max, 0.6);
  assert.strictEqual(por['BAT SAN (a mano)'].poder_max, 7, 'lo que puso el árbitro a mano no se toca');
  const aviso = res.eventos.find((e) => e.tipo === 'aviso');
  assert.deepStrictEqual(aviso.bandos_visibles, [], 'sólo el árbitro');
  assert.match(aviso.descripcion, /Cnv-I-1 15→2 · 🔵 CE-1 150→4 · 🔴 CÍA LOG 4→0\.6/);
});

test('en el combate cercano disparan las armas de tiro directo y los morteros — la artillería no gasta (DIV MEC-2)', () => {
  const div = unidad({ id: 1, designacion: 'DIV MEC-2', escalon: 'division', arma: 'mecanizada', medio: 'oruga', poder_max: 80, poder_actual: 80 });
  const bat = en(unidad({ id: 2, bando: 'rojo', designacion: 'BAT RO', arma: 'mecanizada' }), 0.7, 0);
  const res = turno([div, bat], []);
  const D = res.unidades.find((u) => u.id === 1);
  assert.strictEqual(D.municion.obus155, undefined, 'el obús 155 no se tocó');
  assert.strictEqual(D.municion.obus105, undefined, 'el obús 105 no se tocó');
  assert.strictEqual(D.municion.mortero120, 3.5, 'el mortero sí');
  assert.strictEqual(D.municion.canon, 4.5, 'el cañón sí');
  assert.ok(!res.impactos.some((i) => /^obus|lanzacohetes/.test(i.arma)), 'ningún proyectil de artillería en el encuentro');
});

// ════════════════════════════════════════ 4) EL ABASTECIMIENTO ═══════════════════════════════════════════════════
const PD = { id: 99, tipo: 'log_abas', bando: 'azul', geojson: { type: 'Point', coordinates: pt(-15, 0) } };
test('el convoy reparte a TODAS las unidades cerca, lo que le falta a cada una, hasta vaciarse (y lo dice si no alcanza)', () => {
  const b1 = en(unidad({ id: 1, designacion: 'BI-1', combustible_km: 100 }), 1, 1);
  const b2 = en(unidad({ id: 2, designacion: 'BI-2', combustible_km: 150 }), -1, 1);
  const cv = unidad({ id: 3, designacion: 'Cnv-III-1', escalon: 'seccion', arma: 'convoy', poder_max: 2, poder_actual: 2, carga: { III: 3, cap: { III: 3 }, origen: 99 } });
  let res = turno([b1, b2, cv], [], { terreno: [RUTA], instalaciones: [PD] });
  const por = (r) => Object.fromEntries(r.unidades.map((u) => [u.designacion, u]));
  assert.strictEqual(por(res)['BI-1'].combustible_km, 0);
  assert.strictEqual(por(res)['BI-2'].combustible_km, 0);
  assert.ok(Math.abs(por(res)['Cnv-III-1'].carga.III - 1.75) < 1e-9, '0,5 + 0,75 cargas de batallón: ' + por(res)['Cnv-III-1'].carga.III);
  assert.ok(res.entregas.length === 2 && res.entregas.every((e) => e.aDomicilio));
  // Tres batallones secos con 1,75 cargas: en proporción, y lo dice.
  const secos = [1, 2, 4].map((id, i) => en(unidad({ id, designacion: 'BI-' + id, combustible_km: 200 }), i - 1, -1));
  res = turno([...secos, por(res)['Cnv-III-1']], [], { terreno: [RUTA], instalaciones: [PD] });
  assert.ok(res.unidades.filter((u) => /^BI-/.test(u.designacion)).every((u) => Math.abs(u.combustible_km - 83.33) < 0.05));
  assert.ok(res.eventos.some((e) => /NO ALCANZÓ para completar a todos; quedó VACÍO: vuelve solo/.test(e.descripcion)));
});

test('la estiba es finita: el convoy vacío vuelve SOLO por los caminos, recarga del puesto y el puesto baja', () => {
  const cv = en(unidad({ id: 3, designacion: 'Cnv-III-1', escalon: 'seccion', arma: 'convoy', poder_max: 2, poder_actual: 2, combustible_km: 40,
    carga: { III: 0, cap: { III: 3 }, origen: 99 } }), 10, 0.5);
  const pd = JSON.parse(JSON.stringify(PD)); pd.geojson.usado = 10;   // al puesto le quedan 2 de 12
  const res = turno([cv], [], { terreno: [RUTA], instalaciones: [pd] });
  const C = res.unidades[0];
  assert.ok(Math.abs(xk([C.lng, C.lat]) + 15) < 0.3, 'volvió al puesto por la ruta: x=' + xk([C.lng, C.lat]).toFixed(2));
  assert.match(res.eventos.find((e) => e.tipo === 'movimiento').descripcion, /vacío: vuelve solo a recargar en Puesto de abastecimiento/);
  assert.strictEqual(C.carga.III, 2, 'cargó lo que había: 2 de 3');
  assert.strictEqual(res.instalActualizar[0].geojson.usado, 12, 'el puesto quedó AGOTADO');
  assert.ok(res.eventos.some((e) => /recargó en Puesto de abastecimiento — 2\.0 carga\(s\) de Clase III/.test(e.descripcion)));
});

test('🤝 apoyar: el convoy sigue a la unidad por los caminos, queda 1,5 km detrás y la abastece cada turno', () => {
  const bi = en(unidad({ id: 1, designacion: 'BTQ-1', combustible_km: 120 }), 0, 0.5);
  const cv = en(unidad({ id: 3, designacion: 'Cnv-III-1', escalon: 'seccion', arma: 'convoy', poder_max: 2, poder_actual: 2, carga: { III: 3, cap: { III: 3 } } }), -14, 0);
  const res = turno([bi, cv], [{ id: 1, unidad_id: 3, tipo: 'apoyar', objetivo_id: 1 }], { terreno: [RUTA] });
  const C = res.unidades.find((u) => u.id === 3), B = res.unidades.find((u) => u.id === 1);
  assert.strictEqual(C.carga.apoya, 1);
  const d = M.haversineKm([C.lng, C.lat], [B.lng, B.lat]);
  assert.ok(d > 1.3 && d < 1.7, 'detrás, a 1,5 km: ' + d.toFixed(2));
  assert.strictEqual(B.combustible_km, 0, 'y la abasteció');
  const tz = res.trazas.find((t) => t.id === 3);
  assert.strictEqual(tz.auto, 'apoyar');
  // Una orden de marcha a mano lo desagrega.
  const r2 = turno([B, C], [mover(3, -10, 0)], { terreno: [RUTA] });
  assert.strictEqual(r2.unidades.find((u) => u.id === 3).carga.apoya, null);
});

// ════════════════════════════════════════ 5) LA MARCHA QUE SIGUE SOLA ═════════════════════════════════════════════
test('la marcha que no terminó la sigue el SERVIDOR (para los dos bandos), y no la que frenó un contacto o un campo', () => {
  const pie = en(unidad({ id: 7, bando: 'rojo', designacion: 'BI-RO', medio: 'pie' }), 0, 10);
  const previa = { id: 9, unidad_id: 7, tipo: 'mover', destino_lng: pt(40, 10)[0], destino_lat: pt(40, 10)[1], ruta: [pt(10, 10), pt(40, 10)], tarea: 'reconocer' };
  let res = turno([pie], [], { ordenesPrevias: [previa], trazasPrevias: [{ id: 7, llego: false, detenida: false, consumidos: 0 }] });
  assert.ok(Math.abs(xk([res.unidades[0].lng, res.unidades[0].lat]) - 10) < 0.05, 'siguió 10 km');
  assert.match(res.eventos.find((e) => e.tipo === 'movimiento').descripcion, /siguió sola la marcha del turno anterior/);
  assert.strictEqual(res.ordenesGuardar.length, 1, 'queda guardada para el turno siguiente');
  assert.strictEqual(res.ordenesGuardar[0].tarea, 'reconocer');
  for (const t of [{ contacto: true }, { minado: true }, { detenida: true }, { llego: true }]) {
    res = turno([en(unidad({ id: 7, bando: 'rojo', medio: 'pie' }), 0, 10)], [], { ordenesPrevias: [previa], trazasPrevias: [Object.assign({ id: 7, consumidos: 0 }, t)] });
    assert.strictEqual(res.trazas.length, 0, JSON.stringify(t));
  }
  // Una orden del turno manda sobre la que seguía sola (⏹ ALTO = defender).
  res = turno([en(unidad({ id: 7, bando: 'rojo', medio: 'pie' }), 0, 10)], [{ id: 1, unidad_id: 7, tipo: 'defender' }],
    { ordenesPrevias: [previa], trazasPrevias: [{ id: 7, llego: false, detenida: false, consumidos: 0 }] });
  assert.strictEqual(res.trazas.length, 0);
});

// ════════════════════════════════════════ 6) LA INGENIERÍA ═══════════════════════════════════════════════════════
test('la brecha es un corredor que lleva horas según el suelo; por él pasan los vehículos de los DOS bandos', () => {
  const ing = en(unidad({ id: 8, designacion: 'BAT ING', arma: 'ingenieria' }), 9.9, 8);
  const zapa = { id: 1, unidad_id: 8, tipo: 'zapa', obra: 'brecha', destino_lng: pt(12, 8)[0], destino_lat: pt(12, 8)[1] };
  let u = ing, zona = null, turnos = 0;
  for (let k = 0; k < 6 && !zona; k++) {
    const res = turno([u], [zapa], { terreno: [RESTR], turno: 5 + k });
    u = res.unidades[0]; turnos++;
    if (res.zonas.length) zona = res.zonas[0];
  }
  assert.strictEqual(turnos, 3, '1,5 km de restringido (3 h/km) + 0,6 km de campo (1,5 h/km) ≈ 5,4 h → 3 turnos de 2 h');
  assert.strictEqual(zona.tipo, 'via');
  assert.strictEqual(zona.geojson.obra, 'brecha');
  const T = M.prepararTerreno([RESTR, { tipo: 'via', bando: 'azul', geojson: zona.geojson }]);
  const rojo = M.moverPorRuta(unidad({ bando: 'rojo', medio: 'oruga', lng: pt(9, 8)[0], lat: pt(9, 8)[1] }), [pt(13, 8)], T, 2, 1);
  assert.strictEqual(rojo.llego, true, 'el enemigo también la usa');
  // Por la brecha abierta en un campo minado se pasa sin pisar minas.
  const campo = { id: 50, tipo: 'minado', bando: 'rojo', geojson: { type: 'Polygon', coordinates: [cuadro(10.2, 6, 10.8, 10)] } };
  const T2 = M.prepararTerreno([campo, { tipo: 'via', bando: 'azul', geojson: zona.geojson }]);
  assert.strictEqual(M.moverPorRuta(unidad({ medio: 'oruga', lng: pt(9, 8)[0], lat: pt(9, 8)[1] }), [pt(13, 8)], T2, 2, 1).llego, true);
  assert.strictEqual(M.moverPorRuta(unidad({ medio: 'oruga', lng: pt(9, 9)[0], lat: pt(9, 9)[1] }), [pt(13, 9)], T2, 2, 1).detenida, true, 'fuera del corredor, minas');
});

test('🌉 el puente: sólo sobre un río, sólo ingeniería; terminado, los vehículos cruzan ahí', () => {
  const ing = en(unidad({ id: 8, designacion: 'BAT ING', arma: 'ingenieria' }), 4.5, 5);
  const orden = (x, y) => ({ id: 1, unidad_id: 8, tipo: 'zapa', obra: 'puente', destino_lng: pt(x, y)[0], destino_lat: pt(x, y)[1] });
  let res = turno([ing], [orden(4.5, 5.5)], { terreno: [RIO] });
  assert.ok(res.eventos.some((e) => /ahí no hay un río que cruzar/.test(e.descripcion)));
  const inf = en(unidad({ id: 9, designacion: 'BI-1' }), 4.5, 5);
  res = turno([inf], [{ ...orden(5, 5), unidad_id: 9 }], { terreno: [RIO] });
  assert.ok(res.eventos.some((e) => /necesita MAQUINARIA DE INGENIERÍA/.test(e.descripcion)));
  let u = ing, zona = null;
  for (let k = 0; k < 4 && !zona; k++) { res = turno([u], [orden(5, 5)], { terreno: [RIO], turno: 5 + k }); u = res.unidades[0]; zona = res.zonas[0]; }
  assert.ok(zona && zona.geojson.obra === 'puente');
  const T = M.prepararTerreno([RIO, { tipo: 'via', bando: 'azul', geojson: zona.geojson }]);
  assert.strictEqual(M.claseTerreno(pt(5, 5), T), 'camino');
  assert.strictEqual(M.moverPorRuta(unidad({ bando: 'rojo', lng: pt(3, 5)[0], lat: pt(3, 5)[1] }), [pt(7, 5)], T, 2, 1).llego, true);
});

// ════════════════════════════════════════ 7) EL SERVIDOR (manejador real, base en memoria) ══════════════════════
function crearBase() {
  const tablas = {}, seq = {}, cuenta = {};
  const T = (n) => (tablas[n] || (tablas[n] = []));
  const id = (n) => (seq[n] = (seq[n] || 0) + 1);
  const DEF = { wg_ordenes: () => ({ estado: 'pendiente' }), wg_eventos: () => ({ creado_en: new Date().toISOString() }) };
  const clon = (x) => JSON.parse(JSON.stringify(x));
  const ejecutar = (q) => {
    cuenta[q.tabla + ':' + q.op] = (cuenta[q.tabla + ':' + q.op] || 0) + 1;
    const t = T(q.tabla), pasa = (r) => q.f.every((f) => f(r));
    if (q.op === 'select') {
      let rows = t.filter(pasa);
      if (q.ord) rows.sort((a, z) => (a[q.ord.c] > z[q.ord.c] ? 1 : a[q.ord.c] < z[q.ord.c] ? -1 : 0) * (q.ord.asc ? 1 : -1));
      const count = rows.length;
      if (q.rg) rows = rows.slice(q.rg[0], q.rg[1] + 1);
      if (q.lim != null) rows = rows.slice(0, q.lim);
      return { data: q.head ? null : clon(rows.slice(0, 1000)), error: null, count: q.cnt ? count : null };
    }
    if (q.op === 'insert') return { data: clon(q.filas.map((f) => { const r = Object.assign((DEF[q.tabla] || (() => ({})))(), clon(f)); if (r.id == null && q.tabla !== 'wg_replays') r.id = id(q.tabla); t.push(r); return r; })), error: null };
    if (q.op === 'update') { const rows = t.filter(pasa); rows.forEach((r) => Object.assign(r, clon(q.v))); return { data: clon(rows), error: null }; }
    if (q.op === 'upsert') {
      return { data: q.filas.map((f) => { const ex = t.find((r) => q.conf.every((c) => String(r[c]) === String(f[c])));
        if (ex) return Object.assign(ex, clon(f)); const r = Object.assign({}, clon(f)); if (r.id == null && q.conf.includes('id')) r.id = id(q.tabla); t.push(r); return r; }), error: null };
    }
    if (q.op === 'delete') { tablas[q.tabla] = t.filter((r) => !pasa(r)); return { data: null, error: null }; }
    return { data: null, error: { message: 'op' } };
  };
  const from = (tabla) => {
    const q = { tabla, op: 'select', f: [], ord: null, lim: null, rg: null, cnt: false, head: false };
    const b = {
      select(_c, o) { if (q.op === 'select') { q.cnt = !!(o && o.count); q.head = !!(o && o.head); } return b; },
      eq(c, v) { q.f.push((r) => String(r[c]) === String(v)); return b; },
      in(c, a) { const s = new Set(a.map(String)); q.f.push((r) => s.has(String(r[c]))); return b; },
      like(c, p) { const re = new RegExp('^' + p.replace(/\\_/g, '_').replace(/%/g, '.*') + '$'); q.f.push((r) => re.test(String(r[c] || ''))); return b; },
      is(c, v) { q.f.push((r) => (v === null ? r[c] == null : r[c] === v)); return b; },
      not(c, op, v) { if (op === 'is' && v === null) q.f.push((r) => r[c] != null); return b; },
      contains(c, a) { q.f.push((r) => Array.isArray(r[c]) && a.every((x) => r[c].includes(x))); return b; },
      or(e) { const ps = e.split(',').map((p) => p.split('.')); q.f.push((r) => ps.some(([c, op, ...v]) => (op === 'is' ? r[c] == null : op === 'lt' ? r[c] != null && String(r[c]) < v.join('.') : false))); return b; },
      order(c, o) { q.ord = { c, asc: !(o && o.ascending === false) }; return b; },
      limit(n) { q.lim = n; return b; },
      range(a, z) { q.rg = [a, z]; return b; },
      insert(f) { q.op = 'insert'; q.filas = Array.isArray(f) ? f : [f]; return b; },
      update(v) { q.op = 'update'; q.v = v; return b; },
      upsert(f, o) { q.op = 'upsert'; q.filas = Array.isArray(f) ? f : [f]; q.conf = ((o && o.onConflict) || 'id').split(','); return b; },
      delete() { q.op = 'delete'; return b; },
      then(ok, mal) { return Promise.resolve().then(() => ejecutar(q)).then(ok, mal); },
    };
    return b;
  };
  return { from, T, id, cuenta };
}
function servidor() {
  const base = crearBase();
  const js = ts.transpileModule(SRC.replace(/^import .*$/mg, ''), { compilerOptions: { target: 'ES2020', module: 'None' } }).outputText;
  let manejador = null;
  new Function('Deno', 'createClient', js)({ env: { get() { return ''; } }, serve(fn) { manejador = fn; } }, () => base);
  const T = base.T;
  T('wg_partidas').push({ id: 1, nombre: 'P', estado: 'en_curso', turno_actual: 3, duracion_turno_horas: 2, arbitro_id: 'P1', creada_por: 'P1', resolviendo_desde: null });
  T('wg_bandos').push({ id: 1, partida_id: 1, bando: 'azul', clave_acceso: 'az1' }, { id: 2, partida_id: 1, bando: 'rojo', clave_acceso: 'ro1' });
  T('sesiones').push({ token: 'TK', usuario_id: 'P1', usuario_tabla: 'profesores', expira_en: '2099-01-01T00:00:00Z', revocado: false });
  T('profesores').push({ id: 'P1', nombre_completo: 'Árbitro', rol: 'profesor', activo: true });
  const llamar = async (body) => {
    const r = await manejador(new Request('http://x/wargame-ops', { method: 'POST', body: JSON.stringify(Object.assign({ partida_id: 1 }, body)) }));
    return Object.assign({ _status: r.status }, await r.json());
  };
  return { base, T, llamar };
}
const fila = (base, tipo, geojson, extra) => base.T('wg_terreno').push(Object.assign({ id: base.id('wg_terreno'), partida_id: 1, tipo, geojson, bando: null, hasta_turno: null }, extra || {}));
const filaU = (base, u) => base.T('wg_unidades').push(Object.assign({ partida_id: 1, estado: 'activa', combustible_km: 0, municion: null, carga: null, trabajo: null, medios: null, dron_vuelo: null }, u));

test('servidor · resolver el turno: las fichas en UN solo pedido, la película con su hora, la marcha que sigue sola guardada', async () => {
  const { base, T, llamar } = servidor();
  fila(base, 'via', RUTA.geojson);
  for (let i = 0; i < 1100; i++) fila(base, 'elevacion', { type: 'LineString', coordinates: [pt(i % 40, -10), pt(i % 40, -9)] });
  filaU(base, Object.assign(unidad({ id: 1, partida_id: 1 }), { lng: pt(-10, 0)[0], lat: pt(-10, 0)[1], dron_vuelo: { lng: 1, lat: 2 } }));
  filaU(base, en(unidad({ id: 2, bando: 'rojo', designacion: 'BI-RO', medio: 'pie' }), 30, 10));
  T('wg_ordenes').push({ id: 1, partida_id: 1, turno: 3, bando: 'azul', unidad_id: 1, tipo: 'mover', destino_lng: pt(0, 0)[0], destino_lat: pt(0, 0)[1], ruta: [pt(0, 0)], estado: 'pendiente' });
  // La orden del turno ANTERIOR del rojo, que no terminó (sigue sola).
  T('wg_ordenes').push({ id: 2, partida_id: 1, turno: 2, bando: 'rojo', unidad_id: 2, tipo: 'mover', destino_lng: pt(30, 40)[0], destino_lat: pt(30, 40)[1], ruta: [pt(30, 40)], estado: 'resuelta' });
  T('wg_replays').push({ partida_id: 1, turno: 2, trazas: [{ id: 2, llego: false, detenida: false, consumidos: 0 }], impactos: [], entregas: [] });
  const r = await llamar({ accion: 'resolver_turno', clave_acceso: 'az1', invitado_nombre: 'My. Azul', turno: 3 });
  assert.strictEqual(r.ok, true, r.error);
  assert.strictEqual(r.turno_nuevo, 4);
  assert.strictEqual(base.cuenta['wg_unidades:upsert'], 1, 'las fichas se guardan de una sola vez');
  assert.ok(!base.cuenta['wg_unidades:update'], 'sin escrituras ficha por ficha');
  const u1 = T('wg_unidades').find((u) => u.id === 1);
  assert.ok(Math.abs(xk([u1.lng, u1.lat])) < 0.01, 'llegó');
  assert.deepStrictEqual(u1.dron_vuelo, { lng: 1, lat: 2 }, 'el vuelo del dron (lo escribe el latido) no se pisa');
  const u2 = T('wg_unidades').find((u) => u.id === 2);
  assert.ok(yk([u2.lng, u2.lat]) > 19.9, 'el rojo siguió solo su marcha: y=' + yk([u2.lng, u2.lat]).toFixed(2));
  assert.ok(T('wg_ordenes').some((o) => o.turno === 3 && o.unidad_id === 2 && o.estado === 'resuelta'), 'la marcha que siguió quedó guardada');
  const rep = T('wg_replays').find((x) => x.turno === 3);
  assert.ok(rep.trazas.every((t) => Array.isArray(t.tt) && t.tt.length === t.ruta.length), 'la película con la hora de cada punto');
  assert.strictEqual(T('wg_partidas')[0].resolviendo_desde, null);
});

test('servidor · estado en paralelo, con la firma de la carta y el aviso de que se está resolviendo', async () => {
  const { base, T, llamar } = servidor();
  for (let i = 0; i < 1100; i++) fila(base, 'elevacion', { type: 'LineString', coordinates: [pt(i % 40, -10), pt(i % 40, -9)] });
  filaU(base, unidad({ id: 1 }));
  let r = await llamar({ accion: 'estado', clave_acceso: 'az1', invitado_nombre: 'X' });
  assert.strictEqual(r.ok, true, r.error);
  assert.strictEqual(r.terreno.length, 1100, 'la carta entera, por páginas');
  assert.strictEqual(r.terreno_firma, '1100:1100');
  assert.strictEqual(r.resolviendo, false);
  T('wg_partidas')[0].resolviendo_desde = new Date().toISOString();
  r = await llamar({ accion: 'estado', clave_acceso: 'az1', invitado_nombre: 'X', incluir_terreno: false });
  assert.strictEqual(r.terreno, null, 'sin carta en los refrescos');
  assert.strictEqual(r.resolviendo, true);
  const p = await llamar({ accion: 'pulso', clave_acceso: 'az1', invitado_nombre: 'X' });
  assert.strictEqual(p.resolviendo, true);
});

test('servidor · el convoy en PAQUETE sale de la estiba del puesto; el árbitro lo repone (el escalón superior)', async () => {
  const { base, T, llamar } = servidor();
  T('wg_terreno').push({ id: 50, partida_id: 1, tipo: 'log_trenk', bando: 'azul', geojson: { type: 'Point', coordinates: pt(0, 0) } });
  let r = await llamar({ accion: 'formar_convoy', clave_acceso: 'az1', invitado_nombre: 'G-4', instalacion_id: 50, clase: 'PAQUETE' });
  assert.strictEqual(r.ok, true, r.error);
  const cv = T('wg_unidades').find((u) => u.arma === 'convoy');
  assert.deepStrictEqual([cv.carga.III, cv.carga.V, cv.carga.I], [2, 2, 2]);
  assert.deepStrictEqual(cv.carga.cap, { III: 2, V: 2, I: 2 });
  assert.strictEqual(cv.carga.origen, 50);
  assert.strictEqual(cv.poder_max, 2);
  assert.strictEqual(r.estiba.quedan, 2, 'el Tren de Campaña tenía 8: quedan 2');
  r = await llamar({ accion: 'formar_convoy', clave_acceso: 'az1', invitado_nombre: 'G-4', instalacion_id: 50, clase: 'PAQUETE' });
  assert.strictEqual(r.ok, true);
  assert.ok(Math.abs(r.carga.III - 0.667) < 0.01, 'con lo que quedaba');
  r = await llamar({ accion: 'formar_convoy', clave_acceso: 'az1', invitado_nombre: 'G-4', instalacion_id: 50, clase: 'III' });
  assert.match(r.error, /AGOTADO/);
  r = await llamar({ accion: 'reponer_instalacion', clave_acceso: 'az1', invitado_nombre: 'G-4', id: 50 });
  assert.strictEqual(r._status, 403, 'un Estado Mayor no repone');
  r = await llamar({ accion: 'reponer_instalacion', token: 'TK', id: 50 });
  assert.strictEqual(r.ok, true, r.error);
  assert.strictEqual(r.quedan, 8);
});

test('servidor · 🔄 actualizar medios y carta sin reiniciar: posición, combustible y turno quedan; la munición no pasa el tope', async () => {
  const { base, T, llamar } = servidor();
  fila(base, 'restringido', RESTR.geojson);
  fila(base, 'via', { type: 'LineString', coordinates: [pt(0, 0), pt(5, 0)], nom: 'Sin nombre' });
  fila(base, 'hidro', { type: 'LineString', coordinates: [pt(0, 0), pt(0, 5)], nom: 'Sin nombre' });
  T('wg_terreno').push({ id: 900, partida_id: 1, tipo: 'minado', bando: 'azul', geojson: { type: 'Polygon', coordinates: [cuadro(0, 0, 1, 1)] }, hasta_turno: null });
  filaU(base, Object.assign(unidad({ id: 1, designacion: 'DIV MEC-2', escalon: 'division', arma: 'mecanizada', poder_max: 80, poder_actual: 60, combustible_km: 37 }),
    { municion: { obus155: 4, canon: 5 } }));
  const medios = { v: 1, fuente: 'catalogo', sistemas: { obus155: { uf: 3 }, canon: { uf: 5 } } };
  let r = await llamar({ accion: 'actualizar_medios', clave_acceso: 'az1', invitado_nombre: 'X', unidades: [{ id: 1, medios, medio: 'oruga', poder_max: 80 }] });
  assert.strictEqual(r._status, 403, 'sólo el árbitro');
  r = await llamar({ accion: 'actualizar_medios', token: 'TK', unidades: [{ id: 1, medios, medio: 'oruga', poder_max: 40 }] });
  assert.strictEqual(r.ok, true, r.error);
  const u = T('wg_unidades')[0];
  assert.strictEqual(u.medio, 'oruga');
  assert.deepStrictEqual([u.poder_max, u.poder_actual], [40, 30], 'conserva el 75 %');
  assert.strictEqual(u.combustible_km, 37);
  assert.deepStrictEqual(u.municion, { obus155: 3, canon: 5 }, 'la munición no pasa el tope nuevo');
  assert.strictEqual(T('wg_partidas')[0].turno_actual, 3);
  // La carta de fondo se reemplaza; el CMOC y el plan de barreras quedan.
  r = await llamar({ accion: 'actualizar_carta', token: 'TK', limpiar: true, terreno: [
    { tipo: 'via', geojson: { type: 'LineString', coordinates: [pt(0, 0), pt(5, 0)], nom: 'Ruta 1', e: { k: 'comunicaciones_vias' } } },
    { tipo: 'hidro', geojson: { type: 'LineString', coordinates: [pt(0, 0), pt(0, 5)], nom: 'Sin nombre', e: { k: 'hidro_quebradas' } } },
    { tipo: 'restringido', geojson: { type: 'Polygon', coordinates: [cuadro(0, 0, 9, 9)] } },   // no es carta de fondo: no entra
  ] });
  assert.strictEqual(r.ok, true, r.error);
  assert.strictEqual(r.insertadas, 2);
  const tipos = T('wg_terreno').map((t) => t.tipo + (t.geojson.e ? ':' + t.geojson.e.k : '')).sort();
  assert.deepStrictEqual(tipos, ['hidro:hidro_quebradas', 'minado', 'restringido', 'via:comunicaciones_vias']);
});
