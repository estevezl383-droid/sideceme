// Reemplazos limitados, verificables y reversibles sobre el compilado vigente.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto')
const carpeta=path.resolve(__dirname,'..'), original=path.join(carpeta,'assets/index-zhbwncsH.js')
const destino=path.join(carpeta,'assets/index-conceptos-20260928.js')
const cambios=[
 ['var ehe=Object.defineProperty,', 'import SIDEditorConceptos from "../conceptos/editor.js";import {configurarConceptos} from "../conceptos/runtime.js";import {conceptosHTML as SIDConceptosHTML} from "../conceptos/modelo.js";import {descargarConceptosWord as SIDConceptosWord} from "../conceptos/word.js";var ehe=Object.defineProperty,'],
 ['responsable:"Cmte. — participa todo el EM",tipo:"tabla",cols:', 'responsable:"Cmte. — participa todo el EM",tipo:"conceptos",cols:'],
 ['autollena:"entrelazados",nota:', 'conceptosGrafico:!0,nota:'],
 ['const v=e||(["filas","matriz"].includes(t.tipo)?[]:{});if(t.tipo==="tiempo")', 'const v=e||(["filas","matriz"].includes(t.tipo)?[]:{});if(t.tipo==="conceptos")return f.jsx(SIDEditorConceptos,{valor:e,onValor:o});if(t.tipo==="tiempo")'],
 ['function ED(t,e={},n={}){const a=e||{}', 'function ED(t,e={},n={}){if(t.tipo==="conceptos")return SIDConceptosHTML(e);const a=e||{}'],
 ['if(!t||["tiempo","remite","lineaTiempo"].includes(t.tipo))', 'if(!t||["tiempo","remite","lineaTiempo","conceptos"].includes(t.tipo))'],
 ['async function Aoe(t,e,n={},a={}){const i=VM(t);', 'async function Aoe(t,e,n={},a={}){if(t==="entrelazados"){await SIDConceptosWord(e);return true}const i=VM(t);'],
 ['async function Coe(t,e,n={},a={}){if(!t)return!1;', 'async function Coe(t,e,n={},a={}){if(t?.tipo==="conceptos"){await SIDConceptosWord(e);return true}if(!t)return!1;'],
 ['!HS.includes(Ke.id)&&f.jsxs(f.Fragment', 'Ke.tipo!=="conceptos"&&!HS.includes(Ke.id)&&f.jsxs(f.Fragment'],
 ['entrelazados:{para:"Sirve para ubicarse: qué quiere el que está arriba (dos niveles) y qué hacen los de al lado. Sin esto se planifica en una isla.",como:["Se llena leyendo la Orden del escalón superior, no de memoria.","Va la intención del Comandante superior TEXTUAL: es lo que no se puede desvirtuar.","Anotá también las unidades de vanguardia y retaguardia: su misión te condiciona el movimiento.","Cerrá con la relación: cómo lo tuyo sostiene el plan del comando superior."],ejemplo:"Si tu unidad es un Batallón, van dos niveles: Cuerpo de Ejército-I (misión e intención) y Div-1 (misión e intención)."}', 'entrelazados:{para:"Hoja gráfica con relaciones verticales y horizontales, tarea y propósito por unidad.",como:["Identifique los dos escalones superiores según el ejercicio.","Registre la unidad propia, maniobra, apoyo de combate y SPAC con magnitud y denominación.","Transcriba tarea y propósito; agregue fases cuando estén definidas.","Declare las relaciones directas e indirectas.","El texto anterior se conserva en el formulario."],ejemplo:"T = tarea. P = propósito. Los campos sin información muestran SIN DATO."}'],
 ['window.__mesaSimbolos={sb,eN,cb,VK,pLe,fl,T1,Nm,zg,lP,tN,js};t6.createRoot', 'window.__mesaSimbolos={sb,eN,cb,VK,pLe,fl,T1,Nm,zg,lP,tN,js};configurarConceptos({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,Document:A5e,Packer:loe,Paragraph:Js,ImageRun:kPe,PageOrientation:GD});t6.createRoot']
]
const sha=s=>crypto.createHash('sha256').update(s).digest('hex')
const aplicar=(s,lista)=>{for(const [antes,despues] of lista){const n=s.split(antes).length-1;if(n!==1)throw new Error(`Se esperó una coincidencia, hubo ${n}: ${antes.slice(0,90)}`);s=s.replace(antes,despues)}return s}
function construir(){const base=fs.readFileSync(original,'utf8');const nuevo=aplicar(base,cambios);if(aplicar(nuevo,[...cambios].reverse().map(([a,b])=>[b,a]))!==base)throw new Error('Reversión diferente al original');fs.writeFileSync(destino,nuevo);console.log('Compilado original conservado:',sha(base));console.log('Compilado con integración:',sha(nuevo));}
if(require.main===module)construir()
module.exports={cambios,aplicar,construir}
