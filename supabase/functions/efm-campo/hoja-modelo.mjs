import {esExcelencia} from './baremos.mjs';
export const PRUEBAS_HOJA=[['talla_peso','PESO / TALLA',29],['natacion','NATACIÓN',11],['abdominales','ABDOMINALES',20],['flexiones','FLEXIONES EN SUELO',20],['aerobica','AERÓBICA 3.200 M',20]];
const redondear=n=>Math.round((n+Number.EPSILON)*100)/100;
const reciente=(a,b)=>a.revision!=null&&b.revision!=null?Number(b.revision)-Number(a.revision):String(b.creado_en||'').localeCompare(String(a.creado_en||''));
export const fechaTexto=s=>s?String(s).slice(0,10).split('-').reverse().join('/'):'PENDIENTE';
export const horaTexto=s=>s?new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',dateStyle:'short',timeStyle:'medium'}).format(new Date(s)):'PENDIENTE';
export async function sha256(value){const bytes=typeof value==='string'?new TextEncoder().encode(value):value;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');}
export function snapshotHoja(c,perfil,plan,registros,condiciones=[]){
 const excelencia=esExcelencia(plan.grupos.find(g=>g.alumnos.includes(c.id)));
 const pruebas=excelencia?[['natacion','NATACIÓN 100 M',20],['barras','FLEXIONES EN BARRA',20],['abdominales','ABDOMINALES',20],['flexiones','FLEXIONES EN SUELO',20],['aerobica','AERÓBICA 3.200 M',20]]:PRUEBAS_HOJA;
 const rows=pruebas.map(([prueba,nombre,ponderacion])=>{
  const r=registros.filter(x=>x.cursante_id===c.id&&x.organizacion_id===plan.id&&x.prueba===prueba).sort(reciente)[0];
  const condicion=condiciones.filter(x=>x.cursante_id===c.id&&x.organizacion_id===plan.id&&(x.prueba==='TODAS'||x.prueba===prueba)).sort((a,b)=>String(b.creado_en).localeCompare(String(a.creado_en)))[0];
  const bloqueo=condicion&&condicion.estado!=='NORMAL'?{estado:condicion.estado,referencia:condicion.referencia||'',observacion:condicion.observacion||''}:null;
  const nota=!bloqueo&&typeof r?.calculo?.nota==='number'&&Number.isFinite(r.calculo.nota)&&r.calculo.nota>=0&&r.calculo.nota<=100?r.calculo.nota:null;
  let marca=!r?'S/R':r.calculo?.estado==='NO_CUMPLIO'?'NO CUMPLIÓ':r.calculo?.estado==='NO_REALIZO'?'N/R':prueba==='talla_peso'?`${r.calculo.peso} KG / ${r.calculo.talla} M`:(prueba==='aerobica'||(excelencia&&prueba==='natacion'))?`${String(Math.floor(Number(r.valor)/60)).padStart(2,'0')}:${(excelencia&&prueba==='natacion'?(Number(r.valor)%60).toFixed(2).padStart(5,'0'):String(Math.floor(Number(r.valor)%60)).padStart(2,'0'))}`:String(r.valor);
  if(bloqueo)marca='N/R';
  return {prueba,nombre,ponderacion,cumple:r?.calculo?.cumple??null,registro_id:r?.id||null,revision:r?.revision??null,valor:r?.valor??null,peso:prueba==='talla_peso'?r?.calculo?.peso??null:null,talla:prueba==='talla_peso'?r?.calculo?.talla??null:null,marca,nota,aporte:nota==null?null:redondear(nota*ponderacion/100),evaluador:r?.calculo?.evaluador_nombre||r?.evaluador_nombre||r?.actor_id||'',registrado_en:r?.creado_en||null,confirmado_en:r?.conformidad?.confirmado_en||null,condicion:bloqueo};
 });
 const completos=rows.filter(r=>r.nota!=null).length,conformes=rows.filter(r=>r.confirmado_en).length;
 const latest=registros.filter(r=>r.cursante_id===c.id&&r.organizacion_id===plan.id).sort(reciente)[0];
 const nacimiento=perfil?.fecha_nacimiento||latest?.nacimiento||null;
 let edad=null;if(nacimiento){const [y,m,d]=nacimiento.split('-').map(Number),[a,b,e]=plan.fecha.split('-').map(Number);edad=a-y-(b<m||(b===m&&e<d)?1:0);}
 return {formato:'efmc-hoja-individual-v2',comandante:'Gral. Brig. José Jhonny Pardo Pardo',excelencia,evaluacion:{id:plan.id,nombre:plan.nombre,fecha:plan.fecha,ciclo:plan.ciclo,grupo:plan.grupos.find(g=>g.alumnos.includes(c.id))?.color||''},cursante:{id:c.id,nombre:c.nombre_completo,grado:c.grado||'',arma:c.arma||'',ci:c.ci||'',ciclo:c.ciclo,curso:c.paralelo||'',nacimiento,edad,sexo:perfil?.sexo||latest?.sexo||null},rows,completos,conformes,final:completos===5?redondear(rows.reduce((sum,r)=>sum+r.aporte,0)):null,estado:completos===5&&conformes===5?'COMPLETA CON CONFORMIDAD':'PARCIAL / CONFORMIDADES PENDIENTES'};
}
export async function datosHojaServidor(sb,cursanteId,organizacionId){
 const [c,p,o,r,n]=await Promise.all([
  sb.from('cursantes').select('id,nombre_completo,grado,arma,ci,ciclo,paralelo,activo').eq('id',cursanteId).maybeSingle(),
  sb.from('efmc_perfiles').select('fecha_nacimiento,sexo,foto_path').eq('cursante_id',cursanteId).maybeSingle(),
  sb.from('efmc_organizaciones').select('*').eq('id',organizacionId).maybeSingle(),
  sb.from('efmc_registros').select('*').eq('organizacion_id',organizacionId).eq('cursante_id',cursanteId).order('revision',{ascending:false}).limit(10000),
  sb.from('efmc_condiciones').select('*').eq('organizacion_id',organizacionId).eq('cursante_id',cursanteId).order('creado_en',{ascending:false}).limit(10000)
 ]);
 if(c.error||p.error||o.error||r.error||n.error)throw c.error||p.error||o.error||r.error||n.error;
 if(!c.data||!o.data||o.data.modo!=='EVALUACION'||!o.data.grupos.some(g=>g.alumnos.includes(cursanteId)))return null;
 const ids=r.data.map(x=>x.id),cf=ids.length?await sb.from('efmc_conformidades').select('registro_id,confirmado_en').in('registro_id',ids):{data:[]};if(cf.error)throw cf.error;
 const byId=new Map(cf.data.map(x=>[x.registro_id,x]));
 return {cursante:c.data,perfil:p.data,plan:o.data,snapshot:snapshotHoja(c.data,p.data,o.data,r.data.map(x=>({...x,conformidad:byId.get(x.id)||null})),n.data)};
}
