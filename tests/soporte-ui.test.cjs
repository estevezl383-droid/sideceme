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
  const results = { children: [], replaceChildren(){ this.children=[]; }, append(n){this.children.push(n);} };
  const searchStatus = {textContent:''}, selectedLabel = {textContent:''};
  const form = { elements: { password: { value: fields.password }, nombre: {value:''}, ci:{value:''}, tabla:{value:'cursantes'} }, querySelector: s => ({'[type="submit"]':submit,'[data-results]':results,'[data-search-status]':searchStatus,'[data-selected]':selectedLabel}[s] || errorLabel), reset() { form.elements.password.value = ''; } };
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
    sb: { functions: { async invoke(name, { body }) { calls.push({ name, body: { ...body } }); if (options.authError && body.accion === 'abrir') return { error: { context: { json: async () => ({ error: 'INCORRECTA' }) } } }; return { data: body.accion === 'cerrar' ? { ok: true } : { ok: true, token: 'target-token', expira_en: new Date(Date.now()+1800000).toISOString(), usuario: { id:'C001',ci:'123456',tabla:'cursantes',nombre_completo:'DESTINO' } } }; } }, from(view) { calls.push({view}); return { order(){return this;}, async range(){return options.searchError ? {error:{}} : {data:[{id:'C001',ci:'123456',nombre_completo:'JOSÉ BARRIENTOS',activo:true},{id:'C002',ci:'654321',nombre_completo:'ANA BARRIENTOS',activo:true},{id:'C003',ci:'999',nombre_completo:'INACTIVO',activo:false}]};}, select() { return this; }, eq() { return this; }, async single() { return options.profileError ? { error: {} } : { data: { id:'C001',ci:'123456',nombre_completo:'DESTINO' } }; } }; } }
  };
  vm.runInNewContext(source, context);
  return { results, searchStatus, selectedLabel, async search(name='JOSE'){ nodes[0].children[1].onclick(); await new Promise(resolve=>setImmediate(resolve)); form.elements.nombre.value=name; form.elements.nombre.oninput(); }, context, bar: nodes[0], button: nodes[0].children[1], form, calls, tabs, tick: () => tick(), originalLogouts: () => originalLogouts, closed: () => closed, async submit() { if (!options.noSelection && !options.support && (options.session || owner).tipo === 'docente') { nodes[0].children[1].onclick(); await new Promise(resolve=>setImmediate(resolve)); form.elements.nombre.value='JOSE'; form.elements.nombre.oninput(); results.children[0]?.onclick(); } await form.onsubmit({ preventDefault() {} }); } };
}
test('owner sees support and normal logout remains unchanged', () => { const c=setup(); assert.equal(c.bar.style.display,'block'); assert.equal(c.button.textContent,'ABRIR SOPORTE'); c.context.logout(); assert.equal(c.originalLogouts(),1); });
test('student does not see the button', () => { const c=setup({session:{tipo:'cursante',user:{id:'C001',ci:'123456'}}}); assert.equal(c.bar.style.display,'none'); });
test('support opens another tab without modifying original session or retaining password', async () => { const c=setup(); await c.submit(); assert.equal(c.context.getTokenSesion(),'owner-token'); const t=c.tabs[0]; assert.equal(t.sessionStorage.getItem('sideceme_token'),'target-token'); assert.equal(t.opener,null); assert.equal(t.href,'https://side.test/index.html'); assert.equal(c.form.elements.password.value,''); assert.equal(JSON.stringify([...t.sessionStorage.data]).includes('own-secret-fixture'),false); });
test('bad password closes blank tab and leaves original session intact', async () => { const c=setup({authError:true}); await c.submit(); assert.equal(c.tabs[0].closed,true); assert.equal(c.context.getTokenSesion(),'owner-token'); assert.equal(c.form.elements.password.value,''); });
test('profile load failure revokes issued session', async () => { const c=setup({profileError:true}); await c.submit(); assert.ok(c.calls.some(x=>x.body?.accion==='cerrar' && x.body.token==='target-token')); assert.equal(c.tabs[0].closed,true); });
test('blocked popup issues no support session', async () => { const c=setup({popupBlocked:true}); await c.submit(); assert.equal(c.calls.filter(x=>x.name).length,0); });
test('support exits by revoking token without invoking ordinary logout', async () => { const c=setup({support:{nombre:'DESTINO',ci:'123456',expira_en:new Date(Date.now()+1800000).toISOString()}}); await c.context.logout(); assert.equal(c.context.getTokenSesion(),null); assert.equal(c.originalLogouts(),0); assert.equal(c.closed(),1); assert.ok(c.calls.some(x=>x.body?.accion==='cerrar')); });
test('expired support clears its session and closes the tab', () => { const c=setup({support:{nombre:'DESTINO',ci:'123456',expira_en:'2000-01-01'}}); assert.equal(c.context.getTokenSesion(),null); assert.equal(c.closed(),1); });

test('name lookup ignores accents and selection sends exact destination CI', async () => { const c=setup(); await c.search('jose'); assert.equal(c.results.children.length,1); assert.match(c.results.children[0].textContent,/JOSÉ BARRIENTOS/); c.results.children[0].onclick(); assert.equal(c.form.elements.ci.value,'123456'); await c.submit(); assert.equal(c.calls.find(x=>x.body?.accion==='abrir').body.ci,'123456'); });
test('same surname shows separate accounts and editing clears selected CI', async () => { const c=setup(); await c.search('barrientos'); assert.equal(c.results.children.length,2); c.results.children[1].onclick(); assert.equal(c.form.elements.ci.value,'654321'); c.form.elements.nombre.value='JOSE'; c.form.elements.nombre.oninput(); assert.equal(c.form.elements.ci.value,''); });
test('unselected name cannot issue a session', async () => { const c=setup({noSelection:true}); await c.submit(); assert.equal(c.tabs.length,0); assert.equal(c.calls.filter(x=>x.name).length,0); });
test('another teacher cannot use support lookup', async () => { const c=setup({session:{tipo:'docente',user:{id:'P031',ci:'123'}}}); c.button.onclick(); assert.equal(c.calls.length,0); assert.equal(c.bar.style.display,'none'); });
test('changing account type clears selection and reloads matching view', async () => { const c=setup(); await c.search(); c.results.children[0].onclick(); c.form.elements.tabla.value='profesores'; await c.form.elements.tabla.onchange(); assert.equal(c.form.elements.ci.value,''); assert.equal(c.calls.at(-1).view,'v_profesores'); });
test('lookup failure creates no support session', async () => { const c=setup({searchError:true,noSelection:true}); await c.search(); await c.submit(); assert.equal(c.tabs.length,0); });
