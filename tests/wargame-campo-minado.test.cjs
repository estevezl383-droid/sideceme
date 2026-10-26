// 💣 EL CAMPO MINADO EXPLOTA (v2.9.440). Caso real: en la partida «ZAPATO II» el BAT. INF. BLIN. «CARAMPAGUÉ» (rojo)
// cruzó el campo minado CM MX del plan de barreras «como si fuera terreno normal». El plan había entrado PROYECTADO
// (importación anterior a la v2.9.439: sólo dibujo). Se prueba, sobre el motor REAL y las funciones REALES del Juego:
//   · el campo construido detiene al borde, con detonaciones sucesivas y bajas según el medio y el tipo de campo;
//   · el suelo se mira cada 50 m (un campo angosto ya no queda entre dos pasos de 500 m);
//   · el dueño pasa; de un campo donde ya estaba se sale por las propias huellas;
//   · el árbitro construye el plan de una partida ya importada sin reimportar, y se entera si quedó proyectado;
//   · la previsión de la orden frena donde frena el motor.
//   node --test tests/wargame-campo-minado.test.cjs
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');

function cargarMotor() {
  let ts;
  try { ts = require('typescript'); } catch (_e) { ts = require('/opt/node-tools/node_modules/typescript'); }
  const src = fs.readFileSync(path.join(__dirname, '..', 'supabase/functions/wargame-ops/index.ts'), 'utf8');
  const corte = src.indexOf('Deno.serve(');
  assert.ok(corte > 0, 'no se encontró Deno.serve');
  const cuerpo = src.slice(0, corte).replace(/^import .*$/mg, '');
  const js = ts.transpileModule(cuerpo, { compilerOptions: { target: 'ES2020', module: 'None' } }).outputText;
  const expo = ['moverPorRuta', 'prepararTerreno', 'resolverTurno', 'planDeBarreras', 'obrasProyectadasEnRuta',
    'puntoEnGeom', 'haversineKm'];
  const f = new Function('globalThis', 'createClient', js + '\nreturn {' + expo.join(',') + '};');
  globalThis.Deno = { env: { get() { return ''; } }, serve() {} };
  return f(globalThis, () => ({}));
}
const M = cargarMotor();

// Las funciones del Juego (index.html), cortadas tal cual.
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
  corte('const WG_OBS_MESA={', 'const _wgKmX='),
  corte('const WG_OBS_CON_EFECTO=', 'function wgPanelBarreras(){'),
].join('\n') + `
  return { WG, _wgPreverRuta, _wgPreverMovimiento, _wgPrepTerreno, _wgBarreraDe, _wgPlanBarrerasCuenta };`)();

// Campo de juego sintético a la latitud de «ZAPATO II» (−18,5°). 1 km en x/y.
const LAT0 = -18.5, LNG0 = -68.7;
const KX = 111.32 * Math.cos(LAT0 * Math.PI / 180), KY = 110.57;
const pt = (xKm, yKm) => [LNG0 + xKm / KX, LAT0 + yKm / KY];
const cuadro = (x0, y0, x1, y1) => [pt(x0, y0), pt(x1, y0), pt(x1, y1), pt(x0, y1), pt(x0, y0)];
// Un campo minado del plan del AZUL, construido como lo deja la importación: zona de efecto con margen y el
// campo dibujado en `dib`. Franja de 300 m de fondo (x 2,0–2,3) y 2 km de frente.
const campo = (obs, x0 = 2.0, x1 = 2.3, extra) => Object.assign({ id: 900, tipo: 'minado', bando: 'azul', geojson: {
  type: 'Polygon', coordinates: [cuadro(x0 - 0.15, -1.15, x1 + 0.15, 1.15)],
  nom: { minado_ap: 'CM AP', minado_ac: 'CM AC', minado_mixto: 'CM MX' }[obs], obs, est: 'construido',
  dib: { type: 'Polygon', coordinates: [cuadro(x0, -1, x1, 1)] } } }, extra);
const unidad = (extra) => Object.assign({ id: 266, bando: 'rojo', designacion: 'BAT. INF. BLIN. (FICT.)', escalon: 'batallon',
  arma: 'mecanizada', medio: 'motor', poder_max: 12, poder_actual: 12, estado: 'activa', obs_km: 6, combustible_km: 0,
  lng: pt(0, 0)[0], lat: pt(0, 0)[1] }, extra);
