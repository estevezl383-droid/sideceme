// Reemplazos del 2026-10-24 sobre calcos/assets/index-posiciones-fase-20261024.js → index-todas-fichas-20261024.js.
// Sergio, con la FASE I del CAP 1 a la vista: «la OC 1, la OC 2, la OD, todas están en sus puestos… en la fase I
// deberían todas las unidades estar con el cuerpo de ejército… en la fase dos desplazarse hacia los lugares donde hay
// trabajos (el plan de barreras)… en la fase 3 donde están ya sus posiciones… debes mover todas las fichas». Las fases
// sólo movían las unidades con rol en el CAP; ahora se mueven todas las fichas propias (calcos/cap-propios/v1/
// posiciones.mjs, fuera del compilado). Acá sólo se le pone versión a la carga del panel y de proponer.mjs, para que el
// navegador no use los de antes.
//
// SHA-256 de index-posiciones-fase-20261024.js (antes de estos reemplazos): 5e585635c4edda2e92035fa20f6a2704984ff979700db5be7be9c2e9bd3af057
module.exports = [
  {
    nombre: 'El panel de los CAP con versión nueva (todas las fichas en cada fase)',
    viejo: 'from "../cap-propios/v1/panel.js?v=pos20261024";',
    nuevo: 'from "../cap-propios/v1/panel.js?v=todas20261024";',
    veces: 1,
  },
  {
    nombre: 'proponer.mjs (armar las fases con el puesto de cada ficha) con versión nueva',
    viejo: 'from "../cap-propios/v1/proponer.mjs?v=pos20261024";',
    nuevo: 'from "../cap-propios/v1/proponer.mjs?v=todas20261024";',
    veces: 1,
  },
]
