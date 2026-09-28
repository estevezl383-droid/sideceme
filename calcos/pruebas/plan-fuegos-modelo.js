// Modelo del plan de fuegos (calcos/fuegos/plan-fuegos.js), en Node.
//
// Usa las funciones REALES de la Mesa (eh, p5, lP, dP, uP, js, gK, mK y la
// librería mgrs), sacadas textualmente del compilado que carga calcos/index.html.
//
//   node plan-fuegos-modelo.js
const assert = require('assert')
const fs = require('fs')
const { vigente } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')
const PF = require('../fuegos/plan-fuegos')
const { ejercicioFuegos } = require('./ejercicio-fuegos')
const { pieza } = require('./ejercicio-ficticio')

const ruta = vigente()
const M = cargarConDependencias(ruta, ['eh', 'p5', 'dK', 'mK', 'lP', 'dP', 'uP', 'js', 'gK', 'V_e', 'lS'], (c) => {
  for (const arma of ['artilleria', 'infanteria', 'caballeria', 'morteros', 'lanzacohetes']) c.eh({ arma, escalon: 'batallon' })
  c.lP('artilleria')
  c.js({ designacion: 'x', escalon: 'batallon', arma: 'infanteria' })
  c.uP({ nombre: 'x', ft: true })
  c.dP({ id: 'a' }, [])
  c.gK([], { lat: 0, lng: 0 })
  for (const p of [[-68, -16], [-63, -17], [-58, -20], [10, 60], [151, -34]]) c.V_e.forward(p, 5)
})
console.log(`\nCompilado: ${ruta.replace(/.*calcos\//, 'calcos/')}\n`)

