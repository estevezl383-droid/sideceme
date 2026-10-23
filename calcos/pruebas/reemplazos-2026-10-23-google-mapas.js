// Reemplazos del 2026-10-23 sobre calcos/assets/index-fichas-chicas-20261022.js → index-google-mapas-20261023.js.
// Lo pidió Sergio: «quiero usar esas imágenes [de Google]… estoy dispuesto a pagar por la API… las quiero en 3D y
// 2D con relieve, para realizar mis ejercicios académicos». Sacó la clave de la Map Tiles API (proyecto CIDECEME,
// restringida a https://estevezl383-droid.github.io/* y a esa API).
//
// Todo lo de Google está fuera del compilado, en calcos/google-mapas/v1/google-mapas.js (window.SIDGoogle). Acá:
//   · la carta 2D (Leaflet, `ZK`) y la del ⛰️ 3D (MapLibre, `ON`) toman el mapa base de SIDGoogle cuando es uno de
//     Google (gsat, ghib, gter); si no, siguen con Esri / OSM como antes;
//   · cada carta que se crea se le pasa a SIDGoogle.seguir: pone «Google» y la atribución de las imágenes del lugar
//     y, si Google deja de dar tiles (cupo del día, red), vuelve a Esri;
//   · en la barra de la carta (`Aze`) el botón que alternaba 🛰️ Satélite / 🗺️ Mapa pasa a ser un selector con los
//     mapas de Google; su opción 🏙️ 3D realista abre el 3D realista de Google en otra pestaña
//     (google-mapas/v1/3d.html) sin cambiar el mapa base. Va en el mismo selector para que la barra no crezca.
// Sin google-mapas.js (window.SIDGoogle) todo queda exactamente como antes.
//
// SHA-256 de index-fichas-chicas-20261022.js (antes de estos reemplazos): 96263b390efe7f2eddae7fe651bf94882d6bfdd30fefc3563ed73f433bc7ac3f
module.exports = [
  {
    nombre: 'Carta 2D: el mapa base de Google',
    viejo: 'const jn=ZK[y]||ZK.osm;',
    nuevo: 'const jn=window.SIDGoogle&&SIDGoogle.leaflet(y)||ZK[y]||ZK.osm;',
    veces: 1,
  },
  {
    nombre: 'Carta 2D: atribución de Google y respaldo a Esri',
    viejo: '(window.__mapa2d=gC=this)',
    nuevo: '(window.__mapa2d=gC=this,window.SIDGoogle&&SIDGoogle.seguir(this))',
    veces: 1,
  },
  {
    nombre: '⛰️ 3D: el mapa base de Google al crear la vista',
    viejo: 'const v=Ai.get(),x=ON[t]||ON.sat,',
    nuevo: 'const v=Ai.get(),x=window.SIDGoogle&&SIDGoogle.maplibre(t)||ON[t]||ON.sat,',
    veces: 1,
  },
  {
    nombre: '⛰️ 3D: el mapa base de Google al cambiarlo',
    viejo: 'const v=ON[t]||ON.sat,x=g.getSource("base")',
    nuevo: 'const v=window.SIDGoogle&&SIDGoogle.maplibre(t)||ON[t]||ON.sat,x=g.getSource("base")',
    veces: 1,
  },
  {
    nombre: '⛰️ 3D: atribución de Google y respaldo a Esri',
    viejo: 'return a.current=S,window.__map3d=S,',
    nuevo: 'return a.current=S,window.__map3d=S,window.SIDGoogle&&SIDGoogle.seguir(S),',
    veces: 1,
  },
  {
    nombre: 'Barra de la carta: selector de mapa base con Google (y 🏙️ Google 3D)',
    viejo:
      'f.jsx("button",{className:"m3d-b on",onClick:()=>a(h=>h==="sat"?"osm":"sat"),title:"Alternar mapa base (satélite / mapa)",children:n==="sat"?"🛰️ Satélite":"🗺️ Mapa"}),',
    nuevo:
      'window.SIDGoogle?f.jsx("select",{className:"m3d-b on sid-base",value:n,style:{width:"76px",padding:"4px 13px 4px 5px",fontSize:"10.5px",appearance:"none",WebkitAppearance:"none",backgroundImage:"url(\\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%278%27 height=%275%27%3E%3Cpath d=%27M0 0h8L4 5z%27 fill=%27%233de1f5%27/%3E%3C/svg%3E\\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 4px center"},onChange:h=>{const v=h.target.value;v==="g3d"?SIDGoogle.abrir3D():a(v)},title:"Mapa base: las imágenes de Google (satélite, con nombres o relieve), el satélite de Esri o el mapa de calles. 🏙️ 3D realista abre el 3D de Google del lugar en otra pestaña (sólo para reconocer el terreno: lo trazado no va).",children:SIDGoogle.opciones().map(g=>f.jsx("optgroup",{label:g.grupo,style:{background:"#0a1018",color:"#3de1f5"},children:g.opciones.map(h=>f.jsx("option",{value:h.id,title:h.titulo,style:{background:"#0a1018",color:"#c3ced9"},children:h.nombre},h.id))},g.grupo))}):' +
      'f.jsx("button",{className:"m3d-b on",onClick:()=>a(h=>h==="sat"?"osm":"sat"),title:"Alternar mapa base (satélite / mapa)",children:n==="sat"?"🛰️ Satélite":"🗺️ Mapa"}),',
    veces: 1,
  },
]
