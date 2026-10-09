const assert = require('assert')
const { abrir, estadoReact, sembrarYAbrir, entrar3D, salir3D, aPantalla } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const ops = page => estadoReact(page, v => v && Array.isArray(v.zonasLog) && Array.isArray(v.limites) ? JSON.parse(JSON.stringify(v)) : undefined)
const unidades = page => estadoReact(page, v => Array.isArray(v) && v.some(x=>x?.id==='fict-alfa') ? JSON.parse(JSON.stringify(v)) : undefined)
;(async()=>{
 const m=await abrir();const {page}=m
 try{
  const d=ejercicioFicticio({conPlantilla:false})
  d.unidades.push({id:'fict-instal',tipo:'instalacion',instalacion:'agua',bando:'propias',arma:'logistica',escalon:'seccion',lat:-17.022,lng:-65.045,origen:'plantilla-asdi'})
  await sembrarYAbrir(page,d)
  const ocultar=page.getByText('▼ ocultar');if(await ocultar.count())await ocultar.first().click().catch(()=>{})
  await entrar3D(page)
  await page.evaluate(()=>{window.__lm2d=window.__espejo3d.lm;window.__map3d.jumpTo({center:[-65.05,-17.015],zoom:13.2,pitch:40,bearing:0})})
  await page.waitForTimeout(2500)
  let contador=0;for(const vista of ['2d','3d']){for(const tipo of ['EPA','EPE']){
   if(vista==='2d')await salir3D(page);else await entrar3D(page)
   await page.getByRole('button',{name:/G-4 LOGÍSTICA/i}).first().dispatchEvent('click')
   await page.getByRole('button',{name:/^↔ Ejes$/}).click();await page.getByRole('button',{name:new RegExp('Trazar el '+tipo)}).click()
   const pts=await aPantalla(page,[[-65.072,-17.01],[-65.063,-17.01],[-65.063,-17.021],[-65.072,-17.021]])
   for(const [x,y] of pts){await page.mouse.click(x,y);await page.waitForTimeout(300)}
   if(vista==='3d'&&tipo==='EPE')await page.mouse.dblclick(...pts.at(-1));else await page.getByRole('button',{name:'✓ TERMINAR TRAZO',exact:true}).click()
   await page.waitForTimeout(800)
   const e=await ops(page);assert.equal(e.ejesLog.length,++contador);assert(e.ejesLog.at(-1).coords.length>=2);assert.equal(e.ejesLog.at(-1).tipo,tipo.toLowerCase());assert.equal(e.zonasLog.length,0)
   console.log('✔ '+tipo+' trazado manual en '+vista)
   await page.getByRole('button',{name:'✕',exact:true}).last().click();await page.waitForTimeout(2000)
  }}
  assert.deepStrictEqual(m.errores,[])
 }finally{await m.cerrar()}
})().catch(e=>{console.error(e);process.exitCode=1})
