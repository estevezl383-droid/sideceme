// «🎯 La Mesa propone el área con la PICB» — en el paso 2 del PASO A PASO del ASDI.
//
// Calcula con asdi-picb.js dónde conviene el ASDI (o el ARCE) mirando el CMOC del G-2, el
// Área de Operaciones, las unidades, el EPA y el escalón superior, y lo MUESTRA en gráficos:
// el croquis con el terreno del CMOC, el mapa de calor de los lugares válidos y las áreas
// A, B y C; el embudo de lo que se descartó (y por qué); la comparación por factor de la
// Escuela. Las áreas se llevan al calco como propuestas (después se miden y se evalúan en
// los pasos 3 y 4, como si las hubiera trazado el oficial). La IA revisa la propuesta con
// las ideas del oficial.
import { proponerASDI, textoPropuesta, CRITERIOS, COLOR_FACTOR, NOMBRE_FACTOR, MOTIVOS, FUENTE_PICB } from './asdi-picb.js'
import { doctrinaParaIA } from './doctrina.js'
import { limpiar, paralela, centroide } from './geo.js'
import { LETRAS, nombreUnidad } from './analisis.js'
import { unidadesQueReciben, posicion } from './planeamiento.js'
import * as G from './graficos.js'
import { useState, jsx, jsxs, useCalco, accion, panelIA, encabezadoIA, enBody, mostrarPropuesta, ocultarPropuesta, propuestaVisible, verEnCarta } from './runtime.js'

