// Reemplazos hechos el 2026-10-06 sobre el compilado de la Mesa del EM
// (calcos/assets/index-prc-20261006.js → index-organizacion-20261006.js).
// Lo pidió Sergio con capturas de la F3·P3 «Organización inicial de las fuerzas» del G-3, del
// calco de la Mesa, del calco de la Escuela (las tareas con OD / OC 1 / OC 2 / OC 3 y los
// triángulos al lado, sobre el terreno), de la Organización de la Tarea en forma gráfica y
// del panel «🧩 Organización de la Tarea». Quería trabajar en ORDEN, como dice la doctrina
// («3.- Formación inicial de las fuerzas»):
//   · con el CAE más probable y los objetivos del enemigo, colocar las TAREAS TÁCTICAS;
//   · darles la operación (OD, OC 1, OC 2…);
//   · con las unidades que tiene, poner los triángulos y cuadrados (unidades genéricas)
//     que corresponden, sobre el terreno;
//   · llegar a la forma gráfica y recién ahí a la Organización de la Tarea.
// Pasaba: la hoja era una tabla de cuatro columnas que 🌱 llenaba con las unidades con su
// nombre (lo contrario de la doctrina: unidades genéricas, sin nombres propios todavía), sin
// la carta, sin proporciones y sin vínculo con la Organización de la Tarea.
// Todo lo nuevo está en calcos/organizacion/v1 (modelo.js, carta.js, editor.js, grafica.js,
// runtime.js).
//
// Ninguna inserción parte lo que insertaron las listas anteriores (SIDOIConfig va justo ANTES del
// configurarEM del G-5, que queda entero; organizacion.cjs lo comprueba con todas las listas).
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer
// «veces» veces) y se cambió por «nuevo». construir-organizacion.js arma el compilado y
// comprueba que deshaciéndolos se vuelve byte por byte al anterior.
module.exports = [
  {
    nombre: 'F3·P3 · el módulo de la formación inicial (calcos/organizacion/v1): la pantalla de la hoja, la capa de la carta y el cuadro',
    viejo: 'import {esHojaLog as SIDLogEs,tieneHojaLog as SIDLogTiene,textoHojaLog as SIDLogTexto} from "../logistica/v1/modelo.js";',
    nuevo:
      'import {esHojaLog as SIDLogEs,tieneHojaLog as SIDLogTiene,textoHojaLog as SIDLogTexto} from "../logistica/v1/modelo.js";import SIDEditorOrgInicial from "../organizacion/v1/editor.js";import {configurarOrgInicial as SIDOIConfig,filasDeLaHoja as SIDOIFilas} from "../organizacion/v1/runtime.js";import {sincronizarCarta as SIDOISync,posicionAgrupacion as SIDOIPos} from "../organizacion/v1/carta.js";',
    veces: 1,
  },
  {
    nombre: 'F3·P3 · la hoja: «Formación inicial de las fuerzas», con la operación y el enemigo de cada sector en el cuadro',
    viejo:
      '{id:"organizacion",num:"F3·P3",nom:"Organización inicial de las fuerzas",entrega:"Sin documento en el cuadro — se registra acá",responsable:"G-3",tipo:"filas",cols:["Agrupación / unidad genérica","Tarea que cumple","Proporción requerida frente al enemigo en su sector","Relación de comando"],autollena:"organizacion",nota:"Es determinar, para CADA tarea, la proporción de unidades propias frente a las enemigas ubicadas en ese sector. De acá sale el peso del esfuerzo principal."}',
    nuevo:
      '{id:"organizacion",num:"F3·P3",nom:"Formación inicial de las fuerzas",entrega:"Sin documento en el cuadro — se registra acá (y en el calco)",responsable:"G-3",tipo:"filas",cols:["Operación","Agrupación / unidad genérica","Tarea que cumple","Enemigo en su sector","Proporción requerida frente al enemigo en su sector","Relación de comando"],autollena:"organizacion",nota:"Se trabaja en orden y sobre el terreno: las tareas tácticas en la carta con su OD y sus OC, la proporción de cada una frente al enemigo de su sector, las unidades genéricas que la cumplen (lo que sobra, a la reserva; lo que falta, un requerimiento) y recién después la Organización de la Tarea."}',
    veces: 1,
  },
  {
    nombre: 'F3·P3 · la guía «📘 ¿Para qué es y cómo se llena?» con la doctrina de la formación inicial',
    viejo:
      'organizacion:{para:"Es donde se decide el PESO: qué agrupación se arma para cada tarea y con qué proporción frente al enemigo de ese sector.",como:["Identificá primero las unidades genéricas (dos batallones mecanizados, un grupo de artillería…), sin nombres propios todavía.","Para CADA tarea, calculá la proporción requerida contra el enemigo ubicado en ese sector.","Lo que sobra después de cubrir las tareas es la reserva. Si no sobra nada, no hay reserva: decilo.","La relación de comando (orgánica, apoyo directo, apoyo general, refuerzo) es parte de la organización, no un detalle."],ejemplo:"Esfuerzo principal 3:1 sobre la AA-1; esfuerzo secundario 1:1 fijando en la AA-2; reserva: una compañía mecanizada."}',
    nuevo:
      'organizacion:{para:"Determina las fuerzas necesarias para cumplir la misión y da la base del concepto de la operación: identifica el total de unidades requeridas y los posibles métodos para tratar con el enemigo. Se hace con unidades GENÉRICAS, sin nombres propios ni misiones todavía.",como:["① Se considera la misión reexpresada y la intención del Comandante superior, las avenidas de aproximación (propias y enemigas) y los cursos de acción del enemigo: del MÁS PROBABLE al MÁS PELIGROSO, con sus objetivos.","② Las TAREAS TÁCTICAS van en la carta, sobre el terreno: primero la OPERACIÓN DECISIVA (el esfuerzo principal) en el punto decisivo; después las OPERACIONES DE CONFIGURACIÓN (OC 1, OC 2…).","③ Para CADA tarea, empezando por la OD, la PROPORCIÓN requerida de unidades propias frente a las enemigas de ese sector. Es un instrumento de planeamiento, no se aplica al combate; persecución, explotación y movimiento para hacer contacto no requieren una proporción particular (1:1).","④ Las unidades genéricas (dos niveles abajo: los triángulos y cuadrados) de lo que hay: lo que SOBRA va a una agrupación aparte (la reserva); si FALTA, es un posible requerimiento de recursos adicionales.","⑤ La forma gráfica y la Organización de la Tarea: recién ahí se nombran las agrupaciones y se les da el propósito."],ejemplo:"OD: Bloquear a las unidades mecanizadas y blindadas de la FT-43, 1:3 → 2 Cía. genéricas · OC 1: Mantener las elevaciones · OC 2: Ocupar las elevaciones · OC 3: Atacar con fuego al primer y segundo escalón · Reserva: lo que sobra."}',
    veces: 1,
  },
  {
    nombre: 'F3·P3 · 🌱 trae el cuadro de la carta (las tareas con su operación, su enemigo, su proporción y sus unidades genéricas), no la lista de unidades con su nombre',
    viejo:
      'case"organizacion":return Ae.map(Ne=>({"Agrupación / unidad genérica":js(Ne),"Tarea que cumple":"","Proporción requerida frente al enemigo en su sector":"","Relación de comando":Ne.agrupacion?"Agrupación táctica":"Orgánica"}));',
    nuevo: 'case"organizacion":return SIDOIFilas({ops:re,g3:Se,unidades:e.SIDdn||K});',
    veces: 1,
  },
  {
    nombre: 'F3·P3 · en el Tablero del G-3, la hoja se trabaja paso a paso (SIDEditorOrgInicial) y abajo queda el cuadro de siempre',
    viejo:
      ':f.jsx(yU,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ordenSup:I.ordenSup||{},documentos:U?.documentos||[],g3:M})]})}if(K){',
    nuevo:
      ':Ke.id==="organizacion"?f.jsxs(f.Fragment,{children:[f.jsx(SIDEditorOrgInicial,{hoja:Ke,ctx:{...I,unidades:t,orgTarea:a,g3:M},onG3:SIDp=>T?.(SIDv=>({...SIDv,...(typeof SIDp==="function"?SIDp(SIDv):SIDp)})),onAbrirOrgTarea:i}),f.jsx("div",{style:At.nota,children:"📋 El cuadro de la hoja — lo que va a la vista previa, al Word y a la IA (se arma con «Pasar al cuadro de la hoja» o con 🌱):"}),f.jsx(yU,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ordenSup:I.ordenSup||{},documentos:U?.documentos||[],g3:M})]}):f.jsx(yU,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ordenSup:I.ordenSup||{},documentos:U?.documentos||[],g3:M})]})}if(K){',
    veces: 1,
  },
  {
    nombre: 'F3·P3 · mientras se coloca una tarea tocando la carta, la Mesa está «dibujando» (no activa el Área de Operaciones ni otras cosas)',
    viejo: '[modoFuegos,setModoFuegos]=je.useState(!1)',
    nuevo: '[modoFuegos,setModoFuegos]=je.useState(!1),[modoOI,setModoOI]=je.useState(!1)',
    veces: 1,
  },
  {
    nombre: 'F3·P3 · «dibujando» también con la colocación de la F3·P3',
    viejo: 'dibujando:gp}',
    nuevo: 'dibujando:gp||modoOI}',
    veces: 1,
  },
  {
    nombre: 'F3·P3 · al Tablero del G-3 le llegan las avenidas (CMOC) y las unidades sin descontar las piezas consolidadas (las mismas de la Organización de la Tarea)',
    viejo: 'ctx:{ops:Lt,fasesCOA:Yn,faseActiva:yt,picb:$i,ordenSup:Tn,orgTarea:uc,unidad:Tn?.unidad||"",ejercicio:wn,autor:zo}',
    nuevo: 'ctx:{ops:Lt,fasesCOA:Yn,faseActiva:yt,picb:$i,ordenSup:Tn,orgTarea:uc,unidad:Tn?.unidad||"",ejercicio:wn,autor:zo,cmoc:Jt,SIDdn:dn}',
    veces: 1,
  },
  {
    nombre: 'F3·P3 · la capa de la carta (los rótulos «OD · T: …» y las unidades genéricas junto a cada tarea) y lo que necesita para cambiar el calco',
    viejo: 'irA:Fn})},[Vd,dn,uc,planFuegos,modoFuegos,wn,Tn,Fn]);',
    nuevo:
      'irA:Fn})},[Vd,dn,uc,planFuegos,modoFuegos,wn,Tn,Fn]);je.useEffect(()=>{SIDOISync({ops:Lt,g3:Ya,unidades:dn,setOps:Sn,setG3:ns,marcar:la,setOrgTarea:jl,setUnidades:Ra,irA:In,setModo:setModoOI,centro:()=>Da.current})},[Lt,Ya,dn]);',
    veces: 1,
  },
  {
    nombre: 'F3·P3 · al consolidar en el panel 🧩, la ficha de una agrupación que salió de la F3·P3 va junto a su tarea táctica, sobre el terreno (las demás, como siempre, al centro de la vista)',
    viejo: 'return{id:`ag-${Date.now()}-${Qt}`,lat:Math.round((Qe.lat+Qt%3*.02)*1e6)/1e6,lng:Math.round((Qe.lng+Math.floor(Qt/3)*.03)*1e6)/1e6,bando:"propias"',
    nuevo: 'return{id:`ag-${Date.now()}-${Qt}`,...(SIDOIPos(xt)||{lat:Math.round((Qe.lat+Qt%3*.02)*1e6)/1e6,lng:Math.round((Qe.lng+Math.floor(Qt/3)*.03)*1e6)/1e6}),bando:"propias"',
    veces: 1,
  },
  {
    nombre: 'F3·P3 · el módulo recibe React, los símbolos de la Mesa (piezas y tareas), cómo se disgrega cada unidad y Leaflet',
    viejo: 'configurarEM({inventarioAC:rC,poblacionAC:mP,evacuacionAC:fN,descargaAC:SDe,estadosAC:LU});',
    nuevo: 'SIDOIConfig({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useEffect:je.useEffect,useMemo:je.useMemo,eN,cb,tN,js,lP,zg,leaflet:Rt});configurarEM({inventarioAC:rC,poblacionAC:mP,evacuacionAC:fN,descargaAC:SDe,estadosAC:LU});',
    veces: 1,
  },
]
