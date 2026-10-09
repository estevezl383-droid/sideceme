// Reemplazos hechos el 2026-10-03 (séptima vuelta) sobre el compilado de la Mesa del EM
// (calcos/assets/index-trazos-20261003.js → index-edicion-20261003.js).
//
// Lo pidió Sergio: editar las figuras como en Google Earth. Pasaba esto:
//   · Con una herramienta de línea o área encendida (y se quedan encendidas), las figuras no
//     respondían al clic: no se podía editar ni borrar la línea recién dibujada.
//   · El Área de Operaciones no estaba en las listas de «mover vértice» ni de «borrar»: no se
//     podía corregir ni borrar (el clic derecho preguntaba y no hacía nada).
//   · El clic derecho mientras se trazaba el frente del Área de Operaciones borraba TODO el frente.
//   · Una línea sólo permitía mover vértices; no agregar ni quitar uno, sólo borrarla entera.
//   · El panel del Área de Operaciones tenía tres cuadros de explicación que tapaban las
//     herramientas, y «Magnitud que se va a colocar» dejaba elegir cualquier escalón.
//   · El Área de Influencia la dibujaba la app, y el borde del Área de Interés no tenía un
//     botón a mano para apagarlo.
//
// Ahora, en TODAS las líneas y áreas de la Mesa (límites, Área de Operaciones, Área de Influencia,
// áreas y sectores logísticos, ejes, líneas del EM, flechas, obstáculos):
//   · Mientras no haya un trazo en curso, la figura se toca aunque haya una herramienta
//     encendida; el cursor sobre ella es una manito. Alt (Opción) + clic atraviesa la figura.
//   · Un clic la selecciona: halo celeste, manijas en cada vértice (arrastrar = mover) y un ⚪
//     en el medio de cada tramo (clic o arrastre = agregar un punto).
//   · Clic derecho sobre un punto o sobre la figura = menú «Borrar este punto / el punto más
//     cercano», «Borrar toda la figura», «Cancelar».
//   · Sólo el BORDE de las áreas se toca (antes el interior elegía el área y no se podía
//     empezar una línea adentro con una herramienta encendida).
//   · Clic derecho mientras se traza = borrar el último punto (como «↶ BORRAR ÚLTIMO»).
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer
// «veces» veces) y se cambió por «nuevo». construir-edicion.js arma el compilado y comprueba
// que deshaciéndolos se vuelve byte por byte al anterior.

