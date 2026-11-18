// ============================================================
// reemplazos-2026-11-17-enlaces.js
//
// EL PROBLEMA (17-11-2026). Sergio: «los enlaces deben funcionar, no está
// funcionando, no aparecen en las pantallas de algunos alumnos».
//
// ✅ Comprobado en la página publicada (`sideceme/calcos/index.html`, el bloque
//    que arma `window.SIDECEME_CALCOS`):
//
//      profesores → el pase vive en localStorage   'sideceme_token_p'
//      cursantes  → el pase vive en sessionStorage 'sideceme_token'
//
//    sessionStorage es DE ESA PESTAÑA. Un enlace que llega por WhatsApp o por
//    correo SIEMPRE abre una pestaña nueva: ahí no hay pase, la Mesa pregunta
//    «¿tenés permiso?», el servidor dice que no y el alumno queda en el
//    candado, sin un solo renglón que le diga qué hacer. Por eso fallaba en
//    «algunos»: al profesor —localStorage— el MISMO enlace le abría perfecto.
//
//    Y el segundo problema, abajo del primero: aunque entrara, el enlace
//    llevaba sólo el PUESTO. La BASE (terreno, misión, Orden y fases) se
//    quedaba en la computadora del G-3, así que el oficial llegaba a una carta
//    en blanco.
//
// LO QUE HACE ESTA ENTREGA
//   1. La BASE viaja DENTRO del enlace, comprimida (gzip) y detrás del `#`.
//      Lo que va después del `#` no se manda al servidor: es del navegador.
//      Al apretar «⬇️ Bajar la BASE» se empaqueta y los cinco enlaces salen
//      con el ejercicio adentro.
//   2. El puesto Y la BASE se guardan APENAS se abre la dirección —antes del
//      candado—, así el rodeo por el login de SIDECEME no se lleva nada: al
//      volver por el menú, el oficial entra derecho a su tablero y con su
//      ejercicio cargado.
//   3. El candado deja de ser una pared: dice el puesto con el que entró, que
//      no se perdió nada, los dos pasos y los dos botones.
//   4. Si igual no llegó la BASE, la Mesa lo dice en rojo en vez de mostrar
//      una carta vacía sin explicación.
//   5. Los cinco enlaces salen del tirón (ya no plegados) y «copiar los 5
//      juntos» copia también el instructivo para el grupo.
//
// En el fuente (Vite/React, repo GENERADOR_CALCOS) esto ya está en
// `src/lib/mesaEnlaces.js`, `src/App.jsx`, `src/components/PanelMesaEM.jsx` y
// `src/components/BarraPuesto.jsx`.
//
// Nombres del compilado usados acá (del propio archivo):
//   QU = enlaceDePuesto · bN = puestoDeLaURL · cle = puestoRecordado
//   A4e = baseRepartida · E4e = repartirEnEsteNavegador · gm = aplicarBase
//   za = aviso verde · he = aviso rojo · bi = abrir la Mesa
//   Ae = aoi · dn = unidades · Ne = permiso
// ============================================================

