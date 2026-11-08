// 2026-11-08 — Hoja P.D. (Plantilla doctrinal): «hay mucho texto que no se llega a leer».
// En pantalla queda sólo lo necesario para seguir; la guía completa (para/como/ejemplo)
// sigue entera porque es la orden que se le manda a la IA.
module.exports = [
  {
    nombre: 'pd: guía corta en pantalla',
    veces: 1,
    viejo: 'pd:{para:"Es la primera de las TRES partes del modelo enemigo',
    nuevo: 'pd:{corto:["Todo se mide desde NUESTRA LPR hacia atrás del enemigo: nada cruzó la línea.","La artillería va DETRÁS del primer escalón; su arco es hasta dónde protege.","Vos llenás sólo la última columna: qué cambia con ESTE terreno y por qué."],para:"Es la primera de las TRES partes del modelo enemigo',
  },
  {
    nombre: 'guía: si hay versión corta, mostrar sólo ésa',
    veces: 1,
    viejo: 'Ne&&f.jsxs("div",{style:qt.guiaCuerpo,children:[f.jsx("p",{style:qt.guiaPara,children:oe.para}),f.jsx("ul",{style:qt.guiaLista,children:oe.como.map(',
    nuevo: 'Ne&&f.jsxs("div",{style:qt.guiaCuerpo,children:oe.corto?[f.jsx("ul",{style:qt.guiaLista,children:oe.corto.map((de,he)=>f.jsx("li",{style:qt.guiaLi,children:de},he))})]:[f.jsx("p",{style:qt.guiaPara,children:oe.para}),f.jsx("ul",{style:qt.guiaLista,children:oe.como.map(',
  },
  {
    nombre: 'pd: nota de una oración',
    veces: 1,
    viejo: 'nota:"Cómo se despliega el enemigo CUANDO EL TERRENO NO LO LIMITA. Abajo se arman CUATRO esquemas del RC-02-107 (dos escalones, un escalón con reserva, fijar + desbordamiento, y ataque desde la marcha): elegís uno y esta hoja se llena con ÉL, elemento por elemento. Todas las distancias se miden desde NUESTRA LPR hacia la retaguardia enemiga: ninguna unidad del primer escalón cruzó la línea, porque lo que se contesta acá es con quién chocamos PRIMERO. La última columna es la que hace el oficial: qué cambia con ESTE terreno y ESTE CMOC. Esa columna, adaptada, ES la plantilla situacional del paso 4."',
    nuevo: 'nota:"Elegí un esquema abajo, acostalo sobre el calco y completá la última columna: cómo lo cambia ESTE terreno."',
  },
  {
    nombre: 'pd: resumen de un renglón, detalle plegado',
    veces: 1,
    viejo: 'i?.ok&&f.jsxs("div",{style:qt.plResumen,children:[f.jsxs("b",{children:["Dibujada: ",i.resumen.esquemaNom]})," — nivel ",i.resumen.nivelNom,".",f.jsx("br",{}),"Zona de ataque del cuadro ",i.resumen.frenteCuadroKm[0],"-",i.resumen.frenteCuadroKm[1]," km; el terreno deja"," ",f.jsxs("b",{children:[i.resumen.frenteRealKm," km"]})," entre las"," ",i.resumen.avenidasEmpeñadas," avenida(s) empeñadas",i.resumen.avenidasSecundarias?` (y ${i.resumen.avenidasSecundarias} secundaria(s))`:"","."," ",i.marcas.length," fichas, ",i.conos.length," arcos de artillería.",f.jsx("div",{style:i.resumen.dentroDelAO?qt.pdMal:qt.pdBien,children:i.resumen.dentroDelAO?`🔴 ${i.resumen.dentroDelAO} ficha(s) DENTRO del Área de Operaciones — está mal.`:"✅ Control: 0 fichas dentro del Área de Operaciones. Todo el dispositivo quedó del lado enemigo de la LPR."}),!!((B=i.reparto)!=null&&B.length)&&f.jsxs("div",{style:qt.cfgNota,children:[f.jsx("b",{children:"Reparto:"}),i.reparto.map((Fe,Ne)=>f.jsxs("div",{children:["· ",Fe]},Ne))]}),f.jsxs("div",{style:qt.cfgNota,children:["🔶 ",f.jsx("b",{children:"Arcos de artillería (naranja):"})," ",(i.resumen.arcos||[]).join(" · "),". Es hasta dónde cada grupo protege a lo que apoya; el relleno es el de mayor calibre."]}),(i.avisos||[]).map((Fe,Ne)=>f.jsxs("div",{style:qt.plAviso,children:["⚠️ ",Fe]},Ne))]})',
    nuevo: 'i?.ok&&f.jsxs("div",{style:qt.plResumen,children:[f.jsxs("b",{children:["✅ Dibujada: ",i.resumen.esquemaNom]})," · ",i.resumen.nivelNom," · ",i.marcas.length," fichas",+i.resumen.frenteRealKm?` · frente ${i.resumen.frenteRealKm} km`:"",i.resumen.dentroDelAO?f.jsx("div",{style:qt.pdMal,children:`🔴 ${i.resumen.dentroDelAO} ficha(s) dentro del Área de Operaciones — revisá.`}):null,(i.avisos||[]).filter(Fe=>Fe.includes("🔴")).map((Fe,Ne)=>f.jsx("div",{style:qt.plAviso,children:Fe},"r"+Ne)),f.jsxs("details",{style:{marginTop:6},children:[f.jsx("summary",{style:{cursor:"pointer",opacity:.8},children:"Ver detalle"+((B=(i.avisos||[]).filter(Fe=>!Fe.includes("🔴")).length)?` (${B} nota${B>1?"s":""})`:"")}),!!i.reparto?.length&&f.jsxs("div",{style:qt.cfgNota,children:[f.jsx("b",{children:"Reparto:"}),i.reparto.map((Fe,Ne)=>f.jsxs("div",{children:["· ",Fe]},Ne))]}),f.jsxs("div",{style:qt.cfgNota,children:["🔶 ",f.jsx("b",{children:"Arcos de artillería:"})," ",(i.resumen.arcos||[]).join(" · "),"."]}),(i.avisos||[]).filter(Fe=>!Fe.includes("🔴")).map((Fe,Ne)=>f.jsx("div",{style:qt.plAviso,children:Fe},Ne))]})]})',
  },
]
