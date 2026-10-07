import {calificar,edad} from './baremos.mjs';
const names={flexiones:'FLEXIONES',abdominales:'ABDOMINALES',aerobica:'AERÓBICA 3.200 M',natacion:'NATACIÓN',barras:'BARRAS · EXCELENCIA'};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/La_Paz'}).format(new Date());
const clock=ms=>{const s=Math.max(0,Math.floor(ms/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
export async function abrir({invoke,onClose,owner,authorized=()=>true}){
 let root=document.getElementById('efmc');if(root)root.remove();
 root=document.createElement('div');root.id='efmc';document.body.append(root);
 let alive=true,roster=[],records=[],selected=null,prueba='flexiones',fecha=date(),ciclo='1ER CICLO',search='',value='',sex='M',birth='',busy=false,tab='estacion',error='',success='';
 let timer={running:false,start:0,elapsed:0,alarm:false},run={running:false,start:0,elapsed:0,laps:[],group:[]},audio,wake,alarmPlayer,soundReady=false;
 const key='efmc_prueba_borrador_'+owner;
 try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved){run=saved.run||run;fecha=saved.fecha||fecha;}}catch{}
 const saveDraft=()=>{try{localStorage.setItem(key,JSON.stringify({run,fecha}));}catch{error='EL NAVEGADOR NO PUDO RESPALDAR LAS LLEGADAS.';}};
 const fmt=ms=>clock(ms)+'.'+String(Math.floor((ms%1000)/10)).padStart(2,'0');
 const elapsed=t=>t.elapsed+(t.running?Date.now()-t.start:0);
 const cur=()=>roster.find(x=>x.id===selected);
 const latest=(id,p)=>records.find(r=>r.cursante_id===id&&r.prueba===p);
 const filtered=()=>roster.filter(x=>x.ciclo===ciclo&&x.nombre_completo.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().includes(search.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()));
 function photo(c){return c.foto?`<img loading="lazy" src="${esc(c.foto)}" alt="RETRATO DE ${esc(c.nombre_completo)}">`:`<span class="efmc-avatar">${esc(c.nombre_completo.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span>`;}
 function unlockSound(){
  // Called directly in the tap handler: iOS requires this before any await.
  alarmPlayer??=new Audio(new URL('./alarma.wav',import.meta.url).href);alarmPlayer.preload='auto';alarmPlayer.volume=1;
  const AudioAPI=window.AudioContext||window.webkitAudioContext;if(!AudioAPI)return alarmPlayer;audio??=new AudioAPI();
  audio.resume().catch(()=>{});
  const o=audio.createOscillator(),g=audio.createGain();g.gain.value=0;o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.02);
  return alarmPlayer;
 }
 async function sound(){
  try{const player=unlockSound();player.currentTime=0;await player.play();soundReady=true;}
  catch{try{await audio?.resume();if(audio?.state!=='running')throw Error();for(let i=0;i<6;i++){const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=i%2?1100:880;g.gain.value=.3;const start=audio.currentTime+i*.4;o.start(start);o.stop(start+.28);}soundReady=true;}catch{soundReady=false;error='NO SE PUDO ACTIVAR EL SONIDO. TOCÁ PROBAR ALARMA Y REVISÁ EL VOLUMEN.';}}
  navigator.vibrate?.([400,150,400,150,400]);
 }
 function ring(){const remaining=Math.max(0,120000-elapsed(timer)),percent=remaining/120000*100;
  return `<div class="efmc-ring" id="efmc-ring" style="--remaining:${percent}%" data-phase="${remaining<=10000?'end':remaining<=30000?'warn':'normal'}"><div><small>TIEMPO RESTANTE</small><output id="efmc-time" aria-live="off">${clock(remaining)}</output><span id="efmc-timer-state">${timer.alarm?'TIEMPO CUMPLIDO':timer.running?'EN CURSO':timer.elapsed?'EN PAUSA':'LISTO PARA INICIAR'}</span></div></div>`;
 }
 async function hold(){try{await audio?.resume();wake=await navigator.wakeLock?.request('screen');}catch{}}
 function stop(t){t.elapsed=elapsed(t);t.running=false;}
 function select(id){if(timer.running){error='PAUSÁ EL TEMPORIZADOR ANTES DE CAMBIAR DE CURSANTE.';render();return;}selected=id;const c=cur();if(c)ciclo=c.ciclo;birth=c?.fecha_nacimiento||'';sex=c?.sexo||'M';value='';timer={running:false,start:0,elapsed:0,alarm:false};error='';success='';render();}
 async function load(){busy=true;render();try{const r=await invoke({accion:'cargar',fecha});if(!alive)return;roster=r.cursantes;records=r.registros;error='';}catch(e){error=e.message;}finally{busy=false;if(alive)render();}}
 let pending=null;
 async function register(p,id,v,s,b){
  if(busy)return false;if(pending&&(pending.prueba!==p||pending.cursante_id!==id||pending.valor!==v||pending.sexo!==s||pending.nacimiento!==b)){error='REINTENTÁ LA MARCA PENDIENTE ANTES DE REGISTRAR OTRA.';render();return false;}busy=true;error='';success='';render();
  const body={accion:'registrar',id:pending?.id||crypto.randomUUID(),prueba:p,cursante_id:id,valor:v,sexo:s,nacimiento:b,fecha};
  pending=body;
  try{const r=await invoke(body);records=[r.registro,...records.filter(x=>x.id!==r.registro.id)];pending=null;const person=roster.find(x=>x.id===id);if(person){person.sexo=s;person.fecha_nacimiento=b;}success='GUARDADO EN SUPABASE · SOLO PRUEBA';return true;}catch(e){error=e.message;return false;}finally{busy=false;render();}
 }
 function render(){
  if(!alive)return;root.className=selected?'efmc-selected':'';const c=cur(),calc=c&&value!==''?calificar(prueba,Number(value),sex,birth,fecha):null;
  const status=calc?.nota!=null?`<strong>${calc.nota}</strong><span>NOTA / 100</span>`:calc?.requisito?`<strong>${calc.requisito}</strong><span>REQUISITO · ${calc.cumple?'CUMPLE':'NO CUMPLE'}</span>`:`<span>${esc(calc?.motivo||'INGRESÁ LA MARCA')}</span>`;
  root.innerHTML=`<div class="efmc-shell"><header><div class="efmc-brand"><img src="escudo-eceme.png" alt="ECEME"><div><small>SIDE-CEME / ENTRENAMIENTO FÍSICO</small><h1>CONTROL DE EVALUACIÓN</h1></div></div><button data-action="close" aria-label="CERRAR">✕</button></header><div class="efmc-banner"><span>● ENTORNO DE PRUEBA</span><span>TCNL. MORALES · VISTA DE TODAS LAS PRUEBAS</span></div><div class="efmc-toolbar"><label>FECHA DE EVALUACIÓN<input id="efmc-date" type="date" value="${fecha}" ${busy||run.running?'disabled':''}></label><label>CICLO DEL CURSANTE<select id="efmc-cycle" ${selected?'disabled':''}><option ${ciclo==='1ER CICLO'?'selected':''}>1ER CICLO</option><option ${ciclo==='2DO CICLO'?'selected':''}>2DO CICLO</option></select></label><button data-action="reload" ${busy?'disabled':''}>↻ ACTUALIZAR</button></div><nav>${Object.entries(names).map(([p,n])=>`<button data-test="${p}" class="${p===prueba&&tab==='estacion'?'chosen':''}">${n}</button>`).join('')}<button data-action="sheet" class="${tab==='hoja'?'chosen':''}">HOJA INDIVIDUAL</button></nav><p class="efmc-message" role="status">${esc(error||success||(busy?'CARGANDO…':''))}</p>${pending?'<button data-action="retry">REINTENTAR MARCA PENDIENTE</button>':''}${tab==='hoja'?sheet(c):prueba==='aerobica'?aerobic():`<div class="efmc-grid"><aside><div class="efmc-section-title">RELACIÓN NOMINAL <b>${filtered().length}</b></div><input id="efmc-search" value="${esc(search)}" placeholder="BUSCAR CURSANTE" aria-label="BUSCAR CURSANTE"><div class="efmc-roster">${filtered().map(x=>`<button data-student="${x.id}" class="${x.id===selected?'chosen':''}">${photo(x)}<span><b>${esc(x.nombre_completo)}</b><small>${esc(x.grado)} · ${esc(x.paralelo)}${latest(x.id,prueba)?' · ✓ REGISTRADO':''}</small></span></button>`).join('')}</div></aside><main>${c?`<div class="efmc-person">${photo(c)}<div><small>${esc(c.grado)} · ${esc(c.ciclo)} · CURSO ${esc(c.paralelo)}</small><h2>${esc(c.nombre_completo)}</h2><div class="efmc-age"><b>${edad(birth,fecha)??'—'}</b> AÑOS <span>AL ${esc(fecha.split('-').reverse().join('/'))}</span></div><p class="efmc-birthday">NACIMIENTO: ${birth?esc(birth.split('-').reverse().join('/')):'PENDIENTE'}</p></div></div><button data-action="change-student" style="margin-top:12px">CAMBIAR CURSANTE</button><div class="efmc-fields"><label>FECHA DE NACIMIENTO<input id="efmc-birth" type="date" value="${esc(birth)}" ${busy?'disabled':''}></label><label>SEXO · TABLA DE EVALUACIÓN<select id="efmc-sex" ${busy?'disabled':''}><option value="M" ${sex==='M'?'selected':''}>MASCULINA</option><option value="F" ${sex==='F'?'selected':''}>FEMENINA</option></select></label></div>${['flexiones','abdominales'].includes(prueba)?`<div class="efmc-timer"><small>TEMPORIZADOR · 2 MINUTOS</small>${ring()}<div><button data-action="timer">${timer.running?'PAUSAR':timer.elapsed>=120000?'FINALIZADO':timer.elapsed?'CONTINUAR':'▶ INICIAR'}</button><button data-action="reset">REINICIAR</button><button data-action="sound">PROBAR ALARMA</button></div><small>${soundReady?'SONIDO ACTIVADO · ' : 'PROBÁ EL SONIDO ANTES DE EVALUAR · '}MANTENÉ LA PANTALLA ABIERTA.</small></div>`:''}<div class="efmc-entry"><small>${prueba==='natacion'?'DISTANCIA EN METROS':'REPETICIONES'}</small><output id="efmc-value">${value||'—'}</output><div class="efmc-score">${status}</div></div><div class="efmc-pad">${['1','2','3','4','5','6','7','8','9','BORRAR','0','⌫'].map(k=>`<button data-key="${k}" ${busy||pending?'disabled':''}>${k}</button>`).join('')}</div><button class="efmc-primary" data-action="register" ${busy||value===''||!sex||!birth?'disabled':''}>${pending?'REINTENTAR GUARDADO':'REGISTRAR '+names[prueba]}</button>${latest(c.id,prueba)?`<p>ÚLTIMA MARCA: ${esc(latest(c.id,prueba).valor)} · ${esc(latest(c.id,prueba).calculo.nota??'PENDIENTE')} / 100</p>`:''}`:`<div class="efmc-empty"><span>◎</span><h2>${names[prueba]}</h2><p>SELECCIONÁ UN CURSANTE PARA INICIAR.</p></div>`}</main></div>`}<footer>ECEME · “MCAL. ANDRÉS DE SANTA CRUZ”<br>REGISTROS DE PRUEBA · PESO–TALLA Y NOTA FINAL PENDIENTES</footer></div>`;
  root.querySelectorAll('img').forEach(img=>img.onerror=()=>{const fallback=document.createElement('span');fallback.className='efmc-avatar';fallback.textContent='SIN FOTO';img.replaceWith(fallback);});
  bind();
 }
 function sheet(c){return `<div class="efmc-sheet"><label>CURSANTE<select id="efmc-sheet-student"><option value="">SELECCIONAR</option>${filtered().map(x=>`<option value="${x.id}" ${selected===x.id?'selected':''}>${esc(x.nombre_completo)}</option>`).join('')}</select></label>${c?`<div class="efmc-person">${photo(c)}<div><h2>${esc(c.nombre_completo)}</h2><p>${esc(c.ciclo)} · CURSO ${esc(c.paralelo)} · ${fecha}</p></div></div><h3>HOJA DE EVALUACIÓN DEL EXAMEN FÍSICO MILITAR</h3><div class="efmc-table-wrap"><table><thead><tr><th>PRUEBA</th><th>MARCA</th><th>NOTA</th><th>PESO</th><th>APORTE</th></tr></thead><tbody><tr><td>PESO–TALLA</td><td>—</td><td>PENDIENTE</td><td>29 %</td><td>—</td></tr>${Object.entries(names).map(([p,n])=>{const r=latest(c.id,p),w=p==='natacion'?11:p==='barras'?0:20;return `<tr><td>${n}</td><td>${r?(p==='aerobica'?clock(Number(r.valor)*1000):esc(r.valor)): '—'}</td><td>${r?.calculo.nota??(r?'PENDIENTE':'—')}</td><td>${w?' '+w+' %':'REQUISITO'}</td><td>${r?.calculo.nota!=null&&w?(r.calculo.nota*w/100).toFixed(2):'—'}</td></tr>`;}).join('')}</tbody></table></div><p>NOTA FINAL: PENDIENTE. LA HOJA OFICIAL INCLUYE PESO–TALLA (29 %), VALORACIÓN MÉDICA Y FIRMAS.</p><p>LAS MARCAS ENTRE FILAS O FUERA DE LAS CELDAS DEL ANEXO SE CONSERVAN PARA REVISIÓN.</p>`:'<p>SELECCIONÁ UN CURSANTE PARA VER SUS REGISTROS.</p>'}</div>`;}
 function aerobic(){
  const used=new Set(run.laps.filter(x=>x.cursante).map(x=>x.cursante));
  return `<div class="efmc-race"><div class="efmc-section-title">SERIE DE AERÓBICA <b>${run.group.length} CURSANTES</b></div><details ${!run.laps.length&&!run.running?'open':''}><summary>SELECCIONAR EL GRUPO DE SALIDA</summary><p>ELEGÍ LOS CURSANTES DE ESTA SERIE. LAS LLEGADAS SE ASIGNAN A ESTE GRUPO.</p><div class="efmc-group">${filtered().map(c=>`<label><input type="checkbox" data-group="${c.id}" ${run.group.includes(c.id)?'checked':''} ${run.running||run.laps.length?'disabled':''}>${photo(c)}<span>${esc(c.nombre_completo)}</span></label>`).join('')}</div></details><div class="efmc-timer"><small>CRONÓMETRO ECEME · TIEMPOS ACUMULADOS</small><output id="efmc-race-time">${fmt(elapsed(run))}</output><div><button data-action="race-start" ${!run.group.length||busy?'disabled':''}>${run.running?'DETENER SERIE':'INICIAR / CONTINUAR'}</button><button data-action="race-new" ${busy?'disabled':''}>NUEVA SERIE</button></div></div><button class="efmc-primary efmc-lap" data-action="lap" ${!run.running||run.laps.length>=run.group.length?'disabled':''}>REGISTRAR LLEGADA ${run.laps.length+1}</button><p>PRIMERO TOMÁ LOS TIEMPOS. AL DETENER LA SERIE, ASIGNÁ CADA LLEGADA A SU CURSANTE.</p><div class="efmc-laps">${run.laps.map((l,i)=>`<div class="efmc-lap-row"><b>#${i+1}</b><strong>${fmt(l.ms)}</strong>${l.saved?`<span>✓ ${esc(roster.find(c=>c.id===l.cursante)?.nombre_completo)}</span>`:`<select data-lap="${i}" ${run.running||busy?'disabled':''}><option value="">IDENTIFICAR CURSANTE</option>${roster.filter(c=>run.group.includes(c.id)&&(!used.has(c.id)||c.id===l.cursante)).map(c=>`<option value="${c.id}" ${c.id===l.cursante?'selected':''}>${esc(c.nombre_completo)}</option>`).join('')}</select><button data-save-lap="${i}" ${!l.cursante||busy||run.running?'disabled':''}>GUARDAR</button>`}</div>`).join('')}</div></div>`;
 }
 function bind(){
  root.querySelectorAll('[data-student]').forEach(e=>e.onclick=()=>{if(!busy&&!pending)select(e.dataset.student);});
  root.querySelectorAll('[data-test]').forEach(e=>e.onclick=()=>{if(busy||pending||timer.running){error='TERMINÁ O GUARDÁ LA PRUEBA ACTUAL.';render();return;}prueba=e.dataset.test;tab='estacion';value='';timer={running:false,start:0,elapsed:0,alarm:false};render();});
  root.querySelectorAll('[data-key]').forEach(e=>e.onclick=()=>{const k=e.dataset.key;value=k==='BORRAR'?'':k==='⌫'?value.slice(0,-1):(value+k).slice(0,4);render();});
  const get=id=>root.querySelector('#'+id);
  get('efmc-search')?.addEventListener('input',e=>{search=e.target.value;const pos=e.target.selectionStart;render();get('efmc-search').focus();get('efmc-search').setSelectionRange(pos,pos);});
  get('efmc-cycle').onchange=e=>{if(timer.running||busy||pending){render();return;}ciclo=e.target.value;selected=null;search='';render();};
  get('efmc-date').onchange=e=>{if(run.laps.some(l=>!l.saved)||timer.running||pending){error='GUARDÁ LAS LLEGADAS ANTES DE CAMBIAR FECHA.';render();return;}fecha=e.target.value;selected=null;load();};
  get('efmc-sex')?.addEventListener('change',e=>{sex=e.target.value;render();});
  get('efmc-birth')?.addEventListener('change',e=>{birth=e.target.value;render();});
  get('efmc-sheet-student')?.addEventListener('change',e=>select(e.target.value));
  root.querySelectorAll('[data-group]').forEach(e=>e.onchange=()=>{run.group=e.checked?[...run.group,e.dataset.group]:run.group.filter(x=>x!==e.dataset.group);saveDraft();render();});
  root.querySelectorAll('[data-lap]').forEach(e=>e.onchange=()=>{run.laps[+e.dataset.lap].cursante=e.value;saveDraft();render();});
  root.querySelectorAll('[data-save-lap]').forEach(e=>e.onclick=async()=>{
   const l=run.laps[+e.dataset.saveLap],c=roster.find(x=>x.id===l.cursante);if(!c)return;
   selected=c.id;birth=c.fecha_nacimiento||'';sex=c.sexo||'M';
   if(!birth||!sex){const dlg=document.createElement('dialog');dlg.className='efmc-dialog';dlg.innerHTML=`<form><h3>${esc(c.nombre_completo)}</h3><label>FECHA DE NACIMIENTO<input name="birth" type="date" value="${esc(birth)}" required></label><label>SEXO · TABLA DE EVALUACIÓN<select name="sex" required><option value="M" ${sex==='M'?'selected':''}>MASCULINA</option><option value="F" ${sex==='F'?'selected':''}>FEMENINA</option></select></label><button type="submit">CONFIRMAR Y GUARDAR</button><button type="button">CANCELAR</button></form>`;root.append(dlg);dlg.showModal();dlg.querySelector('[type=button]').onclick=()=>dlg.remove();dlg.querySelector('form').onsubmit=async ev=>{ev.preventDefault();birth=dlg.querySelector('[name=birth]').value;sex=dlg.querySelector('[name=sex]').value;dlg.remove();await saveLap(l,c);};return;}
   await saveLap(l,c);
  });
  root.querySelectorAll('[data-action]').forEach(e=>e.onclick=async()=>{
   const a=e.dataset.action;
   if(a==='close'){if((timer.running||run.running||pending)&&!confirm('HAY UNA PRUEBA EN CURSO. ¿CERRAR?'))return;alive=false;clearInterval(tick);stop(timer);await wake?.release();alarmPlayer?.pause();audio?.close();root.remove();onClose();return;}
   if(a==='reload'){if(pending){error='REINTENTÁ EL GUARDADO ANTES DE ACTUALIZAR.';render();return;}return load();}
   if(a==='retry'&&pending){const b={...pending};const ok=await register(b.prueba,b.cursante_id,b.valor,b.sexo,b.nacimiento);if(ok&&b.prueba==='aerobica'){const l=run.laps.find(x=>x.cursante===b.cursante_id&&Math.floor(x.ms/1000)===b.valor);if(l)l.saved=true;saveDraft();render();}return;}
   if(a==='sheet'){if(timer.running||pending){error='PAUSÁ Y GUARDÁ LA PRUEBA ACTUAL.';render();return;}tab='hoja';render();return;}
   if(a==='sound'){await sound();if(soundReady)success='ALARMA REPRODUCIDA · CONFIRMÁ QUE LA ESCUCHÁS';render();return;}
   if(a==='change-student'){if(timer.running||pending){error='PAUSÁ Y GUARDÁ LA PRUEBA ACTUAL.';render();return;}selected=null;value='';render();return;}
   if(a==='timer'){if(timer.elapsed>=120000)return;if(timer.running)stop(timer);else{const activation=sound();timer.start=Date.now();timer.running=true;timer.alarm=false;await activation;await hold();}render();}
   if(a==='reset'){if(confirm('¿REINICIAR EL TEMPORIZADOR?'))timer={running:false,start:0,elapsed:0,alarm:false};render();}
   if(a==='register'){
    if(timer.running){error='PAUSÁ O FINALIZÁ EL TEMPORIZADOR ANTES DE REGISTRAR.';render();return;}
    if(latest(selected,prueba)&&!pending&&!confirm('YA EXISTE UNA MARCA. ¿REGISTRAR UNA CORRECCIÓN CONSERVANDO EL HISTORIAL?'))return;
    await register(prueba,selected,Number(value),sex,birth);
   }
   if(a==='race-start'){if(run.running)stop(run);else{run.start=Date.now();run.running=true;await hold();}saveDraft();render();}
   if(a==='race-new'){if(confirm('¿NUEVA SERIE? LOS TIEMPOS SIN GUARDAR SE DESCARTARÁN.')){run={running:false,start:0,elapsed:0,laps:[],group:[]};saveDraft();render();}}
   if(a==='lap'){if(!run.running||run.laps.length>=run.group.length)return;run.laps.push({ms:elapsed(run),cursante:null,saved:false});saveDraft();render();}
  });
 }
 async function saveLap(l,c){
  const ok=await register('aerobica',c.id,Math.floor(l.ms/1000),sex,birth);
  if(ok){l.saved=true;saveDraft();render();}
 }
 const tick=setInterval(()=>{
  if(!authorized()){alive=false;clearInterval(tick);wake?.release();root.remove();roster=[];records=[];onClose();return;}
  if(timer.running&&elapsed(timer)>=120000){timer.elapsed=120000;timer.running=false;if(!timer.alarm){timer.alarm=true;sound();success='TIEMPO CUMPLIDO · REGISTRÁ LAS REPETICIONES';render();}}
  const remaining=Math.max(0,120000-elapsed(timer));const t=root.querySelector('#efmc-time');if(t)t.textContent=clock(remaining);const circle=root.querySelector('#efmc-ring');if(circle){circle.style.setProperty('--remaining',(remaining/120000*100)+'%');circle.dataset.phase=remaining<=10000?'end':remaining<=30000?'warn':'normal';}
  const r=root.querySelector('#efmc-race-time');if(r)r.textContent=fmt(elapsed(run));
 },100);
 await load();
}
