const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const {abrir,sembrarYAbrir,estadoReact,entrar3D,salir3D,leerGuardado}=require('./navegador')
const {ejercicioFicticio}=require('../ejercicio-ficticio')
const {prepararVolcan,CUMBRE}=require('./google-3d-relieve.cjs')
const salida=path.resolve(__dirname,'../salidas-productos-em')
const estado=p=>estadoReact(p,v=>v&&Array.isArray(v.zonasLog)&&Array.isArray(v.lineasEM)?v:undefined)
const iguales=(a,b)=>JSON.stringify(a)===JSON.stringify(b)

;(async()=>{
  assert.ok(process.env.CESIUM_DIR,'Configura CESIUM_DIR con Cesium 1.145.0.')
  fs.mkdirSync(salida,{recursive:true})
  const {page,errores,cerrar}=await abrir({ancho:1600,alto:1200,preparar:prepararVolcan()})
  page.on('dialog',d=>d.accept())
  try{
    const [x,y]=CUMBRE,rect=(a,b)=>[[a,b],[a+.008,b],[a+.008,b-.008],[a,b-.008]]
    const e=ejercicioFicticio({conPlantilla:false});e.nombre='PRODUCTOS G-4 Y G-1 (FICT.)'
    e.fasesCOA={propio:[],enemigo:[]};e.g3={}
    const inst=(id,instalacion,lng,lat,extra={})=>({id,tipo:'instalacion',instalacion,bando:'propias',lng,lat,...extra})
    e.unidades=[inst('ppgg','p_ppgg',x+.005,y-.022),inst('dpg','dpg',x+.009,y-.022),inst('extrav','pce',x-.012,y-.022),
      inst('dist','pd_cl1',x-.022,y+.012,{areaLog:'asdi-fict'}),{id:'normal',tipo:'unidad',arma:'infanteria',escalon:'compania',bando:'propias',lng:x,lat:y,designacion:'UNIDAD FICTICIA'}]
    e.ops={...e.ops,areaOps:null,limites:[],flechasZona:[],zonasLog:[
      {zona:'asdi',clave:'asdi-fict',coords:rect(x-.025,y+.016)},
      {zona:'arce',clave:'arce-fict',coords:rect(x+.016,y+.016)}],
      sectoresLog:[{areaLog:'asdi-fict',sector:'prueba',nombre:'SECTOR FICTICIO',coords:rect(x-.024,y+.014)}],
      ejesLog:[{tipo:'epa',coords:[[x-.02,y-.004],[x+.02,y-.004]]},{tipo:'epe',coords:[[x-.02,y-.007],[x+.02,y-.007]]}],
      lineasEM:[{tipo:'extraviados',coords:[[x-.02,y-.013],[x+.02,y-.013]]},{tipo:'ppgg',coords:[[x-.02,y-.016],[x+.02,y-.016]]},
        {tipo:'humanitario',coords:[[x-.02,y-.019],[x+.02,y-.019]]}],obstaculos:[],posDef:[],magnitudes:[]}
    // Leaflet y el puente de Google serializan las coordenadas con seis decimales.
    e.ops=JSON.parse(JSON.stringify(e.ops,(_,v)=>typeof v==='number'?Math.round(v*1e6)/1e6:v))
    e.unidades=e.unidades.map(u=>({...u,lng:Math.round(u.lng*1e6)/1e6,lat:Math.round(u.lat*1e6)/1e6}))
    await sembrarYAbrir(page,e)
    await page.evaluate(([x,y])=>window.__mapa2d.setView([y,x],14,{animate:false}),CUMBRE)
    const antes=await estado(page),lista=page.locator('.bloque-ver')
    assert.equal(await lista.locator('.ver-cab').count(),7)
    for(const cab of await lista.locator('.ver-cab').all())assert.equal(await cab.getAttribute('aria-expanded'),'false')
    const g4=lista.getByRole('region',{name:'🚚 G-4 · Logística',exact:true}),g1=lista.getByRole('region',{name:'👥 G-1 · Personal',exact:true})
    const orden=await lista.locator('.ver-cab').evaluateAll(es=>es.map(e=>({nom:e.getAttribute('aria-label'),y:e.getBoundingClientRect().top})))
    const top=n=>orden.find(o=>o.nom.includes(n)).y
    assert.ok(top('G-3')<top('G-4')&&top('G-4')<top('G-1'),'G-4 y G-1 van debajo de G-3')
    await g4.getByRole('button',{name:'🚚 G-4 · Logística',exact:true}).click()
    await g1.getByRole('button',{name:'👥 G-1 · Personal',exact:true}).click()
    const hay=coord=>page.evaluate(c=>Object.values(window.__mapa2d._layers).some(l=>{
      try{return l.toGeoJSON&&JSON.stringify(l.toGeoJSON().geometry.coordinates).includes(JSON.stringify(c))}catch{return false}
    }),coord)
    const asdi=e.ops.zonasLog[0].coords[0],arce=e.ops.zonasLog[1].coords[0],dist=[e.unidades[3].lng,e.unidades[3].lat]
    assert.equal(await hay(asdi),true);assert.equal(await hay(arce),true)
    await g4.getByRole('button',{name:'Ocultar ASDI',exact:true}).click()
    assert.equal(await hay(asdi),false);assert.equal(await hay(dist),false);assert.equal(await hay(arce),true)
    await g4.getByRole('button',{name:'Mostrar ASDI',exact:true}).click()
    assert.equal(await hay(asdi),true);assert.equal(await hay(dist),true)
    await g4.getByRole('button',{name:'Ocultar Ejes de abastecimiento (EPA)',exact:true}).click()
    assert.equal(await hay(e.ops.ejesLog[0].coords[0]),false);assert.equal(await hay(e.ops.ejesLog[1].coords[0]),true)
    await g4.getByRole('button',{name:'Mostrar Ejes de abastecimiento (EPA)',exact:true}).click()
    await g1.getByRole('button',{name:'Ocultar Línea de extraviados',exact:true}).click()
    assert.equal(await hay(e.ops.lineasEM[0].coords[0]),false);assert.equal(await hay(e.ops.lineasEM[1].coords[0]),true)
    await g1.getByRole('button',{name:'Mostrar Línea de extraviados',exact:true}).click()
    await g1.getByRole('button',{name:'Ocultar Puestos y centros de reunión de prisioneros',exact:true}).click()
    assert.equal(await hay([e.unidades[0].lng,e.unidades[0].lat]),false)
    assert.equal(await hay([e.unidades[1].lng,e.unidades[1].lat]),false)
    assert.equal(await hay([e.unidades[2].lng,e.unidades[2].lat]),true)
    await g1.getByRole('button',{name:'Mostrar Puestos y centros de reunión de prisioneros',exact:true}).click()
    for(const g of [g4,g1])await g.getByRole('button',{name:/Ocultar el grupo/}).click()
    assert.equal(await hay(asdi),false);assert.equal(await hay(arce),false)
    assert.equal(await hay(e.ops.ejesLog[0].coords[0]),false);assert.equal(await hay(e.ops.ejesLog[1].coords[0]),false)
    assert.equal(await hay(e.ops.lineasEM[0].coords[0]),false);assert.equal(await hay(e.ops.lineasEM[1].coords[0]),false)
    assert.equal(await hay(e.ops.lineasEM[2].coords[0]),true,'el eje humanitario se conserva')
    assert.equal(await hay([x,y]),true,'la unidad de combate se conserva')
    for(const g of [g4,g1])await g.getByRole('button',{name:/Mostrar el grupo/}).click()
    assert.deepEqual(await estado(page),antes,'ocultar no cambia los datos editables')
    await entrar3D(page)
    const en3d=coord=>page.evaluate(c=>['a','b'].some(k=>{
      const d=window.__map3d.getSource(`m3d-${k}`)?._data
      return JSON.stringify((d?.geojson||d)?.features||[]).includes(JSON.stringify(c))
    }),coord)
    await g4.getByRole('button',{name:'Ocultar ASDI',exact:true}).click()
    for(let i=0;i<80&&await en3d(asdi);i++)await page.waitForTimeout(100)
    assert.equal(await en3d(asdi),false);assert.equal(await en3d(arce),true)
    await g4.getByRole('button',{name:'Mostrar ASDI',exact:true}).click()
    await page.locator('select.sid-base').selectOption('g3d')
    const marco=await(await page.locator('.sid-g3d iframe').elementHandle()).contentFrame()
    await marco.waitForFunction(()=>window.__google3dTiles&&window.__calcoDibujado>0,null,{timeout:90000})
    const ppgg=[e.unidades[0].lng,e.unidades[0].lat]
    const puntoGE=c=>marco.evaluate(c=>window.__google3d.dataSources.get(0).entities.values.some(e=>JSON.stringify(e.sidLL)===JSON.stringify(c)),c)
    assert.equal(await puntoGE(ppgg),true)
    await g1.getByRole('button',{name:/Ocultar el grupo/}).click()
    for(let i=0;i<80&&await puntoGE(ppgg);i++)await page.waitForTimeout(100)
    assert.equal(await puntoGE(ppgg),false)
    await g4.getByRole('button',{name:/Ocultar el grupo/}).click()
    await marco.waitForFunction(()=>window.__google3d.dataSources.get(0).entities.values.filter(e=>e.polygon).length===0,null,{timeout:15000})
    for(const g of [g4,g1])await g.getByRole('button',{name:/Mostrar el grupo/}).click()
    await marco.waitForFunction(()=>window.__google3d.dataSources.get(0).entities.values.filter(e=>e.polygon).length>=3,null,{timeout:15000})
    await marco.evaluate(([x,y])=>{
      const C=Cesium,v=window.__google3d
      v.camera.setView({destination:C.Cartesian3.fromDegrees(x,y,10000),orientation:{heading:0,pitch:C.Math.toRadians(-90),roll:0}});v.scene.requestRender()
    },CUMBRE)
    await marco.waitForFunction(()=>window.__google3d.dataSourceDisplay.ready,null,{timeout:30000})
    await page.screenshot({path:path.join(salida,'g4-g1-google-3d.png')})
    await page.evaluate(()=>SIDGoogle.cerrar3D());await salir3D(page)
    assert.ok(iguales(await estado(page),antes),'las tres vistas conservan el ejercicio')

    // Al ocultar el índice 0, editar el área visible sigue actuando sobre el 1.
    await g4.getByRole('button',{name:'Ocultar ASDI',exact:true}).click()
    await page.evaluate(c=>{
      const m=window.__mapa2d,l=Object.values(m._layers).find(l=>l._sidArea&&l.toGeoJSON&&JSON.stringify(l.toGeoJSON().geometry.coordinates).includes(JSON.stringify(c)))
      if(!l)throw Error('No se encontró el borde editable del ARCE')
      l.fire('contextmenu',{latlng:l.getBounds().getCenter(),originalEvent:new MouseEvent('contextmenu',{clientX:900,clientY:550,bubbles:true})})
    },arce)
    await page.locator('.menu-figura').getByRole('button',{name:'🗑 Borrar toda la figura',exact:true}).click()
    const editado=await estado(page)
    assert.deepEqual(editado.zonasLog.map(z=>z.clave),['asdi-fict'],'se borró el ARCE visible, no el ASDI oculto')
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('button',{name:/Guardar todo/}).dispatchEvent('click')
    for(let i=0;i<50&&(await leerGuardado(page,e.nombre))?.ops?.zonasLog?.length!==1;i++)await page.waitForTimeout(100)
    const guardado=await leerGuardado(page,e.nombre)
    assert.equal(guardado.ops.zonasLog[0].clave,'asdi-fict')
    assert.deepEqual(guardado.ops.ejesLog,e.ops.ejesLog);assert.deepEqual(guardado.ops.lineasEM,e.ops.lineasEM)
    assert.deepEqual(errores,[])
    console.log('OK: G-4 y G-1 plegados y ordenados; ojos por producto/grupo en 2D, 3D y Google 3D; datos y edición con índices originales conservados.')
  }finally{await cerrar()}
})().catch(e=>{console.error(e);process.exitCode=1})
