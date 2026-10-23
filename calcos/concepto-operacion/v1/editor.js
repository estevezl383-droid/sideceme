// Pantalla de la F3·P4 «Concepto amplio de la operación» en el Tablero del G-3: el concepto SOBRE LA
// CARTA, como una plantilla doctrinal con fichas (ver modelo.mjs). Va arriba de los nueve campos de
// la hoja, que siguen igual (la vista previa, el Word y la IA no cambian):
//
//   ① lo que se considera: lo que ya trabajaron los otros G (A.O., avenidas y A.I.N. del G-2, la OD de
//      la F3·P3, el texto de la hoja), la forma de maniobra y de dónde viene el enemigo;
//   ② proponer la plantilla: medidas de control, esfuerzos y reserva, plan de barreras y plan de fuegos,
//      cada ficha con su porqué y de dónde sale (TEXTO · G-2 · F3·P3 · DOCTRINA); se marca lo que va;
//   ③ en la carta: ✋ mover / agrandar / girar cada ficha (la zona de obstáculos se lleva su grupo) y
//      sus datos (tipo de fuego, efecto, medio, forma, obstáculo…);
//   ④ agregar fichas a mano (paleta);
//   ⑤ la congruencia: cada obstáculo batido por el fuego, cada concentración al alcance, el peso sobre
//      el esfuerzo principal, los ejes de contraataque sin obstáculos propios, la reserva detrás de la LPR;
//   ⑥ llevar el calco al texto de la hoja (el bloque «Según el calco» en los campos que corresponden).
//
// JavaScript sin compilar: React llega por runtime.js (el de la Mesa).
import { proponer, aplicar, enElCalco, revisar, piezasDePaleta, textoDelCalco, conBloque, centroDe, borrarPieza, objetoDe, elegirMedio, SECCIONES, PALETA, DIRECCIONES, FORMAS, marco, esEjeDeLaReserva, quitarEjes } from './modelo.mjs'
import { CAMPOS, leerConcepto, unidadesNombradas } from './lector.mjs'
import { useState, useEffect, useMemo, jsx, jsxs, rotulo, svgTarea, catalogoObstaculos, nomObstaculo, fuegos, mediosDeApoyo } from './runtime.js'
import { datosPuente, editorAbierto, estado, ponerAjuste, estaAjustando, seleccion, elegir, escucharCambios, aplicarTransformacion, colocar, cancelarColocar, centroVista, irA, nombrePieza, encuadrar } from './carta.js'

function h(tipo, props, ...hijos) {
  const { key, ...p } = props || {}
  const hs = hijos.flat().filter((x) => x !== null && x !== undefined && x !== false && x !== '')
  if (!hs.length) return jsx(tipo, p, key)
  if (hs.length === 1) return jsx(tipo, { ...p, children: hs[0] }, key)
  return jsxs(tipo, { ...p, children: hs }, key)
}
const svg = (html, estilo = {}) => h('span', { style: { lineHeight: 0, display: 'inline-block', ...estilo }, dangerouslySetInnerHTML: { __html: html } })

