// v2.9.442 — EL PESO DE CADA ITEM DE UN BLOQUE.
// Caso real: Sumarios Informativos (2do ciclo, 2026 sem. 2). TRAB. 1 = 5%,
// TRAB. 2 = 15%, FOR. = 20%, SUM. = 60%. El bloque Trabajo se guardó con
// aporte 20 y sin el peso de cada trabajo; al corregir un casillero, la nota
// se rehizo con promedio simple (10 y 10) y Careaga y Espinoza Vaca quedaron
// distintos a la planilla de la Sección.
// node --test tests/notas-pesos-item.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

const SRC = stripTypeScriptTypes(fs.readFileSync('supabase/functions/notas-ops/index.ts', 'utf8')
  .replace(/^import .*;$/gm, '').replace(/^export /gm, ''));

function fakeDb(db) {
  let uid = 0;
  return {
    from(table) {
      if (!db[table]) db[table] = [];
      const f = []; let op = 'select', payload, single = false;
      const q = {
        select() { return q; },
        eq(k, v) { f.push(x => x[k] === v); return q; },
        neq(k, v) { f.push(x => x[k] !== v); return q; },
        order() { return q; }, limit() { return q; },
        maybeSingle() { single = true; return q; },
        insert(v) { op = 'insert'; payload = v; return q; },
        update(v) { op = 'update'; payload = v; return q; },
        then(res, rej) {
          let rows;
          if (op === 'insert') {
            rows = [].concat(payload).map(v => { const n = { id: 'id' + (++uid), ...v }; db[table].push(n); return n; });
          } else {
            rows = db[table].filter(x => f.every(g => g(x)));
            if (op === 'update') rows.forEach(x => Object.assign(x, payload));
          }
          const data = JSON.parse(JSON.stringify(single ? (rows[0] || null) : rows));
          return Promise.resolve({ data, error: null }).then(res, rej);
        },
      };
      return q;
    },
  };
}

const clave = { gestion: 2026, semestre: 2, ciclo: '2DO CICLO', materia: 'Sumarios Informativos' };
const desglose = (t1, t2, f, s, pesos) => ({ bloques: [
  { tipo: 'Trabajo', items: [{ n: 'TRAB. 1', v: t1, ...(pesos ? { p: 5 } : {}) }, { n: 'TRAB. 2', v: t2, ...(pesos ? { p: 15 } : {}) }], aporte: 20 },
  { tipo: 'Formativa', items: [{ n: 'FOR.', v: f }], aporte: 20 },
  { tipo: 'Sumativa', items: [{ n: 'SUM.', v: s }], aporte: 60 },
] });
const nota = (t1, t2, f, s) => parseFloat((t1 * .05 + t2 * .15 + f * .2 + s * .6).toFixed(10));

// Alumnos reales de la planilla (paralelo A), con la nota final de la Sección.
const OTROS = [
  [99, 94, 95.6522, 99.505], [96, 90, 90.5797, 90.099], [96, 93, 97.1014, 90.5941],
  [94, 90, 90.5797, 90.099], [95, 93, 87.6812, 86.6337], [97, 92, 95.6522, 84.6535],
];

function fixture({ pesos = false, otros = OTROS } = {}) {
  return {
    sesiones: [{ token: 'soto', usuario_id: 'P017', usuario_tabla: 'profesores', revocado: false, expira_en: '2099-01-01' }],
    profesores: [{ id: 'P017', grado: 'Tcnl.', nombre_completo: 'Soto Farfan', rol: 'profesor', roles: ['evaluaciones'], activo: true, es_auxiliar: false, evaluador_ciclo: 2 }],
    notas_academicas: [
      // Careaga tal como lo cargó Balderrama el 12-oct (TRAB. 2 = 92).
      { id: 'careaga', cursante_id: 'C010', ci: '10', ...clave, nota_final: '89.4423', atributo: 'MB', detalle_json: desglose(96, 92, 89.8551, 88.1188, pesos) },
      // Espinoza Vaca tal como se cargó (FOR. = 97.2754).
      { id: 'espinoza', cursante_id: 'C020', ci: '20', ...clave, nota_final: '92.9306', atributo: 'MB', detalle_json: desglose(96, 91.5, 97.2754, 91.5842, pesos) },
      ...otros.map((r, i) => ({ id: 'o' + i, cursante_id: 'X' + i, ci: 'x' + i, ...clave,
        nota_final: String(nota(...r)), atributo: 'MB', detalle_json: desglose(...r, pesos) })),
    ],
    notas_confirmaciones: [],
    notas_correcciones: [],
  };
}

