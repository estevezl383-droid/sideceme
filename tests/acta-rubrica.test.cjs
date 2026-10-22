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
test('cohorte Proyectos: 54→58, 62.75→63, 18 totales, acta y exposición coherentes',()=>{
 const brutos=[61.5,61.75,55.25,60.5,61.5,59,54,57.75,62.25,57.5,58.25,62.25,61.75,59,62.75,57.25,61.5,59.5];
 const b={activa:true,aplicar_a:'texto_65',modo:'reescalado',nota_minima:58,nota_maxima:63,bruta_minima:54,bruta_maxima:62.75};
 for(const bruto of brutos){
  const a=acta();a.banda=b;
  const valores=[1,2,1,1,1,2,2,2,2,3,3,3,3,1,6,5,5,4,2,3,3,2,3,1,2];
  a.forma=valores.slice(0,2).map(valor_pct=>({valor_pct,nota:valor_pct*bruto/63}));
  a.fondo=valores.slice(2).map(valor_pct=>({valor_pct,nota:valor_pct*bruto/63}));
  const originales=JSON.stringify([a.forma,a.fondo]);
  ctx.actPromediosEvaluadores(a);ctx.actEscalaProyectos(a);
  const esperado=Number((58+(bruto-54)*5/8.75).toFixed(4));
  assert.equal(a.totales.texto_65,esperado);
  assert.equal(Math.round((a.totales.forma_acta+a.totales.fondo_acta)*10000)/10000,esperado);
  for(const i of [...a.forma,...a.fondo])assert.ok(i.nota_acta>=0&&i.nota_acta<=i.valor_pct);
  assert.equal(a.cursantes[0].final_100,Number((esperado+35).toFixed(4)));
  ctx.actPromediosEvaluadores(a);ctx.actEscalaProyectos(a);assert.equal(a.totales.texto_65,esperado);
  for(const i of [...a.forma,...a.fondo])delete i.nota_acta;
  assert.equal(JSON.stringify([a.forma,a.fondo]),originales);
 }
 assert.equal(ctx.eemNotaBanda(54,63,b),58);assert.equal(ctx.eemNotaBanda(62.75,63,b),63);
 assert.throws(()=>ctx.eemNotaBanda(54,63,{...b,bruta_maxima:null}),/extremos/);
});
