// Reemplazos del 2026-10-19 sobre calcos/assets/index-orden-documentos-20261019.js → index-picb-tiempo-20261019.js.
// Lo pidió Sergio con la captura de la H.T. 3 «Línea de tiempo de la PICB» con «Minutos para la PICB»
// vacío y todo en 0 h 00 min: «el G-3 ya realizó la línea de tiempo y ahí tenía un tiempo para el
// análisis de la misión o para la PICB… de ahí ya debería generarse automáticamente… así debe ser
// todo sincronizado».
//
// Qué pasaba: la F1·P4 Línea Inicial de Tiempo (G-3/JEM) reparte el tercio del Estado Mayor por fases
// y la primera es «ANÁLISIS DE LA MISIÓN (PICB)», 40 %. El tablero del G-2 (`iLe`) sólo usaba lo
// que se escribía a mano en «Tiempo para la PICB» (`picb._minutos`): no recibía la hoja del G-3.
// Ahora: el tablero del G-2 recibe el G-3 (`ctx.g3`); si «Tiempo para la PICB» está vacío, toma los
// minutos de la fase «Análisis de la misión (PICB)» de la Línea Inicial de Tiempo (con el % que haya
// puesto el JEM) y lo dice; si el G-2 escribe otro número, manda el suyo (y si lo borra, vuelve a
// seguir a la Línea de Tiempo).
//
// Los textos de abajo usan § por la comilla invertida y @{ por «dólar-llave» (para escribirlos en String.raw).
//
// SHA-256 de index-orden-documentos-20261019.js (antes de estos reemplazos): 00b39e37fb7038e794c40cd111afac4cf59346804b829e7d704aede540271b12
const f = (s) => s.replace(/§/g, '`').replace(/@\{/g, '${')

module.exports = [
  {
    nombre: 'PICB ← Línea de Tiempo · el tablero del G-2 recibe la hoja del G-3',
    viejo: f(String.raw`ordenSup:Tn,ejercicio:wn,autor:zo,unidad:Tn?.unidad||""},onExpediente:Ju,aporte:um,plantilla:Zi`),
    nuevo: f(String.raw`ordenSup:Tn,ejercicio:wn,autor:zo,unidad:Tn?.unidad||"",g3:Ya},onExpediente:Ju,aporte:um,plantilla:Zi`),
    veces: 1,
  },
  {
    nombre: 'PICB ← Línea de Tiempo · sin minutos escritos, salen de la fase «Análisis de la misión (PICB)»',
    viejo: f(String.raw`Te=Number(t._minutos)||0,ge=je.useMemo(()=>q7(Te),[Te])`),
    nuevo: f(String.raw`SIDlt=(()=>{try{const SIDr=MS(n.g3?.lineaTiempo||{}),SIDf=SIDr.ok&&SIDr.fases.find(SIDx=>SIDx.id==="analisisMision");return SIDf&&SIDf.ms>0?{min:Math.round(SIDf.ms/6e4),pct:SIDf.pct,txt:SIDf.txt}:null}catch{return null}})(),SIDauto=!Number(t._minutos)&&!!SIDlt,SIDnotaLT=SIDlt?§⏱️ @{SIDauto?"Sale":"La Línea de Tiempo daba"} de la F1·P4 Línea Inicial de Tiempo del G-3: Análisis de la misión (PICB), @{SIDlt.pct} % del tiempo de planeamiento del Estado Mayor = @{SIDlt.txt}.@{SIDauto?" Si escribís otro número, manda el tuyo.":" Borrá el número para volver a seguirla."}§:"",Te=Number(t._minutos)||(SIDlt?SIDlt.min:0)||0,ge=je.useMemo(()=>q7(Te),[Te])`),
    veces: 1,
  },
  {
    nombre: 'PICB ← Línea de Tiempo · «Tiempo para la PICB» muestra los minutos de la Línea de Tiempo',
    viejo: f(String.raw`type:"number",min:"0",max:"2000",style:qt.input,value:t._minutos??"",placeholder:"min"`),
    nuevo: f(String.raw`type:"number",min:"0",style:qt.input,value:Number(t._minutos)?t._minutos:SIDlt?SIDlt.min:"",placeholder:"min"`),
    veces: 1,
  },
  {
    nombre: 'PICB ← Línea de Tiempo · el tablero dice de dónde salió el tiempo',
    viejo: f(String.raw`f.jsx("div",{style:qt.pie,children:"El reparto 10 / 40 / 20 / 30 es el de tu H.T. 3."})`),
    nuevo: f(String.raw`f.jsx("div",{style:qt.pie,children:SIDnotaLT?§@{SIDnotaLT} El reparto 10 / 40 / 20 / 30 es el de tu H.T. 3.§:"El reparto 10 / 40 / 20 / 30 es el de tu H.T. 3."})`),
    veces: 1,
  },
  {
    nombre: 'PICB ← Línea de Tiempo · la H.T. 3 dice de dónde salió el tiempo',
    viejo: f(String.raw`f.jsx(yU,{hoja:nt,valor:t[nt.id],cols6:t._ht6cols,tiempo:ge,minutos:Te,`),
    nuevo: f(String.raw`nt.tipo==="tiempo"&&SIDnotaLT&&f.jsx("div",{style:qt.pie,"data-picb":"desde-linea-tiempo",children:SIDnotaLT}),f.jsx(yU,{hoja:nt,valor:t[nt.id],cols6:t._ht6cols,tiempo:ge,minutos:Te,`),
    veces: 1,
  },
  {
    nombre: 'PICB ← Línea de Tiempo · el Word de la H.T. 3 lleva los minutos que se ven',
    viejo: f(String.raw`firma:"EL G-2",minutos:t._minutos,cols6:t._ht6cols,pbi:t.pbi}`),
    nuevo: f(String.raw`firma:"EL G-2",minutos:Te||t._minutos,cols6:t._ht6cols,pbi:t.pbi}`),
    veces: 1,
  },
]
