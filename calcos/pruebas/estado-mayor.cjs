// Pruebas del motor de documentos de Estado Mayor (calcos/estado-mayor/vN, la carpeta que
// importa el compilado vigente: hoy v3) con el G-1:
//   · la FORMA: la Apreciación y el Anexo de Personal tienen todos los apartados de los
//     modelos de la Escuela que están en el catálogo del formato militar, en orden;
//   · el MOTOR: normalizar, 🌱 sin pisar, partir de la F1·P3, revisión, texto, Word
//     (especificación con la numeración del modelo) y vista previa;
//   · el G-1 con un ejercicio FICTICIO y la cuenta REAL de bajas de la Mesa (iC, sacada
//     del compilado): lo que trae del calco, de las hojas y de las otras secciones;
//   · la IA: el pedido (expediente, lo calculado, lo entregado, doctrina, formato, ideas,
//     JSON) y la respuesta (sólo completar no pisa; mejorar reescribe; CAP por nombre y
//     fases);
//   · las hojas de trabajo de siempre: guía, 🌱 sin duplicar, pedido con la doctrina;
//   · los reemplazos del compilado: cada uno una sola vez y reversibles.
//
//   node estado-mayor.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { cargarConDependencias } = require('./extraer-con-dependencias')
const { ejercicioPersonal, respuestaAprec, respuestaAnexo } = require('./personal-ejemplo.js')

const RAIZ = path.join(__dirname, '..')
const url = (p) => 'file://' + path.join(RAIZ, p)
let fallos = 0
const casos = []
const caso = (nombre, f) => casos.push([nombre, f])

