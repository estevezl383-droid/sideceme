// Reemplazos del 2026-10-12 sobre calcos/assets/index-seleccion-20261011.js →
// index-abrir-20261012.js. Lo pidió Sergio (Profesor) con tres capturas (la Mesa con la
// selección CE-I, la ventana 📁 Ejercicios y la carpeta de Descargas con Seleccion_CE-I.json):
//   · «no puedo abrir el área que seleccioné ni recorté… no se proyecta en el mapa»;
//   · «quiero que cuando baje el área pueda abrirla en la aplicación: lo está abriendo con otra
//     aplicación (Visual Studio Code)»;
//   · «en 📁 Ejercicios debería haber una opción también de abrir un archivo JSON».
//
// Qué se lee del archivo y cómo se arma el ejercicio está en
// calcos/areas-operaciones/abrir-archivo.mjs (código legible); acá sólo:
//   · el import de abrir-archivo.mjs y el editor de áreas con la versión nueva (su aviso al
//     bajar el JSON dice cómo se abre);
//   · 📁 Ejercicios (JSe) muestra «📂 Abrir archivo JSON (selección, áreas o ejercicio)» en
//     «Actual» (debajo de «＋ Nuevo ejercicio») y arriba de «Abrir guardados»;
//   · la Mesa lo abre como ejercicio NUEVO (SIDabrirArchivo): pregunta el nombre (propone el de
//     la selección, «CE-I»; si ya existe, «CE-I (2)»), lo crea y lo guarda con el área, lo de
//     adentro, el CMOC y los documentos, lo abre como un guardado (mm) y lleva la carta a su
//     área. El ejercicio que estaba abierto no se toca.
const V = '?v=abrir20261012'
module.exports = [
  {
    nombre: 'Áreas · editor con versión nueva y el módulo para abrir el JSON',
    viejo: 'import SIDAreasEditor from "../areas-operaciones/editor.mjs?v=seleccion20261011";',
    nuevo: `import SIDAreasEditor from "../areas-operaciones/editor.mjs${V}";import {ejercicioDeArchivo as SIDEjercicioDeArchivo,nombreLibre as SIDNombreLibre,encuadrar as SIDEncuadrar,LIMITE_BYTES as SIDLimiteArchivo} from "../areas-operaciones/abrir-archivo.mjs${V}";`,
    veces: 1,
  },
  {
    nombre: '📁 Ejercicios · recibe cómo abrir un archivo',
    viejo: 'function JSe({onIntegrarCapa:t,disponible:e,actual:n,finalizado:a,onCrear:i,onGuardar:o,onFinalizar:s,onDuplicar:r,onAbrir:u,onRecuperar:h,onRevelar:y,onCerrar:g,aporte:v=null}){const[x,E]=je.useState("inicio"),',
    nuevo: 'function JSe({onIntegrarCapa:t,disponible:e,actual:n,finalizado:a,onCrear:i,onGuardar:o,onFinalizar:s,onDuplicar:r,onAbrir:u,onRecuperar:h,onRevelar:y,onCerrar:g,aporte:v=null,onAbrirArchivo:SIDab}){const SIDarch=je.useRef(null),[SIDocupado,SIDsetOcupado]=je.useState(!1),[x,E]=je.useState("inicio"),',
    veces: 1,
  },
  {
    nombre: '📁 Ejercicios · el botón «📂 Abrir archivo JSON» (y su aviso)',
    viejo: 'await h?.(se)&&g()};return f.jsxs("div",{className:"sid-inicio-ejercicio",style:or.panel,children:[',
    nuevo: 'await h?.(se)&&g()},SIDelegirArchivo=async se=>{const SIDf=se.target.files?.[0];se.target.value="";if(!SIDf||!SIDab)return;SIDsetOcupado(!0),B(`⏳ Abriendo «${SIDf.name}»…`);let SIDr;try{SIDr=await SIDab(SIDf)}catch(SIDe){SIDr={ok:!1,error:String(SIDe?.message||SIDe)}}SIDsetOcupado(!1),B(SIDr?.ok===!1?`✗ ${SIDr.error}`:"")},SIDboton=f.jsxs(f.Fragment,{children:[f.jsx("button",{style:{...or.btnNuevo,color:"#a9ffcf",borderColor:"#39d98a"},disabled:SIDocupado,title:"La selección guardada (Seleccion_….json), las áreas (AO_….json) o un ejercicio (EJERCICIO_….json): se abre como ejercicio nuevo y la carta va a su área",onClick:()=>SIDarch.current?.click(),children:SIDocupado?"⏳ Abriendo el archivo…":"📂 Abrir archivo JSON (selección, áreas o ejercicio)"}),f.jsx("input",{ref:SIDarch,type:"file",accept:".json,application/json","aria-label":"Archivo JSON para abrir",style:{display:"none"},onChange:SIDelegirArchivo}),f.jsx("div",{style:or.nota,children:"El JSON que bajó la Mesa se abre acá, no con doble clic (la computadora lo manda a otro programa). Se abre como ejercicio NUEVO y la carta va a su área: el que tenés abierto no se toca."})]});return f.jsxs("div",{className:"sid-inicio-ejercicio",style:or.panel,children:[',
    veces: 1,
  },
  {
    nombre: '📁 Ejercicios · «Actual»: debajo de «＋ Nuevo ejercicio»',
    viejo: 'f.jsx("button",{style:or.btnNuevo,onClick:re,children:"＋ Nuevo ejercicio (en blanco)"}),',
    nuevo: 'f.jsx("button",{style:or.btnNuevo,onClick:re,children:"＋ Nuevo ejercicio (en blanco)"}),SIDboton,',
    veces: 1,
  },
  {
    nombre: '📁 Ejercicios · «Abrir guardados»: arriba de la lista',
    viejo: 'x==="abrir"&&f.jsxs(f.Fragment,{children:[f.jsx("div",{style:or.subtitulo,children:"Ejercicios guardados"}),',
    nuevo: 'x==="abrir"&&f.jsxs(f.Fragment,{children:[SIDboton,f.jsx("div",{style:or.subtitulo,children:"Ejercicios guardados"}),',
    veces: 1,
  },
  {
    nombre: 'Mesa · abre el JSON como ejercicio nuevo y lleva la carta a su área',
    viejo: ',xC=je.useCallback(async Ee=>{const Qe=await og.crear(Ee);',
    nuevo: ',SIDabrirArchivo=je.useCallback(async SIDf=>{if(!SIDf)return{ok:!1,error:"No se eligió ningún archivo."};if(SIDf.size>SIDLimiteArchivo)return{ok:!1,error:`«${SIDf.name}» es demasiado grande (más de 60 MB).`};let SIDj;try{SIDj=JSON.parse(await SIDf.text())}catch{return{ok:!1,error:`«${SIDf.name}» no es un JSON válido.`}}const SIDr=SIDEjercicioDeArchivo(SIDj,{archivo:SIDf.name,opsVacias:Vt,cmocVacio:an});if(!SIDr.ok)return SIDr;if(vS(SIDr.datos))return{ok:!1,error:`«${SIDf.name}» no trae nada para la carta.`};const SIDls=await og.listar(),SIDns=Array.isArray(SIDls)?SIDls.map(SIDx=>SIDx.nombre):[],SIDp=window.prompt(`Se abre «${SIDf.name}» como ejercicio NUEVO (${SIDr.resumen}). El que tenés abierto no se toca.\n\nNombre del ejercicio nuevo:`,SIDNombreLibre(SIDr.nombre,SIDns));if(SIDp===null||!SIDp.trim())return{ok:!0,cancelado:!0};const SIDnom=tm(SIDp);if(SIDns.some(SIDx=>String(SIDx||"").toLowerCase()===SIDnom.toLowerCase()))return{ok:!1,error:`Ya existe un ejercicio llamado «${SIDnom}»: volvé a abrir el archivo y ponele otro nombre.`};const SIDc=await og.crear(SIDnom);if(SIDc?.ok===!1)return{ok:!1,error:`No se creó «${SIDnom}»: ${SIDc.error||""}`};const SIDvn=SIDc?.nombre||SIDnom,SIDd={...SIDr.datos,nombre:SIDvn},SIDg=await og.guardar(SIDvn,SIDd);if(SIDg?.ok===!1)return{ok:!1,error:`«${SIDvn}» se creó pero no se pudo guardar: ${SIDg.error||""}`};Av(),mm(SIDd,SIDvn,!1),setTimeout(()=>SIDEncuadrar(SIDr.coords),450),za(`📂 «${SIDvn}» abierto: ${SIDr.resumen}.`);return{ok:!0,nombre:SIDvn}},[Av,mm]),xC=je.useCallback(async Ee=>{const Qe=await og.crear(Ee);',
    veces: 1,
  },
  {
    nombre: 'Mesa · le pasa a 📁 Ejercicios cómo abrir el archivo',
    viejo: 'onAbrir:Qu,onRevelar:async Ee=>{const Qe=await og.revelar(Ee);',
    nuevo: 'onAbrir:Qu,onAbrirArchivo:SIDabrirArchivo,onRevelar:async Ee=>{const Qe=await og.revelar(Ee);',
    veces: 1,
  },
]
