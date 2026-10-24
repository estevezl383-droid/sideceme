// Reemplazos del 2026-10-24 sobre calcos/assets/index-json-ia-20261024.js → index-fases-cap-20261024.js.
// Sergio, con el panel de los dos CAP de la F3·P6: «aquí debería aparecer los cursos de acción, o sea CAP 1 fase I se
// le da clic y se ven las fichas donde están, se le da clic fase 2 aparecen donde deberían estar… así como muestra en
// la del enemigo». Ahora cada CAP del panel tiene sus botones FASE I, II… (calcos/cap-propios/v1/panel.js): tocar una
// fase la pone en la carta como en el 🎬 C.A. por fases; si es del CAP guardado, primero se cambia de CAP.
//
// SHA-256 de index-json-ia-20261024.js (antes de estos reemplazos): bb6b73ab7919f06c66494e5f6d750406def4f5f6611500b3c3fb5a29bfdfda11
module.exports = [
  {
    nombre: 'La Mesa de los CAP puede tocar una fase (la misma función del 🎬 C.A. por fases, por su referencia Mc)',
    viejo: 'setOps:Sn,setPlan:setPlanFuegos,bloqueado:ll||Bn,',
    nuevo: 'setOps:Sn,setPlan:setPlanFuegos,activarFase:(SIDb,SIDi)=>Mc.current?.(SIDb,SIDi),bloqueado:ll||Bn,',
    veces: 1,
  },
  {
    nombre: 'El panel de los CAP sabe qué fase está a la vista',
    viejo: 'fasesCOA:I.fasesCOA||{},g3:M};',
    nuevo: 'fasesCOA:I.fasesCOA||{},g3:M,faseActiva:I.faseActiva||null};',
    veces: 1,
  },
  {
    nombre: 'El panel de los CAP con versión nueva (los botones de fase)',
    viejo: 'from "../cap-propios/v1/panel.js?v=json20261024";',
    nuevo: 'from "../cap-propios/v1/panel.js?v=fases20261024";',
    veces: 1,
  },
]
