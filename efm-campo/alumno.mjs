import {esc,estaciones,vigente,fichaRegistro,botonConformidad,fechaHora} from './conformidad.mjs?v=18';
export async function abrir({invoke,onClose,evaluacionId='',authorized=()=>true}){
 document.getElementById('efmc')?.remove();
 const root=document.createElement('div');root.id='efmc';document.body.append(root);
 let alive=true,loading=false,confirming=false,data=null,selected=evaluacionId,error='',actionError='',lastSync='',signature='';
 let actionVersion=0,refreshAgain=false,manualRefresh=false,downloading=false;
 const close=()=>{if(!alive)return;alive=false;clearInterval(poll);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('online',refresh);root.remove();data=null;onClose();};
 function render(){
  if(!alive)return;
  const plan=data?.organizaciones.find(p=>p.id===selected),records=(data?.registros||[]).filter(r=>r.organizacion_id===selected),student=data?.alumno;
  root.innerHTML=`<div class="efmc-shell"><header><div><small>SIDECEME · MI CUENTA</small><h1>📁 Evaluación física</h1></div><div class="efmc-student-tools"><button type="button" data-refresh>↻ Actualizar notas</button><button data-close>Cerrar</button></div></header><p>${esc(student?.nombre_completo||'')}</p>${data?.solo_lectura?'<p class="efmc-banner" role="note">VISTA DE SOPORTE · SÓLO CONSULTA. La conformidad debe darla el alumno desde su cuenta personal.</p>':'<p>Revisa tu marca y tu nota antes de dar conformidad. Rojo: pendiente. Verde: confirmado por ti.</p>'}<p role="status" class="efmc-sync">${esc(actionError||error||(!lastSync?'Cargando evaluaciones…':'Actualización automática · última sincronización '+fechaHora(lastSync)))}</p><div class="efmc-evaluaciones">${(data?.organizaciones||[]).map(p=>`<button data-plan="${p.id}" class="${selected===p.id?'chosen':''}">📁 ${esc(p.nombre)}<small>${esc(p.fecha.split('-').reverse().join('/'))} · ${esc(p.ciclo)}</small></button>`).join('')}</div>${plan?`<h2>${esc(plan.nombre)}</h2><p>${esc(plan.ciclo)} · ${esc(plan.fecha.split('-').reverse().join('/'))}</p><div class="efmc-records">${Object.entries(estaciones).filter(([p])=>p!=='barras'||records.some(r=>r.prueba===p)).map(([p,n])=>{const r=vigente(records,student.id,p);return r?fichaRegistro(r,{mostrarBoton:true,soloLectura:data.solo_lectura}):`<article class="efmc-record sin-registro"><h3>${esc(n)}</h3><p>Sin registro. Aparecerá aquí cuando el evaluador lo guarde.</p>${botonConformidad(null,p,{soloLectura:data.solo_lectura})}</article>`;}).join('')}</div>`:data?'<p>Todavía no tienes evaluaciones físicas habilitadas.</p>':''}<footer>La conformidad queda guardada con fecha y hora. Una corrección del evaluador requiere una nueva conformidad.<br>Mantén esta ventana abierta durante la evaluación. Actualización automática cada segundo. Cada prueba se habilita al guardarse su registro, sin esperar a las demás.</footer></div>`;
  root.querySelector('[data-close]').onclick=close;
  const refreshButton=root.querySelector('[data-refresh]');refreshButton.onclick=()=>refresh({manual:true});estadoRefresh();
  root.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>{selected=b.dataset.plan;render();});
  if(plan){
   const box=document.createElement('div');box.className='efmc-pdf';
   box.innerHTML=`<button type="button" data-pdf ${downloading||data.solo_lectura?'disabled':''} aria-busy="${downloading}">${downloading?'Preparando PDF…':'Descargar mi hoja individual (PDF)'}</button><small>${data.solo_lectura?'La descarga está disponible desde la cuenta personal del alumno.':'Incluye un QR para verificar su autenticidad. Si faltan pruebas o conformidades, la hoja indicará que es parcial.'}</small>`;
   root.querySelector('.efmc-records').before(box);box.querySelector('[data-pdf]').onclick=downloadPDF;
  }
  root.querySelectorAll('[data-confirm]').forEach(b=>{b.disabled=confirming;b.onclick=async()=>{
   if(confirming||data?.solo_lectura||!authorized())return;actionVersion++;confirming=true;error='';actionError='';render();
   try{const r=await invoke({accion:'confirmar',registro_id:b.dataset.confirm});if(!alive||!authorized())return;const row=data.registros.find(x=>x.id===b.dataset.confirm);if(row)row.conformidad=r.conformidad;signature='';}
   catch(e){actionError=e.message;signature='';}finally{confirming=false;if(alive){render();await refresh({manual:true});}}
  };});
 }
 async function downloadPDF(){
  if(downloading||data?.solo_lectura||!selected||!authorized())return;
  const organizacion_id=selected;downloading=true;actionError='';render();
  try{
   const r=await invoke({accion:'hoja_pdf',organizacion_id,formato:'pdf'});if(!alive||!authorized())return;
   const a=r.archivo;if(a?.mime!=='application/pdf'||!a.nombre?.endsWith('.pdf')||!a.base64||!/^[a-f0-9]{64}$/.test(a.sha256))throw Error('No se recibió un PDF válido. Volvé a intentarlo.');
   const bytes=Uint8Array.from(atob(a.base64),c=>c.charCodeAt(0)),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
   if(hash!==a.sha256)throw Error('No se pudo comprobar el PDF recibido. Volvé a descargarlo.');
   if(!alive||!authorized())return;
   const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),link=document.createElement('a');link.href=url;link.download=a.nombre;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){actionError='No se pudo descargar la hoja. '+e.message;}finally{downloading=false;if(alive)render();}
 }
 function estadoRefresh(){const b=root.querySelector('[data-refresh]');if(b){b.disabled=manualRefresh||confirming;b.textContent=manualRefresh?'Consultando notas…':'↻ Actualizar notas';b.setAttribute('aria-busy',String(manualRefresh));}}
 async function refresh(options={}){
  if(!authorized()){close();return;}if(!alive||(document.hidden&&!options.manual))return;if(loading||confirming){if(options.manual){refreshAgain=true;manualRefresh=true;estadoRefresh();}return;}
  loading=true;refreshAgain=false;manualRefresh=!!options.manual||!data;const version=actionVersion;
  estadoRefresh();
  try{const r=await invoke({accion:'mis_evaluaciones'});if(!alive||!authorized()){close();return;}if(confirming||version!==actionVersion){refreshAgain=true;return;}
   const next=JSON.stringify([r.solo_lectura,r.organizaciones,r.registros]);data=r;lastSync=r.servidor_en||new Date().toISOString();
   if(!data.organizaciones.some(p=>p.id===selected))selected=data.organizaciones[0]?.id||'';
   if(signature!==next||error){signature=next;error='';const focused=root.querySelector('[data-confirm]:focus')?.dataset.confirm;render();if(focused)root.querySelector(`[data-confirm="${focused}"]`)?.focus();}
   else{const s=root.querySelector('.efmc-sync');if(s)s.textContent=actionError||'Actualización automática · última sincronización '+fechaHora(lastSync);}
  }catch(e){if(alive){error='No se pudo sincronizar. '+e.message+' Los datos visibles corresponden a la última consulta.';render();}}finally{loading=false;const again=refreshAgain&&alive&&!confirming;if(!again)manualRefresh=false;estadoRefresh();if(again)Promise.resolve().then(()=>refresh({manual:true}));}
 }
 const poll=setInterval(refresh,1000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);window.addEventListener('online',refresh);
 render();await refresh();
}
