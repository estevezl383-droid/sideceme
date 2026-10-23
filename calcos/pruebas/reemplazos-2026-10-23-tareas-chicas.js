// Reemplazos del 2026-10-23 sobre calcos/assets/index-google-mapas-20261023.js → index-tareas-chicas-20261023.js.
// Lo pidió Sergio con la carta del plan de barreras congestionada: «las tareas tácticas por favor hacelas un 60 % más
// pequeñas». Es lo mismo que se hizo con las fichas el 22-10-2026 (SIDFichaChica = 0,4, ya definido junto a `sb`):
//   · en la carta 2D, cada tarea táctica de 🎯 Tareas (`ops.tareas`, el símbolo del RC-02-108 en fucsia) se dibuja
//     al 40 % del tamaño que le da su magnitud (y el «⤡ escala» que tenga); también la que se arrastra;
//   · en el ⛰️ 3D, igual (allá no se mueven);
//   · el panel 🎯 Tareas Tácticas dice el tamaño con el que va a salir en la carta.
// El 🏙️ Google 3D toma el tamaño del dibujo de la carta 2D, así que también se achica. Las tareas ya puestas cambian
// solas: se guarda la magnitud y la escala, no el tamaño en píxeles.
//
// SHA-256 de index-google-mapas-20261023.js (antes de estos reemplazos): 8574bf36cf677724ec1135df924d38faeef5824f14d78dc9462975899a88c1eb
module.exports = [
  {
    nombre: 'Carta 2D: las tareas tácticas al 40 %',
    viejo: 'const mt=Math.round(m8(dt.escalon||"batallon")*(dt.escala||1)*de),',
    nuevo: 'const mt=Math.round(m8(dt.escalon||"batallon")*(dt.escala||1)*de*SIDFichaChica),',
    veces: 1,
  },
  {
    nombre: '⛰️ 3D: las tareas tácticas al 40 %',
    viejo: 'const Bn=Math.round(m8(On.escalon||"batallon")*(On.escala||1)),',
    nuevo: 'const Bn=Math.round(m8(On.escalon||"batallon")*(On.escala||1)*SIDFichaChica),',
    veces: 1,
  },
  {
    nombre: 'Panel 🎯 Tareas: el tamaño con el que sale en la carta',
    viejo: 'f.jsxs("b",{children:[m8(a)," px"]})',
    nuevo: 'f.jsxs("b",{children:[Math.round(m8(a)*SIDFichaChica)," px"]})',
    veces: 1,
  },
]