const xKm = (lng) => (lng - LNG0) * KX;
const enDib = (p, c) => M.puntoEnGeom(p, c.geojson.dib);

test('el campo construido DETIENE al borde: la vanguardia entra y saltan tres minas, una cada 100 m', () => {
  const c = campo('minado_mixto');
  const T = M.prepararTerreno([c]);
  const r = M.moverPorRuta(unidad({}), [pt(5, 0)], T, 2, 1);
  assert.strictEqual(r.detenida, true);
  assert.ok(r.minado, 'sabe con qué campo se topó');
  assert.match(r.motivo, /OBSTÁCULO ENEMIGO — campo minado mixto — saltaron 3 minas/);
  // Quedó AL BORDE del campo dibujado (a menos de 50 m), no adentro ni a 500 m.
  assert.ok(xKm(r.lng) <= 2.0 + 1e-6 && xKm(r.lng) > 1.94, 'quedó en x=' + xKm(r.lng).toFixed(3));
  assert.strictEqual(r.detonaciones.length, 3);
  for (const p of r.detonaciones) assert.ok(enDib(p, c), 'la mina saltó DENTRO del campo dibujado');
  const sep = M.haversineKm(r.detonaciones[0], r.detonaciones[1]);
  assert.ok(Math.abs(sep - 0.1) < 0.005, 'una cada 100 m: ' + sep);
  // El dueño conoce sus pasillos: el azul cruza.
  assert.strictEqual(M.moverPorRuta(unidad({ bando: 'azul' }), [pt(5, 0)], T, 2, 1).llego, true);
});

test('el suelo se mira cada 50 m: un campo angosto entre dos pasos de 500 m ya no se cruza de largo', () => {
  // 120 m de fondo entre x=0,30 y x=0,42 — los pasos de 500 m caían en x=0 y x=0,5, a los dos lados.
  const c = { id: 1, tipo: 'minado', bando: 'azul', geojson: { type: 'Polygon', coordinates: [cuadro(0.30, -1, 0.42, 1)] } };
  const r = M.moverPorRuta(unidad({}), [pt(3, 0)], M.prepararTerreno([c]), 2, 1);
  assert.strictEqual(r.detenida, true, 'antes lo cruzaba sin enterarse');
  assert.ok(r.detonaciones.length >= 1 && r.detonaciones.length <= 2, 'en 120 m de campo: ' + r.detonaciones.length);
  assert.ok(xKm(r.lng) < 0.30 + 1e-6 && xKm(r.lng) > 0.24, 'quedó en x=' + xKm(r.lng).toFixed(3));
});

test('bajas mina por mina, según el medio y el tipo de campo', () => {
  const golpe = (medio, obs) => {
    const c = campo(obs);
    const res = M.resolverTurno({ duracion_turno_horas: 2, turno: 2, terreno: [c], instalaciones: [],
      unidades: [unidad({ medio, poder_actual: 10, poder_max: 10 })],
      ordenes: [{ id: 1, unidad_id: 266, tipo: 'mover', destino_lng: pt(5, 0)[0], destino_lat: pt(5, 0)[1] }] });
    return 1 - res.unidades[0].poder_actual / 10;
  };
  // Tres detonaciones en un campo mixto: lo de siempre (v2.9.324) — motor 22 %, oruga 18 %, a pie 10 %.
  assert.ok(Math.abs(golpe('motor', 'minado_mixto') - 0.22) < 0.01);
  assert.ok(Math.abs(golpe('oruga', 'minado_mixto') - 0.18) < 0.01);
  assert.ok(Math.abs(golpe('pie', 'minado_mixto') - 0.10) < 0.01);
  // La mina anticarro destroza vehículos y casi no toca al de a pie; la antipersonal, al revés.
  assert.ok(golpe('motor', 'minado_ac') > golpe('motor', 'minado_ap') * 3);
  assert.ok(golpe('pie', 'minado_ap') > golpe('pie', 'minado_ac') * 3);
  assert.ok(golpe('pie', 'minado_ac') < 0.05);
});

