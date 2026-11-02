import {datosHojaServidor,sha256} from './hoja-modelo.mjs';
import {generarHojaPDF} from './hoja-pdf.mjs';
const BUCKET='efm-documentos',VERIFY='https://estevezl383-droid.github.io/sideceme/efm-campo/verificar.html';
export function base64Bytes(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);}
async function render(snapshot,emision){const [p,q]=await Promise.all([import('https://esm.sh/pdf-lib@1.17.1?target=deno'),import('https://esm.sh/qrcode@1.5.4/lib/core/qrcode.js?target=deno')]);return generarHojaPDF(snapshot,emision,{...p,QRCode:q.default||q});}
export async function hojaPDFAlumno(sb,cursanteId,body,{renderPDF=render,now=()=>new Date().toISOString()}={}){
 if((body.formato&&body.formato!=='pdf')||typeof body.organizacion_id!=='string'||!/^[0-9a-f-]{36}$/i.test(body.organizacion_id))return {status:400,data:{ok:false,error:'EL ALUMNO SÓLO DESCARGA SU HOJA EN PDF. SELECCIONÁ LA EVALUACIÓN.'}};
 const loaded=await datosHojaServidor(sb,cursanteId,body.organizacion_id);
 if(!loaded||loaded.cursante.activo!==true||!loaded.plan.habilitado)return {status:403,data:{ok:false,error:'EVALUACIÓN NO DISPONIBLE PARA TU CUENTA'}};
 const snapshot=loaded.snapshot,fingerprint=await sha256(JSON.stringify(snapshot));
 const find=()=>sb.from('efmc_documentos').select('*').eq('cursante_id',cursanteId).eq('organizacion_id',body.organizacion_id).eq('fingerprint',fingerprint).maybeSingle();
 let q=await find();if(q.error)throw q.error;let record=q.data;
 if(!record){
  const id=crypto.randomUUID(),raw=crypto.getRandomValues(new Uint8Array(32)),token=base64Bytes(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const emitido_en=now(),url=VERIFY+'?t='+token,bytes=await renderPDF(snapshot,{id,emitido_en,url});
  const storage_path=`${cursanteId}/${body.organizacion_id}/${id}.pdf`,storage=sb.storage.from(BUCKET);
  const upload=await storage.upload(storage_path,bytes,{contentType:'application/pdf',upsert:false});if(upload.error)throw upload.error;
  const row={id,organizacion_id:body.organizacion_id,cursante_id:cursanteId,snapshot,fingerprint,pdf_sha256:await sha256(bytes),token_hash:await sha256(token),storage_path,emitido_en};
  const inserted=await sb.from('efmc_documentos').insert(row).select().single();
  if(inserted.error){await storage.remove([storage_path]);if(inserted.error.code!=='23505')throw inserted.error;q=await find();if(q.error||!q.data)throw q.error||inserted.error;record=q.data;}else record=inserted.data;
 }
 const download=await sb.storage.from(BUCKET).download(record.storage_path);if(download.error)throw download.error;
 const bytes=new Uint8Array(await download.data.arrayBuffer());if(await sha256(bytes)!==record.pdf_sha256)throw Error('LA HUELLA DEL PDF GUARDADO NO COINCIDE');
 return {status:200,data:{ok:true,archivo:{nombre:`EFM_individual_${loaded.plan.fecha}_${cursanteId}.pdf`,mime:'application/pdf',base64:base64Bytes(bytes),sha256:record.pdf_sha256,codigo:record.id,estado:record.snapshot.estado}}};
}
