// Reemplazos hechos el 2026-10-06 sobre el compilado de la Mesa del EM
// (calcos/assets/index-tablero-g4-20261003.js → index-prc-20261006.js).
// Lo pidió Sergio con una captura de la F3·P1 «Potencia relativa de combate» del G-3
// («Completar y mejorar», con la indicación de las fases: ocupación de la defensa,
// desorganización, canalización, canalización y destrucción): la IA contestó con una Orden
// General de Operaciones y una matriz de sincronización, cerró con «¿Desea que
// profundicemos…?», y al pegar ese final la Mesa dijo «No se reconoció la respuesta». Mandó
// el modelo de la Escuela (H.T. POTENCIA RELATIVA DE COMBATE, .docx), un ejemplo llenado y el
// texto doctrinario (Pasos 1, 2 y 3). Pasaba:
//   · la hoja no era la de la Escuela: «Sistema operativo / PROPIAS / ENEMIGO / Relación y
//     deducción» con ocho sistemas operativos, sin TTP y sin el método;
//   · el pedido no traía la doctrina de la PRC, pedía casillas «MANIOBRA|ENEMIGO», terminaba
//     con «BUSCÁ EN LA WEB» y en el G-3 no llevaba «FORMATO DE TU RESPUESTA» al final: la
//     indicación del oficial (las fases) quedaba como lo único concreto;
//   · la Mesa no sabía leer una hoja «tabla» escrita como tabla, y el Word de la hoja salía
//     como renglones de texto, no como el cuadro del .docx;
//   · el error no decía que lo pegado era sólo la pregunta final de la IA.
// Todo lo nuevo está en calcos/estado-mayor/v5 (prc.js, lector.js, registro.js).
//
// Ninguna inserción cae dentro de lo que insertaron las listas anteriores (salvo los
// `import` del motor, como en las vueltas anteriores).
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer
// «veces» veces) y se cambió por «nuevo». construir-prc.js arma el compilado y comprueba que
// deshaciéndolos se vuelve byte por byte al anterior.
module.exports = [
  {
    nombre: "PRC · el motor de documentos pasa a calcos/estado-mayor/v5 (y presta el pedido del G-3, el lector de tablas, la migración, el aviso del error y el Word de la PRC)",
    viejo:
      "import SIDEditorEM,{AyudaHoja as SIDEMAyuda} from \"../estado-mayor/v4/editor.js\";import {configurarEM,sincronizarEM as SIDEMSync,sincronizarExtraEM as SIDEMExtra} from \"../estado-mayor/v4/runtime.js\";import {fasesConDocumentos as SIDEMFases,esDocumento as SIDEMEs,tieneDocumento as SIDEMTiene,textoDocumento as SIDEMTexto,guiaIA as SIDEMGuia,pedidoHoja as SIDEMPedido,rescatarHoja as SIDEMRescatar,cierreIndicacion as SIDEMIndicacion,filasDeRespuesta as SIDEMFilasDe,celdaFila as SIDEMCelda,listasDe as SIDEMListas,claveCasilla as SIDEMClave} from \"../estado-mayor/v4/registro.js\";",
    nuevo:
      "import SIDEditorEM,{AyudaHoja as SIDEMAyuda} from \"../estado-mayor/v5/editor.js\";import {configurarEM,sincronizarEM as SIDEMSync,sincronizarExtraEM as SIDEMExtra} from \"../estado-mayor/v5/runtime.js\";import {fasesConDocumentos as SIDEMFases,esDocumento as SIDEMEs,tieneDocumento as SIDEMTiene,textoDocumento as SIDEMTexto,guiaIA as SIDEMGuia,pedidoHoja as SIDEMPedido,rescatarHoja as SIDEMRescatar,cierreIndicacion as SIDEMIndicacion,filasDeRespuesta as SIDEMFilasDe,celdaFila as SIDEMCelda,listasDe as SIDEMListas,claveCasilla as SIDEMClave,pedidoG3 as SIDEMPedidoG3,tablaDeRespuesta as SIDEMTabla,migrarG3 as SIDEMMigrarG3,errorRespuesta as SIDEMError,wordPRC as SIDEMWordPRC} from \"../estado-mayor/v5/registro.js\";",
    veces: 1,
  },
  {
    nombre: "PRC · la hoja F3·P1 del G-3 con la forma de la Escuela: 5 columnas (Potencia de combate | Fuerzas enemigas | Fuerzas propias | Deducciones | TTP) × 5 filas",
    viejo:
      "{id:\"potencia\",num:\"F3·P1\",nom:\"Potencia relativa de combate\",entrega:\"Trabajo de todo el EM\",responsable:\"G-1 a G-5 y EME.\",tipo:\"tabla\",cols:[\"Sistema operativo\",\"PROPIAS\",\"ENEMIGO\",\"Relación y deducción\"],filas:[\"MANIOBRA\",\"APOYO DE FUEGOS\",\"DEFENSA ANTIAÉREA\",\"MOVILIDAD / CONTRAMOVILIDAD / SUPERVIVENCIA\",\"INTELIGENCIA\",\"APOYO DE SERVICIO DE COMBATE\",\"COMANDO Y CONTROL\",\"FACTORES INTANGIBLES (moral, adiestramiento, liderazgo)\"],autollena:\"potencia\",nota:\"La Mesa calcula sola la relación de fuerzas con las fichas del calco y la trae acá; lo intangible lo pone el oficial.\"}",
    nuevo:
      "{id:\"potencia\",num:\"F3·P1\",nom:\"Potencia relativa de combate\",entrega:\"Trabajo de todo el EM\",responsable:\"G-1 a G-5 y EME.\",tipo:\"tabla\",cols:[\"Potencia de combate\",\"Fuerzas enemigas\",\"Fuerzas propias\",\"Deducciones\",\"Tácticas, técnicas y procedimientos (TTP.)\"],filas:[\"MANIOBRA\",\"POTENCIA DE FUEGO\",\"PROTECCIÓN\",\"LIDERAZGO\",\"INFORMACIÓN E INTELIGENCIA\"],autollena:\"potencia\",nota:\"Es la H.T. de la Escuela: por cada elemento de la potencia de combate, los puntos fuertes (+) y débiles (-) del enemigo y los propios, lo que se deduce de compararlos y las TTP que salen de ahí (Pasos 1, 2 y 3). 🌱 trae del calco lo que la Mesa sabe contar; el juicio lo pone el EM.\"}",
    veces: 1,
  },
  {
    nombre: "PRC · la guía «📘 ¿Para qué es y cómo se llena?» con los Pasos 1, 2 y 3",
    viejo:
      "potencia:{para:\"Compara sistema por sistema, no sólo cabezas. Dos batallones contra dos batallones no es paridad si uno tiene artillería y el otro no.\",como:[\"Una fila por sistema operativo del campo de batalla.\",\"La Mesa cuenta las fichas del calco y calcula la relación numérica: eso te lo da hecho.\",\"Lo que tenés que poner vos es la DEDUCCIÓN: qué te habilita o qué te prohíbe esa relación.\",\"Los factores intangibles —moral, adiestramiento, liderazgo— no se calculan pero se anotan.\"],ejemplo:\"Doctrina de referencia: ~3:1 para atacar; en la defensa se aguanta hasta ~1:3. Y el cuadro del EAA-15-25 te dice cuánto avanzás por hora con cada relación.\"}",
    nuevo:
      "potencia:{para:\"Mide el potencial de combate RELATIVO, no el absoluto: oponés nuestros puntos fuertes a los puntos débiles del enemigo y cuidás nuestros puntos débiles de sus puntos fuertes. Así una unidad puede ganarle a una fuerza numéricamente superior. Las deducciones y las TTP que salen acá son la base para desarrollar los cursos de acción.\",como:[\"Paso 1 — FUERZAS ENEMIGAS y FUERZAS PROPIAS: por cada elemento de la potencia de combate (maniobra, potencia de fuego, protección, liderazgo, información e inteligencia), los puntos FUERTES con «+» y los DÉBILES con «-», uno por renglón.\",\"Paso 2 — DEDUCCIONES: lo que sale de comparar los puntos fuertes y débiles de los dos bandos en esa fila: qué necesitamos lograr para tener éxito y cuál es nuestra vulnerabilidad.\",\"Paso 3 — TTP: las tácticas, técnicas y procedimientos que oponen nuestros puntos fuertes a los débiles del enemigo y reducen nuestras vulnerabilidades (concretas, con el medio y el lugar).\",\"🌱 trae del calco lo que la Mesa sabe contar (unidades de cada bando, relación de fuerzas, fuegos y alcances, plan de barreras, reconocimiento); la IA lo convierte en puntos fuertes y débiles.\",\"Si la operación tiene fases, la hoja es una sola: en Deducciones y TTP empezá el renglón con la fase («Fase de canalización: …»).\"],ejemplo:\"Maniobra — Enemigo: «+Velocidad en la carretera. -Utilizan principalmente las carreteras.» · Propias: «+Movilidad en todo tipo de terreno. -No pueden reubicarse rápidamente.» · Deducción: «Obligar al enemigo a desmontarse para igualar el combate.» · TTP: «Emboscada antitanque. Canalizar al enemigo.»\"}",
    veces: 1,
  },
  {
    nombre: "PRC · 🌱 trae del calco lo que la Mesa sabe contar, en las filas y columnas nuevas",
    viejo:
      "case\"potencia\":{const Ne=Xy(K),Ve={};if(Ne.ratio){const it=hoe(Ne.ratio);Ve.MANIOBRA=`${Ne.nPropias} unidad(es) propias contra ${Ne.nEnemigo} enemigas.`,Ve[\"MANIOBRA|Relación y deducción\"]=[`Relación ${Ne.texto}. ${Ne.recomendacion}`,it.diurno?`Promedio de avance con relación ${it.rel}: ${it.diurno} m/h de día y ${it.nocturno} m/h de noche (EAA-15-25).`:\"\"].filter(Boolean).join(\" \"),Ve[\"MANIOBRA|PROPIAS\"]=String(Ne.nPropias),Ve[\"MANIOBRA|ENEMIGO\"]=String(Ne.nEnemigo)}const lt=Ae.filter(Dm),Te=Ie.filter(Dm);if(lt.length||Te.length){Ve[\"APOYO DE FUEGOS\"]=`${lt.length} unidad(es) propias de apoyo de fuegos contra ${Te.length} enemigas.`;const it=He=>Math.max(0,...He.map(nt=>{var Me,Ge;return((Ge=(Me=eh(nt))==null?void 0:Me.fuegos)==null?void 0:Ge.m)||0}));Ve[\"APOYO DE FUEGOS|Relación y deducción\"]=`Mayor alcance propio: ${Xc(it(lt))} · mayor alcance enemigo: ${Xc(it(Te))}.`}const ge=Ae.filter(it=>it.arma===\"ingenieria\");if(_e.length){const it=b0(_e,Re);Ve[\"MOVILIDAD / CONTRAMOVILIDAD / SUPERVIVENCIA\"]=`Plan de barreras trazado: ${it.filas.length} trabajo(s), ${it.horas} h con los medios asignados.`,Ve[\"MOVILIDAD / CONTRAMOVILIDAD / SUPERVIVENCIA|Relación y deducción\"]=`Al enemigo debería costarle unas ${CS(it.horas)} h abrirse paso (regla del buen obstáculo).${ge.length?` Unidades de ingeniería en el calco: ${ge.length}.`:\"\"}`}return Ve}",
    nuevo:
      "case\"potencia\":{const Ne=Xy(K),Ve={},SIDn=it=>it.slice(0,8).map(js).join(\", \")+(it.length>8?` y ${it.length-8} más`:\"\");Ie.length&&(Ve.MANIOBRA=`Unidades enemigas en el calco: ${Ie.length} (${SIDn(Ie)}).`);Ae.length&&(Ve[\"MANIOBRA|Fuerzas propias\"]=`Unidades propias en el calco: ${Ae.length} (${SIDn(Ae)}).`);if(Ne.ratio){const it=hoe(Ne.ratio);Ve[\"MANIOBRA|Deducciones\"]=[`Relación de fuerzas con las fichas del calco: ${Ne.texto}. ${Ne.recomendacion}`,it.diurno?`Promedio de avance con relación ${it.rel}: ${it.diurno} m/h de día y ${it.nocturno} m/h de noche (EAA-15-25).`:\"\"].filter(Boolean).join(\" \")}const lt=Ae.filter(Dm),Te=Ie.filter(Dm),SIDa=He=>Math.max(0,...He.map(nt=>{var Me,Ge;return((Ge=(Me=eh(nt))==null?void 0:Me.fuegos)==null?void 0:Ge.m)||0}));Te.length&&(Ve[\"POTENCIA DE FUEGO\"]=`Apoyo de fuegos en el calco: ${Te.length} unidad(es) (${SIDn(Te)}); mayor alcance ${Xc(SIDa(Te))}.`);lt.length&&(Ve[\"POTENCIA DE FUEGO|Fuerzas propias\"]=`Apoyo de fuegos en el calco: ${lt.length} unidad(es) (${SIDn(lt)}); mayor alcance ${Xc(SIDa(lt))}.`);if(lt.length&&Te.length){const He=SIDa(lt),nt=SIDa(Te);He&&nt&&He!==nt&&(Ve[\"POTENCIA DE FUEGO|Deducciones\"]=He>nt?`Nuestro mayor alcance (${Xc(He)}) supera al del enemigo (${Xc(nt)}): podemos batirlo antes de que nos alcance.`:`El enemigo nos supera en alcance (${Xc(nt)} contra ${Xc(He)}): hay que protegerse de sus fuegos y acercar los nuestros.`)}const ge=Ae.filter(it=>it.arma===\"ingenieria\");if(_e.length){const it=b0(_e,Re);Ve[\"PROTECCIÓN|Fuerzas propias\"]=`Plan de barreras trazado: ${it.filas.length} trabajo(s), ${it.horas} h con los medios asignados.${ge.length?` Unidades de ingeniería en el calco: ${ge.length}.`:\"\"}`,Ve[\"PROTECCIÓN|Deducciones\"]=`Al enemigo debería costarle unas ${CS(it.horas)} h abrirse paso (regla del buen obstáculo).`}const SIDr=Ae.filter(Lm),SIDe=Ie.filter(Lm);SIDr.length&&(Ve[\"INFORMACIÓN E INTELIGENCIA|Fuerzas propias\"]=`Unidades de reconocimiento en el calco: ${SIDr.length} (${SIDn(SIDr)}).`);SIDe.length&&(Ve[\"INFORMACIÓN E INTELIGENCIA\"]=`Unidades de reconocimiento en el calco: ${SIDe.length} (${SIDn(SIDe)}).`);return Ve}",
    veces: 1,
  },
  {
    nombre: "PRC · el pedido de las hojas del G-3 pasa por SIDEMPedidoG3 (la PRC con su pedido; las demás con «FORMATO DE TU RESPUESTA» al final)",
    viejo:
      "onPedido:async at=>{const qe=await j?.();return cU(Ke,M[Ke.id],{expediente:qe?.md||\"\",ayuda:ese(Ke.id),modo:at,seccion:\"EM. Sec. G-3 (Operaciones)\"})}",
    nuevo:
      "onPedido:async at=>{const qe=await j?.();return SIDEMPedidoG3(Ke,M[Ke.id],cU(Ke,M[Ke.id],{expediente:qe?.md||\"\",ayuda:ese(Ke.id),modo:at,seccion:\"EM. Sec. G-3 (Operaciones)\"}),{expediente:qe?.md||\"\",modo:at,semilla:()=>l3e(Ke.autollena||Ke.id,{...I,unidades:t,medidos:g,opcIng:ge,g3:M}),g2:Me})}",
    veces: 1,
  },
  {
    nombre: "PRC · dU: el JSON de una hoja «tabla» se lee por fila y por columna, venga como venga",
    viejo:
      ",{forma:x}=v,E=G=>String(G??\"\").trim();if(x===\"pbi\"){",
    nuevo:
      ",{forma:x}=v,E=G=>String(G??\"\").trim();g=SIDEMTabla(g,e);if(x===\"pbi\"){",
    veces: 1,
  },
  {
    nombre: "PRC · ✓ Aplicar: si lo pegado es sólo el final de la respuesta («¿Desea que…?»), el error lo dice (todas las hojas)",
    viejo:
      "S({tipo:\"err\",txt:pe?.error||\"No se pudo usar esa respuesta.\"})",
    nuevo:
      "S({tipo:\"err\",txt:SIDEMError(pe?.error||\"No se pudo usar esa respuesta.\",v)})",
    veces: 1,
  },
  {
    nombre: "PRC · «📄 Word (hoja de trabajo)» de la PRC: el .docx de la Escuela (apaisado, el cuadro)",
    viejo:
      "const i=VM(t);if(!i)return!1;if(HS.includes(t)){",
    nuevo:
      "const i=VM(t);if(!i)return!1;if(t===\"potencia\")return SIDEMWordPRC(e);if(HS.includes(t)){",
    veces: 1,
  },
  {
    nombre: "PRC · lo escrito con la forma vieja (8 sistemas operativos) pasa a la de la Escuela al abrir el panel del G-3",
    viejo:
      "g3:M={},onG3:T,ctx:I={},onExpediente:j,onCerrar:B,aporte:U=null,onAbrirDefensa:G,onAbrirUnidades:te}){const[H,q]=je.useState(\"unidades\")",
    nuevo:
      "g3:SIDM0={},onG3:T,ctx:I={},onExpediente:j,onCerrar:B,aporte:U=null,onAbrirDefensa:G,onAbrirUnidades:te}){const M=SIDEMMigrarG3(SIDM0);const[H,q]=je.useState(\"unidades\")",
    veces: 1,
  },
  {
    nombre: "PRC · las hojas «tabla»: el nombre de la columna arriba de cada casillero (el primero no tenía ni el placeholder: «Fuerzas enemigas» quedaba sin nombre)",
    viejo:
      "return f.jsxs(\"label\",{style:Wt.lbl,children:[I,f.jsx(\"textarea\",{style:Wt.area,rows:2,value:typeof B==\"string\"?B:B?.[t.cols[1]]||\"\",onChange:U=>o({...v,[j]:U.target.value})}),t.cols.length>2&&t.cols.slice(2).map(U=>f.jsx(\"textarea\",{style:Wt.area,rows:2,placeholder:U,value:v[`${j}|${U}`]||\"\",onChange:G=>o({...v,[`${j}|${U}`]:G.target.value})},U))]},j)",
    nuevo:
      "return f.jsxs(\"label\",{style:Wt.lbl,children:[I,t.cols.length>2&&f.jsx(\"div\",{style:{fontSize:11,fontWeight:400,opacity:.75,margin:\"4px 0 1px\"},children:t.cols[1]}),f.jsx(\"textarea\",{style:Wt.area,rows:2,placeholder:t.cols[1],value:typeof B==\"string\"?B:B?.[t.cols[1]]||\"\",onChange:U=>o({...v,[j]:U.target.value})}),t.cols.length>2&&t.cols.slice(2).map(U=>f.jsxs(\"div\",{children:[f.jsx(\"div\",{style:{fontSize:11,fontWeight:400,opacity:.75,margin:\"4px 0 1px\"},children:U}),f.jsx(\"textarea\",{style:Wt.area,rows:2,placeholder:U,value:v[`${j}|${U}`]||\"\",onChange:G=>o({...v,[`${j}|${U}`]:G.target.value})})]},U))]},j)",
    veces: 1,
  },
  {
    nombre: "PRC · «🔎 Lo que entregó el G-2» también en la PRC (el enemigo con el que se compara)",
    viejo:
      "Me.hay&&[\"prep1\",\"prep2\",\"prep3\",\"concepto\",\"coa\",\"eventos\",\"lbl\",\"sincro\"].includes(Ke.id)",
    nuevo:
      "Me.hay&&[\"prep1\",\"prep2\",\"prep3\",\"concepto\",\"coa\",\"eventos\",\"lbl\",\"sincro\",\"potencia\"].includes(Ke.id)",
    veces: 1,
  },
]
