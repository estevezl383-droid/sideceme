// Reemplazos del 2026-10-19 sobre calcos/assets/index-seleccionar-20261018.js → index-linea-tiempo-20261019.js.
// Lo pidió Sergio con capturas de la F1·P4 Línea Inicial de Tiempo y de los documentos del ejercicio:
//   «¿por qué aquí no genera, si ya tiene toda la información? La Orden dice D-44 (0900) y la misión
//   dice del D (0400) al D+15 (1800)… no está analizando los documentos… explicame qué pasa y solucionalo».
//
// Qué pasaba (reproducido con los Word reales del ejercicio):
//   · La hoja leía la RECEPCIÓN sólo de los primeros 1200 caracteres de UN documento (la «Orden»),
//     y si ahí no la encontraba, nunca la buscaba en los otros. Los anexos llevan el mismo membrete
//     «CG. Challapata. D-44 (0900)» y no se miraban.
//   · Si el membrete no estaba al principio (un .md, o la Orden sin él), tomaba como «recepción» la
//     primera fecha que apareciera: la de la MISIÓN (D (0400)), que es el inicio de la operación.
//   · El texto de un .md puede traer restos de formato (D\-44, **negritas**) que el patrón de
//     D±n (hhmm) no leía.
//   · La oferta «✅ Usar estos datos» sólo salía con la hoja TOTALMENTE vacía: una vez que entró el
//     inicio y el fin, lo que faltaba (la recepción) no se volvía a ofrecer jamás.
// Ahora: se limpia el formato del texto; el membrete es una línea corta que NO es la misión («a partir
// del… hasta…»), con «CG./PC/CMDO» y un D±n (hhmm), en cualquier parte del documento (si no hay
// ninguna con CG., la primera línea corta con fecha de los primeros 3000 caracteres); lo que falte en la
// Orden se completa con los demás documentos cargados (se dice de cuál salió); y la oferta sale
// mientras haya algo que completar, SIN pisar lo ya escrito.
//
// Los textos de abajo usan § por la comilla invertida y @{ por «dólar-llave» (para escribirlos en String.raw).
//
// SHA-256 de index-seleccionar-20261018.js (antes de estos reemplazos): 2527a3e16789741b0ec32c3dc08a24a6db975542beeceadb8f9143da40b5f33e
const f = (s) => s.replace(/§/g, '`').replace(/@\{/g, '${')

module.exports = [
  {
    nombre: 'Línea de Tiempo · el texto del documento sin restos de formato',
    viejo: f(String.raw`function tLe(t="",{unidad:e=""}={}){const n=String(t||""),a={campos:{}`),
    nuevo: f(String.raw`function tLe(t="",{unidad:e=""}={}){const n=String(t||"").replace(/ /g," ").replace(/\\([-+_*.()\\])/g,"$1").replace(/\*{1,3}/g,""),a={campos:{}`),
    veces: 1,
  },
  {
    nombre: 'Línea de Tiempo · el membrete es una línea corta (no la misión) con CG./PC y D±n (hhmm), en cualquier parte del documento',
    viejo: f(String.raw`r=n.slice(0,1200),u=JD(r),h=u.find(T=>/\b(C\.?G\.?|P\.?C\.?|CMDO|COMANDO)\b/i.test(T.linea))||u[0];`),
    nuevo: f(String.raw`r=n.slice(0,3e3),SIDmem=T=>T.linea.length<=90&&!/a partir|desde|hasta|\bal\s+(?:d[íi]a\s+)?D\b/i.test(T.linea),SIDcg=T=>/\b(C\.?G\.?|P\.?C\.?|CMDO|COMANDO)\b/i.test(T.linea),u=JD(r).filter(SIDmem),h=u.find(SIDcg)||JD(n).find(T=>SIDmem(T)&&SIDcg(T))||u[0];`),
    veces: 1,
  },
  {
    nombre: 'Línea de Tiempo · lo que falte en la Orden se completa con los demás documentos cargados',
    viejo: f(String.raw`function nLe(t=[],e={}){const n=Koe(t);return n?{doc:n,...tLe(n.texto,e)}:null}`),
    nuevo: f(String.raw`function nLe(t=[],e={}){const n=Koe(t);if(!n)return null;const r={doc:n,...tLe(n.texto,e)},SIDrot={recepcion:"recepción de la orden",inicioOperacion:"inicio de la operación",finOperaciones:"fin de las operaciones"};if(r.falta.length)for(const d of(t||[]).filter(a=>a!==n&&String(a?.texto||"").trim().length>40)){const x=tLe(d.texto,e);for(const o of x.evidencias)r.campos[o.campo]||(r.campos[o.campo]=o.valor,r.evidencias.push({...o,linea:§@{o.linea} (en «@{d.nombre}»)§}))}return r.falta=Object.keys(SIDrot).filter(k=>!r.campos[k]).map(k=>SIDrot[k]),r}`),
    veces: 1,
  },
  {
    nombre: 'Línea de Tiempo · la oferta de leer la Orden sale mientras falte algo y completa SIN pisar',
    viejo: f(String.raw`te=G&&Object.keys(G.campos).length&&!v.recepcion&&!v.inicioOperacion,H=()=>o({...v,modo:"diaD",...G.campos,_origen:G.evidencias.map(re=>§@{re.rot}: @{re.valor} — @{re.linea}§)}),`),
    nuevo: f(String.raw`SIDpend=G?Object.keys(G.campos).filter(re=>!v[re]):[],SIDmixto=["recepcion","inicioOperacion","finOperaciones","emision","inicioMovimientos"].some(re=>v[re]&&!oq(v[re])),te=G&&SIDpend.length>0&&!SIDmixto,H=()=>{const SIDc={};SIDpend.forEach(re=>{SIDc[re]=G.campos[re]}),o({...v,modo:"diaD",...SIDc,_origen:[...v._origen||[],...G.evidencias.filter(re=>SIDpend.includes(re.campo)).map(re=>§@{re.rot}: @{re.valor} — @{re.linea}§)]})},`),
    veces: 1,
  },
  {
    nombre: 'Línea de Tiempo · el rótulo de la oferta dice que completa lo que falta',
    viejo: f(String.raw`f.jsx("button",{style:Wt.sembrar,onClick:H,children:"✅ Usar estos datos"})`),
    nuevo: f(String.raw`f.jsx("button",{style:Wt.sembrar,onClick:H,children:SIDpend.length<Object.keys(G.campos).length?"✅ Completar lo que falta (no pisa lo ya escrito)":"✅ Usar estos datos"})`),
    veces: 1,
  },
]
