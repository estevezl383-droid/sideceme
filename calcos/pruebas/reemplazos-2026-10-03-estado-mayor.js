// Reemplazos hechos el 2026-10-03 sobre el compilado de la Mesa del EM
// (calcos/assets/index-logistica-20261002.js → index-personal-20261003.js).
// Los pidió Sergio con capturas del panel del G-1: la F1·P3 «Apreciación Activa de
// PERSONAL» sólo decía «se baja desde el botón de Apreciación»; quería que TODOS los
// documentos del G-1 se trabajen como los del G-2 y el G-3 —📘 guía, 🌱 traer del calco,
// 🤖 IA que analiza todos los documentos del ejercicio y los calcos, Word de la hoja y Word
// con el formato militar— cada uno con la forma de su documento.
//
// Los ganchos son GENÉRICOS (motor calcos/estado-mayor/v1, ver su README): una sección
// se suma escribiendo su campos/<g>.js y registrándola en registro.js. Para el G-5 (o el
// EME) no hace falta tocar el compilado otra vez, salvo que necesite algo nuevo del calco.
//
// Ninguna inserción cae DENTRO de lo que insertaron listas anteriores (el G-4 sigue
// teniendo sus textos enteros): por eso algunos ganchos van después de los del G-4.
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer
// «veces» veces) y se cambió por «nuevo». construir-estado-mayor.js arma el compilado y
// comprueba que deshaciéndolos se vuelve byte por byte al anterior.
// Si se vuelve a compilar desde el fuente, esto es lo que hay que pasarle.
module.exports = [
  {
    nombre: 'Estado Mayor · módulos (calcos/estado-mayor/v1)',
    viejo: 'import {esHojaLog as SIDLogEs,tieneHojaLog as SIDLogTiene,textoHojaLog as SIDLogTexto} from "../logistica/v1/modelo.js";',
    nuevo:
      'import {esHojaLog as SIDLogEs,tieneHojaLog as SIDLogTiene,textoHojaLog as SIDLogTexto} from "../logistica/v1/modelo.js";import SIDEditorEM,{AyudaHoja as SIDEMAyuda} from "../estado-mayor/v1/editor.js";import {configurarEM,sincronizarEM as SIDEMSync} from "../estado-mayor/v1/runtime.js";import {fasesConDocumentos as SIDEMFases,esDocumento as SIDEMEs,tieneDocumento as SIDEMTiene,textoDocumento as SIDEMTexto,guiaIA as SIDEMGuia,pedidoHoja as SIDEMPedido} from "../estado-mayor/v1/registro.js";',
    veces: 1,
  },
  {
    nombre: 'Estado Mayor · las hojas de cada sección registrada pasan por el registro (uN)',
    viejo: 'function uN(t){const e=t.de;return[',
    nuevo: 'function uN(t){return SIDEMFases(t,SIDuN0(t))}function SIDuN0(t){const e=t.de;return[',
    veces: 1,
  },
  {
    nombre: 'Estado Mayor · «Mis hojas» monta el editor del documento (apreciación, anexo…)',
    viejo: ':SIDLogEs(I)?f.jsx(SIDEditorLog,{hoja:I,valor:U(I),onValor:H=>G(I,H),hojas:e,onExpediente:a,ctxDoc:i},I.id)',
    nuevo: ':SIDEMEs(I)?f.jsx(SIDEditorEM,{campo:t,hoja:I,valor:U(I),onValor:H=>G(I,H),hojas:e,onExpediente:a,ctxDoc:i},I.id):SIDLogEs(I)?f.jsx(SIDEditorLog,{hoja:I,valor:U(I),onValor:H=>G(I,H),hojas:e,onExpediente:a,ctxDoc:i},I.id)',
    veces: 1,
  },
  {
    nombre: 'Estado Mayor · las hojas de trabajo de siempre: 📘 guía y 🌱 traer del calco',
    viejo: 'I.nota&&f.jsx("div",{style:Wr.nota,children:I.nota}),te?',
    nuevo: 'I.nota&&f.jsx("div",{style:Wr.nota,children:I.nota}),!te&&!SIDEMEs(I)&&f.jsx(SIDEMAyuda,{campo:t,hoja:I,valor:U(I),onValor:H=>G(I,H),hojas:e,ctxDoc:i},"ayuda-"+I.id),te?',
    veces: 1,
  },
  {
    nombre: 'Estado Mayor · la IA de las hojas de trabajo recibe la guía, lo calculado y la doctrina de la sección',
    viejo: 'return cU(I,U(I),{expediente:q?.md||"",modo:H,seccion:x.seccion})',
    nuevo: 'return SIDEMPedido(t,I,cU(I,U(I),{expediente:q?.md||"",modo:H,seccion:x.seccion,ayuda:SIDEMGuia(t,I)}))',
    veces: 1,
  },
  {
    nombre: 'Estado Mayor · los documentos no son hojas de renglones para el panel genérico de IA',
    viejo: 'if(!t||["tiempo","remite"',
    nuevo: 'if(!t||t?.tipo==="docEM"||["tiempo","remite"',
    veces: 1,
  },
  {
    nombre: 'Estado Mayor · un documento tiene contenido si tiene texto (no por su «esquema»)',
    viejo: 'const{forma:n,claves:a}=KS(t,e);return e?n==="filas"?',
    nuevo: 'const{forma:n,claves:a}=KS(t,e);return e?SIDEMEs(t)?SIDEMTiene(t,e):n==="filas"?',
    veces: 1,
  },
  {
    nombre: 'Estado Mayor · el avance de «Mis hojas» cuenta bien los documentos',
    viejo: 'if(i.tipo==="dosListas"){(o.a||[]).concat(o.b||[]).some(s=>String(s??"").trim())&&a++;continue}Object.values(o).some(s=>String(s??"").trim())&&a++}}return{hechas:a,total:n.length,pct:n.length?Math.round(a/n.length*100):0}}function dN(',
    nuevo: 'if(i.tipo==="dosListas"){(o.a||[]).concat(o.b||[]).some(s=>String(s??"").trim())&&a++;continue}if(SIDEMEs(i)){SIDEMTiene(i,o)&&a++;continue}Object.values(o).some(s=>String(s??"").trim())&&a++}}return{hechas:a,total:n.length,pct:n.length?Math.round(a/n.length*100):0}}function dN(',
    veces: 1,
  },
  {
    nombre: 'Estado Mayor · en el expediente (y en los pedidos de las otras hojas) van como texto',
    viejo: 'if(SIDLogEs(t))return SIDLogTexto(t,e);const n=[]',
    nuevo: 'if(SIDLogEs(t))return SIDLogTexto(t,e);if(SIDEMEs(t))return SIDEMTexto(t,e);const n=[]',
    veces: 1,
  },
  {
    nombre: 'Estado Mayor · configurarEM() con lo que presta la Mesa',
    viejo:
      'configurarLogistica({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useEffect:je.useEffect,PanelIA:hU,encabezadoIA:Qq,corregirIA:uU,wordMilitar:Mx,registroMilitar:SIDMilHoja,vistaMilitar:SIDMilVista,mostrarDocx:SIDMilMostrar,catalogo:Ni,coordenada:Sc,leaflet:Rt});',
    nuevo:
      'configurarLogistica({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useEffect:je.useEffect,PanelIA:hU,encabezadoIA:Qq,corregirIA:uU,wordMilitar:Mx,registroMilitar:SIDMilHoja,vistaMilitar:SIDMilVista,mostrarDocx:SIDMilMostrar,catalogo:Ni,coordenada:Sc,leaflet:Rt});configurarEM({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useEffect:je.useEffect,PanelIA:hU,encabezadoIA:Qq,corregirIA:uU,wordMilitar:Mx,registroMilitar:SIDMilHoja,vistaMilitar:SIDMilVista,mostrarDocx:SIDMilMostrar,catalogo:Ni,coordenada:Sc,bajas:iC,resumenG2:voe});',
    veces: 1,
  },
  {
    nombre: 'Estado Mayor · la Mesa le pasa al motor el calco vivo, las hojas de todos y las acciones para acostar',
    viejo: ',CC=je.useCallback(()=>{ISe(Lt,lt).catch(Ee=>he(Ee.message))},[Lt,lt])',
    nuevo:
      ',SIDEMsync=je.useEffect(()=>{SIDEMSync({ops:Lt,unidades:dn,fasesCOA:Yn,bajasPorFase:Xr,conceptoApoyo:pn,misionLog:_,estadosRecursos:ho,evacuacion:Rr,orgTarea:uc,ordenSup:Tn,hojasG:Kr,g3:Ya,picb:$i,acciones:{herramienta:Ep,colocar:ur}})},[Lt,dn,Yn,Xr,pn,_,ho,Rr,uc,Tn,Kr,Ya,$i,Ep,ur]),CC=je.useCallback(()=>{ISe(Lt,lt).catch(Ee=>he(Ee.message))},[Lt,lt])',
    veces: 1,
  },
]
