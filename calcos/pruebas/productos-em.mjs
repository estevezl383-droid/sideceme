import { test } from 'node:test'
import assert from 'node:assert/strict'
import { productosDelEM, productoVisible, productoEncendido, cambiarProducto, unidadesProductos } from '../visibilidad/v1/productos-em.mjs'

const catalogo = [{id:'asdi',grupo:'areas'},{id:'pd_cl1',grupo:'abast'},{id:'a_descanso',grupo:'personal'},{id:'p_ayuda',grupo:'ac'}]
const ops = {zonasLog:[{zona:'asdi',clave:'a'},{zona:'arce',clave:'b'},{zona:'atcomb'}],sectoresLog:[{areaLog:'a'}],
  ejesLog:[{tipo:'epa'},{tipo:'epe'}],lineasEM:[{tipo:'extraviados'},{tipo:'ppgg'},{tipo:'humanitario'}]}
const unidades = [{id:'r',instalacion:'p_ppgg'},{id:'d',instalacion:'dpg'},{id:'x',instalacion:'pce'},
  {id:'p',instalacion:'pd_cl1',areaLog:'a'},{id:'desc',instalacion:'a_descanso'},{id:'civil',instalacion:'p_ayuda'},
  {id:'normal',tipo:'unidad'},{id:'enemigo',instalacion:'p_ppgg',bando:'enemigas'}]

test('G-4 y G-1 cuentan cada tipo y mantienen los elementos civiles y enemigos aparte',()=>{
  const [g4,g1] = productosDelEM(ops,unidades,catalogo)
  const n = Object.fromEntries([...g4.filas,...g1.filas].map(f=>[f.id,f.cantidad]))
  assert.deepEqual([g4.id,g1.id],['g4','g1'])
  assert.equal(n['zonasLog:asdi'],1);assert.equal(n['zonasLog:arce'],1)
  assert.equal(n['g4:epa'],1);assert.equal(n['g4:epe'],1)
  assert.equal(n['g1:prisioneros'],2);assert.equal(n['g1:puestosExtraviados'],1)
  assert.equal(n['g1:lineaExtraviados'],1);assert.equal(n['g1:rutaPrisioneros'],1)
})
test('ASDI y ARCE se ocultan individualmente, con los sectores y fichas asociados',()=>{
  const ver = {'zonasLog:asdi':false}
  assert.equal(productoVisible('zonasLog',ops.zonasLog[0],ver,ops),false)
  assert.equal(productoVisible('zonasLog',ops.zonasLog[1],ver,ops),true)
  assert.equal(productoVisible('sectoresLog',ops.sectoresLog[0],ver,ops),false)
  assert.equal(productoVisible('magnitudes',{origen:'zona-a'},ver,ops),false)
  assert.equal(productoVisible('magnitudes',{origen:'libre'},ver,ops),true)
  assert.ok(!unidadesProductos(unidades,ops,ver,catalogo).some(u=>u.id==='p'))
})
test('EPA, EPE y líneas del G-1 tienen controles independientes',()=>{
  const ver = {'g4:epa':false,'g1:lineaExtraviados':false,'g1:rutaPrisioneros':false}
  assert.equal(productoVisible('ejesLog',ops.ejesLog[0],ver),false)
  assert.equal(productoVisible('ejesLog',ops.ejesLog[1],ver),true)
  assert.deepEqual(ops.lineasEM.map(l=>productoVisible('lineasEM',l,ver)),[false,false,true])
})
test('el maestro antiguo de Logística y los ojos de las áreas se coordinan',()=>{
  const antes = {zonasLog:false,'g4:epa':false}
  assert.equal(productoEncendido(antes,'zonasLog:asdi'),false)
  const despues = cambiarProducto(antes,'zonasLog:asdi',true)
  assert.equal(productoEncendido(despues,'zonasLog:asdi'),true)
  assert.equal(productoEncendido(despues,'zonasLog:arce'),false)
  assert.equal(productoEncendido(despues,'zonasLog:otras'),false)
  assert.equal(despues['g4:epa'],false)
  assert.equal(antes.zonasLog,false)
})
test('el ojo G-1 conserva unidades de combate, ayudas civiles y datos originales',()=>{
  const antes = JSON.stringify({ops,unidades})
  const g1 = productosDelEM(ops,unidades,catalogo)[1]
  const ver = Object.fromEntries(g1.claves.map(k=>[k,false]))
  assert.deepEqual(unidadesProductos(unidades,ops,ver,catalogo).map(u=>u.id),['p','civil','normal','enemigo'])
  assert.equal(JSON.stringify({ops,unidades}),antes)
})
test('los elementos antiguos sin tipo usan el mismo control que su símbolo en la carta',()=>{
  const antiguos={ejesLog:[{}],lineasEM:[{}, {tipo:'humanitario'}]}
  const grupos=productosDelEM(antiguos)
  assert.equal(grupos[0].filas.find(f=>f.id==='g4:epa').cantidad,1)
  assert.equal(grupos[1].filas.find(f=>f.id==='g1:lineaExtraviados').cantidad,1)
  assert.equal(productoVisible('ejesLog',{}, {'g4:epa':false}),false)
  assert.equal(productoVisible('lineasEM',{}, {'g1:lineaExtraviados':false}),false)
  assert.equal(productoVisible('lineasEM',{tipo:'humanitario'}, {'g1:lineaExtraviados':false}),true)
})
