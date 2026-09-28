// Hoja F2·P1 «Conceptos entrelazados» (calcos/conceptos/v2/), sin navegador:
//   · la integración anterior (integrar-conceptos.cjs) sigue siendo reversible;
//   · se leen igual la hoja de antes (conceptos-v1) y el formato narrativo;
//   · 🌱 el armado automático saca las unidades, la OD / OC, la tarea y el propósito
//     de la orden superior, la organización de la tarea, las fichas y las fases;
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
  const url = (f) => pathToFileURL(path.join(raiz, 'conceptos', 'v2', f)).href
  const m = await import(url('modelo.js'))
  const l = await import(url('laminas.js'))
  const ia = await import(url('ia.js'))
  console.log('\nConceptos entrelazados (calcos/conceptos/v2)\n')

  await caso('la integración anterior sigue siendo reversible (index-conceptos-20260928.js → index-zhbwncsH.js)', () => {
    const original = fs.readFileSync(path.join(raiz, 'assets/index-zhbwncsH.js'), 'utf8')
    const nuevo = fs.readFileSync(path.join(raiz, 'assets/index-conceptos-20260928.js'), 'utf8')
    assert.equal(aplicar(nuevo, [...cambios].reverse().map(([a, b]) => [b, a])), original)
  })

  await caso('el texto narrativo de antes se conserva (y va a la IA)', () => {
    const antiguo = { 'INTENCIÓN DEL COMANDANTE SUPERIOR (dos niveles arriba)': 'ANTECEDENTE SIN ALTERAR' }
    const v = m.normalizarConceptos(antiguo)
    assert.equal(v.esquema, 'conceptos-v2')
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

  await caso('🌱 armado automático con un ejercicio de División (ficticio)', () => {
    const ej = ejercicioConceptos()
    const { valor, resumen } = m.armarDesdeEjercicio(ej, {})
    const g = (x) => valor.unidades.filter((u) => u.grupo === x)
    assert.equal(g('superior2')[0].nombre, 'I CUERPO DE EJÉRCITO (FICT.)')
    assert.equal(g('superior2')[0].magnitud, 'XXX')
    assert.equal(g('superior2')[0].texto, 'CE')
    assert.equal(g('superior2')[0].tarea, 'Defiende en el sector norte')
    assert.equal(g('superior2')[0].proposito, 'Proteger la capital (FICT.)')
    const propia = g('superior1')[0]
    assert.ok(propia.propia)
    assert.equal(propia.magnitud, 'XX')
    assert.equal(propia.arma, 'mecanizada')
    assert.equal(propia.numero, '1')
    assert.match(propia.tarea, /^Defiende el sector asignado/)
    assert.match(propia.proposito, /^Destruir a la brigada blindada/)
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
    assert.ok(rel(propia, g('superior2')[0]))
    assert.ok(rel(od, propia))
    assert.ok(resumen.fuentes.some((f) => /Organización de la tarea/.test(f)))
    // Traer lo que falte no pisa nada: se vuelve a armar sobre lo escrito.
    const escrita = { ...valor, unidades: valor.unidades.map((u) => (u.id === od.id ? { ...u, tarea: 'ESCRITO POR EL OFICIAL' } : u)) }
    const otra = m.armarDesdeEjercicio(ej, { previo: escrita })
    assert.equal(otra.resumen.agregadas, 0)
    assert.equal(otra.valor.unidades.find((u) => u.id === od.id).tarea, 'ESCRITO POR EL OFICIAL')
    assert.equal(otra.valor.unidades.length, valor.unidades.length)
    // Nivel «adyacentes»: la unidad propia va en la fila de maniobra.
    const ady = m.armarDesdeEjercicio(ej, { enfoque: 'adyacentes' }).valor
    assert.equal(ady.unidades.find((u) => u.grupo === 'superior1').nombre, 'I CUERPO DE EJÉRCITO (FICT.)')
    assert.equal(ady.unidades.find((u) => u.grupo === 'superior2').magnitud, 'XXXX')
    assert.ok(ady.unidades.find((u) => u.grupo === 'maniobra').propia)
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
    assert.ok(t.includes('[Comando superior] CE'))
    assert.ok(t.includes('OD CALAMA'))
    assert.ok(t.includes('[ESFUERZO PRINCIPAL]'))
    assert.ok(t.includes('Relaciones:'))
  })

  await caso('pedido a la IA: expediente, doctrina, nivel, orientaciones, adjuntos; la idea va al final', () => {
    const v = { ...m.armarDesdeEjercicio(ejercicioConceptos(), {}).valor, orientaciones: { idea: 'MI IDEA', info: 'MI INFO', adjuntos: [{ nombre: 'orden.docx', texto: 'TEXTO DEL ADJUNTO' }] } }
    const r = ia.pedidoIA(v, { expediente: '# EXPEDIENTE DEL EJERCICIO\nXYZ', ctx: ejercicioConceptos(), modo: 'completar', encabezado: 'ENCABEZADO DE LA MESA' })
    assert.ok(r.ok)
    for (const t of ['ENCABEZADO DE LA MESA', 'EXPEDIENTE DEL EJERCICIO', 'XYZ', 'PMTD 2017', 'págs. 21-22', 'Mi unidad y mis unidades subordinadas', 'DIV.MEC.-1 (FICT.)', 'MI INFO', 'TEXTO DEL ADJUNTO', 'TAREA — COMPLETAR LA HOJA', '"relaciones"']) assert.ok(r.prompt.includes(t), `falta «${t}»`)
    const final = ia.conIndicacion(r.prompt, v.orientaciones.idea)
    assert.ok(final.trimEnd().endsWith('MI IDEA'))
    assert.ok(ia.pedidoIA({}, {}).prompt.includes('ARMAR LA HOJA COMPLETA'))
    assert.ok(ia.pedidoIA(v, { modo: 'completar_mejorar' }).prompt.includes('COMPLETAR **Y** MEJORAR'))
  })

  await caso('respuesta de la IA: completar sin pisar, mejorar, relaciones por nombre, una sola OD', () => {
    const armada = m.armarDesdeEjercicio(ejercicioConceptos(), {}).valor
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
    assert.equal(v.unidades.filter((u) => u.grupo === 'superior1').length, 1)
    assert.equal(v.unidades.find((u) => /FOX/.test(u.nombre)).tarea, 'Abastece y evacúa.')
    const mej = ia.aplicarRespuestaIA(escrita, JSON.stringify(respuestaIA()), { modo: 'completar_mejorar' })
    assert.ok(mej.ok)
    assert.equal(mej.valor.unidades.find((u) => u.grupo === 'superior2').tarea, 'Defiende en el sector norte (FICT.).')
    assert.equal(ia.aplicarRespuestaIA(escrita, 'sin json', {}).ok, false)
    assert.equal(ia.aplicarRespuestaIA(r.valor, JSON.stringify(respuestaIA()), { modo: 'completar' }).ok, false, 'nada nuevo que completar')
  })

  console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(fallas ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
