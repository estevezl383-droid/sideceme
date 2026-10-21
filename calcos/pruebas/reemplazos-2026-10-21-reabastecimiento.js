// Reemplazos del 2026-10-21 sobre calcos/assets/index-ain-chico-20261021.js → index-reabastecimiento-20261021.js.
// Lo pidió Sergio con capturas del 🧮 Cálculos del G-4 y del Word del cálculo: «la operación durará más de
// 30 días… calcular cada cuánto tiempo se podría realizar el reabastecimiento… tampoco se dispone de todos
// los vehículos del mundo»; «está muy pequeño… que se abra en el panel de abajo, lo que necesitamos es
// espacio» (y lo mismo para el ▣ ASDI y el ARCE); «920 veh × 3 L… ¿qué es veh?»; OBJETO / CARTAS / ANEXOS
// vacíos en el Word.
//
// Qué se hace (la lógica está en calcos/logistica/v1/calculo.mjs):
//   · los números del panel (`Vt`, y las pestañas `Nn`) se llaman como función: definidos dentro del
//     render, como componentes se rehacían en cada tecla y el cursor se perdía (no se podía escribir 20
//     días: después del «2» se salía del campo);
//   · 🧮 Cálculos y ▣ ASDI / ARCE se abren en grande abajo (`SIDCalcTablero`): las cuatro clases lado a
//     lado, el reabastecimiento y el encabezado del Word; el panel se queda con los datos y el botón; se
//     achica para trazar o se trae de vuelta al panel (se recuerda en el navegador);
//   · 🚚 Reabastecimiento: cada cuántos días, camiones, cisternas, distancia → cuánto lleva cada ciclo,
//     cuántas vueltas y si los medios llegan; avisa los días máximos de la ración;
//   · la Cl V toma los días sucesivos de los días de la operación; la Cl III copia la última jornada
//     hasta cubrirlos;
//   · el Word: OBJETO / CARTAS / ANEXOS llenos, «vehículos» en vez de «veh», la sección REABASTECIMIENTO.
//
// SHA-256 de index-ain-chico-20261021.js (antes de estos reemplazos): 82a1bd560cde245d58b208be052bcc88bcd31389b8b992bcd8396af5a3fb5412

const ES_TAB = 'SIDtab!=="panel"'

