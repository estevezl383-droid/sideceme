// Matriz de administración del riesgo (calcos/riesgo/v1/), sin navegador:
//   · la Figura 6 del RO-06-01-04 (probabilidad × severidad → nivel), las 20 casillas;
//   · la hoja de ANTES (renglones) se lee como matriz, sin perder nada;
//   · el texto se guarda tal cual se escribe y se limpia al imprimir;
//   · el membrete táctico sale de la Orden del escalón superior, con SECRETO;
//   · 🌱 el armado con lo del ejercicio (Línea de Tiempo real de la Mesa) no pisa nada;
//   · K = el MAYOR riesgo residual; la revisión doctrinaria;
//   · el pedido a la IA y la aplicación de su respuesta (con el corrector de la Mesa);
//   · lo que otros pedidos a la IA traen para la hoja se AGREGA (función sP real);
//   · el Word: carta apaisada, membrete Arial 10 negrilla, SECRETO arriba y abajo,
//     numeración, la matriz con sus rótulos y el nivel general encerrado en un círculo.
//
//   node riesgo.cjs
const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')
const assert = require('node:assert/strict')
const { pathToFileURL } = require('node:url')
const { vigente } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')
const { ejercicioRiesgo, respuestaIA } = require('./riesgo-ejercicio.js')
const raiz = path.resolve(__dirname, '..')
// La orden de reconocimiento (F2·P9) también se junta en la misma función sP de la Mesa.
const reconocimiento = async () => {
  const r = await import(pathToFileURL(path.join(raiz, 'reconocimiento/v1/ia.js')).href)
  return { SIDRecoFusionable: r.fusionable, SIDRecoFusionar: r.fusionarOrden }
}
const out = path.join(__dirname, 'salidas-riesgo')
fs.mkdirSync(out, { recursive: true })

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
// Lee un .docx (ZIP, con o sin compresión) → { nombre: texto }.
function leerZip(buf) {
  const b = Buffer.from(buf)
  let fin = b.length - 22
  while (fin >= 0 && b.readUInt32LE(fin) !== 0x06054b50) fin--
  const n = b.readUInt16LE(fin + 10)
  let p = b.readUInt32LE(fin + 16)
  const outZ = {}
  for (let i = 0; i < n; i++) {
    assert.equal(b.readUInt32LE(p), 0x02014b50)
    const metodo = b.readUInt16LE(p + 10)
    const crc = b.readUInt32LE(p + 16)
    const tam = b.readUInt32LE(p + 20)
    const lenN = b.readUInt16LE(p + 28)
    const lenE = b.readUInt16LE(p + 30)
    const lenC = b.readUInt16LE(p + 32)
    const local = b.readUInt32LE(p + 42)
    const nombre = b.toString('utf8', p + 46, p + 46 + lenN)
    const ini = local + 30 + b.readUInt16LE(local + 26) + b.readUInt16LE(local + 28)
    const datos = b.subarray(ini, ini + tam)
    const crudo = metodo === 0 ? datos : zlib.inflateRawSync(datos)
    assert.equal(zlib.crc32 ? zlib.crc32(crudo) : crc, crc, `CRC de ${nombre}`)
    outZ[nombre] = crudo.toString('utf8')
    p += 46 + lenN + lenE + lenC
  }
  return outZ
}
const textoXML = (x) => x.replace(/<w:tab\/>/g, '\t').replace(/<w:br\/>/g, '\n').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')