;(async () => {
  // la carpeta del motor que importa el compilado que carga calcos/index.html
  const vig0 = path.join(RAIZ, fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8').match(/\.\/(assets\/index-[\w-]+\.js)/)[1])
  const V = (fs.readFileSync(vig0, 'utf8').match(/"\.\.\/estado-mayor\/(v\d+)\/registro\.js"/) || [])[1] || 'v2'
  console.log(`motor: calcos/estado-mayor/${V}`)
  const M = await import(url(`estado-mayor/${V}/motor.js`))
  const G = await import(url(`estado-mayor/${V}/campos/g1.js`))
  const R = await import(url(`estado-mayor/${V}/registro.js`))
  const RT = await import(url(`estado-mayor/${V}/runtime.js`))
  const { catalogo } = await import(url('formato-militar/v1/catalogo.js'))
  const G1 = G.default
  const { APREC, ANEXO } = G

  // La cuenta de bajas y el resumen del G-2, TEXTUALES del compilado.
  const compilado = path.join(RAIZ, 'assets', 'index-logistica-20261002.js')
  const mesa = cargarConDependencias(compilado, ['iC', 'voe'], (c) => c.iC({ efectivo: 100 }))
  const datos = ejercicioPersonal()
  const vivo = { ops: datos.ops, unidades: datos.unidades, fasesCOA: datos.fasesCOA, bajasPorFase: datos.bajasPorFase, conceptoApoyo: [], misionLog: '', estadosRecursos: {}, evacuacion: {}, orgTarea: [], ordenSup: datos.ordenSup, hojasG: datos.hojasG, g3: {}, picb: {} }
  const INST = { p_ppgg: { abrev: 'PPGG', nom: 'Puesto de PP.GG.' }, dpg: { abrev: 'DPG', nom: 'Depósito de PP.GG.' }, pce: { abrev: 'PCE', nom: 'Puesto de Control de Extraviados' }, a_descanso: { abrev: 'A. DESC.', nom: 'Área de Descanso' }, prm: { abrev: 'PRM', nom: 'Puesto de Reunión de Muertos' }, p_reu_reempl: { abrev: 'PRR', nom: 'Puesto de Reunión de Reemplazos' } }
  RT.configurarEM({ catalogo: (id) => INST[id] || null, bajas: mesa.iC, resumenG2: mesa.voe })
  RT.sincronizarEM(vivo)
  const ctx = (hojas = datos.hojasG.g1) => RT.contexto({ campo: 'g1', hojas, ctxDoc: { unidad: 'DIV.MEC.-1 (FICT.)', ordenSup: datos.ordenSup } })

  // ── LA FORMA ──────────────────────────────────────────────────────────────────────
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  function secuencia(def) {
    const out = []
    const rec = (ns) => {
      for (const n of ns) {
        if (n.caps) {
          out.push({ t: 'CAP. No. 1', cap: true }, { t: 'Fase 1 – Fase 2', cap: true })
          for (const x of [...(def.cap?.porCap || []), ...(def.cap?.porFase || [])]) out.push({ t: x.t, ayuda: x.ayuda || '', cap: true })
          continue
        }
        out.push({ t: n.t, ayuda: n.ayuda || '' })
        if (n.hijos) rec(n.hijos)
      }
    }
    rec(def.arbol)
    return out
  }
  function fiel(def) {
    const sec = secuencia(def)
    const faltan = []
    let j = 0
    for (const a of catalogo[def.plantilla].apartados) {
      const m = norm(a.titulo)
      const k = sec.findIndex((x, i) => i >= j && (norm(x.t) === m || norm(x.t).startsWith(m) || m.startsWith(norm(x.t)) || (x.ayuda && norm(x.ayuda).includes(m.slice(0, 60)))))
      // el modelo repite «Mantenimiento del efectivo de la Unidad.» después del CAP N° 1 (el
      // CAP N° 2…): lo cubre el mismo análisis por CAP.
      const kRep = k < 0 ? sec.findIndex((x) => x.cap && norm(x.t) === m) : -1
      if (k < 0 && kRep < 0) faltan.push(a.titulo)
      else if (k >= 0) j = k + 1
    }
    return faltan
  }
  caso('la Apreciación de Personal tiene TODOS los apartados del modelo de la Escuela, en orden', () => {
    assert.deepEqual(fiel(APREC), [])
    assert.deepEqual(catalogo[APREC.plantilla].rotulos, APREC.preliminares.map((p) => p.t))
  })
  caso('el Anexo de Personal tiene TODOS los apartados del modelo de Plan de Personal, en orden', () => {
    assert.deepEqual(fiel(ANEXO), [])
    assert.deepEqual(catalogo[ANEXO.plantilla].rotulos, ANEXO.preliminares.map((p) => p.t))
  })
  caso('los ids de los campos no se repiten', () => {
    for (const def of [APREC, ANEXO]) {
      const ids = M.camposDe(def).map((c) => c.id)
      assert.equal(new Set(ids).size, ids.length, def.titulo)
    }
  })

  // ── EL MOTOR ──────────────────────────────────────────────────────────────────────
  caso('normalizar: vacío con dos CAP y una fase cada uno; resumen', () => {
    const v = M.normalizar(APREC, null)
    assert.equal(v.esquema, 'aprec-personal-v1')
    assert.equal(v.caps.length, 2)
    assert.equal(v.caps[0].fases.length, 1)
    assert.equal(M.tiene(APREC, v), false)
    assert.match(M.resumen(APREC, v), /^0 de 40 apartados · 2 CAP$/)
  })
  caso('🌱 armar no pisa lo escrito y pone las fases del COA', () => {
    const v0 = { ...M.normalizar(APREC, {}), campos: { ...M.normalizar(APREC, {}).campos, objeto: 'Lo escribió el oficial.' } }
    const r = M.armar(APREC, v0, { campos: { objeto: 'NO', recursos: 'Efectivo X.' }, fases: ['RUPTURA', 'EXPLOTACIÓN'], caps: [{ nombre: 'CAP A', fases: [{ valores: { mantenimiento: 'Bajas F1' } }] }] })
    assert.equal(r.valor.campos.objeto, 'Lo escribió el oficial.')
    assert.equal(r.valor.campos.recursos, 'Efectivo X.')
    assert.equal(r.valor.caps[0].nombre, 'CAP A')
    assert.equal(r.valor.caps[0].fases.length, 2)
    assert.equal(r.valor.caps[0].fases[0].nombre, 'Fase I — RUPTURA')
    assert.equal(r.valor.caps[0].fases[0].valores.mantenimiento, 'Bajas F1')
    assert.ok(r.cambios.includes('Recursos'))
    const r2 = M.armar(APREC, r.valor, { campos: { recursos: 'Otro' } })
    assert.equal(r2.cambios.length, 0, 'la segunda vez no trae nada')
  })
  caso('partir de la F1·P3 sin pisar', () => {
    const base = M.armar(APREC, {}, { campos: { mision: 'Misión F1', hipotesis: 'Hip F1' } }).valor
    const v = M.armar(APREC, {}, { campos: { mision: 'Misión F2' } }).valor
    const p = M.partirDe(APREC, v, base)
    assert.equal(p.campos.mision, 'Misión F2')
    assert.equal(p.campos.hipotesis, 'Hip F1')
  })
  caso('Word: la especificación sigue la numeración del modelo (I.- A.- 1.- a.-), con los CAP y las fases', () => {
    const v = M.armar(APREC, {}, { campos: { objeto: 'Obj.', tareasEsp: '- Evacuar PP.GG.\n- Solicitar reemplazos', mision: 'Misión.' }, fases: ['RUPTURA'], caps: [{ nombre: 'CAP N° 1 — norte', fases: [{ valores: { mantenimiento: 'Bajas.' } }], ventajas: 'V1' }] }).valor
    const s = M.especificacion(APREC, v, { firma: 'EL G-1 DE LA DIV (FICT.)' })
    assert.equal(s.estructuraPropia, true)
    assert.equal(s.titulo, 'APRECIACIÓN DE SITUACIÓN DE PERSONAL')
    assert.equal(s.numero, '01')
    assert.deepEqual(s.preliminares.map((p) => p.rotulo), ['OBJETO', 'CARTAS', 'ANEXOS'])
    assert.deepEqual(s.secciones.map((x) => x.titulo), ['MISIÓN.', 'SITUACIÓN Y CONSIDERACIONES DE PERSONAL.', 'ANÁLISIS.', 'COMPARACIÓN.', 'CONCLUSIONES Y RECOMENDACIONES.'])
    const esp = s.secciones[0].hijos[0].hijos[0]
    assert.equal(esp.titulo, 'Específicas.')
    assert.deepEqual(esp.vinetas, ['Evacuar PP.GG.', 'Solicitar reemplazos.'])
    const cap = s.secciones[2].hijos[0]
    assert.equal(cap.titulo, 'CAP N° 1 — norte.')
    assert.equal(cap.hijos[0].titulo, 'Fase I — RUPTURA.')
    assert.deepEqual(cap.hijos[0].hijos.map((x) => x.titulo), ['Mantenimiento del efectivo de la Unidad.', 'Administración de Personal.'])
    assert.equal(cap.hijos[0].hijos[1].texto, M.PENDIENTE)
    assert.equal(s.secciones[3].hijos[1].hijos[0].hijos[0].texto, 'V1')
    assert.equal(s.firma, 'EL G-1 DE LA DIV (FICT.)')
    const html = M.html(APREC, v, { firma: s.firma })
    for (const t of ['I.- MISIÓN.', 'A.- Tareas.', '1.- Específicas.', 'III.- ANÁLISIS.', 'A.- CAP N° 1 — norte.', '1.- Fase I — RUPTURA.', 'a.- Mantenimiento del efectivo de la Unidad.', 'EL G-1 DE LA DIV (FICT.)']) assert.ok(html.includes(t.replace(/«|»/g, '')), `html: falta «${t}»`)
  })
  caso('revisión: lo obligatorio y cada CAP', () => {
    const R1 = M.revisar(APREC, {})
    assert.ok(R1.some((x) => x.tipo === 'err' && /MISIÓN DE PERSONAL/.test(x.txt)))
    assert.ok(R1.some((x) => /CAP N° 1: falta analizarlo fase por fase/.test(x.txt)))
  })

  // ── EL G-1 CON EL EJERCICIO ───────────────────────────────────────────────────────
  caso('bajas por fase: la MISMA cuenta del panel del G-1 (iC del compilado)', () => {
    const B = G.bajasDe(ctx())
    assert.equal(B.fases.length, 3, 'tres fases del COA')
    const f0 = datos.bajasPorFase[0]
    const r0 = mesa.iC({ ...f0 })
    assert.equal(Math.round(B.fases[0].r.total), Math.round(r0.total))
    const r2 = mesa.iC({ efectivo: 6446, dias: 1, tipoOperacion: 'ofensiva', dispositivo: 'primer', terreno: 'normal', enemigo: 'equivalente', clima: 'normal', sanidad: 'regular', moral: 'normal', experiencia: 'veterana', diasEnCombate: 0 })
    assert.equal(Math.round(B.fases[2].r.total), Math.round(r2.total), 'la fase sin cargar va con los valores por defecto del panel')
    assert.ok(B.pct > 20, 'el ejercicio supera el 20 %')
    const t = G.tablaBajas(ctx())
    assert.equal(t.filas.length, 4)
    assert.equal(t.filas[0][0], 'Fase I — RUPTURA (FICT.)')
  })
  caso('🌱 Apreciación: trae del calco, de las hojas y de la Orden', () => {
    const P = G.propuestasAprec(ctx())
    const v = M.armar(APREC, {}, P).valor
    const todo = JSON.stringify(v)
    for (const t of ['Mantener el efectivo de combate de los regimientos de primer escalón (FICT.)', 'No emplear mano de obra civil al norte del río Z (FICT.)', 'Los reemplazos del CE llegan antes del D+1 (FICT.)', 'Efectivo de planeamiento: 6446', 'Cadena de evacuación en el calco: 1.- PPGG', 'DPG', 'Ruta de evacuación', 'Línea de Extraviados', 'a retaguardia de las posiciones de artillería', 'PRR', 'Fase I — RUPTURA (FICT.)', 'Bajas previstas', 'BRIG. BL. ROJA (FICT.)', 'RI-1 «ALFA» (FICT.)', 'CAP N° 1 — ataque por el norte (FICT.)', 'Un solo EPE para heridos y PP.GG. (FICT.).', 'Sí, con reemplazos anticipados (FICT.).', 'superan el 20 %', 'Especial PUEBLO-X (FICT.)', 'del Puesto de Reunión de Muertos', 'para apoyar el cumplimiento de la misión'])
      assert.ok(todo.includes(t), `apreciación: falta «${t}»`)
    assert.equal(v.caps.length, 2)
    assert.equal(v.caps[0].fases.length, 3)
    assert.match(v.caps[0].fases[0].valores.mantenimiento, /^Bajas previstas: \d/)
    assert.match(v.caps[0].fases[0].valores.mantenimiento, /% del efectivo de 6446/)
    assert.match(v.caps[0].fases[0].valores.mantenimiento, /\d,\d %/, 'decimales con coma')
    assert.equal(v.caps[1].fases[0].valores.mantenimiento, '', 'las bajas del panel van sólo al CAP en estudio')
  })
  caso('🌱 Anexo: cuadro de bajas, reemplazos, PP.GG. con Ginebra, Línea de Extraviados, PC', () => {
    const P = G.propuestasAnexo(ctx())
    const v = M.armar(ANEXO, {}, P).valor
    const todo = JSON.stringify(v)
    for (const t of ['Referirse a la Orden de Operaciones.', 'Requerimiento al G-4', 'Reemplazos a solicitar', 'Protocolos de Ginebra', 'Línea de Extraviados', 'PC. de la DIV.MEC.-1 (FICT.): CG. PUEBLO-X.', 'Puesto de Pagaduría', 'prioridad de reemplazos: [definir]'])
      assert.ok(todo.includes(t), `anexo: falta «${t}»`)
    const s = M.especificacion(ANEXO, v, { tablas: G.tablasAnexo(ctx()) })
    const efect = s.secciones[3].hijos[0].hijos[0]
    assert.equal(efect.titulo, 'Efectivos.')
    assert.equal(efect.tabla.cabecera[0], 'Fase')
    assert.equal(efect.tabla.filas.length, 4)
    assert.equal(s.numero, '', 'el número del anexo lo pide el Word')
    assert.equal(s.firma, undefined, 'el anexo lo firma el Comandante (lo arma el formato militar)')
  })
  caso('el anexo toma la misión de la Apreciación si ya está', () => {
    const ap = M.armar(APREC, {}, { campos: { mision: 'MISIÓN DE PERSONAL DE LA APRECIACIÓN (FICT.)' } }).valor
    const P = G.propuestasAnexo(ctx({ ...datos.hojasG.g1, aprecActiva: ap }))
    assert.equal(P.campos.mision, 'MISIÓN DE PERSONAL DE LA APRECIACIÓN (FICT.)')
  })
  caso('lo que entregaron las otras secciones y el estado del calco', () => {
    const E = G.entregas(ctx())
    assert.deepEqual(E.map((x) => x.de), ['La Orden del escalón superior', 'El G-4'])
    const e = G.estadoCalco(ctx())
    assert.match(e.texto, /✓ 3 fase/)
    assert.match(e.texto, /✓ ruta de PP.GG./)
    assert.ok(e.botones.some((b) => b.arg === 'extraviados'))
  })

  // ── LA IA ─────────────────────────────────────────────────────────────────────────
  caso('pedido de la apreciación: expediente, lo calculado, lo entregado, doctrina, formato, ideas y JSON', () => {
    const v = { ...M.normalizar(APREC, {}), ideas: 'Lo crítico son los reemplazos de la fase II (FICT.).' }
    const c = ctx()
    const doc = G1.documentos.aprecActiva
    const p = M.pedido(APREC, M.conFases(APREC, v, G.nombresFases(c)), {
      encabezado: 'Sos OFICIAL DE ESTADO MAYOR (prueba).',
      expediente: '# EXPEDIENTE DEL EJERCICIO — MESA DEL ESTADO MAYOR\n13 · DOCUMENTOS APORTADOS POR EL OFICIAL\nANEXO DE PERSONAL DEL I CE (FICT.)',
      seccion: G1.seccionIA,
      producto: doc.producto(c, { num: 'F1·P3', id: 'aprecActiva' }),
      bloques: [{ titulo: 'LO QUE LA MESA YA CALCULÓ', texto: G1.datosCalco(c) }, { titulo: 'LO QUE YA ENTREGARON LAS OTRAS SECCIONES', texto: G1.entregasTexto(c) }, { titulo: 'LO QUE YA DICEN TUS OTRAS HOJAS', texto: G1.otrasHojas(c, ['aprecActiva']) }],
      doctrina: G1.doctrina(),
      ideasQue: doc.ideasQue,
      verificacion: doc.verificacion,
      fasesCOA: G.nombresFases(c),
    })
    assert.ok(p.ok)
    for (const t of ['Sos OFICIAL DE ESTADO MAYOR', 'SECCIÓN I — PERSONAL (G-1)', 'DOCUMENTOS APORTADOS POR EL OFICIAL', 'ANEXO DE PERSONAL DEL I CE (FICT.)', 'APRECIACIÓN DE BAJAS POR FASE', 'CADENA DE PP.GG.', 'LÍNEA DE EXTRAVIADOS', 'Área de Descanso está a', 'F2·P3 Tareas de personal', 'F5·P1 Ventajas', 'ECEM 15-08', 'Protocolos de Ginebra', 'EL FORMATO DEL DOCUMENTO', 'I.- MISIÓN.', '"campos"."tareasEsp"', '"caps"[]."fases"[]."valores"."mantenimiento"', 'Lo crítico son los reemplazos', '"fases"', 'Fase I — RUPTURA (FICT.)', 'VERIFICACIÓN FINAL', 'SIN DATO — verificar'])
      assert.ok(p.prompt.includes(t), `pedido: falta «${t}»`)
    assert.ok(p.prompt.indexOf('EL FORMATO DEL DOCUMENTO') < p.prompt.indexOf('CÓMO LO QUIERE EL OFICIAL'), 'las ideas van después del formato')
  })
  caso('respuesta de la IA: sólo completar no pisa; CAP por nombre y fase; marcas', () => {
    const base = M.armar(APREC, {}, G.propuestasAprec(ctx())).valor
    const r = M.aplicarRespuesta(APREC, '```json\n' + JSON.stringify(respuestaAprec()) + '\n```', base, { modo: 'completar' })
    assert.ok(r.ok, r.error)
    assert.notEqual(r.valor.campos.objeto, 'Texto de la IA que NO debe pisar el objeto armado.')
    assert.notEqual(r.valor.campos.mision, 'Texto de la IA que NO debe pisar la misión de personal.')
    assert.match(r.valor.campos.mejorCap, /mejor apoyado/)
    assert.match(r.valor.campos.terrenoCCMM, /frío nocturno/)
    assert.equal(r.valor.caps[0].fases[0].valores.administracion, 'Se prevén 120 PP.GG. (FICT.); custodia de la Cía. PM.')
    assert.ok(r.valor.iaCampos.includes('campo:mejorCap'))
    assert.ok(r.valor.iaCampos.includes(`cap:${r.valor.caps[0].id}:f0:administracion`))
    const m = M.aplicarRespuesta(APREC, JSON.stringify(respuestaAprec()), base, { modo: 'completar_mejorar' })
    assert.equal(m.valor.campos.mision, 'Texto de la IA que NO debe pisar la misión de personal.', 'mejorar sí reescribe')
    assert.equal(M.aplicarRespuesta(APREC, 'no es JSON', base).ok, false)
  })
  caso('respuesta del anexo y texto para el expediente', () => {
    const base = M.armar(ANEXO, {}, G.propuestasAnexo(ctx())).valor
    const r = M.aplicarRespuesta(ANEXO, JSON.stringify(respuestaAnexo()), base)
    assert.ok(r.ok)
    assert.equal(r.valor.campos.partes, 'Parte diario de efectivos a las 1800 (FICT.).')
    const t = M.textoDe(ANEXO, r.valor)
    assert.match(t, /^ANEXO \(PERSONAL\)/)
    assert.match(t, /Partes e informes\. Parte diario/)
  })

  // ── EL LECTOR: la IA no contestó en JSON ──────────────────────────────────────────
  const L = await import(url(`estado-mayor/${V}/lector.js`))
  const prosa = fs.readFileSync(path.join(__dirname, 'respuesta-prosa-personal.md'), 'utf8')
  caso('la IA escribió el DOCUMENTO (Markdown, I.- A.- 1.-, negritas, listas): cada parte cae en su apartado', () => {
    const base = M.armar(APREC, {}, G.propuestasAprec(ctx())).valor
    const r = M.aplicarRespuesta(APREC, prosa, base, { modo: 'completar_mejorar' })
    assert.ok(r.ok, r.error)
    assert.equal(r.como, 'documento')
    assert.match(r.msg, /se leyó el documento por sus títulos/)
    const c = r.valor.campos
    assert.equal(c.tareasEsp, '- Evacuar los PP.GG. hasta el DPG del CE.')
    assert.equal(c.tareasImp, '1. Solicitar reemplazos.\n2. Coordinar la evacuación con el G-4.')
    assert.equal(c.limitaciones, 'No emplear mano de obra civil al norte del río Z.')
    assert.match(c.mision, /^El G-1 de la DIV.MEC.-1 mantiene/)
    assert.equal(c.refuerzosPropios, 'Sin refuerzos asignados.', 'Refuerzos de la situación propia')
    assert.equal(c.refuerzos, 'Una compañía de PM del CE.', 'Refuerzos del mantenimiento del efectivo')
    assert.equal(c.factibilidad, 'La operación PUEDE ser apoyada desde el punto de vista del personal.', '«A.-» sin título: por su orden')
    assert.equal(c.mejorCap, 'El CAP N° 1 es el mejor apoyado.')
    assert.match(c.problemas, /3\. INSTRUIR a los comandantes de unidad/)
    assert.ok(!/\*\*/.test(JSON.stringify(c)), 'sin las negritas de Markdown')
    assert.equal(r.valor.caps.length, 2, 'los dos CAP, sin duplicar')
    const [c1, c2] = r.valor.caps
    assert.equal(c1.id, base.caps[0].id, 'el CAP N° 1 es el mismo (por su número)')
    assert.equal(c1.fases[0].valores.mantenimiento, 'Bajas previstas 957 (14,9 %).')
    assert.equal(c1.fases[0].valores.administracion, '120 PP.GG. previstos.')
    assert.equal(c1.fases[1].valores.mantenimiento, '443 bajas.')
    assert.equal(c1.ventajas, 'Un solo EPE.')
    assert.equal(c2.desventajas, 'dos rutas de evacuación.')
    assert.equal(c2.fases[0].valores.mantenimiento, '700 bajas.')
  })
  caso('«Sólo completar» con el documento escrito tampoco pisa', () => {
    const base = M.armar(APREC, {}, G.propuestasAprec(ctx())).valor
    const r = M.aplicarRespuesta(APREC, prosa, base, { modo: 'completar' })
    assert.ok(r.ok, r.error)
    assert.equal(r.valor.campos.objeto, base.campos.objeto)
    assert.equal(r.valor.campos.mision, base.campos.mision)
    assert.equal(r.valor.campos.terrenoCCMM, 'el frío nocturno eleva las pérdidas fuera de combate.')
  })
  caso('JSON con saltos de línea dentro de los textos, comas de más y comillas tipográficas', () => {
    const j = 'Claro, acá va:\n```json\n{ "campos": { "mision": "Renglón 1\nRenglón 2 con “comillas”", "partes": "Parte a las 1800", }, }\n```\nEspero que sirva.'
    const r = M.aplicarRespuesta(ANEXO, j, {}, { modo: 'completar' })
    assert.ok(r.ok, r.error)
    assert.equal(r.como, 'json-reparado')
    assert.equal(r.valor.campos.mision, 'Renglón 1\nRenglón 2 con “comillas”')
    const q = M.aplicarRespuesta(ANEXO, '{ “campos”: { “partes”: “Diario” } }', {}, {})
    assert.ok(q.ok, q.error)
    assert.equal(q.valor.campos.partes, 'Diario')
  })
  caso('JSON cortado por el largo: se toma lo que se pueda leer', () => {
    const r = M.aplicarRespuesta(ANEXO, '```json\n{ "campos": { "partes": "Parte diario (FICT.).", "comando": "PC en PUEBLO-X", "comunicaciones": "IOC N', {}, {})
    assert.ok(r.ok, r.error)
    assert.equal(r.como, 'fragmentos')
    assert.equal(r.valor.campos.partes, 'Parte diario (FICT.).')
    assert.equal(r.valor.campos.comando, 'PC en PUEBLO-X')
    assert.match(r.msg, /venía cortado/)
  })
  caso('una respuesta sin JSON ni títulos da un error que dice qué hacer', () => {
    const r = M.aplicarRespuesta(APREC, 'Lo siento, no puedo ayudar con eso.', {}, {})
    assert.equal(r.ok, false)
    assert.match(r.error, /No se reconoció la respuesta/)
  })
  caso('el pedido termina diciendo cómo contestar (y que el documento escrito también se lee)', () => {
    const p = M.pedido(APREC, {}, { seccion: 'X', producto: 'Y' })
    const i = p.prompt.lastIndexOf('# FORMATO DE TU RESPUESTA')
    assert.ok(i > p.prompt.lastIndexOf('# CÓMO CONTESTAR'), 'va al final')
    assert.match(p.prompt.slice(i), /SÓLO el bloque de código ```json/)
    assert.match(p.prompt.slice(i), /MISMOS títulos y la MISMA numeración/)
  })
  caso('hojas de siempre sin JSON: tabla de Markdown, dos listas y «Casilla: texto»', () => {
    const cols = ['Tarea', 'Tipo', 'De dónde sale', 'Quién la ejecuta']
    const tabla = 'Acá están:\n\n| **Tarea** | Tipo | De dónde sale | Quién la ejecuta |\n|---|---|---|---|\n| Evacuar PP.GG. | Implícita | ECEM 15-08 | PM |\n| Solicitar reemplazos | Específica | Orden N° 3 | G-1 |\n'
    assert.deepEqual(L.rescatarHoja(tabla, { cols }, { forma: 'filas', cols }), [
      { Tarea: 'Evacuar PP.GG.', Tipo: 'Implícita', 'De dónde sale': 'ECEM 15-08', 'Quién la ejecuta': 'PM' },
      { Tarea: 'Solicitar reemplazos', Tipo: 'Específica', 'De dónde sale': 'Orden N° 3', 'Quién la ejecuta': 'G-1' },
    ])
    const dl = '**🔵 HECHOS (verificados)**\n- El CE asigna 300 reemplazos.\n- Hay tres fases.\n\n**🟡 SUPOSICIONES (a confirmar)**\n1. Los reemplazos llegan el D+1.\n'
    assert.deepEqual(L.rescatarHoja(dl, { cols: ['🔵 HECHOS (verificados)', '🟡 SUPOSICIONES (a confirmar)'] }, { forma: 'dosListas' }), { a: ['El CE asigna 300 reemplazos.', 'Hay tres fases.'], b: ['Los reemplazos llegan el D+1.'] })
    const claves = ['Lo que este campo APORTA a la potencia propia', 'Conclusión para el planeamiento'].map((k) => ({ k, rot: k, tipo: 'texto' }))
    const ob = '**Lo que este campo APORTA a la potencia propia:** 6.446 hombres.\n**Conclusión para el planeamiento:**\nSe sostiene con reemplazos.'
    assert.deepEqual(L.rescatarHoja(ob, {}, { forma: 'objeto', claves }), { 'Lo que este campo APORTA a la potencia propia': '6.446 hombres.', 'Conclusión para el planeamiento': 'Se sostiene con reemplazos.' })
    assert.deepEqual(L.rescatarHoja('[{"Tarea": "A\nB"}]', { cols }, { forma: 'filas', cols }), [{ Tarea: 'A\nB' }], 'JSON con salto crudo')
    assert.equal(L.rescatarHoja('nada', { cols }, { forma: 'filas', cols }), null)
  })
  caso('el gancho en dU del compilado vigente: una tabla de Markdown entra en la hoja de renglones', () => {
    const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')
    const vig = path.join(RAIZ, html.match(/\.\/(assets\/index-[\w-]+\.js)/)[1])
    const ctxDU = cargarConDependencias(vig, ['dU'], (c) => c.dU('[{"Tarea":"x"}]', { id: 'tareas', tipo: 'filas', cols: ['Tarea'] }), { SIDEMRescatar: R.rescatarHoja, SIDLogEs: () => false })
    const hoja = { id: 'tareas', tipo: 'filas', cols: ['Tarea', 'Tipo', 'De dónde sale', 'Quién la ejecuta'] }
    const r = ctxDU.dU('| Tarea | Tipo |\n|---|---|\n| Evacuar PP.GG. | Implícita |', hoja)
    assert.ok(r.ok, r.error)
    assert.deepEqual(JSON.parse(JSON.stringify(r.datos)), [{ Tarea: 'Evacuar PP.GG.', Tipo: 'Implícita' }])
    const e = ctxDU.dU('Lo siento.', hoja)
    assert.equal(e.ok, false)
    assert.match(e.error, /No se reconoció la respuesta/)
  })

  // ── LAS HOJAS DE TRABAJO DE SIEMPRE ───────────────────────────────────────────────
  const hoja = (id, tipo, extra = {}) => ({ id, tipo, ...extra })
  caso('las hojas del G-1 tienen guía y la IA la recibe con la doctrina', () => {
    for (const id of ['tareas', 'limitaciones', 'hechos', 'rcic', 'potencia', 'decision', 'riesgo']) {
      const g = R.guiaHoja('g1', { id })
      assert.ok(g?.para && g.como?.length && g.ejemplo, `guía de ${id}`)
      assert.ok(R.guiaIA('g1', { id }).como.some((x) => /ECEM 15-08/.test(x)))
    }
    assert.equal(R.guiaHoja('g4', { id: 'tareas' }), null, 'el G-4 no cambia')
    assert.equal(R.guiaIA('g1', { id: 'aprecActiva', tipo: 'docEM', campoEM: 'g1', docEM: 'aprecActiva' }), null, 'los documentos traen su propio pedido')
  })
  caso('🌱 F2·P3 tareas: de la Orden y del calco, sin duplicar', () => {
    const h = hoja('tareas', 'filas', { cols: ['Tarea', 'Tipo', 'De dónde sale', 'Quién la ejecuta'] })
    const r = R.sembrarHoja('g1', h, datos.hojasG.g1.tareas, ctx())
    assert.ok(r.n >= 4)
    const ts = r.valor.map((f) => f.Tarea).join('\n')
    for (const t of ['Mantener el efectivo de combate', 'Evacuar los PP.GG. hasta el DPG del CE (FICT.)', 'reemplazos al escalón superior', 'Coordinar con el G-4', 'Evacuar los PP.GG. por la cadena PPGG → DPG', 'Controlar la Línea de Extraviados']) assert.ok(ts.includes(t), `tareas: falta «${t}»`)
    assert.equal(R.sembrarHoja('g1', h, r.valor, ctx()).n, 0, 'la segunda vez no duplica')
  })
  caso('🌱 F2·P6, F2·P8, F3·P1, F5·P1 y F6·P3', () => {
    const he = R.sembrarHoja('g1', hoja('hechos', 'dosListas'), datos.hojasG.g1.hechos, ctx())
    assert.equal(he.valor.a[0], 'El CE asigna 300 reemplazos para el D+1 (FICT.)', 'no toca lo que estaba')
    assert.ok(he.valor.a.some((x) => /Efectivo de planeamiento/.test(x)))
    assert.ok(he.valor.b.some((x) => /Fase I — RUPTURA \(FICT\.\): operación ofensiva/.test(x)))
    const po = R.sembrarHoja('g1', hoja('potencia', 'campos', { campos: ['Lo que este campo APORTA a la potencia propia', 'Lo que este campo LIMITA de la potencia propia', 'Lo mismo, del lado del ENEMIGO', 'Conclusión para el planeamiento'] }), { 'Lo que este campo APORTA a la potencia propia': 'Del oficial.' }, ctx())
    assert.equal(po.valor['Lo que este campo APORTA a la potencia propia'], 'Del oficial.')
    assert.match(po.valor['Lo que este campo LIMITA de la potencia propia'], /pierde eficiencia combativa/)
    const rc = R.sembrarHoja('g1', hoja('rcic', 'filas', { cols: ['Requerimiento', 'Por qué es crítico', 'Quién lo busca', 'Para cuándo'] }), [], ctx())
    assert.equal(rc.valor.filter((f) => /^RCIC: ¿cuántas bajas/.test(f.Requerimiento)).length, 3, 'un RCIC de bajas por fase')
    assert.ok(rc.valor.some((f) => /^EEIA:/.test(f.Requerimiento)))
    const ri = R.sembrarHoja('g1', hoja('riesgo', 'filas', { cols: ['Riesgo', 'Probabilidad', 'Gravedad', 'Medida de control', 'Quién la ejecuta'] }), [], ctx())
    assert.ok(ri.valor.some((f) => /Pérdida de eficiencia combativa/.test(f.Riesgo)))
    assert.ok(ri.valor.some((f) => /Área de Descanso/.test(f.Riesgo)))
    const ap = M.armar(APREC, {}, G.propuestasAprec(ctx())).valor
    const de = R.sembrarHoja('g1', hoja('decision', 'filas', { cols: ['Curso de acción', 'Ventajas', 'Desventajas', '¿Se puede apoyar?'] }), [], ctx({ aprecActiva: ap }))
    assert.equal(de.valor.length, 2)
  })
  caso('pedido de una hoja de trabajo: suma lo calculado, lo entregado y la doctrina antes de «CÓMO CONTESTAR»', () => {
    const r = R.pedidoHoja('g1', { id: 'tareas' }, { ok: true, prompt: 'A\n\n---\n\n# CÓMO CONTESTAR\n\nJSON' })
    const i = r.prompt.indexOf('# CÓMO CONTESTAR')
    for (const t of ['LO QUE LA MESA YA CALCULÓ Y TIENE EN EL CALCO PARA G-1 PERSONAL', 'APRECIACIÓN DE BAJAS POR FASE', 'LO QUE YA ENTREGARON LAS OTRAS SECCIONES', 'DOCTRINA Y REGLAMENTOS DEL CAMPO']) assert.ok(r.prompt.indexOf(t) >= 0 && r.prompt.indexOf(t) < i, `pedido de hoja: «${t}»`)
    assert.equal(R.pedidoHoja('g4', { id: 'tareas' }, { ok: true, prompt: 'X' }).prompt, 'X', 'el G-4 no cambia')
  })

  // ── EL REGISTRO Y EL COMPILADO ────────────────────────────────────────────────────
  caso('las hojas del G-1 pasan a documentos; las demás secciones no cambian', () => {
    const fases = [{ id: 1, hojas: [{ id: 'aprecActiva', num: 'F1·P3', nom: 'Apreciación Activa de PERSONAL', tipo: 'remite', nota: 'se baja' }] }, { id: 7, hojas: [{ id: 'anexo', num: 'F7·P1', tipo: 'remite' }, { id: 'otra', tipo: 'filas' }] }]
    const g1 = R.fasesConDocumentos({ id: 'g1' }, fases)
    assert.equal(g1[0].hojas[0].tipo, 'docEM')
    assert.equal(g1[0].hojas[0].docEM, 'aprecActiva')
    assert.match(g1[0].hojas[0].nota, /se trabaja acá/)
    assert.equal(g1[1].hojas[0].tipo, 'docEM')
    assert.equal(g1[1].hojas[1].tipo, 'filas')
    assert.ok(R.esDocumento(g1[0].hojas[0]))
    assert.equal(R.fasesConDocumentos({ id: 'g4' }, fases), fases)
    assert.equal(R.tieneDocumento(g1[0].hojas[0], { esquema: 'aprec-personal-v1', campos: { mision: 'x' } }), true)
    assert.equal(R.tieneDocumento(g1[0].hojas[0], { esquema: 'aprec-personal-v1' }), false)
  })
  caso('los reemplazos del compilado: cada uno una vez, y el compilado nuevo los trae', () => {
    const lista = require('./reemplazos-2026-10-03-estado-mayor.js')
    const viejo = fs.readFileSync(compilado, 'utf8')
    const nuevo = fs.readFileSync(path.join(RAIZ, 'assets', 'index-personal-20261003.js'), 'utf8')
    for (const r of lista) {
      assert.equal(viejo.split(r.viejo).length - 1, r.veces, r.nombre)
      assert.equal(nuevo.split(r.nuevo).length - 1, r.veces, r.nombre)
    }
    // el que carga calcos/index.html (éste o uno armado encima, que los conserva)
    const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')
    const vigente = fs.readFileSync(path.join(RAIZ, html.match(/\.\/(assets\/index-[\w-]+\.js)/)[1]), 'utf8')
    // (los imports de la carpeta del motor los cambian las listas siguientes —v2, v3…—: ésos los verifica la cadena)
    for (const r of lista) if (!/\.\.\/estado-mayor\/v\d\//.test(r.nuevo)) assert.ok(vigente.includes(r.nuevo), `el compilado vigente conserva: ${r.nombre}`)
  })
  caso('ningún gancho cae DENTRO de lo que insertaron las listas anteriores (el G-4 y los demás quedan enteros)', () => {
    const viejo = fs.readFileSync(compilado, 'utf8')
    const nuevo = fs.readFileSync(path.join(RAIZ, 'assets', 'index-personal-20261003.js'), 'utf8')
    let n = 0
    const rotos = []
    for (const f of fs.readdirSync(__dirname)) {
      let lista = null
      if (/^reemplazos-.*\.js$/.test(f) && f !== 'reemplazos-compilado.js' && !f.includes('2026-10-03')) lista = require(path.join(__dirname, f))
      else if (/^reemplazos-.*\.json$/.test(f)) lista = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')).reemplazos
      for (const r of lista || []) {
        if (!r.nuevo || !viejo.includes(r.nuevo)) continue
        n++
        if (!nuevo.includes(r.nuevo)) rotos.push(`${f}: ${r.nombre || r.nuevo.slice(0, 80)}`)
      }
    }
    assert.ok(n > 100, `se revisaron ${n}`)
    assert.deepEqual(rotos, [])
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
