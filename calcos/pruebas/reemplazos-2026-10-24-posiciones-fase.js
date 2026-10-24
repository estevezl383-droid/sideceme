// Reemplazos del 2026-10-24 sobre calcos/assets/index-fases-cap-20261024.js → index-posiciones-fase-20261024.js.
// Sergio tocaba FASE I… V de cada CAP: «no se ve ninguna diferencia ni el cambio de posición de las fichas… se supone
// que en la fase I todos están donde está el CE y de ahí se disgregan». «🎬 Armar las fases» copiaba el dispositivo en
// las cinco fases; ahora la Mesa ubica cada unidad en cada fase con lo que hay en la carta (calcos/cap-propios/v1/
// posiciones.mjs, fuera del compilado). Acá sólo se le pone versión a la carga del panel y de proponer.mjs, para que el
// navegador no use los de antes.
//
// SHA-256 de index-fases-cap-20261024.js (antes de estos reemplazos): 27edd4decd859be07826cc309be9fd7b0efddfe9a498e38c79debb5a6ee0be2a
module.exports = [
  {
    nombre: 'El panel de los CAP con versión nueva (las posiciones por fase)',
    viejo: 'from "../cap-propios/v1/panel.js?v=fases20261024";',
    nuevo: 'from "../cap-propios/v1/panel.js?v=pos20261024";',
    veces: 1,
  },
  {
    nombre: 'proponer.mjs (armar las fases con posiciones) con versión nueva',
    viejo: 'from "../cap-propios/v1/proponer.mjs";',
    nuevo: 'from "../cap-propios/v1/proponer.mjs?v=pos20261024";',
    veces: 1,
  },
]
