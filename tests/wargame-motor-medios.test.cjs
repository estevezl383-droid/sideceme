// El MOTOR con los medios de cada unidad (v2.9.439): los sistemas que trae (COE / G-4), la dotación en UF planificada,
// la autonomía planificada, el reabastecimiento hasta lo planificado, el catálogo de las armas que faltaban (GALM,
// mecanizada, antiaérea, PC) y el obstáculo construido que le pesa al OTRO bando también sobre el camino.
//   node --test tests/wargame-motor-medios.test.cjs
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
  const expo = ['armamentoDe', 'municionDe', 'gastarMunicion', 'ufTope', 'tanqueDe', 'reabastecer', 'claseTerreno',
    'moverPorRuta', 'prepararTerreno', 'limpiarMedios', 'limpiarMunicion', 'ordenarCarta', 'todasLasFilas',
    'resolverTurno', 'ARMAS', 'DOTACION', 'AUTONOMIA_KM'];
  const f = new Function('globalThis', 'createClient', js + '\nreturn {' + expo.join(',') + '};');
  globalThis.Deno = { env: { get() { return ''; } }, serve() {} };
  return f(globalThis, () => ({}));
}
const M = cargarMotor();
const ids = (u) => M.armamentoDe(u).map((a) => a.id);
const unidad = (extra) => Object.assign({ id: 1, bando: 'azul', designacion: 'X', escalon: 'batallon', arma: 'infanteria',
  medio: 'motor', poder_max: 12, poder_actual: 12, estado: 'activa', obs_km: 6, combustible_km: 0 }, extra);

test('las armas que faltaban: el GALM tira cohetes a 30 km, la mecanizada y la antiaérea tienen lo suyo', () => {
  assert.deepStrictEqual(ids(unidad({ arma: 'lanzacohetes' })), ['fusil', 'pesada', 'lanzacohetes']);
  assert.strictEqual(M.ARMAS.lanzacohetes.alcance, 30);
  assert.strictEqual(M.ARMAS.lanzacohetes.indirecto, true);
  assert.deepStrictEqual(ids(unidad({ arma: 'lanzacohetes', escalon: 'seccion' })), ['fusil', 'lanzacohetes']);
  assert.ok(ids(unidad({ arma: 'mecanizada' })).includes('misilAT'));
  assert.ok(ids(unidad({ arma: 'antiaerea', escalon: 'compania' })).includes('antiaereo'));
  assert.ok(ids(unidad({ arma: 'cabmec', escalon: 'compania' })).includes('canon'));
  // El PC se defiende con su seguridad (antes: la dotación de una división de infantería).
  assert.deepStrictEqual(ids(unidad({ arma: 'ninguna', escalon: 'cuerpo' })), ['fusil', 'pesada']);
  // La división trae su artillería, su antiaérea y su ingeniería orgánicas.
  const div = ids(unidad({ arma: 'infanteria', escalon: 'division' }));
  for (const x of ['obus105', 'antiaereo', 'zapa', 'mortero120', 'misilAT']) assert.ok(div.includes(x), x);
});

test('los sistemas de la unidad mandan sobre el catálogo, con su dotación planificada', () => {
  const g = unidad({ arma: 'lanzacohetes', medios: { sistemas: { fusil: { uf: 8 }, lanzacohetes: { uf: 2, n: 18 } } } });
  assert.deepStrictEqual(ids(g), ['fusil', 'lanzacohetes']);
  assert.strictEqual(M.ufTope(g, 'lanzacohetes'), 2);
  assert.strictEqual(M.municionDe(g, 'lanzacohetes'), 2);         // arranca con lo planificado
  M.gastarMunicion(g, 'lanzacohetes', 1);
  M.gastarMunicion(g, 'lanzacohetes', 1);
  assert.strictEqual(M.municionDe(g, 'lanzacohetes'), 0);         // dos salvas y a recargar
  // Un sistema que no existe en el catálogo no entra; sin `medios`, el catálogo de siempre.
  assert.deepStrictEqual(ids(unidad({ medios: { sistemas: { rayoLaser: { uf: 9 } } } })), ['fusil', 'ametralladora', 'srAT', 'pesada', 'mortero60', 'mortero81']);
  assert.strictEqual(M.ufTope(unidad({}), 'obus105'), 5);
});

