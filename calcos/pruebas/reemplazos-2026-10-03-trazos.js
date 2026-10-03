// Reemplazos hechos el 2026-10-03 (sexta vuelta) sobre el compilado de la Mesa del EM
// (calcos/assets/index-respuestas-20261003.js → index-trazos-20261003.js).
//
// Lo pidió Sergio con una captura del Área de Operaciones: «doble clic = el frente es éste»
// y el frente seguía sumando vértices. Lo mismo con la Línea de Extraviados del G-1, el eje
// humanitario del G-5, los ejes de abastecimiento del G-4 y las áreas: los trazos no se
// terminaban ni se cerraban.
//
// Todos los trazos de la Mesa terminaban SÓLO con el evento «dblclick» del navegador:
//   · Safari del iPad / iPhone no lo manda después de un doble toque. En 3D la Mesa lo arma
//     desde el 27-09 (`mando` del espejo 3D); en la carta 2D quedaba la simulación de
//     Leaflet, que tampoco lo arma (Leaflet 1.9 descarta el segundo toque si viene con
//     detail 2, y pide los dos toques en menos de 200 ms): el trazo NUNCA terminaba.
//   · Un doble clic más lento que el del sistema son dos clics: dos vértices más.
//   · En 3D el doble clic se pierde si algo vuelve a prender el zoom por doble clic de la
//     carta escondida (el CMOC lo prende al montarse).
//
// Ahora, en los trazos de la Mesa (Ave) y en los del CMOC del G-2 (cve):
//   · clic (o toque) OTRA VEZ SOBRE EL ÚLTIMO PUNTO = terminar (12 px con el ratón, 30 px con
//     el dedo, medidos en la vista que se mira, 2D o 3D). En el Área de Operaciones: en el
//     frente es «el frente es éste»; en el contorno es cerrar (como el doble clic).
//   · El doble clic de siempre sigue andando; el que llega justo después de haber terminado
//     con el clic sobre el último punto (el mismo gesto) no termina dos veces, ni el segundo
//     clic de ese gesto empieza otro trazo (las guardas miden con la hora del evento y sólo
//     se arman cuando termina el ratón o el dedo, no con Enter ni con el botón).
//   · Enter = terminar y Esc = cancelar en TODOS los trazos (antes sólo ASDI y ejes del G-4).
//   · Mientras hay un trazo empezado aparece abajo, en 2D y en 3D, la barra
//     «✓ TERMINAR / ↶ BORRAR ÚLTIMO / ✕ CANCELAR» (en el Área de Operaciones «✓ EL FRENTE ES
//     ÉSTE» y después «✓ CERRAR EL ÁREA»), con el aviso si falta algo. El ASDI y los ejes
//     del G-4 no la llevan: ya tienen sus botones en el panel desde el 30-09.
//   · Mientras se traza, el zoom por doble clic de la carta queda apagado aunque otra parte
//     lo vuelva a prender; y si el trazo se acaba de terminar con el clic sobre el último
//     punto, recién se prende 900 ms después (si no, el dblclick de ese gesto acercaba la carta).
//
// Una revisión adversarial de la primera versión (commit 173f25f) encontró 12 defectos; los
// casos nuevos de e2e/trazos.cjs los cubren.
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer
// «veces» veces) y se cambió por «nuevo». construir-trazos.js arma el compilado y comprueba
// que deshaciéndolos se vuelve byte por byte al anterior.

