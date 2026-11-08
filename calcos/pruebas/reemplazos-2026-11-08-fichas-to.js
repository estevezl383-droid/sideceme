// 🔎 Las fichas no se vuelven puntitos al ver todo el TO (08-11-2026). Sergio, con la captura de las fichas rojas
// de SATURNO sobre Pisiga y Ollagüe: «salen extremadamente pequeñas… agrandarlas del tamaño normal que son las
// fichas». La carta 2D (hve) achica las fichas con el zoom: 2^((zoom−12)/1.5), con un piso de 0,28. Al ver el TO
// (zoom 7–8) quedaban en el piso: un quinto del tamaño de cerca. El piso pasa a 0,9 (siete décimos del de cerca: 30 px de alto en vez de 9).
// Sobre index-kmz-20261108.js → index-fichas-to-20261108.js (construir-fichas-to.js).
module.exports = [
  {
    nombre: 'Fichas de la carta 2D: el piso del achique por zoom pasa de 0,28 a 0,9',
    viejo: 'y=vF(),SIDuni=je.useRef(t)',
    nuevo: 'y=vF(.9),SIDuni=je.useRef(t)',
    veces: 1,
  },
]