module.exports = [
  {
    nombre: 'Import del módulo de cálculo del G-4',
    viejo: 'import {accionDisgregar as SIDDisAccion,',
    nuevo: 'import {planReabastecimiento as SIDCalcPlan,encabezadoCalculo as SIDCalcEnc,tablero as SIDCalcTablero,reabastecimientoUI as SIDCalcReabUI,encabezadoUI as SIDCalcEncUI,htmlReabastecimiento as SIDCalcReabHtml,completarJornadas as SIDCalcCompletar,modoTableroInicial as SIDCalcModo,REAB_INICIAL as SIDCalcReab0,tituloSeccion as SIDCalcTit,cartaEstilo as SIDCalcCarta} from "../logistica/v1/calculo.mjs?v=reab20261021";import {accionDisgregar as SIDDisAccion,',
    veces: 1,
  },
  {
    nombre: 'Panel G-4 (yDe): estado del tablero, del reabastecimiento y del encabezado',
    viejo: '[Ln,wn]=je.useState(1),',
    nuevo: '[Ln,wn]=je.useState(1),[SIDtab,SIDsetTab]=je.useState(SIDCalcModo),[SIDre,SIDsetRe]=je.useState(()=>({...SIDCalcReab0})),[SIDenc,SIDsetEnc]=je.useState({}),',
    veces: 1,
  },
  {
    nombre: 'Panel G-4 (yDe): plan de reabastecimiento, encabezado y Cl V con los días de la operación',
    viejo: 'mt=je.useMemo(()=>eDe({armas:kt,diasSucesivos:Ln}),[kt,Ln]),',
    nuevo: 'mt=je.useMemo(()=>eDe({armas:kt,diasSucesivos:Ln}),[kt,Ln]),SIDfxDias=je.useEffect(()=>{wn(Math.max(0,(Number(Ea)||1)-1))},[Ea]),SIDplan=je.useMemo(()=>SIDCalcPlan({dias:Ea,ciclo:SIDre.ciclo,efectivo:jt,vehiculos:jn,seguridad:(Number(Gn)||0)/100,racion:Pn,kgRacion:SIDre.kgRacion===""?null:SIDre.kgRacion,litrosHombre:On,cl3:ft,cl5:mt,aguaPorViaje:dt.porViaje,camiones:SIDre.camiones,cargaT:SIDre.cargaT,cisternas:SIDre.cisternas,litrosCisterna:SIDre.litrosCisterna,distKm:SIDre.distKm,velKmH:SIDre.velKmH,horasCarga:SIDre.horasCarga}),[Ea,SIDre,jt,jn,Gn,Pn,On,ft,mt,dt]),SIDencAuto=SIDCalcEnc(o,o.unidad||Tt),',
    veces: 1,
  },
  {
    nombre: 'Descargar el cálculo: el reabastecimiento y el encabezado van al Word',
    viejo: 'clasificacion:o.clasificacion||"RESERVADO",cl1:Bn,',
    nuevo: 'clasificacion:o.clasificacion||"RESERVADO",reab:SIDplan,encabezado:{...SIDencAuto,...Object.fromEntries(Object.entries(SIDenc).filter(([,v])=>v!=null))},cl1:Bn,',
    veces: 1,
  },
  {
    nombre: 'Word: OBJETO, CARTAS y ANEXOS llenos',
    viejo: '<h1>CÁLCULO DE NECESIDADES LOGÍSTICAS</h1>\n<p class="campo"><b>OBJETO&nbsp;&nbsp;&nbsp;:</b> </p>\n<p class="campo"><b>CARTAS&nbsp;&nbsp;:</b> </p>\n<p class="campo"><b>ANEXOS&nbsp;:</b> </p>',
    nuevo: '<h1>CÁLCULO DE NECESIDADES LOGÍSTICAS</h1>\n<p class="campo"><b>OBJETO&nbsp;&nbsp;&nbsp;:</b> ${Dx(t.encabezado?.objeto||"")}</p>\n<p class="campo"><b>CARTAS&nbsp;&nbsp;:</b> ${Dx(t.encabezado?.cartas||"")}</p>\n<p class="campo"><b>ANEXOS&nbsp;:</b> ${Dx(t.encabezado?.anexos||"S/A")}</p>',
    veces: 1,
  },
  {
    nombre: 'Word: los vehículos de la unidad apoyada (situación particular)',
    viejo: '["Vehículos",`${Nr(u.vehiculos)}`]',
    nuevo: '["Vehículos de la unidad apoyada",`${Nr(u.vehiculos)} vehículos`]',
    veces: 1,
  },
  {
    nombre: 'Agua: hombres y vehículos con todas las letras',
    viejo: '`Personal: ${h.toLocaleString("es")} h × ${e} L × ${g} días',
    nuevo: '`Personal: ${h.toLocaleString("es")} hombres × ${e} L por hombre y por día × ${g} días',
    veces: 1,
  },
  {
    nombre: 'Agua: «vehículos» en vez de «veh»',
    viejo: '`Vehículos: ${y.toLocaleString("es")} veh × ${a} L × ${g} días',
    nuevo: '`Vehículos: ${y.toLocaleString("es")} vehículos × ${a} L por vehículo y por día × ${g} días',
    veces: 1,
  },
  {
    nombre: 'Word: la sección REABASTECIMIENTO antes de la conclusión',
    viejo: '<h2>CONCLUSIÓN</h2>',
    nuevo: '${SIDCalcReabHtml(t.reab)}\n\n<h2>CONCLUSIÓN</h2>',
    veces: 1,
  },
  {
    nombre: 'Word: la conclusión dice cada cuánto se reabastece',
    viejo: 'proyectiles (Clase V).</p>',
    nuevo: 'proyectiles (Clase V).</p>${t.reab?`\n<p>Se reabastece cada ${t.reab.ciclo} día(s): ${t.reab.filas.length} reabastecimiento(s) en ${t.reab.dias} días.</p>`:""}',
    veces: 1,
  },
  {
    nombre: '▣ ASDI / ARCE: en grande abajo (cabeza)',
    viejo: 'Re==="asdi"&&f.jsxs("div",{style:fn.cuerpo,children:[f.jsx(SIDLogPaso,{hojas:e,onHojas:n,onExpediente:a,ctxDoc:i,orden:o,onSeleccionarArea:Ie}),',
    nuevo: 'Re==="asdi"&&SIDCalcTablero({f,portal:Ife.createPortal,modo:SIDtab,onModo:SIDsetTab,titulo:"▣ ASDI / ARCE — PASO A PASO Y DESPLIEGUE",columnas:"minmax(0,1.5fr) minmax(300px,1fr)",cuerpo:[f.jsx(SIDLogPaso,{hojas:e,onHojas:n,onExpediente:a,ctxDoc:i,orden:o,onSeleccionarArea:Ie}),f.jsxs("div",{style:' + ES_TAB + '?SIDCalcCarta:fn.cuerpo,children:[',
    veces: 1,
  },
  {
    nombre: '▣ ASDI / ARCE: en grande abajo (cierre)',
    viejo: 'children:"Quitar el despliegue de ESTA área"})]})]})]}),Re==="ejes"',
    nuevo: 'children:"Quitar el despliegue de ESTA área"})]})]})]})]}),Re==="ejes"',
    veces: 1,
  },
  {
    nombre: '🧮 Cálculos: en grande abajo (los datos quedan en el panel)',
    viejo: 'Re==="calculo"&&f.jsxs(f.Fragment,{children:[',
    nuevo: 'Re==="calculo"&&SIDCalcTablero({f,portal:Ife.createPortal,modo:SIDtab,onModo:SIDsetTab,titulo:"🧮 CÁLCULO DE NECESIDADES LOGÍSTICAS",pieAbajo:!0,cabeza:[',
    veces: 1,
  },
  {
    nombre: '🧮 Cálculos: abajo, sin pestañas (las clases van lado a lado)',
    viejo: 'label:"Días de la operación",value:Ea,onChange:bn,ancho:54})]}),f.jsxs("div",{style:fn.tabs,',
    nuevo: 'label:"Días de la operación",value:Ea,onChange:bn,ancho:54})]})],cuerpo:[SIDtab==="panel"&&f.jsxs("div",{style:fn.tabs,',
    veces: 1,
  },
  ...[['cl1', '🍲 CLASE I — RACIONES'], ['agua', '💧 AGUA'], ['cl3', '⛽ CLASE III — CARBURANTES'], ['cl5', '🎯 CLASE V — MUNICIÓN']].map(([id, tit]) => ({
    nombre: `🧮 Cálculos: ${tit} se ve siempre abajo, con su título`,
    viejo: `ve==="${id}"&&f.jsxs("div",{style:fn.cuerpo,children:[`,
    nuevo: `(${ES_TAB}||ve==="${id}")&&f.jsxs("div",{style:${ES_TAB}?SIDCalcCarta:fn.cuerpo,"data-calc":"${id}",children:[${ES_TAB}&&f.jsx("div",{style:SIDCalcTit,children:"${tit}"}),`,
    veces: 1,
  })),
  {
    nombre: 'Cl III: copiar la última jornada hasta cubrir los días de la operación',
    viejo: 'onClick:()=>Yn(Pt=>Pt.slice(0,-1)),disabled:ln.length<=1,children:"− quitar"})',
    nuevo: 'onClick:()=>Yn(Pt=>Pt.slice(0,-1)),disabled:ln.length<=1,children:"− quitar"}),f.jsx("button",{style:fn.btnSec,title:"Copia la última jornada hasta cubrir los días de la operación",onClick:()=>Yn(Pt=>SIDCalcCompletar(Pt,Ea)),children:`⧉ hasta ${Ea} días`})',
    veces: 1,
  },
  {
    nombre: '🧮 Cálculos: reabastecimiento y encabezado del Word; el resumen y el botón al pie',
    viejo: ',f.jsxs("div",{style:fn.resumen,children:[',
    nuevo: ',SIDCalcReabUI({f,fn,plan:SIDplan,val:SIDre,onVal:SIDsetRe,racion:Pn}),SIDCalcEncUI({f,fn,auto:SIDencAuto,val:SIDenc,onVal:SIDsetEnc})],pie:[f.jsxs("div",{style:fn.resumen,children:[',
    veces: 1,
  },
  {
    nombre: 'Panel G-4: los números se llaman como función (no se pierde el cursor al escribir)',
    viejo: 'f.jsx(Vt,{',
    nuevo: 'Vt({',
    veces: 9,
  },
  {
    nombre: 'Panel G-4: las pestañas de las clases se llaman como función',
    viejo: 'f.jsx(Nn,{',
    nuevo: 'Nn({',
    veces: 4,
  },
]
