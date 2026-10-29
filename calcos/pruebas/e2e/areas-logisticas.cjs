const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const {abrir,sembrarYAbrir,estadoReact,entrar3D,salir3D,leerGuardado}=require('./navegador')
const {ejercicioFicticio}=require('../ejercicio-ficticio')
const {prepararVolcan,CUMBRE}=require('./google-3d-relieve.cjs')
const salida=path.resolve(__dirname,'../salidas-areas-logisticas')
const ops=p=>estadoReact(p,v=>v&&Array.isArray(v.zonasLog)&&Array.isArray(v.sectoresLog)?v:undefined)
const nombres=['Sanidad','Abastecimiento','Mantenimiento','Personal']
;(async()=>{
  assert.ok(process.env.CESIUM_DIR,'Configura CESIUM_DIR con Cesium 1.145.0.')
  fs.mkdirSync(salida,{recursive:true})
  const {page,errores,cerrar}=await abrir({ancho:1600,alto:1150,preparar:prepararVolcan()})
  page.on('dialog',d=>d.accept())
  try{
    const [x,y]=CUMBRE,rect=(a,b)=>[[a,b],[a+.014,b],[a+.014,b-.014],[a,b-.014]]
    const e=ejercicioFicticio({conPlantilla:false});e.nombre='CUATRO AREAS SIN INSTALACIONES (FICT.)';e.unidades=[];e.orgTarea=[]
    e.ops={...e.ops,areaOps:null,limites:[],flechasZona:[],zonasLog:[
      {zona:'asdi',clave:'asdi-sin-inst',coords:rect(x-.022,y+.01)},
      {zona:'arce',clave:'arce-sin-inst',coords:rect(x+.008,y+.01)}],sectoresLog:[]}
    await sembrarYAbrir(page,e)
    await page.evaluate(([x,y])=>window.__mapa2d.setView([y,x],13,{animate:false}),CUMBRE)
    const antes=await ops(page),g4=page.locator('.bloque-ver').getByRole('region',{name:'🚚 G-4 · Logística',exact:true})
    await g4.getByRole('button',{name:'🚚 G-4 · Logística',exact:true}).click()
    const sectores=page.locator('.mapa-principal .sector-log')
    assert.equal(await sectores.count(),8,'cuatro áreas en ASDI y cuatro en ARCE')
    const textos=await sectores.allTextContents()
    for(const n of nombres)assert.equal(textos.filter(t=>t===n).length,2,n)
    assert.equal((await ops(page)).sectoresLog.length,0,'no se incorporan sectores al estado guardado')
    await g4.getByRole('button',{name:/Ocultar el grupo/}).click()
    assert.equal(await sectores.count(),0)
    await g4.getByRole('button',{name:'Ver sólo áreas, sin instalaciones',exact:true}).click()
    assert.equal(await sectores.count(),8,'la vista sólo áreas funciona con cero instalaciones y el grupo apagado')
    assert.equal(await page.locator('.mapa-principal .leaflet-marker-icon img').count(),0)
    await g4.getByRole('button',{name:'Ocultar Áreas internas del ASDI/ARCE',exact:true}).click()
    assert.equal(await sectores.count(),0)
    assert.equal(await page.locator('.mapa-principal .zona-log').count(),2,'el contorno externo queda')
    await g4.getByRole('button',{name:'Mostrar Áreas internas del ASDI/ARCE',exact:true}).click()
    await entrar3D(page)
    const colores=()=>page.evaluate(()=>['a','b'].flatMap(k=>{const d=window.__map3d.getSource(`m3d-${k}`)?._data;return(d?.geojson||d)?.features||[]}).map(f=>f.properties.c))
    const esperados=['#c0392b','#1f7a4d','#b8860b','#2f6db5']
    for(let i=0;i<80&&!(await colores()).includes(esperados[0]);i++)await page.waitForTimeout(100)
    for(const c of esperados)assert.ok((await colores()).includes(c),`el sector ${c} llega al espejo 3D`)
    await page.locator('select.sid-base').selectOption('g3d')
    const m=await(await page.locator('.sid-g3d iframe').elementHandle()).contentFrame()
    const poligonos=()=>m.evaluate(()=>window.__google3d.dataSources.get(0).entities.values.filter(e=>e.polygon).length)
    await m.waitForFunction(()=>window.__google3dTiles&&window.__calcoDibujado>0,null,{timeout:90000})
    assert.equal(await poligonos(),10,'dos contornos y ocho áreas interiores llegan a Google 3D')
    await g4.getByRole('button',{name:'Ocultar Áreas internas del ASDI/ARCE',exact:true}).click()
    await m.waitForFunction(()=>window.__google3d.dataSources.get(0).entities.values.filter(e=>e.polygon).length===2,null,{timeout:15000})
    await g4.getByRole('button',{name:'Ver sólo áreas, sin instalaciones',exact:true}).click()
    await m.waitForFunction(()=>window.__google3d.dataSources.get(0).entities.values.filter(e=>e.polygon).length===10,null,{timeout:15000})
    await m.evaluate(([x,y])=>{const C=Cesium,v=window.__google3d;v.camera.setView({destination:C.Cartesian3.fromDegrees(x,y,16000),orientation:{heading:0,pitch:C.Math.toRadians(-90),roll:0}});v.scene.requestRender()},CUMBRE)
    await m.waitForFunction(()=>window.__google3d.dataSourceDisplay.ready,null,{timeout:30000})
    await page.waitForTimeout(2500) // termina el cuadro de los polígonos pegados a los tiles
    await page.screenshot({path:path.join(salida,'cuatro-areas-google-3d.png')})
    assert.deepEqual(await ops(page),antes)
    await page.evaluate(()=>SIDGoogle.cerrar3D());await salir3D(page)

    // Las instalaciones vinculadas de sanidad y personal se ocultan juntas;
    // el puesto de prisioneros externo conserva el control del G-1.
    const con={...e,nombre:'AREAS CON INSTALACIONES (FICT.)',unidades:[
      {id:'sanidad',tipo:'instalacion',instalacion:'pced',bando:'propias',areaLog:'asdi-sin-inst',lng:x-.018,lat:y+.005},
      {id:'personal',tipo:'instalacion',instalacion:'p_ppgg',bando:'propias',areaLog:'asdi-sin-inst',lng:x-.012,lat:y},
      {id:'externo',tipo:'instalacion',instalacion:'p_ppgg',bando:'propias',lng:x,lat:y-.02}]}
    await sembrarYAbrir(page,con)
    if (await g4.getByRole('button',{name:/Ocultar el grupo/}).count()) await g4.getByRole('button',{name:/Ocultar el grupo/}).click()
    await g4.getByRole('button',{name:/Mostrar el grupo/}).click()
    assert.equal((await page.evaluate(()=>SIDGoogle.calcoDeLaCarta().fichas)).length,3,'las tres instalaciones están visibles antes de elegir sólo áreas')
    await g4.getByRole('button',{name:'Ver sólo áreas, sin instalaciones',exact:true}).click()
    const fichas=await page.evaluate(()=>SIDGoogle.calcoDeLaCarta().fichas)
    assert.equal(fichas.length,1,'queda sólo el puesto externo')
    assert.ok(Math.abs(fichas[0].lng-x)<1e-6)
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('button',{name:/Guardar todo/}).dispatchEvent('click')
    let guardado
    for(let i=0;i<50;i++){guardado=await leerGuardado(page,con.nombre);if(guardado?.unidades?.length===3)break;await page.waitForTimeout(100)}
    assert.equal(guardado.unidades.length,3);assert.equal(guardado.ops.sectoresLog.length,0)
    assert.deepEqual(guardado.ops.zonasLog,con.ops.zonasLog)
    assert.deepEqual(errores,[])
    console.log('OK: cuatro áreas por ASDI/ARCE sin instalaciones en 2D, 3D y Google 3D; sólo áreas oculta sanidad y personal vinculados; geometría e instalaciones originales se conservan.')
  }finally{await cerrar()}
})().catch(e=>{console.error(e);process.exitCode=1})
