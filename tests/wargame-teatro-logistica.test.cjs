// v2.9.486 — 🚚 Logística y reemplazos a escala teatro (motor wargame-ops, sin base real).
//   NODE_PATH=<carpeta con typescript> node --test tests/wargame-teatro-logistica.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { laboratorio } = require('./helpers/wargame-lab.cjs');

const P = { cochabamba: [-66.157, -17.394], oruro: [-67.115, -17.970], sa: [-68.0, -18.2], ce: [-68.4, -18.0], br: [-67.0, -17.91] };
const inst = (id, des, tipo, [lng, lat], log, bando = 'azul') => ({ id, partida_id: 91, bando, designacion: des, escalon: tipo === 'BR' ? 'batallon' : 'brigada', arma: 'logistica', medio: 'motor',
  lng, lat, poder_max: 5, poder_actual: 5, estado: 'activa', carga: { teatro: { log: { tipo, estado: 'operando', ...log } } } });
const gu = (id, des, [lng, lat], extra = {}, bando = 'azul') => ({ id, partida_id: 91, bando, designacion: des, escalon: 'cuerpo', arma: 'infanteria', medio: 'motor',
  lng, lat, poder_max: 135, poder_actual: 135, estado: 'activa', carga: { teatro: { ef: 20000, kg: 20, dos: 2, ...extra } } });
function tablero(extra = []) {
  return [
    inst(1, 'BL Cochabamba', 'BL', P.cochabamba, { de: null, cap: 4000, t: 20000, max: 40000 }),
    inst(2, 'CLSB Oruro', 'SB', P.oruro, { de: 'BL Cochabamba', cap: 2400, t: 3000, max: 12000 }),
    inst(3, 'CLSA CE-I', 'SA', P.sa, { de: 'CLSB Oruro', cap: 900, t: 600, max: 1600, apoya: ['CE-I'] }),
    inst(4, 'B. Reemp. Oruro', 'BR', P.br, { de: null, hombres: 1200, procesa: 1000 }),
    gu(10, 'CE-I', P.ce),
    ...extra,
  ];
}
const dia = (model, unidades, ordenes = [], turno = 1) => model.resolverTeatro({ turno, unidades, ordenes, terreno: [], lugares: [{ p: P.oruro, nom: 'Oruro' }] });
const U = (r, id) => r.unidades.find(u => u.id === id);
const textos = (r, b) => r.eventos.filter(e => !b || (e.bandos_visibles || []).includes(b)).map(e => e.descripcion);

test('la cadena BL → SB → SA abastece a la GU y el día cierra con el PARTE LOGÍSTICO del bando', () => {
  const { model } = laboratorio();
  const r = dia(model, tablero());
  const ce = U(r, 10);
  assert.ok(ce.carga.teatro.dos > 2, `la GU recibió (dos ${ce.carga.teatro.dos})`);
  assert.ok(U(r, 3).carga.teatro.log.t > 0, 'la SA conserva stock');
  assert.ok(U(r, 2).carga.teatro.log.t < 3000 + 4000, 'la SB entregó a la SA');
  const az = textos(r, 'azul');
  assert.ok(az.some(t => /PARTE LOGÍSTICO/.test(t)), 'parte logístico');
  assert.ok(az.some(t => /PARTE DE PERSONAL/.test(t)), 'parte de personal');
  assert.equal(textos(r, 'rojo').some(t => /PARTE LOGÍSTICO/.test(t)), false, 'el rojo no ve el parte azul');
});

test('el combate produce bajas, el BR manda reemplazos y los heridos recuperables quedan en la cola', () => {
  const { model } = laboratorio();
  const rojo = { id: 20, partida_id: 91, bando: 'rojo', designacion: '1ª Brig. Acor.', escalon: 'brigada', arma: 'blindada', medio: 'oruga', lng: -68.55, lat: -18.0, poder_max: 52, poder_actual: 52, estado: 'activa' };
  let us = tablero([rojo]);
  const ordenes = [{ id: 1, unidad_id: 20, tipo: 'atacar', objetivo_id: 10 }];
  const r = dia(model, us, ordenes);
  const ce = U(r, 10), t = ce.carga.teatro;
  assert.ok(ce.poder_actual < 135, 'perdió poder');
  assert.ok(t.baj && t.baj.m + t.baj.h + t.baj.d > 100, `bajas registradas ${JSON.stringify(t.baj)}`);
  assert.ok(t.hom < 20000, 'menos hombres');
  const br = U(r, 4).carga.teatro.log;
  assert.ok((br.cola || []).length >= 1, 'heridos en recuperación');
  assert.ok((t.rc || []).length + (t.pend || 0) + (t.recib || 0) > 0, 'reemplazos en camino o integrados');
  assert.ok(br.hombres < 1200, 'el BR mandó gente');
  assert.ok(textos(r, 'azul').some(x => /bajas del día [1-9]/.test(x)), 'el parte de personal cuenta las bajas');
  // el rojo, sin instalaciones, sigue con la regla de siempre (sin partes logísticos propios)
  assert.equal(textos(r, 'rojo').some(x => /PARTE LOGÍSTICO/.test(x)), false);
});

