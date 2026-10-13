/* Configuración de evaluaciones y avisos de entrega; sin servicios de IA. */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let draft=null;
async function api(accion,extra={}){
 const {data,error}=await sb.functions.invoke('eem-config',{body:{accion,token:getTokenSesion(),...extra}});
 if(error){let msg=error.message;try{msg=(await error.context.json()).error||msg;}catch(_){}throw Error(msg);}
 if(!data?.ok)throw Error(data?.error||'No se recibió confirmación.');return data;
}
const val=id=>document.getElementById(id)?.value||'';
function filas(){const c=document.getElementById('ec-items');if(!c)return;
 c.innerHTML=draft.items.map((x,i)=>'<tr data-ec-row="'+i+'"><td><select data-campo="bloque">'+['FORMA','FONDO','EXPOSICION'].map(b=>'<option '+(b===x.bloque?'selected':'')+'>'+b+'</option>').join('')+'</select><input data-campo="sub_bloque" aria-label="Subbloque" value="'+esc(x.sub_bloque)+'"></td><td><textarea data-campo="descripcion" aria-label="Criterio" rows="3">'+esc(x.descripcion)+'</textarea></td><td><input type="number" min="0.01" max="100" step="0.01" data-campo="valor_pct" aria-label="Porcentaje" value="'+x.valor_pct+'"><button type="button" onclick="eemConfigQuitar('+i+')">Quitar</button></td></tr>').join('');
 c.querySelectorAll('[data-campo]').forEach(el=>el.oninput=()=>{const r=draft.items[Number(el.closest('tr').dataset.ecRow)];r[el.dataset.campo]=el.dataset.campo==='valor_pct'?Number(el.value):el.value;totales();});totales();
}
function totales(){const t={FORMA:0,FONDO:0,EXPOSICION:0};draft.items.forEach(x=>t[x.bloque]+=Number(x.valor_pct)||0);const el=document.getElementById('ec-total');if(el)el.textContent='Documento: '+(t.FORMA+t.FONDO)+'% (forma '+t.FORMA+' + fondo '+t.FONDO+') · Presencial: '+t.EXPOSICION+'% · Total: '+Object.values(t).reduce((a,b)=>a+b,0)+'%';}
window.eemConfigQuitar=i=>{draft.items.splice(i,1);filas();};
window.eemConfigAgregar=()=>{draft.items.push({bloque:'FONDO',sub_bloque:'',descripcion:'',valor_pct:1});filas();};
async function textoDocx(file){await ensureJSZip();const zip=await JSZip.loadAsync(await file.arrayBuffer());const xml=await zip.file('word/document.xml').async('string');return new DOMParser().parseFromString(xml,'application/xml');}
const textoNodo=n=>[...n.getElementsByTagNameNS('*','t')].map(x=>x.textContent).join('');
async function importar(file,tipo){if(!file)return;try{
 if(tipo==='perfil'){const doc=await textoDocx(file);draft.perfil.guia_metodologica=[...doc.getElementsByTagNameNS('*','p')].map(textoNodo).join('\n');document.getElementById('ec-referencia').value=draft.perfil.guia_metodologica;draft.perfil.fuente_estructura=file.name;return;}
 if(file.name.toLowerCase().endsWith('.json')){const d=JSON.parse(await file.text());if(!Array.isArray(d.items))throw Error('El JSON debe contener items.');draft.items=d.items;if(d.perfil){draft.perfil=d.perfil;perfilCampos();}filas();return;}
 const doc=await textoDocx(file);const items=[];let bloque='FORMA',sub='';
 for(const row of doc.getElementsByTagNameNS('*','tr')){const cells=[...row.getElementsByTagNameNS('*','tc')].map(textoNodo);const encabezado=cells[0]||'';
  if(/ASPECTOS DE FONDO/i.test(encabezado))bloque='FONDO';
  if(/EXPOSICI[ÓO]N,? DEFENSA|ASPECTOS A.?CONSIDERAR/i.test(encabezado))bloque='EXPOSICION';
  if(/SECUENCIA L[ÓO]GICA|SOLUCI[ÓO]N MILITAR|PARTE CONCLUSIVA/i.test(encabezado))sub=encabezado.split('(')[0].trim();
  if(/^\s*\d+\s*$/.test(cells[0])&&/^\s*\d+(?:[.,]\d+)?\s*%\s*$/.test(cells[2]))items.push({bloque:/impresi[óo]n prolija/i.test(cells[1])?'EXPOSICION':bloque,sub_bloque:sub,descripcion:cells[1],valor_pct:Number(cells[2].replace('%','').replace(',','.').trim())});
 }
 if(!items.length)throw Error('No se encontraron filas de número, criterio y porcentaje. Ingrese los criterios en la tabla.');draft.items=items;filas();
 }catch(e){alert(e.message);}}
