const {chromium}=require(process.env.SIDECEME_PLAYWRIGHT_MODULE||'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 if(req.url.startsWith('/harness?')){
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/efm-campo/style.css"></head><body><script type="module">
import {abrir} from '/efm-campo/app.mjs';
const owner=new URLSearchParams(location.search).get('owner');window.calls=[];window.blocked=true;window.fail=false;window.publishedFixture=false;
const plan=()=>({id:'11111111-1111-1111-1111-111111111111',nombre:'DIAGNÓSTICA FICTICIA',fecha:'2026-11-03',ciclo:'1ER CICLO',modo:'EVALUACION',habilitado:true,version:window.publishedFixture?2:1,publicada_en:window.publishedFixture?'2026-11-03T20:00:00Z':null,grupos:[{id:'G',color:'AZUL',alumnos:['TEST'],encargados:{},apoyos:[]}]});
window.invoke=async b=>{window.calls.push(b);if(b.accion==='preparar_publicacion')return {ok:true,alumnos:1,completos:window.blocked?0:1,bloqueos:window.blocked?['FICTICIO: natación pendiente']:[],notas:[{nombre:'ALUMNO FICTICIO',nota:'89'}],reemplazos:1,periodo:'2026 · 1ER CICLO · semestre del año '+b.semestre,huella:'TEST-HUELLA'};
if(b.accion==='publicar_diagnostica'){if(window.fail)throw new Error('SIN CONEXIÓN FICTICIA');window.publishedFixture=true;return {ok:true,publicada:true,alumnos:1};}
return {ok:true,fecha:'2026-11-03',jefe:owner!=='P018',actor_nombre:'JEFE FICTICIO',organizacion:plan(),organizaciones:[plan()],asignaciones:[],condiciones:[],personal:[],cursantes:[{id:'TEST',nombre_completo:'ALUMNO FICTICIO',ciclo:'1ER CICLO'}],registros:[]};};
await abrir({invoke:window.invoke,owner,onClose:()=>{},authorized:()=>true});</script></body></html>`);return;
 }
 const f=path.resolve(base,decodeURIComponent(req.url.split('?')[0]).slice(1));if(!f.startsWith(base+path.sep)){res.statusCode=403;return res.end();}
 try{res.setHeader('Content-Type',f.endsWith('.mjs')?'application/javascript':f.endsWith('.css')?'text/css':'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.statusCode=404;res.end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 for(const owner of ['P019','P020','P030']){
  const p=await browser.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port+'/harness?owner='+owner);
  await p.locator('[data-action="publish-diagnostic"]').click();const dialog=p.locator('dialog');await dialog.waitFor();assert((await dialog.boundingBox()).width<=390);
  const review=p.locator('[data-revisar]'),publish=p.locator('[data-publicar]');assert(await publish.isDisabled());
  await review.click();await p.getByText('FICTICIO: natación pendiente',{exact:true}).waitFor();assert(await publish.isDisabled());
  await p.evaluate(()=>window.blocked=false);await review.click();await p.getByText('ALUMNO FICTICIO: 89 / 100',{exact:true}).waitFor();await p.waitForFunction(()=>!document.querySelector('[data-publicar]').disabled);
  await p.locator('[data-periodo]').selectOption('1');assert(await publish.isDisabled());await review.click();await p.waitForFunction(()=>!document.querySelector('[data-publicar]').disabled);
  await p.evaluate(()=>window.fail=true);await publish.click();await p.getByText('SIN CONEXIÓN FICTICIA',{exact:true}).waitFor();assert(await publish.isDisabled());
  await p.evaluate(()=>window.fail=false);await review.click();await p.waitForFunction(()=>!document.querySelector('[data-publicar]').disabled);await publish.click();await p.getByText(/EVALUACIÓN CERRADA Y PUBLICADA · 1 alumnos/).waitFor();
  const calls=await p.evaluate(()=>window.calls.filter(x=>x.accion==='publicar_diagnostica'));assert.equal(calls.length,2);assert(calls.every(x=>x.semestre===1&&x.huella==='TEST-HUELLA'));assert.equal(errors.length,0,errors.join('\n'));await p.locator('[data-salir]').click();assert.equal(await dialog.count(),0);await p.close();
 }
 const p=await browser.newPage();await p.goto('http://127.0.0.1:'+server.address().port+'/harness?owner=P018');await p.locator('#efmc').waitFor();assert.equal(await p.locator('[data-action="publish-diagnostic"]').count(),0);await p.close();
 console.log('Publicación móvil: tres jefes, permisos, revisión, bloqueos, nota cero ponderada, cambio de semestre, fallo/reintento y cierre visible: OK');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
