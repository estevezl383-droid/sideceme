const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('function actPromediosEvaluadores(acta){'),html.indexOf('\nasync function actaDocx('));
const ctx={};vm.createContext(ctx);vm.runInContext(source,ctx);
function acta(epla=true){
 const forma=epla?[2,2,4]:[5,5,5,5];
 const fondo=epla?[3,2,3,2,5,3,2,3,2,5,5,5,3,4,4,4]:Array(26).fill(45/26);
 return {forma:forma.map((v,i)=>({orden:i+1,valor_pct:v,nota:v*.9})),fondo:fondo.map((v,i)=>({orden:i+1,valor_pct:v,nota:v*.9})),exposicion:(epla?[2,15,10,10]:[15,10,10]).map(valor_pct=>({valor_pct})),jurados:[1,2,3].map(profesor_id=>({profesor_id})),cursantes:[{texto_65:62,detalle_evaluadores:[1,2,3].map((profesor_id,i)=>({profesor_id,total:epla?36-i:34-i}))}]};
}
test('EPLA: 3 forma, 16 fondo y exposición sobre 37; suma rúbrica visible',()=>{
 const a=acta();ctx.actPromediosEvaluadores(a);assert.equal(a.totales.forma_20,7.2);assert.equal(a.totales.fondo_45,49.5);assert.equal(a.totales.texto_65,56.7);assert.equal(a.cursantes[0].expo_35,35);assert.equal(a.cursantes[0].final_100,91.7);ctx.actPromediosEvaluadores(a);assert.equal(a.cursantes[0].final_100,91.7);
});
test('EEM: conserva rúbrica 20 + 45 + 35',()=>{const a=acta(false);ctx.actPromediosEvaluadores(a);assert.equal(a.totales.texto_65,58.5);assert.equal(a.cursantes[0].final_100,91.5);});
test('respeta banda vigente del escrito y suma exposición sin volver a ponderar',()=>{
 const a=acta();a.forma=[{valor_pct:8,nota:6.9}];a.fondo=[{valor_pct:55,nota:50.6}];
 a.banda={activa:true,aplicar_a:'texto_65',modo:'reescalado',nota_minima:58,nota_maxima:63};
 a.cursantes[0].detalle_evaluadores.forEach((d,i)=>d.total=[35,36,36][i]);
 ctx.actPromediosEvaluadores(a);
 assert.equal(a.totales.texto_bruta,57.5);assert.equal(a.totales.texto_65,62.5635);
 assert.equal(a.cursantes[0].final_100,98.2302);
 ctx.actPromediosEvaluadores(a);assert.equal(a.cursantes[0].final_100,98.2302);
 a.forma[0].nota=null;ctx.actPromediosEvaluadores(a);assert.equal(a.cursantes[0].final_100,null);
});
test('rechaza exposición que supera máximo real',()=>{for(const epla of [true,false]){const a=acta(epla);a.cursantes[0].detalle_evaluadores[0].total=epla?38:36;assert.throws(()=>ctx.actPromediosEvaluadores(a),/fuera de 0/);}});
test('mantiene pendientes y ausencia autorizada en cero',()=>{
 const a=acta();a.forma[0].nota=null;ctx.actPromediosEvaluadores(a);assert.equal(a.cursantes[0].final_100,null);
 const b=acta();b.cursantes[0].no_expuso=true;b.cursantes[0].decision_ausencia='cero';ctx.actPromediosEvaluadores(b);assert.equal(b.cursantes[0].final_100,56.7);
});
