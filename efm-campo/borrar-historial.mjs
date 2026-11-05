import {esc,fechaHora} from './conformidad.mjs?v=22';
const dia=f=>String(f||'').split('-').reverse().join('/');
export function abrirBorrado({host,invoke,sesion,authorized=()=>true,onClose=()=>{},onDeleted=()=>{}}){
 if(!['PRUEBA','PILOTO'].includes(sesion.modo))return;
 const dialog=document.createElement('dialog');dialog.className='efmc-delete-dialog';host.append(dialog);
 let alive=true,busy=false,error='',motivo='',confirmacion='',solicitud=null,id=crypto.randomUUID();
 const close=()=>{if(!alive||busy)return;alive=false;dialog.close();dialog.remove();onClose();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 function render(){
  if(!alive||!authorized())return;
  const snapshot=solicitud?.resumen||sesion;
  dialog.innerHTML=`<form><h2>${solicitud?'2 / 2 · CONFIRMAR BORRADO':'1 / 2 · BORRAR SESIÓN DE PRUEBA'}</h2><h3>${esc(snapshot.nombre)}</h3><p>${dia(sesion.fecha)} · ${esc(sesion.ciclo)}<br>${esc(snapshot.alumnos)} CURSANTES · ${esc(snapshot.registros)} PRUEBAS · ${esc(snapshot.revisiones??sesion.revisiones)} REGISTROS CON CORRECCIONES</p><p>La sesión saldrá de la lista activa. Quedará constancia del responsable, la fecha y el motivo, con sus registros conservados para auditoría.</p>${solicitud?`<p><b>MOTIVO:</b> ${esc(motivo)}</p><p>Responsable: ${esc(solicitud.actor_nombre)}<br>Solicitud válida hasta ${esc(fechaHora(solicitud.expira_en))}</p><label>ESCRIBÍ BORRAR PARA CONFIRMAR<input data-delete-text autocomplete="off" value="${esc(confirmacion)}" ${busy?'disabled':''}></label>`:`<label>MOTIVO DEL BORRADO<textarea data-delete-reason required minlength="10" maxlength="600" rows="4" ${busy?'disabled':''}>${esc(motivo)}</textarea></label>`}<p role="status" class="efmc-message">${esc(error||(busy?'PROCESANDO…':''))}</p><div class="efmc-delete-actions"><button type="button" data-delete-cancel ${busy?'disabled':''}>CANCELAR</button>${solicitud?`<button type="button" data-delete-back ${busy?'disabled':''}>VOLVER</button>`:''}<button type="submit" data-delete-submit ${busy||(solicitud&&confirmacion.trim()!=='BORRAR')?'disabled':''}>${solicitud?'BORRAR SESIÓN':'CONTINUAR · PRIMERA CONFIRMACIÓN'}</button></div></form>`;
  dialog.querySelector('[data-delete-cancel]').onclick=close;
  dialog.querySelector('[data-delete-back]')?.addEventListener('click',()=>{solicitud=null;confirmacion='';id=crypto.randomUUID();error='';render();});
  dialog.querySelector('[data-delete-reason]')?.addEventListener('input',e=>{motivo=e.target.value;});
  dialog.querySelector('[data-delete-text]')?.addEventListener('input',e=>{confirmacion=e.target.value;dialog.querySelector('[data-delete-submit]').disabled=busy||confirmacion.trim()!=='BORRAR';});
  dialog.querySelector('form').onsubmit=async e=>{
   e.preventDefault();if(busy||!authorized())return;
   if(solicitud?confirmacion.trim()!=='BORRAR':motivo.trim().length<10){error=solicitud?'ESCRIBÍ BORRAR PARA CONFIRMAR.':'EL MOTIVO DEBE TENER AL MENOS 10 CARACTERES.';render();return;}
   busy=true;error='';render();
   try{
    const r=await invoke(solicitud?{accion:'confirmar_borrado',id:solicitud.id,confirmacion:confirmacion.trim()}:{accion:'preparar_borrado',id,fecha:sesion.fecha,ciclo:sesion.ciclo,...(sesion.organizacion_id?{organizacion_id:sesion.organizacion_id}:{}),motivo:motivo.trim(),primera_confirmacion:true});
    if(!alive||!authorized())return;
    if(solicitud){busy=false;close();await onDeleted(r.borrado);return;}
    solicitud=r.solicitud;
   }catch(err){if(alive)error=err.message;}
   finally{busy=false;if(alive)render();}
  };
 }
 render();dialog.showModal();
}
