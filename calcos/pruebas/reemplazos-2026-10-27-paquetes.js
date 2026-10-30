// Los paquetes de terreno de Bolivia (commit b9a74cd): index-guia-inicial-20261027.js → index-paquetes-20261027.js.
// Ese compilado lo armó calcos/paquetes/scripts/integrar.py; ésta es la MISMA lista, copiada tal cual, para que
// reemplazos-compilado.js pueda seguir la cadena del vigente hacia atrás sin saltos. Cada «viejo» aparece una vez.
module.exports = [
  {
    nombre: 'Sin el censo de municipios con paquetes',
    viejo: 'async function Ale(t="data/bolivia/censo2024_municipios.json"){',
    nuevo: 'async function Ale(t="data/bolivia/censo2024_municipios.json"){if(window.SIDECEME_PAQUETES)return null;',
    veces: 1,
  },
  {
    nombre: 'Las capas desde el paquete',
    viejo: 'async function Yle(t,e,n){',
    nuevo: 'async function Yle(t,e,n){if(window.SIDECEME_PAQUETES)return window.SIDPaquetes.capas(t,e,n,rF,Hc);',
    veces: 1,
  },
  {
    nombre: 'El relieve desde el paquete',
    viejo: 'async function XDe(t,e,n){',
    nuevo: 'async function XDe(t,e,n){if(window.SIDECEME_PAQUETES)return window.SIDPaquetes.demTile(t,e,n);',
    veces: 1,
  },
  {
    nombre: 'La cobertura del suelo desde el paquete',
    viejo: 'async function Gse(t,e=()=>{}){',
    nuevo: 'async function Gse(t,e=()=>{}){if(window.SIDECEME_PAQUETES)return window.SIDPaquetes.landcover(t,e);',
    veces: 1,
  },
  {
    nombre: 'Con paquetes trabaja en el navegador',
    viejo: 'g2=jSe()?"escritorio":LSe()?"servidor":"navegador"',
    nuevo: 'g2=window.SIDECEME_PAQUETES?"navegador":jSe()?"escritorio":LSe()?"servidor":"navegador"',
    veces: 1,
  },
  {
    nombre: 'El aviso del relieve con paquetes',
    viejo: 'e(`Descargando modelo de elevación (${g*v} tiles)…`)',
    nuevo: 'e(window.SIDECEME_PAQUETES?`Leyendo relieve del paquete (${g*v} fragmentos)…`:`Descargando modelo de elevación (${g*v} tiles)…`)',
    veces: 1,
  },
]
