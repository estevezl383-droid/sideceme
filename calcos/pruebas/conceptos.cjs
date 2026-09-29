// Hoja F2·P1 «Conceptos entrelazados» (calcos/conceptos/v4/), sin navegador:
//   · la integración anterior (integrar-conceptos.cjs) sigue siendo reversible;
//   · se leen igual la hoja v1, la v2 y el formato narrativo;
//   · la jerarquía: CTO XXXXX → FF.TT.T.O. XXXX → CE XXX → División XX → sus unidades;
//   · 🌱 el armado automático con las tres opciones (unidades puras, FT / agrupaciones,
//     adyacentes), con el caso del docente (conceptos-divmec.js) y el ficticio de antes;
//   · la IA que pone unidades fuera de su escalón queda corregida;
//   · las láminas tienen la forma del ejemplo del PMTD y no pierden texto;
//   · el pedido a la IA y la aplicación de su respuesta.
//
//   node conceptos.cjs
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { pathToFileURL } = require('node:url')
const { cambios, aplicar } = require('./integrar-conceptos.cjs')
const { ejemploPMTD } = require('./conceptos-ejemplo-pmtd.js')
const { ejercicioConceptos, respuestaIA } = require('./conceptos-ejercicio.js')
const { ejercicioDivmec, respuestaIAEquivocada, ORGANIZACION, PURAS } = require('./conceptos-divmec.js')
const raiz = path.resolve(__dirname, '..')

