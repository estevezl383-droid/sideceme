// F3·P3 — FORMACIÓN INICIAL DE LAS FUERZAS del G-3 (06-10-2026). Lo pidió Sergio con capturas
// de la hoja, del calco de la Escuela (las tareas con OD / OC y los triángulos al lado), de
// la Organización de la Tarea en forma gráfica y del panel 🧩: trabajar EN ORDEN y sobre el
// terreno. Se prueba el modelo (calcos/organizacion/v1/modelo.js) con las funciones REALES
// del compilado vigente (cómo se disgrega cada unidad, los símbolos, los nombres):
//   · las proporciones y la propuesta de cada tarea según la operación;
//   · los escalones (dos niveles abajo) y las unidades genéricas del enemigo;
//   · el balance: lo requerido por tarea, la OD primero, lo que sobra y lo que falta;
//   · el reparto propuesto, mover piezas (una pieza en un solo lugar);
//   · el cuadro de la hoja, la forma gráfica, «bajo control»;
//   · la Organización de la Tarea: vincular, reusar, no duplicar, no repetir piezas;
//     partir de lo ya armado; las fichas consolidadas se actualizan;
//   · 🌱 (l3e del compilado) arma el cuadro desde la carta;
//   · los reemplazos del compilado.
//
//   node organizacion.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { vigente } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')
const { ejercicioOrganizacion } = require('./organizacion-ejemplo.js')

const RAIZ = path.join(__dirname, '..')
const VIG = vigente()
const ANTERIOR = path.join(RAIZ, 'assets', 'index-prc-20261006.js')
const NUEVO = path.join(RAIZ, 'assets', 'index-organizacion-20261006.js')
let fallos = 0
const casos = []
const caso = (nombre, f) => casos.push([nombre, f])

