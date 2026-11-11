// Reemplazos del 2026-11-11 sobre calcos/assets/index-cae-organigrama-20261110.js → index-ruta-cap-20261111.js.
// Sergio: «armar los dos cursos de acción propio está muy confuso… cada curso de acción debe seguir los pasos
// (F3·P3 → F3·P6)… primero se termine un curso de acción CAP 1 y luego vuelva la opción para generar otro desde el
// principio… en cada curso de acción es necesario colocar su plan de fuegos y su barrera de obstáculos… los planes de
// fuegos automáticamente deben salir de las unidades de artillería». Ver cap-propios/README.md (11-11-2026).
// SHA-256 de index-cae-organigrama-20261110.js (antes de estos reemplazos): ver construir-ruta-cap.js.
module.exports = [
  {
    nombre: 'Importa el recorrido de los CAP (panel.js con ?v nuevo)',
    viejo: 'import SIDCapPanel,{configurarCAP as SIDCapConfig,botonesCAP as SIDCapBotones,pedidoCAP as SIDCapPedido,cartaParaDocumentos as SIDCapDocs} from "../cap-propios/v1/panel.js?v=decision20261108";',
    nuevo: 'import SIDCapPanel,{configurarCAP as SIDCapConfig,botonesCAP as SIDCapBotones,pedidoCAP as SIDCapPedido,cartaParaDocumentos as SIDCapDocs,rutaCAP as SIDCapRuta} from "../cap-propios/v1/panel.js?v=ruta20261111";',
    veces: 1,
  },
  {
    nombre: 'La acción de los CAP (cerrar, nuevo, fuegosCAP) con ?v nuevo',
    viejo: 'import {accion as SIDCapAccion} from "../cap-propios/v1/proponer.mjs?v=iti20261025";',
    nuevo: 'import {accion as SIDCapAccion} from "../cap-propios/v1/proponer.mjs?v=ruta20261111";',
    veces: 1,
  },
  {
    nombre: 'La acción de los CAP recibe el plan de fuegos a la vista',
    viejo: 'setPlan:setPlanFuegos,activarFase:',
    nuevo: 'setPlan:setPlanFuegos,plan:planFuegos,activarFase:',
    veces: 1,
  },
  {
    nombre: 'La acción de los CAP se rehace cuando cambia el plan de fuegos',
    viejo: '[Yn,Ya,fo,dn,Lt,Qr,yt,ll,Bn,Nl,za]),Tg=',
    nuevo: '[Yn,Ya,fo,dn,Lt,Qr,yt,ll,Bn,Nl,za,planFuegos]),Tg=',
    veces: 1,
  },
  {
    nombre: 'El Tablero del G-3 recibe el plan de fuegos (para el paso 🔥 del recorrido)',
    viejo: 'cmoc:Jt,SIDdn:dn,SIDcap:SIDcapAcc}',
    nuevo: 'cmoc:Jt,SIDdn:dn,SIDcap:SIDcapAcc,SIDplan:planFuegos}',
    veces: 1,
  },
  {
    nombre: '📄 Documentos: la lista recibe lo del recorrido',
    viejo: 'H==="docs"&&f.jsx(TLe,{avance:He,fase:Z,setFase:pe,g3:M,setHojaId:se,setPrevia:_e,ctxDoc:ne,aporte:U})',
    nuevo: 'H==="docs"&&f.jsx(TLe,{avance:He,fase:Z,setFase:pe,g3:M,setHojaId:se,setPrevia:_e,ctxDoc:ne,aporte:U,SIDruta:{g3:M,acc:I.SIDcap,abrir:se,tab:q,defensa:G,ctx:{unidades:I.SIDdn||t,ordenSup:I.ordenSup||{},unidad:I.unidad||"",picb:I.picb||{},ops:I.ops||{},cmoc:I.cmoc||{},fasesCOA:I.fasesCOA||{},faseActiva:I.faseActiva||null,SIDplan:I.SIDplan}}})',
    veces: 1,
  },
  {
    nombre: '📄 Documentos: la lista acepta el recorrido',
    viejo: 'function TLe({avance:t,fase:e,setFase:n,g3:a,setHojaId:i,setPrevia:o,ctxDoc:s,aporte:r=null})',
    nuevo: 'function TLe({avance:t,fase:e,setFase:n,g3:a,setHojaId:i,setPrevia:o,ctxDoc:s,aporte:r=null,SIDruta:SIDrt=null})',
    veces: 1,
  },
  {
    nombre: '📄 Documentos → 3 · Desarrollar los CAP: el recorrido CAP 1 → CAP 2 arriba de las hojas',
    viejo: 'y&&f.jsxs("div",{style:At.pieChico,children:["📕 ",Ioe]})',
    nuevo: 'y&&u.id===3&&SIDrt&&SIDCapRuta(SIDrt),y&&f.jsxs("div",{style:At.pieChico,children:["📕 ",Ioe]})',
    veces: 1,
  },
  {
    nombre: 'F3·P3 a F3·P6: el recorrido compacto arriba de la hoja',
    viejo: '(Ke.id==="coa"||Ke.id==="concepto")&&f.jsx(SIDCapPanel',
    nuevo: '["organizacion","concepto","comandos","coa"].includes(Ke.id)&&SIDCapRuta({g3:M,acc:I.SIDcap,abrir:se,tab:q,defensa:G,ctx:{...SIDctxCap,SIDplan:I.SIDplan},hoja:Ke.id,compacto:!0}),(Ke.id==="coa"||Ke.id==="concepto")&&f.jsx(SIDCapPanel',
    veces: 1,
  },
]
