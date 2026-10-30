// 📜 La F7·P1 ORDEN GENERAL DE OPERACIONES del G-3 con la forma del TEXTO PMTD 2017 (Capítulo VII) y con todo lo que
// trabajó el Estado Mayor (calcos/orden-operaciones/v1/ogo.mjs, motor estado-mayor/v8 con campos/g3.js).
// Sobre index-guardar-ia-20261029.js → index-ogo-20261030.js (construir-ogo.js). Cada «viejo» aparece exactamente
// `veces` veces; deshaciendo en orden inverso se vuelve byte por byte (reemplazos-compilado.js).
module.exports = [
  {
    // los dos ganchos nuevos (la vista y la Orden del G-3) los reexporta el editor del registro: el compilado sigue
    // importando el motor 3 veces y la lista de imports del registro no se toca
    nombre: 'El motor del Estado Mayor pasa a la v8 (el editor, con la vista y la Orden del G-3)',
    viejo: 'import SIDEditorEM,{AyudaHoja as SIDEMAyuda} from "../estado-mayor/v7/editor.js";',
    nuevo: 'import SIDEditorEM,{AyudaHoja as SIDEMAyuda,htmlDocumento as SIDEMHtml,especificacionOrden as SIDEMOrden} from "../estado-mayor/v8/editor.js";',
    veces: 1,
  },
  {
    nombre: 'El motor del Estado Mayor pasa a la v8 (el puente con el calco)',
    viejo: 'calcoActual as SIDGuiaCalco} from "../estado-mayor/v7/runtime.js";',
    nuevo: 'calcoActual as SIDGuiaCalco} from "../estado-mayor/v8/runtime.js";',
    veces: 1,
  },
  {
    nombre: 'El motor del Estado Mayor pasa a la v8 (el registro)',
    viejo: 'SIDEMSinMarca} from "../estado-mayor/v7/registro.js?v=20261029-guardar-ia";',
    nuevo: 'SIDEMSinMarca} from "../estado-mayor/v8/registro.js?v=20261030-ogo";',
    veces: 1,
  },
  {
    nombre: 'El formato militar con el autenticador del documento («G-3»)',
    viejo: 'from "../formato-militar/v1/runtime.js?v=guiainicial20261027";',
    nuevo: 'from "../formato-militar/v1/runtime.js?v=ogo20261030";',
    veces: 1,
  },
  {
    // fase por fase (fasesConDocumentos hace lo mismo con la lista entera): el catálogo sigue empezando «ev=[{id:1,…»
    nombre: 'Las hojas del G-3 pasan por el motor: la F7·P1 es un documento (el resto, igual)',
    viejo: '}]}],SD=ev.reduce((t,e)=>t+e.hojas.length,0)',
    nuevo: '}]}].map(SIDf=>SIDEMFases({id:"g3"},[SIDf])[0]),SD=ev.reduce((t,e)=>t+e.hojas.length,0)',
    veces: 1,
  },
  {
    // antes de contar: el documento sin nada escrito (o sólo con las cuentas del 🌱 viejo) cuenta como vacío
    nombre: 'El avance del G-3 cuenta el documento por lo que tiene escrito',
    viejo: 'function CD(t={}){const e=a=>a==null?!1:',
    nuevo: 'function CD(t={}){t={...t,...Object.fromEntries(ev.flatMap(SIDf=>SIDf.hojas).filter(SIDEMEs).map(SIDh=>[SIDh.id,SIDEMTiene(SIDh,t[SIDh.id])?t[SIDh.id]:null]))};const e=a=>a==null?!1:',
    veces: 1,
  },
  {
    nombre: 'La carpeta del G-3 muestra la Orden con su forma',
    viejo: 'if(t.tipo==="reconocimiento")return SIDRecoHTML(e,{ctx:n});const a=e||{},i=r=>',
    nuevo: 'if(t.tipo==="reconocimiento")return SIDRecoHTML(e,{ctx:n});if(SIDEMEs(t))return SIDEMHtml(t,e,n)||\'<span class="vacio">—</span>\';const a=e||{},i=r=>',
    veces: 1,
  },
  {
    nombre: 'El Tablero del G-3 abre la F7·P1 en el editor de documentos del motor',
    viejo: 'if(Ke){const he=ese(Ke.id),SIDctxG3=',
    nuevo:
      'if(Ke&&SIDEMEs(Ke)){const SIDcx={unidades:I.SIDdn||t,ordenSup:I.ordenSup||{},unidad:I.unidad||"",picb:I.picb||{},ops:I.ops||{},cmoc:I.cmoc||{},fasesCOA:I.fasesCOA||{},g3:M,faseActiva:I.faseActiva||null};return f.jsxs("div",{style:At.panel,children:[f.jsxs("div",{style:At.cab,children:[f.jsx("button",{style:At.volver,onClick:()=>se(null),children:"← Volver a mis documentos"}),f.jsx("button",{style:At.btnX,onClick:B,children:"✕"})]}),f.jsxs("div",{style:At.tituloHoja,children:[f.jsx("span",{style:At.num,children:Ke.num})," ",Ke.nom]}),Ke.entrega&&f.jsxs("div",{style:At.entrega,children:["📤 ",Ke.entrega]}),Ke.nota&&f.jsx("div",{style:At.nota,children:Ke.nota}),f.jsx(SIDEditorEM,{campo:"g3",hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),hojas:M,onExpediente:j,ctxDoc:{...I,...ne,seccion:"EMO/SEC-III",SIDcarta:()=>SIDCapDocs(SIDcx)}},Ke.id)]})}if(Ke){const he=ese(Ke.id),SIDctxG3=',
    veces: 1,
  },
  {
    nombre: '«Mesa EM → Orden de Operaciones» y «OPORD» del 🎬 C.A. por fases bajan la Orden de la F7·P1 (antes, un esqueleto), con los lugares de la carta',
    viejo: 'du=je.useCallback(()=>{var Ee,Qe;try{dNe({',
    nuevo:
      'du=je.useCallback(async()=>{var Ee,Qe;try{const SIDcx={ejercicio:wn||"Ejercicio",unidadSuperior:Tn?.escalonSuperior||"",unidad:Tn?.unidad||"",ordenSup:Tn||{},autor:zo,seccion:"EMO/SEC-III"},SIDs=SIDEMOrden(Ya?.opord,{...SIDcx,SIDcarta:()=>SIDCapDocs({unidades:dn,ops:Lt||{},cmoc:Jt||{}})});if(SIDs){await Mx(SIDs,"F7P1_Orden_General_de_Operaciones",{ctx:SIDcx,registro:SIDMilHoja({id:"opord",num:"F7·P1"},{...SIDcx,g:"g3"})});za("📄 Orden General de Operaciones (la F7·P1 del G-3, con la forma del PMTD 2017)");return}dNe({',
    veces: 1,
  },
  {
    nombre: 'La Orden del G-3 al día (dependencias de du)',
    viejo: 'za("📄 Orden General de Operaciones generada (.docx)")}catch(ot){he("No se pudo generar el OPORD: "+ot.message)}},[wn,Tn,Ae,Jt,Yn,dn])',
    nuevo: 'za("📄 Orden General de Operaciones generada (.docx)")}catch(ot){he("No se pudo generar el OPORD: "+ot.message)}},[wn,Tn,Ae,Jt,Yn,dn,Ya,zo,Lt])',
    veces: 1,
  },
  {
    nombre: 'La consulta «Orden de operaciones (OPORD)» de la IA de la Mesa con los párrafos del PMTD 2017',
    viejo:
      'instruccion:`Redactá la ORDEN GENERAL DE OPERACIONES (OPORD) de la unidad, con el formato de CINCO PÁRRAFOS del TEXTO PMTD 2017:\n\nI.- SITUACIÓN (fuerzas enemigas · fuerzas amigas · agregaciones y segregaciones)\nII.- MISIÓN (quién, qué, cuándo, dónde y para qué — una sola oración)\nIII.- EJECUCIÓN (intención del Comandante · concepto de la operación · tareas a las unidades subordinadas · instrucciones de coordinación)\nIV.- APOYO DE SERVICIO DE COMBATE\nV.- COMANDO Y TRANSMISIONES\n\nEscribila con lo que hay en el calco:',
    nuevo:
      'instruccion:`Redactá la ORDEN GENERAL DE OPERACIONES de la unidad, completa, con la forma del TEXTO PMTD 2017 (Parte Primera, Capítulo VII):\n\nOBJETO, CARTAS, ANEXOS · ORGANIZACIÓN DE LA TAREA\nI.- SITUACIÓN (A.- Fuerzas enemigas, con 1.- el curso de acción más probable y 2.- el más peligroso del G-2 · B.- Fuerzas propias: misión, intención y concepto de dos escalones arriba y las unidades adyacentes · C.- Refuerzos y reducciones)\nII.- MISIÓN (quién, qué, cuándo, dónde y para qué — una sola oración)\nIII.- EJECUCIÓN (la Intención del Comandante · A.- Concepto de la operación: 1.- Maniobra FASE POR FASE con la tarea y el propósito de cada unidad, 2.- Apoyo de fuegos, 3.- Reconocimiento y vigilancia, 4.- Inteligencia, 5.- Ingenieros, 6.- Defensa antiaérea, 7.- QBN, 8.- Policía Militar, 9.- AC/GM · B.- Tareas de las unidades de maniobra · C.- Tareas de las unidades de apoyo de combate · D.- Instrucciones de coordinación, con los RCIC)\nIV.- APOYO DE SERVICIO\nV.- COMANDO Y COMUNICACIONES\n\n(La Orden que firma el Comandante se trabaja en ⚔️ G-3 → 📄 Documentos → F7·P1: ahí la Mesa la arma con todo lo del Estado Mayor y la baja en Word con el formato militar.)\n\nEscribila con lo que hay en el calco:',
    veces: 1,
  },
]
