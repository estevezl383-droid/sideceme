const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('soporte.js', 'utf8');
const storage = entries => { const m = new Map(Object.entries(entries || {})); return { getItem: k => m.get(k) ?? null, setItem: (k,v) => m.set(k,String(v)), removeItem: k => m.delete(k), data: m }; };
function setup(options = {}) {
  const owner = { tipo: 'docente', user: { id: 'P030', ci: '4889191' } };
  const sessionStorage = storage({ sideceme_session: JSON.stringify(options.session || owner), sideceme_token: 'owner-token' });
  if (options.support) sessionStorage.setItem('sideceme_soporte', JSON.stringify(options.support));
  const calls = [], nodes = [], dialogs = [], tabs = [];
  let tick, originalLogouts = 0, closed = 0;
  const fields = { tabla: 'cursantes', ci: '123456', motivo: 'REVISAR PERFIL', password: 'own-secret-fixture' };
  const submit = { disabled: false }, errorLabel = { textContent: '' };
  const form = { elements: { password: { value: fields.password } }, querySelector: s => s === '[type="submit"]' ? submit : errorLabel, reset() { form.elements.password.value = ''; } };
  const document = { body: { append: n => nodes.push(n) }, createElement(tag) {
    const el = { style: {}, textContent: '', children: [], append(...args) { this.children.push(...args); }, querySelector(selector) { if (selector === 'form') return form; return {}; }, addEventListener(type, callback) { this[type] = callback; }, showModal() { this.open = true; }, close() { this.open = false; this['closeEvent']?.(); } };
    if (tag === 'dialog') { dialogs.push(el); el.addEventListener = (t,fn) => { el[t+'Event']=fn; }; }
    return el;
  } };
  const context = { document, sessionStorage, getSession: () => JSON.parse(sessionStorage.getItem('sideceme_session') || 'null'), getTokenSesion: () => sessionStorage.getItem('sideceme_token'), logout: () => originalLogouts++, currentUser: owner.user, activeRole: 'ciencia_tecnologia', selectedCargo: null, idleTimer: null, clearTimeout, location: { href: 'https://side.test/index.html?firma=bad#hash' }, URL, Date, JSON,
    alert: message => calls.push({ alert: message }), goHome: () => calls.push({ home: true }), setInterval: fn => { tick = fn; },
    MAPA_ROL_BACKEND_A_CARGO: { profesor: 'profesor' }, CARGOS: { profesor: {}, ciencia_tecnologia: {} },
    FormData: class { constructor() { this.fields = new Map(Object.entries(fields)); } get(k) { return this.fields.get(k); } delete(k) { this.fields.delete(k); } },
    window: { close: () => closed++, open() { if (options.popupBlocked) return null; const tab = { document: { body: {} }, sessionStorage: storage(), closed: false, opener: {}, close() { this.closed = true; }, location: { replace: href => { tab.href=href; } } }; tabs.push(tab); return tab; } },
    sb: { functions: { async invoke(name, { body }) { calls.push({ name, body: { ...body } }); if (options.authError && body.accion === 'abrir') return { error: { context: { json: async () => ({ error: 'INCORRECTA' }) } } }; return { data: body.accion === 'cerrar' ? { ok: true } : { ok: true, token: 'target-token', expira_en: new Date(Date.now()+1800000).toISOString(), usuario: { id:'C001',ci:'123456',tabla:'cursantes',nombre_completo:'DESTINO' } } }; } }, from() { return { select() { return this; }, eq() { return this; }, async single() { return options.profileError ? { error: {} } : { data: { id:'C001',ci:'123456',nombre_completo:'DESTINO' } }; } }; } }
  };
  vm.runInNewContext(source, context);
  return { context, bar: nodes[0], button: nodes[0].children[1], form, calls, tabs, tick: () => tick(), originalLogouts: () => originalLogouts, closed: () => closed, async submit() { await form.onsubmit({ preventDefault() {} }); } };
}
test('owner sees support and normal logout remains unchanged', () => { const c=setup(); assert.equal(c.bar.style.display,'block'); assert.equal(c.button.textContent,'ABRIR SOPORTE'); c.context.logout(); assert.equal(c.originalLogouts(),1); });
test('student does not see the button', () => { const c=setup({session:{tipo:'cursante',user:{id:'C001',ci:'123456'}}}); assert.equal(c.bar.style.display,'none'); });
test('support opens another tab without modifying original session or retaining password', async () => { const c=setup(); await c.submit(); assert.equal(c.context.getTokenSesion(),'owner-token'); const t=c.tabs[0]; assert.equal(t.sessionStorage.getItem('sideceme_token'),'target-token'); assert.equal(t.opener,null); assert.equal(t.href,'https://side.test/index.html'); assert.equal(c.form.elements.password.value,''); assert.equal(JSON.stringify([...t.sessionStorage.data]).includes('own-secret-fixture'),false); });
test('bad password closes blank tab and leaves original session intact', async () => { const c=setup({authError:true}); await c.submit(); assert.equal(c.tabs[0].closed,true); assert.equal(c.context.getTokenSesion(),'owner-token'); assert.equal(c.form.elements.password.value,''); });
test('profile load failure revokes issued session', async () => { const c=setup({profileError:true}); await c.submit(); assert.ok(c.calls.some(x=>x.body?.accion==='cerrar' && x.body.token==='target-token')); assert.equal(c.tabs[0].closed,true); });
test('blocked popup issues no support session', async () => { const c=setup({popupBlocked:true}); await c.submit(); assert.equal(c.calls.length,0); });
test('support exits by revoking token without invoking ordinary logout', async () => { const c=setup({support:{nombre:'DESTINO',ci:'123456',expira_en:new Date(Date.now()+1800000).toISOString()}}); await c.context.logout(); assert.equal(c.context.getTokenSesion(),null); assert.equal(c.originalLogouts(),0); assert.equal(c.closed(),1); assert.ok(c.calls.some(x=>x.body?.accion==='cerrar')); });
test('expired support clears its session and closes the tab', () => { const c=setup({support:{nombre:'DESTINO',ci:'123456',expira_en:'2000-01-01'}}); assert.equal(c.context.getTokenSesion(),null); assert.equal(c.closed(),1); });