;(async () => {
  const url = (f) => pathToFileURL(path.join(raiz, 'riesgo', 'v1', f)).href
  const m = await import(url('modelo.js'))
  const ia = await import(url('ia.js'))
  const w = await import(url('word.js'))
  const vi = await import(url('vista.js'))
  // Lo que presta la Mesa: la Línea de Tiempo (MS) y el corrector de terminología (uU).
  const mesa = cargarConDependencias(vigente(), ['MS', 'uU'], (c) => c.MS({ recepcion: 'D-7 (0800)', inicioOperacion: 'D (0500)' }) && c.uU('x'))
  console.log('\nMatriz de administración del riesgo (calcos/riesgo/v1)\n')

  await caso('Figura 6 del RO-06-01-04: las 20 casillas de probabilidad × severidad', () => {
    const esperado = {
      I: { A: 'SA', B: 'SA', C: 'A', D: 'A', E: 'M' },
      II: { A: 'SA', B: 'A', C: 'A', D: 'M', E: 'B' },
      III: { A: 'A', B: 'M', C: 'M', D: 'B', E: 'B' },
      IV: { A: 'M', B: 'B', C: 'B', D: 'B', E: 'B' },
    }
    for (const [sev, fila] of Object.entries(esperado)) for (const [prob, n] of Object.entries(fila)) assert.equal(m.nivelDe(prob, sev), n, `${sev}${prob}`)
    assert.equal(m.nivelDe('', 'I'), '')
    assert.equal(m.nivelDe('B', ''), '')
    // El ejemplo del reglamento: «severidad crítica (II) y probabilidad razonable (B) → alto (A)».
    assert.equal(m.nivelDe('B', 'II'), 'A')
  })

  await caso('probabilidad, severidad, nivel y factor escritos con palabras', () => {
    assert.deepEqual(['Alta', 'Media', 'Baja', 'Muy alta', 'Improbable', 'Poco probable', 'Remota', 'Frecuente', 'B (Probable)', '(C)'].map(m.leerProbabilidad), ['B', 'C', 'D', 'A', 'E', 'D', 'D', 'A', 'B', 'C'])
    assert.deepEqual(['Alta', 'Crítica', 'Media', 'Baja', 'Catastrófica', 'II (Crítico)', '4', 'Sin importancia'].map(m.leerSeveridad), ['II', 'II', 'III', 'IV', 'I', 'II', 'IV', 'IV'])
    assert.deepEqual(['Alto', 'Medio', 'Bajo', 'Sumamente alto', 'SA', 'M'].map(m.leerNivel), ['A', 'M', 'B', 'SA', 'SA', 'M'])
    assert.deepEqual(['Terreno', 'Condiciones meteorológicas', 'Enemigo', 'Tiempo disponible', 'Consideraciones civiles', 'Tropas', 'Misión', 'estado del tiempo'].map(m.leerFactor), ['terreno', 'meteorologia', 'enemigo', 'tiempo', 'civiles', 'tropas', 'mision', 'meteorologia'])
  })

  await caso('la hoja de ANTES (renglones con «[IA — verificar]») se lee como matriz sin perder nada', () => {
    const filas = ejercicioRiesgo().g3.riesgo
    const v = m.normalizarRiesgo(filas)
    assert.equal(v.esquema, 'riesgo-v1')
    assert.ok(v.legado)
    assert.equal(v.tareas.length, 1)
    assert.equal(v.tareas[0].id, 't-antes')
    const p = v.tareas[0].peligros[0]
    assert.equal(p.id, 't-antes-p1')
    assert.equal(p.peligro, 'Ataque profundo de artillería de 155 mm (FICT.) sobre las posiciones de la LPR.')
    assert.deepEqual([p.prob, p.sev, m.nivelInicial(p)], ['B', 'II', 'A'])
    assert.deepEqual(p.controles, ['Ejecutar obras de fortificación y enmascaramiento. Ejecuta: Comandantes del RIM-1 (FICT.).'])
    assert.ok(p.ia)
    assert.deepEqual(p.antes, { Probabilidad: 'Alta', Severidad: 'Alta', 'Nivel inicial': 'Alto', 'Riesgo residual': 'Medio' })
    assert.ok(!JSON.stringify(v).includes('[IA'))
    // La F6·P3 de antes («Peligro · Riesgo residual tras el juego de guerra · …»).
    const f6 = m.normalizarRiesgo([{ Peligro: 'Exposición del flanco (FICT.)', 'Riesgo residual tras el juego de guerra': 'Alto', 'Medida de control final': 'Cubrir con la reserva (FICT.)', '¿Quién acepta el riesgo?': 'El Comandante' }])
    assert.equal(f6.tareas[0].peligros[0].peligro, 'Exposición del flanco (FICT.)')
    assert.deepEqual(f6.tareas[0].peligros[0].antes, { 'Riesgo residual': 'Alto', 'Quién acepta el riesgo': 'El Comandante' })
    assert.ok(m.tieneRiesgo(filas) && !m.tieneRiesgo([]) && !m.tieneRiesgo(null) && !m.tieneRiesgo({ esquema: 'riesgo-v1', rotulos: 'eceme' }))
  })

  await caso('el texto se guarda tal cual se escribe (espacios al final) y se limpia al imprimir', () => {
    const v = m.normalizarRiesgo({ esquema: 'riesgo-v1', mision: 'La DIV defiende ', tareas: [{ id: 't1', tarea: 'Ocupar ', peligros: [{ id: 'p1', peligro: 'Emboscada ', controles: ['Uno ', ''], implementar: [''] }] }] })
    assert.equal(v.mision, 'La DIV defiende ')
    assert.deepEqual(v.tareas[0].peligros[0].controles, ['Uno ', ''])
    const s = m.serializar(v)
    assert.equal(s.tareas[0].tarea, 'Ocupar ')
    const t = m.textoRiesgo(v)
    assert.ok(t.includes('La DIV defiende\n') && t.includes('controles: Uno ·') && t.includes('implementar: —'))
  })

  const ctx = () => {
    const d = ejercicioRiesgo()
    return { ordenSup: d.ordenSup, autor: d.autorEM, documentos: d.documentos, g3: { ...d.g3, riesgo: undefined } }
  }
  await caso('membrete táctico: de la Orden del escalón superior, SECRETO aunque la orden diga RESERVADO; lo escrito manda', () => {
    const mb = m.membreteDe(null, ctx())
    assert.deepEqual(m.lineasMembrete(mb), [{ izq: 'I CUERPO DE EJÉRCITO (FICT.)' }, { izq: 'DIV.MEC.-1 (FICT.)', der: 'CG. PUEBLO-X D-15 (2300)' }, { izq: 'EMO/SEC-III' }, { izq: 'No. 001/XYZ' }])
    assert.equal(mb.clasificacion, 'SECRETO')
    const mb2 = m.membreteDe({ esquema: 'riesgo-v1', membrete: { numero: '015/ABC', seccion: 'E.M. G-3' } }, ctx())
    assert.deepEqual(m.lineasMembrete(mb2).slice(2), [{ izq: 'E.M. G-3' }, { izq: 'No. 015/ABC' }])
    assert.equal(m.firmaDe(null, ctx()), 'EL COMANDANTE DE LA DIV.MEC.-1 (FICT.)')
    assert.equal(m.firmaDe(null, { ordenSup: { unidad: 'RCB-1 «CALAMA»' } }), 'EL COMANDANTE DEL RCB-1 «CALAMA»')
    // Sin «Unidad» en la orden: la de la misión.
    assert.equal(m.membreteDe(null, { ordenSup: { mision: 'La DIVMEC-1 defiende a partir del D (0500).' } }).unidad, 'DIVMEC-1')
  })

  await caso('🌱 armar con lo del ejercicio: misión, grupo fecha/hora y preparación (Línea de Tiempo real), quién la prepara, tareas de la F2·P3; no pisa', () => {
    const r = m.armarDesdeEjercicio(null, ctx(), { lineaDeTiempo: mesa.MS })
    const v = r.valor
    assert.equal(v.mision, 'La DIV.MEC.-1 (FICT.) defiende y fija a las fuerzas enemigas a partir del D (0500) hasta el D+1 (1800) en el AO. PUEBLO-X (FICT.).')
    assert.deepEqual([v.empieza, v.termina, v.preparacion], ['D (0500)', 'D+1 (1800)', 'D-6 (0600)'])
    assert.equal(v.preparadoPor, 'My. PRUEBA (FICT.), G-3 DE LA DIV.MEC.-1 (FICT.)')
    assert.deepEqual(v.tareas.map((t) => t.tarea), ['Defender el AO. PUEBLO-X (FICT.)', 'Ocupar y organizar la posición defensiva', 'Fijar a la brigada enemiga (FICT.)', 'Evacuar a la población civil del AO'])
    // La actualización se prepara al aprobar el curso de acción.
    assert.equal(m.armarDesdeEjercicio(null, ctx(), { lineaDeTiempo: mesa.MS, hoja: { id: 'riesgoFinal', actualiza: 'riesgo' } }).valor.preparacion, 'D-5 (0930)')
    // Sin Línea de Tiempo: las horas salen de la misión.
    const c2 = ctx()
    delete c2.g3.lineaTiempo
    const v2 = m.armarDesdeEjercicio(null, c2, { lineaDeTiempo: mesa.MS }).valor
    assert.deepEqual([v2.empieza, v2.termina, v2.preparacion], ['D (0500)', 'D+1 (1800)', ''])
    // La reexpresión de la misión (F2·P12) manda sobre la de la orden.
    const c3 = ctx()
    c3.g3.mision = { 'ENUNCIADO COMPLETO DE LA MISIÓN': 'MISIÓN REEXPRESADA (FICT.) entre el D (0600) y el D+2 (1800).' }
    assert.equal(m.armarDesdeEjercicio(null, c3).valor.mision, 'MISIÓN REEXPRESADA (FICT.) entre el D (0600) y el D+2 (1800).')
    // No pisa: lo escrito queda, y no repite tareas.
    const previo = { esquema: 'riesgo-v1', mision: 'MI MISIÓN', tareas: [{ id: 'x', tarea: 'Evacuar a la población civil del AO', peligros: [] }] }
    const r4 = m.armarDesdeEjercicio(previo, ctx(), { lineaDeTiempo: mesa.MS })
    assert.equal(r4.valor.mision, 'MI MISIÓN')
    assert.equal(r4.valor.tareas.filter((t) => t.tarea === 'Evacuar a la población civil del AO').length, 1)
    assert.equal(m.armarDesdeEjercicio(r4.valor, ctx(), { lineaDeTiempo: mesa.MS }).cambios.length, 0)
  })

  await caso('K = el MAYOR riesgo residual (no un promedio); sin residual cuenta el inicial', () => {
    const P = (prob, sev, probRes, sevRes, peligro = 'x') => ({ peligro, prob, sev, probRes, sevRes, controles: ['c'], implementar: ['i'] })
    const v = { esquema: 'riesgo-v1', tareas: [{ tarea: 'T', peligros: [P('B', 'II', 'D', 'II', 'a'), P('C', 'III', 'D', 'IV', 'b'), P('A', 'II', 'B', 'II', 'c')] }] }
    assert.deepEqual(m.nivelGeneral(v), { nivel: 'A', desde: ['c'], conInicial: 0 })
    v.tareas[0].peligros.push(P('A', 'I', '', '', 'd'))
    assert.deepEqual(m.nivelGeneral(v), { nivel: 'SA', desde: ['d'], conInicial: 1 })
  })

  await caso('revisión doctrinaria: faltantes, residual más alto que el inicial, SA, tareas repetidas, MATT-TCE', () => {
    const v = { esquema: 'riesgo-v1', mision: 'M', empieza: 'D', termina: 'D+1', preparacion: 'D-6', preparadoPor: 'G-3', tareas: [{ tarea: 'T1', peligros: [{ peligro: 'P1', factor: 'enemigo', prob: 'D', sev: 'III', probRes: 'A', sevRes: 'I', controles: ['c'], implementar: ['i'] }, { peligro: 'P2', prob: 'B', sev: 'II' }] }, { tarea: 't1', peligros: [] }] }
    const r = m.revisarRiesgo(v).map((x) => `${x.tipo}: ${x.txt}`)
    const hay = (re) => assert.ok(r.some((x) => re.test(x)), `falta ${re} en ${JSON.stringify(r, null, 1)}`)
    hay(/err: «P1»: el riesgo residual \(Sumamente alto\) quedó MÁS ALTO/)
    hay(/err: «P1»: el riesgo residual es SUMAMENTE ALTO/)
    hay(/err: «P2»: no tiene medidas de control/)
    hay(/aviso: «P2»: falta el riesgo residual/)
    hay(/aviso: Hay 2 tareas con el mismo nombre/)
    hay(/aviso: «t1» no tiene ningún obstáculo/)
    hay(/info: Factores MATT-TCE sin ningún obstáculo: Misión · Terreno/)
  })

  await caso('texto para el expediente (lo leen los pedidos de las otras hojas)', () => {
    const t = m.textoRiesgo({ esquema: 'riesgo-v1', rotulos: 'eceme', mision: 'MISIÓN (FICT.)', empieza: 'D (0500)', termina: 'D+1 (1800)', tareas: [{ tarea: 'Reconocimientos', peligros: [{ peligro: 'Neblina', factor: 'meteorologia', prob: 'B', sev: 'III', controles: ['Guías'], probRes: 'D', sevRes: 'III', implementar: ['PON'] }] }] })
    assert.ok(t.includes('1. MISIÓN O TAREA: MISIÓN (FICT.)'))
    assert.ok(t.includes('2. GRUPO FECHA/HORA: INICIA: D (0500) · TERMINA: D+1 (1800)'))
    assert.ok(t.includes('Neblina (Condiciones meteorológicas) · evaluación: MODERADO (M) — IIIB · controles: Guías · residual: BAJO (B) — IIID · implementar: PON'))
    assert.ok(t.includes('Nivel general de la misión después de los controles: BAJO (B)'))
    assert.equal(m.textoRiesgo(null), '')
    assert.equal(m.textoRiesgo({ esquema: 'riesgo-v1' }), '')
  })

  await caso('pedido a la IA: expediente, lo que leyó la Mesa, el método (Figura 6), la matriz con sus id y el formato', () => {
    const v = m.armarDesdeEjercicio(ejercicioRiesgo().g3.riesgo, ctx(), { lineaDeTiempo: mesa.MS }).valor
    const p = ia.pedidoRiesgo(v, { expediente: '# EXPEDIENTE DEL EJERCICIO — MESA DEL ESTADO MAYOR\n\nEXPEDIENTE DE PRUEBA (FICT.)', ctx: ctx(), hoja: { num: 'F2·P7' }, modo: 'completar', encabezado: 'ENCABEZADO DE LA MESA', lineaDeTiempo: mesa.MS })
    assert.ok(p.ok)
    const t = p.prompt
    assert.ok(t.startsWith('ENCABEZADO DE LA MESA'))
    for (const x of ['EXPEDIENTE DE PRUEBA (FICT.)', 'MATRIZ DE ADMINISTRACIÓN DEL RIESGO', 'RO-06-01-04', 'Anexo «B»', 'Unidad considerada: DIV.MEC.-1 (FICT.)', 'Escalón superior: I CUERPO DE EJÉRCITO (FICT.)', 'empieza D (0500) · termina D+1 (1800)', 'D-6 (0600)', '1. Defender el AO. PUEBLO-X (FICT.) (específica, ESENCIAL)', 'MATT-TCE', 'el COC (terreno restringido y severamente restringido) y el CMOC', 'CONDICIONES METEOROLÓGICAS', '     II    SA    A    A    M    B', 'QUIÉN, QUÉ, DÓNDE, CUÁNDO y CÓMO', '"id": "t-antes-p1"', '"antes"', 'vienen de la hoja anterior', 'COMPLETAR LO QUE FALTA', '"probabilidadResidual"', 'NO escribas «[IA — verificar]»', 'VERIFICACIÓN FINAL'])
      assert.ok(t.includes(x), `el pedido no trae «${x}»`)
    const mejorar = ia.pedidoRiesgo(v, { modo: 'completar_mejorar' }).prompt
    assert.ok(mejorar.includes('COMPLETAR **Y** MEJORAR') && mejorar.includes('REEMPLAZA la matriz'))
    assert.ok(ia.pedidoRiesgo(null, {}).prompt.includes('(vacía: armala entera)'))
    const act = ia.pedidoRiesgo(null, { hoja: { id: 'riesgoFinal', num: 'F6·P3', actualiza: 'riesgo' }, ctx: ctx() }).prompt
    assert.ok(act.includes('MATRIZ DE ADMINISTRACIÓN DEL RIESGO (ACTUALIZACIÓN)') && act.includes('CURSO DE ACCIÓN APROBADO'))
  })

  await caso('respuesta de la IA: «sólo completar» no pisa, agrega, junta repetidas, marca lo de la IA y pasa el corrector', () => {
    const base = m.armarDesdeEjercicio(ejercicioRiesgo().g3.riesgo, ctx(), { lineaDeTiempo: mesa.MS }).valor
    const resp = respuestaIA()
    resp.tareas[1].peligros[0].controles.push('La operación se conducirá con guías (FICT.).')
    const r = ia.aplicarRespuestaRiesgo('Acá va:\n```json\n' + JSON.stringify(resp) + '\n```', base, { modo: 'completar', corregir: mesa.uU })
    assert.ok(r.ok, r.error)
    const v = r.valor
    assert.equal(v.preparacion, 'D-6 (0600)', 'no pisa la fecha de preparación')
    const t0 = v.tareas.find((t) => t.id === 't-antes')
    assert.equal(t0.tarea, 'Ocupar y organizar la posición defensiva')
    assert.equal(v.tareas.filter((t) => t.tarea === 'Ocupar y organizar la posición defensiva').length, 1, 'repetida juntada')
    const p1 = t0.peligros[0]
    assert.equal(p1.peligro, 'Ataque profundo de artillería de 155 mm (FICT.) sobre las posiciones de la LPR.', 'no pisa el obstáculo')
    assert.deepEqual([p1.probRes, p1.sevRes, m.nivelResidual(p1)], ['D', 'II', 'M'])
    assert.deepEqual(p1.implementar, ['Anexo de Operaciones (FICT.): plan de fortificación por fases.'])
    assert.ok(p1.ia)
    const rec = v.tareas.find((t) => t.tarea === 'Reconocimientos en el terreno (FICT.)')
    assert.equal(rec.peligros.length, 2)
    assert.ok(rec.peligros.every((p) => p.ia && p.factor))
    assert.ok(rec.peligros[0].controles.some((c) => /se ejecutará con guías/.test(c)), 'corrector de terminología de la Mesa')
    assert.ok(/Se juntó una tarea que quedó repetida/.test(r.msg))
    assert.ok(/🤖 revisar/.test(r.msg))
    // Otra vez la misma respuesta: no hay nada que completar.
    const r2 = ia.aplicarRespuestaRiesgo(JSON.stringify(resp), v, { modo: 'completar' })
    assert.ok(!r2.ok && /No había nada que completar/.test(r2.error))
    assert.ok(!ia.aplicarRespuestaRiesgo('sin json', v).ok)
    assert.ok(!ia.aplicarRespuestaRiesgo('{"otra":1}', v).ok)
  })

  await caso('respuesta de la IA: «completar y mejorar» reescribe la matriz y conserva los id; avisa si el residual sube', () => {
    const base = m.armarDesdeEjercicio(ejercicioRiesgo().g3.riesgo, ctx(), { lineaDeTiempo: mesa.MS }).valor
    const resp = { mision: 'MISIÓN MEJORADA (FICT.)', tareas: [{ id: 't-antes', tarea: 'OCUPAR LA POSICIÓN (FICT.)', peligros: [{ id: 't-antes-p1', peligro: 'Artillería (FICT.)', factor: 'Enemigo', probabilidad: 'B (Probable)', severidad: 'II (Crítico)', controles: ['c'], probabilidadResidual: 'A', severidadResidual: 'I', implementar: ['i'] }] }] }
    const r = ia.aplicarRespuestaRiesgo(JSON.stringify(resp), base, { modo: 'completar_mejorar' })
    assert.ok(r.ok, r.error)
    assert.equal(r.valor.mision, 'MISIÓN MEJORADA (FICT.)')
    assert.deepEqual(r.valor.tareas.map((t) => [t.id, t.tarea]), [['t-antes', 'OCUPAR LA POSICIÓN (FICT.)']])
    assert.equal(r.valor.tareas[0].peligros[0].id, 't-antes-p1')
    assert.equal(r.valor.tareas[0].peligros[0].factor, 'enemigo')
    assert.ok(!r.valor.legado)
    assert.ok(/residual MÁS ALTO/.test(r.msg))
  })

  await caso('lo que otros pedidos a la IA traen para la matriz se AGREGA (función sP real de la Mesa)', async () => {
    const f = cargarConDependencias(vigente(), ['sP'], (c) => c.sP({ a: [], b: {} }, { a: [{ x: 'y' }], b: { c: 'd', e: ['f'], g: { h: 'i' } } }), { SIDRiesgoFusionable: ia.fusionable, SIDRiesgoFusionar: ia.fusionarRiesgo, ...(await reconocimiento()) })
    const matriz = m.serializar(m.armarDesdeEjercicio(null, ctx(), { lineaDeTiempo: mesa.MS }).valor)
    const { hojas, puestos } = f.sP({ riesgo: matriz, tareas: [{ Tarea: 'x' }] }, { riesgo: [{ 'Peligro identificado': 'Minas en el paso (FICT.)', Probabilidad: 'Media', Severidad: 'Alta', 'Medida de control': 'Desminado (FICT.)' }], tareas: [{ Tarea: 'y' }] })
    assert.equal(hojas.riesgo.esquema, 'riesgo-v1', 'sigue siendo la matriz')
    assert.equal(hojas.riesgo.mision, matriz.mision)
    assert.ok(hojas.riesgo.tareas.some((t) => t.peligros.some((p) => p.peligro === 'Minas en el paso (FICT.)' && p.prob === 'C' && p.sev === 'II' && p.ia)))
    assert.equal(hojas.tareas.length, 2, 'las otras hojas, como siempre')
    assert.ok(puestos >= 2)
    // La F6·P3 de renglones del G-1/G-4/G-5 («Riesgos de …») sigue igual.
    const g = f.sP({ riesgo: [{ Riesgo: 'a' }] }, { riesgo: [{ Riesgo: 'b' }] })
    assert.ok(Array.isArray(g.hojas.riesgo) && g.hojas.riesgo.length === 2)
  })

  let docx = null
  await caso('Word: carta apaisada, membrete Arial 10 negrilla, SECRETO arriba y abajo, «1 - N», la matriz y el círculo en K', () => {
    const base = m.armarDesdeEjercicio(ejercicioRiesgo().g3.riesgo, ctx(), { lineaDeTiempo: mesa.MS }).valor
    const v = ia.aplicarRespuestaRiesgo(JSON.stringify(respuestaIA()), base, { modo: 'completar' }).valor
    docx = w.crearWordRiesgo(v, { ctx: ctx(), hoja: { num: 'F2·P7' } })
    fs.writeFileSync(path.join(out, 'node-F2P7.docx'), docx)
    const z = leerZip(docx)
    for (const k of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/styles.xml', 'word/numbering.xml', 'word/header1.xml', 'word/footer1.xml', 'word/_rels/document.xml.rels']) assert.ok(z[k], `falta ${k}`)
    const d = z['word/document.xml']
    assert.ok(/<w:pgSz w:w="15840" w:h="12240" w:orient="landscape"\/>/.test(d), 'carta apaisada')
    assert.equal(textoXML(z['word/header1.xml']).trim(), 'SECRETO')
    const pie = z['word/footer1.xml']
    assert.ok(textoXML(pie).includes('SECRETO') && / PAGE /.test(pie) && / NUMPAGES /.test(pie) && pie.includes(' - '), 'pie: SECRETO y numeración')
    // Membrete: las cuatro líneas, en negrilla y tamaño 20 (Arial 10), antes del título.
    const titulo = d.indexOf('MATRIZ DE ADMINISTRACIÓN DEL RIESGO')
    const membrete = d.slice(0, titulo)
    for (const x of ['I CUERPO DE EJÉRCITO (FICT.)', 'DIV.MEC.-1 (FICT.)', 'CG. PUEBLO-X D-15 (2300)', 'EMO/SEC-III', 'No. 001/XYZ']) assert.ok(membrete.includes(x), `membrete sin «${x}»`)
    const runs = membrete.match(/<w:r>.*?<\/w:r>/g).filter((r) => /<w:t /.test(r))
    assert.ok(runs.every((r) => r.includes('w:ascii="Arial"') && r.includes('<w:b/>') && r.includes('<w:sz w:val="20"/>')), 'Arial 10 negrilla')
    const t = textoXML(d)
    for (const x of ['A. Misión o tarea:', 'B. Grupo fecha/hora', 'Empieza: D (0500)', 'Termina: D+1 (1800)', 'C. Fecha de preparación', 'D-6 (0600)', 'D. Preparado por: My. PRUEBA (FICT.), G-3 DE LA DIV.MEC.-1 (FICT.)', 'E. Tarea', 'F. Identificar los obstáculos', 'G. Estimar los obstáculos', 'H. Determinar las medidas de control', 'I. Determinar el riesgo residual', 'J. Implementar las medidas de control (como hacerlo)', 'K. Determinar el nivel general', 'Reconocimientos en el terreno (FICT.)', 'Alto (A)\n(IIB)', 'Moderado (M)\n(IID)', 'BAJO (B)', 'SUMAMENTE ALTO (SA)', 'EL COMANDANTE DE LA DIV.MEC.-1 (FICT.)'])
      assert.ok(t.includes(x), `el Word no trae «${x}»`)
    assert.ok(!t.includes('[IA'), 'sin marcas de la IA')
    assert.equal((d.match(/prst="ellipse"/g) || []).length, 1, 'un solo nivel encerrado en un círculo')
    assert.ok(d.indexOf('prst="ellipse"') < d.indexOf('MODERADO (M)') && d.indexOf('prst="ellipse"') > d.indexOf('BAJO (B)'), 'el círculo va en MODERADO (M)')
    assert.ok(/<w:vMerge w:val="restart"\/>/.test(d) && /<w:vMerge w:val="continue"\/>/.test(d), 'la tarea con dos obstáculos ocupa sus dos filas')
    assert.ok(/<w:gridCol w:w="\d+"\/>(<w:gridCol w:w="\d+"\/>){5}<\/w:tblGrid>/.test(d), 'seis columnas')
  })

  await caso('Word con los rótulos de la Escuela (1–11): tareas en mayúsculas, «A (IIB)», viñetas «-»', () => {
    const v = { esquema: 'riesgo-v1', rotulos: 'eceme', mision: 'M', tareas: [{ tarea: 'Trabajos de OT', peligros: [{ peligro: 'Accidentes (FICT.)', prob: 'A', sev: 'II', controles: ['Casco'], probRes: 'B', sevRes: 'II', implementar: ['PON'] }] }] }
    const z = leerZip(w.crearWordRiesgo(v, { ctx: ctx() }))
    const t = textoXML(z['word/document.xml'])
    for (const x of ['1. MISIÓN O TAREA', '2. GRUPO FECHA/HORA', 'INICIA:', 'TERMINA:', '3. FECHA DE PREPARACIÓN:', '4. PREPARADO POR:', '5. TAREA', '6. IDENTIFICAR PELIGROS/', '7. Evaluación de peligros/', '8. Desarrollar controles', '9. Determinar el riesgo residual', '10. Implementar controles (como)', '11. DETERMINAR EL NIVEL DE RIESGO GLOBAL', 'TRABAJOS DE OT', 'SA (IIA)', 'A (IIB)'])
      assert.ok(t.includes(x), `sin «${x}»`)
    assert.ok(z['word/document.xml'].includes('<w:numId w:val="2"/>'), 'viñetas «-»')
    assert.ok(!z['word/document.xml'].includes('<w:numId w:val="1"/>'), 'sin ✓')
    // Vacía: el formato en blanco del Anexo «B».
    const vacia = textoXML(leerZip(w.crearWordRiesgo(null, {}))['word/document.xml'])
    assert.ok(vacia.includes('A. Misión o tarea:') && vacia.includes('K. Determinar el nivel general') && vacia.includes('EL COMANDANTE DE LA UNIDAD'))
  })

  await caso('vista previa (HTML): la misma matriz, con el membrete y un solo nivel encerrado', () => {
    const base = m.armarDesdeEjercicio(ejercicioRiesgo().g3.riesgo, ctx(), { lineaDeTiempo: mesa.MS }).valor
    const v = ia.aplicarRespuestaRiesgo(JSON.stringify(respuestaIA()), base, { modo: 'completar' }).valor
    const h = vi.paginaRiesgoHTML(v, { ctx: ctx(), hoja: { num: 'F2·P7' } })
    const t = h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
    for (const x of ['SECRETO', 'I CUERPO DE EJÉRCITO (FICT.)', 'CG. PUEBLO-X D-15 (2300)', 'EMO/SEC-III', 'No. 001/XYZ', 'MATRIZ DE ADMINISTRACIÓN DEL RIESGO', 'E. Tarea', 'K. Determinar el nivel general', 'EL COMANDANTE DE LA DIV.MEC.-1 (FICT.)']) assert.ok(t.includes(x), `sin «${x}»`)
    assert.equal((h.match(/border-radius:50%/g) || []).length, 1)
    assert.ok(vi.matrizHTML(v, { ctx: ctx() }).includes('rowspan="2"'), 'la tarea ocupa las filas de sus obstáculos')
    // En la carpeta del G-3 va sólo la matriz (la carpeta ya tiene membrete y título por hoja).
    const c = vi.matrizCarpetaHTML(v, { ctx: ctx(), hoja: { num: 'F2·P7' } })
    assert.ok(!c.includes('EMO/SEC-III') && !c.includes('EL COMANDANTE') && c.includes('E. Tarea') && c.includes('Reconocimientos en el terreno (FICT.)'))
    assert.equal((c.match(/border-radius:50%/g) || []).length, 1)
  })

  console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(fallas ? 1 : 0)
})()
