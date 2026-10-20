// Reemplazos del 2026-10-20 sobre calcos/assets/index-objetivos-indicados-20261020.js → index-ht19-fases-20261020.js.
// Lo pidió Sergio con la H.T. 19 bajada en Word: «la brigada tiene todos estos elementos (13) … OC-2 vacío,
// OC-3 vacío, ART., MORT., AAC. vacío … debería ser la explicación para cada fase: en la FASE I cada unidad
// con su tarea y propósito, excepto la artillería y otras que tienen diferente formato; después la FASE II,
// la misma estructura con otro contenido … respuestas más cortas y precisas: TAREA Y PROPÓSITO».
//
// Qué pasaba: la hoja tenía renglones fijos (OC-1…OC-3, OD, ART., MORT., AAC.) sin nombre salvo OC/OD; la
// siembra ponía nombre sólo a 4 fichas de maniobra; el resto de la Brigada no tenía dónde ir. Se imprimía
// por sistema operativo con las fases en columnas, y la IA recibía la regla general de «dos a cuatro
// oraciones por campo».
//
// Qué se hace (la lógica está en calcos/ht19-cae/v1/cae.mjs):
//   · la siembra reparte TODAS las fichas enemigas en su sistema operativo (_items / _nom de la hoja);
//   · editor, vista previa, Word .doc y Word .docx van FASE POR FASE, un cuadro por sistema operativo;
//   · la IA recibe los renglones con el nombre de cada unidad, fase por fase, y las reglas cortas
//     (una oración, tarea con verbo táctico, propósito con «Para…», distinto en cada fase); la H.T. 19
//     se pide entera (tope 320 casillas en vez de 160).
//
// SHA-256 de index-objetivos-indicados-20261020.js (antes de estos reemplazos): feb9ffd5f415a20f6909be4c53037e0383a8ad40e2ac452be9d5bcf1d6832290