let fallas = 0
function caso(nombre, fn) {
  try {
    fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.stack || e.message).split('\n').slice(0, 6).join('\n      ')}`)
  }
}

const d = ejercicioFuegos()
const ctx = (plan = null, extra = {}) => ({ unidades: d.unidades, todas: d.unidades, orgTarea: d.orgTarea, plan, mesa: M, ...extra })
const porId = (medios, id) => medios.find((m) => m.id === id)

caso('La FT lleva su batería de artillería, con el obús de su grupo, en la posición de la ficha de la FT', () => {
  const { grupos, medios } = PF.mediosDeApoyo(ctx())
  const ft = grupos.find((g) => g.clave === 'org:ag-1700000000000-0')
  assert.ok(ft, 'no está el grupo de la FT')
  assert.strictEqual(ft.titulo, 'FT «ÁGUILA» (FICT.)')
  assert.strictEqual(ft.chip, 'FT')
  const art = porId(medios, 'pieza:fict-charlie-1')
  assert.strictEqual(art.nombre, 'ART 1')
  assert.strictEqual(art.sistemaId, M.eh(d.unidades[2]).fuegos.sistemaId) // el del G.A. «CHARLIE»
  assert.strictEqual(art.alcance.m, 19800)
  assert.strictEqual(art.alcanceMin, 2100)
  assert.deepStrictEqual(art.pos, [-65.02, -17.03]) // ficha consolidada de la FT
  assert.strictEqual(art.posOrigen, 'ficha de la organización')
  // Sólo las piezas de apoyo de fuego: las de infantería y caballería no son medios.
  assert.deepStrictEqual(
    ft.medios.map((m) => m.id),
    ['pieza:fict-charlie-1', 'organica:fict-ft-aguila'],
  )
})

caso('Armas de apoyo orgánicas: las de la FT y las de las unidades de maniobra, con el mismo cálculo de la Mesa (eh)', () => {
  const { grupos, medios } = PF.mediosDeApoyo(ctx())
  const org = porId(medios, 'organica:fict-ft-aguila')
  const ficha = d.unidades.find((u) => u.id === 'fict-ft-aguila')
  assert.strictEqual(org.alcance.m, M.eh(ficha).influencia.m)
  assert.strictEqual(org.alcance.fuente, 'estimacion')
  const man = grupos.find((g) => g.clave === 'maniobra')
  // B.I. «ALFA» tiene morteros orgánicos; caballería e ingeniería no (fK de la Mesa).
  assert.deepStrictEqual(man.medios.map((m) => m.id), ['organica:fict-alfa'])
  const sueltas = grupos.find((g) => g.clave === 'organicas')
  assert.deepStrictEqual(sueltas.medios.map((m) => m.id), ['ficha:fict-charlie'])
  assert.strictEqual(medios.length, 4)
  assert.strictEqual(new Set(medios.map((m) => m.color)).size, 4, 'cada medio con su color')
})

caso('Una pieza repetida en dos organizaciones cuenta una sola vez; sin consolidar, va con su unidad orgánica', () => {
  const orgTarea = [
    ...d.orgTarea,
    { id: 'ag-x', nombre: 'AGR «X» (FICT.)', ft: false, piezas: [pieza(d.unidades[2], 1), pieza(d.unidades[2], 2)] },
  ]
  const { medios } = PF.mediosDeApoyo(ctx(null, { orgTarea }))
  assert.strictEqual(medios.filter((m) => m.id === 'pieza:fict-charlie-1').length, 1)
  const art2 = porId(medios, 'pieza:fict-charlie-2')
  assert.deepStrictEqual(art2.pos, [d.unidades[2].lng, d.unidades[2].lat])
  assert.strictEqual(art2.posOrigen, 'ficha de su unidad orgánica')
})

caso('Pieza sin ficha ni unidad en el calco: no tiene posición y el blanco asignado a ella queda fuera', () => {
  const orgTarea = [{ id: 'ag-y', nombre: 'Y', piezas: [{ id: 'fantasma-1', de: 'fantasma', simbolo: 'morteros', escalon: 'seccion', madre: 'CÍA. MORT. «FANTASMA»', nom: 'MORT 1' }] }]
  const { medios } = PF.mediosDeApoyo(ctx(null, { orgTarea }))
  const m = porId(medios, 'pieza:fantasma-1')
  assert.strictEqual(m.pos, null)
  assert.strictEqual(m.alcance.m, 5500) // mortero 120 (fK.morteros de la Mesa)
  const ev = PF.evaluar([-65.05, -17.0], medios, m.id)
  assert.strictEqual(ev.fuera, true)
  assert.match(ev.consejo, /no tiene posición de fuego/)
})

caso('El G-3 cambia el sistema y la posición de fuego; «↺» vuelve a la ficha', () => {
  let plan = PF.editarMedio(null, 'pieza:fict-charlie-1', { sistema: 'lar160', pos: [-65.1, -16.9], ver: true })
  let art = porId(PF.mediosDeApoyo(ctx(plan)).medios, 'pieza:fict-charlie-1')
  assert.deepStrictEqual([art.alcance.m, art.alcanceMin, art.pos, art.posMovida, art.ver], [30000, 12000, [-65.1, -16.9], true, true])
  plan = PF.editarMedio(plan, 'pieza:fict-charlie-1', { pos: null })
  art = porId(PF.mediosDeApoyo(ctx(plan)).medios, 'pieza:fict-charlie-1')
  assert.deepStrictEqual([art.pos, art.posMovida], [[-65.02, -17.03], false])
  plan = PF.editarMedio(plan, 'pieza:fict-charlie-1', { sistema: null, ver: null })
  assert.deepStrictEqual(plan.medios, {}, 'una configuración vacía no se guarda')
})

caso('Alcance: dentro, fuera (cuánto acercarse) y dentro del alcance mínimo (cuánto alejarse)', () => {
  const { medios } = PF.mediosDeApoyo(ctx())
  const art = porId(medios, 'pieza:fict-charlie-1')
  const cerca = PF.evaluar([-65.06, -16.995], medios, art.id)
  assert.deepStrictEqual([cerca.fuera, cerca.consejo], [false, ''])
  const lejos = PF.evaluar([-65.2, -16.8], medios, art.id)
  assert.strictEqual(lejos.fuera, true)
  const falta = lejos.fila.d - 19800
  assert.ok(falta > 0)
  assert.ok(lejos.consejo.includes(`tiene que acercarse ${PF.fmtDist(falta)}`), lejos.consejo)
  const pegado = PF.evaluar(PF.desplazar(art.pos, 1500, 45), medios, art.id)
  assert.strictEqual(pegado.fuera, true)
  assert.ok(Math.abs(pegado.fila.d - 1500) < 10)
  assert.ok(pegado.consejo.endsWith(`dentro de su alcance mínimo (2.1 km): tiene que alejarse ${PF.fmtDist(2100 - pegado.fila.d)}.`), pegado.consejo)
})

caso('Asignado manda: si el medio asignado no llega es fucsia aunque otro llegue; sin asignar, basta uno', () => {
  const { medios } = PF.mediosDeApoyo(ctx())
  const punto = PF.desplazar([-65.02, -17.03], 4000, 0) // 4 km al norte de la FT
  const conMortero = PF.evaluar(punto, medios, 'organica:fict-ft-aguila') // mortero 81: 3 km
  assert.strictEqual(conMortero.fuera, true)
  assert.match(conMortero.consejo, /Armas de apoyo de FT «ÁGUILA» \(FICT\.\) tiene que acercarse 1\.0 km/)
  const sinAsignar = PF.evaluar(punto, medios)
  assert.strictEqual(sinAsignar.fuera, false)
  assert.ok(sinAsignar.alcanzan.some((f) => f.medio.id === 'pieza:fict-charlie-1'))
  const borrado = PF.evaluar(punto, medios, 'pieza:ya-no-esta')
  assert.match(borrado.consejo, /ya no está en el calco/)
})

caso('Mismo resultado que el «¿qué blancos alcanzo?» de la Mesa (gK) para las fichas de artillería', () => {
  const charlie = d.unidades[2]
  const { medios } = PF.mediosDeApoyo(ctx())
  const ficha = porId(medios, 'ficha:fict-charlie')
  let n = 0
  for (let dist = 500; dist <= 30000; dist += 700)
    for (const az of [0, 77, 190, 300]) {
      const [lng, lat] = PF.desplazar([charlie.lng, charlie.lat], dist, az)
      const mesa = M.gK([charlie], { lng, lat }, 'fuegos').length > 0
      const f = PF.evaluar([lng, lat], [{ ...ficha, alcanceMin: 0 }], ficha.id)
      assert.strictEqual(!f.fuera, mesa, `a ${dist} m, rumbo ${az}°`)
      n++
    }
  assert.ok(n > 100)
})

caso('Blancos enemigos del calco: el cercano es batible, el lejano no (y dice cuánto acercarse)', () => {
  const { medios } = PF.mediosDeApoyo(ctx())
  const ev = PF.evaluarEnemigos(d.unidades, medios, M)
  assert.deepStrictEqual(ev.map((e) => [e.nombre, e.fuera]), [
    [M.js(d.unidades.find((u) => u.id === 'fict-eno-cerca')), false],
    [M.js(d.unidades.find((u) => u.id === 'fict-eno-lejos')), true],
  ])
  assert.match(ev[1].consejo, /^Ningún medio lo alcanza desde donde está: .* tiene que acercarse/)
})

caso('Coordenadas: MGRS igual a la librería de la Mesa (±1 m por redondeo) y UTM de alta precisión', () => {
  let n = 0
  const puntos = []
  for (let lat = -22.8; lat <= -9.8; lat += 0.9) for (let lng = -69.5; lng <= -57.6; lng += 0.83) puntos.push([lng, lat])
  puntos.push([10.7, 59.9], [151.2, -33.9], [-3.7, 40.4], [-0.1, 51.5], [-77.03, 38.9], [18.4, -33.9])
  for (const [lng, lat] of puntos) {
    const mio = PF.mgrs(lng, lat).split(' ')
    const lib = M.V_e.forward([lng, lat], 5)
    assert.strictEqual(mio[0] + mio[1], lib.slice(0, -10), `${lng},${lat}: ${mio.join(' ')} vs ${lib}`)
    assert.ok(Math.abs(Number(mio[2]) - Number(lib.slice(-10, -5))) <= 1, `E ${lng},${lat}: ${mio[2]} vs ${lib}`)
    assert.ok(Math.abs(Number(mio[3]) - Number(lib.slice(-5))) <= 1, `N ${lng},${lat}: ${mio[3]} vs ${lib}`)
    n++
  }
  assert.ok(n > 200)
  const c = PF.coordenadas(-68.15, -16.5)
  assert.strictEqual(c.geo, `16°30'00,0" S · 68°09'00,0" O`)
  assert.strictEqual(c.utmZona, '19K')
  assert.deepStrictEqual([c.utmE, c.utmN], [590716, 8175565])
  assert.strictEqual(c.mgrs, '19K EB 90716 75564') // N = 8 175 564,99 m: la MGRS trunca
})

