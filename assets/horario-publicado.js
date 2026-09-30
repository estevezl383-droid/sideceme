/* Consulta de la versión publicada; disponible a planta y al ciclo de cada cursante. */
(function(){
  'use strict';
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const names={planta:'PERSONAL DE PLANTA',c1:'1ER CICLO',c2:'2DO CICLO'};
  async function api(accion,extra={}){
    const token=getTokenSesion();if(!token)throw Error('Vuelva a iniciar sesión.');
    const {data,error}=await sb.functions.invoke('horario-consolidado',{body:{accion,token,...extra}});
    if(error||!data?.ok)throw Error(data?.error||'No se pudo cargar el horario. Intente nuevamente.');return data;
  }
  function save(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  window.plcPublicadosAbrir=async function(){
    document.getElementById('plc-publicados')?.remove();
    const dlg=document.createElement('dialog');dlg.id='plc-publicados';dlg.className='plc-dialog';
    dlg.innerHTML='<h2>HORARIO SEMANAL PUBLICADO</h2><p>Versión final publicada por Planificación. Las semanas se ordenan por gestión y fecha. Las correcciones aparecen cuando Planificación publica la nueva versión.</p><div data-controls></div><p role="status" data-status>CARGANDO…</p><div data-preview style="overflow:auto;max-height:45vh"></div><button data-close>CERRAR</button>';
    document.body.appendChild(dlg);dlg.querySelector('[data-close]').onclick=()=>dlg.close();dlg.showModal();
    const status=msg=>dlg.querySelector('[data-status]').textContent=msg;let data,record,aud;
    try{
      data=await api('publicados');
      if(!dlg.isConnected)return;
      const host=dlg.querySelector('[data-controls]');
      host.innerHTML='<label>HORARIO<select data-aud>'+data.audiencias.map(k=>'<option value="'+k+'">'+names[k]+'</option>').join('')+'</select></label><label>GESTIÓN Y SEMANA<select data-week>'+data.records.map((r,i)=>'<option value="'+i+'">'+esc(r.datos.gestion)+' · SEMANA '+esc(r.datos.semana_num)+' · '+esc(r.datos.fecha_desde)+' AL '+esc(r.datos.fecha_hasta)+' · VERSIÓN #'+r.id+'</option>').join('')+'</select></label><label>ORIENTACIÓN<select data-orient><option value="modelo">SEGÚN MODELO OFICIAL</option><option value="portrait">VERTICAL</option><option value="landscape">HORIZONTAL</option></select></label><div class="plc-actions"><button data-word>DESCARGAR WORD</button><button data-print>IMPRIMIR</button><button data-calendar>GOOGLE / APPLE CALENDAR</button><button data-revoke>DESACTIVAR MI ENLACE</button></div><div data-link></div>';
      const select=()=>{aud=host.querySelector('[data-aud]').value;record=data.records[Number(host.querySelector('[data-week]').value)];host.querySelectorAll('[data-word],[data-print]').forEach(b=>b.disabled=!record);if(!record){status('Todavía no hay semanas publicadas.');return;}status('SEMANA '+record.datos.semana_num+' · VERSIÓN #'+record.id+' · PUBLICADA '+new Date(record.publicacion.publicado_en).toLocaleString('es-BO',{timeZone:'America/La_Paz'}));dlg.querySelector('[data-preview]').innerHTML='<div style="color:#000;background:#fff;min-width:'+(aud==='planta'?'650px':'950px')+'">'+_plcHtml(record,aud)+'</div>';};
      host.querySelector('[data-aud]').onchange=()=>{select();host.querySelector('[data-link]').replaceChildren();};host.querySelector('[data-week]').onchange=select;select();
      host.querySelector('[data-word]').onclick=()=>{if(record)save(_plcFormatoDocx(record,aud,host.querySelector('[data-orient]').value),'SIDE-CEME-'+record.datos.gestion+'-semana-'+record.datos.semana_num+'-'+aud+'-version-'+record.id+'.docx');};
      host.querySelector('[data-print]').onclick=()=>{if(!record)return;const win=window.open('','_blank');if(!win){status('Permita abrir una ventana para imprimir.');return;}let orient=host.querySelector('[data-orient]').value;if(orient==='modelo')orient=aud==='planta'?'portrait':'landscape';win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>SIDE-CEME SEMANA '+record.datos.semana_num+'</title><style>'+cssReporte(orient)+(host.querySelector('[data-orient]').value==='modelo'?window._plcPrintModelCSS:'')+' @page{size:letter '+orient+';margin:'+(orient==='landscape'?'1cm 1.4cm 1cm 1cm':'2cm 2cm 2cm 3cm')+'} thead{display:table-header-group} tr{break-inside:avoid}</style></head><body>'+_plcHtml(record,aud)+'</body></html>');win.document.close();win.focus();win.print();};
      host.querySelector('[data-calendar]').onclick=async()=>{
        const button=host.querySelector('[data-calendar]');button.disabled=true;
        try{const r=await api('enlace',{audiencia:aud});const box=host.querySelector('[data-link]');box.innerHTML='<label>ENLACE PERSONAL DE SUSCRIPCIÓN<input data-url readonly></label><div class="plc-actions"><button data-copy>COPIAR ENLACE</button><a data-google target="_blank" rel="noopener noreferrer">GOOGLE CALENDAR</a><a data-apple>APPLE CALENDAR</a></div><p>Google: Otros calendarios → + → Desde URL. Apple: abra el enlace o use Nueva suscripción a calendario. Cada servicio decide cuándo actualizar los cambios.</p>';box.querySelector('[data-url]').value=r.url;box.querySelector('[data-google]').href='https://calendar.google.com/calendar/u/0/r/settings/addbyurl';box.querySelector('[data-apple]').href=r.url.replace(/^https:/,'webcal:');box.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(r.url);status('Enlace copiado.');}catch(_){box.querySelector('[data-url]').select();status('Seleccione y copie el enlace.');}};}catch(e){status(e.message);}finally{button.disabled=false;}
      };
      host.querySelector('[data-revoke]').onclick=async()=>{try{await api('revocar',{audiencia:aud});host.querySelector('[data-link]').replaceChildren();status('Enlace desactivado.');}catch(e){status(e.message);}};
    }catch(e){status(e.message);const b=document.createElement('button');b.textContent='REINTENTAR';b.onclick=plcPublicadosAbrir;dlg.querySelector('[data-controls]').appendChild(b);}
  };
  function panel(){
    if(!currentUser)return;
    const sc=document.querySelector('.screen.active');if(!sc)return;
    if(['P030','P032','S002'].includes(String(currentUser.id)))sc.querySelectorAll('[onclick="goPlanificacion()"]').forEach(b=>{if(!b.closest('#screen-planif-cal'))b.style.display='none';});
    const cont=sc.querySelector('.menu-container')||sc.querySelector('.disc-container');
    if(!cont||sc.id.startsWith('screen-planif-')||sc.querySelector('.plc-published-button'))return;
    const b=document.createElement('button');b.className='btn-mega plc-published-button';b.style.cssText='margin:8px 0';b.innerHTML='<span class="mega-icon">📅</span><span>HORARIO SEMANAL PUBLICADO — WORD Y CALENDARIO</span>';b.onclick=plcPublicadosAbrir;
    const old=cont.querySelector('[onclick="goHorarios()"]');if(old)old.insertAdjacentElement('beforebegin',b);else cont.appendChild(b);
  }
  const show=showScreen;showScreen=function(){const result=show.apply(this,arguments);panel();return result;};
  const go=goHorarios;goHorarios=function(){const r=go.apply(this,arguments);const sc=document.getElementById('screen-horarios');if(sc&&!sc.querySelector('.plc-published-button')){const b=document.createElement('button');b.className='btn-mega plc-published-button';b.textContent='HORARIOS PUBLICADOS — CONSULTAR, WORD, IMPRIMIR Y CALENDARIO';b.onclick=plcPublicadosAbrir;(sc.querySelector('.menu-container')||sc.querySelector('.disc-container')||sc).appendChild(b);}return r;};
  panel();
})();
