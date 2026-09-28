// Comprueba la aplicación real con datos sintéticos de formato, sin servicios externos.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const {abrir,sembrarYAbrir,leerGuardado}=require('./navegador.js')
const out=path.resolve(__dirname,'../salidas-conceptos');fs.mkdirSync(out,{recursive:true})
const datos={version:1,nombre:'PRUEBA FORMATO CONCEPTOS',pais:'bolivia',unidades:[],g3:{entrelazados:{'MISIÓN, TAREAS, LIMITACIONES Y RIESGO IMPUESTOS':'ANTECEDENTE SIN ALTERAR'}},ops:{limites:[],coordinacion:[],pasaje:[],tareas:[],zonasLog:[],sectoresLog:[],ejesLog:[],lineasEM:[],magnitudes:[],flechasZona:[],obstaculos:[],posDef:[],ains:[],objetivos:[],maniobra:[],areaOps:null}}
async function hoja(page){
 if(await page.getByRole('button',{name:/^Añadir Dos escalones arriba/}).count())return
 await page.getByRole('button',{name:/G-3 Operaciones/}).first().dispatchEvent('click')
 await page.getByRole('button',{name:'📄 Documentos',exact:true}).dispatchEvent('click')
 await page.getByRole('button',{name:/Analizar la misión/}).first().dispatchEvent('click')
 await page.getByRole('button',{name:/F2·P1.*Conceptos entrelazados/}).dispatchEvent('click')
}
;(async()=>{
 for(const movil of [false,true]){
 const a=await abrir({ancho:movil?390:1440,alto:movil?844:1000,movil,consulta:'?puesto=g3'}),{page}=a
 page.on('dialog',d=>d.accept())
 try{
  await sembrarYAbrir(page,datos)
  await hoja(page)
  assert.equal(await page.getByRole('button',{name:/Completar y mejorar/}).count(),0)
  await page.getByText(/Texto anterior conservado/).click()
  assert.equal(await page.getByRole('textbox',{name:'MISIÓN, TAREAS, LIMITACIONES Y RIESGO IMPUESTOS',exact:true}).inputValue(),'ANTECEDENTE SIN ALTERAR')
  for(const [grupo,nombre] of [['Dos escalones arriba','SUPERIOR A'],['Superior inmediato','SUPERIOR B'],['Maniobra y unidad propia','UNIDAD C'],['Apoyo de combate','UNIDAD D']]){
   await page.getByRole('button',{name:`Añadir ${grupo}`,exact:true}).click()
   await page.getByRole('textbox',{name:'Denominación',exact:true}).last().fill(nombre)
   await page.getByRole('textbox',{name:'Tarea',exact:true}).last().fill('Texto de tarea de muestra.')
   await page.getByRole('textbox',{name:'Propósito',exact:true}).last().fill('Texto de propósito de muestra.')
  }
  await page.getByRole('button',{name:'Añadir fase',exact:true}).last().click()
  await page.getByRole('textbox',{name:'Nombre de fase',exact:true}).fill('FASE DE MUESTRA')
  await page.getByRole('textbox',{name:'Tarea de fase',exact:true}).fill('Texto de fase de muestra.')
  await page.getByRole('button',{name:'Añadir relación',exact:true}).click()
  await page.getByRole('combobox',{name:'Tipo',exact:true}).selectOption('indirecta')
  await page.getByRole('button',{name:'Ver hoja gráfica',exact:true}).click()
  assert.equal(await page.locator('svg').filter({has:page.locator('text',{hasText:'HOJA DE TRABAJO DE CONCEPTOS ENTRELAZADOS'})}).count(),2)
  await page.screenshot({path:path.join(out,movil?'movil.png':'escritorio.png'),fullPage:true})
  const descarga=page.waitForEvent('download')
  await page.getByRole('button',{name:'Descargar Word gráfico',exact:true}).click()
  const doc=await descarga;assert.equal(doc.suggestedFilename(),'F2P1_Conceptos_entrelazados.docx')
  await doc.saveAs(path.join(out,movil?'movil.docx':'escritorio.docx'))
  await page.getByRole('button',{name:/^📁 PRUEBA FORMATO CONCEPTOS/i}).first().dispatchEvent('click')
  await page.getByRole('button',{name:/Guardar todo/}).dispatchEvent('click')
  let guardado
  for(let i=0;i<30;i++){guardado=await leerGuardado(page,datos.nombre);if(guardado?.g3?.entrelazados?.unidades?.length===4)break;await page.waitForTimeout(200)}
  assert.equal(guardado.g3.entrelazados.unidades.length,4)
  assert.equal(guardado.g3.entrelazados['MISIÓN, TAREAS, LIMITACIONES Y RIESGO IMPUESTOS'],'ANTECEDENTE SIN ALTERAR')
  assert.equal(guardado.g3.entrelazados.relaciones[0].tipo,'indirecta')
  assert.equal(guardado.g3.entrelazados.unidades[3].fases[0].nombre,'FASE DE MUESTRA')
  await page.reload();await page.waitForTimeout(2000)
  await sembrarYAbrir(page,guardado);await hoja(page)
  assert.equal(await page.getByRole('textbox',{name:'Denominación',exact:true}).count(),4)
  assert.equal(await page.getByRole('textbox',{name:'Nombre de fase',exact:true}).inputValue(),'FASE DE MUESTRA')
  assert.deepEqual(a.errores,[])
  console.log(`OK ${movil?'móvil':'escritorio'}: abrir anterior, editar, relaciones, vista gráfica, Word, guardar y reabrir.`)
 }catch(e){console.error('ERRORES APP',a.errores);fs.writeFileSync(path.join(out,'fallo.txt'),await page.locator('body').innerText());await page.screenshot({path:path.join(out,'fallo.png'),fullPage:true});throw e}finally{await a.cerrar()}
 }
})().catch(e=>{console.error(e);process.exit(1)})
