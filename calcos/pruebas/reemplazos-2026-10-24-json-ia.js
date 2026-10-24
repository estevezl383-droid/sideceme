// Reemplazos del 2026-10-24 sobre calcos/assets/index-fuegos-fase-20261024.js → index-json-ia-20261024.js.
// Sergio pegó la respuesta de la IA en «🤖 La IA desarrolla los dos CAP EN LA CARTA» y la Mesa le dijo «No se reconoció
// la respuesta»: el JSON de la IA traía alguno de los errores de siempre (comillas rectas dentro de una designación, una
// coma de más, la respuesta cortada…). La lectura ahora es tolerante (calcos/cap-propios/v1/json-tolerante.mjs, fuera del
// compilado); acá sólo se le pone versión a la carga del panel para que el navegador no se quede con el de antes.
//
// SHA-256 de index-fuegos-fase-20261024.js (antes de estos reemplazos): 9672bb8a67ec6e25337e568efc8c53a290baac093673f3c1dcf03f793d35280c
module.exports = [
  {
    nombre: 'El panel de los CAP se carga con versión (la lectura tolerante de la respuesta de la IA)',
    viejo: 'from "../cap-propios/v1/panel.js";',
    nuevo: 'from "../cap-propios/v1/panel.js?v=json20261024";',
    veces: 1,
  },
]
