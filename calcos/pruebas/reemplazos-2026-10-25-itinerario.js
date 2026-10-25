// Reemplazos del 2026-10-25 sobre calcos/assets/index-todas-fichas-20261024.js → index-itinerario-20261025.js.
// Sergio, con la FASE I del CAP 1 a la vista: «la OC y la OD deben permanecer con su nombre con la unidad… están solas
// ya esperando en un lugar; eso se mueve con la unidad», «las tareas tácticas deben aparecer con la unidad, no deben
// aparecer solas», «que su desplazamiento quede marcado con una línea flecha… uno violeta y otro fucsia… en la fase
// última todo su itinerario» y «el CAP 2 no está funcionando nada». La lógica está fuera del compilado
// (calcos/cap-propios/v1/tareas-fase.mjs, itinerario.mjs, posiciones.mjs, carta-ia.mjs, proponer.mjs, panel.js y
// calcos/organizacion/v1/carta.js); acá:
//   · el itinerario con flechas (itinerario.mjs) se sincroniza con las fases, la fase a la vista, el G-3 (qué CAP) y las
//     fichas;
//   · la capa de la F3·P3 (organizacion/v1/carta.js) recibe la fase a la vista (en una fase propia, el rótulo OD / OC
//     va con su unidad);
//   · el panel de los CAP y proponer.mjs con versión nueva, para que el navegador no use los de antes.
//
// SHA-256 de index-todas-fichas-20261024.js (antes de estos reemplazos): 26aaf60613f2e7ac89a145be538a6fbf1d2cd53a698cd0bc7cae0b318d67a026
module.exports = [
  {
    nombre: 'El panel de los CAP con versión nueva y el import del itinerario con flechas',
    viejo: 'from "../cap-propios/v1/panel.js?v=todas20261024";',
    nuevo: 'from "../cap-propios/v1/panel.js?v=iti20261025";import {sincronizarItinerario as SIDCapIti} from "../cap-propios/v1/itinerario.mjs?v=iti20261025";',
    veces: 1,
  },
  {
    nombre: 'proponer.mjs (armar el CAP guardado desde su tarjeta, cada tarea con su unidad) con versión nueva',
    viejo: 'from "../cap-propios/v1/proponer.mjs?v=todas20261024";',
    nuevo: 'from "../cap-propios/v1/proponer.mjs?v=iti20261025";',
    veces: 1,
  },
  {
    nombre: 'La capa de la F3·P3 recibe la fase a la vista (el rótulo OD / OC con su unidad)',
    viejo: 'je.useEffect(()=>{SIDOISync({ops:Lt,g3:Ya,unidades:dn,setOps:Sn,setG3:ns,marcar:la,setOrgTarea:jl,setUnidades:Ra,irA:In,setModo:setModoOI,centro:()=>Da.current})},[Lt,Ya,dn]);',
    nuevo: 'je.useEffect(()=>{SIDOISync({ops:Lt,g3:Ya,unidades:dn,setOps:Sn,setG3:ns,marcar:la,setOrgTarea:jl,setUnidades:Ra,irA:In,setModo:setModoOI,centro:()=>Da.current,faseActiva:yt})},[Lt,Ya,dn,yt]);',
    veces: 1,
  },
  {
    nombre: 'El itinerario de cada unidad con flechas (CAP 1 violeta, CAP 2 fucsia), junto a los puntos de decisión',
    viejo: 'je.useEffect(()=>{SIDPDSync({ops:Lt,g3:Ya,ver:ai.ains!==!1,setG3:ll||Bn?null:ns})},[Lt,Ya,ai.ains,ll,Bn]);',
    nuevo: 'je.useEffect(()=>{SIDPDSync({ops:Lt,g3:Ya,ver:ai.ains!==!1,setG3:ll||Bn?null:ns})},[Lt,Ya,ai.ains,ll,Bn]);je.useEffect(()=>{SIDCapIti({fasesCOA:Yn,faseActiva:yt,g3:Ya,unidades:dn,ver:ai.unidadesAzul!==!1})},[Yn,yt,Ya,dn,ai.unidadesAzul]);',
    veces: 1,
  },
]
