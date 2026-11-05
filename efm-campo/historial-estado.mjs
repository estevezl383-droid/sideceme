import {esc,fechaHora} from './conformidad.mjs?v=22';
export const tieneNota=r=>typeof r?.calculo?.nota==='number'&&Number.isFinite(r.calculo.nota)&&r.calculo.nota>=0&&r.calculo.nota<=100;
export function revisionActual(r,records){
 return records.filter(x=>x.cursante_id===r.cursante_id&&x.prueba===r.prueba&&x.fecha===r.fecha&&(x.organizacion_id||null)===(r.organizacion_id||null)).sort((a,b)=>a.revision!=null&&b.revision!=null?Number(b.revision)-Number(a.revision):String(b.creado_en||'').localeCompare(String(a.creado_en||'')))[0];
}
export function calificacionRevision(r,records){
 if(tieneNota(r))return esc(r.calculo.nota);
 if(r.calculo?.estado==='NO_REALIZO')return 'NO REALIZÓ';
 const actual=revisionActual(r,records);
 if(actual&&actual.id!==r.id&&tieneNota(actual))return `<span class="efmc-history-resolved">SUBSANADA</span><small>Esta revisión quedó sin calificar.<br>Nota vigente: <b>${esc(actual.calculo.nota)} / 100</b> · revisión ${esc(actual.revision??'—')}</small>`;
 return 'PENDIENTE DE CALIFICACIÓN';
}
export function calificacionVigente(r,records,{evaluacion=true}={}){
 const calificada=tieneNota(r),label=calificada?`${r.calculo.nota} / 100`:!r?'SIN REGISTRO':r.calculo?.estado==='NO_REALIZO'?'NO REALIZÓ':'PENDIENTE DE CALIFICACIÓN';
 const origen=r?.calculo?.recalculo?.registro_origen,anterior=origen?records.find(x=>x.id===origen&&x.cursante_id===r.cursante_id&&x.prueba===r.prueba&&x.organizacion_id===r.organizacion_id):null;
 return `<div class="efmc-history-grade ${calificada?'calificada':'sin-nota'}${evaluacion&&r&&!r.conformidad?' pendiente-conformidad':''}"><strong>${esc(label)}</strong><small>${calificada?'NOTA CALIFICADA':''}</small></div>${evaluacion&&r?`<div class="efmc-history-acceptance ${r.conformidad?'confirmada':'pendiente'}">${r.conformidad?'✓ Conformidad de esta revisión':'Conformidad de esta revisión pendiente'}${!r.conformidad&&anterior?.conformidad?'<small>La marca anterior fue confirmada. Falta aceptar la nota recalculada.</small>':''}${r.conformidad?`<small>${esc(fechaHora(r.conformidad.confirmado_en))}</small>`:''}</div>`:''}`;
}
