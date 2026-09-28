const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const {pathToFileURL}=require('node:url')
const {cambios,aplicar}=require('./integrar-conceptos.cjs')
const raiz=path.resolve(__dirname,'..')
;(async()=>{
 const original=fs.readFileSync(path.join(raiz,'assets/index-zhbwncsH.js'),'utf8')
 const nuevo=fs.readFileSync(path.join(raiz,'assets/index-conceptos-20260928.js'),'utf8')
 assert.equal(aplicar(nuevo,[...cambios].reverse().map(([a,b])=>[b,a])),original)
 const m=await import(pathToFileURL(path.join(raiz,'conceptos/modelo.js')))
 const antiguo={'INTENCIÓN DEL COMANDANTE SUPERIOR (dos niveles arriba)':'ANTECEDENTE SIN ALTERAR'}
 const normal=m.normalizarConceptos(antiguo)
 assert.deepEqual(m.antecedentesConceptos(normal),Object.entries(antiguo))
 const u={...m.nuevaUnidad('u1'),nombre:'Unidad <A> & B',tarea:Array.from({length:100},(_,i)=>`Párrafo ${i}`).join('\n')}
 const v={...normal,unidades:[u,{...m.nuevaUnidad('u2','apoyo'),nombre:'Unidad B'}],relaciones:[{desde:'u2',hasta:'u1',tipo:'indirecta'}]}
 const html=m.conceptosHTML(v)
 assert.ok(html.includes('&lt;A&gt; &amp; B'));assert.ok(html.includes('Párrafo 99'))
 assert.ok(html.includes('stroke-dasharray'))
 assert.equal(m.eliminarUnidad(v,'u1').relaciones.length,0)
 assert.equal(v.relaciones.length,1)
 assert.equal(m.validarConceptos({...v,relaciones:[{desde:'x',hasta:'u1',tipo:'directa'}]}).length,1)
 assert.equal(m.laminasConceptos({}).length,2)
 console.log('OK: compilado reversible; texto anterior intacto; vínculos; escape; texto largo; hoja vacía.')
})().catch(e=>{console.error(e);process.exit(1)})
