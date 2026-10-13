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
 items.forEach(x=>{x.orden=++order[x.bloque];x.modo_calificacion=x.bloque==='EXPOSICION'?'humano':'ia';x.alcance=x.bloque==='EXPOSICION'&&x.orden!==1?'individual':'grupal';});
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
/* EPLA: únicamente el Ítem 1 es GRUPAL.
   Los ítems 2, 3 y 4 conservan edición individual. */
(function eplaPresentacionGrupal(){
 const nombres=[
  'Impresión prolija (Tamaño y tipo de papel).',
  'Tienen conocimiento, exponen y sustentan su trabajo con coherencia y metodología de planeamiento.',
  'Emplean adecuadamente las técnicas de plataforma.',
  'Responden con coherencia y seguridad a las preguntas realizadas por el tribunal.'
 ];
 const titulos=[
  ['ÍTEM 1 — Impresión prolija','Tamaño y tipo de papel'],
  ['ÍTEM 2 — Tienen conocimiento, exponen y sustentan','con coherencia y metodología de planeamiento'],
  ['ÍTEM 3 — Emplean adecuadamente','las técnicas de plataforma'],
  ['ÍTEM 4 — Responden con coherencia y seguridad','a las preguntas realizadas por el tribunal']
 ];
 const cuatro=v=>v===null||v===undefined||v===''?'':Number(v).toFixed(4);
 const activo=()=>window.TRB?.grilla?.items?.length===4 &&
  [2,15,10,10].every((max,i)=>Number(TRB.grilla.items[i].valor)===max);
 function total(f){
  let v=0;
  for(const item of TRB.grilla.items){
   const n=f.notas?.[String(item.orden)];
   if(n===null||n===undefined||n==='')return null;
   v+=Number(n);
  }
  return v;
 }
 function actualizarTotales(host){
  for(const f of TRB.grilla.filas||[]){
   if(f.ausencia)continue;
   const n=total(f);
   const txt=n===null?'—':cuatro(n);
   const desktop=host.querySelector('[id="trb-tot-'+f.cursante_id+'"]');
   const movil=host.querySelector('[id="trb-totm-'+f.cursante_id+'"]');
   if(desktop)desktop.textContent=txt;
   if(movil)movil.textContent=txt+' / 37.0000';
  }
 }
 function pintar(){
  const host=document.getElementById('trb-grilla-cont');
  if(!host||!activo())return;
  const tabla=host.querySelector('table.trb-grilla');
  if(!tabla||tabla.dataset.eplaSoloPrimero==='1')return;
  tabla.dataset.eplaSoloPrimero='1';
  const gr=TRB.grilla,filas=gr.filas||[],items=gr.items;
  const thead=tabla.querySelectorAll('thead th');
  items.forEach((item,i)=>{
   const th=thead[i+1];if(!th)return;
   th.style.cssText+=';min-width:'+(i===0?170:255)+'px;white-space:normal;vertical-align:middle;line-height:1.35;padding:8px 7px';
   th.title=nombres[i];
   th.textContent='';
   titulos[i].forEach((line,j)=>{
    const span=document.createElement('span');
    span.style.cssText='display:block;font-size:11px;font-weight:'+(j===0?'800':'500')+';white-space:normal';
    span.textContent=line+(j===1?' / '+cuatro(item.valor):'');
    th.appendChild(span);
   });
  });
  const thTotal=thead[items.length+1];if(thTotal)thTotal.textContent='TOTAL / 37.0000';
  const tbody=tabla.tBodies[0];if(!tbody)return;
  const rows=Array.from(tbody.rows);
  const primero=rows.findIndex(r=>r.hasAttribute('data-fila'));
  if(primero<0)return;
  const bloqueado=filas.some(f=>f.cerrado&&!f.ausencia);
  const activos=filas.filter(f=>!f.ausencia);
  const grupo=document.createElement('td');
  grupo.rowSpan=rows.length-primero;
  grupo.className='trb-epla-grupo';
  grupo.style.cssText='text-align:center;vertical-align:middle;background:rgba(212,175,55,.07);border-left:2px solid rgba(212,175,55,.35);min-width:170px';
  const label=document.createElement('label');
  label.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;min-height:'+Math.max(132,activos.length*54)+'px';
  label.innerHTML='<b style="color:#e8d79a;font-size:12px">ÍTEM 1 — GRUPAL</b><span style="font-size:11px;color:#aebbd1">Presentación / 2.0000</span>';
  const campo=document.createElement('input');
  campo.className='trb-in';
  campo.inputMode='decimal';
  campo.setAttribute('aria-label','Nota grupal de impresión prolija, ítem 1');
  campo.style.cssText='width:95%;max-width:145px;min-height:'+Math.max(82,activos.length*34)+'px;font-size:18px;font-weight:700;text-align:center;box-sizing:border-box';
  campo.placeholder='0.0000';campo.readOnly=bloqueado;
  const existentes=activos.map(f=>f.notas?.[String(items[0].orden)]).filter(v=>v!==null&&v!==undefined&&v!=='');
  if(existentes.length&&existentes.every(v=>Number(v)===Number(existentes[0])))campo.value=cuatro(existentes[0]);
  else if(existentes.length){campo.placeholder='DIFERENTES';campo.title='Hay notas previas diferentes; confirme antes de reemplazarlas por una grupal.';}
  function asignar(){
   const txt=campo.value.replace(',','.').trim();
   if(txt!==''&&(!/^\d+(?:\.\d{0,4})?$/.test(txt)||Number(txt)>2)){
    campo.classList.add('mal');return;
   }
   campo.classList.remove('mal');
   if(bloqueado)return;
   const valor=txt===''?'':Number(txt);
   for(const f of activos){
    const selector='input.trb-in[data-c="'+CSS.escape(String(f.cursante_id))+'"][data-i="1"]';
    const original=host.querySelector('.trb-tarjetas '+selector);
    if(original){
     original.value=valor===''?'':cuatro(valor);
     window.trbCambio(original);
    }
   }
   actualizarTotales(host);
  }
  campo.addEventListener('input',asignar);
  campo.addEventListener('blur',()=>{if(!campo.classList.contains('mal')&&campo.value.trim()!=='')campo.value=cuatro(campo.value.replace(',','.'));});
  label.appendChild(campo);grupo.appendChild(label);
  for(let i=primero;i<rows.length;i++){
   const row=rows[i];
   if(row.hasAttribute('data-fila')){
    const celda=row.children[1];
    if(i===primero)celda.replaceWith(grupo);
    else celda.remove();
   }else if(row.classList.contains('trb-ausente')){
    if(row.children[1])row.children[1].colSpan=4;
   }else if(row.id.startsWith('trb-obsfila-')){
    const observacion=row.children[0];
    if(observacion){
     const blanco=document.createElement('td');
     blanco.style.cssText='border:0;background:transparent';
     row.insertBefore(blanco,observacion);
     observacion.colSpan=5;
    }
   }
  }
  // Edición individual normal intacta en Ítems 2, 3 y 4.
  host.querySelectorAll('.trb-tarjetas input.trb-in').forEach(input=>{
   if(input.dataset.i==='1'){
    input.readOnly=true;
    input.parentElement?.querySelectorAll('button').forEach(b=>b.style.display='none');
   }
   if(input.value.trim()!=='')input.value=cuatro(input.value.replace(',','.'));
  });
  host.querySelectorAll('table.trb-grilla input.trb-in[data-i]').forEach(input=>{
   if(input.value.trim()!=='')input.value=cuatro(input.value.replace(',','.'));
   if(input.dataset.i!=='1')input.addEventListener('blur',()=>{
    if(input.value.trim()!=='')input.value=cuatro(input.value.replace(',','.'));
   });
  });
  // Refrescar los totales a cuatro decimales tras la edición individual.
  host.addEventListener('input',event=>{
   const el=event.target;
   if(el instanceof HTMLInputElement&&el.matches('.trb-in[data-i]'))
    queueMicrotask(()=>actualizarTotales(host));
  });
  actualizarTotales(host);
  // Control de grupo en móvil, donde la tabla grande suele estar oculta.
  const tarjetas=host.querySelector('.trb-tarjetas');
  if(tarjetas){
   const caja=document.createElement('div');
   caja.className='trb-card trb-epla-grupo-movil';
   caja.style.display='none';
   caja.innerHTML='<h3>ÍTEM 1 — GRUPAL / 2.0000</h3><p class="trb-sub">Impresión prolija (tamaño y tipo de papel). Una sola nota para todo el grupo.</p>';
   const mobile=campo.cloneNode();
   mobile.value=campo.value;mobile.style.cssText='width:100%;max-width:220px;min-height:75px;font-size:18px;text-align:center';
   mobile.addEventListener('input',()=>{campo.value=mobile.value;campo.dispatchEvent(new Event('input'));});
   mobile.addEventListener('blur',()=>{campo.dispatchEvent(new Event('blur'));mobile.value=campo.value;});
   campo.addEventListener('input',()=>{if(document.activeElement!==mobile)mobile.value=campo.value;});
   caja.appendChild(mobile);
   tarjetas.parentNode.insertBefore(caja,tarjetas);
   const estilo=document.createElement('style');
   estilo.textContent='@media(max-width:760px){.trb-epla-grupo-movil{display:block!important}}';
   caja.appendChild(estilo);
  }
 }
 let observador;
 function iniciar(){
  const host=document.getElementById('trb-grilla-cont');
  if(!host||observador)return;
  observador=new MutationObserver(()=>pintar());
  observador.observe(host,{childList:true,subtree:true});
  pintar();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
 else iniciar();
})();

})();
