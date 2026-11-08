// Reemplazos del 2026-11-08 sobre calcos/assets/index-tareas-verdes-20261108.js → index-decision-cap-20261108.js.
// Sergio, con la F4·P6-7 Matriz de sincronización abierta: «necesito aquí, que es donde someto a juego de guerra las
// fases, el más probable y el más peligroso, una opción donde diga: después de sometido a juego de guerra el Comandante
// se decidió por el CAP 1 o CAP 2, para que en base a eso ya se desarrolle el resto del planeamiento y recién se
// rellene» la matriz; «resaltar esta hoja, que es donde se decide qué CAP»; «reducir tanto texto… que sea sólo de
// ejecución… que no haya tanto texto pequeño que no se lee». Ahora (calcos/evento-critico/v1):
//   · el panel de la hoja en tres pasos: ① Juego de guerra, ② ¿Qué CAP decidió el Comandante? (CAP 1 / CAP 2: la Mesa
//     pasa a ese CAP con la acción 'cambiar' de los CAP y guarda g3._caps.decision), ③ la matriz;
//   · 🌱, 🤖 y la rejilla de la F4·P6-7 recién con la decisión y ese CAP a la vista;
//   · el pedido de la IA de la matriz lleva la decisión y las fases del CAP decidido;
//   · las hojas que siguen (F4·P7, F5, F6, F7) dicen en una línea qué CAP decidió el Comandante (o que falta);
//   · la F4·P6-7 resaltada en la lista de documentos (🎖️ DECISIÓN / 🎖️ CAP n);
//   · menos texto en la F4·P6-7: la guía «¿Para qué es…?» plegada (con su propio estado: las demás hojas, como estaban),
//     la nota y la entrega cortas, «Lo que entregó el G-2» plegado; la nota de la IA en una línea y la letra un poco
//     más grande en el tablero del G-3.
//   · los botones CAP 1 / CAP 2 del F3·P6 y del 🎬 C.A. por fases marcan el decidido (cap-propios/v1/panel.js, versión).
//
// SHA-256 de index-tareas-verdes-20261108.js (antes de estos reemplazos): ver construir-decision-cap.js.
module.exports = [
  {
    nombre: 'Importa el panel nuevo y la decisión del Comandante (versión nueva)',
    viejo: 'import SIDEvPanel from "../evento-critico/v1/panel.js?v=ev20261025b";',
    nuevo:
      'import SIDEvPanel from "../evento-critico/v1/panel.js?v=decision20261108";' +
      'import {matrizAbierta as SIDDecAbierta,avisoHoja as SIDDecAviso,filaDocumento as SIDDecFila,pedidoDecision as SIDDecPedido} from "../evento-critico/v1/decision.mjs?v=decision20261108";',
    veces: 1,
  },
  {
    nombre: 'El panel de los CAP con versión nueva (marca el CAP decidido)',
    viejo: 'from "../cap-propios/v1/panel.js?v=op320261026"',
    nuevo: 'from "../cap-propios/v1/panel.js?v=decision20261108"',
    veces: 1,
  },
  {
    nombre: 'F4·P6-7: sin la nota larga; el panel recibe la acción de los CAP y el setState del G-3',
    viejo:
      'Ke.nota&&f.jsx("div",{style:At.nota,children:Ke.nota}),Ke.id==="sincro"&&f.jsx(SIDEvPanel,{R:{jsx:f.jsx,jsxs:f.jsxs,useState:je.useState},hoja:Ke,valor:M[Ke.id],ctx:SIDctxCap,onLlevar:SIDv=>Ge(Ke.id,SIDv)},"ev-"+Ke.id)',
    nuevo:
      'Ke.nota&&Ke.id!=="sincro"&&f.jsx("div",{style:At.nota,children:Ke.nota}),Ke.id==="sincro"&&f.jsx(SIDEvPanel,{R:{jsx:f.jsx,jsxs:f.jsxs,useState:je.useState},hoja:Ke,valor:M[Ke.id],ctx:SIDctxCap,onLlevar:SIDv=>Ge(Ke.id,SIDv),onAccion:I.SIDcap,onG3:T},"ev-"+Ke.id)',
    veces: 1,
  },
  {
    nombre: 'F4·P6-7: 🌱 recién con la decisión',
    viejo: 'Ke.autollena&&f.jsx("button",{style:At.sembrar,onClick:()=>de(Ke),children:"🌱 Traer del calco lo que falte"})',
    nuevo: 'Ke.autollena&&(Ke.id!=="sincro"||SIDDecAbierta(SIDctxCap))&&f.jsx("button",{style:At.sembrar,onClick:()=>de(Ke),children:"🌱 Traer del calco lo que falte"})',
    veces: 1,
  },
  {
    nombre: 'F4·P6-7: la IA recién con la decisión; la nota de la IA en una línea',
    viejo: 'lU(Ke)&&f.jsx(hU,{titulo:"🤖 Trabajar esta hoja con IA",nota:"Le manda el expediente completo del ejercicio y el formato de esta hoja: lo que escriba es de ESTA situación, no doctrina general."',
    nuevo: 'lU(Ke)&&(Ke.id!=="sincro"||SIDDecAbierta(SIDctxCap))&&f.jsx(hU,{titulo:"🤖 Trabajar esta hoja con IA",nota:"Va con el expediente completo del ejercicio."',
    veces: 1,
  },
  {
    nombre: 'F4·P6-7: el pedido de la IA lleva la decisión y las fases del CAP decidido',
    viejo: 'SIDdespues:SIDr=>SIDPrepPedido(SIDCapPedido(SIDMEPedidoG3(SIDr,SIDctxG3),Ke,SIDctxCap),Ke,SIDctxCap,()=>SIDCapDocs(SIDctxCap))',
    nuevo: 'SIDdespues:SIDr=>SIDDecPedido(SIDPrepPedido(SIDCapPedido(SIDMEPedidoG3(SIDr,SIDctxG3),Ke,SIDctxCap),Ke,SIDctxCap,()=>SIDCapDocs(SIDctxCap)),Ke,SIDctxCap)',
    veces: 1,
  },
  {
    nombre: 'F4·P6-7: la rejilla recién con la decisión',
    viejo: ':f.jsx(yU,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ordenSup:I.ordenSup||{},documentos:U?.documentos||[],g3:M})]})}if(K){',
    nuevo: ':Ke.id==="sincro"&&!SIDDecAbierta(SIDctxCap)?null:f.jsx(yU,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ordenSup:I.ordenSup||{},documentos:U?.documentos||[],g3:M})]})}if(K){',
    veces: 1,
  },
  {
    nombre: 'Las hojas que siguen a la F4·P6-7: una línea con el CAP decidido (en las dos vistas de hoja)',
    viejo: 'Ke.entrega&&f.jsxs("div",{style:At.entrega,children:["📤 ",Ke.entrega]})',
    nuevo: 'Ke.entrega&&f.jsxs("div",{style:At.entrega,children:["📤 ",Ke.entrega]}),(SIDd=>SIDd&&f.jsx("div",{style:SIDd.estilo,"data-dec-aviso":"1",children:SIDd.texto}))(SIDDecAviso(Ke.id,M,ev))',
    veces: 2,
  },
  {
    nombre: 'F4·P6-7: la entrega corta',
    viejo: 'entrega:"Se llena DURANTE el juego de guerra · pasa a ser Matriz de Ejecución"',
    nuevo: 'entrega:"Juego de guerra → decisión del Comandante → Matriz de Ejecución"',
    veces: 1,
  },
  {
    nombre: 'F4·P6-7: «Lo que entregó el G-2» plegado',
    viejo: 'f.jsxs("div",{style:At.cae,children:[f.jsx("div",{style:At.caeTit,children:"🔎 Lo que entregó el G-2"}),',
    nuevo: 'f.jsxs(Ke.id==="sincro"?"details":"div",{style:At.cae,children:[f.jsx(Ke.id==="sincro"?"summary":"div",{style:Ke.id==="sincro"?{...At.caeTit,cursor:"pointer",marginBottom:0}:At.caeTit,children:"🔎 Lo que entregó el G-2"}),',
    veces: 1,
  },
  {
    nombre: 'La F4·P6-7 resaltada en la lista de documentos del G-3',
    viejo:
      'y&&u.hojas.map(v=>{const x=CD({[v.id]:a[v.id]}).hechas>0;return f.jsxs("button",{style:At.hoja,onClick:()=>i(v.id),children:[f.jsx("span",{style:{...At.punto,background:x?Sd:"transparent",border:`1px solid ${Sd}`}}),f.jsx("span",{style:At.hojaNum,children:v.num}),f.jsx("span",{style:{flex:1,textAlign:"left"},children:v.nom}),v.autollena&&f.jsx("span",{title:"Se puede sembrar desde el calco",children:"🌱"})]},v.id)})',
    nuevo:
      'y&&u.hojas.map(v=>{const x=CD({[v.id]:a[v.id]}).hechas>0,SIDf=SIDDecFila(v.id,a);return f.jsxs("button",{style:SIDf?{...At.hoja,...SIDf.estilo}:At.hoja,title:SIDf?SIDf.titulo:void 0,onClick:()=>i(v.id),children:[f.jsx("span",{style:{...At.punto,background:x?Sd:"transparent",border:`1px solid ${Sd}`}}),f.jsx("span",{style:At.hojaNum,children:v.num}),f.jsx("span",{style:{flex:1,textAlign:"left"},children:v.nom}),SIDf&&f.jsx("span",{style:SIDf.chapaEstilo,children:SIDf.chapa}),v.autollena&&f.jsx("span",{title:"Se puede sembrar desde el calco",children:"🌱"})]},v.id)})',
    veces: 1,
  },
  {
    nombre: 'F4·P6-7: la guía «¿Para qué es y cómo se llena?» con su propio estado, plegada (las otras hojas, como estaban)',
    viejo: '[ve,_e]=je.useState(null),[Re,Se]=je.useState(!0),[Ae,Ie]=je.useState("")',
    nuevo: '[ve,_e]=je.useState(null),[Re,Se]=je.useState(!0),[SIDgs,SIDsetGs]=je.useState(!1),[Ae,Ie]=je.useState("")',
    veces: 1,
  },
  {
    nombre: 'F4·P6-7: la guía plegada usa su estado',
    viejo: 'f.jsxs("button",{style:At.guiaTit,onClick:()=>Se(at=>!at),children:[Re?"▾":"▸"," 📘 ¿Para qué es y cómo se llena?"]}),Re&&f.jsxs("div",{style:At.guiaCuerpo,children:[',
    nuevo: 'f.jsxs("button",{style:At.guiaTit,onClick:()=>Ke.id==="sincro"?SIDsetGs(at=>!at):Se(at=>!at),children:[(Ke.id==="sincro"?SIDgs:Re)?"▾":"▸"," 📘 ¿Para qué es y cómo se llena?"]}),(Ke.id==="sincro"?SIDgs:Re)&&f.jsxs("div",{style:At.guiaCuerpo,children:[',
    veces: 1,
  },
  {
    nombre: 'Tablero del G-3: letra más grande (entrega)',
    viejo: 'entrega:{fontSize:11.5,color:"#8fb0c4"}',
    nuevo: 'entrega:{fontSize:12.5,color:"#9fc0d4"}',
    veces: 1,
  },
  {
    nombre: 'Tablero del G-3: letra más grande (nota)',
    viejo: 'nota:{fontSize:11.5,color:"#a9c8da",background:"rgba(255,255,255,0.05)",borderRadius:6,padding:"6px 8px",lineHeight:1.45}',
    nuevo: 'nota:{fontSize:12.5,color:"#a9c8da",background:"rgba(255,255,255,0.05)",borderRadius:6,padding:"6px 8px",lineHeight:1.45}',
    veces: 1,
  },
  {
    nombre: 'Tablero del G-3: letra más grande (lo que entregó el G-2)',
    viejo: 'caeTit:{color:"#c69cff",font:"700 11.5px Arial",marginBottom:4},caeItem:{fontSize:11.5,color:"#dcd0ee",lineHeight:1.4,marginBottom:2},caeAviso:{fontSize:11.5,color:"#ffd47a",lineHeight:1.4,marginTop:3}',
    nuevo: 'caeTit:{color:"#c69cff",font:"700 12.5px Arial",marginBottom:4},caeItem:{fontSize:12.5,color:"#dcd0ee",lineHeight:1.4,marginBottom:2},caeAviso:{fontSize:12.5,color:"#ffd47a",lineHeight:1.4,marginTop:3}',
    veces: 1,
  },
  {
    nombre: 'Tablero del G-3: letra más grande (número de la hoja y pie)',
    viejo: 'hojaNum:{color:Ad,font:"700 10.5px Arial",flex:"0 0 auto"}',
    nuevo: 'hojaNum:{color:Ad,font:"700 11.5px Arial",flex:"0 0 auto"}',
    veces: 1,
  },
  {
    nombre: 'Tablero del G-3: letra más grande (pie chico)',
    viejo: 'pieChico:{fontSize:11,color:"#8fb0c4",lineHeight:1.4}',
    nuevo: 'pieChico:{fontSize:12,color:"#9fc0d4",lineHeight:1.4}',
    veces: 1,
  },
]
