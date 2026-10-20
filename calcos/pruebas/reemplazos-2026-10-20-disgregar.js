// Reemplazos del 2026-10-20 sobre calcos/assets/index-ains-acostar-20261020.js → index-disgregar-20261020.js.
// Lo pidió Sergio en la F2·SAL «Movimientos iniciales» con el CE-I como una sola ficha: «quiero que ese
// Cuerpo de Ejército se convierta en Puesto Comando y que aparezcan las tres fichas: DIV MEC-2, DIV-1,
// DIV-6» (el GALM-1 en refuerzo ya estaba en la carta).
//
// Qué se hace (la lógica está en calcos/disgregar/v1/disgregar.mjs): en 🪖 Unidades, cada gran unidad
// propia (Brigada para arriba) lleva «⊞ Disgregar»: lee sus dependientes inmediatas de la Orden (MESA EM o
// los documentos del ejercicio), el oficial las revisa, aparecen alrededor de la madre marcadas
// `dependeDe` (sin duplicar las que ya están) y la madre queda como su Puesto Comando (`tipo: 'pc'`), así
// no se cuenta dos veces como unidad de maniobra. «⊟ Reagrupar» lo deshace; «↶ Deshacer» también.
// La F2·SAL lleva un renglón por cada dependiente, y el aviso de la hoja vacía dice dónde está el botón.
//
// SHA-256 de index-ains-acostar-20261020.js (antes de estos reemplazos): 5656ff5eaae353fc5e58d35d3937a93d356abe7e2eb0c19dfaa2114e5ac2c3e3

module.exports = [
  {
    nombre: 'Import del módulo Disgregar',
    viejo: 'import {acostarRestantes as SIDAinsResto,',
    nuevo: 'import {accionDisgregar as SIDDisAccion,puedeDisgregarse as SIDDisPuede,filasMovimientos as SIDDisMov} from "../disgregar/v1/disgregar.mjs?v=disgregar20261020";import {acostarRestantes as SIDAinsResto,',
    veces: 1,
  },
  {
    nombre: '🪖 Unidades (ZAe): recibe onDisgregar',
    viejo: 'function ZAe({unidades:t,actual:e,onActual:n,colocando:a,onToggleColocar:i,onBorrar:o,onLimpiar:s,onExportar:r,',
    nuevo: 'function ZAe({unidades:t,actual:e,onActual:n,colocando:a,onToggleColocar:i,onBorrar:o,onLimpiar:s,onExportar:r,onDisgregar:SIDdg,',
    veces: 1,
  },
  {
    nombre: '🪖 Unidades (ZAe): «⊞ Disgregar» / «⊟ Reagrupar» en cada gran unidad propia',
    viejo: 'f.jsx("span",{style:wr.itemTxt,children:U(G)}),f.jsx("button",{style:wr.btnDel,onClick:()=>o(G.id),children:"✕"})',
    nuevo: 'f.jsx("span",{style:wr.itemTxt,children:U(G)}),SIDdg&&SIDDisPuede(G)&&f.jsx("button",{className:"sid-disgregar",style:{...wr.btnDel,color:G.disgregada?"#ffd27a":"#9fc4ff",fontSize:11,fontWeight:700,whiteSpace:"nowrap"},title:G.disgregada?"Volver a una sola unidad: quita las dependientes que puso «Disgregar»":"Queda como su Puesto Comando y aparecen sus unidades dependientes (de la Orden), para colocarlas",onClick:()=>SIDdg(G.id),children:G.disgregada?"⊟ Reagrupar":"⊞ Disgregar"}),f.jsx("button",{style:wr.btnDel,onClick:()=>o(G.id),children:"✕"})',
    veces: 1,
  },
  {
    nombre: '🪖 Unidades: disgregar con la Orden y los documentos, con deshacer',
    viejo: 'onExportar:Kx,geDisponible:GSe(),',
    nuevo: 'onExportar:Kx,onDisgregar:SIDdgId=>{let SIDdgR=null;try{SIDdgR=SIDDisAccion({unidades:dn,id:SIDdgId,ordenSup:Tn,documentos:en})}catch(SIDe){console.warn("Disgregar:",SIDe)}if(!SIDdgR)return;SIDdgR.unidades&&(SIDlaU(),Ra(SIDdgR.unidades));SIDdgR.aviso&&za(SIDdgR.aviso)},geDisponible:GSe(),',
    veces: 1,
  },
  {
    nombre: 'F2·SAL Movimientos iniciales: un renglón por cada dependiente de una unidad disgregada',
    viejo: 'const Ve=(((v=e.cmoc)==null?void 0:v.desplazamientos)||[]).length;',
    nuevo: 'try{Ne.push(...SIDDisMov(K.filter(SIDx=>!goe(SIDx)),Ne,js))}catch(SIDe){console.warn("Disgregar:",SIDe)}const Ve=(((v=e.cmoc)==null?void 0:v.desplazamientos)||[]).length;',
    veces: 1,
  },
  {
    nombre: 'Hoja vacía: el aviso dice dónde está «⊞ Disgregar»',
    viejo: 'después volvé y la hoja se llena sola con eso.`);return}',
    nuevo: 'después volvé y la hoja se llena sola con eso.\n\nSi tu unidad está como UNA sola ficha (CE, DIV, BRIG.), en 🪖 Unidades tocá «⊞ Disgregar»: queda como su Puesto Comando y aparecen sus unidades dependientes.`);return}',
    veces: 1,
  },
]
