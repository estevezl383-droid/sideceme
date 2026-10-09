const assert = require('assert');
const path = require('path');
const {vigente} = require('./extraer');
const {cargarConDependencias} = require('./extraer-con-dependencias');
(async () => {
 const mod = await import('../unidades/simbolos-apoyo.mjs');
 const cache = new Map();
 function render(archivo, unidad) {
   if(cache.has(archivo)) {const {S,calls}=cache.get(archivo);calls.length=0;return JSON.parse(JSON.stringify({result:S.sb(unidad),calls}));}
   const calls = [];
   const ctx = new Proxy({}, {get: (_, k) => k === 'measureText' ? text => ({width: String(text).length * 7}) : (...args) => calls.push([k, ...args]), set: (_, k, v) => {calls.push(['set',k,v]);return true;}});
   const document = {createElement: () => ({getContext: () => ctx, toDataURL: () => 'data:image/png;test'})};
   const S = cargarConDependencias(archivo, ['sb','Zfe','Wfe','Xfe','Ni','h8'], c => c.sb(unidad), {document,SIDApoyo:mod.dibujarApoyo,SIDAnchoNumero:mod.anchoNumero});
   cache.set(archivo,{S,calls});
   calls.length=0;
   return JSON.parse(JSON.stringify({result:S.sb(unidad), calls}));
 }
 const base=path.join(__dirname,'../assets/index-areas-20261009.js');
 for (const arma of ['ametralladoras','morteros','lanzacohetes','antitanque']) {
   for (const escalon of ['seccion','compania','batallon','regimiento']) {
     const u={bando:'propias',tipo:'unidad',arma,escalon,numeroUnidad:'100',circuloSimbolo:true};
     const r=render(vigente(),u);
     assert(r.calls.some(c=>c[0]==='fillText'&&c[1]==='100'));
     assert(!r.calls.some(c=>c[0]==='fillText'&&['AM','MORT','LC','AT'].includes(c[1])));
     assert(r.result.w>72);
   }
   const u={bando:'enemigo',tipo:'unidad',arma,escalon:'batallon'};
   assert.deepStrictEqual(render(vigente(),u),render(base,u));
 }
 for(const tipo of ['unidad','instalacion','pc']) {
   const u={bando:'propias',tipo,arma:'infanteria',escalon:'regimiento'};
   assert.deepStrictEqual(render(vigente(),u),render(base,u));
 }
 const text=render(vigente(),{bando:'propias',arma:'ninguna',escalon:'regimiento',textoSimbolo:'SAT.MONT.',numeroUnidad:'90'});
 assert(text.calls.some(c=>c[0]==='fillText'&&c[1]==='SAT.MONT.'));
 console.log('16 combinaciones azules; enemigo y otras unidades idénticos; texto y número lateral: OK');
})().catch(e=>{console.error(e);process.exit(1)});
