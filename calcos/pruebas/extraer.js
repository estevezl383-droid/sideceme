// Carga, TEXTUALMENTE, funciones y constantes de nivel superior del compilado
// de la Mesa del EM, para correrlas en Node sin reescribirlas.
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const acorn = require('acorn')

// El compilado que carga calcos/index.html.
function vigente() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')
  return path.join(__dirname, '..', html.match(/\.\/(assets\/index-[\w-]+\.js)/)[1])
}

function cargar(ruta, nombres, globales = {}) {
  const src = fs.readFileSync(ruta, 'utf8')
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' })
  const quiero = new Set(nombres)
  const partes = []
  for (const n of ast.body) {
    if (n.type === 'FunctionDeclaration' && quiero.delete(n.id.name)) partes.push(src.slice(n.start, n.end))
    else if (n.type === 'VariableDeclaration') {
      for (const d of n.declarations) {
        if (d.id.type === 'Identifier' && quiero.delete(d.id.name)) partes.push(`var ${src.slice(d.start, d.end)};`)
      }
    }
  }
  // SIDMembrete no es del compilado: lo importa de calcos/membrete/v1 (membrete táctico).
  if (quiero.delete('SIDMembrete') && !('SIDMembrete' in globales)) globales = { ...globales, SIDMembrete: require('../membrete/v1/membrete.js').default }
  // SIDCae* no son del compilado: los importa de calcos/ht19-cae/v1 (H.T. 19 fase por fase, 20-10-2026).
  const cae = require('../ht19-cae/v1/cae.mjs')
  const CAE = { SIDCaeElem: cae.elementosCAE, SIDCaeSocb: cae.socbCAE, SIDCaeEtiq: cae.etiquetaCAE, SIDCaePrep: cae.prepCAE, SIDCaeHtml: cae.htmlCAE, SIDCaeDocx: cae.docxCAE, SIDCaeExtra: cae.extraCAE }
  for (const k of Object.keys(CAE)) if (quiero.delete(k) && !(k in globales)) globales = { ...globales, [k]: CAE[k] }
  // SIDCalc* no son del compilado: los importa de calcos/logistica/v1/calculo.mjs (reabastecimiento, 21-10-2026).
  const calc = require('../logistica/v1/calculo.mjs')
  const CALC = { SIDCalcReabHtml: calc.htmlReabastecimiento, SIDCalcPlan: calc.planReabastecimiento, SIDCalcEnc: calc.encabezadoCalculo }
  for (const k of Object.keys(CALC)) quiero.delete(k)
  // SIDGuia* no son del compilado: los importa de calcos/guia-planificacion/v1/guia.mjs (Guía de Planificación, 27-10-2026).
  const guia = require('../guia-planificacion/v1/guia.mjs')
  // y de calcos/guia-inicial/v1 (la Guía Inicial del Comandante, 27-10-2026); SIDGuiaCalco es el calco vivo del motor del
  // Estado Mayor (en las pruebas, vacío salvo que se pase).
  const gi = require('../guia-inicial/v1/guia.mjs')
  const GUIA = { SIDGuiaLeer: guia.leerGuia, SIDGuiaPlan: guia.HOJA_GUIA_PLANIFICACION, SIDGuiaCmte: gi.HOJA_CMTE, SIDGuiaG3: gi.HOJA_G3, SIDGuiaGuia: gi.GUIA, SIDGuiaSemilla: gi.semillaGuia, SIDGuiaWord: gi.wordGuia, SIDGuiaAyuda: gi.AyudaGuia, SIDGuiaCalco: () => ({}) }
  for (const k of Object.keys(GUIA)) quiero.delete(k)
  globales = { ...CAE, ...CALC, ...GUIA, ...globales }
  if (quiero.size) throw new Error(`No están en ${ruta}: ${[...quiero].join(', ')}`)
  const ctx = { ...globales }
  vm.createContext(ctx)
  vm.runInContext(partes.join('\n'), ctx)
  return ctx
}

module.exports = { vigente, cargar }