caso('Numeración AB-010, AB-011…: sigue a la mayor y no choca con nombres a mano', () => {
  let { plan, id } = PF.nuevoBlanco(null, [-65, -17], {}, 1000)
  assert.strictEqual(plan.blancos[0].num, 'AB-010')
  ;({ plan } = PF.nuevoBlanco(plan, [-65, -17.1], {}, 1000))
  assert.deepStrictEqual(plan.blancos.map((b) => b.num), ['AB-010', 'AB-011'])
  assert.notStrictEqual(plan.blancos[0].id, plan.blancos[1].id)
  plan = PF.editarBlanco(plan, id, { num: 'AB-023' })
  plan = PF.nuevoBlanco(plan, [-65, -17.2], { num: undefined }, 2000).plan
  plan = PF.nuevoBlanco(PF.editarBlanco(plan, plan.blancos[2].id, { num: 'BARRERA NORTE' }), [-65, -17.3], {}, 3000).plan
  assert.deepStrictEqual(plan.blancos.map((b) => b.num), ['AB-023', 'AB-011', 'BARRERA NORTE', 'AB-024'])
  // Con el id elegido por la vista, repetir el alta no la duplica.
  const r = PF.nuevoBlanco(plan, [-65, -17.4], { id: 'pf-fijo' }, 4000)
  assert.strictEqual(PF.nuevoBlanco(r.plan, [-65, -17.4], { id: 'pf-fijo' }, 4000).plan.blancos.length, r.plan.blancos.length)
})

