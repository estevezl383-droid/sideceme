// Reemplazos del 2026-10-22 sobre calcos/assets/index-concepto-20261022.js → index-fichas-chicas-20261022.js.
// Lo pidió Sergio con la carta congestionada de fichas: «reduce las fichas en un 60%… que tengan fondo blanco y
// que sean azul más o menos como [la ficha XX del Superponer]… igual las instalaciones… para todo desde ahora en
// adelante y las que ya tenemos cambiarles».
//
// Qué se hace en `sb` (el dibujo de TODA ficha de la Mesa: unidad, PC e instalación, propia o enemiga):
//   · el relleno del marco pasa de casi transparente (0,10) a blanco (0,92), también el de la agrupación;
//   · el tamaño que devuelve (w, h y el ancla) va al 40 % (SIDFichaChica = 0,4): el dibujo es el mismo y a la
//     misma resolución, sólo se muestra más chico. Como lo usan la carta 2D, la 3D, la plantilla del enemigo y
//     las marcas del concepto, todas se achican; el Word, el KMZ y las vistas previas sólo usan la imagen (url)
//     o la proporción del ancla, así que no cambian;
//   · la designación va con letra 16 (antes 12) para que se siga leyendo chica: si el nombre es más ancho que
//     el marco, el dibujo se ensancha lo mismo a cada lado (el marco sigue centrado en su punto);
//   · el escalón y la designación llevan un halo blanco para que se lean chicos sobre el satélite;
//   · el símbolo de la tarea táctica que va encima de la ficha (`tareaSimbolo`, en `hve`) se achica igual.
// Las fichas ya puestas cambian solas: no se guarda el dibujo, se rehace con `sb` al pintar la carta.
//
// SHA-256 de index-concepto-20261022.js (antes de estos reemplazos): b2e29940bb646e2d8cbd5f408b101ced8f2083e18cbc697929d27eab68cafb0a
module.exports = [
  {
    nombre: 'Ficha (sb): factor de tamaño 0,4',
    viejo: 'const Xfe=.85;function sb(',
    nuevo: 'const Xfe=.85,SIDFichaChica=.4;function SIDAnchoDesig(v){const c=document.createElement("canvas").getContext("2d");c.font="bold 16px Arial, sans-serif";return c.measureText(v).width+8}function sb(',
    veces: 1,
  },
  {
    nombre: 'Ficha (sb): lugar para la designación más grande',
    viejo: 'M=v?16:0,T=s==="pc"?15:0,I=h+S*2+SIDAnchoNumero(',
    nuevo: 'M=v?20:0,T=s==="pc"?15:0,SIDpad=v?Math.max(0,(SIDAnchoDesig(v)-h-S*2)/2):0,I=h+S*2+SIDpad*2+SIDAnchoNumero(',
    veces: 1,
  },
  {
    nombre: 'Ficha (sb): el marco centrado aunque el dibujo se ensanche',
    viejo: 'const te=S,H=E+x,q=te+h/2;',
    nuevo: 'const te=S+SIDpad,H=E+x,q=te+h/2;',
    veces: 1,
  },
  {
    nombre: 'Ficha (sb): marco con fondo blanco',
    viejo: 'G.fillStyle="rgba(255,255,255,0.10)",G.strokeStyle=i,G.lineWidth=7',
    nuevo: 'G.fillStyle="rgba(255,255,255,0.92)",G.strokeStyle=i,G.lineWidth=7',
    veces: 1,
  },
  {
    nombre: 'Ficha (sb): agrupación con fondo blanco',
    viejo: 'G.lineWidth=4.5,G.fillStyle="rgba(255,255,255,0.10)"',
    nuevo: 'G.lineWidth=4.5,G.fillStyle="rgba(255,255,255,0.92)"',
    veces: 1,
  },
  {
    nombre: 'Ficha (sb): halo blanco en el escalón',
    viejo: '}else pY(G,n,q,2,i);v&&(',
    nuevo: '}else G.save(),G.shadowColor="#fff",G.shadowBlur=4*B,pY(G,n,q,2,i),G.restore();v&&(',
    veces: 1,
  },
  {
    nombre: 'Ficha (sb): designación con letra 16 y halo blanco',
    viejo: 'G.fillStyle=i,G.font="bold 12px Arial, sans-serif",G.textAlign="center",G.textBaseline="top",G.fillText(v,q,H+y+T+2)',
    nuevo: 'G.fillStyle=i,G.font="bold 16px Arial, sans-serif",G.textAlign="center",G.textBaseline="top",G.strokeStyle="rgba(255,255,255,.85)",G.lineWidth=2.5,G.strokeText(v,q,H+y+T+2),G.fillText(v,q,H+y+T+2)',
    veces: 1,
  },
  {
    nombre: 'Ficha (sb): se muestra al 40 %',
    viejo: 'const X=o?Xfe:1;return{url:U.toDataURL("image/png"),w:I*X,h:j*X,ax:q*X,ay:(E+x+y/2)*X}}',
    nuevo: 'const X=(o?Xfe:1)*SIDFichaChica;return{url:U.toDataURL("image/png"),w:I*X,h:j*X,ax:q*X,ay:(E+x+y/2)*X}}',
    veces: 1,
  },
  {
    nombre: 'Carta 2D (hve): la tarea táctica de la ficha, también al 40 %',
    viejo: 'U=Math.round(26*S*1.6);',
    nuevo: 'U=Math.round(26*S*1.6*SIDFichaChica);',
    veces: 1,
  },
]
