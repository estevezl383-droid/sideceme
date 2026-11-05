// Consultas paginadas: el límite de filas de PostgREST no debe recortar el historial.
export async function leerPaginas(query,tamano=500){
 const rows=[];
 for(let offset=0;;offset+=tamano){
  const r=await query().range(offset,offset+tamano-1);
  if(r.error)throw r.error;
  rows.push(...r.data);
  if(r.data.length<tamano)return rows;
 }
}
export function indiceHistorial(planes,registros,cursantes){
 const plans=new Map(planes.map(p=>[p.id,p])),people=new Map(cursantes.map(c=>[c.id,c])),sessions=new Map();
 for(const r of registros){
  const p=plans.get(r.organizacion_id),c=people.get(r.cursante_id),ciclo=r.ciclo||r.calculo?.ciclo||p?.ciclo||c?.ciclo||'SIN CICLO',id=[r.organizacion_id||'personal',r.fecha,ciclo].join(':');
  if(!sessions.has(id))sessions.set(id,{id,organizacion_id:r.organizacion_id||null,fecha:r.fecha,ciclo,nombre:p?.nombre||'Prueba personal sin grupos',modo:p?.modo||'PRUEBA',publicada_en:p?.publicada_en||null,personas:new Map()});
  const session=sessions.get(id);
  if(!session.personas.has(r.cursante_id))session.personas.set(r.cursante_id,{id:r.cursante_id,curso:c?.paralelo||'SIN CURSO',tanda:'SIN GRUPO',registros:new Set(),revisiones:0,revision:-1});
  const person=session.personas.get(r.cursante_id);person.registros.add(r.prueba);person.revisiones++;
  if(Number(r.revision??0)>=person.revision){person.revision=Number(r.revision??0);person.curso=r.curso||r.calculo?.curso||c?.paralelo||'SIN CURSO';person.tanda=r.grupo||r.calculo?.grupo||p?.grupos?.find(g=>g.alumnos.includes(r.cursante_id))?.color||'SIN GRUPO';}
 }
 return [...sessions.values()].map(({personas,...s})=>{
  const participantes=[...personas.values()].map(({revision,registros,...c})=>({...c,registros:registros.size}));
  return {...s,participantes,alumnos:participantes.length,registros:participantes.reduce((n,c)=>n+c.registros,0),revisiones:participantes.reduce((n,c)=>n+c.revisiones,0)};
 }).sort((a,b)=>b.fecha.localeCompare(a.fecha)||a.ciclo.localeCompare(b.ciclo)||a.nombre.localeCompare(b.nombre));
}
