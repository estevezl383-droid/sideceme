/* SIDE-CEME v2.9.424: archivo de semanas, Word nativo y calendarios privados. */
(function(){
  'use strict';
  const allowed=()=>['P030','P032','S002'].includes((PLP.perfil||{}).id);
  const names={planta:'PERSONAL DE PLANTA',c1:'1ER CICLO',c2:'2DO CICLO'};
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let current=null,busy=false;
  async function api(accion,extra){
    const token=getTokenSesion();if(!token)throw Error('Vuelva a iniciar sesión.');
    const {data,error}=await sb.functions.invoke('horario-consolidado',{body:{accion,token,...extra}});
    if(error||!data||!data.ok)throw Error(data&&data.error||'No se pudo completar la operación.');return data;
  }
  const el=id=>document.getElementById('plc-'+id);
  const selected=()=>el('audiencia').value;
  const orientation=()=>el('orientacion').value;
  function status(text){if(el('estado'))el('estado').textContent=text;}
  function toggle(value){busy=value;const dlg=el('dialog');if(dlg)dlg.querySelectorAll('button,select').forEach(b=>{if(!b.dataset.close)b.disabled=value;});}
  function audiences(a){return a==='todos'?Object.keys(names):[a];}
  function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  const docx=(record,aud,orient)=>window._plcFormatoDocx(record,aud,orient);
  window._plcDocx=docx;
  function html(record,aud){const old=PLANIF.sem,props=PLANIF.props;try{PLANIF.sem=record.datos;PLANIF.props={semId:record.datos.id,lista:[]};return audiences(aud).map((k,i)=>'<section class="plc-page-'+k+'"'+(i?' style="break-before:page;page-break-before:always"':'')+'>'+(k==='planta'?_plDocPlanta():_plDocCiclo(k))+'</section>').join('');}finally{PLANIF.sem=old;PLANIF.props=props;}}
  window._plcHtml=html;
  window._plcPrintModelCSS='@page plcPlanta{size:letter portrait;margin:2cm 2cm 2cm 3cm} @page plcCiclo{size:letter landscape;margin:1cm 1.4cm 1cm 1cm} .plc-page-planta{page:plcPlanta}.plc-page-c1,.plc-page-c2{page:plcCiclo}';
  async function list(){const r=await api('listar',{semana_id:current.sem.id});el('version').innerHTML='<option value="">Elija una versión guardada</option>'+r.records.map(r=>'<option value="'+r.id+'">#'+r.id+' · '+esc(new Date(r.creado_en).toLocaleString('es-BO',{timeZone:'America/La_Paz'}))+' · '+esc(r.creado_nombre)+'</option>').join('');}
  window.plcAbrir=async function(){
    if(!allowed())return;
    const semanas=PLP.semanas.filter(s=>s.datos);
    if(!semanas.length){alert('Abra la vista SEMANA o DÍA del horario que desea consolidar.');return;}
    if(semanas.length!==1){alert('Abra una semana para consolidar su horario.');return;}
    current={sem:semanas[0],record:null};
    let dialog=el('dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='plc-dialog';dialog.className='plc-dialog';document.body.appendChild(dialog);}
    dialog.innerHTML='<h2>SEMANA CONSOLIDADA</h2><p>Semana '+esc(current.sem.semana_num)+' · '+esc(current.sem.fecha_desde)+' al '+esc(current.sem.fecha_hasta)+'</p><p>Guarda una copia del horario base con las actividades aprobadas de planta y ambos ciclos. Cada consolidación conserva una nueva versión. Planificación puede seguir editando hasta el viernes o después de publicar. Las correcciones se guardan y se publican como una nueva versión.</p><div class="plc-options"><label>DESCARGAR / IMPRIMIR<select id="plc-audiencia"><option value="todos">TODOS LOS HORARIOS</option>'+Object.keys(names).map(k=>'<option value="'+k+'"'+(k===PLP.vista?' selected':'')+'>'+names[k]+'</option>').join('')+'</select></label><label>ORIENTACIÓN<select id="plc-orientacion"><option value="modelo">SEGÚN MODELO: PLANTA VERTICAL / CICLOS HORIZONTAL</option><option value="landscape">HORIZONTAL</option><option value="portrait">VERTICAL</option></select></label></div><div class="plc-actions"><button data-action="consolidar">GUARDAR Y DESCARGAR WORD</button><button data-action="word">DESCARGAR WORD GUARDADO</button><button data-action="print">IMPRIMIR VERSIÓN GUARDADA</button><button data-action="publicar">PUBLICAR PARA TODO EL PERSONAL</button></div><label>HISTORIAL DE ESTA SEMANA<select id="plc-version"><option>Cargando...</option></select></label><p id="plc-estado" role="status" aria-live="polite">Seleccione una versión o guarde una nueva consolidación.</p><hr><h3>SINCRONIZAR CALENDARIO</h3><p>El calendario se actualiza con la última versión publicada de cada semana. Es una suscripción de consulta; Google y Apple deciden cuándo refrescar los cambios.</p><label>HORARIO DEL CALENDARIO<select id="plc-cal-audiencia">'+Object.keys(names).map(k=>'<option value="'+k+'">'+names[k]+'</option>').join('')+'</select></label><div class="plc-actions"><button data-action="calendar">OBTENER ENLACE PARA GOOGLE / APPLE</button><button data-action="revoke">DESACTIVAR MI ENLACE</button></div><div id="plc-calendar"></div><div class="plc-actions"><button data-close="true">CERRAR</button></div>';
    dialog.querySelector('[data-close]').onclick=()=>{if(!busy){dialog.close();current=null;}};
    dialog.oncancel=e=>{if(busy)e.preventDefault();else current=null;};
    dialog.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>act(b.dataset.action));
    el('version').onchange=()=>act('open');el('cal-audiencia').onchange=()=>{el('calendar').replaceChildren();};
    dialog.showModal();toggle(true);try{await list();}catch(e){status(e.message);}finally{toggle(false);}
  };
  async function act(action){
    if(busy||!current||!allowed())return;
    let printWindow=null;
    if(action==='print'&&current.record)printWindow=window.open('','_blank');
    toggle(true);
    try{
      if(action==='consolidar'){
        const r=await api('consolidar',{semana_id:current.sem.id,orientacion:orientation()});current.record=r.record;
        await list();el('version').value=String(r.record.id);
        saveBlob(docx(r.record,selected(),orientation()),'SIDE-CEME-'+current.sem.gestion+'-semana-'+current.sem.semana_num+'-'+selected()+'-version-'+r.record.id+'.docx');
        status('Semana guardada, versión #'+r.record.id+'. '+(r.pendientes?r.pendientes+' propuestas pendientes no se incluyen.':'Word descargado.'));
      }else if(action==='open'){
        current.record=null;if(!el('version').value){status('Elija una versión guardada.');return;}
        const r=await api('abrir',{id:Number(el('version').value)});current.record=r.record;el('orientacion').value=r.record.orientacion||'modelo';status('Versión #'+r.record.id+' lista para descargar o imprimir.');
      }else if(action==='publicar'){
        if(!current.record)throw Error('Guarde una consolidación o elija la versión final del historial.');
        const r=await api('publicar',{id:current.record.id});
        status('Versión #'+r.publicacion.consolidado_id+' publicada para planta y ambos ciclos. Todos pueden verla en HORARIO SEMANAL PUBLICADO.'+(r.pendientes?' '+r.pendientes+' propuestas pendientes no se incluyeron.':''));
      }else if(action==='word'||action==='print'){
        if(!current.record)throw Error('Primero guarde una consolidación o elija una versión del historial.');
        if(action==='word')saveBlob(docx(current.record,selected(),orientation()),'SIDE-CEME-'+current.sem.gestion+'-semana-'+current.sem.semana_num+'-'+selected()+'-version-'+current.record.id+'.docx');
        else{
          if(!printWindow)throw Error('Permita abrir ventanas para imprimir.');
          const orient=orientation()==='modelo'?(selected()==='planta'?'portrait':'landscape'):orientation();
          printWindow.document.open();printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Semana consolidada #'+current.record.id+'</title><style>'+cssReporte(orient)+(orientation()==='modelo'?window._plcPrintModelCSS:'')+' @page{size:letter '+orient+';margin:'+(orient==='landscape'?'1cm 1.4cm 1cm 1cm':'2cm 2cm 2cm 3cm')+';} body{background:white!important;} thead{display:table-header-group;} </style></head><body>'+html(current.record,selected())+'</body></html>');printWindow.document.close();printWindow.focus();printWindow.print();
        }
      }else if(action==='calendar'){
        const r=await api('enlace',{audiencia:el('cal-audiencia').value});
        el('calendar').innerHTML='<p>Enlace privado: quien lo tenga podrá consultar este horario. Puede desactivarlo aquí.</p><input id="plc-url" readonly aria-label="Enlace privado de calendario"><button id="plc-copy">COPIAR ENLACE</button><p><a id="plc-google" target="_blank" rel="noopener noreferrer">ABRIR GOOGLE CALENDAR</a> · <a id="plc-apple">SUSCRIBIR EN APPLE</a></p><p>Google: en el navegador, Otros calendarios → + → Desde URL; pegue el enlace. Apple: abra el enlace de suscripción o Calendario → Archivo → Nueva suscripción a calendario.</p>';
        el('url').value=r.url;el('google').href='https://calendar.google.com/calendar/u/0/r/settings/addbyurl';el('apple').href=r.url.replace(/^https:/,'webcal:');
        el('copy').onclick=async()=>{try{await navigator.clipboard.writeText(r.url);status('Enlace copiado.');}catch(_){el('url').select();status('Seleccione y copie el enlace.');}};
      }else if(action==='revoke'){
        await api('revocar',{audiencia:el('cal-audiencia').value});el('calendar').replaceChildren();status('Su enlace de este horario está desactivado. Puede obtener uno nuevo.');
      }
    }catch(e){if(printWindow)printWindow.close();status(e.message);}finally{toggle(false);}
  }
  const barra=_plpBarra;
  _plpBarra=function(){barra();const toolbar=document.getElementById('plp-barra');if(!toolbar||!allowed()||toolbar.querySelector('.plc-button'))return;const button=document.createElement('button');button.className='plp-prev-gr plc-button';button.textContent='CONSOLIDAR / WORD / PUBLICAR';button.onclick=plcAbrir;toolbar.appendChild(button);const archive=document.createElement('button');archive.className='plc-button';archive.textContent='ARCHIVO DE SEMANAS Y DOCUMENTACIÓN';archive.onclick=goPlanificacion;toolbar.appendChild(archive);};
  const marker=document.getElementById('version-marker');if(marker)marker.textContent='v2.9.425';
})();
