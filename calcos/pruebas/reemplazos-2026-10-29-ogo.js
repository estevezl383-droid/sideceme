// Reemplazos del 2026-10-29 sobre calcos/assets/index-areas-logisticas-20261029.js → index-ogo-20261029.js.
// Sergio, con el Word de la F7·P1 «Orden General de Operaciones» que le bajó la Mesa, la OGO 01-35, la OGO 01/21 del
// CE-I, la Orden de Operaciones 05/24 y el texto del PMTD 2017: «está demasiado incompleta, mal redactada y muy mal
// hecha… la OGO contiene tareas y un montón de información que ya hay en la Mesa». La lógica está en
// orden-operaciones/v1/ogo.mjs; acá:
//   · el import;
//   · la F7·P1 del Tablero del G-3 con las casillas del modelo (y la ayuda de la IA con lo que la Mesa ya tiene);
//   · 📘 la guía; 🌱 (l3e) con lo que trabajó todo el Estado Mayor; el Word (Aoe) con la forma de la Escuela;
//   · lo guardado con las claves de antes se lee con las de ahora (yU, la hoja);
//   · «Mesa EM → Orden General de Operaciones» baja la MISMA orden (la hoja, y lo que falta, de 🌱);
//   · el formato militar con la versión nueva (la autenticación del G-3 dice «G-3»).
//
// SHA-256 de index-areas-logisticas-20261029.js (antes de estos reemplazos): ver construir-ogo.js.
const OP = 'const SIDo=n.ordenSup||{},SIDs=SIDOgoWord(e,{membrete:_ie({...n,hoja:t},SIDo),clasificacion:E2(n,SIDo)},{unidad:qa(n.unidad)||qa(SIDo.unidad),superior:qa(SIDo.escalonSuperior),firma:qa(n.firmaCmte),controlOrden:(a||{}).controlOrden,lt:MS((a||{}).lineaTiempo||{})});return SIDs?(await Mx(SIDs,"F7P1_Orden_General_de_Operaciones",{ctx:n,registro:SIDMilHoja(i,n)}),!0):!1'
module.exports = [
  {
    nombre: 'El import de la Orden General de Operaciones',
    viejo: 'import {HOJA_CMTE as SIDGuiaCmte,',
    nuevo:
      'import {HOJA as SIDOgoHoja,GUIA as SIDOgoGuia,semillaOgo as SIDOgoSemilla,sembrarOgo as SIDOgoSembrar,leerOgo as SIDOgoLeer,wordOgo as SIDOgoWord,ayudaIAConMesa as SIDOgoAyudaIA} from "../orden-operaciones/v1/ogo.mjs?v=ogo20261029";' +
      'import {HOJA_CMTE as SIDGuiaCmte,',
    veces: 1,
  },
  {
    nombre: 'La F7·P1 del G-3: las casillas del modelo de la Escuela (ya no «A.1 Curso de acción más PROBABLE»…), sin el aviso que mandaba a otro documento, y la IA con lo que ya tiene la Mesa',
    viejo:
      '{id:"opord",num:"F7·P1",nom:"Orden General de Operaciones y Anexos",entrega:"Se difunde — la revisa y aprueba el Comandante",responsable:"Todo el EM, coordina el G-3",tipo:"campos",campos:hq().map(t=>t.k),ayudaCampos:Object.fromEntries(hq().map(t=>[t.k,t.ayuda])),grupoCampos:Object.fromEntries(hq().map(t=>[t.k,t.parrafo])),anexos:Ike,autollena:"opord",remite:"opord",nota:"Formato textual del Capítulo VII del PMTD 2017. Los párrafos que la Mesa ya sabe —el CAE del G-2, la organización de la tarea, el plan de barreras, los fuegos— se siembran con el botón 🌱."}',
    nuevo: '{id:"opord",num:"F7·P1",nom:"Orden General de Operaciones y Anexos",...SIDOgoHoja,anexos:Ike,get ayudaIA(){return SIDOgoAyudaIA(SIDGuiaCalco(),{viejo:()=>l3e("SIDopordViejo",SIDGuiaCalco()||{})})}}',
    veces: 1,
  },
  {
    nombre: '📘 La guía de la hoja (la del Tablero del G-3 y la del pedido a la IA)',
    viejo: 'opord:{para:"El producto final del proceso.',
    nuevo: 'opord:SIDOgoGuia,SIDopordGuiaVieja:{para:"El producto final del proceso.',
    veces: 1,
  },
  {
    nombre: '🌱 (l3e) trae lo que ya trabajó todo el Estado Mayor; lo que traía antes (el CAE, los fuegos, el plan de barreras) entra por «SIDopordViejo»',
    viejo: 'case"opord":{const Ne={};Z.carta&&(Ne.CARTA=Z.carta);',
    nuevo:
      'case"opord":{const SIDc=SIDGuiaCalco()||{};return SIDOgoSemilla({...SIDc,...e,unidad:Fe,g3:{...(SIDc.g3||{}),...Se},hojasG:e.hojasG||SIDc.hojasG||{}},{viejo:l3e("SIDopordViejo",e),carta:SIDCapDocs({...SIDc,...e}),lt:MS(Se.lineaTiempo||{})})}case"SIDopordViejo":{const Ne={};Z.carta&&(Ne.CARTA=Z.carta);',
    veces: 1,
  },
  {
    nombre: '📄 El Word (Aoe): la forma de la Escuela, con el cuadro de la organización, la numeración militar, la firma y la distribución',
    viejo: 'const i=VM(t);if(!i)return!1;if(t==="potencia")return SIDEMWordPRC(e);',
    nuevo: `if(t==="opord"){const i=VM(t);if(!i)return!1;${OP}}const i=VM(t);if(!i)return!1;if(t==="potencia")return SIDEMWordPRC(e);`,
    veces: 1,
  },
  {
    nombre: '📄 El Word desde otras rutas (Coe) también va por la forma de la Escuela',
    viejo: 'if(HS.includes(t.id)&&VM(t.id))return Aoe(t.id,e,{...n,pasoDocumento:t.num},a);',
    nuevo: 'if(t.id==="opord"&&VM(t.id))return Aoe(t.id,e,n,a);if(HS.includes(t.id)&&VM(t.id))return Aoe(t.id,e,{...n,pasoDocumento:t.num},a);',
    veces: 1,
  },
  {
    nombre: 'La hoja (yU): lo escrito con las claves de antes, en su casilla nueva',
    viejo: '{var y,g;const v=SIDGuiaLeer(t,e)||e||',
    nuevo: '{var y,g;e=SIDOgoLeer(t,e)||e;const v=SIDGuiaLeer(t,e)||e||',
    veces: 1,
  },
  {
    nombre: 'El Tablero del G-3 guarda la F7·P1 sin las claves de antes (🌱, ✓ Aplicar y la hoja)',
    viejo: 'Ge=(he,at)=>T?.({...M,[he]:at})',
    nuevo: 'Ge=(he,at)=>T?.({...M,[he]:he==="opord"&&SIDOgoLeer({id:he,tipo:"campos"},at)||at})',
    veces: 1,
  },
  {
    nombre: 'Mesa EM → la Orden General de Operaciones (ya no «+ matriz de sincronización»)',
    viejo: '{id:"opord",nom:"Orden de Operaciones + matriz de sincronización",tipo:"orden",estado:"auto"}',
    nuevo: '{id:"opord",nom:"Orden General de Operaciones (F7·P1)",tipo:"orden",estado:"auto"}',
    veces: 1,
  },
  {
    nombre: 'Mesa EM → baja la MISMA OGO que la F7·P1 (la hoja y, en lo vacío, lo que trae 🌱); el borrador de antes sólo si algo falla',
    viejo: 'du=je.useCallback(()=>{var Ee,Qe;try{dNe(',
    nuevo:
      'du=je.useCallback(()=>{var Ee,Qe;try{try{const SIDc=SIDGuiaCalco()||{},SIDg=SIDc.g3||{},SIDn={ops:SIDc.ops||{},fasesCOA:SIDc.fasesCOA||{},picb:SIDc.picb||{},ordenSup:Tn||SIDc.ordenSup||{},orgTarea:SIDc.orgTarea||[],unidad:Tn?.unidad||"",ejercicio:wn,cmoc:Jt,SIDdn:dn,seccion:"EMO/SEC-III"},SIDv=SIDOgoSembrar(SIDg.opord,l3e("opord",{...SIDn,unidades:dn,g3:SIDg})).valor;Aoe("opord",SIDv,SIDn,SIDg).then(SIDok=>SIDok?za("📄 Orden General de Operaciones (F7·P1) generada con el formato de la Escuela (.docx)"):he("La Orden General de Operaciones todavía no tiene nada para bajar: trabajala en G-3 → F7·P1.")).catch(SIDx=>he("No se pudo generar la OGO: "+(SIDx?.message||SIDx)));return}catch(SIDx){console.warn("OGO F7·P1:",SIDx)}dNe(',
    veces: 1,
  },
  {
    nombre: 'El formato militar con la versión nueva (el autenticador de la OGO: «G-3»)',
    viejo: 'formato-militar/v1/runtime.js?v=guiainicial20261027',
    nuevo: 'formato-militar/v1/runtime.js?v=ogo20261029',
    veces: 1,
  },
]
