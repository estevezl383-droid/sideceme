// Reemplazos del 2026-10-24 sobre calcos/assets/index-editar-tareas-20261023.js → index-puntos-decision-20261024.js.
// Lo pidió Sergio con la F4·P4 «Eventos críticos y puntos de decisión»: «🌱 Traer del calco lo que falte» le decía
// «Todavía no hay nada en el calco para sembrar esta hoja» con la carta llena (la hoja se sembraba SÓLO con las fases
// del C.A. propio, y él tiene cargadas las del enemigo); después la llenó con la IA y pidió: «me gustaría que lo
// pongas en la maqueta para identificar… no quiero que pongas más texto». Ahora:
//   · los P.D. de la hoja van a la carta como una ⭐ con su número al lado de su A.I.N. (calcos/puntos-decision/v1);
//     tocándola se ve lo escrito; se arrastra a donde se decide («↺ Volver junto a su A.I.N.» la devuelve); se esconden con «Ver A.I.N.»;
//   · 🌱 siembra además un renglón por cada A.I.N. de la carta que todavía no tiene su P.D. (con su ventana y su
//     indicador), numerado después de los que ya hay; la 🤖 IA recibe lo mismo como semilla;
//   · si igual no hay nada, el aviso de esta hoja dice qué le falta (no el aviso general de las unidades).
//
// SHA-256 de index-editar-tareas-20261023.js (antes de estos reemplazos): 8eefa352f3fb3b32ff6cc6ed328f7b50b427953dc78885786a49465960a0143b
module.exports = [
  {
    nombre: 'Importa los puntos de decisión en la carta',
    viejo: 'import {sincronizarCarta as SIDCOSync} from "../concepto-operacion/v1/carta.js";',
    nuevo: 'import {sincronizarCarta as SIDCOSync} from "../concepto-operacion/v1/carta.js";import {sincronizarCarta as SIDPDSync} from "../puntos-decision/v1/carta.js?v=pd20261024";',
    veces: 1,
  },
  {
    nombre: 'La carta recibe la F4·P4, las A.I.N. y si se ven (sólo se arrastran donde se puede editar)',
    viejo: 'je.useEffect(()=>{SIDCOSync({',
    nuevo: 'je.useEffect(()=>{SIDPDSync({ops:Lt,g3:Ya,ver:ai.ains!==!1,setG3:ll||Bn?null:ns})},[Lt,Ya,ai.ains,ll,Bn]);je.useEffect(()=>{SIDCOSync({',
    veces: 1,
  },
  {
    nombre: 'F4·P4: 🌱 siembra también las A.I.N. que todavía no tienen su P.D.',
    viejo:
      'case"eventos":{const Ne=(X.propio||[]).length;return Ne?Array.from({length:Ne},(Ve,lt)=>({"N° P.D.":String(lt+1),"Evento crítico":`Transición a la fase ${lt+2<=Ne?lt+2:lt+1} del COA propio`,"No antes de":"","No después de":"","Criterio que activa la decisión":"","Decisión que se toma":"","A.I.N. asociada":""})):[]}',
    nuevo:
      'case"eventos":{const Ne=(X.propio||[]).length,SIDf=Ne?Array.from({length:Ne},(Ve,lt)=>({"N° P.D.":String(lt+1),"Evento crítico":`Transición a la fase ${lt+2<=Ne?lt+2:lt+1} del COA propio`,"No antes de":"","No después de":"","Criterio que activa la decisión":"","Decisión que se toma":"","A.I.N. asociada":""})):[],' +
      'SIDev=Array.isArray(Se.eventos)?Se.eventos:[],SIDnA=x=>[...String(x??"").matchAll(/A\\.?\\s*I\\.?\\s*N\\.?\\s*[-–N°º]*\\s*(\\d+)/gi)].map(m=>Number(m[1])),' +
      'SIDya=new Set(SIDev.flatMap(f=>SIDnA(f?.["A.I.N. asociada"])));' +
      'let SIDk=Math.max(Ne,...SIDev.map(f=>Number((String(f?.["N° P.D."]??"").match(/\\d+/)||[])[0])||0));' +
      'for(const a of re.ains||[]){const nom=a?.nom||(a?.n!=null?`AIN-${a.n}`:""),num=a?.n!=null?Number(a.n):SIDnA(nom)[0];if(!nom||num==null||SIDya.has(num))continue;SIDya.add(num);' +
      'SIDf.push({"N° P.D.":String(++SIDk),"Evento crítico":String(a.porQue||"").trim()||`Lo que se vigila en la ${nom}`,"No antes de":a.noAntes||"","No después de":a.noDespues||"","Criterio que activa la decisión":a.indicador||"","Decisión que se toma":"","A.I.N. asociada":nom})}' +
      'return SIDf}',
    veces: 1,
  },
  {
    nombre: 'F4·P4: el aviso dice de dónde se siembra esta hoja',
    viejo: 'window.alert(`Todavía no hay nada en el calco para sembrar esta hoja.',
    nuevo:
      'window.alert(he.id==="eventos"?`Esta hoja se siembra con las fases del C.A. PROPIO (🎬 C.A. por fases → 🔵) y con las A.I.N. de la carta que todavía no tienen su punto de decisión. No hay fases propias cargadas y no queda ninguna A.I.N. sin su P.D.\\n\\nLos P.D. que ya están en la hoja se ven en la carta: ⭐ con su número, al lado de su A.I.N.`:`Todavía no hay nada en el calco para sembrar esta hoja.',
    veces: 1,
  },
]
