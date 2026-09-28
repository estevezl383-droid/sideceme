// Reemplazos hechos el 2026-09-28 sobre el compilado de la Mesa del EM
// (calcos/assets/index-sxnJI1Ur.js → el que carga hoy calcos/index.html).
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que
// aparecer «veces» veces) y se cambió por «nuevo». reemplazos-compilado.js
// comprueba que deshaciéndolos se vuelve byte por byte al anterior.
// Si se vuelve a compilar desde el fuente, esto es lo que hay que pasarle.

// Un solo pedido de las capas prendidas al cambiar el Área de Interés.
//
// El efecto que trae las capas prendidas del tablero depende de [X,Ae,Ce]
// (país, área y un contador que versiona la caché `tt`). Otro efecto, con
// [Ae], sube ese contador cada vez que cambia el área. Resultado: al cambiar el
// área el primero corría DOS veces —una por `Ae` y, un render después, otra por
// `Ce`— y mandaba a calcos-datos dos pedidos iguales. La limpieza descartaba el
// primero, pero el servidor ya lo tenía y lo procesaba entero.
//
// Ahora el efecto del contador anota con qué valor estaba `Ce` al cambiar el
// área, y el de las capas no corre mientras `Ce` siga en ese valor: corre una
// sola vez, en el render siguiente, ya con el contador nuevo. Así lo que trae
// queda en la caché con la clave nueva y ⚡ GENERAR CALCOS no lo vuelve a pedir.
// Un cambio de país sin cambio de área corre como siempre (el contador ya subió).
module.exports = [
  {
    nombre: 'Capas prendidas · lugar para anotar el contador viejo',
    viejo: 'tt=je.useRef({}),',
    nuevo: 'tt=je.useRef({}),ceAnterior=je.useRef(null),',
    veces: 1,
  },
  {
    nombre: 'Capas prendidas · al cambiar el área se anota el contador que queda viejo',
    viejo: 'je.useEffect(()=>{Fe(Ee=>Ee+1),SN()&&(tt.current={},_e({}))},[Ae])',
    nuevo: 'je.useEffect(()=>{ceAnterior.current=Ce,Fe(Ee=>Ee+1),SN()&&(tt.current={},_e({}))},[Ae])',
    veces: 1,
  },
  {
    nombre: 'Capas prendidas · no se piden con el contador viejo (un solo pedido)',
    viejo: 'je.useEffect(()=>{if(SN()&&!Ae)return;const Ee=new Set(Lp[X].capasExcluidas)',
    nuevo: 'je.useEffect(()=>{if(Ce===ceAnterior.current||SN()&&!Ae)return;const Ee=new Set(Lp[X].capasExcluidas)',
    veces: 1,
  },
]
