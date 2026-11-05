import {esc,estaciones,vigente,marcaRegistro,notaConformidad,fechaHora} from './conformidad.mjs?v=22';
import {resumen} from './informes.mjs?v=22';
import {gradoArma} from './ui.mjs?v=22';
const dia=f=>f.split('-').reverse().join('/');
const opciones=(values,current,label)=>`<option value="">${label}</option>${[...new Set(values)].sort().map(v=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(v)}</option>`).join('')}`;
export function abrirHistorial({invoke,host,authorized=()=>true}){
 const dialog=document.createElement('dialog');dialog.className='efmc-history-dialog';dialog.setAttribute('aria-labelledby','efmc-history-title');host.append(dialog);
 let alive=true,busy=false,error='',evaluaciones=[],detalle=null,actual=null,ciclo='',curso='',tanda='',request=0;
 const participantes=e=>e.participantes.filter(c=>(!curso||c.curso===curso)&&(!tanda||c.tanda===tanda));
 const visibles=()=>evaluaciones.filter(e=>(!ciclo||e.ciclo===ciclo)&&participantes(e).length);
 const close=()=>{alive=false;request++;dialog.close();dialog.remove();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 const vigenteOrden=(a,b)=>Number(b.revision??0)-Number(a.revision??0)||String(b.creado_en||'').localeCompare(String(a.creado_en||''));
 function tabla(){
  const ids=new Set(participantes(actual).map(c=>c.id)),people=detalle.cursantes.filter(c=>ids.has(c.id)).sort((a,b)=>a.nombre_completo.localeCompare(b.nombre_completo)),records=detalle.registros;
  const pruebas=Object.keys(estaciones).filter(p=>p!=='barras'||records.some(r=>ids.has(r.cursante_id)&&r.prueba==='barras'));
  return `<p class="efmc-history-count">${people.length} ${people.length===1?'CURSANTE':'CURSANTES'} · RESULTADOS GUARDADOS</p><div class="efmc-table-wrap"><table><caption>Última revisión de cada prueba · ${esc(actual.ciclo)} · ${dia(actual.fecha)}</caption><thead><tr><th scope="col">CURSANTE / CURSO / TANDA</th>${pruebas.map(p=>`<th scope="col">${esc(estaciones[p])}</th>`).join('')}<th scope="col">NOTA FINAL</th></tr></thead><tbody>${people.map(c=>{
   const participant=actual.participantes.find(p=>p.id===c.id),own=records.filter(r=>r.cursante_id===c.id),last=[...own].sort(vigenteOrden)[0],g=detalle.organizacion?.grupos.find(g=>g.alumnos.includes(c.id));
   const s=resumen({...c,fecha_nacimiento:last?.nacimiento,condiciones:detalle.condiciones.filter(x=>x.cursante_id===c.id),organizacion:{modalidad:last?.calculo?.modalidad||g?.modalidad,grupo:participant.tanda}},own,actual.fecha);
   return `<tr><th scope="row">${esc([gradoArma(c),c.nombre_completo].filter(Boolean).join(' '))}<small>${esc(actual.ciclo)} · CURSO ${esc(participant.curso)}<br>TANDA / GRUPO ${esc(participant.tanda)}${c.activo===false?' · INACTIVO':''}</small></th>${pruebas.map(p=>{const r=vigente(own,c.id,p);return `<td><strong>${esc(marcaRegistro(r))}</strong>${actual.modo==='EVALUACION'?notaConformidad(r):`<p>${esc(r?.calculo?.nota??'PENDIENTE')} / 100</p>`}</td>`;}).join('')}<td><strong>${s.final??'PENDIENTE'}${s.final!=null?' / 100':''}</strong><small>${s.completos} / 5 NOTAS</small></td></tr>`;
  }).join('')}</tbody></table></div><h3>HISTORIAL DE CORRECCIONES</h3><p>Se conserva cada registro y la conformidad correspondiente a esa revisión.</p>${people.map(c=>{
   const own=records.filter(r=>r.cursante_id===c.id).sort(vigenteOrden);
   return `<details class="efmc-history-revisions"><summary>${esc(c.nombre_completo)} · ${own.length} REGISTROS GUARDADOS</summary><div class="efmc-table-wrap"><table><thead><tr><th>PRUEBA</th><th>REVISIÓN</th><th>MARCA</th><th>NOTA</th><th>EVALUADOR</th><th>GUARDADO</th><th>CONFORMIDAD</th></tr></thead><tbody>${own.map(r=>`<tr><td>${esc(estaciones[r.prueba]||r.prueba)}</td><td>${r.id===vigente(own,c.id,r.prueba)?.id?'VIGENTE':'ANTERIOR'}<small>${esc(r.revision??'—')}</small></td><td>${esc(marcaRegistro(r))}</td><td>${esc(r.calculo?.nota??(r.calculo?.estado==='NO_REALIZO'?'NO REALIZÓ':'PENDIENTE'))}</td><td>${esc(r.calculo?.evaluador_nombre||r.actor_id||'—')}</td><td>${esc(fechaHora(r.creado_en))}</td><td>${r.conformidad?'CONFIRMADA · '+esc(fechaHora(r.conformidad.confirmado_en)):actual.modo==='EVALUACION'?'PENDIENTE':'NO CORRESPONDE · PRUEBA PERSONAL'}</td></tr>`).join('')}</tbody></table></div></details>`;
  }).join('')}${!people.length?'<p class="efmc-history-empty">NO HAY RESULTADOS CON ESTOS FILTROS.</p>':''}`;
 }
 function render(){
  if(!alive||!authorized())return;
  const list=visibles(),participants=evaluaciones.filter(e=>!ciclo||e.ciclo===ciclo).flatMap(e=>e.participantes);
  dialog.innerHTML=`<header><div><small>ENTRENAMIENTO FÍSICO · CONSULTA</small><h2 id="efmc-history-title">HISTORIAL DE PRUEBAS FÍSICAS</h2></div><button data-history-close aria-label="CERRAR HISTORIAL">✕</button></header><p>Consultá evaluaciones anteriores por ciclo, curso o tanda. Las marcas y sus correcciones permanecen guardadas.</p><div class="efmc-history-filters"><label>CICLO<select data-history-filter="ciclo" ${busy?'disabled':''}>${opciones(evaluaciones.map(e=>e.ciclo),ciclo,'TODOS LOS CICLOS')}</select></label><label>CURSO<select data-history-filter="curso" ${busy?'disabled':''}>${opciones(participants.map(c=>c.curso),curso,'TODOS LOS CURSOS')}</select></label><label>TANDA / GRUPO<select data-history-filter="tanda" ${busy?'disabled':''}>${opciones(participants.map(c=>c.tanda),tanda,'TODAS LAS TANDAS')}</select></label></div><div class="efmc-history-actions">${actual?'<button data-history-back>← VOLVER A EVALUACIONES</button>':''}<button data-history-refresh ${busy?'disabled':''}>↻ ACTUALIZAR HISTORIAL</button></div><p role="status" class="efmc-message">${esc(error||(busy?'CARGANDO HISTORIAL…':''))}</p>${detalle?`<section><small>${dia(actual.fecha)} · ${esc(actual.ciclo)} · ${actual.modo==='EVALUACION'?'EVALUACIÓN REGISTRADA':'REGISTROS DE PRUEBA'}</small><h3>${esc(actual.nombre)}</h3>${actual.publicada_en?'<p>CIERRE Y PUBLICACIÓN REGISTRADOS</p>':''}${tabla()}</section>`:actual?'':`<p class="efmc-history-count">${list.length} ${list.length===1?'EVALUACIÓN GUARDADA':'EVALUACIONES GUARDADAS'}</p><div class="efmc-history-list">${list.map(e=>{
   const ps=participantes(e),courses=[...new Set(ps.map(p=>p.curso))],groups=[...new Set(ps.map(p=>p.tanda))];
   return `<article class="efmc-history-card"><small>${dia(e.fecha)} · ${esc(e.ciclo)}</small><h3>${esc(e.nombre)}</h3><span class="efmc-history-mode">${e.modo==='EVALUACION'?'EVALUACIÓN REGISTRADA':'REGISTROS DE PRUEBA'}</span><p><b>${ps.length} ${ps.length===1?'CURSANTE':'CURSANTES'}</b> · ${ps.reduce((n,c)=>n+c.registros,0)} PRUEBAS GUARDADAS</p><p>CURSOS: ${courses.map(esc).join(', ')}<br>TANDAS / GRUPOS: ${groups.map(esc).join(', ')}</p><button data-history-open="${esc(e.id)}" ${busy?'disabled':''}>ABRIR HISTORIAL · ${esc(e.ciclo)}</button></article>`;
  }).join('')}</div>${!list.length&&!busy&&!error?'<p class="efmc-history-empty">NO HAY EVALUACIONES GUARDADAS CON ESTOS FILTROS.</p>':''}`}`;
  dialog.querySelector('[data-history-close]').onclick=close;
  dialog.querySelector('[data-history-refresh]').onclick=()=>load(actual);
  dialog.querySelector('[data-history-back]')?.addEventListener('click',()=>{request++;busy=false;actual=null;detalle=null;error='';render();});
  dialog.querySelectorAll('[data-history-filter]').forEach(e=>e.onchange=()=>{if(e.dataset.historyFilter==='ciclo'){ciclo=e.value;curso='';tanda='';actual=null;detalle=null;}else if(e.dataset.historyFilter==='curso')curso=e.value;else tanda=e.value;render();});
  dialog.querySelectorAll('[data-history-open]').forEach(e=>e.onclick=()=>load(evaluaciones.find(p=>p.id===e.dataset.historyOpen)));
 }
 async function load(e=null){
  const seq=++request;busy=true;error='';actual=e;detalle=null;render();
  try{
   const r=await invoke(e?{accion:'historial_detalle',...(e.organizacion_id?{organizacion_id:e.organizacion_id}:{fecha:e.fecha,ciclo:e.ciclo})}:{accion:'historial'});
   if(!alive||!authorized()||seq!==request)return;
   if(e)detalle=r;else evaluaciones=r.evaluaciones;
  }catch(err){if(alive&&seq===request)error='NO SE PUDO CARGAR EL HISTORIAL: '+err.message;}
  finally{if(alive&&seq===request){busy=false;render();}}
 }
 render();dialog.showModal();load();
}
