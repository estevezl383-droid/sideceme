// Reemplazos del 2026-10-25 sobre calcos/assets/index-itinerario-20261025.js → index-evento-critico-20261025.js.
// Sergio, con la F4·P7 del PMTD a la vista: que en la Matriz de sincronización salga «el evento más crítico», donde se
// puedan cargar la fase del enemigo ROJO que desarrolló el G-2 y la del G-3, «para que se enfrenten», guardadas y
// «listas para jugar» en el Juego de Guerra. Ahora (calcos/evento-critico/v1):
//   · arriba de la F4·P6-7 Matriz de sincronización del Tablero del G-3, «⚔️ Evento crítico para el Juego de Guerra»:
//     cada fase 🔵 del CAP con la fase 🔴 del CAE que la enfrenta, medido (unidades enemigas en contacto, poder, la
//     distancia), el más crítico con ⭐; 💾 lo guarda en la hoja (`g3.sincro._evento`), 📝 lo anota en la matriz (sólo
//     casillas vacías) y ⬇️ baja el ejercicio con `eventoCritico` armado para el Juego de Guerra.
//
// SHA-256 de index-itinerario-20261025.js (antes de estos reemplazos): 67fe207ae83345c987ce5a89001410c99ad306b786369ed11d5669fc28456d82
module.exports = [
  {
    nombre: 'Importa el panel del evento crítico',
    viejo: 'import {planReabastecimiento as SIDCalcPlan,',
    nuevo: 'import SIDEvPanel from "../evento-critico/v1/panel.js?v=ev20261025";import {planReabastecimiento as SIDCalcPlan,',
    veces: 1,
  },
  {
    nombre: 'F4·P6-7 Matriz de sincronización: el panel «⚔️ Evento crítico para el Juego de Guerra»',
    viejo: 'Ke.autollena&&f.jsx("button",{style:At.sembrar,onClick:()=>de(Ke),children:"🌱 Traer del calco lo que falte"})',
    nuevo:
      'Ke.id==="sincro"&&f.jsx(SIDEvPanel,{R:{jsx:f.jsx,jsxs:f.jsxs,useState:je.useState},hoja:Ke,valor:M[Ke.id],ctx:SIDctxCap,onLlevar:SIDv=>Ge(Ke.id,SIDv)},"ev-"+Ke.id),' +
      'Ke.autollena&&f.jsx("button",{style:At.sembrar,onClick:()=>de(Ke),children:"🌱 Traer del calco lo que falte"})',
    veces: 1,
  },
]