;(async () => {
  const m = await import('../organizacion/v1/modelo.js')
  const mesa = cargarConDependencias(VIG, ['tN', 'lP', 'js', 'zg', 'eN', 'cb'], (c) => {
    c.tN({ id: 'x', arma: 'infanteria', escalon: 'batallon' })
    c.js({ arma: 'infanteria', escalon: 'batallon' })
  })
  const simb = {
    piezasDe: (u) => mesa.tN(u, mesa.js(u)),
    grupoDe: (s) => mesa.lP(s)?.grupo || '',
    cortoDe: (s) => mesa.lP(s)?.corto || '',
    rotulo: (u) => mesa.js(u),
    nombreTarea: (id) => mesa.zg.find((t) => t.id === id)?.nombre || id,
  }
  const ej = ejercicioOrganizacion()
  const tarea = (tareaId, operacion, centro, extra = {}) => ({ centro, tarea: tareaId, escalon: 'batallon', rot: 0, escala: 1, oi: { id: `oi-${operacion || tareaId}`, operacion, ...extra } })
  // Como el calco de la Escuela: OD bloquear frente a la FT-43; OC 1 mantener; OC 2 ocupar; OC 3 atacar con fuego.
  const conTareas = (extraOD = {}) => ({
    ...ej.ops,
    tareas: [
      ...ej.ops.tareas,
      tarea('ocupar', 'oc2', [-68.42, -16.86], { enemigos: ['e-bt'] }),
      tarea('bloquear', 'od', [-68.3, -16.84], { enemigos: ['e-bim1', 'e-bim2'], ...extraOD }),
      tarea('mantener', 'oc1', [-68.22, -16.88], { enemigos: [] }),
      tarea('atacar_fuego', 'oc3', [-68.34, -16.82], { enemigos: ['e-bim1'], proporcion: '1:1' }),
    ],
  })

  caso('proporciones: el cuadro de la doctrina y la propuesta de la Mesa según la operación', () => {
    assert.deepEqual(m.PROPORCIONES.map((p) => p.id), ['3:1', '2.5:1', '1:1', '1:2.5', '1:3', '1:6'])
    assert.equal(m.proporcionSugerida('bloquear', 'defensiva').id, '1:3')
    assert.equal(m.proporcionSugerida('mantener', 'defensiva').id, '1:3')
    assert.equal(m.proporcionSugerida('destruir', 'defensiva').id, '1:3')
    assert.equal(m.proporcionSugerida('destruir', 'ofensiva').id, '3:1')
    assert.equal(m.proporcionSugerida('conquistar', 'ofensiva').id, '3:1')
    assert.equal(m.proporcionSugerida('conquistar', 'defensiva').id, '1:1', 'en la defensa es el contraataque')
    assert.equal(m.proporcionSugerida('seguir_asumir', 'ofensiva').id, '1:1', 'movimiento: sin proporción particular')
    assert.equal(m.proporcionSugerida('fijar', 'ofensiva').id, '1:1')
    assert.equal(m.proporcionSugerida('bloquear', 'retrograda').id, '1:6')
    assert.deepEqual(m.proporcionDe('2:1'), { id: '2:1', amigo: 2, enemigo: 1, nom: 'Proporción escrita por el oficial' })
    assert.equal(m.requeridas(9, m.proporcionDe('1:3')), 3)
    assert.equal(m.requeridas(3, m.proporcionDe('3:1')), 9)
    assert.equal(m.requeridas(1, m.proporcionDe('1:3')), 1, 'al menos una si hay enemigo')
    assert.equal(m.requeridas(0, m.proporcionDe('3:1')), 0)
  })

  caso('escalones: dos niveles abajo (lo mismo que la Mesa) y las genéricas del enemigo', () => {
    assert.equal(m.dosAbajo('regimiento'), 'compania')
    assert.equal(m.dosAbajo('batallon'), 'seccion')
    assert.equal(m.dosAbajo('brigada'), 'batallon')
    assert.equal(m.equivalentes('batallon', 'compania'), 3)
    assert.equal(m.equivalentes('brigada', 'compania'), 27)
    assert.equal(m.equivalentes('grupo', 'compania'), 3, 'grupo = batallón')
    assert.equal(m.equivalentes('escuadron', 'compania'), 1, 'escuadrón = compañía')
    assert.equal(m.cantidad(2, 'compania'), '2 compañías')
    assert.equal(m.cantidad(1, 'batallon'), '1 batallón')
    assert.equal(m.cantidad(1.5, 'compania', { corto: true }), '1,5 Cía.')
    assert.equal(m.genericas(1, 'compania'), '1 compañía genérica')
    assert.equal(m.genericas(6, 'compania'), '6 compañías genéricas')
    assert.equal(m.genericas(3, 'batallon'), '3 batallones genéricos')
    // Las piezas de la Mesa: un regimiento se disgrega en 9 compañías.
    const piezas = m.piezasPropias(ej.unidades, simb)
    assert.equal(piezas.filter((p) => p.de === 'p-cab').length, 9)
    assert.equal(m.nivelGenerico(piezas), 'compania')
    assert.equal(piezas.filter(m.esManiobra).length, 18, 'caballería mecanizada y andina: maniobra; artillería, ingeniería, comunicaciones y logística, no')
  })

  caso('balance: la OD primero, el enemigo de cada sector, lo requerido, lo que sobra', () => {
    const b = m.balance({ ops: conTareas(), g3: {}, unidades: ej.unidades }, simb)
    assert.deepEqual(b.tareas.map((x) => x.op.id), ['od', 'oc1', 'oc2', 'oc3'], 'en el orden de la doctrina, no en el de la carta')
    assert.equal(b.G, 'compania')
    assert.equal(b.agrupacionEscalon, 'batallon')
    const [od, oc1, oc2, oc3] = b.tareas
    assert.equal(od.enemigo.gen, 6, 'dos batallones mecanizados = 6 compañías genéricas')
    assert.equal(od.prop.id, '1:3', 'en la defensa, bloquear: 1:3')
    assert.equal(od.requeridas, 2)
    assert.equal(od.nivel, 'falta')
    assert.equal(oc1.nivel, 'sin-enemigo')
    assert.equal(oc2.enemigo.gen, 3)
    assert.equal(oc2.requeridas, 1)
    assert.equal(oc3.prop.id, '1:1', 'la del oficial manda')
    assert.equal(oc3.requeridas, 3)
    assert.equal(b.totalManiobra, 18)
    assert.equal(b.totalRequerido, 6)
    assert.equal(b.sobrante, 12)
    assert.equal(b.deficiencia, 0)
    // La artillería del enemigo no entra en la proporción.
    const conGA = m.balance({ ops: conTareas({ enemigos: ['e-bim1', 'e-ga'] }), g3: {}, unidades: ej.unidades }, simb)
    assert.equal(conGA.tareas[0].enemigo.gen, 3)
    assert.equal(conGA.tareas[0].enemigo.apoyo.length, 1)
    // Lo escrito a mano cuando no hay fichas enemigas.
    const manual = m.balance({ ops: conTareas({ enemigos: [], enemigoManual: { n: 1, escalon: 'regimiento' } }), g3: {}, unidades: ej.unidades }, simb)
    assert.equal(manual.tareas[0].enemigo.gen, 9)
    assert.equal(manual.tareas[0].requeridas, 3)
    // Sugerir el enemigo por cercanía.
    assert.deepEqual(m.sugerirEnemigos({ centro: [-68.3, -16.8], escalon: 'batallon' }, ej.unidades).sort(), ['e-bim1', 'e-bim2'], 'los de su sector (6 km para un batallón)')
    assert.deepEqual(m.sugerirEnemigos({ centro: [-68.0, -17.5], escalon: 'compania' }, ej.unidades), [], 'si no hay nadie en el sector no se inventa')
  })

  caso('reparto: completa desde la OD sin partir las unidades; lo que sobra a la reserva; una pieza en un solo lugar', () => {
    const ops = conTareas()
    const b = m.balance({ ops, g3: {}, unidades: ej.unidades }, simb)
    const r = m.proponerReparto(b)
    assert.equal(r.tareas['oi-od'].length, 2)
    assert.equal(new Set(r.tareas['oi-od'].map((p) => p.de)).size, 1, 'de una misma unidad')
    assert.equal(r.tareas['oi-oc1'].length, 0, 'sin enemigo no pide nada')
    assert.equal(r.tareas['oi-oc2'].length, 1)
    assert.equal(r.tareas['oi-oc3'].length, 3)
    assert.equal(r.reserva.length, 12, 'lo que sobra va a una agrupación aparte')
    const todas = [...Object.values(r.tareas).flat(), ...r.reserva].map((p) => p.id)
    assert.equal(new Set(todas).size, todas.length, 'ninguna repetida')
    // Lo aplicado.
    const ops2 = { ...ops, tareas: ops.tareas.map((t) => (t.oi && r.tareas[t.oi.id] ? { ...t, oi: { ...t.oi, piezas: r.tareas[t.oi.id] } } : t)) }
    const g3 = { organizacionInicial: { reserva: { piezas: r.reserva } } }
    const b2 = m.balance({ ops: ops2, g3, unidades: ej.unidades }, simb)
    assert.deepEqual(b2.tareas.map((x) => x.nivel), ['ok', 'sin-enemigo', 'ok', 'ok'])
    assert.equal(b2.libresManiobra.length, 0)
    assert.equal(m.revisar(b2, { picb: ej.picb, ops: ops2, cmoc: ej.cmoc, g3: ej.g3, ordenSup: ej.ordenSup }).filter((a) => a.paso === 4).length, 0)
    // Mover una pieza de la reserva a la OC 1: sale de la reserva.
    const p = r.reserva[0]
    const mv = m.moverPieza({ ops: ops2, flujo: g3.organizacionInicial }, p, 'oi-oc1')
    assert.equal(mv.flujo.reserva.piezas.length, 11)
    assert.equal(mv.ops.tareas.find((t) => t.oi?.id === 'oi-oc1').oi.piezas[0].id, p.id)
    const vuelve = m.moverPieza(mv, p, null)
    assert.equal(vuelve.ops.tareas.find((t) => t.oi?.id === 'oi-oc1').oi.piezas.length, 0)
    // Si lo requerido supera lo disponible: deficiencia (requerimiento de recursos).
    const muchos = { ...ops, tareas: ops.tareas.map((t) => (t.oi?.id === 'oi-od' ? { ...t, oi: { ...t.oi, proporcion: '3:1' } } : t)) }
    const b3 = m.balance({ ops: muchos, g3: {}, unidades: ej.unidades }, simb)
    assert.equal(b3.tareas[0].requeridas, 18)
    assert.equal(b3.deficiencia, 4)
    assert.ok(m.revisar(b3, { picb: ej.picb, ops: muchos, cmoc: ej.cmoc, g3: ej.g3, ordenSup: ej.ordenSup }).some((a) => /requerimiento de recursos adicionales/.test(a.txt)))
  })

  caso('el cuadro de la hoja y la forma gráfica (con «bajo control»)', () => {
    const ops = conTareas()
    const b = m.balance({ ops, g3: {}, unidades: ej.unidades }, simb)
    const r = m.proponerReparto(b)
    const ops2 = { ...ops, tareas: ops.tareas.map((t) => (t.oi && r.tareas[t.oi.id] ? { ...t, oi: { ...t.oi, piezas: r.tareas[t.oi.id], texto: t.oi.id === 'oi-od' ? 'Bloquear a las unidades mecanizadas y blindadas de la FT-43' : '' } } : t)) }
    const g3 = { organizacionInicial: { reserva: { piezas: r.reserva } } }
    const filas = m.filasCuadro({ ops: ops2, g3, unidades: ej.unidades }, simb)
    assert.deepEqual(Object.keys(filas[0]), m.COLUMNAS)
    assert.deepEqual(filas.map((f) => f.Operación.split(' — ')[0]), ['OD', 'OC 1', 'OC 2', 'OC 3', 'RES', 'Bajo control del comando'])
    assert.equal(filas[0]['Tarea que cumple'], 'Bloquear — T: Bloquear a las unidades mecanizadas y blindadas de la FT-43')
    assert.match(filas[0]['Agrupación / unidad genérica'], /^2 compañías genéricas de maniobra \(2 Cía\. /)
    assert.match(filas[0]['Enemigo en su sector'], /^BIM-431 \(FICT\.\) y BIM-432 \(FICT\.\) \(≈ 6 compañías genéricas\)\.$/)
    assert.match(filas[0]['Proporción requerida frente al enemigo en su sector'], /^1:3 \(defender una posición preparada o fortificada\) → se requieren 2 compañías; dispuestas 2 ✓\.$/)
    assert.match(filas[1]['Proporción requerida frente al enemigo en su sector'], /sin enemigo en el sector/)
    assert.match(filas[2]['Tarea que cumple'], /^Ocupar — T: Ocupar a BT-433 \(FICT\.\)/)
    assert.match(filas[5]['Agrupación / unidad genérica'], /RA-1 «LANZA» \(FICT\.\).*BLOG-2 \(FICT\.\)/)
    // Sin unidades de maniobra suficientes: el renglón de la deficiencia.
    const sinCab = ej.unidades.filter((u) => u.id !== 'p-cab' && u.id !== 'p-and')
    const fd = m.filasCuadro({ ops: conTareas(), g3: {}, unidades: sinCab }, simb)
    assert.equal(fd[fd.length - 1].Operación, 'DEFICIENCIA')
    // La forma gráfica: una caja por operación, con la marca del escalón y las piezas; y bajo control.
    const forma = m.formaGrafica(m.balance({ ops: ops2, g3, unidades: ej.unidades }, simb), { unidades: ej.unidades, orgTarea: [] }, simb)
    assert.deepEqual(forma.cajas.map((c) => c.titulo), ['OPERACIÓN DECISIVA', 'OPERACIÓN DE CONFIGURACIÓN 1', 'OPERACIÓN DE CONFIGURACIÓN 2', 'OPERACIÓN DE CONFIGURACIÓN 3'])
    assert.equal(forma.cajas[0].escalon, 'batallon')
    assert.equal(m.marcaDe(forma.cajas[0].escalon), 'II')
    assert.equal(forma.cajas[0].piezas.length, 2)
    assert.deepEqual(forma.bajo.map((c) => c.nombre), ['RESERVA', 'RA-1 «LANZA» (FICT.)', 'BING-2 «AGUIRRE» (FICT.)', 'RCOM-1 (FICT.)', 'BLOG-2 (FICT.)'])
    assert.equal(forma.bajo[1].escalon, 'regimiento', 'la unidad entera con su escalón (III)')
  })

  caso('a la Organización de la Tarea: crea, reusa la de la misma operación, respeta nombre y propósito, no repite piezas', () => {
    const ops = conTareas()
    const b = m.balance({ ops, g3: {}, unidades: ej.unidades }, simb)
    const r = m.proponerReparto(b)
    const ops2 = { ...ops, tareas: ops.tareas.map((t) => (t.oi && r.tareas[t.oi.id] ? { ...t, oi: { ...t.oi, piezas: r.tareas[t.oi.id] } } : t)) }
    const g3 = { organizacionInicial: { reserva: { piezas: r.reserva } } }
    const b2 = m.balance({ ops: ops2, g3, unidades: ej.unidades }, simb)
    // Ya había una agrupación de OC 1 (armada antes, fuera de orden) con una pieza que ahora va a la OD.
    const piezaOD = r.tareas['oi-od'][0]
    const previa = [{ id: 'ag-1', nombre: 'FT «TORREZ»', proposito: 'Detener el avance de rojo', operacion: 'oc1', tarea: 'apoyar_fuego', escalon: 'batallon', piezas: [{ ...piezaOD, grupo: undefined }], consolidada: true }]
    const s = m.sincronizarOrganizacion({ ops: ops2, flujo: g3.organizacionInicial, orgTarea: previa }, b2)
    assert.equal(s.orgTarea.length, 5, 'OD, OC 1 (la de antes), OC 2, OC 3 y la reserva')
    assert.deepEqual(s.actualizadas, ['ag-1'])
    assert.equal(s.vinculos['oi-oc1'], 'ag-1')
    const oc1 = s.orgTarea.find((a) => a.id === 'ag-1')
    assert.deepEqual([oc1.nombre, oc1.proposito, oc1.tarea, oc1.piezas.length], ['FT «TORREZ»', 'Detener el avance de rojo', 'mantener', 0], 'conserva nombre y propósito; la tarea y las piezas salen de la hoja')
    const od = s.orgTarea.find((a) => a.id === s.vinculos['oi-od'])
    assert.deepEqual([od.operacion, od.tarea, od.escalon, od.piezas.length], ['od', 'bloquear', 'batallon', 2])
    assert.ok(!od.piezas.some((p) => 'grupo' in p), 'las piezas como las guarda la Organización de la Tarea')
    const res = s.orgTarea.find((a) => a.id === s.reservaAgId)
    assert.equal(res.operacion, 'reserva')
    assert.equal(res.piezas.length, 12)
    const ids = s.orgTarea.flatMap((a) => a.piezas.map((p) => p.id))
    assert.equal(new Set(ids).size, ids.length, 'un elemento pertenece a una sola organización')
    // Otra vez, ya vinculadas: no duplica.
    const ops3 = { ...ops2, tareas: ops2.tareas.map((t) => (t.oi && s.vinculos[t.oi.id] ? { ...t, oi: { ...t.oi, agId: s.vinculos[t.oi.id] } } : t)) }
    const flujo3 = { ...g3.organizacionInicial, reserva: { ...g3.organizacionInicial.reserva, agId: s.reservaAgId } }
    const b3 = m.balance({ ops: ops3, g3: { organizacionInicial: flujo3 }, unidades: ej.unidades }, simb)
    const s2 = m.sincronizarOrganizacion({ ops: ops3, flujo: flujo3, orgTarea: s.orgTarea }, b3)
    assert.equal(s2.orgTarea.length, 5)
    assert.equal(s2.nuevas.length, 0)
    // La ficha ya llevada al calco se actualiza con las piezas nuevas.
    const fichas = m.actualizarFichas([{ id: 'f1', esAgrupacion: true, agId: 'ag-1', piezasAg: [piezaOD] }, ej.unidades[0]], s.orgTarea)
    assert.deepEqual([fichas[0].piezasAg.length, fichas[0].tareaAg, fichas[0].operacionAg], [0, 'mantener', 'oc1'])
    assert.equal(fichas[1], ej.unidades[0])
  })

  caso('partir de lo que ya se armó en la Organización de la Tarea (como en la captura, fuera de orden)', () => {
    const org = [
      { id: 'ag-od', nombre: 'FT VARGS', operacion: 'od', tarea: 'atacar_fuego', escalon: 'batallon', piezas: [{ id: 'p-cab-1', de: 'p-cab', simbolo: 'cab_blindada', escalon: 'compania' }] },
      { id: 'ag-oc1', nombre: 'FT TORREZ', operacion: 'oc1', tarea: 'apoyar_fuego', escalon: 'batallon', piezas: [], consolidada: true },
      { id: 'ag-res', nombre: 'LANDA', operacion: 'reserva', piezas: [{ id: 'p-and-1', de: 'p-and', simbolo: 'inf_montania', escalon: 'compania' }] },
      { id: 'ag-x', nombre: 'sin operación', operacion: '', piezas: [] },
    ]
    const unidades = [...ej.unidades, { id: 'f-oc1', tipo: 'unidad', esAgrupacion: true, agId: 'ag-oc1', lat: -16.9, lng: -68.25 }]
    const r = m.desdeOrganizacion({ ops: ej.ops, flujo: {}, orgTarea: org, unidades }, { centro: [-68.3, -16.86], G: 'compania' })
    assert.equal(r.tareas.length, 2)
    assert.deepEqual(r.tareas.map((t) => [t.tarea, t.oi.operacion, t.oi.agId, t.oi.piezas.length]), [
      ['atacar_fuego', 'od', 'ag-od', 1],
      ['apoyar_fuego', 'oc1', 'ag-oc1', 0],
    ])
    assert.deepEqual(r.tareas[1].centro, [-68.25, -16.91], 'junto a su ficha en el calco')
    assert.deepEqual([r.reserva.agId, r.reserva.piezas.length], ['ag-res', 1])
  })

  caso('🌱 (l3e del compilado) arma el cuadro desde la carta; sin tareas con operación, no inventa nada', () => {
    const { filasDeLaHoja, configurarOrgInicial } = require_runtime
    configurarOrgInicial({ tN: mesa.tN, js: mesa.js, lP: mesa.lP, zg: mesa.zg })
    const l3e = cargarConDependencias(VIG, ['l3e'], (c) => c.l3e('alerta', {}), { SIDOIFilas: filasDeLaHoja })
    const filas = l3e.l3e('organizacion', { ops: conTareas(), g3: {}, unidades: [], SIDdn: ej.unidades })
    assert.equal(filas.length, 5, 'OD, OC 1, OC 2, OC 3 y bajo control (sin reserva todavía)')
    assert.equal(filas[0].Operación, 'OD — Operación Decisiva (esfuerzo principal)')
    assert.deepEqual(l3e.l3e('organizacion', { ops: ej.ops, g3: {}, unidades: ej.unidades }), [], 'sin OD/OC no hay cuadro: el aviso de la Mesa dice qué hacer')
  })

  caso('el Word de la hoja: el cuadro como tabla apaisada y la forma gráfica como SVG puro (imagen); la vista previa la lleva', async () => {
    require_runtime.configurarOrgInicial({ tN: mesa.tN, js: mesa.js, lP: mesa.lP, zg: mesa.zg, eN: mesa.eN, cb: mesa.cb })
    const doc = await import('../organizacion/v1/documento.js')
    const ops = conTareas()
    const b = m.balance({ ops, g3: {}, unidades: ej.unidades }, simb)
    const r = m.proponerReparto(b)
    const ops2 = { ...ops, tareas: ops.tareas.map((t) => (t.oi && r.tareas[t.oi.id] ? { ...t, oi: { ...t.oi, piezas: r.tareas[t.oi.id] } } : t)) }
    const g3 = { organizacionInicial: { reserva: { piezas: r.reserva } } }
    const ctx = { ops: ops2, SIDdn: ej.unidades, unidades: [], orgTarea: [{ id: 'ag-x', nombre: 'VARGAS', operacion: 'od' }] }
    const filas = m.filasCuadro({ ops: ops2, g3, unidades: ej.unidades }, simb)
    const spec = doc.especificacionWord({ titulo: 'FORMACIÓN INICIAL DE LAS FUERZAS', secciones: [{ texto: 'renglones' }] }, filas, ctx, g3, [{ texto: 'renglones' }])
    assert.equal(spec.orientacion, 'apaisada')
    assert.deepEqual(spec.secciones.map((x) => x.titulo), ['CUADRO DE LA FORMACIÓN INICIAL', doc.TITULO_GRAFICA])
    const tabla = spec.secciones[0].tabla
    assert.deepEqual(tabla.cabecera, m.COLUMNAS.map((c) => c.toUpperCase()))
    assert.equal(tabla.filas.length, filas.length)
    assert.equal(tabla.filas[0][0], 'OD — Operación Decisiva (esfuerzo principal)')
    const svg = spec.secciones[1].svg
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 706 \d+"/, 'el viewBox va primero (la Mesa saca la proporción de ahí)')
    assert.ok(!/foreignObject|<div|style=/.test(svg), 'sin HTML ni CSS: se puede pasar a imagen en cualquier navegador')
    for (const t of ['OPERACIÓN DECISIVA', 'OPERACIÓN DE CONFIGURACIÓN 3', 'BAJO CONTROL', 'RESERVA', 'RA-1 «LANZA»', '>II<', '>III<']) assert.ok(svg.includes(t.replace('«', '«')), `el SVG no trae «${t}»`)
    assert.ok((svg.match(/<svg /g) || []).length > 20, 'con los símbolos de las piezas adentro')
    // Sin renglones en el cuadro, lo de antes y la forma gráfica.
    const sin = doc.seccionesWord([], ctx, g3, [{ texto: 'antes' }])
    assert.deepEqual(sin.map((x) => x.texto || x.titulo), ['antes', doc.TITULO_GRAFICA])
    // La vista previa: la imagen antes del pie, y sólo en la F3·P3.
    const html = '<html><body><h1>X</h1><table></table><p class="pie">EL G-3</p></body></html>'
    const previa = doc.previaConGrafica({ id: 'organizacion' }, html, ctx, g3)
    assert.ok(previa.indexOf('data:image/svg+xml;base64,') > 0 && previa.indexOf('data:image/svg+xml;base64,') < previa.indexOf('<p class="pie">'))
    assert.equal(doc.previaConGrafica({ id: 'potencia' }, html, ctx, g3), html)
  })

  caso('los reemplazos del compilado: cada uno una vez, y se vuelve byte por byte al anterior', () => {
    const lista = require('./reemplazos-2026-10-06-organizacion')
    const antes = fs.readFileSync(ANTERIOR, 'utf8')
    const nuevo = fs.readFileSync(NUEVO, 'utf8')
    let src = antes
    for (const r of lista) {
      assert.equal(src.split(r.viejo).length - 1, r.veces, r.nombre)
      src = src.split(r.viejo).join(r.nuevo)
    }
    assert.equal(src, nuevo)
    let atras = nuevo
    for (const r of [...lista].reverse()) atras = atras.split(r.nuevo).join(r.viejo)
    assert.equal(atras, antes)
    assert.ok(nuevo.includes('"../organizacion/v1/editor.js"'))
    assert.ok(nuevo.includes('nom:"Formación inicial de las fuerzas"'))
  })

  caso('ningún gancho parte lo que insertaron las listas anteriores (todas siguen enteras en el compilado nuevo)', () => {
    const antes = fs.readFileSync(ANTERIOR, 'utf8')
    const ahora = fs.readFileSync(NUEVO, 'utf8')
    const partidos = []
    const ver = (de, nuevo) => typeof nuevo === 'string' && antes.split(nuevo).length !== ahora.split(nuevo).length && partidos.push(de)
    for (const f of fs.readdirSync(__dirname).filter((f) => /^reemplazos-20.*\.js$/.test(f) && !f.includes('organizacion'))) for (const r of require(`./${f}`)) ver(`${f}: ${r.nombre}`, r.nuevo)
    for (const f of fs.readdirSync(__dirname).filter((f) => /^reemplazos-.*\.json$/.test(f))) {
      const j = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'))
      for (const r of Array.isArray(j) ? j : j.reemplazos || j.cambios || []) ver(f, r.nuevo || r[1])
    }
    for (const [, nuevo] of require('./integrar-conceptos.cjs').cambios) ver('integrar-conceptos', nuevo)
    assert.deepEqual(partidos, [])
  })

  let require_runtime
  require_runtime = await import('../organizacion/v1/runtime.js')
  for (const [nombre, f] of casos) {
    try {
      await f()
      console.log('✓', nombre)
    } catch (e) {
      fallos++
      console.error('✗', nombre)
      console.error(e)
    }
  }
  if (fallos) {
    console.error(`${fallos} caso(s) fallaron`)
    process.exit(1)
  }
  console.log(`OK: ${casos.length} casos de la formación inicial de las fuerzas.`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
