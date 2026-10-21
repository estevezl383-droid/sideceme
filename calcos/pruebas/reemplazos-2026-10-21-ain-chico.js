// Reemplazos del 2026-10-21 sobre calcos/assets/index-disgregar-20261020.js → index-ain-chico-20261021.js.
// Lo pidió Sergio con la carta llena de rótulos: «los aines reducelos a un 60%».
//
// Qué se hace: el rótulo «AIN n» de la carta (`_Y`, el SVG de la A.I.N. con su recuadro punteado y la
// fecha debajo) se dibuja al 60 % de su tamaño: el mismo dibujo (viewBox) en un SVG más chico, y el
// divIcon (`Cve`) toma el ancho y el alto nuevos para seguir centrado en su lugar.
//
// SHA-256 de index-disgregar-20261020.js (antes de estos reemplazos): 5bffe6a6a16c60da5733fcd7307b40ac9f92296fb974807c6aadfca96674d713

module.exports = [
  {
    nombre: 'Rótulo AIN (_Y): SVG al 60 %',
    viejo: 'i=34+(a?14:0),o=`<svg width="62" height="${i}" viewBox="0 0 62 ${i}" style="overflow:visible">',
    nuevo: 'i=34+(a?14:0),o=`<svg width="${62*.6}" height="${i*.6}" viewBox="0 0 62 ${i}" style="overflow:visible">',
    veces: 1,
  },
  {
    nombre: 'Rótulo AIN (_Y): el divIcon con el tamaño nuevo',
    viejo: '</svg>`;return{svg:o,html:o,w:62,h:34}}var _u=',
    nuevo: '</svg>`;return{svg:o,html:o,w:62*.6,h:34*.6}}var _u=',
    veces: 1,
  },
]
