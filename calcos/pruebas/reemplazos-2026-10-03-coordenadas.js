// Reemplazos hechos el 2026-10-03 (cuarta vuelta) sobre el compilado de la Mesa del EM
// (calcos/assets/index-g5-20261003.js → index-coordenadas-20261003.js).
// Al mirar los Word del G-5 apareció «68°20'60"O»: Sc (la coordenada que escribe la Mesa en
// grados, minutos y segundos, en los documentos, los Word y los pedidos a la IA) redondeaba
// los segundos sin acarrear al minuto (ni el minuto al grado). Ahora redondea primero a
// segundos TOTALES y recién después parte en grados, minutos y segundos: -68,35 sale
// «68°21'00"O». Es la única copia de la cuenta en el compilado (el plan de fuegos tiene la
// suya en calcos/fuegos/plan-fuegos.js y ya acarreaba bien).
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer
// «veces» veces) y se cambió por «nuevo». construir-coordenadas.js arma el compilado y
// comprueba que deshaciéndolos se vuelve byte por byte al anterior.
module.exports = [
  {
    nombre: 'Coordenadas · Sc acarrea los segundos y los minutos (no más «60"»)',
    viejo: 'function Sc(t,e){const n=(a,i,o)=>{const s=a>=0?i:o,r=Math.abs(a),u=Math.floor(r),h=Math.floor((r-u)*60),y=Math.round(((r-u)*60-h)*60);return`${u}°${String(h).padStart(2,"0")}\'${String(y).padStart(2,"0")}"${s}`};return`${n(t,"N","S")} ${n(e,"E","O")}`}',
    nuevo: 'function Sc(t,e){const n=(a,i,o)=>{const s=a>=0?i:o,r=Math.round(Math.abs(a)*3600),u=Math.floor(r/3600),h=Math.floor(r%3600/60),y=r%60;return`${u}°${String(h).padStart(2,"0")}\'${String(y).padStart(2,"0")}"${s}`};return`${n(t,"N","S")} ${n(e,"E","O")}`}',
    veces: 1,
  },
]
