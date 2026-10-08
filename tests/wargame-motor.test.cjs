// Pruebas del MOTOR del juego de guerra (supabase/functions/wargame-ops/index.ts).
// Se transpila el .ts con TypeScript (sin tipos) y se corta antes de Deno.serve.
//   node --test tests/wargame-motor.test.cjs
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
  const expo = ['claseTerreno', 'puntoEnGeom', 'moverUnidad', 'moverPorRuta', 'textoMarcha', 'resolverTurno',
    'prepararTerreno', 'haversineKm', 'VEL', 'AUTONOMIA_KM', 'CONSUMO_TERRENO', 'ARMAS'];
  const f = new Function('globalThis', 'createClient', js + '\nreturn {' + expo.join(',') + '};');
  globalThis.Deno = { env: { get() { return ''; } }, serve() {} };
  return f(globalThis, () => ({}));
}
const M = cargarMotor();

// Terreno sintético alrededor de (-69.40, -17.30). 1° lat ≈ 110.6 km; a esa
// latitud 1° lng ≈ 106.3 km.
const KX = 111.32 * Math.cos(-17.3 * Math.PI / 180), KY = 110.57;
const pt = (xKm, yKm) => [-69.40 + xKm / KX, -17.30 + yKm / KY];
const cuadro = (x0, y0, x1, y1) => [pt(x0, y0), pt(x1, y0), pt(x1, y1), pt(x0, y1), pt(x0, y0)];
// Sector restringido de 10×10 km (x 0..10, y 0..10) con un HUECO de 2×2 km en el centro.
const restringido = { tipo: 'restringido', geojson: { type: 'Polygon', coordinates: [cuadro(0, 0, 10, 10), cuadro(4, 4, 6, 6)] } };
const terreno = M.prepararTerreno([restringido]);
const unidad = (extra) => Object.assign({ id: 1, bando: 'rojo', designacion: 'DIV-1', escalon: 'division', arma: 'motorizada',
  medio: 'motor', poder_max: 80, poder_actual: 80, estado: 'activa', obs_km: 14, combustible_km: 0 }, extra);

test('los huecos del polígono son terreno transitable', () => {
  assert.strictEqual(M.claseTerreno(pt(5, 5), terreno), 'libre');        // en el hueco
  assert.strictEqual(M.claseTerreno(pt(2, 2), terreno), 'restringido');  // en el anillo
  assert.strictEqual(M.claseTerreno(pt(12, 2), terreno), 'libre');       // afuera
});

test('motorizado adentro con destino adentro: NO se mueve y la bitácora dice por qué', () => {
  const u = unidad({ lng: pt(2, 2)[0], lat: pt(2, 2)[1] });
  const r = M.moverPorRuta(u, [pt(3, 2)], terreno, 2, 14);
  assert.strictEqual(r.detenida, true);
  assert.strictEqual(r.avanzadoKm, 0);
  assert.match(r.motivo, /sólo se SALE/);
  assert.match(r.motivo, /«motor» NO cruza/);
});

test('motorizado adentro con destino afuera: sale a paso de hombre y lo explica', () => {
  const u = unidad({ lng: pt(9, 2)[0], lat: pt(9, 2)[1] });   // a 1 km del borde este
  const r = M.moverPorRuta(u, [pt(13, 2)], terreno, 2, 14);     // 4 km, 1 adentro + 3 afuera
  assert.strictEqual(r.llego, true);
  // el paso de 0,5 km se clasifica en su punto final: 1 km adentro cuenta 0,5–1,0
  assert.ok(r.kmSalida >= 0.5 && r.kmSalida < 1.6, 'km a paso de hombre: ' + r.kmSalida);
  assert.strictEqual(r.claseSalida, 'restringido');
  // 1 km a 1,75 km/h ≈ 0,57 h; 3 km a 40 km/h ≈ 0,075 h
  assert.ok(r.horasUsadas > 0.3 && r.horasUsadas < 0.95, 'horas: ' + r.horasUsadas);
  const txt = M.textoMarcha(u, r, 0);
  assert.match(txt, /arrancó DENTRO de terreno restringido, que «motor» NO cruza/);
  assert.match(txt, /paso de hombre/);
  // el consumo cobra el terreno restringido ×1,6 y el libre ×1
  assert.ok(r.consumoKm > r.avanzadoKm, 'consumo ' + r.consumoKm + ' > ' + r.avanzadoKm);
});

