// Pruebas de la Edge Function notas-modulo con una base simulada en memoria.
// node --test tests/notas-modulo.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

const SRC = stripTypeScriptTypes(fs.readFileSync('supabase/functions/notas-modulo/index.ts', 'utf8')
  .replace(/^import .*;$/gm, '').replace(/^export /gm, ''));

function fakeDb(db) {
  let uid = 0;
  return {
    from(table) {
      if (!db[table]) db[table] = [];
      const f = []; let op = 'select', payload, single = false, conflict = null, head = false, lim = null;
      const q = {
        select(_c, o) { if (o && o.head) head = true; return q; },
        eq(k, v) { f.push(x => x[k] === v); return q; },
        neq(k, v) { f.push(x => x[k] !== v); return q; },
        in(k, v) { f.push(x => v.includes(x[k])); return q; },
        is(k, v) { f.push(x => (x[k] ?? null) === v); return q; },
        not(k, _o, v) { f.push(x => (x[k] ?? null) !== v); return q; },
        order() { return q; }, limit(n) { lim = n; return q; },
        maybeSingle() { single = true; return q; },
        insert(v) { op = 'insert'; payload = v; return q; },
        update(v) { op = 'update'; payload = v; return q; },
        upsert(v, o) { op = 'upsert'; payload = v; conflict = o && o.onConflict; return q; },
        delete() { op = 'delete'; return q; },
        then(res, rej) {
          let rows;
          const T = db[table];
          if (op === 'insert' || op === 'upsert') {
            rows = [];
            for (const v of [].concat(payload)) {
              const keys = conflict ? conflict.split(',') : null;
              const ex = keys && T.find(x => keys.every(k => x[k] === v[k]));
              if (ex) { Object.assign(ex, v); rows.push(ex); }
              else { const n = { id: 'id' + (++uid), creado_en: new Date().toISOString(), ...v }; T.push(n); rows.push(n); }
            }
          } else {
            rows = T.filter(x => f.every(g => g(x)));
            if (op === 'update') rows.forEach(x => Object.assign(x, payload));
            if (op === 'delete') db[table] = T.filter(x => !rows.includes(x));
          }
          if (lim) rows = rows.slice(0, lim);
          const data = JSON.parse(JSON.stringify(single ? (rows[0] || null) : rows));
          return Promise.resolve({ data: head ? null : data, error: null, count: rows.length }).then(res, rej);
        },
      };
      return q;
    },
  };
}

const MATS = ['HISTORIA MILITAR APLICADA I', 'Doctrina de Patriotas'];
function fixture() {
  const conf = (c, m, nota, estado = 'confirmada', obs = null) => ({ cursante_id: c, gestion: 2026, semestre: 2, ciclo: '1ER CICLO', materia: m,
    nota_final: nota, estado, publicado_en: '2026-09-01T00:00:00Z', observacion_cursante: obs });
  const nota = (c, m, v) => ({ id: c + m, cursante_id: c, gestion: 2026, semestre: 2, ciclo: '1ER CICLO', materia: m, nota_final: v });
  return {
    sesiones: [
      { token: 'aux', usuario_id: 'S001', usuario_tabla: 'profesores', revocado: false, expira_en: '2099-01-01' },
      { token: 'c1', usuario_id: 'C1', usuario_tabla: 'cursantes', revocado: false, expira_en: '2099-01-01' },
      { token: 'c3', usuario_id: 'C3', usuario_tabla: 'cursantes', revocado: false, expira_en: '2099-01-01' },
    ],
    profesores: [
      { id: 'S001', rol: 'evaluaciones', roles: [], activo: true, es_auxiliar: true, evaluador_ciclo: null, nombre_completo: 'Balderrama' },
      { id: 'P028', rol: 'profesor', roles: ['evaluaciones'], activo: true, es_auxiliar: false, evaluador_ciclo: 1 },
      { id: 'P017', rol: 'profesor', roles: ['evaluaciones'], activo: true, es_auxiliar: false, evaluador_ciclo: 2 },
    ],
    cursantes: ['C1', 'C2', 'C3', 'C4'].map(id => ({ id, ci: id, nombre_completo: 'Alumno ' + id, ciclo: '1ER CICLO', activo: true })),
    notas_academicas: [
      nota('C1', MATS[0], 93.32475), nota('C1', MATS[1], 90.42196999999999),
      nota('C2', MATS[0], 93.3248), nota('C2', MATS[1], 88),          // redondeada al cargar: NO coincide
      nota('C3', MATS[0], 94.01905), nota('C3', MATS[1], 91),
      nota('C4', MATS[0], 95), nota('C4', MATS[1], 96),
    ],
    notas_confirmaciones: [
      conf('C1', MATS[0], 93.32475), conf('C1', MATS[1], 90.42196999999999),
      conf('C2', MATS[0], 93.3248), conf('C2', MATS[1], 88),
      conf('C3', MATS[0], 94.01905, 'rechazada', 'no coincide con la planilla'), conf('C3', MATS[1], 91),
      conf('C4', MATS[0], 95), conf('C4', MATS[1], 96, 'pendiente'),
    ],
    notas_modulos: [], notas_modulo_alumnos: [], notas_modulo_alarmas: [],
  };
}
function servidor(db) {
  let handler;
  const ctx = { Deno: { env: { get: () => '' }, serve: h => { handler = h; } }, createClient: () => fakeDb(db),
    Response, JSON, Date, Map, Set, Math, Number, String, Array, Object, crypto, console, parseFloat };
  vm.createContext(ctx); vm.runInContext(SRC, ctx);
  return async (body) => {
    const r = await handler(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }));
    return { status: r.status, ...(await r.json()) };
  };
}
const carga = (extra) => Object.assign({ token: 'aux', gestion: 2026, semestre: 2, ciclo: '1ER CICLO', modulo: 'Estudios Militares Complementarios I',
  materias: MATS.map(m => ({ columna: m, materia: m })),
  filas: [
    { cursante_id: 'C1', promedio: 91.873355, notas: { [MATS[0]]: 93.32475, [MATS[1]]: 90.42197 } },
    { cursante_id: 'C2', promedio: 90.662375, notas: { [MATS[0]]: 93.32475, [MATS[1]]: 88 } },
    { cursante_id: 'C3', promedio: 92.509525, notas: { [MATS[0]]: 94.01905, [MATS[1]]: 91 } },
    { cursante_id: 'C4', promedio: 95.5, notas: { [MATS[0]]: 95, [MATS[1]]: 96 } },
  ] }, extra);