caso('Edición: números con coma, orientación en 0-359, sin negativos; el resto queda igual', () => {
  const { plan, id } = PF.nuevoBlanco(null, [-65, -17], {}, 1)
  const p = PF.editarBlanco(plan, id, { radioM: '150,5', orientacion: '370', largoM: '-3', anchoM: '', descripcion: 'x' })
  const b = p.blancos[0]
  assert.deepStrictEqual([b.radioM, b.orientacion, b.largoM, b.anchoM, b.descripcion, b.num], [150.5, 10, 0, null, 'x', 'AB-010'])
  assert.strictEqual(PF.borrarBlanco(p, id).blancos.length, 0)
  const n = PF.normalizarPlan({ medios: [1], blancos: [null, { lng: 'a' }, { lng: 1, lat: 2 }] })
  assert.deepStrictEqual([n.medios, n.blancos.length, n.verEnCarta, n.version], [{}, 1, true, 1])
})

caso('Geometría: círculo con su radio, rectángulo de largo × ancho orientado, línea de su largo', () => {
  const base = { lng: -65, lat: -17, radioM: 250, largoM: 600, anchoM: 200, orientacion: 30 }
  assert.deepStrictEqual(PF.geometria({ ...base, forma: 'circular' }), { tipo: 'circulo', centro: [-65, -17], radio: 250 })
  const r = PF.geometria({ ...base, forma: 'rectangular' }).puntos
  const lado = (a, b) => PF.distanciaM(a, b)
  assert.ok(Math.abs(lado(r[0], r[1]) - 200) < 2 && Math.abs(lado(r[1], r[2]) - 600) < 3, 'lados del rectángulo')
  const l = PF.geometria({ ...base, forma: 'lineal' }).puntos
  assert.ok(Math.abs(lado(l[0], l[1]) - 600) < 3)
  assert.strictEqual(PF.geometria({ ...base, forma: 'puntual' }).tipo, 'punto')
})

