import { recibirUnidades, recibirCmoc } from './compartir-modelo.mjs?v=tijera20261016'
import { resumenContenido } from './recorte.mjs?v=tijera20261016'
import { opsConSeleccion, contenidoTijera } from './modelo.mjs?v=tijera20261016'

// entrega: { contenido, enemigo, cmoc, capasCmoc } elegido en el panel; resumen: lo que lleva, en palabras.
// pedido: { n, seleccion } cuando se toca «📤 Compartir» en una selección guardada: se abre con su
// nombre y se envía la Mesa TAL COMO ESTÁ (ejercicio_enviar, con el contorno guardado), no lo último
// que llegó a guardarse en SIDECEME.
export default function Compartir({ react: R, nube, ids, ops, ejercicio, entrega = { contenido: false }, resumen = '', onUnidades, cmoc, onCmoc, pedido = null }) {
  const h = R.createElement
  const [abierto, abrir] = R.useState(false), [destinos, setDestinos] = R.useState([]), [envios, setEnvios] = R.useState([])
  const [destino, setDestino] = R.useState(''), [nombre, setNombre] = R.useState(''), [mensaje, setMensaje] = R.useState('')
  const [ocupado, setOcupado] = R.useState(false), [sel, setSel] = R.useState(null)
  const [opciones, setOpciones] = R.useState({ unidad: true, operacion: true, documentos: false, indicaciones: '' })
  const actual = R.useRef(ejercicio); actual.current = ejercicio
  const caja = R.useRef(null)
  R.useEffect(() => { abrir(false); setDestinos([]); setEnvios([]); setDestino(''); setNombre(''); setMensaje(''); setSel(null); setOpciones({ unidad: true, operacion: true, documentos: false, indicaciones: '' }) }, [ejercicio])
  const s = { width: '100%', boxSizing: 'border-box', padding: 7, background: '#111c2c', color: '#e8edf5', border: '1px solid #42516a', borderRadius: 6, fontSize: 14 }
  const tarea = async fn => {
    const origen = ejercicio; setOcupado(true); setMensaje('')
    const comprobar = () => { if (actual.current !== origen) throw new Error('El ejercicio cambió. Abra nuevamente Compartir.') }
    try { await fn(comprobar) } catch (e) { if (actual.current === origen) setMensaje(e.message) }
    finally { setOcupado(false) }
  }
  const api = async (accion, calco, datos = {}) => {
    const r = await nube.api(accion, { calco_id: calco.id, ...datos })
    if (!r.ok) throw new Error(r.error || 'No se pudo completar la solicitud.')
    return r
  }
  const cargar = () => tarea(async comprobar => {
    if (!nube?.activo) throw new Error('El envío dentro de la aplicación requiere abrir SIDE-CEME con su sesión activa.')
    const c = await nube.contexto(false); comprobar()
    const recibidos = await api('areas_recibidos', c); comprobar(); setEnvios(recibidos.envios)
    const d = await nube.api('areas_destinos', { calco_id: c.id }); comprobar()
    setDestinos(d.ok ? d.destinos : []); abrir(true)
  })
  // Una selección guardada: se abre con su nombre (y sus destinos, ciclos y paralelos incluidos).
  R.useEffect(() => {
    if (!pedido?.seleccion) return
    setSel(pedido.seleccion); setNombre(pedido.seleccion.nombre); setMensaje('')
    try { caja.current?.scrollIntoView?.({ block: 'nearest' }) } catch {}
    if (!abierto) cargar()
  }, [pedido?.n])
  const enviar = () => tarea(async comprobar => {
    const d = destinos.find(x => x.clave === destino)
    if (!d || !nombre.trim() || !ids.length) throw new Error('Indique nombre, áreas y destinatario.')
    const c = await nube.contexto(true); comprobar()
    const propia = sel && ids.length === 1 && ids[0] === sel.areaId
    // ✂️ Hecha con la tijera: el servidor la corta por donde pasó el lazo (opciones.tijera).
    const op = { ...opciones, contenido: !!entrega.contenido, enemigo: entrega.enemigo !== false, cmoc: !!entrega.cmoc, capasCmoc: entrega.capasCmoc || [], ...(propia && sel.tijera ? { tijera: sel.tijera } : {}) }
    let r
    if (propia) {
      // La Mesa como está, con el área idéntica a lo que se recortó y guardó.
      const mesa = globalThis.window?.SIDMesaEjercicio?.foto?.() || {}
      const unidades = Array.isArray(mesa.unidades) ? mesa.unidades : []
      // Los calcos del terreno van ya cortados por el lazo (pesan mucho menos que enteros).
      let resultados = null
      if (sel.tijera && entrega.contenido && mesa.resultados) try { resultados = contenidoTijera(ops, sel, { unidades, resultados: mesa.resultados }).resultados } catch { resultados = null }
      r = await api('ejercicio_enviar', c, { nombre, areas: ids, opciones: op, destino: d, foto: { ops: opsConSeleccion(ops, sel), unidades, documentos: opciones.documentos && Array.isArray(mesa.documentos) ? mesa.documentos : [], cmoc: entrega.cmoc ? cmoc || null : null, ...(resultados && Object.keys(resultados).length ? { resultados } : {}) } })
    } else r = await api('areas_enviar', c, { nombre, areas: ids, opciones: op, destino: d })
    comprobar()
    setMensaje(`Enviado a ${d.nombre}. Lo encontrará en Recibidos dentro de SIDE-CEME.${r?.calcosFuera ? ' Los calcos del terreno no entraron en el envío (más de 2 MB): el que lo recibe los genera con ⚡ Generar calcos sobre el Área de Interés que le llega, o usted le pasa el ⬇️ JSON de la selección, que sí los lleva.' : ''}`)
  })
  return h('section', { ref: caja, 'aria-label': 'Compartir dentro de SIDE-CEME', style: { display: 'grid', gap: 7 } },
    h('button', { type: 'button', style: s, disabled: ocupado, onClick: cargar }, 'Compartir en la aplicación / Recibidos'),
    abierto && h(R.Fragment, null,
      destinos.length > 0 && h(R.Fragment, null,
        sel && ids.length === 1 && ids[0] === sel.areaId && h('strong', { style: { color: '#a9ffcf' } }, `💾 Selección guardada «${sel.nombre}»`),
        h('label', null, 'Nombre del envío', h('input', { style: s, value: nombre, maxLength: 160, placeholder: `${ejercicio} · Áreas asignadas`, onChange: e => setNombre(e.target.value) })),
        h('label', null, 'Ejercicio o grupo destinatario', h('select', { style: s, value: destino, onChange: e => setDestino(e.target.value) },
          h('option', { value: '' }, 'Seleccione el destino'), ...destinos.map(d => h('option', { key: d.clave, value: d.clave }, d.nombre)))),
        destinos.some(d => d.tipo === 'ciclo' || d.tipo === 'paralelo') && h('small', null, 'En la lista también están los ciclos («Todo el 1ER CICLO…») y los paralelos («1ER CICLO · Paralelo A…»).'),
        h('strong', null, `Contenido: ${ids.length} áreas seleccionadas, con nombre y contorno${entrega.contenido && resumen ? `, y ${resumen}` : ''}`),
        ...[['unidad', 'Unidad responsable'], ['operacion', 'Operación asignada'], ['documentos', 'Todos los documentos adjuntos del ejercicio']].map(([k, texto]) => h('label', { key: k },
          h('input', { type: 'checkbox', checked: opciones[k], onChange: e => setOpciones({ ...opciones, [k]: e.target.checked }) }), ' ', texto)),
        h('label', null, 'Indicaciones para el destinatario', h('textarea', { style: s, value: opciones.indicaciones, maxLength: 4000, onChange: e => setOpciones({ ...opciones, indicaciones: e.target.value }) })),
        h('small', null, 'Formato: paquete editable SIDE-CEME. Se guarda en la bandeja del destino; se incorpora desde la aplicación. Solo incluye lo seleccionado.'),
        h('button', { style: s, type: 'button', disabled: ocupado || !ids.length || !destino || !nombre.trim(), onClick: enviar }, 'Guardar y enviar selección')),
      h('strong', null, `Recibidos (${envios.length})`),
      ...envios.map(e => {
        const aplicado = (ops.entregasAreas || []).some(x => x.id === e.id)
        return h('article', { key: e.id, style: { border: '1px solid #42516a', padding: 8, borderRadius: 6 } },
          h('strong', null, e.nombre), h('p', null, `De ${e.enviado_por} · ${e.paquete.ejercicioOrigen}`),
          h('p', null, (e.paquete.areas || []).map(a => a.nombre || 'Área').join(', ')),
          h('small', null, `${e.paquete.documentos?.length || 0} documentos · ${e.paquete.formato}`),
          e.paquete.contenido && h('p', null, `Lleva: ${resumenContenido(e.paquete.contenido)}`),
          e.paquete.indicaciones && h('p', null, e.paquete.indicaciones),
          h('button', { style: s, type: 'button', disabled: ocupado || aplicado, onClick: () => tarea(async comprobar => {
            const c = await nube.contexto(false); comprobar()
            const r = await api('areas_recibidos', c); comprobar()
            const vigente = r.envios.find(x => x.id === e.id)
            if (!vigente) throw new Error('El envío ya no está disponible para este ejercicio.')
            nube.recibir(vigente)
            onUnidades?.(prev => recibirUnidades(prev, vigente))
            if (vigente.paquete?.contenido?.cmoc) onCmoc?.(prev => recibirCmoc(prev, vigente))
            setMensaje('Contenido incorporado al ejercicio. Se conserva el trabajo previo; espere el indicador de guardado.')
          }) }, aplicado ? 'Ya incorporado' : 'Incorporar al ejercicio'))
      }),
      !envios.length && h('small', null, 'Todavía no hay envíos para este ejercicio o grupo.')),
    mensaje && h('p', { role: 'status', style: { color: '#a9d7ff' } }, mensaje))
}
