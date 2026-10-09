from pathlib import Path

base = 'index-ejes-fichas-20260930.js'
destino = 'index-ficha-documental-20260930.js'
s = Path('calcos/assets/' + base).read_text()
def replace(a, b):
    global s
    assert s.count(a) == 1, (a[:100], s.count(a))
    s = s.replace(a, b)

s = 'import SIDFichaInstalacion from "../fichas-instalacion/v1/editor.js";' + s
replace('B.append(U,G);Rt.DomEvent.disableClickPropagation(B);I.bindPopup(B)',
        'const _f=document.createElement("button");_f.textContent="ABRIR FICHA DOCUMENTAL";_f.style.cssText="display:block;margin-top:8px;padding:8px;cursor:pointer;background:#234a68;color:#fff;border:0;border-radius:5px";_f.addEventListener("click",()=>window.dispatchEvent(new CustomEvent("sideceme:ficha-instalacion",{detail:{id:x.id}})));B.append(U,_f,G);Rt.DomEvent.disableClickPropagation(B);I.bindPopup(B)')
replace('x.tipo==="instalacion"?void 0:o?.(x.id)',
        'x.tipo==="instalacion"?window.dispatchEvent(new CustomEvent("sideceme:ficha-instalacion",{detail:{id:x.id}})):o?.(x.id)')
replace('dibujando:gp}),Ka&&f.jsx(vze',
        'dibujando:gp}),f.jsx(SIDFichaInstalacion,{react:je,unidades:dn,documentos:en,ejercicio:wn,info:Ni,onEditar:ia,onAgregarDocumentos:gv}),Ka&&f.jsx(vze')
Path('calcos/assets/' + destino).write_text(s)
p = Path('calcos/index.html')
html = p.read_text().replace(base, destino)
if 'fichas-instalacion/v1/estilo.css' not in html:
    html = html.replace('  </head>', '    <link rel="stylesheet" href="./fichas-instalacion/v1/estilo.css">\n  </head>')
p.write_text(html)