const CEL = '#5ce1ff'
const E = {
  raiz: { display: 'flex', flexDirection: 'column', gap: 8, color: '#e6eef6', fontSize: 12, marginBottom: 10 },
  cabeza: { background: 'linear-gradient(90deg, rgba(92,225,255,0.12), rgba(125,255,176,0.06))', border: '1px solid rgba(92,225,255,0.4)', borderRadius: 8, padding: '8px 10px' },
  cabTit: { fontSize: 13.5, fontWeight: 800, color: CEL, letterSpacing: 0.2 },
  cabSub: { fontSize: 11, color: '#b9c9da', marginTop: 2, lineHeight: 1.4 },
  paso: { background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, overflow: 'hidden' },
  pasoCab: { width: '100%', display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#e6eef6', padding: '8px 10px', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, fontWeight: 700 },
  num: { minWidth: 22, height: 22, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#10202a' },
  cuerpo: { padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7 },
  doctrina: { fontSize: 11, color: '#c8d6e5', lineHeight: 1.45, background: 'rgba(92,157,255,0.07)', borderLeft: '3px solid #5c9dff', padding: '5px 8px', borderRadius: 4 },
  fila: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  item: { display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11.5, lineHeight: 1.4 },
  rot: { fontSize: 10.5, color: '#9fb0c8', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 700 },
  btn: { background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 6, padding: '6px 9px', cursor: 'pointer', fontSize: 12 },
  btnPrin: { background: CEL, color: '#10202a', border: 'none', borderRadius: 7, padding: '8px 11px', cursor: 'pointer', fontSize: 12.5, fontWeight: 800 },
  btnOn: { background: '#ffd400', color: '#10202a', border: 'none', borderRadius: 7, padding: '8px 11px', cursor: 'pointer', fontSize: 12.5, fontWeight: 800 },
  btnChico: { background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontSize: 11, lineHeight: 1.3 },
  sel: { background: '#172332', color: '#fff', border: '1px solid #4d5d70', borderRadius: 4, padding: '4px 5px', fontSize: 12, maxWidth: '100%' },
  campo: { width: 90, boxSizing: 'border-box', background: '#172332', color: '#fff', border: '1px solid #4d5d70', borderRadius: 4, padding: '4px 5px', fontSize: 12, fontFamily: 'inherit' },
  tarjeta: { background: '#101a27', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 },
  elegida: { background: '#0f2433', border: `1px solid ${CEL}`, borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 },
  aviso: { background: 'rgba(255,212,122,0.08)', border: '1px solid rgba(255,212,122,0.3)', color: '#ffd47a', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  bien: { background: '#12291d', border: '1px solid #2f6b46', color: '#9fe0c0', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  ayuda: { fontSize: 10.5, color: '#9fb0c8', lineHeight: 1.4, fontStyle: 'italic' },
  porQue: { fontSize: 10.5, color: '#aebfd2', lineHeight: 1.35 },
  chipFuente: { fontSize: 9.5, fontWeight: 800, borderRadius: 3, padding: '0 4px', whiteSpace: 'nowrap' },
}
const COLOR_FUENTE = { texto: ['#7dffb0', '#10202a'], 'G-2': ['#ff9ec7', '#10202a'], 'F3·P3': ['#ffd400', '#10202a'], doctrina: ['#5c9dff', '#fff'], 'a mano': ['#c69cff', '#10202a'] }
const chip = (f) => { const [b, c] = COLOR_FUENTE[f] || ['#888', '#fff']; return h('span', { style: { ...E.chipFuente, background: b, color: c } }, String(f || '').toUpperCase()) }

function Paso({ n, titulo, ok, abierto, onAbrir, children }) {
  return h(
    'div',
    { style: E.paso, id: `co-paso-${n}` },
    h('button', { style: E.pasoCab, onClick: onAbrir, 'aria-expanded': abierto ? 'true' : 'false' }, h('span', { style: { ...E.num, background: ok ? '#7dffb0' : '#ffb35c' } }, String(n)), h('span', { style: { flex: 1 } }, titulo), h('span', { style: { fontSize: 11, color: ok ? '#7dffb0' : '#ffb35c' } }, ok ? '✅' : '⚠️'), h('span', { style: { color: '#8fa2bd' } }, abierto ? '▾' : '▸')),
    abierto && h('div', { style: E.cuerpo }, children),
  )
}

export default function SIDEditorConcepto({ hoja, valor, onValor, ctx = {} }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    editorAbierto(true)
    const quitar = escucharCambios(() => setTick((t) => t + 1))
    return () => { quitar(); cancelarColocar(); editorAbierto(false) }
  }, [])
  const P = datosPuente()
  const ops = P.ops || ctx.ops || {}
  const g3 = P.g3 || ctx.g3 || {}
  const cc = g3.conceptoCarta || {}
  const plan = P.plan || {}
  const unidades = P.unidades || ctx.SIDdn || ctx.unidades || []
  const propias = unidades.filter((u) => u && u.bando !== 'enemigo' && u.bando !== 'enemigas' && u.tipo !== 'instalacion')
  const medios = useMemo(() => mediosDeApoyo({ unidades: P.vistas || unidades, todas: unidades, orgTarea: P.orgTarea || ctx.orgTarea || [], plan }), [unidades, P.vistas, P.orgTarea, plan])
  const F = fuegos()
  const base = {
    hoja: valor || {},
    areaOps: ops.areaOps,
    ops,
    ains: ops.ains || [],
    unidades,
    cmoc: P.cmoc || ctx.cmoc || {},
    picb: P.picb || ctx.picb || {},
    plantilla: P.plantilla || null,
    g3,
    conceptoCarta: cc,
    mision: ctx.ordenSup?.mision || '',
  }
  const [abiertos, setAbiertos] = useState({ 1: true, 2: true, 3: true, 4: false, 5: true, 6: false })
  const [prop, setProp] = useState(null)
  const [aviso, setAviso] = useState('')
  const [enGrupo, setEnGrupo] = useState(true)
  const abrir = (n) => setAbiertos((a) => ({ ...a, [n]: !a[n] }))
  const bloqueado = !P.setOps
  const leido = useMemo(() => leerConcepto(valor || {}, { mision: base.mision }), [valor])
  const M = useMemo(() => marco({ ...base, dir: cc.dir }), [ops.areaOps, cc.dir, P.picb, unidades, P.cmoc, P.plantilla])
  const setCC = (cambio) => P.setG3?.((prev) => ({ ...prev, conceptoCarta: { ...(prev?.conceptoCarta || {}), ...(typeof cambio === 'function' ? cambio(prev?.conceptoCarta || {}) : cambio) } }))
  const est = estado()
  const puestos = enElCalco(est)
  const rev = useMemo(() => revisar({ ...base, ops, plan, marcas: est.marcas }, { fuegos: F, medios }), [ops, plan, est.marcas, valor, medios, cc.dir, cc.forma])
  const malos = rev.filter((r) => r.nivel !== 'ok')
  const sel = seleccion()
  const objSel = sel ? objetoDe(est, sel) : null

  // ② Proponer
  const proponerYa = () => {
    let lugares = []
    try { lugares = P.lugares ? P.lugares() || [] : [] } catch { lugares = [] }
    const r = proponer({ ...base, lugares, fuegos: F, medios, rotulo, unidadesNombradas: (t) => unidadesNombradas(t, propias, rotulo) })
    setProp(r)
    setAviso(r.ok ? '' : r.error)
    setAbiertos((a) => ({ ...a, 2: true }))
  }
  const alternarItem = (id) => setProp((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, marcado: i.marcado === false } : i)) }))
  const alternarSeccion = (s, on) => setProp((p) => ({ ...p, items: p.items.map((i) => (i.seccion === s ? { ...i, marcado: on } : i)) }))
  const ponerEnCalco = () => {
    if (!prop?.ok || bloqueado) return
    const items = prop.items
    const n = items.filter((i) => i.marcado !== false).length
    if (puestos.length && typeof window !== 'undefined' && !window.confirm(`Se reemplazan las ${puestos.length} fichas que puso antes la plantilla del concepto por estas ${n}. Lo que dibujaste aparte (sin la plantilla) no se toca. ¿Seguir?`)) return
    P.marcar?.()
    P.setOps((prev) => aplicar({ ops: prev || {} }, items).ops)
    P.setPlan?.((prev) => aplicar({ plan: prev || {} }, items).plan)
    setCC((prevCC) => ({ marcas: aplicar({ marcas: prevCC.marcas || [] }, items).marcas, verEnCarta: true, forma: prevCC.forma || prop.forma, propuestaEn: new Date().toISOString() }))
    setAviso(`✓ ${n} ficha(s) en el calco: los obstáculos están en el plan de barreras (🛡️ Defensa) y las concentraciones en el plan de fuegos (🔥 Fuegos). ↶ Deshacer devuelve el calco (el plan de fuegos se borra desde 🔥 Fuegos o con 🗑️ acá).`)
    setProp(null)
    setAbiertos((a) => ({ ...a, 3: true, 5: true }))
    setTimeout(encuadrar, 300)
  }
  const llevarUnidad = (s) => {
    if (!P.setUnidades) return
    P.marcarU?.()
    P.setUnidades((prev) => (prev || []).map((u) => (u.id === s.id ? { ...u, lng: s.destino[0], lat: s.destino[1] } : u)))
    setProp((p) => (p ? { ...p, sugerencias: p.sugerencias.filter((x) => x.id !== s.id) } : p))
  }

  // ③ Ajustar
  const ajustando = estaAjustando()
  const mover = (dx, dy) => sel && aplicarTransformacion(sel, { piv: centroDe(sel.capa, objSel), dx, dy }, { grupo: enGrupo && objSel?.co?.rol === 'zo' ? objSel.co.grupo : null })
  const girar = (g) => sel && aplicarTransformacion(sel, { piv: centroDe(sel.capa, objSel), giro: g }, { grupo: enGrupo && objSel?.co?.rol === 'zo' ? objSel.co.grupo : null })
  const escalar = (k) => sel && aplicarTransformacion(sel, { piv: centroDe(sel.capa, objSel), escala: k }, { grupo: enGrupo && objSel?.co?.rol === 'zo' ? objSel.co.grupo : null })
  const borrar = () => {
    if (!sel || !objSel) return
    const g = enGrupo && objSel.co?.rol === 'zo' ? objSel.co.grupo : null
    if (typeof window !== 'undefined' && !window.confirm(g ? `¿Borrar la ${g} con TODO su grupo (obstáculos, efecto, zona de aniquilamiento y concentración)?` : `¿Borrar ${nombrePieza(sel.capa, objSel)}?`)) return
    P.marcar?.()
    P.setOps?.((prev) => borrarPieza({ ops: prev || {} }, sel, { grupo: g || false }).ops)
    P.setPlan?.((prev) => borrarPieza({ plan: prev || {} }, sel, { grupo: g || false }).plan)
    setCC((prevCC) => ({ marcas: borrarPieza({ marcas: prevCC.marcas || [] }, sel, { grupo: g || false }).marcas }))
    elegir(null)
  }
  // Las flechas de los ejes de la reserva que ya están en la carta (ver esEjeDeLaReserva en modelo.mjs).
  const ejesPuestos = puestos.filter((p) => p.capa === 'limites' && esEjeDeLaReserva(p.obj))
  const sacarEjes = () => {
    if (!ejesPuestos.length || bloqueado) return
    P.marcar?.()
    P.setOps((prev) => quitarEjes({ ops: prev || {} }).ops)
    elegir(null)
    setAviso(`✓ Se sacaron de la carta ${ejesPuestos.length === 1 ? 'la flecha' : `las ${ejesPuestos.length} flechas`} de los ejes de la reserva (${ejesPuestos.map((p) => p.obj.nombre).join(', ')}). ↶ Deshacer las devuelve.`)
  }
  const cambiarObj = (cambios) => {
    if (!sel) return
    if (sel.capa === 'blancos') P.setPlan?.((prev) => ({ ...prev, blancos: (prev?.blancos || []).map((b) => (b.id === sel.id ? { ...b, ...cambios } : b)) }))
    else if (sel.capa === 'marcas') setCC((prevCC) => ({ marcas: (prevCC.marcas || []).map((m) => (m.id === sel.id ? { ...m, ...cambios } : m)) }))
    else { P.marcar?.(); P.setOps?.((prev) => ({ ...prev, [sel.capa]: (prev?.[sel.capa] || []).map((x, i) => (i === sel.idx ? { ...x, ...cambios } : x)) })) }
  }

  // ④ Paleta
  const agregar = (tipo, p) => {
    if (!p || bloqueado) return
    const items = piezasDePaleta(tipo, p, { ...base, ops })
    for (const i of items) if (i.capa === 'blancos') { const m = elegirMedio([i.obj.lng, i.obj.lat], i.obj.tipo, F, medios); i.obj = { ...i.obj, medio: m.medio, obs: m.nota } }
    if (!items.length) return
    P.marcar?.()
    P.setOps((prev) => aplicar({ ops: prev || {} }, items, { reemplazar: false }).ops)
    if (items.some((i) => i.capa === 'blancos')) P.setPlan?.((prev) => aplicar({ plan: prev || {} }, items, { reemplazar: false }).plan)
    if (items.some((i) => i.capa === 'marcas')) setCC((prevCC) => ({ marcas: aplicar({ marcas: prevCC.marcas || [] }, items, { reemplazar: false }).marcas, verEnCarta: true }))
    setAviso(`✓ ${items.length === 1 ? items[0].titulo : `${items[0].titulo} con ${items.length - 1} ficha(s) más`} en la carta. Con ✋ Ajustar la movés, la agrandás o la girás.`)
  }
  const pedirLugar = (t) => colocar({ texto: `Tocá la carta donde va: ${t.nom}.`, al: (p) => agregar(t.id, p) })

  // ⑥ Al texto
  const alTexto = () => {
    const t = textoDelCalco(est, {
      coordenadas: (p) => { try { const c = F?.coordenadas?.(p[0], p[1]); return c?.mgrs ? `${c.mgrs}` : `${p[1].toFixed(4)}, ${p[0].toFixed(4)}` } catch { return `${p[1].toFixed(4)}, ${p[0].toFixed(4)}` } },
      nomMedio: (id) => medios.find((m) => m.id === id)?.nombreCompleto || '',
      nomTipoFuego: (id) => F?.TIPOS_FUEGO?.find((x) => x.id === id)?.nom || id,
      nomObstaculo,
    })
    const v = { ...(valor || {}) }
    const poner = (campo, bloque) => { if (bloque) v[campo] = conBloque(v[campo], bloque) }
    poner(CAMPOS.barreras, t.barreras)
    poner(CAMPOS.fuegos, t.fuegos)
    poner(CAMPOS.medidas, t.medidas)
    poner(CAMPOS.reserva, t.reserva)
    if (typeof window !== 'undefined' && !window.confirm('Se agrega (o se reemplaza) al final de los campos «Fuegos», «Movilidad / contramovilidad… (plan de barreras)», «Medidas de control gráficas» y «Reserva» un bloque «— Según el calco (plantilla F3·P4):» con lo que está dibujado. Lo que escribiste arriba de ese bloque no se toca. ¿Seguir?')) return
    onValor?.(v)
    setAviso('✓ El texto de la hoja ya dice lo mismo que la carta (bloque «Según el calco» al final de cada campo).')
  }

  // ─── Pantalla ───
  const considerado = rev.slice(0, 5)
  const listaProp = (s) => (prop?.items || []).filter((i) => i.seccion === s.id)
  return h(
    'div',
    { style: E.raiz, className: 'co-editor' },
    h(
      'div',
      { style: E.cabeza },
      h('div', { style: E.cabTit }, '🗺️ EL CONCEPTO EN LA CARTA — plantilla doctrinal con fichas'),
      h('div', { style: E.cabSub }, 'El texto de abajo dice CÓMO; acá se ve DÓNDE. Lo que se pone va a las mismas piezas que usa la Mesa: los obstáculos al ', h('b', null, 'plan de barreras'), ' (🛡️ Defensa calcula el trabajo), las concentraciones al ', h('b', null, 'plan de fuegos'), ' (🔥 Fuegos, la lista de blancos y la Matriz F4·P7). Todo se mueve, se agranda y se gira en la carta.'),
    ),
    aviso && h('div', { style: aviso.startsWith('✓') ? E.bien : E.aviso, role: 'status' }, aviso),

    // ① Lo que se considera
    h(
      Paso,
      { n: 1, titulo: 'Lo que se considera (lo que ya hicieron los otros G)', ok: considerado.every((r) => r.nivel === 'ok'), abierto: abiertos[1], onAbrir: () => abrir(1) },
      considerado.map((r, i) => h('div', { key: i, style: E.item }, h('span', null, r.nivel === 'ok' ? '✅' : '⚠️'), h('span', null, r.texto))),
      h(
        'div',
        { style: E.fila },
        h('span', { style: E.rot }, 'Forma de maniobra'),
        h('select', { style: E.sel, value: cc.forma || leido.forma || 'defensa_area', onChange: (e) => setCC({ forma: e.target.value }), 'aria-label': 'Forma de maniobra' }, FORMAS.map((f) => h('option', { key: f.id, value: f.id }, f.nom))),
        !cc.forma && leido.forma && h('span', { style: E.ayuda }, '(la dice el texto)'),
      ),
      h(
        'div',
        { style: E.fila },
        h('span', { style: E.rot }, '🧭 El enemigo viene del'),
        h('select', { style: E.sel, value: cc.dir || 'auto', onChange: (e) => setCC({ dir: e.target.value }), 'aria-label': 'De dónde viene el enemigo' }, DIRECCIONES.map((d) => h('option', { key: d.id, value: d.id }, d.nom))),
        M.ok && h('span', { style: E.ayuda }, `rumbo ${Math.round(M.az)}° — ${M.fuente}`),
      ),
      !M.ok && h('div', { style: E.aviso }, M.error),
    ),

    // ② Proponer
    h(
      Paso,
      { n: 2, titulo: 'Proponer la plantilla (medidas, esfuerzos y reserva, barreras y fuegos)', ok: puestos.length > 0, abierto: abiertos[2], onAbrir: () => abrir(2) },
      h('div', { style: E.doctrina }, 'Lo que NOMBRA el texto manda (líneas, puntos de contacto, la ZO y su lugar, la reserva y sus ejes, las A.I.N. de los fuegos). Lo que no dice lo pone la doctrina de la defensa: zona de seguridad delante de la LPR; una zona de obstáculos atravesada en cada avenida, delante de la LPR, con su efecto y BATIDA por el fuego; FPF delante de la LPR; interdicción sobre las A.I.N.; contrabatería sobre la artillería enemiga ubicada; la reserva detrás del esfuerzo principal con su eje de contraataque. Las medidas en km y m son criterio de la Mesa: se ajustan en la carta.'),
      h('div', { style: E.fila }, h('button', { style: E.btnPrin, onClick: proponerYa, disabled: bloqueado }, prop ? '⚡ Volver a proponer' : '⚡ Proponer la plantilla del concepto'), puestos.length > 0 && !prop && h('span', { style: E.ayuda }, `En la carta: ${puestos.length} ficha(s) de la plantilla.`)),
      prop && !prop.ok && h('div', { style: E.aviso }, prop.error),
      prop?.ok && h(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
        h('div', { style: E.bien }, `${prop.formaNom}: ${prop.items.length} fichas. Esfuerzo principal: ${prop.principales.map((n) => `AA-${n}`).join(', ') || '—'}${prop.secundarias.length ? ` · secundario: ${prop.secundarias.map((n) => `AA-${n}`).join(', ')}` : ''} · zona de seguridad de ${String(Math.round(prop.marco.sZona * 10) / 10).replace('.', ',')} km.`),
        prop.avisos.map((a, i) => h('div', { key: `a${i}`, style: a.startsWith('🧭') ? E.ayuda : E.aviso }, a)),
        SECCIONES.map((s) => {
          const it = listaProp(s)
          if (!it.length) return null
          const todos = it.every((i) => i.marcado !== false)
          return h(
            'div',
            { key: s.id, style: E.tarjeta },
            h('div', { style: E.fila }, h('span', { style: { fontWeight: 800 } }, `${s.ico} ${s.nom}`), h('span', { style: E.ayuda }, `${it.filter((i) => i.marcado !== false).length} de ${it.length}`), h('button', { style: E.btnChico, onClick: () => alternarSeccion(s.id, !todos) }, todos ? '☐ Ninguna' : '☑ Todas')),
            it.map((i) =>
              h(
                'label',
                { key: i.id, style: { ...E.item, cursor: 'pointer' } },
                h('input', { type: 'checkbox', checked: i.marcado !== false, onChange: () => alternarItem(i.id) }),
                h('span', { style: { flex: 1 } }, h('span', { style: E.fila }, h('b', null, i.titulo), chip(i.fuente)), h('div', { style: E.porQue }, i.porQue)),
                h('button', { style: E.btnChico, title: 'Ir en la carta', onClick: (e) => { e.preventDefault(); irA(centroDe(i.capa, i.obj)) } }, '🎯'),
              ),
            ),
          )
        }),
        prop.sugerencias.length > 0 && h(
          'div',
          { style: E.tarjeta },
          h('div', { style: { fontWeight: 800 } }, '🪖 Las fichas de las unidades (no se mueven solas)'),
          prop.sugerencias.map((s) => h('div', { key: s.id, style: E.fila }, h('span', { style: { flex: 1 } }, s.texto), h('button', { style: E.btnChico, onClick: () => llevarUnidad(s) }, `→ Llevar ${s.nom}`))),
        ),
        h('div', { style: E.fila }, h('button', { style: E.btnPrin, onClick: ponerEnCalco }, `✓ Poner en el calco (${prop.items.filter((i) => i.marcado !== false).length} fichas)`), h('button', { style: E.btn, onClick: () => setProp(null) }, '✕ Descartar')),
      ),
    ),

    // ③ En la carta
    h(
      Paso,
      { n: 3, titulo: 'En la carta: mover, agrandar y girar cada ficha', ok: puestos.length > 0, abierto: abiertos[3], onAbrir: () => abrir(3) },
      h(
        'div',
        { style: E.fila },
        h('button', { style: ajustando ? E.btnOn : E.btnPrin, onClick: () => ponerAjuste(!ajustando), 'aria-pressed': ajustando ? 'true' : 'false' }, ajustando ? '✋ Ajustando — tocá para terminar' : '✋ Mover / agrandar / girar en la carta'),
        h('label', { style: { ...E.fila, cursor: 'pointer' } }, h('input', { type: 'checkbox', checked: cc.verEnCarta !== false, onChange: (e) => setCC({ verEnCarta: e.target.checked }) }), 'Ver los rótulos y efectos en la carta'),
      ),
      ejesPuestos.length > 0 && h(
        'div',
        { style: E.fila },
        h('button', { style: E.btn, onClick: sacarEjes, disabled: bloqueado, title: 'Quita las flechas EJE CA / EJE BLQ que puso la plantilla (lo trazado a mano no se toca)' }, `✕ Sacar las flechas de los ejes de la reserva (${ejesPuestos.map((p) => p.obj.nombre).join(', ')})`),
      ),
      ajustando && h('div', { style: E.ayuda }, 'Cada ficha tiene ✥: arrastrala para moverla. La de una zona de obstáculos («ZO-1 ✥») se lleva TODO su grupo. Tocá ✥ para elegirla: aparecen ⤡ (agrandar / achicar) y ⟳ (girar). En celeste se ve cómo va a quedar.'),
      objSel && h(Seleccion, { sel, obj: objSel, medios, F, enGrupo, setEnGrupo, mover, girar, escalar, borrar, cambiarObj }),
      puestos.length > 0 && h(
        'div',
        { style: E.tarjeta },
        SECCIONES.map((s) => {
          const lista = puestos.filter((p) => (p.obj.co?.rol ? seccionDeRol(p.obj.co.rol, p.capa) : p.capa === 'blancos' ? 'fuegos' : 'barreras') === s.id)
          if (!lista.length) return null
          return h(
            'div',
            { key: s.id },
            h('div', { style: E.rot }, `${s.ico} ${s.nom} (${lista.length})`),
            h('div', { style: E.fila }, lista.map((p, i) => {
              const ref = p.capa === 'blancos' || p.capa === 'marcas' ? { capa: p.capa, id: p.id } : { capa: p.capa, idx: p.idx }
              const es = sel && sel.capa === ref.capa && (ref.id != null ? sel.id === ref.id : sel.idx === ref.idx)
              return h('button', { key: i, style: { ...E.btnChico, ...(es ? { background: CEL, color: '#10202a' } : null) }, onClick: () => { if (!estaAjustando()) ponerAjuste(true); elegir(ref); irA(centroDe(p.capa, p.obj)) } }, nombrePieza(p.capa, p.obj).slice(0, 38))
            })),
          )
        }),
      ),
      !puestos.length && h('div', { style: E.ayuda }, 'Todavía no hay fichas de la plantilla en la carta: proponela (②) o agregalas a mano (④). Con ✋ también se mueven los obstáculos y las concentraciones que ya estaban.'),
    ),

    // ④ Paleta
    h(
      Paso,
      { n: 4, titulo: 'Agregar fichas a mano (paleta)', ok: true, abierto: abiertos[4], onAbrir: () => abrir(4) },
      h('div', { style: E.ayuda }, 'Tocá la ficha y después el lugar de la carta. Sale orientada a la avenida de aproximación más cercana; después se ajusta con ✋.'),
      SECCIONES.map((s) => {
        const ts = PALETA.filter((t) => t.seccion === s.id)
        if (!ts.length) return null
        return h('div', { key: s.id, style: { display: 'flex', flexDirection: 'column', gap: 3 } }, h('div', { style: E.rot }, `${s.ico} ${s.nom}`), h('div', { style: E.fila }, ts.map((t) => h('button', { key: t.id, style: E.btn, title: t.ayuda, onClick: () => pedirLugar(t), disabled: bloqueado }, /^ef_/.test(t.id) ? svg(svgTarea(t.id.slice(3), 18, '#dfeaf3', 0), { marginRight: 4, verticalAlign: 'middle' }) : `${t.ico} `, t.nom))))
      }),
      h('div', { style: E.fila }, h('span', { style: E.ayuda }, '¿La carta está tapada (teléfono)? Poné la ficha en el centro de lo que se ve:'), h('select', { style: E.sel, 'aria-label': 'Ficha para el centro de la vista', onChange: (e) => { if (e.target.value) agregar(e.target.value, centroVista()); e.target.value = '' } }, h('option', { value: '' }, '⊕ en el centro de la vista…'), PALETA.map((t) => h('option', { key: t.id, value: t.id }, t.nom)))),
    ),

    // ⑤ Congruencia
    h(
      Paso,
      { n: 5, titulo: `Congruencia del plan${malos.length ? ` — ${malos.length} para revisar` : ''}`, ok: !malos.length, abierto: abiertos[5], onAbrir: () => abrir(5) },
      rev.slice(5).map((r, i) => h('div', { key: i, style: E.item }, h('span', null, r.nivel === 'ok' ? '✅' : '⚠️'), h('span', { style: { flex: 1 } }, r.texto), r.ir && h('button', { style: E.btnChico, onClick: () => irA(r.ir) }, '🎯'))),
      rev.length <= 5 && h('div', { style: E.ayuda }, 'Cuando haya fichas en la carta, acá se controla que el plan de barreras y el de fuegos se correspondan.'),
    ),

    // ⑥ Al texto
    h(
      Paso,
      { n: 6, titulo: 'Que el texto de la hoja diga lo mismo que la carta', ok: Object.values(valor || {}).some((v) => String(v).includes('Según el calco')), abierto: abiertos[6], onAbrir: () => abrir(6) },
      h('div', { style: E.ayuda }, 'Agrega al final de «Fuegos», «Plan de barreras», «Medidas de control» y «Reserva» lo que está en la carta, con coordenadas MGRS: cada ZO con sus obstáculos y su efecto, cada AB con su tipo de fuego y el medio que la bate. Lo que escribiste no se toca.'),
      h('button', { style: E.btnPrin, onClick: alTexto, disabled: !puestos.length && !(plan.blancos || []).length && !(ops.obstaculos || []).length }, '📝 Llevar la carta al texto de la hoja'),
    ),
  )
}