// Ayudantes comunes, a nivel del módulo (antes de Ave). `pxVista` ya mide en la vista que se
// mira (3D si está abierto). La barra va en <body>, fija, para que se vea en 2D y en 3D.
const AYUDANTES =
  'let SIDToque=-1e9;typeof window<"u"&&(window.addEventListener("touchstart",()=>{SIDToque=performance.now()},{capture:!0,passive:!0}),window.addEventListener("pointerdown",SIDe=>{SIDe.pointerType==="mouse"&&(SIDToque=-1e9)},{capture:!0,passive:!0}));' +
  'function SIDEsToque(ev){const o=ev&&ev.originalEvent;return!!(o&&(o.pointerType==="touch"||o.pointerType==="pen"||o.sourceCapabilities&&o.sourceCapabilities.firesTouchEvents))||performance.now()-SIDToque<1200}' +
  'function SIDCercaUltimo(m,ev,p){if(!p||!ev||!ev.latlng)return!1;try{return pxVista(m,ev.latlng).distanceTo(pxVista(m,Rt.latLng(p[1],p[0])))<=(SIDEsToque(ev)?30:12)}catch{return!1}}' +
  'function SIDT(ev){const o=ev&&ev.originalEvent,t=o&&o.timeStamp,n=performance.now();return t>0&&t<=n+50?t:n}' +
  'function SIDSinRepetidos(l){return(l||[]).filter((p,i,a)=>i===0||p[0]!==a[i-1][0]||p[1]!==a[i-1][1])}' +
  'function SIDBarraTrazo(c){const SIDya=document.querySelectorAll(".barra-trazo").length,d=document.createElement("div");d.className="barra-trazo";d.setAttribute("role","toolbar");d.setAttribute("aria-label",c.de||"Trazo en curso");' +
  'd.style.cssText="position:fixed;left:50%;bottom:"+(62+SIDya*112)+"px;transform:translateX(-50%);z-index:1500;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;width:max-content;max-width:min(560px,calc(100vw - 24px));box-sizing:border-box;padding:8px 10px;background:rgba(10,14,22,.95);color:#eef3fb;border:1px solid #34405a;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.5);font:600 12px/1.35 Arial,sans-serif";' +
  'const b=(t,fn,e)=>{const x=document.createElement("button");x.type="button";x.textContent=t;x.style.cssText="cursor:pointer;border-radius:6px;padding:7px 11px;font:700 12px Arial,sans-serif;letter-spacing:.3px;border:1px solid #4b5a74;background:#1c2433;color:#e8edf5;"+(e||"");x.addEventListener("mousedown",v=>v.preventDefault());x.addEventListener("click",v=>{v.preventDefault();x.blur();fn()});return x};' +
  'if(c.de){const o=document.createElement("div");o.style.cssText="flex-basis:100%;text-align:center;color:#ffd27a;font-weight:700";o.textContent=c.de;d.append(o)}' +
  'if(c.aviso){const a=document.createElement("div");a.style.cssText="flex-basis:100%;text-align:center;color:#ffd9a0";a.textContent="⚠️ "+c.aviso;d.append(a)}' +
  'd.append(b(c.primario,()=>c.acc.current.terminar&&c.acc.current.terminar(),"background:#1f7a3d;border-color:#35c46a;color:#fff"),b("↶ BORRAR ÚLTIMO",()=>c.acc.current.deshacer&&c.acc.current.deshacer()),b("✕ CANCELAR",()=>c.acc.current.cancelar&&c.acc.current.cancelar()));' +
  'const y=document.createElement("div");y.style.cssText="flex-basis:100%;text-align:center;color:#9fb6d6;font-weight:400;font-size:11px";y.textContent=c.ayuda;d.append(y);' +
  'for(const n of["pointerdown","mousedown","touchstart","click","dblclick","contextmenu","wheel"])d.addEventListener(n,v=>v.stopPropagation());document.body.appendChild(d);return()=>d.remove()}'

const AYUDA_TERMINAR = 'Terminá con doble clic, Enter o clic otra vez en el último punto (con el dedo: tocalo de nuevo) · Esc cancela'

