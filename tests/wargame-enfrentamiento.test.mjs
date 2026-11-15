// v2.9.485 — ⚔ ENFRENTAMIENTO ROJO vs AZUL POR FASES: el .json del PICB del Teatro (paso 5 del Generador de Calcos)
// entra como escenario de TEATRO por el mismo módulo que un ejercicio (assets/wargame-teatro.mjs), y «⚔ Órdenes por
// fase» le da a cada GU de la fase su orden (marchar a su posición o defender), sólo con la partida en curso.
//   ENFRENTAMIENTO_JSON=".../… ENFRENTAMIENTO ROJO vs AZUL.json" node tests/wargame-enfrentamiento.test.mjs
import assert from 'assert/strict'
import fs from 'fs'
import vm from 'vm'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ej = process.env.ENFRENTAMIENTO_JSON
if (!ej) { console.log('wargame-enfrentamiento: sin ENFRENTAMIENTO_JSON, no corre.'); process.exit(0) }
// La carta del teatro se pide con fetch: en node se lee del disco.
globalThis.fetch = async (u) => { const t = fs.readFileSync(fileURLToPath(String(u).split('?')[0]), 'utf8'); return { ok: true, status: 200, json: async () => JSON.parse(t), text: async () => t } }

const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')
const i0 = html.indexOf('// v2.9.485 — ⚔ ENFRENTAMIENTO ROJO vs AZUL POR FASES'), i1 = html.indexOf('async function wgImportarEscenario(')
assert.ok(i0 > 0 && i1 > i0, 'el bloque v2.9.485 está antes de wgImportarEscenario')
assert.ok(html.includes("d.formato==='sideceme/enfrentamiento-teatro'") && html.includes('_wgEnfGuardar(esc.enfrentamiento)'), 'el importador reconoce el .json y guarda el plan')
const store = new Map(), avisos = [], enviados = []
const ctx = {
  WG: { partidaId: 7, ordenes: {}, estado: { partida: { estado: 'planificacion' } } }, console, setTimeout: () => 0,
  localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  _wgAviso: (m) => avisos.push(m), _rgEsc: (s) => String(s ?? ''), _wgUnidadesVisibles: () => ctx.unidades || [],
  _wgEnviarOrdenesLote: async (ids) => { enviados.push(...ids) },
  document: { _el: null, getElementById(id) { return id === 'wg-enf' ? this._el : null }, createElement() { return { style: {} } }, body: { appendChild(e) { ctx.document._el = e } } },
}
vm.createContext(ctx)
vm.runInContext(html.slice(html.lastIndexOf('// ====', i0), i1), ctx)
const j = JSON.parse(fs.readFileSync(ej, 'utf8'))
const m = await import(pathToFileURL(path.join(RAIZ, 'assets', 'wargame-teatro.mjs')).href)

// 1 · Escenario de teatro con las GG.UU. de los dos bandos.
const esc = await m.escenario(ctx._wgEnfComoEjercicio(j), null)
const rojos = esc.unidades.filter((u) => u.bando === 'rojo'), azules = esc.unidades.filter((u) => u.bando === 'azul')
const afuera = [...j.unidades.rojo, ...j.unidades.azul].filter((u) => !esc.unidades.some((x) => x.designacion === u.designacion)).map((u) => `${u.designacion} (${u.escalon})`)
console.log(`  · escenario: ${rojos.length} GG.UU. rojas y ${azules.length} azules, ${esc.terreno.length} elementos de carta` + (afuera.length ? `\n  · quedan afuera (escalón sin poder en el juego): ${afuera.join('; ')}` : ''))
assert.equal(esc.escala, 'teatro')
assert.ok(rojos.length >= 8 && azules.length >= 3, 'GG.UU. de los dos bandos')
assert.ok(esc.unidades.every((u) => u.poder_max > 0 && Number.isFinite(u.lng) && Number.isFinite(u.lat)), 'poder y posición')
// 2 · Sin la partida en curso no da órdenes.
ctx.unidades = esc.unidades.map((u, k) => ({ ...u, id: 100 + k, estado: 'activa' }))
ctx._wgEnfGuardar(j, false)
await ctx._wgEnfOrdenes(1)
assert.equal(enviados.length, 0); assert.match(avisos.at(-1), /Iniciar/)
// 3 · En curso: la F-II para todas las GG.UU. de la fase que están en la partida.
ctx.WG.estado.partida.estado = 'en_curso'
await ctx._wgEnfOrdenes(1)
const f2 = j.fases[1], hay = new Set(esc.unidades.map((u) => u.designacion))
const esperadas = new Set([...f2.rojo, ...f2.azul].map((x) => x.unidad).filter((n) => hay.has(n)))
assert.equal(enviados.length, esperadas.size, `órdenes ${enviados.length}, GG.UU. de la F-II en la partida ${esperadas.size}`)
const ords = enviados.map((id) => ctx.WG.ordenes[id])
assert.ok(ords.every((o) => (o.tipo === 'mover' && Number.isFinite(o.destino_lng) && o.ruta.length === 1) || o.tipo === 'defender'), 'mover (con destino) o defender')
for (const x of f2.azul) {
  const u = ctx.unidades.find((y) => y.designacion === x.unidad), o = u && ctx.WG.ordenes[u.id]
  assert.ok(o && (o.tipo === 'defender' || (o.destino_lng === x.lng && o.destino_lat === x.lat)), `${x.unidad} va a su posición de la F-II`)
}
assert.equal(ctx._wgEnfFase(), 1, 'queda marcada la F-II')
assert.ok(/Dar las órdenes de la F-IV/.test(ctx.document._el.innerHTML) && /✓ F-II/.test(ctx.document._el.innerHTML), 'el panel muestra las fases y la dada')
const mueven = ords.filter((o) => o.tipo === 'mover').length
console.log(`  ✓ F-II: ${enviados.length} órdenes (${mueven} marchan, ${ords.length - mueven} defienden) · «${avisos.at(-1)}»`)
console.log('wargame-enfrentamiento: OK')
