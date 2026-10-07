/* Acceso de soporte. La autorización efectiva está en auth-soporte. */
(() => {
  'use strict';
  const KEY = 'sideceme_soporte';
  let busy = false;
  const state = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const isOwner = () => { const s = getSession(); return !state() && s?.tipo === 'docente' && s.user?.id === 'P030' && String(s.user?.ci) === '4889191'; };
  const invoke = async body => {
    const { data, error } = await sb.functions.invoke('auth-soporte', { body });
    if (error) {
      let message = 'NO SE PUDO COMPLETAR EL ACCESO DE SOPORTE.';
      try { const detail = await error.context.json(); if (detail.error) message = detail.error; } catch {}
      throw new Error(message);
    }
    if (!data?.ok) throw new Error(data?.error || 'SOLICITUD RECHAZADA.');
    return data;
  };
  const clearSupport = () => {
    ['sideceme_session', 'sideceme_token', 'sideceme_token_expira', KEY].forEach(k => sessionStorage.removeItem(k));
  };
  const originalLogout = logout;
  async function finish() {
    if (busy || !state()) return;
    busy = true;
    try { await invoke({ accion: 'cerrar', token: getTokenSesion() }); }
    catch (e) { busy = false; alert(e.message + '\nVOLVÉ A INTENTAR PARA REVOCAR LA SESIÓN EN EL SERVIDOR.'); return; }
    clearSupport();
    // Do not clear localStorage: this support tab never persisted the target there.
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    currentUser = null; activeRole = null; selectedCargo = null;
    goHome(); window.close(); busy = false; refresh();
  }
  logout = function () { if (state()) return finish(); return originalLogout(); };
  const bar = document.createElement('div');
  bar.id = 'sideceme-soporte-bar';
  bar.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99990;width:40px;height:40px';
  const label = document.createElement('span');
  label.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap';
  const button = document.createElement('button');
  button.type = 'button';
  button.style.cssText = 'width:40px;height:40px;padding:0;border:1px solid #ffffff60;border-radius:7px;background:#7f1d1d;color:white;box-shadow:0 3px 12px #0006;cursor:grab;font-size:22px;touch-action:none;user-select:none';
  bar.append(label, button); document.body.append(bar);
  const POSITION_KEY = 'sideceme_soporte_posicion';
  let position = null, drag = null, suppressClick = false;
  try {
    const saved = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) position = saved;
  } catch {}
  function place(x, y) {
    position = { x: Math.max(0, Math.min(x, Math.max(0, window.innerWidth - 40))), y: Math.max(0, Math.min(y, Math.max(0, window.innerHeight - 40))) };
    bar.style.left = position.x + 'px'; bar.style.top = position.y + 'px';
    bar.style.right = 'auto'; bar.style.bottom = 'auto';
  }
  if (position) place(position.x, position.y);
  window.addEventListener('resize', () => { if (position) place(position.x, position.y); });
  button.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    const rect = bar.getBoundingClientRect();
    suppressClick = false;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, moved: false };
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true; button.style.cursor = 'grabbing';
    place(drag.left + dx, drag.top + dy);
  });
  function endDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    suppressClick = drag.moved;
    if (drag.moved) { try { localStorage.setItem(POSITION_KEY, JSON.stringify(position)); } catch {} }
    drag = null; button.style.cursor = 'grab';
  }
  button.addEventListener('pointerup', endDrag);
  button.addEventListener('pointercancel', endDrag);
  button.addEventListener('lostpointercapture', endDrag);
  const dialog = document.createElement('dialog');
  dialog.style.cssText = 'max-width:420px;width:calc(100% - 40px);border:0;border-radius:12px;padding:24px';
  dialog.innerHTML = '<form><h3>ACCESO DE SOPORTE</h3><p>INGRESARÁS EN OTRA PESTAÑA COMO LA CUENTA SELECCIONADA. EL ACCESO QUEDARÁ REGISTRADO A TU NOMBRE.</p><label>TIPO DE CUENTA<select name="tabla" required style="display:block;width:100%;margin:8px 0 16px"><option value="cursantes">CURSANTE</option><option value="profesores">PERSONAL / PROFESOR</option></select></label><label>NOMBRE DE LA CUENTA DESTINO<input name="nombre" maxlength="120" autocomplete="off" placeholder="ESCRIBÍ NOMBRE O APELLIDO" style="display:block;width:100%;margin:8px 0"></label><p data-search-status aria-live="polite"></p><div data-results style="max-height:210px;overflow:auto"></div><p data-selected aria-live="polite"></p><input name="ci" type="hidden"><label>MOTIVO<input name="motivo" required minlength="5" maxlength="500" autocomplete="off" style="display:block;width:100%;margin:8px 0 16px"></label><label>TU CONTRASEÑA PERSONAL<input name="password" type="password" required autocomplete="off" style="display:block;width:100%;margin:8px 0 16px"></label><p role="alert" style="color:#991b1b"></p><button type="submit">INGRESAR</button> <button type="button" data-cancel>CANCELAR</button></form>';
  document.body.append(dialog);
  const form = dialog.querySelector('form');
  const errorLabel = form.querySelector('[role="alert"]');
  const nameInput = form.elements.nombre;
  const results = form.querySelector('[data-results]');
  const searchStatus = form.querySelector('[data-search-status]');
  const selectedLabel = form.querySelector('[data-selected]');
  let accounts = [], selected = null, loadVersion = 0;
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  function clearSelection() { selected = null; form.elements.ci.value = ''; selectedLabel.textContent = ''; }
  function renderAccounts() {
    results.replaceChildren();
    const terms = normalize(nameInput.value).trim().split(/\s+/).filter(Boolean);
    if (!terms.length) { searchStatus.textContent = 'ESCRIBÍ UN NOMBRE O APELLIDO PARA BUSCAR.'; return; }
    const matches = accounts.filter(a => terms.every(t => normalize(a.nombre_completo).includes(t)));
    searchStatus.textContent = matches.length ? matches.length + ' COINCIDENCIAS. SELECCIONÁ LA CUENTA.' : 'NO SE ENCONTRARON CUENTAS CON ESE NOMBRE.';
    matches.forEach(account => {
      const item = document.createElement('button');
      item.type = 'button';
      item.style.cssText = 'display:block;width:100%;text-align:left;padding:10px;margin:4px 0;cursor:pointer';
      item.textContent = String(account.nombre_completo || '').toUpperCase() + ' — CI ' + account.ci + ' — ' + account.id;
      item.onclick = () => {
        if (busy || !isOwner()) return;
        selected = { ...account, tabla: form.elements.tabla.value };
        form.elements.ci.value = String(account.ci);
        selectedLabel.textContent = 'CUENTA SELECCIONADA: ' + item.textContent;
        errorLabel.textContent = '';
      };
      results.append(item);
    });
  }
  async function loadAccounts() {
    const version = ++loadVersion;
    accounts = []; clearSelection(); results.replaceChildren();
    if (!isOwner()) return;
    searchStatus.textContent = 'CARGANDO CUENTAS…';
    const tabla = form.elements.tabla.value;
    try {
      let rows = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await sb.from(tabla === 'cursantes' ? 'v_cursantes' : 'v_profesores')
          .select('id,ci,nombre_completo,activo').order('id').range(offset, offset + 499);
        if (version !== loadVersion || !isOwner() || !dialog.open) return;
        if (error) throw new Error('NO SE PUDIERON CARGAR LAS CUENTAS. CERRÁ Y VOLVÉ A ABRIR SOPORTE.');
        rows.push(...(data || []));
        if (!data || data.length < 500) break;
      }
      accounts = rows.filter(a => a.activo !== false && a.ci && !(tabla === 'profesores' && a.id === 'P030'));
      renderAccounts();
    } catch (e) { if (version === loadVersion) searchStatus.textContent = e.message; }
  }
  nameInput.oninput = () => { clearSelection(); renderAccounts(); };
  form.elements.tabla.onchange = loadAccounts;
  dialog.querySelector('[data-cancel]').onclick = () => { if (!busy) dialog.close(); };
  dialog.addEventListener('close', () => { ++loadVersion; accounts = []; clearSelection(); results.replaceChildren(); form.reset(); errorLabel.textContent = ''; searchStatus.textContent = ''; });
  form.onsubmit = async event => {
    event.preventDefault();
    if (busy || !isOwner()) return;
    if (!selected || selected.tabla !== form.elements.tabla.value || String(selected.ci) !== form.elements.ci.value) { errorLabel.textContent = 'BUSCÁ POR NOMBRE Y SELECCIONÁ UNA CUENTA DE LA LISTA.'; return; }
    // Open synchronously so browsers do not block the new tab after authentication.
    const tab = window.open('about:blank', '_blank');
    if (!tab) { errorLabel.textContent = 'PERMITÍ ABRIR UNA NUEVA PESTAÑA PARA EL SOPORTE.'; return; }
    tab.document.body.textContent = 'VERIFICANDO ACCESO DE SOPORTE…';
    busy = true; form.querySelector('[type="submit"]').disabled = true; errorLabel.textContent = '';
    let issued = null;
    try {
      const fields = new FormData(form);
      const body = { accion: 'abrir', token: getTokenSesion(), tabla: fields.get('tabla'), ci: String(fields.get('ci')).trim(), motivo: fields.get('motivo'), password: fields.get('password') };
      issued = await invoke(body);
      form.elements.password.value = ''; body.password = ''; fields.delete('password');
      const view = issued.usuario.tabla === 'cursantes' ? 'v_cursantes' : 'v_profesores';
      const { data: profile, error } = await sb.from(view).select('*').eq('id', issued.usuario.id).single();
      if (error || !profile) throw new Error('NO SE PUDO CARGAR EL PERFIL DESTINO.');
      if (tab.closed) throw new Error('LA PESTAÑA DE SOPORTE FUE CERRADA.');
      const tipo = issued.usuario.tabla === 'cursantes' ? 'cursante' : 'docente';
      const role = tipo === 'docente' ? (MAPA_ROL_BACKEND_A_CARGO[issued.usuario.rol] || issued.usuario.rol) : null;
      if (tipo === 'docente' && !CARGOS[role]) throw new Error('EL CARGO DESTINO NO TIENE UN PANEL COMPATIBLE.');
      tab.sessionStorage.setItem('sideceme_session', JSON.stringify({ user: profile, tipo, role }));
      tab.sessionStorage.setItem('sideceme_token', issued.token);
      tab.sessionStorage.setItem('sideceme_token_expira', issued.expira_en);
      tab.sessionStorage.setItem(KEY, JSON.stringify({ nombre: issued.usuario.nombre_completo, ci: issued.usuario.ci, expira_en: issued.expira_en }));
      tab.opener = null;
      const targetURL = new URL(location.href); targetURL.search = ''; targetURL.hash = '';
      tab.location.replace(targetURL.href);
      issued = null; dialog.close();
    } catch (e) {
      if (issued) { try { await invoke({ accion: 'cerrar', token: issued.token }); } catch { alert('NO SE PUDO REVOCAR EL ACCESO EMITIDO. REVISÁ LA SESIÓN DE SOPORTE EN SUPABASE.'); } }
      tab.close(); errorLabel.textContent = e.message;
    } finally { form.elements.password.value = ''; busy = false; form.querySelector('[type="submit"]').disabled = false; }
  };
  button.onclick = event => { if (suppressClick && event?.detail !== 0) { suppressClick = false; return; } if (state()) finish(); else if (isOwner()) { dialog.showModal(); loadAccounts(); } };
  function refresh() {
    const support = state();
    bar.style.display = support || isOwner() ? 'block' : 'none';
    label.textContent = support ? 'SOPORTE: ' + support.nombre + ' — CI ' + support.ci : 'TU CUENTA DE SOPORTE';
    button.textContent = support ? '↩' : '🛠';
    const hint = (support ? label.textContent + ' — SALIR DE SOPORTE' : 'ABRIR TU CUENTA DE SOPORTE') + '. ARRASTRÁ PARA MOVER.';
    button.title = hint; button.setAttribute('aria-label', hint);
    if (support && Date.parse(support.expira_en) <= Date.now() && !busy) {
      clearSupport(); currentUser = null; activeRole = null; selectedCargo = null;
      if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
      goHome(); window.close();
    }
  }
  refresh(); setInterval(refresh, 1000);
})();

// Carga aislada del piloto EFM. El acceso se valida también en el servidor.
(()=>{if(document.getElementById?.('efmc-launcher'))return;const s=document.createElement('script');s.id='efmc-launcher';s.src='efm-campo/launcher.js?v=7';document.body.append(s);})();
