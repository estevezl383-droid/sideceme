// Reemplazos del 2026-11-11 (2) sobre calcos/assets/index-ruta-cap-20261111.js → index-motorizadas-20261111.js.
// Sergio: «necesito que diseñes brigadas y divisiones motorizadas en la aplicación, tengo puras brigadas
// acorazadas; elaborame las plantillas doctrinales para brigadas motorizadas para que pueda tener esas
// opciones». Los datos viven en calcos/rojo-motorizado/v1/motorizadas.mjs; acá sólo se enchufan al Manual Rojo
// (UNIDADES_ROJO = cD, ORBAT_POR_NIVEL = DM, NIVELES de esquemasRojo = x2, la lista del selector = IIe,
// los apoyos = AIe) y a la hoja P.D. (el aviso ✎ «organización ARMADA»). Ver rojo-motorizado/README.md.
// SHA-256 de index-ruta-cap-20261111.js (antes de estos reemplazos): ver construir-motorizadas.js.
module.exports = [
  {
    nombre: 'Importa las opciones motorizadas',
    viejo: 'import {conLimite as SIDPedidoConLimite,',
    nuevo: 'import {UNIDADES_MOT as SIDMotUn,ORBAT_MOT as SIDMotOrb,NIVELES_MOT as SIDMotNiv,BASE_MOT as SIDMotBase,listaConMotorizadas as SIDMotLista,apoyosMot as SIDMotApoyos} from "../rojo-motorizado/v1/motorizadas.mjs?v=20261111-mot";\nimport {conLimite as SIDPedidoConLimite,',
    veces: 1,
  },
  {
    nombre: 'Suma las unidades y los ORBAT motorizados ANTES de NIVELES_CON_ORBAT (E7)',
    viejo: '}const E7=Object.keys(DM),ES=[',
    nuevo: '}Object.assign(cD,SIDMotUn),Object.assign(DM,SIDMotOrb);const E7=Object.keys(DM),ES=[',
    veces: 1,
  },
  {
    nombre: 'Las filas Brigada Motorizada y División Motorizada en NIVELES (x2) y en el selector (IIe)',
    viejo: 'const X7=x2,IIe=["regimiento","brigada","division","cuerpo"].map(',
    nuevo: 'const X7=Object.assign(x2,SIDMotNiv),IIe=SIDMotLista(["regimiento","brigada","division","cuerpo"]).map(',
    veces: 1,
  },
  {
    nombre: 'Los apoyos de la plantilla motorizada',
    viejo: 'function AIe(t,e){return e?.escalon==="brigada"?wIe(t)',
    nuevo: 'function AIe(t,e){return e?.tipoFuerza==="motorizada"?SIDMotApoyos(t,e):e?.escalon==="brigada"?wIe(t)',
    veces: 1,
  },
  {
    nombre: 'El resumen de una organización ARMADA lleva ✎, no 📄',
    viejo: 'children:["📄 ",ve.resumen]',
    nuevo: 'children:[ve.armada?"✎ ":"📄 ",ve.resumen]',
    veces: 1,
  },
  {
    nombre: 'El aviso ✎ «la app la ARMA» en lugar de «la organización REAL del Apéndice 1»',
    viejo: 'f.jsxs("div",{style:qt.cfgNota,children:["🟥 Con el Manual Rojo a nivel ",',
    nuevo: 've.armada?f.jsx("div",{style:qt.plAviso,children:ve.armada}):f.jsxs("div",{style:qt.cfgNota,children:["🟥 Con el Manual Rojo a nivel ",',
    veces: 1,
  },
  {
    nombre: 'Al pasar al Manual de Fuerzas Contrarias, las opciones motorizadas vuelven a División',
    viejo: 'nivel:Fe!=="rojo"&&t.nivel==="brigada"?"division":t.nivel',
    nuevo: 'nivel:Fe!=="rojo"&&(t.nivel==="brigada"||SIDMotBase[t.nivel])?"division":t.nivel',
    veces: 1,
  },
]
