// Reemplazos hechos el 2026-10-01 sobre el compilado de la Mesa del EM
// (calcos/assets/index-oca-militar-20261001.js → index-reconocimiento-20261001.js).
// Los pidió Sergio con el Word de la F2·P9 que sacaba la Mesa (una matriz de renglones
// metida en un modelo ajeno, todo lo demás «[Pendiente de elaboración]» y firmado «EL G-3
// DE LA UNIDAD») y el ejemplo de la Escuela «06. ORDEN DE RECONOCIMIENTO» (DIV.MEC.-2):
// la F2·P9 es la ORDEN completa, con OBJETO, CARTA y ANEXOS, el cuadro de ORGANIZACIÓN DE
// LA TAREA (equipos ZULU, TANGO, VICTOR…) y los párrafos I a V, con el membrete de los
// demás documentos.
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer
// «veces» veces) y se cambió por «nuevo». construir-reconocimiento.js arma el compilado y
// comprueba que deshaciéndolos se vuelve byte por byte al anterior.
// Si se vuelve a compilar desde el fuente, esto es lo que hay que pasarle.
//
// La hoja vive en archivos legibles aparte (calcos/reconocimiento/v1/, ver su README).
// Acá sólo:
//   · se importan los módulos de calcos/reconocimiento/v1/ y la vista previa del formato
//     militar (formato-militar/v1/runtime.js, nueva versión «reco20261001»);
//   · la F2·P9 del G-3 pasa a ser del tipo «reconocimiento» (sin la siembra genérica de
//     renglones: el editor trae la suya, con los mismos órganos del calco);
//   · el Tablero del G-3 monta el editor de la orden (con el ejercicio y el expediente)
//     en lugar del editor de renglones, sin los botones genéricos ni el panel de IA de
//     renglones (el editor trae los suyos: el mismo panel de IA de la Mesa);
//   · el expediente, la carpeta del G-3 y el conteo de documentos leen la orden;
//   · lo que otros pedidos a la IA traigan para esta hoja se AGREGA a la orden;
//   · cualquier otra salida a Word de la F2·P9 usa la misma orden (no la matriz);
//   · la guía «¿Para qué es y cómo se llena?» de la hoja;
//   · configurarReconocimiento() le presta React, el panel de IA (hU), el encabezado de los
//     pedidos (Qq), el corrector (uU), la siembra con el calco (l3e) y el Word militar
//     (Mx, SIDMilHoja, SIDMilVista, SIDMilMostrar).
module.exports = [
  {
    nombre: 'Reconocimiento · módulos de la orden (calcos/reconocimiento/v1)',
    viejo: 'import {fusionable as SIDRiesgoFusionable,fusionarRiesgo as SIDRiesgoFusionar} from "../riesgo/v1/ia.js";',
    nuevo:
      'import {fusionable as SIDRiesgoFusionable,fusionarRiesgo as SIDRiesgoFusionar} from "../riesgo/v1/ia.js";import SIDEditorReco from "../reconocimiento/v1/editor.js";import {configurarReconocimiento} from "../reconocimiento/v1/runtime.js";import {ordenHTML as SIDRecoHTML,especificacionOrden as SIDRecoSpec} from "../reconocimiento/v1/documento.js";import {textoOrden as SIDRecoTexto,tieneOrden as SIDRecoTiene} from "../reconocimiento/v1/modelo.js";import {fusionable as SIDRecoFusionable,fusionarOrden as SIDRecoFusionar} from "../reconocimiento/v1/ia.js";',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · la vista previa del Word militar',
    viejo: 'exportarDirecto as SIDMilDirecto,',
    nuevo: 'exportarDirecto as SIDMilDirecto,vistaMilitar as SIDMilVista,mostrarDocx as SIDMilMostrar,',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · nueva versión del formato militar (estructura propia, cuadro e incisos)',
    viejo: 'from "../formato-militar/v1/runtime.js?v=oca20261001";',
    nuevo: 'from "../formato-militar/v1/runtime.js?v=reco20261001";',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · la F2·P9 es la orden completa (tipo «reconocimiento»)',
    viejo:
      '{id:"ivr",num:"F2·P9",nom:"Orden de Reconocimiento",entrega:"Se difunde · incluye matriz de asignación de tareas, calco y plan de apoyo",responsable:"G-3 con el G-2",tipo:"filas",cols:["Órgano de reconocimiento","Tarea","Área / objetivo a reconocer","Alcance del medio","No antes de","No después de","Dónde informa"],autollena:"ivr",nota:"Es EL documento donde entran los alcances: cada órgano llega hasta donde llega. Se siembra con las unidades de reconocimiento del calco y su alcance del reglamento."}',
    nuevo:
      '{id:"ivr",num:"F2·P9",nom:"Orden de Reconocimiento",entrega:"Se difunde · organización de la tarea, tareas por equipo, plazos, apoyo y comunicaciones (con su calco)",responsable:"G-3 con el G-2",tipo:"reconocimiento",nota:"Es LA ORDEN completa, con la forma de la Escuela y el membrete de los demás documentos: OBJETO, CARTA y ANEXOS; el cuadro de ORGANIZACIÓN DE LA TAREA y los párrafos I a V. Los alcances siguen acá: cada equipo llega hasta donde llega su medio. Se siembra con las unidades de reconocimiento del calco."}',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · no es una hoja de renglones para el panel genérico de IA',
    viejo: '["tiempo","remite","lineaTiempo","conceptos","riesgo"].includes(t.tipo)',
    nuevo: '["tiempo","remite","lineaTiempo","conceptos","riesgo","reconocimiento"].includes(t.tipo)',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · sin los botones genéricos «Vista previa / Word» (el editor trae los suyos)',
    viejo: 'Ke.tipo!=="conceptos"&&Ke.tipo!=="riesgo"&&!HS.includes(Ke.id)&&',
    nuevo: 'Ke.tipo!=="conceptos"&&Ke.tipo!=="riesgo"&&Ke.tipo!=="reconocimiento"&&!HS.includes(Ke.id)&&',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · el Tablero del G-3 monta el editor de la orden con el ejercicio y el expediente',
    viejo: 'Ke.tipo==="riesgo"?f.jsx(SIDEditorRiesgo,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ctx:{...I,unidades:t,orgTarea:a,g3:M,documentos:U?.documentos||[]},onExpediente:j},Ke.id):',
    nuevo:
      'Ke.tipo==="riesgo"?f.jsx(SIDEditorRiesgo,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ctx:{...I,unidades:t,orgTarea:a,g3:M,documentos:U?.documentos||[]},onExpediente:j},Ke.id):Ke.tipo==="reconocimiento"?f.jsx(SIDEditorReco,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ctx:{...I,unidades:t,orgTarea:a,g3:M,documentos:U?.documentos||[]},onExpediente:j},Ke.id):',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · fuera del Tablero, el editor recibe lo que tenga',
    viejo: 'if(t.tipo==="riesgo")return f.jsx(SIDEditorRiesgo,{hoja:t,valor:e,onValor:o,ctx:{ordenSup:r,documentos:u,g3:h}});',
    nuevo: 'if(t.tipo==="riesgo")return f.jsx(SIDEditorRiesgo,{hoja:t,valor:e,onValor:o,ctx:{ordenSup:r,documentos:u,g3:h}});if(t.tipo==="reconocimiento")return f.jsx(SIDEditorReco,{hoja:t,valor:e,onValor:o,ctx:{ordenSup:r,documentos:u,g3:h}});',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · en el expediente (y en los pedidos de las otras hojas) va como texto',
    viejo: 'if(t?.tipo==="riesgo")return SIDRiesgoTexto(e);',
    nuevo: 'if(t?.tipo==="riesgo")return SIDRiesgoTexto(e);if(t?.tipo==="reconocimiento")return SIDRecoTexto(e);',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · la carpeta del G-3 lleva la orden (la carpeta ya tiene membrete y título por hoja)',
    viejo: 'if(t.tipo==="riesgo")return SIDRiesgoHTML(e,{hoja:t,ctx:n});',
    nuevo: 'if(t.tipo==="riesgo")return SIDRiesgoHTML(e,{hoja:t,ctx:n});if(t.tipo==="reconocimiento")return SIDRecoHTML(e,{ctx:n});',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · «documentos con contenido»: la orden cuenta si tiene contenido',
    viejo: 'hechas:a.hojas.filter(i=>i.tipo==="riesgo"?SIDRiesgoTiene(t[i.id]):e(t[i.id])).length',
    nuevo: 'hechas:a.hojas.filter(i=>i.tipo==="riesgo"?SIDRiesgoTiene(t[i.id]):i.tipo==="reconocimiento"?SIDRecoTiene(t[i.id]):e(t[i.id])).length',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · lo que otros pedidos a la IA traen para la orden se agrega (no la reemplaza)',
    viejo: 'if(SIDRiesgoFusionable(o,r,s)){const q=SIDRiesgoFusionar(r,s,{pisar:n});a[o]=q.valor,i+=q.n;continue}',
    nuevo: 'if(SIDRiesgoFusionable(o,r,s)){const q=SIDRiesgoFusionar(r,s,{pisar:n});a[o]=q.valor,i+=q.n;continue}if(SIDRecoFusionable(o,r,s)){const q=SIDRecoFusionar(r,s,{pisar:n});a[o]=q.valor,i+=q.n;continue}',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · Word de la F2·P9 desde la lista de documentos: la orden completa',
    viejo: 'const o=i.id==="ivr"?(T3e(i,e||{})||Jq(i,e||{})):Jq(i,e||{});if(!o)return!1;const s={...rP(i,n),secciones:o},r=',
    nuevo:
      'if(i.id==="ivr")return SIDRecoTiene(e)?(await Mx(SIDRecoSpec(e,{ctx:n}),`${(i.num||"").replace(/[^A-Za-z0-9]+/g,"")}_Orden_de_Reconocimiento`,{ctx:n,registro:SIDMilHoja(i,n)}),!0):!1;const o=i.id==="ivr"?(T3e(i,e||{})||Jq(i,e||{})):Jq(i,e||{});if(!o)return!1;const s={...rP(i,n),secciones:o},r=',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · Word de la F2·P9 desde las hojas de cada sección: la orden completa',
    viejo: 'if(t.tipo==="pbi"){const r=rP(t,n),u=oIe(e,{...n,firma:r.firma},r.membrete,r.clasificacion);',
    nuevo: 'if(t.id==="ivr")return SIDRecoTiene(e)?(await Mx(SIDRecoSpec(e,{ctx:n}),i,{ctx:n,registro:SIDMilHoja(t,n)}),!0):!1;if(t.tipo==="pbi"){const r=rP(t,n),u=oIe(e,{...n,firma:r.firma},r.membrete,r.clasificacion);',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · guía «¿Para qué es y cómo se llena?» de la F2·P9',
    viejo:
      'ivr:{para:"Es el plan que pone los ojos donde hacen falta ANTES de decidir. Sale del G-3 en coordinación con el G-2 y se va actualizando durante todo el planeamiento.",como:["Un renglón por órgano de reconocimiento: escuadrón, sección, patrulla, dron, radar, observador.","TAREA y ÁREA: qué tiene que averiguar y dónde. Se ata a un vacío de inteligencia del G-2.","ALCANCE: hasta dónde llega ese medio. Si el área a reconocer está más lejos que su alcance, el plan no cierra: hay que adelantarlo o cambiar de medio.","PLAZOS: no antes de / no después de. Y dónde informa.","El reglamento avisa que estos grupos TRATAN DE EVITAR EL COMBATE: el círculo es hasta dónde ven, no hasta dónde pelean."],ejemplo:"RC-02-107: las tropas de reconocimiento del Regimiento obtienen información entre 25 y 30 km adelante de la línea de contacto; las de nivel División, a unos 20 km."}',
    nuevo:
      'ivr:{para:"Es LA ORDEN que pone los ojos donde hacen falta ANTES de decidir. Sale del G-3 en coordinación con el G-2, con la forma de la Escuela y el membrete de los demás documentos, y se va actualizando durante el planeamiento.",como:["ARRIBA: OBJETO (una frase), CARTA y ANEXOS; y el cuadro de ORGANIZACIÓN DE LA TAREA: una columna por EQUIPO (EQ. ZULU, EQ. TANGO, EQ. VICTOR…) con sus elementos (secciones, patrullas, drones, radares, observadores).","I.- SITUACIÓN (enemiga y propia) · II.- MISIÓN: quién, qué, cuándo, dónde y para qué.","III.- EJECUCIÓN: A.- Plan (objetivo general y método) · B.- Tareas para los equipos (forma de llegar a.- b.- c.-; cada equipo con «Obtener información referente a:» y sus guiones, atados a los vacíos de inteligencia del G-2; plazos en tiempo) · C.- Instrucciones de coordinación.","IV.- APOYO DE SERVICIO (abastecimientos y transporte) · V.- COMANDO Y COMUNICACIONES.","ALCANCE: cada equipo llega hasta donde llega su medio; si el área está más lejos, hay que adelantarlo o cambiar de medio. Estos grupos TRATAN DE EVITAR EL COMBATE: el círculo es hasta dónde ven, no hasta dónde pelean.","💡 Escribí CÓMO querés el reconocimiento: la IA lo sigue al pie de la letra. Y cualquier apartado se corrige a mano: lo que escribís vos manda."],ejemplo:"La Orden de Reconocimiento N° 01 de la DIV.MEC.-2 (equipos ZULU, TANGO y VICTOR). RC-02-107: las tropas de reconocimiento del Regimiento obtienen información entre 25 y 30 km adelante de la línea de contacto; las de nivel División, a unos 20 km."}',
    veces: 1,
  },
  {
    nombre: 'Reconocimiento · configurarReconocimiento() con lo que presta la Mesa',
    viejo: 'configurarRiesgo({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useMemo:je.useMemo,PanelIA:hU,encabezadoIA:Qq,corregirIA:uU,lineaDeTiempo:MS});',
    nuevo:
      'configurarRiesgo({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useMemo:je.useMemo,PanelIA:hU,encabezadoIA:Qq,corregirIA:uU,lineaDeTiempo:MS});configurarReconocimiento({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,PanelIA:hU,encabezadoIA:Qq,corregirIA:uU,semilla:l3e,wordMilitar:Mx,registroMilitar:SIDMilHoja,vistaMilitar:SIDMilVista,mostrarDocx:SIDMilMostrar});',
    veces: 1,
  },
]
