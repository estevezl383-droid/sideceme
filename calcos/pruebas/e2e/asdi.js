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
  for(const vista of ['2d','3d']){
   if(vista==='2d')await salir3D(page);else await entrar3D(page)
   await page.getByRole('button',{name:/G-4 LOGÍSTICA/i}).first().dispatchEvent('click')
   await page.getByRole('button',{name:/Trazar el ASDI/i}).click()
   const pts=await aPantalla(page,[[-65.072,-17.01],[-65.063,-17.01],[-65.063,-17.021],[-65.072,-17.021]])
   for(const [x,y] of pts){await page.mouse.click(x,y);await page.waitForTimeout(300)}
   if(vista==='3d'&&process.env.ASDI_CIERRE==='doble')await page.mouse.dblclick(...pts.at(-1));else await page.getByRole('button',{name:'✓ CERRAR ÁREA',exact:true}).click()
   await page.waitForTimeout(800)
   const e=await ops(page);assert.equal(e.zonasLog.length,vista==='2d'?1:2);assert(e.zonasLog.at(-1).coords.length>=3)
   console.log('✔ ASDI desde G4, cierre '+(vista==='3d'&&process.env.ASDI_CIERRE==='doble'?'con doble clic':'con botón')+' en '+vista)
   await page.getByRole('button',{name:'✕',exact:true}).last().click();await page.waitForTimeout(2000)
  }
  // Open the real 3D marker popup; deleting it preserves all other units and areas.
  const marker=await page.evaluate(()=>{const lm=window.__espejo3d.lm;const m=Object.values(lm._layers).find(x=>x.getLatLng&&x.getPopup?.()&&x.getPopup().getContent()?.textContent?.includes('ELIMINAR INSTALACIÓN'));if(!m)return null;const r=m._icon.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})
  assert(marker,'instalación con popup');await page.mouse.click(...marker);await page.waitForTimeout(1000)
  page.once('dialog',x=>x.accept());await page.getByRole('button',{name:'ELIMINAR INSTALACIÓN'}).click();await page.waitForTimeout(500)
  const u=await unidades(page);assert(!u.some(x=>x.id==='fict-instal'));assert.equal(u.length,4);assert.equal((await ops(page)).zonasLog.length,2)
  console.log('✔ clic y borrado individual de instalación en 3D sin afectar otras fichas ni áreas')
  assert.deepStrictEqual(m.errores,[])
 }finally{await m.cerrar()}
})().catch(e=>{console.error(e);process.exitCode=1})
