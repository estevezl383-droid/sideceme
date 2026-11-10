// Reemplazos del 2026-11-10 sobre calcos/assets/index-fases-log-20261108.js → index-cae-organigrama-20261110.js.
// Sergio, con cuatro capturas:
//   1) H.T. 16: «la opción de poder mover y reacomodar los objetivos y que obviamente se sincronice todo» →
//      el rótulo O1/Oa… se arrastra (objetivos-indicados/v1/mover.mjs): toma el terreno clave a ≤ 3 km y
//      rehace las flechas del esquema de maniobra de cada forma acostada.
//   2-3) H.T. 17: «seleccionar 2 opciones, 1 para que sobre eso se vaya armando el CAE 1, otra para el CAE 2, y así
//      se pueda llenar automáticamente» la evaluación → botones «1️⃣ Es el CAE-1» / «2️⃣ Es el CAE-2» por forma
//      (cae-enemigo/v1/formas-cae.mjs): las dos formas quedan en el calco y su columna se llena sola.
//   4) F2·P3: «la opción disgregar esté en esa hoja… agregar manualmente las unidades que dependen de mi CE-II» →
//      recuadro con ⊞ Disgregar y 🪖 Agregar a mano; en 🪖 Unidades, «Depende de» y el organigrama tipo del CE
//      (organizacion/v1/organigrama.mjs).
// SHA-256 de index-fases-log-20261108.js (antes de estos reemplazos): ver construir-cae-organigrama.js.
module.exports = [
  {
    nombre: "Importa mover objetivos, CAE-1/CAE-2 de la H.T. 17 y el organigrama",
    viejo: "import {alGuardar as SIDLogGuardar,alCargar as SIDLogCargar} from \"../logistica/v1/fases-log.mjs?v=20261108-fases-log\";",
    nuevo: "import {alGuardar as SIDLogGuardar,alCargar as SIDLogCargar} from \"../logistica/v1/fases-log.mjs?v=20261108-fases-log\";import {moverObjetivo as SIDObjMover,avisoMovido as SIDObjMovAviso} from \"../objetivos-indicados/v1/mover.mjs?v=20261110\";import {caeDeManiobra as SIDCaeDe,llenarHT17 as SIDHt17Llenar,vaciarHT17 as SIDHt17Vaciar} from \"../cae-enemigo/v1/formas-cae.mjs?v=20261110\";import {PanelOrganizacion as SIDOrgPanel,CajaDependientes as SIDOrgCaja,ponerOrganigrama as SIDOrgPoner,fichaColocada as SIDOrgFicha} from \"../organizacion/v1/organigrama.mjs?v=20261110\";",
    veces: 1,
  },
  {
    nombre: "Carta (envoltorio): recibe onMoverObjetivo",
    viejo: "onMoverAIN:Dt,plantilla:jt=null,",
    nuevo: "onMoverAIN:Dt,onMoverObjetivo:SIDmo2,plantilla:jt=null,",
    veces: 1,
  },
  {
    nombre: "Carta (envoltorio): se lo pasa a la carta",
    viejo: "onMoverAIN:Dt,dibujando:tn})",
    nuevo: "onMoverAIN:Dt,onMoverObjetivo:SIDmo2,dibujando:tn})",
    veces: 1,
  },
  {
    nombre: "Carta: recibe onMoverObjetivo",
    viejo: "onMoverAIN:pe,dibujando:ve=!1})",
    nuevo: "onMoverAIN:pe,onMoverObjetivo:SIDmo,dibujando:ve=!1})",
    veces: 1,
  },
  {
    nombre: "Carta: el rótulo del objetivo se arrastra y la elipse lo sigue",
    viejo: "Rt.marker([dt.centro[1],dt.centro[0]],{interactive:!1,icon:Rt.divIcon({className:\"\",html:`<div style=\"color:${mt};font:800 ${Math.max(12,18*oe).toFixed(1)}px/1 Arial;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff;white-space:nowrap;text-align:center\">${dt.etiqueta}</div>`,iconSize:[60,22],iconAnchor:[30,11]})}).addTo(_n)})",
    nuevo: "(SIDom=>{dn&&SIDmo&&(SIDom.on(\"drag\",()=>{const SIDp=SIDom.getLatLng();nn.setLatLngs(fa(cK([SIDp.lng,SIDp.lat],Kt)))}),SIDom.on(\"dragend\",()=>{const SIDp=SIDom.getLatLng();SIDmo(ft,[Math.round(SIDp.lng*1e6)/1e6,Math.round(SIDp.lat*1e6)/1e6])}))})(Rt.marker([dt.centro[1],dt.centro[0]],{interactive:!!(dn&&SIDmo),draggable:!!(dn&&SIDmo),zIndexOffset:690,title:dn&&SIDmo?`Arrastrá ${dt.etiqueta} para moverlo`:\"\",icon:Rt.divIcon({className:\"\",html:`<div style=\"color:${mt};font:800 ${Math.max(12,18*oe).toFixed(1)}px/1 Arial;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff;white-space:nowrap;text-align:center${dn&&SIDmo?\";cursor:move\":\"\"}\">${dt.etiqueta}${dn&&SIDmo?\" ✥\":\"\"}</div>`,iconSize:[60,22],iconAnchor:[30,11]})}).addTo(_n))})",
    veces: 1,
  },
  {
    nombre: "Carta: la flecha dice su CAE (CAE-2 entrecortada)",
    viejo: "dashArray:dt.clase===\"fijacion\"?\"9 6\":null,interactive:dn}).addTo(_n);dn&&(yo(nn,j,\"maniobra\",ft,`esta flecha (${dt.etiqueta})`),nn.bindTooltip(`<b>${dt.etiqueta}</b>",
    nuevo: "dashArray:dt.clase===\"fijacion\"?\"9 6\":dt.cae===\"CAE-2\"?\"14 5\":null,interactive:dn}).addTo(_n);dn&&(yo(nn,j,\"maniobra\",ft,`esta flecha (${dt.etiqueta})`),nn.bindTooltip(`<b>${dt.cae?dt.cae+\" · \":\"\"}${dt.etiqueta}</b>",
    veces: 1,
  },
  {
    nombre: "Mesa: mover un objetivo rehace sus flechas",
    viejo: "DP=je.useCallback((Ee,Qe)=>{la(),Sn(ot=>({...ot,ains:(ot.ains||[]).map((ct,xt)=>xt!==Ee?ct:{...ct,centro:Qe})}))},[la]),",
    nuevo: "DP=je.useCallback((Ee,Qe)=>{la(),Sn(ot=>({...ot,ains:(ot.ains||[]).map((ct,xt)=>xt!==Ee?ct:{...ct,centro:Qe})}))},[la]),SIDMovObj=je.useCallback((Ee,Qe)=>{if(ll){Nl();return}const SIDpl=(uu()||{}).p||null,SIDo={claves:Jt?.clave||[],plantilla:SIDpl,rehacer:(SIDa,SIDb,SIDc)=>Z0e(SIDa,SIDb,{coa:\"probable\",forma:SIDc})};la(),Sn(ot=>SIDObjMover(ot,Ee,Qe,SIDo).ops),za(SIDObjMovAviso(SIDObjMover(Lt,Ee,Qe,SIDo)))},[la,uu,Jt,ll,Nl,za,Lt]),",
    veces: 1,
  },
  {
    nombre: "Mesa: le pasa a la carta cómo mover objetivos",
    viejo: "onMoverAIN:DP,",
    nuevo: "onMoverAIN:DP,onMoverObjetivo:SIDMovObj,",
    veces: 1,
  },
  {
    nombre: "Acostar forma: acepta cae",
    viejo: "iw=je.useCallback((Ee=null,{superponer:Qe=!1}={})=>{",
    nuevo: "iw=je.useCallback((Ee=null,{superponer:Qe=!1,cae:SIDcae=null}={})=>{",
    veces: 1,
  },
  {
    nombre: "Acostar forma: la forma del CAE reemplaza sólo a la de ese CAE",
    viejo: "maniobra:Qe?[...(Ht.maniobra||[]).filter(vn=>vn.forma!==on.resumen.forma),...on.flechas]:on.flechas})),za(`➤ ${on.resumen.maniobra} acostado",
    nuevo: "maniobra:SIDcae?[...(Ht.maniobra||[]).filter(vn=>vn.forma!==on.resumen.forma&&vn.cae!==SIDcae),...on.flechas.map(vn=>({...vn,cae:SIDcae}))]:Qe?[...(Ht.maniobra||[]).filter(vn=>vn.forma!==on.resumen.forma),...on.flechas]:on.flechas})),za((SIDcae?`${SIDcae}: `:\"\")+`➤ ${on.resumen.maniobra} acostado",
    veces: 1,
  },
  {
    nombre: "Acostar forma: aviso del CAE",
    viejo: "(Qe?\"Queda SOBRE las que ya estaban",
    nuevo: "(SIDcae?\"Queda junto al otro CAE; su columna de la H.T. 17 se llenó sola. \":Qe?\"Queda SOBRE las que ya estaban",
    veces: 1,
  },
  {
    nombre: "Formas: recibe cae/onCAE",
    viejo: "function sLe({formas:t,puestas:e=[],superponer:n=!1,onSuperponer:a,onAcostar:i,onQuitarForma:o,onQuitar:s,ver:r,onVer:u}){",
    nuevo: "function sLe({formas:t,puestas:e=[],superponer:n=!1,onSuperponer:a,onAcostar:i,onQuitarForma:o,onQuitar:s,ver:r,onVer:u,cae:SIDcae={},onCAE:SIDonCAE,onQuitarCAE:SIDqCAE}){",
    veces: 1,
  },
  {
    nombre: "Formas: explica CAE-1 / CAE-2",
    viejo: "\" Va UNA a la vez: acostar otra quita la que estaba, y volver a apretar la que está puesta la saca del calco.\"]})",
    nuevo: "\" Va UNA a la vez: acostar otra quita la que estaba, y volver a apretar la que está puesta la saca del calco.\",SIDonCAE?f.jsxs(\"div\",{style:{marginTop:6,color:\"#ffd27a\"},children:[\"🎯 \",f.jsx(\"b\",{children:\"Para la evaluación (abajo):\"}),\" con «1️⃣ Es el CAE-1» y «2️⃣ Es el CAE-2» elegí qué forma es cada curso de acción. Las dos quedan juntas en el calco y su columna (CONVENIENCIA, APLICABILIDAD, RIESGO, CONSISTENCIA) se llena sola; lo que vos escribas no se pisa.\"]}):null]})",
    veces: 1,
  },
  {
    nombre: "Formas: el título dice su CAE",
    viejo: "children:[y?\"🔴 PUESTA — \":\"\",h.nom]})",
    nuevo: "children:[y?\"🔴 PUESTA — \":\"\",SIDcae[h.id]?`${SIDcae[h.id]} · `:\"\",h.nom]})",
    veces: 1,
  },
  {
    nombre: "Formas: botones CAE-1 y CAE-2",
    viejo: "`➤ Acostar «${h.nom}»`})]},h.id)",
    nuevo: "`➤ Acostar «${h.nom}»`}),SIDonCAE&&f.jsx(\"div\",{style:{display:\"flex\",gap:6,marginTop:6},children:[\"CAE-1\",\"CAE-2\"].map(SIDc=>{const SIDon=SIDcae[h.id]===SIDc,SIDr=SIDc===\"CAE-1\";return f.jsx(\"button\",{\"data-cae\":SIDc,style:{flex:1,padding:\"8px 6px\",borderRadius:8,fontWeight:800,fontSize:13,cursor:\"pointer\",border:`2px solid ${SIDr?\"#ff5a5a\":\"#ffb020\"}`,background:SIDon?SIDr?\"#c62828\":\"#a86400\":\"transparent\",color:SIDon?\"#fff\":SIDr?\"#ff9a9a\":\"#ffcf70\"},title:SIDon?`«${h.nom}» es el ${SIDc}. Apretá para quitarla.`:`«${h.nom}» será el ${SIDc}: se acuesta junto al otro CAE y su columna de la evaluación se llena sola.`,onClick:()=>SIDon?SIDqCAE?.(SIDc,h.id):SIDonCAE?.(SIDc,h.id),children:SIDon?`✓ ${SIDc} — quitar`:`${SIDr?\"1️⃣\":\"2️⃣\"} Es el ${SIDc}`},SIDc)})})]},h.id)",
    veces: 1,
  },
  {
    nombre: "H.T. 17: elegir CAE acuesta la forma y llena su columna",
    viejo: "onAcostar:(de,he)=>U?.(de,he),onQuitarForma:de=>G?.(\"maniobra\",{forma:de}),",
    nuevo: "onAcostar:(de,he)=>U?.(de,he),cae:SIDCaeDe(n.ops?.maniobra),onCAE:(SIDc,SIDf)=>{U?.(SIDf,{superponer:!0,cae:SIDc});let SIDv=t;const SIDant=SIDCaeDe(n.ops?.maniobra)[SIDf];SIDant&&SIDant!==SIDc&&(SIDv={...SIDv,...SIDHt17Vaciar(SIDv,SIDant).cambios});const SIDr=SIDHt17Llenar(SIDv,SIDc,bE.find(SIDx=>SIDx.id===SIDf),{objetivos:n.ops?.objetivos||[]});e?.({...SIDv,...SIDr.cambios})},onQuitarCAE:(SIDc,SIDf)=>{G?.(\"maniobra\",{forma:SIDf});e?.({...t,...SIDHt17Vaciar(t,SIDc).cambios})},onQuitarForma:de=>G?.(\"maniobra\",{forma:de}),",
    veces: 1,
  },
  {
    nombre: "G-3: recibe Disgregar y Agregar a mano",
    viejo: "onAbrirDefensa:G,onAbrirUnidades:te}){const M=SIDEMMigrarG3(SIDM0);",
    nuevo: "onAbrirDefensa:G,onAbrirUnidades:te,SIDdisgregar:SIDdg3,SIDabrirOrg:SIDao3}){const M=SIDEMMigrarG3(SIDM0);",
    veces: 1,
  },
  {
    nombre: "F2·P3: recuadro con Disgregar y Agregar a mano",
    viejo: "Ke.autollena&&(Ke.id!==\"sincro\"||SIDDecAbierta(SIDctxCap))&&f.jsx(\"button\",{style:At.sembrar,onClick:()=>de(Ke),children:\"🌱 Traer del calco lo que falte\"})",
    nuevo: "Ke.id===\"tareas\"&&f.jsx(SIDOrgCaja,{R:{jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,Fragment:f.Fragment},unidades:I.SIDdn||t,unidad:I.unidad||\"\",onDisgregar:SIDdg3,onAgregar:SIDao3}),Ke.autollena&&(Ke.id!==\"sincro\"||SIDDecAbierta(SIDctxCap))&&f.jsx(\"button\",{style:At.sembrar,onClick:()=>de(Ke),children:\"🌱 Traer del calco lo que falte\"})",
    veces: 1,
  },
  {
    nombre: "Aviso de sembrar: dice dónde están Disgregar y Agregar a mano",
    viejo: "Si tu unidad está como UNA sola ficha (CE, DIV, BRIG.), en 🪖 Unidades tocá «⊞ Disgregar»: queda como su Puesto Comando y aparecen sus unidades dependientes.`",
    nuevo: "Si tu unidad está como UNA sola ficha (CE, DIV, BRIG.), en la F2·P3 (recuadro «🪖 Las unidades de…») o en 🪖 Unidades: «⊞ Disgregar» las lee de la Orden, y «🪖 Agregar a mano» te deja colocarlas una por una —o el organigrama entero del CE— bajo su dependencia.`",
    veces: 1,
  },
  {
    nombre: "Mesa: la F2·P3 disgrega y abre Unidades con Depende de",
    viejo: "onAbrirUnidades:()=>xi(\"unidades\",!1),onCerrar:()=>{Ga(!1),pr(null)}}",
    nuevo: "onAbrirUnidades:()=>xi(\"unidades\",!1),SIDdisgregar:SIDdgId=>{let SIDdgR=null;try{SIDdgR=SIDDisAccion({unidades:dn,id:SIDdgId,ordenSup:Tn,documentos:en})}catch(SIDe){console.warn(\"Disgregar:\",SIDe)}if(!SIDdgR)return;SIDdgR.unidades&&(SIDlaU(),Ra(SIDdgR.unidades));SIDdgR.aviso&&za(SIDdgR.aviso)},SIDabrirOrg:SIDm=>{mt(SIDa=>SIDm!=null?{...SIDa,bando:\"propias\",tipo:SIDa.tipo===\"instalacion\"?\"unidad\":SIDa.tipo,dependeDe:SIDm}:{...SIDa,bando:\"propias\",tipo:\"unidad\",escalon:\"cuerpo\",designacion:Tn?.unidad||SIDa.designacion||\"\"});xi(\"unidades\",!1);za(SIDm!=null?\"🪖 Unidades abierto en «Depende de» tu unidad: elegí una del organigrama (📍) o ⚡ ponelas todas; después volvé a la F2·P3 desde G-3.\":\"🪖 Colocá primero la ficha de tu unidad (ya está cargada en el formulario): «➕ Colocar unidad» y un clic en la carta.\")},onCerrar:()=>{Ga(!1),pr(null)}}",
    veces: 1,
  },
  {
    nombre: "Unidades: recibe ponerOrganigrama",
    viejo: "onDisgregar:SIDdg,geDisponible:u,",
    nuevo: "onDisgregar:SIDdg,SIDponerOrg:SIDpo,geDisponible:u,",
    veces: 1,
  },
  {
    nombre: "Unidades: bloque Organización (Depende de + organigrama del CE)",
    viejo: "f.jsx(\"div\",{style:wr.fila2,children:Object.values(OI).map(G=>f.jsx(\"button\",{onClick:()=>x(\"bando\",G.id),style:{...wr.bandoBtn,borderColor:G.color,background:e.bando===G.id?G.color:\"transparent\",color:e.bando===G.id?\"#fff\":G.color},children:G.nombre},G.id))}),",
    nuevo: "f.jsx(\"div\",{style:wr.fila2,children:Object.values(OI).map(G=>f.jsx(\"button\",{onClick:()=>x(\"bando\",G.id),style:{...wr.bandoBtn,borderColor:G.color,background:e.bando===G.id?G.color:\"transparent\",color:e.bando===G.id?\"#fff\":G.color},children:G.nombre},G.id))}),f.jsx(SIDOrgPanel,{R:{jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,Fragment:f.Fragment},unidades:t,actual:e,onActual:n,colocando:a,onToggleColocar:i,onPoner:SIDpo}),",
    veces: 1,
  },
  {
    nombre: "Unidades: la lista marca las dependientes",
    viejo: "f.jsx(\"span\",{style:wr.itemTxt,children:U(G)}),SIDdg&&",
    nuevo: "f.jsx(\"span\",{style:G.dependeDe!=null&&G.dependeDe!==\"\"?{...wr.itemTxt,paddingLeft:8,borderLeft:\"3px solid #5aa0ff\"}:wr.itemTxt,title:G.dependeDe!=null&&G.dependeDe!==\"\"?\"Depende de \"+(((t||[]).find(SIDx=>String(SIDx.id)===String(G.dependeDe))||{}).designacion||\"otra unidad\"):void 0,children:U(G)}),SIDdg&&",
    veces: 1,
  },
  {
    nombre: "Mesa: ⚡ poner el organigrama con deshacer",
    viejo: "SIDdgR.aviso&&za(SIDdgR.aviso)},geDisponible:GSe(),",
    nuevo: "SIDdgR.aviso&&za(SIDdgR.aviso)},SIDponerOrg:(SIDm,SIDl)=>{const SIDr=SIDOrgPoner(dn,SIDm,SIDl);if(!SIDr)return;SIDr.unidades&&(SIDlaU(),Ra(SIDr.unidades));SIDr.aviso&&za(SIDr.aviso)},geDisponible:GSe(),",
    veces: 1,
  },
  {
    nombre: "Colocar: la ficha lleva Depende de (sólo propias)",
    viejo: "Ra(ot=>[...ot,{id:Date.now()+Math.random(),lat:Ee,lng:Qe,...ft}])},[ft])",
    nuevo: "Ra(ot=>[...ot,{id:Date.now()+Math.random(),lat:Ee,lng:Qe,...SIDOrgFicha(ft)}])},[ft])",
    veces: 1,
  },
]
