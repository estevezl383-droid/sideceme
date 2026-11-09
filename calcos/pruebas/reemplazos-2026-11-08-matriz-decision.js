// Reemplazos del 2026-11-08 sobre calcos/assets/index-decision-cap-20261108.js → index-matriz-decision-20261108.js.
// Sergio, con la F5·P1 Matriz de decisión abierta: «en el paso 5 comparación de los cursos de acción se supone que
// debería generar algo que favorezca a lo que ya se decidió; y otra cosa, eran dos cursos de acción, entonces no debe
// haber cabida para otro curso de acción… solo sobre los dos cursos de acción, y además que evalúe todas esas
// ventajas… todo eso debe llenar». Ahora (calcos/evento-critico/v1/decision.mjs):
//   · la F5·P1 tiene dos columnas: CAP-1 y CAP-2 (en pantalla, Vista previa, Word y la IA);
//   · el pedido de la IA de la F5·P1 lleva los dos CAP, pide los ocho factores en las dos columnas y, si el Comandante
//     ya decidió (F4·P6-7), que la comparación sustente ese CAP;
//   · al aplicar la IA, «RECOMENDADO AL COMANDANTE» queda en el CAP decidido;
//   · la línea de arriba de la F5·P1 dice el CAP decidido sin «A la vista está el CAP n…» (compara los dos);
//   · la clave de la marca en el pedido de la IA dice las marcas de la hoja (antes decía «MÁS PROBABLE o MÁS
//     PELIGROSO» también en la F5·P1; en la H.T. 18 del G-2 queda igual).
//
// SHA-256 de index-decision-cap-20261108.js (antes de estos reemplazos): ver construir-matriz-decision.js.
module.exports = [
  {
    nombre: 'Importa la decisión con versión nueva y el arreglo de la marca tras la IA',
    viejo: 'pedidoDecision as SIDDecPedido} from "../evento-critico/v1/decision.mjs?v=decision20261108";',
    nuevo: 'pedidoDecision as SIDDecPedido,trasDecision as SIDDecTras} from "../evento-critico/v1/decision.mjs?v=matriz20261108";',
    veces: 1,
  },
  {
    nombre: 'F5·P1: sólo CAP-1 y CAP-2',
    viejo: 'tipo:"prioridad",cols:["CAP-1","CAP-2","CAP-3"],filas:["VENTAJAS"',
    nuevo: 'tipo:"prioridad",cols:["CAP-1","CAP-2"],filas:["VENTAJAS"',
    veces: 1,
  },
  {
    nombre: 'Pedido de la IA: la pregunta de la marca con las marcas de la hoja',
    viejo: '`¿${E} es MÁS PROBABLE o MÁS PELIGROSO?`',
    nuevo: '`¿${E} es ${(t.marcas&&t.marcas.length?t.marcas:["MÁS PROBABLE","MÁS PELIGROSO"]).join(" o ")}?`',
    veces: 1,
  },
  {
    nombre: 'G-3 · aplicar la IA: en la F5·P1 la marca queda en el CAP decidido',
    viejo: 'Tt[Ke.id]=SIDpt.valor;return Ge(Ke.id,Tt[Ke.id])',
    nuevo: 'Tt[Ke.id]=SIDDecTras(Ke,SIDpt.valor,SIDctxCap);return Ge(Ke.id,Tt[Ke.id])',
    veces: 1,
  },
]
