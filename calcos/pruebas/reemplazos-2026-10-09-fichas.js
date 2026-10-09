// Reemplazos del 2026-10-09 sobre calcos/assets/index-divmec-20261009.js →
// index-fichas-20261009.js. Lo pidió Sergio: las fichas de la Mesa salían muy chicas y
// tienen que verse del mismo tamaño que las del tablero 🧩 Superponer (+50 %).
// El factor es window.SIDEscalaFichas (lo pone el deslizador «Tamaño de símbolos» del
// tablero 🧩; sin él, 1.5). Sólo cambia el TAMAÑO en pantalla, no el dibujo ni los datos.
module.exports = [
  {
    nombre: 'Fichas · carta 2D: tamaño × SIDEscalaFichas',
    viejo: 'const E=sb(x),S=.72*y',
    nuevo: 'const E=sb(x),S=.72*y*(window.SIDEscalaFichas||1.5)',
    veces: 1,
  },
  {
    nombre: 'Fichas · vista 3D: tamaño × SIDEscalaFichas',
    viejo: 'Bn=sb(On,{escala:1})}catch{continue}const dt=document.createElement("img")',
    nuevo: 'Bn=(k=>{const b=sb(On,{escala:1});return{...b,w:b.w*k,h:b.h*k,ax:b.ax*k,ay:b.ay*k}})(window.SIDEscalaFichas||1.5)}catch{continue}const dt=document.createElement("img")',
    veces: 1,
  },
]
