// v2.9.430 — Corregir la nota final como AJUSTE DE DECIMALES.
// Caso real: el desglose (94 · 92.0635 · 95 con 10/30/60) da 94.01905 y la
// planilla publicada dice 94.0191. El evaluador tiene que poder dejar la nota
// final como la planilla, pero sin divorciarla de su desglose.
// node --test tests/notas-correccion-ajuste.test.cjs
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

const MAT = 'HISTORIA MILITAR APLICADA I';
const clave = { gestion: 2026, semestre: 2, ciclo: '1ER CICLO', materia: MAT };
const desglose = (trab, form, sum) => ({ bloques: [
  { tipo: 'Trabajo', items: [{ n: 'TRAB.', v: trab }], aporte: 10 },
  { tipo: 'Formativa', items: [{ n: 'FOR.', v: form }], aporte: 30 },
  { tipo: 'Sumativa', items: [{ n: 'SUM.', v: sum }], aporte: 60 },
] });

function fixture() {
  return {
    sesiones: [
      { token: 'ortiz', usuario_id: 'P028', usuario_tabla: 'profesores', revocado: false, expira_en: '2099-01-01' },
      { token: 'aux', usuario_id: 'S001', usuario_tabla: 'profesores', revocado: false, expira_en: '2099-01-01' },
    ],
    profesores: [
      { id: 'P028', grado: 'My.', nombre_completo: 'Ortiz', rol: 'profesor', roles: ['evaluaciones'], activo: true, es_auxiliar: false, evaluador_ciclo: 1 },
      { id: 'S001', nombre_completo: 'Balderrama', rol: 'evaluaciones', roles: [], activo: true, es_auxiliar: true, evaluador_ciclo: null },
    ],
    notas_academicas: [
      // La base devuelve `numeric` como texto: igual que en producción.
      { id: 'n1', cursante_id: 'C123', ci: '1', ...clave, nota_final: '94.01905', atributo: 'MB', detalle_json: desglose(94, 92.0635, 95) },
      { id: 'n2', cursante_id: 'C200', ci: '2', ...clave, nota_final: '88.5', atributo: 'B', detalle_json: null },
    ],
    notas_confirmaciones: [
      { id: 'k1', cursante_id: 'C123', ...clave, nota_final: 94.01905, estado: 'rechazada',
        observacion_cursante: 'en la planilla de notas que se publicó es 94,0191', firma_cursante: 'data:png' },
    ],
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
const corregir = (extra) => Object.assign({ accion: 'corregir_nota', token: 'ortiz', cursante_id: 'C123', ...clave,
  motivo: 'La planilla publicada redondeó a 4 decimales' }, extra);

test('ajuste de decimales: la nota final queda como la planilla y el alumno vuelve a firmar', async () => {
  const db = fixture(); const call = servidor(db);
  const r = await call(corregir({ nota_final: 94.0191 }));
  assert.equal(r.ok, true, r.error);
  assert.equal(r.nota_anterior, 94.01905);
  assert.equal(r.nota_nueva, 94.0191);
  const n = db.notas_academicas[0];
  assert.equal(n.nota_final, 94.0191);
  assert.deepEqual(n.detalle_json, desglose(94, 92.0635, 95));          // el desglose no se toca
  const k = db.notas_confirmaciones[0];
  assert.equal(k.estado, 'pendiente'); assert.equal(k.nota_final, 94.0191); assert.equal(k.firma_cursante, null);
  const h = db.notas_correcciones[0];
  assert.equal(h.modo, 'TOTAL'); assert.equal(h.aviso_estado, 'pendiente');
  assert.equal(h.observacion_alumno, 'en la planilla de notas que se publicó es 94,0191');
  assert.deepEqual(JSON.parse(JSON.stringify(h.cambios)), [{ bloque: 'NOTA FINAL', item: 'ajuste a mano (el desglose da 94.01905)', antes: 94.01905, despues: 94.0191 }]);
});

test('más que un ajuste de decimales no se deja: hay que corregir el casillero', async () => {
  const db = fixture(); const call = servidor(db);
  const antes = JSON.stringify(db);
  const r = await call(corregir({ nota_final: 94.5 }));
  assert.equal(r.status, 400);
  assert.match(r.error, /corrija el casillero/);
  assert.equal(JSON.stringify(db), antes);
});

test('la misma nota que ya está cargada no es una corrección', async () => {
  const db = fixture(); const call = servidor(db);
  const r = await call(corregir({ nota_final: 94.01905 }));
  assert.equal(r.status, 400);
  assert.equal(db.notas_correcciones.length, 0);
});

test('casillero + ajuste: se corrige el componente y se redondea la nota que resulta', async () => {
  const db = fixture(); const call = servidor(db);
  const r = await call(corregir({ bloques: desglose(94, 92.0636, 95).bloques, nota_final: 94.0191 }));
  assert.equal(r.ok, true, r.error);
  assert.equal(r.nota_nueva, 94.0191);
  assert.equal(db.notas_academicas[0].detalle_json.bloques[1].items[0].v, 92.0636);
  assert.equal(r.cambios.length, 2);
  assert.deepEqual(r.cambios[1], { bloque: 'NOTA FINAL', item: 'ajuste a mano (el desglose da 94.01908)', antes: 94.01908, despues: 94.0191 });
  // Sin nota_final, el casillero solo mueve la nota con la cuenta de siempre.
  const db2 = fixture(); const r2 = await servidor(db2)(corregir({ bloques: desglose(94, 92.0636, 95).bloques }));
  assert.equal(r2.nota_nueva, 94.01908); assert.equal(r2.cambios.length, 1);
});

test('casillero + nota escrita lejos del desglose nuevo: rechazado', async () => {
  const db = fixture(); const call = servidor(db);
  const r = await call(corregir({ bloques: desglose(94, 95, 95).bloques, nota_final: 94.0191 }));
  assert.equal(r.status, 400);
  assert.equal(db.notas_academicas[0].nota_final, '94.01905');
});

test('una nota sin desglose sigue aceptando cualquier nota final, y el auxiliar no puede corregir', async () => {
  const db = fixture(); const call = servidor(db);
  const r = await call(corregir({ cursante_id: 'C200', nota_final: 91 }));
  assert.equal(r.ok, true, r.error);
  assert.equal(db.notas_academicas[1].nota_final, 91);
  const a = await call(corregir({ token: 'aux', nota_final: 94.0191 }));
  assert.equal(a.status, 403);
});

// ── El modal (index.html) ───────────────────────────────────────────────────
function modal() {
  const html = fs.readFileSync('index.html', 'utf8');
  const codigo = html.slice(html.indexOf('function _ncValor('), html.indexOf('/* ══════════════════════════════════════════════════════════════════════════\n   v2.9.370 — EL AVISO AL QUE LLEVA LA PLANILLA'));
  const els = {};
  const el = (id) => (els[id] = els[id] || { id, value: '', innerHTML: '', style: {}, focus() {}, remove() {} });
  const enviados = [], alertas = [];
  const ctx = {
    NC: {}, document: { getElementById: el }, enviados, alertas, els,
    fmtNota: (x) => (x == null || isNaN(Number(x))) ? '—' : Number(x).toFixed(5),
    escapeHtml: (s) => String(s), escapeAttr: (s) => String(s),
    atributoCalificacion: (n) => n >= 100 ? 'E' : n >= 90 ? 'MB' : n >= 80 ? 'B' : n >= 60 ? 'R' : 'D',
    alert: (m) => alertas.push(m), confirm: () => true,
    _ncInvoke: async (accion, cuerpo) => { enviados.push({ accion, cuerpo }); return { ok: true, nota_anterior: 94.01905, nota_nueva: cuerpo.nota_final, atributo: 'MB', cambios: [] }; },
    cargasData: {}, acadCache: null, verNotaAlumno() {},
  };
  vm.createContext(ctx); vm.runInContext(codigo, ctx);
  const bloques = desglose(94, 92.0635, 95).bloques;
  ctx.NC._corr = { cursanteId: 'C123', gestion: 2026, semestre: 2, ciclo: '1ER CICLO', materia: MAT, nom: 'Aracayo',
    bloques, nota: 94.01905, modo: 'A', nuevos: JSON.parse(JSON.stringify(bloques)), finalTocado: false };
  return ctx;
}

test('modal: muestra la cuenta del promedio y la nota final arranca en lo que da el desglose', () => {
  const c = modal();
  c._ncCorrRefrescar();
  assert.equal(c._ncFormula(c.NC._corr.nuevos, 'A'), '94 × 10% + 92.0635 × 30% + 95 × 60%');
  assert.match(c.els['nc-corr-resumen'].innerHTML, /94\.01905/);
  assert.match(c.els['nc-corr-resumen'].innerHTML, /sin cambios todavía/);
  assert.equal(c.els['nc-corr-final'].value, '94.01905');
  // Un casillero que cambia arrastra la nota final mientras no se la escriba a mano.
  c._ncCorrCambio({ getAttribute: (a) => (a === 'data-b' ? '1' : '0'), value: '92.0636', style: {} });
  assert.equal(c.els['nc-corr-final'].value, '94.01908');
});

test('modal: escribir 94.0191 guarda solo el ajuste de la nota final', async () => {
  const c = modal();
  c._ncCorrRefrescar();
  c.els['nc-corr-final'].value = '94.0191'; c._ncCorrFinalCambio();
  assert.match(c.els['nc-corr-resumen'].innerHTML, /94\.01910/);
  assert.match(c.els['nc-corr-final-aviso'].innerHTML, /Escrita a mano/);
  c.els['nc-corr-motivo'] = { value: 'La planilla publicada redondeó a 4 decimales' };
  await c.ncGuardarCorreccion();
  assert.equal(c.enviados.length, 1, c.alertas.join('\n'));
  const b = c.enviados[0].cuerpo;
  assert.equal(b.nota_final, 94.0191); assert.equal(b.bloques, undefined); assert.equal(b.atributo, 'MB');
});

test('modal: una nota escrita lejos del desglose no se envía', async () => {
  const c = modal();
  c._ncCorrRefrescar();
  c.els['nc-corr-final'].value = '95'; c._ncCorrFinalCambio();
  assert.match(c.els['nc-corr-final-aviso'].innerHTML, /solo se ajustan los decimales/);
  c.els['nc-corr-motivo'] = { value: 'Motivo suficientemente largo' };
  await c.ncGuardarCorreccion();
  assert.equal(c.enviados.length, 0);
  // Escribir lo mismo que da el desglose no es un cambio.
  c.els['nc-corr-final'].value = '94.01905'; c._ncCorrFinalCambio();
  await c.ncGuardarCorreccion();
  assert.equal(c.enviados.length, 0);
  assert.match(c.alertas.at(-1), /No cambiaste/);
});

test('modal: casillero + ajuste viajan juntos', async () => {
  const c = modal();
  c._ncCorrRefrescar();
  c._ncCorrCambio({ getAttribute: (a) => (a === 'data-b' ? '1' : '0'), value: '92.0636', style: {} });
  c.els['nc-corr-final'].value = '94.0191'; c._ncCorrFinalCambio();
  c.els['nc-corr-motivo'] = { value: 'Se corrigió la formativa y se redondeó' };
  await c.ncGuardarCorreccion();
  const b = c.enviados[0].cuerpo;
  assert.equal(b.nota_final, 94.0191);
  assert.equal(b.bloques[1].items[0].v, 92.0636);
});