caso('Matriz de ejecución de apoyo de fuegos: las mismas columnas que la hoja de la Mesa', () => {
  const src = fs.readFileSync(ruta, 'utf8')
  const m = /id:"fuegos",num:"F4·P7",[^\]]*?cols:\[([^\]]*)\]/.exec(src)
  assert.ok(m, 'no se encontró la hoja «fuegos» en el compilado')
  const cols = JSON.parse(`[${m[1]}]`)
  const { medios } = PF.mediosDeApoyo(ctx())
  let plan = PF.nuevoBlanco(null, [-65.06, -16.995], { descripcion: 'Sección de morteros (FICT.)', medio: 'pieza:fict-charlie-1', fase: 'FASE II' }, 1).plan
  plan = PF.nuevoBlanco(plan, [-65.2, -16.8], {}, 2).plan
  const filas = PF.filasMatriz(plan, medios, M.mK)
  assert.deepStrictEqual(Object.keys(filas[0]), cols)
  assert.match(filas[0]['Blanco (AB-)'], /^AB-010 — Sección de morteros \(FICT\.\) · 20K KG \d{5} \d{5}$/)
  assert.strictEqual(filas[0]['Unidad que lo bate'], 'ART 1 (FT «ÁGUILA» (FICT.))')
  assert.strictEqual(filas[0]['Tiempo de respuesta'], '6-15 min (estimación)') // art_gen de mK
  assert.match(filas[1]['Unidad que lo bate'], /SIN MEDIO QUE LO ALCANCE — ⚠ FUERA DE ALCANCE/)
})

caso('Lista de blancos (Word): fila fucsia la fuera de alcance, posiciones de fuego y texto escapado', () => {
  const { medios } = PF.mediosDeApoyo(ctx())
  let plan = PF.nuevoBlanco(null, [-65.06, -16.995], { descripcion: '<b>morteros</b>' }, 1).plan
  plan = PF.nuevoBlanco(plan, [-65.2, -16.8], {}, 2).plan
  const html = PF.documentoHTML(plan, medios, { ejercicio: 'EJ', unidad: 'U', fecha: 'hoy' })
  assert.match(html, /<tr><td>1<\/td><td>AB-010<\/td>/)
  assert.match(html, /<tr class="fuera"><td>2<\/td><td>AB-011<\/td>/)
  assert.ok(html.includes('&lt;b&gt;morteros&lt;/b&gt;') && !html.includes('<b>morteros</b>'))
  assert.match(html, /Posiciones de fuego[\s\S]*ART 1 \(FT «ÁGUILA» \(FICT\.\)\)[\s\S]*Obús 105 mm NA M-101\/33[\s\S]*19\.8 km \(mínimo 2\.1 km\)/)
})

caso('El alcance mínimo sale de la misma cita del catálogo de la Mesa', () => {
  const cita = (id) => M.p5.find((s) => s.id === id).cita
  assert.match(cita('obus105m101'), /«2\.100m a 19\.800 m»/)
  assert.match(cita('lar160'), /«12\.000 a 30000 mts\.»/)
  assert.deepStrictEqual(PF.ALCANCE_MINIMO, { obus105m101: 2100, lar160: 12000 })
  for (const g of PF.GRUPOS_SISTEMA) assert.ok(M.p5.some((s) => s.gr === g), `grupo ${g} sin sistemas en p5`)
})

console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
process.exit(fallas ? 1 : 0)
