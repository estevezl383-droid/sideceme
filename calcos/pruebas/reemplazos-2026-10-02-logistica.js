// Reemplazos hechos el 2026-10-02 sobre el compilado de la Mesa del EM
// (calcos/assets/index-reconocimiento-20261001.js → index-logistica-20261002.js).
// Los pidió Sergio con capturas del panel del G-4 y tres textos de la Escuela
// (UU. CMDO. LOG. 2022, Texto UU. CMDO. LOG. y Texto CLFFTTTO 2016):
//   · la F1·P3 «Apreciación Activa de LOGÍSTICA» sólo decía «se baja desde el botón de
//     Apreciación»: ahora se TRABAJA ahí, con sus ideas y con IA, como las demás hojas
//     (y la F2·P13, la misma actualizada);
//   · la pestaña «▣ ASDI» no explicaba la diferencia entre ASDI y ARCE ni cómo se elige
//     el área: ahora tiene el PASO A PASO de la Escuela (entender, proponer áreas A/B,
//     verificar los datos generales de planeamiento, evaluar con la matriz de factores,
//     elegir y desplegar), todo medido sobre el calco y acostado en la carta;
//   · la MATRIZ DE SINCRONIZACIÓN LOGÍSTICA (lámina de la Escuela) es el producto final
//     del G-4: hoja nueva F7·P2;
//   · el F7·P1 Anexo de Apoyo de Servicio de Combate del G-4 también se trabaja en la hoja.
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer
// «veces» veces) y se cambió por «nuevo». construir-logistica.js arma el compilado y
// comprueba que deshaciéndolos se vuelve byte por byte al anterior.
// Si se vuelve a compilar desde el fuente, esto es lo que hay que pasarle.
//
// El código vive en archivos legibles aparte (calcos/logistica/v1/, ver su README).
module.exports = [
  {
    nombre: 'Logística · módulos (calcos/logistica/v1)',
    viejo: 'import {fusionable as SIDRecoFusionable,fusionarOrden as SIDRecoFusionar} from "../reconocimiento/v1/ia.js";',
    nuevo:
      'import {fusionable as SIDRecoFusionable,fusionarOrden as SIDRecoFusionar} from "../reconocimiento/v1/ia.js";import SIDEditorLog,{PasoAPaso as SIDLogPaso} from "../logistica/v1/editor.js";import {configurarLogistica,sincronizarLogistica as SIDLogSync} from "../logistica/v1/runtime.js";import {esHojaLog as SIDLogEs,tieneHojaLog as SIDLogTiene,textoHojaLog as SIDLogTexto} from "../logistica/v1/modelo.js";',
    veces: 1,
  },
  {
    nombre: 'Logística · la F1·P3 del G-4 se trabaja en la hoja (tipo «aprecLog»)',
    viejo:
      '{id:"aprecActiva",num:"F1·P3",nom:`Apreciación Activa de ${e}`,tipo:"remite",entrega:"NO SE DIFUNDE",nota:"Este documento la app ya lo escribe entero con lo que hay en el calco: se baja desde el botón de Apreciación de este mismo panel. Acá sólo queda anotado que en la fase 1 hay que actualizarlo."}',
    nuevo:
      '{id:"aprecActiva",num:"F1·P3",nom:`Apreciación Activa de ${e}`,tipo:t.id==="g4"?"aprecLog":"remite",entrega:"NO SE DIFUNDE",nota:t.id==="g4"?"La Apreciación de Situación de Logística se trabaja acá, apartado por apartado: 🌱 trae lo del calco (áreas, ejes, instalaciones, lo que midió la Mesa y la evaluación de las áreas) y lo de tus otras hojas; 💡 tus ideas van a la IA; 🤖 la IA la completa o la mejora; y sale en Word con el formato militar. En la fase 1 se elabora; en la fase 2 (F2·P13) se actualiza.":"Este documento la app ya lo escribe entero con lo que hay en el calco: se baja desde el botón de Apreciación de este mismo panel. Acá sólo queda anotado que en la fase 1 hay que actualizarlo."}',
    veces: 1,
  },
  {
    nombre: 'Logística · la F2·P13 del G-4 es la misma apreciación, actualizada',
    viejo:
      '{id:"aprecOrientacion",num:"F2·P13",nom:`Apreciación Activa de ${e} (actualizada)`,tipo:"remite",entrega:"NO SE DIFUNDE",nota:"La misma apreciación de la fase 1, ya actualizada con el análisis de la misión: es la que se expone en la orientación al Comandante. Se baja desde el botón de Apreciación de este panel."}',
    nuevo:
      '{id:"aprecOrientacion",num:"F2·P13",nom:`Apreciación Activa de ${e} (actualizada)`,tipo:t.id==="g4"?"aprecLog":"remite",entrega:"NO SE DIFUNDE",nota:t.id==="g4"?"La misma apreciación de la fase 1 (📋 Partir de la F1·P3), actualizada con el análisis de la misión: es la que se expone en la orientación al Comandante. Se trabaja igual: calco, ideas, IA y Word militar.":"La misma apreciación de la fase 1, ya actualizada con el análisis de la misión: es la que se expone en la orientación al Comandante. Se baja desde el botón de Apreciación de este panel."}',
    veces: 1,
  },
  {
    nombre: 'Logística · la Matriz de sincronización logística (F7·P2), producto final del G-4',
    viejo:
      'hojas:[{id:"anexo",num:"F7·P1",nom:`Anexo de ${e} a la Orden General de Operaciones`,tipo:"remite",entrega:"SE DIFUNDE con la Orden",nota:"La app ya escribe este anexo con lo que hay en el calco y en las hojas: se baja desde el botón de Anexo de este panel. Revisalo antes de firmarlo."}]',
    nuevo:
      'hojas:[{id:"anexo",num:"F7·P1",nom:`Anexo de ${e} a la Orden General de Operaciones`,tipo:t.id==="g4"?"anexoLog":"remite",entrega:"SE DIFUNDE con la Orden",nota:t.id==="g4"?"El Anexo de Apoyo de Servicio de Combate se trabaja acá: 🌱 trae el calco, el concepto por fase, la Matriz de sincronización (SEGAR) y la Apreciación; 💡 tus ideas; 🤖 la IA; y sale en Word con el formato militar (el cuadro de revisión pide la letra del anexo y la Orden). Revisalo antes de firmarlo.":"La app ya escribe este anexo con lo que hay en el calco y en las hojas: se baja desde el botón de Anexo de este panel. Revisalo antes de firmarlo."},...t.id==="g4"?[{id:"matrizSinc",num:"F7·P2",nom:"Matriz de sincronización logística",tipo:"matrizLog",entrega:"SE DIFUNDE con la Orden · producto final del G-4",nota:"Sincroniza cada función logística con cada fase de la operación (desde — hasta), con la forma de la lámina de la Escuela: secciones de la Zona de Etapas, enfoque y prioridad de apoyo, abastecimiento (centros, EPA/ESA), evacuación y hospitalización (hospitales, norma, PA, EPE/ESE), transporte, mantenimiento, recuperación y nivel de amenaza en el área de retaguardia. Se llena con el calco y con el concepto de apoyo por fase, con tus ideas y con IA, y se acuesta sobre el calco."}]:[]]',
    veces: 1,
  },
  {
    nombre: 'Logística · «Mis hojas» del G-4 monta el editor de la apreciación y de la matriz',
    viejo: ':f.jsxs(f.Fragment,{children:[!HS.includes(I.id)&&f.jsxs("div",{style:Wr.filaCab,children:[f.jsx("button",{style:Wr.btnSec,onClick:()=>g({html:AD(I,U(I)',
    nuevo: ':SIDLogEs(I)?f.jsx(SIDEditorLog,{hoja:I,valor:U(I),onValor:H=>G(I,H),hojas:e,onExpediente:a,ctxDoc:i},I.id):f.jsxs(f.Fragment,{children:[!HS.includes(I.id)&&f.jsxs("div",{style:Wr.filaCab,children:[f.jsx("button",{style:Wr.btnSec,onClick:()=>g({html:AD(I,U(I)',
    veces: 1,
  },
  {
    nombre: 'Logística · una hoja de logística tiene contenido si tiene texto (no por su «esquema»)',
    viejo: 'function Foe(t,e){const{forma:n,claves:a}=KS(t,e);return e?',
    nuevo: 'function Foe(t,e){if(SIDLogEs(t))return SIDLogTiene(t,e);const{forma:n,claves:a}=KS(t,e);return e?',
    veces: 1,
  },
  {
    nombre: 'Logística · el avance de «Mis hojas» cuenta bien las hojas de logística',
    viejo: 'function mDe(t,e={}){const n=fDe(t);let a=0;for(const i of n){const o=e[i.id];if(o){if(Array.isArray(o))',
    nuevo: 'function mDe(t,e={}){const n=fDe(t);let a=0;for(const i of n){const o=e[i.id];if(SIDLogEs(i)){SIDLogTiene(i,o)&&a++;continue}if(o){if(Array.isArray(o))',
    veces: 1,
  },
  {
    nombre: 'Logística · no son hojas de renglones para el panel genérico de IA',
    viejo: '["tiempo","remite","lineaTiempo","conceptos","riesgo","reconocimiento"].includes(t.tipo)',
    nuevo: '["tiempo","remite","lineaTiempo","conceptos","riesgo","reconocimiento","aprecLog","matrizLog","anexoLog"].includes(t.tipo)',
    veces: 1,
  },
  {
    nombre: 'Logística · en el expediente (y en los pedidos de las otras hojas) van como texto',
    viejo: 'if(t?.tipo==="riesgo")return SIDRiesgoTexto(e);if(t?.tipo==="reconocimiento")return SIDRecoTexto(e);',
    nuevo: 'if(t?.tipo==="riesgo")return SIDRiesgoTexto(e);if(t?.tipo==="reconocimiento")return SIDRecoTexto(e);if(SIDLogEs(t))return SIDLogTexto(t,e);',
    veces: 1,
  },
  {
    nombre: 'Logística · la pestaña «▣ ASDI» empieza con el paso a paso',
    viejo: 'Re==="asdi"&&f.jsxs("div",{style:fn.cuerpo,children:[f.jsxs("div",{style:fn.ayuda,children:["El ASDI no se dibuja libre: es el ",',
    nuevo:
      'Re==="asdi"&&f.jsxs("div",{style:fn.cuerpo,children:[f.jsx(SIDLogPaso,{hojas:e,onHojas:n,onExpediente:a,ctxDoc:i,orden:o,onSeleccionarArea:Ie}),f.jsx("div",{style:fn.subtit,children:"DESPLIEGUE DEL BATALLÓN LOGÍSTICO EN EL ÁREA (después de elegirla)"}),f.jsxs("div",{style:fn.ayuda,children:["El ASDI no se dibuja libre: es el ",',
    veces: 1,
  },
  {
    nombre: 'Logística · la Mesa le pasa al módulo el calco vivo y las acciones para acostar',
    viejo: 'GP=Object.values(nh).filter(Ee=>Z[Ee.id]);if(Ne===null)return',
    nuevo:
      'GP=Object.values(nh).filter(Ee=>Z[Ee.id]);je.useEffect(()=>{SIDLogSync({ops:Lt,unidades:dn,fasesCOA:Yn,conceptoApoyo:pn,misionLog:_,herramienta:ba,zonaLogTipo:Hi,acciones:{ajustarZona:AC,setOps:Sn,herramienta:Ep,zonaLogTipo:Tr,desplegar:tw}})},[Lt,dn,Yn,pn,_,ba,Hi,AC,Ep,tw]);if(Ne===null)return',
    veces: 1,
  },
  {
    nombre: 'Logística · en la carta, las áreas propuestas (A, B…) van con línea discontinua y su letra',
    viejo:
      'Kt=Rt.polygon(fa(dt.coords),{color:hd,weight:3.5,fillColor:hd,fillOpacity:.06,interactive:dn}).addTo(_n),nn=Number.isFinite(dt.division)?dt.division:null,cn=wve[dt.zona]||[mt.abrev],Nn=nn?[...cn.slice(0,-1),`${cn[cn.length-1]} ${nn}`]:cn,Vt=nn?`${mt.abrev} ${nn}`:mt.abrev;',
    nuevo:
      'Kt=Rt.polygon(fa(dt.coords),{color:hd,weight:3.5,fillColor:hd,fillOpacity:.06,interactive:dn,dashArray:dt.propuesta&&!dt.elegida?"12 8":null}).addTo(_n),nn=Number.isFinite(dt.division)?dt.division:null,cn=wve[dt.zona]||[mt.abrev],Nn=dt.propuesta&&!dt.elegida?[`ÁREA ${dt.propuesta}`,"(PROPUESTA)"]:nn?[...cn.slice(0,-1),`${cn[cn.length-1]} ${nn}`]:cn,Vt=dt.propuesta&&!dt.elegida?`Área ${dt.propuesta} · ${mt.abrev}`:nn?`${mt.abrev} ${nn}`:mt.abrev;',
    veces: 1,
  },
  {
    nombre: 'Logística · también en el 3D y en lo que se exporta',
    viejo: 'for(const i of t.zonasLog||[])a(m2(i.coords,{tipo:"zonaLog",color:f2,grosor:2.5,relleno:.07,nom:i.zona==="asdi"?`ÁREA SERV. DIV. ${i.division||1}`:(i.zona||"").toUpperCase()}));',
    nuevo:
      'for(const i of t.zonasLog||[])a(m2(i.coords,{tipo:"zonaLog",color:f2,grosor:2.5,relleno:.07,punteado:i.propuesta&&!i.elegida?1:0,nom:i.propuesta&&!i.elegida?`ÁREA ${i.propuesta} (PROPUESTA)`:i.zona==="asdi"?`ÁREA SERV. DIV. ${i.division||1}`:(i.zona||"").toUpperCase()}));',
    veces: 1,
  },
  {
    nombre: 'Logística · configurarLogistica() con lo que presta la Mesa',
    viejo:
      'configurarReconocimiento({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,PanelIA:hU,encabezadoIA:Qq,corregirIA:uU,semilla:l3e,wordMilitar:Mx,registroMilitar:SIDMilHoja,vistaMilitar:SIDMilVista,mostrarDocx:SIDMilMostrar});',
    nuevo:
      'configurarReconocimiento({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,PanelIA:hU,encabezadoIA:Qq,corregirIA:uU,semilla:l3e,wordMilitar:Mx,registroMilitar:SIDMilHoja,vistaMilitar:SIDMilVista,mostrarDocx:SIDMilMostrar});configurarLogistica({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useEffect:je.useEffect,PanelIA:hU,encabezadoIA:Qq,corregirIA:uU,wordMilitar:Mx,registroMilitar:SIDMilHoja,vistaMilitar:SIDMilVista,mostrarDocx:SIDMilMostrar,catalogo:Ni,coordenada:Sc,leaflet:Rt});',
    veces: 1,
  },
]
