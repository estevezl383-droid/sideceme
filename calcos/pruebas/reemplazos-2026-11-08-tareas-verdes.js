// 2026-11-08 — «necesito que las tareas tácticas sean verde fluorescente para que se noten, así no
// se puede ver nada» (Sergio, con la imagen satelital y los calcos del terreno encima: el bordó
// #b01045 se perdía entre los rojos y naranjas). En la carta 2D, al girarlas/cambiarlas y en el 3D,
// las tareas tácticas del calco van en VERDE FLUORESCENTE con un borde negro que las despega del
// fondo. El color del resto (sectores, fichas) no cambia.
// Además la capa de la F3·P3 recibe la Orden del superior (ordenSup) para saber cuál es la unidad
// propia y mostrar sólo lo que depende de ella (organizacion/v1/mando.js).
module.exports = [
  {
    nombre: 'tareas verdes: el color y el borde',
    veces: 1,
    viejo: 'const Yye=15e3,F1="#b01045",hd="#000"',
    nuevo: 'const Yye=15e3,F1="#b01045",SIDVerdeTarea="#39ff14",SIDTareaVerde=h=>`<div style="filter:drop-shadow(0 0 1.2px #000) drop-shadow(0 0 1.2px #000) drop-shadow(0 0 2px rgba(0,0,0,.8))">${h}</div>`,hd="#000"',
  },
  {
    nombre: 'tareas verdes: carta 2D',
    veces: 1,
    viejo: 'html:cb(dt.tarea,mt,F1,dt.rot||0)',
    nuevo: 'html:SIDTareaVerde(cb(dt.tarea,mt,SIDVerdeTarea,dt.rot||0))',
  },
  {
    nombre: 'tareas verdes: al girarla o cambiar su tamaño',
    veces: 1,
    viejo: 'html:cb(dt.tarea,p,F1,r)',
    nuevo: 'html:SIDTareaVerde(cb(dt.tarea,p,SIDVerdeTarea,r))',
  },
  {
    nombre: 'tareas verdes: 3D',
    veces: 1,
    viejo: 'dt.innerHTML=cb(On.tarea,Bn,"#7b1020",On.rot||0)',
    nuevo: 'dt.innerHTML=SIDTareaVerde(cb(On.tarea,Bn,SIDVerdeTarea,On.rot||0))',
  },
  {
    nombre: 'F3·P3 en la carta: la Orden del superior (unidad propia)',
    veces: 1,
    viejo: 'SIDOISync({ops:Lt,g3:Ya,unidades:dn,',
    nuevo: 'SIDOISync({ops:Lt,g3:Ya,unidades:dn,ordenSup:Tn,',
  },
]
