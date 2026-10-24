// Reemplazos del 2026-10-24 sobre calcos/assets/index-cap-carta-20261024.js → index-fuegos-fase-20261024.js.
// Sergio pidió las dos cosas que quedaban de los CAP propios:
//   · los FUEGOS POR FASE: el plan de fuegos era uno solo para todo el ejercicio (planFuegos); ahora cada fase 🔵 del
//     C.A. propio guarda el suyo, como ya guardaba las fichas y el calco (al dejar la fase se guarda; al tocarla, si
//     tiene plan, vuelve; si no tiene, queda el que está: lo ya hecho no cambia). La IA de los dos CAP pone las
//     concentraciones de cada fase (calcos/cap-propios/v1/carta-ia.mjs);
//   · el TEXTO DE LA F3·P6 DESDE LA CARTA: «📝 Llevar la carta a la F3·P6 de los dos CAP» (texto-carta.mjs) y, en el
//     pedido de la IA de la F3·P4 y la F3·P6, «LO QUE YA ESTÁ EN LA CARTA» (pedidoCAP de panel.js).
//
// SHA-256 de index-cap-carta-20261024.js (antes de estos reemplazos): ca358322e4536af3ff585307434a3718517db3698517cb42999350715208fb68
module.exports = [
  {
    nombre: 'Cada fase propia guarda su plan de fuegos al dejarla',
    viejo:
      'fo=je.useCallback(Ee=>yt?{...Ee,[yt.bando]:Ee[yt.bando].map((Qe,ot)=>ot===yt.idx?{...Qe,unidades:dn.filter(ct=>ct.deFaseEnemiga==null),ops:Qr(Lt),desplazamientos:Jt.desplazamientos}:Qe)}:Ee,[yt,dn,Lt,Jt.desplazamientos,Qr])',
    nuevo:
      'fo=je.useCallback(Ee=>yt?{...Ee,[yt.bando]:Ee[yt.bando].map((Qe,ot)=>ot===yt.idx?{...Qe,unidades:dn.filter(ct=>ct.deFaseEnemiga==null),ops:Qr(Lt),desplazamientos:Jt.desplazamientos,...(yt.bando==="propio"&&planFuegos?{plan:planFuegos}:{})}:Qe)}:Ee,[yt,dn,Lt,Jt.desplazamientos,Qr,planFuegos])',
    veces: 1,
  },
  {
    nombre: 'Al tocar una fase propia con plan de fuegos, vuelve su plan (sin plan, queda el que está)',
    viejo: 'Sn(vn=>({...Qr(xt?.ops||Vt),ains:vn.ains||[]})),',
    nuevo: 'Sn(vn=>({...Qr(xt?.ops||Vt),ains:vn.ains||[]})),Ee==="propio"&&xt?.plan&&setPlanFuegos(xt.plan),',
    veces: 1,
  },
  {
    nombre: 'La Mesa de los CAP: al poner un CAP en la carta, también el plan de fuegos de su fase 1',
    viejo: 'setOps:Sn,bloqueado:ll||Bn,',
    nuevo: 'setOps:Sn,setPlan:setPlanFuegos,bloqueado:ll||Bn,',
    veces: 1,
  },
  {
    nombre: 'El pedido de la F3·P4 y la F3·P6 lleva además lo que ya está en la carta (pedidoCAP de panel.js)',
    viejo:
      'import SIDCapPanel,{configurarCAP as SIDCapConfig,botonesCAP as SIDCapBotones} from "../cap-propios/v1/panel.js";import {accion as SIDCapAccion,pedido as SIDCapPedido} from "../cap-propios/v1/proponer.mjs";',
    nuevo:
      'import SIDCapPanel,{configurarCAP as SIDCapConfig,botonesCAP as SIDCapBotones,pedidoCAP as SIDCapPedido} from "../cap-propios/v1/panel.js";import {accion as SIDCapAccion} from "../cap-propios/v1/proponer.mjs";',
    veces: 1,
  },
]
