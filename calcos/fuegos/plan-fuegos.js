/*
 * Mesa del EM — PLAN DE FUEGOS (pestaña «🔥 Fuegos» del Tablero del G-3)
 *
 * Lo pidió Sergio el 28-09-2026:
 *
 *   · Si se armó una agrupación táctica o una fuerza de tarea, sus armas de
 *     artillería y de apoyo se pueden MARCAR: se dibuja en la carta el radio
 *     hasta donde llegan sus fuegos.
 *   · Los blancos que quedan AFUERA de ese alcance se pintan de FUCSIA: la
 *     pieza tiene que desplazarse para alcanzarlos (se dice cuánto).
 *   · Con la pestaña de fuegos abierta la carta sólo planifica fuegos: tocar
 *     la carta no activa el Área de Operaciones ni sus puntos blancos.
 *   · Se marca en la carta dónde va cada CONCENTRACIÓN, y cada una lleva los
 *     datos de la lista de blancos: designación, coordenadas (MGRS, UTM y
 *     geográficas), cota, tipo de fuego, efecto, forma y dimensiones, medio que
 *     la bate, ejecución, munición, observador…
 *
 * Qué es cada cosa:
 *
 *   MEDIOS DE APOYO DE FUEGO
 *     · Las piezas de artillería, morteros y lanzacohetes integradas en cada
 *       organización de «🧩 Organización de la tarea» (FT, agrupación, unidad
 *       pura). Su posición de fuego es, de entrada, la ficha consolidada de la
 *       organización (o la de su unidad orgánica si no se consolidó).
 *     · Las fichas propias de artillería, morteros y lanzacohetes que siguen
 *       con su unidad orgánica.
 *     · Las armas de apoyo orgánicas (morteros) de las unidades de maniobra y
 *       de las FT, con el mismo cálculo que ya usa la Mesa (eh → influencia).
 *     El alcance sale del catálogo de la Mesa (p5, con su cita); el G-3 puede
 *     cambiar el sistema de armas y mover la posición de fuego (se arrastra en
 *     la carta). Eso es el calco de posiciones: no mueve las fichas.
 *
 *   CONCENTRACIONES (blancos del plan)
 *     Se guardan con el ejercicio en `planFuegos.blancos`. La cruz es negra
 *     (la marca del plan de blancos, según el docente) y FUCSIA si el medio
 *     asignado —o, sin asignar, ninguno— la alcanza.
 *
 * La Mesa (compilado) le pasa los datos con MesaFuegos.sincronizar({...}),
 * monta el panel con MesaFuegos.montar(el) y le presta su Leaflet y sus
 * cálculos en window.__mesaFuegos. Ver calcos/CAMBIOS-EN-EL-COMPILADO.md.
 */
