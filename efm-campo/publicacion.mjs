import {esc} from './conformidad.mjs?v=22';
export function abrirPublicacion({invoke,plan,onSaved,authorized=()=>true}){
 const dialog=document.createElement('dialog');dialog.className='efmc-dialog';
 const sem=Number(plan.fecha.slice(5,7))>6?2:1;
 dialog.innerHTML=`<h2>Cerrar y publicar diagnóstica</h2><p>${esc(plan.nombre)} · ${esc(plan.ciclo)} · ${esc(plan.fecha)}</p><p>Las notas aparecerán en la cuenta de cada alumno para su reconocimiento o reclamo. Esta evaluación no promedia. El cierre impide registrar nuevas marcas en este ciclo.</p><label>Semestre del año<select data-periodo><option value="1" ${sem===1?'selected':''}>Primero</option><option value="2" ${sem===2?'selected':''}>Segundo</option></select></label><button data-revisar>Revisar notas antes de publicar</button><div data-resumen role="status"></div><button data-publicar disabled>CERRAR Y PUBLICAR EN LAS CUENTAS</button><button data-salir>VOLVER</button>`;
 document.body.append(dialog);dialog.showModal();
 const guard=setInterval(()=>{if(!dialog.isConnected||!authorized()||!document.getElementById('efmc')){dialog.remove();clearInterval(guard);}},500);
 const period=dialog.querySelector('[data-periodo]'),review=dialog.querySelector('[data-revisar]'),publish=dialog.querySelector('[data-publicar]'),out=dialog.querySelector('[data-resumen]');let preview=null,busy=false;
 const active=()=>dialog.isConnected&&authorized();
 dialog.querySelector('[data-salir]').onclick=()=>{if(!busy)dialog.remove();};
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();else dialog.remove();});
 period.onchange=()=>{preview=null;publish.disabled=true;out.textContent='Revisá nuevamente el período seleccionado.';};
 async function request(publicar){
  if(busy||!active())return;busy=true;review.disabled=publish.disabled=period.disabled=true;
  try{
   const r=await invoke({accion:publicar?'publicar_diagnostica':'preparar_publicacion',organizacion_id:plan.id,version:plan.version,semestre:Number(period.value),huella:preview?.huella});
   if(!active())return;
   if(publicar||r.publicada){out.textContent=`EVALUACIÓN CERRADA Y PUBLICADA · ${r.alumnos} alumnos. Los alumnos ya pueden revisar sus notas y dar su conformidad.`;preview=null;review.hidden=publish.hidden=period.hidden=true;await onSaved();return;}
   preview=r;out.innerHTML=`<p><b>${r.alumnos} alumnos · ${r.completos} con notas completas</b></p><p>${esc(r.periodo)} · DIAGNÓSTICA · NO PROMEDIA</p>${r.reemplazos?`<p>Se actualizarán ${r.reemplazos} notas anteriores de este período. Sus notas y firmas quedarán en el historial; se pedirá una nueva conformidad.</p>`:''}${r.notas?.length?`<ul>${r.notas.map(x=>`<li>${esc(x.nombre)}: ${esc(x.nota)} / 100</li>`).join('')}</ul>`:''}${r.bloqueos.length?`<p>Antes de cerrar:</p><ul>${r.bloqueos.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>Todo listo. Se conservará el historial y se solicitará el reconocimiento de la nota final a cada alumno.</p>'}`;
  }catch(e){preview=null;if(active())out.textContent=e.message;}
  finally{busy=false;if(active()){review.disabled=period.disabled=false;publish.disabled=!preview||preview.bloqueos.length>0;}}
 }
 review.onclick=()=>request(false);publish.onclick=()=>request(true);
}
