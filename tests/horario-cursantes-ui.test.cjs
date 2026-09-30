const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup(tipo){
 let oldCalls=0,publishedCalls=0;
 const c={window:null,currentUser:{id:'A1'},getSession:()=>({tipo}),showScreen(){},goHorarios(){oldCalls++;},document:{querySelector:()=>null,getElementById:()=>null}};
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('assets/horario-publicado.js','utf8'),c);
 c.plcPublicadosAbrir=()=>{publishedCalls++;};
 return {c,old:()=>oldCalls,published:()=>publishedCalls};
}
test('student weekly schedule opens published schedule directly',()=>{const s=setup('cursante');s.c.goHorarios();assert.equal(s.published(),1);assert.equal(s.old(),0);});
test('staff retains existing schedule archive navigation',()=>{const s=setup('docente');s.c.goHorarios();assert.equal(s.old(),1);assert.equal(s.published(),0);});
