const checked=async q=>{const r=await q;if(r.error)throw r.error;return r.data;};
export async function operarAlumnoPost({sb,b,reply,supervisor=null}){
 const fail=(error,status=403)=>reply(status,{ok:false,error});let pid,simulada=false;
 if(supervisor){if(supervisor.id!=='P030')return fail('SIMULACIÓN RESERVADA A MORALES');pid=b.simular_postulante;simulada=true;}
 else{const r=await sb.rpc('post_operar',{p_accion:'panel',p_token:b.token,p_datos:{},p_ip:''});if(r.error||!r.data?.ok||r.data.admin||!r.data.postulante_id)return fail('INGRESE CON SU CUENTA DE POSTULANTE');pid=r.data.postulante_id;}
 if(typeof pid!=='string'||!/^[0-9a-f-]{36}$/i.test(pid))return fail('POSTULANTE NO VÁLIDO');
 const persona=await checked(sb.from('post_ef_nomina').select('id,nombre_completo,grado,arma').eq('id',pid).eq('identidad_verificada',true).maybeSingle());if(!persona)return fail('POSTULANTE NO VERIFICADO');
 const todos=await checked(sb.from('post_ef_organizaciones').select('*').eq('habilitado',true).order('fecha',{ascending:false}));const planes=todos.filter(p=>p.grupos.some(g=>g.alumnos.includes(pid)));
 if(b.accion==='post_confirmar'){
  const r=await sb.rpc('post_ef_confirmar',{p_registro:b.registro_id,p_postulante:pid,p_simulada:simulada,p_actor:simulada?'P030':'POST:'+pid});if(r.error)return fail(r.error.message,409);return reply(200,{ok:true});
 }
 if(b.accion!=='post_mis_pruebas')return fail('ACCIÓN NO PERMITIDA');
 const ids=planes.map(p=>p.id);const registros=ids.length?await checked(sb.from('post_ef_registros').select('*').eq('postulante_id',pid).in('organizacion_id',ids).order('revision',{ascending:false})):[];
 const confirmadas=registros.length?await checked(sb.from('post_ef_conformidades').select('*').in('registro_id',registros.map(r=>r.id)).eq('simulada',simulada)):[];
 return reply(200,{ok:true,postulante:persona,simulada,organizaciones:planes.map(p=>({id:p.id,nombre:p.nombre,fecha:p.fecha,modo:p.modo,grupo:p.grupos.find(g=>g.alumnos.includes(pid)).color})),registros:registros.map(r=>({...r,cursante_id:r.postulante_id,conformidad:confirmadas.find(c=>c.registro_id===r.id)||null}))});
}
