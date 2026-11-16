// Pantalla independiente de las cuentas de cursantes.
export function gestionarCuentas({app,panel,api,h,modal,content,dialog,formHandler,message,volver}) {
 if(!panel.admin||panel.actor!=='P030'||!panel.permisos.administrar)throw new Error('Acceso reservado al administrador.');
 let personas=panel.postulantes;
 app.innerHTML=`<div class="intro"><div><div class="eyebrow">SIDECEME · Administración</div><h1>Gestionar postulantes</h1><p class="muted">Restablecimiento de contraseñas de postulantes ECEME 2027.</p></div><button id="volver-nomina">← Relación nominal</button></div><section class="card"><p>Busque al postulante y verifique su identidad antes de restablecer su contraseña. Ingresará con su CI sin extensión y deberá crear una nueva contraseña.</p><div class="toolbar"><input id="buscar-cuentas" type="search" placeholder="Buscar por nombre o CI" aria-label="Buscar por nombre o CI"><button id="actualizar-cuentas">Actualizar</button></div><p id="total-cuentas" class="field-note"></p><div class="scroll"><table><thead><tr><th>Postulante</th><th>CI</th><th>Estado</th><th>Contraseña</th></tr></thead><tbody id="lista-cuentas"></tbody></table></div><p id="vacio-cuentas" hidden>No hay postulantes que coincidan con la búsqueda.</p></section>`;
 const normalize=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 function render(){
  const q=normalize(app.querySelector('#buscar-cuentas').value),rows=personas.filter(p=>normalize(p.nombre_completo+' '+p.ci).includes(q));
  app.querySelector('#total-cuentas').textContent=`${rows.length} de ${personas.length} postulantes`;
  app.querySelector('#vacio-cuentas').hidden=rows.length>0;
  app.querySelector('#lista-cuentas').innerHTML=rows.map(p=>`<tr><td>${h(p.grado)} ${h(p.nombre_completo)}</td><td>${h(p.ci)}</td><td>${!p.identidad_verificada?'Identidad por verificar':p.habilitado?'Habilitado':'Deshabilitado'}</td><td><button data-reset="${h(p.id)}" ${p.habilitado&&p.identidad_verificada?'':'disabled'}>🔑 RESET</button></td></tr>`).join('');
  app.querySelectorAll('[data-reset]').forEach(b=>b.onclick=()=>reset(personas.find(p=>p.id===b.dataset.reset)));
 }
 function reset(p){
  modal(`<h2>Restablecer contraseña</h2><p><b>${h(p.nombre_completo)}</b><br>CI: ${h(p.ci)}</p><p>Se cerrarán sus sesiones anteriores y la contraseña volverá a ser su CI sin extensión. Sus evaluaciones y documentos se conservarán.</p><form><label>Motivo<input name="motivo" required minlength="5" maxlength="500" value="Contraseña olvidada por el postulante"></label><label><input name="confirmar" type="checkbox" required>Verifiqué la identidad y confirmo el restablecimiento de esta cuenta.</label><p class="error-text" role="alert"></p><button class="primary" type="submit">Confirmar restablecimiento</button></form>`);
  formHandler(content.querySelector('form'),async f=>{
   const r=await api('restablecer_clave',{postulante_id:p.id,revision:p.revision,motivo:f.get('motivo'),confirmacion:'RESTABLECER'});
   p.revision=r.revision;
   content.innerHTML=`<h2>Contraseña restablecida</h2><p><b>${h(p.nombre_completo)}</b><br>Usuario (CI): ${h(p.ci)}</p><label>Contraseña inicial (CI sin extensión)<input id="clave-temporal" readonly value="${h(r.clave_temporal)}" autocomplete="off"></label><p>Entréguele esta clave al postulante. El sistema le pedirá cambiarla al ingresar. La clave solo se muestra aquí y no podrá consultarse después de cerrar.</p><button id="copiar-clave">Copiar CI</button> <button id="cerrar-resultado">Listo</button><p id="estado-copia" role="status"></p>`;
   content.querySelector('#copiar-clave').onclick=async()=>{try{await navigator.clipboard.writeText(r.clave_temporal);content.querySelector('#estado-copia').textContent='Clave copiada.';}catch{content.querySelector('#clave-temporal').select();content.querySelector('#estado-copia').textContent='Seleccione y copie la clave manualmente.';}};
   content.querySelector('#cerrar-resultado').onclick=()=>dialog.close();
   dialog.addEventListener('close',()=>{content.innerHTML='';},{once:true});
  });
 }
 app.querySelector('#buscar-cuentas').oninput=render;
 app.querySelector('#volver-nomina').onclick=volver;
 app.querySelector('#actualizar-cuentas').onclick=async event=>{const b=event.currentTarget;b.disabled=true;try{const fresh=await api('panel');if(!fresh.admin||fresh.actor!=='P030'||!fresh.permisos.administrar)throw new Error('Sesión sin permiso. Vuelva a ingresar.');personas=fresh.postulantes;panel.postulantes=personas;render();}catch(e){message(e.message);}finally{b.disabled=false;}};
 render();
}
