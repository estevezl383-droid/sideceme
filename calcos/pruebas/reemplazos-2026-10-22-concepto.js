// Reemplazos del 2026-10-22 sobre calcos/assets/index-reabastecimiento-20261021.js → index-concepto-20261022.js.
// Lo pidió Sergio con la F3·P4 «Concepto amplio de la operación» que le hizo la IA (Defensa de área del CE-I):
// «me lo armó un documento pero en el calco no se ve absolutamente nada… armalo como una plantilla doctrinal
// con fichas que incluya el plan de barreras y el plan de fuegos… que pueda mover la concentración de fuego,
// mover las barreras, aumentarlas… en congruencia con todo lo que ya consideraron los otros G».
//
// Qué se hace (la lógica está en calcos/concepto-operacion/v1): arriba de los nueve campos de la F3·P4 va la pantalla
// del concepto en la carta (SIDEditorConcepto); la Mesa le pasa a la capa de la carta (SIDCOSync) el calco,
// el plan de fuegos, las hojas del G-3, las unidades, el CMOC, la PICB, la plantilla situacional y el
// nomenclátor, y los modos de cambiarlos (con los candados de siempre y la foto del ↶ Deshacer). Mientras se
// ajusta o se coloca una ficha, la carta está «dibujando» (modoCO), como con la F3·P3.
//
// SHA-256 de index-reabastecimiento-20261021.js (antes de estos reemplazos): 8b72f8115cd8cf51db323f398af41df03430e7429e9c4befcff2dc6520e6a3d5

const CANDADO = 'if(ll){Nl();return}if(Bn){he("🔒 Ejercicio finalizado: duplíquelo para editar.");return}'

module.exports = [
  {
    nombre: 'Import del módulo del concepto en la carta (calcos/concepto-operacion/v1)',
    viejo: 'import {acostarRestantes as SIDAinsResto,',
    nuevo: 'import SIDEditorConcepto from "../concepto-operacion/v1/editor.js";import {configurarConcepto as SIDCOConfig} from "../concepto-operacion/v1/runtime.js";import {sincronizarCarta as SIDCOSync} from "../concepto-operacion/v1/carta.js";import {acostarRestantes as SIDAinsResto,',
    veces: 1,
  },
  {
    nombre: 'Configuración: React, el nombre de las unidades (js), las tareas tácticas (cb), los obstáculos (Nm) y Leaflet',
    viejo: 'SIDOIConfig({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useEffect:je.useEffect,useMemo:je.useMemo,eN,cb,tN,js,lP,zg,T1,leaflet:Rt})',
    nuevo: 'SIDOIConfig({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useEffect:je.useEffect,useMemo:je.useMemo,eN,cb,tN,js,lP,zg,T1,leaflet:Rt});SIDCOConfig({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useEffect:je.useEffect,useMemo:je.useMemo,js,cb,Nm,leaflet:Rt})',
    veces: 1,
  },
  {
    nombre: 'Tablero del G-3 (wLe): la F3·P4 lleva el concepto en la carta arriba de sus campos',
    viejo: ':Ke.id==="organizacion"?f.jsxs(',
    nuevo: ':Ke.id==="concepto"?f.jsxs(f.Fragment,{children:[f.jsx(SIDEditorConcepto,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ctx:{...I,unidades:t,orgTarea:a,g3:M}}),f.jsx("div",{style:At.nota,children:"📋 El texto de la hoja — lo que va a la vista previa, al Word y a la IA:"}),f.jsx(yU,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ordenSup:I.ordenSup||{},documentos:U?.documentos||[],g3:M})]}):Ke.id==="organizacion"?f.jsxs(',
    veces: 1,
  },
  {
    nombre: 'Sze: el modo «ajustando / colocando» del concepto',
    viejo: '[modoOI,setModoOI]=je.useState(!1)',
    nuevo: '[modoOI,setModoOI]=je.useState(!1),[modoCO,setModoCO]=je.useState(!1)',
    veces: 1,
  },
  {
    nombre: 'Carta 2D (Ave): mientras se ajusta el concepto, la carta está dibujando',
    viejo: 'dibujando:gp||modoOI}',
    nuevo: 'dibujando:gp||modoOI||modoCO}',
    veces: 1,
  },
  {
    nombre: 'Sze: el puente con la capa del concepto (el calco, el plan de fuegos, las hojas del G-3 y cómo cambiarlos)',
    viejo: 'je.useEffect(()=>{SIDOISync({ops:Lt,g3:Ya,unidades:dn,setOps:Sn,setG3:ns,marcar:la,setOrgTarea:jl,setUnidades:Ra,irA:In,setModo:setModoOI,centro:()=>Da.current})},[Lt,Ya,dn]);',
    nuevo:
      'je.useEffect(()=>{SIDOISync({ops:Lt,g3:Ya,unidades:dn,setOps:Sn,setG3:ns,marcar:la,setOrgTarea:jl,setUnidades:Ra,irA:In,setModo:setModoOI,centro:()=>Da.current})},[Lt,Ya,dn]);' +
      `je.useEffect(()=>{SIDCOSync({ops:Lt,g3:Ya,plan:planFuegos,unidades:dn,vistas:Vd,orgTarea:uc,cmoc:Jt,picb:$i,plantilla:Zi,setOps:SIDf=>{${CANDADO}Sn(SIDf)},setPlan:SIDf=>{${CANDADO}setPlanFuegos(SIDf)},setG3:ns,setUnidades:SIDf=>{${CANDADO}Ra(SIDf)},marcar:la,marcarU:SIDlaU,setModo:setModoCO,lugares:()=>{try{return zIe(hie({datosCapas:ve,resultados:ne}))}catch{return[]}}})},[Lt,Ya,planFuegos,dn,Vd,uc,Jt,$i,Zi,ll,Bn,ve,ne]);`,
    veces: 1,
  },
]
