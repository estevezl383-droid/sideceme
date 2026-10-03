// Dibuja un .docx con docx-preview (el mismo visor de la Mesa) y saca una captura PNG, para
// MIRAR el Word que sale (en el entorno no hay LibreOffice).
//
//   node .claude/skills/habilitar-hojas-seccion/scripts/ver-docx.cjs salida.docx captura.png ["texto al que bajar"]
const fs=require('fs'),path=require('path')
const raiz=path.resolve(__dirname,'../../../..')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright')
;(async()=>{
  const [docx, png, desde] = process.argv.slice(2)
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1000,height:1400}})
  await p.setContent('<html><body style="background:#777"><div id=h></div></body></html>')
  await p.addScriptTag({content:fs.readFileSync(path.join(raiz,'jszip.min.js'),'utf8')})
  await p.addScriptTag({content:fs.readFileSync(path.join(raiz,'docx-preview.min.js'),'utf8')})
  const b64=fs.readFileSync(docx).toString('base64')
  await p.evaluate(async(b64)=>{const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));await docx.renderAsync(new Blob([bin]),document.getElementById('h'))},b64)
  await p.waitForTimeout(500)
  if (desde) { await p.evaluate((t)=>{const el=[...document.querySelectorAll('p,span,td')].find(x=>x.textContent.includes(t)); el&&el.scrollIntoView()},desde) }
  await p.screenshot({path:png})
  await b.close()
})()
