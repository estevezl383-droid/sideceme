// Reemplazos hechos el 2026-09-28 (segunda tanda) sobre el compilado de la Mesa
// del EM (calcos/assets/index-zhbwncsH.js → el que carga hoy calcos/index.html).
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que
// aparecer «veces» veces) y se cambió por «nuevo». reemplazos-compilado.js
// comprueba que deshaciéndolos se vuelve byte por byte al anterior.
// Si se vuelve a compilar desde el fuente, esto es lo que hay que pasarle.
//
// Cuánto tardan los trabajos de ingeniería CON LA INGENIERÍA QUE TENEMOS.
//
// Antes, el panel 🛡️ Defensa y la barra de abajo calculaban con «1 sección»
// (lo que traía la casilla «Secciones al trabajo») aunque la Orden adjunta al
// ejercicio dijera otra cosa: en «ARMAS» la OGO 01/35 pone el BATING. MEC.-II
// «ROMÁN» con dos Cía. Ing. Comb., una Cía. Ing. Eq. Pes., una de Puentes y una
// de Mantenimiento, y la barra decía «15.6 días» con una sección. Además el panel
// hablaba de «jornadas de 10 h» y la barra de «días» de 24 h sin decirlo.
//
// Ahora:
//   · fuerzaIngenieria() lee la Organización de la tarea de los documentos del
//     ejercicio (la Orden primero; nunca el Anexo de Inteligencia ni el párrafo
//     «Fuerzas enemigas») y separa quién construye obstáculos (ingenieros de
//     combate: 3 secciones por compañía, 1 por sección), quién pone las máquinas
//     (equipo pesado) y quién no hace obstáculos (puentes, mantenimiento, C y S).
//     Si los documentos no dicen nada, usa las fichas de ingeniería del calco;
//     si tampoco hay, 1 sección supuesta y lo avisa.
//   · Esas secciones son las que usan el panel 🛡️ Defensa, la barra de abajo,
//     el tablero del G-3 y las hojas que se siembran del calco. Lo que se escriba
//     a mano en «Secciones al trabajo» manda, y se puede volver a la orden.
//   · El tiempo se dice siempre igual: horas de trabajo, jornadas de 10 h (y
//     cuántos días de trabajo son) y días si se trabaja las 24 h con relevos.
const INSERTO = String.raw`/* Fuerza de ingeniería propia para el plan de barreras (2026-09-28). Primero lo que dice la Orden adjunta al ejercicio (Organización de la tarea), después las fichas de ingeniería del calco y, si no hay nada, 1 sección supuesta. */
const ING_CLASE=[
{id:"puentes",re:/PUENTE|PONTON|FRANQUEO/,cuenta:!1,por:"Puentes: da movilidad (franqueo de cursos de agua). No construye obstáculos."},
{id:"equipo",re:/EQ\.? ?PES|EQUIPO PESADO|EQ\.? ?MEC|EQUIPO MEC|MAQUINARIA/,cuenta:!1,equipo:!0,por:"Pone las máquinas (topadoras, retroexcavadoras, cargadores): es el «equipo mecánico» del cálculo."},
{id:"mtto",re:/MTTO|MANT/,cuenta:!1,por:"Mantiene el equipo de ingeniería. No construye obstáculos."},
{id:"cmdo",re:/\bC Y S\b|CMDO|COMANDO|SERVICIOS/,cuenta:!1,por:"Comando y servicios. No construye obstáculos."},
{id:"combate",re:/[\s\S]/,cuenta:!0,por:"Ingenieros de combate: son los que construyen los obstáculos."}];
function ingNorm(t){return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/\s+/g," ").trim()}
function ingEscalon(n){return/^(BATING|BAT|BTN|B|BATALLON|GRUPO|GPO)\b/.test(n)?"batallon":/^(REG|RGTO|REGIMIENTO)\b/.test(n)?"regimiento":/^(COMP|CIA|COMPANIA|DEST|DESTACAMENTO)\b/.test(n)?"compania":/^(SECC|SEC|SECCION|PEL|PELOTON)\b/.test(n)?"seccion":null}
function ingEsElemento(n){return n.length<=70&&n.split(" ").length<=8&&!!ingEscalon(n)&&/^BATING\b|\bING\b|INGENIER|ZAPADOR/.test(n)}
/* Los renglones y celdas del documento (tablas en Markdown o texto de Word), sin el párrafo «Fuerzas enemigas»: ahí puede figurar la ingeniería del enemigo. */
function ingTrozos(texto){const out=[];let eno=!1;for(const l of String(texto||"").split(/\r?\n/)){const cab=ingNorm(l.replace(/^[\s#>*•·-]*(?:(?:[IVXLC]{1,5}|[A-Za-z]|\d{1,2})\s*(?:\.\s*-|\.-|[).-])\s+)?/,"")).replace(/[.:;]+$/,"");if(cab.length<=50){if(/^FUERZAS ENEMIGAS\b/.test(cab)){eno=!0;continue}if(/^(FUERZAS (AMIGAS|PROPIAS)|REFUERZOS|MISION|EJECUCION|ORGANIZACION DE LA TAREA|APOYO DE SERVICIO|APOYO LOGISTICO|COMANDO Y COMUNICACIONES|TABLA)\b/.test(cab))eno=!1}if(eno)continue;for(const c of l.split(/\||<br\s*\/?>|\t/i)){const v=c.replace(/\*+/g,"").replace(/^[\s•·-]+/,"").trim();v&&out.push(v)}}return out}
/* Una designación termina en su nombre entre comillas («Comp. Ing. Comb. “A” en apoyo…» es la misma «Comp. Ing. Comb. “A”»), y una frase (palabras en minúscula que no sean de/del/y/la/los/el) no es una designación. */
function leerIngenieriaDoc(texto){const vistos=new Set(),unidades=[],elementos=[];for(const t of ingTrozos(texto)){const q=t.match(/^.*?(?:[”»]|"[^"]*")/),nom=(q?q[0]:t).replace(/[\s:;,]+$/,"").trim(),n=ingNorm(nom);if(!ingEsElemento(n)||/(?:^|\s)(?!(?:de|del|y|la|las|los|el)(?:\s|$))[a-záéíóúñü]/.test(nom.replace(/[“«"][^”»"]*[”»"]/g,"")))continue;const k=n.replace(/[^A-Z0-9]/g,"");if(vistos.has(k))continue;vistos.add(k);const esc=ingEscalon(n);if(esc==="batallon"||esc==="regimiento"){unidades.push({nom:nom,escalon:esc});continue}const c=ING_CLASE.find(x=>x.re.test(n));elementos.push({nom:nom,escalon:esc,clase:c.id,cuenta:c.cuenta,equipo:!!c.equipo,secciones:c.cuenta?esc==="seccion"?qCe.seccion:qCe.compania:0,por:c.por})}if(!unidades.length&&!elementos.length)return null;const porEscalon=!elementos.length;return{unidades:unidades,elementos:elementos,secciones:porEscalon?unidades.reduce((a,u)=>a+(qCe[u.escalon]||1),0):elementos.reduce((a,e)=>a+e.secciones,0),porEscalon:porEscalon,equipo:elementos.some(e=>e.equipo)}}
function ingNomDoc(n){return String(n||"").replace(/(\.(md|docx?|pdf|txt|xlsx|csv))+$/i,"").trim()}
/* manual: lo escrito en «Secciones al trabajo» (null = lo que diga la orden o el calco). */
function fuerzaIngenieria(documentos,unidades,manual){const pr=d=>({orden:0,medios:1,bases:2})[d.categoria]??3,docs=(documentos||[]).filter(d=>d&&String(d.texto||"").trim().length>40&&d.categoria!=="anexoicia"&&!(pr(d)===3&&/intelig|anexo\s*.?\s*b\b/i.test(String(d.nombre||"")))).sort((a,b)=>pr(a)-pr(b));let doc=null,orden=null;for(const d of docs){const r=leerIngenieriaDoc(d.texto);if(r){doc=d,orden=r;break}}const calco=UCe(unidades),deOrden=orden&&orden.secciones>0?orden.secciones:null,deCalco=calco.hay&&calco.secciones>0?calco.secciones:null,m=Number(manual)>0?Number(manual):null,fuente=deOrden?"orden":deCalco?"calco":"supuesta";return{fuente:fuente,documento:doc?ingNomDoc(doc.nombre):null,orden:orden,calco:calco,seccionesOrden:deOrden,seccionesCalco:deCalco,secciones:m??deOrden??deCalco??1,manual:m!=null,supuesta:fuente==="supuesta",equipo:!!(orden&&orden.equipo),nomEquipo:orden&&(orden.elementos.find(e=>e.equipo)||{}).nom||null}}
const ingN=v=>(Math.round((Number(v)||0)*10)/10).toLocaleString("es");
/* Horas de trabajo → jornadas de 10 h (y días de trabajo) y días si se trabaja las 24 h con relevos. */
function ingTiempo(h){const x=Number(h)||0;return{horas:ingN(x),jornadas:ingN(x/10),diasTrabajo:Math.ceil(x/10-1e-9),dias24:ingN(x/24)}}
/* Horas de un trabajo: menos de una hora se dice en minutos (con 6 secciones un bloqueo no es «0 h»). */
function ingHoras(h){const x=Number(h)||0;return x<=0?"0 h":x<1?Math.max(1,Math.round(x*60))+" min":ingN(mD(x))+" h"}
const ingEsc=e=>((fl.find(x=>x.id===e)||{}).nombre||e||"").toLowerCase();
const ingEst={caja:{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.16)",borderRadius:7,padding:"7px 9px",display:"flex",flexDirection:"column",gap:3,fontSize:11.5,lineHeight:1.4,color:"#e6eef6",textAlign:"left"},tit:{font:"700 10.5px/1.2 Arial",letterSpacing:".08em",color:"#9fd8b4",textTransform:"uppercase",marginBottom:1},chica:{fontSize:10.5,color:"#a9c8da",lineHeight:1.35},uni:{fontWeight:700,color:"#fff",fontSize:12.5},fila:{display:"flex",gap:6,alignItems:"baseline"},no:{opacity:.6},total:{marginTop:3,paddingTop:4,borderTop:"1px solid rgba(255,255,255,0.14)",fontWeight:700,color:"#7dffb0",fontSize:12.5},aviso:{color:"#ffc98a",fontSize:11.5,lineHeight:1.4},grande:{font:"700 19px/1.15 Arial",color:"#ff8a8a"},btn:{background:"none",border:"none",color:"#5ce1ff",textDecoration:"underline",cursor:"pointer",padding:0,fontSize:11}};
const ingSinNada="⚠️ Ni los documentos del ejercicio ni el calco dicen qué ingeniería tenemos: se calcula con 1 sección supuesta. Cargá la Orden en «Documentos del ejercicio» o poné tu unidad de ingenieros en 🪖 Unidades.";
/* 🛠️ Con qué lo hacemos: la unidad de ingeniería, compañía por compañía, y cuántas secciones construyen. */
function IngConQue({fi:t,efectivo:e=k7,enDefensa:n=!1,onVolver:a}){if(!t)return null;const o=t.orden,c=t.calco,x=Number(e)||k7,ref=t.seccionesOrden??t.seccionesCalco;return f.jsxs("div",{style:ingEst.caja,"data-ing":"con-que",children:[f.jsx("div",{style:ingEst.tit,children:"🛠️ Con qué lo hacemos"}),o&&f.jsxs(f.Fragment,{children:[f.jsxs("div",{style:ingEst.chica,children:["📄 Según ",f.jsx("b",{children:t.documento||"la Orden"})," · Organización de la tarea"]}),o.unidades.map(u=>f.jsx("div",{style:ingEst.uni,children:u.nom},u.nom)),o.elementos.map(u=>f.jsxs("div",{style:{...ingEst.fila,...u.cuenta||u.equipo?{}:ingEst.no},title:u.por,children:[f.jsx("span",{children:u.cuenta?"✔":u.equipo?"⚙️":"–"}),f.jsx("span",{style:{flex:1},children:u.nom}),f.jsx("b",{children:u.cuenta?u.secciones+" secc.":u.equipo?"máquinas":"no hace obstáculos"})]},u.nom)),o.porEscalon&&f.jsx("div",{style:ingEst.chica,children:"✎ La orden no detalla sus compañías: las secciones se estiman por el escalón."}),t.seccionesOrden==null&&f.jsx("div",{style:ingEst.aviso,children:"⚠️ En la orden no figura ninguna compañía o sección de ingenieros de combate."})]}),(!o||t.seccionesOrden==null)&&c.hay&&f.jsxs(f.Fragment,{children:[f.jsx("div",{style:ingEst.chica,children:o?"🪖 Se usa la del calco:":"🪖 Del calco (los documentos del ejercicio no la mencionan):"}),c.detalle.map(u=>f.jsxs("div",{style:ingEst.fila,children:[f.jsx("span",{children:"✔"}),f.jsxs("span",{style:{flex:1},children:[u.nom," (",ingEsc(u.escalon),")"]}),f.jsxs("b",{children:[u.secciones," secc."]})]},u.id)),f.jsx("div",{style:ingEst.chica,children:"✎ Secciones estimadas por el escalón de la ficha."})]}),t.fuente==="orden"&&c.hay&&f.jsxs("div",{style:ingEst.chica,children:["En el calco también hay ",c.detalle.map(u=>u.nom+" ("+ingEsc(u.escalon)+")").join(" · "),": para el cálculo manda la orden."]}),t.supuesta&&f.jsx("div",{style:ingEst.aviso,children:ingSinNada}),f.jsxs("div",{style:ingEst.total,children:["= ",t.secciones," secciones al trabajo · ",ingN(t.secciones*x)," hombres (",x," por sección)"]}),t.manual?f.jsxs("div",{style:ingEst.chica,children:["✎ Puesto a mano",ref!=null?" (la "+(t.seccionesOrden!=null?"orden":"ficha del calco")+" da "+ref+")":"",a&&f.jsxs(f.Fragment,{children:[" · ",f.jsx("button",{style:ingEst.btn,onClick:a,children:ref!=null?"↺ usar las de la "+(t.seccionesOrden!=null?"orden":"ficha"):"↺ volver a 1"})]})]}):t.fuente==="orden"&&!o.porEscalon&&f.jsxs("div",{style:ingEst.chica,children:["✎ Se cuentan 3 secciones por compañía de combate y 1 por sección. ",n?"Si la orden dice otra cosa, corregí «Secciones al trabajo» acá abajo.":"Se corrige en «Secciones al trabajo» del panel 🛡️ Defensa."]})]})}
/* ⏱️ Cuánto tarda: el esfuerzo (b0) con las secciones que hay, dicho en horas, jornadas y días. */
function IngCuanto({esf:t,secciones:e,efectivo:n=k7,esfMaq:a,nomEquipo:i}){if(!t)return null;const o=ingTiempo(t.horas),s=Math.max(1,Number(e)||1),x=Number(n)||k7;return f.jsxs("div",{style:ingEst.caja,"data-ing":"cuanto",children:[f.jsx("div",{style:ingEst.tit,children:"⏱️ Cuánto tarda · apreciación"}),f.jsxs("div",{style:ingEst.grande,children:[o.horas," h de trabajo"]}),f.jsxs("div",{children:["= ",f.jsxs("b",{children:[o.jornadas," jornadas de 10 h"]}),o.diasTrabajo>0?" → "+o.diasTrabajo+" día(s) de trabajo":""]}),f.jsxs("div",{children:["o ",f.jsxs("b",{children:[o.dias24," días"]})," si se trabaja las 24 h, con relevos"]}),f.jsxs("div",{style:ingEst.chica,children:[ingN(t.hh)," hombres-hora ÷ ",ingN(s*x)," hombres (",s," secc. × ",x,") · ",ingN(t.sh)," secciones-hora"]}),a&&f.jsxs("div",{children:["⚙️ Con las máquinas",i?" de la "+i:"",": ",f.jsxs("b",{children:[ingTiempo(a.horas).horas," h"]})," = ",ingTiempo(a.horas).jornadas," jornadas de 10 h"]}),f.jsx("div",{style:ingEst.chica,children:"✎ Todas las secciones trabajando a la vez, sin contar traslados, reconocimientos ni la llegada del material."})]})}
/* Lo mismo, en corto, para la barra de abajo. */
function ingResumen(t){if(!t)return null;const o=t.orden,man=t.manual?f.jsxs(f.Fragment,{children:[f.jsx("br",{}),"✎ Puesto a mano en 🛡️ Defensa"]}):null;if(t.fuente==="orden"){const comb=o.elementos.filter(x=>x.cuenta),eq=o.elementos.filter(x=>x.equipo),no=o.elementos.filter(x=>!x.cuenta&&!x.equipo);return f.jsxs(f.Fragment,{children:[o.unidades.length?f.jsxs(f.Fragment,{children:[f.jsx("b",{children:o.unidades.map(u=>u.nom).join(" · ")}),f.jsx("br",{})]}):null,comb.length?comb.map(x=>x.nom).join(" · ")+" → "+t.seccionesOrden+" secc.":"≈ "+t.seccionesOrden+" secc. por el escalón",eq.length?f.jsxs(f.Fragment,{children:[f.jsx("br",{}),"⚙️ ",eq.map(x=>x.nom).join(" · ")," (máquinas)"]}):null,no.length?f.jsxs(f.Fragment,{children:[f.jsx("br",{}),f.jsxs("span",{style:{opacity:.7},children:["No hacen obstáculos: ",no.map(x=>x.nom).join(" · ")]})]}):null,f.jsx("br",{}),"📄 ",t.documento,man]})}if(t.fuente==="calco")return f.jsxs(f.Fragment,{children:["🪖 Del calco: ",t.calco.detalle.map(x=>x.nom+" ("+ingEsc(x.escalon)+")").join(" · "),f.jsx("br",{}),"Los documentos del ejercicio no dicen qué ingeniería tenemos.",man]});return f.jsxs(f.Fragment,{children:[ingSinNada,man]})}
function GCe(t){`