module.exports = [
  {
    nombre: 'Trazos · ayudantes: ¿es el dedo?, ¿tocó el último punto?, la barra de terminar',
    viejo: 'function Ave({herramienta:t,',
    nuevo: AYUDANTES + 'function Ave({herramienta:t,',
    veces: 1,
  },
  {
    nombre: 'Trazos (Ave) · cuándo se terminó el último trazo y qué hacen los botones',
    viejo: 'const _e=xu(),Re=je.useRef(null),[Se,_asdiSetPuntos]=je.useState([])',
    nuevo: 'const _e=xu(),Re=je.useRef(null),SIDFin=je.useRef(0),SIDRech=je.useRef(0),SIDAdd=je.useRef(0),SIDAcc=je.useRef({}),[Se,_asdiSetPuntos]=je.useState([])',
    veces: 1,
  },
  {
    // SIDTermina: lo que hace el doble clic, pero sin depender del evento. En el contorno del
    // Área de Operaciones, sin punto (botón / Enter) cierra con los vértices que haya; con
    // punto, como el doble clic. En los demás pide los vértices mínimos y si faltan avisa.
    nombre: 'Trazos (Ave) · terminar sin «dblclick», Enter/Esc en todos los trazos, la barra y el zoom por doble clic apagado',
    viejo: 'Te(null),ge([])};je.useEffect(()=>{if(!["zonalog","epa","epe"].includes(t))return;',
    nuevo:
      'Te(null),ge([])},SIDTermina=(SIDll,SIDp)=>{if(t==="areaops"&&Ie){SIDp&&(SIDFin.current=performance.now());Ea(SIDll||null,SIDll?"dblclick":"vertice");return}' +
      'const SIDn=SIDSinRepetidos(_asdiPuntos.current).length,SIDm=t==="zonalog"||!!Tt&&Tt.forma==="area"?3:2;' +
      'if(SIDn<SIDm){SIDp&&(SIDRech.current=performance.now());He(SIDm===3?"MARCÁ AL MENOS TRES VÉRTICES PARA CERRAR EL ÁREA.":"MARCÁ AL MENOS DOS PUNTOS DISTINTOS PARA TERMINAR EL TRAZO.");return}SIDp&&(SIDFin.current=performance.now());jt()};' +
      'SIDAcc.current={dt:Dt,terminar:()=>SIDTermina(null),' +
      'deshacer:()=>{He("");t==="areaops"&&Ie?lt.current.length?ge(lt.current.slice(0,-1)):(Ae(Ve.current||[]),Te(null),ge([])):Ae(SIDq=>SIDq.slice(0,-1))},' +
      'cancelar:()=>{Te(null),ge([]),Ae([]),He("")}};' +
      'je.useEffect(()=>{if(!Dt||["zonalog","epa","epe"].includes(t))return;const SIDk=SIDe=>{const SIDg=SIDe.target;if(SIDg&&(SIDg.isContentEditable||/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(SIDg.tagName)))return;' +
      'if(SIDe.key==="Enter"){SIDe.preventDefault();SIDe.repeat||SIDAcc.current.terminar()}else if(SIDe.key==="Escape")SIDAcc.current.cancelar()};window.addEventListener("keydown",SIDk);return()=>window.removeEventListener("keydown",SIDk)},[t,Dt]);' +
      'je.useEffect(()=>{if(!Dt||["zonalog","epa","epe"].includes(t)||!(Se.length>0||t==="areaops"&&Ie))return;const SIDao=t==="areaops",SIDar=!!Tt&&Tt.forma==="area";' +
      'return SIDBarraTrazo({acc:SIDAcc,primario:SIDao?Ie?"✓ CERRAR EL ÁREA":"✓ EL FRENTE ES ÉSTE":SIDar?"✓ CERRAR ÁREA":"✓ TERMINAR TRAZO",' +
      'ayuda:SIDao&&Ie?"Cerrá con doble clic, Enter, clic en el primer vértice o clic otra vez en el último · Esc cancela":"' + AYUDA_TERMINAR + '",aviso:it})},[Dt,t,Se.length>0,!!Ie,it]);' +
      'je.useEffect(()=>{Dt&&_e.doubleClickZoom.enabled()&&_e.doubleClickZoom.disable()});' +
      'je.useEffect(()=>{if(!["zonalog","epa","epe"].includes(t))return;',
    veces: 1,
  },
  {
    // Antes de poner el vértice: si toca otra vez el último punto, termina. No cuenta el
    // primer vértice del Área de Operaciones ni del área logística (ésos cierran como antes).
    // El clic que viene justo después de terminar (el segundo del mismo doble clic) no
    // empieza otro trazo.
    nombre: 'Trazos (Ave) · clic otra vez sobre el último punto = terminar',
    viejo: 'if(!t||t==="regla")return;const pa=[Math.round(bn.latlng.lng*1e6)/1e6,Math.round(bn.latlng.lat*1e6)/1e6];if(t==="areaops"&&Ie){',
    nuevo:
      'if(!t||t==="regla")return;if(Dt&&SIDT(bn)-SIDFin.current<(bn.originalEvent&&bn.originalEvent.detail>1?900:450))return;const pa=[Math.round(bn.latlng.lng*1e6)/1e6,Math.round(bn.latlng.lat*1e6)/1e6];' +
      'if(Dt){_e.doubleClickZoom.enabled()&&_e.doubleClickZoom.disable();const SIDao=t==="areaops"&&!!Ie,SIDl=SIDao?lt.current:_asdiPuntos.current,SIDu0=SIDl[SIDl.length-1];' +
      'if(SIDu0&&!(SIDao&&Yt(bn.latlng))&&!(t==="zonalog"&&_asdiPuntos.current.length>=3&&YtZona(bn.latlng))&&SIDCercaUltimo(_e,bn,SIDu0)){bn.originalEvent&&Rt.DomEvent.preventDefault(bn.originalEvent);' +
      'SIDTermina(!SIDao?bn.latlng:SIDl.length===1&&SIDT(bn)-SIDAdd.current<600?Rt.latLng(SIDu0[1],SIDu0[0]):null,!0);return}it&&He("");SIDao&&(SIDAdd.current=SIDT(bn))}' +
      'if(t==="areaops"&&Ie){',
    veces: 1,
  },
  {
    // Al terminar con el clic sobre el último punto, el Área de Operaciones, el ASDI y los ejes
    // apagan la herramienta (`xm` hace $n(null)) y este efecto volvía a prender el zoom por
    // doble clic ANTES de que llegara el dblclick del mismo gesto: la carta 2D se acercaba un
    // nivel. Si se acaba de terminar, se prende 900 ms después (salvo que haya otro trazo).
    nombre: 'Trazos (Ave) · el zoom por doble clic vuelve recién después del gesto que terminó el trazo',
    viejo: 'je.useEffect(()=>{_e.doubleClickZoom[Dt?"disable":"enable"]();const bn=_e.getContainer();',
    nuevo: 'je.useEffect(()=>{!Dt&&SIDFin.current&&performance.now()-SIDFin.current<3000?setTimeout(()=>{SIDAcc.current.dt||_e.doubleClickZoom.enable()},900):_e.doubleClickZoom[Dt?"disable":"enable"]();const bn=_e.getContainer();',
    veces: 1,
  },
  {
    nombre: 'Trazos (Ave) · el doble clic del mismo gesto no termina dos veces',
    viejo: 'dblclick(bn){Dt&&(Rt.DomEvent.preventDefault(bn.originalEvent),t==="areaops"&&Ie?Ea(bn.latlng,"dblclick"):jt())}',
    nuevo:
      'dblclick(bn){if(Dt&&(SIDT(bn)-SIDFin.current<900||SIDT(bn)-SIDRech.current<900)){bn.originalEvent&&Rt.DomEvent.preventDefault(bn.originalEvent);return}' +
      'Dt&&(SIDFin.current=performance.now(),Rt.DomEvent.preventDefault(bn.originalEvent),t==="areaops"&&Ie?Ea(bn.latlng,"dblclick"):jt())}',
    veces: 1,
  },
  {
    // Los puntos del CMOC también en una referencia (como el ASDI): el doble clic, Enter y el
    // botón terminan con el último punto aunque React todavía no haya vuelto a dibujar.
    nombre: 'Trazos del CMOC (cve) · los puntos en una referencia',
    viejo: 'v=xu(),[x,E]=je.useState([]),[S,M]=je.useState(null),T=V2(["estilos"]).estilos;',
    nuevo:
      'v=xu(),[x,SIDcSet]=je.useState([]),SIDcPts=je.useRef([]),SIDcFin=je.useRef(0),SIDcAcc=je.useRef({}),' +
      'E=SIDv=>{const SIDw=typeof SIDv==="function"?SIDv(SIDcPts.current):SIDv;SIDcPts.current=SIDw;SIDcSet(SIDw)},[S,M]=je.useState(null),T=V2(["estilos"]).estilos;',
    veces: 1,
  },
  {
    nombre: 'Trazos del CMOC (cve) · Enter termina',
    viejo: 'G.key==="Backspace"||G.key==="Delete"?(G.preventDefault(),E(H=>H.slice(0,-1))):G.key==="Escape"&&E([])',
    nuevo: 'G.key==="Backspace"||G.key==="Delete"?(G.preventDefault(),E(H=>H.slice(0,-1))):G.key==="Enter"&&te!=="BUTTON"&&te!=="SELECT"?(G.preventDefault(),G.repeat||SIDcAcc.current.terminar()):G.key==="Escape"&&E([])',
    veces: 1,
  },
  {
    nombre: 'Trazos del CMOC (cve) · terminar con los últimos puntos, la barra y clic otra vez sobre el último punto',
    viejo:
      'const B=()=>{!e||x.length<1||(a(e,{coords:x}),E([]))};return sE({click(U){if(!t||!e)return;const G=[Math.round(U.latlng.lng*1e5)/1e5,Math.round(U.latlng.lat*1e5)/1e5];if(e==="clave"){a("clave",{centro:G});return}',
    nuevo:
      'const B=()=>{const SIDp0=SIDcPts.current;!e||e==="clave"||SIDp0.length<1||(a(e,{coords:SIDp0}),E([]))},SIDcMin=["restringido","severo","ae"].includes(e)?3:e==="defensivo"?1:2;' +
      'SIDcAcc.current={terminar:()=>{if(!t||!e||e==="clave"||!SIDcPts.current.length)return;SIDSinRepetidos(SIDcPts.current).length>=SIDcMin?B():window.alert(SIDcMin===3?"MARCÁ AL MENOS TRES VÉRTICES PARA CERRAR EL ÁREA.":"MARCÁ AL MENOS DOS PUNTOS DISTINTOS PARA TERMINAR EL TRAZO.")},deshacer:()=>E(SIDq=>SIDq.slice(0,-1)),cancelar:()=>E([])};' +
      'je.useEffect(()=>{SIDcPts.current.length&&E([])},[e]);' +
      'je.useEffect(()=>{if(!t||!e||e==="clave"||!x.length)return;return SIDBarraTrazo({acc:SIDcAcc,de:"🪖 Trazo del CMOC",primario:SIDcMin===3?"✓ CERRAR ÁREA":"✓ TERMINAR TRAZO",ayuda:"' + AYUDA_TERMINAR + '"})},[t,e,x.length>0]);' +
      'return sE({click(U){if(!t||!e)return;const G=[Math.round(U.latlng.lng*1e5)/1e5,Math.round(U.latlng.lat*1e5)/1e5];if(e==="clave"){a("clave",{centro:G});return}' +
      'if(SIDT(U)-SIDcFin.current<(U.originalEvent&&U.originalEvent.detail>1?900:450))return;v.doubleClickZoom.enabled()&&v.doubleClickZoom.disable();const SIDcU=SIDcPts.current[SIDcPts.current.length-1];' +
      'if(SIDcU&&SIDSinRepetidos(SIDcPts.current).length>=SIDcMin&&SIDCercaUltimo(v,U,SIDcU)){U.originalEvent&&Rt.DomEvent.preventDefault(U.originalEvent);SIDcFin.current=performance.now();B();return}',
    veces: 1,
  },
  {
    nombre: 'Trazos del CMOC (cve) · el doble clic del mismo gesto no termina dos veces',
    viejo: 'dblclick(U){!t||!e||e==="clave"||(Rt.DomEvent.preventDefault(U.originalEvent),B())}',
    nuevo: 'dblclick(U){!t||!e||e==="clave"||(Rt.DomEvent.preventDefault(U.originalEvent),SIDT(U)-SIDcFin.current<900||(SIDcFin.current=performance.now(),B()))}',
    veces: 1,
  },
  {
    nombre: 'Área de Operaciones · el rótulo del frente dice que también termina con Enter',
    viejo: '<i>Doble clic = «el frente es éste» y empiezo',
    nuevo: '<i>Doble clic o Enter = «el frente es éste» y empiezo',
    veces: 1,
  },
  {
    nombre: 'Área de Operaciones · el rótulo del frente (sin banda) dice que también termina con Enter',
    viejo: '"<i>Doble clic cuando el frente sea el que querés</i>"',
    nuevo: '"<i>Doble clic o Enter cuando el frente sea el que querés</i>"',
    veces: 1,
  },
  {
    nombre: 'Área de Operaciones · el rótulo del contorno dice que también cierra con Enter',
    viejo: 'clic = otro vértice · doble clic = cerrar · clic derecho = borrar el último',
    nuevo: 'clic = otro vértice · doble clic o Enter = cerrar · clic derecho = borrar el último',
    veces: 1,
  },
  {
    nombre: 'Ayudas de los paneles (G-1, G-3, G-4, G-5, obstáculos) · cómo se termina un trazo',
    viejo: 'Clic = vértice · doble clic = terminar.',
    nuevo: 'Clic = vértice · para terminar: doble clic, Enter o clic otra vez en el último punto.',
    veces: 7,
  },
]
