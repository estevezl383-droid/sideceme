// ============================================================
// reemplazos-2026-11-17-acostar.js
//
// EL PROBLEMA (17-11-2026, noche). Sergio: «los alumnos eligen la plantilla
// doctrinal del enemigo y cuando tienen que acostarla no funciona, igual los
// objetivos […] aprietan y NO PASA NADA».
//
// ✅ Comprobado en el compilado publicado (`index-motorizadas-20261111.js`):
//
//   1. EL BOTÓN «🗺️ Acostar … sobre el calco» ESTABA APAGADO SIN AVENIDAS
//      (`disabled:!re||!a.length`). El CMOC ya no traza avenidas solo («las
//      AVENIDAS las trazás vos con ➤ Avenida») y los archivos que reciben los
//      alumnos (Selección con calcos) no traen ninguna: botón apagado y mudo.
//      Y como objetivos, maniobra y CAE cuelgan de la plantilla, todo el paso 4
//      quedaba trabado ahí.
//   2. EL AVISO ROJO NO SE VEÍA. Todo lo que la Mesa contesta con `he(…)`
//      («falta el A.O.», «🔒 es de la BASE», «ejercicio finalizado», etc.) se
//      pintaba SÓLO dentro del panel izquierdo de control. Con el tablero del
//      PICB o del G-3 abierto, el alumno apretaba y no veía nada.
//   3. EL AVISO VERDE DURABA 2,8 s, aunque trajera cuatro renglones (los de
//      los CAP propios y los fuegos son largos): no se alcanzaba a leer.
//   4. EL CANDADO DE LA BASE FRENABA AL G-2 EN SU PROPIO TRABAJO: objetivos,
//      maniobra, A.I.N. y CAE del enemigo son del G-2, no de la BASE del G-3.
//
// LO QUE HACE ESTA ENTREGA
//   1. La plantilla se acuesta AUNQUE NO HAYA AVENIDAS: con el frente del A.O.
//      (o el de «🧭 ¿De dónde viene el enemigo?», o —si no hay ninguno— el
//      primer lado del A.O.) se arma sobre ejes doctrinales, y lo dice en sus
//      avisos. Con avenidas trazadas, todo sigue EXACTAMENTE como antes.
//   2. El aviso rojo sale ARRIBA DE LA CARTA, a la vista desde cualquier
//      tablero; se cierra tocándolo.
//   3. El aviso verde dura según su largo (de 4 a 20 s).
//   4. El G-2 con BASE puede acostar objetivos, maniobra, A.I.N. y generar los
//      CAE. El resto de la BASE sigue con candado para los demás puestos.
//
// En el fuente (repo GENERADOR_CALCOS): `src/lib/plantillaSituacional.js`
// (probado con 44 casos: los 11 esquemas × sin avenidas con/sin frente y con
// una avenida que no cruza → plantilla, objetivos y flechas).
//
// Nombres del compilado: s9 = plantillaSituacional · t6e = frenteDe ·
// r6e = ejesDoctrinales · E = anillo del A.O. · j = frente · re = ejes ·
// de/he = aviso rojo (estado y setter) · Sg/qr = aviso verde · ll = candado
// de la BASE · Nl = avisarCandado · Ha = puesto activo.
// ============================================================

