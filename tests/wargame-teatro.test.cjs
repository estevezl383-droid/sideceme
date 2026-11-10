const { test } = require('node:test');
const assert = require('node:assert/strict');
const { laboratorio } = require('./helpers/wargame-lab.cjs');

const ficha = (extra = {}) => ({ bando: 'azul', designacion: 'FICHA A', escalon: 'brigada', arma: 'motorizada', medio: 'motor',
  lng: 1, lat: 1, poder_max: 40, obs_km: 30, ...extra });
async function importar(lab, extra = {}) {
  const result = await lab.invoke('importar_escenario', { limpiar: true, escala: 'teatro', unidades: [ficha()], ...extra });
  assert.equal(result.ok, true, result.error); return result;
}
const reloj = lab => lab.tables.wg_terreno.find(t => t.tipo === 'reloj')?.geojson;

test('la escala es explícita y el reloj anterior conserva su velocidad', () => {
  const { model } = laboratorio();
  assert.equal(model.esTeatro({}), false);
  assert.equal(model.esTeatro({ escala: 'teatro' }), true);
  assert.equal(model.velocidadDe({ velocidad: 30 }), 30);
  assert.equal(model.velocidadDe({ escala: 'teatro', velocidad: 30 }), 720);
  assert.equal(model.velocidadDe({ escala: 'teatro', velocidad: 1440 }), 1440);
  assert.equal(model.horaTeatro(23.9999), 'D 23:59');
  assert.equal(model.horaTeatro(24), 'D+1 00:00');
});

test('importar teatro prepara sólo la partida indicada y no requiere tablas nuevas', async () => {
  const lab = laboratorio();
  lab.tables.wg_unidades.push({ id: 700, partida_id: 92, designacion: 'OTRA PARTIDA' });
  await importar(lab);
  assert.equal(lab.tables.wg_partidas[0].duracion_turno_horas, 24);
  assert.equal(reloj(lab).escala, 'teatro'); assert.equal(reloj(lab).activo, false);
  assert.equal(lab.tables.wg_unidades.find(u => u.id === 700).designacion, 'OTRA PARTIDA');
  assert.ok(lab.calls.every(c => ['sesiones', 'profesores', 'wg_partidas', 'wg_unidades', 'wg_terreno', 'wg_ordenes', 'wg_eventos', 'wg_detecciones'].includes(c.table)));
});

test('agregar capas conserva la escala y reemplazar por otro escenario la elimina', async () => {
  const lab = laboratorio(); await importar(lab);
  assert.equal((await lab.invoke('importar_escenario', { unidades: [ficha({ designacion: 'CAPA' })] })).ok, true);
  assert.equal(reloj(lab).escala, 'teatro');
  assert.equal((await lab.invoke('importar_escenario', { limpiar: true, unidades: [ficha()] })).ok, true);
  assert.equal(lab.tables.wg_terreno.some(t => t.tipo === 'reloj'), false);
});

test('la marca de escala no elude permisos de importación', async () => {
  const lab = laboratorio();
  const result = await lab.invoke('importar_escenario', { limpiar: true, escala: 'teatro' }, { invitado_nombre: 'JUGADOR FICTICIO', clave_acceso: 'azul-demo' });
  assert.equal(result.status, 403);
  assert.equal(lab.calls.some(c => ['delete', 'insert', 'update', 'upsert'].includes(c.op)), false);
});

test('PLAY, paso, pausa y estado usan el contrato real y conservan la escala', async () => {
  const lab = laboratorio(); await importar(lab);
  assert.equal((await lab.invoke('iniciar')).ok, true);
  const id = lab.tables.wg_unidades[0].id;
  assert.equal((await lab.invoke('enviar_orden', { orden: { unidad_id: id, tipo: 'mover', ruta: [[1,1],[1.5,1]], destino_lng: 1.5, destino_lat: 1, mision: 'marcada' } })).ok, true);
  assert.equal((await lab.invoke('reloj', { activo: true, velocidad: 720 })).ok, true);
  lab.clock.now += 5000;
  const step = await lab.invoke('tic');
  assert.equal(step.ok, true, step.error);
  assert.equal(step.horas, 1); assert.ok(step.trazas.length);
  assert.ok(step.cambios[0].lng > 1);
  assert.ok(reloj(lab).mem.teatro);
  assert.equal(lab.tables.wg_terreno.some(t => String(t.tipo).startsWith('log_')), false);
  const paused = await lab.invoke('reloj', { activo: false, velocidad: 720 });
  assert.equal(paused.reloj.escala, 'teatro');
  const after = await lab.invoke('tic'); assert.equal(after.pausado, true);
  const state = await lab.invoke('estado');
  assert.equal(state.reloj.escala, 'teatro'); assert.equal(state.reloj.mem, undefined);
});