test('la película: cada mina estalla donde saltó, a la hora en que llegó la columna, y la marcha no sigue sola', () => {
  const c = campo('minado_ac');
  const res = M.resolverTurno({ duracion_turno_horas: 2, turno: 3, terreno: [c], instalaciones: [],
    unidades: [unidad({ poder_actual: 5.4, estado: 'desgastada' })],
    ordenes: [{ id: 1, unidad_id: 266, tipo: 'mover', destino_lng: pt(5, 0)[0], destino_lat: pt(5, 0)[1], inicio: 0.5 }] });
  const minas = res.impactos.filter((i) => i.mina);
  assert.strictEqual(minas.length, 3);
  assert.deepStrictEqual(minas.map((m) => m.orden), [0, 1, 2]);
  assert.ok(minas.every((m) => m.uid === 266 && m.bando === 'azul' && !m.desde), 'sin proyectil: nadie la tiró');
  const t = res.trazas.find((x) => x.id === 266);
  assert.ok(Math.abs(minas[0].hora - (t.inicio + t.horas)) < 1e-9, 'estallan cuando llega al borde');
  assert.strictEqual(t.minado, true, 'la traza avisa que la frenó un campo minado');
  // La bitácora: la del bando que lo pisó y la pública, con las detonaciones y lo que perdió.
  const mov = res.eventos.find((e) => e.tipo === 'movimiento');
  assert.match(mov.descripcion, /DETENIDA a los 2\.0 km/);
  assert.match(mov.descripcion, /3 DETONACIONES EN EL CAMPO MINADO ANTICARRO/);
  assert.match(mov.descripcion, /hay que ABRIR BRECHA/);
  const pub = res.eventos.find((e) => e.tipo === 'obra' && /CAMPO MINADO/.test(e.descripcion));
  assert.deepStrictEqual(pub.bandos_visibles, ['rojo', 'azul']);
  assert.match(pub.descripcion, /CAMPO MINADO anticarro del AZUL: 3 detonaciones, perdió [\d.]+ de poder/);
  assert.ok(res.unidades[0].poder_actual < 5.4 * 0.75, 'quedó reducida: ' + res.unidades[0].poder_actual);
});

test('si el reloj no le alcanza para llegar al borde, no pisa el campo', () => {
  const c = campo('minado_mixto', 6.0, 6.3);
  // A pie: 5 km/h × 1 h = 5 km — se queda a 1 km del campo.
  const r = M.moverPorRuta(unidad({ medio: 'pie' }), [pt(9, 0)], M.prepararTerreno([c]), 1, 1);
  assert.strictEqual(r.minado, null);
  assert.strictEqual(r.detonaciones.length, 0);
  assert.ok(Math.abs(xKm(r.lng) - 5) < 0.05);
});

test('del campo donde ya estaba sale por sus huellas; meterse más adentro hace saltar las minas', () => {
  const c = campo('minado_mixto');
  const T = M.prepararTerreno([c]);
  const adentro = unidad({ lng: pt(2.05, 0)[0], lat: pt(2.05, 0)[1] });   // 50 m adentro del campo dibujado
  const sale = M.moverPorRuta(adentro, [pt(0, 0)], T, 2, 1);
  assert.strictEqual(sale.llego, true, 'salió por donde entró');
  assert.strictEqual(sale.detonaciones.length, 0);
  const sigue = M.moverPorRuta(adentro, [pt(5, 0)], T, 2, 1);
  assert.strictEqual(sigue.detenida, true);
  assert.ok(sigue.detonaciones.length >= 1);
  assert.ok(xKm(sigue.lng) < 2.2, 'no cruzó el campo: x=' + xKm(sigue.lng).toFixed(3));
});

