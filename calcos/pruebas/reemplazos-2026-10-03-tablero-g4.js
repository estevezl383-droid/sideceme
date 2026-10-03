// Reemplazos hechos el 2026-10-03 sobre el compilado de la Mesa del EM
// (calcos/assets/index-edicion-20261003.js → index-tablero-g4-20261003.js).
// Los pidió Sergio con capturas de la ficha de una instalación («puro texto») y del paso a
// paso del ASDI:
//   · al tocar una instalación quiere ver A QUIÉN APOYA (p. ej. la FT TORREZ), cuánta gente
//     y cuántos vehículos tiene esa unidad, cuánto consume en la defensa (munición incluida),
//     cuántos vehículos hacen falta y con qué frecuencia: un TABLERO DEL G-4 con gráficos y
//     números, con IA (pedido con sus ideas). → la ficha documental (fichas-instalacion/v1)
//     se reemplaza por el tablero (fichas-instalacion/v2), y el globo de la instalación en
//     la carta muestra el resumen en barras;
//   · que la Mesa PROPONGA dónde va el ASDI con el análisis de la PICB (el CMOC) → el módulo
//     de logística recibe el CMOC del calco (y la acción de agregar un área como si se
//     trazara, para llevar las áreas propuestas al calco con su magnitud).
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer
// «veces» veces) y se cambió por «nuevo». construir-tablero-g4.js arma el compilado y
// comprueba que deshaciéndolos se vuelve byte por byte al anterior.
// Si se vuelve a compilar desde el fuente, esto es lo que hay que pasarle.
//
// El código vive en archivos legibles aparte: calcos/fichas-instalacion/v2/ y
// calcos/logistica/v1/ (planeamiento.js, asdi-picb.js, graficos.js).
module.exports = [
  {
    nombre: 'Tablero G-4 · la instalación abre el tablero (fichas-instalacion/v2) en vez de la ficha de texto',
    viejo: 'import SIDFichaInstalacion from "../fichas-instalacion/v1/editor.js";',
    nuevo: 'import SIDFichaInstalacion from "../fichas-instalacion/v2/tablero.js";',
    veces: 1,
  },
  {
    nombre: 'Tablero G-4 · el módulo de logística recibe el CMOC, la acción de agregar un área al calco y createPortal (la propuesta «en grande» va en <body>)',
    viejo:
      'je.useEffect(()=>{SIDLogSync({ops:Lt,unidades:dn,fasesCOA:Yn,conceptoApoyo:pn,misionLog:_,herramienta:ba,zonaLogTipo:Hi,acciones:{ajustarZona:AC,setOps:Sn,herramienta:Ep,zonaLogTipo:Tr,desplegar:tw}})},[Lt,dn,Yn,pn,_,ba,Hi,AC,Ep,tw]);',
    nuevo:
      'je.useEffect(()=>{SIDLogSync({ops:Lt,unidades:dn,cmoc:Jt,fasesCOA:Yn,conceptoApoyo:pn,misionLog:_,herramienta:ba,zonaLogTipo:Hi,acciones:{ajustarZona:AC,setOps:Sn,herramienta:Ep,zonaLogTipo:Tr,desplegar:tw,agregarOps:xm},portal:Ife.createPortal})},[Lt,dn,Jt,Yn,pn,_,ba,Hi,AC,Ep,tw,xm]);',
    veces: 1,
  },
  {
    nombre: 'Tablero G-4 · el botón del globo de la instalación',
    viejo: '_f.textContent="ABRIR FICHA DOCUMENTAL";',
    nuevo: '_f.textContent="📊 ABRIR TABLERO G-4";',
    veces: 1,
  },
  {
    nombre: 'Tablero G-4 · el globo de la instalación muestra a quién apoya, en barras (se llena al abrirse)',
    viejo: 'B.append(U,_f,G);Rt.DomEvent.disableClickPropagation(B);I.bindPopup(B)}',
    nuevo:
      'const SIDrI=document.createElement("div");B.append(U,SIDrI,_f,G);Rt.DomEvent.disableClickPropagation(B);I.bindPopup(B,{maxWidth:320});I.on("popupopen",()=>{try{window.SIDResumenInst&&window.SIDResumenInst(x.id,SIDrI)}catch(SIDe){}})}',
    veces: 1,
  },
  {
    nombre: 'Tablero G-4 · tocar la instalación en la carta 2D abre el globo con el resumen (el tablero se abre con su botón; en 3D, o con el tablero ya abierto, se abre directo)',
    viejo: 'x.tipo==="instalacion"?window.dispatchEvent(new CustomEvent("sideceme:ficha-instalacion",{detail:{id:x.id}}))',
    nuevo: 'x.tipo==="instalacion"?window.dispatchEvent(new CustomEvent("sideceme:instalacion-tocada",{detail:{id:x.id}}))',
    veces: 1,
  },
]
