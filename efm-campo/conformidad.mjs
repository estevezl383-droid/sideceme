export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const estaciones={talla_peso:'Peso y talla',flexiones:'Flexiones',abdominales:'Abdominales',aerobica:'Aeróbica · 3.200 m',natacion:'Piscina / natación',barras:'Barras · excelencia'};
export function vigente(records,id,prueba){return records.filter(r=>r.cursante_id===id&&r.prueba===prueba).sort((a,b)=>a.revision!=null&&b.revision!=null?Number(b.revision)-Number(a.revision):String(b.creado_en||'').localeCompare(String(a.creado_en||'')))[0];}
export const fechaHora=s=>s?new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',dateStyle:'short',timeStyle:'medium'}).format(new Date(s)):'—';
export function marcaRegistro(r){
 if(!r)return 'Sin registro';if(r.calculo?.estado==='NO_REALIZO')return 'No realizó la prueba';
 if(r.prueba==='talla_peso')return `${r.calculo.peso} kg / ${r.calculo.talla} m`;
 if(r.prueba==='aerobica'){const n=Math.floor(Number(r.valor));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
 return `${r.valor} ${r.prueba==='natacion'?'m':'repeticiones'}`;
}
export const estadoRegistro=r=>!r?'sin-registro':r.conformidad?'conforme':'pendiente';
export const textoEstado=r=>!r?'Sin registro':r.conformidad?'✓ Conformidad del alumno':'● Pendiente de conformidad';
export function notaConformidad(r){return `<span class="efmc-conformidad ${estadoRegistro(r)}" data-record-status="${esc(r?.id||'')}"><b>${esc(r?.calculo?.nota??(!r?'Sin registro':r.calculo?.estado==='NO_REALIZO'?'No realizó':'Pendiente de calificación'))}${r?.calculo?.nota!=null?' / 100':''}</b><small>${textoEstado(r)}</small></span>`;}
export function botonConformidad(r,prueba,{soloLectura=false}={}){
 const habilitado=!!r&&!r.conformidad&&!soloLectura,label=estaciones[prueba]||prueba;
 const reason=!r?'Se habilitará cuando el evaluador registre esta prueba.':r.conformidad?'Conformidad guardada el '+fechaHora(r.conformidad.confirmado_en):soloLectura?'En soporte sólo puedes consultar. El alumno debe entrar con su cuenta personal para dar conformidad.':'Revisa la marca y la nota de esta prueba antes de aceptar.';
 return `<button type="button" class="efmc-confirm-action ${r?.conformidad?'conforme':''}" data-confirm-test="${esc(prueba)}" ${habilitado?`data-confirm="${esc(r.id)}"`:'disabled'} aria-describedby="efmc-confirm-help-${esc(prueba)}">${r?.conformidad?'✓ Conforme':'Dar conformidad'} · ${esc(label)}</button><p id="efmc-confirm-help-${esc(prueba)}" class="efmc-confirm-help">${esc(reason)}</p>`;
}
export function fichaRegistro(r,{confirmar=false,mostrarBoton=false,soloLectura=false}={}){
 return `<article class="efmc-record ${estadoRegistro(r)}"><h3>${esc(estaciones[r.prueba]||r.prueba)}</h3><p class="efmc-mark">${esc(marcaRegistro(r))}</p>${notaConformidad(r)}<p>Registró: ${esc(r.calculo?.evaluador_nombre||r.evaluador_nombre||'Evaluador')}<br><small>${esc(fechaHora(r.creado_en))}</small></p>${r.conformidad?`<p>Confirmado por el alumno: ${esc(fechaHora(r.conformidad.confirmado_en))}</p>`:''}${mostrarBoton||confirmar?botonConformidad(r,r.prueba,{soloLectura}):''}${r.calculo?.nota==null&&r.calculo?.estado!=='NO_REALIZO'?'<p>La nota está pendiente de calificación. La conformidad reconoce la marca mostrada.</p>':''}</article>`;
}