module.exports = [
  {
    nombre: "Edición de figuras · ayudantes: vértices, menú de clic derecho, manijas, cursor de mano",
    // Módulo: lógica pura (SIDEditaVertices), el menú «Borrar este punto / Borrar toda la figura»,
    // las manijas de vértice y de punto medio, y el cursor de mano sobre las figuras de la carta.
    viejo: "function Ave({herramienta:t,",
    nuevo: [
      "typeof document<\"u\"&&!document.getElementById(\"sid-edicion-css\")&&(()=>{const SIDs=document.createElement(\"style\");SIDs.id=\"sid-edicion-css\";SIDs.textContent=\".leaflet-container canvas.leaflet-interactive{cursor:grab!important}.leaflet-container canvas.leaflet-interactive:active{cursor:grabbing!important}.menu-figura button:focus-visible{outline:2px solid #6aa6ff}\";document.head.appendChild(SIDs)})();",
      "const SIDnop=()=>{};",
      "const SIDEd={agregarV:null,borrarV:null,deseleccionar:null};",
      "const SIDCLAVES={limite:\"limites\",zonaLog:\"zonasLog\",sectorLog:\"sectoresLog\",ejeLog:\"ejesLog\",lineaEM:\"lineasEM\",flechaZona:\"flechasZona\",obstaculo:\"obstaculos\"};",
      "const SIDMitadIcono=Rt.divIcon({className:\"\",html:'<div style=\"width:11px;height:11px;background:rgba(255,255,255,.72);border:2px solid #000;border-radius:50%;box-shadow:0 0 2px rgba(0,0,0,.5);cursor:copy\"></div>',iconSize:[11,11],iconAnchor:[5.5,5.5]});",
      "const SIDAyudaEdicion=\"✋ Arrastrá un punto para moverlo · tocá un ⚪ del medio de un tramo para agregar uno · clic derecho: borrar un punto o la figura\";",
      "function SIDMinimo(f,cat){return cat===\"zonaLog\"||cat===\"sectorLog\"||cat===\"areaOps\"||cat===\"influenciaTrazada\"||cat===\"obstaculo\"&&f&&Nm[f.tipo]&&Nm[f.tipo].forma===\"area\"?3:2}",
      "function SIDAjustaAO(f,g,acc){",
      "if(!f.frente||f.frente.length<2){const m=pF(g.coords);return m?{...g,frenteM:Math.round(m.frenteM),profM:Math.round(m.profM),azimut:m.azimut}:g}",
      "let nf=f.frente.length;",
      "if(acc.t===\"agregar\"&&acc.i>=0&&acc.i+1<=nf-1)nf++;",
      "else if(acc.t===\"borrar\"&&acc.i<nf)nf--;",
      "if(nf<2)nf=Math.min(2,g.coords.length);",
      "const fr=g.coords.slice(0,nf),co=g.coords.slice(nf),m=co.length?zK(fr,co):null;",
      "return{...g,frente:fr,frenteM:Math.round(fF(fr)),profM:m?Math.round(m.profM):f.profM||0,azimut:m&&m.eje?m.eje.azimut:f.azimut}",
      "}",
      "function SIDEditaVertices(ops,cat,idx,acc){",
      "const k=SIDCLAVES[cat],unico=cat===\"areaOps\"||cat===\"influenciaTrazada\",f=unico?ops[cat]:k&&(ops[k]||[])[idx];",
      "if(!f||!Array.isArray(f.coords))return ops;",
      "const c=f.coords.slice(),min=SIDMinimo(f,cat);",
      "if(acc.t===\"mover\"){if(!(acc.i>=0&&acc.i<c.length))return ops;c[acc.i]=acc.p}",
      "else if(acc.t===\"agregar\"){if(cat===\"flechaZona\"||!(acc.i>=-1&&acc.i<c.length))return ops;c.splice(acc.i+1,0,acc.p)}",
      "else if(acc.t===\"borrar\"){if(c.length<=min||!(acc.i>=0&&acc.i<c.length))return ops;c.splice(acc.i,1)}",
      "else return ops;",
      "let g={...f,coords:c};",
      "if(cat===\"areaOps\")g=SIDAjustaAO(f,g,acc);",
      "return unico?{...ops,[cat]:g}:{...ops,[k]:ops[k].map((o,j)=>j===idx?g:o)}",
      "}",
      "function SIDMagSinLimite(m,i){return(m||[]).filter(x=>x.origen!==\"limite-\"+i).map(x=>{const r=/^limite-(\\d+)$/.exec(x.origen||\"\");return r&&+r[1]>i?{...x,origen:\"limite-\"+(+r[1]-1)}:x})}",
      "function SIDMagSinZona(m,z){return z&&z.clave?(m||[]).filter(x=>x.origen!==\"zona-\"+z.clave):m}",
      "function SIDEscalonesAO(ao){",
      "try{",
      "if(!ao||!Array.isArray(ao.coords)||ao.coords.length<3)return null;",
      "const I=ao.frenteM!=null?ao:pF(ao.coords);if(!I)return null;",
      "const r=w5({tipo:ao.tipo||\"defensiva\",ambiente:ao.ambiente||\"llano\",frenteM:I.frenteM,profM:I.profM});",
      "if(r.estado===\"entre\"&&r.entre&&r.entre[0]&&r.entre[1])return[r.entre[0].escalon,r.entre[1].escalon];",
      "return r.banda?[r.banda.escalon]:null",
      "}catch(_){return null}",
      "}",
      "function SIDOpEsc(lista,ao){const p=SIDEscalonesAO(ao);return p?lista.filter(x=>p.includes(x.id)):lista}",
      "function SIDCierraMenu(){document.querySelectorAll(\".menu-figura\").forEach(e=>e.remove())}",
      "function SIDMenuFigura(c){",
      "SIDCierraMenu();",
      "const d=document.createElement(\"div\");d.className=\"menu-figura\";d.setAttribute(\"role\",\"menu\");",
      "d.style.cssText=\"position:fixed;z-index:2600;min-width:210px;max-width:min(320px,calc(100vw - 16px));background:rgba(10,14,22,.98);color:#eef3fb;border:1px solid #4b5a74;border-radius:9px;box-shadow:0 10px 28px rgba(0,0,0,.6);padding:5px;font:600 13px/1.3 Arial,sans-serif\";",
      "if(c.titulo){const t=document.createElement(\"div\");t.style.cssText=\"padding:5px 9px 6px;font:700 11px Arial,sans-serif;letter-spacing:.4px;color:#9fb6d6;text-transform:uppercase;border-bottom:1px solid #2a3550;margin-bottom:4px\";t.textContent=c.titulo;d.append(t)}",
      "let hecho=!1;",
      "const fuera=e=>{d.contains(e.target)||cerrar()},tecla=e=>{if(e.key===\"Escape\"){e.stopPropagation();cerrar()}},",
      "cerrar=()=>{if(hecho)return;hecho=!0;d.remove();document.removeEventListener(\"pointerdown\",fuera,!0);document.removeEventListener(\"keydown\",tecla,!0);window.removeEventListener(\"blur\",cerrar);c.alCerrar&&c.alCerrar()};",
      "for(const it of c.items){",
      "const b=document.createElement(\"button\");b.type=\"button\";b.textContent=it.t;b.disabled=!!it.off;if(it.nota)b.title=it.nota;",
      "b.style.cssText=\"display:block;width:100%;text-align:left;cursor:\"+(it.off?\"not-allowed\":\"pointer\")+\";background:transparent;border:0;border-radius:6px;padding:8px 10px;font:600 13px Arial,sans-serif;color:\"+(it.off?\"#6c7a92\":it.peligro?\"#ff9d9d\":\"#eef3fb\");",
      "if(!it.off){b.onmouseenter=()=>{b.style.background=\"#1c2a44\"};b.onmouseleave=()=>{b.style.background=\"transparent\"}}",
      "b.addEventListener(\"click\",e=>{e.preventDefault();e.stopPropagation();cerrar();it.fn&&it.fn()});",
      "d.append(b)",
      "}",
      "for(const n of[\"mousedown\",\"touchstart\",\"click\",\"dblclick\",\"wheel\"])d.addEventListener(n,v=>v.stopPropagation());",
      "d.addEventListener(\"contextmenu\",v=>{v.preventDefault();v.stopPropagation()});",
      "document.body.appendChild(d);",
      "const r=d.getBoundingClientRect();",
      "d.style.left=Math.max(6,Math.min(c.x,window.innerWidth-r.width-6))+\"px\";d.style.top=Math.max(6,Math.min(c.y,window.innerHeight-r.height-6))+\"px\";",
      "document.addEventListener(\"pointerdown\",fuera,!0);document.addEventListener(\"keydown\",tecla,!0);window.addEventListener(\"blur\",cerrar);",
      "return cerrar",
      "}",
      "function SIDMasCercano(m,ll,co){let bi=-1,bd=1/0;try{const p=pxVista(m,ll);for(let i=0;i<co.length;i++){const d=p.distanceTo(pxVista(m,Rt.latLng(co[i][1],co[i][0])));d<bd&&(bd=d,bi=i)}}catch(_){}return bi}",
      "function SIDMenuDe(e,m,cat,idx,co,borrarFig,nombre,vi,area){",
      "const oe=e.originalEvent||{},x=(oe.clientX!=null?oe.clientX:24)+3,y=(oe.clientY!=null?oe.clientY:24)+3,min=area?3:2,tiene=Array.isArray(co)&&co.length>0&&!!SIDEd.borrarV&&cat!==\"flechaZona\";",
      "let i=vi,aro=null;",
      "if(tiene&&!(i>=0)&&e.latlng)i=SIDMasCercano(m,e.latlng,co);",
      "if(tiene&&i>=0&&m)try{aro=Rt.circleMarker([co[i][1],co[i][0]],{radius:10,color:\"#ff3b3b\",weight:3,fill:!1,interactive:!1}).addTo(m)}catch(_){}",
      "const items=[];",
      "if(tiene){const puede=co.length>min&&i>=0;items.push({t:vi>=0?\"📍 Borrar este punto\":\"📍 Borrar el punto más cercano\",off:!puede,nota:co.length>min?\"\":\"Hacen falta al menos \"+min+\" puntos: borrá toda la figura\",fn:()=>SIDEd.borrarV(cat,idx,i)})}",
      "items.push({t:\"🗑 Borrar toda la figura\",peligro:!0,fn:()=>{SIDEd.deseleccionar&&SIDEd.deseleccionar();borrarFig(cat,idx)}},{t:\"✕ Cancelar\"});",
      "SIDMenuFigura({x,y,titulo:nombre?nombre.charAt(0).toUpperCase()+nombre.slice(1):\"\",items,alCerrar:()=>{aro&&m&&m.removeLayer(aro)}})",
      "}",
      "function SIDBorde(g,pg,dn){const ring=pg.getLatLngs()[0],b=Rt.polyline(ring.concat([ring[0]]),{color:\"#000\",weight:14,opacity:.01,lineCap:\"round\",interactive:!!dn}).addTo(g);b._sidArea=!0;return b}",
      "function SIDResalte(g,co,area){const ll=co.map(p=>[p[1],p[0]]);Rt.polyline(area?ll.concat([ll[0]]):ll,{color:\"#00e5ff\",weight:11,opacity:.3,lineCap:\"round\",interactive:!1}).addTo(g)}",
      "function SIDRedondea(ll){return[Math.round(ll.lng*1e6)/1e6,Math.round(ll.lat*1e6)/1e6]}",
      "function SIDManijas(g,m,cat,idx,co,area,mover,nombre,borrarFig){",
      "const n=co.length;",
      "co.forEach((p,i)=>{",
      "const mk=Rt.marker([p[1],p[0]],{icon:xve,draggable:!0,zIndexOffset:2100}).addTo(g);",
      "mk.on(\"click\",e=>Rt.DomEvent.stop(e));",
      "mk.on(\"dragend\",()=>mover(cat,idx,i,SIDRedondea(mk.getLatLng())));",
      "mk.on(\"contextmenu\",e=>{Rt.DomEvent.stop(e);e.originalEvent&&Rt.DomEvent.preventDefault(e.originalEvent);SIDMenuDe(e,m,cat,idx,co,borrarFig,nombre,i,area)})",
      "});",
      "if(cat===\"flechaZona\")return;",
      "const tramos=area?n:n-1;",
      "for(let i=0;i<tramos;i++){",
      "const a=co[i],b=co[(i+1)%n],mid=[Math.round((a[0]+b[0])/2*1e6)/1e6,Math.round((a[1]+b[1])/2*1e6)/1e6],",
      "mk=Rt.marker([mid[1],mid[0]],{icon:SIDMitadIcono,draggable:!0,zIndexOffset:2050}).addTo(g);",
      "mk.on(\"click\",e=>{Rt.DomEvent.stop(e);SIDEd.agregarV&&SIDEd.agregarV(cat,idx,i,mid)});",
      "mk.on(\"dragend\",()=>{SIDEd.agregarV&&SIDEd.agregarV(cat,idx,i,SIDRedondea(mk.getLatLng()))});",
      "mk.on(\"contextmenu\",e=>{Rt.DomEvent.stop(e);e.originalEvent&&Rt.DomEvent.preventDefault(e.originalEvent);SIDMenuDe(e,m,cat,idx,co,borrarFig,nombre,-1,area)})",
      "}",
      "}",
      "const SIDNOMBRES={limite:\"Línea / límite\",zonaLog:\"Área logística\",sectorLog:\"Sector logístico\",ejeLog:\"Eje logístico\",lineaEM:\"Línea\",flechaZona:\"Flecha\",obstaculo:\"Obstáculo\",areaOps:\"Área de Operaciones\",influenciaTrazada:\"Área de Influencia\"};",
      "function Ave({herramienta:t,",
    ].join(''),
    veces: 1,
  },
  {
    nombre: "Edición de figuras · el clic derecho abre el menú (no un confirm) y vale para todas las figuras",
    viejo: "function yo(t,e,n,a,i){!e||!t||t.on(\"contextmenu\",o=>{Rt.DomEvent.stop(o),window.confirm(`¿Borrar ${i}?`)&&e(n,a)})}",
    nuevo: "function yo(t,e,n,a,i){if(!e||!t)return;const SIDh=o=>{Rt.DomEvent.stop(o);o.originalEvent&&Rt.DomEvent.preventDefault(o.originalEvent);SIDMenuDe(o,t._map,n,a,t._sidCoords,e,i,-1,t instanceof Rt.Polygon||!!t._sidArea)};[t].concat(t._sidHermanas||[]).forEach(x=>x.on(\"contextmenu\",SIDh))}",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · «influencia» es una herramienta de área",
    viejo: "Dt=[\"limite\",\"linea\",\"lineaPunteada\",\"flecha\",\"desplazamiento\",\"zonalog\",\"areaops\",\"epa\",\"epe\",\"extraviados\",\"ppgg\",\"humanitario\"].includes(t)",
    nuevo: "Dt=[\"limite\",\"linea\",\"lineaPunteada\",\"flecha\",\"desplazamiento\",\"zonalog\",\"areaops\",\"epa\",\"epe\",\"extraviados\",\"ppgg\",\"humanitario\",\"influencia\"].includes(t)",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · hay un trazo en curso, y quién deselecciona",
    // Mientras NO haya un trazo en curso las figuras se pueden tocar aunque haya una herramienta
    // de línea o área encendida (antes, con la herramienta encendida no se podía editar nada).
    viejo: "SIDAcc.current={dt:Dt,terminar:()=>SIDTermina(null),",
    nuevo: "const SIDEnTrazo=Se.length>0||!!Ie;SIDEd.deseleccionar=()=>ne(null);SIDAcc.current={dt:Dt,terminar:()=>SIDTermina(null),",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · las líneas y áreas son tocables si no hay un trazo en curso",
    viejo: "dn=!ve,Ra=S?.areaOps!==!1,di=_e.getZoom(),",
    nuevo: "dn=!ve,SIDed=!ve||Dt&&!SIDEnTrazo,Ra=S?.areaOps!==!1,di=_e.getZoom(),",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · se vuelve a dibujar al empezar o terminar un trazo; Esc suelta la figura",
    viejo: ",Z,pe,ve,Ge,oe,de,he]),je.useEffect(()=>{ve&&ne(null)},[ve]),null}",
    nuevo: ",Z,pe,ve,Ge,oe,de,he,SIDEnTrazo,Dt]),je.useEffect(()=>{ve&&ne(null)},[ve]),je.useEffect(()=>{if(!Ge)return;const SIDk=SIDe=>{SIDe.key===\"Escape\"&&ne(null)};window.addEventListener(\"keydown\",SIDk);return()=>window.removeEventListener(\"keydown\",SIDk)},[Ge]),null}",
    veces: 1,
  },
  {
    nombre: "Trazos (Ave) · clic derecho = borrar el último punto (antes borraba TODO el frente, o terminaba la línea)",
    // En el frente del Área de Operaciones el clic derecho sacaba TODOS los puntos; en el contorno
    // sin vértices también. Ahora hace lo mismo que «↶ BORRAR ÚLTIMO»: saca el último punto y
    // vuelve al anterior; sin puntos de contorno, reabre el frente. En las demás líneas ya no
    // TERMINA el trazo (terminar: doble clic, Enter o la barra).
    viejo: "contextmenu(bn){if(t===\"areaops\"){(Ie||Se.length)&&(Rt.DomEvent.preventDefault(bn.originalEvent),He(\"\"),Ie&&lt.current.length?ge(lt.current.slice(0,-1)):(Te(null),ge([]),Ae([])));return}Dt&&Se.length&&(Rt.DomEvent.preventDefault(bn.originalEvent),jt())}",
    nuevo: "contextmenu(bn){if(Dt&&(Se.length||Ie)){Rt.DomEvent.preventDefault(bn.originalEvent);SIDAcc.current.deshacer()}}",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · una línea con marcas de magnitud: todos sus tramos se tocan",
    viejo: "for(const Nn of nn){const Vt=B1(_n,fa(Nn),ft);cn||(cn=Vt)}return cn||B1(_n,fa(dt),ft)}",
    nuevo: "const SIDh=[];for(const Nn of nn){const Vt=B1(_n,fa(Nn),ft);cn?SIDh.push(Vt):cn=Vt}cn&&(cn._sidHermanas=SIDh);return cn||B1(_n,fa(dt),ft)}",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · tocar una figura la selecciona: manijas de vértice, ⚪ para agregar, halo",
    // Antes sólo había manijas de vértice (y no en el Área de Operaciones). Ahora: halo celeste,
    // manijas arrastrables, ⚪ en el medio de cada tramo (clic o arrastre = agregar un punto) y
    // clic derecho sobre un punto = menú. Con Alt (Opción) el clic atraviesa la figura (para
    // empezar un trazo encima de otra).
    viejo: "const Ua=(dt,ft,mt,Kt,nn)=>{var cn;if(!dt)return;const Nn=Ge&&Ge.cat===ft&&Ge.idx===mt;if(dt.bindTooltip(`${Kt}<div class=\"tt-sub\">✋ arrastrá los puntos para corregir · clic derecho: borrar</div>`,{permanent:!0,direction:\"top\",className:\"tt-medida\",opacity:.97}),Nn?dt.openTooltip(Ge.latlng||((cn=dt.getBounds)==null?void 0:cn.call(dt).getCenter())):dt.closeTooltip(),dt.on(\"click\",Vt=>{Rt.DomEvent.stop(Vt),Ke.current=Date.now(),ne(Nn?null:{cat:ft,idx:mt,latlng:Vt.latlng})}),Nn&&q&&(ft===\"zonaLog\"||ft===\"sectorLog\"))try{nve(_n,dt.getBounds(),ft,mt,q)}catch{}Nn&&G&&Array.isArray(nn)&&nn.forEach((Vt,Pt)=>{const Zt=Rt.marker([Vt[1],Vt[0]],{icon:xve,draggable:!0,zIndexOffset:2100}).addTo(_n);Zt.on(\"click\",Lt=>Rt.DomEvent.stop(Lt)),Zt.on(\"dragend\",()=>{const Lt=Zt.getLatLng();G(ft,mt,Pt,[Math.round(Lt.lng*1e6)/1e6,Math.round(Lt.lat*1e6)/1e6])})})}",
    nuevo: "const Ua=(dt,ft,mt,Kt,nn)=>{var cn;if(!dt)return;const Nn=Ge&&Ge.cat===ft&&Ge.idx===mt,SIDcs=[dt].concat(dt._sidHermanas||[]),SIDarea=dt instanceof Rt.Polygon||!!dt._sidArea;dt._sidCoords=Array.isArray(nn)?nn:null;dt.bindTooltip(`${Kt}<div class=\"tt-sub\">${SIDAyudaEdicion}</div>`,{permanent:!0,direction:\"top\",className:\"tt-medida\",opacity:.97});Nn?dt.openTooltip(Ge.latlng||((cn=dt.getBounds)==null?void 0:cn.call(dt).getCenter())):dt.closeTooltip();SIDcs.forEach(SIDx=>{SIDx.on(\"mouseover\",SIDnop);SIDx.on(\"click\",Vt=>{if(Dt&&Vt.originalEvent&&Vt.originalEvent.altKey){Rt.DomEvent.stop(Vt);_e.fire(\"click\",{latlng:Vt.latlng,layerPoint:Vt.layerPoint,containerPoint:Vt.containerPoint,originalEvent:Vt.originalEvent});return}Rt.DomEvent.stop(Vt);Ke.current=Date.now();ne(Nn?null:{cat:ft,idx:mt,latlng:Vt.latlng})})});if(Nn&&q&&(ft===\"zonaLog\"||ft===\"sectorLog\"))try{nve(_n,dt.getBounds(),ft,mt,q)}catch{}if(Nn&&G&&Array.isArray(nn)){SIDResalte(_n,nn,SIDarea);SIDManijas(_n,_e,ft,mt,nn,SIDarea,G,SIDNOMBRES[ft]||\"Figura\",j)}}",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · Área de Operaciones: sólo el borde se toca y se edita",
    viejo: "const dt=Rt.polygon(fa(T.areaOps.coords),{color:hd,weight:4,fillColor:hd,fillOpacity:.03,interactive:dn}).addTo(_n);if(dn){yo(dt,j,\"areaOps\",0,\"el Área de Operaciones\");",
    nuevo: "const SIDpg=Rt.polygon(fa(T.areaOps.coords),{color:hd,weight:4,fillColor:hd,fillOpacity:.03,interactive:!1}).addTo(_n),dt=SIDBorde(_n,SIDpg,SIDed);if(SIDed){yo(dt,j,\"areaOps\",0,\"el Área de Operaciones\");",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · sector logístico: sólo el borde se toca",
    viejo: "Kt=Rt.polygon(fa(dt.coords),{color:mt,weight:1.6,dashArray:\"7 5\",fillColor:mt,fillOpacity:.07,interactive:dn}).addTo(_n);",
    nuevo: "SIDpg=Rt.polygon(fa(dt.coords),{color:mt,weight:1.6,dashArray:\"7 5\",fillColor:mt,fillOpacity:.07,interactive:!1}).addTo(_n),Kt=SIDBorde(_n,SIDpg,SIDed);",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · obstáculo de área: sólo el borde se toca",
    viejo: "const Sn=Rt.polygon(fa(dt.coords),{color:Dp,weight:nn.grosor||2.6,opacity:.95,dashArray:nn.punteado||cn?\"8 6\":null,fillColor:Dp,fillOpacity:.07,interactive:dn}).addTo(_n);if(dn){yo(Sn,j,\"obstaculo\",ft,`este ${nn.nom.toLowerCase()}`);",
    nuevo: "const SIDpg=Rt.polygon(fa(dt.coords),{color:Dp,weight:nn.grosor||2.6,opacity:.95,dashArray:nn.punteado||cn?\"8 6\":null,fillColor:Dp,fillOpacity:.07,interactive:!1}).addTo(_n),Sn=SIDBorde(_n,SIDpg,SIDed);if(SIDed){yo(Sn,j,\"obstaculo\",ft,`este ${nn.nom.toLowerCase()}`);",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · límites: tocables si no hay un trazo en curso",
    viejo: "Kt=Yn(dt.coords,{weight:4.5,dashArray:mt?\"10 7\":null,interactive:dn});if(dn&&(yo(Kt,j,\"limite\",ft,\"esta línea / límite\"),",
    nuevo: "Kt=Yn(dt.coords,{weight:4.5,dashArray:mt?\"10 7\":null,interactive:SIDed});if(SIDed&&(yo(Kt,j,\"limite\",ft,\"esta línea / límite\"),",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · ejes logísticos: tocables si no hay un trazo en curso",
    viejo: "dashArray:mt?\"11 7\":null,interactive:dn}).addTo(_n);if(dn&&(yo(cn,j,\"ejeLog\"",
    nuevo: "dashArray:mt?\"11 7\":null,interactive:SIDed}).addTo(_n);if(SIDed&&(yo(cn,j,\"ejeLog\"",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · líneas del EM: tocables si no hay un trazo en curso",
    viejo: "dashArray:mt.guion,interactive:dn}).addTo(_n);dn&&(yo(nn,j,\"lineaEM\"",
    nuevo: "dashArray:mt.guion,interactive:SIDed}).addTo(_n);SIDed&&(yo(nn,j,\"lineaEM\"",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · flechas de zona: tocables si no hay un trazo en curso (1/2)",
    viejo: "const Kt=B1(_n,mt,{weight:3,interactive:dn});for(const[cn,Nn]of",
    nuevo: "const Kt=B1(_n,mt,{weight:3,interactive:SIDed});for(const[cn,Nn]of",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · flechas de zona: tocables si no hay un trazo en curso (2/2)",
    viejo: ",dn&&(yo(Kt,j,\"flechaZona\"",
    nuevo: ",SIDed&&(yo(Kt,j,\"flechaZona\"",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · obstáculos de línea: tocables si no hay un trazo en curso",
    viejo: "dashArray:Nn,interactive:dn}).addTo(_n);dn&&(yo(Sn,j,\"obstaculo\",ft,`esta ${nn.nom.toLowerCase()}`)",
    nuevo: "dashArray:Nn,interactive:SIDed}).addTo(_n);SIDed&&(yo(Sn,j,\"obstaculo\",ft,`esta ${nn.nom.toLowerCase()}`)",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · áreas logísticas: sólo el borde se toca (sin cortar lo que insertó la lista de logística)",
    // El polígono de la lista de logística queda intacto (su texto lo comprueba logistica.cjs): se
    // le apaga lo tocable después de crearlo y se agrega el borde.
    viejo: "if(dn){if(yo(Kt,j,\"zonaLog\",ft,",
    nuevo: "Kt.options.interactive=!1;const SIDb=SIDBorde(_n,Kt,SIDed);if(SIDed){if(yo(SIDb,j,\"zonaLog\",ft,",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · áreas logísticas: el borde es el que se edita",
    viejo: "Ua(Kt,\"zonaLog\",ft,",
    nuevo: "Ua(SIDb,\"zonaLog\",ft,",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Ave) · sectores logísticos: sus manijas con el trazo parado",
    viejo: "if(dn){if(yo(Kt,j,\"sectorLog\"",
    nuevo: "if(SIDed){if(yo(Kt,j,\"sectorLog\"",
    veces: 1,
  },
  {
    nombre: "Área de Influencia (Ave) · se dibuja la que trazó el oficial, no la que calcula la app",
    // La app dibujaba sola el Área de Influencia (alcance del arma enemiga). Ahora la traza el
    // oficial con la herramienta «Dibujar el Área de Influencia» y se edita como cualquier figura.
    // El cálculo queda sólo como referencia en el panel.
    viejo: "((bn=i?.coords)==null?void 0:bn.length)>=3&&Ra&&S?.areaInfluencia!==!1){const dt=Rt.polygon(fa(i.coords),{color:\"#8b5cf6\",weight:2.5,dashArray:\"10 6\",fillColor:\"#8b5cf6\",fillOpacity:.04,interactive:!1}).addTo(_n);try{const ft=dt.getBounds().getNorthWest();Rt.marker(ft,{interactive:!1,icon:Rt.divIcon({className:\"rot-influencia\",html:`<div style=\"color:#8b5cf6;font:700 11px/1.2 Arial;text-shadow:0 0 3px #000,0 0 3px #000;white-space:nowrap\">ÁREA DE INFLUENCIA<br><span style=\"font-weight:400;font-size:10px\">${zm(i.radioM)} · ${((Pn=i.arma)==null?void 0:Pn.sistema)||\"\"}</span></div>`,iconSize:[180,26],iconAnchor:[-6,-6]})}).addTo(_n)}catch{}}",
    nuevo: "((bn=T.influenciaTrazada)==null?void 0:bn.coords)&&bn.coords.length>=3&&Ra&&S?.areaInfluencia!==!1){const SIDic=bn.coords,SIDpg=Rt.polygon(fa(SIDic),{color:\"#8b5cf6\",weight:2.5,dashArray:\"10 6\",fillColor:\"#8b5cf6\",fillOpacity:.04,interactive:!1}).addTo(_n),dt=SIDBorde(_n,SIDpg,SIDed);if(SIDed){yo(dt,j,\"influenciaTrazada\",0,\"el Área de Influencia\");let SIDm=0;try{SIDm=Hc(ml([[...SIDic,SIDic[0]]]))}catch{SIDm=0}Ua(dt,\"influenciaTrazada\",0,`◌ <b>ÁREA DE INFLUENCIA</b> · ${I5(SIDm)}`,SIDic)}try{const ft=SIDpg.getBounds().getNorthWest();Rt.marker(ft,{interactive:!1,icon:Rt.divIcon({className:\"rot-influencia\",html:'<div style=\"color:#8b5cf6;font:700 11px/1.2 Arial;text-shadow:0 0 3px #000,0 0 3px #000;white-space:nowrap\">ÁREA DE INFLUENCIA</div>',iconSize:[180,14],iconAnchor:[-6,-6]})}).addTo(_n)}catch{}}",
    veces: 1,
  },
  {
    nombre: "Área de Influencia (Ave) · cerrar el trazo con la herramienta «influencia»",
    viejo: "else t===\"zonalog\"?bn.length>=3&&(I(\"zonalog\",{coords:bn,zona:n}),He(\"\")):Tt?",
    nuevo: "else if(t===\"influencia\")bn.length>=3&&(I(\"influencia\",{coords:bn}),He(\"\"));else t===\"zonalog\"?bn.length>=3&&(I(\"zonalog\",{coords:bn,zona:n}),He(\"\")):Tt?",
    veces: 1,
  },
  {
    nombre: "Área de Influencia (Ave) · con menos de tres vértices avisa y no borra el trazo",
    viejo: "if(t===\"zonalog\"&&bn.length<3){He(\"MARCÁ AL MENOS TRES VÉRTICES PARA CERRAR EL ÁREA.\");window.alert(\"MARCÁ AL MENOS TRES VÉRTICES PARA CERRAR EL ÁREA.\");return}Ae([])",
    nuevo: "if(t===\"influencia\"&&bn.length>0&&bn.length<3){He(\"MARCÁ AL MENOS TRES VÉRTICES PARA CERRAR EL ÁREA.\");return}if(t===\"zonalog\"&&bn.length<3){He(\"MARCÁ AL MENOS TRES VÉRTICES PARA CERRAR EL ÁREA.\");window.alert(\"MARCÁ AL MENOS TRES VÉRTICES PARA CERRAR EL ÁREA.\");return}Ae([])",
    veces: 1,
  },
  {
    nombre: "Área de Influencia (Ave) · pide tres vértices",
    viejo: "SIDm=t===\"zonalog\"||!!Tt&&Tt.forma===\"area\"?3:2",
    nuevo: "SIDm=t===\"zonalog\"||t===\"influencia\"||!!Tt&&Tt.forma===\"area\"?3:2",
    veces: 1,
  },
  {
    nombre: "Área de Influencia (Ave) · la barra dice «CERRAR ÁREA»",
    viejo: "SIDar=!!Tt&&Tt.forma===\"area\"",
    nuevo: "SIDar=t===\"influencia\"||!!Tt&&Tt.forma===\"area\"",
    veces: 1,
  },
  {
    nombre: "Vista 3D · cursor de mano (no de dedo) sobre las figuras que se pueden editar",
    viejo: "this.hoverClic?\"pointer\":\"\"",
    nuevo: "this.hoverClic?\"grab\":\"\"",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Mesa) · mover, agregar y borrar un vértice (también del Área de Operaciones y del Área de Influencia)",
    // VN sólo conocía límites, zonas, ejes y líneas: el Área de Operaciones no se podía mover ni
    // corregir. SIDEditaVertices (módulo) recalcula frente, profundidad y azimut del Área de
    // Operaciones.
    viejo: "VN=je.useCallback((Ee,Qe,ot,ct)=>{la();const xt={limite:\"limites\",zonaLog:\"zonasLog\",sectorLog:\"sectoresLog\",ejeLog:\"ejesLog\",lineaEM:\"lineasEM\",flechaZona:\"flechasZona\",obstaculo:\"obstaculos\"}[Ee];xt&&Sn(Qt=>({...Qt,[xt]:(Qt[xt]||[]).map((on,Ht)=>Ht!==Qe?on:{...on,coords:(on.coords||[]).map((vn,da)=>da===ot?ct:vn)})}))},[]),zP=",
    nuevo: "VN=je.useCallback((Ee,Qe,ot,ct)=>{la(),Sn(Qt=>SIDEditaVertices(Qt,Ee,Qe,{t:\"mover\",i:ot,p:ct}))},[]),SIDAV=je.useCallback((Ee,Qe,ot,ct)=>{la(),Sn(Qt=>SIDEditaVertices(Qt,Ee,Qe,{t:\"agregar\",i:ot,p:ct}))},[]),SIDBV=je.useCallback((Ee,Qe,ot)=>{la(),Sn(ct=>SIDEditaVertices(ct,Ee,Qe,{t:\"borrar\",i:ot}))},[]),SIDReg=(SIDEd.agregarV=SIDAV,SIDEd.borrarV=SIDBV,0),zP=",
    veces: 1,
  },
  {
    nombre: "Edición de figuras (Mesa) · borrar toda la figura: también el Área de Operaciones, el Área de Influencia y la marca de magnitud de un límite",
    // «Borrar el Área de Operaciones» preguntaba y no hacía nada (areaOps no estaba en la lista).
    // Al borrar un límite con magnitud o un área logística quedaban sus marcas de magnitud
    // flotando (y, con los límites, las demás marcas se corrían de límite).
    viejo: "if(ot[Ee]){const xt=ot[Ee];Sn(Qt=>({...Qt,[xt]:(Qt[xt]||[]).filter((on,Ht)=>Ht!==Qe)}))}else if(Ee===\"desplazamiento\")",
    nuevo: "if(Ee===\"areaOps\"||Ee===\"influenciaTrazada\")Sn(Qt=>({...Qt,[Ee]:null}));else if(ot[Ee]){const xt=ot[Ee];Sn(Qt=>({...Qt,[xt]:(Qt[xt]||[]).filter((on,Ht)=>Ht!==Qe),...Ee===\"limite\"?{magnitudes:SIDMagSinLimite(Qt.magnitudes,Qe)}:Ee===\"zonaLog\"?{magnitudes:SIDMagSinZona(Qt.magnitudes,(Qt.zonasLog||[])[Qe])}:{}}))}else if(Ee===\"desplazamiento\")",
    veces: 1,
  },
  {
    nombre: "Área de Influencia (Mesa) · agregar la que se traza",
    viejo: "xm=je.useCallback((Ee,Qe)=>{(Ee===\"zonalog\"||Ee===\"ejelog\")&&$n(null);",
    nuevo: "xm=je.useCallback((Ee,Qe)=>{if(Ee===\"influencia\"){$n(null),la(),Sn(SIDo=>({...SIDo,influenciaTrazada:{coords:Qe.coords}}));return}(Ee===\"zonalog\"||Ee===\"ejelog\")&&$n(null);",
    veces: 1,
  },
  {
    nombre: "Área de Influencia (Mesa) · la herramienta llega a la carta con el panel abierto",
    viejo: "herramientaOps:Pt||ti||Ta||Mi||zd||yh||vi||fs||tu&&ba===\"ain\"||ba===\"regla\"?ba:null",
    nuevo: "herramientaOps:Pt||ti||Ta||Mi||zd||yh||vi||fs||Co||tu&&ba===\"ain\"||ba===\"regla\"?ba:null",
    veces: 1,
  },
  {
    nombre: "Área de Interés (Mesa) · se establece a partir del Área de Influencia que trazó el oficial",
    viejo: "const xt=((ot=zl?.coords)==null?void 0:ot.length)>=3,Qt=ml(xt?[[...zl.coords,zl.coords[0]]]:[[...ct,ct[0]]])",
    nuevo: "const SIDz=Lt.influenciaTrazada,xt=((ot=SIDz?.coords)==null?void 0:ot.length)>=3,Qt=ml(xt?[[...SIDz.coords,SIDz.coords[0]]]:[[...ct,ct[0]]])",
    veces: 1,
  },
  {
    nombre: "Área de Interés (Mesa) · depende del Área de Influencia trazada",
    viejo: "},[Lt.areaOps,zl,za]),Xt=je.useCallback(",
    nuevo: "},[Lt.areaOps,Lt.influenciaTrazada,zl,za]),Xt=je.useCallback(",
    veces: 1,
  },
  {
    nombre: "Hoja H.T. 2 · el Área de Influencia es la que trazó el oficial (si la trazó)",
    viejo: "const X=I7(x.areaOps,I);if(X){const se=tq(X.coords,q);if(se)for(const Z in se)H[`ÁREA DE INFLUENCIA|${Z}`]=se[Z];H[\"ÁREA DE INFLUENCIA|NORTE\"]=`${H[\"ÁREA DE INFLUENCIA|NORTE\"]||\"\"} (Trazada a ${$Ie(X.radioM)} del AO — alcance de ${X.arma.sistema}.)`}return H}",
    nuevo: "const X=x.influenciaTrazada&&(x.influenciaTrazada.coords||[]).length>=3?{coords:x.influenciaTrazada.coords,aMano:!0}:I7(x.areaOps,I);if(X){const se=tq(X.coords,q);if(se)for(const Z in se)H[`ÁREA DE INFLUENCIA|${Z}`]=se[Z];X.aMano||(H[\"ÁREA DE INFLUENCIA|NORTE\"]=`${H[\"ÁREA DE INFLUENCIA|NORTE\"]||\"\"} (Trazada a ${$Ie(X.radioM)} del AO — alcance de ${X.arma.sistema}.)`)}return H}",
    veces: 1,
  },
  {
    nombre: "Área de Influencia (panel) · la herramienta de dibujo",
    viejo: "function jCe({activa:t,onActiva:e,areaInfluencia:n,hayAI:a,armaId:i,onArma:o,requisitos:s={ok:!1,faltan:[],enemigas:0,propias:0,arma:null,sinDatos:[]},radioM:r=null,onRadio:u,onCerrar:h}){",
    nuevo: "function jCe({activa:t,onActiva:e,areaInfluencia:n,hayAI:a,armaId:i,onArma:o,requisitos:s={ok:!1,faltan:[],enemigas:0,propias:0,arma:null,sinDatos:[]},radioM:r=null,onRadio:u,onCerrar:h,herramienta:SIDht=null,onHerramienta:SIDoh,trazada:SIDtr=null,onBorrarTrazada:SIDbt}){",
    veces: 1,
  },
  {
    nombre: "Área de Influencia (panel) · «Dibujar el Área de Influencia» arriba y el cálculo del alcance plegado",
    viejo: "style:Oa.btnX,onClick:h,children:\"✕\"})]}),((y=s.deduccion)==null?void 0:y.padre)&&",
    nuevo: "style:Oa.btnX,onClick:h,children:\"✕\"})]}),f.jsx(\"button\",{style:{...Oa.toggle,...SIDht===\"influencia\"?Oa.toggleOn:null},onClick:()=>SIDoh&&SIDoh(SIDht===\"influencia\"?null:\"influencia\"),children:SIDht===\"influencia\"?\"✏️ Dibujando… (tocá para cancelar)\":SIDtr?\"✏️ Dibujarla de nuevo\":\"✏️ Dibujar el Área de Influencia\"}),f.jsx(\"div\",{style:Oa.nota,children:SIDht===\"influencia\"?\"Clic en cada vértice · doble clic o Enter cierra · clic derecho borra el último punto.\":SIDtr?\"Tocala en la carta para editarla: arrastrá los puntos, ⚪ agrega uno, clic derecho borra.\":\"La dibujás vos sobre la carta.\"}),SIDtr&&f.jsx(\"button\",{style:Oa.btnSec,onClick:()=>SIDbt&&SIDbt(),children:\"🗑 Borrar el Área de Influencia\"}),f.jsxs(\"details\",{style:{flexShrink:0},children:[f.jsx(\"summary\",{style:{cursor:\"pointer\",fontSize:11.5,color:\"#9fb0c8\"},children:\"Referencia: alcance de las armas del enemigo (opcional)\"}),((y=s.deduccion)==null?void 0:y.padre)&&",
    veces: 1,
  },
  {
    nombre: "Área de Influencia (panel) · ya no se «enciende» sola sobre la carta",
    viejo: "n&&f.jsx(\"button\",{style:{...Oa.toggle,...t?Oa.toggleOn:null},onClick:()=>e(!t),children:t?\"◉ Encendida — se dibuja sobre la carta\":\"○ Apagada — tocá para dibujarla\"}),",
    nuevo: "null/*SIDsinEnciende*/,",
    veces: 1,
  },
  {
    nombre: "Área de Influencia (panel) · cierre del bloque plegado",
    viejo: "f.jsx(\"div\",{style:Oa.pie,children:\"Se dibuja en violeta punteado y llena sola el Área de Influencia de la H.T. 2 del G-2.\"})]})}const Oa={",
    nuevo: "f.jsx(\"div\",{style:Oa.pie,children:\"Es sólo una referencia: el Área de Influencia es la que dibujás vos.\"})]})]})}const Oa={",
    veces: 1,
  },
  {
    nombre: "Área de Influencia (panel) · se abre con la herramienta y se cierra apagándola",
    viejo: "Co&&f.jsx(jCe,{activa:rl,onActiva:lp,areaInfluencia:zl,hayAI:!!Ae,armaId:vh,onArma:su,requisitos:bm,radioM:hc,onRadio:Bs,onCerrar:()=>Io(!1)})",
    nuevo: "Co&&f.jsx(jCe,{activa:rl,onActiva:lp,areaInfluencia:zl,hayAI:!!Ae,armaId:vh,onArma:su,requisitos:bm,radioM:hc,onRadio:Bs,herramienta:ba,onHerramienta:Ep,trazada:Lt.influenciaTrazada,onBorrarTrazada:()=>GN(\"influenciaTrazada\",0),onCerrar:()=>{Io(!1),$n(null)}})",
    veces: 1,
  },
  {
    nombre: "Área de Interés · botón para mostrar u ocultar el borde",
    viejo: "children:\"📐 Área de Interés\"}),f.jsxs(\"button\",{className:\"btn-cmoc-abrir\",style:rl?{borderColor:\"#8b5cf6\",color:\"#d8ccff\"}:null,onClick:()=>xi(\"influencia\")",
    nuevo: "children:\"📐 Área de Interés\"}),Ae&&f.jsx(\"button\",{className:\"btn-cmoc-abrir\",style:ai.areaInteres===!1?{opacity:.75}:{borderColor:\"#ff5a5a\",color:\"#ffb3b3\"},onClick:()=>Tc(\"areaInteres\"),title:\"Mostrar u ocultar el borde rojo punteado del Área de Interés\",children:ai.areaInteres===!1?\"▢ Borde Á. Interés\":\"▣ Borde Á. Interés\"}),f.jsxs(\"button\",{className:\"btn-cmoc-abrir\",style:rl?{borderColor:\"#8b5cf6\",color:\"#d8ccff\"}:null,onClick:()=>xi(\"influencia\")",
    veces: 1,
  },
  {
    nombre: "Panel del Área de Operaciones · sin la explicación «Es el sector que viene en la Orden…»",
    viejo: "f.jsxs(\"div\",{style:ec.tip,children:[\"Es el sector que viene en la Orden del escalón superior: donde tenés responsabilidad y autoridad para conducir operaciones. Va \",f.jsx(\"b\",{children:\"dentro\"}),\" del Área de Interés, que es más grande y es la que se recorta para el análisis.\"]}),",
    nuevo: "null/*SIDsinTip*/,",
    veces: 1,
  },
  {
    nombre: "Panel del Área de Operaciones · sin el cuadro «Textual del reglamento / Estimación»",
    viejo: "f.jsxs(\"div\",{style:ec.aoFuente,children:[\"📕 \",f.jsx(\"b\",{children:\"Textual del reglamento:\"}),\" \",PK,\".\",f.jsx(\"br\",{}),\"✎ \",f.jsx(\"b\",{children:\"Estimación:\"}),\" \",OK,t===\"retrograda\"&&f.jsxs(f.Fragment,{children:[f.jsx(\"br\",{}),\"⚠️ \",RK]}),r.id!==\"llano\"&&f.jsxs(f.Fragment,{children:[f.jsx(\"br\",{}),\"⚠️ Corregidas por ambiente \",f.jsx(\"b\",{children:r.nom}),\": el factor es estimación, así que ninguna banda de este cuadro es ya 📕 pura.\"]})]}),",
    nuevo: "null/*SIDsinFuente*/,",
    veces: 1,
  },
  {
    nombre: "Panel del Área de Operaciones · sin el cuadro «Cómo se traza, en dos tiempos»",
    viejo: "f.jsxs(\"div\",{style:ec.aoComo,children:[\"✏️ \",f.jsx(\"b\",{children:\"Cómo se traza, en dos tiempos:\"}),f.jsx(\"br\",{}),f.jsx(\"b\",{children:\"1 · EL FRENTE\"}),\" —\",s.lineaBase,\"—. Clic, clic: puede ir en zigzag siguiendo las cimas; ahí ya se lee cuánto mide y de qué escalón es.\",f.jsx(\"b\",{children:\"Doble clic\"}),\" lo fija.\",f.jsx(\"br\",{}),f.jsx(\"b\",{children:\"2 · EL CONTORNO.\"}),\" Seguí haciendo clic por el flanco, la retaguardia y el otro flanco: el sector queda \",f.jsx(\"b\",{children:\"irregular, como es en el terreno\"}),\", con los vértices que hagan falta. La \",f.jsx(\"b\",{children:\"profundidad\"}),\"se mide perpendicular al frente, hasta el vértice que más se aleja.\",f.jsx(\"b\",{children:\"Doble clic\"}),\" cierra el área y \",f.jsx(\"b\",{children:\"clic derecho\"}),\" borra el último vértice.\",f.jsx(\"br\",{}),f.jsx(\"i\",{children:\"Atajo: si cerrás sin poner ningún vértice, sale el frente y su copia corrida en paralelo.\"})]})",
    nuevo: "null/*SIDsinComo*/",
    veces: 1,
  },
  {
    nombre: "Panel del Área de Operaciones · el aviso de arriba, corto (cómo se traza, en una línea)",
    viejo: "\"✏️ PASO 1 · EL FRENTE: clic en cada vértice (puede seguir las cimas). Cuando el frente sea el que querés, DOBLE CLIC. PASO 2 · EL CONTORNO: seguí haciendo clic por el flanco, la retaguardia y el otro flanco —el sector sale irregular, con los vértices que hagan falta—. CIERRA de dos maneras: CLIC SOBRE EL PRIMER VÉRTICE (se pone verde cuando lo pisás) o DOBLE CLIC en cualquier lado. Clic derecho borra el último vértice.\"",
    nuevo: "\"✏️ 1 · FRENTE: clic en cada punto, doble clic lo fija. 2 · CONTORNO: clic en cada vértice, doble clic cierra. Clic derecho borra el último punto.\"",
    veces: 1,
  },
  {
    nombre: "Panel del Área de Operaciones · sin el bloque del Área de Influencia calculada (ahora se dibuja desde «◌ Á. Influencia»)",
    viejo: "E&&f.jsxs(\"div\",{style:eu.influencia,children:[f.jsx(\"div\",{style:eu.infTit,children:\"◌ Área de Influencia\"}),r?f.jsxs(f.Fragment,{children:[f.jsx(\"div\",{style:eu.infDato,children:r.razon}),f.jsx(\"div\",{style:eu.infNota,children:r.motivo}),f.jsxs(\"div\",{style:eu.infCita,children:[\"📕 «Espacio hasta donde se puede influir con los efectos de las armas orgánicas disponibles en la propia Unidad» — TEXTO PMTD 2017.\",r.marca===\"estimacion\"&&\" ✎ El alcance es del reglamento, pero QUE ESA ARMA la tenga esta unidad es organización tipo: poné tus unidades en el calco y se corrige solo.\"]}),f.jsx(\"div\",{style:eu.infNota,children:\"Se dibuja en violeta punteado sobre la carta y llena sola el Área de Influencia de la H.T. 2 del G-2.\"})]}):f.jsx(\"div\",{style:eu.infNota,children:\"Falta el enemigo. Poné las fichas ROJAS —de ellas sale el alcance— y el área aparece sola. Las AZULES no hacen falta: no entran en el cálculo.\"})]}),",
    nuevo: "null/*SIDsinInflAO*/,",
    veces: 1,
  },
  {
    nombre: "Panel del Área de Operaciones · la magnitud a colocar es la del escalón del Área de Operaciones (no más chica ni más grande)",
    // «Sobre el límite — Magnitud que se va a colocar» dejaba elegir cualquier escalón aunque el
    // Área de Operaciones fuera de un Cuerpo de Ejército. Con un Área de Operaciones trazada sólo
    // ofrece el escalón que le corresponde por su frente (o los dos vecinos si el frente queda
    // entre dos escalones).
    viejo: "fl.map(I=>f.jsx(\"option\",{value:I.id,children:I.nombre},I.id))",
    nuevo: "SIDOpEsc(fl,s).map(I=>f.jsx(\"option\",{value:I.id,children:I.nombre},I.id))",
    veces: 1,
  },
  {
    nombre: "Medidas de control · «Magnitud del límite»: sólo la del escalón del Área de Operaciones",
    viejo: "[\"Magnitud del límite\",f.jsx(\"select\",{value:n,onChange:G=>a(G.target.value),style:Ys.sel,children:fl.map(G=>",
    nuevo: "[\"Magnitud del límite\",f.jsx(\"select\",{value:n,onChange:G=>a(G.target.value),style:Ys.sel,children:SIDOpEsc(fl,SIDao).map(G=>",
    veces: 1,
  },
  {
    nombre: "Medidas de control · «Qué escalón marca»: sólo la del escalón del Área de Operaciones",
    viejo: "[\"Qué escalón marca\",f.jsx(\"select\",{value:n,onChange:G=>a(G.target.value),style:Ys.sel,children:fl.map(G=>",
    nuevo: "[\"Qué escalón marca\",f.jsx(\"select\",{value:n,onChange:G=>a(G.target.value),style:Ys.sel,children:SIDOpEsc(fl,SIDao).map(G=>",
    veces: 1,
  },
  {
    nombre: "Medidas de control · recibe el Área de Operaciones",
    viejo: "function xCe({herramienta:t,onHerramienta:e,escalonLimite:n,onEscalonLimite:a,",
    nuevo: "function xCe({areaOps:SIDao=null,herramienta:t,onHerramienta:e,escalonLimite:n,onEscalonLimite:a,",
    veces: 1,
  },
  {
    nombre: "Medidas de control · se le pasa el Área de Operaciones",
    viejo: "f.jsx(xCe,{herramienta:ba,onHerramienta:Ep,escalonLimite:Ml,onEscalonLimite:qi,",
    nuevo: "f.jsx(xCe,{areaOps:Lt.areaOps,herramienta:ba,onHerramienta:Ep,escalonLimite:Ml,onEscalonLimite:qi,",
    veces: 1,
  },
  {
    nombre: "Escalón de la magnitud (Mesa) · sigue al Área de Operaciones trazada",
    viejo: "Ig.current!==Qe&&(Ig.current&&Bs(null),Ig.current=Qe)},[Lt.areaOps]);",
    nuevo: "Ig.current!==Qe&&(Ig.current&&Bs(null),Ig.current=Qe)},[Lt.areaOps]);je.useEffect(()=>{const SIDp=SIDEscalonesAO(Lt.areaOps);SIDp&&!SIDp.includes(Ml)&&qi(SIDp[0])},[Lt.areaOps,Ml]);",
    veces: 1,
  },
  {
    nombre: "Expediente para la IA · el Área de Influencia que trazó el oficial",
    viejo: "const h=I7(i,t.unidades||[]);h&&(a.push(\"\"),a.push(\"**ÁREA DE INFLUENCIA (calculada por la app, no trazada a mano)**\"),",
    nuevo: "const SIDit=t.ops&&t.ops.influenciaTrazada;SIDit&&(SIDit.coords||[]).length>=3&&(a.push(\"\"),a.push(\"**ÁREA DE INFLUENCIA (trazada por el oficial en el calco)**\"),a.push(\"- Vértices (en el orden en que se trazaron):\"),SIDit.coords.forEach(([SIDy,SIDg])=>a.push(`  - ${Cl(SIDy,SIDg)}`)));const h=I7(i,t.unidades||[]);h&&(a.push(\"\"),a.push(SIDit?\"**ÁREA DE INFLUENCIA — alcance de referencia calculado por la app (vale la que trazó el oficial)**\":\"**ÁREA DE INFLUENCIA (calculada por la app, no trazada a mano)**\"),",
    veces: 1,
  },
]
