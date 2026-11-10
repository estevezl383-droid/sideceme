const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('function _wgBatallaFormacion('),html.indexOf('// El dibujo de las trazadoras'));
function entorno(){
  const ctx=vm.createContext({WG:{teatro:true},WG_CONTACTO_MAX:12,_wgCorre:()=>true,_wgHumo:()=>({pares:new Map()})});
  vm.runInContext(source,ctx);return ctx;
}
test('la correlación del encuentro prevalece sobre las fichas principales',()=>{
 const c=entorno();const f=c._wgBatallaFormacion({poder_actual:20,escalon:'cuerpo'},{poder_actual:80,escalon:'cuerpo'},{ratio:3});
 assert.equal(f[0].n,96);assert.equal(f[1].n,32);
 assert.equal(f[0].divisiones.map(d=>d.n).join(','),'32,32,32');
 assert.equal(f[1].divisiones.map(d=>d.n).join(','),'11,11,10');
});
test('cada cuerpo muestra tres divisiones y exactamente una mecanizada',()=>{
 const c=entorno();const f=c._wgBatallaFormacion({poder_actual:20,escalon:'cuerpo'},{poder_actual:80,escalon:'cuerpo'},{});
 assert.equal(f[0].n,24);assert.equal(f[1].n,96);
 for(const lado of f){
   assert.equal(lado.divisiones.length,3);
   assert.equal(lado.divisiones.map(d=>d.mecanizada).join(','),'false,true,false');
 }
});
test('los demás escalones conservan el tipo de medio en todos sus bloques',()=>{
 const c=entorno();const f=c._wgBatallaFormacion({poder_actual:20,medio:'oruga'},{poder_actual:80},{});
 assert.equal(f[0].n,24);assert.ok(f[0].divisiones.every(d=>d.mecanizada));
});
test('fuerzas desiguales, nulas o ausentes tienen un coste acotado',()=>{
 const c=entorno();for(const r of [0,.001,1,1000,Infinity]){
 const f=c._wgBatallaFormacion({escalon:'cuerpo'},{escalon:'cuerpo'},{ratio:r});
 for(const x of f)assert.ok(x.n>=1&&x.n<=96);
 for(const x of f)assert.equal(x.divisiones.length,3);
 }
});
