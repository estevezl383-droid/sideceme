/*
 * Mesa del EM — ESTUDIO DOCTRINARIO (material didáctico)
 *
 * Dos vistas separadas, que se abren con «🎓 Estudio» en la barra de la Mesa:
 *
 *   🧩 ORGANIZACIÓN ACADÉMICA
 *      · Fuerzas de tarea y unidades puras (ingeniería, artillería, caballería)
 *        conviviendo con las agrupaciones que ya existían.
 *      · Separa el TIPO de cada elemento (qué es: su arma y su escalón) de su
 *        PERTENENCIA (a qué organización está integrado, o si sigue con su
 *        unidad orgánica). Nadie está obligado a integrarse en una FT.
 *      · El docente cambia la pertenencia a mano. Un elemento nunca queda en
 *        dos organizaciones: al moverlo se saca de la otra, y si ya venía
 *        repetido (datos viejos) se avisa y se corrige con un botón.
 *      · Usa la MISMA «Organización de la tarea» del ejercicio (orgTarea):
 *        no cambia identificadores ni borra campos; sólo agrega `clase`
 *        ("ft" | "pura" | "agrupacion") y `arma` en las unidades puras.
 *      · Actividades académicas (pregunta, lectura, análisis doctrinario)
 *        vinculadas a mano a una unidad o a una organización. Se guardan con
 *        el ejercicio en `academico.actividades`. Son material de estudio: NO
 *        son órdenes ni asignan misiones, fuegos, barreras ni tareas.
 *
 *   📕 SIMBOLOGÍA DOCTRINARIA
 *      · Láminas didácticas sin carta ni coordenadas, con fichas que se tocan
 *        para ver su referencia y su estado de verificación
 *        (ver catalogo-simbologia.js).
 *
 * Lo que NO hace, a propósito: no asigna fuegos, barreras ni tareas por
 * posición, sector, alcance o disponibilidad; no recomienda empleo de fuerzas;
 * no selecciona objetivos ni calcula tiro; no vincula símbolos con unidades.
 *
 * La Mesa (compilado) le pasa los datos con MesaAcademica.sincronizar({...}) y
 * le presta sus dibujos de símbolos en window.__mesaSimbolos.
 */
