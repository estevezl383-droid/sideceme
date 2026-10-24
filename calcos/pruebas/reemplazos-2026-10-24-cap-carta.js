// Reemplazos del 2026-10-24 sobre calcos/assets/index-cap-propios-20261024.js → index-cap-carta-20261024.js.
// Sergio: «tú me los propones los dos con sus fases (con ayuda de la IA: la aplicación me genera el prompt con toda la
// situación y la IA me lo genera, yo lo pego y se coloca en la mesa)». Ahora el panel de los dos CAP (F3·P6 y F3·P4)
// tiene «🤖 La IA desarrolla los dos CAP EN LA CARTA» (calcos/cap-propios/v1/carta-ia.mjs): el pedido lleva el
// expediente, la propuesta y las piezas de la carta; al pegar la respuesta, la Mesa arma las fases 🔵 de los dos CAP
// con cada unidad en su lugar, las tareas tácticas y los obstáculos, y llena la F3·P6 de cada uno (sólo lo vacío).
//
// SHA-256 de index-cap-propios-20261024.js (antes de estos reemplazos): 99ba40e423e91f93729954f390788e862af13d51887bb6a25adccd753f635341
module.exports = [
  {
    nombre: 'El panel recibe la caja de la IA de la Mesa (hU) y los catálogos de tareas tácticas (zg) y obstáculos (Nm)',
    viejo: 'SIDCapConfig({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState});',
    nuevo: 'SIDCapConfig({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,CajaIA:hU,tareas:zg.map(SIDt=>({id:SIDt.id,nombre:SIDt.nombre})),obstaculos:Nm});',
    veces: 1,
  },
  {
    nombre: 'La Mesa: al poner un CAP en la carta también se carga el calco de la fase (setOps); con el ejercicio finalizado, el candado',
    viejo: 'setUnidades:Ra,bloqueado:ll,avisoBloqueo:Nl,aviso:za,error:he}),[Yn,Ya,fo,dn,Lt,Qr,yt,ll,Nl,za])',
    nuevo: 'setUnidades:Ra,setOps:Sn,bloqueado:ll||Bn,avisoBloqueo:ll?Nl:()=>he("🔒 Ejercicio finalizado: duplíquelo para editar."),aviso:za,error:he}),[Yn,Ya,fo,dn,Lt,Qr,yt,ll,Bn,Nl,za])',
    veces: 1,
  },
  {
    nombre: 'El panel de los CAP recibe el expediente (para el pedido de la IA)',
    viejo: 'onLlevar:SIDv=>Ge(Ke.id,SIDv)},"cap-"+Ke.id)',
    nuevo: 'onLlevar:SIDv=>Ge(Ke.id,SIDv),onExpediente:j},"cap-"+Ke.id)',
    veces: 1,
  },
]
