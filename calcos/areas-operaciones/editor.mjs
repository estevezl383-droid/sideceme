import { listarAreas, seleccionarArea, editarArea, paqueteAreas, importarAreas, recortarArea } from './modelo.mjs?v=lazo20261010'
import { contenidoDeAreas, resumenContenido, fichasDelPaquete, ESCALONES } from './recorte.mjs?v=lazo20261010'
import { iniciarLazo, carta2D } from './lazo.mjs?v=lazo20261010'
import Compartir from './compartir-editor.mjs?v=lazo20261010'

const nuevoId = () => `ao-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)}`

// unidades/onUnidades: las fichas de la carta (para entregarlas con el área).
// escalon: la magnitud elegida en el panel (la del área que se recorta).
// herramienta/onHerramienta: el lazo apaga la herramienta de dibujo y viceversa.
export default function Areas({ react: R, ops, onOps, ejercicio, onDeshacer, nube, unidades, onUnidades, escalon, herramienta, onHerramienta }) {
  const h = R.createElement, [seleccion, setSeleccion] = R.useState([]), [error, setError] = R.useState('')
  const [lazo, setLazo] = R.useState(false), [aviso, setAviso] = R.useState(''), [pendiente, setPendiente] = R.useState(null)
  const [entrega, setEntrega] = R.useState({ contenido: true, enemigo: true })
  const archivo = R.useRef(null), detener = R.useRef(null)
  const actual = R.useRef(ejercicio)
  actual.current = ejercicio
  const vigente = R.useRef({}); vigente.current = { ops, unidades, escalon }
  const apagarLazo = () => { detener.current?.(); detener.current = null; setLazo(false) }
  R.useEffect(() => { setSeleccion([]); setError(''); setAviso(''); setPendiente(null); apagarLazo() }, [ejercicio])
  R.useEffect(() => () => detener.current?.(), [])
  R.useEffect(() => { if (herramienta) apagarLazo() }, [herramienta])
  const lista = listarAreas(ops), activa = ops.areaOps?.id || 'ao-original'
  // El aviso del recorte sale cuando el área ya está en el ejercicio (si estaba bloqueado, no llega).
  R.useEffect(() => {
    if (pendiente && lista.some(a => a.id === pendiente.id)) {
      setSeleccion(s => s.includes(pendiente.id) ? s : [...s, pendiente.id]); setAviso(pendiente.texto); setPendiente(null)
    }
  }, [ops, pendiente])
  const cambiar = fn => { onDeshacer?.(); onOps(fn); setError('') }
  const estilo = { background: '#0e1320', color: '#e8edf5', border: '1px solid #34405a', borderRadius: 6, padding: 7, width: '100%', boxSizing: 'border-box', fontSize: 14 }
  const botones = { ...estilo, cursor: 'pointer', marginTop: 6 }
  const seleccionActual = seleccion.filter(id => lista.some(a => a.id === id))
  const fichas = Array.isArray(unidades) ? unidades : []
  const resumen = R.useMemo(() => {
    const elegidas = lista.filter(a => seleccionActual.includes(a.id))
    if (!entrega.contenido || !elegidas.length) return ''
    try { return resumenContenido(contenidoDeAreas(elegidas, ops, fichas, entrega)) } catch { return '' }
  }, [ops, unidades, seleccionActual.join('|'), entrega.contenido, entrega.enemigo])
  const alTerminar = sel => {
    detener.current = null; setLazo(false)
    const { ops: o, escalon: esc, unidades: u } = vigente.current
    const id = nuevoId(), opciones = { escalon: esc || '', id }
    try {
      const r = recortarArea(o, sel, opciones)
      const contenido = resumenContenido(contenidoDeAreas([r.area], r.ops, Array.isArray(u) ? u : [], entrega))
      const notas = [
        r.resultado.libre ? 'No había límites que dividieran el área: se cortó por el lazo.' : `Borde exacto de sus límites${r.resultado.piezas > 1 ? ` (${r.resultado.piezas} zonas unidas)` : ''}.`,
        r.resultado.separadas ? 'Encerró zonas que no se tocan: quedó la más grande.' : '',
        r.resultado.toda ? 'Encerró toda el área.' : '',
      ].filter(Boolean).join(' ')
      cambiar(prev => { try { return recortarArea(prev, sel, opciones).ops } catch { return prev } })
      setPendiente({ id, texto: `✂️ «${r.area.nombre}» creada${r.resultado.baseNombre ? ` dentro de «${r.resultado.baseNombre}»` : ''}. ${notas} Lleva: ${contenido}. Póngale nombre abajo y márquela para entregarla.` })
    } catch (e) { setError(e.message) }
  }
  const alternarLazo = () => {
    if (lazo) { apagarLazo(); return }
    setError(''); setAviso('')
    if (!lista.length) { setError('Primero trace el Área de Operaciones que va a repartir (▧ Trazar el Área).'); return }
    const mapa = carta2D()
    if (!mapa) { setError('El lazo funciona sobre la carta 2D: pase a 2D y vuelva a intentar.'); return }
    onHerramienta?.(null)
    detener.current = iniciarLazo(mapa, { alTerminar, alCancelar: () => { detener.current = null; setLazo(false) } })
    setLazo(true)
  }
  const descargar = () => {
    try {
      const p = paqueteAreas(ops, seleccionActual, ejercicio, entrega.contenido ? { unidades: fichas, enemigo: entrega.enemigo } : null)
      const nombre = p.areas.length === 1 ? `AO_${String(p.areas[0].nombre || 'area').replace(/[^\wÁÉÍÓÚÑáéíóúñ.-]+/g, '_')}.json` : 'areas_operaciones.json'
      const url = URL.createObjectURL(new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a'); a.href = url; a.download = nombre; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch (e) { setError(e.message) }
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
      h('button', { type: 'button', style: { ...botones, marginTop: 0, ...(lazo ? { background: '#0b7fa8', borderColor: '#5ce1ff' } : {}) }, 'aria-pressed': lazo, onClick: alternarLazo },
        lazo ? '✕ Cancelar el lazo' : '✂️ Seleccionar con lazo'),
      h('small', null, lazo
        ? 'Encierre a mano alzada (mouse, dedo o lápiz) la zona del escalón subordinado, sin precisión: el corte sigue sus límites. Un toque dentro de una zona la elige sola. Esc cancela.'
        : 'Se corta por los límites que ya trazó: el borde encaja con el área vecina. La magnitud del área nueva es la de «Magnitud que se va a colocar».'),
      aviso && h('p', { role: 'status', style: { margin: 0, color: '#a9ffcf' } }, aviso)),
    h('div', { role: 'group', 'aria-label': 'Qué se entrega con las áreas', style: { display: 'grid', gap: 4 } },
      h('strong', null, 'Qué se entrega con las áreas marcadas'),
      h('label', null, h('input', { type: 'checkbox', checked: entrega.contenido, onChange: e => setEntrega({ ...entrega, contenido: e.target.checked }) }),
        ' Todo lo que está dentro (límites, puntos, marcas, tareas, fichas…)'),
      entrega.contenido && h('label', null, h('input', { type: 'checkbox', checked: entrega.enemigo, onChange: e => setEntrega({ ...entrega, enemigo: e.target.checked }) }), ' También las fichas enemigas'),
      h('small', null, !seleccionActual.length ? 'Marque las áreas que va a entregar.' : entrega.contenido ? `Lleva: ${resumen || 'nada más que el contorno'}.` : 'Sólo el contorno de las áreas.')),
    h(Compartir, { react: R, nube, ids: seleccionActual, ops, ejercicio, entrega, resumen, onUnidades }),
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
        setAviso(`📥 ${p.areas.length} área(s) incorporada(s)${p.contenido ? `, con ${resumenContenido({ ops: p.contenido.ops, unidades: onUnidades ? llegan : [] })}` : ''}.`)
      } catch (e) { setError(e.message) }
    } }),
    error && h('div', { role: 'alert', style: { color: '#ff9d9d' } }, error))
}
