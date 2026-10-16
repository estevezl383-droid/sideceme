import { listarAreas, seleccionarArea, editarArea, paqueteAreas, importarAreas, listarSelecciones, borrarSeleccion, paqueteSeleccion } from './modelo.mjs?v=tijera20261016'
import { contenidoDeAreas, cmocDeAreas, resumenContenido, fichasDelPaquete, capasCmocVisibles, sumarCmoc, CAPAS_CMOC, ESCALONES } from './recorte.mjs?v=tijera20261016'
import { pedirTijera, terrenoDeLaMesa, EVENTO_COMPARTIR } from './tijera.mjs?v=tijera20261016'
import Compartir from './compartir-editor.mjs?v=tijera20261016'

const archivoDe = n => String(n || 'area').replace(/[^\wÁÉÍÓÚÑáéíóúñ.-]+/g, '_')
const fecha = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }
const bajarJSON = (nombre, p) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a'); a.href = url; a.download = nombre; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

// unidades/onUnidades: las fichas de la carta (para entregarlas con el área).
// cmoc/onCmoc/verCapa: el CMOC del ejercicio, cómo sumarle lo que llega y qué capas están a la
// vista (11-10-2026: la selección lleva «todo lo que está activo»).
// escalon/herramienta/onHerramienta: los usaba el lazo del panel; desde el 16-10-2026 corta la
// ✂️ tijera (tijera.mjs), la misma de la barra principal.
export default function Areas({ react: R, ops, onOps, ejercicio, onDeshacer, nube, unidades, onUnidades, cmoc, onCmoc, verCapa }) {
  const h = R.createElement, [seleccion, setSeleccion] = R.useState([]), [error, setError] = R.useState('')
  const [aviso, setAviso] = R.useState('')
  const [entrega, setEntrega] = R.useState({ contenido: true, enemigo: true, cmoc: true })
  const [pedido, setPedido] = R.useState(null) // abre «Compartir» con una selección guardada
  const archivo = R.useRef(null)
  const actual = R.useRef(ejercicio)
  actual.current = ejercicio
  R.useEffect(() => { setSeleccion([]); setError(''); setAviso(''); setPedido(null) }, [ejercicio])
  const lista = listarAreas(ops), activa = ops.areaOps?.id || 'ao-original', selecciones = listarSelecciones(ops)
  const cambiar = fn => { onDeshacer?.(); onOps(fn); setError('') }
  const estilo = { background: '#0e1320', color: '#e8edf5', border: '1px solid #34405a', borderRadius: 6, padding: 7, width: '100%', boxSizing: 'border-box', fontSize: 14 }
  const botones = { ...estilo, cursor: 'pointer', marginTop: 6 }
  const seleccionActual = seleccion.filter(id => lista.some(a => a.id === id))
  const fichas = Array.isArray(unidades) ? unidades : []
  const conCmoc = !!cmoc && typeof cmoc === 'object'
  const capasVista = conCmoc ? capasCmocVisibles(cmoc, verCapa || {}) : []
  const nombresCapas = capasVista.map(c => CAPAS_CMOC.find(x => x.capa === c)?.nombre.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean)
  const lleva = (areas, op) => {
    const c = contenidoDeAreas(areas, ops, fichas, op)
    if (op.cmoc && conCmoc) c.cmoc = cmocDeAreas(areas, cmoc, capasVista)
    return c
  }
  const resumen = R.useMemo(() => {
    const elegidas = lista.filter(a => seleccionActual.includes(a.id))
    if (!entrega.contenido || !elegidas.length) return ''
    try { return resumenContenido(lleva(elegidas, entrega)) } catch { return '' }
  }, [ops, unidades, cmoc, verCapa, seleccionActual.join('|'), entrega.contenido, entrega.enemigo, entrega.cmoc])
  const descargar = () => {
    try {
      const p = paqueteAreas(ops, seleccionActual, ejercicio, entrega.contenido ? { unidades: fichas, enemigo: entrega.enemigo, cmoc: entrega.cmoc && conCmoc ? cmoc : null, capasCmoc: capasVista } : null)
      bajarJSON(p.areas.length === 1 ? `AO_${archivoDe(p.areas[0].nombre)}.json` : 'areas_operaciones.json', p)
    } catch (e) { setError(e.message) }
  }
  // conTerreno: los calcos del terreno que se veían (sólo al bajar el JSON: el resumen no los corta).
  const paqueteDe = (s, conTerreno = false) => paqueteSeleccion(ops, s, ejercicio, { unidades: fichas, cmoc: conCmoc ? cmoc : null, resultados: conTerreno ? terrenoDeLaMesa() : null })
  const bajarSeleccion = s => { try { bajarJSON(`Seleccion_${archivoDe(s.nombre)}.json`, paqueteDe(s, true)); setAviso(`⬇️ Seleccion_${archivoDe(s.nombre)}.json bajado. Se abre con 📁 Ejercicios → «📂 Abrir archivo JSON» (como ejercicio nuevo, con su área en la carta), no con doble clic.`) } catch (e) { setError(e.message) } }
  const compartirSeleccion = s => {
    setSeleccion([s.areaId]); setEntrega({ contenido: s.opciones?.contenido !== false, enemigo: s.opciones?.enemigo !== false, cmoc: s.opciones?.cmoc !== false })
    setPedido({ n: Date.now(), seleccion: s }); setAviso('')
  }
  // «📤 Compartir» desde la tarjeta de la tijera: abre «Compartir» con esa selección.
  const opsRef = R.useRef(ops); opsRef.current = ops
  R.useEffect(() => {
    const atender = () => {
      const p = globalThis.window?.__sidPedidoCompartir
      if (!p) return
      const s = listarSelecciones(opsRef.current).find(x => x.id === p.id)
      if (!s) return
      window.__sidPedidoCompartir = null
      compartirSeleccion(s)
    }
    atender()
    window.addEventListener(EVENTO_COMPARTIR, atender)
    return () => window.removeEventListener(EVENTO_COMPARTIR, atender)
  }, [])
  const quitarSeleccion = s => { if (globalThis.confirm?.(`¿Borrar la selección guardada «${s.nombre}»? (El área sigue en la carta.)`) === false) return; cambiar(prev => borrarSeleccion(prev, s.id)) }
  const resumenSel = s => {
    try {
      if (s.opciones?.contenido === false) return 'sólo el contorno'
      const calcos = s.tijera?.vista?.calcos?.length ? ` · los calcos del terreno que se veían (${s.tijera.vista.calcos.length})` : ''
      return resumenContenido(paqueteDe(s).contenido) + calcos
    } catch { return '' }
  }
  return h('section', { 'aria-label': 'Áreas del ejercicio', style: { display: 'grid', gap: 7, padding: '8px 0', borderBottom: '1px solid #34405a' } },
    h('strong', null, `Áreas del ejercicio (${lista.length})`),
    ...lista.map(a => h('div', { key: a.id, style: { padding: 7, border: `1px solid ${a.id === activa ? '#5ce1ff' : '#34405a'}`, borderRadius: 6 } },
      h('label', { style: { display: 'flex', gap: 7, alignItems: 'center' } },
        h('input', { type: 'checkbox', checked: seleccionActual.includes(a.id), 'aria-label': `Compartir ${a.nombre || 'Área original'}`, onChange: e => setSeleccion(e.target.checked ? [...seleccionActual, a.id] : seleccionActual.filter(id => id !== a.id)) }),
        h('button', { type: 'button', style: { ...botones, marginTop: 0 }, onClick: () => cambiar(prev => seleccionarArea(prev, a.id)) }, `${a.id === activa ? '● ' : ''}${a.nombre || 'Área original'}`)),
      a.id === activa && h('div', { style: { display: 'grid', gap: 5, marginTop: 7 } },
        ...[['nombre', 'Nombre del área'], ['unidad', 'Unidad responsable'], ['operacion', 'Operación asignada']].map(([k, etiqueta]) => h('label', { key: k }, etiqueta,
          h('input', { style: estilo, value: a[k] || '', maxLength: 160, onChange: e => cambiar(prev => editarArea(prev, a.id, { [k]: e.target.value })) }))),
        h('label', null, 'Magnitud del área',
          h('select', { style: estilo, value: a.escalon || '', onChange: e => cambiar(prev => editarArea(prev, a.id, { escalon: e.target.value || undefined })) },
            h('option', { value: '' }, 'Sin indicar'), ...ESCALONES.map(x => h('option', { key: x.id, value: x.id }, x.nombre))))))),
    h('small', null, 'Seleccione un área para editarla. Las otras permanecen en la carta.'),
    h('div', { style: { display: 'grid', gap: 5, padding: 8, border: '1px dashed #5ce1ff', borderRadius: 6 } },
      h('strong', null, '✂️ Repartir el área sin redibujar'),
      h('button', { type: 'button', style: { ...botones, marginTop: 0 }, onClick: () => pedirTijera() }, '✂️ Cortar con la tijera'),
      h('small', null, 'La tijera también está en la barra de arriba («✂️ Cortar área»). Corta por los límites de las unidades (no por las líneas de fase ni las áreas de empeñamiento), le muestra antes lo que va a cortar y entrega lo que se ve en la carta cortado por donde pasó su trazo: las líneas, las fichas (también las enemigas que encierre fuera del área), el CMOC y los calcos del terreno prendidos. La magnitud del área nueva es la de «Magnitud que se va a colocar».'),
      aviso && h('p', { role: 'status', style: { margin: 0, color: '#a9ffcf' } }, aviso)),
    h('div', { role: 'group', 'aria-label': 'Qué se entrega con las áreas', style: { display: 'grid', gap: 4 } },
      h('strong', null, 'Qué se entrega con las áreas marcadas'),
      h('label', null, h('input', { type: 'checkbox', checked: entrega.contenido, onChange: e => setEntrega({ ...entrega, contenido: e.target.checked }) }),
        ' Todo lo que está dentro (límites, puntos, marcas, tareas, fichas…)'),
      entrega.contenido && h('label', null, h('input', { type: 'checkbox', checked: entrega.enemigo, onChange: e => setEntrega({ ...entrega, enemigo: e.target.checked }) }), ' También las fichas enemigas'),
      entrega.contenido && conCmoc && h('label', null, h('input', { type: 'checkbox', checked: entrega.cmoc, onChange: e => setEntrega({ ...entrega, cmoc: e.target.checked }) }),
        ` También el CMOC que está a la vista${nombresCapas.length ? ` (${nombresCapas.join(', ')})` : ' (no hay capas del CMOC prendidas)'}`),
      h('small', null, !seleccionActual.length ? 'Marque las áreas que va a entregar.' : entrega.contenido ? `Lleva: ${resumen || 'nada más que el contorno'}.` : 'Sólo el contorno de las áreas.')),
    selecciones.length > 0 && h('div', { role: 'group', 'aria-label': 'Selecciones guardadas', style: { display: 'grid', gap: 6 } },
      h('strong', null, `💾 Selecciones guardadas (${selecciones.length})`),
      ...selecciones.map(s => h('article', { key: s.id, style: { border: '1px solid #39d98a', borderRadius: 6, padding: 7, display: 'grid', gap: 4 } },
        h('strong', null, s.nombre),
        h('small', null, `${s.tijera ? '✂️ Cortada con la tijera · ' : ''}Guardada ${fecha(s.guardada)}${lista.some(a => a.id === s.areaId) ? '' : ' · el área ya no está en la carta: va el contorno guardado'} · lleva: ${resumenSel(s)}`),
        h('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap' } },
          h('button', { type: 'button', style: { ...botones, marginTop: 0, width: 'auto', flex: '1 1 auto' }, onClick: () => bajarSeleccion(s) }, '⬇️ JSON'),
          h('button', { type: 'button', style: { ...botones, marginTop: 0, width: 'auto', flex: '1 1 auto' }, onClick: () => compartirSeleccion(s) }, '📤 Compartir (ciclo / paralelo)'),
          h('button', { type: 'button', style: { ...botones, marginTop: 0, width: 'auto' }, 'aria-label': `Borrar la selección ${s.nombre}`, onClick: () => quitarSeleccion(s) }, '🗑'))))),
    // con una selección guardada, las capas del CMOC que estaban a la vista al guardarla
    h(Compartir, { react: R, nube, ids: seleccionActual, ops, ejercicio, entrega: { ...entrega, cmoc: entrega.cmoc && conCmoc, capasCmoc: pedido?.seleccion && seleccionActual.length === 1 && seleccionActual[0] === pedido.seleccion.areaId ? pedido.seleccion.capasCmoc || [] : capasVista }, resumen, onUnidades, cmoc, onCmoc, pedido }),
    h('button', { type: 'button', style: botones, disabled: !seleccionActual.length, onClick: descargar }, 'Descargar copia JSON de las áreas'),
    h('button', { type: 'button', style: botones, onClick: () => archivo.current?.click() }, 'Importar áreas compartidas'),
    h('small', null, 'El archivo JSON es una copia opcional. Para compartir dentro de SIDE-CEME use el botón superior.'),
    h('input', { ref: archivo, type: 'file', accept: '.json,application/json', hidden: true, onChange: async e => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return
      const destino = ejercicio
      try {
        if (file.size > 2000000) throw new Error('El archivo de áreas supera 2 MB.')
        const p = JSON.parse(await file.text())
        // Valida antes de entrar en el actualizador de React.
        importarAreas({}, p)
        if (destino !== actual.current) throw new Error('El ejercicio cambió durante la lectura.')
        cambiar(prev => importarAreas(prev, p))
        const llegan = fichasDelPaquete(p)
        if (llegan.length) onUnidades?.(prev => [...(Array.isArray(prev) ? prev : []), ...llegan])
        const cm = p.contenido?.cmoc && onCmoc ? p.contenido.cmoc : null
        if (cm) onCmoc(prev => sumarCmoc(prev, cm))
        setAviso(`📥 ${p.areas.length} área(s) incorporada(s)${p.contenido ? `, con ${resumenContenido({ ops: p.contenido.ops, unidades: onUnidades ? llegan : [], cmoc: cm || {} })}` : ''}.`)
      } catch (e) { setError(e.message) }
    } }),
    error && h('div', { role: 'alert', style: { color: '#ff9d9d' } }, error))
}
