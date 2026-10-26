// Reemplazos del 2026-10-26 sobre calcos/assets/index-evento-fases-20261025.js → index-op3-20261026.js.
// Sergio, con la F6·P4 «Orden Preparatoria N° 3» del CE-I después de «Completar y mejorar»: «III.- EJECUCIÓN · A.
// Concepto de la operación (el CAP aprobado)» quedaba VACÍA (y el Word decía «Concepto de la operación.» sin nada), y
// el aviso nombraba como inventadas la «DIV MEC-1» (un adyacente de la Orden) y la «VI División de Ejército» (la
// «VI DE» de la Orden). La lógica está en orden-preparatoria/v1/prep.mjs y cae-enemigo/v1/revisar.mjs; acá:
//   · los imports (el de revisar.mjs y el de panel.js con versión nueva: panel.js suma cartaParaDocumentos);
//   · 🌱 de las Órdenes Preparatorias: el CAP aprobado, las tareas por fase y cada cosa en SU casilla;
//   · 🤖 el pedido de la IA: «LA O.P. N° 3 ES CASI LA ORDEN DE OPERACIONES» y lo que ya trabajó el G-3;
//   · ✓ Aplicar: lo que la IA dejó vacío se llena con lo de la Mesa (y lo dice);
//   · la clave que la IA escribe con otras palabras («… (CAP aprobado)») ya no se tira.
//
// SHA-256 de index-evento-fases-20261025.js (antes de estos reemplazos): 2a395fca30c4a04dfa9e5b70d4aa5bab46974c1ecc7a78f8464c541256d80640
const SEMILLA = '{...I,unidades:I.SIDdn||t,g3:M}'
module.exports = [
  {
    nombre: 'Los imports: panel.js con versión nueva y cartaParaDocumentos, y la O.P. N° 3',
    viejo: 'import SIDCapPanel,{configurarCAP as SIDCapConfig,botonesCAP as SIDCapBotones,pedidoCAP as SIDCapPedido} from "../cap-propios/v1/panel.js?v=iti20261025";',
    nuevo: 'import SIDCapPanel,{configurarCAP as SIDCapConfig,botonesCAP as SIDCapBotones,pedidoCAP as SIDCapPedido,cartaParaDocumentos as SIDCapDocs} from "../cap-propios/v1/panel.js?v=op320261026";import {semillaPrep as SIDPrepSemilla,ordenarHoja as SIDPrepOrdenar,trasIA as SIDPrepTras,avisoTrasIA as SIDPrepAviso,claveParecida as SIDPrepClave,pedidoPrep as SIDPrepPedido} from "../orden-preparatoria/v1/prep.mjs?v=op320261026";',
    veces: 1,
  },
  {
    nombre: 'revisar.mjs con versión nueva (DIV MEC-1, VI DE y sólo las casillas que se ven)',
    viejo: 'revisar.mjs?v=cae20261024',
    nuevo: 'revisar.mjs?v=cae20261026',
    veces: 1,
  },
  {
    nombre: '🌱 de las Órdenes Preparatorias: el CAP aprobado y cada cosa en su casilla',
    viejo: ',de=he=>{const at=l3e(he.autollena||he.id,{...I,unidades:t,medidos:g,opcIng:ge,g3:M});',
    nuevo: `,de=he=>{const at=SIDPrepSemilla(he,l3e(he.autollena||he.id,{...I,unidades:t,medidos:g,opcIng:ge,g3:M}),${SEMILLA},SIDCapDocs(${SEMILLA}));`,
    veces: 1,
  },
  {
    nombre: '🌱: lo guardado con un rótulo que la hoja no tiene pasa a su casilla',
    viejo: 'Ge(he.id,iq(M[he.id],at))};if(ve)',
    nuevo: 'Ge(he.id,SIDPrepOrdenar(he,iq(M[he.id],at)).valor)};if(ve)',
    veces: 1,
  },
  {
    nombre: '🤖 el pedido de la IA de las Órdenes Preparatorias',
    viejo: 'SIDdespues:SIDr=>SIDCapPedido(SIDMEPedidoG3(SIDr,SIDctxG3),Ke,SIDctxCap)',
    nuevo: 'SIDdespues:SIDr=>SIDPrepPedido(SIDCapPedido(SIDMEPedidoG3(SIDr,SIDctxG3),Ke,SIDctxCap),Ke,SIDctxCap,()=>SIDCapDocs(SIDctxCap))',
    veces: 1,
  },
  {
    nombre: '✓ Aplicar: lo que la IA dejó vacío se llena con lo de la Mesa',
    viejo: 'const{hojas:Tt,puestos:Dt}=sP({[Ke.id]:M[Ke.id]},{[Ke.id]:tt.datos},{pisar:qe==="completar_mejorar"});return Ge(Ke.id,Tt[Ke.id]),',
    nuevo: 'const{hojas:Tt,puestos:Dt}=sP({[Ke.id]:M[Ke.id]},{[Ke.id]:tt.datos},{pisar:qe==="completar_mejorar"});const SIDpt=SIDPrepTras(Ke,Tt[Ke.id],()=>SIDPrepSemilla(Ke,l3e(Ke.autollena||Ke.id,{...I,unidades:t,medidos:g,opcIng:ge,g3:M}),SIDctxCap,SIDCapDocs(SIDctxCap)));Tt[Ke.id]=SIDpt.valor;return Ge(Ke.id,Tt[Ke.id]),',
    veces: 1,
  },
  {
    nombre: '✓ Aplicar: el mensaje dice qué se llenó con lo de la Mesa',
    viejo: 'Revisalos antes de darlos por buenos.${SIDMEAvisoAplicar(Ke,Tt[Ke.id],SIDctxG3)}',
    nuevo: 'Revisalos antes de darlos por buenos.${SIDPrepAviso(SIDpt)}${SIDMEAvisoAplicar(Ke,Tt[Ke.id],SIDctxG3)}',
    veces: 1,
  },
  {
    nombre: 'La clave escrita con otras palabras («… (CAP aprobado)») va a su casilla',
    viejo: 'const G=S.has(SIDG)?SIDG:SIDEMClave(SIDG,v.claves)||SIDG',
    nuevo: 'const G=S.has(SIDG)?SIDG:SIDEMClave(SIDG,v.claves)||SIDPrepClave(SIDG,v.claves)||SIDG',
    veces: 1,
  },
]