export const REEMPLAZOS = [
  {
    // 1 · El enlace lleva la BASE. Se agregan las funciones de empaquetado
    //     (gzip + base64url) y `QU` le cuelga el paquete detrás del `#`.
    //     `SIDPaqueteInicial()` corre al cargar la página —antes del candado—
    //     para que el paquete del enlace quede guardado aunque falte el pase.
    nombre: '1 · enlaceDePuesto lleva la BASE (y se guarda al abrir)',
    de: 'const lle="pmtd_base_repartida";function QU(t){const e=new URL(window.location.href);return e.hash="",e.searchParams.set("puesto",t),e.toString()}',
    a: 'const lle="pmtd_base_repartida",SIDPaqueteClave="pmtd_base_enlace";'
      + 'function SIDb64u(b){let s="";const C=32768;for(let i=0;i<b.length;i+=C)s+=String.fromCharCode.apply(null,b.subarray(i,i+C));return btoa(s).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"")}'
      + 'function SIDdeB64u(t){const s=String(t).replace(/-/g,"+").replace(/_/g,"/"),b=atob(s+"===".slice((s.length+3)%4)),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}'
      + 'async function SIDEmpacarBase(o){try{const b=new TextEncoder().encode(JSON.stringify(o));if(typeof CompressionStream=="function")try{const r=new Response(new Blob([b]).stream().pipeThrough(new CompressionStream("gzip")));return"z"+SIDb64u(new Uint8Array(await r.arrayBuffer()))}catch{}return"j"+SIDb64u(b)}catch{return null}}'
      + 'async function SIDDesempacarBase(p){if(!p||p.length<2)return null;try{const m=p[0];let b=SIDdeB64u(p.slice(1));if(m==="z"){const r=new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream("gzip")));b=new Uint8Array(await r.arrayBuffer())}else if(m!=="j")return null;const o=JSON.parse(new TextDecoder().decode(b));return o&&typeof o=="object"?o:null}catch{return null}}'
      + 'function SIDPaqueteDeLaURL(){try{const m=String(window.location.hash||"").match(/[#&]b=([A-Za-z0-9\\-_]+)/);return m?m[1]:null}catch{return null}}'
      + 'function SIDRecordarPaquete(p){try{p?localStorage.setItem(SIDPaqueteClave,p):localStorage.removeItem(SIDPaqueteClave)}catch{}}'
      + 'function SIDPaqueteGuardado(){try{return localStorage.getItem(SIDPaqueteClave)||null}catch{return null}}'
      + 'function SIDPaqueteInicial(){const u=SIDPaqueteDeLaURL();return u?(SIDRecordarPaquete(u),u):SIDPaqueteGuardado()}'
      + 'const SIDPaqueteArranque=SIDPaqueteInicial();'
      + 'function QU(t){const e=new URL(window.location.href);e.hash="",e.searchParams.set("puesto",t);const p=SIDPaqueteGuardado();return p&&(e.hash="b="+p),e.toString()}',
  },
  {
    // 2 · Repartir la BASE la empaqueta para los cinco enlaces.
    nombre: '2 · «Bajar la BASE» empaqueta el ejercicio para los enlaces',
    de: 'const Qe=E4e(Ee);za(Qe?"⬇️ BASE repartida: los enlaces de este navegador ya la levantan":"⬇️ BASE descargada: repartila a los cinco campos")',
    a: 'const Qe=E4e(Ee);SIDEmpacarBase(Ee).then(xt=>xt&&SIDRecordarPaquete(xt));za(Qe?"⬇️ BASE repartida: los 5 enlaces ya la llevan adentro":"⬇️ BASE descargada: repartila a los cinco campos")',
  },
  {
    // 3 · Al entrar: vale el puesto del enlace Y el recordado (el rodeo por el
    //     login pierde la dirección), y la BASE sale del enlace si en esta
    //     computadora no hay copia. Si no llega nada, lo dice en rojo.
    nombre: '3 · al entrar por el enlace se carga la BASE (del enlace o local)',
    de: 'je.useEffect(()=>{if(Cg.current||(Cg.current=!0,!bN()))return;const Ee=A4e();Ee&&gm(Ee,!0)&&(za(`🔗 Entraste como ${bN().toUpperCase()} — BASE del G-3 cargada`),bi(!0))},[gm,za]);',
    a: 'je.useEffect(()=>{if(Cg.current)return;Cg.current=!0;let q=bN();if(!q){try{localStorage.getItem("pmtd_instructor")!=="1"&&(q=cle())}catch{}}if(!q||Ae||dn.length)return;'
      + 'const li=de=>{za("🔗 Entraste como "+q.toUpperCase()+" — BASE del G-3 cargada ("+de+")"),bi(!0)},Ee=A4e();'
      + 'if(Ee&&gm(Ee,!0)){li("esta computadora");return}'
      + 'const pq=SIDPaqueteGuardado();'
      + 'if(!pq){he("⚠️ Entraste como "+q.toUpperCase()+", pero no llegó la BASE del G-3: por eso la carta está en blanco. Pedile al G-3 el enlace nuevo (lleva la BASE adentro) o el archivo BASE_<ejercicio>.json y abrilo en la Mesa del Estado Mayor.");return}'
      + 'SIDDesempacarBase(pq).then(bs=>{bs&&gm(bs,!0)?li("el enlace"):he("⚠️ El enlace trajo una BASE que no se pudo leer (puede haberse cortado al copiarla). Pedile al G-3 que te mande el archivo BASE_<ejercicio>.json y abrilo en la Mesa.")});'
      + '},[gm,za]);',
  },
  {
    // 4 · El candado explica, en vez de frenar.
    nombre: '4 · la pantalla del candado dice el puesto y los dos pasos',
    de: 'if(!Ne.permitido)return f.jsx("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",padding:24,background:"#0d1520",fontFamily:"system-ui, sans-serif"},children:f.jsxs("div",{style:{maxWidth:520,textAlign:"center",color:"#cfe3ee"},children:[f.jsx("div",{style:{fontSize:46,marginBottom:14},children:"🔒"}),f.jsx("h1",{style:{fontSize:20,margin:"0 0 14px",letterSpacing:".02em"},children:"Mesa del Estado Mayor"}),f.jsx("p",{style:{lineHeight:1.6,fontSize:15,margin:"0 0 22px",color:"#9fb8c8"},children:Ne.mensaje}),f.jsx("button",{onClick:()=>{location.href="../"},style:{padding:"10px 20px",borderRadius:8,border:"1px solid #2a8095",background:"#12303c",color:"#cfe3ee",fontSize:14,cursor:"pointer"},children:"← Volver a SIDECEME"})]})});',
    a: 'if(!Ne.permitido){const SIDrol={g1:{i:"👥",c:"G-1",n:"Personal",k:"#2f6db5"},g2:{i:"🔎",c:"G-2",n:"Inteligencia",k:"#6c3f9e"},g3:{i:"⚔️",c:"G-3",n:"Operaciones",k:"#b01045"},g4:{i:"🚚",c:"G-4",n:"Logística",k:"#8a6d1f"},g5:{i:"🏛️",c:"G-5",n:"Asuntos Civiles",k:"#1f8b6f"}}[bN()||cle()||""];'
      + 'return f.jsx("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",padding:24,background:"#0d1520",fontFamily:"system-ui, sans-serif"},children:f.jsxs("div",{style:{maxWidth:640,textAlign:"center",color:"#cfe3ee"},children:['
      + 'f.jsx("div",{style:{fontSize:46,marginBottom:14},children:"🔒"}),'
      + 'f.jsx("h1",{style:{fontSize:20,margin:"0 0 10px",letterSpacing:".02em"},children:"Mesa del Estado Mayor"}),'
      + 'SIDrol?f.jsxs("div",{style:{margin:"0 0 16px",padding:"12px 14px",borderRadius:10,border:"2px solid "+SIDrol.k,background:SIDrol.k+"1f"},children:['
      + 'f.jsxs("div",{style:{font:"700 17px/1.2 Arial",color:"#fff",letterSpacing:".03em"},children:[SIDrol.i," ENTRÁS COMO ",SIDrol.c," · ",SIDrol.n]}),'
      + 'f.jsxs("div",{style:{fontSize:13,color:"#cfe3ee",marginTop:6,lineHeight:1.5},children:["Tu puesto ",SIDPaqueteGuardado()?"y la BASE del ejercicio ya quedaron guardados":"ya quedó guardado"," en esta computadora. No se perdió nada: falta tu usuario."]})]}):null,'
      + 'f.jsx("p",{style:{lineHeight:1.6,fontSize:14.5,margin:"0 0 6px",color:"#9fb8c8"},children:Ne.mensaje}),'
      + 'f.jsxs("div",{style:{textAlign:"left",margin:"0 auto 20px",maxWidth:480,color:"#b9cede",fontSize:14,lineHeight:1.7},children:['
      + 'f.jsxs("div",{children:[f.jsx("b",{style:{color:"#5ce1ff"},children:"1."})," Apretá «🔑 Entrar a SIDECEME» y entrá con tu usuario."]}),'
      + 'f.jsxs("div",{children:[f.jsx("b",{style:{color:"#5ce1ff"},children:"2."})," Volvé a abrir el Generador de Calcos desde el menú: entrás derecho a tu tablero",SIDrol?" de "+SIDrol.c:"","."]}),'
      + 'f.jsx("div",{style:{color:"#7d93a6",fontSize:12.5,marginTop:8},children:"El enlace abre una pestaña nueva y tu sesión de cursante vive en la pestaña donde entraste a SIDECEME. Por eso hay que entrar acá una vez."})]}),'
      + 'f.jsxs("div",{style:{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"},children:['
      + 'f.jsx("button",{onClick:()=>{location.href="../"},style:{padding:"12px 22px",borderRadius:8,border:"1px solid #5ce1ff",background:"#13506b",color:"#eaf6ff",fontSize:15,fontWeight:700,cursor:"pointer"},children:"🔑 Entrar a SIDECEME"}),'
      + 'f.jsx("button",{onClick:()=>{location.reload()},style:{padding:"12px 18px",borderRadius:8,border:"1px solid #2a8095",background:"#12303c",color:"#cfe3ee",fontSize:14,cursor:"pointer"},children:"🔄 Ya entré — probar de nuevo"})]})]})});}',
  },
  {
    // 5 · Los cinco enlaces, a la vista (venían plegados).
    nombre: '5 · los 5 enlaces se abren solos en el panel de la Mesa',
    de: '[ne,Ke]=je.useState(!!ve),fe=je.useRef(null);',
    a: '[ne,Ke]=je.useState(!0),fe=je.useRef(null);',
  },
  {
    // 6 · El texto de ayuda dice la verdad nueva: si el enlace lleva la BASE y
    //     cómo lo abre el alumno.
    nombre: '6 · el panel explica cómo se abre el enlace (y si lleva la BASE)',
    de: 'f.jsxs("div",{style:Cn.ayuda,children:["Cada oficial entra por el suyo y la aplicación abre en su tablero.",f.jsx("b",{children:" En esta misma computadora"})," (varias pestañas) la BASE se carga sola al abrir el enlace: primero apretá «Bajar la BASE». ",f.jsx("b",{children:"En otra computadora"}),"el enlace lleva el puesto pero no la BASE — mandale el archivo",f.jsx("span",{style:Cn.mono,children:" BASE_<ejercicio>.json"})," y la abre una vez."]})',
    a: 'f.jsx("div",{style:SIDPaqueteGuardado()?{background:"rgba(31,122,77,0.18)",border:"1px solid #2f9c66",borderRadius:8,padding:"9px 11px",fontSize:11.5,lineHeight:1.55,color:"#cfeede",margin:"2px 0 6px"}:{background:"rgba(224,154,63,0.16)",border:"1px solid #e4a63f",borderRadius:8,padding:"9px 11px",fontSize:11.5,lineHeight:1.55,color:"#f1dcb6",margin:"2px 0 6px"},children:SIDPaqueteGuardado()?"✅ Los enlaces llevan la BASE adentro (terreno, misión, Orden y fases): el oficial abre el suyo y ya tiene el ejercicio en su computadora. Si cambiás el plan, apretá otra vez «⬇️ Bajar la BASE» y repartilos de nuevo.":"⚠️ Todavía van pelados. Apretá primero «⬇️ Bajar la BASE» acá arriba y los cinco enlaces salen con el ejercicio adentro."}),'
      + 'f.jsxs("div",{style:Cn.ayuda,children:[f.jsx("b",{children:"Decile esto al que recibe el enlace"})," (va incluido en «copiar los 5 juntos»): el pase del cursante vive en la pestaña donde entró a SIDECEME, así que ",f.jsx("b",{children:"primero entra a SIDECEME con su usuario"})," y recién ahí pega su enlace. Si igual le sale el candado 🔒, que entre desde esa misma pantalla: el puesto y la BASE ya le quedaron guardados y vuelve directo a su tablero."]})',
  },
  {
    // 7 · «Copiar los 5 juntos» manda también el instructivo.
    nombre: '7 · copiar los 5 enlaces incluye el instructivo para el grupo',
    de: 'ct=Ee==="__todos__"?Qe.map(xt=>`${ot[xt]}: ${QU(xt)}`).join(`\n`):QU(Ee);',
    a: 'ct=Ee==="__todos__"?["CÓMO SE ABRE (importante):","1) Entrá a SIDECEME con tu usuario, como siempre.","2) Pegá TU enlace en esa MISMA pestaña y apretá Enter.","   Si te sale el candado, entrá a SIDECEME ahí mismo y volvé a abrir el Generador: tu puesto queda guardado.",""].join(`\n`)+`\n`+Qe.map(xt=>`${ot[xt]}:\n${QU(xt)}`).join(`\n\n`):QU(Ee);',
  },
]
