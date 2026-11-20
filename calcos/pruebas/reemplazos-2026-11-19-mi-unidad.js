// ============================================================
// reemplazos-2026-11-19-mi-unidad.js — sobre `index-acostar-20261117.js` → `index-mi-unidad-20261119.js`
//
// Sergio (19-11-2026), con la F2·P3 y los apéndices de organización del tema base «DIAMANTE»: que los
// alumnos digan QUIÉN SON, de quién dependen, sus adyacentes y quiénes dependen de ellos, y que coloquen sus
// unidades de una vez (las listas de los apéndices, editables: hay 4 CE y a veces más divisiones). Como el
// ejercicio ya está corriendo, que al ABRIR un ejercicio sin esos datos aparezca la ventana para regularizar.
//
// Todo lo que se ve está en `organizacion/v1/mi-unidad.mjs` (archivo NUEVO). Acá sólo se conecta:
//   1. el import del módulo nuevo;
//   2. `SIDcfgPuente()` (en la Mesa, al lado de la identidad de siempre): datos + guardar (identidad, Orden
//      superior: unidad / escalonSuperior / unidadesAdyacentes, ops.configUnidad, puesto) + colocar (con ↶);
//   3. el puente viaja al tablero del G-3 en su ctx (`SIDcfg`);
//   4. en la F2·P3, «🪖 Mi unidad y su contexto» en lugar del recuadro de antes, que queda plegado abajo
//      (y vuelve solo si el módulo nuevo fallara);
//   5. la ventana que aparece al abrir un ejercicio sin configurar;
//   6. el nombre de la hoja F2·P3 dice también «Mi unidad y sus dependientes».
// Reversible byte por byte (de ↔ a). Cada «de» aparece UNA sola vez en el compilado de entrada.
// ============================================================
export const REEMPLAZOS = [
  {
    nombre: '1 · import de organizacion/v1/mi-unidad.mjs',
    de: String.raw`fichaColocada as SIDOrgFicha} from "../organizacion/v1/organigrama.mjs?v=20261110";`,
    a: String.raw`fichaColocada as SIDOrgFicha} from "../organizacion/v1/organigrama.mjs?v=20261110";import {MiUnidadCaja as SIDMiCaja,AvisoMiUnidad as SIDMiAviso} from "../organizacion/v1/mi-unidad.mjs?v=20261119";`,
  },
  {
    nombre: '2 · SIDcfgPuente (datos, guardar y colocar)',
    de: String.raw`,[wn,Lt,Tn,ut]);SIDMilContexto(`,
    a: String.raw`,[wn,Lt,Tn,ut]);const SIDcfgPuente=()=>({ejercicio:wn,ops:Lt||{},orden:Tn||{},unidades:dn||[],puesto:Ha||null,finalizado:!!Bn,guardar:SIDc=>{if(Bn){he("🔒 Ejercicio finalizado: duplíquelo para editar.");return}try{SIDelegirUnidad({nombre:SIDc.unidad,escalon:SIDc.nivel,fuente:"🪖 Mi unidad y su contexto"})}catch(SIDe){console.warn("Mi unidad:",SIDe)}$s(SIDa=>({...SIDa,unidad:SIDc.unidad,escalonSuperior:SIDc.superior||"",unidadesAdyacentes:(SIDc.adyacentes||[]).join(", ")}));Sn(SIDa=>({...SIDa,configUnidad:{...SIDc,confirmada:!0,fecha:new Date().toISOString()}}));if(SIDc.puesto&&SIDc.puesto!==Ha){t9(SIDc.puesto);xN(Pc);Pr(SIDc.puesto)}},colocar:SIDf=>{if(Bn){he("🔒 Ejercicio finalizado: duplíquelo para editar.");return null}let SIDr=null;try{SIDr=SIDf(dn||[])}catch(SIDe){console.warn("Mis unidades:",SIDe)}if(!SIDr)return null;SIDr.unidades&&(SIDlaU(),Ra(SIDr.unidades));SIDr.aviso&&za(SIDr.aviso);return SIDr},aviso:SIDm=>za(SIDm)});SIDMilContexto(`,
  },
  {
    nombre: '3 · el puente en el ctx del tablero del G-3',
    de: String.raw`SIDdn:dn,SIDcap:SIDcapAcc,SIDplan:planFuegos}`,
    a: String.raw`SIDdn:dn,SIDcap:SIDcapAcc,SIDplan:planFuegos,SIDcfg:SIDcfgPuente()}`,
  },
  {
    nombre: '4 · F2·P3: «🪖 Mi unidad y su contexto» (el recuadro de antes, plegado abajo)',
    de: String.raw`Ke.id==="tareas"&&f.jsx(SIDOrgCaja,{R:{jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,Fragment:f.Fragment},unidades:I.SIDdn||t,unidad:I.unidad||"",onDisgregar:SIDdg3,onAgregar:SIDao3})`,
    a: String.raw`Ke.id==="tareas"&&f.jsx(SIDMiCaja,{react:je,puente:I.SIDcfg,otras:f.jsx(SIDOrgCaja,{R:{jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,Fragment:f.Fragment},unidades:I.SIDdn||t,unidad:I.unidad||"",onDisgregar:SIDdg3,onAgregar:SIDao3})},"mi-unidad-"+String(I.SIDcfg&&I.SIDcfg.ejercicio||""))`,
  },
  {
    nombre: '5 · la ventana al abrir un ejercicio sin configurar',
    de: String.raw`f.jsx(Eze,{es3D:Ka})`,
    a: String.raw`f.jsx(Eze,{es3D:Ka}),f.jsx(SIDMiAviso,{react:je,puente:SIDcfgPuente()})`,
  },
  {
    nombre: '6 · nombre de la F2·P3',
    de: String.raw`nom:"Tareas específicas, implícitas y esenciales de Operaciones",`,
    a: String.raw`nom:"Tareas específicas, implícitas y esenciales de Operaciones · Mi unidad y sus dependientes",`,
  },
]