// ── El plan de barreras de una partida ya importada ──────────────────────────────────────────────────────────────
// Las filas como están en la base de «ZAPATO II» (importadas con la v2.9.365: dibujo, sin dueño, sin `obs`).
const LEGACY = [
  { id: 12288, tipo: 'obstaculo', bando: null, geojson: { nom: 'CM MX (proyectado)', type: 'Polygon',
    coordinates: [[[-68.707742, -18.50867], [-68.704902, -18.508761], [-68.704638, -18.501248], [-68.707478, -18.501157], [-68.707742, -18.50867]]] } },
  { id: 12285, tipo: 'obstaculo', bando: null, geojson: { nom: 'AL 2 (proyectado)', type: 'LineString',
    coordinates: [[-68.694486, -18.628375], [-68.700986, -18.632623]] } },
  { id: 12286, tipo: 'obstaculo', bando: null, geojson: { nom: 'ZAT (proyectado)', type: 'LineString',
    coordinates: [[-68.691798, -18.630454], [-68.699924, -18.635766]] } },
  { id: 12287, tipo: 'obstaculo', bando: null, geojson: { nom: 'DEM (proyectado)', type: 'Point', coordinates: [-68.703362, -18.622665] } },
  { id: 50, tipo: 'obstaculo', bando: null, geojson: { nom: 'CM FIC (proyectado)', type: 'Polygon',
    coordinates: [[[-68.6, -18.6], [-68.598, -18.6], [-68.598, -18.598], [-68.6, -18.6]]] } },
  // Lo que NO es del plan y no se toca: una posición proyectada, el CMOC y una obra hecha en la partida.
  { id: 51, tipo: 'obstaculo', bando: null, geojson: { nom: 'Posición I (proyectada)', type: 'Polygon',
    coordinates: [[[-68.6, -18.6], [-68.59, -18.6], [-68.59, -18.59], [-68.6, -18.6]]] } },
  { id: 52, tipo: 'severo', bando: null, geojson: { type: 'Polygon', coordinates: [[[-68.6, -18.6], [-68.5, -18.6], [-68.5, -18.5], [-68.6, -18.6]]] } },
  { id: 53, tipo: 'minado', bando: 'rojo', geojson: { type: 'Polygon', coordinates: [[[-68.6, -18.6], [-68.59, -18.6], [-68.59, -18.59], [-68.6, -18.6]]] } },
];
const aplicar = (filas, cambios) => filas.map((t) => { const c = cambios.find((x) => x.id === t.id); return c ? { ...t, ...c } : t; });

test('el árbitro CONSTRUYE el plan de una partida ya importada: con dueño, zona de efecto y su dibujo', () => {
  const cambios = M.planDeBarreras(LEGACY, true);
  const por = Object.fromEntries(cambios.map((c) => [c.id, c]));
  assert.deepStrictEqual(Object.keys(por).map(Number).sort((a, b) => a - b), [50, 12285, 12286, 12287, 12288]);
  assert.strictEqual(por[12288].tipo, 'minado');
  assert.strictEqual(por[12285].tipo, 'restringido');
  assert.strictEqual(por[12286].tipo, 'severo');
  assert.strictEqual(por[12287].tipo, 'severo');
  assert.strictEqual(por[50].tipo, 'obstaculo');   // el campo ficticio no detiene a nadie
  for (const c of cambios) {
    assert.strictEqual(c.bando, 'azul', 'el plan propio, con niebla para el enemigo');
    assert.strictEqual(c.geojson.est, 'construido');
    assert.ok(!/proyectado/.test(c.geojson.nom), c.geojson.nom);
  }
  const g = por[12288].geojson;
  assert.strictEqual(g.obs, 'minado_mixto');
  assert.strictEqual(g.nom, 'CM MX');
  assert.deepStrictEqual(g.dib.coordinates, LEGACY[0].geojson.coordinates, 'se sigue dibujando el campo de la Mesa');
  assert.ok(M.puntoEnGeom([-68.7062, -18.5050], g), 'la zona de efecto contiene al campo');
  // Ya construido, construir otra vez no cambia nada; volver a PROYECTADO devuelve el dibujo de la Mesa.
  const hecho = aplicar(LEGACY, cambios);
  assert.strictEqual(M.planDeBarreras(hecho, true).length, 0);
  const vuelta = M.planDeBarreras(hecho, false);
  assert.strictEqual(vuelta.length, 5);
  const v = vuelta.find((c) => c.id === 12288);
  assert.strictEqual(v.tipo, 'obstaculo');
  assert.strictEqual(v.bando, 'azul');
  assert.strictEqual(v.geojson.nom, 'CM MX (proyectado)');
  assert.deepStrictEqual(v.geojson.coordinates, LEGACY[0].geojson.coordinates);
});