module.exports = [
  // ── Lo que lee la orden y arma la apreciación (funciones nuevas, al nivel del módulo) ──
  {
    nombre: 'Ingeniería · lector de la orden y apreciación de tiempo (funciones nuevas)',
    viejo: 'function GCe(t){',
    nuevo: INSERTO,
    veces: 1,
  },

  // ── La Mesa: un solo cálculo de la fuerza, que le llega a todos ──
  {
    nombre: 'Mesa · «Secciones al trabajo» arranca vacía (null = lo que diga la orden)',
    viejo: '[oc,Mr]=je.useState(1)',
    nuevo: '[oc,Mr]=je.useState(null)',
    veces: 1,
  },
  {
    nombre: 'Mesa · la fuerza de ingeniería sale de los documentos, del calco o de lo escrito a mano',
    viejo: '[en,hn]=je.useState([]),',
    nuevo: '[en,hn]=je.useState([]),fuerzaIngMesa=je.useMemo(()=>fuerzaIngenieria(en,dn,oc),[en,dn,oc]),',
    veces: 1,
  },
  {
    nombre: 'Mesa · la barra de abajo recibe la fuerza',
    viejo: 'seccionesTrabajo:oc,horasDisponibles:Ld,onHorasDisponibles:Dd,',
    nuevo: 'seccionesTrabajo:fuerzaIngMesa.secciones,fuerzaIng:fuerzaIngMesa,horasDisponibles:Ld,onHorasDisponibles:Dd,',
    veces: 1,
  },
  {
    nombre: 'Mesa · el tablero del G-3 recibe la fuerza (y las hojas que siembra)',
    viejo: 'seccionesTrabajo:oc,conMaquinaria:kc,horasDisponibles:Ld,',
    nuevo: 'seccionesTrabajo:fuerzaIngMesa.secciones,fuerzaIng:fuerzaIngMesa,conMaquinaria:kc,horasDisponibles:Ld,',
    veces: 1,
  },
  {
    nombre: 'Mesa · el panel 🛡️ Defensa recibe la fuerza',
    viejo: 'seccionesTrabajo:oc,onSeccionesTrabajo:Mr,',
    nuevo: 'seccionesTrabajo:fuerzaIngMesa.secciones,fuerzaIng:fuerzaIngMesa,onSeccionesTrabajo:Mr,',
    veces: 1,
  },

  // ── Panel 🛡️ Defensa: con qué lo hacemos y cuánto tarda ──
  {
    nombre: 'Defensa · recibe la fuerza',
    viejo: 'seccionesTrabajo:E=1,onSeccionesTrabajo:S,',
    nuevo: 'seccionesTrabajo:E=1,fuerzaIng:ingFiD=null,onSeccionesTrabajo:S,',
    veces: 1,
  },
  {
    nombre: 'Defensa · «Con qué lo hacemos» arriba de las casillas',
    viejo: 'f.jsx("div",{style:Ba.costoTit,children:"⏱️ ESFUERZO DE INGENIERÍA"}),',
    nuevo: 'f.jsx("div",{style:Ba.costoTit,children:"⏱️ ESFUERZO DE INGENIERÍA"}),f.jsx(IngConQue,{fi:ingFiD,efectivo:M,enDefensa:!0,onVolver:()=>S?.(null)}),',
    veces: 1,
  },
  {
    nombre: 'Defensa · «Cuánto tarda» en horas, jornadas y días (y con las máquinas, si la orden las da)',
    viejo:
      'f.jsxs("div",{style:Ba.costoTotal,children:[se.sh," secciones-hora",f.jsxs("div",{style:Ba.costoSub,children:["= ",f.jsxs("b",{children:[se.horas," h"]})," de reloj con ",E," sección(es)",se.horas>=10&&` · ${(se.horas/10).toFixed(1)} jornadas de 10 h`,f.jsx("br",{}),se.hh," hombres-hora en total"]})]}),',
    nuevo:
      'f.jsx(IngCuanto,{esf:se,secciones:E,efectivo:M,esfMaq:ingFiD&&ingFiD.equipo?b0(re,{...X,conMaquinaria:!0}):null,nomEquipo:ingFiD&&ingFiD.nomEquipo}),',
    veces: 1,
  },

  {
    nombre: 'Defensa · las horas de cada trabajo de la tabla (en minutos si es menos de una hora)',
    viejo: 'children:[ve.horas," h"]',
    nuevo: 'children:[ingHoras(ve.hh/((Number(M)||k7)*Math.max(1,E)))]',
    veces: 1,
  },

  // ── Barra de abajo (plan de barreras) ──
  {
    nombre: 'Barra · recibe la fuerza',
    viejo: 'seccionesTrabajo:a=1,horasDisponibles:i,',
    nuevo: 'seccionesTrabajo:a=1,fuerzaIng:ingFiB=null,horasDisponibles:i,',
    veces: 1,
  },
  {
    nombre: 'Barra · se la pasa a su contenido',
    viejo: 'Ce={medidos:e,efectivoSeccion:n,seccionesTrabajo:a,',
    nuevo: 'Ce={medidos:e,efectivoSeccion:n,seccionesTrabajo:a,fuerzaIng:ingFiB,',
    veces: 1,
  },
  {
    nombre: 'Barra · el contenido del G-3 la recibe',
    viejo: 'g3:({medidos:t,efectivoSeccion:e,seccionesTrabajo:n,horasDisponibles:a,',
    nuevo: 'g3:({medidos:t,efectivoSeccion:e,seccionesTrabajo:n,fuerzaIng:ingFiG,horasDisponibles:a,',
    veces: 1,
  },
  {
    nombre: 'Barra · título en horas y jornadas, «Ingeniería que tenemos» y «Tiempo de trabajo»',
    viejo:
      'return{titulo:`⏱️ PLAN DE BARRERAS · ${D2(I.horas)} DE TRABAJO`,bloques:f.jsxs(f.Fragment,{children:[M,f.jsx(Cd,{rotulo:"Tiempo total",cifra:D2(I.horas),color:G===!1?"#ff5c5c":"#5ce1ff",pie:f.jsxs(f.Fragment,{children:[tp(I.sh)," secciones-hora · ",tp(I.hh)," hombres-hora",f.jsx("br",{}),"con ",n," sección(es) de ",e]})}),',
    nuevo:
      'return{titulo:"⏱️ PLAN DE BARRERAS · "+ingTiempo(I.horas).horas+" h DE TRABAJO = "+ingTiempo(I.horas).jornadas+" JORNADAS DE 10 h · CON "+Math.max(1,n)+" SECC. DE INGENIERÍA",bloques:f.jsxs(f.Fragment,{children:[M,' +
      'f.jsx(Cd,{rotulo:"Ingeniería que tenemos",cifra:Math.max(1,n)+" secc.",color:"#7dffb0",pie:ingResumen(ingFiG)}),' +
      'f.jsx(Cd,{rotulo:"Tiempo de trabajo · apreciación",cifra:ingTiempo(I.horas).horas+" h",color:G===!1?"#ff5c5c":"#5ce1ff",pie:f.jsxs(f.Fragment,{children:["= ",f.jsxs("b",{children:[ingTiempo(I.horas).jornadas," jornadas de 10 h"]})," (",ingTiempo(I.horas).diasTrabajo," día(s) de trabajo)",f.jsx("br",{}),"o ",f.jsxs("b",{children:[ingTiempo(I.horas).dias24," días"]})," trabajando las 24 h con relevos",f.jsx("br",{}),tp(I.hh)," hombres-hora · ",tp(I.sh)," secciones-hora ÷ ",Math.max(1,n)," secc. de ",e]})}),',
    veces: 1,
  },
  {
    nombre: 'Barra · equipo mecánico: si la orden da la compañía de equipo pesado, se dice',
    viejo: '," · a mano: ",D2(j.horas)]}):"Tocá para ver cuánto se gana."})',
    nuevo: '," · a mano: ",ingTiempo(j.horas).horas," h"]}):ingFiG&&ingFiG.equipo?"La orden te da la "+ingFiG.nomEquipo+": tocá para ver cuánto se gana.":"Tocá para ver cuánto se gana."})',
    veces: 1,
  },
  {
    nombre: 'Barra · los trabajos dicen con cuántas secciones son esas horas',
    viejo: 'rotulo:`Los trabajos (${I.filas.length}) · tocá para ir`',
    nuevo: 'rotulo:`Los trabajos (${I.filas.length}) · horas con ${Math.max(1,n)} secc. · tocá para ir`',
    veces: 1,
  },

  {
    nombre: 'Barra · las horas de cada trabajo (en minutos si es menos de una hora)',
    viejo: 'return{k:H.etiqueta,v:`${H.horas} h`',
    nuevo: 'return{k:H.etiqueta,v:ingHoras(H.hh/((Number(e)||k7)*Math.max(1,n)))',
    veces: 1,
  },

  // ── Tablero del G-3, pestaña del plan de barreras ──
  {
    nombre: 'Tablero G-3 · recibe la fuerza',
    viejo: 'seccionesTrabajo:x=1,conMaquinaria:E=!1,',
    nuevo: 'seccionesTrabajo:x=1,fuerzaIng:ingFiT=null,conMaquinaria:E=!1,',
    veces: 1,
  },
  {
    nombre: 'Tablero G-3 · se la pasa al plan de barreras',
    viejo: 'f.jsx(CLe,{esfuerzo:it,',
    nuevo: 'f.jsx(CLe,{fuerzaIng:ingFiT,esfuerzo:it,',
    veces: 1,
  },
  {
    nombre: 'Tablero G-3 · el plan de barreras calcula con esas secciones',
    viejo: 'function CLe({esfuerzo:t,medidos:e,horasDisponibles:n,efectivoSeccion:a,conMaquinaria:i,unidades:o,onAbrirDefensa:s,onUnidad:r,onIrAObstaculo:u}){const[h,y]=je.useState(null),g=je.useMemo(()=>ZCe(e),[e]),v=je.useMemo(()=>VCe(e,o,{efectivoSeccion:a,conMaquinaria:i}),[e,o,a,i]);',
    nuevo: 'function CLe({fuerzaIng:ingFiC=null,esfuerzo:t,medidos:e,horasDisponibles:n,efectivoSeccion:a,conMaquinaria:i,unidades:o,onAbrirDefensa:s,onUnidad:r,onIrAObstaculo:u}){const[h,y]=je.useState(null),g=je.useMemo(()=>ZCe(e),[e]),v=je.useMemo(()=>VCe(e,o,{efectivoSeccion:a,conMaquinaria:i,seccionesIng:ingFiC?ingFiC.secciones:void 0}),[e,o,a,i,ingFiC]);',
    veces: 1,
  },
  {
    nombre: 'Tablero G-3 · el aviso «no hay ingeniería» sólo si tampoco la dan los documentos',
    viejo: 'v.sinIngenieria&&f.jsxs(',
    nuevo: 'v.sinIngenieria&&(!ingFiC||ingFiC.supuesta)&&f.jsxs(',
    veces: 1,
  },
  {
    nombre: 'Tablero G-3 · «Con qué lo hacemos» en lugar de la lista del calco, y el tiempo en jornadas',
    viejo:
      'f.jsx("div",{style:At.pieChico,children:T.disponible.hay?f.jsxs(f.Fragment,{children:["Con ",f.jsxs("b",{children:[T.secciones," sección(es)"]})," de ",T.disponible.detalle.map(j=>j.nom).join(" · ")," · ",a," hombres por sección"]}):f.jsx(f.Fragment,{children:"Sin unidad de ingeniería en el calco."})}),T.disponible.detalle.map(j=>f.jsxs("div",{style:At.pieChico,children:["🛠️ ",j.nom," (",j.escalon,") → ",j.secciones," secciones"]},j.id)),f.jsxs("div",{style:At.pieChico,children:[T.sh," secciones-hora · ",T.hh," hombres-hora"]})',
    nuevo:
      'ingFiC?f.jsx(IngConQue,{fi:ingFiC,efectivo:a}):f.jsxs(f.Fragment,{children:[f.jsx("div",{style:At.pieChico,children:T.disponible.hay?f.jsxs(f.Fragment,{children:["Con ",f.jsxs("b",{children:[T.secciones," sección(es)"]})," de ",T.disponible.detalle.map(j=>j.nom).join(" · ")," · ",a," hombres por sección"]}):f.jsx(f.Fragment,{children:"Sin unidad de ingeniería en el calco."})}),T.disponible.detalle.map(j=>f.jsxs("div",{style:At.pieChico,children:["🛠️ ",j.nom," (",j.escalon,") → ",j.secciones," secciones"]},j.id))]}),f.jsxs("div",{style:At.pieChico,children:[T.sh," secciones-hora · ",T.hh," hombres-hora"]}),f.jsxs("div",{style:At.pieChico,children:["= ",f.jsxs("b",{children:[ingTiempo(T.horas).jornadas," jornadas de 10 h"]})," (",ingTiempo(T.horas).diasTrabajo," día(s) de trabajo) · o ",ingTiempo(T.horas).dias24," días trabajando las 24 h con relevos"]})',
    veces: 1,
  },
  {
    nombre: 'Tablero G-3 · las horas de cada obstáculo (en minutos si es menos de una hora)',
    viejo: 'f.jsxs("b",{style:{color:jo},children:[j.horas," h"]})',
    nuevo: 'f.jsxs("b",{style:{color:jo},children:[ingHoras(j.hh/((Number(a)||k7)*Math.max(1,T.secciones)))]})',
    veces: 1,
  },
]
