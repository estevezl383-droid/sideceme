// Lista las hojas de «📋 Mis hojas» de una sección (g1, g4, g5, eme) como las define el
// compilado VIGENTE de la Mesa (el que carga calcos/index.html): fase, número, id, tipo y si
// ya la trabaja el motor de calcos/estado-mayor (tipo «docEM») o se «baja hecha» (remite).
//
//   node .claude/skills/habilitar-hojas-seccion/scripts/hojas-de-seccion.cjs g5
const path = require('path')
const raiz = path.resolve(__dirname, '../../../..')
const { vigente, cargar } = require(path.join(raiz, 'calcos/pruebas/extraer.js'))
const g = process.argv[2] || 'g1'
const ruta = vigente()
let ctx
try {
  ctx = cargar(ruta, ['SIDuN0', 'Nx'])
} catch {
  ctx = cargar(ruta, ['uN', 'Nx']) // compilado anterior al motor
  ctx.SIDuN0 = ctx.uN
}
if (!ctx.Nx[g]) throw new Error(`No existe la sección «${g}». Hay: ${Object.keys(ctx.Nx).join(', ')}`)
;(async () => {
  // Lo que el motor de calcos/estado-mayor ya registró para esta sección (si existe).
  let R = null
  try {
    R = await import(require('url').pathToFileURL(path.join(raiz, 'calcos/estado-mayor/v1/registro.js')).href)
  } catch {}
  const fases = R ? R.fasesConDocumentos(ctx.Nx[g], ctx.SIDuN0(ctx.Nx[g])) : ctx.SIDuN0(ctx.Nx[g])
  console.log(`Compilado: ${path.basename(ruta)} · ${ctx.Nx[g].nom} · en el motor: ${R && R.CAMPOS[g] ? 'SÍ (campos/' + g + '.js)' : 'NO'}`)
  for (const f of fases) {
    console.log(`FASE ${f.id} · ${f.nom}`)
    for (const h of f.hojas) {
      const guia = R && R.guiaHoja(g, h) ? ' 📘' : ''
      const semilla = R && R.tieneSemilla(g, h) ? ' 🌱' : ''
      console.log(`  ${h.num.padEnd(7)} ${h.id.padEnd(18)} ${String(h.tipo).padEnd(10)} ${h.nom}${guia}${semilla}${h.cols ? `  [${h.cols.join(' | ')}]` : ''}${h.campos ? `  {${h.campos.join(' | ')}}` : ''}`)
    }
  }
  console.log('\nremite = «se baja hecha» (sin IA ni editor) · docEM = documento del motor · 📘 guía · 🌱 semilla')
})()
