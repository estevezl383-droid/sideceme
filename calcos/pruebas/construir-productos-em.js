const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto')
const cambios=require('./reemplazos-2026-10-29-productos-em')
const assets=path.resolve(__dirname,'../assets'), anterior='index-cursos-g2-g3-20261029.js', nuevo='index-productos-em-20261029.js'
const original=fs.readFileSync(path.join(assets,anterior),'utf8')
if(crypto.createHash('sha256').update(original).digest('hex')!=='df496ff0289f61a1dbf8908d8f68cf2c1c9755eecf431d03f3ba507493bcb440')throw Error('Cambió el compilado anterior.')
let salida=original
for(const c of cambios){const n=salida.split(c.viejo).length-1;if(n!==c.veces)throw Error(`${c.nombre}: se esperaban ${c.veces}, hay ${n}`);salida=salida.split(c.viejo).join(c.nuevo)}
let reversa=salida
for(const c of [...cambios].reverse())reversa=reversa.split(c.nuevo).join(c.viejo)
if(reversa!==original)throw Error('El cambio no es reversible byte por byte.')
const indice=path.resolve(__dirname,'../index.html');let html=fs.readFileSync(indice,'utf8')
if(!html.includes(anterior)&&!html.includes(nuevo))throw Error('Cambió el compilado activo.')
html=html.replace(anterior,nuevo).replace(/(index-productos-em-20261029\.js)\?v=[^"]*/,'$1?v=20261029-g4-g1')
fs.writeFileSync(path.join(assets,nuevo),salida);fs.writeFileSync(indice,html)
console.log(`${nuevo}: ${cambios.length} cambios reversibles`)