const ROL_SECCION = { lpr: 'medidas', linea: 'medidas', zrp: 'medidas', zs: 'medidas', 'zrp-rot': 'medidas', zres: 'medidas', pc: 'medidas', 'limite-sector': 'maniobra', ep: 'maniobra', es: 'maniobra', reserva: 'maniobra', 'eje-ca': 'maniobra', 'eje-bloqueo': 'maniobra', pb: 'maniobra', zo: 'barreras', efecto: 'barreras', obstaculo: 'barreras', za: 'barreras', ab: 'fuegos', fpf: 'fuegos', cb: 'fuegos' }
const seccionDeRol = (rol, capa) => ROL_SECCION[rol] || (capa === 'blancos' ? 'fuegos' : capa === 'obstaculos' ? 'barreras' : 'medidas')

// La ficha elegida: mover con flechas (sin tocar la carta), girar, agrandar y sus datos.
function Seleccion({ sel, obj, medios, F, enGrupo, setEnGrupo, mover, girar, escalar, borrar, cambiarObj }) {
  const grupo = obj.co?.rol === 'zo' ? obj.co.grupo : null
  const opts = (lista, actual) => lista.map((x) => h('option', { key: x.id, value: x.id }, x.nom))
  const datos = []
  if (sel.capa === 'blancos') {
    const ev = F?.evaluar ? F.evaluar([obj.lng, obj.lat], medios, obj.medio) : null
    datos.push(
      h('div', { key: 'b1', style: E.fila },
        h('select', { style: E.sel, value: obj.forma || 'circular', 'aria-label': 'Forma', onChange: (e) => cambiarObj({ forma: e.target.value }) }, opts(F?.FORMAS || [])),
        h('select', { style: E.sel, value: obj.tipo || 'apoyo', 'aria-label': 'Tipo de fuego', onChange: (e) => cambiarObj({ tipo: e.target.value }) }, opts(F?.TIPOS_FUEGO || [])),
        h('select', { style: E.sel, value: obj.efecto || 'neutralizar', 'aria-label': 'Efecto', onChange: (e) => cambiarObj({ efecto: e.target.value }) }, opts(F?.EFECTOS || [])),
        h('select', { style: E.sel, value: obj.ejecucion || 'a_pedido', 'aria-label': 'Ejecución', onChange: (e) => cambiarObj({ ejecucion: e.target.value }) }, opts(F?.EJECUCION || [])),
      ),
      h('div', { key: 'b2', style: E.fila },
        h('span', { style: E.rot }, 'Lo bate'),
        h('select', { style: E.sel, value: obj.medio || '', 'aria-label': 'Medio que lo bate', onChange: (e) => cambiarObj({ medio: e.target.value || null }) }, h('option', { value: '' }, '— sin asignar —'), medios.map((m) => h('option', { key: m.id, value: m.id }, m.nombreCompleto))),
        ev && h('span', { style: { fontSize: 11, color: ev.fuera ? '#ff7ad9' : '#7dffb0' } }, ev.fuera ? `⚠️ ${ev.consejo}` : '✓ al alcance'),
      ),
      h('div', { key: 'b3', style: E.fila },
        obj.forma === 'circular' && h('label', { style: E.fila }, 'Radio (m)', h('input', { type: 'number', style: E.campo, value: obj.radioM ?? '', min: 10, step: 50, onChange: (e) => cambiarObj({ radioM: Number(e.target.value) || 0 }) })),
        (obj.forma === 'rectangular' || obj.forma === 'lineal') && h('label', { style: E.fila }, 'Largo (m)', h('input', { type: 'number', style: E.campo, value: obj.largoM ?? '', min: 10, step: 50, onChange: (e) => cambiarObj({ largoM: Number(e.target.value) || 0 }) })),
        obj.forma === 'rectangular' && h('label', { style: E.fila }, 'Ancho (m)', h('input', { type: 'number', style: E.campo, value: obj.anchoM ?? '', min: 10, step: 50, onChange: (e) => cambiarObj({ anchoM: Number(e.target.value) || 0 }) })),
        (obj.forma === 'rectangular' || obj.forma === 'lineal') && h('label', { style: E.fila }, 'Orientación (°)', h('input', { type: 'number', style: E.campo, value: Math.round(obj.orientacion || 0), min: 0, max: 359, onChange: (e) => cambiarObj({ orientacion: ((Number(e.target.value) || 0) % 360 + 360) % 360 }) })),
      ),
      h('div', { key: 'b4', style: E.ayuda }, 'Los demás datos (munición, espoleta, observador, hora…) están en 🔥 Fuegos, en la misma concentración.'),
    )
  } else if (sel.capa === 'obstaculos') {
    const cat = catalogoObstaculos()
    const forma = cat[obj.tipo]?.forma
    const mismos = Object.entries(cat).filter(([, v]) => v.forma === forma).map(([id, v]) => ({ id, nom: v.nom }))
    datos.push(h('div', { key: 'o1', style: E.fila },
      mismos.length > 0 && h('select', { style: E.sel, value: obj.tipo, 'aria-label': 'Tipo de obstáculo', onChange: (e) => cambiarObj({ tipo: e.target.value }) }, opts(mismos)),
      h('select', { style: E.sel, value: obj.estado || 'proyectado', 'aria-label': 'Estado', onChange: (e) => cambiarObj({ estado: e.target.value }) }, h('option', { value: 'proyectado' }, 'Proyectado'), h('option', { value: 'ejecutado' }, 'Ejecutado')),
    ))
  } else if (sel.capa === 'marcas' && obj.tipo === 'efecto') {
    datos.push(h('div', { key: 'm1', style: E.fila },
      h('select', { style: E.sel, value: obj.tarea, 'aria-label': 'Efecto', onChange: (e) => cambiarObj({ tarea: e.target.value }) }, ['bloquear', 'fijar', 'canalizar', 'desviar'].map((t) => h('option', { key: t, value: t }, t.toUpperCase()))),
      h('input', { style: { ...E.campo, width: 160 }, value: obj.texto || '', 'aria-label': 'Rótulo', onChange: (e) => cambiarObj({ texto: e.target.value }) }),
    ))
  } else if (sel.capa === 'limites' || sel.capa === 'coordinacion' || sel.capa === 'marcas') {
    const k = sel.capa === 'marcas' ? 'texto' : 'nombre'
    datos.push(h('div', { key: 'l1', style: E.fila }, h('span', { style: E.rot }, 'Nombre'), h('input', { style: { ...E.campo, width: 200 }, value: obj[k] || '', 'aria-label': 'Nombre', onChange: (e) => cambiarObj({ [k]: e.target.value }) })))
  }
  const paso = 0.5
  return h(
    'div',
    { style: E.elegida, className: 'co-elegida' },
    h('div', { style: E.fila }, h('b', { style: { color: CEL } }, nombrePieza(sel.capa, obj)), obj.co?.grupo && h('span', { style: E.ayuda }, `grupo ${obj.co.grupo}`)),
    grupo && h('label', { style: { ...E.fila, cursor: 'pointer' } }, h('input', { type: 'checkbox', checked: enGrupo, onChange: (e) => setEnGrupo(e.target.checked) }), `Mover / girar / agrandar TODA la ${grupo} (obstáculos, efecto y fuegos)`),
    h('div', { style: E.fila },
      h('button', { style: E.btnChico, title: 'Norte 500 m', onClick: () => mover(0, paso) }, '⬆'),
      h('button', { style: E.btnChico, title: 'Sur 500 m', onClick: () => mover(0, -paso) }, '⬇'),
      h('button', { style: E.btnChico, title: 'Oeste 500 m', onClick: () => mover(-paso, 0) }, '⬅'),
      h('button', { style: E.btnChico, title: 'Este 500 m', onClick: () => mover(paso, 0) }, '➡'),
      h('span', { style: E.ayuda }, '500 m'),
      h('button', { style: E.btnChico, onClick: () => girar(-15) }, '↺ 15°'),
      h('button', { style: E.btnChico, onClick: () => girar(15) }, '↻ 15°'),
      h('button', { style: E.btnChico, onClick: () => girar(180) }, '⇄ 180°'),
      h('button', { style: E.btnChico, onClick: () => escalar(1 / 1.15) }, '－ achicar'),
      h('button', { style: E.btnChico, onClick: () => escalar(1.15) }, '＋ agrandar'),
      h('button', { style: { ...E.btnChico, color: '#ff9e9e', borderColor: '#ff9e9e' }, onClick: borrar }, '🗑️'),
      h('button', { style: E.btnChico, onClick: () => elegir(null) }, '✕'),
    ),
    datos,
  )
}