function perfilCampos(){const p=draft.perfil;const campos={fuente:(p.fuentes_permitidas||['Arial']).join(', '),tamano:p.tamano_pt||12,sup:p.margenes_cm?.sup??2,inf:p.margenes_cm?.inf??2,izq:p.margenes_cm?.izq??3,der:p.margenes_cm?.der??2,sangria:p.sangria_francesa_cm??1,clasificacion:p.clasificacion||'',estructura:(p.estructura_obligatoria||[]).join('\n'),referencia:p.guia_metodologica||''};for(const [k,v] of Object.entries(campos)){const e=document.getElementById('ec-'+k);if(e)e.value=v;}document.getElementById('ec-autogrupo').checked=p.entrega_autogrupo===true;}
const anteriorNueva=window.eemNuevaCarpeta;
window.eemNuevaCarpeta=async()=>{
 anteriorNueva();const host=document.querySelector('#eem-modal-nueva .eem-modal');if(!host)return;
 draft=await api('plantilla').catch(()=>({items:[],perfil:{}}));
 const cont=document.createElement('div');cont.innerHTML='<details style="margin:12px 0"><summary style="cursor:pointer;color:#e8d79a;font-weight:bold">Crear rúbrica y perfil propios de esta materia</summary><label class="eem-integ"><input type="checkbox" id="ec-propia"> Utilizar esta nueva rúbrica y este perfil al abrir la carpeta</label><p class="eem-sub">Puede cargar Word (.docx), importar una configuración JSON o editar cada fila. La impresión física se registra en EXPOSICION y la califica el tribunal.</p><div class="eem-field"><label>Cargar rúbrica (.docx o .json)</label><input type="file" id="ec-importar" accept=".docx,.json"></div><div class="eem-scroll"><table class="eem-tabla"><thead><tr><th>Bloque / subbloque</th><th>Criterio</th><th>%</th></tr></thead><tbody id="ec-items"></tbody></table></div><button type="button" class="eem-btn sec mini" onclick="eemConfigAgregar()">Agregar criterio</button><p id="ec-total" role="status"></p><h3>Perfil normativo</h3><p class="eem-sub">Los parámetros iniciales vienen del perfil ECEME existente. Verifique las normas aplicables a esta materia.</p><div class="eem-grid2">'+[['fuente','Fuentes permitidas','text'],['tamano','Tamaño (pt)','number'],['sup','Margen superior (cm)','number'],['inf','Margen inferior (cm)','number'],['izq','Margen izquierdo (cm)','number'],['der','Margen derecho (cm)','number'],['sangria','Sangría francesa (cm)','number'],['clasificacion','Clasificación','text']].map(([id,label,type])=>'<div class="eem-field"><label>'+label+'</label><input id="ec-'+id+'" type="'+type+'" step="0.1"></div>').join('')+'</div><div class="eem-field"><label>Secciones obligatorias (una por línea)</label><textarea id="ec-estructura" rows="6"></textarea></div><div class="eem-field"><label>Cargar guía o perfil normativo (.docx)</label><input type="file" id="ec-guia" accept=".docx"></div><div class="eem-field"><label>Referencia metodológica / normativa</label><textarea id="ec-referencia" rows="6"></textarea></div><label class="eem-integ"><input type="checkbox" id="ec-autogrupo"> Permitir que los cursantes declaren los integrantes de su grupo para entregar</label></details><div class="eem-field"><label>Fecha límite de entrega (hora de Bolivia)</label><input type="datetime-local" id="ec-fecha"></div>';
 const estado=host.querySelector('#eem-nc-estado');host.insertBefore(cont,estado);host.style.maxWidth='900px';filas();perfilCampos();
 document.getElementById('ec-importar').onchange=e=>importar(e.target.files[0],'rubrica');document.getElementById('ec-guia').onchange=e=>importar(e.target.files[0],'perfil');
};
const anteriorCrear=window.eemCrearCarpeta;
window.eemCrearCarpeta=async()=>{
 if(!document.getElementById('ec-propia')?.checked)return anteriorCrear();
 const est=document.getElementById('eem-nc-estado');try{
 const n=k=>Number(val('ec-'+k));const items=draft.items.map(x=>({...x}));const order={FORMA:0,FONDO:0,EXPOSICION:0};
 items.forEach(x=>{x.orden=++order[x.bloque];x.modo_calificacion=x.bloque==='EXPOSICION'?'humano':'ia';x.alcance=x.bloque==='EXPOSICION' ? (/elaboraci[oó]n de planes/i.test(val('eem-nc-materia')) && x.orden===1 ? 'grupal' : 'individual') : 'grupal';});
 if(Math.abs(items.reduce((a,x)=>a+x.valor_pct,0)-100)>0.00001)throw Error('La rúbrica debe sumar 100%.');
 const perfil={...draft.perfil,fuentes_permitidas:val('ec-fuente').split(',').map(x=>x.trim()).filter(Boolean),tamano_pt:n('tamano'),margenes_cm:{sup:n('sup'),inf:n('inf'),izq:n('izq'),der:n('der')},sangria_francesa_cm:n('sangria'),clasificacion:val('ec-clasificacion'),estructura_obligatoria:val('ec-estructura').split('\n').filter(Boolean),guia_metodologica:val('ec-referencia'),entrega_autogrupo:document.getElementById('ec-autogrupo').checked};
 est.textContent='Guardando configuración…';
 const r=await api('guardar',{datos:{materia:val('eem-nc-materia').trim(),codigo:val('eem-nc-codigo'),gestion:Number(val('eem-nc-gestion')),ciclo:Number(val('eem-nc-ciclo')),paralelo:val('eem-nc-paralelo')||null,evaluador_id:EEM._evalElegido||null,fecha_limite:val('ec-fecha')?val('ec-fecha')+':00-04:00':null,items,perfil}});
 eemCerrarModal('eem-modal-nueva');EEM.hayAlgo=null;await eemAbrirCarpetas();await eemAbrirPanel(r.carpeta_id,false);
 }catch(e){est.textContent=e.message;}
};
window.eemDeclararGrupo=async i=>{try{const x=EEM.alumno[i],r=await api('candidatos',{carpeta_id:x.carpeta.id});const bg=document.createElement('div');bg.className='eem-modal-bg';bg.id='ec-grupo';
 bg.innerHTML='<div class="eem-modal"><h3>Identificar el grupo que entrega</h3><p class="eem-sub">Seleccione solo a los integrantes reales de su trabajo. Esta declaración se registra y puede ser revisada por los docentes.</p><div class="eem-field"><label>Nombre / número del grupo</label><input id="ec-grupo-nombre" maxlength="80"></div><div class="eem-field"><label>Tema</label><input id="ec-grupo-tema" maxlength="500"></div><div class="eem-scroll">'+r.candidatos.map(u=>'<label class="eem-integ"><input type="checkbox" class="ec-miembro" value="'+esc(u.id)+'" '+(u.id===r.yo?'checked disabled':'')+'><span>'+esc(u.grado+' '+u.nombre_completo)+'</span></label>').join('')+'</div><p id="ec-grupo-error" role="status"></p><button class="eem-btn sec" onclick="eemCerrarModal(\'ec-grupo\')">Cancelar</button> <button id="ec-grupo-guardar" class="eem-btn">Continuar a la entrega</button></div>';document.body.appendChild(bg);
 document.getElementById('ec-grupo-guardar').onclick=async()=>{const button=document.getElementById('ec-grupo-guardar');button.disabled=true;try{await api('grupo_crear',{carpeta_id:x.carpeta.id,nombre:val('ec-grupo-nombre'),tema:val('ec-grupo-tema'),integrantes:[...bg.querySelectorAll('.ec-miembro:checked')].map(e=>e.value)});eemCerrarModal('ec-grupo');await eemAbrirAlumno();const idx=EEM.alumno.findIndex(a=>a.carpeta.id===x.carpeta.id);eemDialogoEntrega(idx);}catch(e){document.getElementById('ec-grupo-error').textContent=e.message;button.disabled=false;}};
 }catch(e){alert(e.message);}};
