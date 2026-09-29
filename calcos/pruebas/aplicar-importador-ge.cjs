#!/usr/bin/env node
// Aplica una integración mínima y reversible al compilado actual de la Mesa.
// No reconstruye la app ni toca lógica ajena al importador Google Earth.
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const src = path.join(root, "assets", "index-5bpBlYsz.js");
const out = path.join(root, "assets", "index-ge-import-20260929.js");
const index = path.join(root, "index.html");

let s = fs.readFileSync(src, "utf8");

const replacements = [
  [
    'cr={unidades:ha,ops:Pt,defensa:vi,tareas:ti,log:Ta,mesa:ni,picb:tu,g3:yi,personal:zd,ac:yh,fases:nu,ejercicios:Ol,ia:D0,impresion:lf,carta:_n,areaops:fs,influencia:Co},xi=',
    'cr={unidades:ha,ops:Pt,defensa:vi,tareas:ti,log:Ta,mesa:ni,picb:tu,g3:yi,personal:zd,ac:yh,fases:nu,ejercicios:Ol,ia:D0,impresion:lf,carta:_n,areaops:fs,influencia:Co};window.__SIDECEME_IMPORT_STATE={getResultados:()=>ne,setResultados:Ke,setDatosCapas:_e,setVisibles:oe,setError:he,setEstado:as};const xi='
  ],
  [
    'window.__mesaFuegos={Rt,p5,dK,mK,eh,lP,dP,uP,js,Xc,cota:w9.cota};configurarConceptos',
    'window.__mesaFuegos={Rt,p5,dK,mK,eh,lP,dP,uP,js,Xc,cota:w9.cota};window.__SIDECEME_JSZIP=g0;configurarConceptos'
  ],
  [
    'return Ht.length&&he(`⚠ No se pudieron cargar datos de: ${[...new Set(Ht)].join(", ")}. El terreno, los corredores y las avenidas pueden quedar incompletos en esa parte del área.`),xt},[Ae,X,Lc]),Vx=',
    'return Ht.length&&he(`⚠ No se pudieron cargar datos de: ${[...new Set(Ht)].join(", ")}. El terreno, los corredores y las avenidas pueden quedar incompletos en esa parte del área.`),window.SIDECEME_IMPORTAR_GE?.sumarAConsulta?.(xt,ne,Ee)||xt},[Ae,X,Lc,ne]),Vx='
  ],
  [
    'Ju=je.useCallback(async({conCoc:Ee=!1}={})=>{let Qe=ve,ot=Jt;Ae&&(Qe=await qd(),Ee&&(ot=await _g()));const ct=_6e(',
    'Ju=je.useCallback(async({conCoc:Ee=!1}={})=>{let Qe=ve,ot=Jt;Ae&&(Qe=await qd(),Ee&&(ot=await _g())),Qe=window.SIDECEME_IMPORTAR_GE?.sumarDatosParaAnalisis?.(Qe,ne)||Qe;const ct=_6e('
  ],
  [
    'Zi,wn,X,mr,zo,Ha,fr,Tn,qd,_g]),vv=',
    'Zi,wn,X,mr,zo,Ha,fr,Tn,qd,_g,ne]),vv='
  ],
  [
    'Ke(Ht=>Ee&&Ht?{...Ht,...ct}:ct),window.__resultados=ct,Ee&&ct[Ee]&&ct[Ee].total>0&&oe(Ht=>{',
    'Ke(Ht=>{const vn=Ee&&Ht?{...Ht,...ct}:ct,da=window.SIDECEME_IMPORTAR_GE?.preservarImportados?.(vn,Ht)||vn;return window.__resultados=da,da}),Ee&&ct[Ee]&&ct[Ee].total>0&&oe(Ht=>{'
  ]
];

for (const [from, to] of replacements) {
  const count = s.split(from).length - 1;
  if (count !== 1) {
    throw new Error(`Marcador de integración inesperado (esperado 1, encontrado ${count}): ${from.slice(0, 90)}`);
  }
  s = s.replace(from, to);
}

fs.writeFileSync(out, s);

let html = fs.readFileSync(index, "utf8");
html = html.replace("./assets/index-5bpBlYsz.js", "./assets/index-ge-import-20260929.js");
fs.writeFileSync(index, html);

console.log("OK: importador GE integrado en compilado nuevo");
console.log("Salida:", path.relative(root, out));
console.log("Reemplazos:", replacements.length);
