// Reemplazos del 2026-10-19 sobre calcos/assets/index-picb-tiempo-20261019.js → index-rotulo-avenidas-20261019.js.
// Lo pidió Sergio con la captura del CMOC: «necesito que las avenidas de aproximación tengan un nombre
// pequeño, casi del tamaño del terreno clave… no puedo identificar cuál es AA-1, AA-3… colocalo en el
// lugar más adecuado sin congestionar la vista para el análisis».
//
// Qué pasaba: el rótulo de la avenida sólo se dibujaba si la avenida tenía `nombre` (las avenidas de la
// captura no lo tienen: AA-1… sólo existe como columna de la H.T. 6) y, cuando salía, era una píldora
// de 12 px con el puntaje, puesta en el centroide del polígono (que en una franja curva cae fuera de la
// franja). Ahora: sin nombre, el rótulo es «AA-n» (el mismo que usa la H.T. 6); es chico (10 px, como el
// del terreno clave), sin el puntaje (queda en el popup y en la H.T. 6) y se pone sobre el eje de la
// avenida, en su punto medio. Lo mismo en el mapa 3D (capa «cmoc-aves-rot»).
//
// SHA-256 de index-picb-tiempo-20261019.js (antes de estos reemplazos): 702ef22a7b4ce4e4cb5b43b065d197731a4c7302fdb22ddd82f37ae889e86abe
const f = (s) => s.replace(/§/g, '`').replace(/@\{/g, '${')

module.exports = [
  {
    nombre: 'Rótulo de la avenida · Leaflet: «AA-n» si no tiene nombre, chico y sobre su eje',
    viejo: f(String.raw`if(re.nombre){H&&ve.bindPopup(Qye(re));try{const _e=Rm(Z).geometry.coordinates;Rt.marker([_e[1],_e[0]],{icon:Rt.divIcon({className:"tt-avenida",html:§<span style="background:@{pe};color:#fff;padding:1px 6px;border-radius:8px;font-weight:700;font-size:12px;white-space:nowrap">@{re.nombre}@{re.puntaje?" · "+re.puntaje+"/18":""}</span>§,iconSize:null})}).addTo(U)}catch{}}`),
    nuevo: f(String.raw`{re.nombre&&H&&ve.bindPopup(Qye(re));try{const SIDc=re.coords&&re.coords.length>=2?re.coords[Math.floor((re.coords.length-1)/2)]:Rm(Z).geometry.coordinates;Rt.marker([SIDc[1],SIDc[0]],{icon:Rt.divIcon({className:"tt-avenida",html:§<span style="position:absolute;transform:translate(-50%,-50%);background:@{pe};color:#fff;padding:0 4px;border:1px solid #fff;border-radius:7px;font-weight:700;font-size:10px;line-height:13px;white-space:nowrap;box-shadow:0 0 2px #000">@{re.nombre||"AA-"+(X+1)}</span>§,iconSize:[0,0]}),interactive:!1}).addTo(U)}catch{}}`),
    veces: 1,
  },
  {
    nombre: 'Rótulo de la avenida · mapa 3D: «AA-n» si no tiene nombre, chico y sobre su eje',
    viejo: f(String.raw`if(!(o!=null&&o.nombre))return;const u=o.poligono||(((r=o.coords)==null?void 0:r.length)>=2?N1(o.coords,a[s]??z1(o.ancho,e)):null);if(u)try{const h=Rm(u).geometry.coordinates;i.push({type:"Feature",geometry:{type:"Point",coordinates:h},properties:{_col:nF(o.bando||"enemigo"),nom:o.puntaje?§@{o.nombre} · @{o.puntaje}/18§:o.nombre}})}catch{}`),
    nuevo: f(String.raw`const u=o.poligono||(((r=o.coords)==null?void 0:r.length)>=2?N1(o.coords,a[s]??z1(o.ancho,e)):null);if(u)try{const h=o.coords&&o.coords.length>=2?o.coords[Math.floor((o.coords.length-1)/2)]:Rm(u).geometry.coordinates;i.push({type:"Feature",geometry:{type:"Point",coordinates:h},properties:{_col:nF(o.bando||"enemigo"),nom:o.nombre||"AA-"+(s+1)}})}catch{}`),
    veces: 1,
  },
  {
    nombre: 'Rótulo de la avenida · mapa 3D: texto de 10 px',
    viejo: f(String.raw`source:"aves-rot",layout:{"text-field":["get","nom"],"text-size":12,`),
    nuevo: f(String.raw`source:"aves-rot",layout:{"text-field":["get","nom"],"text-size":10,`),
    veces: 1,
  },
]
