// Reemplazos del 2026-10-24 sobre calcos/assets/index-puntos-decision-20261024.js → index-cae-enemigo-20261024.js.
// El caso de Sergio (CE-I en el AO LAUCA contra la 1ª Br. Ac. «CORACEROS»): en la hoja del G-2 «CAE — Enunciado
// del curso de acción más probable» la IA escribió en «Misión» la misión PROPIA («El CE-I … defiende el AO
// LAUCA…») y en «Estado final deseado» el estado final PROPIO, con una unidad que nunca existió en el ejercicio
// («la VI División de Ejército de SATURNO»). Las hojas del G-3 lo mostraban en «🔎 Lo que entregó el G-2» y se lo
// mandaban a la IA: la «VI División» pasó a la F3·P4 y al P.D. 6 de la F4·P4. Ahora (calcos/cae-enemigo/v1):
//   · el pedido a la IA del CAE dice quién es quién (el sujeto es el enemigo de las fichas rojas) y que no invente
//     unidades; el de las hojas del G-3, que el enemigo es el del ejercicio y, si el CAE está mal, que no lo copie;
//   · «✓ Aplicar» en el CAE y en las hojas del G-3 avisa si quedó la misión propia o una unidad inventada;
//   · el CAE abierto en el G-2, el recuadro «🔎 Lo que entregó el G-2» y cada hoja del G-3 muestran el aviso fijo.
//
// SHA-256 de index-puntos-decision-20261024.js (antes de estos reemplazos): 1d65735175b9563da589ad2b6b87d6608fec85b12814ada87c063307027c78c4
const AVISO = '{fontSize:12,color:"#ffd479",background:"#3a2f12",border:"1px solid rgba(255,212,121,0.45)",borderRadius:6,padding:"8px 10px",lineHeight:1.45,margin:"6px 0",whiteSpace:"pre-line"}'
module.exports = [
  {
    nombre: 'Importa la revisión del CAE',
    viejo: 'import {sincronizarCarta as SIDPDSync} from "../puntos-decision/v1/carta.js?v=pd20261024";',
    nuevo:
      'import {sincronizarCarta as SIDPDSync} from "../puntos-decision/v1/carta.js?v=pd20261024";' +
      'import {pedidoCAE as SIDMEPedidoCAE,pedidoG3 as SIDMEPedidoG3,avisoAplicar as SIDMEAvisoAplicar,avisoHoja as SIDMEAvisoHoja,avisoG2 as SIDMEAvisoG2,despues as SIDMEDespues} from "../cae-enemigo/v1/revisar.mjs?v=cae20261024";',
    veces: 1,
  },
  {
    nombre: 'G-2: el pedido del CAE dice quién es quién y que no invente unidades',
    viejo: 'return cU(nt,SIDCaePrep(nt,t[nt.id],n),{expediente:de?.md||"",ayuda:yie(nt.id),modo:oe,seccion:"EM. Sec. G-2 (Inteligencia)",extra:Ge})}',
    nuevo: 'return SIDMEPedidoCAE(cU(nt,SIDCaePrep(nt,t[nt.id],n),{expediente:de?.md||"",ayuda:yie(nt.id),modo:oe,seccion:"EM. Sec. G-2 (Inteligencia)",extra:Ge}),nt,n)}',
    veces: 1,
  },
  {
    nombre: 'G-2: «✓ Aplicar» en el CAE avisa la misión propia o la unidad inventada',
    viejo: 'Revisalos y sacá la marca cuando los des por buenos.`}}',
    nuevo: 'Revisalos y sacá la marca cuando los des por buenos.${nt.id==="cae"?SIDMEAvisoAplicar(nt,at[nt.id],n):""}`}}',
    veces: 1,
  },
  {
    nombre: 'G-2: el aviso fijo arriba del CAE',
    viejo: 'f.jsxs("div",{style:qt.tituloHoja,children:[f.jsx("span",{style:qt.num,children:nt.num})," ",nt.nom]}),',
    nuevo:
      'f.jsxs("div",{style:qt.tituloHoja,children:[f.jsx("span",{style:qt.num,children:nt.num})," ",nt.nom]}),' +
      `nt.id==="cae"&&SIDMEAvisoHoja(nt,t.cae,n)&&f.jsx("div",{style:${AVISO},children:SIDMEAvisoHoja(nt,t.cae,n)}),`,
    veces: 1,
  },
  {
    nombre: 'G-3: las fuerzas del ejercicio para la revisión (fichas de todas las fases, la Orden y el PICB)',
    viejo: 'if(Ke){const he=ese(Ke.id);',
    nuevo: 'if(Ke){const he=ese(Ke.id),SIDctxG3={unidades:I.SIDdn||t,ordenSup:I.ordenSup||{},unidad:I.unidad||"",picb:I.picb||{}};',
    veces: 1,
  },
  {
    nombre: 'G-3: «🔎 Lo que entregó el G-2» avisa si el CAE está mal, y cada hoja si nombra una unidad inventada',
    viejo: 'Me.estadoFinal&&f.jsxs("div",{style:At.caeItem,children:[f.jsx("b",{children:"Su estado final deseado:"})," ",Me.estadoFinal]})]}),',
    nuevo:
      'Me.estadoFinal&&f.jsxs("div",{style:At.caeItem,children:[f.jsx("b",{children:"Su estado final deseado:"})," ",Me.estadoFinal]}),' +
      'SIDMEAvisoG2(I.picb,SIDctxG3)&&f.jsx("div",{style:{...At.caeAviso,whiteSpace:"pre-line"},children:SIDMEAvisoG2(I.picb,SIDctxG3)})]}),' +
      `SIDMEAvisoHoja(Ke,M[Ke.id],SIDctxG3)&&f.jsx("div",{style:${AVISO},children:SIDMEAvisoHoja(Ke,M[Ke.id],SIDctxG3)}),`,
    veces: 1,
  },
  {
    nombre: 'G-3: «✓ Aplicar» avisa si la hoja nombra una unidad inventada, y el pedido lleva «el enemigo es el del ejercicio»',
    viejo: 'Revisalos antes de darlos por buenos.`}}}',
    nuevo: 'Revisalos antes de darlos por buenos.${SIDMEAvisoAplicar(Ke,Tt[Ke.id],SIDctxG3)}`}},SIDdespues:SIDr=>SIDMEPedidoG3(SIDr,SIDctxG3)}',
    veces: 1,
  },
  {
    // El pedido del G-3 (onPedido) lo armó la PRC (reemplazos-2026-10-06-prc.js) y se deja igual: la regla se le
    // suma después, en la caja de la IA, con una prop nueva que sólo pasa el G-3.
    nombre: 'Caja de la IA (hU): «SIDdespues» retoca el pedido ya armado (sólo si se la pasan)',
    viejo: 'SIDonIndicacion:SIDonInd=null}){var r;',
    nuevo: 'SIDonIndicacion:SIDonInd=null}){var r;const SIDdesp=arguments[0]?.SIDdespues;',
    veces: 1,
  },
  {
    nombre: 'Caja de la IA (hU): copiar y descargar el pedido pasan por «SIDdespues»',
    viejo: '=await a(y,H);',
    nuevo: '=await SIDMEDespues(a(y,H),SIDdesp);',
    veces: 2,
  },
]
