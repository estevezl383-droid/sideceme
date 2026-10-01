from pathlib import Path
import json,hashlib
reemplazos=[]
base=Path('calcos/assets/index-ficha-documental-20260930.js');s=base.read_text()
def replace(a,b,count=1):
 global s
 assert s.count(a)==count,(a[:90],s.count(a),count)
 reemplazos.append({"viejo":a,"nuevo":b,"veces":count})
 s=s.replace(a,b)
prefix='import {configurarMilitar as SIDMilConfig,actualizarContexto as SIDMilContexto,exportarMilitar as SIDMilWord,exportarDirecto as SIDMilDirecto,registroHoja as SIDMilHoja,registroDirecto as SIDMilRegistro,exportarRemitida as SIDMilRemitida} from "../formato-militar/v1/runtime.js";\n'
replace(s[:s.index('import SIDFichaInstalacion')+len('import SIDFichaInstalacion')],prefix+'import SIDFichaInstalacion')
start=s.index('async function Mx(');end=s.index('const K5e=',start)
replace(s[start:end],'async function Mx(t,e,n={}){return SIDMilWord(t,e,n)}SIDMilConfig({Document:A5e,Paragraph:Js,TextRun:JM,Header:S5e,Footer:C5e,PageNumber:zS,ImageRun:kPe,Table:zOe,TableCell:Fq,TableRow:Wre,Packer:loe,preparar:Y5e});')
start=s.index('async function Aoe(');end=s.index('const Ioe=',start);originalFragment=s[start:end];fragment=originalFragment
fragment=fragment.replace('Mx(u,`${i.num.replace(/[^A-Za-z0-9]+/g,"")}_${i.nom.slice(0,28)}`)','Mx(u,`${i.num.replace(/[^A-Za-z0-9]+/g,"")}_${i.nom.slice(0,28)}`,{ctx:n,registro:SIDMilHoja(i,n)})').replace('Mx(s,r)','Mx(s,r,{ctx:n,registro:SIDMilHoja(i,n)})')
fragment=fragment.replace('return Aoe(t.id,e,n,a)','return Aoe(t.id,e,{...n,pasoDocumento:t.num},a)')
fragment=fragment.replace('Mx(u,i)','Mx(u,i,{ctx:n,registro:SIDMilHoja(t,n)})').replace('Mx(s,i)','Mx(s,i,{ctx:n,registro:SIDMilHoja(t,n)})')
# Reconocimiento es una matriz existente: conservar sus celdas.
fragment=fragment.replace('const o=Jq(t,e||{});','const o=t.id==="ivr"?(T3e(t,e||{})||Jq(t,e||{})):Jq(t,e||{});')
replace(originalFragment,fragment)
replace('async function Lx(t,e,n={}){const{spec:a}=WLe(t,n);await Mx(a,e)}','async function Lx(t,e,n={}){return SIDMilDirecto(t,e,n.ctx||{},n.registro||{},WLe)}')
for fn,tipo in [('NNe','apreciacion'),('HNe','plan'),('a4e','documento')]:
 start=s.index('async function '+fn+'(');end=s.index('const ',start+25)
 # first const is inside function: find exact suffix common instead
 chunk=s[start:start+430]
 old='return await Lx(a(e),';ix=s.index(old,start);stop=s.index('}),!0}',ix)
 original=s[ix:stop+7]
 new=original.replace('return await','return').replace('esqueleto:!n.versionFinal','esqueleto:!0,ctx:{...e,pasoDocumento:n.pasoDocumento||""},registro:SIDMilRegistro("'+tipo+'",t,n)').replace('}),!0}','})}')
 replace(original,new)
for name,tipo,g in [('dDe','anexo','g4'),('mNe','anexo','g1'),('gNe','anexo','g5'),('dNe','orden','g3')]:
 # locate specific arrow producer
 pos=s.index(name+'=(t={})=>Lx(');end=s.index('esqueleto:!0}',pos)
 replace(s[pos:end+len('esqueleto:!0}')],s[pos:end]+'esqueleto:!0,ctx:t,registro:SIDMilRegistro("'+tipo+'","'+g+'",t)}')
replace('Coe(I,U(I)||{},{...i,seccion:x.seccion,firma:x.firma},s)||window.alert','Coe(I,U(I)||{},{...i,g:t,seccion:x.seccion,firma:x.firma},s)===false&&window.alert')
replace('te?f.jsx("div",{style:Wr.remite,children:"Este documento no se tipea acá: la app lo escribe entero con lo que hay en el calco y en tus hojas. Bajalo desde su propio botón en este panel."})','te?f.jsxs("div",{style:Wr.remite,children:["Este documento reúne los datos vigentes del ejercicio.",f.jsx("button",{style:Wr.bajarMil,onClick:async()=>{try{await SIDMilRemitida(I,t)}catch(e){window.alert(e.message||String(e))}},children:"📄 Word (formato militar)"})]})')
replace('window.__SIDECEME_IMPORT_STATE={','SIDMilContexto({ejercicio:wn,unidad:Tn?.unidad||Ae?.properties?.nombre||"",unidadSuperior:Tn?.escalonSuperior||"",orden:Tn,autor:zo,registros:Lt.documentosMilitares||{},guardar:registros=>Sn(prev=>({...prev,documentosMilitares:registros})),remitir:(hoja,g)=>{const ctx={...df(),unidad:Tn?.unidad||Ae?.properties?.nombre||"",unidadSuperior:Tn?.escalonSuperior||"",orden:Tn,pasoDocumento:hoja.num};return hoja.id==="anexoF7P1"?({g1:mNe,g4:dDe,g5:gNe}[g]?.(ctx)):NNe(g,ctx,{pasoDocumento:hoja.num})}});window.__SIDECEME_IMPORT_STATE={')
Path('calcos/pruebas/reemplazos-formato-militar.json').write_text(json.dumps({'sha256Base':hashlib.sha256(base.read_bytes()).hexdigest(),'sha256Salida':hashlib.sha256(s.encode()).hexdigest(),'reemplazos':reemplazos},ensure_ascii=False))
Path('calcos/assets/index-formato-militar-20261001.js').write_text(s)
p=Path('calcos/index.html');h=p.read_text();h=h.replace('index-ficha-documental-20260930.js','index-formato-militar-20261001.js');h=h.replace('  <link rel="stylesheet" href="./formato-militar/v1/estilo.css">\n','');h=h.replace('</head>','  <link rel="stylesheet" href="./formato-militar/v1/estilo.css">\n  </head>');p.write_text(h)
print('Compilado militar construido sin modificar el original')
