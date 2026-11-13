// v2.9.472 — regulador de zoom de la maqueta · v2.9.473/474 — 🖥️ Pantallas compartidas.
// Sergio (07-11-2026): el zoom con el mouse era volátil, y quiere cuatro pantallas de monitoreo por bando.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
// Saca una función entera del archivo, contando llaves.
function fn(nombre) {
  const i = html.search(new RegExp('(async )?function ' + nombre + '\\('));
  assert.ok(i >= 0, 'no está ' + nombre);
  let n = 0, j = html.indexOf('{', i);
  for (let k = j; k < html.length; k++) {
    if (html[k] === '{') n++;
    else if (html[k] === '}' && --n === 0) return html.slice(i, k + 1);
  }
}
function sandbox(WG, extra) {
  return Object.assign({ WG, _wgRol: () => WG.rol || null }, extra || {});
}
const correr = (src, ctx, expr) => new Function(...Object.keys(ctx), src + '\nreturn ' + expr)(...Object.values(ctx));

test('la maqueta nace con zoom fino y el juego sigue como estaba', () => {
  assert.match(html, /\(WG\.maqueta\|\|WG\.mon\) \? WG_MAQ_ZOOM\.leaflet : \{\}/);
  assert.match(html, /zoomSnap:0\.01/);
});
test('📌 Fijar clava el mínimo y el máximo del mapa, y lo guarda', () => {
  const f = fn('_wgMaqZoomTrabar');
  assert.match(f, /setMinZoom\(on\?z:0\)/);
  assert.match(f, /setMaxZoom\(on\?z:WG_MAQ_ZOOM\.max\)/);
  assert.match(fn('wgMaquetaZoomFijar'), /_wgMaqZoomGuardar\(\)/);
  assert.match(fn('wgMaquetaEncuadrar'), /_wgMaqZoomRestaurar\(\)/);
});
test('con el zoom fijado la barra y los botones no mueven nada', () => {
  let llamadas = 0;
  const WG = { maqZoomFijo: true, map: { setZoom() { llamadas++; }, getZoom: () => 10 } };
  const ctx = sandbox(WG, { WG_MAQ_ZOOM: { min: 4, max: 18 }, _wgMaqZoomPintar() {} });
  correr(fn('wgMaquetaZoomA'), ctx, 'wgMaquetaZoomA(12)');
  assert.strictEqual(llamadas, 0);
});
test('la pestaña está y abre otra ventana', () => {
  assert.match(html, /id:'pan'[^\n]*nom:'PANTALLAS<span class="lgo"> COMPARTIDAS<\/span>'/);
  assert.match(html, /t\.id==='pan'\?`wgPantallasAbrir\(/);
  assert.match(fn('wgPantallasAbrir'), /window\.open\(/);
});
test('las cuatro cámaras, con su nombre, en el orden pedido', () => {
  // v2.9.484: la CARTA reemplaza al dron en las cuatro (el dron sigue definido aparte)
  assert.match(html, /WG_MON_ORDEN=\['cmte','g3','g4','carta'\]/);
  for (const n of ['VISTA PANORÁMICA', 'VISTA G-3', 'VISTA G-4', 'VISTA CARTA', 'VISTA DRON']) assert.ok(html.includes(`nom:'${n}'`), n);
});
test('un monitor sólo lee: ninguna escritura sale a la partida', async () => {
  const src = fn('_wgInvoke');
  assert.ok(src.indexOf('WG.mon') < src.indexOf('getTokenSesion'), 'el seguro va antes que todo');
  const lecturas = html.match(/WG_MON_LECTURAS=\{([^}]*)\}/)[1];
  for (const a of ['tic', 'reloj', 'enviar_orden', 'anular_orden', 'alto', 'resolver_turno', 'sincronizar', 'formar_convoy', 'apuntar_dron', 'g4auto'])
    assert.ok(!lecturas.includes(a), 'no debe ser lectura: ' + a);
  // y el pulso va sin datos de vuelo
  assert.match(src, /accion==='pulso'\) extra=\{ partida_id:WG\.partidaId, clave_acceso:WG\.clave \}/);
});
test('un monitor no ordena ni maneja el reloj', () => {
  const WG = { mon: { lado: 'azul', puesto: 'g4' } };
  assert.strictEqual(correr(fn('_wgEsMaqueta'), { WG }, '_wgEsMaqueta()'), true);
  assert.match(fn('_wgTicLatido'), /WG\._ticEnVuelo \|\| WG\.mon\) return/);
});
test('el oficial no manda nada si no lo miran, y sólo a su propio puesto', () => {
  const src = fn('_wgMonPuesto') + fn('_wgMonPedido');
  const canales = [];
  const armar = (WG) => ({ WG, _wgRol: () => WG.rol || null, _wgMonEmitir() {}, _wgMonLatir() {}, setInterval: () => 1, clearInterval() {},
    sb: { channel(n) { canales.push(n); return { subscribe: () => ({}) }; } } });
  const WG = { soy: 'azul', rol: 'g4', partidaId: 15 };
  correr(src, armar(WG), `_wgMonPedido({b:'azul',r:'g3'}); _wgMonPedido({b:'rojo',r:'g4'}); 0`);
  assert.deepStrictEqual(canales, [], 'otro puesto no le abre el canal');
  correr(src, armar(WG), `_wgMonPedido({b:'azul',r:'g4'}); 0`);
  assert.deepStrictEqual(canales, ['wg-15-cam-azul-g4']);
  canales.length = 0;
  const arb = { soy: 'arbitro', rol: null, partidaId: 15 };
  correr(src, armar(arb), `_wgMonPedido({b:'azul',r:'cmte'}); 0`);
  assert.deepStrictEqual(canales, [], 'el árbitro no es un puesto');
  const m = { soy: 'arbitro', rol: 'g4', mon: { lado: 'azul', puesto: 'g4' }, _inv: { bando: 'azul' }, partidaId: 15 };
  correr(src, armar(m), `_wgMonPedido({b:'azul',r:'g4'}); 0`);
  assert.deepStrictEqual(canales, [], 'un monitor no se responde a sí mismo');
});
test('se escucha el aviso en el canal de la partida y se suelta al salir', () => {
  assert.match(fn('_wgCanalIniciar'), /event:'mon'/);
  assert.match(fn('_wgCanalParar'), /_wgMonSoltar\(\)/);
});
// v2.9.474 — lo que Sergio vio en su primera prueba real, en pantalla Retina.
test('en un monitor ninguna ficha se apaga, aunque MapLibre la crea tapada', () => {
  assert.match(fn('_wgMonEntrar'), /body\.wg-mon \.maplibregl-marker\{ opacity:1 !important; \}/);
});
test('la cámara del recuadro nunca usa easeTo: congela la cota del centro en 0 m', () => {
  const ini = html.indexOf('function _wgMonIr('), fin = html.indexOf('async function wgPuestoLobby');
  const codigo = html.slice(ini, fin).split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  assert.ok(ini > 0 && fin > ini);
  assert.ok(!/\.easeTo\(/.test(codigo), 'apareció un easeTo en la cámara del recuadro');
  assert.match(fn('_wgMonPaso'), /map\.jumpTo\(/);
});
test('la panorámica barre sola y le cede la cámara al Comandante', () => {
  assert.match(fn('_wgMonArrancar'), /puesto==='cmte'\) _wgMonPanoramica\(true\)/);
  assert.match(fn('_wgMonRecibir'), /puesto==='cmte' && Number\(WG\.camara\)===1\) _wgMonPanoramica\(false\)/);
  assert.match(fn('_wgMonLazo'), /puesto==='cmte'\) _wgMonPanoramica\(true\)/);
  let orbita = 0;
  const WG = { dronVista: null };
  const ctx = { WG, _wgCamaraOrbita() { orbita++; }, _wgHudPanoramica() {}, _wgHudDron() {} };
  correr(fn('_wgMonPanoramica'), ctx, '_wgMonPanoramica(true)');
  assert.deepStrictEqual([WG.camara, WG.cine, orbita], [1, true, 1]);
  correr(fn('_wgMonPanoramica'), ctx, '_wgMonPanoramica(false)');
  assert.deepStrictEqual([WG.camara, WG.cine], [0, false]);
});
test('una ficha que anda no mueve la toma; un cambio grande del dispositivo sí', () => {
  const llamadas = [];
  const cam = { center: [0, 0], zoom: 11 };
  const WG = { mon: { lado: 'rojo', puesto: 'g3' }, map3d: { cameraForBounds: () => cam, getBearing: () => 0 }, camara: 0 };
  let puntos = [[-69, -18.6], [-68.8, -18.5]];
  const ctx = { WG, WG_MON_CAM: { g3: { pitch: 60, giro: 0, tope: 13, acerca: 0 } }, WG_OSCILA: 22, _wgEn3D: () => true, _wgMonPuntos: () => puntos,
    _wgCaja: (p) => [[Math.min(p[0][0], p[1][0]), Math.min(p[0][1], p[1][1])], [Math.max(p[0][0], p[1][0]), Math.max(p[0][1], p[1][1])]],
    _wgEjeAproximacion: () => null, _wgTechoPitch: () => 70, _wgMonIr: (d, ms) => llamadas.push(ms), document: { getElementById: () => null }, performance };
  const src = fn('_wgMonEncuadrar');
  correr(src, ctx, '_wgMonEncuadrar(true)');
  puntos = [[-69.001, -18.6], [-68.8, -18.5]];
  correr(src, ctx, '_wgMonEncuadrar(false)');
  assert.deepStrictEqual(llamadas, [0], 'un corrimiento chico no reencuadra');
  puntos = [[-69.2, -18.6], [-68.8, -18.5]];
  correr(src, ctx, '_wgMonEncuadrar(false)');
  assert.deepStrictEqual(llamadas, [0, 1800]);
});
test('cada pantalla dice si falta su oficial, y el botón de soporte no sale en los recuadros', () => {
  assert.match(fn('_wgPantallasMensaje'), /'SIN '\+C\.quien\.toUpperCase\(\)/);
  assert.match(fn('_wgMonEntrar'), /#sideceme-soporte-bar/);
});

// v2.9.484 — «en ese recuadro de dron que salga la carta» (Sergio, 13-11-2026)
test('la carta mira con la lente del Comandante y se queda en 2D', () => {
  const cfg = html.match(/carta:\{[^\n]*\}/)[0];
  assert.match(cfg, /rol:'cmte'/); assert.match(cfg, /d2:true/);
  assert.match(fn('_wgMonEntrar'), /WG\.rol=rol/);
  const a = fn('_wgMonArrancar');
  assert.ok(a.indexOf('_wgMonArrancarCarta') < a.indexOf('wgVista3D'), 'la carta sale antes de abrir el 3D');
  assert.match(fn('_wgMonArrancarCarta'), /wgCerrar3D\(\)/);
});
test('la carta enciende todos los calcos y no le pide cámara a nadie', () => {
  const WG = { mon: { lado: 'azul', puesto: 'carta' } };
  const C = eval('({' + html.match(/carta:\{[^\n]*\}/)[0] + '})').carta;
  WG.calcos = {}; for (const c of [{ id: 'ae' }, { id: 'via' }, { id: 'hidro' }]) WG.calcos[c.id] = C.calcos ? C.calcos.includes(c.id) : true;
  assert.deepStrictEqual(WG.calcos, { ae: true, via: true, hidro: true });
  assert.match(fn('_wgMonLazo'), /!WG_MON_CAM\[WG\.mon\.puesto\]\.d2 && ahora-\(WG\._monAviso/);
});
test('la carta encuadra propias, enemigos e instalaciones, y no se mueve por una ficha', () => {
  const llamadas = [];
  const map = { getContainer: () => ({ clientWidth: 1440, clientHeight: 800 }), invalidateSize() {},
    getSize: () => ({ x: 1440, y: 800 }), fitBounds(b, o) { llamadas.push([b, o]); } };
  const unidades = [{ bando: 'azul', lng: -68.0, lat: -21.0 }, { bando: 'rojo', lng: -68.5, lat: -21.4 },
    { bando: 'azul', lng: -67.0, lat: -20.0, estado: 'fuera_combate' }];
  const WG = { mon: { lado: 'azul', puesto: 'carta' }, map, estado: { unidades } };
  const ctx = sandbox(WG, { WG_MON_CAM: { carta: { d2: true, tope: 13.5 } }, document: { getElementById: () => ({ offsetHeight: 200 }) },
    _wgInstalaciones: () => [{ geojson: { coordinates: [-67.9, -20.9] } }],
    _wgCaja: new Function('return ' + fn('_wgCaja'))() });
  correr(fn('_wgMonCarta'), ctx, '_wgMonCarta(true)');
  assert.strictEqual(llamadas.length, 1);
  const [[s, o]] = [llamadas[0]];
  assert.ok(Math.abs(s[0][0] - (-21.42)) < 1e-9 && Math.abs(s[0][1] - (-68.52)) < 1e-9, 'incluye al rojo');
  assert.ok(Math.abs(s[1][0] - (-20.88)) < 1e-9 && Math.abs(s[1][1] - (-67.88)) < 1e-9, 'incluye la instalación, no la ficha fuera de combate');
  assert.deepStrictEqual(o.paddingBottomRight, [60, 240]); assert.strictEqual(o.maxZoom, 13.5);
  unidades[0].lng += 0.01;
  correr(fn('_wgMonCarta'), ctx, '_wgMonCarta(false)');
  assert.strictEqual(llamadas.length, 1, 'una ficha que anda no mueve la carta');
  unidades[1].lng -= 1;
  correr(fn('_wgMonCarta'), ctx, '_wgMonCarta(false)');
  assert.strictEqual(llamadas.length, 2, 'un cambio grande sí');
  assert.match(fn('_wgMonEncuadrar'), /d2\)\{ _wgMonCarta\(primera\); return; \}/);
});
test('el rótulo de estado de la carta no dice «SIN COMANDANTE»', () => {
  assert.match(fn('_wgPantallasMensaje'), /C\.d2 \? 'CARTA · SITUACIÓN GENERAL'/);
});
