// Reemplazos hechos el 2026-09-29 (tercer paso del día) sobre el compilado de la Mesa
// del EM (calcos/assets/index-ucOhdPbL.js → el que carga hoy calcos/index.html).
// Los pidió Sergio con el Word de la F2·P7 que sacaba la Mesa: una lista «A.- Peligro
// identificado: … · Probabilidad: … · Severidad: …», sin membrete y con RESERVADO. La
// hoja es la HOJA DE TRABAJO del RO-06-01-04 «Administración del Riesgo» (Anexo «B»,
// ejemplos en el Anexo «C»): una MATRIZ (A–D, E–J por tarea y obstáculo, K), con el
// membrete táctico en Arial 10 negrilla, SECRETO arriba y abajo y la numeración.
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que
// aparecer «veces» veces) y se cambió por «nuevo». reemplazos-compilado.js comprueba
// que deshaciéndolos se vuelve byte por byte al anterior.
// Si se vuelve a compilar desde el fuente, esto es lo que hay que pasarle.
//
// La hoja vive en archivos legibles aparte (calcos/riesgo/v1/, ver su README). Acá sólo:
//   · se importan los módulos de calcos/riesgo/v1/;
//   · la F2·P7 y la F6·P3 del G-3 pasan a ser del tipo «riesgo» (la F6·P3 es la
//     actualización de la misma matriz, con el curso de acción aprobado);
//   · el Tablero del G-3 monta el editor de la matriz (con el ejercicio y el
//     expediente) en lugar del editor de renglones, y no muestra los botones
//     genéricos de «Vista previa / Word» ni el panel de IA de renglones (el editor
//     trae los suyos: el mismo panel de IA de la Mesa, con el pedido de la matriz);
//   · el expediente, la carpeta del G-3 y el conteo de documentos leen la matriz;
//   · lo que otros pedidos a la IA traigan para esta hoja se AGREGA a la matriz (la
//     función general de la Mesa la habría reemplazado por una lista);
//   · la guía «¿Para qué es y cómo se llena?» de las dos hojas;
//   · configurarRiesgo() le presta React, el panel de IA (hU), el encabezado de los
//     pedidos (Qq), el corrector de terminología (uU) y la Línea de Tiempo (MS).
module.exports = [
  {
    nombre: 'Riesgo · módulos de la matriz (calcos/riesgo/v1)',
    viejo: 'import {descargarConceptosWord as SIDConceptosWord} from "../conceptos/v4/word.js";',
    nuevo:
      'import {descargarConceptosWord as SIDConceptosWord} from "../conceptos/v4/word.js";import SIDEditorRiesgo from "../riesgo/v1/editor.js";import {configurarRiesgo} from "../riesgo/v1/runtime.js";import {matrizCarpetaHTML as SIDRiesgoHTML} from "../riesgo/v1/vista.js";import {textoRiesgo as SIDRiesgoTexto,tieneRiesgo as SIDRiesgoTiene} from "../riesgo/v1/modelo.js";import {fusionable as SIDRiesgoFusionable,fusionarRiesgo as SIDRiesgoFusionar} from "../riesgo/v1/ia.js";',
    veces: 1,
  },
  {
    nombre: 'Riesgo · F2·P7 es la matriz (tipo «riesgo»)',
    viejo:
      '{id:"riesgo",num:"F2·P7",nom:"Matriz de administración del riesgo",entrega:"NO se difunde · en coordinación con el G-2",responsable:"G-2 y G-3",tipo:"filas",cols:["Peligro identificado","Probabilidad","Severidad","Nivel de riesgo inicial","Medida de control","Quién la ejecuta","Riesgo residual"],nota:"Se inicia acá y se ACTUALIZA en la fase VI (paso 3), cuando ya se conoce el curso de acción aprobado."}',
    nuevo:
      '{id:"riesgo",num:"F2·P7",nom:"Matriz de administración del riesgo",entrega:"NO se difunde · en coordinación con el G-2",responsable:"G-2 y G-3",tipo:"riesgo",nota:"Es la HOJA DE TRABAJO del RO-06-01-04 «Administración del Riesgo» (Anexo «B»): una MATRIZ por tarea y obstáculo. Se inicia acá y se ACTUALIZA en la fase VI (paso 3), con el curso de acción aprobado."}',
    veces: 1,
  },
  {
    nombre: 'Riesgo · F6·P3 es la misma matriz, actualizada',
    viejo:
      '{id:"riesgoFinal",num:"F6·P3",nom:"Riesgo de la operación (actualización)",entrega:"NO se difunde",responsable:"Todo el EM",tipo:"filas",cols:["Peligro","Riesgo residual tras el juego de guerra","Medida de control final","¿Quién acepta el riesgo?"],nota:"Es la actualización de la hoja de la fase II (paso 7), ahora sobre el curso de acción aprobado."}',
    nuevo:
      '{id:"riesgoFinal",num:"F6·P3",nom:"Matriz de administración del riesgo (actualización)",entrega:"NO se difunde",responsable:"Todo el EM",tipo:"riesgo",actualiza:"riesgo",nota:"Es la matriz de la fase II (F2·P7) actualizada con el curso de acción aprobado y lo que dejó el juego de guerra: la misma hoja de trabajo del RO-06-01-04."}',
    veces: 1,
  },
  {
    nombre: 'Riesgo · no es una hoja de renglones para el panel genérico de IA',
    viejo: '["tiempo","remite","lineaTiempo","conceptos"].includes(t.tipo)',
    nuevo: '["tiempo","remite","lineaTiempo","conceptos","riesgo"].includes(t.tipo)',
    veces: 1,
  },
  {
    nombre: 'Riesgo · sin los botones genéricos «Vista previa / Word» (el editor trae los suyos)',
    viejo: 'Ke.tipo!=="conceptos"&&!HS.includes(Ke.id)&&',
    nuevo: 'Ke.tipo!=="conceptos"&&Ke.tipo!=="riesgo"&&!HS.includes(Ke.id)&&',
    veces: 1,
  },
  {
    nombre: 'Riesgo · el Tablero del G-3 monta el editor de la matriz con el ejercicio y el expediente',
    viejo: 'Ke.tipo==="conceptos"?f.jsx(SIDEditorConceptos,{valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ctx:{...I,unidades:t,orgTarea:a,g3:M,documentos:U?.documentos||[]},onExpediente:j}):',
    nuevo:
      'Ke.tipo==="conceptos"?f.jsx(SIDEditorConceptos,{valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ctx:{...I,unidades:t,orgTarea:a,g3:M,documentos:U?.documentos||[]},onExpediente:j}):Ke.tipo==="riesgo"?f.jsx(SIDEditorRiesgo,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ctx:{...I,unidades:t,orgTarea:a,g3:M,documentos:U?.documentos||[]},onExpediente:j},Ke.id):',
    veces: 1,
  },
  {
    nombre: 'Riesgo · fuera del Tablero, el editor recibe lo que tenga',
    viejo: 'if(t.tipo==="conceptos")return f.jsx(SIDEditorConceptos,{valor:e,onValor:o,ctx:{ordenSup:r,documentos:u,g3:h}});',
    nuevo: 'if(t.tipo==="conceptos")return f.jsx(SIDEditorConceptos,{valor:e,onValor:o,ctx:{ordenSup:r,documentos:u,g3:h}});if(t.tipo==="riesgo")return f.jsx(SIDEditorRiesgo,{hoja:t,valor:e,onValor:o,ctx:{ordenSup:r,documentos:u,g3:h}});',
    veces: 1,
  },
  {
    nombre: 'Riesgo · en el expediente (y en los pedidos de las otras hojas) va como texto',
    viejo: 'if(t?.tipo==="conceptos")return SIDConceptosTexto(e);',
    nuevo: 'if(t?.tipo==="conceptos")return SIDConceptosTexto(e);if(t?.tipo==="riesgo")return SIDRiesgoTexto(e);',
    veces: 1,
  },
  {
    nombre: 'Riesgo · la carpeta del G-3 lleva la matriz (sólo la tabla: la carpeta ya tiene membrete y título por hoja)',
    viejo: 'function ED(t,e={},n={}){if(t.tipo==="conceptos")return SIDConceptosHTML(e,{unidad:n?.unidad||"",ejercicio:n?.ejercicio||"",clasificacion:n?.ordenSup?.clasificacion||""});',
    nuevo: 'function ED(t,e={},n={}){if(t.tipo==="conceptos")return SIDConceptosHTML(e,{unidad:n?.unidad||"",ejercicio:n?.ejercicio||"",clasificacion:n?.ordenSup?.clasificacion||""});if(t.tipo==="riesgo")return SIDRiesgoHTML(e,{hoja:t,ctx:n});',
    veces: 1,
  },
  {
    nombre: 'Riesgo · «documentos con contenido»: la matriz cuenta si tiene contenido',
    viejo: 'hechas:a.hojas.filter(i=>e(t[i.id])).length',
    nuevo: 'hechas:a.hojas.filter(i=>i.tipo==="riesgo"?SIDRiesgoTiene(t[i.id]):e(t[i.id])).length',
    veces: 1,
  },
  {
    nombre: 'Riesgo · lo que otros pedidos a la IA traen para la matriz se agrega (no la reemplaza)',
    viejo: 'for(const[o,s]of Object.entries(e)){const r=a[o];',
    nuevo: 'for(const[o,s]of Object.entries(e)){const r=a[o];if(SIDRiesgoFusionable(o,r,s)){const q=SIDRiesgoFusionar(r,s,{pisar:n});a[o]=q.valor,i+=q.n;continue}',
    veces: 1,
  },
  {
    nombre: 'Riesgo · guía «¿Para qué es y cómo se llena?» de la F2·P7',
    viejo:
      'riesgo:{para:"Ordena los peligros y les pone una medida de control con un responsable. No es un trámite: es lo que después firma el Comandante cuando acepta el riesgo.",como:["PELIGRO: concreto. «Contraataque blindado sobre el flanco derecho durante el pasaje de líneas».","PROBABILIDAD y SEVERIDAD: cruzalas para el nivel de riesgo.","MEDIDA DE CONTROL: qué se hace para bajarlo, y QUIÉN lo ejecuta. Sin responsable no es control.","RIESGO RESIDUAL: lo que queda después de la medida. Es lo que se eleva."],ejemplo:"Se arranca en la fase II con el G-2 y se ACTUALIZA en la fase VI, cuando ya hay curso de acción aprobado."}',
    nuevo:
      'riesgo:{para:"Es la HOJA DE TRABAJO del RO-06-01-04 «Administración del Riesgo» (Anexo «B»): una MATRIZ, no una lista. Por cada TAREA de la misión, sus OBSTÁCULOS (peligros), cuánto riesgo tienen, qué se hace para bajarlo, cuánto queda y cómo se implementa. Arriba va el membrete táctico y al pie firma el Comandante, que es quien acepta el riesgo.",como:["A–D: misión o tarea, grupo fecha/hora (empieza / termina), fecha de preparación y quién la prepara: 🌱 salen del ejercicio.","E–F: cada TAREA con sus OBSTÁCULOS, identificados con MATT-TCE (misión, enemigo, terreno con el COC y el CMOC, meteorología, tropas, tiempo, civiles): concretos y de ESTE ejercicio.","G: probabilidad (A–E) × severidad (I–IV) → nivel con la Figura 6 (SA · A · M · B). Lo calcula la Mesa.","H–J: medidas de control con QUIÉN, QUÉ, DÓNDE, CUÁNDO y CÓMO; el riesgo residual con el control puesto; y cómo se implementan (párrafo o anexo de la orden, PON, ensayo).","K: el nivel general es el MAYOR riesgo residual, encerrado en un círculo. 📄 El Word sale con el membrete táctico en Arial 10 negrilla, SECRETO arriba y abajo y la numeración de páginas."],ejemplo:"E «Ocupar un área de operaciones» — F «Emboscada» — G Moderado — H ✓ Cascos kevlar y chalecos fuera del campamento ✓ Mínimo 4 vehículos por movimiento — I Bajo — J Practicar los ejercicios de reacción inmediata. (RO-06-01-04, Anexo «C»)"}',
    veces: 1,
  },
  {
    nombre: 'Riesgo · guía «¿Para qué es y cómo se llena?» de la F6·P3 (actualización)',
    viejo:
      'riesgoFinal:{para:"Después del juego de guerra ya sabés qué salió mal en la mesa. Acá se anota el riesgo que QUEDA y quién lo acepta.",como:["Sólo los peligros que sobrevivieron a las medidas de control.","La aceptación del riesgo tiene nivel: hay riesgos que sólo acepta el Comandante.","Va a la Guía de Planificación Final y a la Orden Preparatoria N° 3."],ejemplo:"Riesgo residual: exposición del flanco derecho durante 40 minutos en el pasaje de líneas. Lo acepta el Comandante de la División."}',
    nuevo:
      'riesgoFinal:{para:"Es la MISMA matriz de la fase II (F2·P7), actualizada con el curso de acción aprobado y lo que dejó el juego de guerra. Acá queda el riesgo que QUEDA, y el Comandante lo acepta con su firma.",como:["📋 Partí de la matriz de la F2·P7 y reevaluá cada obstáculo con el curso de acción aprobado.","Sacá los obstáculos que ya no aplican y agregá los que aparecieron en el juego de guerra.","Ajustá los controles finales (quién, qué, dónde, cuándo y cómo) y el riesgo residual.","El nivel general (K) es el MAYOR riesgo residual: va a la Guía de Planificación Final y a la Orden Preparatoria N° 3."],ejemplo:"Riesgo residual: exposición del flanco derecho durante 40 minutos en el pasaje de líneas — ALTO (A). Lo acepta el Comandante de la División."}',
    veces: 1,
  },
  {
    nombre: 'Riesgo · configurarRiesgo(): React, panel de IA, encabezado, corrector y Línea de Tiempo',
    viejo: 'configurarConceptos({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useMemo:je.useMemo,useRef:je.useRef,Document:A5e,Packer:loe,Paragraph:Js,ImageRun:kPe,PageOrientation:GD,encabezadoIA:Qq,corregirIA:uU});',
    nuevo:
      'configurarConceptos({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useMemo:je.useMemo,useRef:je.useRef,Document:A5e,Packer:loe,Paragraph:Js,ImageRun:kPe,PageOrientation:GD,encabezadoIA:Qq,corregirIA:uU});configurarRiesgo({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useMemo:je.useMemo,PanelIA:hU,encabezadoIA:Qq,corregirIA:uU,lineaDeTiempo:MS});',
    veces: 1,
  },
]
