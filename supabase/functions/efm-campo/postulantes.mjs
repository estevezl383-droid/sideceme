import {esExcelencia} from './baremos.mjs';
import {JEFES,ESTACIONES,CONDICIONES,validarPlan,asignaciones,puedeRegistrar} from './organizacion.mjs';
import {validarNacimiento} from './perfil.mjs';
import {validarMedidas} from './medidas.mjs';
import {indiceHistorial,leerPaginas} from './historial.mjs';
export const POST='POSTULANTES 2027';
export const POST_CONSULTA=['P001','P002','P020','P030','P032'];
export const esPost=c=>[POST,'POSTULANTES_2027'].includes(c);
const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const fecha=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const checked=async q=>{const r=await q;if(r.error)throw r.error;return r.data;};
const serialize=r=>({...r,cursante_id:r.postulante_id,conformidad:null});
export async function accesoPost(sb,id){
 if(JEFES.includes(id)||POST_CONSULTA.includes(id))return true;
 const ps=await checked(sb.from('post_ef_organizaciones').select('grupos,habilitado').eq('habilitado',true));
 return ps.some(p=>asignaciones(p,id).length);
}
export async function operarPostulantes({sb,b,actor,reply}){
 const id=actor.id,jefe=JEFES.includes(id),consulta=jefe||POST_CONSULTA.includes(id),actorNombre=[actor.grado,actor.nombre_completo].filter(Boolean).join(' ');
 const fail=(error,status=400)=>reply(status,{ok:false,error});
 let plan=null;
 if(b.organizacion_id){
  if(!uuid(b.organizacion_id))return fail('ORGANIZACIÓN NO VÁLIDA');
  plan=await checked(sb.from('post_ef_organizaciones').select('*').eq('id',b.organizacion_id).maybeSingle());
  if(!plan||(!consulta&&!asignaciones(plan,id).length))return fail('ORGANIZACIÓN DE POSTULANTES NO HABILITADA PARA SU CUENTA',403);
  if(b.fecha&&b.fecha!==plan.fecha)return fail('LA FECHA NO CORRESPONDE A LA ORGANIZACIÓN');
 }
 const accionesJefe=['organizar','condicion'];
 if(accionesJefe.includes(b.accion)&&!jefe)return fail('SOLO LOS ORGANIZADORES PUEDEN MODIFICAR LOS GRUPOS',403);
 if(['registrar','guardar_datos'].includes(b.accion)&&!jefe&&!plan)return fail('SELECCIONE SU ORGANIZACIÓN HABILITADA',403);
 const getNomina=async ids=>{let q=sb.from('post_ef_nomina').select('*').eq('identidad_verificada',true).order('nombre_completo');if(ids)q=q.in('id',ids);return (await checked(q)).map(c=>({...c,ciclo:POST,paralelo:'',foto:null}));};
 const getRecords=async p=>leerPaginas(()=>sb.from('post_ef_registros').select('*').eq('organizacion_id',p.id).order('revision',{ascending:false}));
 const getConditions=async p=>leerPaginas(()=>sb.from('post_ef_condiciones').select('*').eq('organizacion_id',p.id).order('creado_en',{ascending:false}));
 const safeRecords=(rows,p)=>rows.filter(r=>consulta||puedeRegistrar(p,id,r.postulante_id,r.prueba)).map(serialize);
 if(b.accion==='foto'){
  if(!uuid(b.cursante_id))return fail('POSTULANTE NO VÁLIDO');
  if(!consulta){const ps=await checked(sb.from('post_ef_organizaciones').select('grupos,habilitado').eq('habilitado',true));if(!ps.some(p=>asignaciones(p,id).some(a=>a.alumnos.includes(b.cursante_id))))return fail('POSTULANTE NO ASIGNADO',403);}
  const p=await checked(sb.from('post_postulantes').select('id,foto').eq('id',b.cursante_id).eq('convocatoria_id',2027).eq('identidad_verificada',true).maybeSingle());
  return p?reply(200,{ok:true,id:p.id,foto:p.foto}):fail('POSTULANTE NO ENCONTRADO',404);
 }
 if(b.accion==='organizar'){
  const input=b.plan;if(!input||!uuid(input.id)||!fecha(input.fecha)||!Number.isInteger(input.version)||input.version<0)return fail('ORGANIZACIÓN NO VÁLIDA');
  const [roster,personal]=await Promise.all([getNomina(),checked(sb.from('profesores').select('id,activo,grado,es_suboficial,es_auxiliar,solo_lectura').eq('activo',true))]);
  const issue=validarPlan(input,roster,personal);if(issue)return fail(issue);
  const prev=await checked(sb.from('post_ef_organizaciones').select('*').eq('id',input.id).maybeSingle());
  if(prev&&(prev.fecha!==input.fecha||prev.ciclo!==input.ciclo))return fail('CREE OTRA ORGANIZACIÓN PARA CAMBIAR FECHA O POBLACIÓN');
  const row={id:input.id,nombre:input.nombre.trim(),fecha:input.fecha,ciclo:POST,modo:input.modo,habilitado:input.habilitado,grupos:input.grupos,version:input.version+1,actor_id:id,actualizado_en:new Date().toISOString()};
  const r=prev?await sb.from('post_ef_organizaciones').update(row).eq('id',input.id).eq('version',input.version).select().maybeSingle():input.version===0?await sb.from('post_ef_organizaciones').insert(row).select().single():{error:{code:'CONFLICT'}};
  if(r.error?.code==='23505'||r.error?.code==='CONFLICT'||(!r.error&&!r.data))return fail('OTRO ORGANIZADOR ACTUALIZÓ LOS GRUPOS. RECARGUE ANTES DE GUARDAR.',409);if(r.error)throw r.error;
  return reply(200,{ok:true,plan:r.data});
 }
 if(b.accion==='cargar'){
  if(!fecha(b.fecha))return fail('FECHA NO VÁLIDA');
  const ps=await checked(sb.from('post_ef_organizaciones').select('*').eq('fecha',b.fecha).order('actualizado_en',{ascending:false}));
  const disponibles=consulta?ps:ps.filter(p=>asignaciones(p,id).length);
  if(!plan&&!consulta)plan=disponibles[0]||null;
  if(!consulta&&!plan)return fail('SIN DESIGNACIONES DE POSTULANTES PARA ESTA FECHA',403);
  const assignments=consulta?[]:asignaciones(plan,id),ids=consulta?null:[...new Set(assignments.flatMap(a=>a.alumnos))];
  const [roster,profiles,records,conditions,personal]=await Promise.all([getNomina(ids),checked(ids?sb.from('post_ef_perfiles').select('*').in('postulante_id',ids):sb.from('post_ef_perfiles').select('*')),plan?getRecords(plan):[],plan?getConditions(plan):[],jefe?checked(sb.from('profesores').select('id,nombre_completo,grado,activo,es_suboficial,es_auxiliar,solo_lectura').eq('activo',true).order('nombre_completo')):[]]);
  const safePlan=!plan?null:consulta?plan:{...plan,grupos:plan.grupos.filter(g=>assignments.some(a=>a.grupo===g.id)).map(g=>({id:g.id,color:g.color,modalidad:g.modalidad,alumnos:g.alumnos}))};
  return reply(200,{ok:true,fecha:b.fecha,ciclo:POST,jefe:consulta,puede_organizar:jefe,solo_consulta:consulta&&!jefe,actor_nombre:actorNombre,organizacion:safePlan,organizaciones:disponibles.map(p=>({id:p.id,nombre:p.nombre,ciclo:p.ciclo,modo:p.modo,habilitado:p.habilitado})),asignaciones:assignments,condiciones:conditions.filter(x=>consulta||ids.includes(x.postulante_id)&&(x.prueba==='TODAS'||puedeRegistrar(plan,id,x.postulante_id,x.prueba))).map(serialize),personal,cursantes:roster.map(c=>{const p=profiles.find(p=>p.postulante_id===c.id);return {...c,...(p?{fecha_nacimiento:p.fecha_nacimiento,sexo:p.sexo,sexoConfirmado:true}:{sexo:'',sexoConfirmado:false})};}),registros:plan?safeRecords(records,plan):[]});
 }
 if(b.accion==='sincronizar'){
  if(!plan)return fail('SELECCIONE UNA ORGANIZACIÓN');const [rs,cs]=await Promise.all([getRecords(plan),getConditions(plan)]);const ids=new Set(asignaciones(plan,id).flatMap(a=>a.alumnos));
  return reply(200,{ok:true,version:plan.version,habilitado:plan.habilitado,registros:safeRecords(rs,plan),condiciones:cs.filter(c=>consulta||ids.has(c.postulante_id)&&(c.prueba==='TODAS'||puedeRegistrar(plan,id,c.postulante_id,c.prueba))).map(serialize),servidor_en:new Date().toISOString()});
 }
 if(b.accion==='guardar_datos'||b.accion==='registrar'||b.accion==='condicion'){
  if(!uuid(b.cursante_id))return fail('POSTULANTE NO VÁLIDO');
  if(!jefe&&!asignaciones(plan,id).some(a=>a.alumnos.includes(b.cursante_id)))return fail('POSTULANTE FUERA DE SU GRUPO',403);
  const person=await checked(sb.from('post_ef_nomina').select('*').eq('id',b.cursante_id).eq('identidad_verificada',true).maybeSingle());if(!person)return fail('POSTULANTE NO VERIFICADO');
  if(b.accion==='guardar_datos'){
   if(!['M','F'].includes(b.sexo)||!fecha(b.fecha)||validarNacimiento(b.nacimiento,b.fecha))return fail('CONFIRME FECHA DE NACIMIENTO Y SEXO');
   const p=await checked(sb.from('post_ef_perfiles').upsert({postulante_id:person.id,fecha_nacimiento:b.nacimiento,sexo:b.sexo,actor_id:id,actualizado_en:new Date().toISOString()},{onConflict:'postulante_id'}).select().single());return reply(200,{ok:true,perfil:p});
  }
  if(!plan||!plan.grupos.some(g=>g.alumnos.includes(person.id)))return fail('SELECCIONE LA ORGANIZACIÓN DEL POSTULANTE',403);
  if(b.accion==='condicion'){
   if(!uuid(b.id)||(!Object.hasOwn(ESTACIONES,b.prueba)&&b.prueba!=='TODAS')||!Object.hasOwn(CONDICIONES,b.estado)||typeof b.observacion!=='string'||b.observacion.length>600||typeof b.referencia!=='string'||b.referencia.length>160||(b.estado==='CON_PAPELETA'&&!b.referencia.trim()))return fail('REVISE CONDICIÓN Y REFERENCIA MÉDICA');
   const row={id:b.id,organizacion_id:plan.id,postulante_id:person.id,prueba:b.prueba,estado:b.estado,observacion:b.observacion,referencia:b.referencia,actor_id:id};
   const q=await sb.from('post_ef_condiciones').insert(row).select().single();if(q.error?.code==='23505'){const prev=await checked(sb.from('post_ef_condiciones').select('*').eq('id',b.id).single());if(Object.keys(row).some(k=>prev[k]!==row[k]))return fail('IDENTIFICADOR EN CONFLICTO',409);return reply(200,{ok:true,condicion:serialize(prev)});}if(q.error)throw q.error;return reply(200,{ok:true,condicion:serialize(q.data)});
  }
  if(!plan.habilitado||(!jefe||plan.modo==='EVALUACION')&&!puedeRegistrar(plan,id,person.id,b.prueba))return fail('PRUEBA O POSTULANTE NO ASIGNADO A SU CUENTA',403);
  if(!uuid(b.id)||!Object.hasOwn(ESTACIONES,b.prueba)||!fecha(b.fecha)||b.fecha!==plan.fecha||typeof b.valor!=='number'||!Number.isFinite(b.valor)||b.valor<0||b.valor>10000||!['M','F'].includes(b.sexo)||validarNacimiento(b.nacimiento,b.fecha))return fail('REVISE MARCA, FECHAS Y DATOS PERSONALES');
  if(b.no_realizo!=null&&typeof b.no_realizo!=='boolean'||b.no_cumplio!=null&&typeof b.no_cumplio!=='boolean'||b.no_realizo&&b.no_cumplio||(b.no_realizo||b.no_cumplio)&&b.valor!==0)return fail('ESTADO DE PRUEBA NO VÁLIDO');
  const excel=esExcelencia(plan.grupos.find(g=>g.alumnos.includes(person.id)));if(b.prueba==='barras'&&!excel||b.no_cumplio&&(!excel||!['barras','natacion'].includes(b.prueba)))return fail('PRUEBA NO CORRESPONDE AL GRUPO');
  if(!b.no_realizo&&b.prueba==='talla_peso'&&validarMedidas(b.valor,b.talla))return fail(validarMedidas(b.valor,b.talla));
  if(!['talla_peso','aerobica'].includes(b.prueba)&&!(excel&&b.prueba==='natacion')&&!Number.isInteger(b.valor))return fail('USE REPETICIONES O METROS ENTEROS');
  const condiciones=await checked(sb.from('post_ef_condiciones').select('*').eq('organizacion_id',plan.id).eq('postulante_id',person.id).in('prueba',['TODAS',b.prueba]).order('creado_en',{ascending:false}).limit(1));if(condiciones[0]&&condiciones[0].estado!=='NORMAL')return fail('POSTULANTE CON NOVEDAD. EL ORGANIZADOR DEBE ACTUALIZARLA.',409);
  const calculo={estado:b.no_realizo?'NO_REALIZO':b.no_cumplio?'NO_CUMPLIO':'PENDIENTE_ACTA',nota:null,motivo:'MARCA DE ADMISIÓN. CALIFICACIÓN SEGÚN ACTA.',evaluador_nombre:actorNombre,ciclo:POST,curso:'POSTULANTES',grupo:plan.grupos.find(g=>g.alumnos.includes(person.id)).color,organizacion_nombre:plan.nombre,modalidad:excel?'EXCELENCIA':'ORDINARIA',...(b.prueba==='talla_peso'&&!b.no_realizo?{peso:b.valor,talla:b.talla}:{} )};
  const row={id:b.id,organizacion_id:plan.id,postulante_id:person.id,prueba:b.prueba,fecha:b.fecha,valor:b.valor,sexo:b.sexo,nacimiento:b.nacimiento,calculo,actor_id:id,modo:plan.modo==='EVALUACION'?'EVALUACION':'PRUEBA'};
  const q=await sb.from('post_ef_registros').insert(row).select().single();if(q.error?.code==='23505'){const prev=await checked(sb.from('post_ef_registros').select('*').eq('id',b.id).single());if(Object.keys(row).some(k=>k==='calculo'?Object.keys(row.calculo).some(f=>prev.calculo[f]!==row.calculo[f]):prev[k]!==row[k]))return fail('IDENTIFICADOR YA UTILIZADO POR OTRA MARCA',409);return reply(200,{ok:true,registro:serialize(prev)});}if(q.error)throw q.error;return reply(200,{ok:true,registro:serialize(q.data)});
 }
 if(b.accion==='historial'||b.accion==='historial_detalle'||b.accion==='conformidades'){
  if(!consulta)return fail('CONSULTA GENERAL NO HABILITADA',403);
  const ps=await checked(sb.from('post_ef_organizaciones').select('*').order('fecha',{ascending:false}));const cs=await getNomina();
  if(b.accion==='historial'){const rs=await leerPaginas(()=>sb.from('post_ef_registros').select('*').order('revision'));return reply(200,{ok:true,evaluaciones:indiceHistorial(ps,rs.map(serialize),cs),servidor_en:new Date().toISOString()});}
  if(b.accion==='historial_detalle'&&!plan)return fail('SELECCIONE UNA ORGANIZACIÓN');
  const plans=plan?[plan]:ps.filter(p=>p.fecha===b.fecha),ids=plans.map(p=>p.id),rs=ids.length?await leerPaginas(()=>sb.from('post_ef_registros').select('*').in('organizacion_id',ids).order('revision',{ascending:false})):[];
  return reply(200,{ok:true,fecha:plan?.fecha||b.fecha,ciclo:POST,organizacion:plan,organizaciones:plans,cursantes:cs.filter(c=>plans.some(p=>p.grupos.some(g=>g.alumnos.includes(c.id)))),registros:rs.map(serialize),condiciones:plan?(await getConditions(plan)).map(serialize):[],servidor_en:new Date().toISOString()});
 }
 if(b.accion==='historial_borrados')return reply(200,{ok:true,borrados:[]});
 return fail('ACCIÓN NO DISPONIBLE PARA POSTULANTES. SUS MARCAS PERMANECEN EN EL ARCHIVO.');
}
