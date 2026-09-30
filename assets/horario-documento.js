/* Formatos oficiales SIDE-CEME. OOXML nativo con celdas combinadas y pie PAGE - NUMPAGES. */
(function(){
  'use strict';
  const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const upper=v=>String(v==null?'':v).toUpperCase();
  const months=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
  const days=['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
  const date=iso=>new Date(iso+'T12:00:00Z');
  const short=iso=>date(iso).getUTCDate()+' DE '+months[date(iso).getUTCMonth()];
  function p(text,{bold=false,align='left',size=17,before=0,after=0,keep=false,underline=false}={}){
    return '<w:p><w:pPr><w:spacing w:before="'+before+'" w:after="'+after+'" w:line="240" w:lineRule="auto"/><w:jc w:val="'+align+'"/>'+(keep?'<w:keepNext/>':'')+'</w:pPr>'+String(text||'').split(/\r?\n/).map((t,i)=>(i?'<w:r><w:br/></w:r>':'')+'<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>'+(bold?'<w:b/>':'')+(underline?'<w:u w:val="single"/>':'')+'<w:sz w:val="'+size+'"/><w:color w:val="000000"/></w:rPr><w:t xml:space="preserve">'+esc(t)+'</w:t></w:r>').join('')+'</w:p>';
  }
  function widths(total,weights){const sum=weights.reduce((a,b)=>a+b,0),out=weights.map(w=>Math.floor(total*w/sum));out[out.length-1]+=total-out.reduce((a,b)=>a+b,0);return out;}
  function table(ws,rows,borders=true){return '<w:tbl><w:tblPr><w:tblW w:w="'+ws.reduce((a,b)=>a+b,0)+'" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(s=>'<w:'+s+' w:val="'+(borders?'single':'nil')+'" w:sz="4" w:color="000000"/>').join('')+'</w:tblBorders><w:tblCellMar><w:top w:w="30" w:type="dxa"/><w:left w:w="40" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:right w:w="40" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>'+ws.map(w=>'<w:gridCol w:w="'+w+'"/>').join('')+'</w:tblGrid>'+rows.join('')+'</w:tbl>';}
  function baseCell(ws,i,text,{span=1,merge='',bold=false,shade=false,align='center',raw=false,size=17}={}){return '<w:tc><w:tcPr><w:tcW w:w="'+ws.slice(i,i+span).reduce((a,b)=>a+b,0)+'" w:type="dxa"/>'+(span>1?'<w:gridSpan w:val="'+span+'"/>':'')+(merge?'<w:vMerge w:val="'+merge+'"/>':'')+(shade?'<w:shd w:fill="E8E8E8"/>':'')+'<w:vAlign w:val="center"/></w:tcPr>'+(raw?text:p(upper(text),{bold,align,size}))+'</w:tc>';}
  const cell=baseCell;
  const row=(cells,head=false)=>'<w:tr><w:trPr><w:cantSplit/>'+(head?'<w:tblHeader/>':'')+'</w:trPr>'+cells.join('')+'</w:tr>';
  function section(orient,k){const land=orient==='landscape',left=land?567:1701,right=land?799:1134,top=land?567:1134;return {width:(land?15840:12240)-left-right,xml:'<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:type w:val="nextPage"/><w:pgSz w:w="'+(land?15840:12240)+'" w:h="'+(land?12240:15840)+'"'+(land?' w:orient="landscape"':'')+'/><w:pgMar w:top="'+top+'" w:right="'+right+'" w:bottom="'+top+'" w:left="'+left+'" w:header="283" w:footer="283"/></w:sectPr>'};}
  function block(sem,k,sec){
    const b=sem.datos[k]||{},cab=sem.datos.cab||{},planta=k==='planta';
    const cell=(ws,i,text,o={})=>baseCell(ws,i,text,{size:planta?17:16,...o});
    const ws=widths(sec.width,planta?[1.984,1.2065,1.2065,3.519,2.288,2.002,2.559,1.796]:[2.3548,2.0285,3.9829,8.1139,1.3758,1.9085,1.7586,4.4644]);
    const head=['FACULTAD DE CIENCIAS Y ARTES MILITARES TERRESTRES','ESCUELA DE COMANDO Y ESTADO MAYOR DEL EJÉRCITO','“MCAL. ANDRÉS DE SANTA CRUZ”','BOLIVIA'];
    const meta=planta?[['SECCIÓN',cab.seccion||'ACADÉMICA'],['PERIODO',sem.periodo||b.periodo||''],['SEMANA',typeof _plOrdSemana==='function'?_plOrdSemana(sem.semana_num):sem.semana_num]]:[['CURSO',b.curso||(k==='c1'?'1ER. CICLO':'2DO. CICLO')],['PERIODO',b.periodo||sem.periodo||'']];
    const mw=widths(sec.width,[62,38]);
    let out=table(mw,[row([cell(mw,0,head.map(t=>p(t,{bold:true,align:'center',size:20,keep:true,underline:t==='BOLIVIA'})).join(''),{raw:true}),cell(mw,1,meta.map(v=>p(upper(v[0]+'  :  '+v[1]),{bold:true,size:20,keep:true})).join(''),{raw:true})])],false);
    out+=p((planta?'HORARIO DE ACTIVIDADES PARA EL PERSONAL DE PLANTA DE LA ECEME. ':'HORARIO SEMANAL ')+'DEL '+short(sem.fecha_desde)+' AL '+short(sem.fecha_hasta),{bold:true,align:'center',size:22,before:120,after:120,keep:true});
    const rows=[],h=(i,t,o={})=>cell(ws,i,t,{bold:true,shade:true,...o});
    if(planta){rows.push(row([h(0,'FECHA',{merge:'restart'}),h(1,'HORAS',{span:2}),...[3,4,5,6,7].map((i,j)=>h(i,['ACTIVIDADES','LUGAR','ASISTEN','RESPONSABLE','UNIFORME'][j],{merge:'restart'}))],true));rows.push(row([h(0,'',{merge:'continue'}),h(1,'DESDE'),h(2,'HASTA'),...[3,4,5,6,7].map(i=>h(i,'',{merge:'continue'}))],true));}
    else rows.push(row(['FECHA','HORA','MÓDULO','UNIDAD DE COMPETENCIA','CÓDIGO','LUGAR','UNIFORME','RESPONSABLE'].map((t,i)=>h(i,t)),true));
    for(const d of b.dias||[]){
      const label=days[date(d.iso).getUTCDay()]+' '+date(d.iso).getUTCDate();
      if(d.libre){rows.push(row([cell(ws,0,label,{bold:true}),cell(ws,1,d.libre,{span:7,bold:true})]));continue;}
      const fs=d.filas||[];
      fs.forEach((f,j)=>{
        const cs=[cell(ws,0,j===0?label:'',{bold:true,merge:fs.length>1?(j===0?'restart':'continue'):''})];
        if(f.span&&!f.desde&&!f.hasta){cs.push(cell(ws,1,f.act||f.uc,{span:7,bold:true}));}
        else if(planta){cs.push(cell(ws,1,f.desde),cell(ws,2,f.hasta));if(f.span)cs.push(cell(ws,3,f.act,{span:5,bold:true}));else cs.push(cell(ws,3,f.act,{align:'left'}),cell(ws,4,f.lugar),cell(ws,5,f.asisten),cell(ws,6,f.resp),cell(ws,7,f.unif));}
        else{cs.push(cell(ws,1,[f.desde,f.hasta].filter(Boolean).join(' – ')));if(f.span)cs.push(cell(ws,2,f.uc||f.act,{span:6,bold:true}));else if(f.act3)cs.push(cell(ws,2,f.uc||f.act,{span:3}),cell(ws,5,f.lugar),cell(ws,6,f.unif),cell(ws,7,f.resp,{align:'left'}));else cs.push(cell(ws,2,f.modulo,{align:'left'}),cell(ws,3,f.uc,{align:'left'}),cell(ws,4,f.codigo),cell(ws,5,f.lugar),cell(ws,6,f.unif),cell(ws,7,f.resp,{align:'left'}));}
        rows.push(row(cs));
      });
    }
    function extra(label,value,n){if(String(value||'').trim())rows.push(row([cell(ws,0,label,{span:n,bold:true,align:'left'}),cell(ws,n,value,{span:8-n,align:'left'})]));}
    if(planta){extra('SUPERVISOR ACADÉMICO DE LA SEMANA',b.supervisor,3);extra('ENCARGADOS DE DISCIPLINA',(b.encargados||[]).filter(e=>e.nombre).map(e=>[e.ciclo,e.nombre].filter(Boolean).join('  ')).join('\n'),3);}
    else{extra('ENCARGADOS DE CURSO',b.encargados_mencion,2);extra('CURSANTES DE SERVICIO DE AULAS',b.servicio,2);extra('CURSANTES DE SERVICIO DE EFM. Y DEPORTES',b.servicio_efm,2);}
    const notes=(b.notas||[]).filter(n=>String(n).trim());if(notes.length)rows.push(row([cell(ws,0,(planta?'NOTAS ACLARATORIAS:':'NOTA:')+'\n'+notes.map(n=>'- '+n).join('\n'),{span:8,align:'left'})]));
    out+=table(ws,rows)+p(sem.lugar_fecha||'',{align:'right',size:20,before:160,keep:true})+p(cab.firmante||'',{align:'center',size:20,before:680,keep:true})+p(cab.cargo||'',{bold:true,align:'center',size:20,keep:true})+p(cab.referencia||'',{size:18,before:440});
    return out;
  }
  window._plcFormatoDocx=function(record,aud,orient='modelo'){
    const sem=record.datos,keys=aud==='todos'?['planta','c1','c2']:[aud];let body='';
    keys.forEach((k,i)=>{if(!['planta','c1','c2'].includes(k))throw Error('Horario inválido');const sec=section(orient==='modelo'?(k==='planta'?'portrait':'landscape'):orient,k);body+=block(sem,k,sec);body+=i===keys.length-1?sec.xml:'<w:p><w:pPr>'+sec.xml+'</w:pPr></w:p>';});
    const footer='<w:ftr xmlns:w="'+ns+'"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:sz w:val="24"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve"> - </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> NUMPAGES </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
    return _zipStore([
      {name:'[Content_Types].xml',str:'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'},
      {name:'_rels/.rels',str:'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
      {name:'word/_rels/document.xml.rels',str:'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>'},
      {name:'word/footer1.xml',str:'<?xml version="1.0" encoding="UTF-8"?>'+footer},
      {name:'word/document.xml',str:'<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="'+ns+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>'+body+'</w:body></w:document>'}
    ]);
  };
  // La descarga del editor de documentos usa exactamente el mismo generador.
  if(typeof plWord==='function'){
    const old=plWord;
    plWord=function(tipo){
      if(!['planta','c1','c2'].includes(tipo))return old(tipo);
      if(!PLANIF.sem)return;
      if(PLANIF.props?.estado==='cargando'||PLANIF.props?.estado==='error'){alert('Espere a que se carguen las actividades aprobadas antes de descargar.');return;}
      const sem=JSON.parse(JSON.stringify(PLANIF.sem));
      for(const k of ['planta','c1','c2'])sem.datos[k]=_plpBloqueDoc(k);
      const blob=window._plcFormatoDocx({datos:sem},tipo,'modelo'),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='SIDE-CEME-'+sem.gestion+'-semana-'+sem.semana_num+'-'+tipo+'.docx';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    };
  }
})();
