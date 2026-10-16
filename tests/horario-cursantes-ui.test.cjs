const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup(tipo){
 let oldCalls=0,publishedCalls=0;
 const button={style:{display:''},className:'',textContent:'',onclick:null};
 const screen={querySelector:sel=>sel==='.plc-published-button'?button:null};
 const c={window:null,currentUser:{id:'A1'},getSession:()=>({tipo}),showScreen(){},goHorarios(){oldCalls++;},document:{querySelector:()=>null,getElementById:id=>id==='screen-horarios'?screen:null}};
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('assets/horario-publicado.js','utf8'),c);
 const realPublicados=c.plcPublicadosAbrir;
 c.plcPublicadosAbrir=()=>{publishedCalls++;};
 return {c,button,realPublicados,old:()=>oldCalls,published:()=>publishedCalls};
}
test('student weekly schedule opens the uploaded schedule list',()=>{const s=setup('cursante');s.c.goHorarios();assert.equal(s.old(),1);assert.equal(s.published(),0);assert.equal(s.button.style.display,'none');});
test('student cannot open the published schedule dialog',async()=>{const s=setup('cursante');await s.realPublicados();assert.equal(s.old(),1);});
test('staff retains existing schedule archive navigation',()=>{const s=setup('docente');s.c.goHorarios();assert.equal(s.old(),1);assert.equal(s.published(),0);assert.equal(s.button.style.display,'');});
