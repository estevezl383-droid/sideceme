// Reemplazos del 2026-10-16 sobre calcos/assets/index-tijera-20261016.js → index-huellas-20261016.js.
// Lo pidió Sergio con dos capturas del botón «⚙️ 🛤️ Huellas y sendas (OSM al día — Vía 3/4) (🇧🇴)…»:
//   «en momentos hace que la aplicación se cuelgue y pareciera que todo el programa falló…
//   especialmente cuando las áreas son más grandes».
//
// Qué pasaba (reproducido en Chromium con la Mesa real, e2e/huellas.cjs):
//   · si OpenStreetMap (Overpass) no contestaba, ⚡ GENERAR CALCOS esperaba para siempre en ese paso
//     (el pedido no tenía tiempo máximo);
//   · con un área grande, OSM devuelve decenas de miles de caminos y la Mesa los recortaba al área uno
//     por uno con turf, en el hilo de la página: con un área de 1°×1° y 30.000 caminos, la pestaña
//     quedaba congelada 13 s seguidos (con 3°×3°, minutos, o el navegador la mataba).
//
// Las huellas pasan a calcos/huellas/v1 (código legible, ver su README): Web Worker, tiempos máximos,
// recorte rápido al Área de Interés, tope de caminos y avisos. Acá sólo:
//   · el import nuevo (y `alAvisar`, para mostrar el progreso en el botón);
//   · ⚡ GENERAR CALCOS muestra el progreso de OSM, el aviso de la capa (`_aviso`) y no vuelve a recortar
//     lo que ya llega recortado (`_recortada`);
//   · lo que no se pudo traer (`_reintentar`) no queda en la caché: se puede volver a generar;
//   · el ⚙️ Calcular automáticamente del CMOC muestra el progreso y el aviso de OSM.
const V = '?v=huellas20261016'
module.exports = [
  {
    nombre: 'Huellas · el aviso de progreso de calcos/huellas',
    viejo: 'import {usarAutoguardado as SIDusarAutoguardado,sello as SIDselloGuardado} from "../guardado/v1/autoguardado.mjs?v=guardado20261010";',
    nuevo: `import {usarAutoguardado as SIDusarAutoguardado,sello as SIDselloGuardado} from "../guardado/v1/autoguardado.mjs?v=guardado20261010";import {alAvisar as SIDavisoHuellas} from "../huellas/v1/huellas-osm.mjs${V}";`,
    veces: 1,
  },
  {
    nombre: 'Huellas · el módulo nuevo en lugar de assets/huellasOSM-B2eaicIK.js',
    viejo: 'import("./huellasOSM-B2eaicIK.js")',
    nuevo: `import("../huellas/v1/huellas-osm.mjs${V}")`,
    veces: 1,
  },
  {
    nombre: 'Huellas · ⚡ GENERAR CALCOS: progreso, aviso y sin recortar dos veces',
    viejo: 'Ge(`${Ht.icono} ${nh[na].nombre}${on?` (${Va.bandera})`:""}…`),await PN(30);const Bi=await Lc(na,Va.id),vr=rF(Bi,Ae);',
    nuevo: 'Ge(`${Ht.icono} ${nh[na].nombre}${on?` (${Va.bandera})`:""}…`),await PN(30);const SIDsueltaH=nh[na].envivo?SIDavisoHuellas(SIDtxH=>Ge(`${Ht.icono} ${SIDtxH}`)):null;let Bi;try{Bi=await Lc(na,Va.id)}finally{SIDsueltaH?.()}Bi?._aviso&&he(SIDprevH=>SIDprevH?`${SIDprevH} · ${Bi._aviso}`:Bi._aviso);const vr=Bi?._recortada?Bi:rF(Bi,Ae);',
    veces: 1,
  },
  {
    nombre: 'Huellas · lo que no se pudo traer no queda en la caché',
    viejo: 'return tt.current[ct]=xt,Qe===X&&_e(',
    nuevo: 'return xt?._reintentar||(tt.current[ct]=xt),Qe===X&&_e(',
    veces: 1,
  },
  {
    nombre: 'Huellas · ⚙️ Calcular automáticamente (CMOC): progreso y aviso',
    viejo: 'for(let Bi=0;Bi<2&&!Ja;Bi++)try{Ja=await Lc(vn,na.id)}catch(vr){Va=vr,Bi===0&&await PN(150)}',
    nuevo: 'for(let Bi=0;Bi<2&&!Ja;Bi++)try{const SIDsueltaH=nh[vn]?.envivo?SIDavisoHuellas(Ge):null;try{Ja=await Lc(vn,na.id)}finally{SIDsueltaH?.()}}catch(vr){Va=vr,Bi===0&&await PN(150)}Ja?._aviso&&he(SIDprevH=>SIDprevH?`${SIDprevH} · ${Ja._aviso}`:Ja._aviso);',
    veces: 1,
  },
]