let fallas = 0
async function caso(nombre, fn) {
  try {
    await fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.stack || e.message).split('\n').slice(0, 6).join('\n      ')}`)
  }
}
const texto = (svg) => svg.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
const palabras = (t) => String(t).split(/\s+/).filter(Boolean)

;(async () => {
  const url = (f) => pathToFileURL(path.join(raiz, 'conceptos', 'v4', f)).href
  const m = await import(url('modelo.js'))
  const l = await import(url('laminas.js'))
  const ia = await import(url('ia.js'))
  console.log('\nConceptos entrelazados (calcos/conceptos/v4)\n')

  await caso('la integración anterior sigue siendo reversible (index-conceptos-20260928.js → index-zhbwncsH.js)', () => {
    const original = fs.readFileSync(path.join(raiz, 'assets/index-zhbwncsH.js'), 'utf8')
    const nuevo = fs.readFileSync(path.join(raiz, 'assets/index-conceptos-20260928.js'), 'utf8')
    assert.equal(aplicar(nuevo, [...cambios].reverse().map(([a, b]) => [b, a])), original)
  })

  await caso('el texto narrativo de antes se conserva (y va a la IA)', () => {
    const antiguo = { 'INTENCIÓN DEL COMANDANTE SUPERIOR (dos niveles arriba)': 'ANTECEDENTE SIN ALTERAR' }
    const v = m.normalizarConceptos(antiguo)
    assert.equal(v.esquema, 'conceptos-v3')
    assert.deepEqual(m.antecedentesConceptos(v), Object.entries(antiguo))
    assert.ok(ia.pedidoIA(v).prompt.includes('ANTECEDENTE SIN ALTERAR'))
  })

  await caso('la hoja de antes (conceptos-v1) se lee: símbolos, fases por nombre, relaciones', () => {
    const v1 = {
      esquema: 'conceptos-v1',
      unidades: [
        { id: 'a', grupo: 'superior2', nombre: 'CE', simbolo: 'CE', tarea: 'T1', proposito: 'P1', fases: [] },
        { id: 'b', grupo: 'maniobra', nombre: 'LANZA', simbolo: 'infanteria', rol: 'OC1', esfuerzo: true, fases: [{ nombre: 'FASE I', tarea: 'tf1', proposito: 'pf1' }, { nombre: 'FASE II', tarea: 'tf2' }] },
        { id: 'c', grupo: 'maniobra', nombre: 'CALAMA', simbolo: 'infanteria', rol: 'OD', fases: [{ nombre: 'FASE II', tarea: 'x' }] },
      ],
      relaciones: [{ desde: 'b', hasta: 'c', tipo: 'directa' }, { desde: 'b', hasta: 'zz', tipo: 'directa' }],
    }
    const v = m.normalizarConceptos(v1)
    assert.deepEqual(v.fases.map((f) => f.nombre), ['FASE I', 'FASE II'])
    assert.equal(v.unidades[0].texto, 'CE')
    assert.equal(v.unidades[1].arma, 'infanteria')
    assert.equal(v.unidades[2].fases[0].fase, v.fases[1].id)
    assert.equal(v.relaciones.length, 1)
  })

  await caso('🌱 armado automático (opción FT): cadena de mando completa, FT con su OD, lo que quedó con «(-)»', () => {
    const ej = ejercicioConceptos()
    const { valor, resumen } = m.armarDesdeEjercicio(ej, { enfoque: 'ft' })
    const cad = valor.unidades.filter((u) => u.grupo === 'superior')
    assert.deepEqual(cad.map((u) => u.magnitud), ['XXXXX', 'XXXX', 'XXX', 'XX'])
    assert.deepEqual(cad.map((u) => u.texto || u.arma), ['CTO', 'FF.TT.T.O.', 'CE', 'mecanizada'])
    assert.equal(cad[2].nombre, 'I CUERPO DE EJÉRCITO (FICT.)')
    assert.equal(cad[2].tarea, 'Defiende en el sector norte')
    assert.equal(cad[2].proposito, 'Proteger la capital (FICT.)')
    const propia = cad[3]
    assert.ok(propia.propia)
    assert.equal(propia.nombre, 'DIV.MEC.-1 (FICT.)')
    assert.equal(propia.numero, '1')
    assert.match(propia.tarea, /^Defiende el sector asignado/)
    assert.match(propia.proposito, /^Destruir a la brigada blindada/)
    const g = (x) => valor.unidades.filter((u) => u.grupo === x)
    const man = g('maniobra')
    assert.deepEqual(man.map((u) => u.nombre).sort(), ['FT «GOLF»', 'RCM-2 «BRAVO» (FICT.)', 'RIM-1 «ALFA» (FICT.)', 'RIM-3 «CHARLIE» (FICT.) (-)'].sort())
    const od = man.find((u) => u.rol === 'OD')
    assert.equal(od.nombre, 'FT «GOLF»')
    assert.equal(od.tarea, 'Defiende y destruye')
    assert.match(od.proposito, /^Evitar que la brigada/)
    assert.deepEqual(g('apoyo').map((u) => u.arma).sort(), ['artilleria', 'ingenieria'])
    assert.deepEqual(g('spac').map((u) => u.arma), ['logistica'])
    assert.ok(!valor.unidades.some((u) => /ROJA/.test(u.nombre)), 'el enemigo no entra')
    assert.deepEqual(valor.fases.map((f) => f.nombre), ['OCUPACIÓN DE LA POSICIÓN (FICT.)', 'DEFENSA (FICT.)', 'CONTRAATAQUE (FICT.)'])
    const rel = (a, b) => valor.relaciones.find((r) => r.desde === a.id && r.hasta === b.id)
    for (let i = 3; i > 0; i--) assert.ok(rel(cad[i], cad[i - 1]), 'cada escalón con su inmediato superior')
    assert.ok(rel(od, propia))
    assert.ok(resumen.fuentes.some((f) => /Organización de la tarea/.test(f)))
    // Traer lo que falte no pisa nada: se vuelve a armar sobre lo escrito.
    const escrita = { ...valor, unidades: valor.unidades.map((u) => (u.id === od.id ? { ...u, tarea: 'ESCRITO POR EL OFICIAL' } : u)) }
    const otra = m.armarDesdeEjercicio(ej, { previo: escrita })
    assert.equal(otra.resumen.agregadas, 0)
    assert.equal(otra.valor.unidades.find((u) => u.id === od.id).tarea, 'ESCRITO POR EL OFICIAL')
    assert.equal(otra.valor.unidades.length, valor.unidades.length)
    // «Adyacentes»: la cadena llega al CE y la unidad propia va en la fila.
    const ady = m.armarDesdeEjercicio(ej, { enfoque: 'adyacentes' }).valor
    assert.deepEqual(ady.unidades.filter((u) => u.grupo === 'superior').map((u) => u.magnitud), ['XXXXX', 'XXXX', 'XXX'])
    assert.ok(ady.unidades.find((u) => u.grupo === 'maniobra' && u.propia))
    assert.ok(ady.unidades.some((u) => u.grupo === 'maniobra' && /DIV-2/.test(u.nombre)), 'la DIV-2 de «fuerzas amigas» es adyacente')
  })

  await caso('escalones, magnitudes y armas por la designación (siglas de la casa)', () => {
    const e = (n) => [m.escalonDeNombre(n), m.armaDeNombre(n)]
    assert.deepEqual(e('Comando del Teatro de Operaciones'), ['teatro', ''])
    assert.deepEqual(e('CTO'), ['teatro', ''])
    assert.deepEqual(e('Fuerzas Terrestres del Teatro de Operaciones'), ['fftt', ''])
    assert.deepEqual(e('FF.TT.T.O.'), ['fftt', ''])
    assert.deepEqual(e('Cuerpo de Ejército I'), ['cuerpo', ''])
    assert.deepEqual(e('I CE'), ['cuerpo', ''])
    assert.deepEqual(e('DIVMEC-1'), ['division', 'mecanizada'])
    assert.deepEqual(e('DIV.MEC.-1'), ['division', 'mecanizada'])
    assert.deepEqual(e('RCB-1 “CALAMA”'), ['regimiento', 'cabmec'])
    assert.deepEqual(e('RIM-23 «MAX TOLEDO»'), ['regimiento', 'mecanizada'])
    assert.deepEqual(e('RIAT-30'), ['regimiento', 'antitanque'])
    assert.deepEqual(e('RAM-2'), ['regimiento', 'artilleria'])
    assert.deepEqual(e('RAA-6'), ['regimiento', 'antiaerea'])
    assert.deepEqual(e('BATING. MEC.- II'), ['batallon', 'ingenieria'])
    assert.deepEqual(e('BAT. LOG. - I'), ['batallon', 'logistica'])
    assert.deepEqual(e('BAT. COM. MEC. - I'), ['batallon', 'comunicaciones'])
    assert.deepEqual(e('COMP. ICIA. - I'), ['compania', 'inteligencia'])
    assert.deepEqual(e('Comp. Av. Ejto. “Cnl. Lopez”'), ['compania', 'aviacion'])
    assert.deepEqual(e('Bat. Art. Mec. “A”'), ['compania', 'artilleria'])
    assert.equal(m.escalonDeNombre('FT VARGS'), '')
    assert.ok(m.mismaUnidad('BATING-II', 'BATING. MEC.-II «ROMAN»'))
    assert.ok(m.mismaUnidad('DIV.MEC.-1', 'DIVMEC-1'))
    assert.ok(!m.mismaUnidad('RC-1', 'RCB-1'))
    assert.ok(!m.mismaUnidad('BAT. COM. MEC.-I', 'BAT. LOG.-I'))
    // Una hoja guardada con el TO en XXX y el CE en XX sale con las magnitudes correctas.
    const v = m.normalizarConceptos({ unidades: [{ id: 'a', grupo: 'superior2', nombre: 'Fuerzas Terrestres del Teatro de Operaciones', texto: 'TO', magnitud: 'XXX' }, { id: 'b', grupo: 'superior1', nombre: 'Cuerpo de Ejército I', texto: 'CE', magnitud: 'XX' }] })
    assert.deepEqual(v.unidades.map((u) => [u.grupo, u.magnitud, u.texto]), [['superior', 'XXXX', 'FF.TT.T.O.'], ['superior', 'XXX', 'CE']])
  })

  await caso('la organización de la tarea de la orden: cada columna es una unidad; sus subunidades no', () => {
    const r = m.unidadesDeOrganizacion(ORGANIZACION, { propia: 'DIVMEC-1', escPropia: 'division' })
    assert.equal(r.ambigua, false)
    assert.deepEqual(r.unidades.map((u) => u.nombre).sort(), PURAS.map((x) => x[0]).sort())
    assert.equal(r.unidades.find((u) => /Av\. Ejto/.test(u.nombre)).mando, 'BAJO CONTROL')
    assert.ok(r.unidades.filter((u) => !/Av\. Ejto/.test(u.nombre)).every((u) => !u.mando))
    // Con dos divisiones es la organización del escalón superior: no se adivina.
    const dos = m.unidadesDeOrganizacion('DIVMEC-1\nDIVMEC-2\nRCB-1\nRIM-8\nRCB-2', { propia: 'DIVMEC-1' })
    assert.equal(dos.ambigua, true)
    assert.deepEqual(dos.unidades, [])
    assert.deepEqual(dos.adyacentes, ['DIVMEC-2'])
  })

  await caso('🪖 opción «Unidades puras» con el caso del docente: CTO → FF.TT.T.O. → CE → DIVMEC-1 y debajo sus 12 unidades', () => {
    const { valor, resumen } = m.armarDesdeEjercicio(ejercicioDivmec(), { enfoque: 'puras' })
    const cad = valor.unidades.filter((u) => u.grupo === 'superior')
    assert.deepEqual(cad.map((u) => [u.magnitud, u.texto || u.arma]), [['XXXXX', 'CTO'], ['XXXX', 'FF.TT.T.O.'], ['XXX', 'CE'], ['XX', 'mecanizada']])
    assert.equal(cad[3].nombre, 'DIVMEC-1', 'la unidad propia sale de la misión (la «Unidad» de la orden está vacía)')
    assert.ok(cad[3].propia)
    assert.match(cad[1].tarea, /^Defienden y neutralizan/)
    assert.match(cad[2].tarea, /^Defiende y derrota al CE I de ROJO/)
    const filas = valor.unidades.filter((u) => u.grupo !== 'superior')
    assert.deepEqual(filas.map((u) => [u.nombre, u.magnitud, u.arma, u.grupo]).sort(), PURAS.map((x) => [...x]).sort())
    assert.ok(!filas.some((u) => /Comp\. Inf\. Mec/.test(u.nombre)), 'la subunidad suelta del calco no depende directamente')
    assert.ok(!filas.some((u) => /DIVMEC-2/.test(u.nombre)), 'la otra división no va entre las propias')
    assert.ok(filas.every((u) => valor.relaciones.some((r) => r.desde === u.id && r.hasta === cad[3].id)), 'todas dependen de la División')
    assert.ok(resumen.fuentes.some((f) => /Organización de la tarea/.test(f)))
    assert.deepEqual(m.revisarConceptos(valor).filter((a) => /escalón|cadena|propia|fila/.test(a)), [])
  })

  await caso('🧩 opción «FT / agrupaciones» con el caso del docente: las FT debajo de la DIVMEC-1', () => {
    const { valor } = m.armarDesdeEjercicio(ejercicioDivmec(), { enfoque: 'ft' })
    const cad = valor.unidades.filter((u) => u.grupo === 'superior')
    assert.equal(cad.length, 4)
    assert.equal(cad[3].nombre, 'DIVMEC-1')
    const man = valor.unidades.filter((u) => u.grupo === 'maniobra')
    assert.deepEqual(man.slice(0, 3).map((u) => `${u.rol} ${u.nombre} ${u.magnitud}`), ['OC1 FT CÓNDOR II', 'OD FT ÁGUILA II', 'OC2 FT PUMA II'])
    assert.equal(man[1].tarea, 'Ataca con fuego')
    assert.equal(man[1].proposito, 'BLOQUEAR LA PROGRESION DEL ENEMIGO')
    assert.equal(man[0].proposito, 'DETENER EL AVANCE DE ROJO')
    const nombres = valor.unidades.map((u) => u.nombre)
    assert.ok(!nombres.some((n) => /BRAVO/.test(n)), 'el RCB-2 dio todos sus elementos a la FT PUMA')
    for (const n of ['RCB-1 «ALFA» (-)', 'RIM-8 «CHARLIE» (-)', 'RAM-2 «FOXTROT» (-)', 'RAA-6 «GOLF»', 'COMP. ICIA.-I «KILO»', 'Comp. Av. Ejto. «LIMA»', 'BAT. LOG.-I «INDIA»']) assert.ok(nombres.includes(n), `falta ${n}`)
    const rel = (a, b) => valor.relaciones.find((r) => r.desde === a.id && r.hasta === b.id)
    assert.ok(rel(man[1], cad[3]), 'OD → División')
    assert.ok(rel(man[0], man[1]) && rel(man[2], man[1]), 'OC → OD')
  })

  await caso('en «puras» y en «FT» TODAS las unidades tienen relación directa con la División (también en una hoja ya guardada)', () => {
    for (const enfoque of ['puras', 'ft']) {
      const { valor } = m.armarDesdeEjercicio(ejercicioDivmec(), { enfoque })
      const div = valor.unidades.find((u) => u.propia)
      const filas = valor.unidades.filter((u) => u.grupo !== 'superior')
      assert.ok(filas.length > 5)
      for (const u of filas) assert.ok(valor.relaciones.some((r) => r.desde === u.id && r.hasta === div.id && r.tipo === 'directa'), `${enfoque}: ${u.nombre} sin flecha directa a la División`)
      if (enfoque === 'ft') assert.ok(valor.relaciones.some((r) => r.hasta === filas.find((u) => u.rol === 'OD').id), 'las OC siguen con la OD')
    }
    // Hoja guardada sin esas flechas (como la del docente): al leerla ya las tiene.
    const v = m.normalizarConceptos({ enfoque: 'ft', unidades: [{ id: 'd', grupo: 'superior', propia: true, nombre: 'DIV.MEC.-1', magnitud: 'XX' }, { id: 'a', grupo: 'maniobra', nombre: 'FT VARGS', rol: 'OD' }, { id: 'b', grupo: 'maniobra', nombre: 'FT TORREZ', rol: 'OC1' }, { id: 'c', grupo: 'apoyo', nombre: 'RAM-2' }], relaciones: [{ desde: 'b', hasta: 'a' }, { desde: 'a', hasta: 'd', tipo: 'indirecta' }] })
    assert.deepEqual(v.relaciones.filter((r) => r.hasta === 'd').map((r) => `${r.desde}:${r.tipo}`).sort(), ['a:directa', 'b:directa', 'c:directa'])
    assert.ok(v.relaciones.some((r) => r.desde === 'b' && r.hasta === 'a'))
    // Con «adyacentes» no se agregan.
    assert.equal(m.normalizarConceptos({ enfoque: 'adyacentes', unidades: [{ id: 'c', grupo: 'superior', nombre: 'CE' }, { id: 'd', grupo: 'maniobra', propia: true, nombre: 'DIV-1' }] }).relaciones.length, 0)
  })

  await caso('↔️ opción «adyacentes» con el caso del docente: la DIVMEC-1 al lado de la DIVMEC-2, debajo del CE', () => {
    const { valor } = m.armarDesdeEjercicio(ejercicioDivmec(), { enfoque: 'adyacentes' })
    assert.deepEqual(valor.unidades.filter((u) => u.grupo === 'superior').map((u) => u.magnitud), ['XXXXX', 'XXXX', 'XXX'])
    const fila = valor.unidades.filter((u) => u.grupo === 'maniobra')
    assert.deepEqual(fila.map((u) => [u.nombre, u.magnitud, !!u.propia]).sort(), [['DIVMEC-1', 'XX', true], ['DIVMEC-2', 'XX', false]])
    assert.equal(fila.find((u) => !u.propia).tarea, 'Defiende en el sector ESTE')
  })

  await caso('la IA que se equivoca como en el Word del docente: la Mesa pone cada unidad en su escalón', () => {
    const ctx = ejercicioDivmec()
    const resp = JSON.stringify(respuestaIAEquivocada())
    // Sobre la hoja armada
    const armada = m.armarDesdeEjercicio(ctx, { enfoque: 'puras' }).valor
    const r = ia.aplicarRespuestaIA(armada, resp, { modo: 'completar', ctx })
    assert.ok(r.ok, r.error)
    const cad = r.valor.unidades.filter((u) => u.grupo === 'superior')
    assert.deepEqual(cad.map((u) => u.magnitud), ['XXXXX', 'XXXX', 'XXX', 'XX'])
    assert.ok(cad[3].propia && cad[3].nombre === 'DIVMEC-1')
    assert.ok(!r.valor.unidades.some((u) => u.grupo !== 'superior' && /DIV/.test(u.nombre)), 'ninguna división en las filas')
    assert.equal(r.valor.unidades.find((u) => /RCB-1/.test(u.nombre)).rol, 'OD')
    assert.ok(r.corregido.some((c) => /DIVMEC-2.*ADYACENTE/.test(c)))
    // Sobre la hoja vacía: la División sube a la cadena como unidad propia.
    const v = ia.aplicarRespuestaIA({ enfoque: 'puras' }, resp, { modo: 'completar', ctx }).valor
    const c2 = v.unidades.filter((u) => u.grupo === 'superior')
    assert.deepEqual(c2.map((u) => [u.magnitud, u.texto || u.arma]), [['XXXX', 'FF.TT.T.O.'], ['XXX', 'CE'], ['XX', 'mecanizada']])
    assert.ok(c2[2].propia)
    assert.ok(!v.unidades.some((u) => /DIVMEC-2/.test(u.nombre)))
    // Completar y mejorar tampoco saca a la unidad propia de la cadena.
    const mej = ia.aplicarRespuestaIA(armada, resp, { modo: 'completar_mejorar', ctx }).valor
    assert.equal(mej.unidades.find((u) => u.propia).grupo, 'superior')
    // La hoja v2 guardada con la «Unidad sin nombre»: 🧹 acomodar la junta con la DIV.MEC.-1.
    const v2 = { esquema: 'conceptos-v2', enfoque: 'subordinadas', unidades: [
      { id: 's2', grupo: 'superior2', nombre: 'Fuerzas Terrestres del Teatro de Operaciones', magnitud: 'XXX', texto: 'TO' },
      { id: 's1', grupo: 'superior1', nombre: 'Cuerpo de Ejército I', magnitud: 'XX', texto: 'CE' },
      { id: 'p', grupo: 'maniobra', propia: true, nombre: '', magnitud: 'X' },
      { id: 'd', grupo: 'maniobra', nombre: 'DIV.MEC.-1', magnitud: 'XX', arma: 'mecanizada' },
      { id: 'r1', grupo: 'maniobra', nombre: 'RCB-1', magnitud: 'III', rol: 'OD' },
    ], relaciones: [{ desde: 'r1', hasta: 'd', tipo: 'directa' }] }
    const ac = m.acomodarJerarquia(v2, { propia: 'DIVMEC-1' })
    const c3 = ac.valor.unidades.filter((u) => u.grupo === 'superior')
    assert.deepEqual(c3.map((u) => [u.nombre, u.magnitud]), [['Fuerzas Terrestres del Teatro de Operaciones', 'XXXX'], ['Cuerpo de Ejército I', 'XXX'], ['DIV.MEC.-1', 'XX']])
    assert.ok(c3[2].propia)
    assert.equal(ac.valor.unidades.length, 4)
    assert.ok(ac.valor.relaciones.some((x) => x.desde === 'r1' && x.hasta === c3[2].id), 'la relación con la División pasa a la unidad propia')
  })

  await caso('separar tarea y propósito, y oraciones que no se cortan en abreviaturas', () => {
    assert.deepEqual(m.separarTP('Defiende en Co. TUNARI con el propósito de evitar la conquista de VIACHA.'), { tarea: 'Defiende en Co. TUNARI', proposito: 'Evitar la conquista de VIACHA.' })
    assert.deepEqual(m.separarTP('Retarda al enemigo para atraerlo al AE YUNQUE'), { tarea: 'Retarda al enemigo', proposito: 'Atraerlo al AE YUNQUE' })
    assert.deepEqual(m.oraciones('Hacia Co. TUNARI y Coord. 8100-4100 con la 1ra. Brigada. La DIV-2 defiende.'), ['Hacia Co. TUNARI y Coord. 8100-4100 con la 1ra. Brigada.', 'La DIV-2 defiende.'])
  })

  await caso('láminas del ejemplo del PMTD: maniobra y apoyo de combate, como las págs. 21 y 22', () => {
    const svgs = l.laminasConceptos(ejemploPMTD(), { unidad: 'Div-1', clasificacion: 'RESERVADO' })
    assert.equal(svgs.length, 2)
    const [p1, p2] = svgs.map(texto)
    for (const t of ['MANIOBRA', 'XXX', 'CE', 'XX', 'Defiende y derrota al CE. I de ROJO', 'INGAVI', 'LANZA', 'CALAMA', 'TOLEDO', 'OC2', 'OC1', 'OD', 'OC3', 'T F1:', 'T F4:', 'REFERENCIAS', 'RESERVADO', 'Hoja 1 de 2']) assert.ok(p1.includes(t), `lámina 1 sin «${t}»`)
    for (const t of ['APOYO DE COMBATE', 'B. ING.', 'RA-1', 'FASE I', 'PE:', 'PT:', 'TAREA:', 'PROPÓSITO:', 'PAF:', 'EFECTO:', 'Hoja 2 de 2']) assert.ok(p2.includes(t), `lámina 2 sin «${t}»`)
    assert.ok(svgs[0].includes('<polygon'), 'estrella de la OD')
    assert.ok(svgs[0].includes('stroke-dasharray'), 'relación indirecta')
    assert.ok((svgs[0].match(/marker-end/g) || []).length >= 7, 'flechas de la lámina de maniobra')
    assert.ok((svgs[1].match(/marker-end/g) || []).length >= 8, 'flechas de la lámina de apoyo')
    // Todo el texto de las unidades está en las láminas.
    const todo = svgs.map(texto).join(' ')
    for (const u of ejemploPMTD().unidades) for (const f of u.fases || []) for (const k of ['tarea', 'proposito', 'pe', 'pt', 'paf', 'efecto']) for (const w of palabras(f[k] || '')) assert.ok(todo.includes(w), `falta «${w}» de ${u.nombre}`)
  })

  await caso('lámina de maniobra del caso del docente: la cadena de arriba hacia abajo y la fila DEBAJO de la División', () => {
    const svgs = l.laminasConceptos(m.armarDesdeEjercicio(ejercicioDivmec(), { enfoque: 'puras' }).valor, { unidad: 'DIVMEC-1', clasificacion: 'RESERVADO' })
    const s = svgs[0]
    // y de cada rótulo de magnitud (texto en negrita suelto o en el cuadrito de la fila)
    const ys = (t) => [...s.matchAll(new RegExp(`<text x="[\\d.]+" y="([\\d.]+)"[^>]*>${t}</text>`, 'g'))].map((x) => Number(x[1]))
    const [y5] = ys('XXXXX')
    const [y4] = ys('XXXX')
    const [y3] = ys('XXX')
    const [y2] = ys('XX')
    const fila = ys('III')
    assert.ok(y5 < y4 && y4 < y3 && y3 < y2, `cadena de arriba hacia abajo: ${[y5, y4, y3, y2]}`)
    assert.equal(ys('XX').length, 1, 'la División va una sola vez (no en la fila)')
    assert.ok(fila.length >= 5 && fila.every((y) => y > y2 + 40), 'los regimientos van debajo de la División')
    const t = texto(s)
    for (const x of ['CTO', 'FF.TT.T.O.', 'CE', 'DIVMEC-1', '(UNIDAD PROPIA)', 'RCB-1 «ALFA»', 'RIAT-30 «ECO»']) assert.ok(t.includes(x), `falta «${x}»`)
    const todo = svgs.map(texto).join(' ')
    for (const x of ['RAM-2 «FOXTROT»', 'COMP. ICIA.-I «KILO»', '(bajo control)', 'BAT. LOG.-I «INDIA»']) assert.ok(todo.includes(x), `falta «${x}»`)
  })

  await caso('hoja vacía: el formato en blanco de la pág. 20', () => {
    const svgs = l.laminasConceptos({})
    assert.equal(svgs.length, 1)
    assert.ok(texto(svgs[0]).includes('HOJA DE TRABAJO PARA LOS «CONCEPTOS ENTRELAZADOS»'))
    assert.ok(texto(svgs[0]).includes('6.- Finalice con las UU. SPAC.'))
  })

  await caso('mucho texto y muchas unidades: continuaciones, nada se pierde ni se escapa mal', () => {
    const largo = 'Defiende y bloquea al primer escalón entre el Co. MOCUNA y el Co. KELLA KELLA <A> & «B», canalizando su masa acorazada hacia el AE VULCAN. '.repeat(4)
    const U = (i, g, arma) => ({ id: `u${i}`, grupo: g, nombre: `UNIDAD ${i} «PRUEBA» (FICT.)`, magnitud: 'III', arma, rol: g === 'maniobra' ? (i === 3 ? 'OD' : `OC${i}`) : '', fases: [1, 2, 3, 4].map((f) => ({ fase: `F${f}`, tarea: `${largo} FIN-${i}-${f}`, proposito: 'Evitar que el enemigo alcance el nudo vial.', esfuerzo: f === 1 && i === 1, paf: g === 'apoyo' ? 'OD' : '' })) })
    const v = { fases: [1, 2, 3, 4].map((i) => ({ id: `F${i}`, nombre: `F ${i}` })), unidades: [{ id: 's2', grupo: 'superior2', nombre: 'CE', tarea: largo, proposito: 'P' }, ...[1, 2, 3, 4, 5, 6].map((i) => U(i, 'maniobra', 'infanteria')), ...[7, 8, 9, 10, 11].map((i) => U(i, 'apoyo', 'artilleria')), U(12, 'spac', 'logistica')], relaciones: [{ desde: 'u1', hasta: 'u9', tipo: 'directa' }] }
    const svgs = l.laminasConceptos(v)
    assert.ok(svgs.length >= 5)
    const todo = svgs.map(texto).join(' ')
    for (let i = 1; i <= 12; i++) for (let f = 1; f <= 4; f++) assert.ok(todo.includes(`FIN-${i}-${f}`), `falta el final del texto de la unidad ${i}, fase ${f}`)
    assert.ok(svgs.every((s) => !/<A>|& «/.test(s)), 'texto sin escapar')
    assert.ok(todo.includes('Relaciones entre unidades que están en hojas distintas') || todo.includes('UNIDAD 1'), 'relación entre hojas')
  })

  await caso('texto para el expediente', () => {
    const t = m.textoConceptos(ejemploPMTD())
    assert.ok(t.includes('[Cadena de mando (hasta tu unidad)] CE'))
    assert.ok(t.includes('Cadena de mando: CE (XXX) → Div-1 (XX)'))
    assert.ok(t.includes('OD CALAMA'))
    assert.ok(t.includes('[ESFUERZO PRINCIPAL]'))
    assert.ok(t.includes('Relaciones:'))
  })

  await caso('pedido a la IA: expediente, doctrina, nivel, orientaciones, adjuntos; la idea va al final', () => {
    const v = { ...m.armarDesdeEjercicio(ejercicioConceptos(), { enfoque: 'ft' }).valor, orientaciones: { idea: 'MI IDEA', info: 'MI INFO', adjuntos: [{ nombre: 'orden.docx', texto: 'TEXTO DEL ADJUNTO' }] } }
    const r = ia.pedidoIA(v, { expediente: '# EXPEDIENTE DEL EJERCICIO\nXYZ', ctx: ejercicioConceptos(), modo: 'completar', encabezado: 'ENCABEZADO DE LA MESA' })
    assert.ok(r.ok)
    for (const t of ['ENCABEZADO DE LA MESA', 'EXPEDIENTE DEL EJERCICIO', 'XYZ', 'PMTD 2017', 'págs. 21-22', 'FT / agrupaciones tácticas', 'DIV.MEC.-1 (FICT.)', 'MI INFO', 'TEXTO DEL ADJUNTO', 'TAREA — COMPLETAR LA HOJA', '"relaciones"', 'LA JERARQUÍA', 'XXXXX', 'FF.TT.T.O.', 'NO son el TO', 'ADYACENTES', 'RELACIONES DIRECTAS E INDIRECTAS', 'LO QUE YA IDENTIFICÓ LA MESA', 'FT «GOLF» — III, OD', 'ANTES DE CONTESTAR, VERIFICÁ']) assert.ok(r.prompt.includes(t), `falta «${t}»`)
    // Con el caso del docente y la opción «puras»: las 12 unidades de la organización y la adyacente.
    const pd = ia.pedidoIA({ enfoque: 'puras' }, { ctx: ejercicioDivmec() }).prompt
    for (const t of ['Unidad propia: DIVMEC-1 (XX, División)', 'RCB-1 «ALFA» (III, maniobra)', 'Comp. Av. Ejto. «LIMA» (I, apoyo, BAJO CONTROL)', 'ADYACENTES, NO van en esta hoja): DIVMEC-2', 'CADA COLUMNA']) assert.ok(pd.includes(t), `falta «${t}»`)
    const final = ia.conIndicacion(r.prompt, v.orientaciones.idea)
    assert.ok(final.trimEnd().endsWith('MI IDEA'))
    assert.ok(ia.pedidoIA({}, {}).prompt.includes('ARMAR LA HOJA COMPLETA'))
    assert.ok(ia.pedidoIA(v, { modo: 'completar_mejorar' }).prompt.includes('COMPLETAR **Y** MEJORAR'))
  })

  await caso('respuesta de la IA: completar sin pisar, mejorar, relaciones por nombre, una sola OD', () => {
    const armada = m.armarDesdeEjercicio(ejercicioConceptos(), { enfoque: 'ft' }).valor
    const od = armada.unidades.find((u) => u.rol === 'OD')
    const escrita = { ...armada, unidades: armada.unidades.map((u) => (u.id === od.id ? { ...u, proposito: 'LO ESCRIBIÓ EL OFICIAL' } : u)) }
    const resp = respuestaIA()
    resp.unidades.push({ grupo: 'maniobra', nombre: 'RIM-1 «ALFA» (FICT.)', rol: 'OD' })
    const r = ia.aplicarRespuestaIA(escrita, 'Te paso la hoja:\n```json\n' + JSON.stringify(resp) + '\n```\nReparo: ninguno.', { modo: 'completar', corregir: (x) => x })
    assert.ok(r.ok, r.error)
    const v = r.valor
    assert.equal(v.unidades.find((u) => u.id === od.id).proposito, 'LO ESCRIBIÓ EL OFICIAL')
    assert.ok(v.unidades.find((u) => u.id === od.id).fases.some((f) => f.fase === 'F3' && f.esfuerzo))
    assert.equal(v.unidades.filter((u) => u.rol === 'OD').length, 1)
    const com = v.unidades.find((u) => u.nombre === 'CIA. COM.-1 (FICT.)')
    assert.equal(com.grupo, 'apoyo')
    assert.ok(v.relaciones.some((x) => x.desde === com.id && x.hasta === od.id), 'relación por nombre')
    assert.equal(v.unidades.filter((u) => u.propia).length, 1)
    assert.deepEqual(v.unidades.filter((u) => u.grupo === 'superior').map((u) => u.magnitud), ['XXXXX', 'XXXX', 'XXX', 'XX'], 'una caja por escalón')
    assert.equal(v.unidades.find((u) => /FOX/.test(u.nombre)).tarea, 'Abastece y evacúa.')
    const mej = ia.aplicarRespuestaIA(escrita, JSON.stringify(respuestaIA()), { modo: 'completar_mejorar' })
    assert.ok(mej.ok)
    assert.equal(mej.valor.unidades.find((u) => u.magnitud === 'XXX').tarea, 'Defiende en el sector norte (FICT.).')
    assert.equal(ia.aplicarRespuestaIA(escrita, 'sin json', {}).ok, false)
    assert.equal(ia.aplicarRespuestaIA(r.valor, JSON.stringify(respuestaIA()), { modo: 'completar' }).ok, false, 'nada nuevo que completar')
  })

  console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(fallas ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
