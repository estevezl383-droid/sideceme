const segments=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'];
export function digital(text){return `<span class="efmc-digital" role="img" aria-label="${text}">${[...String(text)].map(c=>c===':'?'<span class="efmc-colon" aria-hidden="true"><i></i><i></i></span>':c==='.'?'<span class="efmc-dot" aria-hidden="true"></span>':c==='—'?'<span class="efmc-digit" aria-hidden="true"><i class="seg g on"></i></span>':`<span class="efmc-digit" aria-hidden="true">${[...'abcdefg'].map(seg=>`<i class="seg ${seg}${segments[Number(c)]?.includes(seg)?' on':''}"></i>`).join('')}</span>`).join('')}</span>`;}
export function nacimiento(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return 'PENDIENTE';const [y,m,d]=value.split('-');return `${d}-${['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][Number(m)-1]}-${y.slice(-2)}`;}
export function sexoInicial(c,records=[]){
 if(!c)return 'M';
 // Recorded selection takes precedence. Only the explicitly identified person
 // is corrected from the user's instruction; never classify sex from a photo.
 const previous=records.find(r=>r.cursante_id===c.id&&['M','F'].includes(r.sexo));
 if(c.sexoConfirmado)return c.sexo;
 if(c.nombre_completo?.trim().toUpperCase()==='ALYSON MANU SALGUERO')return 'F';
 if(previous)return previous.sexo;
 return ['M','F'].includes(c.sexo)?c.sexo:'M';
}
export function siguiente(list,records,id,prueba){const start=list.findIndex(c=>c.id===id);const ordered=[...list.slice(start+1),...list.slice(0,start+1)];return ordered.find(c=>!records.some(r=>r.cursante_id===c.id&&r.prueba===prueba))||null;}

export function gradoArma(c){return [String(c?.grado||'').trim().toUpperCase(),String(c?.arma||'').trim().toUpperCase()].filter(Boolean).filter((v,i,a)=>!i||!a[0].includes(v)).join(' ');}
