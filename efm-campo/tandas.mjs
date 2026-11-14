// Las tandas son vistas de la nómina del grupo, nunca grupos duplicados.
export function tandasAerobicas(plan){
 return (plan?.grupos||[]).flatMap(g=>Array.from({length:Math.ceil(g.alumnos.length/10)},(_,i)=>({id:`${g.id}:${i+1}`,grupo:g.id,color:g.color,numero:i+1,alumnos:g.alumnos.slice(i*10,i*10+10)})));
}
export function trasladarExcelencia(plan,ids){
 if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)throw Error('Seleccione una lista sin duplicados.');
 const next=structuredClone(plan),todos=new Set(next.grupos.flatMap(g=>g.alumnos));
 if(ids.some(id=>!todos.has(id)))throw Error('Hay postulantes fuera de la organización.');
 let destino=next.grupos.find(g=>g.modalidad==='EXCELENCIA'||g.color==='NEGRO');
 if(!destino){destino={id:crypto.randomUUID(),color:'NEGRO',modalidad:'EXCELENCIA',alumnos:[],encargados:Object.fromEntries(['talla_peso','flexiones','abdominales','aerobica','natacion','barras'].map(k=>[k,['P020']])),apoyos:[]};next.grupos.push(destino);}
 destino.origen_paralelos??={};
 for(const id of ids){const original=next.grupos.find(g=>g!==destino&&g.alumnos.includes(id));if(original)destino.origen_paralelos[id]=original.paralelo||'';}
 const seleccion=new Set(ids);
 for(const g of next.grupos)if(g!==destino)g.alumnos=g.alumnos.filter(id=>!seleccion.has(id));
 destino.alumnos=[...new Set([...destino.alumnos,...ids])];
 next.grupos=next.grupos.filter(g=>g.alumnos.length);
 return next;
}
