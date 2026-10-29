import {test} from 'node:test'
import assert from 'node:assert/strict'
import {AREAS_INTERNAS,sectoresRepresentados,mostrarSoloAreas,productoVisible,productosDelEM,unidadesProductos} from '../visibilidad/v1/productos-em.mjs'

const contorno=[[0,0],[1,0],[1,1],[0,1]]
const crear=(_coords,{area,sectores})=>({sectores:sectores.map(sector=>({sector,areaLog:area,coords:contorno,nombre:AREAS_INTERNAS.find(a=>a.id===sector).nombre})),unidades:[{id:'no-se-debe-incorporar'}]})
test('las cuatro áreas coinciden con los servicios de la plantilla de la aplicación',()=>{
  assert.deepEqual(AREAS_INTERNAS.map(a=>a.nombre),['Sanidad','Abastecimiento','Mantenimiento','Personal'])
  assert.deepEqual(AREAS_INTERNAS.map(a=>a.id),['sanidad','abast','mant','personal'])
})
test('ASDI y ARCE muestran cuatro sectores sin crear instalaciones ni guardar geometrías',()=>{
  const ops={zonasLog:[{zona:'asdi',clave:'a',coords:contorno},{zona:'arce',clave:'b',coords:contorno}],sectoresLog:[]}
  const antes=JSON.stringify(ops),s=sectoresRepresentados(ops,crear)
  assert.equal(s.length,8);assert.ok(s.every(x=>x.soloVista))
  assert.equal(sectoresRepresentados(ops,crear),s,'el esquema se reutiliza al cambiar los ojos')
  assert.equal(JSON.stringify(ops),antes)
  assert.equal(productosDelEM(ops,[],[],crear)[0].filas.find(f=>f.id==='g4:sectores').cantidad,8)
})
test('los sectores guardados conservan su índice y no se duplican',()=>{
  const guardado={sector:'sanidad',areaLog:'a',coords:contorno,nombre:'Sanidad propia'}
  const ops={zonasLog:[{zona:'asdi',clave:'a',coords:contorno}],sectoresLog:[guardado]}
  const s=sectoresRepresentados(ops,crear)
  assert.equal(s.length,4);assert.equal(s[0],guardado)
  assert.equal(s.filter(x=>x.sector==='sanidad').length,1)
  assert.ok(s.slice(1).every(x=>x.soloVista))
})
test('el esquema respeta los ojos del área y de sectores',()=>{
  const ops={zonasLog:[{zona:'arce',clave:'b',coords:contorno}],sectoresLog:[]}
  const s=sectoresRepresentados(ops,crear)[0]
  assert.equal(productoVisible('sectoresLog',s,{'zonasLog:arce':false},ops),false)
  assert.equal(productoVisible('sectoresLog',s,{'g4:sectores':false},ops),false)
  assert.equal(productoVisible('sectoresLog',s,{},ops),true)
})
test('sólo áreas oculta también las instalaciones de personal dentro del ASDI, conservando las externas',()=>{
  const ops={zonasLog:[{zona:'asdi',clave:'a',coords:contorno}]}
  const us=[{id:'san',instalacion:'pced',areaLog:'a'},{id:'personal',instalacion:'p_ppgg',areaLog:'a'},
    {id:'externa',instalacion:'p_ppgg'},{id:'unidad',tipo:'unidad'}]
  const ver=mostrarSoloAreas({zonasLog:false,'g4:epa':false})
  assert.equal(ver['g4:sectores'],true);assert.equal(ver['g4:epa'],false)
  assert.deepEqual(unidadesProductos(us,ops,ver,[{id:'pced',grupo:'sanidad'}]).map(u=>u.id),['externa','unidad'])
})