;(function (global) {
  'use strict'

  // ═══════════════════════════ MODELO (sin DOM: se prueba en Node) ═══════════════════════════

  const CLASES = {
    ft: { id: 'ft', nom: 'Fuerza de tarea', corto: 'FT', ayuda: 'Organización para una tarea: puede reunir elementos de distintas armas.' },
    pura: { id: 'pura', nom: 'Unidad pura', corto: 'PURA', ayuda: 'Reúne elementos de UNA sola arma.' },
    agrupacion: { id: 'agrupacion', nom: 'Agrupación táctica', corto: 'AGR', ayuda: 'Como estaba antes: agrupación sin clase marcada.' },
  }
  const ARMAS_PURAS = [
    { id: 'ingenieria', nom: 'Ingeniería' },
    { id: 'artilleria', nom: 'Artillería' },
    { id: 'caballeria', nom: 'Caballería' },
  ]
  const TIPOS_ACT = {
    pregunta: { id: 'pregunta', nom: 'Pregunta', ico: '❓' },
    lectura: { id: 'lectura', nom: 'Lectura', ico: '📖' },
    analisis: { id: 'analisis', nom: 'Análisis doctrinario', ico: '🔎' },
  }
  const ESCALONES_ORG = ['seccion', 'compania', 'batallon', 'regimiento', 'brigada']

  // La clase de una organización. `ft` manda (así «🛡️ Convertir en Fuerza de
  // Tarea» del panel de siempre sigue funcionando); sin `clase` es una
  // agrupación como las de antes.
  const claseDe = (o) => (o && o.ft ? 'ft' : o && o.clase === 'pura' ? 'pura' : 'agrupacion')

  const esPropia = (u) => !!u && (u.tipo || 'unidad') === 'unidad' && u.bando !== 'enemigo' && u.bando !== 'enemigas' && !u.esAgrupacion
  const esEnemiga = (u) => !!u && (u.tipo || 'unidad') === 'unidad' && (u.bando === 'enemigo' || u.bando === 'enemigas')
  const unidadesPropias = (unidades) => (unidades || []).filter(esPropia)

  // Cada pieza con su unidad orgánica, en el orden del calco.
  function piezasDelCalco(ctx) {
    const lista = []
    const porId = new Map()
    for (const u of unidadesPropias(ctx.unidades)) {
      for (const p of ctx.piezasDe(u) || []) {
        const e = { pieza: p, unidad: u }
        lista.push(e)
        if (!porId.has(p.id)) porId.set(p.id, e)
      }
    }
    return { lista, porId }
  }

  // piezaId → [id de organización, …] (con repetidos si los hay).
  function ocurrencias(orgTarea) {
    const m = new Map()
    for (const o of orgTarea || []) for (const p of (o && o.piezas) || []) {
      if (!p || p.id == null) continue
      if (!m.has(p.id)) m.set(p.id, [])
      m.get(p.id).push(o.id)
    }
    return m
  }

  // A qué organización pertenece la pieza (la primera, si estuviera repetida).
  function pertenencia(orgTarea, piezaId) {
    for (const o of orgTarea || []) if (((o && o.piezas) || []).some((p) => p && p.id === piezaId)) return o.id
    return null
  }

  // Sólo se reemplazan las organizaciones que cambian; el resto queda igual (mismo objeto).
  function mapearCambios(orgTarea, fn) {
    let cambio = false
    const nuevo = (orgTarea || []).map((o) => {
      const r = fn(o)
      if (r !== o) cambio = true
      return r
    })
    return cambio ? nuevo : orgTarea
  }

  // Mueve una pieza a `destinoId` (o la deja con su unidad orgánica si es null).
  // Primero la saca de TODAS las organizaciones: así nunca queda repetida.
  function asignar(orgTarea, pieza, destinoId) {
    if (!pieza || pieza.id == null) return orgTarea
    if (destinoId != null && !(orgTarea || []).some((o) => o.id === destinoId)) throw new Error(`No existe la organización «${destinoId}».`)
    const donde = ocurrencias(orgTarea).get(pieza.id) || []
    if (destinoId == null ? !donde.length : donde.length === 1 && donde[0] === destinoId) return orgTarea // ya está así
    const sinElla = mapearCambios(orgTarea, (o) => {
      const ps = (o && o.piezas) || []
      return ps.some((p) => p && p.id === pieza.id) ? { ...o, piezas: ps.filter((p) => !p || p.id !== pieza.id) } : o
    })
    if (destinoId == null) return sinElla
    return sinElla.map((o) => (o.id === destinoId ? { ...o, piezas: [...(o.piezas || []), pieza] } : o))
  }

  // Corrige un repetido: la pieza queda sólo en `orgId` (y una sola vez).
  function dejarSoloEn(orgTarea, piezaId, orgId) {
    return mapearCambios(orgTarea, (o) => {
      const ps = (o && o.piezas) || []
      const n = ps.filter((p) => p && p.id === piezaId).length
      if (!n || (o.id === orgId && n === 1)) return o
      if (o.id !== orgId) return { ...o, piezas: ps.filter((p) => !p || p.id !== piezaId) }
      let visto = false
      return { ...o, piezas: ps.filter((p) => !(p && p.id === piezaId) || (!visto && (visto = true))) }
    })
  }

  function quitarDe(orgTarea, piezaId, orgId) {
    return mapearCambios(orgTarea, (o) =>
      o.id === orgId && (o.piezas || []).some((p) => p && p.id === piezaId) ? { ...o, piezas: o.piezas.filter((p) => !p || p.id !== piezaId) } : o,
    )
  }

  // Mismo formato de identificador que las agrupaciones de siempre («ag-<hora>-<n>»).
  function idNuevo(orgTarea, ahora) {
    const usados = new Set((orgTarea || []).map((o) => o.id))
    let n = (orgTarea || []).length
    while (usados.has(`ag-${ahora}-${n}`)) n++
    return `ag-${ahora}-${n}`
  }

  function nuevaOrganizacion(orgTarea, { clase = 'ft', nombre = '', arma = null, escalon = 'batallon' } = {}, ahora = Date.now()) {
    if (!CLASES[clase]) throw new Error(`Clase desconocida «${clase}».`)
    if (clase === 'pura' && arma && !ARMAS_PURAS.some((a) => a.id === arma)) throw new Error(`Arma no prevista para una unidad pura: «${arma}».`)
    const id = idNuevo(orgTarea, ahora)
    const o = { id, nombre, escalon, operacion: '', tarea: '', proposito: '', ft: clase === 'ft', clase, piezas: [] }
    if (clase === 'pura') o.arma = arma || 'ingenieria'
    return { orgTarea: [...(orgTarea || []), o], id }
  }

  // Cambia datos de UNA organización sin tocar los demás campos ni el id.
  function actualizarOrganizacion(orgTarea, id, cambios) {
    const c = { ...cambios }
    delete c.id
    delete c.piezas
    return mapearCambios(orgTarea, (o) => (o.id === id ? { ...o, ...c } : o))
  }

  function cambiarClase(orgTarea, id, clase, arma) {
    if (!CLASES[clase]) throw new Error(`Clase desconocida «${clase}».`)
    return mapearCambios(orgTarea, (o) => {
      if (o.id !== id) return o
      const r = { ...o, clase, ft: clase === 'ft' }
      if (clase === 'pura') r.arma = arma || o.arma || 'ingenieria'
      else delete r.arma
      return r
    })
  }

  const borrarOrganizacion = (orgTarea, id) => (orgTarea || []).filter((o) => o.id !== id)

  // Arma de una pieza según su símbolo abreviado (pLe de la Mesa).
  function armaDePieza(pieza, simbolos) {
    const s = ((simbolos && simbolos.pLe) || []).find((x) => x.id === (pieza && pieza.simbolo))
    return s ? s.arma : null
  }

  function nombreOrg(o) {
    const n = String((o && o.nombre) || '').trim()
    return n || `${CLASES[claseDe(o)].nom} sin nombre`
  }

  // «FT · FT «ÁGUILA»» se lee mal: si el nombre ya empieza con la sigla, no se repite.
  function rotuloOrg(o) {
    const k = CLASES[claseDe(o)].corto
    const n = nombreOrg(o)
    return n.toUpperCase().startsWith(k) ? n : `${k} · ${n}`
  }

  // Unidades orgánicas que conservan TODOS sus elementos: quedan puras sin
  // integrarse a nada (y eso está bien: no es obligatorio repartirlas).
  function purasOrganicas(ctx) {
    const occ = ocurrencias(ctx.orgTarea)
    return unidadesPropias(ctx.unidades).filter((u) => {
      const ps = ctx.piezasDe(u) || []
      return ps.length > 0 && ps.every((p) => !occ.has(p.id))
    })
  }

  // Todo lo que conviene revisar. nivel: "error" | "aviso" | "info".
  function validar(ctx) {
    const out = []
    const orgs = ctx.orgTarea || []
    const unidades = ctx.unidades || []
    const { porId } = piezasDelCalco(ctx)
    const rot = (u) => (ctx.rotulo ? ctx.rotulo(u) : (u && u.designacion) || 'Unidad')
    const nomPieza = (pid, p) => {
      const e = porId.get(pid)
      return e ? `${e.pieza.nom} de ${rot(e.unidad)}` : `${(p && p.nom) || pid}${p && p.madre ? ` de ${p.madre}` : ''}`
    }
    const porIdOrg = new Map(orgs.map((o) => [o.id, o]))

    // Identificadores repetidos (datos dañados: no se arreglan solos).
    const idsOrg = orgs.map((o) => o.id)
    for (const id of new Set(idsOrg))
      if (idsOrg.filter((x) => x === id).length > 1)
        out.push({ nivel: 'error', clave: 'org-id-repetido', txt: `Hay ${idsOrg.filter((x) => x === id).length} organizaciones con el mismo identificador «${id}». Borrá la que sobre.` })
    const idsU = unidades.map((u) => u && u.id).filter((x) => x != null)
    for (const id of new Set(idsU))
      if (idsU.filter((x) => x === id).length > 1)
        out.push({ nivel: 'error', clave: 'unidad-id-repetido', txt: `Hay dos fichas en el calco con el mismo identificador «${id}»: es la misma unidad cargada dos veces.` })

    // Una pieza en dos organizaciones (o dos veces en la misma).
    const occ = ocurrencias(orgs)
    const primera = new Map()
    for (const o of orgs) for (const p of o.piezas || []) if (p && !primera.has(p.id)) primera.set(p.id, p)
    for (const [pid, lista] of occ) {
      if (lista.length < 2) continue
      const distintas = [...new Set(lista)]
      const donde = distintas.map((id) => `«${nombreOrg(porIdOrg.get(id))}»`).join(' y ')
      out.push({
        nivel: 'error',
        clave: 'duplicada',
        piezaId: pid,
        txt:
          distintas.length > 1
            ? `${nomPieza(pid, primera.get(pid))} figura a la vez en ${donde}. Un elemento pertenece a una sola organización.`
            : `${nomPieza(pid, primera.get(pid))} figura ${lista.length} veces en ${donde}.`,
        acciones: distintas.map((id) => ({ acc: 'dejarSoloEn', piezaId: pid, orgId: id, txt: `Dejarla sólo en «${nombreOrg(porIdOrg.get(id))}»` })),
      })
    }

    // Piezas que ya no existen en el calco.
    for (const o of orgs)
      for (const p of o.piezas || []) {
        if (!p || porId.has(p.id)) continue
        out.push({
          nivel: 'aviso',
          clave: 'huerfana',
          piezaId: p.id,
          orgId: o.id,
          txt: `«${nombreOrg(o)}» tiene ${p.nom || p.id}${p.madre ? ` (de ${p.madre})` : ''}, que ya no está en el calco: se borró su unidad o le quedan menos elementos.`,
          acciones: [{ acc: 'quitarDe', piezaId: p.id, orgId: o.id, txt: `Quitarla de «${nombreOrg(o)}»` }],
        })
      }

    // Unidades puras: una sola arma.
    for (const o of orgs) {
      if (claseDe(o) !== 'pura') continue
      if (!ARMAS_PURAS.some((a) => a.id === o.arma))
        out.push({ nivel: 'aviso', clave: 'pura-sin-arma', orgId: o.id, txt: `«${nombreOrg(o)}» es una unidad pura sin arma elegida.` })
      else {
        const otras = (o.piezas || []).filter((p) => {
          const a = armaDePieza(p, ctx.simbolos)
          return a && a !== o.arma
        })
        if (otras.length)
          out.push({
            nivel: 'aviso',
            clave: 'pura-mixta',
            orgId: o.id,
            txt: `«${nombreOrg(o)}» es una unidad pura de ${ARMAS_PURAS.find((a) => a.id === o.arma).nom} y tiene elementos de otra arma: ${otras.map((p) => p.nom).join(', ')}. Revisá si corresponde una fuerza de tarea.`,
          })
      }
    }

    // Fichas del calco repetidas.
    const agIds = unidades.filter((u) => u && u.agId).map((u) => u.agId)
    for (const id of new Set(agIds))
      if (agIds.filter((x) => x === id).length > 1)
        out.push({
          nivel: 'error',
          clave: 'ficha-repetida',
          txt: `«${porIdOrg.has(id) ? nombreOrg(porIdOrg.get(id)) : id}» está ${agIds.filter((x) => x === id).length} veces como ficha en el calco. Borrá la que sobre desde 🪖 Unidades.`,
        })
    const desig = new Map()
    for (const u of unidades) {
      const d = String((u && u.designacion) || '').trim().toUpperCase()
      if (!d || !esPropia(u)) continue
      desig.set(d, (desig.get(d) || 0) + 1)
    }
    for (const [d, n] of desig)
      if (n > 1) out.push({ nivel: 'aviso', clave: 'designacion-repetida', txt: `Hay ${n} fichas propias «${d}» en el calco: revisá que no sea la misma unidad cargada dos veces.` })

    // Consolidadas cuya ficha tiene otra composición.
    for (const o of orgs) {
      if (!o.consolidada) continue
      const f = unidades.find((u) => u && u.agId === o.id)
      if (!f) continue
      const a = new Set((o.piezas || []).map((p) => p && p.id))
      const b = new Set((f.piezasAg || []).map((p) => p && p.id))
      if (a.size !== b.size || [...a].some((x) => !b.has(x)))
        out.push({
          nivel: 'aviso',
          clave: 'ficha-desactualizada',
          orgId: o.id,
          txt: `La ficha de «${nombreOrg(o)}» en el calco se consolidó con otra composición. El cambio vale para la organización; la ficha dibujada no cambia sola.`,
        })
    }

    // Vacías (no es un error).
    for (const o of orgs)
      if (!(o.piezas || []).length) out.push({ nivel: 'info', clave: 'vacia', orgId: o.id, txt: `«${nombreOrg(o)}» todavía no tiene elementos.` })

    const orden = { error: 0, aviso: 1, info: 2 }
    return out.sort((x, y) => orden[x.nivel] - orden[y.nivel])
  }

  function resumen(ctx) {
    const orgs = ctx.orgTarea || []
    const { lista } = piezasDelCalco(ctx)
    const occ = ocurrencias(orgs)
    const integradas = lista.filter((e) => occ.has(e.pieza.id)).length
    return {
      ft: orgs.filter((o) => claseDe(o) === 'ft').length,
      puras: orgs.filter((o) => claseDe(o) === 'pura').length,
      agrupaciones: orgs.filter((o) => claseDe(o) === 'agrupacion').length,
      elementos: lista.length,
      integrados: integradas,
      conSuUnidad: lista.length - integradas,
      purasOrganicas: purasOrganicas(ctx),
    }
  }

  // ─── Actividades académicas ───
  function normalizarAcad(a) {
    const b = a && typeof a === 'object' ? a : {}
    return { ...b, version: 1, actividades: Array.isArray(b.actividades) ? b.actividades : [] }
  }

  // Elementos a los que se puede vincular una actividad.
  function elementosVinculables(ctx) {
    const rot = (u) => (ctx.rotulo ? ctx.rotulo(u) : (u && u.designacion) || 'Unidad')
    const out = []
    for (const u of unidadesPropias(ctx.unidades)) out.push({ clave: `unidad:${u.id}`, grupo: 'Unidades propias del calco', nom: rot(u) })
    for (const o of ctx.orgTarea || []) out.push({ clave: `org:${o.id}`, grupo: 'Organizaciones', nom: rotuloOrg(o) })
    for (const u of (ctx.unidades || []).filter(esEnemiga)) out.push({ clave: `unidad:${u.id}`, grupo: 'Unidades enemigas del calco', nom: rot(u) })
    return out
  }

  const claveDe = (v) => (v && v.tipo && v.id != null ? `${v.tipo === 'organizacion' ? 'org' : 'unidad'}:${v.id}` : '')
  function vinculoDe(clave) {
    const m = /^(unidad|org):(.+)$/.exec(String(clave || ''))
    return m ? { tipo: m[1] === 'org' ? 'organizacion' : 'unidad', id: m[2] } : null
  }

  function validarActividad(d, elementos) {
    const errores = []
    if (!vinculoDe(d && d.vinculo) || !(elementos || []).some((e) => e.clave === d.vinculo)) errores.push('Elegí a qué unidad u organización se vincula.')
    if (!TIPOS_ACT[d && d.tipo]) errores.push('Elegí el tipo: pregunta, lectura o análisis doctrinario.')
    if (!String((d && d.titulo) || '').trim()) errores.push('Poné un título.')
    if (String((d && d.titulo) || '').length > 160) errores.push('El título es muy largo (160 caracteres como máximo).')
    if (String((d && d.texto) || '').length > 4000) errores.push('El texto es muy largo (4000 caracteres como máximo).')
    return errores
  }

  function agregarActividad(acad, d, ahora = Date.now(), azar = Math.random) {
    const a = normalizarAcad(acad)
    const act = {
      id: `act-${ahora}-${Math.floor(azar() * 1e6).toString(36)}`,
      vinculo: vinculoDe(d.vinculo),
      tipo: d.tipo,
      titulo: String(d.titulo || '').trim(),
      texto: String(d.texto || '').trim(),
      referencia: String(d.referencia || '').trim(),
      creada: new Date(ahora).toISOString(),
    }
    return { ...a, actividades: [...a.actividades, act] }
  }

  function editarActividad(acad, id, d, ahora = Date.now()) {
    const a = normalizarAcad(acad)
    return {
      ...a,
      actividades: a.actividades.map((x) =>
        x.id === id
          ? {
              ...x,
              vinculo: vinculoDe(d.vinculo) || x.vinculo,
              tipo: d.tipo || x.tipo,
              titulo: String(d.titulo ?? x.titulo).trim(),
              texto: String(d.texto ?? x.texto).trim(),
              referencia: String(d.referencia ?? x.referencia).trim(),
              editada: new Date(ahora).toISOString(),
            }
          : x,
      ),
    }
  }

  const borrarActividad = (acad, id) => {
    const a = normalizarAcad(acad)
    return { ...a, actividades: a.actividades.filter((x) => x.id !== id) }
  }

  // ─── Ejemplo con unidades FICTICIAS (sólo en un ejercicio sin unidades propias) ───
  function ejemploFicticio({ centro = { lat: -16.5, lng: -64.5 }, piezasDe, ahora = Date.now() }) {
    const r6 = (x) => Math.round(x * 1e6) / 1e6
    const u = (id, designacion, arma, escalon, dLat, dLng) => ({
      id: `fict-${id}-${ahora}`,
      bando: 'propias',
      tipo: 'unidad',
      designacion,
      arma,
      escalon,
      lat: r6(centro.lat + dLat),
      lng: r6(centro.lng + dLng),
      piezas: 3,
      ficticia: true,
    })
    const alfa = u('alfa', 'B.I. «ALFA» (FICT.)', 'infanteria', 'batallon', 0.012, -0.03)
    const bravo = u('bravo', 'R.C. «BRAVO» (FICT.)', 'caballeria', 'regimiento', 0.012, 0.02)
    const charlie = u('charlie', 'G.A. «CHARLIE» (FICT.)', 'artilleria', 'batallon', -0.012, -0.005)
    const delta = u('delta', 'B. ING. «DELTA» (FICT.)', 'ingenieria', 'batallon', -0.02, -0.035)
    const pz = (x, n) => (piezasDe(x) || [])[n - 1]
    const orgTarea = [
      { id: `ag-${ahora}-0`, nombre: 'FT «ÁGUILA» (FICT.)', escalon: 'batallon', operacion: '', tarea: '', proposito: '', ft: true, clase: 'ft', piezas: [pz(alfa, 1), pz(alfa, 2), pz(bravo, 1)].filter(Boolean) },
      {
        id: `ag-${ahora}-1`,
        nombre: 'ARTILLERÍA «CHARLIE» (FICT.)',
        escalon: 'batallon',
        operacion: '',
        tarea: '',
        proposito: '',
        ft: false,
        clase: 'pura',
        arma: 'artilleria',
        piezas: [pz(charlie, 1), pz(charlie, 2), pz(charlie, 3)].filter(Boolean),
      },
    ]
    const act = (n, vinculo, tipo, titulo, texto) => ({
      id: `act-${ahora}-${n}`,
      vinculo,
      tipo,
      titulo,
      texto,
      referencia: '',
      creada: new Date(ahora).toISOString(),
    })
    const actividades = [
      act(0, { tipo: 'organizacion', id: orgTarea[0].id }, 'pregunta', 'Tipo y pertenencia', 'Para cada elemento de esta fuerza de tarea, anotá qué TIPO de unidad es y de qué unidad orgánica viene.'),
      act(1, { tipo: 'unidad', id: delta.id }, 'analisis', 'Una unidad que no se integró', 'En este ejemplo la unidad conserva todos sus elementos. Explicá con tus palabras qué la diferencia de un elemento integrado a una fuerza de tarea.'),
      act(2, { tipo: 'organizacion', id: orgTarea[1].id }, 'lectura', 'El símbolo de la unidad', 'Buscá en el reglamento de simbología cómo se representa esta unidad y anotá documento, apartado y página.'),
    ]
    return { unidades: [alfa, bravo, charlie, delta], orgTarea, academico: { version: 1, actividades } }
  }

  const modelo = {
    CLASES,
    ARMAS_PURAS,
    TIPOS_ACT,
    claseDe,
    unidadesPropias,
    piezasDelCalco,
    ocurrencias,
    pertenencia,
    asignar,
    dejarSoloEn,
    quitarDe,
    idNuevo,
    nuevaOrganizacion,
    actualizarOrganizacion,
    cambiarClase,
    borrarOrganizacion,
    armaDePieza,
    nombreOrg,
    rotuloOrg,
    purasOrganicas,
    validar,
    resumen,
    normalizarAcad,
    elementosVinculables,
    vinculoDe,
    claveDe,
    validarActividad,
    agregarActividad,
    editarActividad,
    borrarActividad,
    ejemploFicticio,
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = modelo
    return
  }

  // ═══════════════════════════ VISTA (navegador) ═══════════════════════════

  const doc = global.document
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  let puente = null // lo último que mandó la Mesa
  const vista = {
    abierta: false,
    pestana: 'org',
    formAct: { vinculo: '', tipo: 'pregunta', titulo: '', texto: '', referencia: '' },
    editandoAct: null,
    erroresAct: [],
    avisoOrg: '',
    lamina: 'marco',
    ficha: null,
    busqueda: '',
  }
  let raiz = null
  let catalogo = null

  const simbolos = () => global.__mesaSimbolos || null
  const docente = () => !!(puente && puente.docente)
  function ctx() {
    const s = simbolos()
    return {
      unidades: (puente && puente.unidades) || [],
      orgTarea: (puente && puente.orgTarea) || [],
      piezasDe: (u) => (s && s.tN ? s.tN(u, s.js ? s.js(u) : '') : []),
      rotulo: (u) => (s && s.js ? s.js(u) : (u && u.designacion) || 'Unidad'),
      simbolos: s,
    }
  }

  // ─── Escritura (siempre por la Mesa, que guarda con el ejercicio) ───
  function escribirOrg(nuevo) {
    if (!puente || !puente.setOrgTarea) return
    if (nuevo === puente.orgTarea) return render() // nada cambió: sólo se muestra el aviso
    puente = { ...puente, orgTarea: nuevo }
    puente.setOrgTarea(nuevo)
    render()
  }
  function escribirAcad(nuevo) {
    if (!puente || !puente.setAcademico) return
    puente = { ...puente, academico: nuevo }
    puente.setAcademico(nuevo)
    render()
  }

  // ─── Dibujos ───
  const ESCALON_NOM = (id) => {
    const s = simbolos()
    return ((s && s.fl) || []).find((e) => e.id === id)?.nombre || id || ''
  }
  const ARMA_NOM = (id) => {
    const s = simbolos()
    return ((s && s.T1) || []).find((a) => a.id === id)?.nombre || id || ''
  }
  function svgPieza(simbolo, px = 40, color = '#0e1320') {
    const s = simbolos()
    try {
      return s && s.eN ? s.eN(simbolo, px, color) : ''
    } catch {
      return ''
    }
  }
  function imgUnidad(u, alto = 44) {
    const s = simbolos()
    try {
      const r = s && s.sb ? s.sb(u) : null
      return r ? `<img src="${r.url}" alt="" style="height:${alto}px;width:auto">` : ''
    } catch {
      return ''
    }
  }
  function imagenFicha(f, grande) {
    const s = simbolos()
    const im = f.imagen || {}
    const px = grande ? 120 : 64
    const TINTA = '#10151f'
    try {
      if (im.tipo === 'unidad') return imgUnidad(im.unidad, grande ? 96 : 54)
      if (im.tipo === 'abrev') return s && s.eN ? s.eN(im.id, px, TINTA) : ''
      if (im.tipo === 'obst') return s && s.VK ? s.VK(im.marca, { color: '#1f7a3d', px: grande ? 96 : 52, grosor: (im.grosor || 2.4) * 1.1 }) : ''
      if (im.tipo === 'tarea') return s && s.cb ? s.cb(im.id, grande ? 110 : 60, TINTA) : ''
      if (im.tipo === 'texto') return `<span class="ac-sim-texto" style="font-size:${grande ? 22 : 13}px">${esc(im.texto)}</span>`
      if (im.tipo === 'cruz') {
        const t = grande ? 80 : 40
        return `<svg width="${t}" height="${t}" viewBox="0 0 60 60" aria-label="cruz recta negra"><path d="M30 8 V52 M8 30 H52" stroke="#000" stroke-width="5" stroke-linecap="butt"/></svg>`
      }
      if (im.tipo === 'cruces') {
        const t = grande ? 70 : 34
        const l = 'stroke="#000" stroke-width="7" stroke-linecap="round"'
        return (
          `<span class="ac-cruces"><svg width="${t}" height="${t}" viewBox="0 0 60 60" aria-label="cruz recta"><path d="M30 8 V52 M8 30 H52" ${l}/></svg>` +
          `<small>¿+?</small><svg width="${t}" height="${t}" viewBox="0 0 60 60" aria-label="cruz en aspa"><path d="M12 12 L48 48 M48 12 L12 48" ${l}/></svg><small>¿×?</small></span>`
        )
      }
    } catch {}
    return ''
  }

  // ─── HTML ───
  function htmlPanel() {
    const cab =
      `<header class="ac-cab">` +
      `<div class="ac-tit"><span>🎓 ESTUDIO DOCTRINARIO</span><small>${esc((puente && puente.ejercicio) || 'Sin ejercicio abierto')}</small></div>` +
      `<nav class="ac-pestanas" role="tablist" aria-label="Vistas del estudio doctrinario">` +
      pestana('org', '🧩 Organización académica') +
      pestana('simb', '📕 Simbología doctrinaria') +
      `</nav>` +
      `<button type="button" class="ac-btn ac-cerrar" data-acc="cerrar" title="Cerrar (Esc)">✕ Cerrar</button>` +
      `</header>` +
      `<div class="ac-didactico" role="note">📚 <b>MATERIAL DIDÁCTICO.</b> Lo que se arma acá es para estudiar: no constituye órdenes ni asigna misiones, fuegos, barreras ni tareas de combate.</div>`
    const cuerpo = vista.pestana === 'simb' ? htmlSimbologia() : htmlOrganizacion()
    return `<div class="ac-fondo" role="dialog" aria-modal="true" aria-label="Estudio doctrinario">${cab}<main class="ac-cuerpo" id="ac-panel-${vista.pestana}" role="tabpanel">${cuerpo}</main></div>`
  }

  const pestana = (id, txt) =>
    `<button type="button" role="tab" class="ac-pestana${vista.pestana === id ? ' on' : ''}" aria-selected="${vista.pestana === id}" aria-controls="ac-panel-${id}" data-acc="pestana" data-v="${id}">${txt}</button>`

  // ─── Organización académica ───
  function htmlOrganizacion() {
    const c = ctx()
    if (!simbolos()) return `<div class="ac-vacio">La Mesa todavía no terminó de cargar sus símbolos. Volvé a abrir el estudio en un momento.</div>`
    const propias = unidadesPropias(c.unidades)
    const modo = docente()
      ? `<span class="ac-chip ac-chip-doc" title="Estás en el puesto del instructor">✎ Modo docente: podés editar</span>`
      : `<span class="ac-chip" title="Sólo el instructor edita la organización académica">👁 Sólo lectura</span>`
    if (!propias.length && !(c.orgTarea || []).length) {
      return (
        `<div class="ac-fila-modo">${modo}</div>` +
        `<div class="ac-vacio"><b>No hay unidades propias en el calco.</b><br>` +
        `Colocalas con <b>🪖 Unidades</b> y volvé: acá vas a ver de qué tipo es cada elemento y a qué organización pertenece.` +
        (docente()
          ? `<div class="ac-vacio-acc"><button type="button" class="ac-btn ac-btn-pri" data-acc="ejemplo">🧪 Cargar un ejemplo con unidades ficticias</button>` +
            `<small>Agrega al calco cuatro unidades ficticias («ALFA», «BRAVO», «CHARLIE», «DELTA»), una fuerza de tarea, una unidad pura de artillería y tres actividades de muestra. Sólo se ofrece con el calco vacío.</small></div>`
          : '') +
        `</div>`
      )
    }
    const avisos = validar(c)
    const r = resumen(c)
    return (
      `<div class="ac-fila-modo">${modo}${vista.avisoOrg ? `<span class="ac-ok" role="status">${esc(vista.avisoOrg)}</span>` : ''}</div>` +
      htmlValidacion(avisos) +
      htmlResumen(r) +
      `<div class="ac-org-grid">` +
      `<section class="ac-col" aria-labelledby="ac-t-elem"><h2 id="ac-t-elem" class="ac-h2">Elementos: TIPO y PERTENENCIA</h2>` +
      `<p class="ac-nota">El <b>tipo</b> dice qué es cada elemento (su arma y su escalón) y no cambia. La <b>pertenencia</b> dice a qué organización está integrado; si no está en ninguna, sigue con su unidad orgánica.</p>` +
      htmlElementos(c) +
      `</section>` +
      `<section class="ac-col" aria-labelledby="ac-t-org"><h2 id="ac-t-org" class="ac-h2">Organizaciones</h2>` +
      htmlOrganizaciones(c) +
      `<h2 class="ac-h2" id="ac-t-act">Actividades académicas</h2>` +
      htmlActividades(c) +
      `</section></div>`
    )
  }

  function htmlValidacion(avisos) {
    const errores = avisos.filter((a) => a.nivel === 'error').length
    const cab = errores
      ? `<b>⛔ ${errores} problema(s) de duplicación o identificadores.</b> Corregilos antes de consolidar.`
      : `<b>✅ Sin duplicados:</b> cada elemento figura en una sola organización.`
    return (
      `<div class="ac-valid ${errores ? 'mal' : 'bien'}" role="${errores ? 'alert' : 'status'}"><div>${cab}</div>` +
      (avisos.length
        ? `<ul>${avisos
            .map(
              (a) =>
                `<li class="ac-${a.nivel}"><span>${a.nivel === 'error' ? '⛔' : a.nivel === 'aviso' ? '⚠️' : 'ℹ️'} ${esc(a.txt)}</span>` +
                (docente() && a.acciones && a.acciones.length
                  ? `<span class="ac-acciones">${a.acciones
                      .map((x) => `<button type="button" class="ac-btn ac-btn-chico" data-acc="${x.acc}" data-pieza="${esc(x.piezaId)}" data-org="${esc(x.orgId)}">${esc(x.txt)}</button>`)
                      .join('')}</span>`
                  : '') +
                `</li>`,
            )
            .join('')}</ul>`
        : '') +
      `</div>`
    )
  }

  function htmlResumen(r) {
    const puras = r.purasOrganicas.map((u) => `${esc(ctx().rotulo(u))} <small>(${esc(ARMA_NOM(u.arma))})</small>`).join(' · ')
    return (
      `<div class="ac-resumen">` +
      `<span><b>${r.ft}</b> fuerza(s) de tarea</span>` +
      `<span><b>${r.puras}</b> unidad(es) pura(s)</span>` +
      (r.agrupaciones ? `<span><b>${r.agrupaciones}</b> agrupación(es) sin clase</span>` : '') +
      `<span><b>${r.integrados}</b> de ${r.elementos} elementos integrados · <b>${r.conSuUnidad}</b> con su unidad orgánica</span>` +
      `</div>` +
      (r.purasOrganicas.length
        ? `<div class="ac-nota ac-nota-pura">🟦 Siguen como <b>unidades orgánicas puras</b> (no se integraron a nada, y no es obligatorio): ${puras}.</div>`
        : '')
    )
  }

  function opcionesPertenencia(orgs, actual) {
    return (
      `<option value=""${actual == null ? ' selected' : ''}>Con su unidad orgánica (sin integrar)</option>` +
      orgs.map((o) => `<option value="${esc(o.id)}"${actual === o.id ? ' selected' : ''}>${esc(rotuloOrg(o))}</option>`).join('')
    )
  }

  function htmlElementos(c) {
    const orgs = c.orgTarea || []
    const porIdOrg = new Map(orgs.map((o) => [o.id, o]))
    const occ = ocurrencias(orgs)
    const s = c.simbolos
    let html = ''
    for (const u of unidadesPropias(c.unidades)) {
      const ps = c.piezasDe(u) || []
      const libres = ps.filter((p) => !occ.has(p.id)).length
      html +=
        `<div class="ac-madre">` +
        `<div class="ac-madre-cab">${imgUnidad(u, 38)}<div><b>${esc(c.rotulo(u))}</b>` +
        `<div class="ac-tipo">Tipo: ${esc(ARMA_NOM(u.arma))} · ${esc(ESCALON_NOM(u.escalon))}</div></div>` +
        `<span class="ac-contador" title="Elementos que siguen con su unidad orgánica">${libres}/${ps.length} con su unidad</span></div>` +
        (ps.length ? '' : `<div class="ac-nota">Sin elementos: subí su número en la ficha de la unidad.</div>`) +
        `<div class="ac-tabla" role="table" aria-label="Elementos de ${esc(c.rotulo(u))}">` +
        `<div class="ac-tr ac-th" role="row"><span role="columnheader">Elemento</span><span role="columnheader">Tipo de unidad</span><span role="columnheader">Pertenencia</span></div>` +
        ps
          .map((p) => {
            const donde = occ.get(p.id) || []
            const actual = donde.length ? donde[0] : null
            const repetida = donde.length > 1
            const pieArma = armaDePieza(p, s)
            const tipo = `${(s && s.pLe ? (s.pLe.find((x) => x.id === p.simbolo) || {}).nom : '') || ARMA_NOM(pieArma)} · ${ESCALON_NOM(p.escalon)}`
            const ctrl = docente()
              ? `<select class="ac-sel" data-acc="pertenencia" data-pieza="${esc(p.id)}" data-foco="pert-${esc(p.id)}" aria-label="Pertenencia de ${esc(p.nom)}">${opcionesPertenencia(orgs, actual)}</select>`
              : `<span>${actual ? esc(rotuloOrg(porIdOrg.get(actual))) : 'Con su unidad orgánica'}</span>`
            return (
              `<div class="ac-tr${repetida ? ' ac-rep' : ''}" role="row">` +
              `<span role="cell" class="ac-el"><span class="ac-pieza">${svgPieza(p.simbolo, 40)}</span><b>${esc(p.nom)}</b></span>` +
              `<span role="cell" class="ac-td-tipo"><small class="ac-lbl">Tipo</small>${esc(tipo)}</span>` +
              `<span role="cell"><small class="ac-lbl">Pertenencia</small>${ctrl}${repetida ? `<em class="ac-rep-txt">⛔ figura en ${donde.length} lugares</em>` : ''}</span>` +
              `</div>`
            )
          })
          .join('') +
        `</div></div>`
    }
    return html || `<div class="ac-vacio">No hay unidades propias en el calco.</div>`
  }

  function htmlOrganizaciones(c) {
    const orgs = c.orgTarea || []
    const botones = docente()
      ? `<div class="ac-fila-btn"><button type="button" class="ac-btn ac-btn-pri" data-acc="nueva" data-clase="ft">＋ Fuerza de tarea</button>` +
        `<button type="button" class="ac-btn" data-acc="nueva" data-clase="pura">＋ Unidad pura</button></div>`
      : ''
    if (!orgs.length)
      return `<div class="ac-vacio">Todavía no hay organizaciones. ${docente() ? 'Creá una fuerza de tarea o una unidad pura y después elegí sus elementos en la columna de la izquierda.' : ''}</div>${botones}`
    return (
      orgs
        .map((o) => {
          const cl = claseDe(o)
          const cab = docente()
            ? `<input class="ac-inp" data-acc="org-nombre" data-org="${esc(o.id)}" data-foco="nom-${esc(o.id)}" value="${esc(o.nombre || '')}" placeholder="Nombre (ej. FT «ALFA»)" aria-label="Nombre de la organización">`
            : `<b>${esc(nombreOrg(o))}</b>`
          const ctrlClase = docente()
            ? `<label class="ac-lbl-in">Clase <select class="ac-sel" data-acc="org-clase" data-org="${esc(o.id)}">${Object.values(CLASES)
                .map((k) => `<option value="${k.id}"${k.id === cl ? ' selected' : ''}>${k.nom}</option>`)
                .join('')}</select></label>`
            : ''
          const ctrlArma =
            cl === 'pura'
              ? docente()
                ? `<label class="ac-lbl-in">Arma <select class="ac-sel" data-acc="org-arma" data-org="${esc(o.id)}">${ARMAS_PURAS.map(
                    (a) => `<option value="${a.id}"${o.arma === a.id ? ' selected' : ''}>${a.nom}</option>`,
                  ).join('')}</select></label>`
                : `<span class="ac-lbl-in">Arma: ${esc((ARMAS_PURAS.find((a) => a.id === o.arma) || {}).nom || '—')}</span>`
              : ''
          const ctrlEsc = docente()
            ? `<label class="ac-lbl-in">Escalón <select class="ac-sel" data-acc="org-escalon" data-org="${esc(o.id)}">${[...new Set([...ESCALONES_ORG, o.escalon].filter(Boolean))]
                .map((e) => `<option value="${esc(e)}"${o.escalon === e ? ' selected' : ''}>${esc(ESCALON_NOM(e))}</option>`)
                .join('')}</select></label>`
            : `<span class="ac-lbl-in">Escalón: ${esc(ESCALON_NOM(o.escalon))}</span>`
          const miembros = (o.piezas || [])
            .map((p) => `<span class="ac-miembro" title="${esc(p.nom)} — de ${esc(p.madre || '')}"><span class="ac-pieza">${svgPieza(p.simbolo, 34)}</span>${esc(p.nom)}<small>${esc(p.madre || '')}</small></span>`)
            .join('')
          return (
            `<article class="ac-org ac-org-${cl}" aria-label="${esc(CLASES[cl].nom)} ${esc(nombreOrg(o))}">` +
            `<div class="ac-org-cab"><span class="ac-chip-clase ac-clase-${cl}" title="${esc(CLASES[cl].ayuda)}">${CLASES[cl].corto}</span>${cab}` +
            (docente() ? `<button type="button" class="ac-btn ac-btn-borrar" data-acc="borrar-org" data-org="${esc(o.id)}" title="Deshacer esta organización (sus elementos vuelven a su unidad)">✕</button>` : '') +
            `</div>` +
            `<div class="ac-org-ctrl">${ctrlClase}${ctrlArma}${ctrlEsc}${o.consolidada ? '<span class="ac-chip">✅ consolidada en el calco</span>' : ''}</div>` +
            `<div class="ac-miembros">${miembros || '<span class="ac-nota">Sin elementos: elegilos en la columna de la izquierda.</span>'}</div>` +
            `<div class="ac-id" title="El identificador no cambia al editar">id ${esc(o.id)}</div>` +
            `</article>`
          )
        })
        .join('') + botones
    )
  }

  function htmlActividades(c) {
    const acad = normalizarAcad(puente && puente.academico)
    const elementos = elementosVinculables(c)
    const porClave = new Map(elementos.map((e) => [e.clave, e]))
    const grupos = new Map()
    for (const a of acad.actividades) {
      const k = porClave.has(claveDe(a.vinculo)) ? claveDe(a.vinculo) : '__huerfanas'
      if (!grupos.has(k)) grupos.set(k, [])
      grupos.get(k).push(a)
    }
    const f = vista.formAct
    const optElem = (() => {
      const porGrupo = new Map()
      for (const e of elementos) {
        if (!porGrupo.has(e.grupo)) porGrupo.set(e.grupo, [])
        porGrupo.get(e.grupo).push(e)
      }
      return (
        `<option value="">— elegir unidad u organización —</option>` +
        [...porGrupo]
          .map(([g, l]) => `<optgroup label="${esc(g)}">${l.map((e) => `<option value="${esc(e.clave)}"${f.vinculo === e.clave ? ' selected' : ''}>${esc(e.nom)}</option>`).join('')}</optgroup>`)
          .join('')
      )
    })()
    const form = docente()
      ? `<form class="ac-form" data-acc="form-act" novalidate>` +
        `<div class="ac-form-tit">${vista.editandoAct ? '✎ Editar actividad' : '＋ Nueva actividad'}</div>` +
        `<label>Vincular a<select class="ac-sel" name="vinculo" data-campo="vinculo" data-foco="act-vinculo">${optElem}</select></label>` +
        `<label>Tipo<select class="ac-sel" name="tipo" data-campo="tipo" data-foco="act-tipo">${Object.values(TIPOS_ACT)
          .map((t) => `<option value="${t.id}"${f.tipo === t.id ? ' selected' : ''}>${t.ico} ${t.nom}</option>`)
          .join('')}</select></label>` +
        `<label>Título<input class="ac-inp" name="titulo" data-campo="titulo" data-foco="act-titulo" maxlength="160" value="${esc(f.titulo)}" placeholder="Ej.: ¿Por qué esta unidad sigue pura?"></label>` +
        `<label>Consigna o texto<textarea class="ac-inp" name="texto" data-campo="texto" data-foco="act-texto" rows="3" maxlength="4000" placeholder="Lo que el cursante tiene que responder, leer o analizar.">${esc(f.texto)}</textarea></label>` +
        `<label>Referencia (opcional)<input class="ac-inp" name="referencia" data-campo="referencia" data-foco="act-ref" maxlength="300" value="${esc(f.referencia)}" placeholder="Documento, capítulo, página"></label>` +
        (vista.erroresAct.length ? `<ul class="ac-errores" role="alert">${vista.erroresAct.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : '') +
        `<div class="ac-fila-btn"><button type="submit" class="ac-btn ac-btn-pri">${vista.editandoAct ? 'Guardar cambios' : 'Agregar actividad'}</button>` +
        (vista.editandoAct ? `<button type="button" class="ac-btn" data-acc="cancelar-act">Cancelar</button>` : '') +
        `</div></form>`
      : ''
    const lista = grupos.size
      ? [...grupos]
          .map(([k, l]) => {
            const e = porClave.get(k)
            const tit = e ? e.nom : '⚠️ Sin unidad: el elemento ya no está en el calco'
            return (
              `<div class="ac-act-grupo"><div class="ac-act-gtit">${esc(tit)}</div>` +
              l
                .map(
                  (a) =>
                    `<article class="ac-act"><div class="ac-act-cab"><span class="ac-chip ac-act-${esc(a.tipo)}">${(TIPOS_ACT[a.tipo] || {}).ico || ''} ${esc((TIPOS_ACT[a.tipo] || {}).nom || a.tipo)}</span><b>${esc(a.titulo)}</b></div>` +
                    (a.texto ? `<div class="ac-act-txt">${esc(a.texto)}</div>` : '') +
                    (a.referencia ? `<div class="ac-act-ref">📕 ${esc(a.referencia)}</div>` : '') +
                    (docente()
                      ? `<div class="ac-fila-btn"><button type="button" class="ac-btn ac-btn-chico" data-acc="editar-act" data-act="${esc(a.id)}">✎ Editar</button>` +
                        `<button type="button" class="ac-btn ac-btn-chico ac-btn-borrar" data-acc="borrar-act" data-act="${esc(a.id)}">Borrar</button></div>`
                      : '') +
                    `</article>`,
                )
                .join('') +
              `</div>`
            )
          })
          .join('')
      : `<div class="ac-vacio">Todavía no hay actividades. ${docente() ? 'Vinculá una pregunta, una lectura o un análisis a una unidad o a una organización.' : ''}</div>`
    return `<p class="ac-nota">📚 Se vinculan a mano y son sólo de estudio: no son órdenes ni asignan misiones.</p>${form}${lista}`
  }

  // ─── Simbología doctrinaria ───
  function htmlSimbologia() {
    const s = simbolos()
    const C = global.MesaAcademicaCatalogo
    if (!s || !C) return `<div class="ac-vacio">La Mesa todavía no terminó de cargar sus símbolos. Volvé a abrir el estudio en un momento.</div>`
    if (!catalogo) catalogo = C.construirCatalogo(s)
    const q = vista.busqueda.trim().toLowerCase()
    const lam = catalogo.laminas.find((l) => l.id === vista.lamina) || catalogo.laminas[0]
    const fichas = q ? catalogo.fichas.filter((f) => f.denominacion.toLowerCase().includes(q)) : lam.fichas
    const sel = catalogo.fichas.find((f) => f.id === vista.ficha) || null
    const cuenta = (l) => {
      const n = { verificado: 0, 'sin-verificar': 0, 'no-verificable': 0 }
      for (const f of l.fichas) n[f.verificacion.estado]++
      return n
    }
    const indice =
      `<nav class="ac-laminas" aria-label="Láminas">` +
      catalogo.laminas
        .map((l, i) => {
          const n = cuenta(l)
          return (
            `<button type="button" class="ac-lamina-btn${!q && l.id === lam.id ? ' on' : ''}" data-acc="lamina" data-v="${l.id}">` +
            `<b>Lámina ${i + 1}</b> ${esc(l.titulo)} <small>${l.fichas.length} ficha(s) · ${n.verificado} verificada(s)</small></button>`
          )
        })
        .join('') +
      `</nav>`
    const tituloLam = q ? `Búsqueda: «${esc(vista.busqueda)}» — ${fichas.length} ficha(s)` : `Lámina ${catalogo.laminas.indexOf(lam) + 1} · ${esc(lam.titulo)}`
    const hoja =
      `<section class="ac-hoja" aria-label="Lámina didáctica">` +
      `<div class="ac-hoja-cab"><div><b>${tituloLam}</b>${q ? '' : `<small>${esc(lam.bajada)}</small>`}</div>` +
      `<span class="ac-sello">MATERIAL DIDÁCTICO · sin carta ni coordenadas</span></div>` +
      (fichas.length
        ? `<div class="ac-grilla">${fichas
            .map(
              (f) =>
                `<button type="button" class="ac-tile${sel && sel.id === f.id ? ' on' : ''}" data-acc="ficha" data-v="${esc(f.id)}" aria-pressed="${!!(sel && sel.id === f.id)}">` +
                `<span class="ac-tile-img">${imagenFicha(f, false)}</span><span class="ac-tile-nom">${esc(f.denominacion)}</span>` +
                `<span class="ac-estado ac-estado-${f.verificacion.estado}" title="${esc(catalogo.ESTADOS[f.verificacion.estado].txt)}">${catalogo.ESTADOS[f.verificacion.estado].ico} ${esc(catalogo.ESTADOS[f.verificacion.estado].nom)}</span></button>`,
            )
            .join('')}</div>`
        : `<div class="ac-vacio ac-vacio-claro">No hay fichas que coincidan con la búsqueda.</div>`) +
      `</section>`
    const detalle = sel
      ? htmlFicha(sel)
      : `<aside class="ac-ficha ac-ficha-vacia" aria-live="polite"><b>Tocá un símbolo</b> de la lámina para ver su ficha: denominación, referencia y si está verificada.</aside>`
    return (
      `<div class="ac-simb-top"><label class="ac-buscar">🔎 <input class="ac-inp" type="search" data-acc="buscar" data-foco="buscar" value="${esc(vista.busqueda)}" placeholder="Buscar símbolo por nombre"></label>` +
      `<div class="ac-leyenda">${Object.entries(catalogo.ESTADOS)
        .map(([k, e]) => `<span class="ac-estado ac-estado-${k}" title="${esc(e.txt)}">${e.ico} ${esc(e.nom)}</span>`)
        .join('')}</div></div>` +
      `<div class="ac-aviso-ref" role="note">⚠️ No se tuvo a la vista ningún reglamento de simbología: <b>ninguna ficha está verificada</b> y no se redactó explicación doctrinaria. Cada una muestra la referencia que declara la Mesa y qué falta para verificarla.</div>` +
      `<div class="ac-simb-grid">${indice}${hoja}${detalle}</div>`
    )
  }

  function htmlFicha(f) {
    const r = f.referencia
    const e = catalogo.ESTADOS[f.verificacion.estado]
    const fila = (k, v, faltaTxt) => `<div class="ac-ref-fila"><span>${k}</span><b>${v ? esc(v) : `<i class="ac-falta">${faltaTxt || 'no consta'}</i>`}</b></div>`
    return (
      `<aside class="ac-ficha" aria-live="polite" aria-label="Ficha ${esc(f.denominacion)}">` +
      `<div class="ac-ficha-cab"><h3>${esc(f.denominacion)}</h3><button type="button" class="ac-btn ac-btn-chico" data-acc="ficha" data-v="" title="Cerrar la ficha">✕</button></div>` +
      `<div class="ac-ficha-img">${imagenFicha(f, true)}<small>${
        f.imagen && f.imagen.tipo === 'cruz'
          ? 'Como la indicó el docente.'
          : 'Así lo dibuja hoy la Mesa.'
      }</small></div>` +
      `<div class="ac-bloque"><div class="ac-bloque-tit">Explicación doctrinaria</div>` +
      (f.explicacion
        ? `<div>${esc(f.explicacion)}</div>`
        : `<div class="ac-pendiente">Pendiente de verificación: no se redacta sin el reglamento a la vista, para no inventar su interpretación.</div>`) +
      `</div>` +
      (f.usoEnLaMesa ? `<div class="ac-bloque"><div class="ac-bloque-tit">Uso en la Mesa</div><div>${esc(f.usoEnLaMesa)}</div></div>` : '') +
      (f.segunDocente ? `<div class="ac-bloque"><div class="ac-bloque-tit">Según el docente <small>(no es cita del reglamento)</small></div><div>${esc(f.segunDocente)}</div></div>` : '') +
      (f.notaDeLaMesa ? `<div class="ac-bloque"><div class="ac-bloque-tit">Nota que ya trae la Mesa <small>(no es cita del reglamento)</small></div><div>${esc(f.notaDeLaMesa)}</div></div>` : '') +
      `<div class="ac-bloque"><div class="ac-bloque-tit">Referencia</div>` +
      fila('Documento', r.documento, 'sin documento citado') +
      fila('Apartado', r.apartado) +
      fila('Página', r.pagina) +
      `<div class="ac-ref-origen">De dónde sale: ${esc(r.origen)}</div></div>` +
      `<div class="ac-bloque ac-verif ac-estado-${f.verificacion.estado}"><div class="ac-bloque-tit">${e.ico} ${esc(e.nom)}</div><div>${esc(e.txt)}</div>` +
      (f.verificacion.falta ? `<div class="ac-falta-txt"><b>Qué falta:</b> ${esc(f.verificacion.falta)}</div>` : '') +
      `</div></aside>`
    )
  }

  // ─── Foco y scroll a través de los redibujos ───
  function capturar() {
    const out = { foco: null, scroll: {} }
    const a = doc.activeElement
    if (a && raiz && raiz.contains(a) && a.dataset && a.dataset.foco) {
      out.foco = { k: a.dataset.foco, ini: a.selectionStart, fin: a.selectionEnd }
    }
    if (raiz) raiz.querySelectorAll('.ac-cuerpo, .ac-col, .ac-hoja, .ac-ficha, .ac-laminas').forEach((el, i) => (out.scroll[i] = el.scrollTop))
    return out
  }
  function restaurar(c) {
    if (!raiz) return
    raiz.querySelectorAll('.ac-cuerpo, .ac-col, .ac-hoja, .ac-ficha, .ac-laminas').forEach((el, i) => {
      if (c.scroll[i] != null) el.scrollTop = c.scroll[i]
    })
    if (c.foco) {
      const el = raiz.querySelector(`[data-foco="${CSS.escape(c.foco.k)}"]`)
      if (el) {
        el.focus({ preventScroll: true })
        try {
          if (c.foco.ini != null && el.setSelectionRange) el.setSelectionRange(c.foco.ini, c.foco.fin)
        } catch {}
      }
    }
  }

  // arriba: al cambiar de vista se arranca desde arriba (no con el scroll de la otra).
  function render({ arriba = false } = {}) {
    if (!vista.abierta || !doc) return
    if (!raiz) {
      raiz = doc.createElement('div')
      raiz.id = 'mesa-academica'
      doc.body.appendChild(raiz)
      raiz.addEventListener('click', alClic)
      raiz.addEventListener('change', alCambio)
      raiz.addEventListener('input', alEscribir)
      raiz.addEventListener('submit', alEnviar)
      raiz.addEventListener('keydown', alTecla)
    }
    const c = capturar()
    if (arriba) c.scroll = {}
    raiz.innerHTML = htmlPanel()
    restaurar(c)
  }

  // ─── Acciones ───
  function alClic(ev) {
    const b = ev.target.closest('[data-acc]')
    if (!b || !raiz.contains(b) || b.tagName === 'SELECT' || b.tagName === 'INPUT' || b.tagName === 'TEXTAREA' || b.tagName === 'FORM') return
    const acc = b.dataset.acc
    const c = ctx()
    try {
      if (acc === 'cerrar') return cerrar()
      if (acc === 'pestana') {
        vista.pestana = b.dataset.v
        return render({ arriba: true })
      }
      if (acc === 'lamina') {
        vista.lamina = b.dataset.v
        vista.busqueda = ''
        return render()
      }
      if (acc === 'ficha') {
        vista.ficha = b.dataset.v || null
        render()
        const f = raiz.querySelector('.ac-ficha')
        if (f && vista.ficha && global.matchMedia && global.matchMedia('(max-width: 760px)').matches) f.scrollIntoView({ block: 'start', behavior: 'smooth' })
        return
      }
      if (!docente()) return
      if (acc === 'nueva') {
        const r = nuevaOrganizacion(c.orgTarea, { clase: b.dataset.clase, nombre: '', arma: b.dataset.clase === 'pura' ? 'ingenieria' : null })
        vista.avisoOrg = `Se creó ${b.dataset.clase === 'pura' ? 'una unidad pura' : 'una fuerza de tarea'}: ponele nombre y elegí sus elementos.`
        escribirOrg(r.orgTarea)
        const inp = raiz.querySelector(`[data-foco="nom-${CSS.escape(r.id)}"]`)
        if (inp) inp.focus()
        return
      }
      if (acc === 'borrar-org') {
        const o = c.orgTarea.find((x) => x.id === b.dataset.org)
        if (o && global.confirm(`¿Deshacer «${nombreOrg(o)}»? Sus ${(o.piezas || []).length} elemento(s) vuelven a su unidad orgánica.`)) {
          vista.avisoOrg = `Se deshizo «${nombreOrg(o)}».`
          escribirOrg(borrarOrganizacion(c.orgTarea, o.id))
        }
        return
      }
      if (acc === 'dejarSoloEn') {
        vista.avisoOrg = 'Duplicado corregido.'
        return escribirOrg(dejarSoloEn(c.orgTarea, b.dataset.pieza, b.dataset.org))
      }
      if (acc === 'quitarDe') {
        vista.avisoOrg = 'Elemento quitado.'
        return escribirOrg(quitarDe(c.orgTarea, b.dataset.pieza, b.dataset.org))
      }
      if (acc === 'ejemplo') return cargarEjemplo()
      if (acc === 'editar-act') {
        const a = normalizarAcad(puente.academico).actividades.find((x) => x.id === b.dataset.act)
        if (!a) return
        vista.editandoAct = a.id
        vista.formAct = { vinculo: claveDe(a.vinculo), tipo: a.tipo, titulo: a.titulo, texto: a.texto, referencia: a.referencia || '' }
        vista.erroresAct = []
        render()
        const t = raiz.querySelector('[data-foco="act-titulo"]')
        if (t) t.focus()
        return
      }
      if (acc === 'cancelar-act') {
        vista.editandoAct = null
        vista.formAct = { vinculo: '', tipo: 'pregunta', titulo: '', texto: '', referencia: '' }
        vista.erroresAct = []
        return render()
      }
      if (acc === 'borrar-act') {
        const a = normalizarAcad(puente.academico).actividades.find((x) => x.id === b.dataset.act)
        if (a && global.confirm(`¿Borrar la actividad «${a.titulo}»?`)) escribirAcad(borrarActividad(puente.academico, a.id))
        return
      }
    } catch (e) {
      vista.avisoOrg = '⚠️ ' + (e && e.message ? e.message : e)
      render()
    }
  }

  function alCambio(ev) {
    const el = ev.target
    const acc = el.dataset && el.dataset.acc
    if (el.dataset && el.dataset.campo) {
      vista.formAct[el.dataset.campo] = el.value
      return
    }
    if (!acc || !docente()) return
    const c = ctx()
    try {
      if (acc === 'pertenencia') {
        const { porId } = piezasDelCalco(c)
        const e = porId.get(el.dataset.pieza)
        if (!e) return
        const destino = el.value || null
        const o = destino ? c.orgTarea.find((x) => x.id === destino) : null
        vista.avisoOrg = `${e.pieza.nom} de ${c.rotulo(e.unidad)} → ${o ? nombreOrg(o) : 'con su unidad orgánica'}.`
        return escribirOrg(asignar(c.orgTarea, e.pieza, destino))
      }
      if (acc === 'org-nombre') return escribirOrg(actualizarOrganizacion(c.orgTarea, el.dataset.org, { nombre: el.value.trim() }))
      if (acc === 'org-clase') return escribirOrg(cambiarClase(c.orgTarea, el.dataset.org, el.value))
      if (acc === 'org-arma') return escribirOrg(actualizarOrganizacion(c.orgTarea, el.dataset.org, { arma: el.value }))
      if (acc === 'org-escalon') return escribirOrg(actualizarOrganizacion(c.orgTarea, el.dataset.org, { escalon: el.value }))
    } catch (e) {
      vista.avisoOrg = '⚠️ ' + (e && e.message ? e.message : e)
      render()
    }
  }

  function alEscribir(ev) {
    const el = ev.target
    if (el.dataset && el.dataset.campo) vista.formAct[el.dataset.campo] = el.value
    if (el.dataset && el.dataset.acc === 'buscar') {
      vista.busqueda = el.value
      render()
    }
  }

  function alEnviar(ev) {
    const fm = ev.target
    if (!fm.dataset || fm.dataset.acc !== 'form-act') return
    ev.preventDefault()
    if (!docente()) return
    for (const el of fm.querySelectorAll('[data-campo]')) vista.formAct[el.dataset.campo] = el.value
    const c = ctx()
    const errores = validarActividad(vista.formAct, elementosVinculables(c))
    vista.erroresAct = errores
    if (errores.length) return render()
    const nuevo = vista.editandoAct ? editarActividad(puente.academico, vista.editandoAct, vista.formAct) : agregarActividad(puente.academico, vista.formAct)
    vista.avisoOrg = vista.editandoAct ? 'Actividad actualizada.' : 'Actividad agregada.'
    vista.editandoAct = null
    vista.formAct = { vinculo: vista.formAct.vinculo, tipo: vista.formAct.tipo, titulo: '', texto: '', referencia: '' }
    escribirAcad(nuevo)
  }

  function alTecla(ev) {
    if (ev.key === 'Escape') {
      ev.stopPropagation()
      cerrar()
      return
    }
    const el = ev.target
    if (ev.key === 'Enter' && el.dataset && el.dataset.acc === 'org-nombre') el.blur()
  }

  function cargarEjemplo() {
    const c = ctx()
    if (unidadesPropias(c.unidades).length || (c.orgTarea || []).length) {
      vista.avisoOrg = '⚠️ El ejemplo sólo se carga con el calco sin unidades propias ni organizaciones.'
      return render()
    }
    if (!puente.agregarUnidades) return
    if (!global.confirm('Se agregan al calco 4 unidades FICTICIAS, una fuerza de tarea, una unidad pura y 3 actividades de muestra. ¿Seguir?')) return
    const centro = typeof puente.centro === 'function' ? puente.centro() : puente.centro
    const ej = ejemploFicticio({ centro: centro && Number.isFinite(centro.lat) ? centro : undefined, piezasDe: c.piezasDe })
    puente.agregarUnidades(ej.unidades)
    puente = { ...puente, unidades: [...(puente.unidades || []), ...ej.unidades] }
    vista.avisoOrg = 'Ejemplo ficticio cargado: 4 unidades, una FT, una unidad pura de artillería y una unidad que sigue con sus elementos.'
    escribirOrg(ej.orgTarea)
    escribirAcad({ ...normalizarAcad(puente.academico), actividades: [...normalizarAcad(puente.academico).actividades, ...ej.academico.actividades] })
  }

  // ─── API para la Mesa ───
  function sincronizar(p) {
    puente = p || null
    if (vista.abierta) render()
  }
  function abrir(pestanaInicial) {
    vista.abierta = true
    if (pestanaInicial === 'org' || pestanaInicial === 'simb') vista.pestana = pestanaInicial
    vista.avisoOrg = ''
    render()
    const t = raiz && raiz.querySelector('.ac-pestana.on')
    if (t) t.focus({ preventScroll: true })
  }
  function cerrar() {
    vista.abierta = false
    if (raiz) {
      raiz.remove()
      raiz = null
    }
  }

  global.MesaAcademica = { sincronizar, abrir, cerrar, modelo, get abierta() { return vista.abierta } }
})(typeof window !== 'undefined' ? window : globalThis)
