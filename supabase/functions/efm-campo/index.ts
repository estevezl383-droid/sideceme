import {JEFES,ESTACIONES,CONDICIONES,puedeEvaluar,validarPlan,asignaciones,puedeRegistrar} from './organizacion.mjs';
import {validarNacimiento} from './perfil.mjs';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import {calificar,edad,calificarExcelencia,esExcelencia} from './baremos.mjs';
import {validarMedidas,calificarMedidas} from './medidas.mjs';
import {hojaPDFAlumno} from './documentos.mjs';
const sb=createClient(Deno.env.get('SUPABASE_URL')||'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'');
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(status:number,data:any)=>new Response(JSON.stringify(data),{status,headers});
async function conConformidades(records){
 const ids=records.filter(r=>r.organizacion_id).map(r=>r.id);
 if(!ids.length)return records;
 const q=await sb.from('efmc_conformidades').select('registro_id,cursante_id,confirmado_en').in('registro_id',ids);
 if(q.error)throw q.error;
 const byId=new Map(q.data.map(c=>[c.registro_id,c]));
 return records.map(r=>({...r,conformidad:byId.get(r.id)||null}));
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply(405,{ok:false,error:'MÉTODO NO PERMITIDO'});
 try{
  const b=await req.json();
  if(typeof b.token!=='string'||b.token.length>200)return reply(401,{ok:false,error:'SESIÓN REQUERIDA'});
  const {data:s,error:se}=await sb.from('sesiones').select('usuario_id,usuario_ci,usuario_tabla,expira_en,revocado,es_master,soporte_actor_id,soporte_actor_ci').eq('token',b.token).maybeSingle();
  if(se)throw se;
  if(!s||s.revocado!==false||!Number.isFinite(Date.parse(s.expira_en))||Date.parse(s.expira_en)<=Date.now())return reply(401,{ok:false,error:'SESIÓN VENCIDA'});
  if(s.es_master!==false)return reply(403,{ok:false,error:'USÁ TU CUENTA PERSONAL'});
  const soporte=s.soporte_actor_id!=null||s.soporte_actor_ci!=null;
  if(soporte){
   if(s.usuario_tabla!=='cursantes'||s.soporte_actor_id!=='P030'||typeof s.soporte_actor_ci!=='string'||!s.soporte_actor_ci)return reply(403,{ok:false,error:'SOPORTE DE CURSANTE NO AUTORIZADO'});
   const a=await sb.from('profesores').select('id,activo,rol').eq('id',s.soporte_actor_id).eq('ci',s.soporte_actor_ci).maybeSingle();if(a.error)throw a.error;
   if(a.data?.activo!==true||a.data?.rol!=='ciencia_tecnologia')return reply(403,{ok:false,error:'CUENTA DE SOPORTE NO HABILITADA'});
   if(!['acceso','mis_evaluaciones'].includes(b.accion))return reply(403,{ok:false,error:'SOPORTE ES SÓLO CONSULTA. LA CONFORMIDAD DEBE DARLA EL ALUMNO DESDE SU CUENTA PERSONAL.'});
  }
  if(s.usuario_tabla==='cursantes'){
   const q=await sb.from('cursantes').select('id,nombre_completo,ciclo,activo').eq('id',s.usuario_id).eq('ci',s.usuario_ci).eq('activo',true).maybeSingle();
   if(q.error||q.data?.activo!==true)return reply(403,{ok:false,error:'CUENTA DE CURSANTE NO HABILITADA'});
   if(b.accion==='acceso')return reply(200,{ok:true,alumno:true,solo_lectura:soporte});
   if(b.accion==='hoja_pdf'){const pdf=await hojaPDFAlumno(sb,s.usuario_id,b);return reply(pdf.status,pdf.data);}
   if(b.accion==='mis_evaluaciones'){
    const ps=await sb.from('efmc_organizaciones').select('*').eq('habilitado',true).eq('modo','EVALUACION').order('fecha',{ascending:false});if(ps.error)throw ps.error;
    const plans=ps.data.filter(p=>p.grupos.some(g=>g.alumnos.includes(s.usuario_id)));
    const ids=plans.map(p=>p.id);
    const rs=ids.length?await sb.from('efmc_registros').select('*').eq('cursante_id',s.usuario_id).in('organizacion_id',ids).order('revision',{ascending:false}).limit(10000):{data:[]};if(rs.error)throw rs.error;
    return reply(200,{ok:true,solo_lectura:soporte,alumno:q.data,organizaciones:plans.map(p=>({id:p.id,nombre:p.nombre,fecha:p.fecha,ciclo:p.ciclo,grupo:p.grupos.find(g=>g.alumnos.includes(s.usuario_id))?.color,modalidad:esExcelencia(p.grupos.find(g=>g.alumnos.includes(s.usuario_id)))?'EXCELENCIA':'ORDINARIA'})),registros:await conConformidades(rs.data),servidor_en:new Date().toISOString()});
   }
   if(b.accion==='confirmar'){
    if(typeof b.registro_id!=='string'||!/^[0-9a-f-]{36}$/i.test(b.registro_id))return reply(400,{ok:false,error:'REGISTRO NO VÁLIDO'});
    const r=await sb.rpc('efmc_confirmar_registro',{p_registro_id:b.registro_id,p_cursante_id:s.usuario_id});if(r.error)throw r.error;
    return reply(r.data?.ok?200:409,r.data);
   }
   return reply(403,{ok:false,error:'EL CURSANTE SÓLO PUEDE CONSULTAR, CONFIRMAR Y DESCARGAR SU HOJA EN PDF'});
  }
  if(s.usuario_tabla!=='profesores')return reply(403,{ok:false,error:'USÁ TU CUENTA PERSONAL'});
  const {data:actor,error:ae}=await sb.from('profesores').select('id,ci,activo,grado,arma,especialidad,nombre_completo,es_suboficial,es_auxiliar,solo_lectura').eq('id',s.usuario_id).eq('ci',s.usuario_ci).single();
  if(ae||actor?.activo!==true||!puedeEvaluar({...actor,id:s.usuario_id}))return reply(403,{ok:false,error:'CUENTA NO HABILITADA PARA EVALUAR'});
  const jefe=JEFES.includes(s.usuario_id);
  const actorNombre=[actor.grado,actor.nombre_completo].filter(Boolean).join(' ');
  if(['organizar','condicion'].includes(b.accion)&&!jefe)return reply(403,{ok:false,error:'SOLO AGUIRRE, LINARES Y MORALES ORGANIZAN LAS PRUEBAS'});
  let plan=null;
  if(b.organizacion_id){
   const q=await sb.from('efmc_organizaciones').select('*').eq('id',b.organizacion_id).maybeSingle();if(q.error)throw q.error;plan=q.data;
   if(!plan||(!jefe&&!asignaciones(plan,s.usuario_id).length))return reply(403,{ok:false,error:'ORGANIZACIÓN NO HABILITADA PARA TU CUENTA'});
   if(b.fecha&&plan.fecha!==b.fecha)return reply(400,{ok:false,error:'LA FECHA NO CORRESPONDE A LA ORGANIZACIÓN'});
  }
  if(['preparar_publicacion','publicar_diagnostica'].includes(b.accion)){
   if(!jefe)return reply(403,{ok:false,error:'SÓLO AGUIRRE, LINARES Y MORALES PUEDEN CERRAR Y PUBLICAR'});
   if(!plan||!Number.isInteger(b.version)||![1,2].includes(b.semestre))return reply(400,{ok:false,error:'REVISAR EVALUACIÓN Y SEMESTRE'});
   const r=await sb.rpc('efmc_publicar_diagnostica',{p_organizacion:plan.id,p_actor:s.usuario_id,p_version:b.version,p_semestre:b.semestre,p_publicar:b.accion==='publicar_diagnostica',p_huella:typeof b.huella==='string'?b.huella:null});
   if(r.error)throw r.error;return reply(r.data?.ok?200:409,r.data);
  }
  if(b.accion==='acceso'){
   if(jefe)return reply(200,{ok:true,jefe:true});
   const q=await sb.from('efmc_organizaciones').select('*').eq('habilitado',true);if(q.error)throw q.error;
   return q.data.some(p=>asignaciones(p,s.usuario_id).length)?reply(200,{ok:true,jefe:false}):reply(403,{ok:false,error:'SIN DESIGNACIONES HABILITADAS'});
  }
  if(b.accion==='conformidades'){
   if(!jefe)return reply(403,{ok:false,error:'SÓLO LOS JEFES DE ENTRENAMIENTO FÍSICO CONSULTAN EL DETALLE GENERAL'});
   if(!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha)||edad(b.fecha,b.fecha)===null)return reply(400,{ok:false,error:'FECHA NO VÁLIDA'});
   const ps=await sb.from('efmc_organizaciones').select('*').eq('fecha',b.fecha).eq('modo','EVALUACION').eq('habilitado',true).order('ciclo');if(ps.error)throw ps.error;
   const plans=ps.data.filter(p=>!plan||p.nombre===plan.nombre),orgIds=plans.map(p=>p.id),ids=[...new Set(plans.flatMap(p=>p.grupos.flatMap(g=>g.alumnos)))];
   const [cs,rs]=ids.length?await Promise.all([sb.from('cursantes').select('id,nombre_completo,ciclo').in('id',ids).eq('activo',true).order('nombre_completo'),sb.from('efmc_registros').select('*').in('organizacion_id',orgIds).in('cursante_id',ids).order('revision',{ascending:false}).limit(10000)]):[{data:[]},{data:[]}];
   if(cs.error||rs.error)throw cs.error||rs.error;
   return reply(200,{ok:true,organizaciones:plans.map(p=>({id:p.id,nombre:p.nombre,fecha:p.fecha,ciclo:p.ciclo,grupos:p.grupos.map(g=>({id:g.id,color:g.color,modalidad:g.modalidad,alumnos:g.alumnos}))})),cursantes:cs.data,registros:await conConformidades(rs.data),servidor_en:new Date().toISOString()});
  }
  if(b.accion==='organizar'){
   const input=b.plan;
   if(!input||!/^[0-9a-f-]{36}$/i.test(input.id)||!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha)||edad(input.fecha,input.fecha)===null||!Number.isInteger(input.version)||input.version<0)return reply(400,{ok:false,error:'ORGANIZACIÓN NO VÁLIDA'});
   const [cs,ps]=await Promise.all([sb.from('cursantes').select('id,ciclo').eq('activo',true),sb.from('profesores').select('id,activo,grado,es_suboficial,es_auxiliar,solo_lectura').eq('activo',true)]);if(cs.error||ps.error)throw cs.error||ps.error;
   const issue=validarPlan(input,cs.data,ps.data);if(issue)return reply(400,{ok:false,error:issue});
   const prev=await sb.from('efmc_organizaciones').select('*').eq('id',input.id).maybeSingle();if(prev.error)throw prev.error;
   if(prev.data?.publicada_en)return reply(409,{ok:false,error:'EVALUACIÓN CERRADA Y PUBLICADA. EL HISTORIAL NO SE PUEDE REORGANIZAR.'});
   if(prev.data&&(prev.data.fecha!==input.fecha||prev.data.ciclo!==input.ciclo))return reply(400,{ok:false,error:'CREÁ OTRA ORGANIZACIÓN PARA CAMBIAR FECHA O CICLO'});
   const row={id:input.id,nombre:input.nombre.trim(),fecha:input.fecha,ciclo:input.ciclo,modo:input.modo,habilitado:input.habilitado,grupos:input.grupos,version:input.version+1,actor_id:s.usuario_id,actualizado_en:new Date().toISOString()};
   const q=prev.data?await sb.from('efmc_organizaciones').update(row).eq('id',input.id).eq('version',input.version).select().maybeSingle():input.version===0?await sb.from('efmc_organizaciones').insert(row).select().single():{error:{code:'CONFLICT'}};
   if(q.error?.code==='23505'||q.error?.code==='CONFLICT'||(!q.error&&!q.data))return reply(409,{ok:false,error:'OTRO JEFE ACTUALIZÓ ESTA ORGANIZACIÓN. RECARGÁ ANTES DE EDITAR.'});if(q.error)throw q.error;
   return reply(200,{ok:true,plan:q.data});
  }
  if(plan?.publicada_en&&['condicion','registrar'].includes(b.accion))return reply(409,{ok:false,error:'EVALUACIÓN CERRADA Y PUBLICADA. REVISÁ LAS NOTAS Y RECLAMOS EN EL PANEL EFM.'});
  if(b.accion==='condicion'){
   if(!plan||!plan.grupos.some(g=>g.alumnos.includes(b.cursante_id))||(!ESTACIONES[b.prueba]&&b.prueba!=='TODAS')||!CONDICIONES[b.estado]||!/^[0-9a-f-]{36}$/i.test(b.id)||typeof b.observacion!=='string'||b.observacion.length>600||typeof b.referencia!=='string'||b.referencia.length>160)return reply(400,{ok:false,error:'REVISAR CURSANTE, PRUEBA Y CONDICIÓN'});
   if(b.estado==='CON_PAPELETA'&&!b.referencia.trim())return reply(400,{ok:false,error:'INDICÁ LA REFERENCIA DE LA PAPELETA MÉDICA'});
   const row={id:b.id,organizacion_id:plan.id,cursante_id:b.cursante_id,prueba:b.prueba,estado:b.estado,observacion:b.observacion,referencia:b.referencia,actor_id:s.usuario_id};
   const q=await sb.from('efmc_condiciones').insert(row).select().single();if(q.error?.code==='23505'){const prev=await sb.from('efmc_condiciones').select('*').eq('id',b.id).single();if(prev.error)throw prev.error;if(Object.keys(row).some(k=>prev.data[k]!==row[k]))return reply(409,{ok:false,error:'IDENTIFICADOR DE CONDICIÓN EN CONFLICTO'});return reply(200,{ok:true,condicion:prev.data});}if(q.error)throw q.error;return reply(200,{ok:true,condicion:q.data});
  }
  if(b.accion==='cargar'){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha)||edad(b.fecha,b.fecha)===null)return reply(400,{ok:false,error:'FECHA NO VÁLIDA'});
   if(b.inicial&&!plan){
    const upcoming=await sb.from('efmc_organizaciones').select('*').eq('habilitado',true).eq('modo','EVALUACION').order('fecha',{ascending:true});if(upcoming.error)throw upcoming.error;
    plan=upcoming.data.find(p=>p.fecha>=b.fecha&&(jefe||asignaciones(p,s.usuario_id).length))||null;
    if(plan)b.fecha=plan.fecha;
   }
   const plans=await sb.from('efmc_organizaciones').select('*').eq('fecha',b.fecha).order('actualizado_en',{ascending:false});if(plans.error)throw plans.error;
   const disponibles=jefe?plans.data:plans.data.filter(p=>asignaciones(p,s.usuario_id).length);
   if(!jefe&&!plan)plan=disponibles[0]||null;
   if(!jefe&&!plan)return reply(403,{ok:false,error:'SIN DESIGNACIONES PARA ESTA FECHA'});
   const assignments=jefe?[]:asignaciones(plan,s.usuario_id),ids=[...new Set(assignments.flatMap(a=>a.alumnos))];
   const [c,p,r,conditions,people]=await Promise.all([
    jefe?sb.from('cursantes').select('id,ci,nombre_completo,ciclo,grado,arma,paralelo').eq('activo',true).order('nombre_completo'):sb.from('cursantes').select('id,ci,nombre_completo,ciclo,grado,arma,paralelo').eq('activo',true).in('id',ids).order('nombre_completo'),
    jefe?sb.from('efmc_perfiles').select('*'):sb.from('efmc_perfiles').select('*').in('cursante_id',ids),
    (plan?sb.from('efmc_registros').select('*').eq('organizacion_id',plan.id):sb.from('efmc_registros').select('*').is('organizacion_id',null)).eq('fecha',b.fecha).order('creado_en',{ascending:false}).limit(10000),
    plan?sb.from('efmc_condiciones').select('*').eq('organizacion_id',plan.id).order('creado_en',{ascending:false}).limit(10000):Promise.resolve({data:[]}),
    jefe?sb.from('profesores').select('id,nombre_completo,grado,activo,es_suboficial,es_auxiliar,solo_lectura').eq('activo',true).order('nombre_completo'):Promise.resolve({data:[]})
   ]);
   if(c.error||p.error||r.error||conditions.error||people.error)throw c.error||p.error||r.error||conditions.error||people.error;
   const safeRecords=jefe?r.data:r.data.filter(x=>assignments.some(a=>a.prueba===x.prueba&&a.alumnos.includes(x.cursante_id)));
   const safeConditions=jefe?conditions.data:conditions.data.filter(x=>ids.includes(x.cursante_id)&&(x.prueba==='TODAS'||assignments.some(a=>a.prueba===x.prueba&&a.alumnos.includes(x.cursante_id))));
   const paths=p.data.filter(x=>x.foto_path).map(x=>x.foto_path);
   const signed=paths.length?await sb.storage.from('efm-retratos').createSignedUrls(paths,1800):{data:[]};
   const urls=new Map((signed.data||[]).map(x=>[x.path,x.signedUrl]));
   const safePlan=plan&&(jefe?plan:{id:plan.id,nombre:plan.nombre,ciclo:plan.ciclo,fecha:plan.fecha,version:plan.version,modo:plan.modo,habilitado:plan.habilitado,grupos:plan.grupos.filter(g=>assignments.some(a=>a.grupo===g.id)).map(g=>({id:g.id,color:g.color,modalidad:g.modalidad,alumnos:g.alumnos}))});
   return reply(200,{ok:true,fecha:b.fecha,jefe,actor_nombre:actorNombre,organizacion:safePlan,organizaciones:disponibles.map(p=>({id:p.id,nombre:p.nombre,ciclo:p.ciclo,modo:p.modo,habilitado:p.habilitado})),asignaciones:assignments,condiciones:safeConditions,personal:people.data,cursantes:c.data.map(x=>{const pp=p.data.find(y=>y.cursante_id===x.id)||{};return {...x,...pp,foto:urls.get(pp.foto_path)||null};}),registros:await conConformidades(safeRecords.map(x=>({...x,evaluador_nombre:x.calculo?.evaluador_nombre||(x.actor_id===s.usuario_id?actorNombre:'')})))});
  }
  if(b.accion==='sincronizar'){
   if(!plan)return reply(400,{ok:false,error:'SELECCIONÁ UNA EVALUACIÓN'});
   const [r,c]=await Promise.all([sb.from('efmc_registros').select('*').eq('organizacion_id',plan.id).order('revision',{ascending:false}).limit(10000),sb.from('efmc_condiciones').select('*').eq('organizacion_id',plan.id).order('creado_en',{ascending:false}).limit(10000)]);
   if(r.error||c.error)throw r.error||c.error;
   const assignments=jefe?[]:asignaciones(plan,s.usuario_id),ids=new Set(assignments.flatMap(a=>a.alumnos));
   const records=jefe?r.data:r.data.filter(x=>assignments.some(a=>a.prueba===x.prueba&&a.alumnos.includes(x.cursante_id)));
   return reply(200,{ok:true,version:plan.version,habilitado:plan.habilitado,registros:await conConformidades(records),condiciones:jefe?c.data:c.data.filter(x=>ids.has(x.cursante_id)&&(x.prueba==='TODAS'||assignments.some(a=>a.prueba===x.prueba&&a.alumnos.includes(x.cursante_id)))),servidor_en:new Date().toISOString()});
  }
  if(!jefe&&!plan)return reply(403,{ok:false,error:'NECESITÁS UNA DESIGNACIÓN HABILITADA'});
  if(b.accion==='guardar_datos'){
   if(!jefe&&!asignaciones(plan,s.usuario_id).some(a=>a.alumnos.includes(b.cursante_id)))return reply(403,{ok:false,error:'CURSANTE FUERA DE TU GRUPO'});
   if(!['M','F'].includes(b.sexo)||edad(b.fecha,b.fecha)===null||validarNacimiento(b.nacimiento,b.fecha))return reply(400,{ok:false,error:'REVISAR FECHA COMPLETA Y SEXO'});
   const {data:c,error:ce}=await sb.from('cursantes').select('id').eq('id',b.cursante_id).eq('activo',true).maybeSingle();
   if(ce||!c)return reply(400,{ok:false,error:'CURSANTE NO VÁLIDO'});
   // Partial upsert preserves photo_path and source provenance on existing profiles.
   const {data:perfil,error:pe}=await sb.from('efmc_perfiles').upsert({cursante_id:c.id,fecha_nacimiento:b.nacimiento,sexo:b.sexo,actualizado_en:new Date().toISOString()},{onConflict:'cursante_id'}).select().single();
   if(pe)throw pe;return reply(200,{ok:true,perfil});
  }
  if(b.accion==='registrar'){
   if(plan&&(!plan.habilitado||!plan.grupos.some(g=>g.alumnos.includes(b.cursante_id))))return reply(403,{ok:false,error:'ORGANIZACIÓN DESHABILITADA O CURSANTE FUERA DEL GRUPO'});
   if((!jefe||plan?.modo==='EVALUACION')&&!puedeRegistrar(plan,s.usuario_id,b.cursante_id,b.prueba))return reply(403,{ok:false,error:'PRUEBA O CURSANTE NO ASIGNADO A TU CUENTA'});
   if(plan){const q=await sb.from('efmc_condiciones').select('*').eq('organizacion_id',plan.id).eq('cursante_id',b.cursante_id).in('prueba',['TODAS',b.prueba]).order('creado_en',{ascending:false}).limit(1);if(q.error)throw q.error;if(q.data[0]&&q.data[0].estado!=='NORMAL')return reply(409,{ok:false,error:'CURSANTE CON NOVEDAD: '+CONDICIONES[q.data[0].estado]+'. EL JEFE DEBE ACTUALIZAR SU CONDICIÓN ANTES DE EVALUAR.'});}
   if(!/^[0-9a-f-]{36}$/i.test(b.id)||typeof b.valor!=='number'||!Number.isFinite(b.valor)||b.valor<0||b.valor>10000||!['flexiones','abdominales','aerobica','natacion','barras','talla_peso'].includes(b.prueba)||!['M','F'].includes(b.sexo)||!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha)||edad(b.fecha,b.fecha)===null||validarNacimiento(b.nacimiento,b.fecha))return reply(400,{ok:false,error:'REVISAR MARCA, FECHAS Y TABLA'});
   if(b.no_realizo!=null&&typeof b.no_realizo!=='boolean')return reply(400,{ok:false,error:'ESTADO DE PRUEBA NO VÁLIDO'});
   if(b.no_realizo&&b.valor!==0)return reply(400,{ok:false,error:'NO REALIZÓ NO ADMITE MARCA'});
   if(!b.no_realizo&&b.prueba==='talla_peso'&&(validarMedidas(b.valor,b.talla)))return reply(400,{ok:false,error:validarMedidas(b.valor,b.talla)});
   const excelencia=esExcelencia(plan?.grupos.find(g=>g.alumnos.includes(b.cursante_id)));
   if(plan&&b.prueba==='barras'&&!excelencia)return reply(403,{ok:false,error:'BARRAS REQUIERE GRUPO DE EXCELENCIA'});
   if(b.no_cumplio!==undefined&&(typeof b.no_cumplio!=='boolean'||!excelencia||!['natacion','barras'].includes(b.prueba)||b.valor!==0||b.no_realizo))return reply(400,{ok:false,error:'NO CUMPLIÓ REQUIERE GRUPO DE EXCELENCIA, BARRAS O NATACIÓN Y SIN MARCA'});
   if(b.prueba!=='aerobica'&&b.prueba!=='talla_peso'&&!(excelencia&&b.prueba==='natacion')&&!Number.isInteger(b.valor))return reply(400,{ok:false,error:'USAR UN NÚMERO ENTERO'});
   const {data:c,error:ce}=await sb.from('cursantes').select('id').eq('id',b.cursante_id).eq('activo',true).maybeSingle();
   if(ce||!c)return reply(400,{ok:false,error:'CURSANTE NO VÁLIDO'});
   const calculo=b.no_cumplio?{estado:'NO_CUMPLIO',modalidad:'EXCELENCIA',cumple:false,nota:0,motivo:'NO CUMPLIÓ LA PRUEBA'}:b.no_realizo?{estado:'NO_REALIZO',nota:null,motivo:'NO REALIZÓ LA PRUEBA'}:b.prueba==='talla_peso'?calificarMedidas(b.valor,b.talla,b.sexo,b.nacimiento,b.fecha):excelencia?calificarExcelencia(b.prueba,b.valor,b.sexo,b.nacimiento,b.fecha):calificar(b.prueba,b.valor,b.sexo,b.nacimiento,b.fecha);
   if(!b.no_realizo&&b.prueba==='talla_peso'&&calculo.nota===null)return reply(400,{ok:false,error:calculo.motivo});
   calculo.evaluador_nombre=actorNombre;
   if(plan){calculo.organizacion_nombre=plan.nombre;calculo.modalidad=excelencia?'EXCELENCIA':'ORDINARIA';calculo.grupo=plan.grupos.find(g=>g.alumnos.includes(b.cursante_id))?.color;}
   const row={id:b.id,cursante_id:b.cursante_id,prueba:b.prueba,fecha:b.fecha,valor:b.valor,sexo:b.sexo,nacimiento:b.nacimiento||null,calculo,actor_id:s.usuario_id,...(plan?{organizacion_id:plan.id,...(plan.modo==='EVALUACION'?{modo:'EVALUACION'}:{})}:{})};
   const {data,error}=await sb.from('efmc_registros').insert(row).select().single();
   if(error?.code==='23505'){
    const {data:prev,error:pe}=await sb.from('efmc_registros').select('*').eq('id',b.id).single();
    if(pe)throw pe;
    if(prev.actor_id!==row.actor_id||(prev.organizacion_id||null)!==(row.organizacion_id||null)||prev.cursante_id!==row.cursante_id||prev.prueba!==row.prueba||prev.fecha!==row.fecha||Number(prev.valor)!==row.valor||prev.sexo!==row.sexo||prev.nacimiento!==row.nacimiento||((prev.calculo.estado==='NO_REALIZO')!==!!b.no_realizo)||((prev.calculo.estado==='NO_CUMPLIO')!==!!b.no_cumplio)||(!b.no_realizo&&b.prueba==='talla_peso'&&(Number(prev.calculo.talla)!==b.talla||prev.calculo.nota!==calculo.nota)))return reply(409,{ok:false,error:'EL IDENTIFICADOR YA PERTENECE A OTRA MARCA'});
    return reply(200,{ok:true,registro:prev});
   }
   if(error)throw error;
   return reply(200,{ok:true,registro:data});
  }
  return reply(400,{ok:false,error:'ACCIÓN NO VÁLIDA'});
 }catch(e){console.error('efm-campo',e?.message);return reply(503,{ok:false,error:'NO SE GUARDÓ. CONSERVÁ LA MARCA Y REINTENTÁ.'});}
});
