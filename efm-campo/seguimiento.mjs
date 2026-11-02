import {esc,estaciones,vigente,notaConformidad,marcaRegistro,fechaHora} from './conformidad.mjs?v=16';
export const pruebasConformidad=['talla_peso','flexiones','abdominales','aerobica','natacion'];
export function situacionConformidades(data){
 const rows=[];
 for(const p of data.organizaciones||[]){
  const ids=[...new Set(p.grupos.flatMap(g=>g.alumnos))],records=(data.registros||[]).filter(r=>r.organizacion_id===p.id);
  for(const id of ids){const c=data.cursantes.find(c=>c.id===id);if(!c)continue;const pruebas=pruebasConformidad.map(prueba=>({prueba,registro:vigente(records,id,prueba)}));rows.push({c,organizacion:p,pruebas,conformes:pruebas.filter(x=>x.registro?.conformidad).length});}
 }
 const all=rows.flatMap(r=>r.pruebas),conformes=all.filter(x=>x.registro?.conformidad).length,pendientes=all.filter(x=>x.registro&&!x.registro.conformidad).length;
 return {rows,alumnos:rows.length,total:all.length,conformes,pendientes,sinRegistro:all.filter(x=>!x.registro).length};
}
export function panelConformidades(data){
 if(!data)return '<p>Cargando el detalle de conformidades…</p>';
 const s=situacionConformidades(data);
 return `<section class="efmc-sheet efmc-monitor"><h2>Situación de conformidad de las notas</h2><p>Todos los ciclos de la evaluación seleccionada. Cada prueba se confirma por separado.</p><div class="efmc-monitor-summary">${[['alumnos','Alumnos',s.alumnos],['total','Pruebas previstas',s.total],['conformes','Conformes',s.conformes],['pendientes','Pendientes de conformidad',s.pendientes],['sin-registro','Sin registro',s.sinRegistro]].map(([k,n,v])=>`<article><strong data-monitor-count="${k}">${v}</strong><span>${n}</span></article>`).join('')}</div>${s.rows.length?`<div class="efmc-table-wrap"><table><thead><tr><th>Alumno / ciclo</th>${pruebasConformidad.map(p=>`<th>${esc(estaciones[p])}</th>`).join('')}<th>Conformidades</th></tr></thead><tbody>${s.rows.map(row=>`<tr data-monitor-student="${esc(row.c.id)}"><th>${esc(row.c.nombre_completo)}<small>${esc(row.c.ciclo)}</small></th>${row.pruebas.map(({prueba,registro:r})=>`<td data-monitor-test="${prueba}"><strong>${esc(marcaRegistro(r))}</strong>${notaConformidad(r)}${r?`<details data-monitor-detail="${esc(row.organizacion.id+'-'+row.c.id+'-'+prueba)}"><summary>Ver detalle</summary><p>Registró: ${esc(r.calculo?.evaluador_nombre||r.evaluador_nombre||r.actor_id)}<br>${esc(fechaHora(r.creado_en))}</p><p>${r.conformidad?'Confirmó: '+esc(row.c.nombre_completo)+'<br>'+esc(fechaHora(r.conformidad.confirmado_en)):'Pendiente de aceptación del alumno'}</p></details>`:''}</td>`).join('')}<td><b>${row.conformes} / 5</b><small>${row.conformes===5?'Conformidad completa':'En proceso'}</small></td></tr>`).join('')}</tbody></table></div>`:'<p>No hay alumnos en evaluaciones habilitadas para esta fecha.</p>'}</section>`;
}
