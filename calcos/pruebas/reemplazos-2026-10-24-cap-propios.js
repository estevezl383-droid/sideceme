// Reemplazos del 2026-10-24 sobre calcos/assets/index-cae-enemigo-20261024.js → index-cap-propios-20261024.js.
// Lo pidió Sergio con el CE-I en el AO LAUCA: el PMTD pide «al menos dos» cursos de acción propios que se distingan
// en la carta, la Mesa guardaba uno solo, y quería «que la aplicación sugiera y que lo lleve a la IA… si es o no es lo
// que estoy haciendo precisamente para este ejercicio… en este caso defensa móvil». Ahora (calcos/cap-propios/v1):
//   · en la F3·P6 (y la F3·P4) del Tablero del G-3, «💡 La Mesa propone 2 cursos de acción propios para ESTE
//     ejercicio»: quién hace qué en cada uno (leído de las fichas, las avenidas y la Orden), en qué se distinguen en
//     la carta y sus cinco fases; la forma de cada CAP se cambia; «🌱 Llevar el CAP a esta hoja» y «🎬 Armar sus
//     fases 🔵»;
//   · CAP 1 / CAP 2 en el mismo ejercicio: el activo está donde la Mesa lo busca siempre (fases 🔵, F3·P4, F3·P6);
//     el otro queda guardado en g3._caps. Se cambia en el panel o en el 🎬 C.A. por fases;
//   · el pedido de la IA de la F3·P4 y la F3·P6 lleva la propuesta: que diga si cada CAP SIRVE o NO para este
//     ejercicio (las cinco pruebas) y desarrolle el activo.
//
// SHA-256 de index-cae-enemigo-20261024.js (antes de estos reemplazos): 1e14809887a0e8c3bb63b9853757e21c2d683ebdd6c93e6c6e2322c7ead024b1
module.exports = [
  {
    nombre: 'Importa la propuesta de los CAP propios y su panel',
    viejo: 'despues as SIDMEDespues} from "../cae-enemigo/v1/revisar.mjs?v=cae20261024";',
    nuevo:
      'despues as SIDMEDespues} from "../cae-enemigo/v1/revisar.mjs?v=cae20261024";' +
      'import SIDCapPanel,{configurarCAP as SIDCapConfig,botonesCAP as SIDCapBotones} from "../cap-propios/v1/panel.js";' +
      'import {accion as SIDCapAccion,pedido as SIDCapPedido} from "../cap-propios/v1/proponer.mjs";',
    veces: 1,
  },
  {
    nombre: 'El panel recibe React (como el concepto de la operación)',
    viejo: 'SIDCOConfig({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useEffect:je.useEffect,useMemo:je.useMemo,js,cb,Nm,leaflet:Rt});',
    nuevo:
      'SIDCOConfig({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useEffect:je.useEffect,useMemo:je.useMemo,js,cb,Nm,leaflet:Rt});' +
      'SIDCapConfig({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState});',
    veces: 1,
  },
  {
    nombre: 'La Mesa: cambiar de CAP, elegir su forma y armar sus fases (el estado de las fases y del G-3)',
    viejo: ',Tg=je.useCallback(()=>{',
    nuevo:
      ',SIDcapAcc=je.useCallback((SIDa,SIDd={})=>SIDCapAccion(SIDa,SIDd,{fasesCOA:Yn,g3:Ya,setFases:kn,setG3:ns,flush:fo,unidades:dn,ops:Qr(Lt),activa:yt,setActiva:kt,setUnidades:Ra,bloqueado:ll,avisoBloqueo:Nl,aviso:za,error:he}),[Yn,Ya,fo,dn,Lt,Qr,yt,ll,Nl,za])' +
      ',Tg=je.useCallback(()=>{',
    veces: 1,
  },
  {
    nombre: 'Tablero del G-3: recibe las acciones de los CAP',
    viejo: 'cmoc:Jt,SIDdn:dn}',
    nuevo: 'cmoc:Jt,SIDdn:dn,SIDcap:SIDcapAcc}',
    veces: 1,
  },
  {
    nombre: '🎬 C.A. por fases: recibe el CAP activo',
    viejo: 'onGenerarEnemigo:Tg,',
    nuevo: 'onGenerarEnemigo:Tg,SIDcap:{g3:Ya,acc:SIDcapAcc},',
    veces: 2,
  },
  {
    nombre: '🎬 C.A. por fases: la prop del CAP',
    viejo: 'onEditarUnidad:g,hayPlantilla:v=!1,onCerrar:x}){',
    nuevo: 'onEditarUnidad:g,hayPlantilla:v=!1,onCerrar:x,SIDcap:SIDcap0=null}){',
    veces: 1,
  },
  {
    nombre: '🎬 C.A. por fases: los botones CAP 1 / CAP 2 debajo del título 🔵',
    viejo: 'children:"🔵 Curso de acción PROPIO"})',
    nuevo: 'children:"🔵 Curso de acción PROPIO"}),SIDCapBotones(SIDcap0,e)',
    veces: 1,
  },
  {
    nombre: 'Tablero del G-3: lo que lee la propuesta (las fichas, la carta, el CMOC, las fases y el G-3)',
    viejo: 'SIDctxG3={unidades:I.SIDdn||t,ordenSup:I.ordenSup||{},unidad:I.unidad||"",picb:I.picb||{}};',
    nuevo: 'SIDctxG3={unidades:I.SIDdn||t,ordenSup:I.ordenSup||{},unidad:I.unidad||"",picb:I.picb||{}},SIDctxCap={...SIDctxG3,ops:I.ops||{},cmoc:I.cmoc||{},fasesCOA:I.fasesCOA||{},g3:M};',
    veces: 1,
  },
  {
    nombre: 'F3·P6 y F3·P4: el panel «💡 La Mesa propone 2 cursos de acción propios»',
    viejo: 'Ke.nota&&f.jsx("div",{style:At.nota,children:Ke.nota}),Ke.autollena&&f.jsx("button",{style:At.sembrar,onClick:()=>de(Ke)',
    nuevo:
      '(Ke.id==="coa"||Ke.id==="concepto")&&f.jsx(SIDCapPanel,{hoja:Ke,valor:M[Ke.id],ctx:SIDctxCap,onAccion:I.SIDcap,onLlevar:SIDv=>Ge(Ke.id,SIDv)},"cap-"+Ke.id),' +
      'Ke.nota&&f.jsx("div",{style:At.nota,children:Ke.nota}),Ke.autollena&&f.jsx("button",{style:At.sembrar,onClick:()=>de(Ke)',
    veces: 1,
  },
  {
    nombre: 'F3·P6 y F3·P4: el pedido de la IA lleva la propuesta de los dos CAP',
    viejo: 'SIDdespues:SIDr=>SIDMEPedidoG3(SIDr,SIDctxG3)}',
    nuevo: 'SIDdespues:SIDr=>SIDCapPedido(SIDMEPedidoG3(SIDr,SIDctxG3),Ke,SIDctxCap)}',
    veces: 1,
  },
]