test('la autonomía planificada (consumo de la altura) limita la marcha', () => {
  const u = unidad({ medio: 'motor', medios: { autonomiaKm: 20 }, lng: -68.0, lat: -18.0 });
  assert.strictEqual(M.tanqueDe(u), 20);
  assert.strictEqual(M.tanqueDe(unidad({ medio: 'oruga' })), 150);
  assert.strictEqual(M.tanqueDe(unidad({ medio: 'pie', medios: { autonomiaKm: 20 } })), 0);   // a pie no lleva tanque
  const destino = [-68.0 + 60 / 105.6, -18.0];                     // 60 km al este, campo abierto
  const r = M.moverPorRuta(u, [destino], [], 6, 1);
  assert.strictEqual(r.detenida, true);
  assert.ok(r.seco, 'se le acabó el combustible');
  assert.ok(r.avanzadoKm > 18 && r.avanzadoKm < 21, 'avanzó ' + r.avanzadoKm);
});

test('el reabastecimiento repone hasta lo PLANIFICADO, no hasta el catálogo', () => {
  const g = unidad({ arma: 'lanzacohetes', lng: -68, lat: -18, municion: { lanzacohetes: 0 },
    medios: { sistemas: { lanzacohetes: { uf: 2 } }, autonomiaKm: 100 }, combustible_km: 80 });
  const instal = { tipo: 'log_asdi', bando: 'azul', geojson: { type: 'Point', coordinates: [-68.005, -18] } };
  const r = M.reabastecer(g, [instal]);
  assert.ok(r, 'se reabasteció');
  assert.strictEqual(M.municionDe(g, 'lanzacohetes'), 2);
  assert.match(r.texto, /Lanzacohetes múltiple 2\.0\/2 UF/);
  assert.strictEqual(g.combustible_km, 0);
  assert.match(r.texto, /de 100 km/);
});

test('el obstáculo construido de un bando corta el camino al OTRO; su dueño pasa', () => {
  const via = { tipo: 'via', geojson: { type: 'LineString', coordinates: [[-68.2, -18], [-67.8, -18]] } };
  const zanja = { tipo: 'severo', bando: 'azul',
    geojson: { type: 'Polygon', coordinates: [[[-68.003, -18.01], [-67.997, -18.01], [-67.997, -17.99], [-68.003, -17.99], [-68.003, -18.01]]],
      obs: 'zanja_at', nom: 'ZAT' } };
  const T = M.prepararTerreno([via, zanja]);
  const pt = [-68.0, -18.0];                                       // sobre el camino, dentro de la zanja
  assert.strictEqual(M.claseTerreno(pt, T, 'rojo'), 'severo');     // al enemigo lo corta
  assert.strictEqual(M.claseTerreno(pt, T, 'azul'), 'camino');     // el dueño conoce el paso
  assert.strictEqual(M.claseTerreno(pt, T), 'camino');             // sin bando (bono, observación): como siempre
  // Un blindado rojo por la ruta se detiene en la zanja; uno azul sigue de largo.
  const rojo = unidad({ bando: 'rojo', medio: 'oruga', lng: -68.1, lat: -18 });
  const r = M.moverPorRuta(rojo, [[-67.9, -18]], T, 6, 1);
  assert.strictEqual(r.detenida, true);
  assert.ok(r.lng < -68.0, 'quedó antes de la zanja: ' + r.lng);
  assert.match(r.motivo, /OBSTÁCULO ENEMIGO — zanja antitanque/);   // la bitácora dice con qué se topó
  const azul = unidad({ bando: 'azul', medio: 'oruga', lng: -68.1, lat: -18 });
  assert.strictEqual(M.moverPorRuta(azul, [[-67.9, -18]], T, 6, 1).llego, true);
});

test('lo que se guarda: medios con tope de tamaño y munición sólo de sistemas del catálogo', () => {
  assert.deepStrictEqual(M.limpiarMedios({ sistemas: { fusil: { uf: 8 } } }), { sistemas: { fusil: { uf: 8 } } });
  assert.strictEqual(M.limpiarMedios('hola'), null);
  assert.strictEqual(M.limpiarMedios([1, 2]), null);
  assert.strictEqual(M.limpiarMedios({ x: 'y'.repeat(20000) }), null);
  assert.deepStrictEqual(M.limpiarMunicion({ fusil: 3, lanzacohetes: '2', rayo: 9, pesada: -1 }), { fusil: 3, lanzacohetes: 2 });
});

