// Reemplazos del 2026-10-18 sobre calcos/assets/index-huellas-20261016.js → index-seleccionar-20261018.js.
// Lo pidió Sergio con la captura del tablero del G-4 (los 30 puestos del Batallón Logístico
// amontonados en la carta) y la del paso a paso del ASDI:
//   «necesito una herramienta que me permita seleccionar objetos… aquí en el G-4 no encuentro cómo
//   borrar esos símbolos… dibujar un área, seleccionar, y hacer clic otra vez para deseleccionar uno
//   por uno, así como en PowerPoint» · «en las opciones del G-4 que no haya texto, que no haya la
//   explicación de qué es ASDI, sólo las herramientas para construir… no me modifiques, sólo quitá lo
//   que no es necesario» · «quiero preparar el ejercicio para que los alumnos lo desarrollen».
//
// ⬚ Seleccionar (la herramienta está en calcos/seleccion, código legible; ver su README). Acá sólo:
//   · el import del módulo;
//   · cada ficha de la carta 2D lleva data-sid-unidad (así el módulo sabe qué unidad es cada dibujo);
//   · el botón «⬚ Seleccionar» junto a la 📏 Regla (es una herramienta más: `ba === "seleccionar"`); en
//     pantallas angostas muestra sólo «⬚» (seleccion.mjs esconde .sid-sel-txt) para no sumarle una fila a la barra;
//   · con esa herramienta la carta no recibe «seleccionar» como herramienta de trazado;
//   · el puente: `aplicar` borra fichas y figuras guardando UNA foto (fichas + calco) para el ↶ Deshacer,
//     y respeta el candado del ejercicio finalizado; `Mg` devuelve las dos cosas juntas.
// 🚚 Apoyo Logístico — G-4: se quitan los textos de explicación de las pestañas ▣ ASDI, ↔ Ejes,
// 🎬 Concepto y 🧮 Cálculos (quedan los botones, las listas, los campos y los resultados). El paso a
// paso del ASDI (calcos/logistica/v1/editor.js) se importa con otra versión porque también cambió.
//
// SHA-256 de index-huellas-20261016.js (antes de estos reemplazos): f74f56c27cbdb626264b1b765716153ffde35232cdc902acfb4233f9de4a0ddd
module.exports = [
  {
    nombre: "Seleccionar · el módulo calcos/seleccion",
    viejo: "import {alAvisar as SIDavisoHuellas} from \"../huellas/v1/huellas-osm.mjs?v=huellas20261016\";",
    nuevo: "import {alAvisar as SIDavisoHuellas} from \"../huellas/v1/huellas-osm.mjs?v=huellas20261016\";import {sincronizarSeleccion as SIDSelSync} from \"../seleccion/v1/seleccion.mjs?v=seleccionar20261018\";",
    veces: 1,
  },
  {
    nombre: "G-4 · el paso a paso del ASDI sin textos (logistica/v1/editor.js con otra versión)",
    viejo: "import SIDEditorLog,{PasoAPaso as SIDLogPaso} from \"../logistica/v1/editor.js\";",
    nuevo: "import SIDEditorLog,{PasoAPaso as SIDLogPaso} from \"../logistica/v1/editor.js?v=herramientas20261018\";",
    veces: 1,
  },
  {
    nombre: "Seleccionar · cada ficha de la carta 2D dice qué unidad es",
    viejo: ".bindTooltip(T,{direction:\"top\",opacity:.96}).addTo(g);if(x.tareaSimbolo){",
    nuevo: ".bindTooltip(T,{direction:\"top\",opacity:.96}).addTo(g);I._icon&&I._icon.setAttribute(\"data-sid-unidad\",String(x.id));if(x.tareaSimbolo){",
    veces: 1,
  },
  {
    nombre: "Seleccionar · el botón «⬚ Seleccionar» en la barra, junto a la 📏 Regla",
    viejo: "children:\"📏 Regla\"}),",
    nuevo: "children:\"📏 Regla\"}),f.jsxs(\"button\",{className:\"btn-cmoc-abrir btn-seleccionar\",onClick:()=>{if(Ka){za(\"⬚ Seleccionar funciona en la carta 2D.\");return}Ep(ba===\"seleccionar\"?null:\"seleccionar\")},style:ba===\"seleccionar\"?{borderColor:\"#22d3ee\",color:\"#a5f3fc\"}:null,\"aria-pressed\":ba===\"seleccionar\",\"aria-label\":\"Seleccionar\",\"data-sid-herramienta\":\"seleccionar\",title:\"SELECCIONAR (como en PowerPoint): arrastrá un recuadro sobre la carta y quedan seleccionadas las fichas y las figuras que caen adentro (con Alt o Ctrl el recuadro las quita); clic en una para sumarla o quitarla. Supr o «🗑 Borrar» borra lo seleccionado y «↶ Deshacer» lo devuelve. La carta se mueve con el botón derecho; Esc sale.\",children:[f.jsx(\"span\",{className:\"sid-sel-ico\",children:\"⬚\"}),f.jsx(\"span\",{className:\"sid-sel-txt\",children:\" Seleccionar\"})]}),",
    veces: 1,
  },
  {
    nombre: "Seleccionar · con la herramienta puesta la carta no traza nada",
    viejo: "herramientaOps:Pt||ti||Ta||Mi||zd||yh||vi||fs||Co||tu&&ba===\"ain\"||ba===\"regla\"?ba:null,",
    nuevo: "herramientaOps:ba!==\"seleccionar\"&&(Pt||ti||Ta||Mi||zd||yh||vi||fs||Co||tu&&ba===\"ain\"||ba===\"regla\")?ba:null,",
    veces: 1,
  },
  {
    nombre: "Seleccionar · ↶ Deshacer devuelve juntas las fichas y el calco de un borrado",
    viejo: "Ee?Ee.__SIDunidades?(Ra(Ee.__SIDunidades),\"unidades\"):(Sn(Ee),!0):!1",
    nuevo: "Ee?Ee.__SIDunidades?(Ra(Ee.__SIDunidades),Ee.__SIDops?(Sn(Ee.__SIDops),\"seleccion\"):\"unidades\"):(Sn(Ee),!0):!1",
    veces: 1,
  },
  {
    nombre: "Seleccionar · lo que dice el ↶ Deshacer",
    viejo: "SIDr===\"unidades\"?\"↶ Se deshizo: las fichas de la carta volvieron como estaban\":\"↶ Se deshizo el último trazo\"",
    nuevo: "SIDr===\"seleccion\"?\"↶ Se deshizo: volvió lo que se borró con ⬚ Seleccionar\":SIDr===\"unidades\"?\"↶ Se deshizo: las fichas de la carta volvieron como estaban\":\"↶ Se deshizo el último trazo\"",
    veces: 1,
  },
  {
    nombre: "Seleccionar · el puente con la Mesa (borrar con UNA foto para el deshacer)",
    viejo: "portal:Ife.createPortal})},[Lt,dn,Jt,Yn,pn,_,ba,Hi,AC,Ep,tw,xm]);",
    nuevo: "portal:Ife.createPortal})},[Lt,dn,Jt,Yn,pn,_,ba,Hi,AC,Ep,tw,xm]);const SIDSelAplicar=je.useCallback(({unidades:SIDu,ops:SIDo})=>{if(Bn){he(\"🔒 Ejercicio finalizado: duplíquelo para editar.\");return!1}Ia.current=[...Ia.current.slice(-39),{__SIDunidades:SIDdnRef.current||[],__SIDops:nl.current}],ip(Ia.current.length);if(SIDu&&SIDu.length){const SIDs=new Set(SIDu.map(String));Ra(SIDp=>SIDp.filter(SIDx=>!SIDs.has(String(SIDx?.id))))}SIDo&&Sn(SIDo);return!0},[Bn]);je.useEffect(()=>{SIDSelSync({activa:ba===\"seleccionar\",es3D:Ka,leaflet:Rt,ops:Lt,opsVisibles:kg.ops,verCapa:ai,unidades:kg.unidades,aplicar:SIDSelAplicar,salir:()=>$n(null),avisar:za})},[ba,Ka,Lt,kg,ai,SIDSelAplicar,za]);",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · ASDI · «El ASDI no se dibuja libre…» + ASDI · «Todavía no hay ningún área trazada…»",
    viejo: "(después de elegirla)\"}),f.jsxs(\"div\",{style:fn.ayuda,children:[\"El ASDI no se dibuja libre: es el \",f.jsx(\"b\",{children:\"despliegue de las cinco compañías del Batallón Logístico\"}),\". Trazá el área con «▣ Zona logística» y acá aparece completa. Tu trabajo después es \",f.jsx(\"b\",{children:\"adaptarla al terreno\"}),\": el agua junto al curso, la Clase III sobre el eje, el Puesto de Reunión de Muertos lejos de las instalaciones de moral. Cada puesto se arrastra.\"]}),!fe.length&&f.jsxs(\"div\",{style:fn.aviso,children:[\"Todavía no hay ningún área trazada. \",f.jsx(\"b\",{children:\"Trazala acá mismo\"}),\": elegí cuál y marcá el polígono sobre el terreno (clic = vértice, doble clic = cerrar). No hace falta tener el Área de Operaciones terminada.\"]}),f.jsxs(f.Fragment,{chil",
    nuevo: "(después de elegirla)\"}),f.jsxs(f.Fragment,{chil",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · ASDI · «MARCÁ AL MENOS TRES VÉRTICES…» (quedan los botones) + ASDI · «Se grafica como en el reglamento…»",
    viejo: "n:\"✕ CANCELAR TRAZADO\"}),\"MARCÁ AL MENOS TRES VÉRTICES. CERRÁ CON EL BOTÓN, ENTER, DOBLE CLIC O CLIC EN EL PRIMER VÉRTICE.\"]}),f.jsxs(\"div\",{style:fn.ayuda,children:[\"Se grafica como en el reglamento: \",f.jsx(\"b\",{children:\"polígono de línea negra continua\"}),\" con el rótulo \",f.jsx(\"b\",{children:\"ÁREA / SERV. DIV.\"}),\" al centro. Una vez cerrado, acá abajo aparece la plantilla de las cinco compañías del Batallón Logístico para desplegarla adentro. \",f.jsx(\"b\",{children:\"Cada área nueva se numera sola\"}),\" (ASDI 1, ASDI 2…) y guarda SUS treinta puestos.\"]})]}),fe.length>0&&f.jsxs(",
    nuevo: "n:\"✕ CANCELAR TRAZADO\"})]})]}),fe.length>0&&f.jsxs(",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · ASDI · «Cada área queda rotulada con su número…»",
    viejo: "target.value)||1)})})]}),f.jsxs(\"div\",{style:fn.ayuda,children:[\"Cada área queda rotulada con su número —\",f.jsx(\"b\",{children:\"ÁREA SERV. DIV. 2\"}),\"— así podés armar \",f.jsx(\"b\",{children:\"un ASDI por división\"}),\" en el mismo ejercicio y después asignarle a cada uno su Estado Mayor. Trazá otro con «▣ Zona logística» y aparece acá.\"]}),f.jsxs(\"label\",{style:f",
    nuevo: "target.value)||1)})})]}),f.jsxs(\"label\",{style:f",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · ASDI · «Sanidad y las clases de consumo…»",
    viejo: "ren:Pt.nom},Pt.id))})]}),f.jsxs(\"div\",{style:fn.ayuda,children:[\"Sanidad y las clases de consumo quedan del lado del frente (el herido llega antes); los servicios al personal, a retaguardia. \",f.jsx(\"b\",{children:\"El mismo rumbo orienta el esquema\"}),\": las magnitudes de adelante y de atrás.\"]}),f.jsx(\"div\",{style:fn.s",
    nuevo: "ren:Pt.nom},Pt.id))})]}),f.jsx(\"div\",{style:fn.s",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · ASDI · «El ASDI es la banda del MEDIO…»",
    viejo: "PROFUNDIDAD (3 áreas)\"}),f.jsxs(\"div\",{style:fn.ayuda,children:[\"El ASDI es la banda del MEDIO. De un clic salen también el \",f.jsx(\"b\",{children:\"Área de Trenes\"}),\" adelante y el \",f.jsx(\"b\",{children:\"Área de Retaguardia del C.E.\"}),\" atrás, calcadas de esta misma área y con sus límites (III · XX · XXX). Después cada una se mueve, se agranda y se le corrigen los vértices como cualquier otra.\"]}),f.jsxs(\"label\",{style:f",
    nuevo: "PROFUNDIDAD (3 áreas)\"}),f.jsxs(\"label\",{style:f",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · ASDI · «El área se lee por los límites…»",
    viejo: "squema en profundidad\"}),f.jsxs(\"div\",{style:fn.ayuda,children:[\"El área se lee por los límites que la encierran: \",f.jsx(\"b\",{children:\"adelante\"}),\" las unidades apoyadas (hoy \",f.jsx(\"b\",{children:\"Regimiento, III\"}),\"; la lámina vieja decía Batallón, II) y\",f.jsx(\"b\",{children:\" atrás\"}),\" la Gran Unidad (\",f.jsx(\"b\",{children:\"División, XX\"}),\"). Las marcas quedan\",f.jsx(\"b\",{children:\" sueltas sobre el calco\"}),\": se arrastran al punto exacto, se les cambia el escalón con un clic encima y se borran con clic derecho. El botón vuelve a ponerlas donde las calcula la doctrina.\"]}),f.jsx(\"div\",{style:fn.s",
    nuevo: "squema en profundidad\"}),f.jsx(\"div\",{style:fn.s",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · ASDI · lo que sigue a «✅ Esta área tiene N puesto(s) desplegados»",
    viejo: "${fe.length} áreas)`,\".\",f.jsx(\"br\",{}),\"✋ \",f.jsx(\"b\",{children:\"Cada puesto se arrastra\"}),\" por su símbolo, y \",f.jsx(\"b\",{children:\"cada compañía entera\"}),\" (Sanidad, Abastecimiento, C y S, Mantenimiento, Personal) se mueve con el tirador \",f.jsx(\"b\",{children:\"✥\"}),\" del centro de su área: se va con todos sus puestos adentro. \",f.jsx(\"b\",{children:\"Clic en el área\"}),\" de una compañía y aparecen sus puntos para deformarla y el tirador \",f.jsx(\"b\",{children:\"⤢\"}),\" para agrandarla o achicarla (los puestos acompañan). Clic derecho borra lo que no corresponda.\"]}),f.jsx(\"button\",{styl",
    nuevo: "${fe.length} áreas)`,\".\"]}),f.jsx(\"button\",{styl",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · Ejes · «Los dos ejes son la columna vertebral…»",
    viejo: "yle:fn.cuerpo,children:[f.jsxs(\"div\",{style:fn.ayuda,children:[\"Los dos ejes son la \",f.jsx(\"b\",{children:\"columna vertebral del apoyo\"}),\". Por el \",f.jsx(\"b\",{children:\"EPA\"}),\" fluye el abastecimiento hacia el frente; por el \",f.jsx(\"b\",{children:\"EPE\"}),\" vuelven heridos, material a reparar, muertos y prisioneros. Trazalos \",f.jsx(\"b\",{children:\"en el sentido del flujo\"}),\": la punta de flecha sale del último tramo.\"]}),f.jsx(\"button\",{onClick:",
    nuevo: "yle:fn.cuerpo,children:[f.jsx(\"button\",{onClick:",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · Ejes · «MARCÁ DOS O MÁS PUNTOS…» (quedan los botones)",
    viejo: "ren:\"✕ CANCELAR TRAZO\"}),\"MARCÁ DOS O MÁS PUNTOS. TERMINÁ CON EL BOTÓN, ENTER O DOBLE CLIC. Clic = vértice · para terminar: doble clic, Enter o clic otra vez en el último punto. Seguí una vía real: activá la capa\",f.jsx(\"b\",{children:\" Vías (clasificación militar)\"}),\" para ver por dónde rinde el transporte.\"]}),y.length>0&&f.jsxs(f",
    nuevo: "ren:\"✕ CANCELAR TRAZO\"})]}),y.length>0&&f.jsxs(f",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · Ejes · «Referencia del texto: … 200 km…»",
    viejo: "h,\" vértices\"]})]},Zt)}),f.jsxs(\"div\",{style:fn.ayuda,children:[\"Referencia del texto: el Batallón Logístico asegura \",f.jsx(\"b\",{children:\"Clase III hasta 200 km por carreteras\"}),\". Si el eje pasa de ahí, el apoyo no se sostiene sin un Puesto de Abastecimiento Clase III avanzado del escalón superior.\"]})]})]}),Re===\"concepto\"&&",
    nuevo: "h,\" vértices\"]})]},Zt)})]})]}),Re===\"concepto\"&&",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · Concepto · «Para cada fase del G-3, el Anexo exige…»",
    viejo: "yle:fn.cuerpo,children:[f.jsxs(\"div\",{style:fn.ayuda,children:[\"Para \",f.jsx(\"b\",{children:\"cada fase del G-3\"}),\", el Anexo exige declarar el \",f.jsx(\"b\",{children:\"enfoque de apoyo\"}),\" (qué función pesa en esa fase) y la \",f.jsx(\"b\",{children:\"prioridad de apoyo\"}),\" (en qué orden se atiende a las agrupaciones). Es el párrafo III.A.1 del Anexo de Apoyo de Servicio de Combate: sin esto, el concepto de apoyo no corresponde al concepto de la operación.\"]}),x?f.jsxs(f.Fragment,{chi",
    nuevo: "yle:fn.cuerpo,children:[x?f.jsxs(f.Fragment,{chi",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · Concepto · «… no hay que copiarlas a mano.» (queda la cuenta)",
    viejo: "===\"epe\").length} EPE)`,\". Las instalaciones se reparten solas por clase de abastecimiento y se listan con sus coordenadas; no hay que copiarlas a mano.\"]}),f.jsx(\"button\",{styl",
    nuevo: "===\"epe\").length} EPE)`,\".\"]}),f.jsx(\"button\",{styl",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · Cálculos · la descripción de la ración",
    viejo: " \",Pt.nom]},Pt.id))})]}),f.jsx(\"div\",{style:fn.ayuda,children:(pe=IU.find(Pt=>Pt.id===Pn))==null?void 0:pe.desc}),f.jsxs(\"div\",{style:fn.",
    nuevo: " \",Pt.nom]},Pt.id))})]}),f.jsxs(\"div\",{style:fn.",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · Cálculos · «Los vehículos consumen…»",
    viejo: "mbre/día\"]},Pt.id))})]}),f.jsxs(\"div\",{style:fn.ayuda,children:[\"Los vehículos consumen \",mse,\" L por día cada uno.\"]}),f.jsxs(\"div\",{style:fn.",
    nuevo: "mbre/día\"]},Pt.id))})]}),f.jsxs(\"div\",{style:fn.",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · Cálculos · «Kilómetro operativo = …»",
    viejo: "yle:fn.cuerpo,children:[f.jsxs(\"div\",{style:fn.ayuda,children:[f.jsx(\"b\",{children:\"Kilómetro operativo\"}),\" = litros que consume la GU por cada km recorrido. Referencia del texto: \",ZLe.map(Pt=>`${Pt.nom} ${Pt.litros} L`).join(\" · \"),\".\"]}),f.jsxs(\"table\",{style:fn",
    nuevo: "yle:fn.cuerpo,children:[f.jsxs(\"table\",{style:fn",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · Cálculos · «DM = … DA = … MD = …»",
    viejo: ",ancho:54,sufijo:\"L\"})}),f.jsxs(\"div\",{style:fn.ayuda,children:[f.jsx(\"b\",{children:\"DM\"}),\" = distancia de movimiento (km), con el Km Op del elemento que se mueve ·\",f.jsx(\"b\",{children:\" DA\"}),\" = distancia de abastecimiento (km), sobre el \",Math.round(.2*100),\" % del Km Op de maniobra ·\",f.jsx(\"b\",{children:\" MD\"}),\" = movimientos diversos, \",yse,\" km/día con el Km Op de la GU, UNA vez por día · Factor seguridad \",Math.round(vse*100),\" % sobre lo que va por caminos.\"]}),f.jsx(hN,{pasos:ft.paso",
    nuevo: ",ancho:54,sufijo:\"L\"})}),f.jsx(hN,{pasos:ft.paso",
    veces: 1,
  },
  {
    nombre: "G-4 sin textos · Cálculos · «Consumo probable de munición…»",
    viejo: "n,onChange:wn,ancho:54}),f.jsx(\"div\",{style:fn.ayuda,children:\"Consumo probable de munición por arma y por día, según la naturaleza del combate. Los valores cargados son los del ataque a una posición organizada del ECEM 15-03.\"}),f.jsxs(\"table\",{style:f",
    nuevo: "n,onChange:wn,ancho:54}),f.jsxs(\"table\",{style:f",
    veces: 1,
  },
]
