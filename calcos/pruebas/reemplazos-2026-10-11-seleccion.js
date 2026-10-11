// Reemplazos del 2026-10-11 (noche) sobre calcos/assets/index-medidas-20261011.js →
// index-seleccion-20261011.js. Lo pidió Sergio (Profesor) con tres capturas: la Mesa con las áreas
// de empeño del CMOC, el membrete del Word y el panel del lazo («✂️ «CE-III» creada dentro de
// «FABBLE»… (3 zonas unidas)»):
//   · «quisiera que haya una opción que diga guardar selección como área y ahí yo le ponga el
//     nombre; debe ser idéntico a lo que se recortó y además debe seleccionar todo lo que está
//     activo… y luego yo pueda seleccionar el JSON donde se guarda con el nombre que le di y lo
//     comparta al curso o paralelo que le corresponda»;
//   · «las áreas de empeño no las puedo borrar: quiero borrar y no puedo»;
//   · «en los documentos estás escribiendo en el membrete y en las firmas FF.TT.T.O.
//     ()FUERZAS TERRESTRES DEL TEATRO DE OPERACIONES y es sólo esto: FF.TT.T.O.».
//
// El lazo, el recorte, las selecciones guardadas y el CMOC de adentro están en
// calcos/areas-operaciones (código legible); acá sólo:
//   · los tres imports de areas-operaciones con la versión nueva (?v=seleccion20261011);
//   · el panel ▧ Área de Operaciones le pasa al editor el CMOC (Jt), cómo sumarle lo que llega
//     (con la foto del deshacer del CMOC, Bo, y los candados de siempre) y qué capas están a la
//     vista (verCapa, ai): la selección lleva «todo lo que está activo»;
//   · Áreas de empeño: con el ▧ panel abierto (herramienta «areaops») o cualquier herramienta de
//     dibujo, el CMOC de la carta no responde al clic derecho (dibujando: es así para no
//     interrumpir el trazo) y por eso no se podían borrar. En «Qué se ve en el calco» el chip
//     «Áreas de empeño» prendido muestra la lista «🗑 AE 1 · AE 2 … · 🗑 Todas» (borra con el
//     deshacer del CMOC), el chip muestra cuántas hay (y el de terreno defensivo), y en la carta
//     cada una se rotula «AE 1», «AE 2»… (con una sola sigue «AE»);
//   · la firma del Word genérico de la Mesa pasa por SIDMembrete.sinDesarrollo (sólo la sigla);
//     el formato militar (runtime.js → word.js) con la versión nueva (?v=sigla20261011).
const V = '?v=seleccion20261011'
module.exports = [
  {
    nombre: 'Áreas · editor con versión nueva',
    viejo: 'import SIDAreasEditor from "../areas-operaciones/editor.mjs?v=lazo20261010";',
    nuevo: `import SIDAreasEditor from "../areas-operaciones/editor.mjs${V}";`,
    veces: 1,
  },
  {
    nombre: 'Áreas · compartir-modelo con versión nueva',
    viejo: 'from "../areas-operaciones/compartir-modelo.mjs?v=lazo20261010";',
    nuevo: `from "../areas-operaciones/compartir-modelo.mjs${V}";`,
    veces: 1,
  },
  {
    nombre: 'Áreas · modelo con versión nueva',
    viejo: 'from "../areas-operaciones/modelo.mjs?v=lazo20261010";',
    nuevo: `from "../areas-operaciones/modelo.mjs${V}";`,
    veces: 1,
  },
  {
    nombre: 'Panel del Área de Operaciones · recibe el CMOC y lo que está a la vista',
    viejo: 'function _Ce({SIDops,SIDonOps,SIDejercicio,SIDdeshacer,SIDnube,SIDunidades,SIDonUnidades,',
    nuevo: 'function _Ce({SIDops,SIDonOps,SIDejercicio,SIDdeshacer,SIDnube,SIDunidades,SIDonUnidades,SIDcmoc,SIDonCmoc,SIDverCapa,',
    veces: 1,
  },
  {
    nombre: 'Panel del Área de Operaciones · se lo pasa al editor',
    viejo: 'f.jsx(SIDAreasEditor,{react:je,ops:SIDops,onOps:SIDonOps,ejercicio:SIDejercicio,onDeshacer:SIDdeshacer,nube:SIDnube,unidades:SIDunidades,onUnidades:SIDonUnidades,escalon:y,herramienta:u,onHerramienta:h})',
    nuevo: 'f.jsx(SIDAreasEditor,{react:je,ops:SIDops,onOps:SIDonOps,ejercicio:SIDejercicio,onDeshacer:SIDdeshacer,nube:SIDnube,unidades:SIDunidades,onUnidades:SIDonUnidades,cmoc:SIDcmoc,onCmoc:SIDonCmoc,verCapa:SIDverCapa,escalon:y,herramienta:u,onHerramienta:h})',
    veces: 1,
  },
  {
    nombre: 'Mesa · el CMOC al panel (con el deshacer del CMOC y los candados de las fichas)',
    viejo: 'SIDejercicio:wn,SIDunidades:dn,',
    nuevo: 'SIDejercicio:wn,SIDcmoc:Jt,SIDverCapa:ai,SIDonCmoc:next=>{if(ll){Nl();return}if(Bn){he("🔒 Ejercicio finalizado: duplíquelo para editar.");return}ua(SIDq=>(Bo.current.push(SIDq),typeof next==="function"?next(SIDq):next))},SIDunidades:dn,',
    veces: 1,
  },
  {
    nombre: 'Qué se ve en el calco · recibe el CMOC y cómo borrar',
    viejo: 'conteos:se={},ops:Z=null}){',
    nuevo: 'conteos:se={},ops:Z=null,cmoc:SIDcm=null,onBorrarCmoc:SIDbc=null}){',
    veces: 1,
  },
  {
    nombre: 'Qué se ve en el calco · el chip «Áreas de empeño» prendido lista las AE para borrarlas',
    viejo: 'return(Ge.id==="avenidas"||Ge.id==="corredores")&&ne?f.jsxs(f.Fragment,{children:[fe,f.jsx(LN,{grupo:Ge.id})]},Ge.id):',
    nuevo: 'return Ge.id==="ae"&&ne&&SIDbc&&SIDcm?.ae?.length?f.jsxs(f.Fragment,{children:[fe,f.jsx(SIDListaAE,{lista:SIDcm.ae,onBorrar:SIDbc})]},Ge.id):(Ge.id==="avenidas"||Ge.id==="corredores")&&ne?f.jsxs(f.Fragment,{children:[fe,f.jsx(LN,{grupo:Ge.id})]},Ge.id):',
    veces: 1,
  },
  {
    nombre: 'Qué se ve en el calco · la lista de las AE con su 🗑',
    viejo: 'function LN({grupo:t}){',
    nuevo: 'function SIDListaAE({lista:t,onBorrar:e}){const SIDb=t.map((SIDx,SIDi)=>f.jsx("button",{type:"button",className:"ver-mini",title:`Borrar el AE ${SIDi+1} (↶ el deshacer del CMOC lo devuelve)`,onClick:()=>e("ae",SIDi),children:`🗑 AE ${t.length>1?SIDi+1:""}`.trim()},SIDi));t.length>1&&SIDb.push(f.jsx("button",{type:"button",className:"ver-mini",title:"Borrar todas las áreas de empeño del CMOC",onClick:()=>{window.confirm(`¿Borrar las ${t.length} áreas de empeño del CMOC? (↶ el deshacer del CMOC las devuelve)`)&&e("ae",-1)},children:`🗑 Todas (${t.length})`},"todas"));return f.jsxs("div",{className:"ver-sub",onClick:SIDv=>SIDv.stopPropagation(),children:[f.jsx("div",{className:"ver-sub-tit",children:"🗑 Borrar áreas de empeño (en la carta: clic derecho sobre el AE, con las herramientas de dibujo apagadas)"}),f.jsx("div",{className:"ver-sub-chips",children:SIDb})]})}function LN({grupo:t}){',
    veces: 1,
  },
  {
    nombre: 'Mesa · «Qué se ve en el calco» recibe el CMOC y el borrado (uno o todos)',
    viejo: 'f.jsx(Rve,{slotFases:VP,ops:Lt,',
    nuevo: 'f.jsx(Rve,{slotFases:VP,ops:Lt,cmoc:Jt,onBorrarCmoc:(SIDc,SIDi)=>{if(Bn){he("🔒 Ejercicio finalizado: duplíquelo para editar.");return}SIDi<0?ua(SIDq=>(Bo.current.push(SIDq),{...SIDq,[SIDc]:[]})):GN(SIDc,SIDi)},',
    veces: 1,
  },
  {
    nombre: 'Qué se ve en el calco · cuántas áreas de empeño y terrenos defensivos hay',
    viejo: 'conteos:{avenidas:(n=Jt.avenidas)==null?void 0:n.length,',
    nuevo: 'conteos:{ae:Jt.ae?.length,defensivo:Jt.defensivo?.length,avenidas:(n=Jt.avenidas)==null?void 0:n.length,',
    veces: 1,
  },
  {
    nombre: 'Carta 2D · cada área de empeño con su número (AE 1, AE 2…), como en la lista',
    viejo: '.bindTooltip("AE",{permanent:!0,direction:"center",className:"tt-ae"})',
    nuevo: '.bindTooltip((n.ae||[]).length>1?`AE ${X+1}`:"AE",{permanent:!0,direction:"center",className:"tt-ae"})',
    veces: 1,
  },
  {
    nombre: 'Word de la Mesa · en la firma sólo la sigla (FF.TT.T.O., no su desarrollo)',
    viejo: 'M.firma&&g.push(new Js({alignment:Ro.CENTER,spacing:{before:480,after:240},children:[Ed(M.firma,{bold:!0})]}))',
    nuevo: 'M.firma&&g.push(new Js({alignment:Ro.CENTER,spacing:{before:480,after:240},children:[Ed(SIDMembrete.sinDesarrollo(M.firma),{bold:!0})]}))',
    veces: 1,
  },
  {
    nombre: 'Formato militar · versión nueva (word.js con sólo la sigla en membrete y firma)',
    viejo: 'formato-militar/v1/runtime.js?v=membrete20261009',
    nuevo: 'formato-militar/v1/runtime.js?v=sigla20261011',
    veces: 1,
  },
]
