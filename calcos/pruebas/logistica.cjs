// El módulo de logística del G-4 (calcos/logistica/v1) en Node, sin navegador:
//   · los datos de la Escuela (tamaños, distancias de seguridad, tonelajes, DMA);
//   · la geometría (km², distancias a la LPR, polígonos);
//   · el análisis del calco del ejercicio ficticio (tamaño, seguridad, DMA, EPA) y las
//     sugerencias por aspecto (impositivo, norma, comparación);
//   · la evaluación (lo del oficial manda, la conclusión con la forma de la Escuela);
//   · la apreciación y la matriz armadas sin pisar lo escrito;
//   · los pedidos a la IA y la aplicación de sus respuestas (sin pisar lo del oficial ni
//     lo impositivo medido);
//   · los Word apaisados (XML válido, casillas pintadas, SECRETO) y la especificación de
//     la apreciación para el formato militar;
//   · los reemplazos del compilado (cada uno una vez y reversibles).
//
//   node logistica.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { ejercicioLogistica, respuestaEval, respuestaASL, respuestaMatriz } = require('./logistica-ejemplo.js')

const V1 = path.join(__dirname, '..', 'logistica', 'v1')
const casos = []
const caso = (nom, f) => casos.push({ nom, f })

;(async () => {
  const D = await import(path.join(V1, 'doctrina.js'))
  const G = await import(path.join(V1, 'geo.js'))
  const A = await import(path.join(V1, 'analisis.js'))
  const M = await import(path.join(V1, 'modelo.js'))
  const I = await import(path.join(V1, 'ia.js'))
  const W = await import(path.join(V1, 'documento.js'))
  const ex = ejercicioLogistica({ conPropuestas: true })
  const calco = { ops: ex.ops, unidades: ex.unidades, fasesCOA: ex.fasesCOA, conceptoApoyo: ex.conceptoApoyo, misionLog: ex.misionLog }
  const an = A.analizarCalco(calco)
  const ctx = { ordenSup: ex.ordenSup, unidad: ex.ordenSup.unidad, calco, analisis: an, hojasG4: ex.hojasG.g4 }

  caso('Datos generales de la Escuela (lámina) y DMA del ejemplo', () => {
    assert.deepEqual(D.TAMANO.map((x) => [x.min, x.max]), [[1, 2], [6, 9], [9, 12]])
    assert.deepEqual(D.SEGURIDAD.map((x) => x.min), [5, 12, 25])
    assert.deepEqual(D.TONELAJE_BATALLON.map((x) => x.t), [25, 30, 40, 40, 25])
    assert.deepEqual(D.TONELAJE_DIVISION.map((x) => x.t), [160, 230, 270])
    assert.equal(D.calcularDMA({ td: 10, tc: 2, v: 20 }).km, 80)
    assert.equal(D.calcularDMA({ td: 2, tc: 2, v: 20 }).ok, false)
    assert.equal(D.ASPECTOS.length, 25, 'los 25 aspectos de la lámina')
    assert.deepEqual(D.ASPECTOS.filter((a) => a.impositivo).map((a) => a.id), ['m_dma', 's_distSeg'])
    assert.equal(D.FILAS_MATRIZ.length, 11)
    assert.ok(D.ENTENDER.some((t) => /ASDI/.test(t.titulo)) && D.ENTENDER.some((t) => /ARCE/.test(t.titulo)))
  })

  caso('Geometría: km², distancias a una línea y entre polígonos', () => {
    const c = (lng, lat, km) => {
      const dl = km / (111.32 * Math.cos((lat * Math.PI) / 180))
      const dt = km / 110.574
      return [[lng, lat], [lng + dl, lat], [lng + dl, lat - dt], [lng, lat - dt]]
    }
    assert.ok(Math.abs(G.areaKm2(c(-68, -17, 3)) - 9) < 0.01)
    assert.ok(Math.abs(G.distPoligonos(c(0, 0, 1), c(0.02, 0, 1)) - 1.226) < 0.01)
    assert.equal(G.distPoligonoLinea(c(-68, -17, 3), [[-68.01, -17.01], [-67.9, -17.01]]), 0, 'la línea cruza el área')
    assert.ok(G.puntoEnPoligono(G.centroide(c(-68, -17, 3)), c(-68, -17, 3)))
    const par = G.paralela([[-68.6, -16.8], [-68, -16.8]], 12, [-68.3, -17.1])
    assert.ok(Math.abs(G.distPuntoLinea(par[0], [[-68.6, -16.8], [-68, -16.8]]) - 12) < 0.05, 'la línea de seguridad a 12 km')
    assert.ok(par[0][1] < -16.8, 'hacia nuestro lado')
  })

  caso('Análisis del calco: tamaño, distancia de seguridad desde la LPR, DMA y EPA', () => {
    assert.deepEqual(an.areas.map((a) => a.nombre), ['Área A', 'Área B'], 'se analizan las propuestas')
    const [a, b] = an.areas
    assert.ok(a.tamano.ok && b.tamano.ok)
    assert.ok(a.seguridad.km > 15 && a.seguridad.km < 18 && a.seguridad.ok)
    assert.equal(a.seguridad.ref, 'LPR')
    assert.ok(b.seguridad.km > a.seguridad.km)
    assert.equal(a.dma.ok, true)
    assert.equal(a.epa.toca, true)
    assert.equal(b.epa.toca, false)
    assert.ok(/ARCE/.test(a.superior.nombre))
    assert.match(A.textoAnalisis(an), /CUMPLE el mínimo de 12 km/)
  })

  caso('Sin AO: la seguridad se mide a la ficha enemiga; sin nada, no se inventa', () => {
    const sinAO = A.analizarCalco({ ...calco, ops: { ...calco.ops, areaOps: null } })
    assert.match(sinAO.frente.fuente, /fichas enemigas/)
    const nada = A.analizarCalco({ ops: { ...calco.ops, areaOps: null }, unidades: [] })
    assert.equal(nada.frente, null)
    assert.equal(nada.areas[0].seguridad.ok, null)
  })

  caso('Sugerencias: impositivo, norma y comparación entre propuestas', () => {
    const S = an.sugerencias
    assert.equal(S.s_distSeg.a ? 1 : 0, 0)
    assert.equal(S.s_distSeg['asdi-a'].estado, 'si')
    assert.equal(S.s_distSeg['asdi-a'].regla, 'impositivo')
    assert.equal(S.m_cerrado['asdi-a'].estado, 'si')
    assert.equal(S.m_cerrado['asdi-b'].estado, 'no')
    assert.equal(S.l_epa['asdi-b'].estado, 'no')
    // un área a 8 km del frente NO cumple
    const cerca = { zona: 'asdi', propuesta: 'C', clave: 'c', coords: [[-68.4, -16.87], [-68.37, -16.87], [-68.37, -16.9], [-68.4, -16.9]] }
    const an2 = A.analizarCalco({ ...calco, ops: { ...calco.ops, zonasLog: [...calco.ops.zonasLog, cerca] } })
    assert.equal(an2.sugerencias.s_distSeg.c.estado, 'no')
  })

  caso('Tonelaje para el EPA con los regimientos del calco', () => {
    const t = A.tonelaje(A.batallonesDelCalco(ex.unidades))
    assert.equal(t.total, 25 + 40 + 30 + 25)
  })

  let ev = M.normalizarEval({})
  caso('Evaluación: el oficial manda, ciclo de la casilla, descarte por impositivo y conclusión', () => {
    ev = M.fijarCelda(ev, 't_red', 'asdi-a', 'si')
    ev = M.fijarCelda(ev, 't_red', 'asdi-b', 'no')
    assert.equal(M.celdaEval(ev, an.sugerencias, 't_red', 'asdi-a').fuente, 'oficial')
    let c = M.ciclarCelda(ev, an.sugerencias, 'm_cerrado', 'asdi-b')
    assert.equal(M.celdaEval(c, an.sugerencias, 'm_cerrado', 'asdi-b').estado, 'si')
    c = M.ciclarCelda(M.ciclarCelda(c, an.sugerencias, 'm_cerrado', 'asdi-b'), an.sugerencias, 'm_cerrado', 'asdi-b')
    assert.equal(M.celdaEval(c, an.sugerencias, 'm_cerrado', 'asdi-b').fuente, 'calco', 'tercer toque: vuelve a lo medido')
    const concl = M.conclusionAuto(ev, an.areas, an.sugerencias, ctx)
    assert.match(concl, /^LAS ÁREAS A Y B TIENEN CONDICIONES DE REALIZAR EL APOYO LOGÍSTICO A LA MANIOBRA DE LA DIV\.MEC\.-1 \(FICT\.\), MIENTRAS QUE EL ÁREA A TIENE LA VENTAJA EN RELACIÓN AL ÁREA B, CONSIDERANDO LOS ASPECTOS /)
    assert.match(concl, /RED VIARIA COMPATIBLE/)
    const desc = M.fijarCelda(ev, 'm_dma', 'asdi-b', 'no')
    assert.match(M.conclusionAuto(desc, an.areas, an.sugerencias, ctx), /EL ÁREA B NO TIENE CONDICIONES: NO CUMPLE DISTANCIA MÁXIMA DE APOYO/)
    assert.equal(M.mejorArea(ev, an.areas, an.sugerencias).clave, 'asdi-a')
  })

  caso('IA de la evaluación: pedido completo; respuesta sin pisar al oficial ni lo impositivo', () => {
    const p = I.pedidoEval({ ...ev, ideas: 'Prefiero la A.' }, { analisis: an, expediente: 'EXP', ctx, encabezado: 'Sos OFICIAL' })
    for (const t of ['Sos OFICIAL', 'EXP', 'LO QUE LA MESA MIDIÓ EN EL CALCO', 'DECIDIDO POR EL OFICIAL', 'MEDIDO EN EL CALCO — impositivo', 'Prefiero la A.', '"evaluacion"', 'VERIFICACIÓN FINAL']) assert.ok(p.prompt.includes(t), t)
    const r = I.aplicarRespuestaEval(JSON.stringify({ ...respuestaEval(), evaluacion: { ...respuestaEval().evaluacion, t_red: { B: 'si' } } }), ev, { analisis: an })
    assert.ok(r.ok)
    assert.equal(r.valor.notas.t_cubiertas['asdi-a'].por, 'ia')
    assert.equal(r.valor.notas.t_red['asdi-b'].estado, 'no', 'lo del oficial no se toca')
    assert.equal(r.valor.notas.s_distSeg, undefined, 'lo impositivo medido no se toca')
    assert.equal(r.sugerida, 'Área A')
    assert.equal(I.aplicarRespuestaEval('sin json', ev, { analisis: an }).ok, false)
  })

  let asl
  caso('Apreciación: 🌱 con el calco, la evaluación y las hojas del G-4, sin pisar', () => {
    const r = M.armarASL({}, { ...ctx, evaluacion: { ...ev, elegida: 'asdi-a' } })
    asl = r.valor
    assert.match(asl.campos.tareasEsp, /Apoyar logísticamente la defensa/)
    assert.match(asl.campos.hipotesis, /El CE mantiene el ARCE/)
    assert.match(asl.campos.eleccionArea, /Se elige el Área A/)
    assert.match(asl.campos.areasEjes, /EPA: 60 km, desde /)
    assert.equal(asl.caps[0].nombre, 'CAP N° 1 — defensa en posición (FICT.)')
    assert.match(asl.caps[0].analisis.conclusiones, /Abastecimiento Clase IV, Abastecimiento Clase V/)
    assert.match(asl.campos.factibilidad, /Sí, con el ASDI adelante/)
    const otra = M.armarASL({ ...asl, campos: { ...asl.campos, mision: 'LA MÍA' } }, ctx)
    assert.equal(otra.valor.campos.mision, 'LA MÍA')
    assert.ok(M.tieneASL(asl) && !M.tieneASL({}))
    assert.equal(M.esHojaLog({ tipo: 'aprecLog' }), true)
    assert.equal(M.tieneHojaLog({ tipo: 'aprecLog' }, M.normalizarASL({})), false, 'vacía no cuenta aunque tenga esquema')
  })

  caso('IA de la apreciación: pedido y respuesta (sólo completar no pisa; CAP por nombre)', () => {
    const p = I.pedidoASL({ ...asl, ideas: 'El problema es la Clase III.' }, { analisis: an, evaluacion: ev, expediente: 'EXP', ctx, hoja: { num: 'F1·P3' } })
    for (const t of ['APRECIACIÓN DE SITUACIÓN DE LOGÍSTICA', 'LA EVALUACIÓN DE LAS ÁREAS QUE YA HIZO EL G-4', 'El problema es la Clase III.', '"eleccionArea"', 'VERIFICACIÓN FINAL']) assert.ok(p.prompt.includes(t), t)
    const r = I.aplicarRespuestaASL(JSON.stringify(respuestaASL()), asl, {})
    assert.ok(r.ok)
    assert.match(r.valor.campos.mejorCap, /mejor apoyado/)
    assert.doesNotMatch(r.valor.campos.mision, /NO debe pisar/)
    assert.doesNotMatch(r.valor.objeto, /NO debe pisar/)
    assert.match(r.valor.caps[0].analisis.transportes, /40 camiones/)
    assert.ok(r.valor.iaCampos.includes('campo:mejorCap'))
    asl = r.valor
    const f2 = M.partirDe({}, asl)
    assert.equal(f2.campos.mejorCap, asl.campos.mejorCap)
  })

  let mz
  caso('Matriz: fases del COA, concepto por fase y calco; IA sin pisar', () => {
    const calcoElegida = { ...calco, ops: { ...calco.ops, zonasLog: calco.ops.zonasLog.map((z) => (z.propuesta === 'A' ? { ...z, elegida: true } : z)) } }
    const r = M.armarMatriz({}, { ...ctx, calco: calcoElegida })
    mz = r.valor
    assert.deepEqual(mz.fases.map((f) => f.nombre), ['FASE I — OCUPACIÓN (FICT.)', 'FASE II — DEFENSA (FICT.)', 'FASE III — CONTRAATAQUE (FICT.)'])
    assert.equal(mz.celdas.enfoque.f2, 'Abastecimiento Clase V, Evacuación y hospitalización')
    assert.match(mz.celdas.abast_centros.f1, /ASDI 1 \(Área A, elegida\)/)
    assert.match(mz.celdas.secciones.f1, /ARCE 1/)
    assert.equal(mz.celdas.abast_ejes.f2, '', 'lo del calco va en la primera fase')
    const p = I.pedidoMatriz(mz, { analisis: an, otras: I.otrasHojasG4({ evaluacion: ev, analisis: an, asl, ctx }), expediente: 'EXP', ctx })
    for (const t of ['MATRIZ DE SINCRONIZACIÓN LOGÍSTICA', 'LO QUE YA RESOLVIÓ EL G-4 EN SUS OTRAS HOJAS', '"celdas"']) assert.ok(p.prompt.includes(t), t)
    const a = I.aplicarRespuestaMatriz(JSON.stringify(respuestaMatriz()), mz, {})
    assert.ok(a.ok)
    assert.equal(a.valor.fases[0].desde, 'D-5 (0600)')
    assert.doesNotMatch(a.valor.celdas.enfoque.f1, /NO debe pisar/)
    assert.match(a.valor.celdas.amenaza.f2, /Nivel II/)
    mz = a.valor
    assert.equal(M.copiarFaseAnterior(mz, 'f2').celdas.abast_ejes.f2, mz.celdas.abast_ejes.f1)
  })

  caso('Word: evaluación y matriz apaisadas (XML válido, casillas pintadas, SECRETO)', async () => {
    const JSZip = require('../../jszip.min.js')
    for (const [datos, textos] of [
      [W.crearWordEvaluacion(ev, an, { ctx }), ['EVALUACIÓN DE LAS ÁREAS PROPUESTAS', 'w:fill="FF0000"', 'Seguridad del flujo', 'ÁREA A', 'VERIFICACIÓN DE LOS DATOS GENERALES']],
      [W.crearWordMatriz(mz, { ctx }), ['MATRIZ DE SINCRONIZACIÓN LOGÍSTICA', 'FASE I — OCUPACIÓN (FICT.)', 'w:vMerge w:val="restart"', 'Eje Principal de Abastecimiento']],
    ]) {
      const z = await JSZip.loadAsync(datos)
      const doc = await z.file('word/document.xml').async('string')
      const enc = await z.file('word/header1.xml').async('string')
      for (const t of textos) assert.ok(doc.includes(t), t)
      assert.ok(doc.includes('w:orient="landscape"'))
      assert.ok(enc.includes('SECRETO'))
      assert.ok(doc.includes('EL G-4 DE LA DIV.MEC.-1 (FICT.)'))
      assert.ok(!/🤖|\[IA/.test(doc))
    }
  })

  caso('Apreciación para el formato militar: estructura propia, CAP, firma del G-4', () => {
    const s = W.especificacionASL(asl, { ctx })
    assert.equal(s.estructuraPropia, true)
    assert.deepEqual(s.secciones.map((x) => x.titulo), ['MISIÓN.', 'SITUACIÓN Y CONSIDERACIONES LOGÍSTICAS.', 'ANÁLISIS.', 'COMPARACIÓN.', 'CONCLUSIONES Y RECOMENDACIONES.'])
    assert.equal(s.secciones[2].hijos[0].titulo, 'Elección del área de apoyo logístico.')
    assert.equal(s.secciones[2].hijos[1].titulo, 'CAP N° 1 — defensa en posición (FICT.)')
    assert.equal(s.firma, 'EL G-4 DE LA DIV.MEC.-1 (FICT.)')
    assert.ok(s.secciones[0].hijos[0].hijos[0].vinetas.length, 'las listas «- » van como guiones')
    assert.ok(!JSON.stringify(s).includes('🤖'))
  })

  caso('Reemplazos del compilado: cada uno una vez y reversibles; el compilado vigente los tiene', () => {
    const lista = require('./reemplazos-2026-10-02-logistica.js')
    const base = fs.readFileSync(path.join(__dirname, '..', 'assets', 'index-reconocimiento-20261001.js'), 'utf8')
    const vig = fs.readFileSync(path.join(__dirname, '..', 'assets', 'index-logistica-20261002.js'), 'utf8')
    for (const r of lista) {
      assert.equal(base.split(r.viejo).length - 1, r.veces, r.nombre)
      assert.ok(vig.includes(r.nuevo), r.nombre)
    }
    assert.match(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'), /index-logistica-20261002\.js/)
  })

  let fallos = 0
  for (const c of casos) {
    try {
      await c.f()
      console.log(`  ✔ ${c.nom}`)
    } catch (e) {
      fallos++
      console.log(`  ✘ ${c.nom}\n      ${e.message}`)
    }
  }
  console.log(fallos ? `\n${fallos} caso(s) fallan.` : `\n${casos.length} casos de logística pasan.`)
  process.exitCode = fallos ? 1 : 0
})()