module.exports = [
  {
    nombre: "Import del módulo de la H.T. 19",
    viejo: "import {objetivosIndicados as SIDObjInd,",
    nuevo: "import {elementosCAE as SIDCaeElem,socbCAE as SIDCaeSocb,etiquetaCAE as SIDCaeEtiq,prepCAE as SIDCaePrep,htmlCAE as SIDCaeHtml,docxCAE as SIDCaeDocx,extraCAE as SIDCaeExtra} from \"../ht19-cae/v1/cae.mjs?v=ht19fases20261020\";import {objetivosIndicados as SIDObjInd,",
    veces: 1,
  },
  {
    nombre: "Siembra (UIe ht19): TODOS los elementos del calco, cada uno en su sistema operativo",
    viejo: "{const Oa=H.find(Ob=>Ob&&Ob.coa===\"probable\")||H[0],Oc=(Oa&&Array.isArray(Oa.unidades)?Oa.unidades:e.unidades||[]).filter(Ob=>Ob&&(Ob.bando===\"enemigo\"||Ob.bando===\"enemigas\")&&[\"e1\",\"e2\",\"flanqueo\",\"reserva\"].includes(Ob.rol)),Od=Oc.find(Ob=>/\\(OD\\)/.test(Ob.designacion||\"\"));if(Od){const Oe={e1:0,e2:1,flanqueo:1,reserva:2},Of=[\"equipo\",\"escuadra\",\"seccion\",\"compania\",\"batallon\",\"regimiento\",\"brigada\",\"division\",\"cuerpo\",\"ejercito\"];K[\"MANIOBRA|OD|Unidad\"]=Od.designacion,Oc.filter(Ob=>Ob!==Od).map((Ob,Og)=>({Ob,Og})).sort((Oh,Oi)=>Oe[Oh.Ob.rol]-Oe[Oi.Ob.rol]||Of.indexOf(Oi.Ob.escalon)-Of.indexOf(Oh.Ob.escalon)||Oh.Og-Oi.Og).slice(0,3).forEach(({Ob},Og)=>{Ob.designacion&&(K[`MANIOBRA|OC-${Og+1}|Unidad`]=Ob.designacion)})}}",
    nuevo: "{const SIDe=SIDCaeElem(e);SIDe&&(K._items=SIDe._items,K._nom=SIDe._nom)}",
    veces: 1,
  },
  {
    nombre: "Claves de la IA (KS cae): fase por fase, con los renglones y los nombres de ESTE ejercicio",
    viejo: "for(const E of t.socb||[])for(const S of E.items||[])for(const M of v)for(const T of E.campos||[]){const I=vD(S,y);x.push(g(`${E.nom}|${S}|${M}|${T}`,`${E.nom}${S===\"—\"?\"\":` · ${I}`} · ${M} · ${T}`))}",
    nuevo: "for(const M of v)for(const E of SIDCaeSocb(t,y))for(const S of E.items||[])for(const T of E.campos||[]){const I=SIDCaeEtiq(E.nom,S,y);x.push(g(`${E.nom}|${S}|${M}|${T}`,`${M} · ${S===\"—\"?I:`${E.nom} · ${I}`} · ${T}`))}",
    veces: 1,
  },
  {
    nombre: "Tope de casillas por pedido: la H.T. 19 va entera (1)",
    viejo: "v.length>sU&&(x=",
    nuevo: "v.length>(t?.tipo===\"cae\"?320:sU)&&(x=",
    veces: 1,
  },
  {
    nombre: "Tope de casillas por pedido: la H.T. 19 va entera (2)",
    viejo: "primeras ${sU};",
    nuevo: "primeras ${t?.tipo===\"cae\"?320:sU};",
    veces: 1,
  },
  {
    nombre: "Tope de casillas por pedido: la H.T. 19 va entera (3)",
    viejo: "v=v.slice(0,sU))",
    nuevo: "v=v.slice(0,t?.tipo===\"cae\"?320:sU))",
    veces: 1,
  },
  {
    nombre: "Pedido a la IA (cU): las reglas cortas de tarea y propósito de la H.T. 19",
    viejo: "T=wje(t,v,r),",
    nuevo: "T=SIDCaeExtra(t,e,v,wje(t,v,r)),",
    veces: 1,
  },
  {
    nombre: "Vista previa y Word .doc (ED): fase por fase",
    viejo: "if(t.tipo===\"cae\"){const r=a._fases&&a._fases.length?a._fases:t.fases,u=`<table>${t.cabecera.map(g=>`<tr><td class=\"rot\">${wa(g)}</td><td>${i(a[g])}</td></tr>`).join(\"\")}</table>`,h=t.socb.map(g=>{const v=g.items.flatMap(x=>g.campos.map((E,S)=>`<tr>${S===0?`<td class=\"rot\" rowspan=\"${g.campos.length}\">${wa(x===\"—\"?g.nom:vD(x,a))}</td>`:\"\"}<td>${wa(E)}</td>${r.map(M=>`<td>${i(a[`${g.nom}|${x}|${M}|${E}`])}</td>`).join(\"\")}</tr>`)).join(\"\");return`<h3>${wa(g.nom)}</h3><table>\n        <tr><th>Elemento</th><th>Campo</th>${r.map(x=>`<th>${wa(x)}</th>`).join(\"\")}</tr>\n        ${v}</table>`}).join(\"\"),y=`<table>${t.cierre.map(g=>`<tr><td class=\"rot\">${wa(g)}</td><td>${i(a[g])}</td></tr>`).join(\"\")}</table>`;return u+h+\"<h3>Cierre</h3>\"+y}",
    nuevo: "if(t.tipo===\"cae\")return SIDCaeHtml(t,a,{wa,celda:i});",
    veces: 1,
  },
  {
    nombre: "Word .docx (I3e): fase por fase",
    viejo: "function I3e(t,e){const n=e!=null&&e._fases&&e._fases.length?e._fases:t.fases,a=[];let i=!1;const o=t.cabecera.map(r=>[{t:r.toUpperCase(),bold:!0},Ac(e?.[r])]);o.some(r=>ZS(r.slice(1)))&&(i=!0),a.push({titulo:\"\",sinRotulo:!0,tabla:{cabecera:[],filas:o,anchos:[3,8]}});for(const r of t.socb){const u=[];for(const h of r.items)r.campos.forEach((y,g)=>{u.push([g===0?{t:h===\"—\"?r.nom:vD(h,e),bold:!0,vMerge:r.campos.length>1?\"restart\":void 0}:{t:\"\",vMerge:\"cont\"},{t:y,bold:!0},...n.map(v=>Ac(e?.[`${r.nom}|${h}|${v}|${y}`]))])});u.some(h=>ZS(h.slice(2)))&&(i=!0),a.push({titulo:r.nom,sinRotulo:!0,tabla:{cabecera:[{t:\"ELEMENTO\"},{t:\"CAMPO\"},...n.map(h=>({t:h.toUpperCase()}))],filas:u,anchos:[3,2,...n.map(()=>3)]}})}const s=t.cierre.map(r=>[{t:r.toUpperCase(),bold:!0},Ac(e?.[r])]);return s.some(r=>ZS(r.slice(1)))&&(i=!0),a.push({titulo:\"\",sinRotulo:!0,tabla:{cabecera:[],filas:s,anchos:[3,8]}}),i?a:null}",
    nuevo: "function I3e(t,e){return SIDCaeDocx(t,e,{Ac,ZS})}",
    veces: 1,
  },
  {
    nombre: "Tablero del G-2 (pedido): la hoja va con sus elementos",
    viejo: "return cU(nt,t[nt.id],{expediente:de?.md||\"\",ayuda:yie(nt.id)",
    nuevo: "return cU(nt,SIDCaePrep(nt,t[nt.id],n),{expediente:de?.md||\"\",ayuda:yie(nt.id)",
    veces: 1,
  },
  {
    nombre: "Tablero del G-2 (aplicar): la respuesta se lee con los mismos elementos (1)",
    viejo: "const he=dU(oe,nt,Ge,t[nt.id]);",
    nuevo: "const SIDh=SIDCaePrep(nt,t[nt.id],n),he=dU(oe,nt,Ge,SIDh);",
    veces: 1,
  },
  {
    nombre: "Tablero del G-2 (aplicar): la respuesta se lee con los mismos elementos (2)",
    viejo: "sP({[nt.id]:t[nt.id]},{[nt.id]:he.datos}",
    nuevo: "sP({[nt.id]:SIDh},{[nt.id]:he.datos}",
    veces: 1,
  },
  {
    nombre: "Editor de la hoja: primero quién es quién, después FASE POR FASE cada elemento con sus campos",
    viejo: "t.socb.map(T=>f.jsxs(\"div\",{children:[f.jsx(\"div\",{style:Wt.rotulo,children:T.nom}),T.items.map(I=>f.jsxs(\"div\",{style:Wt.sub,children:[I!==\"—\"&&(T.nom===\"MANIOBRA\"?f.jsxs(\"label\",{style:{...Wt.subNom,display:\"flex\",gap:6,alignItems:\"center\"},children:[I,f.jsx(\"input\",{style:{...Wt.input2,flex:1},placeholder:\"Unidad que la ejecuta\",value:v[`MANIOBRA|${I}|Unidad`]||\"\",onChange:G=>o({...v,[`MANIOBRA|${I}|Unidad`]:G.target.value})})]}):f.jsx(\"div\",{style:Wt.subNom,children:vD(I,v)})),M.map(j=>f.jsxs(\"div\",{style:Wt.fase,children:[f.jsx(\"div\",{style:Wt.faseNom,children:j}),T.campos.map(B=>{const U=`${T.nom}|${I}|${j}|${B}`;return f.jsx(\"input\",{style:Wt.input2,placeholder:B,value:v[U]||\"\",onChange:G=>o({...v,[U]:G.target.value})},B)})]},j))]},I))]},T.nom)),",
    nuevo: "(()=>{const SG=SIDCaeSocb(t,v),SM=(SG.find(T=>T.nom===\"MANIOBRA\")||{items:[]}).items.filter(I=>I!==\"—\");return[f.jsx(\"div\",{style:Wt.rotulo,children:\"Maniobra — quién es quién\"},\"SIDqq\"),...SM.map(I=>f.jsxs(\"label\",{style:{...Wt.subNom,display:\"flex\",gap:6,alignItems:\"center\"},children:[I,f.jsx(\"input\",{style:{...Wt.input2,flex:1},placeholder:((v._nom||{})[`MANIOBRA|${I}`])||\"Unidad que la ejecuta\",value:v[`MANIOBRA|${I}|Unidad`]||\"\",onChange:G=>o({...v,[`MANIOBRA|${I}|Unidad`]:G.target.value})})]},\"SIDu\"+I)),...M.map(j=>f.jsxs(\"div\",{style:Wt.sub,children:[f.jsx(\"div\",{style:{...Wt.rotulo,fontSize:13},children:j}),SG.map(T=>f.jsxs(\"div\",{children:[f.jsx(\"div\",{style:Wt.faseNom,children:T.nom}),T.items.map(I=>f.jsxs(\"div\",{style:Wt.fase,children:[f.jsx(\"div\",{style:Wt.subNom,children:SIDCaeEtiq(T.nom,I,v)}),T.campos.map(B=>{const U=`${T.nom}|${I}|${j}|${B}`;return f.jsx(\"input\",{style:Wt.input2,placeholder:B,title:B,value:v[U]||\"\",onChange:G=>o({...v,[U]:G.target.value})},B)})]},I))]},T.nom))]},\"SIDf\"+j))]})(),",
    veces: 1,
  },
  {
    nombre: "Guía de la H.T. 19 (para qué sirve y cómo se llena)",
    viejo: "ht19:{para:\"El curso de acción enemigo desarrollado fase por fase y sistema por sistema. Es lo que se pone sobre la mesa en el juego de guerra.\",como:[\"Arriba: quién, qué, cuándo, dónde y con qué fuerza.\",\"Después, por cada fase, qué hace cada sistema operativo: maniobra (tarea y propósito de cada elemento), fuegos (tarea, propósito, método y efecto), inteligencia, ingeniería, ADA, apoyo de servicios y C4.\",\"Cierra con objetivo inicial, objetivos subsiguientes y estado final deseado.\",\"Regla: TAREA es qué hace; PROPÓSITO es para qué. Sin el propósito, la ficha no se puede jugar.\"],ejemplo:\"OC-1 · Tarea: «romper el dispositivo en el AE AVAROA» · Propósito: «abrir el paso al segundo escalón hacia VIACHA».\"}",
    nuevo: "ht19:{para:\"El curso de acción enemigo desarrollado FASE POR FASE: en cada fase, TODOS los elementos de su dispositivo con su TAREA y su PROPÓSITO. Es lo que se pone sobre la mesa en el juego de guerra.\",como:[\"Arriba: quién, qué, cuándo, dónde y con qué fuerza.\",\"Después, FASE I: cada elemento de maniobra (reconocimiento, OC, OD, reserva) con su tarea y su propósito; los fuegos (artillería, morteros, apoyo aéreo cercano) con tarea, propósito, método y efecto; inteligencia, ingeniería, ADA, servicios y C4 con su formato. Después FASE II con la misma estructura y OTRO contenido, y así hasta la última.\",\"Una oración corta por casilla. TAREA = qué hace (verbo táctico + dónde). PROPÓSITO = para qué (el efecto que habilita a otro elemento).\",\"Los elementos salen de las fichas enemigas del calco (🌱 Traer del calco): ninguno queda sin tarea en ninguna fase.\",\"Cierra con objetivo inicial, objetivos subsiguientes y estado final deseado.\"],ejemplo:\"FASE III · OC-1 BAT. INF. BLIN. «CARAMPAGUÉ» · Tarea: «Abrir brecha en la LPR sobre el paso de Ungallire.» · Propósito: «Para dar paso a la OD hacia Macaya.» — ART. G.A.AP. «SALVO» · Tarea: «Neutralizar las posiciones del CE-I en la brecha.» · Método: «Preparación de 30 min desde Guallatire.» · Efecto: «Neutralizar el 30 % de las armas de la LPR.»\"}",
    veces: 1,
  },
]