test('fuera del sector, un motorizado se frena en el borde (como siempre)', () => {
  const u = unidad({ lng: pt(13, 2)[0], lat: pt(13, 2)[1] });
  const r = M.moverPorRuta(u, [pt(8, 2)], terreno, 2, 14);
  assert.strictEqual(r.detenida, true);
  assert.match(r.motivo, /infranqueable para motor/);
  assert.ok(r.avanzadoKm > 2.4 && r.avanzadoKm <= 3.01, 'km: ' + r.avanzadoKm);
});

test('combustible: 40 km de campo abierto gastan 40 km de los 200 de autonomía', () => {
  const u = unidad({ lng: pt(20, 20)[0], lat: pt(20, 20)[1] });
  const r = M.moverPorRuta(u, [pt(60, 20)], [], 2, 14);
  assert.ok(Math.abs(r.avanzadoKm - 40) < 0.1 && Math.abs(r.consumoKm - 40) < 0.2, JSON.stringify([r.avanzadoKm, r.consumoKm]));
  assert.strictEqual(M.AUTONOMIA_KM.motor, 200);
  // con 190 ya gastados, sólo le quedan 10: se queda seca a los 10 km
  const u2 = unidad({ lng: pt(20, 20)[0], lat: pt(20, 20)[1], combustible_km: 190 });
  const r2 = M.moverPorRuta(u2, [pt(60, 20)], [], 2, 14);
  assert.strictEqual(r2.seco, true);
  assert.ok(Math.abs(r2.avanzadoKm - 10) < 0.6, 'km con 10 de tanque: ' + r2.avanzadoKm);
});

function partidaFuego(inicio) {
  // Azul: artillería quieta en (0,0). Rojo: batallón que marcha 16 km hacia el este
  // pasando a 3 km al norte de la artillería (de x=-8 a x=+8, y=3).
  const art = unidad({ id: 10, bando: 'azul', designacion: 'BA-I', escalon: 'batallon', arma: 'artilleria',
    lng: pt(0, 0)[0], lat: pt(0, 0)[1], municion: { obus105: 5, fusil: 8 } });
  const bi = unidad({ id: 20, bando: 'rojo', designacion: 'BI-I', escalon: 'batallon', arma: 'infanteria',
    medio: 'motor', lng: pt(-8, 3)[0], lat: pt(-8, 3)[1] });
  const ordenes = [
    { id: 1, unidad_id: 20, tipo: 'mover', destino_lng: pt(8, 3)[0], destino_lat: pt(8, 3)[1], ruta: [pt(8, 3)] },
    { id: 2, unidad_id: 10, tipo: 'atacar', objetivo_id: 20, arma: 'obus105', inicio },
  ];
  return M.resolverTurno({ duracion_turno_horas: 2, rango_combate_km: 3, turno: 5, terreno: [], unidades: [art, bi], ordenes, instalaciones: [] });
}

test('fuego sincronizado: con H+ en la matriz, el tiro cae donde estaba el blanco A ESA HORA', () => {
  // 16 km a 40 km/h = 0,4 h. A H+0:12 (0,2 h) el batallón va por la mitad: x=0, y=3.
  const res = partidaFuego(0.2);
  const im = res.impactos.find((i) => i.arma === 'obus105' && !i.respuesta);
  assert.ok(im, 'hubo impacto');
  assert.strictEqual(im.hora, 0.2);
  const d = M.haversineKm([im.lng, im.lat], pt(0, 3));
  assert.ok(d < 0.6, 'cayó a ' + d.toFixed(2) + ' km del punto esperado');
  const ev = res.eventos.find((e) => e.tipo === 'combate');
  assert.ok(ev && /\[H\+0:12\]/.test(ev.descripcion), ev && ev.descripcion);
  // la munición se descuenta de verdad
  const art = res.unidades.find((u) => u.id === 10);
  assert.strictEqual(art.municion.obus105, 4);
});

test('fuego sin hora: se bate al blanco en el primer punto de su marcha al alcance (como antes)', () => {
  const res = partidaFuego(null);
  const im = res.impactos.find((i) => i.arma === 'obus105' && !i.respuesta);
  assert.ok(im, 'hubo impacto');
  assert.strictEqual(im.hora, null);
  // el primer punto de la ruta ya está a 8,5 km < 11 km de alcance: se bate ahí
  assert.ok(M.haversineKm([im.lng, im.lat], pt(-8, 3)) < 0.6);
});
