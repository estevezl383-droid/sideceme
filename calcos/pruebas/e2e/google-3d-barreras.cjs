// El visor debe conservar los símbolos con rótulo de las capas visibles,
// aunque no estén en ops.obstaculos (calcos superpuestos/importados).
// CESIUM_DIR=…/Build/Cesium node calcos/pruebas/e2e/google-3d-barreras.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path')
const { abrir, sembrarYAbrir, estadoOps } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const { prepararVolcan, CUMBRE } = require('./google-3d-relieve.cjs')
const salida = path.resolve(__dirname, '../salidas-google-3d-barreras')

;(async () => {
  assert.ok(process.env.CESIUM_DIR, 'Configura CESIUM_DIR con Cesium 1.145.0 para probar el visor real.')
  fs.mkdirSync(salida, { recursive: true })
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1100, preparar: prepararVolcan() })
  try {
    const e = ejercicioFicticio({ conPlantilla: false })
    e.nombre = 'SIMBOLOS SUPERPUESTOS EN GOOGLE 3D (FICT.)'
    e.unidades = []
    e.ops = { ...e.ops, obstaculos: [], posDef: [], areaOps: null, limites: [], flechasZona: [] }
    await sembrarYAbrir(page, e)
    assert.equal((await estadoOps(page)).obstaculos, 0, 'el calco superpuesto no pertenece a ops')
    await page.locator('select.sid-base').selectOption('osm')
    await page.evaluate(([x, y]) => {
      const m = window.__mapa2d
      m.setView([y, x], 14, { animate: false })
      const g = window.__barrerasPrueba = L.layerGroup().addTo(m)
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" id="campo-prueba-svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="9" fill="#1f7a3d"/></svg>'
      L.polygon([[y+.006,x-.012],[y+.006,x-.004],[y-.002,x-.004],[y-.002,x-.012]], { color:'#1f7a3d', fillOpacity:.15 }).addTo(g)
      L.marker([y+.002,x-.008], { icon: L.divIcon({ className:'', html:'<div>'+svg+'<span style="color:#1f7a3d;font:700 12px Arial">CAMPO DE PRUEBA</span></div>', iconSize:[32,32], iconAnchor:[16,16] }) }).addTo(g)
      const cv = document.createElement('canvas'); cv.width = cv.height = 32
      const ctx = cv.getContext('2d'); ctx.strokeStyle = '#1f7a3d'; ctx.lineWidth = 4; ctx.strokeRect(5,5,22,22)
      window.__barreraImagen = cv.toDataURL()
      L.marker([y-.006,x+.008], { icon:L.divIcon({ className:'', html:'<img width="32" height="32" src="'+window.__barreraImagen+'"><span style="color:#1f7a3d;font:700 12px Arial">BARRERA DE PRUEBA</span>', iconSize:[32,32],iconAnchor:[16,16] }) }).addTo(g)
    }, CUMBRE)
    const enMapa = await page.locator('.mapa-principal .leaflet-marker-icon svg#campo-prueba-svg').count()
    assert.equal(enMapa, 1, 'el símbolo está en la vista Mapa')
    const transferido = await page.evaluate(() => {
      const c = SIDGoogle.calcoDeLaCarta()
      return { svg:c.flechas.some(f => decodeURIComponent(f.svg).includes('campo-prueba-svg')),
        img:c.fichas.some(f => f.img === window.__barreraImagen), textos:c.rotulos.map(r=>r.texto) }
    })
    assert.equal(transferido.svg, true, 'Google 3D debe recibir el SVG aunque tenga un rótulo al lado')
    assert.equal(transferido.img, true, 'Google 3D debe recibir la imagen aunque tenga un rótulo al lado')
    assert.ok(transferido.textos.includes('CAMPO DE PRUEBA'))
    assert.ok(transferido.textos.includes('BARRERA DE PRUEBA'))

    await page.locator('select.sid-base').selectOption('g3d')
    await page.locator('.sid-g3d iframe').waitFor()
    const marco = await (await page.locator('.sid-g3d iframe').elementHandle()).contentFrame()
    await marco.waitForFunction(()=>window.__google3dTiles && window.__calcoDibujado>0, null, { timeout:90000 })
    await marco.evaluate(([x,y])=>{
      const C=Cesium, v=window.__google3d
      v.camera.setView({destination:C.Cartesian3.fromDegrees(x,y,10000),orientation:{heading:0,pitch:C.Math.toRadians(-90),roll:0}})
      v.scene.requestRender()
    }, CUMBRE)
    await marco.waitForFunction(()=>window.__google3d.dataSourceDisplay.ready && window.__google3dAlturas>0, null, {timeout:45000})
    const dibujado = await marco.evaluate(()=>{
      const t=Cesium.JulianDate.now(), es=window.__google3d.dataSources.get(0).entities.values
      return { imagenes:es.filter(e=>e.billboard).map(e=>String(e.billboard.image.getValue(t))),
        rotulos:es.filter(e=>e.label).map(e=>({texto:e.label.text.getValue(t),dx:e.label.pixelOffset?.getValue(t).x||0})) }
    })
    assert.ok(dibujado.imagenes.some(s=>decodeURIComponent(s).includes('campo-prueba-svg')), 'el SVG está dibujado por Cesium')
    assert.ok(dibujado.imagenes.some(s=>s.startsWith('data:image/png')), 'la imagen está dibujada por Cesium')
    assert.equal(dibujado.rotulos.length, 2)
    assert.ok(dibujado.rotulos.every(r=>r.dx>0), 'los rótulos quedan al lado de los símbolos')
    await page.screenshot({path:path.join(salida,'barreras-google-3d.png')})
    await page.evaluate(()=>window.__mapa2d.removeLayer(window.__barrerasPrueba))
    await marco.waitForFunction(()=>window.__calcoDibujado===0,null,{timeout:15000})
    await page.evaluate(()=>window.__barrerasPrueba.addTo(window.__mapa2d))
    await marco.waitForFunction(()=>window.__calcoDibujado>0,null,{timeout:15000})
    assert.equal((await estadoOps(page)).obstaculos,0,'el cambio de vista no inventa ni modifica obstáculos')

    // El plan editable también conserva campos AP/AC, una línea y una pieza
    // puntual al pasar de Mapa al visor; el ojo retira el plan completo.
    await page.evaluate(()=>window.__mapa2d.removeLayer(window.__barrerasPrueba))
    const [x,y] = CUMBRE
    const nativo = { ...e, nombre:'PLAN DE BARRERAS EN GOOGLE 3D (FICT.)', ops:{...e.ops,obstaculos:[
      {tipo:'minado_ap',coords:[[x-.02,y+.015],[x-.01,y+.015],[x-.01,y+.005],[x-.02,y+.005]]},
      {tipo:'minado_ac',coords:[[x+.01,y+.015],[x+.02,y+.015],[x+.02,y+.005],[x+.01,y+.005]]},
      {tipo:'concertina',coords:[[x-.02,y-.01],[x+.02,y-.01]]},
      {tipo:'demolicion',centro:[x,y-.02]}
    ]} }
    await sembrarYAbrir(page,nativo)
    assert.equal((await estadoOps(page)).obstaculos,4)
    await marco.waitForFunction(()=>window.__calcoDibujado>10,null,{timeout:15000})
    const calcoNativo = await page.evaluate(()=>SIDGoogle.calcoDeLaCarta())
    assert.equal(calcoNativo.areas.length,2,'ambos campos minados llegan al visor')
    assert.equal(calcoNativo.lineas.filter(l=>l.opacidad>.1).length,1,'la concertina llega al visor')
    assert.ok(calcoNativo.flechas.length>4,'los símbolos interiores y la demolición llegan al visor')
    await page.locator('.bloque-ver').getByRole('button',{name:'🔵 G-3 · fase 4 · Cursos de acción propios',exact:true}).click()
    await page.getByRole('button',{name:'Ocultar Plan de barreras',exact:true}).click()
    await marco.waitForFunction(()=>window.__calcoDibujado===0,null,{timeout:15000})
    assert.equal((await estadoOps(page)).obstaculos,4,'el ojo conserva los obstáculos editables')
    await page.getByRole('button',{name:'Mostrar Plan de barreras',exact:true}).click()
    await marco.waitForFunction(()=>window.__calcoDibujado>10,null,{timeout:15000})
    await marco.waitForFunction(()=>window.__google3d.dataSourceDisplay.ready,null,{timeout:15000})
    await page.screenshot({path:path.join(salida,'plan-barreras-google-3d.png')})
    assert.deepEqual(errores,[])
    console.log('OK: símbolos con rótulos y capas superpuestas con ops vacío; plan editable con campos AP/AC, concertina y demolición; Google 3D real y ojos sin alterar el ejercicio.')
  } finally { await cerrar() }
})().catch(e=>{console.error(e);process.exitCode=1})
