// El TABLERO G-4 de la instalación y la PROPUESTA DEL ASDI CON LA PICB, en Node:
//   · perfil de cada unidad (también una FT sumando sus piezas) y lo del oficial que manda;
//   · consumos por clase según la operación (en la defensa sube la IV y la V);
//   · a quién apoya cada instalación (área de trenes, nivel unidad, puesto de la GU, oficial);
//   · el plan: ciclo del vehículo, viajes, flota (vehículo-horas / TD), frecuencia, sanidad;
//   · factores editables (lo inválido no entra);
//   · la propuesta del ASDI: lo impositivo y el CMOC se respetan, el embudo cierra, la
//     defensa corre las áreas hacia atrás, las posiciones de bloqueo corren el mínimo;
//   · el pedido a la IA y la lectura de su respuesta;
//   · el croquis llena su recuadro y los rótulos quedan adentro;
//   · los reemplazos del compilado (cada uno una vez y reversibles).
//
//   node tablero-g4.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { ejercicioTablero } = require('./tablero-g4-ejemplo.js')

const V1 = path.join(__dirname, '..', 'logistica', 'v1')
const casos = []
const caso = (nom, f) => casos.push({ nom, f })

;(async () => {
  const P = await import(path.join(V1, 'planeamiento.js'))
  const A = await import(path.join(V1, 'asdi-picb.js'))
  const G = await import(path.join(V1, 'graficos.js'))
  const D = await import(path.join(V1, 'doctrina.js'))
  const G2 = await import(path.join(V1, 'geo.js'))
  const IA = await import(path.join(__dirname, '..', 'fichas-instalacion', 'v2', 'ia.js'))
  const ex = ejercicioTablero()
  const calco = { ops: ex.ops, unidades: ex.unidades, cmoc: ex.cmoc, conceptoApoyo: ex.conceptoApoyo }
  const u = (id) => ex.unidades.find((x) => x.id === id)
  const INFO = {
    pd_cl5m: { id: 'pd_cl5m', grupo: 'abast', nivel: 'gu', clases: ['V'], nom: 'Puesto de Distribución Clase V (Munición)' },
    pd_cl5_avz: { id: 'pd_cl5_avz', grupo: 'abast', nivel: 'bon', clases: ['V'], nom: 'Puesto de Distribución Clase V Avanzado' },
    pd_agua: { id: 'pd_agua', grupo: 'agua', nivel: 'gu', clases: ['I'], nom: 'Puesto de Distribución de Agua' },
    pd_cl3: { id: 'pd_cl3', grupo: 'abast', nivel: 'gu', clases: ['III'], nom: 'Puesto de Distribución Clase III' },
    p_lab: { id: 'p_lab', grupo: 'sanidad', nivel: 'gu', nom: 'Puesto Laboratorio' },
    pmant_mov: { id: 'pmant_mov', grupo: 'mant', nivel: 'gu', nom: 'Puesto de Mantenimiento Móvil' },
    coal: { id: 'coal', grupo: 'mando', nivel: 'gu', nom: 'Centro de Operaciones Logísticas' },
  }
  const plan = (id, extra = {}) => P.planInstalacion({ ...u(id), ...extra.inst }, extra.calco || calco, { info: INFO[u(id).instalacion], ...extra })

  caso('La FT «TORREZ» suma sus piezas: un batallón y una compañía de infantería, una compañía de tanques y una sección de morteros', () => {
    const p = P.perfilUnidad(u('ag-torrez'))
    assert.equal(p.esFT, true)
    assert.equal(p.estimado, true)
    // 600 + 0,22·600 + 0,22·450 + 0,06·250
    assert.equal(p.hombres, Math.round(600 + 0.22 * 600 + 0.22 * 450 + 0.06 * 250))
    assert.equal(p.veh.tanque, Math.round(0.22 * 40))
    assert.ok(p.armas.mort120 >= 1 && p.armas.portatil > 500)
    assert.deepEqual(p.composicion.map((c) => c.tipo).sort(), ['blindada', 'infanteria', 'infanteria', 'morteros'].sort())
  })

  caso('Lo que pone el oficial manda: con sólo los efectivos se escala el resto; un dato puntual queda tal cual', () => {
    const base = P.perfilUnidad(u('ag-torrez'))
    const p = P.perfilUnidad({ ...u('ag-torrez'), logDatos: { hombres: base.hombres * 2, veh: { tanque: 14 } } })
    assert.equal(p.estimado, false)
    assert.equal(p.hombres, base.hombres * 2)
    assert.equal(p.veh.tanque, 14)
    assert.equal(p.veh.camion, Math.round(base.veh.camion * 2))
    assert.equal(p.armas.ametralladora, Math.round(base.armas.ametralladora * 2))
  })

  caso('Consumos: en la defensa la Clase IV ×3 y la V ×1,3 (lámina «Apoyo a las principales operaciones»); en la marcha sube la III', () => {
    const p = P.perfilUnidad(u('l-alfa'))
    const F = P.factores()
    const def = P.requerimientos(p, 'defensa', F)
    const ataque = P.requerimientos(p, 'ataque', F)
    const marcha = P.requerimientos(p, 'marcha', F)
    assert.equal(Math.round(def.cl1.kg), p.hombres * 2)
    assert.equal(Math.round(def.agua.l), p.hombres * 20)
    assert.equal(Math.round(def.cl4.kg), Math.round(p.hombres * 1.5 * 3))
    assert.ok(def.cl4.t > ataque.cl4.t, 'defensa: más Cl IV que en el ataque')
    assert.ok(marcha.cl3.l > def.cl3.l, 'marcha: más Cl III que en la defensa')
    const v = def.cl5.porArma.reduce((s, a) => s + a.kg, 0)
    assert.ok(Math.abs(v - def.cl5.kg) < 1e-6)
    const ame = def.cl5.porArma.find((a) => a.id === 'ametralladora')
    assert.equal(Math.round(ame.disparos), Math.round(24 * 600 * 1.3))
  })

  caso('A quién apoya: el puesto de la GU a todas las unidades (sin las que la FT ya cuenta), el del área de trenes a la FT, el oficial elige', () => {
    const gu = P.apoyadasDe(u('i-cl5'), calco, INFO.pd_cl5m)
    assert.equal(gu.modo, 'auto')
    assert.deepEqual(gu.unidades.map((x) => x.id).sort(), ['ag-torrez', 'l-alfa', 'l-bravo', 'l-charlie', 'l-delta'].sort())
    const at = P.apoyadasDe(u('i-cl5avz'), calco, INFO.pd_cl5_avz)
    assert.deepEqual(at.unidades.map((x) => x.id), ['ag-torrez'])
    assert.match(at.motivo, /área de trenes/)
    const ofi = P.apoyadasDe({ ...u('i-cl5'), apoyaA: ['l-alfa', 'no-existe'] }, calco, INFO.pd_cl5m)
    assert.equal(ofi.modo, 'oficial')
    assert.deepEqual(ofi.unidades.map((x) => x.id), ['l-alfa'])
    // Una unidad que ya está como pieza de una agrupación no se cuenta dos veces.
    const un2 = [...ex.unidades.map((x) => (x.id === 'ag-torrez' ? { ...x, piezasAg: [...x.piezasAg, { id: 'pz', de: 'l-alfa', simbolo: 'infanteria', escalon: 'batallon' }] } : x))]
    assert.ok(!P.unidadesQueReciben(un2).some((x) => x.id === 'l-alfa'))
  })

  caso('El plan del Puesto Cl V: ciclo, viajes, flota por vehículo-horas y frecuencia', () => {
    const pl = plan('i-cl5')
    assert.equal(pl.operacion.id, 'defensa')
    assert.deepEqual(pl.clases, ['cl5'])
    assert.equal(pl.filas.length, 5)
    const F = pl.factores
    for (const f of pl.filas) {
      assert.ok(Math.abs(f.ciclo.horas - (F.transporte.tc + (2 * f.km * F.transporte.factor) / F.transporte.v)) < 1e-9)
      assert.equal(f.ciclo.viajes, Math.floor(F.transporte.td / f.ciclo.horas))
      assert.ok(Math.abs(f.t - f.req.cl5.t) < 1e-9)
      assert.equal(f.porMedio.carga.viajesEntrega, Math.ceil(f.t / F.medios.carga - 1e-9))
    }
    const carga = pl.flota.find((x) => x.id === 'carga')
    const horas = pl.filas.reduce((s, f) => s + f.porMedio.carga.viajesDia * f.ciclo.horas, 0)
    assert.equal(carga.vehiculos, Math.ceil(horas / F.transporte.td - 1e-9))
    assert.ok(Math.abs(pl.totales.t - pl.filas.reduce((s, f) => s + f.t, 0)) < 1e-9)
    assert.match(P.resumenCorto(pl), /Apoya a 5 unidad\(es\).*camiones.*cada 24 h/)
    // Cada 48 h: el doble por entrega, los mismos viajes por día (o menos, por redondeo).
    const p48 = plan('i-cl5', { tablero: { frecuenciaH: 48 } })
    for (const [i, f] of p48.filas.entries()) {
      assert.ok(f.porMedio.carga.viajesEntrega >= pl.filas[i].porMedio.carga.viajesEntrega)
      assert.ok(f.porMedio.carga.viajesDia <= pl.filas[i].porMedio.carga.viajesDia + 1e-9)
    }
    assert.match(P.textoPlan(pl), /FT «TORREZ» \(Fuerza de Tarea \/ agrupación\)/)
  })

  caso('Agua y combustible van en cisternas (litros); sanidad cuenta heridos y ambulancias; mantenimiento averías y grúas; el COAL todas las clases', () => {
    const ag = plan('i-agua')
    assert.deepEqual(ag.clases, ['agua'])
    assert.equal(ag.flota[0].id, 'aguatero')
    assert.equal(ag.flota[0].unidad, 'L')
    const c3 = plan('i-cl3')
    assert.equal(c3.flota[0].id, 'cisterna')
    const lab = plan('i-lab')
    assert.equal(lab.modo, 'sanidad')
    assert.ok(Math.abs(lab.totales.heridos - lab.totales.hombres * 0.01) < 1e-9, '1 % de heridos por día en la defensa')
    assert.ok(lab.flota.some((x) => x.id === 'ambulancia'))
    const mt = plan('i-mant')
    assert.equal(mt.modo, 'mant')
    assert.ok(mt.flota.some((x) => x.id === 'grua'))
    const coal = P.planInstalacion({ id: 'x', tipo: 'instalacion', instalacion: 'coal', lat: -17.01, lng: -68.35 }, calco, { info: INFO.coal })
    assert.equal(coal.clases.length, P.CLASES.length)
  })

  caso('Una unidad más allá de la jornada (TD) queda «fuera de la DMA» y avisa', () => {
    const lejos = { id: 'lejos', bando: 'propias', tipo: 'unidad', designacion: 'RI LEJANO (FICT.)', arma: 'infanteria', escalon: 'batallon', lat: -16.0, lng: -68.33 }
    const pl = P.planInstalacion(u('i-cl5'), { ...calco, unidades: [...ex.unidades, lejos] }, { info: INFO.pd_cl5m })
    const f = pl.filas.find((x) => x.id === 'lejos')
    assert.equal(f.dentro, false)
    assert.equal(f.ciclo.viajes, 0)
    assert.ok(pl.avisos.some((a) => /RI LEJANO.*fuera de la distancia máxima de apoyo/.test(a)))
  })

  caso('Factores: se cambian por ruta, lo inválido no entra, vacío vuelve al de referencia; la operación del oficial manda', () => {
    let over = P.fijarRuta({}, 'clases.cl1', '2.5')
    over = P.fijarRuta(over, 'medios.carga', 8)
    over = P.fijarRuta(over, 'veh.tanque', 'abc')
    assert.deepEqual(over, { clases: { cl1: 2.5 }, medios: { carga: 8 } })
    const F = P.factores({ ...over, clases: { cl1: 2.5, agua: -3 }, inventado: { x: 1 } })
    assert.equal(F.clases.cl1, 2.5)
    assert.equal(F.clases.agua, 20)
    assert.equal(F.medios.carga, 8)
    assert.equal(F.inventado, undefined)
    assert.deepEqual(P.fijarRuta(over, 'clases.cl1', ''), { medios: { carga: 8 } })
    assert.deepEqual(P.fijarRuta({ operacion: { defensa: { cl5: 2 } } }, 'operacion.defensa.cl5', ''), {})
    const pl = plan('i-cl5', { plan: { factores: { medios: { carga: 10 } }, operacion: 'ataque' } })
    assert.equal(pl.operacion.id, 'ataque')
    assert.equal(pl.factores.medios.carga, 10)
    assert.ok(pl.flota[0].vehiculos <= plan('i-cl5').flota[0].vehiculos * 1.5 + 1)
  })

  caso('Propuesta del ASDI: cumple lo impositivo y el CMOC; el embudo cierra; tres áreas separadas, del tamaño de la norma', () => {
    const pr = A.proponerASDI(calco)
    assert.equal(pr.ok, true)
    assert.equal(pr.operacion, 'defensa')
    const E = pr.embudo
    assert.equal(E.evaluados, E.fueraAO + E.seguridad + E.severo + E.avenida + E.dma + E.validos)
    assert.ok(E.severo > 0 && E.avenida > 0 && E.seguridad > 0, 'el CMOC y la seguridad descartaron lugares')
    assert.equal(pr.candidatos.length, 3)
    const ao = ex.ops.areaOps.coords
    const sev = ex.cmoc.severo[0].geometry.coordinates[0]
    for (const c of pr.candidatos) {
      assert.ok(c.km2 >= 6 && c.km2 <= 9, `Área ${c.letra}: ${c.km2} km²`)
      assert.ok(c.coords.every((p) => G2.puntoEnPoligono(p, ao)), 'dentro del AO')
      assert.ok(G2.distPoligonoLinea(c.coords, ex.ops.areaOps.frente) >= 12 - 1e-6, 'a 12 km o más de la LPR')
      assert.ok(!c.coords.some((p) => G2.puntoEnPoligono(p, sev)) && !G2.puntoEnPoligono(c.centro, sev), 'fuera del terreno severo')
      assert.ok(G2.distPuntoLinea(c.centro, ex.cmoc.avenidas[0].coords) > 2, 'fuera de la avenida enemiga')
      assert.ok(c.total > 0 && c.total <= 1)
    }
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(G2.distKm(pr.candidatos[i].centro, pr.candidatos[j].centro) >= 5 - 1e-6, 'separadas')
    assert.ok(pr.candidatos[0].total >= pr.candidatos[1].total && pr.candidatos[1].total >= pr.candidatos[2].total)
    assert.match(A.textoPropuesta(pr), /Área A: puntaje \d+\/100/)
  })

  caso('Propuesta: en el ataque el área va más adelante que en la defensa; las posiciones de bloqueo corren el mínimo; sin AO no propone', () => {
    const def = A.proponerASDI(calco)
    const ata = A.proponerASDI(calco, { operacion: 'ataque' })
    assert.ok(ata.candidatos[0].dSeg < def.candidatos[0].dSeg, `ataque ${ata.candidatos[0].dSeg} < defensa ${def.candidatos[0].dSeg}`)
    const conBloqueo = { ...calco, ops: { ...calco.ops, posDef: [{ centro: [-68.3, -16.89], escalon: 'compania' }] } }
    const b = A.proponerASDI(conBloqueo)
    assert.ok(b.norma.fondoBloqueo > 9 && b.norma.fondoBloqueo < 11)
    assert.ok(b.candidatos.every((c) => c.dSeg >= 12 + b.norma.fondoBloqueo - 1e-6))
    const sin = A.proponerASDI({ ...calco, ops: { ...calco.ops, areaOps: null } })
    assert.equal(sin.ok, false)
    assert.match(sin.error, /Área de Operaciones/)
    // Los pesos del oficial mandan.
    const p = A.proponerASDI(calco, { pesos: { cerrado: 10 } })
    assert.equal(p.criterios.find((k) => k.id === 'cerrado').peso, 10)
  })

  caso('Pedido a la IA del tablero: lleva lo calculado, los factores, la doctrina de la operación y las ideas; la respuesta se valida', () => {
    const pl = plan('i-cl5')
    const t = IA.generarPromptG4(pl, { ideas: 'La FT TORREZ es el esfuerzo principal (FICT.).', pedir: ['verificar', 'municion'], fragmentos: 'Texto UU. CMDO. LOG., Cap. III', encabezado: 'ENCABEZADO' })
    for (const x of ['ENCABEZADO', 'FT «TORREZ»', 'La FT TORREZ es el esfuerzo principal (FICT.).', 'Texto UU. CMDO. LOG., Cap. III', 'Munición:', 'Flota necesaria:', 'clases.cl1 = 2', 'Defensa:', '"instalacionId": "i-cl5"', 'Verificá el cálculo', 'niveles de abastecimiento']) assert.ok(t.includes(x), `el pedido no trae «${x}»`)
    assert.ok(!t.includes('Ordená las unidades apoyadas'), 'sólo lo que se pidió')
    const r = IA.leerRespuestaG4('```json\n' + JSON.stringify({ version: 1, instalacionId: 'i-cl5', resumen: 'Apoya a 5 unidades (FICT.).', prioridades: [{ unidad: 'RA-1 «DELTA» (FICT.)', prioridad: 2, motivo: 'b' }, { unidad: 'FT «TORREZ»', prioridad: 1, motivo: 'a' }], niveles: { NO: 1, NS: 2, NMA: 3, XX: 9 }, ajustes: { frecuenciaH: 12, modalidad: 'propia', factores: { 'clases.cl1': 2.2, 'no.existe': 4, 'medios.carga': -1 } }, recomendaciones: ['x', 3] }) + '\n```', 'i-cl5')
    assert.equal(r.prioridades[0].unidad, 'FT «TORREZ»')
    assert.deepEqual(r.niveles, { NO: 1, NS: 2, NMA: 3 })
    assert.deepEqual(r.ajustes, { frecuenciaH: 12, modalidad: 'propia', factores: { 'clases.cl1': 2.2 } })
    assert.deepEqual(r.recomendaciones, ['x'])
    assert.throws(() => IA.leerRespuestaG4(JSON.stringify({ instalacionId: 'otra', resumen: 'x' }), 'i-cl5'), /otra instalación/)
    assert.throws(() => IA.leerRespuestaG4('sin json', 'i-cl5'), /JSON/)
    assert.equal(IA.leerRespuestaG4('texto libre', 'i-cl5', 'texto').textoLibre, 'texto libre')
  })

  caso('Croquis: el encuadre llena el recuadro y los rótulos (también el de la LPR) quedan adentro', () => {
    const hh = (t, p, ...c) => ({ t, p: p || {}, c })
    const svg = G.croquis(hh, { foco: [[-68.332, -16.9085], [-68.33, -16.87], [-68.33, -16.8]], lineas: [{ coords: [[-68.6, -16.8], [-68.0, -16.8]], color: '#d03b3b', rot: 'LPR / LC' }], puntos: [{ p: [-68.33, -16.87], rot: 'FT «TORREZ»' }] })
    assert.equal(svg.p.viewBox, '0 0 600.0 280.0')
    const textos = []
    const ver = (n) => {
      if (!n || typeof n !== 'object') return
      if (n.t === 'text') textos.push(n)
      for (const c of (n.c || []).flat()) ver(c)
    }
    ver(svg)
    const lpr = textos.find((x) => x.c.includes('LPR / LC'))
    assert.ok(lpr && lpr.p.x > 0 && lpr.p.x < 600 && lpr.p.y > 0 && lpr.p.y < 280, 'el rótulo de la LPR se ve')
    assert.ok(textos.some((x) => x.c.includes('FT «TORREZ»')))
  })

  caso('Reemplazos del compilado: cada uno una vez en el anterior y reversibles', () => {
    const lista = require('./reemplazos-2026-10-03-tablero-g4.js')
    const ant = fs.readFileSync(path.join(__dirname, '..', 'assets', 'index-edicion-20261003.js'), 'utf8')
    const nue = fs.readFileSync(path.join(__dirname, '..', 'assets', 'index-tablero-g4-20261003.js'), 'utf8')
    let x = ant
    for (const r of lista) {
      assert.equal(x.split(r.viejo).length - 1, r.veces, r.nombre)
      x = x.split(r.viejo).join(r.nuevo)
    }
    assert.equal(x, nue)
    // el compilado vigente (el que carga calcos/index.html) trae estos cambios enteros
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')
    const vig = fs.readFileSync(path.join(__dirname, '..', html.match(/\.\/(assets\/index-[\w-]+\.js)/)[1]), 'utf8')
    for (const r of lista) assert.ok(vig.includes(r.nuevo), `el vigente no trae «${r.nombre}»`)
    assert.ok(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').includes('fichas-instalacion/v2/estilo.css'))
    assert.ok(D.OPERACIONES.find((o) => o.id === 'defensa').clases.includes('Cl IV y V'))
  })

  let mal = 0
  for (const c of casos) {
    try {
      await c.f()
      console.log(`  ✔ ${c.nom}`)
    } catch (e) {
      mal++
      console.log(`  ✘ ${c.nom}\n    ${e.stack || e.message}`)
    }
  }
  console.log(mal ? `\n${mal} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(mal ? 1 : 0)
})()
