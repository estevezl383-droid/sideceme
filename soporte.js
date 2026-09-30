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
  bar.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99990;background:#7f1d1d;color:white;padding:12px;border-radius:10px;max-width:calc(100vw - 32px);box-shadow:0 3px 12px #0006;font:600 13px sans-serif';
  const label = document.createElement('span');
  const button = document.createElement('button');
  button.type = 'button';
  button.style.cssText = 'margin-left:8px;padding:8px;border:0;border-radius:6px;cursor:pointer;font-weight:bold';
  bar.append(label, button); document.body.append(bar);
  const dialog = document.createElement('dialog');
  dialog.style.cssText = 'max-width:420px;width:calc(100% - 40px);border:0;border-radius:12px;padding:24px';
  dialog.innerHTML = '<form><h3>ACCESO DE SOPORTE</h3><p>INGRESARÁS EN OTRA PESTAÑA COMO LA CUENTA SELECCIONADA. EL ACCESO QUEDARÁ REGISTRADO A TU NOMBRE.</p><label>TIPO DE CUENTA<select name="tabla" required style="display:block;width:100%;margin:8px 0 16px"><option value="cursantes">CURSANTE</option><option value="profesores">PERSONAL / PROFESOR</option></select></label><label>CI DE LA CUENTA DESTINO<input name="ci" required maxlength="40" autocomplete="off" style="display:block;width:100%;margin:8px 0 16px"></label><label>MOTIVO<input name="motivo" required minlength="5" maxlength="500" autocomplete="off" style="display:block;width:100%;margin:8px 0 16px"></label><label>TU CONTRASEÑA PERSONAL<input name="password" type="password" required autocomplete="off" style="display:block;width:100%;margin:8px 0 16px"></label><p role="alert" style="color:#991b1b"></p><button type="submit">INGRESAR</button> <button type="button" data-cancel>CANCELAR</button></form>';
  document.body.append(dialog);
  const form = dialog.querySelector('form');
  const errorLabel = form.querySelector('[role="alert"]');
  dialog.querySelector('[data-cancel]').onclick = () => { if (!busy) dialog.close(); };
  dialog.addEventListener('close', () => { form.reset(); errorLabel.textContent = ''; });
  form.onsubmit = async event => {
    event.preventDefault();
    if (busy || !isOwner()) return;
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
  button.onclick = () => { if (state()) finish(); else if (isOwner()) dialog.showModal(); };
  function refresh() {
    const support = state();
    bar.style.display = support || isOwner() ? 'block' : 'none';
    label.textContent = support ? 'SOPORTE: ' + support.nombre + ' — CI ' + support.ci : 'TU CUENTA DE SOPORTE';
    button.textContent = support ? 'SALIR DE SOPORTE' : 'ABRIR SOPORTE';
    if (support && Date.parse(support.expira_en) <= Date.now() && !busy) {
      clearSupport(); currentUser = null; activeRole = null; selectedCargo = null;
      if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
      goHome(); window.close();
    }
  }
  refresh(); setInterval(refresh, 1000);
})();
