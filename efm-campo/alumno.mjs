import {esc,estaciones,vigente,fichaRegistro,fechaHora} from './conformidad.mjs?v=13';
export async function abrir({invoke,onClose,evaluacionId='',authorized=()=>true}){
 document.getElementById('efmc')?.remove();
 const root=document.createElement('div');root.id='efmc';document.body.append(root);
 let alive=true,loading=false,confirming=false,data=null,selected=evaluacionId,error='',actionError='',lastSync='',signature='';
 const close=()=>{if(!alive)return;alive=false;clearInterval(poll);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);root.remove();data=null;onClose();};
 function render(){
  if(!alive)return;
  const plan=data?.organizaciones.find(p=>p.id===selected),records=(data?.registros||[]).filter(r=>r.organizacion_id===selected),student=data?.alumno;
  root.innerHTML=`<div class="efmc-shell"><header><div><small>SIDECEME · MI CUENTA</small><h1>📁 Evaluación física</h1></div><button data-close>Cerrar</button></header><p>${esc(student?.nombre_completo||'')}</p>${data?.solo_lectura?'<p class="efmc-banner" role="note">VISTA DE SOPORTE · SÓLO CONSULTA. La conformidad debe darla el alumno desde su cuenta personal.</p>':'<p>Revisa tu marca y tu nota antes de dar conformidad. Rojo: pendiente. Verde: confirmado por ti.</p>'}<p role="status" class="efmc-sync">${esc(actionError||error||(!lastSync?'Cargando evaluaciones…':'Actualización automática · última sincronización '+fechaHora(lastSync)))}</p><div class="efmc-evaluaciones">${(data?.organizaciones||[]).map(p=>`<button data-plan="${p.id}" class="${selected===p.id?'chosen':''}">📁 ${esc(p.nombre)}<small>${esc(p.fecha.split('-').reverse().join('/'))} · ${esc(p.ciclo)}</small></button>`).join('')}</div>${plan?`<h2>${esc(plan.nombre)}</h2><p>${esc(plan.ciclo)} · ${esc(plan.fecha.split('-').reverse().join('/'))}</p><div class="efmc-records">${Object.entries(estaciones).filter(([p])=>p!=='barras'||records.some(r=>r.prueba===p)).map(([p,n])=>{const r=vigente(records,student.id,p);return r?fichaRegistro(r,{confirmar:!data.solo_lectura}):`<article class="efmc-record sin-registro"><h3>${esc(n)}</h3><p>Sin registro. Aparecerá aquí cuando el evaluador lo guarde.</p></article>`;}).join('')}</div>`:data?'<p>Todavía no tienes evaluaciones físicas habilitadas.</p>':''}<footer>La conformidad queda guardada con fecha y hora. Una corrección del evaluador requiere una nueva conformidad.<br>Mantén esta ventana abierta durante la evaluación. Sincronización automática cada 2 segundos.</footer></div>`;
  root.querySelector('[data-close]').onclick=close;
  root.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>{selected=b.dataset.plan;render();});
  root.querySelectorAll('[data-confirm]').forEach(b=>{b.disabled=confirming;b.onclick=async()=>{
   if(confirming||data?.solo_lectura||!authorized())return;confirming=true;error='';actionError='';render();
   try{const r=await invoke({accion:'confirmar',registro_id:b.dataset.confirm});if(!alive||!authorized())return;const row=data.registros.find(x=>x.id===b.dataset.confirm);if(row)row.conformidad=r.conformidad;signature='';}
   catch(e){actionError=e.message;signature='';}finally{confirming=false;if(alive){render();await refresh();}}
  };});
 }
 async function refresh(){
  if(!authorized()){close();return;}if(loading||confirming||!alive||document.hidden)return;
  loading=true;
  try{const r=await invoke({accion:'mis_evaluaciones'});if(!alive||!authorized()){close();return;}
   const next=JSON.stringify([r.solo_lectura,r.organizaciones,r.registros]);data=r;lastSync=r.servidor_en||new Date().toISOString();
   if(!data.organizaciones.some(p=>p.id===selected))selected=data.organizaciones[0]?.id||'';
   if(signature!==next||error){signature=next;error='';const focused=root.querySelector('[data-confirm]:focus')?.dataset.confirm;render();if(focused)root.querySelector(`[data-confirm="${focused}"]`)?.focus();}
   else{const s=root.querySelector('.efmc-sync');if(s)s.textContent='Actualización automática · última sincronización '+fechaHora(lastSync);}
  }catch(e){if(alive){error='No se pudo sincronizar. '+e.message+' Los datos visibles corresponden a la última consulta.';render();}}finally{loading=false;}
 }
 const poll=setInterval(refresh,2000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
 render();await refresh();
}