test('una instalación queda AMENAZADA con el enemigo a 30 km y CAE si llega a ella', () => {
  const { model } = laboratorio();
  const cerca = { id: 21, partida_id: 91, bando: 'rojo', designacion: 'Brig. Mot. 4', escalon: 'brigada', arma: 'motorizada', medio: 'motor', lng: P.sa[0] - 0.22, lat: P.sa[1], poder_max: 40, poder_actual: 40, estado: 'activa' };
  const r = dia(model, tablero([cerca]));
  const sa = U(r, 3);
  assert.equal(sa.carga.teatro.log.estado, 'amenazada');
  assert.ok(textos(r, 'azul').some(t => /AMENAZADA/.test(t)));
  const encima = { ...cerca, lng: P.sa[0] - 0.05 };
  const r2 = dia(model, tablero([encima]));
  assert.equal(U(r2, 3).estado, 'fuera_combate');
  assert.equal(U(r2, 3).carga.teatro.log.t, 0);
  assert.ok(textos(r2).some(t => /CAPTURADA/.test(t)));
});

test('prioridad de abastecimiento con «apoyar» y pedido de emergencia del BR', () => {
  const { model } = laboratorio();
  const ce2 = gu(11, 'CE-II', [P.sa[0] + 0.25, P.sa[1] - 0.2]);
  const us = tablero([ce2]).map(u => (u.id === 3 ? { ...u, carga: { teatro: { log: { ...u.carga.teatro.log, cap: 120, t: 300 } } } } : u));
  const r = dia(model, us, [{ id: 5, unidad_id: 3, tipo: 'apoyar', objetivo_id: 11 }, { id: 6, unidad_id: 4, tipo: 'apoyar', mision: 'emergencia' }]);
  assert.ok(U(r, 11).carga.teatro.dos > U(r, 10).carga.teatro.dos, 'la prioridad recibe primero');
  const ped = U(r, 4).carga.teatro.log.ped;
  assert.ok(Array.isArray(ped) && ped[1] === 800 && ped[0] >= 72, `pedido de emergencia ${JSON.stringify(ped)}`);
  assert.ok(textos(r, 'azul').some(t => /PEDIDO DE EMERGENCIA/.test(t)));
});

test('importar guarda la carga logística saneada y la orden «apoyar» de una instalación pasa la validación', async () => {
  const lab = laboratorio();
  const r = await lab.invoke('importar_escenario', { limpiar: true, escala: 'teatro', unidades: [
    { bando: 'azul', designacion: 'CLSA CE-I', escalon: 'brigada', arma: 'logistica', medio: 'motor', lng: -68, lat: -18.2, poder_max: 5,
      carga: { teatro: { log: { tipo: 'SA', de: 'CLSB Oruro', cap: 900, t: 600, max: 1600, apoya: ['CE-I'], basura: 'x' }, otra: 1 } } },
    { bando: 'azul', designacion: 'B. Reemp. Oruro', escalon: 'batallon', arma: 'logistica', medio: 'motor', lng: -67, lat: -17.9, poder_max: 5, carga: { teatro: { log: { tipo: 'BR', hombres: 1200, procesa: 1000 } } } },
    { bando: 'azul', designacion: 'CE-I', escalon: 'cuerpo', arma: 'infanteria', medio: 'motor', lng: -68.4, lat: -18, poder_max: 135, carga: { teatro: { ef: 20000, kg: 18.7 } } },
    { bando: 'azul', designacion: 'TRUCHA', escalon: 'brigada', arma: 'logistica', medio: 'motor', lng: -68, lat: -18, poder_max: 5, carga: { teatro: { log: { tipo: 'XX' } } } },
  ] });
  assert.equal(r.ok, true, r.error);
  const fila = d => lab.tables.wg_unidades.find(u => u.designacion === d);
  assert.deepEqual(Object.keys(fila('CLSA CE-I').carga.teatro), ['log']);
  assert.equal(fila('CLSA CE-I').carga.teatro.log.basura, undefined);
  assert.equal(fila('CE-I').carga.teatro.ef, 20000);
  assert.equal(fila('TRUCHA').carga, undefined, 'un tipo inventado no es instalación');
  assert.equal((await lab.invoke('iniciar')).ok, true);
  const sa = fila('CLSA CE-I').id, ce = fila('CE-I').id, br = fila('B. Reemp. Oruro').id;
  const a = await lab.invoke('enviar_orden', { orden: { unidad_id: sa, tipo: 'apoyar', objetivo_id: ce } });
  assert.equal(a.ok, true, a.error);
  const b = await lab.invoke('enviar_orden', { orden: { unidad_id: br, tipo: 'apoyar', mision: 'emergencia' } });
  assert.equal(b.ok, true, b.error);
  assert.equal(lab.tables.wg_ordenes.find(o => o.unidad_id === br).mision, 'emergencia');
  const c = await lab.invoke('enviar_orden', { orden: { unidad_id: ce, tipo: 'apoyar', objetivo_id: sa } });
  assert.equal(c.ok, false, 'una GU de combate no «apoya»');
});