let avisoSerie=0;
async function avisos(){const host=document.querySelector('#screen-cursante-home #cur-tab-inicio')||document.querySelector('#screen-cursante-home .cursante-container');if(!host||getSession()?.tipo!=='cursante')return;const id=++avisoSerie;try{const r=await api('avisos');if(id!==avisoSerie)return;document.getElementById('ec-avisos')?.remove();if(!r.avisos.length)return;const el=document.createElement('div');el.id='ec-avisos';el.innerHTML=r.avisos.map(a=>'<div class="eem-card" style="border:2px solid #d4af37"><h3>📢 Entrega pendiente — '+esc(a.materia)+'</h3><p>Entregue su trabajo hasta el <b>'+esc(new Date(a.fecha_limite).toLocaleString('es-BO',{timeZone:'America/La_Paz',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}))+' (hora de Bolivia)</b>.</p><p class="eem-sub">Este aviso desaparece cuando su entrega queda registrada a su nombre.</p><button class="eem-btn" onclick="eemAbrirAlumno()">Entregar trabajo</button></div>').join('');host.prepend(el);}catch(e){console.warn('Avisos de evaluación:',e.message);}}
window.eemActualizarAvisos=avisos;
const prev=window.showScreen;window.showScreen=function(id){const r=prev.apply(this,arguments);if(id==='screen-cursante-home')setTimeout(avisos,100);return r;};
setInterval(()=>{if(document.getElementById('screen-cursante-home')?.classList.contains('active'))avisos();},30000);
const originalMateria=window.goAulaMateriaCursante;
if(originalMateria)window.goAulaMateriaCursante=function(){const r=originalMateria.apply(this,arguments);document.getElementById('ec-materia-entrega')?.remove();
 if(/elaboraci[oó]n de planes/i.test(document.getElementById('aula-mat-titulo')?.textContent||'')){const el=document.createElement('div');el.id='ec-materia-entrega';el.className='eem-card';el.innerHTML='<h3>Evaluación sumativa — Elaboración de Planes</h3><p>Entrega hasta el 12-OCT-2026 a las 08:00 (hora de Bolivia).</p><button class="eem-btn" onclick="eemAbrirAlumno()">Entregar mi trabajo / ver acuse</button>';document.querySelector('#screen-aula-materia .cursante-container')?.prepend(el);}return r;};
