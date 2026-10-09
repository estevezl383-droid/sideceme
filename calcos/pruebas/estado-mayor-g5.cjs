// Pruebas del G-5 Asuntos Civiles / GM en el motor de documentos de Estado Mayor
// (calcos/estado-mayor/vN, la carpeta que importa el compilado vigente: hoy v3):
//   · la FORMA: la Apreciación de AC/GM tiene todos los apartados del modelo de la Escuela
//     (aprec-acgm del catálogo), en orden y al mismo nivel, con las instrucciones literales;
//     el Anexo de AC/GM tiene, en orden, los apartados del anexo que ya bajaba la Mesa (fNe
//     del compilado: la Escuela no tiene modelo de anexo del G-5);
//   · el MOTOR v3: un apartado con texto propio y subapartados; los CAP en la comparación sin
//     análisis por CAP; configurarEM suma; el registro militar del anexo sin modelo;
//   · el G-5 con un ejercicio FICTICIO y las cuentas REALES del panel del G-5, sacadas del
//     compilado (rC inventario, mP población, fN evacuación, SDe descarga al G-4, Ni
//     catálogo de instalaciones): lo que trae 🌱 del calco, de las hojas y de las otras
//     secciones;
//   · la IA: el pedido (expediente, documentos aportados, lo calculado, lo entregado,
//     doctrina, formato, ideas, JSON y «FORMATO DE TU RESPUESTA») y la respuesta (sólo
//     completar no pisa; mejorar reescribe; ESCRITA como documento, sin JSON; JSON roto y
//     cortado);
//   · las hojas de trabajo de siempre: guía y 🌱 de TODAS, pedido con la doctrina;
//   · el registro (con las hojas REALES del compilado) y los reemplazos del compilado.
//
//   node estado-mayor-g5.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { cargar } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')
const { capasAC, ejercicioAC, respuestaAprec, respuestaAnexo, PROSA_ANEXO } = require('./g5-ejemplo.js')

const RAIZ = path.join(__dirname, '..')
const url = (p) => 'file://' + path.join(RAIZ, p)
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')
const VIGENTE = path.join(RAIZ, html.match(/\.\/(assets\/index-[\w-]+\.js)/)[1])
const V = (fs.readFileSync(VIGENTE, 'utf8').match(/"\.\.\/estado-mayor\/(v\d+)\/registro\.js"/) || [])[1]
let fallos = 0
const casos = []
const caso = (nombre, f) => casos.push([nombre, f])

