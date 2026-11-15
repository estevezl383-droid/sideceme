import {puedeEvaluar,asignaciones} from './organizacion.mjs';
import {POST,esPost,operarPostulantes} from './postulantes.mjs';
// Called only after the session and the actual P030 supervisor have been verified.
export async function operarSoporteEvaluador({sb,b,s,reply}){
 const fail=message=>reply(403,{ok:false,error:message});
 if(s.soporte_actor_id!=='P030'||s.usuario_tabla!=='profesores')return fail('SOPORTE DE EVALUADOR NO AUTORIZADO');
 const a=await sb.from('profesores').select('id,nombre_completo,grado,activo,es_suboficial,es_auxiliar,solo_lectura').eq('id',s.usuario_id).eq('ci',s.usuario_ci).maybeSingle();
 if(a.error)throw a.error;if(!puedeEvaluar(a.data))return fail('EVALUADOR NO HABILITADO');
 const q=await sb.from('post_ef_organizaciones').select('*').eq('habilitado',true).order('actualizado_en',{ascending:false});
 if(q.error)throw q.error;
 const hoy=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/La_Paz'}).format(new Date());
 const ps=q.data.filter(p=>p.modo==='PILOTO'&&p.fecha<=hoy&&(!p.practica_hasta||p.practica_hasta>=hoy)&&asignaciones(p,a.data.id).length);
 if(!ps.length)return fail('SIN PRÁCTICAS VIGENTES ASIGNADAS A ESTE EVALUADOR');
 if(b.accion==='acceso')return reply(200,{ok:true,jefe:false,postulantes:true,solo_postulantes:true,simulado:true});
 if(!esPost(b.ciclo)||!['cargar','sincronizar','registrar','guardar_datos','foto'].includes(b.accion)||b.simular_actor_id||b.simular_postulante)return fail('EL SOPORTE DEL EVALUADOR SOLO PERMITE PROBAR SUS ESTACIONES DE POSTULANTES');
 const plan=b.organizacion_id?ps.find(p=>p.id===b.organizacion_id):ps[0];
 if(!plan)return fail('EL SOPORTE SOLO REGISTRA EN UNA PRÁCTICA VIGENTE ASIGNADA');
 return operarPostulantes({sb,b:{...b,ciclo:POST,organizacion_id:plan.id,fecha:plan.fecha,inicial:false},actor:{...a.data,supervisor_id:'P030'},reply});
}