const originalCarpeta=window.avAbrirCarpeta;
if(originalCarpeta)window.avAbrirCarpeta=async function(){const r=await originalCarpeta.apply(this,arguments);document.getElementById('ec-docente-entrega')?.remove();if(AV.data?.carpeta?.materia_codigo==='EM-AU-EP-03'){const el=document.createElement('div');el.id='ec-docente-entrega';el.className='eem-card';el.innerHTML='<h3>Evaluación sumativa y trabajos recibidos</h3><button class="eem-btn" onclick="eemAbrirCarpetas()">Abrir entregas centralizadas y tribunales</button>';document.getElementById('avc-sub')?.parentNode.appendChild(el);}return r;};
window.eemAdaptarActa=function(doc,a){
 const sum=xs=>(xs||[]).reduce((n,x)=>n+Number(x.valor_pct),0),f=sum(a.forma),b=sum(a.fondo),e=sum(a.exposicion);
 if(f===20&&b===45&&e===35)return;
 const body=doc.getElementsByTagName('w:body')[0];const tablas=[...body.childNodes].filter(x=>x.nodeName==='w:tbl');
 const texto=x=>[...x.getElementsByTagName('w:t')].map(n=>n.textContent).join(' ');
 const cell=(text,span=1)=>'<w:tc><w:tcPr>'+(span>1?'<w:gridSpan w:val="'+span+'"/>':'')+'<w:tcW w:w="'+(span>1?9700:1200)+'" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="60"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">'+esc(text)+'</w:t></w:r></w:p></w:tc>';
 const row=cells=>'<w:tr>'+cells.map(x=>cell(x)).join('')+'</w:tr>';
 const titulo=t=>'<w:tr>'+cell(t,4)+'</w:tr>';
 function table(title,items,total,extra=''){
  let sub='';const rows=items.map(x=>{let h='';if(x.sub_bloque&&sub!==x.sub_bloque){sub=x.sub_bloque;h=titulo(sub+' ('+sum(items.filter(y=>y.sub_bloque===sub))+'%)');}return h+row([x.orden,x.descripcion,x.valor_pct+'%','']);}).join('');
  const xml='<w:tbl xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:tblPr><w:tblW w:w="9700" w:type="dxa"/><w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(x=>'<w:'+x+' w:val="single" w:sz="4"/>').join('')+'</w:tblBorders></w:tblPr><w:tblGrid>'+[500,6800,1200,1200].map(w=>'<w:gridCol w:w="'+w+'"/>').join('')+'</w:tblGrid>'+titulo(title)+row(['N.º','CRITERIO','VALOR','NOTA'])+rows+row(['','PROMEDIO PARCIAL',total+'%',''])+extra+'</w:tbl>';
  const parsed=new DOMParser().parseFromString(xml,'application/xml');return doc.importNode(parsed.documentElement,true);
 }
 const specs=[['ASPECTOS DE FORMA','ASPECTOS DE FORMA ('+f+'%)',a.forma,f,''],['ASPECTOS DE FONDO','ASPECTOS DE FONDO ('+b+'%)',a.fondo,b,row(['','ASPECTOS DE FORMA',f+'%',''])+row(['','ASPECTO DE FONDO',b+'%',''])+row(['','TOTAL PARCIAL',(f+b)+'%',''])],['EXPOSICION, DEFENSA','EXPOSICION, DEFENSA Y VERIFICACION PRESENCIAL ('+e+'%)',a.exposicion,e,row(['','TOTAL PARCIAL GRUPAL',e+'%',''])]];
 for(const [match,title,items,total,extra] of specs){const target=tablas.find(t=>texto(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().includes(match));if(target)target.parentNode.replaceChild(table(title,items,total,extra),target);}
 const materia=a.carpeta?.materia||a.config?.unidad_competencia||'ELABORACIÓN DE PLANES';
 for(const n of doc.getElementsByTagName('w:t')){if(/ESTUDIO DE ESTADO MAYOR/i.test(n.textContent))n.textContent=n.textContent.replace(/ESTUDIO DE ESTADO MAYOR/gi,materia);if(n.textContent.trim()==='65%')n.textContent=(f+b)+'%';if(n.textContent.trim()==='35%')n.textContent=e+'%';}
};
/* EPLA — SOLO ÍTEM 1 GRUPAL. Ítems 2, 3 y 4 individuales.
   La API del tribunal mantiene sus notas por cursante y su auditoría. */
(function configurarExposicionEpla(){
 const nombres=[
  'Impresión prolija (Tamaño y tipo de papel).',
  'Tienen conocimiento, exponen y sustentan su trabajo con coherencia y metodología de planeamiento.',
  'Emplean adecuadamente las técnicas de plataforma.',
  'Responden con coherencia y seguridad a las preguntas realizadas por el tribunal.'
 ];
 const etiquetas=[
  ['IMPRESIÓN PROLIJA','Tamaño y tipo de papel'],
  ['CONOCIMIENTO Y SUSTENTO','Metodología de planeamiento'],
  ['TÉCNICAS DE PLATAFORMA','Empleo adecuado'],
  ['RESPUESTAS AL TRIBUNAL','Coherencia y seguridad']
 ];
 const cuatro=v=>v==null||v===''?'':Number(v).toFixed(4);
 const activo=()=>window.TRB?.grilla?.items?.length===4 &&
  [2,15,10,10].every((n,i)=>Number(TRB.grilla.items[i].valor)===n);
 const visible=el=>el && getComputedStyle(el).display!=='none';
 function totalCuatro(host){
  host.querySelectorAll('.trb-total').forEach(el=>{
   const txt=el.textContent;
   el.textContent=txt.replace(/\d+(?:\.\d+)?/g,x=>cuatro(x));
  });
 }
 function pintar(){
  const host=document.getElementById('trb-grilla-cont');
  if(!host||!activo())return;
  const tabla=host.querySelector('table.trb-grilla');
  if(!tabla||tabla.dataset.eplaUno==='1')return;
  tabla.dataset.eplaUno='1';
  const gr=TRB.grilla,items=gr.items,filas=gr.filas||[];
  const th=tabla.querySelectorAll('thead th');
  items.forEach((item,i)=>{
   const h=th[i+1];if(!h)return;
   h.title=nombres[i];
   h.innerHTML='<span class="epla-enc-n">'+
     'ÍTEM '+item.orden+'</span><span class="epla-enc-2">'+
     etiquetas[i][0]+'</span><span class="epla-enc-2">'+
     etiquetas[i][1]+'</span><span class="epla-enc-valor">/'+cuatro(item.valor)+'</span>';
  });
  if(th[items.length+1])th[items.length+1].innerHTML='TOTAL<span class="epla-enc-valor">/37.0000</span>';
  const css=document.createElement('style');
  css.textContent='.trb-grilla th .epla-enc-n{display:block;color:#f2d786;font-size:11px}'+
   '.trb-grilla th .epla-enc-2{display:block;white-space:normal!important;line-height:1.4;font-size:10.5px;font-weight:600;padding:1px 3px;overflow-wrap:break-word}'+
   '.trb-grilla th .epla-enc-valor{display:block;margin-top:5px;color:#a9b9cf;font-size:11px}'+
   '.trb-grilla .epla-unica{position:relative;min-width:105px;vertical-align:middle;background:rgba(212,175,55,.08);border-left:2px solid #d4af37;border-right:2px solid #d4af37}'+
   '.trb-grilla .epla-unica-contenido{position:absolute;inset:6px;display:flex;flex-direction:column;gap:5px;align-items:stretch;justify-content:center}'+
   '.trb-grilla .epla-unica input{box-sizing:border-box;width:100%;max-width:none;flex:1;min-height:48px;height:100%;text-align:center;font-size:17px;font-weight:bold;color:#f9df91;border:1px solid #b2923f;border-radius:9px;background:#141b2b}'+
   '.trb-grilla .epla-unica small{font-size:10px;color:#e8d79a;text-align:center}'+
   '.trb-grilla thead th{white-space:normal;vertical-align:middle;padding:8px 5px}'+
   '.trb-grilla .trb-in[readonly]{opacity:.82}'+
   '.epla-movil-grupal{display:none}@media(max-width:760px){.epla-movil-grupal{display:block}}';
  host.appendChild(css);
  const bloqueado=filas.some(f=>!f.ausencia&&f.cerrado);
  const normal=Array.from(tabla.tBodies[0]?.querySelectorAll('tr[data-fila]')||[]);
  const ausentes=filas.some(f=>f.ausencia);
  const notas=filas.filter(f=>!f.ausencia).map(f=>f.notas?.['1']).filter(x=>x!==null&&x!==undefined&&x!=='');
  const distintas=notas.length && !notas.every(x=>Number(x)===Number(notas[0]));
  const entrada=document.createElement('input');entrada.className='epla-nota-1';
  entrada.inputMode='decimal';entrada.setAttribute('aria-label','Nota grupal Ítem 1: Impresión prolija, máximo 2.0000');
  entrada.placeholder=distintas?'DIFERENTES':'0.0000';entrada.readOnly=bloqueado;
  if(notas.length&&!distintas)entrada.value=cuatro(notas[0]);
  function aplicar(){
   const t=entrada.value.replace(',','.').trim();
   if(t!==''&&(!/^\d+(?:\.\d{0,4})?$/.test(t)||Number(t)>2)){
    entrada.style.borderColor='#ef6464';return;
   }
   entrada.style.borderColor='';
   if(bloqueado)return;
   for(const f of filas){
    if(f.ausencia||f.cerrado)continue;
    // La lógica original valida, recalcula y guarda cada fila con su cursante_id.
    window.trbCambio({
     dataset:{c:String(f.cursante_id),i:'1',max:'2',mitad:String(items[0].mitad)},
     value:t,
     classList:{remove(){},add(){},toggle(){}}
    });
   }
   totalCuatro(host);
   host.querySelectorAll('.trb-tarjetas input.trb-in[data-i="1"]').forEach(inp=>{
    const f=filas.find(x=>String(x.cursante_id)===inp.dataset.c);
    if(f&&!f.ausencia)inp.value=t===''?'':cuatro(t);
   });
  }
  entrada.addEventListener('input',aplicar);
  entrada.addEventListener('blur',()=>{if(entrada.style.borderColor===''&&entrada.value.trim()!=='')entrada.value=cuatro(entrada.value.replace(',','.'));});
  function contenedor(){
   const box=document.createElement('div');box.className='epla-unica-contenido';
   const label=document.createElement('small');label.textContent='GRUPAL · 2.0000';
   box.appendChild(label);box.appendChild(entrada);return box;
  }
  if(normal.length&&normal.length===filas.length&&!ausentes){
   // Fusión REAL de la primera columna de puntaje entre los alumnos.
   const celda=normal[0].cells[1];
   if(celda){
    celda.classList.add('epla-unica');
    celda.replaceChildren(contenedor());
    for(let n=1;n<normal.length;n++){const c=normal[n].cells[1];if(c)c.remove();}
    // Las observaciones de notas bajas ocupan solo columnas libres.
    const obs=Array.from(tabla.tBodies[0].querySelectorAll('tr[id^="trb-obsfila-"]'));
    obs.forEach(row=>{
     const c=row.cells[0];if(!c)return;
     c.colSpan=1;
     const contenido=document.createElement('td');contenido.colSpan=5;
     while(c.firstChild)contenido.appendChild(c.firstChild);
     row.appendChild(contenido);
    });
    const ajustar=()=>{
     let visibleObs=0;
     obs.forEach(r=>{if(visible(r))visibleObs++;});
     const span=normal.length+visibleObs;
     if(celda.rowSpan!==span)celda.rowSpan=span;
    };
    ajustar();
    const mo=new MutationObserver(ajustar);
    obs.forEach(r=>mo.observe(r,{attributes:true,attributeFilter:['style','class']}));
   }
  }else{
   // Si falta un integrante, evitar un rowspan que afecte la fila de ausencia.
   const row=tabla.tBodies[0].insertRow(0);
   const td=document.createElement('td');td.colSpan=7;td.className='epla-unica';
   td.style.height='100px';td.appendChild(contenedor());row.appendChild(td);
   normal.forEach(r=>{const i=r.querySelector('input.trb-in[data-i="1"]');if(i)i.readOnly=true;});
  }
  // Ítems 2, 3, 4 conservan TODOS los campos individuales y sus botones.
  host.querySelectorAll('input.trb-in[data-i="1"]').forEach(inp=>{
   inp.readOnly=true;
   if(inp.value.trim()!=='')inp.value=cuatro(inp.value.replace(',','.'));
  });
  host.querySelectorAll('input.trb-in[data-i="2"],input.trb-in[data-i="3"],input.trb-in[data-i="4"]').forEach(inp=>{
   if(inp.value.trim()!=='')inp.value=cuatro(inp.value.replace(',','.'));
  });
  host.querySelectorAll('.trb-tarjetas input.trb-in[data-i="1"]').forEach(inp=>{
   const lin=inp.closest('.lin');if(lin)lin.style.display='none';
  });
  // Una sola casilla grupal también en móviles, sin duplicar entradas individuales.
  const tarjetas=host.querySelector('.trb-tarjetas');
  if(tarjetas){
   const mov=document.createElement('div');mov.className='trb-card epla-movil-grupal';
   mov.innerHTML='<h3>ÍTEM 1 — IMPRESIÓN PROLIJA</h3><div class="trb-sub">Nota única para todos los integrantes · /2.0000</div>';
   const copia=document.createElement('input');copia.className='trb-in';copia.inputMode='decimal';copia.placeholder=entrada.placeholder;
   copia.style.cssText='display:block;width:100%;height:70px;margin-top:8px;font-size:18px;text-align:center';
   copia.value=entrada.value;copia.readOnly=bloqueado;
   copia.oninput=()=>{entrada.value=copia.value;entrada.dispatchEvent(new Event('input'));};
   copia.onblur=()=>{entrada.dispatchEvent(new Event('blur'));copia.value=entrada.value;};
   mov.appendChild(copia);tarjetas.parentNode.insertBefore(mov,tarjetas);
   entrada.addEventListener('input',()=>{if(document.activeElement!==copia)copia.value=entrada.value;});
  }
  // Convertir a cuatro decimales los totales ya presentes.
  totalCuatro(host);
  // Tras calificar 2/3/4, la aplicación recalcula totales: mantener presentación 4D.
  const totales=new MutationObserver(()=>totalCuatroSinMutacion(host));
  function totalCuatroSinMutacion(h){
   h.querySelectorAll('.trb-total').forEach(el=>{
    const nuevo=el.textContent.replace(/\d+(?:\.\d+)?/g,x=>cuatro(x));
    if(nuevo!==el.textContent)el.textContent=nuevo;
   });
  }
  totales.observe(host,{childList:true,subtree:true,characterData:true});
 }
 let observador=null;
 function iniciar(){
  const host=document.getElementById('trb-grilla-cont');
  if(!host||observador)return;
  observador=new MutationObserver(pintar);
  observador.observe(host,{childList:true});
  pintar();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
 else iniciar();
})();

})();
