// Reemplazos del 2026-10-23 sobre calcos/assets/index-suelo-20261023.js → index-editar-tareas-20261023.js.
// Lo pidió Sergio con la captura de una tarea «Atacar con Fuego» puesta en la carta: «me das la opción de agrandar o
// achicar las tareas tácticas, asimismo de cambiar de dirección y otra opción de poner otras tareas tácticas».
// Hasta ahora la orientación y el tamaño del panel 🎯 Tareas valían sólo para la tarea que se iba a poner; la que ya
// estaba en la carta sólo se podía mover o borrar. Ahora:
//   · un clic sobre una tarea ya puesta (carta 2D y ⛰️ 3D) abre su recuadro: cambiarla por otra tarea táctica del
//     RC-02-108 (las 28 del panel, por grupo), cambiar la magnitud, ➖ Achicar / ➕ Agrandar (y la barra, 30 % a 400 %),
//     girarla (↺ / ↻ 15° y 45°, ↻ 180°, hacia N, NE… o la barra de 0° a 359°), ⧉ Poner otra igual al lado y
//     ↺ Restablecer (0° y 100 %);
//   · el recuadro sigue abierto mientras se la edita (la carta se vuelve a dibujar con cada cambio) y se cierra con la
//     ✕, tocando afuera o al arrastrar la tarea;
//   · cada cambio entra en ↶ Deshacer (mover no, como antes);
//   · el panel 🎯 Tareas avisa que un clic sobre una tarea puesta la edita.
// Se guarda lo mismo que antes (tarea, escalon, escala, rot, centro), así que el ⛰️ 3D, el 🏙️ Google 3D y el KMZ toman
// los cambios sin tocarlos.
//
// SHA-256 de index-suelo-20261023.js (antes de estos reemplazos): b2464c1e5869d997d8eb26b553fcd96947a70cc21af2ca5c2f7837c1ab260fcc
const EDITOR =
  'let SIDTareaAb=null;' +
  'function SIDTareaEditor(mk,dt,i,n,px,U){' +
  'const L=Rt.DomUtil.create("div","popup-magnitud sid-tarea-ed"),esc=dt.escala||1,rot=((dt.rot||0)%360+360)%360,' +
  'px0=px/esc,clave=String(dt.centro),' +
  'B=\'style="flex:1;padding:3px 2px;cursor:pointer"\',T=\'style="font-size:10px;opacity:.75;margin:6px 0 2px"\',' +
  'rumbos=[[0,"N — Norte"],[45,"NE"],[90,"E — Este"],[135,"SE"],[180,"S — Sur"],[225,"SO"],[270,"O — Oeste"],[315,"NO"]],' +
  'grupos=mY.map(g=>`<optgroup label="${g.nombre}">${zg.filter(z=>z.cat===g.id).map(z=>`<option value="${z.id}"${z.id===lb(dt.tarea).id?" selected":""}>${z.nombre}</option>`).join("")}</optgroup>`).join("");' +
  'L.innerHTML=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px"><span data-prev style="flex:0 0 40px;height:40px;display:flex;align-items:center;justify-content:center">${cb(dt.tarea,34,F1,rot)}</span><b>🎯 Tarea táctica</b></div>' +
  '<div ${T}>Cambiar por otra tarea táctica</div><select data-tarea style="width:100%;padding:3px">${grupos}</select>' +
  '<div ${T}>Magnitud de la unidad</div><select data-mag style="width:100%;padding:3px">${f8.map(m=>`<option value="${m.id}"${(dt.escalon||"batallon")===m.id?" selected":""}>${m.nombre}</option>`).join("")}</select>' +
  '<div ${T}>Tamaño <b data-tam>${Math.round(esc*100)} %</b></div><div style="display:flex;gap:4px"><button data-k="0.8" ${B}>➖ Achicar</button><button data-k="1.25" ${B}>➕ Agrandar</button></div><input data-esc type="range" min="0.3" max="4" step="0.05" value="${esc}" style="width:100%;margin:4px 0 0">' +
  '<div ${T}>Dirección <b data-dir>${rot}°</b></div><div style="display:flex;gap:4px"><button data-g="-45" ${B}>↺ 45°</button><button data-g="-15" ${B}>↺ 15°</button><button data-g="15" ${B}>↻ 15°</button><button data-g="45" ${B}>↻ 45°</button></div>' +
  '<div style="display:flex;gap:4px;margin-top:4px"><select data-rumbo style="flex:2;padding:3px">${rumbos.some(([g])=>g===rot)?"":`<option value="" selected>Hacia ${rot}°</option>`}${rumbos.map(([g,t])=>`<option value="${g}"${g===rot?" selected":""}>Hacia el ${t}</option>`).join("")}</select><button data-g="180" ${B}>↻ 180°</button></div><input data-rot type="range" min="0" max="359" step="1" value="${rot}" style="width:100%;margin:4px 0 0">' +
  '<div style="display:flex;gap:4px;margin-top:6px"><button data-dup ${B}>⧉ Poner otra igual</button><button data-res ${B}>↺ Restablecer</button></div>' +
  '<div style="font-size:10px;opacity:.7;margin-top:5px">Arrastrá el símbolo para moverlo · clic derecho: borrar · otras tareas: panel 🎯 Tareas</div>`;' +
  // Que los clics del recuadro no lleguen a la carta (en el ⛰️ 3D el recuadro va dentro de la de MapLibre).
  '["click","dblclick","mousedown","pointerdown","touchstart","wheel","contextmenu"].forEach(ev=>L.addEventListener(ev,e=>e.stopPropagation()));' +
  'const q=s=>L.querySelector(s),C=c=>U(i,c),E=v=>Math.round(Math.max(.3,Math.min(4,v))*100)/100,G=v=>(Math.round(v)%360+360)%360,' +
  // Mientras se corre una barra: el número y (en la carta 2D) el símbolo; el cambio se guarda al soltarla.
  'ver=(s,r)=>{q("[data-tam]").textContent=Math.round(s*100)+" %";q("[data-dir]").textContent=r+"°";q("[data-prev]").innerHTML=cb(dt.tarea,34,F1,r);' +
  'if(mk._icon&&!mk._icon.closest(".m3d-mk")){const p=Math.round(px0*s);mk.setIcon(Rt.divIcon({html:cb(dt.tarea,p,F1,r),iconSize:[p,p],iconAnchor:[p/2,p/2],className:"sid-suelo"}))}};' +
  'q("[data-tarea]").addEventListener("change",e=>C({tarea:e.target.value}));' +
  'q("[data-mag]").addEventListener("change",e=>C({escalon:e.target.value}));' +
  'L.querySelectorAll("[data-k]").forEach(b=>b.addEventListener("click",()=>C({escala:E(esc*Number(b.dataset.k))})));' +
  'L.querySelectorAll("[data-g]").forEach(b=>b.addEventListener("click",()=>C({rot:G(rot+Number(b.dataset.g))})));' +
  'q("[data-rumbo]").addEventListener("change",e=>{e.target.value!==""&&C({rot:G(Number(e.target.value))})});' +
  'q("[data-esc]").addEventListener("input",e=>ver(E(Number(e.target.value)),rot));' +
  'q("[data-esc]").addEventListener("change",e=>C({escala:E(Number(e.target.value))}));' +
  'q("[data-rot]").addEventListener("input",e=>ver(esc,G(Number(e.target.value))));' +
  'q("[data-rot]").addEventListener("change",e=>C({rot:G(Number(e.target.value))}));' +
  'q("[data-res]").addEventListener("click",()=>C({rot:0,escala:1}));' +
  'q("[data-dup]").addEventListener("click",()=>{const m=mk._map;let c=[dt.centro[0],dt.centro[1]];' +
  'if(m){const p=m.latLngToContainerPoint([dt.centro[1],dt.centro[0]]),ll=m.containerPointToLatLng([p.x+px+10,p.y]);c=[Math.round(ll.lng*1e6)/1e6,Math.round(ll.lat*1e6)/1e6]}' +
  'SIDTareaAb={i:n,n:n+1,c:String(c)};C({duplicar:c})});' +
  // Al volver a dibujar la carta, la tarea vieja se quita (y su recuadro se cierra): eso no cuenta como cerrarlo.
  'mk.on("remove",()=>{mk._sidQuita=!0});' +
  'mk.bindPopup(L,{minWidth:236,maxWidth:260,className:"sid-tarea-pop",autoPanPaddingTopLeft:[20,70]});' +
  'mk.on("popupopen",()=>{SIDTareaAb={i,n,c:clave}});' +
  'mk.on("popupclose",()=>{mk._sidQuita||(SIDTareaAb=null)});' +
  'mk.on("dragstart",()=>{SIDTareaAb=null;mk.closePopup()});' +
  'SIDTareaAb&&SIDTareaAb.i===i&&SIDTareaAb.n===n&&SIDTareaAb.c===clave&&setTimeout(()=>{mk._map&&!mk.isPopupOpen()&&mk.openPopup()},0)}'

