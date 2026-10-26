// 📦 Los MEDIOS de cada unidad al traerla del Generador (v2.9.439): el armamento que de verdad tiene (COE de la
// biblioteca, datos del G-4 o el catálogo), la dotación en UF de la tasa del Anexo de Logística, la autonomía con el
// consumo planificado, el PC que no es fuerza de maniobra, y el plan de barreras con su bando. Corre las funciones
// REALES de index.html. Unidades y documentos FICTICIOS.
//   node --test tests/wargame-medios.test.cjs
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const corte = (desde, hasta) => {
  const i = html.indexOf(desde), j = html.indexOf(hasta, i + desde.length);
  assert.ok(i > 0 && j > i, 'no se encontró ' + desde);
  return html.slice(i, j);
};
const linea = (re) => { const m = html.match(re); assert.ok(m, 'no se encontró ' + re); return m[0] + '\n'; };
const fuente = [
  linea(/function _rgEsc\(s\)\{[^\n]*/),
  linea(/const WG_PODER=\{[^\n]*/), linea(/const WG_OBS=\{[^\n]*/),
  corte('function _wgMedioPorArma(arma){', 'function _wgPeso('),
  corte('const WG_ARMAS={', '// ============================================================\n// v2.9.214 — PANEL DE SISTEMAS DE ARMAS.'),
  linea(/const WG_AUTONOMIA=\{[^\n]*/),
  linea(/function _wgEsConvoy\(u\)\{[^\n]*/),
  linea(/function _wgMedioDe\(u\)\{[^\n]*/),
  corte('// v2.9.439 — LOS MEDIOS DE VERDAD DE CADA UNIDAD. Espejo', 'const WG_ROMANO='),
  corte('const WG_ROMANO=', '// Lista las fases del COA guardadas'),
  corte('// v2.9.437 — ⚔️ LAS DOS FASES ENFRENTADAS', '// v2.9.352 — VARIOS ARCHIVOS').replace(/\/\/ =+\s*$/, ''),
].join('\n');
const W = new Function(fuente + `
  return { _wgEscenarioDesde, _wgMediosImport, _wgPlanLogistico, _wgSistemaDeNombre, _wgArmamento, _wgUfTope,
    _wgTanqueDe, WG_ARMAS };`)();

// El Anexo de Logística con el formato de los de la Escuela (texto ficticio).
const ANEXO_G = 'ANEXO “G” (Plan de Logística) A LA ORDEN DE OPERACIONES No. 01 (FICT.)\n'
  + '1.- Terreno. La altura reduce la potencia de los motores y aumenta el consumo de combustible en ≈ 20 % (factor de la FT).\n'
  + 'c.- Prioridades. Tasa de abastecimiento disponible (TAD) para el CE en las Fases II y III, por arma y por día: '
  + 'obús de 105 mm, 80 tiros; obús de 155 mm, 60 tiros; GALM-1, 2 cargas completas por lanzador; mortero de 120 mm, 60 granadas; '
  + 'mortero de 81 mm, 80; mortero de 60 mm, 60; Carl Gustaf, 6 proyectiles; MSS-1.2, 2 misiles por lanzador; RBS-70, 1 misil por lanzador. '
  + 'En las Fases I y IV, la mitad (supuesto).\n'
  + '6.- Nivel de abastecimiento. En los CE: operativo de 3 días y de seguridad de 1 día de Clase I, III y V, completo al D-3.';
// El COE de una división mecanizada (ficticio), como lo deja la biblioteca del profesor (biblioteca.js, leerCOE).
const COE = {
  nombre: 'APÉNDICE 7 COE DIV MEC-9 (FICT.)', bando: 'propias',
  coe: { division: 'DIV MEC-9', arma: 'mecanizada', efectivo: 3805,
    unidades: [
      { designacion: 'RCB-9', arma: 'blindada', escalon: 'regimiento', efectivo: 520,
        armamento: { 'FUSIL GALIL': 400, 'AMETRALLADORA MAG': 30 }, vehiculos: { 'VC-TQ CASCAVEL EE-9': 27, 'VUG 2,5': 10 }, equipo: {} },
    ],
    totales: {
      armamento: { 'FUSIL GALIL': 2830, 'AMETRALLADORA .50': 60, 'MORTERO 81 mm': 18, 'OBÚS 155 M114': 6, 'MISIL MSS-1.2': 12, 'CAÑÓN AA 20 mm': 8 },
      vehiculos: { 'VC-TQ CASCAVEL EE-9': 27, 'VTP URUTU EE-11': 44, 'VUG 2,5': 120 },
      equipo: { 'DETECTOR MINAS': 18 },
    } },
};
const azul = (o) => Object.assign({ bando: 'propias', tipo: 'unidad', lat: -18.55, lng: -68.7 }, o);
const roja = (o) => Object.assign({ bando: 'enemigas', tipo: 'unidad', lat: -18.6, lng: -68.85 }, o);
const ejercicio = () => ({
  nombre: 'CE-IX (FICT.)',
  documentos: [{ nombre: 'Anexo G - Plan de Logistica.md', texto: ANEXO_G }],
  bibliotecaCOE: [COE],
  unidades: [
    azul({ id: 1, designacion: '', tipo: 'pc', arma: 'ninguna', escalon: 'cuerpo', numeroUnidad: 'IX' }),
    azul({ id: 2, designacion: 'GALM-9', arma: 'lanzacohetes', escalon: 'batallon', relacion: 'en refuerzo' }),
    azul({ id: 3, designacion: 'DIV MEC-9', arma: 'mecanizada', escalon: 'division' }),
    azul({ id: 4, designacion: 'DIV-9', arma: 'infanteria', escalon: 'division', textoSimbolo: 'MONT', reducida: true }),
    azul({ id: 5, designacion: 'BAT. ING-9', arma: 'ingenieria', escalon: 'batallon',
      logDatos: { hombres: 410, veh: { camion: 30, liviano: 8 }, armas: { portatil: 350, ametralladora: 12 } } }),
    roja({ id: 6, designacion: 'BAT. LAR-160 (FICT.)', arma: 'lanzacohetes', escalon: 'compania', tarea: 'INTERDICTAR la profundidad.' }),
    roja({ id: 7, designacion: 'PC 1RA. BRIG. (FICT.)', tipo: 'pc', arma: 'ninguna', escalon: 'brigada' }),
    roja({ id: 8, designacion: 'G. BLIN. 9 (FICT.)', arma: 'blindada', escalon: 'batallon' }),
  ],
  ops: { obstaculos: [] },
});
const porNom = (esc) => Object.fromEntries(esc.unidades.map((u) => [u.designacion, u]));

test('el sistema de cada renglón: cohetes, antitanque, antiaérea, obuses, morteros, ametralladoras', () => {
  const S = W._wgSistemaDeNombre;
  assert.strictEqual(S('GALM-1'), 'lanzacohetes');
  assert.strictEqual(S('Batería de cohetes LAR-160'), 'lanzacohetes');
  assert.strictEqual(S('Lanzacohete 3,5"'), 'srAT');          // el de 3,5" es antitanque de infantería
  assert.strictEqual(S('Carl Gustaf'), 'srAT');
  assert.strictEqual(S('C/S/R 106 mm'), 'srAT');
  assert.strictEqual(S('MSS-1.2'), 'misilAT');
  assert.strictEqual(S('RBS-70'), 'antiaereo');
  assert.strictEqual(S('CAÑÓN AA 20 mm'), 'antiaereo');
  assert.strictEqual(S('OBÚS 155 M114'), 'obus155');
  assert.strictEqual(S('obús de 105 mm'), 'obus105');
  assert.strictEqual(S('Mortero de 120 mm'), 'mortero120');
  assert.strictEqual(S('MORTERO 81 mm'), 'mortero81');
  assert.strictEqual(S('Ametralladora .50'), 'pesada');
  assert.strictEqual(S('Ametralladora COAX AMX-13'), 'ametralladora');   // no el cañón del AMX
  assert.strictEqual(S('Cañón de tanque 105 (AMX-13)'), 'canon');
  assert.strictEqual(S('VC-TQ CASCAVEL EE-9'), 'canon');
  assert.strictEqual(S('FUSIL GALIL'), 'fusil');
  assert.strictEqual(S('DETECTOR MINAS'), 'zapa');
  assert.strictEqual(S('Raciones de combate'), null);
});

test('lo planificado sale del Anexo de Logística: TAD, consumo por la altura y nivel de abastecimiento', () => {
  const p = W._wgPlanLogistico(ejercicio());
  assert.strictEqual(p.fuente, 'Anexo G - Plan de Logistica');
  assert.deepStrictEqual(Object.keys(p.tad).sort(),
    ['antiaereo', 'lanzacohetes', 'misilAT', 'mortero120', 'mortero60', 'mortero81', 'obus105', 'obus155', 'srAT']);
  assert.strictEqual(p.tad.lanzacohetes.tiros, 2);
  assert.strictEqual(p.tad.obus105.tiros, 80);
  assert.ok(Math.abs(p.consumo - 1.2) < 1e-9);
  assert.strictEqual(p.nivelDias, 4);
  // Sin anexo: nada inventado.
  const vacio = W._wgPlanLogistico({ documentos: [{ nombre: 'Orden', texto: 'x'.repeat(100) }] });
  assert.deepStrictEqual([Object.keys(vacio.tad).length, vacio.consumo, vacio.nivelDias], [0, null, null]);
});

test('el GALM entra con su lanzacohetes (2 UF = 2 cargas completas) y la autonomía con el consumo planificado', () => {
  const esc = W._wgEscenarioDesde(ejercicio(), null);
  const g = porNom(esc)['GALM-9'];
  assert.strictEqual(g.arma, 'lanzacohetes');
  assert.strictEqual(g.medio, 'motor');
  assert.deepStrictEqual(W._wgArmamento(g).map((a) => a.id), ['fusil', 'pesada', 'lanzacohetes']);
  assert.strictEqual(W._wgUfTope(g, 'lanzacohetes'), 2);
  assert.strictEqual(g.medios.sistemas.lanzacohetes.de, 'tad');
  assert.match(g.medios.sistemas.lanzacohetes.tad, /2 cargas completas/);
  assert.strictEqual(W.WG_ARMAS.lanzacohetes.alcance, 30);
  assert.strictEqual(g.medios.autonomiaKm, 167);            // 200 km ÷ 1,2
  assert.strictEqual(W._wgTanqueDe(g), 167);
  assert.strictEqual(g.medios.nivelDias, 4);
});

test('la división mecanizada con su COE: efectivos, armamento, vehículos y blindados (oruga)', () => {
  const esc = W._wgEscenarioDesde(ejercicio(), null);
  const d = porNom(esc)['DIV MEC-9'];
  assert.strictEqual(d.medios.fuente, 'coe');
  assert.match(d.medios.fuenteTxt, /COE de la DIV MEC-9/);
  assert.strictEqual(d.medios.efectivo, 3805);
  assert.strictEqual(d.medio, 'oruga');                      // Cascavel y Urutu
  assert.strictEqual(d.medios.autonomiaKm, 125);             // 150 km ÷ 1,2
  const s = d.medios.sistemas;
  assert.deepStrictEqual(Object.keys(s).sort(),
    ['antiaereo', 'canon', 'fusil', 'misilAT', 'mortero81', 'obus155', 'pesada', 'zapa']);
  assert.strictEqual(s.fusil.n, 2830);
  assert.strictEqual(s.canon.n, 27);                          // los Cascavel
  assert.strictEqual(s.pesada.n, 60 + 44);                   // las .50 y la de cada Urutu
  assert.strictEqual(s.obus155.uf, 4);                       // 60 tiros ÷ 15 = 4 misiones
  assert.strictEqual(s.misilAT.uf, 2);                       // «2 misiles por lanzador»
  assert.strictEqual(s.antiaereo.uf, 1);                     // «RBS-70, 1 misil por lanzador»
  assert.strictEqual(s.mortero81.uf, 5);                     // 80 ÷ 16
  assert.strictEqual(s.fusil.uf, 8);                         // sin TAD: el del catálogo
  assert.strictEqual(d.medios.armamento['OBÚS 155 M114'], 6);
  assert.strictEqual(d.medios.vehiculos['VTP URUTU EE-11'], 44);
});

test('el PC del CE no es una fuerza de maniobra: «CE-IX», poder de su seguridad y el símbolo de PC', () => {
  const esc = W._wgEscenarioDesde(ejercicio(), null);
  const pc = esc.unidades.find((u) => u.escalon === 'cuerpo');
  assert.strictEqual(pc.designacion, 'CE-IX');
  assert.strictEqual(pc.poder_max, 4);                       // antes 150
  assert.ok(pc.obs_km <= 6);
  assert.strictEqual(pc.medios.pc, true);
  assert.deepStrictEqual(pc.medios.simbolo, { tipo: 'pc', numero: 'IX' });
  assert.deepStrictEqual(W._wgArmamento(pc).map((a) => a.id), ['fusil', 'pesada']);
  assert.deepStrictEqual(esc.medios.pcs.sort(), ['CE-IX', 'PC 1RA. BRIG. (FICT.)']);
  const pcRojo = porNom(esc)['PC 1RA. BRIG. (FICT.)'];
  assert.strictEqual(pcRojo.poder_max, 2);                   // antes 40 (brigada)
});

test('el enemigo usa el catálogo, no la TAD de nuestro plan; la tarea del CAE viaja con la ficha', () => {
  const esc = W._wgEscenarioDesde(ejercicio(), null);
  const lar = porNom(esc)['BAT. LAR-160 (FICT.)'];
  assert.strictEqual(lar.bando, 'rojo');
  assert.ok(W._wgArmamento(lar).some((a) => a.id === 'lanzacohetes'), 'la LAR-160 tira cohetes');
  assert.strictEqual(lar.medios.sistemas.lanzacohetes.de, 'catalogo');
  assert.strictEqual(lar.medios.tadDe, undefined);
  assert.strictEqual(lar.medios.nivelDias, undefined);       // el nivel de abastecimiento es de nuestro plan
  assert.match(lar.medios.tarea, /INTERDICTAR/);
  const tq = porNom(esc)['G. BLIN. 9 (FICT.)'];
  assert.strictEqual(tq.medio, 'oruga');
  assert.strictEqual(tq.medios.autonomiaKm, 125);            // la altura es la misma para los dos
});

test('lo que el oficial cargó en el G-4 manda cuando no hay COE; ingeniería conserva su zapa', () => {
  const esc = W._wgEscenarioDesde(ejercicio(), null);
  const ing = porNom(esc)['BAT. ING-9'];
  assert.strictEqual(ing.medios.fuente, 'g4');
  assert.strictEqual(ing.medios.efectivo, 410);
  assert.strictEqual(ing.medio, 'motor');
  assert.deepStrictEqual(Object.keys(ing.medios.sistemas).sort(), ['ametralladora', 'fusil', 'zapa']);
  assert.strictEqual(ing.medios.sistemas.fusil.n, 350);
  assert.strictEqual(ing.medios.vehiculos.Camiones, 30);
});

test('la infantería sigue a pie y conserva el diseño de su ficha (texto del símbolo, reducida)', () => {
  const esc = W._wgEscenarioDesde(ejercicio(), null);
  const inf = porNom(esc)['DIV-9'];
  assert.strictEqual(inf.medio, 'pie');
  assert.strictEqual(inf.medios.fuente, 'catalogo');
  assert.deepStrictEqual(inf.medios.simbolo, { texto: 'MONT', reducida: true });
  assert.ok(W._wgArmamento(inf).some((a) => a.id === 'obus105'), 'la división trae su artillería orgánica');
  assert.strictEqual(W._wgTanqueDe(inf), 0);                 // a pie no lleva tanque
  // El resumen de la importación sabe de dónde salió cada cosa.
  assert.deepStrictEqual(esc.medios.porFuente, { catalogo: 6, coe: 1, g4: 1 });
  assert.strictEqual(esc.medios.nCoe, 1);
});

// ── El plan de barreras (v2.9.439) ──────────────────────────────────────────────────────────────────────────────
const conBarreras = () => {
  const d = ejercicio();
  d.ops = { obstaculos: [
    { tipo: 'zanja_at', coords: [[-68.70, -18.52], [-68.70, -18.545]], estado: 'proyectado' },
    { tipo: 'minado_ac', coords: [[-68.71, -18.53], [-68.708, -18.53], [-68.708, -18.52], [-68.71, -18.52]], estado: 'proyectado' },
    { tipo: 'minado_ficticio', coords: [[-68.72, -18.53], [-68.718, -18.53], [-68.718, -18.52], [-68.72, -18.52]] },
    { tipo: 'concertina_triple', coords: [[-68.69, -18.52], [-68.69, -18.54]], estado: 'ejecutado' },
    { tipo: 'demolicion', centro: [-68.705, -18.51] },
  ], posDef: [{ anillo: [[-68.7, -18.5], [-68.69, -18.5], [-68.69, -18.49], [-68.7, -18.5]], estado: 'ocupada', etiqueta: 'I' }] };
  return d;
};
const obras = (esc) => esc.terreno.filter((t) => t.geojson && (t.geojson.obs || /^Posición/.test(t.geojson.nom || '')));

test('plan de barreras PROYECTADO: con su tipo de la Mesa, con dueño (azul) y sin efecto, salvo lo ejecutado', () => {
  const esc = W._wgEscenarioDesde(conBarreras(), null, { barreras: 'proyectado' });
  const o = obras(esc);
  assert.strictEqual(o.length, 6);
  assert.ok(o.every((t) => t.bando === 'azul'), 'el plan viaja con su dueño');
  const por = Object.fromEntries(o.filter((t) => t.geojson.obs).map((t) => [t.geojson.obs, t]));
  assert.strictEqual(por.zanja_at.tipo, 'obstaculo');
  assert.strictEqual(por.zanja_at.geojson.est, 'proyectado');
  assert.strictEqual(por.zanja_at.geojson.nom, 'ZAT (proyectado)');
  assert.strictEqual(por.zanja_at.geojson.type, 'LineString');
  assert.strictEqual(por.minado_ac.tipo, 'obstaculo');
  assert.strictEqual(por.demolicion.geojson.type, 'Point');
  // Lo que la Mesa marcó EJECUTADO entra construido igual: la concertina frena (restringido).
  assert.strictEqual(por.concertina_triple.tipo, 'restringido');
  assert.strictEqual(por.concertina_triple.geojson.est, 'construido');
  assert.strictEqual(por.concertina_triple.geojson.dib.type, 'LineString');
  assert.strictEqual(esc.obsMecanicos, 2);                   // la concertina ejecutada y la posición ocupada
});

test('plan de barreras CONSTRUIDO: el campo minado detiene, la zanja y la demolición cortan, con su zona de efecto', () => {
  const esc = W._wgEscenarioDesde(conBarreras(), null, { barreras: 'construido' });
  const por = Object.fromEntries(obras(esc).filter((t) => t.geojson.obs).map((t) => [t.geojson.obs, t]));
  assert.strictEqual(por.minado_ac.tipo, 'minado');
  assert.strictEqual(por.zanja_at.tipo, 'severo');
  assert.strictEqual(por.demolicion.tipo, 'severo');
  assert.strictEqual(por.minado_ficticio.tipo, 'obstaculo');   // el ficticio no detiene a nadie
  assert.strictEqual(por.zanja_at.geojson.nom, 'ZAT');
  // La zona de efecto: un polígono que contiene a la obra con margen (el motor avanza de a 500 m).
  const z = por.zanja_at.geojson;
  assert.strictEqual(z.type, 'Polygon');
  const xs = z.coordinates[0].map((p) => p[0]);
  const anchoKm = (Math.max(...xs) - Math.min(...xs)) * 111.32 * Math.cos(18.53 * Math.PI / 180);
  assert.ok(anchoKm > 0.55 && anchoKm < 0.65, 'ancho de la franja: ' + anchoKm);
  assert.deepStrictEqual(z.dib.coordinates, [[-68.70, -18.52], [-68.70, -18.545]]);   // se dibuja la zanja, no la franja
  const m = por.minado_ac.geojson;
  const mx = m.coordinates[0].map((p) => p[0]);
  assert.ok((Math.max(...mx) - Math.min(...mx)) * 105.6 > 0.45, 'el campo angosto se ensancha a la zona de efecto');
  assert.strictEqual(esc.obsMecanicos, 5);                   // 4 obras (el ficticio no) y la posición ocupada
});
