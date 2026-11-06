import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import {documentoPDF} from './documento.mjs';
const sb=createClient(Deno.env.get('SUPABASE_URL')||'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'');
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(status:number,data:any)=>new Response(JSON.stringify(data),{status,headers});
const acciones=new Set(['ingresar','solicitar','cambiar_clave','salir','panel','foto','expediente','vista_postulante','guardar_postulante','evaluar','confirmar','emitir','descargar','verificar','acceso','configurar']);
// Solo direcciones institucionales del checkout: el cliente no elige un dominio QR.
const VERIFICADOR='https://estevezl383-droid.github.io/sideceme/postulantes/';
export function validarFoto(foto:any){
 if(foto==null||foto==='')return true;
 if(typeof foto!=='string'||foto.length>6000000||!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+=*$/.test(foto))return false;
 try{const bytes=atob(foto.split(',')[1]);return foto.startsWith('data:image/png')?bytes.startsWith('\x89PNG\r\n\x1a\n'):bytes.startsWith('\xff\xd8\xff');}catch{return false;}
}
export function validarPruebas(detalle:any){
 if(detalle==null)return true;
 if(typeof detalle!=='object'||Array.isArray(detalle)||JSON.stringify(detalle).length>40000)return false;
 if(detalle.pruebas==null)return true;
 if(!Array.isArray(detalle.pruebas)||detalle.pruebas.length>30)return false;
 return detalle.pruebas.every((p:any)=>{
  if(!p||typeof p!=='object'||typeof p.prueba!=='string'||!p.prueba.trim()||p.prueba.length>120)return false;
  if(['marca','unidad','observacion'].some(k=>p[k]!=null&&(typeof p[k]!=='string'||p[k].length>500)))return false;
  const tiene=p.nota!=null&&p.nota!=='';
  return !tiene?(p.escala==null||p.escala===''):Number.isFinite(Number(p.nota))&&Number.isFinite(Number(p.escala))&&Number(p.nota)>=0&&Number(p.escala)>0&&Number(p.nota)<=Number(p.escala);
 });
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply(405,{ok:false,error:'MÉTODO NO PERMITIDO'});
 try{
  const raw=await req.text();if(raw.length>6500000)return reply(413,{ok:false,error:'ARCHIVO DEMASIADO GRANDE. USE UNA FOTO DE HASTA 4 MB.'});
  const b=JSON.parse(raw);
  if(!acciones.has(b.accion)||typeof (b.token||'')!=='string'||(b.token||'').length>200||!b.datos||typeof b.datos!=='object'||Array.isArray(b.datos))return reply(400,{ok:false,error:'SOLICITUD NO VÁLIDA'});
  if(['guardar_postulante','solicitar'].includes(b.accion)&&(!validarFoto(b.datos.foto)||JSON.stringify(b.datos.filiacion||{}).length>20000))return reply(400,{ok:false,error:'FOTOGRAFÍA JPG/PNG O FILIACIÓN NO VÁLIDA'});
  if(b.accion==='evaluar'&&!validarPruebas(b.datos.detalle))return reply(400,{ok:false,error:'REVISE NOMBRES, MARCAS, NOTAS Y ESCALAS DE LAS PRUEBAS'});
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'desconocida';
  const r=await sb.rpc('post_operar',{p_accion:b.accion==='foto'?'expediente':b.accion,p_token:b.token||'',p_datos:b.datos,p_ip:ip});
  if(r.error){
   // P0001 contiene errores funcionales escritos por esta RPC; no volcar SQL/datos.
   const message=r.error.code==='P0001'?r.error.message:r.error.code==='23505'?'YA EXISTE UN POSTULANTE CON ESE CI. NO SE REEMPLAZÓ SU EXPEDIENTE.':r.error.code==='23514'?'REVISE IDENTIDAD, FOTOGRAFÍA, RESULTADO Y ESCALA.':'NO SE COMPLETÓ LA OPERACIÓN. REVISE LOS CAMPOS Y RECARGUE.';
   return reply(409,{ok:false,error:message});
  }
  if(!r.data?.ok)return reply(400,r.data||{ok:false,error:'SOLICITUD RECHAZADA'});
  // Reutiliza los controles de sesión/identidad del expediente; nunca da una URL pública.
  if(b.accion==='foto')return reply(200,{ok:true,id:r.data.postulante.id,foto:r.data.postulante.foto||null});
  if(b.accion==='emitir'){
   const doc=r.data.documento,bytes=await documentoPDF(doc,VERIFICADOR);
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
   let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   const base64=btoa(binary),sealed=await sb.rpc('post_sellar',{p_id:doc.id,p_pdf:base64,p_sha256:hash});
   if(sealed.error||sealed.data!==true)return reply(503,{ok:false,error:'NO SE PUDO SELLAR EL PDF. NO SE CONSIDERA EMITIDO.'});
   return reply(200,{ok:true,id:doc.id,pdf_base64:base64,pdf_sha256:hash});
  }
  return reply(200,r.data);
 }catch{return reply(400,{ok:false,error:'NO SE PUDO PROCESAR LA SOLICITUD. REVISE LOS DATOS.'});}
});