export const REEMPLAZOS = [
  {
    nombre: '1a · el motor ya no se planta por falta de avenidas',
    de: 'if(!v.length)return{ok:!1,error:"Todavía no hay avenidas de aproximación. Generá el CMOC (o pedíselas a la IA): la fuerza se reparte SOBRE las avenidas, que son los ejes que el terreno le deja."};',
    a: '',
  },
  {
    nombre: '1b · sin frente guardado y sin avenidas, el frente es el primer lado del A.O.',
    de: 'const j=t6e(u);let B=0;',
    a: 'const SIDfs=!t6e(u)&&!v.length,j=t6e(u)||(SIDfs?t6e([E[0],E[1]]):null);let B=0;',
  },
  {
    nombre: '1c · si ninguna avenida sirve pero hay frente, se sigue con ejes doctrinales',
    de: ',!re.length)return{ok:!1,error:"Ninguna de las avenidas cruza el Área de Operaciones, así que no hay por dónde acostar la plantilla. Revisá que las avenidas lleguen hasta tu AO (y que el AO sea la que corresponde)."};const se=re.filter(ft=>ft.ataca),',
    a: ',!re.length&&!j)return{ok:!1,error:"Ninguna de las avenidas cruza el Área de Operaciones y el A.O. no tiene frente guardado, así que no hay por dónde acostar la plantilla. Elegí «🧭 ¿De dónde viene el enemigo?» en la hoja P.D. (o revisá que las avenidas lleguen hasta tu AO) y volvé a acostarla."};const SIDsa=!re.length,se=re.filter(ft=>ft.ataca),',
  },
  {
    nombre: '1d · sin avenidas útiles se pide al menos un eje doctrinal',
    de: '_e=j?r6e(Math.max(0,ve-se.length),',
    a: '_e=j?r6e(Math.max(SIDsa?1:0,ve-se.length),',
  },
  {
    nombre: '1e · si tampoco salió ningún eje doctrinal, se dice (en vez de romperse)',
    de: 'Se=!Re.length,Ae=Se?re:Re,{elegidos:Ie,',
    a: 'Se=!Re.length;if(Se&&SIDsa)return{ok:!1,error:"No se pudo armar ningún eje contra el frente del Área de Operaciones. Elegí «🧭 ¿De dónde viene el enemigo?» en la hoja P.D., o trazá una avenida con ➤ Avenida que llegue hasta tu AO."};const Ae=Se?re:Re,{elegidos:Ie,',
  },
  {
    nombre: '1f · la plantilla avisa que se acostó sin avenidas (y con qué frente)',
    de: 'j||On.push("⚠️ ESTA ÁREA DE OPERACIONES NO TIENE FRENTE GUARDADO',
    a: 'SIDfs&&On.push("🧭 Esta Área de Operaciones no tiene frente guardado y todavía no hay avenidas: se tomó como FRENTE EL PRIMER LADO del A.O. Si el enemigo viene de otro lado, elegilo en «🧭 ¿De dónde viene el enemigo?» de la hoja P.D. y volvé a acostarla."),SIDsa&&On.push("➤ Se acostó SIN AVENIDAS, sobre ejes doctrinales perpendiculares al frente. Cuando traces tus avenidas de aproximación (➤ Avenida), volvé a acostarla y la fuerza se reparte sobre ellas."),j||On.push("⚠️ ESTA ÁREA DE OPERACIONES NO TIENE FRENTE GUARDADO',
  },
  {
    nombre: '2a · el botón «Acostar» ya no se apaga (si falta algo, lo dice en rojo)',
    de: 'disabled:!re||!a.length,onClick:()=>o?.({esquema:Se,nivel:te,asignacion:',
    a: 'onClick:()=>o?.({esquema:Se,nivel:te,asignacion:',
  },
  {
    nombre: '2b · volver a acostar con otra dirección tampoco exige avenidas',
    de: 'onReacostar:SIDd=>a.length&&o?.({',
    a: 'onReacostar:SIDd=>o?.({',
  },
  {
    nombre: '2c · el cartel de «no hay avenidas» ya no dice que no se puede',
    de: 'children:"⚠️ Todavía no hay avenidas de aproximación. Generá el CMOC (o pedíselas a la IA): son los ejes que el terreno le deja, y sobre ellos se reparte la fuerza."',
    a: 'children:"ℹ️ Todavía no hay avenidas de aproximación. Igual podés ACOSTAR la plantilla: se arma contra el frente del Área de Operaciones, sobre ejes doctrinales. Cuando traces tus avenidas con ➤ Avenida, volvé a acostarla y la fuerza se reparte sobre ellas."',
  },
  {
    nombre: '3 · el aviso ROJO sale arriba de la carta, a la vista (se cierra tocándolo)',
    de: 'children:[Sg&&f.jsx("div",{style:{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",zIndex:1500,background:"#0e7a4a",color:"#fff",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:600,boxShadow:"0 4px 16px rgba(0,0,0,0.4)",pointerEvents:"none"},children:Sg}),',
    a: 'children:[Sg&&f.jsx("div",{style:{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",zIndex:1500,background:"#0e7a4a",color:"#fff",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:600,boxShadow:"0 4px 16px rgba(0,0,0,0.4)",pointerEvents:"none"},children:Sg}),de&&typeof de=="string"&&f.jsxs("div",{className:"sid-aviso-rojo",role:"alert",title:"Tocá para cerrar",onClick:()=>he(""),style:{position:"absolute",top:Sg?76:12,left:"50%",transform:"translateX(-50%)",zIndex:1500,width:"max-content",maxWidth:"min(760px,88%)",background:"#a51d1d",color:"#fff",padding:"10px 14px",borderRadius:8,fontSize:13,fontWeight:600,lineHeight:1.4,boxShadow:"0 4px 16px rgba(0,0,0,0.5)",border:"1px solid #ffb4b4",cursor:"pointer",whiteSpace:"pre-wrap"},children:[de,f.jsx("span",{style:{marginLeft:10,opacity:.8},children:"✕"})]}),',
  },
  {
    nombre: '4 · el aviso VERDE dura según su largo (4 a 20 s)',
    de: 'yr.current=setTimeout(()=>qr(""),2800)',
    a: 'yr.current=setTimeout(()=>qr(""),Math.max(4e3,Math.min(2e4,String(Ee||"").length*75)))',
  },
  {
    nombre: '5a · el aviso del candado se renueva al cambiar de puesto',
    de: 'Si hay que cambiarla, pedísela al G-3.")},[]),',
    a: 'Si hay que cambiarla, pedísela al G-3.")},[Ha]),',
  },
  {
    nombre: '5b · G-2 con BASE: generar los CAE del enemigo',
    de: 'Tg=je.useCallback(()=>{var Ee,Qe,ot,ct,xt,Qt;if(ll){Nl();return}',
    a: 'Tg=je.useCallback(()=>{var Ee,Qe,ot,ct,xt,Qt;if(ll&&Ha!=="g2"){Nl();return}',
  },
  {
    nombre: '5c · G-2 con BASE: acostar los objetivos',
    de: 'Tv=je.useCallback(()=>{var Ee;if(ll){Nl();return}',
    a: 'Tv=je.useCallback(()=>{var Ee;if(ll&&Ha!=="g2"){Nl();return}',
  },
  {
    nombre: '5d · G-2 con BASE: acostar el esquema de maniobra',
    de: 'iw=je.useCallback((Ee=null,{superponer:Qe=!1,cae:SIDcae=null}={})=>{var ot;if(ll){Nl();return}',
    a: 'iw=je.useCallback((Ee=null,{superponer:Qe=!1,cae:SIDcae=null}={})=>{var ot;if(ll&&Ha!=="g2"){Nl();return}',
  },
  {
    nombre: '5e · G-2 con BASE: acostar las A.I.N.',
    de: 'wC=je.useCallback(()=>{if(ll){Nl();return}',
    a: 'wC=je.useCallback(()=>{if(ll&&Ha!=="g2"){Nl();return}',
  },
  {
    nombre: '5f · G-2 con BASE: mover un objetivo',
    de: 'SIDMovObj=je.useCallback((Ee,Qe)=>{if(ll){Nl();return}',
    a: 'SIDMovObj=je.useCallback((Ee,Qe)=>{if(ll&&Ha!=="g2"){Nl();return}',
  },
]
