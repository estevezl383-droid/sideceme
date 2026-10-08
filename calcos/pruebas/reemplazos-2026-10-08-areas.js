// Parche acotado y reversible. No reconstruye las otras funcionalidades.
const r = (nombre, viejo, nuevo) => ({ nombre, viejo, nuevo, veces: 1 })
module.exports = [
  r('Módulo de áreas', 'import SIDInicioEjercicio from', 'import SIDAreasEditor from "../areas-operaciones/editor.mjs";import {agregarArea as SIDAgregarAO,borrarAreaActiva as SIDBorrarAO,dibujarOtrasAreas as SIDOtrasAO} from "../areas-operaciones/modelo.mjs";\nimport SIDInicioEjercicio from'),
  r('Nuevo ejercicio limpia plan y estado académico', 'sp({g1:{},g4:{},g5:{}}),jl([]),ol(null)', 'sp({g1:{},g4:{},g5:{}}),jl([]),setPlanFuegos(null),setModoFuegos(!1),setAcadMesa(null),$n(null),SIDsetPasoUnidad(false),ol(null)'),
  r('Abrir ejercicio termina el modo de captura', 'setPlanFuegos(Ee.planFuegos||null),Ee.anillosUnidades', 'setPlanFuegos(Ee.planFuegos||null),setModoFuegos(!1),$n(null),Ee.anillosUnidades'),
  r('Importar una BASE no arrastra el plan anterior', 'Sn(ct.ops||Vt),ua(ct.cmoc||an)', 'Sn(ct.ops||Vt),setPlanFuegos(null),setModoFuegos(!1),setAcadMesa(null),$n(null),ua(ct.cmoc||an)'),
  r('Conservar área anterior al terminar un nuevo trazado',
    'return{...ct,areaOps:{coords:Qe.coords,frente:Qe.frente||null,tipo:Qe.tipo||"defensiva",modalidad:Qe.modalidad||"tenaz",ambiente:Qe.ambiente||"llano",frenteM:Math.round(on.frenteM||0),profM:Math.round(on.profM||0),azimut:on.azimut??null}}',
    'return SIDAgregarAO(ct,{coords:Qe.coords,frente:Qe.frente||null,tipo:Qe.tipo||"defensiva",modalidad:Qe.modalidad||"tenaz",ambiente:Qe.ambiente||"llano",frenteM:Math.round(on.frenteM||0),profM:Math.round(on.profM||0),azimut:on.azimut??null})'),
  r('Borrar solamente el área activa', 'if(Ee==="areaOps"||Ee==="influenciaTrazada")Sn(Qt=>({...Qt,[Ee]:null}));', 'if(Ee==="areaOps")Sn(Qt=>SIDBorrarAO(Qt));else if(Ee==="influenciaTrazada")Sn(Qt=>({...Qt,[Ee]:null}));'),
  r('Propiedades del panel', 'function _Ce({tipo:t,', 'function _Ce({SIDops,SIDonOps,SIDejercicio,SIDdeshacer,tipo:t,'),
  r('Gestor de áreas en el panel', 'f.jsx("div",{style:eu.estado,children:T}),f.jsx(Eae,', 'f.jsx("div",{style:eu.estado,children:T}),f.jsx(SIDAreasEditor,{react:je,ops:SIDops,onOps:SIDonOps,ejercicio:SIDejercicio,onDeshacer:SIDdeshacer}),f.jsx(Eae,'),
  r('Conectar gestor al estado y a deshacer', 'f.jsx(_Ce,{areaInfluencia:zl,', 'f.jsx(_Ce,{SIDops:Lt,SIDonOps:next=>{if(ll){Nl();return}if(Bn){he("🔒 Ejercicio finalizado: duplíquelo para editar.");return}Sn(next)},SIDejercicio:wn,SIDdeshacer:()=>{if(!ll&&!Bn)la()},areaInfluencia:zl,'),
  r('Instrucción para trazar sin reemplazo', '✏️ Vas a trazar OTRA Área de Operaciones: reemplaza a la que ya hay. PASO 1: marcá el FRENTE.', '✏️ Vas a agregar OTRA Área de Operaciones. Las anteriores se conservan. PASO 1: marcá el FRENTE.'),
  r('Etiqueta del botón', '"▧ Trazar el Área ",E?"(de nuevo)":""', '"▧ Trazar el Área ",E?"(agregar otra)":""'),
  r('Mostrar las áreas conservadas en 2D', 'if(((Gn=(pa=T.areaOps)', 'SIDOtrasAO(Rt,_n,T,Ra);if(((Gn=(pa=T.areaOps)'),
]