test('la carta se manda completa y en orden: lo que decide el combate primero', async () => {
  const filas = M.ordenarCarta([{ tipo: 'elevacion' }, { tipo: 'via' }, { tipo: 'obstaculo' }, { tipo: 'restringido' }, { tipo: 'hidro' }]);
  assert.deepStrictEqual(filas.map((f) => f.tipo), ['restringido', 'obstaculo', 'via', 'hidro', 'elevacion']);
  // PostgREST entrega de a 1.000: se piden las páginas hasta que una viene corta.
  const datos = Array.from({ length: 2345 }, (_, i) => ({ id: i }));
  const pedidos = [];
  const consulta = () => ({ range: (a, b) => { pedidos.push([a, b]); return Promise.resolve({ data: datos.slice(a, b + 1), error: null }); } });
  const r = await M.todasLasFilas(consulta);
  assert.strictEqual(r.data.length, 2345);
  assert.deepStrictEqual(pedidos, [[0, 999], [1000, 1999], [2000, 2999]]);
});

// ── Sin munición no se pelea (v2.9.439) ─────────────────────────────────────────────────────────────────────────
// Dos batallones a 1 km, sin órdenes: se trenzan (combate de encuentro). `municion` en 0 = seco de verdad.
const SECO = { fusil: 0, ametralladora: 0, srAT: 0, pesada: 0, mortero60: 0, mortero81: 0 };
const encuentro = (munAzul, munRojo, ordenes) => {
  const az = unidad({ id: 1, bando: 'azul', designacion: 'BI-AZ', lng: -68.0, lat: -18.0, municion: munAzul });
  const ro = unidad({ id: 2, bando: 'rojo', designacion: 'BI-RO', lng: -68.0 + 1 / 105.6, lat: -18.0, municion: munRojo });
  const r = M.resolverTurno({ duracion_turno_horas: 2, rango_combate_km: 3, turno: 1, terreno: [], unidades: [az, ro],
    ordenes: ordenes || [], instalaciones: [] });
  return { r, az: r.unidades.find((u) => u.id === 1), ro: r.unidades.find((u) => u.id === 2) };
};

test('combate de encuentro: el que está seco no responde ni hace bajas', () => {
  const { r, az, ro } = encuentro(undefined, SECO);
  assert.strictEqual(ro.poder_actual < 12, true, 'el seco recibe');
  assert.strictEqual(az.poder_actual, 12, 'el que tiene munición no sufre bajas');
  const ev = r.eventos.find((e) => e.tipo === 'combate');
  assert.match(ev.descripcion, /BI-RO NO PUDO RESPONDER: .* SIN MUNICIÓN/);
  assert.ok(!r.impactos.some((i) => i.bando === 'rojo'), 'no sale ningún tiro rojo');
  // Aunque sea el más fuerte: tira el que tiene con qué.
  const otra = encuentro(SECO, undefined);
  assert.strictEqual(otra.ro.poder_actual, 12);
  assert.ok(otra.az.poder_actual < 12);
});

test('los dos secos se topan y no hay fuego; con munición, el encuentro gasta', () => {
  const { r, az, ro } = encuentro(SECO, SECO);
  assert.strictEqual(az.poder_actual, 12);
  assert.strictEqual(ro.poder_actual, 12);
  assert.ok(r.eventos.some((e) => e.tipo === 'sin_municion' && /se toparon SIN MUNICIÓN/.test(e.descripcion)));
  assert.strictEqual(r.impactos.length, 0);
  const normal = encuentro(undefined, undefined);
  assert.ok(normal.az.poder_actual < 12 && normal.ro.poder_actual < 12, 'fuego cruzado');
  assert.strictEqual(normal.az.municion.mortero81, 4.5);          // 0,5 UF por trenzarse
});

test('romper contacto ante un perseguidor seco sale gratis; con munición, cuesta y gasta', () => {
  const rep = [{ id: 1, unidad_id: 1, tipo: 'replegar', destino_lng: -68.1, destino_lat: -18.0 }];
  const seco = encuentro(undefined, SECO, rep);
  assert.strictEqual(seco.az.poder_actual, 12);
  assert.ok(seco.r.eventos.some((e) => /ROMPIÓ CONTACTO sin castigo/.test(e.descripcion)));
  const con = encuentro(undefined, undefined, rep);
  assert.ok(con.az.poder_actual < 12, 'la persecución castiga');
  assert.strictEqual(con.ro.municion.mortero81, 4.5);
});
