// Reemplazos del 2026-10-25 sobre calcos/assets/index-evento-critico-20261025.js → index-evento-fases-20261025.js.
// Sergio, con el panel ⚔️ de la F4·P6-7: la FASE IV y la V del CAP quedaban las dos contra la FASE IV del CAE, y él
// esperaba «fase IV de azul contra fase III de rojo». Ahora las dos listas se alinean POR EL FINAL (el último choque es
// la última fase de los dos): evento-critico/v1/modelo.mjs, que el panel importa con ?v=ev20261025b. Acá sólo cambia la
// versión del import del panel, para que el navegador no use el que tiene guardado.
//
// SHA-256 de index-evento-critico-20261025.js (antes de estos reemplazos): db9426dce0371d259cd42853b6b2244d88a87b1a6da946e1d75e496fc9d49740
module.exports = [
  {
    nombre: 'El panel del evento crítico con versión nueva (las fases alineadas por el final)',
    viejo: 'import SIDEvPanel from "../evento-critico/v1/panel.js?v=ev20261025";',
    nuevo: 'import SIDEvPanel from "../evento-critico/v1/panel.js?v=ev20261025b";',
    veces: 1,
  },
]