test('ZAPATO II, turno 2: con el plan construido, el blindado rojo se detiene en el CM MX en vez de cruzarlo', () => {
  const T = aplicar(LEGACY, M.planDeBarreras(LEGACY, true));
  // La unidad y la orden reales del turno 2 (de la base): 1,5 km al norte, a través del campo.
  const u = unidad({ poder_actual: 5.4, estado: 'desgastada', combustible_km: 5.27, lng: -68.7079811096191, lat: -18.5146503071661 });
  const destino = [-68.7060070037842, -18.5008951307173];
  const res = M.resolverTurno({ duracion_turno_horas: 2, turno: 2, terreno: T, instalaciones: [], unidades: [u],
    ordenes: [{ id: 1, unidad_id: 266, tipo: 'mover', destino_lng: destino[0], destino_lat: destino[1] }] });
  const fin = res.unidades[0];
  assert.ok(fin.lat < -18.5087, 'quedó al sur del campo, no del otro lado: ' + fin.lat);
  assert.ok(fin.poder_actual < 5.4, 'quedó reducida');
  assert.strictEqual(res.impactos.filter((i) => i.mina).length, 3);
  // Sin construir, el motor la deja pasar — y el árbitro se entera de por qué.
  const res2 = M.resolverTurno({ duracion_turno_horas: 2, turno: 2, terreno: LEGACY, instalaciones: [], unidades: [u],
    ordenes: [{ id: 1, unidad_id: 266, tipo: 'mover', destino_lng: destino[0], destino_lat: destino[1] }] });
  assert.ok(res2.unidades[0].lat > -18.5012, 'proyectado no la frena');
  const nota = res2.eventos.find((e) => /PROYECTADO/.test(e.descripcion));
  assert.ok(nota, 'el árbitro recibe la nota');
  assert.deepStrictEqual(nota.bandos_visibles, [], 'sólo el árbitro');
  assert.match(nota.descripcion, /«campo minado mixto \(CM MX\)» del plan de barreras, que está PROYECTADO/);
  assert.match(nota.descripcion, /⚙️ Configurar → 🛡️ Plan de barreras/);
  // El dueño del plan (azul) no genera la nota: sabe que todavía no está.
  assert.strictEqual(M.obrasProyectadasEnRuta([[-68.708, -18.5146], destino], LEGACY, 'azul').length, 0);
});

// ── El Juego: la previsión y la cuenta del plan ──────────────────────────────────────────────────────────────────
test('la previsión de la orden frena donde frena el motor (mismo borde, misma regla)', () => {
  const c = campo('minado_mixto');
  W.WG.terreno = W._wgPrepTerreno([c]);
  for (const destino of [pt(5, 0), pt(5, 0.6), pt(3, -2)]) {
    const u = unidad({});
    const m = M.moverPorRuta(u, [destino], M.prepararTerreno([c]), 2, 1);
    const p = W._wgPreverRuta(u, [destino], 2);
    assert.strictEqual(p.detenida, m.detenida);
    assert.ok(M.haversineKm([p.lng, p.lat], [m.lng, m.lat]) < 1e-6, 'misma parada');
    if (m.detenida) assert.match(p.motivo, /CAMPO MINADO — saltan las minas y se detiene con bajas/);
  }
  // El dueño pasa también en la previsión.
  assert.strictEqual(W._wgPreverRuta(unidad({ bando: 'azul' }), [pt(5, 0)], 2).llego, true);
  W.WG.terreno = [];
});

test('el Juego reconoce el plan construido por el servidor: macizo, con su dibujo, y lo cuenta para el árbitro', () => {
  W.WG.terreno = LEGACY;
  let cuenta = W._wgPlanBarrerasCuenta();
  assert.deepStrictEqual(cuenta, { total: 4, construidas: 0, proyectadas: 4, campos: 1, camposProy: 1 });
  W.WG.terreno = aplicar(LEGACY, M.planDeBarreras(LEGACY, true));
  cuenta = W._wgPlanBarrerasCuenta();
  assert.deepStrictEqual(cuenta, { total: 4, construidas: 4, proyectadas: 0, campos: 1, camposProy: 0 });
  const b = W._wgBarreraDe(W.WG.terreno.find((t) => t.id === 12288));
  assert.strictEqual(b.tipo, 'minado_mixto');
  assert.strictEqual(b.proy, false);
  assert.deepStrictEqual(b.geom.coordinates, LEGACY[0].geojson.coordinates, 'se dibuja el campo, no la zona de efecto');
  W.WG.terreno = [];
});