function h(tipo, props, ...hijos) {
  const { key, ...p } = props || {}
  const hs = hijos.flat().filter((x) => x !== null && x !== undefined && x !== false && x !== '')
  if (!hs.length) return jsx(tipo, p, key)
  if (hs.length === 1) return jsx(tipo, { ...p, children: hs[0] }, key)
  return jsxs(tipo, { ...p, children: hs }, key)
}
const AMBAR = '#fbbf24'
// Las áreas propuestas: categóricas en orden fijo (paleta validada para fondo oscuro).
export const COLOR_AREA = { A: '#3987e5', B: '#d95926', C: '#199e70' }
const S = {
  caja: { background: 'rgba(57,135,229,0.07)', border: '1px solid rgba(57,135,229,0.45)', borderRadius: 8, padding: 9, display: 'flex', flexDirection: 'column', gap: 8 },
  tit: { color: '#9ec5f4', fontWeight: 800, fontSize: 12.5 },
  ayuda: { fontSize: 10.5, color: '#9fb0c8', lineHeight: 1.45 },
  fila: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  btn: { flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.08)', color: '#dfeaf3', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 6, padding: '7px 8px', cursor: 'pointer', fontSize: 12 },
  btnPrin: { flex: 1, minWidth: 140, background: '#3987e5', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 },
  chip: (ok) => ({ fontSize: 10.5, borderRadius: 10, padding: '2px 8px', border: `1px solid ${ok ? '#0ca30c' : '#fab219'}`, color: ok ? '#7fe07f' : '#fab219' }),
  aviso: { background: 'rgba(255,212,122,0.08)', border: '1px solid rgba(255,212,122,0.3)', color: '#ffd47a', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  err: { background: '#2a1416', border: '1px solid #6b2f35', color: '#f0b0b6', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  ok: { background: '#12291d', border: '1px solid #2f6b46', color: '#9fe0c0', borderRadius: 6, padding: '6px 8px', fontSize: 11, lineHeight: 1.4 },
  area: { background: 'rgba(0,0,0,0.4)', color: '#e6eef6', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: '5px 7px', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', lineHeight: 1.35 },
  num: { width: 52, background: '#172332', color: '#fff', border: '1px solid #4d5d70', borderRadius: 4, padding: '3px 4px', fontSize: 12 },
}
const pct = (x) => `${Math.round((x || 0) * 100)}`
const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
// Rampa secuencial (un solo tono) para el mapa de calor: más claro = mejor lugar.
const RAMPA = ['#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#6da7ec', '#86b6ef', '#9ec5f4']
const colorPuntaje = (s) => RAMPA[Math.max(0, Math.min(RAMPA.length - 1, Math.floor(s * RAMPA.length)))]

export function PropuestaPICB({ nivel = 'asdi', parametros = {}, onExpediente = null, onLlevadas = null }) {
  const calco = useCalco()
  const planLog = esObj(calco.ops?.planLog) ? calco.ops.planLog : {}
  const pesos = esObj(planLog.pesosPICB) ? planLog.pesosPICB : {}
  const [pr, setPr] = useState(null)
  const [msg, setMsg] = useState(null)
  const [enCarta, setEnCarta] = useState(propuestaVisible())
  const [ideas, setIdeas] = useState(planLog.ideasPICB || '')
  const [grande, setGrande] = useState(false)
  const cm = calco.cmoc || {}
  const n = (k) => (Array.isArray(cm[k]) ? cm[k].length : 0)
  const calcular = (p = pesos) => {
    const r = proponerASDI(calco, { nivel, parametros, pesos: p, operacion: planLog.operacion || '' })
    setPr(r)
    if (!r.ok) setMsg({ tipo: 'err', txt: r.error })
    else setMsg(r.candidatos.length ? { tipo: 'ok', txt: `🎯 ${r.candidatos.length} área(s) propuesta(s) de ${r.embudo.evaluados} lugares evaluados. Llevalas al calco para medirlas y evaluarlas en los pasos 3 y 4.` } : { tipo: 'err', txt: r.avisos[r.avisos.length - 1] })
    if (enCarta && r.ok) setEnCarta(mostrarPropuesta(r, COLOR_AREA))
    return r
  }
  const guardarPlan = (patch) => accion('setOps')?.((o) => ({ ...o, planLog: { ...(esObj(o.planLog) ? o.planLog : {}), ...patch } }))
  const zonas = calco.ops?.zonasLog || []
  const libres = LETRAS.split('').filter((l) => !zonas.some((z) => z.propuesta === l))
  const llevar = () => {
    if (!pr?.candidatos?.length) return
    const agregar = accion('agregarOps')
    const ajustar = accion('ajustarZona')
    if (!ajustar || (!agregar && !accion('setOps'))) return setMsg({ tipo: 'err', txt: 'Esta versión de la Mesa no deja agregar áreas desde acá.' })
    let idx = zonas.length
    const asignadas = []
    for (const [k, c] of pr.candidatos.entries()) {
      const letra = libres[k]
      if (!letra) break
      if (agregar) agregar('zonalog', { coords: c.coords, zona: nivel })
      else accion('setOps')((o) => ({ ...o, zonasLog: [...(o.zonasLog || []), { coords: c.coords, zona: nivel, division: (o.zonasLog || []).filter((z) => z.zona === nivel).length + 1, clave: `${nivel}-picb${Date.now().toString(36)}${k}` }] }))
      ajustar(idx, { propuesta: letra, origen: 'picb', puntajePICB: Math.round(c.total * 100) })
      asignadas.push(`${c.letra} → Área ${letra}`)
      idx++
    }
    ocultarPropuesta()
    setEnCarta(false)
    setMsg({ tipo: 'ok', txt: `✔ Llevadas al calco como propuestas (${asignadas.join(', ')}). Ya están medidas en el paso 3; evaluálas en el paso 4.` })
    onLlevadas?.()
  }
  const verCarta = () => {
    if (enCarta) {
      ocultarPropuesta()
      setEnCarta(false)
      return
    }
    const r = pr || calcular()
    const ok = r?.ok && mostrarPropuesta(r, COLOR_AREA)
    setEnCarta(!!ok)
    if (!ok && r?.ok) setMsg({ tipo: 'aviso', txt: 'Las áreas se dibujan en la carta 2D: volvé a la vista 2D.' })
  }

  // ── IA ──
  const Panel = panelIA()
  const onPedido = async () => {
    const r = pr?.ok ? pr : calcular()
    let exp = ''
    try {
      exp = (await onExpediente?.({ conCoc: true }))?.md || ''
    } catch {}
    const P = []
    const enc = encabezadoIA()
    if (enc) P.push(enc)
    P.push(`Trabajás en la SECCIÓN IV — LOGÍSTICA (G-4). Tenés que revisar la PROPUESTA DE LA MESA para ubicar el ${nivel === 'arce' ? 'ARCE' : 'ASDI'} y decir cuál de las áreas conviene, con el método de la Escuela (lo impositivo y los factores maniobra, terreno, seguridad y situación logística).`)
    P.push(`# LO QUE CALCULÓ LA MESA CON LA PICB (CMOC) Y EL CALCO — son datos\n\n${textoPropuesta(r)}`)
    P.push(doctrinaParaIA({ conFactores: true, conMatriz: false, conAmenaza: true }))
    if (exp) P.push(`# EXPEDIENTE DEL EJERCICIO\n\n${exp}`)
    if (String(ideas).trim()) P.push(`# IDEAS DEL OFICIAL — respetalas\n\n${ideas.trim()}`)
    P.push(`# QUÉ DEVOLVÉS\n\nÚNICAMENTE un objeto JSON válido (sin texto alrededor):\n${JSON.stringify({ recomendada: 'A', areas: [{ letra: 'A', valoracion: 'Ventajas y desventajas concretas de esta área según los factores.', cambiar: 'Qué le corregirías (correrla, agrandarla…) o vacío.' }], conclusion: 'Con la forma de la Escuela: LAS ÁREAS … TIENEN CONDICIONES …, MIENTRAS QUE EL ÁREA … TIENE LA VENTAJA …, CONSIDERANDO LOS ASPECTOS …', riesgos: ['…'] }, null, 2)}\nUsá las letras A, B, C de la propuesta. No inventes lugares ni coordenadas: lo que no sepas, «SIN DATO — verificar».`)
    return P.join('\n\n')
  }
  const onAplicar = (texto) => {
    const s = String(texto || '')
    const cand = [...s.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map((m) => m[1])
    const a = s.indexOf('{')
    const b = s.lastIndexOf('}')
    if (a >= 0 && b > a) cand.push(s.slice(a, b + 1))
    let j = null
    for (const x of cand) {
      try {
        j = JSON.parse(x)
        break
      } catch {}
    }
    if (!esObj(j)) return { ok: false, msg: 'No encontré un objeto JSON en la respuesta.' }
    const ia = {
      recomendada: /^[A-C]$/.test(String(j.recomendada || '')) ? j.recomendada : '',
      areas: (Array.isArray(j.areas) ? j.areas : []).filter((x) => esObj(x) && /^[A-C]$/.test(String(x.letra))).map((x) => ({ letra: x.letra, valoracion: String(x.valoracion || '').slice(0, 3000), cambiar: String(x.cambiar || '').slice(0, 1500) })),
      conclusion: String(j.conclusion || '').slice(0, 3000),
      riesgos: (Array.isArray(j.riesgos) ? j.riesgos : []).filter((x) => typeof x === 'string').slice(0, 20),
      en: new Date().toISOString(),
    }
    guardarPlan({ iaPICB: ia })
    return { ok: true, msg: '🤖 Revisión de la IA guardada abajo (pendiente de revisión).' }
  }
  const ia = esObj(planLog.iaPICB) ? planLog.iaPICB : null

  // ── Gráficos ── (en el panel, enfocados en las áreas; en grande, toda el Área de Operaciones)
  const armar = (big) => {
  const graficos = []
  if (pr?.ok) {
    const ops = calco.ops || {}
    const ao = limpiar(ops.areaOps?.coords)
    const lado = ao.length >= 3 ? centroide(ao) : null
    const seg = lado ? paralela(pr.frente.linea, pr.norma.seguridadDesdeFrente, lado) : []
    const anillos = (xs) => (xs || []).flatMap((x) => {
      const g = x?.geometry || x
      if (g?.type === 'Polygon') return [g.coordinates?.[0] || []]
      if (g?.type === 'MultiPolygon') return (g.coordinates || []).map((p) => p?.[0] || [])
      return Array.isArray(x?.coords) ? [x.coords] : []
    })
    const enemigos = (calco.unidades || []).filter((u) => /^enem/i.test(String(u?.bando || '')) && (!u.tipo || u.tipo === 'unidad') && posicion(u))
    const mapa = G.croquis(h, {
      dato: 'mapa-picb',
      rotulo: 'Propuesta del área con la PICB: el terreno del CMOC, los lugares válidos y las áreas A, B y C',
      alto: big ? 620 : 260,
      ancho: big ? 900 : 300,
      foco: big ? null : [...pr.candidatos.flatMap((c) => c.coords), ...unidadesQueReciben(calco.unidades).map(posicion)],
      celdas: pr.grilla.map((c) => ({ p: c.c, color: colorPuntaje(c.s), lado: pr.paso, opacidad: 0.55 })),
      poligonos: [
        { coords: ao, color: '#9fb0c8', relleno: 'none', grosor: 1.5, titulo: 'Área de Operaciones' },
        ...anillos(calco.cmoc?.severo).map((c) => ({ coords: c, color: '#d03b3b', relleno: '#d03b3b', opacidad: 0.45, titulo: 'Terreno severo (CMOC)' })),
        ...anillos(calco.cmoc?.restringido).map((c) => ({ coords: c, color: '#fab219', relleno: '#fab219', opacidad: 0.3, titulo: 'Terreno restringido (CMOC)' })),
        ...(ops.zonasLog || []).filter((z) => z.zona === 'arce' && nivel !== 'arce').map((z) => ({ coords: z.coords, color: '#ffc000', relleno: '#ffc000', opacidad: 0.12, trazo: '5 4', rot: 'ARCE', tamRot: 10 })),
        ...pr.candidatos.map((c) => ({ coords: c.coords, color: COLOR_AREA[c.letra], relleno: COLOR_AREA[c.letra], opacidad: 0.35, grosor: 2.5, rot: c.letra, colorRot: '#fff', tamRot: 13, titulo: `Área ${c.letra}: ${pct(c.total)}/100` })),
      ],
      lineas: [
        { coords: pr.frente.linea, color: '#d03b3b', grosor: 3, rot: pr.frente.rot },
        ...(seg.length >= 2 ? [{ coords: seg, color: '#ff9fd3', grosor: 1.5, trazo: '8 5', rot: `${pr.norma.seguridadDesdeFrente.toFixed(0)} km` }] : []),
        ...(calco.cmoc?.avenidas || []).filter((a) => !/^prop/i.test(String(a?.bando || 'enemigo'))).map((a) => ({ coords: a.coords, color: '#d03b3b', grosor: 9, opacidad: 0.35, titulo: 'Avenida de aproximación enemiga' })),
        ...(calco.cmoc?.corredores || []).filter((a) => /^prop/i.test(String(a?.bando || ''))).map((a) => ({ coords: a.coords, color: '#0ca30c', grosor: 2, trazo: '3 4', titulo: 'Corredor de movilidad propio' })),
        ...(ops.ejesLog || []).filter((e) => e.tipo === 'epa').map((e) => ({ coords: e.coords, color: '#e6eef6', grosor: 1.5, trazo: '7 4', rot: 'EPA', colorRot: '#e6eef6' })),
      ],
      puntos: [
        ...unidadesQueReciben(calco.unidades).map((u) => ({ p: posicion(u), forma: 'unidad', color: '#3987e5', tam: 5, rot: nombreUnidad(u).length > 16 ? nombreUnidad(u).slice(0, 15) + '…' : nombreUnidad(u), tamRot: 9.5, titulo: nombreUnidad(u) })),
        ...enemigos.map((u) => ({ p: posicion(u), forma: 'rombo', color: '#d03b3b', tam: 6, titulo: nombreUnidad(u) })),
      ],
    })
    const leyendaMapa = G.leyenda(h, [
      { id: 'a', corto: 'Áreas A · B · C', color: COLOR_AREA.A },
      { id: 'cal', corto: 'Lugares válidos (más claro = mejor)', color: RAMPA[7] },
      { id: 'sev', corto: 'Terreno severo', color: '#d03b3b' },
      { id: 'res', corto: 'Terreno restringido', color: '#fab219' },
      { id: 'cor', corto: 'Corredor propio', color: '#0ca30c' },
      { id: 'seg', corto: `Distancia de seguridad ${pr.norma.seguridad} km${pr.norma.fondoBloqueo ? ' desde las posiciones de bloqueo' : ''}`, color: '#ff9fd3' },
    ])
    const E = pr.embudo
    const embudo = G.embudo(h, {
      dato: 'embudo-picb',
      pasos: [
        { nom: 'Lugares evaluados en el AO', n: E.evaluados, color: '#8a96a8', fuerte: true },
        ...MOTIVOS.map((m) => ({ nom: `✗ ${m.nom}`, n: E[m.id], color: '#d03b3b' })),
        { nom: '✓ Cumplen lo impositivo y el CMOC', n: E.validos, color: '#0ca30c', fuerte: true },
      ],
    })
    const totales = G.barras(h, { dato: 'puntaje-picb', max: 100, fmt: (x) => `${Math.round(x)}`, filas: pr.candidatos.map((c) => ({ id: c.letra, nom: `Área ${c.letra}`, sub: `${c.km2.toFixed(1)} km² · a ${c.dSeg.toFixed(1)} km de la ${pr.frente.rot}`, txt: `${pct(c.total)}/100`, partes: [{ id: 't', valor: c.total * 100, color: COLOR_AREA[c.letra], titulo: `Área ${c.letra}: ${pct(c.total)} de 100` }] })) })
    const porFactor = h(
      'div',
      { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }, 'data-grafico': 'factores-picb' },
      ...Object.keys(COLOR_FACTOR).map((f) =>
        h(
          'div',
          { key: f, style: { border: `1px solid ${COLOR_FACTOR[f]}66`, borderRadius: 6, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 } },
          h('div', { style: { fontSize: 10, fontWeight: 800, color: '#111', background: COLOR_FACTOR[f], borderRadius: 3, padding: '1px 5px', alignSelf: 'flex-start' } }, NOMBRE_FACTOR[f]),
          G.barras(h, { max: 100, alto: 10, col: '14px', fmt: (x) => `${Math.round(x)}`, filas: pr.candidatos.map((c) => ({ id: c.letra, nom: c.letra, txt: c.porFactor[f] == null ? 'sin dato' : pct(c.porFactor[f]), partes: [{ id: 'v', valor: (c.porFactor[f] || 0) * 100, color: COLOR_AREA[c.letra], titulo: `Área ${c.letra} · ${NOMBRE_FACTOR[f]}: ${c.porFactor[f] == null ? 'sin dato' : pct(c.porFactor[f])}` }] })) }),
        ),
      ),
    )
    const detalle = h(
      'details',
      null,
      h('summary', { style: { cursor: 'pointer', color: '#9ec5f4', fontSize: 11.5 } }, '🔎 Cada aspecto medido, área por área'),
      h(
        'div',
        { style: { overflowX: 'auto' } },
        h(
          'table',
          { style: { width: '100%', borderCollapse: 'collapse', fontSize: 11 } },
          h('tbody', null,
            h('tr', null, h('th', { style: th }, 'Aspecto'), h('th', { style: th }, 'Peso'), ...pr.candidatos.map((c) => h('th', { key: c.letra, style: { ...th, color: COLOR_AREA[c.letra] } }, `Área ${c.letra}`))),
            ...pr.criterios.map((k) =>
              h(
                'tr',
                { key: k.id },
                h('td', { style: td }, h('span', { style: { color: COLOR_FACTOR[k.factor] } }, '■ '), k.nom),
                h('td', { style: { ...td, textAlign: 'center' } }, h('input', { style: S.num, type: 'number', min: 0, step: 0.5, value: pesos[k.id] ?? '', placeholder: String(k.pesoOp ?? k.peso), 'aria-label': `Peso de ${k.nom}`, onChange: (e) => { const p = { ...pesos }; if (e.target.value === '') delete p[k.id]; else p[k.id] = Math.max(0, +e.target.value); guardarPlan({ pesosPICB: p }); calcular(p) } })),
                ...pr.candidatos.map((c) => {
                  const x = c.criterios.find((y) => y.id === k.id)
                  return h('td', { key: c.letra, style: td, title: x?.puntaje == null ? '' : `puntaje ${pct(x.puntaje)}/100` }, h('div', { style: { display: 'flex', alignItems: 'center', gap: 5 } }, h('span', { style: { display: 'inline-block', height: 8, width: `${Math.round((x?.puntaje || 0) * 40)}px`, background: COLOR_AREA[c.letra], borderRadius: 2 } }), Number.isFinite(x?.valor) ? `${x.valor.toFixed(k.unidad === '%' ? 0 : 1)} ${k.unidad}` : '—'))
                }),
              ),
            ),
          ),
        ),
        h('div', { style: S.ayuda }, `Los pesos son criterio de la Mesa (los de la ${pr.operacion === 'defensa' ? 'defensa: más peso a la seguridad contra fuegos e infiltrados' : pr.operacion === 'retrograda' ? 'operación retrógrada: más atrás y sobre la red viaria' : 'ofensiva: lo más adelante posible'}): cambialos y la propuesta se recalcula. `, FUENTE_PICB),
      ),
    )
    graficos.push(
      G.tarjeta(h, { tit: big ? 'Toda el Área de Operaciones: CMOC, lugares válidos y áreas propuestas' : 'Las áreas propuestas sobre el terreno', dato: 'tarjeta-mapa', children: [mapa, leyendaMapa] }),
      h('div', { key: 'cand', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 } },
        G.tarjeta(h, { tit: 'Puntaje de cada área (de 100)', children: [totales] }),
        G.tarjeta(h, { tit: 'Qué se descartó y por qué', children: [embudo] }),
      ),
      G.tarjeta(h, { tit: 'Comparación por factor de la Escuela', children: [porFactor] }),
      ...pr.candidatos.map((c) => h('div', { key: c.letra, style: { borderLeft: `4px solid ${COLOR_AREA[c.letra]}`, background: '#101a27', borderRadius: 6, padding: '6px 9px', display: 'flex', flexDirection: 'column', gap: 3 } }, h('div', { style: S.fila }, h('b', { style: { color: COLOR_AREA[c.letra] } }, `ÁREA ${c.letra} · ${pct(c.total)}/100`), h('button', { style: { ...S.btn, flex: '0 0 auto', minWidth: 0, padding: '2px 8px', fontSize: 11 }, onClick: () => verEnCarta([c.coords]) }, '📍 Ver')), ...c.motivos.map((m, i) => h('div', { key: i, style: { fontSize: 11, color: '#cfdbe8' } }, '· ', m)))),
      detalle,
    )
  }
  return graficos
  }
  const graficos = grande ? [] : armar(false)
  const visor =
    grande && pr?.ok
      ? enBody(h(
          'div',
          { role: 'dialog', 'aria-label': 'Propuesta del área en grande', 'data-g4': 'propuesta-grande', style: { position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(8,12,20,0.97)', overflow: 'auto', padding: 12, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10 } },
          h('div', { style: { ...S.fila, position: 'sticky', top: 0, background: '#141a29', border: '1px solid #34405a', borderRadius: 8, padding: 8, zIndex: 2 } }, h('b', { style: { ...S.tit, flex: 1 } }, `🎯 PROPUESTA DEL ${nivel === 'arce' ? 'ARCE' : 'ASDI'} CON LA PICB`), h('button', { style: { ...S.btn, flex: '0 0 auto' }, onClick: async (e) => setMsg({ tipo: 'ok', txt: await G.exportarImagen(e.currentTarget.closest('[data-g4="propuesta-grande"]')?.querySelector('[data-cuerpo]'), `Propuesta ${nivel}`, '#0b111a') }) }, '🖼️ Bajar la imagen'), h('button', { style: { ...S.btnPrin, flex: '0 0 auto', background: AMBAR, color: '#1b1405' }, onClick: llevar }, '✔ Llevar al calco'), h('button', { style: { ...S.btn, flex: '0 0 auto' }, onClick: () => setGrande(false) }, '✕ Cerrar')),
          msg && h('div', { style: S[msg.tipo] || S.ok }, msg.txt),
          (() => {
            const gg = armar(true)
            return h('div', { 'data-cuerpo': '1', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 10, alignItems: 'start', background: '#0b111a' } }, h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, gridColumn: 'span 2', minWidth: 0 } }, gg[0]), h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 } }, ...gg.slice(1)))
          })(),
        ))
      : null
  return h(
    'div',
    { style: S.caja, 'data-g4': 'propuesta-picb' },
    h('div', { style: S.tit }, `🎯 LA MESA PROPONE EL ${nivel === 'arce' ? 'ARCE' : 'ASDI'} CON LA PICB (CMOC)`),
    h('div', { style: S.ayuda }, 'Recorre el Área de Operaciones, descarta lo que no cumple (distancia de seguridad, DMA, terreno severo, avenidas enemigas) y puntúa el resto por los factores de la Escuela. Vos decidís: llevá las áreas al calco y evaluálas en el paso 4.'),
    h(
      'div',
      { style: S.fila },
      h('span', { style: S.chip(n('severo') > 0) }, `${n('severo') ? '✓' : '⚠'} ${n('severo')} terreno severo`),
      h('span', { style: S.chip(n('restringido') > 0) }, `${n('restringido') ? '✓' : '⚠'} ${n('restringido')} restringido`),
      h('span', { style: S.chip(n('avenidas') > 0) }, `${n('avenidas') ? '✓' : '⚠'} ${n('avenidas')} avenidas`),
      h('span', { style: S.chip(n('corredores') > 0) }, `${n('corredores') ? '✓' : '⚠'} ${n('corredores')} corredores`),
      h('span', { style: S.chip((calco.ops?.ejesLog || []).some((e) => e.tipo === 'epa')) }, (calco.ops?.ejesLog || []).some((e) => e.tipo === 'epa') ? '✓ EPA' : '⚠ sin EPA'),
    ),
    h('div', { style: S.fila }, h('button', { style: S.btnPrin, onClick: () => calcular(), 'data-accion': 'calcular-picb' }, pr ? '↻ Recalcular la propuesta' : '🎯 Calcular la propuesta'), pr?.ok && pr.candidatos.length > 0 && h('button', { style: S.btn, onClick: verCarta }, enCarta ? '🙈 Quitar de la carta' : '🗺️ Ver en la carta'), pr?.ok && h('button', { style: S.btn, onClick: () => setGrande(true), 'data-accion': 'grande-picb' }, '⛶ Ver en grande'), pr?.ok && pr.candidatos.length > 0 && h('button', { style: { ...S.btnPrin, background: AMBAR, color: '#1b1405' }, onClick: llevar, disabled: !libres.length, 'data-accion': 'llevar-picb' }, `✔ Llevar ${pr.candidatos.map((c, i) => libres[i]).filter(Boolean).join(', ')} al calco`)),
    msg && h('div', { style: S[msg.tipo] || S.ok, role: 'status' }, msg.txt),
    pr?.ok && pr.avisos.map((a, i) => h('div', { key: i, style: S.aviso }, '⚠ ', a)),
    ...graficos,
    visor,
    h('div', { style: { fontSize: 11, color: '#b9c9da', fontWeight: 600 } }, '💡 Tus ideas para el área (van a la IA)'),
    h('textarea', { style: S.area, rows: 2, value: ideas, placeholder: 'Ej.: «Quiero el ASDI sobre la ruta 1, detrás de la FT TORREZ; evitar el monte del este por la infiltración».', onChange: (e) => setIdeas(e.target.value), onBlur: () => guardarPlan({ ideasPICB: ideas }) }),
    Panel && h(Panel, { titulo: '🤖 Que la IA revise la propuesta', nota: 'Le manda lo que calculó la Mesa (CMOC, descartes, puntajes de A, B y C), la doctrina de la Escuela, el expediente y TUS IDEAS. Devuelve cuál recomienda y por qué.', color: '#9ec5f4', onPedido, onAplicar }),
    ia &&
      h(
        'div',
        { style: { ...S.aviso, color: '#d9c2ff', borderColor: 'rgba(198,156,255,0.45)', background: 'rgba(198,156,255,0.08)', display: 'flex', flexDirection: 'column', gap: 4 } },
        h('b', null, `🤖 La IA recomienda: ${ia.recomendada ? `Área ${ia.recomendada}` : '—'} (pendiente de revisión)`),
        ...ia.areas.map((a) => h('div', { key: a.letra }, h('b', { style: { color: COLOR_AREA[a.letra] } }, `Área ${a.letra}: `), a.valoracion, a.cambiar ? ` — Cambiar: ${a.cambiar}` : '')),
        ia.conclusion && h('div', { style: { fontStyle: 'italic' } }, ia.conclusion),
        ...ia.riesgos.map((r, i) => h('div', { key: `r${i}` }, '⚠ ', r)),
      ),
  )
}
const th = { border: '1px solid #3a4a68', padding: '3px 5px', background: '#1a2436', color: '#cfe0ea', fontWeight: 700, textAlign: 'center' }
const td = { border: '1px solid #3a4a68', padding: '3px 5px', verticalAlign: 'middle', whiteSpace: 'nowrap' }
