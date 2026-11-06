/* Ejecutar con Playwright disponible: prueba tres cuentas sin datos reales. */
const {chromium}=require(process.env.SIDECEME_PLAYWRIGHT_MODULE||'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..'),plan={id:'11111111-1111-1111-1111-111111111111',nombre:'Evaluación diagnóstica TEST',ciclo:'1ER CICLO',fecha:'2026-11-03',modo:'EVALUACION',habilitado:true,version:1,grupos:[{id:'G',color:'AZUL',alumnos:['TEST1'],encargados:{talla_peso:['P030'],flexiones:['P019'],abdominales:['P020'],aerobica:['P019'],natacion:['P020']},apoyos:[]}]};
const student={id:'TEST1',nombre_completo:'ALUMNO DE PRUEBA',ciclo:'1ER CICLO',grado:'My.',paralelo:'A',fecha_nacimiento:'1985-01-01',sexo:'M'};
const plan2={...plan,id:'22222222-2222-2222-2222-222222222222',ciclo:'2DO CICLO',grupos:[{...plan.grupos[0],id:'G2',alumnos:['TEST2','TEST3','TEST4','TEST5']}]};
const roster=[student,...['TEST2','TEST3','TEST4','TEST5'].map(id=>({...student,id,nombre_completo:'ALUMNO SEGUNDO '+id,ciclo:'2DO CICLO'}))];
let n=0,failConfirm=false,failSync=false,failLoadFor='';const records=Object.entries({talla_peso:100,flexiones:95,abdominales:90,aerobica:85,natacion:80}).map(([prueba,nota])=>({id:`00000000-0000-0000-0000-${String(++n).padStart(12,'0')}`,cursante_id:student.id,prueba,fecha:plan.fecha,valor:prueba==='talla_peso'?70:prueba==='aerobica'?900:30,calculo:{nota,peso:70,talla:1.70,evaluador_nombre:'EVALUADOR TEST'},organizacion_id:plan.id,revision:n,creado_en:new Date(Date.now()+n).toISOString(),conformidad:null}));
const server=http.createServer((req,res)=>{
 if(req.url==='/__test_api'){
  let raw='';req.on('data',x=>raw+=x);req.on('end',()=>{const b=JSON.parse(raw);res.setHeader('Content-Type','application/json');if(b.accion==='confirmar'){
   const r=records.find(r=>r.id===b.registro_id);if(failConfirm){res.statusCode=503;return res.end(JSON.stringify({error:'SIN CONEXIÓN TEST'}));}
   const newer=records.some(x=>x.prueba===r.prueba&&x.revision>r.revision);if(newer){res.statusCode=409;return res.end(JSON.stringify({error:'EL REGISTRO CAMBIÓ'}));}
   r.conformidad={registro_id:r.id,cursante_id:student.id,confirmado_en:new Date().toISOString()};return res.end(JSON.stringify({ok:true,conformidad:r.conformidad}));
  }
  if(b.accion==='registrar'){const r={...b,organizacion_id:b.organizacion_id||plan.id,revision:++n,creado_en:new Date().toISOString(),calculo:{nota:85,evaluador_nombre:'EVALUADOR TEST'},conformidad:null};records.push(r);return res.end(JSON.stringify({ok:true,registro:r}));}
  if(failSync){res.statusCode=503;return res.end(JSON.stringify({error:'SIN CONEXIÓN TEST'}));}
  if(b.accion==='cargar'&&failLoadFor&&b.organizacion_id===failLoadFor){res.statusCode=503;return res.end(JSON.stringify({error:'FALLO DE CARGA TEST'}));}
  const active=b.organizacion_id===plan2.id?plan2:plan;
  const common={ok:true,registros:records.filter(r=>r.organizacion_id===active.id),servidor_en:new Date().toISOString()};
  if(b.accion==='mis_evaluaciones')return res.end(JSON.stringify({...common,alumno:student,organizaciones:[plan]}));
  if(b.accion==='conformidades')return res.end(JSON.stringify({ok:true,registros:records,cursantes:roster,organizaciones:[plan,plan2],servidor_en:new Date().toISOString()}));
  if(b.accion==='sincronizar')return res.end(JSON.stringify({...common,version:1,habilitado:true,condiciones:[]}));
  res.end(JSON.stringify({...common,jefe:true,fecha:plan.fecha,actor_nombre:'EVALUADOR TEST',cursantes:roster,organizacion:active,organizaciones:[plan,plan2],condiciones:[],personal:[],asignaciones:[]}));});return;
 }
 if(req.url.startsWith('/__test?')){const alumno=req.url.includes('alumno'),owner=req.url.includes('jefe')?'P030':'P019';res.setHeader('Content-Type','text/html');return res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/efm-campo/style.css"><script type="module">import {abrir} from '/efm-campo/${alumno?'alumno':'app'}.mjs';window.active=true;await abrir({owner:'${owner}',onPostulantes:${!alumno&&owner==='P030'?'()=>window.postVisits=(window.postVisits||0)+1':'null'},authorized:()=>window.active,onClose:()=>{},invoke:async b=>{const r=await fetch('/__test_api',{method:'POST',body:JSON.stringify(b)}),d=await r.json();if(!r.ok)throw new Error(d.error);return d;}});</script>`);}
 const url=new URL(req.url,'http://localhost'),file=path.resolve(base,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(base+path.sep)||!fs.existsSync(file)){res.statusCode=404;return res.end();}
 res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH||fs.existsSync('/usr/bin/chromium')?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'}:{}),args:['--no-sandbox']});
 try{
  const a=await browser.newPage({viewport:{width:390,height:844}}),e=await browser.newPage(),j=await browser.newPage();const errors=[];for(const p of [a,e,j])p.on('pageerror',x=>errors.push(x.message));
  await Promise.all([a.goto(url+'/__test?alumno'),e.goto(url+'/__test?evaluador'),j.goto(url+'/__test?jefe')]);
  await j.locator('#efmc-cycle').waitFor();assert.equal(await j.locator('#efmc-cycle option').count(),3);assert.equal(await e.locator('#efmc-cycle option').count(),2);
  await j.locator('#efmc-cycle').selectOption('POSTULANTES_2027');assert.equal(await j.evaluate(()=>window.postVisits),1);assert.equal(await j.locator('#efmc-cycle').inputValue(),'1ER CICLO');
  await j.getByRole('button',{name:'RELACIÓN NOMINAL Y FOTOGRAFÍAS'}).click();assert.equal(await j.evaluate(()=>window.postVisits),2);
  // El selector cambia también de organización: un alumno en primero, cuatro en segundo.
  for(const p of [e,j]){
   await p.locator('#efmc-plan').waitFor();assert.equal(await p.locator('#efmc-cycle').isEnabled(),true);
   await p.locator('#efmc-cycle').selectOption('2DO CICLO');await p.waitForFunction(()=>document.querySelector('#efmc-plan').value==='22222222-2222-2222-2222-222222222222');
   assert.equal(await p.locator('.efmc-roster button').count(),4);assert.equal(await p.locator('.efmc-roster [data-student=TEST1]').count(),0);
   await p.locator('#efmc-cycle').selectOption('1ER CICLO');await p.waitForFunction(()=>document.querySelector('#efmc-plan').value==='11111111-1111-1111-1111-111111111111');assert.equal(await p.locator('.efmc-roster button').count(),1);
  }
  // Una carga fallida conserva el ciclo, la organización y la nómina anteriores.
  failLoadFor=plan2.id;await e.locator('#efmc-cycle').selectOption('2DO CICLO');await e.getByText('FALLO DE CARGA TEST').waitFor();assert.equal(await e.locator('#efmc-cycle').inputValue(),'1ER CICLO');assert.equal(await e.locator('#efmc-plan').inputValue(),plan.id);failLoadFor='';
  // El cambio protege medidas todavía sin guardar, incluso con un alumno seleccionado.
  await j.locator('.efmc-roster [data-student=TEST1]').click();await j.locator('#efmc-peso').fill('80');await j.locator('#efmc-cycle').selectOption('POSTULANTES_2027');await j.getByText('GUARDÁ LOS DATOS O LA MARCA ANTES DE CAMBIAR DE CICLO U ORGANIZACIÓN.').waitFor();assert.equal(await j.evaluate(()=>window.postVisits),2);await j.locator('#efmc-cycle').selectOption('2DO CICLO');await j.getByText('GUARDÁ LOS DATOS O LA MARCA ANTES DE CAMBIAR DE CICLO U ORGANIZACIÓN.').waitFor();assert.equal(await j.locator('#efmc-cycle').inputValue(),'1ER CICLO');assert.equal(await j.locator('#efmc-peso').inputValue(),'80');
  await j.locator('#efmc-peso').fill('70');await j.locator('#efmc-cycle').selectOption('2DO CICLO');await j.waitForFunction(()=>document.querySelector('#efmc-cycle').value==='2DO CICLO'&&!document.querySelector('#efmc-cycle').disabled);await j.locator('#efmc-cycle').selectOption('1ER CICLO');await j.waitForFunction(()=>document.querySelector('#efmc-plan').value==='11111111-1111-1111-1111-111111111111');
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
  // Una llegada guardada muestra marca, nota roja y conformidad verde en la estación.
  await e.locator('[data-test=aerobica]').click();await e.locator('[data-action=group-all]').click();await e.locator('[data-action=race-start]').click();await e.locator('[data-action=lap]').click();await e.locator('[data-action=race-start]').click();await e.locator('[data-lap="0"]').selectOption('TEST1');await e.locator('[data-save-lap="0"]').click();
  await e.locator('.efmc-lap-row .efmc-conformidad.pendiente').waitFor();
  const arrivalId=records.at(-1).id;await a.locator(`[data-confirm="${arrivalId}"]`).waitFor({timeout:7000});
  await a.locator(`[data-confirm="${arrivalId}"]`).click();await e.locator('.efmc-lap-row .efmc-conformidad.conforme').waitFor({timeout:7000});
  failSync=true;await a.getByText(/No se pudo sincronizar/).waitFor({timeout:7000});failSync=false;
  await a.waitForFunction(()=>!document.querySelector('.efmc-sync').textContent.includes('No se pudo sincronizar'),{timeout:7000});
  assert.equal(await a.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(process.env.EFMC_SCREENSHOT)await a.screenshot({path:process.env.EFMC_SCREENSHOT,fullPage:true});
  await a.evaluate(()=>window.active=false);await a.locator('#efmc').waitFor({state:'detached',timeout:7000});assert.deepEqual(errors,[]);
  console.log('Navegador: cambio de ciclo 1↔2, grupos 1/4, carga fallida y medidas pendientes; alumno móvil + evaluador + jefe; rojo/verde automático, peso/talla, nota cero, corrección, fallo/reintento, conservación de edición y cierre de sesión: OK');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