function servidor(db) {
  let handler;
  const ctx = { Deno: { env: { get: () => '' }, serve: h => { handler = h; } }, createClient: () => fakeDb(db),
    Response, Request, JSON, Date, Map, Set, Math, Number, String, Array, Object, console, parseFloat };
  vm.createContext(ctx); vm.runInContext(SRC, ctx);
  return async (body) => {
    const r = await handler(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }));
    return { status: r.status, ...(await r.json()) };
  };
}
const corregir = (cursante_id, bloques) => ({ accion: 'corregir_nota', token: 'soto', cursante_id, ...clave,
  motivo: 'Verificación de trabajo', bloques });

test('Careaga: TRAB. 2 de 92 a 97 da 90.1923 (5% y 15%), no 90.1423 (10 y 10)', async () => {
  const db = fixture(); const call = servidor(db);
  const r = await call(corregir('C010', desglose(96, 97, 89.8551, 88.1188).bloques));
  assert.equal(r.ok, true, r.error);
  assert.equal(r.nota_nueva, 90.1923);
  // El peso deducido queda guardado en los items para la próxima.
  const items = db.notas_academicas[0].detalle_json.bloques[0].items;
  assert.deepEqual(items.map(i => i.p), [5, 15]);
  assert.deepEqual(items.map(i => i.v), [96, 97]);
});

test('Espinoza Vaca: FOR. de 97.2754 a 99.2754 da 93.3306, no 93.5556', async () => {
  const db = fixture(); const call = servidor(db);
  const r = await call(corregir('C020', desglose(96, 91.5, 99.2754, 91.5842).bloques));
  assert.equal(r.ok, true, r.error);
  assert.equal(r.nota_nueva, 93.3306);
});

test('con los pesos ya guardados en la nota, la cuenta es directa', async () => {
  const db = fixture({ pesos: true }); const call = servidor(db);
  const r = await call(corregir('C010', desglose(96, 97, 89.8551, 88.1188, true).bloques));
  assert.equal(r.ok, true, r.error);
  assert.equal(r.nota_nueva, 90.1923);
});

test('el navegador no puede borrar ni cambiar el peso de un item', async () => {
  const db = fixture({ pesos: true }); const call = servidor(db);
  const b = desglose(96, 97, 89.8551, 88.1188, true).bloques;
  b[0].items[1].p = 50;
  const r = await call(corregir('C010', b));
  assert.equal(r.ok, true, r.error);
  assert.equal(r.nota_nueva, 90.1923);
  assert.deepEqual(db.notas_academicas[0].detalle_json.bloques[0].items.map(i => i.p), [5, 15]);
});

test('sin alumnos con trabajos distintos no se puede saber el peso: se rechaza sin tocar nada', async () => {
  // Como Elaboración de Planes: TRAB. 1 = TRAB. 2 en todos los alumnos.
  const db = fixture({ otros: [[95, 95, 90, 90], [92, 92, 88, 91], [97, 97, 93, 89]] });
  const call = servidor(db);
  const antes = JSON.stringify(db.notas_academicas);
  const r = await call(corregir('C010', desglose(96, 97, 89.8551, 88.1188).bloques));
  assert.equal(r.status, 400);
  assert.match(r.error, /no sabe cuanto vale cada uno/);
  assert.equal(JSON.stringify(db.notas_academicas), antes);
  assert.equal(db.notas_correcciones.length, 0);
});