module.exports = [
  {
    nombre: 'El recuadro para editar una tarea táctica ya puesta',
    viejo: 'function EF(t,e,n=1){const a=vY(t,e,n);',
    nuevo: EDITOR + 'function EF(t,e,n=1){const a=vY(t,e,n);',
    veces: 1,
  },
  {
    nombre: 'Carta 2D: un clic sobre la tarea abre su recuadro',
    viejo: 'nn.on("dragend",()=>{const cn=nn.getLatLng();U?.(ft,{lat:Math.round(cn.lat*1e6)/1e6,lng:Math.round(cn.lng*1e6)/1e6})}))});',
    nuevo: 'nn.on("dragend",()=>{const cn=nn.getLatLng();U?.(ft,{lat:Math.round(cn.lat*1e6)/1e6,lng:Math.round(cn.lng*1e6)/1e6})}),U&&SIDTareaEditor(nn,dt,ft,(T.tareas||[]).length,mt,U))});',
    veces: 1,
  },
  {
    nombre: 'onMoverTarea: además de mover, cambiar la tarea (con ↶ Deshacer) o poner otra igual',
    viejo: 'UN=je.useCallback((Ee,{lat:Qe,lng:ot})=>Sn(ct=>({...ct,tareas:ct.tareas.map((xt,Qt)=>Qt===Ee?{...xt,centro:[ot,Qe]}:xt)})),[]),',
    nuevo: 'UN=je.useCallback((Ee,SIDc)=>{const SIDm=!!SIDc&&SIDc.lat!=null;SIDm||la();Sn(ct=>{const SIDt=ct.tareas||[];if(SIDc&&SIDc.duplicar)return SIDt[Ee]?{...ct,tareas:[...SIDt,{...SIDt[Ee],centro:SIDc.duplicar}]}:ct;return{...ct,tareas:SIDt.map((xt,Qt)=>Qt!==Ee?xt:SIDm?{...xt,centro:[SIDc.lng,SIDc.lat]}:{...xt,...SIDc})}})},[la]),',
    veces: 1,
  },
  {
    nombre: 'Panel 🎯 Tareas: avisa que un clic sobre una tarea puesta la edita',
    viejo: 'f.jsx("div",{style:zr.tipOff,children:"Elegí un símbolo y luego hacé clic en el mapa."})',
    nuevo: 'f.jsx("div",{style:zr.tipOff,children:"Elegí un símbolo y luego hacé clic en el mapa. Para agrandar, achicar, girar o cambiar una tarea ya puesta, hacé clic sobre ella."})',
    veces: 1,
  },
]
