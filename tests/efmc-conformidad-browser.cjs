/* Ejecutar con Playwright disponible: prueba tres cuentas sin datos reales. */
const {chromium}=require(process.env.SIDECEME_PLAYWRIGHT_MODULE||'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..'),plan={id:'11111111-1111-1111-1111-111111111111',nombre:'Evaluación diagnóstica TEST',ciclo:'1ER CICLO',fecha:'2026-11-03',modo:'EVALUACION',habilitado:true,version:1,grupos:[{id:'G',color:'AZUL',alumnos:['TEST1'],encargados:{talla_peso:['P030'],flexiones:['P019'],abdominales:['P020'],aerobica:['P019'],natacion:['P020']},apoyos:[]}]};
const student={id:'TEST1',nombre_completo:'ALUMNO DE PRUEBA',ciclo:'1ER CICLO',grado:'My.',paralelo:'A',fecha_nacimiento:'1985-01-01',sexo:'M'};
let n=0,failConfirm=false,failSync=false;const records=Object.entries({talla_peso:100,flexiones:95,abdominales:90,aerobica:85,natacion:80}).map(([prueba,nota])=>({id:`00000000-0000-0000-0000-${String(++n).padStart(12,'0')}`,cursante_id:student.id,prueba,fecha:plan.fecha,valor:prueba==='talla_peso'?70:prueba==='aerobica'?900:30,calculo:{nota,peso:70,talla:1.70,evaluador_nombre:'EVALUADOR TEST'},organizacion_id:plan.id,revision:n,creado_en:new Date(Date.now()+n).toISOString(),conformidad:null}));
const server=http.createServer((req,res)=>{
 if(req.url==='/__test_api'){
  let raw='';req.on('data',x=>raw+=x);req.on('end',()=>{const b=JSON.parse(raw);res.setHeader('Content-Type','application/json');if(b.accion==='confirmar'){
   const r=records.find(r=>r.id===b.registro_id);if(failConfirm){res.statusCode=503;return res.end(JSON.stringify({error:'SIN CONEXIÓN TEST'}));}
   const newer=records.some(x=>x.prueba===r.prueba&&x.revision>r.revision);if(newer){res.statusCode=409;return res.end(JSON.stringify({error:'EL REGISTRO CAMBIÓ'}));}
   r.conformidad={registro_id:r.id,cursante_id:student.id,confirmado_en:new Date().toISOString()};return res.end(JSON.stringify({ok:true,conformidad:r.conformidad}));
  }
  if(failSync){res.statusCode=503;return res.end(JSON.stringify({error:'SIN CONEXIÓN TEST'}));}
  const common={ok:true,registros:records,servidor_en:new Date().toISOString()};
  if(b.accion==='mis_evaluaciones')return res.end(JSON.stringify({...common,alumno:student,organizaciones:[plan]}));
  if(b.accion==='sincronizar')return res.end(JSON.stringify({...common,version:1,habilitado:true,condiciones:[]}));
  res.end(JSON.stringify({...common,jefe:true,fecha:plan.fecha,actor_nombre:'EVALUADOR TEST',cursantes:[student],organizacion:plan,organizaciones:[plan],condiciones:[],personal:[],asignaciones:[]}));});return;
 }
 if(req.url.startsWith('/__test?')){const alumno=req.url.includes('alumno'),owner=req.url.includes('jefe')?'P030':'P019';res.setHeader('Content-Type','text/html');return res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/efm-campo/style.css"><script type="module">import {abrir} from '/efm-campo/${alumno?'alumno':'app'}.mjs';window.active=true;await abrir({owner:'${owner}',authorized:()=>window.active,onClose:()=>{},invoke:async b=>{const r=await fetch('/__test_api',{method:'POST',body:JSON.stringify(b)}),d=await r.json();if(!r.ok)throw new Error(d.error);return d;}});</script>`);}
 const url=new URL(req.url,'http://localhost'),file=path.resolve(base,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(base+path.sep)||!fs.existsSync(file)){res.statusCode=404;return res.end();}
 res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const a=await browser.newPage({viewport:{width:390,height:844}}),e=await browser.newPage(),j=await browser.newPage();const errors=[];for(const p of [a,e,j])p.on('pageerror',x=>errors.push(x.message));
  await Promise.all([a.goto(url+'/__test?alumno'),e.goto(url+'/__test?evaluador'),j.goto(url+'/__test?jefe')]);
  await a.locator('[data-confirm]').first().waitFor();assert.equal(await a.locator('.efmc-record.pendiente').count(),5);assert(await a.locator('.efmc-record').first().textContent().then(t=>t.includes('70 kg / 1.7 m')));
  await Promise.all([e.locator('[data-action=seguimiento]').click(),j.locator('[data-action=seguimiento]').click()]);
  failConfirm=true;await a.locator('[data-confirm]').first().click();await a.getByText(/SIN CONEXIÓN TEST/).waitFor();assert.equal(await a.locator('.efmc-record.conforme').count(),0);failConfirm=false;
  await a.locator('[data-confirm]').first().click();await a.locator('.efmc-record.conforme').waitFor();
  await e.locator('.efmc-conformidad.conforme').waitFor({timeout:7000});await j.locator('.efmc-conformidad.conforme').waitFor({timeout:7000});
  // Corrección visible automáticamente: conserva la conformidad anterior y pide otra.
  const previous=records.find(r=>r.prueba==='talla_peso');records.push({...previous,id:'99999999-9999-9999-9999-999999999999',revision:++n,valor:71,calculo:{...previous.calculo,peso:71,nota:0},conformidad:null,creado_en:new Date().toISOString()});
  await a.locator('[data-confirm="99999999-9999-9999-9999-999999999999"]').waitFor({timeout:7000});assert(previous.conformidad);assert.equal(await a.locator('.efmc-record.conforme').count(),0);
  assert(await a.locator('.efmc-record').first().textContent().then(t=>t.includes('71 kg')&&t.includes('0 / 100')));
  await a.locator('[data-confirm]').first().click();await e.getByText('71 kg / 1.7 m').waitFor({timeout:7000});
  // La sincronización no reconstruye el temporizador ni la marca en edición.
  await e.locator('[data-test=flexiones]').click();await e.locator('[data-student=TEST1]').first().click();await e.locator('[data-key="4"]').click();
  await e.evaluate(()=>window.timerNode=document.querySelector('#efmc-active'));await e.waitForTimeout(2300);assert(await e.evaluate(()=>window.timerNode===document.querySelector('#efmc-active')));assert.equal(await e.locator('#efmc-value .efmc-digital').getAttribute('aria-label'),'4');
  failSync=true;await a.getByText(/No se pudo sincronizar/).waitFor({timeout:7000});failSync=false;
  await a.waitForFunction(()=>!document.querySelector('.efmc-sync').textContent.includes('No se pudo sincronizar'),{timeout:7000});
  assert.equal(await a.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(process.env.EFMC_SCREENSHOT)await a.screenshot({path:process.env.EFMC_SCREENSHOT,fullPage:true});
  await a.evaluate(()=>window.active=false);await a.locator('#efmc').waitFor({state:'detached',timeout:7000});assert.deepEqual(errors,[]);
  console.log('Navegador: alumno móvil + evaluador + jefe; rojo/verde automático, peso/talla, nota cero, corrección, fallo/reintento, conservación de edición y cierre de sesión: OK');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
