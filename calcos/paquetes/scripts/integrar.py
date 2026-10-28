from pathlib import Path
root=Path(__file__).resolve().parents[2]
p=root/'assets/index-guia-inicial-20261027.js'
s=p.read_text()
changes={
'async function Ale(t="data/bolivia/censo2024_municipios.json"){':'async function Ale(t="data/bolivia/censo2024_municipios.json"){if(window.SIDECEME_PAQUETES)return null;',

'async function Yle(t,e,n){':'async function Yle(t,e,n){if(window.SIDECEME_PAQUETES)return window.SIDPaquetes.capas(t,e,n,rF,Hc);',
'async function XDe(t,e,n){':'async function XDe(t,e,n){if(window.SIDECEME_PAQUETES)return window.SIDPaquetes.demTile(t,e,n);',
'async function Gse(t,e=()=>{}){':'async function Gse(t,e=()=>{}){if(window.SIDECEME_PAQUETES)return window.SIDPaquetes.landcover(t,e);',
'g2=jSe()?"escritorio":LSe()?"servidor":"navegador"':'g2=window.SIDECEME_PAQUETES?"navegador":jSe()?"escritorio":LSe()?"servidor":"navegador"',
'e(`Descargando modelo de elevación (${g*v} tiles)…`)':'e(window.SIDECEME_PAQUETES?`Leyendo relieve del paquete (${g*v} fragmentos)…`:`Descargando modelo de elevación (${g*v} tiles)…`)'
}
for a,b in changes.items():
 assert s.count(a)==1,(a,s.count(a));s=s.replace(a,b)
(root/'assets/index-paquetes-20261027.js').write_text(s)
p=root/'index.html';s=p.read_text()
if 'window.SIDECEME_PAQUETES =' not in s:
 s=s.replace('<script>','<script>\n      window.SIDECEME_PAQUETES = new URLSearchParams(location.search).has("paquetes");',1)
 s=s.replace('if (/[?&]practica\\b/.test(location.search)) {','if (!window.SIDECEME_PAQUETES && /[?&]practica\\b/.test(location.search)) {')
 s=s.replace('<script type="module" crossorigin src="./assets/index-guia-inicial-20261027.js?v=guia-inicial-20261027"></script>','<script type="module" src="./paquetes/v1/paquetes.mjs?v=20261027"></script>\n    <script type="module" crossorigin src="./assets/index-paquetes-20261027.js?v=20261027"></script>')
 p.write_text(s)
p=root/'guardado/v1/resguardo.js';s=p.read_text().replace('function C() { return window.SIDECEME_CALCOS || null }','function C() { return window.SIDECEME_PAQUETES ? null : window.SIDECEME_CALCOS || null }');p.write_text(s)
print('Integración generada')
