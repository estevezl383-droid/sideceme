// Reemplazos del 2026-10-20 sobre calcos/assets/index-rotulo-avenidas-20261019.js → index-plantilla-ajuste-20261020.js.
// Lo pidió Sergio con las capturas de la H.T. P.D. «Ataque de penetración en dos escalones» acostada:
// «me la acostó al otro lado… la línea principal de resistencia está al otro lado y el ataque debería
// venir de izquierda a derecha… dame una opción que me permita acomodar la dirección y aparte mover la
// plantilla, o sea mover todo y luego uno por uno».
//
// Qué pasaba: s9 toma como FRENTE el primer lado trazado del Área de Operaciones (`areaOps.frente`) y
// cada avenida desde su primer punto. Con el A.O. empezado por el lado norte, la plantilla salió contra
// el norte aunque la L.P.R. y el enemigo estaban al oeste. Y una vez acostada no se podía mover.
//
// Qué se hace (la lógica está en calcos/plantilla-ajuste/v1/ajuste.mjs):
//   · las 3 llamadas a s9 (Acostar, la plantilla rehecha para objetivos/maniobra y el peor caso del CAE)
//     toman el frente y las avenidas de entradaPlantilla(areaOps, picb._pd, avenidas): con «🧭 ¿De dónde
//     viene el enemigo?» elegido, el frente es el lado del A.O. que mira hacia allá; y marcarDireccion
//     lo deja dicho en la L.P.R. y en los avisos;
//   · la hoja P.D. muestra el panel (rosa de direcciones + mover / girar / arrastrar);
//   · la carta deja arrastrar las fichas de la plantilla (toda junta o una por vez) y no re-encuadra
//     cuando la plantilla se ajusta a mano.
//
// SHA-256 de index-rotulo-avenidas-20261019.js (antes de estos reemplazos): 3a590906fecdc5b632ad49d64133d6d01097553d98c8cd382157469659cf498a

