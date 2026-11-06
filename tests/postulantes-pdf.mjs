// npm install --prefix <directorio temporal> --save-exact pdf-lib@1.17.1 qrcode-generator@1.4.4
// POST_PDF_DEPS=<directorio temporal>/node_modules node tests/postulantes-pdf.mjs
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const deps=process.env.POST_PDF_DEPS;if(!deps)throw new Error('Configure POST_PDF_DEPS con las dependencias de prueba.');
const require=createRequire(path.join(path.resolve(deps),'../package.json'));
const {PDFDocument}=require('pdf-lib');const scratch=await fs.mkdtemp(path.join(os.tmpdir(),'post-pdf-'));
try{
 const source=(await fs.readFile('supabase/functions/postulantes-ops/documento.mjs','utf8')).replace('https://esm.sh/pdf-lib@1.17.1',pathToFileURL(require.resolve('pdf-lib')).href).replace('https://esm.sh/qrcode-generator@1.4.4',pathToFileURL(require.resolve('qrcode-generator')).href);
 const modulePath=path.join(scratch,'documento.mjs');await fs.writeFile(modulePath,source);const {documentoPDF}=await import(pathToFileURL(modulePath));
 const doc={id:'00000000-0000-4000-8000-000000000001',tipo:'REGISTRO_PARCIAL',emitido_en:'2026-11-06T14:00:00Z',contenido_sha256:'0'.repeat(64),contenido:{nombre_completo:'PERSONA FICTICIA DE PRUEBA',grado:'MY.',arma:'PRUEBA',ci:'999000001',foto:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jP5cAAAAASUVORK5CYII=',emisor_nombre:'EVALUADOR FICTICIO',evaluaciones:Array.from({length:9},(_,i)=>({nombre:'EVALUACIÓN FICTICIA '+i,evaluacion:i===0?{resultado:'EVALUADO',nota:0,escala:100,revision:1,referencia:'ACTA FICTICIA',registrada_en:'2026-11-06T14:00:00Z',actor:'PRUEBA',detalle:{pruebas:Array.from({length:12},(_,j)=>({prueba:'Prueba '+j,marca:'0',unidad:'repeticiones',nota:0,escala:100}))}}:null}))}};
 const origin='https://estevezl383-droid.github.io/sideceme/postulantes/';const a=await documentoPDF(doc,origin),b=await documentoPDF(doc,origin);assert.deepEqual(a,b,'La misma instantánea genera el mismo archivo');const pdf=await PDFDocument.load(a);assert.ok(pdf.getPageCount()>=2,'Paginación sin truncar resultados');assert.match(pdf.getTitle(),/2027/);console.log('PDF generado, reabierto, paginado y reproducible.');
}finally{await fs.rm(scratch,{recursive:true,force:true});}