test('comparación exacta: sin redondeo, solo sin ruido binario', () => {
  const db = fixture(); servidor(db);
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(stripTypeScriptTypes(fs.readFileSync('supabase/functions/notas-modulo/index.ts', 'utf8')
    .replace(/^import .*;$/gm, '').replace(/^export /gm, '').split('// ------------------------------------------------------------------ sesiones')[0]
    .replace(/const sb = createClient\([^;]*;/s, '')), ctx);
  assert.equal(ctx.coincide(93.32475, 93.3248), false);
  assert.equal(ctx.coincide(90.42196999999999, '90.42197'), true);
  assert.equal(ctx.coincide(96, '96.0000'), true);
  assert.equal(ctx.coincide(null, 96), false);
});

test('revisar no escribe nada y retiene a quien no coincide, objetó o no firmó', async () => {
  const db = fixture(); const call = servidor(db);
  const antes = JSON.stringify(db);
  const r = await call({ accion: 'revisar_modulo', ...carga() });
  assert.equal(r.ok, true);
  assert.equal(JSON.stringify(db), antes);
  const por = Object.fromEntries(r.alumnos.map(a => [a.cursante_id, a]));
  assert.equal(por.C1.ok, true);
  assert.equal(por.C2.problemas[0].tipo, 'no_coincide');
  assert.equal(por.C3.problemas[0].tipo, 'objetada');
  assert.equal(por.C4.problemas[0].tipo, 'sin_firma');
  assert.deepEqual(r.resumen, { alumnos: 4, publicables: 1, retenidos: 3, problemas: 3 });
});

test('cargar publica el promedio tal cual, retiene, alarma a auxiliar + evaluador del ciclo y no toca notas de materias', async () => {
  const db = fixture(); const call = servidor(db);
  const notasAntes = JSON.stringify(db.notas_academicas), confAntes = JSON.stringify(db.notas_confirmaciones);
  const r = await call({ accion: 'cargar_modulo', ...carga() });
  assert.equal(r.ok, true);
  assert.deepEqual(r.publicados, ['C1']);
  assert.deepEqual(r.destinatarios.sort(), ['P028', 'S001']);
  assert.equal(r.alarmas_nuevas, 3);
  assert.equal(JSON.stringify(db.notas_academicas), notasAntes);
  assert.equal(JSON.stringify(db.notas_confirmaciones), confAntes);
  const c1 = db.notas_modulo_alumnos.find(x => x.cursante_id === 'C1');
  assert.equal(c1.promedio, 91.873355);
  assert.equal(c1.estado, 'pendiente');
  assert.equal(db.notas_modulo_alumnos.find(x => x.cursante_id === 'C2').estado, 'retenida');
  // Recarga idéntica: sin alarmas duplicadas, sin filas duplicadas.
  const r2 = await call({ accion: 'cargar_modulo', ...carga() });
  assert.equal(r2.alarmas_nuevas, 0);
  assert.equal(db.notas_modulo_alumnos.length, 4);
  assert.equal(db.notas_modulos.length, 1);
});

test('el alumno firma su módulo; uno retenido no lo ve', async () => {
  const db = fixture(); const call = servidor(db);
  await call({ accion: 'cargar_modulo', ...carga() });
  const mios = await call({ accion: 'mis_modulos', token: 'c1' });
  assert.equal(mios.modulos.length, 1);
  const id = mios.modulos[0].id;
  const ok = await call({ accion: 'resolver_modulo', token: 'c1', id, decision: 'confirmar', firma: 'data:png', promedio_mostrado: 91.873355 });
  assert.equal(ok.ok, true);
  assert.equal(db.notas_modulo_alumnos.find(x => x.id === id).estado, 'confirmada');
  const otro = await call({ accion: 'mis_modulos', token: 'c3' });
  assert.equal(otro.modulos.length, 0);
  // Una recarga idéntica conserva la firma.
  const r = await call({ accion: 'cargar_modulo', ...carga() });
  assert.equal(r.sin_tocar, 1);
  assert.equal(db.notas_modulo_alumnos.find(x => x.id === id).estado, 'confirmada');
});

test('si una materia cambia después de publicar, la firma se bloquea y sale alarma', async () => {
  const db = fixture(); const call = servidor(db);
  await call({ accion: 'cargar_modulo', ...carga() });
  db.notas_academicas.find(x => x.cursante_id === 'C1' && x.materia === MATS[1]).nota_final = 95.2381;
  const id = db.notas_modulo_alumnos.find(x => x.cursante_id === 'C1').id;
  const r = await call({ accion: 'consultar_modulo', token: 'c1', id });
  assert.equal(r.ok, false); assert.equal(r.retenida, true);
  assert.equal(db.notas_modulo_alumnos.find(x => x.id === id).estado, 'retenida');
  assert.ok(db.notas_modulo_alarmas.some(a => a.cursante_id === 'C1' && a.tipo === 'cambio_al_firmar'));
});

test('el evaluador de otro ciclo no puede cargar, y un cursante no puede usar acciones del personal', async () => {
  const db = fixture(); const call = servidor(db);
  db.sesiones.push({ token: 'soto', usuario_id: 'P017', usuario_tabla: 'profesores', revocado: false, expira_en: '2099-01-01' });
  const r = await call({ accion: 'cargar_modulo', ...carga({ token: 'soto' }) });
  assert.equal(r.status, 403);
  const c = await call({ accion: 'cargar_modulo', ...carga({ token: 'c1' }) });
  assert.equal(c.ok, false);
  assert.equal(db.notas_modulo_alumnos.length, 0);
});

test('el alumno con observaciones pasa solo a normal cuando el evaluador corrige y el alumno firma', async () => {
  const db = fixture(); const call = servidor(db);
  await call({ accion: 'cargar_modulo', ...carga() });
  let r = await call({ accion: 'control', token: 'aux', gestion: 2026, semestre: 2 });
  assert.deepEqual(r.liberados, []);
  // Corrección del evaluador: la nota queda igual a la planilla, pero aún sin firmar.
  db.notas_academicas.find(x => x.cursante_id === 'C2' && x.materia === MATS[0]).nota_final = 93.32475;
  const cf = db.notas_confirmaciones.find(x => x.cursante_id === 'C2' && x.materia === MATS[0]);
  Object.assign(cf, { nota_final: 93.32475, estado: 'pendiente' });
  r = await call({ accion: 'control', token: 'aux', gestion: 2026, semestre: 2 });
  assert.deepEqual(r.liberados, []);
  assert.equal(db.notas_modulo_alumnos.find(x => x.cursante_id === 'C2').estado, 'retenida');
  cf.estado = 'confirmada';
  r = await call({ accion: 'control', token: 'aux', gestion: 2026, semestre: 2 });
  assert.deepEqual(r.liberados, ['C2']);
  assert.equal(db.notas_modulo_alumnos.find(x => x.cursante_id === 'C2').estado, 'pendiente');
  assert.ok(db.notas_modulo_alarmas.filter(a => a.cursante_id === 'C2').every(a => a.atendida_en));
});
