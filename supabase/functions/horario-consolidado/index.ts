import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { consolidar, calendario } from "./consolidar.js";
const sb = createClient(Deno.env.get("SUPABASE_URL")||"",Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"");
const ids = ["P030","P032","S002"];
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization, apikey, x-client-info"};
const json=(data:object,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
const fail=(error:string,status=400)=>json({ok:false,error},status);
async function profesor(id:string){
  if(!ids.includes(id))return null;
  const {data,error}=await sb.from("profesores").select("id,grado,nombre_completo,activo").eq("id",id).maybeSingle();
  return !error&&data&&data.activo!==false?data:null;
}
async function validar(token:string){
  const {data,error}=await sb.from("sesiones").select("usuario_id,usuario_tabla,expira_en,revocado").eq("token",token).maybeSingle();
  if(error||!data||data.revocado||data.usuario_tabla!=="profesores"||!(Date.parse(data.expira_en)>Date.now()))return null;
  return profesor(data.usuario_id);
}
function check(result:any){if(result.error)throw Error("No se pudo completar la operación. Intente nuevamente.");return result.data;}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  try{
    if(req.method==="GET"){
      const token=new URL(req.url).searchParams.get("feed");
      if(!token||!/^[a-f0-9]{64}$/.test(token))return fail("Enlace no válido",404);
      const link=check(await sb.from("planif_calendario_enlaces").select("propietario,audiencia").eq("token",token).eq("activo",true).maybeSingle());
      if(!link||!await profesor(link.propietario))return fail("Enlace no disponible",404);
      const records=check(await sb.rpc("planif_calendario_consolidado"));
      return new Response(calendario(records||[],link.audiencia),{headers:{...cors,"Content-Type":"text/calendar; charset=utf-8","Content-Disposition":"inline; filename=sideceme.ics","Cache-Control":"private, max-age=0, no-store"}});
    }
    if(req.method!=="POST")return fail("Método no permitido",405);
    const body=await req.json();
    const user=await validar(String(body.token||""));
    if(!user)return fail("Solo Morales, Villarroel y Arce pueden consolidar semanas.",403);
    if(body.accion==="consolidar"){
      const source=check(await sb.rpc("planif_fuente_consolidada",{p_semana:body.semana_id}));
      if(!source?.semana)return fail("La semana no está disponible",404);
      const record=check(await sb.from("planif_consolidados").insert({semana_id:source.semana.id,creado_por:user.id,creado_nombre:[user.grado,user.nombre_completo].filter(Boolean).join(" "),orientacion:body.orientacion==="landscape"?"landscape":"portrait",datos:consolidar(source.semana,source.propuestas),fuente:source}).select("id,semana_id,creado_nombre,creado_en,orientacion,datos").single());
      return json({ok:true,record,pendientes:source.propuestas.filter((p:any)=>p.estado==="pendiente").length});
    }
    if(body.accion==="listar")return json({ok:true,records:check(await sb.from("planif_consolidados").select("id,creado_nombre,creado_en,orientacion").eq("semana_id",body.semana_id).order("id",{ascending:false}))});
    if(body.accion==="abrir")return json({ok:true,record:check(await sb.from("planif_consolidados").select("id,semana_id,creado_nombre,creado_en,orientacion,datos").eq("id",body.id).single())});
    if(body.accion==="enlace"||body.accion==="revocar"){
      if(!["planta","c1","c2"].includes(body.audiencia))return fail("Elija un horario");
      if(body.accion==="revocar"){
        check(await sb.from("planif_calendario_enlaces").update({activo:false}).eq("propietario",user.id).eq("audiencia",body.audiencia).eq("activo",true));
        return json({ok:true});
      }
      let link=check(await sb.from("planif_calendario_enlaces").select("token").eq("propietario",user.id).eq("audiencia",body.audiencia).eq("activo",true).maybeSingle());
      if(!link){
        const created=await sb.from("planif_calendario_enlaces").insert({propietario:user.id,audiencia:body.audiencia}).select("token").single();
        // Dos pestañas simultáneas recuperan el mismo enlace vigente.
        link=created.error?check(await sb.from("planif_calendario_enlaces").select("token").eq("propietario",user.id).eq("audiencia",body.audiencia).eq("activo",true).single()):created.data;
      }
      return json({ok:true,url:Deno.env.get("SUPABASE_URL")+"/functions/v1/horario-consolidado?feed="+link.token});
    }
    return fail("Acción desconocida");
  }catch(_e){return fail("No se pudo completar la operación. Intente nuevamente.",500);}
});
