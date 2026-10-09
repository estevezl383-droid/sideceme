// Reemplazos hechos el 2026-09-29 (cuarto paso del día) sobre el compilado de la Mesa
// del EM (calcos/assets/index-5bpBlYsz.js → el que carga hoy calcos/index.html).
// Los pidió Sergio: TODOS los documentos militares del PMTD llevan el membrete táctico
// en Arial 10 negrilla, con el «CG. LUGAR HORA» debajo de la R de SECRETO:
//
//   DIV.MEC.-1                             ← escalón superior (la unidad que expide la Orden)
//   RCB-1               CG. VIACHA D-15 (2300)  ← unidad considerada · CG · hora táctica
//   EMO/SEC-III                            ← la pestaña (sección) que lo elabora
//   No. 001/SMM                            ← correlativo de la sección / iniciales del usuario
//
// Las hojas de trabajo no son documentos militares: no llevan membrete.
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que
// aparecer «veces» veces) y se cambió por «nuevo». reemplazos-compilado.js comprueba
// que deshaciéndolos se vuelve byte por byte al anterior.
// Si se vuelve a compilar desde el fuente, esto es lo que hay que pasarle.
//
// El membrete vive en archivos legibles aparte (calcos/membrete/v1/, ver su README).
module.exports = [
  {
    nombre: "Membrete · el módulo (calcos/membrete/v1) y la matriz de riesgo en riesgo/v2",
    viejo: "\"../riesgo/v1/",
    nuevo: "\"../riesgo/v2/",
    veces: 5,
  },
  {
    nombre: "Membrete · importar el módulo",
    viejo: "import {descargarConceptosWord as SIDConceptosWord} from \"../conceptos/v4/word.js\";",
    nuevo: "import {descargarConceptosWord as SIDConceptosWord} from \"../conceptos/v4/word.js\";import SIDMembrete from \"../membrete/v1/membrete.js\";",
    veces: 1,
  },
  {
    nombre: "Membrete · las líneas del Word (escalón superior · unidad considerada\\tCG. LUGAR HORA · EMO/SEC · No. correlativo/iniciales)",
    viejo: "function _ie(t={},e={}){const n=xie(t,e),a=[n.unidad,n.pc&&`\t${n.pc}`,n.fechaHora&&`\t${n.fechaHora}`].filter(Boolean).join(\"\"),i=n.numero&&`Nº ${n.numero}`;return[n.superior,a,n.seccion,i].filter(o=>cg(o))}",
    nuevo: "function _ie(t={},e={}){return SIDMembrete.lineasTexto(SIDMembrete.campos(t,e))}",
    veces: 1,
  },
  {
    nombre: "Membrete · el mismo membrete en los documentos que se arman en HTML",
    viejo: "function Ex(t={},e={}){const n=xie(t,e),a=[n.pc,n.fechaHora].filter(Boolean).join(\" \"),i=[n.superior&&PS(n.superior),n.unidad||a?`${PS(n.unidad)}${a?`<span class=\"der\">${PS(a)}</span>`:\"\"}`:\"\",n.seccion&&PS(n.seccion),n.numero&&`Nº ${PS(n.numero)}`].filter(s=>s&&s.replace(/<[^>]+>/g,\"\").trim()),o=i.findIndex(s=>s.includes('class=\"der\"'));return i.map((s,r)=>`<p class=\"enc\"${o>=0&&r===o+1?' style=\"clear:both\"':\"\"}>${s}</p>`).join(`\n`)}",
    nuevo: "function Ex(t={},e={}){return SIDMembrete.html(SIDMembrete.campos(t,e))}",
    veces: 1,
  },
  {
    nombre: "Membrete · Arial 10 negrilla y la tabulación debajo de la R de SECRETO",
    viejo: "for(const T of M.membrete||[])g.push(new Js({spacing:{after:0},tabStops:[{type:av.LEFT,position:4678},{type:av.LEFT,position:7088}],children:[Ed(T,{bold:!0})]}));",
    nuevo: "for(const T of M.membrete||[])g.push(new Js({spacing:{after:0},tabStops:[{type:av.LEFT,position:SIDMembrete.tabulacion({clasificacion:n,anchoTexto:v?SIDMembrete.ANCHO_APAISADA:SIDMembrete.ANCHO_VERTICAL})}],children:[Ed(T,{bold:!0,size:20})]}));",
    veces: 1,
  },
  {
    nombre: "Membrete · sólo los documentos militares (las hojas de trabajo no llevan membrete)",
    viejo: "function rP(t,e){const n=e.ordenSup||{};return{membrete:_ie(e,n),",
    nuevo: "function rP(t,e){const n=e.ordenSup||{};return{membrete:SIDMembrete.esDocumentoMilitar(t.id)?_ie({...e,hoja:t.id},n):[],",
    veces: 1,
  },
  {
    nombre: "Membrete · alerta, órdenes preparatorias, guía inicial y línea de tiempo: su número y su hora",
    viejo: "function f3e(t,e={},n={},a={}){const i=VM(t),o=n.ordenSup||{},s={membrete:_ie(n,o),",
    nuevo: "function f3e(t,e={},n={},a={}){const i=VM(t),o=n.ordenSup||{},s={membrete:_ie({...n,hoja:t},o),",
    veces: 1,
  },
  {
    nombre: "Membrete · el Tablero del G-3 es la Sección III",
    viejo: "await Aoe(Ke.id,M[Ke.id]||{},I,M)",
    nuevo: "await Aoe(Ke.id,M[Ke.id]||{},{...I,seccion:\"EMO/SEC-III\"},M)",
    veces: 1,
  },
  {
    nombre: "Membrete · el módulo ve el ejercicio (fichas, capas, hojas de cada sección, la Orden, el oficial)",
    viejo: "je.useEffect(()=>{const M=window.MesaFuegos;",
    nuevo: "je.useEffect(()=>{SIDMembrete.sincronizar({unidades:dn,capas:ve,g3:Ya,picb:$i,hojasG:Kr,autor:zo,ordenSup:Tn,puesto:Ha})},[dn,ve,Ya,$i,Kr,zo,Tn,Ha]);je.useEffect(()=>{const M=window.MesaFuegos;",
    veces: 1,
  },
  {
    nombre: "Membrete · la Línea de Tiempo (MS) y el rótulo de las fichas (js)",
    viejo: "configurarRiesgo({jsx:f.jsx,",
    nuevo: "SIDMembrete.configurar({lineaDeTiempo:MS,rotular:js});configurarRiesgo({jsx:f.jsx,",
    veces: 1,
  },
  {
    nombre: "Membrete · la «unidad» de la Orden es la que la expide",
    viejo: "f.jsx(\"span\",{children:\"Unidad considerada\"}),f.jsx(\"input\",{style:Cn.inp,value:B.unidad||\"\",placeholder:\"DIV.MEC.-1\",onChange:qe=>U?.(\"unidad\",qe.target.value)})]})",
    nuevo: "f.jsx(\"span\",{children:\"Unidad que expide la Orden\"}),f.jsx(\"input\",{style:Cn.inp,value:B.unidad||\"\",placeholder:\"DIV.MEC.-1\",onChange:qe=>U?.(\"unidad\",qe.target.value)})]})",
    veces: 1,
  },
  {
    nombre: "Membrete · quiénes somos (unidad considerada) y su CG",
    viejo: "f.jsxs(\"div\",{style:Cn.pista,children:[\"Estos tres arman el \",f.jsx(\"b\",{children:\"membrete\"}),\" y la clasificación de TODOS los documentos que bajan los G en formato militar.\"]})",
    nuevo: "f.jsxs(\"div\",{style:Cn.fila2,children:[f.jsxs(\"label\",{style:Cn.campoCol,children:[f.jsx(\"span\",{children:\"Unidad considerada (quiénes somos)\"}),f.jsx(\"input\",{style:Cn.inp,value:B.unidadPropia||\"\",placeholder:SIDMembrete.UNIDAD_CONSIDERADA_POR_DEFECTO,onChange:qe=>U?.(\"unidadPropia\",qe.target.value.toUpperCase())})]}),f.jsxs(\"label\",{style:Cn.campoCol,children:[f.jsx(\"span\",{children:\"CG de la unidad considerada\"}),f.jsx(\"input\",{style:Cn.inp,value:B.puestoPropio||\"\",placeholder:\"vacío = pueblo más cercano a su ficha\",onChange:qe=>U?.(\"puestoPropio\",qe.target.value.toUpperCase())})]})]}),f.jsxs(\"div\",{style:Cn.pista,children:[\"Arman el \",f.jsx(\"b\",{children:\"membrete táctico\"}),\" de TODOS los documentos militares: escalón superior (la unidad que expide la Orden), unidad considerada con su CG y la hora táctica de la Línea de Tiempo, EMO/SEC de la pestaña y el número correlativo de la sección con las iniciales del redactor. Sin unidad considerada se toma la \",SIDMembrete.UNIDAD_CONSIDERADA_POR_DEFECTO,\".\"]})",
    veces: 1,
  },
]
