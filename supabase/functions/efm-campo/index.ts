import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import {calificar,edad} from './baremos.mjs';
import {validarMedidas,calificarMedidas} from './medidas.mjs';
const sb=createClient(Deno.env.get('SUPABASE_URL')||'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'');
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(status:number,data:any)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply(405,{ok:false,error:'MÉTODO NO PERMITIDO'});
 try{
  const b=await req.json();
  if(typeof b.token!=='string'||b.token.length>200)return reply(401,{ok:false,error:'SESIÓN REQUERIDA'});
  const {data:s,error:se}=await sb.from('sesiones').select('usuario_id,usuario_ci,usuario_tabla,expira_en,revocado,es_master,soporte_actor_id,soporte_actor_ci').eq('token',b.token).maybeSingle();
  if(se)throw se;
  if(!s||s.revocado!==false||!Number.isFinite(Date.parse(s.expira_en))||Date.parse(s.expira_en)<=Date.now())return reply(401,{ok:false,error:'SESIÓN VENCIDA'});
  if(s.usuario_id!=='P030'||s.usuario_ci!=='4889191'||s.usuario_tabla!=='profesores'||s.es_master!==false||s.soporte_actor_id!=null||s.soporte_actor_ci!=null)return reply(403,{ok:false,error:'PRUEBA EXCLUSIVA DE TCNL. MORALES'});
  const {data:actor,error:ae}=await sb.from('profesores').select('activo').eq('id','P030').eq('ci','4889191').single();
  if(ae||actor?.activo!==true)return reply(403,{ok:false,error:'CUENTA NO HABILITADA'});
  if(b.accion==='cargar'){
   const [c,p,r]=await Promise.all([sb.from('cursantes').select('id,ci,nombre_completo,ciclo,grado,arma,paralelo').eq('activo',true).order('nombre_completo'),sb.from('efmc_perfiles').select('*'),sb.from('efmc_registros').select('*').eq('fecha',b.fecha).order('creado_en',{ascending:false}).limit(10000)]);
   if(c.error||p.error||r.error)throw c.error||p.error||r.error;
   const paths=p.data.filter((x:any)=>x.foto_path).map((x:any)=>x.foto_path);
   const signed=paths.length?await sb.storage.from('efm-retratos').createSignedUrls(paths,1800):{data:[]};
   const urls=new Map((signed.data||[]).map((x:any)=>[x.path,x.signedUrl]));
   return reply(200,{ok:true,cursantes:c.data.map((x:any)=>{const pp=p.data.find((y:any)=>y.cursante_id===x.id)||{};return {...x,...pp,foto:urls.get(pp.foto_path)||null};}),registros:r.data});
  }
  if(b.accion==='registrar'){
   if(!/^[0-9a-f-]{36}$/i.test(b.id)||typeof b.valor!=='number'||!Number.isFinite(b.valor)||b.valor<0||b.valor>10000||!['flexiones','abdominales','aerobica','natacion','barras','talla_peso'].includes(b.prueba)||!['M','F'].includes(b.sexo)||!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha)||edad(b.fecha,b.fecha)===null||edad(b.nacimiento,b.fecha)===null)return reply(400,{ok:false,error:'REVISAR MARCA, FECHAS Y TABLA'});
   if(b.prueba==='talla_peso'&&(validarMedidas(b.valor,b.talla)))return reply(400,{ok:false,error:validarMedidas(b.valor,b.talla)});
   if(b.prueba!=='aerobica'&&b.prueba!=='talla_peso'&&!Number.isInteger(b.valor))return reply(400,{ok:false,error:'USAR UN NÚMERO ENTERO'});
   const {data:c,error:ce}=await sb.from('cursantes').select('id').eq('id',b.cursante_id).eq('activo',true).maybeSingle();
   if(ce||!c)return reply(400,{ok:false,error:'CURSANTE NO VÁLIDO'});
   const calculo=b.prueba==='talla_peso'?calificarMedidas(b.valor,b.talla,b.sexo,b.nacimiento,b.fecha):calificar(b.prueba,b.valor,b.sexo,b.nacimiento,b.fecha);
   if(b.prueba==='talla_peso'&&calculo.nota===null)return reply(400,{ok:false,error:calculo.motivo});
   const row={id:b.id,cursante_id:b.cursante_id,prueba:b.prueba,fecha:b.fecha,valor:b.valor,sexo:b.sexo,nacimiento:b.nacimiento||null,calculo,actor_id:'P030'};
   const {data,error}=await sb.from('efmc_registros').insert(row).select().single();
   if(error?.code==='23505'){
    const {data:prev,error:pe}=await sb.from('efmc_registros').select('*').eq('id',b.id).single();
    if(pe)throw pe;
    if(prev.cursante_id!==row.cursante_id||prev.prueba!==row.prueba||prev.fecha!==row.fecha||Number(prev.valor)!==row.valor||prev.sexo!==row.sexo||prev.nacimiento!==row.nacimiento||(b.prueba==='talla_peso'&&(Number(prev.calculo.talla)!==b.talla||prev.calculo.nota!==calculo.nota)))return reply(409,{ok:false,error:'EL IDENTIFICADOR YA PERTENECE A OTRA MARCA'});
    return reply(200,{ok:true,registro:prev});
   }
   if(error)throw error;
   return reply(200,{ok:true,registro:data});
  }
  return reply(400,{ok:false,error:'ACCIÓN NO VÁLIDA'});
 }catch(e){console.error('efm-campo',e?.message);return reply(503,{ok:false,error:'NO SE GUARDÓ. CONSERVÁ LA MARCA Y REINTENTÁ.'});}
});
