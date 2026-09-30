from pathlib import Path
p=Path('calcos/assets/index-asdi-20260930.js');s=p.read_text()
def replace(a,b):
 global s
 assert s.count(a)==1,(a[:80],s.count(a))
 s=s.replace(a,b)
replace('je.useEffect(()=>{if(t!=="zonalog")return;const bn=()=>jt()', 'je.useEffect(()=>{if(!["zonalog","epa","epe"].includes(t))return;const bn=()=>jt()')
replace('window.addEventListener("sideceme:cerrar-zonalog",bn);window.addEventListener("keydown",Pn);return()=>{window.removeEventListener("sideceme:cerrar-zonalog",bn);window.removeEventListener("keydown",Pn)}', 'const Gn=t==="zonalog"?"sideceme:cerrar-zonalog":"sideceme:terminar-eje";window.addEventListener(Gn,bn);window.addEventListener("keydown",Pn);return()=>{window.removeEventListener(Gn,bn);window.removeEventListener("keydown",Pn)}')
replace('const bn=_asdiPuntos.current.filter((Pn,pa,Gn)=>pa===0||Pn[0]!==Gn[pa-1][0]||Pn[1]!==Gn[pa-1][1]);if(Dt', 'const bn=_asdiPuntos.current.filter((Pn,pa,Gn)=>pa===0||Pn[0]!==Gn[pa-1][0]||Pn[1]!==Gn[pa-1][1]);if((t==="epa"||t==="epe")&&bn.length<2){window.alert("MARCÁ AL MENOS DOS PUNTOS DIFERENTES PARA TERMINAR EL TRAZO.");return}if(Dt')
replace('Ee==="zonalog"&&$n(null);const ot=', '(Ee==="zonalog"||Ee==="ejelog")&&$n(null);const ot=')
replace('(T==="epa"||T==="epe")&&f.jsxs("div",{style:fn.tip,children:["Clic = vértice · doble clic = terminar.', '(T==="epa"||T==="epe")&&f.jsxs("div",{style:fn.tip,children:[f.jsx("button",{style:fn.tool,onClick:()=>window.dispatchEvent(new Event("sideceme:terminar-eje")),children:"✓ TERMINAR TRAZO"}),f.jsx("button",{style:fn.tool,onClick:()=>I?.(null),children:"✕ CANCELAR TRAZO"}),"MARCÁ DOS O MÁS PUNTOS. TERMINÁ CON EL BOTÓN, ENTER O DOBLE CLIC. Clic = vértice · doble clic = terminar.')
out=Path('calcos/assets/index-ejes-20260930.js');out.write_text(s)
h=Path('calcos/index.html');h.write_text(h.read_text().replace('index-asdi-20260930.js','index-ejes-20260930.js'))