test('si los demás confirman pesos iguales, se corrige con el promedio simple como siempre', async () => {
  const igual = (t1, t2, f, s) => parseFloat(((t1 + t2) / 2 * .2 + f * .2 + s * .6).toFixed(10));
  const db = fixture();
  db.notas_academicas = [
    { id: 'a', cursante_id: 'C1', ci: '1', ...clave, nota_final: String(igual(96, 92, 90, 90)), atributo: 'MB', detalle_json: desglose(96, 92, 90, 90) },
    ...[[99, 94, 95, 99], [96, 90, 90, 90], [96, 93, 97, 90], [94, 90, 90, 92]].map((r, i) => ({
      id: 'o' + i, cursante_id: 'X' + i, ci: 'x' + i, ...clave, nota_final: String(igual(...r)), atributo: 'MB', detalle_json: desglose(...r) })),
  ];
  const r = await servidor(db)(corregir('C1', desglose(96, 97, 90, 90).bloques));
  assert.equal(r.ok, true, r.error);
  assert.equal(r.nota_nueva, igual(96, 97, 90, 90));
  assert.equal(db.notas_academicas[0].detalle_json.bloques[0].items[0].p, undefined);
});

// ── La carga del Excel (index.html) ─────────────────────────────────────────
function cargador() {
  const html = fs.readFileSync('index.html', 'utf8');
  const tramo = (desde, hasta) => html.slice(html.indexOf(desde), html.indexOf(hasta, html.indexOf(desde)));
  const codigo = tramo('function _ncNorm(', 'function _ncNum(') + tramo('function _ncNum(', '\n}\n') + '\n}\n'
    + tramo('function _ncValor(', '// La nota que queda al mover un bloque')
    + tramo('function _ncTipo(', '/* ------------------- construir filas');
  const ctx = {}; vm.createContext(ctx); vm.runInContext(codigo, ctx);
  return ctx;
}
// Encabezado de la planilla de la Sección (SUMARIOS_INFORMATIVOS.xlsx, hoja MOD5).
const HEADER = ['N°', 'GRADO', 'ARMA', 'APELLIDOS Y NOMBRES', 'TRAB. 1', 'TRAB. 5%', 'TRAB. 2', 'TRAB. 15%', 'FOR.', 'FOR. 20%', 'SUM.', 'SUM 60%', 'NOTA', 'ATRIB.', 'CURSO'];
const COMPS = [4, 5, 6, 7, 8, 9, 10, 11];

test('la carga guarda el peso de cada trabajo (5% y 15%) y el desglose da la nota final', () => {
  const c = cargador();
  const fila = [6, 'MY.', 'INF.', 'CAREAGA TELLEZ MAIKOL FERNANDO', 96, 4.8, 97, 14.55, 89.8551, 17.97102, 88.1188, 52.87128, 90.1923, 'MB', 'A'];
  const d = c._ncDetalle(HEADER, fila, COMPS, 90.1923);
  const tr = d.bloques[0];
  assert.equal(tr.tipo, 'Trabajo'); assert.equal(tr.aporte, 20);
  assert.deepEqual(JSON.parse(JSON.stringify(tr.items)), [{ n: 'TRAB. 1', v: 96, p: 5 }, { n: 'TRAB. 2', v: 97, p: 15 }]);
  assert.equal(d.bloques[1].items[0].p, undefined);          // un solo item: sin peso propio
  assert.ok(Math.abs(c._ncSegunDesglose(d.bloques, 'A') - 90.1923) < 1e-9);
});

test('la carga no guarda pesos cuando todos los trabajos valen lo mismo', () => {
  const c = cargador();
  const h = ['APELLIDOS Y NOMBRES', 'TRAB. 1', 'TRAB. 10%', 'TRAB. 2', 'TRAB. 10%', 'FOR.', 'FOR. 20%', 'SUM.', 'SUM. 60%', 'NOTA'];
  const d = c._ncDetalle(h, ['X Y', 90, 9, 80, 8, 70, 14, 60, 36, 67], [1, 2, 3, 4, 5, 6, 7, 8], 67);
  assert.deepEqual(JSON.parse(JSON.stringify(d.bloques[0].items)), [{ n: 'TRAB. 1', v: 90 }, { n: 'TRAB. 2', v: 80 }]);
  assert.equal(d.bloques[0].aporte, 20);
});
