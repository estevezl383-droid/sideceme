const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const ctx={EEM:{panel:{carpeta:{},roster:[]}},esc:String,dec2:v=>Number(v).toFixed(2),nom:r=>r.nombre_completo,rotuloGrupo:(n,s)=>s||n,fechaHora:String,pasaFiltro:()=>true,barraFiltros:()=>'',eemPesos:()=>({texto:63,EXPOSICION:37}),kb:()=>'',eemMaterialHTML:()=>''};vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('function vistaPorAlumno(){'),html.indexOf('/* ── CONFIGURACIÓN',html.indexOf('function vistaPorAlumno(){'))),ctx);
vm.runInContext(html.slice(html.indexOf('function tarjetaAlumno('),html.indexOf('/* ── el diálogo de entrega',html.indexOf('function tarjetaAlumno('))),ctx);
test('cada fila muestra su escrito con banda y los límites 63/37',()=>{
 ctx.EEM.panel.roster=[{nombre_completo:'Alumno de prueba',grupo_id:'g',grupo_numero:6,grupo_nombre:'A · Grupo 6',escrito:{nota:60.8571,maximo:63}},{nombre_completo:'Sin evaluar',grupo_id:'otro'}];
 const out=ctx.vistaPorAlumno();assert.match(out,/60.86 \/ 63/);assert.match(out,/Con banda aplicada/);assert.match(out,/Escrito \/ 63/);assert.match(out,/Exposición \/ 37/);assert.match(out,/Pendiente/);assert.doesNotMatch(out,/Texto 65/);
});
test('alumno ve el escrito publicado separado de exposición y final pendientes',()=>{
 const x={carpeta:{materia_nombre:'PROYECTOS',estado:'abierta',pesos:{texto:63,EXPOSICION:37}},grupo:{numero:6,nombre:'A · Grupo 6'},integrantes:[],intentos:[],escrito:{nota:60.8571,maximo:63}};
 const out=ctx.tarjetaAlumno(x,0);assert.match(out,/Resultado del trabajo escrito/);assert.match(out,/60.86 \/ 63/);assert.match(out,/Exposición: pendiente/);assert.doesNotMatch(out,/Nota publicada/);
 delete x.escrito;assert.doesNotMatch(ctx.tarjetaAlumno(x,0),/Resultado del trabajo escrito/);
});
