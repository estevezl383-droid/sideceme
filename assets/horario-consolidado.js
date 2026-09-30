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
  function paragraph(text,bold=false,center=false,size=18){
    return '<w:p><w:pPr><w:spacing w:before="0" w:after="60"/><w:jc w:val="'+(center?'center':'left')+'"/></w:pPr>'+String(text||'').split(/\r?\n/).map((t,i)=>(i?'<w:r><w:br/></w:r>':'')+'<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>'+(bold?'<w:b/>':'')+'<w:sz w:val="'+size+'"/></w:rPr><w:t xml:space="preserve">'+esc(t)+'</w:t></w:r>').join('')+'</w:p>';
  }
  function docx(record,aud,orient){
    const sem=record.datos,cab=sem.datos.cab||{},width=orient==='landscape'?14140:9972;
    let body='';
    audiences(aud).forEach((k,index)=>{
      const block=sem.datos[k]||{};
      if(index)body+='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      body+=paragraph('FACULTAD DE CIENCIAS Y ARTES MILITARES TERRESTRES\nESCUELA DE COMANDO Y ESTADO MAYOR DEL EJÉRCITO\n“MCAL. ANDRÉS DE SANTA CRUZ”',true,true,20);
      body+=paragraph('HORARIO SEMANAL — '+names[k],true,true,22)+paragraph('SEMANA '+sem.semana_num+' · '+sem.fecha_desde+' AL '+sem.fecha_hasta+' · '+(sem.periodo||block.periodo||''),false,true);
      if(block.curso)body+=paragraph('CURSO: '+block.curso,true);
      const headers=k==='planta'?['FECHA','DESDE','HASTA','ACTIVIDADES','LUGAR','ASISTEN','RESPONSABLE','UNIFORME']:['FECHA','HORA','MÓDULO','UNIDAD DE COMPETENCIA','CÓDIGO','LUGAR','UNIFORME','RESPONSABLE'];
      const weights=k==='planta'?[11,7,7,29,12,8,14,12]:[10,11,14,23,11,8,9,14];
      const widths=weights.map(n=>Math.floor(width*n/100));
      const cell=(text,i,bold,span=1)=>'<w:tc><w:tcPr><w:tcW w:w="'+widths.slice(i,i+span).reduce((a,b)=>a+b,0)+'" w:type="dxa"/>'+(span>1?'<w:gridSpan w:val="'+span+'"/>':'')+(bold?'<w:shd w:fill="E8EDF2"/>':'')+'<w:vAlign w:val="center"/></w:tcPr>'+paragraph(text,bold,bold||[0,1,2,4,5,7].includes(i),bold?16:17)+'</w:tc>';
      const row=(texts,head=false)=>'<w:tr><w:trPr>'+(head?'<w:tblHeader/>':'')+'<w:cantSplit/></w:trPr>'+texts.map((t,i)=>cell(t,i,head)).join('')+'</w:tr>';
      body+='<w:tbl><w:tblPr><w:tblW w:w="'+width+'" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(s=>'<w:'+s+' w:val="single" w:sz="4" w:color="000000"/>').join('')+'</w:tblBorders><w:tblCellMar><w:top w:w="50" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>'+widths.map(w=>'<w:gridCol w:w="'+w+'"/>').join('')+'</w:tblGrid>'+row(headers,true);
      for(const day of block.dias||[]){
        const date=new Date(day.iso+'T12:00:00Z').toLocaleDateString('es-BO',{weekday:'long',day:'2-digit',month:'2-digit',timeZone:'UTC'}).toUpperCase();
        if(day.libre)body+='<w:tr>'+cell(date,0,true)+cell(day.libre,1,false,7)+'</w:tr>';
        else for(const f of day.filas||[]){
          if(f.span)body+='<w:tr>'+cell(date,0,true)+cell(f.act||f.uc,1,false,7)+'</w:tr>';
          else body+=row(k==='planta'?[date,f.desde,f.hasta,f.act,f.lugar,f.asisten,f.resp,f.unif]:[date,[f.desde,f.hasta].filter(Boolean).join(' – '),f.modulo,f.uc,f.codigo,f.lugar,f.unif,f.resp]);
        }
      }
      body+='</w:tbl>'+paragraph('');
      for(const [field,label] of [['supervisor','SUPERVISOR ACADÉMICO'],['encargados_mencion','ENCARGADOS DE CURSO'],['servicio','CURSANTES DE SERVICIO DE AULAS'],['servicio_efm','CURSANTES DE SERVICIO DE EFM. Y DEPORTES']])if(block[field])body+=paragraph(label+': '+block[field]);
      for(const e of block.encargados||[])if(e.nombre)body+=paragraph('ENCARGADO DE DISCIPLINA: '+(e.ciclo||'')+' '+e.nombre);
      for(const note of block.notas||[])if(String(note).trim())body+=paragraph('NOTA: '+note);
      body+=paragraph(sem.lugar_fecha||'')+paragraph(cab.firmante||'',true,true)+paragraph(cab.cargo||'',false,true)+paragraph(cab.referencia||'',false,true);
      body+=paragraph('VERSIÓN CONSOLIDADA #'+record.id+' · GUARDADA '+new Date(record.creado_en).toLocaleString('es-BO',{timeZone:'America/La_Paz'})+' · '+record.creado_nombre,false,false,16);
    });
    body+='<w:sectPr><w:pgSz w:w="'+(orient==='landscape'?15840:12240)+'" w:h="'+(orient==='landscape'?12240:15840)+'"'+(orient==='landscape'?' w:orient="landscape"':'')+'/><w:pgMar w:top="'+(orient==='landscape'?850:1134)+'" w:right="'+(orient==='landscape'?850:1134)+'" w:bottom="'+(orient==='landscape'?850:1134)+'" w:left="'+(orient==='landscape'?850:1134)+'" w:header="567" w:footer="567"/></w:sectPr>';
    return _zipStore([
      {name:'[Content_Types].xml',str:'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'},
      {name:'_rels/.rels',str:'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
      {name:'word/document.xml',str:'<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'</w:body></w:document>'}
    ]);
  }
  window._plcDocx=docx;
  function html(record,aud){const old=PLANIF.sem,props=PLANIF.props;try{PLANIF.sem=record.datos;PLANIF.props={semId:record.datos.id,lista:[]};return audiences(aud).map((k,i)=>'<section'+(i?' style="break-before:page;page-break-before:always"':'')+'>'+(k==='planta'?_plDocPlanta():_plDocCiclo(k))+'</section>').join('');}finally{PLANIF.sem=old;PLANIF.props=props;}}
  async function list(){const r=await api('listar',{semana_id:current.sem.id});el('version').innerHTML='<option value="">Elija una versión guardada</option>'+r.records.map(r=>'<option value="'+r.id+'">#'+r.id+' · '+esc(new Date(r.creado_en).toLocaleString('es-BO',{timeZone:'America/La_Paz'}))+' · '+esc(r.creado_nombre)+'</option>').join('');}
  window.plcAbrir=async function(){
    if(!allowed())return;
    const semanas=PLP.semanas.filter(s=>s.datos);
    if(!semanas.length){alert('Abra la vista SEMANA o DÍA del horario que desea consolidar.');return;}
    if(semanas.length!==1){alert('Abra una semana para consolidar su horario.');return;}
    current={sem:semanas[0],record:null};
    let dialog=el('dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='plc-dialog';dialog.className='plc-dialog';document.body.appendChild(dialog);}
    dialog.innerHTML='<h2>SEMANA CONSOLIDADA</h2><p>Semana '+esc(current.sem.semana_num)+' · '+esc(current.sem.fecha_desde)+' al '+esc(current.sem.fecha_hasta)+'</p><p>Guarda una copia del horario base con las actividades aprobadas de planta y ambos ciclos. Cada consolidación conserva una nueva versión.</p><div class="plc-options"><label>DESCARGAR / IMPRIMIR<select id="plc-audiencia"><option value="todos">TODOS LOS HORARIOS</option>'+Object.keys(names).map(k=>'<option value="'+k+'"'+(k===PLP.vista?' selected':'')+'>'+names[k]+'</option>').join('')+'</select></label><label>ORIENTACIÓN<select id="plc-orientacion"><option value="landscape">HORIZONTAL</option><option value="portrait">VERTICAL</option></select></label></div><div class="plc-actions"><button data-action="consolidar">GUARDAR Y DESCARGAR WORD</button><button data-action="word">DESCARGAR WORD GUARDADO</button><button data-action="print">IMPRIMIR VERSIÓN GUARDADA</button></div><label>HISTORIAL DE ESTA SEMANA<select id="plc-version"><option>Cargando...</option></select></label><p id="plc-estado" role="status" aria-live="polite">Seleccione una versión o guarde una nueva consolidación.</p><hr><h3>SINCRONIZAR CALENDARIO</h3><p>El calendario se actualiza con la última versión consolidada de cada semana. Es una suscripción de consulta; Google y Apple deciden cuándo refrescar los cambios.</p><label>HORARIO DEL CALENDARIO<select id="plc-cal-audiencia">'+Object.keys(names).map(k=>'<option value="'+k+'">'+names[k]+'</option>').join('')+'</select></label><div class="plc-actions"><button data-action="calendar">OBTENER ENLACE PARA GOOGLE / APPLE</button><button data-action="revoke">DESACTIVAR MI ENLACE</button></div><div id="plc-calendar"></div><div class="plc-actions"><button data-close="true">CERRAR</button></div>';
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
        saveBlob(docx(r.record,selected(),orientation()),'SIDE-CEME-semana-'+current.sem.semana_num+'-version-'+r.record.id+'.docx');
        status('Semana guardada, versión #'+r.record.id+'. '+(r.pendientes?r.pendientes+' propuestas pendientes no se incluyen.':'Word descargado.'));
      }else if(action==='open'){
        current.record=null;if(!el('version').value){status('Elija una versión guardada.');return;}
        const r=await api('abrir',{id:Number(el('version').value)});current.record=r.record;el('orientacion').value=r.record.orientacion;status('Versión #'+r.record.id+' lista para descargar o imprimir.');
      }else if(action==='word'||action==='print'){
        if(!current.record)throw Error('Primero guarde una consolidación o elija una versión del historial.');
        if(action==='word')saveBlob(docx(current.record,selected(),orientation()),'SIDE-CEME-semana-'+current.sem.semana_num+'-version-'+current.record.id+'.docx');
        else{
          if(!printWindow)throw Error('Permita abrir ventanas para imprimir.');
          printWindow.document.open();printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Semana consolidada #'+current.record.id+'</title><style>'+cssReporte(orientation())+' @page{size:letter '+orientation()+';margin:'+(orientation()==='landscape'?'1.5cm':'2cm')+';} body{background:white!important;} thead{display:table-header-group;} </style></head><body>'+html(current.record,selected())+'</body></html>');printWindow.document.close();printWindow.focus();printWindow.print();
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
  _plpBarra=function(){barra();const toolbar=document.getElementById('plp-barra');if(!toolbar||!allowed()||toolbar.querySelector('.plc-button'))return;const button=document.createElement('button');button.className='plp-prev-gr plc-button';button.textContent='SEMANA CONSOLIDADA';button.onclick=plcAbrir;toolbar.appendChild(button);};
  const marker=document.getElementById('version-marker');if(marker)marker.textContent='v2.9.424';
})();