module.exports = [
  {
    nombre: 'Import del módulo de ajuste de la plantilla',
    viejo: 'import {usarAutoguardado as SIDusarAutoguardado,',
    nuevo: 'import {entradaPlantilla as SIDEntradaPl,marcarDireccion as SIDMarcarDirPl,PanelAjuste as SIDAjustePl,arrastrarPlantilla as SIDArrastrarPl,moverFicha as SIDMoverFichaPl} from "../plantilla-ajuste/v1/ajuste.mjs?v=plantilla20261020";import {usarAutoguardado as SIDusarAutoguardado,',
    veces: 1,
  },
  {
    nombre: 'Acostar (r1): frente y avenidas según de dónde viene el enemigo',
    viejo: 'r1=je.useCallback(({esquema:Ee=null,asignacion:Qe={},nivel:ot=null}={})=>{var ct,xt,Qt,on;const Ht=s9({avenidas:(Jt.avenidas||[]).filter(vn=>vn.bando!=="amigo"),aoCoords:((ct=Lt.areaOps)==null?void 0:ct.coords)||null,aoFrente:((xt=Lt.areaOps)==null?void 0:xt.frente)||null,esquema:Ee,asignacion:Qe,bando:"enemigo",opcionesEsquema:{nivel:ot||cl.nivel,maniobra:cl.maniobra,nManiobra:cl.n,ambiente:((Qt=Lt.areaOps)==null?void 0:Qt.ambiente)||"llano",manual:Ee?.manual||((on=$i?._pd)==null?void 0:on.manual)||"fc"},...cu});',
    nuevo: 'r1=je.useCallback(({esquema:Ee=null,asignacion:Qe={},nivel:ot=null,SIDdir:SIDd=void 0}={})=>{var ct,xt,Qt,on;const SIDpd=SIDd!==void 0?{...$i?._pd,dirEnemigo:SIDd}:$i?._pd,Ht=SIDMarcarDirPl(s9({...SIDEntradaPl(Lt.areaOps,SIDpd,(Jt.avenidas||[]).filter(vn=>vn.bando!=="amigo")),aoCoords:((ct=Lt.areaOps)==null?void 0:ct.coords)||null,esquema:Ee,asignacion:Qe,bando:"enemigo",opcionesEsquema:{nivel:ot||cl.nivel,maniobra:cl.maniobra,nManiobra:cl.n,ambiente:((Qt=Lt.areaOps)==null?void 0:Qt.ambiente)||"llano",manual:Ee?.manual||((on=$i?._pd)==null?void 0:on.manual)||"fc"},...cu}),SIDpd);',
    veces: 1,
  },
  {
    nombre: 'Plantilla rehecha (uu): frente y avenidas según de dónde viene el enemigo',
    viejo: 'const Ht=s9({avenidas:(Jt.avenidas||[]).filter(vn=>vn.bando!=="amigo"),aoCoords:((Qe=Lt.areaOps)==null?void 0:Qe.coords)||null,aoFrente:((ot=Lt.areaOps)==null?void 0:ot.frente)||null,esquema:on,asignacion:{},bando:"enemigo",opcionesEsquema:xt,...cu});',
    nuevo: 'const Ht=SIDMarcarDirPl(s9({...SIDEntradaPl(Lt.areaOps,ct,(Jt.avenidas||[]).filter(vn=>vn.bando!=="amigo")),aoCoords:((Qe=Lt.areaOps)==null?void 0:Qe.coords)||null,esquema:on,asignacion:{},bando:"enemigo",opcionesEsquema:xt,...cu}),ct);',
    veces: 1,
  },
  {
    nombre: 'Peor caso del CAE (Tg): frente y avenidas según de dónde viene el enemigo',
    viejo: 'na=s9({avenidas:(Jt.avenidas||[]).filter(cw=>cw.bando!=="amigo"),aoCoords:((xt=Lt.areaOps)==null?void 0:xt.coords)||null,aoFrente:((Qt=Lt.areaOps)==null?void 0:Qt.frente)||null,esquema:Ap,asignacion:l1,bando:"enemigo",opcionesEsquema:mc,...cu})',
    nuevo: 'na=SIDMarcarDirPl(s9({...SIDEntradaPl(Lt.areaOps,vr,(Jt.avenidas||[]).filter(cw=>cw.bando!=="amigo")),aoCoords:((xt=Lt.areaOps)==null?void 0:xt.coords)||null,esquema:Ap,asignacion:l1,bando:"enemigo",opcionesEsquema:mc,...cu}),vr)',
    veces: 1,
  },
  {
    nombre: 'Mesa: estado del modo de arrastre de la plantilla',
    viejo: '[Zi,ol]=je.useState(null),',
    nuevo: '[Zi,ol]=je.useState(null),[SIDarrPl,SIDsetArrPl]=je.useState(null),',
    veces: 1,
  },
  {
    nombre: 'Mesa → tablero del G-2: el ajuste de la plantilla',
    viejo: 'plantilla:Zi,onDibujarPlantilla:r1,onBorrarPlantilla:kv,',
    nuevo: 'plantilla:Zi,SIDajustePl:{modo:SIDarrPl,onModo:SIDsetArrPl,onAjustar:ol},onDibujarPlantilla:r1,onBorrarPlantilla:kv,',
    veces: 1,
  },
  {
    nombre: 'Tablero del G-2 (iLe): recibe el ajuste',
    viejo: 'plantilla:E=null,onDibujarPlantilla:S,onBorrarPlantilla:M,',
    nuevo: 'plantilla:E=null,SIDajustePl:SIDaj=null,onDibujarPlantilla:S,onBorrarPlantilla:M,',
    veces: 1,
  },
  {
    nombre: 'Tablero del G-2 → hoja P.D.: el ajuste',
    viejo: 'plantilla:E,onDibujar:S,onBorrar:M,fuerza:T,',
    nuevo: 'plantilla:E,SIDajustePl:SIDaj,onDibujar:S,onBorrar:M,fuerza:T,',
    veces: 1,
  },
  {
    nombre: 'Hoja P.D. (rLe): recibe el ajuste',
    viejo: 'plantilla:i,onDibujar:o,onBorrar:s,fuerza:r=null,',
    nuevo: 'plantilla:i,SIDajustePl:SIDaj=null,onDibujar:o,onBorrar:s,fuerza:r=null,',
    veces: 1,
  },
  {
    nombre: 'Hoja P.D.: panel 🧭 ¿De dónde viene el enemigo? + ✋ acomodar, antes del botón Acostar',
    viejo: 'f.jsxs("button",{style:qt.plBtn,disabled:!re||!a.length,onClick:()=>o?.({esquema:Se,nivel:te,asignacion:Object.fromEntries(Object.entries(Ce).filter(([,Fe])=>Fe!==""))}),children:["🗺️ Acostar «"',
    nuevo: 're&&f.jsx(SIDAjustePl,{react:je,pd:t,onPd:e,plantilla:i,ajuste:SIDaj,onReacostar:SIDd=>a.length&&o?.({esquema:Se,nivel:te,asignacion:Object.fromEntries(Object.entries(Ce).filter(([,Fe])=>Fe!=="")),SIDdir:SIDd})}),f.jsxs("button",{style:qt.plBtn,disabled:!re||!a.length,onClick:()=>o?.({esquema:Se,nivel:te,asignacion:Object.fromEntries(Object.entries(Ce).filter(([,Fe])=>Fe!==""))}),children:["🗺️ Acostar «"',
    veces: 1,
  },
  {
    nombre: 'Mesa → carta: el ajuste de la plantilla',
    viejo: 'plantilla:Zi,onEditarPosDef:i1,',
    nuevo: 'plantilla:Zi,SIDajustePl:{modo:SIDarrPl,onAjustar:ol},onEditarPosDef:i1,',
    veces: 1,
  },
  {
    nombre: 'Carta (kve): recibe el ajuste',
    viejo: 'plantilla:jt=null,dibujando:tn=!1}){const jn=ZK[y]',
    nuevo: 'plantilla:jt=null,SIDajustePl:SIDaj=null,dibujando:tn=!1}){const jn=ZK[y]',
    veces: 1,
  },
  {
    nombre: 'Carta → capa de la plantilla: el ajuste',
    viejo: 'f.jsx(lve,{plantilla:jt,ver:oe?oe.plantilla!==!1:!0,sinFichas:t,partes:oe,dibujando:tn})',
    nuevo: 'f.jsx(lve,{plantilla:jt,ver:oe?oe.plantilla!==!1:!0,sinFichas:t,partes:oe,dibujando:tn,SIDajuste:SIDaj})',
    veces: 1,
  },
  {
    nombre: 'Capa de la plantilla (lve): recibe el ajuste',
    viejo: 'function lve({plantilla:t,ver:e=!0,sinFichas:n=!1,partes:a=null,dibujando:dj=!1}){',
    nuevo: 'function lve({plantilla:t,ver:e=!0,sinFichas:n=!1,partes:a=null,dibujando:dj=!1,SIDajuste:SIDaj=null}){',
    veces: 1,
  },
  {
    nombre: 'Capa de la plantilla: se rearma al cambiar el modo de arrastre',
    viejo: '},[i,t,e,n,o,dj]),null}function cve(',
    nuevo: '},[i,t,e,n,o,dj,SIDaj?.modo]),null}function cve(',
    veces: 1,
  },
  {
    nombre: 'Capa de la plantilla: las fichas se arrastran (toda la plantilla o una por vez)',
    viejo: 'interactive:!dj,zIndexOffset:I.rol==="artilleria"?640:620}).addTo(y)',
    nuevo: 'interactive:!dj,draggable:!dj&&!!SIDaj?.modo,zIndexOffset:I.rol==="artilleria"?640:620}).on("dragend",SIDev=>{const SIDll=SIDev.target.getLatLng(),SIDde=fueraDelAgua(I.centro),SIDa=[SIDll.lng,SIDll.lat];SIDaj?.onAjustar?.(SIDp=>SIDaj.modo==="todo"?SIDArrastrarPl(SIDp,SIDde,SIDa):SIDMoverFichaPl(SIDp,I,SIDde,SIDa))}).addTo(y)',
    veces: 1,
  },
  {
    nombre: 'Capa de la plantilla: no re-encuadra la carta cuando se la ajusta a mano',
    viejo: 'M.length&&(!T||T.t!==t||T.e!==e||T.n!==n)',
    nuevo: 'M.length&&(!T||T.t!==t&&!(t&&t.SIDajustada)||T.e!==e||T.n!==n)',
    veces: 1,
  },
]
