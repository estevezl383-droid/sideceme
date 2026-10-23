// Reemplazos del 2026-10-23 sobre calcos/assets/index-puntos-chicos-20261023.js → index-suelo-20261023.js.
// Lo pidió Sergio mirando la carta en el ⛰️ 3D: «la magnitud de los límites deben ser reducidos también en un 40 % y
// además no deben flotar ni cambiar de dirección, deben estar alineadas con la línea de la que son parte»; «las
// tareas tácticas no deben flotar o cambiar de dirección… deben ir sujetas al suelo»; «debo poder mover las unidades
// de azul o sus tareas tácticas».
//   · la marca de magnitud (`vY`: XX, III, ●●…) al 60 % (el mismo viewBox en un SVG más chico, el trazo un poco más
//     grueso para que no se pierda) y el hueco que le deja la línea del límite también al 60 %;
//   · en el ⛰️ 3D (el espejo `yze`, que pasa cada marca de la carta 2D a un fS.Marker) la marca de magnitud y la tarea
//     táctica van ACOSTADAS sobre el terreno y giran con la carta (rotationAlignment / pitchAlignment «map»): antes
//     quedaban paradas mirando a la cámara, flotando, y al girar la vista dejaban de estar alineadas con la línea. Lo
//     mismo en la otra vista 3D (`yS`). La tarea de 🎯 Tareas lleva la clase `sid-suelo` para eso (también la usa el
//     efecto de cada zona de obstáculos del concepto, en concepto-operacion/v1/carta.js);
//   · las fichas (`hve`): en el ⛰️ 3D la «Cota» de la barra cambia con cada movimiento del cursor, la carta se vuelve
//     a dibujar y `unidades` llega como un arreglo nuevo (el compilado lo filtra en cada dibujo): las fichas se
//     rehacían a cada rato y el arrastre se cortaba a mitad de camino (la manito movía la carta). Si las unidades son
//     las mismas, se usa el arreglo anterior y las fichas no se rehacen.
//
// SHA-256 de index-puntos-chicos-20261023.js (antes de estos reemplazos): 2dfcbd19572f92751e6066c832f24b2434a7ab3a3f8ee6ac41b5ec31c95aa5ae
const ACOSTADA = '{rotationAlignment:"map",pitchAlignment:"map"}'
module.exports = [
  {
    nombre: 'Marca de magnitud (vY): SVG al 60 % y trazo un poco más grueso',
    viejo:
      'const h=Math.max(.4,Math.min(3,n||1)),y=`<svg width="${s}" height="${i}" viewBox="0 0 ${s} ${i}" style="overflow:visible"><g stroke="${cE}" stroke-width="${u}" stroke-linecap="round">',
    nuevo:
      'const h=Math.max(.4,Math.min(3,n||1)),y=`<svg width="${s*.6}" height="${i*.6}" viewBox="0 0 ${s} ${i}" style="overflow:visible"><g stroke="${cE}" stroke-width="${u*1.3}" stroke-linecap="round">',
    veces: 1,
  },
  {
    nombre: 'Marca de magnitud (vY): el tamaño nuevo y la marca de que va sobre el suelo',
    viejo: 'return{svg:y,html:g,w:s,h:i}}function bY(',
    nuevo: 'return{svg:y,html:g,w:s*.6,h:i*.6,suelo:!0}}function bY(',
    veces: 1,
  },
  {
    nombre: 'Límite: el hueco de la línea donde va la marca, al 60 %',
    viejo: 'Si=(dt,ft=1)=>17*ft*oe*$K(dt||0,di)',
    nuevo: 'Si=(dt,ft=1)=>17*.6*ft*oe*$K(dt||0,di)',
    veces: 1,
  },
  {
    nombre: 'Espejo del ⛰️ 3D: la magnitud y la tarea táctica acostadas sobre el terreno',
    viejo: 'M=new fS.Marker({element:E,anchor:"top-left",draggable:S,opacityWhenCovered:"0.6"})',
    nuevo:
      'M=new fS.Marker({element:E,anchor:"top-left",draggable:S,opacityWhenCovered:"0.6",...(u.classList&&(u.classList.contains("lim-mag")||u.classList.contains("sid-suelo"))?' +
      ACOSTADA +
      ':{})})',
    veces: 1,
  },
  {
    nombre: 'Otra vista 3D (yS): la magnitud acostada sobre el terreno',
    viejo: 've.current.push(new yS({element:nn}).setLngLat(ft).addTo(Ln))',
    nuevo: 've.current.push(new yS({element:nn,...(dt.suelo?' + ACOSTADA + ':{})}).setLngLat(ft).addTo(Ln))',
    veces: 1,
  },
  {
    nombre: 'Otra vista 3D (yS): la tarea táctica acostada sobre el terreno',
    viejo: 'dt.style.pointerEvents="none",ve.current.push(new yS({element:dt}).setLngLat([On.centro[0],On.centro[1]]).addTo(Ln))',
    nuevo: 'dt.style.pointerEvents="none",ve.current.push(new yS({element:dt,...' + ACOSTADA + '}).setLngLat([On.centro[0],On.centro[1]]).addTo(Ln))',
    veces: 1,
  },
  {
    nombre: 'Tarea de 🎯 Tareas en la carta 2D: la clase sid-suelo (el ⛰️ 3D la acuesta)',
    viejo: 'iconAnchor:[mt/2,mt/2],className:""}),nn=Rt.marker(',
    nuevo: 'iconAnchor:[mt/2,mt/2],className:"sid-suelo"}),nn=Rt.marker(',
    veces: 1,
  },
  {
    nombre: 'Fichas (hve): con las mismas unidades no se rehacen (el arrastre en el ⛰️ 3D no se corta)',
    viejo: 'anillos:r={}}){const u=xu(),h=je.useRef(null),y=vF();',
    nuevo:
      'anillos:r={}}){const u=xu(),h=je.useRef(null),y=vF(),SIDuni=je.useRef(t);(t||[]).length===(SIDuni.current||[]).length&&(t||[]).every((SIDx,SIDk)=>SIDx===SIDuni.current[SIDk])?t=SIDuni.current:SIDuni.current=t;',
    veces: 1,
  },
]
