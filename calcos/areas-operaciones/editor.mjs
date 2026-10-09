import { listarAreas, seleccionarArea, editarArea, paqueteAreas, importarAreas } from './modelo.mjs'
import Compartir from './compartir-editor.mjs'

export default function Areas({ react: R, ops, onOps, ejercicio, onDeshacer, nube }) {
  const h = R.createElement, [seleccion, setSeleccion] = R.useState([]), [error, setError] = R.useState('')
  const archivo = R.useRef(null)
  const actual = R.useRef(ejercicio)
  actual.current = ejercicio
  R.useEffect(() => { setSeleccion([]); setError('') }, [ejercicio])
  const lista = listarAreas(ops), activa = ops.areaOps?.id || 'ao-original'
  const cambiar = fn => { onDeshacer?.(); onOps(fn); setError('') }
  const estilo = { background: '#0e1320', color: '#e8edf5', border: '1px solid #34405a', borderRadius: 6, padding: 7, width: '100%', boxSizing: 'border-box', fontSize: 14 }
  const botones = { ...estilo, cursor: 'pointer', marginTop: 6 }
  const seleccionActual = seleccion.filter(id => lista.some(a => a.id === id))
  const descargar = () => {
    try {
      const p = paqueteAreas(ops, seleccionActual, ejercicio)
      const url = URL.createObjectURL(new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a'); a.href = url; a.download = 'areas_operaciones.json'; a.click()
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
          h('input', { style: estilo, value: a[k] || '', maxLength: 160, onChange: e => cambiar(prev => editarArea(prev, a.id, { [k]: e.target.value })) })))))),
    h('small', null, 'Seleccione un área para editarla. Las otras permanecen en la carta.'),
    h(Compartir, { react: R, nube, ids: seleccionActual, ops, ejercicio }),
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
      } catch (e) { setError(e.message) }
    } }),
    error && h('div', { role: 'alert', style: { color: '#ff9d9d' } }, error))
}