test('un encuentro a hora cero se anuncia una sola vez y usa reservas de juego', () => {
  const lab = laboratorio(), { model } = lab;
  const units = [ficha({ id: 1, poder_actual: 40, estado: 'activa' }), ficha({ id: 2, bando: 'rojo', designacion: 'FICHA B', lng: 1.1, poder_actual: 40, estado: 'activa' })];
  const mem = {}, fin = new Set();
  const state = { unidades: units, terreno: [], ordenes: [{ id: 1, unidad_id: 1, tipo: 'atacar', objetivo_id: 2 }], turno: 1 };
  const first = model.resolverTeatro({ ...state, tic: { horas: .5, hora: 0, mem, fin } });
  assert.equal(first.eventos.filter(e => /CONTACTO/.test(e.descripcion)).length, 1);
  assert.equal(first.combates.length, 1);
  assert.ok(first.unidades[0].carga.teatro.dos < 5);
  const second = model.resolverTeatro({ ...state, unidades: first.unidades, tic: { horas: .5, hora: .5, mem, fin } });
  assert.equal(second.eventos.filter(e => /CONTACTO/.test(e.descripcion)).length, 0);
});

test('el cierre de un día deja un parte y conserva resultados serializables', () => {
  const { model } = laboratorio();
  const result = model.resolverTeatro({ turno: 1, terreno: [], unidades: [
    ficha({ id: 1, poder_actual: 40, estado: 'activa' }),
    ficha({ id: 2, bando: 'rojo', lng: 1.1, poder_actual: 40, estado: 'activa' }),
  ], ordenes: [{ id: 1, unidad_id: 1, tipo: 'atacar', objetivo_id: 2 }] });
  assert.ok(result.eventos.some(e => /PARTE DEL DÍA/.test(e.descripcion)));
  assert.doesNotThrow(() => JSON.stringify(result));
  assert.ok(result.unidades.every(u => Number.isFinite(u.lng) && Number.isFinite(u.lat) && Number.isFinite(u.poder_actual)));
});

test('la función conserva las respuestas de salud y rechaza llamadas sin sesión', async () => {
  const lab = laboratorio();
  assert.equal((await lab.handler(new Request('http://laboratorio.invalid'))).status, 405);
  assert.equal((await lab.handler(new Request('http://laboratorio.invalid', { method: 'OPTIONS' }))).status, 200);
  assert.equal((await lab.invoke('estado', {}, {})).status, 403);
});

test('el reloj corta el paso en el cambio de día y empieza el siguiente en cero', async () => {
  const lab = laboratorio(); await importar(lab); await lab.invoke('iniciar');
  await lab.invoke('reloj', { activo:true, velocidad:2880 });
  reloj(lab).hEn=23.5; lab.clock.now+=5000;
  const result=await lab.invoke('tic');
  assert.equal(result.ok,true,result.error); assert.equal(result.horas,.5);
  assert.equal(result.turno,2); assert.equal(result.hEn,0);
});

test('las mismas fichas y órdenes producen el mismo resultado del juego', () => {
  const {model}=laboratorio();
  const state={turno:1,terreno:[],unidades:[ficha({id:1,poder_actual:40,estado:'activa'}),ficha({id:2,bando:'rojo',lng:1.1,poder_actual:40,estado:'activa'})],
    ordenes:[{id:1,unidad_id:1,tipo:'atacar',objetivo_id:2}]};
  assert.deepEqual(model.resolverTeatro(state),model.resolverTeatro(state));
});

test('una ficha agotada sale del juego y las reservas se pueden recuperar', () => {
  const {model}=laboratorio();
  const result=model.resolverTeatro({turno:1,terreno:[],ordenes:[],unidades:[
    ficha({id:1,poder_actual:5,estado:'activa'}),
    ficha({id:2,lng:1.1,poder_actual:40,estado:'activa',carga:{teatro:{dos:1}}}),
    ficha({id:3,designacion:'PC FICTICIO',lng:1.11,escalon:'ejercito',poder_actual:10,poder_max:10,estado:'activa'}),
  ]});
  assert.equal(result.unidades.find(u=>u.id===1).estado,'fuera_combate');
  assert.ok(result.unidades.find(u=>u.id===2).carga.teatro.dos>1);
});
