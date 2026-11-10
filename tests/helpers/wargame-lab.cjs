// Ejecuta la función real con tablas EN MEMORIA y una sesión inventada.
// No utiliza claves ni conexiones de Supabase.
const fs = require('node:fs'), path = require('node:path');
const ts = require('typescript');
const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));

function laboratorio() {
  const clock = { now: Date.UTC(2026, 10, 10, 1) };
  class LabDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock.now])); }
    static now() { return clock.now; }
  }
  const tables = {
    sesiones: [{ token: 'lab-token', usuario_id: 'LAB', usuario_tabla: 'profesores', expira_en: '2099-01-01', revocado: false }],
    profesores: [{ id: 'LAB', rol: 'profesor', nombre_completo: 'PROFESOR FICTICIO', activo: true }],
    wg_partidas: [{ id: 91, nombre: 'JUEGO FICTICIO', arbitro_id: 'LAB', creada_por: 'LAB', estado: 'planificacion', turno_actual: 0, duracion_turno_horas: 2 }],
    wg_bandos: [{ id: 1, partida_id: 91, bando: 'azul', clave_acceso: 'azul-demo' }, { id: 2, partida_id: 91, bando: 'rojo', clave_acceso: 'rojo-demo' }],
    wg_unidades: [], wg_terreno: [], wg_ordenes: [], wg_detecciones: [], wg_eventos: [], wg_inteligencia: [], wg_replays: [],
  };
  const calls = [];
  const same = (a, b) => a == null && b == null || String(a) === String(b);
  class Query {
    constructor(table) { this.table = table; this.filters = []; this.op = 'select'; this.options = {}; this.start = 0; this.end = Infinity; }
    select(_fields, options) { this.options = options || {}; return this; }
    eq(k, value) { this.filters.push(r => same(r[k], value)); return this; }
    neq(k, value) { this.filters.push(r => !same(r[k], value)); return this; }
    is(k, value) { return this.eq(k, value); }
    not(k, _op, value) { return this.neq(k, value); }
    in(k, values) { this.filters.push(r => values.some(v => same(r[k], v))); return this; }
    like(k, value) { const prefix = value.replace(/\\/g, '').replace(/%$/, ''); this.filters.push(r => String(r[k] || '').startsWith(prefix)); return this; }
    lte(k, value) { this.filters.push(r => r[k] <= value); return this; }
    lt(k, value) { this.filters.push(r => r[k] < value); return this; }
    or(value) {
      const options = value.split(',').map(part => { const [k, op, ...v] = part.split('.'); return { k, op, value: v.join('.') }; });
      this.filters.push(r => options.some(x => x.op === 'is' ? r[x.k] == null : x.op === 'lt' ? r[x.k] < x.value : same(r[x.k], x.value)));
      return this;
    }
    order(k, options = {}) { this.sort = [k, options.ascending !== false]; return this; }
    limit(n) { this.end = n; return this; }
    range(a, b) { this.start = a; this.end = b + 1; return this; }
    insert(values) { this.op = 'insert'; this.values = values; return this; }
    upsert(values, options = {}) { this.op = 'upsert'; this.values = values; this.conflict = options.onConflict || 'id'; return this; }
    update(values) { this.op = 'update'; this.values = values; return this; }
    delete() { this.op = 'delete'; return this; }
    then(resolve, reject) {
      if (!this.result) this.result = Promise.resolve().then(() => this.run());
      return this.result.then(resolve, reject);
    }
    run() {
      const table = tables[this.table] || (tables[this.table] = []);
      let rows = table.filter(r => this.filters.every(f => f(r)));
      const count = rows.length;
      if (this.sort) { const [key, up] = this.sort; rows.sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (up ? 1 : -1)); }
      rows = rows.slice(this.start, this.end);
      calls.push({ table: this.table, op: this.op, values: copy(this.values) });
      if (this.op === 'insert' || this.op === 'upsert') {
        rows = (Array.isArray(this.values) ? this.values : [this.values]).map(value => {
          let row = this.op === 'upsert' ? table.find(r => this.conflict.split(',').every(k => value[k] != null && same(r[k], value[k]))) : null;
          if (row) Object.assign(row, copy(value));
          else {
            row = { id: Math.max(0, ...table.map(r => Number(r.id) || 0)) + 1, creada_en: new LabDate().toISOString(), ...copy(value) };
            if (this.table === 'wg_terreno') row.bando ??= null;
            table.push(row);
          }
          return row;
        });
      } else if (this.op === 'update') rows.forEach(r => Object.assign(r, copy(this.values)));
      else if (this.op === 'delete') tables[this.table] = table.filter(r => !rows.includes(r));
      return { data: this.options.head ? null : copy(rows), count, error: null };
    }
  }
  const client = { from: table => new Query(table) };
  let handler;
  const deno = { env: { get: () => '' }, serve: fn => { handler = fn; } };
  const src = fs.readFileSync(path.join(__dirname, '../../supabase/functions/wargame-ops/index.ts'), 'utf8').replace(/^import .*$/mg, '');
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None } }).outputText;
  const model = new Function('createClient', 'Deno', 'Request', 'Response', 'Date', js + '\nreturn {resolverTeatro,esTeatro,velocidadDe,horaTeatro,relojPublico};')(
    () => client, deno, Request, Response, LabDate);
  return { tables, calls, clock, model, handler,
    async invoke(accion, extra = {}, identity = { token: 'lab-token' }) {
      const response = await handler(new Request('http://laboratorio.invalid/wargame-ops', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion, partida_id: 91, ...identity, ...extra }),
      }));
      return { status: response.status, ...await response.json() };
    },
  };
}
module.exports = { laboratorio };
