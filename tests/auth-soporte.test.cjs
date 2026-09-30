const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const source = stripTypeScriptTypes(fs.readFileSync('supabase/functions/auth-soporte/index.ts', 'utf8').replace(/^import .*;\n/, ''));

function setup(overrides = {}) {
  const session = { usuario_id: 'P030', usuario_ci: '4889191', usuario_tabla: 'profesores', es_master: false, revocado: false, expira_en: new Date(Date.now() + 3600000).toISOString(), ...overrides.session };
  const actor = { id: 'P030', ci: '4889191', activo: true, rol: 'ciencia_tecnologia', password_hash: '$2b$test', ...overrides.actor };
  const target = { id: 'C001', ci: '123456', nombre_completo: 'PRUEBA', activo: true, ...overrides.target };
  const inserts = [], updates = [], queries = [];
  const sb = {
    from(table) {
      const filters = {}, query = { table, action: 'select' }; queries.push(query);
      const q = {
        select(columns, options) { query.columns = columns; query.options = options; return q; },
        eq(key, value) { filters[key] = value; return q; },
        gte() { return q; }, limit() { return q; }, maybeSingle() { return q; },
        insert(row) { query.action = 'insert'; inserts.push({ table, row }); return q; },
        update(row) { query.action = 'update'; updates.push({ table, row }); return q; },
        then(resolve, reject) {
          let result = { data: null, error: null };
          if (query.action === 'insert') result.error = overrides.insertError ? { message: 'failure' } : null;
          else if (query.action === 'update') result.error = overrides.updateError ? {} : null;
          else if (table === 'sesiones') result = { data: overrides.noSession ? null : session, error: overrides.sessionError ? {} : null };
          else if (table === 'auth_intentos') result = { count: overrides.count || 0, error: overrides.rateError ? {} : null };
          else if (table === 'profesores' && filters.id === 'P030') result = { data: overrides.noActor ? null : actor, error: overrides.actorError ? {} : null };
          else result = { data: overrides.targets || [target], error: overrides.targetError ? {} : null };
          return Promise.resolve(result).then(resolve, reject);
        }
      }; return q;
    },
    async rpc(name, args) { assert.equal(name, 'verificar_password'); return { data: overrides.valid ?? (args.p_password === 'correct-test-password'), error: overrides.passwordError ? {} : null }; }
  };
  let handler;
  vm.runInNewContext(source, { createClient: () => sb, Deno: { env: { get: () => '' }, serve: fn => { handler = fn; } }, Response, Request, crypto: require('node:crypto').webcrypto, Date, console });
  const body = { accion: 'abrir', token: 'owner-test-session', tabla: 'cursantes', ci: '123456', password: 'correct-test-password', motivo: 'REVISAR PRESENTACIÓN', ...overrides.body };
  return { async run() { const response = await handler(new Request('https://test.invalid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })); return { status: response.status, data: await response.json() }; }, inserts, updates, queries };
}

test('owner may open support: original actor is audited and target gets a new session', async () => {
  const c = setup(), r = await c.run(); assert.equal(r.status, 200);
  const record = c.inserts.find(i => i.table === 'sesiones').row;
  assert.equal(record.usuario_id, 'C001'); assert.equal(record.soporte_actor_id, 'P030'); assert.equal(record.soporte_actor_ci, '4889191'); assert.equal(record.es_master, false);
  assert.ok(Date.parse(record.expira_en) - Date.now() <= 1800000);
  assert.equal(c.queries.find(q => q.table === 'cursantes').columns.includes('rol'), false);
  assert.equal(JSON.stringify(r.data).includes('password'), false);
});
for (const [name, options, status] of [
  ['wrong owner id', { session: { usuario_id: 'P031' } }, 403],
  ['wrong owner ci', { session: { usuario_ci: '9999999' } }, 403],
  ['student pretending to be owner', { session: { usuario_tabla: 'cursantes' } }, 403],
  ['legacy master session', { session: { es_master: true } }, 403],
  ['support cannot open nested support', { session: { soporte_actor_id: 'P030' } }, 403],
  ['revoked session', { session: { revocado: true } }, 401],
  ['expired session', { session: { expira_en: '2000-01-01' } }, 401],
  ['invalid expiry', { session: { expira_en: 'invalid' } }, 401],
  ['inactive owner', { actor: { activo: false } }, 403],
  ['owner role changed', { actor: { rol: 'profesor' } }, 403],
  ['wrong password', { body: { password: 'wrong' } }, 401],
  ['hash is not a password', { body: { password: '$2b$test' } }, 401],
  ['ci is not a support password', { body: { password: '4889191' } }, 401],
  ['inactive target', { target: { activo: false } }, 409],
  ['duplicate target ci', { targets: [{ id: 'C1' }, { id: 'C2' }] }, 409],
  ['invalid table', { body: { tabla: 'sesiones' } }, 400],
  ['missing reason', { body: { motivo: '' } }, 400],
  ['rate limit', { count: 5 }, 429],
  ['rate check failure fails closed', { rateError: true }, 503],
  ['password check failure fails closed', { passwordError: true }, 503],
  ['session insert failure denies access', { insertError: true }, 503]
]) test(name, async () => { const c = setup(options); assert.equal((await c.run()).status, status); assert.equal(c.inserts.filter(i => i.table === 'sesiones' && !options.insertError).length, 0); });
test('support can revoke itself', async () => { const c = setup({ session: { usuario_id: 'C001', usuario_tabla: 'cursantes', soporte_actor_id: 'P030', soporte_actor_ci: '4889191' }, body: { accion: 'cerrar' } }); assert.equal((await c.run()).status, 200); assert.equal(c.updates[0].row.revocado, true); });
test('ordinary session cannot revoke using support action', async () => { const c = setup({ body: { accion: 'cerrar' } }); assert.equal((await c.run()).status, 403); assert.equal(c.updates.length, 0); });
