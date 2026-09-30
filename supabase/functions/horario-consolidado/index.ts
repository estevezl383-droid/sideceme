import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { consolidar, calendario } from "./consolidar.js";
const sb = createClient(Deno.env.get("SUPABASE_URL")||"",Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"");
const ids = ["P030","P032","S002"];
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization, apikey, x-client-info"};
const json=(data:object,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
const fail=(error:string,status=400)=>json({ok:false,error},status);
function check(result:any){if(result.error)throw Error("No se pudo completar la operación. Intente nuevamente.");return result.data;}
async function cuenta(id:string,tabla:string){
  if(!["profesores","cursantes"].includes(tabla))return null;
  const {data,error}=await sb.from(tabla).select(tabla==="profesores"?"id,grado,nombre_completo,activo":"id,grado,nombre_completo,activo,ciclo").eq("id",id).maybeSingle();
  if(error||!data||data.activo===false)return null;
  const audiencias=tabla==="profesores"?["todos","planta","c1","c2"]:data.ciclo==="1ER CICLO"?["c1"]:data.ciclo==="2DO CICLO"?["c2"]:[];
  return {...data,tabla,audiencias,planifica:tabla==="profesores"&&ids.includes(id)};
}
async function validar(token:string){
  const {data,error}=await sb.from("sesiones").select("usuario_id,usuario_tabla,expira_en,revocado").eq("token",token).maybeSingle();
  if(error||!data||data.revocado||!(Date.parse(data.expira_en)>Date.now()))return null;
  return cuenta(data.usuario_id,data.usuario_tabla);
}
function visible(record:any,user:any){
  const datos=JSON.parse(JSON.stringify(record.datos));
  datos.datos=Object.fromEntries(["cab",...user.audiencias].filter(k=>datos.datos[k]).map(k=>[k,datos.datos[k]]));
  return {...record,datos};
}
function canonical(v:any):string { if(Array.isArray(v))return "["+v.map(canonical).join(",")+"]";if(v&&typeof v==="object")return "{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canonical(v[k])).join(",")+"}";return JSON.stringify(v); }
function contenido(s:any){return {gestion:s.gestion,semana_num:s.semana_num,fecha_desde:s.fecha_desde,fecha_hasta:s.fecha_hasta,periodo:s.periodo,lugar_fecha:s.lugar_fecha,datos:s.datos};}
async function publicados(){
  const pubs=check(await sb.from("planif_publicaciones").select("semana_id,consolidado_id,publicado_en,publicado_nombre").order("publicado_en",{ascending:false}));
  if(!pubs.length)return [];
  const records=check(await sb.from("planif_consolidados").select("id,semana_id,creado_nombre,creado_en,orientacion,datos").in("id",pubs.map((p:any)=>p.consolidado_id)));
  const weeks=check(await sb.from("planif_semanas").select("id,activo").in("id",pubs.map((p:any)=>p.semana_id)));
  const active=new Set(weeks.filter((s:any)=>s.activo!==false).map((s:any)=>s.id));
  return records.filter((r:any)=>active.has(r.semana_id)).map((r:any)=>({...r,publicacion:pubs.find((p:any)=>p.consolidado_id===r.id)})).sort((a:any,b:any)=>b.datos.fecha_desde.localeCompare(a.datos.fecha_desde));
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  try{
    if(req.method==="GET"){
      const token=new URL(req.url).searchParams.get("feed");
      if(!token||!/^[a-f0-9]{64}$/.test(token))return fail("Enlace no válido",404);
      const link=check(await sb.from("planif_calendario_enlaces").select("propietario,propietario_tabla,audiencia").eq("token",token).eq("activo",true).maybeSingle());
      const user=link?await cuenta(link.propietario,link.propietario_tabla||"profesores"):null;
      if(!user||!user.audiencias.includes(link.audiencia))return fail("Enlace no disponible",404);
      return new Response(calendario(await publicados(),link.audiencia),{headers:{...cors,"Content-Type":"text/calendar; charset=utf-8","Content-Disposition":"inline; filename=sideceme.ics","Cache-Control":"private, max-age=0, no-store"}});
    }
    if(req.method!=="POST")return fail("Método no permitido",405);
    const body=await req.json(),user=await validar(String(body.token||""));
    if(!user)return fail("Sesión no válida. Vuelva a iniciar sesión.",403);
    if(body.accion==="publicados")return json({ok:true,audiencias:user.audiencias,records:(await publicados()).map((r:any)=>visible(r,user))});
    if(body.accion==="enlace"||body.accion==="revocar"){
      if(!user.audiencias.includes(body.audiencia))return fail("No tiene acceso a este horario",403);
      if(body.accion==="revocar"){
        check(await sb.from("planif_calendario_enlaces").update({activo:false}).eq("propietario",user.id).eq("propietario_tabla",user.tabla).eq("audiencia",body.audiencia).eq("activo",true));
        return json({ok:true});
      }
      let link=check(await sb.from("planif_calendario_enlaces").select("token").eq("propietario",user.id).eq("propietario_tabla",user.tabla).eq("audiencia",body.audiencia).eq("activo",true).maybeSingle());
      if(!link){
        const created=await sb.from("planif_calendario_enlaces").insert({propietario:user.id,propietario_tabla:user.tabla,audiencia:body.audiencia}).select("token").single();
        link=created.error?check(await sb.from("planif_calendario_enlaces").select("token").eq("propietario",user.id).eq("propietario_tabla",user.tabla).eq("audiencia",body.audiencia).eq("activo",true).single()):created.data;
      }
      return json({ok:true,url:Deno.env.get("SUPABASE_URL")+"/functions/v1/horario-consolidado?feed="+link.token});
    }
    if(!user.planifica)return fail("Solo Morales, Villarroel y Arce pueden consolidar o publicar semanas.",403);
    if(body.accion==="consolidar"){
      const source=check(await sb.rpc("planif_fuente_consolidada",{p_semana:body.semana_id}));
      if(!source?.semana)return fail("La semana no está disponible",404);
      const record=check(await sb.from("planif_consolidados").insert({semana_id:source.semana.id,creado_por:user.id,creado_nombre:[user.grado,user.nombre_completo].filter(Boolean).join(" "),orientacion:["landscape","portrait"].includes(body.orientacion)?body.orientacion:"modelo",datos:consolidar(source.semana,source.propuestas),fuente:source}).select("id,semana_id,creado_nombre,creado_en,orientacion,datos").single());
      return json({ok:true,record,pendientes:source.propuestas.filter((p:any)=>p.estado==="pendiente").length});
    }
    if(body.accion==="listar")return json({ok:true,records:check(await sb.from("planif_consolidados").select("id,creado_nombre,creado_en,orientacion").eq("semana_id",body.semana_id).order("id",{ascending:false}))});
    if(body.accion==="abrir")return json({ok:true,record:check(await sb.from("planif_consolidados").select("id,semana_id,creado_nombre,creado_en,orientacion,datos").eq("id",body.id).single())});
    if(body.accion==="publicar"){
      if(!Number.isSafeInteger(body.id)||body.id<=0)return fail("Versión inválida");
      // Publicar vuelve a comprobar la fuente; no publica un archivo anterior a las últimas correcciones.
      const record=check(await sb.from("planif_consolidados").select("id,semana_id,datos").eq("id",body.id).maybeSingle());
      if(!record)return fail("Versión no encontrada",404);
      const source=check(await sb.rpc("planif_fuente_consolidada",{p_semana:record.semana_id}));
      if(!source?.semana)return fail("Semana no disponible",404);
      if(canonical(contenido(consolidar(source.semana,source.propuestas)))!==canonical(contenido(record.datos)))return fail("El horario fue modificado después de guardar esta versión. Consolide nuevamente y publique la versión actual.",409);
      const publicacion=check(await sb.from("planif_publicaciones").upsert({semana_id:record.semana_id,consolidado_id:record.id,publicado_por:user.id,publicado_nombre:[user.grado,user.nombre_completo].filter(Boolean).join(" "),publicado_en:new Date().toISOString()},{onConflict:"semana_id"}).select("*").single());
      return json({ok:true,publicacion,pendientes:source.propuestas.filter((p:any)=>p.estado==="pendiente").length});
    }
    return fail("Acción desconocida");
  }catch(_e){return fail("No se pudo completar la operación. Intente nuevamente.",500);}
});