;(function (global) {
  'use strict'

  // ═══════════════════════════ MODELO (sin DOM: se prueba en Node) ═══════════════════════════

  const FUCSIA = '#ff00ff'
  const NEGRO = '#000000'
  const ARMAS_FUEGO = ['artilleria', 'morteros', 'lanzacohetes']
  // Grupos del catálogo de sistemas de armas de la Mesa (p5) que son apoyo de fuego.
  const GRUPOS_SISTEMA = ['Artillería', 'Lanzacohetes', 'Armas de apoyo']
  // Alcance MÍNIMO: sólo los que el mismo catálogo da como «de … a …» (ver la cita).
  const ALCANCE_MINIMO = { obus105m101: 2100, lar160: 12000 }
  const COLORES = ['#5ce1ff', '#ffb35c', '#7dffb0', '#c69cff', '#ffd400', '#ff8a5c', '#5c9dff', '#b8ff5c', '#ffffff', '#ff9ec7']

  const FORMAS = [
    { id: 'puntual', nom: 'Puntual', ayuda: 'Un blanco chico: basta la cruz.' },
    { id: 'circular', nom: 'Concentración circular', ayuda: 'Área batida alrededor del punto: se da el RADIO.' },
    { id: 'rectangular', nom: 'Concentración rectangular', ayuda: 'LARGO, ANCHO y ORIENTACIÓN del lado largo (grados desde el norte).' },
    { id: 'lineal', nom: 'Lineal', ayuda: 'Una línea (p. ej. una barrera): LARGO y ORIENTACIÓN.' },
  ]
  const TIPOS_FUEGO = [
    { id: 'preparacion', nom: 'Fuego de preparación' },
    { id: 'apoyo', nom: 'Fuego de apoyo / acompañamiento' },
    { id: 'contrapreparacion', nom: 'Contrapreparación' },
    { id: 'proteccion', nom: 'Fuego de protección final (barrera)' },
    { id: 'contrabateria', nom: 'Contrabatería' },
    { id: 'interdiccion', nom: 'Interdicción' },
    { id: 'hostigamiento', nom: 'Hostigamiento' },
    { id: 'humo', nom: 'Humo (enceguecimiento / cortina)' },
    { id: 'iluminacion', nom: 'Iluminación' },
  ]
  const EFECTOS = [
    { id: 'destruir', nom: 'Destruir' },
    { id: 'neutralizar', nom: 'Neutralizar' },
    { id: 'suprimir', nom: 'Suprimir' },
    { id: 'enceguecer', nom: 'Enceguecer (humo)' },
    { id: 'iluminar', nom: 'Iluminar' },
  ]
  const EJECUCION = [
    { id: 'a_pedido', nom: 'A pedido', ayuda: 'Planificado: se dispara cuando el observador o el comandante lo pide.' },
    { id: 'programado', nom: 'Programado (horario de fuegos)', ayuda: 'Se dispara a una hora fija o relativa (H−10, H+5…).' },
    { id: 'prioritario', nom: 'Prioritario', ayuda: 'La pieza queda apuntada a este blanco mientras no tira sobre otro.' },
  ]
  const MUNICIONES = ['Explosiva (HE)', 'Fumígena (humo)', 'Iluminante', 'Fósforo blanco']
  const ESPOLETAS = ['Percusión instantánea', 'Percusión con retardo', 'Tiempo', 'Proximidad (VT)']
  const nomDe = (lista, id) => (lista.find((x) => x.id === id) || {}).nom || ''

  // Igual que la Mesa (Xc): «850 m», «5.5 km», «19.8 km».
  function fmtDist(m) {
    const e = Number(m) || 0
    return e >= 1e3 ? `${(e / 1e3).toFixed(e % 1e3 === 0 ? 0 : 1)} km` : `${Math.round(e)} m`
  }

  // Distancia en metros entre [lng, lat] (la misma fórmula que usa la Mesa en gK).
  function distanciaM(a, b) {
    const r = (x) => (x * Math.PI) / 180
    const dLat = r(b[1] - a[1])
    const dLng = r(b[0] - a[0])
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[1])) * Math.cos(r(b[1])) * Math.sin(dLng / 2) ** 2
    return 12742e3 * Math.asin(Math.sqrt(h))
  }

  // Punto a `m` metros de [lng, lat] con rumbo `az` (grados desde el norte).
  function desplazar([lng, lat], m, az) {
    const c = Math.cos((lat * Math.PI) / 180) || 1
    const a = (az * Math.PI) / 180
    return [lng + (m * Math.sin(a)) / (111320 * c), lat + (m * Math.cos(a)) / 110574]
  }

  // ─── Coordenadas ───
  // UTM sobre WGS-84 (serie de Krüger, error del orden del milímetro dentro del huso).
  const BANDAS = 'CDEFGHJKLMNPQRSTUVWX'
  function bandaLat(lat) {
    if (lat < -80 || lat > 84) return ''
    return BANDAS[Math.min(19, Math.floor((lat + 80) / 8))]
  }
  function husoDe(lng, lat) {
    let z = Math.floor((((lng + 180) % 360) + 360) % 360 / 6) + 1
    if (lat >= 56 && lat < 64 && lng >= 3 && lng < 12) z = 32
    if (lat >= 72 && lat < 84) {
      if (lng >= 0 && lng < 9) z = 31
      else if (lng >= 9 && lng < 21) z = 33
      else if (lng >= 21 && lng < 33) z = 35
      else if (lng >= 33 && lng < 42) z = 37
    }
    return z
  }
  function utm(lng, lat) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || lat < -80 || lat > 84) return null
    const a = 6378137
    const f = 1 / 298.257223563
    const k0 = 0.9996
    const zona = husoDe(lng, lat)
    const lon0 = (zona - 1) * 6 - 180 + 3
    const n = f / (2 - f)
    const A = (a / (1 + n)) * (1 + (n * n) / 4 + n ** 4 / 64)
    const alfa = [n / 2 - (2 * n * n) / 3 + (5 * n ** 3) / 16, (13 * n * n) / 48 - (3 * n ** 3) / 5, (61 * n ** 3) / 240]
    const e = Math.sqrt(f * (2 - f))
    const phi = (lat * Math.PI) / 180
    let dl = lng - lon0
    if (dl > 180) dl -= 360
    if (dl < -180) dl += 360
    const lam = (dl * Math.PI) / 180
    const t = Math.sinh(Math.atanh(Math.sin(phi)) - e * Math.atanh(e * Math.sin(phi)))
    const xi = Math.atan2(t, Math.cos(lam))
    const eta = Math.atanh(Math.sin(lam) / Math.sqrt(1 + t * t))
    let x = eta
    let y = xi
    for (let j = 1; j <= 3; j++) {
      x += alfa[j - 1] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta)
      y += alfa[j - 1] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta)
    }
    return { zona, banda: bandaLat(lat), E: 500000 + k0 * A * x, N: k0 * A * y + (lat < 0 ? 10000000 : 0) }
  }
  // MGRS (cuadrícula militar): huso y banda, cuadrado de 100 km y E/N truncados.
  function mgrs(lng, lat, digitos = 5) {
    const u = utm(lng, lat)
    if (!u) return ''
    const col = ['ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ'][(u.zona - 1) % 3][Math.floor(u.E / 1e5) - 1] || '?'
    const fila = 'ABCDEFGHJKLMNPQRSTUV'[(Math.floor(u.N / 1e5) + (u.zona % 2 === 0 ? 5 : 0)) % 20]
    const div = 10 ** (5 - digitos)
    const p = (v) => String(Math.floor((Math.floor(v) % 1e5) / div)).padStart(digitos, '0')
    return `${u.zona}${u.banda} ${col}${fila} ${p(u.E)} ${p(u.N)}`
  }
  function gms(v, pos, neg) {
    const s = v < 0 ? neg : pos
    let a = Math.abs(v)
    let g = Math.floor(a)
    let m = Math.floor((a - g) * 60)
    let seg = Math.round(((a - g) * 60 - m) * 600) / 10
    if (seg >= 60) {
      seg = 0
      m++
    }
    if (m >= 60) {
      m = 0
      g++
    }
    return `${g}°${String(m).padStart(2, '0')}'${seg.toFixed(1).padStart(4, '0').replace('.', ',')}" ${s}`
  }
  const miles = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  function coordenadas(lng, lat) {
    const u = utm(lng, lat)
    return {
      mgrs: mgrs(lng, lat),
      utm: u ? `Zona ${u.zona}${u.banda} · E ${miles(u.E)} · N ${miles(u.N)}` : '',
      utmE: u ? Math.round(u.E) : null,
      utmN: u ? Math.round(u.N) : null,
      utmZona: u ? `${u.zona}${u.banda}` : '',
      geo: `${gms(lat, 'N', 'S')} · ${gms(lng, 'E', 'O')}`,
      dec: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    }
  }

  // ─── El plan ───
  function normalizarPlan(p) {
    const b = p && typeof p === 'object' ? p : {}
    return {
      ...b,
      version: 1,
      medios: b.medios && typeof b.medios === 'object' && !Array.isArray(b.medios) ? b.medios : {},
      blancos: Array.isArray(b.blancos) ? b.blancos.filter((x) => x && Number.isFinite(x.lng) && Number.isFinite(x.lat)) : [],
      verEnCarta: b.verEnCarta !== false,
    }
  }

  const esEnemiga = (u) => !!u && (u.bando === 'enemigo' || u.bando === 'enemigas')
  const esUnidadPropia = (u) => !!u && (u.tipo || 'unidad') === 'unidad' && !esEnemiga(u) && Number.isFinite(u.lat) && Number.isFinite(u.lng)
  const esUnidadEnemiga = (u) => !!u && (u.tipo || 'unidad') === 'unidad' && esEnemiga(u) && Number.isFinite(u.lat) && Number.isFinite(u.lng)
  const rotulo = (M, u) => (M && M.js ? M.js(u) : (u && u.designacion) || 'Unidad')

  function claseOrg(o) {
    if (o && o.ft) return { corto: 'FT', nom: 'Fuerza de tarea' }
    if (o && o.clase === 'pura') return { corto: 'PURA', nom: 'Unidad pura' }
    return { corto: 'AGR', nom: 'Agrupación táctica' }
  }

  // Todos los medios de apoyo de fuego, agrupados como se muestran.
  //   ctx: { unidades (las del calco, como las ve el tablero), todas (sin achicar),
  //          orgTarea, plan, mesa: { eh, p5, lP, dP, uP, js } }
  function mediosDeApoyo(ctx) {
    const M = ctx.mesa || {}
    const unidades = ctx.unidades || []
    const todas = ctx.todas || unidades
    const plan = normalizarPlan(ctx.plan)
    const catalogo = M.p5 || []
    const sistema = (id) => catalogo.find((s) => s.id === id) || null
    const alc = (u) => (M.eh ? M.eh(u) : null) || {}
    const porId = new Map()
    for (const u of todas) if (u && u.id != null) porId.set(u.id, u)
    for (const u of unidades) if (u && u.id != null) porId.set(u.id, u)
    const grupos = []
    const vistos = new Set()

    const armar = (base) => {
      const conf = plan.medios[base.id] || {}
      const sis = conf.sistema ? sistema(conf.sistema) : null
      let alcance = base.alcanceDef
      if (sis) alcance = { m: sis.m, sistema: sis.nom, sistemaId: sis.id, fuente: sis.fuente || 'reglamento', cita: sis.cita || '' }
      const sistemaId = (alcance && alcance.sistemaId) || null
      const pos = Array.isArray(conf.pos) && conf.pos.length === 2 && conf.pos.every(Number.isFinite) ? conf.pos : base.posDef
      return {
        ...base,
        alcance: alcance && alcance.m > 0 ? alcance : null,
        alcanceMin: ALCANCE_MINIMO[sistemaId] || 0,
        sistemaId,
        pos,
        posMovida: pos !== base.posDef,
        ver: !!conf.ver,
      }
    }

    // 1) Piezas de apoyo de fuego integradas en cada organización.
    const fichaDeOrg = new Map()
    for (const o of ctx.orgTarea || []) {
      if (!o) continue
      const ficha = M.dP ? M.dP(o, unidades) : unidades.find((u) => u && u.agId === o.id) || null
      if (ficha) fichaDeOrg.set(ficha.id, o)
      const clase = claseOrg(o)
      const g = {
        clave: `org:${o.id}`,
        titulo: M.uP ? M.uP(o) : o.nombre || 'Agrupación',
        chip: clase.corto,
        sub: `${clase.nom}${ficha ? '' : ' · sin ficha en el calco'}`,
        medios: [],
      }
      for (const p of o.piezas || []) {
        if (!p || p.id == null || vistos.has(p.id)) continue
        const madre = porId.get(p.de) || null
        const s = M.lP ? M.lP(p.simbolo) : null
        const arma = madre && ARMAS_FUEGO.includes(madre.arma) ? madre.arma : (s && s.arma) || p.simbolo
        if (!ARMAS_FUEGO.includes(arma)) continue
        vistos.add(p.id)
        const f = madre ? alc(madre).fuegos : alc({ tipo: 'unidad', arma, escalon: p.escalon }).fuegos
        const donde = ficha || madre
        g.medios.push(
          armar({
            id: `pieza:${p.id}`,
            tipo: 'pieza',
            arma,
            simbolo: p.simbolo || (arma === 'morteros' ? 'morteros' : 'artilleria'),
            nombre: p.nom || String(p.id),
            de: p.madre || (madre ? rotulo(M, madre) : ''),
            nombreCompleto: `${p.nom || p.id} (${g.titulo})`,
            corto: `${p.nom || p.id} · ${g.titulo}`,
            alcanceDef: f || null,
            posDef: donde ? [donde.lng, donde.lat] : null,
            posOrigen: ficha ? 'ficha de la organización' : madre ? 'ficha de su unidad orgánica' : '',
          }),
        )
      }
      // Armas de apoyo orgánicas de la ficha consolidada (morteros según su escalón).
      const inf = ficha && alc(ficha).influencia
      if (inf) g.medios.push(armar(organica(ficha, inf, g.titulo, M)))
      if (g.medios.length) grupos.push(g)
    }

    // 2) Fichas de artillería, morteros y lanzacohetes con su unidad orgánica.
    const sueltas = { clave: 'organicas', titulo: 'Con su unidad orgánica', chip: '', sub: 'Unidades de apoyo de fuego que no se integraron', medios: [] }
    for (const u of unidades) {
      if (!esUnidadPropia(u) || u.esAgrupacion || fichaDeOrg.has(u.id) || !ARMAS_FUEGO.includes(u.arma)) continue
      const f = alc(u).fuegos
      sueltas.medios.push(
        armar({
          id: `ficha:${u.id}`,
          tipo: 'ficha',
          arma: u.arma,
          simbolo: u.arma === 'morteros' ? 'morteros' : 'artilleria',
          nombre: rotulo(M, u),
          de: u.reducida ? `con ${u.piezas} pieza(s): el resto está integrado` : '',
          nombreCompleto: rotulo(M, u),
          corto: rotulo(M, u),
          alcanceDef: f || null,
          posDef: [u.lng, u.lat],
          posOrigen: 'ficha de la unidad',
        }),
      )
    }
    if (sueltas.medios.length) grupos.push(sueltas)

    // 3) Armas de apoyo orgánicas de las unidades de maniobra (las FT ya van con su organización).
    const maniobra = { clave: 'maniobra', titulo: 'Armas de apoyo de las unidades de maniobra', chip: '', sub: 'Morteros orgánicos según el escalón (organización tipo)', medios: [] }
    for (const u of unidades) {
      if (!esUnidadPropia(u) || u.esAgrupacion || fichaDeOrg.has(u.id) || ARMAS_FUEGO.includes(u.arma)) continue
      const inf = alc(u).influencia
      if (inf) maniobra.medios.push(armar(organica(u, inf, rotulo(M, u), M)))
    }
    if (maniobra.medios.length) grupos.push(maniobra)

    const medios = grupos.flatMap((g) => g.medios)
    medios.forEach((m, i) => (m.color = COLORES[i % COLORES.length]))
    return { grupos, medios }
  }

  function organica(u, inf, titulo, M) {
    return {
      id: `organica:${u.id}`,
      tipo: 'organica',
      arma: 'morteros',
      simbolo: 'morteros',
      nombre: 'Armas de apoyo orgánicas',
      de: '',
      nombreCompleto: `Armas de apoyo de ${titulo || rotulo(M, u)}`,
      corto: `Apoyo orgánico · ${titulo || rotulo(M, u)}`,
      alcanceDef: inf,
      posDef: [u.lng, u.lat],
      posOrigen: 'ficha de la unidad',
    }
  }

  // ¿Quién alcanza este punto? Si hay un medio asignado, manda ése.
  function evaluar(punto, medios, asignadoId = null) {
    const filas = (medios || [])
      .filter((m) => m.pos && m.alcance)
      .map((m) => {
        const d = distanciaM(m.pos, punto)
        const min = m.alcanceMin || 0
        return { medio: m, d, alcanza: d <= m.alcance.m && d >= min, falta: Math.max(0, d - m.alcance.m), cerca: d < min ? min - d : 0 }
      })
      .sort((a, b) => a.d - b.d)
    const alcanzan = filas.filter((f) => f.alcanza)
    const asignado = asignadoId ? (medios || []).find((m) => m.id === asignadoId) || null : null
    const fila = asignado ? filas.find((f) => f.medio.id === asignado.id) || null : null
    let fuera
    let consejo = ''
    if (asignadoId && !asignado) {
      fuera = !alcanzan.length
      consejo = 'El medio asignado ya no está en el calco: asigná otro.'
    } else if (asignado && !fila) {
      fuera = true
      consejo = asignado.alcance ? `${asignado.nombreCompleto} no tiene posición de fuego: ubicala en la carta (📍).` : `${asignado.nombreCompleto} no tiene alcance conocido: elegí su sistema de armas.`
    } else if (fila) {
      fuera = !fila.alcanza
      if (fuera) consejo = consejoDe(fila)
    } else {
      fuera = !alcanzan.length
      if (fuera) {
        const cerca = filas.slice().sort((a, b) => a.falta + a.cerca - (b.falta + b.cerca))[0]
        consejo = cerca ? `Ningún medio lo alcanza desde donde está: ${consejoDe(cerca)}` : 'No hay medios de apoyo de fuego con posición en el calco.'
      }
    }
    return { filas, alcanzan, asignado, fila, fuera, consejo }
  }
  function consejoDe(f) {
    if (f.cerca) return `${f.medio.nombreCompleto} está dentro de su alcance mínimo (${fmtDist(f.medio.alcanceMin)}): tiene que alejarse ${fmtDist(f.cerca)}.`
    return `${f.medio.nombreCompleto} tiene que acercarse ${fmtDist(f.falta)} (alcanza ${fmtDist(f.medio.alcance.m)} y el blanco está a ${fmtDist(f.d)}).`
  }

  // Blancos enemigos del calco (las fichas rojas) contra todos los medios.
  function evaluarEnemigos(unidades, medios, M) {
    return (unidades || []).filter(esUnidadEnemiga).map((u) => ({ eno: u, nombre: rotulo(M, u), ...evaluar([u.lng, u.lat], medios) }))
  }

  // «AB-010», «AB-011»…: el siguiente libre.
  function siguienteNumero(plan) {
    let max = 9
    for (const b of normalizarPlan(plan).blancos) {
      const m = /^\s*AB\s*-?\s*(\d+)\s*$/i.exec(String(b.num || ''))
      if (m) max = Math.max(max, Number(m[1]))
    }
    return `AB-${String(max + 1).padStart(3, '0')}`
  }

  // `datos.id` deja elegir el identificador (la vista lo necesita antes de que React aplique el cambio).
  function nuevoBlanco(plan, [lng, lat], datos = {}, ahora = Date.now()) {
    const p = normalizarPlan(plan)
    const usados = new Set(p.blancos.map((b) => b.id))
    let n = p.blancos.length
    while (usados.has(`pf-${ahora}-${n}`)) n++
    if (datos.id != null && usados.has(datos.id)) return { plan: p, id: datos.id }
    const r6 = (x) => Math.round(x * 1e6) / 1e6
    const b = {
      id: `pf-${ahora}-${n}`,
      num: siguienteNumero(p),
      lng: r6(lng),
      lat: r6(lat),
      cota: null,
      forma: 'circular',
      radioM: 100,
      largoM: 400,
      anchoM: 200,
      orientacion: 0,
      tipo: 'apoyo',
      efecto: 'neutralizar',
      ejecucion: 'a_pedido',
      medio: null,
      descripcion: '',
      fase: '',
      hora: '',
      municion: '',
      espoleta: '',
      volumen: '',
      observador: '',
      proposito: '',
      obs: '',
      creado: new Date(ahora).toISOString(),
      ...datos,
    }
    return { plan: { ...p, blancos: [...p.blancos, b] }, id: b.id }
  }

  const CAMPOS_NUM = new Set(['radioM', 'largoM', 'anchoM', 'orientacion', 'cota'])
  function editarBlanco(plan, id, cambios) {
    const p = normalizarPlan(plan)
    const c = { ...cambios }
    delete c.id
    for (const k of Object.keys(c))
      if (CAMPOS_NUM.has(k)) {
        const v = c[k] === '' || c[k] == null ? null : Number(String(c[k]).replace(',', '.'))
        c[k] = Number.isFinite(v) ? (k === 'orientacion' ? ((v % 360) + 360) % 360 : k === 'cota' ? v : Math.max(0, v)) : null
      }
    if ('lng' in c || 'lat' in c) {
      c.lng = Math.round(Number(c.lng) * 1e6) / 1e6
      c.lat = Math.round(Number(c.lat) * 1e6) / 1e6
    }
    return { ...p, blancos: p.blancos.map((b) => (b.id === id ? { ...b, ...c } : b)) }
  }
  const borrarBlanco = (plan, id) => {
    const p = normalizarPlan(plan)
    return { ...p, blancos: p.blancos.filter((b) => b.id !== id) }
  }
  function editarMedio(plan, id, cambios) {
    const p = normalizarPlan(plan)
    const actual = { ...(p.medios[id] || {}), ...cambios }
    for (const k of Object.keys(actual)) if (actual[k] == null || actual[k] === '') delete actual[k]
    const medios = { ...p.medios }
    if (Object.keys(actual).length) medios[id] = actual
    else delete medios[id]
    return { ...p, medios }
  }

  // Geometría del blanco en [lng, lat] (para la carta).
  function geometria(b) {
    const c = [b.lng, b.lat]
    const az = Number(b.orientacion) || 0
    if (b.forma === 'circular') return { tipo: 'circulo', centro: c, radio: Math.max(1, Number(b.radioM) || 0) }
    if (b.forma === 'lineal') {
      const l = (Number(b.largoM) || 0) / 2
      return { tipo: 'linea', puntos: [desplazar(c, l, az + 180), desplazar(c, l, az)] }
    }
    if (b.forma === 'rectangular') {
      const l = (Number(b.largoM) || 0) / 2
      const w = (Number(b.anchoM) || 0) / 2
      const a = desplazar(c, l, az)
      const z = desplazar(c, l, az + 180)
      return { tipo: 'poligono', puntos: [desplazar(a, w, az + 90), desplazar(a, w, az - 90), desplazar(z, w, az - 90), desplazar(z, w, az + 90)] }
    }
    return { tipo: 'punto', centro: c }
  }

  function dimensionesTxt(b) {
    if (b.forma === 'circular') return `Radio ${fmtDist(b.radioM)}`
    if (b.forma === 'rectangular') return `${fmtDist(b.largoM)} × ${fmtDist(b.anchoM)} · orientación ${Math.round(b.orientacion || 0)}°`
    if (b.forma === 'lineal') return `Largo ${fmtDist(b.largoM)} · orientación ${Math.round(b.orientacion || 0)}°`
    return 'Puntual'
  }

  // Tiempo de respuesta (tabla de estimación de la Mesa, mK) según el medio.
  function tiempoDe(medio, tiempos) {
    const id = !medio ? 'art_gen' : medio.tipo === 'organica' ? 'mort_su' : medio.arma === 'morteros' ? 'mort_bon' : 'art_gen'
    const t = (tiempos || []).find((x) => x.id === id)
    return t ? `${t.pedido}-${t.alta} min (estimación)` : ''
  }

  // Renglones para la hoja «Matriz de ejecución de apoyo de fuegos» (mismas columnas).
  function filasMatriz(plan, medios, tiempos) {
    return normalizarPlan(plan).blancos.map((b) => {
      const ev = evaluar([b.lng, b.lat], medios, b.medio)
      const quien = ev.asignado ? ev.asignado.nombreCompleto : ev.alcanzan.map((f) => f.medio.nombreCompleto).join(' / ')
      return {
        'Fase / evento': [b.fase, b.hora].filter(Boolean).join(' · '),
        'Blanco (AB-)': `${b.num} — ${b.descripcion || nomDe(TIPOS_FUEGO, b.tipo)} · ${mgrs(b.lng, b.lat)}`,
        'Unidad que lo bate': (quien || 'SIN MEDIO QUE LO ALCANCE') + (ev.fuera ? ' — ⚠ FUERA DE ALCANCE' : ''),
        'Tarea (destruir / neutralizar / suprimir)': nomDe(EFECTOS, b.efecto),
        Propósito: b.proposito || '',
        'Método (municiones, duración)': [nomDe(TIPOS_FUEGO, b.tipo), nomDe(EJECUCION, b.ejecucion), b.municion, b.espoleta, b.volumen].filter(Boolean).join(' · '),
        'Quién lo observa': b.observador || '',
        'Tiempo de respuesta': tiempoDe(ev.asignado || (ev.alcanzan[0] && ev.alcanzan[0].medio), tiempos),
      }
    })
  }

  const escHtml = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  // Lista de blancos + calco de posiciones, para bajar en Word.
  function documentoHTML(plan, medios, meta = {}) {
    const p = normalizarPlan(plan)
    const td = (x) => `<td>${escHtml(x)}</td>`
    const filas = p.blancos
      .map((b, i) => {
        const ev = evaluar([b.lng, b.lat], medios, b.medio)
        const co = coordenadas(b.lng, b.lat)
        const quien = ev.asignado ? ev.asignado.nombreCompleto : ev.alcanzan.map((f) => f.medio.nombreCompleto).join(' / ') || '—'
        return `<tr${ev.fuera ? ' class="fuera"' : ''}>${[
          String(i + 1),
          b.num,
          `${co.mgrs}\nUTM ${co.utmZona} E ${co.utmE} N ${co.utmN}\n${co.geo}`,
          b.cota == null ? '—' : `${Math.round(b.cota)} m`,
          b.descripcion || '—',
          `${nomDe(FORMAS, b.forma)}\n${dimensionesTxt(b)}`,
          nomDe(TIPOS_FUEGO, b.tipo),
          nomDe(EFECTOS, b.efecto),
          [nomDe(EJECUCION, b.ejecucion), b.fase, b.hora].filter(Boolean).join('\n'),
          quien + (ev.fuera ? `\n⚠ FUERA DE ALCANCE. ${ev.consejo}` : ''),
          [b.municion, b.espoleta, b.volumen].filter(Boolean).join('\n') || '—',
          b.observador || '—',
          [b.proposito && `Propósito: ${b.proposito}`, b.obs].filter(Boolean).join('\n') || '—',
        ]
          .map(td)
          .join('')}</tr>`
      })
      .join('')
    const pos = medios
      .map((m) => {
        const co = m.pos ? coordenadas(m.pos[0], m.pos[1]) : null
        return `<tr>${[
          m.nombreCompleto,
          m.alcance ? m.alcance.sistema : '—',
          m.alcance ? fmtDist(m.alcance.m) + (m.alcanceMin ? ` (mínimo ${fmtDist(m.alcanceMin)})` : '') : '—',
          co ? `${co.mgrs}\nUTM ${co.utmZona} E ${co.utmE} N ${co.utmN}` : 'Sin posición',
          m.posMovida ? 'Posición de fuego puesta por el G-3' : m.posOrigen || '—',
        ]
          .map(td)
          .join('')}</tr>`
      })
      .join('')
    const fecha = meta.fecha || new Date().toLocaleString('es-BO')
    return `<html><head><meta charset="utf-8"><style>
@page Section1 { size: 27.94cm 21.59cm; mso-page-orientation: landscape; margin: 1.5cm; }
div.Section1 { page: Section1; }
body { font: 10pt Arial; }
h1 { font-size: 13pt; text-align: center; margin: 0 0 4pt; }
h2 { font-size: 11pt; margin: 14pt 0 4pt; }
p { margin: 2pt 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #000; padding: 3pt; vertical-align: top; font-size: 8.5pt; white-space: pre-line; }
th { background: #ddd; }
tr.fuera td { color: #b000b0; }
.nota { font-size: 8.5pt; color: #444; margin-top: 8pt; }
</style></head><body><div class="Section1">
<p style="text-align:center">${escHtml(meta.clasificacion || 'RESERVADO')}</p>
<h1>LISTA DE BLANCOS Y CALCO DE CONCENTRACIONES</h1>
<p style="text-align:center">Plan de fuegos${meta.unidad ? ` — ${escHtml(meta.unidad)}` : ''}${meta.ejercicio ? ` · Ejercicio ${escHtml(meta.ejercicio)}` : ''}</p>
<h2>1.- Lista de blancos</h2>
<table><thead><tr><th>N°</th><th>Designación</th><th>Coordenadas (MGRS · UTM WGS-84 · geográficas)</th><th>Cota</th><th>Descripción del blanco</th><th>Forma y dimensiones</th><th>Tipo de fuego</th><th>Efecto</th><th>Ejecución · fase · hora</th><th>Medio que lo bate</th><th>Munición · espoleta · volumen</th><th>Observador</th><th>Propósito · observaciones</th></tr></thead>
<tbody>${filas || '<tr><td colspan="13">Sin concentraciones.</td></tr>'}</tbody></table>
<h2>2.- Posiciones de fuego (calco de posiciones)</h2>
<table><thead><tr><th>Medio</th><th>Sistema de armas</th><th>Alcance</th><th>Posición de fuego</th><th>Origen de la posición</th></tr></thead>
<tbody>${pos || '<tr><td colspan="5">Sin medios de apoyo de fuego.</td></tr>'}</tbody></table>
<p class="nota">Generado por la Mesa del Estado Mayor el ${escHtml(fecha)}. En fucsia: blancos fuera del alcance del medio asignado (o, sin asignar, de todos los medios). Los alcances salen del catálogo de sistemas de armas de la Mesa, con su cita; las coordenadas UTM y MGRS están sobre WGS-84. Revisar y firmar antes de difundir.</p>
</div></body></html>`
  }

  const modelo = {
    FUCSIA,
    NEGRO,
    ARMAS_FUEGO,
    GRUPOS_SISTEMA,
    ALCANCE_MINIMO,
    FORMAS,
    TIPOS_FUEGO,
    EFECTOS,
    EJECUCION,
    MUNICIONES,
    ESPOLETAS,
    fmtDist,
    distanciaM,
    desplazar,
    utm,
    mgrs,
    coordenadas,
    normalizarPlan,
    mediosDeApoyo,
    evaluar,
    evaluarEnemigos,
    siguienteNumero,
    nuevoBlanco,
    editarBlanco,
    borrarBlanco,
    editarMedio,
    geometria,
    dimensionesTxt,
    filasMatriz,
    documentoHTML,
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = modelo
    return
  }

  // ═══════════════════════════ VISTA (navegador) ═══════════════════════════
  const doc = global.document
  const esc = escHtml
  const r6 = (x) => Math.round(x * 1e6) / 1e6

  let puente = null // lo último que mandó la Mesa
  let raiz = null // el contenedor del panel (dentro de la pestaña «🔥 Fuegos»)
  let modoPedido = false // con el panel montado, la Mesa entra en «modo fuegos»
  let capa = null // capas de Leaflet del plan
  let refs = { blancos: new Map(), anillos: new Map() }
  let ultimo = null // lo que se calculó en el último dibujo
  let teclado = null
  let cartel = null
  let ultimoToque = null
  let dblPrevio = null
  const vista = { marcando: false, ubicando: null, sel: null, verFueraEnemigos: true, borrador: {}, cursorPrevio: '' }

  const mesa = () => global.__mesaFuegos || {}
  const Lf = () => mesa().Rt || global.L || null
  const mapa = () => global.__mapa2d || null
  const planActual = () => normalizarPlan(puente && puente.plan)

  function datos() {
    const plan = planActual()
    const { grupos, medios } = mediosDeApoyo({
      unidades: (puente && puente.unidades) || [],
      todas: (puente && puente.todas) || [],
      orgTarea: (puente && puente.orgTarea) || [],
      plan,
      mesa: mesa(),
    })
    return (ultimo = { plan, grupos, medios })
  }

  // Todo cambio pasa por React (setPlan con la función): así nunca se pisa un cambio anterior.
  function cambiar(fn) {
    if (!puente || !puente.setPlan) return
    puente.setPlan((prev) => fn(normalizarPlan(prev)))
  }

  function pedirModo(on) {
    modoPedido = on
    const f = puente && puente.setModo
    if (f) Promise.resolve().then(() => f(modoPedido))
  }

  function pedirCota(id, lng, lat) {
    const c = mesa().cota
    if (!c) return
    Promise.resolve(c(lng, lat))
      .then((v) => {
        if (v == null || !Number.isFinite(v)) return
        cambiar((p) => {
          const b = p.blancos.find((x) => x.id === id)
          return b && b.lng === r6(lng) && b.lat === r6(lat) ? editarBlanco(p, id, { cota: Math.round(v) }) : p
        })
      })
      .catch(() => {})
  }

  // ─── Marcar en la carta ───
  function empezar(tipo, medioId) {
    const m = mapa()
    if (!m) {
      global.alert('La carta todavía no está lista.')
      return
    }
    terminar(false)
    vista.marcando = tipo === 'blanco'
    vista.ubicando = tipo === 'medio' ? medioId : null
    m.on('preclick', alTocarCarta)
    const c = m.getContainer()
    vista.cursorPrevio = c.style.cursor
    c.style.cursor = 'crosshair'
    dblPrevio = m.doubleClickZoom && m.doubleClickZoom.enabled()
    if (dblPrevio) m.doubleClickZoom.disable()
    teclado = (e) => {
      if (e.key === 'Escape') terminar()
    }
    doc.addEventListener('keydown', teclado)
    const md = medioId && ultimo ? ultimo.medios.find((x) => x.id === medioId) : null
    mostrarCartel(
      vista.marcando
        ? '🎯 Tocá la carta donde va cada concentración (se numeran solas). <b>Esc</b> o «✋ Terminar de marcar» para salir.'
        : `📍 Tocá la carta donde va la posición de fuego de <b>${esc(md ? md.nombreCompleto : 'la pieza')}</b>. <b>Esc</b> cancela.`,
    )
    pintar()
  }

  function terminar(repintar = true) {
    const m = mapa()
    if (m) {
      m.off('preclick', alTocarCarta)
      if (vista.marcando || vista.ubicando) m.getContainer().style.cursor = vista.cursorPrevio || ''
      if (dblPrevio && m.doubleClickZoom) m.doubleClickZoom.enable()
    }
    dblPrevio = null
    if (teclado) doc.removeEventListener('keydown', teclado)
    teclado = null
    vista.marcando = false
    vista.ubicando = null
    quitarCartel()
    if (repintar) pintar()
  }

  function alTocarCarta(e) {
    const o = e && e.originalEvent
    if (!e || !e.latlng || (o && o.button === 2)) return
    const t = o && o.target
    if (t && t.closest && t.closest('.pf-marca, .pf-pos')) return // una marca del plan: la maneja ella
    // El segundo toque de un doble clic no marca otra concentración encima.
    const ahora = Date.now()
    const pt = e.containerPoint || { x: 0, y: 0 }
    if (ultimoToque && ahora - ultimoToque.t < 450 && Math.hypot(pt.x - ultimoToque.x, pt.y - ultimoToque.y) < 12) return
    ultimoToque = { t: ahora, x: pt.x, y: pt.y }
    const ll = [r6(e.latlng.lng), r6(e.latlng.lat)]
    if (vista.ubicando) {
      const id = vista.ubicando
      terminar(false)
      cambiar((p) => editarMedio(p, id, { pos: ll }))
      pintar()
      return
    }
    if (!vista.marcando) return
    crearBlanco(ll)
  }

  function crearBlanco(ll, extra = {}) {
    const ahora = Date.now()
    const id = `pf-${ahora}-${Math.floor(Math.random() * 1e6).toString(36)}`
    cambiar((p) => nuevoBlanco(p, ll, { ...extra, id }, ahora).plan)
    vista.sel = id
    selDesde = ahora
    pedirCota(id, ll[0], ll[1])
    pintar()
  }

  function mostrarCartel(html) {
    quitarCartel()
    cartel = doc.createElement('div')
    cartel.className = 'pf-cartel'
    cartel.innerHTML = html
    doc.body.appendChild(cartel)
  }
  function quitarCartel() {
    if (cartel) cartel.remove()
    cartel = null
  }

  // ─── Carta ───
  const cruz = (clase) =>
    `<svg class="${clase}" width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path class="pf-halo" d="M13 2V24M2 13H24"/><path class="pf-trazo" d="M13 2V24M2 13H24"/></svg>`

  function iconoBlanco(b, ev) {
    const L = Lf()
    return L.divIcon({
      className: `pf-marca${ev.fuera ? ' pf-fuera' : ''}${vista.sel === b.id && raiz ? ' pf-sel' : ''}`,
      html: `${cruz('pf-cruz')}<span class="pf-num">${esc(b.num)}${ev.fuera ? ' ⚠' : ''}</span>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    })
  }

  function simboloSvg(md, ancho) {
    const S = global.__mesaSimbolos
    try {
      if (S && S.eN) return S.eN(md.simbolo, ancho, md.color)
    } catch {}
    return ''
  }

  function iconoPos(md) {
    const L = Lf()
    return L.divIcon({
      className: 'pf-pos',
      html: `<div class="pf-pos-in" style="border-color:${md.color}">${simboloSvg(md, 24) || '◎'}</div><span class="pf-pos-rot" style="color:${md.color}">${esc(md.nombre)}</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
  }

  function tooltipBlanco(b, ev) {
    const co = coordenadas(b.lng, b.lat)
    return (
      `<div class="pf-tt"><b>${esc(b.num)}</b> · ${esc(nomDe(TIPOS_FUEGO, b.tipo))} · ${esc(nomDe(EFECTOS, b.efecto))}` +
      (b.descripcion ? `<br>${esc(b.descripcion)}` : '') +
      `<br>MGRS ${esc(co.mgrs)}${b.cota != null ? ` · cota ${Math.round(b.cota)} m` : ''}` +
      (ev.fuera
        ? `<br><span class="pf-tt-fuera">⚠ FUERA DE ALCANCE — ${esc(ev.consejo)}</span>`
        : `<br>Lo bate: ${esc(ev.asignado ? ev.asignado.nombreCompleto : ev.alcanzan.map((f) => f.medio.nombreCompleto).join(' · '))}`) +
      '</div>'
    )
  }

  function dibujarForma(g, b, col) {
    const L = Lf()
    const geo = geometria(b)
    const est = { color: col, weight: 2.6, fill: true, fillColor: col, fillOpacity: 0.1, interactive: false }
    const halo = { color: '#ffffff', weight: 5.5, opacity: 0.55, fill: false, interactive: false }
    const ll = (pts) => pts.map(([x, y]) => [y, x])
    if (geo.tipo === 'circulo')
      return { halo: L.circle([b.lat, b.lng], { ...halo, radius: geo.radio }).addTo(g), forma: L.circle([b.lat, b.lng], { ...est, radius: geo.radio }).addTo(g) }
    if (geo.tipo === 'poligono') return { halo: L.polygon(ll(geo.puntos), halo).addTo(g), forma: L.polygon(ll(geo.puntos), est).addTo(g) }
    if (geo.tipo === 'linea')
      return { halo: L.polyline(ll(geo.puntos), { ...halo, weight: 8 }).addTo(g), forma: L.polyline(ll(geo.puntos), { ...est, weight: 4.5, fill: false }).addTo(g) }
    return { halo: null, forma: null }
  }

  function moverForma(r, lng, lat) {
    const geo = geometria({ ...r.b, lng, lat })
    const ll = (pts) => pts.map(([x, y]) => [y, x])
    for (const capaForma of [r.halo, r.forma]) {
      if (!capaForma) continue
      if (geo.tipo === 'circulo') capaForma.setLatLng([lat, lng])
      else capaForma.setLatLngs(ll(geo.puntos))
    }
  }

  function recolorear(medios) {
    for (const r of refs.blancos.values()) {
      const ev = evaluar([r.b.lng, r.b.lat], medios, r.b.medio)
      const col = ev.fuera ? FUCSIA : NEGRO
      if (r.forma) r.forma.setStyle({ color: col, fillColor: col })
      const el = r.mk.getElement && r.mk.getElement()
      if (el) el.classList.toggle('pf-fuera', ev.fuera)
    }
  }

  function dibujar() {
    if (capa) {
      try {
        capa.remove()
      } catch {}
      capa = null
    }
    refs = { blancos: new Map(), anillos: new Map() }
    const L = Lf()
    const m = mapa()
    if (!L || !m || !puente) return
    const d = datos()
    const abierta = !!raiz
    const g = L.layerGroup()

    // 1) Alcance de los medios marcados y sus posiciones de fuego.
    for (const md of d.medios) {
      if (!md.pos) continue
      const ll = [md.pos[1], md.pos[0]]
      if (md.ver && md.alcance) {
        const c = L.circle(ll, { radius: md.alcance.m, color: md.color, weight: 2.2, dashArray: '10 6', fill: true, fillColor: md.color, fillOpacity: 0.035, interactive: false }).addTo(g)
        const cmin = md.alcanceMin ? L.circle(ll, { radius: md.alcanceMin, color: md.color, weight: 1.4, dashArray: '2 6', fill: false, interactive: false }).addTo(g) : null
        const n = desplazar(md.pos, md.alcance.m, 0)
        const rot = L.marker([n[1], n[0]], {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: 'pf-rot-anillo',
            html: `<span style="color:${md.color}">${esc(md.corto)} · ${fmtDist(md.alcance.m)}${md.alcanceMin ? ` (mín. ${fmtDist(md.alcanceMin)})` : ''}</span>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
        }).addTo(g)
        refs.anillos.set(md.id, { c, cmin, rot })
      }
      if (!abierta && !md.ver) continue
      const mk = L.marker(ll, { draggable: abierta, keyboard: false, zIndexOffset: 1500, icon: iconoPos(md) })
      mk.bindTooltip(
        `<div class="pf-tt"><b>${esc(md.nombreCompleto)}</b><br>${md.alcance ? `${esc(md.alcance.sistema)} · ${fmtDist(md.alcance.m)}` : 'Sin alcance conocido'}<br>${abierta ? 'Arrastrala para cambiar la posición de fuego.' : 'Posición de fuego.'}</div>`,
        { direction: 'top', offset: [0, -14], opacity: 0.96 },
      )
      mk.on('click', (e) => L.DomEvent.stop(e))
      if (abierta) {
        mk.on('drag', () => {
          const p = mk.getLatLng()
          const r = refs.anillos.get(md.id)
          if (r) {
            r.c.setLatLng(p)
            if (r.cmin) r.cmin.setLatLng(p)
            const n = desplazar([p.lng, p.lat], md.alcance.m, 0)
            r.rot.setLatLng([n[1], n[0]])
          }
          recolorear(d.medios.map((x) => (x.id === md.id ? { ...x, pos: [p.lng, p.lat] } : x)))
        })
        mk.on('dragend', () => {
          const p = mk.getLatLng()
          cambiar((pl) => editarMedio(pl, md.id, { pos: [r6(p.lng), r6(p.lat)] }))
        })
      }
      mk.addTo(g)
    }

    // 2) Concentraciones: cruz negra; fucsia si queda fuera de alcance.
    if (d.plan.verEnCarta || abierta)
      for (const b of d.plan.blancos) {
        const ev = evaluar([b.lng, b.lat], d.medios, b.medio)
        const { halo, forma } = dibujarForma(g, b, ev.fuera ? FUCSIA : NEGRO)
        const mk = L.marker([b.lat, b.lng], { draggable: abierta, keyboard: false, zIndexOffset: 1600, icon: iconoBlanco(b, ev) })
        mk.bindTooltip(tooltipBlanco(b, ev), { direction: 'top', offset: [0, -12], opacity: 0.97 })
        mk.on('click', (e) => {
          L.DomEvent.stop(e)
          if (!raiz) return
          vista.sel = b.id
          pintar()
          dibujar()
          const ed = raiz && raiz.querySelector('.pf-editor')
          if (ed && ed.scrollIntoView) ed.scrollIntoView({ block: 'nearest' })
        })
        const r = { b, halo, forma, mk }
        if (abierta) {
          mk.on('drag', () => {
            const p = mk.getLatLng()
            moverForma(r, p.lng, p.lat)
          })
          mk.on('dragend', () => {
            const p = mk.getLatLng()
            cambiar((pl) => editarBlanco(pl, b.id, { lng: p.lng, lat: p.lat, cota: null }))
            pedirCota(b.id, p.lng, p.lat)
          })
        }
        mk.addTo(g)
        refs.blancos.set(b.id, r)
      }

    // 3) Con la pestaña abierta: los blancos enemigos del calco que ningún medio alcanza, en fucsia.
    if (abierta && vista.verFueraEnemigos)
      for (const e of evaluarEnemigos(puente.unidades, d.medios, mesa())) {
        if (!e.fuera) continue
        L.circleMarker([e.eno.lat, e.eno.lng], { radius: 24, color: FUCSIA, weight: 3, dashArray: '5 4', fill: false, interactive: false }).addTo(g)
        L.marker([e.eno.lat, e.eno.lng], {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({ className: 'pf-eno-fuera', html: '<span>FUERA DE ALCANCE</span>', iconSize: [0, 0], iconAnchor: [0, 0] }),
        }).addTo(g)
      }

    g.addTo(m)
    capa = g
  }

  // ─── Panel ───
  const opciones = (lista, actual) => lista.map((x) => `<option value="${esc(x.id)}"${x.id === actual ? ' selected' : ''}>${esc(x.nom)}</option>`).join('')

  function valor(id, k, modelo) {
    const clave = `${id}|${k}`
    return clave in vista.borrador ? vista.borrador[clave] : modelo == null ? '' : modelo
  }

  function selectSistema(md) {
    const cat = (mesa().p5 || []).filter((s) => GRUPOS_SISTEMA.includes(s.gr))
    const grupos = [...new Set(cat.map((s) => s.gr))]
    let html = grupos
      .map(
        (gr) =>
          `<optgroup label="${esc(gr)}">${cat
            .filter((s) => s.gr === gr)
            .map((s) => `<option value="${esc(s.id)}"${s.id === md.sistemaId ? ' selected' : ''}>${esc(s.nom)} · ${fmtDist(s.m)}</option>`)
            .join('')}</optgroup>`,
      )
      .join('')
    if (md.alcance && !cat.some((s) => s.id === md.sistemaId))
      html = `<option value="" selected>${esc(md.alcance.sistema)} · ${fmtDist(md.alcance.m)}</option>` + html
    if (!md.alcance) html = '<option value="" selected>— elegí el sistema de armas —</option>' + html
    return `<select class="pf-sel-sis" data-k="sistema" data-id="${esc(md.id)}" title="Sistema de armas (catálogo de la Mesa)">${html}</select>`
  }

  function htmlMedio(md) {
    const co = md.pos ? coordenadas(md.pos[0], md.pos[1]) : null
    const fuente = md.alcance
      ? md.alcance.fuente === 'reglamento'
        ? `<span class="pf-chapa pf-reg" title="${esc(md.alcance.cita || '')}">📕 reglamento</span>`
        : md.alcance.fuente === 'g3'
          ? '<span class="pf-chapa pf-g3">✎ del G-3</span>'
          : `<span class="pf-chapa pf-est" title="${esc(md.alcance.nota || md.alcance.cita || 'Estimación editable')}">✎ estimación</span>`
      : ''
    return `<div class="pf-medio${md.pos ? '' : ' pf-sinpos'}">
      <label class="pf-ver" title="Ver en la carta hasta dónde llegan sus fuegos"><input type="checkbox" data-acc="ver" data-id="${esc(md.id)}"${md.ver ? ' checked' : ''}${md.pos && md.alcance ? '' : ' disabled'}><i style="background:${md.color}"></i></label>
      <div class="pf-medio-cuerpo">
        <div class="pf-medio-nom">${esc(md.nombre)}${md.de ? ` <span class="pf-de">· ${esc(md.de)}</span>` : ''}</div>
        <div class="pf-medio-sis">${selectSistema(md)}<b>${md.alcance ? fmtDist(md.alcance.m) : '—'}</b>${md.alcanceMin ? `<span class="pf-min" title="Alcance mínimo (${esc((md.alcance && md.alcance.cita) || '')})">mín. ${fmtDist(md.alcanceMin)}</span>` : ''}${fuente}</div>
        <div class="pf-medio-pos">${
          co
            ? `📍 <span class="pf-mono">${esc(co.mgrs)}</span> <span class="pf-de">${md.posMovida ? '(posición de fuego puesta por el G-3)' : `(${esc(md.posOrigen)})`}</span>`
            : '<span class="pf-alerta">Sin posición de fuego</span>'
        }
          <button class="pf-mini" data-acc="ubicar" data-id="${esc(md.id)}" title="Tocá después la carta donde va la posición de fuego (también se puede arrastrar)">📍 Ubicar</button>${
            md.posMovida ? `<button class="pf-mini" data-acc="pos-reset" data-id="${esc(md.id)}" title="Volver a la posición de la ficha">↺</button>` : ''
          }</div>
      </div>
    </div>`
  }

  function htmlEditor(b, d) {
    const ev = evaluar([b.lng, b.lat], d.medios, b.medio)
    const co = coordenadas(b.lng, b.lat)
    const id = esc(b.id)
    const inp = (k, ph = '', tipo = 'text', extra = '') =>
      `<input type="${tipo}" data-k="${k}" data-id="${id}" value="${esc(valor(b.id, k, b[k]))}" placeholder="${esc(ph)}"${extra}>`
    const dims =
      b.forma === 'circular'
        ? `<label>Radio (m)${inp('radioM', '100', 'number', ' min="0" step="10"')}</label>`
        : b.forma === 'rectangular'
          ? `<label>Largo (m)${inp('largoM', '400', 'number', ' min="0" step="10"')}</label><label>Ancho (m)${inp('anchoM', '200', 'number', ' min="0" step="10"')}</label><label>Orientación (°)${inp('orientacion', '0', 'number', ' min="0" max="359" step="1"')}</label>`
          : b.forma === 'lineal'
            ? `<label>Largo (m)${inp('largoM', '400', 'number', ' min="0" step="10"')}</label><label>Orientación (°)${inp('orientacion', '0', 'number', ' min="0" max="359" step="1"')}</label>`
            : ''
    const filas = new Map(ev.filas.map((f) => [f.medio.id, f]))
    const optMedios = d.medios
      .map((m) => {
        const f = filas.get(m.id)
        const txt = !f ? (m.pos ? 'sin alcance conocido' : 'sin posición') : f.alcanza ? `✓ a ${fmtDist(f.d)}` : f.cerca ? `✗ muy cerca (${fmtDist(f.d)})` : `✗ a ${fmtDist(f.d)}, le faltan ${fmtDist(f.falta)}`
        return `<option value="${esc(m.id)}"${m.id === b.medio ? ' selected' : ''}>${esc(m.nombreCompleto)} — ${esc(txt)}</option>`
      })
      .join('')
    return `<div class="pf-editor${ev.fuera ? ' pf-fuera' : ''}">
      <div class="pf-grid2">
        <label>Designación${inp('num', 'AB-010')}</label>
        <label>Cota (m)${inp('cota', 'se calcula sola', 'number', ' step="1"')}</label>
      </div>
      <div class="pf-coords">
        <div><span>MGRS</span><b class="pf-mono">${esc(co.mgrs)}</b></div>
        <div><span>UTM WGS-84</span><b class="pf-mono">${esc(co.utm)}</b></div>
        <div><span>Geográficas</span><b class="pf-mono">${esc(co.geo)}</b></div>
      </div>
      <label>Descripción del blanco${inp('descripcion', 'Qué hay: p. ej. «sección de morteros enemiga en posición»')}</label>
      <div class="pf-grid2">
        <label>Tipo de fuego<select data-k="tipo" data-id="${id}">${opciones(TIPOS_FUEGO, b.tipo)}</select></label>
        <label>Efecto buscado<select data-k="efecto" data-id="${id}">${opciones(EFECTOS, b.efecto)}</select></label>
      </div>
      <div class="pf-grid2">
        <label title="${esc((FORMAS.find((f) => f.id === b.forma) || {}).ayuda || '')}">Forma del blanco<select data-k="forma" data-id="${id}">${opciones(FORMAS, b.forma)}</select></label>
        ${dims ? `<div class="pf-dims">${dims}</div>` : '<div></div>'}
      </div>
      <label>Medio que lo bate<select data-k="medio" data-id="${id}"><option value="">— sin asignar: se evalúa contra todos los medios —</option>${optMedios}</select></label>
      <div class="pf-estado${ev.fuera ? ' pf-fuera' : ''}">${
        ev.fuera
          ? `⚠ <b>FUERA DE ALCANCE</b> — ${esc(ev.consejo)}`
          : ev.asignado
            ? `✓ ${esc(ev.asignado.nombreCompleto)} lo alcanza (a ${fmtDist(ev.fila.d)}).`
            : `✓ Lo alcanzan: ${esc(ev.alcanzan.map((f) => f.medio.nombreCompleto).join(' · '))}. Asignale uno.`
      }</div>
      <div class="pf-grid2">
        <label title="${esc((EJECUCION.find((x) => x.id === b.ejecucion) || {}).ayuda || '')}">Ejecución<select data-k="ejecucion" data-id="${id}">${opciones(EJECUCION, b.ejecucion)}</select></label>
        <label>Hora / momento${inp('hora', 'H−10 a H−5 · D+1 0500')}</label>
      </div>
      <label>Fase / evento${inp('fase', 'p. ej. FASE II · al cruzar la LF')}</label>
      <div class="pf-grid3">
        <label>Munición<input type="text" list="pf-municiones" data-k="municion" data-id="${id}" value="${esc(valor(b.id, 'municion', b.municion))}" placeholder="Explosiva (HE)"></label>
        <label>Espoleta<input type="text" list="pf-espoletas" data-k="espoleta" data-id="${id}" value="${esc(valor(b.id, 'espoleta', b.espoleta))}" placeholder="Percusión"></label>
        <label>Volumen${inp('volumen', '3 ráfagas')}</label>
      </div>
      <label>Quién lo observa${inp('observador', 'Observador adelantado / ficha que observa')}</label>
      <label>Propósito${inp('proposito', 'Para qué: p. ej. «impedir que refuerce la posición»')}</label>
      <label>Observaciones / restricciones<textarea data-k="obs" data-id="${id}" rows="2" placeholder="Medidas de coordinación, restricciones, reglaje…">${esc(valor(b.id, 'obs', b.obs))}</textarea></label>
      <div class="pf-fila-btn">
        <button class="pf-btn" data-acc="ir" data-id="${id}">🔍 Ver en la carta</button>
        <button class="pf-btn pf-peligro" data-acc="borrar" data-id="${id}">🗑 Borrar</button>
        <button class="pf-btn" data-acc="cerrar-ed">✓ Listo</button>
      </div>
    </div>`
  }

  function htmlPanel() {
    const d = datos()
    const evs = d.plan.blancos.map((b) => ({ b, ev: evaluar([b.lng, b.lat], d.medios, b.medio) }))
    const fueraN = evs.filter((x) => x.ev.fuera).length
    const enemigos = evaluarEnemigos((puente && puente.unidades) || [], d.medios, mesa())
    const enFuera = enemigos.filter((e) => e.fuera).length
    const conAlcance = d.medios.filter((m) => m.pos && m.alcance)
    const todosVer = conAlcance.length > 0 && conAlcance.every((m) => m.ver)
    let h = ''
    h += '<div class="pf-titulo">🔥 Plan de fuegos</div>'
    h += '<div class="pf-modo">🎯 <b>Modo fuegos:</b> con esta pestaña abierta, tocar la carta <b>no</b> activa el Área de Operaciones ni las demás capas. Sólo se planifican fuegos.</div>'
    h += vista.marcando
      ? '<button class="pf-grande pf-on" data-acc="terminar">✋ Terminar de marcar <small>(Esc)</small></button>'
      : '<button class="pf-grande" data-acc="marcar">🎯 Marcar concentraciones en la carta</button>'
    if (vista.ubicando) h += '<div class="pf-aviso">📍 Tocá la carta donde va la posición de fuego. <button class="pf-mini" data-acc="terminar">Cancelar</button></div>'

    // Medios
    h += `<div class="pf-rotulo">Medios de apoyo de fuego <span>(${d.medios.length})</span></div>`
    if (!d.medios.length)
      h +=
        '<div class="pf-vacio">No hay artillería, morteros ni lanzacohetes en el calco ni en las organizaciones de la tarea. Colocá una unidad de apoyo de fuego en <b>🪖 Unidades</b> o integrá sus piezas en una fuerza de tarea (<b>🧩 Agrupar</b>).</div>'
    else {
      h += `<label class="pf-chk"><input type="checkbox" data-acc="ver-todos"${todosVer ? ' checked' : ''}> Ver en la carta el alcance de todos</label>`
      for (const g of d.grupos)
        h += `<div class="pf-grupo"><div class="pf-grupo-tit">${g.chip ? `<span class="pf-chip">${esc(g.chip)}</span>` : ''}${esc(g.titulo)}</div><div class="pf-grupo-sub">${esc(g.sub)}</div>${g.medios.map(htmlMedio).join('')}</div>`
      h += '<div class="pf-pie">Marcá una pieza (☐) para ver su alcance. Su posición de fuego se arrastra en la carta: los blancos se ponen <b class="pf-fucsia">fucsia</b> cuando quedan afuera y negros cuando vuelven a quedar adentro.</div>'
    }

    // Concentraciones
    h += `<div class="pf-rotulo">Concentraciones del plan <span>(${d.plan.blancos.length}${fueraN ? ` · <b class="pf-fucsia">${fueraN} fuera de alcance</b>` : ''})</span></div>`
    if (!d.plan.blancos.length) h += '<div class="pf-pie">Todavía no hay concentraciones. Apretá «🎯 Marcar concentraciones en la carta» y tocá donde va cada una.</div>'
    for (const { b, ev } of evs) {
      const sel = vista.sel === b.id
      h += `<button class="pf-blanco${ev.fuera ? ' pf-fuera' : ''}${sel ? ' pf-sel' : ''}" data-acc="sel" data-id="${esc(b.id)}">
        <span class="pf-blanco-cab">${cruz('pf-cruz-chica')}<b>${esc(b.num)}</b><span class="pf-blanco-tipo">${esc(nomDe(TIPOS_FUEGO, b.tipo))} · ${esc(nomDe(EFECTOS, b.efecto))}</span></span>
        ${b.descripcion ? `<span class="pf-blanco-desc">${esc(b.descripcion)}</span>` : ''}
        <span class="pf-blanco-est">${ev.fuera ? `⚠ FUERA DE ALCANCE — ${esc(ev.consejo)}` : ev.asignado ? `✓ Lo bate ${esc(ev.asignado.nombreCompleto)}` : `✓ Lo alcanzan ${ev.alcanzan.length} medio(s) · sin asignar`}</span>
      </button>`
      if (sel) h += htmlEditor(b, d)
    }
    if (d.plan.blancos.length)
      h += `<div class="pf-fila-btn">
        <button class="pf-btn" data-acc="word">⬇️ Lista de blancos (Word)</button>
        <label class="pf-chk"><input type="checkbox" data-acc="ver-en-carta"${d.plan.verEnCarta ? ' checked' : ''}> Dejarlas en la carta al cerrar esta pestaña</label>
      </div>
      <div class="pf-pie">La hoja <b>«Matriz de ejecución de apoyo de fuegos»</b> (📄 Documentos) se llena con estas concentraciones al tocar «🌱 Traer del calco lo que falte».</div>`

    // Blancos enemigos del calco
    h += '<div class="pf-rotulo">Blancos enemigos del calco</div>'
    if (!enemigos.length) h += '<div class="pf-pie">Colocá el dispositivo enemigo (fichas rojas) y acá te digo cuáles quedan dentro del alcance de tus medios de apoyo de fuego.</div>'
    else {
      h += `<div class="pf-resumen"><span><b class="pf-verde">${enemigos.length - enFuera}</b> alcanzables</span><span><b class="pf-fucsia">${enFuera}</b> fuera de alcance</span><span><b>${d.medios.length}</b> medios de apoyo</span></div>`
      h += `<label class="pf-chk"><input type="checkbox" data-acc="ver-fuera"${vista.verFueraEnemigos ? ' checked' : ''}> Marcar en la carta, en fucsia, los que quedan fuera de alcance</label>`
      for (const e of enemigos)
        h += `<div class="pf-eno${e.fuera ? ' pf-fuera' : ''}">
          <div class="pf-eno-cab"><span>${esc(e.nombre)}</span>${e.fuera ? '<b class="pf-fucsia">✗ fuera de alcance</b>' : '<b class="pf-verde">✓ batible</b>'}</div>
          <div class="pf-pie-chico">${e.fuera ? esc(e.consejo) : `Lo alcanzan: ${esc(e.alcanzan.map((f) => f.medio.nombreCompleto).join(' · '))}`}</div>
          <button class="pf-mini" data-acc="conc-eno" data-id="${esc(e.eno.id)}">🎯 Concentración sobre este blanco</button>
        </div>`
    }
    h += `<datalist id="pf-municiones">${MUNICIONES.map((x) => `<option value="${esc(x)}">`).join('')}</datalist><datalist id="pf-espoletas">${ESPOLETAS.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`
    return h
  }

  function pintar() {
    if (!raiz) return
    const a = doc.activeElement
    const foco = a && raiz.contains(a) && a.dataset && a.dataset.k ? { k: a.dataset.k, id: a.dataset.id || '', s: a.selectionStart, e: a.selectionEnd } : null
    raiz.innerHTML = htmlPanel()
    if (foco) {
      const el = [...raiz.querySelectorAll('[data-k]')].find((x) => x.dataset.k === foco.k && (x.dataset.id || '') === foco.id)
      if (el) {
        el.focus()
        try {
          if (foco.s != null) el.setSelectionRange(foco.s, foco.e)
        } catch {}
      }
    }
  }

  function bajarWord() {
    const d = datos()
    const html = documentoHTML(d.plan, d.medios, { ejercicio: puente && puente.ejercicio, unidad: puente && puente.unidad })
    const blob = new Blob(['﻿', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = doc.createElement('a')
    a.href = url
    a.download = `Lista_de_blancos_${String((puente && puente.ejercicio) || 'plan_de_fuegos').replace(/[^a-zA-Z0-9_.-]+/g, '_').slice(0, 50)}.doc`
    doc.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function alClic(e) {
    const el = e.target.closest('[data-acc]')
    if (!el || !raiz.contains(el) || el.tagName === 'INPUT') return
    const acc = el.dataset.acc
    const id = el.dataset.id
    if (acc === 'marcar') empezar('blanco')
    else if (acc === 'terminar') terminar()
    else if (acc === 'ubicar') empezar('medio', id)
    else if (acc === 'pos-reset') cambiar((p) => editarMedio(p, id, { pos: null }))
    else if (acc === 'sel') {
      vista.sel = vista.sel === id ? null : id
      pintar()
      dibujar()
    } else if (acc === 'cerrar-ed') {
      vista.sel = null
      pintar()
      dibujar()
    } else if (acc === 'borrar') {
      const b = planActual().blancos.find((x) => x.id === id)
      if (b && global.confirm(`¿Borrar la concentración ${b.num}?`)) {
        vista.sel = null
        cambiar((p) => borrarBlanco(p, id))
      }
    } else if (acc === 'ir') {
      const b = planActual().blancos.find((x) => x.id === id)
      if (b && puente && puente.irA) puente.irA({ lat: b.lat, lng: b.lng })
    } else if (acc === 'conc-eno') {
      const u = ((puente && puente.unidades) || []).find((x) => x && String(x.id) === id)
      if (u) crearBlanco([r6(u.lng), r6(u.lat)], { descripcion: mesa().js ? mesa().js(u) : u.designacion || '' })
    } else if (acc === 'word') bajarWord()
  }

  function alCambio(e) {
    const el = e.target
    const acc = el.dataset && el.dataset.acc
    if (acc === 'ver') return cambiar((p) => editarMedio(p, el.dataset.id, { ver: el.checked || null }))
    if (acc === 'ver-todos') {
      const ids = (ultimo ? ultimo.medios : []).filter((m) => m.pos && m.alcance).map((m) => m.id)
      return cambiar((p) => ids.reduce((q, id) => editarMedio(q, id, { ver: el.checked || null }), p))
    }
    if (acc === 'ver-fuera') {
      vista.verFueraEnemigos = el.checked
      return dibujar()
    }
    if (acc === 'ver-en-carta') return cambiar((p) => ({ ...p, verEnCarta: el.checked }))
    const k = el.dataset && el.dataset.k
    const id = el.dataset && el.dataset.id
    if (!k || !id) return
    delete vista.borrador[`${id}|${k}`]
    if (k === 'sistema') return cambiar((p) => editarMedio(p, id, { sistema: el.value || null }))
    const v = el.value
    cambiar((p) => editarBlanco(p, id, { [k]: k === 'medio' ? v || null : v }))
  }

  function alEscribir(e) {
    const el = e.target
    const k = el.dataset && el.dataset.k
    if (k && el.dataset.id && el.tagName !== 'SELECT') vista.borrador[`${el.dataset.id}|${k}`] = el.value
  }

  // ─── Lo que llama la Mesa ───
  function sincronizar(p) {
    puente = p || null
    if (puente && puente.setModo && !!puente.modo !== modoPedido) pedirModo(modoPedido)
    if (vista.sel && !planActual().blancos.some((b) => b.id === vista.sel) && !pendienteSel()) vista.sel = null
    dibujar()
    pintar()
  }
  // Una concentración recién marcada todavía puede no haber llegado desde React.
  let selDesde = 0
  const pendienteSel = () => Date.now() - selDesde < 1500

  function montar(el) {
    if (el === raiz) return
    if (raiz) desmontar()
    if (!el) return
    raiz = el
    el.classList.add('pf')
    el.addEventListener('click', alClic)
    el.addEventListener('change', alCambio)
    el.addEventListener('input', alEscribir)
    pedirModo(true)
    pintar()
    dibujar()
  }

  function desmontar() {
    terminar(false)
    if (raiz) {
      raiz.removeEventListener('click', alClic)
      raiz.removeEventListener('change', alCambio)
      raiz.removeEventListener('input', alEscribir)
      raiz.innerHTML = ''
    }
    raiz = null
    vista.borrador = {}
    pedirModo(false)
    dibujar()
  }

  function filasMatrizActual() {
    if (!puente) return []
    const d = datos()
    return filasMatriz(d.plan, d.medios, mesa().mK || [])
  }

  global.MesaFuegos = {
    sincronizar,
    montar,
    filasMatriz: filasMatrizActual,
    modelo,
    // El plan tal como lo tiene la Mesa (lo último que llegó con sincronizar).
    get plan() {
      return puente ? planActual() : null
    },
    get abierto() {
      return !!raiz
    },
    get marcando() {
      return vista.marcando
    },
  }
})(typeof window !== 'undefined' ? window : globalThis)