;(async () => {
  assert.ok(V, 'el compilado vigente importa el motor de documentos')
  console.log(`compilado: ${path.basename(VIGENTE)} · motor: calcos/estado-mayor/${V}`)
  const M = await import(url(`estado-mayor/${V}/motor.js`))
  const G = await import(url(`estado-mayor/${V}/campos/g5.js`))
  const G1 = await import(url(`estado-mayor/${V}/campos/g1.js`))
  const R = await import(url(`estado-mayor/${V}/registro.js`))
  const RT = await import(url(`estado-mayor/${V}/runtime.js`))
  const L = await import(url(`estado-mayor/${V}/lector.js`))
  const { catalogo } = await import(url('formato-militar/v1/catalogo.js'))
  const FM = await import(url('formato-militar/v1/modelo.js'))
  const G5 = G.default
  const { APREC, ANEXO } = G

  // Las cuentas del panel del G-5, el catálogo de instalaciones y el resumen del G-2,
  // TEXTUALES del compilado vigente.
  const mesa = cargarConDependencias(VIGENTE, ['rC', 'mP', 'fN', 'SDe', 'LU', 'Ni', 'voe', 'fNe'], (c) => {
    const k = capasAC()
    const r = c.rC(k)
    c.mP(k)
    c.fN({ poblacion: 100, buses: 2, albergues: 1 })
    c.SDe(r.categorias, {})
    c.Ni('pc_acgm')
    c.fNe({})
  })
  const datos = ejercicioAC()
  const vivo = { ops: datos.ops, unidades: datos.unidades, fasesCOA: datos.fasesCOA, bajasPorFase: [], conceptoApoyo: datos.conceptoApoyo, misionLog: datos.misionLog, estadosRecursos: datos.estadosRecursos, evacuacion: datos.evacuacion, orgTarea: [], ordenSup: datos.ordenSup, hojasG: datos.hojasG, g3: {}, picb: {} }
  RT.configurarEM({ catalogo: mesa.Ni, resumenG2: mesa.voe })
  // (lo que agrega la lista del G-5 en el compilado: un segundo configurarEM que SUMA)
  RT.configurarEM({ inventarioAC: mesa.rC, poblacionAC: mesa.mP, evacuacionAC: mesa.fN, descargaAC: mesa.SDe, estadosAC: mesa.LU })
  RT.sincronizarEM(vivo)
  RT.sincronizarExtraEM({ capas: capasAC() })
  const ctx = (hojas = datos.hojasG.g5, extra = {}) => RT.contexto({ campo: 'g5', hojas, ctxDoc: { unidad: 'DIV.MEC.-1 (FICT.)', ordenSup: datos.ordenSup, ...extra } })

  // ── LA FORMA ──────────────────────────────────────────────────────────────────────
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  function secuencia(def) {
    const out = []
    const rec = (ns, nivel) => {
      for (const n of ns) {
        out.push({ t: n.t, ayuda: n.ayuda || '', nivel })
        if (n.hijos) rec(n.hijos, nivel + 1)
      }
    }
    rec(def.arbol, 1)
    return out
  }
  // Cada apartado del modelo (en orden) tiene su apartado en la definición, AL MISMO NIVEL:
  // por su título o, si el modelo da una instrucción, por la instrucción literal en la ayuda.
  // El modelo del catálogo trae «Conclusión pendiente» con la instrucción aparte.
  function fiel(def) {
    const sec = secuencia(def)
    const faltan = []
    let j = 0
    for (const a of catalogo[def.plantilla].apartados) {
      const texto = a.titulo === 'Conclusión pendiente' && a.instruccion ? a.instruccion : a.titulo
      const m = norm(texto)
      const k = sec.findIndex((x, i) => i >= j && (norm(x.t) === m || (x.ayuda && norm(x.ayuda) === m)))
      if (k < 0) faltan.push(texto)
      else if (sec[k].nivel !== a.nivel) faltan.push(`${texto} (nivel ${sec[k].nivel} en vez de ${a.nivel})`)
      else j = k + 1
    }
    return { faltan, sobran: sec.length - catalogo[def.plantilla].apartados.length }
  }
  caso('la Apreciación de AC/GM tiene TODOS los apartados del modelo de la Escuela, en orden y al mismo nivel', () => {
    const f = fiel(APREC)
    assert.deepEqual(f.faltan, [])
    assert.equal(f.sobran, 0, 'ni uno de más')
    assert.deepEqual(catalogo[APREC.plantilla].rotulos, APREC.preliminares.map((p) => p.t))
    assert.equal(FM.registroHoja({ id: 'aprecActiva' }, { g: 'g5' }).plantilla, APREC.plantilla, 'registroHoja le da su modelo')
  })
  caso('las INSTRUCCIONES del modelo quedan literales como ayuda (con un rótulo descriptivo)', () => {
    const ayudas = M.camposDe(APREC).map((c) => c.ayuda).concat(secuencia(APREC).map((x) => x.ayuda))
    for (const t of ['Estimar el número de refugiados', 'Revisar detalladamente', 'Apreciar la influencia', 'Considerar el número y composición', 'Efectuar la comparación de cada factor', 'Recomiende el mejor Curso de Acción en relación', 'Los factores que afectan por igual', 'Efectuar la comparación de cada CAP', 'Se recomienda el mejor CAP', 'Se prosigue en igual forma', 'Indicar si la misión', 'Indicar cuando sea apropiado', 'Recomiende el mejor curso de acción de AC/GM', 'Exponer las recomendaciones']) {
      const a = catalogo['aprec-acgm'].apartados.find((x) => (x.instruccion || x.titulo).startsWith(t))
      assert.ok(a, `el modelo trae «${t}»`)
      const lit = (a.instruccion || a.titulo).replace(/\s+/g, ' ')
      assert.ok(ayudas.some((x) => x.replace(/\s+/g, ' ') === lit), `instrucción literal: «${lit}»`)
    }
  })
  caso('el Anexo de AC/GM tiene, en orden, los apartados del anexo que ya bajaba la Mesa (fNe)', () => {
    const h = mesa.fNe({})
    const re = /<h2[^>]*>([^<]+)<\/h2>|<b>((?:[IVX]+|[A-Z]|\d+)\.-\s[^<]+)<\/b>/g
    const mesaT = []
    let x
    while ((x = re.exec(h))) mesaT.push((x[1] || x[2]).trim())
    const nuestro = []
    const rec = (ns, nivel) => {
      let i = 0
      for (const n of ns) {
        nuestro.push(n.sinNumero ? n.t : `${M.rotNum(nivel, ++i)} ${n.t}`)
        if (n.hijos) rec(n.hijos, nivel + 1)
      }
    }
    rec(ANEXO.arbol, 0)
    assert.deepEqual(nuestro, mesaT)
    for (const r of ['OBJETO', 'CARTA', 'APÉNDICE']) assert.ok(h.includes(r), `el de la Mesa trae ${r}`)
    assert.deepEqual(ANEXO.preliminares.map((p) => p.t), ['OBJETO', 'CARTA', 'APÉNDICE'])
    assert.equal(catalogo['plan-acgm'], undefined, 'la Escuela no tiene modelo de anexo del G-5 (si aparece, hay que usarlo)')
  })
  caso('los ids de los campos no se repiten', () => {
    for (const def of [APREC, ANEXO]) {
      const ids = M.camposDe(def).map((c) => c.id)
      assert.equal(new Set(ids).size, ids.length, def.titulo)
    }
  })

  // ── EL MOTOR v3 ───────────────────────────────────────────────────────────────────
  caso('un apartado con texto PROPIO y subapartados («B.- Fuerzas propias.»): campo, Word, vista previa y pedido', () => {
    const v = M.armar(ANEXO, {}, { campos: { fuerzasPropias: 'Población: 12.600 hab.', actitud: 'Coopera.', concepto: 'Prioridad a Servicios Especiales.', evacuacion: 'Previsión.' } }).valor
    assert.ok(M.camposDe(ANEXO).some((c) => c.id === 'fuerzasPropias' && c.grupo))
    const s = M.especificacion(ANEXO, v, { tablas: { evacuacion: { cabecera: ['A', 'B'], filas: [['1', '2']] } } })
    const fp = s.secciones[1].hijos[1]
    assert.equal(fp.titulo, 'Fuerzas propias.')
    assert.equal(fp.texto, 'Población: 12.600 hab.')
    assert.deepEqual(fp.hijos.map((x) => x.titulo), ['Actitud de la población.', 'Autoridades y agencias presentes.', 'Recursos del área.'])
    assert.equal(fp.hijos[0].texto, 'Coopera.')
    const con = s.secciones[3].hijos[0]
    assert.equal(con.texto, 'Prioridad a Servicios Especiales.')
    assert.equal(con.hijos[0].tabla.filas.length, 1, 'el cuadro va en su subapartado')
    assert.equal(s.secciones[0].titulo, 'Organización de la Tarea.')
    assert.equal(s.secciones[0].sinRotulo, true)
    const h = M.html(ANEXO, v)
    for (const t of ['Organización de la Tarea.', 'I.- SITUACIÓN.', 'B.- Fuerzas propias.', 'Población: 12.600 hab.', '1.- Actitud de la población.', 'III.- EJECUCIÓN.', 'A.- Concepto de Apoyo.', 'V.- COMANDO Y COMUNICACIONES.']) assert.ok(h.includes(t), `html: falta «${t}»`)
    assert.ok(h.indexOf('Población: 12.600 hab.') < h.indexOf('1.- Actitud'), 'el texto propio va antes de los subapartados')
    const f = M.formatoParaIA(ANEXO)
    assert.match(f, /B\.- Fuerzas propias\.\s+→\s+"campos"\."fuerzasPropias" \(su texto propio/)
    assert.match(f, /1\.- Actitud de la población\.\s+→\s+"campos"\."actitud"/)
    assert.match(f, /^Organización de la Tarea\.\s+→/m, 'sin número')
  })
  caso('la comparación por CAP sin análisis por CAP: dos CAP sin fases, ventajas en el Word y revisión', () => {
    const v = M.normalizar(APREC, null)
    assert.equal(v.caps.length, 2)
    assert.equal(v.caps[0].fases.length, 0, 'el modelo no analiza por fase')
    assert.match(M.resumen(APREC, v), /^0 de \d+ apartados · 2 CAP$/)
    const w = M.armar(APREC, v, { caps: [{ nombre: 'CAP A (FICT.)', ventajas: 'V1' }, { nombre: 'CAP B (FICT.)' }, { nombre: 'CAP C (FICT.)', desventajas: 'D3' }] }).valor
    assert.equal(w.caps.length, 3, 'un CAP más')
    const s = M.especificacion(APREC, w)
    const comp = s.secciones.find((x) => x.titulo === 'COMPARACIÓN.')
    const c = comp.hijos[2]
    assert.equal(c.titulo, 'Cursos de Acción Propios (CAPs).')
    assert.equal(c.hijos[0].hijos[0].titulo, 'CAP A (FICT.)')
    assert.deepEqual(c.hijos[0].hijos[0].hijos.map((x) => [x.titulo, x.texto]), [['Ventajas.', 'V1'], ['Desventajas.', M.PENDIENTE]])
    assert.ok(!s.secciones.find((x) => x.titulo === 'ANÁLISIS.').hijos.some((x) => /CAP/.test(x.titulo)), 'el análisis es por función, no por CAP')
    assert.ok(M.revisar(APREC, w).some((x) => /CAP B \(FICT\.\): faltan las ventajas/.test(x.txt)))
    assert.ok(!M.revisar(APREC, w).some((x) => /fase por fase/.test(x.txt)))
    const p = M.pedido(APREC, w, { seccion: 'X', producto: 'Y' })
    assert.ok(p.prompt.includes('"caps"[]."ventajas"'))
    assert.ok(!p.prompt.includes('"fases"'), 'sin fases en el JSON')
  })
  caso('configurarEM SUMA lo que recibe; el anexo sin modelo sale con el formato militar común', () => {
    const c = RT.contexto({ campo: 'g5' })
    assert.equal(typeof c.catalogo, 'function', 'lo del primer configurarEM')
    assert.equal(typeof c.inventarioAC, 'function', 'lo del segundo')
    const r = FM.registroHoja({ id: 'anexoF7P1' }, { g: 'g5' })
    assert.equal(r.plantilla, null)
    assert.equal(FM.esDocumentoMilitar(r), false, 'el registro de la hoja no lo haría militar')
    const rw = R.registroWord(G5.documentos.anexo, r)
    assert.equal(FM.esDocumentoMilitar(rw), true, 'con registro.militar sí: membrete, OCA, firma')
    assert.equal(rw.nivel, 'anexo')
    const rg1 = FM.registroHoja({ id: 'anexoF7P1' }, { g: 'g1' })
    assert.deepEqual(R.registroWord(G1.default.documentos.anexo, rg1), rg1, 'el G-1 no cambia')
    assert.equal(R.registroWord(G5.documentos.anexo, null), null)
  })

  // ── EL G-5 CON EL EJERCICIO (las cuentas REALES del panel) ────────────────────────
  caso('inventario: la MISMA cuenta del panel (rC) con la clasificación del G-5', () => {
    const inv = G.inventario(ctx())
    const crudo = mesa.rC(capasAC())
    assert.equal(inv.total, crudo.total)
    assert.equal(inv.total, 18, 'el banco de plaza no es un recurso')
    assert.deepEqual(inv.porEstado, { explotable: 13, protegido: 3, negado: 2, sin: 0 })
    assert.equal(inv.revisados, 3)
    assert.equal(G.categoria(inv, 'abastecimiento').recursos[1].estado, 'negado', 'el surtidor lo negó el G-5')
    assert.equal(G.categoria(inv, 'sanidad').recursos[0].estado, 'protegido', 'el hospital queda con la sugerida')
    const t = G.tablaRecursos(ctx())
    assert.equal(t.filas.length, inv.categorias.length + 1)
    assert.deepEqual(t.filas.at(-1).map((x) => x.t), ['TOTAL', '18', '13', '3', '2', '0'])
  })
  caso('población (mP), evacuación (fN) y descarga al G-4 (SDe): las mismas cifras del panel', () => {
    const P = G.poblacion(ctx())
    assert.equal(P.total, 12600)
    assert.equal(P.conCenso, 2)
    const E = G.evacuacion(ctx())
    const ref = mesa.fN({ poblacion: 12600, pctEvacuar: 30, dias: 3, albergues: 3, buses: 10 })
    assert.equal(E.r.evacuados, ref.evacuados)
    assert.equal(E.r.evacuados, 3780)
    assert.equal(E.r.agua, ref.agua)
    assert.equal(E.r.albergesNec, 26)
    assert.equal(E.r.viajes, 10)
    assert.match(E.r.alerta, /Faltan 23 albergue/)
    const T = G.tablaEvacuacion(ctx())
    assert.deepEqual(T.filas[1], ['Previsión de evacuación', '30 % → 3780 personas'])
    assert.equal(T.filas[2][1], '226.800 L', 'cifras con el formato de la Mesa')
    const D = G.descarga(ctx())
    const refD = mesa.SDe(mesa.rC(capasAC()).categorias, datos.estadosRecursos)
    assert.equal(D.abast, refD.abast)
    assert.equal(D.abast, 2, 'el surtidor NEGADO no descarga')
    assert.equal(D.plazasAlbergue, 450)
    // con la población escrita en el panel manda ésa
    const E2 = G.evacuacion(RT.contexto({ campo: 'g5', vivo: { ...vivo, evacuacion: { poblacion: 1000, pctEvacuar: 50 } } }))
    assert.equal(E2.r.evacuados, 500)
  })
  caso('el eje humanitario que se monta sobre el EPA (y uno que no)', () => {
    const km = G.solapeEPA(ctx())
    assert.ok(km > 10 && km < 13, `km sobre el EPA: ${km}`)
    assert.equal(G.sobreEPA([[-68.5, -16.9], [-68.5, -17.2]], [{ coords: [[-68.3, -16.85], [-68.3, -17.3]] }]), 0)
    assert.ok(G.problemas(ctx()).some((x) => /se monta sobre el EPA en 11,\d km/.test(x)))
  })
  caso('🌱 Apreciación de AC/GM: trae del calco, de las hojas, de la Orden y de las otras secciones', () => {
    const P = G.propuestasAprec(ctx())
    const v = M.armar(APREC, {}, P).valor
    const todo = JSON.stringify(v)
    for (const t of [
      'Mantener el orden público en PUEBLO-X durante la ruptura (FICT.)', // F2·P3 (esencial)
      'No emplear mano de obra civil al norte del río Z (FICT.)', // la Orden
      'La población no interfiere con el ataque nocturno (FICT.)', // F2·P6
      'La previsión de evacuación supone el 30 %',
      'El G-5 de la DIV.MEC.-1 (FICT.) mantiene el orden público',
      'Especial PUEBLO-X (FICT.)',
      '12.600 habitantes en 4 centro(s) poblado(s)',
      'Censo 2024',
      '3780 personas',
      'Faltan 23 albergue(s)',
      'EXPLOTABLE 13, PROTEGIDO 3, NEGADO 2',
      '450 plaza(s) de albergue',
      'Alcaldía PUEBLO-X (FICT.)',
      'Hospital PUEBLO-X (FICT.)',
      'Surtidor PUEBLO-Y (FICT.)',
      'se monta sobre el eje de abastecimiento',
      'BRIG. BL. ROJA (FICT.)',
      'RI-1 «ALFA» (FICT.)',
      'Fase I — RUPTURA (FICT.)',
      'PRPG', // personal (G-1)
      'PCED', // logística (G-4)
      'EPA: 50 km',
      'prioridad de apoyo logístico RI-1 (FICT.)',
      'Juzgado PUEBLO-X (FICT.)', // justicia
      'Banco PUEBLO-Y (FICT.)', // hacienda
      'Son también los abrigos y albergues', // educación
      'Iglesia San Juan (FICT.)', // religión
      'Terminal de buses PUEBLO-X (FICT.)',
      'No circular por la ruta 1 durante el ataque (FICT.)', // F2·P11
      'Bien Prot',
      'Factor determinante',
      'Sí, evacuando el D-1 (FICT.).', // F5·P1
      'CAP N° 1 — ataque por el norte (FICT.)',
      'Un solo eje humanitario (FICT.).',
    ])
      assert.ok(todo.includes(t), `apreciación: falta «${t}»`)
    assert.equal(v.caps.length, 2)
    assert.equal(v.caps[1].desventajas, 'Dos LDS (FICT.).')
    assert.ok(!/🏥|🛒|🚸|🔎/.test(todo), 'sin emojis en lo que va al Word')
    assert.equal(M.armar(APREC, v, P).cambios.length, 0, 'la segunda vez no trae nada (no pisa)')
    const T = G.tablasAprec(ctx())
    assert.deepEqual(Object.keys(T).sort(), ['desplazadosEstimados', 'disponibilidadLocal'])
    const s = M.especificacion(APREC, v, { firma: G.firmaG5(ctx()), tablas: T })
    assert.equal(s.firma, 'EL G-5 DE LA DIV.MEC.-1 (FICT.)')
    assert.equal(s.numero, '01')
    const pob = s.secciones[1].hijos[0].hijos[0].hijos[2]
    assert.equal(pob.titulo, 'Población.')
    assert.equal(pob.hijos[1].tabla.cabecera[0], 'Concepto', 'el cuadro de evacuación va en II.- A.- 1.- c.- 2)')
  })
  caso('🌱 Anexo de AC/GM: población, recursos con su cuadro, evacuación con su cuadro, ejes, bienes protegidos, PC', () => {
    const v = M.armar(ANEXO, {}, G.propuestasAnexo(ctx())).valor
    const todo = JSON.stringify(v)
    for (const t of ['Establecer el apoyo de asuntos civiles y gobierno militar a la operación de la DIV.MEC.-1 (FICT.).', '“1” Calco de AC/GM', 'Instalaciones y equipos de AC/GM desplegados: PC AC/GM', 'Referirse al Anexo de Inteligencia.', '12.600 habitantes', 'Se identificaron 18 recursos clave', 'Faltan 23 albergue(s)', 'Se priorizan los medios CIVILES', 'Eje humanitario 1:', 'No se baten los monumentos culturales, obras de arte, represas y usinas', 'Hospital PUEBLO-X (FICT.)', 'Puesto de Pagaduría', 'agencias humanitarias', 'Referirse al Anexo de Apoyo de Servicio de Combate.', 'PC. de la DIV.MEC.-1 (FICT.): CG. PUEBLO-X.', 'Fase I — RUPTURA (FICT.): enfoque de AC/GM y prioridad de esfuerzo de los equipos: [definir].', 'Conducir la evacuación de 3780 personas por el eje humanitario hasta los Locales de Destino Seguro.'])
      assert.ok(todo.includes(t), `anexo: falta «${t}»`)
    assert.ok(!todo.includes('Bien Prot (Bien cultural protegido) en -17.1500, -68.4500.","instalaciones'), 'el bien protegido no es un equipo de AC/GM')
    const s = M.especificacion(ANEXO, v, { tablas: G.tablasAnexo(ctx()) })
    assert.equal(s.numero, '', 'el número del anexo lo pide el Word')
    assert.equal(s.firma, undefined, 'el anexo lo firma el Comandante (lo arma el formato militar)')
    const rec = s.secciones[1].hijos[1].hijos[2]
    assert.equal(rec.titulo, 'Recursos del área.')
    assert.equal(rec.tabla.filas.at(-1)[0].t, 'TOTAL')
    assert.equal(s.secciones[3].hijos[0].hijos[0].tabla.filas[0][0], 'Población en el área')
  })
  caso('el anexo toma la misión, las hipótesis y el mejor CA de AC/GM de la Apreciación', () => {
    const ap = M.armar(APREC, {}, { campos: { mision: 'MISIÓN DE AC/GM DE LA APRECIACIÓN (FICT.)', mejorCaAC: 'Evacuación anticipada el D-2 (FICT.).' } }).valor
    const P = G.propuestasAnexo(ctx({ ...datos.hojasG.g5, aprecActiva: ap }))
    assert.equal(P.campos.mision, 'MISIÓN DE AC/GM DE LA APRECIACIÓN (FICT.)')
    assert.match(P.campos.concepto, /^Evacuación anticipada el D-2 \(FICT\.\)\./)
  })
  caso('lo que entregaron las otras secciones y el estado del calco (con botones para acostar)', () => {
    const E = G.entregas(ctx())
    assert.deepEqual(E.map((x) => x.de), ['La Orden del escalón superior', 'El G-3', 'El G-1', 'El G-4'])
    assert.ok(G.entregasTexto(ctx()).includes('Se emplea mano de obra civil sólo al sur del río Z (FICT.).'), 'lo del G-1')
    assert.ok(G.entregasTexto(ctx()).includes('Eje Principal de Abastecimiento'), 'lo del G-4')
    const e = G.estadoCalco(ctx())
    for (const t of ['✓ 18 recurso(s) del área (3 clasificados por el G-5)', '✓ 12.600 hab.', '✓ 3780 a evacuar', 'ATENCIÓN: 11,', '✓ Local de Destino Seguro', '✓ 4 bien(es) que no se baten']) assert.ok(e.texto.includes(t), `estado: falta «${t}»`)
    assert.deepEqual(e.botones.map((b) => [b.accion, b.arg]), [['herramienta', 'humanitario'], ['colocar', 'destino_seguro'], ['colocar', 'p_evac_civ'], ['colocar', 'bien_protegido']])
    assert.ok(e.verEnCarta.length >= 7)
  })
  caso('sin capas cargadas: no se rompe, dice qué falta y usa la población escrita en el panel', () => {
    const c = RT.contexto({ campo: 'g5', ctxDoc: { capas: { otra: 1 } }, vivo: { ...vivo, evacuacion: { poblacion: 2000 } } })
    assert.equal(G.inventario(c), null)
    assert.equal(G.poblacion(c), null)
    assert.equal(G.evacuacion(c).r.evacuados, 600)
    assert.match(G.datosCalco(c), /RECURSOS DEL ÁREA: sin capas de infraestructura/)
    assert.match(G.estadoCalco(c).texto, /✗ sin capas de infraestructura · ✗ sin capas de población · ✓ 600 a evacuar/)
    const v = M.armar(APREC, {}, G.propuestasAprec(c)).valor
    assert.ok(M.tiene(APREC, v))
    const vacio = RT.contexto({ campo: 'g5', ctxDoc: { capas: { otra: 2 } }, vivo: { ops: {}, unidades: [], fasesCOA: {}, evacuacion: {}, estadosRecursos: {}, hojasG: {} } })
    assert.equal(G.evacuacion(vacio), null)
    assert.equal(M.armar(ANEXO, {}, G.propuestasAnexo(vacio)).valor.campos.manoObra.length > 0, true, 'la norma de la mano de obra civil siempre')
  })

  // ── LA IA ─────────────────────────────────────────────────────────────────────────
  const pedidoAprec = (v, c = ctx()) =>
    M.pedido(APREC, v, {
      encabezado: 'Sos OFICIAL DE ESTADO MAYOR (prueba).',
      expediente: '# EXPEDIENTE DEL EJERCICIO — MESA DEL ESTADO MAYOR\n13 · DOCUMENTOS APORTADOS POR EL OFICIAL\nANEXO DE AC/GM DEL I CE (FICT.). Los Locales de Destino Seguro del CE están en PUEBLO-Z (FICT.).',
      seccion: G5.seccionIA,
      producto: G5.documentos.aprecActiva.producto(c, { num: 'F1·P3', id: 'aprecActiva' }),
      bloques: [{ titulo: `LO QUE LA MESA YA CALCULÓ Y TIENE EN EL CALCO PARA ${G5.nombre.toUpperCase()}`, texto: G5.datosCalco(c) }, { titulo: 'LO QUE YA ENTREGARON LAS OTRAS SECCIONES', texto: G5.entregasTexto(c) }, { titulo: `LO QUE YA DICEN TUS OTRAS HOJAS (${G5.nombre})`, texto: G5.otrasHojas(c, ['aprecActiva']) }],
      doctrina: G5.doctrina(),
      ideasQue: G5.documentos.aprecActiva.ideasQue,
      verificacion: G5.documentos.aprecActiva.verificacion,
      fasesCOA: G.nombresFases(c),
    })
  caso('pedido de la Apreciación: expediente, documentos aportados, lo calculado, lo entregado, doctrina, formato, ideas y JSON', () => {
    const v = { ...M.normalizar(APREC, {}), ideas: 'Lo crítico es la evacuación de PUEBLO-X en la fase I (FICT.).' }
    const p = pedidoAprec(v)
    assert.ok(p.ok)
    for (const t of ['Sos OFICIAL DE ESTADO MAYOR', 'SECCIÓN V — ASUNTOS CIVILES Y GOBIERNO MILITAR (G-5)', 'DOCUMENTOS APORTADOS POR EL OFICIAL', 'Los Locales de Destino Seguro del CE están en PUEBLO-Z', 'LO QUE LA MESA YA CALCULÓ Y TIENE EN EL CALCO PARA G-5 ASUNTOS CIVILES / GM', 'POBLACIÓN (capas de centros poblados y Censo 2024)', 'RECURSOS DEL ÁREA', 'LO QUE SE DESCARGA AL G-4', 'EVACUACIÓN (panel', 'EJES HUMANITARIOS', 'PROBLEMAS QUE MIDE LA MESA', 'LO QUE YA ENTREGARON LAS OTRAS SECCIONES', 'El G-1:', 'F2·P3 Tareas de AC/GM', 'F2·P11 Temas y mensajes', 'F5·P1 Ventajas', 'DOCTRINA Y REGLAMENTOS', 'Modelo de Apreciación de Situación de AC/GM', 'secuencia de planeamiento de AC/GM', 'IV Convenio de Ginebra', 'La Haya 1954', 'PA I, art. 56', 'EL FORMATO DEL DOCUMENTO — APRECIACIÓN DE SITUACIÓN DE AC/GM', 'modelo de apreciación de AC/GM', 'I.- MISIÓN.', '2) Número estimado de refugiados', '"campos"."desplazadosEstimados"', 'Estimar el número de refugiados, evacuados y personal desplazado del área.', 'III.- ANÁLISIS.', 'necesidades, disponibilidades, limitaciones y recomendaciones', '"caps"[]."ventajas"', 'Lo crítico es la evacuación de PUEBLO-X', 'VERIFICACIÓN FINAL', 'SIN DATO — verificar'])
      assert.ok(p.prompt.includes(t), `pedido: falta «${t}»`)
    assert.ok(p.prompt.indexOf('EL FORMATO DEL DOCUMENTO') < p.prompt.indexOf('CÓMO LO QUIERE EL OFICIAL'), 'las ideas van después del formato')
    assert.ok(p.prompt.lastIndexOf('# FORMATO DE TU RESPUESTA') > p.prompt.lastIndexOf('# CÓMO CONTESTAR'), 'cómo contestar va al final')
    assert.ok(!/"fases"/.test(p.prompt), 'el modelo no analiza por fase')
  })
  caso('respuesta de la IA en JSON: sólo completar no pisa; CAP por nombre; CAP nuevo; marcas; mejorar reescribe', () => {
    const base = M.armar(APREC, {}, G.propuestasAprec(ctx())).valor
    const r = M.aplicarRespuesta(APREC, '```json\n' + JSON.stringify(respuestaAprec()) + '\n```', base, { modo: 'completar' })
    assert.ok(r.ok, r.error)
    assert.equal(r.valor.campos.objeto, base.campos.objeto)
    assert.equal(r.valor.campos.mision, base.campos.mision)
    assert.match(r.valor.campos.mejorCap, /es el mejor apoyado: un solo eje humanitario/)
    assert.match(r.valor.campos.terrenoEfectosEnemigo, /punto fuerte entre la población/)
    assert.equal(r.valor.campos.saludPublica, base.campos.saludPublica, 'la salud pública ya la traía el calco: no se pisa')
    assert.equal(r.valor.caps.length, 3, 'el CAP N° 3 nuevo')
    assert.equal(r.valor.caps[1].ventajas, 'No toca PUEBLO-X (FICT.).', 'el CAP N° 2 por su nombre, sin pisar')
    assert.equal(r.valor.caps[2].ventajas, 'Evita PUEBLO-Y (FICT.).')
    assert.ok(r.valor.iaCampos.includes('campo:mejorCap'))
    assert.ok(r.valor.iaCampos.includes(`cap:${r.valor.caps[2].id}:ventajas`))
    const m = M.aplicarRespuesta(APREC, JSON.stringify(respuestaAprec()), base, { modo: 'completar_mejorar' })
    assert.equal(m.valor.campos.mision, 'Texto de la IA que NO debe pisar la misión de AC/GM.', 'mejorar sí reescribe')
    assert.equal(M.aplicarRespuesta(APREC, 'no es JSON', base).ok, false)
  })
  const prosa = fs.readFileSync(path.join(__dirname, 'respuesta-prosa-g5.md'), 'utf8')
  caso('la IA escribió la APRECIACIÓN como documento (Markdown, I.- A.- 1.- a.- 1), negritas, viñetas): cada parte cae en su apartado', () => {
    const base = M.armar(APREC, {}, G.propuestasAprec(ctx())).valor
    const r = M.aplicarRespuesta(APREC, prosa, base, { modo: 'completar_mejorar' })
    assert.ok(r.ok, r.error)
    assert.equal(r.como, 'documento')
    const c = r.valor.campos
    assert.equal(c.tareasEsp, '- Evacuar la población civil de PUEBLO-X hasta el D-1.')
    assert.equal(c.tareasImp, '1. Clasificar los recursos del área.\n2. Establecer el eje humanitario fuera del EPA.')
    assert.equal(c.tareasEse, 'Mantener el orden público en PUEBLO-X.')
    assert.equal(c.limitaciones, 'No batir la represa de PUEBLO-W.')
    assert.match(c.mision, /^El G-5 de la DIV.MEC.-1 mantiene el orden público/)
    assert.equal(c.ccmm, 'Heladas nocturnas que afectan a los evacuados.')
    assert.equal(c.terrenoDescripcion, 'altiplano con cuatro centros poblados.')
    assert.equal(c.terrenoEfectosAC, 'La ruta 2 es la única apta para la evacuación.')
    assert.equal(c.desplazadosEstimados, '3780 evacuados.', 'la instrucción repetida como título no entra en el texto')
    assert.equal(c.gobiernoCivil, 'La alcaldía de PUEBLO-X funciona y coopera.')
    assert.equal(c.enDispositivo, 'La BRIG. BL. ROJA al norte de PUEBLO-X.')
    assert.equal(c.enemigoCA, 'Defender PUEBLO-X entre la población.')
    assert.equal(c.capsPropios, 'Dos CAP en tres fases.')
    assert.equal(c.acProblemas, 'faltan 23 albergues.')
    assert.equal(c.hipotesis, '- La población coopera con la evacuación.')
    assert.equal(c.escOcupacion, 'No corresponde en esta operación.')
    assert.equal(c.saludPublica, 'El Hospital PUEBLO-X queda PROTEGIDO.')
    assert.equal(c.desplazados, '3780 evacuados por la ruta 2.')
    assert.equal(c.bellasArtes, 'La Iglesia San Juan no se bate.')
    assert.equal(c.problemas, 'Faltan albergues; el eje toca el EPA.')
    assert.equal(c.caComparacion, 'El CA de AC/GM N° 1 (evacuación anticipada) es mejor en el factor albergue.', '«1.-» sin título: por su orden')
    assert.equal(c.factibilidad, 'La misión PUEDE ser apoyada desde el punto de vista de AC/GM.')
    assert.equal(c.mejorCap, 'El CAP N° 1 es el mejor apoyado.')
    assert.equal(c.mejorCaAC, 'El mejor curso de acción de AC/GM es la evacuación anticipada el D-2.')
    assert.equal(c.recomendaciones, '1. COORDINAR con el G-4 la separación del eje humanitario del EPA.\n2. HABILITAR el Coliseo PUEBLO-Z como Local de Destino Seguro.')
    assert.ok(!/\*\*/.test(JSON.stringify(c)), 'sin las negritas de Markdown')
    assert.equal(r.valor.caps.length, 2, 'los dos CAP, sin duplicar')
    const [c1, c2] = r.valor.caps
    assert.equal(c1.id, base.caps[0].id, 'el CAP N° 1 es el mismo')
    assert.equal(c1.ventajas, 'un solo eje humanitario.', '«- **Ventajas:**» como viñeta')
    assert.equal(c1.desventajas, 'atraviesa PUEBLO-X.')
    assert.equal(c2.ventajas, 'no toca PUEBLO-X.')
    assert.equal(c2.desventajas, 'dos Locales de Destino Seguro.')
  })
  caso('«Sólo completar» con el documento escrito tampoco pisa', () => {
    const base = M.armar(APREC, {}, G.propuestasAprec(ctx())).valor
    const r = M.aplicarRespuesta(APREC, prosa, base, { modo: 'completar' })
    assert.ok(r.ok, r.error)
    assert.equal(r.valor.campos.objeto, base.campos.objeto)
    assert.equal(r.valor.campos.desplazadosEstimados, base.campos.desplazadosEstimados)
    assert.equal(r.valor.campos.ccmm, 'Heladas nocturnas que afectan a los evacuados.')
    assert.equal(r.valor.caps[0].ventajas, 'Un solo eje humanitario (FICT.).', 'lo de la F5·P1 queda')
  })
  caso('la IA escribió el ANEXO como documento: el texto propio de «B.- Fuerzas propias.» y de «A.- Concepto de Apoyo.»', () => {
    const r = M.aplicarRespuesta(ANEXO, PROSA_ANEXO, {}, { modo: 'completar' })
    assert.ok(r.ok, r.error)
    assert.equal(r.como, 'documento')
    const c = r.valor.campos
    assert.equal(c.orgTarea, 'Sección de AC de la DIV (FICT.) con cuatro equipos funcionales.')
    assert.equal(c.enemigo, 'Referirse al Anexo de Inteligencia.')
    assert.equal(c.fuerzasPropias, 'La población del área es de 12.600 habitantes (FICT.).')
    assert.equal(c.actitud, 'Coopera con la DIV (FICT.).')
    assert.equal(c.recursosArea, '18 recursos identificados (FICT.).')
    assert.equal(c.hipotesis, 'La población no interfiere (FICT.).')
    assert.match(c.mision, /^El G-5 de la DIV.MEC.-1 conduce la evacuación/)
    assert.equal(c.concepto, 'Prioridad de esfuerzo a Servicios Especiales en la fase I (FICT.).')
    assert.equal(c.evacuacion, '3780 personas (FICT.).')
    assert.equal(c.ejes, 'Eje 1 por la ruta 4 (FICT.).')
    assert.equal(c.instalaciones, 'LDS en el Coliseo PUEBLO-Z (FICT.).')
    assert.equal(c.tareaGobierno, 'Enlace con la alcaldía (FICT.).')
    assert.equal(c.toqueQueda, 'De 2000 a 0600 (FICT.).')
    assert.equal(c.apoyoServicio, 'Referirse al Anexo de Apoyo de Servicio de Combate (FICT.).')
    assert.equal(c.comando, 'PC en PUEBLO-X (FICT.).')
    assert.equal(c.comunicaciones, 'IOC. N° 2 (FICT.).')
  })
  caso('respuesta del anexo en JSON, JSON roto y JSON cortado', () => {
    const base = M.armar(ANEXO, {}, G.propuestasAnexo(ctx())).valor
    const r = M.aplicarRespuesta(ANEXO, JSON.stringify(respuestaAnexo()), base)
    assert.ok(r.ok, r.error)
    assert.equal(r.valor.campos.toqueQueda, 'Toque de queda en PUEBLO-X de 2000 a 0600 desde el D-1 (FICT.).')
    assert.match(M.textoDe(ANEXO, r.valor), /^ANEXO \(ASUNTOS CIVILES Y GOBIERNO MILITAR\)/)
    const roto = M.aplicarRespuesta(ANEXO, 'Acá va:\n```json\n{ "campos": { "actitud": "Coopera\ncon la DIV", “enlace”: “Con la alcaldía”, }, }\n```', {}, {})
    assert.ok(roto.ok, roto.error)
    assert.equal(roto.como, 'json-reparado')
    assert.equal(roto.valor.campos.actitud, 'Coopera\ncon la DIV')
    assert.equal(roto.valor.campos.enlace, 'Con la alcaldía')
    const cortado = M.aplicarRespuesta(ANEXO, '```json\n{ "campos": { "toqueQueda": "De 2000 a 0600 (FICT.).", "comando": "PC en PUEBLO-X", "comunicaciones": "IOC N', {}, {})
    assert.ok(cortado.ok, cortado.error)
    assert.equal(cortado.como, 'fragmentos')
    assert.equal(cortado.valor.campos.comando, 'PC en PUEBLO-X')
  })
  caso('pedido del anexo: la estructura de la Mesa, los cuadros y el texto propio de los apartados', () => {
    const c = ctx()
    const p = M.pedido(ANEXO, {}, { seccion: G5.seccionIA, producto: G5.documentos.anexo.producto(c, { num: 'F7·P1' }), doctrina: G5.doctrina(), verificacion: G5.documentos.anexo.verificacion, bloques: [{ titulo: 'LO QUE YA DICEN TUS OTRAS HOJAS', texto: G5.otrasHojas(c, ['anexo']) }] })
    for (const t of ['ANEXO DE ASUNTOS CIVILES Y GOBIERNO MILITAR', 'La Escuela no tiene modelo de anexo del G-5', 'Organización de la Tarea.', 'B.- Fuerzas propias.  →  "campos"."fuerzasPropias" (su texto propio', '"campos"."toqueQueda"', 'Los cuadros de recursos y de evacuación los pone la Mesa', '¿Los ejes humanitarios van fuera del EPA?']) assert.ok(p.prompt.includes(t), `pedido del anexo: falta «${t}»`)
  })

  // ── LAS HOJAS DE TRABAJO DE SIEMPRE ───────────────────────────────────────────────
  const { SIDuN0, Nx } = cargar(VIGENTE, ['SIDuN0', 'Nx'])
  const HOJAS = SIDuN0(Nx.g5).flatMap((f) => f.hojas)
  const hoja = (id) => JSON.parse(JSON.stringify(HOJAS.find((h) => h.id === id)))
  caso('TODAS las hojas del G-5 tienen guía; las de siempre, su 🌱; la IA recibe la guía con la doctrina', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(HOJAS.map((h) => h.id))), ['aprecActiva', 'tareas', 'limitaciones', 'hechos', 'rcic', 'temas', 'aprecOrientacion', 'potencia', 'decision', 'riesgo', 'anexo'])
    for (const h of HOJAS) {
      const g = R.guiaHoja('g5', h)
      assert.ok(g?.para && g.como?.length && g.ejemplo, `guía de ${h.id}`)
      if (['remite'].includes(h.tipo)) continue
      assert.ok(R.tieneSemilla('g5', h), `🌱 de ${h.id}`)
      assert.ok(R.guiaIA('g5', h).como.some((x) => /ASUNTOS CIVILES/.test(x) && /DICA/.test(x)))
    }
    assert.match(R.guiaHoja('g1', { id: 'tareas' }).para, /campo de personal/, 'el G-1 no cambia')
    assert.equal(R.guiaHoja('g4', { id: 'tareas' }), null, 'el G-4 no cambia')
    assert.ok(G5.sinNadaHoja.includes('eje humanitario'))
  })
  caso('🌱 F2·P3 tareas y F2·P5 limitaciones: de la Orden y del calco, sin duplicar', () => {
    const h = hoja('tareas')
    const r = R.sembrarHoja('g5', h, datos.hojasG.g5.tareas, ctx())
    assert.equal(r.n, 5, 'la de la Orden y cuatro del calco (el eje ya está trazado y todos los recursos tienen clasificación)')
    const ts = r.valor.map((f) => f.Tarea).join('\n')
    for (const t of ['Mantener el orden público en PUEBLO-X durante la ruptura (FICT.)', 'Evacuar la población civil de PUEBLO-X (FICT.) hasta el D-1', 'Evacuar 3780 personas por medios civiles hasta los Locales de Destino Seguro', 'Coordinar con el G-4 la descarga', 'Señalar los 4 bienes que no se baten', 'Establecer el enlace con las autoridades del área (4 sedes identificadas)']) assert.ok(ts.includes(t), `tareas: falta «${t}»`)
    assert.ok(!ts.includes('Establecer el eje humanitario fuera del EPA'), 'el eje ya está trazado')
    assert.equal(R.sembrarHoja('g5', h, r.valor, ctx()).n, 0, 'la segunda vez no duplica')
    const l = R.sembrarHoja('g5', hoja('limitaciones'), [], ctx())
    const ls = l.valor.map((f) => `${f.Limitación} | ${f.Tipo} | ${f.Origen}`).join('\n')
    for (const t of ['No emplear mano de obra civil al norte del río Z (FICT.) | Prohibición', 'No batir la represa de PUEBLO-W (FICT.) | Prohibición', 'No batir los 4 bienes protegidos', 'DICA (La Haya 1954; PA I, arts. 53 y 56)', 'No encaminar la evacuación por el EPA']) assert.ok(ls.includes(t), `limitaciones: falta «${t}»`)
  })
  caso('🌱 F2·P6, F2·P8, F2·P11, F3·P1, F5·P1 y F6·P3', () => {
    const he = R.sembrarHoja('g5', hoja('hechos'), datos.hojasG.g5.hechos, ctx())
    assert.equal(he.valor.a[0], 'La alcaldía de PUEBLO-X coopera con la DIV (FICT.)', 'no toca lo que estaba')
    assert.ok(he.valor.a.some((x) => /12\.600 habitantes/.test(x) && !/Los más poblados/.test(x)))
    assert.ok(he.valor.a.some((x) => /EXPLOTABLE 13/.test(x)))
    assert.ok(he.valor.b.some((x) => /Se evacua el 30 %.*confirman: autoridades municipales y G-2/.test(x)))
    assert.ok(he.valor.b.some((x) => /2 centro\(s\) poblado\(s\) sin dato del Censo \(1400 hab\.\)/.test(x)))
    const rc = R.sembrarHoja('g5', hoja('rcic'), [], ctx())
    assert.ok(rc.valor.some((f) => /^RCIC: ¿cuántos civiles se desplazan/.test(f.Requerimiento) && /Antes de la Fase I — RUPTURA/.test(f['Para cuándo'])))
    assert.ok(rc.valor.some((f) => /^EEIA:/.test(f.Requerimiento)))
    const te = R.sembrarHoja('g5', hoja('temas'), datos.hojasG.g5.temas, ctx())
    assert.equal(te.valor[0]['Tema o mensaje'], 'No circular por la ruta 1 durante el ataque (FICT.)')
    assert.ok(te.valor.some((f) => /^Evacuación ordenada: reunirse en el P Reu Evac/.test(f['Tema o mensaje']) && /hasta el LDS/.test(f['Tema o mensaje']) && /Radio|medio\(s\) de comunicación/.test(f['Por qué medio'])))
    assert.ok(te.valor.some((f) => /Distribución de agua, medicina/.test(f['Tema o mensaje'])))
    const h3 = hoja('potencia')
    const po = R.sembrarHoja('g5', h3, { [h3.campos[0]]: 'Del oficial.' }, ctx())
    assert.equal(po.valor[h3.campos[0]], 'Del oficial.')
    assert.match(po.valor[h3.campos[1]], /^3780 evacuados previstos que hay que sacar del área de operaciones; el eje humanitario se monta 11,\d km sobre el EPA; 4 bien\(es\) que no se baten/)
    const ri = R.sembrarHoja('g5', hoja('riesgo'), [], ctx())
    assert.ok(ri.valor.some((f) => /Columna de evacuados sobre el EPA/.test(f.Riesgo)))
    assert.ok(ri.valor.some((f) => /Evacuados sin albergue/.test(f.Riesgo)))
    assert.ok(ri.valor.some((f) => /Daño colateral a 4 bien/.test(f.Riesgo)))
    const ap = M.aplicarRespuesta(APREC, prosa, M.normalizar(APREC, {}), { modo: 'completar' }).valor
    const de = R.sembrarHoja('g5', hoja('decision'), [], ctx({ aprecActiva: ap }))
    assert.equal(de.valor.length, 2)
    assert.equal(de.valor[0].Ventajas, 'un solo eje humanitario.')
  })
  caso('pedido de una hoja de trabajo: suma lo calculado, lo entregado y la doctrina antes de «CÓMO CONTESTAR»', () => {
    const r = R.pedidoHoja('g5', hoja('temas'), { ok: true, prompt: 'A\n\n---\n\n# CÓMO CONTESTAR\n\nJSON' })
    const i = r.prompt.indexOf('# CÓMO CONTESTAR')
    for (const t of ['LO QUE LA MESA YA CALCULÓ Y TIENE EN EL CALCO PARA G-5 ASUNTOS CIVILES / GM', 'POBLACIÓN', 'EVACUACIÓN', 'LO QUE YA ENTREGARON LAS OTRAS SECCIONES', 'DOCTRINA Y REGLAMENTOS DEL CAMPO (G-5 Asuntos Civiles / GM)']) assert.ok(r.prompt.indexOf(t) >= 0 && r.prompt.indexOf(t) < i, `pedido de hoja: «${t}»`)
    // (v4) cómo contestar va AL FINAL, con la cabecera exacta de la tabla
    const f = r.prompt.lastIndexOf('# FORMATO DE TU RESPUESTA')
    assert.ok(f > i, 'el formato va después de «CÓMO CONTESTAR»')
    assert.ok(r.prompt.slice(f).includes('| Tema o mensaje | A quién va dirigido | Por qué medio | Cuándo |'))
    const g = R.guiaIA('g5', hoja('temas'))
    assert.match(g.para, /SE DIFUNDE/)
  })

  // ── EL REGISTRO Y EL COMPILADO ────────────────────────────────────────────────────
  caso('con las hojas REALES del compilado: la F1·P3, la F2·P13 y la F7·P1 del G-5 pasan a documentos; las demás no cambian', () => {
    const fases = R.fasesConDocumentos(Nx.g5, SIDuN0(Nx.g5))
    const hs = fases.flatMap((f) => f.hojas)
    const tipo = (id) => hs.find((h) => h.id === id).tipo
    for (const id of ['aprecActiva', 'aprecOrientacion', 'anexo']) assert.equal(tipo(id), 'docEM', id)
    for (const [id, t] of [['tareas', 'filas'], ['limitaciones', 'filas'], ['hechos', 'dosListas'], ['rcic', 'filas'], ['temas', 'filas'], ['potencia', 'campos'], ['decision', 'filas'], ['riesgo', 'filas']]) assert.equal(tipo(id), t, id)
    const ap = hs.find((h) => h.id === 'aprecActiva')
    assert.equal(ap.nom, 'Apreciación Activa de AC/GM')
    assert.match(ap.nota, /se trabaja acá/)
    assert.ok(!hs.some((h) => /se baja/.test(h.nota || '')), 'ninguna «se baja hecha»')
    assert.ok(R.esDocumento(ap))
    assert.equal(R.tieneDocumento(ap, { esquema: 'aprec-acgm-v1', campos: { mision: 'x' } }), true)
    assert.equal(R.tieneDocumento(ap, { esquema: 'aprec-acgm-v1' }), false)
    assert.equal(R.tieneDocumento(ap, { esquema: 'aprec-personal-v1', campos: { mision: 'x' } }), false, 'otro esquema no cuenta')
    const g1 = R.fasesConDocumentos(Nx.g1, SIDuN0(Nx.g1)).flatMap((f) => f.hojas)
    assert.equal(g1.find((h) => h.id === 'anexo').tipo, 'docEM', 'el G-1 sigue igual')
    assert.equal(R.fasesConDocumentos(Nx.g4, SIDuN0(Nx.g4)).flatMap((f) => f.hojas).find((h) => h.id === 'aprecActiva').tipo, 'aprecLog', 'el G-4 no cambia')
  })
  const lista = require('./reemplazos-2026-10-03-g5.js')
  const ANTERIOR = path.join(RAIZ, 'assets', 'index-lector-20261003.js')
  const NUEVO = path.join(RAIZ, 'assets', 'index-g5-20261003.js')
  caso('los reemplazos del compilado: cada uno una vez, y el vigente los conserva', () => {
    const viejo = fs.readFileSync(ANTERIOR, 'utf8')
    const nuevo = fs.readFileSync(NUEVO, 'utf8')
    for (const r of lista) {
      assert.equal(viejo.split(r.viejo).length - 1, r.veces, r.nombre)
      assert.equal(nuevo.split(r.nuevo).length - 1, r.veces, r.nombre)
    }
    const vig = fs.readFileSync(VIGENTE, 'utf8')
    for (const r of lista) if (!/\.\.\/estado-mayor\/v\d\//.test(r.nuevo)) assert.ok(vig.includes(r.nuevo), `el vigente conserva: ${r.nombre}`)
    assert.equal((nuevo.match(/"\.\.\/estado-mayor\/v3\//g) || []).length, 3, 'los 3 imports del motor van a la v3')
    assert.ok(!nuevo.includes('"../estado-mayor/v2/'), 'ninguno queda en la v2')
    // lo que el efecto y el segundo configurarEM le pasan al motor existe en el compilado
    const decl = cargar(NUEVO, ['rC', 'mP', 'fN', 'SDe', 'LU'])
    for (const k of ['rC', 'mP', 'fN', 'SDe']) assert.equal(typeof decl[k], 'function', k)
    assert.ok(Array.isArray(decl.LU))
    assert.match(nuevo, /\[ve,_e\]=je\.useState\(\{\}\)[\s\S]*SIDEMcapas=je\.useEffect\(\(\)=>\{SIDEMExtra\(\{capas:ve\}\)\},\[ve\]\)/, 'las capas se declaran antes del efecto')
    assert.match(nuevo, /f\.jsx\(CDe,\{aporteIA:[\s\S]{0,300}?\},capas:ve,/, 'son las mismas capas que recibe el panel del G-5')
  })
  caso('ningún gancho cae DENTRO de lo que insertaron las listas anteriores (salvo la versión de la carpeta del motor)', () => {
    const viejo = fs.readFileSync(ANTERIOR, 'utf8')
    const nuevo = fs.readFileSync(NUEVO, 'utf8')
    let n = 0
    const rotos = []
    for (const f of fs.readdirSync(__dirname)) {
      let l = null
      if (/^reemplazos-.*\.js$/.test(f) && !['reemplazos-compilado.js', 'reemplazos-2026-10-03-g5.js'].includes(f)) l = require(path.join(__dirname, f))
      else if (/^reemplazos-.*\.json$/.test(f)) l = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')).reemplazos
      for (const r of l || []) {
        if (!r.nuevo || !viejo.includes(r.nuevo)) continue
        n++
        if (!nuevo.includes(r.nuevo) && !/\.\.\/estado-mayor\/v\d\//.test(r.nuevo)) rotos.push(`${f}: ${r.nombre || r.nuevo.slice(0, 80)}`)
      }
    }
    assert.ok(n > 100, `se revisaron ${n}`)
    assert.deepEqual(rotos, [])
  })
  caso('el G-1 de la v3 es el mismo de la v2 (sólo cambió el motor)', () => {
    assert.equal(fs.readFileSync(path.join(RAIZ, 'estado-mayor/v3/campos/g1.js'), 'utf8'), fs.readFileSync(path.join(RAIZ, 'estado-mayor/v2/campos/g1.js'), 'utf8'))
  })

  for (const [nombre, f] of casos) {
    try {
      await f()
      console.log(`✓ ${nombre}`)
    } catch (e) {
      fallos++
      console.error(`✗ ${nombre}\n  ${e.message}`)
    }
  }
  console.log(fallos ? `${fallos} FALLO(S)` : `OK — ${casos.length} casos`)
  process.exit(fallos ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
