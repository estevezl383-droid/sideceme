import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import {datosHojaServidor,sha256} from '../efm-campo/hoja-modelo.mjs';
const sb=createClient(Deno.env.get('SUPABASE_URL')||'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'');
const headers={'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};
const reply=(status:number,data:any)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});if(req.method!=='GET')return reply(405,{ok:false,error:'MÉTODO NO PERMITIDO'});
 try{
  const token=new URL(req.url).searchParams.get('t')||'';if(!/^[A-Za-z0-9_-]{43}$/.test(token))return reply(404,{ok:false,error:'DOCUMENTO NO ENCONTRADO'});
  const q=await sb.from('efmc_documentos').select('*').eq('token_hash',await sha256(token)).maybeSingle();if(q.error)throw q.error;if(!q.data)return reply(404,{ok:false,error:'DOCUMENTO NO ENCONTRADO'});
  const d=q.data,s=d.snapshot;let vigente=null;
  try{const actual=await datosHojaServidor(sb,d.cursante_id,d.organizacion_id);vigente=actual?await sha256(JSON.stringify(actual.snapshot))===d.fingerprint:false;}catch{vigente=null;}
  return reply(200,{ok:true,documento:{codigo:d.id,emitido_en:d.emitido_en,nombre:s.cursante.nombre,grado:s.cursante.grado,ciclo:s.cursante.ciclo,evaluacion:s.evaluacion.nombre,fecha:s.evaluacion.fecha,estado:s.estado,final:s.final,pruebas:s.rows.map(r=>({nombre:r.nombre,nota:r.nota,confirmado_en:r.confirmado_en}))},sha256:d.pdf_sha256,vigente});
 }catch(e){console.error('efm-verificar',e?.message);return reply(503,{ok:false,error:'NO SE PUDO CONSULTAR LA EMISIÓN. REINTENTÁ.'});}
});
