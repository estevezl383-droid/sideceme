import { recibirUnidades } from './compartir-modelo.mjs?v=lazo20261010'
import { resumenContenido } from './recorte.mjs?v=lazo20261010'

// entrega: { contenido, enemigo } elegido en el panel; resumen: lo que lleva, en palabras.
export default function Compartir({ react: R, nube, ids, ops, ejercicio, entrega = { contenido: false }, resumen = '', onUnidades }) {
  const h = R.createElement
  const [abierto, abrir] = R.useState(false), [destinos, setDestinos] = R.useState([]), [envios, setEnvios] = R.useState([])
  const [destino, setDestino] = R.useState(''), [nombre, setNombre] = R.useState(''), [mensaje, setMensaje] = R.useState('')
  const [ocupado, setOcupado] = R.useState(false)
  const [opciones, setOpciones] = R.useState({ unidad: true, operacion: true, documentos: false, indicaciones: '' })
  const actual = R.useRef(ejercicio); actual.current = ejercicio
  R.useEffect(() => { abrir(false); setDestinos([]); setEnvios([]); setDestino(''); setNombre(''); setMensaje(''); setOpciones({ unidad: true, operacion: true, documentos: false, indicaciones: '' }) }, [ejercicio])
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
  const enviar = () => tarea(async comprobar => {
    const d = destinos.find(x => x.clave === destino)
    if (!d || !nombre.trim() || !ids.length) throw new Error('Indique nombre, áreas y destinatario.')
    const c = await nube.contexto(true); comprobar()
    await api('areas_enviar', c, { nombre, areas: ids, opciones: { ...opciones, contenido: !!entrega.contenido, enemigo: entrega.enemigo !== false }, destino: d }); comprobar()
    setMensaje(`Enviado a ${d.nombre}. Lo encontrará en Recibidos dentro de SIDE-CEME.`)
  })
  return h('section', { 'aria-label': 'Compartir dentro de SIDE-CEME', style: { display: 'grid', gap: 7 } },
    h('button', { type: 'button', style: s, disabled: ocupado, onClick: cargar }, 'Compartir en la aplicación / Recibidos'),
    abierto && h(R.Fragment, null,
      destinos.length > 0 && h(R.Fragment, null,
        h('label', null, 'Nombre del envío', h('input', { style: s, value: nombre, maxLength: 160, placeholder: `${ejercicio} · Áreas asignadas`, onChange: e => setNombre(e.target.value) })),
        h('label', null, 'Ejercicio o grupo destinatario', h('select', { style: s, value: destino, onChange: e => setDestino(e.target.value) },
          h('option', { value: '' }, 'Seleccione el destino'), ...destinos.map(d => h('option', { key: d.clave, value: d.clave }, d.nombre)))),
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
            setMensaje('Contenido incorporado al ejercicio. Se conserva el trabajo previo; espere el indicador de guardado.')
          }) }, aplicado ? 'Ya incorporado' : 'Incorporar al ejercicio'))
      }),
      !envios.length && h('small', null, 'Todavía no hay envíos para este ejercicio o grupo.')),
    mensaje && h('p', { role: 'status', style: { color: '#a9d7ff' } }, mensaje))
}
