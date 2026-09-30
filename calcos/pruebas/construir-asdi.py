# Corrección limitada de ASDI sobre el compilado vigente al 29-SEP-2026.
# Ejecutar desde la raíz del repositorio: python calcos/pruebas/construir-asdi.py
# Cada ancla debe aparecer exactamente una vez; falla si cambia la base.
from pathlib import Path
p=Path('calcos/assets/index-ge-import-20260929.js');s=p.read_text()
def replace(a,b):
 global s
 assert s.count(a)==1,(a[:100],s.count(a))
 s=s.replace(a,b)
replace('herramientaOps:Pt||ti||Ta||zd||yh||vi||fs||tu&&ba===','herramientaOps:Pt||ti||Ta||Mi||zd||yh||vi||fs||tu&&ba===')
replace('[Se,Ae]=je.useState([]),[Ie,Ce]=je.useState(null)', '[Se,_asdiSetPuntos]=je.useState([]),_asdiPuntos=je.useRef([]),Ae=bn=>{const pa=typeof bn==="function"?bn(_asdiPuntos.current):bn;_asdiPuntos.current=pa;_asdiSetPuntos(pa)},[Ie,Ce]=je.useState(null)')
replace('const jt=()=>{const bn=Se.filter(', 'const jt=()=>{const bn=_asdiPuntos.current.filter(')
replace('else t==="zonalog"?bn.length>=3&&I("zonalog",{coords:bn,zona:n}):Tt?', 'else t==="zonalog"?bn.length>=3&&(I("zonalog",{coords:bn,zona:n}),He("")):Tt?')
replace('Ae([])},tn=12,jn=50,', 'if(t==="zonalog"&&bn.length<3){He("MARCÁ AL MENOS TRES VÉRTICES PARA CERRAR EL ÁREA.");return}Ae([])},tn=12,jn=50,')
# Closure button and Enter share the real drawing finalizer, with latest points.
replace('return sE({click(bn){const Pn=fe.current;', 'je.useEffect(()=>{if(t!=="zonalog")return;const bn=()=>jt(),Pn=pa=>{const Gn=pa.target;if(Gn&&(Gn.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(Gn.tagName)))return;if(pa.key==="Enter"){pa.preventDefault();jt()}else if(pa.key==="Escape"){Ae([]);He("")}};window.addEventListener("sideceme:cerrar-zonalog",bn);window.addEventListener("keydown",Pn);return()=>{window.removeEventListener("sideceme:cerrar-zonalog",bn);window.removeEventListener("keydown",Pn)}},[t,n,I]);return sE({click(bn){const Pn=fe.current;')
replace('Dt?Ae(Gn=>[...Gn,pa]):t==="tarea"?', 'Dt?(t==="zonalog"&&_asdiPuntos.current.length>=3&&YtZona(bn.latlng)?jt():Ae(Gn=>[...Gn,pa])):t==="tarea"?')
# Close on first vertex in either view, using screen projection helper.
replace('const jt=()=>{const bn=_asdiPuntos.current.filter(', 'const YtZona=bn=>{const pa=_asdiPuntos.current[0];if(!pa)return!1;try{return pxVista(_e,bn).distanceTo(pxVista(_e,Rt.latLng(pa[1],pa[0])))<=12}catch{return!1}},jt=()=>{const bn=_asdiPuntos.current.filter(')
# Preview vertices must not intercept clicks (especially in 3D).
replace('radius:3,color:hd,weight:2,fillColor:"#fff",fillOpacity:1}).addTo(bn)', 'radius:3,color:hd,weight:2,fillColor:"#fff",fillOpacity:1,interactive:!1}).addTo(bn)')
needle='f.jsxs("div",{style:fn.ayuda,children:["Se grafica como en el reglamento: "'
replace(needle,'oe&&f.jsxs("div",{style:fn.ayuda,children:[f.jsx("button",{style:fn.tool,onClick:()=>window.dispatchEvent(new Event("sideceme:cerrar-zonalog")),children:"✓ CERRAR ÁREA"}),f.jsx("button",{style:fn.tool,onClick:()=>I?.(null),children:"✕ CANCELAR TRAZADO"}),"MARCÁ AL MENOS TRES VÉRTICES. CERRÁ CON EL BOTÓN, ENTER, DOBLE CLIC O CLIC EN EL PRIMER VÉRTICE."]}),'+needle)
replace('j||o==null||o(x.id)', 'j||(x.tipo==="instalacion"?void 0:o?.(x.id))')
replace('let j=!1;I.on("dragstart"', 'if(x.tipo==="instalacion"){const B=document.createElement("div"),U=document.createElement("b"),G=document.createElement("button"),te=Ni(x.instalacion);U.textContent=(x.designacion||te?.nom||"INSTALACIÓN").toUpperCase();G.textContent="ELIMINAR INSTALACIÓN";G.style.cssText="display:block;margin-top:10px;padding:8px;cursor:pointer;color:#fff;background:#a71936;border:0;border-radius:5px";G.addEventListener("click",()=>{window.confirm(`¿ELIMINAR ${U.textContent}?`)&&(I.closePopup(),i?.(x.id))});B.append(U,G);Rt.DomEvent.disableClickPropagation(B);I.bindPopup(B)}let j=!1;I.on("dragstart"')
# Show validation in map when there are too few vertices (existing label uses it only in AO).
replace('Ae([])},tn=12,jn=50,','Ae([])},tn=12,jn=50,') if False else None
replace('xm=je.useCallback((Ee,Qe)=>{const ot=', 'xm=je.useCallback((Ee,Qe)=>{Ee==="zonalog"&&$n(null);const ot=')
replace('He("MARCÁ AL MENOS TRES VÉRTICES PARA CERRAR EL ÁREA.");return','He("MARCÁ AL MENOS TRES VÉRTICES PARA CERRAR EL ÁREA.");window.alert("MARCÁ AL MENOS TRES VÉRTICES PARA CERRAR EL ÁREA.");return')
replace('Rt.marker([x.lat,x.lng],{icon:M,interactive:!0,draggable:!0})','Rt.marker([x.lat,x.lng],{icon:M,interactive:!s,draggable:!s})')
replace('if(x.tipo==="instalacion"){const B=document','if(x.tipo==="instalacion"&&!s){const B=document')
out=Path('calcos/assets/index-asdi-20260930.js');out.write_text(s)
h=Path('calcos/index.html');h.write_text(h.read_text().replace('index-ge-import-20260929.js','index-asdi-20260930.js'))
