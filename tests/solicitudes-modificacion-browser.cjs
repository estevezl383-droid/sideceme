const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setContent('<!doctype html><html><body><button id="abrir">Modificar</button></body></html>');
   await page.evaluate(()=>{
    window.fixture={id:'s1',folio:'PRUEBA-01',cursante_nombre:'Cursante de prueba',falta_id:'uniforme',falta_descripcion:'Uniforme de prueba',puntos_aplicados:4,modificada_en:null};
    window.calls=[];window.alerts=[];window.alert=m=>alerts.push(m);window.discData={sanciones:[{...fixture}]};
    window.indices=0;window.invalidaciones=0;window.bandejas=0;window.fallo=false;
    window._reconstruirIndicesDisc=()=>indices++;window._invalidarCacheDisc=()=>invalidaciones++;window.goAnulaciones=()=>bandejas++;
    window._solOps=async(accion,body)=>{
     calls.push({accion,body});
     if(accion==='preparar_modificacion')return {sancion:fixture,reglamentos:[
      {id:'uniforme',articulo:8,categoria:'LEVE',puntos:2,descripcion:'Uniforme de prueba'},
      {id:'parte',articulo:8,categoria:'LEVE',puntos:2,descripcion:'No dar parte oportunamente de problemas familiares y/o personales.'}],
      solicitud:{detalle_profesor:'Solicita cambio a dos puntos <script>error</script>'}};
     await new Promise(r=>setTimeout(r,100));
     if(fallo)throw Error('No se pudo guardar: prueba de fallo');
     return {sancion:{...fixture,falta_id:body.modificacion.falta_id,puntos_aplicados:body.modificacion.puntos_aplicados,estado:'MODIFICADA'}};
    };
   });
   await page.addScriptTag({path:'assets/solicitudes-modificacion.js'});
   await page.evaluate(()=>{document.querySelector('#abrir').onclick=()=>abrirModificacionSolicitud(1);});
   await page.click('#abrir');await page.waitForSelector('#sol-mod-buscar');
   assert.equal(await page.locator('#sol-modificacion script').count(),0);
   await page.fill('#sol-mod-buscar','familiares');await page.selectOption('#sol-mod-falta','parte');
   assert.equal(await page.inputValue('#sol-mod-puntos'),'2');
   assert.match(await page.textContent('[data-resumen]'),/de 4 a 2 puntos/);
   await page.fill('#sol-mod-razon','Se aprueba la corrección de la falta y los puntos.');
   assert.equal(await page.evaluate(()=>{const d=document.querySelector('dialog');return d.scrollWidth>d.clientWidth+1;}),false);
   await page.evaluate(()=>{window.fallo=true;});
   await page.click('[type=submit]');await page.waitForFunction(()=>document.querySelector('[data-error]').textContent.includes('prueba de fallo'));
   assert.equal(await page.evaluate(()=>alerts.length),0);assert.equal(await page.evaluate(()=>discData.sanciones[0].puntos_aplicados),4);
   assert.match(await page.inputValue('#sol-mod-razon'),/corrección/);
   await page.evaluate(()=>{window.fallo=false;const f=document.querySelector('form');f.requestSubmit();f.requestSubmit();});
   await page.waitForSelector('#sol-modificacion',{state:'detached'});
   const result=await page.evaluate(()=>({calls,indices,invalidaciones,bandejas,alerts,puntos:discData.sanciones[0].puntos_aplicados}));
   assert.equal(result.calls.filter(c=>c.accion==='resolver').length,2); // un fallo y un éxito, sin duplicado
   assert.equal(result.puntos,2);assert.equal(result.indices,1);assert.equal(result.invalidaciones,1);assert.equal(result.bandejas,1);
   assert.deepEqual(result.calls.at(-1).body.modificacion.anterior,{falta_id:'uniforme',puntos_aplicados:4,modificada_en:null});
   assert.match(result.alerts[0],/2 puntos/);
   await page.click('#abrir');await page.waitForSelector('#sol-mod-buscar');await page.click('[data-cerrar]');
   assert.equal((await page.evaluate(()=>calls.filter(c=>c.accion==='resolver'))).length,2);
   assert.deepEqual(errors,[]);await page.close();console.log('Formulario: éxito, fallo, doble envío, cancelación y ancho '+width+' px OK');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
