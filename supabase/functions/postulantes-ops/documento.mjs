// PDF emitido en el servidor. Las notas proceden de una instantánea inmutable.
import {PDFDocument,StandardFonts,rgb} from 'https://esm.sh/pdf-lib@1.17.1';
import qrcode from 'https://esm.sh/qrcode-generator@1.4.4';

export async function documentoPDF(doc,verificador){
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const time=new Date(doc.emitido_en);pdf.setCreationDate(time);pdf.setModificationDate(time);
 pdf.setTitle('ECEME 2027 · '+doc.id);pdf.setAuthor('SIDECEME');pdf.setProducer('SIDECEME · Postulación ECEME 2027');
 let page,y;const W=595,H=842,margin=45;
 const clean=t=>String(t??'').replace(/[\u2010-\u2015]/g,'-').replace(/[^\x20-\x7e\xa0-\xff\n]/g,'');
 const nueva=()=>{page=pdf.addPage([W,H]);y=H-margin;};nueva();
 const line=(t,size=10,strong=false)=>{if(y<65)nueva();page.drawText(clean(t),{x:margin,y,size,font:strong?bold:font,color:rgb(.09,.16,.20)});y-=size+7;};
 const wrap=(text,size=10,strong=false,width=W-margin*2)=>{const f=strong?bold:font;for(const paragraph of clean(text).split('\n')){let buf='';for(const word of paragraph.split(/\s+/)){const next=buf?buf+' '+word:word;if(f.widthOfTextAtSize(next,size)>width&&buf){line(buf,size,strong);buf=word;}else buf=next;}line(buf,size,strong);}};
 const d=doc.contenido;
 line('EJÉRCITO DE BOLIVIA',12,true);line('ESCUELA DE COMANDO Y ESTADO MAYOR DEL EJÉRCITO',10,true);
 line('POSTULACIÓN A LA ECEME · GESTIÓN 2027',12,true);y-=8;
 wrap(doc.tipo==='CERTIFICADO'?'CERTIFICADO DE EVALUACIONES':'REGISTRO PARCIAL DE EVALUACIONES',16,true);
 if(doc.tipo!=='CERTIFICADO')wrap('NO ACREDITA APROBACIÓN. Incluye únicamente resultados publicados; los pendientes se identifican expresamente.',9);
 line('Folio: '+doc.id,9);line('Emitido: '+new Date(doc.emitido_en).toLocaleString('es-BO',{timeZone:'America/La_Paz'}),9);
 const foto=d.foto||'';
 if(foto){const img=foto.startsWith('data:image/png')?await pdf.embedPng(foto):await pdf.embedJpg(foto);const dim=img.scaleToFit(80,100);page.drawImage(img,{x:W-margin-dim.width,y:y-100,width:dim.width,height:dim.height});}
 wrap(d.grado+' '+d.nombre_completo,12,true,W-margin*2-100);line('Carnet de identidad: '+d.ci,11,true);line('Arma: '+(d.arma||'Sin especificar'));
 y-=80;
 for(const item of d.evaluaciones){
  if(y<125)nueva();
  const e=item.evaluacion;wrap(item.nombre,10,true);
  wrap(e?('Resultado: '+e.resultado.replaceAll('_',' ')+(e.nota==null?'':' · Nota: '+e.nota+' / '+e.escala)+' · Revisión: '+e.revision):'PENDIENTE DE RESULTADO PUBLICADO',10);
  if(e){wrap('Acta / respaldo: '+e.referencia,9);wrap('Registro: '+new Date(e.registrada_en).toLocaleString('es-BO',{timeZone:'America/La_Paz'})+' · Evaluador: '+(e.evaluador_grado||'')+' '+(e.evaluador_nombre||e.actor),9);
   wrap('Conformidad del postulante: '+(e.conformidad_en?new Date(e.conformidad_en).toLocaleString('es-BO',{timeZone:'America/La_Paz'}):'Pendiente'),9);
   if(e.observacion)wrap('Observación: '+e.observacion,9);
   for(const prueba of e.detalle?.pruebas||[])wrap([prueba.prueba,prueba.marca,prueba.unidad,prueba.nota==null?'':'Nota '+prueba.nota+(prueba.escala?' / '+prueba.escala:''),prueba.observacion].filter(v=>v!==''&&v!=null).join(' · '),9);
  }y-=6;
 }
 wrap('Directiva: '+(d.directiva_validada?d.directiva_referencia:'PENDIENTE DE REVISIÓN COMPLETA'),9);
 wrap('Emitido por: '+(d.emisor_grado||'')+' '+d.emisor_nombre,10,true);
 wrap('Este registro no incorpora sanciones disciplinarias ni asigna condición de cursante. No calcula aprobación ni ponderaciones no verificadas.',9);
 if(y<195)nueva();
 const qr=qrcode(0,'M');qr.addData(verificador+'?verificar='+doc.id);qr.make();
 const n=qr.getModuleCount(),cell=96/(n+8),x=margin,top=y-5;
 page.drawRectangle({x,y:top-96,width:96,height:96,color:rgb(1,1,1)});
 for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c))page.drawRectangle({x:x+(c+4)*cell,y:top-(r+5)*cell,width:cell+.02,height:cell+.02,color:rgb(0,0,0)});
 y=top-112;wrap('QR de verificación · '+verificador,8);wrap('Huella del contenido: '+doc.contenido_sha256,8);
 wrap('Para detectar alteraciones, abra el QR y compare el archivo PDF original. La consulta informa si el registro fue anulado por una rectificación.',8);
 const pages=pdf.getPages();pages.forEach((p,i)=>p.drawText((i+1)+' / '+pages.length+' · '+doc.id,{x:margin,y:28,size:8,font,color:rgb(.35,.4,.4)}));
 return pdf.save({useObjectStreams:false});
}
