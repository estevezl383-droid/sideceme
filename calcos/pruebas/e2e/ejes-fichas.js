const assert = require('assert')
const { abrir, estadoReact, sembrarYAbrir, entrar3D, salir3D, aPantalla } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const ops=page=>estadoReact(page,v=>v&&Array.isArray(v.ejesLog)&&Array.isArray(v.limites)?JSON.parse(JSON.stringify(v)):undefined)
const origen=[-65.045,-17.022],destino=[-65.072,-17.012]
async function centroFicha(page,c){
 return page.evaluate(p=>{const m=Object.values(window.__lm2d._layers).find(x=>x._icon&&x.getLatLng&&Math.abs(x.getLatLng().lng-p[0])<1e-8&&Math.abs(x.getLatLng().lat-p[1])<1e-8);if(!m)throw Error('Ficha no encontrada');const r=m._icon.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]},c)
}
;(async()=>{
 const m=await abrir();const {page}=m
 try{
  const d=ejercicioFicticio({conPlantilla:false});d.unidades.push({id:'fict-instal',tipo:'instalacion',instalacion:'agua',bando:'propias',arma:'logistica',escalon:'seccion',lat:origen[1],lng:origen[0]})
  await sembrarYAbrir(page,d)
  const ocultar=page.getByText('▼ ocultar');if(await ocultar.count())await ocultar.first().click().catch(()=>{})
  await entrar3D(page);await page.evaluate(()=>{window.__lm2d=window.__espejo3d.lm;window.__map3d.jumpTo({center:[-65.05,-17.015],zoom:13.2,pitch:40,bearing:0})});await page.waitForTimeout(2000)
  let n=0
  for(const vista of ['2d','3d']){
   if(vista==='2d')await salir3D(page);else await entrar3D(page)
   for(const tipo of ['EPA','EPE']){
    await page.getByRole('button',{name:/G-4 LOGÍSTICA/i}).first().dispatchEvent('click');await page.getByRole('button',{name:/^↔ Ejes$/}).click();await page.getByRole('button',{name:new RegExp('Trazar el '+tipo)}).click();await page.waitForTimeout(1800)
    await page.mouse.click(...await centroFicha(page,origen));await page.waitForTimeout(300)
    const [p]=await aPantalla(page,[[-65.06,-17.026]]);await page.mouse.click(...p);await page.waitForTimeout(300)
    await page.mouse.dblclick(...await centroFicha(page,destino));await page.waitForTimeout(1200)
    const e=await ops(page);assert.equal(e.ejesLog.length,++n);const linea=e.ejesLog.at(-1);assert.deepStrictEqual(linea.coords[0],origen);assert.deepStrictEqual(linea.coords.at(-1),destino);assert.equal(linea.tipo,tipo.toLowerCase());assert.equal(await page.getByRole('button',{name:'✓ TERMINAR TRAZO',exact:true}).count(),0)
    const color=tipo==='EPA'?'#ff8c00':'#00e5ff';assert(await page.evaluate(c=>Object.values(window.__lm2d._layers).some(x=>x.options?.color===c&&x.getLatLngs),color))
    console.log('✔ '+tipo+' '+vista+': clic en ficha, doble clic en otra ficha, extremos exactos, termina herramienta y color correcto')
    await page.getByRole('button',{name:'✕',exact:true}).last().click();await page.waitForTimeout(1000)
   }
  }
  assert.deepStrictEqual(m.errores,[])
 }finally{await m.cerrar()}
})().catch(e=>{console.error(e);process.exitCode=1})
